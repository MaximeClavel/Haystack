// Inertie après un glisser : mesure de la vitesse au lâcher, puis décroissance exponentielle.
// Module PUR (testé dans gestures.test.ts).

import type { Vec2 } from '../types';
import { INERTIA_MAX_SPEED, INERTIA_MIN_SPEED, INERTIA_TAU_MS, VELOCITY_STALE_MS, VELOCITY_WINDOW_MS } from './constants';

/** Mémorise les dernières positions d'un pointeur pour estimer sa vitesse (px / ms). */
export class VelocityTracker {
  private ts: number[] = [];
  private xs: number[] = [];
  private ys: number[] = [];

  reset(): void {
    this.ts.length = 0;
    this.xs.length = 0;
    this.ys.length = 0;
  }

  add(t: number, x: number, y: number): void {
    this.ts.push(t);
    this.xs.push(x);
    this.ys.push(y);
    // On ne garde qu'une courte histoire.
    while (this.ts.length > 2 && t - this.ts[0] > VELOCITY_WINDOW_MS * 2) {
      this.ts.shift();
      this.xs.shift();
      this.ys.shift();
    }
  }

  /** Vitesse au temps `now` (px / ms), nulle si le pointeur était immobile juste avant. */
  velocity(now: number): Vec2 {
    const n = this.ts.length;
    if (n < 2) return { x: 0, y: 0 };
    const tLast = this.ts[n - 1];
    if (now - tLast > VELOCITY_STALE_MS) return { x: 0, y: 0 };
    // Plus ancien échantillon dans la fenêtre.
    let k = n - 2;
    while (k > 0 && tLast - this.ts[k - 1] <= VELOCITY_WINDOW_MS) k--;
    const dt = tLast - this.ts[k];
    if (dt <= 0) return { x: 0, y: 0 };
    let vx = (this.xs[n - 1] - this.xs[k]) / dt;
    let vy = (this.ys[n - 1] - this.ys[k]) / dt;
    const s = Math.hypot(vx, vy);
    if (s > INERTIA_MAX_SPEED) {
      vx *= INERTIA_MAX_SPEED / s;
      vy *= INERTIA_MAX_SPEED / s;
    }
    return { x: vx, y: vy };
  }
}

/**
 * Un pas d'inertie : renvoie le déplacement (px) pendant `dt` ms et la nouvelle vitesse.
 * Intégrale exacte de v0·e^(−t/τ) : le résultat ne dépend pas de la cadence d'images.
 */
export function inertiaStep(v: Vec2, dt: number, tau = INERTIA_TAU_MS): { dx: number; dy: number; v: Vec2 } {
  const f = Math.exp(-dt / tau);
  const k = tau * (1 - f);
  return { dx: v.x * k, dy: v.y * k, v: { x: v.x * f, y: v.y * f } };
}

export function isMoving(v: Vec2): boolean {
  return Math.hypot(v.x, v.y) >= INERTIA_MIN_SPEED;
}

/** Distance totale parcourue par une inertie lancée à la vitesse v (px). */
export function glideDistance(v: Vec2, tau = INERTIA_TAU_MS): number {
  return Math.hypot(v.x, v.y) * tau;
}
