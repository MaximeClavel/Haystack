// Galerie graphique de développement : dev/gallery.html
//
// Paramètres d'URL :
//   ?zoom=4        zoom des planches (défaut 4 ; vérifier aussi 1.5, 1, 0.5, 0.2)
//   ?bzoom=…       zoom des planches de bâtiments (défaut : zoom / 2, au plus 2)
//   ?bounds=1      contour rouge de getEntityBounds (bleu : getHitRect)
//   ?section=id    n'affiche qu'une planche (ids dans le menu)
//   ?lod=0|1|2     force un niveau de détail (sinon lodForZoom(zoom))
//
// Planches spéciales : section=check (débordements d'emprise, automatique),
// section=perf (mesure de performance → window.__artPerf), section=scene (rendu par tuiles).

import {
  COLOR_HEX,
  COLOR_NAME_FR,
  PAPER,
  compareDrawOrder,
  drawEntity,
  drawGround,
  drawPortrait,
  getEntityBounds,
  getHitRect,
  lodForZoom,
  type Lod,
} from '../art';
import { Rng } from '../lib/rng';
import type {
  Accessory,
  BottomKind,
  BuildingEntity,
  BuildingFeature,
  BuildingStyle,
  Build,
  Color,
  Emote,
  Entity,
  FaceDetail,
  Facing,
  GroundKind,
  GroundLayer,
  GroundLineKind,
  HairColor,
  HairStyle,
  Hat,
  HeldItem,
  Pattern,
  PersonAppearance,
  PersonEntity,
  Pose,
  PropEntity,
  PropKind,
  Rect,
  SkinTone,
  TopKind,
  TreeEntity,
  TreeKind,
  VehicleEntity,
  VehicleKind,
} from '../types';

declare global {
  interface Window {
    __haystackReady?: boolean;
    __artPerf?: unknown;
    __artBoundsReport?: unknown;
  }
}

/* ----------------------------------------------------------------------------
 * Paramètres
 * ------------------------------------------------------------------------- */

const params = new URLSearchParams(location.search);
const ZOOM = Number(params.get('zoom') ?? 4) || 4;
const BZOOM = Number(params.get('bzoom') ?? Math.min(2, ZOOM / 2)) || 1;
const SHOW_BOUNDS = params.get('bounds') === '1';
const ONLY = params.get('section');
const LOD_PARAM = params.get('lod');
const DPR = window.devicePixelRatio || 1;

function lodFor(z: number): Lod {
  if (LOD_PARAM === '0' || LOD_PARAM === '1' || LOD_PARAM === '2') return Number(LOD_PARAM) as Lod;
  return lodForZoom(z);
}

/* ----------------------------------------------------------------------------
 * Vocabulaire
 * ------------------------------------------------------------------------- */

const COLORS: Color[] = ['red', 'orange', 'yellow', 'pink', 'purple', 'blue', 'navy', 'green', 'olive', 'brown', 'beige', 'black', 'white', 'grey'];
const SKINS: SkinTone[] = ['pale', 'light', 'tan', 'brown', 'dark'];
const HAIRS: HairStyle[] = ['bald', 'short', 'long', 'bun', 'ponytail', 'curly', 'spiky'];
const HAIR_COLORS: HairColor[] = ['black', 'brown', 'blond', 'red', 'grey', 'white'];
const HATS: Hat[] = ['none', 'cap', 'beret', 'bowler', 'tophat', 'beanie', 'fedora', 'helmet', 'chef', 'police', 'straw'];
const TOPS: TopKind[] = ['tshirt', 'shirt', 'sweater', 'coat', 'suit', 'dress', 'apron', 'hoodie', 'uniform', 'overalls'];
const BOTTOMS: BottomKind[] = ['trousers', 'shorts', 'skirt'];
const PATTERNS: Pattern[] = ['plain', 'stripes', 'dots', 'checks'];
const FACES: FaceDetail[] = ['none', 'glasses', 'sunglasses', 'mustache', 'beard', 'mask'];
const ACCESSORIES: Accessory[] = ['none', 'handbag', 'briefcase', 'backpack', 'umbrella', 'cane', 'camera', 'newspaper', 'flowers', 'balloon', 'suitcase', 'scarf'];
const BUILDS: Build[] = ['slim', 'regular', 'large', 'child'];
const POSES: Pose[] = ['stand', 'walk', 'run', 'sit', 'lie', 'crouch', 'climb', 'point', 'wave', 'carry', 'phone', 'fight', 'handsup', 'sneak', 'read', 'window'];
const EMOTES: Emote[] = ['none', 'exclaim', 'question', 'heart', 'angry', 'sleep', 'music', 'sweat', 'ko', 'idea', 'talk'];
const HELD: HeldItem[] = ['none', 'knife', 'moneybag', 'painting', 'key', 'phone', 'crowbar', 'letter', 'bottle', 'cake', 'leash', 'flashlight', 'jewel', 'map', 'icecream', 'baguette', 'box', 'rope', 'needle'];
const VEHICLES: VehicleKind[] = ['car', 'van', 'taxi', 'police', 'bus', 'truck', 'ambulance', 'bicycle', 'scooter', 'boat'];
const TREES: TreeKind[] = ['round', 'pine', 'poplar', 'bare'];
const PROPS: PropKind[] = [
  'bench', 'lamp', 'bin', 'mailbox', 'hydrant', 'phonebooth', 'kiosk', 'busstop', 'sign', 'cone', 'barrier', 'manhole',
  'fountain', 'statue', 'bandstand', 'stall', 'parasol', 'table', 'chair', 'cart', 'crate', 'barrel', 'pallet', 'crane',
  'scaffold', 'tent', 'playground', 'bush', 'flowerbed', 'rock', 'puddle', 'dog', 'cat', 'pigeons', 'duck', 'moneybag',
  'suitcase', 'briefcase', 'knife', 'painting', 'safe', 'ladder', 'rope', 'footprints', 'trashbag', 'letter', 'key',
  'jewel', 'cake', 'needle',
];
const STYLES: BuildingStyle[] = [
  'house', 'townhouse', 'apartment', 'shop', 'cafe', 'bakery', 'jeweler', 'bank', 'police', 'townhall', 'church', 'school',
  'museum', 'station', 'hotel', 'bar', 'cinema', 'theatre', 'hospital', 'warehouse', 'factory', 'garage', 'shed',
  'greenhouse', 'postoffice', 'pharmacy',
];
const GROUNDS: GroundKind[] = ['grass', 'park', 'water', 'sand', 'plaza', 'sidewalk', 'road', 'parking', 'dock', 'garden', 'courtyard', 'bridge', 'railbed'];

const BASE: PersonAppearance = {
  skin: 'light',
  hair: 'short',
  hairColor: 'brown',
  hat: 'none',
  top: 'tshirt',
  topColor: 'blue',
  topPattern: 'plain',
  bottom: 'trousers',
  bottomColor: 'navy',
  face: 'none',
  accessory: 'none',
  build: 'regular',
};

