// Textures répétées (CanvasPattern) : motifs de vêtements, sols, toitures, murs.
//
// Une texture est peinte une fois dans un petit canevas hors écran, à une résolution adaptée à
// l'échelle du contexte (1, 2, 4, 8 ou 16 px par unité monde), puis utilisée comme fillStyle.
// Une seule opération fill() suffit alors pour texturer une forme entière : c'est beaucoup plus
// rapide que des milliers de petits traits.
//
// ALIGNEMENT : la position d'origine du motif est fixée explicitement (setPatternFill). Pour le
// sol, l'origine est (0, 0) du MONDE : le motif est continu d'une tuile à l'autre (pas de raccord).

import { quickRand, TAU } from './util';

type PCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface TexDef {
  /** Période du motif en unités monde (entiers ou multiples de 0,5 de préférence). */
  w: number;
  h: number;
  /** Peint une période du motif, en unités monde (le contexte est déjà mis à l'échelle). */
  paint: (c: PCtx) => void;
  /** Résolution minimale (px par unité). */
  minRes?: number;
  /** Résolution maximale (px par unité). */
  maxRes?: number;
}

const cache = new Map<string, CanvasPattern | null>();

function makeCanvas(wpx: number, hpx: number): OffscreenCanvas | HTMLCanvasElement | null {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(wpx, hpx);
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = wpx;
    c.height = hpx;
    return c;
  }
  return null;
}

/** Résolution (px par unité) adaptée à l'échelle physique du contexte. */
export function resBucket(scale: number): number {
  return scale <= 1.1 ? 1 : scale <= 2.2 ? 2 : scale <= 4.4 ? 4 : scale <= 8.8 ? 8 : 16;
}

/**
 * Renvoie le motif `key` à la résolution demandée (créé à la première demande).
 * `def` n'est appelée qu'à la création. Renvoie null hors navigateur.
 */
export function getPattern(ctx: CanvasRenderingContext2D, key: string, res: number, def: () => TexDef): CanvasPattern | null {
  const d0 = cacheDefs.get(key);
  const d = d0 ?? def();
  if (!d0) cacheDefs.set(key, d);
  const r = Math.max(d.minRes ?? 1, Math.min(d.maxRes ?? 16, res));
  const ck = `${key}@${r}`;
  const hit = cache.get(ck);
  if (hit !== undefined) return hit;
  const wpx = Math.max(1, Math.round(d.w * r));
  const hpx = Math.max(1, Math.round(d.h * r));
  const canvas = makeCanvas(wpx, hpx);
  let pat: CanvasPattern | null = null;
  if (canvas) {
    const c = canvas.getContext('2d') as PCtx | null;
    if (c) {
      c.setTransform(wpx / d.w, 0, 0, hpx / d.h, 0, 0);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      d.paint(c);
      pat = ctx.createPattern(canvas as CanvasImageSource, 'repeat');
      if (pat) patternRes.set(pat, [wpx / d.w, hpx / d.h]);
    }
  }
  cache.set(ck, pat);
  return pat;
}

const cacheDefs = new Map<string, TexDef>();
const patternRes = new WeakMap<CanvasPattern, [number, number]>();

/** Utilise `pat` comme couleur de remplissage, dans le repère `m` (unités monde, ex. repère du buste). */
export function setPatternFillMatrix(ctx: CanvasRenderingContext2D, pat: CanvasPattern, m: DOMMatrix2DInit): void {
  const r = patternRes.get(pat) ?? [1, 1];
  const a = m.a ?? 1;
  const b = m.b ?? 0;
  const c = m.c ?? 0;
  const d = m.d ?? 1;
  pat.setTransform({ a: a / r[0], b: b / r[0], c: c / r[1], d: d / r[1], e: m.e ?? 0, f: m.f ?? 0 });
  ctx.fillStyle = pat;
}

