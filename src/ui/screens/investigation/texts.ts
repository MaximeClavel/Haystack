// Textes de l'enquête qui dépendent des règles du jeu (étoiles, indices, testament du bonus).
// Fonctions PURES (aucun DOM) : testables sous Node, voir texts.test.ts.
import type { CaseDef } from '../../../types';
import { STAR_RULES } from '../../../game';

/**
 * Toasts d'une désignation fausse, en rotation sur le nombre total d'erreurs. Jamais « Pas tout à fait… » :
 * c'est le titre de la carte des fausses pistes, qui ne comptent PAS comme erreurs (le joueur croirait être tout près).
 */
export const WRONG_MESSAGES = ['Ce n’est pas ça…', 'Ce n’est pas ça… Regardez encore.', 'Toujours pas… Cherchez encore.'] as const;

/** Message de la `mistakes`-ième erreur de l'enquête (1 = la première). */
export function wrongMessage(mistakes: number): string {
  const n = WRONG_MESSAGES.length;
  return WRONG_MESSAGES[(((mistakes - 1) % n) + n) % n];
}

export const starsText = (n: number): string => `${n} étoile${n > 1 ? 's' : ''}`;

const indicesText = (n: number): string => `${n} indice${n > 1 ? 's' : ''}`;

/**
 * Ce qu'un indice coûte, en clair (la note est celle de l'enquête entière, erreurs comprises).
 * `stepCount` : nombre de questions de l'enquête. Il fixe l'horizon des 2 étoiles : tant que le total des
 * niveaux d'indice ne dépasse pas ce nombre (≈ un par question), la note reste à 2 étoiles.
 */
export function hintCostText(now: number, after: number, stepCount: number): string {
  if (after < now) return `Votre note passera de ${now} à ${starsText(after)} au plus.`;
  if (now === 2 && stepCount >= 2) {
    return `Votre note reste à 2 étoiles ; au-delà de ${indicesText(stepCount)} en tout, elle passera à 1 étoile.`;
  }
  return `Votre note reste à ${starsText(now)} pour l’instant.`;
}

/** Ce qui détermine la note d'une enquête terminée (voir STAR_RULES et computeStars dans game/session.ts). */
export interface StarFacts {
  stars: 1 | 2 | 3;
  /** Somme des niveaux d'indice pris (une révélation complète compte 3). */
  hints: number;
  mistakes: number;
  /** Nombre de questions de l'enquête : l'horizon des indices qui laissent 2 étoiles. */
  stepCount: number;
  /** Nombre de questions dont la réponse a été révélée (indice de niveau 3). */
  reveals: number;
}

/** Une ligne sous les étoiles de l'écran de fin : pourquoi cette note, sans changer la règle. */
export function starsExplanation(f: StarFacts): string {
  const { threeMaxMistakes, twoMaxMistakes } = STAR_RULES;
  const cap = f.stepCount;
  if (f.stars === 3) return `Aucun indice et au plus ${threeMaxMistakes} erreurs : le maximum !`;
  if (f.stars === 2) {
    const byHints = f.hints > 0;
    const byMistakes = f.mistakes > threeMaxMistakes;
    if (byHints && byMistakes) return 'Indices et erreurs : la note est plafonnée à 2 étoiles.';
    if (byHints) return `Les indices ont plafonné la note à 2 étoiles (jusqu’à ${indicesText(cap)} ; au-delà, 1 étoile).`;
    return `Plus de ${threeMaxMistakes} erreurs : la note est plafonnée à 2 étoiles.`;
  }
  if (f.reveals > 0) return 'Une réponse a été révélée : la note tombe à 1 étoile.';
  const tooManyHints = f.hints > cap;
  const tooManyMistakes = f.mistakes > twoMaxMistakes;
  if (tooManyHints && tooManyMistakes) {
    return `Trop d’indices et plus de ${twoMaxMistakes} erreurs : la note tombe à 1 étoile.`;
  }
  if (tooManyHints) {
    return cap === 1
      ? 'Plus d’un indice : la note tombe à 1 étoile.'
      : `Plus de ${cap} indices en tout (un par question) : la note tombe à 1 étoile.`;
  }
  return `Plus de ${twoMaxMistakes} erreurs : la note tombe à 1 étoile.`;
}

