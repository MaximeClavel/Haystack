// Mathématiques des tuiles — fonctions PURES, testées dans tiles.test.ts.
//
// Niveau L (entier, éventuellement négatif) : la tuile est rendue au zoom 2^L. Elle couvre
// TILE_SIZE / 2^L unités monde de côté et mesure TILE_SIZE px CSS (× densité en pixels réels).
// La grille d'un niveau part de l'origine du monde ; les grilles sont emboîtées : la tuile
// (L, i, j) est exactement le quart (i mod 2, j mod 2) de sa parente (L − 1, ⌊i/2⌋, ⌊j/2⌋).
//
// Choix du niveau d'affichage (règle documentée dans README.md) : le plus petit L tel que
// zoom / 2^L ≤ LEVEL_UPSCALE_MAX. Une tuile est donc affichée entre ×0,58 (réduite, nette)
// et ×1,15 (à peine agrandie) : on préfère réduire qu'agrandir, sans payer 4 fois plus de tuiles
// pour un agrandissement imperceptible.

import type { CameraState, Rect } from '../types';
import { MAX_ZOOM, TILE_SIZE } from '../config';
import type { Viewport, WorldSize } from './camera';
import { LEVEL_UPSCALE_MAX, ROOT_MAX_TILES } from './constants';

export interface TileCoord {
  level: number;
  i: number;
  j: number;
}

/** Niveau le plus détaillé : zoom de rendu 2^MAX_LEVEL = MAX_ZOOM. */
export const MAX_LEVEL = Math.ceil(Math.log2(MAX_ZOOM) - 1e-9);

/** Côté d'une tuile du niveau `level`, en unités monde. */
export function tileWorldSize(level: number): number {
  return TILE_SIZE / 2 ** level;
}

/** Zoom de rendu du niveau. */
export function levelZoom(level: number): number {
  return 2 ** level;
}

export function tileKey(t: TileCoord): string {
  return `${t.level}/${t.i}/${t.j}`;
}

/** Rectangle monde couvert par une tuile. */
export function tileRect(t: TileCoord): Rect {
  const s = tileWorldSize(t.level);
  return { x: t.i * s, y: t.j * s, w: s, h: s };
}

/** Nombre de colonnes et de lignes de la grille d'un niveau. */
export function gridSize(level: number, world: WorldSize): { cols: number; rows: number } {
  const s = tileWorldSize(level);
  return { cols: Math.max(1, Math.ceil(world.width / s - 1e-9)), rows: Math.max(1, Math.ceil(world.height / s - 1e-9)) };
}

export function tileCount(level: number, world: WorldSize): number {
  const g = gridSize(level, world);
  return g.cols * g.rows;
}

/** Niveau « idéal » (non borné) pour afficher le zoom donné. */
export function idealLevel(zoom: number, upscaleMax = LEVEL_UPSCALE_MAX): number {
  return Math.ceil(Math.log2(zoom / upscaleMax) - 1e-9) + 0; // + 0 : jamais −0
}

/** Niveau d'affichage pour un zoom, borné à [minLevel, maxLevel]. */
export function levelForZoom(zoom: number, minLevel: number, maxLevel: number = MAX_LEVEL): number {
  const l = idealLevel(zoom);
  return l < minLevel ? minLevel : l > maxLevel ? maxLevel : l;
}

/**
 * Plage de niveaux utiles pour un zoom minimal donné.
 * - `min` : niveau affiché au zoom minimal (« ville entière ») ;
 * - `root` : niveau de repli universel, jamais évincé du cache. C'est `min`, sauf si la ville y
 *   demande plus de ROOT_MAX_TILES tuiles (grand écran) : on descend alors d'un ou plusieurs niveaux.
 */
export function levelRange(minZoom: number, world: WorldSize): { min: number; root: number; max: number } {
  const min = Math.min(MAX_LEVEL, idealLevel(minZoom));
  let root = min;
  while (tileCount(root, world) > ROOT_MAX_TILES) root--;
  return { min, root, max: MAX_LEVEL };
}

/** Indices de tuiles (bornes incluses) qui intersectent `rect` ; null si aucune. */
export function tileRange(
  level: number,
  rect: Rect,
  world: WorldSize,
  margin = 0,
): { i0: number; i1: number; j0: number; j1: number } | null {
  const s = tileWorldSize(level);
  const { cols, rows } = gridSize(level, world);
  // Une tuile [i·s, (i+1)·s) intersecte [x0, x1) si i·s < x1 et (i+1)·s > x0.
  const i0 = Math.max(0, Math.floor(rect.x / s) - margin);
  const i1 = Math.min(cols - 1, Math.ceil((rect.x + rect.w) / s) - 1 + margin);
  const j0 = Math.max(0, Math.floor(rect.y / s) - margin);
  const j1 = Math.min(rows - 1, Math.ceil((rect.y + rect.h) / s) - 1 + margin);
  if (i0 > i1 || j0 > j1 || rect.w <= 0 || rect.h <= 0) return null;
  return { i0, i1, j0, j1 };
}

