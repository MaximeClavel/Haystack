// Index spatial : grille uniforme sur les emprises visuelles.
// Chaque case contient les rangs (dans world.entities, déjà trié par ordre de dessin) des entités
// qui la touchent ; une requête fusionne les cases, dédoublonne et renvoie l'ordre de dessin.
import type { Entity, Rect, SpatialIndex } from '../types';

export const INDEX_CELL = 256;

export class GridIndex implements SpatialIndex {
  private readonly cols: number;
  private readonly rows: number;
  private readonly cells: Int32Array[];
  private readonly bx: Float64Array;
  private readonly by: Float64Array;
  private readonly bx2: Float64Array;
  private readonly by2: Float64Array;
  private readonly stamp: Uint32Array;
  private tick = 0;
  // Tampon réutilisé pour les rangs trouvés.
  private buf: Int32Array;

  /** `entities` doit être trié par ordre de dessin ; `bounds[i]` = emprise visuelle de entities[i]. */
  constructor(
    private readonly entities: Entity[],
    bounds: Rect[],
    width: number,
    height: number,
    private readonly cell = INDEX_CELL,
  ) {
    this.cols = Math.ceil(width / cell);
    this.rows = Math.ceil(height / cell);
    const n = entities.length;
    this.bx = new Float64Array(n);
    this.by = new Float64Array(n);
    this.bx2 = new Float64Array(n);
    this.by2 = new Float64Array(n);
    this.stamp = new Uint32Array(n);
    this.buf = new Int32Array(1024);
    const counts = new Int32Array(this.cols * this.rows);
    const ranges: [number, number, number, number][] = new Array(n);
    for (let i = 0; i < n; i++) {
      const b = bounds[i];
      this.bx[i] = b.x;
      this.by[i] = b.y;
      this.bx2[i] = b.x + b.w;
      this.by2[i] = b.y + b.h;
      const c0 = this.clampC(Math.floor(b.x / cell));
      const c1 = this.clampC(Math.floor((b.x + b.w) / cell));
      const r0 = this.clampR(Math.floor(b.y / cell));
      const r1 = this.clampR(Math.floor((b.y + b.h) / cell));
      ranges[i] = [c0, c1, r0, r1];
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) counts[r * this.cols + c]++;
    }
    this.cells = Array.from(counts, (k) => new Int32Array(k));
    const fill = new Int32Array(this.cols * this.rows);
    // Les rangs sont insérés dans l'ordre croissant : chaque case est triée par ordre de dessin.
    for (let i = 0; i < n; i++) {
      const [c0, c1, r0, r1] = ranges[i];
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const k = r * this.cols + c;
          this.cells[k][fill[k]++] = i;
        }
      }
    }
  }

  private clampC(c: number): number {
    return c < 0 ? 0 : c >= this.cols ? this.cols - 1 : c;
  }
  private clampR(r: number): number {
    return r < 0 ? 0 : r >= this.rows ? this.rows - 1 : r;
  }

  /** Rangs (dans `entities`) des entités dont l'emprise intersecte rect, en ordre croissant. */
  queryIndices(rect: Rect): Int32Array {
    const n = this.collect(rect);
    return this.buf.slice(0, n);
  }

  query(rect: Rect): Entity[] {
    const count = this.collect(rect);
    const out = new Array<Entity>(count);
    for (let k = 0; k < count; k++) out[k] = this.entities[this.buf[k]];
    return out;
  }

  /** Remplit this.buf avec les rangs trouvés (triés) et renvoie leur nombre. */
  private collect(rect: Rect): number {
    const x0 = rect.x;
    const y0 = rect.y;
    const x1 = rect.x + rect.w;
    const y1 = rect.y + rect.h;
    const c0 = this.clampC(Math.floor(x0 / this.cell));
    const c1 = this.clampC(Math.floor(x1 / this.cell));
    const r0 = this.clampR(Math.floor(y0 / this.cell));
    const r1 = this.clampR(Math.floor(y1 / this.cell));
    this.tick = (this.tick + 1) >>> 0;
    if (this.tick === 0) {
      this.stamp.fill(0);
      this.tick = 1;
    }
    const t = this.tick;
    let count = 0;
    let sorted = true;
    let last = -1;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const list = this.cells[r * this.cols + c];
        for (let k = 0; k < list.length; k++) {
          const i = list[k];
          if (this.stamp[i] === t) continue;
          this.stamp[i] = t;
          if (this.bx[i] >= x1 || this.bx2[i] <= x0 || this.by[i] >= y1 || this.by2[i] <= y0) continue;
          if (count === this.buf.length) {
            const nb = new Int32Array(this.buf.length * 2);
            nb.set(this.buf);
            this.buf = nb;
          }
          this.buf[count++] = i;
          if (i < last) sorted = false;
          last = i;
        }
      }
    }
    if (!sorted) this.buf.subarray(0, count).sort();
    return count;
  }
}
