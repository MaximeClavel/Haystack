# Phase 3 — correcteur 2 : périmètre c05 (« Rideau ! »)

Périmètre : `src/content/cases/c05.ts` (seul fichier de code modifié). Verdicts : `scratchpad/fix/c05.json` et
`scratchpad/fix/g-criteres-non-rappeles.json` (id `c05-s2-retenez-bien-sans-pointer-vers-le-carnet`).
Aucun contrat touché, aucun id, aucune position, aucune apparence modifiés ; aucune dépendance ajoutée.
Uniquement des textes (questions, indices, textes de réussite) et une fausse piste (`nearMiss`) sur une zone qui existe déjà dans le monde
(`z.cimetiere`, lieu remarquable « Cimetière »).

## Appliqué

| Constat | Champ de `c05.ts` | Texte final |
|---|---|---|
| `c05-q3-indice1-redondant` (+ `c05-q3-cimetiere-recherche-longue`) | `s3.hints[0].text` | « Où répète-t-on la scène de la mort ? Au plus calme du quartier des Arts. Cherchez un haut-de-forme et une partition. » (**adapté**, voir plus bas) |
| `c05-q3-pantalon-orange-invisible` | `s3.solved` | « Au cimetière, entre deux tombes, Pétronille déclame la mort de l’héroïne. Haut-de-forme, pantalon orange qui dépasse du long manteau vert… mais elle s’appuie sur une canne. » (tel quel) |
| `c05-q3-pas-de-fausse-piste-cimetiere` | `s3.nearMiss` : `z.cimetiere` | « Le cimetière, oui. Mais ce n’est pas ce qu’on cherche : une femme qui déclame, partition en main. » (**adapté**, voir plus bas) |
| `c05-q4-indice1-redondant` | `s4.hints[0].text` | « Quel bâtiment du quartier des Arts abrite le plus de belles choses ? Marbre, colonnes, statues… Il y est en bonne compagnie. » (**adapté**) |
| `c05-q5-journal-sans-lien-avec-le-lieu` | `s5.question` | « Gontran Lamèche, le doyen de la troupe, jure qu’il n’a pas bougé à l’entracte : il lisait son journal. Trouvez-le. » (**adapté**) |
| `c05-q7-bateau-non-nomme` (+ `c05-q7-sosie-passerelle`, le mot « discrètement ») | `s7.question` | « Gontran file discrètement au port pour embarquer sur « L’Entracte », le dernier bateau. Retrouvez-le avant le départ ! » (**adapté**) |
| `c05-q7-bateau-non-nomme` + `c05-q7-indice-pont-du-parc-introuvable` | `s7.hints[0].text` | « Il a franchi le Pont du Parc, à l’entrée ouest du port, puis longé les quais vers l’est, sans aller jusqu’au bout. » (**adapté**) |
| `c05-s2-retenez-bien-sans-pointer-vers-le-carnet` | `s2.solved` | « …L’assassin est l’un des comédiens. Retenez bien ces détails : le carnet les gardera pour vous. » (tel quel) |

### Adaptations par rapport aux textes des vérificateurs (toutes dues à la limite « ≤ 3 lignes à 390, 412 et 360 px »)
Les textes des verdicts passaient sur 4 lignes dans le panneau réel (le mot n’est pas le problème, la largeur l’est). Pour chacun j’ai
retiré le moins de mots possible, en gardant le sens, la voix et le rôle de l’indice. Mesures en jeu réel (voir plus bas) :

| Texte | Verdict (lignes 390 / 412 / 360) | Retenu (390 / 412 / 360) | Modification |
|---|---|---|---|
| `s3` indice 1 | 4 / 3 / 4 | 3 / 3 / 3 | « Où répète-t-on **le mieux** la scène de la mort ? **Dans l’endroit le plus calme** du quartier des Arts. » devient « Où répète-t-on la scène de la mort ? **Au plus calme** du quartier des Arts. » ; la phrase de déduction et les deux traits ajoutés (haut-de-forme, partition) sont conservés |
| `s4` indice 1 | 3 / 3 / 4 | 3 / 3 / 3 | « Il s’y console en bonne compagnie. » devient « Il y est en bonne compagnie. » (la question dit déjà « pour se consoler ») |
| `s5` question | 3 / 3 / 4 | 3 / 3 / 3 | « pendant l’entracte » devient « à l’entracte » |
| `s7` question | 3 / 3 / 4 | 3 / 3 / 3 | « vers le port » devient « au port » |
| `s7` indice 1 | 3 / 3 / 4 | 3 / 3 / 3 | « Il a traversé la Fenaison par le Pont du Parc » devient « Il a franchi le Pont du Parc » (le nom de la rivière est sans valeur de repère : la pastille de lieu l’affiche déjà) ; « sans aller jusqu’au bout » gardé |
| fausse piste `z.cimetiere` | (n’existe pas) | 3 / 3 / 3 | « ce n’est pas **elle** qu’on cherche » devient « ce n’est pas **ce** qu’on cherche » : la zone couvre aussi les tombes, la pelouse et les passants masculins ; « elle » n’aurait rien désigné quand le joueur touche une tombe |

