// Petit monde factice construit à la main, pour les tests du module game (n'attend pas le générateur).
// Pur et sans dépendance au générateur : index spatial linéaire, sol de quelques rectangles.
import type {
  BuildingEntity,
  CaseDef,
  Entity,
  GroundLayer,
  PersonAppearance,
  PersonEntity,
  PropEntity,
  PropKind,
  Rect,
  StepDef,
  TreeEntity,
  Vec2,
  VehicleEntity,
  VehicleKind,
  World,
  ZoneDef,
} from '../types';
import { compareDrawOrder, getEntityBounds } from '../art/bounds';

export const TEST_WIDTH = 1000;
export const TEST_HEIGHT = 800;

export function rectPoly(x: number, y: number, w: number, h: number): Vec2[] {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
}

/**
 * Sol du monde de test (1000 × 800, fond herbe) :
 * trottoir y ∈ [200, 240], chaussée y ∈ [240, 300], place (100, 400, 300 × 200),
 * eau (600, 500, 300 × 200).
 */
export function testGround(): GroundLayer {
  return {
    base: 'grass',
    shapes: [
      { kind: 'sidewalk', points: rectPoly(0, 200, TEST_WIDTH, 40) },
      { kind: 'road', points: rectPoly(0, 240, TEST_WIDTH, 60) },
      { kind: 'plaza', points: rectPoly(100, 400, 300, 200) },
      { kind: 'water', points: rectPoly(600, 500, 300, 200) },
    ],
    lines: [],
  };
}

export const LOOK: PersonAppearance = {
  skin: 'light',
  hair: 'short',
  hairColor: 'brown',
  hat: 'none',
  top: 'coat',
  topColor: 'red',
  topPattern: 'plain',
  bottom: 'trousers',
  bottomColor: 'navy',
  face: 'none',
  accessory: 'none',
  build: 'regular',
};

export function person(id: string, x: number, y: number, extra: Partial<PersonEntity> = {}): PersonEntity {
  return { id, kind: 'person', x, y, appearance: { ...LOOK }, pose: 'stand', facing: 'right', ...extra };
}

export function prop(id: string, kind: PropKind, x: number, y: number, extra: Partial<PropEntity> = {}): PropEntity {
  return { id, kind: 'prop', prop: kind, x, y, ...extra };
}

export function vehicle(id: string, kind: VehicleKind, x: number, y: number, extra: Partial<VehicleEntity> = {}): VehicleEntity {
  return { id, kind: 'vehicle', vehicle: kind, x, y, facing: 'right', color: 'blue', ...extra };
}

export function tree(id: string, x: number, y: number, size = 40): TreeEntity {
  return { id, kind: 'tree', tree: 'round', x, y, size };
}

/** Bâtiment d'emprise `fp` ; ancre au milieu du bord sud. */
export function building(id: string, fp: Rect, height = 60, extra: Partial<BuildingEntity> = {}): BuildingEntity {
  return {
    id,
    kind: 'building',
    x: fp.x + fp.w / 2,
    y: fp.y + fp.h,
    style: 'shop',
    footprint: { ...fp },
    height,
    wall: 'beige',
    roof: 'grey',
    seed: 1,
    ...extra,
  };
}

/**
 * Entités de base : la banque (emprise 100,100 – 300,200, hauteur 80 : toit et façade couvrent
 * y ∈ [20, 200], sol caché par le toit pour y ∈ [20, 100)), une maison générée, la fontaine sur
 * la place et un passant ambiant sur la chaussée.
 */
export function baseEntities(): Entity[] {
  return [
    building('lm.banque', { x: 100, y: 100, w: 200, h: 100 }, 80, { style: 'bank', sign: 'BANQUE' }),
    building('b.centre.1', { x: 500, y: 100, w: 150, h: 90 }, 60),
    prop('lm.fontaine', 'fountain', 250, 500),
    person('a.p.1', 700, 260),
  ];
}

/** Zones de base : la place et l'étang. */
export function baseZones(): ZoneDef[] {
  return [
    { id: 'z.place', label: 'la place', points: rectPoly(100, 400, 300, 200) },
    { id: 'z.etang', label: "l'étang", points: rectPoly(600, 500, 300, 200) },
  ];
}

/** Index spatial linéaire (mêmes règles que l'index du monde : intersection stricte, ordre de dessin). */
class LinearIndex {
  constructor(
    private readonly entities: Entity[],
    private readonly bounds: Map<string, Rect>,
  ) {}
  query(r: Rect): Entity[] {
    return this.entities.filter((e) => {
      const b = this.bounds.get(e.id)!;
      return b.x < r.x + r.w && r.x < b.x + b.w && b.y < r.y + r.h && r.y < b.y + b.h;
    });
  }
}

export interface TestWorldOptions {
  entities?: Entity[];
  zones?: ZoneDef[];
  ground?: GroundLayer;
  width?: number;
  height?: number;
  /** Enquêtes dont les entités et zones sont ajoutées au monde (sans retrait de l'ambiant). */
  cases?: CaseDef[];
}

/** Monde factice. Sans options : sol de test, entités et zones de base. */
export function makeWorld(opts: TestWorldOptions = {}): World {
  const extra = (opts.cases ?? []).flatMap((c) => c.entities.map((e) => ({ ...e, tags: ['story', `case:${c.id}`] })));
  const entities = [...(opts.entities ?? baseEntities()), ...extra].sort(compareDrawOrder);
  const byId = new Map<string, Entity>();
  const bounds = new Map<string, Rect>();
  for (const e of entities) {
    if (byId.has(e.id)) throw new Error(`id en double dans le monde de test : ${e.id}`);
    byId.set(e.id, e);
    bounds.set(e.id, getEntityBounds(e));
  }
  const zones = new Map<string, ZoneDef>();
  for (const z of [...(opts.zones ?? baseZones()), ...(opts.cases ?? []).flatMap((c) => c.zones ?? [])]) zones.set(z.id, z);
  return {
    seed: 1,
    width: opts.width ?? TEST_WIDTH,
    height: opts.height ?? TEST_HEIGHT,
    ground: opts.ground ?? testGround(),
    entities,
    byId,
    bounds,
    index: new LinearIndex(entities, bounds),
    districts: [],
    landmarks: [],
    zones,
  };
}

/** Étape minimale valide (textes et deux indices par défaut). */
export function step(id: string, accept: string[], extra: Partial<StepDef> = {}): StepDef {
  return {
    id,
    question: `Question ${id} ?`,
    accept,
    hints: [{ text: `Indice 1 de ${id}.` }, { text: `Indice 2 de ${id}.` }],
    solved: `Étape ${id} résolue.`,
    ...extra,
  };
}

/** Enquête minimale (textes par défaut) ; `steps` et `id` obligatoires. */
export function caseDef(partial: Partial<CaseDef> & { id: string; steps: StepDef[] }): CaseDef {
  return {
    title: `Enquête ${partial.id}`,
    difficulty: 1,
    teaser: 'Une accroche.',
    intro: 'Un briefing.',
    start: { x: 500, y: 400, zoom: 1 },
    epilogue: 'Fin.',
    replay: [],
    characters: [],
    entities: [],
    ...partial,
  };
}
