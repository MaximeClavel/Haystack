// Textes d'affichage : typographie française, statuts des enquêtes, reprise sur la dernière trouvaille.
import { describe, expect, it } from 'vitest';
import type { CaseDef, District, Entity, Landmark, Rect, World } from '../types';
import { getEntityBounds, getHitRect } from '../art';
import { CaseSession, defaultSave, entityCenter, restartCaseProgress, withCaseProgress } from '../game';
import { building, caseDef, makeWorld, person, prop, step, tree, vehicle } from '../game/testkit';
import { buildWorld } from '../world';
import type { Street } from '../world/layout';
import { setWorldMeta } from '../world/meta';
import { apostrophes, caseStatus, districtName, fr, lockReason, paragraphs, placeCaptureMargin, placeName, solvedCount } from './format';
import { lastFoundId, thumbRect } from './screens/investigation/overlays';

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

// ---------------------------------------------------------------------------------------------
// Pastille de lieu : placeName
// ---------------------------------------------------------------------------------------------

const R = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/** Rue droite du plan (seuls le nom, l'axe et le rectangle comptent pour la pastille). */
function street(name: string, axis: Street['axis'], rect: Rect): Street {
  const a = { x: rect.x, y: rect.y };
  const b = { x: rect.x + rect.w, y: rect.y + rect.h };
  return {
    id: `s.${name}.${rect.x}.${rect.y}`,
    name,
    kind: 'street',
    axis,
    a,
    b,
    width: Math.min(rect.w, rect.h),
    sidewalk: 8,
    poly: [],
    roadPoly: [],
    rect,
    roadRect: rect,
  };
}

/**
 * Petite ville de test (1000 × 800) : quartier Nord (x < 500) et quartier « Parc des Meules » (x ≥ 500, même nom
 * que le lieu qui le couvre), une banque, un pont étroit, un kiosque dans le parc et quelques rues.
 */
function placeWorld(withStreets = true): World {
  const districts: District[] = [
    { id: 'centre', name: 'Quartier Nord', rect: R(0, 0, 500, 800) },
    { id: 'parc', name: 'Parc des Meules', rect: R(500, 0, 500, 800) },
  ];
  const landmarks: Landmark[] = [
    { id: 'banque', name: 'Banque Dufric', district: 'centre', kind: 'building', rect: R(400, 160, 60, 40) },
    { id: 'cafe', name: 'Café Minuscule', district: 'centre', kind: 'building', rect: R(470, 170, 20, 20) },
    { id: 'pont', name: 'Pont Central', district: 'centre', kind: 'area', rect: R(200, 500, 40, 200) },
    { id: 'parc', name: 'Parc des Meules', district: 'parc', kind: 'area', rect: R(500, 0, 500, 600) },
    { id: 'kiosque', name: 'Kiosque à musique', district: 'parc', kind: 'point', rect: R(680, 80, 40, 40) },
    // Nom écrit avec l'apostrophe droite, comme dans le monde généré (contrat `layoutSpec`).
    { id: 'cour', name: "Cour de l'école", district: 'centre', kind: 'area', rect: R(60, 400, 80, 60) },
  ];
  const world: World = { ...makeWorld(), districts, landmarks };
  if (withStreets) {
    setWorldMeta(world, {
      streets: [
        street('Rue Haute', 'h', R(0, 200, 500, 40)),
        street('Rue du Moulin', 'v', R(300, 0, 40, 800)),
        street('Rue de la Source', 'v', R(340, 0, 40, 800)), // contiguë au Moulin
        street('Rue n°12', 'v', R(100, 0, 40, 800)), // remplissage du générateur
        street('Rue Biaise', 'd', R(0, 0, 500, 800)), // en biais : boîte englobante énorme
        street('Avenue du Parc', 'h', R(500, 300, 500, 60)),
        street('Rue Haute', 'h', R(500, 400, 100, 40)), // même nom, autre tronçon
        street("Rue de l'Aiguillage", 'h', R(0, 700, 300, 40)), // apostrophe droite, comme le monde généré
        street("Rue de l'Orge", 'v', R(250, 700, 40, 100)),
      ],
      blocks: [],
      spots: [],
      removedAmbient: 0,
      deSosied: 0,
    });
  }
  return world;
}

