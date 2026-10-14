// Grille d'occupation (raster) utilisée PENDANT la génération pour des tests de collision rapides.
// Elle n'est pas conservée dans le World : les requêtes publiques (groundAt…) sont exactes (query.ts).
//
// Cellule de CELL unités. Deux couches :
//  - kind  : type de sol au CENTRE de la cellule (dernière forme peinte gagnante) — pour les densités ;
//  - flags : drapeaux CONSERVATEURS (une cellule touchée, même partiellement, est marquée) — pour les interdits.
import type { GroundKind, Rect, Vec2 } from '../types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { convexSpanAtY, convexSpanInBand, thickSegmentPolygon } from './geom';

export const CELL = 4;

export const F_ROAD = 1; // chaussée
export const F_WATER = 2; // eau (hors ponts)
export const F_RAIL = 4; // ballast
export const F_NOBUILD = 8; // interdit de construire (rues, places, eau, zones…)
export const F_KEEPVIS = 16; // doit rester visible : aucun toit ne doit le recouvrir
export const F_BUILDING = 32; // emprise d'un bâtiment
export const F_HIDDEN = 64; // sol caché par un toit (bande de projection d'un bâtiment)
export const F_SOLID = 128; // objet, arbre, véhicule : on ne s'y tient pas
export const F_PERSON = 256; // pieds d'une personne (espacement)
export const F_CROSS = 512; // passage piéton
export const F_LINE = 1024; // haie, clôture, mur, rail : pas de passant dessus
export const F_NOAMBIENT = 2048; // zone sans foule générique (gérée par un générateur dédié)
export const F_PATH = 4096; // allée de parc ou de jardin (pas d'arbre ni d'objet dessus)

export const GROUND_KINDS: GroundKind[] = [
  'grass',
  'park',
  'water',
  'sand',
  'plaza',
  'sidewalk',
  'road',
  'parking',
  'dock',
  'garden',
  'courtyard',
  'bridge',
  'railbed',
];
export const KIND_INDEX: Record<GroundKind, number> = Object.fromEntries(
  GROUND_KINDS.map((k, i) => [k, i]),
) as Record<GroundKind, number>;

/** Facteur du résumé grossier : une case grossière couvre COARSE × COARSE cases fines. */
const COARSE = 8;

export class Raster {
  readonly cols = Math.ceil(WORLD_WIDTH / CELL);
  readonly rows = Math.ceil(WORLD_HEIGHT / CELL);
  readonly kind = new Uint8Array(this.cols * this.rows);
  readonly flags = new Uint16Array(this.cols * this.rows);
  /** OU des drapeaux par case grossière (conservateur) : permet de sauter les zones vides. */
  private readonly ccols = Math.ceil(this.cols / COARSE);
  private readonly crows = Math.ceil(this.rows / COARSE);
  private readonly coarse = new Uint16Array(this.ccols * this.crows);

  private markCoarse(c0: number, r0: number, c1: number, r1: number, flag: number): void {
    const k0 = Math.floor(c0 / COARSE);
    const k1 = Math.floor(c1 / COARSE);
    for (let r = Math.floor(r0 / COARSE); r <= Math.floor(r1 / COARSE); r++) {
      for (let k = k0; k <= k1; k++) this.coarse[r * this.ccols + k] |= flag;
    }
  }

  /** Bornes de cellules couvertes (même partiellement) par r, bornées à la grille. */
  private cellRange(r: Rect): [number, number, number, number] | null {
    const c0 = Math.max(0, Math.floor(r.x / CELL));
    const r0 = Math.max(0, Math.floor(r.y / CELL));
    const c1 = Math.min(this.cols - 1, Math.ceil((r.x + r.w) / CELL) - 1);
    const r1 = Math.min(this.rows - 1, Math.ceil((r.y + r.h) / CELL) - 1);
    if (c1 < c0 || r1 < r0) return null;
    return [c0, r0, c1, r1];
  }

  markRect(r: Rect, flag: number): void {
    const cr = this.cellRange(r);
    if (!cr) return;
    const [c0, r0, c1, r1] = cr;
    this.markCoarse(c0, r0, c1, r1, flag);
    const f = this.flags;
    for (let y = r0; y <= r1; y++) {
      const base = y * this.cols;
      for (let x = c0; x <= c1; x++) f[base + x] |= flag;
    }
  }

  clearRect(r: Rect, flag: number): void {
    const cr = this.cellRange(r);
    if (!cr) return;
    const [c0, r0, c1, r1] = cr;
    const f = this.flags;
    const inv = ~flag;
    for (let y = r0; y <= r1; y++) {
      const base = y * this.cols;
      for (let x = c0; x <= c1; x++) f[base + x] &= inv;
    }
  }

