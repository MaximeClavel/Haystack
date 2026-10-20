// Textes d'enquête liés aux règles du jeu : coût d'un indice (avec son horizon), explication de la note,
// libellés du panneau et extrait de vers du toast. Les textes sont aussi recoupés avec le moteur (computeStars).
import { describe, expect, it } from 'vitest';
import type { StepProgress } from '../../../types';
import { computeStars } from '../../../game';
import { CASES } from '../../../content';
import {
  confirmLabel,
  foundToastText,
  hintCostText,
  panelLabel,
  starsExplanation,
  testamentVerses,
  verseExcerpt,
  verseFor,
  wrongMessage,
  WRONG_MESSAGES,
} from './texts';

/** Progressions de `n` étapes avec `hints` niveaux d'indice au total (2 au plus par étape : aucune révélation). */
function spread(n: number, hints: number, mistakes = 0): StepProgress[] {
  const steps: StepProgress[] = Array.from({ length: n }, () => ({ found: [], hints: 0, mistakes: 0 }));
  let left = hints;
  for (const s of steps) {
    const take = Math.min(2, left);
    s.hints = take;
    left -= take;
  }
  steps[0].mistakes = mistakes;
  return steps;
}

describe('hintCostText : ce qu’un indice coûte', () => {
  it('annonce la perte d’étoile quand la note baisse (formules testées par l’e2e 03)', () => {
    expect(hintCostText(3, 2, 6)).toBe('Votre note passera de 3 à 2 étoiles au plus.');
    expect(hintCostText(2, 1, 6)).toBe('Votre note passera de 2 à 1 étoile au plus.');
    expect(hintCostText(3, 1, 3)).toBe('Votre note passera de 3 à 1 étoile au plus.');
  });

  it('à 2 étoiles qui se maintiennent, annonce l’horizon : le nombre d’indices en tout', () => {
    expect(hintCostText(2, 2, 6)).toBe('Votre note reste à 2 étoiles ; au-delà de 6 indices en tout, elle passera à 1 étoile.');
    expect(hintCostText(2, 2, 7)).toContain('au-delà de 7 indices en tout');
    expect(hintCostText(2, 2, 3)).toContain('au-delà de 3 indices en tout');
  });

  it('garde l’ancienne formule quand il n’y a pas d’horizon à annoncer', () => {
    expect(hintCostText(1, 1, 6)).toBe('Votre note reste à 1 étoile pour l’instant.');
    // Une seule question (bonus) : le deuxième niveau fait déjà tomber à 1 étoile, rien à annoncer.
    expect(hintCostText(2, 2, 1)).toBe('Votre note reste à 2 étoiles pour l’instant.');
  });

  it('l’horizon annoncé est exact : N indices en tout laissent 2 étoiles, N + 1 font tomber à 1 (toutes tailles d’enquête)', () => {
    for (let n = 2; n <= 7; n++) {
      for (let t = 0; t <= Math.min(n + 1, 2 * n) - 1; t++) {
        const now = computeStars(spread(n, t), n);
        const after = computeStars(spread(n, t + 1), n);
        const text = hintCostText(now, after, n);
        if (text.includes('au-delà de')) {
          expect(text, `n=${n} t=${t}`).toContain(`au-delà de ${n} indices`);
          expect(computeStars(spread(n, n), n), `n=${n}`).toBe(2);
          expect(computeStars(spread(n, n + 1), n), `n=${n}`).toBe(1);
        }
      }
    }
  });
});

