// Bâtiments en vue oblique : toit (emprise décalée de -height) + façade sud.
//
//   y = f.y - H            ┌────────────── toit ──────────────┐
//                          │   (profondeur = f.h)              │
//   y = f.y + f.h - H      ├──────────── façade sud ───────────┤
//                          │  étages, fenêtres, portes, vitrine│
//   y = f.y + f.h (sol)    └───────────────────────────────────┘
//
// Le plan de façade (fenêtres, portes, vitrine, enseigne…) est calculé une fois par entité et mis
// en cache (WeakMap) : une même maison est redessinée dans plusieurs tuiles et niveaux.
// Les styles spéciaux (église, gare, musée…) sont dans buildingStyles.ts.

import type { BuildingEntity, BuildingFeature, BuildingStyle, Color } from '../types';
import { BUILDING_TOP_EXTRA } from './bounds';
import { type Goods, type Win, type WinStyle, drawAwning, drawChimney, drawDoor, drawShopfront, drawSign, drawWindows } from './buildingParts';
import { STYLE_HOOKS } from './buildingStyles';
import type { Lod } from './lod';
import { COLOR_HEX, INK, MAT, ROOF_DARK, ROOF_HEX, ROOF_LIGHT, SHADOW_LIGHT, WALL_DARK, WALL_HEX, WALL_LIGHT, mix } from './palette';
import {
  brickTex,
  getPattern,
  glassRoofTex,
  planksTex,
  resBucket,
  seamsTex,
  setPatternFill,
  slateTex,
  speckleTex,
  stoneTex,
  tilesTex,
} from './patterns';
import { fitText } from './text';
import { type Ctx, boxFS, deviceScale, quickRand } from './util';

export type RoofKind = 'tiles' | 'slate' | 'zinc' | 'flat' | 'glass' | 'sheds' | 'corrugated' | 'planks' | 'mansard';
export type WallTex = 'plain' | 'stone' | 'brick' | 'planks';

export interface Balcony {
  x0: number;
  x1: number;
  y: number;
}

export interface Layout {
  e: BuildingEntity;
  x0: number;
  x1: number;
  W: number;
  yN: number;
  yS: number;
  H: number;
  D: number;
  roofTop: number;
  facadeTop: number;
  /** Plus petite ordonnée autorisée (emprise). */
  topLimit: number;
  floors: number;
  gfH: number;
  upH: number;
  cornice: number;
  cols: number[];
  winW: number;
  winH: number;
  winStyle: WinStyle;
  windows: Win[];
  doors: { x: number; w: number; h: number; color: string; open: boolean; arched?: boolean; double?: boolean; glass?: boolean }[];
  shop?: { x0: number; x1: number; yTop: number; yBottom: number; paint: string; goods: Goods; broken?: number; lit?: boolean; doorOpen?: boolean; doorAt?: number };
  awnings: { x0: number; x1: number; y: number; d: number; color: string }[];
  sign?: { text: string; cx: number; cy: number; w: number; h: number; bg: string; fg: string; serif?: boolean; border?: boolean };
  balconies: Balcony[];
  posters: { x: number; y: number; text?: string; color: string }[];
  graffiti: { x: number; y: number; text?: string; color: string }[];
  roof: RoofKind;
  hip: number;
  chimneys: { x: number; y: number; w: number; h: number }[];
  dormers: number[];
  wallTex: WallTex;
  wall: string;
  wallDark: string;
  wallLight: string;
  roofC: string;
  roofDark: string;
  roofLight: string;
  seed: number;
  rnd: () => number;
  /** Données libres des styles spéciaux. */
  extra: Record<string, number>;
}

const cache = new WeakMap<BuildingEntity, Layout>();

const SHUTTERS = ['#5b8a5a', '#5a7fa6', '#a8473a', '#7c8f9c', '#8e8a3e', '#efe9dc', '#4f7a8a'];
const DOORS = ['#2f5a46', '#7a2f3a', '#2f4a6e', '#5a3b2a', '#c0473d', '#3a3f45', '#4f7a8a'];
const SHOP_PAINT = ['#2f5a46', '#6e2f3a', '#2f3f5f', '#3a3330', '#8a5a2e', '#4a6d7a'];
const CURTAINS = ['#f6efe0', '#e8a0a0', '#f0d080', '#a8c8e0', '#c8e0b0', '#f6efe0'];

const COMMERCIAL = new Set<BuildingStyle>(['shop', 'cafe', 'bakery', 'jeweler', 'pharmacy', 'bar', 'postoffice']);

function goodsFor(e: BuildingEntity): Goods {
  switch (e.style) {
    case 'bakery':
      return 'bread';
    case 'jeweler':
      return 'jewels';
    case 'pharmacy':
      return 'bottles';
    case 'cafe':
    case 'bar':
      return 'tables';
    case 'postoffice':
      return 'mail';
  }
  const s = (e.sign ?? '').toUpperCase();
  if (s.includes('LIBRAIR') || s.includes('LIVRE')) return 'books';
  if (s.includes('FLEUR')) return 'flowers';
  if (s.includes('BOUCH') || s.includes('CHARCUT')) return 'meat';
  if (s.includes('PHARMA')) return 'bottles';
  if (s.includes('PAIN') || s.includes('BOULANG') || s.includes('PÂTISS')) return 'bread';
  return 'boxes';
}

