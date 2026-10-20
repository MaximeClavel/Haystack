// Page de développement : carte brute de Meulebourg servie par le moteur (dev/map.html).
//
// Paramètres d'URL :
//   x=&y=&zoom=     caméra initiale (défaut : ville entière)
//   grid=1          grille de coordonnées monde étiquetée (pas automatique) ; grid=<pas> : pas fixe
//   ids=1           affiche l'id des entités visibles quand zoom ≥ 2 (outil des scénaristes)
//   demo=1          place un exemplaire de chaque overlay autour du centre (contrôle visuel)
//   hud=0           masque le HUD ; cases=0 : monde sans les enquêtes
//   reduced=1       mouvement réduit (animations instantanées)
//
// Un tap affiche dans le HUD le point monde et l'id de l'entité la plus en avant sous le doigt
// (et l'encadre). window.__haystack = { world, map } ; window.__haystackReady après whenIdle().

import type { Entity, Overlay, Vec2, World } from '../types';
import { MAX_DPR, PICK_TOLERANCE_PX } from '../config';
import { buildWorld } from '../world';
import { CASES } from '../content';
import { getHitRect } from '../art/bounds';
import { createMapView, type EngineMapView } from '../engine';

const params = new URLSearchParams(location.search);
const num = (k: string): number | undefined => {
  const v = params.get(k);
  return v === null || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v);
};
const flag = (k: string): boolean => params.has(k) && params.get(k) !== '0';

const win = window as unknown as Record<string, unknown>;
const hud = document.getElementById('hud') as HTMLDivElement;
const devCanvas = document.getElementById('dev') as HTMLCanvasElement;
const devCtx = devCanvas.getContext('2d') as CanvasRenderingContext2D;

const showGrid = flag('grid');
const gridStep = num('grid') !== undefined && (num('grid') as number) > 1 ? (num('grid') as number) : 0;
const showIds = flag('ids');
const showHud = params.get('hud') !== '0';
if (!showHud) hud.style.display = 'none';

const t0 = performance.now();
const world: World = buildWorld({ cases: params.get('cases') === '0' ? [] : CASES });
const buildMs = performance.now() - t0;

let tapInfo = 'tap : —';
/** Journal pour les tests automatisés (scripts/perf-map.mjs --gestures). */
const taps: { world: Vec2; screen: Vec2; id: string | null }[] = [];
let cameraChanges = 0;
let lastHud = 0;
let selection: Overlay[] = [];
let demo: Overlay[] = [];

/** Entité la plus en avant (ordre de dessin) dont le corps contient le point, avec tolérance. */
function entityAt(p: Vec2, zoom: number): Entity | null {
  const tol = PICK_TOLERANCE_PX / zoom;
  const list = world.index.query({ x: p.x - tol, y: p.y - tol, w: 2 * tol, h: 2 * tol });
  for (let k = list.length - 1; k >= 0; k--) {
    const r = getHitRect(list[k]);
    if (p.x >= r.x - tol && p.x <= r.x + r.w + tol && p.y >= r.y - tol && p.y <= r.y + r.h + tol) return list[k];
  }
  return null;
}

const map: EngineMapView = createMapView({
  canvas: document.getElementById('map') as HTMLCanvasElement,
  world,
  initial: { x: num('x'), y: num('y'), zoom: num('zoom') },
  onTap(w, s) {
    const cam = map.getCamera();
    const e = entityAt(w, cam.zoom);
    taps.push({ world: w, screen: s, id: e ? e.id : null });
    tapInfo =
      `tap : monde (${w.x.toFixed(1)}, ${w.y.toFixed(1)}) écran (${s.x.toFixed(0)}, ${s.y.toFixed(0)})\n` +
      (e ? `entité : <b>${e.id}</b> (${e.kind}${'prop' in e ? ':' + e.prop : ''})` : 'entité : aucune');
    selection = e ? [{ kind: 'box', rect: getHitRect(e), style: 'select' }] : [];
    map.setOverlays([...demo, ...selection]);
    updateHud();
  },
  onCameraChange() {
    cameraChanges++;
    drawDev();
    // HUD rafraîchi au plus toutes les 100 ms (une mise à jour du DOM par image coûte cher).
    const t = performance.now();
    if (t - lastHud > 100) updateHud();
  },
});
if (flag('reduced')) map.setReducedMotion(true);
win.__haystack = {
  world,
  map,
  taps,
  get cameraChanges() {
    return cameraChanges;
  },
};

