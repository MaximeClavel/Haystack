// Objets posés : mobilier urbain, marché, port, nature, animaux, objets d'enquête.
// Repère local : ancre au sol (milieu de la base) ; objets « à plat » (FLAT_PROPS) centrés.
// Dessin face à droite, miroir pour facing = 'left' ; échelle e.scale.

import type { PropEntity, PropKind } from '../types';
import { FLAT_PROPS, PROP_SIZE } from './bounds';
import { drawBox, drawCake, drawJewel, drawMoneybag, drawNeedle, drawPaintingFrame } from './held';
import type { Lod } from './lod';
import { COLOR_DARK, COLOR_HEX, COLOR_LIGHT, INK, MAT, mix } from './palette';
import { drawBronzeFigure } from './person';
import { fitTextUpright } from './text';
import { TAU, type Ctx, boxFS, circleFS, ellipseFS, groundShadow, inkedStroke, line, polyFS, quickRand, rboxFS, seedOf } from './util';

interface P {
  ctx: Ctx;
  e: PropEntity;
  lod: Lod;
  fine: boolean;
  dir: number;
  /** Couleur principale (e.color ou défaut). */
  c: (def: string) => string;
  cd: (def: string) => string;
  seed: number;
  /** Épaisseur de contour (corrigée de l'échelle). */
  ol: number;
  /** Ombre au sol, hauteur bornée pour rester dans l'emprise quelle que soit l'échelle. */
  sh: (x: number, y: number, rx: number, ry: number) => void;
}

/** Couleur par défaut de quelques objets en vue d'ensemble (niveau 2). */
const LOD2_COLOR: Partial<Record<PropKind, string>> = {
  bush: MAT.foliage,
  flowerbed: '#d77a6a',
  fountain: '#cfc6b4',
  bandstand: '#5f9178',
  stall: '#cc4238',
  crane: '#e8a33a',
  scaffold: '#9aa0a4',
  tent: '#ec8b2f',
  playground: '#cc4238',
  kiosk: '#3f6b52',
  busstop: '#7f9fae',
  statue: '#5f8f74',
  puddle: '#a7cad6',
  phonebooth: '#3d4d63',
};

export function drawProp(ctx: Ctx, e: PropEntity, lod: Lod): void {
  const s = e.scale ?? 1;
  const [w0, h0] = PROP_SIZE[e.prop];
  const x = e.x;
  const y = e.y - (e.z ?? 0);
  const flat = FLAT_PROPS.has(e.prop);
  if (lod === 2) {
    // silhouettes : seuls les objets assez grands sont dessinés
    if (w0 * s < 9 && h0 * s < 12) return;
    ctx.fillStyle = e.color ? COLOR_HEX[e.color] : (LOD2_COLOR[e.prop] ?? '#8f8578');
    const w = w0 * s;
    const h = h0 * s;
    if (flat) ctx.fillRect(x - w / 2, y - h / 2, w, h);
    else ctx.fillRect(x - w * 0.4, y - h, w * 0.8, h);
    return;
  }
  const dir = e.facing === 'left' ? -1 : 1;
  const fine = lod === 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  const ol = (fine ? 0.6 : 0.9) / Math.max(0.5, s);
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = ol;
  const col = e.color;
  const p: P = {
    ctx,
    e,
    lod,
    fine,
    dir,
    c: (def) => (col ? COLOR_HEX[col] : def),
    cd: (def) => (col ? COLOR_DARK[col] : mix(def, INK, 0.28)),
    seed: seedOf(e.id),
    ol,
    sh: (sx, sy, rx, ry) => groundShadow(ctx, sx, sy, rx, Math.min(ry, 2.4 / s)),
  };
  const fn = DRAW[e.prop];
  fn(p);
  // étiquette générique (au-dessus de l'objet) sauf pour les objets qui l'intègrent
  if (e.label && !LABEL_INSIDE.has(e.prop) && fine) {
    const top = flat ? -h0 / 2 : -h0;
    // la marge de l'emprise est fixe (3 u, +4 u au-dessus pour l'étiquette) : on raisonne en unités monde
    fitTextUpright(ctx, dir, e.label, 0, top - 2.6 / s, w0 + 4.6 / s, 2.6 / s, INK);
  }
  ctx.restore();
}

const LABEL_INSIDE = new Set<PropKind>(['sign', 'stall', 'kiosk', 'busstop', 'phonebooth']);

/* ----------------------------------------------------------------------------
 * Dessins (repère local, unités nominales — voir PROP_SIZE)
 * ------------------------------------------------------------------------- */

const IRON = '#3d5245';