/**
 * Tuiles du niveau qui couvrent la vue de la caméra (étendue de `margin` tuiles de chaque côté),
 * triées de la plus centrale à la plus excentrée.
 */
export function visibleTiles(cam: CameraState, vp: Viewport, level: number, world: WorldSize, margin = 0): TileCoord[] {
  const w = vp.width / cam.zoom;
  const h = vp.height / cam.zoom;
  const r = tileRange(level, { x: cam.x - w / 2, y: cam.y - h / 2, w, h }, world, margin);
  if (!r) return [];
  const s = tileWorldSize(level);
  const out: { t: TileCoord; d: number }[] = [];
  for (let j = r.j0; j <= r.j1; j++) {
    for (let i = r.i0; i <= r.i1; i++) {
      const dx = (i + 0.5) * s - cam.x;
      const dy = (j + 0.5) * s - cam.y;
      out.push({ t: { level, i, j }, d: dx * dx + dy * dy });
    }
  }
  out.sort((a, b) => a.d - b.d);
  return out.map((o) => o.t);
}

/** Toutes les tuiles d'un niveau (ex. niveau racine), les plus proches de `center` d'abord. */
export function allTiles(level: number, world: WorldSize, center?: { x: number; y: number }): TileCoord[] {
  const { cols, rows } = gridSize(level, world);
  const s = tileWorldSize(level);
  const c = center ?? { x: world.width / 2, y: world.height / 2 };
  const out: { t: TileCoord; d: number }[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const dx = (i + 0.5) * s - c.x;
      const dy = (j + 0.5) * s - c.y;
      out.push({ t: { level, i, j }, d: dx * dx + dy * dy });
    }
  }
  out.sort((a, b) => a.d - b.d);
  return out.map((o) => o.t);
}

/** Ancêtre de la tuile au niveau `level` (≤ t.level). */
export function ancestorAt(t: TileCoord, level: number): TileCoord {
  const k = t.level - level;
  if (k <= 0) return t;
  const f = 2 ** k;
  return { level, i: Math.floor(t.i / f), j: Math.floor(t.j / f) };
}

export function parentTile(t: TileCoord): TileCoord {
  return ancestorAt(t, t.level - 1);
}

/** Les quatre enfants (niveau + 1) d'une tuile, limités à la grille du monde. */
export function childTiles(t: TileCoord, world: WorldSize): TileCoord[] {
  const level = t.level + 1;
  const { cols, rows } = gridSize(level, world);
  const out: TileCoord[] = [];
  for (let dj = 0; dj < 2; dj++) {
    for (let di = 0; di < 2; di++) {
      const i = t.i * 2 + di;
      const j = t.j * 2 + dj;
      if (i < cols && j < rows) out.push({ level, i, j });
    }
  }
  return out;
}

/**
 * Sous-rectangle (en px de la tuile ancêtre) qui correspond à la tuile `t`.
 * `tilePx` = taille en pixels d'une tuile.
 */
export function subRectInAncestor(t: TileCoord, ancestor: TileCoord, tilePx: number): { sx: number; sy: number; sw: number } {
  const f = 2 ** (t.level - ancestor.level);
  const sw = tilePx / f;
  return { sx: (t.i - ancestor.i * f) * sw, sy: (t.j - ancestor.j * f) * sw, sw };
}

/**
 * Rectangle écran, en pixels RÉELS entiers, d'un rectangle monde. Les bords sont arrondis
 * indépendamment : deux tuiles voisines partagent exactement leur bord (aucun liseré).
 */
export function deviceRect(
  r: Rect,
  cam: CameraState,
  vp: Viewport,
  dpr: number,
): { x: number; y: number; w: number; h: number } {
  const k = cam.zoom * dpr;
  const ox = vp.width / 2 * dpr - cam.x * k;
  const oy = vp.height / 2 * dpr - cam.y * k;
  const x0 = Math.round(ox + r.x * k);
  const y0 = Math.round(oy + r.y * k);
  const x1 = Math.round(ox + (r.x + r.w) * k);
  const y1 = Math.round(oy + (r.y + r.h) * k);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * Capacité du cache LRU : ~CACHE_BASE / densité tuiles (64 à densité 2, 128 à densité 1),
 * relevée si l'écran est grand pour contenir deux écrans de tuiles au pire niveau + la racine,
 * et plafonnée en mémoire.
 */
export function cacheCapacity(
  vp: Viewport,
  dpr: number,
  rootTiles: number,
  base: number,
  maxBytes: number,
  upscaleMax = LEVEL_UPSCALE_MAX,
): number {
  const minTileCss = (TILE_SIZE * upscaleMax) / 2;
  const perScreen = (Math.ceil(vp.width / minTileCss) + 1) * (Math.ceil(vp.height / minTileCss) + 1);
  const tilePx = Math.round(TILE_SIZE * dpr);
  const byMemory = Math.floor(maxBytes / (tilePx * tilePx * 4));
  const wanted = Math.max(Math.round(base / dpr), rootTiles + 2 * perScreen + 8);
  return Math.max(rootTiles + perScreen + 4, Math.min(wanted, byMemory));
}
