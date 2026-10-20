// Squelettes des personnages : position des articulations pour chaque corpulence × pose.
//
// Repère local : ancre (0, 0) = point entre les pieds, au sol ; x vers l'avant (la personne
// regarde vers +x, le miroir est appliqué au dessin) ; y vers le bas.
// Les squelettes ne dépendent que de (corpulence, pose) : ils sont calculés une fois et mis en cache.

import type { Build, Pose } from '../types';

export interface Pt {
  x: number;
  y: number;
}

export interface Metrics {
  /** Échelle des membres (1 pour un adulte). */
  s: number;
  headR: number;
  /** Demi-largeur aux épaules et aux hanches. */
  sw: number;
  hw: number;
  /** Ventre (corpulence large). */
  belly: number;
  legW: number;
  armW: number;
  /** Hauteur des hanches debout (de la cheville au bassin compris). */
  legLen: number;
  /** Longueur du torse (épaules → taille). */
  torso: number;
  neckGap: number;
  /** Décalage cheville → sol. */
  foot: number;
  /** Demi-largeur nominale (bounds.ts) : sert à borner les objets tenus. */
  halfW: number;
}

export const METRICS: Record<Build, Metrics> = {
  regular: { s: 1, headR: 2.75, sw: 3.3, hw: 2.9, belly: 0, legW: 1.85, armW: 1.45, legLen: 8.6, torso: 5.1, neckGap: 0.8, foot: 1, halfW: 5 },
  slim: { s: 1, headR: 2.7, sw: 2.75, hw: 2.35, belly: 0, legW: 1.6, armW: 1.3, legLen: 8.6, torso: 5.1, neckGap: 0.85, foot: 1, halfW: 4.5 },
  large: { s: 1, headR: 2.85, sw: 4.05, hw: 4.0, belly: 1.4, legW: 2.25, armW: 1.75, legLen: 8.5, torso: 5.2, neckGap: 0.65, foot: 1, halfW: 6.5 },
  child: { s: 0.62, headR: 2.35, sw: 2.15, hw: 1.9, belly: 0, legW: 1.3, armW: 1.1, legLen: 4.9, torso: 3.4, neckGap: 0.4, foot: 0.65, halfW: 4 },
};

interface PoseSpec {
  /** Inclinaison du buste vers l'avant (degrés). */
  lean: number;
  /** Bras [arrière, avant] : [angle du bras, angle de l'avant-bras], degrés depuis la verticale, + = vers l'avant. */
  arms: [[number, number], [number, number]];
  /** Jambes [arrière, avant] : [cuisse, tibia]. */
  legs: [[number, number], [number, number]];
  lift?: number;
  px?: number;
  headTilt?: number;
  /** Le bras « arrière » passe devant le buste (deux mains devant). */
  farArmOver?: boolean;
  armScale?: number;
  shoulderRaise?: number;
}

const SPECS: Record<Exclude<Pose, 'lie' | 'window'>, PoseSpec> = {
  stand: { lean: 0, arms: [[-7, -2], [7, 2]], legs: [[-2, -1], [2, 1]] },
  walk: { lean: 3, arms: [[22, 35], [-24, -8]], legs: [[-18, -30], [22, 6]] },
  run: { lean: 14, lift: 0.8, px: -0.6, arms: [[45, 115], [-50, 15]], legs: [[-30, -78], [65, 5]] },
  sit: { lean: -3, arms: [[12, 65], [18, 72]], legs: [[86, 0], [84, 4]] },
  crouch: { lean: 22, px: -1.2, arms: [[35, 60], [55, 35]], legs: [[70, -25], [80, -10]] },
  climb: { lean: 0, armScale: 1.15, shoulderRaise: 0.6, arms: [[-168, -175], [160, 172]], legs: [[0, 0], [65, 0]] },
  point: { lean: 0, arms: [[-6, -2], [86, 90]], legs: [[-2, -1], [2, 1]] },
  wave: { lean: 0, arms: [[-6, -2], [125, 168]], legs: [[-2, -1], [2, 1]] },
  carry: { lean: -4, farArmOver: true, arms: [[40, 100], [36, 100]], legs: [[-8, -10], [10, 4]] },
  phone: { lean: 0, arms: [[-6, -2], [150, -95]], legs: [[-2, -1], [2, 1]] },
  fight: { lean: 6, farArmOver: true, arms: [[60, 165], [45, 160]], legs: [[-18, -12], [20, 6]] },
  handsup: { lean: 0, armScale: 1.15, shoulderRaise: 0.6, arms: [[-158, -176], [158, 176]], legs: [[-2, -1], [2, 1]] },
  sneak: { lean: 26, px: -0.8, farArmOver: true, arms: [[70, 150], [80, 155]], legs: [[-8, -40], [40, -5]] },
  read: { lean: 0, headTilt: 14, farArmOver: true, arms: [[30, 118], [26, 116]], legs: [[-2, -1], [2, 1]] },
};