const DRAW: Record<PropKind, (p: P) => void> = {
  bench(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 11, 1.4);
    const wood = p.c(MAT.wood);
    const woodD = p.cd(MAT.wood);
    // pieds et accoudoirs (fonte)
    ctx.strokeStyle = IRON;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(-9, -9.4);
    ctx.moveTo(9, 0);
    ctx.lineTo(9, -9.4);
    ctx.moveTo(-10, -5.6);
    ctx.lineTo(-10.4, -7.4);
    ctx.moveTo(10, -5.6);
    ctx.lineTo(10.4, -7.4);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
    // dossier
    boxFS(ctx, -10.6, -9.6, 21.2, 1.6, wood);
    boxFS(ctx, -10.6, -7.4, 21.2, 1.4, wood);
    if (p.e.variant === 'broken') {
      // assise cassée : la moitié gauche a basculé
      polyFS(ctx, [-10.4, -1.2, -1.2, -4.8, -1.4, -3.4, -10.6, 0.2], woodD);
      boxFS(ctx, -0.6, -5.4, 11.2, 1.8, wood);
      ctx.lineWidth = 0.35;
      line(ctx, -0.6, -5.4, -1.6, -4.2);
      line(ctx, -1.6, -4.2, -0.4, -3.6);
      ctx.lineWidth = p.ol;
    } else {
      boxFS(ctx, -10.8, -5.6, 21.6, 1.9, wood);
      if (fine) {
        ctx.fillStyle = woodD;
        ctx.fillRect(-10.8, -3.9, 21.6, 0.5);
      }
    }
  },

  lamp(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 3, 0.9);
    const iron = p.c(IRON);
    boxFS(ctx, -1.7, -2.4, 3.4, 2.4, iron);
    inkedStroke(ctx, [0, -2.4, 0, -27], 0.9, iron, p.ol);
    // lanterne
    polyFS(ctx, [-2.6, -27, 2.6, -27, 1.8, -32, -1.8, -32], MAT.lamp);
    polyFS(ctx, [-2.9, -32, 2.9, -32, 0.8, -33.8, -0.8, -33.8], iron);
    boxFS(ctx, -2.8, -27.6, 5.6, 1.0, iron);
    if (fine) {
      ctx.lineWidth = 0.25;
      line(ctx, 0, -27, 0, -32);
      ctx.lineWidth = p.ol;
    }
  },

  bin(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 3.6, 0.9);
    const c = p.c('#4f7a52');
    polyFS(ctx, [-3.2, -7.6, 3.2, -7.6, 2.7, 0, -2.7, 0], c);
    rboxFS(ctx, -3.6, -8.8, 7.2, 1.5, 0.5, p.cd('#4f7a52'));
    if (fine) {
      ctx.lineWidth = 0.28;
      ctx.beginPath();
      for (const x0 of [-1.4, 0, 1.4]) {
        ctx.moveTo(x0, -6.8);
        ctx.lineTo(x0 * 0.9, -0.8);
      }
      ctx.stroke();
      ctx.lineWidth = p.ol;
    }
  },

  mailbox(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 2.6, 0.8);
    boxFS(ctx, -0.7, -5, 1.4, 5, '#4a4442');
    const c = p.c('#f0c23a');
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-3.4, -4.6);
    ctx.lineTo(-3.4, -9.4);
    ctx.quadraticCurveTo(-3.4, -11, 0, -11);
    ctx.quadraticCurveTo(3.4, -11, 3.4, -9.4);
    ctx.lineTo(3.4, -4.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.fillRect(-2, -8.8, 4, 0.6);
    if (fine) {
      ctx.strokeStyle = '#2f5f9f';
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.moveTo(-1.2, -6.4);
      ctx.quadraticCurveTo(0, -7.4, 1.2, -6.4);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = p.ol;
    }
  },

  hydrant(p) {
    const { ctx } = p;
    p.sh(0, 0, 2.4, 0.7);
    const c = p.c(MAT.red);
    boxFS(ctx, -2.2, -1.0, 4.4, 1.0, p.cd(MAT.red));
    rboxFS(ctx, -1.5, -5.4, 3.0, 4.6, 0.4, c);
    boxFS(ctx, -2.5, -4.2, 5.0, 1.2, c);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, -5.4, 1.5, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    circleFS(ctx, 0, -6.9, 0.45, p.cd(MAT.red));
  },

  phonebooth(p) {
    const { ctx, fine } = p;
    p.sh(0.5, 0, 6.5, 1.3);
    const c = p.c('#3d4d63');
    boxFS(ctx, -6, -27, 12, 27, c);
    // vitres
    ctx.fillStyle = MAT.glass;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-4.6, -22.6, 9.2, 20.6);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 0.4;
    ctx.strokeRect(-4.6, -22.6, 9.2, 20.6);
    if (fine) {
      line(ctx, -4.6, -15.6, 4.6, -15.6);
      line(ctx, -4.6, -8.6, 4.6, -8.6);
      // téléphone
      boxFS(ctx, -1.4, -18, 2.8, 3.2, '#2c2a2a');
    }
    ctx.lineWidth = p.ol;
    rboxFS(ctx, -6.6, -30, 13.2, 3.4, 0.8, c);
    fitTextUpright(ctx, p.dir, p.e.label ?? 'TÉLÉPHONE', 0, -25, 10, 1.6, '#f7f0dd');
  },

  kiosk(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 12.5, 1.6);
    const c = p.c('#3f6b52');
    const cd = p.cd('#3f6b52');
    boxFS(ctx, -11.5, -18, 23, 18, c);
    // ouverture avec journaux
    boxFS(ctx, -9, -15.5, 18, 9, '#f2ead6');
    const rnd = quickRand(p.seed);
    const papers = ['#cc4238', '#f0cb3f', '#4b92dc', '#f6f3ea', '#3f9e55', '#f19bb8'];
    for (let i = 0; i < 6; i++) {
      const px = -8.4 + i * 2.9;
      ctx.fillStyle = papers[Math.floor(rnd() * papers.length)];
      ctx.fillRect(px, -14.6 + (i % 2) * 0.6, 2.4, 3.4);
      if (fine) {
        ctx.fillStyle = INK;
        ctx.fillRect(px + 0.3, -14.1 + (i % 2) * 0.6, 1.8, 0.4);
      }
    }
    ctx.fillStyle = cd;
    ctx.fillRect(-9, -9.6, 18, 1.2);
    // toit en dôme
    ctx.fillStyle = cd;
    ctx.beginPath();
    ctx.moveTo(-13, -18);
    ctx.quadraticCurveTo(-12, -24.5, 0, -25.5);
    ctx.quadraticCurveTo(12, -24.5, 13, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    boxFS(ctx, -13, -19.4, 26, 1.8, c);
    circleFS(ctx, 0, -26.6, 1.1, MAT.gold);
    if (p.e.label) fitTextUpright(ctx, p.dir, p.e.label, 0, -4, 20, 3, '#f7f0dd');
    else if (fine) fitTextUpright(ctx, p.dir, 'JOURNAUX', 0, -4, 18, 2.6, '#f7f0dd');
  },

  busstop(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 12.5, 1.4);
    // vitre du fond
    ctx.fillStyle = 'rgba(169, 196, 207, 0.75)';
    ctx.fillRect(-11.5, -19.5, 21, 17.5);
    ctx.lineWidth = 0.4;
    ctx.strokeRect(-11.5, -19.5, 21, 17.5);
    ctx.lineWidth = p.ol;
    // banc
    boxFS(ctx, -9.5, -6.2, 15, 1.4, MAT.wood);
    // montants et toit
    inkedStroke(ctx, [-11.5, 0, -11.5, -20], 0.8, '#59606a', p.ol);
    inkedStroke(ctx, [9.5, 0, 9.5, -20], 0.8, '#59606a', p.ol);
    rboxFS(ctx, -13, -22.2, 24, 2.4, 0.6, '#59606a');
    // poteau et panneau
    inkedStroke(ctx, [11.8, 0, 11.8, -18], 0.6, '#59606a', p.ol);
    circleFS(ctx, 11.8, -19.6, 2.4, '#2f5f9f');
    fitTextUpright(ctx, p.dir, 'BUS', 11.8, -19.6, 3.6, 1.8, '#ffffff');
    if (fine) {
      // affiche publicitaire
      boxFS(ctx, -9, -17.5, 5.5, 8.5, '#f3c96a');
      ctx.fillStyle = '#cc4238';
      ctx.beginPath();
      ctx.arc(-6.25, -14.2, 1.6, 0, TAU);
      ctx.fill();
    }
    if (p.e.label) fitTextUpright(ctx, p.dir, p.e.label, -1, -21, 18, 1.8, '#f7f0dd');
  },

  sign(p) {
    const { ctx } = p;
    p.sh(0, 0, 2.4, 0.7);
    inkedStroke(ctx, [0, 0, 0, -13], 0.8, '#59606a', p.ol);
    const c = p.c('#2f5f9f');
    rboxFS(ctx, -6, -22, 12, 9, 0.8, c);
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = '#f7f0dd';
    ctx.strokeRect(-5.2, -21.2, 10.4, 7.4);
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
    const light = p.e.color && ['white', 'yellow', 'beige', 'pink'].includes(p.e.color);
    if (p.e.label) fitTextUpright(ctx, p.dir, p.e.label, 0, -17.5, 9.6, 4.2, light ? INK : '#f7f0dd');
  },

  cone(p) {
    const { ctx } = p;
    p.sh(0, 0, 2.6, 0.7);
    boxFS(ctx, -2.5, -1, 5, 1, p.cd('#ec8b2f'));
    polyFS(ctx, [-1.9, -1, 1.9, -1, 0.4, -7, -0.4, -7], p.c('#ec8b2f'));
    ctx.fillStyle = '#fbf6ea';
    ctx.fillRect(-1.25, -4.4, 2.5, 1.2);
  },

  barrier(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 10, 1);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const x0 of [-8, 8]) {
      ctx.moveTo(x0 - 1.8, 0);
      ctx.lineTo(x0, -6);
      ctx.lineTo(x0 + 1.8, 0);
    }
    ctx.stroke();
    ctx.lineWidth = p.ol;
    boxFS(ctx, -10.5, -8.4, 21, 2.8, '#fbf6ea');
    ctx.fillStyle = p.c(MAT.red);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const x0 = -10.5 + i * 3.6;
      ctx.moveTo(x0, -5.6);
      ctx.lineTo(x0 + 1.8, -8.4);
      ctx.lineTo(x0 + 3.6, -8.4);
      ctx.lineTo(x0 + 1.8, -5.6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeRect(-10.5, -8.4, 21, 2.8);
    if (fine) circleFS(ctx, -10.5, -9, 0.6, '#f0a030');
  },

  manhole(p) {
    const { ctx, fine } = p;
    if (p.e.variant === 'open') {
      ellipseFS(ctx, -2, 0, 3.8, 1.9, '#1d1a19');
      ellipseFS(ctx, 3.2, 0.6, 3.6, 1.8, '#5a5754');
      return;
    }
    ellipseFS(ctx, 0, 0, 5.6, 2.7, '#5a5754');
    if (fine) {
      ctx.strokeStyle = '#3a3836';
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(i * 1.8 - 0.7, -1.8);
        ctx.lineTo(i * 1.8 + 0.7, 1.8);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = p.ol;
    }
  },

  fountain(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 30, 2.4);
    // bassin : paroi avant + margelle
    boxFS(ctx, -29, -9, 58, 9, MAT.stone);
    ellipseFS(ctx, 0, -9, 29.5, 8.4, MAT.stoneLight);
    ellipseFS(ctx, 0, -9, 26.5, 6.6, MAT.water);
    if (fine) {
      ctx.strokeStyle = MAT.waterLight;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (const [cx, cy, r] of [
        [-12, -9, 3],
        [10, -7.5, 4],
        [0, -12, 2.5],
        [18, -10.5, 2],
      ]) {
        ctx.moveTo(cx + r, cy);
        ctx.ellipse(cx, cy, r, r * 0.3, 0, 0, TAU);
      }
      ctx.stroke();
      ctx.strokeStyle = MAT.stoneDark;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (let x0 = -24; x0 <= 24; x0 += 8) {
        ctx.moveTo(x0, -2);
        ctx.lineTo(x0, -0.2);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = p.ol;
    }
    // colonne et vasque
    boxFS(ctx, -2.6, -24, 5.2, 15.5, MAT.stone);
    ellipseFS(ctx, 0, -24.5, 8.5, 2.4, MAT.stoneLight);
    ellipseFS(ctx, 0, -24.8, 6.8, 1.6, MAT.water);
    boxFS(ctx, -1.2, -30, 2.4, 5.5, MAT.stone);
    // jets d'eau
    ctx.strokeStyle = '#d6ecf3';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(0, -34.5);
    ctx.moveTo(-6.5, -24.5);
    ctx.quadraticCurveTo(-11, -22, -12, -11);
    ctx.moveTo(6.5, -24.5);
    ctx.quadraticCurveTo(11, -22, 12, -11);
    ctx.moveTo(0, -34.5);
    ctx.quadraticCurveTo(-3, -34, -4.2, -26);
    ctx.moveTo(0, -34.5);
    ctx.quadraticCurveTo(3, -34, 4.2, -26);
    ctx.stroke();
    ctx.strokeStyle = '#88b9cb';
    ctx.lineWidth = 0.3;
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
  },

  statue(p) {
    if (p.e.variant === 'angel') return drawAngel(p);
    if (p.e.variant === 'sculpture') return drawSculpture(p);
    const { ctx, fine } = p;
    p.sh(0, 0, 8, 1.4);
    // socle
    boxFS(ctx, -7.5, -3, 15, 3, MAT.stoneDark);
    boxFS(ctx, -6, -16, 12, 13, MAT.stone);
    boxFS(ctx, -7, -17.5, 14, 1.8, MAT.stoneLight);
    if (fine) {
      boxFS(ctx, -3.5, -11.5, 7, 4, MAT.gold);
      ctx.fillStyle = MAT.goldDark;
      ctx.fillRect(-2.6, -10.2, 5.2, 0.4);
      ctx.fillRect(-2.6, -9.2, 4, 0.4);
    }
    // personnage en bronze (vert-de-gris), le bras levé
    ctx.save();
    ctx.translate(0, -17.5);
    ctx.scale(1.04, 1.04);
    drawBronzeFigure(ctx, 'wave', p.lod);
    ctx.restore();
    ctx.lineWidth = p.ol;
  },

  bandstand(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 40, 3);
    // socle (plate-forme octogonale)
    boxFS(ctx, -38, -9, 76, 9, MAT.stone);
    ellipseFS(ctx, 0, -9, 38.5, 7.5, '#d8cdb6');
    if (fine) {
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (let x0 = -30; x0 <= 30; x0 += 10) {
        ctx.moveTo(x0, -8.5);
        ctx.lineTo(x0, -0.3);
      }
      ctx.stroke();
      ctx.lineWidth = p.ol;
    }
    // garde-corps
    ctx.strokeStyle = IRON;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-35, -13);
    ctx.quadraticCurveTo(0, -9.5, 35, -13);
    ctx.stroke();
    // colonnes
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const x0 of [-34, -20, -7, 7, 20, 34]) {
      ctx.moveTo(x0, -9.5 - Math.abs(x0) * -0.0);
      ctx.lineTo(x0, -42);
    }
    ctx.stroke();
    ctx.strokeStyle = '#f2eee2';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
    // toit
    const roof = p.c('#5f9178');
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(-40, -41);
    ctx.quadraticCurveTo(-20, -46, -4, -56);
    ctx.lineTo(4, -56);
    ctx.quadraticCurveTo(20, -46, 40, -41);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // lambrequin festonné
    ctx.fillStyle = '#f2eee2';
    ctx.beginPath();
    ctx.moveTo(-40, -41);
    ctx.lineTo(40, -41);
    for (let i = 10; i > 0; i--) {
      const x0 = -40 + i * 8;
      ctx.quadraticCurveTo(x0 - 4, -36.5, x0 - 8, -39.5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = mix(roof, INK, 0.3);
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      for (const x0 of [-24, -12, 0, 12, 24]) {
        ctx.moveTo(x0, -42.5);
        ctx.lineTo(x0 * 0.12, -55.5);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = p.ol;
    }
    polyFS(ctx, [-1.2, -56, 1.2, -56, 0, -59.5], MAT.gold);
  },

  stall(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 17, 1.6);
    const c = p.c(MAT.red);
    // poteaux
    inkedStroke(ctx, [-15.5, 0, -15.5, -21], 0.7, MAT.woodDark, p.ol);
    inkedStroke(ctx, [15.5, 0, 15.5, -21], 0.7, MAT.woodDark, p.ol);
    // comptoir
    boxFS(ctx, -15, -10, 30, 10, MAT.wood);
    if (fine) {
      ctx.lineWidth = 0.3;
      line(ctx, -15, -5, 15, -5);
      ctx.lineWidth = p.ol;
    }
    // marchandises (fruits et légumes)
    const rnd = quickRand(p.seed);
    const goods = ['#d23b3b', '#ec8b2f', '#7fae3a', '#f0cb3f', '#8d55ad', '#3f9e55'];
    for (let k = 0; k < 4; k++) {
      boxFS(ctx, -14 + k * 7.2, -12.6, 6.4, 2.8, MAT.cardboard);
      ctx.fillStyle = goods[Math.floor(rnd() * goods.length)];
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const gx = -13 + k * 7.2 + i * 1.5;
        ctx.moveTo(gx + 0.8, -13);
        ctx.arc(gx + 0.1, -13, 0.8, 0, TAU);
      }
      ctx.fill();
      if (fine) {
        ctx.lineWidth = 0.25;
        ctx.stroke();
        ctx.lineWidth = p.ol;
      }
    }
    // auvent rayé
    awningShape(ctx, -17, 17, -24, 5, c, '#fbf6ea', fine);
    if (p.e.label) fitTextUpright(ctx, p.dir, p.e.label, 0, -5, 26, 3.2, '#fbf6ea');
  },

  parasol(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 8, 1.2);
    boxFS(ctx, -2, -1, 4, 1, '#59606a');
    inkedStroke(ctx, [0, -1, 0, -19], 0.5, '#e8e2d2', p.ol);
    const c = p.c(MAT.red);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a0 = -10 + (20 * i) / n;
      const a1 = -10 + (20 * (i + 1)) / n;
      ctx.fillStyle = i % 2 === 0 ? c : '#fbf6ea';
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(a0, -16.5);
      ctx.quadraticCurveTo((a0 + a1) / 2, -15.2, a1, -16.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-10, -16.5);
    for (let i = 0; i < n; i++) {
      const a0 = -10 + (20 * i) / n;
      const a1 = -10 + (20 * (i + 1)) / n;
      ctx.quadraticCurveTo((a0 + a1) / 2, -15.2, a1, -16.5);
    }
    ctx.closePath();
    ctx.stroke();
    if (fine) circleFS(ctx, 0, -22.3, 0.5, '#e8e2d2');
  },

  table(p) {
    const { ctx } = p;
    p.sh(0, 0, 4, 0.9);
    ellipseFS(ctx, 0, -0.3, 2.6, 0.7, '#59606a');
    inkedStroke(ctx, [0, -0.5, 0, -6.6], 0.6, '#59606a', p.ol);
    ellipseFS(ctx, 0, -6.8, 5.6, 1.4, p.c('#f2eee2'));
  },

  chair(p) {
    const { ctx } = p;
    p.sh(0, 0, 2.6, 0.7);
    const c = p.c('#b07a45');
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-2.2, 0);
    ctx.lineTo(-2, -4.2);
    ctx.moveTo(2.2, 0);
    ctx.lineTo(2.0, -4.2);
    ctx.moveTo(-2.1, -4.4);
    ctx.lineTo(-2.4, -8.6);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
    rboxFS(ctx, -2.8, -4.9, 5.6, 1.0, 0.4, c);
    rboxFS(ctx, -2.9, -8.8, 1.1, 4.2, 0.4, c);
  },

  cart(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 9.5, 1.2);
    const c = p.c(MAT.wood);
    // brancards
    inkedStroke(ctx, [4, -8.5, 9.6, -6.2], 0.6, MAT.woodDark, p.ol);
    inkedStroke(ctx, [-7, -6, -8.6, 0], 0.6, MAT.woodDark, p.ol);
    boxFS(ctx, -9, -12.5, 14, 6, c);
    if (fine) {
      ctx.lineWidth = 0.3;
      line(ctx, -9, -10.5, 5, -10.5);
      line(ctx, -9, -8.5, 5, -8.5);
      ctx.lineWidth = p.ol;
    }
    // chargement
    boxFS(ctx, -7.5, -14, 5, 2, MAT.cardboard);
    circleFS(ctx, 0, -13.4, 1.2, '#d23b3b');
    circleFS(ctx, 2.2, -13.6, 1.1, '#ec8b2f');
    // roue
    circleFS(ctx, -1, -4.2, 4.0, MAT.woodDark);
    circleFS(ctx, -1, -4.2, 2.6, MAT.wood);
    if (fine) {
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI;
        ctx.moveTo(-1 + Math.cos(a) * 2.6, -4.2 + Math.sin(a) * 2.6);
        ctx.lineTo(-1 - Math.cos(a) * 2.6, -4.2 - Math.sin(a) * 2.6);
      }
      ctx.stroke();
      ctx.lineWidth = p.ol;
    }
    circleFS(ctx, -1, -4.2, 0.7, MAT.metalDark);
  },

  crate(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 5.6, 1);
    const c = p.c(MAT.woodLight);
    boxFS(ctx, -5, -10, 10, 10, c);
    if (fine) {
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(-5, -6.7);
      ctx.lineTo(5, -6.7);
      ctx.moveTo(-5, -3.4);
      ctx.lineTo(5, -3.4);
      ctx.stroke();
      ctx.lineWidth = p.ol;
    }
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = MAT.woodDark;
    ctx.beginPath();
    ctx.moveTo(-4.4, -9.4);
    ctx.lineTo(4.4, -0.6);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
    ctx.strokeRect(-5, -10, 10, 10);
  },

  barrel(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 4.4, 0.9);
    const c = p.c(MAT.wood);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-3.2, 0);
    ctx.quadraticCurveTo(-4.6, -5.5, -3.2, -11);
    ctx.lineTo(3.2, -11);
    ctx.quadraticCurveTo(4.6, -5.5, 3.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#4a4442';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-3.9, -2.4);
    ctx.lineTo(3.9, -2.4);
    ctx.moveTo(-3.9, -8.6);
    ctx.lineTo(3.9, -8.6);
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = p.cd(MAT.wood);
      ctx.lineWidth = 0.25;
      ctx.beginPath();
      ctx.moveTo(-1.4, -10.6);
      ctx.quadraticCurveTo(-2, -5.5, -1.4, -0.4);
      ctx.moveTo(1.4, -10.6);
      ctx.quadraticCurveTo(2, -5.5, 1.4, -0.4);
      ctx.stroke();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
    ellipseFS(ctx, 0, -11, 3.2, 0.8, mix(c, '#ffffff', 0.15));
  },

  pallet(p) {
    // palette vue de côté : deux plateaux de planches sur trois dés, vides sombres entre eux
    const { ctx, fine } = p;
    const c = p.c(MAT.woodLight);
    const cd = p.cd(MAT.woodLight);
    ctx.fillStyle = 'rgba(47, 38, 34, 0.55)';
    ctx.fillRect(-6.6, -1.2, 13.2, 2.4);
    boxFS(ctx, -7, -2, 14, 0.95, c);
    boxFS(ctx, -7, 1.05, 14, 0.95, c);
    for (const x0 of [-7, -1, 5]) boxFS(ctx, x0, -1.05, 2, 2.1, cd);
    if (fine) {
      ctx.lineWidth = 0.22;
      ctx.beginPath();
      for (const x0 of [-3.6, 0, 3.6]) {
        ctx.moveTo(x0, -2);
        ctx.lineTo(x0, -1.05);
      }
      ctx.stroke();
      ctx.lineWidth = p.ol;
    }
  },

  crane(p) {
    const { ctx, fine } = p;
    const c = p.c('#e8a33a');
    const cd = p.cd('#e8a33a');
    p.sh(-14, 0, 18, 2);
    // pieds / portique
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(-18, -20);
    ctx.moveTo(-4, 0);
    ctx.lineTo(-12, -20);
    ctx.stroke();
    ctx.strokeStyle = cd;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // tour en treillis
    const tx0 = -19;
    const tx1 = -11;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx0, -20);
    ctx.lineTo(tx0, -100);
    ctx.moveTo(tx1, -20);
    ctx.lineTo(tx1, -100);
    ctx.stroke();
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.lineWidth = 0.4;
    ctx.strokeStyle = fine ? c : cd;
    ctx.beginPath();
    for (let yy = -20; yy > -100; yy -= 8) {
      ctx.moveTo(tx0, yy);
      ctx.lineTo(tx1, yy - 8);
      ctx.moveTo(tx0, yy - 8);
      ctx.lineTo(tx1, yy - 8);
    }
    ctx.stroke();
    // cabine
    boxFS(ctx, -24, -98, 10, 8, c);
    boxFS(ctx, -22, -96.6, 6, 4, MAT.glass);
    // flèche et contre-flèche
    polyFS(ctx, [-30, -104, 33, -104, 33, -101.4, -30, -101.4], c);
    if (fine) {
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      for (let xx = -26; xx < 33; xx += 6) {
        ctx.moveTo(xx, -101.4);
        ctx.lineTo(xx + 3, -104);
        ctx.lineTo(xx + 6, -101.4);
      }
      ctx.stroke();
    }
    // haubans, contrepoids
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(-15, -116);
    ctx.lineTo(33, -104);
    ctx.moveTo(-15, -116);
    ctx.lineTo(-30, -104);
    ctx.stroke();
    ctx.lineWidth = p.ol;
    polyFS(ctx, [-17, -104, -13, -104, -15, -117], c);
    boxFS(ctx, -32, -101.4, 7, 6, '#7a7f83');
    // câble et crochet avec charge
    line(ctx, 26, -101.4, 26, -46);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(26, -44.6, 1.4, -Math.PI / 2, Math.PI);
    ctx.stroke();
    ctx.lineWidth = p.ol;
    drawBox(ctx, 20, -42, 12, 9, p.lod);
    line(ctx, 26, -45, 21, -42);
    line(ctx, 26, -45, 31, -42);
  },

  scaffold(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 29, 2);
    const tube = '#8b9196';
    // filet de sécurité partiel
    ctx.fillStyle = 'rgba(80, 150, 90, 0.35)';
    ctx.fillRect(-28, -88, 26, 40);
    // planchers
    for (let lv = 0; lv < 6; lv++) {
      const yy = -14 - lv * 15;
      boxFS(ctx, -29.5, yy, 59, 1.8, MAT.woodLight);
    }
    // montants
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const xx of [-28, -9.5, 9.5, 28]) {
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx, -89);
    }
    ctx.stroke();
    ctx.strokeStyle = tube;
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // traverses et diagonales
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    for (let lv = 0; lv < 6; lv++) {
      const yy = -6.5 - lv * 15;
      ctx.moveTo(-28, yy);
      ctx.lineTo(28, yy);
      if (fine) {
        const xa = lv % 2 === 0 ? -28 : -9.5;
        ctx.moveTo(xa, yy + 6.5);
        ctx.lineTo(xa + 18.5, yy - 7.5);
      }
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
  },

  tent(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 15, 1.6);
    const c = p.c('#ec8b2f');
    const cd = p.cd('#ec8b2f');
    polyFS(ctx, [-14.5, 0, 0, -21, 14.5, 0], c);
    polyFS(ctx, [-4.5, 0, 0, -13, 4.5, 0], '#3a302c');
    if (fine) {
      polyFS(ctx, [0, -13, 4.5, 0, 6.5, 0, 0.6, -14], cd);
      ctx.lineWidth = 0.25;
      line(ctx, 0, -21, -15, -2);
      line(ctx, 0, -21, 15, -2);
      ctx.lineWidth = p.ol;
    }
    line(ctx, 0, -21, 0, -22);
  },

  playground(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 24, 2);
    // toboggan (à gauche)
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-22, -18);
    ctx.moveTo(-15, 0);
    ctx.lineTo(-15, -18);
    ctx.stroke();
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    for (let yy = -3; yy > -18; yy -= 3.5) {
      ctx.moveTo(-22, yy);
      ctx.lineTo(-15, yy);
    }
    ctx.stroke();
    ctx.lineWidth = p.ol;
    boxFS(ctx, -23, -19.5, 9, 2, '#4b92dc');
    polyFS(ctx, [-15, -19, -12.6, -19, -2, -1.2, -2.2, 0.4, -4.4, 0.4], p.c('#cc4238'));
    // portique de balançoire (à droite)
    ctx.strokeStyle = '#4b92dc';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(8, -24);
    ctx.lineTo(12, 0);
    ctx.moveTo(18, 0);
    ctx.lineTo(22, -24);
    ctx.lineTo(25, 0);
    ctx.moveTo(8, -24);
    ctx.lineTo(22, -24);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(13, -24);
    ctx.lineTo(13, -8);
    ctx.moveTo(17, -24);
    ctx.lineTo(17, -8);
    ctx.stroke();
    ctx.lineWidth = p.ol;
    boxFS(ctx, 12, -8, 6, 1.2, '#f0cb3f');
    if (fine) {
      ctx.fillStyle = '#e8d9b0';
      ctx.beginPath();
      ctx.ellipse(15, 0.2, 5, 1.2, 0, 0, TAU);
      ctx.fill();
    }
  },

  bush(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 7.5, 1.3);
    const c = p.c(MAT.foliage);
    const rnd = quickRand(p.seed);
    ctx.fillStyle = c;
    ctx.beginPath();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / (n - 1)) * Math.PI;
      ctx.arc(Math.cos(a) * 5.4, -4.6 + Math.sin(a) * 4.4, 2.5 + rnd() * 0.4, a - 1.3, a + 1.3);
    }
    ctx.lineTo(6.6, 0);
    ctx.lineTo(-6.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = col2(p, MAT.foliageLight);
    ctx.beginPath();
    ctx.ellipse(-2.2, -6.6, 2.6, 1.6, -0.3, 0, TAU);
    ctx.fill();
    if (fine && p.seed % 3 === 0) {
      ctx.fillStyle = ['#f19bb8', '#fbf6ea', '#f0cb3f'][p.seed % 3 === 0 ? (p.seed >> 3) % 3 : 0];
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const fx = (rnd() - 0.5) * 10;
        const fy = -2 - rnd() * 6;
        ctx.moveTo(fx + 0.55, fy);
        ctx.arc(fx, fy, 0.55, 0, TAU);
      }
      ctx.fill();
    }
  },

  flowerbed(p) {
    if (p.e.variant === 'vegetables') return drawVegetables(p);
    const { ctx, fine } = p;
    rboxFS(ctx, -12, -5.5, 24, 5.5, 1.5, '#8a6a4e');
    const rnd = quickRand(p.seed);
    const cols = p.e.color ? [COLOR_HEX[p.e.color], COLOR_LIGHT[p.e.color]] : ['#e2463d', '#f0cb3f', '#f19bb8', '#8d55ad', '#fbf6ea'];
    ctx.fillStyle = MAT.foliageDark;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const fx = -10.5 + i * 2.6;
      ctx.moveTo(fx + 1.4, -4.4);
      ctx.ellipse(fx, -4.4, 1.4, 1.0, 0, 0, TAU);
    }
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = cols[i % cols.length];
      const fx = -10.6 + i * 1.95 + rnd() * 0.6;
      const fy = -5.6 - rnd() * 1.8;
      ctx.beginPath();
      ctx.arc(fx, fy, 0.85, 0, TAU);
      ctx.fill();
      if (fine) {
        ctx.lineWidth = 0.2;
        ctx.stroke();
        ctx.lineWidth = p.ol;
      }
    }
  },

  rock(p) {
    if (p.e.variant === 'tombstone') return drawTombstone(p);
    const { ctx } = p;
    p.sh(0, 0, 5, 1);
    polyFS(ctx, [-4.8, 0, -4.2, -4.4, -1.2, -6.8, 2.8, -6.2, 4.8, -2.6, 4.4, 0], p.c('#a39f98'));
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(-3.4, -4.2);
    ctx.lineTo(-1.0, -6.0);
    ctx.lineTo(1.2, -5.6);
    ctx.lineTo(-1.6, -3.8);
    ctx.closePath();
    ctx.fill();
  },

  puddle(p) {
    const { ctx, fine } = p;
    ctx.fillStyle = 'rgba(140, 185, 205, 0.75)';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 7, 2.4, 0, 0, TAU);
    ctx.ellipse(4.5, 0.6, 4, 1.8, 0, 0, TAU);
    ctx.fill();
    if (fine) {
      ctx.strokeStyle = '#e8f4f8';
      ctx.lineWidth = 0.4;
      line(ctx, -5, -0.6, -1, -0.9);
      line(ctx, 3, 0.2, 6, 0);
      ctx.strokeStyle = INK;
      ctx.lineWidth = p.ol;
    }
  },

  dog(p) {
    const { ctx, fine } = p;
    const big = p.e.variant === 'big';
    const small = p.e.variant === 'small';
    const k = big ? 1.0 : small ? 0.62 : 0.8;
    p.sh(0, 0, 7 * k, 1.1);
    const c = p.c('#9a6a43');
    const cd = p.cd('#9a6a43');
    ctx.save();
    ctx.scale(k, k);
    ctx.translate(-0.9, 0);
    // pattes arrière
    inkedStroke(ctx, [-4.6, -5, -5.4, -0.5], 1.3, cd, p.ol);
    inkedStroke(ctx, [4.0, -5, 4.2, -0.5], 1.3, cd, p.ol);
    // queue
    inkedStroke(ctx, [-6.4, -7.4, -8.2, -10.4], 0.9, c, p.ol);
    // corps
    ellipseFS(ctx, -0.6, -7.2, 6.4, 3.0, c);
    // pattes avant
    inkedStroke(ctx, [-3.4, -5, -3.6, -0.4], 1.4, c, p.ol);
    inkedStroke(ctx, [5.0, -5, 5.6, -0.4], 1.4, c, p.ol);
    // tête
    ellipseFS(ctx, 5.6, -10.6, 2.8, 2.4, c);
    ellipseFS(ctx, 7.9, -9.8, 1.6, 1.1, c);
    circleFS(ctx, 9.3, -10.2, 0.5, INK, false);
    // oreille
    polyFS(ctx, [4.4, -12.6, 3.0, -9.6, 4.6, -10.2], cd);
    // collier
    ctx.strokeStyle = MAT.red;
    ctx.lineWidth = 0.7;
    line(ctx, 4.0, -8.6, 5.4, -8.0);
    ctx.strokeStyle = INK;
    if (fine) circleFS(ctx, 6.4, -11.2, 0.35, INK, false);
    ctx.restore();
    ctx.lineWidth = p.ol;
  },

  cat(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 3.6, 0.8);
    const c = p.c('#5f5a57');
    // queue enroulée
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-1.8, -0.8);
    ctx.quadraticCurveTo(-4.2, -0.8, -3.4, -3.4);
    ctx.stroke();
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
    // corps assis
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-2.4, 0);
    ctx.quadraticCurveTo(-2.8, -4.4, 0.2, -4.6);
    ctx.quadraticCurveTo(2.4, -4.2, 2.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // tête et oreilles
    ctx.beginPath();
    ctx.moveTo(0.4, -6.0);
    ctx.lineTo(0.7, -7.0);
    ctx.lineTo(1.4, -6.4);
    ctx.lineTo(2.4, -6.8);
    ctx.lineTo(2.6, -5.6);
    ctx.quadraticCurveTo(3.2, -3.8, 1.6, -3.8);
    ctx.quadraticCurveTo(0.0, -3.8, 0.4, -6.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.fillStyle = '#e9d24a';
      ctx.fillRect(1.9, -5.4, 0.5, 0.4);
    }
  },

  pigeons(p) {
    const { ctx } = p;
    for (const [px, peck] of [
      [-4, false],
      [0.5, true],
      [4.5, false],
    ] as [number, boolean][]) {
      p.sh(px, 0, 1.8, 0.4);
      ellipseFS(ctx, px, -1.6, 1.8, 1.1, '#8f949b');
      const hx = peck ? px + 1.8 : px + 1.4;
      const hy = peck ? -0.9 : -2.9;
      circleFS(ctx, hx, hy, 0.75, '#6e737a');
      ctx.fillStyle = '#e8a33a';
      ctx.fillRect(hx + 0.6, hy - 0.1, 0.6, 0.3);
      ctx.fillStyle = '#c0c4c8';
      ctx.beginPath();
      ctx.ellipse(px - 0.4, -1.8, 1.0, 0.5, -0.3, 0, TAU);
      ctx.fill();
    }
  },

  duck(p) {
    const { ctx, fine } = p;
    ctx.fillStyle = 'rgba(80,130,150,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.8, 0.8, 0, 0, TAU);
    ctx.fill();
    const c = p.c('#f6f3ea');
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-3.4, -2.6);
    ctx.quadraticCurveTo(-3.6, -0.2, 0, -0.2);
    ctx.quadraticCurveTo(2.8, -0.2, 2.6, -2.2);
    ctx.quadraticCurveTo(0, -2.4, -3.4, -2.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    circleFS(ctx, 1.9, -3.9, 1.2, p.e.color ? c : '#3f8a5a');
    polyFS(ctx, [2.9, -4.1, 4.2, -3.7, 2.9, -3.4], '#ec8b2f');
    if (fine) circleFS(ctx, 2.2, -4.2, 0.22, INK, false);
  },

  moneybag(p) {
    p.sh(0, 0, 3.4, 0.8);
    drawMoneybag(p.ctx, 0, -3.6, 3.1, p.lod);
  },

  suitcase(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 5.4, 0.9);
    const c = p.c('#7a4a2e');
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-1.6, -6.4);
    ctx.lineTo(-1.6, -7.6);
    ctx.lineTo(1.6, -7.6);
    ctx.lineTo(1.6, -6.4);
    ctx.stroke();
    ctx.lineWidth = p.ol;
    rboxFS(ctx, -5, -6.6, 10, 6.6, 0.8, c);
    if (fine) {
      ctx.fillStyle = p.cd('#7a4a2e');
      ctx.fillRect(-3.2, -6.6, 0.9, 6.6);
      ctx.fillRect(2.3, -6.6, 0.9, 6.6);
      ctx.fillStyle = MAT.gold;
      ctx.fillRect(-0.5, -6.1, 1, 0.8);
    }
  },

  briefcase(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 4.4, 0.8);
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(-1.2, -4.8);
    ctx.lineTo(-1.2, -5.8);
    ctx.lineTo(1.2, -5.8);
    ctx.lineTo(1.2, -4.8);
    ctx.stroke();
    ctx.lineWidth = p.ol;
    boxFS(ctx, -4, -5, 8, 5, p.c('#4a3426'));
    if (fine) {
      ctx.fillStyle = MAT.gold;
      ctx.fillRect(-2.8, -4.4, 0.7, 0.6);
      ctx.fillRect(2.1, -4.4, 0.7, 0.6);
      ctx.lineWidth = 0.25;
      line(ctx, -4, -3.4, 4, -3.4);
      ctx.lineWidth = p.ol;
    }
  },

  knife(p) {
    const { ctx } = p;
    p.sh(0, 0, 3, 0.5);
    polyFS(ctx, [-0.6, -1.8, 3.2, -1.0, -0.6, -0.6], MAT.silver);
    boxFS(ctx, -3, -1.7, 2.6, 1.1, MAT.woodDark);
  },

  painting(p) {
    const { ctx } = p;
    p.sh(0, 0, 7, 1);
    drawPaintingFrame(ctx, -6.5, -11.5, 13, 11, p.lod);
  },

  safe(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 6.5, 1);
    const c = p.c('#4a4f55');
    boxFS(ctx, -6, -13, 12, 13, c);
    if (p.e.variant === 'open') {
      boxFS(ctx, -4.8, -11.8, 9.6, 10.6, '#1e1c1b');
      // liasses et lingots
      boxFS(ctx, -3.8, -4.2, 3.4, 2.4, '#7fae5a');
      boxFS(ctx, 0.4, -3.6, 3.0, 1.8, MAT.gold);
      polyFS(ctx, [6, -13, 8.6, -11.8, 8.6, -1.4, 6, 0], mix(c, '#ffffff', 0.15));
      return;
    }
    boxFS(ctx, -4.8, -11.8, 9.6, 10.6, mix(c, '#ffffff', 0.08));
    circleFS(ctx, 0, -6.5, 2.0, '#c9cccd');
    if (fine) {
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.moveTo(Math.cos(a) * 1.4, -6.5 + Math.sin(a) * 1.4);
        ctx.lineTo(Math.cos(a) * 1.9, -6.5 + Math.sin(a) * 1.9);
      }
      ctx.stroke();
      ctx.lineWidth = p.ol;
      boxFS(ctx, 2.8, -7.4, 1.0, 2.4, '#c9cccd');
    }
  },

  ladder(p) {
    const { ctx } = p;
    p.sh(0, 0, 5, 0.9);
    const c = p.c(MAT.woodLight);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-3.4, -40);
    ctx.moveTo(4, 0);
    ctx.lineTo(3.4, -40);
    ctx.stroke();
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let yy = -3.5; yy > -39; yy -= 4.2) {
      ctx.moveTo(-3.6, yy);
      ctx.lineTo(3.6, yy);
    }
    ctx.stroke();
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.45;
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
  },

  rope(p) {
    const { ctx } = p;
    p.sh(0, 0, 5, 0.9);
    const c = p.c('#c9a466');
    for (const [rx, ry, yy] of [
      [4.6, 2.2, -2.6],
      [3.6, 1.7, -3.2],
      [2.4, 1.1, -3.6],
    ]) {
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.ellipse(0, yy, rx, ry, 0, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = c;
      ctx.stroke();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
  },

  footprints(p) {
    const { ctx } = p;
    ctx.fillStyle = 'rgba(80, 58, 40, 0.55)';
    for (let i = 0; i < 5; i++) {
      const fx = -8 + i * 4;
      const fy = i % 2 === 0 ? -1.4 : 1.4;
      ctx.beginPath();
      ctx.ellipse(fx + 0.5, fy, 1.2, 0.55, 0, 0, TAU);
      ctx.ellipse(fx - 0.9, fy, 0.55, 0.45, 0, 0, TAU);
      ctx.fill();
    }
  },

  trashbag(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 4, 0.8);
    const c = p.c('#2f2d2e');
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-3.6, 0);
    ctx.quadraticCurveTo(-4.4, -4.4, -0.8, -6.2);
    ctx.lineTo(-1.4, -7.6);
    ctx.lineTo(1.4, -7.6);
    ctx.lineTo(0.8, -6.2);
    ctx.quadraticCurveTo(4.4, -4.4, 3.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(-1.6, -3.2, 0.8, 1.6, 0.3, 0, TAU);
      ctx.fill();
    }
  },

  letter(p) {
    const { ctx, fine } = p;
    p.sh(0, 0, 2.6, 0.5);
    boxFS(ctx, -2.5, -3.4, 5, 3.2, MAT.paper);
    if (fine) {
      ctx.lineWidth = 0.22;
      ctx.beginPath();
      ctx.moveTo(-2.5, -3.4);
      ctx.lineTo(0, -1.6);
      ctx.lineTo(2.5, -3.4);
      ctx.stroke();
      ctx.lineWidth = p.ol;
      ctx.fillStyle = MAT.red;
      ctx.fillRect(1.2, -3.1, 0.9, 0.8);
    }
  },

  key(p) {
    const { ctx } = p;
    ctx.strokeStyle = MAT.goldDark;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.arc(-1.2, -1.4, 0.8, 0, TAU);
    ctx.moveTo(-0.4, -1.4);
    ctx.lineTo(2.0, -1.4);
    ctx.lineTo(2.0, -0.6);
    ctx.moveTo(1.2, -1.4);
    ctx.lineTo(1.2, -0.7);
    ctx.stroke();
    ctx.strokeStyle = MAT.gold;
    ctx.lineWidth = 0.3;
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
  },

  jewel(p) {
    p.sh(0, 0, 1.8, 0.4);
    drawJewel(p.ctx, 0, -1.9, 1.6, p.lod);
  },

  cake(p) {
    drawCake(p.ctx, 0, -1, 3, p.lod);
  },

  needle(p) {
    const { ctx, fine } = p;
    drawNeedle(ctx, 0, -1.6, 5.6, p.lod, -0.35);
    if (fine) {
      // petit éclat supplémentaire pour attirer l'œil attentif
      ctx.fillStyle = 'rgba(255, 244, 190, 0.85)';
      ctx.beginPath();
      ctx.moveTo(2.2, -4.6);
      ctx.lineTo(2.5, -3.7);
      ctx.lineTo(3.4, -3.4);
      ctx.lineTo(2.5, -3.1);
      ctx.lineTo(2.2, -2.2);
      ctx.lineTo(1.9, -3.1);
      ctx.lineTo(1.0, -3.4);
      ctx.lineTo(1.9, -3.7);
      ctx.closePath();
      ctx.fill();
    }
  },
};

