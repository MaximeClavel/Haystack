// Textes d'affichage : typographie française, statuts des enquêtes, reprise sur la dernière trouvaille.
import { describe, expect, it } from 'vitest';
import type { CaseDef } from '../types';
import { CaseSession, defaultSave, entityCenter, restartCaseProgress, withCaseProgress } from '../game';
import { caseDef, makeWorld, person, prop, step } from '../game/testkit';
import { caseStatus, fr, lockReason, paragraphs, solvedCount } from './format';
import { lastFoundId } from './screens/investigation/overlays';

const NB = ' ';

describe('fr : ponctuation française', () => {
  it('espace insécable avant : ; ? ! » et après «', () => {
    expect(fr('Lequel ?')).toBe(`Lequel${NB}?`);
    expect(fr('Au voleur ! Vite : courez ; vite.')).toBe(`Au voleur${NB}! Vite${NB}: courez${NB}; vite.`);
    expect(fr('Il dit « bonjour » à tous')).toBe(`Il dit «${NB}bonjour${NB}» à tous`);
  });

  it('ne touche ni aux textes sans ponctuation haute ni aux espaces ordinaires', () => {
    expect(fr('Un texte simple, sans rien.')).toBe('Un texte simple, sans rien.');
    expect(fr('Rendez-vous à 10:30')).toBe('Rendez-vous à 10:30');
  });

  it('paragraphs : découpe sur les lignes vides, garde les retours à la ligne simples (vers) et applique fr', () => {
    const t = 'Début :\n\n« vers un\nvers deux »\n\nFin ?';
    expect(paragraphs(t)).toEqual([`Début${NB}:`, `«${NB}vers un\nvers deux${NB}»`, `Fin${NB}?`]);
  });
});

describe('statut des enquêtes : recommencer ne fait pas disparaître le résultat', () => {
  const A: CaseDef = caseDef({
    id: 'a1',
    entities: [person('a1.g', 400, 350), prop('a1.s', 'moneybag', 450, 350)],
    steps: [step('s1', ['a1.g']), step('s2', ['a1.s'])],
  });
  const B: CaseDef = caseDef({ id: 'b1', unlockAfter: ['a1'], entities: [person('b1.l', 300, 600)], steps: [step('s1', ['b1.l'])] });
  const world = makeWorld({ cases: [A, B] });
  const solved = (() => {
    const s = new CaseSession(A, world, null, { now: () => 3 });
    s.submit('s1', { point: entityCenter(world, 'a1.g'), entityId: 'a1.g' });
    s.submit('s2', { point: entityCenter(world, 'a1.s'), entityId: 'a1.s' });
    return s.progress();
  })();

  it('résolue : étoiles ; recommencée : « en cours » avec le meilleur résultat', () => {
    const done = withCaseProgress(defaultSave(), solved);
    expect(caseStatus(A, done)).toMatchObject({ kind: 'solved', stars: 3 });
    const again = withCaseProgress(defaultSave(), restartCaseProgress(A, solved));
    expect(caseStatus(A, again)).toMatchObject({ kind: 'active', solvedSteps: 0, stars: 3 });
    expect(caseStatus(A, defaultSave())).toMatchObject({ kind: 'new' });
  });

  it('solvedCount et lockReason comptent une enquête recommencée comme résolue', () => {
    const again = withCaseProgress(defaultSave(), restartCaseProgress(A, solved));
    expect(solvedCount([A, B], again)).toBe(1);
    expect(lockReason(B, again, [A, B])).toBe('');
    expect(lockReason(B, defaultSave(), [A, B])).toContain('Terminez');
  });
});

describe('lastFoundId : reprise sur la dernière trouvaille', () => {
  const C: CaseDef = caseDef({
    id: 'c9',
    entities: [person('c9.a', 100, 100), person('c9.b', 300, 300), person('c9.c', 500, 500)],
    steps: [step('s1', ['c9.a']), step('s2', ['c9.b'], { after: [] }), step('s3', ['c9.c'], { after: ['s1'] })],
  });
  const world = makeWorld({ cases: [C] });
  const pick = (id: string) => ({ point: entityCenter(world, id), entityId: id });

  it('null tant que rien n’est trouvé', () => {
    expect(lastFoundId(new CaseSession(C, world))).toBeNull();
  });

  it('suit l’ordre chronologique des résolutions, pas l’ordre du tableau', () => {
    let t = 0;
    const s = new CaseSession(C, world, null, { now: () => ++t });
    s.submit('s2', pick('c9.b')); // résolue en premier (branche parallèle)
    expect(lastFoundId(s)).toBe('c9.b');
    s.submit('s1', pick('c9.a'));
    expect(lastFoundId(s)).toBe('c9.a');
    s.submit('s3', pick('c9.c'));
    expect(lastFoundId(s)).toBe('c9.c');
  });
});
