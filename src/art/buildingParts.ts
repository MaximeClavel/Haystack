// Éléments de façade réutilisables : fenêtres (dessinées par lots), portes, vitrines, auvents,
// enseignes, horloges, colonnes, frontons, drapeaux, cheminées.
// Toutes les coordonnées sont en unités monde (pas de transformation).

import type { Lod } from './lod';
import { INK, MAT, mix } from './palette';
import { awningShape } from './props';
import { SERIF_STACK, fitText } from './text';
import { TAU, type Ctx, boxFS, circleFS, polyFS } from './util';

export type WinState = 'normal' | 'open' | 'broken' | 'lit';

export interface Win {
  x: number;
  y: number;
  w: number;
  h: number;
  state: WinState;
  arched?: boolean;
  flowers?: boolean;
  curtain?: string;
  bars?: boolean;
}

export interface WinStyle {
  frame: string;
  shutter?: string;
  muntins: boolean;
  sill: boolean;
}

/** Contour d'une fenêtre (rectangle ou cintrée). */
function winPath(ctx: Ctx, x: number, y: number, w: number, h: number, arched: boolean | undefined): void {
  if (!arched) {
    ctx.rect(x, y, w, h);
    return;
  }
  const r = w / 2;
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

/**
 * Dessine une série de fenêtres en regroupant les tracés (un fill par couche) : rapide même
 * pour un grand immeuble.
 */
export function drawWindows(ctx: Ctx, wins: readonly Win[], st: WinStyle, lod: Lod, lw: number): void {
  if (wins.length === 0) return;
  if (lod === 2) {
    ctx.fillStyle = '#6f7f88';
    ctx.beginPath();
    for (const w of wins) ctx.rect(w.x, w.y, w.w, w.h);
    ctx.fill();
    return;
  }
  const fine = lod === 0;
  ctx.lineWidth = lw * 0.7;
  // volets
  if (st.shutter) {
    ctx.fillStyle = st.shutter;
    ctx.beginPath();
    for (const w of wins) {
      const sw = w.w * 0.48;
      ctx.rect(w.x - sw - 0.25, w.y + (w.arched ? w.w * 0.35 : 0), sw, w.h - (w.arched ? w.w * 0.35 : 0));
      ctx.rect(w.x + w.w + 0.25, w.y + (w.arched ? w.w * 0.35 : 0), sw, w.h - (w.arched ? w.w * 0.35 : 0));
    }
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = mix(st.shutter, INK, 0.35);
      ctx.lineWidth = 0.22;
      ctx.beginPath();
      for (const w of wins) {
        const sw = w.w * 0.48;
        const y0 = w.y + (w.arched ? w.w * 0.35 : 0);
        for (let yy = y0 + 1.2; yy < w.y + w.h - 0.4; yy += 1.3) {
          ctx.moveTo(w.x - sw - 0.05, yy);
          ctx.lineTo(w.x - 0.45, yy);
          ctx.moveTo(w.x + w.w + 0.45, yy);
          ctx.lineTo(w.x + w.w + sw + 0.05, yy);
        }
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = lw * 0.7;
    }
  }
  // cadres
  ctx.fillStyle = st.frame;
  ctx.beginPath();
  for (const w of wins) winPath(ctx, w.x, w.y, w.w, w.h, w.arched);
  ctx.fill();
  ctx.stroke();
  // vitres
  const g = Math.min(0.8, w0(wins) * 0.12);
  const glassPath = (pred: (w: Win) => boolean) => {
    ctx.beginPath();
    for (const w of wins) if (pred(w)) winPath(ctx, w.x + g, w.y + g, w.w - 2 * g, w.h - 2 * g, w.arched);
  };
  ctx.fillStyle = MAT.glass;
  glassPath((w) => w.state === 'normal' || w.state === 'broken');
  ctx.fill();
  if (wins.some((w) => w.state === 'lit')) {
    ctx.fillStyle = MAT.litGlass;
    glassPath((w) => w.state === 'lit');
    ctx.fill();
  }
  if (wins.some((w) => w.state === 'open')) {
    ctx.fillStyle = MAT.interior;
    glassPath((w) => w.state === 'open');
    ctx.fill();
  }
  if (fine) {
    // reflets diagonaux
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.beginPath();
    for (const w of wins) {
      if (w.state !== 'normal') continue;
      const x0 = w.x + g;
      const y1 = w.y + w.h - g;
      const d = Math.min(w.w * 0.5, w.h * 0.4);
      ctx.moveTo(x0, y1 - d * 0.4);
      ctx.lineTo(x0 + d * 0.9, y1 - d * 1.6);
      ctx.lineTo(x0 + d * 1.25, y1 - d * 1.6);
      ctx.lineTo(x0, y1 - d * 0.05);
      ctx.closePath();
    }
    ctx.fill();
    // rideaux
    for (const w of wins) {
      if (!w.curtain || w.state === 'open') continue;
      ctx.fillStyle = w.curtain;
      const x0 = w.x + g;
      const x1 = w.x + w.w - g;
      const y0 = w.y + g + (w.arched ? w.w * 0.3 : 0);
      const ch = (w.h - 2 * g) * 0.55;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + w.w * 0.3, y0);
      ctx.quadraticCurveTo(x0 + w.w * 0.12, y0 + ch * 0.5, x0, y0 + ch);
      ctx.closePath();
      ctx.moveTo(x1, y0);
      ctx.lineTo(x1 - w.w * 0.3, y0);
      ctx.quadraticCurveTo(x1 - w.w * 0.12, y0 + ch * 0.5, x1, y0 + ch);
      ctx.closePath();
      ctx.fill();
    }
  }
  // petits bois
  if (st.muntins) {
    ctx.strokeStyle = st.frame;
    ctx.lineWidth = Math.max(0.35, wins[0].w * 0.07);
    ctx.beginPath();
    for (const w of wins) {
      if (w.state === 'open') continue;
      const cx = w.x + w.w / 2;
      ctx.moveTo(cx, w.y + g);
      ctx.lineTo(cx, w.y + w.h - g);
      const hy = w.y + (w.arched ? w.w * 0.5 : w.h * 0.42);
      ctx.moveTo(w.x + g, hy);
      ctx.lineTo(w.x + w.w - g, hy);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw * 0.7;
  }
  // barreaux
  if (wins.some((w) => w.bars)) {
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    for (const w of wins) {
      if (!w.bars) continue;
      for (let bx = w.x + w.w / 4; bx < w.x + w.w - 0.1; bx += w.w / 4) {
        ctx.moveTo(bx, w.y + g);
        ctx.lineTo(bx, w.y + w.h - g);
      }
    }
    ctx.stroke();
    ctx.lineWidth = lw * 0.7;
  }
  // appuis
  if (st.sill) {
    ctx.fillStyle = MAT.stoneLight;
    ctx.beginPath();
    for (const w of wins) ctx.rect(w.x - 0.8, w.y + w.h, w.w + 1.6, Math.max(0.8, w.h * 0.07));
    ctx.fill();
    if (fine) ctx.stroke();
  }
  // états particuliers
  for (const w of wins) {
    if (w.state === 'open') openCasements(ctx, w, st.frame);
    else if (w.state === 'broken') cracks(ctx, w.x + g, w.y + g, w.w - 2 * g, w.h - 2 * g, fine);
    else if (w.state === 'lit' && fine) {
      ctx.fillStyle = MAT.litGlassLight;
      ctx.beginPath();
      ctx.ellipse(w.x + w.w / 2, w.y + w.h * 0.55, w.w * 0.25, w.h * 0.22, 0, 0, TAU);
      ctx.fill();
    }
    if (w.flowers && fine) flowerBox(ctx, w.x - 0.4, w.y + w.h + 0.8, w.w + 0.8);
  }
  ctx.lineWidth = lw;
}

function w0(wins: readonly Win[]): number {
  return wins[0].w;
}

function openCasements(ctx: Ctx, w: Win, frame: string): void {
  // deux battants ouverts vers l'extérieur
  const k = w.w * 0.36;
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.moveTo(w.x, w.y);
  ctx.lineTo(w.x - k, w.y + 1.2);
  ctx.lineTo(w.x - k, w.y + w.h - 0.6);
  ctx.lineTo(w.x, w.y + w.h);
  ctx.closePath();
  ctx.moveTo(w.x + w.w, w.y);
  ctx.lineTo(w.x + w.w + k, w.y + 1.2);
  ctx.lineTo(w.x + w.w + k, w.y + w.h - 0.6);
  ctx.lineTo(w.x + w.w, w.y + w.h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = MAT.glassLight;
  ctx.beginPath();
  ctx.moveTo(w.x - 0.4, w.y + 0.9);
  ctx.lineTo(w.x - k + 0.5, w.y + 1.9);
  ctx.lineTo(w.x - k + 0.5, w.y + w.h - 1.2);
  ctx.lineTo(w.x - 0.4, w.y + w.h - 0.7);
  ctx.closePath();
  ctx.moveTo(w.x + w.w + 0.4, w.y + 0.9);
  ctx.lineTo(w.x + w.w + k - 0.5, w.y + 1.9);
  ctx.lineTo(w.x + w.w + k - 0.5, w.y + w.h - 1.2);
  ctx.lineTo(w.x + w.w + 0.4, w.y + w.h - 0.7);
  ctx.closePath();
  ctx.fill();
}

/** Vitre brisée : trou sombre et fissures en étoile. */
export function cracks(ctx: Ctx, x: number, y: number, w: number, h: number, fine: boolean): void {
  const cx = x + w * 0.42;
  const cy = y + h * 0.45;
  ctx.fillStyle = MAT.interior;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.22, cy - h * 0.05);
  ctx.lineTo(cx - w * 0.05, cy - h * 0.2);
  ctx.lineTo(cx + w * 0.18, cy - h * 0.12);
  ctx.lineTo(cx + w * 0.1, cy + h * 0.06);
  ctx.lineTo(cx + w * 0.22, cy + h * 0.18);
  ctx.lineTo(cx - w * 0.06, cy + h * 0.14);
  ctx.closePath();
  ctx.fill();
  const lw = ctx.lineWidth;
  ctx.lineWidth = fine ? 0.25 : 0.45;
  ctx.beginPath();
  const rays = 7;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU + 0.3;
    const r = Math.min(w, h) * (0.45 + (i % 3) * 0.12);
    const ex = Math.max(x, Math.min(x + w, cx + Math.cos(a) * r));
    const ey = Math.max(y, Math.min(y + h, cy + Math.sin(a) * r));
    ctx.moveTo(cx + Math.cos(a) * w * 0.15, cy + Math.sin(a) * h * 0.12);
    ctx.lineTo((cx + ex) / 2 + Math.sin(a) * 0.5, (cy + ey) / 2 - Math.cos(a) * 0.5);
    ctx.lineTo(ex, ey);
  }
  ctx.stroke();
  // éclats au sol
  if (fine) {
    ctx.fillStyle = MAT.glassLight;
    ctx.beginPath();
    ctx.moveTo(cx - 1, y + h + 1.6);
    ctx.lineTo(cx, y + h + 1.0);
    ctx.lineTo(cx + 0.6, y + h + 1.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.lineWidth = lw;
}

function flowerBox(ctx: Ctx, x: number, y: number, w: number): void {
  boxFS(ctx, x, y, w, 1.2, '#9a6a43');
  const cols = ['#e2463d', '#f19bb8', '#f0cb3f', '#fbf6ea'];
  ctx.fillStyle = MAT.foliage;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const fx = x + 0.8 + (i * (w - 1.6)) / 3;
    ctx.moveTo(fx + 0.8, y - 0.1);
    ctx.arc(fx, y - 0.1, 0.8, 0, TAU);
  }
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    ctx.arc(x + 0.8 + (i * (w - 1.6)) / 3 + 0.2, y - 0.7, 0.45, 0, TAU);
    ctx.fill();
  }
}

