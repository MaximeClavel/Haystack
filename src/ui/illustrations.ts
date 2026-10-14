// Illustrations de « Comment jouer », dessinées avec le vrai module art (et des vignettes de la ville).
import type { Entity, PersonAppearance, Rect } from '../types';
import { PAPER, drawEntity, drawGround } from '../art';
import { compareDrawOrder } from '../art';
import type { MapHost } from './mapHost';

const INK = '#2f2622';
const THREAD = '#c0262d';
const HAY = '#d8a62a';

/** Prépare un canevas à la densité de l'écran ; renvoie le contexte en px CSS. */
function prepare(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; w: number; h: number; dpr: number } | null {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 300;
  const h = canvas.clientHeight || 180;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}

/** Dessine une petite scène (sol de place + entités) cadrée sur `view`. */
function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  view: Rect,
  entities: Entity[],
): (x: number, y: number) => { x: number; y: number } {
  const s = Math.min(w / view.w, h / view.h);
  const ox = (w - view.w * s) / 2 - view.x * s;
  const oy = (h - view.h * s) / 2 - view.y * s;
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  ctx.transform(s, 0, 0, s, ox, oy);
  const big: Rect = { x: view.x - view.w, y: view.y - view.h, w: view.w * 3, h: view.h * 3 };
  drawGround(ctx, { base: 'plaza', shapes: [], lines: [] }, big, 0);
  for (const e of [...entities].sort(compareDrawOrder)) {
    try {
      drawEntity(ctx, e, 0);
    } catch {
      // illustration : une entité ratée ne doit rien casser
    }
  }
  ctx.restore();
  return (x, y) => ({ x: x * s + ox, y: y * s + oy });
}

function fingertip(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 250, 240, 0.85)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 8 * Math.cos(a - 0.5), y1 - 8 * Math.sin(a - 0.5));
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 8 * Math.cos(a + 0.5), y1 - 8 * Math.sin(a + 0.5));
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = 'rgba(255, 250, 240, 0.9)';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.font = '13px "Special Elite", "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(255, 250, 240, 0.92)';
  ctx.fillRect(x - tw / 2 - 5, y - 10, tw + 10, 20);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - tw / 2 - 5, y - 10, tw + 10, 20);
  ctx.fillStyle = INK;
  ctx.fillText(text, x, y + 1);
}

