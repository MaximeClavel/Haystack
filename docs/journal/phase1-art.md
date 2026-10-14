# Phase 1 — agent `art` : l'illustration de Meulebourg

Date : 14/10/2026 (trois passages, les deux premiers interrompus par la limite d'usage).
Périmètre : `src/art/**`, `dev/gallery.html`, `src/dev/gallery.ts`.
**Aucun changement de contrat** : `src/art/bounds.ts`, `src/types.ts`, `src/config.ts` et
`src/world/layoutSpec.ts` sont inchangés.

## Ce qui a été fait

Le dessin provisoire (rectangles) est remplacé par une illustration complète en Canvas 2D, dans le
style « carte illustrée de livre jeunesse » en couleur : papier crème, trait d'encre brun-noir fin,
aplats d'une palette limitée légèrement désaturée, petites ombres au sol. Détail des fichiers et de
l'API dans `src/art/README.md`.

- **API** (`src/art/index.ts`) : `Lod`, `lodForZoom`, `PAPER`, `INK`, `COLOR_HEX`, `COLOR_NAME_FR`,
  `drawGround`, `drawEntity`, `drawPortrait`, ré-exports de `bounds.ts`.
- **Personnages** (`person.ts`, `personShapes.ts`, `skeleton.ts`, `held.ts`, `emote.ts`) : squelettes
  par corpulence × pose, formes construites une seule fois dans des `Path2D` mis en cache, sous-couche
  d'encre unique (la silhouette entière, agrandie de l'épaisseur du contour) puis aplats par couleur.
  Tout le vocabulaire est couvert : 11 chapeaux, 7 coiffures × 6 couleurs, 10 hauts, 3 bas, 4 motifs,
  6 détails de visage, 12 accessoires, 4 corpulences, 16 poses × 2 orientations, 11 émotions,
  19 objets tenus ; portraits du carnet ; statues (bronze, pierre).
- **Bâtiments** (`building.ts`, `buildingParts.ts`, `buildingStyles.ts`) : plan de façade calculé une
  fois par entité (étages, fenêtres variées selon la graine, portes, vitrines, enseigne ajustée à la
  largeur), 9 types de toits, 4 textures de murs, les 8 features, 20 styles spéciaux reconnaissables.
- **Véhicules** (`vehicle.ts`), **arbres** (`tree.ts`), **objets** (`props.ts` : les 50 `PropKind` et
  les variantes du monde : tombes, anges, sculptures, potagers, petits/grands chiens, vélos garés),
  **sol** (`ground.ts`, `patterns.ts` : 13 sols texturés et 8 types de lignes, textures alignées sur le
  monde).
- **Galerie** `dev/gallery.html` : 26 planches étiquetées (dont les sols) + scène de rue rendue en tuiles + contrôle
  automatique des emprises (`?section=check`) + mesure de performance (`?section=perf` →
  `window.__artPerf`) ; paramètres `?zoom=`, `?bzoom=`, `?bounds=1`, `?section=`, `?lod=`.
- **Tests** : `src/art/palette.test.ts` (ΔE ≥ 20 entre toutes les couleurs, ≥ 25 pour les paires
  piégeuses ; seuils de `lodForZoom`).

## Troisième passage : inventaire puis compléments

| Exigence | État trouvé | Action |
|---|---|---|
| Typecheck, tests | OK | — |
| Variantes du monde (tombes, statues, potagers, chiens, vélos garés, cordes) | dessinées | vérifiées dans la galerie et en situation (`dev/map.html`) |
| Niveaux 1 et 2 | OK | vérifiés en situation (zoom 0,55 et 0,25, densité 2) |
| `?bounds=1` sans débordement | contrôle limité aux niveaux 0 et 1 | **niveau 2 ajouté** : 5 798 entités × 3 niveaux = 17 394 rendus, **0 débordement** |
| `window.__artPerf` | présent ; personne niveau 0 ≈ 0,1 ms (objectif 0,05) | profil CPU, optimisation (voir ci-dessous), note sur le bruit de mesure |
| Galerie complète | OK | planche « accessoires × poses » ajoutée, libellés des portraits corrigés |
| `drawPortrait` | OK | — |
| Fichiers de banc d'essai | déjà supprimés | — |
| README, compte rendu | absents | écrits |

