// Module art — illustration de Meulebourg dessinée en Canvas 2D par code.
//
// API (voir docs/ARCHITECTURE.md § 4 et src/art/README.md) :
//   Lod, lodForZoom, PAPER, COLOR_HEX, drawGround, drawEntity, drawPortrait,
//   + ré-exports de bounds.ts (getEntityBounds, getHitRect, sortKey, compareDrawOrder…).
//
// Le contexte reçu est en coordonnées MONDE. Tout dessin d'une entité tient dans
// getEntityBounds(e) (rendu par tuiles).

import type { Entity } from '../types';
import type { Lod } from './lod';
import { drawPerson } from './person';
import { drawBuilding } from './building';
import { drawVehicle } from './vehicle';
import { drawTree } from './tree';
import { drawProp } from './props';

export type { Lod } from './lod';
export { lodForZoom } from './lod';
export { PAPER, INK, COLOR_HEX, COLOR_NAME_FR } from './palette';
export { drawGround } from './ground';
export { drawPortrait } from './person';
export {
  getEntityBounds,
  getHitRect,
  sortKey,
  compareDrawOrder,
  buildingVisibleRect,
  personSize,
  PROP_SIZE,
  VEHICLE_SIZE,
  FLAT_PROPS,
  TREE_WIDTH_RATIO,
  BUILDING_TOP_EXTRA,
} from './bounds';

/** Dessine une entité (contexte en coordonnées monde). */
export function drawEntity(ctx: CanvasRenderingContext2D, e: Entity, lod: Lod): void {
  switch (e.kind) {
    case 'person':
      drawPerson(ctx, e, lod);
      return;
    case 'building':
      drawBuilding(ctx, e, lod);
      return;
    case 'vehicle':
      drawVehicle(ctx, e, lod);
      return;
    case 'tree':
      drawTree(ctx, e, lod);
      return;
    case 'prop':
      drawProp(ctx, e, lod);
      return;
  }
}
