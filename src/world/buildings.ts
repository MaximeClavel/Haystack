// Bâtiments : lieux remarquables (exactement selon le plan directeur) puis remplissage des îlots.
//
// Contrainte de la vue oblique : un bâtiment d'emprise F et de hauteur H occupe à l'écran la bande
// [F.y − H, F.y + F.h] (toit puis façade sud). Pour que la ville reste lisible :
//   - la bande d'un bâtiment ne doit chevaucher celle d'aucun autre (aucune façade masquée) ;
//   - le toit ne doit recouvrir ni une rue, ni une place, ni l'eau (drapeau F_KEEPVIS).
// D'où l'organisation en rangées : rangée avant alignée sur la rue au sud (façades visibles),
// rangée arrière dont le toit s'aligne sur la rue au nord, cour intérieure visible entre les deux.
import type { BuildingEntity, BuildingFeature, BuildingStyle, Color, DistrictId, Rect } from '../types';
import { hashString, type Rng } from '../lib/rng';
import { LANDMARKS } from './layoutSpec';
import { inflate } from './geom';
import type { Block } from './layout';
import { makeRng, type Gen } from './context';
import { F_BUILDING, F_HIDDEN, F_KEEPVIS, F_NOBUILD } from './raster';
import { GRAFFITI, POSTERS, SignPicker, signFor } from './names';

interface StyleSpec {
  w: [number, number];
  d: [number, number];
  h: [number, number];
}

/** Gabarits : largeur (E-O), profondeur (N-S) et hauteur de façade. */
export const STYLE_SPECS: Partial<Record<BuildingStyle, StyleSpec>> = {
  house: { w: [62, 100], d: [46, 64], h: [44, 56] },
  townhouse: { w: [46, 76], d: [50, 72], h: [60, 90] },
  apartment: { w: [84, 170], d: [58, 90], h: [90, 140] },
  shop: { w: [54, 96], d: [46, 64], h: [50, 64] },
  cafe: { w: [60, 100], d: [46, 64], h: [50, 64] },
  bar: { w: [60, 100], d: [46, 64], h: [50, 64] },
  bakery: { w: [56, 84], d: [46, 60], h: [50, 62] },
  hotel: { w: [110, 190], d: [66, 96], h: [100, 140] },
  warehouse: { w: [120, 240], d: [70, 130], h: [50, 70] },
  factory: { w: [110, 230], d: [80, 130], h: [70, 100] },
  garage: { w: [66, 110], d: [48, 68], h: [44, 56] },
  shed: { w: [28, 48], d: [22, 32], h: [26, 36] },
  greenhouse: { w: [40, 70], d: [28, 44], h: [26, 36] },
};

type W<T> = readonly (readonly [T, number])[];

interface Profile {
  front: W<BuildingStyle>;
  back: W<BuildingStyle>;
  walls: W<Color>;
  roofs: W<Color>;
  /** Écart entre bâtiments voisins d'une rangée. */
  gap: [number, number];
  /** Probabilité d'un passage (ruelle) entre deux bâtiments. */
  alley: number;
  /** Recul de la façade par rapport à la rue au sud (jardin de devant). */
  frontGap: [number, number];
  /** Recul par rapport aux rues nord-sud. */
  edgeGap: [number, number];
  /** Probabilité qu'un immeuble ait un commerce au rez-de-chaussée. */
  groundShop: number;
}

