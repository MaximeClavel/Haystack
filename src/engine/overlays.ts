// Overlays : dessins par-dessus la carte, redessinés à chaque image, en coordonnées ÉCRAN
// (le contexte reçu est mis à l'échelle px CSS). Les épaisseurs de trait sont donc constantes
// quel que soit le zoom ; les rayons suivent le zoom avec un minimum lisible.
//
// Ordre : projecteurs (voile) → cadres et anneaux → fils rouges → punaises.
// Seul le style « reveal » est animé (pulsation dorée) : la carte ne redessine en continu que
// s'il est présent, et jamais en mouvement réduit.

import type { MarkStyle, Overlay, Rect, Vec2 } from '../types';

export interface OverlayView {
  toScreen(p: Vec2): Vec2;
  /** px CSS par unité monde. */
  zoom: number;
  /** Taille de l'écran en px CSS. */
  width: number;
  height: number;
}

const TAU = Math.PI * 2;

/** Voile du projecteur d'indice. */
const VEIL = 'rgba(20, 14, 10, 0.55)';
const VEIL_EDGE = 'rgba(255, 236, 190, 0.75)';
/** Halo sombre sous les traits colorés (contraste sur le papier comme sur l'eau). */
const HALO = 'rgba(28, 20, 14, 0.6)';
const THREAD = '#c0262d';
const THREAD_SHADOW = 'rgba(30, 10, 5, 0.3)';
const PIN_HEAD = '#d23b2f';
const BRASS = '#d8a62a';
const PIN_INK = '#3a1d17';

interface Stroke {
  color: string;
  width: number;
  dash?: number[];
}

export const MARK_STROKE: Record<MarkStyle, Stroke> = {
  select: { color: '#ffffff', width: 2.5, dash: [7, 5] },
  found: { color: '#3f9e55', width: 3.5 },
  reveal: { color: '#f2b705', width: 3.5 },
  wrong: { color: '#d93a2f', width: 3.5 },
  near: { color: '#ef8a17', width: 3, dash: [9, 5] },
};

/** Rayon minimal d'un anneau à l'écran (px CSS). */
const MIN_RING_PX = 14;
/** Côté minimal d'un cadre à l'écran (px CSS). */
const MIN_BOX_PX = 18;
/** Période de pulsation du style reveal (ms). */
const PULSE_MS = 1200;

/** Vrai si un overlay demande un rafraîchissement continu. */
export function hasAnimatedOverlay(overlays: readonly Overlay[], reducedMotion: boolean): boolean {
  if (reducedMotion) return false;
  for (const o of overlays) if ((o.kind === 'ring' || o.kind === 'box') && o.style === 'reveal') return true;
  return false;
}

function order(o: Overlay): number {
  switch (o.kind) {
    case 'spotlight':
      return 0;
    case 'box':
    case 'ring':
      return 1;
    case 'thread':
      return 2;
    case 'pin':
      return 3;
  }
}

export function drawOverlays(
  ctx: CanvasRenderingContext2D,
  overlays: readonly Overlay[],
  view: OverlayView,
  time: number,
  reducedMotion: boolean,
): void {
  if (overlays.length === 0) return;
  const sorted = overlays.map((o, k) => ({ o, k })).sort((a, b) => order(a.o) - order(b.o) || a.k - b.k);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Tous les projecteurs partagent un seul voile (trous en sens inverse, règle nonzero).
  const spots = sorted.filter((s) => s.o.kind === 'spotlight');
  if (spots.length) drawSpotlights(ctx, spots.map((s) => s.o as Extract<Overlay, { kind: 'spotlight' }>), view);
  for (const { o } of sorted) {
    switch (o.kind) {
      case 'ring':
        drawRing(ctx, o.circle, o.style, view, time, reducedMotion);
        break;
      case 'box':
        drawBox(ctx, o.rect, o.style, view, time, reducedMotion);
        break;
      case 'thread':
        drawThread(ctx, view.toScreen(o.from), view.toScreen(o.to));
        break;
      case 'pin':
        drawPin(ctx, view.toScreen(o.at), o.label);
        break;
      default:
        break;
    }
  }
  ctx.restore();
}

