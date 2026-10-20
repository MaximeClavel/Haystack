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
  **zone libre** (au-dessus du panneau de question ; à gauche de la feuille en paysage). Ces mêmes marges
  sont transmises au moteur (`host.setInsets` → `map.setInsets`) : elles **bornent aussi la caméra**, si bien
  que la rive sud de la ville se remonte toujours au-dessus du panneau et le nord se descend sous la barre haute.
- **Navigation par état interne** (`App.tsx`) : `home`, `cases`, `case`, `explore`, `howto`,
  `settings`. Pas de routeur. L'enquête garde ses sous-états (briefing, jeu, fin, reconstitution).
  **Bouton Retour du système** : l'historique ne garde que deux entrées (« base », « cur ») ; un Retour appelle
  d'abord le gestionnaire de l'écran (`svc.setBackHandler` : l'enquête ferme carnet, feuille de confirmation,
  carte de résultat, demande d'indice, mode punaise, minicarte, reconstitution), sinon remonte d'un écran
  (enquête → enquêtes → accueil) ; depuis l'accueil, le navigateur quitte.
- **Garde-fous** : une exception de rendu affiche un écran de secours (`useErrorBoundary`, `error-fallback`) ;
  un voile transparent (`tap-guard`, 320 ms) avale les appuis qui suivent l'apparition ou la disparition d'une
  feuille (double tap involontaire) ; les notes du carnet sont enregistrées à `pagehide` ; un toast prévient
  si la sauvegarde est impossible.
- **Sauvegarde** : `createSaveStore()` du module game, enveloppé par `store.ts` (`AppStore`) :
  chargée au démarrage, enregistrée à **chaque** changement (réponse, indice, punaise, note, réglage).
  Chaque modification repart de ce qui est enregistré (lire-modifier-écrire : un onglet périmé n'écrase rien) ;
  au démarrage, `reconcileSave` recale les statuts sur les enquêtes publiées. « Recommencer » garde le meilleur
  résultat (`bestStars`) : les enquêtes suivantes restent débloquées.

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
| `format.ts` | Textes d'affichage : numéro de dossier, statut, raison de verrouillage, nom du lieu (`placeName` : petit lieu, rue nommée, grand lieu, quartier ; `districtName` ; `placeCaptureMargin`), tous passés par `apostrophes()` — l’affichage a l’apostrophe typographique (’) alors que les noms du monde gardent l’apostrophe droite (contrat `layoutSpec`)… |
| `haptics.ts` | Vibrations courtes (`navigator.vibrate`, silencieux si absent) |
| `illustrations.ts` | Dessins de « Comment jouer » (vraies vignettes de la ville et scènes dessinées avec `drawEntity`) |
| `debug.ts` | `window.__haystack` et HUD des coordonnées (`?debug`) |
| `icons.tsx` | Icônes SVG (trait) |
| `styles.css` | Identité visuelle, mise en page mobile, paysage, mouvement réduit |
| `components/` | `bits.tsx` (étoiles, loupes de difficulté, interrupteur, barre haute), `Minimap.tsx` (noms des quartiers sur la vignette), `PlaceChip.tsx` (nom du lieu ou de la rue sous la caméra, exploration et enquête), `Portrait.tsx` |
| `screens/` | `Home`, `Cases` (dossiers), `Investigation` (+ `investigation/` : panneau de question, feuille de confirmation, carnet, briefing, résultat, fin, reconstitution, overlays, `texts.ts` : textes purs liés aux règles — coût d'un indice avec son horizon, explication de la note à l'écran de fin, libellés du panneau, nom accessible du compteur « n/10 » (`foundCountLabel` : « 2 aiguilles trouvées sur 10 »), extrait de vers du toast du bonus ; testés dans `texts.test.ts`), `Explore`, `HowTo`, `Settings` |
| `tools/` | Scripts Node de vérification (non publiés) : `play-c00.mjs`, `states.mjs`, `make-icons.mjs` |

## Écrans

| Écran | Contenu |
|---|---|
| Chargement | « Meulebourg se réveille… » ; la loupe s'anime (animation CSS, fluide même pendant le calcul) pendant que le monde se construit |
| Accueil | Étiquette « Haystack — Enquêtes à Meulebourg » punaisée, la ville en vue d'ensemble derrière un voile, lente dérive de caméra (sauf mouvement réduit) ; Enquêtes (avec compteur), Explorer la ville, Comment jouer (pastille tant qu'il n'a pas été lu), Réglages |
| Enquêtes (liste) | Chemises kraft : onglet « N° 00 », titre, difficulté en loupes, accroche sur une fiche, tampon Nouveau / En cours x/y / Résolu + meilleures étoiles (gardées si l'enquête est recommencée) ; verrouillées : « Terminez « … » pour débloquer » ; section « Hors série » pour le bonus |
| Enquête | Barre haute (retour, titre, carnet) + **pastille du lieu** sous elle (sous la minicarte quand celle-ci est ouverte) ; panneau de question repliable (progression : « Question N sur M », ou « N pistes ouvertes » quand plusieurs fils sont ouverts ; onglets nommés par `step.label` si plusieurs questions ouvertes, indices obtenus, actions Minicarte / Punaise / Indice (inversées en mode gaucher, dans le DOM comme à l’écran), ce dernier en style secondaire avec liseré et icône `--hay-3` (≥ 3:1 sur le papier) ; bonus : « Relire le testament ») ; briefing au premier lancement puis vol vers `def.start` (une vue d'ensemble, comme le bonus, reprend celle de l'accueil) ; **reprise : la caméra revient sur la dernière trouvaille** (`lastFoundId`) |
| Désignation | Tap → sous `PICK_MIN_ZOOM` (1,5), vol court (300 ms) à zoom 2 et « Rapprochez-vous pour désigner » — sauf dans la zone éclairée par un indice, désignable dès 80 % du seuil ; sinon `pickAt` → cadre `select` (ou anneau) + feuille avec rappel de la **question** (3 lignes), **vignette** (`renderSnapshot` centré sur l'emprise visuelle de la cible, marquée : rien n'est rogné) et Désigner / Annuler. La cible est soumise à la question active, ou à une AUTRE question ouverte dont elle est la bonne réponse (c04, c05) : jamais une erreur injuste |
| Résultats | Correct : cadre `found`, carte « Bien vu ! » avec `step.solved`, vibration, fils rouges, question suivante (« Conclure l'enquête » à la fin) ; fausse piste : anneau `near` + carte « Pas tout à fait… » (titre neutre : « c'est bien lui, mais plus tôt ») ; erreur : anneau `wrong` (2 s) + toast posé au-dessus du panneau, typographié par `fr()` (« Bien vu ! » garde son espace insécable ; trois formulations en rotation : « Ce n'est pas ça… », « … Regardez encore. », « Toujours pas… Cherchez encore. » ; jamais « Pas tout à fait… », réservé aux fausses pistes) ; déjà trouvé : « Déjà trouvé » |
| Indices | Confirmation intégrée (« Utiliser un indice ? » ; boutons « Oui, un indice » puis « Non merci » pour un droitier, l’inverse pour un gaucher, rangés dans cet ordre dans le DOM ; + ce que donne le niveau + **ce que ça coûte** : « Votre note passera de 3 à 2 étoiles au plus » ; à 2 étoiles : « Votre note reste à 2 étoiles ; au-delà de N indices en tout, elle passera à 1 étoile », N = nombre de questions) ; 1 : texte ; 2 : texte + projecteur + vol ; 3 : anneaux `reveal` (pulsent 6 s puis se figent) + vol ; texte d'indice **repliable** (replié dès que le joueur touche la carte : « Indice 1 sur 3 · relire » ; « Voir la zone » et « Masquer le projecteur » restent accessibles fiche repliée ; la fiche se rouvre quand le projecteur change de cible), projecteur masquable |
| Carnet | Feuille : briefing (bonus : le testament en liste de 10 vers, cochés quand l'aiguille est trouvée, avec « Voir »), questions résolues (texte + « Voir »), personnages identifiés (portraits), notes, punaises (poser, voir, retirer) |
| Fin | Tampon « Affaire classée », étoiles et **une ligne qui dit pourquoi cette note** (`stars-why`), épilogue, indices et erreurs ; Revoir l'histoire (reconstitution : vols successifs, légende, précédent / suivant / fermer — noms accessibles « Précédent : moment précédent » et « Suivant : moment suivant » —, avance auto ~4 s sauf mouvement réduit), Retour aux enquêtes, Regarder la carte, Recommencer (garde la meilleure note) |
| Explorer | Carte libre, minicarte, nom du lieu (lieu remarquable ou rue · quartier) au centre de la zone libre ; un tap sur un lieu remarquable affiche son nom |
| Minicarte | Vignette de toute la ville rendue une fois (préparée au repos) **avec les noms des quartiers** + rectangle de la vue + repères (réponses, punaises) ; tap pour s'y rendre (surface de pointage : pas de focus clavier ; le bouton ✕, 44 × 44 px, est entièrement **hors** de la vignette, donc aucun pixel de la vignette ne la ferme par mégarde) |
| Comment jouer | 4 étapes illustrées (zoomer, suivre un personnage, désigner, indices et carnet), glisser ou boutons ; à 600 px de haut ou moins (320 × 568), illustration en 2:1 et texte à 15 px pour que l’étape et ses boutons tiennent sans défiler |
| Réglages | Vibrations, mode gaucher (barre d'actions, confirmation d'indice et minicarte en miroir ; prop `leftHanded` : l’ordre du DOM suit l’ordre visuel, sans `row-reverse`), mouvement réduit (aussi `map.setReducedMotion`, et la préférence système est respectée), réinitialisation avec confirmation intégrée |

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
`howto-done`, `reset`, `reset-confirm`, `loading`, `hint-toggle`, `hint-cost`, `open-briefing`,
`confirm-question`, `conclude`, `stars-why`, `error-fallback`. L'écran d'enquête porte `data-phase`
(`brief`, `play`, `end`, `replay`).

## Accessibilité et mobile

Cibles tactiles ≥ 44 px ; marges de sécurité (`env(safe-area-inset-*)`) ; aucune page ne défile
(`overscroll-behavior: none`, `touch-action` : `none` sur la carte, `pan-y` sur les listes) ;
`prefers-reduced-motion` et réglage « mouvement réduit » (animations CSS coupées, vols instantanés) ;
focus visible (or du foin) ; boutons-icônes avec `aria-label` ; le nom accessible d’un bouton commence par son texte visible (WCAG 2.5.3) ; compteur « n/10 » en `role="img"` nommé par `foundCountLabel` ; bordures de contrôle ≥ 3:1 (WCAG 1.4.11) ; onglets de pistes de c05 resserrés à 340 px de large ou moins ; feuilles en `role="dialog"`
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
