// Foule ambiante : places réservées (vendeurs, musiciens, assis…), gens aux fenêtres, puis foule
// répartie selon le type de sol et le quartier (forte sur les places, au marché, au parc, à la gare,
// au port ; modérée sur les trottoirs ; faible au Faubourg et aux Jardins), en activités crédibles :
// marcheurs, groupes qui discutent face à face, familles, promeneurs de chiens, pique-niques…
import type { Color, Emote, Facing, HeldItem, Pose } from '../types';
import type { Rng } from '../lib/rng';
import { DISTRICTS, LANDMARKS } from './layoutSpec';
import { randomAppearance, type Role } from './appearance';
import { addPerson, addProp, canStand, exactStandOk, makeRng, PERSON_BLOCK, type Gen, type Slot } from './context';
import { CELL, F_BUILDING, F_NOAMBIENT, F_ROAD, F_SOLID, GROUND_KINDS, KIND_INDEX } from './raster';
import { floorsOf } from './buildings';

type W<T> = readonly (readonly [T, number])[];

export function populate(g: Gen): void {
  const rng = makeRng(g.seed, 'people');
  fillSlots(g, rng);
  windowPeople(g, rng);
  crowd(g, rng);
  crosswalkWalkers(g, rng);
}

/* ----------------------------------------------------------------------------
 * Places réservées
 * ------------------------------------------------------------------------- */

function fillSlots(g: Gen, rng: Rng): void {
  for (const s of g.slots) {
    if (!rng.chance(s.chance)) continue;
    placeSlot(g, rng, s);
  }
}

function placeSlot(g: Gen, rng: Rng, s: Slot): boolean {
  const a = randomAppearance(rng, s.role);
  const tries = s.trusted ? [[0, 0]] : [[0, 0], [6, 0], [-6, 0], [0, 5], [0, -5], [10, 4], [-10, -4]];
  for (const [dx, dy] of tries) {
    const x = s.x + dx;
    const y = s.y + dy;
    if (s.trusted) {
      if (g.raster.any({ x: x - 3, y: y - 2, w: 6, h: 3 }, F_BUILDING)) return false;
    } else if (!canStand(g, x, y)) continue;
    if (!exactStandOk(g, x, y)) continue;
    let holding = s.holding;
    if (a.build === 'child' && holding && holding !== 'icecream' && holding !== 'none') holding = undefined;
    addPerson(g, x, y, a, s.pose, s.facing, { holding, emote: s.emote, sortY: s.sortY });
    return true;
  }
  return false;
}

/* ----------------------------------------------------------------------------
 * Gens aux fenêtres (buste encadré, sur la façade)
 * ------------------------------------------------------------------------- */

function windowPeople(g: Gen, rng: Rng): void {
  const cands = g.buildings.filter(
    (b) => b.id.startsWith('b.') && (b.style === 'apartment' || b.style === 'townhouse' || b.style === 'hotel') && floorsOf(b.height) >= 2,
  );
  rng.shuffle(cands);
  let n = 0;
  for (const b of cands) {
    if (n >= 90) break;
    const f = b.footprint;
    const floors = floorsOf(b.height);
    const floor = rng.int(1, floors - 1);
    const z = 28 + 24 * (floor - 1) + 5;
    if (z + 15 > b.height - 2) continue;
    const x = f.x + f.w * (0.15 + 0.7 * rng.float());
    const y = f.y + f.h + 0.5;
    if (g.gi.kindAt(x, y + 0.5) === 'road' || g.raster.any({ x: x - 2, y: y, w: 4, h: 1 }, F_BUILDING)) continue;
    const a = randomAppearance(rng, rng.weighted<Role>([['adult', 60], ['elder', 30], ['child', 10]]));
    const emote = rng.weighted<Emote>([['none', 55], ['talk', 10], ['music', 8], ['heart', 6], ['sleep', 6], ['question', 5], ['exclaim', 5], ['idea', 3], ['angry', 2]]);
    addPerson(g, x, y, a, 'window', rng.chance(0.5) ? 'left' : 'right', { z, sortY: y, emote, holding: rng.chance(0.1) ? 'phone' : rng.chance(0.06) ? 'bottle' : undefined });
    n++;
  }
}

