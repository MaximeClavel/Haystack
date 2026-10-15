# Haystack — consignes pour les agents

Jeu web **mobile d'abord** d'enquête « cherche-et-trouve » : le joueur explore la grande carte
illustrée de la ville de **Meulebourg** et résout des affaires en désignant personnes, objets et lieux.
Projet récréatif (entre amis). Plan : `docs/PLAN-WEB.md`. Architecture : `docs/ARCHITECTURE.md`.

## Pile technique

Vite 7 · TypeScript 5.9 strict · Preact 10 (interface) · Canvas 2D (carte) · Vitest 3 · Playwright 1.56
(Chromium préinstallé, ne jamais lancer `playwright install`). Aucun backend : sauvegarde en localStorage.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run typecheck` | Vérification des types (doit passer) |
| `npm test` | Tests unitaires Vitest (`src/**/*.test.ts`, `tests/unit/`) |
| `npm run e2e` | Tests de bout en bout Playwright (téléphone émulé, ~3 min) ; `E2E_PORT=<port>` pour en lancer plusieurs en même temps |
| `npm run shot -- "<chemin-url>" <sortie.png>` | Capture d'écran d'une page (voir `scripts/shot.mjs`) |
| `npm run world -- <cmd>` | Interroger le monde généré : `landmarks`, `districts`, `streets [filtre]`, `zones`, `entity <id>`, `rect x y w h`, `near x y [r]`, `ground x y`, `free x y w h [pas]`, `lookalikes <id> [d]`, `stats` (option `--no-cases`) |
| `npm run content:check` | Contrôle des enquêtes dans la vraie ville (validateur + règles de la bible) : doit finir par « OK : aucun problème » |
| `npm run content:doc` | Régénère `docs/CONTENT.md` à partir du code des enquêtes (`src/content/cases`) |
| `node scripts/perf-map.mjs` | Fluidité de la carte à CPU ×1 et ×4 ; `--gestures` : contrôles des gestes ; `--startup` : durée du démarrage (`buildWorld` + premier rendu) |
| `npm run build` | Build de production dans `dist/` |
| `node tools/playtest/blind.mjs start <id>` | Joueur test aveugle : joue une enquête au doigt (captures + commandes `tap`, `press`, `text`…), sans accès aux solutions. Mode d'emploi du joueur : `tools/playtest/README.md` ; `node tools/playtest/selftest.mjs` vérifie l'outil (~1 min) ; `blind.mjs stop --all` arrête toutes les parties |

## Règles communes

- **Langues** : identifiants en anglais ; commentaires, documentation et textes du jeu en **français**.
- **Contrats** : `src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts`.
  Ne les modifier qu'en cas de nécessité réelle, de façon rétro-compatible, et consigner chaque
  changement dans `docs/ARCHITECTURE.md` § « Journal des changements de contrat ».
- **Périmètre** : chaque agent ne modifie que les fichiers listés dans sa mission.
- **Dépendances** : n'ajouter aucune dépendance npm.
- **Git** : ne pas committer ; l'orchestrateur committe entre les phases.
- **Déterminisme** : pas de `Math.random()` ni de `Date.now()` dans `src/world`, `src/content`, `src/art` ;
  utiliser le générateur pseudo-aléatoire à graine (`src/lib/rng.ts` : `Rng`, `hashString`).
- **Modules purs** (testables sous Node, sans DOM) : `src/world`, `src/game`, `src/content`, `src/art/bounds.ts`.
- **Rendu** : tout dessin d'une entité doit tenir dans `getEntityBounds(e)` (rendu par tuiles).
  Pas de `ctx.filter`, `shadowBlur` ni dégradés coûteux (performance mobile).
- **Compte rendu** : chaque agent écrit `docs/journal/<phase>-<agent>.md` : ce qui a été fait,
  décisions, limites connues, comment vérifier.
- **Captures** : brouillons dans `.shots/` (ignoré par git) ; captures à conserver dans `docs/screenshots/`.

## Paramètres d'URL du jeu

`?debug` (expose `window.__haystack`, affiche les coordonnées) · `?ui=0` (carte seule) ·
`?x=…&y=…&zoom=…` (caméra initiale) · `?case=c01` (ouvre une enquête). Les pages signalent
`window.__haystackReady = true` quand le rendu est terminé (utilisé par `scripts/shot.mjs`).
