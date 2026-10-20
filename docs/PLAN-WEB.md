# Haystack — Plan de la version web (récréative)

> Version jouable entre amis, sur le navigateur du téléphone. Elle remplace pour l'instant le plan
> d'application native (`docs/PLAN.md`), qui reste la vision long terme.

Statut : en cours — démarré le 14/10/2026. Suivi détaillé : `docs/JOURNAL.md`.

## 1. Objectif

Un site web **mobile d'abord**, sans installation ni compte, où l'on explore la ville illustrée de
**Meulebourg** pour résoudre des enquêtes à la manière de *MicroMacro* :

- une grande carte zoomable au doigt (pincer, glisser, double-tap) ;
- des enquêtes composées de questions ; on répond en **désignant** une personne, un objet ou un lieu ;
- indices progressifs (texte → zone éclairée → révélation), fil rouge entre les scènes trouvées,
  reconstitution animée en fin d'enquête, étoiles ;
- progression sauvegardée dans le navigateur ;
- partage par simple lien (hébergement statique gratuit : GitHub Pages).

**Contenu visé** : un tutoriel, 5 enquêtes (difficulté 1 à 5) et un bonus « les aiguilles cachées ».

## 2. Décisions structurantes

| Sujet | Décision | Pourquoi |
|---|---|---|
| Plateforme | Site web statique (PWA légère), mobile d'abord | Demandé : récréatif, partage par lien |
| Illustration | **Ville générée par code** (dessin vectoriel Canvas 2D) + scènes d'enquête placées à la main | Aucun illustrateur : le code dessine bâtiments, personnages, objets ; la génération à graine rend la ville stable et foisonnante |
| Style | Trait d'encre + aplats d'une palette limitée sur fond papier, vue oblique | Lisible, distinct de MicroMacro (noir et blanc), peu coûteux à dessiner |
| Affichage | Moteur de carte maison : tuiles rendues à la volée, cache, niveaux de détail | Fluide sur téléphone, net à tous les zooms, téléchargement minuscule |
| Réponses | On désigne une **entité** (ou une zone) ; la bonne réponse est un ensemble d'ids | Pas de polygones dessinés à la main : la géométrie vient du dessin lui-même |
| Interface | Preact + TypeScript, Vite | Léger, rapide, typé |
| Données | Enquêtes en TypeScript typé, validées par des tests | Erreurs de contenu détectées avant publication |
| Sauvegarde | localStorage, sans compte | Simplicité, vie privée |
| Hébergement | GitHub Pages via GitHub Actions | Gratuit, dépôt public |

## 3. Phases et répartition entre agents

