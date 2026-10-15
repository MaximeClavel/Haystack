// Vie des bâtiments : détails d'ambiance posés sur les façades et les toits (gouttières, lierre,
// pots de fleurs, linge, chat à la fenêtre, antennes, lucarnes de toit, fumée, salissures…).
//
// Le plan (quoi, où) est calculé UNE fois par bâtiment à partir de sa graine, avec un générateur
// distinct de celui du plan de façade : ajouter un détail ne change ni les fenêtres ni les portes.
// Tout reste dans l'emprise du bâtiment (jamais au-dessus de L.topLimit, jamais au-delà des murs).
//
// Prudence avec les indices : un lieu remarquable (`lm.*`) portant des détails d'enquête (`features` :
// fenêtre brisée, affiches…) ne reçoit que les détails de toit et les salissures. Sur les bâtiments
// ordinaires, le décor évite les emplacements des détails de façade (graffiti, affiche, balcon, porte
// ouverte) et n'occupe que des fenêtres « normales » : aucun indice n'est jamais recouvert.
// Les styles spéciaux (église, gare, musée…) ne sont pas décorés.

import type { BuildingStyle } from '../types';
import type { Layout } from './building';
import type { Lod } from './lod';
import { INK, MAT, mix } from './palette';
import { TAU, type Ctx, quickRand } from './util';

const DECORATED = new Set<BuildingStyle>(['house', 'townhouse', 'apartment', 'shop', 'cafe', 'bakery', 'jeweler', 'pharmacy', 'bar', 'postoffice']);
const RESIDENTIAL = new Set<BuildingStyle>(['house', 'townhouse', 'apartment']);

interface LaundryItem {
  x: number;
  color: string;
  kind: 0 | 1 | 2;
}

export interface DecorPlan {
  drain?: number;
  ivy?: { x: number; dir: 1 | -1; h: number; autumn: boolean; seed: number };
  pots: { x: number; flower: string; big: boolean }[];
  lamp?: { x: number; y: number };
  cat?: { x: number; y: number; w: number; color: string; dark: string; flip: boolean };
  laundry?: { x0: number; x1: number; y: number; items: LaundryItem[] };
  antenna?: { x: number; y: number; dish: boolean };
  skylights: { x: number; y: number; w: number; h: number }[];
  /** Oiseaux posés sur le faîtage (x, y du ventre). */
  birds: { x: number; y: number; flip: boolean; tone: number }[];
  /** Enseigne en drapeau à l'angle du commerce (plaque + emblème). */
  blade?: { x: number; y: number; s: number; icon: 'bretzel' | 'cup' | 'book' | 'flower' };
  smoke: { x: number; y: number }[];
  patches: { x: number; y: number; w: number; h: number; light: boolean }[];
  streaks: { x: number; y: number; len: number }[];
  /** Les détails de façade sont-ils permis (pas d'indice d'enquête sur ce bâtiment) ? */
  facade: boolean;
}

const EMPTY: DecorPlan = { pots: [], skylights: [], birds: [], smoke: [], patches: [], streaks: [], facade: false };

const LINEN = ['#f4efe4', '#bcd4e6', '#f0c9d2', '#f2e0a0', '#c9dbb8', '#e7d6c4'];
const FLOWERS = ['#e2463d', '#f19bb8', '#f0cb3f', '#fbf6ea', '#c279c9'];
const CATS: [string, string][] = [
  ['#2e2a29', '#1a1716'],
  ['#8f9296', '#6c6f73'],
  ['#f2eee6', '#cfc8ba'],
];

