// Minicarte : vignette de toute la ville (rendue UNE fois puis gardée) + rectangle de la vue.
// Le rectangle est redessiné directement sur un canevas à chaque changement de caméra (pas de
// re-rendu Preact). Un tap y emmène la caméra.
import { useEffect, useRef } from 'preact/hooks';
import type { Vec2 } from '../../types';
import { visibleWorldRect } from '../../engine';
import type { MapHost } from '../mapHost';

/** Résolution de la vignette mise en cache (px réels), au format de la ville (4:3). */
const SNAP_W = 480;
let snapshot: HTMLCanvasElement | null = null;

function citySnapshot(host: MapHost): HTMLCanvasElement {
  if (snapshot) return snapshot;
  const w = host.world;
  const c = document.createElement('canvas');
  c.width = SNAP_W;
  c.height = Math.round((SNAP_W * w.height) / w.width);
  host.map.renderSnapshot(c, { x: 0, y: 0, w: w.width, h: w.height });
  snapshot = c;
  return c;
}

/** Prépare la vignette à l'avance (appelé quand le navigateur est inactif). */
export function warmMinimap(host: MapHost): void {
  citySnapshot(host);
}

export interface MinimapMark {
  at: Vec2;
  kind: 'pin' | 'found';
}

export function Minimap(props: { host: MapHost; marks?: MinimapMark[]; side?: 'left' | 'right'; onClose: () => void }) {
  const { host, marks, side = 'right', onClose } = props;
  const baseRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const marksRef = useRef<MinimapMark[]>(marks ?? []);
  const drawRef = useRef<(() => void) | null>(null);
  marksRef.current = marks ?? [];
  const world = host.world;

  useEffect(() => {
    const base = baseRef.current;
    const view = viewRef.current;
    if (!base || !view) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = base.clientWidth || 200;
    const cssH = base.clientHeight || 150;
    for (const c of [base, view]) {
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
    }
    const bctx = base.getContext('2d');
    if (bctx) {
      bctx.imageSmoothingQuality = 'high';
      bctx.drawImage(citySnapshot(host), 0, 0, base.width, base.height);
    }
    const vctx = view.getContext('2d');
    const sx = view.width / world.width;
    const sy = view.height / world.height;
    const draw = (): void => {
      if (!vctx) return;
      vctx.setTransform(1, 0, 0, 1, 0, 0);
      vctx.clearRect(0, 0, view.width, view.height);
      // Repères : réponses trouvées (vert) et punaises (rouge).
      for (const m of marksRef.current) {
        vctx.beginPath();
        vctx.arc(m.at.x * sx, m.at.y * sy, 3.2 * dpr, 0, Math.PI * 2);
        vctx.fillStyle = m.kind === 'pin' ? '#d23b2f' : '#3f9e55';
        vctx.fill();
        vctx.lineWidth = 1.2 * dpr;
        vctx.strokeStyle = '#fffaf0';
        vctx.stroke();
      }
      const r = visibleWorldRect(host.map.getCamera(), host.viewport());
      let x = r.x * sx;
      let y = r.y * sy;
      let w = r.w * sx;
      let h = r.h * sy;
      // Rectangle minimal lisible (vue très zoomée).
      const min = 7 * dpr;
      if (w < min) {
        x -= (min - w) / 2;
        w = min;
      }
      if (h < min) {
        y -= (min - h) / 2;
        h = min;
      }
      vctx.lineWidth = 3.5 * dpr;
      vctx.strokeStyle = 'rgba(43, 38, 34, 0.85)';
      vctx.strokeRect(x, y, w, h);
      vctx.lineWidth = 1.8 * dpr;
      vctx.strokeStyle = '#f2c14e';
      vctx.strokeRect(x, y, w, h);
    };
    drawRef.current = draw;
    draw();
    const off = host.onCamera(draw);
    return () => {
      off();
      drawRef.current = null;
    };
  }, [host]);

  // Les repères changent : redessin immédiat (sans attendre un mouvement de caméra).
  useEffect(() => {
    drawRef.current?.();
  }, [marks]);

  function onClick(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const p = {
      x: ((e.clientX - r.left) / r.width) * world.width,
      y: ((e.clientY - r.top) / r.height) * world.height,
    };
    const z = Math.max(1, host.map.getCamera().zoom);
    void host.focus(p, z);
  }

  return (
    <div class={`minimap ${side}`} data-testid="minimap">
      <div class="minimap-frame">
        <canvas ref={baseRef} class="minimap-base" aria-hidden="true" />
        <canvas
          ref={viewRef}
          class="minimap-view"
          role="button"
          tabIndex={0}
          aria-label="Minicarte de Meulebourg : touchez un endroit pour vous y rendre"
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
        />
      </div>
      <button type="button" class="minimap-close" aria-label="Fermer la minicarte" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
