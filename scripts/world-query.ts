// Interroger le monde généré depuis le terminal (aide au placement des scènes d'enquête).
//
// Usage (via `npm run world -- <commande>`) :
//   landmarks                     liste des lieux remarquables (id, nom, emprise, entité)
//   districts                     liste des quartiers
//   streets [filtre]              rues (nom, axe, rectangle) — filtre sur le nom
//   zones                         zones désignables (lieux de type area + enquêtes)
//   entity <id>                   une entité et son emprise
//   rect <x> <y> <w> <h>          entités dont l'emprise intersecte le rectangle
//   near <x> <y> [r]              entités dont l'ancre est à moins de r (défaut 60) du point
//   ground <x> <y>                sol, praticabilité, bâtiment, passage piéton, toit, rue la plus proche
//   free <x> <y> <w> <h> [pas]    emplacements libres et praticables (hors chaussée, visibles)
//   lookalikes <id> [d]           passants à moins de d attributs (défaut 3) de la personne <id>
//   stats                         nombre d'entités par type et sous-type
// Option : --no-cases (monde sans les enquêtes).
import type { Entity, PersonEntity } from '../src/types';
import {
  appearanceDistance,
  buildingAt,
  buildWorld,
  findFreeSpots,
  groundAt,
  isHiddenByRoof,
  isWalkable,
  onCrosswalk,
  worldMeta,
} from '../src/world';
import { districtName, nearestStreet } from '../src/world/meta';
import { CASES } from '../src/content';

const argv = process.argv.slice(2);
const noCases = argv.includes('--no-cases');
const [cmd = 'stats', ...rest] = argv.filter((a) => a !== '--no-cases');
const world = buildWorld({ cases: noCases ? [] : CASES });
const meta = worldMeta(world)!;

function print(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function brief(e: Entity): Record<string, unknown> {
  const base = { id: e.id, kind: e.kind, x: e.x, y: e.y };
  switch (e.kind) {
    case 'person':
      return { ...base, pose: e.pose, facing: e.facing, holding: e.holding, emote: e.emote, look: describe(e) };
    case 'prop':
      return { ...base, prop: e.prop, label: e.label, color: e.color };
    case 'vehicle':
      return { ...base, vehicle: e.vehicle, color: e.color, facing: e.facing };
    case 'tree':
      return { ...base, tree: e.tree, size: e.size };
    case 'building':
      return { ...base, style: e.style, sign: e.sign, footprint: e.footprint, height: e.height };
  }
}

function describe(p: PersonEntity): string {
  const a = p.appearance;
  return [a.build, a.hat !== 'none' ? `chapeau:${a.hat}` : '', `${a.top}:${a.topColor}/${a.topPattern}`, `${a.bottom}:${a.bottomColor}`, `cheveux:${a.hair}/${a.hairColor}`, a.face !== 'none' ? a.face : '', a.accessory !== 'none' ? a.accessory : '']
    .filter(Boolean)
    .join(' ');
}

const nums = (n: number): number[] => rest.slice(0, n).map(Number);

switch (cmd) {
  case 'landmarks':
    print(world.landmarks);
    break;
  case 'districts':
    print(world.districts);
    break;
  case 'streets': {
    const f = (rest[0] ?? '').toLowerCase();
    print(
      meta.streets
        .filter((s) => s.name.toLowerCase().includes(f))
        .map((s) => ({ name: s.name, kind: s.kind, axis: s.axis, from: s.a, to: s.b, width: s.width, rect: s.rect, impasse: s.deadEnd || undefined })),
    );
    break;
  }
  case 'zones':
    print([...world.zones.values()].map((z) => ({ id: z.id, label: z.label, points: z.points.length })));
    break;
  case 'entity': {
    const e = world.byId.get(rest[0] ?? '');
    print(e ? { entity: e, bounds: world.bounds.get(e.id) } : { error: `entité inconnue : ${rest[0]}` });
    break;
  }
  case 'rect': {
    const [x, y, w, h] = nums(4);
    print(world.index.query({ x, y, w, h }).map(brief));
    break;
  }
  case 'near': {
    const [x, y] = nums(2);
    const r = Number(rest[2] ?? 60);
    const list = world.index
      .query({ x: x - r - 60, y: y - r - 60, w: 2 * r + 120, h: 2 * r + 120 })
      .filter((e) => Math.hypot(e.x - x, e.y - y) <= r)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    print(list.map(brief));
    break;
  }
  case 'ground': {
    const [x, y] = nums(2);
    const p = { x, y };
    const b = buildingAt(world, p);
    print({
      point: p,
      ground: groundAt(world, p),
      walkable: isWalkable(world, p),
      crosswalk: onCrosswalk(world, p),
      hiddenByRoof: isHiddenByRoof(world, p),
      building: b ? { id: b.id, style: b.style, sign: b.sign } : null,
      district: districtName(world, p),
      nearestStreet: nearestStreet(meta, p),
    });
    break;
  }
  case 'free': {
    const [x, y, w, h] = nums(4);
    const step = Number(rest[4] ?? 12);
    print(findFreeSpots(world, { x, y, w, h }, { step }));
    break;
  }
  case 'lookalikes': {
    const e = world.byId.get(rest[0] ?? '');
    if (!e || e.kind !== 'person') {
      print({ error: `personne inconnue : ${rest[0]}` });
      break;
    }
    const d = Number(rest[1] ?? 3);
    print(
      world.entities
        .filter((o): o is PersonEntity => o.kind === 'person' && o.id !== e.id)
        .map((o) => ({ id: o.id, x: o.x, y: o.y, distance: appearanceDistance(o.appearance, e.appearance), look: describe(o) }))
        .filter((o) => o.distance < d)
        .sort((a, b) => a.distance - b.distance),
    );
    break;
  }
  case 'stats': {
    const counts: Record<string, number> = {};
    const sub: Record<string, number> = {};
    for (const e of world.entities) {
      counts[e.kind] = (counts[e.kind] ?? 0) + 1;
      const k = e.kind === 'prop' ? `prop:${e.prop}` : e.kind === 'vehicle' ? `vehicle:${e.vehicle}` : e.kind === 'tree' ? `tree:${e.tree}` : e.kind === 'building' ? `building:${e.style}` : `pose:${e.pose}`;
      sub[k] = (sub[k] ?? 0) + 1;
    }
    print({ seed: world.seed, size: [world.width, world.height], counts, zones: world.zones.size, streets: meta.streets.length, blocks: meta.blocks.length, detail: sub });
    break;
  }
  default:
    console.error(`Commande inconnue : ${cmd}`);
    process.exit(2);
}
