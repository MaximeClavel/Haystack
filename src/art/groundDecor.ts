// Décor du sol : petits détails posés sur les formes de sol (herbe, cour, trottoir, chaussée, eau, quai…).
//
// Rien n'est stocké ni tiré au hasard : chaque détail est déterminé par la CASE de grille du monde où
// il se trouve (hachage entier des indices de case). Deux tuiles voisines recalculent donc exactement
// les mêmes détails et ceux qui chevauchent leur bord sont coupés proprement : aucun raccord visible.
//
// Les détails sont toujours dessinés DANS la forme (clip) : ils ne débordent jamais sur la forme
// voisine, et une forme dessinée plus tard par-dessus les recouvre naturellement.
//
// PERFORMANCE : un clip par forme, puis des tracés groupés par couleur (un remplissage ou un trait par
// couleur, pas par détail). Niveau 0 : détails fins ; niveau 1 : seulement les grandes taches de ton
// et les bords d'eau ; niveau 2 : rien.

import type { GroundKind, GroundLayer, GroundShape, Rect, Vec2 } from '../types';
import type { Lod } from './lod';
import { INK } from './palette';
import { type Ctx, TAU } from './util';

/* ----------------------------------------------------------------------------
 * Hachage de cases
 * ------------------------------------------------------------------------- */

