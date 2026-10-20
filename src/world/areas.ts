// Aménagement des lieux : parc, marché, places, gare, école, chantier, cimetière, port, jardins
// ouvriers, squares… Ce module pose objets, allées, clôtures, arbres « de composition » et réserve
// des places (slots) pour les personnages typiques (vendeurs, musiciens, policiers…).
import type { Color, PropEntity, PropKind, Rect, Vec2 } from '../types';
import { Rng } from '../lib/rng';
import { LANDMARKS } from './layoutSpec';
import { ellipsePolygon, pointInPolygon, rectPoints, rectXY } from './geom';
import { addBuilding, canPlaceBuilding } from './buildings';
import {
  addProp,
  addTree,
  addVehicle,
  makeRng,
  tryProp,
  type Gen,
  type Slot,
} from './context';
import { pondPolygon, PONTOON } from './ground';
import { F_HIDDEN, F_PATH, F_SOLID, F_WATER } from './raster';
import { PROP_SIZE } from '../art/bounds';
import { randomAppearance } from './appearance';
import { BOAT_NAMES, GRAFFITI, plate } from './names';

const CAR_COLORS: Color[] = ['red', 'blue', 'navy', 'green', 'yellow', 'white', 'black', 'grey', 'beige', 'orange', 'brown', 'olive', 'purple', 'pink'];

export function landmarkRect(id: string): Rect {
  const lm = LANDMARKS.find((l) => l.id === id);
  if (!lm) throw new Error(`lieu inconnu : ${id}`);
  return lm.rect;
}

function spotRect(g: Gen, id: string): Rect {
  const s = g.plan.spots.find((sp) => sp.id === id);
  if (!s) throw new Error(`emplacement inconnu : ${id}`);
  return s.rect;
}

/** Objet d'un lieu remarquable (id `lm.<id>`), non retirable par les enquêtes. */
function landmarkProp(g: Gen, id: string, prop: PropKind, x: number, y: number, extra: Partial<PropEntity> = {}): void {
  const e: PropEntity = { id: `lm.${id}`, kind: 'prop', prop, x, y, tags: ['landmark'], ...extra };
  g.entities.push(e);
  // Toute la surface au sol de l'objet est réservée (personne dans le kiosque ou la fontaine).
  const [w, h] = PROP_SIZE[prop];
  const depth = prop === 'bandstand' ? 46 : prop === 'fountain' ? 24 : 8;
  g.raster.markRect({ x: x - w / 2 - 2, y: y - depth, w: w + 4, h: depth + 1 }, F_SOLID);
  g.raster.markRect({ x: x - w / 2, y: y - h * 0.8, w, h: h * 0.8 }, F_HIDDEN);
}

function slot(g: Gen, s: Slot): void {
  g.slots.push(s);
}

/** Polyligne lissée d'une allée (points de passage). */
function path(g: Gen, pts: Vec2[], width = 14): void {
  g.gb.line('path', pts, width);
}

/** Points régulièrement espacés le long d'une polyligne (avec la direction locale). */
function alongPolyline(pts: Vec2[], step: number, offset0 = step / 2): { p: Vec2; dx: number; dy: number }[] {
  const out: { p: Vec2; dx: number; dy: number }[] = [];
  let carry = offset0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len === 0) continue;
    const dx = (b.x - a.x) / len;
    const dy = (b.y - a.y) / len;
    let t = carry;
    while (t < len) {
      out.push({ p: { x: a.x + dx * t, y: a.y + dy * t }, dx, dy });
      t += step;
    }
    carry = t - len;
  }
  return out;
}

/** Bancs (et places assises) le long d'une allée, du côté nord pour que les assis soient visibles. */
function benchesAlong(g: Gen, rng: Rng, pts: Vec2[], step: number, chance = 0.55): void {
  for (const { p, dx, dy } of alongPolyline(pts, step)) {
    // Normale « nord » de l'allée
    let nx = -dy;
    let ny = dx;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    if (Math.abs(dx) < 0.3) {
      nx = 1;
      ny = 0;
    }
    const x = p.x + nx * 16;
    const y = p.y + ny * 16 + 4;
    const b = tryProp(g, 'bench', x, y, { color: rng.pick<Color>(['green', 'brown', 'navy']) });
    if (!b) continue;
    benchSeats(g, rng, x, y, chance);
    if (rng.chance(0.3)) tryProp(g, 'bin', x + 16, y);
  }
}

/** Places assises sur un banc. */
function benchSeats(g: Gen, rng: Rng, x: number, y: number, chance: number): void {
  const n = rng.weighted([[1, 50], [2, 40], [0, 10]] as const);
  for (let i = 0; i < n; i++) {
    const sx = n === 1 ? x + rng.int(-4, 4) : x + (i === 0 ? -5 : 5);
    slot(g, {
      x: sx,
      y: y + 0.6,
      role: rng.weighted([['adult', 50], ['elder', 30], ['student', 10], ['business', 10]] as const),
      pose: rng.weighted([['sit', 75], ['read', 25]] as const) === 'read' ? 'read' : 'sit',
      facing: i === 0 ? 'right' : 'left',
      chance,
      trusted: true,
      sortY: y + 0.6,
      emote: n === 2 && rng.chance(0.25) ? 'talk' : undefined,
    });
  }
}

/** Terrasse : tables, chaises, parasols et clients assis. */
export function terrace(g: Gen, rng: Rng, r: Rect, opts: { parasol?: number; chance?: number } = {}): void {
  const cols = Math.max(1, Math.floor((r.w - 6) / 34));
  const rows = Math.max(1, Math.floor((r.h + 4) / 26));
  const color = rng.pick<Color>(['red', 'white', 'green', 'yellow', 'blue', 'orange']);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = r.x + 17 + i * 34 + (j % 2) * 6;
      const y = r.y + 12 + j * 26;
      if (!tryProp(g, 'table', x, y, { color: 'white' })) continue;
      for (const side of [-1, 1] as const) {
        const cx = x + side * 10;
        addProp(g, 'chair', cx, y + 1, { facing: side < 0 ? 'right' : 'left', solid: false });
        slot(g, {
          x: cx,
          y: y + 1.6,
          role: rng.weighted([['adult', 60], ['elder', 15], ['business', 10], ['tourist', 10], ['student', 5]] as const),
          pose: 'sit',
          facing: side < 0 ? 'right' : 'left',
          chance: opts.chance ?? 0.6,
          trusted: true,
          sortY: y + 1.6,
          holding: rng.chance(0.12) ? 'bottle' : rng.chance(0.08) ? 'phone' : undefined,
          emote: rng.chance(0.2) ? 'talk' : rng.chance(0.04) ? 'heart' : undefined,
        });
      }
      if (rng.chance(opts.parasol ?? 0.5)) addProp(g, 'parasol', x, y + 2, { color, solid: false });
    }
  }
  // Serveur
  slot(g, { x: r.x + r.w - 8, y: r.y + r.h - 2, role: 'waiter', pose: 'carry', facing: 'left', chance: 0.8, holding: rng.chance(0.5) ? 'bottle' : 'none' });
}

/* ----------------------------------------------------------------------------
 * Bâtiments des zones qui en accueillent (entrepôts, cabanes des jardins ouvriers)
 * ------------------------------------------------------------------------- */

