# Module `engine` — moteur de carte

Affiche la ville de Meulebourg sur un `<canvas>` : caméra, gestes (doigts, souris, clavier),
tuiles rendues progressivement et mises en cache, overlays de jeu, animations, vignettes.

```ts
import { createMapView } from '../engine';

const map = createMapView({
  canvas,                 // occupe tout son conteneur (le conteneur doit avoir une taille)
  world,                  // buildWorld({ cases: CASES })
  initial: { x, y, zoom },// facultatif : par défaut, la ville entière
  onTap: (world, screen) => …,         // tap court confirmé (≈ 220 ms après le lâcher)
  onCameraChange: (camera) => …,       // au plus une fois par image
});
await map.whenIdle();     // plus d'animation, tuiles visibles prêtes
```

Contrat complet : `MapView` dans `src/types.ts`. L'objet renvoyé (`EngineMapView`) ajoute :

| Méthode | Rôle |
|---|---|
| `debugStats()` | tuiles en cache / épinglées / capacité, tuiles rendues et abandonnées, durée moyenne et max de rendu d'une tuile (dont finalisation), tuiles visibles en attente, niveau affiché / minimal / racine, images/s, durée de la dernière image (dont rendu de tuiles et composition), densité, `offscreen` |
| `invalidateTiles()` | oublie toutes les tuiles (si le monde a été modifié) ; elles sont refaites progressivement |

Exports annexes : fonctions pures de caméra (`computeMinZoom`, `clampCamera`, `screenToWorld`,
`worldToScreen`, `visibleWorldRect`, `zoomAround`, `fitRectCamera`), `BACKDROP` (couleur de la
« table » autour de la ville), `MARK_STROKE` (couleurs des styles d'anneau, pour l'interface).

## Fichiers

| Fichier | Contenu | DOM ? |
|---|---|---|
| `camera.ts` | Conversions écran ↔ monde, zoom ancré, bornes, cadrage | non (testé) |
| `tiles.ts` | Niveaux, grille, tuiles visibles, parenté, rectangles écran, capacité du cache | non (testé) |
| `lru.ts` | Cache LRU avec épinglage et libération des valeurs évincées | non (testé) |
| `flight.ts` | Trajectoires `flyTo` (log du zoom, dézoom intermédiaire, assouplissement) | non (testé) |
| `inertia.ts` | Mesure de vitesse au lâcher, décroissance exponentielle | non (testé) |
| `gestures.ts` | `GestureRecognizer` : glisser, pincer, tap différé, double-tap, double-tap glissé, tap à deux doigts | non (testé) |
| `overlays.ts` | Dessin des overlays en coordonnées écran | canvas |
| `render.ts` | Rendu d'un rectangle monde avec `src/art` ; `TileJob` interruptible ; surfaces | canvas |
| `tileManager.ts` | Cache de tuiles, niveau racine épinglé, ordonnancement sous budget | canvas |
| `mapView.ts` | `createMapView` : assemblage, boucle d'images, événements | oui |
| `constants.ts` | Réglages internes (seuils des gestes, budgets, friction…) | — |

## Caméra et bornes

- `zoom` = px CSS par unité monde. Zoom minimal = la ville entière tient à l'écran
  (`min(largeur/6400, hauteur/4800)`, jamais sous `MIN_ZOOM_FLOOR`) ; maximal = `MAX_ZOOM` (4).
