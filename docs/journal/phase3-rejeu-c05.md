# Rejeu aveugle de l'enquête c05 « Rideau ! » (joueur c05r)

Testeur aveugle (nouveau), petit écran 390×844, `--player c05r`. Seul fichier lu avant la fin de la partie :
`tools/playtest/README.md`. Captures : `.shots/playtest/c05/c05r/` (001 à 047).

## 1. Verdict

| | |
|---|---|
| Résolue ? | **Oui** (« Affaire classée ») |
| Questions résolues | **7 / 7** |
| Erreurs | 0 affichée (une fausse piste « Pas tout à fait… » à la Q7, tolérée) |
| Indices | **0** (j'ai ouvert une fois la fenêtre « Utiliser un indice ? » à la Q3 pour lire le coût, puis « Non merci ») |
| Étoiles | **3 / 3** |
| Commandes | 143 (144 avec le `status` final) |
| Durée | 10 min 40 s |
| Captures prises / lues | 47 prises, 45 lues (aucun échec de lecture d'image) |
| Incidents techniques | 0 |

Répartition des commandes par question : Q1 7 · Q2 24 · **Q3 47** · Q4 12 · Q5 13 · Q6 3 · Q7 27.
La Q3 (Pétronille) est de loin la plus coûteuse : je n'ai pas su où chercher. J'ai ouvert la fenêtre d'indice
vers la 28e commande de cette question (coût annoncé : 3 → 2 étoiles au plus), refusé pour tenter encore quelques pistes,
et trouvé la réponse à la 47e commande sans indice (j'ai donc légèrement dépassé le seuil de ≈ 40 commandes).

## 2. Question par question

### Q1 — « Trouvez Bérénice Fard, effondrée sur le parvis du théâtre »
- **Compris** : une femme au sol devant le théâtre. Le cadrage de départ est déjà sur le théâtre.
- **Regardé** : capture avec grille, puis un crop 160×90 : une femme en robe rouge allongée, bulle « tourbillon »,
  petite bouteille verte à la main ; un agent en uniforme bleu à côté (bulle « goutte »).
- **Tentatives** : 1 toucher, 1 validation. Réussi.
- **Aidé** : le départ cadré sur la scène, la bulle de malaise, la bouteille (que la carte de réponse cite).
- **Déductible ?** Oui, immédiatement.

### Q2 — « Un faux infirmier a volé le poison à l'hôpital Sainte-Paille. Trouvez-le. »
- **Compris** : quatre « pistes » ouvertes en parallèle (onglets Infirmier / Pétronille / Hector / Gontran), que l'on
  peut résoudre dans l'ordre que l'on veut. L'interface le dit bien (« 4 pistes ouvertes »).
- **Regardé** : minicarte (seulement des noms de quartiers, pas de monuments), puis dézoom : un grand toit bleu
  avec un « H » d'héliport, juste au sud du théâtre ; l'étiquette de lieu sous le centre a confirmé
  « Hôpital Sainte-Paille ». Zoom devant l'entrée : ambulances, une femme en blouse blanche avec mallette et bulle « ? »,
  et un vieil homme en blouse blanche, haut-de-forme, parapluie rayé, bouteille verte, pantalon orange.
- **Tentative** : 1 seule, juste.
- **Aidé** : l'étiquette de lieu (très efficace), l'« H » du toit, la bouteille verte en main.
  **Perdu** : rien. La vraie infirmière (mallette, bulle « ? ») est un leurre honnête.
- **Déductible ?** Oui.
- Remarque : la carte de réponse parle de « blouse blanche et **masque** » ; je n'ai vu aucun masque sur ce personnage
  (lunettes, haut-de-forme), voir problème n° 6.

### Q3 — Pétronille Doublure (« a répété la scène de la mort au calme pendant l'entracte »)
- **Compris** : un lieu paisible lié à la mort : cimetière, église, jardin… La consigne ne dit pas où.
- **Regardé / tentatives** (47 commandes, 17 captures) : dézoom autour du théâtre, petit square de l'est (bancs, tente),
  grand parc des Meules au nord (une personne allongée sur l'herbe, en pantalon bleu : faux espoir à cause du mot
  « mort »/« allongé »), groupes de promeneurs, rangée de boutiques (photo, antiquaire, encadreur). Rien n'avait de pantalon orange.
  En poussant vers l'ouest en vue large, j'ai vu en bas de capture des pierres tombales et des cyprès : le **cimetière**
  (l'étiquette de lieu a confirmé « Cimetière »). Zoom : une femme à longue chevelure rousse, haut-de-forme,
  long manteau vert, jambes orange, un papier à la main, bulle « note de musique » → Pétronille.
- **Aidé** : l'étiquette de lieu, la lecture du pantalon orange (critère donné dans la carte Q2), la bulle musicale.
  **Perdu** : aucune liste de lieux ; la minicarte ne nomme que les quartiers ; la recherche a été au hasard avant
  de comprendre que « calme » + « mort » = cimetière. J'ai ouvert le menu « Indice » (coût annoncé : 3 → 2 étoiles
  au plus) et refusé.
- **Déductible ?** Oui, mais seulement par un joueur qui explore le quartier ; le raisonnement « scène de la mort =
  cimetière » est plaisant, mais rien n'indique qu'un cimetière existe dans le quartier.
- La carte de réponse précise « elle s'appuie sur une canne » (donc pas de parapluie) : détail que je n'ai pas
  remarqué sur la carte et dont j'ai eu besoin pour la Q6.

### Q4 — Hector Plumeau (« se consoler au milieu des belles choses »)
- **Compris** : musée, galerie, antiquaire ? J'avais vu un « Musée » en traversant vers le cimetière.
- **Regardé** : l'esplanade du **Musée des Beaux-Arts** (étiquette de lieu) pleine de touristes avec appareil photo,
  quelques-uns en orange (gilets, bonnets). Crops successifs : un homme frisé, chapeau melon, veste bleue, cravate rouge,
  parapluie rayé, **pantalon orange**, bulle cœur, à côté d'une femme à bulle cœur.
- **Tentative** : 1, juste (« Bien joué ! … chapeau melon »).
- **Aidé** : l'exploration de la Q3 (j'avais déjà repéré le musée) ; le critère « pantalon orange » ; les bulles cœur
  (cohérentes avec « se console avec une admiratrice »).
- **Déductible ?** Oui, mais « belles choses » est ambigu (musée, antiquaire, galerie d'art, boutique de luxe).

### Q5 — Gontran Lamèche (« n'a pas bougé à l'entracte : il lisait son journal »)
- **Compris** : le doyen est resté près du théâtre ; il lit.
- **Regardé** : retour sur le parvis, zoom ×4 : un vieil homme à cheveux gris en manteau sombre (leurre, sans journal),
  et, au centre, un homme à moustache, haut-de-forme à ruban rouge, parapluie rayé rouge et blanc, veste rouge,
  **pantalon orange**, un journal ouvert entre les mains.
- **Tentative** : 1, juste.
- **Déductible ?** Oui : « pas bougé » (donc au théâtre) + « journal » + les trois attributs du faux infirmier.

### Q6 — « Comparez les trois comédiens au faux infirmier. Qui a empoisonné Bérénice ? »
- **Compris** : faux infirmier = haut-de-forme + parapluie + pantalon orange.
  Pétronille : haut-de-forme + canne, **pas de parapluie**. Hector : parapluie, **chapeau melon**.
  Gontran : haut-de-forme + parapluie + pantalon orange → coupable.
- **Tentative** : 1 (retoucher Gontran, resté au même endroit), juste.
- **Déductible ?** Oui, très bien : chaque suspect échoue sur un attribut différent. C'est une jolie déduction.
  Le texte de la carte Q2 (« Retenez bien ces détails : le carnet les gardera pour vous ») m'a prévenu.
- Bémol : la réponse est une simple retouche de la cible de la Q5, sans comparer physiquement (voir suggestions).

### Q7 — « Gontran file au port pour embarquer sur “L'Entracte”. Retrouvez-le avant le départ ! »
- **Compris** : aller au port, trouver le bateau « L'Entracte », puis Gontran près de lui.
- **Regardé** : minicarte, touche sur « Le Port » : atterrissage très zoomé sur un trottoir (« Route du Port »),
  dézoom, entrepôts 8 et 9, puis glissé vers le nord jusqu'au fleuve : bateaux JOSÉPHINE, FENAISON, BELLE-MEULE,
  LE GLANEUR, **L'ENTRACTE** (noms lisibles).
- **Tentatives** : 2. 1) À la passerelle de L'Entracte : un homme en haut-de-forme, veste rouge, parapluie rayé, que j'ai pris
  pour Gontran sans regarder le pantalon → **« Pas tout à fait… Monsieur Cargo, l'armateur… pantalon NOIR »** (erreur de ma part,
  le leurre était honnête). 2) Un second homme, plus à gauche entre deux caisses, accroupi, pantalon orange, bulle « goutte de
  sueur » (il se hâte) → juste. Statut : 0 erreur, 3 étoiles.
