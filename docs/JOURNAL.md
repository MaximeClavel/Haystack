# Journal de bord — Haystack

Chronologie des étapes, décisions et résultats. Les comptes rendus détaillés de chaque agent sont
dans `docs/journal/`. Le plan est dans `docs/PLAN-WEB.md`.

## 2026-10-14 — Plan initial (application native)
- Plan d'application mobile native rédigé : `docs/PLAN.md` (Flutter, carte tuilée, freemium).
- Constat : une adaptation officielle de MicroMacro existe sur mobile depuis août 2025 → différenciation nécessaire.

## 2026-10-14 — Pivot : version web récréative
- Demande : site web orienté mobile, pour jouer entre amis ; tout est réalisé par Claude (orchestrateur + sous-agents).
- Décisions (détail dans `docs/PLAN-WEB.md` § 2) : ville **générée par code** et dessinée en Canvas 2D,
  moteur de carte maison à tuiles, Preact + TypeScript + Vite, sauvegarde locale, GitHub Pages.
- Environnement : Node 22, 4 cœurs (2 sous-agents en parallèle au plus), Chromium préinstallé pour Playwright.

### Phase 0 — Socle (orchestrateur)
- Branche `feat/jeu-web`. Dépendances figées : vite 7.3.7, typescript 5.9.3, preact 10.29.8, vitest 3.2.7,
  @playwright/test 1.56.1 (aligné sur le Chromium installé), tsx, polices Special Elite et Inter.
- Contrats écrits : `src/types.ts` (vocabulaire visuel, entités, monde, enquêtes, partie, carte),
  `src/config.ts`, `src/art/bounds.ts` (emprises et ordre de dessin), `src/world/layoutSpec.ts`
  (plan directeur : 9 quartiers, 9 avenues, rivière, voie ferrée, 37 lieux remarquables).
- Implémentations **provisoires** de `src/art` et `src/world` pour que les modules puissent avancer en parallèle.
- Outils : `scripts/shot.mjs` (captures d'écran automatisées, testé), `scripts/world-query.ts`.
- Documentation : `CLAUDE.md` (consignes communes aux agents), `docs/ARCHITECTURE.md`, `docs/PLAN-WEB.md`, ce journal.

### Phase 1 — Fondations (workflow `haystack-fondations`, lancé)
Neuf sous-agents, deux à la fois au plus (limite de la machine : 4 cœurs) :

| Ordre | Agent | Mission | Périmètre |
|---|---|---|---|
| 1 | `world` | Générateur déterministe de Meulebourg : sol, rues, îlots, bâtiments, foule, véhicules, arbres, mobilier, index spatial, zones, règle anti-sosies | `src/world/**`, `dev/overview.html` |
| 1 | `art` | Illustration en Canvas 2D de tout le vocabulaire visuel, 3 niveaux de détail, galerie de contrôle | `src/art/**`, `dev/gallery.html` |
| 2 | `engine` | Moteur de carte : caméra, gestes, tuiles progressives, cache, overlays, animations, mesure de performance | `src/engine/**`, `dev/map.html`, `scripts/perf-map.mjs` |
| 2 | `game` | Règles : désignation, étapes, indices, étoiles, sauvegarde, validation du contenu | `src/game/**` |
| 3 | `scenario-a` | Bible et enquêtes, angle « rigueur déductive » | `docs/scenario/scenario-a.md` |
| 3 | `scenario-b` | Bible et enquêtes, angle « variété et humour » | `docs/scenario/scenario-b.md` |
| 4 | `editeur` | Fusion des deux propositions en une bible définitive avec guides d'implémentation | `docs/CONTENT.md` |
| 5 | `integration` | Typecheck, tests, cohérence entre modules, performance réelle, contrôle des placements | correctifs ciblés |
| 6 | `direction-artistique` | Itérations « capture → critique → correction » sur la ville complète | `src/art/**`, réglages `src/world/**` |

Chaque agent vérifie son travail (tests Vitest, captures d'écran lues et critiquées) et rend un compte rendu
dans `docs/journal/phase1-<agent>.md`.

### Phase 1 — incident et reprise
- Le workflow s'est arrêté après ~1 h : **limite d'usage du compte atteinte**. Seul l'agent `world` avait
  terminé (35 tests verts, 786 bâtiments, 3 231 passants — voir `docs/journal/phase1-world.md`) ;
  l'agent `art` était à mi-chemin, les 7 autres n'avaient pas démarré.
- Commit de sauvegarde `3fb389a` (monde terminé + art inachevé).
- Reprise après réinitialisation de la limite : le résultat de `world` est réutilisé depuis le cache du
  workflow ; la consigne de l'agent `art` a été complétée pour qu'il **reprenne** ses fichiers au lieu de
  repartir de zéro, et pour qu'il dessine les variantes utilisées par le monde (tombes, statues, potagers,
  vélos garés…) ; l'agent `game` doit utiliser les utilitaires du monde (`isHiddenByRoof`, `isWalkable`).

### Phase 1 — deuxième interruption, réorganisation
- Deuxième passage (≈ 1 h) : l'agent `engine` a terminé (moteur de carte complet, tests verts,
  `docs/journal/phase1-engine.md`) ; `art` a beaucoup avancé ; `game` a commencé. Nouvelle limite d'usage.
