import { describe, expect, it } from 'vitest';
import type { Entity, Rect } from '../types';
import { PICK_TOLERANCE_PX } from '../config';
import { pickAt, pickTolerance } from './pick';
import { baseEntities, makeWorld, person } from './testkit';

/** Monde de base + entités supplémentaires. */
function worldWith(...extra: Entity[]) {
  return makeWorld({ entities: [...baseEntities(), ...extra] });
}

describe('pickTolerance', () => {
  it('convertit la tolérance écran en unités monde', () => {
    expect(pickTolerance(1)).toBe(PICK_TOLERANCE_PX);
    expect(pickTolerance(2)).toBe(PICK_TOLERANCE_PX / 2);
    expect(pickTolerance(0.5)).toBe(PICK_TOLERANCE_PX * 2);
    expect(Number.isFinite(pickTolerance(0))).toBe(true);
  });
});

describe('pickAt', () => {
  it('désigne une entité touchée exactement', () => {
    const w = makeWorld();
    expect(pickAt(w, { x: 700, y: 250 }, 2)).toEqual({ point: { x: 700, y: 250 }, entityId: 'a.p.1' });
  });

  it('renvoie null quand rien n’est à portée (et garde le point)', () => {
    const w = makeWorld();
    expect(pickAt(w, { x: 50, y: 700 }, 2)).toEqual({ point: { x: 50, y: 700 }, entityId: null });
    // Une zone n'est pas une entité : pickAt ne la renvoie pas (submit s'en charge).
    expect(pickAt(w, { x: 150, y: 450 }, 2).entityId).toBeNull();
  });

  it('le point renvoyé est une copie', () => {
    const w = makeWorld();
    const p = { x: 700, y: 250 };
    const pick = pickAt(w, p, 2);
    p.x = 0;
    expect(pick.point).toEqual({ x: 700, y: 250 });
  });

  it('tolérance PICK_TOLERANCE_PX / zoom autour du rectangle de désignation', () => {
    const w = makeWorld();
    // Corps de a.p.1 : x ∈ [695, 705]. Le point (708, 250) est à 3 u du bord.
    expect(pickAt(w, { x: 708, y: 250 }, 2).entityId).toBe('a.p.1'); // t = 5
    expect(pickAt(w, { x: 708, y: 250 }, 1).entityId).toBe('a.p.1'); // t = 10
    expect(pickAt(w, { x: 708, y: 250 }, 4).entityId).toBeNull(); // t = 2,5
    // Au-dessus de la tête (y = 240 est le haut du corps).
    expect(pickAt(w, { x: 700, y: 236 }, 2).entityId).toBe('a.p.1');
    expect(pickAt(w, { x: 700, y: 236 }, 4).entityId).toBeNull();
    // Dézoomé : la tolérance grandit.
    expect(pickAt(w, { x: 720, y: 250 }, 0.5).entityId).toBe('a.p.1'); // t = 20
  });

  it('égalité : la plus en avant dans l’ordre de dessin (sortY)', () => {
    // Corps : x.a x ∈ [395, 405] y ∈ [330, 350] ; x.b x ∈ [399, 409] y ∈ [332, 352] (plus au sud).
    const w = worldWith(person('x.b', 404, 352), person('x.a', 400, 350));
    expect(pickAt(w, { x: 402, y: 340 }, 2).entityId).toBe('x.b');
    // Le haut de x.a n'est couvert que par lui.
    expect(pickAt(w, { x: 397, y: 331 }, 4).entityId).toBe('x.a');
  });

  it('égalité de sortY : départage par id (comme compareDrawOrder)', () => {
    const w = worldWith(person('x.b', 403, 350), person('x.a', 400, 350));
    expect(pickAt(w, { x: 402, y: 340 }, 2).entityId).toBe('x.b');
  });

  it('un contact exact l’emporte sur une entité plus en avant à portée de tolérance', () => {
    // B (devant, plus au sud) : corps x ∈ [409, 419], à 5 u du point.
    const w = worldWith(person('x.a', 400, 350), person('x.b', 414, 360));
    expect(pickAt(w, { x: 404, y: 345 }, 1).entityId).toBe('x.a');
  });

  it('sans contact exact : la plus en avant parmi celles à portée de tolérance', () => {
    // Le point (410, 340) est à 5 u de x.a (à gauche) et de x.b (à droite).
    expect(pickAt(worldWith(person('x.a', 400, 350), person('x.b', 420, 352)), { x: 410, y: 340 }, 1).entityId).toBe('x.b');
    expect(pickAt(worldWith(person('x.a', 400, 350), person('x.b', 420, 348)), { x: 410, y: 340 }, 1).entityId).toBe('x.a');
  });

  it('désigne un bâtiment par son toit ou sa façade', () => {
    const w = makeWorld();
    expect(pickAt(w, { x: 200, y: 30 }, 2).entityId).toBe('lm.banque'); // toit
    expect(pickAt(w, { x: 200, y: 190 }, 2).entityId).toBe('lm.banque'); // façade
    expect(pickAt(w, { x: 200, y: 205 }, 2).entityId).toBe('lm.banque'); // juste devant (tolérance)
    expect(pickAt(w, { x: 200, y: 215 }, 2).entityId).toBeNull();
  });

  it('une entité derrière un toit (dessinée avant le bâtiment) n’est pas désignable', () => {
    // Pieds en y = 90 : sol caché par le toit de la banque (y ∈ [20, 100)).
    const w = worldWith(person('x.cache', 200, 90));
    expect(pickAt(w, { x: 200, y: 80 }, 2).entityId).toBe('lm.banque');
    expect(pickAt(w, { x: 209, y: 80 }, 1).entityId).toBe('lm.banque');
  });

  it('une entité en hauteur (z > 0, sortY explicite) se désigne sur le toit', () => {
    // Sur le toit de la banque : corps y ∈ [150 − 80 − 20, 150 − 80] = [50, 70].
    const w = worldWith(person('x.toit', 150, 150, { z: 80, sortY: 201 }));
    expect(pickAt(w, { x: 150, y: 60 }, 2).entityId).toBe('x.toit');
    expect(pickAt(w, { x: 150, y: 90 }, 2).entityId).toBe('lm.banque');
  });

  it('exception « décor » : un passant devant une façade, frôlé du doigt, l’emporte sur le bâtiment', () => {
    // Passant devant la façade sud de la banque : corps x ∈ [195, 205], y ∈ [190, 210].
    const w = worldWith(person('x.devant', 200, 210));
    // (209, 195) : sur la façade, à 4 u du passant.
    expect(pickAt(w, { x: 209, y: 195 }, 1).entityId).toBe('x.devant'); // t = 10
    expect(pickAt(w, { x: 209, y: 195 }, 4).entityId).toBe('lm.banque'); // t = 2,5 : hors de portée
    expect(pickAt(w, { x: 250, y: 195 }, 1).entityId).toBe('lm.banque'); // loin du passant
    expect(pickAt(w, { x: 200, y: 195 }, 4).entityId).toBe('x.devant'); // contact exact
  });

  it('l’exception « décor » ne s’applique qu’aux bâtiments', () => {
    // Deux personnes : la plus en arrière est touchée exactement, l'autre est à portée → exacte.
    const w = worldWith(person('x.a', 400, 350), person('x.b', 409, 351));
    // x.b : x ∈ [404, 414] y ∈ [331, 351] ; (402, 340) touche x.a et est à 2 u de x.b.
    expect(pickAt(w, { x: 402, y: 340 }, 1).entityId).toBe('x.a');
  });

  it('interroge l’index spatial autour du point (tolérance comprise)', () => {
    const w = makeWorld();
    const queries: Rect[] = [];
    const inner = w.index;
    w.index = {
      query(r: Rect) {
        queries.push(r);
        return inner.query(r);
      },
    };
    pickAt(w, { x: 500, y: 500 }, 2);
    expect(queries).toHaveLength(1);
    const q = queries[0];
    const t = pickTolerance(2);
    expect(q.x).toBeLessThanOrEqual(500 - t);
    expect(q.y).toBeLessThanOrEqual(500 - t);
    expect(q.x + q.w).toBeGreaterThanOrEqual(500 + t);
    expect(q.y + q.h).toBeGreaterThanOrEqual(500 + t);
    expect(q.w).toBeLessThan(4 * t);
  });
});
