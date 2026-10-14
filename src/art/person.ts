// Personnages : silhouettes de 20 u (13 u pour un enfant), vue de trois quarts, face à droite
// (le miroir est appliqué pour facing = 'left').
//
// Technique (rapide) :
//   • Toutes les formes ne dépendent que de (corpulence, pose, attribut) : elles sont construites
//     UNE fois dans des Path2D en coordonnées locales (repère des pieds) et mises en cache.
//     Dessiner une personne = une quinzaine de fill(path) (et 1 à 3 stroke pour les traits fins),
//     sans aucune construction de chemin ni changement de repère (coûteux dans Chromium).
//     Les membres sont des polylignes épaisses REMPLIES (disques + segments), pas des traits :
//     un stroke() de Path2D est nettement plus cher qu'un fill() dans Chromium.
//   • SOUS-COUCHE D'ENCRE : toute la silhouette (membres, buste, tête, cheveux, chapeau…) est
//     peinte à l'encre, agrandie de l'épaisseur du contour, en un ou deux remplissages ;
//   • APLATS : toutes les formes d'une même couleur en un seul remplissage, dans l'ordre de
//     profondeur. L'encre ne reste visible qu'autour de la silhouette ;
//   • CONTOURS INTÉRIEURS en un seul trait fin (bord du haut, lisière des cheveux, visage) et un
//     contour propre pour le bras avant et le chapeau. Les membres « arrière » sont légèrement
//     ombrés (ils se détachent sans trait).
//
// Ordre de dessin : ombre → accessoires de dos → encre → bras arrière → jambes → bas de vêtement →
// cheveux arrière → buste → peau (cou, tête) → encre fine (chaussures, yeux) → cheveux → contours
// → chapeau → bras avant et objet tenu → bulle d'émotion (hors miroir).

import type { Emote, FaceDetail, HeldItem, PersonAppearance, PersonEntity, Pose, SkinTone, TopKind } from '../types';
import type { Lod } from './lod';
import {
  COLOR_DARK,
  COLOR_HEX,
  COLOR_LIGHT,
  COLORS,
  HAIR_DARK,
  HAIR_HEX,
  HAT_HEX,
  INK,
  MAT,
  PATTERN_INK,
  SHADOW,
  SKIN_DARK,
  SKIN_HEX,
  mix,
} from './palette';
import { checksTex, dotsTex, getPattern, resBucket, setPatternFillMatrix, stripesTex } from './patterns';
import { METRICS, type Pt, type RideSpec, type Skel, riderSkeleton, skeletonFor } from './skeleton';
import { TAU, type Ctx, deviceScale, inkedStroke, seedOf } from './util';
import { drawAccessoryBack, drawAccessoryBehind, drawAccessoryFront, drawBigHeld, drawHeld, isBigHeld } from './held';
import { drawEmote } from './emote';
import * as S from './personShapes';

export { hatHeight } from './personShapes';

/* ----------------------------------------------------------------------------
 * Couleurs
 * ------------------------------------------------------------------------- */

const SHADE_K = 0.17;
/** Teinte « membre arrière » (légèrement ombrée). */
const COLOR_SHADE = Object.fromEntries(COLORS.map((c) => [c, mix(COLOR_HEX[c], INK, SHADE_K)])) as Record<string, string>;
const SKIN_SHADE = Object.fromEntries(Object.entries(SKIN_HEX).map(([k, v]) => [k, mix(v, INK, 0.14)])) as Record<SkinTone, string>;
const SHIRT_WHITE = '#fbf8f1';
const SHIRT_BLUE = '#c9d6e0';
const UNDERSHIRT = '#f3ead6';
const SHADES: Record<string, string> = {
  [SHIRT_WHITE]: mix(SHIRT_WHITE, INK, SHADE_K),
  [SHIRT_BLUE]: mix(SHIRT_BLUE, INK, SHADE_K),
  [UNDERSHIRT]: mix(UNDERSHIRT, INK, SHADE_K),
};
const CHEEK = 'rgba(232, 120, 110, 0.35)';
const GOLD = MAT.gold;
const HAT_DETAIL = {
  cap: mix(HAT_HEX.cap, INK, 0.3),
  beanie: mix(HAT_HEX.beanie, INK, 0.22),
  beret: mix(HAT_HEX.beret, INK, 0.3),
};

/** Seuils d'échelle (px physiques par unité monde) pour les plus petits détails du niveau 0. */
const MICRO_SCALE = 1.6;
const CHEEK_SCALE = 3;

/** Tout ce qu'il faut pour dessiner une silhouette (couleurs résolues + squelette). */
export interface Figure {
  ap: PersonAppearance;
  sk: Skel;
  /** Identifiant court du squelette (clés du cache de chemins). */
  k: string;
  lod: Lod;
  /** Épaisseur du contour. */
  ol: number;
  /** Yeux, boutons, traits du visage (niveau 0 et au moins MICRO_SCALE px par unité). */
  micro: boolean;
  /** Joues roses (gros plan). */
  cheeks: boolean;
  /** Statue : pas d'yeux ni de chaussures noires, pas d'ombre. */
  statue: boolean;
  top: string;
  topDark: string;
  topLight: string;
  topShade: string;
  sleeve: string;
  sleeveShade: string;
  sleeveShort: boolean;
  bottom: string;
  bottomDark: string;
  bottomShade: string;
  skin: string;
  skinDark: string;
  skinShade: string;
  hair: string;
  hairDark: string;
  holding: HeldItem;
  emote: Emote;
  pose: Pose;
  /** Graine (couleur des rideaux de la pose window). */
  seed: number;
}

export function makeFigure(
  ap: PersonAppearance,
  sk: Skel,
  lod: Lod,
  pose: Pose,
  holding: HeldItem,
  emote: Emote,
  seed: number,
  scale = 4,
): Figure {
  const top = COLOR_HEX[ap.topColor];
  let sleeve = top;
  let sleeveShade = COLOR_SHADE[ap.topColor];
  let sleeveShort = ap.top === 'tshirt' || ap.top === 'dress';
  if (ap.top === 'apron') {
    sleeve = ap.topColor === 'white' ? SHIRT_BLUE : SHIRT_WHITE;
    sleeveShade = SHADES[sleeve];
  } else if (ap.top === 'overalls') {
    sleeve = UNDERSHIRT;
    sleeveShade = SHADES[sleeve];
    sleeveShort = true;
  }
  return {
    ap,
    sk,
    k: skId(sk),
    lod,
    ol: lod === 0 ? 0.45 : 0.8,
    micro: lod === 0 && scale >= MICRO_SCALE,
    cheeks: lod === 0 && scale >= CHEEK_SCALE,
    statue: false,
    top,
    topDark: COLOR_DARK[ap.topColor],
    topLight: COLOR_LIGHT[ap.topColor],
    topShade: COLOR_SHADE[ap.topColor],
    sleeve,
    sleeveShade,
    sleeveShort,
    bottom: COLOR_HEX[ap.bottomColor],
    bottomDark: COLOR_DARK[ap.bottomColor],
    bottomShade: COLOR_SHADE[ap.bottomColor],
    skin: SKIN_HEX[ap.skin],
    skinDark: SKIN_DARK[ap.skin],
    skinShade: SKIN_SHADE[ap.skin],
    hair: HAIR_HEX[ap.hairColor],
    hairDark: HAIR_DARK[ap.hairColor],
    holding,
    emote,
    pose,
    seed,
  };
}

/* ----------------------------------------------------------------------------
 * Cache de chemins (Path2D en coordonnées locales, par squelette et attribut)
 * ------------------------------------------------------------------------- */

const PATHS = new Map<string, Path2D | null>();
const SK_IDS = new WeakMap<Skel, string>();
let skSeq = 0;

function skId(sk: Skel): string {
  let id = SK_IDS.get(sk);
  if (id === undefined) {
    id = (skSeq++).toString(36);
    SK_IDS.set(sk, id);
  }
  return id;
}

/** Chemin mis en cache ; `build` renvoie false si le chemin est vide (→ null). */
function cached(key: string, build: (p: Path2D) => boolean | void): Path2D | null {
  let p = PATHS.get(key);
  if (p === undefined) {
    const q = new Path2D();
    p = build(q) === false ? null : q;
    PATHS.set(key, p);
  }
  return p;
}

