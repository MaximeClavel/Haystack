# Phase 3 — agent `direction-artistique` : une ville belle, vivante et lisible

Date : 15/10/2026. Périmètre : `src/art/**`, `dev/gallery.html`, `src/dev/gallery.ts`
(+ ce compte rendu et les captures `docs/screenshots/da-*.png`).
**Aucun changement de contrat** : `src/art/bounds.ts`, `src/types.ts`, `src/config.ts` et
`src/world/layoutSpec.ts` sont inchangés ; `src/world`, `src/content`, `src/ui` et `src/engine` n'ont pas été touchés.

## Constat de départ (téléphone 390 × 844, densité 2)

Captures « avant » : ville entière, Grand-Place (zoom 2), marché des Halles (1,5), parc (1), port (2), gare (3),
jardins (0,6), scènes d'enquête c01, c02, c05 (2), faubourg, quartier des Arts, cimetière, chantier, hôpital, école,
église, entrepôts. Lues comme un directeur artistique de livre « cherche-et-trouve » :

| Défaut relevé | Où |
|---|---|
| Sols plats : herbe, cours, rues, place sont de grands aplats texturés identiques d'un bout à l'autre ; aucune vie au sol | partout |
| Cour d'école, trottoirs et places presque de la même teinte : on ne lit pas les îlots | vieille ville, faubourg |
| Eau « tapissée » : une texture régulière, bord net, pas de rive, de nénuphars ni de roseaux ; quais sans margelle ni bollards ; ponts sans ombre | étang, rivière, port |
| Arbres tous du même vert uniforme (la ville est pourtant en octobre) | parc, rues |
| Ombres incohérentes : ombre des bâtiments faible, ombre des arbres centrée, pas de liseré de lumière | partout |
| Toits : tuiles et ardoises d'un seul ton, grands toits plats presque nus, tôle des entrepôts sans relief | gare, port, centre |
| Façades « propres » : aucune gouttière, aucun pot de fleurs, linge, antenne, fumée, animal à la fenêtre ; commerces sans enseigne en drapeau | faubourg, centre |
| Vue d'ensemble : les toits voisins de même couleur se fondent en une tache | ville entière |
| Fenêtres éclairées : simple aplat jaune, peu de lumière | rues |

## Ce qui a été fait

### Sol (`groundDecor.ts`, nouveau ; branché dans `ground.ts`)
Décor posé forme par forme, **déterminé par la case de grille du monde** (hachage entier des indices de case :
aucun `Math.random()`, aucun état) : deux tuiles voisines recalculent exactement les mêmes détails, coupés par un
`clip` à la forme (ils ne débordent jamais sur la forme voisine). Marge de 28 u pour qu'un détail ancré hors tuile
(marelle de 25 u) y déborde correctement.
- taches de ton (sombres et claires, grandes ellipses translucides) sur herbe, parc, jardins, cours, sable, places,
  chaussées, parkings, quais (niveaux 0 et 1) ;
- détails fins (niveau 0) : tas de feuilles d'automne, touffes d'herbe, cailloux, taches d'huile, fissures,
  rapiéçages d'asphalte, flaques sèches et traces de roues sur le sable, **marelles à la craie** dans les cours ;
- eau : liseré de berge clair, traînées de courant (plus longues sur la rivière), **nénuphars fleuris** et **roseaux**
  à épis sur la rive de l'étang ; ombre des ponts sur l'eau ;
- quais : margelle de pierre, bande mouillée, **bollards avec des mouettes posées** (une sur cinq) ;
- quais de gare : bande jaune de sécurité le long de la voie ; places : cadre de pavés sombres et rosaces d'angle ;
- couleurs : trottoir un peu plus clair, cour un peu plus chaude (la cour se distingue maintenant de la place).

### Bâtiments (`building.ts`, `buildingParts.ts`, `patterns.ts`, `decor.ts` nouveau)
- **Lumière du nord-ouest** : ombre portée des bâtiments plus lisible (aplat de la teinte d'ombre standard au lieu
  de la teinte légère) et liseré sombre au pied du mur ; liseré clair sur les arêtes nord et ouest des toits ; ombre
  portée des stores sur la vitrine ; marche de seuil sous les portes de maison.
- **Toits** : tuiles et ardoises dont chaque pièce a son ton (motif de période 12 u et 16 u, toujours aligné sur le
  toit) ; grands toits plats à lés d'étanchéité, plaques de réparation et taches d'humidité, ombre de l'acrotère ;
  toits en tôle (garages, entrepôts) à deux pans : pan nord ombré, bandes translucides, faîtage brillant ;
  jusqu'à 12 équipements sur les très grands toits plats.
