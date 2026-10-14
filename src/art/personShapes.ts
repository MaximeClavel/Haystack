// Formes des personnages, sous forme de « constructeurs de chemin » : chaque fonction AJOUTE des
// sous-chemins au chemin courant (sans beginPath, fill ni stroke).
//
// Les chemins sont construits UNE fois par (corpulence, pose, attribut) dans des Path2D mis en
// cache (voir person.ts) : ils servent ensuite à la sous-couche d'encre (toute la silhouette
// contournée d'un seul trait épais) et aux aplats (toutes les formes d'une couleur en un fill).
//
// ORIENTATION : tous les sous-chemins sont tracés dans le même sens (sens des aiguilles d'une
// montre à l'écran, comme arc(…, 0, 2π)) pour que leur union se remplisse sans trou avec la règle
// « non nulle ». Les repères utilisés (buste, tête) sont des rotations pures.
//
// Repères : buste (origine = milieu des épaules, y vers la taille, x vers l'avant) ; tête
// (origine = centre de la tête, x vers l'avant / le regard, y vers le menton).

import type { FaceDetail, HairStyle, Hat, TopKind } from '../types';
import type { Metrics, Pt } from './skeleton';
import { TAU } from './util';

/** Destination d'un tracé : contexte 2D ou Path2D (mêmes méthodes de chemin). */
export type Ctx = CanvasPath;

/* ----------------------------------------------------------------------------
 * Primitives
 * ------------------------------------------------------------------------- */

/** Sous-chemin cercle (sans trait parasite depuis le point courant). */
export function circ(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.moveTo(x + r, y);
  ctx.arc(x, y, r, 0, TAU);
}

/** Sous-chemin ellipse (rotation rot). */
export function ell(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0): void {
  ctx.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx);
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
}

/** Sous-chemin polygone (liste plate), toujours orienté dans le sens positif. */
export function poly(ctx: Ctx, pts: readonly number[]): void {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i += 2) {
    const j = (i + 2) % n;
    area += pts[i] * pts[j + 1] - pts[j] * pts[i + 1];
  }
  if (area >= 0) {
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < n; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  } else {
    ctx.moveTo(pts[n - 2], pts[n - 1]);
    for (let i = n - 4; i >= 0; i -= 2) ctx.lineTo(pts[i], pts[i + 1]);
  }
  ctx.closePath();
}

/** Rectangle (ctx.rect est déjà orienté dans le sens positif). */
export function box(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.rect(x, y, w, h);
}

/** Segment épais (rectangle tourné) de demi-largeur r, sans extrémités arrondies. */
export function seg(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, r: number): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1e-4) return;
  const nx = (dy / len) * r;
  const ny = (-dx / len) * r;
  ctx.moveTo(x0 + nx, y0 + ny);
  ctx.lineTo(x1 + nx, y1 + ny);
  ctx.lineTo(x1 - nx, y1 - ny);
  ctx.lineTo(x0 - nx, y0 - ny);
  ctx.closePath();
}

/** Gélule (segment épais à bouts ronds). */
export function capsule(ctx: Ctx, a: Pt, b: Pt, r: number): void {
  circ(ctx, a.x, a.y, r);
  seg(ctx, a.x, a.y, b.x, b.y, r);
  circ(ctx, b.x, b.y, r);
}

/** Membre à deux segments (épaule-coude-main, hanche-genou-cheville), bouts et articulation ronds. */
export function limb(ctx: Ctx, a: Pt, b: Pt, c: Pt, r: number): void {
  circ(ctx, a.x, a.y, r);
  seg(ctx, a.x, a.y, b.x, b.y, r);
  circ(ctx, b.x, b.y, r);
  seg(ctx, b.x, b.y, c.x, c.y, r);
  circ(ctx, c.x, c.y, r);
}

