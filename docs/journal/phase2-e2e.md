# Phase 2 — agent `e2e` : tests de bout en bout (téléphone émulé)

Date : 14/10/2026. Périmètre : `tests/e2e/**`, `playwright.config.ts`, ce compte rendu, et une
capture conservée (`docs/screenshots/e2e-reponses.jpg`). **Aucune modification de `src/`** (aucun
défaut de l'interface révélé par les tests), **aucun changement de contrat**, aucune dépendance.
Documentation détaillée : `tests/e2e/README.md`.

## Ce qui a été fait

Suite Playwright complète sur Pixel 7 émulé (412 × 839, densité 2,625, tactile), 10 tests, ≈ 2 min :

| Test | Ce qu'il prouve |
|---|---|
| `01-demarrage` | L'accueil s'affiche sans erreur après l'écran de chargement ; une seule carte plein écran ; aucune page ne défile ; Dossiers : tutoriel « Nouveau », c01 et bonus verrouillés (un tap sur un dossier verrouillé ne l'ouvre pas) ; ouverture du tutoriel → briefing → jeu → retours ; `window.__haystack` exposé avec `?debug` |
| `02-tutoriel` | c00 résolu par de **vrais taps** (cible via `entityCenter`, vol `flyTo` zoom 2 centré dans la zone libre, `worldToScreen`, `page.touchscreen.tap`, « Désigner », carte « Bien vu ! » avec le texte de l'étape) ; « Conclure l'enquête » → fin, « Affaire classée », **3 étoiles** ; fils rouges ; reconstitution (suivant, fermer) ; **après rechargement** : c00 « Résolu » + 3 étoiles, compteur 1/6, c01 et bonus débloqués, c02 verrouillé ; rouvrir c00 mène à l'écran de fin |
| `03-erreurs-indices` | c01 : tap dans le vide → « Ce n'est pas ça… » et une erreur comptée ; fausse piste (Picotin) → carte « Fausse piste » avec le texte du dossier, **pas** d'erreur, question toujours ouverte ; indice demandé puis refusé (rien compté) ; niveau 1 (texte seul) ; niveau 2 (texte + zone, caméra centrée sur la zone, **projecteur mesuré en pixels** : luminance hors du cercle 76 contre 150 projecteur masqué, intacte dans le cercle ; « Masquer / Afficher le projecteur ») ; niveau 3 (« Voici où regarder. », réponse révélée et visible dans la zone libre, bouton « Revoir » gratuit) ; bonne réponse ; sauvegarde `{ hints: 3, mistakes: 1 }`, estimation 1 étoile |
| `04-toutes-les-enquetes` | **Les 7 enquêtes (c00 → c05 puis le bonus) résolues au doigt** depuis l'écran des dossiers, en vérifiant avant chacune l'état de TOUS les verrous ; chaque réponse acceptée est tapée — y compris les **alternatives** (c01 caisse/poubelle, c02 barque/Barbarie, c03 Lapince ×2, bateau/Lola, c04 Ludo ×2, faux diamant/fontaine, c05 Gontran ×3 : tap, contrôle, « Annuler ») et les 10 aiguilles du bonus (« Bien vu ! k sur 10 ») ; 3 étoiles partout ; « 6 affaires classées sur 6 », 6/6 à l'accueil ; tout relu après rechargement |
| `05-explorer-reglages` | Exploration : glisser d'un doigt (événements tactiles CDP), nom du lieu, tap sur un lieu remarquable bâti → son nom ; minicarte (exploration et enquête) : un tap y emmène la caméra (< 60 u près) ; Comment jouer : 4 étapes, pastille « à lire » qui disparaît ; Réglages : la dérive de l'accueil existe puis disparaît en **mouvement réduit** (vols instantanés, `data-reduced`, gardé au rechargement), mode gaucher (`data-hand`), **réinitialisation** (désactivée sans progression ; punaise posée en jeu → « En cours » ; annuler puis confirmer ; réglages conservés ; c00 « Nouveau », c01 reverrouillé) |
| `06-parcours-console` | Tous les écrans dans une même page : comment jouer, réglages, exploration + minicarte, tutoriel, **tap de loin** (« Rapprochez-vous pour désigner », zoom ≥ 1,5, pas de feuille), panneau replié/déplié, carnet (notes enregistrées, punaise posée depuis le carnet puis retirée), retours — sans erreur console |

**Console** : une fixture automatique (`helpers.ts`) fait échouer **tout** test qui produit une erreur
console, une exception de page, une réponse HTTP ≥ 400 ou une requête échouée. Aucune sur l'ensemble
du parcours.

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Vérité d'un tap | Le HUD de `?debug` écrit au lâcher du doigt `appui (x, y) <id>` (même `pickAt` que l'interface) : le test attend la ligne de CE tap (coordonnées à 3 u près) et compare l'id | Prouve ce que le doigt a désigné, sans exposer d'état interne supplémentaire ni modifier `src/ui` |
| Résultat | Toujours vérifié dans l'interface (feuilles, toasts, étoiles, dossiers) **et** dans la session / la sauvegarde | Un test qui ne regarderait que l'API ne prouverait pas le parcours du joueur |
| Point de visée | Centre du rectangle de désignation ; centroïde pour une zone ; si le centre est masqué, point « sûr » visible le plus proche (annoncé `[attention] réponse partiellement masquée`) ; si rien n'est désignable : échec explicite + capture | Un joueur tape ce qu'il voit ; un masquage total est un vrai défaut de contenu, jamais contourné |
| Zone libre | Vol par `host.cameraFor` (centre de la zone entre barre haute et panneau) + contrôle `elementFromPoint === canvas` avant chaque tap | Un tap ne doit jamais tomber sur l'interface |
| Animations | Mouvement normal (pas de `?reduced`) ; attente `map.whenIdle()` avant chaque tap ; vols du test courts (300 ms) | Réaliste ; un appui pendant un vol n'est pas un tap pour le moteur |
| Minicarte | Tap via le locator (attente de stabilité) | Son animation d'apparition décale la boîte mesurée trop tôt (premier essai instable) |
| Projecteur | Lecture de pixels du canevas de la carte, copiés dans un petit canevas `willReadFrequently` | Vérifie l'effet réellement dessiné ; sans avertissement Canvas2D |
| Un test long pour le test 04 | Un seul test (8 min max) découpé en `test.step` par enquête | Le déblocage dans l'ordre impose un état partagé ; la durée réelle est ≈ 75 s |
| `expect.timeout` 10 s | Dans `playwright.config.ts` | Marge pour une machine chargée (rendu logiciel) |

