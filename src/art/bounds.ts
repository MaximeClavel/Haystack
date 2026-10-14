// Emprises des entités — module PUR (aucun accès au DOM), utilisé par world, engine et game.
//
// RÈGLE ABSOLUE pour le module art : tout ce que drawEntity() dessine pour une entité doit
// tenir dans getEntityBounds(e). Le rendu se fait par tuiles : un trait qui dépasse
// l'emprise serait coupé au bord d'une tuile (raccords visibles).
//
// getHitRect(e) est l'emprise « corps » utilisée pour la désignation (plus serrée).

import type { Entity, PropKind, Rect, VehicleKind, PersonEntity, Build } from '../types';
import { PERSON_HEIGHT } from '../config';

/** Taille nominale des objets : [largeur, hauteur] en unités monde, à l'échelle 1. */
export const PROP_SIZE: Record<PropKind, [number, number]> = {
  bench: [22, 10],
  lamp: [6, 34],
  bin: [7, 9],
  mailbox: [7, 11],
  hydrant: [5, 7],
  phonebooth: [12, 30],
  kiosk: [26, 28],
  busstop: [26, 24],
  sign: [12, 22],
  cone: [5, 7],
  barrier: [22, 9],
  manhole: [12, 6],
  fountain: [60, 36],
  statue: [16, 40],
  bandstand: [80, 60],
  stall: [34, 24],
  parasol: [20, 22],
  table: [12, 8],
  chair: [6, 9],
  cart: [20, 14],
  crate: [10, 10],
  barrel: [8, 11],
  pallet: [14, 4],
  crane: [70, 120],
  scaffold: [60, 90],
  tent: [30, 22],
  playground: [50, 30],
  bush: [16, 11],
  flowerbed: [24, 8],
  rock: [10, 7],
  puddle: [18, 6],
  dog: [16, 12],
  cat: [8, 7],
  pigeons: [12, 5],
  duck: [7, 6],
  moneybag: [7, 8],
  suitcase: [10, 8],
  briefcase: [8, 6],
  knife: [6, 3],
  painting: [14, 12],
  safe: [12, 13],
  ladder: [10, 40],
  rope: [10, 6],
  footprints: [20, 8],
  trashbag: [8, 8],
  letter: [5, 4],
  key: [4, 3],
  jewel: [4, 4],
  cake: [8, 6],
  needle: [6, 6],
};

/** Objets « à plat » au sol : centrés verticalement sur l'ancre au lieu d'être posés dessus. */
export const FLAT_PROPS: ReadonlySet<PropKind> = new Set<PropKind>(['manhole', 'puddle', 'footprints', 'pallet']);

/** Taille des véhicules vus de profil : [longueur, hauteur]. */
export const VEHICLE_SIZE: Record<VehicleKind, [number, number]> = {
  car: [44, 20],
  taxi: [44, 24],
  police: [44, 24],
  van: [52, 28],
  bus: [100, 34],
  truck: [80, 32],
  ambulance: [56, 30],
  bicycle: [22, 30], // avec cycliste
  scooter: [22, 30], // avec pilote
  boat: [90, 34],
};

/** Largeur relative de la couronne par type d'arbre (× size). */
export const TREE_WIDTH_RATIO = { round: 0.7, pine: 0.5, poplar: 0.35, bare: 0.6 } as const;

/** Débord vertical au-dessus de la façade (cheminées, clocher, horloge…). */
export const BUILDING_TOP_EXTRA: Partial<Record<string, number>> = {
  church: 60,
  townhall: 30,
  station: 24,
  museum: 16,
  theatre: 16,
};
const DEFAULT_TOP_EXTRA = 12;

export function personSize(build: Build): { w: number; h: number } {
  switch (build) {
    case 'child':
      return { w: 8, h: 13 };
    case 'slim':
      return { w: 9, h: PERSON_HEIGHT };
    case 'large':
      return { w: 13, h: PERSON_HEIGHT };
    default:
      return { w: 10, h: PERSON_HEIGHT };
  }
}