- **Aidé** : noms de bateaux lisibles, bulle de sueur, rappel « pantalon NOIR » dans la carte d'erreur.
  **Perdu** : j'ai mal lu mon propre critère, trop sûr de moi à cause de l'emplacement.
- **Déductible ?** Oui. Le leurre est parfaitement déductible grâce au pantalon (je l'avais dans le carnet) ;
  l'emplacement « à trois pas de la passerelle » fonctionne, mais le leurre est exactement sur la passerelle.

## 3. Problèmes par gravité

### Bloquant
Aucun.

### Gênant
1. **Aucun repère de lieux pour des pistes qui supposent de connaître la ville** (Q3 surtout, Q4 un peu). La minicarte
   ne montre que les noms des quartiers ; pas de légende des monuments (musée, cimetière, hôpital, port). La Q3 a coûté
   47 commandes et 17 images, dont une dizaine d'impasses (parc, square, boutiques). Preuves : 004/005 (minicarte sans
   monuments), 016–023 (impasses), 024–026 (cimetière trouvé à l'œil en vue large).
2. **Cadrage / zoom peu prévisibles pour un joueur** : un pincement ×0,5 donne selon les cas une vue trop large
   (personnages de 10 px, pantalon orange illisible : 011, 012) ou, après deux double-touchers, un gros plan sans rien
   d'utile (017). L'atterrissage après un toucher sur la minicarte garde le zoom précédent (037 : gros plan sur un trottoir,
   aucun repère). Il faut sans cesse alterner large/proche. Pas bloquant mais coûteux en commandes.

### Mineur
3. **Le carnet ne garde pas visiblement les détails à retenir.** La carte Q2 dit « le carnet les gardera pour vous », mais
   la section « Notes » reste vide ; la ligne « Personnages identifiés » ne dit que « Le faux infirmier — voleur de poison ».
   Les trois attributs (haut-de-forme, parapluie, pantalon orange) ne se trouvent que dans le texte de la réponse Q2, dans
   « Questions résolues ».
4. **Écran de fin / statut : « Erreurs : aucune »** alors que j'ai vu une carte « Pas tout à fait… » (le jeu tolère
   2 erreurs sans pénalité). Le joueur ne sait pas qu'il a fait une erreur tolérée avant de lire la phrase « au plus
   2 erreurs : le maximum ». Capture 047.
