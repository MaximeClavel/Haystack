# Phase 1 — agent `world` : le générateur de Meulebourg

Date : 14/10/2026. Périmètre : `src/world/**` (sauf `layoutSpec.ts`, **non modifié**),
`scripts/world-query.ts`, `dev/overview.html`, `src/dev/overview.ts`. Aucun changement de contrat.

## Ce qui a été fait

Le monde provisoire (rectangles, foule aléatoire) est remplacé par un générateur déterministe complet,
découpé en modules (détail dans `src/world/README.md`) :

| Fichier | Rôle |
|---|---|
| `index.ts` | API publique : `buildWorld`, `groundAt`, `isWalkable`, `buildingAt`, `appearanceDistance`, `onCrosswalk`, `isHiddenByRoof`, `entitiesAt`, `findFreeSpots`, `worldMeta`, cache par graine |
| `layout.ts` | Plan des rues : avenues, ~45 rues saisies à la main autour des lieux, décomposition en rectangles libres + subdivision aléatoire, 4 rues en biais, impasses, types d'îlots ; emplacements (parvis, parkings, quais de gare…) |
| `ground.ts` | Formes et lignes du sol, ponts, rivière, voie ferrée, passages piétons, marquage central |
| `buildings.ts` | Lieux remarquables exacts + remplissage des îlots par rangées sous contrainte de lisibilité |
| `areas.ts` | Aménagements de tous les lieux (parc, marché, places, gare, école, chantier, cimetière, port, jardins ouvriers, squares, boulodromes) |
| `props.ts`, `vegetation.ts`, `vehicles.ts`, `people.ts` | Mobilier, arbres et jardins, véhicules, foule |
| `appearance.ts` | Apparences par rôle (docker, vendeur, policier…) et règle anti-sosie |
| `story.ts` | Intégration des enquêtes |
| `spatial.ts` | Index spatial (grille de 256 u) |
| `raster.ts`, `context.ts`, `geom.ts`, `query.ts`, `names.ts`, `meta.ts`, `free.ts` | Grille d'occupation, contexte de génération, géométrie, requêtes exactes, textes du décor, métadonnées, recherche d'emplacements libres |
| `world.test.ts` | 35 tests |

### Chiffres (graine 20261014, sans enquête)

- 170 rues (9 avenues, ~47 rues saisies, ~100 rues aléatoires, 4 en biais, 6 impasses), 206 îlots
  (123 urbains, 43 de maisons, 12 industriels, 6 squares, 2 parkings, 2 boulodromes).
- 786 bâtiments (37 remarquables), **3 231 personnes**, **248 véhicules**, **944 arbres**, 3 096 objets
  (915 réverbères, 362 poubelles, 231 tombes, 136 bancs, 65 étals, 83 chiens…), 14 zones `z.*`.
- Sol : 578 formes, 1 331 lignes (725 passages piétons, 122 tronçons de marquage central, 2 voies
  ferrées, 441 clôtures et haies, 34 allées, 7 murets et parapets).

### Mesures de performance (Node 22, machine partagée avec d'autres agents)

- `buildWorld()` : **≈ 160–250 ms** à chaud (test Vitest : 164 ms), **≈ 380–430 ms** au tout premier
  appel d'un processus neuf (compilation JIT comprise). Le monde ambiant est ensuite en cache :
  `buildWorld({ cases })` ne coûte plus que l'intégration (≈ 20–30 ms).
- Requête de l'index spatial sur 256 × 256 u : **≈ 4–5 µs** (24 entités en moyenne).

## Décisions

1. **Vue oblique = règle de lisibilité.** Un bâtiment masque le sol sur `height` unités au nord de son
   emprise. Tout bâtiment généré respecte : sa bande toit + façade ne chevauche aucune autre bande
   (aucune façade masquée) et son toit ne recouvre ni rue, ni place, ni lieu, ni eau. D'où des îlots
   en rangées : rangée avant alignée sur la rue au sud, rangée arrière dont le **toit** s'aligne sur la
   rue au nord, cour visible au milieu. À l'écran, chaque rue est bordée au nord par des façades et au
   sud par des toits, comme dans une vraie carte illustrée. Vérifié par un test.
