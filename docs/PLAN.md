# Haystack — Plan d'implémentation

> Jeu mobile d'enquête de type « cherche-et-trouve » : le joueur explore la carte géante et très détaillée d'une ville pour reconstituer des affaires criminelles, dans l'esprit du jeu de société *MicroMacro: Crime City*.

Statut : brouillon v0.1 — 14/10/2026

---

## 1. Résumé

- **Le jeu** : une seule grande illustration de ville, zoomable, où des dizaines d'histoires se déroulent en même temps. Chaque enquête pose une série de questions. Le joueur y répond en **désignant** sur la carte la personne, l'objet ou le lieu concerné.
- **Recommandation technique** : Flutter (iOS et Android, un seul code), un moteur de carte « tuilé » maison sur le modèle de Google Maps, des enquêtes décrites en JSON et produites avec un éditeur interne. Pas de backend au lancement.
- **Chemin critique** : c'est l'illustration, pas le code. Le plan prévoit de pouvoir jouer les enquêtes sur des **croquis** dès les premières semaines, avant l'encrage final.
- **Concurrence directe** : l'adaptation officielle *MicroMacro: Downtown Detective* (Soft Boiled Games) est sortie en août 2025. Elle est freemium : 3 enquêtes gratuites, 22 à débloquer par achat intégré, puis une extension de 14 enquêtes sur 2 quartiers. Haystack doit donc se différencier (§3).
- **Durée indicative** : 9 à 12 mois jusqu'au lancement pour 1 développeur et 1 illustrateur·rice. À recaler après la vertical slice.

## 2. Hypothèses de départ

À confirmer (voir §15) :

- **Équipe** : 1 développeur et 1 illustrateur·rice (en freelance, ou le développeur lui-même).
- **Plateformes** : iOS et Android, téléphones et tablettes.
- **Mode de jeu** : solo, entièrement jouable hors ligne.
- **Langues au lancement** : français et anglais.
- **Contenu au lancement** : 1 ville de 3 à 4 quartiers, avec un tutoriel et environ 16 enquêtes.

## 3. Concept et différenciation

### 3.1 Boucle de jeu

1. Choisir une enquête dans les dossiers du commissariat.
2. Lire le briefing. La caméra se pose sur la scène de crime.
3. Pour chaque question (« D'où venait la victime ? », « Où le coupable a-t-il jeté l'arme ? »), explorer la carte et suivre les personnages à travers la ville. Un même personnage apparaît plusieurs fois, à des moments différents. Puis **désigner** la réponse.
4. Si la réponse est juste, la scène est épinglée au dossier, le fil rouge se prolonge sur la carte et la question suivante se débloque.
5. À la fin : la résolution, une **reconstitution** où la caméra rejoue l'histoire dans l'ordre chronologique, et un score en étoiles.

### 3.2 Ce qu'on reprend du genre

- Une carte unique en vue plongeante, très dense (style *wimmelbild*), où le temps est représenté dans l'espace : un personnage apparaît à plusieurs endroits, un par moment de son histoire.
- Des questions qui guident pas à pas, et plusieurs enquêtes entremêlées sur la même carte.

### 3.3 Ce qu'on fait différemment (proposition)

Les critiques de l'app officielle reprochent surtout ses indices : ils reformulent la question et aident peu sur les questions à réponses multiples ([PocketGamer](https://www.pocketgamer.com/micromacro-downtown-detective/review)). C'est une ouverture.