function col2(p: P, def: string): string {
  return p.e.color ? COLOR_LIGHT[p.e.color] : def;
}

/** Auvent rayé (stand, vitrine) : bandeau de x0 à x1, sommet y, profondeur d. */
export function awningShape(ctx: Ctx, x0: number, x1: number, y: number, d: number, color: string, stripe: string, fine: boolean): void {
  const w = x1 - x0;
  const n = Math.max(3, Math.round(w / 3.4));
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 === 0 ? color : stripe;
    ctx.fillRect(x0 + i * sw, y, sw + 0.05, d);
  }
  // festons
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 === 0 ? color : stripe;
    ctx.beginPath();
    ctx.moveTo(x0 + i * sw, y + d - 0.05);
    ctx.quadraticCurveTo(x0 + (i + 0.5) * sw, y + d + sw * 0.55, x0 + (i + 1) * sw, y + d - 0.05);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(x0, y + d);
  ctx.lineTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.lineTo(x1, y + d);
  for (let i = n - 1; i >= 0; i--) ctx.quadraticCurveTo(x0 + (i + 0.5) * sw, y + d + sw * 0.55, x0 + i * sw, y + d);
  ctx.stroke();
  if (fine) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x0, y, w, d * 0.25);
  }
}

/* ----------------------------------------------------------------------------
 * Variantes utilisées par le générateur (voir src/world/README.md)
 * ------------------------------------------------------------------------- */

