// Magasin de la partie côté interface : enveloppe le SaveStore du module game,
// garde la sauvegarde en mémoire, l'enregistre à chaque changement et prévient les abonnés.
import { useEffect, useState } from 'preact/hooks';
import type { SaveData, Settings } from '../types';
import type { SaveStore } from '../game';

export interface AppStore {
  get(): SaveData;
  /** Applique une modification (fonction pure : renvoie une nouvelle sauvegarde), enregistre, notifie. */
  update(fn: (s: SaveData) => SaveData): void;
  setSettings(patch: Partial<Settings>): void;
  /** Efface toute la progression (les réglages sont conservés). */
  resetProgress(): void;
  subscribe(fn: () => void): () => void;
  isPersistent(): boolean;
}

export function createAppStore(saveStore: SaveStore): AppStore {
  let save = saveStore.load();
  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const l of [...listeners]) l();
  };
  const store: AppStore = {
    get: () => save,
    update(fn) {
      // Lire-modifier-écrire : on repart de ce qui est RÉELLEMENT enregistré, pas de la copie gardée
      // en mémoire depuis le démarrage. Sinon un second onglet (ou une PWA) ouvert plus tôt, donc
      // périmé, écraserait en entier la progression écrite entre-temps par l'autre.
      save = fn(saveStore.load());
      saveStore.save(save);
      notify();
    },
    setSettings(patch) {
      store.update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },
    resetProgress() {
      const settings = { ...save.settings };
      saveStore.reset();
      save = { ...saveStore.load(), settings };
      saveStore.save(save);
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    isPersistent: () => saveStore.isPersistent(),
  };
  return store;
}

/** Sauvegarde courante, avec re-rendu du composant à chaque changement. */
export function useSave(store: AppStore): SaveData {
  const [save, setSave] = useState(store.get());
  useEffect(() => {
    setSave(store.get());
    return store.subscribe(() => setSave(store.get()));
  }, [store]);
  return save;
}