- Commit de sauvegarde `2f46d2c` (typecheck OK, 103 tests verts).
- Constat : un passage consomme ≈ 1,2 M de jetons de sous-agents avant la limite. Pour avancer plus sûrement :
  - nouveau workflow **`haystack-fondations-suite`** limité au travail restant (pas de ré-exécution de
    `world` ni d'`engine`) ;
  - `game` et `art` reprennent leurs fichiers, avec consigne de faire d'abord l'inventaire de ce qui manque ;
  - les deux scénaristes + l'éditeur sont remplacés par **un scénariste** (qui écrit directement
    `docs/CONTENT.md` en s'appuyant sur la vraie ville : `npm run world -- ground/free/near`, captures)
    suivi d'**un critique adverse** qui tente de casser chaque étape (ambiguïté, visibilité, placement,
    vocabulaire, logique, plaisir) et corrige le document ;
  - puis `integration` et `direction-artistique` comme prévu.

### Phase 1 — fin (troisième passage)
- `game` terminé (169 tests, `docs/journal/phase1-game.md`), `art` terminé (0 débordement sur 17 394 rendus,
  `docs/journal/phase1-art.md`).
- L'agent `scenario` a écrit les 7 enquêtes directement en `CaseDef` TypeScript, placées sur la vraie ville et
  validées ; interrompu juste avant son compte rendu (rédigé par l'orchestrateur : `docs/journal/phase1-scenario.md`).
- Réorganisation par l'orchestrateur : enquêtes déplacées dans `src/content/cases/` (source unique du jeu),
  outils du scénariste dans `tools/content/` (`npm run content:check`, `npm run content:doc` qui régénère
  `docs/CONTENT.md`). Commit `22d5c99` : 277 tests verts.
- `critique`, `integration` et `direction-artistique` n'ont pas tourné (limite d'usage) : `integration` passe en
  phase 2, `critique` et `direction-artistique` en phase 3.

## 2026-10-14 — Suivi et reprise automatique
- **Tableau de bord** (artefact claude.ai privé) : https://claude.ai/artifact/XE28VYtZKrb6ThAuN5dfkm — phases,
  agents et journal lus en direct depuis la base de l'artefact (mise à jour par l'orchestrateur et, au mieux,
  par les agents eux-mêmes). Bouton **Continuer** : publie `data/continue.json`, ce qui réveille la session
  Claude Code qui suit le tableau.
- **Reprise automatique** : routine horaire `trig_01Uj26Mjc3rcJLgFNx9F7eGD` (« Haystack — reprise automatique »)
  qui relance le travail interrompu par une limite d'usage dès qu'elle est levée. À désactiver en fin de projet.

### Phase 2 — Interface jouable (workflow `haystack-interface`, lancé)
| Ordre | Agent | Mission |
|---|---|---|
| 1 | `ui` | Toute l'interface Preact : accueil, dossiers, enquête (désignation avec vignette, indices, fils rouges), carnet, fin et reconstitution, explorer, minicarte, réglages, PWA |
| 1 | `integration` | Performance réelle, contrôle visuel, documentation d'architecture à jour |
| 2 | `e2e` | Tests Playwright, dont la résolution de TOUTES les enquêtes par de vrais taps |
| 3 | `revue-ux`, `revue-code` | Revues indépendantes (constats avec preuves, sans modifier le code) |
| 4 | `correcteur` | Vérifie chaque constat, corrige les réels, écarte les autres en expliquant |