interface FrameM {
  torso: DOMMatrix2DInit;
  head: DOMMatrix2DInit;
}
const FRAMES = new WeakMap<Skel, FrameM>();

/** Repères du buste et de la tête (rotations pures) d'un squelette. */
function frameOf(sk: Skel): FrameM {
  let fr = FRAMES.get(sk);
  if (!fr) {
    const h = sk.head;
    let head: DOMMatrix2DInit;
    // allongé : visage vers le haut, sommet du crâne vers -x
    if (sk.lie) head = { a: 0, b: -1, c: 1, d: 0, e: h.x, f: h.y };
    else {
      const c = Math.cos(sk.headRot);
      const s = Math.sin(sk.headRot);
      head = { a: c, b: s, c: -s, d: c, e: h.x, f: h.y };
    }
    fr = { torso: { a: sk.ax.x, b: sk.ax.y, c: sk.ay.x, d: sk.ay.y, e: sk.N.x, f: sk.N.y }, head };
    FRAMES.set(sk, fr);
  }
  return fr;
}

/** Ajoute à p une forme construite dans le repère m. */
function inFrame(p: Path2D, m: DOMMatrix2DInit, fn: (q: Path2D) => void): void {
  const q = new Path2D();
  fn(q);
  p.addPath(q, m);
}

/** Remet la plume d'encre standard (les accessoires et objets tenus s'en servent pour leurs contours). */
function pen(ctx: Ctx, f: Figure): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = f.ol;
}

function fillP(ctx: Ctx, p: Path2D | null, color: string | CanvasPattern): void {
  if (!p) return;
  ctx.fillStyle = color;
  ctx.fill(p);
}

