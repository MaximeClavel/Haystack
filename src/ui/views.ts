// Cadrages de caméra réutilisés par les écrans : vue d'ensemble de l'accueil, dérive lente,
// point de départ de l'exploration.
import type { CameraState, Vec2 } from '../types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { computeMinZoom } from '../engine';
import type { MapHost } from './mapHost';

/** Centre de la vue d'ensemble : la Grand-Place, cœur de la Vieille Ville. */
export const CITY_HEART: Vec2 = { x: 2850, y: 2100 };
/** Départ de l'exploration libre. */
export const EXPLORE_START: CameraState = { x: 2850, y: 2060, zoom: 1 };

/** Zoom de la vue d'ensemble : la ville remplit l'écran, un peu plus serrée que « tout voir ». */
export function overviewZoom(vp: { width: number; height: number }): number {
  const min = computeMinZoom(vp, { width: WORLD_WIDTH, height: WORLD_HEIGHT });
  const cover = Math.max(vp.width / WORLD_WIDTH, vp.height / WORLD_HEIGHT);
  return Math.min(0.42, Math.max(min * 1.2, cover * 1.25));
}

export function overviewCamera(vp: { width: number; height: number }): CameraState {
  return { ...CITY_HEART, zoom: overviewZoom(vp) };
}

/** Étapes de la dérive de l'accueil (boucle lente autour du centre-ville). */
const DRIFT: Vec2[] = [
  { x: 2850, y: 2100 },
  { x: 3750, y: 2350 },
  { x: 4600, y: 1950 },
  { x: 3700, y: 1450 },
  { x: 2500, y: 1650 },
  { x: 1650, y: 2200 },
  { x: 2400, y: 2700 },
];
const DRIFT_MS = 24000;

/**
 * Lent mouvement de caméra de l'accueil. Renvoie la fonction d'arrêt.
 * Chaque étape est un flyTo très long ; un autre mouvement (geste, flyTo, setCamera) l'interrompt.
 */
export function startDrift(host: MapHost): () => void {
  let stopped = false;
  let i = 0;
  const step = async (): Promise<void> => {
    while (!stopped) {
      const vp = host.viewport();
      const target = DRIFT[(i = (i + 1) % DRIFT.length)];
      const zoom = overviewZoom(vp);
      const before = host.map.getCamera();
      await host.map.flyTo({ x: target.x, y: target.y, zoom }, { duration: DRIFT_MS });
      if (stopped) return;
      const after = host.map.getCamera();
      // Vol interrompu ou impossible (écran trop petit, caméra bornée) : on arrête sans insister.
      if (Math.hypot(after.x - before.x, after.y - before.y) < 1 && Math.abs(after.zoom - before.zoom) < 1e-6) {
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  };
  void step();
  return () => {
    if (stopped) return;
    stopped = true;
    // Interrompt le vol en cours en reposant la caméra là où elle est.
    host.map.setCamera(host.map.getCamera());
  };
}
