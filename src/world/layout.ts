// Plan des rues de Meulebourg : avenues du plan directeur + rues secondaires saisies à la main
// (autour des lieux remarquables) + subdivision aléatoire (à graine) des grands îlots.
//
// Principe : chaque quartier est une « zone » rectangulaire bordée d'avenues. On la découpe
// récursivement par des rues qui la traversent de part en part (découpe en guillotine) :
// d'abord les rues imposées (liste ordonnée), puis des rues aléatoires tant que l'îlot est trop
// grand. Les feuilles sont les îlots (rectangles). Les rues en biais et les impasses sont ensuite
// superposées : elles « mordent » dans les îlots (aucun bâtiment ne peut les chevaucher).
import type { DistrictId, Rect, Vec2 } from '../types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { Rng } from '../lib/rng';
import { AVENUES, DISTRICTS, LANDMARKS, RAIL, RIVER } from './layoutSpec';
import { containsPoint, inflate, intersects, rect, rectPoints, rectXY } from './geom';

export type StreetKind = 'avenue' | 'street' | 'lane' | 'port';

export interface Street {
  id: string;
  name: string;
  kind: StreetKind;
  /** 'h' = est-ouest, 'v' = nord-sud, 'd' = en biais (extrémités horizontales). */
  axis: 'h' | 'v' | 'd';
  a: Vec2;
  b: Vec2;
  /** Largeur totale (chaussée + trottoirs). */
  width: number;
  /** Largeur de chaque trottoir (0 = pas de trottoir). */
  sidewalk: number;
  /** Polygone complet (trottoirs compris). */
  poly: Vec2[];
  /** Polygone de la chaussée. */
  roadPoly: Vec2[];
  /** Rectangle englobant (exact pour les rues droites). */
  rect: Rect;
  /** Rectangle de la chaussée (rues droites). */
  roadRect: Rect;
  /** Impasse : aire de retournement au bout b. */
  deadEnd?: boolean;
  /** Formes supplémentaires (aire de retournement). */
  extra?: { sidewalk: Vec2[]; road: Vec2[] };
}

export type BlockKind = 'urban' | 'houses' | 'square' | 'parking' | 'sand' | 'industrial' | 'empty';

export interface Block {
  id: number;
  rect: Rect;
  district: DistrictId;
  zone: string;
  kind: BlockKind;
}

/** Emplacement remarquable non listé dans le plan directeur (parvis, parkings, quais de gare…). */
export interface Spot {
  id: string;
  name: string;
  rect: Rect;
  ground: 'plaza' | 'park' | 'parking' | 'courtyard' | 'garden' | 'sand' | 'dock';
}

export const STREET_W = 56;
export const STREET_SIDEWALK = 10;
export const LANE_W = 44;
export const LANE_SIDEWALK = 8;

export function districtAt(x: number, y: number): DistrictId {
  for (const d of DISTRICTS) if (containsPoint(d.rect, x, y)) return d.id;
  return x < 3200 ? 'jardins' : 'port';
}

/* ----------------------------------------------------------------------------
 * Construction des rues
 * ------------------------------------------------------------------------- */

function straightStreet(
  id: string,
  name: string,
  kind: StreetKind,
  a: Vec2,
  b: Vec2,
  width: number,
  sidewalk: number,
): Street {
  const horizontal = a.y === b.y;
  const hw = width / 2;
  const rw = hw - sidewalk;
  let r: Rect;
  let rr: Rect;
  if (horizontal) {
    r = rectXY(Math.min(a.x, b.x), a.y - hw, Math.max(a.x, b.x), a.y + hw);
    rr = rectXY(Math.min(a.x, b.x), a.y - rw, Math.max(a.x, b.x), a.y + rw);
  } else {
    r = rectXY(a.x - hw, Math.min(a.y, b.y), a.x + hw, Math.max(a.y, b.y));
    rr = rectXY(a.x - rw, Math.min(a.y, b.y), a.x + rw, Math.max(a.y, b.y));
  }
  return {
    id,
    name,
    kind,
    axis: horizontal ? 'h' : 'v',
    a,
    b,
    width,
    sidewalk,
    poly: rectPoints(r),
    roadPoly: rectPoints(rr),
    rect: r,
    roadRect: rr,
  };
}

