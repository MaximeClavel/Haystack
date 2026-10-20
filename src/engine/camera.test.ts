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

describe('bornes avec les marges de l’interface (insets)', () => {
  const min = computeMinZoom(phone, world);
  // Barre haute 62 px, panneau de question 224 px (Q4 de c03 sur 390×844).
  const ui = { top: 62, bottom: 224, left: 0, right: 0 };
  const southEdge = (cam: { x: number; y: number; zoom: number }, vp = phone): number =>
    worldToScreen(cam, vp, { x: 0, y: WORLD_HEIGHT }).y;
  const northEdge = (cam: { x: number; y: number; zoom: number }, vp = phone): number =>
    worldToScreen(cam, vp, { x: 0, y: 0 }).y;

  it('sans marges (absentes ou nulles), le résultat est identique au calcul d’origine', () => {
    const zero = { top: 0, bottom: 0, left: 0, right: 0 };
    for (const zoom of [min, 0.1, 0.19, 0.5, 1, 4]) {
      for (const [x, y] of [
        [3200, 2400],
        [-1e6, -1e6],
        [1e6, 1e6],
        [120, 4700],
      ]) {
        const base = clampCamera({ x, y, zoom }, phone, world, min);
        expect(clampCamera({ x, y, zoom }, phone, world, min, undefined, undefined, undefined)).toEqual(base);
        expect(clampCamera({ x, y, zoom }, phone, world, min, undefined, undefined, zero)).toEqual(base);
      }
    }
  });

  it('le bord sud de la ville se remonte au-dessus du panneau, à tous les zooms', () => {
    const freeBottom = phone.height - ui.bottom;
    for (const zoom of [min, 0.1, 0.15, 0.188, 0.2, 0.25, 0.3, 0.5, 1, 2, 4]) {
      const c = clampCamera({ x: 3200, y: 1e6, zoom }, phone, world, min, undefined, undefined, ui);
      expect(southEdge(c)).toBeLessThanOrEqual(freeBottom + 1e-6);
      expect(c.zoom).toBe(Math.max(min, zoom));
    }
    // Régression : sans marges, vers 0,19 le centre est quasi verrouillé et la rive sud reste sous le panneau.
    const old = clampCamera({ x: 3200, y: 1e6, zoom: 0.19 }, phone, world, min);
    expect(southEdge(old)).toBeGreaterThan(freeBottom + 100);
  });

  it('le bord nord de la ville se descend sous la barre haute, à tous les zooms', () => {
    for (const zoom of [min, 0.1, 0.188, 0.25, 0.5, 1, 4]) {
      const c = clampCamera({ x: 3200, y: -1e6, zoom }, phone, world, min, undefined, undefined, ui);
      expect(northEdge(c)).toBeGreaterThanOrEqual(ui.top - 1e-6);
    }
    const old = clampCamera({ x: 3200, y: -1e6, zoom: 0.19 }, phone, world, min);
    expect(northEdge(old)).toBeLessThan(ui.top - 20);
  });

  it('zoomé, le bord de la ville entre d’au plus 20 % de la zone libre (et non de l’écran)', () => {
    const fh = phone.height - ui.top - ui.bottom;
    const south = clampCamera({ x: 3200, y: 1e6, zoom: 1 }, phone, world, min, undefined, undefined, ui);
    expect(southEdge(south)).toBeCloseTo(phone.height - ui.bottom - 0.2 * fh, 6);
    const north = clampCamera({ x: 3200, y: -1e6, zoom: 1 }, phone, world, min, undefined, undefined, ui);
    expect(northEdge(north)).toBeCloseTo(ui.top + 0.2 * fh, 6);
  });

  it('même garantie sur un autre téléphone (412×915, panneau de 177 px)', () => {
    const vp = { width: 412, height: 915 };
    const m = computeMinZoom(vp, world);
    const insets = { top: 62, bottom: 177, left: 0, right: 0 };
    for (const zoom of [m, 0.15, 0.188, 0.2, 0.25, 0.5, 1, 4]) {
      const s = clampCamera({ x: 3200, y: 1e6, zoom }, vp, world, m, undefined, undefined, insets);
      expect(southEdge(s, vp)).toBeLessThanOrEqual(vp.height - insets.bottom + 1e-6);
      const n = clampCamera({ x: 3200, y: -1e6, zoom }, vp, world, m, undefined, undefined, insets);
      expect(northEdge(n, vp)).toBeGreaterThanOrEqual(insets.top - 1e-6);
    }
  });

  it('au zoom minimal, la ville est centrée dans la zone libre (centre verrouillé)', () => {
    const c = clampCamera({ x: 0, y: 99999, zoom: min }, phone, world, min, undefined, undefined, ui);
    const mid = worldToScreen(c, phone, { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });
    expect(mid.x).toBeCloseTo(phone.width / 2, 6);
    expect(mid.y).toBeCloseTo(ui.top + (phone.height - ui.top - ui.bottom) / 2, 6);
    // Toute entrée donne le même résultat : le centre ne peut plus bouger.
    const other = clampCamera({ x: 5000, y: -3, zoom: min }, phone, world, min, undefined, undefined, ui);
    expect(other).toEqual(c);
  });

  it('monde plus petit que la zone libre : centré dans cette zone, quelle que soit la caméra demandée', () => {
    const small = { width: 1000, height: 800 };
    const vp = { width: 800, height: 1000 };
    const insets = { top: 100, bottom: 300, left: 40, right: 0 }; // zone libre : x de 40 à 800, y de 100 à 700
    const centers = [
      [0, 0],
      [1e6, -1e6],
      [500, 400],
    ];
    // À 0,4 la ville (400×320) tient largement dans la zone libre (760×600) : plus aucun défilement possible.
    for (const zoom of [0.4, 0.5]) {
      const ref = clampCamera({ x: 500, y: 400, zoom }, vp, small, 0.3, undefined, undefined, insets);
      const mid = worldToScreen(ref, vp, { x: 500, y: 400 });
      expect(mid.x).toBeCloseTo(40 + 760 / 2, 6);
      expect(mid.y).toBeCloseTo(100 + 600 / 2, 6);
      for (const [x, y] of centers) {
        const c = clampCamera({ x, y, zoom }, vp, small, 0.3, undefined, undefined, insets);
        expect(c.x).toBeCloseTo(ref.x, 6);
        expect(c.y).toBeCloseTo(ref.y, 6);
      }
    }
    // À 1 la ville (1000×800) dépasse la zone libre en largeur et en hauteur : la ville peut défiler.
    const a = clampCamera({ x: -1e6, y: -1e6, zoom: 1 }, vp, small, 0.3, undefined, undefined, insets);
    const b = clampCamera({ x: 1e6, y: 1e6, zoom: 1 }, vp, small, 0.3, undefined, undefined, insets);
    expect(b.x).toBeGreaterThan(a.x + 100);
    expect(b.y).toBeGreaterThan(a.y + 100);
  });

  it('marges asymétriques : chaque côté a sa propre limite', () => {
    const insets = { top: 10, bottom: 300, left: 100, right: 20 };
    const fw = phone.width - insets.left - insets.right; // 270
    const fh = phone.height - insets.top - insets.bottom; // 534
    const at = (x: number, y: number) => clampCamera({ x, y, zoom: 1 }, phone, world, min, undefined, undefined, insets);
    const edgeX = (c: { x: number; y: number; zoom: number }, wx: number) => worldToScreen(c, phone, { x: wx, y: 0 }).x;
    expect(edgeX(at(-1e6, 2400), 0)).toBeCloseTo(insets.left + 0.2 * fw, 6);
    expect(edgeX(at(1e6, 2400), WORLD_WIDTH)).toBeCloseTo(phone.width - insets.right - 0.2 * fw, 6);
    expect(northEdge(at(3200, -1e6))).toBeCloseTo(insets.top + 0.2 * fh, 6);
    expect(southEdge(at(3200, 1e6))).toBeCloseTo(phone.height - insets.bottom - 0.2 * fh, 6);
  });

  it('une caméra déjà dans les bornes n’est pas modifiée et le résultat est stable', () => {
    const cam = { x: 1234, y: 2345, zoom: 1.5 };
    // Exactement la même caméra (aucun aller-retour arrondi par le décalage des marges).
    expect(clampCamera(cam, phone, world, min, undefined, undefined, ui)).toEqual(cam);
    for (const wild of [
      { x: -1e6, y: 1e6, zoom: 0.19 },
      { x: 2e6, y: -2e6, zoom: 3 },
    ]) {
      const once = clampCamera(wild, phone, world, min, undefined, undefined, ui);
      const twice = clampCamera(once, phone, world, min, undefined, undefined, ui);
      expect(twice.x).toBeCloseTo(once.x, 9);
      expect(twice.y).toBeCloseTo(once.y, 9);
      expect(twice.zoom).toBe(once.zoom);
    }
  });

  it('les marges qui ne laissent aucune place sur un axe sont ignorées sur cet axe', () => {
    const swallow = { top: 400, bottom: 500, left: 30, right: 0 };
    const c = clampCamera({ x: 1e6, y: 1e6, zoom: 1 }, phone, world, min, undefined, undefined, swallow);
    const noY = clampCamera({ x: 1e6, y: 1e6, zoom: 1 }, phone, world, min, undefined, undefined, { ...swallow, top: 0, bottom: 0 });
    const full = clampCamera({ x: 1e6, y: 1e6, zoom: 1 }, phone, world, min);
    expect(c.y).toBeCloseTo(full.y, 9);
    expect(c.x).toBeCloseTo(noY.x, 9);
    // Les marges absurdes (négatives, NaN, infinies) comptent pour zéro.
    const junk = { top: -5, bottom: Number.NaN, left: Number.NEGATIVE_INFINITY, right: Number.POSITIVE_INFINITY };
    expect(clampCamera({ x: 1e6, y: 1e6, zoom: 1 }, phone, world, min, undefined, undefined, junk)).toEqual(
      clampCamera({ x: 1e6, y: 1e6, zoom: 1 }, phone, world, min),
    );
  });

  it('le zoom reste borné et les coordonnées invalides ramenées au centre, comme sans marges', () => {
    expect(clampCamera({ x: 0, y: 0, zoom: 99 }, phone, world, min, undefined, undefined, ui).zoom).toBe(MAX_ZOOM);
    expect(clampCamera({ x: 0, y: 0, zoom: Number.NaN }, phone, world, min, undefined, undefined, ui).zoom).toBe(min);
    const c = clampCamera({ x: Number.NaN, y: Number.NaN, zoom: 1 }, phone, world, min, undefined, undefined, ui);
    expect(Number.isFinite(c.x) && Number.isFinite(c.y)).toBe(true);
    expect(c.x).toBeCloseTo(WORLD_WIDTH / 2, 6);
    // Sans coordonnée valide, la caméra est au centre du monde (le centre de la zone libre est alors décalé).
    expect(c.y).toBeCloseTo(WORLD_HEIGHT / 2, 6);
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
