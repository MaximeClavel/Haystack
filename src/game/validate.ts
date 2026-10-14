// Validation du contenu des enquêtes contre le monde construit (utilisée par les tests de contenu).
// Chaque problème est un message en français préfixé par « [<id de l'enquête>] ».
import type { CaseDef, CharacterDef, Circle, Entity, Rect, StepDef, Vec2, World } from '../types';
import { MAX_ZOOM, MIN_ZOOM_FLOOR } from '../config';
import { getEntityBounds } from '../art/bounds';
import { groundAt, isHiddenByRoof, isWalkable } from '../world';
import { circleContains, rectsIntersect, targetCenter, targetExists } from './geometry';
import { stepDependencies } from './session';

const CASE_ID_RE = /^[a-z0-9][a-z0-9-]*$/;

function blank(s: unknown): boolean {
  return typeof s !== 'string' || s.trim() === '';
}

function finite(...v: unknown[]): boolean {
  return v.every((x) => typeof x === 'number' && Number.isFinite(x));
}

function inWorld(world: World, p: Vec2): boolean {
  return finite(p.x, p.y) && p.x >= 0 && p.y >= 0 && p.x <= world.width && p.y <= world.height;
}

function rectInWorld(world: World, r: Rect): boolean {
  return r.x >= 0 && r.y >= 0 && r.x + r.w <= world.width && r.y + r.h <= world.height;
}

/** Id « ambiant » (a.p.12, a.v.3…) : instable si le générateur change, et peut être retiré par une scène. */
function isAmbientId(id: string): boolean {
  return id.startsWith('a.');
}

function dup<T>(items: readonly T[]): T[] {
  const seen = new Set<T>();
  const out = new Set<T>();
  for (const x of items) {
    if (seen.has(x)) out.add(x);
    seen.add(x);
  }
  return [...out];
}

const list = (ids: readonly string[]): string => ids.map((i) => `« ${i} »`).join(', ');

/** Une entité est-elle exemptée de la règle « posée sur un sol praticable » ? */
function placementExempt(e: Entity): boolean {
  if ((e.z ?? 0) > 0) return true;
  if (e.kind === 'person' && e.pose === 'window') return true;
  return false;
}

/** Cycle dans un graphe de dépendances (ids → dépendances). Renvoie le chemin du premier cycle trouvé. */
function findCycle(nodes: readonly string[], depsOf: (id: string) => readonly string[]): string[] | null {
  const color = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const known = new Set(nodes);
  let cycle: string[] | null = null;
  const visit = (n: string): void => {
    if (cycle) return;
    color.set(n, 1);
    stack.push(n);
    for (const d of depsOf(n)) {
      if (!known.has(d) || cycle) continue;
      const c = color.get(d) ?? 0;
      if (c === 1) {
        cycle = [...stack.slice(stack.indexOf(d)), d];
        return;
      }
      if (c === 0) visit(d);
    }
    stack.pop();
    color.set(n, 2);
  };
  for (const n of nodes) if ((color.get(n) ?? 0) === 0) visit(n);
  return cycle;
}

/** Nœuds atteignables : ceux dont toutes les dépendances (connues) sont atteignables. */
function reachable(nodes: readonly string[], depsOf: (id: string) => readonly string[]): Set<string> {
  const known = new Set(nodes);
  const ok = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of nodes) {
      if (ok.has(n)) continue;
      if (depsOf(n).every((d) => !known.has(d) || ok.has(d))) {
        ok.add(n);
        changed = true;
      }
    }
  }
  return ok;
}

function checkCircle(world: World, c: Circle | undefined): string | null {
  if (!c) return null;
  if (!finite(c.x, c.y, c.radius) || c.radius <= 0) return 'zone d\'indice invalide (rayon nul ou valeurs non finies)';
  if (!inWorld(world, c)) return `zone d'indice hors du monde (${Math.round(c.x)}, ${Math.round(c.y)})`;
  return null;
}