let uid = 0;
function person(over: Partial<PersonAppearance> = {}, p: Partial<PersonEntity> = {}): PersonEntity {
  return {
    id: `g.p.${uid++}`,
    kind: 'person',
    x: 0,
    y: 0,
    pose: 'stand',
    facing: 'right',
    appearance: { ...BASE, ...over },
    ...p,
  };
}

function randomAppearance(r: Rng): PersonAppearance {
  return {
    skin: r.pick(SKINS),
    hair: r.pick(HAIRS),
    hairColor: r.pick(HAIR_COLORS),
    hat: r.chance(0.35) ? r.pick(HATS) : 'none',
    top: r.pick(TOPS),
    topColor: r.pick(COLORS),
    topPattern: r.chance(0.3) ? r.pick(PATTERNS) : 'plain',
    bottom: r.pick(BOTTOMS),
    bottomColor: r.pick(COLORS),
    face: r.chance(0.3) ? r.pick(FACES) : 'none',
    accessory: r.chance(0.35) ? r.pick(ACCESSORIES) : 'none',
    build: r.weighted([
      ['regular', 5],
      ['slim', 3],
      ['large', 2],
      ['child', 2],
    ] as const),
  };
}

const SIGNS: Partial<Record<BuildingStyle, string>> = {
  shop: 'ÉPICERIE',
  cafe: 'CAFÉ DU CENTRE',
  bakery: 'BOULANGERIE',
  jeweler: 'BIJOUTERIE CARAT',
  bank: 'BANQUE DUFRIC',
  police: 'POLICE',
  townhall: 'HÔTEL DE VILLE',
  school: 'ÉCOLE',
  museum: 'MUSÉE',
  station: 'GARE',
  hotel: 'GRAND HÔTEL',
  bar: 'LE FER À CHEVAL',
  cinema: 'LE REX',
  theatre: 'THÉÂTRE',
  hospital: 'HÔPITAL',
  warehouse: 'ENTREPÔT 7',
  factory: 'FILATURE',
  garage: 'GARAGE PISTONS',
  postoffice: 'LA POSTE',
  pharmacy: 'PHARMACIE',
};

const STYLE_DEFAULTS: Record<BuildingStyle, { w: number; h: number; height: number; wall: Color; roof: Color }> = {
  house: { w: 100, h: 70, height: 50, wall: 'beige', roof: 'red' },
  townhouse: { w: 70, h: 60, height: 76, wall: 'pink', roof: 'grey' },
  apartment: { w: 140, h: 80, height: 124, wall: 'yellow', roof: 'grey' },
  shop: { w: 90, h: 60, height: 56, wall: 'green', roof: 'brown' },
  cafe: { w: 110, h: 70, height: 60, wall: 'orange', roof: 'brown' },
  bakery: { w: 100, h: 70, height: 56, wall: 'yellow', roof: 'brown' },
  jeweler: { w: 100, h: 70, height: 60, wall: 'navy', roof: 'grey' },
  bank: { w: 170, h: 100, height: 100, wall: 'grey', roof: 'black' },
  police: { w: 180, h: 100, height: 90, wall: 'blue', roof: 'grey' },
  townhall: { w: 240, h: 110, height: 130, wall: 'beige', roof: 'navy' },
  church: { w: 170, h: 130, height: 110, wall: 'beige', roof: 'grey' },
  school: { w: 220, h: 100, height: 80, wall: 'orange', roof: 'red' },
  museum: { w: 260, h: 110, height: 110, wall: 'white', roof: 'grey' },
  station: { w: 320, h: 120, height: 120, wall: 'beige', roof: 'grey' },
  hotel: { w: 160, h: 100, height: 140, wall: 'pink', roof: 'navy' },
  bar: { w: 120, h: 80, height: 56, wall: 'green', roof: 'brown' },
  cinema: { w: 170, h: 100, height: 90, wall: 'purple', roof: 'black' },
  theatre: { w: 200, h: 110, height: 110, wall: 'red', roof: 'navy' },
  hospital: { w: 240, h: 120, height: 120, wall: 'white', roof: 'blue' },
  warehouse: { w: 180, h: 110, height: 60, wall: 'brown', roof: 'grey' },
  factory: { w: 200, h: 120, height: 70, wall: 'red', roof: 'grey' },
  garage: { w: 150, h: 90, height: 60, wall: 'white', roof: 'red' },
  shed: { w: 40, h: 30, height: 28, wall: 'brown', roof: 'brown' },
  greenhouse: { w: 80, h: 50, height: 34, wall: 'white', roof: 'white' },
  postoffice: { w: 160, h: 90, height: 80, wall: 'yellow', roof: 'navy' },
  pharmacy: { w: 100, h: 70, height: 70, wall: 'white', roof: 'green' },
};

function building(style: BuildingStyle, over: Partial<BuildingEntity> = {}, w?: number, h?: number): BuildingEntity {
  const d = STYLE_DEFAULTS[style];
  const fw = w ?? d.w;
  const fh = h ?? d.h;
  return {
    id: `g.b.${uid++}`,
    kind: 'building',
    style,
    x: 0,
    y: 0,
    footprint: { x: -fw / 2, y: -fh, w: fw, h: fh },
    height: d.height,
    wall: d.wall,
    roof: d.roof,
    sign: SIGNS[style],
    seed: 7 + uid * 13,
    ...over,
  };
}

/* ----------------------------------------------------------------------------
 * Planches
 * ------------------------------------------------------------------------- */

interface Item {
  label: string;
  entity?: Entity;
  /** Dessin libre dans la cellule (repère : ancre de la cellule). */
  draw?: (ctx: CanvasRenderingContext2D, lod: Lod) => void;
}

interface Plate {
  id: string;
  title: string;
  /** Taille de cellule (unités monde) et ancre dans la cellule. */
  cw: number;
  ch: number;
  ax: number;
  ay: number;
  zoom?: number;
  cols?: number;
  items: Item[];
  /** Sol sous chaque cellule. */
  floor?: string;
}

const plates: Plate[] = [];
const PERSON_CELL = { cw: 34, ch: 38, ax: 17, ay: 33 };

function personPlate(id: string, title: string, items: Item[], extra: Partial<Plate> = {}): void {
  plates.push({ id, title, ...PERSON_CELL, items, ...extra });
}

// Palette
plates.push({
  id: 'palette',
  title: 'Palette — 14 couleurs (aplat, puis personne en haut de cette couleur)',
  cw: 34,
  ch: 40,
  ax: 17,
  ay: 36,
  items: COLORS.map((c) => ({
    label: `${c} · ${COLOR_NAME_FR[c]}`,
    draw: (ctx, lod) => {
      ctx.fillStyle = COLOR_HEX[c];
      ctx.strokeStyle = '#2f2622';
      ctx.lineWidth = 0.6;
      ctx.fillRect(-15, -34, 30, 8);
      ctx.strokeRect(-15, -34, 30, 8);
      drawEntity(ctx, person({ topColor: c, bottomColor: c === 'navy' ? 'beige' : 'navy', top: 'sweater' }, { x: 0, y: 0 }), lod);
    },
  })),
});