/* ----------------------------------------------------------------------------
 * Foule
 * ------------------------------------------------------------------------- */

/** Densité (personnes pour 10 000 u²) selon le sol et le quartier. */
function density(kind: string, district: string): number {
  switch (kind) {
    case 'plaza':
      return district === 'arts' ? 5 : district === 'gare' ? 9 : 8;
    case 'sidewalk':
      return { halles: 7.5, centre: 7.5, gare: 7, arts: 5.5, faubourg: 2.6, jardins: 1.6, parc: 3, port: 3.5, riviere: 4.5 }[district] ?? 4;
    case 'park':
      return 1.35;
    case 'courtyard':
      return district === 'faubourg' || district === 'jardins' ? 0.5 : district === 'port' ? 0.4 : 1.5;
    case 'garden':
      return 0.35;
    case 'dock':
      return district === 'riviere' ? 3.5 : 1.6;
    case 'parking':
      return 0.8;
    case 'sand':
      return 1;
    case 'bridge':
      return 5;
    case 'grass':
      return 0.15;
    default:
      return 0;
  }
}

const ROLES: Record<string, W<Role>> = {
  gare: [['adult', 42], ['traveler', 22], ['business', 14], ['elder', 10], ['student', 6], ['tourist', 6]],
  halles: [['adult', 55], ['elder', 20], ['business', 7], ['student', 8], ['tourist', 6], ['vendor', 2], ['chef', 1], ['police', 1]],
  centre: [['adult', 44], ['tourist', 15], ['elder', 14], ['business', 13], ['student', 11], ['police', 1.5], ['musician', 1]],
  faubourg: [['adult', 52], ['elder', 28], ['student', 10], ['worker', 6], ['business', 4]],
  parc: [['adult', 44], ['elder', 20], ['jogger', 10], ['tourist', 8], ['student', 12], ['musician', 1]],
  arts: [['adult', 36], ['tourist', 20], ['student', 20], ['elder', 10], ['business', 10], ['musician', 2], ['doctor', 1], ['nurse', 1]],
  riviere: [['adult', 42], ['elder', 18], ['fisher', 12], ['tourist', 10], ['student', 10], ['jogger', 8]],
  jardins: [['adult', 40], ['elder', 30], ['gardener', 25], ['student', 5]],
  port: [['docker', 48], ['adult', 25], ['fisher', 12], ['elder', 5], ['business', 5], ['worker', 5]],
};

type Activity = 'walk' | 'stand' | 'group' | 'family' | 'dog' | 'phone' | 'read' | 'point' | 'wave' | 'carry' | 'jog' | 'picnic' | 'lie' | 'play';

function activities(kind: string, district: string): W<Activity> {
  if (kind === 'park')
    return [['walk', 28], ['stand', 6], ['group', 9], ['family', 10], ['dog', 11], ['jog', 9], ['picnic', 9], ['lie', 5], ['read', 4], ['play', 6], ['phone', 3]];
  if (kind === 'plaza')
    return [['walk', 36], ['stand', 18], ['group', 15], ['family', 8], ['dog', 3], ['phone', 7], ['point', 4], ['wave', 3], ['read', 2], ['carry', 2], ['play', 2]];
  if (kind === 'courtyard' || kind === 'garden' || kind === 'sand')
    return [['stand', 22], ['group', 22], ['play', 24], ['walk', 14], ['carry', 6], ['family', 6], ['dog', 3], ['read', 3]];
  if (kind === 'dock' && district === 'port') return [['carry', 30], ['walk', 26], ['stand', 22], ['group', 12], ['point', 6], ['phone', 4]];
  if (kind === 'dock') return [['walk', 40], ['stand', 14], ['group', 14], ['dog', 9], ['jog', 8], ['family', 7], ['read', 4], ['phone', 4]];
  return [['walk', 56], ['stand', 12], ['group', 9], ['family', 6], ['dog', 5], ['phone', 6], ['read', 2], ['carry', 2], ['wave', 1], ['point', 1]];
}