2. **Rues : décomposition + subdivision** plutôt qu'une grille : les rues autour des lieux sont saisies
   à la main (la Vieille Ville a des jonctions en T impossibles en découpe « guillotine »), la partie
   libre est découpée en rectangles puis subdivisée aléatoirement (îlots de 140 à 400 u de profondeur
   selon le quartier). Une rue aléatoire doit aboutir à une rue à chaque bout et éviter les lieux.
3. **Grille d'occupation conservatrice** (cases de 4 u, résumé grossier 32 u) pour toutes les
   collisions pendant la génération, puis **vérification exacte** des piétons sur le sol réel.
   Chaque entité haute (arbre, véhicule, kiosque, étal, personne) marque la zone qu'elle masque : aucun
   passant n'a les pieds cachés (sauf vendeurs volontairement derrière leur comptoir).
4. **Places réservées (slots)** : les lieux réservent des places typées (vendeur derrière chaque étal,
   assis sur les bancs et chaises de terrasse, musiciens au kiosque, policiers devant le commissariat,
   infirmières aux urgences, dockers, pêcheurs, jardiniers, enfants dans la cour…), remplies avant la
   foule générique.
5. **Foule** par catégorie sol × quartier (densité en personnes / 10 000 u² : places 8–9, trottoirs
   1,6 à 7,5 selon le quartier, parc 1,35, cours 1,5, jardins 0,35…) et par activités : marche,
   groupes de 2–4 face à face (bulle « talk »), couples (cœurs), familles (enfants qui suivent),
   promeneurs avec chien (laisse + `dog` 16 u devant, même sens), pique-niques assis, joggeurs, lecteurs,
   allongés au parc, 90 personnes aux fenêtres (`pose: 'window'`, `z`, `sortY`). Tout le vocabulaire
   d'apparence apparaît (testé). Aucun objet compromettant (couteau, sac d'argent, bijou, aiguille…)
   n'est tenu ni posé par l'ambiant.
6. **Véhicules uniquement sur les voies est-ouest** : ils sont dessinés de profil ; sur une rue nord-sud
   ils sembleraient la traverser. On roule à droite (voie nord vers l'ouest, voie sud vers l'est, testé).
7. **Objets remarquables** : la fontaine, la statue et le kiosque à musique sont des objets d'id
   `lm.fontaine`, `lm.statue`, `lm.kiosque` (désignables, jamais retirés). `World.landmarks[].entityId`
   vaut `lm.<id>` (bâtiments et points) ou `z.<id>` (zones).
8. **Zones qui accueillent des bâtiments** : seuls les Entrepôts du port (12 entrepôts « ENTREPÔT n »
   en deux rangées) et les Jardins ouvriers (cabanes et serres) ont des bâtiments dans leur emprise ;
   toutes les autres zones de lieux restent libres (testé).
9. **Intégration des enquêtes** : ambiant généré sans les enquêtes puis filtré (marge 6 u) ; anti-sosie
   déterministe (graine = id du passant) appliqué aussi aux conducteurs ; `landmarkOverrides` remplace
   l'enseigne et **ajoute** les détails de façade ; id en double = erreur explicite.
10. **Enseignes** : 32 commerces (TABAC, ÉPICERIE, COIFFEUR… CHAPELIER), cafés, bars, hôtels, garages,
    entrepôts ; jamais celles des lieux remarquables (BOULANGERIE, BIJOUTERIE…) pour qu'une enquête
    puisse dire « la boulangerie » sans ambiguïté (testé).

## Limites connues

- **Pas de véhicule sur les rues nord-sud** (voir décision 6). Si l'art ajoute un jour des véhicules
  vus de face/dos (contrat `Facing` à étendre), il suffira de les placer dans `vehicles.ts`.
- Quelques **lieux imposés par le plan directeur** recouvrent l'avenue qui les borde avec leur toit
  (gare, Grand Hôtel et Poste sur le boulevard des Halles, hôpital sur la rue du Faubourg,
  capitainerie sur la route du port). Aucun véhicule ni passant n'y est placé (il serait invisible).
- Les **cours intérieures** sont volontairement assez calmes (quelques arbres, bancs, chats, vélos,
  enfants) : elles servent de décors aux scènes d'enquête.
