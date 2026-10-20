// Métadonnées du générateur attachées à un World (hors contrat) : plan des rues, îlots, emplacements.
// Utile aux outils (scripts/world-query.ts, dev/overview.html) et aux scénaristes.
import type { DistrictId, Vec2, World } from '../types';
import type { Block, Spot, Street } from './layout';

export interface WorldMeta {
  streets: Street[];
  blocks: Block[];
  spots: Spot[];
  /** Nombre d'entités ambiantes retirées parce qu'elles chevauchaient une scène d'enquête. */
  removedAmbient: number;
  /** Nombre de passants modifiés par la règle anti-sosie. */
  deSosied: number;
}

const metas = new WeakMap<World, WorldMeta>();

export function setWorldMeta(world: World, meta: WorldMeta): void {
  metas.set(world, meta);
}

/** Métadonnées d'un monde construit par buildWorld (undefined pour un monde fait main). */
export function worldMeta(world: World): WorldMeta | undefined {
  return metas.get(world);
}

/** Rue la plus proche d'un point (nom et distance au bord), pour décrire un emplacement. */
export function nearestStreet(meta: WorldMeta, p: Vec2): { name: string; distance: number } | null {
  let best: { name: string; distance: number } | null = null;
  for (const s of meta.streets) {
    const r = s.rect;
    const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
    const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
    const d = Math.hypot(dx, dy);
    if (!best || d < best.distance) best = { name: s.name, distance: Math.round(d) };
  }
  return best;
}

export function districtName(world: World, p: Vec2): DistrictId | null {
  for (const d of world.districts) {
    const r = d.rect;
    if (p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h) return d.id;
  }
  return null;
}