/** Pierres : marbre blanc, granit gris, granit noir, grès beige, bronze. */
const STONE: Partial<Record<string, [string, string, string]>> = {
  white: ['#f1ede4', '#c9c2b2', '#9d968a'],
  grey: ['#b3b4b1', '#8b8d8b', '#5f6264'],
  black: ['#4a4746', '#2f2c2b', '#c9b27a'],
  beige: ['#dccaa4', '#b49f78', '#8a7656'],
  brown: ['#a7744a', '#7c5333', '#5a3b24'],
};

function stoneOf(p: P, def: string): [string, string, string] {
  return STONE[p.e.color ?? def] ?? STONE[def]!;
}

/** Pierre tombale : stèle (arrondie, en pignon ou en croix selon la graine) sur un socle. */
function drawTombstone(p: P): void {
  const { ctx, fine } = p;
  const [base, dark, carve] = stoneOf(p, 'grey');
  p.sh(0, 0, 5, 1);
  // socle
  boxFS(ctx, -4.7, -1.5, 9.4, 1.5, dark);
  const shape = p.seed % 3;
  ctx.fillStyle = base;
  ctx.beginPath();
  if (shape === 0) {
    // stèle arrondie
    ctx.moveTo(-3.1, -1.5);
    ctx.lineTo(-3.1, -4.4);
    ctx.arc(0, -4.4, 3.1, Math.PI, 0);
    ctx.lineTo(3.1, -1.5);
  } else if (shape === 1) {
    // stèle à pignon
    ctx.moveTo(-3.0, -1.5);
    ctx.lineTo(-3.0, -5.2);
    ctx.lineTo(0, -7.3);
    ctx.lineTo(3.0, -5.2);
    ctx.lineTo(3.0, -1.5);
  } else {
    // croix
    ctx.moveTo(-1.1, -1.5);
    ctx.lineTo(-1.1, -4.6);
    ctx.lineTo(-3.2, -4.6);
    ctx.lineTo(-3.2, -6.0);
    ctx.lineTo(-1.1, -6.0);
    ctx.lineTo(-1.1, -7.3);
    ctx.lineTo(1.1, -7.3);
    ctx.lineTo(1.1, -6.0);
    ctx.lineTo(3.2, -6.0);
    ctx.lineTo(3.2, -4.6);
    ctx.lineTo(1.1, -4.6);
    ctx.lineTo(1.1, -1.5);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fine && shape !== 2) {
    // croix gravée et lignes d'épitaphe
    ctx.strokeStyle = carve;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -6.0);
    ctx.lineTo(0, -4.0);
    ctx.moveTo(-0.8, -5.3);
    ctx.lineTo(0.8, -5.3);
    ctx.moveTo(-1.8, -3.1);
    ctx.lineTo(1.8, -3.1);
    ctx.moveTo(-1.3, -2.3);
    ctx.lineTo(1.3, -2.3);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
  }
  if (fine && p.seed % 4 === 1) {
    // petit bouquet au pied
    circleFS(ctx, 3.6, -0.9, 0.7, '#e2463d', false);
    circleFS(ctx, 4.3, -1.4, 0.6, '#f0cb3f', false);
  }
}