function holdingFor(rng: Rng, role: Role, district: string, kind: string): HeldItem | undefined {
  if (role === 'tourist' && rng.chance(0.3)) return 'map';
  if ((kind === 'park' || district === 'riviere') && rng.chance(0.07)) return 'icecream';
  if (district === 'halles' && rng.chance(0.08)) return 'baguette';
  // Aucune tarte dans la foule : la tarte est un signe distinctif des personnages d'enquête
  // (c00, c04), pas un objet de décor. L'entrée « baguette 0,6 » garde la place de l'ancienne
  // tarte dans le tirage : le flux pseudo-aléatoire, donc les ids et les positions, ne bougent pas.
  return rng.weighted<HeldItem>([
    ['none', 88], ['baguette', 2.5], ['bottle', 2], ['letter', 2], ['box', 1.5], ['phone', 2], ['baguette', 0.6], ['key', 0.4], ['flashlight', 0.2], ['icecream', 0.8],
  ]);
}

function emoteFor(rng: Rng, role: Role): Emote | undefined {
  if (role === 'jogger' && rng.chance(0.3)) return 'sweat';
  if (role === 'tourist' && rng.chance(0.08)) return 'question';
  if (role === 'musician') return 'music';
  const e = rng.weighted<Emote>([['none', 92], ['exclaim', 1.5], ['question', 1.5], ['music', 1.2], ['heart', 1], ['idea', 1], ['angry', 0.8], ['sweat', 0.6], ['sleep', 0.2], ['talk', 0.2]]);
  return e === 'none' ? undefined : e;
}

/** Cases candidates (visibles, praticables) regroupées par catégorie sol × quartier. */
function candidateCells(g: Gen): Map<string, Int32Array> {
  const { cols, rows, kind, flags } = g.raster;
  const block = PERSON_BLOCK | F_ROAD | F_NOAMBIENT;
  const nd = DISTRICTS.length;
  const walk = new Uint8Array(GROUND_KINDS.length);
  for (const k of ['plaza', 'sidewalk', 'park', 'courtyard', 'garden', 'dock', 'parking', 'sand', 'bridge', 'grass'] as const) walk[KIND_INDEX[k]] = 1;
  // Quartier de chaque colonne / rangée de cases : les quartiers sont des rectangles.
  const distOf = (c: number, r: number): number => {
    const x = c * CELL + 1;
    const y = r * CELL + 1;
    for (let i = 0; i < nd; i++) {
      const d = DISTRICTS[i].rect;
      if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return i;
    }
    return 0;
  };
  const buckets: number[][] = Array.from({ length: GROUND_KINDS.length * nd }, () => []);
  // Une case sur deux en x et en y suffit (échantillonnage).
  for (let r = 0; r < rows; r += 2) {
    let lastD = -1;
    let lastC = -100;
    for (let c = 0; c < cols; c += 2) {
      const i = r * cols + c;
      if (flags[i] & block) continue;
      const k = kind[i];
      if (!walk[k]) continue;
      if (c - lastC > 2 || lastD < 0 || c * CELL >= DISTRICTS[lastD].rect.x + DISTRICTS[lastD].rect.w) lastD = distOf(c, r);
      lastC = c;
      buckets[k * nd + lastD].push(i);
    }
  }
  const out = new Map<string, Int32Array>();
  buckets.forEach((l, key) => {
    if (l.length) out.set(`${GROUND_KINDS[Math.floor(key / nd)]}:${DISTRICTS[key % nd].id}`, Int32Array.from(l));
  });
  return out;
}

function markNoAmbient(g: Gen): void {
  for (const id of ['cour-ecole', 'chantier', 'cimetiere', 'aire-de-jeux', 'jardins-ouvriers']) {
    const lm = LANDMARKS.find((l) => l.id === id);
    if (lm) g.raster.markRect(lm.rect, F_NOAMBIENT);
  }
}

function crowd(g: Gen, rng: Rng): void {
  markNoAmbient(g);
  const cells = candidateCells(g);
  const cols = g.raster.cols;
  for (const [key, list] of cells) {
    const [kind, district] = key.split(':');
    const area = list.length * CELL * CELL * 4;
    const target = Math.round((area * density(kind, district) * 0.92) / 10000);
    let placed = 0;
    for (let attempt = 0; attempt < target * 5 && placed < target; attempt++) {
      const i = list[Math.floor(rng.float() * list.length)];
      const x = (i % cols) * CELL + rng.float() * CELL * 2;
      const y = Math.floor(i / cols) * CELL + rng.float() * CELL * 2;
      placed += spawn(g, rng, kind, district, x, y);
    }
  }
}