/** Rue en biais entre deux ordonnées : parallélogramme à extrémités horizontales. */
function diagonalStreet(id: string, name: string, a: Vec2, b: Vec2, width: number, sidewalk: number): Street {
  const dy = Math.abs(b.y - a.y);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const k = len / dy; // élargissement horizontal
  const hw = (width / 2) * k;
  const rw = (width / 2 - sidewalk) * k;
  const quad = (h: number): Vec2[] => [
    { x: a.x - h, y: a.y },
    { x: a.x + h, y: a.y },
    { x: b.x + h, y: b.y },
    { x: b.x - h, y: b.y },
  ];
  const poly = quad(hw);
  const xs = poly.map((p) => p.x);
  const r = rectXY(Math.min(...xs), Math.min(a.y, b.y), Math.max(...xs), Math.max(a.y, b.y));
  return {
    id,
    name,
    kind: 'street',
    axis: 'd',
    a,
    b,
    width,
    sidewalk,
    poly,
    roadPoly: quad(rw),
    rect: r,
    roadRect: r,
  };
}

/* ----------------------------------------------------------------------------
 * Plan saisi à la main
 * ------------------------------------------------------------------------- */

interface StreetSpec {
  name: string;
  /** Horizontale : y ; verticale : x. */
  axis: 'h' | 'v';
  at: number;
  from: number;
  to: number;
  width?: number;
  kind?: StreetKind;
}

const H = (name: string, y: number, x0: number, x1: number, width = STREET_W): StreetSpec => ({
  name,
  axis: 'h',
  at: y,
  from: x0,
  to: x1,
  width,
});
const V = (name: string, x: number, y0: number, y1: number, width = STREET_W): StreetSpec => ({
  name,
  axis: 'v',
  at: x,
  from: y0,
  to: y1,
  width,
});

interface ZoneSpec {
  id: string;
  rect: Rect;
  /** Rues imposées (dans l'ordre de priorité). */
  streets: StreetSpec[];
  /** Profondeur (N-S) et largeur (E-O) visées pour les îlots : [min, max]. 0 = pas de découpe aléatoire. */
  depth: [number, number];
  width: [number, number];
  /** Probabilité d'impasse dans un grand îlot. */
  impasse: number;
}