export function placeAreaBuildings(g: Gen): void {
  const rng = makeRng(g.seed, 'area-buildings');
  // Entrepôts du port : deux rangées, numérotées
  const ent = landmarkRect('entrepots');
  let n = 1;
  const rows: { y1?: number; top?: number; d: [number, number]; h: [number, number] }[] = [
    { y1: ent.y + ent.h - 14, d: [104, 124], h: [56, 70] },
    { top: ent.y + 4, d: [86, 104], h: [52, 62] },
  ];
  for (const row of rows) {
    let x = ent.x + rng.int(10, 30);
    while (x < ent.x + ent.w - 150) {
      const w = rng.int(170, 230);
      const d = rng.int(row.d[0], row.d[1]);
      const h = rng.int(row.h[0], row.h[1]);
      const f = row.y1 !== undefined ? { x, y: row.y1 - d, w, h: d } : { x, y: row.top! + h, w, h: d };
      if (f.x + f.w > ent.x + ent.w - 8) break;
      if (canPlaceBuilding(g, f, h, { inside: ent, gap: 4 })) {
        const features = [
          { kind: 'openDoor' as const, at: rng.chance(0.5) ? 0.3 : 0.7, floor: 0 },
          ...(rng.chance(0.4) ? [{ kind: 'graffiti' as const, at: 0.15 + rng.float() * 0.2, floor: 0, text: rng.pick(GRAFFITI) }] : []),
          ...(rng.chance(0.2) ? [{ kind: 'poster' as const, at: 0.8, floor: 0, text: 'FRET' }] : []),
        ];
        addBuilding(g, 'port', 'warehouse', f, h, rng.pick<Color>(['grey', 'brown', 'red', 'navy', 'blue', 'olive', 'beige']), rng.pick<Color>(['grey', 'black', 'olive', 'red']), {
          sign: `ENTREPÔT ${n++}`,
          features,
        });
      }
      x += w + rng.int(18, 34);
    }
  }

  // Jardins ouvriers : parcelles avec cabane ou serre
  const jo = landmarkRect('jardins-ouvriers');
  for (const plot of jardinsPlots(jo)) {
    const prng = new Rng((plot.x * 73856093) ^ (plot.y * 19349663) ^ g.seed);
    if (prng.chance(0.25)) continue;
    const style = prng.chance(0.55) ? 'shed' : 'greenhouse';
    const w = style === 'shed' ? prng.int(30, 44) : prng.int(44, 64);
    const d = style === 'shed' ? prng.int(22, 30) : prng.int(28, 40);
    const h = style === 'shed' ? prng.int(26, 34) : prng.int(26, 32);
    const right = prng.chance(0.5);
    const x = right ? plot.x + plot.w - w - 10 : plot.x + 10;
    const f = { x, y: plot.y + h + 8, w, h: d };
    if (canPlaceBuilding(g, f, h, { inside: jo, gap: 2 })) {
      addBuilding(g, 'jardins', style, f, h, style === 'greenhouse' ? 'white' : prng.pick<Color>(['brown', 'green', 'blue', 'red', 'olive', 'beige']), style === 'greenhouse' ? 'white' : prng.pick<Color>(['red', 'brown', 'green', 'black']), {
        features: style === 'shed' && prng.chance(0.3) ? [{ kind: 'openDoor', at: 0.5, floor: 0 }] : undefined,
      });
    }
  }
}

/** Parcelles des jardins ouvriers (allées principales en x = 700, 1000…, y = milieu). */
function jardinsPlots(jo: Rect): Rect[] {
  const xs = [jo.x, 700, 1000, 1300, 1600, jo.x + jo.w];
  const ymid = Math.round(jo.y + jo.h / 2);
  const ys = [jo.y, ymid, jo.y + jo.h];
  const out: Rect[] = [];
  for (let i = 0; i + 1 < xs.length; i++) {
    for (let j = 0; j + 1 < ys.length; j++) {
      const x0 = xs[i] + 8;
      const x1 = xs[i + 1] - 8;
      const y0 = ys[j] + 8;
      const y1 = ys[j + 1] - 8;
      const mx = Math.round((x0 + x1) / 2);
      const my = Math.round((y0 + y1) / 2);
      out.push(rectXY(x0, y0, mx - 3, my - 3), rectXY(mx + 3, y0, x1, my - 3), rectXY(x0, my + 3, mx - 3, y1), rectXY(mx + 3, my + 3, x1, y1));
    }
  }
  return out;
}

/* ----------------------------------------------------------------------------
 * Décor des lieux
 * ------------------------------------------------------------------------- */

export function decorateAreas(g: Gen): void {
  const rng = makeRng(g.seed, 'areas');
  grandPlace(g, rng);
  market(g, rng);
  gare(g, rng);
  barTerrace(g, rng);
  commissariat(g, rng);
  hopital(g, rng);
  garage(g, rng);
  ecole(g, rng);
  chantier(g, rng);
  cimetiere(g, rng);
  park(g, rng);
  parvis(g, rng);
  port(g, rng);
  jardinsOuvriers(g, rng);
  blocksSpecial(g, rng);
}

function grandPlace(g: Gen, rng: Rng): void {
  const gp = landmarkRect('grand-place');
  const f = landmarkRect('fontaine');
  const fx = f.x + f.w / 2;
  const fy = f.y + f.h;
  landmarkProp(g, 'fontaine', 'fountain', fx, fy);
  // Bancs en cercle autour de la fontaine
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = fx + Math.cos(a) * 130;
    const y = fy - 18 + Math.sin(a) * 95;
    if (tryProp(g, 'bench', x, y, { color: 'green' })) benchSeats(g, rng, x, y, 0.6);
  }
  for (const [dx, dy] of [[-80, -70], [80, -70], [-80, 60], [80, 60]]) tryProp(g, 'flowerbed', fx + dx, fy + dy, { color: rng.pick<Color>(['red', 'pink', 'yellow', 'purple']) });
  for (const [x, y] of [[gp.x + 14, gp.y + 30], [gp.x + gp.w - 14, gp.y + 30], [gp.x + 14, gp.y + gp.h - 6], [gp.x + gp.w - 14, gp.y + gp.h - 6], [fx - 170, fy], [fx + 170, fy]]) tryProp(g, 'lamp', x, y);
  // Platanes le long des côtés est et ouest
  for (let y = gp.y + 60; y < gp.y + gp.h - 20; y += 72) {
    addTree(g, 'round', gp.x + 34, y, rng.int(46, 58));
    addTree(g, 'round', gp.x + gp.w - 34, y, rng.int(46, 58));
  }
  tryProp(g, 'kiosk', gp.x + 120, gp.y + gp.h - 60, { color: 'green', label: 'JOURNAUX' });
  slot(g, { x: gp.x + 140, y: gp.y + gp.h - 56, role: 'vendor', pose: 'stand', facing: 'left', chance: 1, holding: 'letter' });
  tryProp(g, 'phonebooth', gp.x + 70, gp.y + gp.h - 40, { color: 'red' });
  for (let i = 0; i < 6; i++) tryProp(g, 'pigeons', gp.x + rng.int(60, gp.w - 60), gp.y + rng.int(80, gp.h - 40));
  for (const x of [gp.x + 200, gp.x + gp.w - 200]) tryProp(g, 'bin', x, gp.y + gp.h - 30);
  // Terrasse du Café du Centre (au sud de sa façade)
  const cafe = landmarkRect('cafe-du-centre');
  terrace(g, rng, rectXY(cafe.x + 6, cafe.y + cafe.h + 14, cafe.x + cafe.w - 4, cafe.y + cafe.h + 70), { parasol: 0.7, chance: 0.7 });
  // Musicien de rue et camelot
  slot(g, { x: fx - 60, y: fy + 110, role: 'musician', pose: 'stand', facing: 'right', chance: 1, emote: 'music' });
  slot(g, { x: fx + 200, y: fy - 150, role: 'tourist', pose: 'point', facing: 'left', chance: 1, holding: 'map' });
  // Jardin de l'Hôtel de Ville
  const jh = spotRect(g, 'jardin-hdv');
  path(g, [{ x: jh.x, y: jh.y + 70 }, { x: jh.x + jh.w, y: jh.y + 70 }], 12);
  for (let x = jh.x + 40; x < jh.x + jh.w - 20; x += 90) {
    addTree(g, rng.chance(0.7) ? 'round' : 'poplar', x + rng.int(-10, 10), jh.y + 40 + rng.int(-8, 8), rng.int(40, 56));
    if (rng.chance(0.6) && tryProp(g, 'bench', x + 40, jh.y + 56, { color: 'green' })) benchSeats(g, rng, x + 40, jh.y + 56, 0.5);
    tryProp(g, 'flowerbed', x + 20, jh.y + 106, { color: rng.pick<Color>(['red', 'yellow', 'pink']) });
  }
}

