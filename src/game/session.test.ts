import { describe, expect, it } from 'vitest';
import type { CaseDef, CaseProgress, Circle, Pick, Rect, StepProgress, World } from '../types';
import { getHitRect } from '../art/bounds';
import { entityCenter, halfDiagonal, rectCenter } from './geometry';
import {
  AUTO_HINT_RADIUS,
  CaseSession,
  computeStars,
  MAX_HINT_LEVEL,
  MAX_NOTES_LENGTH,
  MAX_PINS,
  matchTargets,
  MIN_REVEAL_RADIUS,
  newCaseProgress,
  requiredOf,
  REVEAL_TEXT,
  stepDependencies,
} from './session';
import { caseDef, makeWorld, person, prop, step } from './testkit';

/* --------------------------------------------------------------------------
 * Enquête de test « c99 » dans le monde factice (voir testkit.ts) :
 *   s1 (Gaston) → s2 (2 objets parmi 3) → s3 (la banque) ┐
 *   s4 (la place, ouverte dès le début : after [])        ├→ s5 (la fontaine)
 * ------------------------------------------------------------------------ */

function testCase(): CaseDef {
  return caseDef({
    id: 'c99',
    entities: [
      person('c99.gaston', 400, 350),
      prop('c99.sac', 'moneybag', 450, 350),
      prop('c99.cle', 'key', 480, 350),
      prop('c99.chien', 'dog', 520, 350),
      person('c99.temoin', 300, 700),
      person('c99.coin', 8, 795),
    ],
    steps: [
      step('s1', ['c99.gaston'], {
        nearMiss: [{ id: 'c99.temoin', feedback: 'Non : c’est le témoin.' }],
        thread: [['c99.gaston', 'c99.sac']],
      }),
      step('s2', ['c99.sac', 'c99.cle', 'c99.chien'], {
        required: 2,
        thread: [
          ['c99.sac', 'c99.cle'],
          ['c99.cle', 'c99.introuvable'],
        ],
      }),
      step('s3', ['lm.banque'], { nearMiss: [{ id: 'b.centre.1', feedback: 'Pas cette maison-là.' }] }),
      step('s4', ['z.place'], { after: [] }),
      step('s5', ['lm.fontaine'], { after: ['s3', 's4'] }),
    ],
  });
}

function setup(def: CaseDef = testCase(), progress?: CaseProgress) {
  const world = makeWorld({ cases: [def] });
  const clock = { t: 1000 };
  const session = new CaseSession(def, world, progress, { now: () => clock.t });
  return { def, world, clock, session };
}

/** Désignation « parfaite » d'une entité ou d'une zone (en son centre). */
function on(world: World, id: string): Pick {
  return { point: entityCenter(world, id), entityId: world.byId.has(id) ? id : null };
}

const ids = (steps: { id: string }[]) => steps.map((s) => s.id);

function rectInCircle(r: Rect, c: Circle): boolean {
  return [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x, r.y + r.h],
    [r.x + r.w, r.y + r.h],
  ].every(([x, y]) => Math.hypot(x - c.x, y - c.y) <= c.radius + 1e-9);
}

/** Résout toute l'enquête de test sans erreur ni indice. */
function solveAll(s: CaseSession, w: World): void {
  s.submit('s1', on(w, 'c99.gaston'));
  s.submit('s2', on(w, 'c99.sac'));
  s.submit('s2', on(w, 'c99.cle'));
  s.submit('s3', on(w, 'lm.banque'));
  s.submit('s4', on(w, 'z.place'));
  s.submit('s5', on(w, 'lm.fontaine'));
}

/* -------------------------------------------------------------------------- */