/** Point à la fraction t du segment a → b. */
export function along(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/* ----------------------------------------------------------------------------
 * Buste (repère du buste)
 * ------------------------------------------------------------------------- */

/** Dimensions du vêtement du haut : [élargissement épaules, élargissement hanches, longueur sous la taille]. */
const TOP_DIMS: Record<TopKind, [number, number, number]> = {
  tshirt: [0, 0, 0.5],
  shirt: [0, 0, 0.25],
  sweater: [0.15, 0.15, 0.7],
  hoodie: [0.2, 0.2, 0.9],
  coat: [0.25, 0.2, 0.3],
  suit: [0.1, 0.1, 1.3],
  uniform: [0.1, 0.1, 1.0],
  dress: [-0.05, -0.2, 0.2],
  apron: [0, 0, 0.3],
  overalls: [0, 0, 0.25],
};

/** Silhouette du buste (vêtement du haut), sens positif. */
export function torsoShape(ctx: Ctx, m: Metrics, top: TopKind): void {
  const d = TOP_DIMS[top];
  const sw = m.sw + d[0];
  const hw = m.hw + d[1];
  const len = m.torso + d[2];
  const belly = top === 'dress' ? m.belly * 0.8 : m.belly;
  ctx.moveTo(sw * 0.42, -0.15);
  ctx.quadraticCurveTo(sw, -0.25, sw, 1.1);
  if (belly > 0) ctx.quadraticCurveTo(hw + belly * 1.6, len * 0.5, hw, len);
  else ctx.lineTo(hw, len);
  ctx.lineTo(-hw, len);
  ctx.lineTo(-sw, 1.1);
  ctx.quadraticCurveTo(-sw, -0.25, -sw * 0.42, -0.15);
  ctx.closePath();
}

/** Bas du buste (pour la ligne de taille). */
export function torsoLen(m: Metrics, top: TopKind): number {
  return m.torso + TOP_DIMS[top][2];
}

/** Cou (repère du buste) : s'arrête au ras de l'encolure. */
export function neckShape(ctx: Ctx, m: Metrics): void {
  const s = m.s;
  ctx.rect(-0.62 * s - 0.15, -1.05 * s, 1.24 * s + 0.3, 1.05 * s + 0.1);
}

/** Capuche rabattue (repère du buste, derrière la tête). */
export function hoodShape(ctx: Ctx, m: Metrics): void {
  ell(ctx, -m.sw * 0.45, -0.9 * m.s, m.headR * 0.95, m.headR * 0.75, -0.3);
}

/** Pièce par-dessus le buste : bavette du tablier ou de la salopette et bretelles (couleur du haut). */
export function topOverlayShape(ctx: Ctx, m: Metrics, top: TopKind): boolean {
  const s = m.s;
  const T = m.torso;
  const sw = m.sw;
  const hw = m.hw;
  if (top === 'apron') {
    poly(ctx, [-sw * 0.5, 1.2 * s, sw * 0.62 + m.belly * 0.3, 1.2 * s, hw * 0.78 + m.belly * 1.1, T + 0.4, -hw * 0.7, T + 0.4]);
    poly(ctx, [-sw * 0.5, 1.25 * s, -0.75 * s, -0.3, -0.35 * s, -0.3, -sw * 0.32, 1.25 * s]);
    poly(ctx, [sw * 0.6, 1.25 * s, 0.75 * s, -0.3, 1.15 * s, -0.3, sw * 0.42, 1.25 * s]);
    return true;
  }
  if (top === 'overalls') {
    poly(ctx, [-sw * 0.55, 1.9 * s, sw * 0.6 + m.belly * 0.4, 1.9 * s, hw + m.belly * 0.6, T + 0.3, -hw, T + 0.3]);
    poly(ctx, [-sw * 0.55, 2.0 * s, -sw * 0.92, -0.1, -sw * 0.62, -0.1, -sw * 0.3, 2.0 * s]);
    poly(ctx, [sw * 0.35, 2.0 * s, sw * 0.55, -0.1, sw * 0.85, -0.1, sw * 0.68, 2.0 * s]);
    return true;
  }
  return false;
}

export function starShape(ctx: Ctx, cx: number, cy: number, r: number): void {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  poly(ctx, pts);
}

/* ----------------------------------------------------------------------------
 * Tête et cheveux (repère de la tête)
 * ------------------------------------------------------------------------- */

/** Visage : disque + nez. */
export function headShape(ctx: Ctx, r: number): void {
  circ(ctx, 0, 0, r);
  circ(ctx, 0.97 * r, 0.12 * r, 0.22 * r);
}

/** Cheveux derrière la tête (cheveux longs, queue de cheval, boucles, chignon). */
export function hairBackShape(ctx: Ctx, hair: HairStyle, hat: Hat, r: number): boolean {
  switch (hair) {
    case 'long':
      // sens positif : descend à l'avant, remonte à l'arrière
      ctx.moveTo(0.3 * r, 0.2 * r);
      ctx.lineTo(0.25 * r, 1.55 * r);
      ctx.quadraticCurveTo(-0.5 * r, 2.0 * r, -1.2 * r, 1.75 * r);
      ctx.bezierCurveTo(-1.25 * r, 0.6 * r, -1.35 * r, -0.95 * r, -0.2 * r, -1.02 * r);
      ctx.closePath();
      return true;
    case 'ponytail':
      if (hat === 'tophat' || hat === 'chef') return false;
      ctx.moveTo(-0.75 * r, -0.05 * r);
      ctx.bezierCurveTo(-1.05 * r, 0.0, -1.25 * r, 0.5 * r, -1.35 * r, 1.25 * r);
      ctx.bezierCurveTo(-1.75 * r, 0.6 * r, -1.9 * r, -0.7 * r, -0.7 * r, -0.65 * r);
      ctx.closePath();
      return true;
    case 'curly': {
      // couronne de boucles autour de la tête (disques, union sans trou)
      const n = 9;
      const R = 1.2 * r;
      const cy = -0.15 * r;
      circ(ctx, -0.1 * r, cy, R * 0.92);
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * 0.6 + (i / n) * Math.PI * 1.36;
        circ(ctx, Math.cos(a) * R - 0.1 * r, Math.sin(a) * R + cy, 0.4 * r);
      }
      return true;
    }
    case 'bun':
      if (hat !== 'none' && hat !== 'beret' && hat !== 'cap') return false;
      circ(ctx, -0.35 * r, -1.05 * r, 0.45 * r);
      return true;
  }
  return false;
}

