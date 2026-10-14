// Génération du monde « ambiant » (sans enquêtes), déterministe pour une graine.
import type { District, Entity, Landmark, Rect, ZoneDef } from '../types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { compareDrawOrder, getEntityBounds } from '../art/bounds';
import { DISTRICTS, LANDMARKS } from './layoutSpec';
import { RectHash, rectPoints } from './geom';
import { planCity, type CityPlan } from './layout';
import { GroundBuilder, buildBaseGround, pondPolygon } from './ground';
import { GroundIndex } from './query';
import { Raster } from './raster';
import type { Gen } from './context';
import { fillBlocks, markBuildings, placeLandmarks } from './buildings';
import { decorateAreas, placeAreaBuildings } from './areas';
import { placeStreetFurniture } from './props';
import { plantTrees } from './vegetation';
import { placeVehicles } from './vehicles';
import { populate } from './people';
import { GridIndex } from './spatial';
import type { GroundLayer } from '../types';

export interface AmbientWorld {
  seed: number;
  width: number;
  height: number;
  ground: GroundLayer;
  /** Toutes les entités ambiantes (bâtiments compris), triées par ordre de dessin. */
  entities: Entity[];
  /** Emprises visuelles, dans le même ordre que `entities`. */
  bounds: Rect[];
  byId: Map<string, Entity>;
  /** Rangs des entités dont l'emprise intersecte rect. */
  indexQuery(rect: Rect): Int32Array;
  landmarks: Landmark[];
  districts: District[];
  /** Zones des lieux de type « area » (`z.<id>`). */
  zones: ZoneDef[];
  plan: CityPlan;
}

export function generateAmbient(seed: number): AmbientWorld {
  const plan = planCity(seed);
  const raster = new Raster();
  const gb = new GroundBuilder(raster);
  buildBaseGround(plan, gb, seed);
  const ground = gb.layer();
  const g: Gen = {
    seed,
    plan,
    raster,
    gb,
    gi: new GroundIndex(ground),
    buildings: [],
    footHash: new RectHash(128),
    bandHash: new RectHash(128),
    entities: [],
    counters: { p: 0, v: 0, t: 0, o: 0 },
    slots: [],
    districtCounters: new Map(),
  };

  // Bâtiments
  placeLandmarks(g);
  fillBlocks(g);
  placeAreaBuildings(g);
  markBuildings(g);

  // Décor, du plus encombrant au plus mobile
  decorateAreas(g);
  // Les aménagements ont pu ajouter des formes de sol (sable, placettes) : index exact à jour.
  g.gi = new GroundIndex(ground);
  placeStreetFurniture(g);
  plantTrees(g);
  placeVehicles(g);
  populate(g);

  const all: Entity[] = [...g.buildings, ...g.entities];
  all.sort(compareDrawOrder);
  const bounds = all.map((e) => getEntityBounds(e));
  const index = new GridIndex(all, bounds, WORLD_WIDTH, WORLD_HEIGHT);
  const byId = new Map(all.map((e) => [e.id, e] as const));

  const landmarks: Landmark[] = LANDMARKS.map((l) => ({
    id: l.id,
    name: l.name,
    district: l.district,
    kind: l.kind,
    rect: { ...l.rect },
    entityId: l.kind === 'building' ? `lm.${l.id}` : l.kind === 'area' ? `z.${l.id}` : byId.has(`lm.${l.id}`) ? `lm.${l.id}` : undefined,
  }));
  const zones: ZoneDef[] = LANDMARKS.filter((l) => l.kind === 'area').map((l) => ({
    id: `z.${l.id}`,
    label: l.name,
    points: l.id === 'etang' ? pondPolygon() : rectPoints(l.rect),
  }));

  return {
    seed,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    ground,
    entities: all,
    bounds,
    byId,
    indexQuery: (r) => index.queryIndices(r),
    landmarks,
    districts: DISTRICTS.map((d) => ({ ...d, rect: { ...d.rect } })),
    zones,
    plan,
  };
}
