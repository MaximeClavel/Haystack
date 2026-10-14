// Page de développement : vue d'ensemble de Meulebourg (dev/overview.html).
//
// Paramètres d'URL :
//   scale=0.12          échelle (px CSS par unité monde)
//   x=&y=&w=&h=         sous-région du monde (défaut : toute la ville)
//   fit=1               ajuste l'échelle à la fenêtre
//   grid=1              grille de coordonnées étiquetée tous les 200 u (ou grid=<pas>)
//   labels=1            noms des lieux remarquables ; streets=1 : noms des rues
//   art=0               rendu simplifié (rectangles) au lieu du module art — juge la composition
//   sg=1                sol simplifié + entités dessinées par le module art ; sb=1 : bâtiments simplifiés
//   cases=0             sans les enquêtes ; hidden=1 : zones masquées par les toits
//   lod=0|1|2           force le niveau de détail du module art
import type { Entity, GroundKind, GroundLayer, GroundLineKind, Rect, World } from '../types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { buildWorld, worldMeta } from '../world';
import { CASES } from '../content';
import * as art from '../art';
import { getHitRect } from '../art/bounds';

const params = new URLSearchParams(location.search);
const num = (k: string, d: number): number => {
  const v = params.get(k);
  return v === null || v === '' || Number.isNaN(Number(v)) ? d : Number(v);
};

/* ----------------------------------------------------------------------------
 * Rendu simplifié (indépendant du module art) : sert à juger la composition.
 * ------------------------------------------------------------------------- */

const GROUND: Record<GroundKind, string> = {
  grass: '#cdd9a5',
  park: '#b5d08e',
  water: '#8fb6cc',
  sand: '#ecdca8',
  plaza: '#f1e2c2',
  sidewalk: '#d8cfbf',
  road: '#a9a39a',
  parking: '#bdb6aa',
  dock: '#c7b08e',
  garden: '#c3d697',
  courtyard: '#d9d4c6',
  bridge: '#b39f86',
  railbed: '#9c9184',
};
const LINES: Record<GroundLineKind, string> = {
  laneline: '#f4f1e6',
  crosswalk: '#f8f6ee',
  rail: '#5b534c',
  path: '#eadfc6',
  curb: '#8a847a',
  fence: '#7b5a3c',
  hedge: '#5f8a45',
  wall: '#8d8478',
};
const COLOR: Record<string, string> = {
  red: '#c8553d', blue: '#4a7fb5', navy: '#2e3f66', green: '#5b9a58', olive: '#8a8a45', yellow: '#e8c547',
  orange: '#e58a3a', pink: '#e7a1b0', purple: '#8a5a9b', brown: '#8b5e3c', beige: '#e3d1a8', black: '#2a2a2a',
  white: '#f7f4ec', grey: '#9a9a9a',
};

function simpleGround(c: CanvasRenderingContext2D, g: GroundLayer): void {
  c.fillStyle = GROUND[g.base];
  c.fillRect(view.x, view.y, view.w, view.h);
  for (const s of g.shapes) {
    c.fillStyle = GROUND[s.kind];
    c.beginPath();
    s.points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fill();
  }
  c.lineCap = 'butt';
  for (const l of g.lines) {
    c.strokeStyle = LINES[l.kind];
    c.lineWidth = l.width;
    if (l.kind === 'laneline') c.setLineDash([12, 10]);
    else c.setLineDash([]);
    c.beginPath();
    l.points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.stroke();
  }
  c.setLineDash([]);
}