const PROFILES: Record<string, Profile> = {
  halles: {
    front: [['shop', 34], ['townhouse', 26], ['apartment', 16], ['cafe', 8], ['bakery', 5], ['bar', 5], ['hotel', 2], ['warehouse', 4]],
    back: [['townhouse', 40], ['apartment', 34], ['warehouse', 16], ['shop', 10]],
    walls: [['beige', 18], ['yellow', 14], ['orange', 10], ['white', 14], ['pink', 8], ['brown', 10], ['red', 6], ['grey', 6], ['olive', 4]],
    roofs: [['brown', 30], ['red', 30], ['grey', 25], ['black', 10], ['orange', 5]],
    gap: [0, 3],
    alley: 0.1,
    frontGap: [0, 0],
    edgeGap: [0, 4],
    groundShop: 0.5,
  },
  centre: {
    front: [['apartment', 44], ['shop', 24], ['townhouse', 14], ['cafe', 10], ['bar', 6], ['bakery', 4], ['hotel', 2]],
    back: [['apartment', 60], ['townhouse', 32], ['shop', 8]],
    walls: [['pink', 12], ['yellow', 14], ['orange', 12], ['blue', 10], ['green', 9], ['white', 10], ['beige', 10], ['red', 8], ['purple', 4], ['olive', 4], ['navy', 3]],
    roofs: [['grey', 30], ['navy', 15], ['brown', 25], ['red', 20], ['black', 10]],
    gap: [0, 2],
    alley: 0.08,
    frontGap: [0, 0],
    edgeGap: [0, 2],
    groundShop: 0.55,
  },
  gare: {
    front: [['apartment', 34], ['hotel', 12], ['shop', 18], ['cafe', 7], ['bar', 7], ['townhouse', 12], ['warehouse', 8]],
    back: [['apartment', 40], ['warehouse', 30], ['townhouse', 30]],
    walls: [['grey', 18], ['beige', 20], ['brown', 14], ['white', 14], ['navy', 6], ['red', 8], ['yellow', 8], ['olive', 6], ['pink', 6]],
    roofs: [['grey', 40], ['black', 25], ['navy', 15], ['brown', 15], ['red', 5]],
    gap: [0, 3],
    alley: 0.12,
    frontGap: [0, 0],
    edgeGap: [0, 4],
    groundShop: 0.4,
  },
  arts: {
    front: [['apartment', 52], ['townhouse', 18], ['shop', 14], ['cafe', 9], ['bar', 4], ['hotel', 3]],
    back: [['apartment', 55], ['townhouse', 45]],
    walls: [['white', 22], ['beige', 22], ['grey', 14], ['pink', 12], ['yellow', 8], ['navy', 6], ['blue', 6], ['green', 5], ['purple', 5]],
    roofs: [['navy', 30], ['grey', 30], ['black', 15], ['green', 15], ['brown', 10]],
    gap: [0, 2],
    alley: 0.1,
    frontGap: [0, 4],
    edgeGap: [0, 4],
    groundShop: 0.35,
  },
  faubourg: {
    front: [['house', 66], ['townhouse', 14], ['shop', 7], ['garage', 7], ['cafe', 3], ['bakery', 3]],
    back: [['house', 70], ['garage', 12], ['shed', 12], ['townhouse', 6]],
    walls: [['white', 20], ['beige', 18], ['yellow', 14], ['pink', 12], ['orange', 10], ['blue', 8], ['green', 8], ['red', 6], ['grey', 4]],
    roofs: [['red', 40], ['brown', 30], ['orange', 15], ['grey', 15]],
    gap: [14, 34],
    alley: 0,
    frontGap: [10, 22],
    edgeGap: [8, 18],
    groundShop: 0,
  },
  jardins: {
    front: [['house', 74], ['shop', 4], ['garage', 6], ['greenhouse', 8], ['shed', 8]],
    back: [['house', 50], ['shed', 25], ['greenhouse', 25]],
    walls: [['white', 22], ['beige', 18], ['yellow', 14], ['green', 12], ['blue', 12], ['pink', 10], ['orange', 6], ['olive', 6]],
    roofs: [['red', 40], ['brown', 25], ['green', 15], ['orange', 10], ['grey', 10]],
    gap: [18, 44],
    alley: 0,
    frontGap: [12, 26],
    edgeGap: [10, 24],
    groundShop: 0,
  },
  industrial: {
    front: [['warehouse', 46], ['factory', 30], ['garage', 12], ['shed', 4], ['bar', 4], ['shop', 4]],
    back: [['warehouse', 55], ['shed', 25], ['garage', 20]],
    walls: [['grey', 22], ['brown', 18], ['red', 14], ['navy', 10], ['blue', 10], ['olive', 10], ['beige', 10], ['white', 6]],
    roofs: [['grey', 40], ['black', 25], ['olive', 10], ['red', 15], ['navy', 10]],
    gap: [6, 20],
    alley: 0.1,
    frontGap: [0, 6],
    edgeGap: [4, 10],
    groundShop: 0,
  },
};