### Changements de code de ce passage

1. **Membres remplis au lieu d'être tracés** (`person.ts`) : un profil CPU (CDP) du dessin de
   2 000 personnes montrait `stroke()` à 40 % du temps total pour ~7 traits épais par personne. Les
   bras, jambes, manches, short et la sous-couche d'encre des membres sont désormais des polylignes
   épaisses **remplies** (disques + segments, même orientation, règle non nulle), identiques au pixel
   près à un trait `round` (vérifié par différence d'images). Il reste 1 à 2 traits fins par personne.
   Gain mesuré : nul à faible (le coût s'est déplacé dans `fill()` : c'est l'analyse du chemin par
   Chromium qui coûte, pas le trait lui-même), mais une passe de moins quand bras et jambes n'ont pas
   la même largeur.
2. **Motifs de vêtements à partir de 1,6 px par unité** : en dessous, une rayure de 1,5 u ne couvre
   qu'un pixel (moiré). Les tuiles du zoom de jeu (≥ 1,5) sont toujours rendues à ≥ 2 px/u.
3. **Accessoires visibles dans toutes les poses** : le sac, la mallette, la canne, le bouquet de
   fleurs et le journal sont tenus par la main arrière ; en marchant, en courant ou assis, cette main
   est derrière le corps et l'accessoire disparaissait (bouquet invisible sur un passant qui marche :
   attribut d'enquête perdu !). Il est maintenant dessiné devant le corps (même position, donc même
   emprise) ; l'appareil photo passe par-dessus le bras avant.
4. **Aiguille** : éclat en étoile cerné d'or sombre (il disparaissait sur les sols clairs) et ombre
   minuscule au sol.