/** Contourne p d'un trait d'encre épais (sous-couche). */
function inkUnder(ctx: Ctx, f: Figure, p: Path2D | null): void {
  if (!p) return;
  ctx.fillStyle = f.statue ? f.topDark : INK;
  ctx.fill(p);
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
  const f = makeFigure(ap, sk, lod, e.pose, e.holding ?? 'none', e.emote ?? 'none', seedOf(e.id), deviceScale(ctx));
  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) ctx.scale(-1, 1);
  if (e.pose === 'window') drawWindowBust(ctx, f);
  else if (lod === 1) drawFigureLod1(ctx, f);
  else drawFigure(ctx, f);
  ctx.restore();
  if (f.emote !== 'none') {
    const top = e.pose === 'window' ? windowHeadTop(f) : sk.headTop;
    const hatH = S.hatHeight(ap.hat, sk.m.headR) * (e.pose === 'window' ? WIN_K : 1);
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
    ctx.fillRect(x + 1 + 2 * m.s, y - 3.5, 6 * m.s, 3.5);
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

/* ----------------------------------------------------------------------------
 * Silhouette complète
 * ------------------------------------------------------------------------- */

/** Dessine une silhouette complète dans le repère courant (ancre aux pieds, face à droite). */
export function drawFigure(ctx: Ctx, f: Figure): void {
  const sk = f.sk;
  const lod0 = f.lod === 0;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = f.ol;

  if (sk.shadow[1] > 0 && !f.statue) fillP(ctx, shadowPath(f), SHADOW);
  if (f.ap.accessory !== 'none') drawAccessoryBehind(ctx, f);

  // 1. Sous-couche d'encre : membres (traits épais) puis silhouette du corps.
  // Au niveau 1, les bras sont peints avec le buste (même couleur, pas de contour intérieur).
  const armsInTorso = !lod0;
  const arms = armsInTorso ? 'a' : sk.farArmOver ? 'n' : 'b';
  inkLimbs(ctx, f, arms);
  inkUnder(ctx, f, underlayPath(f));

  // 2. Bras arrière (derrière le buste)
  const holdsBack = f.ap.accessory !== 'none';
  // accessoire de la main arrière masqué par le corps (marche, course, assis) : dessiné devant
  const accFront = lod0 && backAccessoryHidden(f);
  if (lod0 && !sk.farArmOver) {
    // main arrière : peinte avec le visage (même passe) sauf si elle tient un accessoire
    armFill(ctx, f, 0, true, holdsBack);
    if (holdsBack && !accFront) {
      pen(ctx, f);
      drawAccessoryBack(ctx, f);
    }
  }

  // 3. Jambes, bas de vêtement
  legsFill(ctx, f);
  garmentFill(ctx, f);

  // 4. Haut du corps (cheveux arrière, buste, tête, chapeau)
  upperBody(ctx, f, {
    backHand: lod0 ? !sk.farArmOver && !holdsBack : true,
    // (bras « arrière » passant devant le buste : main peinte avec le bras, plus tard)
    frontHand: armsInTorso,
    shoes: true,
    armsInTorso,
    cameraLater: lod0,
  });
  if (armsInTorso && holdsBack) {
    pen(ctx, f);
    drawAccessoryBack(ctx, f);
  }

  // 5. Bras « arrière » passant devant le buste, grand objet tenu à deux mains, bras avant
  const big = isBigHeld(f);
  if (lod0) {
    if (sk.farArmOver) {
      inkLimbs(ctx, f, big ? 'b0' : 'b01');
      armFill(ctx, f, 0, true, true);
      if (holdsBack) {
      pen(ctx, f);
      drawAccessoryBack(ctx, f);
    }
      if (big) {
        pen(ctx, f);
        drawBigHeld(ctx, f);
        inkLimbs(ctx, f, 'b1');
      }
    } else inkLimbs(ctx, f, 'b1');
    frontArm(ctx, f);
    // accessoire de la main arrière masqué par le corps : par-dessus tout (course : bras croisés)
    if (accFront) {
      pen(ctx, f);
      drawAccessoryBack(ctx, f);
    }
    if (f.ap.accessory === 'camera') {
      pen(ctx, f);
      drawAccessoryFront(ctx, f);
    }
  } else {
    pen(ctx, f);
    if (big) drawBigHeld(ctx, f);
    else if (f.holding !== 'none' || f.pose === 'phone') drawHeld(ctx, f, sk.hd[1]);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = f.ol;
}

/** Accessoires tenus par la main arrière (dessinés par drawAccessoryBack). */
const BACK_HAND_ACC = new Set<string>(['handbag', 'briefcase', 'cane', 'flowers', 'newspaper']);

/**
 * L'accessoire tenu par la main arrière serait-il caché par le corps ? C'est le cas quand la main
 * n'est pas nettement en arrière de l'épaule (marche, course, assis…) : sans correction, le bouquet
 * de fleurs ou la mallette d'un passant qui marche seraient invisibles. Il est alors dessiné devant
 * le corps (même position, donc même emprise).
 */
function backAccessoryHidden(f: Figure): boolean {
  const sk = f.sk;
  if (!BACK_HAND_ACC.has(f.ap.accessory) || sk.lie || sk.farArmOver) return false;
  return sk.hd[0].x > sk.sh[0].x - 0.3 * sk.m.s;
}

function shadowPath(f: Figure): Path2D | null {
  const sh = f.sk.shadow;
  return cached(`sd${f.k}`, (p) => S.ell(p, sh[0], 0.2, sh[1], sh[2]));
}

/** Membre « basse définition » (niveau 1) : deux segments épais sans articulations rondes. */
function limbLow(p: Path2D, a: Pt, b: Pt, c: Pt, r: number): void {
  S.seg(p, a.x, a.y, b.x, b.y, r);
  S.seg(p, b.x, b.y, c.x, c.y, r);
}

/**
 * Silhouette simplifiée (niveau 1, personnages de 6 à 20 px) : une seule sous-couche d'encre
 * (corps et membres), puis jambes, bas de vêtement, buste et bras, peau, cheveux, chapeau.
 */
function drawFigureLod1(ctx: Ctx, f: Figure): void {
  const ap = f.ap;
  const sk = f.sk;
  const k = f.k;
  const fr = frameOf(sk);
  const r = sk.m.headR;
  const ar = sk.m.armW / 2;
  const lr = legR(f);
  const g = f.ol;
  if (sk.shadow[1] > 0) fillP(ctx, shadowPath(f), SHADOW);
  if (ap.accessory !== 'none') {
    pen(ctx, f);
    drawAccessoryBehind(ctx, f);
  }
  // encre : corps (formes agrandies) + membres (gélules agrandies)
  fillP(ctx, cached(`U1${k}|${ap.top}|${ap.bottom}|${ap.hair}|${ap.hat}|${ap.face}`, (p) => {
    const body = underlayPath(f);
    if (body) p.addPath(body);
    for (let i = 0; i < 2; i++) {
      limbLow(p, sk.hip[i], sk.kn[i], sk.ft[i], lr + g);
      limbLow(p, sk.sh[i], sk.el[i], sk.hd[i], ar + g);
      S.circ(p, sk.hd[i].x, sk.hd[i].y, handR(f) + g);
    }
  }), INK);
  // jambes (+ bassin du pantalon), short
  const trousers = ap.bottom === 'trousers';
  const covered = legsCovered(ap.top);
  fillP(ctx, cached(`L1${k}|${lr}|${trousers && !covered ? 'p' : ''}`, (p) => {
    for (let i = 0; i < 2; i++) limbLow(p, sk.hip[i], sk.kn[i], sk.ft[i], lr);
    if (trousers && !covered) S.poly(p, sk.pelvis);
  }), trousers ? f.bottom : f.skin);
  if (ap.bottom === 'shorts' && !covered)
    fillP(ctx, cached(`S1${k}`, (p) => {
      S.poly(p, sk.pelvis);
      for (let i = 0; i < 2; i++) S.capsule(p, sk.hip[i], S.along(sk.hip[i], sk.kn[i], 0.85), (sk.m.legW + 0.45) / 2);
    }), f.bottom);
  garmentFill(ctx, f);
  // buste et bras (une seule couleur si les manches sont de la couleur du haut)
  const overlay = ap.top === 'apron' || ap.top === 'overalls';
  const armsP = cached(`A1${k}`, (p) => {
    for (let i = 0; i < 2; i++) limbLow(p, sk.sh[i], sk.el[i], sk.hd[i], ar);
  });
  if (f.sleeve === f.top && !overlay)
    fillP(ctx, cached(`T1${k}|${ap.top}`, (p) => {
      const t = torsoPath(f);
      if (t) p.addPath(t);
      if (armsP) p.addPath(armsP);
    }), f.top);
  else {
    fillP(ctx, torsoPath(f), overlay ? f.sleeve : f.top);
    fillP(ctx, armsP, f.sleeve);
    if (overlay) fillP(ctx, cached(`o${k}|${ap.top}`, (p) => inFrame(p, fr.torso, (q) => S.topOverlayShape(q, sk.m, ap.top))), f.top);
  }
  // peau : cou, tête, mains
  fillP(ctx, cached(`k${k}|${ap.top === 'dress' ? 'd' : ''}bf`, (p) => {
    inFrame(p, fr.torso, (q) => {
      S.neckShape(q, sk.m);
      if (ap.top === 'dress') S.ell(q, 0.25, -0.15, 1.25 * sk.m.s, 0.85 * sk.m.s);
    });
    inFrame(p, fr.head, (q) => S.headShape(q, r));
    handsShape(p, f, true, true);
  }), f.skin);
  if (ap.face === 'sunglasses' || ap.face === 'mask')
    fillP(ctx, cached(`i1${k}|${ap.face}`, (p) => inFrame(p, fr.head, (q) => (ap.face === 'mask' ? S.maskShape(q, r) : S.sunglassesShape(q, r)))), INK);
  // cheveux (arrière et devant d'un seul aplat, barbe), chapeau sans détails
  const beard = ap.face === 'beard';
  fillP(ctx, cached(`H1${k}|${ap.hair}|${ap.hat}|${beard ? 'b' : ''}`, (p) => inFrame(p, fr.head, (q) => {
    S.hairBackShape(q, ap.hair, ap.hat, hatR(sk));
    S.hairFrontShape(q, ap.hair, ap.hat, r);
    if (beard) S.beardShape(q, r);
  })), f.hair);
  if (ap.hat !== 'none') drawHat(ctx, f, false);
  // accessoires et objets tenus (simplifiés par leur propre niveau de détail)
  pen(ctx, f);
  if (ap.accessory !== 'none') drawAccessoryBack(ctx, f);
  if (ap.accessory === 'camera' || ap.accessory === 'scarf' || ap.accessory === 'backpack') drawAccessoryFront(ctx, f);
  if (isBigHeld(f)) drawBigHeld(ctx, f);
  else if (f.holding !== 'none' || f.pose === 'phone') drawHeld(ctx, f, sk.hd[1]);
}

/** Bras avant (niveau 0) : manche, objet tenu, main, index tendu, gestes. */
function frontArm(ctx: Ctx, f: Figure): void {
  const sk = f.sk;
  const big = isBigHeld(f);
  const holds = !big && (f.holding !== 'none' || f.pose === 'phone');
  armFill(ctx, f, 1, false, !holds);
  if (holds) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = f.ol;
    drawHeld(ctx, f, sk.hd[1]);
    const hand = handPath(f, 1);
    fillP(ctx, hand, f.skin);
    ctx.lineWidth = f.ol * 0.8;
    ctx.strokeStyle = INK;
    if (hand) ctx.stroke(hand);
  }
  if (f.pose === 'point') {
    // index tendu
    const h = sk.hd[1];
    inkedStroke(ctx, [h.x, h.y, h.x + 1.5 * sk.m.s, h.y - 0.1], 0.55 * sk.m.s, f.skin, f.ol * 0.8);
  }
  if (f.pose === 'wave' && f.micro) {
    // petits traits de mouvement
    const p = cached(`wv${f.k}`, (q) => {
      const h = sk.hd[1];
      const r = handR(f) * 2.4;
      q.moveTo(h.x + Math.cos(-2.4) * r, h.y + Math.sin(-2.4) * r);
      q.arc(h.x, h.y, r, -2.4, -1.8);
      q.moveTo(h.x + Math.cos(-1.3) * r, h.y + Math.sin(-1.3) * r);
      q.arc(h.x, h.y, r, -1.3, -0.7);
    });
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = INK;
    if (p) ctx.stroke(p);
  }
}

/* ----------------------------------------------------------------------------
 * Bras, mains, jambes : polylignes épaisses à bouts et articulations ronds.
 *
 * Elles sont REMPLIES (union de disques et de segments épais, mise en cache) et non tracées au
 * trait : dans Chromium, un stroke() de Path2D coûte plusieurs fois un fill() côté JS (mesuré :
 * 40 % du temps de dessin d'une personne avant ce changement). Le résultat est identique à un
 * trait de largeur 2r avec lineCap = lineJoin = 'round'.
 * ------------------------------------------------------------------------- */

type Pts = readonly Pt[];

/** Rayon de la main (un peu plus large que le bras). */
function handR(f: Figure): number {
  return f.sk.m.armW / 2 + 0.12 * f.sk.m.s;
}

function legR(f: Figure): number {
  return (f.ap.bottom === 'trousers' ? f.sk.m.legW : f.sk.m.legW * 0.8) / 2;
}

function legsCovered(top: TopKind): boolean {
  return top === 'dress' || top === 'coat';
}

/** Bras et jambes ont-ils (presque) la même largeur d'encre ? (un seul rayon pour les deux) */
function limbsShareInk(f: Figure): boolean {
  return Math.abs(legR(f) - handR(f)) <= 0.12;
}

/** Ajoute à p le contour plein de la polyligne pts épaissie de r (disques + segments, même sens). */
function thick(p: Path2D, pts: Pts, r: number): void {
  for (let i = 0; i < pts.length; i++) {
    S.circ(p, pts[i].x, pts[i].y, r);
    if (i > 0) S.seg(p, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, r);
  }
}

/** Chemin plein (mis en cache sous `key`) de plusieurs polylignes épaisses, chacune avec son rayon. */
function thickPath(key: string, parts: [Pts, number][]): Path2D | null {
  let k = key;
  for (const [, r] of parts) k += `|${r.toFixed(3)}`;
  return cached(k, (p) => {
    if (parts.length === 0) return false;
    for (const [pts, r] of parts) thick(p, pts, r);
  });
}

function armPts(f: Figure, i: 0 | 1): Pts {
  return [f.sk.sh[i], f.sk.el[i], f.sk.hd[i]];
}

/** Manche courte : de l'épaule aux 2/3 du bras. */
function sleevePts(f: Figure, i: 0 | 1): Pts {
  return [f.sk.sh[i], S.along(f.sk.sh[i], f.sk.el[i], 0.62)];
}

/** Jambe i ; hips = la jambe avant part de la hanche arrière (bassin du pantalon). */
function legPts(f: Figure, i: 0 | 1, hips: boolean): Pts {
  const sk = f.sk;
  return i === 1 && hips ? [sk.hip[0], sk.hip[1], sk.kn[1], sk.ft[1]] : [sk.hip[i], sk.kn[i], sk.ft[i]];
}

/** Short : cuisse arrière → hanches → cuisse avant. */
function shortsPts(f: Figure): Pts {
  const sk = f.sk;
  return [S.along(sk.hip[0], sk.kn[0], 0.9), sk.hip[0], sk.hip[1], S.along(sk.hip[1], sk.kn[1], 0.9)];
}

function handPath(f: Figure, i: 0 | 1): Path2D | null {
  return cached(`hd${f.k}|${i}`, (p) => S.circ(p, f.sk.hd[i].x, f.sk.hd[i].y, handR(f)));
}

/** Les deux mains (peintes avec la peau du visage). */
function handsShape(p: Path2D, f: Figure, back: boolean, front: boolean): void {
  const r = handR(f);
  if (back) S.circ(p, f.sk.hd[0].x, f.sk.hd[0].y, r);
  if (front) S.circ(p, f.sk.hd[1].x, f.sk.hd[1].y, r);
}

/**
 * Encre des membres (sous-couche) : arms = 'a' (jambes + deux bras), 'b' (jambes + bras arrière),
 * 'n' (jambes seules), 'b0' / 'b1' / 'b01' (bras seuls). Un seul remplissage, chaque membre
 * élargi de l'épaisseur du contour.
 */
type LimbSet = 'a' | 'b' | 'n' | 'b0' | 'b1' | 'b01';

function inkLimbs(ctx: Ctx, f: Figure, arms: LimbSet): void {
  const sk = f.sk;
  const legs = arms === 'a' || arms === 'b' || arms === 'n';
  const hips = legs && f.ap.bottom !== 'skirt' && !legsCovered(f.ap.top);
  const hr = handR(f) + f.ol;
  // bras et jambes de largeurs voisines : même rayon (le plus grand), comme un trait unique
  const lr = (limbsShareInk(f) ? Math.max(legR(f), handR(f)) : legR(f)) + f.ol;
  const ar = legs && limbsShareInk(f) ? lr : hr;
  const parts: [Pts, number][] = [];
  if (legs) {
    parts.push([legPts(f, 0, false), lr], [legPts(f, 1, false), lr]);
    if (hips) parts.push([[sk.hip[0], sk.hip[1]], lr]);
  }
  if (arms === 'a' || arms === 'b' || arms === 'b0' || arms === 'b01') parts.push([armPts(f, 0), ar]);
  if (arms === 'a' || arms === 'b1' || arms === 'b01') parts.push([armPts(f, 1), ar]);
  fillP(ctx, thickPath(`li${f.k}|${arms}|${hips ? 'h' : ''}`, parts), f.statue ? f.topDark : INK);
}

/** Aplats d'un bras : avant-bras nu éventuel, manche, main. */
function armFill(ctx: Ctx, f: Figure, i: 0 | 1, shade: boolean, hand: boolean): void {
  const w = f.sk.m.armW;
  const skin = shade ? f.skinShade : f.skin;
  if (f.sleeveShort) {
    fillP(ctx, thickPath(`af${f.k}|${i}`, [[armPts(f, i), w * 0.41]]), skin);
    fillP(ctx, thickPath(`as${f.k}|${i}`, [[sleevePts(f, i), (w + 0.25) / 2]]), shade ? f.sleeveShade : f.sleeve);
  } else fillP(ctx, thickPath(`af${f.k}|${i}`, [[armPts(f, i), w / 2]]), shade ? f.sleeveShade : f.sleeve);
  if (hand) fillP(ctx, handPath(f, i), skin);
}

function shoesShape(p: Path2D, f: Figure): void {
  const sk = f.sk;
  const s = sk.m.s;
  for (let k = 0; k < 2; k++) {
    const ft = sk.ft[k];
    if (sk.feetUp) S.ell(p, ft.x + 0.3 * s, ft.y - 0.1, 0.65 * s + 0.1, 1.25 * s);
    else S.ell(p, ft.x + 0.5 * s, ft.y + 0.38 * s, 1.3 * s + 0.1, 0.66 * s + 0.05);
  }
}

function legsFill(ctx: Ctx, f: Figure): void {
  const trousers = f.ap.bottom === 'trousers';
  const covered = legsCovered(f.ap.top);
  const r = legR(f);
  const hips = trousers && !covered;
  // jambe arrière ombrée (gros plan), sinon les deux jambes d'un seul aplat
  const shade = f.micro || f.statue;
  if (shade) fillP(ctx, thickPath(`l0${f.k}`, [[legPts(f, 0, false), r]]), trousers ? f.bottomShade : f.skinShade);
  const front: [Pts, number][] = [[legPts(f, 1, hips), r]];
  if (!shade) front.push([legPts(f, 0, false), r]);
  fillP(ctx, thickPath(`l1${f.k}|${shade ? 's' : ''}${hips ? 'h' : ''}`, front), trousers ? f.bottom : f.skin);
  if (f.ap.bottom === 'shorts' && !covered) fillP(ctx, thickPath(`sh${f.k}`, [[shortsPts(f), (f.sk.m.legW + 0.45) / 2]]), f.bottom);
  if (f.statue) fillP(ctx, cached(`s${f.k}`, (p) => shoesShape(p, f)), f.bottom);
}

type GarmentKind = 'coat' | 'dress' | 'petticoat' | 'skirt' | 'apron';

function garmentPath(f: Figure, kind: GarmentKind): Path2D | null {
  return cached(`g${f.k}|${kind}`, (p) => {
    const sk = f.sk;
    switch (kind) {
      case 'coat':
        S.poly(p, sk.coat);
        return;
      case 'dress':
        S.poly(p, sk.dress);
        return;
      case 'petticoat':
        S.poly(p, scaleHull(sk.dress, sk.P, 1.12));
        return;
      case 'skirt':
        S.poly(p, sk.skirt);
        return;
      case 'apron':
        S.poly(p, sk.apron);
        return;
    }
  });
}

/** Pièces de vêtement du bas visibles (dans l'ordre de dessin). */
function garmentKinds(top: TopKind, bottom: string): GarmentKind[] {
  if (top === 'coat') return ['coat'];
  if (top === 'dress') return bottom === 'skirt' ? ['petticoat', 'dress'] : ['dress'];
  const out: GarmentKind[] = [];
  if (bottom === 'skirt') out.push('skirt');
  if (top === 'apron') out.push('apron');
  return out;
}

function garmentFill(ctx: Ctx, f: Figure): void {
  const ap = f.ap;
  const sk = f.sk;
  for (const kind of garmentKinds(ap.top, ap.bottom)) {
    const p = garmentPath(f, kind);
    if (kind === 'petticoat' || kind === 'skirt') fillP(ctx, p, f.bottom);
    else fillTop(ctx, f, p, null);
    if (f.lod !== 0 || sk.lie) continue;
    if (kind === 'skirt' && f.pose !== 'sit') {
      // plis de la jupe
      const folds = cached(`gf${f.k}`, (q) => {
        const P = sk.P;
        for (const dx of [-1.1, 0.3, 1.6]) {
          q.moveTo(P.x + dx * 0.6, P.y + 0.6);
          q.lineTo(P.x + dx, P.y + 3.2 * sk.m.s);
        }
      });
      ctx.lineWidth = 0.28;
      ctx.strokeStyle = f.bottomDark;
      if (folds) ctx.stroke(folds);
    } else if (kind === 'coat') {
      // fente du manteau
      const slit = cached(`gs${f.k}`, (q) => {
        const P = sk.P;
        const kn = sk.kn[1];
        q.moveTo(P.x + sk.ax.x * 0.6, P.y + 0.3);
        q.lineTo((P.x + kn.x) / 2 + 0.6, (kn.y + sk.ft[1].y) / 2 - 1);
      });
      ctx.lineWidth = 0.3;
      ctx.strokeStyle = INK;
      if (slit) ctx.stroke(slit);
    }
  }
}

function scaleHull(pts: readonly number[], c: Pt, k: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < pts.length; i += 2) out.push(c.x + (pts[i] - c.x) * k, c.y + (pts[i + 1] - c.y) * k);
  return out;
}

