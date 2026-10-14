// Texte sur la carte (enseignes, plaques, panneaux).
//
// Pile de polices SYSTÈME uniquement : une police web pourrait se charger entre deux tuiles et
// produire des enseignes différentes d'une tuile à l'autre.

import type { Ctx } from './util';

export const FONT_STACK = "'Arial Narrow', 'Liberation Sans Narrow', 'Nimbus Sans Narrow', Arial, Helvetica, sans-serif";
export const SERIF_STACK = "Georgia, 'Times New Roman', 'Liberation Serif', serif";

const widthCache = new Map<string, number>();

function fontString(size: number, weight: string, family: string): string {
  return `${weight} ${size}px ${family}`;
}

/** Largeur du texte pour une taille de police de 1 unité (mise en cache). */
export function unitTextWidth(ctx: Ctx, text: string, weight = 'bold', family = FONT_STACK): number {
  const key = `${weight}|${family}|${text}`;
  let w = widthCache.get(key);
  if (w === undefined) {
    ctx.font = fontString(100, weight, family);
    w = ctx.measureText(text).width / 100;
    widthCache.set(key, w);
  }
  return w;
}

/**
 * Écrit `text` centré en (cx, cy), à la plus grande taille qui tient dans maxW × maxH.
 * Renvoie la taille de police utilisée.
 */
export function fitText(
  ctx: Ctx,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
  maxH: number,
  color: string,
  weight = 'bold',
  family = FONT_STACK,
): number {
  if (!text) return 0;
  const uw = unitTextWidth(ctx, text, weight, family);
  const size = Math.min(maxH, uw > 0 ? maxW / uw : maxH);
  if (size <= 0.2) return 0;
  ctx.font = fontString(size, weight, family);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Les capitales paraissent un peu hautes avec 'middle' : léger décalage vers le bas.
  ctx.fillText(text, cx, cy + size * 0.06);
  return size;
}

/** Écrit un texte à une taille donnée. */
export function drawText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
  weight = 'bold',
  family = FONT_STACK,
): void {
  ctx.font = fontString(size, weight, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + size * 0.06);
}

/**
 * Écrit un texte non retourné dans un repère éventuellement en miroir (dir = -1).
 * Utilisé pour les véhicules et objets dessinés « face à droite » puis retournés.
 */
export function fitTextUpright(
  ctx: Ctx,
  dir: number,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
  maxH: number,
  color: string,
  weight = 'bold',
): number {
  if (dir >= 0) return fitText(ctx, text, cx, cy, maxW, maxH, color, weight);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(-1, 1);
  const s = fitText(ctx, text, 0, 0, maxW, maxH, color, weight);
  ctx.restore();
  return s;
}