  /** Marque (conservateur) les cellules touchées par un polygone convexe. */
  markConvex(points: readonly Vec2[], flag: number): void {
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const p of points) {
      y0 = Math.min(y0, p.y);
      y1 = Math.max(y1, p.y);
    }
    const r0 = Math.max(0, Math.floor(y0 / CELL));
    const r1 = Math.min(this.rows - 1, Math.ceil(y1 / CELL) - 1);
    const f = this.flags;
    for (let y = r0; y <= r1; y++) {
      const span = convexSpanInBand(points, y * CELL, (y + 1) * CELL);
      if (!span) continue;
      const c0 = Math.max(0, Math.floor(span[0] / CELL));
      const c1 = Math.min(this.cols - 1, Math.ceil(span[1] / CELL) - 1);
      if (c1 < c0) continue;
      this.markCoarse(c0, y, c1, y, flag);
      const base = y * this.cols;
      for (let x = c0; x <= c1; x++) f[base + x] |= flag;
    }
  }

  /** Marque un polygone : chemin rapide si c'est un rectangle aligné sur les axes. */
  markPoly(points: readonly Vec2[], flag: number): void {
    const r = axisRect(points);
    if (r) this.markRect(r, flag);
    else this.markConvex(points, flag);
  }

  markSegment(a: Vec2, b: Vec2, width: number, flag: number): void {
    this.markConvex(thickSegmentPolygon(a, b, Math.max(width, 1)), flag);
  }

  /** Peint le type de sol (échantillonnage au centre des cellules). */
  paintRect(r: Rect, kind: GroundKind): void {
    const k = KIND_INDEX[kind];
    const c0 = Math.max(0, Math.round(r.x / CELL));
    const c1 = Math.min(this.cols, Math.round((r.x + r.w) / CELL));
    const r0 = Math.max(0, Math.round(r.y / CELL));
    const r1 = Math.min(this.rows, Math.round((r.y + r.h) / CELL));
    for (let y = r0; y < r1; y++) this.kind.fill(k, y * this.cols + c0, y * this.cols + Math.max(c0, c1));
  }

  paintConvex(points: readonly Vec2[], kind: GroundKind): void {
    const k = KIND_INDEX[kind];
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const p of points) {
      y0 = Math.min(y0, p.y);
      y1 = Math.max(y1, p.y);
    }
    const r0 = Math.max(0, Math.floor(y0 / CELL));
    const r1 = Math.min(this.rows - 1, Math.ceil(y1 / CELL));
    for (let y = r0; y <= r1; y++) {
      const span = convexSpanAtY(points, (y + 0.5) * CELL);
      if (!span) continue;
      const c0 = Math.max(0, Math.ceil(span[0] / CELL - 0.5));
      const c1 = Math.min(this.cols - 1, Math.floor(span[1] / CELL - 0.5));
      if (c1 >= c0) this.kind.fill(k, y * this.cols + c0, y * this.cols + c1 + 1);
    }
  }

  /** Peint un polygone : chemin rapide si c'est un rectangle aligné sur les axes. */
  paintPoly(points: readonly Vec2[], kind: GroundKind): void {
    const r = axisRect(points);
    if (r) this.paintRect(r, kind);
    else this.paintConvex(points, kind);
  }

  kindAt(x: number, y: number): GroundKind {
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return 'grass';
    return GROUND_KINDS[this.kind[cy * this.cols + cx]];
  }

  flagsAt(x: number, y: number): number {
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return 0xffff;
    return this.flags[cy * this.cols + cx];
  }

  /** Vrai si une cellule touchée par r porte un des drapeaux du masque (hors grille = vrai). */
  any(r: Rect, mask: number): boolean {
    if (r.x < 0 || r.y < 0 || r.x + r.w > this.cols * CELL || r.y + r.h > this.rows * CELL) return true;
    const cr = this.cellRange(r);
    if (!cr) return false;
    const [c0, r0, c1, r1] = cr;
    const f = this.flags;
    const kr0 = Math.floor(r0 / COARSE);
    const kr1 = Math.floor(r1 / COARSE);
    const kc0 = Math.floor(c0 / COARSE);
    const kc1 = Math.floor(c1 / COARSE);
    for (let kr = kr0; kr <= kr1; kr++) {
      for (let kc = kc0; kc <= kc1; kc++) {
        if (!(this.coarse[kr * this.ccols + kc] & mask)) continue;
        const yy0 = Math.max(r0, kr * COARSE);
        const yy1 = Math.min(r1, kr * COARSE + COARSE - 1);
        const xx0 = Math.max(c0, kc * COARSE);
        const xx1 = Math.min(c1, kc * COARSE + COARSE - 1);
        for (let y = yy0; y <= yy1; y++) {
          const base = y * this.cols;
          for (let x = xx0; x <= xx1; x++) if (f[base + x] & mask) return true;
        }
      }
    }
    return false;
  }

  /** Vrai si TOUTES les cellules touchées par r portent un des drapeaux du masque. */
  all(r: Rect, mask: number): boolean {
    const cr = this.cellRange(r);
    if (!cr) return false;
    const [c0, r0, c1, r1] = cr;
    const f = this.flags;
    for (let y = r0; y <= r1; y++) {
      const base = y * this.cols;
      for (let x = c0; x <= c1; x++) if (!(f[base + x] & mask)) return false;
    }
    return true;
  }
}

/** Rectangle aligné sur les axes si le polygone en est un (4 sommets), sinon null. */
export function axisRect(points: readonly Vec2[]): Rect | null {
  if (points.length !== 4) return null;
  const xs = new Set(points.map((p) => p.x));
  const ys = new Set(points.map((p) => p.y));
  if (xs.size !== 2 || ys.size !== 2) return null;
  const [x0, x1] = [...xs].sort((a, b) => a - b);
  const [y0, y1] = [...ys].sort((a, b) => a - b);
  // Vérifie que chaque arête est horizontale ou verticale.
  for (let i = 0; i < 4; i++) {
    const a = points[i];
    const b = points[(i + 1) % 4];
    if (a.x !== b.x && a.y !== b.y) return null;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