function simpleEntity(c: CanvasRenderingContext2D, e: Entity): void {
  c.lineWidth = 1 / Math.max(scale, 0.25);
  c.strokeStyle = '#2b2622';
  if (e.kind === 'building') {
    const f = e.footprint;
    c.fillStyle = COLOR[e.wall];
    c.fillRect(f.x, f.y + f.h - e.height, f.w, e.height);
    c.strokeRect(f.x, f.y + f.h - e.height, f.w, e.height);
    c.fillStyle = COLOR[e.roof];
    c.fillRect(f.x, f.y - e.height, f.w, f.h);
    c.strokeRect(f.x, f.y - e.height, f.w, f.h);
    if (e.sign && scale >= 0.5) {
      c.fillStyle = '#222';
      c.font = '8px sans-serif';
      c.fillText(e.sign, f.x + 2, f.y + f.h - 30);
    }
    return;
  }
  const r = getHitRect(e);
  if (e.kind === 'tree') {
    c.fillStyle = e.tree === 'pine' ? '#2f5d3a' : e.tree === 'bare' ? '#8a7a5a' : '#4f8a46';
    c.beginPath();
    c.ellipse(r.x + r.w / 2, r.y + r.h * 0.4, r.w / 2, r.h * 0.4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6b4a2e';
    c.fillRect(e.x - 1.5, r.y + r.h * 0.7, 3, r.h * 0.3);
    return;
  }
  c.fillStyle =
    e.kind === 'person' ? COLOR[e.appearance.topColor] : e.kind === 'vehicle' ? COLOR[e.color] : e.color ? COLOR[e.color] : '#6b625a';
  c.fillRect(r.x, r.y, r.w, r.h);
  if (scale >= 0.5) c.strokeRect(r.x, r.y, r.w, r.h);
}

let view: Rect = { x: 0, y: 0, w: WORLD_WIDTH, h: WORLD_HEIGHT };
let scale = 0.12;

function main(): void {
  view = { x: num('x', 0), y: num('y', 0), w: num('w', WORLD_WIDTH), h: num('h', WORLD_HEIGHT) };
  scale = num('scale', 0.12);
  if (params.get('fit') === '1') scale = Math.min(innerWidth / view.w, innerHeight / view.h);
  const useArt = params.get('art') !== '0';
  const gridStep = params.has('grid') ? (num('grid', 1) <= 1 ? 200 : num('grid', 200)) : 0;

  const t0 = performance.now();
  let world: World;
  let error = '';
  try {
    world = buildWorld({ cases: params.get('cases') === '0' ? [] : CASES });
  } catch (err) {
    // Une enquête invalide (id en double…) ne doit pas empêcher de voir la ville.
    error = `⚠ ${(err as Error).message} — affichage sans les enquêtes\n`;
    console.error(err);
    world = buildWorld({ cases: [] });
  }
  const buildMs = performance.now() - t0;

  const canvas = document.getElementById('view') as HTMLCanvasElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${Math.round(view.w * scale)}px`;
  canvas.style.height = `${Math.round(view.h * scale)}px`;
  canvas.width = Math.round(view.w * scale * dpr);
  canvas.height = Math.round(view.h * scale * dpr);
  const ctx = canvas.getContext('2d')!;

  const PAPER = (art as { PAPER?: string }).PAPER ?? '#f3ecdc';
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, -view.x * scale * dpr, -view.y * scale * dpr);

  const t1 = performance.now();
  const entities = world.index.query(view);
  if (useArt) {
    const lod = (params.has('lod') ? num('lod', 2) : art.lodForZoom(scale)) as art.Lod;
    if (params.get('sg') === '1') simpleGround(ctx, world.ground);
    else art.drawGround(ctx, world.ground, view, lod);
    const simpleBuildings = params.get('sb') === '1';
    for (const e of entities) {
      if (simpleBuildings && e.kind === 'building') simpleEntity(ctx, e);
      else art.drawEntity(ctx, e, lod);
    }
  } else {
    simpleGround(ctx, world.ground);
    for (const e of entities) simpleEntity(ctx, e);
  }
  const drawMs = performance.now() - t1;

  if (params.get('hidden') === '1') {
    ctx.fillStyle = 'rgba(200,0,200,0.25)';
    for (const e of entities) {
      if (e.kind !== 'building') continue;
      const f = e.footprint;
      ctx.fillRect(f.x, f.y - e.height, f.w, e.height);
    }
  }

  // Surcouches en coordonnées écran
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sx = (x: number): number => (x - view.x) * scale;
  const sy = (y: number): number => (y - view.y) * scale;

  if (gridStep > 0) {
    ctx.strokeStyle = 'rgba(30,30,90,0.35)';
    ctx.fillStyle = 'rgba(20,20,70,0.9)';
    ctx.lineWidth = 1;
    ctx.font = '10px system-ui, sans-serif';
    for (let x = Math.ceil(view.x / gridStep) * gridStep; x <= view.x + view.w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(sx(x) + 0.5, 0);
      ctx.lineTo(sx(x) + 0.5, view.h * scale);
      ctx.stroke();
      ctx.fillText(String(x), sx(x) + 2, 10);
    }
    for (let y = Math.ceil(view.y / gridStep) * gridStep; y <= view.y + view.h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, sy(y) + 0.5);
      ctx.lineTo(view.w * scale, sy(y) + 0.5);
      ctx.stroke();
      ctx.fillText(String(y), 2, sy(y) - 2);
    }
  }

  function label(text: string, x: number, y: number, color = '#111', bg = 'rgba(255,255,240,0.8)'): void {
    ctx.font = 'bold 11px system-ui, sans-serif';
    const w = ctx.measureText(text).width;
    ctx.fillStyle = bg;
    ctx.fillRect(x - w / 2 - 3, y - 8, w + 6, 14);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 3);
    ctx.textAlign = 'start';
  }

  if (params.get('streets') === '1') {
    const meta = worldMeta(world);
    for (const s of meta?.streets ?? []) {
      const cx = (s.a.x + s.b.x) / 2;
      const cy = (s.a.y + s.b.y) / 2;
      if (cx < view.x || cx > view.x + view.w || cy < view.y || cy > view.y + view.h) continue;
      label(s.name, sx(cx), sy(cy), '#333', 'rgba(220,230,255,0.75)');
    }
  }

  if (params.get('labels') === '1') {
    for (const lm of world.landmarks) {
      const r = lm.rect;
      const cx = r.x + r.w / 2;
      const cy = lm.kind === 'building' ? r.y + r.h / 2 : r.y + r.h / 2;
      if (cx < view.x || cx > view.x + view.w || cy < view.y || cy > view.y + view.h) continue;
      label(lm.name, sx(cx), sy(cy));
    }
  }

  const counts: Record<string, number> = {};
  for (const e of world.entities) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
  const info = document.getElementById('info')!;
  info.textContent =
    error +
    `monde ${buildMs.toFixed(0)} ms · dessin ${drawMs.toFixed(0)} ms · ${entities.length} entités visibles\n` +
    Object.entries(counts)
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ');
  if (params.get('info') === '0' && !error) info.style.display = 'none';

  (window as unknown as { __haystackReady: boolean; __world: World }).__world = world;
  (window as unknown as { __haystackReady: boolean }).__haystackReady = true;
}

main();