function roofFor(e: BuildingEntity, r: () => number): RoofKind {
  const warm = ['red', 'orange', 'brown', 'beige', 'pink', 'yellow'].includes(e.roof);
  switch (e.style) {
    case 'apartment':
      return r() < 0.7 ? 'flat' : 'zinc';
    case 'townhouse':
      return warm ? 'tiles' : 'mansard';
    case 'hotel':
    case 'theatre':
      return 'mansard';
    case 'bank':
    case 'police':
    case 'hospital':
    case 'cinema':
    case 'museum':
      return 'flat';
    case 'garage':
      return 'corrugated';
    case 'station':
    case 'greenhouse':
      return 'glass';
    case 'factory':
      return 'sheds';
    case 'warehouse':
      return 'corrugated';
    case 'shed':
      return 'planks';
    case 'church':
    case 'townhall':
      return 'slate';
    default:
      return warm ? 'tiles' : r() < 0.5 ? 'slate' : 'zinc';
  }
}

function wallTexFor(style: BuildingStyle): WallTex {
  switch (style) {
    case 'bank':
    case 'museum':
    case 'townhall':
    case 'church':
    case 'station':
      return 'stone';
    case 'factory':
    case 'warehouse':
    case 'school':
      return 'brick';
    case 'shed':
      return 'planks';
    default:
      return 'plain';
  }
}

/** Plan de façade (mis en cache). */
export function layoutOf(e: BuildingEntity): Layout {
  let L = cache.get(e);
  if (L) return L;
  L = computeLayout(e);
  cache.set(e, L);
  return L;
}

