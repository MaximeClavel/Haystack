# Phase 4 — agent `documentation` : documentation finale

Date : 20/10/2026. Périmètre : `README.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md` (une retouche), `docs/PLAN-WEB.md`, `docs/JOURNAL.md`
(nouvelle entrée en fin de fichier), quatre captures `docs/screenshots/readme-*.png`, ce compte rendu. **Aucun fichier de `src/`, `tools/`,
`tests/`, `scripts/` modifié**, aucun contrat touché, aucune dépendance ajoutée, rien de commité. La section « À faire à la toute fin »
du journal (récapitulatif des branches) n'est pas touchée.

## Ce qui a changé

### `README.md` (réécrit en vitrine)
Présentation (4 phrases), planche de quatre captures, « Comment on joue » (exact par rapport à `src/ui/screens/HowTo.tsx`, `src/ui/README.md`
et aux règles de `src/game/session.ts` : trois étoiles = aucun indice et au plus 2 erreurs ; deux = pas de révélation, niveaux d'indice cumulés
≤ nombre de questions, au plus 6 erreurs), les sept enquêtes (titres, difficultés et accroches **recopiés** de `src/content/cases/*.ts`, aucune
solution), lancer en local (Node 22, `dev`, `build`, `preview`, pages de développement, paramètres d'URL), mise en ligne (workflow
`.github/workflows/pages.yml`, réglage unique Settings > Pages > Source = « GitHub Actions », URL attendue
`https://maximeclavel.github.io/Haystack/`), tableau des commandes mis à jour, tests et contrôles (unitaires, e2e, `content:check`, joueur test
aveugle, fluidité), organisation des dossiers, état du projet (fait, limites connues, pistes). Chiffres vérifiés aujourd'hui : 367 tests
unitaires (`npx vitest run`), 41 tests e2e en 9 fichiers (`npx playwright test --list`), 8 275 entités, 39 lieux remarquables, 9 quartiers.

### `docs/ARCHITECTURE.md`
- **§ 9** réécrit sur les mesures du 20/10 : CPU ×1 p50 / p95 16,7 / 16,7–16,8 ms, tuile ≈ 7–8 ms ; CPU ×4 p50 / p95 33,3 / 66,7 ms, tuile
  ≈ 39–41 ms ; `buildWorld` ×4 ≈ 970–1 015 ms, premier rendu ×4 ≈ 750–880 ms, démarrage ×4 ≈ 1,75–1,85 s contre 1,4–1,6 s en phase 2, avec la
  note de l'A/B de `phase3-integration-correcteur2.md` (1,83 / 1,75 / 1,74 s pour trois révisions : écart dû à la machine, pas aux correctifs).
