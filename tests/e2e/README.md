# Tests de bout en bout (Playwright, téléphone émulé)

Le jeu complet, joué **au doigt** sur un Pixel 7 émulé (Chromium préinstallé, `playwright.config.ts`).
Un seul serveur Vite (port 5179, réutilisé s'il tourne déjà), tests exécutés l'un après l'autre.

```bash
npm run e2e                                    # toute la suite (≈ 2 min)
npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts   # un seul fichier
npx playwright show-trace test-results/<test>/trace.zip         # trace d'un échec (gardée)
```

## Principe

- Les **positions** viennent du mode debug (`/?debug` → `window.__haystack` : `entityCenter`,
  `host.cameraFor`, `map.flyTo`, `map.worldToScreen`), mais **tous les gestes sont réels** :
  `page.touchscreen.tap` sur la carte, `locator.tap()` sur l'interface, glisser par événements
  tactiles CDP. Aucune réponse n'est soumise par l'API.
- Avant chaque tap sur la carte : vol vers la cible au **zoom 2** (`PLAY_ZOOM`), centrée dans la
  zone libre (entre la barre haute et le panneau de question), attente de `map.whenIdle()`, puis
  contrôle que le point écran est bien sur le canevas (`document.elementFromPoint`) et pas sous
  l'interface.
- Ce que le tap a **réellement** désigné est lu dans le HUD de débogage (`appui (x, y) <id>`),
  écrit au lâcher du doigt avec le même `pickAt` que l'interface ; le résultat est ensuite vérifié
  dans l'interface (feuille de confirmation, carte « Bien vu ! », toast, fausse piste) et dans la
  sauvegarde (`localStorage['haystack:v1']`).
- **Console** : la fixture automatique de `helpers.ts` fait échouer tout test qui produit une
  erreur console, une exception de page, une réponse HTTP ≥ 400 ou une requête échouée
  (les avertissements sont recopiés dans les annotations du rapport).

## Fichiers

| Fichier | Contenu |
|---|---|
| `helpers.ts` | Fixture console, `openGame`, `tapUi`, `tapWorld` (vol + tap réel + lecture du HUD), `tapAndSelect`, `selectStep` (onglets), `findEmptySpot`, `mapLuminance` (lecture de pixels de la carte), `readSave` |
| `play.ts` | Jouer une enquête : `openCaseFromFolders`, `tapTarget` (point de visée, diagnostic de masquage), `solveStep`, `solveOpenCase` |
| `01-demarrage.spec.ts` | Accueil sans erreur, une seule carte plein écran, pas de défilement ; Dossiers (verrous) → tutoriel (briefing → jeu) ; `window.__haystack` |
| `02-tutoriel.spec.ts` | c00 résolu au doigt ; fin avec 3 étoiles ; fils rouges ; reconstitution ; dossiers ; **rechargement** : c00 résolu, c01 et bonus débloqués |
| `03-erreurs-indices.spec.ts` | c01 : mauvaise réponse (toast, erreur comptée), fausse piste (carte dédiée, pas d'erreur), indices 1 → 3 : texte, **projecteur** (assombrissement mesuré en pixels, masquable), révélation (anneau, « Revoir » gratuit), étoiles |
| `04-toutes-les-enquetes.spec.ts` | **Toutes les enquêtes** (c00 → c05 puis le bonus) résolues au doigt en les débloquant dans l'ordre ; chaque réponse acceptée, y compris les alternatives, est tapée et vérifiée |
| `05-explorer-reglages.spec.ts` | Exploration (glisser, nom du lieu, tap sur un lieu remarquable), minicarte (exploration et enquête), Comment jouer, réglages (mouvement réduit, gaucher, réinitialisation) |
| `06-parcours-console.spec.ts` | Tous les écrans dans une même page : approche de loin, panneau repliable, carnet (notes, punaise posée puis retirée) — sans erreur console |
| `tools/planche.mjs` | Planche contact des captures de cibles (voir ci-dessous) |

## « Chaque réponse est désignable » (test 04)

Pour chaque réponse : point de visée = centre du rectangle de désignation (`entityCenter`) ;
centroïde pour une zone ; centre pour un bâtiment (accepté par sa façade et son toit). Si une autre
entité est désignée au centre (arbre, véhicule, passant devant), le test vise le point « sûr » de la
cible le plus proche du centre et l'annonce (`[attention] réponse partiellement masquée`, annotation
du rapport). Si **aucune** partie n'est désignable, le test échoue avec un message précis (enquête,
étape, entité, ce qui la masque) et une capture jointe. Une réponse n'est jamais contournée.

Relecture visuelle : `E2E_SHOTS=1` capture chaque cible (140 × 140 px autour du tap, cadre de
sélection visible) dans `.shots/e2e/`, puis :

```bash
E2E_SHOTS=1 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts
node tests/e2e/tools/planche.mjs .shots/e2e .shots/e2e-planche.jpg
```

## Écrire un test

- Importer `test` et `expect` depuis `./helpers` (jamais directement de `@playwright/test`) pour
  garder la surveillance de la console.
- Démarrer par `openGame(page, '&case=c01')` (le mode debug est ajouté) ou par `page.goto('/')`
  suivi de l'attente de `window.__haystackReady`.
- Taper la carte avec `tapWorld` / `tapAndSelect` (jamais pendant une animation : un appui qui
  interrompt un vol n'est pas un tap) ; les boutons avec `tapUi`.
- Une animation d'apparition (minicarte, feuilles) déplace les éléments : taper via le locator
  (`locator.tap({ position })`, qui attend la stabilité) plutôt qu'à des coordonnées mesurées avant.
