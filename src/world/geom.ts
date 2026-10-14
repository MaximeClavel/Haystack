// Outils géométriques du générateur (purs, sans DOM).
import type { Rect, Vec2 } from '../types';

export function rect(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h };
}

/** Rectangle à partir de deux bornes (x0, y0) — (x1, y1). */
export function rectXY(x0: number, y0: number, x1: number, y1: number): Rect {
  return { x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) };
}

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Intersection stricte avec une tolérance (les rectangles peuvent se chevaucher de `tol` unités). */
export function overlapsBy(a: Rect, b: Rect, tol: number): boolean {
  return a.x + tol < b.x + b.w && b.x + tol < a.x + a.w && a.y + tol < b.y + b.h && b.y + tol < a.y + a.h;
}

export function containsPoint(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

export function containsRect(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

export function inflate(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}

export function rectPoints(r: Rect): Vec2[] {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ];
}

export function polyBBox(points: readonly Vec2[]): Rect {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Point dans un polygone (pair-impair). Les points exactement sur un bord sont indéterminés. */
export function pointInPolygon(points: readonly Vec2[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (a.y > y !== b.y > y) {
      const xi = a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y);
      if (x < xi) inside = !inside;
    }
  }
  return inside;
}

/**
 * Intervalle [xmin, xmax] couvert par un polygone CONVEXE dans la bande horizontale [y0, y1].
 * Renvoie null si la bande ne touche pas le polygone.
 */
export function convexSpanInBand(points: readonly Vec2[], y0: number, y1: number): [number, number] | null {
  let xmin = Infinity;
  let xmax = -Infinity;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    // Sommets dans la bande
    if (a.y >= y0 && a.y <= y1) {
      if (a.x < xmin) xmin = a.x;
      if (a.x > xmax) xmax = a.x;
    }
    // Intersections de l'arête avec les droites y0 et y1
    for (const yy of [y0, y1]) {
      if ((a.y - yy) * (b.y - yy) < 0) {
        const x = a.x + ((yy - a.y) * (b.x - a.x)) / (b.y - a.y);
        if (x < xmin) xmin = x;
        if (x > xmax) xmax = x;
      }
    }
  }
  if (xmin === Infinity) return null;
  return [xmin, xmax];
}

/** Intervalle [xa, xb] d'un polygone convexe sur la droite horizontale y (null si aucune intersection). */
export function convexSpanAtY(points: readonly Vec2[], y: number): [number, number] | null {
  let xmin = Infinity;
  let xmax = -Infinity;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      const x = a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y);
      if (x < xmin) xmin = x;
      if (x > xmax) xmax = x;
    }
  }
  if (xmin === Infinity) return null;
  return [xmin, xmax];
}

/** Test « rectangle touche polygone convexe » (séparation par axes, suffisant pour nos formes). */
export function rectIntersectsConvex(r: Rect, points: readonly Vec2[]): boolean {
  const span = convexSpanInBand(points, r.y, r.y + r.h);
  if (!span) return false;
  return span[0] < r.x + r.w && span[1] > r.x;
}

/** Distance d'un point à un segment, et position projetée t ∈ [0, 1]. */
export function projectOnSegment(p: Vec2, a: Vec2, b: Vec2): { t: number; dist: number; along: number; len: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const len = Math.sqrt(len2);
  if (len2 === 0) return { t: 0, dist: Math.hypot(p.x - a.x, p.y - a.y), along: 0, len: 0 };
  const tRaw = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  const t = Math.max(0, Math.min(1, tRaw));
  const cx = a.x + dx * t;
  const cy = a.y + dy * t;
  return { t: tRaw, dist: Math.hypot(p.x - cx, p.y - cy), along: tRaw * len, len };
}

/** Point dans un « segment épais » à bouts plats (largeur totale `width`). */
export function pointInThickSegment(p: Vec2, a: Vec2, b: Vec2, width: number): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return false;
  const ux = dx / len;
  const uy = dy / len;
  const rx = p.x - a.x;
  const ry = p.y - a.y;
  const along = rx * ux + ry * uy;
  const perp = -rx * uy + ry * ux;
  return along >= 0 && along <= len && Math.abs(perp) <= width / 2;
}

/** Polygone (quadrilatère) d'un segment épais à bouts plats. */
export function thickSegmentPolygon(a: Vec2, b: Vec2, width: number): Vec2[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (width / 2);
  const ny = (dx / len) * (width / 2);
  return [
    { x: a.x + nx, y: a.y + ny },
    { x: b.x + nx, y: b.y + ny },
    { x: b.x - nx, y: b.y - ny },
    { x: a.x - nx, y: a.y - ny },
  ];
}

/** Polygone convexe approchant une ellipse inscrite dans r. */
export function ellipsePolygon(r: Rect, segments = 24, jitter?: () => number): Vec2[] {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const pts: Vec2[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const k = jitter ? 1 - 0.04 * jitter() : 1;
    pts.push({ x: cx + Math.cos(a) * (r.w / 2) * k, y: cy + Math.sin(a) * (r.h / 2) * k });
  }
  return pts;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Index spatial simple de rectangles (grille uniforme) pour les tests de collision pendant la génération. */
export class RectHash<T> {
  private readonly cells = new Map<number, { r: Rect; v: T }[]>();
  constructor(private readonly cell = 128) {}

  private key(cx: number, cy: number): number {
    return (cy + 64) * 4096 + (cx + 64);
  }

  add(r: Rect, v: T): void {
    const c = this.cell;
    const x0 = Math.floor(r.x / c);
    const x1 = Math.floor((r.x + r.w) / c);
    const y0 = Math.floor(r.y / c);
    const y1 = Math.floor((r.y + r.h) / c);
    const item = { r, v };
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const k = this.key(cx, cy);
        let list = this.cells.get(k);
        if (!list) {
          list = [];
          this.cells.set(k, list);
        }
        list.push(item);
      }
    }
  }

  /** Vrai si un rectangle enregistré chevauche r de plus de `tol` (filtre optionnel). */
  hits(r: Rect, tol = 0, filter?: (v: T) => boolean): boolean {
    const c = this.cell;
    const x0 = Math.floor(r.x / c);
    const x1 = Math.floor((r.x + r.w) / c);
    const y0 = Math.floor(r.y / c);
    const y1 = Math.floor((r.y + r.h) / c);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const list = this.cells.get(this.key(cx, cy));
        if (!list) continue;
        for (const it of list) {
          if (overlapsBy(it.r, r, tol) && (!filter || filter(it.v))) return true;
        }
      }
    }
    return false;
  }

  /** Valeurs dont le rectangle chevauche r (sans doublon). */
  query(r: Rect): T[] {
    const c = this.cell;
    const x0 = Math.floor(r.x / c);
    const x1 = Math.floor((r.x + r.w) / c);
    const y0 = Math.floor(r.y / c);
    const y1 = Math.floor((r.y + r.h) / c);
    const out: T[] = [];
    const seen = new Set<{ r: Rect; v: T }>();
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const list = this.cells.get(this.key(cx, cy));
        if (!list) continue;
        for (const it of list) {
          if (seen.has(it)) continue;
          seen.add(it);
          if (intersects(it.r, r)) out.push(it.v);
        }
      }
    }
    return out;
  }
}