| Piste | Description | Quand |
|---|---|---|
| **Indices progressifs utiles** | Trois niveaux : une piste textuelle, puis un projecteur sur une zone qui se resserre, puis la révélation. Sur une question à réponses multiples, l'indice vise une réponse pas encore trouvée. | MVP |
| **Fil rouge** | Chaque bonne réponse tend un fil entre deux scènes. Le joueur peut aussi poser ses propres punaises et fils d'hypothèse : le dossier devient un tableau d'enquêteur. | MVP |
| **Questions multiples lisibles** | « Trouve les 3 lieux… » avec un compteur 1/3 et les réponses déjà trouvées marquées sur la carte. | MVP |
| **Reconstitution finale** | La caméra rejoue l'histoire dans l'ordre. Plus tard, on pourra l'exporter en vidéo à partager. | MVP (version simple) |
| **Défi du jour « l'aiguille »** | Chaque jour, une description à retrouver dans la ville (« un homme au parapluie troué »). Il suffit d'une zone et d'une phrase : un contenu qui ne coûte presque rien et fait revenir les joueurs. | v1.1 |
| **Aiguilles cachées** | Des objets à collectionner, cachés dans toute la ville (clin d'œil au nom du jeu). | v1.1 |
| **Paysage sonore** | Une ambiance qui suit la zone regardée : marché, port, chantier. | Polish |
| **Identité propre** | Un cadre marqué (par exemple une ville française fictive à une époque précise) et une palette limitée plutôt qu'un pur noir et blanc. | Pré-production |
| **Coopération en ligne** | Deux joueurs sur la même carte, chacun voyant le curseur de l'autre. | Après le lancement |

### 3.4 Propriété intellectuelle (repère, pas un avis juridique)

- Le concept et les mécaniques ne sont pas protégés en tant que tels. Sont protégés : l'illustration, les textes, les personnages, le nom MicroMacro et l'habillage visuel.
- Il faut donc un art, des enquêtes et un nom **entièrement originaux**. Ne pas utiliser « MicroMacro » dans les métadonnées ni les mots-clés des stores : les règles de l'App Store l'interdisent.
- Le nom « Haystack » est déjà très utilisé dans le logiciel (par exemple le framework Haystack de deepset). Il faut vérifier la marque tôt (INPI, EUIPO, USPTO) et prévoir un sous-titre distinctif (« Haystack : … »).

## 4. Périmètre

### 4.1 MVP (lancement)

- **Carte** : une ville de 3 à 4 quartiers, avec un zoom fluide, une minicarte et des transitions de caméra.
- **Enquêtes** : un tutoriel jouable et environ 16 enquêtes, de difficulté 1 à 5.
- **Réponses** : désignation sur la carte (loupe et confirmation). Types de questions : réponse unique, réponses multiples, et QCM (rarement).
- **Indices** à 3 niveaux et score en étoiles.
- **Dossier** : briefing, questions résolues avec vignettes, fil rouge, notes et punaises personnelles.
- **Réglages** : taille du texte, mode gaucher, retours haptiques, son, réduction des animations.
- **Technique** : sauvegarde locale, français et anglais, achats intégrés, statistiques d'usage avec consentement, remontée des plantages.
- **Formats** : téléphone (portrait) et tablette (portrait et paysage).

### 4.2 Hors MVP

Défi du jour, aiguilles cachées, sauvegarde dans le cloud, quartiers d'extension payants, coopération, partage vidéo de la reconstitution, éditeur d'enquêtes ouvert aux joueurs.

## 5. Architecture technique

### 5.1 Choix du framework

| Critère | **Flutter** (recommandé) | Godot 4 | Unity |
|---|---|---|---|
| Nature du jeu : image zoomable et beaucoup d'interface texte | Excellent | Bon | Bon |
| Carte tuilée géante | À coder (CustomPainter) | À coder | À coder (sprites et Addressables) |
| Achats intégrés, statistiques, plantages | Plugins matures | Plus artisanal | Mature |
| Outils internes (éditeur) écrits avec le même code | Oui (desktop ou web) | Possible | Peu pratique |
| Poids de l'app et démarrage | Bons | Très bons | Plus lourds |
| Animations riches sur la carte | Correctes | Très bonnes | Très bonnes |

**Recommandation : Flutter.** Haystack est d'abord une visionneuse d'image géante et une application riche en interface. Le moteur de carte est le seul composant « jeu », et il est bien délimité. Si tu maîtrises déjà Godot ou Unity, l'écart n'est pas rédhibitoire : l'architecture ci-dessous s'y transpose.

### 5.2 Vue d'ensemble

```
┌───────────────────────────── apps/game (Flutter) ─────────────────────────────┐
│ UI : accueil · dossiers · enquête · dossier · fin · boutique · réglages       │
│ État : Riverpod · Navigation : go_router · i18n : gen-l10n (ARB)              │
├────────────────┬──────────────────────────────┬───────────────────────────────┤
│ map_engine     │ haystack_core (Dart pur)     │ data                          │
│ caméra, gestes │ modèles, géométrie,          │ ContentRepository (packs)     │
│ tuiles, cache  │ moteur d'enquête (états),    │ SaveRepository (drift/SQLite) │
│ overlays       │ validation, score            │ StoreService (RevenueCat)     │
└────────────────┴──────────────────────────────┴───────────────────────────────┘
          ▲ tuiles WebP + case.json (embarqués dans l'app ou packs téléchargés)
```

`haystack_core` ne dépend pas de Flutter. Il est donc entièrement testable et partagé entre le jeu, l'éditeur et les outils en ligne de commande.

### 5.3 Organisation du dépôt (monorepo, pub workspaces)

```
Haystack/
├── apps/
│   ├── game/                 # app Flutter iOS/Android
│   └── editor/               # éditeur d'enquêtes (Flutter desktop)
├── packages/
│   ├── haystack_core/        # modèles, géométrie, moteur d'enquête, score
│   ├── map_engine/           # widget de carte tuilée réutilisable
│   └── content_tools/        # CLI : vérification du contenu, création des packs
├── content/
│   ├── maps/<map_id>/map.json
│   └── cases/<case_id>/{case.json, fr.json, en.json}
├── tools/tiler/              # script libvips : image source → pyramide de tuiles
├── art/                      # hors git (sources lourdes) : stockage externe ou LFS
└── docs/
```

Les tuiles sont **générées**, jamais versionnées dans git : elles sont produites par la CI ou par un script, puis publiées.

### 5.4 Bibliothèques pressenties

| Besoin | Choix |
|---|---|
| État | `flutter_riverpod` |
| Navigation | `go_router` |
| Modèles et JSON | `freezed` + `json_serializable` |
| Persistance | `drift` (SQLite) |
| Traductions de l'interface | `flutter gen-l10n` (fichiers ARB) |
| Achats intégrés | `purchases_flutter` (RevenueCat) |
| Plantages | `sentry_flutter` ou Firebase Crashlytics |
| Statistiques d'usage | PostHog (hébergé dans l'UE) ou Firebase Analytics |
| Audio | `just_audio` |
| Loupe | `RawMagnifier` (inclus dans Flutter) |

