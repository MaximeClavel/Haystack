# Phase 3 — Joueur test aveugle, rejeu de c04 « La Grande Paille » (joueur `c04b`)

Rejeu de l'enquête c04 par un second joueur test aveugle (le premier avait perdu ses captures). Seul fichier lu avant
et pendant la partie : `tools/playtest/README.md`. Aucune lecture de `src/`, `docs/`, `tests/`, `scripts/`, ni de la
partie précédente. Captures dans `.shots/playtest/c04/c04b/` (001 à 052).

## 1. Verdict

| | |
|---|---|
| Enquête résolue | **Oui** (« Affaire classée ») |
| Questions résolues | **6 sur 6** |
| Erreurs | **3** (Q5 : 1, Q6 : 2) |
| Indices | **4** (Q4 : 1, Q5 : 1, Q6 : 2) |
| Étoiles | **2 sur 3** |
| Commandes | 138 jusqu'à la fin de partie (139 avec `stop`) |
| Durée | 12 min 47 s |
| Captures prises / images lues | 52 prises / **50 lues** (001 et 008 non lues). Aucune lecture d'image n'a échoué. |

Répartition de l'effort : Q1 ≈ 8 commandes, Q2 ≈ 24 (dont la découverte de la Grand-Place), Q3 ≈ 4, Q4 ≈ 38,
Q5 ≈ 22, Q6 ≈ 42. **Trois des six questions (Q4, Q5, Q6) n'ont pu être résolues qu'avec un indice.**

## 2. Question par question

### Q1 — « Par où les cambrioleurs sont-ils arrivés ? » (fil « La bijouterie ») : facile, 1 tentative

- **Compris** : désigner un lieu ou objet d'entrée. Le briefing parle des jumeaux Taupin « qui passent plus de temps
  sous la ville que dessus » : le mot « sous » oriente vers un accès souterrain.
- **Regardé** : le cadrage de départ montre la façade de la bijouterie, deux silhouettes masquées au bonnet orange
  (une bras en l'air, l'autre avec un sac), une plaque d'égout **ouverte** (couvercle posé à côté) et une plaque
  fermée plus bas (captures 002, 003).
- **Tentative** : toucher de la plaque ouverte, vignette contrôlée (004 : plaque encadrée de blanc, un jumeau
  derrière), « Désigner » : « Bien vu ! ».
- **Déductible ?** Oui, très bien. La plaque ouverte se distingue nettement de la fermée ; la vitrine fracassée
  aurait pu être une réponse concurrente, mais l'indice « jumeaux / sous la ville » tranche.

### Q2 — « Les jumeaux se sont séparés… Retrouvez celui qui a emporté le diamant » (fil « Les jumeaux ») : 1 tentative, trouvé par chance raisonnée