/** Libellé du compteur de questions du panneau : l'ordinal, ou le nombre de pistes quand plusieurs fils sont ouverts. */
export function panelLabel(opts: { stepCount: number; index: number; openCount: number }): string {
  if (opts.stepCount <= 1) return 'Votre mission';
  if (opts.openCount > 1) return `${opts.openCount} pistes ouvertes`;
  return `Question ${opts.index + 1} sur ${opts.stepCount}`;
}

/**
 * Rappel de la question sur la feuille de confirmation : même logique que le panneau (le nom de la piste
 * quand plusieurs fils sont ouverts, pour ne pas montrer un ordinal que le panneau n'affiche plus).
 */
export function confirmLabel(opts: { stepCount: number; index: number; openCount: number; label?: string }): string {
  if (opts.stepCount <= 1) return 'Votre mission';
  if (opts.openCount > 1 && opts.label) return opts.label;
  return `Question ${opts.index + 1} sur ${opts.stepCount}`;
}

/**
 * Vers du « testament » d'une enquête à réponses multiples (bonus) : un vers par réponse, dans l'ordre
 * de `accept`. `null` si le briefing n'a pas cette forme (le texte est alors affiché tel quel).
 */
export function testamentVerses(def: CaseDef): { paragraph: string; verses: string[] } | null {
  const accept = def.steps[0]?.accept ?? [];
  if (!def.bonus || accept.length < 3) return null;
  for (const para of def.intro.split(/\n\s*\n/)) {
    const lines = para
      .split('\n')
      .map((l) => l.replace(/^\s*«\s*/, '').replace(/\s*»\s*$/, '').trim())
      .filter((l) => l.length > 0);
    if (lines.length === accept.length) return { paragraph: para, verses: lines };
  }
  return null;
}

/** Longueur maximale (caractères) de l'extrait d'un vers dans le toast de trouvaille. */
const EXCERPT_MAX = 48;

/**
 * Début d'un vers, pour le rappeler dans un toast : jusqu'au premier « ; : . ! ? … », sans dépasser
 * EXCERPT_MAX caractères (coupe alors à la dernière virgule, sinon au dernier mot, avec « … »).
 */
export function verseExcerpt(verse: string): string {
  let v = verse.replace(/^\s*«\s*/, '').replace(/\s*»\s*$/, '').trim();
  const stop = v.search(/[;:.!?…]/);
  if (stop > 0) v = v.slice(0, stop).trim();
  if (v.length <= EXCERPT_MAX) return v;
  const head = v.slice(0, EXCERPT_MAX);
  const comma = head.lastIndexOf(',');
  if (comma >= 12) return head.slice(0, comma).trim();
  const space = head.lastIndexOf(' ');
  return `${(space > 0 ? head.slice(0, space) : head).replace(/[,\s]+$/, '')}…`;
}

/** Vers du testament qui désigne la réponse `foundId` de l'étape `stepId` (bonus), sinon `null`. */
export function verseFor(def: CaseDef, stepId: string, foundId: string): string | null {
  const step = def.steps.find((s) => s.id === stepId);
  const tv = testamentVerses(def);
  if (!step || !tv || step !== def.steps[0]) return null;
  const k = step.accept.indexOf(foundId);
  return k >= 0 ? (tv.verses[k] ?? null) : null;
}

/** Toast d'une trouvaille intermédiaire : « Bien vu ! 3 sur 10 », suivi du début du vers quand il y en a un. */
export function foundToastText(found: number, required: number, verse: string | null): string {
  const base = `Bien vu ! ${found} sur ${required}`;
  const ex = verse ? verseExcerpt(verse) : '';
  return ex ? `${base} · ${ex}` : base;
}
