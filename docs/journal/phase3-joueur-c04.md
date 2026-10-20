# Joueur test aveugle — enquête c04 « La Grande Paille »

Joueur : `c04` (profil neuf, écran émulé Pixel 7, 412×915). Captures : `.shots/playtest/c04/c04/`
(001 à 141). Journal des commandes : `.shots/playtest/c04/c04/commands.jsonl`.

## 0. Réserve de test (à lire d'abord)

**Pour les captures 001 à 073, l'outil Read m'a répondu « media removed: request limit » : je n'ai pas pu
les regarder.** Ces 73 captures couvrent Q1, presque toute Q2 (jusqu'à environ la commande 150) et les
repérages que j'ai faits du fil « Le voisin » au début. Pendant cette phase j'ai donc joué avec les textes
renvoyés par l'outil et sans voir l'écran : mes gestes n'étaient pas guidés par la vue.

Ce qui en découle pour ce compte rendu :

- Pour Q1 et Q2, je n'ai aucun témoignage fiable de « ce qu'on voit à l'écran ». Je m'appuie sur les textes
  et sur des captures ultérieures lisibles (077, 078, 085 à 093, 103).
- Ma première erreur (Q2, capture 055) a été commise sans que je puisse relire la capture. Elle ne mesure
  pas la difficulté réelle de Q2.
- Les durées et nombres de commandes de Q1 et Q2 sont gonflés par cet aveuglement et ne sont pas à comparer.
- Q3, Q4, Q5 et Q6 (captures 075 à 141) sont jouées avec les images sous les yeux. Ce sont elles qui
  donnent des mesures fiables.

## 1. Verdict

| Mesure | Valeur |
|---|---|
| Enquête résolue | **Oui** (« Affaire classée ») |
| Questions résolues | 6 / 6 |
| Erreurs | 2 (une en Q2, une en Q5) |
| Indices | 5 (Q2 : 1, Q4 : 1, Q5 : 1, Q6 : 2). Indice 3 (réponse montrée) jamais demandé |
| Étoiles | 2 / 3 |
| Commandes | 295 (dont 2 refusées par l'outil, mes erreurs : « Déplier la question » absent, « Voir » ambigu) |
| Captures | 141 |
| Durée | 20 min 51 s |
| Incidents techniques | 0 (`status` n'a jamais signalé d'incident ; aucune erreur de page vue) |

Répartition approximative des commandes (d'après les numéros de capture) : Q1 ≈ 12, Q2 ≈ 140 (en grande
partie à l'aveugle, voir §0), Q3 ≈ 14, Q4 ≈ 55, Q5 ≈ 30, Q6 ≈ 45.

Ressenti : les 20 minutes sont inégales. Q3 est rapide et agréable. Q4, Q5 et Q6 se sont transformées en
recherche d'un objet minuscule (une tarte) dans une foule, sans indication de lieu, et j'ai demandé un
indice à chaque fois.

## 2. Question par question

### Q1 — « La vitrine de la bijouterie Carat a été fracassée. Par où les cambrioleurs sont-ils arrivés ? »

- Compris : on cherche un chemin d'entrée ou de fuite devant la vitrine. Le briefing dit que les jumeaux
  Taupin « passent plus de temps sous la ville que dessus », ce qui oriente vers le sous-sol.
- Regardé : la façade et la rue devant la boutique. Je n'ai pas pu voir mes captures (§0).
- Tentatives : 1, juste (« Bien vu ! », plaque d'égout ouverte devant la vitrine).
- Déductible : oui. Sur les captures lisibles prises plus tard (088, 089, 093, 103), la plaque d'égout est
  une ellipse sombre dans la chaussée devant la bijouterie, et deux jumeaux (sweat gris, bonnet orange) sont
  devant la vitrine, l'un avec une petite étincelle bleue dans la main. À la vue de départ elle est petite
  mais repérable, et l'indice du briefing la rend logique.
- Je ne peux pas dire si le point de départ cadre bien la plaque, ni ce que montrait la vignette de
  confirmation (007).

### Q2 — « Les jumeaux se sont séparés en repartant. Retrouvez celui qui a emporté le diamant. »

- Compris : il y a deux jumeaux identiques, un seul porte le butin. Le texte de récompense de Q1 donnait
  l'indice : « l'autre, sac au dos, serre déjà le butin ».
- Regardé : j'ai suivi la rue autour de la bijouterie, puis la Grand-Place. La quasi-totalité de ce
  parcours (jusqu'à la capture 073) a été faite sans voir l'écran (§0).
- Tentatives : 2 (1 erreur : « Ce n'est pas ça… »), plus 1 indice écrit : « un seul des jumeaux tenait le
  diamant. Il est parti vers le nord, vers la Grand-Place. »
- La bonne cible (captures 076 à 078) : un jumeau en course, sweat gris, bonnet orange, sac à dos vert,
  au bas de la Grand-Place. Récompense : « Excellent ! Ludo Taupin, sac au dos, fend la foule… Son frère
  Lino est parti de l'autre côté, vers le Faubourg ».
- Un jumeau (probablement Lino) est visible sur la capture 090 près de l'Antiquaire : même tenue, pas de
  sac à dos distinguable à cette taille.
- Déductible : en théorie oui (sac à dos + direction), mais le seul signe distinctif est un petit sac vert, et
  la question ne le rappelle pas. Sans les captures de la première phase, je ne peux pas dire si j'ai pris
  le mauvais jumeau ou un autre sosie.

### Q3 — « Furieux, Ludo s'est débarrassé du diamant. Où est-il ? »

- Compris : un objet jeté près de Ludo, donc quelque part sur la Grand-Place.
- Regardé : un dézoom de la place (capture 079), où une fontaine montre un petit diamant dans le bassin et,
  juste à côté, un personnage avec une bulle de colère rouge. Zoom, tap, vignette de confirmation (081).
- Tentatives : 1, juste (« Exactement ! Dans la fontaine ! … Le diamant de la vitrine était un FAUX »).
- Déductible : oui, nettement. C'est la question la plus claire. Elle a été résolue en ≈ 14 commandes, sans
  indice.

### Q4 — « Un voisin a vu quelqu'un s'éloigner de la bijouterie à l'aube, une tarte à la main. Retrouvez cette personne. »

- Compris : une personne, vue à un autre moment de la journée (« à l'aube »), tenant une tarte. Le texte
  ne donne ni description, ni direction, ni lieu.
- Regardé : la bijouterie et ses abords (captures 085 à 096), les rues voisines, puis la Grand-Place par
  bandes (097 à 108). J'ai passé ≈ 40 commandes sans trouver de personne portant une tarte avant de demander
  l'indice.
- Tentatives : 0 avant l'indice, 1 après (juste).
- Indice 1 : « Haut-de-forme, costume violet, une tarte à la main, l'air de ne pas vouloir être vu… Ça ne
  vous rappelle personne ? ». Il m'a donné l'apparence, pas le lieu : j'ai encore cherché ≈ 15 commandes.
- La bonne cible (109, 110) : homme en costume violet, haut-de-forme, monocle, canne, une petite tarte rose
  et blanche à la main, sur le bord est de la Grand-Place. Récompense : « Octave Carat en personne ».
- Constat tardif : ce même personnage (haut-de-forme, costume violet, canne, bulle « goutte de sueur »)
  se tient déjà près de la bijouterie, à côté de la Quincaillerie (captures 086, 089, 093), mais sans tarte.
  Rien dans la question ne nous incite à considérer ce personnage ni à le suivre. On le voit à nouveau, au
  café, en Q5 (capture 118).
- Déductible : pas sans l'indice. La tarte fait environ 10 pixels à un zoom où l'on lit encore bien les
  personnages ; c'est le haut-de-forme violet qui était repérable.

### Q5 — « À qui le bijoutier a-t-il confié la tarte ? »

- Compris : quelqu'un avec qui Octave s'est arrêté après la Grand-Place. Aucune direction dans le texte.
- Regardé : les passants près d'Octave, au sud-ouest de la place (111 à 116).
- Tentative 1 (erreur, « Ce n'est pas ça… Regardez encore. ») : une vieille dame cheveux blancs, lunettes,
  robe verte à pois, qui tient un dessert (part de gâteau ou tarte) sur une assiette, 112, 114, 116. Pour moi
  c'était un leurre crédible, sans rien dans la question pour le distinguer.
- Indice 1 : « Il a continué vers le nord, jusqu'à une terrasse où l'on sert le café. » (le Café du Centre).
- Tentative 2 (juste, 118, 119) : femme en robe jaune à carreaux, cheveux gris-roses relevés, avec la tarte
  à la main, sur la terrasse. Octave y est visible une troisième fois, le bras tendu vers elle. Récompense :
  « À sa sœur, Zita Pistache, à la terrasse du Café du Centre ».
- Déductible : non pour la direction. Une fois à la terrasse, la scène se lit toute seule (Octave pointe
  vers Zita).

### Q6 — « Le diamant de la vitrine était un faux : le vrai était caché dans la tarte. Mais Zita ne l'a plus ! Où est la tarte à présent ? »

- Compris : la tarte a changé de mains près du café. Pas de description, pas de lieu.
- Regardé : la terrasse et les tables (121 à 132), l'Hôtel du Nord au nord (128 à 130). Une blonde avec une
  glace rose à la main (133) m'a fait perdre du temps (c'est une glace, pas une tarte). J'ai aussi regardé un
  agent de police sans tarte près du café (135, 136).
- Indice 1 : « … en la donnant à la personne la moins soupçonneuse de la ville. » Ambigu : enfant, vieille
  dame, religieuse, agent ?
- Indice 2 : « Regardez devant l'Hôtel de Ville. » plus un projecteur sur la carte (137). Dans la zone éclairée
  : un agent avec une bulle cœur et une tarte à la main (139), un autre agent qui marche sans tarte, un chien,
  des enfants. Un seul objet « tarte » dans la zone.
- Tentative : 1, juste. Récompense : « Dans les mains de Picotin, qui la trouve délicieuse, un peu croquante
  au milieu ».
- Déductible : seulement après l'indice 2. Avant, aucune information de lieu, et l'indice 1 ne désigne pas
  l'agent de police de façon évidente.

## 3. Problèmes classés par gravité

### Bloquant

Aucun : l'enquête se termine.

### Gênant

1. **Le fil de la tarte (Q4, Q5, Q6) n'a aucun repère spatial, il a fallu un indice à chaque question.**
   Cherchée à un zoom où elle se lit, une tarte de 10 px dans une foule oblige à balayer la place écran par
   écran. Preuves : 54 captures de balayage (Q4 : 082 à 109 ; Q5 : 111 à 118 ; Q6 : 120 à 137), 3 questions
   consécutives, 4 indices sur 5. L'indice 1 de Q6 ne donne que l'idée, le lieu n'arrive qu'à l'indice 2.
2. **Q5 : un leurre très proche et rien pour le distinguer.** La dame à robe verte à pois qui tient un dessert
   (112, 114, 116) ressemble au bon porteur de tarte. La question n'a ni direction (« vers le nord »), ni
   lieu (« une terrasse »), qui n'apparaissent que dans l'indice. Mon erreur n°2 vient de là. Le message
   « Ce n'est pas ça… Regardez encore. » n'oriente pas du tout, alors que le jeu a une carte « Pas tout à
   fait… » pour les fausses pistes ; je n'en ai vu aucune dans toute la partie.
3. **Q2 : les deux jumeaux ne se distinguent que par un petit sac à dos vert.** La question ne le rappelle
   pas ; le seul rappel est dans le texte de récompense de Q1 (« sac au dos »), à retenir de tête. Ma
   première erreur est de cette nature, mais je n'ai pas pu vérifier à l'écran (§0).
4. **Q6 indice 1 : « la personne la moins soupçonneuse de la ville » n'est pas déchiffrable avant d'avoir
   la réponse.** La blague (un agent de police) est bonne, mais en jeu l'énoncé évoque d'abord un enfant ou une
   vieille dame.

### Mineur

5. **Les indices ne coûtent plus rien après le premier.** L'écran d'indice dit « Votre note passera de 3 à
   2 étoiles au plus », puis « Votre note reste à 2 étoiles pour l'instant » à chaque indice suivant. Avec 5
   indices et 2 erreurs, j'ai quand même 2 étoiles sur 3. Le joueur n'a aucune raison de se retenir une fois
   le premier pris. Le jeu ne dit pas non plus ce que valent les erreurs.
6. **Carnet : trois boutons « Voir » identiques** (une par question résolue). Pour un joueur tactile cela va,
   mais l'étiquette ne dit pas à quelle question elle correspond (utilisable par un lecteur d'écran, et
   `press Voir` est ambigu avec l'outil). Le bouton lui-même est utile : il ramène la carte à l'endroit de la
   réponse.
7. **Numérotation qui saute.** En changeant d'onglet (Les jumeaux / Le voisin) alors que j'étais en Q2, le
   panneau annonçait « Question 4 sur 6 » avec 1 seule question résolue. C'est cohérent avec les deux fils
   parallèles, mais ce n'est pas expliqué.
### Technique / performance

- Aucun incident, aucune erreur de page, aucun gel. Les commandes ont pris 0,1 à 2 s (`commands.jsonl`).
  Pas de lenteur ressentie, même au zoom maximum sur la Grand-Place pleine de monde.
- « Rapprochez-vous pour désigner » n'est jamais apparu (je désignais toujours à un zoom suffisant).

## 4. Ce qui m'a plu

- **Le briefing** : ton de la commissaire Fétu, les frères Taupin « qui passent plus de temps sous la ville que
  dessus », le voisin insomniaque que personne ne croit : on a envie d'enquêter.
- **Le retournement de Q3** : le diamant dans la fontaine, puis « c'était un FAUX ». Moment « aha » net.
- **Un même personnage à plusieurs moments** : Octave en trois endroits (devant sa boutique, à la Grand-Place
  avec la tarte, au café en train de la confier). Quand on s'en rend compte, tout s'éclaire. C'est exactement
  la promesse du jeu.
- **Les textes de fin** : « Picotin a retrouvé le diamant avec une molaire. La commissaire lui a offert un
  dentiste et une médaille, dans cet ordre. »
- **Le projecteur de l'indice 2** (« Voir la zone » / « Masquer le projecteur ») : clair, utile, et la zone
  éclairée reste jouable (un seul objet tarte).
- **Lisibilité à l'écran** : au zoom de désignation, les personnages et leurs accessoires sont nets ; les
  bulles (« ? », « ! », cœur, notes, ampoule) donnent de la vie ; la vignette de confirmation encadre bien
  la cible.
- **La feuille de confirmation** : la vignette m'a évité plusieurs erreurs de ciblage.

## 5. Suggestions concrètes et minimales

1. **Q4** : mettre dans la question une information visuelle ou spatiale, par exemple le haut-de-forme
   (« …un grand chapeau… ») ou « sur le chemin de la Grand-Place ». Sans cela le seul recours est l'indice.
2. **Q5** : mettre dans le texte de récompense de Q4 la direction prise par Octave (« vers le nord »), ou
   « jusqu'à une terrasse » dans l'énoncé de Q5. Sinon, retirer ou différencier le leurre « dessert » ; au
   minimum, faire que l'erreur sur ce leurre affiche une carte « Pas tout à fait… » qui dise pourquoi.
3. **Q6** : déplacer « devant l'Hôtel de Ville » dans l'indice 1 (ou fusionner les indices 1 et 2). Pour
   « la personne la moins soupçonneuse », un rappel plus parlant sans gâcher la blague (par exemple « quelqu'un
   qui garde la place ») aiderait.
4. **Q2** : reprendre « celui qui porte le sac » dans l'énoncé.
5. **Indices** : faire monter le coût avec le nombre d'indices (par exemple 1 indice = 2 étoiles max, 3 = 1
   étoile), et dire à l'écran de fin ce qui a coûté des étoiles (indices ou erreurs).
6. **Carnet** : libellés « Voir (Q1) », « Voir (Q2) »…
7. **Test** : ce test est incomplet pour Q1 et Q2 (§0). Il vaut la peine de le refaire sur ces deux questions
   avec des captures lisibles.
