import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { computeMinZoom, visibleWorldRect } from './camera';
import { LEVEL_UPSCALE_MAX, ROOT_MAX_TILES } from './constants';
import {
  MAX_LEVEL,
  ancestorAt,
  allTiles,
  cacheCapacity,
  childTiles,
  deviceRect,
  gridSize,
  idealLevel,
  levelForZoom,
  levelRange,
  parentTile,
  subRectInAncestor,
  tileCount,
  tileRect,
  tileWorldSize,
  visibleTiles,
} from './tiles';

const world = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
const phone = { width: 390, height: 844 };

describe('niveaux', () => {
  it('MAX_LEVEL correspond au zoom maximal', () => {
    expect(2 ** MAX_LEVEL).toBe(MAX_ZOOM);
  });

  it('une tuile mesure TILE_SIZE px au zoom de son niveau', () => {
    for (const L of [-4, -1, 0, 2]) expect(tileWorldSize(L) * 2 ** L).toBe(TILE_SIZE);
  });

  it('choix du niveau : la tuile est affichée entre ×LEVEL_UPSCALE_MAX/2 et ×LEVEL_UPSCALE_MAX', () => {
    for (let z = 0.05; z <= MAX_ZOOM; z *= 1.07) {
      const L = idealLevel(z);
      const scale = z / 2 ** L;
      expect(scale).toBeLessThanOrEqual(LEVEL_UPSCALE_MAX + 1e-9);
      expect(scale).toBeGreaterThan(LEVEL_UPSCALE_MAX / 2);
    }
  });

  it('exemples : zoom exact d’un niveau, léger agrandissement toléré, sinon niveau supérieur', () => {
    expect(levelForZoom(1, -4)).toBe(0);
    expect(levelForZoom(1.1, -4)).toBe(0); // ×1,1 : toléré
    expect(levelForZoom(1.2, -4)).toBe(1); // ×1,2 : trop flou → tuiles du niveau 1 réduites (×0,6)
    expect(levelForZoom(2, -4)).toBe(1);
    expect(levelForZoom(4, -4)).toBe(2);
    expect(levelForZoom(0.5, -4)).toBe(-1);
  });

  it('borné à [min, MAX_LEVEL]', () => {
    expect(levelForZoom(100, -4)).toBe(MAX_LEVEL);
    expect(levelForZoom(0.001, -4)).toBe(-4);
  });

  it('plage de niveaux sur téléphone : la ville entière en 4 tuiles au niveau racine', () => {
    const r = levelRange(computeMinZoom(phone, world), world);
    expect(r.min).toBe(-4);
    expect(r.root).toBe(-4);
    expect(tileCount(r.root, world)).toBe(4);
    expect(r.max).toBe(2);
  });

  it('grand écran : la racine descend pour rester sous ROOT_MAX_TILES tuiles', () => {
    const r = levelRange(computeMinZoom({ width: 1920, height: 1080 }, world), world);
    expect(r.min).toBe(-2);
    expect(r.root).toBeLessThanOrEqual(r.min);
    expect(tileCount(r.root, world)).toBeLessThanOrEqual(ROOT_MAX_TILES);
  });

  it('grille du monde', () => {
    expect(gridSize(0, world)).toEqual({ cols: 25, rows: 19 });
    expect(gridSize(-4, world)).toEqual({ cols: 2, rows: 2 });
  });
});

