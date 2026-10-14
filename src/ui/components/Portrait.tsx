// Portrait d'un personnage (buste dessiné par le module art), pour le carnet.
import { useEffect, useRef } from 'preact/hooks';
import type { PersonAppearance } from '../../types';
import { PAPER, drawPortrait } from '../../art';

export function Portrait({ appearance, size = 64, label }: { appearance: PersonAppearance; size?: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, size, size);
    try {
      drawPortrait(ctx, appearance, size / 2, size / 2 + size * 0.04, size * 0.92);
    } catch {
      // Un portrait raté ne doit pas casser le carnet.
    }
  }, [appearance, size]);
  return <canvas ref={ref} class="portrait" style={{ width: `${size}px`, height: `${size}px` }} role="img" aria-label={label} />;
}
