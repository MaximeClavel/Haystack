# Phase 2 — agent `ui` : l'interface jouable

Date : 14/10/2026. Périmètre : `src/main.tsx`, `src/ui/**`, `index.html`, `public/**`,
`docs/screenshots/ui-*.png`. Documentation détaillée : `src/ui/README.md`.
**Aucun changement de contrat** (`src/types.ts`, `src/config.ts`, `src/art/bounds.ts`,
`src/world/layoutSpec.ts` intacts) ; aucune dépendance ajoutée.

## Ce qui a été fait

- **Démarrage** (`boot.tsx`) : écran « Meulebourg se réveille… » rendu par Preact, deux images
  peintes, puis `buildWorld({ cases: CASES })` ; polices `@fontsource/special-elite` et
  `@fontsource-variable/inter` importées dans `main.tsx` ; sauvegarde `createSaveStore()` chargée
  au démarrage et enregistrée à chaque changement (`store.ts`). En cas d'échec : message et
  bouton « Réessayer ».
- **Une seule carte** (`mapHost.ts`) : le canevas `#map` d'`index.html` et UNE instance de
  `createMapView`, jamais recréées ; les écrans sont des calques Preact. L'hôte route les taps vers
  l'écran actif, diffuse la caméra aux abonnés (dessin direct, sans re-rendu Preact), fusionne les
  overlays par calques nommés, et cadre dans la **zone libre** entre les barres (`focus`,
  `focusRect`, marges haute/basse — ou droite en paysage).
- **Écrans** : accueil (titre punaisé, ville en fond avec voile et lente dérive), dossiers
  (chemises kraft, tampons de statut, étoiles, verrous avec la raison, « Hors série » pour le
  bonus), enquête (barre haute, panneau de question repliable avec progression et onglets,
  briefing puis vol vers `def.start`), désignation (approche sous `PICK_MIN_ZOOM`, `pickAt`, cadre
  de sélection, feuille de confirmation avec vignette `renderSnapshot` marquée), résultats
  (correct / fausse piste / erreur / déjà trouvé, vibration, fils rouges), indices (confirmation
  intégrée, niveaux 1–3, projecteur, anneaux de révélation, vols), carnet (briefing, questions
  résolues avec « Voir », portraits des personnages identifiés, notes, punaises), fin (épilogue,
  étoiles, totaux, reconstitution animée, recommencer), exploration (minicarte, nom du lieu),
  minicarte (vignette rendue une fois, rectangle de vue, repères), comment jouer (4 étapes
  illustrées avec le vrai dessin), réglages (vibrations, gaucher, mouvement réduit, réinitialisation).
- **URL** : `?debug` (`window.__haystack` + HUD), `?ui=0`, `?x=&y=&zoom=`, `?case=<id>`,
  `?screen=<accueil|dossiers|regles|reglages|explorer>`, `?reduced=1`. `__haystackReady` après
  le premier rendu, les polices et `map.whenIdle()`.