function market(g: Gen, rng: Rng): void {
  const m = landmarkRect('halles');
  const awnings: Color[] = ['red', 'green', 'blue', 'yellow', 'orange', 'white', 'purple', 'pink'];
  let k = 0;
  const stalls: [number, number][] = [];
  for (let y = m.y + 70; y < m.y + m.h - 20; y += 88) {
    let x = m.x + 40;
    let inGroup = 0;
    while (x + 34 < m.x + m.w - 30) {
      const cx = x + 17;
      if (tryProp(g, 'stall', cx, y, { color: awnings[k++ % awnings.length] })) stalls.push([cx, y]);
      x += 40;
      if (++inGroup === 4) {
        inGroup = 0;
        x += 30;
      }
    }
  }
  for (const [cx, y] of stalls) {
    slot(g, { x: cx + rng.int(-6, 6), y: y - 7, role: 'vendor', pose: rng.chance(0.2) ? 'wave' : 'stand', facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.95, trusted: true, sortY: y - 7, emote: rng.chance(0.15) ? 'exclaim' : undefined });
    // Cagettes devant l'étal
    if (rng.chance(0.6)) tryProp(g, 'crate', cx + rng.int(-10, 10), y + 9, { color: rng.pick<Color>(['brown', 'beige', 'green']) });
    if (rng.chance(0.5)) slot(g, { x: cx + rng.int(-12, 12), y: y + 18, role: rng.weighted([['adult', 60], ['elder', 30], ['chef', 4], ['child', 6]] as const), pose: rng.chance(0.2) ? 'point' : 'stand', facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.9, holding: rng.chance(0.25) ? 'baguette' : rng.chance(0.2) ? 'box' : undefined, emote: rng.chance(0.2) ? 'talk' : undefined });
  }
  for (let i = 0; i < 4; i++) tryProp(g, 'cart', m.x + rng.int(40, m.w - 40), m.y + rng.int(40, m.h - 30), { color: 'brown' });
  for (let i = 0; i < 4; i++) tryProp(g, 'pigeons', m.x + rng.int(30, m.w - 30), m.y + rng.int(30, m.h - 20));
  for (const [x, y] of [[m.x + 10, m.y + 10], [m.x + m.w - 10, m.y + 10], [m.x + 10, m.y + m.h - 4], [m.x + m.w - 10, m.y + m.h - 4]]) tryProp(g, 'lamp', x, y);
  // Camions de livraison garés rue des Halles (voie nord, vers l'ouest)
  for (const [x, v] of [[2620, 'truck'], [2760, 'van'], [2950, 'truck']] as const) {
    addVehicle(g, v, x, 916, 'left', rng.pick<Color>(['white', 'blue', 'green', 'red']), { driver: rng.chance(0.4) ? randomAppearance(rng) : undefined, label: plate(rng) });
  }
}

function gare(g: Gen, rng: Rng): void {
  const pv = landmarkRect('parvis-gare');
  tryProp(g, 'kiosk', pv.x + pv.w - 80, pv.y + 120, { color: 'navy', label: 'PRESSE' });
  slot(g, { x: pv.x + pv.w - 62, y: pv.y + 124, role: 'vendor', pose: 'stand', facing: 'left', chance: 1, holding: 'letter' });
  for (let x = pv.x + 100; x < pv.x + pv.w - 160; x += 110) if (tryProp(g, 'bench', x, pv.y + 190, { color: 'navy' })) benchSeats(g, rng, x, pv.y + 190, 0.65);
  for (const [x, y] of [[pv.x + 20, pv.y + pv.h - 4], [pv.x + pv.w - 20, pv.y + pv.h - 4], [pv.x + 360, pv.y + 70], [pv.x + 20, pv.y + 40], [pv.x + pv.w - 20, pv.y + 40]]) tryProp(g, 'lamp', x, y);
  tryProp(g, 'phonebooth', pv.x + 40, pv.y + 110, { color: 'red' });
  tryProp(g, 'sign', pv.x + pv.w - 30, pv.y + pv.h - 8, { label: 'TAXIS' });
  tryProp(g, 'sign', pv.x + 30, pv.y + pv.h - 8, { label: 'SORTIE' });
  for (let i = 0; i < 5; i++) tryProp(g, 'pigeons', pv.x + rng.int(40, pv.w - 40), pv.y + rng.int(30, pv.h - 30));
  tryProp(g, 'bin', pv.x + 300, pv.y + 186);
  tryProp(g, 'bin', pv.x + 520, pv.y + 186);
  // Taxis en file rue de la Gare (voie nord, vers l'ouest), un bus à l'arrêt plus loin
  let tx = 560;
  for (let i = 0; i < 5; i++) {
    addVehicle(g, 'taxi', tx, 1846, 'left', rng.chance(0.7) ? 'black' : 'yellow', { driver: randomAppearance(rng), label: plate(rng) });
    if (i === 1) slot(g, { x: tx + 8, y: 1817, role: 'adult', pose: 'stand', facing: 'left', chance: 1, emote: 'talk', trusted: true });
    tx += 58;
  }
  tryProp(g, 'busstop', 1000, 1829, { color: 'blue' });
  addVehicle(g, 'bus', 1000, 1846, 'left', 'green', { driver: randomAppearance(rng), label: 'LIGNE 3' });
  // Quais de la gare
  const q = spotRect(g, 'quais-gare');
  for (let y = q.y + 70; y < q.y + q.h - 30; y += 110) {
    if (tryProp(g, 'bench', q.x + 90, y, { color: 'navy' })) benchSeats(g, rng, q.x + 90, y, 0.6);
    tryProp(g, 'lamp', q.x + 130, y - 50);
    tryProp(g, 'bin', q.x + 116, y);
  }
  tryProp(g, 'sign', q.x + 40, q.y + 110, { label: 'QUAI 1' });
  tryProp(g, 'sign', q.x + 40, q.y + 360, { label: 'QUAI 2' });
  for (let i = 0; i < 10; i++) slot(g, { x: q.x + rng.int(18, 60), y: q.y + rng.int(40, q.h - 30), role: 'traveler', pose: rng.chance(0.3) ? 'phone' : rng.chance(0.2) ? 'read' : 'stand', facing: 'left', chance: 0.9, holding: rng.chance(0.2) ? 'letter' : undefined });
  // Cour de service au nord de la gare : chariots et caisses
  const cs = spotRect(g, 'cour-gare');
  for (let i = 0; i < 4; i++) tryProp(g, rng.pick<PropKind>(['crate', 'cart', 'barrel']), cs.x + rng.int(20, cs.w - 20), cs.y + rng.int(10, cs.h - 4));
}

function barTerrace(g: Gen, rng: Rng): void {
  const bar = landmarkRect('bar-fer-a-cheval');
  terrace(g, rng, rectXY(bar.x + 6, bar.y + bar.h + 4, bar.x + bar.w - 4, bar.y + bar.h + 22), { parasol: 0.4, chance: 0.7 });
}

function commissariat(g: Gen, rng: Rng): void {
  const c = spotRect(g, 'cour-commissariat');
  let i = 0;
  for (let x = c.x + 50; x < c.x + c.w - 30; x += 80) {
    addVehicle(g, 'police', x, c.y + c.h - 4, i++ % 2 ? 'left' : 'right', 'white', { label: plate(rng), driver: i === 2 ? randomAppearance(rng, 'police') : undefined });
  }
  const cm = landmarkRect('commissariat');
  slot(g, { x: cm.x + 30, y: c.y + c.h + 7, role: 'police', pose: 'stand', facing: 'right', chance: 1, emote: 'talk' });
  slot(g, { x: cm.x + 46, y: c.y + c.h + 8, role: 'police', pose: 'stand', facing: 'left', chance: 1 });
  slot(g, { x: cm.x + cm.w - 20, y: c.y + c.h + 7, role: 'police', pose: rng.chance(0.5) ? 'point' : 'stand', facing: 'left', chance: 1 });
  tryProp(g, 'sign', cm.x + cm.w + 12, c.y + c.h + 6, { label: 'POLICE' });
}