/* ----------------------------------------------------------------------------
 * Overlays de démonstration (demo=1)
 * ------------------------------------------------------------------------- */

if (flag('demo')) {
  const c = map.getCamera();
  const u = 40 / Math.max(0.25, c.zoom); // ~40 px à l'écran
  demo = [
    { kind: 'spotlight', circle: { x: c.x + 2 * u, y: c.y + 2 * u, radius: 1.6 * u } },
    { kind: 'ring', circle: { x: c.x - 2.5 * u, y: c.y - 3 * u, radius: 0.6 * u }, style: 'select' },
    { kind: 'ring', circle: { x: c.x - 0.8 * u, y: c.y - 3 * u, radius: 0.6 * u }, style: 'found' },
    { kind: 'ring', circle: { x: c.x + 0.9 * u, y: c.y - 3 * u, radius: 0.6 * u }, style: 'reveal' },
    { kind: 'ring', circle: { x: c.x + 2.6 * u, y: c.y - 3 * u, radius: 0.6 * u }, style: 'wrong' },
    { kind: 'box', rect: { x: c.x - 3 * u, y: c.y - 1.2 * u, w: 1.2 * u, h: 1.4 * u }, style: 'near' },
    { kind: 'box', rect: { x: c.x - 1.4 * u, y: c.y - 1.2 * u, w: 1.2 * u, h: 1.4 * u }, style: 'found' },
    { kind: 'thread', from: { x: c.x - 3 * u, y: c.y + 2 * u }, to: { x: c.x + 0.5 * u, y: c.y + 4 * u } },
    { kind: 'pin', at: { x: c.x - 2 * u, y: c.y + 4.5 * u }, label: 'ici ?' },
  ];
  map.setOverlays(demo);
}

/* ----------------------------------------------------------------------------
 * Calque de développement : grille et ids
 * ------------------------------------------------------------------------- */

function sizeDevCanvas(): number {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const w = Math.round(devCanvas.clientWidth * dpr);
  const h = Math.round(devCanvas.clientHeight * dpr);
  if (devCanvas.width !== w || devCanvas.height !== h) {
    devCanvas.width = w;
    devCanvas.height = h;
  }
  return dpr;
}

function niceStep(zoom: number): number {
  for (const s of [10, 20, 50, 100, 200, 500, 1000, 2000]) if (s * zoom >= 70) return s;
  return 5000;
}

function label(text: string, x: number, y: number, bg: string, fg: string, align: CanvasTextAlign = 'left'): void {
  const w = devCtx.measureText(text).width;
  const x0 = align === 'center' ? x - w / 2 : x;
  devCtx.fillStyle = bg;
  devCtx.fillRect(x0 - 2, y - 7, w + 4, 13);
  devCtx.fillStyle = fg;
  devCtx.fillText(text, x0, y);
}

