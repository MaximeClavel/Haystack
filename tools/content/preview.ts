// Aperçu des scènes de la bible (docs/CONTENT.md) : la vraie ville + les enquêtes BROUILLONS
// de src/content/cases, rendues par le moteur. Outil de scénariste, non publié.
//
// Paramètres d'URL :
//   x=&y=&zoom=        caméra initiale
//   only=c01,c02       n'insère que ces enquêtes (défaut : toutes)
//   ids=1              étiquette les entités d'enquête (ids=2 : toutes les entités) quand zoom ≥ 1,5
//   mark=id1,id2       anneau « trouvé » autour de ces entités / zones
//   hint=c01.s2        projecteur de l'indice 2 de l'étape (+ anneaux sur ses réponses)
//   threads=c01        fils rouges de toutes les étapes de l'enquête
//   grid=<pas>         grille de coordonnées
//   hud=0              masque le bandeau
import type { CaseDef, Overlay, Vec2, World } from '../../src/types';
import { buildWorld } from '../../src/world';
import { getHitRect } from '../../src/art/bounds';
import { createMapView } from '../../src/engine';
import { targetCenter, targetRect } from '../../src/game/geometry';
import { CASES as DRAFT_CASES } from '../../src/content';

const params = new URLSearchParams(location.search);
const num = (k: string): number | undefined => {
  const v = params.get(k);
  return v === null || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v);
};
const list = (k: string): string[] => (params.get(k) ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const only = list('only');
const cases: CaseDef[] = only.length ? DRAFT_CASES.filter((c) => only.includes(c.id)) : DRAFT_CASES;
const world: World = buildWorld({ cases });

const hud = document.getElementById('hud') as HTMLDivElement;
if (params.get('hud') === '0') hud.style.display = 'none';
const dev = document.getElementById('dev') as HTMLCanvasElement;
const dctx = dev.getContext('2d') as CanvasRenderingContext2D;

const map = createMapView({
  canvas: document.getElementById('map') as HTMLCanvasElement,
  world,
  initial: { x: num('x'), y: num('y'), zoom: num('zoom') },
  onCameraChange: () => drawDev(),
});

const overlays: Overlay[] = [];
const center = (id: string): Vec2 | undefined => targetCenter(world, id);

for (const id of list('mark')) {
  const r = targetRect(world, id);
  if (r) overlays.push({ kind: 'box', rect: r, style: 'found' });
}
const hintKey = params.get('hint');
if (hintKey) {
  const [cid, sid] = hintKey.split('.');
  const step = DRAFT_CASES.find((c) => c.id === cid)?.steps.find((s) => s.id === sid);
  const area = step?.hints[1]?.area;
  if (area) overlays.unshift({ kind: 'spotlight', circle: area });
  for (const a of step?.accept ?? []) {
    const r = targetRect(world, a);
    if (r) overlays.push({ kind: 'box', rect: r, style: 'reveal' });
  }
}
for (const cid of list('threads')) {
  const def = DRAFT_CASES.find((c) => c.id === cid);
  for (const s of def?.steps ?? []) {
    for (const [a, b] of s.thread ?? []) {
      const p = center(a);
      const q = center(b);
      if (p && q) overlays.push({ kind: 'thread', from: p, to: q });
    }
  }
}
map.setOverlays(overlays);

const idsMode = num('ids') ?? 0;
const gridStep = num('grid') ?? 0;

function label(text: string, x: number, y: number, bg: string, fg: string): void {
  const w = dctx.measureText(text).width;
  dctx.fillStyle = bg;
  dctx.fillRect(x - w / 2 - 2, y - 6, w + 4, 12);
  dctx.fillStyle = fg;
  dctx.fillText(text, x - w / 2, y);
}

function drawDev(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = dev.clientWidth;
  const H = dev.clientHeight;
  if (dev.width !== Math.round(W * dpr)) dev.width = Math.round(W * dpr);
  if (dev.height !== Math.round(H * dpr)) dev.height = Math.round(H * dpr);
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.clearRect(0, 0, dev.width, dev.height);
  dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  dctx.textBaseline = 'middle';
  const cam = map.getCamera();
  const tl = map.screenToWorld({ x: 0, y: 0 });
  const br = map.screenToWorld({ x: W, y: H });
  if (gridStep > 0) {
    dctx.strokeStyle = 'rgba(40,60,160,0.45)';
    dctx.font = '10px ui-monospace, monospace';
    dctx.beginPath();
    for (let x = Math.ceil(tl.x / gridStep) * gridStep; x <= br.x; x += gridStep) {
      const sx = map.worldToScreen({ x, y: 0 }).x;
      dctx.moveTo(sx, 0);
      dctx.lineTo(sx, H);
    }
    for (let y = Math.ceil(tl.y / gridStep) * gridStep; y <= br.y; y += gridStep) {
      const sy = map.worldToScreen({ x: 0, y }).y;
      dctx.moveTo(0, sy);
      dctx.lineTo(W, sy);
    }
    dctx.stroke();
    for (let x = Math.ceil(tl.x / gridStep) * gridStep; x <= br.x; x += gridStep) {
      label(String(x), map.worldToScreen({ x, y: 0 }).x, H - 8, 'rgba(40,60,160,0.8)', '#fff');
    }
    for (let y = Math.ceil(tl.y / gridStep) * gridStep; y <= br.y; y += gridStep) {
      label(String(y), 18, map.worldToScreen({ x: 0, y }).y, 'rgba(40,60,160,0.8)', '#fff');
    }
  }
  if (idsMode > 0 && cam.zoom >= 1.5) {
    dctx.font = '600 9px ui-monospace, monospace';
    for (const e of world.index.query({ x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y })) {
      const story = (e.tags ?? []).includes('story');
      if (!story && idsMode < 2) continue;
      const r = getHitRect(e);
      const a = map.worldToScreen({ x: r.x + r.w / 2, y: r.y + r.h });
      label(e.id, a.x, a.y + 7, story ? 'rgba(160,30,30,0.85)' : 'rgba(255,252,240,0.85)', story ? '#fff' : '#2b2622');
    }
  }
  hud.textContent = `x ${cam.x.toFixed(0)}  y ${cam.y.toFixed(0)}  zoom ${cam.zoom.toFixed(2)}  · enquêtes : ${cases.map((c) => c.id).join(', ') || '—'}`;
}

(window as unknown as Record<string, unknown>).__haystack = { world, map };
void map.whenIdle().then(() => {
  drawDev();
  (window as unknown as Record<string, unknown>).__haystackReady = true;
});
