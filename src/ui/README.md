# Module `ui` — l'interface jouable (Preact)

Tout ce que le joueur touche en dehors de la carte : écrans, feuilles, navigation, sauvegarde,
réglages, minicarte, retours haptiques. L'interface **assemble** les autres modules : `world`
(la ville), `engine` (la carte), `game` (les règles), `content` (les enquêtes), `art` (portraits,
illustrations).

Point d'entrée : `src/main.tsx` (polices Special Elite et Inter, styles, `boot()`).

## Principes

- **Une seule carte.** `index.html` contient UN canevas plein écran (`#map`) ; `createMapHost`
  (`mapHost.ts`) crée UNE instance de `createMapView` au démarrage. Elle n'est jamais recréée :
  tous les écrans sont des **calques Preact** par-dessus (`#app`, `pointer-events: none` ; seuls les
  éléments d'interface captent les gestes).
- **Pas de re-rendu Preact à chaque image.** Ce qui suit la caméra (rectangle de la minicarte, nom
  du lieu, HUD de débogage) s'abonne à `host.onCamera` et dessine directement (canevas ou DOM), ou
  ne met à jour l'état Preact que lorsqu'une valeur change.
- **Overlays par calques.** Chaque écran pose ses overlays par calque nommé
  (`hint`, `found`, `threads`, `pins`, `replay`, `feedback`, `select`) ; l'hôte les fusionne et
  appelle `map.setOverlays` seulement quand un calque change.
- **Marges de la carte.** Les écrans mesurent leur barre haute et leur feuille du bas
  (`host.measureInsets`) ; `host.focus(p, zoom)` et `host.focusRect(rect)` cadrent alors dans la
  **zone libre** (au-dessus du panneau de question ; à gauche de la feuille en paysage).
- **Navigation par état interne** (`App.tsx`) : `home`, `cases`, `case`, `explore`, `howto`,
  `settings`. Pas de routeur. L'enquête garde ses sous-états (briefing, jeu, fin, reconstitution).
- **Sauvegarde** : `createSaveStore()` du module game, enveloppé par `store.ts` (`AppStore`) :
  chargée au démarrage, enregistrée à **chaque** changement (réponse, indice, punaise, note, réglage).

## Fichiers

| Fichier | Rôle |
|---|---|
| `boot.tsx` | Écran de chargement « Meulebourg se réveille… », construction du monde après une image peinte, carte, interface, `__haystackReady` |
| `App.tsx` | Racine : navigation, services partagés (contexte), toasts, réglages appliqués (mouvement réduit, gaucher) |
| `mapHost.ts` | Hôte de la carte unique : taps, abonnés caméra, calques d'overlays, marges, cadrages |
| `store.ts` | `AppStore` (sauvegarde en mémoire + enregistrement + abonnés), hook `useSave` |
| `context.ts` | `ServicesContext` / `useServices()` |
| `params.ts` | Paramètres d'URL |
| `views.ts` | Vue d'ensemble de l'accueil, dérive lente, départ de l'exploration |
| `format.ts` | Textes d'affichage : numéro de dossier, statut, raison de verrouillage, nom du lieu… |
| `haptics.ts` | Vibrations courtes (`navigator.vibrate`, silencieux si absent) |
| `illustrations.ts` | Dessins de « Comment jouer » (vraies vignettes de la ville et scènes dessinées avec `drawEntity`) |
| `debug.ts` | `window.__haystack` et HUD des coordonnées (`?debug`) |
| `icons.tsx` | Icônes SVG (trait) |
| `styles.css` | Identité visuelle, mise en page mobile, paysage, mouvement réduit |
| `components/` | `bits.tsx` (étoiles, loupes de difficulté, interrupteur, barre haute), `Minimap.tsx`, `Portrait.tsx` |
| `screens/` | `Home`, `Cases` (dossiers), `Investigation` (+ `investigation/` : panneau de question, feuille de confirmation, carnet, briefing, résultat, fin, reconstitution, overlays), `Explore`, `HowTo`, `Settings` |
| `tools/` | Scripts Node de vérification (non publiés) : `play-c00.mjs`, `states.mjs`, `make-icons.mjs` |

## Écrans

| Écran | Contenu |
|---|---|
| Chargement | « Meulebourg se réveille… » ; la loupe s'anime (animation CSS, fluide même pendant le calcul) pendant que le monde se construit |
| Accueil | Étiquette « Haystack — Enquêtes à Meulebourg » punaisée, la ville en vue d'ensemble derrière un voile, lente dérive de caméra (sauf mouvement réduit) ; Enquêtes (avec compteur), Explorer la ville, Comment jouer (pastille tant qu'il n'a pas été lu), Réglages |
| Dossiers | Chemises kraft : onglet « N° 00 », titre, difficulté en loupes, accroche sur une fiche, tampon Nouveau / En cours x/y / Résolu + étoiles ; verrouillées : « Terminez « … » pour débloquer » ; section « Hors série » pour le bonus |
| Enquête | Barre haute (retour, titre, carnet) ; panneau de question repliable (progression, onglets si plusieurs questions ouvertes, indices obtenus, actions Minicarte / Punaise / Indice) ; briefing au premier lancement puis vol vers `def.start` |
| Désignation | Tap → sous `PICK_MIN_ZOOM`, vol à zoom 2 et « Rapprochez-vous pour désigner » ; sinon `pickAt` → cadre `select` (ou anneau) + feuille avec **vignette** (`renderSnapshot` serré sur la cible, marquée) et Désigner / Annuler |
| Résultats | Correct : cadre `found`, carte « Bien vu ! » avec `step.solved`, vibration, fils rouges, question suivante (« Conclure l'enquête » à la fin) ; fausse piste : anneau `near` + carte dédiée ; erreur : anneau `wrong` bref + « Ce n'est pas ça… » ; déjà trouvé : « Déjà trouvé » |
| Indices | Confirmation intégrée (« Utiliser un indice ? Vous perdrez des étoiles. » + ce que donne le niveau) ; 1 : texte ; 2 : texte + projecteur + vol ; 3 : anneaux `reveal` + vol ; textes obtenus consultables, « Voir la zone », projecteur masquable |
| Carnet | Feuille : briefing, questions résolues (texte + « Voir »), personnages identifiés (portraits), notes, punaises (poser, voir, retirer) |
| Fin | Tampon « Affaire classée », étoiles, épilogue, indices et erreurs ; Revoir l'histoire (reconstitution : vols successifs, légende, précédent / suivant / fermer, avance auto ~4 s sauf mouvement réduit), Retour aux dossiers, Regarder la carte, Recommencer |
| Explorer | Carte libre, minicarte, nom du lieu (lieu remarquable · quartier) au centre de la zone libre ; un tap sur un lieu remarquable affiche son nom |
| Minicarte | Vignette de toute la ville rendue une fois (préparée au repos) + rectangle de la vue + repères (réponses, punaises) ; tap pour s'y rendre |
| Comment jouer | 4 étapes illustrées (zoomer, suivre un personnage, désigner, indices et carnet), glisser ou boutons |
| Réglages | Vibrations, mode gaucher (barre d'actions et minicarte en miroir), mouvement réduit (aussi `map.setReducedMotion`, et la préférence système est respectée), réinitialisation avec confirmation intégrée |

## Paramètres d'URL

| Paramètre | Effet |
|---|---|
| `?debug` | `window.__haystack = { world, map, host, cases, store, session, route, pickAt, entityCenter, openCase(id), screen(name) }` et HUD des coordonnées monde (dernier appui + entité) |
| `?ui=0` | Carte seule, sans interface |
| `?x=…&y=…&zoom=…` | Caméra initiale (l'écran ne la déplace pas, la dérive de l'accueil est désactivée) |
| `?case=<id>` | Ouvre l'enquête (même verrouillée : utile aux tests) |
| `?screen=<nom>` | `accueil`, `dossiers`, `regles`, `reglages`, `explorer` |
| `?reduced=1` | Mouvement réduit forcé |

`window.__haystackReady = true` quand l'écran initial est rendu, les polices chargées (1,5 s au
plus) et la carte au repos (`map.whenIdle()`).

`__haystack.entityCenter` accepte `(id)` ou `(world, id)` ; `session` est la session d'enquête
active (ou `null`).

## Repères pour les tests (`data-testid`)

`screen-home|cases|case|explore|howto|settings`, `menu-cases|explore|howto|settings`, `back`,
`folder-<id>`, `briefing`, `brief-start`, `question-panel`, `question`, `tab-<stepId>`,
`collapse`, `action-minimap|pin|hint`, `hint-ask`, `hint-confirm`, `hint-cancel`, `hint-box`,
`confirm-sheet`, `confirm-designate`, `confirm-cancel`, `result-solved`, `result-near`,
`result-continue`, `toast`, `pin-banner`, `open-notebook`, `notebook`, `notebook-close`, `notes`,
`nb-pin-mode`, `nb-show-<stepId>`, `case-end`, `end-replay`, `end-exit`, `end-look`, `replay`,
`replay-next`, `replay-close`, `replay-done`, `minimap`, `explore-minimap`, `place`, `howto-next`,
`howto-done`, `reset`, `reset-confirm`, `loading`. L'écran d'enquête porte `data-phase`
(`brief`, `play`, `end`, `replay`).

## Accessibilité et mobile

Cibles tactiles ≥ 44 px ; marges de sécurité (`env(safe-area-inset-*)`) ; aucune page ne défile
(`overscroll-behavior: none`, `touch-action` : `none` sur la carte, `pan-y` sur les listes) ;
`prefers-reduced-motion` et réglage « mouvement réduit » (animations CSS coupées, vols instantanés) ;
focus visible (or du foin) ; boutons-icônes avec `aria-label` ; feuilles en `role="dialog"`
(le focus va à la feuille, Échap ferme le carnet et annule une désignation) ; toasts en
`aria-live`. Paysage téléphone : les feuilles passent à droite, la carte cadre à gauche.

## PWA

`public/manifest.webmanifest` (standalone, portrait, couleurs de la table), `public/icon.svg`
(source) et ses rendus PNG 192, 512 et 180 (`apple-touch-icon.png`), régénérables par
`node src/ui/tools/make-icons.mjs`. Pas de service worker.

## Vérifier

```bash
npx tsc --noEmit
npx vitest run
npm run build
node src/ui/tools/play-c00.mjs        # joue le tutoriel au doigt (Pixel émulé), contrôles + captures dans .shots/ui/play
node src/ui/tools/states.mjs          # onglets, approche, minicarte, gaucher, paysage, tablette… dans .shots/ui/states
node scripts/shot.mjs "/?screen=dossiers" .shots/dossiers.png --width 390 --height 844 --dpr 2
```
