import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vec2 } from '../types';
import { INERTIA_TAU_MS, TAP_DELAY_MS } from './constants';
import { GestureRecognizer, type GestureHandlers } from './gestures';
import { VelocityTracker, glideDistance, inertiaStep } from './inertia';

type Call = [string, ...unknown[]];

function recorder(): { h: GestureHandlers; calls: Call[]; names: () => string[] } {
  const calls: Call[] = [];
  const rec =
    (name: string) =>
    (...args: unknown[]): void => {
      calls.push([name, ...args]);
    };
  const h: GestureHandlers = {
    panStart: rec('panStart'),
    pan: rec('pan'),
    panEnd: rec('panEnd'),
    pinchStart: rec('pinchStart'),
    pinch: rec('pinch'),
    pinchEnd: rec('pinchEnd'),
    tap: rec('tap'),
    doubleTap: rec('doubleTap'),
    twoFingerTap: rec('twoFingerTap'),
    dragZoomStart: rec('dragZoomStart'),
    dragZoom: rec('dragZoom'),
    dragZoomEnd: rec('dragZoomEnd'),
  };
  return { h, calls, names: () => calls.map((c) => c[0]) };
}

describe('GestureRecognizer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tap court : émis après le délai anti double-tap, au point d’appui', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 200, 0);
    g.move(1, 103, 202, 50); // < 8 px : toujours un tap
    g.up(1, 103, 202, 120);
    expect(r.names()).toEqual([]);
    vi.advanceTimersByTime(TAP_DELAY_MS - 1);
    expect(r.names()).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(r.calls).toEqual([['tap', { x: 100, y: 200 }]]);
  });

  it('appui trop long : pas de tap', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 200, 0);
    g.up(1, 100, 200, 450);
    vi.advanceTimersByTime(1000);
    expect(r.names()).toEqual([]);
  });

  it('glisser au-delà de 8 px : pan (le point saisi suit le doigt), pas de tap', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 200, 0);
    g.move(1, 105, 200, 16);
    g.move(1, 112, 200, 32); // franchit le seuil
    g.move(1, 130, 210, 48);
    g.up(1, 130, 210, 64);
    vi.advanceTimersByTime(1000);
    expect(r.names()).toEqual(['panStart', 'pan', 'pan', 'panEnd']);
    expect(r.calls[1].slice(1, 3)).toEqual([12, 0]); // déplacement complet depuis l'appui
    expect(r.calls[2].slice(1, 3)).toEqual([18, 10]);
    const v = r.calls[3][1] as Vec2;
    expect(v.x).toBeGreaterThan(0.5); // vitesse vers la droite (px/ms) → inertie
  });

  it('lâcher après un arrêt : pas d’inertie', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 0, 0, 0);
    g.move(1, 50, 0, 16);
    g.move(1, 100, 0, 32);
    g.up(1, 100, 0, 300); // immobile pendant 268 ms
    const v = r.calls.find((c) => c[0] === 'panEnd')![1] as Vec2;
    expect(v).toEqual({ x: 0, y: 0 });
  });

  it('double-tap : un seul événement doubleTap, aucun tap', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 200, 0);
    g.up(1, 100, 200, 80);
    vi.advanceTimersByTime(100);
    g.down(2, 104, 198, 180);
    g.up(2, 104, 198, 260);
    vi.advanceTimersByTime(1000);
    expect(r.calls).toEqual([['doubleTap', { x: 104, y: 198 }]]);
  });

  it('deux taps éloignés : deux taps simples', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 200, 0);
    g.up(1, 100, 200, 80);
    vi.advanceTimersByTime(100);
    g.down(2, 300, 600, 180);
    g.up(2, 300, 600, 260);
    vi.advanceTimersByTime(1000);
    expect(r.names()).toEqual(['tap', 'tap']);
  });

  it('double-tap maintenu puis glissé : zoom à un doigt', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 200, 0);
    g.up(1, 100, 200, 80);
    g.down(2, 100, 200, 150);
    g.move(2, 100, 230, 200);
    g.move(2, 100, 260, 250);
    g.up(2, 100, 260, 300);
    vi.advanceTimersByTime(1000);
    expect(r.names()).toEqual(['dragZoomStart', 'dragZoom', 'dragZoom', 'dragZoomEnd']);
    expect(r.calls[2][1]).toBe(60);
  });

  it('pincer : milieu et écartement des deux doigts', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 400, 0);
    g.down(2, 200, 400, 10);
    g.move(2, 300, 400, 30);
    g.up(1, 100, 400, 60);
    g.up(2, 300, 400, 70);
    vi.advanceTimersByTime(1000);
    const names = r.names();
    expect(names.slice(0, 3)).toEqual(['pinchStart', 'pinch', 'pinchEnd']);
    expect(r.calls[0].slice(1)).toEqual([{ x: 150, y: 400 }, 100]);
    expect(r.calls[1].slice(1)).toEqual([{ x: 200, y: 400 }, 200]);
    expect(names).not.toContain('tap');
    expect(names).not.toContain('twoFingerTap');
  });

  it('après un pincement, le doigt restant glisse sans saut', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 400, 0);
    g.down(2, 200, 400, 10);
    g.move(2, 260, 400, 30);
    g.up(2, 260, 400, 50);
    g.move(1, 110, 405, 70);
    g.up(1, 110, 405, 400);
    const pans = r.calls.filter((c) => c[0] === 'pan');
    expect(pans).toEqual([['pan', 10, 5, { x: 110, y: 405 }]]);
  });

  it('tap à deux doigts', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 400, 0);
    g.down(2, 200, 400, 20);
    g.up(1, 100, 400, 120);
    g.up(2, 200, 400, 130);
    vi.advanceTimersByTime(1000);
    expect(r.calls.filter((c) => c[0] === 'twoFingerTap')).toEqual([['twoFingerTap', { x: 150, y: 400 }]]);
    expect(r.names()).not.toContain('tap');
  });

  it('un appui qui interrompt une inertie ne produit pas de tap', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 200, 0, true);
    g.up(1, 100, 200, 80);
    vi.advanceTimersByTime(1000);
    expect(r.names()).toEqual([]);
  });

  it('un troisième doigt est ignoré', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 100, 400, 0);
    g.down(2, 200, 400, 10);
    g.down(3, 300, 300, 20);
    g.move(3, 0, 0, 30);
    g.up(3, 0, 0, 40);
    expect(r.names()).toEqual(['pinchStart']);
    expect(g.activePointers).toBe(2);
  });

  it('annulation : fin de geste sans tap ni inertie', () => {
    const r = recorder();
    const g = new GestureRecognizer(r.h);
    g.down(1, 0, 0, 0);
    g.move(1, 40, 0, 16);
    g.cancel(1);
    vi.advanceTimersByTime(1000);
    expect(r.names()).toEqual(['panStart', 'pan', 'panEnd']);
    expect(r.calls[2][1]).toEqual({ x: 0, y: 0 });
  });
});