function checkCaseWith(def: CaseDef, world: World, characters: ReadonlyMap<string, CharacterDef>): string[] {
  const id = typeof def.id === 'string' ? def.id : '?';
  const out: string[] = [];
  const err = (msg: string): void => {
    out.push(`[${id}] ${msg}`);
  };
  const prefix = `${id}.`;

  // --- Métadonnées
  if (!CASE_ID_RE.test(id)) err(`identifiant d'enquête invalide « ${id} » (minuscules, chiffres et tirets)`);
  if (blank(def.title)) err('titre vide');
  if (blank(def.teaser)) err('accroche (teaser) vide');
  if (blank(def.intro)) err('briefing (intro) vide');
  if (blank(def.epilogue)) err('épilogue vide');
  if (![1, 2, 3, 4, 5].includes(def.difficulty)) err(`difficulté invalide : ${String(def.difficulty)} (1 à 5)`);
  const st = def.start;
  if (!st || !inWorld(world, st)) err(`caméra de départ hors du monde (${st ? `${st.x}, ${st.y}` : 'absente'})`);
  else if (!finite(st.zoom) || st.zoom < MIN_ZOOM_FLOOR || st.zoom > MAX_ZOOM) {
    err(`zoom de départ invalide : ${st.zoom} (entre ${MIN_ZOOM_FLOOR} et ${MAX_ZOOM})`);
  }
  for (const u of def.unlockAfter ?? []) if (u === id) err('l\'enquête dépend d\'elle-même (unlockAfter)');

  // --- Personnages
  const charIds = def.characters.map((c) => c.id);
  for (const c of def.characters) {
    if (!c.id.startsWith(prefix)) err(`personnage « ${c.id} » : l'id doit commencer par « ${prefix} »`);
    if (blank(c.name)) err(`personnage « ${c.id} » : nom vide`);
  }
  for (const d of dup(charIds)) err(`personnage en double : « ${d} »`);

  // --- Entités
  const entIds = def.entities.map((e) => e.id);
  for (const d of dup(entIds)) err(`entité en double : « ${d} »`);
  for (const e of def.entities) {
    const where = `entité « ${e.id} »`;
    if (!e.id.startsWith(prefix)) err(`${where} : l'id doit commencer par « ${prefix} »`);
    const we = world.byId.get(e.id);
    if (!we) err(`${where} : absente du monde (buildWorld a-t-il reçu cette enquête ?)`);
    else if (we.kind !== e.kind) err(`${where} : le monde contient une entité de type ${we.kind} sous cet id`);
    if (!finite(e.x, e.y)) {
      err(`${where} : position non finie`);
      continue;
    }
    if (e.kind === 'person' && e.character !== undefined && !characters.has(e.character)) {
      err(`${where} : personnage inconnu « ${e.character} »`);
    }
    if ((e.z ?? 0) > 0 && e.sortY === undefined) {
      err(`${where} : en hauteur (z = ${e.z}) sans sortY explicite — elle serait dessinée sous le bâtiment`);
    }
    if (!rectInWorld(world, getEntityBounds(e))) err(`${where} : dépasse du monde`);
    if (e.kind !== 'building') {
      const p = { x: e.x, y: e.y };
      if (e.kind === 'vehicle' && e.vehicle === 'boat') {
        if (groundAt(world, p) !== 'water') err(`${where} : un bateau doit être sur l'eau (sol : ${groundAt(world, p)})`);
      } else if (!placementExempt(e)) {
        const onWater = groundAt(world, p) === 'water';
        const duckOk = e.kind === 'prop' && e.prop === 'duck' && onWater;
        if (!duckOk && !isWalkable(world, p)) {
          err(`${where} : n'est pas posée sur un sol praticable (${Math.round(e.x)}, ${Math.round(e.y)} : ${onWater ? 'eau' : 'bâtiment ou hors du monde'})`);
        }
        if (isHiddenByRoof(world, p)) err(`${where} : cachée par le toit d'un bâtiment (invisible)`);
      }
    }
  }

  // --- Zones
  const zoneIds = (def.zones ?? []).map((z) => z.id);
  for (const d of dup(zoneIds)) err(`zone en double : « ${d} »`);
  for (const z of def.zones ?? []) {
    const where = `zone « ${z.id} »`;
    if (!z.id.startsWith(prefix)) err(`${where} : l'id doit commencer par « ${prefix} »`);
    if (blank(z.label)) err(`${where} : libellé vide`);
    if (z.points.length < 3) err(`${where} : il faut au moins 3 sommets`);
    if (!z.points.every((p) => inWorld(world, p))) err(`${where} : sommet hors du monde`);
    if (!world.zones.has(z.id)) err(`${where} : absente du monde`);
    if (world.byId.has(z.id)) err(`${where} : porte le même id qu'une entité`);
  }

  // --- Lieux modifiés
  for (const [key, ov] of Object.entries(def.landmarkOverrides ?? {})) {
    const lmId = key.startsWith('lm.') ? key : `lm.${key}`;
    const b = world.byId.get(lmId);
    if (!b || b.kind !== 'building') err(`landmarkOverrides : lieu bâti inconnu « ${key} »`);
    if (ov.sign !== undefined && blank(ov.sign)) err(`landmarkOverrides « ${key} » : enseigne vide`);
  }

  // --- Étapes
  if (def.steps.length === 0) err('aucune étape');
  const stepIds = def.steps.map((s) => s.id);
  for (const d of dup(stepIds)) err(`id d'étape en double : « ${d} »`);
  const stepSet = new Set(stepIds);
  const depsById = new Map<string, string[]>();
  def.steps.forEach((s, i) => depsById.set(s.id, stepDependencies(def, i)));
  const depsOf = (sid: string): string[] => depsById.get(sid) ?? [];

  def.steps.forEach((s) => checkStep(s, world, stepSet, err));

  const cycle = findCycle(stepIds, depsOf);
  if (cycle) err(`cycle dans « after » : ${cycle.join(' → ')}`);
  const ok = reachable(stepIds, depsOf);
  const unreachable = stepIds.filter((s) => !ok.has(s));
  if (unreachable.length) err(`étapes jamais atteignables : ${list(unreachable)}`);

  // --- Reconstitution
  if (def.replay.length === 0) err('reconstitution (replay) vide');
  def.replay.forEach((r, i) => {
    if (!targetExists(world, r.id)) err(`replay[${i}] : entité ou zone inconnue « ${r.id} »`);
    if (blank(r.caption)) err(`replay[${i}] : légende vide`);
  });

  return out;
}