function drawSpotlights(ctx: CanvasRenderingContext2D, spots: Extract<Overlay, { kind: 'spotlight' }>[], view: OverlayView): void {
  ctx.beginPath();
  ctx.rect(0, 0, view.width, view.height);
  const holes: [number, number, number][] = [];
  for (const s of spots) {
    const c = view.toScreen(s.circle);
    const r = Math.max(24, s.circle.radius * view.zoom);
    holes.push([c.x, c.y, r]);
    ctx.moveTo(c.x + r, c.y);
    ctx.arc(c.x, c.y, r, 0, TAU, true);
  }
  ctx.fillStyle = VEIL;
  ctx.fill('nonzero');
  ctx.strokeStyle = VEIL_EDGE;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  for (const [x, y, r] of holes) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
  }
}

function strokeWithHalo(ctx: CanvasRenderingContext2D, st: Stroke, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.setLineDash([]);
  ctx.strokeStyle = HALO;
  ctx.lineWidth = st.width + 2.5;
  ctx.stroke();
  ctx.setLineDash(st.dash ?? []);
  ctx.strokeStyle = st.color;
  ctx.lineWidth = st.width;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

/** Phase de pulsation dans [0, 1). */
function pulsePhase(time: number): number {
  return (((time % PULSE_MS) + PULSE_MS) % PULSE_MS) / PULSE_MS;
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  circle: { x: number; y: number; radius: number },
  style: MarkStyle,
  view: OverlayView,
  time: number,
  reducedMotion: boolean,
): void {
  const c = view.toScreen(circle);
  const r = Math.max(MIN_RING_PX, circle.radius * view.zoom);
  const st = MARK_STROKE[style];
  if (style === 'reveal') {
    // Onde qui s'élargit et s'estompe (statique en mouvement réduit).
    const ph = reducedMotion ? 0.35 : pulsePhase(time);
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * (1 + 0.45 * ph), 0, TAU);
    ctx.strokeStyle = st.color;
    ctx.globalAlpha = 0.85 * (1 - ph);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
    const breathe = reducedMotion ? 0 : Math.sin(ph * TAU) * 0.06;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * (1 + breathe), 0, TAU);
    strokeWithHalo(ctx, st);
    return;
  }
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, TAU);
  strokeWithHalo(ctx, st);
  if (style === 'wrong') {
    // Petite croix sur le haut de l'anneau.
    const k = 5;
    const x = c.x + r * Math.SQRT1_2;
    const y = c.y - r * Math.SQRT1_2;
    ctx.beginPath();
    ctx.moveTo(x - k, y - k);
    ctx.lineTo(x + k, y + k);
    ctx.moveTo(x + k, y - k);
    ctx.lineTo(x - k, y + k);
    strokeWithHalo(ctx, { color: st.color, width: 3 });
  } else if (style === 'found') {
    // Coche verte.
    const x = c.x + r * Math.SQRT1_2;
    const y = c.y - r * Math.SQRT1_2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, TAU);
    ctx.fillStyle = st.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 3.5, y + 0.2);
    ctx.lineTo(x - 1, y + 2.8);
    ctx.lineTo(x + 3.8, y - 2.8);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  style: MarkStyle,
  view: OverlayView,
  time: number,
  reducedMotion: boolean,
): void {
  const a = view.toScreen(rect);
  const b = view.toScreen({ x: rect.x + rect.w, y: rect.y + rect.h });
  let x = Math.min(a.x, b.x);
  let y = Math.min(a.y, b.y);
  let w = Math.abs(b.x - a.x);
  let h = Math.abs(b.y - a.y);
  if (w < MIN_BOX_PX) {
    x -= (MIN_BOX_PX - w) / 2;
    w = MIN_BOX_PX;
  }
  if (h < MIN_BOX_PX) {
    y -= (MIN_BOX_PX - h) / 2;
    h = MIN_BOX_PX;
  }
  // Un peu d'air autour de l'objet encadré.
  x -= 3;
  y -= 3;
  w += 6;
  h += 6;
  const st = MARK_STROKE[style];
  if (style === 'reveal') {
    const ph = reducedMotion ? 0.35 : pulsePhase(time);
    const g = 10 * ph;
    roundRectPath(ctx, x - g, y - g, w + 2 * g, h + 2 * g, 8 + g);
    ctx.strokeStyle = st.color;
    ctx.globalAlpha = 0.85 * (1 - ph);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  roundRectPath(ctx, x, y, w, h, 8);
  strokeWithHalo(ctx, st);
}

/** Fil rouge légèrement incurvé (il « pend » vers le bas), punaises dorées aux deux bouts. */
function drawThread(ctx: CanvasRenderingContext2D, a: Vec2, b: Vec2): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len > 1) {
    // Normale orientée vers le bas de l'écran (gravité) ; pour un fil vertical, vers la droite.
    let nx = -dy / len;
    let ny = dx / len;
    if (ny < 0 || (Math.abs(ny) < 1e-6 && nx < 0)) {
      nx = -nx;
      ny = -ny;
    }
    const sag = Math.min(0.1 * len, 60);
    const cx = (a.x + b.x) / 2 + nx * sag;
    const cy = (a.y + b.y) / 2 + ny * sag;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(a.x + 1.5, a.y + 2);
    ctx.quadraticCurveTo(cx + 1.5, cy + 2, b.x + 1.5, b.y + 2);
    ctx.strokeStyle = THREAD_SHADOW;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(cx, cy, b.x, b.y);
    ctx.strokeStyle = THREAD;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Fibre claire pour donner du relief au fil.
    ctx.strokeStyle = 'rgba(255, 190, 180, 0.45)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  drawTackHead(ctx, a.x, a.y, BRASS);
  drawTackHead(ctx, b.x, b.y, BRASS);
}