describe('placeName : pastille de lieu', () => {
  const w = placeWorld();

  it('quartier seul hors de tout lieu et de toute rue', () => {
    expect(placeName(w, 50, 600)).toBe('Quartier Nord');
    expect(placeName(w, 900, 700)).toBe('Parc des Meules');
  });

  it('lieu remarquable : « lieu · quartier »', () => {
    expect(placeName(w, 430, 180)).toBe('Banque Dufric · Quartier Nord');
    expect(placeName(w, 700, 100)).toBe('Kiosque à musique · Parc des Meules');
  });

  it('rue nommée : « rue · quartier »', () => {
    expect(placeName(w, 50, 220)).toBe('Rue Haute · Quartier Nord');
    expect(placeName(w, 320, 600)).toBe('Rue du Moulin · Quartier Nord');
  });

  it('un carrefour donne deux noms de rue, sans quartier', () => {
    expect(placeName(w, 320, 220)).toBe('Rue Haute / Rue du Moulin');
  });

  it('au plus deux noms de rue : les plus proches d’abord', () => {
    // (340, 220) est dans trois rues (Haute, Moulin, Source) : les deux premières du plan des rues.
    expect(placeName(w, 340, 220)).toBe('Rue Haute / Rue du Moulin');
    // Marge : le Moulin (distance 0), la Source (10 u) ; la rue Haute (60 u) est trop loin.
    expect(placeName(w, 330, 300, 30)).toBe('Rue du Moulin / Rue de la Source');
    // Moulin (0), puis Haute et Source à égalité (10 u) : à égalité, l’ordre du plan ; la 3e est écartée.
    expect(placeName(w, 330, 250, 30)).toBe('Rue du Moulin / Rue Haute');
  });

  it('un nom de rue porté par deux tronçons n’est écrit qu’une fois', () => {
    expect(placeName(w, 550, 420, 400)).not.toMatch(/Rue Haute \/ Rue Haute/);
    expect(placeName(w, 550, 420)).toBe('Rue Haute · Parc des Meules');
  });

  it('ignore les rues en biais et les rues de remplissage « Rue n°N »', () => {
    expect(placeName(w, 120, 600)).toBe('Quartier Nord');
    expect(placeName(w, 120, 600, 48)).toBe('Quartier Nord');
    expect(placeName(w, 250, 100, 5)).toBe('Quartier Nord');
  });

  it('doublon lieu = quartier : « Parc des Meules » une seule fois', () => {
    expect(placeName(w, 800, 500)).toBe('Parc des Meules');
    expect(placeName(w, 800, 500)).not.toContain('·');
    // Une rue qui traverse le parc passe avant le grand lieu, le quartier est ajouté.
    expect(placeName(w, 800, 330)).toBe('Avenue du Parc · Parc des Meules');
  });

  it('priorité : petit lieu > rue > grand lieu > quartier', () => {
    // Banque et Rue Haute se touchent (y = 200) : exactement dans la rue, 5 u sous la banque.
    expect(placeName(w, 430, 205)).toBe('Rue Haute · Quartier Nord');
    expect(placeName(w, 430, 205, 10)).toBe('Banque Dufric · Quartier Nord');
    // Grand lieu : seulement sans rue.
    expect(placeName(w, 800, 200)).toBe('Parc des Meules');
  });

  it('marge de capture : un lieu étroit proche du centre est nommé, pas un lieu lointain', () => {
    // Le pont fait 40 u de large (x 200–240) : centre à 30 u de son bord.
    expect(placeName(w, 270, 600)).toBe('Quartier Nord');
    expect(placeName(w, 270, 600, 29)).toBe('Quartier Nord');
    expect(placeName(w, 270, 600, 30)).toBe('Pont Central · Quartier Nord');
    expect(placeName(w, 170, 600, 30)).toBe('Pont Central · Quartier Nord');
    // Même avec la rue du Moulin à 30 u du centre, le pont (petit lieu) passe avant la rue.
    expect(placeName(w, 270, 600, 48)).toBe('Pont Central · Quartier Nord');
    // Trop loin : la marge n’invente pas de lieu.
    expect(placeName(w, 270, 780, 30)).not.toContain('Pont');
    // Une marge négative ou nulle revient au comportement exact.
    expect(placeName(w, 270, 600, -5)).toBe('Quartier Nord');
  });

  it('le lieu qui contient le point passe avant un lieu voisin (même plus petit) atteint par la marge', () => {
    // (455, 180) est dans la banque (2 400 u²) ; le café (400 u²) est à 15 u : la marge ne le fait pas gagner.
    expect(placeName(w, 455, 180, 48)).toBe('Banque Dufric · Quartier Nord');
    // Hors des deux : le plus proche l’emporte.
    expect(placeName(w, 466, 180, 48)).toBe('Café Minuscule · Quartier Nord');
    expect(placeName(w, 462, 180, 48)).toBe('Banque Dufric · Quartier Nord');
  });

  it('sans plan des rues (monde fait main), seuls lieux et quartiers sont nommés', () => {
    const bare = placeWorld(false);
    expect(placeName(bare, 50, 220)).toBe('Quartier Nord');
    expect(placeName(bare, 430, 180)).toBe('Banque Dufric · Quartier Nord');
  });

  it('hors de tout quartier : « Meulebourg »', () => {
    const empty = makeWorld();
    expect(placeName(empty, 10, 10)).toBe('Meulebourg');
  });

  it('apostrophe typographique (’) pour les rues et les lieux, jamais l’apostrophe droite', () => {
    // Les noms du monde sont écrits avec « ' » (layoutSpec, contrat) ; l'affichage les normalise.
    expect(placeName(w, 50, 720)).toBe('Rue de l’Aiguillage · Quartier Nord');
    expect(placeName(w, 270, 720)).toBe('Rue de l’Aiguillage / Rue de l’Orge');
    expect(placeName(w, 100, 430)).toBe('Cour de l’école · Quartier Nord');
    for (const n of [placeName(w, 50, 720), placeName(w, 270, 720), placeName(w, 100, 430)]) expect(n).not.toContain("'");
  });

  it('apostrophes : ne touche ni les autres caractères ni les apostrophes déjà typographiques', () => {
    expect(apostrophes("Rue de l'Orge")).toBe('Rue de l’Orge');
    expect(apostrophes("Cour de l'école d'à côté")).toBe('Cour de l’école d’à côté');
    expect(apostrophes('Rue de l’Orge')).toBe('Rue de l’Orge');
    expect(apostrophes('Rue Haute')).toBe('Rue Haute');
  });

  it('districtName passe aussi par la normalisation', () => {
    const d = placeWorld();
    d.districts[0] = { ...d.districts[0], name: "Quartier de l'Est" };
    expect(districtName(d, 50, 600)).toBe('Quartier de l’Est');
    expect(districtName(d, -10, -10)).toBe('Meulebourg');
  });
});

