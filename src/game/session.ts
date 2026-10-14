// Partie en cours d'une enquête : étapes, réponses, indices, fils rouges, étoiles, punaises et notes.
import type {
  CaseDef,
  CaseProgress,
  Circle,
  HintResult,
  Pick,
  StepDef,
  StepProgress,
  SubmitOutcome,
  Vec2,
  World,
} from '../types';
import { getHitRect } from '../art/bounds';
import { hashString, Rng } from '../lib/rng';
import {
  halfDiagonal,
  pointInPolygon,
  rectCenter,
  rectContains,
  targetCenter,
  targetExists,
  targetRect,
  unionRect,
} from './geometry';

/** Niveau d'indice maximal (3 = révélation). */
export const MAX_HINT_LEVEL = 3;
/** Rayon du projecteur automatique d'indice de niveau 2 (unités monde). */
export const AUTO_HINT_RADIUS = 220;
/** Marge autour de la réponse révélée au niveau 3. */
export const REVEAL_MARGIN = 12;
/** Rayon minimal du cercle de révélation. */
export const MIN_REVEAL_RADIUS = 28;
/** Texte de l'indice de niveau 3. */
export const REVEAL_TEXT = 'Voici où regarder.';
/** Nombre maximal de punaises par enquête (au-delà, la plus ancienne est retirée). */
export const MAX_PINS = 30;
/** Longueur maximale des notes du carnet. */
export const MAX_NOTES_LENGTH = 4000;

/**
 * Règle des étoiles (enquête résolue) :
 * - 3 étoiles : aucun indice et au plus 2 erreurs ;
 * - 2 étoiles : aucune révélation (indice de niveau 3), au plus un niveau d'indice par étape
 *   en moyenne (niveaux cumulés ≤ nombre d'étapes) et au plus 6 erreurs ;
 * - 1 étoile : sinon.
 * Un « niveau d'indice » compte 1 par appel à hint() (une révélation complète coûte donc 3).
 * Les fausses pistes (« near ») et les réponses déjà trouvées ne sont pas des erreurs.
 */
export const STAR_RULES = {
  threeMaxMistakes: 2,
  twoMaxMistakes: 6,
} as const;

export interface SessionOptions {
  /** Horloge (ms) — injectable pour les tests. Défaut : Date.now. */
  now?: () => number;
}

/** Fil rouge prêt à dessiner (overlay `thread`). */
export interface ThreadLine {
  stepId: string;
  ids: [string, string];
  from: Vec2;
  to: Vec2;
}

/** Réponse trouvée (pour marquer les entités trouvées sur la carte). */
export interface FoundMark {
  stepId: string;
  id: string;
}

/** Calcule les étoiles d'après les progressions des étapes (voir STAR_RULES). */
export function computeStars(steps: readonly StepProgress[], stepCount: number = steps.length): 1 | 2 | 3 {
  let hints = 0;
  let reveals = 0;
  let mistakes = 0;
  for (const s of steps) {
    hints += s.hints;
    if (s.hints >= MAX_HINT_LEVEL) reveals++;
    mistakes += s.mistakes;
  }
  if (hints === 0 && mistakes <= STAR_RULES.threeMaxMistakes) return 3;
  if (reveals === 0 && hints <= stepCount && mistakes <= STAR_RULES.twoMaxMistakes) return 2;
  return 1;
}

/** Nombre de réponses à trouver pour une étape (défaut 1, borné à [1, accept.length]). */
export function requiredOf(step: StepDef): number {
  const r = step.required ?? 1;
  const n = Number.isFinite(r) ? Math.floor(r) : 1;
  return Math.max(1, Math.min(n, Math.max(1, step.accept.length)));
}

/** Étapes dont dépend une étape : `after`, sinon l'étape précédente du tableau (aucune pour la première). */
export function stepDependencies(def: CaseDef, index: number): string[] {
  const step = def.steps[index];
  if (step.after) return [...step.after];
  return index === 0 ? [] : [def.steps[index - 1].id];
}

/**
 * Ids de `ids` désignés par `pick`, du plus précis au moins précis, sans doublon :
 * (a) l'entité désignée elle-même ; (b) les ZONES qui contiennent le point ;
 * (c) les BÂTIMENTS dont le rectangle (toit + façade) contient le point — un tap sur la façade
 * compte même si un passant se tient devant.
 */