const ZONES: ZoneSpec[] = [
  // --- Quartier de la Gare ---------------------------------------------------
  {
    id: 'gare-ouest-n',
    rect: rectXY(0, 0, 225, 1264),
    streets: [V('Rue du Ballast', 170, 0, 3650)],
    depth: [180, 320],
    width: [999, 999],
    impasse: 0,
  },
  {
    id: 'gare-ouest-c',
    rect: rectXY(0, 1336, 225, 2864),
    streets: [V('Rue du Ballast', 170, 0, 3650)],
    depth: [180, 320],
    width: [999, 999],
    impasse: 0,
  },
  {
    id: 'gare-ouest-s',
    rect: rectXY(0, 2936, 225, 3618),
    streets: [V('Rue du Ballast', 170, 0, 3650)],
    depth: [180, 320],
    width: [999, 999],
    impasse: 0,
  },
  {
    id: 'gare-nord',
    rect: rectXY(295, 0, 1414, 1264),
    streets: [
      V('Rue des Rails', 324, 0, 1300),
      H('Rue de Paris', 620, 324, 1450),
      V('Rue du Tender', 880, 0, 620),
      V('Rue de l\'Aiguillage', 700, 620, 1300),
    ],
    depth: [180, 330],
    width: [200, 480],
    impasse: 0.15,
  },
  {
    id: 'gare-centre',
    rect: rectXY(295, 1336, 1414, 2864),
    streets: [
      H('Rue de la Gare', 1848, 324, 1450),
      V('Rue des Rails', 324, 1848, 3650),
      H('Rue du Fer-à-Cheval', 2290, 324, 1450),
      V('Rue des Voyageurs', 1000, 1848, 2290),
      V('Rue du Sémaphore', 900, 2290, 2900),
    ],
    depth: [180, 320],
    width: [200, 460],
    impasse: 0.15,
  },
  {
    id: 'gare-sud',
    rect: rectXY(295, 2936, 1414, 3618),
    streets: [
      V('Rue des Rails', 324, 1848, 3650),
      H('Rue des Pistons', 3330, 324, 1450),
      V('Rue de la Bielle', 800, 2900, 3650),
    ],
    depth: [170, 300],
    width: [200, 460],
    impasse: 0.2,
  },
  // --- Les Halles ------------------------------------------------------------
  {
    id: 'halles-ouest',
    rect: rectXY(1486, 0, 2164, 1264),
    streets: [H('Rue des Grains', 700, 1450, 2200), V('Rue du Grenier', 1830, 0, 700)],
    depth: [170, 300],
    width: [180, 420],
    impasse: 0.15,
  },
  {
    id: 'halles-est',
    rect: rectXY(2236, 0, 4214, 1264),
    streets: [
      V('Rue des Maraîchers', 2472, 0, 1300),
      V('Rue des Étals', 3228, 0, 1300),
      H('Rue du Marché', 392, 2200, 3228),
      H('Rue des Halles', 928, 2200, 4250),
      H('Rue du Cinéma', 660, 3228, 4250),
    ],
    depth: [170, 300],
    width: [180, 440],
    impasse: 0.1,
  },
  // --- Vieille Ville -----------------------------------------------------------
  {
    id: 'centre-ouest',
    rect: rectXY(1486, 1336, 2164, 2864),
    streets: [
      H('Rue de la Poste', 1572, 1450, 2200),
      H('Rue des Remèdes', 1830, 1450, 2200),
      V('Rue de l\'Ordre', 1960, 1830, 2900),
      H('Rue des Tanneurs', 2100, 1450, 2200),
      H('Rue du Guet', 2640, 1450, 2200),
    ],
    depth: [160, 300],
    width: [160, 400],
    impasse: 0.15,
  },
  {
    id: 'centre-est',
    rect: rectXY(2236, 1336, 4214, 2864),
    streets: [
      V('Rue du Temple', 3528, 1300, 2900),
      H('Rue de la Bijouterie', 2548, 2200, 3528),
      V('Rue du Beffroi', 3100, 1300, 1570, LANE_W),
      H('Rue des Fleurs', 1570, 3100, 4250),
      H('Rue de la Librairie', 1828, 3528, 4250),
      H('Rue de l\'Horloge', 1808, 2200, 2500),
      H('Rue de la Banque', 2108, 2200, 2500),
      H('Rue Saint-Foin', 2380, 3236, 3528),
    ],
    depth: [160, 300],
    width: [150, 400],
    impasse: 0.15,
  },
  // --- Le Faubourg --------------------------------------------------------------
  {
    id: 'faubourg-ouest',
    rect: rectXY(1486, 2936, 2164, 3618),
    streets: [
      H('Rue des Écoliers', 3460, 1450, 2200),
      V('Rue de la Craie', 2080, 2900, 3460),
      V('Rue des Préaux', 1620, 2900, 3650),
    ],
    depth: [140, 240],
    width: [200, 520],
    impasse: 0.2,
  },
  {
    id: 'faubourg-est',
    rect: rectXY(2236, 2936, 4214, 3618),
    streets: [
      H('Rue des Moissons', 3460, 2200, 4250),
      V('Rue de la Truelle', 3240, 2900, 3460),
      V('Rue des Maçons', 3810, 2900, 3650),
    ],
    depth: [140, 250],
    width: [200, 520],
    impasse: 0.25,
  },
  // --- Quartier des Arts --------------------------------------------------------
  {
    id: 'arts-no',
    rect: rectXY(4286, 2082, 5268, 2864),
    streets: [H('Rue des Muses', 2588, 4250, 5300), V('Rue des Peintres', 5020, 2050, 2900)],
    depth: [200, 330],
    width: [220, 520],
    impasse: 0.1,
  },
  {
    id: 'arts-ne',
    rect: rectXY(5332, 2082, 6400, 2864),
    streets: [H('Rue Molière', 2568, 5300, 6400), V('Rue de l\'Opéra', 5960, 2050, 2900)],
    depth: [200, 330],
    width: [220, 520],
    impasse: 0.1,
  },
  {
    id: 'arts-so',
    rect: rectXY(4286, 2936, 5268, 3618),
    streets: [H('Rue des Cyprès', 3545, 4250, 5300), V('Rue du Repos', 5185, 2900, 3545)],
    depth: [200, 330],
    width: [220, 520],
    impasse: 0,
  },
  {
    id: 'arts-se',
    rect: rectXY(5332, 2936, 6400, 3618),
    streets: [H('Rue des Brancards', 3270, 5300, 6400), V('Rue Sainte-Paille', 6150, 2900, 3650)],
    depth: [200, 330],
    width: [220, 520],
    impasse: 0.1,
  },
  // --- Rive sud -------------------------------------------------------------------
  {
    id: 'jardins-rail',
    rect: rectXY(0, 4042, 225, 4800),
    streets: [V('Rue du Ballast', 170, 4010, 4800)],
    depth: [150, 260],
    width: [999, 999],
    impasse: 0,
  },
  {
    id: 'jardins-ouest',
    rect: rectXY(295, 4042, 2164, 4800),
    streets: [
      V('Chemin des Potagers', 350, 4010, 4800, LANE_W),
      H('Chemin des Serres', 4740, 350, 2200, LANE_W),
      V('Chemin des Arrosoirs', 1955, 4010, 4740, LANE_W),
    ],
    depth: [150, 260],
    width: [200, 600],
    impasse: 0,
  },
  {
    id: 'jardins-est',
    rect: rectXY(2236, 4042, 4214, 4800),
    streets: [H('Rue des Cerisiers', 4400, 2200, 4250), V('Rue des Tilleuls', 3200, 4010, 4800)],
    depth: [150, 260],
    width: [220, 600],
    impasse: 0.3,
  },
  // --- Le Port ----------------------------------------------------------------------
  {
    id: 'port',
    rect: rectXY(4286, 4180, 6400, 4800),
    streets: [
      { ...H('Route du Port', 4206, 4250, 6400, 44), kind: 'port' },
      { ...H('Rue des Docks', 4660, 4250, 6400, 44), kind: 'port' },
      { ...V('Rue de la Marine', 4760, 4206, 4660, 40), kind: 'port' },
    ],
    depth: [0, 0],
    width: [0, 0],
    impasse: 0,
  },
];

