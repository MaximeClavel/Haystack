import { describe, expect, it } from 'vitest';
import {
  circleContains,
  entityCenter,
  halfDiagonal,
  pointInPolygon,
  polygonBBox,
  polygonCentroid,
  rectCenter,
  rectContains,
  rectsIntersect,
  targetCenter,
  targetExists,
  targetRect,
  unionRect,
} from './geometry';
import { makeWorld, rectPoly } from './testkit';

describe('géométrie élémentaire', () => {
  const r = { x: 10, y: 20, w: 30, h: 40 };

  it('rectContains : bords inclus, marge', () => {
    expect(rectContains(r, { x: 10, y: 20 })).toBe(true);
    expect(rectContains(r, { x: 40, y: 60 })).toBe(true);
    expect(rectContains(r, { x: 25, y: 40 })).toBe(true);
    expect(rectContains(r, { x: 9.9, y: 40 })).toBe(false);
    expect(rectContains(r, { x: 41, y: 40 })).toBe(false);
    expect(rectContains(r, { x: 41, y: 40 }, 1)).toBe(true);
    expect(rectContains(r, { x: 25, y: 62 }, 2)).toBe(true);
    expect(rectContains(r, { x: 25, y: 62.1 }, 2)).toBe(false);
  });

  it('rectsIntersect : stricte (se toucher ne compte pas)', () => {
    expect(rectsIntersect(r, { x: 39, y: 59, w: 5, h: 5 })).toBe(true);
    expect(rectsIntersect(r, { x: 40, y: 20, w: 5, h: 5 })).toBe(false);
    expect(rectsIntersect(r, { x: 0, y: 0, w: 10, h: 100 })).toBe(false);
    expect(rectsIntersect(r, { x: 0, y: 0, w: 100, h: 100 })).toBe(true);
  });

  it('centre, union, demi-diagonale, cercle', () => {
    expect(rectCenter(r)).toEqual({ x: 25, y: 40 });
    expect(unionRect(r, { x: 0, y: 50, w: 5, h: 50 })).toEqual({ x: 0, y: 20, w: 40, h: 80 });
    expect(halfDiagonal({ x: 0, y: 0, w: 6, h: 8 })).toBe(5);
    expect(circleContains({ x: 0, y: 0, radius: 5 }, { x: 3, y: 4 })).toBe(true);
    expect(circleContains({ x: 0, y: 0, radius: 5 }, { x: 3, y: 4.1 })).toBe(false);
  });

  it('pointInPolygon : carré et polygone concave (L)', () => {
    const sq = rectPoly(0, 0, 10, 10);
    expect(pointInPolygon(sq, { x: 5, y: 5 })).toBe(true);
    expect(pointInPolygon(sq, { x: 11, y: 5 })).toBe(false);
    const l = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(pointInPolygon(l, { x: 2, y: 8 })).toBe(true);
    expect(pointInPolygon(l, { x: 8, y: 2 })).toBe(true);
    expect(pointInPolygon(l, { x: 8, y: 8 })).toBe(false); // dans l'encoche
    expect(pointInPolygon([], { x: 0, y: 0 })).toBe(false);
  });

  it('polygonBBox et polygonCentroid', () => {
    expect(polygonBBox(rectPoly(5, 6, 7, 8))).toEqual({ x: 5, y: 6, w: 7, h: 8 });
    expect(polygonBBox([])).toEqual({ x: 0, y: 0, w: 0, h: 0 });
    expect(polygonCentroid(rectPoly(0, 0, 10, 20))).toEqual({ x: 5, y: 10 });
    // Sens inverse : même centroïde.
    expect(polygonCentroid(rectPoly(0, 0, 10, 20).reverse())).toEqual({ x: 5, y: 10 });
    const tri = polygonCentroid([
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 3 },
    ]);
    expect(tri.x).toBeCloseTo(2);
    expect(tri.y).toBeCloseTo(1);
    // Dégénéré (alignés) : moyenne des sommets.
    expect(
      polygonCentroid([
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 4, y: 0 },
      ]),
    ).toEqual({ x: 2, y: 0 });
    expect(polygonCentroid([])).toEqual({ x: 0, y: 0 });
  });
});

describe('cibles d’un monde (entités et zones)', () => {
  const world = makeWorld();

  it('entityCenter : centre du rectangle de désignation d’une entité', () => {
    // Personne « regular » en (700, 260) : corps x ∈ [695, 705], y ∈ [240, 260].
    expect(entityCenter(world, 'a.p.1')).toEqual({ x: 700, y: 250 });
    // Banque : emprise (100, 100, 200 × 100), hauteur 80 → toit + façade y ∈ [20, 200].
    expect(entityCenter(world, 'lm.banque')).toEqual({ x: 200, y: 110 });
    // Fontaine (objet 60 × 36 posé en (250, 500)).
    expect(entityCenter(world, 'lm.fontaine')).toEqual({ x: 250, y: 482 });
  });

  it('entityCenter : centroïde d’une zone', () => {
    expect(entityCenter(world, 'z.place')).toEqual({ x: 250, y: 500 });
  });

  it('entityCenter : erreur si l’id est inconnu', () => {
    expect(() => entityCenter(world, 'c01.inconnu')).toThrow(/inconnue/);
  });

  it('targetExists, targetRect, targetCenter', () => {
    expect(targetExists(world, 'lm.banque')).toBe(true);
    expect(targetExists(world, 'z.etang')).toBe(true);
    expect(targetExists(world, 'nope')).toBe(false);
    expect(targetRect(world, 'z.etang')).toEqual({ x: 600, y: 500, w: 300, h: 200 });
    expect(targetRect(world, 'lm.banque')).toEqual({ x: 100, y: 20, w: 200, h: 180 });
    expect(targetRect(world, 'nope')).toBeUndefined();
    expect(targetCenter(world, 'nope')).toBeUndefined();
  });
});
