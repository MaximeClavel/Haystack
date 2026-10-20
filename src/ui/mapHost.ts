// Hôte de LA carte : un seul canevas plein écran et une seule instance de createMapView,
// créés au démarrage et partagés par tous les écrans (jamais recréés).
//
// Les écrans Preact sont des calques par-dessus. Ils passent par cet hôte pour :
//   - recevoir les taps (un seul gestionnaire actif, celui de l'écran affiché) ;
//   - suivre la caméra (abonnés appelés au plus une fois par image, sans re-rendu Preact) ;
//   - poser des overlays par calques nommés (fusionnés puis envoyés à map.setOverlays) ;
//   - cadrer un point ou un rectangle en tenant compte des barres d'interface (marges haute/basse).
import type { CameraState, Overlay, Rect, Vec2, World } from '../types';
import { createMapView, visibleWorldRect, type EngineMapView } from '../engine';

export type TapHandler = (world: Vec2, screen: Vec2) => void;

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Calques d'overlays, dans l'ordre d'empilement (le moteur trie aussi par type). */
export const OVERLAY_LAYERS = ['hint', 'found', 'threads', 'pins', 'replay', 'feedback', 'select'] as const;
export type OverlayLayer = (typeof OVERLAY_LAYERS)[number];

export interface MapHost {
  readonly map: EngineMapView;
  readonly world: World;
  readonly canvas: HTMLCanvasElement;
  setTapHandler(fn: TapHandler | null): void;
  /** S'abonne aux changements de caméra ; renvoie la fonction de désabonnement. */
  onCamera(fn: (c: CameraState) => void): () => void;
  setLayer(layer: OverlayLayer, overlays: Overlay[]): void;
  clearLayers(): void;
  /** Marges (px CSS) masquées par l'interface sur chaque bord de l'écran (cadrages ET bornes de la caméra du moteur). */
  setInsets(top: number, bottom: number, left?: number, right?: number): void;
  getInsets(): Insets;
  /** Mesure les marges d'après la barre haute et la feuille du bas (à droite en paysage), puis les applique. */
  measureInsets(top: Element | null, bottom: Element | null): void;
  viewport(): { width: number; height: number };
  /** Rectangle monde réellement visible (hors barres d'interface). */
  freeWorldRect(): Rect;
  /** Amène le point p au centre de la zone libre (entre les barres), au zoom donné. */
  focus(p: Vec2, zoom?: number, opts?: { instant?: boolean; duration?: number }): Promise<void>;
  /** Cadre un rectangle monde dans la zone libre. */
  focusRect(rect: Rect, opts?: { maxZoom?: number; padding?: number; instant?: boolean }): Promise<void>;
  /** Caméra qui centre p dans la zone libre (sans bouger). */
  cameraFor(p: Vec2, zoom: number): CameraState;
  /** Le point écran est-il dans la zone libre (pas sous une barre) ? */
  isFree(screen: Vec2): boolean;
}

/**
 * Rectangle d'un élément sans l'effet de son éventuelle animation d'entrée (translation CSS) :
 * une feuille qui glisse de 26 px fausserait sinon les marges de cadrage, mesurées une seule fois.
 */
function layoutRect(el: Element): { top: number; bottom: number; left: number; width: number } {
  const r = el.getBoundingClientRect();
  let dx = 0;
  let dy = 0;
  try {
    const t = getComputedStyle(el).transform;
    if (t && t !== 'none') {
      const m = new DOMMatrixReadOnly(t);
      dx = m.m41;
      dy = m.m42;
    }
  } catch {
    // transformation illisible : on garde le rectangle tel quel
  }
  return { top: r.top - dy, bottom: r.bottom - dy, left: r.left - dx, width: r.width };
}

