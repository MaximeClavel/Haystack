import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CaseProgress, SaveData } from '../types';
import { STORAGE_KEY } from '../config';
import {
  createSaveStore,
  defaultSave,
  isUnlocked,
  sanitizeCaseProgress,
  sanitizeSave,
  withCaseProgress,
  type KeyValueStorage,
} from './save';
import { CaseSession, MAX_HINT_LEVEL, MAX_PINS } from './session';
import { caseDef, makeWorld, step } from './testkit';

/** Stockage en mémoire, avec pannes à la demande. */
class FakeStorage implements KeyValueStorage {
  data = new Map<string, string>();
  failGet = false;
  failSet = false;
  failRemove = false;
  getItem(k: string): string | null {
    if (this.failGet) throw new Error('SecurityError');
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    if (this.failSet) throw new Error('QuotaExceededError');
    this.data.set(k, v);
  }
  removeItem(k: string): void {
    if (this.failRemove) throw new Error('SecurityError');
    this.data.delete(k);
  }
}

function progress(caseId: string, status: CaseProgress['status']): CaseProgress {
  return { caseId, status, steps: { s1: { found: ['x'], hints: 1, mistakes: 2, solvedAt: 5 } }, pins: [{ x: 1, y: 2 }], notes: 'n' };
}

function sample(): SaveData {
  const d = defaultSave();
  d.cases.c00 = { ...progress('c00', 'solved'), solvedAt: 10, startedAt: 1, stars: 3 };
  d.cases.c01 = progress('c01', 'active');
  d.settings.haptics = false;
  d.seenHowTo = true;
  return d;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('defaultSave', () => {
  it('partie vierge, objets neufs à chaque appel', () => {
    const a = defaultSave();
    expect(a).toEqual({
      version: 1,
      cases: {},
      settings: { haptics: true, leftHanded: false, reducedMotion: false },
      seenHowTo: false,
    });
    a.settings.haptics = false;
    a.cases.x = progress('x', 'new');
    expect(defaultSave().settings.haptics).toBe(true);
    expect(defaultSave().cases).toEqual({});
  });
});

describe('createSaveStore', () => {
  it('stockage vide → partie vierge', () => {
    expect(createSaveStore(new FakeStorage()).load()).toEqual(defaultSave());
  });

  it('aller-retour par le stockage (clé STORAGE_KEY), entre deux magasins', () => {
    const st = new FakeStorage();
    createSaveStore(st).save(sample());
    expect(st.data.has(STORAGE_KEY)).toBe(true);
    expect(createSaveStore(st).load()).toEqual(sample());
  });

  it('clé personnalisable', () => {
    const st = new FakeStorage();
    createSaveStore(st, 'autre').save(sample());
    expect(st.data.has('autre')).toBe(true);
    expect(createSaveStore(st).load()).toEqual(defaultSave());
  });

  it('load et save travaillent sur des copies', () => {
    const store = createSaveStore(new FakeStorage());
    const d = sample();
    store.save(d);
    d.seenHowTo = false;
    d.cases.c01.notes = 'modifié';
    const loaded = store.load();
    expect(loaded).toEqual(sample());
    loaded.cases.c00.pins.push({ x: 0, y: 0 });
    expect(store.load()).toEqual(sample());
  });

  it('JSON corrompu → partie vierge, sans lever', () => {
    const st = new FakeStorage();
    for (const bad of ['{pas du json', '', 'undefined', '42', 'null', '[]', '"texte"']) {
      st.data.set(STORAGE_KEY, bad);
      expect(createSaveStore(st).load()).toEqual(defaultSave());
    }
  });

  it('version inconnue → partie vierge', () => {
    const st = new FakeStorage();
    st.data.set(STORAGE_KEY, JSON.stringify({ ...sample(), version: 2 }));
    expect(createSaveStore(st).load()).toEqual(defaultSave());
    st.data.set(STORAGE_KEY, JSON.stringify({ cases: {} }));
    expect(createSaveStore(st).load()).toEqual(defaultSave());
  });

  it('champs invalides remplacés par leur valeur par défaut', () => {
    const st = new FakeStorage();
    st.data.set(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        seenHowTo: 'oui',
        settings: { haptics: 'non', leftHanded: true, inconnu: true },
        cases: {
          c00: {
            status: 'bizarre',
            steps: { s1: { found: ['a', 'a', 3], hints: 12, mistakes: -1, solvedAt: 'hier' }, s2: 'x' },
            pins: [{ x: 1, y: 2 }, { x: 'a', y: 2 }, 5],
            notes: 7,
            stars: 4,
            startedAt: 'hier',
          },
          c01: 'pas un objet',
        },
      }),
    );
    const d = createSaveStore(st).load();
    expect(d.seenHowTo).toBe(false);
    expect(d.settings).toEqual({ haptics: true, leftHanded: true, reducedMotion: false });
    expect(Object.keys(d.cases)).toEqual(['c00']);
    expect(d.cases.c00).toEqual({
      caseId: 'c00',
      status: 'active',
      steps: { s1: { found: ['a'], hints: MAX_HINT_LEVEL, mistakes: 0 } },
      pins: [{ x: 1, y: 2 }],
      notes: '',
    });
  });

  it('getItem qui lève : partie vierge, puis repli mémoire après save', () => {
    const st = new FakeStorage();
    st.failGet = true;
    st.failSet = true;
    const store = createSaveStore(st);
    expect(store.load()).toEqual(defaultSave());
    expect(store.isPersistent()).toBe(false);
    expect(() => store.save(sample())).not.toThrow();
    expect(store.load()).toEqual(sample());
    expect(store.isPersistent()).toBe(false);
  });

  it('setItem qui lève (quota) : la partie continue en mémoire, puis reprend le stockage', () => {
    const st = new FakeStorage();
    const store = createSaveStore(st);
    store.save(defaultSave());
    expect(store.isPersistent()).toBe(true);
    st.failSet = true;
    expect(() => store.save(sample())).not.toThrow();
    expect(store.isPersistent()).toBe(false);
    // Le stockage contient l'ancienne version : on lit la mémoire, plus récente.
    expect(store.load()).toEqual(sample());
    st.failSet = false;
    const d = sample();
    d.seenHowTo = false;
    store.save(d);
    expect(store.isPersistent()).toBe(true);
    expect(createSaveStore(st).load()).toEqual(d);
  });

  it('reset : efface stockage et mémoire, même si removeItem lève', () => {
    const st = new FakeStorage();
    const store = createSaveStore(st);
    store.save(sample());
    store.reset();
    expect(st.data.size).toBe(0);
    expect(store.load()).toEqual(defaultSave());

    store.save(sample());
    st.failRemove = true;
    expect(() => store.reset()).not.toThrow();
    expect(store.load()).toEqual(defaultSave());
  });

  it('null : mode mémoire forcé', () => {
    const store = createSaveStore(null);
    expect(store.isPersistent()).toBe(false);
    expect(store.load()).toEqual(defaultSave());
    store.save(sample());
    expect(store.load()).toEqual(sample());
    store.reset();
    expect(store.load()).toEqual(defaultSave());
  });

  it('par défaut : localStorage s’il existe', () => {
    const st = new FakeStorage();
    vi.stubGlobal('localStorage', st);
    const store = createSaveStore();
    store.save(sample());
    expect(store.isPersistent()).toBe(true);
    expect(st.data.has(STORAGE_KEY)).toBe(true);
  });

  it('par défaut, sans localStorage (Node, accès interdit) : mode mémoire', () => {
    vi.stubGlobal('localStorage', undefined);
    const a = createSaveStore();
    expect(a.isPersistent()).toBe(false);
    a.save(sample());
    expect(a.load()).toEqual(sample());

    // Navigateur qui interdit l'accès (cookies bloqués) : la simple lecture de localStorage lève.
    vi.unstubAllGlobals();
    const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      const b = createSaveStore();
      expect(b.isPersistent()).toBe(false);
      expect(b.load()).toEqual(defaultSave());
    } finally {
      if (desc) Object.defineProperty(globalThis, 'localStorage', desc);
      else delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });
});

