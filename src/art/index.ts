// PROVISOIRE (phase 0) — remplacé par le module art en phase 1.
// Dessin minimal (rectangles) pour que le moteur puisse être développé en parallèle.
import type { Entity, GroundLayer, Rect } from '../types';
import { getEntityBounds, getHitRect } from './bounds';

export type Lod = 0 | 1 | 2;
export { getEntityBounds, getHitRect } from './bounds';
export const PAPER = '#f3ecdc';

export function lodForZoom(zoom: number): Lod {
  return zoom >= 1 ? 0 : zoom >= 0.3 ? 1 : 2;
}

const GROUND_FILL: Record<string, string> = {
  grass: '#cfd8a8', park: '#bfd39a', water: '#9fbcc9', sand: '#e8d9a8', plaza: '#e2d6c0',
  sidewalk: '#d9d0c0', road: '#b9b2a6', parking: '#c4bdb1', dock: '#c9b79a', garden: '#c6d49c',
  courtyard: '#ddd2bd', bridge: '#b0a898', railbed: '#a89f92',
};

export function drawGround(ctx: CanvasRenderingContext2D, ground: GroundLayer, _view: Rect, _lod: Lod): void {
  for (const s of ground.shapes) {
    if (s.points.length < 3) continue;
    ctx.fillStyle = GROUND_FILL[s.kind] ?? '#ccc';
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (const p of s.points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawEntity(ctx: CanvasRenderingContext2D, e: Entity, _lod: Lod): void {
  const r = e.kind === 'building' ? getHitRect(e) : getHitRect(e);
  ctx.fillStyle = e.kind === 'building' ? '#d8b48a' : e.kind === 'person' ? '#c0392b' : e.kind === 'tree' ? '#5d8a4a' : '#555';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  void getEntityBounds;
}