/** Cheveux sur la tête (calotte, mèches, piques, couronne du chauve). */
export function hairFrontShape(ctx: Ctx, hair: HairStyle, hat: Hat, r: number): void {
  if (hair === 'bald') {
    // couronne à l'arrière du crâne
    ctx.moveTo(Math.cos(Math.PI * 0.62) * r * 1.03, Math.sin(Math.PI * 0.62) * r * 1.03);
    ctx.arc(0, 0, r * 1.03, Math.PI * 0.62, Math.PI * 1.12);
    ctx.arc(0, 0, r * 0.62, Math.PI * 1.08, Math.PI * 0.68, true);
    ctx.closePath();
    return;
  }
  if (hair === 'curly') {
    // calotte bouclée : bord extérieur rond, lisière festonnée sur le front
    ctx.moveTo(Math.cos(Math.PI * 0.78) * r * 1.12, Math.sin(Math.PI * 0.78) * r * 1.12);
    ctx.arc(0, 0, r * 1.12, Math.PI * 0.78, Math.PI * 1.88);
    curlyFringe(ctx, r, false);
    ctx.closePath();
    return;
  }
  // calotte commune (short, long, bun, ponytail, spiky)
  ctx.moveTo(Math.cos(Math.PI * 0.8) * r * 1.06, Math.sin(Math.PI * 0.8) * r * 1.06);
  ctx.arc(0, 0, r * 1.06, Math.PI * 0.8, Math.PI * 1.86);
  ctx.quadraticCurveTo(0.35 * r, -0.62 * r, -0.12 * r, -0.4 * r);
  ctx.quadraticCurveTo(-0.45 * r, 0.05 * r, -0.62 * r, 0.62 * r);
  ctx.closePath();
  if (hair === 'spiky' && hat === 'none') {
    const pts: number[] = [-0.95 * r, -0.4 * r];
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * 1.15 + (i / n) * Math.PI * 0.72;
      const a1 = Math.PI * 1.15 + ((i + 0.5) / n) * Math.PI * 0.72;
      pts.push(Math.cos(a0) * r, Math.sin(a0) * r, Math.cos(a1) * r * 1.55, Math.sin(a1) * r * 1.55);
    }
    pts.push(Math.cos(Math.PI * 1.87) * r, Math.sin(Math.PI * 1.87) * r, 0, -0.5 * r);
    poly(ctx, pts);
  }
  if (hair === 'long') {
    // mèche devant l'oreille
    poly(ctx, [-0.15 * r, -0.45 * r, 0.02 * r, 0.4 * r, -0.05 * r, 1.25 * r, -0.75 * r, 1.0 * r, -0.7 * r, -0.2 * r]);
  }
}

