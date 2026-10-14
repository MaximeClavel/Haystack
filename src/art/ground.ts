// Sol : polygones (herbe, eau, pavés…) puis lignes (marquages, rails, clôtures, haies…).
//
// RACCORDS : la carte est rendue par tuiles. Toutes les textures sont des CanvasPattern dont
// l'origine est (0, 0) du MONDE, et les motifs le long des lignes (pointillés, traverses, bandes
// de passage piéton) sont placés selon l'abscisse curviligne depuis le DÉBUT de la ligne :
// deux tuiles voisines dessinent exactement la même chose de part et d'autre de leur bord.
//
// PERFORMANCE : une seule opération fill() par forme (texture comprise) ; formes et segments
// hors de la vue sont ignorés (boîtes englobantes mises en cache).

import type { GroundKind, GroundLayer, GroundLine, GroundShape, Rect, Vec2 } from '../types';
import type { Lod } from './lod';
import { INK } from './palette';
import {
  type TexDef,
  cobbleTex,
  getPattern,
  grassTex,
  planksTex,
  resBucket,
  setPatternFill,
  slabTex,
  speckleTex,
  waterTex,
} from './patterns';
import { type Ctx, deviceScale } from './util';

interface GroundStyle {
  fill: string;
  tex?: () => TexDef;
  /** Contour de la forme (eau, quai…). */
  edge?: string;
  edgeW?: number;
}

export const GROUND_STYLE: Record<GroundKind, GroundStyle> = {
  grass: { fill: '#cddba3', tex: () => grassTex('#cddba3', '#b2c688', '#dde7b9') },
  park: { fill: '#bdd497', tex: () => grassTex('#bdd497', '#a2bf7e', '#d0e1ae', ['#fbf6ea', '#f0cb3f', '#f19bb8']) },
  water: { fill: '#a7cad6', tex: () => waterTex('#a7cad6', '#8fb8c6', '#d8ebf0'), edge: '#6f9fb0', edgeW: 1.2 },
  sand: { fill: '#ead9ab', tex: () => speckleTex('#ead9ab', ['#d9c48e', '#f4e7c4'], 0.12, 0.4) },
  plaza: { fill: '#e3d6bc', tex: () => cobbleTex('#e5d9c0', '#cdbd9f', '#f3ead8') },
  sidewalk: { fill: '#e2d8c5', tex: () => slabTex('#e2d8c5', '#cfc3ad') },
  road: { fill: '#bdb7ab', tex: () => speckleTex('#bdb7ab', ['#aea89c', '#cac4b8'], 0.05, 0.5) },
  parking: { fill: '#c5bfb2', tex: () => speckleTex('#c5bfb2', ['#b4aea2', '#d2ccc0'], 0.05, 0.5) },
  dock: { fill: '#cdb592', tex: () => planksTex('#cdb592', '#a88f6a', '#7d6a52', 3, 24), edge: '#8a7255', edgeW: 1.1 },
  garden: { fill: '#c4d79a', tex: () => grassTex('#c4d79a', '#a6c07c', '#d6e5b4', ['#e2463d', '#fbf6ea', '#f0cb3f', '#8d55ad', '#f19bb8']) },
  courtyard: { fill: '#e2d5bb', tex: () => speckleTex('#e2d5bb', ['#d0c2a4', '#ece2cc'], 0.08, 0.45) },
  bridge: { fill: '#cbbfa8', tex: () => slabTex('#cbbfa8', '#b2a68f'), edge: '#8f846f', edgeW: 1 },
  railbed: { fill: '#b6ab99', tex: () => speckleTex('#b6ab99', ['#9a8f7e', '#cfc5b4', '#a59a88'], 0.35, 0.55, 24) },
};

const shapeBox = new WeakMap<GroundShape, Rect>();
const lineBox = new WeakMap<GroundLine, Rect>();

