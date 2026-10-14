// Interroger le monde généré depuis le terminal (aide au placement des scènes d'enquête).
//
// Usage (via `npm run world -- <commande>`) :
//   landmarks                 liste des lieux remarquables (id, nom, emprise)
//   districts                 liste des quartiers
//   entity <id>               une entité et son emprise
//   rect <x> <y> <w> <h>      entités dont l'emprise intersecte le rectangle
//   stats                     nombre d'entités par type
import { buildWorld } from '../src/world';
import { CASES } from '../src/content';

const [cmd = 'stats', ...rest] = process.argv.slice(2);
const world = buildWorld({ cases: CASES });

function print(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

switch (cmd) {
  case 'landmarks':
    print(world.landmarks);
    break;
  case 'districts':
    print(world.districts);
    break;
  case 'entity': {
    const e = world.byId.get(rest[0] ?? '');
    print(e ? { entity: e, bounds: world.bounds.get(e.id) } : { error: `entité inconnue : ${rest[0]}` });
    break;
  }
  case 'rect': {
    const [x, y, w, h] = rest.map(Number);
    print(world.index.query({ x, y, w, h }).map((e) => ({ id: e.id, kind: e.kind, x: e.x, y: e.y })));
    break;
  }
  case 'stats': {
    const counts: Record<string, number> = {};
    for (const e of world.entities) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    print({ seed: world.seed, size: [world.width, world.height], counts, zones: world.zones.size });
    break;
  }
  default:
    console.error(`Commande inconnue : ${cmd}`);
    process.exit(2);
}
