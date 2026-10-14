// Arbres : boule (round), conifère (pine), peuplier (poplar), arbre nu (bare).
// Ancre = pied du tronc. Hauteur totale = e.size ; largeur = size × TREE_WIDTH_RATIO.

import type { TreeEntity } from '../types';
import { TREE_WIDTH_RATIO } from './bounds';
import type { Lod } from './lod';
import { INK, MAT, mix } from './palette';
import { TAU, type Ctx, groundShadow, quickRand, seedOf } from './util';

const GREENS = [
  ['#7fae5a', '#5d8b43', '#a1c674'],
  ['#6da352', '#4f803b', '#91bd6c'],
  ['#8cb35c', '#688f40', '#accd7a'],
  ['#74a865', '#55864a', '#98c487'],
] as const;
const PINES = [
  ['#3f7650', '#2b5a3a', '#5b9268'],
  ['#457d55', '#305f40', '#62996e'],
] as const;

export function drawTree(ctx: Ctx, e: TreeEntity, lod: Lod): void {
  const x = e.x;
  const y = e.y - (e.z ?? 0);
  const size = e.size;
  const w = size * TREE_WIDTH_RATIO[e.tree];
  const seed = seedOf(e.id);
  const g = GREENS[seed % GREENS.length];
  const p = PINES[seed % PINES.length];

  if (lod === 2) {
    // tache de couleur
    ctx.fillStyle = e.tree === 'pine' ? p[0] : e.tree === 'bare' ? '#9b8064' : g[0];
    ctx.beginPath();
    if (e.tree === 'pine') {
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + w / 2, y - size * 0.12);
      ctx.lineTo(x - w / 2, y - size * 0.12);
    } else if (e.tree === 'poplar') ctx.ellipse(x, y - size * 0.55, w / 2, size * 0.44, 0, 0, TAU);
    else if (e.tree === 'bare') ctx.ellipse(x, y - size * 0.62, w * 0.4, size * 0.3, 0, 0, TAU);
    else ctx.arc(x, y - size + w / 2, w / 2, 0, TAU);
    ctx.fill();
    return;
  }

  const fine = lod === 0;
  const ol = fine ? 0.6 : 0.9;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = ol;
  groundShadow(ctx, x + w * 0.08, y, Math.max(3, w * 0.42), Math.max(1.2, Math.min(3, size * 0.05)));

  switch (e.tree) {
    case 'round':
      drawRound(ctx, x, y, size, w, g, seed, fine);
      return;
    case 'pine':
      drawPine(ctx, x, y, size, w, p, fine);
      return;
    case 'poplar':
      drawPoplar(ctx, x, y, size, w, g, seed, fine);
      return;
    case 'bare':
      drawBare(ctx, x, y, size, w, seed, fine, ol);
      return;
  }
}

function trunk(ctx: Ctx, x: number, y: number, top: number, tw: number): void {
  ctx.fillStyle = MAT.trunk;
  ctx.beginPath();
  ctx.moveTo(x - tw * 0.65, y + 0.2);
  ctx.quadraticCurveTo(x - tw * 0.45, y - 1, x - tw * 0.4, y - 2);
  ctx.lineTo(x - tw * 0.32, top);
  ctx.lineTo(x + tw * 0.32, top);
  ctx.lineTo(x + tw * 0.4, y - 2);
  ctx.quadraticCurveTo(x + tw * 0.45, y - 1, x + tw * 0.65, y + 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Contour festonné : n bosses de rayon rb sur un cercle (ou une ellipse) de rayon rr. */
function scallop(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, rb: number, rnd: () => number): void {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2;
    const jitter = 0.85 + rnd() * 0.25;
    const bx = cx + Math.cos(a) * rx;
    const by = cy + Math.sin(a) * ry;
    ctx.arc(bx, by, rb * jitter, a - 1.25, a + 1.25);
  }
  ctx.closePath();
}

function drawRound(ctx: Ctx, x: number, y: number, size: number, w: number, g: readonly string[], seed: number, fine: boolean): void {
  const outer = w / 2 + 1.2;
  const rb = outer * 0.3;
  const rr = outer - rb;
  const cy = y - size + outer;
  trunk(ctx, x, y, cy + rr * 0.3, Math.max(2.4, size * 0.075));
  const rnd = quickRand(seed);
  ctx.fillStyle = g[0];
  scallop(ctx, x, cy, rr, rr * 0.95, 9, rb, rnd);
  ctx.fill();
  ctx.stroke();
  // ombre propre en bas à droite
  ctx.fillStyle = g[1];
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(x + rr * 0.25, cy + rr * 0.3, rr * 0.75, -0.2, Math.PI * 0.9);
  ctx.quadraticCurveTo(x, cy + rr * 0.1, x + rr * 0.95, cy + rr * 0.05);
  ctx.fill();
  ctx.globalAlpha = 1;
  // lumière en haut à gauche
  ctx.fillStyle = g[2];
  ctx.beginPath();
  ctx.ellipse(x - rr * 0.32, cy - rr * 0.38, rr * 0.38, rr * 0.26, -0.5, 0, TAU);
  ctx.fill();
  if (fine) {
    // touches de feuillage
    ctx.strokeStyle = g[1];
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = rnd() * TAU;
      const d = rnd() * rr * 0.75;
      const px = x + Math.cos(a) * d;
      const py = cy + Math.sin(a) * d * 0.9;
      ctx.moveTo(px - 1.1, py);
      ctx.quadraticCurveTo(px, py + 1.1, px + 1.1, py);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
  }
}

function drawPoplar(ctx: Ctx, x: number, y: number, size: number, w: number, g: readonly string[], seed: number, fine: boolean): void {
  const rx = w / 2 + 1;
  const ry = size * 0.43;
  const cy = y - size + ry + 0.6;
  trunk(ctx, x, y, cy + ry * 0.6, Math.max(2, size * 0.05));
  const rnd = quickRand(seed);
  ctx.fillStyle = g[1];
  ctx.beginPath();
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2;
    const bx = x + Math.cos(a) * (rx - 1.4);
    const by = cy + Math.sin(a) * (ry - 1.4);
    ctx.arc(bx, by, 1.6 + rnd() * 0.4, a - 1.3, a + 1.3);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = g[0];
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.2, cy - ry * 0.05, rx * 0.55, ry * 0.8, 0, 0, TAU);
  ctx.fill();
  if (fine) {
    ctx.strokeStyle = g[1];
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const py = cy - ry * 0.7 + (i / 5) * ry * 1.4;
      const px = x + (rnd() - 0.5) * rx;
      ctx.moveTo(px - 0.9, py);
      ctx.quadraticCurveTo(px, py + 0.9, px + 0.9, py);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
  }
}