export interface Skel {
  pose: Pose;
  m: Metrics;
  lie: boolean;
  /** Repère du buste : origine N (milieu des épaules), axe x (avant) et axe y (vers la taille). */
  N: Pt;
  P: Pt;
  ax: Pt;
  ay: Pt;
  lean: number;
  /** Centre de la tête et rotation du repère de la tête (radians) ; lie = repère spécial. */
  head: Pt;
  headRot: number;
  /** Sommet de la tête (pour la bulle d'émotion). */
  headTop: Pt;
  sh: [Pt, Pt];
  el: [Pt, Pt];
  hd: [Pt, Pt];
  hip: [Pt, Pt];
  kn: [Pt, Pt];
  ft: [Pt, Pt];
  farArmOver: boolean;
  /** Ombre : centre x, rayons. */
  shadow: [number, number, number];
  /** Formes précalculées (listes plates x, y). */
  pelvis: number[];
  skirt: number[];
  dress: number[];
  coat: number[];
  apron: number[];
  /** Pieds tournés vers le haut (allongé). */
  feetUp: boolean;
}

const D2R = Math.PI / 180;

function add(p: Pt, x: number, y: number): Pt {
  return { x: p.x + x, y: p.y + y };
}

function limb(from: Pt, a1: number, a2: number, l1: number, l2: number): [Pt, Pt] {
  const r1 = a1 * D2R;
  const r2 = a2 * D2R;
  const mid = add(from, Math.sin(r1) * l1, Math.cos(r1) * l1);
  const end = add(mid, Math.sin(r2) * l2, Math.cos(r2) * l2);
  return [mid, end];
}

/** Enveloppe convexe (chaîne monotone d'Andrew), renvoyée en liste plate. */
export function hull(points: Pt[]): number[] {
  const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  const out: number[] = [];
  for (const p of lower.concat(upper)) out.push(p.x, p.y);
  return out;
}

/** Points d'une « jupe » couvrant le bassin et les cuisses jusqu'à une fraction t de la jambe. */
function skirtHull(sk: Omit<Skel, 'skirt' | 'dress' | 'coat' | 'apron' | 'pelvis'>, waistW: number, t: number, spread: number): number[] {
  const { P, ax, ay } = sk;
  const pts: Pt[] = [
    add(P, ax.x * -waistW + ay.x * -0.6, ax.y * -waistW + ay.y * -0.6),
    add(P, ax.x * waistW + ay.x * -0.6, ax.y * waistW + ay.y * -0.6),
  ];
  for (let i = 0; i < 2; i++) {
    const hip = sk.hip[i];
    const kn = sk.kn[i];
    const ft = sk.ft[i];
    // point le long de la jambe : t ∈ [0, 1] sur la cuisse, ]1, 2] sur le tibia
    let p: Pt;
    let dx: number;
    let dy: number;
    if (t <= 1) {
      p = { x: hip.x + (kn.x - hip.x) * t, y: hip.y + (kn.y - hip.y) * t };
      dx = kn.x - hip.x;
      dy = kn.y - hip.y;
    } else {
      const u = t - 1;
      p = { x: kn.x + (ft.x - kn.x) * u, y: kn.y + (ft.y - kn.y) * u };
      dx = ft.x - kn.x;
      dy = ft.y - kn.y;
    }
    const len = Math.hypot(dx, dy) || 1;
    // perpendiculaire à la jambe
    const nx = -dy / len;
    const ny = dx / len;
    // évase légèrement vers le bas de la jambe
    pts.push(add(p, nx * spread + (dx / len) * 0.3, ny * spread + (dy / len) * 0.3));
    pts.push(add(p, -nx * spread + (dx / len) * 0.3, -ny * spread + (dy / len) * 0.3));
  }
  return hull(pts);
}

