# Phase 3 — Intégration des correcteurs 3

Rôle : intégrateur, sans fonctionnalité nouvelle et sans commit de ma part. Base : arbre de travail au-dessus de `efc028b`, 16 fichiers
modifiés par les deux correcteurs (journaux `phase3-correcteur3-interface.md` et `phase3-correcteur3-textes-et-controle.md`, non suivis).
Machine : conteneur 4 cœurs, Chromium sans GPU, Pixel 7 émulé ; rien d'autre de lourd en parallèle pendant les mesures (vérifié par `ps`
avant l'e2e et après le joueur test : aucun `vite`, `playwright`, `chrom`, `daemon.mjs` restant).

## 1. Contrats

`git diff --name-only` filtré sur `src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts` : **vide** (rien non plus en
index). Aucun contrat touché. Les ajouts d'API des correcteurs sont propres aux modules : `apostrophes()` et `districtName` (`format.ts`),
`foundCountLabel` (`texts.ts`), prop `leftHanded` de `QuestionPanel`, jeton CSS `--hay-3`, `drawnAppearance` / `casePeople` / `entityPeople`
(`tools/content/hidden.ts`). Une ligne « Aucun changement » les recense dans `docs/ARCHITECTURE.md` § 8.

## 2. Contrôles statiques