/** Porte (pleine ou ouverte), avec imposte vitrée éventuelle. */
export function drawDoor(
  ctx: Ctx,
  x: number,
  yBottom: number,
  w: number,
  h: number,
  color: string,
  open: boolean,
  lod: Lod,
  opts: { arched?: boolean; transom?: boolean; double?: boolean; glass?: boolean } = {},
): void {
  const y = yBottom - h;
  const fine = lod === 0;
  // encadrement
  ctx.fillStyle = MAT.stoneLight;
  ctx.beginPath();
  winPath(ctx, x - 0.9, y - 0.9, w + 1.8, h + 0.9, opts.arched);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = open ? MAT.interior : color;
  ctx.beginPath();
  winPath(ctx, x, y, w, h, opts.arched);
  ctx.fill();
  ctx.stroke();
  if (open) {
    // battant ouvert vers l'intérieur (en perspective)
    const k = w * 0.32;
    polyFS(ctx, [x, y + 0.2, x + k, y + 1.6, x + k, yBottom - 0.4, x, yBottom], color);
    if (fine) {
      ctx.fillStyle = 'rgba(255, 220, 150, 0.25)';
      ctx.fillRect(x + k + 0.4, yBottom - h * 0.5, w - k - 0.8, h * 0.5 - 0.2);
    }
    return;
  }
  if (!fine) return;
  ctx.lineWidth = 0.28;
  if (opts.double) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + (opts.arched ? w / 2 : 0));
    ctx.lineTo(x + w / 2, yBottom);
    ctx.stroke();
  }
  if (opts.glass) {
    ctx.fillStyle = MAT.glass;
    const gy = y + (opts.arched ? w * 0.5 : 1.2);
    if (opts.double) {
      ctx.fillRect(x + 0.9, gy, w / 2 - 1.6, h * 0.42);
      ctx.fillRect(x + w / 2 + 0.7, gy, w / 2 - 1.6, h * 0.42);
    } else ctx.fillRect(x + 1, gy, w - 2, h * 0.45);
  } else {
    // panneaux moulurés
    const pw = opts.double ? w / 2 - 1.6 : w - 2.2;
    const cols = opts.double ? [x + 0.8, x + w / 2 + 0.8] : [x + 1.1];
    ctx.strokeStyle = mix(color, INK, 0.4);
    ctx.beginPath();
    for (const px of cols) {
      ctx.rect(px, y + h * 0.12 + (opts.arched ? w * 0.35 : 0), pw, h * 0.32);
      ctx.rect(px, y + h * 0.56, pw, h * 0.34);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
  }
  circleFS(ctx, x + (opts.double ? w / 2 - 0.9 : w - 1.2), y + h * 0.55, 0.38, MAT.gold, false);
  ctx.lineWidth = 0.6;
}