function hopital(g: Gen, rng: Rng): void {
  const u = spotRect(g, 'urgences');
  addVehicle(g, 'ambulance', u.x + 70, u.y + 34, 'right', 'white', { label: 'SAMU', driver: randomAppearance(rng, 'nurse') });
  addVehicle(g, 'ambulance', u.x + 150, u.y + 34, 'left', 'white', { label: 'SAMU', doorOpen: true });
  addVehicle(g, 'ambulance', u.x + 340, u.y + 64, 'right', 'white', { label: 'SAMU' });
  addVehicle(g, 'car', u.x + 260, u.y + 64, 'left', rng.pick(CAR_COLORS), { label: plate(rng) });
  slot(g, { x: u.x + 210, y: u.y + 20, role: 'nurse', pose: 'stand', facing: 'left', chance: 1, emote: 'talk' });
  slot(g, { x: u.x + 196, y: u.y + 22, role: 'doctor', pose: 'stand', facing: 'right', chance: 1 });
  slot(g, { x: u.x + 250, y: u.y + 22, role: 'nurse', pose: 'carry', facing: 'right', chance: 1, holding: 'box' });
  slot(g, { x: u.x + 300, y: u.y + 26, role: 'elder', pose: 'stand', facing: 'left', chance: 1, emote: 'sweat' });
  tryProp(g, 'sign', u.x + u.w - 20, u.y + 12, { label: 'URGENCES' });
  if (tryProp(g, 'bench', u.x + 400, u.y + 24, { color: 'white' })) benchSeats(g, rng, u.x + 400, u.y + 24, 0.8);
}

function garage(g: Gen, rng: Rng): void {
  const d = spotRect(g, 'atelier-garage');
  addVehicle(g, 'car', d.x + 70, d.y + 40, 'right', rng.pick(CAR_COLORS), { doorOpen: true, label: plate(rng) });
  addVehicle(g, 'van', d.x + 150, d.y + 40, 'left', 'white', { label: plate(rng) });
  addVehicle(g, 'car', d.x + 225, d.y + 54, 'right', rng.pick(CAR_COLORS), { label: plate(rng) });
  for (const [dx, dy] of [[282, 12], [290, 20], [278, 22]]) addProp(g, 'barrel', d.x + dx, d.y + dy, { color: rng.pick<Color>(['red', 'blue', 'black']) });
  addProp(g, 'crate', d.x + 18, d.y + 14, { color: 'brown' });
  slot(g, { x: d.x + 96, y: d.y + 44, role: 'worker', pose: 'crouch', facing: 'left', chance: 1, holding: 'box', trusted: true, sortY: d.y + 44 });
  slot(g, { x: d.x + 190, y: d.y + 18, role: 'worker', pose: 'stand', facing: 'left', chance: 1, emote: 'talk', trusted: true });
  slot(g, { x: d.x + 176, y: d.y + 18, role: 'adult', pose: 'stand', facing: 'right', chance: 1, trusted: true });
}

function ecole(g: Gen, rng: Rng): void {
  const c = landmarkRect('cour-ecole');
  // Grille autour de la cour, portail au sud
  const gx0 = c.x + c.w / 2 - 18;
  const gx1 = c.x + c.w / 2 + 18;
  g.gb.line('fence', [{ x: c.x + 2, y: c.y }, { x: c.x + 2, y: c.y + c.h - 2 }, { x: gx0, y: c.y + c.h - 2 }], 2);
  g.gb.line('fence', [{ x: gx1, y: c.y + c.h - 2 }, { x: c.x + c.w - 2, y: c.y + c.h - 2 }, { x: c.x + c.w - 2, y: c.y }], 2);
  for (const [dx, dy] of [[30, 40], [c.w - 30, 40], [30, c.h - 40], [c.w - 30, c.h - 40]]) addTree(g, 'round', c.x + dx, c.y + dy, rng.int(44, 54));
  tryProp(g, 'playground', c.x + c.w / 2 + 50, c.y + c.h - 64);
  for (let y = c.y + 80; y < c.y + c.h - 60; y += 60) if (tryProp(g, 'bench', c.x + 26, y, { color: 'orange' })) benchSeats(g, rng, c.x + 26, y, 0.4);
  for (let i = 0; i < 34; i++) {
    slot(g, {
      x: c.x + rng.int(20, c.w - 20),
      y: c.y + rng.int(20, c.h - 14),
      role: 'child',
      pose: rng.weighted([['run', 35], ['stand', 25], ['wave', 10], ['crouch', 10], ['walk', 15], ['point', 5]] as const),
      facing: rng.chance(0.5) ? 'left' : 'right',
      chance: 0.9,
      emote: rng.weighted([['none', 60], ['exclaim', 10], ['talk', 10], ['music', 5], ['heart', 5], ['question', 5], ['angry', 5]] as const),
      holding: rng.chance(0.08) ? 'icecream' : undefined,
    });
  }
  slot(g, { x: c.x + c.w / 2, y: c.y + 30, role: 'adult', pose: 'point', facing: 'left', chance: 1, emote: 'exclaim' });
  slot(g, { x: c.x + 60, y: c.y + c.h - 30, role: 'elder', pose: 'stand', facing: 'right', chance: 1 });
  // Parents à la sortie de l'école
  for (let i = 0; i < 6; i++) slot(g, { x: gx0 - 40 + i * 16, y: c.y + c.h + 26, role: 'adult', pose: rng.chance(0.3) ? 'phone' : 'stand', facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.7 });
}

function chantier(g: Gen, rng: Rng): void {
  const c = landmarkRect('chantier');
  const ex0 = c.x + 200;
  const ex1 = c.x + 260;
  g.gb.line('fence', [{ x: ex0, y: c.y + c.h - 2 }, { x: c.x + 2, y: c.y + c.h - 2 }, { x: c.x + 2, y: c.y + 2 }, { x: c.x + c.w - 2, y: c.y + 2 }, { x: c.x + c.w - 2, y: c.y + c.h - 2 }, { x: ex1, y: c.y + c.h - 2 }], 3);
  g.gb.shape('sand', ellipsePolygon(rectXY(c.x + 24, c.y + 20, c.x + 120, c.y + 70), 14));
  addProp(g, 'crane', c.x + 120, c.y + 200, { color: 'yellow' });
  // La « tour » en construction : échafaudages
  for (const x of [c.x + 290, c.x + 350]) addProp(g, 'scaffold', x, c.y + 230, { color: 'grey' });
  for (const x of [c.x + 260, c.x + 320, c.x + 380]) addProp(g, 'scaffold', x, c.y + 320, { color: 'grey' });
  addProp(g, 'ladder', c.x + 230, c.y + 322, { solid: false });
  for (let i = 0; i < 8; i++) tryProp(g, 'pallet', c.x + rng.int(40, 200), c.y + rng.int(110, 330));
  for (let i = 0; i < 10; i++) tryProp(g, 'crate', c.x + rng.int(30, 220), c.y + rng.int(90, 340), { color: 'brown' });
  for (let i = 0; i < 4; i++) tryProp(g, 'barrel', c.x + rng.int(30, 420), c.y + rng.int(40, 100), { color: 'blue' });
  addVehicle(g, 'truck', c.x + 110, c.y + 356, 'right', 'orange', { label: plate(rng) });
  addVehicle(g, 'van', c.x + 360, c.y + 120, 'left', 'yellow', { label: 'BTP' });
  tryProp(g, 'sign', ex1 + 14, c.y + c.h + 9, { label: 'CHANTIER' });
  for (const x of [ex0 + 14, ex1 - 14]) tryProp(g, 'barrier', x, c.y + c.h - 10, { color: 'red' });
  for (const x of [c.x + 330, c.x + 356]) tryProp(g, 'barrier', x, c.y + 120, { color: 'orange' });
  for (let i = 0; i < 5; i++) tryProp(g, 'cone', ex0 + 8 + i * 11, c.y + c.h - 26, { color: 'orange' });
  const poses = [['carry', 30], ['stand', 25], ['crouch', 15], ['point', 10], ['walk', 15], ['climb', 5]] as const;
  for (let i = 0; i < 20; i++) {
    const pose = rng.weighted(poses);
    slot(g, {
      x: c.x + rng.int(30, c.w - 30),
      y: c.y + rng.int(40, c.h - 20),
      role: 'worker',
      pose,
      facing: rng.chance(0.5) ? 'left' : 'right',
      chance: 0.9,
      holding: pose === 'carry' ? 'box' : pose === 'point' && rng.chance(0.5) ? 'map' : undefined,
      emote: rng.chance(0.1) ? 'sweat' : rng.chance(0.08) ? 'exclaim' : undefined,
    });
  }
  slot(g, { x: c.x + 228, y: c.y + 326, role: 'worker', pose: 'climb', facing: 'right', chance: 1, trusted: true, sortY: c.y + 326 });
}

