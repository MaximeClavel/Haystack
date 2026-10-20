// Trajectoires animées de la caméra (flyTo) — fonctions PURES, testées dans flight.test.ts.
//
// Principe :
//   - le LOG du zoom est interpolé (un doublement de zoom prend toujours le même temps) ;
//   - si la cible est loin hors de l'écran, la trajectoire passe par un dézoom intermédiaire
//     (« bosse » sur le log du zoom) qui permet de voir le départ et l'arrivée ensemble ;
//   - le centre avance proportionnellement à ∫ dt / zoom : il se déplace surtout quand on est
//     dézoomé, et pour un simple zoom vers un point, ce point reste FIXE à l'écran (propriété
//     exacte quand le log du zoom est linéaire, cf. tests) ;
//   - le temps est remodelé par easeInOutCubic ;
//   - la durée dépend du nombre de doublements de zoom parcourus et de la distance restante.

import type { CameraState } from '../types';
import type { Viewport } from './camera';

export function easeInOutCubic(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeOutCubic(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - (1 - t) ** 3;
}

export interface FlightPlan {
  from: CameraState;
  to: CameraState;
  /** Durée en ms. */
  duration: number;
  /** Zoom le plus bas atteint en chemin (égal à min(from, to) sans dézoom intermédiaire). */
  lowestZoom: number;
  /** Caméra à l'instant t ∈ [0, 1] (t = temps écoulé / durée, avant assouplissement). */
  at(t: number): CameraState;
}

export interface FlightOptions {
  /** Durée imposée (ms). Sinon calculée. */
  duration?: number;
  /** Zoom minimal autorisé (le dézoom intermédiaire ne descend pas en dessous). */
  minZoom: number;
  /** Assouplissement (défaut easeInOutCubic). */
  ease?: (t: number) => number;
}

const SAMPLES = 64;
/** Fraction de l'écran occupée par le trajet au plus fort du dézoom intermédiaire. */
const FIT_FRACTION = 0.8;

export function planFlight(from: CameraState, to: CameraState, vp: Viewport, opts: FlightOptions): FlightPlan {
  const ease = opts.ease ?? easeInOutCubic;
  const a = Math.log(from.zoom);
  const b = Math.log(to.zoom);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);

  // Zoom qui montre à la fois le départ et l'arrivée.
  const fitX = Math.abs(dx) > 1e-9 ? (FIT_FRACTION * vp.width) / Math.abs(dx) : Infinity;
  const fitY = Math.abs(dy) > 1e-9 ? (FIT_FRACTION * vp.height) / Math.abs(dy) : Infinity;
  const fit = Math.max(opts.minZoom, Math.min(fitX, fitY));
  const m = Math.log(fit);
  // Profondeur de la bosse : elle n'existe que si la cible est hors de vue aux deux zooms.
  const bump = Math.max(0, (a + b) / 2 - m) * (m < Math.min(a, b) ? 1 : 0);
  const logZoom = (e: number): number => a + (b - a) * e - bump * 4 * e * (1 - e);

  // Progression du centre ∝ ∫ de / zoom(e) (méthode des trapèzes).
  const cum = new Float64Array(SAMPLES + 1);
  let prev = Math.exp(-logZoom(0));
  for (let k = 1; k <= SAMPLES; k++) {
    const w = Math.exp(-logZoom(k / SAMPLES));
    cum[k] = cum[k - 1] + (prev + w) / (2 * SAMPLES);
    prev = w;
  }
  const total = cum[SAMPLES] || 1;
  const progress = (e: number): number => {
    const f = e * SAMPLES;
    const k = Math.min(SAMPLES - 1, Math.max(0, Math.floor(f)));
    const u = f - k;
    return (cum[k] + (cum[k + 1] - cum[k]) * u) / total;
  };

  let lowest = Math.min(from.zoom, to.zoom);
  if (bump > 0) for (let k = 0; k <= SAMPLES; k++) lowest = Math.min(lowest, Math.exp(logZoom(k / SAMPLES)));

  let duration = opts.duration;
  if (duration === undefined) {
    const low = Math.log(lowest);
    const doublings = (Math.abs(a - low) + Math.abs(b - low)) / Math.LN2;
    const diag = Math.hypot(vp.width, vp.height) || 1;
    const screenDist = dist * lowest;
    duration = 320 + 110 * doublings + 260 * Math.log2(1 + screenDist / diag);
    duration = Math.min(2200, Math.max(220, duration));
  }

  return {
    from,
    to,
    duration,
    lowestZoom: lowest,
    at(t: number): CameraState {
      if (t >= 1) return { ...to };
      if (t <= 0) return { ...from };
      const e = ease(t);
      const p = progress(e);
      return { x: from.x + dx * p, y: from.y + dy * p, zoom: Math.exp(logZoom(e)) };
    },
  };
}
