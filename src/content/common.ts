// Éléments partagés par les enquêtes brouillons : personnages récurrents.
// À recopier dans src/content/common.ts (ou équivalent) lors de l'implémentation.
import type { PersonAppearance } from '../types';

/**
 * Brigadier Gaston Picotin — présent dans chaque enquête (personnage récurrent).
 * Casquette de police, uniforme BLEU (les agents ordinaires sont en marine), bermuda beige,
 * écharpe, moustache rousse, costaud. Toujours en train de manger quelque chose.
 */
export const PICOTIN: PersonAppearance = {
  skin: 'light',
  hair: 'short',
  hairColor: 'red',
  hat: 'police',
  top: 'uniform',
  topColor: 'blue',
  topPattern: 'plain',
  bottom: 'shorts',
  bottomColor: 'beige',
  face: 'mustache',
  accessory: 'scarf',
  build: 'large',
};
