// Requêtes exactes sur un monde construit : type de sol, passage piéton, bâtiment, praticabilité.
// Les index nécessaires sont construits paresseusement et mémorisés (WeakMap) : ces fonctions
// marchent sur n'importe quel World, y compris un World « fait main » dans un test.
import type { BuildingEntity, Entity, GroundKind, GroundLayer, PersonAppearance, Rect, Vec2, World } from '../types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { getHitRect } from '../art/bounds';
import { pointInPolygon, pointInThickSegment, polyBBox } from './geom';

const BUCKET = 128;

/** Index exact du sol : formes et passages piétons rangés par cases de 128 u. */
export class GroundIndex {
  private readonly cols: number;
  private readonly rows: number;
  private readonly shapeBuckets: number[][];
  private readonly crossBuckets: number[][];
  private readonly bboxes: Rect[];

  constructor(private readonly ground: GroundLayer) {
    this.cols = Math.ceil(WORLD_WIDTH / BUCKET) + 1;
    this.rows = Math.ceil(WORLD_HEIGHT / BUCKET) + 1;
    this.shapeBuckets = Array.from({ length: this.cols * this.rows }, () => []);
    this.crossBuckets = Array.from({ length: this.cols * this.rows }, () => []);
    this.bboxes = ground.shapes.map((s) => polyBBox(s.points));
    this.bboxes.forEach((b, i) => this.insert(this.shapeBuckets, b, i));
    ground.lines.forEach((l, i) => {
      if (l.kind !== 'crosswalk') return;
      const b = polyBBox(l.points);
      this.insert(this.crossBuckets, { x: b.x - l.width, y: b.y - l.width, w: b.w + 2 * l.width, h: b.h + 2 * l.width }, i);
    });
  }

  private insert(buckets: number[][], b: Rect, i: number): void {
    const c0 = Math.max(0, Math.floor(b.x / BUCKET));
    const c1 = Math.min(this.cols - 1, Math.floor((b.x + b.w) / BUCKET));
    const r0 = Math.max(0, Math.floor(b.y / BUCKET));
    const r1 = Math.min(this.rows - 1, Math.floor((b.y + b.h) / BUCKET));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) buckets[r * this.cols + c].push(i);
  }

  private bucket(buckets: number[][], x: number, y: number): number[] {
    const c = Math.floor(x / BUCKET);
    const r = Math.floor(y / BUCKET);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return [];
    return buckets[r * this.cols + c];
  }

  /** Type de sol visible au point (la dernière forme dessinée qui le contient, sinon le fond). */
  kindAt(x: number, y: number): GroundKind {
    const list = this.bucket(this.shapeBuckets, x, y);
    for (let k = list.length - 1; k >= 0; k--) {
      const i = list[k];
      const b = this.bboxes[i];
      if (x < b.x || y < b.y || x > b.x + b.w || y > b.y + b.h) continue;
      if (pointInPolygon(this.ground.shapes[i].points, x, y)) return this.ground.shapes[i].kind;
    }
    return this.ground.base;
  }

  /** Le point est-il sur un passage piéton ? */
  onCrosswalk(x: number, y: number): boolean {
    const p = { x, y };
    for (const i of this.bucket(this.crossBuckets, x, y)) {
      const l = this.ground.lines[i];
      for (let k = 0; k + 1 < l.points.length; k++) {
        if (pointInThickSegment(p, l.points[k], l.points[k + 1], l.width)) return true;
      }
    }
    return false;
  }
}

const groundIndexes = new WeakMap<GroundLayer, GroundIndex>();

export function groundIndex(ground: GroundLayer): GroundIndex {
  let gi = groundIndexes.get(ground);
  if (!gi) {
    gi = new GroundIndex(ground);
    groundIndexes.set(ground, gi);
  }
  return gi;
}

/** Type de sol au point p (exact, d'après les formes de world.ground). */
export function groundAt(world: World, p: Vec2): GroundKind {
  return groundIndex(world.ground).kindAt(p.x, p.y);
}

/** Vrai si p est sur un passage piéton (ligne 'crosswalk'). */
export function onCrosswalk(world: World, p: Vec2): boolean {
  return groundIndex(world.ground).onCrosswalk(p.x, p.y);
}

/** Bâtiment dont l'EMPRISE AU SOL contient p (le plus en avant s'il y en a plusieurs). */
export function buildingAt(world: World, p: Vec2): BuildingEntity | undefined {
  const hits = world.index.query({ x: p.x - 0.5, y: p.y - 0.5, w: 1, h: 1 });
  for (let i = hits.length - 1; i >= 0; i--) {
    const e = hits[i];
    if (e.kind !== 'building') continue;
    const f = e.footprint;
    if (p.x >= f.x && p.x < f.x + f.w && p.y >= f.y && p.y < f.y + f.h) return e;
  }
  return undefined;
}

/**
 * Un piéton peut-il se tenir en p ? Faux hors du monde, dans l'eau (hors pont et quai)
 * et dans l'emprise d'un bâtiment. La chaussée est praticable (on peut traverser).
 */
export function isWalkable(world: World, p: Vec2): boolean {
  if (p.x < 0 || p.y < 0 || p.x >= world.width || p.y >= world.height) return false;
  if (groundAt(world, p) === 'water') return false;
  return buildingAt(world, p) === undefined;
}

/** Attributs « saillants » d'une apparence (ceux que l'œil compare pour reconnaître quelqu'un). */
export const SALIENT_KEYS = [
  'hat',
  'top',
  'topColor',
  'topPattern',
  'accessory',
  'hair',
  'hairColor',
  'bottomColor',
  'face',
] as const satisfies readonly (keyof PersonAppearance)[];

/** Nombre d'attributs saillants qui diffèrent entre deux apparences (0 = indiscernables). */
export function appearanceDistance(a: PersonAppearance, b: PersonAppearance): number {
  let d = 0;
  for (const k of SALIENT_KEYS) if (a[k] !== b[k]) d++;
  return d;
}

/** Entités dont le rectangle de désignation (corps) contient p, de la plus en avant à la plus en arrière. */
export function entitiesAt(world: World, p: Vec2, tolerance = 0): Entity[] {
  const hits = world.index.query({ x: p.x - tolerance - 1, y: p.y - tolerance - 1, w: 2 * tolerance + 2, h: 2 * tolerance + 2 });
  const out: Entity[] = [];
  for (let i = hits.length - 1; i >= 0; i--) {
    const r = getHitRect(hits[i]);
    if (p.x >= r.x - tolerance && p.x <= r.x + r.w + tolerance && p.y >= r.y - tolerance && p.y <= r.y + r.h + tolerance) {
      out.push(hits[i]);
    }
  }
  return out;
}

/**
 * Vrai si le point au sol p est caché par le toit d'un bâtiment situé plus au sud
 * (projection oblique : un bâtiment recouvre le sol sur `height` unités au nord de son emprise).
 */
export function isHiddenByRoof(world: World, p: Vec2): boolean {
  const hits = world.index.query({ x: p.x - 0.5, y: p.y - 0.5, w: 1, h: 1 });
  for (const e of hits) {
    if (e.kind !== 'building') continue;
    const f = e.footprint;
    if (p.x >= f.x && p.x < f.x + f.w && p.y >= f.y - e.height && p.y < f.y) return true;
  }
  return false;
}