/** Points de la lisière des cheveux bouclés (de l'avant du front vers la nuque). */
const CURLY_LINE: readonly [number, number][] = [
  [Math.cos(Math.PI * 1.88) * 1.12, Math.sin(Math.PI * 1.88) * 1.12],
  [0.55, -0.62],
  [0.1, -0.5],
  [-0.3, -0.25],
  [-0.55, 0.15],
  [Math.cos(Math.PI * 0.78) * 1.12, Math.sin(Math.PI * 0.78) * 1.12],
];

/** Lisière festonnée (boucles qui retombent sur le front). moveFirst : nouveau sous-chemin. */
function curlyFringe(ctx: Ctx, r: number, moveFirst: boolean): void {
  const pts = CURLY_LINE;
  if (moveFirst) ctx.moveTo(pts[0][0] * r, pts[0][1] * r);
  else ctx.lineTo(pts[0][0] * r, pts[0][1] * r);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    // boucle : bombée vers le visage (centre du visage ≈ (0,3 ; 0,2))
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const dx = 0.3 - mx;
    const dy = 0.2 - my;
    const d = Math.hypot(dx, dy) || 1;
    ctx.quadraticCurveTo((mx + (dx / d) * 0.32) * r, (my + (dy / d) * 0.32) * r, bx * r, by * r);
  }
}

/** Contour intérieur des cheveux (lisière sur le front), pour la passe de contours. */
export function hairEdgeLine(ctx: Ctx, hair: HairStyle, r: number): void {
  if (hair === 'bald') {
    ctx.moveTo(Math.cos(Math.PI * 1.08) * r * 0.62, Math.sin(Math.PI * 1.08) * r * 0.62);
    ctx.arc(0, 0, r * 0.62, Math.PI * 1.08, Math.PI * 0.68, true);
    return;
  }
  if (hair === 'curly') {
    curlyFringe(ctx, r, true);
    return;
  }
  ctx.moveTo(Math.cos(Math.PI * 1.86) * r * 1.06, Math.sin(Math.PI * 1.86) * r * 1.06);
  ctx.quadraticCurveTo(0.35 * r, -0.62 * r, -0.12 * r, -0.4 * r);
  ctx.quadraticCurveTo(-0.45 * r, 0.05 * r, -0.62 * r, 0.62 * r);
  if (hair === 'long') {
    ctx.moveTo(-0.15 * r, -0.45 * r);
    ctx.lineTo(0.02 * r, 0.4 * r);
    ctx.lineTo(-0.05 * r, 1.25 * r);
  }
}

/** Barbe (couleur des cheveux), repère de la tête. */
export function beardShape(ctx: Ctx, r: number): void {
  ctx.moveTo(-0.25 * r, 0.05 * r);
  ctx.quadraticCurveTo(0.05 * r, 0.35 * r, 0.3 * r, 0.32 * r);
  ctx.quadraticCurveTo(0.65 * r, 0.12 * r, 1.0 * r, 0.32 * r);
  ctx.quadraticCurveTo(1.0 * r, 1.05 * r, 0.45 * r, 1.12 * r);
  ctx.quadraticCurveTo(-0.15 * r, 0.9 * r, -0.25 * r, 0.05 * r);
  ctx.closePath();
}

/** Moustache (repère de la tête). */
export function mustacheShape(ctx: Ctx, r: number): void {
  ctx.moveTo(0.38 * r, 0.33 * r);
  ctx.quadraticCurveTo(0.62 * r, 0.12 * r, 0.98 * r, 0.3 * r);
  ctx.quadraticCurveTo(1.07 * r, 0.5 * r, 0.9 * r, 0.44 * r);
  ctx.quadraticCurveTo(0.65 * r, 0.34 * r, 0.38 * r, 0.33 * r);
  ctx.closePath();
}

/** Masque de bandit : bandeau sombre et nœud derrière (repère de la tête). */
export function maskShape(ctx: Ctx, r: number): void {
  ctx.moveTo(-0.96 * r, -0.3 * r);
  ctx.quadraticCurveTo(0.2 * r, -0.42 * r, 1.08 * r, -0.36 * r);
  ctx.lineTo(1.06 * r, 0.16 * r);
  ctx.quadraticCurveTo(0.2 * r, 0.24 * r, -0.96 * r, 0.16 * r);
  ctx.closePath();
  poly(ctx, [-0.9 * r, -0.1 * r, -1.45 * r, -0.4 * r, -1.35 * r, 0.05 * r]);
  poly(ctx, [-0.9 * r, -0.05 * r, -1.35 * r, 0.45 * r, -1.1 * r, 0.5 * r]);
}