/** Utilise `pat` comme couleur de remplissage, avec l'origine du motif en (ox, oy) (unités monde). */
export function setPatternFill(ctx: CanvasRenderingContext2D, pat: CanvasPattern, ox: number, oy: number): void {
  const r = patternRes.get(pat) ?? [1, 1];
  pat.setTransform({ a: 1 / r[0], b: 0, c: 0, d: 1 / r[1], e: ox, f: oy });
  ctx.fillStyle = pat;
}

/* ----------------------------------------------------------------------------
 * Motifs de vêtements
 * ------------------------------------------------------------------------- */

export function stripesTex(base: string, ink: string): TexDef {
  return {
    w: 1.5,
    h: 1.5,
    minRes: 2,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 1.5, 1.5);
      c.fillStyle = ink;
      c.fillRect(0, 0.95, 1.5, 0.55);
    },
  };
}

export function dotsTex(base: string, ink: string): TexDef {
  return {
    w: 2,
    h: 2,
    minRes: 2,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 2, 2);
      c.fillStyle = ink;
      for (const [x, y] of [
        [0.5, 0.5],
        [1.5, 1.5],
      ]) {
        c.beginPath();
        c.arc(x, y, 0.3, 0, TAU);
        c.fill();
      }
    },
  };
}

export function checksTex(base: string, dark: string, light: string): TexDef {
  return {
    w: 2,
    h: 2,
    minRes: 2,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 2, 2);
      c.globalAlpha = 0.55;
      c.fillStyle = dark;
      c.fillRect(0, 0, 1, 2);
      c.fillRect(0, 0, 2, 1);
      c.globalAlpha = 1;
      c.fillStyle = dark;
      c.fillRect(0, 0, 1, 1);
      c.fillStyle = light;
      c.fillRect(1.45, 0, 0.12, 2);
      c.fillRect(0, 1.45, 2, 0.12);
    },
  };
}

/* ----------------------------------------------------------------------------
 * Sols (alignés sur le monde)
 * ------------------------------------------------------------------------- */

/** Herbe : mouchetis de petites touffes. */
export function grassTex(base: string, dark: string, light: string, flowers: string[] = []): TexDef {
  return {
    w: 48,
    h: 48,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 48, 48);
      const r = quickRand(1234);
      c.strokeStyle = dark;
      c.lineWidth = 0.45;
      for (let i = 0; i < 70; i++) {
        const x = r() * 48;
        const y = r() * 48;
        c.beginPath();
        c.moveTo(x - 0.9, y - 0.9);
        c.lineTo(x, y + 0.3);
        c.lineTo(x + 0.9, y - 1.0);
        c.stroke();
      }
      c.fillStyle = light;
      for (let i = 0; i < 50; i++) {
        c.beginPath();
        c.arc(r() * 48, r() * 48, 0.45, 0, TAU);
        c.fill();
      }
      for (let i = 0; i < flowers.length * 6; i++) {
        c.fillStyle = flowers[i % flowers.length];
        c.beginPath();
        c.arc(r() * 48, r() * 48, 0.55, 0, TAU);
        c.fill();
      }
    },
  };
}

/** Pavés de place : rangées décalées de pierres arrondies. */
export function cobbleTex(base: string, joint: string, light: string): TexDef {
  return {
    w: 8,
    h: 6,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = joint;
      c.fillRect(0, 0, 8, 6);
      c.fillStyle = base;
      const stone = (x: number, y: number) => {
        c.beginPath();
        const w = 3.5;
        const h = 2.5;
        const r = 0.8;
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.fill();
      };
      for (const [x, y] of [
        [0.25, 0.25],
        [4.25, 0.25],
        [-1.75, 3.25],
        [2.25, 3.25],
        [6.25, 3.25],
      ])
        stone(x, y);
      c.fillStyle = light;
      c.globalAlpha = 0.5;
      c.fillRect(1, 0.7, 1.4, 0.35);
      c.fillRect(5, 0.7, 1.4, 0.35);
      c.fillRect(3, 3.7, 1.4, 0.35);
      c.globalAlpha = 1;
    },
  };
}

