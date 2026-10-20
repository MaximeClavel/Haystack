# Phase 4 — Recette de la version de production (GitHub Pages)

Agent : recette. Date : 20/10/2026. Version testée : `feat/jeu-web` (HEAD `33f3c7a` + modifications non commitées d'autres agents), build `npm run build`.
**Aucun fichier du jeu ni du workflow n'a été modifié** (aucun défaut trivial prouvé). Fichiers ajoutés : ce compte rendu et cinq captures `docs/screenshots/recette-*.png`.

## Verdict en bref

| # | Point | Verdict |
|---|---|---|
| 1 | Build et poids | OK (`dist/` 2,8 Mo dont 1,86 Mo de sourcemap ; 0,96 Mo sans elle ; JS 165 Ko gzip) |
| 2-3 | Sous-chemin `/Haystack/` et racine `/` | OK : 0 requête 404 ou échouée, 0 erreur console, 0 avertissement, manifeste, icônes, favicon, `__haystackReady` ; tutoriel joué au doigt sur les deux bases |
| 4 | Sauvegarde (rechargement, vidée, corrompue, indisponible) | OK : 19 variantes de sauvegarde et 2 pannes de stockage, jamais d'écran blanc |
| 5 | Hors ligne | OK une fois chargé (c00 joué jusqu'à la fin sans aucune requête) ; rechargement hors ligne impossible (pas de service worker, attendu) |
| 6 | Petits écrans / accessibilité | OK : 5 tailles × 9 écrans, aucun défilement horizontal, cibles ≥ 44 px, texte ≥ 13 px |
| 7 | Démarrage | **Objectif ≤ 2 s à CPU ×4 : non atteint au sens strict** (`__haystackReady` ≈ 3,3 s) ; atteint au sens visuel (carte complète ≈ 1,6–1,8 s) |
| 8 | Workflow | YAML correct ; **mais le dépôt GitHub n'est pas prêt : `main` est vide et Pages est réglé sur « Deploy from a branch » (Jekyll)**, voir D1 |

## 1. Build

```
npm run build        # tsc --noEmit && vite build : OK en 7,7 s
npm test             # 367 tests OK ; npm run typecheck OK ; npm run content:check : « OK : aucun problème »
npm ci --dry-run     # OK (le package-lock est cohérent, requis par le workflow)
```

| Fichier | Taille | gzip |
|---|---|---|
| `assets/index-*.js` | 500 982 o (avertissement Vite « > 500 kB ») | 164 848 o (Vite : 166,03 kB) |
| `assets/index-*.css` | 30 485 o | 7 267 o |
| `index.html` | 1 654 o | 767 o |
| Polices (11 fichiers, woff2 + woff de repli) | 390 408 o (Inter 218 512, Special Elite 171 896) | déjà compressées |
| Images (`icon-192`, `icon-512`, `apple-touch-icon`, `icon.svg`) | 60 453 o | |
| `index-*.js.map` (sourcemap, `build.sourcemap: true`) | 1 861 801 o | n'est téléchargée que par les outils de développement |
| **Total `dist/`** | **2 846 498 o (2,8 Mo)** ; 984 697 o sans la sourcemap | |

Transféré au démarrage (cache vide, gzip, mesuré dans le navigateur) : **271 Ko en 4 ressources** (JS, CSS, 2 polices latines) + manifeste et icônes. Les polices `latin-ext`, grecques, cyrilliques ne sont pas chargées : aucun caractère affiché ne tombe dans leurs plages (vérifié sur `src/content` et `src/ui`), donc aucun chargement tardif.

## 2-3. Serveur sous-chemin, racine, démarrage, tutoriel

**Serveur** : `serve.mjs` (Node, sans dépendance, dans le dossier temporaire de la session : `/tmp/claude-0/-home-user-Haystack/af7f9c2e-e1a2-5bb9-943b-ee432104c285/scratchpad/recette/`, non versionné). `node serve.mjs sub 8081 dist` retire le préfixe `/Haystack/` (redirige `/Haystack` vers `/Haystack/` comme GitHub Pages) et renvoie **404 pour tout ce qui est hors `/Haystack/`** ; `node serve.mjs root 8082 dist` sert à la racine. Types MIME corrects (`.webmanifest` → `application/manifest+json`), gzip des textes, `Cache-Control: max-age=600` (comme Pages). Les journaux serveur ne contiennent aucun 404 hors mes propres sondes `curl`.

**Page** (Playwright, Pixel 7 412×915 et 360×740, sous-chemin et racine = 4 combinaisons) : `smoke.mjs`.

- 10 requêtes à chaque chargement, toutes dans la base (`/Haystack/` ou `/`) : `index.html`, JS, CSS, 2 polices, `manifest.webmanifest`, `icon-192.png`, `icon-512.png` (×2 : `any` et `maskable`), `icon.svg`. Aucune requête échouée, aucun statut ≥ 400, **0 erreur et 0 avertissement console**, `window.__haystackReady === true` en 0,54–0,70 s (CPU ×1).
- Manifeste : `start_url` et `scope` `./` résolus en `/Haystack/` ; les 4 icônes se chargent, tailles réelles 192×192 et 512×512 conformes aux déclarations. Pas de `/favicon.ico` demandé (les `<link rel="icon">` suffisent).
- `<meta viewport>` : `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover` ; `theme-color` `#2b2622` ; `color-scheme` `light` ; `lang="fr"` ; titre « Haystack — Enquêtes à Meulebourg ». Favicon SVG + PNG 192 + `apple-touch-icon` : tous en 200. Aucun service worker enregistré.
- Accueil lu à l'image : `recette-accueil-320x568.png` (titre, 4 boutons, pied de page lisibles).
- **`?debug` est actif en production** : `?debug` expose `window.__haystack` (enquêtes avec leurs réponses, magasin de sauvegarde, caméra) et le HUD de coordonnées ; sans `?debug` (ou `?debug=0`) rien n'est exposé. Acceptable pour un jeu entre amis, noté en D3. Les helpers de `tests/e2e` s'en servent pour viser les cibles ; tous les gestes restent de vrais taps.

**Tutoriel c00 joué au doigt** (`specs/prod.spec.ts`, test P1) : on réutilise `helpers.ts` et `play.ts` tels quels (`openCaseFromFolders`, `solveOpenCase`) avec une seule adaptation : une ouverture en URL **relative** (`./?debug`), car `page.goto('/?debug')` de `helpers.openGame` sortirait de `/Haystack/` (une URL absolue remplace le sous-chemin du `baseURL`). La fixture de `helpers.ts` fait échouer le test sur toute erreur console, réponse ≥ 400 ou requête échouée. Résultat, sous-chemin **et** racine : fin avec 3 étoiles, sauvegarde `solved`, rechargement : c00 « Résolu », c01 débloqué (8 s par test).

Paramètres d'URL de production (`urlparams.mjs`, 13 variantes) : aucune erreur ; `?case=zzz`, `?screen=zzz`, `?zoom=abc&x=NaN&y=Infinity`, `?zoom=-5`, `?zoom=1e9&x=1e12` retombent proprement sur l'accueil. Remarque : `?case=c05` ouvre le briefing d'une enquête **verrouillée** (contournement du verrou par l'URL, D3).

## 4. Robustesse de la sauvegarde (clé `haystack:v1`)

Tests P2-P4b de `prod.spec.ts`, sous-chemin et racine (24 tests verts sur chaque base).

| Cas | Résultat |
|---|---|
| (a) Rechargement au milieu de c00 (question 1 résolue, « Continuer » tapé) | Retour à l'accueil (la route n'est pas restaurée), dossier c00 « En cours 1/3 » ; un tap rouvre **directement le jeu à la question 2** (pas de briefing), la réponse 1 est conservée ; l'enquête se termine ensuite avec 3 étoiles |
| (b) `removeItem` puis rechargement | Accueil neuf (sans pastille « n/6 »), c00 « Nouveau », c01 verrouillé |
| (c) Chaîne vide ; JSON invalide ; texte quelconque (`<script>`) ; `null` ; tableau ; nombre ; chaîne JSON | Accueil neuf, aucune erreur |
| (c) Version inconnue (`2`), version `"1"` texte, sans version | Accueil neuf (la sauvegarde étrangère n'est pas relue) |
| (c) `{version:1}` ; `cases:null` + `settings:"x"` ; enquête `null`, inconnue, types faux (`status:7`, `found:"non"`, `pins` mêlés, `stars:9`) ; clés `__proto__` et `constructor` | Jeu démarré, valeurs invalides ramenées aux défauts, aucune erreur |
| (c) `c00` « résolu » sans étapes (valeur forgée) | Démarre ; pastille 1/6, c01 débloqué, dossier affiché « En cours 0/3 » (incohérence d'affichage sans conséquence, état forgé à la main ; `hasSolved` documenté pour `bestStars`) |
| (c) Énorme : 4 M de caractères non JSON ; JSON valide avec notes de 2 M de caractères, 150 000 réponses, 20 000 punaises ; 60 000 enquêtes inconnues | Prêt en 0,46–0,61 s (CPU ×1), aucune dégradation ; les notes et listes sont tronquées à la relecture |
| (d) `Storage.prototype.setItem` lève `QuotaExceededError` | Pas de plantage ; **toast** « La sauvegarde est impossible dans ce navigateur : la progression sera perdue en fermant la page. » (6 s) à la première écriture ; l'enquête se joue et se termine en mémoire ; Réglages : « Ce navigateur ne garde rien (navigation privée ?) … » ; 0 erreur console |
| (d) L'accesseur `window.localStorage` lève `SecurityError` | Idem ; pied de l'accueil dès le départ : « Navigation privée ? Ce navigateur ne garde pas la progression. » |

Capture : `recette-sauvegarde-impossible.png`.
Remarque : une valeur illisible reste dans `localStorage` tant que rien n'est enregistré, puis elle est écrasée au premier enregistrement (une sauvegarde d'une version future serait écrasée sans avertissement ; sans conséquence tant que la version reste 1).

## 5. Hors ligne

Test P5 : après chargement et 1,5 s de repos, `context.setOffline(true)`. Le jeu continue : Enquêtes, briefing, c00 résolu jusqu'à l'écran de fin (3 étoiles), « Comment jouer », « Explorer », avec **0 requête échouée et 0 erreur console** (aucune ressource tardive : toutes les ressources utiles sont chargées avant la fin du démarrage). Un **rechargement hors ligne** échoue (`net::ERR_INTERNET_DISCONNECTED`, page d'erreur du navigateur) : pas de service worker, comportement attendu. Retour en ligne : le jeu redémarre normalement et la progression est conservée.

## 6. Petits écrans et accessibilité

`specs/a11y.spec.ts` : pour 320×568, 360×740, 390×844, 412×915 et 915×412 (paysage), sur 9 écrans (accueil, dossiers, jeu, feuille de confirmation, demande d'indice, carnet, fin d'enquête, réglages, comment jouer) : défilement horizontal de la page, taille des zones réellement cliquables (balayage autour du centre avec `elementFromPoint`), taille de police des textes visibles, éléments d'interface dépassant l'écran.

- **Aucun défilement horizontal** ni élément qui déborde, 45 mesures sur 45.
- **Police minimale 13 px** (14 px dans les réglages), aucun texte sous 12 px.
- **Cibles ≥ 44 px** partout (boutons du jeu 44×44 et 48 de haut ; Minicarte/Punaise/Indice 89 à 126 × 48). Deux fausses alertes expliquées : « Réinitialiser » à 320×568 (zone cliquable lue 161×28 : plafond de 80 px de mon balayage et bouton coupé par le bas de l'écran, la page défile) ; en paysage « Regarder la carte » et « Recommencer » (liens soulignés) mesurent 42 px de haut pour 44 visuels, soit un écart d'un pixel de mesure.
- À 320×568 le titre du dossier est tronqué par une ellipse (« La Tarte de bienv… »), attendu.
- Captures lues : `recette-accueil-320x568.png`, `recette-fin-320x568.png`, `recette-enquete-915x412.png` (en paysage le panneau de question reste à droite, la carte est bien visible). Les 20 captures complètes (accueil, enquête, confirmation, fin × 5 tailles) restent dans le dossier temporaire de la session.
- Réserve : `maximum-scale=1, user-scalable=no` interdit le zoom de page (WCAG 1.4.4) ; choix assumé pour une carte à gestes propres (iOS Safari l'ignore de toute façon), noté en D6.
- Observation : tant que le carnet est ouvert, les boutons du jeu restent dans l'arbre d'accessibilité (ils sont seulement recouverts) ; pas d'`inert`/`aria-modal` vérifié, sans incidence tactile.

## 7. Performance de démarrage (build de production servi, gzip, Pixel 7 émulé)

Méthode : `perf-prod.mjs` mesure `performance.now()` au passage de `window.__haystackReady` à `true` (setter posé avant le chargement), 5 pages neuves par condition (cache vide), CPU ralenti par `Emulation.setCPUThrottlingRate`, réseau par `Network.emulateNetworkConditions`. Machine : 4 cœurs, rendu logiciel sans GPU.

| Condition | `__haystackReady` médiane [min – max] | Premier affichage (écran de chargement) |
|---|---|---|
| CPU ×1, réseau local | **622 ms** [574 – 657] | 80 ms |
| CPU ×4, réseau local | **3 303 ms** [3 258 – 3 636] | 128 ms |
| CPU ×6, réseau local | 6 196 ms [6 043 – 6 851] | 184 ms |
| CPU ×4, 4G (9 Mb/s, 170 ms) | 3 939 ms [3 876 – 4 039] | 608 ms |
| CPU ×4, 4G lente (1,6 Mb/s, 150 ms) | 4 619 ms [4 434 – 4 744] | 1 296 ms |
| CPU ×4, cache chaud (rechargement) | 3 136 ms [2 982 – 3 270] | 264 ms |
| CPU ×1, cache chaud | 535 ms [495 – 636] | 48 ms |

Pour comparaison, `node scripts/perf-map.mjs --startup` (serveur de développement, modules préchargés avant le ralentissement) donne à CPU ×4 : `buildWorld` 1 022 ms + premier rendu de la ville 867 ms, soit ≈ 1,9 s (≈ 1,5 s annoncé dans `docs/ARCHITECTURE.md` et `docs/JOURNAL.md`) ; il ne compte ni l'analyse du paquet, ni l'interface, ni la composition.

**Décomposition à CPU ×4** (journal des tâches longues, CPU profile, enregistrement d'écran `recette-demarrage-cpu4.png`) :
- 0,1 s : écran « Meulebourg se réveille… » ;
- 0,12 à 1,15 s : une tâche de 1,06 s (`buildWorld`) ; l'accueil s'affiche à ≈ 1,15 s avec une carte encore grise ;
- ≈ 1,3 s : première image de la carte ; **≈ 1,6 à 1,8 s : carte complète à l'écran** (écart à l'image finale < 3 %) ;
- 1,8 à 3,3 s : rendu progressif des détails de tuiles (surtout du temps natif, ≈ 75 % du thread) ; `whenIdle()` attend la fin de ce travail, donc le drapeau `__haystackReady` arrive à ≈ 3,3 s.

Conclusion : **objectif ≤ 2 s à CPU ×4 atteint pour ce que voit le joueur (≈ 1,7 s, avec écran de chargement dès 0,1 s), non atteint pour `__haystackReady` (3,3 s)**, dont la définition (carte au repos) est plus stricte que « premier rendu complet ». À CPU ×1 tout est sous 0,7 s. Le nombre de ressources (4) et le poids transféré (271 Ko) ne sont pas en cause : le réseau 4G ajoute 0,6 à 1,3 s.

## 8. Workflow `.github/workflows/pages.yml` (lecture) et état du dépôt GitHub

Lecture du fichier : déclencheurs `push` sur `main` + `workflow_dispatch` ; `permissions` `contents: read`, `pages: write`, `id-token: write` (les trois nécessaires, rien de plus) ; `concurrency` groupe `pages` avec `cancel-in-progress: true` ; deux travaux : `build` (checkout@v4, setup-node@v4 Node 22 avec cache npm, `npm ci`, `typecheck`, `npm test`, `npm run build`, configure-pages@v5, upload-pages-artifact@v3 sur `dist`) puis `deploy` (`needs: build`, environnement `github-pages` avec l'URL de la page, deploy-pages@v4). Le YAML est valide et conforme au modèle officiel. Le build tourne déjà en local de bout en bout (`npm ci`, `typecheck`, 367 tests, build). `vite.config.ts` utilise `base: './'` : le site fonctionne à `/Haystack/` (vérifié point 2-3) ; pas de routeur ni de 404.html à prévoir (l'historique n'utilise que `pushState` sans changer l'URL).

Vérification de l'état réel du dépôt `MaximeClavel/Haystack` (outils GitHub en lecture seule : liste des workflows et des exécutions) :

- `origin/main` ne contient que le commit « Initial commit » (`59d4343`) : **ni le jeu, ni le workflow**. `pages.yml` n'existe que sur `feat/jeu-web` (41 commits d'avance, `main` en est un ancêtre : fusion en avance rapide possible).
- GitHub ne connaît qu'un seul workflow : le dynamique `pages-build-deployment`. Le workflow « Mise en ligne » n'a jamais tourné (aucune exécution sur `main`). Les 22 exécutions « pages build and deployment » portent la branche `feat/jeu-web` et contiennent l'étape **« Build with Jekyll »** : **Settings > Pages est donc réglé sur « Deploy from a branch » avec la branche `feat/jeu-web`**. Cette configuration publie les sources du dépôt (le `index.html` de développement appelle `/src/main.tsx`), pas le build Vite. Je n'ai pas pu ouvrir l'URL publique (le proxy de la session refuse `maximeclavel.github.io`) : l'affirmation « le jeu n'y est pas jouable » est une déduction, à confirmer en ouvrant `https://maximeclavel.github.io/Haystack/`.

Ce qu'il faut pour un déploiement sans surprise :
1. **Settings > Pages > Build and deployment > Source = « GitHub Actions »** (remplace « Deploy from a branch »).
2. **Fusionner `feat/jeu-web` dans `main`** (le workflow ne réagit qu'à un push sur `main` et, pour `workflow_dispatch`, le fichier doit exister sur la branche par défaut), puis vérifier dans l'onglet Actions que « Mise en ligne » passe au vert (≈ 1-2 min).
3. Si l'on veut tester depuis `feat/jeu-web` avant la fusion : l'environnement `github-pages` n'autorise par défaut que la branche par défaut ; il faudrait ajouter `feat/jeu-web` dans Settings > Environments > github-pages > Deployment branches, et ajouter la branche aux déclencheurs. Sinon : fusion d'abord.
4. Dépôt public (ou plan GitHub payant : Pages sur dépôt privé n'est pas disponible en plan gratuit) ; le site publié est public.
5. Ouvrir ensuite `https://maximeclavel.github.io/Haystack/` (respecter la casse du nom du dépôt), recharger deux fois, jouer c00.

Améliorations facultatives (pas de défaut avéré, workflow non modifié) : `cancel-in-progress: false` (recommandation officielle pour Pages : ne pas interrompre un déploiement en cours) ; ajouter `npm run content:check` aux étapes ; un second workflow sur `pull_request` pour les contrôles sans déploiement ; les e2e (`npx playwright install chromium` serait alors nécessaire sur le runner, jamais en local) ; passer les actions à leurs dernières versions majeures (v4/v3/v5 valides à ma connaissance ; avertissements Node 20 possibles dans les journaux).

## Défauts et réserves

| # | Gravité | Constat | Preuve |
|---|---|---|---|
| D1 | **Haute (déploiement, pas le code)** | Le workflow ne peut pas se déclencher (absent de `main`) et Pages est réglé sur la branche `feat/jeu-web` avec Jekyll : l'URL publique ne sert pas le build | `git ls-tree origin/main` ; API Actions : 22 exécutions « pages build and deployment », étape « Build with Jekyll », `head_branch` `feat/jeu-web`, aucune exécution de « Mise en ligne » |
| D2 | Moyenne | Démarrage à CPU ×4 : `__haystackReady` ≈ 3,3 s (objectif ≤ 2 s) ; carte visuellement complète ≈ 1,7 s ; les documents annoncent ≈ 1,5 s, mesure qui exclut le paquet et l'interface | tableau du point 7, `recette-demarrage-cpu4.png` |
| D3 | Basse | `?debug` actif en production (expose réponses, magasin de sauvegarde, HUD) ; `?case=c05` ouvre une enquête verrouillée | `window.__haystack` défini avec `?debug` ; `urlparams.mjs` |
| D4 | Basse (cosmétique) | Le toast « La sauvegarde est impossible… » (6 s) recouvre le titre « Bien vu ! » de la carte de résultat à la première réponse enregistrée | `recette-sauvegarde-impossible.png` |
| D5 | Basse (cosmétique) | L'icône déclarée `maskable` est la même image que `any` : la pointe de la loupe et le pied de la meule sont à ≈ 93 % du rayon, hors de la zone sûre de 80 % ; rognage possible sous un masque circulaire Android | lecture de `public/icon-512.png` |
| D6 | Info | Le viewport interdit le zoom de page (`user-scalable=no`) | `index.html` |
| D7 | Info | Pas de service worker : rechargement hors ligne impossible (attendu) ; sourcemap de 1,86 Mo publiée ; polices `.woff` de repli (93 Ko) jamais utilisées par les navigateurs récents ; paquet JS à 500,98 Ko (avertissement Vite) | points 1 et 5 |

## Corrections triviales

Aucune. Fichiers ajoutés : `docs/journal/phase4-recette.md`, `docs/screenshots/recette-accueil-320x568.png`, `recette-enquete-915x412.png`, `recette-fin-320x568.png`, `recette-demarrage-cpu4.png`, `recette-sauvegarde-impossible.png`. `dist/` reconstruit (ignoré par git). Rien n'est commité.

## Reste ouvert

- **D1** : régler Pages sur « GitHub Actions » et fusionner dans `main` (décision de l'orchestrateur / du propriétaire du dépôt), puis refaire un passage rapide sur l'URL réelle (accueil, c00, hors ligne) : cette recette ne couvre que le build servi localement, pas la distribution GitHub (compression, en-têtes, délai de 10 min du cache).
- **D2** : décider si `__haystackReady` doit rester « carte au repos » ou signaler le premier rendu complet ; pistes (non faites) : tâche de 1 s de `buildWorld` découpable ou différable pendant l'écran de chargement, rendu des détails de tuiles différé après le premier affichage. Mettre à jour les chiffres de démarrage de `docs/ARCHITECTURE.md` et `docs/JOURNAL.md` (≈ 1,5 s mesure partielle ; 3,3 s mesure complète en production).
- D3 à décider : garder `?debug` et `?case=` (pratique pour les amis et les tests e2e) ou les conditionner à une variable de build.
- D4, D5 : retouches cosmétiques possibles (décaler le toast au-dessus de la carte ; fournir une vraie icône maskable avec marge ou retirer l'entrée `maskable`).
- Les scripts de recette (`serve.mjs`, `smoke.mjs`, `pw.config.ts`, `specs/prod.spec.ts`, `specs/a11y.spec.ts`, `perf-prod.mjs`, `perf-phases.mjs`, `perf-prof.mjs`, `urlparams.mjs`) sont dans le dossier temporaire de la session ; non versionnés (hors périmètre). À copier dans `tools/recette/` si l'on veut rejouer la recette après la mise en ligne : `node serve.mjs sub 8081 dist` + `npx playwright test -c <dossier>/pw.config.ts` (le fichier de configuration vise `http://127.0.0.1:8081/Haystack/` et `http://127.0.0.1:8082/`).