## 6. Moteur de carte (le composant critique)

### 6.1 Repère et format

- **Coordonnées « carte »** : les pixels de l'image en pleine résolution, avec l'origine en haut à gauche. Les zones, cadrages de caméra et indices sont tous exprimés dans ce repère, indépendant de l'écran.
- **Pyramide de tuiles** : tuiles de 512 px au format WebP, générées avec libvips :
  `vips dzsave ville.tif out --layout google --tile-size 512 --suffix .webp[Q=82]`
  Le résultat est une arborescence `z/y/x`.
- **`map.json`** : identifiant et version, dimensions, taille de tuile, nombre de niveaux, polygones des quartiers, couleur de fond.

### 6.2 Ordres de grandeur (à mesurer pendant le prototype)

| | Quartier tutoriel (MVP) | Ville complète |
|---|---|---|
| Image en pleine résolution | ~8 000 × 8 000 px | ~24 000 × 16 000 px |
| Tuiles au niveau maximal | ~256 | ~1 500 |
| Total de la pyramide (environ +⅓) | ~340 | ~2 000 |
| Poids (30 à 60 Ko par tuile pour du trait encré) | 10 à 20 Mo | 60 à 120 Mo |

**Calibrage de la résolution** : au prototype, afficher le même croquis à deux résolutions et retenir la plus petite où un personnage reste net et identifiable au zoom maximal sur un téléphone de 6,1″.

