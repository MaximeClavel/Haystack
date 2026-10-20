# Phase 3 — Correcteur 2 : moteur (marges de l'interface dans les bornes de la caméra)

Périmètre : `src/engine/camera.ts` (+ `camera.test.ts`), `src/engine/mapView.ts`, `constants.ts`, `index.ts`, `README.md` du moteur, et l'endroit unique qui
transmet les marges : `src/ui/mapHost.ts` (`setInsets`). Verdict : `scratchpad/fix/g-gestes-et-camera.json`, id `g-defilement-bas-masque-par-panneau-c03` ;
prototype de référence : `scratchpad/fix2/` (relu, non recopié : voir « Écarts »).
Aucun contrat touché (`src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts`) : `setInsets` est une méthode de `EngineMapView`
(propre au moteur, comme `debugStats`), pas de `MapView` ; donc rien à consigner au « Journal des changements de contrat ». Aucune dépendance, rien de commité,
pas de `content:doc`. `Investigation.tsx` et `Explore.tsx` ne sont **pas modifiés** : ils appellent déjà `host.measureInsets(...)` à chaque rendu et au
redimensionnement, qui aboutit à `host.setInsets` (seul point modifié côté interface).

## Appliqué

| Id | Changement |
|---|---|
| `g-defilement-bas-masque-par-panneau-c03` | **Cause** : `clampCamera` bornait la caméra comme si tout l'écran était libre. Avec `EDGE_MARGIN` = 0,2 de l'écran (169 px à 844 de haut) plus petit que le panneau (177–339 px) et, surtout, quand la ville tient presque en hauteur (zoom ≈ 0,10–0,25) `centerRange` verrouille le centre : la rive sud (y 3860–4650 : Q4 à Q6 de c03, bateau de c05 Q7) restait sous le panneau, le haut de la ville sous la barre haute, et le glissé vertical « ne faisait rien ». **Correctif** : les marges de l'interface comptent dans les bornes. |

Détail :

