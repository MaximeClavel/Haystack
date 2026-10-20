// Petits textes et calculs d'affichage (français), partagés par les écrans.
import type { CaseDef, CaseProgress, Entity, Rect, SaveData, World } from '../types';
import { bestStarsOf, hasSolved, requiredOf } from '../game';
import { worldMeta } from '../world/meta';

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
  // Meilleur résultat déjà obtenu : gardé même si l'enquête est recommencée.
  const stars = bestStarsOf(p);
  if (p?.status === 'solved') return { kind: 'solved', solvedSteps: totalSteps, totalSteps, stars };
  if (p && (p.status === 'active' || stars !== undefined)) return { kind: 'active', solvedSteps, totalSteps, stars };
  return { kind: 'new', solvedSteps, totalSteps };
}

/** Nombre d'enquêtes (hors bonus) résolues au moins une fois. */
export function solvedCount(cases: CaseDef[], save: SaveData): number {
  return cases.filter((c) => !c.bonus && hasSolved(save.cases[c.id])).length;
}

/** Raison du verrouillage : « Terminez « … » pour débloquer ». */
export function lockReason(def: CaseDef, save: SaveData, cases: CaseDef[]): string {
  const missing = (def.unlockAfter ?? []).filter((id) => !hasSolved(save.cases[id]));
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

/**
 * Au-dessous de cette surface (u²), un lieu remarquable (bâtiment, pont, parvis, chantier, kiosque…) passe
 * avant le nom de la rue ; au-dessus (parc, marché, grand-place, étang, cimetière…) c'est la rue qui l'emporte.
 */
const SMALL_PLACE_AREA = 200_000;
/** Rues de remplissage du générateur (« Rue n°124 ») : sans intérêt pour le joueur, jamais affichées. */
const FILL_STREET = /^Rue n°\d+$/;
/** Au plus deux noms de rue à un carrefour. */
const MAX_STREET_NAMES = 2;
/** Marge de capture maximale, en unités monde (zoom ≤ 1). */
const MAX_CAPTURE_MARGIN = 48;

/**
 * Marge de capture (unités monde) de la pastille de lieu : environ 48 px d'écran autour du centre de la
 * zone libre, plafonnée à 48 u quand la carte est dézoomée. Sans elle, un pont de 80 u de large n'est
 * nommé que si son axe passe à moins de 40 u du centre.
 */
export function placeCaptureMargin(zoom: number): number {
  return Math.min(MAX_CAPTURE_MARGIN, MAX_CAPTURE_MARGIN / Math.max(zoom, 0.01));
}

/** Distance d'un point à un rectangle (0 s'il est dedans, bords compris). */
function distanceToRect(r: Rect, x: number, y: number): number {
  return Math.hypot(Math.max(r.x - x, 0, x - (r.x + r.w)), Math.max(r.y - y, 0, y - (r.y + r.h)));
}

/** Rues nommées autour d'un point (les plus proches d'abord, au plus deux) : ni diagonales ni « Rue n°N ». */
function streetNamesAt(world: World, x: number, y: number, margin: number): string[] {
  const meta = worldMeta(world);
  if (!meta) return [];
  const hits: { name: string; dist: number }[] = [];
  for (const s of meta.streets) {
    // Les rues en biais ont pour rectangle leur boîte englobante : il n'a aucun sens ici.
    if (s.axis === 'd' || FILL_STREET.test(s.name)) continue;
    const dist = distanceToRect(s.rect, x, y);
    if (dist <= margin) hits.push({ name: s.name, dist });
  }
  hits.sort((a, b) => a.dist - b.dist); // tri stable : à égalité, ordre du plan des rues
  const names: string[] = [];
  for (const h of hits) if (!names.includes(h.name)) names.push(h.name);
  return names.slice(0, MAX_STREET_NAMES);
}

/**
 * Nom du lieu sous un point (pastille de lieu). Par ordre de priorité : petit lieu remarquable
 * (bâtiment, pont…), rue nommée (deux à un carrefour), grand lieu (parc, marché…), quartier.
 * Le quartier est ajouté après un lieu ou une rue (« Cinéma Le Rex · Les Halles »), sauf s'il porte le
 * même nom (« Parc des Meules ») ou à un carrefour (libellé trop long).
 *
 * `margin` (unités monde) agrandit chaque emprise de lieu ou de rue : les lieux étroits restent nommés
 * quand ils sont dans la vue sans être exactement sous le centre. Voir `placeCaptureMargin`.
 */
export function placeName(world: World, x: number, y: number, margin = 0): string {
  return apostrophes(rawPlaceName(world, x, y, margin));
}

function rawPlaceName(world: World, x: number, y: number, margin: number): string {
  const m = Math.max(0, margin);
  type Found = { name: string; dist: number; area: number };
  // Meilleur lieu de chaque classe : celui qui contient le point d'abord, puis le plus proche ;
  // à égalité, la plus petite emprise.
  const closer = (a: Found, b: Found | null): boolean => !b || a.dist < b.dist || (a.dist === b.dist && a.area < b.area);
  let small: Found | null = null;
  let large: Found | null = null;
  for (const lm of world.landmarks) {
    const dist = distanceToRect(lm.rect, x, y);
    if (dist > m) continue;
    const area = lm.rect.w * lm.rect.h;
    const found: Found = { name: lm.name, dist, area };
    if (area < SMALL_PLACE_AREA) {
      if (closer(found, small)) small = found;
    } else if (closer(found, large)) large = found;
  }
  const streets = streetNamesAt(world, x, y, m);
  const d = world.districts.find((q) => x >= q.rect.x && x < q.rect.x + q.rect.w && y >= q.rect.y && y < q.rect.y + q.rect.h);

  const main = small?.name ?? (streets.length > 0 ? streets.join(' / ') : (large?.name ?? null));
  if (main === null) return d?.name ?? 'Meulebourg';
  const crossroads = !small && streets.length > 1;
  if (!d || crossroads || d.name === main) return main;
  return `${main} · ${d.name}`;
}

/** Nom du quartier seul (liste des punaises). */
export function districtName(world: World, x: number, y: number): string {
  const d = world.districts.find((q) => x >= q.rect.x && x < q.rect.x + q.rect.w && y >= q.rect.y && y < q.rect.y + q.rect.h);
  return apostrophes(d?.name ?? 'Meulebourg');
}

/**
 * Apostrophe typographique (’) à l'affichage : les noms du monde (rues, lieux : `layoutSpec`, contrat) sont
 * écrits avec l'apostrophe droite (« Rue de l'Aiguillage »), alors que tous les textes de l'interface
 * utilisent ’. La normalisation se fait ici, à l'affichage, sans toucher au monde généré.
 */
export function apostrophes(text: string): string {
  return text.replace(/'/g, '\u2019');
}

/**
 * Typographie française à l'affichage : espace insécable avant « : ; ? ! » » et après « « »
 * (évite un « ? » seul en début de ligne). U+00A0 partout : toutes les polices du jeu l'ont.
 */
export function fr(text: string): string {
  return text.replace(/ +([:;?!»])/g, '\u00A0$1').replace(/(«) +/g, '$1\u00A0');
}

/** Découpe un texte en paragraphes (lignes vides) ; ponctuation française appliquée. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => fr(p.trim()))
    .filter((p) => p.length > 0);
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}