export function matchTargets(world: World, ids: readonly string[], pick: Pick): string[] {
  const out: string[] = [];
  if (pick.entityId !== null && ids.includes(pick.entityId)) out.push(pick.entityId);
  for (const id of ids) {
    if (out.includes(id)) continue;
    const z = world.zones.get(id);
    if (z && z.points.length >= 3 && pointInPolygon(z.points, pick.point)) out.push(id);
  }
  for (const id of ids) {
    if (out.includes(id)) continue;
    const e = world.byId.get(id);
    if (e && e.kind === 'building' && rectContains(getHitRect(e), pick.point)) out.push(id);
  }
  return out;
}

function copyStepProgress(s: StepProgress): StepProgress {
  const c: StepProgress = { found: [...s.found], hints: s.hints, mistakes: s.mistakes };
  if (s.solvedAt !== undefined) c.solvedAt = s.solvedAt;
  return c;
}

function copyProgress(p: CaseProgress): CaseProgress {
  const steps: Record<string, StepProgress> = {};
  for (const [k, s] of Object.entries(p.steps)) steps[k] = copyStepProgress(s);
  const c: CaseProgress = {
    caseId: p.caseId,
    status: p.status,
    steps,
    pins: p.pins.map((q) => ({ x: q.x, y: q.y })),
    notes: p.notes,
  };
  if (p.startedAt !== undefined) c.startedAt = p.startedAt;
  if (p.solvedAt !== undefined) c.solvedAt = p.solvedAt;
  if (p.stars !== undefined) c.stars = p.stars;
  return c;
}

function clampInt(v: unknown, min: number, max: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : min;
  return Math.max(min, Math.min(max, n));
}

/** Progression vierge d'une enquête. */
export function newCaseProgress(def: CaseDef): CaseProgress {
  const steps: Record<string, StepProgress> = {};
  for (const s of def.steps) steps[s.id] = { found: [], hints: 0, mistakes: 0 };
  return { caseId: def.id, status: 'new', steps, pins: [], notes: '' };
}

/**
 * Une partie d'enquête. Toutes les méthodes sont synchrones et pures vis-à-vis du monde
 * (aucune modification du World) ; l'état est exporté par progress() pour la sauvegarde.
 */
export class CaseSession {
  readonly def: CaseDef;
  readonly world: World;
  private readonly now: () => number;
  private readonly stepById = new Map<string, StepDef>();
  private readonly deps = new Map<string, string[]>();
  private state: CaseProgress;

  /**
   * @param progress progression sauvegardée (reprise). Elle est copiée et nettoyée : réponses
   *   inconnues retirées, compteurs bornés, étapes ajoutées depuis complétées. Son `caseId`
   *   doit être celui de l'enquête.
   */
  constructor(def: CaseDef, world: World, progress?: CaseProgress | null, opts: SessionOptions = {}) {
    this.def = def;
    this.world = world;
    this.now = opts.now ?? (() => Date.now());
    def.steps.forEach((s, i) => {
      if (this.stepById.has(s.id)) throw new Error(`[game] étape en double « ${s.id} » (enquête ${def.id})`);
      this.stepById.set(s.id, s);
      this.deps.set(s.id, stepDependencies(def, i));
    });
    if (progress && progress.caseId !== def.id) {
      throw new Error(`[game] progression de « ${progress.caseId} » fournie pour l'enquête « ${def.id} »`);
    }
    this.state = progress ? this.restore(progress) : newCaseProgress(def);
  }

