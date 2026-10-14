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