- Conventions de dessin attendues du module `art` (valeurs libres `variant`/`label`) : pierre tombale
  = `rock` + `variant: 'tombstone'`, sculptures/anges = `statue` + `variant`, planches de légumes =
  `flowerbed` + `variant: 'vegetables'`, vélo garé = `bicycle` sans `driver`. Voir le README du module.
- Dockers et pêcheurs tiennent parfois une corde (`holding: 'rope'`) : si une enquête utilise une corde
  comme indice, la placer hors du port et des quais, ou en tenir compte dans les fausses pistes.
- Sur téléphone, la génération prendra sans doute 0,5 à 1,5 s au démarrage (estimation : 2 à 4 fois
  Node). Pistes si besoin : écran de chargement, génération dans un Web Worker.
- `CLAUDE.md` ne liste que 4 commandes de `npm run world` : les nouvelles (`ground`, `free`, `near`,
  `streets`, `zones`, `lookalikes`) sont documentées en tête de `scripts/world-query.ts` et dans le README.
- Les chiffres (comptes, rues aléatoires) dépendent de la graine ; les tests de fourchettes portent sur
  la graine du jeu, les invariants de sécurité sur 3 autres graines.

## Pour les scénaristes et l'intégration

- Lieux bien visibles pour des scènes : les **cours** entre deux rangées d'immeubles, les squares, le
  boulodrome, les parvis (gare, musée, théâtre, église), les quais, l'allée de service des entrepôts.
- `npm run world -- ground x y` dit si un point est praticable, sur un passage piéton, **caché par un
  toit**, dans quel quartier et près de quelle rue ; `free x y w h` liste des emplacements libres et
  visibles ; `streets <filtre>` donne la géométrie des rues ; `lookalikes <id>` vérifie les sosies.
- Une entité d'enquête posée dans la bande masquée par un toit (`isHiddenByRoof`) sera invisible :
  `validateCase` (module game) peut s'appuyer sur `isHiddenByRoof` et `isWalkable`.

## Comment vérifier

```bash
npx tsc --noEmit                      # le périmètre world est sans erreur
npx vitest run src/world              # 35 tests (≈ 4 s)
npm run world -- stats                # comptes détaillés
node scripts/shot.mjs "/dev/overview.html?labels=1" .shots/ville.png --width 768 --height 576 --dpr 1
node scripts/shot.mjs "/dev/overview.html?x=2300&y=1330&w=1300&h=1000&scale=0.6" .shots/centre.png --width 780 --height 600 --dpr 1
```

Captures conservées : `docs/screenshots/world-overview.png` (ville entière, noms des lieux) et
`docs/screenshots/world-vieille-ville.png` (Grand-Place et Vieille Ville), avec le rendu du module art
tel qu'il était en fin de phase.

## Itérations visuelles (résumé)

1. Premier plan : îlots trop clairsemés (rangées n'utilisant qu'une partie de la profondeur) →
   rangées avant/arrière/milieu selon la profondeur, hauteurs choisies au plus près du budget.
2. Îlot de la Banque transformé en parking par erreur → aucun îlot contenant un lieu ne devient
   square, parking ou boulodrome ; au plus un ou deux squares par quartier.
3. Marché : une cagette sur deux bloquait l'étal suivant → étals d'abord, cagettes ensuite.
4. Trop de réverbères (1 800) et de voitures (485) → réverbères d'un seul côté des rues secondaires,
   stationnement sur une partie des rues seulement : 915 réverbères, ~250 véhicules.
5. Remises de jardin dans les cours urbaines → repli « commerce » / « maison de ville » en ville.
6. Squares : arbres retirés du bord nord (ils masquaient la rue), bateaux tenus à l'écart des ponts,
   passants retirés de l'emprise du kiosque et de la fontaine, barrières des passages à niveau
   réparées, véhicules exclus des zones masquées par un toit.
7. Performance : tables de sommes cumulées (coûteuses à construire) remplacées par un résumé grossier
   de la grille ; vérification exacte des piétons court-circuitée quand la grille est sûre :
   ≈ 450 → 160–250 ms.
