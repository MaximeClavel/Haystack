// Module game : règles d'une enquête, désignation, indices, étoiles, sauvegarde, validation du contenu.
// Module PUR : aucun accès au DOM (le stockage est injecté), testable sous Node. Voir README.md.
export { pickAt, pickTolerance } from './pick';
export {
  CaseSession,
  computeStars,
  matchTargets,
  newCaseProgress,
  requiredOf,
  stepDependencies,
  AUTO_HINT_RADIUS,
  MAX_HINT_LEVEL,
  MAX_NOTES_LENGTH,
  MAX_PINS,
  MIN_REVEAL_RADIUS,
  REVEAL_MARGIN,
  REVEAL_TEXT,
  STAR_RULES,
  type FoundMark,
  type SessionOptions,
  type ThreadLine,
} from './session';
export { entityCenter, targetCenter, targetExists, targetRect } from './geometry';
export {
  createSaveStore,
  defaultSave,
  isUnlocked,
  sanitizeCaseProgress,
  sanitizeSave,
  withCaseProgress,
  DEFAULT_SETTINGS,
  type KeyValueStorage,
  type SaveStore,
} from './save';
export { validateAllCases, validateCase } from './validate';