function computeLayout(e: BuildingEntity): Layout {
  const f = e.footprint;
  const H = Math.max(10, e.height);
  const r = quickRand((e.seed * 2654435761) >>> 0 || 1);
  const x0 = f.x;
  const x1 = f.x + f.w;
  const W = f.w;
  const yN = f.y;
  const yS = f.y + f.h;
  const extra = BUILDING_TOP_EXTRA[e.style] ?? 12;
  const cornice = Math.max(1.6, Math.min(5, H * 0.07));
  let floors = H >= 40 ? 1 + Math.floor((H - 28 + 6) / 24) : 1;
  if (e.style === 'shed' || e.style === 'greenhouse' || e.style === 'garage' || e.style === 'warehouse' || e.style === 'factory') floors = 1;
  const gfH = floors === 1 ? H - cornice : Math.min(28, (H - cornice) * 0.45);
  const upH = floors > 1 ? (H - cornice - gfH) / (floors - 1) : 0;
  const wall = WALL_HEX[e.wall];
  const L: Layout = {
    e,
    x0,
    x1,
    W,
    yN,
    yS,
    H,
    D: f.h,
    roofTop: yN - H,
    facadeTop: yS - H,
    topLimit: yN - H - extra + 0.6,
    floors,
    gfH,
    upH,
    cornice,
    cols: [],
    winW: 8,
    winH: 12,
    winStyle: { frame: MAT.windowFrame, muntins: true, sill: true },
    windows: [],
    doors: [],
    awnings: [],
    balconies: [],
    posters: [],
    graffiti: [],
    roof: roofFor(e, r),
    hip: 0,
    chimneys: [],
    dormers: [],
    wallTex: wallTexFor(e.style),
    wall,
    wallDark: WALL_DARK[e.wall],
    wallLight: WALL_LIGHT[e.wall],
    roofC: ROOF_HEX[e.roof],
    roofDark: ROOF_DARK[e.roof],
    roofLight: ROOF_LIGHT[e.roof],
    seed: e.seed,
    rnd: r,
    extra: {},
  };

  // Colonnes de fenêtres
  const spacing = 17 + Math.floor(r() * 6);
  const margin = Math.min(9, W * 0.12);
  const n = Math.max(1, Math.floor((W - 2 * margin + 4) / spacing));
  for (let i = 0; i < n; i++) L.cols.push(x0 + W / 2 + (i - (n - 1) / 2) * spacing);
  L.winW = Math.min(spacing * 0.46, 7 + r() * 2.2, W * 0.3);
  L.winH = floors > 1 ? Math.min(upH * 0.58, L.winW * 1.75) : Math.min(gfH * 0.45, L.winW * 1.6);
  const shutters = r() < 0.45;
  L.winStyle = {
    frame: r() < 0.82 ? MAT.windowFrame : r() < 0.5 ? '#3f5a4a' : '#6b4a35',
    shutter: shutters ? SHUTTERS[Math.floor(r() * SHUTTERS.length)] : undefined,
    muntins: r() < 0.75,
    sill: true,
  };
  const arched = r() < 0.22;
  const flowerRate = r() < 0.5 ? 0.3 : 0.05;
  const curtainRate = 0.45;

  // Étages supérieurs
  for (let k = 1; k < floors; k++) {
    const fy = floorTop(L, k);
    for (const cx of L.cols) {
      L.windows.push({
        x: cx - L.winW / 2,
        y: fy + (upH - L.winH) * 0.45,
        w: L.winW,
        h: L.winH,
        state: 'normal',
        arched: arched && k === 1,
        flowers: r() < flowerRate,
        curtain: r() < curtainRate ? CURTAINS[Math.floor(r() * CURTAINS.length)] : undefined,
      });
    }
  }

  // Rez-de-chaussée
  const doorColor = DOORS[Math.floor(r() * DOORS.length)];
  const hook = STYLE_HOOKS[e.style];
  if (COMMERCIAL.has(e.style)) {
    const sx0 = x0 + Math.min(4, W * 0.05);
    const sx1 = x1 - Math.min(4, W * 0.05);
    const signH = Math.min(6.5, gfH * 0.24);
    const shopTop = yS - gfH + signH + 2.2;
    const paint = SHOP_PAINT[Math.floor(r() * SHOP_PAINT.length)];
    L.shop = { x0: sx0, x1: sx1, yTop: shopTop, yBottom: yS - 0.6, paint, goods: goodsFor(e), doorAt: r() < 0.5 ? 0.5 : r() < 0.5 ? 0.2 : 0.8 };
    if (e.sign) {
      L.sign = { text: e.sign, cx: (sx0 + sx1) / 2, cy: yS - gfH + 1.2 + signH / 2, w: sx1 - sx0, h: signH, bg: paint, fg: '#f7e7b0', border: true };
    }
    if (e.style !== 'jeweler' && e.style !== 'postoffice' && e.style !== 'pharmacy') {
      const awn = ['red', 'green', 'blue', 'yellow', 'orange', 'navy'][Math.floor(r() * 6)] as Color;
      L.awnings.push({ x0: sx0 - 0.5, x1: sx1 + 0.5, y: shopTop - 0.6, d: Math.min(5, gfH * 0.18), color: COLOR_HEX[awn] });
    }
  } else if (!hook?.customGround) {
    // résidentiel : porte + fenêtres
    const dw = Math.min(8.5, W * 0.3);
    const dh = Math.min(gfH - 4, 17);
    let dx: number;
    if (e.style === 'townhouse') dx = r() < 0.5 ? x0 + W * 0.22 : x1 - W * 0.22;
    else dx = L.cols.length >= 3 && r() < 0.6 ? x0 + W / 2 : L.cols[Math.floor(r() * L.cols.length)] ?? x0 + W / 2;
    L.doors.push({ x: dx - dw / 2, w: dw, h: dh, color: doorColor, open: false, arched: r() < 0.3, glass: r() < 0.3 });
    const gwH = Math.min(gfH * 0.48, L.winW * 1.6);
    for (const cx of L.cols) {
      if (Math.abs(cx - dx) < dw / 2 + L.winW / 2 + 2.5) continue;
      L.windows.push({
        x: cx - L.winW / 2,
        y: yS - gfH + (gfH - gwH) * 0.42,
        w: L.winW,
        h: gwH,
        state: 'normal',
        curtain: r() < curtainRate ? CURTAINS[Math.floor(r() * CURTAINS.length)] : undefined,
      });
    }
  }

  // Toiture : cheminées, lucarnes
  const pitched = L.roof === 'tiles' || L.roof === 'slate' || L.roof === 'zinc' || L.roof === 'mansard';
  if (pitched) L.hip = r() < 0.5 ? Math.min(f.h * 0.42, W * 0.22) : 0;
  if (pitched || L.roof === 'flat') {
    const nc = W < 50 ? 1 : W < 140 ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 2);
    for (let i = 0; i < nc; i++) {
      const cw = 3 + r() * 2;
      const cx = x0 + W * (0.15 + 0.7 * ((i + 0.5) / nc)) + (r() - 0.5) * 6;
      const cy = L.roofTop + f.h * (pitched ? 0.42 : 0.3 + r() * 0.4);
      const ch = Math.min(5 + r() * 4, cy - L.topLimit - 1.5);
      if (ch > 2) L.chimneys.push({ x: cx - cw / 2, y: cy, w: cw, h: ch });
    }
  }
  if ((L.roof === 'mansard' || (e.style === 'townhouse' && pitched)) && f.h > 24) {
    for (const cx of L.cols) L.dormers.push(cx);
  }

  hook?.layout?.(L);
  applyFeatures(L, e.features ?? []);
  return L;
}

/** Ordonnée du haut de l'étage k (0 = rez-de-chaussée). */
export function floorTop(L: Layout, k: number): number {
  if (k === 0) return L.yS - L.gfH;
  return L.yS - L.gfH - k * L.upH;
}

function nearestWindow(L: Layout, x: number, floor: number): Win | undefined {
  let best: Win | undefined;
  let bd = Infinity;
  const top = floorTop(L, floor);
  const bottom = floor === 0 ? L.yS : top + L.upH;
  for (const w of L.windows) {
    const cy = w.y + w.h / 2;
    if (cy < top - 0.5 || cy > bottom + 0.5) continue;
    const d = Math.abs(w.x + w.w / 2 - x);
    if (d < bd) {
      bd = d;
      best = w;
    }
  }
  return best;
}

