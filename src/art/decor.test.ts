// Détails d'ambiance des bâtiments : déterminisme, emprise, respect des indices d'enquête.

import { describe, expect, it } from 'vitest';
import type { BuildingEntity, BuildingStyle, Color } from '../types';
import { getEntityBounds } from './bounds';
import { layoutOf } from './building';

const COLORS: Color[] = ['red', 'orange', 'yellow', 'pink', 'blue', 'green', 'beige', 'white', 'grey', 'brown'];
const STYLES: BuildingStyle[] = ['house', 'townhouse', 'apartment', 'shop', 'cafe', 'bakery', 'bar', 'pharmacy', 'jeweler', 'postoffice'];

function make(style: BuildingStyle, seed: number, over: Partial<BuildingEntity> = {}): BuildingEntity {
  const w = 40 + (seed % 5) * 30;
  const h = 30 + (seed % 3) * 20;
  return {
    id: `t.b.${style}.${seed}`,
    kind: 'building',
    style,
    x: 0,
    y: 0,
    footprint: { x: -w / 2, y: -h, w, h },
    height: 30 + (seed % 6) * 22,
    wall: COLORS[seed % COLORS.length],
    roof: COLORS[(seed * 7) % COLORS.length],
    seed,
    sign: style === 'shop' ? 'ÉPICERIE' : undefined,
    ...over,
  };
}

describe('décor des bâtiments (decor.ts)', () => {
  it('le plan est déterministe : deux calculs donnent le même résultat', () => {
    for (const style of STYLES) {
      for (let seed = 1; seed <= 25; seed++) {
        const a = layoutOf(make(style, seed)).decor;
        const b = layoutOf(make(style, seed)).decor;
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      }
    }
  });

  it('chaque détail reste dans l’emprise visuelle du bâtiment', () => {
    for (const style of STYLES) {
      for (let seed = 1; seed <= 60; seed++) {
        const e = make(style, seed);
        const d = layoutOf(e).decor!;
        const b = getEntityBounds(e);
        const inside = (x: number, y: number, tag: string) => {
          const ok = x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
          if (!ok) throw new Error(`${tag} hors emprise : ${style} graine ${seed} (${x.toFixed(1)}, ${y.toFixed(1)})`);
        };
        for (const p of d.pots) inside(p.x, e.footprint.y + e.footprint.h - 3, 'pot');
        for (const k of d.birds) inside(k.x, k.y - 4, 'oiseau');
        for (const k of d.skylights) inside(k.x + k.w, k.y + k.h, 'lucarne de toit');
        for (const k of d.smoke) inside(k.x + 6, k.y - 9, 'fumée');
        if (d.antenna) inside(d.antenna.x, d.antenna.y - 9, 'antenne');
        if (d.blade) inside(d.blade.x, d.blade.y - d.blade.s / 2, 'enseigne en drapeau');
        if (d.cat) inside(d.cat.x, d.cat.y - 6, 'chat');
      }
    }
  });

  it('un lieu remarquable portant des détails d’enquête ne reçoit aucun détail de façade', () => {
    for (const style of STYLES) {
      for (let seed = 1; seed <= 40; seed++) {
        const e = make(style, seed, { id: `lm.t${seed}`, features: [{ kind: 'brokenWindow', at: 0.5, floor: 0 }] });
        const d = layoutOf(e).decor!;
        expect(d.facade).toBe(false);
        expect(d.pots).toHaveLength(0);
        expect(d.laundry).toBeUndefined();
        expect(d.cat).toBeUndefined();
        expect(d.ivy).toBeUndefined();
        expect(d.blade).toBeUndefined();
        expect(d.lamp).toBeUndefined();
      }
    }
  });

  it('les styles spéciaux (église, gare, musée…) ne sont pas décorés', () => {
    for (const style of ['church', 'station', 'museum', 'townhall', 'hospital', 'police', 'bank'] as BuildingStyle[]) {
      const d = layoutOf(make(style, 3)).decor!;
      expect(d.facade).toBe(false);
      expect(d.smoke).toHaveLength(0);
      expect(d.birds).toHaveLength(0);
    }
  });

  it('les détails de façade n’occupent jamais une fenêtre ouverte, brisée ou éclairée', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const e = make('apartment', seed);
      const L = layoutOf(e);
      const d = L.decor!;
      const special = L.windows.filter((w) => w.state !== 'normal');
      for (const w of special) {
        if (d.cat) expect(d.cat.x < w.x || d.cat.x > w.x + w.w || d.cat.y < w.y || d.cat.y > w.y + w.h + 2).toBe(true);
      }
    }
  });
});
