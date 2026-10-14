// Sol de Meulebourg : formes (îlots, places, parc, rivière, voie ferrée, ponts, trottoirs, chaussées)
// et lignes (marquage central, passages piétons, rails, clôtures, parapets).
//
// Ordre de dessin = ordre des tableaux :
//   1. remplissage des îlots (cour, jardin, square, parking…)
//   2. zones (lieux de type « area » et emplacements), de la plus grande à la plus petite
//   3. ballast  4. quais et eau de la rivière  5. tabliers des ponts
//   6. trottoirs de toutes les rues  7. chaussées de toutes les rues
// Les lignes sont dessinées par-dessus toutes les formes.
import type { GroundKind, GroundLayer, GroundLine, GroundLineKind, GroundShape, Rect, Vec2 } from '../types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { Rng } from '../lib/rng';
import { LANDMARKS, RAIL, RIVER } from './layoutSpec';
import { convexSpanInBand, ellipsePolygon, inflate, intersects, rectPoints, rectXY } from './geom';
import type { Block, CityPlan, Street } from './layout';
import {
  F_CROSS,
  F_KEEPVIS,
  F_LINE,
  F_NOBUILD,
  F_PATH,
  F_RAIL,
  F_ROAD,
  F_WATER,
  type Raster,
} from './raster';

export class GroundBuilder {
  readonly shapes: GroundShape[] = [];
  readonly lines: GroundLine[] = [];
  constructor(readonly raster: Raster) {}

  shape(kind: GroundKind, points: Vec2[]): void {
    this.shapes.push({ kind, points });
    this.raster.paintPoly(points, kind);
  }

  rect(kind: GroundKind, r: Rect): void {
    if (r.w <= 0 || r.h <= 0) return;
    this.shapes.push({ kind, points: rectPoints(r) });
    this.raster.paintRect(r, kind);
  }

  /** Ajoute une ligne ; les haies, clôtures, murs et rails deviennent infranchissables pour la foule. */
  line(kind: GroundLineKind, points: Vec2[], width: number): void {
    if (points.length < 2) return;
    this.lines.push({ kind, points, width });
    if (kind === 'hedge' || kind === 'fence' || kind === 'wall' || kind === 'rail') {
      for (let i = 0; i + 1 < points.length; i++) this.raster.markSegment(points[i], points[i + 1], width + 2, F_LINE);
    } else if (kind === 'path') {
      for (let i = 0; i + 1 < points.length; i++) this.raster.markSegment(points[i], points[i + 1], width, F_PATH);
    } else if (kind === 'crosswalk') {
      for (let i = 0; i + 1 < points.length; i++) this.raster.markSegment(points[i], points[i + 1], width, F_CROSS);
    }
  }

  layer(): GroundLayer {
    return { base: 'grass', shapes: this.shapes, lines: this.lines };
  }
}

const BLOCK_GROUND: Record<Block['kind'], GroundKind | null> = {
  urban: 'courtyard',
  houses: 'garden',
  square: 'park',
  parking: 'parking',
  sand: 'sand',
  industrial: 'courtyard',
  empty: null,
};

/** Ponts : tabliers (lieux 'pont-*' + pont ferroviaire). */
export function bridgeRects(): Rect[] {
  const out: Rect[] = [];
  for (const lm of LANDMARKS) if (lm.id.startsWith('pont')) out.push(lm.rect);
  out.push(rectXY(RAIL.x - RAIL.width / 2 - 4, RIVER.y0 - 10, RAIL.x + RAIL.width / 2 + 4, RIVER.y1 + 10));
  return out;
}

/** Rectangles des quais de la rivière (pavés). */
export function quayRects(): Rect[] {
  return [rectXY(0, 3682, WORLD_WIDTH, RIVER.y0), rectXY(0, RIVER.y1, 4300, 3978)];
}