personPlate('hats', 'Chapeaux (11)', HATS.map((h) => ({ label: h, entity: person({ hat: h }) })));
personPlate(
  'hair',
  'Coiffures (7) × couleurs',
  HAIRS.flatMap((h, i) => [
    { label: `${h}`, entity: person({ hair: h, hairColor: HAIR_COLORS[i % HAIR_COLORS.length] }) },
    { label: `${h} (dos)`, entity: person({ hair: h, hairColor: HAIR_COLORS[(i + 3) % HAIR_COLORS.length], skin: SKINS[i % 5] }, { facing: 'left' }) },
  ]),
);
personPlate('tops', 'Hauts (10)', TOPS.map((t, i) => ({ label: t, entity: person({ top: t, topColor: COLORS[(i * 5) % 14] }) })));
personPlate(
  'patterns',
  'Motifs (4) sur plusieurs hauts',
  PATTERNS.flatMap((p) =>
    (['tshirt', 'shirt', 'dress', 'coat'] as TopKind[]).map((t, i) => ({
      label: `${p} · ${t}`,
      entity: person({ topPattern: p, top: t, topColor: (['red', 'navy', 'yellow', 'green'] as Color[])[i] }),
    })),
  ),
);
personPlate(
  'bottoms',
  'Bas (3) × hauts',
  BOTTOMS.flatMap((b) =>
    (['tshirt', 'suit', 'dress', 'overalls'] as TopKind[]).map((t) => ({
      label: `${b} · ${t}`,
      entity: person({ bottom: b, top: t, bottomColor: 'orange', topColor: 'green' }),
    })),
  ),
);
personPlate(
  'faces',
  'Détails du visage (6)',
  FACES.flatMap((f) => [
    { label: f, entity: person({ face: f, hairColor: 'black' }) },
    { label: `${f} (gauche)`, entity: person({ face: f, hairColor: 'red', skin: 'dark' }, { facing: 'left' }) },
  ]),
);
personPlate('accessories', 'Accessoires (12)', ACCESSORIES.map((a) => ({ label: a, entity: person({ accessory: a }) })));
personPlate(
  'builds',
  'Corpulences (4) × hauts',
  BUILDS.flatMap((b) =>
    (['tshirt', 'coat', 'suit', 'dress'] as TopKind[]).map((t) => ({ label: `${b} · ${t}`, entity: person({ build: b, top: t, topColor: 'red' }) })),
  ),
);
personPlate(
  'poses',
  'Poses (16) × orientation',
  POSES.flatMap((p) =>
    (['right', 'left'] as Facing[]).map((f) => ({
      label: `${p} ${f === 'right' ? '→' : '←'}`,
      entity: person({ topColor: 'red', hat: p === 'window' ? 'none' : 'none' }, { pose: p, facing: f }),
    })),
  ),
);
personPlate(
  'emotes',
  'Émotions (11)',
  EMOTES.map((e) => ({ label: e, entity: person({ hat: e === 'music' ? 'tophat' : 'none' }, { emote: e }) })),
);
personPlate(
  'held',
  'Objets tenus (19) — debout, puis pose « porter »/« lire » pour les grands',
  HELD.flatMap((h) => {
    const out: Item[] = [{ label: h, entity: person({ topColor: 'green' }, { holding: h }) }];
    if (['none', 'box', 'painting', 'moneybag', 'cake', 'map', 'baguette'].includes(h)) out.push({ label: `${h} · carry`, entity: person({ topColor: 'green' }, { holding: h, pose: 'carry' }) });
    if (['none', 'letter', 'map'].includes(h)) out.push({ label: `${h} · read`, entity: person({ topColor: 'green' }, { holding: h, pose: 'read' }) });
    return out;
  }),
);
{
  const r = new Rng(2026);
  personPlate(
    'crowd',
    'Foule aléatoire (apparences, poses, objets, émotions)',
    Array.from({ length: 48 }, (_, i) => {
      const pose = r.chance(0.6) ? (r.pick(['stand', 'walk'] as Pose[])) : r.pick(POSES);
      return {
        label: `#${i} ${pose}`,
        entity: person(randomAppearance(r), {
          pose,
          facing: r.chance(0.5) ? 'left' : 'right',
          holding: r.chance(0.2) ? r.pick(HELD) : 'none',
          emote: r.chance(0.12) ? r.pick(EMOTES) : 'none',
        }),
      };
    }),
  );
}
{
  // Paires « presque sosies » : une seule différence (lisibilité au zoom de jeu)
  const pairs: [string, Partial<PersonAppearance>, Partial<PersonAppearance>][] = [
    ['navy/blue', { topColor: 'navy' }, { topColor: 'blue' }],
    ['navy/purple', { topColor: 'navy' }, { topColor: 'purple' }],
    ['olive/green', { topColor: 'olive' }, { topColor: 'green' }],
    ['olive/brown', { topColor: 'olive' }, { topColor: 'brown' }],
    ['beige/white', { topColor: 'beige' }, { topColor: 'white' }],
    ['beige/yellow', { topColor: 'beige' }, { topColor: 'yellow' }],
    ['red/orange', { topColor: 'red' }, { topColor: 'orange' }],
    ['red/pink', { topColor: 'red' }, { topColor: 'pink' }],
    ['black/navy', { topColor: 'black' }, { topColor: 'navy' }],
    ['grey/white', { topColor: 'grey' }, { topColor: 'white' }],
    ['bowler/fedora', { hat: 'bowler' }, { hat: 'fedora' }],
    ['cap/beanie', { hat: 'cap' }, { hat: 'beanie' }],
    ['short/spiky', { hair: 'short' }, { hair: 'spiky' }],
    ['bun/ponytail', { hair: 'bun' }, { hair: 'ponytail' }],
    ['glasses/sunglasses', { face: 'glasses' }, { face: 'sunglasses' }],
    ['mustache/beard', { face: 'mustache' }, { face: 'beard' }],
    ['shirt/tshirt', { top: 'shirt' }, { top: 'tshirt' }],
    ['sweater/hoodie', { top: 'sweater' }, { top: 'hoodie' }],
    ['suit/uniform', { top: 'suit' }, { top: 'uniform' }],
    ['coat/dress', { top: 'coat' }, { top: 'dress' }],
    ['slim/regular', { build: 'slim' }, { build: 'regular' }],
    ['handbag/briefcase', { accessory: 'handbag' }, { accessory: 'briefcase' }],
  ];
  personPlate(
    'pairs',
    'Paires à distinguer (une seule différence) — à vérifier au zoom 1,5',
    pairs.flatMap(([l, a, b]) => [
      { label: `${l} A`, entity: person({ ...a, topColor: a.topColor ?? 'orange' }) },
      { label: `${l} B`, entity: person({ ...b, topColor: b.topColor ?? 'orange' }) },
    ]),
  );
}
{
  // Portraits (carnet)
  const r = new Rng(77);
  plates.push({
    id: 'portraits',
    title: 'Portraits (drawPortrait, carnet)',
    cw: 34,
    ch: 34,
    ax: 17,
    ay: 17,
    items: Array.from({ length: 12 }, (_, i) => {
      const ap = randomAppearance(r);
      return {
        label: `${ap.hat}/${ap.top}`,
        draw: (ctx) => {
          ctx.fillStyle = '#efe4cb';
          ctx.fillRect(-15, -15, 30, 30);
          drawPortrait(ctx, i === 0 ? { ...BASE, hat: 'tophat', face: 'mustache' } : ap, 0, 0, 30);
          ctx.strokeStyle = '#2f2622';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(-15, -15, 30, 30);
        },
      };
    }),
  });
}

