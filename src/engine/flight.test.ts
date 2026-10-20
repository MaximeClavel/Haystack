import { describe, expect, it } from 'vitest';
import { screenToWorld } from './camera';
import { easeInOutCubic, planFlight } from './flight';

const phone = { width: 390, height: 844 };

describe('easeInOutCubic', () => {
  it('part de 0, arrive à 1, symétrique et monotone', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 12);
    let prev = 0;
    for (let t = 0.01; t <= 1; t += 0.01) {
      const v = easeInOutCubic(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(easeInOutCubic(1 - t)).toBeCloseTo(1 - v, 9);
      prev = v;
    }
  });
});

describe('planFlight', () => {
  it('commence et finit exactement aux caméras demandées', () => {
    const from = { x: 1000, y: 1000, zoom: 0.5 };
    const to = { x: 5000, y: 3500, zoom: 2 };
    const p = planFlight(from, to, phone, { minZoom: 0.06 });
    expect(p.at(0)).toEqual(from);
    expect(p.at(1)).toEqual(to);
  });

  it('sans déplacement, le log du zoom varie de façon monotone', () => {
    const from = { x: 1000, y: 1000, zoom: 0.25 };
    const to = { x: 1000, y: 1000, zoom: 4 };
    const p = planFlight(from, to, phone, { minZoom: 0.06 });
    let prev = 0.25;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const z = p.at(t).zoom;
      expect(z).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = z;
    }
    expect(p.lowestZoom).toBe(0.25);
  });

  it('zoom vers un point : ce point reste fixe à l’écran pendant tout le vol', () => {
    // Cible construite pour que le point monde sous l'écran (100, 600) y reste au zoom final.
    const from = { x: 2000, y: 1500, zoom: 1 };
    const anchor = { x: 100, y: 600 };
    const w = screenToWorld(from, phone, anchor);
    const z1 = 4;
    const to = { x: w.x - (anchor.x - phone.width / 2) / z1, y: w.y - (anchor.y - phone.height / 2) / z1, zoom: z1 };
    const p = planFlight(from, to, phone, { minZoom: 0.06, duration: 300 });
    for (let t = 0; t <= 1; t += 0.1) {
      const cam = p.at(t);
      const pt = screenToWorld(cam, phone, anchor);
      expect(pt.x).toBeCloseTo(w.x, 1);
      expect(pt.y).toBeCloseTo(w.y, 1);
    }
  });

  it('cible lointaine hors écran : dézoom intermédiaire qui montre départ et arrivée', () => {
    const from = { x: 500, y: 500, zoom: 2 };
    const to = { x: 5800, y: 4200, zoom: 2 };
    const p = planFlight(from, to, phone, { minZoom: 0.06 });
    expect(p.lowestZoom).toBeLessThan(0.2);
    const mid = p.at(0.5);
    expect(mid.zoom).toBeLessThan(0.2);
    // À mi-parcours, les deux extrémités sont (presque) à l'écran.
    expect(Math.abs(to.x - from.x) * mid.zoom).toBeLessThanOrEqual(phone.width * 1.05);
  });

  it('cible proche (visible) : pas de dézoom', () => {
    const from = { x: 1000, y: 1000, zoom: 1 };
    const to = { x: 1100, y: 1050, zoom: 1 };
    const p = planFlight(from, to, phone, { minZoom: 0.06 });
    expect(p.lowestZoom).toBe(1);
    for (let t = 0; t <= 1; t += 0.1) expect(p.at(t).zoom).toBeCloseTo(1, 9);
  });

  it('le dézoom intermédiaire ne descend pas sous le zoom minimal', () => {
    const p = planFlight({ x: 0, y: 0, zoom: 0.1 }, { x: 6400, y: 4800, zoom: 0.1 }, phone, { minZoom: 0.061 });
    expect(p.lowestZoom).toBeGreaterThanOrEqual(0.061 - 1e-9);
  });

  it('durée : fonction de la distance, bornée, imposable', () => {
    const near = planFlight({ x: 1000, y: 1000, zoom: 1 }, { x: 1200, y: 1000, zoom: 1 }, phone, { minZoom: 0.06 });
    const far = planFlight({ x: 500, y: 500, zoom: 2 }, { x: 5800, y: 4200, zoom: 2 }, phone, { minZoom: 0.06 });
    expect(far.duration).toBeGreaterThan(near.duration);
    expect(near.duration).toBeGreaterThanOrEqual(220);
    expect(far.duration).toBeLessThanOrEqual(2200);
    const fixed = planFlight({ x: 0, y: 0, zoom: 1 }, { x: 10, y: 0, zoom: 1 }, phone, { minZoom: 0.06, duration: 123 });
    expect(fixed.duration).toBe(123);
  });
});