function profileFor(b: Block): Profile {
  if (b.kind === 'industrial') return PROFILES.industrial;
  if (b.kind === 'houses') return b.district === 'jardins' ? PROFILES.jardins : PROFILES.faubourg;
  const p = PROFILES[b.district];
  return p ?? PROFILES.centre;
}

const SHOPLIKE = new Set<BuildingStyle>(['shop', 'cafe', 'bar', 'bakery', 'pharmacy', 'jeweler']);

/* ----------------------------------------------------------------------------
 * Placement contraint
 * ------------------------------------------------------------------------- */

function band(f: Rect, h: number): Rect {
  return { x: f.x, y: f.y - h, w: f.w, h: f.h + h };
}

export interface PlaceOpts {
  /** Écart minimal avec les autres emprises. */
  gap?: number;
  /** Ignore l'interdiction de construire (bâtiments dans une zone qui en accueille : entrepôts, jardins). */
  inside?: Rect;
}

/** Le bâtiment (emprise f, hauteur h) peut-il être posé sans violer les règles de lisibilité ? */
export function canPlaceBuilding(g: Gen, f: Rect, h: number, opts: PlaceOpts = {}): boolean {
  if (f.x < 0 || f.y - h < 0 || f.x + f.w > g.raster.cols * 4 || f.y + f.h > g.raster.rows * 4) return false;
  // Tests bon marché d'abord (index des autres bâtiments), puis la grille.
  if (g.bandHash.hits(band(f, h), 1)) return false;
  if (g.footHash.hits(inflate(f, opts.gap ?? 0))) return false;
  if (opts.inside) {
    const r = opts.inside;
    if (f.x < r.x || f.y < r.y || f.x + f.w > r.x + r.w || f.y + f.h > r.y + r.h) return false;
  } else if (g.raster.any(f, F_NOBUILD)) return false;
  const roof = { x: f.x, y: f.y - h, w: f.w, h };
  if (opts.inside) {
    // Dans une zone qui accueille des bâtiments, le toit peut couvrir la zone elle-même mais pas l'extérieur.
    const r = opts.inside;
    if (roof.y < r.y && g.raster.any({ x: roof.x, y: roof.y, w: roof.w, h: r.y - roof.y }, F_KEEPVIS)) return false;
  } else if (g.raster.any(roof, F_KEEPVIS)) return false;
  return true;
}

export function addBuilding(
  g: Gen,
  district: string,
  style: BuildingStyle,
  f: Rect,
  h: number,
  wall: Color,
  roof: Color,
  extra: { sign?: string; features?: BuildingFeature[]; id?: string; tags?: string[] } = {},
): BuildingEntity {
  let id = extra.id;
  if (!id) {
    const n = g.districtCounters.get(district) ?? 0;
    g.districtCounters.set(district, n + 1);
    id = `b.${district}.${n}`;
  }
  const b: BuildingEntity = {
    id,
    kind: 'building',
    style,
    footprint: { x: f.x, y: f.y, w: f.w, h: f.h },
    x: f.x + f.w / 2,
    y: f.y + f.h,
    height: Math.round(h),
    wall,
    roof,
    seed: hashString(id),
  };
  if (extra.sign) b.sign = extra.sign;
  if (extra.features && extra.features.length) b.features = extra.features;
  if (extra.tags) b.tags = extra.tags;
  g.buildings.push(b);
  g.footHash.add(b.footprint, b);
  g.bandHash.add(band(b.footprint, b.height), b);
  return b;
}

