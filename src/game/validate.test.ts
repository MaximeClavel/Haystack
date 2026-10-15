import { describe, expect, it } from 'vitest';
import type { CaseDef, PersonEntity, PropEntity, VehicleEntity, World } from '../types';
import { validateAllCases, validateCase } from './validate';
import { caseDef, LOOK, makeWorld, person, prop, rectPoly, step, vehicle } from './testkit';

/* --------------------------------------------------------------------------
 * Enquête valide de référence dans le monde factice (voir testkit.ts), qui exerce les
 * exemptions de placement : personne sur un toit (z > 0), personne à une fenêtre, bateau
 * et canard sur l'eau. Chaque test la modifie pour provoquer UNE erreur.
 * ------------------------------------------------------------------------ */

function validCase(): CaseDef {
  return caseDef({
    id: 'c99',
    title: 'Le sac de Gaston',
    difficulty: 2,
    teaser: 'Un sac disparaît.',
    intro: 'Gaston a perdu son sac.\n\nRetrouvez-le.',
    epilogue: 'Affaire classée.',
    start: { x: 500, y: 400, zoom: 2 },
    characters: [{ id: 'c99.gaston', name: 'Gaston', role: 'le suspect', appearance: { ...LOOK, topColor: 'green' } }],
    entities: [
      person('c99.gaston', 400, 350, { character: 'c99.gaston' }),
      prop('c99.sac', 'moneybag', 450, 350),
      prop('c99.cle', 'key', 480, 350),
      person('c99.temoin', 300, 700),
      vehicle('c99.barque', 'boat', 750, 600),
      person('c99.voleur', 150, 150, { z: 80, sortY: 201, pose: 'sneak' }),
      person('c99.fenetre', 250, 200, { pose: 'window', z: 30, sortY: 200.5 }),
      prop('c99.canard', 'duck', 700, 550),
    ],
    zones: [{ id: 'c99.zone.jardin', label: 'le jardin', points: rectPoly(700, 320, 200, 130) }],
    landmarkOverrides: { banque: { sign: 'BANQUE DUPONT', features: [{ kind: 'brokenWindow', at: 0.3 }] } },
    steps: [
      step('s1', ['c99.gaston'], {
        nearMiss: [{ id: 'c99.temoin', feedback: 'C’est le témoin.' }],
        hints: [{ text: 'Il porte du vert.' }, { text: 'Près de la route.', area: { x: 420, y: 330, radius: 150 } }],
        thread: [['c99.gaston', 'c99.sac']],
      }),
      step('s2', ['c99.sac', 'c99.cle'], { required: 2 }),
      step('s3', ['lm.banque'], { nearMiss: [{ id: 'b.centre.1', feedback: 'Pas celle-ci.' }] }),
      step('s4', ['z.place', 'c99.zone.jardin'], { after: [] }),
    ],
    replay: [
      { id: 'c99.gaston', caption: 'Gaston arrive.' },
      { id: 'c99.sac', caption: 'Il lâche le sac.' },
    ],
  });
}

/** Valide une version modifiée de l'enquête de référence (monde construit avec elle). */
function errorsOf(mut: (d: CaseDef) => void, opts: { worldFromValid?: boolean } = {}): string[] {
  const d = validCase();
  mut(d);
  const world = makeWorld({ cases: [opts.worldFromValid ? validCase() : d] });
  return validateCase(d, world);
}

/** Exactement une erreur, qui correspond au motif (et porte le préfixe de l'enquête). */
function expectOnly(errs: string[], re: RegExp): void {
  expect(errs).toEqual([expect.stringMatching(re)]);
  expect(errs[0].startsWith('[c99] ')).toBe(true);
}

function expectSome(errs: string[], re: RegExp): void {
  expect(errs).toContainEqual(expect.stringMatching(re));
}

const ent = <T>(d: CaseDef, id: string) => d.entities.find((e) => e.id === id) as T;
const stepOf = (d: CaseDef, id: string) => d.steps.find((s) => s.id === id)!;