// Bâtiments
plates.push({
  id: 'buildings',
  title: 'Bâtiments — tous les styles',
  cw: 340,
  ch: 300,
  ax: 170,
  ay: 270,
  zoom: BZOOM,
  items: STYLES.map((s) => ({ label: s, entity: building(s) })),
});
{
  const feats = (at: number, list: Omit<BuildingFeature, 'at'>[]): BuildingFeature[] => list.map((f, i) => ({ ...f, at: at + i * 0.2 }));
  plates.push({
    id: 'features',
    title: 'Bâtiments — détails de façade (features) et variations par graine',
    cw: 340,
    ch: 240,
    ax: 170,
    ay: 220,
    zoom: BZOOM,
    items: [
      { label: 'openWindow / brokenWindow / litWindow', entity: building('apartment', { seed: 11, features: feats(0.15, [{ kind: 'openWindow', floor: 1 }, { kind: 'brokenWindow', floor: 1 }, { kind: 'litWindow', floor: 1 }, { kind: 'litWindow', floor: 2 }]) }) },
      { label: 'openDoor / balcony / poster / graffiti', entity: building('townhouse', { seed: 5, height: 100, features: [{ kind: 'openDoor', at: 0.5 }, { kind: 'balcony', at: 0.5, floor: 2 }, { kind: 'poster', at: 0.15, text: 'CIRQUE' }, { kind: 'graffiti', at: 0.85, color: 'purple', text: 'ZAP' }] }, 140) },
      { label: 'awning (store rayé) ×2 + vitrine brisée', entity: building('jeweler', { features: [{ kind: 'awning', at: 0.3, color: 'red' }, { kind: 'brokenWindow', at: 0.3, floor: 0 }] }, 160) },
      { label: 'maison : variantes de graine', entity: building('house', { seed: 1 }) },
      { label: 'maison graine 2', entity: building('house', { seed: 2, wall: 'white', roof: 'grey' }) },
      { label: 'maison graine 3', entity: building('house', { seed: 3, wall: 'pink', roof: 'brown' }) },
      { label: 'immeuble graine 4', entity: building('apartment', { seed: 4, wall: 'beige', roof: 'navy' }) },
      { label: 'immeuble graine 9', entity: building('apartment', { seed: 9, wall: 'grey', roof: 'black', height: 150 }) },
      { label: 'boutique : enseigne longue', entity: building('shop', { sign: 'QUINCAILLERIE DU PONT', wall: 'blue' }, 110) },
      { label: 'café : enseigne courte, terrasse', entity: building('cafe', { sign: 'BAR', wall: 'red', features: [{ kind: 'awning', at: 0.5, color: 'green' }] }) },
      { label: 'entrepôt numéro 12', entity: building('warehouse', { sign: '12' }) },
      { label: 'cabane + serre', entity: building('shed') },
    ],
  });
}

// Véhicules
{
  const r = new Rng(5);
  const items: Item[] = [];
  for (const v of VEHICLES) {
    for (const f of ['right', 'left'] as Facing[]) {
      const color: Color = v === 'taxi' ? 'yellow' : v === 'police' || v === 'ambulance' ? 'white' : r.pick(COLORS);
      const e: VehicleEntity = {
        id: `g.v.${uid++}`,
        kind: 'vehicle',
        vehicle: v,
        facing: f,
        x: 0,
        y: 0,
        color,
        driver: f === 'right' || v === 'bicycle' || v === 'scooter' ? randomAppearance(r) : undefined,
        label: v === 'boat' ? 'LA MOUETTE' : v === 'bus' ? '12 GARE' : v === 'truck' ? 'DÉMÉNAGEURS' : 'MB-1234',
        doorOpen: v === 'car' && f === 'left',
      };
      items.push({ label: `${v} ${f === 'right' ? '→' : '←'}${e.driver ? ' +conducteur' : ''}${e.doorOpen ? ' porte ouverte' : ''}`, entity: e });
    }
  }
  plates.push({ id: 'vehicles', title: 'Véhicules (10) × orientation', cw: 112, ch: 50, ax: 56, ay: 40, items });
}

// Arbres
plates.push({
  id: 'trees',
  title: 'Arbres (4 types × tailles)',
  cw: 54,
  ch: 80,
  ax: 27,
  ay: 74,
  items: TREES.flatMap((t) =>
    [34, 50, 68].map((size) => ({
      label: `${t} ${size}`,
      entity: { id: `g.t.${uid++}.${t}`, kind: 'tree', tree: t, size, x: 0, y: 0 } as TreeEntity,
    })),
  ),
});

// Objets
{
  const items: Item[] = [];
  const mk = (prop: PropKind, extra: Partial<PropEntity> = {}): PropEntity => ({ id: `g.o.${uid++}`, kind: 'prop', prop, x: 0, y: 0, ...extra });
  for (const p of PROPS) {
    if (['crane', 'scaffold', 'bandstand', 'fountain', 'playground'].includes(p)) continue;
    const extra: Partial<PropEntity> = {};
    if (p === 'sign') extra.label = 'RUE DES ARTS';
    if (p === 'stall' || p === 'parasol' || p === 'tent') extra.color = 'red';
    if (p === 'footprints') extra.facing = 'right';
    items.push({ label: p, entity: mk(p, extra) });
    if (p === 'manhole') items.push({ label: 'manhole open', entity: mk(p, { variant: 'open' }) });
    if (p === 'bench') items.push({ label: 'bench broken', entity: mk(p, { variant: 'broken' }) });
    if (p === 'dog') {
      items.push({ label: 'dog big ←', entity: mk(p, { variant: 'big', facing: 'left', color: 'black' }) });
      items.push({ label: 'dog small', entity: mk(p, { variant: 'small', color: 'white' }) });
    }
    if (p === 'safe') items.push({ label: 'safe open', entity: mk(p, { variant: 'open' }) });
    if (p === 'stall') items.push({ label: 'stall blue', entity: mk(p, { color: 'blue' }) });
    if (p === 'needle') items.push({ label: 'needle ×1 (zoom réel)', entity: mk(p) });
  }
  plates.push({ id: 'props', title: 'Objets', cw: 44, ch: 40, ax: 22, ay: 32, items });
  plates.push({
    id: 'bigprops',
    title: 'Grands objets',
    cw: 130,
    ch: 140,
    ax: 65,
    ay: 128,
    zoom: Math.min(ZOOM, 2),
    items: (['crane', 'scaffold', 'bandstand', 'fountain', 'playground'] as PropKind[]).map((p) => ({ label: p, entity: mk(p) })),
  });
}