describe('dépendances et disponibilité des étapes', () => {
  it('stepDependencies : after, sinon l’étape précédente (aucune pour la première)', () => {
    const def = testCase();
    expect(stepDependencies(def, 0)).toEqual([]);
    expect(stepDependencies(def, 1)).toEqual(['s1']);
    expect(stepDependencies(def, 2)).toEqual(['s2']);
    expect(stepDependencies(def, 3)).toEqual([]);
    expect(stepDependencies(def, 4)).toEqual(['s3', 's4']);
  });

  it('au départ : la première étape et les branches parallèles (after: [])', () => {
    const { session } = setup();
    expect(ids(session.openSteps())).toEqual(['s1', 's4']);
    expect(session.solvedSteps()).toEqual([]);
    expect(session.isStepUnlocked('s2')).toBe(false);
    expect(session.isStepOpen('s4')).toBe(true);
    expect(session.isSolved()).toBe(false);
    expect(session.progress().status).toBe('new');
  });

  it('l’ordre suit la résolution ; une étape à plusieurs dépendances attend toutes', () => {
    const { session: s, world: w } = setup();
    s.submit('s4', on(w, 'z.place'));
    expect(ids(s.openSteps())).toEqual(['s1']);
    expect(ids(s.solvedSteps())).toEqual(['s4']);
    s.submit('s1', on(w, 'c99.gaston'));
    expect(ids(s.openSteps())).toEqual(['s2']);
    s.submit('s2', on(w, 'c99.sac'));
    s.submit('s2', on(w, 'c99.chien'));
    expect(ids(s.openSteps())).toEqual(['s3']);
    expect(s.isStepUnlocked('s5')).toBe(false);
    s.submit('s3', on(w, 'lm.banque'));
    expect(ids(s.openSteps())).toEqual(['s5']);
    expect(ids(s.solvedSteps())).toEqual(['s1', 's2', 's3', 's4']);
  });

  it('soumettre sur une étape non ouverte, résolue ou inconnue lève une erreur', () => {
    const { session: s, world: w } = setup();
    expect(() => s.submit('s2', on(w, 'c99.sac'))).toThrow(/pas ouverte/);
    expect(() => s.submit('s9', on(w, 'c99.sac'))).toThrow(/inconnue/);
    s.submit('s1', on(w, 'c99.gaston'));
    expect(() => s.submit('s1', on(w, 'c99.gaston'))).toThrow(/pas ouverte/);
    expect(s.stepProgress('s2').mistakes).toBe(0);
  });

  it('ids d’étapes en double : erreur à la construction', () => {
    const def = caseDef({ id: 'c98', steps: [step('s1', ['lm.banque']), step('s1', ['lm.banque'])] });
    expect(() => new CaseSession(def, makeWorld())).toThrow(/double/);
  });
});

