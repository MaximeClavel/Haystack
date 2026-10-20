# Phase 3 — Intégration des correcteurs 2

Ce journal couvre deux passes d'intégration, sans fonctionnalité nouvelle et sans commit de ma part : la **seconde passe** (ci-dessous,
arbre de travail après `d57a900`) puis la **première passe** (§ 1 à 8, conservée telle quelle, commit `d57a900`).

## Seconde passe (arbre de travail au-dessus de `d57a900`, 20/10)

### Ce qui avait changé depuis `d57a900`

`git status` au départ : 12 fichiers modifiés (3 de code, 9 journaux), aucun nouveau, aucun supprimé.
- `src/content/cases/c04.ts` : une seule ligne, l'indice 1 de l'étape 2 (« Rappelez-vous la vitrine : un seul jumeau tenait le diamant,
  celui au sac à dos. … », raccourci parce que l'ancienne version passait sur 4 lignes à 390 et 360 px).
- `tools/content/check.ts` et `tools/content/hidden.ts` : la règle du bas caché juge désormais un texte d'étape sur les **cibles de
  l'étape** (`accept`) et un message de fausse piste sur la **cible de la fausse piste** (paramètre facultatif `subjects`), au lieu de
  laisser passer le texte dès qu'un autre personnage de l'enquête montre le même bas à découvert ; 4 cas d'école de plus (19 en tout).
- 9 journaux `docs/journal/phase3-correcteur2-*.md` : paragraphes de revérification des correcteurs (bonus, c00 à c05, moteur, outils).

### 1. Contrats

`git diff --stat -- src/types.ts src/config.ts src/art/bounds.ts src/world/layoutSpec.ts` (arbre de travail) et
`git diff --stat d57a900 HEAD` sur les mêmes fichiers : **vides**. Aucun contrat touché ; la ligne « Aucun changement » du 2026-10-20 de
`docs/ARCHITECTURE.md` § 8 reste exacte (aucune API nouvelle depuis).

### 2. Contrôles statiques

| Commande | Résultat |
|---|---|
| `npm run content:doc` | `docs/CONTENT.md` (1 788 lignes avant mes retouches) : la diff au premier passage est **une seule ligne**, l'indice 1 de c04 s2 (nouveau texte), rien d'autre (aucune position, aucun id, aucune apparence). Régénéré une seconde fois après ma retouche du gabarit (voir § 6) : 1 792 lignes, 8 lignes de diff en tout (la ligne de c04 + le paragraphe ajouté à la règle 11), sortie stable (même somme md5 au relancement) |
| `npm run content:check` | « Monde construit avec 7 enquêtes (98 entités) en 420 ms », **9 notes** (7 déjà présentes à la première passe : sosies déclarés de c01, c03, c04, c05 et `c01.poubelle` recouvert à 28 % par `c01.caisse` ; **2 nouvelles**, voulues par la règle des cibles et déjà décrites dans le journal des outils : `[c05] s2 résolution` et `[c05] s6 fausse piste c05.petronille.1`, « pantalon orange » qui ne dépasse que d'un manteau), **« OK : aucun problème. »** (aucune erreur) |
| `npx tsc --noEmit` | 0 erreur (6,1 s) ; `npx tsc -p tools/content/tsconfig.json` : 0 erreur (5,4 s) |
| `npx vitest run` | **17 fichiers, 362 tests verts** (4,8 s), identique à la première passe : aucun test n'a été ajouté (les 4 cas d'école de `hidden.ts` sont dans `content:check`, pas dans Vitest) |
| `npm run build` | OK en 1,8 s, `index-*.js` 500,4 kB (165,9 kB gzip), CSS 30,4 kB ; seul avertissement : le paquet dépasse 500 kB (connu, inchangé) |

### 3. Tests de bout en bout

`E2E_PORT=5185 npx playwright test` (suite complète, aucun autre processus lourd, vérifié par `ps` avant et après) : **36 tests réussis en
4,1 min, 0 échec, 0 reprise, aucun test « instable sous charge »**. Enquêtes résolues au doigt par `04-toutes-les-enquetes` : c00 en 6,0 s,
c01 9,1 s, c02 10,7 s, c03 12,5 s, c04 12,7 s, c05 14,0 s, bonus 12,3 s (3 étoiles imposées). Aucun test n'a eu besoin d'être corrigé : le
seul texte de jeu modifié depuis la première passe (indice 1 de c04 s2) n'est cité par aucun test (`grep` sur `tests/`, `src/**/*.test.ts`,
`tools/`, `scripts/` : aucune occurrence de l'ancien ni du nouveau libellé).

### 4. Fluidité (`scripts/perf-map.mjs`, conteneur 4 cœurs, Chromium sans GPU, Pixel 7 émulé)

| Mesure | Résultat | Référence | Verdict |
|---|---|---|---|
| CPU ×1, TOTAL (1 486 images) | p50 16,7 / **p95 16,8** / max 33,4 ms, 2 images > 33 ms ; JS moteur p95 10,1 ms ; rendu moyen d'une tuile 7,9 ms | première passe : 16,8 (1 485 images, 0 > 33 ms) ; phase 2 : 16,7–16,8 | **objectif p95 < 20 ms atteint**, inchangé (2 images > 33 ms sur 1 486 : un pincer et un vol, bruit de machine) |
| CPU ×4, TOTAL (1 082 images) | p50 33,3 / **p95 66,6** / max 133,3 ms, 321 images > 33 ms ; JS moteur p95 22,8 ms ; tuile 38,8 ms ; glisser p95 16,8 ms | première passe : 66,7 ms, tuile 39,5 ms ; phase 2 : 50 ms | identique à la première passe |
| `--gestures` | **30/30 contrôles réussis** | première passe : 30/30 | identique |
| `--startup`, ×1 (3 pages neuves) | `buildWorld` à froid médiane 269 ms ; premier rendu 153 ms ; vue de jeu 219 ms | première passe : 269 / 172 / 234 ms ; phase 2 : 211 / 130 / 150–167 ms | identique à la première passe |
| `--startup`, ×4 (3 pages) | `buildWorld` 1 015 ms + premier rendu 746 ms = **≈ 1,76 s** ; vue de jeu 1 161 ms | première passe : 971 + 876 = 1,85 s (A/B : 1,74–1,83 s pour les trois révisions testées) ; phase 2 : 1,4–1,6 s | sous le seuil de 2 s ; l'écart avec la référence de la phase 2 est celui de la machine du jour, établi à la première passe par A/B (les correcteurs ne ralentissent pas le démarrage), et rien de ce qui a changé depuis ne touche le moteur ni le monde |

Valeur de référence de `docs/ARCHITECTURE.md` § 9 (1,4–1,6 s) non modifiée, pour la même raison qu'à la première passe.

### 5. Outil de joueur test

`node tools/playtest/selftest.mjs` : **84 contrôles « OK », 0 échec**, « SELFTEST OK : tous les contrôles passent. » (exit 0) ; la
section D confirme l'arrêt propre (8 processus terminés, fichier d'état supprimé, ports fermés) et l'absence d'erreur de page dans
`daemon.log`. Ensuite `node tools/playtest/blind.mjs list` → « Aucune partie en cours. » ; aucun processus `daemon.mjs` ni Chromium restant.

