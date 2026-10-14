# Module `src/art` — l'illustration de Meulebourg

Tout ce que le joueur voit de la ville est dessiné ici, en Canvas 2D et par code : sol, bâtiments,
personnages, véhicules, arbres et objets. Style « carte illustrée de livre jeunesse » : papier crème,
trait d'encre brun-noir fin et régulier, aplats d'une palette limitée légèrement désaturée, petites
ombres portées au sol.

Le contexte reçu est **en coordonnées monde** (déjà transformé par le moteur) : les épaisseurs de
trait sont en unités monde (≈ 0,45–1 u). La carte est rendue **par tuiles** : chaque fonction doit
dessiner exactement la même chose quelle que soit la tuile (voir « Règles » ci-dessous).

## API (`src/art/index.ts`)

| Export | Rôle |
|---|---|
| `type Lod = 0 \| 1 \| 2`, `lodForZoom(zoom)` | Niveau de détail : 0 si zoom ≥ 1, 1 si 0,3 ≤ zoom < 1, 2 en dessous |
| `PAPER`, `INK` | Couleur du papier (fond) et de l'encre |
| `COLOR_HEX: Record<Color, string>`, `COLOR_NAME_FR` | Les 14 couleurs du vocabulaire et leur nom français |
| `drawGround(ctx, ground, view, lod)` | Sol : fond, polygones (textures alignées sur le monde), lignes |
| `drawEntity(ctx, e, lod)` | Une entité (personne, bâtiment, véhicule, arbre, objet) |
| `drawPortrait(ctx, appearance, cx, cy, size)` | Buste d'un personnage centré, rogné au carré (carnet) |
| ré-exports de `bounds.ts` | `getEntityBounds`, `getHitRect`, `sortKey`, `compareDrawOrder`, `buildingVisibleRect`, `personSize`, `PROP_SIZE`, `VEHICLE_SIZE`, `FLAT_PROPS`, `TREE_WIDTH_RATIO`, `BUILDING_TOP_EXTRA` |

`bounds.ts` est un **contrat** (module pur, aussi utilisé par `world`, `engine` et `game`) : il n'a
pas été modifié.

## Organisation

| Fichier | Contenu |
|---|---|
| `index.ts` | Point d'entrée, aiguillage `drawEntity` |
| `lod.ts` | `Lod`, `lodForZoom` |
| `palette.ts` | Papier, encre, ombres ; 14 couleurs (+ variantes sombres/claires, encre de motif) ; murs, toits, peaux, cheveux, matériaux (`MAT`), chapeaux |
| `patterns.ts` | Textures `CanvasPattern` mises en cache par résolution (1 à 16 px/u) : motifs de vêtements, herbe, pavés, dalles, eau, planches, tuiles, ardoise, zinc, verrière, briques, pierre |
| `util.ts` | Petits outils (formes encrées, ombre au sol, `seedOf`, `quickRand`, `deviceScale`) |
| `text.ts` | Texte sur la carte : pile de polices **système** (`FONT_STACK`, `SERIF_STACK`), ajustement à la largeur, texte jamais en miroir |
| `skeleton.ts` | Squelettes des personnages (articulations) par corpulence × pose, cache ; squelettes de cavaliers (vélo, scooter, conducteur) |
| `personShapes.ts` | Constructeurs de chemins des personnages (buste, tête, coiffures, chapeaux, visage…) |
| `person.ts` | Dessin des personnages (3 niveaux), pose `window`, cavaliers, têtes de passagers, portraits, statues |
| `held.ts` | Accessoires portés (12) et objets tenus en main (19), bornés par l'emprise locale |
| `emote.ts` | Bulles d'émotion (11), dessinées hors miroir |
| `building.ts` | Bâtiments : plan de façade (étages, fenêtres, portes, vitrines) calculé une fois par entité, toits (équipements des toits plats : aérations, climatiseurs, verrières, réservoir, trappe), murs, features, niveaux 0/1/2 |
| `buildingParts.ts` | Éléments de façade : fenêtres par lots, portes, vitrines, stores, enseignes, horloges, colonnes, frontons, drapeaux, cheminées |
| `buildingStyles.ts` | Styles reconnaissables (église, mairie, gare, musée, théâtre, cinéma, hôpital, commissariat, banque, école, hôtel, entrepôt, usine, garage, cabane, serre, pharmacie, poste, bijouterie, bar) |
| `vehicle.ts` | Véhicules de profil (10), conducteur, passagers du bus, livrées, gyrophares, nom du bateau ; porte latérale ouverte (`doorOpen`) du fourgon et de l'ambulance contre la cabine, inscriptions peintes repliées sur le reste de la caisse (toujours lisibles) |
| `tree.ts` | Arbres (boule, conifère, peuplier, nu) et leur ombre |
| `props.ts` | Les 50 `PropKind` et les variantes utilisées par le monde |
| `ground.ts` | Sol (13 `GroundKind`) et lignes (8 `GroundLineKind`) |
| `palette.test.ts` | Distinction des couleurs (ΔE CIE76 ≥ 20 pour toutes les paires, ≥ 25 pour les paires piégeuses) et seuils de `lodForZoom` |