/** Biens exposés en vitrine selon le commerce. */
export type Goods = 'bread' | 'jewels' | 'bottles' | 'boxes' | 'tables' | 'books' | 'flowers' | 'meat' | 'none' | 'mail';

/** Vitrine : châssis peint, vitre, marchandises. Renvoie le rectangle de la porte. */
export function drawShopfront(
  ctx: Ctx,
  x0: number,
  x1: number,
  yTop: number,
  yBottom: number,
  paint: string,
  goods: Goods,
  lod: Lod,
  state: { broken?: number; lit?: boolean; doorOpen?: boolean; doorAt?: number },
  seed: number,
): void {
  const fine = lod === 0;
  const w = x1 - x0;
  const h = yBottom - yTop;
  boxFS(ctx, x0, yTop, w, h, paint);
  // porte
  const dw = Math.min(9, w * 0.28);
  const dAt = state.doorAt ?? 0.5;
  const dx = Math.max(x0 + 1.2, Math.min(x1 - 1.2 - dw, x0 + w * dAt - dw / 2));
  // vitres de part et d'autre de la porte
  const panes: [number, number][] = [];
  if (dx - x0 > 4) panes.push([x0 + 1.2, dx - 1.2]);
  if (x1 - (dx + dw) > 4) panes.push([dx + dw + 1.2, x1 - 1.2]);
  const gy0 = yTop + 1.4;
  const gy1 = yBottom - 3.2;
  ctx.fillStyle = state.lit ? MAT.litGlass : MAT.glass;
  ctx.beginPath();
  for (const [a, b] of panes) ctx.rect(a, gy0, b - a, gy1 - gy0);
  ctx.fill();
  ctx.stroke();
  if (fine) {
    // marchandises
    let k = seed;
    const rnd = () => {
      k = (k * 1103515245 + 12345) >>> 0;
      return (k >>> 8) / 16777216;
    };
    for (const [a, b] of panes) {
      const shelfY = gy1 - (gy1 - gy0) * 0.35;
      ctx.fillStyle = mix(paint, '#ffffff', 0.3);
      ctx.fillRect(a, shelfY, b - a, 0.6);
      ctx.fillRect(a, gy1 - 0.6, b - a, 0.6);
      drawGoods(ctx, goods, a + 0.6, b - 0.6, shelfY, gy1 - 0.6, rnd);
    }
    // reflets
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    for (const [a, b] of panes) {
      const d = Math.min(b - a, gy1 - gy0) * 0.6;
      ctx.moveTo(a + 1, gy0 + d);
      ctx.lineTo(a + 1 + d * 0.6, gy0);
      ctx.lineTo(a + 1 + d * 0.6 + 1.4, gy0);
      ctx.lineTo(a + 2.4, gy0 + d);
      ctx.closePath();
    }
    ctx.fill();
  }
  if (state.broken !== undefined) {
    const bx = x0 + w * state.broken;
    for (const [a, b] of panes) {
      if (bx >= a - 3 && bx <= b + 3) cracks(ctx, a, gy0, b - a, gy1 - gy0, fine);
    }
  }
  // soubassement
  ctx.fillStyle = mix(paint, INK, 0.25);
  ctx.fillRect(x0, gy1 + 0.4, w, yBottom - gy1 - 0.4);
  drawDoor(ctx, dx, yBottom, dw, h - 1.6, mix(paint, INK, 0.1), !!state.doorOpen, lod, { glass: true });
}