describe('submit', () => {
  it('mauvaise réponse : « wrong », une erreur de plus, enquête commencée', () => {
    const { session: s, world: w, clock } = setup();
    clock.t = 5000;
    expect(s.submit('s1', { point: { x: 50, y: 700 }, entityId: null })).toEqual({ kind: 'wrong', stepId: 's1' });
    expect(s.submit('s1', on(w, 'a.p.1'))).toEqual({ kind: 'wrong', stepId: 's1' });
    expect(s.stepProgress('s1').mistakes).toBe(2);
    const p = s.progress();
    expect(p.status).toBe('active');
    expect(p.startedAt).toBe(5000);
  });

  it('fausse piste : « near » avec son message, pas une erreur', () => {
    const { session: s, world: w } = setup();
    expect(s.submit('s1', on(w, 'c99.temoin'))).toEqual({ kind: 'near', stepId: 's1', feedback: 'Non : c’est le témoin.' });
    expect(s.stepProgress('s1').mistakes).toBe(0);
    expect(s.progress().status).toBe('active');
  });

  it('bonne réponse : étape résolue, horodatée', () => {
    const { session: s, world: w, clock } = setup();
    clock.t = 7000;
    expect(s.submit('s1', on(w, 'c99.gaston'))).toEqual({
      kind: 'correct',
      stepId: 's1',
      foundId: 'c99.gaston',
      found: 1,
      required: 1,
      stepSolved: true,
      caseSolved: false,
    });
    expect(s.stepProgress('s1')).toEqual({ found: ['c99.gaston'], hints: 0, mistakes: 0, solvedAt: 7000 });
    expect(s.isStepSolved('s1')).toBe(true);
  });

  it('réponses multiples : required distinctes, « already » pour une réponse déjà trouvée', () => {
    const { session: s, world: w } = setup();
    s.submit('s1', on(w, 'c99.gaston'));
    const first = s.submit('s2', on(w, 'c99.sac'));
    expect(first).toMatchObject({ kind: 'correct', foundId: 'c99.sac', found: 1, required: 2, stepSolved: false });
    expect(s.isStepOpen('s2')).toBe(true);
    expect(s.submit('s2', on(w, 'c99.sac'))).toEqual({ kind: 'already', stepId: 's2' });
    expect(s.stepProgress('s2').mistakes).toBe(0);
    const second = s.submit('s2', on(w, 'c99.cle'));
    expect(second).toMatchObject({ kind: 'correct', foundId: 'c99.cle', found: 2, required: 2, stepSolved: true });
    expect(s.foundMarks()).toEqual([
      { stepId: 's1', id: 'c99.gaston' },
      { stepId: 's2', id: 'c99.sac' },
      { stepId: 's2', id: 'c99.cle' },
    ]);
  });

  it('bâtiment : un tap sur la façade compte même si un passant est désigné devant', () => {
    const { session: s, world: w } = setup();
    solveUpTo3(s, w);
    // Point sur la façade de la banque ; pickAt aurait désigné un passant devant elle.
    expect(s.submit('s3', { point: { x: 209, y: 195 }, entityId: 'a.p.passant' })).toMatchObject({
      kind: 'correct',
      foundId: 'lm.banque',
    });
  });

  it('bâtiment fausse piste : même logique (façade) → « near »', () => {
    const { session: s, world: w } = setup();
    solveUpTo3(s, w);
    expect(s.submit('s3', { point: { x: 560, y: 150 }, entityId: 'a.p.passant' })).toEqual({
      kind: 'near',
      stepId: 's3',
      feedback: 'Pas cette maison-là.',
    });
    expect(s.submit('s3', { point: { x: 560, y: 300 }, entityId: null })).toEqual({ kind: 'wrong', stepId: 's3' });
  });

  it('zone : un point dans le polygone, quelle que soit l’entité désignée', () => {
    const { session: s } = setup();
    expect(s.submit('s4', { point: { x: 390, y: 590 }, entityId: 'lm.fontaine' })).toMatchObject({
      kind: 'correct',
      foundId: 'z.place',
    });
  });

  it('zone : un point hors du polygone est une erreur', () => {
    const { session: s } = setup();
    expect(s.submit('s4', { point: { x: 410, y: 590 }, entityId: null })).toEqual({ kind: 'wrong', stepId: 's4' });
  });

  it('dernière étape : caseSolved, statut « solved », étoiles et date', () => {
    const { session: s, world: w, clock } = setup();
    s.submit('s1', on(w, 'c99.gaston'));
    s.submit('s2', on(w, 'c99.sac'));
    s.submit('s2', on(w, 'c99.cle'));
    s.submit('s3', on(w, 'lm.banque'));
    s.submit('s4', on(w, 'z.place'));
    clock.t = 99000;
    const last = s.submit('s5', on(w, 'lm.fontaine'));
    expect(last).toMatchObject({ kind: 'correct', stepSolved: true, caseSolved: true });
    expect(s.isSolved()).toBe(true);
    expect(s.openSteps()).toEqual([]);
    const p = s.progress();
    expect(p.status).toBe('solved');
    expect(p.solvedAt).toBe(99000);
    expect(p.stars).toBe(3);
  });
});

function solveUpTo3(s: CaseSession, w: World): void {
  s.submit('s1', on(w, 'c99.gaston'));
  s.submit('s2', on(w, 'c99.sac'));
  s.submit('s2', on(w, 'c99.cle'));
}

