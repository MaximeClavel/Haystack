# Phase 2 — agent `integration` : vérification et consolidation

Date : 14/10/2026. Travail mené en parallèle de l'agent `ui` (aucun fichier de `src/ui`, `src/main.tsx`,
`index.html` ni `public/` touché). Périmètre utilisé : `src/art/vehicle.ts` et petits nettoyages de `src/art`,
`src/world/generate.ts` (+ test) et nettoyages de `src/world`, `scripts/perf-map.mjs`, en-têtes de
`tools/content`, documentation (`docs/ARCHITECTURE.md`, `README.md`, `CLAUDE.md`, README des modules).

## 1. État de départ

| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | OK au départ. En fin de mission, les seules erreurs viennent de `src/ui` (fichiers en cours d'écriture par l'agent `ui` : `./screens/HowTo`, `./screens/Settings` pas encore créés) ; tout le reste compile. |
| `npx vitest run` | 277 tests verts au départ → **278** (un test ajouté) |
| `npm run content:check` | « OK : aucun problème » (7 notes informatives, inchangées) |
| Contrats | `src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts` identiques depuis la phase 0 (`git log`) ; non modifiés ici non plus |

## 2. Performance réelle (dessin définitif)

Mesures dans le conteneur (4 cœurs, Chromium **sans GPU**), Pixel 7 émulé (412 × 839, densité moteur 2),
avec `node scripts/perf-map.mjs`. Comparaison avec `docs/journal/phase1-engine.md` (art alors en cours de finition) :

| | Phase 1 (×1) | Phase 2 (×1) | Phase 1 (×4) | Phase 2 (×4) |
|---|---|---|---|---|
| images mesurées | 1 471 | 1 487–1 490 | 1 084 | 1 109–1 137 |
| intervalle p50 | 16,7 ms | 16,7 ms | 33,3 ms | 33,2 ms |
| intervalle p95 | 16,8 ms | 16,7–16,8 ms | 66,7 ms | **50,0–50,1 ms** |
| intervalle max | 83 ms | 67–117 ms | 333 ms | 117 ms |
| images > 33 ms | 2 | 1–5 | 408 | 266–270 |
| JS moteur p95 / max | 9,1 / 22,5 ms | 9,0–9,5 / 36–53 ms | 22,2 / 125 ms | 20–22 / 72–78 ms |
| rendu moyen d'une tuile | 6,7 ms | 6,1 ms | ≈ 35 ms | 29,5–31,2 ms |

Deux passages (avant et après mes corrections) donnent les mêmes chiffres au bruit près. **La carte n'est pas
moins fluide qu'en phase 1** (plutôt un peu mieux à ×4) : objectif ×1 (p95 < 20 ms) atteint ; à ×4, le glisser
reste à 60 images/s (p95 16,7 ms), pincer et vols tombent à 30 images/s comme en phase 1 (coût de composition
du canevas plein écran par le GPU logiciel du conteneur, déjà analysé par `engine`). Aucune optimisation
nécessaire.

Entités par tuile (monde avec enquêtes) : niveau −4 (ville entière, 4 tuiles de 4 096 u) ≈ 2 100 en moyenne et
4 836 au plus ; −3 : 717 ; −2 : 255 ; −1 : 74 (max 284) ; 0 : 23 (max 116) ; 1 : 7 (max 39) ; 2 : 3 (max 18).
Une entité est dessinée en moyenne dans 1,0 à 1,7 tuile selon le niveau (2,6 au niveau 2) : aucun excès.

### Démarrage (construction du monde + premier rendu)

Nouveau mode `node scripts/perf-map.mjs --startup [--rates 1,4] [--repeat N]` : dans une page neuve (Pixel 7),
mesure `buildWorld({ cases: CASES })` **à froid** (cache et JIT vides), puis `createMapView` → `whenIdle()` à la
vue « ville entière », puis une vue de jeu (départ de c00, zoom 2). Les modules sont chargés avant le
ralentissement CPU (en développement, Vite sert des centaines de modules un par un, ce qui n'est pas
représentatif du paquet de production).

| Médiane (pages neuves) | ×1 (3 puis 5 pages) | ×4 (3 puis 5 pages) |
|---|---|---|
| `buildWorld({ cases })` à froid | 211 / 211 ms | **864 / 951 ms** (extrêmes 733–1 117) |
| idem, monde ambiant déjà en cache | 34 / 31 ms | 138 / 152 ms |
| premier rendu complet, ville entière | 133 / 130 ms | **537 / 652 ms** |
| puis vue de jeu (c00, zoom 2) | 167 / 150 ms | 949 / 975 ms |