/** Rues en biais (extrémités sur des rues est-ouest). */
const DIAGONALS: { name: string; a: Vec2; b: Vec2 }[] = [
  { name: 'Rue Biaise', a: { x: 3000, y: 2548 }, b: { x: 3290, y: 2900 } },
  { name: 'Rue de Traverse', a: { x: 2470, y: 2900 }, b: { x: 2760, y: 3460 } },
  { name: 'Chemin Creux', a: { x: 2640, y: 4400 }, b: { x: 2920, y: 4800 } },
  { name: 'Rue de Biais', a: { x: 1200, y: 620 }, b: { x: 1020, y: 1300 } },
];

/** Emplacements dessinés (sol spécial, pas de bâtiment). */
export const SPOTS: Spot[] = [
  { id: 'quais-gare', name: 'Quais de la gare', rect: rectXY(297, 1336, 444, 1818), ground: 'plaza' },
  { id: 'parking-gare', name: 'Parking de la gare', rect: rectXY(1150, 1586, 1408, 1818), ground: 'parking' },
  { id: 'cour-gare', name: 'Cour de service de la gare', rect: rectXY(444, 1336, 1150, 1420), ground: 'plaza' },
  { id: 'pietonnier', name: 'Abords de la Grand-Place', rect: rectXY(2500, 1772, 3236, 2416), ground: 'plaza' },
  { id: 'parvis-eglise', name: 'Parvis de l\'église', rect: rectXY(3236, 2060, 3500, 2140), ground: 'plaza' },
  { id: 'jardin-hdv', name: 'Jardin de l\'Hôtel de Ville', rect: rectXY(2560, 1336, 3076, 1456), ground: 'park' },
  { id: 'cour-commissariat', name: 'Cour du commissariat', rect: rectXY(1650, 2582, 1910, 2610), ground: 'parking' },
  { id: 'atelier-garage', name: 'Devant du garage', rect: rectXY(880, 3242, 1180, 3300), ground: 'parking' },
  { id: 'urgences', name: 'Entrée des urgences', rect: rectXY(5550, 3172, 6000, 3240), ground: 'parking' },
  { id: 'parvis-musee', name: 'Parvis du musée', rect: rectXY(4440, 2470, 5010, 2558), ground: 'plaza' },
  { id: 'jardin-sculptures', name: 'Jardin des sculptures', rect: rectXY(4440, 2084, 5010, 2172), ground: 'park' },
  { id: 'parvis-theatre', name: 'Parvis du théâtre', rect: rectXY(5440, 2460, 5890, 2538), ground: 'plaza' },
  { id: 'terrasse-bar', name: 'Terrasse du Fer à Cheval', rect: rectXY(630, 2240, 840, 2260), ground: 'plaza' },
  { id: 'abords-parc', name: 'Abords du parc', rect: rectXY(4286, 0, 6400, 2018), ground: 'park' },
  { id: 'esplanade-port', name: 'Esplanade de la capitainerie', rect: rectXY(4286, 4228, 4500, 4330), ground: 'dock' },
];