/* ----------------------------------------------------------------------------
 * Motifs
 * ------------------------------------------------------------------------- */

/**
 * Remplit p avec la couleur du haut et son motif. Motifs au niveau 0 seulement, et à partir de
 * MICRO_SCALE px par unité : en dessous, une rayure de 1,5 u ne couvre qu'un pixel (bruit, moiré).
 * Les tuiles du zoom de jeu (≥ 1,5) sont toujours rendues à 2 px par unité ou plus.
 * `m` = repère du motif (null = local).
 */
function fillTop(ctx: Ctx, f: Figure, p: Path2D | null, m: DOMMatrix2DInit | null): void {
  if (!p) return;
  if (f.micro && f.ap.topPattern !== 'plain') {
    const pat = topPattern(ctx, f);
    if (pat) {
      setPatternFillMatrix(ctx, pat, m ?? IDENTITY);
      ctx.fill(p);
      return;
    }
  }
  fillP(ctx, p, f.top);
}

const IDENTITY: DOMMatrix2DInit = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

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

/* ----------------------------------------------------------------------------
 * Sous-couche d'encre
 * ------------------------------------------------------------------------- */

function hatR(sk: Skel): number {
  // allongé : chapeau et cheveux arrière un peu réduits pour ne pas passer sous le sol
  return sk.lie ? sk.m.headR * 0.8 : sk.m.headR;
}