describe('inertie', () => {
  it('VelocityTracker mesure la vitesse récente', () => {
    const t = new VelocityTracker();
    for (let k = 0; k <= 10; k++) t.add(k * 16, k * 16 * 2, 0); // 2 px/ms
    const v = t.velocity(160);
    expect(v.x).toBeCloseTo(2, 6);
    expect(v.y).toBe(0);
    expect(t.velocity(400)).toEqual({ x: 0, y: 0 }); // trop ancien
  });

  it('inertiaStep : décroissance exponentielle indépendante de la cadence', () => {
    const v0 = { x: 1, y: -0.5 };
    // 60 pas de 16 ms ≈ 30 pas de 32 ms
    let a = { v: v0, d: 0 };
    for (let k = 0; k < 60; k++) {
      const s = inertiaStep(a.v, 16);
      a = { v: s.v, d: a.d + s.dx };
    }
    let b = { v: v0, d: 0 };
    for (let k = 0; k < 30; k++) {
      const s = inertiaStep(b.v, 32);
      b = { v: s.v, d: b.d + s.dx };
    }
    expect(a.d).toBeCloseTo(b.d, 6);
    expect(a.v.x).toBeCloseTo(Math.exp(-960 / INERTIA_TAU_MS), 6);
    // La distance totale tend vers v0 · τ.
    expect(a.d).toBeLessThan(glideDistance({ x: 1, y: 0 }));
    expect(a.d).toBeGreaterThan(0.9 * glideDistance({ x: 1, y: 0 }));
  });
});