Les textes de réussite (`s2.solved`, `s3.solved`) sont restés **tels quels** : une carte de réussite n’est pas le panneau de question et
des cartes de 4 à 6 lignes existent déjà dans l’enquête (`s6.solved` : 5 / 5 / 6 lignes).

### Pas de spoiler (contrôle des paliers d’indice)
- `s3` indice 1 : ne nomme ni le cimetière ni une zone (la zone reste à l’indice 2, « Au cimetière, sur l’allée centrale. »). Les deux
  traits ajoutés sont déjà publics : le haut-de-forme est dans la réussite de `s2` et dans l’indice 1 de `s6`. Pétronille tient bien un
  petit livret ouvert (pose `read`) sous une bulle de musique (vérifié à zoom 4) : « partition » est lisible à l’écran.
- `s4` indice 1 : n’indique ni le côté de la façade ni le visage ; l’indice 2 (parvis du musée + projecteur) reste le palier suivant. Il
  ajoute seulement « en bonne compagnie » (le duo Hector + admiratrice, deux bulles cœur), qui écarte le sosie ambiant `a.p.2405` (seul).
- `s5` question : le lieu reste à déduire (« n’a pas bougé à l’entracte » = il est resté là où se tient l’entracte, au théâtre). L’indice 1
  (« il est resté sur le parvis du théâtre ») reste une confirmation, l’indice 2 la zone.
- `s7` : le nom du bateau passe de l’indice 1 à la question (ancrage objectif, lisible sur la coque) ; l’indice 1 donne maintenant le
  trajet (pont, entrée ouest du port, quais vers l’est, pas jusqu’au bout), sans désigner la cachette : l’indice 2 (« entre deux caisses »,
  projecteur r = 100 qui exclut l’armateur à 121 u) est inchangé. « discrètement » prépare la distinction avec l’armateur qui fait signe.
- Fausse piste `z.cimetiere` : elle ne dit que ce que le joueur a déjà déduit (le cimetière) et redit la nature de la cible (une femme qui
  déclame, partition en main), comme le font `lm.hopital` (s2) et `lm.musee` (s4). Aucune direction.
- Aucun texte ne cite la couleur d’un chapeau à tort (règle `HAT_WORDS` de `content:check`).

## Écarté / non traité

| Constat | Raison |
|---|---|
| `c05-vignette-confirmation-rogne-parapluie` | Périmètre UI-2 (`thumbRect`, `overlays.ts`), pas c05. |
| `c05-q2-bateau-sainte-paille` | Périmètre MONDE (`src/world/names.ts`, renommer l’entrée en « LA FANEUSE »). |
| `c05-q5-piste-bistrot-non-signalee` | Verdict « aucun » : passants ambiants (`a.p.N`), instables ; un `nearMiss` sur un id ambiant est refusé par le validateur. Le correctif de Q5 (« n’a pas bougé à l’entracte ») traite la cause. |
| `c05-q6-trop-facile-contour-vert` | Verdict « aucun » : décision de l’orchestrateur (les cercles verts des trouvailles restent, aide-mémoire). |
| `c05-distracteurs-orange` | Verdict « aucun » : le critère du jeu est le pantalon orange (0,7 % des passants), pas le haut. |
| `c05-q1-camomille-invisible` | Verdict « aucun » : détail de fiche, non nécessaire pour répondre à Q1. |
| `g-carnet-notes-vide-c05` | Verdict « aucun » (non réel) : la rubrique « Notes » est le bloc-notes libre du joueur ; les détails sont déjà dans « Questions résolues » (d’où la phrase de `s2.solved`, seule retouche retenue). |
| `c05-q7-sosie-passerelle` — « rappeler parapluie / pantalon orange dans la réussite de Q5 » | Écarté sur le verdict même : l’armateur tient aussi un parapluie, le parapluie ne départage pas les deux hommes et renforcerait l’erreur. Seul « discrètement » est retenu. |
| `c05-q3-pantalon-orange-invisible` — variante art `PETRONILLE.top: 'coat' → 'suit'` | Écartée : change la silhouette et la distance d’apparence (règle anti-sosie) ; le correctif par le texte suffit. |