/**
 * Ajoute à p la forme construite par fn dans le repère m, agrandie de g (unités monde) autour du
 * centre de sa boîte (cx, cy, demi-largeur hx, demi-hauteur hy, dans le repère m).
 */
function grown(p: Path2D, m: DOMMatrix2DInit, box: S.Box, k: number, g: number, fn: (q: Path2D) => void): void {
  const [cx, cy, hx, hy] = [box[0] * k, box[1] * k, box[2] * k, box[3] * k];
  // échelle propre du repère (le buste allongé est aplati)
  const kx = Math.hypot(m.a ?? 1, m.b ?? 0) || 1;
  const ky = Math.hypot(m.c ?? 0, m.d ?? 1) || 1;
  const sx = hx > 0 ? (hx + g / kx) / hx : 1;
  const sy = hy > 0 ? (hy + g / ky) / hy : 1;
  const q = new Path2D();
  fn(q);
  const M = new DOMMatrix([m.a ?? 1, m.b ?? 0, m.c ?? 0, m.d ?? 1, m.e ?? 0, m.f ?? 0]).translate(cx, cy).scale(sx, sy).translate(-cx, -cy);
  p.addPath(q, M);
}

/**
 * Sous-couche d'encre du corps : chaque pièce (chaussures, bas de vêtement, buste, cou, capuche,
 * tête, cheveux, barbe, chapeau) agrandie de l'épaisseur du contour, remplie d'encre en une fois.
 * Les membres ont leur propre trait (limbInkPath). bust = buste seul (sans jambes).
 */
function underlayPath(f: Figure, mode: 'full' | 'bust' | 'legs' = 'full'): Path2D | null {
  const ap = f.ap;
  const fx = ap.face === 'beard' || ap.face === 'mask' ? ap.face : '';
  const g = f.ol;
  const key = `u${f.k}|${ap.top}|${ap.bottom}|${ap.hair}|${ap.hat}|${fx}|${mode}|${g}`;
  return cached(key, (p) => {
    const sk = f.sk;
    const m = sk.m;
    const r = m.headR;
    const fr = frameOf(sk);
    if (mode !== 'bust') {
      const s = m.s;
      for (let k = 0; k < 2; k++) {
        const ft = sk.ft[k];
        if (sk.feetUp) S.ell(p, ft.x + 0.3 * s, ft.y - 0.1, 0.65 * s + 0.1 + g, 1.25 * s + g);
        else S.ell(p, ft.x + 0.5 * s, ft.y + 0.38 * s, 1.3 * s + 0.1 + g, 0.66 * s + 0.05 + g);
      }
      for (const kind of garmentKinds(ap.top, ap.bottom)) {
        const gp = garmentPath(f, kind);
        if (gp) grown(p, IDENTITY, S.polyBox(garmentPts(f, kind)), 1, g, (q) => q.addPath(gp));
      }
    }
    if (mode === 'legs') return;
    grown(p, fr.torso, S.torsoBox(m, ap.top), 1, g, (q) => S.torsoShape(q, m, ap.top));
    inFrame(p, fr.torso, (q) => {
      const s = m.s;
      q.rect(-0.62 * s - 0.15 - g, -1.05 * s, 1.24 * s + 0.3 + 2 * g, 1.05 * s + 0.1);
      if (ap.top === 'hoodie') S.ell(q, -m.sw * 0.45, -0.9 * s, r * 0.95 + g, r * 0.75 + g, -0.3);
    });
    const head = fr.head;
    inFrame(p, head, (q) => {
      S.circ(q, 0, 0, r + g);
      S.circ(q, 0.97 * r, 0.12 * r, 0.22 * r + g);
      if (ap.hair === 'bun' && (ap.hat === 'none' || ap.hat === 'beret' || ap.hat === 'cap')) {
        const br = hatR(sk);
        S.circ(q, -0.35 * br, -1.05 * br, 0.45 * br + g);
      }
    });
    const hb = S.HAIR_BACK_BOX[ap.hair];
    if (hb && ap.hair !== 'bun') grown(p, head, hb, hatR(sk), g, (q) => S.hairBackShape(q, ap.hair, ap.hat, hatR(sk)));
    grown(p, head, S.hairFrontBox(ap.hair, ap.hat), r, g, (q) => S.hairFrontShape(q, ap.hair, ap.hat, r));
    if (ap.face === 'beard') grown(p, head, S.BEARD_BOX, r, g, (q) => S.beardShape(q, r));
    if (ap.face === 'mask') grown(p, head, S.MASK_BOX, r, g, (q) => S.maskShape(q, r));
    if (ap.hat !== 'none') {
      const hr = hatR(sk);
      grown(p, head, S.HAT_BOX[ap.hat], hr, g, (q) => S.hatShape(q, ap.hat, hr));
    }
  });
}

function garmentPts(f: Figure, kind: GarmentKind): number[] {
  const sk = f.sk;
  switch (kind) {
    case 'coat':
      return sk.coat;
    case 'dress':
      return sk.dress;
    case 'petticoat':
      return scaleHull(sk.dress, sk.P, 1.12);
    case 'skirt':
      return sk.skirt;
    case 'apron':
      return sk.apron;
  }
}

/* ----------------------------------------------------------------------------
 * Haut du corps (buste, tête, cheveux, chapeau)
 * ------------------------------------------------------------------------- */

interface UpperOpts {
  /** Main arrière peinte avec la peau de la tête (bras arrière à manche longue). */
  backHand: boolean;
  /** Main avant peinte avec la peau de la tête (niveau 1). */
  frontHand: boolean;
  /** Chaussures (encre) : oui sauf buste seul. */
  shoes: boolean;
  /** Niveau 1 : les deux bras (manches) sont peints avec le buste. */
  armsInTorso: boolean;
  /** Appareil photo dessiné plus tard, par-dessus le bras avant (sinon caché en marchant). */
  cameraLater?: boolean;
}

function torsoPath(f: Figure): Path2D | null {
  return cached(`t${f.k}|${f.ap.top}`, (p) => inFrame(p, frameOf(f.sk).torso, (q) => S.torsoShape(q, f.sk.m, f.ap.top)));
}