## 2026-10-15 — Reprise après la 4e limite d'usage
- Phase 2 : `ui`, `integration` et `e2e` terminés (278 tests unitaires, 10 tests de bout en bout, 49/49 réponses
  désignables au doigt, démarrage ≈ 1,5 s à CPU ×4). `revue-ux`, `revue-code` et `correcteur` relancés après la
  levée de la limite (3 h UTC) via la reprise du workflow `haystack-interface`.
- Mise en ligne préparée : `.github/workflows/pages.yml` (build + tests + déploiement GitHub Pages sur `main`).
  Réglage unique à faire dans le dépôt : Settings > Pages > Source = « GitHub Actions ».

## À faire à la toute fin (demande de l'utilisateur)
- Fournir un **récapitulatif des branches et de l'ordre de fusion**. État connu :
  - `main` : « Initial commit » (README seul).
  - `docs/plan-implementation` : 1 commit (plan d'application native, `docs/PLAN.md`) ;
    **déjà contenue** dans `feat/jeu-web` (celle-ci a été créée à partir d'elle).
  - `feat/jeu-web` : tout le jeu (13 commits à ce jour).
  - Ordre recommandé : fusionner `feat/jeu-web` dans `main` (ce qui inclut le plan) ; la branche
    `docs/plan-implementation` devient alors inutile et peut être supprimée. Pas de conflit attendu.

### Phase 2 — terminée (15/10/2026)
- Les 6 agents ont terminé après reprise. **Revues** : 33 constats (14 de code, 19 d'expérience), dont 10 majeurs
  (« Recommencer » qui re-verrouillait des enquêtes, bonne réponse à une autre question comptée comme erreur,
  bouton Retour du système qui quittait le jeu, nom du lieu absent en enquête, reprise qui revenait au départ,
  indice 2 passant sous le zoom de désignation sur petit écran, testament du bonus, bonnet noir/orange…).
  **Correcteur** : tous reproduits puis traités (voir `docs/journal/phase2-correcteur.md`) ; 2 écartés, 6 reportés
  (piège à focus, bouton « Où ? », latence de sélection de 226 ms = fenêtre de double tap…).
- Vérifié par l'orchestrateur : `tsc` OK, 299 tests unitaires, `content:check` OK, build OK, **23/23 tests de bout en bout**.
- Changements de contrat (rétro-compatibles) : `CaseProgress.bestStars?`, `StepDef.label?`.
- `E2E_PORT` : plusieurs suites e2e peuvent tourner en même temps (un port par agent).

### Phase 3 — Enquêtes et finition (workflow `haystack-enquetes`, lancé)
| Agent | Mission |
|---|---|
| `critique` | Revue adverse des 7 enquêtes (ambiguïté, visibilité réelle, logique, difficulté, textes, plaisir) puis corrections directes |
| `outil-playtest` | `tools/playtest/blind.mjs` : permet à un joueur test de jouer en pixels écran, SANS accès aux solutions |
| `direction-artistique` | Finition graphique (src/art uniquement) : lisibilité à toutes les échelles, charme, perf inchangée |
| `joueur:<enquête>` ×7 | Un joueur test par enquête, qui ne connaît pas les réponses : résout-il l'enquête à partir de ce qu'il voit ? |
| `correcteur-2` | Traite les constats des joueurs test et de la critique |

## 2026-10-19 — Reprise après une longue interruption
- 105 vérifications horaires étaient en attente (la session était interrompue depuis le 15/10) : aucun workflow
  ne tournait, rien n'était perdu. Vérifié : `tsc` OK, 304 tests, `content:check` « OK : aucun problème ».
- Commit `0d7fa04` : travail de `direction-artistique` (non commité jusque-là), journal
  `docs/journal/phase3-direction-artistique.md`.
- Joueurs test aveugles lancés en trois vagues (3 parties en parallèle au plus : ≈ 800 Mo et un cœur chacune) :
  c01–c03, puis c04–c05 et le bonus, puis c00. Chaque joueur écrit `docs/journal/phase3-joueur-<enquête>.md`.
  Ensuite : `correcteur-2` sur leurs constats, puis phase 4.
