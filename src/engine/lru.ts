// Cache LRU borné, avec clés épinglées (jamais évincées) et libération des valeurs évincées.
// Module PUR (testé dans lru.test.ts).
//
// Implémentation : une Map conserve l'ordre d'insertion ; une lecture « touche » l'entrée
// (supprimée puis réinsérée en fin de Map). La plus ancienne entrée non épinglée est évincée.

export class LruCache<K, V> {
  private readonly map = new Map<K, V>();
  private readonly pinned = new Set<K>();

  constructor(
    private cap: number,
    private readonly onEvict?: (key: K, value: V) => void,
  ) {}

  get size(): number {
    return this.map.size;
  }

  get capacity(): number {
    return this.cap;
  }

  set capacity(n: number) {
    this.cap = Math.max(0, Math.floor(n));
    this.evictOverflow();
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  /** Lit une valeur et la marque comme la plus récemment utilisée. */
  get(key: K): V | undefined {
    const v = this.map.get(key);
    if (v === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }

  /** Lit sans modifier l'ordre. */
  peek(key: K): V | undefined {
    return this.map.get(key);
  }

  /** Insère (ou remplace) une valeur, puis évince les plus anciennes au-delà de la capacité. */
  set(key: K, value: V): void {
    const old = this.map.get(key);
    if (old !== undefined) {
      this.map.delete(key);
      if (old !== value) this.onEvict?.(key, old);
    }
    this.map.set(key, value);
    this.evictOverflow(key);
  }

  /** Une clé épinglée n'est jamais évincée (elle peut l'être avant d'avoir une valeur). */
  pin(key: K): void {
    this.pinned.add(key);
  }

  unpin(key: K): void {
    if (this.pinned.delete(key)) this.evictOverflow();
  }

  isPinned(key: K): boolean {
    return this.pinned.has(key);
  }

  get pinnedCount(): number {
    return this.pinned.size;
  }

  /** Retire une entrée (libérée via onEvict). */
  delete(key: K): boolean {
    const v = this.map.get(key);
    if (v === undefined) return false;
    this.map.delete(key);
    this.onEvict?.(key, v);
    return true;
  }

  /** Vide le cache (libère toutes les valeurs). Les épinglages sont conservés sauf `unpinAll`. */
  clear(unpinAll = false): void {
    const entries = [...this.map];
    this.map.clear();
    if (unpinAll) this.pinned.clear();
    for (const [k, v] of entries) this.onEvict?.(k, v);
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  /** Évince les entrées les plus anciennes non épinglées tant que la capacité est dépassée. */
  private evictOverflow(protect?: K): void {
    if (this.map.size <= this.cap) return;
    for (const k of this.map.keys()) {
      if (this.map.size <= this.cap) break;
      if (this.pinned.has(k) || k === protect) continue;
      const v = this.map.get(k) as V;
      this.map.delete(k);
      this.onEvict?.(k, v);
    }
  }
}