describe('validateCase : enquête valide', () => {
  it('aucune erreur', () => {
    const d = validCase();
    expect(validateCase(d, makeWorld({ cases: [d] }))).toEqual([]);
  });

  it('clé landmarkOverrides avec préfixe « lm. » acceptée ; enquête bonus sans reconstitution', () => {
    expect(
      errorsOf((d) => {
        d.landmarkOverrides = { 'lm.banque': { sign: 'BANQUE' } };
        d.bonus = true;
        d.replay = [];
      }),
    ).toEqual([]);
  });

  it('monde construit sans l’enquête : chaque entité et zone manquante est signalée', () => {
    const d = validCase();
    const errs = validateCase(d, makeWorld());
    expect(errs.filter((e) => /absente du monde/.test(e))).toHaveLength(d.entities.length + 1);
  });
});

describe('validateCase : métadonnées', () => {
  it('identifiant invalide', () => expectSome(errorsOf((d) => (d.id = 'C 99')), /identifiant d'enquête invalide/));
  it('titre vide', () => expectOnly(errorsOf((d) => (d.title = '')), /titre vide/));
  it('accroche vide', () => expectOnly(errorsOf((d) => (d.teaser = '   ')), /accroche/));
  it('briefing vide', () => expectOnly(errorsOf((d) => (d.intro = '')), /briefing/));
  it('épilogue vide', () => expectOnly(errorsOf((d) => (d.epilogue = '')), /épilogue vide/));
  it('difficulté hors de 1 à 5', () =>
    expectOnly(errorsOf((d) => ((d as { difficulty: number }).difficulty = 7)), /difficulté invalide/));
  it('caméra de départ hors du monde', () => {
    expectOnly(errorsOf((d) => (d.start = { x: -10, y: 400, zoom: 1 })), /caméra de départ hors du monde/);
    expectOnly(errorsOf((d) => (d.start = { x: 500, y: 9000, zoom: 1 })), /caméra de départ hors du monde/);
  });
  it('zoom de départ invalide', () => {
    expectOnly(errorsOf((d) => (d.start.zoom = 10)), /zoom de départ invalide/);
    expectOnly(errorsOf((d) => (d.start.zoom = 0)), /zoom de départ invalide/);
  });
  it('déblocage par elle-même', () => expectOnly(errorsOf((d) => (d.unlockAfter = ['c99'])), /dépend d'elle-même/));
});

describe('validateCase : personnages', () => {
  it('id non préfixé', () =>
    expectOnly(
      errorsOf((d) => d.characters.push({ id: 'x.autre', name: 'Autre', appearance: { ...LOOK } })),
      /personnage « x.autre » : l'id doit commencer par « c99. »/,
    ));
  it('nom vide', () => expectOnly(errorsOf((d) => (d.characters[0].name = '')), /nom vide/));
  it('personnage en double', () =>
    expectOnly(errorsOf((d) => d.characters.push({ ...d.characters[0] })), /personnage en double/));
  it('personnage référencé inexistant', () =>
    expectOnly(
      errorsOf((d) => (ent<PersonEntity>(d, 'c99.gaston').character = 'c99.inconnu')),
      /personnage inconnu « c99.inconnu »/,
    ));
});

describe('validateCase : entités', () => {
  it('entité en double', () =>
    expectOnly(
      errorsOf((d) => d.entities.push({ ...ent<PropEntity>(d, 'c99.sac') }), { worldFromValid: true }),
      /entité en double : « c99.sac »/,
    ));
  it('id non préfixé', () =>
    expectOnly(errorsOf((d) => d.entities.push(prop('x.sac', 'moneybag', 600, 350))), /« x.sac » : l'id doit commencer/));
  it('absente du monde', () =>
    expectOnly(
      errorsOf((d) => d.entities.push(prop('c99.extra', 'crate', 600, 350)), { worldFromValid: true }),
      /« c99.extra » : absente du monde/,
    ));
  it('type différent dans le monde', () =>
    expectOnly(
      errorsOf((d) => (d.entities[1] = person('c99.sac', 450, 350)), { worldFromValid: true }),
      /« c99.sac » : le monde contient une entité de type prop/,
    ));
  it('position non finie', () =>
    expectOnly(
      errorsOf((d) => (ent<PropEntity>(d, 'c99.sac').x = Number.NaN), { worldFromValid: true }),
      /position non finie/,
    ));
  it('en hauteur sans sortY', () =>
    expectOnly(errorsOf((d) => delete ent<PersonEntity>(d, 'c99.voleur').sortY), /en hauteur \(z = 80\) sans sortY/));
  it('dépasse du monde', () =>
    expectOnly(errorsOf((d) => (ent<PropEntity>(d, 'c99.cle').x = 2)), /« c99.cle » : dépasse du monde/));
  it('bateau hors de l’eau', () =>
    expectOnly(errorsOf((d) => (ent<VehicleEntity>(d, 'c99.barque').y = 380)), /bateau doit être sur l'eau/));
  it('personne dans l’eau', () =>
    expectOnly(
      errorsOf((d) => Object.assign(ent<PersonEntity>(d, 'c99.temoin'), { x: 700, y: 650 })),
      /« c99.temoin » : n'est pas posée sur un sol praticable .*dans l'eau/,
    ));
  it('objet dans un bâtiment', () =>
    expectOnly(
      errorsOf((d) => Object.assign(ent<PropEntity>(d, 'c99.cle'), { x: 550, y: 150 })),
      /« c99.cle » : n'est pas posée sur un sol praticable .*dans le bâtiment « b.centre.1 »/,
    ));
  it('cachée par un toit', () =>
    expectOnly(
      errorsOf((d) => Object.assign(ent<PersonEntity>(d, 'c99.temoin'), { x: 200, y: 90 })),
      /« c99.temoin » : cachée par le toit/,
    ));
  it('le canard peut nager, pas le chien', () => {
    expectOnly(
      errorsOf((d) => (d.entities[d.entities.length - 1] = prop('c99.canard', 'dog', 700, 550))),
      /« c99.canard » : n'est pas posée sur un sol praticable/,
    );
  });
});

describe('validateCase : zones', () => {
  const extraZone = (id: string, label = 'une zone', points = rectPoly(20, 620, 50, 50)) => ({ id, label, points });
  it('zone en double', () =>
    expectOnly(errorsOf((d) => d.zones!.push({ ...d.zones![0] })), /zone en double : « c99.zone.jardin »/));
  it('id non préfixé', () =>
    expectOnly(errorsOf((d) => d.zones!.push(extraZone('z.autre'))), /zone « z.autre » : l'id doit commencer/));
  it('libellé vide', () => expectOnly(errorsOf((d) => (d.zones![0].label = ' ')), /libellé vide/));
  it('moins de 3 sommets', () =>
    expectOnly(errorsOf((d) => d.zones![0].points.splice(2)), /au moins 3 sommets/));
  it('sommet hors du monde', () =>
    expectOnly(errorsOf((d) => (d.zones![0].points[1].x = 1200)), /sommet hors du monde/));
  it('absente du monde', () =>
    expectOnly(
      errorsOf((d) => d.zones!.push(extraZone('c99.zone.neuve')), { worldFromValid: true }),
      /zone « c99.zone.neuve » : absente du monde/,
    ));
  it('même id qu’une entité', () =>
    expectOnly(errorsOf((d) => d.zones!.push(extraZone('c99.sac'))), /même id qu'une entité/));
});

describe('validateCase : lieux modifiés', () => {
  it('lieu inconnu', () =>
    expectOnly(errorsOf((d) => (d.landmarkOverrides = { mairie: { sign: 'MAIRIE' } })), /lieu bâti inconnu « mairie »/));
  it('lieu qui n’est pas un bâtiment', () =>
    expectOnly(errorsOf((d) => (d.landmarkOverrides = { fontaine: {} })), /lieu bâti inconnu « fontaine »/));
  it('enseigne vide', () =>
    expectOnly(errorsOf((d) => (d.landmarkOverrides = { banque: { sign: '' } })), /enseigne vide/));
});

describe('validateCase : étapes', () => {
  it('aucune étape', () => expectOnly(errorsOf((d) => (d.steps = [])), /aucune étape/));
  it('id d’étape en double', () =>
    expectOnly(errorsOf((d) => d.steps.push({ ...stepOf(d, 's4') })), /id d'étape en double : « s4 »/));
  it('question vide', () => expectOnly(errorsOf((d) => (stepOf(d, 's2').question = '')), /« s2 » : question vide/));
  it('libellé d’onglet : valide, vide ou trop long', () => {
    expect(errorsOf((d) => (stepOf(d, 's2').label = 'Pétronille'))).toEqual([]);
    expectOnly(errorsOf((d) => (stepOf(d, 's2').label = '  ')), /« s2 » : libellé d'onglet/);
    expectOnly(errorsOf((d) => (stepOf(d, 's2').label = 'x'.repeat(25))), /« s2 » : libellé d'onglet/);
  });
  it('texte de résolution vide', () =>
    expectOnly(errorsOf((d) => (stepOf(d, 's2').solved = '')), /« s2 » : texte de résolution/));
  it('after : étape inconnue', () =>
    expectOnly(errorsOf((d) => (stepOf(d, 's2').after = ['s0'])), /after référence une étape inconnue « s0 »/));
  it('after : elle-même', () => {
    const errs = errorsOf((d) => (stepOf(d, 's2').after = ['s2']));
    expectSome(errs, /« s2 » : dépend d'elle-même/);
    expectSome(errs, /cycle dans « after »/);
  });
  it('after : cycle et étapes jamais atteignables', () => {
    const errs = errorsOf((d) => (stepOf(d, 's1').after = ['s3']));
    expectSome(errs, /cycle dans « after » : s\d → s\d → s\d → s\d/);
    expectSome(errs, /étapes jamais atteignables : « s1 », « s2 », « s3 »/);
    expect(errs).toHaveLength(2);
  });
  it('étape bloquée derrière un cycle (sans en faire partie)', () => {
    const errs = errorsOf((d) => {
      stepOf(d, 's1').after = ['s2'];
      stepOf(d, 's4').after = ['s3'];
    });
    expectSome(errs, /étapes jamais atteignables : « s1 », « s2 », « s3 », « s4 »/);
  });
  it('aucune réponse', () => expectSome(errorsOf((d) => (stepOf(d, 's3').accept = [])), /« s3 » : aucune réponse acceptée/));
  it('réponse en double', () =>
    expectOnly(errorsOf((d) => (stepOf(d, 's3').accept = ['lm.banque', 'lm.banque'])), /réponse en double « lm.banque »/));
  it('réponse inconnue', () =>
    expectOnly(errorsOf((d) => (stepOf(d, 's3').accept = ['lm.inconnu'])), /réponse inconnue « lm.inconnu »/));
  it('réponse ambiante (instable)', () =>
    expectOnly(errorsOf((d) => (stepOf(d, 's3').accept = ['a.p.1'])), /réponse « a.p.1 » ambiante/));
  it('required invalide', () => {
    expectOnly(errorsOf((d) => (stepOf(d, 's2').required = 0)), /required invalide/);
    expectOnly(errorsOf((d) => (stepOf(d, 's2').required = 1.5)), /required invalide/);
  });
  it('required supérieur au nombre de réponses', () =>
    expectOnly(errorsOf((d) => (stepOf(d, 's2').required = 3)), /required \(3\) dépasse le nombre de réponses \(2\)/));
  it('fausse piste en double', () =>
    expectOnly(
      errorsOf((d) => stepOf(d, 's1').nearMiss!.push({ id: 'c99.temoin', feedback: 'Encore lui.' })),
      /fausse piste en double « c99.temoin »/,
    ));
  it('fausse piste inconnue', () =>
    expectOnly(
      errorsOf((d) => (stepOf(d, 's1').nearMiss = [{ id: 'c99.fantome', feedback: 'Non.' }])),
      /fausse piste inconnue « c99.fantome »/,
    ));
  it('fausse piste ambiante', () =>
    expectOnly(
      errorsOf((d) => (stepOf(d, 's1').nearMiss = [{ id: 'a.p.1', feedback: 'Non.' }])),
      /fausse piste « a.p.1 » ambiante/,
    ));
  it('réponse et fausse piste à la fois', () =>
    expectOnly(
      errorsOf((d) => stepOf(d, 's1').nearMiss!.push({ id: 'c99.gaston', feedback: 'Non.' })),
      /« c99.gaston » est à la fois réponse et fausse piste/,
    ));
  it('fausse piste sans message', () =>
    expectOnly(errorsOf((d) => (stepOf(d, 's1').nearMiss![0].feedback = '')), /fausse piste « c99.temoin » sans message/));
  it('fausse piste masquée par un bâtiment de la réponse', () =>
    expectOnly(
      errorsOf((d) => stepOf(d, 's3').nearMiss!.push({ id: 'c99.fenetre', feedback: 'Juste un curieux.' })),
      /fausse piste « c99.fenetre » masquée par la réponse « lm.banque »/,
    ));
  it('fausse piste masquée par une zone de la réponse', () =>
    expectOnly(
      errorsOf((d) => (stepOf(d, 's4').nearMiss = [{ id: 'lm.fontaine', feedback: 'Plus large.' }])),
      /fausse piste « lm.fontaine » masquée par la réponse « z.place »/,
    ));
  it('moins de 2 indices', () =>
    expectOnly(errorsOf((d) => (stepOf(d, 's2').hints = [{ text: 'Seul.' }])), /au moins 2 indices \(1\)/));
  it('indice vide', () => expectOnly(errorsOf((d) => (stepOf(d, 's2').hints[0].text = '')), /« s2 » : indice 1 vide/));
  it('zone d’indice invalide', () =>
    expectOnly(
      errorsOf((d) => (stepOf(d, 's1').hints[1].area = { x: 420, y: 330, radius: 0 })),
      /indice 2 : zone d'indice invalide/,
    ));
  it('zone d’indice hors du monde', () =>
    expectOnly(
      errorsOf((d) => (stepOf(d, 's2').hints[0].area = { x: -100, y: 300, radius: 50 })),
      /indice 1 : zone d'indice hors du monde/,
    ));
  it('zone de l’indice 2 qui ne contient aucune réponse', () =>
    expectOnly(
      errorsOf((d) => (stepOf(d, 's1').hints[1].area = { x: 900, y: 100, radius: 50 })),
      /la zone de l'indice 2 ne contient aucune réponse/,
    ));
  it('fil rouge vers une entité inconnue', () =>
    expectOnly(
      errorsOf((d) => (stepOf(d, 's1').thread = [['c99.gaston', 'c99.fantome']])),
      /fil rouge 1 : entité ou zone inconnue « c99.fantome »/,
    ));
  it('fil rouge qui boucle', () =>
    expectOnly(errorsOf((d) => (stepOf(d, 's1').thread = [['c99.gaston', 'c99.gaston']])), /relie « c99.gaston » à elle-même/));
});

describe('validateCase : reconstitution', () => {
  it('vide (hors bonus)', () => expectOnly(errorsOf((d) => (d.replay = [])), /reconstitution \(replay\) vide/));
  it('entité inconnue', () =>
    expectOnly(errorsOf((d) => (d.replay[1].id = 'c99.fantome')), /replay\[1\] : entité ou zone inconnue « c99.fantome »/));
  it('légende vide', () => expectOnly(errorsOf((d) => (d.replay[0].caption = '')), /replay\[0\] : légende vide/));
});

describe('validateCase : robustesse', () => {
  it('une enquête très abîmée produit des messages sans lever', () => {
    const d = caseDef({
      id: 'c99',
      title: '',
      start: { x: Number.NaN, y: 0, zoom: Number.NaN },
      steps: [step('s1', [], { hints: [], after: ['s1'], required: -2 })],
      entities: [{ ...person('c99.x', Number.NaN, 0), z: 5 }],
    });
    let errs: string[] = [];
    expect(() => (errs = validateCase(d, makeWorld()))).not.toThrow();
    expect(errs.length).toBeGreaterThan(5);
    for (const e of errs) expect(e).toMatch(/^\[c99\] \S/);
  });
});

/* -------------------------------------------------------------------------- */

/** Seconde enquête valide, loin de la première. */
function otherCase(): CaseDef {
  return caseDef({
    id: 'c98',
    characters: [{ id: 'c98.marie', name: 'Marie', appearance: { ...LOOK, topColor: 'yellow' } }],
    entities: [person('c98.marie', 850, 380, { character: 'c98.marie' })],
    steps: [step('s1', ['c98.marie'])],
    replay: [{ id: 'c98.marie', caption: 'Marie attend.' }],
  });
}

function allErrors(cases: CaseDef[], world: World = makeWorld({ cases })): string[] {
  return validateAllCases(cases, world);
}

describe('validateAllCases', () => {
  it('aucune enquête : aucune erreur', () => {
    expect(validateAllCases([], makeWorld())).toEqual([]);
  });

  it('deux enquêtes valides', () => {
    expect(allErrors([validCase(), otherCase()])).toEqual([]);
  });

  it('les erreurs de chaque enquête sont rapportées, préfixées par son id', () => {
    const a = validCase();
    a.title = '';
    const b = otherCase();
    b.epilogue = '';
    expect(allErrors([a, b])).toEqual(['[c99] titre vide', '[c98] épilogue vide']);
  });

  it('id d’enquête en double', () => {
    expect(allErrors([validCase(), validCase()], makeWorld({ cases: [validCase()] }))).toEqual(['[c99] id d\'enquête en double']);
  });

  it('personnage défini par deux enquêtes', () => {
    const b = otherCase();
    b.characters.push({ ...validCase().characters[0] });
    expectSome(allErrors([validCase(), b]), /^\[c98\] personnage « c99.gaston » déjà défini par c99/);
  });

  it('un personnage d’une autre enquête peut être réutilisé (pas seul)', () => {
    const b = otherCase();
    b.entities.push(person('c98.gaston', 880, 700, { character: 'c99.gaston' }));
    const world = makeWorld({ cases: [validCase(), b] });
    expect(validateAllCases([validCase(), b], world)).toEqual([]);
    expectSome(validateCase(b, world), /personnage inconnu « c99.gaston »/);
  });

  it('entité définie par deux enquêtes', () => {
    const b = otherCase();
    b.entities.push(prop('c99.sac', 'moneybag', 450, 350));
    const world = makeWorld({ cases: [validCase(), otherCase()] });
    expectSome(allErrors([validCase(), b], world), /^\[c98\] entité « c99.sac » déjà définie par c99/);
  });

  it('unlockAfter : enquête inconnue', () => {
    const b = otherCase();
    b.unlockAfter = ['c42'];
    expect(allErrors([validCase(), b])).toEqual(['[c98] unlockAfter : enquête inconnue « c42 »']);
  });

  it('unlockAfter : cycle, enquêtes jamais débloquables', () => {
    const a = validCase();
    const b = otherCase();
    a.unlockAfter = ['c98'];
    b.unlockAfter = ['c99'];
    const errs = allErrors([a, b]);
    expectSome(errs, /cycle de déblocage : c\d\d → c\d\d → c\d\d/);
    expectSome(errs, /enquêtes jamais débloquables : « c99 », « c98 »/);
  });

  it('chaîne de déblocage valide', () => {
    const b = otherCase();
    b.unlockAfter = ['c99'];
    expect(allErrors([validCase(), b])).toEqual([]);
  });

  it('chevauchement entre entités d’enquêtes différentes', () => {
    const b = otherCase();
    b.entities[0].x = 470;
    b.entities[0].y = 352;
    const errs = allErrors([validCase(), b]);
    expect(errs.length).toBeGreaterThan(0);
    for (const e of errs) expect(e).toMatch(/^\[c98\] l'entité « c98.marie » chevauche « c99\.(sac|cle) » de l'enquête c99$/);
  });

  it('pas de chevauchement signalé au sein d’une même enquête', () => {
    const a = validCase();
    a.entities.push(prop('c99.sac2', 'moneybag', 452, 351));
    expect(allErrors([a])).toEqual([]);
  });
});