L'orchestrateur (la session principale) découpe, lance les sous-agents via des *workflows*, relit,
intègre, committe et documente. Chaque agent a un **périmètre de fichiers exclusif**, vérifie son
travail (tests, captures d'écran) et rend un compte rendu dans `docs/journal/`.

### Phase 0 — Socle (orchestrateur)
Projet Vite/TS/Preact, contrats (`src/types.ts`, `src/config.ts`, `src/art/bounds.ts`,
`src/world/layoutSpec.ts`), implémentations provisoires, outil de capture `scripts/shot.mjs`,
`scripts/world-query.ts`, consignes `CLAUDE.md`, documentation.

### Phase 1 — Fondations (workflow « fondations »)

| Agent | Mission | Périmètre | Vérification |
|---|---|---|---|
| `world` | Générer Meulebourg : routes, trottoirs, rivière, ponts, rails, parcs, îlots d'immeubles, lieux remarquables, foule, véhicules, arbres, mobilier ; index spatial ; zones ; règle anti-sosies | `src/world/**`, `scripts/world-query.ts`, `dev/overview.html`, `src/dev/overview.ts` | Tests (déterminisme, pas de chevauchements, comptes), vue d'ensemble en capture |
| `art` | Dessiner tout le vocabulaire visuel : personnes (apparences, poses, émotions, objets tenus), bâtiments (styles, enseignes, détails), véhicules, arbres, objets, sol ; 3 niveaux de détail | `src/art/**`, `dev/gallery.html`, `src/dev/gallery.ts` | Catalogue capturé aux zooms 4, 1 et 0,25 ; auto-critique visuelle |
| `engine` | Moteur de carte : caméra, gestes tactiles et souris, inertie, tuiles progressives, cache LRU, overlays, `flyTo`, vignettes | `src/engine/**`, `dev/map.html`, `src/dev/map.ts` | Tests des calculs, mesure des images/s pendant un parcours scripté, captures |
| `game` | Règles : désignation, étapes, indices, étoiles, fils rouges, sauvegarde, validation du contenu | `src/game/**` | Tests unitaires exhaustifs |
| `scenario-a`, `scenario-b` | Deux propositions indépendantes de bible et d'enquêtes (angles différents) | `docs/scenario/` | — |
| `editeur` | Fusion des deux propositions en une bible cohérente : personnages, chronologies, scènes localisées, questions, indices, fausses pistes | `docs/CONTENT.md` | Relecture de cohérence (lieux existants, vocabulaire dessinable) |
| `integration` | Typecheck et tests globaux, correction des écarts d'interface entre modules | correctifs ciblés | `npm run typecheck`, `npm test` |

### Phase 2 — Interface et pilote (workflow « interface »)

| Agent | Mission |
|---|---|
| `pilote` | Implémente le tutoriel (c00) depuis la bible : valide la chaîne « scénario → monde → jeu » |
| `ui` | Écrans (accueil, dossiers, enquête, carnet, fin, comment jouer, réglages), feuille de confirmation avec vignette, minicarte, retours haptiques, manifeste PWA |
| `e2e` | Tests Playwright sur téléphone émulé : parcours complet du tutoriel |
| `revue-ux`, `revue-code`, `revue-perf` | Revues indépendantes (captures mobiles, correction, fluidité) |
| `correcteur` | Applique les constats confirmés |

### Phase 3 — Enquêtes (workflows « enquêtes »)
Pour chaque enquête (c01 à c05, bonus) : un agent **implémente** (placement des scènes, questions,
indices), un agent **vérifie** (lisibilité des indices visuels en capture, absence d'ambiguïté,
sosies, `validateCase`), puis correction.

### Phase 4 — Recette et mise en ligne (workflow « recette »)
Test de bout en bout qui résout toutes les enquêtes, contrôle de performance sur mobile ralenti,
revue finale, déploiement GitHub Pages, README et journal finalisés.

## 4. Risques

| Risque | Parade |
|---|---|
| Rendu vectoriel trop lent sur téléphone | Tuiles mises en cache, niveaux de détail, budget de rendu par image, mesure dès la phase 1 |
| Illustration générée trop pauvre ou répétitive | Vocabulaire visuel riche, variations à graine, revue visuelle systématique, densité par quartier |
| Indices visuels illisibles ou ambigus | Règle anti-sosies, vérification par capture au zoom de jeu, fausses pistes volontaires |
| Incohérences entre modules développés en parallèle | Contrats écrits d'avance, agent d'intégration, tests |
| Enquêtes qui se chevauchent sur la carte | Lieux attribués par la bible, validation automatique des chevauchements |

## 5. État au 20/10/2026

Le plan ci-dessus n'est pas réécrit : voici où chaque phase en est, et ce qui a changé par rapport à ce qui était prévu.
Détail dans `docs/JOURNAL.md` et `docs/journal/`.

| Phase | État | En bref |
|---|---|---|
| 0 — Socle | **Terminée** (14/10) | Vite, TypeScript strict, Preact ; contrats (`src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts`), `scripts/shot.mjs`, `scripts/world-query.ts`, `CLAUDE.md`. |
| 1 — Fondations | **Terminée** (14/10) | Monde, art, moteur de carte et règles livrés. Écarts : deux limites d'usage ont étalé la phase sur trois passages ; les deux scénaristes et l'éditeur ont été remplacés par un seul scénariste qui a écrit directement les sept enquêtes en `CaseDef` (`src/content/cases/`, bible générée `docs/CONTENT.md`) ; `critique` et `direction-artistique` sont passés en phase 3. |
| 2 — Interface et pilote | **Terminée** (15/10) | Interface complète (accueil, dossiers, enquête, carnet, fin et reconstitution, explorer, minicarte, réglages, manifeste PWA sans service worker), tutoriel jouable, tests de bout en bout, revues UX et code (33 constats vérifiés un par un : 2 écartés, 6 reportés, le reste corrigé ; voir `docs/journal/phase2-correcteur.md`). |
| 3 — Enquêtes | **Terminée** (20/10) | Les sept enquêtes existaient déjà (phase 1) : la phase a surtout été une **confrontation au jeu réel**. Revue adverse (`critique`), finition graphique, outil de joueur test aveugle (`tools/playtest`), sept joueurs test puis sept rejeux après correction, tri et vérification des constats, douze correcteurs, deux relectures indépendantes, deux lots de finition. Résultat : −50 % de commandes pour résoudre les enquêtes (≈ 1 525 → 768), voir `docs/journal/phase3-bilan-rejeu.md`. 367 tests unitaires, 41 tests de bout en bout, `content:check` « OK : aucun problème ». |
| 4 — Recette et mise en ligne | **En cours** | Fait : test qui résout toutes les enquêtes au doigt (`tests/e2e/04-…`), mesures de fluidité à CPU ×1 et ×4, README et architecture finalisés (`docs/journal/phase4-documentation.md`), workflow GitHub Pages écrit (`.github/workflows/pages.yml`). Reste : recette finale par l'orchestrateur, fusion de la branche de travail dans `main` (le workflow ne se déclenche que sur `main`) et réglage unique Settings > Pages > Source = « GitHub Actions ». À compléter à la clôture. |

Écarts de périmètre à retenir : la revue de performance prévue en phase 2 a été faite par l'agent d'intégration ; le « test de
bout en bout qui résout toutes les enquêtes » de la phase 4 existe depuis la phase 2 et tourne à chaque passe ; l'outil de
joueur test aveugle (non prévu au plan) est devenu la source principale de corrections de la phase 3.