/* ----------------------------------------------------------------------------
 * Rendu des planches
 * ------------------------------------------------------------------------- */

const LABEL_H = 16;

function renderPlate(p: Plate): HTMLElement {
  const z = p.zoom ?? ZOOM;
  const lod = lodFor(z);
  const maxW = Math.max(320, Math.min(window.innerWidth - 40, 1400));
  const cellW = p.cw * z;
  const cellH = p.ch * z + LABEL_H;
  const cols = Math.max(1, p.cols ?? Math.floor(maxW / cellW));
  const rows = Math.ceil(p.items.length / cols);
  const sec = document.createElement('section');
  sec.id = p.id;
  sec.innerHTML = `<h2>${p.title} <small>— zoom ${z}, niveau ${lod}${SHOW_BOUNDS ? ', emprises' : ''}</small></h2>`;
  const canvas = document.createElement('canvas');
  const W = Math.ceil(Math.min(cols, p.items.length) * cellW);
  const H = Math.ceil(rows * cellH);
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  sec.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  p.items.forEach((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ox = col * cellW;
    const oy = row * cellH;
    // cadre de cellule
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.strokeStyle = 'rgba(47,38,34,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, cellW - 1, cellH - 1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, cellW, cellH - LABEL_H);
    ctx.clip();
    ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (ox + p.ax * z), DPR * (oy + p.ay * z));
    if (it.draw) it.draw(ctx, lod);
    if (it.entity) {
      drawEntity(ctx, it.entity, lod);
      if (SHOW_BOUNDS) {
        const b = getEntityBounds(it.entity);
        const hr = getHitRect(it.entity);
        ctx.lineWidth = 1 / z;
        ctx.strokeStyle = 'rgba(220,30,30,0.9)';
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = 'rgba(30,90,220,0.6)';
        ctx.setLineDash([2 / z, 2 / z]);
        ctx.strokeRect(hr.x, hr.y, hr.w, hr.h);
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#3a302a';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(it.label, ox + cellW / 2, oy + cellH - LABEL_H / 2, cellW - 4);
  });
  return sec;
}

/* ----------------------------------------------------------------------------
 * Sols
 * ------------------------------------------------------------------------- */

function rectPts(x: number, y: number, w: number, h: number) {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
}

function renderGroundPlate(): HTMLElement {
  const z = ZOOM >= 2 ? 2 : ZOOM;
  const lod = lodFor(z);
  const cw = 110;
  const ch = 70;
  const cols = 5;
  const ground: GroundLayer = { base: 'grass', shapes: [], lines: [] };
  GROUNDS.forEach((g, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    ground.shapes.push({ kind: g, points: rectPts(col * cw + 6, row * ch + 6, cw - 12, ch - 22) });
  });
  const ly = Math.ceil(GROUNDS.length / cols) * ch;
  // échantillons de lignes
  ground.shapes.push({ kind: 'road', points: rectPts(0, ly + 6, cols * cw, 60) });
  ground.shapes.push({ kind: 'sidewalk', points: rectPts(0, ly - 10, cols * cw, 16) });
  ground.shapes.push({ kind: 'sidewalk', points: rectPts(0, ly + 66, cols * cw, 16) });
  ground.lines.push({ kind: 'curb', points: [{ x: 0, y: ly + 6 }, { x: cols * cw, y: ly + 6 }], width: 1 });
  ground.lines.push({ kind: 'curb', points: [{ x: 0, y: ly + 66 }, { x: cols * cw, y: ly + 66 }], width: 1 });
  ground.lines.push({ kind: 'laneline', points: [{ x: 0, y: ly + 36 }, { x: cols * cw, y: ly + 36 }], width: 1.2 });
  ground.lines.push({ kind: 'crosswalk', points: [{ x: 90, y: ly + 8 }, { x: 90, y: ly + 64 }], width: 14 });
  ground.shapes.push({ kind: 'railbed', points: rectPts(0, ly + 96, cols * cw, 30) });
  ground.lines.push({ kind: 'rail', points: [{ x: 0, y: ly + 111 }, { x: cols * cw * 0.6, y: ly + 111 }, { x: cols * cw, y: ly + 104 }], width: 14 });
  const lineSamples: GroundLineKind[] = ['path', 'fence', 'hedge', 'wall'];
  lineSamples.forEach((k, i) => {
    const y0 = ly + 140 + i * 22;
    ground.lines.push({ kind: k, points: [{ x: 20, y: y0 }, { x: 260, y: y0 }, { x: 330, y: y0 + 12 }, { x: 330, y: y0 + 18 }], width: k === 'path' ? 8 : k === 'hedge' ? 5 : k === 'wall' ? 3 : 1 });
  });
  const W = cols * cw;
  const H = ly + 140 + lineSamples.length * 22 + 20;
  const sec = document.createElement('section');
  sec.id = 'ground';
  sec.innerHTML = `<h2>Sols (13) et lignes (8) <small>— zoom ${z}, niveau ${lod} ; rendu en 4 tuiles décalées pour vérifier les raccords</small></h2>`;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * z * DPR);
  canvas.height = Math.round(H * z * DPR);
  canvas.style.width = `${W * z}px`;
  canvas.style.height = `${H * z}px`;
  sec.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  // rendu par tuiles : la texture doit être continue d'une tuile à l'autre
  const tile = 97;
  for (let ty = 0; ty < H; ty += tile) {
    for (let tx = 0; tx < W; tx += tile) {
      const view: Rect = { x: tx, y: ty, w: tile, h: tile };
      ctx.save();
      ctx.setTransform(DPR * z, 0, 0, DPR * z, 0, 0);
      ctx.beginPath();
      ctx.rect(view.x, view.y, view.w, view.h);
      ctx.clip();
      ctx.fillStyle = PAPER;
      ctx.fillRect(view.x, view.y, view.w, view.h);
      drawGround(ctx, ground, view, lod);
      ctx.restore();
    }
  }
  ctx.setTransform(DPR * z, 0, 0, DPR * z, 0, 0);
  ctx.fillStyle = '#2f2622';
  ctx.font = '6px system-ui, sans-serif';
  ctx.textAlign = 'left';
  GROUNDS.forEach((g, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    ctx.fillText(g, col * cw + 8, row * ch + ch - 8);
  });
  lineSamples.forEach((k, i) => ctx.fillText(k, 270, ly + 136 + i * 22));
  ctx.fillText('laneline · crosswalk · curb · rail', 120, ly + 92);
  return sec;
}