- **§ 1** : ligne `tools/playtest` ; renvoi aux README de `src/ui`, `tests/e2e`, `tools/playtest`.
- **§ 4** : `setInsets` (bornes de la caméra dans la zone libre, nord sous la barre haute, glissement des bornes en 180 ms, aucun vol) ;
  règle du bas caché (erreur si tout est caché, note si en partie, cibles de l'étape / de la fausse piste) ; nouveau paragraphe `tools/playtest`.
- **§ 6** : `?screen=` et `?reduced=1` (absents), contenu réel de `window.__haystack`, **pastille de lieu avec rues** (`placeName`,
  `placeCaptureMargin`, apostrophe typographique, minicarte sans noms de lieux), marges de l'interface, le joueur test n'utilise jamais `?debug`.
- **§ 10** : 41 tests e2e (≈ 4 min), 367 tests unitaires, 84 contrôles du selftest, `content:doc`, `npm run shot`, `npm run build`.
- **§ 8** (journal des contrats) : **non modifié**. Contrôle : `git diff --stat 0d7fa04 HEAD` et `git diff --stat HEAD` sur
  `src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts` : vides. Aucune erreur factuelle repérée dans les lignes existantes.

### `CLAUDE.md`
Une seule retouche : `npm run e2e` « ~3 min » → « ~4 min » (mesuré 4,1–4,2 min aux trois dernières passes). CLAUDE.md ne cite aucun nombre de tests.

### `docs/PLAN-WEB.md`
Section « 5. État au 20/10/2026 » ajoutée en bas (phases 0 à 3 terminées, phase 4 en cours) avec les écarts au plan (scénaristes fusionnés en un seul,
revue de performance faite par l'intégration, e2e « toutes les enquêtes » existant depuis la phase 2, outil de joueur test non prévu). Le plan lui-même n'est pas réécrit.

### `docs/JOURNAL.md`
Entrée « 2026-10-20 — Fin de la phase 3 » ajoutée **en fin de fichier** : joueurs test aveugles (7 puis 7 rejeux), triage et vérification des constats sur
le vrai jeu (plus de 80), arbitrages, correctifs (monde, enquêtes, interface, caméra, outils), relectures, résultats avant/après (renvoi à
`phase3-bilan-rejeu.md`), contrôles de fin de phase, incidents, et un paragraphe « Phase 4 » **à compléter par l'orchestrateur**.

## Captures produites (`docs/screenshots/`, 780 × 1 688 px = 390 × 844 à densité 2)

| Fichier | Contenu | Production |
|---|---|---|
| `readme-accueil.png` (399 ko) | Accueil : étiquette punaisée, vue de la Grand-Place, quatre boutons (point rouge « Comment jouer » = première visite) | `npm run shot -- "/?screen=accueil" docs/screenshots/readme-accueil.png` |
| `readme-ville.png` (927 ko) | Exploration libre, zoom 0,4 sur la Grand-Place (hôtel de ville, église, foule) ; pastille « Grand-Place · Vieille Ville » | `npm run shot -- "/?screen=explorer&x=3050&y=2150&zoom=0.4" docs/screenshots/readme-ville.png` |
| `readme-enquete.png` (812 ko) | c01, « Question 1 sur 4 » : foule du marché, panneau de question, Minicarte / Punaise / Indice | script de brouillon (ci-dessous) |
| `readme-fin.png` (246 ko) | Fin du hors-série : tampon « Affaire classée », trois étoiles, ligne « pourquoi cette note », épilogue, indices et erreurs | script de brouillon (ci-dessous) |

Deux captures demandent des gestes (taper « Commencer l'enquête », préremplir la sauvegarde) que `scripts/shot.mjs` ne sait pas faire. Elles ont été produites par
un script de brouillon, **non versionné** (`.shots/readme/make.mjs`, dossier ignoré par git), qui reprend le principe de `scripts/shot.mjs` et de
`src/ui/tools/states.mjs` : serveur Vite sur un port libre, Chromium 390 × 844 densité 2 tactile, `?debug` seulement pour `__haystack.map` (le HUD de
coordonnées est masqué par une feuille de style) ; erreurs console et exceptions de page collectées : **aucune**.

- `readme-enquete.png` : `/?debug&case=c01`, tap sur « Commencer l'enquête », attente de `map.whenIdle()`, puis `map.setCamera` de 330 px d'écran vers le sud et 30 vers
  l'est : le joueur « cherche dans la foule » et **la boulangère de la question 1 n'est pas à l'écran** (elle se trouve devant la boulangerie, au nord du cadrage de départ ;
  la capture du cadrage de départ la montrait). Aucun cadre, aucun projecteur, aucune trouvaille, aucun toast.
- `readme-fin.png` : sauvegarde `haystack:v1` **fabriquée** (ce n'est pas une partie jouée) : `bonus-aiguilles` résolue, les dix réponses de l'étape trouvées, 0 indice,
  0 erreur, `stars: 3`, `bestStars: 3`, puis ouverture de `/?debug&case=bonus-aiguilles` (une enquête résolue s'ouvre sur l'écran de fin). Le hors-série a été préféré au
  tutoriel : son épilogue (la Meule d'Or) ne dévoile aucune solution, et la carte sous la feuille ne montre aucune trouvaille. Avec c00, l'épilogue racontait la solution
  du tutoriel et la carte montrait les trois réponses entourées de vert.

Relecture de chaque image (lues une à une) : pas de HUD de débogage, pas de tuile manquante ni de trou, pas de toast, pas de chargement, texte entier dans les panneaux,
aucune réponse marquée. Les captures anciennes de `docs/screenshots/` ne sont pas touchées.

## Vérifications

| Contrôle | Résultat |
|---|---|
| Liens relatifs et chemins entre accents graves dans `README.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/PLAN-WEB.md`, `docs/JOURNAL.md` | tous existent (seuls restent les chemins d'URL des pages de développement, `docs/scenario/` et `data/continue.json` déjà cités par le journal historique, et ce compte rendu) |
| Commandes citées (`npm run dev|build|preview|typecheck|test|test:watch|e2e|content:check|content:doc|world|shot`, `scripts/perf-map.mjs` et ses options, `tools/playtest/blind.mjs`, `selftest.mjs`) | toutes présentes dans `package.json` / `scripts/` / `tools/` |
| `git diff --stat` des 4 fichiers de contrat | vide |
| `npx tsc --noEmit`, `npx vitest run`, `npm run content:check` | inchangés : 0 erreur, 17 fichiers / 367 tests, « OK : aucun problème » (mêmes 9 notes) — voir fin de passe |
| `npx playwright test --list` | 41 tests en 9 fichiers |

### Mesures de fluidité refaites aujourd'hui (non reprises dans § 9)
`node scripts/perf-map.mjs` (rien d'autre en cours à ce moment-là) : ×1 p50 16,7 / p95 16,8 ms, 0 image > 33 ms, tuile 7,9 ms ; ×4 p50 33,3 / p95 66,7 ms, tuile 39,9 ms :
identique aux valeurs du § 9. `--startup` : ×1 `buildWorld` 237 ms + premier rendu 186 ms ; ×4 980 ms + 939 ms = **1,92 s**, soit un peu au-dessus de 1,75–1,85 s. Pendant
cette dernière mesure, un autre agent faisait tourner une suite Playwright et un serveur de recette sur la même machine (processus visibles par `ps`) : la valeur est donc
perturbée et n'a pas été retenue ; la dispersion d'une page à l'autre (±100 ms) suffit d'ailleurs à l'expliquer.

## Décisions et points douteux

- **Mise en ligne** : le README dit que le workflow se déclenche sur `main`. Le jeu est sur `feat/jeu-web` (d'après le journal) : tant que la fusion n'est pas faite, rien n'est publié.
  La phrase reste vraie après la fusion ; à l'orchestrateur de décider s'il veut en ajouter une sur l'état réel.
- **URL** : `https://maximeclavel.github.io/Haystack/` (nom d'hôte GitHub Pages en minuscules ; dépôt `MaximeClavel/Haystack` d'après `git remote`). Non testée : Pages n'est pas encore activé.
- **Nombres cités** (367 tests, 41 e2e, 84 contrôles du selftest, 8 275 entités) figurent dans le README, l'architecture (§ 10), le plan et le journal : à mettre à jour si la
  recette en change.
- **Accroche de c03** (« …sauf si quelqu'un l'attend ») recopiée telle quelle : c'est le texte affiché dans la liste des dossiers, mais elle laisse deviner un complice.
- **Épilogue du hors-série** visible sur `readme-fin.png` : sans conséquence pour le jeu (aucune solution), mais c'est la seule capture où un texte d'épilogue apparaît.
- **Limites du README** recopiées des comptes rendus de la phase 3 (bilan des rejeux, correcteurs, direction artistique, critique) ; je n'en ai pas re-vérifié le détail dans le jeu.
- Les 4 images pèsent ≈ 2,4 Mo en tout (PNG non optimisés) ; aucun outil d'optimisation n'est installé et je n'ai pas voulu dégrader les captures.
- Le journal décrit les incidents de limite d'usage d'après les comptes rendus qui les mentionnent (outil de joueur test, correcteur c02, 105 vérifications en attente) ;
  l'orchestrateur connaît mieux leur détail et peut compléter. La routine de reprise horaire (`trig_01Uj26Mjc3rcJLgFNx9F7eGD`) est encore active (lecture seule, non modifiée).

## Comment vérifier

```bash
git status --short                       # README.md, CLAUDE.md, docs/*.md et quatre PNG ; rien dans src/, tools/, tests/, scripts/
git diff --stat -- src tools tests scripts   # vide
npx tsc --noEmit && npx vitest run && npm run content:check
npx playwright test --list | tail -1     # Total: 41 tests in 9 files
npm run shot -- "/?screen=accueil" .shots/verif-accueil.png   # doit redonner readme-accueil.png
```
