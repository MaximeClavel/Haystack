// Petits outils de dessin partagés par tout le module art.

import { hashString } from '../lib/rng';
import { INK, SHADOW } from './palette';
import type { Lod } from './lod';

export const TAU = Math.PI * 2;

export type Ctx = CanvasRenderingContext2D;

/** Épaisseurs de trait en unités monde, par niveau de détail. */
export const LW = {
  /** Contour des personnages. */
  person: [0.5, 0.85, 0] as const,
  /** Contour des objets, véhicules, arbres. */
  thing: [0.6, 0.9, 0] as const,
  /** Contour des bâtiments. */
  building: [0.8, 1.1, 0] as const,
  /** Détails fins (fentes, joints, rayures). */
  fine: [0.3, 0.5, 0] as const,
};

/** Prépare le contexte pour dessiner une entité (encre, jointures arrondies). */
export function beginInk(ctx: Ctx, lw: number): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

/** Ombre portée au sol : ellipse translucide. */
export function groundShadow(ctx: Ctx, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = SHADOW;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

/** Chemin d'un rectangle à coins arrondis (sans roundRect, pour les vieux navigateurs). */
export function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** Remplit puis contourne un rectangle. */
export function boxFS(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, stroke = true): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  if (stroke) ctx.stroke();
}

/** Remplit puis contourne un rectangle arrondi. */
export function rboxFS(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string, stroke = true): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  rrect(ctx, x, y, w, h, r);
  ctx.fill();
  if (stroke) ctx.stroke();
}

/** Remplit puis contourne un disque. */
export function circleFS(ctx: Ctx, x: number, y: number, r: number, fill: string, stroke = true): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  if (stroke) ctx.stroke();
}

/** Remplit puis contourne une ellipse. */
export function ellipseFS(
  ctx: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  stroke = true,
  rot = 0,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fill();
  if (stroke) ctx.stroke();
}

/** Polygone (liste plate x0, y0, x1, y1…) rempli puis contourné. */
export function polyFS(ctx: Ctx, pts: readonly number[], fill: string, stroke = true): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fill();
  if (stroke) ctx.stroke();
}

/** Segment simple. */
export function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

/** Trait épais « encré » : un trait d'encre large puis la couleur par-dessus (membres, tiges…). */
export function inkedStroke(ctx: Ctx, pts: readonly number[], width: number, color: string, ol: number): void {
  const prev = ctx.lineWidth;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  if (ol > 0) {
    ctx.lineWidth = width + ol * 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = prev;
}

/** Graine stable dérivée d'un identifiant. */
export function seedOf(id: string, salt = 0): number {
  return (hashString(id) ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
}

/** Petit générateur rapide (xorshift) pour les variations de dessin — déterministe. */
export function quickRand(seed: number): () => number {
  let s = seed >>> 0 || 0x12345678;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/** Épaisseur de contour pour un niveau de détail. */
export function lw(kind: keyof typeof LW, lod: Lod): number {
  return LW[kind][lod];
}

/** Échelle actuelle du contexte (pixels physiques par unité monde). */
export function deviceScale(ctx: Ctx): number {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b) || 1;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