function drawPine(ctx: Ctx, x: number, y: number, size: number, w: number, p: readonly string[], fine: boolean): void {
  const base = y - size * 0.12;
  trunk(ctx, x, y, base - 1, Math.max(2, size * 0.05));
  const tiers = size > 45 ? 4 : 3;
  const top = y - size + 0.5;
  const span = base - top;
  for (let i = 0; i < tiers; i++) {
    // étage i : du haut vers le bas, chaque étage plus large
    const t0 = top + (span * i) / (tiers + 0.6);
    const t1 = top + (span * (i + 1.6)) / (tiers + 0.6);
    const hw = (w / 2) * (0.45 + (0.55 * (i + 1)) / tiers);
    ctx.fillStyle = p[0];
    ctx.beginPath();
    ctx.moveTo(x, t0);
    ctx.quadraticCurveTo(x + hw * 0.4, t0 + (t1 - t0) * 0.5, x + hw, t1);
    // bord inférieur dentelé
    const teeth = 4;
    for (let k = teeth; k >= 0; k--) {
      const px = x - hw + (2 * hw * k) / teeth;
      ctx.lineTo(px, t1 - (k % 2 === 0 ? 0 : 1.4));
    }
    ctx.quadraticCurveTo(x - hw * 0.4, t0 + (t1 - t0) * 0.5, x, t0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // flanc éclairé
    ctx.fillStyle = p[2];
    ctx.beginPath();
    ctx.moveTo(x - 0.3, t0 + 1.2);
    ctx.quadraticCurveTo(x - hw * 0.35, t0 + (t1 - t0) * 0.55, x - hw * 0.7, t1 - 1.6);
    ctx.lineTo(x - hw * 0.2, t1 - 1.8);
    ctx.closePath();
    ctx.globalAlpha = fine ? 0.8 : 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawBare(ctx: Ctx, x: number, y: number, size: number, w: number, seed: number, fine: boolean, ol: number): void {
  const rnd = quickRand(seed);
  const half = w / 2 - 0.5;
  const top = y - size + 0.8;
  const trunkTop = y - size * 0.45;
  const bark = MAT.trunk;
  const barkDark = mix(MAT.trunk, INK, 0.35);
  // branches (récursif, déterministe), bornées à l'emprise
  const segs: number[][] = [];
  const grow = (x0: number, y0: number, ang: number, len: number, wid: number, depth: number) => {
    let x1 = x0 + Math.sin(ang) * len;
    let y1 = y0 - Math.cos(ang) * len;
    x1 = Math.max(x - half, Math.min(x + half, x1));
    y1 = Math.max(top, y1);
    segs.push([x0, y0, x1, y1, wid]);
    if (depth <= 0 || wid < 0.35) return;
    const n = depth > 2 ? 2 : 2 + (rnd() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * (0.55 + rnd() * 0.25);
      grow(x1, y1, ang + spread + (rnd() - 0.5) * 0.3, len * (0.62 + rnd() * 0.15), wid * 0.62, depth - 1);
    }
  };
  const tw = Math.max(2.2, size * 0.07);
  grow(x, trunkTop + 2, -0.15 + rnd() * 0.3, size * 0.22, tw * 0.7, fine ? 4 : 3);
  // tronc
  trunk(ctx, x, y, trunkTop, tw);
  // branches : contour d'encre puis écorce
  ctx.lineCap = 'round';
  for (const pass of [0, 1]) {
    ctx.strokeStyle = pass === 0 ? INK : bark;
    for (const [x0, y0, x1, y1, wd] of segs) {
      ctx.lineWidth = pass === 0 ? wd + ol * 1.4 : wd;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }
  if (fine) {
    ctx.strokeStyle = barkDark;
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.1, y - 2);
    ctx.lineTo(x - tw * 0.05, trunkTop + 3);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = ol;
}