describe('matchTargets et requiredOf', () => {
  it('ordre : entité désignée, puis zones, puis bâtiments (sans doublon)', () => {
    const w = makeWorld({
      zones: [
        { id: 'z.grand', label: 'grand', points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 800 }, { x: 0, y: 800 }] },
        { id: 'z.plat', label: 'dégénérée', points: [{ x: 0, y: 0 }, { x: 1000, y: 800 }] },
      ],
    });
    const pick: Pick = { point: { x: 200, y: 150 }, entityId: 'a.p.1' };
    expect(matchTargets(w, ['lm.banque', 'z.grand', 'a.p.1', 'z.plat'], pick)).toEqual(['a.p.1', 'z.grand', 'lm.banque']);
    expect(matchTargets(w, ['b.centre.1', 'lm.fontaine'], pick)).toEqual([]);
    expect(matchTargets(w, ['inconnu'], { point: { x: 1, y: 1 }, entityId: null })).toEqual([]);
  });

  it('requiredOf : défaut 1, borné à [1, accept.length], entier', () => {
    expect(requiredOf(step('s', ['a', 'b', 'c']))).toBe(1);
    expect(requiredOf(step('s', ['a', 'b', 'c'], { required: 2 }))).toBe(2);
    expect(requiredOf(step('s', ['a', 'b', 'c'], { required: 9 }))).toBe(3);
    expect(requiredOf(step('s', ['a', 'b', 'c'], { required: 0 }))).toBe(1);
    expect(requiredOf(step('s', ['a', 'b', 'c'], { required: 2.7 }))).toBe(2);
    expect(requiredOf(step('s', ['a', 'b', 'c'], { required: Number.NaN }))).toBe(1);
  });
});