function drawDev(): void {
  if (!showGrid && !showIds) return;
  const dpr = sizeDevCanvas();
  devCtx.setTransform(1, 0, 0, 1, 0, 0);
  devCtx.clearRect(0, 0, devCanvas.width, devCanvas.height);
  devCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  devCtx.textBaseline = 'middle';
  const cam = map.getCamera();
  const W = devCanvas.clientWidth;
  const H = devCanvas.clientHeight;
  const tl = map.screenToWorld({ x: 0, y: 0 });
  const br = map.screenToWorld({ x: W, y: H });
  if (showGrid) {
    const step = gridStep || niceStep(cam.zoom);
    devCtx.font = '10px ui-monospace, Menlo, Consolas, monospace';
    devCtx.lineWidth = 1;
    devCtx.strokeStyle = 'rgba(40, 60, 160, 0.45)';
    devCtx.beginPath();
    const x0 = Math.max(0, Math.ceil(tl.x / step) * step);
    const y0 = Math.max(0, Math.ceil(tl.y / step) * step);
    for (let x = x0; x <= Math.min(world.width, br.x); x += step) {
      const sx = Math.round(map.worldToScreen({ x, y: 0 }).x) + 0.5;
      devCtx.moveTo(sx, 0);
      devCtx.lineTo(sx, H);
    }
    for (let y = y0; y <= Math.min(world.height, br.y); y += step) {
      const sy = Math.round(map.worldToScreen({ x: 0, y }).y) + 0.5;
      devCtx.moveTo(0, sy);
      devCtx.lineTo(W, sy);
    }
    devCtx.stroke();
    const top = showHud ? hud.getBoundingClientRect().bottom + 10 : 8;
    for (let x = x0; x <= Math.min(world.width, br.x); x += step) {
      label(String(x), map.worldToScreen({ x, y: 0 }).x + 2, top, 'rgba(40,60,160,0.75)', '#fff');
    }
    for (let y = y0; y <= Math.min(world.height, br.y); y += step) {
      label(String(y), 2, map.worldToScreen({ x: 0, y }).y + 8, 'rgba(40,60,160,0.75)', '#fff');
    }
  }
  if (showIds && cam.zoom >= 2) {
    devCtx.font = '600 9px ui-monospace, Menlo, Consolas, monospace';
    const list = world.index.query({ x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y });
    for (const e of list) {
      const a =
        e.kind === 'building'
          ? map.worldToScreen({ x: e.footprint.x + e.footprint.w / 2, y: e.footprint.y - e.height + 6 })
          : map.worldToScreen({ x: e.x, y: e.y });
      if (a.x < -50 || a.y < -10 || a.x > W + 50 || a.y > H + 10) continue;
      const story = !e.id.startsWith('a.') && !e.id.startsWith('b.');
      label(e.id, a.x, a.y + 6, story ? 'rgba(160, 30, 30, 0.85)' : 'rgba(255, 252, 240, 0.85)', story ? '#fff' : '#2b2622', 'center');
    }
  }
}

/* ----------------------------------------------------------------------------
 * HUD
 * ------------------------------------------------------------------------- */

function updateHud(): void {
  if (!showHud) return;
  lastHud = performance.now();
  const c = map.getCamera();
  const s = map.debugStats();
  hud.innerHTML =
    `<b>x</b> ${c.x.toFixed(0)}  <b>y</b> ${c.y.toFixed(0)}  <b>zoom</b> ${c.zoom.toFixed(3)}  ` +
    `(min ${map.getMinZoom().toFixed(3)})\n` +
    `<b>niveau</b> ${s.level} [${s.rootLevel}…${s.minLevel}…2]  <b>img/s</b> ${s.fps.toFixed(0)}  ` +
    `<b>image</b> ${s.lastFrameMs.toFixed(1)} ms\n` +
    `<b>tuiles</b> ${s.tilesCached}/${s.cacheCapacity} (épinglées ${s.tilesPinned})  ` +
    `rendues ${s.tilesRendered}  en attente ${s.tilesPending}\n` +
    `<b>rendu tuile</b> moy ${s.avgTileMs.toFixed(1)} ms  max ${s.maxTileMs.toFixed(1)} ms  ` +
    `dpr ${s.dpr}${s.offscreen ? ' (off)' : ''}\n` +
    `<b>monde</b> ${world.entities.length} entités, construit en ${buildMs.toFixed(0)} ms\n` +
    tapInfo;
}

setInterval(updateHud, 250);
window.addEventListener('resize', () => drawDev());
updateHud();
drawDev();

void map.whenIdle().then(() => {
  drawDev();
  updateHud();
  win.__haystackReady = true;
});