export const RIVER_WATER: Rect = rectXY(0, RIVER.y0, WORLD_WIDTH, RIVER.y1);
export const RAILBED: Rect = rectXY(RAIL.x - RAIL.width / 2, 0, RAIL.x + RAIL.width / 2, WORLD_HEIGHT);

/** Ponton de l'étang. */
export const PONTOON: Rect = rectXY(5355, 986, 5395, 1050);

/** Polygone de l'étang (ellipse inscrite dans son emprise). */
export function pondPolygon(): Vec2[] {
  const lm = LANDMARKS.find((l) => l.id === 'etang')!;
  return ellipsePolygon(lm.rect, 28);
}

/** Construit le sol de base. Les modules spécialisés (parc, cimetière…) ajoutent ensuite leurs lignes. */
export function buildBaseGround(plan: CityPlan, gb: GroundBuilder, seed: number): void {
  const rng = new Rng(seed ^ 0x6a0d);
  const raster = gb.raster;

  // 1) Îlots
  for (const b of plan.blocks) {
    const k = BLOCK_GROUND[b.kind];
    if (b.district === 'port' && b.kind === 'industrial') gb.rect('dock', b.rect);
    else if (k) gb.rect(k, b.rect);
  }

  // 2) Zones (lieux + emplacements), de la plus grande à la plus petite
  const zones: { r: Rect; kind: GroundKind; id: string; keep: boolean }[] = [];
  for (const lm of LANDMARKS) {
    if (lm.kind !== 'area' || !lm.ground) continue;
    zones.push({ r: lm.rect, kind: lm.ground, id: lm.id, keep: true });
  }
  for (const sp of plan.spots) zones.push({ r: sp.rect, kind: sp.ground, id: sp.id, keep: sp.id !== 'abords-parc' });
  zones.sort((a, b) => b.r.w * b.r.h - a.r.w * a.r.h || (a.id < b.id ? -1 : 1));
  for (const z of zones) {
    if (z.id === 'etang') {
      const pond = pondPolygon();
      gb.shape('water', pond);
      raster.markConvex(pond, F_WATER);
      // Ponton en bois au bord sud de l'étang (praticable au-dessus de l'eau)
      gb.rect('dock', PONTOON);
    } else {
      gb.rect(z.kind, z.r);
    }
    raster.markRect(z.r, F_NOBUILD | (z.keep ? F_KEEPVIS : 0));
  }
  raster.clearRect(inflate(PONTOON, -4), F_WATER);

  // 3) Ballast
  gb.rect('railbed', RAILBED);
  raster.markRect(RAILBED, F_RAIL | F_NOBUILD | F_KEEPVIS);

  // 4) Rivière et quais
  for (const q of quayRects()) {
    gb.rect('dock', q);
    raster.markRect(q, F_NOBUILD | F_KEEPVIS);
  }
  gb.rect('water', RIVER_WATER);
  raster.markRect(RIVER_WATER, F_WATER | F_NOBUILD | F_KEEPVIS);

  // 5) Ponts
  for (const br of bridgeRects()) {
    gb.rect('bridge', br);
    raster.markRect(br, F_NOBUILD | F_KEEPVIS);
    // On ne libère de l'eau que les cellules entièrement sur le tablier.
    raster.clearRect(inflate(br, -4), F_WATER);
  }

  // 6) Trottoirs, 7) chaussées
  for (const s of plan.streets) {
    if (s.sidewalk > 0) for (const poly of sidewalkPolys(s)) gb.shape('sidewalk', poly);
    if (s.extra && s.sidewalk > 0) gb.shape('sidewalk', s.extra.sidewalk);
    raster.markPoly(s.poly, F_NOBUILD | F_KEEPVIS);
    if (s.extra) raster.markPoly(s.extra.sidewalk, F_NOBUILD | F_KEEPVIS);
  }
  for (const s of plan.streets) {
    gb.shape('road', s.roadPoly);
    raster.markPoly(s.roadPoly, F_ROAD);
    if (s.extra) {
      gb.shape('road', s.extra.road);
      raster.markPoly(s.extra.road, F_ROAD);
    }
  }
  // Les tabliers des ponts sont praticables (hors chaussée) même s'ils couvrent l'eau.

  // Lignes : marquage central, passages piétons, rails, clôtures, parapets
  addLaneLines(plan.streets, gb);
  addCrosswalks(plan.streets, gb, rng);
  addRail(gb, plan.streets);
  for (const br of bridgeRects()) {
    gb.line('wall', [{ x: br.x + 1.5, y: br.y + 2 }, { x: br.x + 1.5, y: br.y + br.h - 2 }], 3);
    gb.line('wall', [{ x: br.x + br.w - 1.5, y: br.y + 2 }, { x: br.x + br.w - 1.5, y: br.y + br.h - 2 }], 3);
  }
}