### 6. Relecture croisée des journaux : ce qui a été corrigé

| # | Incohérence | Correction |
|---|---|---|
| 1 | `docs/CONTENT.md` citait l'ancien indice 1 de c04 s2 (annoncé par le journal c04) | régénéré (§ 2) |
| 2 | Le gabarit `tools/content/CONTENT.template.md` (règle 11 de la bible, copiée dans `docs/CONTENT.md`) décrivait la règle du bas caché sans la précision des cibles de l'étape / de la fausse piste, qui change pourtant le verdict (c05) | un paragraphe ajouté à la règle 11 (« le contrôle juge d'abord la ou les personnes visées… »), `content:doc` relancé |
| 3 | `docs/journal/phase3-correcteur2-c04.md` : l'introduction de « Adaptations » disait que « les deux textes » passaient sur 4 lignes à 360 px alors que la section en liste désormais trois dont l'un (indice 1 de s2) dès 390 px | introduction réécrite (deux textes à 360/375 px, le troisième dès 390 px) |

Relus sans écart : les paragraphes de revérification de c00, c01, c02, c03, c05, du bonus, du moteur (chiffres cohérents avec ce journal :
362 tests, 30/30, p95 16,8 ms, 36 e2e) et des outils (19 cas d'école : `grep -c "expect('"` dans `selfTest()` = 19 ; 2 nouvelles notes de c05 :
vérifiées dans la sortie de `content:check`) ; `README.md`, `tools/playtest/README.md`, `src/art/README.md`, `src/engine/README.md`,
`src/ui/README.md`, `docs/ARCHITECTURE.md` (§ 4 outils de contenu décrit déjà la règle du bas caché sans entrer dans le détail des cibles,
ce qui reste exact) : aucun ne décrit un comportement modifié depuis la première passe.

