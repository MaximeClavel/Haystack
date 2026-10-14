// Registre des enquêtes, dans l'ordre d'affichage.
// Chaque enquête vit dans src/content/cases/<id>.ts et exporte un CaseDef.
// La bible narrative et le guide de chaque enquête sont dans docs/CONTENT.md (généré par tools/content/gen.ts).
import type { CaseDef } from '../types';
import { c00 } from './cases/c00';
import { c01 } from './cases/c01';
import { c02 } from './cases/c02';
import { c03 } from './cases/c03';
import { c04 } from './cases/c04';
import { c05 } from './cases/c05';
import { bonusAiguilles } from './cases/bonus-aiguilles';

export const CASES: CaseDef[] = [c00, c01, c02, c03, c04, c05, bonusAiguilles];