- **Fenêtres éclairées** : bas de vitre plus chaud et halo central.
- **Niveau 2 (vue d'ensemble)** : chaque bâtiment est cerné d'un contour sombre dont l'épaisseur suit l'échelle
  (≈ 0,6 px écran) ; les toits voisins de même couleur se distinguent de nouveau.
- **Vie des façades et des toits** (`decor.ts`, plan calculé une fois par bâtiment, graine distincte de celle du plan de
  façade) : gouttières, taches de crépi et traces de pluie sous les appuis, lierre ou vigne vierge rougissante, pots de
  fleurs de part et d'autre de la porte, lanterne, linge entre deux fenêtres, **chat à la fenêtre** (noir, gris ou
  blanc), **enseigne en drapeau** (bretzel pour les boulangeries, tasse pour les cafés, livre, fleur), antenne râteau
  ou parabole, lucarnes de toit, fumée de cheminée, **oiseaux sur le faîtage**. Dans la ville actuelle : 571 bâtiments
  décorés sur 786, dont 26 chats, 16 linges, 26 lierres, 63 pots, 43 lanternes, 284 cheminées qui fument.

### Arbres (`tree.ts`)
Variantes tirées de la graine de l'arbre (vert 58 %, orangé, doré, roux, pommier à pommes rouges, peuplier doré) avec
feuilles tombées au pied : le parc et les rues prennent leurs couleurs d'octobre. Ombre portée vers l'est, un peu plus
ample.

### Galerie (`src/dev/gallery.ts`)
- nouvelle planche `decor` (24 graines de maisons, immeubles, boutiques, boulangeries, cafés) ;
- contrôle d'emprise étendu : ≈ 20 200 rendus au lieu de 17 400 (360 bâtiments décorés sans détail d'enquête, 24 graines
  de chaque arbre à 5 tailles) ; le rapport donne maintenant la graine et les couleurs des bâtiments fautifs.

## Boucle « capture → critique → correction »

8 tours sur téléphone (390 × 844, densité 2), 12 vues de référence + vues ciblées (quai, gare, chat, linge, lierre,
10 emplacements des aiguilles du bonus, …). Les captures sont dans `.shots/` (brouillons) ; les comparaisons
conservées sont dans `docs/screenshots/da-*-avant-apres.png` (à gauche : avant ; à droite : après).

| Tour | Constat | Correction |
|---|---|---|
| 1 | Toits plats et façades sans relief ; ombres faibles ; aplats de toit | tuiles/ardoises variées, ombre de bâtiment, toits plats et tôle, fenêtres éclairées |
| 2 | Sols plats, eau « tapissée », quais nus | `groundDecor.ts` : taches, détails, rives, nénuphars, roseaux, margelles, bollards |
| 3 | Façades propres, pots/linge/chat absents ; taches de crépi à bords durs ; lierre maigre | `decor.ts` ; taches en ellipses douces ; lierre plus dense |
| 4 | Arbres uniformes ; peupliers toujours verts ; quai de gare sans bord | variantes d'automne ; bande jaune de sécurité (réutilise le calcul « bord contre une autre forme ») |
| 5 | Vue d'ensemble : toits voisins de même teinte indistincts ; stores sans ombre | contour niveau 2 ; ombre des stores |
| 6 | Débordement d'emprise (traces de pluie sous le soubassement, 0,25 u, 2 cas sur 576) | longueur bornée par le soubassement ; contrôle étendu pour le rattraper |
| 7 | Feuilles mortes dorées trop proches de l'aiguille du bonus ; décor sur des lieux d'enquête | palette de feuilles sans jaune ; règle de prudence du décor (voir ci-dessous) |
| 8 | Détails amusants manquants ; marelle jugée trop envahissante sur la place | enseignes en drapeau, mouettes sur les bollards, oiseaux de faîtage ; marelles réservées aux cours (poids réduit) |

## Indices d'enquête : aucune régression

- **Aucune couleur de vocabulaire** (vêtements, cheveux, chapeaux, objets tenus, véhicules, accessoires, objets
  d'enquête) n'a été modifiée : `palette.ts` n'est pas touché, `person.ts`, `held.ts`, `vehicle.ts`, `props.ts`,
  `skeleton.ts`, `personShapes.ts` non plus. Le test de distinction des couleurs (`palette.test.ts`) passe.
- Les seules entités dont l'apparence change sont des **bâtiments**, des **arbres** et le **sol** : aucun indice de
  `docs/CONTENT.md` n'y repose (vérifié par recherche : chats, pigeons, oiseaux, antennes, toits, cheminées, lierre,
  linge, enseignes, feuilles). Les deux lieux qui portent un détail d'enquête de façade (cinéma : affiches ; bijouterie :
  vitrine brisée) ne reçoivent aucun détail de façade ; les aiguilles du bonus sont sur la gare (z = 139), la statue du
  parc, etc. : styles non décorés.
- Sur les bâtiments ordinaires, le décor évite les fenêtres non « normales », les emplacements des graffitis, affiches,
  balcons et portes ouvertes ; il est testé (`decor.test.ts`).
