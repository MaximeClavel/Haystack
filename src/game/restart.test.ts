// Recommencer une enquête, meilleur résultat conservé (bestStars), déblocage et réconciliation.
import { describe, expect, it } from 'vitest';
import type { CaseDef, CaseProgress, SaveData } from '../types';
import { entityCenter } from './geometry';
import { bestStarsOf, CaseSession, newCaseProgress, restartCaseProgress } from './session';
import { defaultSave, hasSolved, isUnlocked, sanitizeCaseProgress, sanitizeSave, withCaseProgress } from './save';
import { reconcileSave } from './reconcile';
import { caseDef, makeWorld, person, prop, step } from './testkit';

const A = caseDef({
  id: 'a1',
  entities: [person('a1.gaston', 400, 350), prop('a1.sac', 'moneybag', 450, 350)],
  steps: [step('s1', ['a1.gaston']), step('s2', ['a1.sac'])],
});
const B = caseDef({ id: 'b1', unlockAfter: ['a1'], entities: [person('b1.lucie', 300, 600)], steps: [step('s1', ['b1.lucie'])] });
const world = makeWorld({ cases: [A, B] });
const pickOn = (id: string) => ({ point: entityCenter(world, id), entityId: id });

function solveA(opts: { mistakes?: number } = {}): CaseProgress {
  const s = new CaseSession(A, world, null, { now: () => 5 });
  for (let i = 0; i < (opts.mistakes ?? 0); i++) s.submit('s1', { point: { x: 5, y: 5 }, entityId: null });
  s.submit('s1', pickOn('a1.gaston'));
  s.submit('s2', pickOn('a1.sac'));
  return s.progress();
}

describe('bestStars : meilleur résultat des parties terminées', () => {
  it('une enquête résolue enregistre ses étoiles dans bestStars', () => {
    const p = solveA();
    expect(p.status).toBe('solved');
    expect(p.stars).toBe(3);
    expect(p.bestStars).toBe(3);
  });

  it('bestStarsOf : bestStars, ou les étoiles d’une partie résolue (ancienne sauvegarde), sinon rien', () => {
    expect(bestStarsOf(undefined)).toBeUndefined();
    expect(bestStarsOf(newCaseProgress(A))).toBeUndefined();
    expect(bestStarsOf({ ...newCaseProgress(A), status: 'solved', stars: 2 })).toBe(2);
    expect(bestStarsOf({ ...newCaseProgress(A), status: 'active', bestStars: 3 })).toBe(3);
    expect(bestStarsOf({ ...newCaseProgress(A), status: 'solved', stars: 3, bestStars: 1 })).toBe(3);
  });

  it('sanitizeCaseProgress conserve un bestStars valide et ignore les autres', () => {
    expect(sanitizeCaseProgress({ status: 'active', bestStars: 2 }, 'a1')?.bestStars).toBe(2);
    expect(sanitizeCaseProgress({ status: 'active', bestStars: 4 }, 'a1')?.bestStars).toBeUndefined();
    expect(sanitizeCaseProgress({ status: 'active', bestStars: '3' }, 'a1')?.bestStars).toBeUndefined();
  });
});