function bboxOf(points: readonly Vec2[], pad: number): Rect {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

function hit(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Couleur de remplissage (ou texture) d'un type de sol. */
function material(ctx: Ctx, kind: GroundKind, lod: Lod, res: number): string | CanvasPattern {
  const st = GROUND_STYLE[kind];
  if (lod === 2 || !st.tex) return st.fill;
  const pat = getPattern(ctx, `ground|${kind}`, lod === 1 ? Math.min(res, 2) : res, st.tex);
  if (!pat) return st.fill;
  setPatternFill(ctx, pat, 0, 0);
  return pat;
}

export function drawGround(ctx: Ctx, ground: GroundLayer, view: Rect, lod: Lod): void {
  const res = resBucket(deviceScale(ctx));
  // fond
  ctx.fillStyle = material(ctx, ground.base, lod, res);
  ctx.fillRect(view.x, view.y, view.w, view.h);
  // formes
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const s of ground.shapes) {
    if (s.points.length < 3) continue;
    let b = shapeBox.get(s);
    if (!b) {
      b = bboxOf(s.points, 2);
      shapeBox.set(s, b);
    }
    if (!hit(b, view)) continue;
    ctx.beginPath();
    const pts = s.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = material(ctx, s.kind, lod, res);
    ctx.fill();
    const st = GROUND_STYLE[s.kind];
    if (st.edge && lod < 2) {
      ctx.strokeStyle = st.edge;
      ctx.lineWidth = (st.edgeW ?? 1) * (lod === 0 ? 1 : 1.4);
      ctx.stroke();
    }
  }
  // lignes
  for (const l of ground.lines) {
    if (l.points.length < 2) continue;
    let b = lineBox.get(l);
    if (!b) {
      b = bboxOf(l.points, l.width + 10);
      lineBox.set(l, b);
    }
    if (!hit(b, view)) continue;
    drawLine(ctx, l, view, lod);
  }
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.strokeStyle = INK;
}

/* ----------------------------------------------------------------------------
 * Lignes
 * ------------------------------------------------------------------------- */

type SegFn = (x0: number, y0: number, x1: number, y1: number, len: number, start: number) => void;

/** Parcourt les segments visibles, avec leur abscisse curviligne de départ. */
function eachSeg(l: GroundLine, view: Rect, pad: number, fn: SegFn): void {
  const pts = l.points;
  let acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const sx = Math.min(a.x, b.x) - pad;
    const sy = Math.min(a.y, b.y) - pad;
    if (sx < view.x + view.w && sy < view.y + view.h && Math.max(a.x, b.x) + pad > view.x && Math.max(a.y, b.y) + pad > view.y) {
      fn(a.x, a.y, b.x, b.y, len, acc);
    }
    acc += len;
  }
}

/** Polyligne entière (pour les traits continus, sans motif). */
function polyPath(ctx: Ctx, pts: readonly Vec2[], dy = 0): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y + dy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y + dy);
}

/** Marques transversales régulières le long d'une ligne (traverses, bandes). */
function ticks(ctx: Ctx, l: GroundLine, view: Rect, period: number, offset: number, along: number, across: number): void {
  ctx.beginPath();
  eachSeg(l, view, across + 2, (x0, y0, x1, y1, len, start) => {
    if (len <= 0) return;
    const ux = (x1 - x0) / len;
    const uy = (y1 - y0) / len;
    const nx = -uy;
    const ny = ux;
    let t = Math.ceil((start - offset) / period) * period + offset - start;
    for (; t < len; t += period) {
      const cx = x0 + ux * t;
      const cy = y0 + uy * t;
      const ax = ux * along * 0.5;
      const ay = uy * along * 0.5;
      const bx = nx * across * 0.5;
      const by = ny * across * 0.5;
      ctx.moveTo(cx - ax - bx, cy - ay - by);
      ctx.lineTo(cx + ax - bx, cy + ay - by);
      ctx.lineTo(cx + ax + bx, cy + ay + by);
      ctx.lineTo(cx - ax + bx, cy - ay + by);
      ctx.closePath();
    }
  });
  ctx.fill();
}

