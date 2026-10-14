// Sonde de placement : npx tsx tools/content/probe.ts x,y [x,y …]
// Pour chaque point : sol, praticable, passage piéton, caché par un toit, bâtiment, entités proches (monde sans enquêtes).
import { buildWorld, groundAt, isWalkable, onCrosswalk, isHiddenByRoof, buildingAt } from '../../src/world';

const world = buildWorld({ cases: [] });
for (const arg of process.argv.slice(2)) {
  const [x, y] = arg.split(',').map(Number);
  const p = { x, y };
  const b = buildingAt(world, p);
  const near = world.index
    .query({ x: x - 16, y: y - 16, w: 32, h: 32 })
    .filter((e) => e.kind !== 'building' && Math.hypot(e.x - x, e.y - y) < 16)
    .map((e) => `${e.id}:${e.kind === 'prop' ? e.prop : e.kind}`);
  console.log(
    `${x},${y}  ${groundAt(world, p)}${isWalkable(world, p) ? '' : ' NON-PRATICABLE'}${onCrosswalk(world, p) ? ' passage' : ''}${isHiddenByRoof(world, p) ? ' CACHÉ' : ''}${b ? ' dans ' + b.id : ''}  ${near.join(' ')}`,
  );
}