/** Marque la grille : emprises (interdites) et sol masqué par les toits. À appeler après tous les bâtiments. */
export function markBuildings(g: Gen): void {
  for (const b of g.buildings) {
    const f = b.footprint;
    g.raster.markRect(f, F_BUILDING | F_NOBUILD);
    g.raster.markRect({ x: f.x - 1, y: f.y - b.height, w: f.w + 2, h: b.height }, F_HIDDEN);
  }
}

/* ----------------------------------------------------------------------------
 * Détails de façade
 * ------------------------------------------------------------------------- */

export function floorsOf(h: number): number {
  return Math.max(1, 1 + Math.floor((h - 28) / 24));
}

function makeFeatures(rng: Rng, style: BuildingStyle, h: number, w: number, district: string, shopFront: boolean, awning: Color): BuildingFeature[] {
  const out: BuildingFeature[] = [];
  const floors = floorsOf(h);
  const at = () => Math.round((0.12 + rng.float() * 0.76) * 100) / 100;
  if (shopFront) {
    if (w > 110 && rng.chance(0.5)) {
      out.push({ kind: 'awning', at: 0.28, floor: 0, color: awning });
      out.push({ kind: 'awning', at: 0.72, floor: 0, color: awning });
    } else if (rng.chance(0.82)) out.push({ kind: 'awning', at: 0.5, floor: 0, color: awning });
    if (rng.chance(0.12)) out.push({ kind: 'openDoor', at: rng.chance(0.5) ? 0.2 : 0.8, floor: 0 });
  }
  if ((style === 'apartment' || style === 'townhouse' || style === 'hotel') && floors > 1) {
    const n = rng.int(0, Math.min(3, floors - 1) + (style === 'hotel' ? 1 : 0));
    for (let i = 0; i < n; i++) out.push({ kind: 'balcony', at: at(), floor: rng.int(1, floors - 1) });
  }
  if (style !== 'shed' && style !== 'greenhouse') {
    const lit = rng.weighted([[0, 50], [1, 30], [2, 15], [3, 5]] as const);
    for (let i = 0; i < lit; i++) out.push({ kind: 'litWindow', at: at(), floor: rng.int(floors > 1 ? 1 : 0, floors - 1) });
    if (rng.chance(0.22)) out.push({ kind: 'openWindow', at: at(), floor: rng.int(floors > 1 ? 1 : 0, floors - 1) });
  }
  if (rng.chance(district === 'port' ? 0.18 : 0.08)) out.push({ kind: 'poster', at: at(), floor: 0, text: rng.pick(POSTERS) });
  const graffitiChance = district === 'port' ? 0.32 : style === 'warehouse' || style === 'factory' ? 0.12 : 0.015;
  if (rng.chance(graffitiChance)) out.push({ kind: 'graffiti', at: at(), floor: 0, text: rng.pick(GRAFFITI) });
  if (!shopFront && style !== 'shed' && style !== 'greenhouse' && rng.chance(0.06)) out.push({ kind: 'openDoor', at: at(), floor: 0 });
  return out;
}

const AWNINGS: Color[] = ['red', 'green', 'blue', 'yellow', 'orange', 'navy', 'white', 'purple', 'brown', 'pink', 'olive'];

/* ----------------------------------------------------------------------------
 * Lieux remarquables
 * ------------------------------------------------------------------------- */