**Règle pour les auteurs** : tout élément d'indice (visage, accessoire distinctif) doit occuper au moins 40 pt à l'écran au zoom maximal.

### 6.3 Rendu

- **`TileLayer`** (RenderBox ou CustomPainter). À chaque image, il choisit le niveau de détail d'après l'échelle et calcule les tuiles visibles, avec une tuile de marge. Si une tuile manque, il dessine sa **tuile parente agrandie** : jamais de trou blanc.
- **Chargement asynchrone** : décodage en dehors du thread d'interface, tuiles centrales en priorité, annulation des requêtes sorties de l'écran.
- **Cache LRU** avec un budget mémoire adapté à l'appareil (par exemple 96 Mo sur un téléphone d'entrée de gamme, 192 Mo sur un haut de gamme). Un niveau basse résolution reste toujours en mémoire pour servir de fond.
- **Caméra maison** (pas `InteractiveViewer`, pour garder la main) : déplacement, pincement centré sur les doigts, double-tap pour zoomer, inertie (`FrictionSimulation`), rebond aux bords. La méthode `flyTo(point, zoom)` sert au briefing, aux indices et à la reconstitution.
- **Overlays** dans le repère carte : punaises, fil rouge, projecteur d'indice (tout est assombri sauf un cercle), réponses trouvées, zones de debug.
- **Minicarte** : la carte en miniature avec le rectangle de la vue courante. Un tap y déplace la caméra.
- **Objectifs de performance** :
  - 60 images/s constantes sur un Android milieu de gamme de 2021–2022 (type Galaxy A5x) ;
  - 120 images/s sur les écrans ProMotion ;
  - moins de 350 Mo de mémoire ;
  - aucun trou visible pendant un défilement rapide.

### 6.4 Désignation (répondre)

