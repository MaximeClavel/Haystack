// Personnages : silhouettes de 20 u (13 u pour un enfant), vue de trois quarts, face à droite
// (le miroir est appliqué pour facing = 'left').
//
// Ordre de dessin : ombre → accessoires de dos → bras arrière → jambes → bas → buste → tête
// (cheveux, chapeau) → bras avant et objet tenu → bulle d'émotion (hors miroir).

import type { Emote, HeldItem, PersonAppearance, PersonEntity, Pose } from '../types';
import type { Lod } from './lod';
import {
  COLOR_DARK,
  COLOR_HEX,
  COLOR_LIGHT,
  HAIR_DARK,
  HAIR_HEX,
  HAT_HEX,
  INK,
  MAT,
  PATTERN_INK,
  SKIN_DARK,
  SKIN_HEX,
  mix,
} from './palette';
import { checksTex, dotsTex, getPattern, resBucket, setPatternFill, stripesTex } from './patterns';
import { METRICS, type Pt, type RideSpec, type Skel, riderSkeleton, skeletonFor } from './skeleton';
import { type Ctx, deviceScale, groundShadow, inkedStroke, seedOf } from './util';
import { drawAccessoryBack, drawAccessoryBehind, drawAccessoryFront, drawHeld, drawBigHeld, isBigHeld } from './held';
import { drawEmote } from './emote';

/** Tout ce qu'il faut pour dessiner une silhouette (couleurs résolues + squelette). */
export interface Figure {
  ap: PersonAppearance;
  sk: Skel;
  lod: Lod;
  /** Épaisseur du contour. */
  ol: number;
  top: string;
  topDark: string;
  topLight: string;
  sleeve: string;
  sleeveShort: boolean;
  bottom: string;
  bottomDark: string;
  skin: string;
  skinDark: string;
  hair: string;
  hairDark: string;
  holding: HeldItem;
  emote: Emote;
  pose: Pose;
  /** Couleur des rideaux (pose window). */
  seed: number;
}

const SHIRT_WHITE = '#fbf8f1';
const UNDERSHIRT = '#f3ead6';

export function makeFigure(ap: PersonAppearance, sk: Skel, lod: Lod, pose: Pose, holding: HeldItem, emote: Emote, seed: number): Figure {
  const top = COLOR_HEX[ap.topColor];
  let sleeve = top;
  let sleeveShort = false;
  if (ap.top === 'tshirt' || ap.top === 'dress') sleeveShort = true;
  if (ap.top === 'apron') sleeve = ap.topColor === 'white' ? '#c9d6e0' : SHIRT_WHITE;
  if (ap.top === 'overalls') {
    sleeve = UNDERSHIRT;
    sleeveShort = true;
  }
  return {
    ap,
    sk,
    lod,
    ol: lod === 0 ? 0.5 : 0.8,
    top,
    topDark: COLOR_DARK[ap.topColor],
    topLight: COLOR_LIGHT[ap.topColor],
    sleeve,
    sleeveShort,
    bottom: COLOR_HEX[ap.bottomColor],
    bottomDark: COLOR_DARK[ap.bottomColor],
    skin: SKIN_HEX[ap.skin],
    skinDark: SKIN_DARK[ap.skin],
    hair: HAIR_HEX[ap.hairColor],
    hairDark: HAIR_DARK[ap.hairColor],
    holding,
    emote,
    pose,
    seed,
  };
}

/* ----------------------------------------------------------------------------
 * Point d'entrée
 * ------------------------------------------------------------------------- */

export function drawPerson(ctx: Ctx, e: PersonEntity, lod: Lod): void {
  const ap = e.appearance;
  const x = e.x;
  const y = e.y - (e.z ?? 0);
  const dir = e.facing === 'left' ? -1 : 1;
  if (lod === 2) {
    drawPersonLod2(ctx, ap, e.pose, x, y);
    return;
  }
  const sk = skeletonFor(ap.build, e.pose);
  const f = makeFigure(ap, sk, lod, e.pose, e.holding ?? 'none', e.emote ?? 'none', seedOf(e.id));
  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) ctx.scale(-1, 1);
  if (e.pose === 'window') drawWindowBust(ctx, f);
  else drawFigure(ctx, f);
  ctx.restore();
  if (f.emote !== 'none') {
    const top = e.pose === 'window' ? windowHeadTop(f) : sk.headTop;
    const hatH = hatHeight(ap.hat, sk.m.headR) * (e.pose === 'window' ? WIN_K : 1);
    drawEmote(ctx, f.emote, x + dir * (top.x + 5.6), y + Math.min(top.y - 4.2, top.y - hatH * 0.35 - 3.6), lod, dir);
  }
}

/** Silhouette de vue d'ensemble : deux aplats (haut, bas). Très rapide. */
function drawPersonLod2(ctx: Ctx, ap: PersonAppearance, pose: Pose, x: number, y: number): void {
  const m = METRICS[ap.build];
  const w = m.sw * 1.7;
  if (pose === 'lie') {
    ctx.fillStyle = COLOR_HEX[ap.topColor];
    ctx.fillRect(x - 3 * m.s - 2, y - 4, 7 * m.s, 4);
    ctx.fillStyle = COLOR_HEX[ap.bottomColor];
    ctx.fillRect(x - 9 * m.s, y - 3.5, 6 * m.s, 3.5);
    return;
  }
  const h = pose === 'sit' || pose === 'crouch' ? 15 * (m.legLen / 8.6) : pose === 'window' ? 9 : m.legLen + m.torso + m.neckGap + 2 * m.headR;
  const legs = pose === 'window' ? 0 : pose === 'sit' || pose === 'crouch' ? m.legLen * 0.55 : m.legLen;
  ctx.fillStyle = COLOR_HEX[ap.topColor];
  ctx.fillRect(x - w / 2, y - h, w, h - legs);
  if (legs > 0) {
    ctx.fillStyle = COLOR_HEX[ap.bottomColor];
    ctx.fillRect(x - w * 0.4, y - legs, w * 0.8, legs);
  }
}

/** Dessine une silhouette complète dans le repère courant (ancre aux pieds, face à droite). */
export function drawFigure(ctx: Ctx, f: Figure): void {
  const sk = f.sk;
  const ap = f.ap;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = f.ol;

  if (sk.shadow[1] > 0) groundShadow(ctx, sk.shadow[0], 0.2, sk.shadow[1], sk.shadow[2]);

  // Accessoires derrière tout le corps (sac à dos, ballon, parapluie, valise…)
  drawAccessoryBehind(ctx, f);
  // Volumes derrière la tête : capuche, cheveux longs, queue de cheval, boucles
  if (ap.top === 'hoodie') withTorso(ctx, sk, () => drawHood(ctx, f));
  withHead(ctx, sk, () => drawHairBack(ctx, f));

  if (!sk.farArmOver) {
    drawArm(ctx, f, 0);
    drawAccessoryBack(ctx, f);
  }
  drawLegs(ctx, f);
  drawLowerGarment(ctx, f);
  withTorso(ctx, sk, () => drawTorso(ctx, f));
  drawAccessoryFront(ctx, f);
  withHead(ctx, sk, () => drawHead(ctx, f));
  if (sk.farArmOver) {
    drawArm(ctx, f, 0);
    drawAccessoryBack(ctx, f);
  }
  if (f.pose === 'carry' || f.pose === 'read') drawBigHeld(ctx, f);
  drawArm(ctx, f, 1);
  if (!isBigHeld(f)) drawHeld(ctx, f, sk.hd[1]);
  drawHand(ctx, f, sk.hd[1], 1);
  if (f.pose === 'point' && f.lod === 0) {
    // index tendu
    const h = sk.hd[1];
    inkedStroke(ctx, [h.x, h.y, h.x + 1.3 * sk.m.s, h.y - 0.1], 0.5 * sk.m.s, f.skin, f.ol * 0.8);
  }
}