- Les feuilles mortes évitent le jaune doré : l'aiguille dorée du bonus (10 emplacements) a été recapturée sur chacun,
  elle reste le seul éclat doré du sol. Chaque emplacement a été relu sur une planche contact.
- Tous les ids, positions et entités de `src/world` et `src/content` sont intacts : `npm run content:check` finit par
  « OK : aucun problème ».

## Vérifications

| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | passe |
| `npx vitest run` | **304 tests** (299 + 5 de `decor.test.ts`) |
| `npm run content:check` | « OK : aucun problème » |
| `npm run build` | passe |
| `dev/gallery.html?section=check` | **0 débordement** sur 20 214 rendus (17 394 avant l'extension du contrôle) |
| contrôle d'emprise des 5 124 rendus de **tous** les bâtiments et arbres de la vraie ville (3 niveaux) | **0 débordement** |
| `E2E_PORT=5181 npm run e2e` | 23 / 23 (voir ci-dessous) |
| `node scripts/perf-map.mjs` (CPU ×1) | p95 16,7 ms (objectif 20 ms, avant : 16,8) ; rendu moyen d'une tuile 7,4 ms (avant : 8,0) |
| `node scripts/perf-map.mjs` (CPU ×4) | p95 66,7 ms (identique) ; rendu moyen d'une tuile 39–41 ms (avant : 37,7–39,3 ; bruit ±10 %) |
| `window.__artPerf` (2 passes) | personne niveau 0 : 0,09–0,11 ms (avant 0,10–0,11) ; bâtiment niveau 0 : 0,56–0,60 ms (avant 0,50–0,56, bruit ±30 %) ; zoom 2 : 1,17–1,19 ms (avant 1,17–1,22) |

Le décor du sol n'a pas de coût mesurable : la plupart des formes sont des rectangles et le calcul se limite aux
cases de grille qui touchent la tuile (une dizaine par forme).

## Décisions

| Sujet | Choix | Raison |
|---|---|---|
| Détails du sol | hachage des indices de case, pas de table ni de graine | déterminisme et raccords de tuiles garantis sans état |
| Détails dans la forme | `clip` au chemin de la forme (mis en cache) | jamais de débord sur la forme voisine ; ordre de dessin du sol inchangé |
| Décor des bâtiments | plan calculé une fois (`layoutOf`), graine distincte | ne change ni fenêtres ni portes ; coût de dessin = quelques tracés groupés |
| Lieux d'enquête | pas de décor de façade sur un `lm.*` avec `features` ; évitement des emplacements des features ailleurs | aucun indice ne doit être recouvert |
| Contour niveau 2 | rectangle sombre agrandi de ≈ 0,6 px écran (borné à 2,1 u) | un seul remplissage de plus, dans l'emprise (4 u de marge) |
| Feuilles mortes | pas de jaune doré | ne jamais ressembler à l'aiguille |
| Ombres | une direction : nord-ouest | cohérence de toute la carte |

## Limites connues

- Les taches de ton du sol restent des ellipses translucides à bord net : à très fort zoom (4) on les devine comme des
  « nuages » de sol ; elles sont volontairement discrètes (opacité 8–20 %).
- Les marelles sont fixes (même tracé partout) et sans chiffres : trop petits pour être lus.
- Le chat à la fenêtre, les oiseaux de faîtage et l'enseigne en drapeau ne se voient bien qu'à partir du zoom 1,5.
- Pas d'animation (reflets d'eau mobiles, linge qui bouge) : le rendu par tuiles mises en cache l'interdit.
- Peu d'animaux ambiants en plus : les chiens, chats et pigeons du sol sont placés par le monde (`src/world`), hors
  périmètre ; l'art ajoute seulement ceux qui vivent sur les bâtiments, l'eau et les quais.
- À re-mesurer sur un vrai téléphone (GPU) : les mesures sont faites dans le conteneur (Chromium sans GPU).

## Comment vérifier

```bash
npx tsc --noEmit && npx vitest run && npm run content:check && npm run build
node scripts/shot.mjs "/?ui=0&x=2850&y=2060&zoom=2" .shots/grandplace.png --width 390 --height 844 --dpr 2
node scripts/shot.mjs "/dev/gallery.html?section=decor&zoom=3&bzoom=1.6" .shots/decor.png --width 1300 --height 1500 --dpr 1
node scripts/shot.mjs "/dev/gallery.html?section=check" .shots/check.png --width 1200 --height 400 --dpr 1   # « AUCUN débordement »
node scripts/perf-map.mjs
E2E_PORT=5181 npm run e2e
```

Captures conservées : `docs/screenshots/da-<lieu>-avant-apres.png` (ville, grandplace, halles, parc, port, gare, jardins,
faubourg, chantier, c01) — à gauche l'état d'avant, à droite l'état d'après.