/** Fait apparaître une activité au point (x, y). Renvoie le nombre de personnes posées. */
function spawn(g: Gen, rng: Rng, kind: string, district: string, x: number, y: number): number {
  if (!canStand(g, x, y) || !exactStandOk(g, x, y)) return 0;
  const act = rng.weighted(activities(kind, district));
  let roles = ROLES[district] ?? ROLES.centre;
  if (district === 'arts' && Math.abs(x - 5775) < 400 && Math.abs(y - 3100) < 300) roles = [['nurse', 20], ['doctor', 12], ['elder', 30], ['adult', 38]];
  const role = (): Role => rng.weighted(roles);
  const face = (): Facing => (rng.chance(0.5) ? 'left' : 'right');
  const one = (r: Role, pose: Pose, facing: Facing, extra: { holding?: HeldItem; emote?: Emote } = {}): void => {
    const a = randomAppearance(rng, r);
    addPerson(g, x, y, a, pose, facing, { holding: extra.holding ?? holdingFor(rng, r, district, kind), emote: extra.emote ?? emoteFor(rng, r) });
  };
  switch (act) {
    case 'walk':
      one(role(), 'walk', face());
      return 1;
    case 'stand':
      one(role(), 'stand', face());
      return 1;
    case 'phone':
      one(role(), 'phone', face(), { holding: 'none' });
      return 1;
    case 'read':
      one(rng.chance(0.5) ? 'elder' : role(), 'read', face(), { holding: rng.chance(0.4) ? 'letter' : 'none' });
      return 1;
    case 'point':
      one(rng.chance(0.5) ? 'tourist' : role(), 'point', face());
      return 1;
    case 'wave':
      one(role(), 'wave', face(), { emote: rng.chance(0.3) ? 'exclaim' : undefined });
      return 1;
    case 'carry': {
      const r = district === 'port' ? 'docker' : role();
      one(r, 'carry', face(), { holding: rng.chance(0.85) ? 'box' : 'baguette' });
      return 1;
    }
    case 'jog':
      one('jogger', 'run', face(), { holding: 'none' });
      return 1;
    case 'lie': {
      if (kind !== 'park') return 0;
      one(rng.chance(0.5) ? 'adult' : 'student', 'lie', face(), { holding: 'none', emote: rng.chance(0.3) ? 'sleep' : undefined });
      return 1;
    }
    case 'play': {
      const a = randomAppearance(rng, 'child');
      addPerson(g, x, y, a, rng.weighted<Pose>([['run', 40], ['crouch', 20], ['wave', 15], ['stand', 15], ['point', 10]]), face(), {
        emote: rng.chance(0.25) ? rng.pick<Emote>(['exclaim', 'heart', 'music', 'question', 'angry']) : undefined,
        holding: rng.chance(0.1) ? 'icecream' : undefined,
      });
      return 1;
    }
    case 'group':
    case 'picnic': {
      const n = rng.weighted([[2, 55], [3, 35], [4, 10]] as const);
      const sit = act === 'picnic' && kind === 'park';
      const pts: [number, number][] = [[x, y]];
      for (let k = 1; k < n; k++) pts.push([x + k * (sit ? 11 : 12), y + rng.int(-2, 2)]);
      if (!pts.slice(1).every(([px, py]) => canStand(g, px, py) && exactStandOk(g, px, py))) {
        one(role(), 'stand', face());
        return 1;
      }
      const couple = n === 2 && rng.chance(0.15);
      let talker = rng.int(0, n - 1);
      pts.forEach(([px, py], k) => {
        const facing: Facing = k === 0 ? 'right' : k === n - 1 ? 'left' : face();
        const r = couple ? 'adult' : role();
        const pose: Pose = sit ? 'sit' : rng.chance(0.15) ? rng.pick<Pose>(['point', 'wave', 'phone']) : 'stand';
        const emote: Emote | undefined = couple ? 'heart' : k === talker ? 'talk' : rng.chance(0.08) ? rng.pick<Emote>(['exclaim', 'question', 'idea']) : undefined;
        // (pas de tarte dans la foule ; 'bottle' x2 garde la taille de la liste, donc le flux aléatoire)
        addPerson(g, px, py, randomAppearance(rng, r), pose, facing, { emote, holding: sit && rng.chance(0.25) ? rng.pick<HeldItem>(['bottle', 'baguette', 'bottle']) : undefined });
        if (k === talker && rng.chance(0.3)) talker = -1;
      });
      return n;
    }
    case 'family': {
      const facing = face();
      const dir = facing === 'right' ? -1 : 1; // les enfants suivent
      const nk = rng.weighted([[1, 60], [2, 40]] as const);
      const pts: [number, number][] = [];
      for (let k = 1; k <= nk; k++) pts.push([x + dir * 11 * k, y + rng.int(-1, 1)]);
      if (!pts.every(([px, py]) => canStand(g, px, py) && exactStandOk(g, px, py))) {
        one(role(), 'walk', facing);
        return 1;
      }
      const pose: Pose = rng.chance(0.7) ? 'walk' : 'stand';
      addPerson(g, x, y, randomAppearance(rng, rng.chance(0.85) ? 'adult' : 'elder'), pose, facing, { holding: rng.chance(0.15) ? 'baguette' : undefined });
      for (const [px, py] of pts) {
        addPerson(g, px, py, randomAppearance(rng, 'child'), pose, facing, {
          holding: rng.chance(0.15) ? 'icecream' : undefined,
          emote: rng.chance(0.1) ? rng.pick<Emote>(['question', 'heart', 'exclaim']) : undefined,
        });
      }
      return 1 + nk;
    }
    case 'dog': {
      const facing = face();
      const dx = facing === 'right' ? 16 : -16;
      const big = rng.chance(0.45);
      const dogX = x + dx;
      if (g.raster.any({ x: dogX - 8, y: y - 3, w: 16, h: 4 }, PERSON_BLOCK | F_ROAD) || !exactStandOk(g, dogX, y)) {
        one(role(), 'walk', facing);
        return 1;
      }
      const r = rng.chance(0.3) ? 'elder' : role();
      addPerson(g, x, y, randomAppearance(rng, r === 'docker' || r === 'vendor' ? 'adult' : r), rng.chance(0.75) ? 'walk' : 'stand', facing, {
        holding: 'leash',
        emote: rng.chance(0.05) ? 'heart' : undefined,
      });
      addProp(g, 'dog', dogX, y + 0.5, {
        facing,
        variant: big ? 'big' : 'small',
        color: rng.pick<Color>(['brown', 'black', 'white', 'beige', 'grey', 'orange']),
      });
      return 1;
    }
  }
  return 0;
}