### 7. Ce que je n'ai pas fait / à savoir

- **Les 2 notes de c05** (« pantalon orange » de la résolution de s2 et de la fausse piste de Petronille) sont laissées : une note est un
  conseil, pas une erreur, et la règle fait ce que le journal des outils annonce ; mais ce sont des textes de jeu (c05), qu'il n'appartient
  pas à l'intégrateur de réécrire. À arbitrer par l'orchestrateur : les laisser (le pantalon orange est le fil rouge de c05 et la troupe
  porte le costume en répétition) ou ajouter « qui dépasse du… » comme dans la réussite de s3. Voir `phase3-correcteur2-outils.md`.
- **Nombre de lignes de l'indice 1 de c04 s2** (3 / 3 / 3 à 390, 412, 360 px) : mesure du correcteur c04, non refaite ; les 36 e2e passent.
- Captures de `docs/screenshots/`, `docs/JOURNAL.md`, valeur de référence du démarrage : comme à la première passe (voir § 7 ci-dessous).

### 8. Rejouer (seconde passe)

```bash
npm run content:doc && npm run content:check && npx tsc --noEmit && npx vitest run && npm run build
E2E_PORT=5185 npx playwright test
node scripts/perf-map.mjs && node scripts/perf-map.mjs --gestures && node scripts/perf-map.mjs --startup
node tools/playtest/selftest.mjs && node tools/playtest/blind.mjs list
```

---

## Première passe (commit `d57a900`)

Rôle : intégrateur, sans fonctionnalité nouvelle. Les correcteurs (monde, c00 à c05, bonus, interface UI-1 et UI-2, moteur, outils)
avaient déjà été committés par l'orchestrateur en deux temps (`356f00f`, `7cc9a3e`) ; il restait dans l'arbre de travail les retouches
de commentaires du moteur (`constants.ts`, `mapView.ts`) et la correction du journal du moteur (« 12 » devenu « 11 » nouveaux tests,
vérifié : 27 tests dans `camera.test.ts` contre 16 en début de phase). Rien n'est committé par moi.

## 1. Contrats

`git diff --stat 0d7fa04 HEAD -- src/types.ts src/config.ts src/art/bounds.ts src/world/layoutSpec.ts` : **vide** (0d7fa04 = début de la
phase 3) ; `git diff --stat HEAD` sur les mêmes fichiers : vide aussi. Aucun contrat touché. Les ajouts d'API des correcteurs sont tous
propres aux modules (`EngineMapView.setInsets`, 7ᵉ paramètre facultatif de `clampCamera`, `ScreenInsets`, `INSETS_GLIDE_MS` ;
`placeName(…, margin?)`, `placeCaptureMargin`, `texts.ts`). Une ligne « Aucun changement » a été ajoutée à
`docs/ARCHITECTURE.md` § 8 « Journal des changements de contrat ».

