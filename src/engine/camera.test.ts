import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM_FLOOR, WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import {
  anchorCamera,
  centerRange,
  clampCamera,
  computeMinZoom,
  fitRectCamera,
  panBy,
  screenToWorld,
  visibleWorldRect,
  worldToScreen,
  zoomAround,
} from './camera';

const world = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
const phone = { width: 390, height: 844 };
const desktop = { width: 1920, height: 1080 };

describe('screenToWorld / worldToScreen', () => {
  it('sont inverses l’une de l’autre', () => {
    const cams = [
      { x: 3200, y: 2400, zoom: 0.061 },
      { x: 780, y: 1700, zoom: 2.5 },
      { x: 10, y: 4790, zoom: 4 },
    ];
    for (const cam of cams) {
      for (const p of [
        { x: 0, y: 0 },
        { x: 195, y: 422 },
        { x: 389.5, y: 12.25 },
      ]) {
        const w = screenToWorld(cam, phone, p);
        const back = worldToScreen(cam, phone, w);
        expect(back.x).toBeCloseTo(p.x, 9);
        expect(back.y).toBeCloseTo(p.y, 9);
      }
    }
  });

  it('le centre de l’écran est le centre de la caméra', () => {
    const cam = { x: 1234, y: 567, zoom: 1.7 };
    expect(screenToWorld(cam, phone, { x: 195, y: 422 })).toEqual({ x: 1234, y: 567 });
    expect(worldToScreen(cam, phone, { x: 1234, y: 567 })).toEqual({ x: 195, y: 422 });
  });

  it('le zoom est en px CSS par unité monde', () => {
    const cam = { x: 0, y: 0, zoom: 2 };
    const a = worldToScreen(cam, phone, { x: 0, y: 0 });
    const b = worldToScreen(cam, phone, { x: 10, y: 0 });
    expect(b.x - a.x).toBe(20);
  });

  it('visibleWorldRect couvre exactement l’écran', () => {
    const cam = { x: 1000, y: 800, zoom: 2 };
    const r = visibleWorldRect(cam, phone);
    expect(r).toEqual({ x: 1000 - 97.5, y: 800 - 211, w: 195, h: 422 });
  });
});

describe('zoom ancré', () => {
  it('garde le point focal fixe à l’écran', () => {
    const cam = { x: 2000, y: 1500, zoom: 1 };
    const anchor = { x: 80, y: 700 };
    const before = screenToWorld(cam, phone, anchor);
    for (const z of [0.3, 1.5, 2, 4]) {
      const next = zoomAround(cam, phone, anchor, z);
      expect(next.zoom).toBe(z);
      const after = screenToWorld(next, phone, anchor);
      expect(after.x).toBeCloseTo(before.x, 9);
      expect(after.y).toBeCloseTo(before.y, 9);
    }
  });

  it('anchorCamera place un point monde sous un point écran', () => {
    const cam = anchorCamera({ x: 500, y: 600 }, { x: 100, y: 200 }, phone, 3);
    const s = worldToScreen(cam, phone, { x: 500, y: 600 });
    expect(s.x).toBeCloseTo(100, 9);
    expect(s.y).toBeCloseTo(200, 9);
  });

  it('panBy : le contenu suit le doigt', () => {
    const cam = { x: 2000, y: 1500, zoom: 2 };
    const p = { x: 100, y: 100 };
    const w = screenToWorld(cam, phone, p);
    const next = panBy(cam, 30, -12);
    const s = worldToScreen(next, phone, w);
    expect(s.x).toBeCloseTo(130, 9);
    expect(s.y).toBeCloseTo(88, 9);
  });
});