/* ----------------------------------------------------------------------------
 * Scène composée, rendue par tuiles (comme le moteur)
 * ------------------------------------------------------------------------- */

function buildScene(): { ground: GroundLayer; entities: Entity[]; w: number; h: number } {
  const w = 640;
  const h = 480;
  const r = new Rng(31);
  const ground: GroundLayer = { base: 'grass', shapes: [], lines: [] };
  // trottoirs et route est-ouest
  ground.shapes.push({ kind: 'sidewalk', points: rectPts(0, 150, w, 24) });
  ground.shapes.push({ kind: 'road', points: rectPts(0, 174, w, 48) });
  ground.shapes.push({ kind: 'sidewalk', points: rectPts(0, 222, w, 24) });
  ground.lines.push({ kind: 'curb', points: [{ x: 0, y: 174 }, { x: w, y: 174 }], width: 1 });
  ground.lines.push({ kind: 'curb', points: [{ x: 0, y: 222 }, { x: w, y: 222 }], width: 1 });
  ground.lines.push({ kind: 'laneline', points: [{ x: 0, y: 198 }, { x: w, y: 198 }], width: 1.2 });
  ground.lines.push({ kind: 'crosswalk', points: [{ x: 300, y: 176 }, { x: 300, y: 220 }], width: 16 });
  // place pavée, parc, quai et eau
  ground.shapes.push({ kind: 'plaza', points: rectPts(250, 246, 230, 130) });
  ground.shapes.push({ kind: 'park', points: rectPts(0, 246, 250, 130) });
  ground.lines.push({ kind: 'path', points: [{ x: 0, y: 320 }, { x: 120, y: 300 }, { x: 250, y: 310 }], width: 8 });
  ground.lines.push({ kind: 'hedge', points: [{ x: 4, y: 252 }, { x: 240, y: 252 }], width: 5 });
  ground.shapes.push({ kind: 'parking', points: rectPts(480, 246, 160, 130) });
  ground.shapes.push({ kind: 'dock', points: rectPts(0, 376, w, 26) });
  ground.shapes.push({ kind: 'water', points: rectPts(0, 402, w, 78) });
  ground.lines.push({ kind: 'fence', points: [{ x: 0, y: 380 }, { x: w, y: 380 }], width: 1 });
  ground.shapes.push({ kind: 'courtyard', points: rectPts(560, 0, 80, 150) });
  ground.lines.push({ kind: 'wall', points: [{ x: 560, y: 4 }, { x: 560, y: 148 }], width: 3 });
  const ents: Entity[] = [];
  // rangée de bâtiments au nord de la route
  let x = 6;
  const styles: BuildingStyle[] = ['townhouse', 'bakery', 'apartment', 'cafe', 'jeweler', 'house', 'shop'];
  for (const s of styles) {
    const d = STYLE_DEFAULTS[s];
    const bw = Math.min(d.w, 90);
    if (x + bw > 556) break;
    const bh = 70;
    ents.push({
      ...building(s, { seed: r.int(1, 999), wall: r.pick(['beige', 'pink', 'yellow', 'white', 'green', 'orange'] as Color[]) }, bw, bh),
      footprint: { x, y: 148 - bh, w: bw, h: bh },
      x: x + bw / 2,
      y: 148,
    });
    x += bw + 2;
  }
  ents.push({ ...building('shed', {}, 40, 30), footprint: { x: 580, y: 100, w: 40, h: 30 }, x: 600, y: 130 });
  // mobilier, foule, véhicules
  const prop = (p: PropKind, px: number, py: number, extra: Partial<PropEntity> = {}): PropEntity => ({ id: `s.o.${uid++}`, kind: 'prop', prop: p, x: px, y: py, ...extra });
  ents.push(prop('fountain', 365, 330));
  ents.push(prop('lamp', 120, 168), prop('lamp', 420, 168), prop('bench', 300, 268), prop('bin', 330, 168));
  ents.push(prop('stall', 290, 360, { color: 'red' }), prop('stall', 440, 360, { color: 'green' }));
  ents.push(prop('pigeons', 380, 292), prop('mailbox', 200, 166), prop('flowerbed', 60, 290));
  ents.push(prop('crate', 520, 396), prop('barrel', 540, 396), prop('needle', 352, 300));
  for (let i = 0; i < 9; i++) ents.push({ id: `s.t.${i}`, kind: 'tree', tree: r.pick(TREES), size: r.int(36, 60), x: 20 + i * 26 + r.int(-6, 6), y: 270 + r.int(0, 90) });
  ents.push({ id: 's.v.1', kind: 'vehicle', vehicle: 'car', facing: 'right', color: 'red', x: 120, y: 192, driver: randomAppearance(r) });
  ents.push({ id: 's.v.2', kind: 'vehicle', vehicle: 'bus', facing: 'left', color: 'green', x: 470, y: 216, label: '12 GARE', driver: randomAppearance(r) });
  ents.push({ id: 's.v.3', kind: 'vehicle', vehicle: 'taxi', facing: 'right', color: 'yellow', x: 520, y: 290, label: 'MB-77' });
  ents.push({ id: 's.v.4', kind: 'vehicle', vehicle: 'van', facing: 'left', color: 'white', x: 580, y: 330 });
  ents.push({ id: 's.v.5', kind: 'vehicle', vehicle: 'boat', facing: 'right', color: 'blue', x: 200, y: 440, label: 'LA MOUETTE', driver: randomAppearance(r) });
  ents.push({ id: 's.v.6', kind: 'vehicle', vehicle: 'bicycle', facing: 'left', color: 'red', x: 260, y: 208, driver: randomAppearance(r) });
  for (let i = 0; i < 70; i++) {
    const zone = r.int(0, 3);
    const px = r.range(10, w - 10);
    const py = zone === 0 ? r.range(156, 172) : zone === 1 ? r.range(226, 244) : zone === 2 ? r.range(260, 372) : r.range(380, 398);
    ents.push(
      person(randomAppearance(r), {
        id: `s.p.${i}`,
        x: px,
        y: py,
        pose: r.chance(0.7) ? r.pick(['stand', 'walk'] as Pose[]) : r.pick(['run', 'point', 'wave', 'phone', 'read', 'carry', 'sit'] as Pose[]),
        facing: r.chance(0.5) ? 'left' : 'right',
        emote: r.chance(0.08) ? r.pick(EMOTES) : 'none',
        holding: r.chance(0.1) ? r.pick(HELD) : 'none',
      }),
    );
  }
  ents.push(person({ topColor: 'black', face: 'mask', hat: 'beanie' }, { id: 's.p.thief', x: 240, y: 230, pose: 'sneak', holding: 'moneybag' }));
  ents.push(person({ topColor: 'purple' }, { id: 's.p.win', x: 172, y: 120, pose: 'window', emote: 'exclaim', sortY: 149 }));
  ents.sort(compareDrawOrder);
  return { ground, entities: ents, w, h };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function renderScene(): HTMLElement {
  const z = Number(params.get('szoom') ?? Math.min(ZOOM, 2));
  const lod = lodFor(z);
  const { ground, entities, w, h } = buildScene();
  const sec = document.createElement('section');
  sec.id = 'scene';
  sec.innerHTML = `<h2>Scène de rue <small>— zoom ${z}, niveau ${lod}, rendue en tuiles de 100 u (raccords visibles = débordement d'emprise)</small></h2>`;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * z * DPR);
  canvas.height = Math.round(h * z * DPR);
  canvas.style.width = `${w * z}px`;
  canvas.style.height = `${h * z}px`;
  sec.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const tile = 100;
  for (let ty = 0; ty < h; ty += tile) {
    for (let tx = 0; tx < w; tx += tile) {
      const view: Rect = { x: tx, y: ty, w: tile, h: tile };
      ctx.save();
      ctx.setTransform(DPR * z, 0, 0, DPR * z, 0, 0);
      ctx.beginPath();
      ctx.rect(view.x, view.y, view.w, view.h);
      ctx.clip();
      ctx.fillStyle = PAPER;
      ctx.fillRect(view.x, view.y, view.w, view.h);
      drawGround(ctx, ground, view, lod);
      for (const e of entities) if (intersects(getEntityBounds(e), view)) drawEntity(ctx, e, lod);
      ctx.restore();
    }
  }
  return sec;
}

