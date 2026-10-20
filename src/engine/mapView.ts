// createMapView : assemble caméra, gestes, tuiles, overlays et animations sur un canevas.
// Voir README.md (pipeline, règles de niveau, ordonnanceur) et src/types.ts (contrat MapView).

import type { CameraState, MapView, MapViewOptions, Overlay, Rect, Vec2 } from '../types';
import { MAX_DPR, MAX_ZOOM } from '../config';
import { PAPER, lodForZoom } from '../art';
import {
  anchorCamera,
  clamp,
  clampCamera,
  computeMinZoom,
  fitRectCamera,
  panBy,
  sameCamera,
  screenToWorld,
  worldToScreen,
  zoomAround,
  type ScreenInsets,
  type Viewport,
  type WorldSize,
} from './camera';
import {
  BACKDROP,
  DOUBLE_TAP_ZOOM_MS,
  INSETS_GLIDE_MS,
  REVEAL_PULSE_MS,
  DRAG_ZOOM_PX_PER_DOUBLING,
  FRAME_BUDGET_BUSY_MS,
  FRAME_BUDGET_MS,
  KEY_PAN_SPEED,
  KEY_ZOOM_MS,
  MAP_SHADOW,
  SLOW_FRAME_MS,
  TRACKPAD_PINCH_SPEED,
  WHEEL_SMOOTH_MS,
  WHEEL_ZOOM_SPEED,
} from './constants';
import { easeOutCubic, planFlight, type FlightPlan } from './flight';
import { GestureRecognizer } from './gestures';
import { inertiaStep, isMoving } from './inertia';
import { drawOverlays, hasAnimatedOverlay, type OverlayView } from './overlays';
import { drawErrorCount, renderWorldRect } from './render';
import { TileManager } from './tileManager';
import {
  MAX_LEVEL,
  ancestorAt,
  childTiles,
  deviceRect,
  levelForZoom,
  subRectInAncestor,
  tileKey,
  tileRect,
  visibleTiles,
  type TileCoord,
} from './tiles';

/** Statistiques de débogage (HUD de dev/map.html, scripts de performance). */
export interface MapDebugStats {
  /** Tuiles en cache (dont épinglées). */
  tilesCached: number;
  tilesPinned: number;
  cacheCapacity: number;
  /** Tuiles rendues depuis la création. */
  tilesRendered: number;
  /** Rendus abandonnés (tuile devenue inutile en cours de rendu). */
  tilesAborted: number;
  /** Tuiles visibles au niveau voulu pas encore prêtes. */
  tilesPending: number;
  /** Durée moyenne de rendu d'une tuile (ms, cumul des tranches). */
  avgTileMs: number;
  maxTileMs: number;
  lastTileMs: number;
  /** Part moyenne de la finalisation (rastérisation différée) dans le rendu d'une tuile (ms). */
  avgTileFlushMs: number;
  /** Tuile en cours de rendu (clé « L/i/j »). */
  job: string | null;
  /** Niveau affiché, niveau minimal (ville entière) et niveau racine (repli). */
  level: number;
  minLevel: number;
  rootLevel: number;
  /** Images par seconde (sur la dernière seconde d'activité). */
  fps: number;
  /** Images dessinées depuis la création. */
  frames: number;
  /** Durée de calcul de la dernière image (ms), dont rendu de tuiles et composition. */
  lastFrameMs: number;
  lastWorkMs: number;
  lastDrawMs: number;
  dpr: number;
  tilePx: number;
  offscreen: boolean;
  drawErrors: number;
  idle: boolean;
}

/** MapView du moteur : contrat de src/types.ts + outils de débogage. */
export interface EngineMapView extends MapView {
  /** Statistiques de débogage (tuiles, images/s…). */
  debugStats(): MapDebugStats;
  /** Oublie toutes les tuiles (ex. le monde a été modifié) ; elles sont refaites progressivement. */
  invalidateTiles(): void;
  /**
   * Marges masquées par l'interface (barre haute, feuille du bas ou latérale) : les bornes de la caméra
   * se comptent alors dans la zone libre, de sorte que tout bord de la ville puisse être amené hors des
   * barres. Marges toutes nulles = écran entier (comportement par défaut). Si la caméra se retrouve hors
   * des nouvelles bornes, elle y glisse doucement. Propre au moteur : pas dans le contrat `MapView`.
   */
  setInsets(insets: ScreenInsets): void;
}

