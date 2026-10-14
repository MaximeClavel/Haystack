// Intégration des enquêtes dans le monde ambiant.
//
// 1. Les entités ambiantes (hors bâtiments et lieux) dont l'emprise visuelle chevauche celle d'une
//    entité d'enquête (marge 6 u) sont retirées. Les autres gardent leur id : ajouter une enquête
//    ne déplace rien ailleurs.
// 2. Règle anti-sosie : un passant (ou un conducteur) qui diffère d'un personnage d'enquête sur
//    moins de 3 attributs saillants est modifié de façon déterministe.
// 3. landmarkOverrides : l'enseigne est remplacée, les détails de façade sont AJOUTÉS à ceux du lieu.
// 4. Les personnes liées à un personnage (`character`) reçoivent son apparence.
// 5. Zones : `z.<lieu>` pour chaque lieu de type « area », puis les zones des enquêtes.
import type { BuildingEntity, CaseDef, CharacterDef, Entity, Rect, World, ZoneDef } from '../types';
import { compareDrawOrder, getEntityBounds } from '../art/bounds';
import { deSosie, type Signature } from './appearance';
import { inflate } from './geom';
import type { AmbientWorld } from './generate';
import { setWorldMeta } from './meta';
import { GridIndex } from './spatial';

/** Marge (u) autour des entités d'enquête dans laquelle l'ambiant est retiré. */
export const STORY_CLEARANCE = 6;

/** Copie d'une entité ambiante (objets imbriqués compris) : le cache ne doit jamais être modifié. */
function copyEntity(e: Entity): Entity {
  const tags = e.tags ? [...e.tags] : undefined;
  switch (e.kind) {
    case 'person':
      return { ...e, tags, appearance: { ...e.appearance } };
    case 'vehicle':
      return e.driver ? { ...e, tags, driver: { ...e.driver } } : { ...e, tags };
    case 'building':
      return { ...e, tags, footprint: { ...e.footprint }, features: e.features?.map((f) => ({ ...f })) };
    default:
      return { ...e, tags };
  }
}

function isRemovableAmbient(e: Entity): boolean {
  return e.kind !== 'building' && e.id.startsWith('a.');
}

export function integrateCases(amb: AmbientWorld, cases: readonly CaseDef[]): World {
  // --- Personnages et entités d'enquête
  const characters = new Map<string, CharacterDef>();
  for (const c of cases) for (const ch of c.characters) characters.set(ch.id, ch);
  const story: Entity[] = [];
  const storyIds = new Set<string>();
  for (const c of cases) {
    for (const e0 of c.entities) {
      if (storyIds.has(e0.id) || amb.byId.has(e0.id)) {
        throw new Error(`[world] id d'entité en double : « ${e0.id} » (enquête ${c.id})`);
      }
      storyIds.add(e0.id);
      let e: Entity = { ...e0, tags: e0.tags ? [...e0.tags] : undefined };
      if (!e.tags) delete e.tags;
      if (e.kind === 'person' && e.character) {
        const ch = characters.get(e.character);
        if (ch) e = { ...e, appearance: { ...ch.appearance } };
      }
      const tags = new Set(e.tags ?? []);
      tags.add('story');
      tags.add(`case:${c.id}`);
      e.tags = [...tags];
      story.push(e);
    }
  }

  // --- Retrait de l'ambiant qui chevauche une scène
  const removed = new Set<number>();
  const storyBounds: Rect[] = story.map((e) => getEntityBounds(e));
  for (const sb of storyBounds) {
    const zone = inflate(sb, STORY_CLEARANCE);
    for (const i of amb.indexQuery(zone)) {
      if (isRemovableAmbient(amb.entities[i])) removed.add(i);
    }
  }

  // --- Anti-sosie
  const refs: Signature[] = [...characters.values()].map((c) => ({ id: c.id, appearance: c.appearance }));
  let deSosied = 0;
  const ambientOut: Entity[] = [];
  const ambientBounds: Rect[] = [];
  for (let i = 0; i < amb.entities.length; i++) {
    if (removed.has(i)) continue;
    const e0 = amb.entities[i];
    let e: Entity = copyEntity(e0);
    if (refs.length) {
      if (e.kind === 'person' && e.id.startsWith('a.')) {
        const fixed = deSosie(e.id, e.appearance, refs);
        if (fixed) {
          e = { ...e, appearance: fixed };
          deSosied++;
        }
      } else if (e.kind === 'vehicle' && e.driver) {
        const fixed = deSosie(e.id, e.driver, refs);
        if (fixed) e = { ...e, driver: fixed };
      }
    }
    ambientOut.push(e);
    ambientBounds.push(amb.bounds[i]);
  }

  // --- Modifications des lieux
  const byIdTmp = new Map<string, number>();
  ambientOut.forEach((e, i) => byIdTmp.set(e.id, i));
  for (const c of cases) {
    for (const [key, ov] of Object.entries(c.landmarkOverrides ?? {})) {
      const id = key.startsWith('lm.') ? key : `lm.${key}`;
      const k = byIdTmp.get(id);
      if (k === undefined) continue;
      const b = ambientOut[k] as BuildingEntity;
      if (b.kind !== 'building') continue;
      const nb: BuildingEntity = { ...b };
      if (ov.sign !== undefined) nb.sign = ov.sign;
      if (ov.features?.length) nb.features = [...(b.features ?? []), ...ov.features.map((f) => ({ ...f }))];
      ambientOut[k] = nb;
    }
  }

  // --- Assemblage : tri par ordre de dessin, emprises, index
  const all: Entity[] = ambientOut.concat(story);
  const allBounds: Rect[] = ambientBounds.concat(storyBounds);
  const order = all.map((_, i) => i).sort((a, b) => compareDrawOrder(all[a], all[b]));
  const entities = order.map((i) => all[i]);
  const sortedBounds = order.map((i) => allBounds[i]);
  const bounds = new Map<string, Rect>();
  const byId = new Map<string, Entity>();
  entities.forEach((e, i) => {
    bounds.set(e.id, sortedBounds[i]);
    byId.set(e.id, e);
  });
  const index = new GridIndex(entities, sortedBounds, amb.width, amb.height);

  // --- Zones
  const zones = new Map<string, ZoneDef>();
  for (const z of amb.zones) zones.set(z.id, { ...z, points: z.points.map((p) => ({ ...p })) });
  for (const c of cases) {
    for (const z of c.zones ?? []) {
      if (zones.has(z.id)) throw new Error(`[world] id de zone en double : « ${z.id} » (enquête ${c.id})`);
      zones.set(z.id, z);
    }
  }

  const world: World = {
    seed: amb.seed,
    width: amb.width,
    height: amb.height,
    ground: amb.ground,
    entities,
    byId,
    bounds,
    index,
    districts: amb.districts.map((d) => ({ ...d, rect: { ...d.rect } })),
    landmarks: amb.landmarks.map((l) => ({ ...l, rect: { ...l.rect } })),
    zones,
  };
  setWorldMeta(world, { streets: amb.plan.streets, blocks: amb.plan.blocks, spots: amb.plan.spots, removedAmbient: removed.size, deSosied });
  return world;
}
