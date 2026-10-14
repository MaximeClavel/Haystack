// Gestion des tuiles : cache LRU, niveau racine épinglé, ordonnancement des rendus sous budget.

import type { World } from '../types';
import { MAX_DPR, TILE_SIZE } from '../config';
import type { Viewport, WorldSize } from './camera';
import { CACHE_BASE_TILES, CACHE_MAX_BYTES } from './constants';
import { LruCache } from './lru';
import { TileJob, createSurface, offscreenSupported, releaseImage, type Surface, type TileImage } from './render';
import { allTiles, cacheCapacity, levelRange, tileKey, type TileCoord } from './tiles';

interface TileEntry {
  tile: TileCoord;
  image: TileImage;
}

export interface TileStats {
  /** Tuiles terminées depuis la création. */
  rendered: number;
  /** Travaux abandonnés (tuile devenue inutile). */
  aborted: number;
  /** Temps cumulé de rendu des tuiles terminées (ms). */
  totalMs: number;
  /** Durée de la dernière tuile terminée (ms). */
  lastMs: number;
  /** Durée maximale d'une tuile (ms). */
  maxMs: number;
  /** Part du temps passée à finaliser les tuiles (rastérisation différée, ms cumulées). */
  flushMs: number;
}

export class TileManager {
  readonly cache: LruCache<string, TileEntry>;
  readonly stats: TileStats = { rendered: 0, aborted: 0, totalMs: 0, lastMs: 0, maxMs: 0, flushMs: 0 };
  rootLevel = 0;
  minLevel = 0;
  /** Tuiles du niveau racine (repli universel, épinglées). */
  rootTiles: TileCoord[] = [];
  tilePx: number;
  readonly offscreen: boolean;
  private job: TileJob | null = null;
  private surface: Surface | null = null;
  private readonly worldSize: WorldSize;

  constructor(
    private readonly world: World,
    private dpr: number,
  ) {
    this.worldSize = { width: world.width, height: world.height };
    this.tilePx = Math.round(TILE_SIZE * dpr);
    this.offscreen = offscreenSupported();
    this.cache = new LruCache<string, TileEntry>(Math.round(CACHE_BASE_TILES / dpr), (_k, e) => releaseImage(e.image));
  }

  /** Changement de densité : toutes les tuiles sont à refaire. */
  setDpr(dpr: number): void {
    const d = Math.min(MAX_DPR, dpr);
    if (d === this.dpr) return;
    this.dpr = d;
    this.tilePx = Math.round(TILE_SIZE * d);
    this.abortJob();
    this.surface = null;
    this.cache.clear();
  }

  /** Recalcule les niveaux, la racine épinglée et la capacité pour un écran et un zoom minimal. */
  configure(minZoom: number, vp: Viewport): void {
    const r = levelRange(minZoom, this.worldSize);
    this.minLevel = r.min;
    if (r.root !== this.rootLevel || this.rootTiles.length === 0) {
      for (const t of this.rootTiles) this.cache.unpin(tileKey(t));
      this.rootLevel = r.root;
      this.rootTiles = allTiles(r.root, this.worldSize);
      for (const t of this.rootTiles) this.cache.pin(tileKey(t));
    }
    this.cache.capacity = cacheCapacity(vp, this.dpr, this.rootTiles.length, CACHE_BASE_TILES, CACHE_MAX_BYTES);
  }

  has(t: TileCoord): boolean {
    return this.cache.has(tileKey(t));
  }

  /** Marque la tuile comme récemment utilisée (si elle est en cache). */
  touch(t: TileCoord): void {
    this.cache.get(tileKey(t));
  }

  /** Image prête de la tuile (marquée comme récemment utilisée), ou undefined. */
  get(t: TileCoord): TileImage | undefined {
    return this.cache.get(tileKey(t))?.image;
  }

  get jobKey(): string | null {
    return this.job ? this.job.key : null;
  }

  get busy(): boolean {
    return this.job !== null;
  }

  /**
   * Rend des tuiles de `plan` (ordre de priorité) jusqu'à `deadline`. Un travail en cours est
   * poursuivi s'il figure encore dans le plan, abandonné sinon. Renvoie le nombre de tuiles finies.
   *
   * Une tuile se termine en deux temps : l'enregistrement des dessins (découpé en tranches), puis
   * la finalisation (take() → transferToImageBitmap), qui déclenche la rastérisation différée des
   * commandes enregistrées et ne peut pas être découpée. S'il ne reste pas assez de budget pour
   * elle, elle est reportée au début de l'image suivante.
   */
  work(plan: readonly TileCoord[], deadline: number, now: () => number = () => performance.now()): number {
    if (this.job && !this.job.done && !plan.some((t) => tileKey(t) === this.job!.key)) this.abortJob();
    let done = 0;
    let idx = 0;
    for (;;) {
      if (this.job?.done) {
        this.finishJob(this.job, now);
        this.job = null;
        done++;
        if (now() >= deadline) break;
        continue;
      }
      if (!this.job) {
        while (idx < plan.length && this.cache.has(tileKey(plan[idx]))) idx++;
        if (idx >= plan.length) break;
        if (done > 0 && now() >= deadline) break;
        const surface = this.ensureSurface();
        if (!surface) break;
        this.job = new TileJob(plan[idx], this.world, surface, this.tilePx, now);
        idx++;
      }
      if (!this.job.step(deadline)) break;
      // Enregistrement fini : finalisation tout de suite si le budget restant le permet.
      if (now() > deadline - this.flushEstimate()) break;
    }
    return done;
  }

  /** Durée estimée d'une finalisation (moyenne observée, 3 ms par défaut, au plus 8 ms). */
  private flushEstimate(): number {
    return this.stats.rendered ? Math.min(8, this.stats.flushMs / this.stats.rendered) : 3;
  }

  private finishJob(job: TileJob, now: () => number): void {
    // take() force la rastérisation des commandes enregistrées : coût réel, compté avec la tuile.
    const tf = now();
    const image = job.take();
    const flush = now() - tf;
    job.elapsed += flush;
    this.stats.flushMs += flush;
    if (!this.surface?.offscreen) this.surface = null; // canevas DOM consommé par la tuile
    this.cache.set(job.key, { tile: job.tile, image });
    this.stats.rendered++;
    this.stats.totalMs += job.elapsed;
    this.stats.lastMs = job.elapsed;
    this.stats.maxMs = Math.max(this.stats.maxMs, job.elapsed);
  }

  /** Vide le cache (les tuiles seront refaites). */
  invalidate(): void {
    this.abortJob();
    this.cache.clear();
  }

  destroy(): void {
    this.abortJob();
    this.cache.clear(true);
    if (this.surface) {
      this.surface.canvas.width = 0;
      this.surface.canvas.height = 0;
    }
    this.surface = null;
  }

  private abortJob(): void {
    if (this.job) {
      this.job.abort();
      this.job = null;
      this.stats.aborted++;
    }
  }

  private ensureSurface(): Surface | null {
    if (!this.surface) this.surface = createSurface(this.tilePx, this.tilePx, this.offscreen);
    return this.surface;
  }
}
