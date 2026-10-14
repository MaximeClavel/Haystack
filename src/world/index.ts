// Module world : génère Meulebourg de façon déterministe et y insère les scènes des enquêtes.
//
// Pipeline (voir README.md) :
//   plan des rues → sol → lieux remarquables → îlots bâtis → aménagements des lieux →
//   mobilier → arbres → véhicules → foule   (= monde « ambiant », indépendant des enquêtes, mis en cache)
//   puis intégration des enquêtes : retrait de l'ambiant qui chevauche une scène, règle anti-sosie,
//   modifications des lieux, ajout des entités et des zones, tri et index spatial.
import type { CaseDef, World } from '../types';
import { WORLD_HEIGHT, WORLD_SEED, WORLD_WIDTH } from '../config';
import { generateAmbient, type AmbientWorld } from './generate';
import { integrateCases } from './story';

export { groundAt, isWalkable, buildingAt, appearanceDistance, onCrosswalk, isHiddenByRoof, entitiesAt, SALIENT_KEYS } from './query';
export { worldMeta, type WorldMeta } from './meta';
export { findFreeSpots } from './free';

const cache = new Map<number, AmbientWorld>();

/** Monde ambiant (sans enquêtes) pour une graine — calculé une fois puis mis en cache. */
export function ambientWorld(seed: number = WORLD_SEED): AmbientWorld {
  let a = cache.get(seed);
  if (!a) {
    a = generateAmbient(seed);
    cache.set(seed, a);
    // Cache borné : quelques graines suffisent (tests).
    if (cache.size > 4) cache.delete(cache.keys().next().value as number);
  }
  return a;
}

/**
 * Construit le monde. Déterministe : mêmes options → même monde.
 * Les entités ambiantes sont des copies : on peut modifier le World obtenu sans altérer le cache.
 */
export function buildWorld(opts: { seed?: number; cases?: CaseDef[] } = {}): World {
  const seed = opts.seed ?? WORLD_SEED;
  const amb = ambientWorld(seed);
  const world = integrateCases(amb, opts.cases ?? []);
  world.width = WORLD_WIDTH;
  world.height = WORLD_HEIGHT;
  return world;
}