describe('indices', () => {
  it('niveau 1 : texte du premier indice ; currentHint le redonne', () => {
    const { session: s } = setup();
    expect(s.currentHint('s1')).toBeNull();
    expect(s.hint('s1')).toEqual({ level: 1, text: 'Indice 1 de s1.' });
    expect(s.currentHint('s1')).toEqual({ level: 1, text: 'Indice 1 de s1.' });
    expect(s.stepProgress('s1').hints).toBe(1);
    expect(s.progress().status).toBe('active');
  });

  it('niveau 2 automatique : cercle ~220 u, décalé, contenant la réponse', () => {
    const { session: s, world: w } = setup();
    s.hint('s1');
    const h = s.hint('s1');
    expect(h.level).toBe(2);
    expect(h.text).toBe('Indice 2 de s1.');
    const area = h.area!;
    expect(area.radius).toBeGreaterThanOrEqual(AUTO_HINT_RADIUS);
    expect(area.radius).toBeLessThan(AUTO_HINT_RADIUS * 1.2);
    const r = getHitRect(w.byId.get('c99.gaston')!);
    const c = rectCenter(r);
    // Décalé : ne pointe pas la réponse…
    expect(Math.hypot(area.x - c.x, area.y - c.y)).toBeGreaterThan(0.3 * (area.radius - halfDiagonal(r)));
    // … mais la contient entièrement.
    expect(rectInCircle(r, area)).toBe(true);
    expect(s.currentHint('s1')).toEqual(h);
  });

  it('niveau 2 automatique : déterministe, et propre à chaque étape', () => {
    const a = setup();
    const b = setup();
    for (const x of [a, b]) {
      x.session.hint('s4');
      x.session.hint('s4');
    }
    expect(a.session.currentHint('s4')).toEqual(b.session.currentHint('s4'));
    // Une autre enquête (autre graine) avec la même réponse : décalage différent.
    const other = caseDef({ id: 'c97', steps: [step('s4', ['z.place'])] });
    const o = new CaseSession(other, makeWorld());
    o.hint('s4');
    const oa = o.hint('s4').area!;
    const aa = a.session.currentHint('s4')!.area!;
    expect(oa.x !== aa.x || oa.y !== aa.y).toBe(true);
  });

  it('niveau 2 automatique près d’un bord : centre dans le monde, réponse toujours couverte', () => {
    const def = testCase();
    def.steps.push(step('s6', ['c99.coin'], { after: [] }));
    const { session: s, world: w } = setup(def);
    s.hint('s6');
    const area = s.hint('s6').area!;
    expect(area.x).toBeGreaterThanOrEqual(0);
    expect(area.x).toBeLessThanOrEqual(w.width);
    expect(area.y).toBeGreaterThanOrEqual(0);
    expect(area.y).toBeLessThanOrEqual(w.height);
    expect(rectInCircle(getHitRect(w.byId.get('c99.coin')!), area)).toBe(true);
  });

  it('niveau 2 : la zone donnée par le contenu est utilisée telle quelle', () => {
    const def = testCase();
    const given = { x: 420, y: 330, radius: 150 };
    def.steps[0].hints[1] = { text: 'Cherchez près de la banque.', area: given };
    const { session: s } = setup(def);
    s.hint('s1');
    const h = s.hint('s1');
    expect(h).toEqual({ level: 2, text: 'Cherchez près de la banque.', area: given });
    expect(h.area).not.toBe(given); // copie
  });

  it('niveau 3 : révélation serrée de la réponse ; au-delà, on reste au niveau 3', () => {
    const { session: s, world: w } = setup();
    s.hint('s1');
    s.hint('s1');
    const h = s.hint('s1');
    expect(h.level).toBe(3);
    expect(h.text).toBe(REVEAL_TEXT);
    expect(h.reveal).toEqual(['c99.gaston']);
    const r = getHitRect(w.byId.get('c99.gaston')!);
    expect(rectInCircle(r, h.area!)).toBe(true);
    expect(h.area!.radius).toBeGreaterThanOrEqual(MIN_REVEAL_RADIUS);
    expect(h.area!.radius).toBeLessThan(60);
    expect(s.hint('s1')).toEqual(h);
    expect(s.stepProgress('s1').hints).toBe(MAX_HINT_LEVEL);
    // La révélation n'est pas une réponse : il faut encore désigner.
    expect(s.isStepSolved('s1')).toBe(false);
  });

  it('niveau 3 : seulement les réponses non trouvées nécessaires', () => {
    const { session: s, world: w } = setup();
    s.submit('s1', on(w, 'c99.gaston'));
    for (let i = 0; i < 3; i++) s.hint('s2');
    const all = s.currentHint('s2')!;
    expect(all.reveal).toEqual(['c99.sac', 'c99.cle']);
    // Réponses proches : un seul cercle les couvre toutes les deux.
    for (const id of all.reveal!) expect(rectInCircle(getHitRect(w.byId.get(id)!), all.area!)).toBe(true);
    s.submit('s2', on(w, 'c99.sac'));
    expect(s.currentHint('s2')!.reveal).toEqual(['c99.cle']);
    s.submit('s2', on(w, 'c99.chien'));
    expect(s.currentHint('s2')).toBeNull(); // étape résolue
  });

  it('niveau 3 : réponses éloignées → cercle serré autour de la première', () => {
    const def = testCase();
    def.steps.push(step('s6', ['c99.gaston', 'c99.coin'], { after: [], required: 2 }));
    const { session: s, world: w } = setup(def);
    for (let i = 0; i < 3; i++) s.hint('s6');
    const h = s.currentHint('s6')!;
    expect(h.reveal).toEqual(['c99.gaston', 'c99.coin']);
    expect(rectInCircle(getHitRect(w.byId.get('c99.gaston')!), h.area!)).toBe(true);
    expect(h.area!.radius).toBeLessThan(AUTO_HINT_RADIUS);
  });

  it('currentHint suit les réponses trouvées (niveau 2 automatique)', () => {
    const { session: s, world: w } = setup();
    s.submit('s1', on(w, 'c99.gaston'));
    s.hint('s2');
    const before = s.hint('s2').area!;
    expect(rectInCircle(getHitRect(w.byId.get('c99.sac')!), before)).toBe(true);
    s.submit('s2', on(w, 'c99.sac'));
    const after = s.currentHint('s2')!.area!;
    expect(rectInCircle(getHitRect(w.byId.get('c99.cle')!), after)).toBe(true);
    expect(after).not.toEqual(before);
  });

  it('indice sur une étape non ouverte : erreur ; currentHint nul après résolution', () => {
    const { session: s, world: w } = setup();
    expect(() => s.hint('s2')).toThrow(/pas ouverte/);
    s.hint('s1');
    s.submit('s1', on(w, 'c99.gaston'));
    expect(s.currentHint('s1')).toBeNull();
    expect(() => s.hint('s1')).toThrow(/pas ouverte/);
  });
});