function applyFeatures(L: Layout, features: readonly BuildingFeature[]): void {
  for (const ft of features) {
    const x = L.x0 + Math.max(0, Math.min(1, ft.at)) * L.W;
    const isWin = ft.kind === 'openWindow' || ft.kind === 'brokenWindow' || ft.kind === 'litWindow';
    const floor = Math.max(0, Math.min(L.floors - 1, ft.floor ?? (isWin || ft.kind === 'balcony' ? (L.floors > 1 ? 1 : 0) : 0)));
    switch (ft.kind) {
      case 'openWindow':
      case 'brokenWindow':
      case 'litWindow': {
        const state = ft.kind === 'openWindow' ? 'open' : ft.kind === 'brokenWindow' ? 'broken' : 'lit';
        if (floor === 0 && L.shop) {
          if (state === 'broken') L.shop.broken = (x - L.x0) / L.W;
          else if (state === 'lit') L.shop.lit = true;
          else L.shop.doorOpen = true;
          break;
        }
        const w = nearestWindow(L, x, floor);
        if (w) w.state = state;
        else {
          // pas de fenêtre à cet étage : on en perce une
          const fy = floorTop(L, floor);
          const fh = floor === 0 ? L.gfH : L.upH;
          L.windows.push({ x: x - L.winW / 2, y: fy + (fh - L.winH) * 0.45, w: L.winW, h: L.winH, state });
        }
        break;
      }
      case 'openDoor': {
        if (L.shop) L.shop.doorOpen = true;
        let best = L.doors[0];
        for (const d of L.doors) if (Math.abs(d.x + d.w / 2 - x) < Math.abs(best.x + best.w / 2 - x)) best = d;
        if (best) best.open = true;
        break;
      }
      case 'awning': {
        const c = COLOR_HEX[ft.color ?? 'red'];
        if (floor === 0 && L.shop && x >= L.shop.x0 - 4 && x <= L.shop.x1 + 4) {
          L.awnings = L.awnings.filter((a) => !(a.x0 <= x && a.x1 >= x));
          L.awnings.push({ x0: L.shop.x0 - 0.5, x1: L.shop.x1 + 0.5, y: L.shop.yTop - 0.6, d: Math.min(5, L.gfH * 0.18), color: c });
        } else {
          const w = nearestWindow(L, x, floor);
          const cx = w ? w.x + w.w / 2 : x;
          const ww = w ? w.w : L.winW;
          const top = w ? w.y : floorTop(L, floor) + 3;
          L.awnings.push({ x0: Math.max(L.x0, cx - ww / 2 - 2.5), x1: Math.min(L.x1, cx + ww / 2 + 2.5), y: top - 1.2, d: Math.min(4.5, ww * 0.5), color: c });
        }
        break;
      }
      case 'balcony': {
        const fl = Math.max(1, floor);
        if (fl >= L.floors) break;
        const w = nearestWindow(L, x, fl);
        const cx = w ? w.x + w.w / 2 : x;
        const half = (w ? w.w : L.winW) / 2 + 3.5;
        L.balconies.push({ x0: Math.max(L.x0 + 0.5, cx - half), x1: Math.min(L.x1 - 0.5, cx + half), y: w ? w.y + w.h : floorTop(L, fl) + L.upH - 1 });
        break;
      }
      case 'graffiti': {
        const fy = floorTop(L, floor);
        const fh = floor === 0 ? L.gfH : L.upH;
        L.graffiti.push({ x, y: fy + fh * 0.62, text: ft.text, color: COLOR_HEX[ft.color ?? 'purple'] });
        break;
      }
      case 'poster': {
        const fy = floorTop(L, floor);
        const fh = floor === 0 ? L.gfH : L.upH;
        L.posters.push({ x, y: fy + fh * 0.5, text: ft.text, color: COLOR_HEX[ft.color ?? 'yellow'] });
        break;
      }
    }
  }
}

/* ----------------------------------------------------------------------------
 * Dessin
 * ------------------------------------------------------------------------- */

export function drawBuilding(ctx: Ctx, e: BuildingEntity, lod: Lod): void {
  const L = layoutOf(e);
  if (lod === 2) {
    drawLod2(ctx, L);
    return;
  }
  const lw = lod === 0 ? 0.8 : 1.1;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = lw;
  const hook = STYLE_HOOKS[e.style];

  // ombre portée (est) et au pied
  ctx.fillStyle = SHADOW_LIGHT;
  ctx.beginPath();
  ctx.moveTo(L.x1, L.facadeTop + 2);
  ctx.lineTo(L.x1 + 5, L.facadeTop + 6);
  ctx.lineTo(L.x1 + 5, L.yS + 3);
  ctx.lineTo(L.x0 + 2, L.yS + 3);
  ctx.lineTo(L.x0, L.yS);
  ctx.lineTo(L.x1, L.yS);
  ctx.closePath();
  ctx.fill();

  drawRoof(ctx, L, lod, lw);
  hook?.roof?.(ctx, L, lod);
  drawFacadeWall(ctx, L, lod, lw);
  hook?.pre?.(ctx, L, lod);
  drawFacadeContent(ctx, L, lod, lw);
  hook?.post?.(ctx, L, lod);
  // contour de la façade (par-dessus)
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  ctx.strokeRect(L.x0, L.facadeTop, L.W, L.H);
  hook?.top?.(ctx, L, lod);
}