## Désignabilité des réponses (constat)

Les **49 cibles** (toutes les réponses acceptées des 7 enquêtes, alternatives comprises) sont
désignables **au centre** à zoom 2 : aucune n'est masquée par un arbre, un véhicule ou une autre
entité, aucune n'est sous l'interface. Relecture visuelle de chaque cible au zoom de jeu :
`docs/screenshots/e2e-reponses.jpg` (planche générée par `tests/e2e/tools/planche.mjs`).
Recouvrements d'emprises visuelles relevés par heuristique, sans gêne à la désignation ni à l'œil :
`c01.lafouine.3` (spectateur voisin), `c04.egout` (Lino qui grimpe hors de la plaque), `c01.poubelle`
(la caisse qui en dépasse, elle-même réponse), `c02.barque` (Hippolyte Barbarie à bord, lui-même
réponse).

## Vérification

- `npx tsc --noEmit` : OK (les tests e2e sont typés, `tsconfig` inclut `tests`).
- `npx vitest run` : 13 fichiers, 278 tests verts (inchangé).
- `npm run e2e` : **10/10 verts, 4 passes complètes consécutives** (≈ 2 min chacune ; test 04 ≈ 72 s :
  c00 5 s, c01 7 s, c02 9 s, c03 10 s, c04 11 s, c05 12 s, bonus 11 s).
- Diagnostic d'échec éprouvé sur des entités ambiantes : un passant au centre masqué par un arbre est
  désigné par sa partie visible et annoncé ; un objet entièrement caché sous un peuplier produit
  « la réponse … n'est PAS désignable — … au centre, un tap désigne a.t.537 (tree:poplar) » (test
  temporaire, retiré).

## Limites connues

- Le HUD de `?debug` est la source de « ce que le tap a désigné » : s'il change de format, adapter
  l'expression de `tapWorld` (`helpers.ts`).
- Les zones sont visées au centroïde (aucune zone n'est réponse aujourd'hui) : une zone concave dont
  le centroïde tombe dehors demandera un « point sûr » à l'intérieur.
- Les tests tournent sur le serveur de développement Vite, pas sur le build de production (servi
  sous `/Haystack/`), déjà contrôlé à la main par l'agent `ui`.
- Pas de test en paysage ni sur CPU ralenti (couverts par `src/ui/tools/states.mjs` et
  `scripts/perf-map.mjs`).
- `docs/ARCHITECTURE.md` § 6 décrit encore `__haystack = { world, map, cases, session }` ; les tests
  utilisent l'objet réel (`host`, `store`, `pickAt`, `entityCenter`…) décrit dans `src/ui/README.md`.

## Comment vérifier

```bash
npx tsc --noEmit && npx vitest run
npm run e2e                                              # 10 passed (≈ 2 min)
E2E_SHOTS=1 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts
node tests/e2e/tools/planche.mjs .shots/e2e .shots/e2e-planche.jpg   # relecture des 49 cibles
```