/** Dalles de trottoir. */
export function slabTex(base: string, joint: string): TexDef {
  return {
    w: 12,
    h: 12,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 12, 12);
      c.fillStyle = joint;
      c.fillRect(0, 0, 12, 0.3);
      c.fillRect(0, 6, 12, 0.3);
      c.fillRect(0, 0, 0.3, 6);
      c.fillRect(6, 6, 0.3, 6);
    },
  };
}

/** Grain léger (asphalte, sable, gravier, ballast). */
export function speckleTex(base: string, dots: string[], density: number, size: number, period = 32): TexDef {
  return {
    w: period,
    h: period,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, period, period);
      const r = quickRand(777 + dots.length);
      const n = Math.round(period * period * density);
      for (let i = 0; i < n; i++) {
        c.fillStyle = dots[i % dots.length];
        const s = size * (0.6 + r() * 0.8);
        c.fillRect(r() * period, r() * period, s, s);
      }
    },
  };
}

/** Eau : petites rides horizontales. */
export function waterTex(base: string, dark: string, light: string): TexDef {
  return {
    w: 48,
    h: 24,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 48, 24);
      const r = quickRand(4242);
      c.lineWidth = 0.5;
      for (let i = 0; i < 14; i++) {
        const x = r() * 48;
        const y = r() * 24;
        const w = 3 + r() * 4;
        c.strokeStyle = i % 3 === 0 ? light : dark;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + w * 0.25, y - 0.7, x + w * 0.5, y);
        c.quadraticCurveTo(x + w * 0.75, y + 0.7, x + w, y);
        c.stroke();
        // recopie pour la continuité au bord droit
        if (x + w > 48) {
          c.beginPath();
          c.moveTo(x - 48, y);
          c.quadraticCurveTo(x - 48 + w * 0.25, y - 0.7, x - 48 + w * 0.5, y);
          c.quadraticCurveTo(x - 48 + w * 0.75, y + 0.7, x - 48 + w, y);
          c.stroke();
        }
      }
    },
  };
}

/** Planches (quais, ponts de bois). */
export function planksTex(base: string, joint: string, nail: string, plank = 3, length = 24, vertical = false): TexDef {
  const w = vertical ? plank * 2 : length;
  const h = vertical ? length : plank * 2;
  return {
    w,
    h,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, w, h);
      c.fillStyle = joint;
      if (!vertical) {
        c.fillRect(0, 0, length, 0.3);
        c.fillRect(0, plank, length, 0.3);
        c.fillRect(0, 0, 0.3, plank);
        c.fillRect(length / 2, plank, 0.3, plank);
        c.fillStyle = nail;
        c.fillRect(0.8, plank / 2 - 0.2, 0.4, 0.4);
        c.fillRect(length - 1.2, plank / 2 - 0.2, 0.4, 0.4);
        c.fillRect(length / 2 + 0.8, plank * 1.5 - 0.2, 0.4, 0.4);
        c.fillRect(length / 2 - 1.2, plank * 1.5 - 0.2, 0.4, 0.4);
      } else {
        c.fillRect(0, 0, 0.3, length);
        c.fillRect(plank, 0, 0.3, length);
        c.fillRect(0, 0, plank, 0.3);
        c.fillRect(plank, length / 2, plank, 0.3);
      }
    },
  };
}

/** Potager / massif : rangées de plantes sur terre. */
export function rowsTex(soil: string, leaf: string, leafDark: string): TexDef {
  return {
    w: 12,
    h: 6,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = soil;
      c.fillRect(0, 0, 12, 6);
      for (let i = 0; i < 4; i++) {
        c.fillStyle = leafDark;
        c.beginPath();
        c.arc(1.5 + i * 3, 3.3, 1.2, 0, TAU);
        c.fill();
        c.fillStyle = leaf;
        c.beginPath();
        c.arc(1.3 + i * 3, 2.9, 0.9, 0, TAU);
        c.fill();
      }
    },
  };
}