/** Polyligne décalée parallèlement (rails). */
function offsetPath(ctx: Ctx, pts: readonly Vec2[], d: number): void {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const x = pts[i].x + nx * d;
    const y = pts[i].y + ny * d;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function drawLine(ctx: Ctx, l: GroundLine, view: Rect, lod: Lod): void {
  const w = l.width > 0 ? l.width : 1;
  const fine = lod === 0;
  switch (l.kind) {
    case 'laneline': {
      if (lod === 2) return;
      ctx.strokeStyle = '#f4efe2';
      ctx.lineWidth = w;
      ctx.lineCap = 'butt';
      ctx.setLineDash([7, 7]);
      eachSeg(l, view, w + 1, (x0, y0, x1, y1, _len, start) => {
        ctx.lineDashOffset = start;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.lineCap = 'round';
      return;
    }
    case 'crosswalk': {
      if (lod === 2) return;
      ctx.fillStyle = '#f4efe2';
      ticks(ctx, l, view, 4.4, 2.2, 2.4, w);
      return;
    }
    case 'rail': {
      if (lod === 2) {
        ctx.strokeStyle = '#6d625a';
        ctx.lineWidth = w * 0.55;
        polyPath(ctx, l.points);
        ctx.stroke();
        return;
      }
      // traverses
      ctx.fillStyle = '#7d6650';
      ticks(ctx, l, view, fine ? 4.2 : 6, 0, 1.5, w);
      // rails
      for (const d of [-w * 0.27, w * 0.27]) {
        offsetPath(ctx, l.points, d);
        ctx.strokeStyle = '#535a5f';
        ctx.lineWidth = fine ? 0.9 : 1.2;
        ctx.stroke();
        if (fine) {
          ctx.strokeStyle = '#d3d7d9';
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }
      return;
    }
    case 'path': {
      if (lod < 2) {
        ctx.strokeStyle = '#cdb98e';
        ctx.lineWidth = w + 1;
        polyPath(ctx, l.points);
        ctx.stroke();
      }
      ctx.strokeStyle = '#ead9b2';
      ctx.lineWidth = w;
      polyPath(ctx, l.points);
      ctx.stroke();
      return;
    }
    case 'curb': {
      if (lod === 2) return;
      ctx.strokeStyle = '#a89c87';
      ctx.lineWidth = w;
      polyPath(ctx, l.points);
      ctx.stroke();
      if (fine) {
        ctx.strokeStyle = 'rgba(255, 250, 238, 0.7)';
        ctx.lineWidth = w * 0.35;
        polyPath(ctx, l.points, -w * 0.45);
        ctx.stroke();
      }
      return;
    }
    case 'fence': {
      const h = 5;
      const wood = '#9a7a58';
      if (lod === 2) {
        ctx.strokeStyle = wood;
        ctx.lineWidth = 1.2;
        polyPath(ctx, l.points);
        ctx.stroke();
        return;
      }
      // poteaux
      ctx.strokeStyle = INK;
      ctx.lineWidth = fine ? 1.1 : 1.4;
      ctx.beginPath();
      eachSeg(l, view, h + 2, (x0, y0, x1, y1, len, start) => {
        if (len <= 0) return;
        let t = Math.ceil(start / 4) * 4 - start;
        for (; t <= len; t += 4) {
          const x = x0 + ((x1 - x0) * t) / len;
          const y = y0 + ((y1 - y0) * t) / len;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - h);
        }
      });
      ctx.stroke();
      ctx.strokeStyle = wood;
      ctx.lineWidth = fine ? 0.6 : 0.9;
      ctx.stroke();
      // lisses
      for (const dy of [-h * 0.82, -h * 0.4]) {
        polyPath(ctx, l.points, dy);
        ctx.strokeStyle = INK;
        ctx.lineWidth = fine ? 0.9 : 1.2;
        ctx.stroke();
        ctx.strokeStyle = wood;
        ctx.lineWidth = fine ? 0.45 : 0.7;
        ctx.stroke();
      }
      return;
    }
    case 'hedge': {
      if (lod < 2) {
        ctx.strokeStyle = '#3f6e3c';
        ctx.lineWidth = w + 1.4;
        polyPath(ctx, l.points);
        ctx.stroke();
      }
      ctx.strokeStyle = '#6a9a52';
      ctx.lineWidth = w;
      polyPath(ctx, l.points);
      ctx.stroke();
      if (lod < 2) {
        ctx.strokeStyle = '#8fbb6c';
        ctx.lineWidth = w * 0.42;
        polyPath(ctx, l.points, -w * 0.22);
        ctx.stroke();
      }
      if (fine) {
        // touffes
        ctx.fillStyle = '#4f8243';
        ticks(ctx, l, view, 3.1, 0, 0.9, w * 0.5);
      }
      return;
    }
    case 'wall': {
      if (lod < 2) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = w + (fine ? 1 : 1.4);
        polyPath(ctx, l.points);
        ctx.stroke();
      }
      ctx.strokeStyle = '#cfc6b4';
      ctx.lineWidth = w;
      polyPath(ctx, l.points);
      ctx.stroke();
      if (lod < 2) {
        ctx.strokeStyle = '#ebe4d4';
        ctx.lineWidth = w * 0.4;
        polyPath(ctx, l.points, -w * 0.18);
        ctx.stroke();
      }
      if (fine) {
        ctx.fillStyle = '#a99e88';
        ticks(ctx, l, view, 5, 2.5, 0.35, w);
      }
      return;
    }
  }
}