/** Noms des rues générées (déterministes). */
const STREET_NAMES = [
  'Rue des Lilas',
  'Rue du Moulin',
  'Rue Pasteur',
  'Rue de la Paille',
  'Rue des Glaneurs',
  'Rue de la Fourche',
  'Rue du Râteau',
  'Rue des Épis',
  'Rue de l\'Avoine',
  'Rue du Seigle',
  'Rue de la Grange',
  'Rue du Fléau',
  'Rue des Botteleurs',
  'Rue de la Gerbe',
  'Rue du Silo',
  'Rue des Charrettes',
  'Rue des Faneurs',
  'Rue Haute',
  'Rue Basse',
  'Rue Neuve',
  'Rue des Orfèvres',
  'Rue des Remparts',
  'Rue du Puits',
  'Rue des Trois-Meules',
  'Rue Saint-Grain',
  'Rue du Chaume',
  'Rue des Tisserands',
  'Rue du Four',
  'Rue des Couteliers',
  'Rue de la Herse',
  'Rue du Sillon',
  'Rue des Vanneurs',
  'Rue de l\'Orge',
  'Rue du Fenil',
  'Rue des Meuniers',
  'Rue de la Charrue',
  'Rue des Granges',
  'Rue du Picotin',
  'Rue Victor-Hugo',
  'Rue Jean-Jaurès',
  'Rue Voltaire',
  'Rue des Marronniers',
  'Rue des Acacias',
  'Rue du Pressoir',
  'Rue de la Chouette',
  'Rue des Hirondelles',
  'Rue du Coq',
  'Rue des Fagots',
  'Rue de la Brouette',
  'Rue du Grenier-à-Sel',
  'Rue des Sabots',
  'Rue du Lavoir',
  'Rue des Cordiers',
  'Rue des Chandelles',
  'Rue de la Lanterne',
  'Rue des Écuyers',
  'Rue du Sac',
  'Rue des Boulistes',
  'Rue de l\'Abreuvoir',
  'Rue des Bluets',
];
const IMPASSE_NAMES = [
  'Impasse du Foin',
  'Impasse des Chats',
  'Impasse du Sureau',
  'Impasse de la Meule',
  'Impasse des Rêveurs',
  'Impasse du Hérisson',
  'Impasse Sans-Nom',
  'Impasse des Merles',
  'Impasse du Puits',
  'Impasse de la Taupe',
];

/* ----------------------------------------------------------------------------
 * Subdivision
 * ------------------------------------------------------------------------- */

export interface CityPlan {
  streets: Street[];
  blocks: Block[];
  spots: Spot[];
  /** Rectangles où aucune rue aléatoire ne doit passer (lieux remarquables + marges). */
  protectedRects: Rect[];
}

/** Bande visible d'un bâtiment remarquable (toit + façade). */
function landmarkBand(r: Rect, height: number): Rect {
  return { x: r.x, y: r.y - height - 16, w: r.w, h: r.h + height + 16 };
}

/**
 * Décompose la partie libre d'une zone (hors obstacles) en rectangles, par fusion gloutonne de
 * cellules : on étend d'abord vers l'est (îlots larges, façades sud), puis vers le sud.
 */