function drawLod2(ctx: Ctx, L: Layout): void {
  ctx.fillStyle = L.roofC;
  ctx.fillRect(L.x0, L.roofTop, L.W, L.D);
  ctx.fillStyle = L.wall;
  ctx.fillRect(L.x0, L.facadeTop, L.W, L.H);
  // quelques fenêtres (une sur deux), un seul remplissage
  ctx.fillStyle = 'rgba(70, 85, 95, 0.55)';
  ctx.beginPath();
  for (let i = 0; i < L.windows.length; i += 2) {
    const w = L.windows[i];
    ctx.rect(w.x, w.y, w.w, w.h);
  }
  if (L.shop) ctx.rect(L.shop.x0, L.shop.yTop, L.shop.x1 - L.shop.x0, L.shop.yBottom - L.shop.yTop);
  ctx.fill();
  const hook = STYLE_HOOKS[L.e.style];
  hook?.lod2?.(ctx, L);
}

/* ---------- Toit ---------- */

function roofMaterial(ctx: Ctx, L: Layout, lod: Lod): CanvasPattern | string {
  if (lod !== 0) return L.roofC;
  const res = resBucket(deviceScale(ctx));
  const c = L.e.roof;
  let pat: CanvasPattern | null = null;
  switch (L.roof) {
    case 'tiles':
      pat = getPattern(ctx, `roof-tiles|${c}`, res, () => tilesTex(ROOF_HEX[c], ROOF_DARK[c], ROOF_LIGHT[c]));
      break;
    case 'slate':
      pat = getPattern(ctx, `roof-slate|${c}`, res, () => slateTex(ROOF_HEX[c], ROOF_DARK[c]));
      break;
    case 'zinc':
    case 'mansard':
      pat = getPattern(ctx, `roof-zinc|${c}`, res, () => seamsTex(ROOF_HEX[c], ROOF_DARK[c], ROOF_LIGHT[c], 3));
      break;
    case 'corrugated':
      pat = getPattern(ctx, `roof-corr|${c}`, res, () => seamsTex(ROOF_HEX[c], ROOF_DARK[c], ROOF_LIGHT[c], 1.5));
      break;
    case 'planks':
      pat = getPattern(ctx, `roof-planks|${c}`, res, () => planksTex(ROOF_HEX[c], ROOF_DARK[c], ROOF_DARK[c], 2.5, 12, true));
      break;
    case 'flat':
      pat = getPattern(ctx, `roof-flat|${c}`, res, () => speckleTex(mix(ROOF_HEX[c], '#d8d2c4', 0.55), [ROOF_DARK[c], ROOF_LIGHT[c]], 0.08, 0.35, 16));
      break;
    case 'glass':
      pat = getPattern(ctx, `roof-glass`, res, () => glassRoofTex('#b4d0da', '#e9eef0', '#e6f2f5'));
      break;
    case 'sheds':
      return L.roofC;
  }
  if (!pat) return L.roofC;
  setPatternFill(ctx, pat, L.x0, L.roofTop);
  return pat;
}

function fillWith(ctx: Ctx, m: CanvasPattern | string): void {
  if (typeof m !== 'string') ctx.fillStyle = m;
  else ctx.fillStyle = m;
  ctx.fill();
}