/** Tête de punaise vue de dessus. */
function drawTackHead(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.beginPath();
  ctx.arc(x + 1.5, y + 2, 5.5, 0, TAU);
  ctx.fillStyle = 'rgba(30, 15, 5, 0.3)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = PIN_INK;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - 1.8, y - 1.8, 1.7, 0, TAU);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fill();
}

/** Punaise du joueur, de profil : la pointe désigne exactement le point `p`. */
function drawPin(ctx: CanvasRenderingContext2D, p: Vec2, label?: string): void {
  const hx = p.x + 5;
  const hy = p.y - 19;
  ctx.setLineDash([]);
  // Ombre au sol.
  ctx.beginPath();
  ctx.ellipse(p.x + 3, p.y + 1, 5, 2, 0, 0, TAU);
  ctx.fillStyle = 'rgba(30, 15, 5, 0.3)';
  ctx.fill();
  // Aiguille.
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(hx - 1, hy + 6);
  ctx.strokeStyle = '#6d6a66';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // Collerette puis tête.
  ctx.beginPath();
  ctx.ellipse(hx - 0.6, hy + 5, 4.5, 2, -0.3, 0, TAU);
  ctx.fillStyle = PIN_HEAD;
  ctx.fill();
  ctx.strokeStyle = PIN_INK;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, hy, 6.5, 0, TAU);
  ctx.fillStyle = PIN_HEAD;
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx - 2, hy - 2.2, 2, 0, TAU);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  if (label) {
    ctx.font = '600 12px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    const tw = Math.min(160, ctx.measureText(label).width);
    const x = hx + 10;
    const y = hy;
    roundRectPath(ctx, x, y - 9, tw + 10, 18, 4);
    ctx.fillStyle = 'rgba(250, 244, 230, 0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(58, 29, 23, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = PIN_INK;
    ctx.fillText(label, x + 5, y + 0.5, 160);
  }
}