## Vérifications

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | passe (aucune sortie) |
| `npx vitest run` | 17 fichiers, 351 tests passent |
| `npm run content:check` | `OK : aucun problème.` (notes préexistantes c01, c03, c04, c05 seulement ; aucune fausse piste masquée par une réponse) |
| `E2E_PORT=5196 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` | 1 test passé (1,5 min) ; c05 résolue au doigt en 14,3 s, 3 étoiles (le test impose `stars === 3`) |
| `E2E_PORT=5196 npx playwright test tests/e2e/07-corrections.spec.ts -g R2` | passe (désignation d’une réponse d’une autre piste de c05, 0 erreur) |

### Contrôle en jeu réel (Playwright hors dépôt, Chromium émulé téléphone, sauvegarde injectée, vrais taps)
Scripts : `scratchpad/c05check/check.mjs` (panneau, indices, cartes de résultat, 3 largeurs), `cand.mjs` (comptage des lignes de variantes
de texte dans les vrais éléments, avec l’espace insécable `fr()` du jeu), `near.mjs` (comportement de la fausse piste). Captures brouillons
dans `.shots/c05fix/`. Lignes mesurées dans le DOM (390×844 / 412×915 / 360×740) :

| Texte | avant | après |
|---|---|---|
| `s3` indice 1 | 3 / 2 / 3 | 3 / 3 / 3 |
| `s4` indice 1 | 3 / 2 / 3 | 3 / 3 / 3 |
| `s5` question | 3 / 3 / 3 | 3 / 3 / 3 |
| `s7` question | 3 / 2 / 3 | 3 / 3 / 3 |
| `s7` indice 1 | 3 / 3 / 3 | 3 / 3 / 3 |
| fausse piste du cimetière (carte « Pas tout à fait… ») | — | 3 / 3 / 3 |
| carte de réussite `s2` | 4 / 4 / 4 | 5 / 5 / 5 |
| carte de réussite `s3` | 4 / 4 / 4 | 4 / 4 / 5 |

- Panneau de question avec indice 1 ouvert : 43 % de la hauteur à 390×844 (`s3`, `s4`), 37 % pour `s7` ; 52 % à 360×740 pour `s3`/`s4`
  (la carte reste visible au-dessus ; les questions de `s3` et `s4`, non modifiées, y font déjà 4 lignes).
- Fausse piste `z.cimetiere` (`session.submit('s3', pickAt(...))`, zoom 2) : une tombe (`a.o.322`), la pelouse, l’allée et trois passants du
  cimetière donnent `near` sans erreur (`mistakes` = 0) ; Pétronille reste `correct` ; un tap hors du cimetière (rue au sud-ouest,
  nord du cimetière) reste `wrong` (+1 erreur). Par l’interface (390, 412, 360) : tap sur la tombe, « Désigner », carte « Pas tout à fait… » en
  3 lignes, `mistakes` = 0, puis tap sur Pétronille = « Excellent ! ».
- Aucune exception de page pendant les parcours des scripts ; le test e2e 04 (qui fait échouer toute erreur console, réponse HTTP en erreur
  ou requête échouée) passe.

## Limites
- **Fausse piste de zone** : toute désignation ratée dans le cimetière (tombe, passant ambiant) est désormais gratuite en Q3 (les neuf
  passants dont quatre à parapluie, `a.p.188` à `a.p.196`, sont des erreurs possibles sinon). Compromis du verdict, choisi pour un texte qui convient aussi
  à un tap sur un passant. Les cartes « Pas tout à fait… » ne sont jamais comptées comme erreur (règle du jeu inchangée).
- **Cartes de réussite plus hautes** : `s2` passe de 4 à 5 lignes (à tous les formats) et `s3` de 4 à 5 à 360 px, comme `s6` (5 à 6 lignes) ;
  les textes sont gardés tels quels (choix de ne pas raccourcir « le carnet les gardera pour vous » en « le carnet les garde », qui aurait
  gardé `s2` à 4 lignes à 390/412 px).
- **360 px** : les questions de `s3` et `s4` (non modifiées) occupent 4 lignes à cette largeur ; hors périmètre. Plusieurs textes
  retenus passent à 4 lignes à 320 px (hors cibles), non traité.
