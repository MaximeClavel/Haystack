// Mobilier urbain le long des rues : réverbères réguliers, poubelles, boîtes aux lettres, bouches
// d'incendie, cabines, arrêts de bus (avec bus), plaques de rue, plaques d'égout, flaques,
// terrasses devant les cafés et bars générés.
import type { Color, PropKind } from '../types';
import type { Rng } from '../lib/rng';
import { PROP_SIZE } from '../art/bounds';
import { addProp, addVehicle, makeRng, type Gen } from './context';
import { F_BUILDING, F_HIDDEN, F_LINE, F_PERSON, F_RAIL, F_SOLID, F_WATER } from './raster';
import type { Street } from './layout';
import { terrace } from './areas';
import { randomAppearance } from './appearance';
import { plate } from './names';

const SIDEWALK_BLOCK = F_WATER | F_BUILDING | F_HIDDEN | F_SOLID | F_PERSON | F_LINE | F_RAIL;

/** Pose un objet sur un trottoir (vérification exacte du sol sous sa base). */
function sidewalkProp(g: Gen, prop: PropKind, x: number, y: number, opts: Parameters<typeof addProp>[4] = {}): boolean {
  const [w0] = PROP_SIZE[prop];
  const w = w0 * (opts.scale ?? 1);
  if (g.raster.any({ x: x - w / 2, y: y - 3, w, h: 4 }, SIDEWALK_BLOCK)) return false;
  for (const dx of [-w / 2 + 0.5, 0, w / 2 - 0.5]) if (g.gi.kindAt(x + dx, y - 0.5) !== 'sidewalk') return false;
  if (g.gi.onCrosswalk(x, y)) return false;
  addProp(g, prop, x, y, opts);
  return true;
}

export function shortStreetName(name: string): string {
  return name
    .replace(/^Boulevard /, 'BD ')
    .replace(/^Avenue /, 'AV. ')
    .replace(/^Rue /, 'R. ')
    .replace(/^Impasse /, 'IMP. ')
    .replace(/^Chemin /, 'CH. ')
    .replace(/^Route /, 'RTE ')
    .toUpperCase();
}

interface SidewalkLine {
  street: Street;
  /** Côté : 'n'/'s' pour une rue est-ouest, 'w'/'e' pour une rue nord-sud. */
  side: 'n' | 's' | 'w' | 'e';
  /** Coordonnée fixe près de la bordure (côté chaussée) et près des façades. */
  curb: number;
  inner: number;
  from: number;
  to: number;
}

/** Lignes de trottoir de toutes les rues droites (pour le mobilier et la foule). */
export function sidewalkLines(g: Gen): SidewalkLine[] {
  const out: SidewalkLine[] = [];
  for (const s of g.plan.streets) {
    if (s.axis === 'd' || s.sidewalk <= 0) continue;
    const r = s.rect;
    const sw = s.sidewalk;
    if (s.axis === 'h') {
      out.push({ street: s, side: 'n', curb: r.y + sw - 2.5, inner: r.y + 3, from: r.x, to: r.x + r.w });
      out.push({ street: s, side: 's', curb: r.y + r.h - sw + 3.5, inner: r.y + r.h - 1.5, from: r.x, to: r.x + r.w });
    } else {
      const y0 = s.deadEnd ? Math.min(s.a.y, s.b.y) : r.y;
      out.push({ street: s, side: 'w', curb: r.x + sw - 3, inner: r.x + 3, from: y0, to: r.y + r.h });
      out.push({ street: s, side: 'e', curb: r.x + r.w - sw + 3, inner: r.x + r.w - 3, from: y0, to: r.y + r.h });
    }
  }
  return out;
}

const at = (l: SidewalkLine, t: number, onCurb: boolean): [number, number] => {
  const c = onCurb ? l.curb : l.inner;
  return l.side === 'n' || l.side === 's' ? [t, c] : [c, t];
};

export function placeStreetFurniture(g: Gen): void {
  const rng = makeRng(g.seed, 'furniture');
  const lines = sidewalkLines(g);
  levelCrossings(g, rng);
  const oneSide = new Map<string, 'a' | 'b'>();
  for (const l of lines) {
    const s = l.street;
    // Réverbères réguliers côté chaussée : des deux côtés (en quinconce) sur les avenues, d'un seul sinon.
    const sideAB = l.side === 'n' || l.side === 'w' ? 'a' : 'b';
    if (!oneSide.has(s.id)) oneSide.set(s.id, rng.chance(0.5) ? 'a' : 'b');
    const lampsHere = s.kind === 'avenue' || oneSide.get(s.id) === sideAB;
    const spacing = s.kind === 'avenue' ? 170 : s.kind === 'lane' ? 190 : 160;
    const phase = rng.int(10, spacing);
    const offset = sideAB === 'b' ? spacing / 2 : 0;
    for (let t = l.from + phase + offset; lampsHere && t < l.to - 10; t += spacing) {
      const [x, y] = at(l, t, true);
      if (!sidewalkProp(g, 'lamp', x, y)) sidewalkProp(g, 'lamp', l.side === 'n' || l.side === 's' ? x + 14 : x, l.side === 'n' || l.side === 's' ? y : y + 14);
    }
    // Poubelles, boîtes aux lettres, bouches d'incendie, cabines côté façades
    for (let t = l.from + rng.int(20, 200); t < l.to - 10; t += rng.int(160, 420)) {
      const [x, y] = at(l, t, rng.chance(0.5));
      const kind = rng.weighted<PropKind>([['bin', 50], ['hydrant', 20], ['mailbox', 12], ['phonebooth', 4], ['manhole', 0], ['puddle', 4], ['sign', 0]]);
      const opts: Parameters<typeof addProp>[4] = {};
      if (kind === 'hydrant') opts.color = 'red';
      if (kind === 'mailbox') opts.color = 'yellow';
      if (kind === 'phonebooth') opts.color = rng.pick<Color>(['red', 'blue']);
      if (kind === 'bin') opts.color = rng.pick<Color>(['green', 'grey', 'navy']);
      if (kind === 'puddle') opts.solid = false;
      sidewalkProp(g, kind, x, y, opts);
    }
    // Plaque de rue au début de la rue
    if (l.side === 'n' || l.side === 'w') {
      const [x, y] = at(l, l.from + 40, false);
      sidewalkProp(g, 'sign', x, y, { label: shortStreetName(s.name), color: 'navy' });
    }
  }
  busStops(g, rng);
  manholes(g, rng);
  cafeTerraces(g, rng);
}