function drawRoof(ctx: Ctx, L: Layout, lod: Lod, lw: number): void {
  const { x0, x1, W, roofTop: yt, facadeTop: yb, D } = L;
  const mat = roofMaterial(ctx, L, lod);
  switch (L.roof) {
    case 'tiles':
    case 'slate':
    case 'zinc': {
      const ry = yt + D * 0.42;
      const d = L.hip;
      // pan sud
      ctx.beginPath();
      ctx.moveTo(x0, yb);
      ctx.lineTo(x1, yb);
      ctx.lineTo(x1 - d, ry);
      ctx.lineTo(x0 + d, ry);
      ctx.closePath();
      fillWith(ctx, mat);
      ctx.stroke();
      // pan nord (plus sombre)
      ctx.beginPath();
      ctx.moveTo(x0, yt);
      ctx.lineTo(x1, yt);
      ctx.lineTo(x1 - d, ry);
      ctx.lineTo(x0 + d, ry);
      ctx.closePath();
      fillWith(ctx, mat);
      ctx.fillStyle = 'rgba(40, 25, 20, 0.2)';
      ctx.fill();
      ctx.stroke();
      if (d > 0) {
        // croupes est (ombre) et ouest (lumière)
        ctx.beginPath();
        ctx.moveTo(x1, yt);
        ctx.lineTo(x1 - d, ry);
        ctx.lineTo(x1, yb);
        ctx.closePath();
        fillWith(ctx, mat);
        ctx.fillStyle = 'rgba(40, 25, 20, 0.12)';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x0, yt);
        ctx.lineTo(x0 + d, ry);
        ctx.lineTo(x0, yb);
        ctx.closePath();
        fillWith(ctx, mat);
        ctx.fillStyle = 'rgba(255, 250, 235, 0.14)';
        ctx.fill();
        ctx.stroke();
      }
      // faîtage
      ctx.lineWidth = lw * 1.4;
      ctx.beginPath();
      ctx.moveTo(x0 + d, ry);
      ctx.lineTo(x1 - d, ry);
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    }
    case 'mansard': {
      const inset = Math.min(D * 0.28, W * 0.18, 10);
      ctx.beginPath();
      ctx.rect(x0, yt, W, D);
      fillWith(ctx, mat);
      ctx.stroke();
      // terrasson (haut du toit) plus clair
      ctx.fillStyle = L.roofLight;
      ctx.beginPath();
      ctx.rect(x0 + inset, yt + inset * 0.7, W - 2 * inset, D - inset * 1.7);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.moveTo(x0, yt);
      ctx.lineTo(x0 + inset, yt + inset * 0.7);
      ctx.moveTo(x1, yt);
      ctx.lineTo(x1 - inset, yt + inset * 0.7);
      ctx.moveTo(x0, yb);
      ctx.lineTo(x0 + inset, yb - inset);
      ctx.moveTo(x1, yb);
      ctx.lineTo(x1 - inset, yb - inset);
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    }
    case 'flat': {
      ctx.beginPath();
      ctx.rect(x0, yt, W, D);
      fillWith(ctx, mat);
      ctx.stroke();
      // acrotère
      const p = Math.min(2.2, D * 0.08, W * 0.06);
      ctx.strokeStyle = L.wallLight;
      ctx.lineWidth = p;
      ctx.strokeRect(x0 + p / 2, yt + p / 2, W - p, D - p);
      ctx.strokeStyle = INK;
      ctx.lineWidth = lw * 0.6;
      ctx.strokeRect(x0 + p, yt + p, W - 2 * p, D - 2 * p);
      ctx.lineWidth = lw;
      drawRoofKit(ctx, L, lod, lw, p);
      break;
    }
    case 'glass': {
      ctx.beginPath();
      ctx.rect(x0, yt, W, D);
      fillWith(ctx, mat);
      ctx.stroke();
      // arcs de la charpente métallique (verrière en berceau)
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath();
      const ribs = Math.max(2, Math.round(W / 24));
      for (let i = 1; i < ribs; i++) {
        const x = x0 + (W * i) / ribs;
        ctx.moveTo(x, yt);
        ctx.lineTo(x, yb);
      }
      ctx.moveTo(x0, yt + D * 0.5);
      ctx.lineTo(x1, yt + D * 0.5);
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    }
    case 'sheds': {
      // toit en sheds : bandes alternées vitrage / tôle
      const n = Math.max(2, Math.round(D / 12));
      const h = D / n;
      for (let i = 0; i < n; i++) {
        const y = yt + i * h;
        ctx.fillStyle = L.roofC;
        ctx.fillRect(x0, y, W, h * 0.62);
        ctx.fillStyle = '#b4d0da';
        ctx.fillRect(x0, y + h * 0.62, W, h * 0.38);
      }
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const y = yt + i * h;
        ctx.moveTo(x0, y + h * 0.62);
        ctx.lineTo(x1, y + h * 0.62);
        ctx.moveTo(x0, y + h);
        ctx.lineTo(x1, y + h);
      }
      ctx.stroke();
      ctx.lineWidth = lw;
      ctx.strokeRect(x0, yt, W, D);
      break;
    }
    default: {
      ctx.beginPath();
      ctx.rect(x0, yt, W, D);
      fillWith(ctx, mat);
      ctx.stroke();
    }
  }
  // avant-toit : bande sombre au bord sud
  if (L.roof !== 'flat' && L.roof !== 'glass') {
    ctx.fillStyle = L.roofDark;
    ctx.fillRect(x0, yb - Math.min(1.8, D * 0.08), W, Math.min(1.8, D * 0.08));
  }
  // lucarnes
  if (L.dormers.length && D > 24) {
    const dw = Math.min(L.winW, 7);
    const dh = Math.min(D * 0.32, 9);
    const by = yb - 1.5;
    for (const cx of L.dormers) {
      boxFS(ctx, cx - dw / 2 - 0.8, by - dh, dw + 1.6, dh, L.wallLight);
      ctx.fillStyle = MAT.glass;
      ctx.fillRect(cx - dw / 2 + 0.4, by - dh + 1.8, dw - 0.8, dh - 2.4);
      ctx.beginPath();
      ctx.moveTo(cx - dw / 2 - 1.6, by - dh + 0.2);
      ctx.lineTo(cx, by - dh - 3.2);
      ctx.lineTo(cx + dw / 2 + 1.6, by - dh + 0.2);
      ctx.closePath();
      ctx.fillStyle = L.roofDark;
      ctx.fill();
      ctx.stroke();
    }
  }
  for (const c of L.chimneys) drawChimney(ctx, c.x, c.y, c.w, c.h, c.y > yt + D * 0.5 ? L.wall : mix(L.wall, '#b5603f', 0.5), lod);
}

/* ---------- Équipements des toits plats ---------- */