Démarrage au ralenti ×4 : **≈ 1,4 à 1,6 s** (construction + premier rendu), sous le seuil de ~2 s : pas
d'optimisation entreprise. Profil Node de `buildWorld` (≈ 260 ms dans un processus froid) : coût réparti,
sans point chaud simple — foule 55 ms, sol 46 ms, remplissage des îlots 39 ms, intégration des enquêtes 35 ms,
grille d'occupation 22 ms, ramasse-miettes ≈ 50 ms. Toute optimisation du générateur devrait garder un monde
**identique au bit près** (sinon les scènes placées à la main bougent) : à n'envisager que si un vrai
téléphone le justifie. Pistes alors : génération dans un Web Worker (il faudrait sérialiser le monde et
reconstruire l'index), ou monde ambiant précalculé au build.

**Pour l'interface** : `buildWorld` est un calcul **synchrone** d'environ 0,9 s sur un téléphone moyen. Afficher
d'abord l'écran de chargement, laisser le navigateur le peindre (`requestAnimationFrame` puis `setTimeout(…, 0)`),
puis construire le monde ; ne pas l'appeler au chargement du module.

## 3. Contrôle visuel (téléphone 390 × 844, densité 2)

Vues capturées et lues (`dev/map.html?hud=0`) : Grand-Place zoom 2, Halles zoom 1,5, port zoom 2, ville
entière, scènes de départ des 6 enquêtes (c00 à c05, coordonnées de `docs/CONTENT.md`), centre aux zooms 0,55
et 0,28 (niveaux de détail 1 et 2), gare zoom 1, cimetière zoom 1,5, jardins ouvriers zoom 1, Hôtel de Ville
zoom 4, capitainerie zoom 2,3 (tuiles agrandies ×1,15), et les trois véhicules à porte ouverte au zoom 4.
Ensemble net et cohérent ; **aucun raccord de tuile visible**, aucun trou, ordre de dessin correct (gens
devant les façades, réverbères devant le bus, bustes aux fenêtres, objets d'enquête lisibles).

### Défauts trouvés et corrigés

1. **Nom du véhicule masqué par la porte ouverte** (`src/art/vehicle.ts`) — l'ouverture de la porte latérale
   (rectangle sombre) était dessinée par-dessus l'inscription peinte : le fourgon de c02 affichait
   « LES BARBARIE » au lieu de « VOLAILLES BARBARIE » (or un indice dit « Un véhicule à son nom est garé sur
   le boulevard »), celui de c03 « OLICE », l'ambulance de l'hôpital « SA… ULANCE ». Correction : porte
   ouverte = ouverture contre la cabine (fourgon x ∈ [1,5 ; 12], ambulance [6 ; 14]) et inscriptions repliées
   sur le reste de la caisse (fourgon : centre −13,5, largeur 23 au lieu de 26 ; ambulance : « SAMU » entre la
   croix et l'ouverture, « AMBULANCE » décalé). Tout reste dans la carrosserie (contrôle des emprises de la
   galerie : 17 394 rendus, **0 débordement**). Vérifié au zoom 4 : `docs/screenshots/integration-fourgon-c02.png`.
2. **Arbres plantés sur la chaussée** (`src/world/generate.ts`) — audit de toutes les entités (sol sous le
   pied) : 14 arbres (13 avec les enquêtes) avaient le pied sur la route : 13 dans les bosquets du parc, en
   plein **boulevard des Halles** qui traverse le parc (le contrôle de `areas.ts` évitait allées et eau, pas la
   chaussée), 1 arbre d'alignement au bord de la rue de Traverse (en biais). Correction **sans effet de bord** :
   un garde-fou final retire ces arbres **après** toute la génération (la grille d'occupation garde leur trace).
   Vérifié par comparaison avec le monde de `HEAD` : seules ces 13–14 entités disparaissent, **0 entité
   modifiée ou déplacée**, sol identique, ids inchangés. Test ajouté (`world.test.ts` : « aucun arbre n'a le pied
   sur la chaussée ni dans l'eau »). `content:check` toujours OK. Capture : `docs/screenshots/integration-boulevard-parc.png`.

L'audit n'a rien trouvé d'autre : aucune personne, aucun objet ni véhicule dans l'eau, dans un bâtiment ou
caché sous un toit ; aucune personne sur la chaussée hors passage piéton ; bateaux tous sur l'eau.

### Constats documentés (non corrigés)

- **Arbres devant des enseignes** : 78 arbres masquent plus de 8 × 8 u d'une façade, dont 48 façades à
  enseigne (ex. c05 : l’enseigne « ATELIER » à moitié cachée par deux arbres de cour ;
  alignements du trottoir sud qui montent devant les boutiques au nord des Halles). **Aucune façade de lieu
  remarquable** (`lm.*`) n'est concernée, donc aucun indice d'enquête. Corriger demanderait de changer le
  placement des arbres dans le générateur (donc les tirages aléatoires et les positions de toute la foule en
  aval) : à faire, si on le souhaite, avant la phase 3, avec le même procédé qu'au point 2 (retrait final des
  arbres fautifs) pour ne rien déplacer d'autre.
- **Vendeurs des Halles** : leur tête dépasse un peu au-dessus de l'auvent de l'étal (ils sont volontairement
  derrière le comptoir). Lisible, assumé.
- **Capitainerie** : dessinée avec le style générique de commerce (vitrine pleine de marchandises) ; toit qui
  déborde sur la route du port (déjà documenté par `world`).
- **Toit du théâtre** : grand aplat ardoise sans équipement à zoom 1,5 (c05). Sobre mais correct.
- **Ville entière en portrait** : la ville n'occupe qu'un tiers de la hauteur de l'écran (rapport 4:3 du monde).

## 4. Documentation et nettoyage

- `docs/ARCHITECTURE.md` : API **réelles** (§ 4) — `CaseSession(def, world, progress?, opts?)` et toutes ses
  méthodes, exception « décor » de `pickAt`, `EngineMapView.debugStats()` / `invalidateTiles()` et exports purs
  du moteur, utilitaires du monde (`groundAt`, `isWalkable`, `buildingAt`, `onCrosswalk`, `isHiddenByRoof`,
  `entitiesAt`, `appearanceDistance`, `findFreeSpots`, `worldMeta`, `ambientWorld`), module `content` (`CASES`,
  `common.ts`, `meta.ts`, `docs/CONTENT.md` généré) et outils `tools/content` ; pipeline de rendu précisé
  (règle de niveau, racine, budgets, entités par tuile) ; conventions d'ids (objets remarquables) ; pages de
  développement ; journal des changements de contrat (aucun) ; nouvelles sections « Performance » et « Outils
  de vérification ».
- `README.md` : commandes utiles (dont `content:check`, `content:doc`, `world`, `shot`, `perf-map`), pages de
  développement, organisation des dossiers. `CLAUDE.md` : `content:check`, `content:doc`, `perf-map.mjs`.
- README des modules : `src/engine/README.md` (`--startup`), `src/art/README.md` (portes ouvertes),
  `src/world/README.md` (garde-fou final, test). En-têtes de `tools/content` : « brouillons » → « publiées ».
- **Code mort retiré** (jamais référencé, vérifié par recherche dans `src`, `scripts`, `tools`, `tests`,
  `dev`) : `INK_SOFT`, `rowsTex`, `torsoLen`, `drawText`, `beginInk`, `lerp` (art) ; `countByDistrict`,
  `vehicleBase`, `containsRect`, `projectOnSegment`, `RIVER_RECT`, `RAIL_RECT` (world) ; imports devenus
  inutiles. `SERIF_STACK` (art) est gardé et désormais utilisé par les enseignes à empattements au lieu d'une
  chaîne recopiée. Le seul code « provisoire » restant est `src/main.tsx` (phase 0), hors de mon périmètre :
  il est remplacé par l'agent `ui`. `src/content/common.ts` garde un commentaire obsolète (« À recopier dans
  src/content/common.ts… ») : hors périmètre, à retoucher par qui modifiera le contenu.

## 5. Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Démarrage | Pas d'optimisation du générateur | 1,4–1,6 s à ×4, sous le seuil ; le coût est réparti et toute modification risquerait de déplacer le monde |
| Arbres sur la chaussée | Retrait final, après génération | Corrige le défaut sans déplacer ni renuméroter quoi que ce soit (prouvé par comparaison avec `HEAD`) |
| Arbres devant les enseignes | Documenté, non corrigé | Aucun lieu remarquable concerné ; décision de direction artistique, pas de correction sûre évidente |
| Porte ouverte | Ouverture contre la cabine, inscription sur le reste de la caisse | Le nom peint est un indice d'enquête : il doit rester lisible en entier |
| Mesure du démarrage | Modules chargés avant le ralentissement | Le serveur de développement n'est pas représentatif du paquet de production |

## 6. Comment vérifier

```bash
npx tsc --noEmit                          # (hors fichiers en cours de src/ui) aucune erreur
npx vitest run                            # 278 tests
npm run content:check                     # OK : aucun problème
node scripts/perf-map.mjs                 # fluidité ×1 et ×4 (≈ 4 min)
node scripts/perf-map.mjs --startup       # démarrage ×1 et ×4 (3 pages neuves par taux)
node scripts/shot.mjs "/dev/map.html?hud=0&x=5300&y=1285&zoom=4" .shots/fourgon.png --width 390 --height 300   # « VOLAILLES BARBARIE » entier
node scripts/shot.mjs "/dev/map.html?hud=0&x=4950&y=1290&zoom=1" .shots/boulevard.png --width 390 --height 400 # boulevard du parc dégagé
node scripts/shot.mjs "/dev/gallery.html?section=check" .shots/check.png --width 1200 --height 400 --dpr 1    # AUCUN débordement
```

Captures conservées : `docs/screenshots/integration-fourgon-c02.png`, `integration-boulevard-parc.png`,
`integration-c05-telephone.png` (scène de départ de c05 sur téléphone, avec l'enseigne « ATELIER » partiellement
cachée par des arbres de cour).
