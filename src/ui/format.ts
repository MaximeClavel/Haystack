// Petits textes et calculs d'affichage (français), partagés par les écrans.
import type { CaseDef, CaseProgress, Entity, SaveData, World } from '../types';
import { requiredOf } from '../game';

/** Numéro de dossier affiché : « 00 », « 01 »… ; « ★ » pour un bonus. */
export function caseNumber(def: CaseDef): string {
  if (def.bonus) return '★';
  const m = /(\d+)/.exec(def.id);
  return m ? m[1].padStart(2, '0') : def.id;
}

export interface CaseStatus {
  kind: 'new' | 'active' | 'solved';
  solvedSteps: number;
  totalSteps: number;
  stars?: 1 | 2 | 3;
}

/** Nombre d'étapes résolues d'après une progression sauvegardée. */
export function countSolvedSteps(def: CaseDef, p: CaseProgress | undefined): number {
  if (!p) return 0;
  let n = 0;
  for (const s of def.steps) {
    const sp = p.steps[s.id];
    if (sp && sp.found.filter((id) => s.accept.includes(id)).length >= requiredOf(s)) n++;
  }
  return n;
}

export function caseStatus(def: CaseDef, save: SaveData): CaseStatus {
  const p = save.cases[def.id];
  const totalSteps = def.steps.length;
  const solvedSteps = countSolvedSteps(def, p);
  if (p?.status === 'solved') return { kind: 'solved', solvedSteps: totalSteps, totalSteps, stars: p.stars };
  if (p && p.status === 'active') return { kind: 'active', solvedSteps, totalSteps };
  return { kind: 'new', solvedSteps, totalSteps };
}

/** Raison du verrouillage : « Terminez « … » pour débloquer ». */
export function lockReason(def: CaseDef, save: SaveData, cases: CaseDef[]): string {
  const missing = (def.unlockAfter ?? []).filter((id) => save.cases[id]?.status !== 'solved');
  const titles = missing.map((id) => cases.find((c) => c.id === id)?.title ?? id);
  if (titles.length === 0) return '';
  const list = titles.map((t) => `« ${t} »`);
  const joined = list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} et ${list[list.length - 1]}`;
  return `Terminez ${joined} pour débloquer`;
}

const ANIMALS = new Set(['dog', 'cat', 'pigeons', 'duck']);

/** « cette personne », « cet objet »… (feuille de confirmation). */
export function targetLabel(e: Entity | null): string {
  if (!e) return 'cet endroit';
  switch (e.kind) {
    case 'person':
      return 'cette personne';
    case 'vehicle':
      return e.vehicle === 'boat' ? 'ce bateau' : e.vehicle === 'bicycle' ? 'ce vélo' : 'ce véhicule';
    case 'tree':
      return 'cet arbre';
    case 'building':
      return 'ce bâtiment';
    case 'prop':
      return ANIMALS.has(e.prop) ? 'cet animal' : 'cet objet';
  }
}

/** Nom du lieu sous un point : lieu remarquable s'il y en a un, sinon le quartier. */
export function placeName(world: World, x: number, y: number): string {
  let best: { name: string; area: number } | null = null;
  for (const lm of world.landmarks) {
    const r = lm.rect;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      const area = r.w * r.h;
      if (!best || area < best.area) best = { name: lm.name, area };
    }
  }
  const d = world.districts.find((q) => x >= q.rect.x && x < q.rect.x + q.rect.w && y >= q.rect.y && y < q.rect.y + q.rect.h);
  if (best && d) return `${best.name} · ${d.name}`;
  return best?.name ?? d?.name ?? 'Meulebourg';
}

/** Nom du quartier seul (liste des punaises). */
export function districtName(world: World, x: number, y: number): string {
  const d = world.districts.find((q) => x >= q.rect.x && x < q.rect.x + q.rect.w && y >= q.rect.y && y < q.rect.y + q.rect.h);
  return d?.name ?? 'Meulebourg';
}

/** Découpe un texte en paragraphes (lignes vides). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}