/* ----------------------------------------------------------------------------
 * Repères locaux
 * ------------------------------------------------------------------------- */

function withTorso(ctx: Ctx, sk: Skel, fn: () => void): void {
  if (sk.lean === 0 && !sk.lie) {
    ctx.translate(sk.N.x, sk.N.y);
    fn();
    ctx.translate(-sk.N.x, -sk.N.y);
    return;
  }
  ctx.save();
  ctx.transform(sk.ax.x, sk.ax.y, sk.ay.x, sk.ay.y, sk.N.x, sk.N.y);
  fn();
  ctx.restore();
}

function withHead(ctx: Ctx, sk: Skel, fn: () => void): void {
  const h = sk.head;
  if (sk.lie) {
    ctx.save();
    // haut de la tête vers +x, visage vers le haut
    ctx.transform(0, -1, -1, 0, h.x, h.y);
    fn();
    ctx.restore();
    return;
  }
  if (sk.headRot === 0) {
    ctx.translate(h.x, h.y);
    fn();
    ctx.translate(-h.x, -h.y);
    return;
  }
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(sk.headRot);
  fn();
  ctx.restore();
}

/* ----------------------------------------------------------------------------
 * Bras et mains
 * ------------------------------------------------------------------------- */

function drawArm(ctx: Ctx, f: Figure, i: 0 | 1): void {
  const sk = f.sk;
  const s = sk.sh[i];
  const e = sk.el[i];
  const h = sk.hd[i];
  const w = sk.m.armW;
  if (f.sleeveShort) {
    inkedStroke(ctx, [s.x, s.y, e.x, e.y, h.x, h.y], w * 0.82, f.skin, f.ol);
    const mx = s.x + (e.x - s.x) * 0.62;
    const my = s.y + (e.y - s.y) * 0.62;
    inkedStroke(ctx, [s.x, s.y, mx, my], w + 0.25, f.sleeve, f.ol);
  } else {
    inkedStroke(ctx, [s.x, s.y, e.x, e.y, h.x, h.y], w, f.sleeve, f.ol);
  }
  if (i === 0) drawHand(ctx, f, h, 0);
}

function drawHand(ctx: Ctx, f: Figure, h: Pt, i: 0 | 1): void {
  const r = 0.82 * f.sk.m.s + 0.1;
  ctx.fillStyle = f.skin;
  ctx.beginPath();
  ctx.arc(h.x, h.y, f.pose === 'wave' && i === 1 ? r * 1.25 : r, 0, TAU);
  ctx.fill();
  ctx.lineWidth = f.ol * 0.85;
  ctx.stroke();
  ctx.lineWidth = f.ol;
  if (f.pose === 'wave' && i === 1 && f.lod === 0) {
    // petits traits de mouvement
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 2.6, -2.4, -1.7);
    ctx.moveTo(h.x + Math.cos(-1.4) * r * 2.6, h.y + Math.sin(-1.4) * r * 2.6);
    ctx.arc(h.x, h.y, r * 2.6, -1.4, -0.7);
    ctx.stroke();
    ctx.lineWidth = f.ol;
  }
}

/* ----------------------------------------------------------------------------
 * Jambes et bas
 * ------------------------------------------------------------------------- */

function drawLegs(ctx: Ctx, f: Figure): void {
  const sk = f.sk;
  const ap = f.ap;
  const w = sk.m.legW;
  const covered = ap.top === 'dress' || ap.top === 'coat';
  const trousers = ap.bottom === 'trousers';
  const shorts = ap.bottom === 'shorts';
  // Couleur des jambes : pantalon, ou peau (jupe, short, robe)
  let legColor = trousers ? f.bottom : f.skin;
  // Sous une robe, un « pantalon » se lit comme des collants.
  if (ap.top === 'dress' && trousers) legColor = f.bottom;
  // Bassin (pantalon et short) : relie les deux jambes sous le buste.
  if ((trousers || shorts) && !covered) {
    ctx.fillStyle = f.bottom;
    polyPath(ctx, sk.pelvis);
    ctx.fill();
    ctx.stroke();
  }
  for (let i = 0; i < 2; i++) {
    const hp = sk.hip[i];
    const kn = sk.kn[i];
    const ft = sk.ft[i];
    inkedStroke(ctx, [hp.x, hp.y, kn.x, kn.y, ft.x, ft.y], trousers ? w : w * 0.8, legColor, f.ol);
    if (shorts && !covered) {
      const mx = hp.x + (kn.x - hp.x) * 0.9;
      const my = hp.y + (kn.y - hp.y) * 0.9;
      inkedStroke(ctx, [hp.x, hp.y, mx, my], w + 0.45, f.bottom, f.ol);
    }
    drawShoe(ctx, f, ft);
  }
  if (shorts && !covered) {
    // re-couvre le haut des cuisses (le contour de la jambe avant ne doit pas couper le short)
    ctx.fillStyle = f.bottom;
    polyPath(ctx, sk.pelvis);
    ctx.fill();
  }
}

function drawShoe(ctx: Ctx, f: Figure, ft: Pt): void {
  const s = f.sk.m.s;
  ctx.fillStyle = MAT.shoe;
  ctx.beginPath();
  if (f.sk.feetUp) ctx.ellipse(ft.x - 0.3 * s, ft.y - 0.1, 0.65 * s + 0.1, 1.25 * s, 0, 0, TAU);
  else ctx.ellipse(ft.x + 0.5 * s, ft.y + 0.38 * s, 1.3 * s + 0.1, 0.66 * s + 0.05, 0, 0, TAU);
  ctx.fill();
  if (f.lod === 0) {
    ctx.lineWidth = f.ol * 0.7;
    ctx.stroke();
    ctx.lineWidth = f.ol;
  }
}