describe('starsExplanation : pourquoi cette note', () => {
  const base = { hints: 0, mistakes: 0, stepCount: 6, reveals: 0 };

  it('3 étoiles', () => {
    expect(starsExplanation({ ...base, stars: 3, mistakes: 2 })).toBe('Aucun indice et au plus 2 erreurs : le maximum !');
  });

  it('2 étoiles : par les indices, par les erreurs, par les deux', () => {
    expect(starsExplanation({ ...base, stars: 2, hints: 5, mistakes: 2 })).toBe(
      'Les indices ont plafonné la note à 2 étoiles (jusqu’à 6 indices ; au-delà, 1 étoile).',
    );
    expect(starsExplanation({ ...base, stars: 2, mistakes: 4 })).toBe('Plus de 2 erreurs : la note est plafonnée à 2 étoiles.');
    expect(starsExplanation({ ...base, stars: 2, hints: 1, mistakes: 3 })).toBe('Indices et erreurs : la note est plafonnée à 2 étoiles.');
  });

  it('1 étoile : révélation, trop d’indices, trop d’erreurs', () => {
    expect(starsExplanation({ ...base, stars: 1, hints: 3, reveals: 1 })).toBe('Une réponse a été révélée : la note tombe à 1 étoile.');
    expect(starsExplanation({ ...base, stars: 1, hints: 7 })).toBe('Plus de 6 indices en tout (un par question) : la note tombe à 1 étoile.');
    expect(starsExplanation({ ...base, stars: 1, mistakes: 7 })).toBe('Plus de 6 erreurs : la note tombe à 1 étoile.');
    expect(starsExplanation({ ...base, stars: 1, hints: 8, mistakes: 9 })).toBe('Trop d’indices et plus de 6 erreurs : la note tombe à 1 étoile.');
  });

  it('une seule question (bonus) : singulier', () => {
    const bonus = { ...base, stepCount: 1 };
    expect(starsExplanation({ ...bonus, stars: 2, hints: 1 })).toBe(
      'Les indices ont plafonné la note à 2 étoiles (jusqu’à 1 indice ; au-delà, 1 étoile).',
    );
    expect(starsExplanation({ ...bonus, stars: 1, hints: 2 })).toBe('Plus d’un indice : la note tombe à 1 étoile.');
  });

  it('recoupé avec le moteur : l’explication cite la vraie cause, pour toute partie possible', () => {
    for (let n = 1; n <= 7; n++) {
      for (let hints = 0; hints <= Math.min(n + 2, 2 * n); hints++) {
        for (let mistakes = 0; mistakes <= 9; mistakes++) {
          const steps = spread(n, hints, mistakes);
          const stars = computeStars(steps, n);
          const text = starsExplanation({ stars, hints, mistakes, stepCount: n, reveals: 0 });
          const where = `n=${n} indices=${hints} erreurs=${mistakes} → ${stars}★ « ${text} »`;
          expect(text.length, where).toBeGreaterThan(10);
          if (stars === 3) expect(hints === 0 && mistakes <= 2, where).toBe(true);
          if (stars === 2) {
            // Un plafond à 2 étoiles : il y a bien des indices ou plus de 2 erreurs, et rien de plus grave.
            expect(hints > 0 || mistakes > 2, where).toBe(true);
            expect(hints <= n && mistakes <= 6, where).toBe(true);
          }
          if (stars === 1) {
            const byHints = hints > n;
            const byMistakes = mistakes > 6;
            expect(byHints || byMistakes, where).toBe(true);
            if (byHints && !byMistakes) expect(text, where).toContain('indice');
            if (byMistakes && !byHints) expect(text, where).toContain('6 erreurs');
          }
        }
      }
    }
    // Une révélation (3 niveaux sur une question) fait tomber à 1 étoile, même avec peu d’indices en tout.
    const revealed: StepProgress[] = [{ found: [], hints: 3, mistakes: 0 }, { found: [], hints: 0, mistakes: 0 }, { found: [], hints: 0, mistakes: 0 }];
    expect(computeStars(revealed, 3)).toBe(1);
    expect(starsExplanation({ stars: 1, hints: 3, mistakes: 0, stepCount: 3, reveals: 1 })).toContain('révélée');
  });
});

describe('toasts d’une désignation fausse', () => {
  it('tournent sur les erreurs de l’enquête, sans jamais emprunter le titre « Pas tout à fait… » des fausses pistes', () => {
    expect(wrongMessage(1)).toBe('Ce n’est pas ça…');
    expect(wrongMessage(2)).toBe('Ce n’est pas ça… Regardez encore.');
    expect(wrongMessage(3)).toBe('Toujours pas… Cherchez encore.');
    expect(wrongMessage(4)).toBe(wrongMessage(1));
    expect(wrongMessage(9)).toBe(wrongMessage(3));
    expect(new Set(WRONG_MESSAGES).size).toBe(WRONG_MESSAGES.length);
    for (const m of WRONG_MESSAGES) expect(m).not.toMatch(/pas tout à fait/i);
  });
});

