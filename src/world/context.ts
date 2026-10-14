// Contexte de génération partagé par les sous-générateurs (bâtiments, mobilier, foule…).
// Il porte la grille d'occupation, les index de collision et les compteurs d'identifiants.
import type {
  BuildingEntity,
  Color,
  Emote,
  Entity,
  Facing,
  HeldItem,
  Pose,
  PersonAppearance,
  PersonEntity,
  PropEntity,
  PropKind,
  Rect,
  TreeEntity,
  TreeKind,
  VehicleEntity,
  VehicleKind,
} from '../types';
import { hashString, Rng } from '../lib/rng';
import { FLAT_PROPS, PROP_SIZE, TREE_WIDTH_RATIO, VEHICLE_SIZE, personSize } from '../art/bounds';
import { RectHash, round1 } from './geom';
import type { CityPlan } from './layout';
import type { GroundBuilder } from './ground';
import type { GroundIndex } from './query';
import type { Role } from './appearance';
import {
  F_BUILDING,
  F_CROSS,
  F_HIDDEN,
  F_LINE,
  F_PERSON,
  F_RAIL,
  F_ROAD,
  F_SOLID,
  F_WATER,
  type Raster,
} from './raster';

/** Place réservée pour un personnage (vendeur derrière son étal, assis sur un banc…), remplie par people.ts. */
export interface Slot {
  x: number;
  y: number;
  role: Role;
  pose: Pose;
  facing: Facing;
  /** Probabilité que la place soit occupée. */
  chance: number;
  holding?: HeldItem;
  emote?: Emote;
  sortY?: number;
  /** Ne pas vérifier la grille (position garantie par le générateur du lieu). */
  trusted?: boolean;
  /** Animal ou objet qui accompagne (chien en laisse…). */
  companion?: 'dog';
}

export interface Gen {
  seed: number;
  plan: CityPlan;
  raster: Raster;
  gb: GroundBuilder;
  /** Index exact du sol (disponible une fois le sol terminé). */
  gi: GroundIndex;
  buildings: BuildingEntity[];
  footHash: RectHash<BuildingEntity>;
  bandHash: RectHash<BuildingEntity>;
  /** Entités ambiantes hors bâtiments, dans l'ordre de création. */
  entities: Entity[];
  counters: { p: number; v: number; t: number; o: number };
  /** Places réservées aux personnages (remplies par people.ts). */
  slots: Slot[];
  districtCounters: Map<string, number>;
}

export function makeRng(seed: number, label: string): Rng {
  return new Rng((hashString(label) ^ Math.imul(seed, 0x9e3779b1)) >>> 0);
}

/** Masque des cellules où un piéton ne peut pas avoir les pieds. */
export const PERSON_BLOCK = F_WATER | F_BUILDING | F_HIDDEN | F_SOLID | F_PERSON | F_LINE | F_RAIL;

/** Rectangle des pieds d'une personne (pour la grille). */
export function feetRect(x: number, y: number, w = 8): Rect {
  return { x: x - w / 2, y: y - 3, w, h: 4 };
}

/**
 * Un piéton peut-il se tenir là ? (test rapide sur la grille, conservateur)
 * `allowRoad` : autorise la chaussée si c'est un passage piéton.
 */
export function canStand(g: Gen, x: number, y: number, opts: { allowCross?: boolean; w?: number } = {}): boolean {
  const r = feetRect(x, y, opts.w ?? 8);
  if (g.raster.any(r, PERSON_BLOCK)) return false;
  if (g.raster.any(r, F_ROAD)) {
    if (!opts.allowCross) return false;
    if (!g.raster.all(r, F_CROSS)) return false;
  }
  return true;
}

/** Vérification exacte (sol réel) d'un emplacement de piéton. */
export function exactStandOk(g: Gen, x: number, y: number): boolean {
  // Grille conservatrice : si aucune case voisine n'est chaussée, eau ou ballast, le sol exact est sûr.
  if (!g.raster.any({ x: x - 4, y: y - 1, w: 8, h: 2 }, F_ROAD | F_WATER | F_RAIL)) return true;
  // Marge de 0,5 u au-delà des ±3 u vérifiés par les tests (les coordonnées sont arrondies au dixième).
  for (const dx of [-3.5, 0, 3.5]) {
    const k = g.gi.kindAt(x + dx, y);
    if (k === 'water' || k === 'railbed') return false;
    if (k === 'road' && !g.gi.onCrosswalk(x + dx, y)) return false;
  }
  return true;
}

/** Marque la zone d'écran masquée par une entité haute (personne derrière = pieds invisibles). */
export function markHiddenAbove(g: Gen, x: number, y: number, w: number, h: number): void {
  if (h <= 6) return;
  g.raster.markRect({ x: x - w / 2, y: y - h * 0.8, w, h: h * 0.8 - 3 }, F_HIDDEN);
}