- **PWA légère** : `public/manifest.webmanifest`, `public/icon.svg` (loupe sur une botte de foin,
  l'aiguille rouge dans la lentille) rendu en PNG 192 / 512 / 180 par Playwright
  (`src/ui/tools/make-icons.mjs`), liens dans `index.html`. Pas de service worker.
- **Outils de vérification** : `src/ui/tools/play-c00.mjs` (tutoriel joué au doigt + captures),
  `src/ui/tools/states.mjs` (autres états et formats d'écran).

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Carte unique | Canevas statique dans `index.html`, interface dans `#app` en `pointer-events: none` (seuls les éléments d'interface captent) | Jamais de recréation de la carte ni de ses tuiles en changeant d'écran |
| État | Contexte Preact (`ServicesContext`) + `AppStore` abonnable ; la `CaseSession` mutable vit dans l'écran d'enquête, un re-rendu est forcé après chaque action | Simple, sans dépendance (pas de signals) ; rendu uniquement sur action |
| Overlays | Calques nommés fusionnés par l'hôte ; recalculés après chaque rendu de l'enquête | Pas de diff à la main, aucun coût par image |
| Réponses trouvées | Cadre `found` (box) plutôt qu'anneau | Plus lisible autour d'une silhouette ; coche du moteur visible |
| Révélation | Anneau `reveal` (pulsant) autour de chaque réponse révélée | Conforme à la demande, attire l'œil |
| Cadrage | Les vols visent le centre de la zone libre (marges mesurées à chaque rendu et au redimensionnement) | Une cible n'atterrit jamais sous le panneau de question |
| Panneau de question | Masqué (`visibility: hidden`, taille conservée) sous la feuille de confirmation ou de résultat | Pas de double bord ; les marges restent stables |
| Focus | Le focus va à la feuille ou au titre (pas au bouton) | Annonce correcte par les lecteurs d'écran, sans anneau de focus parasite après un toucher |
| Barre d'actions | Minicarte · Punaise · **Indice** (Indice sous le pouce droit) ; gaucher : ordre inversé et minicarte à gauche | « Miroir de la barre d'actions » utile |
| Fin d'enquête | Passage par « Conclure l'enquête » après la carte de la dernière réponse ; cadrage sur toutes les réponses (fils rouges visibles) | On lit la dernière résolution avant l'épilogue |
| Mouvement réduit | Réglage OU préférence système OU `?reduced=1` ; vols instantanés, CSS sans animation, pas de dérive ni d'avance automatique | Respect de `prefers-reduced-motion` sans bloquer le réglage |
| Dérive de l'accueil | `flyTo` très longs (24 s) entre 7 points du centre-ville, arrêtée en quittant l'accueil | Le moteur gère tout (tuiles, interruption) ; aucune boucle maison |
| Minicarte | Ville entière rendue une fois (480 px, ≈ 10 ms) au repos après le démarrage, gardée en mémoire | Ouverture instantanée |
| Approche | Tap sous `PICK_MIN_ZOOM` : vol à zoom 2 centré sur le point + « Rapprochez-vous pour désigner » | Évite les désignations à l'aveugle |
| Paysage téléphone | Feuilles à droite (430 px), marge droite pour le cadrage | La carte garde toute la hauteur |
| `?case=<id>` | Ouvre même une enquête verrouillée | Tests et captures |

## Vérification

- `npx tsc --noEmit` : OK. `npx vitest run` : 13 fichiers, 278 tests verts. `npm run build` : OK
  (JS 448 ko, 149 ko gzip ; CSS 27 ko).
- **Tutoriel c00 joué de bout en bout** (`node src/ui/tools/play-c00.mjs`, Pixel émulé 390×844,
  taps réels via `page.touchscreen.tap` aux positions `worldToScreen(entityCenter(…))`) : briefing,
  vol vers `def.start`, vignette, bonne réponse, fausse piste, erreur (« Ce n’est pas ça… »),
  indices 1 et 2 (projecteur), fil rouge, punaise, carnet et notes enregistrées, fin (2 étoiles),
  reconstitution, retour aux dossiers, sauvegarde relue (c01 débloqué). **Aucune erreur console.**
- `node src/ui/tools/states.mjs` : onglets de c04 (2 questions ouvertes), approche sur le bonus
  (zoom 0,12 → 2), minicarte (tap → la caméra s'y rend), mode gaucher, paysage 844×390, tablette
  820×1180, bureau 1440×900, petit écran 360×640, `?ui=0`, 4 étapes de « Comment jouer »,
  réinitialisation, indice niveau 3, écran de chargement : aucun problème.
- Build de production servi sous `/Haystack/` (comme GitHub Pages) : manifeste, icônes, polices
  chargés ; dérive de l'accueil active puis arrêtée sur les dossiers ; un seul canevas de carte.
- Défilement tactile (CDP) : la liste des dossiers défile, la page jamais ; la carte suit le doigt.
- Mesures (conteneur sans GPU) : écran de chargement visible ≈ 0,5 s après la navigation (dev),
  prêt ≈ 1 s ; vignette de confirmation 6 ms ; minicarte complète 10 ms.
- Trois tours de captures relues : titres invisibles sur fond sombre (couleur héritée) corrigés,
  menu d'accueil descendu sous le pouce, panneau qui débordait sous les feuilles masqué, vignette
  resserrée, anneau de focus parasite supprimé, nom du lieu tronqué proprement, illustrations
  « suivre un personnage » (assise sur le banc) et « indice » (rue animée) refaites, paysage
  (marge droite, accueil sans pied de page), toasts sous le carnet, cibles tactiles portées à 44 px.

Captures conservées : `docs/screenshots/ui-accueil.png`, `ui-dossiers.png`, `ui-selection.png`
(sélection + vignette), `ui-bonne-reponse.png`, `ui-indice.png` (niveau 2), `ui-carnet.png`,
`ui-fin.png`, `ui-comment-jouer.png`.

## Limites connues

- La dérive de l'accueil redessine la carte à chaque image (comme tout vol) : coût de batterie
  modeste mais réel ; désactivée en mouvement réduit.
- Les marges de cadrage sont rectangulaires : en paysage, la barre haute (à gauche) n'est prise en
  compte que comme marge haute sur toute la largeur.
- `?case=<id>` ignore le verrouillage (voulu pour les tests).
- Les feuilles n'ont pas d'animation de sortie ni de piège à focus complet (seul le carnet est
  `aria-modal`).
- La vibration n'existe pas sur iPhone (API absente) : le réglage le signale.
- `docs/ARCHITECTURE.md` § 6 décrit encore `__haystack = { world, map, cases, session }` : l'objet
  réel est un sur-ensemble (voir `src/ui/README.md`), à reporter par l'orchestrateur.

## Comment vérifier

```bash
npx tsc --noEmit && npx vitest run && npm run build
node src/ui/tools/play-c00.mjs           # « OK : tutoriel joué sans erreur. » ; captures dans .shots/ui/play
node src/ui/tools/states.mjs             # « OK : aucun problème. » ; captures dans .shots/ui/states
node scripts/shot.mjs "/" .shots/accueil.png --width 390 --height 844 --dpr 2
node scripts/shot.mjs "/?screen=dossiers" .shots/dossiers.png
node scripts/shot.mjs "/?case=c00" .shots/briefing.png
```