function checkStep(s: StepDef, world: World, stepSet: ReadonlySet<string>, err: (m: string) => void): void {
  const where = `étape « ${s.id} »`;
  if (blank(s.id)) err('étape sans id');
  if (blank(s.question)) err(`${where} : question vide`);
  if (blank(s.solved)) err(`${where} : texte de résolution (solved) vide`);

  for (const a of s.after ?? []) {
    if (a === s.id) err(`${where} : dépend d'elle-même (after)`);
    else if (!stepSet.has(a)) err(`${where} : after référence une étape inconnue « ${a} »`);
  }

  // Réponses
  if (s.accept.length === 0) err(`${where} : aucune réponse acceptée`);
  for (const d of dup(s.accept)) err(`${where} : réponse en double « ${d} »`);
  for (const a of s.accept) {
    if (!targetExists(world, a)) err(`${where} : réponse inconnue « ${a} » (ni entité ni zone du monde)`);
    if (isAmbientId(a)) err(`${where} : réponse « ${a} » ambiante (instable) — placer une entité d'enquête`);
  }
  const req = s.required ?? 1;
  if (!Number.isInteger(req) || req < 1) err(`${where} : required invalide (${String(s.required)})`);
  else if (req > s.accept.length) err(`${where} : required (${req}) dépasse le nombre de réponses (${s.accept.length})`);

  // Fausses pistes
  const nm = s.nearMiss ?? [];
  for (const d of dup(nm.map((n) => n.id))) err(`${where} : fausse piste en double « ${d} »`);
  for (const n of nm) {
    if (!targetExists(world, n.id)) err(`${where} : fausse piste inconnue « ${n.id} »`);
    if (isAmbientId(n.id)) err(`${where} : fausse piste « ${n.id} » ambiante (instable) — placer une entité d'enquête`);
    if (s.accept.includes(n.id)) err(`${where} : « ${n.id} » est à la fois réponse et fausse piste`);
    if (blank(n.feedback)) err(`${where} : fausse piste « ${n.id} » sans message`);
  }

  // Indices
  if (s.hints.length < 2) err(`${where} : il faut au moins 2 indices (${s.hints.length})`);
  s.hints.forEach((h, i) => {
    if (blank(h.text)) err(`${where} : indice ${i + 1} vide`);
    const c = checkCircle(world, h.area);
    if (c) err(`${where} : indice ${i + 1} : ${c}`);
  });
  const area = s.hints[1]?.area;
  if (area && !checkCircle(world, area)) {
    const centers = s.accept.map((a) => targetCenter(world, a)).filter((c) => c !== undefined);
    if (centers.length > 0 && !centers.some((c) => circleContains(area, c))) {
      err(`${where} : la zone de l'indice 2 ne contient aucune réponse`);
    }
  }

  // Fils rouges
  (s.thread ?? []).forEach(([a, b], i) => {
    for (const t of [a, b]) if (!targetExists(world, t)) err(`${where} : fil rouge ${i + 1} : entité ou zone inconnue « ${t} »`);
    if (a === b) err(`${where} : fil rouge ${i + 1} relie « ${a} » à elle-même`);
  });
}