1. `camera.ts` — `export interface ScreenInsets { top, bottom, left, right }` et un 7e paramètre **optionnel** `insets?: ScreenInsets` pour `clampCamera`. Avec marges, les
   bornes se calculent dans la **zone libre** : `centerRange(fh / zoom, …)` (idem en x), et le centre testé est celui de la zone libre (décalage `(haut − bas) / 2 / zoom`,
   `(gauche − droite) / 2 / zoom`, le même que `mapHost.cameraFor`). Le débord de 20 % et le verrouillage « ville entière » s'appliquent donc à la hauteur libre, centrés au
   milieu de la zone libre. Sans `insets`, ou marges toutes nulles/invalides, **le calcul d'origine est exécuté tel quel** (branche dédiée : résultat identique au bit près,
   y compris dans la boucle d'images). Un axe où les marges ne laissent pas 1 px est ignoré ; marges négatives, `NaN` ou infinies comptent pour 0 ; un centre déjà dans les
   bornes est rendu exactement (pas d'aller-retour arrondi).
2. `mapView.ts` — `EngineMapView.setInsets(insets)` ; l'état `safe` est passé à `clampCamera` dans `applyCamera`, `resize` et (but final, `safeGoal`) `startFlight`.
   Marges identiques (à 0,5 px près : rectangles décimaux de `getBoundingClientRect`) : ne fait rien — important, `measureInsets` est rappelé à chaque rendu d'`Investigation`.
3. `mapHost.ts` — `setInsets(top, bottom, left, right)` appelle aussi `map.setInsets(insets)`. Ainsi toute la chaîne existante (Investigation, Explorer, Accueil qui remet 0/0,
   démontage des écrans) alimente les bornes sans autre changement.
4. **Glissement des bornes** (adoucit le risque (1) du verdict, 36 px de saut quand la fiche d'indice se replie au premier contact avec la carte) : quand un changement de marges
   met la caméra hors des nouvelles bornes, ce sont les **bornes** (et non la caméra) qui glissent de l'ancienne vers la nouvelle marge en `INSETS_GLIDE_MS` = 180 ms
   (`easeOutCubic`), la caméra étant simplement repoussée à chaque image. Aucune animation de caméra n'est lancée, donc aucun conflit avec un glisser, un pincement, une
   inertie ou un vol en cours (voir « Écarts »). Si la caméra reste dans les nouvelles bornes (cas courant), elles s'appliquent tout de suite, sans image supplémentaire.
   Mouvement réduit : application immédiate. `whenIdle()` attend la fin du glissement (≤ 180 ms) ; l'animation des bornes n'est pas comptée comme « mouvement » pour les
   appuis (`stopMotion`) : un appui pendant le glissement reste un vrai tap.
5. Documentation : `src/engine/README.md` (§ « Caméra et bornes »), commentaires.

## Écarté / hors périmètre

- `g-double-toucher-zoom-variable-c01`, `g-rapprochez-vous-bateau-decale-c02`, `g-rapprochez-vous-cible-deplacee-c03` : verdict « aucun correctif » (comportements voulus).
- Reportés par la décision de l'orchestrateur : `g-seuil-designation-sans-tolerance` (seuil `PICK_MIN_ZOOM`), `g-retap-pendant-le-vol-avale`.
- `src/ui/README.md` (ligne « Désignation / marges ») non modifié : hors périmètre ; à compléter à l'intégration si souhaité (« les marges bornent aussi la caméra »).

## Écarts par rapport au prototype `scratchpad/fix2/`

- Le prototype ré-appliquait la caméra **sur place** dans `setInsets` (saut de 36 px) ; la version livrée fait glisser les bornes (voir 4). Un premier essai par un vol de caméra
  de 180 ms (recommandation du verdict) s'est révélé **sans effet** : chaque image du vol est elle-même bornée par les nouvelles marges, donc la caméra atteignait la butée dès
  la première image (mesuré : saut immédiat de 192 u). D'où le glissement des bornes. Il a aussi l'avantage de ne jamais lutter contre le doigt.
- Le prototype n'avait ni tests (les « deux cas » du verdict n'étaient pas dans la copie) ni README : ajoutés (voir ci-dessous).

## Vérifications

- `npx tsc --noEmit` : propre. `npx vitest run` : tous les tests passent (17 fichiers, dont `camera.test.ts` : 27 tests, **11 nouveaux** sur les marges). `npm run content:check` : « OK : aucun problème ».
- **Tests unitaires** (`camera.test.ts`, bloc « bornes avec les marges de l'interface ») : résultat identique sans marges (absentes, `undefined` ou nulles) sur 24 caméras ; bord sud
  au-dessus du panneau et bord nord sous la barre à **tous** les zooms (minimal, 0,1, 0,15, 0,188, 0,2, 0,25, 0,3, 0,5, 1, 2, 4) sur 390 × 844 (panneau 224 px, Q4 de c03) et 412 × 915
  (177 px) ; régression : sans marges, vers 0,19, la rive sud reste > 100 px sous le panneau ; débord = 20 % de la **zone libre** ; zoom minimal : ville centrée dans la zone libre
  (centre verrouillé) ; **monde plus petit que la zone libre** (centré, quelle que soit la caméra demandée, puis défilement dès qu'il dépasse) ; **marges asymétriques** (gauche 100, droite 20,
  haut 10, bas 300 : une limite par côté) ; caméra dans les bornes inchangée, idempotence ; axe sans place (marges ≥ hauteur) ignoré, marges négatives/`NaN`/infinies = 0 ;
  zoom borné, `NaN` → centre du monde.
- **Vrai jeu** (Chromium, tactile CDP, serveur Vite 5183, c03 ; scripts hors dépôt dans `scratchpad/corr2-moteur/`) :
  - 390 × 844 : trois pincements ×0,5 (zoom 0,188) puis glissés vers le haut : avant, `y` figé à 2400 ; après, la caméra monte à `y = 4138` (butée), bord sud de la ville à **546 px** pour un
    panneau dont le haut est à 667 px ; retour au nord : bord nord à 183 px (> barre haute, 62 px). Balayage de 12 zooms (0,061 → 4) : `southOk` et `northOk` partout.
  - 412 × 915 : même parcours, butée `y = 3900`, bord sud à 626 px (panneau : 738 px), nord 174 px ; 12 zooms ok.
  - Panneau replié (151 px) / déplié (177 px) / fiche d'indice dépliée (268 px) : butée sud à 566, 546 et 473 px (toujours au-dessus du panneau). Repli de la fiche au contact de la carte
    avec la caméra à la butée : la caméra glisse de 192 u (36 px) en ≈ 150 ms, sans saut (avant correction du glissement : un seul pas).
  - Écran Explorer (390 et 412) : glisser/pincer normaux ; minicarte ouverte (marge haute 62 → 210 px) sans effet à zoom 1 ; au zoom d'ensemble la ville est centrée dans la zone libre.
  - Départ du bonus (vue d'ensemble 0,22 / 0,238, centre 2850, 2100) : **identique** à la caméra demandée (marges mesurées 62 / 213 px).
  - Aucune erreur console / de page.
- `node scripts/perf-map.mjs --gestures` : **30/30** contrôles réussis (glisser, inertie, pincer, double-tap, tap, bornes, molette, clavier…).
- `node scripts/perf-map.mjs` (la page de dev n'appelle pas `setInsets` : chemin sans marges) : ×1, **p95 16,8 ms** (objectif < 20 ms atteint ; phase 2 : 16,7–16,8). Comparaison A/B
  entrelacée sur la même machine (copie du dépôt avec les fichiers du moteur de `HEAD`, 2 passes chacun) : ×1 TOTAL p95 16,8 / 16,8 ms (base) contre 16,8 / 16,8 ms (corrigé) ; ×4 TOTAL p95
  66,7 / 66,7 ms contre 66,7 / 66,7 ms. (Le ×4 est plus bruité que dans le journal de phase 2, 50 ms, parce que d'autres agents chargent la machine en même temps : les deux variantes le
  sont autant.) Aucune régression.
- **E2E complet** : `E2E_PORT=5183 npx playwright test` → **36 réussis** (4,1 min) : les 33 tests existants (dont c00 → c05 et le bonus résolus au doigt, explorer, minicarte, gestes) + les 3 nouveaux
  de `09-camera-marges.spec.ts`. Un premier passage sur les 33 tests existants, avant l'ajout du spec 09, avait déjà donné 33/33. Vérification de sensibilité : en neutralisant l'appel
  `map.setInsets(insets)` de `mapHost.ts`, les trois tests du spec 09 échouent (bord sud à 782 et 816 px pour un panneau à 668 px ; saut de caméra absent) ; remis en place ensuite.

## Test de bout en bout ajouté

`tests/e2e/09-camera-marges.spec.ts` (nouveau fichier, ligne ajoutée à `tests/e2e/README.md`) : (1) c03, 390 × 844 et 412 × 915, 9 zooms de la vue d'ensemble à 4 : la rive sud passe au-dessus du
panneau et le nord sous la barre haute ; (2) trois vrais pincements puis glissés CDP : la rive sud est atteinte, puis le nord ; (3) un changement de taille du panneau fait glisser les bornes
sans saut de caméra (valeur identique juste après, puis butée de la nouvelle taille).

## Limites connues

- À la butée, le fond de « table » sombre apparaît entre le bord de la ville et le panneau (≈ 120 px à 844 de haut) : c'est le débord de 20 % existant, simplement placé au-dessus du
  panneau au lieu de dessous.
- Au zoom minimal (ville entière), la vue est centrée dans la zone libre et non plus dans l'écran entier : décalage vertical de ≈ 57 px de la vue d'ensemble en enquête.
- Sur l'écran Explorer, l'ouverture de la minicarte augmente la marge haute (62 → 210 px) : au zoom d'ensemble, quand la ville tient, elle glisse d'autant (180 ms) vers le bas, et revient à la
  fermeture. Sans effet aux zooms de jeu. Même mesure que celle déjà utilisée par `freeWorldRect` / `cameraFor`.
- Quitter une enquête remet les marges à 0 : une caméra posée contre la butée sud (bord de la ville dans la zone libre, hors des bornes « écran entier ») est ramenée en 180 ms ; l'écran suivant
  lance en général son propre vol (Accueil, Explorer), qui prend le relais.
- `computeMinZoom` reste calculé sur l'écran entier : le zoom minimal ne change pas (aucune modification des gestes ni de `MIN_ZOOM_FLOOR`).

## Revérification (second passage sur `HEAD` d57a900)

Le correctif était déjà appliqué et commité (`camera.ts`, `mapView.ts`, `constants.ts`, `index.ts`, `mapHost.ts`, `camera.test.ts`, `README.md`, `09-camera-marges.spec.ts`) ; ce passage n'a
modifié aucun code : seulement relu et remesuré, sur une copie de travail propre (`git status` vide au départ).

- `npx tsc --noEmit` : propre. `npx vitest run` : 17 fichiers, **362 tests** passés. `npm run content:check` : « OK : aucun problème ».
- `node scripts/perf-map.mjs --gestures` : **30/30**. `node scripts/perf-map.mjs` : ×1 **p95 16,8 ms** (objectif < 20 ms, phase 2 : 16,7–16,8), 4 images > 33 ms sur 1482 ;
  ×4 p95 66,7 ms (même valeur qu'aux mesures A/B ci-dessus).
- Vrai jeu, c03, zoom 0,188, caméra poussée vers le sud (`y` demandé 99999) : 390 × 844 → `y` = 4139,8, bord sud de la ville à 546 px pour un panneau dont le haut est à 667 px ;
  412 × 915 → `y` = 3908,9, bord sud à 625 px (panneau : 738 px). Capture : `.shots/moteur-sud-390x844.png` (brouillon, non conservé). Mêmes valeurs qu'au premier passage.
- `E2E_PORT=5183 npx playwright test` : **36 réussis** (4,3 min), dont les 3 de `09-camera-marges.spec.ts`.
