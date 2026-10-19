# Phase 3 — Joueur test aveugle : enquête c05 « Rideau ! »

Joueur : `c05`, appareil « petit » (390×844). Captures : `.shots/playtest/c05/c05/` (88 captures),
journal des commandes : `.shots/playtest/c05/c05/commands.jsonl`.
Règles respectées : seul `tools/playtest/README.md` lu avant la partie, aucune solution connue, aucun fichier
du dépôt modifié hors ce compte rendu.

## 1. Verdict

| | |
|---|---|
| Enquête résolue | **Oui** : 7 questions sur 7 |
| Erreurs | **0** (aucune fausse désignation) |
| Indices | **6** (Q2 : 2 indices ; Q3, Q4, Q5, Q7 : 1 indice chacun), tous demandés par moi après avoir cherché |
| Étoiles | **2 sur 3** |
| Commandes | **648** au compteur de l'outil, mais ~**400** sont des taps de sondage de la minicarte (voir §3, problème 1). Jeu « de joueur » réel : ~250 commandes dont 88 captures |
| Durée | **24 min** (mesure de l'outil) ; ressenti : 5 min pour la Q1, ~10 min perdues sur la Q2, le reste fluide |
| Incidents techniques | **0** observé (aucune erreur de page, aucun plantage ; le `status` de cet outil n'affiche d'ailleurs pas de ligne « incidents ») |

Ressenti global : une très bonne histoire et une très bonne idée de déduction (le costume du faux infirmier
sert de fil conducteur), mais **la Q2 est un mur sans indice** (l'hôpital est introuvable) et la Q7 est une
recherche à l'aveugle sur un quai de plusieurs écrans.

## 2. Question par question

### Q1 — « Trouvez Bérénice Fard, effondrée sur le parvis du théâtre » (2 commandes utiles)
- Compris : une femme à terre devant un théâtre. Le cadrage de départ montre exactement la scène (capture 002).
- Regardé : parvis, une femme en rouge allongée avec une bulle en spirale, un agent penché à côté. 1 tap,
  vignette claire (004), « Bien vu ! ».
- Déductible : oui, immédiatement. Excellente entrée en matière. (Le texte « elle tient encore sa bouteille de
  camomille » est invisible à cette échelle, sans importance.)

### Q2 — « un faux infirmier a volé le poison à l'hôpital Sainte-Paille. Trouvez-le. » (**très difficile sans indice**)
- Compris : il faut trouver l'hôpital, puis une personne déguisée en infirmier. Aucun quartier n'est donné.
- Regardé : la minicarte (006, 007, 020) ne montre **que les noms des 9 quartiers**, aucun lieu nommé, aucune
  icône d'hôpital. J'ai donc sondé la minicarte à coups de taps en lisant la pastille de lieu en haut à gauche
  (qui affiche « Théâtre de la Botte », « Cimetière », « Commissariat », « École Jules-Botte »… quand le
  centre de l'écran tombe dessus) : ~400 taps, aucun n'est tombé sur l'hôpital (le lieu est petit à l'échelle de
  la minicarte, 1 pixel de minicarte ≈ plusieurs dizaines de pixels de monde). Impasse.
- Indice 1 : « L'hôpital est au sud, rue des Brancards. Un infirmier avec un flacon… et un drôle de chapeau. »
  **Trompeur** : « au sud » de quoi ? Je l'ai lu « au sud de la ville / de la rivière » et j'ai exploré la
  Fenaison, Les Jardins et Le Port (016 à 021) ; or l'hôpital est dans le **Quartier des Arts** (la pastille
  affiche « Hôpital Sainte-Paille · Quartier des Arts »), le quartier de départ. Aucun nom de rue n'est affiché
  sur la carte : « rue des Brancards » est inutilisable. Un bateau portant le nom « SAINTE-PAILLE » (016) m'a
  de plus fait hésiter.
- Indice 2 (zone éclairée, puis la caméra se centre sur l'hôpital) : a tout débloqué. Sur le parvis de l'hôpital
  deux personnes (022 à 025) : une soignante à bulle « ? » et un homme en blouse blanche, haut-de-forme,
  parapluie, flacon, pantalon orange. Un seul candidat plausible grâce à « un drôle de chapeau ». 1 tap,
  vignette correcte, « Excellent ! ».
- Verdict : la réponse **n'est pas déductible** sans indice 2. Une fois sur place, la cible est lisible et
  l'indice « drôle de chapeau » suffit. C'est le point noir de l'enquête.

### Q4 — Hector Plumeau, « s'est éclipsé… pour se consoler au milieu des belles choses » (~25 commandes puis indice 1)
- Compris : un lieu plein de belles choses, sans doute le musée (je l'avais deviné ; le jeu confirme « Musée des
  Beaux-Arts » comme pastille de lieu).
- Regardé : la foule de touristes devant le musée (039 à 043) : beaucoup de parapluies/parasols, de chapeaux, de
  chemises rayées orange. Faux pas : des ouvriers en gilet orange qui traversent la rue, un guide à parapluie
  (pantalon bleu marine). J'ai demandé l'indice 1 (« Quel bâtiment… marbre, colonnes, statues ? ») : il
  ne faisait que **confirmer le musée que j'avais déjà deviné** ; il ne localisait pas la personne.
- Trouvé en balayant la façade vers l'est (046, 047) : un homme à parapluie, veste bleue, cravate rouge,
  **pantalon orange**, avec deux bulles « cœur » devant une admiratrice. Une fois zoomé, il est évident.
- Déductible : le lieu oui (« belles choses » → musée), la personne oui avec « pantalon orange » + parapluie
  (Q2). Le détail « cœurs » est un bon clin d'œil narratif (Hector « se console déjà »).

### Q3 — Pétronille Doublure, « répété la scène de la mort au calme » (~30 commandes puis indice 1)
- Compris : lieu calme ayant un rapport avec la mort : cimetière (déduction faite d'emblée, confirmée par la
  pastille « Cimetière · Quartier des Arts »).
- Regardé : tout le cimetière en 6 vues (026 à 034). J'y ai croisé un barbu à chapeau et à parapluie, veste
  jaune, pantalon kaki (027, **sosie piège**), et une femme accroupie bonnet orange (031). Je n'ai **pas vu
  Pétronille** à la première passe, ni la seconde, car elle est dans la partie nord, sur l'allée centrale.
- Indice 1 : « l'endroit le plus calme du quartier des Arts » : **redondant**, il confirme le cimetière sans
  dire où dans le cimetière. J'ai fini par la trouver en repassant (054, 057) : femme à cheveux roux, haut-de-forme
  noir, long manteau vert, partition à la main, bulle « note de musique », et seulement les **chevilles
  orange** visibles sous le manteau. Elle tient une canne au lieu d'un parapluie.
- Déductible : le lieu oui ; la personne seulement par la partition + la note de musique (« répéter ») + le haut-de-forme.
  Le « pantalon orange » est presque invisible ici : la vignette et la capture large ne le montrent pas, il
  faut un crop.

### Q5 — Gontran Lamèche, « lisait son journal pendant l'entracte » (~15 commandes puis indice 1)
- Compris : quelqu'un qui lit sur un banc / une terrasse. Rien dans le texte ne dit où. Je suis parti sur la
  terrasse du Bistrot (060, 061) : une personne âgée aux cheveux blancs, **piste fausse non signalée**.
- Indice 1 : « il est resté sur le parvis du théâtre ». À ce moment, deux captures et un tap ont suffi
  (065 à 068) : homme aux cheveux blancs, haut-de-forme, parapluie, manteau rouge, **pantalon orange**, qui lit un
  journal. Il ressemble trait pour trait au faux infirmier de la Q2 (haut-de-forme + parapluie + pantalon orange).
- Déductible : seulement si on rattache « entracte » au théâtre (le briefing parle de l'entracte sur le
  parvis) ; sinon on tâtonne. Un autre vieux monsieur à cheveux blancs (veste marron) se tient tout près : sosie
  non testé, mais le costume de la Q2 permettait de trancher.

### Q6 — « Comparez les trois comédiens au faux infirmier. Qui a empoisonné Bérénice ? » (4 commandes)
- Compris : comparer les accessoires (chapeau, parapluie, pantalon) vus aux Q2–Q5. Hector : melon + parapluie ;
  Pétronille : haut-de-forme + canne ; Gontran : haut-de-forme + parapluie → Gontran.
- Résolu sans bouger : Gontran était déjà devant moi, avec le contour vert « identifié » (069). Déduction
  vraiment agréable (le texte des réussites « Haut-de-forme et pantalon orange… mais elle s'appuie sur une
  canne » est le bon fil). Un peu **trop facile** : le contour vert désigne d'office le bon personnage parmi la
  foule du parvis.

### Q7 — « Gontran file vers le port pour embarquer sur le dernier bateau » (~20 commandes dont l'indice 1)
- Compris : le port, et un bateau. Le texte ne donne **ni le bateau ni le quai**. Le quai des « Quais du port »
  s'étend sur 7 à 8 écrans et compte une douzaine de bateaux (Mouette, Botte II, Glaneur, Sainte-Paille, Épi,
  Petit Foin, Héron, Joséphine, Fenaison, Belle-Meule, Entracte…), sur deux rangées (071 à 085).
- Ce que j'ai regardé : le quai d'ouest en est, en cherchant haut-de-forme + parapluie. J'ai rencontré un
  homme en haut-de-forme et gilet jaune, pantalon marron, sans parapluie (076, **sosie**).
- Indice 1 : « Il a traversé la Fenaison par le Pont du Parc, puis longé les quais vers l'est, jusqu'au bateau
  "L'Entracte". » Le nom « Pont du Parc » n'est lu nulle part (on a seulement vu « Pont Central » en lieu).
  Mais « L'Entracte » suffisait : bateau trouvé 3 écrans plus loin (085).
- Deux hommes quasi identiques, haut-de-forme et manteau rouge : l'un **debout à la passerelle**, bras levé,
  sans parapluie, pantalon noir (087, **sosie**) ; l'autre **accroupi entre deux caisses**, parapluie ouvert,
  pantalon orange, goutte de sueur (086). J'ai choisi le second grâce au parapluie et au pantalon (indices de la
  Q2). Réussi du premier coup. Le sosie à la passerelle est le choix « naturel » pour qui lit
  « embarquer » : fausse piste juste mais redoutable.