## Vocabulaire couvert

- **Personnes** (20 u, enfant 13 u ; tête ≈ 5,5 u) : 11 chapeaux, 7 coiffures × 6 couleurs, 10 hauts
  (manteau long, robe, tablier, costume-cravate, uniforme à insigne, salopette à bretelles, sweat à
  capuche…), jupe / short / pantalon, motifs rayures / pois / carreaux découpés dans la forme du haut,
  lunettes, lunettes noires, moustache, barbe, masque de bandit, 12 accessoires, 4 corpulences,
  16 poses (`lie` allongé au sol, `window` buste dans un cadre de fenêtre avec rideaux), miroir
  gauche/droite, 11 émotions en bulle, 19 objets tenus. Un accessoire tenu par la main arrière
  (sac, mallette, canne, fleurs, journal) que le corps cacherait (marche, course, assis) est dessiné
  devant le corps ; l'appareil photo passe toujours par-dessus le bras avant.
- **Variantes d'objets utilisées par le monde** : `rock`/`tombstone` (tombes : stèle arrondie,
  stèle à pignon ou croix selon la graine), `statue`/`sculpture` et `statue`/`angel`,
  `flowerbed`/`vegetables` (potager selon la couleur : tomates sur tuteurs, citrouilles, courges,
  poireaux et haricots, choux),
  `dog`/`small` et `dog`/`big`, `manhole`/`open`, `bench`/`broken`, `safe`/`open`. Véhicule
  `bicycle` (ou `scooter`) **sans** `driver` = véhicule garé (vélo sur sa béquille).
- **Aiguille** (`needle`) : 5,6 u, dorée, cernée d'or sombre, avec un éclat en étoile et une ombre
  minuscule — discrète, mais trouvable au zoom 2.

## Règles respectées (et comment elles sont vérifiées)

1. **Emprise** : tout dessin d'une entité tient dans `getEntityBounds(e)`. Les objets tenus et les
   accessoires sont recalés dans l'emprise locale de la personne (`held.ts`, `localBounds`). Contrôle
   automatique au pixel : `dev/gallery.html?section=check` (≈ 5 800 entités × 3 niveaux, dont
   toutes les poses × corpulences × chapeaux × accessoires × objets tenus, tous les styles de
   bâtiments à trois tailles, tous les objets à trois échelles, les variantes du monde) ;
   résultat dans `window.__artBoundsReport` (attendu : `violations: 0`).
2. **Raccords de tuiles** : toutes les textures de sol ont leur origine en (0, 0) du **monde** ; les
   motifs le long des lignes (pointillés, traverses, bandes de passage piéton) suivent l'abscisse
   curviligne depuis le début de la ligne. La planche `ground` et la planche `scene` de la galerie
   sont rendues en tuiles décalées pour le vérifier.
3. **Pas de `ctx.filter`, `shadowBlur`, dégradés** ; aucune police web (pile de polices système) ;
   aucun `Math.random()` / `Date.now()` (variations tirées de `seedOf(e.id)` ou de `e.seed`).
4. **Déterminisme** : le dessin d'une entité ne dépend que de l'entité, du niveau de détail et de
   l'échelle du contexte (les plus petits détails — yeux, motifs — n'apparaissent qu'à partir de
   1,6 px par unité, échelle toujours atteinte par les tuiles du zoom de jeu).

## Niveaux de détail

