// Accessoires (portés) et objets tenus en main.
//
// Tout est dessiné dans le repère de la personne (face à droite, ancre aux pieds) et borné par
// l'emprise locale de la personne (getEntityBounds) : un objet qui dépasserait est décalé.

import type { Build, PersonEntity, Pose } from '../types';
import { getEntityBounds } from './bounds';
import { COLOR_HEX, INK, MAT, mix } from './palette';
import type { Figure } from './person';
import type { Pt, Skel } from './skeleton';
import { TAU, type Ctx, boxFS, circleFS, ellipseFS, inkedStroke, polyFS, rboxFS } from './util';

/* ----------------------------------------------------------------------------
 * Emprise locale
 * ------------------------------------------------------------------------- */

export interface LocalBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const lbCache = new Map<string, LocalBox>();

/** Emprise visuelle d'une personne dans son repère local (ancre aux pieds, face à droite). */
export function localBounds(build: Build, pose: Pose): LocalBox {
  const key = `${build}|${pose}`;
  let b = lbCache.get(key);
  if (!b) {
    const fake = {
      kind: 'person',
      id: '',
      x: 0,
      y: 0,
      pose,
      facing: 'right',
      appearance: { build },
    } as unknown as PersonEntity;
    const r = getEntityBounds(fake);
    b = { x0: r.x, x1: r.x + r.w, y0: r.y, y1: r.y + r.h };
    lbCache.set(key, b);
  }
  return b;
}

/** Décale (dx, dy) pour qu'un rectangle [x0, x1] × [y0, y1] reste dans l'emprise (marge m). */
function fitShift(lb: LocalBox, x0: number, x1: number, y0: number, y1: number, m = 0.6): [number, number] {
  let dx = 0;
  let dy = 0;
  if (x1 + m > lb.x1) dx = lb.x1 - m - x1;
  if (x0 + dx - m < lb.x0) dx = lb.x0 + m - x0;
  if (y0 - m < lb.y0) dy = lb.y0 + m - y0;
  if (y1 + dy + m > lb.y1) dy = lb.y1 - m - y1;
  return [dx, dy];
}

function torsoFrame(ctx: Ctx, sk: Skel): void {
  ctx.transform(sk.ax.x, sk.ax.y, sk.ay.x, sk.ay.y, sk.N.x, sk.N.y);
}

/* ----------------------------------------------------------------------------
 * Accessoires
 * ------------------------------------------------------------------------- */

const BACKPACK = '#5f8052';
const HANDBAG = '#a8473a';
const BRIEFCASE = '#5a3b2a';
const SUITCASE = '#3f6f8f';
const CANE = '#5a3b2a';
const BALLOON = '#e2463d';

