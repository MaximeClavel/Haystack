# Phase 3 — Rejeu aveugle du tutoriel c00 (joueur « c00r », petit écran 390×844)

Joueur test aveugle, nouveau testeur : seul `tools/playtest/README.md` a été lu avant la partie ; rien dans `src/`, `docs/`,
`tests/`, `scripts/`, ni les parties des autres. Commandes : `node tools/playtest/blind.mjs … --case c00 --player c00r`.
Captures : `.shots/playtest/c00/c00r/` (001 à 006).

## 1. Verdict

| Mesure | Valeur |
|---|---|
| Enquête résolue | **Oui** (« Affaire classée ») |
| Questions résolues | **3 / 3** |
| Erreurs | **0** |
| Indices | **0** |
| Étoiles | **3 / 3** (« Aucun indice et au plus 2 erreurs : le maximum ! ») |
| Commandes | 22 (17 au moment de la fin de l'enquête, le reste : carnet et arrêt) |
| Durée | 2 min 07 s (1 min 45 s à la fin de l'enquête) |
| Images lues | 6 (aucune lecture d'image n'a échoué : `imagesReadable = true`) |
| Incidents techniques de la page | 0 |

Aucun geste de navigation (`drag`, `dtap`, `pinch`) n'a été nécessaire : tout le tutoriel se joue avec des `tap` sur le cadrage
de départ. Aucun message « Rapprochez-vous pour désigner » n'est apparu. Je n'ai pas utilisé `Minicarte`, `Punaise` ni `Indice`
(donc je ne peux rien dire de leur texte de confirmation ni de leur coût).

## 2. Question par question

### Briefing (capture 001)
- **Compris** : je suis un inspecteur nouvellement arrivé ; la commissaire Fétu a perdu sa tarte aux fraises et son chien blanc
  Croquette ; le brigadier Picotin m'attend au square de la rue Neuve. Les gestes sont donnés en une phrase : « Pincez pour zoomer,
  glissez pour vous déplacer, et touchez une personne ou un objet pour le désigner. »
- Le ton est drôle, la mise en situation est claire, le bouton « Commencer l'enquête » est bien visible. L'indicateur de
  difficulté (1 loupe pleine sur 5) rassure.

### Question 1 — « Trouvez le brigadier Picotin : casquette de police, uniforme bleu, bermuda beige. Il vous fait signe. »
- **Regardé** : capture 002 (plein écran avec grille), puis un agrandissement 003 autour du seul personnage en uniforme bleu.
- **Compris** : habits donnés + attitude (« fait signe »). Un seul personnage de la scène bleu avec casquette de police, bras levé,
  près du haut du square, vers (221, 264). L'agrandissement confirme : casquette, uniforme bleu, bermuda beige, main au front.
- **Tentative** : 1 seule. Toucher → feuille « Désigner cette personne ? » avec une vignette encadrée de blanc montrant bien le
  brigadier (capture 004) → « Désigner » → « Bien vu ! ».
- **Déductible** : oui, totalement. Texte + image suffisent. Le fait qu'il « fasse signe » est visible à l'écran (bras levé).
- **Ce qui a aidé** : le cadrage de départ est directement sur le square ; la vignette de confirmation lève tout doute avant de valider.

### Question 2 — « Où est le livreur (tablier blanc, casquette rouge) MAINTENANT, dans le square ? Astuce : un même personnage peut apparaître plusieurs fois sur la carte, à différents moments de son histoire. »
- **Compris** : grâce au récit de Picotin (« tablier blanc, casquette rouge, cheveux bouclés… il traversait le square vers l'ouest…
  et il n'en est jamais ressorti ») et au mot MAINTENANT en capitales + l'astuce, j'ai compris qu'il y avait deux (ou plus)
  versions du livreur et qu'il fallait trouver la plus tardive.
- **Regardé** : dès la capture 002 j'avais repéré, à l'est, une serveuse/livreur à casquette rouge et cheveux bouclés portant une
  tarte (vers (279, 316)) : c'est le livreur « avant ». À l'ouest, un personnage assis sur un banc avec une bulle « Zzz » (vers
  (103, 322)) : même casquette rouge, cheveux bouclés, tablier blanc, bras vides ; la tarte est à terre à côté. Capture 005
  (agrandissement ×3) pour confirmer.
- **Tentative** : 1 seule (le dormeur). Réponse juste : « Excellent ! Le livreur dort à poings fermés sur un banc. Et ses bras sont
  vides : plus de tarte ! Le fil rouge relie vos trouvailles, dans l'ordre de l'histoire. »
- **Déductible** : oui, mais c'est la seule vraie « réflexion » du tutoriel. Le piège « le livreur à la tarte, à l'est » est bien
  signalé par MAINTENANT + l'astuce + « vers l'ouest ». Un débutant très pressé pourrait toucher le livreur à la tarte (le plus
  visible, il tient l'objet dont on parle depuis le briefing) ; il serait alors renvoyé par une « fausse piste » (non testé).
- **Ce qui a aidé** : l'indice de direction « vers l'ouest » dans la réponse précédente, la bulle « Zzz » qui est un détail visuel
  très lisible.

### Question 3 — « Le livreur dort, la tarte traîne dans l'herbe. Qui va s'en régaler ? »
- **Compris** : un animal, très probablement le chien blanc du briefing (Croquette), qui était à côté de la tarte.
- **Regardé** : la tarte et un chien blanc au sol, juste sous le banc (capture 005). Il y a un second chien (brun-orange) ailleurs dans
  le square, avec un promeneur : je l'ai écarté, car la question parle de la tarte dans l'herbe, près du dormeur, et le briefing
  mentionne un « chien blanc ».
- **Tentative** : 1 seule, sur le chien blanc (139, 376). La feuille a dit « Désigner cet animal ? » (le jeu adapte donc le libellé :
  bon point). « Affaire résolue ! Croquette ! … ».
- **Déductible** : oui, à condition d'avoir retenu « mon chien blanc, Croquette » du briefing. Sinon, c'est tout de même le chien le
  plus proche de la tarte.

### Fin d'enquête (capture 006)
- Écran « Affaire classée », 3 étoiles, texte explicatif (« Aucun indice et au plus 2 erreurs : le maximum ! »), récapitulatif des
  indices et des erreurs, boutons « Revoir l'histoire », « Retour aux enquêtes », « Regarder la carte », « Recommencer ». La carte
  derrière montre le fil rouge qui relie les trois trouvailles : très satisfaisant.
- Le carnet (ouvert après coup) contient : briefing relisible, questions résolues avec leur réponse, personnages identifiés
  (Brigadier Gaston Picotin, Timothée Fournil le livreur), Notes, Punaises (« Une punaise marque un endroit à revoir. »).

## 3. Problèmes (classés par gravité)

### Bloquant
Aucun.

### Gênant
1. **Le tutoriel n'enseigne aucun des gestes qu'il annonce (pincer, glisser) ni les boutons du panneau.** Le briefing les cite en une
   phrase, mais le cadrage de départ est déjà idéal et les trois cibles tiennent dans l'écran d'origine : un débutant ne zoome ni ne
   déplace jamais la carte, et ne rencontre jamais « Rapprochez-vous pour désigner ». Les boutons « Minicarte », « Punaise »,
   « Indice » (sous la question) ne sont expliqués nulle part avant qu'on en ait besoin ; le coût d'un indice n'est révélé qu'au
   moment du clic (non testé ici). Pour un tutoriel, c'est une occasion manquée, surtout quand l'enquête suivante demandera de
   chercher plus loin que le cadrage de départ. Preuve : captures 002 (panneau avec les trois boutons non commentés) et le journal de
   commandes (aucun `drag`/`pinch`/`dtap`).
2. **La question 2 est la seule où l'on peut se tromper « de bonne foi » et rien ne prépare au concept « même personnage à plusieurs
   moments » avant la question** (il n'est expliqué que dans l'« Astuce » de la question elle-même). C'est bien fait, mais l'astuce est
   noyée dans une longue phrase du panneau du bas ; sur petit écran le panneau est dense (capture 002 : 3 lignes pour Q1, davantage pour Q2).

### Mineur
3. **Le « fil rouge » est annoncé (« Le fil rouge relie vos trouvailles, dans l'ordre de l'histoire ») à la fin de la Q2, alors que la
   carte est cachée par la feuille de réponse ; je ne l'ai vu qu'à l'écran de fin (capture 006).** Je n'ai pas regardé la carte entre
   Q2 et Q3, donc je ne sais pas s'il y est déjà visible à ce moment-là : la phrase reste abstraite à la lecture.
4. **Carnet ouvert depuis l'écran de fin** : il s'affiche **par-dessus** la feuille « Affaire classée » (l'outil `text` mélange les deux
   feuilles) ; et la liste de boutons du résumé n'indique que « Voir la réponse de la question 1 » et « … 2 », pas « … 3 » (peut-être
   hors écran, non vérifié visuellement — à contrôler).
5. **Le texte de la feuille « Désigner cette personne ? » répète la question** avant la vignette, utile, mais l'ensemble « question +
   vignette + 2 boutons » consomme beaucoup de place sur un écran de 844 px ; la cible tapée n'est plus visible derrière la feuille
   (obligation de s'en remettre à la vignette — qui fonctionne bien, capture 004).
6. Observation : le lieu affiché passe de « Vieille Ville » à « Rue des Remèdes · Vieille Ville » à l'écran de fin, et la carte y est
   cadrée plus large que pendant l'enquête (capture 006) : la caméra a visiblement été recadrée par le jeu pour montrer le fil rouge.
   Sans conséquence, mais le joueur n'est pas prévenu que la carte bouge toute seule.
   (Aucune faute de texte relevée dans les messages lus.)

## 4. Ce qui m'a plu

- Un briefing court, drôle et lisible ; le personnage de la commissaire a de la voix.
- Une première question **parfaitement guidée** : habits + attitude (« il vous fait signe ») → on trouve en 5 secondes.
- La **feuille de confirmation avec vignette encadrée** : on sait exactement ce qu'on désigne (libellé adapté : « cette personne » /
  « cet animal »).
- Le **récit qui fait avancer l'enquête** : la réponse à Q1 contient l'indice (direction « vers l'ouest », description du livreur)
  qui sert à Q2, et la réponse à Q2 ouvre Q3. On est récompensé de lire.
- La **scène du square est lisible** : les personnages sont bien distincts, les détails (bulle « Zzz », tarte à terre, chien blanc)
  racontent l'histoire sans texte.
- Les messages de réussite (« Bien vu ! », « Excellent ! », « Affaire résolue ! ») et l'écran « Affaire classée » avec tampon,
  étoiles, fil rouge sur la carte et « Revoir l'histoire » sont gratifiants.
- Aucun incident technique, réponses instantanées, textes sans faute.

## 5. Suggestions concrètes et minimales

1. **Ajouter une courte astuce non bloquante pendant Q1** (ou sur la première carte « Bien vu ! ») qui nomme les gestes et les trois
   boutons : « Pincez pour zoomer, glissez pour bouger. Indice : un coup de pouce (coûte des étoiles). Punaise : marque un endroit. »
   Ou faire que la cible de Q3 (ou Q2) soit un peu hors cadre pour obliger à glisser/pincer au moins une fois dans le tutoriel.
2. **Mettre « MAINTENANT » et l'astuce de Q2 sur deux lignes distinctes** (la phrase principale, puis l'astuce en plus petit/italique)
   pour la lisibilité sur petit écran.
3. **Afficher brièvement le fil rouge sur la carte** (par exemple en fermant la feuille « Excellent ! » ou en le montrant derrière une
   feuille réduite), pour que la phrase « Le fil rouge relie vos trouvailles » soit vérifiable au moment où elle est lue.
4. **Vérifier le bouton « Voir » de la question 3 dans le carnet** quand il est ouvert depuis l'écran de fin (absent de la liste
   des boutons du résumé), et décider si le carnet doit se fermer ou masquer la feuille de fin lorsqu'il s'ouvre.
5. Pour l'organisateur : le tutoriel est réussi à 100 % sans aucun geste de navigation ; si l'objectif est de former à
   `pincer/glisser`, cela suppose de le provoquer (voir 1). Si l'objectif est de ne pas effrayer, il remplit très bien son rôle.

## Limites du test

- Une seule partie, un seul testeur, petit écran. Je n'ai pas testé : fausse piste (« Pas tout à fait… »), message « Rapprochez-vous
  pour désigner », `Minicarte`, `Punaise`, `Indice` (donc aucune information sur le coût des indices), ni la reprise après
  `Retour aux enquêtes`.