describe('fils rouges', () => {
  it('seulement pour les étapes résolues, ids inconnus ignorés', () => {
    const { session: s, world: w } = setup();
    expect(s.threads()).toEqual([]);
    s.submit('s1', on(w, 'c99.gaston'));
    expect(s.threads()).toEqual([
      {
        stepId: 's1',
        ids: ['c99.gaston', 'c99.sac'],
        from: entityCenter(w, 'c99.gaston'),
        to: entityCenter(w, 'c99.sac'),
      },
    ]);
    s.submit('s2', on(w, 'c99.sac'));
    expect(s.threads()).toHaveLength(1); // s2 pas encore résolue
    s.submit('s2', on(w, 'c99.cle'));
    const t = s.threads();
    expect(t).toHaveLength(2); // le fil vers « c99.introuvable » est ignoré
    expect(t[1]).toMatchObject({ stepId: 's2', ids: ['c99.sac', 'c99.cle'] });
  });
});

describe('étoiles', () => {
  const sp = (hints: number, mistakes: number): StepProgress => ({ found: [], hints, mistakes });

  it('computeStars : règle documentée (STAR_RULES)', () => {
    expect(computeStars([sp(0, 0), sp(0, 0)])).toBe(3);
    expect(computeStars([sp(0, 2), sp(0, 0)])).toBe(3);
    expect(computeStars([sp(0, 2), sp(0, 1)])).toBe(2); // 3 erreurs
    expect(computeStars([sp(1, 0), sp(0, 0)])).toBe(2); // un indice
    expect(computeStars([sp(2, 0), sp(0, 0)])).toBe(2); // 2 niveaux pour 2 étapes
    expect(computeStars([sp(2, 0), sp(1, 0)])).toBe(1); // 3 niveaux pour 2 étapes
    expect(computeStars([sp(0, 6), sp(0, 0)])).toBe(2);
    expect(computeStars([sp(0, 7), sp(0, 0)])).toBe(1);
    expect(computeStars([sp(3, 0)], 5)).toBe(1); // une révélation
    expect(computeStars([sp(2, 0)], 5)).toBe(2);
    expect(computeStars([])).toBe(3);
  });

  it('partie sans faute : 3 étoiles ; avec indices ou erreurs : moins', () => {
    const perfect = setup();
    solveAll(perfect.session, perfect.world);
    expect(perfect.session.stars()).toBe(3);

    const hinted = setup();
    hinted.session.hint('s1');
    solveAll(hinted.session, hinted.world);
    expect(hinted.session.stars()).toBe(2);
    expect(hinted.session.progress().stars).toBe(2);

    const revealed = setup();
    for (let i = 0; i < 3; i++) revealed.session.hint('s4');
    solveAll(revealed.session, revealed.world);
    expect(revealed.session.stars()).toBe(1);
  });

  it('estimation avant la fin, figée à la résolution', () => {
    const { session: s, world: w } = setup();
    expect(s.stars()).toBe(3);
    for (let i = 0; i < 3; i++) s.submit('s1', { point: { x: 50, y: 700 }, entityId: null });
    expect(s.stars()).toBe(2);
    expect(s.progress().stars).toBeUndefined();
    s.submit('s1', on(w, 'c99.gaston'));
    s.submit('s2', on(w, 'c99.sac'));
    s.submit('s2', on(w, 'c99.cle'));
    s.submit('s3', on(w, 'lm.banque'));
    s.submit('s4', on(w, 'z.place'));
    s.submit('s5', on(w, 'lm.fontaine'));
    expect(s.progress().stars).toBe(2);
    expect(s.totals()).toEqual({ mistakes: 3, hints: 0 });
  });
});