/** Accessoires derrière le corps : sac à dos, ballon, parapluie, valise. */
export function drawAccessoryBehind(ctx: Ctx, f: Figure): void {
  const sk = f.sk;
  const acc = f.ap.accessory;
  const s = sk.m.s;
  const lb = localBounds(f.ap.build, f.pose);
  switch (acc) {
    case 'backpack': {
      ctx.save();
      torsoFrame(ctx, sk);
      const sw = sk.m.sw;
      rboxFS(ctx, -sw - 1.7 * s, 0.4 * s, 2.9 * s, sk.m.torso - 0.2, 0.9 * s, BACKPACK);
      if (f.lod === 0) {
        rboxFS(ctx, -sw - 2.1 * s, sk.m.torso * 0.5, 1.2 * s, sk.m.torso * 0.4, 0.4 * s, mix(BACKPACK, INK, 0.2));
      }
      ctx.restore();
      return;
    }
    case 'balloon': {
      if (f.pose === 'lie' || f.pose === 'window') return;
      const h = sk.hd[0];
      const r = 2.7 * (0.75 + 0.25 * s);
      let bx = Math.min(h.x - 2.4, sk.headTop.x - 3.6);
      let by = sk.headTop.y - 7.2;
      const [dx, dy] = fitShift(lb, bx - r, bx + r, by - r, by + r + 1);
      bx += dx;
      by += dy;
      ctx.lineWidth = 0.25;
      ctx.beginPath();
      ctx.moveTo(h.x, h.y);
      ctx.quadraticCurveTo(h.x - 1.5, (h.y + by) / 2, bx, by + r + 0.6);
      ctx.stroke();
      ctx.lineWidth = f.ol;
      ctx.fillStyle = BALLOON;
      ctx.beginPath();
      ctx.ellipse(bx, by, r * 0.88, r, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      polyFS(ctx, [bx - 0.45, by + r + 0.6, bx + 0.45, by + r + 0.6, bx, by + r - 0.1], BALLOON);
      if (f.lod === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.ellipse(bx - r * 0.35, by - r * 0.4, r * 0.18, r * 0.3, -0.4, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'umbrella': {
      if (f.pose === 'lie' || f.pose === 'window') return;
      const h = sk.hd[0];
      const w = 6.4 * (0.7 + 0.3 * s);
      const ch = 3.3 * (0.7 + 0.3 * s);
      let cx = h.x - 0.4;
      let cy = sk.headTop.y - 4.6;
      const [dx, dy] = fitShift(lb, cx - w, cx + w, cy - ch, cy + 0.9);
      cx += dx;
      cy += dy;
      // manche
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(h.x + 0.2, h.y + 0.9);
      ctx.quadraticCurveTo(h.x + 0.9, h.y + 1.2, h.x + 0.9, h.y + 0.4);
      ctx.moveTo(h.x + 0.2, h.y + 0.9);
      ctx.lineTo(cx, cy - ch);
      ctx.stroke();
      ctx.lineWidth = f.ol;
      // toile : panneaux alternés
      const n = 4;
      for (let i = 0; i < n; i++) {
        const a0 = cx - w + (2 * w * i) / n;
        const a1 = cx - w + (2 * w * (i + 1)) / n;
        ctx.fillStyle = i % 2 === 0 ? MAT.red : MAT.cream;
        ctx.beginPath();
        ctx.moveTo(cx, cy - ch);
        ctx.lineTo(a0, cy + (i === 0 ? 0.4 : 0));
        ctx.quadraticCurveTo((a0 + a1) / 2, cy - 1.0, a1, cy + (i === n - 1 ? 0.4 : 0));
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(cx - w, cy + 0.4);
      ctx.quadraticCurveTo(cx - w * 0.9, cy - ch * 0.9, cx, cy - ch);
      ctx.quadraticCurveTo(cx + w * 0.9, cy - ch * 0.9, cx + w, cy + 0.4);
      for (let i = n - 1; i >= 0; i--) {
        const a0 = cx - w + (2 * w * i) / n;
        ctx.quadraticCurveTo(a0 + w / n, cy - 1.0, a0, cy + (i === 0 ? 0.4 : 0));
      }
      ctx.stroke();
      return;
    }
    case 'suitcase': {
      if (f.pose === 'window') return;
      const h = sk.hd[0];
      const w = 4.6 * (0.75 + 0.25 * s);
      const hh = 6.0 * (0.7 + 0.3 * s);
      let x1 = Math.min(h.x - 0.6, -sk.m.hw - 1.0);
      let x0 = x1 - w;
      const [dx] = fitShift(lb, x0, x1, -hh, 0);
      x0 += dx;
      x1 += dx;
      if (f.pose !== 'lie') {
        // poignée télescopique jusqu'à la main
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        ctx.moveTo(x1 - 0.8, -hh - 0.6);
        ctx.lineTo(h.x, h.y);
        ctx.stroke();
        ctx.lineWidth = f.ol;
      }
      rboxFS(ctx, x0, -hh - 0.6, w, hh, 0.7, SUITCASE);
      if (f.lod === 0) {
        ctx.lineWidth = 0.28;
        ctx.beginPath();
        ctx.moveTo(x0 + w * 0.33, -hh - 0.3);
        ctx.lineTo(x0 + w * 0.33, -0.9);
        ctx.moveTo(x0 + w * 0.66, -hh - 0.3);
        ctx.lineTo(x0 + w * 0.66, -0.9);
        ctx.stroke();
        ctx.lineWidth = f.ol;
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(x0 + 0.9, -0.45, 0.45, 0, TAU);
        ctx.arc(x1 - 0.9, -0.45, 0.45, 0, TAU);
        ctx.fill();
      }
      return;
    }
  }
}

/** Extension des accessoires de main autour de la main (avant échelle k) : gauche, droite, haut, bas. */
const BACK_EXT: Record<string, [number, number, number, number]> = {
  handbag: [2.3, 2.3, 0.6, 4.0],
  briefcase: [2.8, 2.8, 0.4, 4.4],
  flowers: [2.4, 2.4, 3.8, 2.9],
  newspaper: [1.7, 1.9, 1.0, 3.6],
};

/** Accessoires tenus par la main arrière (sac à main, mallette, canne, fleurs, journal). */
export function drawAccessoryBack(ctx: Ctx, f: Figure): void {
  const sk = f.sk;
  const acc = f.ap.accessory;
  const s = sk.m.s;
  const k = 0.7 + 0.3 * s;
  let h = sk.hd[0];
  const ext = BACK_EXT[acc];
  if (ext) {
    // recale l'objet dans l'emprise (pose allongée : il est posé à côté de la main)
    const lb = localBounds(f.ap.build, f.pose);
    const [dx, dy] = fitShift(lb, h.x - ext[0] * k, h.x + ext[1] * k, h.y - ext[2] * k, h.y + ext[3] * k);
    h = { x: h.x + dx, y: h.y + dy };
  }
  switch (acc) {
    case 'handbag': {
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.arc(h.x, h.y + 1.0 * k, 1.1 * k, Math.PI, 0);
      ctx.stroke();
      ctx.lineWidth = f.ol;
      polyFS(ctx, [h.x - 1.6 * k, h.y + 1.0 * k, h.x + 1.6 * k, h.y + 1.0 * k, h.x + 1.9 * k, h.y + 3.4 * k, h.x - 1.9 * k, h.y + 3.4 * k], HANDBAG);
      if (f.lod === 0) {
        ctx.fillStyle = MAT.gold;
        ctx.fillRect(h.x - 0.3, h.y + 1.5 * k, 0.6, 0.5);
      }
      return;
    }
    case 'briefcase': {
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(h.x - 0.7, h.y + 0.9);
      ctx.lineTo(h.x - 0.7, h.y + 0.2);
      ctx.lineTo(h.x + 0.7, h.y + 0.2);
      ctx.lineTo(h.x + 0.7, h.y + 0.9);
      ctx.stroke();
      ctx.lineWidth = f.ol;
      boxFS(ctx, h.x - 2.3 * k, h.y + 0.9, 4.6 * k, 3.0 * k, BRIEFCASE);
      if (f.lod === 0) {
        ctx.fillStyle = MAT.gold;
        ctx.fillRect(h.x - 1.6 * k, h.y + 1.3, 0.55, 0.5);
        ctx.fillRect(h.x + 1.1 * k, h.y + 1.3, 0.55, 0.5);
      }
      return;
    }
    case 'cane': {
      if (f.pose === 'window') return;
      const groundY = f.pose === 'lie' ? h.y + 0.5 : -0.2;
      const footX = f.pose === 'lie' ? h.x - 6 : h.x - 0.4;
      ctx.strokeStyle = CANE;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      if (f.pose === 'lie') {
        ctx.moveTo(h.x, h.y);
        ctx.lineTo(footX, groundY);
      } else {
        ctx.moveTo(h.x + 1.2 * k, h.y + 0.4);
        ctx.quadraticCurveTo(h.x + 1.0 * k, h.y - 1.0 * k, h.x, h.y - 0.4);
        ctx.lineTo(footX, groundY);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = f.ol;
      return;
    }
    case 'flowers': {
      // cornet de papier et fleurs
      polyFS(ctx, [h.x - 1.5 * k, h.y - 1.2 * k, h.x + 1.5 * k, h.y - 1.2 * k, h.x + 0.2, h.y + 2.4 * k], MAT.paper);
      ctx.lineWidth = f.ol * 0.8;
      const blooms: [number, number, string][] = [
        [-0.9, -1.7, '#e2463d'],
        [0.7, -1.9, '#f0cb3f'],
        [0, -2.6, '#f19bb8'],
        [-0.2, -1.4, '#8d55ad'],
      ];
      ctx.fillStyle = MAT.foliage;
      ctx.beginPath();
      ctx.ellipse(h.x + 1.3 * k, h.y - 1.6 * k, 0.9 * k, 0.45 * k, -0.6, 0, TAU);
      ctx.ellipse(h.x - 1.4 * k, h.y - 1.5 * k, 0.9 * k, 0.45 * k, 0.6, 0, TAU);
      ctx.fill();
      for (const [dx, dy, c] of blooms) circleFS(ctx, h.x + dx * k, h.y + dy * k, 0.75 * k, c, f.lod === 0);
      ctx.lineWidth = f.ol;
      return;
    }
    case 'newspaper': {
      boxFS(ctx, h.x - 1.3 * k, h.y - 0.6 * k, 2.8 * k, 3.8 * k, MAT.paper);
      if (f.lod === 0) {
        ctx.fillStyle = INK;
        ctx.fillRect(h.x - 0.9 * k, h.y - 0.2 * k, 2.0 * k, 0.55 * k);
        ctx.fillStyle = MAT.paperLine;
        for (let i = 0; i < 4; i++) ctx.fillRect(h.x - 0.9 * k, h.y + (0.7 + i * 0.6) * k, 2.0 * k, 0.22 * k);
      }
      return;
    }
  }
}

/** Accessoires portés devant le buste : appareil photo, écharpe, bretelles de sac à dos. */
export function drawAccessoryFront(ctx: Ctx, f: Figure): void {
  const sk = f.sk;
  const acc = f.ap.accessory;
  if (acc !== 'camera' && acc !== 'scarf' && acc !== 'backpack') return;
  const s = sk.m.s;
  const sw = sk.m.sw;
  ctx.save();
  torsoFrame(ctx, sk);
  if (acc === 'camera') {
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(-0.6 * s, -0.2);
    ctx.lineTo(sw * 0.15, 2.0 * s);
    ctx.moveTo(1.0 * s, -0.2);
    ctx.lineTo(sw * 0.15 + 2.0 * s, 2.0 * s);
    ctx.stroke();
    ctx.lineWidth = f.ol * 0.9;
    rboxFS(ctx, sw * 0.12, 1.8 * s, 2.4 * s, 1.6 * s, 0.3, '#2c2a2a');
    circleFS(ctx, sw * 0.12 + 1.5 * s, 2.6 * s, 0.62 * s, '#8fa7b3');
    if (f.lod === 0) {
      ctx.fillStyle = '#f2efe6';
      ctx.fillRect(sw * 0.12 + 0.3 * s, 2.0 * s, 0.5 * s, 0.35 * s);
    }
  } else if (acc === 'scarf') {
    const red = ['red', 'pink', 'orange', 'purple'].includes(f.ap.topColor);
    const c = red ? '#2f5f9f' : '#cc4238';
    ctx.lineWidth = f.ol;
    rboxFS(ctx, -1.2 * s - 0.3, -0.75 * s, 2.9 * s + 0.6, 1.25 * s, 0.5 * s, c);
    polyFS(ctx, [0.3 * s, 0.3, 1.4 * s, 0.3, 1.5 * s, 3.6 * s, 0.4 * s, 3.4 * s], c);
    if (f.lod === 0) {
      ctx.fillStyle = MAT.cream;
      ctx.fillRect(0.38 * s, 1.4 * s, 1.08 * s, 0.4 * s);
      ctx.fillRect(0.42 * s, 2.5 * s, 1.08 * s, 0.4 * s);
      ctx.fillRect(-0.6 * s, -0.7 * s, 0.4 * s, 1.15 * s);
      ctx.fillRect(0.6 * s, -0.7 * s, 0.4 * s, 1.15 * s);
    }
  } else {
    // bretelle du sac à dos sur l'épaule avant
    inkedStroke(ctx, [sw * 0.55, -0.1, sw * 0.4, sk.m.torso * 0.85], 0.6 * s + 0.1, mix(BACKPACK, INK, 0.25), f.ol * 0.7);
  }
  ctx.restore();
  ctx.lineWidth = f.ol;
}

/* ----------------------------------------------------------------------------
 * Objets tenus
 * ------------------------------------------------------------------------- */

const BIG_CARRY = new Set(['none', 'box', 'painting', 'moneybag', 'cake', 'map', 'baguette']);
const BIG_READ = new Set(['none', 'letter', 'map']);

/** L'objet est-il dessiné en grand entre les deux mains (porter, lire) ? */
export function isBigHeld(f: Figure): boolean {
  if (f.pose === 'carry') return BIG_CARRY.has(f.holding);
  if (f.pose === 'read') return BIG_READ.has(f.holding);
  return false;
}

/** Grand objet tenu à deux mains (porter : carton, tableau… ; lire : livre, lettre, plan). */
export function drawBigHeld(ctx: Ctx, f: Figure): void {
  if (!isBigHeld(f)) return;
  const sk = f.sk;
  const a = sk.hd[0];
  const b = sk.hd[1];
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  const s = 0.7 + 0.3 * sk.m.s;
  const lb = localBounds(f.ap.build, f.pose);
  const item = f.holding;
  if (f.pose === 'read') {
    const w = 3.0 * s;
    const h = 3.6 * s;
    let [dx] = fitShift(lb, cx - w, cx + w, cy - h, cy + 1);
    dx += 0;
    const x = cx + dx;
    if (item === 'map') {
      drawMap(ctx, x - w, cy - h * 0.7, w * 2, h, f.lod);
      return;
    }
    if (item === 'letter') {
      boxFS(ctx, x - w * 0.7, cy - h * 0.8, w * 1.4, h, MAT.paper);
      if (f.lod === 0) {
        ctx.fillStyle = MAT.paperLine;
        for (let i = 0; i < 4; i++) ctx.fillRect(x - w * 0.5, cy - h * 0.6 + i * 0.7, w * (i === 3 ? 0.6 : 1.0), 0.22);
      }
      return;
    }
    // livre ouvert
    polyFS(ctx, [x - w, cy - h * 0.55, x, cy - h * 0.35, x + w, cy - h * 0.55, x + w, cy + h * 0.25, x, cy + h * 0.45, x - w, cy + h * 0.25], '#8a3b33');
    polyFS(ctx, [x - w * 0.88, cy - h * 0.62, x, cy - h * 0.42, x, cy + h * 0.32, x - w * 0.88, cy + h * 0.14], MAT.paper);
    polyFS(ctx, [x + w * 0.88, cy - h * 0.62, x, cy - h * 0.42, x, cy + h * 0.32, x + w * 0.88, cy + h * 0.14], MAT.paper);
    if (f.lod === 0) {
      ctx.strokeStyle = MAT.paperLine;
      ctx.lineWidth = 0.2;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const yy = cy - h * 0.35 + i * 0.75;
        ctx.moveTo(x - w * 0.75, yy - 0.15);
        ctx.lineTo(x - 0.3, yy + 0.05);
        ctx.moveTo(x + 0.3, yy + 0.05);
        ctx.lineTo(x + w * 0.75, yy - 0.15);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = f.ol;
    }
    return;
  }
  // porter
  switch (item) {
    case 'painting': {
      const w = 4.3 * s;
      const h = 3.5 * s;
      const [dx, dy] = fitShift(lb, cx - w, cx + w, cy - h, cy + h);
      drawPaintingFrame(ctx, cx + dx - w, cy + dy - h * 1.05, w * 2, h * 2, f.lod);
      return;
    }
    case 'moneybag': {
      drawMoneybag(ctx, cx, cy + 0.6, 3.0 * s, f.lod);
      return;
    }
    case 'cake': {
      drawCake(ctx, cx, cy - 0.3, 2.6 * s, f.lod);
      return;
    }
    case 'map': {
      drawMap(ctx, cx - 3.4 * s, cy - 2.6 * s, 6.8 * s, 4.4 * s, f.lod);
      return;
    }
    case 'baguette': {
      // brassée de baguettes
      for (let i = 0; i < 3; i++) drawBaguette(ctx, cx - 3.2 * s + i * 0.6, cy + 1.6 - i * 0.7, cx + 3.2 * s + i * 0.4, cy - 2.6 - i * 0.6, f.lod);
      return;
    }
    default: {
      // carton
      const w = 3.3 * s;
      const h = 2.9 * s;
      const [dx, dy] = fitShift(lb, cx - w, cx + w, cy - h, cy + h);
      drawBox(ctx, cx + dx - w, cy + dy - h * 1.1, w * 2, h * 2, f.lod);
    }
  }
}

/** Objet tenu dans la main avant (h = position de la main). */
export function drawHeld(ctx: Ctx, f: Figure, h: Pt): void {
  const item = f.holding;
  if (item === 'none' && f.pose !== 'phone') return;
  const lod = f.lod;
  const s = 0.7 + 0.3 * f.sk.m.s;
  const lb = f.pose === 'window' ? { x0: -15, x1: 15, y0: -25, y1: 2 } : localBounds(f.ap.build, f.pose);
  // Extensions de l'objet autour de la main : [gauche, droite, haut, bas]
  const ext = HELD_EXT[item === 'none' ? 'phone' : item];
  const [dx, dy] = fitShift(lb, h.x - ext[0] * s, h.x + ext[1] * s, h.y - ext[2] * s, h.y + ext[3] * s);
  const x = h.x + dx;
  const y = h.y + dy;
  switch (item === 'none' ? 'phone' : item) {
    case 'knife': {
      polyFS(ctx, [x + 0.7 * s, y - 0.45 * s, x + 4.2 * s, y - 0.1 * s, x + 0.7 * s, y + 0.45 * s], MAT.silver);
      boxFS(ctx, x - 0.9 * s, y - 0.4 * s, 1.7 * s, 0.8 * s, MAT.woodDark);
      return;
    }
    case 'moneybag': {
      drawMoneybag(ctx, x + 0.3, y + 2.4 * s, 2.0 * s, lod);
      return;
    }
    case 'painting': {
      drawPaintingFrame(ctx, x - 1.0 * s, y - 0.8 * s, 7.0 * s, 5.6 * s, lod);
      return;
    }
    case 'key': {
      ctx.lineWidth = 0.45;
      ctx.strokeStyle = MAT.goldDark;
      ctx.beginPath();
      ctx.arc(x + 0.9 * s, y - 0.2, 0.75 * s, 0, TAU);
      ctx.moveTo(x + 1.6 * s, y - 0.2);
      ctx.lineTo(x + 3.6 * s, y - 0.2);
      ctx.moveTo(x + 3.0 * s, y - 0.2);
      ctx.lineTo(x + 3.0 * s, y + 0.6 * s);
      ctx.moveTo(x + 3.6 * s, y - 0.2);
      ctx.lineTo(x + 3.6 * s, y + 0.6 * s);
      ctx.stroke();
      ctx.lineWidth = 0.28;
      ctx.strokeStyle = MAT.gold;
      ctx.beginPath();
      ctx.arc(x + 0.9 * s, y - 0.2, 0.75 * s, 0, TAU);
      ctx.moveTo(x + 1.6 * s, y - 0.2);
      ctx.lineTo(x + 3.6 * s, y - 0.2);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = f.ol;
      return;
    }
    case 'phone': {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f.pose === 'phone' ? -0.35 : 0);
      rboxFS(ctx, -0.55 * s, -1.9 * s, 1.15 * s, 2.3 * s, 0.25, '#2b2a2c');
      if (lod === 0) {
        ctx.fillStyle = '#7fb6d6';
        ctx.fillRect(-0.35 * s, -1.65 * s, 0.75 * s, 1.5 * s);
      }
      ctx.restore();
      return;
    }
    case 'crowbar': {
      ctx.lineCap = 'round';
      inkedStroke(ctx, [x - 0.3 * s, y + 1.8 * s, x + 1.0 * s, y - 3.2 * s, x + 1.8 * s, y - 4.0 * s, x + 2.6 * s, y - 3.4 * s], 0.55 * s, MAT.red, f.ol * 0.8);
      return;
    }
    case 'letter': {
      boxFS(ctx, x - 0.4 * s, y - 2.2 * s, 3.4 * s, 2.3 * s, MAT.paper);
      if (lod === 0) {
        ctx.lineWidth = 0.25;
        ctx.beginPath();
        ctx.moveTo(x - 0.4 * s, y - 2.2 * s);
        ctx.lineTo(x + 1.3 * s, y - 1.0 * s);
        ctx.lineTo(x + 3.0 * s, y - 2.2 * s);
        ctx.stroke();
        ctx.fillStyle = MAT.red;
        ctx.fillRect(x + 2.2 * s, y - 2.0 * s, 0.6 * s, 0.6 * s);
        ctx.lineWidth = f.ol;
      }
      return;
    }
    case 'bottle': {
      polyFS(
        ctx,
        [
          x - 0.65 * s, y + 1.4 * s,
          x - 0.65 * s, y - 1.3 * s,
          x - 0.25 * s, y - 2.0 * s,
          x - 0.25 * s, y - 3.0 * s,
          x + 0.35 * s, y - 3.0 * s,
          x + 0.35 * s, y - 2.0 * s,
          x + 0.75 * s, y - 1.3 * s,
          x + 0.75 * s, y + 1.4 * s,
        ],
        '#3f7d4f',
      );
      if (lod === 0) {
        ctx.fillStyle = MAT.cream;
        ctx.fillRect(x - 0.6 * s, y - 0.6 * s, 1.3 * s, 0.9 * s);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(x + 0.35 * s, y - 1.0 * s, 0.2 * s, 2.0 * s);
      }
      return;
    }
    case 'cake': {
      drawCake(ctx, x + 0.4 * s, y - 0.6, 1.9 * s, lod);
      return;
    }
    case 'leash': {
      // la laisse file vers l'avant, jusqu'au bord de l'emprise, à hauteur de collier
      const ex = lb.x1 - 0.6;
      const lie = f.pose === 'lie';
      const ey = lie ? Math.min(y, -1.2) : -2.4;
      ctx.strokeStyle = MAT.red;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo((x + ex) / 2, Math.min(Math.max(y, ey) + 1.5, lb.y1 - 0.8), ex, ey);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = f.ol;
      return;
    }
    case 'flashlight': {
      const beamEnd = Math.min(lb.x1 - 0.6, x + 8.5 * s);
      if (beamEnd > x + 2.6 * s) {
        ctx.fillStyle = 'rgba(255, 236, 140, 0.55)';
        ctx.beginPath();
        ctx.moveTo(x + 2.2 * s, y - 0.5 * s);
        ctx.lineTo(beamEnd, y - 2.4 * s);
        ctx.lineTo(beamEnd, y + 2.4 * s);
        ctx.lineTo(x + 2.2 * s, y + 0.5 * s);
        ctx.closePath();
        ctx.fill();
      }
      rboxFS(ctx, x - 0.9 * s, y - 0.5 * s, 3.2 * s, 1.0 * s, 0.3, '#45484b');
      boxFS(ctx, x + 2.0 * s, y - 0.7 * s, 0.6 * s, 1.4 * s, '#f7e7a0');
      return;
    }
    case 'jewel': {
      drawJewel(ctx, x + 0.9 * s, y - 1.6 * s, 1.3 * s, lod);
      return;
    }
    case 'map': {
      drawMap(ctx, x - 0.6 * s, y - 3.4 * s, 4.6 * s, 3.4 * s, lod);
      return;
    }
    case 'icecream': {
      polyFS(ctx, [x - 0.8 * s, y - 1.0 * s, x + 0.8 * s, y - 1.0 * s, x, y + 1.4 * s], '#d9a65c');
      circleFS(ctx, x, y - 1.6 * s, 0.95 * s, '#f5a3bd');
      if (lod === 0) circleFS(ctx, x + 0.25, y - 2.6 * s, 0.35 * s, '#c0392b');
      return;
    }
    case 'baguette': {
      drawBaguette(ctx, x - 1.0 * s, y + 1.4 * s, x + 4.2 * s, y - 3.6 * s, lod);
      return;
    }
    case 'box': {
      drawBox(ctx, x - 0.4 * s, y - 1.8 * s, 3.6 * s, 3.2 * s, lod);
      return;
    }
    case 'rope': {
      ctx.strokeStyle = '#8c6a3a';
      ctx.lineWidth = 1.0 * s;
      ctx.beginPath();
      ctx.ellipse(x + 0.4 * s, y + 1.7 * s, 1.5 * s, 1.7 * s, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = '#c9a466';
      ctx.lineWidth = 0.55 * s;
      ctx.beginPath();
      ctx.ellipse(x + 0.4 * s, y + 1.7 * s, 1.5 * s, 1.7 * s, 0, 0, TAU);
      ctx.ellipse(x + 0.7 * s, y + 1.9 * s, 1.1 * s, 1.3 * s, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = f.ol;
      return;
    }
    case 'needle': {
      drawNeedle(ctx, x + 0.2, y - 0.2, 2.6 * s, lod, -0.9);
      return;
    }
  }
}

/** Extension des objets autour de la main (unités, avant échelle) : gauche, droite, haut, bas. */
const HELD_EXT: Record<string, [number, number, number, number]> = {
  knife: [1, 4.4, 0.6, 0.6],
  moneybag: [2, 2.5, 0.5, 4.6],
  painting: [1.1, 6.2, 1, 4.9],
  key: [0.3, 3.8, 1, 0.7],
  phone: [0.8, 0.8, 2.2, 0.6],
  crowbar: [0.5, 2.9, 4.3, 2],
  letter: [0.5, 3.1, 2.3, 0.2],
  bottle: [0.8, 0.9, 3.1, 1.5],
  cake: [2.2, 3, 2.4, 0.8],
  leash: [0.3, 0.5, 0.5, 2],
  flashlight: [1, 2.8, 2.6, 2.6],
  jewel: [0.6, 2.4, 3.2, 0.2],
  map: [0.7, 4.1, 3.5, 0.2],
  icecream: [1, 1, 2.9, 1.5],
  baguette: [1.9, 5.2, 4.5, 2.3],
  box: [0.5, 3.3, 1.9, 1.5],
  rope: [1.2, 2.1, 0.2, 3.5],
  needle: [0.3, 2.4, 2.2, 0.4],
};

/* ----------------------------------------------------------------------------
 * Petits dessins réutilisés (aussi par les objets posés au sol)
 * ------------------------------------------------------------------------- */

export function drawMoneybag(ctx: Ctx, cx: number, cy: number, r: number, lod: number): void {
  // sac de toile noué, symbole « € »
  ctx.fillStyle = '#c9ad74';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.35, cy - r * 0.95);
  ctx.quadraticCurveTo(cx - r * 1.05, cy - r * 0.2, cx - r * 0.95, cy + r * 0.45);
  ctx.quadraticCurveTo(cx - r * 0.8, cy + r * 1.0, cx, cy + r * 1.0);
  ctx.quadraticCurveTo(cx + r * 0.8, cy + r * 1.0, cx + r * 0.95, cy + r * 0.45);
  ctx.quadraticCurveTo(cx + r * 1.05, cy - r * 0.2, cx + r * 0.35, cy - r * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // collet
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.35, cy - r * 0.95);
  ctx.lineTo(cx - r * 0.55, cy - r * 1.3);
  ctx.lineTo(cx + r * 0.55, cy - r * 1.3);
  ctx.lineTo(cx + r * 0.35, cy - r * 0.95);
  ctx.fill();
  ctx.stroke();
  if (lod === 0) {
    const lw = ctx.lineWidth;
    ctx.lineWidth = Math.max(0.3, r * 0.16);
    ctx.strokeStyle = '#2f6b3a';
    ctx.beginPath();
    ctx.arc(cx + r * 0.05, cy + r * 0.25, r * 0.38, 0.8, Math.PI * 2 - 0.8);
    ctx.moveTo(cx - r * 0.45, cy + r * 0.13);
    ctx.lineTo(cx + r * 0.15, cy + r * 0.13);
    ctx.moveTo(cx - r * 0.45, cy + r * 0.37);
    ctx.lineTo(cx + r * 0.15, cy + r * 0.37);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw;
  }
}

export function drawPaintingFrame(ctx: Ctx, x: number, y: number, w: number, h: number, lod: number): void {
  boxFS(ctx, x, y, w, h, MAT.gold);
  const m = Math.min(w, h) * 0.13;
  ctx.fillStyle = '#9fc6dc';
  ctx.fillRect(x + m, y + m, w - 2 * m, h - 2 * m);
  // petit paysage : colline et soleil
  ctx.fillStyle = '#6fa05a';
  ctx.beginPath();
  ctx.moveTo(x + m, y + h - m);
  ctx.quadraticCurveTo(x + w * 0.4, y + h * 0.35, x + w - m, y + h * 0.62);
  ctx.lineTo(x + w - m, y + h - m);
  ctx.closePath();
  ctx.fill();
  if (lod === 0) {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.32, Math.min(w, h) * 0.1, 0, TAU);
    ctx.fill();
    ctx.lineWidth = 0.25;
    ctx.strokeRect(x + m, y + m, w - 2 * m, h - 2 * m);
    ctx.lineWidth = 0.5;
  }
}

export function drawBox(ctx: Ctx, x: number, y: number, w: number, h: number, lod: number): void {
  boxFS(ctx, x, y, w, h, MAT.cardboard);
  ctx.fillStyle = MAT.cardboardDark;
  ctx.fillRect(x, y, w, h * 0.18);
  if (lod === 0) {
    ctx.fillStyle = '#e6d4a6';
    ctx.fillRect(x + w * 0.42, y, w * 0.16, h);
    const lw = ctx.lineWidth;
    ctx.lineWidth = 0.25;
    ctx.strokeRect(x, y, w, h * 0.18);
    ctx.lineWidth = lw;
  }
}

export function drawCake(ctx: Ctx, cx: number, cy: number, r: number, lod: number): void {
  // assiette
  ellipseFS(ctx, cx, cy, r * 1.3, r * 0.28, MAT.white);
  // gâteau à étages
  boxFS(ctx, cx - r, cy - r * 1.1, r * 2, r * 1.05, '#f3b8c8');
  ctx.fillStyle = MAT.white;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r * 1.1);
  ctx.lineTo(cx + r, cy - r * 1.1);
  ctx.lineTo(cx + r, cy - r * 0.8);
  for (let i = 4; i >= 0; i--) ctx.quadraticCurveTo(cx - r + (i + 0.5) * r * 0.4, cy - r * 0.5, cx - r + i * r * 0.4, cy - r * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  circleFS(ctx, cx, cy - r * 1.3, r * 0.24, '#d23b3b', lod === 0);
}

export function drawMap(ctx: Ctx, x: number, y: number, w: number, h: number, lod: number): void {
  boxFS(ctx, x, y, w, h, '#efe2bd');
  if (lod === 0) {
    const lw = ctx.lineWidth;
    ctx.lineWidth = 0.2;
    ctx.strokeStyle = MAT.paperLine;
    ctx.beginPath();
    ctx.moveTo(x + w / 3, y);
    ctx.lineTo(x + w / 3, y + h);
    ctx.moveTo(x + (2 * w) / 3, y);
    ctx.lineTo(x + (2 * w) / 3, y + h);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
    ctx.strokeStyle = MAT.red;
    ctx.lineWidth = 0.3;
    ctx.setLineDash([0.5, 0.4]);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.8);
    ctx.quadraticCurveTo(x + w * 0.4, y + h * 0.2, x + w * 0.75, y + h * 0.35);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    const px = x + w * 0.78;
    const py = y + h * 0.35;
    ctx.moveTo(px - 0.4, py - 0.4);
    ctx.lineTo(px + 0.4, py + 0.4);
    ctx.moveTo(px + 0.4, py - 0.4);
    ctx.lineTo(px - 0.4, py + 0.4);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw;
  }
}

export function drawBaguette(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, lod: number): void {
  const lw = ctx.lineWidth;
  inkedStroke(ctx, [x0, y0, x1, y1], 1.1, '#d9a35a', Math.min(lw, 0.6));
  if (lod === 0) {
    ctx.strokeStyle = '#a8732f';
    ctx.lineWidth = 0.22;
    ctx.beginPath();
    for (let t = 0.2; t < 0.9; t += 0.2) {
      const px = x0 + (x1 - x0) * t;
      const py = y0 + (y1 - y0) * t;
      ctx.moveTo(px - 0.3, py - 0.25);
      ctx.lineTo(px + 0.35, py + 0.15);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
  }
  ctx.lineWidth = lw;
}

export function drawJewel(ctx: Ctx, cx: number, cy: number, r: number, lod: number): void {
  polyFS(ctx, [cx - r, cy - r * 0.3, cx - r * 0.5, cy - r * 0.8, cx + r * 0.5, cy - r * 0.8, cx + r, cy - r * 0.3, cx, cy + r], '#7fd6ea');
  if (lod === 0) {
    const lw = ctx.lineWidth;
    ctx.lineWidth = 0.18;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r * 0.3);
    ctx.lineTo(cx + r, cy - r * 0.3);
    ctx.moveTo(cx - r * 0.4, cy - r * 0.3);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx + r * 0.4, cy - r * 0.3);
    ctx.stroke();
    // éclat
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.25;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.9, cy - r * 1.5);
    ctx.lineTo(cx + r * 0.9, cy - r * 0.95);
    ctx.moveTo(cx + r * 0.62, cy - r * 1.22);
    ctx.lineTo(cx + r * 1.18, cy - r * 1.22);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw;
  }
}

/** Aiguille dorée : fine, avec un chas et un éclat. `len` = longueur, `ang` = angle (radians). */
export function drawNeedle(ctx: Ctx, cx: number, cy: number, len: number, lod: number, ang = -0.5): void {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const x0 = cx - (c * len) / 2;
  const y0 = cy - (s * len) / 2;
  const x1 = cx + (c * len) / 2;
  const y1 = cy + (s * len) / 2;
  const lw = ctx.lineWidth;
  ctx.lineCap = 'round';
  ctx.strokeStyle = MAT.goldDark;
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = '#f2c94c';
  ctx.lineWidth = 0.42;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  if (lod === 0) {
    // chas
    ctx.strokeStyle = MAT.goldDark;
    ctx.lineWidth = 0.18;
    ctx.beginPath();
    ctx.ellipse(x1 - c * 0.45, y1 - s * 0.45, 0.32, 0.14, ang, 0, TAU);
    ctx.stroke();
    // éclat en étoile
    ctx.strokeStyle = '#fffbe6';
    ctx.lineWidth = 0.2;
    const sx = cx + c * len * 0.1 - s * 0.4;
    const sy = cy + s * len * 0.1 - c * 0.4 - 0.4;
    ctx.beginPath();
    ctx.moveTo(sx - 0.9, sy);
    ctx.lineTo(sx + 0.9, sy);
    ctx.moveTo(sx, sy - 0.9);
    ctx.lineTo(sx, sy + 0.9);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
}

export { COLOR_HEX };
