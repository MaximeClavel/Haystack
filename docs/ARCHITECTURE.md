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
| `tools/content` | Outils des scénaristes : contrôle, génération de `docs/CONTENT.md`, aperçu, sonde (non publiés) | world, game, engine, content | `preview` : oui |

Chaque module a son README détaillé : `src/art/README.md`, `src/world/README.md`, `src/engine/README.md`,
`src/game/README.md`. Ce document ne reprend que ce qui sert à les assembler.

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

1. La caméra `{x, y, zoom}` détermine un **niveau de tuiles** `L` entier : le plus petit `L` tel que
   `zoom / 2^L ≤ 1,15` (une tuile est affichée entre ×0,58 et ×1,15), borné entre le niveau de la ville
   entière (−4 sur téléphone) et `L = 2` (zoom 4). Le niveau de la ville entière (ou plus bas sur grand
   écran) est la **racine** : rendue en premier, épinglée dans le cache, repli universel.
2. Une tuile couvre `TILE_SIZE / 2^L` unités monde (256 px CSS × `min(devicePixelRatio, MAX_DPR)`).
   Entités par tuile (monde actuel, ≈ 8 280 entités avec les enquêtes) : ~2 100 en moyenne au niveau −4, 74 au niveau −1,
   23 au niveau 0, 7 au niveau 1, 3 au niveau 2.
3. Rendu d'une tuile : fond `PAPER` → `drawGround(ctx, world.ground, rect, lod)` → pour chaque entité de
   `world.index.query(rect)` (déjà triées) : `drawEntity(ctx, e, lod)`. Le contexte est en coordonnées monde.
4. Les tuiles sont rendues **progressivement** (budget de 8 ms par image au calme, 5 ms pendant un geste ; une
   tuile est un travail interruptible : sol, puis entités par paquets de 8) et gardées dans un **cache LRU**
   borné (≈ 64–68 tuiles à densité 2). Une tuile manquante est remplacée par sa meilleure ancêtre prête
   (agrandie) et ses descendants prêts : jamais de trou.