function upperBody(ctx: Ctx, f: Figure, o: UpperOpts): void {
  const ap = f.ap;
  const sk = f.sk;
  const k = f.k;
  const m = sk.m;
  const r = m.headR;
  const micro = f.micro && !f.statue;
  const fr = frameOf(sk);

  // cheveux arrière
  fillP(ctx, cached(`hb${k}|${ap.hair}|${ap.hat}`, (p) => {
    let any = false;
    inFrame(p, fr.head, (q) => (any = S.hairBackShape(q, ap.hair, ap.hat, hatR(sk))));
    return any;
  }), f.hair);

  // buste (et manches au niveau 1)
  const overlay = ap.top === 'apron' || ap.top === 'overalls';
  if (o.armsInTorso) {
    fillP(ctx, thickPath(`aa${k}`, [[armPts(f, 0), m.armW / 2], [armPts(f, 1), m.armW / 2]]), f.sleeve);
    fillP(ctx, torsoPath(f), overlay ? f.sleeve : f.top);
  } else if (overlay) fillP(ctx, torsoPath(f), f.sleeve);
  else fillTop(ctx, f, torsoPath(f), fr.torso);
  // bavette (tablier, salopette)
  if (overlay) fillTop(ctx, f, cached(`o${k}|${ap.top}`, (p) => inFrame(p, fr.torso, (q) => S.topOverlayShape(q, m, ap.top))), fr.torso);
  // détails colorés du haut
  for (const [p, role] of torsoDetails(f)) fillP(ctx, p, detailColor(f, role));
  if ((ap.accessory === 'camera' && !o.cameraLater) || ap.accessory === 'scarf' || ap.accessory === 'backpack') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = f.ol;
    drawAccessoryFront(ctx, f);
  }

  // peau : cou, tête, nez (+ mains selon les cas, encolure de la robe)
  const dress = ap.top === 'dress';
  fillP(ctx, cached(`k${k}|${dress ? 'd' : ''}${o.backHand ? 'b' : ''}${o.frontHand ? 'f' : ''}`, (p) => {
    inFrame(p, fr.torso, (q) => {
      S.neckShape(q, m);
      if (dress) S.ell(q, 0.25, -0.15, 1.25 * m.s, 0.85 * m.s);
    });
    inFrame(p, fr.head, (q) => S.headShape(q, r));
    handsShape(p, f, o.backHand, o.frontHand);
  }), f.skin);

  // encre : chaussures, yeux, boutons, ceinturon, lunettes noires, masque
  if (micro || ap.face === 'sunglasses' || ap.face === 'mask') {
    const shoes = false;
    const eyes = micro && eyesOpen(ap.face, f.emote);
    const face = ap.face === 'sunglasses' || ap.face === 'mask' ? ap.face : '';
    const key = `i${k}|${micro ? ap.top : ''}|${face}|${shoes ? 's' : ''}${eyes ? 'e' : ''}${micro ? 'm' : ''}`;
    fillP(ctx, cached(key, (p) => {
      let any = false;
      if (shoes) {
        shoesShape(p, f);
        any = true;
      }
      if (eyes || face) {
        inFrame(p, fr.head, (q) => {
          if (eyes) S.eyesShape(q, r, ap.face, f.emote);
          if (face === 'sunglasses') S.sunglassesShape(q, r);
          if (face === 'mask') S.maskShape(q, r);
        });
        any = true;
      }
      if (micro) inFrame(p, fr.torso, (q) => (any = torsoInk(q, f, micro) || any));
      return any;
    }), f.statue ? f.topDark : INK);
  }

  // petits détails du visage (gros plan)
  if (micro) faceExtras(ctx, f);

  // cheveux (et barbe)
  const beard = ap.face === 'beard';
  fillP(ctx, cached(`hf${k}|${ap.hair}|${ap.hat}|${beard ? 'b' : ''}`, (p) => inFrame(p, fr.head, (q) => {
    S.hairFrontShape(q, ap.hair, ap.hat, r);
    if (beard) S.beardShape(q, r);
  })), f.hair);

  // contours intérieurs : bord du haut, détails du buste, lisière des cheveux, traits du visage
  if (f.micro) {
    const mouth = micro ? `${ap.face}|${emoteFace(f.emote)}` : '';
    const lines = cached(`c${k}|${ap.top}|${ap.hair}|${mouth}`, (p) => {
      inFrame(p, fr.torso, (q) => {
        S.torsoShape(q, m, ap.top);
        torsoLines(q, f);
      });
      inFrame(p, fr.head, (q) => {
        S.hairEdgeLine(q, ap.hair, r);
        if (micro) S.faceLines(q, r, ap.face, f.emote);
      });
    });
    ctx.strokeStyle = INK;
    ctx.lineWidth = f.ol * 0.7;
    if (lines) ctx.stroke(lines);
  }

  // chapeau
  if (ap.hat !== 'none') drawHat(ctx, f);
}

function eyesOpen(face: FaceDetail, emote: Emote): boolean {
  return emote !== 'ko' && emote !== 'sleep' && face !== 'sunglasses' && face !== 'mask';
}

/** Classe d'expression (traits du visage) : seules ces valeurs changent le dessin. */
function emoteFace(e: Emote): string {
  switch (e) {
    case 'ko':
    case 'sleep':
    case 'angry':
      return e;
    case 'exclaim':
    case 'question':
    case 'sweat':
      return 'o';
    default:
      return '';
  }
}

type DetailRole = 'dark' | 'light' | 'white' | 'tie' | 'gold';

function detailColor(f: Figure, role: DetailRole): string {
  switch (role) {
    case 'dark':
      return f.topDark;
    case 'light':
      return f.topLight;
    case 'white':
      return SHIRT_WHITE;
    case 'gold':
      return f.statue ? f.topLight : GOLD;
    case 'tie':
      return f.statue ? f.topDark : ['red', 'pink', 'orange', 'purple'].includes(f.ap.topColor) ? COLOR_HEX.navy : COLOR_HEX.red;
  }
}

const DETAILS = new Map<string, [Path2D, DetailRole][]>();

/** Petits aplats colorés du buste (col, cravate, revers, ceinture, insignes…), en cache. */
function torsoDetails(f: Figure): [Path2D, DetailRole][] {
  const lod0 = f.lod === 0;
  const key = `${f.k}|${f.ap.top}|${lod0 ? 1 : 0}${f.micro ? 1 : 0}`;
  let list = DETAILS.get(key);
  if (list) return list;
  list = [];
  const out = list;
  const fr = frameOf(f.sk);
  const m = f.sk.m;
  const s = m.s;
  const T = m.torso;
  const sw = m.sw;
  const hw = m.hw;
  const add = (role: DetailRole, fn: (q: Path2D) => void) => {
    const p = new Path2D();
    inFrame(p, fr.torso, fn);
    out.push([p, role]);
  };
  switch (f.ap.top) {
    case 'shirt':
      if (lod0) add('light', (q) => S.poly(q, [-0.9 * s, -0.2, 0.2, 1.0 * s, 1.3 * s, -0.2, 0.2, 0.35]));
      break;
    case 'sweater':
      if (lod0)
        add('dark', (q) => {
          S.ell(q, 0.1, -0.05, 1.2 * s, 0.55 * s);
          q.rect(-hw - 0.1, T, hw * 2 + 0.2 + m.belly * 0.3, 0.75);
        });
      break;
    case 'hoodie':
      add('dark', (q) => {
        S.hoodShape(q, m);
        if (lod0) {
          S.poly(q, [-hw * 0.55, T + 0.1, -hw * 0.4, T - 2.0 * s, hw * 0.65 + m.belly * 0.6, T - 2.0 * s, hw * 0.8 + m.belly * 0.6, T + 0.1]);
          S.ell(q, 0.15, -0.1, 1.35 * s, 0.6 * s);
        }
      });
      break;
    case 'coat':
      if (lod0) {
        add('dark', (q) => {
          S.poly(q, [-1.1 * s, -0.25, 0.3, 2.4 * s, 1.6 * s, -0.25, 0.9 * s, -0.4, 0.3, 1.2 * s, -0.4 * s, -0.4]);
          q.rect(-hw - 0.15, T - 0.9, hw * 2 + 0.3 + m.belly * 0.5, 0.75);
        });
        if (f.micro) add('gold', (q) => q.rect(0.0, T - 1.0, 0.9, 0.95));
      }
      break;
    case 'suit':
      // plastron blanc et pochette, puis cravate
      add('white', (q) => {
        S.poly(q, [-0.85 * s, -0.25, 0.35, 3.0 * s, 1.55 * s, -0.25]);
        if (lod0) q.rect(sw * 0.45, 1.6 * s, 0.9 * s, 0.35 * s);
      });
      add('tie', (q) => S.poly(q, [0.05, -0.1, 0.75, -0.1, 0.62, 0.45, 0.85, 2.6 * s, 0.4, 3.1 * s, -0.05, 2.6 * s, 0.2, 0.45]));
      break;
    case 'uniform':
      // épaulettes, boucle, étoile (l'insigne)
      add('gold', (q) => {
        q.rect(0.1, T - 0.8, 0.8, 0.9);
        q.rect(-sw - 0.1, 0.2, 1.5 * s, 0.6);
        q.rect(sw - 1.4 * s + 0.1, 0.2, 1.5 * s, 0.6);
        S.starShape(q, sw * 0.5 + 0.1, 2.0 * s, 0.95 * s + 0.15);
        if (f.micro) for (const yy of [1.2, 2.4, 3.6]) S.circ(q, 0.15, yy * s, 0.2);
      });
      break;
    case 'dress':
      if (lod0) add('dark', (q) => q.rect(-hw + 0.2, T - 0.45, hw * 2 - 0.4 + m.belly * 0.3, 0.5));
      break;
    case 'overalls':
      add('gold', (q) => {
        S.circ(q, -sw * 0.45, 2.05 * s, 0.3 * s + 0.05);
        S.circ(q, sw * 0.5, 2.05 * s, 0.3 * s + 0.05);
      });
      break;
  }
  DETAILS.set(key, list);
  return list;
}