function finish(base: Omit<Skel, 'skirt' | 'dress' | 'coat' | 'apron' | 'pelvis'>): Skel {
  const { P, ax, ay, m } = base;
  const hw = m.hw;
  const pelvis = [
    P.x + ax.x * -hw + ay.x * -0.7,
    P.y + ax.y * -hw + ay.y * -0.7,
    P.x + ax.x * hw + ay.x * -0.7,
    P.y + ax.y * hw + ay.y * -0.7,
    P.x + ax.x * hw * 0.85 + ay.x * 1.3 * m.s,
    P.y + ax.y * hw * 0.85 + ay.y * 1.3 * m.s,
    P.x + ax.x * -hw * 0.85 + ay.x * 1.3 * m.s,
    P.y + ax.y * -hw * 0.85 + ay.y * 1.3 * m.s,
  ];
  return {
    ...base,
    pelvis,
    skirt: skirtHull(base, hw + 0.15, 1.0, m.legW * 0.55 + 0.7 * m.s),
    dress: skirtHull(base, hw + 0.1, 1.05, m.legW * 0.55 + 0.9 * m.s),
    coat: skirtHull(base, hw + 0.15, 1.35, m.legW * 0.55 + 0.8 * m.s),
    apron: skirtHull(base, hw * 0.75, 1.0, m.legW * 0.3 + 0.35 * m.s),
  };
}

function buildStanding(pose: Exclude<Pose, 'lie' | 'window'>, m: Metrics): Skel {
  const sp = SPECS[pose];
  const s = m.s;
  const lean = sp.lean * D2R;
  const ax: Pt = { x: Math.cos(lean), y: Math.sin(lean) };
  const ay: Pt = { x: -Math.sin(lean), y: Math.cos(lean) };
  const thigh = (m.legLen - m.foot) / 2;
  const shin = thigh;
  // chute de chaque jambe (hanche → cheville)
  const drop = (a: [number, number]) => Math.cos(a[0] * D2R) * thigh + Math.cos(a[1] * D2R) * shin;
  const maxDrop = Math.max(drop(sp.legs[0]), drop(sp.legs[1]));
  const P: Pt = { x: (sp.px ?? 0) * s, y: -(maxDrop + m.foot + (sp.lift ?? 0) * s) };
  const N: Pt = { x: P.x - ay.x * m.torso, y: P.y - ay.y * m.torso };
  const hipOff = m.hw * 0.45;
  const hip: [Pt, Pt] = [add(P, -ax.x * hipOff, -ax.y * hipOff), add(P, ax.x * hipOff, ax.y * hipOff)];
  const lb = limb(hip[0], sp.legs[0][0], sp.legs[0][1], thigh, shin);
  const lf = limb(hip[1], sp.legs[1][0], sp.legs[1][1], thigh, shin);
  const shOff = m.sw - 0.45 * s;
  const raise = (sp.shoulderRaise ?? 0) * s;
  const sh: [Pt, Pt] = [
    add(N, -ax.x * shOff + ay.x * 0.6 * s, -ax.y * shOff + ay.y * 0.6 * s - raise),
    add(N, ax.x * shOff + ay.x * 0.6 * s, ax.y * shOff + ay.y * 0.6 * s - raise),
  ];
  const k = sp.armScale ?? 1;
  const ua = 2.9 * s * k;
  const fa = 2.7 * s * k;
  const ab = limb(sh[0], sp.arms[0][0], sp.arms[0][1], ua, fa);
  const af = limb(sh[1], sp.arms[1][0], sp.arms[1][1], ua, fa);
  const hl = lean * 0.6;
  const hd = m.neckGap + m.headR;
  const head: Pt = { x: N.x + Math.sin(hl) * hd, y: N.y - Math.cos(hl) * hd };
  const tilt = (sp.headTilt ?? 0) * D2R + hl * 0.5;
  const feetX = (lb[1].x + lf[1].x) / 2;
  return finish({
    pose,
    m,
    lie: false,
    N,
    P,
    ax,
    ay,
    lean,
    head,
    headRot: tilt,
    headTop: { x: head.x, y: head.y - m.headR },
    sh,
    el: [ab[0], af[0]],
    hd: [ab[1], af[1]],
    hip,
    kn: [lb[0], lf[0]],
    ft: [lb[1], lf[1]],
    farArmOver: sp.farArmOver ?? false,
    shadow: [pose === 'sit' ? feetX * 0.5 : feetX * 0.3, m.hw + 2.2 * s + (pose === 'sit' ? 1.5 : 0), 1.25],
    feetUp: false,
  });
}