function cimetiere(g: Gen, rng: Rng): void {
  const c = landmarkRect('cimetiere');
  const gate0 = c.x + c.w / 2 - 22;
  const gate1 = c.x + c.w / 2 + 22;
  g.gb.line('wall', [{ x: gate0, y: c.y + c.h - 2 }, { x: c.x + 2, y: c.y + c.h - 2 }, { x: c.x + 2, y: c.y + 2 }, { x: c.x + c.w - 2, y: c.y + 2 }, { x: c.x + c.w - 2, y: c.y + c.h - 2 }, { x: gate1, y: c.y + c.h - 2 }], 4);
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  path(g, [{ x: cx, y: c.y + 8 }, { x: cx, y: c.y + c.h }], 18);
  path(g, [{ x: c.x + 8, y: cy }, { x: c.x + c.w - 8, y: cy }], 14);
  // Cyprès le long de l'allée centrale et dans les coins
  for (let y = c.y + 50; y < c.y + c.h - 30; y += 64) {
    if (Math.abs(y - cy) < 30) continue;
    addTree(g, 'pine', cx - 22, y, rng.int(52, 66));
    addTree(g, 'pine', cx + 22, y, rng.int(52, 66));
  }
  for (const [x, y] of [[c.x + 24, c.y + 40], [c.x + c.w - 24, c.y + 40], [c.x + 24, c.y + c.h - 24], [c.x + c.w - 24, c.y + c.h - 24]]) addTree(g, 'pine', x, y, rng.int(56, 70));
  // Tombes
  for (let y = c.y + 50; y < c.y + c.h - 12; y += 34) {
    if (Math.abs(y - cy) < 22) continue;
    for (let x = c.x + 26; x < c.x + c.w - 20; x += 24) {
      if (Math.abs(x - cx) < 40) continue;
      if (!rng.chance(0.82)) continue;
      const t = tryProp(g, 'rock', x + rng.int(-2, 2), y, { variant: 'tombstone', color: rng.pick<Color>(['grey', 'grey', 'white', 'black', 'beige']), scale: rng.pick([1, 1.1, 1.2]) });
      if (t && rng.chance(0.18)) addProp(g, 'flowerbed', x, y + 6, { scale: 0.4, color: rng.pick<Color>(['red', 'pink', 'yellow', 'white', 'purple']), solid: false });
    }
  }
  for (const [x, y] of [[cx - 140, cy - 4], [cx + 140, cy - 4]]) addProp(g, 'statue', x, y, { variant: 'angel', scale: 0.6, color: 'white' });
  if (tryProp(g, 'bench', cx - 60, cy - 14, { color: 'brown' })) benchSeats(g, rng, cx - 60, cy - 14, 0.5);
  for (let i = 0; i < 8; i++) {
    const x = c.x + rng.int(40, c.w - 40);
    const y = c.y + 50 + 34 * rng.int(0, 12) + 12;
    slot(g, { x, y, role: rng.chance(0.6) ? 'mourner' : 'elder', pose: rng.chance(0.2) ? 'crouch' : 'stand', facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.9 });
  }
}