- L’indice 1 de `s5` (« il est resté sur le parvis du théâtre ») reste très proche de la nouvelle question (« n’a pas bougé à l’entracte ») :
  c’est voulu par le verdict (confirmation), mais s’il faut encore enrichir cet indice 1, on peut y ajouter un trait de Gontran (parapluie rouge
  et blanc, journal) — non fait ici, `c05-q5-journal-sans-lien-avec-le-lieu` ne le demande pas.
- `docs/CONTENT.md` n’est pas régénéré ici (consigne : `npm run content:doc` se lance une seule fois à l’intégration). Il cite encore
  les anciens textes (lignes 1240 à 1295 : `s2.solved`, `s3` indice 1 et réussite, `s4` indice 1, question de `s5`, question et indice 1 de
  `s7`) et ne liste pas la fausse piste `z.cimetiere` de `s3` ; la régénération les reprendra tous depuis `c05.ts`. Le texte du paragraphe
  d’histoire de `tools/content/CONTENT.template.md` (lignes 471-472 : « …jusqu’au bateau « L’Entracte » ») reste exact et n’a pas été touché.
- Le contrôle automatique des bas cachés par un manteau (périmètre OUTILS, `c00-outil-check-bas-masque-par-tablier`) n’était pas
  actif au moment de mes vérifications : si `content:check` en gagne un, le « pantalon orange qui dépasse du long manteau vert » de `s3.solved`
  est volontaire (le bas dépasse du manteau, ce que le jeu dessine) et ne doit pas être signalé.

## Reprise et revérification (état du dépôt après l’intégration)
Une seconde passe sur le même périmètre a trouvé `src/content/cases/c05.ts` **déjà conforme** à ce compte rendu (les corrections sont dans le
commit `7cc9a3e`, `git diff` vide sur ce fichier) : aucune modification de code n’a donc été refaite, pour ne pas dupliquer ni écraser le travail.
Tous les constats du périmètre (`c05-q3-indice1-redondant`, `c05-q3-cimetiere-recherche-longue`, `c05-q3-pantalon-orange-invisible`,
`c05-q3-pas-de-fausse-piste-cimetiere`, `c05-q4-indice1-redondant`, `c05-q5-journal-sans-lien-avec-le-lieu`, `c05-q7-bateau-non-nomme`,
`c05-q7-indice-pont-du-parc-introuvable`, `c05-q7-sosie-passerelle` pour le mot « discrètement », `c05-s2-retenez-bien-sans-pointer-vers-le-carnet`)
sont donc appliqués ; les écartés restent ceux de la table ci-dessus.

Les points « en attente » des limites ci-dessus sont résolus depuis :
- `docs/CONTENT.md` a été régénéré à l’intégration (`d57a900`) : il reprend les textes finaux de `c05.ts` (lignes 1248, 1255-1256, 1267, 1273, 1305).
- Le contrôle des bas cachés (`tools/content/check.ts`, périmètre OUTILS) est maintenant actif : `npm run content:check` ne signale rien sur
  le « pantalon orange qui dépasse du long manteau vert » de `s3.solved` (le bas dépasse, ce que le jeu dessine).
- Le renommage du bateau homonyme de l’hôpital (`c05-q2-bateau-sainte-paille`, périmètre MONDE) est en place : `src/world/names.ts` ligne 74 = `'LA FANEUSE'`.

Mesures refaites en jeu réel sur l’interface actuelle (script `scratchpad/c05check/check.mjs`, Chromium émulé téléphone, sauvegarde injectée, vrais
taps) : identiques à la table « après » ci-dessus. Question et indices modifiés : 3 lignes à 390, 412 et 360 px (sauf les questions non modifiées de `s3`
et `s4`, 4 lignes à 360 px, déjà signalées). Fausse piste du cimetière : 3 lignes aux trois largeurs, `mistakes` = 0 ; tombe, pelouse et allée donnent `near`.
Cartes de réussite : `s2` 5 lignes (390/412/360), `s3` 4 / 4 / 5.

| Commande | Résultat (reprise) |
|---|---|
| `npx tsc --noEmit` | passe |
| `npx vitest run` | 17 fichiers, 362 tests passent |
| `npm run content:check` | `OK : aucun problème.` (mêmes notes préexistantes c01, c03, c04, c05) |
| `E2E_PORT=5196 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` | 1 test passé (1,4 min) ; c05 résolue au doigt en 14,3 s, 3 étoiles |
| `E2E_PORT=5196 npx playwright test tests/e2e/07-corrections.spec.ts -g R2` | passe (4,4 s) |