/** Plinthe de pierre (statues). */
function plinth(p: P, w: number, h: number, base: string, dark: string): void {
  const { ctx } = p;
  boxFS(ctx, -w / 2 - 1, -2, w + 2, 2, dark);
  boxFS(ctx, -w / 2, -h, w, h - 2, base);
  boxFS(ctx, -w / 2 - 0.8, -h - 1.4, w + 1.6, 1.4, base);
}

/** Ange de pierre (cimetière) : silhouette en robe, ailes repliées, sur une plinthe. */
function drawAngel(p: P): void {
  const { ctx } = p;
  const [base, dark] = stoneOf(p, 'white');
  p.sh(0, 0, 7, 1.4);
  plinth(p, 10, 9, base, dark);
  ctx.save();
  ctx.translate(0, -10.4);
  ctx.scale(1.2, 1.2);
  // ailes (derrière le dos)
  const wing = (dx: number, c: string) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-0.8 + dx, -14.5);
    ctx.bezierCurveTo(-5.2 + dx, -19.5, -7.2 + dx, -21.5, -6.4 + dx, -15.5);
    ctx.bezierCurveTo(-6.0 + dx, -12.0, -4.6 + dx, -9.0, -2.2 + dx, -7.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  ctx.lineWidth = p.ol / 1.2;
  wing(1.6, dark);
  wing(0, base);
  if (p.fine) {
    ctx.lineWidth = 0.25;
    ctx.beginPath();
    ctx.moveTo(-1.6, -14.2);
    ctx.quadraticCurveTo(-4.6, -15.2, -5.4, -17.5);
    ctx.moveTo(-2.4, -11.4);
    ctx.quadraticCurveTo(-4.6, -12.4, -5.6, -14.2);
    ctx.stroke();
  }
  drawBronzeFigure(ctx, 'stand', p.lod, 'stone', ANGEL_AP);
  ctx.restore();
  ctx.lineWidth = p.ol;
}