- Le centre est borné par axe : le bord de la ville peut entrer d'au plus 20 % de l'écran
  (`EDGE_MARGIN`, utile pour dégager un bord de ville des barres d'interface) ; ce débord s'annule
  continûment quand la ville tient sur l'axe — au zoom minimal la ville est centrée et fixe.
- **Marges de l'interface** : `setInsets({ top, bottom, left, right })` (propre au moteur, hors contrat
  `MapView` ; appelé par `mapHost.setInsets`) déclare ce que masquent la barre haute et la feuille du
  bas (ou latérale). Les bornes ci-dessus se comptent alors dans la zone LIBRE (`clampCamera(…, insets)`) :
  le débord de 20 % et le verrouillage « ville entière » s'appliquent à la hauteur libre, centrés au milieu
  de cette zone. Ainsi la rive sud de la ville se remonte toujours au-dessus du panneau de question (à tous
  les zooms, même quand la ville tient presque en hauteur) et le nord descend sous la barre haute. Marges
  nulles ou absentes = écran entier, calcul inchangé. Si un changement de marges (le panneau grandit) met la
  caméra hors des nouvelles bornes (ex. la fiche d'indice se replie quand le doigt touche la carte), elle y
  glisse en `INSETS_GLIDE_MS` (180 ms) ; pendant un glisser ou un pincement, ou en mouvement réduit, elle est
  ramenée tout de suite, et un vol/une inertie en cours appliquent simplement les nouvelles bornes à chaque
  image. Le zoom minimal reste celui de l'écran entier.
- Hors de la ville : « table » sombre (`BACKDROP`) et ombre portée de la carte.

## Gestes

| Geste | Effet |
|---|---|
| Glisser (1 doigt ou souris) | déplacement ; au lâcher, inertie (τ = 325 ms) |
| Pincer (2 doigts) | zoom ancré au milieu des doigts **et** déplacement simultané ; le doigt restant reprend le glisser sans saut |
| Tap (< 8 px, < 300 ms) | `onTap(monde, écran)` émis ≈ 220 ms après le lâcher (sauf s'il devient un double-tap ; un appui ailleurs le confirme aussitôt). Un appui qui stoppe une inertie ou une animation n'est pas un tap. |
| Double-tap | zoom ×2 animé (280 ms) au point touché |
| Double-tap maintenu puis glisser vertical | zoom à un doigt (150 px = ×2) |
| Tap à deux doigts | zoom ÷2 animé |
| Molette | zoom lissé ancré au curseur ; défilement horizontal dominant = déplacement |
| Pincement pavé tactile (`wheel` + `ctrlKey`) | zoom immédiat ancré au curseur |
| Flèches / `+` `-` | déplacement (élan amorti) / zoom ×2 ÷2 animé au centre — si le focus est sur la carte ou sur `body` |

Le canevas reçoit `touch-action: none`, `tabindex=0` (s'il n'en a pas), et capture le pointeur.

## Animations

`flyTo` interpole le **log** du zoom et le centre avec `easeInOutCubic`. Le centre progresse
proportionnellement à `∫ dt / zoom` : il bouge surtout quand on est dézoomé, et pour un zoom vers
un point, ce point reste fixe à l'écran (propriété exacte, testée). Si la cible est hors de vue
aux deux zooms, la trajectoire dézoome en chemin jusqu'à voir départ et arrivée ensemble
(80 % de l'écran). Durée : `320 + 110·(doublements de zoom parcourus) + 260·log2(1 + distance
écran au zoom le plus bas / diagonale)` ms, bornée à [220, 2200] — ou imposée par `duration`.
`setReducedMotion(true)` rend tout instantané (et fige la pulsation des overlays).
Une animation interrompue (geste, autre `flyTo`, `setCamera`) résout sa promesse.

## Tuiles

- Niveau `L` entier : rendu au zoom `2^L`, tuile de `TILE_SIZE / 2^L` unités monde,
  `TILE_SIZE × densité` pixels (densité = `min(devicePixelRatio, MAX_DPR)`).
- **Règle de choix du niveau** : le plus petit `L` tel que `zoom / 2^L ≤ 1,15`. Une tuile est donc
  affichée entre ×0,58 (réduite : nette) et ×1,15 (agrandissement imperceptible). On préfère réduire
  qu'agrandir, sans payer 4× plus de tuiles pour 15 % de netteté. Niveaux de `L_min` (celui du zoom
  minimal ; −4 sur téléphone) à `log2(MAX_ZOOM) = 2`.
- **Niveau racine** = `L_min`, ou plus bas si la ville y demande plus de 16 tuiles (grand écran) :
  rendu en premier au démarrage, **épinglé** dans le cache, il sert de repli universel.
- Rendu d'une tuile : fond `BACKDROP`, découpe au monde, `PAPER`, `drawGround(ctx, ground, rect, lod)`,
  puis `drawEntity` pour `world.index.query(rect)` (déjà trié), contexte en coordonnées monde,
  `lod = lodForZoom(2^L)`. Chaque appel à `drawEntity` est protégé (une exception est comptée,
  signalée 5 fois au plus en console, et n'interrompt pas la tuile).
- Surface : `OffscreenCanvas` (une seule, réutilisée) puis `transferToImageBitmap()` ; sans
  OffscreenCanvas (anciens Safari) : un canevas DOM par tuile. Évincée : `ImageBitmap.close()` ou
  largeur 0.

## Ordonnanceur

Chaque image (`requestAnimationFrame`, seulement quand nécessaire) :

1. avance animation / inertie / molette ;
2. plan de rendu, par priorité : tuiles racine manquantes → (pendant un vol) tuiles de la
   **destination** → tuiles visibles manquantes, les plus centrales d'abord → si tout est calme
   (aucun geste ni mouvement) et tout le visible prêt : niveau parent puis anneau voisin. L'ensemble
   à conserver (racine + visible + préchargement) est borné par la capacité du cache (sinon le
   préchargement s'évincerait lui-même) ;
3. rendu des tuiles du plan dans le budget : 8 ms au calme, 5 ms pendant un geste ou une animation.
   Une tuile est un travail interruptible : sol, puis entités par paquets de 8 avec contrôle du
   temps ; la **finalisation** (`transferToImageBitmap`, qui rastérise d'un bloc les commandes
   enregistrées) est reportée à l'image suivante s'il ne reste pas assez de budget. Un travail
   devenu inutile est abandonné. Sur un appareil en retard (image précédente > 25 ms) pendant un
   geste, le rendu de tuiles saute une image sur deux ;
4. composition (voir ci-dessous) puis overlays ;
5. `onCameraChange` si la caméra a changé ; résolution des `whenIdle()` si plus rien ne bouge et
   que toutes les tuiles visibles au bon niveau sont prêtes ; nouvelle image seulement s'il reste
   un mouvement, du rendu prévu ou un overlay animé.

### Composition (jamais de trou)

Pour chaque tuile visible : prête → `drawImage` ; sinon la meilleure ancêtre prête (sous-rectangle
agrandi) puis, par-dessus, les descendants prêts sur deux niveaux (utile quand on dézoome) ; si les
quatre enfants sont prêts, l'ancêtre est omise. Les rectangles écran sont arrondis au pixel réel,
bord à bord : aucun liseré entre tuiles. La table, l'ombre et la découpe ne sont dessinées que si
la ville ne couvre pas l'écran ; le papier, tant que la racine n'est pas complète.

### Cache

LRU borné : `128 / densité` tuiles (64 à densité 2, 128 à densité 1), relevé si besoin pour deux
écrans de tuiles au pire niveau + la racine (téléphone : 68), plafonné à ~256 Mo.
Un changement de densité vide le cache ; un changement de taille recalcule racine et capacité.

## Overlays (coordonnées monde → dessinés en px écran)

| Type | Rendu |
|---|---|
| `spotlight` | voile sombre 55 % sur tout l'écran, trou circulaire (rayon ≥ 24 px) bordé d'un liseré clair |
| `ring` / `box` | trait coloré sur halo sombre ; rayon ≥ 14 px, cadre ≥ 18 px. `select` blanc pointillé, `found` vert + coche, `reveal` doré avec onde pulsante, `wrong` rouge + croix, `near` orange pointillé |
| `thread` | fil rouge incurvé (il « pend » de 10 % de sa longueur, 60 px au plus), ombre, punaises dorées aux deux bouts |
| `pin` | punaise rouge de profil dont la pointe désigne le point ; étiquette facultative |

Seul `reveal` est animé : la boucle d'images ne tourne en continu que s'il est présent, et seulement pendant `REVEAL_PULSE_MS` (6 s) après chaque `setOverlays` ; ensuite l'onde est figée et le moteur redevient au repos (batterie).

## `renderSnapshot(target, rect)`

Rendu direct et synchrone (sans tuiles) de `rect` dans `target`, à la taille du canevas cible.
Le rectangle est **élargi au format du canevas** (entièrement visible, centré, sans bandes vides).
Le niveau de détail suit l'échelle en px CSS (`clientWidth` du canevas s'il est affiché, sinon
largeur / densité). Coût : quelques ms pour une vignette ; la ville entière en minicarte coûte
davantage (toutes les entités) — à faire une fois et à garder.

## Vérifier

```bash
npx vitest run src/engine                   # 64 tests : caméra, tuiles, LRU, vols, gestes, inertie
node scripts/perf-map.mjs --gestures        # 30 contrôles Playwright des gestes (Pixel 7 + bureau)
node scripts/perf-map.mjs                   # parcours de performance, CPU ×1 et ×4
node scripts/perf-map.mjs --startup         # démarrage : buildWorld({ cases }) à froid + premier rendu, ×1 et ×4
node scripts/shot.mjs "/dev/map.html?x=780&y=1700&zoom=2.5&ids=1" .shots/carte.png
```

Page de développement `dev/map.html` : `?x=&y=&zoom=`, `grid=1` (ou `grid=<pas>`), `ids=1`
(ids des entités à zoom ≥ 2), `demo=1` (un exemplaire de chaque overlay), `hud=0`, `cases=0`,
`reduced=1`. Un tap affiche le point monde et l'entité la plus en avant (et l'encadre).
`window.__haystack = { world, map, taps, cameraChanges }`.