/** Position des yeux (repère de la tête). */
export const EYE = { x1: 0.28, x2: 0.74, y: -0.06 } as const;

/** Lunettes noires (verres), repère de la tête. */
export function sunglassesShape(ctx: Ctx, r: number): void {
  ell(ctx, EYE.x1 * r, (EYE.y + 0.02) * r, 0.29 * r, 0.22 * r);
  ell(ctx, (EYE.x2 + 0.02) * r, (EYE.y + 0.02) * r, 0.29 * r, 0.22 * r);
  ctx.rect(EYE.x1 * r, (EYE.y - 0.14) * r, (EYE.x2 - EYE.x1) * r, 0.08 * r);
}

/** Traits du visage (bouche, oreille, sourcils, lunettes…) à tracer d'un seul stroke fin. */
export function faceLines(ctx: Ctx, r: number, face: FaceDetail, emote: string): void {
  const ex1 = EYE.x1 * r;
  const ex2 = EYE.x2 * r;
  const ey = EYE.y * r;
  // oreille
  ctx.moveTo(-0.28 * r + 0.24 * r * Math.cos(-0.9), 0.12 * r + 0.24 * r * Math.sin(-0.9));
  ctx.arc(-0.28 * r, 0.12 * r, 0.24 * r, -0.9, 2.2);
  // yeux fermés / en croix
  if (emote === 'ko') {
    const d = 0.14 * r;
    for (const ex of [ex1, ex2]) {
      ctx.moveTo(ex - d, ey - d);
      ctx.lineTo(ex + d, ey + d);
      ctx.moveTo(ex + d, ey - d);
      ctx.lineTo(ex - d, ey + d);
    }
  } else if (emote === 'sleep') {
    ctx.moveTo(ex1 + 0.13 * r * Math.cos(0.2), ey + 0.13 * r * Math.sin(0.2));
    ctx.arc(ex1, ey, 0.13 * r, 0.2, Math.PI - 0.2);
    ctx.moveTo(ex2 + 0.13 * r * Math.cos(0.2), ey + 0.13 * r * Math.sin(0.2));
    ctx.arc(ex2, ey, 0.13 * r, 0.2, Math.PI - 0.2);
  }
  if (emote === 'angry') {
    ctx.moveTo(ex1 - 0.15 * r, ey - 0.35 * r);
    ctx.lineTo(ex1 + 0.18 * r, ey - 0.22 * r);
    ctx.moveTo(ex2 + 0.18 * r, ey - 0.35 * r);
    ctx.lineTo(ex2 - 0.15 * r, ey - 0.22 * r);
  }
  // bouche
  if (emote === 'exclaim' || emote === 'question' || emote === 'ko' || emote === 'sweat') {
    ctx.moveTo(0.72 * r, 0.52 * r);
    ctx.arc(0.62 * r, 0.52 * r, 0.1 * r, 0, TAU);
  } else if (emote === 'angry') {
    ctx.moveTo(0.62 * r + 0.18 * r * Math.cos(Math.PI + 0.5), 0.64 * r + 0.18 * r * Math.sin(Math.PI + 0.5));
    ctx.arc(0.62 * r, 0.64 * r, 0.18 * r, Math.PI + 0.5, -0.5);
  } else if (emote === 'sleep' || face === 'beard') {
    ctx.moveTo(0.5 * r, 0.52 * r);
    ctx.lineTo(0.74 * r, 0.52 * r);
  } else {
    ctx.moveTo(0.6 * r + 0.2 * r * Math.cos(0.5), 0.32 * r + 0.2 * r * Math.sin(0.5));
    ctx.arc(0.6 * r, 0.32 * r, 0.2 * r, 0.5, Math.PI - 0.5);
  }
  if (face === 'glasses') {
    const gr = 0.25 * r;
    ctx.moveTo(ex1 + gr, ey);
    ctx.arc(ex1, ey, gr, 0, TAU);
    ctx.moveTo(ex2 + gr, ey);
    ctx.arc(ex2, ey, gr, 0, TAU);
    ctx.moveTo(ex1 + gr, ey);
    ctx.lineTo(ex2 - gr, ey);
    ctx.moveTo(ex1 - gr, ey);
    ctx.lineTo(-0.3 * r, ey - 0.05 * r);
  } else if (face === 'sunglasses') {
    ctx.moveTo(ex1 - 0.27 * r, ey);
    ctx.lineTo(-0.3 * r, ey - 0.05 * r);
  }
}