/** Formes d'encre du buste (repère du buste) : boutons, ceinturon. Renvoie vrai si non vide. */
function torsoInk(q: Path2D, f: Figure, micro: boolean): boolean {
  const m = f.sk.m;
  const s = m.s;
  const T = m.torso;
  switch (f.ap.top) {
    case 'uniform':
      q.rect(-m.hw - 0.1, T - 0.75, m.hw * 2 + 0.2 + m.belly * 0.5, 0.8);
      return true;
    case 'suit':
      if (!micro) return false;
      S.circ(q, 0.45, 3.9 * s, 0.24);
      S.circ(q, 0.5 + m.belly * 0.2, 4.9 * s, 0.24);
      return true;
    case 'coat':
      if (!micro) return false;
      for (const [x, y] of [[-0.3, 3.0], [1.1, 3.0], [-0.3, 4.1], [1.1, 4.1]]) S.circ(q, x, y * s, 0.24);
      return true;
    case 'shirt':
      if (!micro) return false;
      S.circ(q, 0.75, 2.2 * s, 0.2);
      S.circ(q, 0.75 + m.belly * 0.2, 3.5 * s, 0.2);
      return true;
  }
  return false;
}

/** Traits intérieurs du buste (repère du buste), tracés avec les autres contours. */
function torsoLines(q: Path2D, f: Figure): void {
  const m = f.sk.m;
  const s = m.s;
  const T = m.torso;
  const sw = m.sw;
  switch (f.ap.top) {
    case 'tshirt':
      q.moveTo(0.25 + 0.9 * s * Math.cos(0.25), -0.2 + 0.9 * s * Math.sin(0.25));
      q.arc(0.25, -0.2, 0.9 * s, 0.25, Math.PI - 0.25);
      return;
    case 'shirt':
      q.moveTo(-0.9 * s, -0.2);
      q.lineTo(0.2, 1.0 * s);
      q.lineTo(1.3 * s, -0.2);
      q.moveTo(0.4, 1.0 * s);
      q.lineTo(0.4 + m.belly * 0.4, T + 0.2);
      return;
    case 'suit':
      // revers
      q.moveTo(-0.9 * s, -0.1);
      q.lineTo(0.3, 3.1 * s);
      q.lineTo(1.6 * s, -0.1);
      return;
    case 'coat':
      q.moveTo(-1.1 * s, -0.25);
      q.lineTo(0.3, 2.4 * s);
      q.lineTo(1.6 * s, -0.25);
      return;
    case 'dress':
      q.moveTo(0.25 + 1.25 * s * Math.cos(0.1), -0.15 + 0.85 * s * Math.sin(0.1));
      q.ellipse(0.25, -0.15, 1.25 * s, 0.85 * s, 0, 0.1, Math.PI - 0.1);
      return;
    case 'apron':
    case 'overalls':
      S.topOverlayShape(q, m, f.ap.top);
      if (f.ap.top === 'apron') q.rect(-0.6 * s, 2.3 * s, 1.8 * s, 1.2 * s);
      else q.rect(-0.7 * s, 2.6 * s, 1.9 * s, 1.1 * s);
      return;
    case 'hoodie':
      // cordons
      q.moveTo(-0.3, 0.3);
      q.lineTo(-0.35, 2.0 * s);
      q.moveTo(0.9, 0.3);
      q.lineTo(0.95, 2.0 * s);
      return;
    case 'uniform':
      q.moveTo(sw * 0.15, -0.1);
      q.lineTo(sw * 0.15, T + 0.2);
      return;
  }
}

/** Joues, trous du masque, moustache, reflet des lunettes noires (niveau 0, assez de pixels). */
function faceExtras(ctx: Ctx, f: Figure): void {
  const r = f.sk.m.headR;
  const face = f.ap.face;
  const k = f.k;
  const head = frameOf(f.sk).head;
  const inHead = (key: string, fn: (q: Path2D) => void) => cached(key, (p) => inFrame(p, head, fn));
  if (f.cheeks && face !== 'beard' && face !== 'mask') fillP(ctx, inHead(`xc${k}`, (q) => S.circ(q, 0.5 * r, 0.32 * r, 0.2 * r)), CHEEK);
  if (face === 'mask') {
    fillP(ctx, inHead(`xm${k}`, (q) => {
      S.ell(q, S.EYE.x1 * r, S.EYE.y * r, 0.15 * r, 0.11 * r);
      S.ell(q, S.EYE.x2 * r, S.EYE.y * r, 0.15 * r, 0.11 * r);
    }), '#ffffff');
    fillP(ctx, inHead(`xp${k}`, (q) => {
      S.circ(q, (S.EYE.x1 + 0.04) * r, S.EYE.y * r, 0.07 * r);
      S.circ(q, (S.EYE.x2 + 0.04) * r, S.EYE.y * r, 0.07 * r);
    }), INK);
  } else if (face === 'mustache') {
    fillP(ctx, inHead(`xu${k}`, (q) => S.mustacheShape(q, r)), f.hairDark);
  } else if (face === 'sunglasses' && f.cheeks) {
    fillP(ctx, inHead(`xg${k}`, (q) => {
      q.rect((S.EYE.x1 - 0.12) * r, (S.EYE.y - 0.1) * r, 0.1 * r, 0.08 * r);
      q.rect((S.EYE.x2 - 0.1) * r, (S.EYE.y - 0.1) * r, 0.1 * r, 0.08 * r);
    }), 'rgba(255,255,255,0.55)');
  }
}

/* ----------------------------------------------------------------------------
 * Chapeaux
 * ------------------------------------------------------------------------- */

const HAT_PARTS = new Map<string, [Path2D, string][]>();

/** Détails colorés d'un chapeau (visière, ruban, bandeau…), en cache. */
function hatDetails(f: Figure, lod0: boolean): [Path2D, string][] {
  const hat = f.ap.hat;
  const key = `${f.k}|${hat}|${lod0 ? 1 : 0}`;
  let list = HAT_PARTS.get(key);
  if (list) return list;
  list = [];
  const out = list;
  const head = frameOf(f.sk).head;
  const r = hatR(f.sk);
  const add = (color: string, fn: (q: Path2D) => void) => {
    const p = new Path2D();
    inFrame(p, head, fn);
    out.push([p, color]);
  };
  switch (hat) {
    case 'cap':
      add(HAT_DETAIL.cap, (q) => {
        // visière plus sombre, bouton
        q.moveTo(0.55 * r, -0.26 * r);
        q.quadraticCurveTo(1.55 * r, -0.38 * r, 1.95 * r, -0.12 * r);
        q.lineTo(0.7 * r, -0.02 * r);
        q.closePath();
        if (lod0) S.circ(q, 0, -1.25 * r, 0.17 * r);
      });
      break;
    case 'tophat':
      add('#9b2f3a', (q) => q.rect(-0.82 * r, -1.1 * r, 1.66 * r, 0.38 * r));
      break;
    case 'beanie':
      add(HAT_DETAIL.beanie, (q) => q.rect(-1.12 * r, -0.62 * r, 2.24 * r, 0.42 * r));
      add('#fbf3e6', (q) => S.circ(q, 0, -1.48 * r, 0.32 * r));
      break;
    case 'fedora':
      add(INK, (q) => q.rect(-0.82 * r, -0.95 * r, 1.72 * r, 0.32 * r));
      break;
    case 'bowler':
      if (lod0) add('#5a4e48', (q) => q.rect(-0.84 * r, -0.92 * r, 1.68 * r, 0.2 * r));
      break;
    case 'police':
      add('#1c1a1a', (q) => {
        q.moveTo(0.35 * r, -0.5 * r);
        q.quadraticCurveTo(1.3 * r, -0.55 * r, 1.68 * r, -0.26 * r);
        q.lineTo(0.5 * r, -0.3 * r);
        q.closePath();
        q.rect(-0.95 * r, -0.74 * r, 1.97 * r, 0.26 * r);
      });
      add(GOLD, (q) => S.circ(q, 0.45 * r, -1.02 * r, 0.24 * r));
      break;
    case 'straw':
      add(COLOR_HEX.red, (q) => q.rect(-0.8 * r, -0.88 * r, 1.64 * r, 0.26 * r));
      break;
    case 'beret':
      if (lod0) add(HAT_DETAIL.beret, (q) => q.rect(-0.28 * r, -1.46 * r, 0.24 * r, 0.32 * r));
      break;
  }
  HAT_PARTS.set(key, list);
  return list;
}

