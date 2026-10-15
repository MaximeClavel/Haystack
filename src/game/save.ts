// Sauvegarde de la partie (localStorage, repli en mémoire) et déblocage des enquêtes.
import type { CaseDef, CaseProgress, SaveData, Settings, StepProgress, Vec2 } from '../types';
import { STORAGE_KEY } from '../config';
import { MAX_HINT_LEVEL, MAX_NOTES_LENGTH, MAX_PINS } from './session';

/** Sous-ensemble de l'API Storage utilisé (injectable pour les tests). */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface SaveStore {
  /** Partie sauvegardée (copie), ou une partie vierge si rien d'exploitable n'est stocké. */
  load(): SaveData;
  /** Enregistre la partie. Ne lève jamais : en cas d'échec du stockage, repli en mémoire. */
  save(data: SaveData): void;
  /** Efface la partie (stockage et mémoire). */
  reset(): void;
  /** Vrai tant que la sauvegarde atteint réellement le stockage (faux en repli mémoire). */
  isPersistent(): boolean;
}

export const DEFAULT_SETTINGS: Settings = { haptics: true, leftHanded: false, reducedMotion: false };

/** Partie vierge. */
export function defaultSave(): SaveData {
  return { version: 1, cases: {}, settings: { ...DEFAULT_SETTINGS }, seenHowTo: false };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function finiteOrUndefined(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function count(v: unknown, max: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0;
  return Math.max(0, Math.min(max, n));
}

function sanitizeStep(v: unknown): StepProgress | null {
  if (!isRecord(v)) return null;
  const found = Array.isArray(v.found) ? [...new Set(v.found.filter((x): x is string => typeof x === 'string'))] : [];
  const s: StepProgress = { found, hints: count(v.hints, MAX_HINT_LEVEL), mistakes: count(v.mistakes, 1e9) };
  const solvedAt = finiteOrUndefined(v.solvedAt);
  if (solvedAt !== undefined) s.solvedAt = solvedAt;
  return s;
}

/** Nettoie une progression lue du stockage ; null si elle est inexploitable. */
export function sanitizeCaseProgress(v: unknown, caseId: string): CaseProgress | null {
  if (!isRecord(v)) return null;
  const status = v.status === 'new' || v.status === 'active' || v.status === 'solved' ? v.status : 'active';
  const steps: Record<string, StepProgress> = {};
  if (isRecord(v.steps)) {
    for (const [k, sv] of Object.entries(v.steps)) {
      const s = sanitizeStep(sv);
      if (s) steps[k] = s;
    }
  }
  const pins: Vec2[] = Array.isArray(v.pins)
    ? v.pins
        .filter((p): p is Vec2 => isRecord(p) && Number.isFinite(p.x) && Number.isFinite(p.y))
        .slice(-MAX_PINS)
        .map((p) => ({ x: p.x, y: p.y }))
    : [];
  const p: CaseProgress = {
    caseId,
    status,
    steps,
    pins,
    notes: typeof v.notes === 'string' ? v.notes.slice(0, MAX_NOTES_LENGTH) : '',
  };
  const startedAt = finiteOrUndefined(v.startedAt);
  if (startedAt !== undefined) p.startedAt = startedAt;
  const solvedAt = finiteOrUndefined(v.solvedAt);
  if (solvedAt !== undefined) p.solvedAt = solvedAt;
  if (v.stars === 1 || v.stars === 2 || v.stars === 3) p.stars = v.stars;
  if (v.bestStars === 1 || v.bestStars === 2 || v.bestStars === 3) p.bestStars = v.bestStars;
  return p;
}

/**
 * Nettoie une sauvegarde quelconque (JSON déjà analysé). Renvoie null si ce n'est pas une
 * sauvegarde de version 1. Les champs invalides sont remplacés par leur valeur par défaut.
 */
export function sanitizeSave(raw: unknown): SaveData | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const out = defaultSave();
  if (isRecord(raw.cases)) {
    for (const [id, v] of Object.entries(raw.cases)) {
      const p = sanitizeCaseProgress(v, id);
      if (p) out.cases[id] = p;
    }
  }
  if (isRecord(raw.settings)) {
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      const val = raw.settings[k];
      if (typeof val === 'boolean') out.settings[k] = val;
    }
  }
  out.seenHowTo = raw.seenHowTo === true;
  return out;
}

function cloneSave(d: SaveData): SaveData {
  // Une sauvegarde est du JSON pur : l'aller-retour JSON est une copie profonde fidèle.
  return sanitizeSave(JSON.parse(JSON.stringify(d))) ?? defaultSave();
}

function defaultStorage(): KeyValueStorage | null {
  try {
    // L'accès à localStorage lui-même peut lever (cookies bloqués, contexte sandboxé).
    const s = (globalThis as { localStorage?: KeyValueStorage }).localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

/**
 * Magasin de sauvegarde. `storage` : stockage à utiliser (défaut : localStorage s'il existe) ;
 * `null` force le mode mémoire. Robuste au JSON corrompu, aux versions inconnues et aux
 * exceptions du stockage : la partie continue en mémoire, sans persistance.
 */
export function createSaveStore(storage?: KeyValueStorage | null, key: string = STORAGE_KEY): SaveStore {
  const backend = storage === undefined ? defaultStorage() : storage;
  let memory: SaveData | null = null;
  // Après un échec d'écriture, le stockage n'est plus la référence : on lit la mémoire.
  let degraded = backend === null;

  function readBackend(): SaveData | null {
    if (!backend) return null;
    let raw: string | null;
    try {
      raw = backend.getItem(key);
    } catch {
      degraded = true;
      return null;
    }
    if (raw === null) return null;
    try {
      return sanitizeSave(JSON.parse(raw));
    } catch {
      return null; // JSON corrompu : partie vierge (le stockage n'est réécrit qu'au prochain save)
    }
  }

  return {
    load(): SaveData {
      if (!degraded) {
        const d = readBackend();
        if (!degraded) return d ?? defaultSave();
      }
      return memory ? cloneSave(memory) : defaultSave();
    },
    save(data: SaveData): void {
      memory = cloneSave(data);
      if (!backend) return;
      try {
        backend.setItem(key, JSON.stringify(memory));
        degraded = false;
      } catch {
        degraded = true; // quota dépassé, navigation privée… : repli mémoire
      }
    },
    reset(): void {
      memory = null;
      if (!backend) return;
      try {
        backend.removeItem(key);
        degraded = false;
      } catch {
        degraded = true;
      }
    },
    isPersistent(): boolean {
      return backend !== null && !degraded;
    },
  };
}

/**
 * Une enquête a-t-elle été résolue au moins une fois ? Vrai pour une partie résolue, et aussi pour
 * une enquête recommencée ou revenue « active » (`bestStars` conservé) : recommencer ne verrouille
 * pas les enquêtes suivantes.
 */
export function hasSolved(p: CaseProgress | undefined | null): boolean {
  return !!p && (p.status === 'solved' || p.bestStars !== undefined);
}

/** Une enquête est débloquée quand toutes celles de `unlockAfter` ont été résolues. */
export function isUnlocked(def: CaseDef, save: SaveData): boolean {
  return (def.unlockAfter ?? []).every((id) => hasSolved(save.cases[id]));
}

/** Copie de la sauvegarde où la progression d'une enquête est remplacée. */
export function withCaseProgress(save: SaveData, progress: CaseProgress): SaveData {
  const out = cloneSave(save);
  out.cases[progress.caseId] = sanitizeCaseProgress(JSON.parse(JSON.stringify(progress)), progress.caseId)!;
  return out;
}
