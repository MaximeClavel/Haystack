// Reconnaissance des gestes à partir de pointeurs abstraits (doigts ou souris).
//
// La classe GestureRecognizer est PURE (aucun accès au DOM) : elle reçoit des événements
// down / move / up / cancel horodatés et appelle des gestionnaires de haut niveau. Les minuteries
// (délai du tap) sont injectables pour les tests. Le branchement sur les Pointer Events du canevas
// est fait par mapView.ts.
//
// Gestes reconnus :
//   - glisser à un doigt (au-delà de TAP_SLOP_PX), vitesse au lâcher pour l'inertie ;
//   - pincer à deux doigts (point milieu + écartement) ; un doigt restant reprend le glisser ;
//   - tap court (< TAP_SLOP_PX, < TAP_MAX_MS), émis après TAP_DELAY_MS s'il n'est pas suivi
//     d'un second tap ;
//   - double-tap (second appui proche dans le délai) ; double-tap maintenu puis glissé
//     verticalement = zoom à un doigt ;
//   - tap à deux doigts (pour dézoomer).

import type { Vec2 } from '../types';
import { DOUBLE_TAP_SLOP_PX, TAP_DELAY_MS, TAP_MAX_MS, TAP_SLOP_PX } from './constants';
import { VelocityTracker } from './inertia';

export interface GestureHandlers {
  panStart(p: Vec2): void;
  /** Déplacement depuis le dernier appel (px CSS) ; p = position actuelle du doigt. */
  pan(dx: number, dy: number, p: Vec2): void;
  /** Fin du glisser ; velocity en px CSS / ms (nulle s'il ne faut pas d'inertie). */
  panEnd(velocity: Vec2): void;
  pinchStart(mid: Vec2, dist: number): void;
  pinch(mid: Vec2, dist: number): void;
  pinchEnd(): void;
  /** Tap simple confirmé (émis en différé). */
  tap(p: Vec2): void;
  doubleTap(p: Vec2): void;
  twoFingerTap(mid: Vec2): void;
  /** Double-tap maintenu puis glissé : `dy` = déplacement vertical total depuis l'appui. */
  dragZoomStart(anchor: Vec2): void;
  dragZoom(dy: number): void;
  dragZoomEnd(): void;
}

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

const defaultTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

type Mode = 'none' | 'press' | 'pan' | 'pinch' | 'second' | 'dragZoom';