/** Nombre pseudo-aléatoire dans [0, 1) déterminé par (case x, case y, sel). */
function hash3(a: number, b: number, c: number): number {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Appelle fn pour chaque case de côté `cell` qui touche la vue élargie de `margin` et la forme. */
function eachCell(box: Box, view: Rect, cell: number, margin: number, fn: (cx: number, cy: number, ox: number, oy: number) => void): void {
  const x0 = Math.max(box.x0 - margin, view.x - margin);
  const y0 = Math.max(box.y0 - margin, view.y - margin);
  const x1 = Math.min(box.x1 + margin, view.x + view.w + margin);
  const y1 = Math.min(box.y1 + margin, view.y + view.h + margin);
  if (x1 <= x0 || y1 <= y0) return;
  const i0 = Math.floor(x0 / cell);
  const i1 = Math.floor(x1 / cell);
  const j0 = Math.floor(y0 / cell);
  const j1 = Math.floor(y1 / cell);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(i, j, i * cell, j * cell);
}

/* ----------------------------------------------------------------------------
 * Géométrie des formes (mise en cache)
 * ------------------------------------------------------------------------- */

interface ShapeInfo {
  path: Path2D;
  box: Box;
  /** Rectangle aligné sur les axes (la plupart des formes du monde). */
  rect: boolean;
  cx: number;
  cy: number;
}

const infos = new WeakMap<GroundShape, ShapeInfo>();

function infoOf(s: GroundShape): ShapeInfo {
  let it = infos.get(s);
  if (it) return it;
  const path = new Path2D();
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let sx = 0;
  let sy = 0;
  s.points.forEach((p, i) => {
    if (i === 0) path.moveTo(p.x, p.y);
    else path.lineTo(p.x, p.y);
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
    sx += p.x;
    sy += p.y;
  });
  path.closePath();
  const rect = s.points.length === 4 && s.points.every((p) => (p.x === x0 || p.x === x1) && (p.y === y0 || p.y === y1));
  it = { path, box: { x0, y0, x1, y1 }, rect, cx: sx / s.points.length, cy: sy / s.points.length };
  infos.set(s, it);
  return it;
}

function pointIn(pts: readonly Vec2[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/* ----------------------------------------------------------------------------
 * Palettes des détails
 * ------------------------------------------------------------------------- */

// Pas de jaune doré : l'aiguille du bonus est dorée, une feuille ne doit jamais lui ressembler.
const LEAF = ['#d9803a', '#c2562f', '#a8703c', '#b0452e'] as const;
const WEED = '#6c9a48';

/** Tables réutilisées (évite d'allouer à chaque tuile). */
const leafBuf: number[] = [];
const tuftBuf: number[] = [];
const darkBlot: number[] = [];
const lightBlot: number[] = [];

function ellipses(ctx: Ctx, buf: readonly number[]): void {
  // buf : x, y, rx, ry, rotation
  ctx.beginPath();
  for (let i = 0; i < buf.length; i += 5) {
    ctx.moveTo(buf[i] + buf[i + 2], buf[i + 1]);
    ctx.ellipse(buf[i], buf[i + 1], buf[i + 2], buf[i + 3], buf[i + 4], 0, TAU);
  }
}

/* ----------------------------------------------------------------------------
 * Taches de ton (niveaux 0 et 1) : grandes ellipses translucides, plus sombres ou plus claires
 * ------------------------------------------------------------------------- */

interface BlotStyle {
  dark: string;
  light: string;
  cell: number;
  chance: number;
  rx: [number, number];
  ry: [number, number];
}

const BLOTS: Partial<Record<GroundKind, BlotStyle>> = {
  grass: { dark: 'rgba(96, 140, 70, 0.11)', light: 'rgba(238, 244, 176, 0.2)', cell: 84, chance: 0.8, rx: [16, 44], ry: [9, 24] },
  park: { dark: 'rgba(84, 132, 66, 0.12)', light: 'rgba(236, 244, 178, 0.22)', cell: 84, chance: 0.85, rx: [18, 48], ry: [10, 26] },
  garden: { dark: 'rgba(96, 140, 70, 0.11)', light: 'rgba(238, 244, 176, 0.2)', cell: 84, chance: 0.8, rx: [14, 36], ry: [8, 20] },
  courtyard: { dark: 'rgba(150, 122, 84, 0.1)', light: 'rgba(255, 249, 228, 0.24)', cell: 72, chance: 0.75, rx: [14, 34], ry: [8, 20] },
  sand: { dark: 'rgba(168, 134, 82, 0.13)', light: 'rgba(255, 248, 222, 0.26)', cell: 72, chance: 0.85, rx: [16, 42], ry: [9, 22] },
  plaza: { dark: 'rgba(150, 120, 84, 0.09)', light: 'rgba(255, 250, 232, 0.22)', cell: 72, chance: 0.7, rx: [16, 40], ry: [10, 24] },
  road: { dark: 'rgba(70, 62, 52, 0.06)', light: 'rgba(255, 255, 250, 0.1)', cell: 64, chance: 0.6, rx: [10, 28], ry: [4, 9] },
  parking: { dark: 'rgba(70, 62, 52, 0.07)', light: 'rgba(255, 255, 250, 0.1)', cell: 56, chance: 0.6, rx: [10, 24], ry: [5, 11] },
  dock: { dark: 'rgba(80, 56, 32, 0.12)', light: 'rgba(255, 244, 214, 0.16)', cell: 64, chance: 0.7, rx: [12, 30], ry: [5, 12] },
};

function drawBlots(ctx: Ctx, s: GroundShape, view: Rect, kind: GroundKind, st: BlotStyle, salt: number): void {
  const it = infoOf(s);
  darkBlot.length = 0;
  lightBlot.length = 0;
  eachCell(it.box, view, st.cell, st.rx[1] + 4, (i, j, ox, oy) => {
    const r0 = hash3(i, j, salt);
    if (r0 > st.chance) return;
    const x = ox + hash3(i, j, salt + 1) * st.cell;
    const y = oy + hash3(i, j, salt + 2) * st.cell;
    const rx = st.rx[0] + hash3(i, j, salt + 3) * (st.rx[1] - st.rx[0]);
    const ry = st.ry[0] + hash3(i, j, salt + 4) * (st.ry[1] - st.ry[0]);
    const rot = (hash3(i, j, salt + 5) - 0.5) * 0.8;
    (hash3(i, j, salt + 6) < 0.55 ? darkBlot : lightBlot).push(x, y, rx, ry, rot);
  });
  void kind;
  if (darkBlot.length) {
    ctx.fillStyle = st.dark;
    ellipses(ctx, darkBlot);
    ctx.fill();
  }
  if (lightBlot.length) {
    ctx.fillStyle = st.light;
    ellipses(ctx, lightBlot);
    ctx.fill();
  }
}

/* ----------------------------------------------------------------------------
 * Détails fins par type de sol (niveau 0)
 * ------------------------------------------------------------------------- */

interface FineStyle {
  cell: number;
  /** Probabilité qu'une case porte un détail. */
  chance: number;
  /** Poids relatifs : feuilles, touffes, cailloux, taches, fissures. */
  w: { leaf?: number; tuft?: number; stones?: number; stain?: number; crack?: number; patch?: number; damp?: number; scuff?: number; hop?: number };
}

const FINE: Partial<Record<GroundKind, FineStyle>> = {
  grass: { cell: 34, chance: 0.5, w: { leaf: 3, tuft: 4, stones: 1 } },
  park: { cell: 34, chance: 0.5, w: { leaf: 4, tuft: 3, stones: 1 } },
  garden: { cell: 30, chance: 0.4, w: { leaf: 2, tuft: 4, stones: 1 } },
  courtyard: { cell: 32, chance: 0.6, w: { leaf: 3, tuft: 3, stones: 3, stain: 2, hop: 0.7 } },
  sidewalk: { cell: 36, chance: 0.34, w: { leaf: 3, tuft: 2, stain: 2, stones: 1 } },
  road: { cell: 56, chance: 0.5, w: { crack: 3, patch: 2, stain: 2, leaf: 1 } },
  parking: { cell: 44, chance: 0.5, w: { crack: 2, stain: 3, patch: 1 } },
  plaza: { cell: 40, chance: 0.28, w: { leaf: 4, tuft: 1, stain: 1, hop: 0.5 } },
  sand: { cell: 34, chance: 0.6, w: { stones: 3, scuff: 4, damp: 2, leaf: 0.5 } },
  dock: { cell: 40, chance: 0.4, w: { damp: 3, stain: 2, leaf: 1 } },
};

function pickKind(w: FineStyle['w'], r: number): keyof FineStyle['w'] {
  let total = 0;
  for (const v of Object.values(w)) total += v ?? 0;
  let t = r * total;
  for (const k of Object.keys(w) as (keyof FineStyle['w'])[]) {
    t -= w[k] ?? 0;
    if (t <= 0) return k;
  }
  return 'leaf';
}

const crackBuf: number[] = [];
const stainBuf: number[] = [];
const patchBuf: number[] = [];
const dampBuf: number[] = [];
const scuffBuf: number[] = [];
const stoneBuf: number[] = [];
const hopBuf: number[] = [];

function drawFine(ctx: Ctx, s: GroundShape, view: Rect, st: FineStyle, salt: number): void {
  const it = infoOf(s);
  leafBuf.length = 0;
  tuftBuf.length = 0;
  crackBuf.length = 0;
  stainBuf.length = 0;
  patchBuf.length = 0;
  dampBuf.length = 0;
  scuffBuf.length = 0;
  stoneBuf.length = 0;
  hopBuf.length = 0;
  // marge de 28 u : une marelle (≈ 25 u de haut) ancrée hors de la tuile peut y déborder
  eachCell(it.box, view, st.cell, 28, (i, j, ox, oy) => {
    if (hash3(i, j, salt) > st.chance) return;
    const x = ox + hash3(i, j, salt + 1) * st.cell;
    const y = oy + hash3(i, j, salt + 2) * st.cell;
    const a = hash3(i, j, salt + 3);
    const b = hash3(i, j, salt + 4);
    switch (pickKind(st.w, hash3(i, j, salt + 5))) {
      case 'leaf': {
        // petit tas de 2 à 4 feuilles mortes d'une même teinte
        const col = Math.floor(b * LEAF.length);
        const n = 2 + Math.floor(a * 3);
        for (let k = 0; k < n; k++) {
          leafBuf.push(x + (hash3(i, j, salt + 10 + k) - 0.5) * 5, y + (hash3(i, j, salt + 20 + k) - 0.5) * 3, hash3(i, j, salt + 30 + k) * Math.PI, col);
        }
        break;
      }
      case 'tuft':
        tuftBuf.push(x, y, 0.8 + a * 0.6);
        break;
      case 'stones':
        stoneBuf.push(x, y, 0.45 + a * 0.35, x + 1.7 + b, y + 0.5, 0.35 + a * 0.3, x - 1.3, y + 0.9, 0.3 + b * 0.25);
        break;
      case 'stain':
        stainBuf.push(x, y, 3 + a * 6, 1.6 + b * 3.2, (a - 0.5) * 0.6);
        break;
      case 'hop':
        hopBuf.push(x, y);
        break;
      case 'crack': {
        // fissure : 3 segments qui partent dans une direction
        const ang = a * TAU;
        const len = 5 + b * 9;
        let px = x;
        let py = y;
        for (let k = 0; k < 3; k++) {
          const na = ang + (hash3(i, j, salt + 40 + k) - 0.5) * 1.1;
          const nx = px + Math.cos(na) * (len / 3);
          const ny = py + Math.sin(na) * (len / 3) * 0.7;
          crackBuf.push(px, py, nx, ny);
          px = nx;
          py = ny;
        }
        break;
      }
      case 'patch':
        patchBuf.push(x, y, 8 + a * 12, 4 + b * 6);
        break;
      case 'damp':
        dampBuf.push(x, y, 6 + a * 12, 3 + b * 6, (a - 0.5) * 0.5);
        break;
      case 'scuff': {
        // traces de roues : deux arcs parallèles
        const ang = a * Math.PI;
        const len = 14 + b * 22;
        scuffBuf.push(x, y, Math.cos(ang) * len, Math.sin(ang) * len * 0.6);
        break;
      }
    }
  });
  if (!(leafBuf.length || tuftBuf.length || crackBuf.length || stainBuf.length || patchBuf.length || dampBuf.length || scuffBuf.length || stoneBuf.length || hopBuf.length)) return;
  ctx.save();
  ctx.clip(it.path);
  if (stainBuf.length) {
    ctx.fillStyle = 'rgba(70, 52, 38, 0.075)';
    ellipses(ctx, stainBuf);
    ctx.fill();
  }
  if (dampBuf.length) {
    ctx.fillStyle = 'rgba(60, 50, 40, 0.1)';
    ellipses(ctx, dampBuf);
    ctx.fill();
  }
  if (patchBuf.length) {
    ctx.fillStyle = 'rgba(60, 52, 44, 0.07)';
    ctx.beginPath();
    for (let k = 0; k < patchBuf.length; k += 4) {
      const x = patchBuf[k];
      const y = patchBuf[k + 1];
      const w = patchBuf[k + 2];
      const h = patchBuf[k + 3];
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h * 0.1);
      ctx.lineTo(x + w * 0.94, y + h);
      ctx.lineTo(x - w * 0.04, y + h * 0.9);
      ctx.closePath();
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 52, 44, 0.12)';
    ctx.lineWidth = 0.3;
    ctx.stroke();
  }
  if (scuffBuf.length) {
    ctx.strokeStyle = 'rgba(100, 74, 44, 0.22)';
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k < scuffBuf.length; k += 4) {
      const x = scuffBuf[k];
      const y = scuffBuf[k + 1];
      const dx = scuffBuf[k + 2];
      const dy = scuffBuf[k + 3];
      for (const off of [-1.6, 1.6]) {
        ctx.moveTo(x, y + off);
        ctx.quadraticCurveTo(x + dx * 0.5, y + off + dy * 0.2 + 1.2, x + dx, y + off + dy);
      }
    }
    ctx.stroke();
  }
  if (crackBuf.length) {
    ctx.strokeStyle = 'rgba(52, 40, 32, 0.34)';
    ctx.lineWidth = 0.35;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k < crackBuf.length; k += 4) {
      ctx.moveTo(crackBuf[k], crackBuf[k + 1]);
      ctx.lineTo(crackBuf[k + 2], crackBuf[k + 3]);
    }
    ctx.stroke();
  }
  if (hopBuf.length) {
    // marelle à la craie : colonne de cases (1, 2, puis 3-4, 5, 6-7, 8, 9-10 en paires)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 0.3;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    for (let k = 0; k < hopBuf.length; k += 2) {
      const x = hopBuf[k];
      const y = hopBuf[k + 1];
      const c = 3.1;
      let yy = y;
      for (const pair of [false, false, true, false, true, false, true]) {
        if (pair) {
          ctx.rect(x - c, yy - c, c, c);
          ctx.rect(x, yy - c, c, c);
        } else ctx.rect(x - c / 2, yy - c, c, c);
        yy -= c;
      }
      // ciel : demi-cercle au bout
      ctx.moveTo(x + c * 0.9, yy);
      ctx.arc(x, yy, c * 0.9, 0, Math.PI, true);
    }
    ctx.stroke();
    ctx.lineCap = 'round';
  }
  if (stoneBuf.length) {
    ctx.fillStyle = 'rgba(120, 108, 92, 0.75)';
    ctx.beginPath();
    for (let k = 0; k < stoneBuf.length; k += 3) {
      ctx.moveTo(stoneBuf[k] + stoneBuf[k + 2], stoneBuf[k + 1]);
      ctx.arc(stoneBuf[k], stoneBuf[k + 1], stoneBuf[k + 2], 0, TAU);
    }
    ctx.fill();
  }
  if (tuftBuf.length) {
    ctx.strokeStyle = WEED;
    ctx.lineWidth = 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k < tuftBuf.length; k += 3) {
      const x = tuftBuf[k];
      const y = tuftBuf[k + 1];
      const h = tuftBuf[k + 2];
      ctx.moveTo(x, y);
      ctx.lineTo(x - h * 0.7, y - h * 2.2);
      ctx.moveTo(x, y);
      ctx.lineTo(x + h * 0.1, y - h * 2.8);
      ctx.moveTo(x, y);
      ctx.lineTo(x + h * 0.8, y - h * 2.0);
    }
    ctx.stroke();
  }
  if (leafBuf.length) {
    for (let col = 0; col < LEAF.length; col++) {
      let any = false;
      ctx.beginPath();
      for (let k = 0; k < leafBuf.length; k += 4) {
        if (leafBuf[k + 3] !== col) continue;
        any = true;
        const x = leafBuf[k];
        const y = leafBuf[k + 1];
        ctx.moveTo(x + 1.0, y);
        ctx.ellipse(x, y, 1.0, 0.55, leafBuf[k + 2], 0, TAU);
      }
      if (any) {
        ctx.fillStyle = LEAF[col];
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/* ----------------------------------------------------------------------------
 * Eau : bord clair, courants, nénuphars et roseaux (étang)
 * ------------------------------------------------------------------------- */

const streakLight: number[] = [];
const streakDark: number[] = [];
const padBuf: number[] = [];

function drawWater(ctx: Ctx, s: GroundShape, view: Rect, lod: Lod): void {
  const it = infoOf(s);
  const bw = it.box.x1 - it.box.x0;
  const bh = it.box.y1 - it.box.y0;
  const pond = bw < 1500 && bh < 1500;
  ctx.save();
  ctx.clip(it.path);
  // bord clair : la berge « mord » sur l'eau
  ctx.strokeStyle = 'rgba(236, 246, 246, 0.34)';
  ctx.lineWidth = lod === 0 ? 5 : 7;
  ctx.lineJoin = 'round';
  ctx.stroke(it.path);
  if (lod === 0) {
    ctx.strokeStyle = 'rgba(96, 144, 164, 0.2)';
    ctx.lineWidth = 11;
    ctx.stroke(it.path);
    ctx.strokeStyle = 'rgba(236, 246, 246, 0.34)';
    ctx.lineWidth = 5;
    ctx.stroke(it.path);
  }
  // courants : traînées claires et sombres, plus longues sur la rivière
  const cell = pond ? 58 : 72;
  streakLight.length = 0;
  streakDark.length = 0;
  eachCell(it.box, view, cell, 36, (i, j, ox, oy) => {
    if (hash3(i, j, 910) > 0.62) return;
    const x = ox + hash3(i, j, 911) * cell;
    const y = oy + hash3(i, j, 912) * cell;
    const len = (pond ? 8 : 16) + hash3(i, j, 913) * (pond ? 14 : 30);
    (hash3(i, j, 914) < 0.55 ? streakLight : streakDark).push(x, y, len);
  });
  const streaks = (buf: readonly number[]): void => {
    ctx.beginPath();
    for (let k = 0; k < buf.length; k += 3) {
      const x = buf[k];
      const y = buf[k + 1];
      const l = buf[k + 2];
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + l * 0.25, y - 0.9, x + l * 0.5, y);
      ctx.quadraticCurveTo(x + l * 0.75, y + 0.9, x + l, y);
    }
    ctx.stroke();
  };
  ctx.lineCap = 'round';
  if (streakLight.length) {
    ctx.strokeStyle = 'rgba(240, 250, 252, 0.5)';
    ctx.lineWidth = 0.6;
    streaks(streakLight);
  }
  if (streakDark.length) {
    ctx.strokeStyle = 'rgba(80, 130, 152, 0.3)';
    ctx.lineWidth = 0.6;
    streaks(streakDark);
  }
  if (pond && lod === 0) {
    // nénuphars : petits groupes de feuilles rondes fendues, quelques fleurs
    padBuf.length = 0;
    eachCell(it.box, view, 54, 8, (i, j, ox, oy) => {
      if (hash3(i, j, 930) > 0.26) return;
      const x = ox + hash3(i, j, 931) * 54;
      const y = oy + hash3(i, j, 932) * 54;
      const n = 2 + Math.floor(hash3(i, j, 933) * 3);
      for (let k = 0; k < n; k++) {
        padBuf.push(x + (hash3(i, j, 940 + k) - 0.5) * 9, y + (hash3(i, j, 950 + k) - 0.5) * 5, 1.9 + hash3(i, j, 960 + k) * 1.3, hash3(i, j, 970 + k));
      }
    });
    if (padBuf.length) {
      ctx.fillStyle = '#6fa65a';
      ctx.strokeStyle = '#3f7440';
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      for (let k = 0; k < padBuf.length; k += 4) {
        const x = padBuf[k];
        const y = padBuf[k + 1];
        const r = padBuf[k + 2];
        ctx.moveTo(x + r, y);
        ctx.ellipse(x, y, r, r * 0.62, 0, 0.18, TAU - 0.18);
        ctx.lineTo(x, y);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f7ecf1';
      ctx.beginPath();
      for (let k = 0; k < padBuf.length; k += 4) {
        if (padBuf[k + 3] > 0.3) continue;
        ctx.moveTo(padBuf[k] + 0.9, padBuf[k + 1] - 0.4);
        ctx.arc(padBuf[k], padBuf[k + 1] - 0.4, 0.9, 0, TAU);
      }
      ctx.fill();
      ctx.fillStyle = '#f0c93f';
      ctx.beginPath();
      for (let k = 0; k < padBuf.length; k += 4) {
        if (padBuf[k + 3] > 0.3) continue;
        ctx.moveTo(padBuf[k] + 0.35, padBuf[k + 1] - 0.4);
        ctx.arc(padBuf[k], padBuf[k + 1] - 0.4, 0.35, 0, TAU);
      }
      ctx.fill();
    }
  }
  ctx.restore();
  if (pond && lod === 0) drawReeds(ctx, s, view);
}

/** Roseaux le long de la rive d'un étang : touffes de tiges brunes à épis sombres. */
function drawReeds(ctx: Ctx, s: GroundShape, view: Rect): void {
  const it = infoOf(s);
  const pts = s.points;
  const spacing = 26;
  ctx.lineCap = 'round';
  const stalks: number[] = [];
  const heads: number[] = [];
  for (let e = 0; e < pts.length; e++) {
    const a = pts[e];
    const b = pts[(e + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 8) continue;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    // normale dirigée vers l'intérieur de l'étang
    let nx = -uy;
    let ny = ux;
    if (nx * (it.cx - a.x) + ny * (it.cy - a.y) < 0) {
      nx = -nx;
      ny = -ny;
    }
    for (let t = hash3(e, 0, 980) * spacing; t < len; t += spacing * (0.7 + hash3(e, Math.floor(t), 981) * 0.9)) {
      if (hash3(e, Math.floor(t), 982) < 0.45) continue;
      const bx = a.x + ux * t + nx * 2.2;
      const by = a.y + uy * t + ny * 2.2;
      if (bx < view.x - 12 || bx > view.x + view.w + 12 || by < view.y - 14 || by > view.y + view.h + 6) continue;
      const n = 3 + Math.floor(hash3(e, Math.floor(t), 983) * 3);
      for (let k = 0; k < n; k++) {
        const h = 5 + hash3(e, Math.floor(t), 990 + k) * 5;
        const lean = (hash3(e, Math.floor(t), 1000 + k) - 0.5) * 3.2;
        const x0 = bx + (k - n / 2) * 0.9;
        stalks.push(x0, by, x0 + lean, by - h);
        if (k % 2 === 0) heads.push(x0 + lean, by - h + 1.2, hash3(e, Math.floor(t), 1010 + k));
      }
    }
  }
  if (!stalks.length) return;
  ctx.strokeStyle = '#6e8a4a';
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  for (let k = 0; k < stalks.length; k += 4) {
    ctx.moveTo(stalks[k], stalks[k + 1]);
    ctx.lineTo(stalks[k + 2], stalks[k + 3]);
  }
  ctx.stroke();
  ctx.fillStyle = '#6a4a30';
  ctx.beginPath();
  for (let k = 0; k < heads.length; k += 3) {
    ctx.moveTo(heads[k] + 0.55, heads[k + 1]);
    ctx.ellipse(heads[k], heads[k + 1], 0.55, 1.5, 0, 0, TAU);
  }
  ctx.fill();
}

/* ----------------------------------------------------------------------------
 * Quais : margelle, bande mouillée, bollards d'amarrage
 * ------------------------------------------------------------------------- */

interface QuayEdge {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Normale vers l'intérieur du quai. */
  nx: number;
  ny: number;
  len: number;
}

const sideCache = new WeakMap<GroundShape, Map<GroundKind, QuayEdge[]>>();
const kindShapes = new WeakMap<GroundLayer, Map<GroundKind, GroundShape[]>>();

function shapesOfKind(g: GroundLayer, kind: GroundKind): GroundShape[] {
  let m = kindShapes.get(g);
  if (!m) {
    m = new Map();
    kindShapes.set(g, m);
  }
  let l = m.get(kind);
  if (!l) {
    l = g.shapes.filter((s) => s.kind === kind);
    m.set(kind, l);
  }
  return l;
}

function waterShapes(g: GroundLayer): GroundShape[] {
  return shapesOfKind(g, 'water');
}

/** Côtés d'une forme dont l'autre face touche une forme de type `beyond` (eau, voie ferrée…). */
function edgesAgainst(g: GroundLayer, s: GroundShape, beyond: GroundKind): QuayEdge[] {
  let perKind = sideCache.get(s);
  if (!perKind) {
    perKind = new Map();
    sideCache.set(s, perKind);
  }
  let q = perKind.get(beyond);
  if (q) return q;
  q = [];
  const it = infoOf(s);
  const ws = shapesOfKind(g, beyond);
  const pts = s.points;
  for (let e = 0; e < pts.length; e++) {
    const a = pts[e];
    const b = pts[(e + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 20) continue;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    let nx = -uy;
    let ny = ux;
    if (nx * (it.cx - a.x) + ny * (it.cy - a.y) < 0) {
      nx = -nx;
      ny = -ny;
    }
    // trois points juste en dehors du côté : tous dans la forme voisine ?
    const touches = [0.2, 0.5, 0.8].every((t) => {
      const px = a.x + (b.x - a.x) * t - nx * 3;
      const py = a.y + (b.y - a.y) * t - ny * 3;
      return ws.some((w) => pointIn(w.points, px, py));
    });
    if (touches) q.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, nx, ny, len });
  }
  perKind.set(beyond, q);
  return q;
}

/** Bord de quai de gare : bande jaune de sécurité le long de la voie. */
function drawPlatformEdge(ctx: Ctx, g: GroundLayer, s: GroundShape, view: Rect): void {
  const edges = edgesAgainst(g, s, 'railbed');
  if (!edges.length) return;
  const it = infoOf(s);
  ctx.save();
  ctx.clip(it.path);
  ctx.lineCap = 'butt';
  for (const q of edges) {
    const bx0 = Math.min(q.x0, q.x1) - 6;
    const bx1 = Math.max(q.x0, q.x1) + 6;
    const by0 = Math.min(q.y0, q.y1) - 6;
    const by1 = Math.max(q.y0, q.y1) + 6;
    if (bx1 < view.x || bx0 > view.x + view.w || by1 < view.y || by0 > view.y + view.h) continue;
    const line = (inset: number, width: number, color: string): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(q.x0 + q.nx * inset, q.y0 + q.ny * inset);
      ctx.lineTo(q.x1 + q.nx * inset, q.y1 + q.ny * inset);
      ctx.stroke();
    };
    line(1.6, 3.2, '#8c8274');
    line(4.2, 2.6, '#f0cb3f');
    line(5.9, 0.7, 'rgba(60, 50, 40, 0.35)');
  }
  ctx.restore();
}

function drawQuay(ctx: Ctx, g: GroundLayer, s: GroundShape, view: Rect): void {
  const edges = edgesAgainst(g, s, 'water');
  if (!edges.length) return;
  const it = infoOf(s);
  ctx.save();
  ctx.clip(it.path);
  ctx.lineCap = 'butt';
  for (const q of edges) {
    const bx0 = Math.min(q.x0, q.x1) - 6;
    const bx1 = Math.max(q.x0, q.x1) + 6;
    const by0 = Math.min(q.y0, q.y1) - 6;
    const by1 = Math.max(q.y0, q.y1) + 6;
    if (bx1 < view.x || bx0 > view.x + view.w || by1 < view.y || by0 > view.y + view.h) continue;
    // bande mouillée, puis margelle de pierre claire
    ctx.strokeStyle = 'rgba(60, 48, 36, 0.16)';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(q.x0, q.y0);
    ctx.lineTo(q.x1, q.y1);
    ctx.stroke();
    ctx.strokeStyle = '#b9a98c';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#e4d9c1';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  // bollards (hors clip : leur sommet dépasse un peu de la margelle)
  for (const q of edges) {
    const step = 64;
    const ux = (q.x1 - q.x0) / q.len;
    const uy = (q.y1 - q.y0) / q.len;
    for (let t = step * 0.5; t < q.len; t += step) {
      const px = q.x0 + ux * t + q.nx * 3.4;
      const py = q.y0 + uy * t + q.ny * 3.4;
      if (px < view.x - 6 || px > view.x + view.w + 6 || py < view.y - 12 || py > view.y + view.h + 6) continue;
      bollard(ctx, px, py);
      // une mouette sur certains bollards (déterminée par la position : identique d'une tuile à l'autre)
      if (hash3(Math.round(px), Math.round(py), 1900) < 0.2) gull(ctx, px, py - 3.4, hash3(Math.round(px), Math.round(py), 1901) < 0.5);
    }
  }
}

/** Mouette posée (x, y = point d'appui) : corps blanc, dos gris, bec orange. */
function gull(ctx: Ctx, x: number, y: number, flip: boolean): void {
  const s = flip ? -1 : 1;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.35;
  ctx.fillStyle = '#fbfaf6';
  ctx.beginPath();
  ctx.ellipse(x, y - 1.6, 2.3, 1.5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9aa3aa';
  ctx.beginPath();
  ctx.ellipse(x - s * 0.5, y - 1.9, 1.5, 0.85, -0.12 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fbfaf6';
  ctx.beginPath();
  ctx.arc(x + s * 2.0, y - 3.3, 0.95, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8923a';
  ctx.beginPath();
  ctx.moveTo(x + s * 2.8, y - 3.5);
  ctx.lineTo(x + s * 3.9, y - 3.2);
  ctx.lineTo(x + s * 2.8, y - 2.9);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x + s * 2.25, y - 3.45, 0.18, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 2.1, y - 1.9);
  ctx.lineTo(x - s * 3.4, y - 1.1);
  ctx.stroke();
}

function bollard(ctx: Ctx, x: number, y: number): void {
  // ombre, fût sombre, calotte claire
  ctx.fillStyle = 'rgba(60, 48, 36, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x + 0.7, y + 0.2, 2.2, 0.8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3c3f42';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(x - 1.5, y);
  ctx.lineTo(x - 1.2, y - 3.4);
  ctx.lineTo(x + 1.2, y - 3.4);
  ctx.lineTo(x + 1.5, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a9094';
  ctx.beginPath();
  ctx.ellipse(x, y - 3.4, 1.35, 0.6, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

/* ----------------------------------------------------------------------------
 * Ponts : ombre portée sur l'eau
 * ------------------------------------------------------------------------- */

function drawBridgeShadow(ctx: Ctx, g: GroundLayer, s: GroundShape, view: Rect): void {
  const it = infoOf(s);
  if (!it.rect) return;
  const { x0, y0, x1, y1 } = it.box;
  const vertical = x1 - x0 < y1 - y0;
  if (x1 < view.x - 8 || x0 > view.x + view.w + 8 || y1 < view.y - 8 || y0 > view.y + view.h + 8) return;
  for (const w of waterShapes(g)) {
    const wi = infoOf(w);
    if (wi.box.x1 < x0 || wi.box.x0 > x1 || wi.box.y1 < y0 || wi.box.y0 > y1) continue;
    ctx.save();
    ctx.clip(wi.path);
    ctx.fillStyle = 'rgba(40, 72, 92, 0.24)';
    if (vertical) ctx.fillRect(x1, y0 + 4, 5, y1 - y0);
    else ctx.fillRect(x0 + 4, y1, x1 - x0, 5);
    ctx.restore();
  }
}

/* ----------------------------------------------------------------------------
 * Places : cadre de pavés plus sombres, rosaces d'angle
 * ------------------------------------------------------------------------- */

function drawPlazaFrame(ctx: Ctx, s: GroundShape, view: Rect): void {
  const it = infoOf(s);
  if (!it.rect) return;
  const { x0, y0, x1, y1 } = it.box;
  const w = x1 - x0;
  const h = y1 - y0;
  if (Math.min(w, h) < 200) return;
  const d1 = 11;
  const d2 = 17;
  ctx.beginPath();
  ctx.rect(x0 + d1, y0 + d1, w - 2 * d1, h - 2 * d1);
  ctx.rect(x0 + d2, y0 + d2, w - 2 * d2, h - 2 * d2);
  ctx.fillStyle = 'rgba(122, 96, 66, 0.2)';
  ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(122, 96, 66, 0.5)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // rosaces aux angles du cadre
  const r = 7;
  for (const [cx, cy] of [
    [x0 + d2 + r, y0 + d2 + r],
    [x1 - d2 - r, y0 + d2 + r],
    [x0 + d2 + r, y1 - d2 - r],
    [x1 - d2 - r, y1 - d2 - r],
  ]) {
    if (cx < view.x - r || cx > view.x + view.w + r || cy < view.y - r || cy > view.y + view.h + r) continue;
    ctx.strokeStyle = 'rgba(122, 96, 66, 0.55)';
    ctx.fillStyle = 'rgba(255, 248, 228, 0.55)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      ctx.moveTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(122, 96, 66, 0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.3, 0, TAU);
    ctx.fill();
  }
}

/* ----------------------------------------------------------------------------
 * Point d'entrée
 * ------------------------------------------------------------------------- */

const SALT: Record<GroundKind, number> = {
  grass: 100,
  park: 200,
  water: 300,
  sand: 400,
  plaza: 500,
  sidewalk: 600,
  road: 700,
  parking: 800,
  dock: 1100,
  garden: 1200,
  courtyard: 1300,
  bridge: 1400,
  railbed: 1500,
};

/** Dessine le décor d'une forme de sol déjà remplie (appelée par drawGround). */
export function decorateShape(ctx: Ctx, ground: GroundLayer, s: GroundShape, view: Rect, lod: Lod): void {
  if (lod === 2) return;
  const kind = s.kind;
  if (kind === 'water') {
    drawWater(ctx, s, view, lod);
    return;
  }
  if (kind === 'bridge') {
    drawBridgeShadow(ctx, ground, s, view);
    return;
  }
  const blot = BLOTS[kind];
  const fine = lod === 0 ? FINE[kind] : undefined;
  if (!blot && !fine && kind !== 'plaza' && kind !== 'dock') return;
  const it = infoOf(s);
  // les très petites formes (liserés) ne reçoivent pas de taches de ton
  const big = Math.min(it.box.x1 - it.box.x0, it.box.y1 - it.box.y0) >= 30;
  if (blot && big) {
    ctx.save();
    ctx.clip(it.path);
    drawBlots(ctx, s, view, kind, blot, SALT[kind]);
    ctx.restore();
  }
  if (kind === 'plaza') drawPlazaFrame(ctx, s, view);
  if (kind === 'dock') drawQuay(ctx, ground, s, view);
  if (kind === 'plaza') drawPlatformEdge(ctx, ground, s, view);
  if (fine && big) drawFine(ctx, s, view, fine, SALT[kind] + 50);
}

/** Contour d'une forme de sol sous forme de Path2D (mis en cache). */
export function shapePath(s: GroundShape): Path2D {
  return infoOf(s).path;
}