/** 1. Zoomer et se déplacer : une vraie vue de la ville + gestes. */
export function drawExploreIllustration(canvas: HTMLCanvasElement, host: MapHost): void {
  const p = prepare(canvas);
  if (!p) return;
  const { ctx, w, h, dpr } = p;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  host.map.renderSnapshot(canvas, { x: 3700, y: 800, w: 300, h: 190 });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Pincer (deux doigts qui s'écartent) à gauche, glisser à droite.
  const cx = w * 0.3;
  const cy = h * 0.52;
  fingertip(ctx, cx - 18, cy + 16);
  fingertip(ctx, cx + 18, cy - 16);
  arrow(ctx, cx - 32, cy + 30, cx - 52, cy + 50);
  arrow(ctx, cx + 32, cy - 30, cx + 52, cy - 50);
  const dx = w * 0.72;
  fingertip(ctx, dx - 30, cy + 10);
  arrow(ctx, dx - 14, cy + 10, dx + 40, cy + 10);
  label(ctx, 'pincer', cx, h - 18);
  label(ctx, 'glisser', dx, h - 18);
}

const WALKER: PersonAppearance = {
  skin: 'light',
  hair: 'bun',
  hairColor: 'red',
  hat: 'beret',
  top: 'coat',
  topColor: 'green',
  topPattern: 'plain',
  bottom: 'skirt',
  bottomColor: 'brown',
  face: 'glasses',
  accessory: 'handbag',
  build: 'slim',
};

/** 2. Suivre un personnage dans le temps : la même personne, deux moments, un fil rouge. */
export function drawFollowIllustration(canvas: HTMLCanvasElement): void {
  const p = prepare(canvas);
  if (!p) return;
  const { ctx, w, h } = p;
  const view: Rect = { x: 8, y: 14, w: 116, h: 54 };
  const entities: Entity[] = [
    { id: 'i.a', kind: 'person', x: 28, y: 50, pose: 'walk', facing: 'right', holding: 'letter', appearance: WALKER },
    { id: 'i.lamp', kind: 'prop', prop: 'lamp', x: 60, y: 40 },
    {
      id: 'i.p',
      kind: 'person',
      x: 72,
      y: 62,
      pose: 'walk',
      facing: 'left',
      appearance: {
        ...WALKER,
        hat: 'cap',
        hair: 'short',
        hairColor: 'black',
        top: 'hoodie',
        topColor: 'yellow',
        bottom: 'trousers',
        bottomColor: 'navy',
        face: 'none',
        accessory: 'backpack',
        build: 'regular',
      },
    },
    { id: 'i.bench', kind: 'prop', prop: 'bench', x: 100, y: 50, color: 'green' },
    {
      id: 'i.b',
      kind: 'person',
      x: 97,
      y: 50.6,
      sortY: 50.6,
      pose: 'sit',
      facing: 'left',
      holding: 'letter',
      emote: 'heart',
      appearance: WALKER,
    },
    { id: 'i.c', kind: 'prop', prop: 'pigeons', x: 46, y: 62 },
    { id: 'i.f', kind: 'prop', prop: 'flowerbed', x: 112, y: 64, color: 'pink' },
  ];
  const to = drawScene(ctx, w, h, view, entities);
  const a = to(28, 38);
  const b = to(97, 41);
  // Fil rouge : courbe qui pend, punaises dorées aux deux bouts.
  const sag = Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + sag, b.x, b.y);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = THREAD;
  ctx.stroke();
  for (const q of [a, b]) {
    ctx.beginPath();
    ctx.arc(q.x, q.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = HAY;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  label(ctx, '10 h 00', to(28, 60).x, 18);
  label(ctx, '10 h 20', to(98, 60).x, 18);
}

/** 3. Désigner : toucher quelqu'un, vérifier la vignette, confirmer. */
export function drawPickIllustration(canvas: HTMLCanvasElement): void {
  const p = prepare(canvas);
  if (!p) return;
  const { ctx, w, h } = p;
  const view: Rect = { x: 0, y: 10, w: 120, h: 50 };
  const base = {
    skin: 'tan',
    hair: 'short',
    hairColor: 'black',
    hat: 'none',
    topPattern: 'plain',
    bottom: 'trousers',
    face: 'none',
    accessory: 'none',
    build: 'regular',
  } as const;
  const entities: Entity[] = [
    {
      id: 'i.1',
      kind: 'person',
      x: 24,
      y: 50,
      pose: 'stand',
      facing: 'right',
      appearance: { ...base, top: 'shirt', topColor: 'blue', bottomColor: 'grey' },
    },
    {
      id: 'i.2',
      kind: 'person',
      x: 46,
      y: 53,
      pose: 'phone',
      facing: 'left',
      appearance: {
        ...base,
        skin: 'pale',
        hair: 'long',
        hairColor: 'blond',
        top: 'dress',
        topColor: 'pink',
        bottom: 'skirt',
        bottomColor: 'pink',
        accessory: 'handbag',
        build: 'slim',
      },
    },
    {
      id: 'i.3',
      kind: 'person',
      x: 70,
      y: 50,
      pose: 'stand',
      facing: 'left',
      holding: 'moneybag',
      appearance: {
        ...base,
        hat: 'beanie',
        top: 'sweater',
        topColor: 'black',
        topPattern: 'stripes',
        bottomColor: 'black',
        face: 'mask',
      },
    },
    { id: 'i.4', kind: 'prop', prop: 'lamp', x: 92, y: 52 },
    {
      id: 'i.5',
      kind: 'person',
      x: 104,
      y: 51,
      pose: 'read',
      facing: 'left',
      appearance: {
        ...base,
        skin: 'dark',
        hat: 'fedora',
        top: 'suit',
        topColor: 'navy',
        bottomColor: 'navy',
        face: 'mustache',
        build: 'large',
      },
    },
  ];
  const to = drawScene(ctx, w, h, view, entities);
  // Cadre de sélection autour du voleur masqué.
  const tl = to(64, 29);
  const br = to(77, 51);
  ctx.save();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = 'rgba(28, 20, 14, 0.6)';
  ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  ctx.restore();
  fingertip(ctx, (tl.x + br.x) / 2 + 16, br.y - 6);
  // Bouton « Désigner » factice.
  const bw = 96;
  const bx = w - bw - 12;
  const by = h - 40;
  ctx.fillStyle = HAY;
  ctx.beginPath();
  ctx.roundRect?.(bx, by, bw, 30, 15);
  if (!ctx.roundRect) ctx.rect(bx, by, bw, 30);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = '600 14px "Inter Variable", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Désigner', bx + bw / 2, by + 15.5);
}

/** 4. Indices et carnet : une zone éclairée sur la vraie carte, une punaise. */
export function drawHintIllustration(canvas: HTMLCanvasElement, host: MapHost): void {
  const p = prepare(canvas);
  if (!p) return;
  const { ctx, w, h, dpr } = p;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  host.map.renderSnapshot(canvas, { x: 3690, y: 1490, w: 260, h: 160 });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = w * 0.62;
  const cy = h * 0.5;
  const r = Math.min(w, h) * 0.3;
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.fillStyle = 'rgba(20, 14, 10, 0.55)';
  ctx.fill('evenodd');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 236, 190, 0.8)';
  ctx.stroke();
  // Punaise rouge.
  const px = w * 0.16;
  const py = h * 0.3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + 2, py + 22);
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px, py, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#d23b2f';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.stroke();
  label(ctx, 'indice', cx, h - 18);
}
