# Phase 3 — Rejeu aveugle de l'enquête c01 « La Main dans le sac » (joueur `c01r`)

Testeur neuf, jeu à l'aveugle (seul `tools/playtest/README.md` lu avant de jouer ; aucun autre fichier du dépôt
consulté, aucun compte rendu précédent lu). Captures dans `.shots/playtest/c01/c01r/`.

## 1. Verdict

| Mesure | Valeur |
|---|---|
| Enquête résolue | **Oui** (« Affaire classée ») |
| Questions résolues | **4 / 4** |
| Erreurs | **0** (aucune fausse piste, aucune carte « Pas tout à fait… » rencontrée) |
| Indices | **0** |
| Étoiles | **3 / 3** (« Aucun indice et au plus 2 erreurs : le maximum ! ») |
| Commandes | 56 (≈ 8 pour Q1, 22 pour Q2, 12 pour Q3, 10 pour Q4, + bilan) |
| Durée | 4 min 53 s |
| Captures prises / images lues | 27 prises, 26 lues (toutes lisibles : `imagesReadable = true`, aucun « media removed ») |
| Incidents techniques de la page | 0 |

Remarque de méthode : une fois (Q2), j'ai enchaîné deux commandes dans un même appel shell (`Fermer la minicarte` puis
`Replier la question`) ; sans conséquence sur le test. Je n'ai pas contrôlé la vignette de la feuille de confirmation
avant `Désigner` pour Q2, Q3 et Q4 (économie d'images) ; la seule vignette regardée (Q1) était exacte.

## 2. Question par question

### Q1 — « Trouvez la boulangère Rose Lemiel : toque blanche et tablier rose, devant sa boutique. »
- **Compris** : il faut désigner une personne, devant une boulangerie ; le briefing disait déjà « boulangerie Lemiel ».
- **Regardé** : la première capture (cadrage de départ) montre directement la façade jaune « BOULANGERIE ». Un crop ×5
  (`003.png`) a montré une boulangère (toque, tablier rose, bulle de colère, bras tendu) et, à côté, un agent
  (képi, baguette, bulle de cœur : Picotin).
- **Tentative** : 1 tap sur la boulangère, vignette contrôlée (`004.png` : bien centrée, cadre pointillé sur elle seule),
  `Désigner` → « Bien vu ! ». Sans erreur.
- **Aidé** : le cadrage de départ est exactement sur la cible ; les bulles (colère / cœur) correspondent au briefing
  (« Rose Lemiel est en colère ») ; le texte de retour décrit le voleur (« grand maigre en pull rayé noir, masque de bandit »).
- **Déductible ?** Oui, trivialement. C'est une bonne question d'accueil.

### Q2 — « Trouvez le voleur dans la foule du marché : bonnet orange, pull rayé noir, masque de bandit… et un sac d'argent à la main. »
- **Compris** : chercher dans une grande foule un personnage avec quatre indices cumulés ; le voleur n'est pas dans
  le cadrage de départ (il faut chercher).
- **Regardé** : j'ai d'abord fait un crop du marché (`005.png`), vu un homme avec bonnet orange + pull rayé noir **les
  bras levés** (`006.png`, `013.png`) : leurre très convaincant mais **sans masque visible (profil) ni sac**. J'ai ouvert la
  minicarte (`007.png` : seulement des noms de quartiers) puis ai fait glisser le plateau vers le sud, scanné la foule en
  4 bandes (crops `009`–`011`), croisé d'autres bonnets orange (rayures violettes, veste noire de dame âgée…), dézoomé, puis
  fait glisser vers l'est. Le vrai voleur est apparu (`015.png`) : en train de **courir**, bonnet orange, masque,
  pull rayé noir, sac « € » à la main (`016.png`).
- **Tentatives** : 1 seul tap, sur le bon personnage (je n'ai pas désigné le leurre : ce qui m'a retenu est l'absence
  de masque et de sac, indices explicitement dans la question). → « Excellent ! … fend la foule vers l'est, en direction de la rue des Étals. »
- **Perdu** : environ 18 commandes de recherche. La zone de recherche (le marché) est vaste (≈ 3 écrans de large au zoom
  de départ) et très dense en bonnets orange (au moins 5 personnages). Le leurre « bras levés » est juste à côté du
  cadrage de départ.
- **Aidé** : le « masque » et le « sac d'argent » sont des critères discriminants nets ; le texte de Q1 prépare ces indices.
- **Déductible ?** Oui, mais seulement en zoomant (le masque et le sac ne se voient bien qu'à l'agrandissement). Il n'y a
  aucune indication de direction dans la question elle-même ; c'est de la recherche pure, la plus coûteuse des 4 questions.

### Q3 — « Plus loin, à l'est du marché, le voleur marche les mains vides. Où a-t-il caché la caisse ? »
- **Compris** : la scène suit l'enquête vers l'est (le texte de retour de Q2 donnait « vers l'est, rue des Étals ») ; il
  faut désigner un **objet** (« Désigner cet objet ? ») où la caisse est cachée.
- **Regardé** : trois glissements vers l'est jusqu'au bord du marché ; l'étiquette de lieu a basculé sur « Rue des Étals »
  (`021.png`). Un crop (`022.png`) montre : le voleur (bonnet orange, rayures, masque, mains vides) qui marche devant un
  immeuble orange, et, contre le trottoir, une **poubelle verte d'où dépasse un sac « € »**. Une autre poubelle grise sans
  sac se trouve plus haut dans la rue.
- **Tentative** : 1 tap sur la poubelle verte (204, 436) → « Exactement ! La recette dépasse d'une poubelle, au coin de la rue. »
- **Aidé** : la phrase « à l'est du marché » + l'étiquette de lieu « Rue des Étals » ; le sac « € » est un indice visuel
  explicite. Le voleur lui-même servait de confirmation.
- **Déductible ?** Oui. Facile une fois dans la bonne rue ; la partie recherche est surtout un déplacement vers l'est.

### Q4 — « Pour se fabriquer un alibi, le voleur fait la queue au cinéma Le Rex. Désignez-le. »
- **Compris** : trouver le cinéma « Le Rex » puis la file d'attente, puis le voleur dedans.
- **Regardé** : au dézoom (`023.png`) une **ligne rouge** (trace du parcours du voleur déjà découvert, avec des repères
  dorés sur la poubelle et le voleur) apparaît sur la carte. J'ai poussé vers l'est ; l'étiquette de lieu est devenue
  « Cinéma Le Rex » (`024.png`) et l'immense enseigne « LE REX » du bâtiment violet est visible. Zoom ×2,5 sur l'entrée
  (`025.png`), crop (`026.png`) : file de 4 personnes, dont le voleur (bonnet orange, masque, pull rayé noir, billet à la main, bulle de musique).
- **Tentative** : 1 tap (337, 470) → « Affaire résolue ! ».
- **Aidé** : l'étiquette de lieu (pastille en haut à gauche) indique le nom du lieu sous le centre de la carte ; l'enseigne
  est lisible de loin ; la file est regroupée sur une seule dalle de trottoir.
- **Déductible ?** Oui. À dézoom large la file est minuscule : il faut zoomer ×2,5 pour reconnaître le voleur.

## 3. Problèmes (classés par gravité)

**Bloquants** : aucun.

**Gênants** : aucun franc. Le plus coûteux est la recherche de Q2 (voir mineurs ; 22 commandes, ≈ 40 % de la partie).

**Mineurs**
1. **Q2 : recherche longue, sans direction ni repère.** Le voleur est à ≈ 1 à 1,5 écran du cadrage de départ, au milieu de
   nombreux bonnets orange ; le seul guidage vient du texte de Q1 (« parti dans le marché »). Le leurre « bras levés »
   (`006.png`, `013.png`) est très proche du cadrage de départ et correspond à 2 critères sur 4 (bonnet orange, rayé noir),
   il tente le tap rapide ; le masque absent (profil) ne se voit qu'à fort zoom. Le design du leurre est bon (discriminant
   par des indices explicites) mais un joueur pressé peut y laisser une erreur (tolérée).
2. **Panneau de question replié = indices tronqués** (`008.png`, `012.png`…) : une fois « replié », le texte devient
   « Trouvez le voleur dans la foule du marché :… » ; les critères distinctifs (masque, sac d'argent) sont coupés par
   l'ellipse, alors qu'on replie justement pour chercher sur la carte. Il faut les mémoriser ou redéplier.
3. **Minicarte (`007.png`)** : n'indique que des noms de quartiers, pas les lieux nommés (« Cinéma Le Rex ») ; pour Q4
   j'ai trouvé le cinéma en poussant vers l'est et en lisant la pastille de lieu, pas via la minicarte.
4. **Vignette de confirmation** non regardée pour Q2–Q4 : pas de défaut constaté, simple choix de budget d'images.
5. **Non testé** : indices (aucun demandé), punaise, carnet, cartes « Pas tout à fait… », puisqu'aucune erreur n'est survenue.

Aucun incident technique (0), aucun geste n'a failli : `drag`, `pinch`, `dtap`, `tap`, `press` se sont tous comportés
comme décrit dans le README.

## 4. Ce qui m'a plu
- Le ton et l'humour des textes (« le seul spectateur masqué de toute l'histoire du Rex », Picotin et sa baguette, le pain terminé avant le commissariat).
- Le fil narratif d'une question à l'autre : chaque « Bien vu ! » donne la direction ou le signalement de la suivante (« vers l'est, rue des Étals »).
- Les leurres bien conçus (bonnets orange, rayures) qui obligent à lire les indices au lieu de taper au hasard ; l'enquête reste honnête : le masque et le sac sont visibles.
- L'étiquette de lieu en haut à gauche (« Rue des Étals », « Cinéma Le Rex ») : un vrai appui d'orientation.
- La vignette encadrée de la feuille de confirmation : rassurante (`004.png`).
- La trace rouge du parcours du voleur et la carte récapitulative derrière l'écran de fin (`fin.png`), l'écran « Affaire classée » avec les 3 étoiles.
- La difficulté progressive : Q1 évidente, Q2 de la recherche, Q3 et Q4 plus guidées.

## 5. Suggestions concrètes et minimales
1. **Q2** : ajouter au texte de retour de Q1 une direction, par exemple « …il s'est enfoncé dans le marché, côté est » (cohérent avec la
   suite) ; ou conserver tel quel si cette difficulté est voulue. Variante : marquer le leurre « bras levés » par un détail
   visible dès le zoom de départ (le masque en haut du visage) pour que le tap rapide soit plus rarement tenté.
2. **Panneau replié** : afficher au moins la 1re ligne complète de la consigne, ou garder les critères en vignette
   (« bonnet orange · rayé noir · masque · sac »).
3. **Minicarte** : afficher le nom des lieux cités par la question en cours (ici « Cinéma Le Rex ») ou les étiquettes de
   lieux nommés à fort dézoom.
4. Garder tel quel : la pastille de lieu, la trace du parcours et la vignette de confirmation, qui ont tous aidé.
