// Végétation et petits aménagements des îlots : alignements d'arbres sur les avenues et les quais,
// arbres, massifs et chats dans les cours, jardins des maisons (clôtures, haies, arbres fruitiers).
import type { Color, Rect, TreeKind } from '../types';
import type { Rng } from '../lib/rng';
import { addProp, addTree, makeRng, tryProp, type Gen } from './context';
import { F_BUILDING, F_HIDDEN, F_LINE, F_PATH, F_PERSON, F_RAIL, F_ROAD, F_SOLID, F_WATER } from './raster';
import { RIVER } from './layoutSpec';

const TREE_BLOCK = F_WATER | F_BUILDING | F_HIDDEN | F_SOLID | F_PERSON | F_LINE | F_RAIL | F_ROAD | F_PATH;

function tryTree(g: Gen, kind: TreeKind, x: number, y: number, size: number, opts: { ground?: string[] } = {}): boolean {
  if (g.raster.any({ x: x - 5, y: y - 5, w: 10, h: 6 }, TREE_BLOCK)) return false;
  if (opts.ground) {
    const k = g.gi.kindAt(x, y - 1);
    if (!opts.ground.includes(k)) return false;
    if (g.gi.onCrosswalk(x, y)) return false;
  }
  // Pas d'arbre juste devant la façade d'un lieu remarquable (il la masquerait).
  for (const b of g.bandHash.query({ x: x - 12, y: y - size, w: 24, h: size })) {
    if (b.tags?.includes('landmark') && y > b.footprint.y + b.footprint.h - 2 && y < b.footprint.y + b.footprint.h + size * 0.9) return false;
  }
  addTree(g, kind, x, y, size);
  return true;
}

export function plantTrees(g: Gen): void {
  const rng = makeRng(g.seed, 'vegetation');
  avenueTrees(g, rng);
  quayTrees(g, rng);
  for (const b of g.plan.blocks) {
    if (b.kind === 'urban' || b.kind === 'industrial') courtyard(g, rng, b.rect, b.kind === 'industrial');
    else if (b.kind === 'houses') gardens(g, rng, b.rect);
    else if (b.kind === 'empty') {
      for (let i = 0; i < 3; i++) tryTree(g, 'round', b.rect.x + rng.float() * b.rect.w, b.rect.y + rng.float() * b.rect.h, rng.int(34, 48));
    }
  }
}

function avenueTrees(g: Gen, rng: Rng): void {
  for (const s of g.plan.streets) {
    if (s.kind !== 'avenue') continue;
    const r = s.rect;
    const kind: TreeKind = s.id === 'av-parc' || s.id === 'quai-nord' ? 'poplar' : 'round';
    const size = (): number => (kind === 'poplar' ? rng.int(52, 68) : rng.int(40, 52));
    if (s.axis === 'v') {
      for (let y = r.y + rng.int(20, 60); y < r.y + r.h; y += rng.int(66, 86)) {
        if (y > RIVER.y0 - 30 && y < RIVER.y1 + 30) continue;
        tryTree(g, kind, r.x + 5, y, size(), { ground: ['sidewalk'] });
        tryTree(g, kind, r.x + r.w - 5, y + 30, size(), { ground: ['sidewalk'] });
      }
    } else {
      // Est-ouest : seulement le trottoir sud (le feuillage couvre la chaussée, pas les façades).
      for (let x = r.x + rng.int(20, 60); x < r.x + r.w; x += rng.int(80, 110)) {
        tryTree(g, kind, x, r.y + r.h - 5, size(), { ground: ['sidewalk'] });
      }
    }
  }
}

function quayTrees(g: Gen, rng: Rng): void {
  for (let x = 330; x < 6380; x += rng.int(70, 100)) {
    if (Math.abs(x - 2200) < 60 || Math.abs(x - 4250) < 60) continue;
    tryTree(g, 'poplar', x, RIVER.y0 - 6, rng.int(54, 66), { ground: ['dock'] });
    if (x < 4250) tryTree(g, 'round', x + 35, RIVER.y1 + 14, rng.int(40, 50), { ground: ['dock'] });
  }
  // Bancs face à l'eau sur le quai nord
  for (let x = 420; x < 6300; x += rng.int(240, 420)) {
    if (Math.abs(x - 2200) < 80 || Math.abs(x - 4250) < 80) continue;
    if (tryProp(g, 'bench', x, RIVER.y0 - 3, { color: 'green' })) {
      g.slots.push({ x: x + rng.int(-4, 4), y: RIVER.y0 - 2.4, role: rng.chance(0.5) ? 'elder' : 'adult', pose: rng.chance(0.3) ? 'read' : 'sit', facing: 'right', chance: 0.6, trusted: true, sortY: RIVER.y0 - 2.4 });
    }
  }
}

/** Points libres (visibles, praticables) d'un rectangle, pour décorer une cour. */
function freePoints(g: Gen, rng: Rng, r: Rect, n: number, margin = 10): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n * 6 && out.length < n; i++) {
    const x = r.x + margin + rng.float() * (r.w - 2 * margin);
    const y = r.y + margin + rng.float() * (r.h - 2 * margin);
    if (g.raster.any({ x: x - 8, y: y - 6, w: 16, h: 8 }, TREE_BLOCK)) continue;
    out.push([x, y]);
  }
  return out;
}