5. Les **overlays** (`Overlay` : projecteur d'indice, anneaux, fil rouge, punaises) sont redessinés à chaque image
   par-dessus les tuiles.
6. Niveau de détail d'une tuile : `lodForZoom(2^L)` — `0` détail complet (zoom de rendu ≥ 1), `1` simplifié,
   `2` silhouettes (vue d'ensemble).

## 4. API des modules (exports réels)

### `src/art/index.ts`
- `type Lod = 0 | 1 | 2`, `lodForZoom(zoom): Lod` (0 si zoom ≥ 1, 1 si ≥ 0,3, 2 en dessous).
- `PAPER` (couleur du papier), `INK`, `COLOR_HEX: Record<Color, string>`, `COLOR_NAME_FR` (noms français des
  14 couleurs, pour les textes du jeu).
- `drawGround(ctx, ground, view: Rect, lod)`, `drawEntity(ctx, e: Entity, lod)`.
- `drawPortrait(ctx, appearance, cx, cy, size)` : buste d'un personnage (carnet).
- ré-exporte depuis `bounds.ts` : `getEntityBounds`, `getHitRect`, `sortKey`, `compareDrawOrder`,
  `buildingVisibleRect`, `personSize`, `PROP_SIZE`, `VEHICLE_SIZE`, `FLAT_PROPS`, `TREE_WIDTH_RATIO`,
  `BUILDING_TOP_EXTRA`.

### `src/world/index.ts`
- `buildWorld({ seed?, cases? }): World` — déterministe. Le monde **ambiant** d'une graine est généré une fois
  puis mis en cache (`ambientWorld(seed)`) ; chaque appel renvoie des **copies** des entités (le `World` obtenu
  peut être modifié). La foule ambiante est générée **indépendamment** des enquêtes puis filtrée (retrait de ce
  qui chevauche une scène, marge 6 u) : ajouter une enquête ne déplace pas le reste.
- Aucun passant ambiant ne doit être un **sosie** d'un personnage scénarisé (moins de 3 attributs saillants
  d'écart → modifié de façon déterministe).
- Chaque lieu de type `area` produit une zone désignable d'id `z.<landmarkId>` (ex. `z.parc`).
- Utilitaires **purs** (aussi utilisés par `game/validate` et `tools/content`) :

| Fonction | Rôle |
|---|---|
| `groundAt(world, p): GroundKind` | Sol exact au point (dernière forme dessinée qui le contient) |
| `isWalkable(world, p)` | Faux hors du monde, dans l'eau (hors pont, quai, ponton) et dans l'emprise d'un bâtiment ; la chaussée est praticable |
| `buildingAt(world, p)` | Bâtiment dont l'emprise au sol contient p |
| `onCrosswalk(world, p)` | p est-il sur un passage piéton ? |
| `isHiddenByRoof(world, p)` | Le sol en p est-il caché par le toit d'un bâtiment plus au sud ? |
| `entitiesAt(world, p, tol)` | Entités dont le rectangle de désignation contient p, de la plus en avant à la plus en arrière |
| `appearanceDistance(a, b)`, `SALIENT_KEYS` | Nombre d'attributs saillants différents entre deux apparences |
| `findFreeSpots(world, rect, opts)` | Points libres, praticables, hors chaussée et visibles (placement des scènes) |
| `worldMeta(world)` | Métadonnées hors contrat : rues (noms, géométrie), îlots, emplacements, comptes de retraits et d'« anti-sosies » |
| `ambientWorld(seed)` | Monde ambiant brut (sans enquêtes), en cache |

### `src/engine/index.ts`
- `createMapView(opts: MapViewOptions): EngineMapView` — implémente `MapView` (voir `src/types.ts`) et ajoute :
  - `debugStats(): MapDebugStats` — tuiles en cache / épinglées / capacité, rendues, abandonnées, en attente,
    durée moyenne et maximale d'une tuile (dont finalisation), niveau affiché / minimal / racine, images/s,
    durée de la dernière image, densité, `offscreen` ;
  - `invalidateTiles()` — oublie toutes les tuiles (si le monde a été modifié) ; elles sont refaites
    progressivement ;
  - `setInsets({ top, bottom, left, right })` — marges masquées par l'interface (barre haute, feuille du bas) :
    les bornes de la caméra se comptent dans la zone libre, de sorte que la rive sud de la ville se remonte
    toujours au-dessus du panneau de question (appelée par `mapHost.setInsets`, donc par chaque écran).
- Fonctions pures de caméra : `computeMinZoom`, `clampCamera` (7ᵉ paramètre facultatif : les marges),
  `screenToWorld`, `worldToScreen`, `visibleWorldRect`, `zoomAround`, `fitRectCamera` (+ type `ScreenInsets`) ;
  `BACKDROP` (couleur de la « table » autour de la ville), `MARK_STROKE` (couleurs des styles d'anneau, pour
  l'interface).
- `onTap` est émis ≈ 220 ms après le lâcher (attente d'un éventuel double-tap). Sous `PICK_MIN_ZOOM`, c'est à
  l'interface de transformer le tap en `flyTo`. Une animation interrompue **résout** sa promesse.

### `src/game/index.ts`
- `pickAt(world, point, zoom): Pick` — entité sous le doigt : contact exact avec `getHitRect` préféré, sinon
  tolérance `PICK_TOLERANCE_PX / zoom` (`pickTolerance(zoom)`) ; à égalité, la plus en avant dans l'ordre de
  dessin. **Exception « décor »** : si l'entité touchée exactement est un **bâtiment** et qu'une entité
  non-bâtiment dessinée devant lui est à portée de tolérance, c'est elle qui est désignée (un doigt qui frôle
  un passant devant une façade vise le passant). Une réponse « bâtiment » reste acceptée par `submit`
  (correspondance par la façade). `pickAt` ne renvoie jamais une zone.
- `new CaseSession(def, world, progress?, opts?)` — `opts.now` : horloge injectable (défaut `Date.now`).
  Méthodes : `openSteps()`, `solvedSteps()`, `isStepUnlocked/isStepOpen/isStepSolved(id)`, `getStep(id)`,
  `stepProgress(id)`, `submit(stepId, pick)` (`correct` / `near` / `already` / `wrong` ; l'étape doit être
  ouverte, sinon erreur), `hint(stepId)` (niveaux 1 → 3), `currentHint(stepId)`, `threads()` (fils rouges des
  étapes résolues), `foundMarks()`, `isSolved()`, `stars()`, `totals()`, `begin()`, `addPin/removePin/pins`,
  `setNotes/notes`, `progress()` (copie JSON). Une progression reprise est copiée et nettoyée.
- `entityCenter(world, id): Vec2` (entité ou zone ; erreur si inconnu) ; variantes tolérantes `targetCenter`,
  `targetRect`, `targetExists`.
- `createSaveStore(storage?, key?)` → `{ load(), save(data), reset(), isPersistent() }` (localStorage, repli en
  mémoire, ne lève jamais) ; `defaultSave()`, `withCaseProgress(save, progress)`, `isUnlocked(def, save)`,
  `sanitizeSave`, `sanitizeCaseProgress`, `DEFAULT_SETTINGS`.
- `validateCase(def, world): string[]`, `validateAllCases(cases, world): string[]` — problèmes de contenu
  (messages en français), monde construit **avec** les enquêtes.
- Briques et constantes exportées : `computeStars`, `requiredOf`, `stepDependencies`, `matchTargets`,
  `newCaseProgress`, `STAR_RULES`, `AUTO_HINT_RADIUS`, `REVEAL_TEXT`, `MAX_PINS`, `MAX_NOTES_LENGTH`…

### `src/content`
- `index.ts` : `CASES: CaseDef[]` dans l'ordre d'affichage (c00 tutoriel, c01 à c05, bonus
  `bonus-aiguilles`). Une enquête par fichier : `src/content/cases/<id>.ts`.
- `common.ts` : éléments partagés (apparence du brigadier Picotin, personnage récurrent).
- `meta.ts` : métadonnées pour les outils (`LOOKALIKES` : sosies volontaires ; `RECURRING` : personnages
  récurrents, apparences identiques).
- Bible narrative et fiche de chaque enquête : `docs/CONTENT.md`, **générée** par `npm run content:doc` à partir
  du gabarit `tools/content/CONTENT.template.md` et du code des enquêtes.

### `tools/content` (outils des scénaristes, non publiés)
| Outil | Rôle |
|---|---|
| `check.ts` (`npm run content:check`) | `validateAllCases` + règles de la bible : hors chaussée, véhicules sur chaussée ou parking, 80 u entre enquêtes, écarts d'apparence, sosies ambiants, rayons d'indice, recouvrements, couleur d'un bas caché par un tablier / un manteau / une robe citée dans un texte (`hidden.ts`, module pur : les cibles sont jugées sur l'apparence que le monde dessine — celle du personnage quand l'entité en a un —, `drawnAppearance` / `casePeople` / `entityPeople` ; son `selfTest()` s'exécute à chaque `content:check`). Doit afficher « OK : aucun problème » |
| `gen.ts` (`npm run content:doc`) | Régénère `docs/CONTENT.md` (les signes distinctifs d'un bas caché y sont annotés « masqué … ») |
| `preview.html` / `preview.ts` | Aperçu des scènes dans la vraie ville (`only=`, `ids=`, `mark=`, `hint=`, `threads=`, `grid=`) |
| `probe.ts` | Sonde de placement : `npx tsx tools/content/probe.ts x,y …` |

## 5. Conventions d'identifiants

| Quoi | Format | Exemple |
|---|---|---|
| Bâtiment d'un lieu remarquable | `lm.<landmarkId>` | `lm.banque` |
| Objet remarquable (lieu de type `point`) | `lm.<landmarkId>` | `lm.fontaine`, `lm.statue`, `lm.kiosque` |
| Zone d'un lieu remarquable | `z.<landmarkId>` | `z.grand-place` |
| Bâtiment généré | `b.<quartier>.<n>` | `b.centre.42` |
| Ambiant : personne, véhicule, arbre, objet | `a.p.<n>`, `a.v.<n>`, `a.t.<n>`, `a.o.<n>` | `a.p.1203` |
| Personnage d'enquête | `<caseId>.<nom>` | `c01.gaston` |
| Entité d'enquête | `<caseId>.<nom>[.<n>]` (personnage : une entité par scène où il apparaît) | `c01.lafouine.2`, `c01.sac` |
| Zone d'enquête | `<caseId>.zone.<nom>` | `c03.zone.ruelle` |

Les ids d'enquête sont **stables** : la sauvegarde s'appuie dessus.

## 6. Interface, URL et débogage

- Navigation par état interne (pas de routeur d'URL), mais **le bouton Retour du système fonctionne** :
  l'historique du navigateur ne garde que deux entrées (« base » puis « cur ») ; un Retour est traité comme le
  bouton ‹ de l'interface (fermer le carnet / la feuille / la minicarte, sinon remonter d'un écran), puis « cur »
  est reposée ; depuis l'accueil, on laisse le navigateur quitter (`src/ui/App.tsx`). Paramètres lus au démarrage :
  `?debug`, `?ui=0`, `?x=&y=&zoom=`, `?case=<id>`.
- `?debug` expose `window.__haystack = { world, map, cases, session }` et affiche les coordonnées monde.
- Chaque page signale `window.__haystackReady = true` une fois le premier rendu terminé (`map.whenIdle()`).
- Pages de développement (non publiées) : `dev/gallery.html` (catalogue graphique, contrôle des emprises
  `?section=check`, mesure `?section=perf`), `dev/map.html` (carte brute : `grid=1`, `ids=1`, `demo=1`, `hud=0`,
  `cases=0`), `dev/overview.html` (ville entière ou sous-région), `tools/content/preview.html` (scènes des enquêtes).

## 7. Sauvegarde

`SaveData` (voir `src/types.ts`) en JSON dans `localStorage['haystack:v1']`. En navigation privée ou si le
stockage est indisponible, repli en mémoire (la partie fonctionne, sans persistance ; l'interface le signale
une fois par un toast et sur l'accueil).

- **Lire-modifier-écrire** : chaque modification repart du contenu réellement enregistré (`AppStore.update`) :
  un second onglet périmé n'écrase pas la progression de l'autre.
- **Réconciliation au démarrage** (`reconcileSave`, module game) : chaque progression est recalculée par
  `CaseSession` d'après les enquêtes publiées (étapes ajoutées, réponses retirées…), pour que la liste des
  dossiers, le déblocage et l'enquête ouverte disent la même chose.
- **« Résolue au moins une fois »** : `CaseProgress.bestStars` (meilleur résultat) est conservé quand on
  recommence une enquête ou qu'elle redevient active ; `hasSolved` / `isUnlocked` en tiennent compte, donc
  recommencer ne reverrouille pas les enquêtes suivantes.

## 8. Journal des changements de contrat

| Date | Fichier | Changement | Par |
|---|---|---|---|
| 2026-10-14 | tous | Version initiale | orchestrateur |
| 2026-10-14 | — | Phases 1 et 2 (intégration) : **aucun changement**. Contrôlé par `git log` : `src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts` sont identiques depuis la phase 0. Les ajouts d'API (`EngineMapView.debugStats/invalidateTiles`, option `opts` de `CaseSession`, utilitaires du monde) sont propres aux modules, hors contrat. | integration |
| 2026-10-15 | `src/types.ts` | **Ajouts facultatifs (rétro-compatibles), aucun champ modifié ni retiré** : `CaseProgress.bestStars?: 1 \| 2 \| 3` (meilleur résultat des parties terminées ; sa présence = « résolue au moins une fois », pour que recommencer ne reverrouille pas les enquêtes suivantes) ; `StepDef.label?: string` (libellé court de l'onglet quand plusieurs questions sont ouvertes en parallèle). Les sauvegardes existantes restent valides (`bestStars` est déduit de `stars` d'une partie résolue). Côté code : `src/game` exporte `bestStarsOf`, `restartCaseProgress`, `hasSolved`, `reconcileSave` ; `validateCase` contrôle `label` (non vide, 24 caractères au plus). | correcteur |
| 2026-10-15 | `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts` | **Aucun changement.** (Le moteur gagne une constante interne `REVEAL_PULSE_MS` dans `src/engine/constants.ts`, non contractuelle.) | correcteur |
| 2026-10-20 | `src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts` | **Aucun changement** (phase 3, correcteurs 2 et intégration). Contrôlé par `git diff --stat 0d7fa04 HEAD` (début de la phase 3) puis `git diff --stat HEAD` sur ces quatre fichiers : vide. Ajouts propres aux modules, hors contrat : moteur — `EngineMapView.setInsets`, 7ᵉ paramètre facultatif de `clampCamera`, type `ScreenInsets`, constante `INSETS_GLIDE_MS` ; interface — `placeName(world, x, y, margin?)`, `placeCaptureMargin`, `investigation/texts.ts` ; monde — seulement des valeurs de contenu (`people.ts`, `names.ts`), même flux pseudo-aléatoire. | integration |
| 2026-10-20 | `src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts` | **Aucun changement** (phase 3, correcteurs 3 et intégration). Contrôlé par `git diff --name-only` sur l'arbre de travail : aucun de ces quatre fichiers. Ajouts propres aux modules, hors contrat : interface — `apostrophes()` et `districtName` (`format.ts`, affichage seulement : les noms du monde gardent l'apostrophe droite), `foundCountLabel` (`investigation/texts.ts`), prop `leftHanded` de `QuestionPanel`, jeton CSS `--hay-3` ; outils de contenu — `drawnAppearance`, `casePeople`, `entityPeople` (`tools/content/hidden.ts`). | integration |

## 9. Performance (mesures de référence)

Machine de développement : conteneur 4 cœurs, Chromium sans GPU (rendu logiciel, donc pessimiste pour la
composition), Pixel 7 émulé (412 × 839, densité 2). Détail et historique : `docs/journal/phase2-integration.md`.

| Mesure | CPU ×1 | CPU ×4 (téléphone moyen) | Outil |
|---|---|---|---|
| Intervalle d'image p50 / p95 (parcours : vols, glisser, pincer, double-tap) | 16,7 / 16,8 ms | 33 / 50 ms | `node scripts/perf-map.mjs` |
| Rendu moyen d'une tuile | ≈ 6 ms | ≈ 30 ms | idem |
| `buildWorld({ cases: CASES })` à froid | ≈ 210 ms | 860–950 ms (médianes) | `node scripts/perf-map.mjs --startup` |
| Premier rendu complet de la ville entière | ≈ 130 ms | 540–650 ms | idem |

Objectif sans ralentissement (p95 < 20 ms) atteint ; démarrage au ralenti ×4 ≈ 1,4 à 1,6 s (construction +
premier rendu), sous le seuil de 2 s. L'interface doit afficher un écran de chargement **avant** d'appeler `buildWorld`
(calcul synchrone d'environ 0,9 s sur un téléphone moyen).

## 10. Outils de vérification

| Commande | Rôle |
|---|---|
| `npm run typecheck`, `npm test` | Types, tests unitaires (monde, moteur, règles, contenu publié) |
| `npm run content:check` | Contrôle des enquêtes dans la vraie ville |
| `node scripts/shot.mjs "<chemin-url>" sortie.png [--width --height --dpr]` (ou `--batch fichier.json`) | Capture d'une page après `window.__haystackReady` |
| `node scripts/perf-map.mjs` (`--gestures`, `--startup`, `--rates 1,4`) | Fluidité, contrôles des gestes, durée du démarrage |
| `npm run world -- <cmd>` | Interroger le monde généré (voir `CLAUDE.md`) |
| `npm run e2e` (`E2E_PORT=<port>` pour plusieurs suites en même temps) | Tests de bout en bout Playwright, téléphone émulé (`tests/e2e/README.md`) |
| `node tools/playtest/blind.mjs start <id>` ; `node tools/playtest/selftest.mjs` | Joueur test aveugle (`tools/playtest/README.md`) ; vérification de l'outil (≈ 1 min) |
