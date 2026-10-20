// Géométrie élémentaire du module game (pur, sans DOM) : rectangles, polygones, cercles,
// et « cibles » désignables (entités ou zones) d'un monde.
import type { Circle, Rect, Vec2, World } from '../types';
import { getHitRect } from '../art/bounds';

/** Le point p est-il dans le rectangle r élargi de `margin` (bords inclus) ? */
export function rectContains(r: Rect, p: Vec2, margin = 0): boolean {
  return p.x >= r.x - margin && p.x <= r.x + r.w + margin && p.y >= r.y - margin && p.y <= r.y + r.h + margin;
}

/** Intersection stricte de deux rectangles (se toucher par un bord ne compte pas). */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function rectCenter(r: Rect): Vec2 {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Plus petit rectangle contenant a et b. */
export function unionRect(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** Demi-diagonale d'un rectangle : rayon du cercle circonscrit centré sur son centre. */
export function halfDiagonal(r: Rect): number {
  return Math.hypot(r.w, r.h) / 2;
}

export function circleContains(c: Circle, p: Vec2): boolean {
  return Math.hypot(p.x - c.x, p.y - c.y) <= c.radius;
}

/** Point dans un polygone (règle pair-impair). Les points exactement sur un bord sont indéterminés. */
export function pointInPolygon(points: readonly Vec2[], p: Vec2): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (a.y > p.y !== b.y > p.y) {
      const xi = a.x + ((p.y - a.y) * (b.x - a.x)) / (b.y - a.y);
      if (p.x < xi) inside = !inside;
    }
  }
  return inside;
}

/** Rectangle englobant d'un polygone (vide → rectangle nul en 0,0). */
export function polygonBBox(points: readonly Vec2[]): Rect {
  if (points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
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

/** Centroïde (centre de gravité de la surface) ; moyenne des sommets si le polygone est dégénéré. */
export function polygonCentroid(points: readonly Vec2[]): Vec2 {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  let a2 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const p = points[j];
    const q = points[i];
    const cross = p.x * q.y - q.x * p.y;
    a2 += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  if (Math.abs(a2) < 1e-9) {
    let sx = 0;
    let sy = 0;
    for (const p of points) {
      sx += p.x;
      sy += p.y;
    }
    return { x: sx / n, y: sy / n };
  }
  return { x: cx / (3 * a2), y: cy / (3 * a2) };
}

/** Un id désigne-t-il une entité ou une zone du monde ? */
export function targetExists(world: World, id: string): boolean {
  return world.byId.has(id) || world.zones.has(id);
}

/**
 * Rectangle d'une cible : rectangle de désignation (getHitRect) pour une entité,
 * rectangle englobant pour une zone ; undefined si l'id est inconnu.
 */
export function targetRect(world: World, id: string): Rect | undefined {
  const e = world.byId.get(id);
  if (e) return getHitRect(e);
  const z = world.zones.get(id);
  if (z) return polygonBBox(z.points);
  return undefined;
}

/** Centre d'une cible, ou undefined si l'id est inconnu (version tolérante de entityCenter). */
export function targetCenter(world: World, id: string): Vec2 | undefined {
  const e = world.byId.get(id);
  if (e) return rectCenter(getHitRect(e));
  const z = world.zones.get(id);
  if (z) return polygonCentroid(z.points);
  return undefined;
}

/**
 * Centre d'une entité (centre de son rectangle de désignation) ou d'une zone (centroïde).
 * Lève une erreur si l'id n'est ni une entité ni une zone du monde.
 */
export function entityCenter(world: World, id: string): Vec2 {
  const c = targetCenter(world, id);
  if (!c) throw new Error(`[game] entité ou zone inconnue : « ${id} »`);
  return c;
}