describe('placeCaptureMargin : marge de capture en pixels écran', () => {
  it('48 px d’écran, plafonnés à 48 u quand la carte est dézoomée', () => {
    expect(placeCaptureMargin(1)).toBe(48);
    expect(placeCaptureMargin(0.5)).toBe(48);
    expect(placeCaptureMargin(0)).toBe(48);
    expect(placeCaptureMargin(1.6)).toBeCloseTo(30, 5);
    expect(placeCaptureMargin(4)).toBeCloseTo(12, 5);
  });
});

describe('placeName dans la vraie ville', () => {
  const world = buildWorld({ cases: [] });
  const at = (zoom: number) => placeCaptureMargin(zoom);

  it('nomme les rues citées par les enquêtes', () => {
    expect(placeName(world, 3228, 660)).toBe('Rue des Étals / Rue du Cinéma');
    expect(placeName(world, 3228, 800)).toBe('Rue des Étals · Les Halles');
    expect(placeName(world, 2700, 392)).toBe('Rue du Marché · Les Halles');
  });

  it('nomme les lieux étroits quand ils sont dans la vue (marge de capture)', () => {
    // Pont Central (x 2160–2240) : le centre est à 50 u de son axe, le pont est bien à l’écran.
    expect(placeName(world, 2250, 3830)).toBe('La Fenaison');
    expect(placeName(world, 2250, 3830, at(1.6))).toBe('Pont Central · La Fenaison');
    expect(placeName(world, 2140, 3830, at(1.17))).toBe('Pont Central · La Fenaison');
    // Boucherie Tendron (y 260–350) : aiguille du bonus à 16 u en dessous, sur la rue du Marché.
    expect(placeName(world, 2965, 366, at(1.2))).toBe('Boucherie Tendron · Les Halles');
    // Commissariat (y ≤ 2580) et Capitainerie (y ≤ 4330) : aiguilles à 4 et 8 u.
    expect(placeName(world, 1780, 2584, at(1.2))).toBe('Commissariat · Vieille Ville');
    expect(placeName(world, 4600, 4338, at(1.2))).toBe('Capitainerie · Le Port');
  });

  it('le parc n’est plus écrit deux fois', () => {
    expect(placeName(world, 4800, 800)).toBe('Parc des Meules');
    expect(placeName(world, 4800, 800, at(1.2))).toBe('Parc des Meules');
  });

  it('sur toute la carte : jamais de « Rue n°N », de rue en biais ni de doublon', () => {
    const bad: string[] = [];
    for (const zoom of [0.6, 1.6]) {
      const m = at(zoom);
      for (let x = 0; x < world.width; x += 90) {
        for (let y = 0; y < world.height; y += 90) {
          const n = placeName(world, x, y, m);
          const parts = n.split(' · ');
          if (/Rue n°\d/.test(n) || /Biaise|Traverse|Creux|de Biais/.test(n) || (parts.length === 2 && parts[0] === parts[1])) bad.push(`${x},${y}: ${n}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------
// Vignette de la feuille « Désigner » : thumbRect
// ---------------------------------------------------------------------------------------------

describe('thumbRect : vignette de confirmation', () => {
  const contains = (v: Rect, b: Rect): boolean => v.x <= b.x + 1e-9 && v.y <= b.y + 1e-9 && v.x + v.w >= b.x + b.w - 1e-9 && v.y + v.h >= b.y + b.h - 1e-9;

  it('une personne à parapluie ou haut-de-forme garde toute sa canopée dans la vue', () => {
    const looks = [{ accessory: 'umbrella' as const }, { hat: 'tophat' as const }, {}];
    for (const look of looks) {
      const p = person('t.p', 400, 300);
      p.appearance = { ...p.appearance, ...look };
      const v = thumbRect(p, { x: 400, y: 300 });
      const b = getEntityBounds(p);
      expect(contains(v, b)).toBe(true);
      // Le corps (cadre de désignation) y est aussi, et la taille de la vue n’a pas changé : 52 × 39 u.
      expect(contains(v, getHitRect(p))).toBe(true);
      expect(v.w).toBeCloseTo(52, 6);
      expect(v.h).toBeCloseTo(39, 6);
      // Centrée sur l’emprise visuelle, pas sur le corps.
      expect(v.x + v.w / 2).toBeCloseTo(b.x + b.w / 2, 6);
      expect(v.y + v.h / 2).toBeCloseTo(b.y + b.h / 2, 6);
    }
  });

  it('sans entité : vue de 52 × 39 u centrée sur le point', () => {
    expect(thumbRect(null, { x: 100, y: 80 })).toEqual({ x: 74, y: 60.5, w: 52, h: 39 });
  });

  it('pour toute entité de la ville, la vue contient l’emprise visuelle ET le cadre de désignation', () => {
    const world = buildWorld({ cases: [] });
    const bad: string[] = [];
    for (const e of world.entities) {
      const v = thumbRect(e, { x: e.x, y: e.y });
      if (!contains(v, getEntityBounds(e)) || !contains(v, getHitRect(e))) bad.push(e.id);
    }
    expect(bad).toEqual([]);
  });

  it('zoom de la vignette inchangé : même échelle que l’ancienne formule, pour toutes les sortes d’entités', () => {
    // Ancienne vue : max(52, 1,4 × corps) × max(39, 1,4 × corps), centrée sur le corps ; renderSnapshot
    // l'élargit au format du canevas (132 × 99), d'où une échelle min(132 / w, 99 / h). Le correctif de
    // cadrage (vue centrée sur l'emprise visuelle) ne doit changer que le centrage, pas cette échelle.
    const THUMB_W = 132;
    const THUMB_H = 99;
    const oldScale = (e: Entity): number => {
      const r = getHitRect(e);
      return Math.min(THUMB_W / Math.max(52, r.w * 1.4), THUMB_H / Math.max(39, r.h * 1.4));
    };
    const newScale = (e: Entity): number => {
      const v = thumbRect(e, { x: e.x, y: e.y });
      return Math.min(THUMB_W / v.w, THUMB_H / v.h);
    };
    // Entités fabriquées : un exemplaire de chaque sorte, dont des personnes à parapluie et à haut-de-forme.
    const umbrella = person('t.u', 200, 200);
    umbrella.appearance = { ...umbrella.appearance, accessory: 'umbrella' };
    const tophat = person('t.h', 240, 200);
    tophat.appearance = { ...tophat.appearance, hat: 'tophat' };
    const made: Entity[] = [
      person('t.p', 50, 50),
      umbrella,
      tophat,
      prop('t.k', 'key', 100, 100),
      vehicle('t.v', 'bus', 300, 300),
      tree('t.t', 500, 400, 60),
      building('t.b', R(600, 300, 120, 80), 90),
    ];
    for (const e of made) expect(newScale(e), e.id).toBeCloseTo(oldScale(e), 9);

    // Échantillon de la vraie ville : une entité sur quatre de chaque sorte (personnes, objets, arbres,
    // bâtiments, véhicules), soit plusieurs centaines d'entités ; au moins une de chaque sorte.
    const world = buildWorld({ cases: [] });
    const seen = new Map<string, number>();
    const bad: string[] = [];
    world.entities.forEach((e, i) => {
      if (i % 4 !== 0) return;
      seen.set(e.kind, (seen.get(e.kind) ?? 0) + 1);
      if (Math.abs(newScale(e) - oldScale(e)) > 1e-9) bad.push(`${e.id} (${e.kind})`);
    });
    expect(bad).toEqual([]);
    for (const kind of ['person', 'prop', 'tree', 'building', 'vehicle']) expect(seen.get(kind) ?? 0, kind).toBeGreaterThan(0);
  });
});