export function freeRects(zone: Rect, obstacles: Rect[]): Rect[] {
  const clip = obstacles
    .map((o) => rectXY(Math.max(o.x, zone.x), Math.max(o.y, zone.y), Math.min(o.x + o.w, zone.x + zone.w), Math.min(o.y + o.h, zone.y + zone.h)))
    .filter((o) => o.w > 0 && o.h > 0 && o.x < zone.x + zone.w && o.y < zone.y + zone.h);
  const xs = [...new Set([zone.x, zone.x + zone.w, ...clip.flatMap((o) => [o.x, o.x + o.w])])].sort((a, b) => a - b);
  const ys = [...new Set([zone.y, zone.y + zone.h, ...clip.flatMap((o) => [o.y, o.y + o.h])])].sort((a, b) => a - b);
  const nx = xs.length - 1;
  const ny = ys.length - 1;
  const free: boolean[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      const cy = (ys[j] + ys[j + 1]) / 2;
      free.push(!clip.some((o) => containsPoint(o, cx, cy)));
    }
  }
  const used = new Array<boolean>(nx * ny).fill(false);
  const ok = (i: number, j: number): boolean => free[j * nx + i] && !used[j * nx + i];
  const out: Rect[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      if (!ok(i, j)) continue;
      let i1 = i;
      while (i1 + 1 < nx && ok(i1 + 1, j)) i1++;
      let j1 = j;
      outer: while (j1 + 1 < ny) {
        for (let k = i; k <= i1; k++) if (!ok(k, j1 + 1)) break outer;
        j1++;
      }
      for (let jj = j; jj <= j1; jj++) for (let ii = i; ii <= i1; ii++) used[jj * nx + ii] = true;
      out.push(rectXY(xs[i], ys[j], xs[i1 + 1], ys[j1 + 1]));
    }
  }
  return out;
}