| Niveau | Zoom | Personnes | Bâtiments | Autres |
|---|---|---|---|---|
| 0 | ≥ 1 | silhouette encrée complète, visage, motifs, accessoires, objets, bulles | toit texturé, fenêtres détaillées (volets, rideaux, jardinières), enseignes, features | textures de sol, détails fins |
| 1 | 0,3–1 | silhouette encrée simplifiée (≈ 8 aplats), pas de visage ni de motif | fenêtres simplifiées, enseignes | textures réduites |
| 2 | < 0,3 | deux rectangles (couleur du haut, du bas) | toit + façade unie + quelques fenêtres | arbres = taches, petits objets omis |

## Performance

Mesure : `dev/gallery.html?section=perf` (2 000 personnes, 300 bâtiments, canevas 1024², pour
chaque niveau) → `window.__artPerf` (ms par entité). Valeurs relevées dans le conteneur de
développement (Chromium sans GPU, mesures bruitées de ±30 % d'une exécution à l'autre) :

| | niveau 0 (zoom 1) | niveau 0 (zoom 2) | niveau 1 (zoom 0,5) | niveau 2 (zoom 0,15) |
|---|---|---|---|---|
| personne | 0,09–0,12 | 0,12–0,18 | 0,04–0,06 | 0,0011–0,0018 |
| bâtiment | 0,36–0,70 | 0,9–1,6 | 0,14–0,22 | 0,005–0,009 |

L'objectif de 0,05 ms par personne au niveau 0 **n'est pas atteint dans ce conteneur** : le profil CPU
montre que le temps se partage entre le coût interne de Chromium par opération de dessin (analyse
du chemin, ≈ 45 %) et la rastérisation logicielle (≈ 30 %), le JavaScript du module pesant moins de
15 %. Une personne = ≈ 16 remplissages et 1 à 2 traits fins, tous sur des chemins `Path2D` mis en cache
(aucune construction de chemin pendant le dessin). Le niveau 2, utilisé quand une tuile contient des milliers d'entités, est
60 à 80 fois plus rapide que le niveau 0.

## Galerie de contrôle

`dev/gallery.html` (code : `src/dev/gallery.ts`) — planches étiquetées : palette, chapeaux,
coiffures, hauts, motifs, bas, visages, accessoires, accessoires × poses courantes, corpulences,
poses × orientation, allongés,
vêtements longs en mouvement, émotions, objets tenus, foule aléatoire, paires à distinguer,
portraits, bâtiments (tous les styles), features de façade, véhicules, arbres, objets, statues,
grands objets, sols, scène de rue rendue en tuiles.

| Paramètre | Effet |
|---|---|
| `?zoom=4` | zoom des planches (défaut 4 ; vérifier aussi 1,5, 1, 0,5 et 0,2) |
| `?bzoom=…` | zoom des planches de bâtiments (défaut : zoom / 2, au plus 2) |
| `?bounds=1` | contour rouge de `getEntityBounds` (bleu : `getHitRect`) |
| `?section=<id>` | une seule planche (ids dans le menu) ; `check` = contrôle des emprises, `perf` = mesure |
| `?lod=0\|1\|2` | force un niveau de détail |

## Vérifier

```bash
npx tsc --noEmit                      # types
npx vitest run src/art                # palette + lodForZoom
node scripts/shot.mjs "/dev/gallery.html?section=poses&zoom=4" .shots/poses.png --width 1200 --height 1000 --dpr 1
node scripts/shot.mjs "/dev/gallery.html?section=check" .shots/check.png --width 1200 --height 400 --dpr 1   # « AUCUN débordement »
node scripts/shot.mjs "/dev/gallery.html?section=perf" .shots/perf.png --width 1200 --height 400 --dpr 1
node scripts/shot.mjs "/dev/map.html?hud=0&x=2850&y=2060&zoom=1.5" .shots/place.png --width 420 --height 420 --dpr 2   # en situation
```

## Ajouter un élément

- **Objet** : une entrée dans `DRAW` (`props.ts`), dessin face à droite autour de l'ancre (0, 0), dans
  la boîte `PROP_SIZE` (+ 3 u de marge), puis lancer `?section=check`.
- **Style de bâtiment** : un `StyleHook` dans `buildingStyles.ts` (plan de façade, toit, avant/après le
  contenu, niveau 2) ; ne jamais monter au-dessus de `L.topLimit`.
- **Valeur de vocabulaire** (chapeau, haut…) : forme dans `personShapes.ts`, boîte de sous-couche
  d'encre (`HAT_BOX`…), puis vérifier `?section=hats` et `?section=check`.
