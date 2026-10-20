// Paramètres d'URL lus au démarrage (voir CLAUDE.md et src/ui/README.md).
//
//   ?debug                 expose window.__haystack et affiche les coordonnées monde
//   ?ui=0                  carte seule (aucune interface)
//   ?x=…&y=…&zoom=…        caméra initiale
//   ?case=<id>             ouvre une enquête
//   ?screen=<nom>          écran initial : accueil | dossiers | regles | reglages | explorer
//   ?reduced=1             force le mouvement réduit (captures stables)

import type { CameraState } from '../types';

export type ScreenName = 'home' | 'cases' | 'howto' | 'settings' | 'explore';

/** Noms français acceptés dans l'URL (et par __haystack.screen) → écran interne. */
export const SCREEN_ALIASES: Record<string, ScreenName> = {
  accueil: 'home',
  home: 'home',
  dossiers: 'cases',
  cases: 'cases',
  regles: 'howto',
  'comment-jouer': 'howto',
  howto: 'howto',
  reglages: 'settings',
  settings: 'settings',
  explorer: 'explore',
  explore: 'explore',
};

export interface UrlParams {
  debug: boolean;
  ui: boolean;
  camera: Partial<CameraState> | null;
  caseId: string | null;
  screen: ScreenName | null;
  reduced: boolean;
}

export function readParams(search: string = typeof location !== 'undefined' ? location.search : ''): UrlParams {
  const p = new URLSearchParams(search);
  const num = (k: string): number | undefined => {
    const v = p.get(k);
    if (v === null || v.trim() === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const x = num('x');
  const y = num('y');
  const zoom = num('zoom');
  const camera: Partial<CameraState> = {};
  if (x !== undefined) camera.x = x;
  if (y !== undefined) camera.y = y;
  if (zoom !== undefined && zoom > 0) camera.zoom = zoom;
  const screenRaw = (p.get('screen') ?? '').toLowerCase();
  return {
    debug: p.has('debug') && p.get('debug') !== '0',
    ui: p.get('ui') !== '0',
    camera: Object.keys(camera).length > 0 ? camera : null,
    caseId: p.get('case') || null,
    screen: SCREEN_ALIASES[screenRaw] ?? null,
    reduced: p.has('reduced') && p.get('reduced') !== '0',
  };
}