interface Flight {
  plan: FlightPlan;
  start: number | null;
  resolve: () => void;
}

/** Mêmes marges (à 0,5 px près : les rectangles mesurés dans la page ont des décimales) ? */
function sameInsets(a: ScreenInsets | undefined, b: ScreenInsets | undefined): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.bottom - b.bottom) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.right - b.right) < 0.5
  );
}

const NO_INSETS: ScreenInsets = { top: 0, bottom: 0, left: 0, right: 0 };

/** Marges intermédiaires entre `a` et `b` (k ∈ [0, 1]) ; `b` absent = aucune marge. */
function lerpInsets(a: ScreenInsets, b: ScreenInsets | undefined, k: number): ScreenInsets {
  const t = b ?? NO_INSETS;
  return {
    top: a.top + (t.top - a.top) * k,
    bottom: a.bottom + (t.bottom - a.bottom) * k,
    left: a.left + (t.left - a.left) * k,
    right: a.right + (t.right - a.right) * k,
  };
}

function currentDpr(): number {
  const d = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
  return Math.max(1, Math.min(MAX_DPR, d));
}

export function createMapView(opts: MapViewOptions): EngineMapView {
  const { canvas, world } = opts;
  const ws: WorldSize = { width: world.width, height: world.height };
  const ctxOrNull = canvas.getContext('2d', { alpha: false });
  if (!ctxOrNull) throw new Error('createMapView : contexte 2D indisponible sur ce canevas');
  const ctx: CanvasRenderingContext2D = ctxOrNull;

  let dpr = currentDpr();
  let vp: Viewport = { width: 0, height: 0 };
  let minZoom = computeMinZoom(vp, ws);
  const init = opts.initial ?? {};
  let camera: CameraState = {
    x: init.x ?? ws.width / 2,
    y: init.y ?? ws.height / 2,
    zoom: init.zoom ?? minZoom,
  };
  /** Sans zoom initial : « ville entière » dès que la taille réelle est connue. */
  let fitOnFirstSize = init.zoom === undefined;
  let overlays: Overlay[] = [];
  /** Instant du dernier setOverlays (la pulsation des overlays « reveal » dure REVEAL_PULSE_MS). */
  let overlaysSince = 0;
  let reducedMotion = false;
  /** Marges masquées par l'interface appliquées à l'image courante (undefined = écran entier libre) : voir setInsets. */
  let safe: ScreenInsets | undefined;
  /** Marges demandées : celles que `safe` atteint à la fin du glissement (sans lui, les mêmes). */
  let safeGoal: ScreenInsets | undefined;
  /** Glissement des bornes de la caméra vers `safeGoal` (marge de départ ; `start` fixé à la première image). */
  let insetsAnim: { from: ScreenInsets; start: number | null } | null = null;
  let destroyed = false;
  /** Faux pendant createMapView : aucun rappel (onCameraChange…) n'est émis avant le retour. */
  let constructed = false;

  const tiles = new TileManager(world, dpr);

  // Mouvements en cours.
  let flight: Flight | null = null;
  let inertiaV: Vec2 | null = null;
  let wheel: { target: number; anchor: Vec2 } | null = null;
  let pinch: { anchor: Vec2; d0: number; z0: number } | null = null;
  let dragZoom: { anchorWorld: Vec2; anchor: Vec2; z0: number } | null = null;

  // Boucle d'images.
  let rafId = 0;
  let lastFrameT = 0;
  let cameraDirty = true;
  let idleWaiters: (() => void)[] = [];
  let level = 0;
  let pendingVisible = 0;
  let idle = false;
  const frameTimes: number[] = [];
  let frames = 0;
  let lastFrameMs = 0;
  let lastWorkMs = 0;
  let skippedWork = false;
  let lastDrawMs = 0;
  let fps = 0;

  /* --------------------------------------------------------------------------
   * Caméra
   * ----------------------------------------------------------------------- */

  function applyCamera(c: CameraState): void {
    const next = clampCamera(c, vp, ws, minZoom, MAX_ZOOM, undefined, safe);
    if (!sameCamera(next, camera)) {
      camera = next;
      cameraDirty = true;
    }
  }

  function moving(): boolean {
    return flight !== null || inertiaV !== null || wheel !== null;
  }

  /** Arrête animation, inertie et molette. Renvoie vrai si quelque chose bougeait. */
  function stopMotion(): boolean {
    const was = moving();
    if (flight) {
      const f = flight;
      flight = null;
      f.resolve();
    }
    inertiaV = null;
    wheel = null;
    return was;
  }

  function startFlight(to: CameraState, duration?: number, ease?: (t: number) => number): Promise<void> {
    stopMotion();
    const target = clampCamera(to, vp, ws, minZoom, MAX_ZOOM, undefined, safeGoal);
    if (reducedMotion || duration === 0 || vp.width <= 0 || vp.height <= 0 || sameCamera(target, camera)) {
      applyCamera(target);
      requestFrame();
      return Promise.resolve();
    }
    const plan = planFlight(camera, target, vp, { minZoom, duration, ease });
    return new Promise<void>((resolve) => {
      flight = { plan, start: null, resolve };
      requestFrame();
    });
  }

  /** Zoom de référence pour les zooms successifs (cible de l'animation en cours). */
  function baseZoom(): number {
    if (flight) return flight.plan.to.zoom;
    if (wheel) return wheel.target;
    return camera.zoom;
  }

  /** Zoom animé ancré sur un point écran (double-tap, touches + et −). */
  function zoomAnimatedAt(p: Vec2, zoom: number, ms: number): void {
    const z = clamp(zoom, minZoom, MAX_ZOOM);
    const ref = flight ? flight.plan.to : camera;
    const anchorWorld = screenToWorld(ref, vp, p);
    void startFlight(anchorCamera(anchorWorld, p, vp, z), ms, easeOutCubic);
  }

  function stepMotion(now: number, dt: number): void {
    if (insetsAnim) {
      // Les bornes glissent vers les nouvelles marges ; la caméra qui en sort est repoussée avec elles.
      if (insetsAnim.start === null) insetsAnim.start = now;
      const t = (now - insetsAnim.start) / INSETS_GLIDE_MS;
      if (t >= 1) {
        safe = safeGoal;
        insetsAnim = null;
      } else {
        safe = lerpInsets(insetsAnim.from, safeGoal, easeOutCubic(t));
      }
      applyCamera(camera);
    }
    if (flight) {
      if (flight.start === null) flight.start = now;
      const t = flight.plan.duration > 0 ? (now - flight.start) / flight.plan.duration : 1;
      applyCamera(flight.plan.at(Math.min(1, t)));
      if (t >= 1) {
        const f = flight;
        flight = null;
        f.resolve();
      }
    }
    if (inertiaV) {
      const s = inertiaStep(inertiaV, dt);
      const wanted = panBy(camera, s.dx, s.dy);
      applyCamera(wanted);
      // En butée, la composante bloquée s'annule.
      if (Math.abs(camera.x - wanted.x) > 1e-6) s.v.x = 0;
      if (Math.abs(camera.y - wanted.y) > 1e-6) s.v.y = 0;
      inertiaV = isMoving(s.v) ? s.v : null;
    }
    if (wheel) {
      const k = 1 - Math.exp(-dt / WHEEL_SMOOTH_MS);
      const lz = Math.log(camera.zoom);
      const lt = Math.log(wheel.target);
      let z = Math.exp(lz + (lt - lz) * k);
      const done = Math.abs(lt - Math.log(z)) < 0.002;
      if (done) z = wheel.target;
      const before = camera.zoom;
      applyCamera(zoomAround(camera, vp, wheel.anchor, z));
      if (done || camera.zoom === before) wheel = null;
    }
  }

  /* --------------------------------------------------------------------------
   * Boucle d'images
   * ----------------------------------------------------------------------- */

  function requestFrame(): void {
    if (!rafId && !destroyed) rafId = requestAnimationFrame(frame);
  }

  function renderNow(): void {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    frame(performance.now());
  }

  function buildPlan(lvl: number, visible: TileCoord[], calm: boolean): { plan: TileCoord[]; missingVisible: number } {
    const plan: TileCoord[] = [];
    for (const t of tiles.rootTiles) if (!tiles.has(t)) plan.push(t);
    // Pendant un vol, la destination passe avant la vue courante (qui défile vite et se contente
    // des ancêtres) : l'arrivée est nette et on ne gaspille pas de rendu sur des niveaux transitoires.
    if (flight) {
      const to = flight.plan.to;
      for (const t of visibleTiles(to, vp, levelForZoom(to.zoom, tiles.rootLevel, MAX_LEVEL), ws)) {
        if (!tiles.has(t)) plan.push(t);
      }
    }
    let missingVisible = 0;
    for (const t of visible) {
      if (!tiles.has(t)) {
        plan.push(t);
        missingVisible++;
      }
    }
    if (calm && plan.length === 0) {
      // Préchargement : niveau parent, puis anneau voisin. L'ensemble à conserver (racine +
      // visible + préchargement) ne dépasse jamais la capacité du cache — sinon le préchargement
      // évincerait ses propres tuiles et tournerait sans fin — et ses tuiles déjà prêtes sont
      // « touchées » pour que l'éviction frappe d'abord les tuiles d'anciennes vues.
      const room = tiles.cache.capacity - tiles.rootTiles.length - visible.length - 2;
      const extra: TileCoord[] = [];
      if (lvl - 1 > tiles.rootLevel) extra.push(...visibleTiles(camera, vp, lvl - 1, ws));
      const seen = new Set(visible.map(tileKey));
      for (const t of visibleTiles(camera, vp, lvl, ws, 1)) if (!seen.has(tileKey(t))) extra.push(t);
      for (let k = 0; k < extra.length && k < room; k++) {
        if (tiles.has(extra[k])) tiles.touch(extra[k]);
        else plan.push(extra[k]);
      }
    }
    return { plan, missingVisible };
  }

  function frame(now: number): void {
    rafId = 0;
    if (destroyed) return;
    const t0 = performance.now();
    const dt = lastFrameT ? Math.min(100, Math.max(0, now - lastFrameT)) : 16;
    lastFrameT = now;
    stepMotion(now, dt);

    level = levelForZoom(camera.zoom, tiles.rootLevel, MAX_LEVEL);
    const visible = vp.width > 0 && vp.height > 0 ? visibleTiles(camera, vp, level, ws) : [];
    const interacting = moving() || gestures.activePointers > 0;
    const { plan } = buildPlan(level, visible, !interacting);
    const tw = performance.now();
    // Appareil lent : pendant un geste ou une animation, si l'image précédente a manqué la
    // cadence, on saute le rendu de tuiles une image sur deux (le geste reste fluide, les
    // ancêtres assurent l'affichage). Sans effet sur un appareil rapide.
    const late = interacting && dt > SLOW_FRAME_MS && !skippedWork;
    skippedWork = late;
    if (!late) tiles.work(plan, t0 + (interacting ? FRAME_BUDGET_BUSY_MS : FRAME_BUDGET_MS));
    const td = performance.now();
    lastWorkMs = td - tw;

    draw(visible);
    lastDrawMs = performance.now() - td;

    if (cameraDirty) {
      cameraDirty = false;
      opts.onCameraChange?.({ ...camera });
    }

    // Reste-t-il du travail ?
    const after = buildPlan(level, visible, !interacting && !moving());
    pendingVisible = after.missingVisible;
    const animated = hasAnimatedOverlay(overlays, reducedMotion) && performance.now() - overlaysSince < REVEAL_PULSE_MS;
    idle = !moving() && insetsAnim === null && pendingVisible === 0;
    const more = moving() || insetsAnim !== null || animated || after.plan.length > 0;

    frames++;
    lastFrameMs = performance.now() - t0;
    frameTimes.push(now);
    while (frameTimes.length > 0 && now - frameTimes[0] > 1000) frameTimes.shift();
    if (frameTimes.length > 1) fps = ((frameTimes.length - 1) * 1000) / Math.max(1, now - frameTimes[0]);

    if (idle && idleWaiters.length) {
      const w = idleWaiters;
      idleWaiters = [];
      for (const r of w) r();
    }
    if (more || cameraDirty) requestFrame();
    else lastFrameT = 0; // la boucle s'arrête : la prochaine image repartira d'un pas nominal
  }

  /* --------------------------------------------------------------------------
   * Dessin
   * ----------------------------------------------------------------------- */

  const overlayView: OverlayView = {
    toScreen: (p) => worldToScreen(camera, vp, p),
    zoom: 1,
    width: 0,
    height: 0,
  };

  function rootReady(): boolean {
    for (const t of tiles.rootTiles) if (!tiles.has(t)) return false;
    return true;
  }

  function drawTileImage(img: CanvasImageSource, t: TileCoord): void {
    const d = deviceRect(tileRect(t), camera, vp, dpr);
    if (d.w > 0 && d.h > 0) ctx.drawImage(img, d.x, d.y, d.w, d.h);
  }

  function drawDescendants(t: TileCoord, depth: number): void {
    if (t.level >= MAX_LEVEL) return;
    for (const c of childTiles(t, ws)) {
      const img = tiles.get(c);
      if (img) drawTileImage(img, c);
      else if (depth > 1) drawDescendants(c, depth - 1);
    }
  }

  function drawTile(t: TileCoord): void {
    const img = tiles.get(t);
    if (img) {
      drawTileImage(img, t);
      return;
    }
    // Repli : meilleure ancêtre disponible (agrandie), puis les descendants prêts par-dessus.
    const kids = t.level < MAX_LEVEL ? childTiles(t, ws) : [];
    const covered = kids.length > 0 && kids.every((k) => tiles.has(k));
    if (!covered) {
      for (let l = t.level - 1; l >= tiles.rootLevel; l--) {
        const a = ancestorAt(t, l);
        const aimg = tiles.get(a);
        if (aimg) {
          const s = subRectInAncestor(t, a, tiles.tilePx);
          const d = deviceRect(tileRect(t), camera, vp, dpr);
          if (d.w > 0 && d.h > 0) ctx.drawImage(aimg, s.sx, s.sy, s.sw, s.sw, d.x, d.y, d.w, d.h);
          break;
        }
      }
    }
    drawDescendants(t, 2);
  }

  function draw(visible: TileCoord[]): void {
    const W = canvas.width;
    const H = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    if (vp.width <= 0 || vp.height <= 0) {
      ctx.fillStyle = BACKDROP;
      ctx.fillRect(0, 0, W, H);
      return;
    }
    // Économie de remplissages (coûteux sans GPU) : la table et l'ombre ne sont peintes que si
    // la ville ne couvre pas tout l'écran ; le papier, que tant que le niveau racine n'est pas
    // complet (ensuite chaque tuile visible a au moins une ancêtre prête).
    const wr = deviceRect({ x: 0, y: 0, w: ws.width, h: ws.height }, camera, vp, dpr);
    const covers = wr.x <= 0 && wr.y <= 0 && wr.x + wr.w >= W && wr.y + wr.h >= H;
    if (!covers) {
      ctx.fillStyle = BACKDROP;
      ctx.fillRect(0, 0, W, H);
      const sh = Math.max(2, Math.round(4 * dpr));
      ctx.fillStyle = MAP_SHADOW;
      ctx.fillRect(wr.x + sh * 0.75, wr.y + sh, wr.w, wr.h);
    }
    if (!rootReady()) {
      ctx.fillStyle = PAPER;
      ctx.fillRect(wr.x, wr.y, wr.w, wr.h);
    }
    if (!covers) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(wr.x, wr.y, wr.w, wr.h);
      ctx.clip();
    }
    for (const t of visible) drawTile(t);
    if (!covers) ctx.restore();
    if (overlays.length) {
      ctx.setTransform(W / vp.width, 0, 0, H / vp.height, 0, 0);
      overlayView.zoom = camera.zoom;
      overlayView.width = vp.width;
      overlayView.height = vp.height;
      // Passé REVEAL_PULSE_MS, l'onde est figée (même phase à chaque image) : plus de redessin continu.
      drawOverlays(ctx, overlays, overlayView, Math.min(performance.now(), overlaysSince + REVEAL_PULSE_MS), reducedMotion);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  /* --------------------------------------------------------------------------
   * Taille
   * ----------------------------------------------------------------------- */

  function resize(): void {
    if (destroyed) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const d = currentDpr();
    const bw = Math.max(1, Math.round(w * d));
    const bh = Math.max(1, Math.round(h * d));
    if (w === vp.width && h === vp.height && d === dpr && canvas.width === bw && canvas.height === bh) return;
    const wasAtMin = vp.width > 0 && Math.abs(camera.zoom - minZoom) < 1e-9;
    vp = { width: w, height: h };
    if (d !== dpr) {
      dpr = d;
      tiles.setDpr(d);
    }
    canvas.width = bw;
    canvas.height = bh;
    minZoom = computeMinZoom(vp, ws);
    tiles.configure(minZoom, vp);
    if (w > 0 && h > 0 && fitOnFirstSize) {
      fitOnFirstSize = false;
      camera = { ...camera, zoom: minZoom };
    } else if (wasAtMin) {
      camera = { ...camera, zoom: minZoom };
    }
    camera = clampCamera(camera, vp, ws, minZoom, MAX_ZOOM, undefined, safe);
    cameraDirty = true;
    // Redessin immédiat : changer la taille du canevas l'efface (sauf pendant la construction,
    // pour ne pas appeler onCameraChange avant que createMapView ait rendu la main).
    if (constructed) renderNow();
    else requestFrame();
  }

  /* --------------------------------------------------------------------------
   * Gestes
   * ----------------------------------------------------------------------- */

  const gestures = new GestureRecognizer({
    panStart() {
      stopMotion();
    },
    pan(dx, dy) {
      applyCamera(panBy(camera, dx, dy));
      requestFrame();
    },
    panEnd(v) {
      if (isMoving(v)) {
        inertiaV = v;
        requestFrame();
      }
    },
    pinchStart(mid, d) {
      stopMotion();
      pinch = { anchor: screenToWorld(camera, vp, mid), d0: d, z0: camera.zoom };
    },
    pinch(mid, d) {
      if (!pinch) return;
      const z = clamp((pinch.z0 * d) / pinch.d0, minZoom, MAX_ZOOM);
      applyCamera(anchorCamera(pinch.anchor, mid, vp, z));
      requestFrame();
    },
    pinchEnd() {
      pinch = null;
      requestFrame();
    },
    tap(p) {
      opts.onTap?.(screenToWorld(camera, vp, p), { x: p.x, y: p.y });
    },
    doubleTap(p) {
      zoomAnimatedAt(p, baseZoom() * 2, DOUBLE_TAP_ZOOM_MS);
    },
    twoFingerTap(mid) {
      zoomAnimatedAt(mid, baseZoom() / 2, DOUBLE_TAP_ZOOM_MS);
    },
    dragZoomStart(anchor) {
      stopMotion();
      dragZoom = { anchorWorld: screenToWorld(camera, vp, anchor), anchor, z0: camera.zoom };
    },
    dragZoom(dy) {
      if (!dragZoom) return;
      const z = clamp(dragZoom.z0 * 2 ** (dy / DRAG_ZOOM_PX_PER_DOUBLING), minZoom, MAX_ZOOM);
      applyCamera(anchorCamera(dragZoom.anchorWorld, dragZoom.anchor, vp, z));
      requestFrame();
    },
    dragZoomEnd() {
      dragZoom = null;
      requestFrame();
    },
  });

  // Position du canevas dans la fenêtre : relue à chaque appui (et molette), réutilisée pendant
  // le geste — getBoundingClientRect à chaque mouvement forcerait des recalculs de mise en page.
  let origin = { left: 0, top: 0 };
  function refreshOrigin(): void {
    const r = canvas.getBoundingClientRect();
    origin = { left: r.left, top: r.top };
  }
  function local(e: { clientX: number; clientY: number }): Vec2 {
    return { x: e.clientX - origin.left, y: e.clientY - origin.top };
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    if (e.pointerType === 'mouse' && document.activeElement !== canvas) canvas.focus({ preventScroll: true });
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // pointeur déjà relâché
    }
    const interrupted = stopMotion();
    if (gestures.activePointers === 0) refreshOrigin();
    const p = local(e);
    gestures.down(e.pointerId, p.x, p.y, performance.now(), interrupted);
    requestFrame();
  }

  function onPointerMove(e: PointerEvent): void {
    const p = local(e);
    gestures.move(e.pointerId, p.x, p.y, performance.now());
  }

  function onPointerUp(e: PointerEvent): void {
    const p = local(e);
    gestures.up(e.pointerId, p.x, p.y, performance.now());
    requestFrame();
  }

  function onPointerCancel(e: PointerEvent): void {
    gestures.cancel(e.pointerId);
    requestFrame();
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (vp.width <= 0) return;
    refreshOrigin();
    const p = local(e);
    let dx = e.deltaX;
    let dy = e.deltaY;
    if (e.deltaMode === 1) {
      dx *= 16;
      dy *= 16;
    } else if (e.deltaMode === 2) {
      dx *= vp.width;
      dy *= vp.height;
    }
    if (e.ctrlKey) {
      // Pincement du pavé tactile : immédiat, ancré au curseur.
      const target = flight || wheel ? baseZoom() : camera.zoom;
      stopMotion();
      const z = clamp(target * Math.exp(-dy * TRACKPAD_PINCH_SPEED), minZoom, MAX_ZOOM);
      applyCamera(zoomAround(camera, vp, p, z));
    } else if (Math.abs(dx) > Math.abs(dy)) {
      // Défilement horizontal (pavé tactile) : déplacement.
      stopMotion();
      applyCamera(panBy(camera, -dx, -dy));
    } else {
      // Molette : zoom lissé vers une cible, ancré au curseur.
      const base = baseZoom();
      if (flight) {
        const f = flight;
        flight = null;
        f.resolve();
      }
      inertiaV = null;
      wheel = { target: clamp(base * Math.exp(-dy * WHEEL_ZOOM_SPEED), minZoom, MAX_ZOOM), anchor: p };
    }
    requestFrame();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || vp.width <= 0) return;
    const ae = document.activeElement;
    if (ae && ae !== canvas && ae !== document.body && ae !== document.documentElement) return;
    const center = { x: vp.width / 2, y: vp.height / 2 };
    const pan = (vx: number, vy: number): void => {
      if (flight) stopMotion();
      wheel = null;
      inertiaV = { x: vx, y: vy };
      requestFrame();
    };
    switch (e.key) {
      case 'ArrowLeft':
        pan(KEY_PAN_SPEED, 0);
        break;
      case 'ArrowRight':
        pan(-KEY_PAN_SPEED, 0);
        break;
      case 'ArrowUp':
        pan(0, KEY_PAN_SPEED);
        break;
      case 'ArrowDown':
        pan(0, -KEY_PAN_SPEED);
        break;
      case '+':
      case '=':
        zoomAnimatedAt(center, baseZoom() * 2, KEY_ZOOM_MS);
        break;
      case '-':
      case '_':
        zoomAnimatedAt(center, baseZoom() / 2, KEY_ZOOM_MS);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  const preventDefault = (e: Event): void => e.preventDefault();

  /* --------------------------------------------------------------------------
   * Installation
   * ----------------------------------------------------------------------- */

  const style = canvas.style;
  style.display = 'block';
  style.width = '100%';
  style.height = '100%';
  style.touchAction = 'none';
  style.userSelect = 'none';
  style.setProperty('-webkit-user-select', 'none');
  style.setProperty('-webkit-touch-callout', 'none');
  style.setProperty('-webkit-tap-highlight-color', 'transparent');
  style.outline = 'none';
  if (canvas.tabIndex < 0) canvas.tabIndex = 0;

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('lostpointercapture', onPointerCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', preventDefault);
  canvas.addEventListener('gesturestart', preventDefault);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', resize);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  ro?.observe(canvas);

  resize();
  requestFrame();
  constructed = true;

  /* --------------------------------------------------------------------------
   * API
   * ----------------------------------------------------------------------- */

  const view: EngineMapView = {
    world,
    getCamera: () => ({ ...camera }),
    setCamera(c: Partial<CameraState>): void {
      if (destroyed) return;
      stopMotion();
      if (c.zoom !== undefined) fitOnFirstSize = false;
      applyCamera({ ...camera, ...c });
      requestFrame();
    },
    flyTo(target: Partial<CameraState>, o?: { duration?: number }): Promise<void> {
      if (destroyed) return Promise.resolve();
      if (target.zoom !== undefined) fitOnFirstSize = false;
      return startFlight({ ...camera, ...target }, o?.duration);
    },
    fitRect(rect: Rect, o?: { padding?: number; maxZoom?: number; animate?: boolean }): Promise<void> {
      if (destroyed) return Promise.resolve();
      fitOnFirstSize = false;
      const cam = fitRectCamera(rect, vp, o?.padding ?? 32, minZoom, Math.min(MAX_ZOOM, o?.maxZoom ?? MAX_ZOOM));
      if (o?.animate === false) {
        view.setCamera(cam);
        return Promise.resolve();
      }
      return startFlight(cam);
    },
    screenToWorld: (p: Vec2) => screenToWorld(camera, vp, p),
    worldToScreen: (p: Vec2) => worldToScreen(camera, vp, p),
    setOverlays(list: Overlay[]): void {
      overlays = list.slice();
      overlaysSince = performance.now();
      requestFrame();
    },
    renderSnapshot(target: HTMLCanvasElement, rect: Rect): void {
      const tw = target.width;
      const th = target.height;
      if (!tw || !th || rect.w <= 0 || rect.h <= 0) return;
      const tctx = target.getContext('2d');
      if (!tctx) return;
      // Le rectangle est élargi au format du canevas (entièrement visible, centré).
      const ar = tw / th;
      const r = { ...rect };
      if (r.w / r.h > ar) {
        const nh = r.w / ar;
        r.y -= (nh - r.h) / 2;
        r.h = nh;
      } else {
        const nw = r.h * ar;
        r.x -= (nw - r.w) / 2;
        r.w = nw;
      }
      const cssWidth = target.clientWidth > 0 ? target.clientWidth : tw / dpr;
      renderWorldRect(tctx, world, r, tw, th, lodForZoom(cssWidth / r.w));
    },
    setInsets(i: ScreenInsets): void {
      if (destroyed) return;
      const next = i.top > 0 || i.bottom > 0 || i.left > 0 || i.right > 0 ? { top: i.top, bottom: i.bottom, left: i.left, right: i.right } : undefined;
      if (sameInsets(safeGoal, next)) return;
      const from = safe ?? NO_INSETS;
      safeGoal = next;
      insetsAnim = null;
      // La caméra reste dans les nouvelles bornes : rien à faire glisser, elles s'appliquent tout de suite.
      const stays = sameCamera(clampCamera(camera, vp, ws, minZoom, MAX_ZOOM, undefined, next), camera);
      if (stays || reducedMotion || vp.width <= 0 || vp.height <= 0) {
        safe = next;
        applyCamera(camera);
      } else {
        // Sinon (ex. la fiche d'indice se replie : la butée recule), les bornes glissent en INSETS_GLIDE_MS et
        // la caméra suit sans saut ; aucune animation de caméra, donc aucun conflit avec un geste en cours.
        insetsAnim = { from: { ...from }, start: null };
      }
      requestFrame();
    },
    getMinZoom: () => minZoom,
    getMaxZoom: () => MAX_ZOOM,
    setReducedMotion(on: boolean): void {
      reducedMotion = on;
      if (on && flight) {
        const f = flight;
        flight = null;
        applyCamera(f.plan.to);
        f.resolve();
      }
      requestFrame();
    },
    whenIdle(): Promise<void> {
      if (destroyed) return Promise.resolve();
      return new Promise<void>((resolve) => {
        idleWaiters.push(resolve);
        requestFrame();
      });
    },
    resize,
    destroy(): void {
      if (destroyed) return;
      stopMotion();
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      gestures.reset();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('lostpointercapture', onPointerCancel);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', preventDefault);
      canvas.removeEventListener('gesturestart', preventDefault);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', resize);
      ro?.disconnect();
      tiles.destroy();
      const w = idleWaiters;
      idleWaiters = [];
      for (const r of w) r();
    },
    debugStats(): MapDebugStats {
      const s = tiles.stats;
      return {
        tilesCached: tiles.cache.size,
        tilesPinned: tiles.cache.pinnedCount,
        cacheCapacity: tiles.cache.capacity,
        tilesRendered: s.rendered,
        tilesAborted: s.aborted,
        tilesPending: pendingVisible,
        avgTileMs: s.rendered ? s.totalMs / s.rendered : 0,
        maxTileMs: s.maxMs,
        lastTileMs: s.lastMs,
        avgTileFlushMs: s.rendered ? s.flushMs / s.rendered : 0,
        job: tiles.jobKey,
        level,
        minLevel: tiles.minLevel,
        rootLevel: tiles.rootLevel,
        fps,
        frames,
        lastFrameMs,
        lastWorkMs,
        lastDrawMs,
        dpr,
        tilePx: tiles.tilePx,
        offscreen: tiles.offscreen,
        drawErrors: drawErrorCount(),
        idle,
      };
    },
    invalidateTiles(): void {
      tiles.invalidate();
      requestFrame();
    },
  };
  return view;
}
