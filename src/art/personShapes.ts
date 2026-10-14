// Formes des personnages, sous forme de « constructeurs de chemin » : chaque fonction AJOUTE des
// sous-chemins au chemin courant (sans beginPath ni fill). Le même chemin sert deux fois :
//   1) dans la sous-couche d'encre (toute la silhouette remplie + contournée en une seule fois),
//   2) pour l'aplat de couleur correspondant.
// Regrouper ainsi les tracés divise par trois le nombre d'opérations de dessin par personne.
//
// Repères : buste (origine = milieu des épaules, y vers la taille, x vers l'avant) ; tête
// (origine = centre de la tête, x vers l'avant / le regard).

import type { Hat } from '../types';
import { HAT_HEX, INK, MAT, COLOR_HEX, mix } from './palette';
import type { Metrics } from './skeleton';
import { TAU, type Ctx } from './util';

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

/** Sous-chemin polygone (liste plate). */
export function poly(ctx: Ctx, pts: readonly number[]): void {
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}

/* ----------------------------------------------------------------------------
 * Buste
 * ------------------------------------------------------------------------- */

/** Dimensions du vêtement du haut : [élargissement épaules, élargissement hanches, longueur sous la taille]. */
const TOP_DIMS: Record<string, [number, number, number]> = {
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

/** Silhouette du buste (vêtement du haut). */
export function torsoShape(ctx: Ctx, m: Metrics, top: string): void {
  const d = TOP_DIMS[top] ?? TOP_DIMS.tshirt;
  const sw = m.sw + d[0];
  const hw = m.hw + d[1];
  const len = m.torso + d[2];
  const belly = top === 'dress' ? m.belly * 0.8 : m.belly;
  ctx.moveTo(-sw * 0.42, -0.15);
  ctx.quadraticCurveTo(-sw, -0.25, -sw, 1.1);
  ctx.lineTo(-hw, len);
  ctx.lineTo(hw, len);
  if (belly > 0) ctx.quadraticCurveTo(hw + belly * 1.6, len * 0.5, sw, 1.1);
  else ctx.lineTo(sw, 1.1);
  ctx.quadraticCurveTo(sw, -0.25, sw * 0.42, -0.15);
  ctx.closePath();
}

/** Cou (repère du buste). */
export function neckShape(ctx: Ctx, m: Metrics): void {
  const s = m.s;
  ctx.rect(-0.62 * s - 0.15, -1.05 * s, 1.24 * s + 0.3, 0.95 * s);
}

/** Capuche (repère du buste, derrière la tête). */
export function hoodShape(ctx: Ctx, m: Metrics): void {
  ell(ctx, -m.sw * 0.45, -0.9 * m.s, m.headR * 0.95, m.headR * 0.75, -0.3);
}

/**
 * Détails du haut (au plus deux opérations). fine = niveau 0.
 * Le remplissage principal (couleur ou motif) est déjà fait.
 */
export function torsoDetails(ctx: Ctx, m: Metrics, top: string, c: { top: string; dark: string; light: string; sleeve: string; topColor: string }, fine: boolean): void {
  const s = m.s;
  const T = m.torso;
  const sw = m.sw;
  const hw = m.hw;
  switch (top) {
    case 'shirt': {
      if (!fine) return;
      ctx.fillStyle = c.light;
      ctx.beginPath();
      poly(ctx, [-0.9 * s, -0.2, 0.2, 1.0 * s, 1.3 * s, -0.2, 0.2, 0.35]);
      // patte de boutonnage
      ctx.rect(0.3, 1.0 * s, 0.25, T - 1.0 * s);
      ctx.fill();
      return;
    }
    case 'sweater': {
      ctx.fillStyle = c.dark;
      ctx.beginPath();
      ell(ctx, 0.1, -0.05, 1.15 * s, 0.5 * s);
      if (fine) ctx.rect(-hw - 0.1, T - 0.05, hw * 2 + 0.2 + m.belly * 0.3, 0.75);
      ctx.fill();
      return;
    }
    case 'hoodie': {
      ctx.fillStyle = c.dark;
      ctx.beginPath();
      if (fine) poly(ctx, [-hw * 0.55, T - 0.1, -hw * 0.4, T - 2.1 * s, hw * 0.65 + m.belly * 0.6, T - 2.1 * s, hw * 0.8 + m.belly * 0.6, T - 0.1]);
      // capuche rabattue derrière la tête et ouverture autour du cou
      hoodShape(ctx, m);
      ell(ctx, 0.1, -0.1, 1.3 * s, 0.55 * s);
      ctx.fill();
      return;
    }
    case 'coat': {
      ctx.fillStyle = c.dark;
      ctx.beginPath();
      poly(ctx, [-1.1 * s, -0.25, 0.3, 2.4 * s, 1.6 * s, -0.25, 0.9 * s, -0.4, 0.3, 1.2 * s, -0.4 * s, -0.4]);
      if (fine) ctx.rect(-hw - 0.15, T - 0.9, hw * 2 + 0.3 + m.belly * 0.5, 0.75);
      ctx.fill();
      return;
    }
    case 'suit': {
      ctx.fillStyle = '#fbf8f1';
      ctx.beginPath();
      poly(ctx, [-0.85 * s, -0.25, 0.35, 3.0 * s, 1.55 * s, -0.25]);
      ctx.fill();
      const tie = ['red', 'pink', 'orange', 'purple'].includes(c.topColor) ? COLOR_HEX.navy : COLOR_HEX.red;
      ctx.fillStyle = tie;
      ctx.beginPath();
      poly(ctx, [0.05, -0.1, 0.75, -0.1, 0.62, 0.45, 0.85, 2.6 * s, 0.4, 3.1 * s, -0.05, 2.6 * s, 0.2, 0.45]);
      ctx.fill();
      return;
    }
    case 'uniform': {
      ctx.fillStyle = INK;
      ctx.fillRect(-hw - 0.1, T - 0.75, hw * 2 + 0.2 + m.belly * 0.5, 0.8);
      ctx.fillStyle = MAT.gold;
      ctx.beginPath();
      ctx.rect(0.1, T - 0.8, 0.8, 0.9);
      ctx.rect(-sw - 0.1, 0.2, 1.5 * s, 0.6);
      ctx.rect(sw - 1.4 * s + 0.1, 0.2, 1.5 * s, 0.6);
      starShape(ctx, sw * 0.5 + 0.1, 2.0 * s, 0.85 * s + 0.15);
      ctx.fill();
      return;
    }
    case 'dress': {
      if (!fine) return;
      ctx.fillStyle = c.dark;
      ctx.fillRect(-hw + 0.2, T - 0.45, hw * 2 - 0.4 + m.belly * 0.3, 0.5);
      return;
    }
  }
}

/** Pièce de vêtement par-dessus le buste : bavette du tablier ou de la salopette (couleur du haut). */
export function topOverlayShape(ctx: Ctx, m: Metrics, top: string): boolean {
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
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
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
export function hairBackShape(ctx: Ctx, hair: string, hat: Hat, r: number): boolean {
  switch (hair) {
    case 'long':
      ctx.moveTo(-0.2 * r, -1.02 * r);
      ctx.bezierCurveTo(-1.35 * r, -0.95 * r, -1.25 * r, 0.6 * r, -1.2 * r, 1.75 * r);
      ctx.quadraticCurveTo(-0.5 * r, 2.0 * r, 0.25 * r, 1.55 * r);
      ctx.lineTo(0.3 * r, 0.2 * r);
      ctx.closePath();
      return true;
    case 'ponytail':
      if (hat === 'tophat' || hat === 'chef') return false;
      ctx.moveTo(-0.7 * r, -0.65 * r);
      ctx.bezierCurveTo(-1.9 * r, -0.7 * r, -1.75 * r, 0.6 * r, -1.35 * r, 1.25 * r);
      ctx.bezierCurveTo(-1.25 * r, 0.5 * r, -1.05 * r, 0.0, -0.75 * r, -0.05 * r);
      ctx.closePath();
      return true;
    case 'curly': {
      const n = 9;
      const R = 1.2 * r;
      const cy = -0.15 * r;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * 0.62 + (i / n) * Math.PI * 1.55;
        const px = Math.cos(a) * R - 0.1 * r;
        const py = Math.sin(a) * R + cy;
        if (i === 0) ctx.moveTo(px + Math.cos(a - 1.4) * 0.38 * r, py + Math.sin(a - 1.4) * 0.38 * r);
        ctx.arc(px, py, 0.38 * r, a - 1.4, a + 1.4);
      }
      ctx.closePath();
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
export function hairFrontShape(ctx: Ctx, hair: string, hat: Hat, r: number): void {
  if (hair === 'bald') {
    ctx.moveTo(Math.cos(Math.PI * 0.62) * r * 1.03, Math.sin(Math.PI * 0.62) * r * 1.03);
    ctx.arc(0, 0, r * 1.03, Math.PI * 0.62, Math.PI * 1.12);
    ctx.arc(0, 0, r * 0.62, Math.PI * 1.08, Math.PI * 0.68, true);
    ctx.closePath();
    return;
  }
  if (hair === 'curly') {
    ctx.moveTo(Math.cos(Math.PI * 0.95) * r * 1.08 - 0.05 * r, Math.sin(Math.PI * 0.95) * r * 1.08 - 0.12 * r);
    ctx.arc(-0.05 * r, -0.12 * r, r * 1.08, Math.PI * 0.95, Math.PI * 1.88);
    for (let i = 0; i < 3; i++) {
      const a = Math.PI * 1.85 - i * 0.32;
      ctx.arc(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85 + 0.15 * r, 0.32 * r, a + 1.3, a - 1.6, true);
    }
    ctx.closePath();
    return;
  }
  ctx.moveTo(Math.cos(Math.PI * 0.8) * r * 1.06, Math.sin(Math.PI * 0.8) * r * 1.06);
  ctx.arc(0, 0, r * 1.06, Math.PI * 0.8, Math.PI * 1.86);
  ctx.quadraticCurveTo(0.35 * r, -0.62 * r, -0.12 * r, -0.4 * r);
  ctx.quadraticCurveTo(-0.45 * r, 0.05 * r, -0.62 * r, 0.62 * r);
  ctx.closePath();
  if (hair === 'spiky' && hat === 'none') {
    ctx.moveTo(-0.95 * r, -0.4 * r);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * 1.15 + (i / n) * Math.PI * 0.72;
      const a1 = Math.PI * 1.15 + ((i + 0.5) / n) * Math.PI * 0.72;
      ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
      ctx.lineTo(Math.cos(a1) * r * 1.55, Math.sin(a1) * r * 1.55);
    }
    ctx.lineTo(Math.cos(Math.PI * 1.87) * r, Math.sin(Math.PI * 1.87) * r);
    ctx.lineTo(0, -0.5 * r);
    ctx.closePath();
  }
  if (hair === 'long') {
    ctx.moveTo(-0.15 * r, -0.45 * r);
    ctx.quadraticCurveTo(0.15 * r, 0.4 * r, -0.05 * r, 1.25 * r);
    ctx.lineTo(-0.75 * r, 1.0 * r);
    ctx.lineTo(-0.7 * r, -0.2 * r);
    ctx.closePath();
  }
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
      return 1.5 * r;
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

/** Silhouette complète du chapeau (union de ses parties). */
export function hatShape(ctx: Ctx, hat: Hat, r: number): void {
  switch (hat) {
    case 'cap':
      ctx.moveTo(-1.04 * r, -0.12 * r);
      ctx.arc(0, -0.12 * r, 1.04 * r, Math.PI, 0);
      ctx.closePath();
      visorShape(ctx, r);
      return;
    case 'beret':
      ell(ctx, -0.12 * r, -0.78 * r, 1.22 * r, 0.42 * r, -0.12);
      ctx.rect(-0.25 * r, -1.42 * r, 0.22 * r, 0.3 * r);
      return;
    case 'bowler':
      ctx.moveTo(-0.84 * r, -0.62 * r);
      ctx.arc(0.02 * r, -0.62 * r, 0.86 * r, Math.PI, 0);
      ctx.closePath();
      ell(ctx, 0.05 * r, -0.62 * r, 1.28 * r, 0.2 * r);
      return;
    case 'tophat':
      poly(ctx, [-0.78 * r, -0.62 * r, -0.86 * r, -2.75 * r, 0.9 * r, -2.75 * r, 0.82 * r, -0.62 * r]);
      ell(ctx, 0.02 * r, -0.62 * r, 1.32 * r, 0.22 * r);
      return;
    case 'beanie':
      ctx.moveTo(-1.07 * r, -0.2 * r);
      ctx.arc(0, -0.2 * r, 1.07 * r, Math.PI, 0);
      ctx.closePath();
      ctx.rect(-1.1 * r, -0.42 * r, 2.2 * r, 0.42 * r);
      circ(ctx, 0, -1.33 * r, 0.32 * r);
      return;
    case 'fedora':
      ell(ctx, 0.08 * r, -0.55 * r, 1.55 * r, 0.26 * r, -0.04);
      ctx.moveTo(-0.85 * r, -0.6 * r);
      ctx.lineTo(-0.72 * r, -1.5 * r);
      ctx.quadraticCurveTo(0.05 * r, -1.25 * r, 0.75 * r, -1.55 * r);
      ctx.lineTo(0.88 * r, -0.6 * r);
      ctx.closePath();
      return;
    case 'helmet':
      ctx.moveTo(-1.08 * r, -0.32 * r);
      ctx.arc(0, -0.32 * r, 1.08 * r, Math.PI, 0);
      ctx.closePath();
      poly(ctx, [-1.25 * r, -0.4 * r, 1.55 * r, -0.4 * r, 1.5 * r, -0.18 * r, -1.2 * r, -0.18 * r]);
      return;
    case 'chef':
      circ(ctx, -0.5 * r, -1.55 * r, 0.62 * r);
      circ(ctx, 0.55 * r, -1.55 * r, 0.62 * r);
      circ(ctx, 0.02 * r, -1.85 * r, 0.7 * r);
      ctx.rect(-0.92 * r, -1.25 * r, 1.86 * r, 0.7 * r);
      return;
    case 'police':
      poly(ctx, [-0.95 * r, -0.45 * r, -1.0 * r, -1.35 * r, 1.08 * r, -1.35 * r, 1.0 * r, -0.45 * r]);
      policeVisor(ctx, r);
      return;
    case 'straw':
      ell(ctx, 0.05 * r, -0.55 * r, 1.78 * r, 0.32 * r);
      ctx.moveTo(-0.8 * r, -0.6 * r);
      ctx.lineTo(-0.75 * r, -1.2 * r);
      ctx.quadraticCurveTo(0, -1.32 * r, 0.8 * r, -1.2 * r);
      ctx.lineTo(0.85 * r, -0.6 * r);
      ctx.closePath();
      return;
  }
}

function visorShape(ctx: Ctx, r: number): void {
  ctx.moveTo(0.55 * r, -0.2 * r);
  ctx.quadraticCurveTo(1.5 * r, -0.32 * r, 1.85 * r, -0.08 * r);
  ctx.lineTo(0.7 * r, 0.02 * r);
  ctx.closePath();
}

function policeVisor(ctx: Ctx, r: number): void {
  ctx.moveTo(0.35 * r, -0.5 * r);
  ctx.quadraticCurveTo(1.3 * r, -0.55 * r, 1.65 * r, -0.28 * r);
  ctx.lineTo(0.5 * r, -0.3 * r);
  ctx.closePath();
}

/** Couleurs du chapeau : aplat principal + détails (bande, visière…). */
export function hatPaint(ctx: Ctx, hat: Hat, r: number, fine: boolean, lw: number): void {
  if (hat === 'none') return;
  ctx.fillStyle = HAT_HEX[hat];
  ctx.beginPath();
  hatShape(ctx, hat, r);
  ctx.fill();
  switch (hat) {
    case 'cap':
      ctx.fillStyle = mix(HAT_HEX.cap, INK, 0.3);
      ctx.beginPath();
      visorShape(ctx, r);
      ctx.fill();
      return;
    case 'bowler':
      if (fine) {
        ctx.fillStyle = '#5a4e48';
        ctx.fillRect(-0.84 * r, -0.92 * r, 1.72 * r, 0.18 * r);
      }
      return;
    case 'tophat':
      ctx.fillStyle = '#9b2f3a';
      ctx.fillRect(-0.8 * r, -1.08 * r, 1.64 * r, 0.36 * r);
      return;
    case 'beanie':
      ctx.fillStyle = mix(HAT_HEX.beanie, INK, 0.22);
      ctx.beginPath();
      ctx.rect(-1.1 * r, -0.42 * r, 2.2 * r, 0.42 * r);
      ctx.fill();
      ctx.fillStyle = '#fbf3e6';
      ctx.beginPath();
      circ(ctx, 0, -1.33 * r, 0.3 * r);
      ctx.fill();
      return;
    case 'fedora':
      ctx.fillStyle = '#2f2622';
      ctx.fillRect(-0.84 * r, -0.92 * r, 1.7 * r, 0.3 * r);
      return;
    case 'helmet':
      if (fine) {
        ctx.lineWidth = lw * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -1.38 * r);
        ctx.lineTo(0, -0.42 * r);
        ctx.moveTo(-1.2 * r, -0.4 * r);
        ctx.lineTo(1.5 * r, -0.4 * r);
        ctx.stroke();
      }
      return;
    case 'chef':
      if (fine) {
        ctx.lineWidth = lw * 0.7;
        ctx.beginPath();
        ctx.moveTo(-0.92 * r, -1.25 * r);
        ctx.lineTo(0.94 * r, -1.25 * r);
        ctx.moveTo(-0.15 * r, -1.3 * r);
        ctx.quadraticCurveTo(-0.1 * r, -1.75 * r, -0.4 * r, -2.0 * r);
        ctx.moveTo(0.25 * r, -1.3 * r);
        ctx.quadraticCurveTo(0.3 * r, -1.75 * r, 0.6 * r, -2.0 * r);
        ctx.stroke();
      }
      return;
    case 'police':
      ctx.fillStyle = '#1c1a1a';
      ctx.beginPath();
      policeVisor(ctx, r);
      ctx.rect(-0.95 * r, -0.72 * r, 1.97 * r, 0.24 * r);
      ctx.fill();
      ctx.fillStyle = MAT.gold;
      ctx.beginPath();
      circ(ctx, 0.45 * r, -1.0 * r, 0.22 * r);
      ctx.fill();
      return;
    case 'straw':
      ctx.fillStyle = COLOR_HEX.red;
      ctx.fillRect(-0.79 * r, -0.86 * r, 1.63 * r, 0.24 * r);
      return;
  }
}
