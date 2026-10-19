# Phase 3 — Joueur test aveugle : enquête c00 « La Tarte de bienvenue » (tutoriel)

Joueur : `c00` · appareil : petit téléphone 390×844 · captures dans `.shots/playtest/c00/c00/` (001 à 039) ·
journal des commandes : `.shots/playtest/c00/c00/commands.jsonl`.
Règles respectées : seul `tools/playtest/README.md` lu avant la fin de la partie ; uniquement des commandes
`node tools/playtest/blind.mjs …` ; aucun fichier du dépôt modifié hormis ce compte rendu ; rien de commité.

## 1. Verdict

| Mesure | Résultat |
|---|---|
| Enquête résolue | **Oui** (écran « Affaire classée ») |
| Questions résolues | **3 sur 3** |
| Erreurs | **0** (chaque désignation a été validée du premier coup) |
| Indices utilisés | **0** |
| Étoiles | **3 sur 3** |
| Commandes | **70** au total (39 captures, 10 `press`, 3 `tap`, 3 `dtap`, 8 `drag`, 4 `pinch`, 1 `text`, 2 `status`) |
| Durée | 4 min 08 s selon l'outil ; ressenti : un peu plus de 4 minutes, dont ~2 min 20 s perdues sur la question 2 |
| Incidents techniques | **0** observé (`daemon.log` vide d'erreurs ; aucune erreur de page, aucune lenteur ressentie ; démarrage en 2,8 s, gestes 0,6 à 1,9 s) |

Répartition des commandes : Q1 ≈ 8 commandes, Q2 ≈ 40 commandes (dont ~25 captures), Q3 ≈ 11 commandes.
Je n'ai jamais approché le seuil de 40 commandes « bloqué » sur une même question sans progresser, donc je n'ai pas
ouvert le système d'indices (je ne peux donc rien dire de son confort : la confirmation de coût n'a pas été testée).

