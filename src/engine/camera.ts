// Mathématiques de caméra — fonctions PURES (aucun accès au DOM), testées dans camera.test.ts.
//
// Repères :
//   - monde : unités monde, x vers la droite, y vers le bas ;
//   - écran : px CSS, origine en haut à gauche du canevas.
// Caméra : (x, y) = point monde au centre de l'écran ; zoom = px CSS par unité monde.
//   écran = (monde − centre) · zoom + taille/2
//   monde = (écran − taille/2) / zoom + centre

import type { CameraState, Rect, Vec2 } from '../types';
import { MAX_ZOOM, MIN_ZOOM_FLOOR } from '../config';
import { EDGE_MARGIN } from './constants';

/** Taille de la zone d'affichage, en px CSS. */
export interface Viewport {
  width: number;
  height: number;
}

/** Dimensions du monde, en unités monde. */
export interface WorldSize {
  width: number;
  height: number;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Zoom minimal : la ville entière tient à l'écran, sans descendre sous MIN_ZOOM_FLOOR
 * (et sans dépasser MAX_ZOOM pour une ville minuscule).
 */
export function computeMinZoom(vp: Viewport, world: WorldSize): number {
  if (vp.width <= 0 || vp.height <= 0) return MIN_ZOOM_FLOOR;
  const fit = Math.min(vp.width / world.width, vp.height / world.height);
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM_FLOOR, fit));
}

/**
 * Intervalle autorisé pour une coordonnée du centre, sur un axe.
 * `visible` = étendue visible (unités monde), `size` = taille du monde sur cet axe.
 * Le bord de la ville peut entrer d'au plus `margin · visible` dans l'écran ; ce débord
 * se réduit à zéro quand la ville tient entièrement sur l'axe (le centre est alors fixé
 * au milieu) — la fonction est continue, sans à-coup au passage.
 */
export function centerRange(visible: number, size: number, margin = EDGE_MARGIN): [number, number] {
  const over = Math.min(margin * visible, Math.max(0, size - visible) / 2);
  const lo = visible / 2 - over;
  const hi = size - visible / 2 + over;
  if (lo >= hi) return [size / 2, size / 2];
  return [lo, hi];
}

/** Caméra ramenée dans les bornes : zoom dans [minZoom, maxZoom], centre qui ne perd jamais la ville. */
export function clampCamera(
  cam: CameraState,
  vp: Viewport,
  world: WorldSize,
  minZoom: number,
  maxZoom: number = MAX_ZOOM,
  margin = EDGE_MARGIN,
): CameraState {
  const zoom = clamp(Number.isFinite(cam.zoom) && cam.zoom > 0 ? cam.zoom : minZoom, minZoom, maxZoom);
  const [x0, x1] = centerRange(vp.width / zoom, world.width, margin);
  const [y0, y1] = centerRange(vp.height / zoom, world.height, margin);
  const x = Number.isFinite(cam.x) ? cam.x : world.width / 2;
  const y = Number.isFinite(cam.y) ? cam.y : world.height / 2;
  return { x: clamp(x, x0, x1), y: clamp(y, y0, y1), zoom };
}

export function screenToWorld(cam: CameraState, vp: Viewport, p: Vec2): Vec2 {
  return { x: cam.x + (p.x - vp.width / 2) / cam.zoom, y: cam.y + (p.y - vp.height / 2) / cam.zoom };
}

export function worldToScreen(cam: CameraState, vp: Viewport, p: Vec2): Vec2 {
  return { x: (p.x - cam.x) * cam.zoom + vp.width / 2, y: (p.y - cam.y) * cam.zoom + vp.height / 2 };
}

/** Rectangle monde visible à l'écran. */
export function visibleWorldRect(cam: CameraState, vp: Viewport): Rect {
  const w = vp.width / cam.zoom;
  const h = vp.height / cam.zoom;
  return { x: cam.x - w / 2, y: cam.y - h / 2, w, h };
}

/**
 * Zoom ancré : nouvelle caméra au zoom `zoom` telle que le point monde situé sous le point
 * écran `anchor` y reste. (Le résultat n'est pas borné : appeler clampCamera ensuite.)
 */
export function zoomAround(cam: CameraState, vp: Viewport, anchor: Vec2, zoom: number): CameraState {
  const w = screenToWorld(cam, vp, anchor);
  return anchorCamera(w, anchor, vp, zoom);
}

/** Caméra au zoom `zoom` qui place le point monde `world` sous le point écran `screen`. */
export function anchorCamera(world: Vec2, screen: Vec2, vp: Viewport, zoom: number): CameraState {
  return {
    x: world.x - (screen.x - vp.width / 2) / zoom,
    y: world.y - (screen.y - vp.height / 2) / zoom,
    zoom,
  };
}

/** Déplacement de la carte de (dx, dy) px CSS (le contenu suit le doigt). */
export function panBy(cam: CameraState, dx: number, dy: number): CameraState {
  return { x: cam.x - dx / cam.zoom, y: cam.y - dy / cam.zoom, zoom: cam.zoom };
}

/** Caméra qui cadre `rect` avec une marge `padding` (px CSS) de chaque côté. */
export function fitRectCamera(
  rect: Rect,
  vp: Viewport,
  padding: number,
  minZoom: number,
  maxZoom: number = MAX_ZOOM,
): CameraState {
  const aw = Math.max(1, vp.width - 2 * padding);
  const ah = Math.max(1, vp.height - 2 * padding);
  const rw = Math.max(1e-6, rect.w);
  const rh = Math.max(1e-6, rect.h);
  const zoom = clamp(Math.min(aw / rw, ah / rh), minZoom, Math.max(minZoom, maxZoom));
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, zoom };
}

export function sameCamera(a: CameraState, b: CameraState): boolean {
  return a.x === b.x && a.y === b.y && a.zoom === b.zoom;
}