| Commande | Résultat |
|---|---|
| `npm run content:doc` | `docs/CONTENT.md` : au premier passage, **3 lignes changées (+3/−3), exactement les trois textes modifiés** : indice 1 de c01 s3, fausse piste `c04.picotin.2` de s5, indice 1 de c05 s5. Aucun id, aucune position, aucune apparence. Après ma retouche du gabarit (§ 5, point 4) : 9 lignes de diff en tout (+5/−4, les mêmes trois textes + 2 lignes de la règle 11), 1 793 lignes, sortie stable (même md5 au relancement) |
| `npm run content:check` | « Monde construit avec 7 enquêtes (98 entités) en 376 ms », **9 notes** (les mêmes qu'à la passe précédente : 6 sosies déclarés de c01, c03, c04, c05, `c01.poubelle` recouvert à 28 % par `c01.caisse`, et les 2 notes « pantalon orange » de c05), **« OK : aucun problème. »** |
| `npx tsc --noEmit` | 0 erreur |
| `npx tsc -p tools/content/tsconfig.json` | 0 erreur |
| `npx vitest run` | **17 fichiers, 367 tests verts** (4,3 s) ; 362 à la passe précédente + 5 nouveaux (`format.test.ts` 29 → 32 : apostrophes et échelle de la vignette ; `texts.test.ts` 18 → 20 : `foundCountLabel`) |
| `npm run build` | OK en 1,75 s, `index-*.js` 500,79 kB (165,97 kB gzip), CSS 30,49 kB ; seul avertissement : paquet > 500 kB (connu, inchangé ; 500,4 kB à la passe précédente) |
| Mutation de l'autotest de `hidden.ts` (refaite par moi) | `return ch ? ch.appearance : e.appearance;` remplacé par `return e.appearance;` : `content:check` échoue avec **3 problèmes** « autotest du bas masqué : cible : … » (exit 1) ; fichier restauré (md5 identique avant/après), retour à « OK : aucun problème. ». `selfTest()` contient maintenant 26 lignes `expect('` (19 à la passe précédente) |

Les contrôles rapides (`vitest`, `content:check`, `tsc` ×2) ont été relancés après mes retouches de documentation : mêmes résultats.

## 3. Tests de bout en bout

`E2E_PORT=5303 npx playwright test` (suite complète) : **41 tests réussis en 4,2 min, 0 échec, 0 reprise.** Répartition : 01 démarrage 2,
02 tutoriel 1, 03 erreurs et indices 1, 04 toutes les enquêtes 1, 05 explorer et réglages 4, 06 parcours console 1, 07 corrections 13,
08 retours des joueurs 15 (dont les 5 nouveaux : noms accessibles de la reconstitution, apostrophe typographique, contraste du bouton Indice,
deux tests à 320 × 568), 09 caméra et marges 3. Enquêtes résolues au doigt par le test 04 :
c00 5,9 s, c01 7,5 s, c02 9,2 s, c03 12,7 s, c04 12,7 s, c05 14,0 s, bonus 12,2 s. Aucun test n'a eu besoin d'être corrigé (les regex
`Bien vu !` avaient déjà été adaptées par le correcteur de l'interface). Aucune erreur console (la fixture de `helpers.ts` aurait fait
échouer le test).

## 4. Fluidité, gestes, joueur test

| Mesure | Résultat | Référence (passe précédente) | Verdict |
|---|---|---|---|
| `perf-map.mjs`, CPU ×1, TOTAL (1 486 images) | p50 16,7 / **p95 16,7** / max 33,4 ms, **0 image > 33 ms** ; JS moteur p95 10,0 ms ; rendu moyen d'une tuile 7,3 ms ; cache 68/68 | p95 16,8, 2 images > 33 ms, tuile 7,9 ms | **objectif p95 ≤ 20 ms atteint**, inchangé |
| `perf-map.mjs`, CPU ×4, TOTAL (1 074 images) | p50 33,3 / p95 66,7 / max 133,4 ms, 395 images > 33 ms ; JS moteur p95 26,1 ms ; tuile 41,1 ms ; glisser p95 16,8 ms | p95 66,6, tuile 38,8 ms | identique (voir `openIssues` pour l'écart avec § 9 de l'architecture) |
| `perf-map.mjs --gestures` | **30/30 contrôles réussis** | 30/30 | identique |
| `tools/playtest/selftest.mjs` | **84 contrôles « OK », 0 échec**, « SELFTEST OK : tous les contrôles passent. » (exit 0, lancé deux fois : même résultat) ; section D : arrêt propre (8 processus terminés, fichier d'état supprimé, ports fermés), aucune erreur de page dans `daemon.log` | 84 OK | identique |
| `tools/playtest/blind.mjs list` | « Aucune partie en cours. » ; 0 processus restant | idem | OK |

Non lancé (non demandé, et ni le moteur ni le monde ne sont touchés par cette passe) : `perf-map.mjs --startup`.

## 5. Cohérence documentaire

Relu : `README.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `src/ui/README.md`, `tests/e2e/README.md`, `tools/playtest/README.md`,
`tools/content/CONTENT.template.md`, plus les outils qui s'appuient sur l'interface (`src/ui/tools/*.mjs`, `tools/playtest/selftest.mjs`,
`scripts/`) : tous passent par des `data-testid` ou des libellés normalisés, aucun ne dépend de l'ordre des boutons, de l'apostrophe ou
de l'espace insécable de « Bien vu ! ».

| # | Où | Ce qui était périmé / manquant | Correction |
|---|---|---|---|
| 1 | `src/ui/README.md` (`format.ts`) | pastille de lieu décrite sans la normalisation d'apostrophe | `districtName`, `apostrophes()` : l'affichage a ’, les noms du monde gardent l'apostrophe droite (contrat `layoutSpec`) |
| 2 | `src/ui/README.md` (`texts.ts`) | `foundCountLabel` absent | ajouté (nom accessible du compteur « n/10 ») |
| 3 | `src/ui/README.md` (Enquête, Indices, Réglages) | ordre des actions et des boutons de confirmation décrit sans le mode gaucher ; « en miroir » laissait croire à un `row-reverse` | ordre inversé en gaucher, rangé dans cet ordre dans le DOM (prop `leftHanded`), bouton Indice en `--hay-3` ≥ 3:1 |
| 4 | `src/ui/README.md` (Résultats, Fin) | toasts non typographiés ; boutons de la reconstitution sans nom accessible précis | `fr()` appliqué aux toasts (« Bien vu&nbsp;! ») ; « Précédent : moment précédent » / « Suivant : moment suivant » |
| 5 | `src/ui/README.md` (Comment jouer, Accessibilité) | mise en page 320 × 568 et règles d'accessibilité absentes | media `max-height: 600px` et texte 15 px ; nom accessible commençant par le texte visible (WCAG 2.5.3), compteur `role="img"`, contrastes ≥ 3:1 (WCAG 1.4.11), onglets de c05 resserrés à ≤ 340 px |
| 6 | `tests/e2e/README.md` | « toute la suite ≈ 2 min » (mesuré : 4,2 min) ; ligne du spec 08 sans les cinq nouveaux tests | « 41 tests, ≈ 4 min » ; ligne du spec 08 complétée |
| 7 | `docs/ARCHITECTURE.md` § 4 (outils de contenu) | `hidden.ts` décrit sans l'apparence jugée ni l'autotest | cibles jugées sur l'apparence dessinée par le monde (`drawnAppearance`, `casePeople`, `entityPeople`), `selfTest()` exécuté à chaque `content:check` |
| 8 | `docs/ARCHITECTURE.md` § 8 | pas de ligne pour cette passe | ligne « Aucun changement » du 2026-10-20 (correcteurs 3 et intégration) avec les ajouts propres aux modules |
| 9 | `tools/content/CONTENT.template.md` règle 11 (copiée dans `docs/CONTENT.md`) | la règle du bas caché ne dit pas quelle apparence est jugée, alors que le comportement a changé (le correcteur des textes l'avait suggéré) | une phrase ajoutée : « L'apparence jugée est celle que le monde dessine : celle du personnage quand l'entité en désigne un, et non celle déclarée sur l'entité » ; `content:doc` relancé |

Vérifiés sans écart : `README.md` (commandes inchangées), `tools/playtest/README.md` (« apostrophes sans importance » pour `press` : conforme
au selftest), `docs/ARCHITECTURE.md` § 9 hors l'écart noté ci-dessous.

Les journaux des correcteurs sont cohérents avec mes mesures (367 tests, 41 e2e, « OK : aucun problème ») ; le journal « textes et contrôle »
dit que `docs/CONTENT.md` n'est pas régénéré : c'est fait ici.

## 6. Ce que je n'ai pas fait / à savoir

- **Aucun code corrigé** : aucune régression, aucun échec à relancer.
- `CLAUDE.md` dit « e2e ≈ 3 min » (mesuré 4,2 min, comme les deux passes précédentes) : non modifié, ce sont les consignes des agents.
- `docs/ARCHITECTURE.md` § 9 donne 33 / 50 ms (CPU ×4) ; la mesure du jour est 33,3 / 66,7 ms, comme aux deux passes précédentes. L'écart est antérieur à
  cette passe (la passe précédente l'attribuait à la direction artistique ou au bruit de machine) : valeur de référence laissée, à arbitrer.
- Captures de `docs/screenshots/` et `docs/JOURNAL.md` : non touchés (preuves datées / journal de l'orchestrateur).
- Limites des correcteurs, reportées telles quelles : indice 1 de c01 s3 à la limite des 3 lignes à 360 px ; « Comment jouer » à 320 × 568 en
  15 px ; onglets de c05 à 320 px serrés (13,5 px, 9 px de marge) ; le nom du compteur ne dit « aiguille » que pour une enquête `bonus` ;
  `drawnAppearance` cherche le personnage dans l'enquête de l'entité (0 cas divergent aujourd'hui) ; les 2 notes « pantalon orange » de c05
  (arbitrage laissé à l'orchestrateur depuis la passe précédente).

## 7. Rejouer

```bash
git diff --name-only | grep -E '^src/(types|config)\.ts$|^src/art/bounds\.ts$|^src/world/layoutSpec\.ts$'   # vide
npm run content:doc && git diff --stat docs/CONTENT.md
npm run content:check && npx tsc --noEmit && npx tsc -p tools/content/tsconfig.json && npx vitest run && npm run build
E2E_PORT=5303 npx playwright test
node scripts/perf-map.mjs && node scripts/perf-map.mjs --gestures
node tools/playtest/selftest.mjs && node tools/playtest/blind.mjs list
```