describe('sanitizeSave et sanitizeCaseProgress', () => {
  it('une sauvegarde valide est conservée à l’identique', () => {
    expect(sanitizeSave(JSON.parse(JSON.stringify(sample())))).toEqual(sample());
  });

  it('rejette ce qui n’est pas une sauvegarde v1', () => {
    expect(sanitizeSave(null)).toBeNull();
    expect(sanitizeSave([])).toBeNull();
    expect(sanitizeSave({ version: '1' })).toBeNull();
  });

  it('le caseId vient de la clé ; punaises bornées', () => {
    const p = sanitizeCaseProgress(
      { caseId: 'autre', status: 'new', steps: {}, pins: Array.from({ length: MAX_PINS + 5 }, (_, i) => ({ x: i, y: 0 })) },
      'c03',
    )!;
    expect(p.caseId).toBe('c03');
    expect(p.pins).toHaveLength(MAX_PINS);
    expect(p.pins[0].x).toBe(5);
    expect(sanitizeCaseProgress(3, 'c03')).toBeNull();
  });
});

describe('isUnlocked', () => {
  const free = caseDef({ id: 'c00', steps: [] });
  const gated = caseDef({ id: 'c02', steps: [], unlockAfter: ['c00', 'c01'] });

  it('sans unlockAfter : toujours débloquée', () => {
    expect(isUnlocked(free, defaultSave())).toBe(true);
  });

  it('débloquée quand toutes les enquêtes requises sont résolues', () => {
    const d = defaultSave();
    expect(isUnlocked(gated, d)).toBe(false);
    d.cases.c00 = progress('c00', 'solved');
    d.cases.c01 = progress('c01', 'active');
    expect(isUnlocked(gated, d)).toBe(false);
    d.cases.c01.status = 'solved';
    expect(isUnlocked(gated, d)).toBe(true);
  });
});

describe('withCaseProgress', () => {
  it('remplace la progression d’une enquête dans une copie', () => {
    const d = sample();
    const p = progress('c01', 'solved');
    const out = withCaseProgress(d, p);
    expect(out.cases.c01).toEqual(p);
    expect(d.cases.c01.status).toBe('active');
    p.notes = 'après';
    expect(out.cases.c01.notes).toBe('n');
  });

  it('chaîne complète : session → sauvegarde → stockage → reprise', () => {
    const def = caseDef({ id: 'c99', steps: [step('s1', ['lm.banque']), step('s2', ['z.place'])] });
    const world = makeWorld();
    const s1 = new CaseSession(def, world, null, { now: () => 42 });
    s1.submit('s1', { point: { x: 200, y: 100 }, entityId: 'lm.banque' });
    s1.addPin({ x: 3, y: 4 });
    const st = new FakeStorage();
    const store = createSaveStore(st);
    store.save(withCaseProgress(store.load(), s1.progress()));

    const loaded = createSaveStore(st).load();
    const s2 = new CaseSession(def, world, loaded.cases.c99);
    expect(s2.openSteps().map((x) => x.id)).toEqual(['s2']);
    expect(s2.pins()).toEqual([{ x: 3, y: 4 }]);
    expect(s2.submit('s2', { point: { x: 200, y: 500 }, entityId: null })).toMatchObject({ caseSolved: true });
  });
});
