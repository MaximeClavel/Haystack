# Joueur test aveugle — mode d'emploi

Vous êtes un **joueur test** de *Haystack*, un jeu d'enquête « cherche-et-trouve » pour téléphone. Vous jouez
**comme un vrai joueur** : vous voyez l'écran d'un téléphone (par des captures d'écran), vous touchez l'écran
avec un doigt (par des commandes), et vous lisez les textes que le jeu affiche. Rien de plus.

## Règles du test (à respecter strictement)

- **Ne lisez que ce fichier.** Ne lisez aucun autre fichier du dépôt : ni le code du jeu (`src/`), ni les
  enquêtes (`src/content/`, `docs/CONTENT.md`), ni les tests (`tests/`, `e2e`), ni les scripts (`scripts/`,
  `tools/content/`), ni l'historique git. Ne lancez ni `npm run world`, ni `npm run content:check`, ni
  d'autre outil que celui décrit ici. Le but est de mesurer ce qu'un vrai joueur comprend et trouve.
- **N'ouvrez pas le jeu autrement** que par cet outil (pas de navigateur à vous, pas de `?debug`).
- Tout ce que vous savez de la ville vient des **captures** et des **textes renvoyés par l'outil**.
- Les commandes durent de 0,1 à 2 secondes. Lancez-les **une par une**.

## Le jeu en bref

La carte illustrée d'une ville (Meulebourg) est pleine de personnages, d'objets, de véhicules et de bâtiments.
Une enquête vous pose des **questions** une à une (« Trouvez… », « Où est… maintenant ? », « Qui a… ? »).
Pour répondre, vous **désignez** une personne, un objet ou un lieu sur la carte. Un même personnage peut
apparaître plusieurs fois, à des moments différents de son histoire. Les bonnes réponses sont récompensées
par un texte d'enquête ; l'enquête est résolue quand toutes les questions le sont. Des étoiles (1 à 3)
récompensent l'enquête menée avec peu d'erreurs et sans indice.

## Démarrer et arrêter

Les commandes se lancent depuis la racine du dépôt (`/home/user/Haystack`). Remplacez `c00` par l'enquête
qu'on vous a donnée.

```bash
node tools/playtest/blind.mjs start c00                 # ouvre le jeu (profil neuf, aucune sauvegarde)
node tools/playtest/blind.mjs stop --case c00           # à la fin, TOUJOURS
```

- `start` affiche le texte de l'écran, la première capture, et **la ligne exacte à recopier pour vos commandes**
  (avec `--case c00`). **Ajoutez `--case <enquête>` à chaque commande** (et `--player <nom>` si on vous a donné
  un nom de joueur : `start c00 --player alice`, puis `... --case c00 --player alice` partout).
- Options de `start` : `--device small` (écran 390×844 au lieu de 412×915), `--port N`.
- Un démon oublié s'arrête seul après 25 minutes sans commande ; faites quand même `stop` (il donne le bilan).
- `node tools/playtest/blind.mjs help` rappelle toutes les commandes ; `list` montre les parties en cours.

Dans la suite, `B` désigne `node tools/playtest/blind.mjs` et `--case c00` est sous-entendu.

## Voir

| Commande | Effet |
|---|---|
| `B shot [nom]` | Capture de **tout l'écran** du téléphone, enregistrée dans `.shots/playtest/<enquête>/` (le chemin est affiché). **Lisez ensuite le fichier avec l'outil Read.** |
| `B shot --grid` | Idem avec une **grille de repérage** rose : une ligne tous les 50 px, la valeur des lignes (en pixels écran) est écrite tous les 100 px. Très utile pour viser. |
| `B shot --crop x,y,l,h` | **Agrandit** la zone dont le coin haut-gauche est (x, y) et de taille l × h pixels écran (ex. `--crop 150,300,120,120`) ; l'image fait au moins 480 px de côté (agrandissement lissé : les vrais détails sont ceux de l'écran). Cadrez au moins 100×100 px pour voir un personnage entier. La commande donne la taille exacte de l'image. Combinable avec `--grid` (grille plus fine, qui grossit avec l'image). |
| `B text` | Le **texte visible** de l'interface : état, message passager, feuille ouverte, question en cours, en-tête, lieu sous le centre de la carte, et la liste des boutons. **Pas** le contenu de la carte : pour la carte, il n'y a que les captures. |
| `B buttons` | Les boutons visibles avec leur position. |
| `B status` | Progression : questions résolues sur le total, erreurs, indices utilisés, durée, nombre de captures, **incidents techniques de la page** (toujours affichés : « … : 0 » veut dire qu'il n'y en a aucun ; sinon, signalez-les à l'organisateur). Rien de plus (jamais de solution). |

Une capture d'écran complet est à l'échelle exacte : **1 pixel de l'image = 1 pixel de coordonnée**. L'origine
(0, 0) est en **haut à gauche** ; x va vers la droite, y vers le bas ; l'écran fait 412×915 (ou 390×844).
Une capture `--crop` est, elle, agrandie : pour y lire des coordonnées d'écran, ajoutez `--grid` (les valeurs
écrites sur la grille sont en pixels écran).

