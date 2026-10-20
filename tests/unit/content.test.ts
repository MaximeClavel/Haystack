// Tests de contenu : toutes les enquêtes publiées doivent être valides dans la vraie ville.
// Plus un garde-fou de la chaîne « contenu → monde → jeu » avec une enquête d'essai posée dans
// Meulebourg (vrai générateur, vrai index spatial, vraies zones et vrais lieux).
import { describe, expect, it } from 'vitest';
import type { CaseDef, PersonAppearance, Rect, Vec2, World } from '../../src/types';
import { getHitRect } from '../../src/art/bounds';
import { CASES } from '../../src/content';
import { buildWorld, findFreeSpots } from '../../src/world';
import { CaseSession, entityCenter, pickAt, validateAllCases } from '../../src/game';

describe('contenu : enquêtes publiées', () => {
  it('validateAllCases(CASES, buildWorld({ cases: CASES })) ne signale aucun problème', () => {
    const world = buildWorld({ cases: CASES });
    expect(validateAllCases(CASES, world)).toEqual([]);
  });
});

/* ------------------------------------------------------------------------- */

const ESSAI = 'essai';

/** Apparence voyante, sans sosie possible dans la foule (règle anti-sosie du monde). */
const OSCAR: PersonAppearance = {
  skin: 'tan',
  hair: 'curly',
  hairColor: 'red',
  hat: 'tophat',
  top: 'suit',
  topColor: 'purple',
  topPattern: 'checks',
  bottom: 'trousers',
  bottomColor: 'yellow',
  face: 'mustache',
  accessory: 'umbrella',
  build: 'large',
};

function near(a: Vec2, b: Vec2, d: number): boolean {
  return Math.abs(a.x - b.x) < d && Math.abs(a.y - b.y) < d;
}

/**
 * Deux emplacements libres sur la Grand-Place, à l'écart de tout ce qui n'est pas de la foule
 * ambiante (lieux, bâtiments, scènes des enquêtes publiées) pour que rien ne les masque.
 */
function pickSpots(world: World): [Vec2, Vec2] {
  const place = world.landmarks.find((l) => l.id === 'grand-place')!;
  const spots = findFreeSpots(world, place.rect, { step: 16, max: 2000 });
  const clear = spots.filter((s) => {
    const around: Rect = { x: s.x - 50, y: s.y - 70, w: 100, h: 120 };
    return world.index.query(around).every((e) => e.id.startsWith('a.') && e.kind !== 'building');
  });
  const a = clear[0];
  const b = clear.find((s) => !near(s, a, 80));
  if (!a || !b) throw new Error('pas assez d’emplacements libres sur la Grand-Place');
  return [a, b];
}

function essaiCase(a: Vec2, b: Vec2): CaseDef {
  return {
    id: ESSAI,
    title: 'Enquête d’essai',
    difficulty: 1,
    teaser: 'Un garde-fou des tests.',
    intro: 'Oscar a oublié sa valise.',
    start: { x: a.x, y: a.y, zoom: 2 },
    epilogue: 'Oscar retrouve sa valise.',
    characters: [
      {
        id: 'essai.oscar',
        name: 'Oscar',
        appearance: { ...OSCAR },
      },
    ],
    entities: [
      {
        id: 'essai.oscar',
        kind: 'person',
        x: a.x,
        y: a.y,
        character: 'essai.oscar',
        appearance: { ...OSCAR },
        pose: 'stand',
        facing: 'left',
      },
      { id: 'essai.valise', kind: 'prop', prop: 'suitcase', x: b.x, y: b.y },
    ],
    steps: [
      {
        id: 's1',
        question: 'Où est Oscar ?',
        accept: ['essai.oscar'],
        hints: [{ text: 'Il porte un haut-de-forme.' }, { text: 'Sur la Grand-Place.' }],
        solved: 'Le voilà.',
        thread: [['essai.oscar', 'essai.valise']],
      },
      {
        id: 's2',
        question: 'Où est sa valise ?',
        accept: ['essai.valise'],
        hints: [{ text: 'Elle est brune.' }, { text: 'Pas loin.' }],
        solved: 'La voilà.',
      },
      {
        id: 's3',
        question: 'Dans quelle banque travaille-t-il ?',
        after: [],
        accept: ['lm.banque'],
        hints: [{ text: 'À l’ouest de la place.' }, { text: 'Une grande façade.' }],
        solved: 'La banque, évidemment.',
      },
      {
        id: 's4',
        question: 'Sur quelle place l’a-t-on vu ?',
        after: ['s1'],
        accept: ['z.grand-place'],
        hints: [{ text: 'Au cœur de la ville.' }, { text: 'Devant l’hôtel de ville.' }],
        solved: 'La Grand-Place.',
      },
    ],
    replay: [
      { id: 'essai.oscar', caption: 'Oscar pose sa valise.' },
      { id: 'essai.valise', caption: 'Il l’oublie.' },
    ],
  };
}

describe('garde-fou : chaîne contenu → monde → jeu (enquête d’essai dans la vraie ville)', () => {
  const [a, b] = pickSpots(buildWorld({ cases: CASES }));
  const essai = essaiCase(a, b);
  const cases = [...CASES, essai];
  const world = buildWorld({ cases });

  it('l’enquête d’essai est valide avec les enquêtes publiées (aucun chevauchement)', () => {
    expect(validateAllCases(cases, world)).toEqual([]);
  });

  it('pickAt désigne les entités scénarisées dans la vraie ville', () => {
    for (const id of ['essai.oscar', 'essai.valise']) {
      expect(pickAt(world, entityCenter(world, id), 2).entityId).toBe(id);
      expect(pickAt(world, entityCenter(world, id), 4).entityId).toBe(id);
    }
  });

  it('une partie complète se joue sans faute (3 étoiles)', () => {
    const s = new CaseSession(essai, world, null, { now: () => 1 });
    expect(s.openSteps().map((x) => x.id)).toEqual(['s1', 's3']);
    expect(s.submit('s1', pickAt(world, entityCenter(world, 'essai.oscar'), 2)).kind).toBe('correct');
    expect(s.threads()).toHaveLength(1);
    expect(s.submit('s2', pickAt(world, entityCenter(world, 'essai.valise'), 2)).kind).toBe('correct');
    // La banque, par un tap au milieu de sa façade (quoi que pickAt y trouve).
    const bank = getHitRect(world.byId.get('lm.banque')!);
    const facade = { x: bank.x + bank.w / 2, y: bank.y + bank.h - 10 };
    expect(s.submit('s3', pickAt(world, facade, 2)).kind).toBe('correct');
    // La Grand-Place, par un tap en son centre (quelle que soit l'entité qui s'y trouve).
    const out = s.submit('s4', pickAt(world, entityCenter(world, 'z.grand-place'), 2));
    expect(out).toMatchObject({ kind: 'correct', caseSolved: true });
    expect(s.progress()).toMatchObject({ status: 'solved', stars: 3, solvedAt: 1 });
  });

  it('le projecteur automatique (indice 2) couvre la réponse dans la vraie ville', () => {
    const s = new CaseSession(essai, world);
    s.hint('s1');
    const area = s.hint('s1').area!;
    const r = getHitRect(world.byId.get('essai.oscar')!);
    for (const [x, y] of [
      [r.x, r.y],
      [r.x + r.w, r.y + r.h],
    ]) {
      expect(Math.hypot(x - area.x, y - area.y)).toBeLessThanOrEqual(area.radius);
    }
    expect(Math.hypot(area.x - (r.x + r.w / 2), area.y - (r.y + r.h / 2))).toBeGreaterThan(30);
  });
});