## 2. Contrôles statiques

| Commande | Résultat |
|---|---|
| `npm run content:doc` | `docs/CONTENT.md` **n'était pas régénéré** depuis les correcteurs : 85 insertions / 58 suppressions au premier passage. Relue ligne à ligne : la diff ne contient **que** les conséquences des textes modifiés (briefings, questions, indices, réussites, fausses pistes de c00 à c05 ; nouvel ordre et légendes de la reconstitution de c01 ; vers 2 et 9 et indices du bonus ; annotations « masqué par le tablier… » des signes distinctifs, issues de `gen.ts`) et du paragraphe « Indices » du bonus. Aucune position, aucun id, aucune apparence. Régénéré une seconde fois après mes retouches du gabarit (voir § 5) : 1 788 lignes ; relancé ensuite, stable |
| `npm run content:check` | « Monde construit avec 7 enquêtes (98 entités) en 374 ms », 7 notes (les mêmes que les journaux : sosies déclarés, `c01.poubelle` recouvert à 28 % par `c01.caisse`), **« OK : aucun problème. »** |
| `npx tsc --noEmit` | 0 erreur (6 s) ; `npx tsc -p tools/content/tsconfig.json` : 0 erreur |
| `npx vitest run` | **17 fichiers, 362 tests verts** (4,8 s) |
| `npm run build` | OK en 2 s, 110 modules, `index-*.js` 500,4 kB (165,9 kB gzip), 30,4 kB de CSS ; seul avertissement : le paquet dépasse 500 kB, connu |

## 3. Tests de bout en bout