1. **Tap** sur la carte : un réticule apparaît. **Appui long** : une loupe s'affiche au-dessus du doigt pour viser précisément.
2. Une **fiche de confirmation** apparaît, avec une vignette recadrée et un bouton « Désigner ». Il suffit de bouger la carte pour la fermer, donc un tap pendant l'exploration ne gêne pas.
3. **Validation** : le point est accepté s'il est dans le polygone de la zone ou à moins d'une tolérance d'environ 12 pt à l'écran (convertie en pixels carte selon le zoom). Si plusieurs zones sont candidates, la plus proche l'emporte.
4. **Trois résultats possibles** :
   - **juste** ;
   - **« presque »** : la zone est une fausse piste prévue, avec son propre message (« C'est son frère jumeau… regarde le chapeau. ») ;
   - **faux** : un retour neutre.
5. **Contre le tâtonnement** : la confirmation ralentit déjà les essais au hasard. Chaque erreur coûte des étoiles, sans blocage.

## 7. Modèle de contenu

### 7.1 Exemple de `case.json`

```json
{
  "id": "c01_boulangerie",
  "map": "ville@3",
  "difficulty": 1,
  "unlock": { "after": ["c00_tutoriel"], "entitlement": null },
  "intro": { "text": "intro", "camera": { "x": 10240, "y": 8320, "zoom": 0.5 } },
  "zones": {
    "z_vol":          [[10210, 8290], [10290, 8290], [10290, 8380], [10210, 8380]],
    "z_fuite":        [[10880, 8650], [10960, 8650], [10960, 8760], [10880, 8760]],
    "z_jumeau":       [[11420, 9010], [11490, 9010], [11490, 9110], [11420, 9110]],
    "z_cachette_1":   [[12010, 7400], [12090, 7400], [12090, 7480], [12010, 7480]],
    "z_cachette_2":   [[9020, 9900],  [9100, 9900],  [9100, 9980],  [9020, 9980]]
  },
  "steps": [
    {
      "id": "s1",
      "question": "s1.q",
      "answer": {
        "kind": "zone",
        "accept": ["z_fuite"],
        "nearMiss": [{ "zone": "z_jumeau", "feedback": "s1.near_jumeau" }]
      },
      "hints": [
        { "kind": "text", "text": "s1.h1" },
        { "kind": "area", "center": [10900, 8700], "radius": 1500, "shrinkTo": 600 },
        { "kind": "reveal" }
      ],
      "onSolved": { "text": "s1.solved", "thread": ["z_vol", "z_fuite"] }
    },
    {
      "id": "s2",
      "after": ["s1"],
      "question": "s2.q",
      "answer": { "kind": "zones", "required": 2, "accept": ["z_cachette_1", "z_cachette_2"] },
      "hints": [{ "kind": "text", "text": "s2.h1" }, { "kind": "area", "radius": 1200 }, { "kind": "reveal" }]
    }
  ],
  "epilogue": "epilogue",
  "replay": ["z_vol", "z_fuite", "z_cachette_1", "z_cachette_2"]
}
```

Notes sur le format :

- **Types de réponse** :
  - `zone` : une réponse unique, qui peut accepter plusieurs zones (le même personnage dessiné à plusieurs endroits) ;
  - `zones` : trouver N réponses parmi un ensemble ;
  - `choice` : un QCM, réservé au mobile ou au « pourquoi ».
- **`after`** : les étapes forment un graphe sans cycle. Plusieurs fils peuvent donc être suivis en parallèle ; par défaut, l'ordre est linéaire.
- **Textes** : ce ne sont que des clés, traduites dans `fr.json` et `en.json` à côté du fichier. Le même fichier d'enquête sert pour toutes les langues.
- **Indice `area` sans `center`** : il se centre automatiquement sur une réponse pas encore trouvée.
- **Identifiants** : ceux des enquêtes, étapes et zones sont **stables et jamais réutilisés**, car la sauvegarde s'appuie dessus.
- **`map: "ville@3"`** : l'enquête est liée à une version de la carte. Si l'illustration change, l'éditeur signale les zones à vérifier.

### 7.2 Vérification automatique du contenu (`content_tools`, bloquante en CI)

- Le fichier respecte le schéma, et toutes les clés de texte existent dans toutes les langues.
- Les polygones sont valides : au moins 3 points, sans auto-intersection, à l'intérieur de la carte et d'une taille minimale.
- Le graphe d'étapes est sans cycle, et toutes les étapes sont atteignables.
- Chaque étape a au moins 2 indices et une révélation.
- Une alerte est levée si une zone acceptée chevauche une fausse piste ou une autre réponse de la même étape.
- La version de carte référencée existe.

## 8. Production du contenu

### 8.1 Écrire une enquête (bible d'écriture)

- **Fiche personnage** : une silhouette et 2 signes distinctifs bien lisibles (chapeau, sac, motif), plus la liste de ses apparitions dans l'ordre du temps.
- **De la chronologie aux scènes** : on liste les scènes (qui, où, quand, quoi). Les questions poussent vers le maillon suivant, en général en remontant le temps depuis le crime.
- **Leviers de difficulté** : distance entre les scènes, nombre de sosies et de fausses pistes, taille des scènes, densité autour, questions à réponses multiples, fils parallèles.
- **Gabarit** : 4 à 8 questions et 10 à 25 minutes par enquête.
- **Test sur papier d'abord** : imprimer le croquis du quartier en A3 et faire jouer l'enquête avec des questions sur des fiches. C'est le test le moins cher qui soit.

### 8.2 Pipeline de l'illustration au jeu

1. **Plan de ville** : quartiers, rues et repères, sur une grille de blocs de 2 048 px.
2. **Écriture des enquêtes** : chronologies et listes de scènes.
3. **Storyboard spatial** : placer les scènes sur le plan, vérifier les distances et les trajets plausibles, éviter les collisions entre enquêtes.
4. **Crayonné par bloc**, tuilé et **jouable tout de suite en jeu**. C'est le « greybox » : on valide les enquêtes avant d'encrer.
5. **Encrage final et remplissage** : la foule ambiante, les détails et les fausses pistes, c'est-à-dire la « botte de foin ».
6. **Assemblage et tuilage** avec libvips, puis vérification des raccords entre blocs (prévoir des marges de recouvrement en dessinant).
7. **Recalage des zones** dans l'éditeur, puis vérification automatique, puis playtest.

### 8.3 Éditeur d'enquêtes (`apps/editor`)

- **v0, pendant le prototype** : un mode debug dans le jeu. On tape pour poser les sommets d'une zone, puis on exporte le JSON dans le presse-papiers.
- **v1, pendant la vertical slice** : une app Flutter desktop qui lit et écrit directement le dossier `content/` du dépôt. Elle réutilise `map_engine` et `haystack_core` et permet :
  - de lister les enquêtes et d'en éditer les étapes et les textes ;
  - de dessiner et retoucher les polygones sur la vraie carte ;
  - de placer les cadrages de caméra et les indices ;
  - de voir les erreurs de vérification en direct ;
  - de **jouer l'enquête depuis n'importe quelle étape**.
- **v2** : comparaison entre deux versions de la carte, et import des cartes de chaleur des erreurs des joueurs (§11).
- **Circuit** : contenu dans git, puis vérification en CI, puis création des packs, puis publication sur le CDN.

Si l'éditeur desktop prend trop de temps, une alternative rapide pour dessiner les zones est une page web avec Leaflet en mode `CRS.Simple` et le plugin Geoman, qui exporte le même JSON.

## 9. Expérience utilisateur : écrans clés

- **Commissariat (accueil)** : les dossiers classés par quartier, chacun avec son état (nouveau, en cours, résolu, étoiles).
- **Enquête (carte en plein écran)** :
  - la question dans un bandeau en bas, qu'on peut replier ;
  - des boutons Indice, Dossier et Minicarte ;
  - toute la carte reste libre pour les gestes.
- **Dossier** : briefing, réponses avec vignettes, fil rouge, notes et punaises.
- **Fin d'enquête** : reconstitution, étoiles, accès à l'enquête suivante.
- **Tutoriel jouable** : on y apprend à zoomer, à suivre un personnage, à désigner et à utiliser un indice.
- **Boutique, réglages**, et l'écran de consentement aux statistiques.

**Accessibilité** :
- respect de la taille de texte choisie dans le système ;
- VoiceOver et TalkBack sur toute l'interface hors carte ;
- mode gaucher et réduction des animations ;
- sous-titres pour les sons.

La carte reste par nature visuelle : c'est une limite assumée du genre.

## 10. Modèle économique

**Recommandation : gratuit avec un déverrouillage unique.** C'est le standard du genre, et c'est aussi le modèle de l'app officielle.

- **Gratuit** : le tutoriel et 3 enquêtes du premier quartier.
- **Achat unique** (5 à 10 €, à affiner) : la ville complète.
- **Plus tard** : des quartiers d'extension (3 à 5 €) et le défi du jour, gratuit, pour faire revenir les joueurs.
- **Pas de publicité**, qui casserait l'ambiance contemplative. **Pas de monnaie virtuelle** : les indices restent gratuits et coûtent seulement des étoiles.
- **Côté technique** : RevenueCat gère la validation des reçus sans backend, la restauration des achats et les droits. Il y a un droit `full_city`, puis un par extension.

## 11. Services, données et distribution

- **Aucun serveur applicatif** au lancement.
- **Contenu** :
  - le quartier tutoriel est **embarqué dans l'app** ;
  - les autres quartiers sont des **packs** ZIP (tuiles et enquêtes), vérifiés par empreinte, listés dans un manifeste versionné et servis par un CDN (par exemple Cloudflare R2) ;
  - avantage : on peut corriger un texte ou une zone sans repasser par la validation des stores, car le contenu est de la donnée, pas du code.
- **Sauvegarde** : locale (drift) au lancement. Sauvegarde dans le cloud en v1.1 (iCloud, Google Play Games ou Firebase).
- **Statistiques d'usage** (avec consentement, RGPD) :
  - événements : `case_started`, `step_answered {correct, x, y, zoom, durée}`, `hint_used {niveau}`, `case_completed {étoiles, durée}`, `purchase` ;
  - les **cartes de chaleur des erreurs par étape** seront le principal outil d'équilibrage des enquêtes.
- **Plantages** : Sentry ou Crashlytics.
- **CI/CD** :
  - GitHub Actions : formatage, analyse statique, tests, vérification du contenu, builds ;
  - Fastlane ou Codemagic pour publier sur TestFlight et sur la piste de test interne de Google Play.

## 12. Qualité et tests

- **`haystack_core`** : tests unitaires exhaustifs (géométrie, machine à états, score, lecture du JSON). C'est toute la logique de jeu.
- **`map_engine`** : tests des calculs (choix du niveau, tuiles visibles, conversions écran ↔ carte) et tests « golden » (comparaison d'images) sur les overlays.
- **Écrans** : tests de widgets sur les écrans clés, et un test d'intégration qui joue le tutoriel de bout en bout.
- **Contenu** : vérification automatique en CI, bloquante.
- **Performance** :
  - profilage régulier sur un Android d'entrée de gamme de référence et sur un vieil iPhone ;
  - un scénario automatisé de déplacements et de zooms qui mesure les images perdues.
- **Playtests** : à chaque jalon, 5 joueurs qui ne connaissent pas le jeu. On les observe sans les aider, et on mesure le temps par étape, les indices et les erreurs.

## 13. Feuille de route

Les phases 0 et 1 peuvent avancer **en parallèle** : l'illustrateur·rice prépare le style et le plan de ville pendant que le moteur se construit.

### Phase 0 — Pré-production (3 à 4 semaines)

- Bible : l'univers, la ville (lieu, époque), le ton, les personnages récurrents.
- Trois pistes de style graphique sur une même scène, puis un choix.
- Plan de la ville, écriture du tutoriel et de 3 enquêtes, test sur papier en A3.
- Vérification du nom et de la marque, et choix définitif du framework (un essai de 2 à 3 jours en cas de doute).
- **Livrables** : un document de game design court, le style validé, 4 enquêtes écrites, le plan de ville.

### Phase 1 — Prototype technique (4 à 5 semaines)

Les premières tâches de développement, dans l'ordre :

1. Le monorepo Flutter (pub workspaces), les règles d'analyse, la CI GitHub Actions.
2. `haystack_core` : modèles et lecture du JSON, géométrie, moteur d'enquête, avec leurs tests.
3. `tools/tiler` : le script libvips, testé sur une grande image.
4. `map_engine` : caméra et gestes, couche de tuiles avec cache et repli sur la tuile parente, overlay de debug (images/s, tuiles chargées, mémoire).
5. La désignation : tap ou loupe, confirmation, validation contre les zones.
6. Le mode debug de saisie des zones (éditeur v0).
7. Un écran d'enquête minimal qui joue une enquête de test de bout en bout, avec les 3 niveaux d'indices.
8. Des mesures sur de vrais appareils.

**Critères de sortie** :
- 60 images/s et aucun trou sur l'Android de référence ;
- la mémoire reste dans le budget ;
- 5 testeurs comprennent seuls comment répondre.

### Phase 2 — Vertical slice (6 à 8 semaines)

- Le quartier 1 en art final : d'abord le croquis joué en jeu, puis l'encrage.
- Le tutoriel et 3 enquêtes jouables, avec le dossier, le fil rouge, une reconstitution simple, les étoiles, la sauvegarde, le français et l'anglais, et des sons de base.
- L'éditeur v1 et la vérification du contenu en CI.
- TestFlight et piste de test interne Google Play, avec 15 à 30 joueurs et les statistiques actives.
- **Mesurer le coût réel de l'illustration par bloc**, puis recaler le calendrier de production.

**Critères de sortie** :
- plus de 80 % des testeurs terminent le tutoriel ;
- plus de 60 % terminent l'enquête 1 ;
- les retours disent en substance « je veux la suite ».

### Phase 3 — Production (4 à 6 mois, au rythme de l'illustration)

- Quartiers 2 à 4 et environ 12 enquêtes de plus, en enchaînant croquis, test en jeu et encrage.
- Achats intégrés, boutique, accueil des nouveaux joueurs, réglages, accessibilité, tablette et paysage.
- Paysage sonore, finitions des animations, retours haptiques.
- Équilibrage grâce aux cartes de chaleur, et relecture complète du contenu.

**Critères de sortie** :
- le contenu est complet et la vérification automatique ne lève aucune alerte ;
- plus de 99,5 % des sessions se déroulent sans plantage.

### Phase 4 — Lancement (4 à 6 semaines)

- Fiches des stores (captures, vidéo, optimisation du référencement en français et en anglais), politique de confidentialité, classification par âge (PEGI/IARC), dossier de presse.
- Lancement test de 2 à 3 semaines dans un marché restreint (par exemple la Belgique, la Suisse ou le Québec), puis ajustements, puis lancement mondial.
- Demande de mise en avant à Apple et Google. Ils mettent volontiers en avant les jeux soignés sans publicité.

### Phase 5 — Après le lancement

- **v1.1** : défi du jour, aiguilles cachées, sauvegarde dans le cloud.
- **Extensions** : de nouveaux quartiers payants, la ville s'agrandit.
- **v2** : coopération en ligne, et peut-être un éditeur d'enquêtes ouvert aux joueurs.

**Total estimé : 9 à 12 mois jusqu'au lancement.**

## 14. Risques

| Risque | Impact | Parade |
|---|---|---|
| Illustration plus lente ou plus chère que prévu | Élevé | Croquis jouables dès le début ; MVP limité à 3 quartiers ; mesure réelle du coût pendant la vertical slice ; style au trait rapide à produire ; bibliothèque de figurants variés pour la foule |
| Détails illisibles sur petit écran | Élevé | Calibrage de la résolution au prototype ; taille minimale des indices ; loupe ; tests sur un écran de 5,4″ |
| Réponses ambiguës ou injustes | Moyen | Plusieurs zones acceptées ; fausses pistes avec un message dédié ; cartes de chaleur ; playtests |
| Performance et mémoire sur Android d'entrée de gamme | Moyen | Budget de cache adapté à l'appareil ; mesures dès la phase 1 |
| Concurrence de l'app officielle | Moyen | Différenciation (§3.3) ; cadre et langue française ; indices de qualité |
| Contenu consommé trop vite | Moyen | Éditeur efficace ; défi du jour peu coûteux ; extensions |
| Nom ou marque indisponible | Faible à moyen | Recherche INPI/EUIPO/USPTO en phase 0 ; sous-titre distinctif |

## 15. Décisions ouvertes

1. **Qui dessine, et avec quel budget ?** Toute la durée du projet en dépend.
2. **Quel cadre et quelle direction artistique ?** Ville réelle ou fictive, époque, palette.
3. **Quel framework ?** Flutter est recommandé. As-tu déjà de l'expérience en Godot ou Unity ?
4. **Quel modèle économique ?** Gratuit avec déverrouillage unique (recommandé) ou payant dès le téléchargement.
5. **Quelles langues au lancement ?**
6. **Quel nom définitif, et quel sous-titre ?**

## Sources

- [MicroMacro: Downtown Detective — App Store](https://apps.apple.com/app/id6639613950)
- [MicroMacro launches as a smartphone app — Graphic Policy (08/2025)](https://graphicpolicy.com/2025/08/12/micromacro-launches-as-a-smartphone-app/)
- [Test de MicroMacro: Downtown Detective — PocketGamer](https://www.pocketgamer.com/micromacro-downtown-detective/review)
- [Extension de MicroMacro: Downtown Detective — PocketGamer](https://www.pocketgamer.com/micromacro-downtown-detective/expansion-one)
