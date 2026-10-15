# Haystack

Jeu d'enquête **web, pensé pour le téléphone** : explorez la ville foisonnante de Meulebourg,
suivez les personnages d'une scène à l'autre et résolvez des affaires en observant.

> Projet récréatif, en cours de construction. Plan : [`docs/PLAN-WEB.md`](docs/PLAN-WEB.md) ·
> Journal : [`docs/JOURNAL.md`](docs/JOURNAL.md) · Architecture : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Lancer en local

```bash
npm install
npm run dev      # puis ouvrir l'URL affichée (accessible depuis un téléphone du même réseau)
npm test         # tests unitaires
npm run build    # version de production dans dist/
```

## Commandes utiles

| Commande | Rôle |
|---|---|
| `npm run typecheck` | Vérification des types |
| `npm test` | Tests unitaires (monde, moteur, règles, contenu publié) |
| `npm run e2e` | Tests de bout en bout Playwright (téléphone émulé) |
| `npm run content:check` | Contrôle des enquêtes dans la vraie ville (doit afficher « OK : aucun problème ») |
| `npm run content:doc` | Régénère la bible `docs/CONTENT.md` à partir du code des enquêtes |
| `npm run world -- <cmd>` | Interroger la ville générée : `landmarks`, `districts`, `streets`, `zones`, `entity <id>`, `rect`, `near`, `ground`, `free`, `lookalikes`, `stats` |
| `npm run shot -- "<chemin-url>" sortie.png` | Capture d'écran d'une page (ex. `"/dev/map.html?x=2850&y=2060&zoom=2"`) |
| `node scripts/perf-map.mjs` | Mesure de fluidité de la carte (`--gestures` : contrôles des gestes ; `--startup` : durée du démarrage) |
| `node tools/playtest/blind.mjs start <id>` | Joueur test « aveugle » : jouer une enquête au doigt (captures d'écran + commandes), sans voir les solutions (mode d'emploi : [`tools/playtest/README.md`](tools/playtest/README.md)) |

Pages de développement (servies par `npm run dev`, non publiées) : `/dev/map.html` (carte brute),
`/dev/gallery.html` (catalogue graphique), `/dev/overview.html` (plan de la ville),
`/tools/content/preview.html` (scènes des enquêtes).

## Organisation

| Dossier | Contenu |
|---|---|
| `src/world` | Génération déterministe de Meulebourg et insertion des scènes d'enquête |
| `src/art` | Illustration en Canvas 2D (sol, bâtiments, personnages, véhicules, objets) |
| `src/engine` | Moteur de carte : caméra, gestes, tuiles, overlays |
| `src/game` | Règles : désignation, étapes, indices, étoiles, sauvegarde, validation du contenu |
| `src/content` | Les enquêtes (une par fichier dans `cases/`) |
| `src/ui` | Interface Preact |
| `tools/content`, `scripts` | Outils de contrôle, de capture et de mesure |

Détails : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) et le README de chaque module.