export function planCity(seed: number): CityPlan {
  const rng = new Rng(seed ^ 0x51ee7);
  const streets: Street[] = [];
  const blocks: Block[] = [];
  let nameIdx = rng.int(0, STREET_NAMES.length - 1);
  let impasseIdx = 0;
  const usedNames = new Set<string>();

  // 1) Avenues du plan directeur
  for (const av of AVENUES) {
    streets.push(straightStreet(av.id, av.name, 'avenue', av.a, av.b, av.width, 10));
    usedNames.add(av.name);
  }

  // Obstacles à éviter par les rues aléatoires : lieux (emprise + bande visible), emplacements.
  const protectedRects: Rect[] = [];
  const areaRects: Rect[] = [];
  for (const lm of LANDMARKS) {
    if (lm.kind === 'building') protectedRects.push(inflate(landmarkBand(lm.rect, lm.height ?? 60), 6));
    else if (lm.kind === 'area' && !lm.id.startsWith('pont')) {
      protectedRects.push(inflate(lm.rect, 4));
      areaRects.push(lm.rect);
    } else if (lm.kind === 'point') protectedRects.push(inflate(lm.rect, 30));
  }
  for (const sp of SPOTS) {
    if (sp.id === 'abords-parc') continue;
    protectedRects.push(inflate(sp.rect, 2));
    areaRects.push(sp.rect);
  }

  const handKeys = new Set<string>();
  const addSpec = (spec: StreetSpec): Street | null => {
    const key = `${spec.axis}:${spec.at}:${spec.from}:${spec.to}`;
    if (handKeys.has(key)) return null;
    handKeys.add(key);
    const w = spec.width ?? STREET_W;
    const sw = spec.kind === 'port' ? 0 : w <= LANE_W ? LANE_SIDEWALK : STREET_SIDEWALK;
    const a = spec.axis === 'h' ? { x: spec.from, y: spec.at } : { x: spec.at, y: spec.from };
    const b = spec.axis === 'h' ? { x: spec.to, y: spec.at } : { x: spec.at, y: spec.to };
    const kind: StreetKind = spec.kind ?? (w <= LANE_W ? 'lane' : 'street');
    const s = straightStreet(`r.${streets.length}`, spec.name, kind, a, b, w, sw);
    streets.push(s);
    usedNames.add(spec.name);
    return s;
  };

  const nextName = (): string => {
    for (let i = 0; i < STREET_NAMES.length; i++) {
      const n = STREET_NAMES[nameIdx % STREET_NAMES.length];
      nameIdx += 7;
      if (!usedNames.has(n)) {
        usedNames.add(n);
        return n;
      }
    }
    return `Rue n°${streets.length}`;
  };

  // 2) Rues saisies à la main
  for (const zone of ZONES) for (const spec of zone.streets) addSpec(spec);

  /** Le point est-il sur une rue droite (ou hors du monde) ? */
  const onStreet = (x: number, y: number): boolean => {
    if (x <= 0 || y <= 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) return true;
    return streets.some((s) => s.axis !== 'd' && containsPoint(s.rect, x, y));
  };
  const cutIsFree = (r: Rect): boolean => !protectedRects.some((p) => intersects(p, r));

  // 3) Découpe aléatoire des îlots trop grands. Une rue aléatoire doit aboutir à une rue à ses deux bouts.
  const subdivide = (zone: ZoneSpec, r: Rect, depth: number): void => {
    if (r.w < 24 || r.h < 24) return;
    const [dMin, dMax] = zone.depth;
    const [wMin, wMax] = zone.width;
    if (dMax > 0 && depth < 14) {
      const tooDeep = r.h > dMax;
      const tooWide = r.w > wMax;
      const order: ('h' | 'v')[] = [];
      if (tooDeep) order.push('h');
      if (tooWide) order.push('v');
      if (tooDeep && tooWide && r.w > r.h * 1.6) order.reverse();
      for (const axis of order) {
        const w = STREET_W;
        const span = axis === 'h' ? r.h : r.w;
        const min = axis === 'h' ? dMin : wMin;
        if (span < 2 * min + w) continue;
        for (let attempt = 0; attempt < 16; attempt++) {
          const pos = (axis === 'h' ? r.y : r.x) + min + w / 2 + rng.float() * (span - 2 * min - w);
          const at = Math.round(pos / 4) * 4;
          let from: number;
          let to: number;
          if (axis === 'h') {
            if (!onStreet(r.x - 3, at) || !onStreet(r.x + r.w + 3, at)) continue;
            if (!onStreet(r.x - 3, at - w / 2) || !onStreet(r.x + r.w + 3, at + w / 2)) continue;
            from = r.x <= 1 ? 0 : r.x - 26;
            to = r.x + r.w >= WORLD_WIDTH - 1 ? WORLD_WIDTH : r.x + r.w + 26;
          } else {
            if (!onStreet(at, r.y - 3) || !onStreet(at, r.y + r.h + 3)) continue;
            if (!onStreet(at - w / 2, r.y - 3) || !onStreet(at + w / 2, r.y + r.h + 3)) continue;
            from = r.y <= 1 ? 0 : r.y - 26;
            to = r.y + r.h >= WORLD_HEIGHT - 1 ? WORLD_HEIGHT : r.y + r.h + 26;
          }
          const cut = axis === 'h' ? rectXY(r.x, at - w / 2, r.x + r.w, at + w / 2) : rectXY(at - w / 2, r.y, at + w / 2, r.y + r.h);
          if (!cutIsFree(cut)) continue;
          addSpec({ name: nextName(), axis, at, from, to });
          if (axis === 'h') {
            subdivide(zone, rectXY(r.x, r.y, r.x + r.w, at - w / 2), depth + 1);
            subdivide(zone, rectXY(r.x, at + w / 2, r.x + r.w, r.y + r.h), depth + 1);
          } else {
            subdivide(zone, rectXY(r.x, r.y, at - w / 2, r.y + r.h), depth + 1);
            subdivide(zone, rectXY(at + w / 2, r.y, r.x + r.w, r.y + r.h), depth + 1);
          }
          return;
        }
      }
    }
    blocks.push({ id: blocks.length, rect: r, district: districtAt(r.x + r.w / 2, r.y + r.h / 2), zone: zone.id, kind: 'urban' });
  };

  const handStreetRects = streets.map((s) => s.rect);
  for (const zone of ZONES) {
    const obstacles = [...handStreetRects, ...areaRects].filter((o) => intersects(o, zone.rect));
    for (const r of freeRects(zone.rect, obstacles)) subdivide(zone, r, 0);
  }

  // 4) Rues en biais
  for (const d of DIAGONALS) {
    streets.push(diagonalStreet(`r.${streets.length}`, d.name, d.a, d.b, STREET_W, STREET_SIDEWALK));
    usedNames.add(d.name);
  }

  // 5) Impasses : une ruelle qui part de la rue au sud d'un grand îlot et s'arrête au milieu.
  for (const zone of ZONES) {
    if (zone.impasse <= 0) continue;
    for (const b of blocks) {
      if (b.zone !== zone.id) continue;
      const r = b.rect;
      if (r.h < 230 || r.w < 300 || !rng.chance(zone.impasse)) continue;
      const x = Math.round((r.x + r.w * (0.3 + rng.float() * 0.4)) / 4) * 4;
      if (!onStreet(x, r.y + r.h + 3)) continue;
      const y1 = r.y + r.h + 8;
      const y0 = Math.round((r.y + r.h * (0.3 + rng.float() * 0.2)) / 4) * 4;
      if (!cutIsFree(rectXY(x - 40, y0 - 40, x + 40, r.y + r.h))) continue;
      const s = straightStreet(
        `r.${streets.length}`,
        IMPASSE_NAMES[impasseIdx++ % IMPASSE_NAMES.length],
        'lane',
        { x, y: y0 },
        { x, y: y1 },
        40,
        6,
      );
      s.deadEnd = true;
      const turn = rectXY(x - 30, y0 - 30, x + 30, y0 + 22);
      const turnWalk = rectXY(x - 38, y0 - 38, x + 38, y0 + 30);
      s.extra = { sidewalk: rectPoints(turnWalk), road: rectPoints(turn) };
      s.rect = rectXY(turnWalk.x, turnWalk.y, turnWalk.x + turnWalk.w, y1);
      streets.push(s);
    }
  }

  // 6) Types d'îlots (variété) — décidés ici pour que le sol soit connu avant les bâtiments.
  assignBlockKinds(blocks, rng);

  return { streets, blocks, spots: SPOTS, protectedRects };
}