`E2E_PORT=5185 npx playwright test` (suite complète, aucun autre processus lourd en parallèle) : **36 tests réussis en 4,1 min, 0 échec,
0 reprise, aucun test « instable sous charge »**. Détail : 01 démarrage (2), 02 tutoriel (1), 03 erreurs et indices (1), 04 toutes les
enquêtes résolues au doigt (1 ; c00 en 6,0 s, c01 8,8 s, c02 10,5 s, c03 12,7 s, c04 12,8 s, c05 14,5 s, bonus 12,3 s, 3 étoiles imposées),
05 explorer et réglages (4), 06 parcours console (1), 07 corrections (13), 08 retours des joueurs (10), 09 caméra et marges (3). Aucun test
n'a eu besoin d'être corrigé : les libellés changés volontairement (« N pistes ouvertes », horizon du coût d'un indice, « relire »,
3ᵉ toast d'erreur…) avaient été mis à jour dans les tests par UI-1.

## 4. Fluidité (`scripts/perf-map.mjs`)

Machine : conteneur 4 cœurs, Chromium sans GPU, Pixel 7 émulé, rien d'autre en cours pendant les mesures.

| Mesure | Résultat | Référence | Verdict |
|---|---|---|---|
| CPU ×1, TOTAL (1 485 images) | p50 16,7 / **p95 16,8** / max 33,4 ms, 0 image > 33 ms ; JS moteur p95 9,3 ms ; rendu moyen d'une tuile 7,5 ms | phase 2 : 16,7–16,8 ; direction artistique : 16,7, tuile 7,4 ms ; moteur (correcteur) : 16,8 | **objectif p95 < 20 ms atteint**, inchangé |
| CPU ×4, TOTAL (1 084 images) | p50 33,3 / **p95 66,7** / max 116,8 ms, 392 images > 33 ms ; JS moteur p95 23,5 ms ; tuile 39,5 ms ; glisser p95 16,8 ms (60 i/s) ; pincer p95 83 ms | direction artistique : 66,7 ms et 39–41 ms ; moteur : 66,7 ms (A/B identique) ; phase 2 : 50 ms | identique à la phase 3 (direction artistique) ; l'écart avec la phase 2 (50 ms) date de la direction artistique ou du bruit de machine, il est antérieur aux correcteurs |
| `--gestures` | **30/30 contrôles réussis** (glisser, inertie, pincer, double-tap, tap, bornes, `onCameraChange` ≤ 1 par image, repos sans image, `flyTo`, `fitRect`, mouvement réduit, `renderSnapshot`, molette, souris, clavier) | moteur : 30/30 | identique |
| `--startup`, ×1 (3 pages neuves) | `buildWorld` à froid médiane 269 ms ; premier rendu 172 ms ; vue de jeu 234 ms | phase 2 : 211 ms ; 130 ms ; 150–167 ms | un peu plus lent, voir ci-dessous |
| `--startup`, ×4 (3 pages) | `buildWorld` 971 ms + premier rendu 876 ms = **≈ 1,85 s** ; vue de jeu 1 191 ms | phase 2 : 864–951 + 537–652 = 1,4–1,6 s | sous le seuil de 2 s, mais au-dessus de la référence : A/B ci-dessous |

**A/B du démarrage ×4** (5 pages neuves chacun, même machine, même session, copies de travail `git worktree` détachées puis supprimées) :

| Révision | `buildWorld` à froid | premier rendu | somme |
|---|---|---|---|
| `522408c` (avant la direction artistique) | 1 013 ms | 821 ms | 1,83 s |
| `0d7fa04` (direction artistique) | 948 ms | 802 ms | 1,75 s |
| arbre de travail actuel (correcteurs 2 + intégration) | 976 ms | 766 ms | 1,74 s |

Les trois révisions sont équivalentes (dispersion d'une page à l'autre : ±100 ms et plus) : **les correcteurs ne ralentissent pas le
démarrage** ; l'écart avec les 1,4–1,6 s de la phase 2 vient de la machine d'aujourd'hui (la même révision `522408c` donne 1,83 s).
La valeur de référence de `docs/ARCHITECTURE.md` § 9 (1,4–1,6 s, mesurée en phase 2) n'est donc pas modifiée ; ce journal consigne
1,7–1,85 s pour cette machine à ce jour.

## 5. Outil de joueur test

`node tools/playtest/selftest.mjs` : **« SELFTEST OK : tous les contrôles passent. »** (55 s) ; relancé une seconde fois : même résultat
(exit 0). Il vérifie en particulier `status` (ligne « Incidents techniques de la page : 0 »), `shot --crop` agrandi, `press Voir --nth 2`
sur le carnet, l'absence d'erreur de page dans `daemon.log`, l'arrêt propre. Après : `node tools/playtest/blind.mjs list` →
« Aucune partie en cours. » ; aucun processus `daemon.mjs` ni Chromium restant.

## 6. Relecture croisée des journaux : incohérences corrigées

| # | Incohérence | Correction |
|---|---|---|
| 1 | `docs/CONTENT.md` décrivait encore tous les anciens textes (annoncé par les 7 journaux de contenu) | régénéré (§ 2) |
| 2 | **Gabarit `tools/content/CONTENT.template.md` ligne 199** : « le chien blanc a la tarte sous le museau » — faux depuis c00 (le chien se tient devant la tarte entière, plus de crème), signalé par le journal c00 mais hors de son périmètre | remplacé par « le chien blanc se tient devant la tarte entière » ; « Amorce loyale » : « le chien **blanc** de la commissaire, Croquette » (le briefing nomme désormais le chien blanc) |
| 3 | Gabarit : la règle de la bible « objet tenu que la foule n'a jamais (… tarte…) » était fausse avant le correctif du monde (22 passants portaient une tarte) et ne dit pas que c'est maintenant garanti | précisé : « `people.ts` n'en donne à aucun passant ambiant, `world.test.ts` le vérifie » |
| 4 | Gabarit : aucune trace de la règle « bas caché » de `content:check` (le journal des outils le suggérait) | ajoutée à la liste des règles de `content:check` (§ outils) et à la règle 11 de la bible (« Le texte dit ce que le dessin montre »), avec l'annotation des « Signes distinctifs » et l'exception « pantalon orange qui dépasse du long manteau » |
| 5 | **`src/engine/README.md`** décrivait l'ancien comportement : « la caméra y glisse en 180 ms ; pendant un glisser… elle est ramenée tout de suite » — or la version livrée fait glisser les **bornes** (`insets` animés), la caméra étant simplement repoussée (le vol de caméra a été essayé et écarté, voir `phase3-correcteur2-moteur.md`) | paragraphe réécrit ; `setInsets` ajouté au tableau des méthodes de `EngineMapView` ; `ScreenInsets` ajouté aux exports annexes |
| 6 | `docs/ARCHITECTURE.md` § 4 ne citait ni `setInsets` ni le paramètre de marges de `clampCamera` ; la ligne `check.ts` ignorait la règle du bas caché ; § 10 sans e2e ni joueur test ; § 8 sans ligne pour la phase 3 | corrigés (§ 4 moteur, § 4 outils de contenu, § 8 « Aucun changement », § 10) |
| 7 | **`src/ui/README.md`** : le coût d'un indice sans horizon, « Question N sur M » seul, toast d'erreur unique, pastille « lieu remarquable · quartier » sans rues, croix de la minicarte « atteignable », vignette « serrée sur la cible », pas de ligne d'explication de la note, repère `stars-why` absent, marges « cadrage » sans borne de caméra (le journal du moteur demandait de le compléter à l'intégration) | tableau des écrans et repères de test mis à jour (pastille avec rues et marge de capture, « N pistes ouvertes », horizon du coût, fiche repliée « relire », style secondaire du bouton Indice, trois toasts d'erreur, vignette sur l'emprise visuelle, ligne `stars-why`, croix hors de la vignette, marges qui bornent la caméra, repères `conclude` et `stars-why`) |
| 8 | Journal du moteur : « 12 nouveaux tests » | déjà corrigé en « 11 » dans l'arbre de travail (vérifié : 27 − 16) ; commentaires de `constants.ts` et `mapView.ts` alignés sur le glissement des bornes — conservés |