function polyPath(ctx: Ctx, pts: readonly number[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}

/** Remplit la forme courante avec la couleur du haut (et son motif au niveau 0). */
function fillTop(ctx: Ctx, f: Figure, color = f.top): void {
  if (f.lod === 0 && f.ap.topPattern !== 'plain' && color === f.top) {
    const pat = topPattern(ctx, f);
    if (pat) {
      setPatternFill(ctx, pat, 0, 0);
      ctx.fill();
      return;
    }
  }
  ctx.fillStyle = color;
  ctx.fill();
}

function topPattern(ctx: Ctx, f: Figure): CanvasPattern | null {
  const c = f.ap.topColor;
  const res = Math.max(2, resBucket(deviceScale(ctx)));
  switch (f.ap.topPattern) {
    case 'stripes':
      return getPattern(ctx, `stripes|${c}`, res, () => stripesTex(COLOR_HEX[c], PATTERN_INK[c]));
    case 'dots':
      return getPattern(ctx, `dots|${c}`, res, () => dotsTex(COLOR_HEX[c], PATTERN_INK[c]));
    case 'checks':
      return getPattern(ctx, `checks|${c}`, res, () => checksTex(COLOR_HEX[c], COLOR_DARK[c], COLOR_LIGHT[c]));
    default:
      return null;
  }
}

/** Jupe, bas de robe, pans de manteau, tablier (formes précalculées sur les jambes). */
function drawLowerGarment(ctx: Ctx, f: Figure): void {
  const ap = f.ap;
  const sk = f.sk;
  if (ap.top === 'coat') {
    polyPath(ctx, sk.coat);
    fillTop(ctx, f);
    ctx.stroke();
    if (f.lod === 0 && !sk.lie) {
      // fente du manteau au milieu
      ctx.lineWidth = 0.3;
      const P = sk.P;
      const k = sk.kn[1];
      ctx.beginPath();
      ctx.moveTo(P.x + sk.ax.x * 0.6, P.y + 0.3);
      ctx.lineTo((P.x + k.x) / 2 + 0.6, (k.y + sk.ft[1].y) / 2 - 1);
      ctx.stroke();
      ctx.lineWidth = f.ol;
    }
    return;
  }
  if (ap.top === 'dress') {
    if (ap.bottom === 'skirt') {
      // jupon visible sous la robe
      ctx.fillStyle = f.bottom;
      polyPath(ctx, scaleHull(sk.dress, sk.P, 1.12));
      ctx.fill();
      ctx.stroke();
    }
    polyPath(ctx, sk.dress);
    fillTop(ctx, f);
    ctx.stroke();
    return;
  }
  if (ap.bottom === 'skirt') {
    ctx.fillStyle = f.bottom;
    polyPath(ctx, sk.skirt);
    ctx.fill();
    ctx.stroke();
    if (f.lod === 0 && !sk.lie && sk.pose !== 'sit') {
      // plis
      ctx.lineWidth = 0.28;
      ctx.strokeStyle = f.bottomDark;
      const P = sk.P;
      ctx.beginPath();
      for (const dx of [-1.1, 0.3, 1.6]) {
        ctx.moveTo(P.x + dx * 0.6, P.y + 0.6);
        ctx.lineTo(P.x + dx, P.y + 3.2 * sk.m.s);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = f.ol;
    }
  }
}

function scaleHull(pts: readonly number[], c: Pt, k: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < pts.length; i += 2) out.push(c.x + (pts[i] - c.x) * k, c.y + (pts[i + 1] - c.y) * k);
  return out;
}

/* ----------------------------------------------------------------------------
 * Buste (repère du buste : origine = milieu des épaules, y vers la taille, x vers l'avant)
 * ------------------------------------------------------------------------- */

function torsoPath(ctx: Ctx, sw: number, hw: number, len: number, belly: number): void {
  ctx.beginPath();
  ctx.moveTo(-sw * 0.42, -0.15);
  ctx.quadraticCurveTo(-sw, -0.25, -sw, 1.1);
  ctx.lineTo(-hw, len);
  ctx.lineTo(hw, len);
  if (belly > 0) ctx.quadraticCurveTo(hw + belly * 1.6, len * 0.5, sw, 1.1);
  else ctx.lineTo(sw, 1.1);
  ctx.quadraticCurveTo(sw, -0.25, sw * 0.42, -0.15);
  ctx.closePath();
}

function drawHood(ctx: Ctx, f: Figure): void {
  const m = f.sk.m;
  ctx.fillStyle = f.topDark;
  ctx.beginPath();
  ctx.ellipse(-m.sw * 0.45, -0.9 * m.s, m.headR * 0.95, m.headR * 0.75, -0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

function drawTorso(ctx: Ctx, f: Figure): void {
  const m = f.sk.m;
  const s = m.s;
  const T = m.torso;
  const sw = m.sw;
  const hw = m.hw;
  const ap = f.ap;
  const lod = f.lod;
  const fine = lod === 0;
  // cou
  ctx.fillStyle = f.skin;
  ctx.beginPath();
  ctx.rect(-0.62 * s - 0.15, -1.0 * s, 1.24 * s + 0.3, 1.4 * s);
  ctx.fill();
  if (fine) {
    ctx.fillStyle = f.skinDark;
    ctx.fillRect(-0.62 * s - 0.15, 0, 1.24 * s + 0.3, 0.35);
  }

  switch (ap.top) {
    case 'tshirt': {
      torsoPath(ctx, sw, hw, T + 0.5, m.belly);
      fillTop(ctx, f);
      ctx.stroke();
      if (fine) {
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.arc(0.25, -0.2, 0.9 * s, 0.25, Math.PI - 0.25);
        ctx.stroke();
      }
      break;
    }
    case 'shirt': {
      torsoPath(ctx, sw, hw, T + 0.25, m.belly);
      fillTop(ctx, f);
      ctx.stroke();
      if (fine) {
        // col et boutonnière
        ctx.fillStyle = f.topLight;
        ctx.beginPath();
        ctx.moveTo(-0.9 * s, -0.2);
        ctx.lineTo(0.2, 1.0 * s);
        ctx.lineTo(1.3 * s, -0.2);
        ctx.lineTo(0.2, 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 0.3;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0.4, 1.0 * s);
        ctx.lineTo(0.4 + m.belly * 0.4, T + 0.2);
        ctx.stroke();
        dots(ctx, [0.75, 2.2 * s, 0.75 + m.belly * 0.2, 3.5 * s], 0.2, f.topDark);
        ctx.lineWidth = f.ol;
      }
      break;
    }
    case 'sweater': {
      torsoPath(ctx, sw + 0.15, hw + 0.15, T + 0.7, m.belly);
      fillTop(ctx, f);
      ctx.stroke();
      // col rond et bord-côte
      ctx.fillStyle = f.topDark;
      ctx.beginPath();
      ctx.ellipse(0.1, -0.1, 1.15 * s, 0.55 * s, 0, 0, Math.PI);
      ctx.fill();
      if (fine) {
        ctx.fillRect(-hw - 0.05, T - 0.1, hw * 2 + 0.1 + m.belly * 0.3, 0.8);
        ctx.lineWidth = 0.25;
        ctx.strokeStyle = f.topLight;
        ctx.beginPath();
        for (let x = -hw + 0.6; x < hw; x += 0.9) {
          ctx.moveTo(x, T);
          ctx.lineTo(x, T + 0.6);
        }
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.lineWidth = f.ol;
      }
      break;
    }
    case 'hoodie': {
      torsoPath(ctx, sw + 0.2, hw + 0.2, T + 0.9, m.belly);
      fillTop(ctx, f);
      ctx.stroke();
      if (fine) {
        // poche kangourou et cordons
        ctx.lineWidth = 0.3;
        ctx.fillStyle = f.topDark;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.55, T - 0.2);
        ctx.lineTo(-hw * 0.4, T - 2.2 * s);
        ctx.lineTo(hw * 0.65 + m.belly * 0.6, T - 2.2 * s);
        ctx.lineTo(hw * 0.8 + m.belly * 0.6, T - 0.2);
        ctx.closePath();
        ctx.globalAlpha = 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.strokeStyle = '#f5efe2';
        ctx.lineWidth = 0.32;
        ctx.beginPath();
        ctx.moveTo(-0.3, 0.2);
        ctx.lineTo(-0.35, 2.1 * s);
        ctx.moveTo(0.9, 0.2);
        ctx.lineTo(0.95, 2.1 * s);
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.lineWidth = f.ol;
      }
      break;
    }
    case 'coat': {
      torsoPath(ctx, sw + 0.25, hw + 0.2, T + 0.3, m.belly);
      fillTop(ctx, f);
      ctx.stroke();
      // revers
      ctx.fillStyle = f.topDark;
      ctx.beginPath();
      ctx.moveTo(-1.1 * s, -0.25);
      ctx.lineTo(0.3, 2.4 * s);
      ctx.lineTo(1.6 * s, -0.25);
      ctx.lineTo(0.9 * s, -0.4);
      ctx.lineTo(0.3, 1.2 * s);
      ctx.lineTo(-0.4 * s, -0.4);
      ctx.closePath();
      ctx.fill();
      if (fine) {
        ctx.lineWidth = 0.3;
        ctx.stroke();
        // ceinture et double rangée de boutons
        ctx.fillStyle = f.topDark;
        ctx.fillRect(-hw - 0.1, T - 0.9, hw * 2 + 0.2 + m.belly * 0.4, 0.75);
        ctx.fillStyle = MAT.gold;
        ctx.fillRect(0.0, T - 1.0, 0.9, 0.95);
        dots(ctx, [-0.3, 3.0 * s, 1.1, 3.0 * s, -0.3, 4.1 * s, 1.1, 4.1 * s], 0.24, INK);
        ctx.lineWidth = f.ol;
      }
      break;
    }
    case 'suit': {
      torsoPath(ctx, sw + 0.1, hw + 0.1, T + 1.3, m.belly);
      fillTop(ctx, f);
      ctx.stroke();
      // plastron blanc et cravate
      ctx.fillStyle = SHIRT_WHITE;
      ctx.beginPath();
      ctx.moveTo(-0.85 * s, -0.25);
      ctx.lineTo(0.35, 3.0 * s);
      ctx.lineTo(1.55 * s, -0.25);
      ctx.closePath();
      ctx.fill();
      const tie = ['red', 'pink', 'orange', 'purple'].includes(ap.topColor) ? COLOR_HEX.navy : COLOR_HEX.red;
      ctx.fillStyle = tie;
      ctx.beginPath();
      ctx.moveTo(0.05, -0.1);
      ctx.lineTo(0.75, -0.1);
      ctx.lineTo(0.62, 0.45);
      ctx.lineTo(0.85, 2.6 * s);
      ctx.lineTo(0.4, 3.1 * s);
      ctx.lineTo(-0.05, 2.6 * s);
      ctx.lineTo(0.2, 0.45);
      ctx.closePath();
      ctx.fill();
      if (fine) {
        ctx.lineWidth = 0.25;
        ctx.stroke();
        // revers
        ctx.strokeStyle = f.topDark;
        ctx.lineWidth = 0.45;
        ctx.beginPath();
        ctx.moveTo(-0.9 * s, -0.1);
        ctx.lineTo(0.3, 3.1 * s);
        ctx.lineTo(1.6 * s, -0.1);
        ctx.stroke();
        ctx.strokeStyle = INK;
        dots(ctx, [0.45, 3.9 * s, 0.5 + m.belly * 0.2, 4.9 * s], 0.22, INK);
        // pochette
        ctx.fillStyle = SHIRT_WHITE;
        ctx.fillRect(sw * 0.45, 1.6 * s, 0.9 * s, 0.35 * s);
        ctx.lineWidth = f.ol;
      }
      break;
    }
    case 'uniform': {
      torsoPath(ctx, sw + 0.1, hw + 0.1, T + 1.0, m.belly);
      fillTop(ctx, f);
      ctx.stroke();
      // ceinturon, épaulettes, insigne
      ctx.fillStyle = INK;
      ctx.fillRect(-hw - 0.1, T - 0.75, hw * 2 + 0.2 + m.belly * 0.5, 0.8);
      ctx.fillStyle = MAT.gold;
      ctx.fillRect(0.1, T - 0.8, 0.8, 0.9);
      ctx.fillRect(-sw - 0.1, 0.2, 1.5 * s, 0.6);
      ctx.fillRect(sw - 1.4 * s + 0.1, 0.2, 1.5 * s, 0.6);
      star(ctx, sw * 0.5 + 0.1, 2.0 * s, 0.85 * s + 0.15, MAT.gold, fine);
      if (fine) {
        dots(ctx, [0.15, 1.2 * s, 0.15, 2.4 * s, 0.15, 3.6 * s], 0.2, MAT.goldDark);
        ctx.lineWidth = f.ol;
      }
      break;
    }
    case 'dress': {
      torsoPath(ctx, sw - 0.05, hw - 0.2, T + 0.2, m.belly * 0.8);
      fillTop(ctx, f);
      ctx.stroke();
      // encolure
      ctx.fillStyle = f.skin;
      ctx.beginPath();
      ctx.ellipse(0.25, -0.15, 1.25 * s, 0.85 * s, 0, 0, Math.PI);
      ctx.fill();
      if (fine) {
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.ellipse(0.25, -0.15, 1.25 * s, 0.85 * s, 0, 0.1, Math.PI - 0.1);
        ctx.stroke();
        // ceinture fine
        ctx.fillStyle = f.topDark;
        ctx.fillRect(-hw, T - 0.45, hw * 2 + m.belly * 0.3, 0.5);
        ctx.lineWidth = f.ol;
      }
      break;
    }
    case 'apron': {
      // chemise
      torsoPath(ctx, sw, hw, T + 0.3, m.belly);
      ctx.fillStyle = f.sleeve;
      ctx.fill();
      ctx.stroke();
      // bavette du tablier
      ctx.beginPath();
      ctx.moveTo(-sw * 0.5, 1.2 * s);
      ctx.lineTo(sw * 0.62 + m.belly * 0.3, 1.2 * s);
      ctx.lineTo(hw * 0.78 + m.belly * 1.1, T + 0.4);
      ctx.lineTo(-hw * 0.7, T + 0.4);
      ctx.closePath();
      fillTop(ctx, f);
      ctx.stroke();
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(-sw * 0.45, 1.25 * s);
      ctx.lineTo(-0.5 * s, -0.3);
      ctx.moveTo(sw * 0.58, 1.25 * s);
      ctx.lineTo(0.9 * s, -0.3);
      ctx.stroke();
      if (fine) {
        // poche
        ctx.lineWidth = 0.28;
        ctx.strokeRect(-0.6 * s, 2.3 * s, 1.8 * s, 1.2 * s);
      }
      ctx.lineWidth = f.ol;
      break;
    }
    case 'overalls': {
      // tee-shirt clair dessous
      torsoPath(ctx, sw, hw, T + 0.25, m.belly);
      ctx.fillStyle = f.sleeve;
      ctx.fill();
      ctx.stroke();
      // bavette + bretelles
      ctx.beginPath();
      ctx.moveTo(-sw * 0.55, 1.9 * s);
      ctx.lineTo(sw * 0.6 + m.belly * 0.4, 1.9 * s);
      ctx.lineTo(hw + m.belly * 0.6, T + 0.3);
      ctx.lineTo(-hw, T + 0.3);
      ctx.closePath();
      fillTop(ctx, f);
      ctx.stroke();
      inkedStroke(ctx, [-sw * 0.45, 2.0 * s, -sw * 0.75, -0.1], 0.7 * s, f.top, f.ol * 0.8);
      inkedStroke(ctx, [sw * 0.5, 2.0 * s, sw * 0.7, -0.1], 0.7 * s, f.top, f.ol * 0.8);
      ctx.lineWidth = f.ol;
      dots(ctx, [-sw * 0.45, 2.05 * s, sw * 0.5, 2.05 * s], 0.28 * s + 0.05, MAT.gold);
      if (fine) {
        ctx.lineWidth = 0.28;
        ctx.strokeRect(-0.7 * s, 2.6 * s, 1.9 * s, 1.1 * s);
        ctx.lineWidth = f.ol;
      }
      break;
    }
  }
}

function dots(ctx: Ctx, pts: readonly number[], r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 2) {
    ctx.moveTo(pts[i] + r, pts[i + 1]);
    ctx.arc(pts[i], pts[i + 1], r, 0, TAU);
  }
  ctx.fill();
}

/** Étoile à cinq branches (insigne). */
export function star(ctx: Ctx, cx: number, cy: number, r: number, color: string, stroke: boolean): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  if (stroke) {
    const lw = ctx.lineWidth;
    ctx.lineWidth = 0.22;
    ctx.stroke();
    ctx.lineWidth = lw;
  }
}