describe('libellés du panneau et de la feuille de confirmation', () => {
  it('une seule piste ouverte : l’ordinal ; plusieurs : le nombre de pistes ; une seule question : la mission', () => {
    expect(panelLabel({ stepCount: 6, index: 3, openCount: 1 })).toBe('Question 4 sur 6');
    expect(panelLabel({ stepCount: 6, index: 3, openCount: 2 })).toBe('2 pistes ouvertes');
    expect(panelLabel({ stepCount: 7, index: 1, openCount: 4 })).toBe('4 pistes ouvertes');
    expect(panelLabel({ stepCount: 1, index: 0, openCount: 1 })).toBe('Votre mission');
  });

  it('la feuille de confirmation suit : nom de la piste quand plusieurs sont ouvertes, mission pour le bonus', () => {
    expect(confirmLabel({ stepCount: 6, index: 3, openCount: 2, label: 'Le voisin' })).toBe('Le voisin');
    expect(confirmLabel({ stepCount: 6, index: 3, openCount: 2 })).toBe('Question 4 sur 6');
    expect(confirmLabel({ stepCount: 6, index: 0, openCount: 1, label: 'La bijouterie' })).toBe('Question 1 sur 6');
    expect(confirmLabel({ stepCount: 1, index: 0, openCount: 1 })).toBe('Votre mission');
  });
});

describe('extrait de vers du toast (bonus)', () => {
  it('coupe au premier « ; : . ! ? … »', () => {
    expect(verseExcerpt('Le boucher a ses crochets ; à sa porte, mon aiguille.')).toBe('Le boucher a ses crochets');
    expect(verseExcerpt('La police perd ses affaires : cherchez entre ses voitures.')).toBe('La police perd ses affaires');
    expect(verseExcerpt('La capitainerie garde tout ce qui entre au port… même une aiguille.')).toBe('La capitainerie garde tout ce qui entre au port');
  });

  it('un vers court reste entier (sans le point final)', () => {
    expect(verseExcerpt('Ma main levée en tient une, et ne la lâche pas.')).toBe('Ma main levée en tient une, et ne la lâche pas');
    expect(verseExcerpt('« Un ange veille. »')).toBe('Un ange veille');
  });

  it('un vers long est coupé à la dernière virgule avant la limite, sinon au dernier mot avec « … »', () => {
    expect(verseExcerpt('Au parc qui porte mon nom, ma main levée en tient une, et ne la lâche pas.')).toBe('Au parc qui porte mon nom');
    expect(verseExcerpt('Là où l’on attend les trains, le temps a deux aiguilles : j’en ai mis une troisième.')).toBe('Là où l’on attend les trains');
    const long = verseExcerpt('Une phrase très longue sans aucune ponctuation intermédiaire qui dépasse largement la limite');
    expect(long.endsWith('…')).toBe(true);
    expect(long.length).toBeLessThanOrEqual(49);
    expect(long).not.toMatch(/\s…$/);
  });

  it('le toast : « Bien vu ! n sur m », suivi de l’extrait quand il y en a un', () => {
    expect(foundToastText(3, 10, 'Le boucher a ses crochets ; à sa porte, mon aiguille.')).toBe('Bien vu ! 3 sur 10 · Le boucher a ses crochets');
    expect(foundToastText(2, 3, null)).toBe('Bien vu ! 2 sur 3');
    expect(foundToastText(2, 3, '')).toBe('Bien vu ! 2 sur 3');
  });

  const bonus = CASES.find((c) => c.bonus)!;

  it('le testament du bonus : un vers par aiguille, chacun donne un extrait court qui commence le vers', () => {
    const tv = testamentVerses(bonus);
    expect(tv).not.toBeNull();
    const accept = bonus.steps[0].accept;
    expect(tv!.verses).toHaveLength(accept.length);
    tv!.verses.forEach((v, k) => {
      const ex = verseExcerpt(v);
      expect(ex.length, v).toBeGreaterThan(8);
      expect(ex.length, v).toBeLessThanOrEqual(49);
      expect(ex, v).not.toMatch(/[;:.!?]/);
      expect(v.startsWith(ex.replace(/…$/, '')), v).toBe(true);
      expect(verseFor(bonus, bonus.steps[0].id, accept[k]), v).toBe(v);
    });
  });

  it('verseFor : rien hors du bonus, ni pour une réponse inconnue', () => {
    expect(testamentVerses(CASES.find((c) => c.id === 'c00')!)).toBeNull();
    expect(verseFor(CASES.find((c) => c.id === 'c00')!, 's1', 'c00.x')).toBeNull();
    expect(verseFor(bonus, bonus.steps[0].id, 'inconnu')).toBeNull();
    expect(verseFor(bonus, 'autre-étape', bonus.steps[0].accept[0])).toBeNull();
  });
});
