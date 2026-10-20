// Styles de bâtiments reconnaissables : chaque style peut ajuster le plan de façade (layout) et
// dessiner des éléments propres (toit, avant / après le contenu de façade, au-dessus du toit).
//
// RÈGLE : rien ne doit dépasser l'emprise (getEntityBounds) — en hauteur, ne jamais monter
// au-dessus de L.topLimit ; latéralement, rester dans [x0 - 6, x1 + 6].

import type { BuildingStyle } from '../types';
import type { Layout } from './building';
import { drawClock, drawColumn, drawDoor, drawFlag, drawLettering, drawPediment, drawSign } from './buildingParts';
import type { Lod } from './lod';
import { COLOR_HEX, INK, MAT, mix } from './palette';
import { TAU, type Ctx, boxFS, circleFS, polyFS } from './util';

export interface StyleHook {
  /** Le style gère lui-même le rez-de-chaussée (pas de porte/fenêtres génériques). */
  customGround?: boolean;
  layout?: (L: Layout) => void;
  roof?: (ctx: Ctx, L: Layout, lod: Lod) => void;
  pre?: (ctx: Ctx, L: Layout, lod: Lod) => void;
  post?: (ctx: Ctx, L: Layout, lod: Lod) => void;
  top?: (ctx: Ctx, L: Layout, lod: Lod) => void;
  lod2?: (ctx: Ctx, L: Layout) => void;
}

const TRICOLORE = ['#2f4f9e', '#fbf6ea', '#cc4238'];
const CITY_FLAG = ['#f0cb3f', '#cc4238'];

function ft(L: Layout, k: number): number {
  return k === 0 ? L.yS - L.gfH : L.yS - L.gfH - k * L.upH;
}

/** Fenêtres du rez-de-chaussée sur les colonnes libres (en évitant [a, b]). */
function groundWindows(L: Layout, avoid: [number, number][], opts: { arched?: boolean; bars?: boolean; h?: number } = {}): void {
  const h = opts.h ?? Math.min(L.gfH * 0.5, L.winW * 1.7);
  for (const cx of L.cols) {
    if (avoid.some(([a, b]) => cx + L.winW / 2 + 1.5 > a && cx - L.winW / 2 - 1.5 < b)) continue;
    L.windows.push({ x: cx - L.winW / 2, y: L.yS - L.gfH + (L.gfH - h) * 0.45, w: L.winW, h, state: 'normal', arched: opts.arched, bars: opts.bars });
  }
}

function centralDoor(L: Layout, w: number, h: number, color: string, opts: { arched?: boolean; double?: boolean; glass?: boolean } = {}): [number, number] {
  const cx = L.x0 + L.W / 2;
  L.doors.push({ x: cx - w / 2, w, h, color, open: false, ...opts });
  return [cx - w / 2 - 1, cx + w / 2 + 1];
}

function setSign(L: Layout, text: string | undefined, cy: number, w: number, h: number, bg: string, fg: string, serif = false): void {
  if (!text) return;
  L.sign = { text, cx: L.x0 + L.W / 2, cy, w: Math.min(w, L.W - 4), h, bg, fg, serif, border: true };
}

/** Hauteur maximale disponible au-dessus de y (jusqu'à topLimit). */
function room(L: Layout, y: number): number {
  return Math.max(0, y - L.topLimit);
}

/* ----------------------------------------------------------------------------
 * Église
 * ------------------------------------------------------------------------- */