/** Yeux (disques d'encre), sauf yeux cachés ou fermés. */
export function eyesShape(ctx: Ctx, r: number, face: FaceDetail, emote: string): void {
  if (emote === 'ko' || emote === 'sleep' || face === 'sunglasses' || face === 'mask') return;
  circ(ctx, EYE.x1 * r, EYE.y * r, 0.11 * r);
  circ(ctx, EYE.x2 * r, EYE.y * r, 0.11 * r);
}

/* ----------------------------------------------------------------------------
 * Chapeaux (repère de la tête)
 * ------------------------------------------------------------------------- */

/** Hauteur d'un chapeau au-dessus du sommet de la tête (pour placer la bulle). */
export function hatHeight(hat: string, r: number): number {
  switch (hat) {
    case 'tophat':
      return 1.85 * r;
    case 'chef':
      return 1.6 * r;
    case 'police':
      return 0.45 * r;
    case 'fedora':
      return 0.55 * r;
    case 'beanie':
      return 0.65 * r;
    case 'bowler':
      return 0.45 * r;
    default:
      return 0.25 * r;
  }
}

/** Silhouette complète du chapeau (union de ses parties, sens positif). */
export function hatShape(ctx: Ctx, hat: Hat, r: number): void {
  switch (hat) {
    case 'none':
      return;
    case 'cap':
      // calotte + visière vers l'avant
      ctx.moveTo(-1.05 * r, -0.2 * r);
      ctx.arc(0, -0.2 * r, 1.05 * r, Math.PI, 0);
      ctx.closePath();
      visorShape(ctx, r);
      return;
    case 'beret':
      // galette penchée vers l'arrière + queue
      ell(ctx, -0.18 * r, -0.82 * r, 1.3 * r, 0.44 * r, -0.14);
      ctx.rect(-0.28 * r, -1.46 * r, 0.24 * r, 0.32 * r);
      return;
    case 'bowler':
      // dôme rond + bord étroit et relevé
      ctx.moveTo(-0.86 * r, -0.66 * r);
      ctx.arc(0.0, -0.66 * r, 0.86 * r, Math.PI, 0);
      ctx.closePath();
      ell(ctx, 0.04 * r, -0.64 * r, 1.22 * r, 0.2 * r);
      return;
    case 'tophat':
      poly(ctx, [-0.8 * r, -0.62 * r, -0.86 * r, -2.75 * r, 0.9 * r, -2.75 * r, 0.84 * r, -0.62 * r]);
      ell(ctx, 0.02 * r, -0.62 * r, 1.36 * r, 0.22 * r);
      return;
    case 'beanie':
      // bonnet qui couvre le haut du crâne jusqu'au front, revers et pompon
      ctx.moveTo(-1.08 * r, -0.3 * r);
      ctx.arc(0, -0.3 * r, 1.08 * r, Math.PI, 0);
      ctx.closePath();
      ctx.rect(-1.12 * r, -0.62 * r, 2.24 * r, 0.42 * r);
      circ(ctx, 0, -1.48 * r, 0.34 * r);
      return;
    case 'fedora':
      // large bord incliné + calotte pincée
      ell(ctx, 0.1 * r, -0.58 * r, 1.62 * r, 0.26 * r, -0.05);
      ctx.moveTo(-0.85 * r, -0.62 * r);
      ctx.lineTo(-0.72 * r, -1.55 * r);
      ctx.quadraticCurveTo(0.05 * r, -1.28 * r, 0.75 * r, -1.6 * r);
      ctx.lineTo(0.88 * r, -0.62 * r);
      ctx.closePath();
      return;
    case 'helmet':
      // casque de chantier : dôme + large bord
      ctx.moveTo(-1.1 * r, -0.36 * r);
      ctx.arc(0, -0.36 * r, 1.1 * r, Math.PI, 0);
      ctx.closePath();
      poly(ctx, [-1.3 * r, -0.44 * r, 1.6 * r, -0.44 * r, 1.55 * r, -0.2 * r, -1.25 * r, -0.2 * r]);
      return;
    case 'chef':
      // toque : champignon de trois boules sur un bandeau
      circ(ctx, -0.55 * r, -1.6 * r, 0.66 * r);
      circ(ctx, 0.6 * r, -1.6 * r, 0.66 * r);
      circ(ctx, 0.02 * r, -1.95 * r, 0.74 * r);
      ctx.rect(-0.92 * r, -1.35 * r, 1.86 * r, 0.8 * r);
      return;
    case 'police':
      // képi : cylindre plat légèrement évasé + visière
      poly(ctx, [-0.95 * r, -0.45 * r, -1.05 * r, -1.4 * r, 1.12 * r, -1.4 * r, 1.0 * r, -0.45 * r]);
      policeVisor(ctx, r);
      return;
    case 'straw':
      // canotier : très large bord plat + calotte basse
      ell(ctx, 0.05 * r, -0.56 * r, 1.85 * r, 0.3 * r);
      poly(ctx, [-0.82 * r, -0.6 * r, -0.78 * r, -1.22 * r, 0.82 * r, -1.22 * r, 0.86 * r, -0.6 * r]);
      return;
  }
}