const LANDMARK_FEATURES: Record<string, BuildingFeature[]> = {
  gare: [{ kind: 'poster', at: 0.12, floor: 0, text: 'HORAIRES' }, { kind: 'litWindow', at: 0.7, floor: 2 }],
  'grand-hotel': [
    { kind: 'awning', at: 0.5, floor: 0, color: 'navy' },
    { kind: 'balcony', at: 0.25, floor: 2 },
    { kind: 'balcony', at: 0.75, floor: 2 },
    { kind: 'balcony', at: 0.5, floor: 3 },
    { kind: 'litWindow', at: 0.35, floor: 4 },
  ],
  'bar-fer-a-cheval': [{ kind: 'awning', at: 0.5, floor: 0, color: 'green' }],
  garage: [{ kind: 'openDoor', at: 0.3, floor: 0 }, { kind: 'poster', at: 0.8, floor: 0, text: 'VIDANGE' }],
  boulangerie: [{ kind: 'awning', at: 0.5, floor: 0, color: 'yellow' }],
  boucherie: [{ kind: 'awning', at: 0.5, floor: 0, color: 'red' }],
  cinema: [{ kind: 'poster', at: 0.2, floor: 0, text: 'CE SOIR' }, { kind: 'poster', at: 0.8, floor: 0, text: 'FILM' }],
  'hotel-de-ville': [{ kind: 'balcony', at: 0.5, floor: 1 }, { kind: 'litWindow', at: 0.2, floor: 2 }],
  'cafe-du-centre': [{ kind: 'awning', at: 0.5, floor: 0, color: 'orange' }],
  bijouterie: [{ kind: 'awning', at: 0.5, floor: 0, color: 'navy' }],
  pharmacie: [{ kind: 'awning', at: 0.5, floor: 0, color: 'green' }],
  fleuriste: [{ kind: 'awning', at: 0.5, floor: 0, color: 'pink' }],
  librairie: [{ kind: 'awning', at: 0.5, floor: 0, color: 'brown' }],
  musee: [{ kind: 'poster', at: 0.15, floor: 0, text: 'EXPO' }],
  theatre: [{ kind: 'poster', at: 0.15, floor: 0, text: 'CE SOIR' }, { kind: 'poster', at: 0.85, floor: 0, text: 'OPÉRA' }],
  poste: [{ kind: 'litWindow', at: 0.3, floor: 1 }],
};

export function placeLandmarks(g: Gen): void {
  for (const lm of LANDMARKS) {
    if (lm.kind !== 'building') continue;
    addBuilding(g, lm.district, lm.style ?? 'shop', lm.rect, lm.height ?? 60, lm.wall ?? 'beige', lm.roof ?? 'grey', {
      id: `lm.${lm.id}`,
      sign: lm.sign,
      features: LANDMARK_FEATURES[lm.id]?.map((f) => ({ ...f })),
      tags: ['landmark'],
    });
  }
}

/* ----------------------------------------------------------------------------
 * Remplissage des îlots
 * ------------------------------------------------------------------------- */

const ceil4 = (v: number): number => Math.ceil(v / 4) * 4;
const floor4 = (v: number): number => Math.floor(v / 4) * 4;

interface RowCtx {
  g: Gen;
  rng: Rng;
  block: Block;
  prof: Profile;
  signs: SignPicker;
  lastWall: Color | null;
}

function pickColor(ctx: RowCtx): Color {
  let c = ctx.rng.weighted(ctx.prof.walls);
  if (c === ctx.lastWall) c = ctx.rng.weighted(ctx.prof.walls);
  ctx.lastWall = c;
  return c;
}

function makeBuilding(ctx: RowCtx, style: BuildingStyle, f: Rect, h: number): BuildingEntity {
  const { rng, block, prof } = ctx;
  const district = block.district;
  let sign = signFor(style, district, ctx.signs);
  let shopFront = SHOPLIKE.has(style);
  if (!shopFront && (style === 'apartment' || style === 'townhouse') && rng.chance(prof.groundShop)) {
    shopFront = true;
    sign = ctx.signs.next(district === 'arts' ? 'arts' : 'shop', district === 'arts' ? ['GALERIE', 'ENCADREUR', 'LUTHIER', 'BOUQUINISTE', 'PHOTO', 'ATELIER'] : ['TABAC', 'ÉPICERIE', 'COIFFEUR', 'PRESSING', 'QUINCAILLERIE', 'FROMAGERIE', 'OPTICIEN', 'LAVERIE', 'HORLOGER', 'CORDONNIER', 'DROGUERIE', 'CHAPELIER', 'MERCERIE', 'CRÊPERIE', 'BRASSERIE', 'PÂTISSERIE', 'PRIMEUR', 'CAVISTE', 'BAZAR', 'PAPETERIE']);
  }
  if (style === 'warehouse' && district !== 'port' && rng.chance(0.5)) sign = undefined;
  const wall = style === 'greenhouse' ? 'white' : pickColor(ctx);
  const roof = style === 'greenhouse' ? 'white' : rng.weighted(prof.roofs);
  const features = makeFeatures(rng, style, h, f.w, district, shopFront, rng.pick(AWNINGS));
  return addBuilding(ctx.g, district, style, f, h, wall, roof, { sign, features });
}