const church: StyleHook = {
  customGround: true,
  layout(L) {
    L.floors = 1;
    L.gfH = L.H - L.cornice;
    L.upH = 0;
    L.windows = [];
    L.dormers = [];
    L.chimneys = [];
    const tw = Math.max(18, Math.min(L.W * 0.3, 64));
    const cx = L.x0 + L.W / 2;
    L.extra.tw = tw;
    // vitraux en ogive sur la nef, de part et d'autre du clocher
    const lw = Math.min(7, L.W * 0.05 + 2);
    const lh = Math.min(L.H * 0.48, 40);
    const sides: [number, number][] = [
      [L.x0 + 4, cx - tw / 2 - 3],
      [cx + tw / 2 + 3, L.x1 - 4],
    ];
    for (const [a, b] of sides) {
      const n = Math.max(0, Math.floor((b - a) / 15));
      for (let i = 0; i < n; i++) {
        const wx = a + ((i + 0.5) * (b - a)) / n;
        L.windows.push({ x: wx - lw / 2, y: L.yS - L.H * 0.26 - lh, w: lw, h: lh, state: 'normal', arched: true });
      }
    }
    L.winStyle = { frame: '#d9cfb8', muntins: true, sill: false };
    const dw = Math.min(tw * 0.5, 22);
    const dh = Math.min(L.H * 0.36, 30, dw * 1.6);
    L.doors.push({ x: cx - dw / 2, w: dw, h: dh, color: '#6b4a35', open: false, arched: true, double: true });
    L.extra.dh = dh;
  },
  pre(ctx, L, lod) {
    const tw = L.extra.tw;
    const cx = L.x0 + L.W / 2;
    const total = Math.min(L.H * 1.9, L.yS - L.topLimit);
    const spire = total * 0.3;
    const bodyTop = L.yS - total + spire;
    // contreforts de la nef
    ctx.fillStyle = L.wallDark;
    for (const x of [L.x0 + 1, cx - tw / 2 - 3, cx + tw / 2 + 1, L.x1 - 3]) ctx.fillRect(x, L.facadeTop + L.cornice, 2, L.H - L.cornice);
    // tour
    boxFS(ctx, cx - tw / 2, bodyTop, tw, L.yS - bodyTop, L.wallLight);
    if (lod === 0) {
      ctx.strokeStyle = L.wallDark;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (let y = L.yS - 6; y > bodyTop + 2; y -= 6) {
        ctx.moveTo(cx - tw / 2, y);
        ctx.lineTo(cx + tw / 2, y);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
    }
    // corniche de la tour
    boxFS(ctx, cx - tw / 2 - 1.2, bodyTop, tw + 2.4, 2.4, L.wallDark);
    // flèche
    polyFS(ctx, [cx - tw / 2 - 0.6, bodyTop, cx, bodyTop - spire + 4, cx + tw / 2 + 0.6, bodyTop], L.roofC);
    if (lod === 0) {
      polyFS(ctx, [cx, bodyTop - spire + 4, cx + tw / 2 + 0.6, bodyTop, cx + tw * 0.15, bodyTop], mix(L.roofC, INK, 0.2));
    }
    // croix
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = MAT.goldDark;
    ctx.beginPath();
    ctx.moveTo(cx, bodyTop - spire + 4);
    ctx.lineTo(cx, bodyTop - spire + 0.4);
    ctx.moveTo(cx - 1.5, bodyTop - spire + 1.8);
    ctx.lineTo(cx + 1.5, bodyTop - spire + 1.8);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.8;
    // abat-sons du clocher
    const bh = Math.min(16, (L.yS - bodyTop) * 0.16);
    const by = bodyTop + 4;
    for (const dx of [-tw * 0.22, tw * 0.22]) {
      const ow = tw * 0.2;
      ctx.fillStyle = MAT.interior;
      ctx.beginPath();
      ctx.moveTo(cx + dx - ow / 2, by + bh);
      ctx.lineTo(cx + dx - ow / 2, by + ow / 2);
      ctx.arc(cx + dx, by + ow / 2, ow / 2, Math.PI, 0);
      ctx.lineTo(cx + dx + ow / 2, by + bh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (lod === 0) {
        ctx.strokeStyle = '#8b7a66';
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        for (let y = by + ow / 2 + 1; y < by + bh; y += 1.6) {
          ctx.moveTo(cx + dx - ow / 2 + 0.4, y);
          ctx.lineTo(cx + dx + ow / 2 - 0.4, y + 0.6);
        }
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 0.8;
      }
    }
    // horloge
    const cr = Math.min(tw * 0.18, 9);
    drawClock(ctx, cx, by + bh + cr + 3, cr, lod);
    // rosace au-dessus du portail
    const rr = Math.min(tw * 0.3, 16);
    const ry = L.yS - L.extra.dh - rr - 4;
    if (ry - rr > by + bh + 2 * cr + 5) rose(ctx, cx, ry, rr, lod);
  },
  lod2(ctx, L) {
    const tw = L.extra.tw;
    const cx = L.x0 + L.W / 2;
    const total = Math.min(L.H * 1.9, L.yS - L.topLimit);
    ctx.fillStyle = L.wallLight;
    ctx.fillRect(cx - tw / 2, L.yS - total * 0.7, tw, total * 0.7);
    ctx.fillStyle = L.roofC;
    ctx.beginPath();
    ctx.moveTo(cx - tw / 2, L.yS - total * 0.7);
    ctx.lineTo(cx, L.yS - total);
    ctx.lineTo(cx + tw / 2, L.yS - total * 0.7);
    ctx.fill();
  },
};

function rose(ctx: Ctx, cx: number, cy: number, r: number, lod: Lod): void {
  circleFS(ctx, cx, cy, r + 1.2, MAT.stoneLight);
  const cols = ['#3f6fb8', '#c9473f', '#e9c84a', '#4f9a5a', '#8d55ad'];
  const n = 12;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, (i / n) * TAU, ((i + 1) / n) * TAU);
    ctx.closePath();
    ctx.fill();
  }
  circleFS(ctx, cx, cy, r * 0.32, '#e9c84a');
  if (lod === 0) {
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      ctx.moveTo(cx + Math.cos(a) * r * 0.32, cy + Math.sin(a) * r * 0.32);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.stroke();
    ctx.lineWidth = 0.8;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
}

/* ----------------------------------------------------------------------------
 * Hôtel de ville : beffroi, horloge, drapeaux, balcon d'honneur
 * ------------------------------------------------------------------------- */

const townhall: StyleHook = {
  customGround: true,
  layout(L) {
    const bw = Math.max(18, Math.min(L.W * 0.16, 46));
    L.extra.bw = bw;
    const dw = Math.min(14, L.W * 0.12);
    const span = centralDoor(L, dw, Math.min(L.gfH - 5, 20), '#5a3b2a', { arched: true, double: true });
    groundWindows(L, [span], { arched: true });
    for (const w of L.windows) if (w.y < ft(L, 0) && w.y > ft(L, 1) - 1) w.arched = true;
    if (L.floors > 1) {
      const cx = L.x0 + L.W / 2;
      L.balconies.push({ x0: cx - bw / 2 - 2, x1: cx + bw / 2 + 2, y: ft(L, 1) + L.upH * 0.45 + L.winH });
    }
    setSign(L, L.e.sign, ft(L, 0) + 3.6, L.W * 0.5, 5.4, '#efe6cf', '#2f3f5f', true);
    L.chimneys = [];
  },
  pre(ctx, L, lod) {
    // avant-corps central légèrement en saillie
    const bw = L.extra.bw;
    const cx = L.x0 + L.W / 2;
    ctx.fillStyle = L.wallLight;
    ctx.fillRect(cx - bw / 2 - 3, L.facadeTop, bw + 6, L.H);
    ctx.strokeRect(cx - bw / 2 - 3, L.facadeTop, bw + 6, L.H);
    void lod;
  },
  post(ctx, L, lod) {
    const cx = L.x0 + L.W / 2;
    const bw = L.extra.bw;
    // drapeaux sur la façade
    if (L.floors > 1) {
      const fy = ft(L, 1) + 2;
      drawFlag(ctx, cx - bw / 2 - 6, fy + 12, 13, TRICOLORE, -1, lod);
      drawFlag(ctx, cx + bw / 2 + 6, fy + 12, 13, CITY_FLAG, 1, lod);
    }
  },
  top(ctx, L, lod) {
    // beffroi au-dessus du toit
    const cx = L.x0 + L.W / 2;
    const bw = L.extra.bw;
    const avail = room(L, L.facadeTop);
    const h = Math.min(avail, 30 + L.D * 0.4, 80);
    if (h < 12) return;
    const roofH = h * 0.38;
    const bodyTop = L.facadeTop - h + roofH;
    boxFS(ctx, cx - bw / 2, bodyTop, bw, L.facadeTop - bodyTop + 1, L.wallLight);
    const cr = Math.min(bw * 0.3, (L.facadeTop - bodyTop) * 0.36);
    if (cr > 2) drawClock(ctx, cx, bodyTop + (L.facadeTop - bodyTop) * 0.45, cr, lod);
    boxFS(ctx, cx - bw / 2 - 1.2, bodyTop - 1.2, bw + 2.4, 2.4, L.wallDark);
    // dôme à bulbe
    ctx.fillStyle = L.roofC;
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2, bodyTop - 1);
    ctx.quadraticCurveTo(cx - bw * 0.55, bodyTop - roofH * 0.55, cx - 1, bodyTop - roofH + 3);
    ctx.lineTo(cx + 1, bodyTop - roofH + 3);
    ctx.quadraticCurveTo(cx + bw * 0.55, bodyTop - roofH * 0.55, cx + bw / 2, bodyTop - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // girouette / drapeau au sommet
    drawFlag(ctx, cx, bodyTop - roofH + 3.2, 3.2, CITY_FLAG, 1, lod);
  },
  lod2(ctx, L) {
    const cx = L.x0 + L.W / 2;
    const bw = L.extra.bw;
    const h = Math.min(room(L, L.facadeTop), 30 + L.D * 0.4, 80);
    ctx.fillStyle = L.wallLight;
    ctx.fillRect(cx - bw / 2, L.facadeTop - h * 0.62, bw, h * 0.62);
    ctx.fillStyle = L.roofC;
    ctx.fillRect(cx - bw / 2, L.facadeTop - h, bw, h * 0.38);
  },
};

/* ----------------------------------------------------------------------------
 * Gare : arcades, grande verrière, horloge monumentale
 * ------------------------------------------------------------------------- */

const station: StyleHook = {
  customGround: true,
  layout(L) {
    L.floors = 1;
    L.gfH = L.H - L.cornice;
    L.upH = 0;
    L.windows = [];
    L.dormers = [];
    L.chimneys = [];
    const ah = Math.min(L.H * 0.42, 40);
    const n = Math.max(2, Math.floor(L.W / 30));
    const aw = Math.min(20, (L.W / n) * 0.62);
    for (let i = 0; i < n; i++) {
      const cx = L.x0 + ((i + 0.5) * L.W) / n;
      L.doors.push({ x: cx - aw / 2, w: aw, h: ah, color: '#5a6a72', open: false, arched: true, double: true, glass: true });
    }
    // grande baie en demi-lune
    const lw = Math.min(L.W * 0.32, 90);
    const lh = lw * 0.55;
    const ly = L.yS - ah - 8 - lh;
    if (ly > L.facadeTop + L.cornice + 10) {
      L.windows.push({ x: L.x0 + L.W / 2 - lw / 2, y: ly, w: lw, h: lh, state: 'normal', arched: true });
      L.winStyle = { frame: '#e9e2d0', muntins: true, sill: false };
    }
    setSign(L, L.e.sign, L.yS - ah - 4.6, Math.min(L.W * 0.4, 70), 7, '#2f3f5f', '#f7e7b0');
    L.extra.ah = ah;
  },
  top(ctx, L, lod) {
    // pavillon de l'horloge
    const cx = L.x0 + L.W / 2;
    const cw = Math.max(24, Math.min(L.W * 0.14, 56));
    const h = Math.min(room(L, L.facadeTop), 22 + L.D * 0.3, 52);
    if (h < 10) return;
    const top = L.facadeTop - h;
    boxFS(ctx, cx - cw / 2, top + 4, cw, h - 3, L.wallLight);
    polyFS(ctx, [cx - cw / 2 - 2, top + 5, cx, top, cx + cw / 2 + 2, top + 5], L.roofC);
    drawClock(ctx, cx, top + 4 + (h - 3) * 0.5, Math.min(cw * 0.3, (h - 3) * 0.38), lod);
  },
};

/* ----------------------------------------------------------------------------
 * Musée : colonnade, fronton, escalier, verrière zénithale
 * ------------------------------------------------------------------------- */

const museum: StyleHook = {
  customGround: true,
  layout(L) {
    const cw = L.W * 0.62;
    const cx = L.x0 + L.W / 2;
    L.extra.cw = cw;
    // fenêtres sur les ailes uniquement
    L.windows = L.windows.filter((w) => w.x + w.w < cx - cw / 2 - 2 || w.x > cx + cw / 2 + 2);
    groundWindows(L, [[cx - cw / 2 - 2, cx + cw / 2 + 2]], { arched: true });
    L.doors.push({ x: cx - 7, w: 14, h: Math.min(L.H * 0.4, 24), color: '#5a3b2a', open: false, double: true, arched: false });
    L.chimneys = [];
  },
  roof(ctx, L, lod) {
    // verrière zénithale
    const w = L.W * 0.4;
    const d = L.D * 0.5;
    if (d < 8) return;
    boxFS(ctx, L.x0 + L.W / 2 - w / 2, L.roofTop + L.D / 2 - d / 2, w, d, '#b4d0da');
    if (lod === 0) {
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (let x = L.x0 + L.W / 2 - w / 2 + 6; x < L.x0 + L.W / 2 + w / 2; x += 6) {
        ctx.moveTo(x, L.roofTop + L.D / 2 - d / 2);
        ctx.lineTo(x, L.roofTop + L.D / 2 + d / 2);
      }
      ctx.stroke();
      ctx.lineWidth = 0.8;
    }
  },
  pre(ctx, L) {
    // fond sombre derrière la colonnade
    const cw = L.extra.cw;
    const cx = L.x0 + L.W / 2;
    ctx.fillStyle = mix(L.wall, INK, 0.18);
    ctx.fillRect(cx - cw / 2, L.facadeTop + L.cornice + 8, cw, L.H - L.cornice - 12);
  },
  post(ctx, L, lod) {
    const cw = L.extra.cw;
    const cx = L.x0 + L.W / 2;
    const entTop = L.facadeTop + L.cornice;
    const entH = Math.min(9, L.H * 0.12);
    // marches
    for (let i = 0; i < 3; i++) boxFS(ctx, cx - cw / 2 - 2 - i * 1.5, L.yS - 4 + i * 1.33, cw + 4 + i * 3, 1.33, MAT.stoneLight);
    // colonnes
    const n = cw > 140 ? 8 : 6;
    const colW = Math.min(5.5, cw / n / 2.4);
    for (let i = 0; i < n; i++) {
      const x = cx - cw / 2 + colW + ((cw - 2 * colW) * i) / (n - 1);
      drawColumn(ctx, x, entTop + entH, L.yS - 4, colW, '#f1ece0', lod);
    }
    // entablement + inscription
    boxFS(ctx, cx - cw / 2 - 2, entTop, cw + 4, entH, '#efe9db');
    if (L.e.sign) drawLettering(ctx, L.e.sign, cx, entTop + entH / 2, cw * 0.7, entH * 0.7, '#3a3330', lod);
  },
  top(ctx, L, lod) {
    const cw = L.extra.cw;
    const cx = L.x0 + L.W / 2;
    const h = Math.min(room(L, L.facadeTop + L.cornice), cw * 0.14, 30);
    if (h > 4) drawPediment(ctx, cx - cw / 2 - 2, cx + cw / 2 + 2, L.facadeTop + L.cornice + 0.5, h, '#f1ece0', lod);
  },
};

/* ----------------------------------------------------------------------------
 * Théâtre : marquise, fenêtres cintrées, cartouche
 * ------------------------------------------------------------------------- */

const theatre: StyleHook = {
  customGround: true,
  layout(L) {
    const cx = L.x0 + L.W / 2;
    const dw = Math.min(10, L.W * 0.1);
    const dh = Math.min(L.gfH - 6, 17);
    for (const dx of [-dw * 1.6, 0, dw * 1.6]) L.doors.push({ x: cx + dx - dw / 2, w: dw, h: dh, color: '#6e2f3a', open: false, arched: true, double: true, glass: true });
    groundWindows(L, [[cx - dw * 2.2, cx + dw * 2.2]], { arched: true });
    for (const w of L.windows) if (w.y < ft(L, 0)) w.arched = true;
    if (L.floors > 1) L.balconies.push({ x0: cx - L.W * 0.3, x1: cx + L.W * 0.3, y: ft(L, 1) + L.upH * 0.45 + L.winH });
    setSign(L, L.e.sign, L.facadeTop + L.cornice + 4.2, L.W * 0.55, 6.5, '#6e2f3a', '#f7e7b0', true);
    L.posters.push({ x: cx - dw * 3.4, y: ft(L, 0) + L.gfH * 0.55, text: 'CARMEN', color: '#cc4238' });
    L.posters.push({ x: cx + dw * 3.4, y: ft(L, 0) + L.gfH * 0.55, text: 'RIRES', color: '#3f6fb8' });
    L.chimneys = [];
  },
  post(ctx, L, lod) {
    // marquise de fer et de verre
    const cx = L.x0 + L.W / 2;
    const mw = Math.min(L.W * 0.5, 60);
    const y = ft(L, 0) + 2.5;
    polyFS(ctx, [cx - mw / 2, y, cx + mw / 2, y, cx + mw / 2 + 2, y + 4, cx - mw / 2 - 2, y + 4], '#3a3f45');
    ctx.fillStyle = 'rgba(180, 208, 218, 0.8)';
    ctx.fillRect(cx - mw / 2 + 1, y + 0.6, mw - 2, 2);
    if (lod === 0) {
      ctx.fillStyle = '#ffd84a';
      for (let x = cx - mw / 2; x <= cx + mw / 2 + 0.1; x += 3) {
        ctx.beginPath();
        ctx.arc(x, y + 4.4, 0.55, 0, TAU);
        ctx.fill();
      }
    }
  },
  top(ctx, L, lod) {
    const cx = L.x0 + L.W / 2;
    const h = Math.min(room(L, L.facadeTop), 14);
    if (h < 5) return;
    const w = Math.min(L.W * 0.3, 40);
    ctx.fillStyle = L.wallLight;
    ctx.beginPath();
    ctx.ellipse(cx, L.facadeTop + 1, w / 2, h - 1, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // masque doré
    const r = Math.min(h * 0.38, 5);
    circleFS(ctx, cx, L.facadeTop - h * 0.42, r, MAT.gold);
    if (lod === 0) {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.38, L.facadeTop - h * 0.42 - r * 0.15, r * 0.18, r * 0.12, 0, 0, TAU);
      ctx.ellipse(cx + r * 0.38, L.facadeTop - h * 0.42 - r * 0.15, r * 0.18, r * 0.12, 0, 0, TAU);
      ctx.fill();
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.arc(cx, L.facadeTop - h * 0.42 + r * 0.2, r * 0.4, 0.3, Math.PI - 0.3);
      ctx.stroke();
      ctx.lineWidth = 0.8;
    }
  },
};

/* ----------------------------------------------------------------------------
 * Cinéma : marquise lumineuse, affiches
 * ------------------------------------------------------------------------- */

const cinema: StyleHook = {
  customGround: true,
  layout(L) {
    const cx = L.x0 + L.W / 2;
    const dw = Math.min(16, L.W * 0.14);
    L.doors.push({ x: cx - dw - 0.5, w: dw, h: Math.min(L.gfH - 8, 16), color: '#3a3f45', open: false, double: true, glass: true });
    L.doors.push({ x: cx + 0.5, w: dw, h: Math.min(L.gfH - 8, 16), color: '#3a3f45', open: false, double: true, glass: true });
    const colors = ['#cc4238', '#3f6fb8', '#f0cb3f', '#3f9e55'];
    const titles = ['POLAR', 'AMOUR', 'WESTERN', 'COMÉDIE'];
    let i = 0;
    for (const dx of [-dw - 12, -dw - 22, dw + 12, dw + 22]) {
      if (Math.abs(dx) + 4 < L.W / 2) L.posters.push({ x: cx + dx, y: ft(L, 0) + L.gfH * 0.55, text: titles[i], color: colors[i] });
      i++;
    }
    // les étages : peu de fenêtres, un grand panneau
    L.windows = L.windows.filter((w) => Math.abs(w.x + w.w / 2 - cx) > L.W * 0.22);
    L.chimneys = [];
  },
  post(ctx, L, lod) {
    const cx = L.x0 + L.W / 2;
    const mw = Math.min(L.W * 0.7, 90);
    const y = ft(L, 0) + 1.2;
    // marquise
    boxFS(ctx, cx - mw / 2, y, mw, 6, '#f6f1e4');
    ctx.fillStyle = '#cc4238';
    ctx.fillRect(cx - mw / 2, y + 4.6, mw, 1.4);
    if (lod === 0) {
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath();
      for (let x = cx - mw / 2 + 1.5; x < cx + mw / 2; x += 2.6) {
        ctx.moveTo(x + 0.6, y + 0.9);
        ctx.arc(x, y + 0.9, 0.6, 0, TAU);
      }
      ctx.fill();
      ctx.lineWidth = 0.2;
      ctx.stroke();
      ctx.lineWidth = 0.8;
    }
    drawLettering(ctx, 'CE SOIR', cx, y + 2.8, mw * 0.4, 2.2, '#2f2b2a', lod);
    // grand panneau lumineux au-dessus
    if (L.e.sign) {
      const ph = Math.min(L.H * 0.3, 18);
      const py = L.facadeTop + L.cornice + 3;
      drawSign(ctx, L.e.sign, cx, py + ph / 2, Math.min(L.W * 0.42, 70), ph, '#2f2b2a', '#ffd84a', lod);
      if (lod === 0) {
        ctx.fillStyle = '#ffe98a';
        const w = Math.min(L.W * 0.42, 70);
        ctx.beginPath();
        for (let x = cx - w / 2 + 1.5; x < cx + w / 2; x += 3) {
          ctx.moveTo(x + 0.5, py + 1.1);
          ctx.arc(x, py + 1.1, 0.5, 0, TAU);
          ctx.moveTo(x + 0.5, py + ph - 1.1);
          ctx.arc(x, py + ph - 1.1, 0.5, 0, TAU);
        }
        ctx.fill();
      }
    }
  },
};

/* ----------------------------------------------------------------------------
 * Hôpital : croix rouge, auvent d'entrée, hélisurface
 * ------------------------------------------------------------------------- */

const hospital: StyleHook = {
  customGround: true,
  layout(L) {
    const span = centralDoor(L, 14, Math.min(L.gfH - 6, 16), '#5a7f8f', { double: true, glass: true });
    groundWindows(L, [[span[0] - 6, span[1] + 6]]);
    setSign(L, L.e.sign, L.facadeTop + L.cornice + 4, L.W * 0.4, 6, '#fbf8f1', '#c0392b');
    L.winStyle = { ...L.winStyle, shutter: undefined };
    L.chimneys = [];
  },
  roof(ctx, L, lod) {
    if (L.D < 30 || L.W < 50) return;
    const cx = L.x0 + L.W * 0.72;
    const cy = L.roofTop + L.D / 2;
    const r = Math.min(L.D * 0.32, 22);
    circleFS(ctx, cx, cy, r, '#7d8285');
    ctx.strokeStyle = '#f6f3ea';
    ctx.lineWidth = Math.max(0.8, r * 0.08);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.8;
    if (lod < 2) {
      ctx.fillStyle = '#f6f3ea';
      const k = r * 0.38;
      ctx.fillRect(cx - k, cy - k, k * 0.38, 2 * k);
      ctx.fillRect(cx + k * 0.62, cy - k, k * 0.38, 2 * k);
      ctx.fillRect(cx - k, cy - k * 0.18, 2 * k, k * 0.36);
    }
  },
  post(ctx, L) {
    const cx = L.x0 + L.W / 2;
    // auvent d'entrée
    boxFS(ctx, cx - 14, ft(L, 0) + 4, 28, 2.6, '#e9e6de');
    // croix rouge
    const s = Math.min(14, L.upH > 0 ? L.upH * 0.7 : L.H * 0.2);
    const cy = L.facadeTop + L.cornice + 6 + 6 + s / 2;
    if (cy + s / 2 < ft(L, 0)) {
      const crossX = L.x0 + Math.min(16, L.W * 0.12);
      boxFS(ctx, crossX - s / 2, cy - s / 2, s, s, '#fbf8f1');
      ctx.fillStyle = MAT.red;
      ctx.fillRect(crossX - s * 0.38, cy - s * 0.12, s * 0.76, s * 0.24);
      ctx.fillRect(crossX - s * 0.12, cy - s * 0.38, s * 0.24, s * 0.76);
    }
  },
};

/* ----------------------------------------------------------------------------
 * Commissariat : panneau POLICE, gyrophare, drapeau
 * ------------------------------------------------------------------------- */

const police: StyleHook = {
  customGround: true,
  layout(L) {
    const span = centralDoor(L, 11, Math.min(L.gfH - 9, 15), '#283f78', { double: true, glass: true });
    groundWindows(L, [[span[0] - 4, span[1] + 4]], { bars: true });
    setSign(L, L.e.sign ?? 'POLICE', ft(L, 0) + 4.2, Math.min(L.W * 0.4, 46), 6, '#283f78', '#ffffff');
    L.winStyle = { ...L.winStyle, shutter: undefined };
    L.chimneys = [];
  },
  post(ctx, L, lod) {
    const cx = L.x0 + L.W / 2;
    const y = ft(L, 0) + 4.2;
    const sw = Math.min(L.W * 0.4, 46);
    // gyrophare sur potence, à droite du panneau
    const gx = cx + sw / 2 + 4;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(gx - 3, y);
    ctx.lineTo(gx, y);
    ctx.lineTo(gx, y - 1.5);
    ctx.stroke();
    ctx.fillStyle = '#2f6fd8';
    ctx.beginPath();
    ctx.arc(gx, y - 1.5, 2.2, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (lod === 0) {
      ctx.strokeStyle = 'rgba(70, 130, 255, 0.85)';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (const a of [-2.6, -1.9, -1.2, -0.5]) {
        ctx.moveTo(gx + Math.cos(a) * 3, y - 1.5 + Math.sin(a) * 3);
        ctx.lineTo(gx + Math.cos(a) * 4.6, y - 1.5 + Math.sin(a) * 4.6);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
    }
    ctx.lineWidth = 0.8;
    // drapeau
    if (L.floors > 1) drawFlag(ctx, L.x0 + 6, ft(L, 1) + 10, 12, TRICOLORE, 1, lod);
  },
};

/* ----------------------------------------------------------------------------
 * Banque : pilastres, porte blindée, lettres dorées, balustrade
 * ------------------------------------------------------------------------- */

const bank: StyleHook = {
  customGround: true,
  layout(L) {
    const span = centralDoor(L, 13, Math.min(L.gfH - 8, 18), '#3a2a20', { double: true, arched: true });
    groundWindows(L, [[span[0] - 6, span[1] + 6]], { arched: true, bars: true });
    setSign(L, L.e.sign, ft(L, 0) + 3.4, L.W * 0.7, 5.2, '#2f2b2a', MAT.gold, true);
    L.winStyle = { ...L.winStyle, shutter: undefined };
    L.chimneys = [];
  },
  roof(ctx, L, lod) {
    if (lod !== 0) return;
    // balustrade au bord sud du toit
    ctx.strokeStyle = MAT.stoneLight;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let x = L.x0 + 2; x < L.x1 - 1; x += 2.4) {
      ctx.moveTo(x, L.facadeTop - 0.4);
      ctx.lineTo(x, L.facadeTop - 3);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.4;
    ctx.strokeRect(L.x0 + 1, L.facadeTop - 3.6, L.W - 2, 0.8);
    ctx.lineWidth = 0.8;
  },
  post(ctx, L, lod) {
    const cx = L.x0 + L.W / 2;
    const top = ft(L, 0) + 6.5;
    const w = Math.min(4, L.W * 0.03);
    for (const x of [L.x0 + 3, cx - 11, cx + 11, L.x1 - 3]) drawColumn(ctx, x, top, L.yS - 1, w, '#e9e2d0', lod);
  },
};

/* ----------------------------------------------------------------------------
 * École : grandes fenêtres, enseigne, clocheton
 * ------------------------------------------------------------------------- */

const school: StyleHook = {
  customGround: true,
  layout(L) {
    const span = centralDoor(L, 12, Math.min(L.gfH - 9, 16), '#2f5a46', { double: true, glass: true });
    // fenêtres plus larges (classes)
    const wide = Math.min(L.winW * 1.5, 13);
    for (const w of L.windows) {
      w.x -= (wide - w.w) / 2;
      w.w = wide;
    }
    L.winW = wide;
    groundWindows(L, [[span[0] - 4, span[1] + 4]]);
    setSign(L, L.e.sign, ft(L, 0) + 3.6, Math.min(L.W * 0.4, 50), 5.6, '#fbf3dc', '#2f3f5f', true);
    L.winStyle = { frame: '#f6f2e8', muntins: true, sill: true };
    L.chimneys = [];
  },
  top(ctx, L, lod) {
    // clocheton avec sa cloche, posé sur le faîtage côté rue
    const cx = L.x0 + L.W / 2;
    const h = Math.min(room(L, L.facadeTop), 16);
    if (h < 8) return;
    const w = 10;
    const top = L.facadeTop - h;
    boxFS(ctx, cx - w / 2, top + 3, w, h - 3, L.wallLight);
    polyFS(ctx, [cx - w / 2 - 1.5, top + 3.5, cx, top, cx + w / 2 + 1.5, top + 3.5], L.roofC);
    ctx.fillStyle = MAT.interior;
    ctx.beginPath();
    ctx.moveTo(cx - 3, top + h - 1);
    ctx.lineTo(cx - 3, top + 7);
    ctx.arc(cx, top + 7, 3, Math.PI, 0);
    ctx.lineTo(cx + 3, top + h - 1);
    ctx.closePath();
    ctx.fill();
    // cloche
    ctx.fillStyle = MAT.gold;
    ctx.beginPath();
    ctx.moveTo(cx - 2.1, top + h - 2.4);
    ctx.quadraticCurveTo(cx - 1.8, top + 6.2, cx, top + 6.2);
    ctx.quadraticCurveTo(cx + 1.8, top + 6.2, cx + 2.1, top + h - 2.4);
    ctx.closePath();
    ctx.fill();
    if (lod === 0) {
      ctx.lineWidth = 0.35;
      ctx.stroke();
      ctx.lineWidth = 0.8;
    }
  },
};

/* ----------------------------------------------------------------------------
 * Hôtel : balcons à chaque étage, marquise, drapeaux
 * ------------------------------------------------------------------------- */

const hotel: StyleHook = {
  customGround: true,
  layout(L) {
    const span = centralDoor(L, 12, Math.min(L.gfH - 7, 17), '#5a3b2a', { double: true, glass: true });
    groundWindows(L, [[span[0] - 8, span[1] + 8]], { h: Math.min(L.gfH * 0.55, 15) });
    for (const w of L.windows) {
      if (w.y < ft(L, 0) && w.y > ft(L, L.floors - 1) - 1) L.balconies.push({ x0: w.x - 2.2, x1: w.x + w.w + 2.2, y: w.y + w.h });
    }
    setSign(L, L.e.sign, L.facadeTop + L.cornice + 3.8, L.W * 0.62, 6, '#2f3f5f', '#f7e7b0', true);
  },
  post(ctx, L, lod) {
    const cx = L.x0 + L.W / 2;
    const y = ft(L, 0) + 3;
    // marquise d'entrée
    polyFS(ctx, [cx - 12, y, cx + 12, y, cx + 14, y + 3.6, cx - 14, y + 3.6], '#3a3f45');
    ctx.fillStyle = MAT.gold;
    ctx.fillRect(cx - 14, y + 3.2, 28, 0.8);
    // drapeaux au-dessus de la marquise
    const flags = [TRICOLORE, CITY_FLAG, ['#3f6fb8', '#fbf6ea']];
    for (let i = 0; i < 3; i++) drawFlag(ctx, cx - 9 + i * 9, y - 0.5, 9, flags[i], 1, lod);
  },
};

/* ----------------------------------------------------------------------------
 * Entrepôt : grandes portes, numéro peint
 * ------------------------------------------------------------------------- */

function warehouseNumber(L: Layout): string {
  const digits = (L.e.sign ?? '').match(/\d+/);
  return digits ? digits[0] : String((L.seed % 30) + 1);
}

const warehouse: StyleHook = {
  customGround: true,
  layout(L) {
    L.windows = [];
    const n = L.W > 120 ? 2 : 1;
    const dw = Math.min(34, L.W * 0.3);
    const dh = Math.min(L.H * 0.66, 36);
    for (let i = 0; i < n; i++) {
      const cx = L.x0 + ((i + 0.5) * L.W) / n;
      L.doors.push({ x: cx - dw / 2, w: dw, h: dh, color: mix(COLOR_HEX[L.e.roof] ?? '#7d8285', '#ffffff', 0.15), open: false });
    }
    // jours hauts
    const y = L.facadeTop + L.cornice + 3;
    for (let x = L.x0 + 8; x < L.x1 - 8; x += 14) L.windows.push({ x, y, w: 7, h: 4, state: 'normal' });
    L.winStyle = { frame: '#d9d6cf', muntins: false, sill: false };
    L.chimneys = [];
  },
  post(ctx, L, lod) {
    // croisillons des portes
    for (const d of L.doors) {
      if (d.open) continue;
      const y0 = L.yS - 0.4 - d.h;
      ctx.lineWidth = lod === 0 ? 0.7 : 1;
      ctx.strokeStyle = mix(d.color, INK, 0.45);
      ctx.beginPath();
      ctx.moveTo(d.x + 1, y0 + 1);
      ctx.lineTo(d.x + d.w / 2, L.yS - 1.4);
      ctx.moveTo(d.x + d.w / 2, y0 + 1);
      ctx.lineTo(d.x + 1, L.yS - 1.4);
      ctx.moveTo(d.x + d.w / 2, y0 + 1);
      ctx.lineTo(d.x + d.w - 1, L.yS - 1.4);
      ctx.moveTo(d.x + d.w - 1, y0 + 1);
      ctx.lineTo(d.x + d.w / 2, L.yS - 1.4);
      ctx.moveTo(d.x + d.w / 2, y0);
      ctx.lineTo(d.x + d.w / 2, L.yS - 0.4);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.8;
    }
    // grand numéro peint
    const num = warehouseNumber(L);
    const r = Math.min(9, (L.H - (L.doors[0]?.h ?? 0)) * 0.36);
    if (r > 3) {
      const cy = L.facadeTop + L.cornice + 4 + 4 + r;
      const cx = L.x0 + L.W / 2;
      if (cy + r < L.yS - (L.doors[0]?.h ?? 0) - 1) {
        circleFS(ctx, cx, cy, r, '#fbf6ea');
        drawLettering(ctx, num, cx, cy, r * 1.5, r * 1.3, '#2f2b2a', lod);
      } else {
        // pas la place au-dessus : sur la porte
        const d = L.doors[0];
        if (d) drawLettering(ctx, num, d.x + d.w / 2, L.yS - d.h * 0.7, d.w * 0.6, d.h * 0.4, '#fbf6ea', lod);
      }
    }
  },
};

/* ----------------------------------------------------------------------------
 * Usine : verrières d'atelier, cheminée de brique
 * ------------------------------------------------------------------------- */

const factory: StyleHook = {
  customGround: true,
  layout(L) {
    L.windows = [];
    const ww = 12;
    const wh = Math.min(L.H * 0.36, 20);
    const y = L.yS - L.H * 0.66;
    const dw = Math.min(20, L.W * 0.18);
    const dx = L.x1 - dw - 8;
    L.doors.push({ x: dx, w: dw, h: Math.min(L.H * 0.45, 24), color: '#4a5a62', open: false, double: true });
    for (let x = L.x0 + 6; x + ww < dx - 4; x += ww + 6) L.windows.push({ x, y, w: ww, h: wh, state: 'normal' });
    L.winStyle = { frame: '#5a6a72', muntins: true, sill: true };
    L.chimneys = [];
  },
  roof(ctx, L, lod) {
    // cheminée de brique posée sur le toit
    const w = Math.min(9, Math.max(5, L.W * 0.05));
    const cx = L.x0 + L.W * 0.22;
    const base = L.roofTop + L.D * 0.75;
    const top = L.topLimit + 0.5;
    if (base - top < 10) return;
    ctx.fillStyle = MAT.brick;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, base);
    ctx.lineTo(cx - w * 0.38, top);
    ctx.lineTo(cx + w * 0.38, top);
    ctx.lineTo(cx + w / 2, base);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2f2b2a';
    ctx.fillRect(cx - w * 0.42, top, w * 0.84, 2.4);
    if (lod === 0) {
      ctx.strokeStyle = MAT.brickDark;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (let y = top + 5; y < base; y += 3) {
        ctx.moveTo(cx - w * 0.4, y);
        ctx.lineTo(cx + w * 0.4, y);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.8;
    }
  },
  post(ctx, L, lod) {
    if (L.e.sign) drawLettering(ctx, L.e.sign, L.x0 + L.W / 2, L.facadeTop + L.cornice + 4.5, L.W * 0.6, 5.5, '#fbf6ea', lod);
  },
};

/* ----------------------------------------------------------------------------
 * Garage : portes basculantes, enseigne, pneus
 * ------------------------------------------------------------------------- */

const garage: StyleHook = {
  customGround: true,
  layout(L) {
    L.windows = [];
    const n = L.W > 110 ? 2 : 1;
    const dw = Math.min(26, L.W * 0.32);
    const dh = Math.min(L.H * 0.6, 22);
    for (let i = 0; i < n; i++) {
      const cx = L.x0 + L.W * (n === 1 ? 0.4 : 0.25 + i * 0.32);
      L.doors.push({ x: cx - dw / 2, w: dw, h: dh, color: '#c9cccd', open: i === 1 || (n === 1 && L.seed % 2 === 0) });
    }
    // bureau : petite fenêtre
    if (L.W > 70) L.windows.push({ x: L.x1 - 16, y: L.yS - dh, w: 9, h: 8, state: 'normal' });
    L.winStyle = { frame: '#f6f2e8', muntins: true, sill: true };
    setSign(L, L.e.sign, L.facadeTop + L.cornice + 4, L.W * 0.8, Math.min(6, L.H * 0.14), '#fbf8f1', '#c0392b');
    L.chimneys = [];
  },
  post(ctx, L, lod) {
    for (const d of L.doors) {
      if (d.open) {
        // intérieur : roue et pare-chocs d'une voiture en réparation
        circleFS(ctx, d.x + d.w * 0.3, L.yS - 3, 2.6, MAT.tire);
        boxFS(ctx, d.x + d.w * 0.15, L.yS - 9, d.w * 0.5, 4, '#cc4238');
        continue;
      }
      if (lod !== 0) continue;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (let y = L.yS - d.h + 2; y < L.yS - 1; y += 1.8) {
        ctx.moveTo(d.x + 0.4, y);
        ctx.lineTo(d.x + d.w - 0.4, y);
      }
      ctx.stroke();
      ctx.lineWidth = 0.8;
    }
    if (lod === 0) {
      // pile de pneus
      const tx = L.x1 - 4;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = MAT.tire;
        ctx.beginPath();
        ctx.ellipse(tx, L.yS - 1.2 - i * 1.9, 2.6, 1.0, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
  },
};

/* ----------------------------------------------------------------------------
 * Cabane et serre
 * ------------------------------------------------------------------------- */

const shed: StyleHook = {
  customGround: true,
  layout(L) {
    L.windows = [];
    const dw = Math.min(7, L.W * 0.3);
    L.doors.push({ x: L.x0 + L.W * 0.3 - dw / 2, w: dw, h: Math.min(L.H - 6, 15), color: '#7a5236', open: false });
    if (L.W > 26) L.windows.push({ x: L.x0 + L.W * 0.68 - 2.5, y: L.yS - L.H * 0.7, w: 5, h: 4.5, state: 'normal' });
    L.winStyle = { frame: '#d9cfb8', muntins: true, sill: false };
    L.chimneys = [];
    L.dormers = [];
  },
};

const greenhouse: StyleHook = {
  customGround: true,
  layout(L) {
    L.windows = [];
    L.chimneys = [];
    L.dormers = [];
    L.wallTex = 'plain';
  },
  pre(ctx, L, lod) {
    // façade vitrée : plantes derrière le verre
    ctx.fillStyle = '#cfe3d8';
    ctx.fillRect(L.x0, L.facadeTop, L.W, L.H);
    ctx.fillStyle = MAT.foliage;
    ctx.beginPath();
    for (let x = L.x0 + 3; x < L.x1 - 2; x += 5) {
      const r = 2.2 + ((x * 7) % 3) * 0.4;
      ctx.moveTo(x + r, L.yS - 3);
      ctx.arc(x, L.yS - 3, r, 0, TAU);
    }
    ctx.fill();
    if (lod === 0) {
      ctx.fillStyle = '#d23b3b';
      for (let x = L.x0 + 4.5; x < L.x1 - 2; x += 7) {
        ctx.beginPath();
        ctx.arc(x, L.yS - 4.2, 0.6, 0, TAU);
        ctx.fill();
      }
    }
    // montants
    ctx.strokeStyle = '#f6f3ea';
    ctx.lineWidth = lod === 0 ? 0.7 : 1;
    ctx.beginPath();
    for (let x = L.x0 + 6; x < L.x1; x += 6) {
      ctx.moveTo(x, L.facadeTop);
      ctx.lineTo(x, L.yS);
    }
    ctx.moveTo(L.x0, L.facadeTop + L.H * 0.45);
    ctx.lineTo(L.x1, L.facadeTop + L.H * 0.45);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.8;
    // porte vitrée
    const dw = Math.min(7, L.W * 0.25);
    drawDoor(ctx, L.x0 + L.W / 2 - dw / 2, L.yS - 0.4, dw, Math.min(L.H - 4, 14), '#e9eef0', false, lod, { glass: true });
  },
};

/* ----------------------------------------------------------------------------
 * Commerces : petits détails propres
 * ------------------------------------------------------------------------- */

const pharmacy: StyleHook = {
  layout(L) {
    if (L.sign) {
      L.sign.bg = '#2f7a4a';
      L.sign.fg = '#ffffff';
    }
  },
  post(ctx, L, lod) {
    // croix verte en drapeau, à l'angle, au niveau du premier étage
    const s = Math.min(9, L.W * 0.12);
    const cx = L.x0 + s * 0.7 + 1;
    const cy = ft(L, 0) - s * 0.7 - 2;
    if (cy - s / 2 < L.facadeTop + L.cornice) return;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(L.x0, cy);
    ctx.lineTo(cx - s / 2, cy);
    ctx.stroke();
    ctx.fillStyle = '#3fae5a';
    ctx.beginPath();
    const k = s / 2;
    const t = s * 0.17;
    ctx.moveTo(cx - t, cy - k);
    ctx.lineTo(cx + t, cy - k);
    ctx.lineTo(cx + t, cy - t);
    ctx.lineTo(cx + k, cy - t);
    ctx.lineTo(cx + k, cy + t);
    ctx.lineTo(cx + t, cy + t);
    ctx.lineTo(cx + t, cy + k);
    ctx.lineTo(cx - t, cy + k);
    ctx.lineTo(cx - t, cy + t);
    ctx.lineTo(cx - k, cy + t);
    ctx.lineTo(cx - k, cy - t);
    ctx.lineTo(cx - t, cy - t);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (lod === 0) {
      ctx.fillStyle = '#a8f0b8';
      ctx.fillRect(cx - t * 0.4, cy - k + 0.6, t * 0.8, s - 1.2);
    }
    ctx.lineWidth = 0.8;
  },
};

const postoffice: StyleHook = {
  layout(L) {
    if (L.sign) {
      L.sign.bg = '#f0c23a';
      L.sign.fg = '#2f4f9e';
    }
    if (L.shop) L.shop.paint = '#2f4f9e';
  },
  post(ctx, L) {
    // boîte aux lettres murale
    const x = L.x1 - 6;
    const y = L.yS - 13;
    if (!L.shop || x - 3 < L.shop.x1 - 12) return;
    boxFS(ctx, x - 2.4, y, 4.8, 6, '#f0c23a');
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1.5, y + 1.6, 3, 0.5);
  },
};

const jeweler: StyleHook = {
  layout(L) {
    if (L.sign) {
      L.sign.bg = '#2f2b2a';
      L.sign.fg = MAT.gold;
      L.sign.serif = true;
    }
    if (L.shop) L.shop.paint = '#2f2b3a';
  },
};

const bar: StyleHook = {
  post(ctx, L, lod) {
    // « carotte » rouge du tabac, à l'angle
    const x = L.x1 - 4;
    const y = ft(L, 0) - 6;
    if (y - 4 < L.facadeTop + L.cornice) return;
    polyFS(ctx, [x, y - 4, x + 2.4, y, x, y + 4, x - 2.4, y], '#cc4238');
    if (lod === 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2);
      drawLettering(ctx, 'TABAC', 0, 0, 6.4, 1.6, '#fbf6ea', lod);
      ctx.restore();
    }
  },
};

export const STYLE_HOOKS: Partial<Record<BuildingStyle, StyleHook>> = {
  church,
  townhall,
  station,
  museum,
  theatre,
  cinema,
  hospital,
  police,
  bank,
  school,
  hotel,
  warehouse,
  factory,
  garage,
  shed,
  greenhouse,
  pharmacy,
  postoffice,
  jeweler,
  bar,
};