/**
 * Contour d'une union de disques et de rectangles, étoilée autour de (cx, cy) : lancer de rayons
 * (n directions), point le plus lointain encore dans l'union. Sert au contour de la toque.
 */
export function starUnion(
  ctx: Ctx,
  cx: number,
  cy: number,
  circles: readonly (readonly [number, number, number])[],
  rects: readonly (readonly [number, number, number, number])[],
  n = 48,
): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let tMax = 0;
    for (const [x, y, rr] of circles) {
      const ox = x - cx;
      const oy = y - cy;
      const b = dx * ox + dy * oy;
      const disc = b * b - (ox * ox + oy * oy) + rr * rr;
      if (disc >= 0) tMax = Math.max(tMax, b + Math.sqrt(disc));
    }
    for (const [x, y, w, h] of rects) {
      let t0 = -Infinity;
      let t1 = Infinity;
      for (const [o, d, lo, hi] of [
        [cx, dx, x, x + w],
        [cy, dy, y, y + h],
      ] as const) {
        if (Math.abs(d) < 1e-9) {
          if (o < lo || o > hi) t1 = -Infinity;
          continue;
        }
        const ta = (lo - o) / d;
        const tb = (hi - o) / d;
        t0 = Math.max(t0, Math.min(ta, tb));
        t1 = Math.min(t1, Math.max(ta, tb));
      }
      if (t1 >= Math.max(t0, 0)) tMax = Math.max(tMax, t1);
    }
    const px = cx + dx * tMax;
    const py = cy + dy * tMax;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Contour extérieur du chapeau (sans les traits intérieurs des formes qui se chevauchent). */
export function hatOutline(ctx: Ctx, hat: Hat, r: number): void {
  if (hat === 'chef') {
    starUnion(
      ctx,
      0.02 * r,
      -1.45 * r,
      [
        [-0.55 * r, -1.6 * r, 0.66 * r],
        [0.6 * r, -1.6 * r, 0.66 * r],
        [0.02 * r, -1.95 * r, 0.74 * r],
      ],
      [[-0.92 * r, -1.35 * r, 1.86 * r, 0.8 * r]],
      56,
    );
    return;
  }
  hatShape(ctx, hat, r);
}

function visorShape(ctx: Ctx, r: number): void {
  ctx.moveTo(0.55 * r, -0.26 * r);
  ctx.quadraticCurveTo(1.55 * r, -0.38 * r, 1.95 * r, -0.12 * r);
  ctx.lineTo(0.7 * r, -0.02 * r);
  ctx.closePath();
}

function policeVisor(ctx: Ctx, r: number): void {
  ctx.moveTo(0.35 * r, -0.5 * r);
  ctx.quadraticCurveTo(1.3 * r, -0.55 * r, 1.68 * r, -0.26 * r);
  ctx.lineTo(0.5 * r, -0.3 * r);
  ctx.closePath();
}