/** Plan des détails d'un bâtiment (appelé une fois, en fin de calcul du plan de façade). */
export function planDecor(L: Layout): DecorPlan {
  const e = L.e;
  if (!DECORATED.has(e.style)) return EMPTY;
  const r = quickRand((e.seed * 40503 + 977) >>> 0 || 1);
  const feats = e.features ?? [];
  const landmark = e.id.startsWith('lm.');
  const plan: DecorPlan = { pots: [], skylights: [], birds: [], smoke: [], patches: [], streaks: [], facade: !landmark || feats.length === 0 };
  // façade encombrée : on laisse la porte et les murs à leurs détails (graffiti, affiche, balcon, porte ouverte)
  const clutter = feats.some((f) => f.kind === 'graffiti' || f.kind === 'poster' || f.kind === 'balcony' || f.kind === 'openDoor');
  const resid = RESIDENTIAL.has(e.style);
  const pitched = L.roof === 'tiles' || L.roof === 'slate' || L.roof === 'zinc';
  const { x0, x1, W } = L;

  // --- salissures du mur : plaques de crépi plus claires ou plus sombres, traces de pluie sous les appuis
  if (L.wallTex === 'plain' && W >= 24) {
    const n = Math.min(4, 1 + Math.floor(W / 40));
    for (let i = 0; i < n; i++) {
      const w = 5 + r() * 9;
      const h = 4 + r() * 8;
      plan.patches.push({ x: x0 + 2 + r() * Math.max(1, W - w - 4), y: L.facadeTop + L.cornice + 2 + r() * Math.max(1, L.H - L.cornice - h - 6), w, h, light: r() < 0.5 });
    }
  }
  for (const w of L.windows) {
    if (w.state !== 'normal' || r() > 0.4) continue;
    const y = w.y + w.h + 1.2;
    const len = Math.min(4 + r() * 6, L.yS - 2.2 - y); // jamais au-delà du soubassement
    if (len >= 2) plan.streaks.push({ x: w.x + w.w * (0.2 + r() * 0.6), y, len });
  }

  // --- gouttière sur un des bords de la façade
  if (L.roof !== 'flat' || r() < 0.4) if (r() < 0.55 && W >= 30) plan.drain = r() < 0.5 ? x0 + 1.3 : x1 - 1.3;

  // --- toit : antenne ou parabole, lucarnes de toit, fumée
  if (pitched) {
    const ry = L.roofTop + L.D * 0.42;
    if (r() < 0.3 && W >= 40) {
      const ax = x0 + L.hip + 6 + r() * Math.max(1, W - 2 * L.hip - 12);
      const busy = L.chimneys.some((c) => ax > c.x - 5 && ax < c.x + c.w + 5);
      if (!busy) plan.antenna = { x: ax, y: ry + 0.5, dish: r() < 0.4 };
    }
    const southH = L.facadeTop - ry;
    if (southH > 14 && W >= 50 && r() < 0.4) {
      const n = W > 110 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const w = 6;
        const h = 4.2;
        const sx = x0 + L.hip + (W - 2 * L.hip) * ((i + 0.5) / n) - w / 2 + (r() - 0.5) * 8;
        const sy = ry + southH * (0.28 + r() * 0.25);
        const hitDormer = L.dormers.some((d) => Math.abs(d - (sx + w / 2)) < 9) && sy + h > L.facadeTop - 12;
        const hitChim = L.chimneys.some((c) => sx < c.x + c.w + 3 && sx + w > c.x - 3 && sy < c.y + 3 && sy + h > c.y - c.h - 3);
        if (!hitDormer && !hitChim) plan.skylights.push({ x: sx, y: sy, w, h });
      }
    }
  }
  if (pitched && W >= 44 && r() < 0.2) {
    const ry = L.roofTop + L.D * 0.42;
    const n = 1 + Math.floor(r() * 2.4);
    const bx = x0 + L.hip + 8 + r() * Math.max(1, W - 2 * L.hip - 24);
    for (let i = 0; i < n; i++) {
      const x = bx + i * (4 + r() * 3);
      const free = !L.chimneys.some((c) => x > c.x - 4 && x < c.x + c.w + 4) && !(plan.antenna && Math.abs(plan.antenna.x - x) < 5);
      if (free && x < x1 - L.hip - 4) plan.birds.push({ x, y: ry, flip: r() < 0.5, tone: Math.floor(r() * 3) });
    }
  }
  for (const c of L.chimneys) {
    const top = c.y - c.h - 1.4;
    if (top - L.topLimit >= 10 && r() < 0.35) plan.smoke.push({ x: c.x + c.w / 2, y: top });
  }

  if (!plan.facade) return plan;

  // --- façade résidentielle : lierre / vigne vierge, pots de fleurs, lanterne, linge, chat
  const door = L.doors[0];
  if (resid && door && !L.shop && !clutter) {
    if (r() < 0.4) {
      const dx = door.x + door.w / 2;
      for (const px of [door.x - 3.4, door.x + door.w + 3.4]) {
        if (px > x0 + 2 && px < x1 - 2 && r() < 0.8) plan.pots.push({ x: px, flower: FLOWERS[Math.floor(r() * FLOWERS.length)], big: r() < 0.4 });
      }
      void dx;
    }
    if (r() < 0.22) plan.lamp = { x: door.x + door.w + 2.2 + (plan.pots.some((p) => p.x > door.x + door.w) ? 3.6 : 0), y: L.yS - door.h - 1.5 };
    if (r() < 0.16 && W >= 36 && L.H >= 30) {
      const dir: 1 | -1 = door.x + door.w / 2 > x0 + W / 2 ? -1 : 1;
      plan.ivy = { x: dir === 1 ? x0 + 0.5 : x1 - 0.5, dir, h: L.H * (0.45 + r() * 0.4), autumn: r() < 0.5, seed: Math.floor(r() * 1e6) };
    }
  }
  // enseigne en drapeau des commerces : bretzel (boulangerie), tasse (café), livre, fleur
  if (L.shop && !clutter && L.floors >= 2) {
    const icon = e.style === 'bakery' ? 'bretzel' : e.style === 'cafe' ? 'cup' : L.shop.goods === 'books' ? 'book' : L.shop.goods === 'flowers' ? 'flower' : undefined;
    if (icon) {
      const sz = 8;
      const cy = L.yS - L.gfH - sz / 2 - 2.2;
      const tryX = [x1 - sz / 2 - 3, x0 + sz / 2 + 3];
      if (plan.drain !== undefined && plan.drain > x0 + W / 2) tryX.reverse();
      for (const cx of tryX) {
        const hit = L.windows.some((w) => cx + sz / 2 + 1 > w.x && cx - sz / 2 - 1 < w.x + w.w && cy + sz / 2 + 1 > w.y && cy - sz / 2 - 1 < w.y + w.h);
        const hitDrain = plan.drain !== undefined && Math.abs(plan.drain - cx) < sz / 2 + 2;
        if (!hit && !hitDrain && cy - sz / 2 > L.facadeTop + L.cornice + 1) {
          plan.blade = { x: cx, y: cy, s: sz, icon };
          break;
        }
      }
    }
  }
  if (resid && L.floors >= 2) {
    // linge entre deux fenêtres voisines du premier étage
    if (r() < 0.12) {
      const row = L.windows.filter((w) => w.y < L.yS - L.gfH - 1 && w.y > L.yS - L.gfH - L.upH - 1 && w.state === 'normal' && !w.flowers).sort((a, b) => a.x - b.x);
      for (let i = 0; i + 1 < row.length; i++) {
        const a = row[i];
        const b = row[i + 1];
        const gap = b.x - (a.x + a.w);
        if (gap < 7 || gap > 20) continue;
        const n = Math.max(2, Math.floor((gap - 2) / 3.6));
        const items: LaundryItem[] = [];
        for (let k = 0; k < n; k++) items.push({ x: (k + 0.7) / (n + 0.4), color: LINEN[Math.floor(r() * LINEN.length)], kind: Math.floor(r() * 3) as 0 | 1 | 2 });
        plan.laundry = { x0: a.x + a.w + 0.6, x1: b.x - 0.6, y: a.y + 2, items };
        break;
      }
    }
    // chat sur le rebord d'une fenêtre sans fleurs ni rideau
    if (r() < 0.1) {
      const cand = L.windows.filter((w) => w.state === 'normal' && !w.flowers && !w.curtain && !w.arched && w.w >= 6.5 && w.y < L.yS - L.gfH - 1);
      if (cand.length) {
        const w = cand[Math.floor(r() * cand.length)];
        const [color, dark] = CATS[Math.floor(r() * CATS.length)];
        plan.cat = { x: w.x + w.w * (0.3 + r() * 0.4), y: w.y + w.h - 0.9, w: Math.min(3.2, w.w * 0.42), color, dark, flip: r() < 0.5 };
      }
    }
  }
  return plan;
}

