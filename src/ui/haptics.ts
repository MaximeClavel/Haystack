// Retours haptiques (vibrations courtes). Silencieux si l'appareil ne sait pas vibrer.

export type HapticKind = 'found' | 'solved' | 'soft';

const PATTERNS: Record<HapticKind, number | number[]> = {
  /** Bonne réponse : une vibration courte. */
  found: 28,
  /** Enquête résolue : trois petites. */
  solved: [30, 60, 30, 60, 50],
  /** Retour discret (punaise posée). */
  soft: 12,
};

export function vibrate(kind: HapticKind, enabled: boolean): void {
  if (!enabled) return;
  try {
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    nav.vibrate?.(PATTERNS[kind]);
  } catch {
    // Vibration refusée (iframe, politique du navigateur) : sans conséquence.
  }
}