/** Choisit des dimensions qui tiennent dans le budget de profondeur (emprise + hauteur), au plus près du budget. */
function dims(rng: Rng, style: BuildingStyle, maxBand: number, maxW: number): { w: number; d: number; h: number } | null {
  const s = STYLE_SPECS[style];
  if (!s) return null;
  if (maxW < s.w[0]) return null;
  const w = Math.min(maxW, rng.int(s.w[0], s.w[1]));
  let d = rng.int(s.d[0], s.d[1]);
  let hMax = Math.min(s.h[1], maxBand - d);
  if (hMax < s.h[0]) {
    d = s.d[0];
    hMax = Math.min(s.h[1], maxBand - d);
    if (hMax < s.h[0]) return null;
  }
  // Si le budget le permet, on approfondit l'emprise pour remplir l'îlot.
  if (s.h[1] + d < maxBand) d = Math.min(s.d[1], maxBand - s.h[1]);
  const h = rng.int(Math.max(s.h[0], Math.floor(hMax) - 16), Math.floor(Math.min(s.h[1], maxBand - d)));
  return { w, d, h };
}

/** Tirage d'un style pondéré par sa capacité à remplir le budget de profondeur. */
function pickStyle(rng: Rng, styles: W<BuildingStyle>, budget: number, strict: boolean): BuildingStyle | null {
  const weighted = styles
    .map(([st, w]) => {
      const s = STYLE_SPECS[st];
      if (!s || s.d[0] + s.h[0] > budget) return [st, 0] as const;
      const fill = !strict || s.d[1] + s.h[1] >= budget - 40 ? 1 : 0.3;
      return [st, w * fill] as const;
    })
    .filter(([, w]) => w > 0);
  if (!weighted.length) return null;
  return rng.weighted(weighted);
}

type RowMode = 'front' | 'back' | 'middle';

