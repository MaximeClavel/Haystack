# Phase 1 — agent `engine` : moteur de carte

Périmètre : `src/engine/**`, `dev/map.html`, `src/dev/map.ts`, `scripts/perf-map.mjs`
(+ captures `docs/screenshots/engine-*.png`). Documentation détaillée : `src/engine/README.md`.

## Ce qui a été fait

- **`createMapView(opts)`** (`src/engine/mapView.ts`) conforme au contrat `MapView` de `src/types.ts`,
  enrichi de `debugStats()` et `invalidateTiles()` (type `EngineMapView`).
- **Caméra** (`camera.ts`, pur) : conversions écran ↔ monde, zoom ancré, bornes (zoom minimal =
  ville entière, plancher `MIN_ZOOM_FLOOR`, max `MAX_ZOOM` ; centre borné avec un débord de 20 %
  de l'écran qui s'annule continûment quand la ville tient à l'écran), cadrage d'un rectangle.
- **Gestes** (`gestures.ts`, pur, + branchement Pointer Events dans `mapView.ts`) : glisser avec
  inertie (décroissance exponentielle exacte, indépendante de la cadence), pincer ancré au milieu des
  doigts avec déplacement simultané, tap différé de 220 ms (seuils 8 px / 300 ms), double-tap
  (zoom ×2 animé au point touché), double-tap glissé (zoom à un doigt), tap à deux doigts (÷2),
  molette lissée ancrée au curseur, pincement du pavé tactile (`ctrlKey`), défilement horizontal,
  flèches et `+`/`-`. `onCameraChange` au plus une fois par image.
- **Animations** (`flight.ts`, pur) : `flyTo` sur le log du zoom avec `easeInOutCubic`, dézoom
  intermédiaire si la cible est hors de vue, centre pondéré par 1/zoom (un zoom vers un point garde
  ce point fixe), durée fonction des doublements de zoom et de la distance ; `fitRect` ; mouvement
  réduit = instantané.
- **Tuiles** (`tiles.ts`, pur ; `render.ts`, `tileManager.ts`) : niveaux entiers de −4 (ville entière
  sur téléphone) à 2 ; rendu interruptible (sol puis entités par paquets, finalisation reportée si le
  budget manque) ; OffscreenCanvas + `transferToImageBitmap` (une seule surface de travail), repli
  canevas DOM ; cache LRU borné avec niveau racine épinglé ; libération (`close()` / largeur 0).
- **Ordonnanceur** : racine d'abord, puis (pendant un vol) la destination, puis le visible du centre
  vers les bords ; préchargement parent + anneau quand tout est calme ; budget 8 ms (5 ms en geste) ;
  boucle `requestAnimationFrame` arrêtée au repos (vérifié : 0 image en 500 ms).
- **Composition sans trou** : tuile prête, sinon ancêtre agrandie + descendants prêts ; bords au pixel
  réel (aucun liseré) ; table et ombre autour de la ville.
- **Overlays** (`overlays.ts`) : projecteur, anneaux et cadres (5 styles, `reveal` pulsant seul animé),
  fil rouge incurvé avec punaises dorées, punaise du joueur avec étiquette.
- **`renderSnapshot`** (rendu direct, rectangle élargi au format du canevas) et **`whenIdle`**.
- **Page `dev/map.html`** : carte plein écran de `buildWorld({ cases: CASES })`, HUD (x, y, zoom,
  niveau, images/s, durée d'image, tuiles en cache/épinglées/rendues/en attente, durée de rendu),
  `?x=&y=&zoom=`, `grid=1|<pas>`, `ids=1` (zoom ≥ 2), `demo=1` (overlays), `hud=0`, `cases=0`,
  `reduced=1` ; tap → point monde + entité la plus en avant (encadrée) ;
  `window.__haystack = { world, map, taps, cameraChanges }` ; `__haystackReady` après `whenIdle()`.
- **`scripts/perf-map.mjs`** : parcours scripté sur Pixel 7 émulé (CDP `Input.dispatchTouchEvent`),
  CPU ×1 et ×4 ; mode `--gestures` : 30 contrôles fonctionnels des gestes.
- **Tests Vitest** : 64 tests (`camera`, `tiles`, `lru`, `flight`, `gestures` + inertie).

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Choix du niveau | plus petit `L` tel que `zoom / 2^L ≤ 1,15` (tuile affichée entre ×0,58 et ×1,15) | net (on réduit plutôt qu'on agrandit) sans payer 4× plus de tuiles pour 15 % d'agrandissement imperceptible |
| Niveau racine | niveau du zoom minimal, abaissé si > 16 tuiles (grand écran) ; épinglé | repli universel peu coûteux (4 tuiles sur téléphone, 12 en paysage) |
| Tap | émis 220 ms après le lâcher ; un appui ailleurs le confirme aussitôt ; un appui qui stoppe une inertie n'est pas un tap | ne pas confondre avec un double-tap ; « toucher pour arrêter » ne désigne rien |
| Finalisation des tuiles | `transferToImageBitmap` hors budget restant → reportée à l'image suivante | c'est là que la rastérisation différée a lieu (mesuré : ~40 % du coût d'une tuile) |
| Préchargement | borné à la capacité du cache, tuiles conservées « touchées » | la première version préchargeait au-delà de la capacité et tournait sans fin (186 tuiles rendues au repos) — corrigé |
| Vol | tuiles de la destination prioritaires | arrivée nette, pas de rendu gaspillé sur des niveaux transitoires |
| Composition | table/ombre/découpe seulement si la ville ne couvre pas l'écran ; papier seulement avant la racine | remplissages plein écran coûteux sans GPU (glisser ×4 : p95 33 → 17 ms) |
| Hors de la ville | « table » sombre `#2b2622` + ombre de la carte | la ville est une affiche posée sur une table (pas de vide blanc) |
| Clavier | écouteur sur `window`, actif si le focus est sur la carte ou `body` | ne pas voler les touches d'un champ de saisie |
| Construction | aucun rappel (`onCameraChange`) avant le retour de `createMapView` | l'appelant référence souvent l'objet renvoyé dans ses rappels |

Aucun changement de contrat (`src/types.ts`, `src/config.ts`, `bounds.ts`, `layoutSpec.ts` intacts).

## Mesures

Machine : 4 cœurs, Chromium headless **sans GPU** (SwiftShader), d'autres agents actifs en parallèle ;
Pixel 7 émulé (412 × 839, densité moteur 2). Art « réel » en cours de finition, 8 305 entités.

| Ralentissement | images | p50 | p95 | max | > 33 ms | JS moteur p95 / max |
|---|---|---|---|---|---|---|
| ×1 | 1 471 | 16,7 ms | **16,8 ms** | 83 ms | 2 | 9,1 / 22,5 ms |
| ×4 | 1 084 | 33,3 ms | 66,7 ms | 333 ms | 408 | 22,2 / 125 ms |

Objectif sans ralentissement (p95 < 20 ms) **atteint**. Par phase à ×1 : glisser, pincer, double-tap,
vols, ville entière : p95 16,7–16,8 ms. Rendu d'une tuile : 6,7 ms en moyenne (dont ~40 % de
finalisation), 30–50 ms au plus (cumulé sur plusieurs images) ; à ×4, ~35 ms en moyenne.

À ×4, le glisser reste fluide (p95 16,8 ms) mais pincer et vols tombent à 30 images/s : un simple
déplacement sans aucun rendu de tuile (1 ms de JS) y donne déjà p50 = 33 ms à densité 2 contre
16,7 ms à densité 1 — le coût est la composition du canevas plein écran par le GPU logiciel du
conteneur, hors du moteur. Sur un téléphone réel, cette composition est faite par le GPU.

## Limites connues

- Mesures pessimistes (GPU logiciel) et bruitées (charge des autres agents) : à refaire sur un vrai
  téléphone et après la finition de l'art (`node scripts/perf-map.mjs`).
- Unités indivisibles : la finalisation d'une tuile (rastérisation) et `drawGround` ne se découpent
  pas ; la première utilisation d'une texture du module art à une résolution donnée a un coût
  ponctuel. Ce sont les pointes restantes (JS max 22 ms à ×1).
- Levier non utilisé : une densité de rendu adaptative (1,5 au lieu de 2 sur appareil lent) diviserait
  presque par deux le coût de composition ; à envisager en phase 2 si un vrai téléphone le justifie
  (il faudrait l'exposer via une méthode ou un réglage, le contrat ne le prévoit pas).
- Plusieurs projecteurs qui se chevauchent : l'intersection des trous reste voilée (règle nonzero) ;
  un seul projecteur à la fois est prévu par le jeu.
- `renderSnapshot` de la ville entière dessine toutes les entités (quelques dizaines de ms) : pour une
  minicarte, le faire une fois et garder l'image.
- Le zoom par molette suppose qu'un défilement vertical est une molette (un défilement vertical au pavé
  tactile zoome au lieu de déplacer — convention des cartes en ligne).
- Observation pour `world` : certaines entités touchent le bord du monde (ex. `a.p.740` en y = 3,6) ;
  le moteur découpe le dessin au bord de la ville, elles apparaissent coupées.

## Notes pour l'interface (phase 2)

- Le canevas doit être dans un conteneur dimensionné ; le moteur lui donne `width/height: 100%`,
  `touch-action: none`, `tabindex=0`.
- `onTap` arrive ~220 ms après le lâcher : prévoir un retour visuel immédiat si besoin (ex. anneau
  `select` posé dans `onTap`). Sous `PICK_MIN_ZOOM`, c'est à l'interface de transformer le tap en
  `flyTo` (le moteur ne fait que signaler le tap).
- Une animation interrompue (geste du joueur, autre `flyTo`) **résout** sa promesse.
- `setReducedMotion(settings.reducedMotion)` au démarrage (défaut : animations actives).

## Comment vérifier

```bash
npx vitest run src/engine                                  # 64 tests
node scripts/perf-map.mjs --gestures                       # 30/30 contrôles de gestes (Playwright)
node scripts/perf-map.mjs                                  # performance ×1 et ×4 (≈ 4 min)
node scripts/shot.mjs "/dev/map.html" .shots/ville.png     # ville entière
node scripts/shot.mjs "/dev/map.html?x=780&y=1700&zoom=2.5&ids=1" .shots/ids.png
node scripts/shot.mjs "/dev/map.html?x=780&y=1700&zoom=1.6&demo=1&hud=0" .shots/overlays.png
```

Captures conservées : `docs/screenshots/engine-ville-entiere.png`, `engine-zoom05-grille.png`,
`engine-zoom25-ids.png`, `engine-zoom4.png`, `engine-overlays.png`, `engine-repli-pincement.png`
(capture au milieu d'un pincement rapide à CPU ×4 : tuiles nettes et ancêtres agrandies, aucun trou).