function personBodyRect(e: PersonEntity): Rect {
  const { w, h } = personSize(e.appearance.build);
  const z = e.z ?? 0;
  switch (e.pose) {
    case 'lie':
      return { x: e.x - h * 0.55, y: e.y - z - 7, w: h * 1.1, h: 7 };
    case 'sit':
      return { x: e.x - w / 2 - 2, y: e.y - z - h * 0.8, w: w + 4, h: h * 0.8 };
    case 'crouch':
      return { x: e.x - w / 2 - 1, y: e.y - z - h * 0.7, w: w + 2, h: h * 0.7 };
    case 'window':
      // Buste encadré par une fenêtre : l'ancre est le bas de la fenêtre.
      return { x: e.x - 7, y: e.y - z - 13, w: 14, h: 13 };
    default:
      return { x: e.x - w / 2, y: e.y - z - h, w, h };
  }
}

/** Emprise visuelle (conservatrice) : tout le dessin de l'entité doit y tenir. */
export function getEntityBounds(e: Entity): Rect {
  const z = e.z ?? 0;
  switch (e.kind) {
    case 'person': {
      const b = personBodyRect(e);
      // Marges : chapeaux et bulle d'émotion au-dessus, objets tenus et accessoires sur les côtés.
      return { x: b.x - 8, y: b.y - 12, w: b.w + 16, h: b.h + 14 };
    }
    case 'prop': {
      const [w0, h0] = PROP_SIZE[e.prop];
      const s = e.scale ?? 1;
      const w = w0 * s;
      const h = h0 * s;
      const top = FLAT_PROPS.has(e.prop) ? e.y - z - h / 2 : e.y - z - h;
      return { x: e.x - w / 2 - 3, y: top - 3 - (e.label ? 4 : 0), w: w + 6, h: h + 6 + (e.label ? 4 : 0) };
    }
    case 'vehicle': {
      const [w, h] = VEHICLE_SIZE[e.vehicle];
      const below = e.vehicle === 'boat' ? 8 : 3;
      return { x: e.x - w / 2 - 3, y: e.y - z - h - 4, w: w + 6, h: h + 4 + below };
    }
    case 'tree': {
      const w = e.size * TREE_WIDTH_RATIO[e.tree];
      return { x: e.x - w / 2 - 3, y: e.y - z - e.size - 3, w: w + 6, h: e.size + 6 };
    }
    case 'building': {
      const f = e.footprint;
      const extra = BUILDING_TOP_EXTRA[e.style] ?? DEFAULT_TOP_EXTRA;
      return { x: f.x - 6, y: f.y - e.height - extra, w: f.w + 12, h: f.h + e.height + extra + 4 };
    }
  }
}

/** Emprise « corps » pour la désignation au doigt (plus serrée que l'emprise visuelle). */
export function getHitRect(e: Entity): Rect {
  const z = e.z ?? 0;
  switch (e.kind) {
    case 'person':
      return personBodyRect(e);
    case 'prop': {
      const [w0, h0] = PROP_SIZE[e.prop];
      const s = e.scale ?? 1;
      const w = w0 * s;
      const h = h0 * s;
      const top = FLAT_PROPS.has(e.prop) ? e.y - z - h / 2 : e.y - z - h;
      return { x: e.x - w / 2, y: top, w, h };
    }
    case 'vehicle': {
      const [w, h] = VEHICLE_SIZE[e.vehicle];
      return { x: e.x - w / 2, y: e.y - z - h, w, h };
    }
    case 'tree': {
      const w = e.size * TREE_WIDTH_RATIO[e.tree];
      return { x: e.x - w / 2, y: e.y - z - e.size, w, h: e.size };
    }
    case 'building':
      // Toit + façade : ce que l'œil voit du bâtiment.
      return buildingVisibleRect(e);
  }
}

/** Emprise toit + façade d'un bâtiment (ce que l'œil voit). */
export function buildingVisibleRect(e: Extract<Entity, { kind: 'building' }>): Rect {
  const f = e.footprint;
  return { x: f.x, y: f.y - e.height, w: f.w, h: f.h + e.height };
}

/** Clé d'ordre de dessin par défaut. Les entités en hauteur (z > 0) doivent fixer sortY explicitement. */
export function sortKey(e: Entity): number {
  if (e.sortY !== undefined) return e.sortY;
  if (e.kind === 'building') return e.footprint.y + e.footprint.h;
  return e.y;
}

/** Comparateur stable : sortY croissant, puis id (déterminisme entre tuiles). */
export function compareDrawOrder(a: Entity, b: Entity): number {
  const d = sortKey(a) - sortKey(b);
  if (d !== 0) return d;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
