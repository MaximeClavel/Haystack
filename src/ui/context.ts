// Contexte partagé par tous les écrans : services (monde, carte, sauvegarde) et navigation.
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { CaseDef, SaveData, World } from '../types';
import type { CaseSession } from '../game';
import type { MapHost } from './mapHost';
import type { AppStore } from './store';
import type { ScreenName } from './params';

/** Écran affiché (navigation par état interne, sans routeur). */
export type Route = { screen: ScreenName } | { screen: 'case'; caseId: string; runId: number };

export type ToastTone = 'info' | 'good' | 'bad' | 'warn';

export interface AppServices {
  world: World;
  host: MapHost;
  store: AppStore;
  cases: CaseDef[];
  debug: boolean;
  /** Mouvement réduit effectif (réglage du joueur OU préférence du système OU ?reduced=1). */
  reducedMotion: () => boolean;
  navigate(route: Route): void;
  openCase(caseId: string, opts?: { restart?: boolean }): void;
  toast(text: string, tone?: ToastTone): void;
  /** Session d'enquête active (debug, tests). */
  setActiveSession(s: CaseSession | null): void;
}

export const ServicesContext = createContext<AppServices | null>(null);

export function useServices(): AppServices {
  const s = useContext(ServicesContext);
  if (!s) throw new Error('[ui] services indisponibles (ServicesContext manquant)');
  return s;
}

export type { SaveData };
