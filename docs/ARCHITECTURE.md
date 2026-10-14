# Architecture — Haystack (version web)

Ce document décrit comment le jeu est découpé, comment les modules se parlent, et les conventions
que tous les contributeurs (humains ou agents) respectent. Les contrats TypeScript font foi :
`src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts`.

## 1. Vue d'ensemble

```
                 ┌──────────────────────────── src/ui (Preact) ────────────────────────────┐
                 │ écrans : accueil · dossiers · enquête · carnet · fin · comment jouer     │
                 └───────┬───────────────────────┬───────────────────────┬─────────────────┘
                         │ MapView               │ CaseSession, pickAt   │ CASES
                 ┌───────▼───────┐       ┌───────▼───────┐       ┌───────▼───────┐
                 │  src/engine   │       │   src/game    │       │  src/content  │
                 │ caméra, gestes│       │ règles, indices│      │ enquêtes (data)│
                 │ tuiles, overlays│     │ sauvegarde    │       └───────┬───────┘
                 └───┬───────┬───┘       └───────┬───────┘               │ CaseDef[]
                     │       │ World             │ World         ┌───────▼───────┐
                     │       └───────────────────┴──────────────►│   src/world   │
                     │ drawGround / drawEntity                    │ ville générée │
                 ┌───▼───────────┐       bounds (pur)             │ + scènes      │
                 │   src/art     │◄───────────────────────────────┤ + foule       │
                 │ dessin vectoriel│                              └───────────────┘
                 └───────────────┘
```

| Module | Rôle | Dépend de | DOM ? |
|---|---|---|---|
| `src/art` | Dessine sol et entités sur un `CanvasRenderingContext2D` ; emprises (`bounds.ts`) | types, config | `bounds.ts` : non ; reste : canvas |
| `src/world` | Génère la ville (déterministe) et y insère les scènes des enquêtes | types, config, art/bounds, layoutSpec | **non** |
| `src/engine` | Affiche la carte : caméra, gestes, tuiles, cache, overlays, animations | types, config, art | oui |
| `src/game` | Règles d'une enquête, désignation, indices, étoiles, sauvegarde, validation du contenu | types, config, art/bounds | **non** (localStorage injecté) |
| `src/content` | Les enquêtes (données TypeScript) | types | **non** |
| `src/ui` | Interface, navigation, assemblage | tout | oui |

## 2. Le monde et sa projection

- Monde de **6400 × 4800 unités** (`src/config.ts`). 1 unité = 1 px CSS au zoom 1. Zoom de « toute la ville » (~0,06) à 4.
- **Vue oblique** : le sol est vu de dessus ; les bâtiments montrent leur **toit** (emprise décalée de `-height`)
  et leur **façade sud** ; personnages, véhicules, arbres et objets sont dessinés debout, ancrés au sol par leur base.
- **Ordre du peintre** : tri par `sortKey(e)` croissant puis par id (`compareDrawOrder`). Une entité en hauteur
  (`z > 0`, ex. cambrioleur sur un toit) doit fixer `sortY` explicitement (ex. `sortY` du bâtiment + 1).
- **Emprises** (`src/art/bounds.ts`) : `getEntityBounds` (visuelle, conservatrice — tout le dessin doit y tenir)
  et `getHitRect` (corps, pour la désignation). Les tailles nominales (personne 20 u, voiture 44 u…) y sont définies.
- **Plan directeur** (`src/world/layoutSpec.ts`) : quartiers, avenues, rivière, voie ferrée et lieux remarquables.

## 3. Pipeline de rendu (module engine)