/** Trottoirs d'une rue ; les avenues qui franchissent la rivière s'interrompent (le pont prend le relais). */
function sidewalkPolys(s: Street): Vec2[][] {
  if (s.axis === 'v' && s.rect.y < RIVER.y0 && s.rect.y + s.rect.h > RIVER.y1) {
    const r = s.rect;
    return [rectPoints(rectXY(r.x, r.y, r.x + r.w, RIVER.y0 - 10)), rectPoints(rectXY(r.x, RIVER.y1 + 10, r.x + r.w, r.y + r.h))];
  }
  return [s.poly];
}

/** Intervalles [a, b] fusionnés et triés. */
function mergeIntervals(iv: [number, number][]): [number, number][] {
  iv.sort((p, q) => p[0] - q[0]);
  const out: [number, number][] = [];
  for (const [a, b] of iv) {
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

function addLaneLines(streets: Street[], gb: GroundBuilder): void {
  for (const s of streets) {
    if (s.kind !== 'avenue') continue;
    const blocked: [number, number][] = [];
    if (s.axis === 'h') {
      const y = s.a.y;
      for (const t of streets) {
        if (t === s) continue;
        const span = convexSpanInBand(t.poly, s.rect.y + 1, s.rect.y + s.rect.h - 1);
        if (span && t.axis !== 'h') blocked.push([span[0] - 10, span[1] + 10]);
      }
      blocked.push([RAILBED.x - 12, RAILBED.x + RAILBED.w + 12]);
      let x = Math.min(s.a.x, s.b.x);
      const xEnd = Math.max(s.a.x, s.b.x);
      for (const [a, b] of mergeIntervals(blocked)) {
        if (a > x + 30) gb.line('laneline', [{ x, y }, { x: Math.min(a, xEnd), y }], 2);
        x = Math.max(x, b);
        if (x >= xEnd) break;
      }
      if (xEnd > x + 30) gb.line('laneline', [{ x, y }, { x: xEnd, y }], 2);
    } else {
      const x = s.a.x;
      for (const t of streets) {
        if (t === s || t.axis === 'v') continue;
        if (t.rect.x < s.rect.x + s.rect.w && t.rect.x + t.rect.w > s.rect.x) blocked.push([t.rect.y - 10, t.rect.y + t.rect.h + 10]);
      }
      let y = Math.min(s.a.y, s.b.y);
      const yEnd = Math.max(s.a.y, s.b.y);
      for (const [a, b] of mergeIntervals(blocked)) {
        if (a > y + 30) gb.line('laneline', [{ x, y }, { x, y: Math.min(a, yEnd) }], 2);
        y = Math.max(y, b);
        if (y >= yEnd) break;
      }
      if (yEnd > y + 30) gb.line('laneline', [{ x, y }, { x, y: yEnd }], 2);
    }
  }
}

function addCrosswalks(streets: Street[], gb: GroundBuilder, rng: Rng): void {
  const straight = streets.filter((s) => s.axis !== 'd');
  const seen = new Set<string>();
  const others = (r: Rect, self: Street): boolean =>
    straight.some((t) => t !== self && intersects(t.rect, r)) || intersects(r, inflate(RAILBED, 6));
  for (const s of straight) {
    for (const t of streets) {
      if (t === s || t.axis === s.axis) continue;
      if (!intersects(s.rect, t.rect)) continue;
      const major = s.kind === 'avenue' || t.kind === 'avenue';
      if (s.kind === 'port' || t.kind === 'port') continue;
      if (!major && !rng.chance(0.75)) continue;
      const rr = s.roadRect;
      if (s.axis === 'h') {
        const span = convexSpanInBand(t.poly, s.rect.y + 1, s.rect.y + s.rect.h - 1);
        if (!span) continue;
        for (const [x, ok] of [
          [span[0] - 7, s.rect.x < span[0] - 24],
          [span[1] + 7, s.rect.x + s.rect.w > span[1] + 24],
        ] as const) {
          if (!ok) continue;
          const key = `h:${s.id}:${Math.round(x)}`;
          const zone = rectXY(x - 4, rr.y, x + 4, rr.y + rr.h);
          if (seen.has(key) || others(zone, s)) continue;
          seen.add(key);
          gb.line('crosswalk', [{ x, y: rr.y }, { x, y: rr.y + rr.h }], 8);
        }
      } else {
        const ty0 = t.axis === 'd' ? Math.min(t.a.y, t.b.y) : t.rect.y;
        const ty1 = t.axis === 'd' ? Math.max(t.a.y, t.b.y) : t.rect.y + t.rect.h;
        if (t.axis === 'd') continue;
        for (const [y, ok] of [
          [ty0 - 7, s.rect.y < ty0 - 24],
          [ty1 + 7, s.rect.y + s.rect.h > ty1 + 24],
        ] as const) {
          if (!ok) continue;
          const key = `v:${s.id}:${Math.round(y)}`;
          const zone = rectXY(rr.x, y - 4, rr.x + rr.w, y + 4);
          if (seen.has(key) || others(zone, s)) continue;
          seen.add(key);
          gb.line('crosswalk', [{ x: rr.x, y }, { x: rr.x + rr.w, y }], 8);
        }
      }
    }
  }
}

/** Deux voies ferrées sur toute la hauteur, clôtures de part et d'autre (interrompues aux passages à niveau). */
function addRail(gb: GroundBuilder, streets: Street[]): void {
  const x0 = RAILBED.x;
  const x1 = RAILBED.x + RAILBED.w;
  gb.line('rail', [{ x: x0 + 18, y: 0 }, { x: x0 + 18, y: WORLD_HEIGHT }], 14);
  gb.line('rail', [{ x: x1 - 18, y: 0 }, { x: x1 - 18, y: WORLD_HEIGHT }], 14);
  // Coupures des clôtures : rues qui traversent, rivière, quais de la gare (côté est).
  const cutsW: [number, number][] = [[RIVER.y0 - 24, RIVER.y1 + 24]];
  for (const s of streets) {
    if (s.axis === 'h' && s.rect.x < x0 && s.rect.x + s.rect.w > x1) cutsW.push([s.rect.y - 2, s.rect.y + s.rect.h + 2]);
  }
  const cutsE: [number, number][] = [...cutsW, [1330, 1822]];
  const fence = (x: number, cuts: [number, number][]): void => {
    let y = 0;
    for (const [a, b] of mergeIntervals(cuts.map((c) => [c[0], c[1]] as [number, number]))) {
      if (a > y + 20) gb.line('fence', [{ x, y }, { x, y: a }], 2);
      y = Math.max(y, b);
    }
    if (WORLD_HEIGHT > y + 20) gb.line('fence', [{ x, y }, { x, y: WORLD_HEIGHT }], 2);
  };
  fence(x0 - 1, cutsW);
  fence(x1 + 1, cutsE);
  gb.raster.markRect(rectXY(x0 - 3, 0, x1 + 3, WORLD_HEIGHT), F_RAIL);
}
