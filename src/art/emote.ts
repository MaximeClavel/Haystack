// Bulles d'émotion au-dessus de la tête (dessinées hors miroir : les symboles restent lisibles).

import type { Emote } from '../types';
import type { Lod } from './lod';
import { INK, MAT } from './palette';
import { TAU, type Ctx } from './util';

/** Rayon de la bulle (unités monde). */
export const EMOTE_R = 3.4;

/**
 * Dessine la bulle centrée en (cx, cy). `dir` = sens du regard (la queue de la bulle pointe
 * vers la tête, donc vers -dir).
 */
export function drawEmote(ctx: Ctx, emote: Emote, cx: number, cy: number, lod: Lod, dir: number): void {
  if (emote === 'none' || lod === 2) return;
  const r = EMOTE_R;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = lod === 0 ? 0.45 : 0.7;
  // bulle + queue
  ctx.fillStyle = '#fffdf7';
  ctx.beginPath();
  if (emote === 'talk') {
    const w = r * 1.25;
    const h = r * 0.85;
    ctx.moveTo(cx - w + 1, cy - h);
    ctx.lineTo(cx + w - 1, cy - h);
    ctx.quadraticCurveTo(cx + w, cy - h, cx + w, cy - h + 1);
    ctx.lineTo(cx + w, cy + h - 1);
    ctx.quadraticCurveTo(cx + w, cy + h, cx + w - 1, cy + h);
    ctx.lineTo(cx - dir * 0.6, cy + h);
    ctx.lineTo(cx - dir * 2.6, cy + h + 1.8);
    ctx.lineTo(cx - dir * 1.8, cy + h);
    ctx.lineTo(cx - w + 1, cy + h);
    ctx.quadraticCurveTo(cx - w, cy + h, cx - w, cy + h - 1);
    ctx.lineTo(cx - w, cy - h + 1);
    ctx.quadraticCurveTo(cx - w, cy - h, cx - w + 1, cy - h);
    ctx.closePath();
  } else {
    // ouverture de la bulle là où s'attache la queue (vers la tête)
    const g0 = dir > 0 ? Math.PI * 0.62 : Math.PI * 0.22;
    const g1 = dir > 0 ? Math.PI * 0.78 : Math.PI * 0.38;
    ctx.arc(cx, cy, r, g1, g0 + TAU);
    ctx.lineTo(cx - dir * 2.9, cy + r + 1.1);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();

  const fine = lod === 0;
  switch (emote) {
    case 'exclaim': {
      ctx.fillStyle = MAT.red;
      ctx.beginPath();
      ctx.moveTo(cx - 0.75, cy - 2.4);
      ctx.lineTo(cx + 0.75, cy - 2.4);
      ctx.lineTo(cx + 0.35, cy + 0.6);
      ctx.lineTo(cx - 0.35, cy + 0.6);
      ctx.closePath();
      ctx.arc(cx, cy + 1.75, 0.6, 0, TAU);
      ctx.fill();
      return;
    }
    case 'question': {
      ctx.strokeStyle = '#2f6fb8';
      ctx.lineWidth = 0.95;
      ctx.beginPath();
      ctx.arc(cx, cy - 0.9, 1.25, Math.PI * 1.05, Math.PI * 0.45);
      ctx.lineTo(cx, cy + 0.7);
      ctx.stroke();
      ctx.fillStyle = '#2f6fb8';
      ctx.beginPath();
      ctx.arc(cx, cy + 1.9, 0.55, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = INK;
      return;
    }
    case 'heart': {
      ctx.fillStyle = '#e0394b';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 2.1);
      ctx.bezierCurveTo(cx - 3.2, cy - 0.3, cx - 1.7, cy - 2.9, cx, cy - 1.2);
      ctx.bezierCurveTo(cx + 1.7, cy - 2.9, cx + 3.2, cy - 0.3, cx, cy + 2.1);
      ctx.fill();
      return;
    }
    case 'angry': {
      // marque de colère (quatre crochets)
      ctx.strokeStyle = '#d23b3b';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        const px = cx + sx * 0.55;
        const py = cy + sy * 0.55;
        ctx.moveTo(px + sx * 1.5, py);
        ctx.quadraticCurveTo(px, py, px, py + sy * 1.5);
      }
      ctx.stroke();
      ctx.strokeStyle = INK;
      return;
    }
    case 'sleep': {
      ctx.strokeStyle = '#3d5f9a';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      zPath(ctx, cx - 1.6, cy - 0.4, 2.0);
      zPath(ctx, cx + 0.6, cy - 2.2, 1.3);
      ctx.stroke();
      ctx.strokeStyle = INK;
      return;
    }
    case 'music': {
      ctx.fillStyle = '#6a3f8f';
      ctx.strokeStyle = '#6a3f8f';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(cx - 1.1, cy + 1.3, 0.85, 0.65, -0.4, 0, TAU);
      ctx.ellipse(cx + 1.3, cy + 0.8, 0.85, 0.65, -0.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 0.35, cy + 1.2);
      ctx.lineTo(cx - 0.35, cy - 2.0);
      ctx.lineTo(cx + 2.05, cy - 2.5);
      ctx.lineTo(cx + 2.05, cy + 0.7);
      ctx.stroke();
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(cx - 0.35, cy - 1.6);
      ctx.lineTo(cx + 2.05, cy - 2.1);
      ctx.stroke();
      ctx.strokeStyle = INK;
      return;
    }
    case 'sweat': {
      ctx.fillStyle = '#5aa7e0';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 2.3);
      ctx.bezierCurveTo(cx + 0.6, cy - 0.9, cx + 1.6, cy + 0.2, cx + 1.4, cy + 1.2);
      ctx.arc(cx, cy + 1.0, 1.4, 0.15, Math.PI - 0.15);
      ctx.bezierCurveTo(cx - 1.6, cy + 0.2, cx - 0.6, cy - 0.9, cx, cy - 2.3);
      ctx.fill();
      if (fine) {
        ctx.lineWidth = 0.3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.ellipse(cx - 0.5, cy + 0.8, 0.25, 0.45, 0.3, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'ko': {
      // spirale + étoiles
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = i * 0.55;
        const rr = 0.15 + i * 0.09;
        const px = cx - 0.6 + Math.cos(a) * rr;
        const py = cy + 0.4 + Math.sin(a) * rr * 0.8;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      starPath(ctx, cx + 1.8, cy - 1.7, 1.0);
      ctx.fillStyle = MAT.gold;
      ctx.fill();
      return;
    }
    case 'idea': {
      ctx.lineWidth = 0.35;
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath();
      ctx.arc(cx, cy - 0.7, 1.5, Math.PI * 0.8, Math.PI * 2.2);
      ctx.lineTo(cx + 0.65, cy + 1.2);
      ctx.lineTo(cx - 0.65, cy + 1.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#9aa0a4';
      ctx.fillRect(cx - 0.65, cy + 1.25, 1.3, 0.9);
      if (fine) {
        ctx.strokeStyle = '#e0a800';
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(cx - 2.3, cy - 2.2);
        ctx.lineTo(cx - 1.9, cy - 1.8);
        ctx.moveTo(cx + 2.3, cy - 2.2);
        ctx.lineTo(cx + 1.9, cy - 1.8);
        ctx.moveTo(cx, cy - 2.9);
        ctx.lineTo(cx, cy - 2.6);
        ctx.stroke();
        ctx.strokeStyle = INK;
      }
      return;
    }
    case 'talk': {
      ctx.fillStyle = INK;
      ctx.beginPath();
      for (const dx of [-1.5, 0, 1.5]) {
        ctx.moveTo(cx + dx + 0.5, cy);
        ctx.arc(cx + dx, cy, 0.5, 0, TAU);
      }
      ctx.fill();
      return;
    }
  }
}

function zPath(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.moveTo(x, y);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x + s, y + s);
}

function starPath(ctx: Ctx, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
}