/** Remplit une rangée de l'îlot d'ouest en est. `maxBand` = budget de profondeur (emprise + hauteur). */
function fillRow(ctx: RowCtx, mode: RowMode, maxBand: number, skyline?: (x0: number, x1: number) => number): number {
  const { rng, block, prof, g } = ctx;
  const r = block.rect;
  const x0 = ceil4(r.x) + rng.int(prof.edgeGap[0], prof.edgeGap[1]);
  const xEnd = floor4(r.x + r.w) - rng.int(prof.edgeGap[0], prof.edgeGap[1]);
  const yBottom = floor4(r.y + r.h);
  const yTop = ceil4(r.y);
  let x = x0;
  let placed = 0;
  let guard = 0;
  while (x < xEnd - 24 && guard++ < 400) {
    const styles = mode === 'front' ? prof.front : prof.back;
    let ok = false;
    const fg = mode === 'front' ? rng.int(prof.frontGap[0], prof.frontGap[1]) : 0;
    let floorY = yBottom - fg;
    if (mode === 'middle' && skyline) floorY = skyline(x, Math.min(xEnd, x + 120)) - rng.int(14, 30);
    const budget = mode === 'front' ? maxBand - fg : maxBand;
    for (let attempt = 0; attempt < 6 && !ok; attempt++) {
      const urban = block.kind === 'urban';
      const style =
        attempt < 4 ? pickStyle(rng, styles, budget, block.kind === 'urban') : attempt === 4 ? (urban ? 'shop' : 'shed') : urban ? 'townhouse' : 'shed';
      if (!style) continue;
      const dm = dims(rng, style, budget, xEnd - x);
      if (!dm) continue;
      // Évite de laisser un reliquat inutilisable au bout de la rangée.
      const spec = STYLE_SPECS[style]!;
      const rest = xEnd - (x + dm.w);
      if (rest > 0 && rest < 30 && dm.w + rest <= spec.w[1] * 1.25) dm.w += rest;
      // Essais : dimensions tirées, puis plus bas, puis moins profond.
      const tries: [number, number][] = [
        [dm.h, dm.d],
        [Math.max(spec.h[0], dm.h - 20), dm.d],
        [spec.h[0], spec.d[0]],
      ];
      for (const [hh, dd] of tries) {
        let ff: Rect;
        if (mode === 'back') ff = { x, y: yTop + hh + 1, w: dm.w, h: dd };
        else {
          let y1 = floorY;
          if (mode === 'middle' && skyline) y1 = Math.min(y1, skyline(x, x + dm.w) - 14);
          ff = { x, y: y1 - dd, w: dm.w, h: dd };
        }
        if (canPlaceBuilding(g, ff, hh, { gap: 1 })) {
          makeBuilding(ctx, style, ff, hh);
          placed++;
          ok = true;
          const gap = rng.chance(prof.alley) ? rng.int(12, 26) : rng.int(prof.gap[0], prof.gap[1]);
          x += ff.w + gap;
          break;
        }
      }
    }
    if (!ok) x += 8;
  }
  return placed;
}

function fillBlock(g: Gen, block: Block, signs: SignPicker): void {
  if (block.kind === 'empty' || block.kind === 'square' || block.kind === 'parking' || block.kind === 'sand') return;
  const rng = makeRng(g.seed, `block:${block.id}`);
  const prof = profileFor(block);
  const ctx: RowCtx = { g, rng, block, prof, signs, lastWall: null };
  const r = block.rect;
  const D = floor4(r.y + r.h) - ceil4(r.y);
  if (D < 60 || r.w < 30) return;
  const houses = block.kind === 'houses';
  if (D < (houses ? 210 : 230)) {
    fillRow(ctx, 'front', D - rng.int(0, houses ? 24 : 10));
    return;
  }
  if (D < 470) {
    const fb = Math.round(D * rng.range(0.46, 0.58));
    fillRow(ctx, 'front', fb);
    fillRow(ctx, 'back', D - fb - rng.int(houses ? 20 : 12, houses ? 50 : 36));
    return;
  }
  // Îlot très profond : avant, arrière, puis rangée du milieu qui s'appuie sur la rangée avant.
  const fb = Math.round(D * 0.36);
  const bb = Math.round(D * 0.3);
  fillRow(ctx, 'front', fb);
  fillRow(ctx, 'back', bb);
  const sky = (x0: number, x1: number): number => {
    let m = floor4(r.y + r.h);
    for (const b of g.bandHash.query({ x: x0, y: r.y, w: Math.max(1, x1 - x0), h: r.h })) {
      if (b.footprint.y + b.footprint.h > r.y + r.h * 0.55) m = Math.min(m, b.footprint.y - b.height);
    }
    return m;
  };
  fillRow(ctx, 'middle', D - fb - bb - 30, sky);
}

/** Remplit tous les îlots du plan. */
export function fillBlocks(g: Gen): void {
  const signs = new SignPicker(makeRng(g.seed, 'signs'));
  // Ordre stable : du nord au sud, d'ouest en est.
  const blocks = [...g.plan.blocks].sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x);
  for (const b of blocks) fillBlock(g, b, signs);
}

/** Nombre de bâtiments générés par quartier (diagnostic). */
export function countByDistrict(list: BuildingEntity[]): Record<DistrictId | string, number> {
  const out: Record<string, number> = {};
  for (const b of list) {
    const d = b.id.split('.')[1];
    out[d] = (out[d] ?? 0) + 1;
  }
  return out;
}