describe('progression et reprise', () => {
  it('progression vierge', () => {
    const def = testCase();
    expect(newCaseProgress(def)).toEqual({
      caseId: 'c99',
      status: 'new',
      steps: Object.fromEntries(def.steps.map((st) => [st.id, { found: [], hints: 0, mistakes: 0 }])),
      pins: [],
      notes: '',
    });
    expect(setup().session.progress()).toEqual(newCaseProgress(def));
  });

  it('progress() est une copie sérialisable', () => {
    const { session: s, world: w } = setup();
    s.submit('s1', on(w, 'c99.gaston'));
    s.addPin({ x: 10, y: 20 });
    const p = s.progress();
    expect(JSON.parse(JSON.stringify(p))).toEqual(p);
    p.steps.s1.found.push('x');
    p.pins[0].x = 999;
    p.notes = 'modifié';
    p.status = 'solved';
    expect(s.stepProgress('s1').found).toEqual(['c99.gaston']);
    expect(s.pins()).toEqual([{ x: 10, y: 20 }]);
    expect(s.progress().status).toBe('active');
  });

  it('reprise depuis une progression sauvegardée (aller-retour JSON)', () => {
    const a = setup();
    a.session.submit('s1', { point: { x: 50, y: 700 }, entityId: null });
    a.session.submit('s1', on(a.world, 'c99.gaston'));
    a.session.submit('s2', on(a.world, 'c99.sac'));
    a.session.hint('s2');
    a.session.addPin({ x: 1, y: 2 });
    a.session.setNotes('Gaston ment.');
    const saved = JSON.parse(JSON.stringify(a.session.progress())) as CaseProgress;

    const b = setup(testCase(), saved);
    expect(b.session.progress()).toEqual(a.session.progress());
    expect(ids(b.session.openSteps())).toEqual(['s2', 's4']);
    expect(b.session.currentHint('s2')).toEqual(a.session.currentHint('s2'));
    expect(b.session.submit('s2', on(b.world, 'c99.sac'))).toEqual({ kind: 'already', stepId: 's2' });
    expect(b.session.submit('s2', on(b.world, 'c99.cle'))).toMatchObject({ kind: 'correct', stepSolved: true });
    expect(b.session.stepProgress('s1').mistakes).toBe(1);
    expect(b.session.notes()).toBe('Gaston ment.');
    // La progression fournie n'est pas modifiée par la session.
    expect(saved.steps.s2.found).toEqual(['c99.sac']);
  });

  it('reprise : la progression est nettoyée', () => {
    const dirty = {
      caseId: 'c99',
      status: 'active',
      steps: {
        s1: { found: ['c99.gaston', 'c99.gaston', 'c99.faux'], hints: 9, mistakes: -4, solvedAt: 1234 },
        s2: { found: ['c99.sac'], hints: 1.7, mistakes: 3 },
        ancienne: { found: ['x'], hints: 0, mistakes: 0 },
      },
      pins: [{ x: 1, y: 2 }, { x: Number.NaN, y: 0 }, null],
      notes: 'n'.repeat(MAX_NOTES_LENGTH + 50),
    } as unknown as CaseProgress;
    const { session: s } = setup(testCase(), dirty);
    const p = s.progress();
    expect(p.steps.s1).toEqual({ found: ['c99.gaston'], hints: MAX_HINT_LEVEL, mistakes: 0, solvedAt: 1234 });
    expect(p.steps.s2).toEqual({ found: ['c99.sac'], hints: 1, mistakes: 3 });
    expect(p.steps.s3).toEqual({ found: [], hints: 0, mistakes: 0 });
    expect(p.steps.ancienne).toBeUndefined();
    expect(p.pins).toEqual([{ x: 1, y: 2 }]);
    expect(p.notes).toHaveLength(MAX_NOTES_LENGTH);
    expect(p.status).toBe('active');
  });

  it('reprise : progression d’une autre enquête refusée', () => {
    const p = newCaseProgress(testCase());
    p.caseId = 'c01';
    expect(() => setup(testCase(), p)).toThrow(/c01/);
  });

  it('reprise d’une enquête résolue : statut, date et étoiles conservés', () => {
    const a = setup();
    a.session.hint('s1');
    solveAll(a.session, a.world);
    const saved = a.session.progress();
    expect(saved.stars).toBe(2);
    const b = setup(testCase(), saved);
    expect(b.session.isSolved()).toBe(true);
    expect(b.session.progress()).toEqual(saved);
    // Étoiles absentes de la sauvegarde : recalculées.
    const noStars = { ...saved };
    delete noStars.stars;
    expect(setup(testCase(), noStars).session.progress().stars).toBe(2);
  });

  it('reprise après l’ajout d’une étape au contenu : l’enquête redevient active', () => {
    const a = setup();
    solveAll(a.session, a.world);
    const def = testCase();
    def.steps.push(step('s6', ['c99.chien']));
    const b = setup(def, a.session.progress());
    const p = b.session.progress();
    expect(p.status).toBe('active');
    expect(p.stars).toBeUndefined();
    expect(p.solvedAt).toBeUndefined();
    expect(ids(b.session.openSteps())).toEqual(['s6']);
    expect(b.session.submit('s6', on(b.world, 'c99.chien'))).toMatchObject({ caseSolved: true });
  });

  it('une progression intacte reste « new »', () => {
    const { session: s } = setup(testCase(), newCaseProgress(testCase()));
    expect(s.progress().status).toBe('new');
  });
});