export function addPerson(
  g: Gen,
  x: number,
  y: number,
  appearance: PersonAppearance,
  pose: PersonEntity['pose'],
  facing: Facing,
  extra: Partial<Pick<PersonEntity, 'holding' | 'emote' | 'z' | 'sortY' | 'tags'>> = {},
): PersonEntity {
  const e: PersonEntity = {
    id: `a.p.${g.counters.p++}`,
    kind: 'person',
    x: round1(x),
    y: round1(y),
    appearance,
    pose,
    facing,
    tags: ['ambient'],
  };
  if (extra.holding && extra.holding !== 'none') e.holding = extra.holding;
  if (extra.emote && extra.emote !== 'none') e.emote = extra.emote;
  if (extra.z) e.z = extra.z;
  if (extra.sortY !== undefined) e.sortY = extra.sortY;
  if (extra.tags) e.tags = extra.tags;
  g.entities.push(e);
  if (!extra.z && pose !== 'window') {
    const { w } = personSize(appearance.build);
    g.raster.markRect(feetRect(x, y, w + 2), F_PERSON);
    g.raster.markRect({ x: x - 4, y: y - 12, w: 8, h: 9 }, F_HIDDEN);
  }
  return e;
}

export function addProp(
  g: Gen,
  prop: PropKind,
  x: number,
  y: number,
  opts: { facing?: Facing; color?: Color; variant?: string; label?: string; scale?: number; solid?: boolean; z?: number; sortY?: number } = {},
): PropEntity {
  const e: PropEntity = { id: `a.o.${g.counters.o++}`, kind: 'prop', prop, x: round1(x), y: round1(y), tags: ['ambient'] };
  if (opts.facing) e.facing = opts.facing;
  if (opts.color) e.color = opts.color;
  if (opts.variant) e.variant = opts.variant;
  if (opts.label) e.label = opts.label;
  if (opts.scale && opts.scale !== 1) e.scale = opts.scale;
  if (opts.z) e.z = opts.z;
  if (opts.sortY !== undefined) e.sortY = opts.sortY;
  g.entities.push(e);
  if (!opts.z) {
    const [w0, h0] = PROP_SIZE[prop];
    const s = opts.scale ?? 1;
    const w = w0 * s;
    const h = h0 * s;
    if (opts.solid !== false) {
      if (FLAT_PROPS.has(prop)) g.raster.markRect({ x: x - w / 2, y: y - h / 2, w, h }, F_SOLID);
      else g.raster.markRect({ x: x - w / 2, y: y - Math.min(8, h), w, h: Math.min(8, h) + 1 }, F_SOLID);
    }
    if (!FLAT_PROPS.has(prop)) markHiddenAbove(g, x, y, w, h);
  }
  return e;
}

export function addTree(g: Gen, tree: TreeKind, x: number, y: number, size: number): TreeEntity {
  const e: TreeEntity = { id: `a.t.${g.counters.t++}`, kind: 'tree', tree, x: round1(x), y: round1(y), size: Math.round(size), tags: ['ambient'] };
  g.entities.push(e);
  g.raster.markRect({ x: x - 4, y: y - 5, w: 8, h: 6 }, F_SOLID);
  const w = size * TREE_WIDTH_RATIO[tree];
  // Le feuillage masque le sol juste au nord de l'arbre.
  g.raster.markRect({ x: x - w / 2, y: y - size * 0.75, w, h: size * 0.75 - 4 }, F_HIDDEN);
  return e;
}

export function addVehicle(
  g: Gen,
  vehicle: VehicleKind,
  x: number,
  y: number,
  facing: Facing,
  color: Color,
  opts: { driver?: PersonAppearance; label?: string; doorOpen?: boolean } = {},
): VehicleEntity {
  const e: VehicleEntity = { id: `a.v.${g.counters.v++}`, kind: 'vehicle', vehicle, x: round1(x), y: round1(y), facing, color, tags: ['ambient'] };
  if (opts.driver) e.driver = opts.driver;
  if (opts.label) e.label = opts.label;
  if (opts.doorOpen) e.doorOpen = true;
  g.entities.push(e);
  const [len, h] = VEHICLE_SIZE[vehicle];
  g.raster.markRect({ x: x - len / 2 - 2, y: y - 8, w: len + 4, h: 10 }, F_SOLID);
  markHiddenAbove(g, x, y, len, h);
  return e;
}

/** Rectangle de base (au sol) d'un véhicule, pour vérifier qu'il est sur la chaussée. */
export function vehicleBase(vehicle: VehicleKind, x: number, y: number): Rect {
  const [len] = VEHICLE_SIZE[vehicle];
  return { x: x - len / 2, y: y - 8, w: len, h: 8 };
}

/** Masque des cellules interdites pour la base d'un objet posé au sol. */
export const PROP_BLOCK = F_WATER | F_BUILDING | F_HIDDEN | F_SOLID | F_PERSON | F_LINE | F_RAIL | F_ROAD;

/** Pose un objet si sa base est libre (grille). Renvoie null sinon. */
export function tryProp(
  g: Gen,
  prop: PropKind,
  x: number,
  y: number,
  opts: Parameters<typeof addProp>[4] = {},
  mask = PROP_BLOCK,
): PropEntity | null {
  const [w0] = PROP_SIZE[prop];
  const w = w0 * (opts.scale ?? 1);
  if (g.raster.any({ x: x - w / 2, y: y - 4, w, h: 5 }, mask)) return null;
  return addProp(g, prop, x, y, opts);
}