function assignBlockKinds(blocks: Block[], rng: Rng): void {
  // Îlots qui contiennent (ou touchent) un lieu remarquable bâti : toujours construits autour.
  const lmRects = LANDMARKS.filter((l) => l.kind === 'building').map((l) => l.rect);
  const hasLandmark = (b: Block): boolean => lmRects.some((r) => intersects(r, b.rect));
  const count = new Map<string, number>();
  const bump = (k: string): number => {
    const n = (count.get(k) ?? 0) + 1;
    count.set(k, n);
    return n;
  };
  const usable = (b: Block): boolean => b.rect.w >= 110 && b.rect.h >= 110 && !hasLandmark(b);
  for (const b of blocks) {
    const r = b.rect;
    const area = r.w * r.h;
    const d = b.district;
    if (r.w < 40 || r.h < 40) {
      b.kind = 'empty';
      continue;
    }
    if (b.zone === 'port') {
      b.kind = 'industrial';
      continue;
    }
    if (d === 'faubourg' || d === 'jardins') {
      b.kind = 'houses';
      if (!usable(b)) continue;
      if (area > 30000 && area < 110000 && rng.chance(0.1) && (count.get(`sand:${d}`) ?? 0) < 1) {
        b.kind = 'sand';
        bump(`sand:${d}`);
      } else if (area < 90000 && rng.chance(0.06) && (count.get(`square:${d}`) ?? 0) < 1) {
        b.kind = 'square';
        bump(`square:${d}`);
      }
      continue;
    }
    if (b.zone.startsWith('gare-ouest') || b.zone === 'jardins-rail') {
      b.kind = rng.chance(0.6) ? 'industrial' : 'houses';
      continue;
    }
    b.kind = 'urban';
    if (!usable(b)) continue;
    if (area < 75000 && area > 20000 && rng.chance(0.08) && (count.get(`square:${d}`) ?? 0) < (d === 'centre' ? 2 : 1)) {
      b.kind = 'square';
      bump(`square:${d}`);
    } else if (area < 70000 && area > 20000 && rng.chance(0.05) && (count.get(`parking:${d}`) ?? 0) < 1) {
      b.kind = 'parking';
      bump(`parking:${d}`);
    }
  }
  // Au moins un square par quartier urbain et un boulodrome au Faubourg : variété garantie.
  const ensure = (kind: BlockKind, districts: DistrictId[], base: BlockKind): void => {
    for (const dist of districts) {
      if (blocks.some((b) => b.district === dist && b.kind === kind)) continue;
      const cands = blocks.filter((b) => b.district === dist && b.kind === base && usable(b) && b.rect.w * b.rect.h > 20000 && b.rect.w * b.rect.h < 90000);
      if (cands.length) rng.pick(cands).kind = kind;
    }
  };
  ensure('square', ['halles', 'centre', 'gare', 'arts'], 'urban');
  ensure('parking', ['halles', 'centre'], 'urban');
  ensure('sand', ['faubourg', 'jardins'], 'houses');
}

/** Rectangle de la rivière (eau). */
export const RIVER_RECT: Rect = rect(0, RIVER.y0, WORLD_WIDTH, RIVER.y1 - RIVER.y0);
/** Ballast de la voie ferrée. */
export const RAIL_RECT: Rect = rect(RAIL.x - RAIL.width / 2, 0, RAIL.width, WORLD_HEIGHT);