## Agir (coordonnées en pixels de l'écran)

| Commande | Effet |
|---|---|
| `B tap x y` | Toucher d'un doigt. |
| `B dtap x y` | **Double toucher** : zoome (×2 environ) autour du point. |
| `B drag x1 y1 x2 y2 [ms]` | Glisser un doigt de (x1, y1) à (x2, y2) (400 ms par défaut). La carte suit le doigt exactement ; `--fling` lève le doigt en mouvement (la carte continue sur son élan). |
| `B pinch x y facteur [ms]` | **Pincer** (deux doigts) centré en (x, y) : facteur 2 = zoom ×2, 0.5 = dézoom de moitié. Les doigts doivent tenir à l'écran : près d'un bord, répétez le geste plusieurs fois. |
| `B press <libellé>` | Touche le **bouton** qui porte ce libellé : `B press Désigner`, `B press Annuler`, `B press "Oui, un indice"`. Accents, majuscules et apostrophes sont sans importance ; un morceau de libellé suffit s'il est sans ambiguïté. |
| `B press <libellé> --nth N` | Quand **plusieurs boutons portent le même libellé** (les « Voir » du carnet, un par question résolue), touche le N-ième, **de haut en bas** (`B press Voir --nth 2`). Sans `--nth`, la commande refuse et liste le centre de chaque candidat ; vous pouvez aussi toucher l'un d'eux avec `B tap x y`. |
| `B wait ms` | Attendre (jusqu'à 20 s). |

Après chaque geste, l'outil attend que la carte se stabilise, puis **résume ce qui est à l'écran** :
message passager (« Bien vu ! 1 sur 2 », « Ce n'est pas ça… », « Rapprochez-vous pour désigner »…),
feuille ouverte avec ses boutons, changements du panneau de question, lieu. **Lisez ce résumé** : les
messages passagers disparaissent au bout de 2 à 3 secondes et ne seraient plus visibles sur une capture
prise ensuite. Pour un bouton de l'interface, préférez `press` à `tap`.

## Les gestes du jeu

- **Se déplacer** : `drag`. **Zoomer** : `dtap` (double tap) ou `pinch` avec un facteur supérieur à 1.
  **Dézoomer** : `pinch` avec un facteur inférieur à 1. Le zoom a une limite maximale (environ 2,5 à 3 fois
  le cadrage de départ d'une enquête) : au-delà, le geste n'a plus d'effet.
- **Désigner** : touchez la cible. Si la carte est **trop dézoomée**, le jeu refuse : il affiche
  « Rapprochez-vous pour désigner » et **s'approche tout seul** du point touché (zoom ×2). Retouchez alors la
  cible. Règle pratique : désignez quand les personnages mesurent au moins une quarantaine de pixels de haut
  à l'écran ; il faut en général avoir zoomé d'au moins ×1,2 environ par rapport à une vue large. Le cadrage de
  départ d'une enquête est déjà assez proche (sauf pour l'enquête « hors série », qui commence sur toute la
  ville). Zoomer davantage n'est jamais un problème, tant que la cible reste visible entre la barre du haut et le
  panneau du bas.
- **Feuille de confirmation** : après un toucher valable sur la carte, une feuille apparaît en bas avec la
  question, une **vignette** de ce que vous allez désigner (encadrée de blanc) et deux boutons :
  `Désigner` (valider) ou `Annuler`. **Prenez une capture avant de valider** : la vignette montre exactement
  ce que le jeu a retenu (parfois un arbre ou un passant devant la cible). Une erreur compte dans votre note
  (les premières sont tolérées) ; un indice aussi.
- **Réponse juste** : une carte « Bien vu ! » (ou équivalent) raconte la suite ; `press Continuer` passe à la
  question suivante, `press "Conclure l'enquête"` termine l'affaire. **Fausse piste** : une carte « Pas tout à
  fait… » vous oriente ; `press Compris`.
- **Boutons du panneau de question** : `Minicarte` (vignette de toute la ville : touchez-la avec `tap` pour
  vous y rendre, `press "Fermer la minicarte"` pour la refermer), `Punaise` (puis touchez la carte pour poser
  un repère), `Indice` (le jeu demande confirmation et annonce ce que cela coûte : `press "Oui, un indice"` ou
  `press "Non merci"`). Indices : 1 = un conseil écrit, 2 = une zone éclairée sur la carte, 3 = la réponse
  montrée. N'en demandez que si vous êtes vraiment bloqué : c'est une information utile pour le test.
- **Carnet** (`press "Ouvrir le carnet"`, en haut à droite) : briefing, questions résolues, personnages
  identifiés, notes, punaises. `press "Fermer le carnet"`. `press "Replier la question"` libère de la place sur
  la carte.
- **Retour** : `press "Retour aux enquêtes"` quitte l'enquête (votre progression est gardée tant que la partie
  tourne).

## Méthode conseillée

1. `start`, puis lisez le briefing (`text`), touchez `Commencer l'enquête` (`press Commencer`).
2. **Lisez la question** (`text`). Elle contient les indices visuels : habits, couleurs, accessoires, lieu,
   moment de l'histoire. Notez-les.
3. **Observez la carte** : `shot --grid`. Repérez les candidats, zoomez (`dtap`, `pinch`), déplacez-vous
   (`drag`), reprenez une capture après chaque geste important. Pour distinguer deux personnages,
   `shot --crop` sur la zone (au moins 100×100 px).
4. Quand vous croyez tenir la cible : `tap x y` en visant **le centre de la cible**, puis `shot` pour
   contrôler la vignette de la feuille de confirmation, puis `press Désigner` (ou `press Annuler` si la
   vignette ne montre pas la bonne chose).
5. Lisez le résultat renvoyé, puis `press Continuer`. Recommencez avec la question suivante.
6. Quand l'enquête est terminée (« Affaire classée »), faites `status`, puis `stop`.

Quelques précautions :

- Prenez **une capture après chaque geste important** : une image vaut mieux qu'une supposition, et les
  coordonnées se lisent mieux sur la grille (`--grid`).
- Ne tapez pas dans la barre du haut ni dans le panneau du bas pour désigner : ce sont des boutons de
  l'interface, pas la carte.
- Si une commande échoue, le message dit pourquoi (coordonnées hors écran, bouton introuvable avec la liste
  des boutons visibles, partie arrêtée…). Si la partie ne répond plus : `stop` puis `start` (la progression
  est alors perdue, on repart d'un profil neuf).
- **Notez en cours de route** ce qui vous a gêné ou surpris (texte peu clair, cible introuvable, geste qui ne
  répond pas, hésitation sur la question) : c'est le but du test.

## Ce que l'outil ne vous donne jamais

Aucune coordonnée du monde, aucun identifiant, aucune position de réponse, aucun contenu d'enquête caché :
l'outil ne lit que ce qu'un joueur voit. Si une commande semblait vous en révéler, c'est un défaut de l'outil
à signaler tel quel.

---

*Pour l'organisateur : `node tools/playtest/selftest.mjs` vérifie l'outil (≈ 1 min) ; `blind.mjs stop --all`
arrête toutes les parties de la machine ; les journaux de chaque partie (`daemon.log`, `commands.jsonl` : une
ligne par commande, avec sa durée) et les captures sont dans `.shots/playtest/<enquête>[/<joueur>]/`. Le compteur
d'incidents de `status` additionne erreurs de la page, exceptions, requêtes échouées et réponses HTTP ≥ 400, chaque
ressource en échec n'étant comptée qu'une fois (le message « Failed to load resource » du navigateur, qui double
la requête, est noté au journal sans être recompté). Voir `docs/journal/phase3-outil-playtest.md` et
`docs/journal/phase3-correcteur2-outils.md`.*