5. **Toits plats équipés** (`building.ts`) : les grands toits plats (commissariat, banque, cinéma,
   immeubles) étaient de vastes aplats gris presque vides. Ils reçoivent 1 à 6 équipements selon leur
   surface (aération, climatiseur, verrière, réservoir, trappe), placés par la graine du bâtiment en
   évitant cheminées et décors du style (verrière du musée, hélistation de l'hôpital), avec une
   petite ombre portée ; simples blocs au niveau 1.
6. Galerie : contrôle d'emprise au niveau 2, planche `accposes`, note de mesure dans `__artPerf`,
   libellés des portraits.

## Boucle d'auto-critique (ce passage)

Captures dans `.shots/` (brouillons), lues et critiquées à chaque tour.

1. **Inventaire et mesures** — contrôle d'emprise sur 3 niveaux, mesure de performance, profil CPU →
   membres remplis, motifs conditionnés à l'échelle.
2. **En situation, densité 2 (téléphone)** — grand-place (zoom 0,25 / 0,55 / 1 / 2,5), port, parc,
   cimetière, jardins ouvriers, gare, halles, musée, chantier, pont, école, commerces, commissariat :
   ensemble lisible et cohérent, aucun raccord de tuile visible. Défaut relevé : l'éclat de l'aiguille
   invisible sur fond clair → corrigé.
3. **Vocabulaire au zoom de jeu 1,5** (chapeaux, hauts, visages, coiffures, objets tenus, accessoires,
   paires « une seule différence ») — défaut relevé : fleurs, mallette, journal, canne et appareil
   photo invisibles en marchant/courant/assis → nouvelle planche `accposes`, correction, re-capture
   (zoom 3 et 4) : tous visibles.
4. **Bâtiments en situation au zoom 2** (commerces, librairie, commissariat, catalogue des styles) —
   défaut relevé : grands toits plats vides et monotones → équipements de toit, re-capture du
   commissariat et du catalogue.
5. **Contrôle final** — re-contrôle des emprises (0 débordement), différence d'images avant/après sur
   les poses, catalogue des véhicules, statues, grands objets, portraits (libellés corrigés), mesure
   de performance répétée. Captures conservées : `docs/screenshots/art-personnages.png`,
   `art-batiments.png`, `art-vehicules.png`, `art-grand-place.png`, `art-jeu-zoom25.png`.

(Les deux passages précédents avaient déjà mené plusieurs tours sur les planches : distinction des
couleurs, silhouettes des chapeaux, poses, emprises des objets tenus en pose allongée, enseignes.)

## Décisions

| Sujet | Choix | Raison |
|---|---|---|
| Construction des personnages | chemins `Path2D` en repère local, mis en cache par (corpulence, pose, attribut) | aucun chemin construit pendant le dessin ; une personne ≈ 16 remplissages |
| Contour | sous-couche d'encre (silhouette agrandie) + quelques traits fins intérieurs | un trait régulier autour de la silhouette pour le prix d'un remplissage |
| Textures | `CanvasPattern` par résolution (1–16 px/u), origine (0, 0) du monde pour le sol | une opération par forme, aucun raccord entre tuiles |
| Texte | pile de polices système (`'Arial Narrow', … , sans-serif`), jamais en miroir | identique d'une tuile à l'autre |
| Variations | `seedOf(e.id)` / `e.seed` | déterministe, sans `Math.random()` |
| Objets hors emprise | recalage (`fitShift`) dans l'emprise locale de la personne | la règle absolue des tuiles prime sur la position « naturelle » |
| Accessoire caché par le corps | dessiné devant | la lisibilité d'un attribut d'enquête prime sur la vraisemblance |

## Limites connues

- **Performance** : ≈ 0,10 ms par personne au niveau 0 (zoom 1), 0,12–0,18 ms au zoom 2, 0,05 ms au
  niveau 1, 0,0012 ms au niveau 2, dans le conteneur (Chromium sans GPU, mesures bruitées de ±30 %).
  L'objectif de 0,05 ms au niveau 0 n'est pas atteint : le temps est dans Chromium (analyse des chemins
  ≈ 45 %, rastérisation logicielle ≈ 30 %), pas dans le JavaScript du module (< 15 %). D'après son compte
  rendu, le moteur (`engine`) tient malgré tout son budget d'image grâce au rendu progressif des tuiles ; à re-mesurer sur un vrai téléphone
  (GPU) avec `scripts/perf-map.mjs`.
- Accessoire de la main arrière dessiné devant le corps en marchant : lisible, mais la main qui le
  tient reste cachée (léger flottement si on y regarde de près au zoom 4).
- Les grands toits plats restent sobres : 1 à 6 équipements selon la surface (pas de cheminées
  d'aération en réseau, d'antennes, de jardins sur les toits).
- Les ponts n'ont pas d'ombre portée sur l'eau (une ombre décalée aurait débordé sur les quais).
- Une ligne `wall` verticale vue du dessus ressemble à une bande claire (muret) ; adapté aux murets du
  cimetière, moins à de hauts murs.
- Les polices système diffèrent d'un appareil à l'autre (enseignes légèrement différentes entre un
  iPhone et un Android), mais restent identiques entre les tuiles d'un même appareil.
- Aucune aiguille n'est encore placée dans le monde (contenu à venir) ; son dessin est vérifié dans la
  galerie (`props`, `scene`).

## Comment vérifier

```bash
npx tsc --noEmit
npx vitest run src/art
# planches (lire les PNG) — zoom de jeu 1,5 en densité 2 :
node scripts/shot.mjs "/dev/gallery.html?section=pairs&zoom=1.5" .shots/pairs.png --width 1150 --height 290 --dpr 2
node scripts/shot.mjs "/dev/gallery.html?section=accposes&zoom=3" .shots/accposes.png --width 1200 --height 900 --dpr 1
node scripts/shot.mjs "/dev/gallery.html?section=buildings&zoom=2" .shots/batiments.png --width 1100 --height 3000 --dpr 1
# emprises (page « AUCUN débordement », window.__artBoundsReport.violations === 0) et performance :
node scripts/shot.mjs "/dev/gallery.html?section=check" .shots/check.png --width 1200 --height 400 --dpr 1
node scripts/shot.mjs "/dev/gallery.html?section=perf" .shots/perf.png --width 1200 --height 400 --dpr 1
# en situation, avec le moteur :
node scripts/shot.mjs "/dev/map.html?hud=0&x=2780&y=2000&zoom=2.5" .shots/place.png --width 420 --height 600 --dpr 2
node scripts/shot.mjs "/dev/map.html?hud=0&x=2850&y=2000&zoom=0.25" .shots/ville.png --width 420 --height 420 --dpr 2
```
