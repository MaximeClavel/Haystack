# Phase 3 — Joueur test aveugle : enquête c01 « La Main dans le sac »

Joueur : `--player c01`, appareil par défaut (Pixel 7, 412×915). Seul `tools/playtest/README.md` a été lu avant la fin
de la partie. Captures : `.shots/playtest/c01/c01/` (numérotées `NNN.png`), journal des commandes :
`.shots/playtest/c01/c01/commands.jsonl`.

## 1. Verdict

- **Enquête résolue : oui** (« Affaire classée », capture `057.png`).
- Questions résolues : **4 / 4**. Erreurs : **0** (aucune fausse piste, aucun « Ce n'est pas ça »). Indices : **1** (indice 1/3, question 3).
- Étoiles : **2 sur 3** (la 3e perdue uniquement à cause de l'indice, annoncé clairement avant validation : « Votre note passera de 3 à 2 étoiles au plus »).
- Commandes : **106** (+ `stop`) dont 57 captures, 17 `press`, 10 `drag`, 10 `pinch`, 4 `dtap`, 4 `tap`, 2 `text`, 2 `status`.
  Durée mesurée par l'outil : **7 min 52 s**. Durée ressentie : un peu longue, entièrement due à la question 3.
- Répartition des commandes par question : Q1 = 5, Q2 = 23, **Q3 = 56 (46 avant l'indice, 9 après)**, Q4 = 10.
- Technique : les 107 lignes de `commands.jsonl` sont `ok: true`, 0,5 à 1,8 s par commande (moyenne 0,8 s), `status` n'a signalé
  aucun incident de page, `daemon.log` ne contient aucune erreur. Aucune lenteur ressentie, même à fort dézoom (marché entier
  et foule visibles) : la carte reste fluide.

Limite du test : ayant lu le README, je connaissais les gestes (double toucher, pincer, « Rapprochez-vous… ») ; l'apprentissage
des gestes par un vrai débutant n'est donc pas évalué ici.

## 2. Question par question

### Q1 — « Trouvez la boulangère Rose Lemiel : toque blanche et tablier rose, devant sa boutique. » (5 commandes, 1 tentative)
- Compris : une personne précise, devant une boulangerie. Le briefing mentionne « la boulangerie Lemiel » et le « quartier des Halles ».
- Regardé : la caméra de départ montre déjà une façade « BOULANGERIE » avec, devant, un personnage à toque blanche et tablier
  rose, bulle de colère (cohérent avec « Rose est très en colère »), et à côté le brigadier à la bulle cœur (cohérent avec le briefing).
  Un `shot --crop` a suffi pour confirmer (`003.png`), `tap`, vignette correcte (`004.png`), `Désigner`.
- **Déductible : oui, immédiatement.** Excellente première question : cadrage de départ, indices textuels et visuels alignés, bulles
  d'humeur qui servent le récit. Le texte de réussite (« Au voleur ! Un grand maigre en pull rayé noir, avec un masque de bandit ! »)
  prépare bien la question suivante.

### Q2 — « Trouvez le voleur dans la foule du marché : bonnet orange, pull rayé noir, masque de bandit… et un sac d'argent à la main. » (23 commandes, 1 tentative, 0 erreur)
- Compris : repérer, dans une foule, un personnage cumulant 4 attributs.
- Regardé : la vue de départ ne contient pas le voleur ; le marché est très grand (plus de 3 écrans à zoom 1). J'ai d'abord
  trouvé deux sosies : (a) un homme masqué à pull rayé **bleu et blanc**, mallette marron, bulle « ? » (`009.png`) ; (b) un
  personnage à bonnet orange et pull rayé noir et blanc, **bras en l'air, sans masque ni sac** (`011.png`). Plus tard, un
  troisième (bonnet orange, manteau noir, pantalon bleu, `037.png`) à l'autre bout du marché. Le vrai voleur est en train de
  **courir** près du bord nord du marché, bonnet orange + masque + pull rayé noir + sac « $ » (`019.png`), repéré en balayant
  par `shot --crop` à zoom moyen.
- **Déductible : oui**, parce que la question donne 4 critères et que les sosies n'en ont que 2 ou 3 (très bien conçu :
  chaque sosie échoue sur un critère visible et listé). Mais il faut un peu de chance/méthode pour tomber dessus : aucun
  indice de zone dans la question (« dans la foule du marché » seulement), et le texte de Q1 dit « dans le marché ».
  Le sac est minuscule à zoom 1 ; c'est le zoom + crop qui le révèle.

### Q3 — « Plus loin, le voleur marche les mains vides. Où a-t-il caché la caisse ? » (56 commandes, 1 tentative, 0 erreur, **1 indice**)
- Compris (après réflexion) : le voleur réapparaît « plus loin » sans son sac ; il faut trouver où le sac est caché,
  donc probablement un objet/lieu sur son chemin. **Rien dans la question ne dit où est ce « plus loin »**.
- Regardé : le texte de réussite de Q2 parle de « la rue des Étals » ; je l'ai cherchée en vain. Je n'ai vu **aucun nom de rue sur
  la carte**, ni dans la minicarte (qui n'affiche que les noms de quartiers : Les Halles, Parc des Meules, Vieille Ville…),
  ni dans la pastille de lieu (qui affiche « Les Halles » quand le centre est sur une rue). J'ai donc balayé le marché entier
  (6 crops à zoom moyen, `032`–`045`), croisé encore des sosies (bonnet orange tenue orange/violette, bonnet orange tenue jaune
  et noire…) sans trouver de voleur mains vides, car il n'est **pas dans le marché**.
- Après 46 commandes : **indice 1** (« Il a traversé la rue des Étals, à la sortie est du marché. »). Ensuite 9 commandes :
  j'ai dézoomé, glissé vers l'est, zoomé sur la rue le long de la maison orange, repéré le voleur masqué mains vides
  (`048.png`) puis, juste à côté, une **poubelle verte dont dépasse un sac « € »** (`049.png`) ; confirmation par la vignette
  (`050.png`) et validation.
- **Déductible : non sans l'indice** (tâtonnement pur). Avec l'indice, c'est limpide et le moment est très satisfaisant.
  Le texte de réussite (« La recette dépasse d'une poubelle, au coin de la rue. ») est cohérent avec ce que je voyais.

### Q4 — « Pour se fabriquer un alibi, le voleur fait la queue au cinéma Le Rex. Désignez-le. » (10 commandes, 1 tentative, 0 erreur)
- Compris : retrouver le cinéma, puis le voleur dans la file.
- Regardé : en glissant vers l'est depuis la rue, la pastille de lieu a affiché « Cinéma Le Rex · Les Halles » (`052.png`) ;
  façade violette avec enseigne « LE REX » bien lisible, file de 4 personnes devant la porte. Seul le 3e est masqué, bonnet orange,
  pull rayé (`054.png`). Vignette correcte (`055.png`).
- **Déductible : oui**, très facilement. Question la plus facile (aucun sosie dans la file, le cinéma est tout près).

## 3. Problèmes classés par gravité

### Bloquant
Aucun. L'enquête est finissable sans aide extérieure, mais voir « gênant » n° 1 : sans l'indice j'aurais continué à chercher
longtemps.

### Gênant
1. **Q3 : la localisation « plus loin / rue des Étals » n'est pas exploitable.** Le texte de la question n'indique ni lieu ni
   direction ; le seul repère textuel (« rue des Étals », texte de réussite de Q2) est un nom de rue **qu'aucun élément de
   l'interface ne permet de situer** (pas de nom de rue sur la carte, pastille de lieu = quartier seulement, minicarte = quartiers).
   Résultat : 46 commandes (~ 4 min) et un indice (donc une étoile) pour une question dont la solution, une fois trouvée, est
   évidente. Preuves : `014`, `022`–`031` (balayage du marché), `025` (centre sur la rue, pastille « Les Halles »),
   `030` (carnet : même texte, aucun repère), puis `046`–`049` après l'indice.
   Ma piste initiale (le voleur doit être *dans* le marché, car « marché » est le seul lieu cité depuis Q1) a été renforcée par
   la grande taille du marché et la quantité de sosies à bonnet orange : fausse piste involontaire, non injuste en soi mais coûteuse.
2. **Q3 : consigne en deux temps non explicitée.** « Où a-t-il caché la caisse ? » est une question sur un **objet**, mais la
   phrase précédente (« le voleur marche les mains vides ») laisse penser qu'on doit d'abord retrouver le voleur. C'est bien ce
   qu'il fallait faire (la poubelle est juste à côté du voleur), mais aucun texte ne le dit, et rien ne dit non plus que
   le voleur est à nouveau visible sur la carte.

### Mineur
3. **Détail décisif minuscule à l'échelle de départ.** Le sac « € » dépassant de la poubelle verte (Q3) et le sac « $ » du
   voleur (Q2) ne se distinguent qu'avec `--crop`/zoom (`047.png` : on voit une poubelle verte ordinaire ; `049.png` : le sac).
   Il y a d'autres poubelles vertes et grises dans le secteur (`050.png`), mais une seule avec un sac : fair-play, juste
   exigeant sur téléphone.
4. **Bulles « ? », « ! », « … », cœur au-dessus des PNJ.** Elles attirent l'œil comme si c'étaient des indices (l'homme masqué
   au pull bleu de Q2 porte un « ? »), alors que ce sont visiblement des décors ; c'est charmant mais cela crée un peu de
   bruit dans la recherche de Q2.
5. **L'indice se replie** : après le premier geste sur la carte, le texte de l'indice n'est plus affiché, seulement la barre
   « Indice 1 sur 3 ^ » (`046.png`). Je ne l'ai pas rouvert (je connaissais déjà le texte via `text`), donc je ne sais pas
   s'il se rouvre d'un toucher, mais un joueur qui oublie la phrase doit penser à rouvrir la barre.
6. **« Il comptait venir la rechercher après la séance. »** (texte de réussite de Q3) : « séance » annonce le cinéma de Q4
   avant la question ; sans gravité (c'est même un joli fil conducteur), mais un joueur attentif peut déduire Q4 un cran trop
   tôt, et un joueur pressé ne comprend pas le mot.
7. Le double toucher n'a pas toujours donné le même grossissement (`008.png` ≈ ×2, `033.png` ≈ ×1,6) ; non mesuré,
   sans doute le plafond de zoom ; je le signale sans preuve ferme.

### Ce qui n'a posé aucun problème
- Aucun refus « Rapprochez-vous pour désigner » (je zoomais déjà), aucune erreur de désignation : les vignettes de la feuille de
  confirmation montraient toujours ce que je visais (`004`, `020`, `050`, `055`).
- Aucun bug technique, aucune erreur de page, aucun plantage ; temps de réponse constants.
- Les sosies de Q2 étaient justes et lisibles (chacun échoue sur un critère de la question).

## 4. Ce qui a plu

- **Le briefing** : ton, personnages (commissaire Odile Fétu, Picotin qui « achetait son pain, comme par hasard »), l'humour du
  dénouement (« cambrioleur à mi-temps et distrait à plein temps », « le seul spectateur masqué de toute l'histoire du Rex »,
  Picotin qui finit le pain avant d'arriver au commissariat).
- **Q1** : la scène de départ (boulangerie, Rose en colère avec bulle, Picotin avec bulle cœur) raconte l'histoire sans texte.
- **Le moment « aha » de Q3** : le sac « € » qui dépasse de la poubelle, à deux pas du voleur mains vides.
- **La ficelle rouge** reliant les personnages identifiés (`022`, `057`) : lisible, donne le sentiment d'un tableau d'enquête,
  et le panneau de fin la remontre en entier.
- **La pastille de lieu** qui affiche « Cinéma Le Rex » au centre de la carte : très pratique pour naviguer (elle a rendu Q4 presque trivial).
- Le marché à l'échelle : foule dense, stands variés, camions, parapluies, véhicules sur les routes ; on a vraiment l'impression de chercher dans une ville vivante.
- Le coût de l'indice est annoncé avant confirmation, avec un « Non merci » clair : honnête et sans piège.

## 5. Suggestions concrètes et minimales

1. **Q3** : ajouter un repère de lieu dans la question ou dans le texte de réussite de Q2. Par exemple Q2 : « …qui fend la foule
   vers la sortie est du marché, en direction de la rue des Étals » ; ou Q3 : « De l'autre côté de la rue des Étals, le voleur
   marche les mains vides. Où a-t-il caché la caisse ? ». (L'indice 1 actuel suffit déjà ; le but est que le texte de base le dise.)
2. **Noms de rues** : si le jeu cite une rue dans un texte, l'afficher dans la pastille de lieu quand le centre de la carte est sur
   cette rue (ou sur son trottoir), sinon éviter les noms de rues non localisables dans les textes d'enquête.
3. Q3 : préciser qu'on cherche **un objet/endroit** (par exemple « Désignez l'endroit où il a caché la caisse ») et que le
   voleur est repérable sur la carte pour s'orienter.
4. Après la bonne réponse de Q2, recentrer doucement la caméra dans la direction de la suite (est) ; cela ne révèle rien
   (le texte de réussite le dit déjà) et évite l'errance dans le marché.
5. Optionnel : rendre le sac « € » un peu plus visible à l'échelle de départ (liseré clair, ou taille légèrement supérieure)
   pour que la preuve soit lisible sans zoom.
6. Laisser l'indice affiché dans la barre repliée (au moins sa première ligne) ou rendre évident qu'un toucher le rouvre.