const ANGEL_AP = {
  skin: 'light',
  hair: 'long',
  hairColor: 'blond',
  hat: 'none',
  top: 'dress',
  topColor: 'white',
  topPattern: 'plain',
  bottom: 'skirt',
  bottomColor: 'white',
  face: 'none',
  accessory: 'none',
  build: 'slim',
} as const;

/** Sculpture moderne sur socle (parvis du musée) : anneau, galets empilés ou vague, selon la graine. */
function drawSculpture(p: P): void {
  const { ctx, fine } = p;
  const [base, dark] = stoneOf(p, 'white');
  const [pb, pd] = STONE.grey!;
  p.sh(0, 0, 7.5, 1.4);
  plinth(p, 11, 12, pb, pd);
  const top = -13.4;
  const kind = p.seed % 3;
  if (kind === 0) {
    // anneau sur une tige
    ctx.fillStyle = dark;
    ctx.fillRect(-0.7, top - 6, 1.4, 6);
    ctx.strokeRect(-0.7, top - 6, 1.4, 6);
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.ellipse(0, top - 15, 6.2, 8.4, 0.25, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = base;
    ctx.stroke();
    if (fine) {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.ellipse(0, top - 15, 6.2, 8.4, 0.25, 3.6, 4.6);
      ctx.stroke();
    }
    ctx.strokeStyle = INK;
  } else if (kind === 1) {
    // galets empilés
    const stones: [number, number, number, number][] = [
      [0.4, top - 3.0, 5.4, 3.0],
      [-0.6, top - 8.4, 4.4, 2.6],
      [0.6, top - 12.8, 3.4, 2.0],
      [-0.2, top - 16.2, 2.4, 1.5],
    ];
    for (const [cx, cy, rx, ry] of stones) ellipseFS(ctx, cx, cy, rx, ry, base);
    if (fine) {
      ctx.fillStyle = dark;
      for (const [cx, cy, rx, ry] of stones) {
        ctx.beginPath();
        ctx.ellipse(cx, cy + ry * 0.35, rx * 0.8, ry * 0.45, 0, 0, Math.PI);
        ctx.fill();
      }
    }
  } else {
    // vague torsadée
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-3.6, top);
    ctx.bezierCurveTo(-7.0, top - 9, 5.0, top - 12, 1.0, top - 21);
    ctx.bezierCurveTo(0.2, top - 23.5, 4.2, top - 24.5, 5.4, top - 22.0);
    ctx.bezierCurveTo(6.6, top - 15, -1.2, top - 10, 3.6, top);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(3.6, top);
      ctx.bezierCurveTo(-1.2, top - 10, 6.6, top - 15, 5.4, top - 22.0);
      ctx.bezierCurveTo(4.0, top - 15, -0.4, top - 9, 1.6, top);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.lineWidth = p.ol;
}

/** Planche de légumes (jardins ouvriers) : la couleur choisit la culture. */
function drawVegetables(p: P): void {
  const { ctx, fine } = p;
  const rnd = quickRand(p.seed);
  // terre et sillons
  rboxFS(ctx, -12, -4.2, 24, 4.2, 1.2, '#7d5c40');
  if (fine) {
    ctx.strokeStyle = '#5f4430';
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    for (const yy of [-3.0, -1.6]) {
      ctx.moveTo(-11, yy);
      ctx.lineTo(11, yy);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = p.ol;
  }
  const leaf = MAT.foliage;
  const leafD = MAT.foliageDark;
  switch (p.e.color) {
    case 'red': {
      // tomates sur tuteurs
      ctx.strokeStyle = MAT.woodDark;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const x = -9 + i * 4.5;
        ctx.moveTo(x, -2.2);
        ctx.lineTo(x, -8.4);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = p.ol;
      for (let i = 0; i < 5; i++) {
        const x = -9 + i * 4.5;
        ellipseFS(ctx, x, -5.4, 1.9, 2.6, leaf);
        circleFS(ctx, x - 0.7, -4.6 - rnd() * 1.6, 0.75, '#d9402f', fine);
        circleFS(ctx, x + 0.8, -5.8 - rnd() * 1.4, 0.7, '#e2463d', fine);
      }
      return;
    }
    case 'orange': {
      // citrouilles
      for (let i = 0; i < 4; i++) {
        const x = -8.4 + i * 5.6;
        ellipseFS(ctx, x + 1.6, -3.4, 1.8, 1.1, leaf);
        ellipseFS(ctx, x - 0.4, -2.8, 2.3, 1.8, '#e8862f');
        if (fine) {
          ctx.lineWidth = 0.3;
          line(ctx, x - 0.4, -4.4, x - 0.4, -1.2);
          ctx.lineWidth = p.ol;
          ctx.fillStyle = MAT.woodDark;
          ctx.fillRect(x - 0.6, -5.0, 0.4, 0.7);
        }
      }
      return;
    }
    case 'yellow': {
      // courges jaunes et grandes feuilles
      for (let i = 0; i < 4; i++) {
        const x = -8.6 + i * 5.7;
        ellipseFS(ctx, x, -4.6, 2.6, 2.0, leaf);
        ellipseFS(ctx, x + 1.4, -2.0, 1.9, 0.9, '#f2cf45', true, -0.2);
      }
      return;
    }
    case 'olive': {
      // poireaux et haricots : tiges dressées
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 8; i++) {
        const x = -10 + i * 2.85;
        inkedStroke(ctx, [x, -1.8, x + (rnd() - 0.5) * 1.2, -7.6], 0.8, i % 2 ? leaf : '#a3b65a', p.ol * 0.8);
      }
      ctx.lineWidth = p.ol;
      return;
    }
    default: {
      // choux et salades
      for (let i = 0; i < 5; i++) {
        const x = -9.4 + i * 4.7;
        circleFS(ctx, x, -3.6, 2.1, i % 2 ? '#8cc56a' : '#6aa653');
        if (fine) {
          ctx.lineWidth = 0.3;
          ctx.beginPath();
          ctx.arc(x, -3.6, 1.1, 0.4, Math.PI * 1.6);
          ctx.stroke();
          ctx.lineWidth = p.ol;
        }
      }
      ctx.fillStyle = leafD;
      return;
    }
  }
}