/** Passages à niveau : barrières rouges et panneaux de part et d'autre de la voie ferrée. */
function levelCrossings(g: Gen, rng: Rng): void {
  for (const s of g.plan.streets) {
    if (s.axis !== 'h' || s.rect.x > 200 || s.rect.x + s.rect.w < 320) continue;
    const r = s.rect;
    for (const x of [203, 317]) {
      sidewalkProp(g, 'barrier', x, r.y + s.sidewalk - 3, { color: 'red' });
      sidewalkProp(g, 'barrier', x, r.y + r.h - 3, { color: 'red' });
    }
    sidewalkProp(g, 'sign', 186, r.y + s.sidewalk - 3, { label: 'TRAIN' });
    if (rng.chance(0.7)) sidewalkProp(g, 'sign', 334, r.y + r.h - 3, { label: 'TRAIN' });
  }
}

/** Arrêts de bus sur les grands axes est-ouest, avec un bus à certains arrêts. */
function busStops(g: Gen, rng: Rng): void {
  for (const s of g.plan.streets) {
    if (s.kind !== 'avenue' || s.axis !== 'h') continue;
    const r = s.rect;
    const rr = s.roadRect;
    for (let x = r.x + rng.int(300, 700); x < r.x + r.w - 200; x += rng.int(700, 1100)) {
      const north = rng.chance(0.5);
      const y = north ? r.y + s.sidewalk - 1.5 : r.y + r.h - 1.5;
      if (!sidewalkProp(g, 'busstop', x, y, { color: 'blue' })) continue;
      // Voyageurs qui attendent
      for (let i = 0; i < rng.int(1, 3); i++) {
        g.slots.push({ x: x - 18 - i * 11, y: y - 1, role: rng.pick(['adult', 'elder', 'student', 'business'] as const), pose: rng.chance(0.3) ? 'phone' : 'stand', facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.8 });
      }
      if (rng.chance(0.45)) {
        const by = north ? rr.y + rr.h / 2 - 3 : rr.y + rr.h - 3;
        const bx = x + (north ? -20 : 20);
        if (!g.raster.any({ x: bx - 52, y: by - 8, w: 104, h: 9 }, F_SOLID) && g.raster.all({ x: bx - 50, y: by - 6, w: 100, h: 6 }, 1)) {
          addVehicle(g, 'bus', bx, by, north ? 'left' : 'right', rng.pick<Color>(['green', 'blue', 'red', 'yellow']), { driver: randomAppearance(rng), label: `LIGNE ${rng.int(1, 9)}` });
        }
      }
    }
  }
}

function manholes(g: Gen, rng: Rng): void {
  for (const s of g.plan.streets) {
    if (s.axis !== 'h') continue;
    const rr = s.roadRect;
    for (let x = rr.x + rng.int(50, 300); x < rr.x + rr.w - 30; x += rng.int(260, 520)) {
      const y = rr.y + rr.h / 2 + rng.int(-4, 4);
      if (g.raster.any({ x: x - 7, y: y - 4, w: 14, h: 8 }, F_SOLID)) continue;
      if (g.gi.kindAt(x, y) !== 'road' || g.gi.onCrosswalk(x, y)) continue;
      addProp(g, 'manhole', x, y, { solid: false, variant: rng.chance(0.03) ? 'open' : undefined });
    }
  }
}

/** Terrasses sur le trottoir devant les cafés et bars générés dont la façade donne sur une rue. */
function cafeTerraces(g: Gen, rng: Rng): void {
  for (const b of g.buildings) {
    if (!b.id.startsWith('b.')) continue;
    if (b.style !== 'cafe' && b.style !== 'bar') continue;
    const f = b.footprint;
    const y1 = f.y + f.h;
    if (g.gi.kindAt(f.x + f.w / 2, y1 + 5) !== 'sidewalk' && g.gi.kindAt(f.x + f.w / 2, y1 + 8) !== 'sidewalk') continue;
    if (!rng.chance(0.8)) continue;
    terrace(g, rng, { x: f.x + 4, y: y1 - 5, w: f.w - 8, h: 10 }, { parasol: 0.5, chance: 0.6 });
    if (rng.chance(0.15)) g.slots.push({ x: f.x + f.w - 6, y: y1 + 6, role: 'chef', pose: 'stand', facing: 'left', chance: 1 });
  }
  void plate;
}