function drawGoods(ctx: Ctx, goods: Goods, a: number, b: number, shelfY: number, floorY: number, rnd: () => number): void {
  const w = b - a;
  if (w <= 1) return;
  switch (goods) {
    case 'bread': {
      ctx.fillStyle = '#d9a35a';
      ctx.beginPath();
      for (let x = a + 1.2; x < b - 1; x += 2.6) {
        ctx.moveTo(x + 1.1, shelfY - 0.7);
        ctx.ellipse(x, shelfY - 0.7, 1.1, 0.7, 0, 0, TAU);
        ctx.moveTo(x + 1.0, floorY - 0.7);
        ctx.ellipse(x + 0.6, floorY - 0.7, 1.0, 0.7, 0, 0, TAU);
      }
      ctx.fill();
      ctx.lineWidth = 0.2;
      ctx.stroke();
      return;
    }
    case 'jewels': {
      ctx.fillStyle = '#3a2f4a';
      ctx.fillRect(a, shelfY - 2.5, w, 2.5);
      ctx.fillStyle = '#f7de8b';
      for (let x = a + 1; x < b - 0.5; x += 1.8) {
        ctx.beginPath();
        ctx.arc(x, shelfY - 1.2, 0.35, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#9fe0ee';
      for (let x = a + 1.8; x < b - 0.5; x += 3.2) ctx.fillRect(x, floorY - 1.4, 0.7, 0.7);
      return;
    }
    case 'bottles': {
      const cols = ['#3f9e55', '#f6f3ea', '#4b92dc', '#cc4238'];
      for (let x = a + 0.8; x < b - 0.6; x += 1.5) {
        ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
        ctx.fillRect(x, shelfY - 2.2, 0.9, 2.2);
        ctx.fillRect(x + 0.25, shelfY - 2.8, 0.4, 0.6);
      }
      return;
    }
    case 'books': {
      const cols = ['#cc4238', '#283f78', '#3f9e55', '#f0cb3f', '#8d55ad', '#8b5533'];
      for (let x = a + 0.4; x < b - 0.6; x += 0.9) {
        ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
        ctx.fillRect(x, shelfY - 2.4 + rnd() * 0.6, 0.75, 2.4);
      }
      return;
    }
    case 'flowers': {
      const cols = ['#e2463d', '#f19bb8', '#f0cb3f', '#fbf6ea', '#8d55ad'];
      ctx.fillStyle = MAT.foliage;
      ctx.fillRect(a, floorY - 2.2, w, 2.2);
      for (let x = a + 0.8; x < b - 0.5; x += 1.4) {
        ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
        ctx.beginPath();
        ctx.arc(x, floorY - 2.4 - rnd(), 0.6, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'meat': {
      ctx.fillStyle = '#d4675a';
      for (let x = a + 1; x < b - 0.8; x += 2.2) {
        ctx.beginPath();
        ctx.ellipse(x, shelfY - 0.8, 0.9, 0.6, 0, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'tables': {
      ctx.fillStyle = 'rgba(255, 210, 140, 0.35)';
      ctx.fillRect(a, shelfY - 4, w, floorY - shelfY + 4);
      ctx.fillStyle = '#7a5a43';
      for (let x = a + 1.5; x < b - 1; x += 4) {
        ctx.fillRect(x - 1.2, floorY - 2.2, 2.4, 0.5);
        ctx.fillRect(x - 0.15, floorY - 2.2, 0.3, 2.2);
      }
      return;
    }
    case 'mail': {
      ctx.fillStyle = '#f6f3ea';
      for (let x = a + 0.8; x < b - 1.5; x += 2.4) ctx.fillRect(x, shelfY - 1.6, 1.8, 1.2);
      return;
    }
    case 'boxes': {
      const cols = ['#cc4238', '#f0cb3f', '#4b92dc', '#3f9e55', '#ec8b2f', '#f6f3ea'];
      for (let x = a + 0.5; x < b - 1.2; x += 1.9) {
        ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
        const hh = 1.2 + rnd() * 1.2;
        ctx.fillRect(x, shelfY - hh, 1.5, hh);
        ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
        ctx.fillRect(x + 0.3, floorY - 1.4, 1.4, 1.4);
      }
      return;
    }
    default:
      return;
  }
}

/** Store (auvent) au-dessus d'une vitrine. */
export function drawAwning(ctx: Ctx, x0: number, x1: number, y: number, depth: number, color: string, lod: Lod): void {
  awningShape(ctx, x0, x1, y, depth, color, '#fbf6ea', lod === 0);
}

/** Enseigne : bandeau coloré avec texte ajusté à la largeur. */
export function drawSign(
  ctx: Ctx,
  text: string,
  cx: number,
  cy: number,
  w: number,
  h: number,
  bg: string,
  fg: string,
  lod: Lod,
  opts: { border?: boolean; serif?: boolean } = {},
): void {
  if (w <= 2 || h <= 1) return;
  boxFS(ctx, cx - w / 2, cy - h / 2, w, h, bg);
  if (opts.border && lod === 0) {
    ctx.strokeStyle = fg;
    ctx.lineWidth = Math.min(0.35, h * 0.06);
    ctx.strokeRect(cx - w / 2 + h * 0.15, cy - h / 2 + h * 0.15, w - h * 0.3, h * 0.7);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
  }
  if (!text) return;
  // Au niveau 1, seul un texte assez grand est écrit (sinon illisible et coûteux).
  if (lod === 2 || (lod === 1 && h < 7)) {
    if (lod === 1) {
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(cx - w * 0.35, cy - h * 0.12, w * 0.7, h * 0.24);
      ctx.globalAlpha = 1;
    }
    return;
  }
  fitText(ctx, text, cx, cy, w - h * 0.6, h * 0.68, fg, 'bold', opts.serif ? SERIF_STACK : undefined);
}

/** Lettres peintes directement sur le mur (sans bandeau). */
export function drawLettering(ctx: Ctx, text: string, cx: number, cy: number, w: number, h: number, fg: string, lod: Lod): void {
  if (!text || lod === 2 || (lod === 1 && h < 7)) return;
  fitText(ctx, text, cx, cy, w, h, fg);
}

/** Horloge ronde. */
export function drawClock(ctx: Ctx, cx: number, cy: number, r: number, lod: Lod): void {
  circleFS(ctx, cx, cy, r + 0.8, MAT.gold);
  circleFS(ctx, cx, cy, r, '#fbf8ee');
  if (lod === 2) return;
  const lw = ctx.lineWidth;
  if (lod === 0) {
    ctx.lineWidth = Math.max(0.2, r * 0.06);
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.moveTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78);
      ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
    }
    ctx.stroke();
  }
  ctx.lineWidth = Math.max(0.3, r * 0.12);
  ctx.beginPath();
  // 10 h 10
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - r * 0.42, cy - r * 0.25);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.55, cy - r * 0.42);
  ctx.stroke();
  ctx.lineWidth = lw;
}

/** Colonne (fût + chapiteau + base). */
export function drawColumn(ctx: Ctx, cx: number, yTop: number, yBottom: number, w: number, color: string, lod: Lod): void {
  const h = yBottom - yTop;
  boxFS(ctx, cx - w / 2, yTop + w * 0.35, w, h - w * 0.7, color);
  boxFS(ctx, cx - w * 0.7, yTop, w * 1.4, w * 0.4, color);
  boxFS(ctx, cx - w * 0.7, yBottom - w * 0.4, w * 1.4, w * 0.4, color);
  if (lod === 0 && w > 2) {
    ctx.strokeStyle = mix(color, INK, 0.25);
    ctx.lineWidth = 0.25;
    ctx.beginPath();
    for (const f of [-0.25, 0, 0.25]) {
      ctx.moveTo(cx + w * f, yTop + w * 0.5);
      ctx.lineTo(cx + w * f, yBottom - w * 0.5);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
  }
}

/** Fronton triangulaire. */
export function drawPediment(ctx: Ctx, x0: number, x1: number, yBase: number, h: number, color: string, lod: Lod): void {
  polyFS(ctx, [x0 - 1.5, yBase, (x0 + x1) / 2, yBase - h, x1 + 1.5, yBase], color);
  if (lod === 0) {
    polyFS(ctx, [x0 + 3, yBase - 1.2, (x0 + x1) / 2, yBase - h + 2.4, x1 - 3, yBase - 1.2], mix(color, INK, 0.08));
  }
}

/** Drapeau sur mât. colors = bandes verticales. */
export function drawFlag(ctx: Ctx, x: number, yBase: number, poleH: number, colors: string[], dir = 1, lod: Lod = 0): void {
  const lw = ctx.lineWidth;
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.moveTo(x, yBase);
  ctx.lineTo(x, yBase - poleH);
  ctx.stroke();
  const fw = Math.min(9, poleH * 0.55);
  const fh = fw * 0.62;
  const top = yBase - poleH + 0.6;
  const n = colors.length;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[i];
    const a = x + (dir * fw * i) / n;
    const b = x + (dir * fw * (i + 1)) / n;
    ctx.beginPath();
    ctx.moveTo(a, top + (i * 0.4) / n);
    ctx.lineTo(b, top + ((i + 1) * 0.4) / n);
    ctx.lineTo(b, top + fh + ((i + 1) * 0.4) / n);
    ctx.lineTo(a, top + fh + (i * 0.4) / n);
    ctx.closePath();
    ctx.fill();
  }
  if (lod < 2) {
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + dir * fw, top + 0.4);
    ctx.lineTo(x + dir * fw, top + fh + 0.4);
    ctx.lineTo(x, top + fh);
    ctx.stroke();
  }
  ctx.lineWidth = lw;
}

/** Cheminée vue en oblique (face avant + dessus). */
export function drawChimney(ctx: Ctx, x: number, yBase: number, w: number, h: number, color: string, lod: Lod): void {
  boxFS(ctx, x, yBase - h, w, h, color);
  boxFS(ctx, x - 0.4, yBase - h - 1.4, w + 0.8, 1.4, mix(color, INK, 0.2));
  if (lod === 0) {
    ctx.fillStyle = '#2b2624';
    ctx.fillRect(x + w * 0.25, yBase - h - 1.1, w * 0.5, 0.8);
  }
}