function park(g: Gen, rng: Rng): void {
  const p = landmarkRect('parc');
  const gb = g.gb;
  // Haie d'enceinte avec portails
  const hw = 6;
  const gates = {
    north: [[4600, 4660], [5370, 5430]],
    south: [[4600, 4660], [5270, 5330], [5870, 5930]],
    west: [[960, 1040], [1780, 1840]],
    east: [[860, 940]],
  };
  const hedgeH = (y: number, cuts: number[][]): void => {
    let x = p.x;
    for (const [a, b] of cuts) {
      gb.line('hedge', [{ x, y }, { x: a, y }], hw);
      x = b;
    }
    gb.line('hedge', [{ x, y }, { x: p.x + p.w, y }], hw);
  };
  const hedgeV = (x: number, cuts: number[][]): void => {
    let y = p.y;
    for (const [a, b] of cuts) {
      gb.line('hedge', [{ x, y }, { x, y: a }], hw);
      y = b;
    }
    gb.line('hedge', [{ x, y }, { x, y: p.y + p.h }], hw);
  };
  hedgeH(p.y, gates.north);
  hedgeH(p.y + p.h, gates.south);
  hedgeV(p.x, gates.west);
  hedgeV(p.x + p.w, gates.east);

  // Allées
  const pond = landmarkRect('etang');
  const pcx = pond.x + pond.w / 2;
  const pcy = pond.y + pond.h / 2;
  const loop = ellipsePolygon(rectXY(pond.x - 40, pond.y - 40, pond.x + pond.w + 40, pond.y + pond.h + 40), 32);
  const main = [{ x: p.x - 30, y: 1000 }, { x: 4700, y: 1000 }, { x: 4950, y: 1150 }, { x: pcx, y: 1160 }, { x: 5800, y: 1110 }, { x: p.x + p.w + 30, y: 900 }];
  const paths: Vec2[][] = [
    main,
    [...loop, loop[0]],
    [{ x: pcx, y: pond.y + pond.h + 40 }, { x: pcx, y: 1160 }],
    [{ x: 5400, y: p.y - 30 }, { x: 5400, y: 300 }, { x: 5330, y: pond.y - 38 }],
    [{ x: 4630, y: p.y - 30 }, { x: 4590, y: 400 }, { x: 4570, y: 570 }],
    [{ x: 4620, y: 630 }, { x: 4800, y: 700 }, { x: pond.x - 36, y: 760 }],
    [{ x: 4950, y: 1150 }, { x: 4880, y: 1300 }, { x: 4855, y: 1380 }],
    [{ x: 4850, y: 1480 }, { x: 4700, y: 1700 }, { x: p.x - 30, y: 1810 }],
    [{ x: 5300, y: p.y + p.h + 30 }, { x: 5300, y: 1600 }, { x: 5250, y: 1300 }, { x: pcx, y: 1160 }],
    [{ x: 5800, y: 1110 }, { x: 5900, y: 1300 }, { x: 5925, y: 1450 }],
    [{ x: 5900, y: p.y + p.h + 30 }, { x: 5925, y: 1750 }],
    [{ x: 4630, y: p.y + p.h + 30 }, { x: 4640, y: 1820 }, { x: 4700, y: 1700 }],
    [{ x: p.x + 40, y: p.y + 40 }, { x: p.x + p.w - 40, y: p.y + 40 }, { x: p.x + p.w - 40, y: p.y + p.h - 40 }, { x: p.x + 40, y: p.y + p.h - 40 }, { x: p.x + 40, y: p.y + 40 }],
  ];
  paths.forEach((pts, i) => path(g, pts, i === 0 ? 22 : i === 1 ? 16 : i === paths.length - 1 ? 12 : 14));
  // Petites places : statue et kiosque à musique
  g.gb.shape('plaza', ellipsePolygon(rectXY(4500, 560, 4640, 680), 16));
  g.gb.shape('plaza', ellipsePolygon(rectXY(4770, 1370, 4930, 1510), 18));
  const st = landmarkRect('statue');
  landmarkProp(g, 'statue', 'statue', st.x + st.w / 2, st.y + st.h, { color: 'grey' });
  for (const [dx, dy] of [[-44, 18], [44, 18]]) tryProp(g, 'flowerbed', st.x + 10 + dx, st.y + 20 + dy, { color: 'red' });
  for (let i = 0; i < 3; i++) tryProp(g, 'pigeons', st.x + rng.int(-50, 50), st.y + rng.int(30, 50));
  slot(g, { x: st.x + 10 + 36, y: st.y + 44, role: 'tourist', pose: 'stand', facing: 'left', chance: 1, holding: 'map' });
  const kq = landmarkRect('kiosque');
  const kx = kq.x + kq.w / 2;
  const ky = kq.y + kq.h;
  landmarkProp(g, 'kiosque', 'bandstand', kx, ky, { color: 'green' });
  // Musiciens devant le kiosque, public en demi-cercle
  for (let i = 0; i < 4; i++) slot(g, { x: kx - 30 + i * 20, y: ky + 14, role: 'musician', pose: 'stand', facing: i < 2 ? 'right' : 'left', chance: 1, emote: 'music', trusted: true });
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (0.15 + 0.7 * rng.float());
    const rr = rng.int(50, 85);
    const x = kx + Math.cos(a) * rr * 1.3;
    slot(g, { x, y: ky + 14 + Math.sin(a) * rr, role: rng.weighted([['adult', 50], ['elder', 25], ['child', 15], ['tourist', 10]] as const), pose: rng.chance(0.1) ? 'wave' : 'stand', facing: x > kx ? 'left' : 'right', chance: 0.85, emote: rng.chance(0.15) ? 'heart' : rng.chance(0.1) ? 'music' : undefined });
  }
  // Ponton, barques et canards
  const pondPts = pondPolygon();
  addVehicle(g, 'boat', pcx - 150, pcy + 40, 'right', 'white', { label: 'LA CANE' });
  addVehicle(g, 'boat', pcx + 180, pcy - 60, 'left', 'red', { label: 'LE COLVERT' });
  slot(g, { x: PONTOON.x + 20, y: PONTOON.y + 20, role: 'fisher', pose: 'sit', facing: 'left', chance: 1, trusted: true });
  let ducks = 0;
  for (let i = 0; i < 80 && ducks < 18; i++) {
    const x = pond.x + rng.int(40, pond.w - 40);
    const y = pond.y + rng.int(40, pond.h - 30);
    if (!pointInPolygon(pondPts, x, y) || !pointInPolygon(pondPts, x, y + 20)) continue;
    if (g.raster.any({ x: x - 5, y: y - 5, w: 10, h: 6 }, F_SOLID)) continue;
    addProp(g, 'duck', x, y, { facing: rng.chance(0.5) ? 'left' : 'right', color: rng.chance(0.3) ? 'white' : 'brown' });
    ducks++;
  }
  // Bancs, réverbères, poubelles, massifs le long des allées
  benchesAlong(g, rng, main, 120, 0.55);
  benchesAlong(g, rng, [...loop, loop[0]], 150, 0.6);
  for (const pts of paths.slice(3, -1)) benchesAlong(g, rng, pts, 200, 0.5);
  for (const { p: q } of alongPolyline(main, 150)) tryProp(g, 'lamp', q.x, q.y + 16);
  for (const { p: q } of alongPolyline([...loop, loop[0]], 220)) tryProp(g, 'lamp', q.x, q.y + 12);
  for (let i = 0; i < 26; i++) tryProp(g, 'flowerbed', p.x + rng.int(60, p.w - 60), p.y + rng.int(60, p.h - 60), { color: rng.pick<Color>(['red', 'pink', 'yellow', 'purple', 'orange', 'white']) });
  for (let i = 0; i < 40; i++) tryProp(g, 'bush', p.x + rng.int(40, p.w - 40), p.y + rng.int(40, p.h - 40));
  for (let i = 0; i < 6; i++) tryProp(g, 'rock', pond.x + rng.int(0, pond.w), pond.y + pond.h + rng.int(8, 30));
  // Marchand de glaces au bord de l'étang
  if (tryProp(g, 'cart', pcx + 120, pond.y + pond.h + 70, { color: 'pink', label: 'GLACES' })) {
    slot(g, { x: pcx + 120, y: pond.y + pond.h + 62, role: 'vendor', pose: 'stand', facing: 'left', chance: 1, holding: 'icecream', trusted: true, sortY: pond.y + pond.h + 62 });
  }
  // Aire de jeux
  const aj = landmarkRect('aire-de-jeux');
  g.gb.shape('sand', rectPoints(rectXY(aj.x + 200, aj.y + 190, aj.x + 320, aj.y + 270)));
  g.gb.line('fence', [{ x: aj.x, y: aj.y }, { x: aj.x + aj.w, y: aj.y }, { x: aj.x + aj.w, y: aj.y + aj.h }, { x: aj.x + 200, y: aj.y + aj.h }], 2);
  g.gb.line('fence', [{ x: aj.x + 150, y: aj.y + aj.h }, { x: aj.x, y: aj.y + aj.h }, { x: aj.x, y: aj.y + 120 }], 2);
  for (const [dx, dy] of [[80, 100], [240, 110], [140, 210]]) tryProp(g, 'playground', aj.x + dx, aj.y + dy);
  for (const [dx, dy] of [[30, 60], [30, 160], [330, 60], [100, 280]]) if (tryProp(g, 'bench', aj.x + dx, aj.y + dy, { color: 'red' })) benchSeats(g, rng, aj.x + dx, aj.y + dy, 0.7);
  for (let i = 0; i < 26; i++) {
    slot(g, {
      x: aj.x + rng.int(20, aj.w - 20),
      y: aj.y + rng.int(30, aj.h - 14),
      role: 'child',
      pose: rng.weighted([['run', 35], ['stand', 20], ['wave', 10], ['crouch', 15], ['climb', 5], ['walk', 15]] as const),
      facing: rng.chance(0.5) ? 'left' : 'right',
      chance: 0.85,
      emote: rng.weighted([['none', 60], ['exclaim', 10], ['heart', 8], ['music', 6], ['angry', 6], ['question', 5], ['idea', 5]] as const),
      holding: rng.chance(0.12) ? 'icecream' : undefined,
    });
  }
  // Arbres du parc : bosquets, alignements le long de l'allée principale, ceinture intérieure
  const pondKeep = ellipsePolygon(rectXY(pond.x - 70, pond.y - 70, pond.x + pond.w + 70, pond.y + pond.h + 70), 24);
  const avoid = [rectXY(4480, 520, 4660, 700), rectXY(4740, 1340, 4960, 1540), rectXY(aj.x - 20, aj.y - 20, aj.x + aj.w + 20, aj.y + aj.h + 20)];
  const okTree = (x: number, y: number): boolean =>
    x > p.x + 20 && x < p.x + p.w - 20 && y > p.y + 30 && y < p.y + p.h - 10 && !pointInPolygon(pondKeep, x, y) && !avoid.some((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);
  const plant = (x: number, y: number, kind: 'round' | 'pine' | 'poplar' | 'bare', size: number): boolean => {
    if (!okTree(x, y)) return false;
    if (g.raster.any({ x: x - 6, y: y - 6, w: 12, h: 8 }, F_SOLID | F_WATER) || g.raster.any({ x: x - 8, y: y - 4, w: 16, h: 6 }, F_PATH)) return false;
    addTree(g, kind, x, y, size);
    return true;
  };
  for (let k = 0; k < 16; k++) {
    const cx0 = p.x + rng.int(120, p.w - 120);
    const cy0 = p.y + rng.int(120, p.h - 120);
    const n = rng.int(10, 24);
    const kind = rng.weighted([['round', 60], ['pine', 15], ['poplar', 15], ['bare', 10]] as const);
    for (let i = 0; i < n * 3 && n > 0; i++) {
      const x = cx0 + (rng.float() + rng.float() - 1) * 120;
      const y = cy0 + (rng.float() + rng.float() - 1) * 100;
      if (plant(x, y, rng.chance(0.8) ? kind : 'round', rng.int(40, 66))) i += 2;
    }
  }
  for (const { p: q } of alongPolyline(main, 64)) plant(q.x, q.y - 22, 'round', rng.int(44, 56));
  for (let x = p.x + 30; x < p.x + p.w - 20; x += rng.int(50, 80)) {
    plant(x, p.y + 20, rng.chance(0.5) ? 'poplar' : 'round', rng.int(46, 64));
    plant(x, p.y + p.h - 14, 'round', rng.int(40, 54));
  }
  for (let y = p.y + 60; y < p.y + p.h - 20; y += rng.int(50, 80)) {
    plant(p.x + 20, y, 'round', rng.int(40, 56));
    plant(p.x + p.w - 20, y, 'poplar', rng.int(46, 64));
  }
  for (let i = 0; i < 70; i++) plant(p.x + rng.int(40, p.w - 40), p.y + rng.int(40, p.h - 40), rng.weighted([['round', 70], ['bare', 10], ['poplar', 10], ['pine', 10]] as const), rng.int(38, 62));
  // Abords du parc (hors haie) : alignements
  for (let x = p.x - 40; x < p.x + p.w + 60; x += 70) {
    if (x < 4300) continue;
    addTree(g, 'round', x, 60, rng.int(40, 52));
  }
}

