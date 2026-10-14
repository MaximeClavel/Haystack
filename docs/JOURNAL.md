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