/** Lignes intérieures du chapeau (bord, bandeau) pour la passe de contour du chapeau. */
export function hatLines(ctx: Ctx, hat: Hat, r: number): void {
  switch (hat) {
    case 'cap':
      ctx.moveTo(0.55 * r, -0.26 * r);
      ctx.quadraticCurveTo(1.55 * r, -0.38 * r, 1.95 * r, -0.12 * r);
      ctx.moveTo(0, -1.25 * r);
      ctx.lineTo(0, -0.25 * r);
      return;
    case 'bowler':
    case 'fedora':
    case 'straw':
    case 'tophat':
      // ligne du bord sur la calotte
      ctx.moveTo(-0.85 * r, -0.62 * r);
      ctx.quadraticCurveTo(0, -0.5 * r, 0.88 * r, -0.62 * r);
      return;
    case 'beanie':
      ctx.moveTo(-1.12 * r, -0.62 * r);
      ctx.lineTo(1.12 * r, -0.62 * r);
      return;
    case 'helmet':
      ctx.moveTo(0, -1.45 * r);
      ctx.lineTo(0, -0.46 * r);
      ctx.moveTo(-1.1 * r, -0.44 * r);
      ctx.lineTo(1.1 * r, -0.44 * r);
      return;
    case 'chef':
      ctx.moveTo(-0.92 * r, -1.35 * r);
      ctx.lineTo(0.94 * r, -1.35 * r);
      ctx.moveTo(-0.15 * r, -1.4 * r);
      ctx.quadraticCurveTo(-0.1 * r, -1.8 * r, -0.4 * r, -2.05 * r);
      ctx.moveTo(0.25 * r, -1.4 * r);
      ctx.quadraticCurveTo(0.3 * r, -1.8 * r, 0.6 * r, -2.05 * r);
      return;
    case 'police':
      ctx.moveTo(-0.95 * r, -0.72 * r);
      ctx.lineTo(1.02 * r, -0.72 * r);
      return;
  }
}

/* ----------------------------------------------------------------------------
 * Boîtes englobantes approximatives (centre x, centre y, demi-largeur, demi-hauteur), en
 * unités du rayon de tête r : servent à « gonfler » chaque forme de l'épaisseur du contour
 * (sous-couche d'encre remplie au lieu d'être contournée, beaucoup plus rapide).
 * ------------------------------------------------------------------------- */

export type Box = readonly [number, number, number, number];

function boxOf(x0: number, y0: number, x1: number, y1: number): Box {
  return [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2];
}

export const HAT_BOX: Record<Exclude<Hat, 'none'>, Box> = {
  cap: boxOf(-1.05, -1.25, 1.95, -0.02),
  beret: boxOf(-1.48, -1.46, 1.12, -0.38),
  bowler: boxOf(-1.18, -1.52, 1.26, -0.44),
  tophat: boxOf(-1.34, -2.75, 1.38, -0.4),
  beanie: boxOf(-1.12, -1.82, 1.12, -0.2),
  fedora: boxOf(-1.52, -1.6, 1.72, -0.32),
  helmet: boxOf(-1.3, -1.46, 1.6, -0.2),
  chef: boxOf(-1.21, -2.69, 1.26, -0.55),
  police: boxOf(-1.05, -1.4, 1.68, -0.26),
  straw: boxOf(-1.8, -1.22, 1.9, -0.26),
};

export const HAIR_BACK_BOX: Partial<Record<HairStyle, Box>> = {
  long: boxOf(-1.32, -1.02, 0.3, 1.95),
  ponytail: boxOf(-1.85, -0.7, -0.7, 1.25),
  curly: boxOf(-1.78, -1.78, 1.4, 1.2),
  bun: boxOf(-0.8, -1.5, 0.1, -0.6),
};

export function hairFrontBox(hair: HairStyle, hat: Hat): Box {
  if (hair === 'spiky' && hat === 'none') return boxOf(-1.06, -1.55, 1.06, 0.65);
  if (hair === 'long') return boxOf(-1.06, -1.06, 1.06, 1.25);
  if (hair === 'curly') return boxOf(-1.12, -1.12, 1.12, 0.75);
  return boxOf(-1.08, -1.2, 1.08, 0.65);
}

export const BEARD_BOX: Box = boxOf(-0.25, 0.05, 1.0, 1.12);
export const MASK_BOX: Box = boxOf(-1.45, -0.42, 1.08, 0.5);

/** Boîte d'un polygone (liste plate). */
export function polyBox(pts: readonly number[]): Box {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    x0 = Math.min(x0, pts[i]);
    x1 = Math.max(x1, pts[i]);
    y0 = Math.min(y0, pts[i + 1]);
    y1 = Math.max(y1, pts[i + 1]);
  }
  return boxOf(x0, y0, x1, y1);
}

/** Boîte du buste (repère du buste). */
export function torsoBox(m: Metrics, top: TopKind): Box {
  const d = TOP_DIMS[top];
  const sw = m.sw + d[0];
  const len = m.torso + d[2];
  const belly = top === 'dress' ? m.belly * 0.8 : m.belly;
  return boxOf(-sw, -0.25, sw + belly * 0.8, len);
}