  private restore(p: CaseProgress): CaseProgress {
    const s = newCaseProgress(this.def);
    for (const step of this.def.steps) {
      const old = p.steps?.[step.id];
      if (!old) continue;
      const found: string[] = [];
      for (const id of Array.isArray(old.found) ? old.found : []) {
        if (step.accept.includes(id) && !found.includes(id)) found.push(id);
      }
      const sp: StepProgress = {
        found,
        hints: clampInt(old.hints, 0, MAX_HINT_LEVEL),
        mistakes: clampInt(old.mistakes, 0, Number.MAX_SAFE_INTEGER),
      };
      if (found.length >= requiredOf(step) && typeof old.solvedAt === 'number') sp.solvedAt = old.solvedAt;
      s.steps[step.id] = sp;
    }
    s.pins = (Array.isArray(p.pins) ? p.pins : [])
      .filter((q) => q && Number.isFinite(q.x) && Number.isFinite(q.y))
      .slice(-MAX_PINS)
      .map((q) => ({ x: q.x, y: q.y }));
    s.notes = typeof p.notes === 'string' ? p.notes.slice(0, MAX_NOTES_LENGTH) : '';
    if (typeof p.startedAt === 'number') s.startedAt = p.startedAt;
    const touched =
      p.status !== 'new' ||
      s.pins.length > 0 ||
      s.notes !== '' ||
      Object.values(s.steps).some((sp) => sp.found.length > 0 || sp.hints > 0 || sp.mistakes > 0);
    if (this.allStepsSolved(s)) {
      s.status = 'solved';
      s.solvedAt = typeof p.solvedAt === 'number' ? p.solvedAt : this.now();
      s.stars = p.stars === 1 || p.stars === 2 || p.stars === 3 ? p.stars : this.computeStarsOf(s);
    } else {
      s.status = touched ? 'active' : 'new';
    }
    return s;
  }

  /* ------------------------------------------------------------------ état des étapes */

  /** Définition d'une étape (erreur si l'id est inconnu). */
  getStep(stepId: string): StepDef {
    const step = this.stepById.get(stepId);
    if (!step) throw new Error(`[game] étape inconnue « ${stepId} » (enquête ${this.def.id})`);
    return step;
  }

  private sp(stepId: string): StepProgress {
    return this.state.steps[stepId];
  }

  private solvedIn(state: CaseProgress, step: StepDef): boolean {
    return state.steps[step.id].found.length >= requiredOf(step);
  }

  private allStepsSolved(state: CaseProgress): boolean {
    return this.def.steps.length > 0 && this.def.steps.every((st) => this.solvedIn(state, st));
  }

  isStepSolved(stepId: string): boolean {
    return this.solvedIn(this.state, this.getStep(stepId));
  }

  /** Étape débloquée : toutes ses dépendances sont résolues (les ids inconnus sont ignorés). */
  isStepUnlocked(stepId: string): boolean {
    this.getStep(stepId);
    return (this.deps.get(stepId) ?? []).every((d) => {
      const dep = this.stepById.get(d);
      return !dep || this.solvedIn(this.state, dep);
    });
  }

  /** Étape ouverte : débloquée et non résolue. */
  isStepOpen(stepId: string): boolean {
    return this.isStepUnlocked(stepId) && !this.isStepSolved(stepId);
  }

  /** Étapes débloquées et non résolues, dans l'ordre du tableau. */
  openSteps(): StepDef[] {
    return this.def.steps.filter((s) => this.isStepOpen(s.id));
  }

  /** Étapes résolues, dans l'ordre du tableau. */
  solvedSteps(): StepDef[] {
    return this.def.steps.filter((s) => this.solvedIn(this.state, s));
  }

  /** Copie de la progression d'une étape. */
  stepProgress(stepId: string): StepProgress {
    this.getStep(stepId);
    return copyStepProgress(this.sp(stepId));
  }

  /** Toutes les réponses trouvées, étape par étape (ordre du tableau puis ordre de découverte). */
  foundMarks(): FoundMark[] {
    const out: FoundMark[] = [];
    for (const s of this.def.steps) for (const id of this.sp(s.id).found) out.push({ stepId: s.id, id });
    return out;
  }

  isSolved(): boolean {
    return this.allStepsSolved(this.state);
  }

  /** Passe l'enquête de « new » à « active » (appelé implicitement par toute action du joueur). */
  begin(): void {
    if (this.state.status === 'new') {
      this.state.status = 'active';
      this.state.startedAt = this.now();
    }
  }

  /* ------------------------------------------------------------------ réponses */