/* ----------------------------------------------------------------------------
 * Tête (repère : origine = centre de la tête, x vers l'avant, y vers le bas)
 * ------------------------------------------------------------------------- */

function drawHairBack(ctx: Ctx, f: Figure): void {
  const r = f.sk.m.headR;
  const hat = f.ap.hat;
  ctx.fillStyle = f.hair;
  switch (f.ap.hair) {
    case 'long': {
      ctx.beginPath();
      ctx.moveTo(-0.2 * r, -1.02 * r);
      ctx.bezierCurveTo(-1.35 * r, -0.95 * r, -1.25 * r, 0.6 * r, -1.2 * r, 1.75 * r);
      ctx.quadraticCurveTo(-0.5 * r, 2.0 * r, 0.25 * r, 1.55 * r);
      ctx.lineTo(0.3 * r, 0.2 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'ponytail': {
      if (hat === 'tophat' || hat === 'chef') break;
      ctx.beginPath();
      ctx.moveTo(-0.7 * r, -0.65 * r);
      ctx.bezierCurveTo(-1.9 * r, -0.7 * r, -1.75 * r, 0.6 * r, -1.35 * r, 1.25 * r);
      ctx.bezierCurveTo(-1.25 * r, 0.5 * r, -1.05 * r, 0.0, -0.75 * r, -0.05 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'curly': {
      ctx.beginPath();
      const n = 9;
      const R = 1.2 * r;
      const cy = -0.15 * r;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * 0.62 + (i / n) * Math.PI * 1.55;
        const px = Math.cos(a) * R - 0.1 * r;
        const py = Math.sin(a) * R + cy;
        if (i === 0) ctx.moveTo(px, py);
        ctx.arc(px, py, 0.38 * r, a - 1.4, a + 1.4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'bun': {
      if (hat !== 'none' && hat !== 'beret' && hat !== 'cap') break;
      ctx.beginPath();
      ctx.arc(-0.35 * r, -1.05 * r, 0.45 * r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      break;
    }
  }
}

function drawHead(ctx: Ctx, f: Figure): void {
  const r = f.sk.m.headR;
  const ap = f.ap;
  const fine = f.lod === 0;
  // visage
  ctx.fillStyle = f.skin;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // nez
  if (fine) {
    ctx.beginPath();
    ctx.arc(0.98 * r, 0.12 * r, 0.22 * r, -1.3, 1.6);
    ctx.fill();
    ctx.lineWidth = 0.3;
    ctx.stroke();
    // oreille
    ctx.beginPath();
    ctx.arc(-0.28 * r, 0.12 * r, 0.24 * r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = f.ol;
  }
  drawHairFront(ctx, f);
  if (fine) drawFace(ctx, f);
  else if (ap.face === 'sunglasses' || ap.face === 'mask') {
    ctx.fillStyle = INK;
    ctx.fillRect(-0.2 * r, -0.3 * r, 1.25 * r, 0.42 * r);
  } else if (ap.face === 'beard') {
    ctx.fillStyle = f.hair;
    ctx.beginPath();
    ctx.arc(0.15 * r, 0.2 * r, 0.85 * r, 0.1, Math.PI - 0.4);
    ctx.fill();
  }
  if (f.sk.lie && f.ap.hat !== 'none') {
    // allongé : chapeau un peu réduit pour que son bord ne passe pas sous le sol
    ctx.save();
    ctx.scale(0.8, 0.8);
    drawHat(ctx, f);
    ctx.restore();
  } else drawHat(ctx, f);
}

function drawHairFront(ctx: Ctx, f: Figure): void {
  const r = f.sk.m.headR;
  const hair = f.ap.hair;
  ctx.fillStyle = f.hair;
  if (hair === 'bald') {
    // couronne de cheveux à l'arrière, reflet sur le crâne
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.03, Math.PI * 0.62, Math.PI * 1.12);
    ctx.arc(0, 0, r * 0.62, Math.PI * 1.08, Math.PI * 0.68, true);
    ctx.closePath();
    ctx.fill();
    if (f.lod === 0) {
      ctx.lineWidth = 0.3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, -2.0, -1.4);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = f.ol;
    }
    return;
  }
  if (hair === 'curly') {
    // boucles sur le front
    ctx.beginPath();
    ctx.arc(-0.05 * r, -0.12 * r, r * 1.08, Math.PI * 0.95, Math.PI * 1.88);
    for (let i = 0; i < 3; i++) {
      const a = Math.PI * 1.85 - i * 0.32;
      ctx.arc(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85 + 0.15 * r, 0.32 * r, a + 1.3, a - 1.6, true);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }
  // calotte commune (short, long, bun, ponytail, spiky)
  ctx.beginPath();
  ctx.moveTo(Math.cos(Math.PI * 0.8) * r * 1.04, Math.sin(Math.PI * 0.8) * r * 1.04);
  ctx.arc(0, 0, r * 1.06, Math.PI * 0.8, Math.PI * 1.86);
  ctx.quadraticCurveTo(0.35 * r, -0.62 * r, -0.12 * r, -0.4 * r);
  ctx.quadraticCurveTo(-0.45 * r, 0.05 * r, -0.62 * r, 0.62 * r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (hair === 'spiky' && f.ap.hat === 'none') {
    ctx.beginPath();
    ctx.moveTo(-0.95 * r, -0.4 * r);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * 1.15 + (i / n) * Math.PI * 0.72;
      const a1 = Math.PI * 1.15 + ((i + 0.5) / n) * Math.PI * 0.72;
      ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
      ctx.lineTo(Math.cos(a1) * r * 1.5, Math.sin(a1) * r * 1.5);
    }
    ctx.lineTo(Math.cos(Math.PI * 1.87) * r, Math.sin(Math.PI * 1.87) * r);
    ctx.lineTo(0, -0.5 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (hair === 'long') {
    // mèche devant l'oreille
    ctx.beginPath();
    ctx.moveTo(-0.15 * r, -0.45 * r);
    ctx.quadraticCurveTo(0.15 * r, 0.4 * r, -0.05 * r, 1.25 * r);
    ctx.lineTo(-0.75 * r, 1.0 * r);
    ctx.lineTo(-0.7 * r, -0.2 * r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawFace(ctx: Ctx, f: Figure): void {
  const r = f.sk.m.headR;
  const face = f.ap.face;
  const emote = f.emote;
  // joue
  ctx.fillStyle = 'rgba(232, 120, 110, 0.35)';
  ctx.beginPath();
  ctx.arc(0.5 * r, 0.32 * r, 0.2 * r, 0, TAU);
  ctx.fill();
  // yeux
  const ex1 = 0.28 * r;
  const ex2 = 0.74 * r;
  const ey = -0.06 * r;
  ctx.lineWidth = 0.3;
  if (emote === 'ko') {
    ctx.beginPath();
    for (const ex of [ex1, ex2]) {
      const d = 0.14 * r;
      ctx.moveTo(ex - d, ey - d);
      ctx.lineTo(ex + d, ey + d);
      ctx.moveTo(ex + d, ey - d);
      ctx.lineTo(ex - d, ey + d);
    }
    ctx.stroke();
  } else if (emote === 'sleep') {
    ctx.beginPath();
    ctx.arc(ex1, ey, 0.13 * r, 0.2, Math.PI - 0.2);
    ctx.moveTo(ex2 + 0.13 * r, ey);
    ctx.arc(ex2, ey, 0.13 * r, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else if (face !== 'sunglasses' && face !== 'mask') {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(ex1, ey, 0.105 * r, 0, TAU);
    ctx.arc(ex2, ey, 0.105 * r, 0, TAU);
    ctx.fill();
  }
  if (emote === 'angry') {
    ctx.beginPath();
    ctx.moveTo(ex1 - 0.15 * r, ey - 0.35 * r);
    ctx.lineTo(ex1 + 0.18 * r, ey - 0.22 * r);
    ctx.moveTo(ex2 + 0.18 * r, ey - 0.35 * r);
    ctx.lineTo(ex2 - 0.15 * r, ey - 0.22 * r);
    ctx.stroke();
  }
  // bouche
  if (face !== 'beard') {
    ctx.beginPath();
    if (emote === 'exclaim' || emote === 'question' || emote === 'ko' || emote === 'sweat') {
      ctx.arc(0.62 * r, 0.5 * r, 0.1 * r, 0, TAU);
    } else if (emote === 'angry') {
      ctx.arc(0.62 * r, 0.62 * r, 0.18 * r, Math.PI + 0.5, -0.5);
    } else if (emote === 'sleep') {
      ctx.moveTo(0.5 * r, 0.5 * r);
      ctx.lineTo(0.72 * r, 0.5 * r);
    } else {
      ctx.arc(0.6 * r, 0.32 * r, 0.2 * r, 0.5, Math.PI - 0.5);
    }
    ctx.stroke();
  }
  // détails du visage
  switch (face) {
    case 'glasses': {
      ctx.lineWidth = 0.28;
      ctx.beginPath();
      ctx.arc(ex1, ey, 0.24 * r, 0, TAU);
      ctx.moveTo(ex2 + 0.24 * r, ey);
      ctx.arc(ex2, ey, 0.24 * r, 0, TAU);
      ctx.moveTo(ex1 + 0.24 * r, ey);
      ctx.lineTo(ex2 - 0.24 * r, ey);
      ctx.moveTo(ex1 - 0.24 * r, ey);
      ctx.lineTo(-0.3 * r, ey - 0.05 * r);
      ctx.stroke();
      break;
    }
    case 'sunglasses': {
      ctx.fillStyle = '#1f1d1d';
      ctx.beginPath();
      ctx.ellipse(ex1, ey + 0.02 * r, 0.27 * r, 0.21 * r, 0, 0, TAU);
      ctx.ellipse(ex2 + 0.02 * r, ey + 0.02 * r, 0.27 * r, 0.21 * r, 0, 0, TAU);
      ctx.fill();
      ctx.lineWidth = 0.32;
      ctx.beginPath();
      ctx.moveTo(ex1, ey - 0.12 * r);
      ctx.lineTo(ex2, ey - 0.12 * r);
      ctx.moveTo(ex1 - 0.25 * r, ey);
      ctx.lineTo(-0.3 * r, ey - 0.05 * r);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(ex1 - 0.12 * r, ey - 0.1 * r, 0.1 * r, 0.08 * r);
      ctx.fillRect(ex2 - 0.1 * r, ey - 0.1 * r, 0.1 * r, 0.08 * r);
      break;
    }
    case 'mustache': {
      ctx.fillStyle = f.hairDark;
      ctx.beginPath();
      ctx.moveTo(0.38 * r, 0.33 * r);
      ctx.quadraticCurveTo(0.62 * r, 0.12 * r, 0.98 * r, 0.3 * r);
      ctx.quadraticCurveTo(1.05 * r, 0.48 * r, 0.9 * r, 0.42 * r);
      ctx.quadraticCurveTo(0.65 * r, 0.32 * r, 0.38 * r, 0.33 * r);
      ctx.fill();
      ctx.lineWidth = 0.25;
      ctx.stroke();
      break;
    }
    case 'beard': {
      ctx.fillStyle = f.hair;
      ctx.beginPath();
      ctx.moveTo(-0.25 * r, 0.05 * r);
      ctx.quadraticCurveTo(-0.15 * r, 0.9 * r, 0.45 * r, 1.12 * r);
      ctx.quadraticCurveTo(1.0 * r, 1.05 * r, 1.0 * r, 0.32 * r);
      ctx.quadraticCurveTo(0.65 * r, 0.12 * r, 0.3 * r, 0.32 * r);
      ctx.quadraticCurveTo(0.05 * r, 0.35 * r, -0.25 * r, 0.05 * r);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 0.3;
      ctx.stroke();
      // bouche dans la barbe
      ctx.fillStyle = f.skinDark;
      ctx.beginPath();
      ctx.ellipse(0.62 * r, 0.52 * r, 0.16 * r, 0.07 * r, 0, 0, TAU);
      ctx.fill();
      break;
    }
    case 'mask': {
      ctx.fillStyle = '#1f1d1d';
      ctx.beginPath();
      ctx.moveTo(-0.96 * r, -0.3 * r);
      ctx.quadraticCurveTo(0.2 * r, -0.42 * r, 1.08 * r, -0.36 * r);
      ctx.lineTo(1.06 * r, 0.16 * r);
      ctx.quadraticCurveTo(0.2 * r, 0.24 * r, -0.96 * r, 0.16 * r);
      ctx.closePath();
      ctx.fill();
      // nœud derrière
      ctx.beginPath();
      ctx.moveTo(-0.9 * r, -0.1 * r);
      ctx.lineTo(-1.45 * r, -0.4 * r);
      ctx.lineTo(-1.35 * r, 0.05 * r);
      ctx.closePath();
      ctx.moveTo(-0.9 * r, -0.05 * r);
      ctx.lineTo(-1.35 * r, 0.45 * r);
      ctx.lineTo(-1.1 * r, 0.5 * r);
      ctx.closePath();
      ctx.fill();
      // trous des yeux
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex1, ey, 0.15 * r, 0.11 * r, 0, 0, TAU);
      ctx.ellipse(ex2, ey, 0.15 * r, 0.11 * r, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(ex1 + 0.04 * r, ey, 0.07 * r, 0, TAU);
      ctx.arc(ex2 + 0.04 * r, ey, 0.07 * r, 0, TAU);
      ctx.fill();
      break;
    }
  }
  ctx.lineWidth = f.ol;
}

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

function drawHat(ctx: Ctx, f: Figure): void {
  const r = f.sk.m.headR;
  const fine = f.lod === 0;
  switch (f.ap.hat) {
    case 'none':
      return;
    case 'cap': {
      ctx.fillStyle = HAT_HEX.cap;
      ctx.beginPath();
      ctx.arc(0, -0.12 * r, 1.04 * r, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // visière
      ctx.fillStyle = mix(HAT_HEX.cap, INK, 0.3);
      ctx.beginPath();
      ctx.moveTo(0.55 * r, -0.2 * r);
      ctx.quadraticCurveTo(1.5 * r, -0.32 * r, 1.85 * r, -0.08 * r);
      ctx.lineTo(0.7 * r, 0.02 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (fine) {
        ctx.fillStyle = HAT_HEX.cap;
        ctx.beginPath();
        ctx.arc(0, -1.15 * r, 0.16 * r, 0, TAU);
        ctx.fill();
        ctx.lineWidth = 0.28;
        ctx.stroke();
        ctx.lineWidth = f.ol;
      }
      return;
    }
    case 'beret': {
      ctx.fillStyle = HAT_HEX.beret;
      ctx.beginPath();
      ctx.ellipse(-0.12 * r, -0.78 * r, 1.22 * r, 0.42 * r, -0.12, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(-0.2 * r, -1.18 * r);
      ctx.lineTo(-0.1 * r, -1.42 * r);
      ctx.stroke();
      ctx.lineWidth = f.ol;
      return;
    }
    case 'bowler': {
      ctx.fillStyle = HAT_HEX.bowler;
      ctx.beginPath();
      ctx.arc(0.02 * r, -0.62 * r, 0.86 * r, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0.05 * r, -0.62 * r, 1.28 * r, 0.2 * r, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (fine) {
        ctx.fillStyle = '#5a4e48';
        ctx.fillRect(-0.84 * r, -0.92 * r, 1.72 * r, 0.18 * r);
      }
      return;
    }
    case 'tophat': {
      ctx.fillStyle = HAT_HEX.tophat;
      ctx.beginPath();
      ctx.moveTo(-0.78 * r, -0.62 * r);
      ctx.lineTo(-0.86 * r, -2.75 * r);
      ctx.lineTo(0.9 * r, -2.75 * r);
      ctx.lineTo(0.82 * r, -0.62 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#9b2f3a';
      ctx.fillRect(-0.8 * r, -1.08 * r, 1.64 * r, 0.36 * r);
      ctx.fillStyle = HAT_HEX.tophat;
      ctx.beginPath();
      ctx.ellipse(0.02 * r, -0.62 * r, 1.32 * r, 0.22 * r, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (fine) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(0.3 * r, -2.6 * r, 0.22 * r, 1.4 * r);
      }
      return;
    }
    case 'beanie': {
      ctx.fillStyle = HAT_HEX.beanie;
      ctx.beginPath();
      ctx.arc(0, -0.2 * r, 1.07 * r, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = mix(HAT_HEX.beanie, INK, 0.2);
      ctx.beginPath();
      ctx.rect(-1.1 * r, -0.42 * r, 2.2 * r, 0.42 * r);
      ctx.fill();
      ctx.stroke();
      if (fine) {
        ctx.lineWidth = 0.25;
        ctx.beginPath();
        for (let x = -0.85; x < 1; x += 0.3) {
          ctx.moveTo(x * r, -0.38 * r);
          ctx.lineTo(x * r, -0.05 * r);
        }
        ctx.stroke();
        ctx.lineWidth = f.ol;
      }
      ctx.fillStyle = '#fbf3e6';
      ctx.beginPath();
      ctx.arc(0, -1.33 * r, 0.32 * r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      return;
    }
    case 'fedora': {
      ctx.fillStyle = HAT_HEX.fedora;
      ctx.beginPath();
      ctx.ellipse(0.08 * r, -0.55 * r, 1.55 * r, 0.26 * r, -0.04, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.85 * r, -0.6 * r);
      ctx.lineTo(-0.72 * r, -1.5 * r);
      ctx.quadraticCurveTo(0.05 * r, -1.25 * r, 0.75 * r, -1.55 * r);
      ctx.lineTo(0.88 * r, -0.6 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2f2622';
      ctx.fillRect(-0.84 * r, -0.92 * r, 1.7 * r, 0.3 * r);
      return;
    }
    case 'helmet': {
      ctx.fillStyle = HAT_HEX.helmet;
      ctx.beginPath();
      ctx.arc(0, -0.32 * r, 1.08 * r, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-1.25 * r, -0.4 * r);
      ctx.lineTo(1.55 * r, -0.4 * r);
      ctx.lineTo(1.5 * r, -0.18 * r);
      ctx.lineTo(-1.2 * r, -0.18 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, -1.38 * r);
      ctx.lineTo(0, -0.42 * r);
      ctx.stroke();
      ctx.lineWidth = f.ol;
      return;
    }
    case 'chef': {
      ctx.fillStyle = HAT_HEX.chef;
      ctx.beginPath();
      ctx.arc(-0.5 * r, -1.55 * r, 0.62 * r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0.55 * r, -1.55 * r, 0.62 * r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0.02 * r, -1.85 * r, 0.7 * r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(-0.92 * r, -1.25 * r, 1.86 * r, 0.7 * r);
      ctx.fill();
      ctx.stroke();
      return;
    }
    case 'police': {
      ctx.fillStyle = HAT_HEX.police;
      ctx.beginPath();
      ctx.moveTo(-0.95 * r, -0.45 * r);
      ctx.lineTo(-1.0 * r, -1.35 * r);
      ctx.lineTo(1.08 * r, -1.35 * r);
      ctx.lineTo(1.0 * r, -0.45 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1c1a1a';
      ctx.beginPath();
      ctx.moveTo(0.35 * r, -0.5 * r);
      ctx.quadraticCurveTo(1.3 * r, -0.55 * r, 1.65 * r, -0.28 * r);
      ctx.lineTo(0.5 * r, -0.3 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1c1a1a';
      ctx.fillRect(-0.95 * r, -0.72 * r, 1.97 * r, 0.24 * r);
      ctx.fillStyle = MAT.gold;
      ctx.beginPath();
      ctx.arc(0.45 * r, -1.0 * r, 0.22 * r, 0, TAU);
      ctx.fill();
      return;
    }
    case 'straw': {
      ctx.fillStyle = HAT_HEX.straw;
      ctx.beginPath();
      ctx.ellipse(0.05 * r, -0.55 * r, 1.78 * r, 0.32 * r, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.8 * r, -0.6 * r);
      ctx.lineTo(-0.75 * r, -1.2 * r);
      ctx.quadraticCurveTo(0, -1.32 * r, 0.8 * r, -1.2 * r);
      ctx.lineTo(0.85 * r, -0.6 * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLOR_HEX.red;
      ctx.fillRect(-0.79 * r, -0.86 * r, 1.63 * r, 0.24 * r);
      if (fine) {
        ctx.strokeStyle = MAT.strawDark;
        ctx.lineWidth = 0.22;
        ctx.beginPath();
        ctx.ellipse(0.05 * r, -0.55 * r, 1.4 * r, 0.22 * r, 0, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.lineWidth = f.ol;
      }
      return;
    }
  }
}

/* ----------------------------------------------------------------------------
 * Personne à la fenêtre (buste encadré)
 * ------------------------------------------------------------------------- */

const WIN_K = 0.8;
const WIN_SHIFT = 5.4;

function windowHeadTop(f: Figure): Pt {
  const sk = f.sk;
  return { x: sk.headTop.x * WIN_K, y: Math.max(-12.4, sk.headTop.y * WIN_K + WIN_SHIFT) };
}

const CURTAINS = ['#c9473f', '#3f9e55', '#f0cb3f', '#8d55ad', '#4b92dc', '#f19bb8'];

function drawWindowBust(ctx: Ctx, f: Figure): void {
  const sk = f.sk;
  const fine = f.lod === 0;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = f.ol;
  // cadre
  ctx.fillStyle = MAT.windowFrame;
  ctx.beginPath();
  ctx.rect(-7, -13, 14, 11);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = MAT.interior;
  ctx.fillRect(-6, -12.1, 12, 9.4);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-6, -12.1, 12, 9.4);
  ctx.clip();
  if (fine) {
    // lumière intérieure douce
    ctx.fillStyle = 'rgba(255, 220, 150, 0.12)';
    ctx.fillRect(-6, -12.1, 12, 9.4);
  }
  ctx.translate(0, WIN_SHIFT);
  ctx.scale(WIN_K, WIN_K);
  if (f.ap.top === 'hoodie') withTorso(ctx, sk, () => drawHood(ctx, f));
  withHead(ctx, sk, () => drawHairBack(ctx, f));
  withTorso(ctx, sk, () => drawTorso(ctx, f));
  drawAccessoryFront(ctx, f);
  withHead(ctx, sk, () => drawHead(ctx, f));
  ctx.restore();
  // rideaux
  ctx.fillStyle = CURTAINS[f.seed % CURTAINS.length];
  ctx.beginPath();
  ctx.moveTo(-6, -12.1);
  ctx.lineTo(-3.2, -12.1);
  ctx.quadraticCurveTo(-4.6, -8.5, -6, -6.2);
  ctx.closePath();
  ctx.moveTo(6, -12.1);
  ctx.lineTo(3.2, -12.1);
  ctx.quadraticCurveTo(4.6, -8.5, 6, -6.2);
  ctx.closePath();
  ctx.fill();
  if (fine) {
    ctx.lineWidth = 0.35;
    ctx.stroke();
    ctx.lineWidth = f.ol;
  }
  // appui de fenêtre
  ctx.fillStyle = MAT.stone;
  ctx.beginPath();
  ctx.rect(-7.8, -2.9, 15.6, 2.4);
  ctx.fill();
  ctx.stroke();
  // avant-bras posés sur l'appui
  const k = WIN_K;
  inkedStroke(ctx, [-4.6, -3.7, -1.6, -3.5], f.sk.m.armW * k, f.sleeve, f.ol);
  inkedStroke(ctx, [4.4, -3.7, 1.6, -3.5], f.sk.m.armW * k, f.sleeve, f.ol);
  const hand: Pt = { x: 1.3, y: -3.5 };
  if (f.holding !== 'none') drawHeld(ctx, f, hand);
  ctx.fillStyle = f.skin;
  ctx.beginPath();
  ctx.arc(-1.3, -3.5, 0.75, 0, TAU);
  ctx.arc(1.3, -3.5, 0.75, 0, TAU);
  ctx.fill();
  ctx.lineWidth = f.ol * 0.85;
  ctx.beginPath();
  ctx.arc(-1.3, -3.5, 0.75, 0, TAU);
  ctx.moveTo(2.05, -3.5);
  ctx.arc(1.3, -3.5, 0.75, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = f.ol;
}

/* ----------------------------------------------------------------------------
 * Pilote de deux-roues, conducteur, portrait
 * ------------------------------------------------------------------------- */

/**
 * Dessine un pilote dans le repère du véhicule (face à droite). part = 'back' : jambes (sous le
 * cadre) ; 'front' : buste, tête et bras (par-dessus le cadre).
 */
export function drawRider(ctx: Ctx, ap: PersonAppearance, key: string, spec: RideSpec, lod: Lod, part: 'back' | 'front'): void {
  const sk = riderSkeleton(ap.build, key, spec);
  const f = makeFigure(ap, sk, lod, 'sit', 'none', 'none', 0);
  ctx.strokeStyle = INK;
  ctx.lineWidth = f.ol;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (part === 'back') {
    drawLegs(ctx, f);
    drawLowerGarment(ctx, f);
    return;
  }
  if (ap.top === 'hoodie') withTorso(ctx, sk, () => drawHood(ctx, f));
  withHead(ctx, sk, () => drawHairBack(ctx, f));
  drawArm(ctx, f, 0);
  withTorso(ctx, sk, () => drawTorso(ctx, f));
  drawAccessoryFront(ctx, f);
  withHead(ctx, sk, () => drawHead(ctx, f));
  drawArm(ctx, f, 1);
  drawHand(ctx, f, sk.hd[1], 1);
}

/** Tête seule (conducteur derrière une vitre, passagers du bus), centrée en (0, 0). */
export function drawHeadOnly(ctx: Ctx, ap: PersonAppearance, lod: Lod, scale: number): void {
  const sk = skeletonFor('regular', 'stand');
  const f = makeFigure(ap, sk, lod, 'stand', 'none', 'none', 0);
  f.ol = lod === 0 ? 0.45 / scale : 0.7 / scale;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = INK;
  ctx.lineWidth = f.ol;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // épaules
  ctx.translate(-sk.head.x, -sk.head.y);
  withTorso(ctx, sk, () => drawTorso(ctx, f));
  withHead(ctx, sk, () => {
    drawHairBack(ctx, f);
    drawHead(ctx, f);
  });
  ctx.restore();
}

/**
 * Portrait (carnet) : buste du personnage centré en (cx, cy), dans un carré de côté `size`.
 * Le dessin est rogné au carré. Toujours au niveau de détail 0.
 */
export function drawPortrait(ctx: Ctx, appearance: PersonAppearance, cx: number, cy: number, size: number): void {
  const sk = skeletonFor(appearance.build === 'child' ? 'child' : appearance.build, 'stand');
  const f = makeFigure(appearance, sk, 0, 'stand', 'none', 'none', 0);
  const r = sk.m.headR;
  // Cadre : du haut du chapeau jusqu'à mi-buste.
  const top = sk.head.y - r - hatHeight(appearance.hat, r) - 0.8;
  const bottom = sk.N.y + sk.m.torso * 0.9;
  const k = size / Math.max(bottom - top, 2 * sk.m.sw + 6);
  const midY = (top + bottom) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - size / 2, cy - size / 2, size, size);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.translate(-sk.head.x * 0.6, -midY);
  f.ol = 0.45;
  ctx.strokeStyle = INK;
  ctx.lineWidth = f.ol;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (appearance.top === 'hoodie') withTorso(ctx, sk, () => drawHood(ctx, f));
  withHead(ctx, sk, () => drawHairBack(ctx, f));
  drawArm(ctx, f, 0);
  withTorso(ctx, sk, () => drawTorso(ctx, f));
  drawAccessoryFront(ctx, f);
  withHead(ctx, sk, () => drawHead(ctx, f));
  drawArm(ctx, f, 1);
  drawHand(ctx, f, sk.hd[1], 1);
  ctx.restore();
}