/* ----------------------------------------------------------------------------
 * Contrôle automatique des emprises (pixels hors de getEntityBounds)
 * ------------------------------------------------------------------------- */

function checkEntities(): Entity[] {
  const r = new Rng(99);
  const out: Entity[] = [];
  // personnes : chaque pose × facing × combinaisons variées
  for (const pose of POSES) {
    for (const facing of ['left', 'right'] as Facing[]) {
      for (const build of BUILDS) {
        for (let k = 0; k < 6; k++) {
          const ap = randomAppearance(r);
          ap.build = build;
          out.push(person(ap, { pose, facing, holding: r.pick(HELD), emote: r.pick(EMOTES), z: k === 0 ? 30 : undefined }));
        }
        // valeurs extrêmes systématiques
        for (const hat of ['tophat', 'chef', 'straw'] as Hat[])
          out.push(person({ build, hat, accessory: 'umbrella' }, { pose, facing, emote: 'talk', holding: 'flashlight' }));
        for (const accessory of ACCESSORIES) out.push(person({ build, accessory, hair: 'curly', hat: 'fedora' }, { pose, facing, holding: 'leash', emote: 'heart' }));
        for (const holding of HELD) out.push(person({ build, accessory: 'balloon', hair: 'long' }, { pose, facing, holding, emote: 'sleep' }));
      }
    }
  }
  // bâtiments
  for (const s of STYLES) {
    for (const seed of [1, 2, 3]) {
      out.push(building(s, { seed, features: [{ kind: 'balcony', at: 0.5, floor: 1 }, { kind: 'awning', at: 0.2, color: 'red' }, { kind: 'graffiti', at: 0.9, text: 'ZAP' }, { kind: 'poster', at: 0.05 }, { kind: 'openDoor', at: 0.5 }] }));
      out.push(building(s, { seed }, 40, 30));
      out.push(building(s, { seed, height: 28 }, 300, 60));
    }
  }
  // véhicules
  for (const v of VEHICLES)
    for (const f of ['left', 'right'] as Facing[])
      out.push({ id: `c.v.${uid++}`, kind: 'vehicle', vehicle: v, facing: f, x: 0, y: 0, color: r.pick(COLORS), driver: randomAppearance(r), label: 'LABEL TRÈS LONG 123', doorOpen: true });
  // arbres
  for (const t of TREES) for (const size of [20, 30, 45, 70, 90]) out.push({ id: `c.t.${uid++}.${t}${size}`, kind: 'tree', tree: t, size, x: 0, y: 0 });
  // objets
  for (const p of PROPS)
    for (const scale of [0.6, 1, 1.7])
      for (const facing of ['left', 'right'] as Facing[])
        out.push({ id: `c.o.${uid++}`, kind: 'prop', prop: p, x: 0, y: 0, scale, facing, label: 'TEXTE', color: r.pick(COLORS), variant: r.pick(['open', 'broken', 'big', 'small', undefined] as const) });
  return out;
}

interface Violation {
  id: string;
  kind: string;
  desc: string;
  lod: Lod;
  overflow: number;
  pixels: number;
}

function describe(e: Entity): string {
  switch (e.kind) {
    case 'person':
      return `${e.pose} ${e.facing} ${e.appearance.build} hat=${e.appearance.hat} acc=${e.appearance.accessory} hold=${e.holding} emote=${e.emote}${e.z ? ' z' : ''}`;
    case 'building':
      return `${e.style} ${e.footprint.w}×${e.footprint.h} h${e.height}`;
    case 'vehicle':
      return `${e.vehicle} ${e.facing}`;
    case 'tree':
      return `${e.tree} ${e.size}`;
    case 'prop':
      return `${e.prop} ×${e.scale} ${e.facing} ${e.variant ?? ''}`;
  }
}

