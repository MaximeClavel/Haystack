// Désignation : quelle entité le joueur montre-t-il du doigt ?
import type { Entity, Pick, Vec2, World } from '../types';
import { PICK_TOLERANCE_PX } from '../config';
import { getHitRect } from '../art/bounds';
import { rectContains } from './geometry';

/** Tolérance de désignation en unités monde pour un zoom donné. */
export function pickTolerance(zoom: number): number {
  return PICK_TOLERANCE_PX / Math.max(zoom, 1e-6);
}

/**
 * Entité sous le doigt au point monde `point`, la caméra étant au zoom `zoom`.
 *
 * Règles (dans l'ordre) :
 * 1. on préfère une entité dont le rectangle de désignation (getHitRect) contient EXACTEMENT
 *    le point ; à défaut, une entité dont ce rectangle élargi de t = PICK_TOLERANCE_PX / zoom
 *    le contient ;
 * 2. en cas d'égalité, la plus en avant dans l'ordre de dessin (la plus tardive) ;
 * 3. exception « décor » : si l'entité touchée exactement est un BÂTIMENT et qu'une entité
 *    plus petite, dessinée DEVANT lui, est à portée de tolérance, c'est elle qui est désignée
 *    (un doigt qui frôle un passant devant une façade vise le passant). Une réponse « bâtiment »
 *    reste acceptée par CaseSession.submit, qui teste aussi le point sur la façade.
 *
 * Renvoie `entityId: null` si rien n'est à portée.
 */
export function pickAt(world: World, point: Vec2, zoom: number): Pick {
  const p = { x: point.x, y: point.y };
  const t = pickTolerance(zoom);
  // Marge d'1 u : l'index travaille sur les emprises visuelles, qui contiennent les rectangles de désignation.
  const m = t + 1;
  const candidates = world.index.query({ x: p.x - m, y: p.y - m, w: 2 * m, h: 2 * m });

  let exact: Entity | null = null;
  // Plus en avant des entités à portée de tolérance (rencontrée avant toute entité exacte).
  let near: Entity | null = null;
  // Idem, hors bâtiments : candidate pour l'exception « décor ».
  let nearInFront: Entity | null = null;
  // Parcours du plus en avant au plus en arrière.
  for (let i = candidates.length - 1; i >= 0; i--) {
    const e = candidates[i];
    const r = getHitRect(e);
    if (rectContains(r, p)) {
      // La première entité touchée exactement masque tout ce qui est derrière elle : on a fini.
      exact = e;
      break;
    }
    if (rectContains(r, p, t)) {
      if (!near) near = e;
      if (!nearInFront && e.kind !== 'building') nearInFront = e;
    }
  }

  let chosen: Entity | null;
  if (exact && exact.kind === 'building' && nearInFront) chosen = nearInFront;
  else chosen = exact ?? near;
  return { point: p, entityId: chosen ? chosen.id : null };
}