function parvis(g: Gen, rng: Rng): void {
  // Musée : statues de part et d'autre de l'escalier, jardin des sculptures au nord
  const pm = spotRect(g, 'parvis-musee');
  for (const x of [pm.x + 120, pm.x + pm.w - 120]) addProp(g, 'statue', x, pm.y + 30, { variant: 'sculpture', scale: 0.8, color: 'white' });
  for (const x of [pm.x + 30, pm.x + pm.w - 30]) tryProp(g, 'lamp', x, pm.y + pm.h - 6);
  for (const x of [pm.x + 200, pm.x + pm.w - 200]) if (tryProp(g, 'bench', x, pm.y + 64, { color: 'navy' })) benchSeats(g, rng, x, pm.y + 64, 0.6);
  tryProp(g, 'sign', pm.x + pm.w / 2 + 40, pm.y + pm.h - 8, { label: 'EXPO' });
  for (let i = 0; i < 8; i++) slot(g, { x: pm.x + rng.int(40, pm.w - 40), y: pm.y + rng.int(30, pm.h - 10), role: rng.chance(0.5) ? 'tourist' : 'student', pose: rng.chance(0.3) ? 'point' : 'stand', facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.85 });
  const js = spotRect(g, 'jardin-sculptures');
  path(g, [{ x: js.x, y: js.y + 46 }, { x: js.x + js.w, y: js.y + 46 }], 12);
  for (let x = js.x + 60; x < js.x + js.w - 30; x += 110) {
    addProp(g, 'statue', x, js.y + 36, { variant: 'sculpture', scale: rng.pick([0.6, 0.7, 0.8]), color: rng.pick<Color>(['white', 'grey', 'brown']) });
    tryProp(g, 'bush', x + 50, js.y + 80);
  }
  // Théâtre
  const pt = spotRect(g, 'parvis-theatre');
  tryProp(g, 'sign', pt.x + 60, pt.y + pt.h - 6, { label: 'CE SOIR' });
  for (const x of [pt.x + 30, pt.x + pt.w - 30]) tryProp(g, 'lamp', x, pt.y + pt.h - 6);
  for (let i = 0; i < 6; i++) slot(g, { x: pt.x + rng.int(30, pt.w - 30), y: pt.y + rng.int(20, pt.h - 10), role: rng.chance(0.4) ? 'business' : 'adult', pose: rng.chance(0.3) ? 'phone' : 'stand', facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.8 });
  // Église
  const pe = spotRect(g, 'parvis-eglise');
  for (const x of [pe.x + 40, pe.x + pe.w - 40]) if (tryProp(g, 'bench', x, pe.y + 50, { color: 'brown' })) benchSeats(g, rng, x, pe.y + 50, 0.6);
  tryProp(g, 'lamp', pe.x + pe.w / 2, pe.y + pe.h - 6);
  for (let i = 0; i < 3; i++) tryProp(g, 'pigeons', pe.x + rng.int(20, pe.w - 20), pe.y + rng.int(20, pe.h - 10));
}

function port(g: Gen, rng: Rng): void {
  const q = landmarkRect('quai-port');
  // Grues au bord de l'eau
  for (const x of [4620, 5180, 5720, 6180]) addProp(g, 'crane', x, q.y + 48, { color: rng.pick<Color>(['yellow', 'orange', 'red']) });
  // Piles de caisses, tonneaux, palettes
  for (let k = 0; k < 26; k++) {
    const x0 = q.x + rng.int(40, q.w - 120);
    const y0 = q.y + rng.int(70, q.h - 20);
    const kind = rng.weighted([['crate', 50], ['barrel', 30], ['pallet', 20]] as const);
    const cols = rng.int(2, 5);
    const rowsN = rng.int(1, 2);
    for (let j = 0; j < rowsN; j++) for (let i = 0; i < cols; i++) tryProp(g, kind, x0 + i * 12, y0 + j * 10, { color: rng.pick<Color>(['brown', 'beige', 'red', 'blue', 'green']) });
  }
  for (let i = 0; i < 5; i++) tryProp(g, 'cart', q.x + rng.int(40, q.w - 40), q.y + rng.int(60, q.h - 20), { color: 'yellow' });
  for (let i = 0; i < 30; i++) {
    const pose = rng.weighted([['carry', 35], ['stand', 25], ['walk', 20], ['point', 10], ['phone', 5], ['wave', 5]] as const);
    slot(g, { x: q.x + rng.int(30, q.w - 30), y: q.y + rng.int(30, q.h - 10), role: 'docker', pose, facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.9, holding: pose === 'carry' ? 'box' : rng.chance(0.08) ? 'rope' : undefined, emote: rng.chance(0.08) ? 'sweat' : rng.chance(0.06) ? 'talk' : undefined });
  }
  // Pêcheurs sur les quais de la rivière (quai nord, quai sud)
  for (let i = 0; i < 14; i++) {
    const north = rng.chance(0.55);
    const x = rng.int(400, north ? 6300 : 4100);
    const y = north ? 3697 : 3972;
    slot(g, { x, y, role: 'fisher', pose: rng.chance(0.6) ? 'sit' : 'stand', facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.9, holding: rng.chance(0.5) ? 'rope' : undefined });
  }
  // Entrepôts : allée de service entre les deux rangées
  const ent = landmarkRect('entrepots');
  for (let i = 0; i < 4; i++) addVehicle(g, i % 2 ? 'van' : 'truck', ent.x + 160 + i * 340, ent.y + 186, i % 2 ? 'left' : 'right', rng.pick<Color>(['white', 'blue', 'red', 'green', 'grey']), { label: plate(rng) });
  for (let i = 0; i < 18; i++) tryProp(g, rng.pick<PropKind>(['pallet', 'crate', 'crate', 'barrel']), ent.x + rng.int(20, ent.w - 20), ent.y + rng.int(150, 200), { color: rng.pick<Color>(['brown', 'beige', 'blue']) });
  for (let i = 0; i < 12; i++) slot(g, { x: ent.x + rng.int(20, ent.w - 20), y: ent.y + rng.int(160, 196), role: 'docker', pose: rng.chance(0.4) ? 'carry' : 'stand', facing: rng.chance(0.5) ? 'left' : 'right', chance: 0.85, holding: rng.chance(0.4) ? 'box' : undefined });
  // Esplanade de la capitainerie
  const es = spotRect(g, 'esplanade-port');
  tryProp(g, 'sign', es.x + 40, es.y + 40, { label: 'PORT' });
  if (tryProp(g, 'bench', es.x + 120, es.y + 60, { color: 'blue' })) benchSeats(g, rng, es.x + 120, es.y + 60, 0.6);
  tryProp(g, 'lamp', es.x + 180, es.y + 90);
  // Bateaux à quai le long du port (dans l'eau, au nord des quais)
  let bx = 4380;
  let bi = 0;
  while (bx < 6320) {
    if (![-48, 0, 48].every((dx) => g.gi.kindAt(bx + dx, 3948) === 'water' && g.gi.kindAt(bx + dx, 3916) === 'water')) {
      bx += 40;
      continue;
    }
    addVehicle(g, 'boat', bx, 3950, rng.chance(0.5) ? 'left' : 'right', rng.pick<Color>(['white', 'blue', 'red', 'navy', 'green', 'yellow']), { label: BOAT_NAMES[bi++ % BOAT_NAMES.length], driver: rng.chance(0.3) ? randomAppearance(rng, 'docker') : undefined });
    bx += rng.int(120, 220);
  }
}