/* ----------------------------------------------------------------------------
 * Piétons sur les passages piétons
 * ------------------------------------------------------------------------- */

function crosswalkWalkers(g: Gen, rng: Rng): void {
  for (const l of g.gb.lines) {
    if (l.kind !== 'crosswalk' || !rng.chance(0.3)) continue;
    const [a, b] = l.points;
    const n = rng.int(1, 2);
    for (let k = 0; k < n; k++) {
      const t = 0.15 + rng.float() * 0.75;
      // Coordonnées arrondies comme dans l'entité finale, marge de sécurité de 0,5 u.
      const x = Math.round((a.x + (b.x - a.x) * t + (a.x === b.x ? rng.int(-1, 1) : 0)) * 10) / 10;
      const y = Math.round((a.y + (b.y - a.y) * t + (a.y === b.y ? rng.int(-1, 1) : 0)) * 10) / 10;
      if (!g.gi.onCrosswalk(x, y) || !g.gi.onCrosswalk(x - 3.5, y) || !g.gi.onCrosswalk(x + 3.5, y)) continue;
      if (g.raster.any({ x: x - 5, y: y - 3, w: 10, h: 4 }, F_SOLID | PERSON_BLOCK)) continue;
      const r = rng.weighted<Role>([['adult', 60], ['elder', 15], ['student', 10], ['business', 10], ['tourist', 5]]);
      addPerson(g, x, y, randomAppearance(rng, r), rng.chance(0.85) ? 'walk' : 'run', rng.chance(0.5) ? 'left' : 'right', { holding: holdingFor(rng, r, 'centre', 'sidewalk') });
    }
  }
}