  /**
   * Soumet une désignation pour une étape ouverte (erreur sinon).
   * - correcte si elle désigne un id de `accept` (entité, zone contenant le point, ou bâtiment
   *   dont la façade contient le point) pas encore trouvé ;
   * - « already » si elle ne désigne que des réponses déjà trouvées ;
   * - « near » si elle désigne une fausse piste (pas une erreur) ;
   * - « wrong » sinon (une erreur de plus).
   */
  submit(stepId: string, pick: Pick): SubmitOutcome {
    const step = this.getStep(stepId);
    if (!this.isStepOpen(stepId)) {
      throw new Error(`[game] l'étape « ${stepId} » n'est pas ouverte (enquête ${this.def.id})`);
    }
    this.begin();
    const sp = this.sp(stepId);
    const required = requiredOf(step);

    const hits = matchTargets(this.world, step.accept, pick);
    if (hits.length > 0) {
      const fresh = hits.find((id) => !sp.found.includes(id));
      if (fresh === undefined) return { kind: 'already', stepId };
      sp.found.push(fresh);
      const stepSolved = sp.found.length >= required;
      let caseSolved = false;
      if (stepSolved) {
        sp.solvedAt = this.now();
        if (this.allStepsSolved(this.state)) {
          caseSolved = true;
          this.state.status = 'solved';
          this.state.solvedAt = sp.solvedAt;
          this.state.stars = this.computeStarsOf(this.state);
        }
      }
      return { kind: 'correct', stepId, foundId: fresh, found: sp.found.length, required, stepSolved, caseSolved };
    }

    const nearMiss = step.nearMiss ?? [];
    const nearHits = matchTargets(
      this.world,
      nearMiss.map((n) => n.id),
      pick,
    );
    if (nearHits.length > 0) {
      const nm = nearMiss.find((n) => n.id === nearHits[0])!;
      return { kind: 'near', stepId, feedback: nm.feedback };
    }

    sp.mistakes++;
    return { kind: 'wrong', stepId };
  }

  /* ------------------------------------------------------------------ indices */

  /**
   * Demande l'indice suivant d'une étape ouverte (erreur sinon) : niveau 1 (texte), 2 (texte + zone),
   * 3 (révélation). Au-delà du niveau 3, renvoie de nouveau la révélation sans rien compter.
   */
  hint(stepId: string): HintResult {
    const step = this.getStep(stepId);
    if (!this.isStepOpen(stepId)) {
      throw new Error(`[game] indice impossible : l'étape « ${stepId} » n'est pas ouverte (enquête ${this.def.id})`);
    }
    this.begin();
    const sp = this.sp(stepId);
    sp.hints = Math.min(MAX_HINT_LEVEL, sp.hints + 1);
    return this.buildHint(step, sp.hints as 1 | 2 | 3);
  }

  /** Indice courant d'une étape ouverte (recalculé : il suit les réponses trouvées), ou null. */
  currentHint(stepId: string): HintResult | null {
    const step = this.getStep(stepId);
    const level = this.sp(stepId).hints;
    if (level === 0 || !this.isStepOpen(stepId)) return null;
    return this.buildHint(step, level as 1 | 2 | 3);
  }

  /** Réponses non trouvées qui existent dans le monde, dans l'ordre de `accept`. */
  private unfoundTargets(step: StepDef): string[] {
    const found = this.sp(step.id).found;
    return step.accept.filter((id) => !found.includes(id) && targetExists(this.world, id));
  }

  private buildHint(step: StepDef, level: 1 | 2 | 3): HintResult {
    if (level === 1) return { level, text: step.hints[0]?.text ?? '' };
    if (level === 2) {
      const h = step.hints[1] ?? step.hints[0];
      const res: HintResult = { level, text: h?.text ?? '' };
      const given = step.hints[1]?.area;
      const area = given ? { x: given.x, y: given.y, radius: given.radius } : this.autoArea(step);
      if (area) res.area = area;
      return res;
    }
    const missing = Math.max(0, requiredOf(step) - this.sp(step.id).found.length);
    const reveal = this.unfoundTargets(step).slice(0, missing);
    const res: HintResult = { level, text: REVEAL_TEXT, reveal };
    const area = this.revealArea(reveal);
    if (area) res.area = area;
    return res;
  }

  /**
   * Projecteur automatique (niveau 2) : cercle d'au moins AUTO_HINT_RADIUS autour de la première
   * réponse non trouvée, dont le centre est DÉCALÉ de façon déterministe (graine = enquête, étape,
   * réponse) pour ne pas pointer la réponse. La réponse reste entièrement dans le cercle.
   */
  private autoArea(step: StepDef): Circle | undefined {
    const id = this.unfoundTargets(step)[0];
    if (id === undefined) return undefined;
    const r = targetRect(this.world, id)!;
    const c = rectCenter(r);
    const hd = halfDiagonal(r);
    const radius = Math.max(AUTO_HINT_RADIUS, hd * 1.25);
    const slack = radius - hd;
    const rng = new Rng(hashString(`${this.def.id}/${step.id}/${id}`));
    const angle = rng.range(0, Math.PI * 2);
    const dist = slack * rng.range(0.35, 0.75);
    // Ramener le centre dans le monde ne fait que le rapprocher de la réponse (axe par axe).
    const x = Math.max(0, Math.min(this.world.width, c.x + Math.cos(angle) * dist));
    const y = Math.max(0, Math.min(this.world.height, c.y + Math.sin(angle) * dist));
    return { x, y, radius };
  }