describe('bornes', () => {
  it('zoom minimal : la ville entière tient à l’écran', () => {
    const z = computeMinZoom(phone, world);
    expect(z).toBeCloseTo(390 / 6400, 9);
    expect(WORLD_WIDTH * z).toBeLessThanOrEqual(phone.width + 1e-9);
    expect(WORLD_HEIGHT * z).toBeLessThanOrEqual(phone.height + 1e-9);
    const zd = computeMinZoom(desktop, world);
    expect(zd).toBeCloseTo(1080 / 4800, 9);
  });

  it('zoom minimal borné par MIN_ZOOM_FLOOR (petit écran ou taille nulle)', () => {
    expect(computeMinZoom({ width: 100, height: 100 }, world)).toBe(MIN_ZOOM_FLOOR);
    expect(computeMinZoom({ width: 0, height: 0 }, world)).toBe(MIN_ZOOM_FLOOR);
  });

  it('clampCamera borne le zoom', () => {
    const min = computeMinZoom(phone, world);
    expect(clampCamera({ x: 3200, y: 2400, zoom: 99 }, phone, world, min).zoom).toBe(MAX_ZOOM);
    expect(clampCamera({ x: 3200, y: 2400, zoom: 0.001 }, phone, world, min).zoom).toBe(min);
    expect(clampCamera({ x: 3200, y: 2400, zoom: Number.NaN }, phone, world, min).zoom).toBe(min);
  });

  it('au zoom minimal, la ville est centrée (centre verrouillé)', () => {
    const min = computeMinZoom(phone, world);
    const c = clampCamera({ x: 0, y: 99999, zoom: min }, phone, world, min);
    expect(c.x).toBeCloseTo(WORLD_WIDTH / 2, 6);
    expect(c.y).toBeCloseTo(WORLD_HEIGHT / 2, 6);
  });

  it('zoomé, on ne perd jamais la ville (au plus 20 % de l’écran hors monde)', () => {
    const min = computeMinZoom(phone, world);
    for (const zoom of [0.2, 1, 4]) {
      for (const [x, y] of [
        [-1e6, -1e6],
        [1e6, 1e6],
        [-50, 3000],
      ]) {
        const c = clampCamera({ x, y, zoom }, phone, world, min);
        const r = visibleWorldRect(c, phone);
        // Le bord gauche de la vue ne dépasse pas le monde de plus de 20 % de la largeur visible.
        expect(r.x).toBeGreaterThanOrEqual(-0.2 * r.w - 1e-6);
        expect(r.x + r.w).toBeLessThanOrEqual(WORLD_WIDTH + 0.2 * r.w + 1e-6);
        expect(r.y).toBeGreaterThanOrEqual(-0.2 * r.h - 1e-6);
        expect(r.y + r.h).toBeLessThanOrEqual(WORLD_HEIGHT + 0.2 * r.h + 1e-6);
        // Le centre reste dans la ville.
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.x).toBeLessThanOrEqual(WORLD_WIDTH);
      }
    }
  });

  it('une caméra déjà valide n’est pas modifiée', () => {
    const min = computeMinZoom(phone, world);
    const cam = { x: 1234, y: 2345, zoom: 1.5 };
    expect(clampCamera(cam, phone, world, min)).toEqual(cam);
  });

  it('centerRange est continu quand la ville vient à tenir à l’écran', () => {
    const W = 6400;
    for (const v of [6399.999, 6400, 6400.001]) {
      const [lo, hi] = centerRange(v, W);
      expect(hi - lo).toBeLessThan(0.01);
      expect((lo + hi) / 2).toBeCloseTo(W / 2, 6);
    }
    const [lo, hi] = centerRange(1000, W);
    expect(lo).toBe(500 - 200);
    expect(hi).toBe(W - 500 + 200);
  });
});

describe('fitRectCamera', () => {
  it('cadre le rectangle avec la marge demandée', () => {
    const min = computeMinZoom(phone, world);
    const rect = { x: 1000, y: 1000, w: 200, h: 100 };
    const cam = fitRectCamera(rect, phone, 20, min);
    expect(cam.x).toBe(1100);
    expect(cam.y).toBe(1050);
    expect(cam.zoom).toBeCloseTo((390 - 40) / 200, 9);
    const tl = worldToScreen(cam, phone, { x: rect.x, y: rect.y });
    expect(tl.x).toBeCloseTo(20, 6);
  });

  it('respecte maxZoom', () => {
    const cam = fitRectCamera({ x: 0, y: 0, w: 2, h: 2 }, phone, 20, 0.06, 3);
    expect(cam.zoom).toBe(3);
  });
});