Remarque sur l'outil : `status` n'affiche aucune ligne « incidents » (la consigne disait qu'il les comptait). Le chiffre 0
vient de l'absence d'erreur dans `daemon.log`, de l'absence de message d'échec dans les retours de commandes et de mon
ressenti de fluidité.

## 2. Question par question

### Q1 — « Trouvez le brigadier Picotin : casquette de police, uniforme bleu, bermuda beige. Il vous fait signe. »
- **Compris** : repérer un policier qui fait un signe de la main.
- **Regardé** : la vue de départ (capture 002). Un seul personnage en uniforme bleu avec casquette, bras levé, au
  milieu du haut du square, à côté de la voiture de police. Zoom `--crop` (004) : bermuda beige confirmé.
- **Tentatives** : 1 (tap en 221,264 → feuille de confirmation « Désigner cette personne ? », vignette 005
  correcte → « Bien vu ! »).
- **Déductible ?** Oui, immédiatement. « Il vous fait signe » est un excellent indice (geste visible même dézoomé).
  Aucun tâtonnement.

### Q2 — « Où est le livreur MAINTENANT ? Astuce : un même personnage peut apparaître plusieurs fois sur la carte, à différents moments de son histoire. »
- **Compris** : retrouver le livreur (casquette, tablier blanc, short rouge d'après le témoignage de Picotin,
  qui l'a vu « traverser le square vers l'ouest » et « jamais ressortir »), et choisir parmi plusieurs apparitions la plus
  tardive (« MAINTENANT » en majuscules + l'astuce).
- **Regardé** (dans l'ordre, et c'est là que j'ai perdu du temps) :
  1. Les passants du square vus au départ : un promeneur de chien à casquette rouge (008), un passant en vert sous un
     store (009, 023), un ouvrier au casque jaune au bord ouest (010). Aucun ne correspond.
  2. Comme Picotin parle de « l'ouest », je suis sorti du square : panoramique vers le Quartier de la Gare (011, 012),
     minicarte (013), dézoom (014-016), place de la gare pleine de monde (018-019), La Poste (021).
     Beaucoup de personnages, aucun livreur.
  3. Retour sur le square, zoom (026) : j'ai alors regardé les deux personnages que j'avais négligés au départ : une
     personne à casquette rouge et grand tablier blanc qui porte la tarte (027, vue marchant vers l'ouest) et une personne
     endormie sur un banc avec une bulle « Z » et la même casquette (029).
  4. Déduction : même personnage, deux moments ; le « maintenant » est celui qui n'a plus la tarte et dort (la bulle « z »,
     les bras vides).
- **Tentatives** : 1 (tap sur le dormeur en 157,340 ; vignette 030 correcte → « Excellent ! Le livreur dort à poings
  fermés sur un banc. Et ses bras sont vides : plus de tarte ! »).
- **Déductible ?** Oui, mais j'ai dû **tâtonner pour savoir où chercher**, et j'ai en partie **choisi par raisonnement
  narratif** (le plus tardif = sans tarte + endormi) plutôt que par un indice écrit explicite. Rien ne dit que la
  réponse est dans le square de départ ; tout le tutoriel est pourtant visible dans le cadrage initial (capture 002 :
  Picotin, la livreuse/le livreur en marche, le dormeur, le chien blanc et le gâteau). Les indices vestimentaires écrits
  (« short rouge », voire « tablier blanc ») ne m'ont pas aidé à identifier le bon personnage (voir problèmes).

### Q3 — « La tarte a disparu pendant la sieste du livreur. Qui l'a mangée ? »
- **Compris** : désigner le coupable ; la phrase fait le lien avec la sieste (donc avec le dormeur de Q2) ; le briefing
  parle d'un chien disparu « par coïncidence » → soupçon d'un chien.
- **Regardé** : autour du dormeur : un petit chien blanc à collier rouge, sans laisse, à quelques pas, juste à côté d'un
  gâteau sur une assiette (031, 035) ; plus loin un autre chien (orange) tenu en laisse par un promeneur ; des pigeons
  (033, 028).
- **Tentatives** : 1 (tap sur le chien blanc en 148,412 ; vignette 036 « Désigner cet animal ? » → « Affaire résolue !
  Croquette ! … le museau plein de crème »).
- **Déductible ?** Oui, assez facilement : seul chien libre, collé à la tarte. Mais je ne pouvais pas **confirmer** que
  c'était Croquette (aucun signalement du chien dans le briefing), et ni la « crème » sur le museau ni la tarte
  « disparue » ne se voient (voir problèmes).

## 3. Problèmes, classés par gravité

### Bloquant
Aucun.

### Gênant
1. **Les indices vestimentaires de Q1/Q2 ne permettent pas d'identifier le livreur** (captures 007, 027, 029).
   Picotin décrit « casquette, tablier blanc, short rouge ». À l'écran du petit téléphone, l'apparition « en marche »
   montre une casquette rouge, un grand tablier blanc qui descend jusqu'aux genoux et des jambes nues : **le short
   rouge n'est visible nulle part** (caché par le tablier). L'apparition « endormie » est assise derrière le banc : tablier
   et short invisibles, seule la casquette rouge se reconnaît. J'ai donc écarté ces deux personnages au premier regard
   (aucun « short rouge ») et suis parti explorer la ville entière : ~25 captures et 40 commandes pour une cible située à
   50 px de mon point de départ. Preuve : 002 (cible dans la vue de départ), 007 → 026 (exploration inutile), 027/029.
2. **Rien n'indique où chercher ni comment départager les apparitions.** Le témoignage dit « vers l'ouest… jamais ressorti »
   (que j'ai compris comme « sorti du square par l'ouest »). L'astuce de Q2 est utile mais ne dit pas lequel est le
   « maintenant » : j'ai dû déduire « celui qui n'a plus la tarte » par ma seule intuition. Un joueur qui désigne le
   livreur en marche (apparition la plus visible) aurait une erreur (tolérée, mais dommage pour un tutoriel à 3 étoiles).
3. **Le panneau de Q2 ne rappelle pas le signalement** du livreur : il faut s'en souvenir ou rouvrir le carnet
   (qui le contient, 039). Sur un tutoriel, cela alourdit une question déjà ouverte.

### Mineur
4. **Gâteau intact à côté du chien** (031, 035) alors que la question dit « la tarte a disparu » et que la conclusion parle
   d'un « museau plein de crème » : le chien blanc n'a aucune trace de crème visible et l'objet posé à côté ressemble à un
   petit gâteau à étages avec une cerise, pas à une tarte aux fraises. Cela ne m'a pas empêché de répondre, mais ça affaiblit
   le « aha » final (je désigne le chien sur la foi de sa proximité, pas d'une preuve visible).
5. **Chien à confirmer** : deux chiens dans le square (blanc libre / orange en laisse), et Croquette n'est décrit nulle
   part (ni couleur, ni collier). La vignette « Désigner cet animal ? » est un bon garde-fou mais ne tranche pas.
6. **Fil rouge de l'histoire confondable avec une laisse** (032, 033, 037) : après Q2, un trait rouge relie les deux
   apparitions du livreur, jusqu'à traverser l'écran ; il a la même couleur que la laisse du promeneur de chien (rouge
   aussi), et sa poignée dorée au poignet du dormeur ressemble à une laisse. Sur le moment j'ai cru que le dormeur tenait un
   chien en laisse hors cadre et j'ai suivi le fil sur ~6 commandes (1 `dtap`, 2 `drag`, 3 captures) avant de comprendre que
   c'était un lien « même personnage ». Aucune légende ne l'explique.
7. **Faux dormeur à l'ouest** (011, 012) : dans le Quartier de la Gare, un autre personnage dort sur un banc avec la même bulle
   « Z » (cheveux blonds frisés, vêtements sombres, sans casquette ni tablier). Pas déloyal (vêtements différents), mais avec
   « vers l'ouest » dans le témoignage, c'est un sosie plausible pour un joueur qui n'a pas regardé le square avec soin.
8. **Minicarte peu lisible sur petit écran** (013) : vignette d'environ 190×130 px, noms de quartiers à peine lisibles et
   « Quartier de la Gar… » tronqué ; elle ne m'a rien appris sur le square.
9. **Bouton « Indice » le plus voyant du panneau** (002, 007) : plein jaune, comme un bouton principal, alors que
   « Minicarte » et « Punaise » sont neutres. Risque de clic involontaire par un débutant (la confirmation de coût protège
   ensuite, non testée).
10. **Genre du livreur** : le personnage a de longs cheveux bouclés et peut se lire comme une femme, alors que le texte dit
    « le livreur » / « il ». Un doute de plus pendant la recherche (027).
11. **Outil de test** (hors jeu) : `shot --crop` sur de petites zones (≈70×70 px) renvoie une image minuscule peu
    exploitable ; il vaut mieux cadrer ≥ 150 px.

## 4. Ce qui m'a plu
- **Le briefing** : ton complice et drôle de la commissaire Fétu (« Ce n'est pas encore un crime, mais c'est déjà un drame »,
  « je suppose que c'est une coïncidence ») ; il explique les trois gestes de base (pincer, glisser, toucher) en trois lignes.
- **Q1 comme prise en main** : cible évidente, geste « il vous fait signe » très lisible, feuille de confirmation avec
  vignette encadrée de blanc rassurante ; le texte de récompense relance l'enquête et fournit le signalement suivant.
- **Les effets de récompense** : cadre vert persistant sur les personnages résolus, cartes « Bien vu ! / Excellent ! »,
  tampon « AFFAIRE CLASSÉE » et trois étoiles, bouton « Revoir l'histoire », carnet avec liens « Voir ».
- **Le moment « aha » de Q2** : comprendre que la livreuse/le livreur qui porte la tarte et le dormeur aux bras vides sont la
  même personne à deux moments ; la bulle « Z » et la tarte absente racontent l'histoire sans texte. L'astuce est bien
  placée dans cette question, et non dans le briefing.
- **Le chien Croquette** : chute drôle (le chien de la commissaire, « coïncidence, disiez-vous ? »), boucle bien avec le briefing.
- **Cohérence du tutoriel** : les trois cibles sont toutes dans le cadrage de départ ; la partie est rapide (4 min), sans
  lenteur ni bug.
- **Le lieu sous le centre de la carte** (pastille « Vieille Ville » / « Quartier de la Gare ») m'a aidé à m'orienter.

## 5. Suggestions concrètes et minimales
1. **Q1/Q2 — rendre le signalement visible ou le corriger** : soit retirer « short rouge » du témoignage (ou le remplacer par
   un détail réellement visible à l'écran, par ex. « casquette rouge, tablier blanc, cheveux bouclés »), soit raccourcir le
   tablier pour que le short rouge se voie. Vérifier que le signalement tient sur les deux apparitions (marche et sieste).
2. **Q2 — dire où chercher et comment trancher** : par ex. dans l'astuce « Cherchez-le dans le square : il y apparaît à
   plusieurs moments ; « maintenant », c'est le plus tardif de son histoire. » (ou rappeler le signalement dans le texte de la
   question).
3. **Q3 — rendre la preuve visible** : soit mettre de la crème sur le museau du chien blanc, soit retirer le gâteau intact (ou le
   remplacer par une assiette vide / une tarte entamée), et/ou nommer la couleur de Croquette dans le briefing
   (« un petit chien blanc à collier rouge »). Le texte final et l'image doivent coïncider.
4. **Fil rouge « même personnage »** : le dessiner d'une autre couleur que les laisses (ou en pointillés) et l'accompagner, la
   première fois, d'une légende courte (« Même personne, deux moments »).
5. **Bouton « Indice »** : style secondaire (contour) par défaut, pour qu'il ne paraisse pas être l'action attendue.
6. **Minicarte (petit écran)** : agrandir la vignette ou la rendre plein écran, pour que les noms de quartiers soient lisibles.
7. **Outil** : afficher un compteur d'incidents dans `status` (comme annoncé dans la consigne), et agrandir réellement les petits `--crop`.
