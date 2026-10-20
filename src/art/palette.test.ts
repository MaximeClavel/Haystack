// Palette : les 14 couleurs du vocabulaire doivent rester distinguables deux à deux.
// Mesure : écart perceptuel ΔE (CIE76, espace Lab D65) entre les aplats.

import { describe, expect, it } from 'vitest';
import type { Color } from '../types';
import { COLOR_HEX, COLORS } from './palette';
import { lodForZoom } from './lod';

function lab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = lin((n >> 16) & 255);
  const g = lin((n >> 8) & 255);
  const b = lin(n & 255);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function deltaE(a: Color, b: Color): number {
  const p = lab(COLOR_HEX[a]);
  const q = lab(COLOR_HEX[b]);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

describe('palette', () => {
  it('définit les 14 couleurs du vocabulaire', () => {
    expect(COLORS).toHaveLength(14);
    for (const c of COLORS) expect(COLOR_HEX[c]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('toutes les paires sont nettement distinctes (ΔE ≥ 20)', () => {
    for (let i = 0; i < COLORS.length; i++)
      for (let j = i + 1; j < COLORS.length; j++) {
        const d = deltaE(COLORS[i], COLORS[j]);
        expect(d, `${COLORS[i]} / ${COLORS[j]} : ΔE = ${d.toFixed(1)}`).toBeGreaterThanOrEqual(20);
      }
  });

  it('les paires réputées confusables restent séparées (ΔE ≥ 25)', () => {
    const pairs: [Color, Color][] = [
      ['navy', 'blue'],
      ['navy', 'purple'],
      ['navy', 'black'],
      ['olive', 'green'],
      ['olive', 'brown'],
      ['beige', 'white'],
      ['beige', 'yellow'],
      ['red', 'orange'],
      ['red', 'pink'],
      ['grey', 'white'],
    ];
    for (const [a, b] of pairs) expect(deltaE(a, b), `${a} / ${b}`).toBeGreaterThanOrEqual(25);
  });
});

describe('lodForZoom', () => {
  it('suit les seuils du contrat (≥ 1 : détail, 0,3–1 : simplifié, < 0,3 : silhouettes)', () => {
    expect(lodForZoom(4)).toBe(0);
    expect(lodForZoom(1)).toBe(0);
    expect(lodForZoom(0.99)).toBe(1);
    expect(lodForZoom(0.3)).toBe(1);
    expect(lodForZoom(0.29)).toBe(2);
    expect(lodForZoom(0.06)).toBe(2);
  });
});
