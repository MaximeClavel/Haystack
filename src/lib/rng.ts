// Aléatoire déterministe partagé (world, art, content). Ne jamais utiliser Math.random() dans ces modules.

/** Générateur pseudo-aléatoire rapide à graine (mulberry32). Renvoie des flottants dans [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hachage 32 bits d'une chaîne (FNV-1a) — pour dériver une graine stable d'un id. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Outils pratiques autour d'un générateur. */
export class Rng {
  private readonly next: () => number;
  constructor(seed: number) {
    this.next = mulberry32(seed);
  }
  /** Flottant dans [0, 1). */
  float(): number {
    return this.next();
  }
  /** Flottant dans [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
  /** Entier dans [min, max] (bornes incluses). */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  /** Vrai avec la probabilité p. */
  chance(p: number): boolean {
    return this.next() < p;
  }
  /** Élément au hasard. */
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
  /** Élément au hasard selon des poids. */
  weighted<T>(items: readonly (readonly [T, number])[]): T {
    const total = items.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [item, w] of items) {
      r -= w;
      if (r < 0) return item;
    }
    return items[items.length - 1][0];
  }
  /** Mélange en place (Fisher-Yates). */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
}