- **Compris** : un des jumeaux est ailleurs, celui qui porte le sac (texte de Q1 : « l'autre, sac au dos »).
- **Regardé** : dézoom autour de la bijouterie (005, 006), minicarte (007, peu utile pour une cible précise), puis
  la Grand-Place derrière la boutique, en crops (011) : un jumeau (bonnet orange, masque, veste grise, sangle verte
  de sac à dos) **pointe du doigt un diamant bleu dans la fontaine**, avec une bulle d'émotion « colère » (012, 015).
- **Tentative** : toucher, « Désigner » sans contrôler la vignette : « Excellent ! Ludo Taupin, sac au dos… ».
- **Déductible ?** Partiellement. Le texte ne dit pas où chercher, ni à quoi ressemble le jumeau au-delà de « sac au
  dos ». Il existe plusieurs silhouettes de jumeaux autour de la bijouterie (une près d'une grille ronde de la place
  avec une bulle « ! », une accroupie près de l'antiquaire, une sur la rue au sud : 021, 023, 042) ; je n'ai pas eu à
  les départager, mais un joueur qui tomberait d'abord sur l'un d'eux n'aurait aucun moyen de savoir lequel porte le
  sac. Ce sont l'émote de colère et le geste vers la fontaine qui m'ont accroché l'œil, pas une règle.

### Q3 — « Furieux, Ludo s'est débarrassé du diamant. Où est-il ? » : trivial, 1 tentative

- Le diamant dans la fontaine était déjà sous mes yeux depuis Q2. Vignette contrôlée (016 : diamant encadré, Ludo
  furieux à droite). « Exactement ! Dans la fontaine… c'est du verre. Le diamant de la vitrine était un FAUX. »
- **Déductible ?** Oui, au point d'être offert dès Q2 (la réponse de Q3 est visible sur la capture de Q2). Rebondissement
  plaisant.

### Q4 — « Un voisin a vu quelqu'un s'éloigner de la bijouterie à l'aube, une tarte à la main. Retrouvez cette personne » : **non déductible sans indice**, 0 erreur, 1 indice

- **Compris** : chercher un passant tenant une tarte, quelque part autour de la bijouterie. Aucune description
  (ni âge, ni vêtements, ni sexe).
- **Regardé** (≈ 25 images) : trottoirs et rue devant la bijouterie (010, 018, 019, 022, 025), la rue au sud (023),
  la Grand-Place par morceaux (011, 026, 030, 031). Fausses pistes rencontrées : un homme au haut-de-forme portant un
  **colis** (014), un homme en bleu avec un **classeur** (020, 021), une promeneuse avec une **carte** (023), un
  serveur avec un plateau (025). Au passage, j'ai vu **au moins trois autres personnes avec une tarte** : une
  grand-mère en robe verte à pois, une jeune femme au bonnet orange près d'un banc, et plus tard Zita et l'agent.
  La tarte n'est donc pas un signe distinctif.
- **Indice 1** (« 3 → 2 étoiles au plus ») : « Haut-de-forme, costume violet, une tarte à la main, l'air de ne pas
  vouloir être vu… Ça ne vous rappelle personne ? ». J'avais vu cet homme au tout début (bijoutier effondré, goutte de
  sueur, 003) sans faire le lien. Je l'ai retrouvé sur la Grand-Place tenant la tarte **devant son visage** (027),
  vignette 029, « Bien joué ! Octave Carat en personne ».
- **Déductible sans indice ?** **Non.** La question ne donne aucun trait visuel ; la seule voie est de repérer le
  seul homme en violet à la tarte parmi des centaines de silhouettes, avec d'autres porteurs de tarte comme
  leurres. Rien ne lie « quelqu'un » à la bijouterie, alors que l'homme violet y figurait déjà.

### Q5 — « À qui le bijoutier a-t-il confié la tarte ? » : 1 erreur, 1 indice

- **Compris** : suivre Octave, qui venait d'être trouvé sur la Grand-Place, et repérer qui reçoit la tarte.
- **Regardé** (≈ 10 images) : les environs d'Octave (030, 031, 034, 035). La première personne avec une tarte, à
  environ 230 px à l'est, est une grand-mère à lunettes en robe verte à pois (031, 032) ; désignée : « Ce n'est pas
  ça… » (erreur 1). Le trait rouge tracé sur la carte s'arrête à Octave et ne dit pas où il va ensuite.
- **Indice 1** : « Il a continué vers le nord, jusqu'à une terrasse où l'on sert le café. » Le Café du Centre était
  immédiatement au nord (036). Octave y désigne du doigt une femme en manteau jaune à carreaux, chignon gris, sac
  rouge, tenant la tarte (037). « Bien vu ! À sa sœur, Zita Pistache, à la terrasse du Café du Centre. »
- **Déductible sans indice ?** Pas vraiment : la question ne donne aucune direction, et la grand-mère à la tarte,
  plus proche d'Octave que la terrasse, est un leurre très tentant. Un joueur patient aurait fini par suivre la
  piste vers le nord, mais sans aucun guide.

### Q6 — « Zita ne l'a plus ! Où est la tarte à présent ? » : 2 erreurs, 2 indices

- **Compris** : la tarte a changé de main, mais rien dans la question ne dit où chercher.
- **Regardé** (≈ 15 images) : alentours de la terrasse (038, 039, 040, 041), parvis de l'église Saint-Foin (042, 043,
  045, 046, 047, 048). J'ai interprété à tort que Zita était partie « au plus vite » vers l'est et le parvis.