function courtyard(g: Gen, rng: Rng, r: Rect, industrial: boolean): void {
  const area = r.w * r.h;
  const nTrees = industrial ? rng.int(0, 2) : Math.min(6, Math.round((area / 40000) * rng.range(0.6, 1.6)));
  for (const [x, y] of freePoints(g, rng, r, nTrees, 14)) {
    tryTree(g, rng.weighted([['round', 70], ['poplar', 15], ['bare', 15]] as const), x, y, rng.int(36, 52));
  }
  const nProps = Math.round((area / 30000) * rng.range(0.5, 1.5));
  for (const [x, y] of freePoints(g, rng, r, nProps, 8)) {
    const kind = industrial
      ? rng.weighted([['crate', 30], ['barrel', 25], ['pallet', 25], ['trashbag', 10], ['cart', 10]] as const)
      : rng.weighted([['bin', 22], ['bush', 20], ['flowerbed', 15], ['bench', 12], ['trashbag', 8], ['crate', 6], ['cat', 10], ['puddle', 4], ['tent', 1], ['cart', 2]] as const);
    const opts: Parameters<typeof addProp>[4] = {};
    if (kind === 'flowerbed') opts.color = rng.pick<Color>(['red', 'pink', 'yellow', 'purple', 'white']);
    if (kind === 'cat') {
      opts.color = rng.pick<Color>(['black', 'white', 'orange', 'grey', 'brown']);
      opts.facing = rng.chance(0.5) ? 'left' : 'right';
    }
    if (kind === 'puddle') opts.solid = false;
    if (kind === 'trashbag') opts.color = 'black';
    if (tryProp(g, kind, x, y, opts) && kind === 'bench' && rng.chance(0.5)) {
      g.slots.push({ x, y: y + 0.6, role: rng.chance(0.5) ? 'elder' : 'adult', pose: 'sit', facing: 'right', chance: 1, trusted: true, sortY: y + 0.6, emote: rng.chance(0.15) ? 'sleep' : undefined });
    }
  }
}

/** Jardins des îlots de maisons : clôture sur rue, haies entre les lots, arbres fruitiers, massifs. */
function gardens(g: Gen, rng: Rng, r: Rect): void {
  const houses = g.buildings.filter((b) => {
    const f = b.footprint;
    return f.x >= r.x - 1 && f.x + f.w <= r.x + r.w + 1 && f.y >= r.y - 1 && f.y + f.h <= r.y + r.h + 1;
  });
  for (const h of houses) {
    const f = h.footprint;
    // Limite sud du jardin de devant : la rue, ou le toit de la rangée suivante.
    let south = r.y + r.h - 1;
    for (const o of g.bandHash.query({ x: f.x, y: f.y + f.h + 1, w: f.w, h: r.y + r.h - (f.y + f.h) })) {
      if (o === h) continue;
      const top = o.footprint.y - o.height;
      if (top > f.y + f.h) south = Math.min(south, top - 2);
    }
    const depth = south - (f.y + f.h);
    if (depth < 10) continue;
    const lx0 = f.x - 6;
    const lx1 = f.x + f.w + 6;
    const kind = rng.chance(0.55) ? 'fence' : 'hedge';
    const gate = f.x + f.w * (0.3 + rng.float() * 0.4);
    g.gb.line(kind, [{ x: lx0, y: south }, { x: gate - 7, y: south }], kind === 'hedge' ? 4 : 2);
    g.gb.line(kind, [{ x: gate + 7, y: south }, { x: lx1, y: south }], kind === 'hedge' ? 4 : 2);
    if (depth > 24) {
      g.gb.line('hedge', [{ x: lx0, y: f.y + f.h + 2 }, { x: lx0, y: south }], 4);
      // Arbre fruitier ou massif dans le jardin
      if (rng.chance(0.55)) {
        const tx = rng.chance(0.5) ? f.x + 10 : f.x + f.w - 10;
        tryTree(g, rng.chance(0.85) ? 'round' : 'bare', tx, south - 6, rng.int(30, 44));
      }
      if (rng.chance(0.5)) tryProp(g, rng.chance(0.6) ? 'flowerbed' : 'bush', f.x + f.w / 2 + rng.int(-10, 10), south - rng.int(6, Math.max(7, depth - 6)), { color: rng.pick<Color>(['red', 'pink', 'yellow', 'purple', 'orange']) });
      if (rng.chance(0.08)) tryProp(g, 'cat', f.x + rng.int(4, f.w - 4), f.y + f.h + 8, { color: rng.pick<Color>(['black', 'orange', 'grey', 'white']), facing: rng.chance(0.5) ? 'left' : 'right' });
      if (rng.chance(0.06)) tryProp(g, 'dog', f.x + rng.int(8, f.w - 8), south - 6, { variant: rng.chance(0.5) ? 'small' : 'big', color: rng.pick<Color>(['brown', 'black', 'white', 'beige']), facing: rng.chance(0.5) ? 'left' : 'right' });
    }
  }
}