/**
 * Problèmes d'une enquête (liste vide si tout va bien). Le monde doit avoir été construit
 * AVEC cette enquête (buildWorld({ cases })).
 */
export function validateCase(def: CaseDef, world: World): string[] {
  return checkCaseWith(def, world, new Map(def.characters.map((c) => [c.id, c])));
}

/**
 * Problèmes de l'ensemble des enquêtes : chaque enquête (validateCase, un personnage d'une autre
 * enquête pouvant être réutilisé), ids d'enquêtes, de personnages et d'entités uniques,
 * dépendances de déblocage (unlockAfter) existantes et sans cycle, et aucun chevauchement entre
 * entités d'enquêtes DIFFÉRENTES.
 */
export function validateAllCases(cases: readonly CaseDef[], world: World): string[] {
  const out: string[] = [];
  const caseIds = cases.map((c) => c.id);
  for (const d of dup(caseIds)) out.push(`[${d}] id d'enquête en double`);

  const characters = new Map<string, CharacterDef>();
  const charOwner = new Map<string, string>();
  for (const c of cases) {
    for (const ch of c.characters) {
      const prev = charOwner.get(ch.id);
      if (prev !== undefined && prev !== c.id) out.push(`[${c.id}] personnage « ${ch.id} » déjà défini par ${prev}`);
      characters.set(ch.id, ch);
      charOwner.set(ch.id, c.id);
    }
  }

  const entOwner = new Map<string, string>();
  for (const c of cases) {
    for (const e of c.entities) {
      const prev = entOwner.get(e.id);
      if (prev !== undefined && prev !== c.id) out.push(`[${c.id}] entité « ${e.id} » déjà définie par ${prev}`);
      entOwner.set(e.id, c.id);
    }
  }

  for (const c of cases) out.push(...checkCaseWith(c, world, characters));

  // Déblocage
  const known = new Set(caseIds);
  for (const c of cases) {
    for (const u of c.unlockAfter ?? []) {
      if (u !== c.id && !known.has(u)) out.push(`[${c.id}] unlockAfter : enquête inconnue « ${u} »`);
    }
  }
  const unlockDeps = (cid: string): string[] => cases.find((c) => c.id === cid)?.unlockAfter ?? [];
  const cycle = findCycle(caseIds, unlockDeps);
  if (cycle) out.push(`[${cycle[0]}] cycle de déblocage : ${cycle.join(' → ')}`);
  const ok = reachable(caseIds, unlockDeps);
  const locked = caseIds.filter((cid) => !ok.has(cid));
  if (locked.length) out.push(`[${locked[0]}] enquêtes jamais débloquables : ${list(locked)}`);

  // Chevauchements entre enquêtes différentes (balayage selon x)
  const items: { caseId: string; id: string; r: Rect }[] = [];
  for (const c of cases) {
    for (const e of c.entities) {
      if (finite(e.x, e.y)) items.push({ caseId: c.id, id: e.id, r: getEntityBounds(e) });
    }
  }
  items.sort((a, b) => a.r.x - b.r.x);
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    for (let j = i + 1; j < items.length && items[j].r.x < a.r.x + a.r.w; j++) {
      const b = items[j];
      if (a.caseId === b.caseId || !rectsIntersect(a.r, b.r)) continue;
      const [p, q] = a.caseId < b.caseId ? [a, b] : [b, a];
      out.push(`[${p.caseId}] l'entité « ${p.id} » chevauche « ${q.id} » de l'enquête ${q.caseId}`);
    }
  }
  return out;
}