function buildLie(m: Metrics): Skel {
  const s = m.s;
  const r = m.headR;
  // Allongé sur le dos, tête vers +x. Le buste est aplati (épaisseur ≈ 0,62 × largeur).
  const cy = -2.5 * (0.7 + 0.3 * s);
  const total = m.legLen - m.foot + m.torso + m.neckGap + 2 * r;
  const x0 = -total / 2 + 0.3;
  const ankleX = x0 + 0.6;
  const hipX = ankleX + (m.legLen - m.foot);
  const P: Pt = { x: hipX, y: cy };
  const N: Pt = { x: hipX + m.torso, y: cy };
  const ax: Pt = { x: 0, y: -0.62 };
  const ay: Pt = { x: -1, y: 0 };
  const head: Pt = { x: N.x + m.neckGap + r, y: -r - 0.1 };
  const hipOff = m.hw * 0.45 * 0.62;
  const hip: [Pt, Pt] = [
    { x: hipX, y: cy + hipOff },
    { x: hipX, y: cy - hipOff },
  ];
  const half = (m.legLen - m.foot) / 2;
  const kn: [Pt, Pt] = [
    { x: hipX - half, y: cy + hipOff * 0.9 },
    { x: hipX - half, y: cy - hipOff * 1.2 - 0.4 * s },
  ];
  const ft: [Pt, Pt] = [
    { x: ankleX, y: cy + hipOff * 0.8 },
    { x: ankleX + 0.4 * s, y: cy - hipOff * 1.2 },
  ];
  const shOff = (m.sw - 0.45 * s) * 0.62;
  const sh: [Pt, Pt] = [
    { x: N.x - 0.6 * s, y: cy + shOff },
    { x: N.x - 0.6 * s, y: cy - shOff },
  ];
  const el: [Pt, Pt] = [
    { x: sh[0].x - 2.8 * s, y: sh[0].y + 0.2 },
    { x: sh[1].x - 1.6 * s, y: sh[1].y - 2.2 * s },
  ];
  const hd: [Pt, Pt] = [
    { x: el[0].x - 2.6 * s, y: el[0].y - 0.1 },
    { x: el[1].x - 2.4 * s, y: el[1].y + 0.9 * s },
  ];
  // Miroir horizontal (tête vers -x) : le repère du buste devient une rotation pure (déterminant
  // positif), comme pour les autres poses. Indispensable pour regrouper plusieurs formes de même
  // couleur dans un seul remplissage (règle non nulle) sans créer de trous.
  const mx = (p: Pt): Pt => ({ x: -p.x, y: p.y });
  const mx2 = (a: [Pt, Pt]): [Pt, Pt] => [mx(a[0]), mx(a[1])];
  return finish({
    pose: 'lie',
    m,
    lie: true,
    N: mx(N),
    P: mx(P),
    ax: { x: -ax.x, y: ax.y },
    ay: { x: -ay.x, y: ay.y },
    lean: 0,
    head: mx(head),
    headRot: 0,
    headTop: { x: -head.x, y: head.y - r },
    sh: mx2(sh),
    el: mx2(el),
    hd: mx2(hd),
    hip: mx2(hip),
    kn: mx2(kn),
    ft: mx2(ft),
    farArmOver: false,
    shadow: [0, total / 2 + 0.5, 1.6],
    feetUp: true,
  });
}

const cache = new Map<string, Skel>();

