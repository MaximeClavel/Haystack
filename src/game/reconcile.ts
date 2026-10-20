// Réconciliation d'une sauvegarde avec le contenu publié : après une mise à jour des enquêtes
// (étapes ajoutées, réponses retirées…), le statut sauvegardé peut ne plus dire la vérité.
// Passer chaque progression par CaseSession.restore() la recalcule (même source de vérité que
// l'écran d'enquête) ; ainsi la liste des dossiers, le déblocage et le jeu ne divergent pas.
import type { CaseDef, SaveData, World } from '../types';
import { CaseSession } from './session';

/**
 * Renvoie la sauvegarde avec chaque progression d'une enquête connue recalculée. Si rien ne change,
 * renvoie LA MÊME référence (l'appelant peut éviter une écriture). Les enquêtes inconnues du
 * contenu sont laissées telles quelles (sans effet, et utiles si elles reviennent).
 */
export function reconcileSave(save: SaveData, cases: readonly CaseDef[], world: World): SaveData {
  let out: SaveData | null = null;
  for (const def of cases) {
    const p = save.cases[def.id];
    if (!p) continue;
    let next;
    try {
      next = new CaseSession(def, world, p).progress();
    } catch {
      continue; // progression inexploitable : laissée telle quelle
    }
    if (JSON.stringify(next) !== JSON.stringify(p)) {
      out ??= { ...save, cases: { ...save.cases } };
      out.cases[def.id] = next;
    }
  }
  return out ?? save;
}