function runBoundsCheck(): HTMLElement {
  const S = 4;
  const M = 16;
  const ents = checkEntities();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const violations: Violation[] = [];
  let checked = 0;
  const t0 = performance.now();
  for (const e of ents) {
    const b = getEntityBounds(e);
    const cw = Math.ceil((b.w + 2 * M) * S);
    const ch = Math.ceil((b.h + 2 * M) * S);
    if (canvas.width < cw) canvas.width = cw;
    if (canvas.height < ch) canvas.height = ch;
    for (const lod of [0, 1] as Lod[]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.setTransform(S, 0, 0, S, (M - b.x) * S, (M - b.y) * S);
      drawEntity(ctx, e, lod);
      const data = ctx.getImageData(0, 0, cw, ch).data;
      const x0 = M * S - 1;
      const y0 = M * S - 1;
      const x1 = (M + b.w) * S + 1;
      const y1 = (M + b.h) * S + 1;
      let worst = 0;
      let count = 0;
      const sides = { l: 0, r: 0, t: 0, b: 0 };
      for (let py = 0; py < ch; py++) {
        const inY = py >= y0 && py < y1;
        for (let px = 0; px < cw; px++) {
          if (inY && px >= x0 && px < x1) {
            px = x1 - 1;
            continue;
          }
          if (data[(py * cw + px) * 4 + 3] > 24) {
            count++;
            if (px < x0) sides.l++;
            else if (px >= x1) sides.r++;
            else if (py < y0) sides.t++;
            else sides.b++;
            const d = Math.max(x0 - px, px - x1 + 1, y0 - py, py - y1 + 1, 0) / S;
            if (d > worst) worst = d;
          }
        }
      }
      checked++;
      if (count > 0) violations.push({ id: e.id, kind: e.kind, desc: `${describe(e)} [${Object.entries(sides).filter(([, n]) => n > 0).map(([k, n]) => k + n).join(' ')}]`, lod, overflow: Math.round(worst * 100) / 100, pixels: count });
    }
  }
  const ms = performance.now() - t0;
  violations.sort((a, b) => b.overflow - a.overflow);
  const report = { checked, entities: ents.length, violations: violations.length, worst: violations.slice(0, 500), ms: Math.round(ms) };
  window.__artBoundsReport = report;
  const sec = document.createElement('section');
  sec.id = 'check';
  const status = violations.length === 0 ? `<span class="ok">AUCUN débordement</span>` : `<span class="bad">${violations.length} débordement(s)</span>`;
  sec.innerHTML = `<h2>Contrôle des emprises <small>— ${ents.length} entités × niveaux 0 et 1 (${checked} rendus, ${Math.round(ms)} ms)</small></h2><p>${status}</p>`;
  if (violations.length) {
    const t = document.createElement('table');
    t.innerHTML = '<tr><th>type</th><th>description</th><th>niveau</th><th>dépassement (u)</th><th>pixels</th></tr>' + violations.slice(0, 60).map((v) => `<tr><td>${v.kind}</td><td>${v.desc}</td><td>${v.lod}</td><td>${v.overflow}</td><td>${v.pixels}</td></tr>`).join('');
    sec.appendChild(t);
  }
  return sec;
}

/* ----------------------------------------------------------------------------
 * Mesure de performance
 * ------------------------------------------------------------------------- */

function runPerf(): HTMLElement {
  const r = new Rng(4242);
  const N_PEOPLE = 2000;
  const N_BUILDINGS = 300;
  const people: PersonEntity[] = [];
  for (let i = 0; i < N_PEOPLE; i++)
    people.push(
      person(randomAppearance(r), {
        id: `perf.p.${i}`,
        x: r.range(20, 1000),
        y: r.range(30, 1000),
        pose: r.chance(0.75) ? r.pick(['stand', 'walk'] as Pose[]) : r.pick(POSES),
        facing: r.chance(0.5) ? 'left' : 'right',
        holding: r.chance(0.1) ? r.pick(HELD) : 'none',
        emote: r.chance(0.05) ? r.pick(EMOTES) : 'none',
      }),
    );
  const buildings: BuildingEntity[] = [];
  for (let i = 0; i < N_BUILDINGS; i++) {
    const s = r.pick(STYLES);
    const d = STYLE_DEFAULTS[s];
    const b = building(s, { seed: r.int(1, 99999), id: `perf.b.${i}` });
    const x = r.range(0, 900);
    const y = r.range(100, 1000);
    buildings.push({ ...b, footprint: { x, y: y - d.h, w: d.w, h: d.h }, x: x + d.w / 2, y });
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const zooms: Record<Lod, number> = { 0: 1, 1: 0.5, 2: 0.15 };
  const result: Record<string, Record<string, number>> = { person: {}, building: {} };
  const measure = (ents: Entity[], lod: Lod): number => {
    const z = zooms[lod];
    const times: number[] = [];
    for (let rep = 0; rep < 4; rep++) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.getImageData(0, 0, 1, 1);
      ctx.setTransform(z, 0, 0, z, 0, 0);
      const t0 = performance.now();
      for (const e of ents) drawEntity(ctx, e, lod);
      ctx.getImageData(0, 0, 1, 1); // force le rendu effectif
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    return times[1] / ents.length; // deuxième meilleur (le premier passage chauffe)
  };
  for (const lod of [0, 1, 2] as Lod[]) {
    result.person[`lod${lod}`] = Math.round(measure(people, lod) * 10000) / 10000;
    result.building[`lod${lod}`] = Math.round(measure(buildings, lod) * 10000) / 10000;
  }
  const perf = { unit: 'ms par entité', people: N_PEOPLE, buildings: N_BUILDINGS, zooms, ...result, target: { personLod0: 0.05 } };
  window.__artPerf = perf;
  const sec = document.createElement('section');
  sec.id = 'perf';
  const ok = (v: number, lim: number) => `<span class="${v <= lim ? 'ok' : 'bad'}">${v}</span>`;
  sec.innerHTML = `<h2>Performance <small>— ${N_PEOPLE} personnes, ${N_BUILDINGS} bâtiments, canevas 1024², ms par entité (médiane de 4)</small></h2>
  <table><tr><th></th><th>niveau 0 (zoom 1)</th><th>niveau 1 (zoom 0,5)</th><th>niveau 2 (zoom 0,15)</th></tr>
  <tr><td>personne</td><td>${ok(result.person.lod0, 0.05)}</td><td>${ok(result.person.lod1, 0.03)}</td><td>${ok(result.person.lod2, 0.005)}</td></tr>
  <tr><td>bâtiment</td><td>${ok(result.building.lod0, 1)}</td><td>${ok(result.building.lod1, 0.3)}</td><td>${ok(result.building.lod2, 0.05)}</td></tr></table>
  <p>Résultat aussi dans <code>window.__artPerf</code>.</p>`;
  return sec;
}

/* ----------------------------------------------------------------------------
 * Assemblage
 * ------------------------------------------------------------------------- */

const SPECIAL = ['ground', 'scene', 'check', 'perf'];

function nav(): void {
  const ids = [...plates.map((p) => p.id), ...SPECIAL];
  const q = (extra: Record<string, string>) => {
    const p = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return `?${p.toString()}`;
  };
  document.getElementById('nav')!.innerHTML = ids.map((id) => `<a href="${q({ section: id })}">${id}</a>`).join('') + ` <a href="?">tout</a>`;
  document.getElementById('opts')!.innerHTML =
    `zoom : ${[4, 2, 1.5, 1, 0.5, 0.2].map((z) => `<a href="${q({ zoom: String(z) })}">${z}</a>`).join('')} · ` +
    `<a href="${q({ bounds: SHOW_BOUNDS ? '0' : '1' })}">emprises ${SHOW_BOUNDS ? 'off' : 'on'}</a>`;
}

function main(): void {
  nav();
  const mainEl = document.getElementById('main')!;
  for (const p of plates) if (!ONLY || ONLY === p.id) mainEl.appendChild(renderPlate(p));
  if (!ONLY || ONLY === 'ground') mainEl.appendChild(renderGroundPlate());
  if (!ONLY || ONLY === 'scene') mainEl.appendChild(renderScene());
  // Les contrôles lourds ne tournent que sur demande explicite.
  if (ONLY === 'check') mainEl.appendChild(runBoundsCheck());
  if (ONLY === 'perf') mainEl.appendChild(runPerf());
  window.__haystackReady = true;
}

main();