function jardinsOuvriers(g: Gen, rng: Rng): void {
  const jo = landmarkRect('jardins-ouvriers');
  const ymid = Math.round(jo.y + jo.h / 2);
  path(g, [{ x: jo.x - 50, y: ymid }, { x: jo.x + jo.w + 50, y: ymid }], 14);
  for (const x of [700, 1000, 1300, 1600]) path(g, [{ x, y: jo.y }, { x, y: jo.y + jo.h }], 10);
  for (const plot of jardinsPlots(jo)) {
    const prng = new Rng((plot.x * 2654435761) ^ (plot.y * 40503) ^ g.seed);
    // Haie ou clôture autour de la parcelle, avec un passage
    const kind = prng.chance(0.6) ? 'hedge' : 'fence';
    const gx = plot.x + plot.w / 2;
    g.gb.line(kind, [{ x: gx - 10, y: plot.y + plot.h }, { x: plot.x, y: plot.y + plot.h }, { x: plot.x, y: plot.y }, { x: plot.x + plot.w, y: plot.y }, { x: plot.x + plot.w, y: plot.y + plot.h }, { x: gx + 10, y: plot.y + plot.h }], kind === 'hedge' ? 4 : 2);
    // Planches de légumes
    const n = prng.int(2, 5);
    for (let i = 0; i < n; i++) tryProp(g, 'flowerbed', plot.x + 24 + prng.int(0, plot.w - 48), plot.y + 60 + i * 16, { color: prng.pick<Color>(['green', 'olive', 'red', 'orange', 'yellow']), variant: 'vegetables' });
    if (prng.chance(0.5)) tryProp(g, 'barrel', plot.x + plot.w - 14, plot.y + plot.h - 12, { color: 'blue' });
    if (prng.chance(0.3)) tryProp(g, 'cart', plot.x + 30, plot.y + plot.h - 14, { color: 'green' });
    if (prng.chance(0.35)) {
      const tx = plot.x + prng.int(20, plot.w - 20);
      const ty = plot.y + plot.h - prng.int(10, 30);
      if (!g.raster.any({ x: tx - 6, y: ty - 6, w: 12, h: 8 }, F_SOLID)) addTree(g, prng.chance(0.8) ? 'round' : 'bare', tx, ty, prng.int(30, 44));
    }
    if (prng.chance(0.55)) {
      slot(g, { x: plot.x + prng.int(20, plot.w - 20), y: plot.y + prng.int(70, plot.h - 10), role: 'gardener', pose: prng.weighted([['crouch', 45], ['stand', 30], ['carry', 15], ['wave', 10]] as const), facing: prng.chance(0.5) ? 'left' : 'right', chance: 0.9, holding: prng.chance(0.15) ? 'box' : undefined });
    }
  }
  void rng;
}

/** Squares, boulodromes : petits îlots publics. */
function blocksSpecial(g: Gen, rng: Rng): void {
  for (const b of g.plan.blocks) {
    const r = b.rect;
    if (b.kind === 'square') {
      // Arbres sur le pourtour, allées en croix, bancs, massif central
      g.gb.line('path', [{ x: r.x, y: r.y + r.h / 2 }, { x: r.x + r.w, y: r.y + r.h / 2 }], 10);
      g.gb.line('path', [{ x: r.x + r.w / 2, y: r.y }, { x: r.x + r.w / 2, y: r.y + r.h }], 10);
      // Arbres au sud et sur les côtés : au nord, leur feuillage masquerait la rue.
      for (let x = r.x + 18; x < r.x + r.w - 10; x += rng.int(44, 64)) {
        if (Math.abs(x - (r.x + r.w / 2)) < 16) continue;
        addTree(g, 'round', x, r.y + r.h - 8, rng.int(38, 50));
      }
      for (let y = r.y + 70; y < r.y + r.h - 50; y += rng.int(50, 70)) {
        if (Math.abs(y - (r.y + r.h / 2)) < 16) continue;
        addTree(g, rng.chance(0.7) ? 'round' : 'poplar', r.x + 16, y, rng.int(40, 54));
        addTree(g, rng.chance(0.7) ? 'round' : 'poplar', r.x + r.w - 16, y, rng.int(40, 54));
      }
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const center = rng.weighted([['flowerbed', 40], ['playground', 25], ['kiosk', 15], ['bandstand', 0], ['tent', 10], ['cart', 10]] as const);
      tryProp(g, center, cx + (center === 'flowerbed' ? 0 : 50), cy + 40, { color: rng.pick<Color>(['red', 'green', 'yellow', 'pink']) });
      for (const [dx, dy] of [[-60, -14], [60, -14], [-60, 40], [60, 40]]) {
        if (Math.abs(dx) * 2 > r.w - 40 || Math.abs(dy) * 2 > r.h - 40) continue;
        if (tryProp(g, 'bench', cx + dx, cy + dy, { color: 'green' })) benchSeats(g, rng, cx + dx, cy + dy, 0.55);
      }
      tryProp(g, 'lamp', cx + 12, cy - 12);
      if (rng.chance(0.6)) tryProp(g, 'pigeons', cx - 24, cy + 20);
    } else if (b.kind === 'sand') {
      tryProp(g, 'sign', r.x + 20, r.y + r.h - 6, { label: 'PÉTANQUE' });
      for (let x = r.x + 40; x < r.x + r.w - 30; x += 70) if (tryProp(g, 'bench', x, r.y + 24, { color: 'brown' })) benchSeats(g, rng, x, r.y + 24, 0.6);
      for (let x = r.x + 30; x < r.x + r.w - 20; x += 60) addTree(g, 'round', x, r.y + 8, rng.int(44, 56));
      const n = rng.int(5, 9);
      for (let i = 0; i < n; i++) {
        slot(g, {
          x: r.x + rng.int(30, r.w - 30),
          y: r.y + rng.int(50, r.h - 10),
          role: rng.chance(0.6) ? 'elder' : 'adult',
          pose: rng.weighted([['crouch', 25], ['point', 25], ['stand', 40], ['wave', 10]] as const),
          facing: rng.chance(0.5) ? 'left' : 'right',
          chance: 0.95,
          emote: rng.chance(0.2) ? 'exclaim' : rng.chance(0.15) ? 'angry' : rng.chance(0.1) ? 'talk' : undefined,
          holding: rng.chance(0.1) ? 'bottle' : undefined,
        });
      }
    }
  }
}