- **Indice 1** : « …en la donnant à la personne **la moins soupçonneuse** de la ville. » J'y ai lu une personne
  naïve (enfant, vieille dame). Tentative 1 : la jeune femme au bonnet orange près du banc (045) : « Ce n'est pas
  ça… Regardez encore. » (erreur 2). Tentative 2 : la grand-mère à pois à la tarte (048) : « **Pas tout à fait.
  Continuez de chercher.** » (erreur 3).
- **Indice 2** (zone éclairée) : « Regardez devant l'Hôtel de Ville. » + projecteur (051) : devant l'Hôtel de Ville,
  Zita (manteau jaune) salue de la main une **agente de police** aux cheveux roux qui tient la tarte, bulle
  « cœur » (052). Désignée : « Affaire résolue ! Dans les mains de Picotin… ».
- **Déductible sans indice ?** **Non.** La réponse était à une centaine de pixels de la terrasse que je venais de
  trouver (l'Hôtel de Ville est le grand bâtiment beige voisin du Café du Centre, visible sur 041 et 049), mais rien
  ne le dit. Avec l'indice 1, la formulation m'a envoyé vers les mauvaises personnes.

### Épilogue

« Affaire classée » : texte de conclusion clair et drôle (assurance, tarte-galette, dentiste et médaille). Bilan
affiché : indices 4, erreurs 3 ; `status` : 2 étoiles sur 3.

## 3. Problèmes classés par gravité

### Bloquant sans indice

1. **Q4 non déductible** : aucune description de la personne, et le motif « tarte » est répandu (au moins 5 porteurs
   de tarte sur la carte : grand-mère en robe verte, jeune femme au bonnet orange, Octave, Zita, l'agente).
   Preuves : 014, 020/021 (fausses pistes), 031/032 (grand-mère), 045 (jeune femme), 027 (Octave tenant la tarte
   devant le visage). Le texte de l'indice 1 donne la réponse, en clair.

### Gênant

2. **Q5 sans direction ni transition** : après Q4 le jeu ne signale pas où Octave est allé. Le leurre le plus proche
   (grand-mère à la tarte, 031/032) est bien plus tentant que la bonne cible, 500 px plus loin au nord (037).
   Seul l'indice 1 donne la direction.
3. **Q6 sans repère** : la question ne contient aucun lieu ni moment. Le texte « Elle devait quitter la ville »
   (réponse de Q5) pousse à chercher loin, alors que la cible est près de la terrasse. L'« au plus vite » n'est
   présent que dans l'indice.
4. **Indice 1 de Q6 mal formulé** : « la personne la moins **soupçonneuse** » signifie en français « celle qui se
   méfie le moins », donc une personne naïve (vieille dame, enfant). La réponse est une agente de police, qu'on
   décrirait plutôt comme « la moins **soupçonnable** » ou « celle qu'on soupçonne le moins ». Le texte m'a mené à
   deux erreurs (045, 048).
5. **Message « Pas tout à fait. Continuez de chercher. » sans explication** (Q6, grand-mère à pois) : je ne sais pas
   si je suis proche (même rôle, mauvais exemplaire ?) ou à côté. Il compte pourtant comme erreur (3 erreurs
   affichées). Le message « Ce n'est pas ça… Regardez encore. » ne distingue pas non plus une mauvaise personne d'un
   mauvais moment.
6. **Sosies de porteuses de tarte** : la grand-mère à robe verte à pois tient une tarte à deux endroits au moins
   (031 et 043/048) et sert de leurre tour à tour pour Q5 et Q6. C'est voulu, mais combiné aux points 1 à 5, la
   fausse piste devient injuste faute d'un critère de départage (lieu, moment, geste).

### Mineur

7. **Texte / image** : « tarte sous le bras » (Q4) alors que le sprite la tient devant le visage ; « fend la foule de
   la Grand-Place » (Q2) alors que Ludo est immobile devant la fontaine (012, 015).
8. **Q2 : plusieurs jumeaux** au bonnet orange autour de la bijouterie (021, 023, 042), sans autre critère que le
   sac. La sangle verte du bon jumeau est à peine visible sans zoom.
9. **Zone visible de la vignette** : pour Q2 (non contrôlée) j'ai désigné sans vérification ; la vignette aurait
   confirmé qu'elle montrait le jumeau et non le passant voisin. Aucun incident, mais le geste est risqué.
10. **Étoiles** : « Votre note reste à 2 étoiles pour l'instant » apparaît aux indices 2, 3, 4 ; au final 2 étoiles
    avec 3 erreurs et 4 indices. Pas de défaut, mais le décompte est peu lisible pour le joueur.
11. **Outil de test** : `shot --crop` n'agrandit pas au-delà de la résolution native (la capture est à la même
    échelle que l'écran). Les petites zones restent difficiles à lire.

## 4. Ce qui m'a plu

- Le **fil narratif** : égout, faux diamant dans la fontaine, tarte-galette, dentiste ; on le comprend en jouant.
- Les **émotes** (colère de Ludo, goutte de sueur d'Octave, cœur de l'agente, ampoule du café) : elles racontent la
  scène sans mot.
- Le **trait rouge** et les pastilles sur la carte, qui relient les réponses trouvées et montrent le trajet.
- La **vignette de confirmation** : rassurante et fiable (004, 016, 029, 032).
- L'**indice 2 « zone éclairée »** (051) : bien dosé, le libellé « Regardez devant l'Hôtel de Ville » + projecteur
  donne la zone sans révéler la cible.
- Les **onglets des fils** (« Les jumeaux » / « Le voisin ») et les points de progression : lisibles.
- Aucun ralentissement perçu pendant les zooms, dézooms et glissements ; « Rapprochez-vous pour désigner » fonctionne
  bien et recentre sur la cible.

## 5. Suggestions concrètes et minimales

1. **Q4** : ajouter au texte ce qui se voit sur le sprite : « …qui se cachait derrière une tarte » (la tarte est
   tenue devant le visage), et/ou donner un trait de silhouette dans la déposition du voisin (« un chapeau haut de
   forme »). Sinon, réserver le sprite « tarte » aux seuls personnages de l'enquête (ou le rendre moins fréquent)
   afin qu'il devienne discriminant.
2. **Q4 → Q5** : dans le texte de réussite de Q4, ajouter la direction (« Il a pris vers le nord ») ; pour Q5, une
   phrase de question du type « Octave a continué sa route… À qui a-t-il confié la tarte ? ».
3. **Q6** : réécrire l'indice 1 en « la personne qu'on soupçonnerait le moins » ; compléter la question par
   « …elle s'en est débarrassée presque aussitôt, près de la terrasse » ; faire expliquer le message « Pas tout à
   fait » (« Cette dame a bien une tarte, mais elle n'était pas là à ce moment-là »).
4. **Leurres** : garder la grand-mère à pois comme fausse piste, mais lui donner un critère de départage visible
   (par exemple, elle ne tient pas la tarte de la même façon, ou le texte de Q5/Q6 précise « devant un bâtiment »).
5. **Q2** : mentionner dans la question ou dans le texte de réussite de Q1 un détail repérable du jumeau (« sac à dos
   vert »), et vérifier que le sac est visible dès le zoom de la Grand-Place.
6. Optionnel : après une réponse juste, **recentrer doucement** la caméra vers la zone de la question suivante quand
   elle est proche (Q4 → Q5), pour éviter un tâtonnement de plus de 40 commandes.