describe('tuiles visibles', () => {
  it('couvrent toute la vue, sans tuile hors du monde', () => {
    const cams = [
      { x: 3200, y: 2400, zoom: computeMinZoom(phone, world) },
      { x: 780, y: 1700, zoom: 2.5 },
      { x: 100, y: 100, zoom: 1 },
      { x: 6300, y: 4700, zoom: 4 },
    ];
    for (const cam of cams) {
      const L = levelForZoom(cam.zoom, -4);
      const tiles = visibleTiles(cam, phone, L, world);
      expect(tiles.length).toBeGreaterThan(0);
      const v = visibleWorldRect(cam, phone);
      const s = tileWorldSize(L);
      // Chaque point de la vue situé dans le monde est couvert par une tuile.
      for (let k = 0; k <= 10; k++) {
        for (let m = 0; m <= 10; m++) {
          const x = v.x + (v.w * k) / 10;
          const y = v.y + (v.h * m) / 10;
          if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) continue;
          const i = Math.floor(x / s);
          const j = Math.floor(y / s);
          expect(tiles.some((t) => t.i === i && t.j === j)).toBe(true);
        }
      }
      const g = gridSize(L, world);
      for (const t of tiles) {
        expect(t.i).toBeGreaterThanOrEqual(0);
        expect(t.j).toBeGreaterThanOrEqual(0);
        expect(t.i).toBeLessThan(g.cols);
        expect(t.j).toBeLessThan(g.rows);
        // Toute tuile renvoyée intersecte la vue.
        const r = tileRect(t);
        expect(r.x < v.x + v.w && r.x + r.w > v.x && r.y < v.y + v.h && r.y + r.h > v.y).toBe(true);
      }
    }
  });

  it('sont triées de la plus centrale à la plus excentrée', () => {
    const cam = { x: 2000, y: 2000, zoom: 1 };
    const tiles = visibleTiles(cam, phone, 0, world);
    const d = tiles.map((t) => {
      const r = tileRect(t);
      return Math.hypot(r.x + r.w / 2 - cam.x, r.y + r.h / 2 - cam.y);
    });
    for (let k = 1; k < d.length; k++) expect(d[k]).toBeGreaterThanOrEqual(d[k - 1] - 1e-9);
    // La tuile qui contient le centre vient en premier.
    expect(tiles[0]).toEqual({ level: 0, i: Math.floor(2000 / 256), j: Math.floor(2000 / 256) });
  });

  it('marge : un anneau d’une tuile en plus', () => {
    const cam = { x: 2000, y: 2000, zoom: 1 };
    const a = visibleTiles(cam, phone, 0, world);
    const b = visibleTiles(cam, phone, 0, world, 1);
    const ia = new Set(a.map((t) => `${t.i},${t.j}`));
    expect(b.length).toBeGreaterThan(a.length);
    for (const t of a) expect(b.some((u) => u.i === t.i && u.j === t.j)).toBe(true);
    expect(b.filter((t) => !ia.has(`${t.i},${t.j}`)).length).toBe(b.length - a.length);
  });

  it('allTiles couvre tout le niveau', () => {
    expect(allTiles(-4, world)).toHaveLength(4);
    expect(allTiles(-3, world)).toHaveLength(tileCount(-3, world));
  });
});

describe('parenté', () => {
  it('ancêtres et enfants sont emboîtés', () => {
    const t = { level: 2, i: 37, j: 21 };
    expect(parentTile(t)).toEqual({ level: 1, i: 18, j: 10 });
    expect(ancestorAt(t, -1)).toEqual({ level: -1, i: 4, j: 2 });
    const p = parentTile(t);
    const kids = childTiles(p, world);
    expect(kids).toHaveLength(4);
    expect(kids.some((k) => k.i === t.i && k.j === t.j)).toBe(true);
    const pr = tileRect(p);
    for (const k of kids) {
      const r = tileRect(k);
      expect(r.x).toBeGreaterThanOrEqual(pr.x);
      expect(r.x + r.w).toBeLessThanOrEqual(pr.x + pr.w);
    }
  });

  it('les enfants hors du monde sont omis', () => {
    // Niveau −4 : tuile (1, 1) couvre [4096, 8192) ; au niveau −3 la grille fait 4 × 3.
    const kids = childTiles({ level: -4, i: 1, j: 1 }, world);
    expect(kids).toEqual([
      { level: -3, i: 2, j: 2 },
      { level: -3, i: 3, j: 2 },
    ]);
  });

  it('sous-rectangle dans l’ancêtre', () => {
    const s = subRectInAncestor({ level: 2, i: 37, j: 21 }, { level: 0, i: 9, j: 5 }, 512);
    expect(s).toEqual({ sx: 128, sy: 128, sw: 128 });
  });
});

describe('rectangles écran', () => {
  it('deux tuiles voisines partagent exactement leur bord (pixels entiers)', () => {
    const cam = { x: 1001.37, y: 777.77, zoom: 1.37 };
    for (let i = 0; i < 6; i++) {
      const a = deviceRect(tileRect({ level: 0, i, j: 3 }), cam, phone, 2);
      const b = deviceRect(tileRect({ level: 0, i: i + 1, j: 3 }), cam, phone, 2);
      expect(a.x + a.w).toBe(b.x);
      expect(Number.isInteger(a.x) && Number.isInteger(a.w)).toBe(true);
    }
  });
});

describe('capacité du cache', () => {
  it('≈64 tuiles à densité 2 et ≈128 à densité 1 sur téléphone', () => {
    const c2 = cacheCapacity(phone, 2, 4, 128, 256 * 2 ** 20);
    const c1 = cacheCapacity(phone, 1, 4, 128, 256 * 2 ** 20);
    expect(c2).toBeGreaterThanOrEqual(64);
    expect(c2).toBeLessThanOrEqual(80);
    expect(c1).toBe(128);
  });

  it('assez grand pour deux écrans de tuiles, plafonné en mémoire', () => {
    const big = { width: 2560, height: 1440 };
    const c = cacheCapacity(big, 2, 12, 128, 256 * 2 ** 20);
    expect(c).toBeLessThanOrEqual(256);
    expect(c).toBeGreaterThan(12 + 100);
  });
});