type KitKind = 'vent' | 'ac' | 'skylight' | 'tank' | 'hatch';
interface KitItem {
  kind: KitKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

const KIT_SIZE: Record<KitKind, [number, number]> = {
  vent: [8, 5],
  ac: [7, 5],
  skylight: [11, 6],
  tank: [10, 9],
  hatch: [5, 4],
};
const KIT_ORDER: KitKind[] = ['vent', 'ac', 'skylight', 'tank', 'hatch', 'ac', 'vent', 'skylight'];
const roofKits = new WeakMap<Layout, KitItem[]>();

/**
 * Plan des équipements d'un toit plat (aérations, climatiseurs, verrières, réservoir, trappe) :
 * leur nombre suit la surface du toit, leurs places évitent cheminées et décors propres au style
 * (verrière du musée, hélistation de l'hôpital, balustrade de la banque). Calculé une fois.
 */
function roofKitOf(L: Layout, p: number): KitItem[] {
  let kit = roofKits.get(L);
  if (kit) return kit;
  kit = [];
  roofKits.set(L, kit);
  const ix0 = L.x0 + p + 2;
  const ix1 = L.x1 - p - 2;
  const iy0 = L.roofTop + p + 2;
  const iy1 = L.roofTop + L.D - p - 5;
  if (ix1 - ix0 < 14 || iy1 - iy0 < 8) return kit;
  const busy: { x: number; y: number; w: number; h: number }[] = L.chimneys.map((c) => ({ x: c.x - 1, y: c.y - c.h - 1, w: c.w + 2, h: c.h + 3 }));
  const st = L.e.style;
  if (st === 'museum') busy.push({ x: L.x0 + L.W * 0.3 - 2, y: L.roofTop + L.D * 0.25 - 2, w: L.W * 0.4 + 4, h: L.D * 0.5 + 4 });
  if (st === 'hospital') {
    const r = Math.min(L.D * 0.32, 22) + 2;
    busy.push({ x: L.x0 + L.W * 0.72 - r, y: L.roofTop + L.D / 2 - r, w: 2 * r, h: 2 * r });
  }
  const n = Math.max(1, Math.min(6, Math.floor(((ix1 - ix0) * (iy1 - iy0)) / 2600)));
  const r = quickRand(L.seed * 7 + 13);
  const start = Math.floor(r() * KIT_ORDER.length);
  for (let i = 0; i < n; i++) {
    const kind = KIT_ORDER[(start + i) % KIT_ORDER.length];
    const [w, h] = KIT_SIZE[kind];
    if (w > ix1 - ix0 || h > iy1 - iy0) continue;
    for (let t = 0; t < 8; t++) {
      const x = ix0 + r() * (ix1 - ix0 - w);
      const y = iy0 + r() * (iy1 - iy0 - h);
      const hit = [...busy, ...kit].some((b) => x < b.x + b.w + 2 && b.x < x + w + 2 && y < b.y + b.h + 2 && b.y < y + h + 2);
      if (hit) continue;
      kit.push({ kind, x, y, w, h });
      break;
    }
  }
  return kit;
}

function drawRoofKit(ctx: Ctx, L: Layout, lod: Lod, lw: number, p: number): void {
  const kit = roofKitOf(L, p);
  if (!kit.length) return;
  // ombres portées (vers le sud-est), un seul remplissage
  ctx.fillStyle = SHADOW_LIGHT;
  ctx.beginPath();
  for (const k of kit) ctx.rect(k.x + 1.2, k.y + 1.2, k.w, k.h);
  ctx.fill();
  if (lod !== 0) {
    // niveau 1 : simples blocs
    ctx.fillStyle = '#b9bcbd';
    ctx.beginPath();
    for (const k of kit) ctx.rect(k.x, k.y, k.w, k.h);
    ctx.fill();
    return;
  }
  ctx.lineWidth = lw * 0.8;
  for (const k of kit) {
    const { x, y, w, h } = k;
    switch (k.kind) {
      case 'vent':
        boxFS(ctx, x, y, w, h, '#b9bcbd');
        ctx.fillStyle = '#7d8285';
        for (let i = 0; i < 3; i++) ctx.fillRect(x + 1.2, y + 1 + i * 1.3, w - 2.4, 0.55);
        break;
      case 'ac':
        boxFS(ctx, x, y, w, h, '#d4d6d3');
        ctx.fillStyle = '#7d8285';
        ctx.beginPath();
        ctx.arc(x + w * 0.62, y + h / 2, h * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'skylight':
        boxFS(ctx, x, y, w, h, MAT.glass);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, y + h - 1);
        ctx.lineTo(x + w * 0.45, y + 1);
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.stroke();
        break;
      case 'tank': {
        // réservoir cylindrique vu de haut-trois-quarts
        boxFS(ctx, x + 1, y + 2, w - 2, h - 2, '#9aa0a4');
        ctx.fillStyle = '#c9cccd';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 2, w / 2 - 1, 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'hatch':
        boxFS(ctx, x, y, w, h, mix(L.roofC, INK, 0.25));
        ctx.fillStyle = mix(L.roofC, '#ffffff', 0.2);
        ctx.fillRect(x + 0.8, y + 0.8, w - 1.6, 0.7);
        break;
    }
  }
  ctx.lineWidth = lw;
}

/* ---------- Mur ---------- */

function drawFacadeWall(ctx: Ctx, L: Layout, lod: Lod, lw: number): void {
  const { x0, W, facadeTop, H, yS } = L;
  ctx.fillStyle = L.wall;
  ctx.fillRect(x0, facadeTop, W, H);
  if (lod === 0 && L.wallTex !== 'plain') {
    const res = resBucket(deviceScale(ctx));
    const c = L.e.wall;
    let pat: CanvasPattern | null = null;
    if (L.wallTex === 'stone') pat = getPattern(ctx, `wall-stone|${c}`, res, () => stoneTex(WALL_HEX[c], WALL_DARK[c]));
    else if (L.wallTex === 'brick') pat = getPattern(ctx, `wall-brick|${c}`, res, () => brickTex(WALL_HEX[c], WALL_LIGHT[c], WALL_DARK[c]));
    else if (L.wallTex === 'planks') pat = getPattern(ctx, `wall-planks|${c}`, res, () => planksTex(WALL_HEX[c], WALL_DARK[c], WALL_DARK[c], 2.5, 16, true));
    if (pat) {
      setPatternFill(ctx, pat, x0, facadeTop);
      ctx.fillRect(x0, facadeTop, W, H);
    }
  }
  // corniche sous le toit
  ctx.fillStyle = L.wallLight;
  ctx.fillRect(x0, facadeTop, W, L.cornice);
  ctx.fillStyle = 'rgba(40, 25, 20, 0.16)';
  ctx.fillRect(x0, facadeTop + L.cornice, W, Math.min(1.4, L.cornice * 0.5));
  // bandeaux d'étage
  if (L.floors > 1) {
    ctx.fillStyle = L.wallDark;
    for (let k = 1; k < L.floors; k++) ctx.fillRect(x0, floorTop(L, k - 1) - 0.5, W, 0.9);
  }
  // soubassement
  ctx.fillStyle = L.wallDark;
  ctx.fillRect(x0, yS - 1.8, W, 1.8);
  // arêtes : ombre côté est
  ctx.fillStyle = 'rgba(40, 25, 20, 0.08)';
  ctx.fillRect(L.x1 - Math.min(4, W * 0.06), facadeTop, Math.min(4, W * 0.06), H);
  void lw;
}

/* ---------- Contenu de façade ---------- */

function drawFacadeContent(ctx: Ctx, L: Layout, lod: Lod, lw: number): void {
  const fine = lod === 0;
  // balcons : dalle derrière, garde-corps devant les fenêtres
  drawWindows(ctx, L.windows, L.winStyle, lod, lw);
  for (const b of L.balconies) drawBalcony(ctx, b, lod);
  for (const d of L.doors) drawDoor(ctx, d.x, L.yS - 0.4, d.w, d.h, d.color, d.open, lod, { arched: d.arched, double: d.double, glass: d.glass, transom: true });
  if (L.shop) {
    const s = L.shop;
    drawShopfront(ctx, s.x0, s.x1, s.yTop, s.yBottom, s.paint, s.goods, lod, { broken: s.broken, lit: s.lit, doorOpen: s.doorOpen, doorAt: s.doorAt }, L.seed);
  }
  if (L.sign) {
    const s = L.sign;
    drawSign(ctx, s.text, s.cx, s.cy, s.w, s.h, s.bg, s.fg, lod, { border: s.border, serif: s.serif });
  }
  for (const a of L.awnings) drawAwning(ctx, a.x0, a.x1, a.y, a.d, a.color, lod);
  for (const p of L.posters) {
    const pw = 6;
    const ph = 8;
    boxFS(ctx, p.x - pw / 2, p.y - ph / 2, pw, ph, '#fbf3dc');
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - pw / 2 + 0.6, p.y - ph / 2 + 0.6, pw - 1.2, ph * 0.45);
    if (fine) {
      if (p.text) fitText(ctx, p.text, p.x, p.y + ph * 0.22, pw - 0.8, 1.8, INK);
      else {
        ctx.fillStyle = INK;
        ctx.fillRect(p.x - 2, p.y + 1.2, 4, 0.5);
        ctx.fillRect(p.x - 2, p.y + 2.3, 3, 0.5);
      }
    }
  }
  for (const g of L.graffiti) drawGraffiti(ctx, g.x, g.y, g.text, g.color, lod, L);
}

function drawBalcony(ctx: Ctx, b: { x0: number; x1: number; y: number }, lod: Lod): void {
  boxFS(ctx, b.x0 - 0.6, b.y, b.x1 - b.x0 + 1.2, 1.4, MAT.stone);
  const lw = ctx.lineWidth;
  ctx.lineWidth = lod === 0 ? 0.35 : 0.6;
  ctx.strokeStyle = '#2f2b2a';
  ctx.beginPath();
  ctx.moveTo(b.x0, b.y - 4.6);
  ctx.lineTo(b.x1, b.y - 4.6);
  if (lod === 0) {
    for (let x = b.x0; x <= b.x1 + 0.01; x += 1.4) {
      ctx.moveTo(x, b.y - 4.6);
      ctx.lineTo(x, b.y);
    }
  } else {
    ctx.moveTo(b.x0, b.y - 4.6);
    ctx.lineTo(b.x0, b.y);
    ctx.moveTo(b.x1, b.y - 4.6);
    ctx.lineTo(b.x1, b.y);
  }
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
}

function drawGraffiti(ctx: Ctx, x: number, y: number, text: string | undefined, color: string, lod: Lod, L: Layout): void {
  const w = Math.min(22, L.W * 0.35);
  const lw = ctx.lineWidth;
  ctx.strokeStyle = color;
  ctx.lineWidth = lod === 0 ? 0.7 : 1;
  // gribouillis de bombe
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + 2);
  ctx.bezierCurveTo(x - w / 4, y - 4, x, y + 5, x + w / 6, y - 2);
  ctx.bezierCurveTo(x + w / 4, y - 5, x + w / 2.5, y + 3, x + w / 2, y - 1);
  ctx.stroke();
  if (text && lod === 0) {
    ctx.save();
    ctx.translate(x, y - 1);
    ctx.rotate(-0.12);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#fbf6ea';
    const sz = Math.min(5, w / Math.max(2, text.length * 0.6));
    ctx.font = `italic bold ${sz}px 'Arial Black', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
}