/** Chapeau : aplat, détails (sauf details = false), contour. */
function drawHat(ctx: Ctx, f: Figure, details = true): void {
  const hat = f.ap.hat;
  if (hat === 'none') return;
  const k = f.k;
  const lod0 = f.lod === 0;
  const head = frameOf(f.sk).head;
  const r = hatR(f.sk);
  fillP(ctx, cached(`h${k}|${hat}`, (p) => inFrame(p, head, (q) => S.hatShape(q, hat, r))), f.statue ? f.topShade : HAT_HEX[hat]);
  if (f.statue || !details) return;
  for (const [p, color] of hatDetails(f, lod0)) fillP(ctx, p, color);
  // contour du chapeau (sur le visage et les cheveux)
  if (f.micro) {
    const lines = cached(`hl${k}|${hat}`, (p) => inFrame(p, head, (q) => {
      S.hatOutline(q, hat, r);
      S.hatLines(q, hat, r);
    }));
    ctx.strokeStyle = INK;
    ctx.lineWidth = f.ol * 0.75;
    if (lines) ctx.stroke(lines);
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
const WINDOW_INTERIOR_LIT = mix(MAT.interior, '#ffdc96', 0.12);

/** Buste seul : sous-couche d'encre puis haut du corps (repère courant = repère des pieds). */
function drawBust(ctx: Ctx, f: Figure, arms: boolean): void {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (arms) inkLimbs(ctx, f, 'b0');
  inkUnder(ctx, f, underlayPath(f, 'bust'));
  if (arms) armFill(ctx, f, 0, true, true);
  upperBody(ctx, f, { backHand: false, frontHand: false, shoes: false, armsInTorso: false });
  if (arms) {
    inkLimbs(ctx, f, 'b1');
    armFill(ctx, f, 1, false, true);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = f.ol;
}

function drawWindowBust(ctx: Ctx, f: Figure): void {
  const fine = f.lod === 0;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = f.ol;
  // cadre et intérieur
  ctx.fillStyle = MAT.windowFrame;
  ctx.beginPath();
  ctx.rect(-7, -13, 14, 11);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = fine ? WINDOW_INTERIOR_LIT : MAT.interior;
  ctx.fillRect(-6, -12.1, 12, 9.4);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-6, -12.1, 12, 9.4);
  ctx.clip();
  ctx.translate(0, WIN_SHIFT);
  ctx.scale(WIN_K, WIN_K);
  drawBust(ctx, f, false);
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
  ctx.moveTo(-0.55, -3.5);
  ctx.arc(-1.3, -3.5, 0.75, 0, TAU);
  ctx.moveTo(2.05, -3.5);
  ctx.arc(1.3, -3.5, 0.75, 0, TAU);
  ctx.fill();
  ctx.lineWidth = f.ol * 0.85;
  ctx.stroke();
  ctx.lineWidth = f.ol;
}

/* ----------------------------------------------------------------------------
 * Pilote de deux-roues, conducteur, portrait, statue
 * ------------------------------------------------------------------------- */

/**
 * Dessine un pilote dans le repère du véhicule (face à droite). part = 'back' : jambes (sous le
 * cadre) ; 'front' : buste, tête et bras (par-dessus le cadre).
 */
export function drawRider(ctx: Ctx, ap: PersonAppearance, key: string, spec: RideSpec, lod: Lod, part: 'back' | 'front'): void {
  const sk = riderSkeleton(ap.build, key, spec);
  const f = makeFigure(ap, sk, lod, 'sit', 'none', 'none', 0, deviceScale(ctx));
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (part === 'back') {
    inkLimbs(ctx, f, 'n');
    inkUnder(ctx, f, underlayPath(f, 'legs'));
    legsFill(ctx, f);
    garmentFill(ctx, f);
    ctx.strokeStyle = INK;
    ctx.lineWidth = f.ol;
    return;
  }
  drawBust(ctx, f, true);
}

/** Tête et épaules seules (conducteur derrière une vitre, passagers du bus), centrées en (0, 0). */
export function drawHeadOnly(ctx: Ctx, ap: PersonAppearance, lod: Lod, scale: number): void {
  const sk = skeletonFor('regular', 'stand');
  const f = makeFigure(ap, sk, lod, 'stand', 'none', 'none', 0, deviceScale(ctx) * scale);
  f.ol = lod === 0 ? 0.45 / scale : 0.7 / scale;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-sk.head.x, -sk.head.y);
  drawBust(ctx, f, false);
  ctx.restore();
}

/**
 * Portrait (carnet) : buste du personnage centré en (cx, cy), dans un carré de côté `size`.
 * Le dessin est rogné au carré. Toujours au niveau de détail 0.
 */
export function drawPortrait(ctx: Ctx, appearance: PersonAppearance, cx: number, cy: number, size: number): void {
  const sk = skeletonFor(appearance.build, 'stand');
  const f = makeFigure(appearance, sk, 0, 'stand', 'none', 'none', 0, 8);
  const r = sk.m.headR;
  // Cadre : du haut du chapeau jusqu'à mi-buste.
  const top = sk.head.y - r - S.hatHeight(appearance.hat, r) - 0.8;
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
  // le buste est agrandi ≈ 2× : contour plus fin pour garder un trait d'encre régulier
  f.ol = 0.3;
  drawBust(ctx, f, true);
  ctx.restore();
}

const STATUE_AP: PersonAppearance = {
  skin: 'light',
  hair: 'short',
  hairColor: 'brown',
  hat: 'none',
  top: 'coat',
  topColor: 'green',
  topPattern: 'plain',
  bottom: 'trousers',
  bottomColor: 'green',
  face: 'none',
  accessory: 'none',
  build: 'regular',
};

export const STATUE_TONES = {
  bronze: { base: '#6f9c86', dark: '#4f7766', shade: '#5d8a75', light: '#93bba6' },
  stone: { base: '#e6e0d3', dark: '#b9b09f', shade: '#d2cabb', light: '#f6f2ea' },
} as const;

/**
 * Personnage de statue (ancre aux pieds, face à droite), toutes les couleurs remplacées par la
 * teinte du matériau. Utilisé par les objets 'statue' (place, parc, cimetière).
 */
export function drawBronzeFigure(
  ctx: Ctx,
  pose: Pose,
  lod: Lod,
  tone: keyof typeof STATUE_TONES = 'bronze',
  ap: PersonAppearance = STATUE_AP,
): void {
  const t = STATUE_TONES[tone];
  const sk = skeletonFor(ap.build, pose);
  const f = makeFigure({ ...ap, face: 'none', topPattern: 'plain' }, sk, lod === 2 ? 1 : lod, pose, 'none', 'none', 0, 2);
  f.statue = true;
  f.micro = false;
  f.cheeks = false;
  f.top = f.sleeve = f.bottom = f.skin = f.hair = t.base;
  f.topDark = f.bottomDark = f.skinDark = f.hairDark = t.dark;
  f.topShade = f.sleeveShade = f.bottomShade = f.skinShade = t.shade;
  f.topLight = t.light;
  ctx.save();
  drawFigure(ctx, f);
  ctx.restore();
}