1. La caméra `{x, y, zoom}` détermine un **niveau de tuiles** `L` (zoom de rendu `2^L`, du plus petit niveau
   couvrant toute la ville jusqu'à `L = 2`, soit zoom 4).
2. Une tuile couvre `TILE_SIZE / 2^L` unités monde (256 px CSS × `min(devicePixelRatio, MAX_DPR)`).
3. Rendu d'une tuile : fond `PAPER` → `drawGround(ctx, world.ground, rect, lod)` → pour chaque entité de
   `world.index.query(rect)` (déjà triées) : `drawEntity(ctx, e, lod)`. Le contexte est en coordonnées monde.
4. Les tuiles sont rendues **progressivement** (budget de temps par image, les plus centrales d'abord) et gardées
   dans un **cache LRU** borné. Une tuile manquante est remplacée par sa parente (agrandie) : jamais de trou.
5. Les **overlays** (`Overlay` : projecteur d'indice, anneaux, fil rouge, punaises) sont redessinés à chaque image
   par-dessus les tuiles.
6. `lodForZoom(zoom)` : `0` détail complet (zoom ≥ 1), `1` simplifié, `2` silhouettes (vue d'ensemble).

## 4. API des modules (exports attendus)

### `src/art/index.ts`
- `type Lod = 0 | 1 | 2`, `lodForZoom(zoom): Lod`, `PAPER: string` (couleur du papier).
- `drawGround(ctx, ground, view: Rect, lod)`, `drawEntity(ctx, e: Entity, lod)`.
- `drawPortrait(ctx, appearance, cx, cy, size)` : buste d'un personnage (carnet).
- ré-exporte `getEntityBounds`, `getHitRect`, `sortKey`, `compareDrawOrder` depuis `bounds.ts`.

### `src/world/index.ts`
- `buildWorld({ seed?, cases? }): World` — déterministe. La foule ambiante est générée **indépendamment**
  des enquêtes puis filtrée (retrait de ce qui chevauche une scène) : ajouter une enquête ne déplace pas le reste.
- Aucun passant ambiant ne doit être un **sosie** d'un personnage scénarisé (règle de « signature »).
- Chaque lieu de type `area` produit une zone désignable d'id `z.<landmarkId>` (ex. `z.parc`).
- Utilitaires : `groundAt(world, p)`, `isWalkable(world, p)`.

### `src/engine/index.ts`
- `createMapView(opts: MapViewOptions): MapView` (voir `src/types.ts`).

### `src/game/index.ts`
- `pickAt(world, point, zoom): Pick` — entité sous le doigt (la plus en avant dans l'ordre de dessin,
  tolérance `PICK_TOLERANCE_PX / zoom`).
- `class CaseSession(def, world, progress?)` : `openSteps()`, `solvedSteps()`, `submit(stepId, pick)`,
  `hint(stepId)`, `currentHint(stepId)`, `threads()`, `isSolved()`, `stars()`, `progress()`, punaises et notes.
- `entityCenter(world, id): Vec2` (entité ou zone).
- `createSaveStore(storage?)` → `{ load(), save(data), reset() }` (localStorage, repli en mémoire).
- `validateCase(def, world): string[]` — liste des problèmes d'une enquête (utilisée par les tests de contenu).
- `isUnlocked(def, save)`.

### `src/content/index.ts`
- `CASES: CaseDef[]` dans l'ordre d'affichage. Une enquête par fichier : `src/content/cases/<id>.ts`.

## 5. Conventions d'identifiants

| Quoi | Format | Exemple |
|---|---|---|
| Bâtiment d'un lieu remarquable | `lm.<landmarkId>` | `lm.banque` |
| Zone d'un lieu remarquable | `z.<landmarkId>` | `z.grand-place` |
| Bâtiment généré | `b.<quartier>.<n>` | `b.centre.42` |
| Ambiant : personne, véhicule, arbre, objet | `a.p.<n>`, `a.v.<n>`, `a.t.<n>`, `a.o.<n>` | `a.p.1203` |
| Personnage d'enquête | `<caseId>.<nom>` | `c01.gaston` |
| Entité d'enquête | `<caseId>.<nom>[.<n>]` | `c01.gaston.2`, `c01.sac` |
| Zone d'enquête | `<caseId>.zone.<nom>` | `c03.zone.ruelle` |

Les ids d'enquête sont **stables** : la sauvegarde s'appuie dessus.

## 6. Interface, URL et débogage

- Navigation par état interne (pas de routeur d'URL) ; paramètres lus au démarrage :
  `?debug`, `?ui=0`, `?x=&y=&zoom=`, `?case=<id>`.
- `?debug` expose `window.__haystack = { world, map, cases, session }` et affiche les coordonnées monde.
- Chaque page signale `window.__haystackReady = true` une fois le premier rendu terminé (`map.whenIdle()`).
- Pages de développement (non publiées) : `dev/gallery.html` (catalogue graphique), `dev/map.html` (carte brute
  avec grille de coordonnées et ids).

## 7. Sauvegarde

`SaveData` (voir `src/types.ts`) en JSON dans `localStorage['haystack:v1']`. En navigation privée ou si le
stockage est indisponible, repli en mémoire (la partie fonctionne, sans persistance).

## 8. Journal des changements de contrat

| Date | Fichier | Changement | Par |
|---|---|---|---|
| 2026-10-14 | tous | Version initiale | orchestrateur |
