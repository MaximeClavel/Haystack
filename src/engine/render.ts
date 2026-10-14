// Rendu d'une portion du monde (tuile ou vignette) avec le module art.
//
// Recette commune : fond « table » → découpe au monde → papier → sol → entités (déjà triées par
// l'index spatial), le contexte étant en coordonnées MONDE.
//
// Les tuiles sont rendues par « travaux » interruptibles (TileJob) : le sol d'abord, puis les
// entités par paquets, en rendant la main dès que le budget de l'image est épuisé. Une grosse
// tuile (niveau « ville entière ») se rend ainsi en plusieurs images sans saccade.
//
// Surfaces : OffscreenCanvas si disponible — la tuile terminée est convertie en ImageBitmap
// (transferToImageBitmap : pas de copie, et une seule surface de travail réutilisée) ;
// sinon (anciens Safari), un canevas DOM par tuile.

import type { Entity, Rect, World } from '../types';
import { PAPER, drawEntity, drawGround, lodForZoom, type Lod } from '../art';
import { BACKDROP, ENTITIES_PER_CHECK } from './constants';
import { levelZoom, tileKey, tileRect, type TileCoord } from './tiles';

export type TileImage = ImageBitmap | HTMLCanvasElement;
type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

export interface Surface {
  canvas: AnyCanvas;
  /** Contexte 2D (celui d'un OffscreenCanvas est compatible pour l'usage qu'en fait art). */
  ctx: CanvasRenderingContext2D;
  offscreen: boolean;
}

let drawErrors = 0;

/** Nombre d'entités dont le dessin a levé une exception (statistiques de débogage). */
export function drawErrorCount(): number {
  return drawErrors;
}

export function offscreenSupported(): boolean {
  return (
    typeof OffscreenCanvas !== 'undefined' &&
    typeof (OffscreenCanvas.prototype as { transferToImageBitmap?: unknown }).transferToImageBitmap === 'function'
  );
}

/** Crée une surface opaque de w × h pixels (OffscreenCanvas si possible). */
export function createSurface(w: number, h: number, preferOffscreen = true): Surface | null {
  if (preferOffscreen && offscreenSupported()) {
    try {
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d', { alpha: false }) as unknown as CanvasRenderingContext2D | null;
      if (ctx) return { canvas, ctx, offscreen: true };
    } catch {
      // repli sur un canevas DOM
    }
  }
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  return ctx ? { canvas, ctx, offscreen: false } : null;
}

/** Libère la mémoire d'une image de tuile évincée. */
export function releaseImage(img: TileImage): void {
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    img.close();
  } else {
    (img as HTMLCanvasElement).width = 0;
    (img as HTMLCanvasElement).height = 0;
  }
}

function drawOne(ctx: CanvasRenderingContext2D, e: Entity, lod: Lod): void {
  try {
    drawEntity(ctx, e, lod);
  } catch (err) {
    if (drawErrors++ < 5) console.warn(`[engine] échec du dessin de l'entité ${e.id}`, err);
  }
}

/** Remet le contexte à zéro (pile d'états comprise, si le navigateur sait le faire). */
function resetContext(ctx: CanvasRenderingContext2D): void {
  const c = ctx as CanvasRenderingContext2D & { reset?: () => void };
  if (typeof c.reset === 'function') c.reset();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

/**
 * Prépare le dessin du rectangle monde `rect` dans une surface de pxW × pxH pixels :
 * fond, transformation monde, découpe au monde, papier, sol. Renvoie false si `rect` est
 * entièrement hors du monde (rien d'autre à dessiner).
 */
function beginWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  rect: Rect,
  pxW: number,
  pxH: number,
  lod: Lod,
): boolean {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, pxW, pxH);
  const sx = pxW / rect.w;
  const sy = pxH / rect.h;
  ctx.setTransform(sx, 0, 0, sy, -rect.x * sx, -rect.y * sy);
  const x0 = Math.max(0, rect.x);
  const y0 = Math.max(0, rect.y);
  const x1 = Math.min(world.width, rect.x + rect.w);
  const y1 = Math.min(world.height, rect.y + rect.h);
  if (x1 <= x0 || y1 <= y0) return false;
  if (x0 > rect.x || y0 > rect.y || x1 < rect.x + rect.w || y1 < rect.y + rect.h) {
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
    ctx.clip();
  }
  ctx.fillStyle = PAPER;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  drawGround(ctx, world.ground, rect, lod);
  return true;
}

/** Rendu direct et complet (synchrone) d'un rectangle monde : vignettes, minicarte, carnet. */
export function renderWorldRect(
  ctx: CanvasRenderingContext2D,
  world: World,
  rect: Rect,
  pxW: number,
  pxH: number,
  lod: Lod,
): void {
  ctx.save();
  if (beginWorld(ctx, world, rect, pxW, pxH, lod)) {
    const list = world.index.query(rect);
    for (let i = 0; i < list.length; i++) drawOne(ctx, list[i], lod);
  }
  ctx.restore();
}

/** Rendu interruptible d'une tuile. */
export class TileJob {
  readonly key: string;
  readonly lod: Lod;
  /** Temps de rendu cumulé (ms). */
  elapsed = 0;
  private entities: Entity[] | null = null;
  private next = 0;
  private finished = false;

  constructor(
    readonly tile: TileCoord,
    private readonly world: World,
    private readonly surface: Surface,
    private readonly tilePx: number,
    private readonly now: () => number = () => performance.now(),
  ) {
    this.key = tileKey(tile);
    this.lod = lodForZoom(levelZoom(tile.level));
  }

  get done(): boolean {
    return this.finished;
  }

  /** Progression [0, 1] (débogage). */
  get progress(): number {
    if (!this.entities) return 0;
    return this.entities.length ? this.next / this.entities.length : 1;
  }

  /** Avance le rendu jusqu'à `deadline` (horloge `now`). Renvoie true quand la tuile est finie. */
  step(deadline: number): boolean {
    if (this.finished) return true;
    const t0 = this.now();
    const ctx = this.surface.ctx;
    let progressed = false;
    if (!this.entities) {
      resetContext(ctx);
      ctx.save();
      const rect = tileRect(this.tile);
      const any = beginWorld(ctx, this.world, rect, this.tilePx, this.tilePx, this.lod);
      this.entities = any ? this.world.index.query(rect) : [];
      progressed = true;
    }
    const list = this.entities;
    let i = this.next;
    while (i < list.length) {
      if (progressed && this.now() >= deadline) break;
      const end = Math.min(list.length, i + ENTITIES_PER_CHECK);
      for (; i < end; i++) drawOne(ctx, list[i], this.lod);
      progressed = true;
    }
    this.next = i;
    if (i >= list.length) {
      ctx.restore();
      this.finished = true;
    }
    this.elapsed += this.now() - t0;
    return this.finished;
  }

  /** Image finale. Pour une surface OffscreenCanvas, celle-ci est vidée et réutilisable. */
  take(): TileImage {
    const c = this.surface.canvas;
    if (this.surface.offscreen) return (c as OffscreenCanvas).transferToImageBitmap();
    return c as HTMLCanvasElement;
  }

  /** Abandon (la surface reste utilisable pour un autre travail). */
  abort(): void {
    if (this.entities && !this.finished) this.surface.ctx.restore();
    this.finished = true;
  }
}