export function createMapHost(world: World, canvas: HTMLCanvasElement, initial?: Partial<CameraState>): MapHost {
  let tap: TapHandler | null = null;
  const cameraListeners = new Set<(c: CameraState) => void>();
  const layers = new Map<OverlayLayer, Overlay[]>();
  let insets: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

  const map = createMapView({
    canvas,
    world,
    initial,
    onTap(w, s) {
      tap?.(w, s);
    },
    onCameraChange(c) {
      for (const l of [...cameraListeners]) l(c);
    },
  });

  const viewport = (): { width: number; height: number } => ({
    width: canvas.clientWidth || window.innerWidth,
    height: canvas.clientHeight || window.innerHeight,
  });

  function push(): void {
    const all: Overlay[] = [];
    for (const name of OVERLAY_LAYERS) {
      const l = layers.get(name);
      if (l) all.push(...l);
    }
    map.setOverlays(all);
  }

  function cameraFor(p: Vec2, zoom: number): CameraState {
    // Le centre de la zone libre est décalé de (bas − haut) / 2 px sous le centre de l'écran
    // (et de (droite − gauche) / 2 px à sa gauche) : on décale la caméra d'autant dans le monde.
    const dx = (insets.right - insets.left) / 2 / zoom;
    const dy = (insets.bottom - insets.top) / 2 / zoom;
    return { x: p.x + dx, y: p.y + dy, zoom };
  }

  const host: MapHost = {
    map,
    world,
    canvas,
    setTapHandler(fn) {
      tap = fn;
    },
    onCamera(fn) {
      cameraListeners.add(fn);
      return () => cameraListeners.delete(fn);
    },
    setLayer(layer, overlays) {
      const prev = layers.get(layer);
      if ((!prev || prev.length === 0) && overlays.length === 0) return;
      layers.set(layer, overlays);
      push();
    },
    clearLayers() {
      if (layers.size === 0) return;
      layers.clear();
      push();
    },
    setInsets(top, bottom, left = 0, right = 0) {
      insets = { top: Math.max(0, top), bottom: Math.max(0, bottom), left: Math.max(0, left), right: Math.max(0, right) };
      // Le moteur compte aussi ces marges dans les bornes de la caméra (le bas de la ville reste atteignable sous la feuille).
      map.setInsets(insets);
    },
    getInsets: () => ({ ...insets }),
    measureInsets(topEl, bottomEl) {
      const vp = viewport();
      const top = topEl ? layoutRect(topEl).bottom : 0;
      if (!bottomEl) {
        host.setInsets(top, 0);
        return;
      }
      const r = layoutRect(bottomEl);
      // Feuille latérale (paysage) : elle masque le bord droit, pas le bas.
      if (r.width < vp.width * 0.7 && r.left > vp.width * 0.3) host.setInsets(top, 0, 0, vp.width - r.left);
      else host.setInsets(top, Math.max(0, vp.height - r.top));
    },
    viewport,
    freeWorldRect() {
      const vp = viewport();
      const r = visibleWorldRect(map.getCamera(), vp);
      const z = map.getCamera().zoom;
      return {
        x: r.x + insets.left / z,
        y: r.y + insets.top / z,
        w: Math.max(1, r.w - (insets.left + insets.right) / z),
        h: Math.max(1, r.h - (insets.top + insets.bottom) / z),
      };
    },
    cameraFor,
    focus(p, zoom, opts) {
      const z = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), zoom ?? map.getCamera().zoom));
      const cam = cameraFor(p, z);
      if (opts?.instant) {
        map.setCamera(cam);
        return Promise.resolve();
      }
      return map.flyTo(cam, opts?.duration !== undefined ? { duration: opts.duration } : undefined);
    },
    focusRect(rect, opts) {
      const vp = viewport();
      const pad = opts?.padding ?? 28;
      const freeW = Math.max(40, vp.width - insets.left - insets.right - 2 * pad);
      const freeH = Math.max(40, vp.height - insets.top - insets.bottom - 2 * pad);
      const maxZoom = Math.min(map.getMaxZoom(), opts?.maxZoom ?? map.getMaxZoom());
      let z = Math.min(freeW / Math.max(1, rect.w), freeH / Math.max(1, rect.h));
      z = Math.max(map.getMinZoom(), Math.min(maxZoom, z));
      return host.focus({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }, z, { instant: opts?.instant });
    },
    isFree(s) {
      const vp = viewport();
      return s.x >= insets.left && s.x <= vp.width - insets.right && s.y >= insets.top && s.y <= vp.height - insets.bottom;
    },
  };
  return host;
}