Vérifiés sans écart : `README.md` (commandes inchangées), `tools/playtest/README.md` (`press --nth`, `--crop` agrandi, compteur
d'incidents : conformes au code et au selftest), `tests/e2e/README.md` (lignes des specs 07, 08, 09 présentes), `src/art/README.md`
(aucun correcteur n'y touche : le dessin des tabliers/manteaux est décrit sans couleur de bas), `src/world/README.md` et
`src/game/README.md` (rien sur les tartes de la foule ni le nom des bateaux).

## 7. Ce que je n'ai pas fait / à savoir

- **Captures de `docs/screenshots/`** : preuves datées de leur phase (certaines montrent peut-être l'un des 22 passants dont l'objet change
  ou un bateau « SAINTE-PAILLE », voir le journal du monde) ; non régénérées, elles ne sont citées par aucune documentation vivante.
- **`docs/JOURNAL.md`** (journal de l'orchestrateur) : non modifié.
- **Valeur de référence du démarrage** (`docs/ARCHITECTURE.md` § 9) : non modifiée (voir § 4).
- Limites connues des correcteurs, reportées telles quelles : aiguille 9 du bonus à 129 u des Jardins ouvriers (pastille « Les Jardins »
  seulement), 7 libellés de pastille sur 681 tronqués à 360 px (minicarte fermée), 4ᵉ onglet de c05 coupé à 320 px, question de Q2 de c02
  coupée au trait d'union à 360 px, quelques cartes de réussite à 4–6 lignes, `g-seuil-designation-sans-tolerance` et
  `g-retap-pendant-le-vol-avale` reportés par décision de l'orchestrateur.

## 8. Rejouer

```bash
npm run content:doc && npm run content:check && npx tsc --noEmit && npx vitest run && npm run build
E2E_PORT=5185 npx playwright test
node scripts/perf-map.mjs && node scripts/perf-map.mjs --gestures && node scripts/perf-map.mjs --startup
node tools/playtest/selftest.mjs && node tools/playtest/blind.mjs list
```