  /**
   * Cercle serré (niveau 3) : autour de toutes les réponses révélées si elles sont proches,
   * sinon autour de la première (les autres sont listées dans `reveal`).
   */
  private revealArea(ids: readonly string[]): Circle | undefined {
    const rects = ids.map((id) => targetRect(this.world, id)).filter((r) => r !== undefined);
    if (rects.length === 0) return undefined;
    const tight = (r: (typeof rects)[number]): Circle => {
      const c = rectCenter(r);
      return { x: c.x, y: c.y, radius: Math.max(MIN_REVEAL_RADIUS, halfDiagonal(r) + REVEAL_MARGIN) };
    };
    const all = tight(rects.reduce(unionRect));
    return all.radius <= AUTO_HINT_RADIUS ? all : tight(rects[0]);
  }

  /* ------------------------------------------------------------------ fils rouges, étoiles */

  /** Fils rouges des étapes résolues (centres des entités ou zones ; ids inconnus ignorés). */
  threads(): ThreadLine[] {
    const out: ThreadLine[] = [];
    for (const step of this.solvedSteps()) {
      for (const [a, b] of step.thread ?? []) {
        const from = targetCenter(this.world, a);
        const to = targetCenter(this.world, b);
        if (from && to) out.push({ stepId: step.id, ids: [a, b], from, to });
      }
    }
    return out;
  }

  private computeStarsOf(state: CaseProgress): 1 | 2 | 3 {
    return computeStars(
      this.def.steps.map((s) => state.steps[s.id]),
      this.def.steps.length,
    );
  }

  /** Étoiles : figées à la résolution ; avant, estimation d'après la partie en cours. */
  stars(): 1 | 2 | 3 {
    return this.state.stars ?? this.computeStarsOf(this.state);
  }

  /** Nombre total d'erreurs et de niveaux d'indice utilisés. */
  totals(): { mistakes: number; hints: number } {
    let mistakes = 0;
    let hints = 0;
    for (const s of this.def.steps) {
      mistakes += this.sp(s.id).mistakes;
      hints += this.sp(s.id).hints;
    }
    return { mistakes, hints };
  }

  /* ------------------------------------------------------------------ carnet */

  /**
   * Ajoute une punaise (ramenée dans les limites du monde) ; renvoie son indice.
   * Au-delà de MAX_PINS, la plus ancienne est retirée. Coordonnées non finies : erreur.
   */
  addPin(p: Vec2): number {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error('[game] punaise invalide (coordonnées non finies)');
    this.begin();
    const x = Math.max(0, Math.min(this.world.width, p.x));
    const y = Math.max(0, Math.min(this.world.height, p.y));
    this.state.pins.push({ x, y });
    if (this.state.pins.length > MAX_PINS) this.state.pins.shift();
    return this.state.pins.length - 1;
  }

  /** Retire la punaise d'indice i ; renvoie faux si l'indice n'existe pas. */
  removePin(i: number): boolean {
    if (!Number.isInteger(i) || i < 0 || i >= this.state.pins.length) return false;
    this.state.pins.splice(i, 1);
    return true;
  }

  pins(): Vec2[] {
    return this.state.pins.map((q) => ({ x: q.x, y: q.y }));
  }

  /** Remplace les notes du carnet (tronquées à MAX_NOTES_LENGTH caractères). */
  setNotes(text: string): void {
    this.begin();
    this.state.notes = String(text).slice(0, MAX_NOTES_LENGTH);
  }

  notes(): string {
    return this.state.notes;
  }

  /* ------------------------------------------------------------------ sauvegarde */

  /** Copie sérialisable (JSON) de la progression. */
  progress(): CaseProgress {
    return copyProgress(this.state);
  }
}
