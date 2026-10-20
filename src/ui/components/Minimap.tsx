// Minicarte : vignette de toute la ville (rendue UNE fois puis gardée) + rectangle de la vue.
// Le rectangle est redessiné directement sur un canevas à chaque changement de caméra (pas de
// re-rendu Preact). Un tap y emmène la caméra.
import { useEffect, useRef } from 'preact/hooks';
import type { Vec2, World } from '../../types';
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

/**
 * Noms des quartiers écrits sur la vignette (petites capitales sur halo clair) : les enquêtes citent
 * « le Faubourg », « les Jardins »… et la minicarte doit permettre de s'y repérer.
 */
function drawDistrictNames(ctx: CanvasRenderingContext2D, world: World, cw: number, ch: number, dpr: number): void {
  const sx = cw / world.width;
  const sy = ch / world.height;
  const size = 9.5 * dpr;
  ctx.save();
  ctx.font = `700 ${size}px "Inter Variable", Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (const d of world.districts) {
    // Nom long sur deux lignes si le quartier est étroit.
    const maxW = Math.max(d.rect.w * sx * 0.95, 56 * dpr);
    let lines = [d.name];
    if (ctx.measureText(d.name).width > maxW) {
      const words = d.name.split(' ');
      let best = 1;
      let gap = Infinity;
      for (let i = 1; i < words.length; i++) {
        const a = ctx.measureText(words.slice(0, i).join(' ')).width;
        const b = ctx.measureText(words.slice(i).join(' ')).width;
        if (Math.abs(a - b) < gap) {
          gap = Math.abs(a - b);
          best = i;
        }
      }
      if (words.length > 1) lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
    }
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const h = lines.length * size * 1.1;
    const cx = Math.min(cw - w / 2 - 2 * dpr, Math.max(w / 2 + 2 * dpr, (d.rect.x + d.rect.w / 2) * sx));
    const cy = Math.min(ch - h / 2 - 1 * dpr, Math.max(h / 2 + 1 * dpr, (d.rect.y + d.rect.h / 2) * sy));
    lines.forEach((l, i) => {
      const y = cy + (i - (lines.length - 1) / 2) * size * 1.1;
      ctx.lineWidth = 3 * dpr;
      ctx.strokeStyle = 'rgba(251, 246, 234, 0.92)';
      ctx.strokeText(l, cx, y);
      ctx.fillStyle = '#2f2622';
      ctx.fillText(l, cx, y);
    });
  }
  ctx.restore();
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
      drawDistrictNames(bctx, world, base.width, base.height, dpr);
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
    <div
      class={`minimap ${side}`}
      data-testid="minimap"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div class="minimap-frame">
        <canvas ref={baseRef} class="minimap-base" aria-hidden="true" />
        {/* Surface de pointage (toucher/souris) : au clavier, la carte se déplace avec les flèches et +/−,
            et le bouton « Fermer la minicarte » reste atteignable. */}
        <canvas
          ref={viewRef}
          class="minimap-view"
          role="img"
          aria-label="Minicarte de Meulebourg : touchez un endroit pour vous y rendre"
          onClick={onClick}
        />
      </div>
      <button type="button" class="minimap-close" aria-label="Fermer la minicarte" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