5. **Leurre de Q7 placé exactement sur la passerelle** (Monsieur Cargo), alors que la vraie cible est 70 px plus loin :
   un joueur pressé (moi) désigne le premier haut-de-forme + parapluie + veste rouge. C'est un bon leurre, juste à signaler
   comme piège coûteux (le critère décisif, le pantalon, n'est pas rappelé dans la question).
6. **Texte/carte incohérents** : « Blouse blanche et masque » (Q2) mais aucun masque visible sur le faux infirmier
   (capture 010).
7. **Carte de réponse Q3** : « elle s'appuie sur une canne » : détail peu visible à l'écran (bâton fin couleur bois à côté
   de la jambe), pourtant décisif pour la Q6. Capture 027.
8. **Panneau de question** : après « Replier la question », les onglets de pistes disparaissent et l'indication
   « 3 pistes ouvertes » aussi ; il faut déplier pour changer de piste. Mineur.
9. **Étiquette de lieu parfois trompeuse après la fin** : « Rue de la Truelle · Le Faubourg » sur l'écran de fin
   (la caméra a reculé pour montrer la carte du parcours). Sans conséquence.

## 4. Ce qui m'a plu
- Le **mécanisme de déduction** : un signalement en trois attributs (haut-de-forme, parapluie, pantalon orange) et trois
  suspects qui en perdent chacun un ; la Q6 se résout en réfléchissant, pas en cherchant.
- Les **pistes parallèles** (4 onglets) : liberté d'ordre, lecture claire de la progression (points colorés).
- Les **petites bulles** (tourbillon, goutte, point d'interrogation, cœurs, note de musique, goutte de sueur) : elles donnent
  du caractère et servent d'indices narratifs (Pétronille « déclame », Hector « se console », Gontran « se hâte »).
- Les **cartes de réponse** : drôles et riches (« Personne n'a applaudi », « Picotin a juré de ne plus jamais boire de
  camomille »), elles réinjectent les indices utiles.
- L'**étiquette de lieu** sous le centre : très utile pour savoir où l'on est (hôpital, musée, cimetière).
- Les **noms de bateaux et de boutiques lisibles** en zoom moyen ; la scène du port est très vivante.
- Pas un seul incident technique, aucune erreur de geste (« Rapprochez-vous pour désigner » a bien fonctionné
  une fois, sans pénalité).

## 5. Suggestions concrètes et minimales
1. **Carnet** : recopier automatiquement dans « Notes » (ou dans la ligne « Personnages identifiés » du faux infirmier)
   « haut-de-forme · parapluie · pantalon orange », puisque la carte Q2 promet que le carnet les garde.
2. **Aide à la recherche, sans indice** : afficher sur la minicarte les 4 à 6 monuments principaux du quartier courant
   (Théâtre, Hôpital, Musée, Cimetière, Port) une fois qu'on les a vus, ou nommer le type de lieu dans la piste
   (« …au calme, parmi les tombes » est trop explicite ; « loin de la foule » serait un compromis).
3. **Minicarte** : après un toucher, régler le zoom sur le cadrage de départ de l'enquête (au lieu de conserver le zoom
   précédent).
4. **Écran de fin** : « Erreurs : 1 (tolérée) » ou « aucune pénalité » plutôt que « aucune ».
5. **Q7** : rappeler dans la question ou dans la carte de refus le critère à vérifier (« vérifiez le pantalon ») ; la carte
   « Pas tout à fait… » le fait déjà, donc le plus simple est de ne rien changer et de garder ce leurre.
6. Ajouter un masque au faux infirmier, ou retirer « et masque » du texte Q2.
7. Rendre la canne de Pétronille plus visible (ou ne pas en faire un critère de déduction).
