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
  /** `ms` : durée d'affichage (défaut : 1,8 s pour une erreur, 2,6 s sinon). */
  toast(text: string, tone?: ToastTone, ms?: number): void;
  /**
   * Gestionnaire du bouton « Retour » du système (Android, geste iOS, touche du navigateur) pour
   * l'écran affiché : il ferme d'abord ce qui est ouvert (carnet, feuille, minicarte…) et renvoie
   * vrai s'il a agi ; sinon l'application remonte d'un écran (enquête → enquêtes → accueil).
   */
  setBackHandler(fn: (() => boolean) | null): void;
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