describe('recommencer', () => {
  it('restartCaseProgress : partie vierge qui garde le meilleur résultat', () => {
    const solved = solveA({ mistakes: 4 }); // 2 étoiles
    expect(solved.stars).toBe(2);
    const fresh = restartCaseProgress(A, solved);
    expect(fresh.status).toBe('new');
    expect(fresh.bestStars).toBe(2);
    expect(Object.values(fresh.steps).every((s) => s.found.length === 0)).toBe(true);
    expect(fresh.notes).toBe('');
    expect(restartCaseProgress(A, undefined).bestStars).toBeUndefined();
    expect(restartCaseProgress(A, newCaseProgress(A)).bestStars).toBeUndefined();
  });

  it('une partie recommencée garde bestStars en jouant, et le garde au maximum en finissant', () => {
    const fresh = restartCaseProgress(A, solveA({ mistakes: 4 })); // meilleur = 2
    const s = new CaseSession(A, world, fresh, { now: () => 9 });
    expect(s.progress().bestStars).toBe(2);
    s.submit('s1', pickOn('a1.gaston'));
    expect(s.progress().status).toBe('active');
    expect(s.progress().bestStars).toBe(2);
    s.submit('s2', pickOn('a1.sac'));
    const done = s.progress();
    expect(done.stars).toBe(3); // cette fois sans erreur
    expect(done.bestStars).toBe(3);
  });

  it('une moins bonne partie ne baisse pas le meilleur résultat', () => {
    const fresh = restartCaseProgress(A, solveA()); // meilleur = 3
    const s = new CaseSession(A, world, fresh, { now: () => 9 });
    s.hint('s1');
    s.submit('s1', pickOn('a1.gaston'));
    s.submit('s2', pickOn('a1.sac'));
    expect(s.progress().stars).toBe(2);
    expect(s.progress().bestStars).toBe(3);
  });

  it('une enquête résolue qui gagne une étape redevient active mais reste « résolue une fois »', () => {
    const solved = solveA();
    const bigger: CaseDef = { ...A, steps: [...A.steps, step('s3', ['a1.gaston'], { after: ['s2'] })] };
    const s = new CaseSession(bigger, world, solved);
    expect(s.progress().status).toBe('active');
    expect(s.progress().bestStars).toBe(3);
  });
});

describe('déblocage : « résolue au moins une fois »', () => {
  const save = (p?: CaseProgress): SaveData => ({ ...defaultSave(), cases: p ? { a1: p } : {} });

  it('hasSolved : résolue, ou recommencée après une résolution', () => {
    expect(hasSolved(undefined)).toBe(false);
    expect(hasSolved(newCaseProgress(A))).toBe(false);
    expect(hasSolved(solveA())).toBe(true);
    expect(hasSolved(restartCaseProgress(A, solveA()))).toBe(true);
  });

  it('isUnlocked : recommencer la précédente ne reverrouille pas la suivante', () => {
    expect(isUnlocked(B, save())).toBe(false);
    expect(isUnlocked(B, save(newCaseProgress(A)))).toBe(false);
    expect(isUnlocked(B, save(solveA()))).toBe(true);
    expect(isUnlocked(B, save(restartCaseProgress(A, solveA())))).toBe(true);
  });

  it('survit à l’aller-retour de la sauvegarde', () => {
    const s = withCaseProgress(defaultSave(), restartCaseProgress(A, solveA()));
    const back = sanitizeSave(JSON.parse(JSON.stringify(s)))!;
    expect(isUnlocked(B, back)).toBe(true);
    expect(back.cases.a1.bestStars).toBe(3);
  });
});

describe('reconcileSave', () => {
  it('ne change rien (même référence) quand la sauvegarde est cohérente', () => {
    const s = withCaseProgress(defaultSave(), solveA());
    expect(reconcileSave(s, [A, B], world)).toBe(s);
  });

  it('une enquête « résolue » dont une réponse n’existe plus repasse active', () => {
    const solved = solveA();
    const broken: CaseProgress = { ...solved, steps: { ...solved.steps, s1: { ...solved.steps.s1, found: ['a1.disparu'] } } };
    const s = withCaseProgress(defaultSave(), broken);
    // withCaseProgress (nettoyage) garde l'id inconnu : c'est CaseSession qui le retire.
    const out = reconcileSave(s, [A, B], world);
    expect(out).not.toBe(s);
    expect(out.cases.a1.status).toBe('active');
    expect(out.cases.a1.steps.s1.found).toEqual([]);
    expect(s.cases.a1.status).toBe('solved'); // l'original n'est pas modifié
  });

  it('une enquête inconnue du contenu est laissée telle quelle', () => {
    const orphan: CaseProgress = { ...newCaseProgress(A), caseId: 'zz', status: 'active' };
    const s = withCaseProgress(defaultSave(), orphan);
    expect(reconcileSave(s, [A, B], world)).toBe(s);
  });
});