/* ----------------------------------------------------------------------------
 * Dessin
 * ------------------------------------------------------------------------- */

/** Mur : plaques de crépi, traces de pluie (juste après le mur, avant les fenêtres). */
export function drawWallDecor(ctx: Ctx, L: Layout, lod: Lod): void {
  const d = L.decor;
  if (!d || lod !== 0) return;
  if (d.patches.length) {
    // taches de crépi : de grandes ellipses très douces (jamais de bords nets)
    ctx.fillStyle = 'rgba(70, 45, 30, 0.05)';
    ctx.beginPath();
    for (const p of d.patches) {
      if (p.light) continue;
      ctx.moveTo(p.x + p.w, p.y + p.h / 2);
      ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, 0, 0, TAU);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 252, 240, 0.16)';
    ctx.beginPath();
    for (const p of d.patches) {
      if (!p.light) continue;
      ctx.moveTo(p.x + p.w, p.y + p.h / 2);
      ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, 0, 0, TAU);
    }
    ctx.fill();
  }
  if (d.streaks.length) {
    ctx.strokeStyle = 'rgba(60, 45, 35, 0.1)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    for (const s of d.streaks) {
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + 0.3, s.y + s.len);
    }
    ctx.stroke();
    ctx.lineCap = 'round';
  }
}