interface Pointer {
  x: number;
  y: number;
  sx: number;
  sy: number;
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class GestureRecognizer {
  private readonly pointers = new Map<number, Pointer>();
  /** Pointeurs au-delà du deuxième : ignorés jusqu'à leur lâcher. */
  private readonly ignored = new Set<number>();
  private mode: Mode = 'none';
  private downT = 0;
  /** L'appui a interrompu un mouvement (inertie, animation) : il ne compte pas comme tap. */
  private noTap = false;
  private readonly tracker = new VelocityTracker();
  private pendingTap: { p: Vec2; t: number; handle: unknown } | null = null;
  private pinchT = 0;
  private pinchMoved = false;
  private pinchMid: Vec2 = { x: 0, y: 0 };
  private twoFingerCandidate = false;

  constructor(
    private readonly h: GestureHandlers,
    private readonly timers: Timers = defaultTimers,
  ) {}

  /** Nombre de pointeurs actuellement suivis. */
  get activePointers(): number {
    return this.pointers.size;
  }

  get currentMode(): Mode {
    return this.mode;
  }

  /**
   * Nouveau pointeur. `interrupted` : l'appui a stoppé une inertie ou une animation
   * (un tel appui ne déclenche pas de tap).
   */
  down(id: number, x: number, y: number, t: number, interrupted = false): void {
    if (this.pointers.size >= 2) {
      this.ignored.add(id);
      return;
    }
    this.pointers.set(id, { x, y, sx: x, sy: y });
    if (this.pointers.size === 1) {
      this.downT = t;
      this.noTap = interrupted;
      this.twoFingerCandidate = false;
      const pending = this.pendingTap;
      if (pending && !interrupted && t - pending.t <= TAP_DELAY_MS && dist(pending.p, { x, y }) <= DOUBLE_TAP_SLOP_PX) {
        // Second appui : double-tap en vue, le tap simple est annulé.
        this.cancelPendingTap();
        this.mode = 'second';
      } else {
        // Un appui ailleurs confirme le tap en attente : il est émis tout de suite.
        if (pending) this.flushPendingTap();
        this.mode = 'press';
      }
      this.tracker.reset();
      this.tracker.add(t, x, y);
      return;
    }
    // Deuxième doigt : pincement.
    this.cancelPendingTap();
    // Tap à deux doigts possible si le premier doigt vient de se poser sans bouger.
    this.twoFingerCandidate = this.mode === 'press' && !this.noTap && t - this.downT <= TAP_MAX_MS;
    if (this.mode === 'pan') this.h.panEnd({ x: 0, y: 0 });
    else if (this.mode === 'dragZoom') this.h.dragZoomEnd();
    for (const p of this.pointers.values()) {
      p.sx = p.x;
      p.sy = p.y;
    }
    this.mode = 'pinch';
    this.pinchT = t;
    this.pinchMoved = false;
    const [m, d] = this.midDist();
    this.pinchMid = m;
    this.h.pinchStart(m, d);
  }

  move(id: number, x: number, y: number, t: number): void {
    const p = this.pointers.get(id);
    if (!p) return;
    const px = p.x;
    const py = p.y;
    p.x = x;
    p.y = y;
    switch (this.mode) {
      case 'press':
        this.tracker.add(t, x, y);
        if (Math.hypot(x - p.sx, y - p.sy) > TAP_SLOP_PX) {
          this.mode = 'pan';
          this.h.panStart({ x: p.sx, y: p.sy });
          // Déplacement complet depuis l'appui : le point saisi reste sous le doigt.
          this.h.pan(x - p.sx, y - p.sy, { x, y });
        }
        break;
      case 'pan':
        this.tracker.add(t, x, y);
        if (this.twoFingerCandidate && Math.hypot(x - p.sx, y - p.sy) > TAP_SLOP_PX) this.twoFingerCandidate = false;
        if (x !== px || y !== py) this.h.pan(x - px, y - py, { x, y });
        break;
      case 'second':
        if (Math.hypot(x - p.sx, y - p.sy) > TAP_SLOP_PX) {
          this.mode = 'dragZoom';
          this.h.dragZoomStart({ x: p.sx, y: p.sy });
          this.h.dragZoom(y - p.sy);
        }
        break;
      case 'dragZoom':
        this.h.dragZoom(y - p.sy);
        break;
      case 'pinch': {
        if (!this.pinchMoved && Math.hypot(x - p.sx, y - p.sy) > TAP_SLOP_PX) {
          this.pinchMoved = true;
          this.twoFingerCandidate = false;
        }
        const [m, d] = this.midDist();
        this.h.pinch(m, d);
        break;
      }
      default:
        break;
    }
  }

  up(id: number, x: number, y: number, t: number): void {
    if (this.ignored.delete(id)) return;
    const p = this.pointers.get(id);
    if (!p) return;
    const movedAtUp = p.x !== x || p.y !== y;
    p.x = x;
    p.y = y;
    switch (this.mode) {
      case 'press':
        this.pointers.delete(id);
        this.mode = 'none';
        if (!this.noTap && t - this.downT <= TAP_MAX_MS) this.schedulePendingTap({ x: p.sx, y: p.sy }, t);
        return;
      case 'second':
        this.pointers.delete(id);
        this.mode = 'none';
        if (t - this.downT <= TAP_MAX_MS) this.h.doubleTap({ x: p.sx, y: p.sy });
        return;
      case 'pan':
        this.pointers.delete(id);
        this.mode = 'none';
        if (movedAtUp) this.tracker.add(t, x, y);
        this.h.panEnd(this.tracker.velocity(t));
        if (this.twoFingerCandidate && t - this.pinchT <= TAP_MAX_MS + 100) this.h.twoFingerTap(this.pinchMid);
        this.twoFingerCandidate = false;
        return;
      case 'dragZoom':
        this.pointers.delete(id);
        this.mode = 'none';
        this.h.dragZoomEnd();
        return;
      case 'pinch': {
        this.pointers.delete(id);
        this.h.pinchEnd();
        if (this.twoFingerCandidate && (this.pinchMoved || t - this.pinchT > TAP_MAX_MS)) this.twoFingerCandidate = false;
        // Le doigt restant reprend le glisser, sans saut.
        const rest = this.pointers.values().next().value as Pointer | undefined;
        if (rest) {
          rest.sx = rest.x;
          rest.sy = rest.y;
          this.mode = 'pan';
          this.tracker.reset();
          this.tracker.add(t, rest.x, rest.y);
          this.h.panStart({ x: rest.x, y: rest.y });
        } else {
          this.mode = 'none';
        }
        return;
      }
      default:
        this.pointers.delete(id);
    }
  }

  /** Pointeur perdu (appel système, capture perdue…) : fin du geste sans tap ni inertie. */
  cancel(id: number): void {
    if (this.ignored.delete(id)) return;
    if (!this.pointers.has(id)) return;
    this.pointers.delete(id);
    this.twoFingerCandidate = false;
    switch (this.mode) {
      case 'pan':
        this.h.panEnd({ x: 0, y: 0 });
        break;
      case 'pinch':
        this.h.pinchEnd();
        break;
      case 'dragZoom':
        this.h.dragZoomEnd();
        break;
      default:
        break;
    }
    const rest = this.pointers.values().next().value as Pointer | undefined;
    if (rest && this.mode === 'pinch') {
      rest.sx = rest.x;
      rest.sy = rest.y;
      this.mode = 'pan';
      this.tracker.reset();
      this.h.panStart({ x: rest.x, y: rest.y });
    } else {
      this.mode = 'none';
    }
  }

  /** Abandonne tout geste en cours et le tap en attente (destruction de la carte). */
  reset(): void {
    this.cancelPendingTap();
    for (const id of [...this.pointers.keys()]) this.cancel(id);
    this.ignored.clear();
    this.mode = 'none';
  }

  /** Annule le tap différé (ex. la caméra a été déplacée par programme entre-temps). */
  cancelPendingTap(): void {
    if (this.pendingTap) {
      this.timers.clear(this.pendingTap.handle);
      this.pendingTap = null;
    }
  }

  private flushPendingTap(): void {
    const pending = this.pendingTap;
    if (!pending) return;
    this.timers.clear(pending.handle);
    this.pendingTap = null;
    this.h.tap(pending.p);
  }

  private schedulePendingTap(p: Vec2, t: number): void {
    this.cancelPendingTap();
    const handle = this.timers.set(() => {
      this.pendingTap = null;
      this.h.tap(p);
    }, TAP_DELAY_MS);
    this.pendingTap = { p, t, handle };
  }

  private midDist(): [Vec2, number] {
    const it = this.pointers.values();
    const a = it.next().value as Pointer;
    const b = it.next().value as Pointer;
    return [{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))];
  }
}