/** Squelette (mis en cache) pour une corpulence et une pose. 'window' utilise le squelette debout. */
export function skeletonFor(build: Build, pose: Pose): Skel {
  const key = `${build}|${pose}`;
  let sk = cache.get(key);
  if (!sk) {
    const m = METRICS[build];
    sk = pose === 'lie' ? buildLie(m) : buildStanding(pose === 'window' ? 'stand' : pose, m);
    cache.set(key, sk);
  }
  return sk;
}

/**
 * Cinématique inverse à deux segments : renvoie [articulation, extrémité] pour atteindre `to`
 * depuis `from`. bend = +1 plie « dans le sens horaire » (coude vers le bas pour un bras tendu
 * vers l'avant), -1 dans l'autre sens (genou vers l'avant pour une jambe vers le bas).
 */
export function ik(from: Pt, to: Pt, a: number, b: number, bend: 1 | -1): [Pt, Pt] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.max(0.001, Math.hypot(dx, dy));
  const th = Math.atan2(dy, dx);
  if (d >= a + b - 0.01) {
    const ux = dx / d;
    const uy = dy / d;
    return [add(from, ux * a, uy * a), add(from, ux * (a + b), uy * (a + b))];
  }
  const cos = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
  const al = Math.acos(cos) * bend;
  const mid = add(from, Math.cos(th + al) * a, Math.sin(th + al) * a);
  return [mid, to];
}

export interface RideSpec {
  /** Bassin (assise), inclinaison du buste (degrés), cibles des pieds et des mains. */
  hip: Pt;
  lean: number;
  feet: [Pt, Pt];
  hands: [Pt, Pt];
}

/** Squelette d'un pilote (vélo, scooter, cheval…) dans le repère du véhicule (face à droite). */
export function riderSkeleton(build: Build, key: string, spec: RideSpec): Skel {
  const ck = `${build}|ride-${key}`;
  let sk = cache.get(ck);
  if (sk) return sk;
  const m = METRICS[build];
  const s = m.s;
  const lean = spec.lean * D2R;
  const ax: Pt = { x: Math.cos(lean), y: Math.sin(lean) };
  const ay: Pt = { x: -Math.sin(lean), y: Math.cos(lean) };
  const P = spec.hip;
  const N: Pt = { x: P.x - ay.x * m.torso, y: P.y - ay.y * m.torso };
  const hipOff = m.hw * 0.45;
  const hip: [Pt, Pt] = [add(P, -ax.x * hipOff * 0.5, -ax.y * hipOff * 0.5), add(P, ax.x * hipOff * 0.5, ax.y * hipOff * 0.5)];
  const thigh = (m.legLen - m.foot) / 2;
  const lb = ik(hip[0], spec.feet[0], thigh, thigh, -1);
  const lf = ik(hip[1], spec.feet[1], thigh, thigh, -1);
  const shOff = m.sw - 0.45 * s;
  const sh: [Pt, Pt] = [
    add(N, -ax.x * shOff * 0.4 + ay.x * 0.6 * s, -ax.y * shOff * 0.4 + ay.y * 0.6 * s),
    add(N, ax.x * shOff * 0.6 + ay.x * 0.6 * s, ax.y * shOff * 0.6 + ay.y * 0.6 * s),
  ];
  const ab = ik(sh[0], spec.hands[0], 2.9 * s, 2.7 * s, 1);
  const af = ik(sh[1], spec.hands[1], 2.9 * s, 2.7 * s, 1);
  const hd = m.neckGap + m.headR;
  const hl = lean * 0.5;
  const head: Pt = { x: N.x + Math.sin(hl) * hd, y: N.y - Math.cos(hl) * hd };
  sk = finish({
    pose: 'sit',
    m,
    lie: false,
    N,
    P,
    ax,
    ay,
    lean,
    head,
    headRot: 0,
    headTop: { x: head.x, y: head.y - m.headR },
    sh,
    el: [ab[0], af[0]],
    hd: [ab[1], af[1]],
    hip,
    kn: [lb[0], lf[0]],
    ft: [lb[1], lf[1]],
    farArmOver: true,
    shadow: [0, 0, 0],
    feetUp: false,
  });
  cache.set(ck, sk);
  return sk;
}
