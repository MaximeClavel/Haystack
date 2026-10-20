// Feuille de confirmation d'une désignation : vignette bien zoomée de la cible + Désigner / Annuler.
import { useEffect, useRef } from 'preact/hooks';
import type { Entity, Pick, Rect } from '../../../types';
import { getHitRect } from '../../../art';
import type { MapHost } from '../../mapHost';
import { fr, targetLabel } from '../../format';
import { thumbRect } from './overlays';

const THUMB_W = 132;
const THUMB_H = 99;

function drawMarker(ctx: CanvasRenderingContext2D, view: Rect, cw: number, ch: number, entity: Entity | null, pick: Pick): void {
  // renderSnapshot élargit le rectangle au format du canevas en le centrant : même échelle ici.
  const s = Math.min(cw / view.w, ch / view.h);
  const cx = view.x + view.w / 2;
  const cy = view.y + view.h / 2;
  const tx = (x: number): number => (x - cx) * s + cw / 2;
  const ty = (y: number): number => (y - cy) * s + ch / 2;
  const dpr = cw / THUMB_W;
  ctx.save();
  ctx.lineJoin = 'round';
  const path = new Path2D();
  if (entity) {
    const r = getHitRect(entity);
    const pad = 3 * dpr;
    const x = tx(r.x) - pad;
    const y = ty(r.y) - pad;
    const w = r.w * s + 2 * pad;
    const h = r.h * s + 2 * pad;
    path.rect(x, y, w, h);
  } else {
    path.arc(tx(pick.point.x), ty(pick.point.y), 11 * dpr, 0, Math.PI * 2);
  }
  ctx.lineWidth = 4.5 * dpr;
  ctx.strokeStyle = 'rgba(28, 20, 14, 0.6)';
  ctx.stroke(path);
  ctx.setLineDash([6 * dpr, 4 * dpr]);
  ctx.lineWidth = 2 * dpr;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke(path);
  ctx.restore();
}

export function ConfirmSheet(props: {
  host: MapHost;
  pick: Pick;
  questionLabel: string;
  /** Question en cours, rappelée (2 lignes) : on compare la vignette à ses indices visuels. */
  question: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { host, pick, questionLabel, question, onConfirm, onCancel } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const entity = pick.entityId ? (host.world.byId.get(pick.entityId) ?? null) : null;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(THUMB_W * dpr);
    c.height = Math.round(THUMB_H * dpr);
    const view = thumbRect(entity, pick.point);
    host.map.renderSnapshot(c, view);
    const ctx = c.getContext('2d');
    if (ctx) drawMarker(ctx, view, c.width, c.height, entity, pick);
  }, [pick]);

  // Le focus va à la feuille (annoncée par les lecteurs d'écran) ; Échap annule.
  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, [pick]);

  const label = targetLabel(entity);
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      class="sheet confirm"
      role="dialog"
      aria-labelledby="confirm-q"
      data-testid="confirm-sheet"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <p class="confirm-question" data-testid="confirm-question">
        {fr(question)}
      </p>
      <div class="confirm-main">
        <canvas
          ref={canvasRef}
          class="thumb"
          style={{ width: `${THUMB_W}px`, height: `${THUMB_H}px` }}
          role="img"
          aria-label={`Vue rapprochée de ${label}`}
        />
        <div class="confirm-text">
          <p class="confirm-step">{questionLabel}</p>
          <p id="confirm-q" class="confirm-q">
            Désigner {label} ?
          </p>
        </div>
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-paper" onClick={onCancel} data-testid="confirm-cancel">
          Annuler
        </button>
        <button type="button" class="btn btn-primary" onClick={onConfirm} data-testid="confirm-designate">
          Désigner
        </button>
      </div>
    </div>
  );
}
