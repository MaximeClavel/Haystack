// PROVISOIRE (phase 0) — remplacé par le module world en phase 1.
// Monde minimal et déterministe pour développer le moteur et l'interface en parallèle.
import type { BuildingEntity, CaseDef, Entity, PersonEntity, Rect, SpatialIndex, World } from '../types';
import { mulberry32 } from '../lib/rng';
import { WORLD_HEIGHT, WORLD_SEED, WORLD_WIDTH } from '../config';
import { compareDrawOrder, getEntityBounds } from '../art/bounds';
import { DISTRICTS, LANDMARKS } from './layoutSpec';

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function buildWorld(opts: { seed?: number; cases?: CaseDef[] } = {}): World {
  const seed = opts.seed ?? WORLD_SEED;
  const rnd = mulberry32(seed);
  const entities: Entity[] = [];
  for (const lm of LANDMARKS) {
    if (lm.kind !== 'building') continue;
    const b: BuildingEntity = {
      id: `lm.${lm.id}`, kind: 'building', style: lm.style ?? 'shop', footprint: lm.rect,
      x: lm.rect.x + lm.rect.w / 2, y: lm.rect.y + lm.rect.h, height: lm.height ?? 60,
      wall: lm.wall ?? 'beige', roof: lm.roof ?? 'grey', sign: lm.sign, seed: 1, tags: ['landmark'],
    };
    entities.push(b);
  }
  for (let i = 0; i < 3000; i++) {
    const p: PersonEntity = {
      id: `a.${i}`, kind: 'person', x: rnd() * WORLD_WIDTH, y: rnd() * WORLD_HEIGHT, pose: 'stand', facing: 'left',
      appearance: { skin: 'light', hair: 'short', hairColor: 'brown', hat: 'none', top: 'tshirt', topColor: 'red',
        topPattern: 'plain', bottom: 'trousers', bottomColor: 'navy', face: 'none', accessory: 'none', build: 'regular' },
      tags: ['ambient'],
    };
    entities.push(p);
  }
  for (const c of opts.cases ?? []) entities.push(...c.entities);
  entities.sort(compareDrawOrder);
  const bounds = new Map(entities.map((e) => [e.id, getEntityBounds(e)] as const));
  const index: SpatialIndex = {
    query: (rect) => entities.filter((e) => intersects(bounds.get(e.id)!, rect)),
  };
  return {
    seed, width: WORLD_WIDTH, height: WORLD_HEIGHT,
    ground: { base: 'grass', shapes: [], lines: [] },
    entities, byId: new Map(entities.map((e) => [e.id, e])), bounds, index,
    districts: DISTRICTS,
    landmarks: LANDMARKS.map((l) => ({ id: l.id, name: l.name, district: l.district, kind: l.kind, rect: l.rect,
      entityId: l.kind === 'building' ? `lm.${l.id}` : undefined })),
    zones: new Map(),
  };
}
