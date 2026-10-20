// Recherche d'emplacements libres (aide au placement des scènes d'enquête).
import type { Rect, Vec2, World } from '../types';
import { groundAt, isHiddenByRoof, isWalkable, onCrosswalk } from './query';

export interface FreeSpot {
  x: number;
  y: number;
  ground: string;
}

/**
 * Points praticables du rectangle (grille de pas `step`), hors chaussée, non masqués par un toit,
 * et dont le voisinage (rayon `clearance`) ne touche le corps d'aucune entité.
 */
export function findFreeSpots(world: World, r: Rect, opts: { step?: number; clearance?: number; max?: number } = {}): FreeSpot[] {
  const step = opts.step ?? 12;
  const clear = opts.clearance ?? 10;
  const max = opts.max ?? 200;
  const out: FreeSpot[] = [];
  const ents = world.index.query({ x: r.x - 80, y: r.y - 80, w: r.w + 160, h: r.h + 200 });
  for (let y = r.y + step / 2; y < r.y + r.h; y += step) {
    for (let x = r.x + step / 2; x < r.x + r.w; x += step) {
      const p: Vec2 = { x, y };
      if (!isWalkable(world, p)) continue;
      const g = groundAt(world, p);
      if (g === 'road' && !onCrosswalk(world, p)) continue;
      if (g === 'railbed') continue;
      if (isHiddenByRoof(world, p)) continue;
      let blocked = false;
      for (const e of ents) {
        if (e.kind === 'building') continue;
        const b = world.bounds.get(e.id)!;
        // Base au sol de l'entité (sa ligne de pieds) proche du point ?
        if (Math.abs(e.y - y) < clear && x > b.x - clear && x < b.x + b.w + clear) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      out.push({ x: Math.round(x), y: Math.round(y), ground: g });
      if (out.length >= max) return out;
    }
  }
  return out;
}