/** Détails de toit (juste après le toit) : lucarnes de toit, antenne, fumée. */
export function drawRoofDecor(ctx: Ctx, L: Layout, lod: Lod, lw: number): void {
  const d = L.decor;
  if (!d || lod === 2) return;
  if (lod === 1) {
    // niveau 1 : un simple point lumineux pour les lucarnes de toit
    if (d.skylights.length) {
      ctx.fillStyle = 'rgba(170, 205, 220, 0.9)';
      ctx.beginPath();
      for (const s of d.skylights) ctx.rect(s.x, s.y, s.w, s.h);
      ctx.fill();
    }
    return;
  }
  ctx.lineWidth = lw * 0.7;
  for (const s of d.skylights) {
    ctx.fillStyle = '#4a4440';
    ctx.fillRect(s.x - 0.7, s.y - 0.7, s.w + 1.4, s.h + 1.4);
    ctx.fillStyle = MAT.glass;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(s.x + 0.8, s.y + s.h - 0.4);
    ctx.lineTo(s.x + 2.6, s.y + 0.4);
    ctx.lineTo(s.x + 3.6, s.y + 0.4);
    ctx.lineTo(s.x + 1.8, s.y + s.h - 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeRect(s.x - 0.7, s.y - 0.7, s.w + 1.4, s.h + 1.4);
    ctx.beginPath();
    ctx.moveTo(s.x + s.w / 2, s.y);
    ctx.lineTo(s.x + s.w / 2, s.y + s.h);
    ctx.stroke();
  }
  for (const b of d.birds) {
    const sx = b.flip ? -1 : 1;
    const tone = b.tone === 0 ? '#8e9296' : b.tone === 1 ? '#b3a99a' : '#d8d3c8';
    ctx.fillStyle = tone;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y - 1.35, 1.9, 1.25, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x + sx * 1.7, b.y - 2.7, 0.85, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d99a3a';
    ctx.beginPath();
    ctx.moveTo(b.x + sx * 2.4, b.y - 2.8);
    ctx.lineTo(b.x + sx * 3.3, b.y - 2.55);
    ctx.lineTo(b.x + sx * 2.4, b.y - 2.35);
    ctx.fill();
    // queue
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(b.x - sx * 1.7, b.y - 1.4);
    ctx.lineTo(b.x - sx * 3.0, b.y - 0.7);
    ctx.stroke();
  }
  const a = d.antenna;
  if (a) {
    const top = Math.max(L.topLimit + 0.5, a.y - 9);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x, top);
    ctx.stroke();
    ctx.strokeStyle = '#a7acb0';
    ctx.lineWidth = 0.45;
    ctx.stroke();
    if (a.dish) {
      // parabole : coupelle grise inclinée vers le sud-est
      ctx.fillStyle = '#d6d9db';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(a.x + 1.2, top + 1.8, 2.8, 2.2, -0.5, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#9aa0a4';
      ctx.beginPath();
      ctx.ellipse(a.x + 1.6, top + 2.1, 0.8, 0.7, -0.5, 0, TAU);
      ctx.fill();
    } else {
      // antenne râteau : trois barres de longueurs décroissantes
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const y = top + 1 + k * 2.1;
        const hw = 3.4 - k * 0.7;
        ctx.moveTo(a.x - hw, y);
        ctx.lineTo(a.x + hw, y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#a7acb0';
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }
    ctx.strokeStyle = INK;
  }
  if (d.smoke.length) {
    ctx.strokeStyle = 'rgba(70, 58, 50, 0.3)';
    ctx.lineWidth = 0.35;
    for (const s of d.smoke) {
      const puffs: [number, number, number][] = [
        [0.4, -2.2, 1.3],
        [1.9, -4.5, 1.8],
        [3.7, -7.0, 2.3],
      ];
      for (const [dx, dy, r] of puffs) {
        ctx.fillStyle = 'rgba(244, 241, 236, 0.9)';
        ctx.beginPath();
        ctx.arc(s.x + dx, s.y + dy, r, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.strokeStyle = INK;
  }
  ctx.lineWidth = lw;
}

/** Façade : gouttière, lierre, pots, lanterne, linge, chat (après le contenu de façade). */
export function drawFacadeDecor(ctx: Ctx, L: Layout, lod: Lod): void {
  const d = L.decor;
  if (!d || lod === 2) return;
  const fine = lod === 0;
  if (d.drain !== undefined) {
    const x = d.drain;
    const y0 = L.facadeTop + L.cornice;
    const y1 = L.yS - 1.8;
    ctx.strokeStyle = INK;
    ctx.lineWidth = fine ? 1.5 : 1.7;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.strokeStyle = '#9ca3a8';
    ctx.lineWidth = fine ? 0.8 : 0.9;
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (let y = y0 + 10; y < y1 - 4; y += 16) {
        ctx.moveTo(x - 0.95, y);
        ctx.lineTo(x + 0.95, y);
      }
      ctx.moveTo(x - 1.0, y1 - 2.4);
      ctx.lineTo(x + 1.0, y1 - 2.4);
      ctx.stroke();
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK;
  }
  if (!fine) return;
  if (d.blade) drawBlade(ctx, d.blade);
  if (d.ivy) drawIvy(ctx, L, d.ivy);
  for (const p of d.pots) drawPot(ctx, p.x, L.yS, p.flower, p.big);
  if (d.lamp) {
    const { x, y } = d.lamp;
    ctx.fillStyle = 'rgba(255, 224, 140, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y + 1.4, 3.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#34302e';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.rect(x - 0.9, y - 0.4, 1.8, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = MAT.lamp;
    ctx.fillRect(x - 0.55, y + 0.3, 1.1, 1.6);
    ctx.lineWidth = 0.6;
  }
  const lau = d.laundry;
  if (lau) {
    // corde en demi-courbe et pièces de linge qui pendent
    const sag = 1.6;
    const wlen = lau.x1 - lau.x0;
    const yAt = (t: number): number => lau.y + sag * 4 * t * (1 - t);
    ctx.strokeStyle = '#6b5a4a';
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(lau.x0, lau.y);
    ctx.quadraticCurveTo((lau.x0 + lau.x1) / 2, lau.y + sag * 2, lau.x1, lau.y);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.3;
    for (const it of lau.items) {
      const x = lau.x0 + wlen * it.x;
      const y = yAt(it.x);
      ctx.fillStyle = it.color;
      ctx.beginPath();
      if (it.kind === 0) {
        // chemise
        ctx.moveTo(x - 1.3, y);
        ctx.lineTo(x + 1.3, y);
        ctx.lineTo(x + 1.3, y + 2.6);
        ctx.lineTo(x - 1.3, y + 2.6);
      } else if (it.kind === 1) {
        // pantalon
        ctx.moveTo(x - 1, y);
        ctx.lineTo(x + 1, y);
        ctx.lineTo(x + 1.1, y + 3);
        ctx.lineTo(x + 0.15, y + 3);
        ctx.lineTo(x, y + 1.2);
        ctx.lineTo(x - 0.15, y + 3);
        ctx.lineTo(x - 1.1, y + 3);
      } else {
        // petite serviette
        ctx.moveTo(x - 1.6, y);
        ctx.lineTo(x + 1.6, y);
        ctx.lineTo(x + 1.4, y + 2.1);
        ctx.lineTo(x - 1.4, y + 2.1);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.lineWidth = 0.6;
  }
  const c = d.cat;
  if (c) drawWindowCat(ctx, c);
}

function drawPot(ctx: Ctx, x: number, yBase: number, flower: string, big: boolean): void {
  const w = big ? 3.4 : 2.6;
  const h = big ? 3 : 2.3;
  ctx.fillStyle = 'rgba(70, 48, 30, 0.2)';
  ctx.beginPath();
  ctx.ellipse(x + 0.8, yBase + 0.2, w * 0.7, 0.7, 0, 0, TAU);
  ctx.fill();
  // feuillage derrière le pot
  ctx.fillStyle = '#5d9448';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.arc(x - 0.7, yBase - h - 1.1, w * 0.46, 0, TAU);
  ctx.arc(x + 0.8, yBase - h - 1.3, w * 0.5, 0, TAU);
  ctx.arc(x, yBase - h - 2.2, w * 0.42, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = flower;
  ctx.beginPath();
  ctx.arc(x - 0.8, yBase - h - 1.4, 0.55, 0, TAU);
  ctx.arc(x + 0.9, yBase - h - 1.9, 0.55, 0, TAU);
  ctx.arc(x + 0.1, yBase - h - 2.8, 0.55, 0, TAU);
  ctx.fill();
  // pot en terre cuite
  ctx.fillStyle = '#b9673f';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, yBase - h);
  ctx.lineTo(x + w / 2, yBase - h);
  ctx.lineTo(x + w * 0.36, yBase);
  ctx.lineTo(x - w * 0.36, yBase);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#cf8458';
  ctx.fillRect(x - w / 2 - 0.15, yBase - h - 0.2, w + 0.3, 0.8);
  ctx.lineWidth = 0.6;
}

function drawWindowCat(ctx: Ctx, c: NonNullable<DecorPlan['cat']>): void {
  const s = c.w / 3.2;
  const dir = c.flip ? -1 : 1;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(dir * s, s);
  ctx.fillStyle = c.color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.3 / s;
  // queue enroulée
  ctx.beginPath();
  ctx.moveTo(-1.2, -0.2);
  ctx.quadraticCurveTo(-3.0, -0.4, -2.4, -2.0);
  ctx.stroke();
  // corps assis
  ctx.beginPath();
  ctx.moveTo(-1.6, 0);
  ctx.quadraticCurveTo(-1.8, -2.6, 0, -3.0);
  ctx.quadraticCurveTo(1.4, -2.8, 1.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // tête et oreilles
  ctx.beginPath();
  ctx.arc(0.5, -3.9, 1.15, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-0.55, -4.5);
  ctx.lineTo(-0.4, -5.7);
  ctx.lineTo(0.3, -4.95);
  ctx.moveTo(0.7, -4.95);
  ctx.lineTo(1.4, -5.7);
  ctx.lineTo(1.6, -4.4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = c.dark === '#1a1716' ? '#f0d060' : INK;
  ctx.fillRect(0.0, -4.1, 0.35, 0.35);
  ctx.fillRect(0.85, -4.1, 0.35, 0.35);
  ctx.restore();
}

/** Lierre ou vigne vierge rougissante : grappes de feuilles qui montent le long d'un bord du mur. */
function drawIvy(ctx: Ctx, L: Layout, v: NonNullable<DecorPlan['ivy']>): void {
  const r = quickRand(v.seed || 1);
  const dark = v.autumn ? '#8f2f26' : '#3f6e3a';
  const mid = v.autumn ? '#c2492f' : '#5c9446';
  const light = v.autumn ? '#e08a3c' : '#86bd58';
  const base = L.yS - 2;
  const top = base - v.h;
  const blobs: number[] = [];
  let x = v.x;
  for (let y = base; y > top; y -= 1.7) {
    const t = (base - y) / v.h;
    x += (r() - 0.5) * 2.2;
    x = Math.max(L.x0 + 1, Math.min(L.x1 - 1, x));
    const reach = (1 - t * 0.65) * 9;
    const n = 2 + Math.floor(r() * 2.4);
    for (let k = 0; k < n; k++) {
      const off = r() * reach * v.dir;
      blobs.push(Math.max(L.x0 + 0.5, Math.min(L.x1 - 0.5, x + off)), y + (r() - 0.5) * 1.8, 1.5 + r() * 1.7 * (1 - t * 0.4));
    }
  }
  for (const [col, shift] of [
    [dark, 0.35],
    [mid, 0],
    [light, -0.45],
  ] as const) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < blobs.length; i += 3) {
      const rr = blobs[i + 2] * (col === dark ? 1.15 : col === mid ? 0.9 : 0.55);
      const cx = blobs[i] + shift * (col === light ? -0.6 : 0.4);
      const cy = blobs[i + 1] + shift;
      ctx.moveTo(cx + rr, cy);
      ctx.arc(cx, cy, rr, 0, TAU);
    }
    ctx.fill();
    if (col === dark) {
      ctx.strokeStyle = mix(INK, '#2f3a22', 0.3);
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.6;
}

/** Enseigne en drapeau : plaque crème bordée de sombre et emblème du commerce. */
function drawBlade(ctx: Ctx, b: NonNullable<DecorPlan['blade']>): void {
  const { x, y, s, icon } = b;
  const h = s / 2;
  ctx.fillStyle = '#f7f0dd';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.rect(x - h, y - h, s, s);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 0.3;
  ctx.strokeStyle = '#7a5a43';
  ctx.strokeRect(x - h + 0.7, y - h + 0.7, s - 1.4, s - 1.4);
  ctx.strokeStyle = INK;
  switch (icon) {
    case 'bretzel': {
      // anneau brun et nœud
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.ellipse(x, y + 0.3, 2.5, 1.9, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = '#b9763a';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 1.5, y + 0.2);
      ctx.quadraticCurveTo(x, y - 1.8, x + 1.5, y + 0.2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = '#b9763a';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = '#fbf6ea';
      ctx.beginPath();
      ctx.arc(x - 2.4, y - 0.5, 0.25, 0, TAU);
      ctx.arc(x + 2.5, y + 0.6, 0.25, 0, TAU);
      ctx.fill();
      break;
    }
    case 'cup': {
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(x - 2.2, y - 0.2);
      ctx.lineTo(x + 1.8, y - 0.2);
      ctx.quadraticCurveTo(x + 1.6, y + 2.6, x - 0.2, y + 2.6);
      ctx.quadraticCurveTo(x - 2.0, y + 2.6, x - 2.2, y - 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 2.0, y + 0.9, 0.95, -1.3, 1.3);
      ctx.stroke();
      ctx.fillStyle = '#7a4a2a';
      ctx.fillRect(x - 1.9, y - 0.05, 3.5, 0.55);
      ctx.strokeStyle = '#8a7a6a';
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(x - 0.9, y - 1.0);
      ctx.quadraticCurveTo(x - 1.6, y - 1.8, x - 0.9, y - 2.6);
      ctx.moveTo(x + 0.5, y - 1.0);
      ctx.quadraticCurveTo(x - 0.2, y - 1.8, x + 0.5, y - 2.6);
      ctx.stroke();
      break;
    }
    case 'book': {
      ctx.lineWidth = 0.4;
      ctx.fillStyle = '#c93c35';
      ctx.beginPath();
      ctx.moveTo(x, y - 1.6);
      ctx.lineTo(x - 2.7, y - 2.2);
      ctx.lineTo(x - 2.7, y + 1.9);
      ctx.lineTo(x, y + 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x, y - 1.6);
      ctx.lineTo(x + 2.7, y - 2.2);
      ctx.lineTo(x + 2.7, y + 1.9);
      ctx.lineTo(x, y + 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#8a7a6a';
      ctx.lineWidth = 0.25;
      ctx.beginPath();
      for (const dy of [-0.6, 0.4, 1.3]) {
        ctx.moveTo(x + 0.6, y + dy);
        ctx.lineTo(x + 2.2, y + dy - 0.3);
      }
      ctx.stroke();
      break;
    }
    case 'flower': {
      ctx.strokeStyle = '#3f7a3a';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y + 0.4);
      ctx.lineTo(x, y + 3.1);
      ctx.stroke();
      ctx.fillStyle = '#4f9a48';
      ctx.beginPath();
      ctx.ellipse(x + 1.1, y + 2.0, 1.1, 0.5, -0.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#e2638f';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.3;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 1.35, y - 1.0 + Math.sin(a) * 1.35, 1.0, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#f0cb3f';
      ctx.beginPath();
      ctx.arc(x, y - 1.0, 0.75, 0, TAU);
      ctx.fill();
      break;
    }
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.6;
}