/* ----------------------------------------------------------------------------
 * Toitures et murs (origine = coin du toit ou de la façade)
 * ------------------------------------------------------------------------- */

/** Tuiles : rangées d'écailles décalées. */
export function tilesTex(base: string, dark: string, light: string): TexDef {
  return {
    w: 6,
    h: 6,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 6, 6);
      c.strokeStyle = dark;
      c.lineWidth = 0.35;
      for (let row = 0; row < 2; row++) {
        const y = row * 3 + 3;
        const off = row * 1.5;
        for (let i = -1; i < 3; i++) {
          const x = off + i * 3;
          c.beginPath();
          c.moveTo(x, y - 2.6);
          c.lineTo(x, y - 0.8);
          c.quadraticCurveTo(x, y, x + 1.5, y);
          c.quadraticCurveTo(x + 3, y, x + 3, y - 0.8);
          c.stroke();
        }
        c.fillStyle = light;
        c.globalAlpha = 0.45;
        for (let i = -1; i < 3; i++) c.fillRect(off + i * 3 + 0.6, y - 2.4, 0.5, 1.4);
        c.globalAlpha = 1;
      }
    },
  };
}

/** Zinc / tôle à joints debout : lignes verticales. */
export function seamsTex(base: string, dark: string, light: string, step = 3): TexDef {
  return {
    w: step,
    h: 4,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, step, 4);
      c.fillStyle = dark;
      c.fillRect(step - 0.35, 0, 0.35, 4);
      c.fillStyle = light;
      c.fillRect(step - 0.7, 0, 0.3, 4);
    },
  };
}

/** Ardoises : petites plaques décalées. */
export function slateTex(base: string, dark: string): TexDef {
  return {
    w: 4,
    h: 4,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 4, 4);
      c.fillStyle = dark;
      c.fillRect(0, 1.8, 4, 0.25);
      c.fillRect(0, 3.8, 4, 0.25);
      c.fillRect(1, 0, 0.25, 2);
      c.fillRect(3, 2, 0.25, 2);
    },
  };
}

/** Verrière : carreaux de verre et montants clairs. */
export function glassRoofTex(glass: string, frame: string, light: string): TexDef {
  return {
    w: 8,
    h: 6,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = glass;
      c.fillRect(0, 0, 8, 6);
      c.fillStyle = light;
      c.globalAlpha = 0.6;
      c.beginPath();
      c.moveTo(1, 5);
      c.lineTo(3.5, 1);
      c.lineTo(4.5, 1);
      c.lineTo(2, 5);
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = frame;
      c.fillRect(0, 0, 8, 0.5);
      c.fillRect(0, 0, 0.5, 6);
    },
  };
}

/** Briques. */
export function brickTex(base: string, joint: string, dark: string): TexDef {
  return {
    w: 6,
    h: 3,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = joint;
      c.fillRect(0, 0, 6, 3);
      c.fillStyle = base;
      c.fillRect(0.15, 0.15, 2.7, 1.2);
      c.fillRect(3.15, 0.15, 2.7, 1.2);
      c.fillRect(-1.35, 1.65, 2.7, 1.2);
      c.fillRect(1.65, 1.65, 2.7, 1.2);
      c.fillRect(4.65, 1.65, 2.7, 1.2);
      c.fillStyle = dark;
      c.globalAlpha = 0.35;
      c.fillRect(3.15, 0.15, 2.7, 1.2);
      c.fillRect(-1.35, 1.65, 1.2, 1.2);
      c.globalAlpha = 1;
    },
  };
}

/** Pierre de taille : assises horizontales (soubassements, monuments). */
export function stoneTex(base: string, joint: string): TexDef {
  return {
    w: 12,
    h: 8,
    maxRes: 8,
    paint: (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 12, 8);
      c.fillStyle = joint;
      c.fillRect(0, 3.8, 12, 0.3);
      c.fillRect(0, 7.8, 12, 0.3);
      c.fillRect(5.85, 0, 0.3, 4);
      c.fillRect(0, 4, 0.3, 4);
    },
  };
}