describe('carnet : punaises et notes', () => {
  it('ajout, lecture, retrait de punaises', () => {
    const { session: s } = setup();
    expect(s.addPin({ x: 10, y: 20 })).toBe(0);
    expect(s.addPin({ x: 30, y: 40 })).toBe(1);
    expect(s.progress().status).toBe('active');
    const pins = s.pins();
    pins[0].x = 0;
    expect(s.pins()).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
    expect(s.removePin(0)).toBe(true);
    expect(s.pins()).toEqual([{ x: 30, y: 40 }]);
    expect(s.removePin(5)).toBe(false);
    expect(s.removePin(-1)).toBe(false);
    expect(s.removePin(0.5)).toBe(false);
    expect(s.pins()).toHaveLength(1);
  });

  it('punaises ramenées dans le monde ; coordonnées non finies refusées', () => {
    const { session: s, world: w } = setup();
    s.addPin({ x: -50, y: w.height + 100 });
    expect(s.pins()).toEqual([{ x: 0, y: w.height }]);
    expect(() => s.addPin({ x: Number.NaN, y: 0 })).toThrow();
    expect(() => s.addPin({ x: 0, y: Number.POSITIVE_INFINITY })).toThrow();
  });

  it(`au plus ${MAX_PINS} punaises : la plus ancienne est retirée`, () => {
    const { session: s } = setup();
    for (let i = 0; i < MAX_PINS + 3; i++) s.addPin({ x: i, y: i });
    const pins = s.pins();
    expect(pins).toHaveLength(MAX_PINS);
    expect(pins[0]).toEqual({ x: 3, y: 3 });
    expect(pins[MAX_PINS - 1]).toEqual({ x: MAX_PINS + 2, y: MAX_PINS + 2 });
  });

  it('notes : remplacées, tronquées, sauvegardées', () => {
    const { session: s } = setup();
    s.setNotes('Le sac est rouge.');
    expect(s.notes()).toBe('Le sac est rouge.');
    expect(s.progress().notes).toBe('Le sac est rouge.');
    expect(s.progress().status).toBe('active');
    s.setNotes('x'.repeat(MAX_NOTES_LENGTH * 2));
    expect(s.notes()).toHaveLength(MAX_NOTES_LENGTH);
  });
});