## 3. Problèmes, classés par gravité

### Bloquant
1. **Q2 : l'hôpital est introuvable sans indice 2** (captures 006, 007, 016 à 022).
   - La question ne donne pas de quartier, la minicarte n'affiche aucun lieu nommé, et aucun nom de rue n'est
     visible sur la carte principale.
   - L'indice 1 (« au sud, rue des Brancards ») oriente vers le mauvais endroit : l'hôpital est dans le Quartier
     des Arts, le quartier de départ.
   - Pour le test, j'ai sondé la minicarte avec ~400 taps sans tomber sur l'hôpital. Un vrai joueur
     abandonnerait ou ferait ce que j'ai fait : indice 2 (photo de l'hôpital et projecteur). Gravité : on perd
     2 indices (et une des 3 étoiles) pour une question de **recherche d'un lieu** plutôt que de déduction.

### Gênant
2. **Minicarte : petite, sans lieux nommés, tap peu précis** (006, 007, 020, 021).
   - Hauteur ~130 px, noms de quartiers qui recouvrent le cadre de caméra, aucune icône de lieu. La pastille de
     lieu est le seul moyen de nommer un lieu, mais il faut tomber dessus au pixel près.
   - À deux reprises, pendant une série de taps rapprochés dans la minicarte, celle-ci s'est refermée **sans
     message** (cause exacte inconnue ; probablement un tap tombé près de la croix de fermeture, centre
     203, 80, dans le coin haut-gauche, ou en dehors du cadre). Les taps suivants sont alors tombés sur la
     carte et ont ouvert une feuille « Désigner ce bâtiment ? » (011) ou « Désigner cette personne ? » (013,
     ouvrier du port). Sans conséquence ici (j'ai annulé), mais une validation distraite aurait compté une
     erreur.
3. **Q7 : le bateau n'est pas nommé dans la question** et le quai fait 7–8 écrans de long avec ~12 bateaux
   (071 à 085) ; seul l'indice 1 donne « L'Entracte ». Le nom « Pont du Parc » cité dans l'indice n'est visible
   nulle part. Sans l'indice, c'est une fouille à l'aveugle.
4. **Q7 : deux hommes quasi identiques** (manteau rouge + haut-de-forme), dont le plus proche du bateau est
   un sosie (087). La distinction repose sur le parapluie et le pantalon orange (détails de la Q2, de la Q5), ce
   qui est juste mais exige de s'en souvenir : la question n'en parle plus. Aucun rappel dans le carnet
   (« Notes » vide) pour les retrouver.
5. **Indices de niveau 1 de Q3 et Q4 redondants** : ils confirment un lieu que le joueur a déjà déduit
   (cimetière, musée) mais ne dirigent pas vers la personne. Pour Q3 en particulier, c'est la **recherche dans
   un cimetière de 6+ écrans** qui coince, pas le choix du lieu.
6. **Q3 : pantalon orange invisible** (054, 057). Sous un long manteau vert, on ne voit que les chevilles orange.
   Le seul trait lisible à l'échelle d'un téléphone est le haut-de-forme et la partition. Un sosie plus visible
   (barbu à parapluie jaune, 027) occupe la même zone.

### Mineur
7. **Étoiles : plafond atteint au 1er indice.** « Votre note passera de 3 à 2 étoiles au plus » puis « reste à
   2 étoiles » : j'ai fini avec 6 indices et 0 erreur pour 2 étoiles. Les indices suivants ne coûtent rien de
   visible, ce qui incite à les demander dès qu'on hésite.
8. **Pastille de lieu en doublon** : « Parc des Meules · Parc des Meules » (035).
9. **Panneau de question** : il se redéplie à chaque nouvelle question, il faut rappuyer sur « Replier la
   question » pour avoir plus de carte (cette lassitude se ressent à partir de la 3e fois).
10. **Distracteurs orange** : beaucoup de passants ont du orange (ouvriers du port en gilet et casque
    orange, passants du musée, ouvriers de voirie, 040 à 043, 083). Le « pantalon orange » ne discrimine
    qu'avec le haut-de-forme/le parapluie.
11. **Q6 un peu trop facile** : le personnage « identifié » est entouré de vert en pleine foule (069),
    ce qui désigne la réponse sans réfléchir.
12. **Q5 : « journal »** n'a pas de lien visible avec le lieu final ; le seul vrai indice est « l'entracte » (au
    théâtre). La piste du bistrot (terrasse) est plausible et non signalée comme fausse.

### Aucun incident technique constaté
Aucune erreur de page, aucun plantage, aucun geste perdu : drag, pinch, dtap, minicarte, feuille de confirmation
et indices ont tous répondu. Seule bizarrerie : la fermeture inattendue de la minicarte décrite au problème 2.

## 4. Ce qui m'a plu
- **Briefing** : ton drôle (« Picotin garde les lieux », « jusqu'au dernier bateau »), contexte clair, le
  costume orange qui sert de fil rouge.
- **Q1** : se résout en 2 gestes, la scène est lisible et fait entrer dans le jeu.
- **Les textes de réussite** donnent exactement les détails à retenir (« Blouse blanche et masque… mais un
  haut-de-forme, un parapluie et le pantalon orange »), ce qui rend la **déduction Q6 gratifiante** : comparer
  melon/parapluie, haut-de-forme/canne, haut-de-forme/parapluie.
- **Les bulles** (cœurs pour Hector, note de musique pour Pétronille, « ? », gouttes de sueur) racontent les
  personnages sans texte ; bons repères visuels.
- **L'onglet des 4 sous-questions** (Infirmier/Pétronille/Hector/Gontran) : liberté d'ordre, passage
  automatique à l'onglet suivant après une réussite.
- **Le texte final** (« Trente ans de seconds rôles… ») : bien écrit, la chute (« Picotin a juré de ne plus
  jamais boire de camomille ») est drôle.
- **Moments « aha »** : reconnaître l'accessoire haut-de-forme + parapluie chez Gontran sur le parvis ;
  repérer le parapluie sur le sosie accroupi entre les caisses à la Q7.

## 5. Suggestions concrètes et minimales
1. **Q2** : citer le quartier dans la question (« l'hôpital Sainte-Paille, dans le quartier des Arts »), ou
   afficher les lieux nommés sur la minicarte, ou ajouter une liste « Lieux » dans le carnet qui recentre la
   caméra. Corriger l'indice 1 : « au sud » de quoi ? Remplacer par « Dans le quartier des Arts, juste en
   dessous du théâtre » (s'il l'est), et ne pas citer de rue qui n'est écrite nulle part.
2. **Minicarte** : l'agrandir ou lui donner un zoom, éloigner la croix de fermeture de la zone de tap utile,
   et afficher les lieux nommés dans les textes de l'enquête (un point par lieu).
3. **Q7** : nommer le bateau dans la question (« jusqu'au bateau L'Entracte ») ou réduire le quai ; supprimer
   « Pont du Parc » de l'indice ou le faire apparaître comme lieu.
4. **Sosies de Q7** : le texte de réussite de Q5 pourrait rappeler « parapluie, pantalon orange » pour que la
   distinction du sosie à la passerelle soit juste ; ou ajouter une ligne « Notes » automatique dans le carnet
   (« Faux infirmier : haut-de-forme, parapluie, pantalon orange »).
5. **Indices de niveau 1 de Q3/Q4** : orienter vers la personne plutôt que vers le lieu (« elle tient un
   papier et chante », « il n'est pas seul »).
6. **Q3** : rendre le pantalon orange lisible (manteau court ou ouvert) ou faire qu'un autre trait fort soit
   visible à l'échelle large.
7. **Étoiles** : afficher à l'écran de fin la raison des 2 étoiles et le coût de chaque indice.
8. **Panneau** : mémoriser l'état « replié » d'une question à l'autre.
9. **Pastille de lieu** : ne pas dupliquer le nom quand lieu et quartier coïncident.
