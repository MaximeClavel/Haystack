# Phase 3 — agent `outil-playtest` : l'outil du « joueur test aveugle »

Date : 15/10/2026. Périmètre : `tools/playtest/**` (nouveau), une ligne dans `CLAUDE.md`, une ligne dans le
`README.md` racine, ce compte rendu. **Aucune modification de `src/`**, aucun changement de contrat, aucune
dépendance ajoutée. Reprise d'une première tentative interrompue : `common.mjs` (arguments, découverte des
parties, appel du démon) a été gardé et ajusté ; `_probe.mjs` (sonde jetable) a été supprimé.

## Ce que fait l'outil

Des **joueurs test** (d'autres agents) jouent à une enquête **comme un vrai joueur** : ils voient l'écran
d'un téléphone par des captures, touchent l'écran en pixels, lisent les textes du jeu, et n'ont accès à
**aucune solution**. Mode d'emploi écrit pour eux (ils n'ont pas le droit de lire le code) :
`tools/playtest/README.md`.

| Fichier | Rôle |
|---|---|
| `blind.mjs` | Client en ligne de commande : `start`, `stop [--all]`, `list`, `shot`, `tap`, `dtap`, `drag`, `pinch`, `wait`, `text`, `buttons`, `press`, `status`, `help`. Léger (aucune dépendance lourde) : ≈ 0,1 s de démarrage. |
| `daemon.mjs` | Le démon (lancé détaché par `start`) : serveur Vite propre sur un port libre (ou `--port`), Chromium Pixel 7 (412×915, densité 2,625 ; `--device small` : 390×844, densité 2), profil neuf, page ouverte sur `/?case=<id>` **sans `?debug`**, petit serveur HTTP de contrôle sur `127.0.0.1` (port libre, jeton aléatoire). |
| `page-tools.mjs` | Tout ce qui touche la page : gestes tactiles, attente de stabilité de la carte, lecture de l'interface, recherche de bouton, sauvegarde (chiffres), captures. Réutilisé par le test de l'outil. |
| `common.mjs` | Arguments, dossiers de partie, découverte des parties, appel du démon. |
| `selftest.mjs` | Test de l'outil (≈ 50 s, 66 contrôles). |
| `README.md` | Mode d'emploi du joueur test (+ une note pour l'organisateur en bas de page). |

État par partie dans `.shots/playtest/<enquête>/` (ou `<enquête>/<joueur>/` avec `--player <nom>`, pour que
plusieurs joueurs jouent la même enquête en même temps) : `NNN.png` ou `<nom>.png` (captures), `daemon.log`
(journal du démon, erreurs de la page comprises), `commands.jsonl` (une ligne par commande : date, commande,
arguments, durée, succès — utile pour analyser un parcours), `daemon.json` (pid, ports, jeton : disparaît à
l'arrêt). Un nouveau `start` dans un dossier qui contient déjà une partie précédente range ses fichiers dans
`_archive/<date>/` (rien n'est supprimé).

### Gestes et lecture

- `tap` : `page.touchscreen.tap`. `dtap` : deux taps à 70 ms. `drag` et `pinch` : événements tactiles CDP
  (`Input.dispatchTouchEvent`), comme `scripts/perf-map.mjs`. Le glissé s'arrête 90 ms avant de lever le
  doigt (pas d'élan : la carte suit le doigt, mesuré : 200 px pour 200 px demandés) ; `--fling` donne l'inertie. Le pincement
  borne l'écartement des doigts à l'écran et annonce le facteur réellement appliqué (mesuré : ×1,50 demandé
  → ×1,50 obtenu ; `dtap` ≈ ×2).
- Après chaque geste : attente que la carte soit stable (échantillonnage d'une miniature du canevas, 3,5 s
  au plus) puis **résumé de l'écran** : message passager, feuille ouverte et ses boutons, changements du
  panneau de question, lieu. Les messages passagers (toasts, 1,8 à 2,6 s) sont enregistrés par un petit
  script injecté dans la page (`addInitScript`, aucune API exposée au jeu) : ils sont rapportés même si la
  stabilisation de la carte dure plus longtemps qu'eux.
- Un geste attend la disparition du voile anti-double-tap de l'interface (`tap-guard`, 320 ms) : un
  appui trop rapide n'est jamais « avalé » silencieusement.
- `press <libellé>` : cherche parmi les boutons **visibles et non masqués** (`elementFromPoint`), libellé
  exact d'abord puis partiel, sans accents ni casse ni différence d'apostrophe ; ambigu ou inconnu →
  erreur qui liste les boutons visibles ; bouton inactif (dossier verrouillé) → refusé clairement.
- `text` : le texte visible de l'interface (arbre DOM filtré par `checkVisibility`, hors `.sr-only`, hors
  zones hors écran), regroupé par zone (message, feuille, panneau de question, écran, en-tête, lieu), puis la
  liste des boutons. `buttons` ajoute la position de chaque bouton.
- `shot` : capture de tout l'écran **à l'échelle CSS** (412×915 : 1 pixel d'image = 1 pixel de coordonnée, ce
  qui évite aux joueurs toute conversion). `--grid` superpose une grille de repérage dessinée le temps de la
  capture (lignes tous les 50 px, valeurs tous les 100 px) ; `--crop x,y,l,h` agrandit une zone à la densité
  réelle de l'écran (grille plus fine en option). Ajouts hors cahier des charges, mais utiles : les modèles
  estiment mal des coordonnées sur une image sans repère.
- `status` : enquête, phase, questions résolues / total, erreurs, indices, étoiles (si terminée), durée,
  captures, commandes, et le nombre d'incidents techniques de la page (erreurs console, requêtes échouées).
  Lu dans la sauvegarde du navigateur (`haystack:v1`) **en ne gardant que des nombres** : jamais les
  identifiants `found`, jamais les punaises.

## Anti-triche : ce qui a été vérifié

Inventaire de ce que l'interface met dans le DOM (lecture de `src/ui`, sans la modifier) :

- `data-testid` partout (dont `tab-<idÉtape>`, `nb-show-<idÉtape>`), `data-phase`, classes CSS : **jamais
  renvoyés** (aucun attribut n'est imprimé ; `data-phase` n'est lu que pour déduire « briefing / en cours /
  fin »).
- `aria-label` : génériques (« Carte de Meulebourg », « Vue rapprochée de cette personne » — `targetLabel`
  ne donne que la catégorie —, « Minicarte… », étoiles, difficulté). Les seuls noms propres sont les portraits
  du carnet (« Portrait de … »), qui ne contient que les personnages **déjà identifiés** ; ce sont des
  canevas, jamais lus (seuls les nœuds de texte et les libellés de boutons sont lus).
- Un seul texte réservé aux lecteurs d'écran : « (aiguille trouvée) » (`.sr-only`, bonus) : ignoré.
- `window.__haystack` n'existe qu'avec `?debug` : le démon ouvre la page sans, et **vérifie au démarrage**
  qu'il est absent (sinon il s'arrête avec un message d'erreur).
- Le texte renvoyé pour une désignation (« Désigner cette personne ? », « Bien vu ! », « Ce n'est pas ça… »,
  carte « Pas tout à fait… ») fait partie du jeu et est renvoyé tel quel.

`selftest.mjs` contrôle en continu qu'**aucune sortie de l'outil** ne contient : un identifiant d'entité ou de
personnage de l'enquête, un `data-testid`, `__haystack`, un texte d'indice, un commentaire de fausse piste, une
légende de reconstitution, le texte de réussite d'une étape **pas encore résolue**, l'épilogue avant l'écran
de fin, ni le nom d'un personnage dans le carnet avant la première trouvaille. Le détecteur est lui-même
contrôlé (il repère bien un identifiant, un indice, un texte de réussite, l'épilogue, un `data-testid`, et ne
signale pas le briefing ni la question).

## Le test de l'outil (`node tools/playtest/selftest.mjs`)

Il démarre c00 sous un nom de joueur unique (aucune collision avec une vraie partie) et vérifie :

- **A, l'outil** : démarrage ; capture PNG valide (412×915, non vide) ; `text` renvoie le briefing puis la
  question de l'étape 1 et la progression ; `buttons` ; `press` à libellé approximatif ; un tap sur la carte
  ouvre la feuille de confirmation (ou l'approche, sinon un second tap) ; `press Annuler` la referme ; erreurs
  d'usage claires (hors écran, non numérique, bouton inconnu avec liste, commande inconnue → code 2) ; carnet
  ouvert / refermé sans fuite ; une erreur volontaire (« Désigner » sur un endroit vide) renvoie « Ce n'est pas
  ça… » et `status` la compte ; `shot --grid`, `shot --crop` (315×315 pour 120×120 px à la densité 2,625),
  `wait`.
- **B, gestes** (code du démon exécuté sur une page de contrôle) : pincement ×1,5 → zoom ×1,50 ; pincement
  ×0,5 → ×0,50 ; double tap → ×2 ; glissé sans élan de (−200, −200) → la carte bouge de (200, 200) px.
- **C, un passage complet de c00 par l'outil** : pour chaque étape, `text` (question), `tap x y` (pixels
  calculés avec la connaissance des solutions), `press Désigner` → carte de réussite contenant le texte de
  l'étape, `status` (k sur 3), `press Continuer` ; `press "Conclure l'enquête"` → « Affaire classée », `status`
  « terminée », 3 étoiles (une erreur est tolérée), compteur de captures exact.
  *Comment savoir où taper sans voir la carte ?* Le test ouvre une seconde page « oracle » (`?debug`, dans son
  propre navigateur, jamais accessible par l'outil) qui **rejoue les mêmes gestes** : même téléphone, même
  caméra, donc mêmes coordonnées d'écran ; l'oracle calcule le point de visée (centre de la cible, ou point
  « sûr » voisin si une autre entité la masque, comme `tests/e2e/play.ts`). Si les deux pages divergeaient, la
  feuille « Désigner » n'apparaîtrait pas dans l'outil et le test échouerait. Le test s'adapte au contenu
  (nombre d'étapes, textes, positions lus dans l'oracle) : il a continué à passer pendant que d'autres agents
  retouchaient c00.
- **D, arrêt propre** : `stop` rend le bilan ; tous les processus (démon, Chromium et ses sous-processus,
  relevés avant l'arrêt) ont disparu (`ps`) ; `daemon.json` supprimé ; ports du jeu et de contrôle fermés ;
  `list` vide ; une commande après `stop` échoue clairement ; journaux conservés ; aucune erreur de page dans
  `daemon.log`.

Résultats : **2 exécutions complètes consécutives, 66 contrôles sur 66** chacune (plus des essais en cours de
développement), et un filet de sécurité final qui arrête toute partie restée ouverte.

### Temps par commande (durée totale du processus CLI, démarrage de Node compris, machine partagée)

| Commande | Moyenne | Remarque |
|---|---|---|
| `text`, `buttons`, `status` | 0,1 à 0,15 s | lecture du DOM |
| `shot` | 0,7 s | attente de stabilité + PNG 412×915 |
| `tap` | 0,6 à 0,9 s | geste + stabilisation de la carte + résumé |
| `press` | 0,75 s (1,4 s au plus) | idem, avec recherche du bouton |
| `dtap`, `drag`, `pinch` | 1,0 à 2,0 s | vol de zoom, glissé de 400 ms, pincement de 500 ms |
| `wait` | durée demandée + 0,7 s | |
| `start` | 3,7 à 4,8 s (Vite déjà « chaud ») | jusqu'à 90 s au tout premier lancement à froid |
| `stop` | 1,4 à 2,3 s | bilan + fermeture |

Moyenne des gestes (`tap`, `press`, `wait`) : ≈ 0,7 s ; de toutes les commandes hors `start`/`stop` : ≈ 0,5 s
(machine peu chargée). Quand d'autres agents saturent les 4 cœurs, ces temps peuvent doubler ; une exécution
a même vu une commande `text` mettre 40 s au total (démon : 3,7 s ; le reste est le démarrage de Node pendant
un blocage général de la machine) sans échec. Ressources : ≈ 800 Mo de mémoire et un cœur par partie ouverte
(Vite + Chromium) : ne pas dépasser 3 parties simultanées sur cette machine.

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Architecture | Démon détaché + client CLI sans dépendance lourde | Un navigateur ouvert coûte 3 à 4 s ; chaque commande doit répondre en < 1 s. Le CLI est un processus Node à part : les commandes se lancent depuis n'importe quel shell. |
| Isolation | Dossier, ports (jeu et contrôle), jeton et navigateur par partie ; `--player` pour séparer les joueurs d'une même enquête | Plusieurs joueurs en parallèle sans collision. |
| Port du jeu | `--port N` (strict) ou port libre : Vite traite `port: 0` comme « 5173 puis le suivant libre » | Les démons concurrents prennent 5173, 5174… sans conflit. |
| Cycle de vie | `stop`, inactivité (25 min, `PLAYTEST_IDLE_MS` pour les tests), signaux, navigateur fermé ou page plantée, exception du démon : le démon s'arrête toujours | « Un démon orphelin ne doit jamais survivre » ; vérifié par `ps` après `stop`, après inactivité (4 s en essai) et après un `kill -9` du démon (Chromium meurt avec lui : lien par tube). `stop --all` pour l'organisateur. |
| Une commande à la fois | File d'attente dans le démon, budget de 26 s par commande | Deux commandes simultanées d'un même joueur ne se marchent pas dessus ; le CLI abandonne à 30 s avec un message clair. |
| Résumé après geste | Texte court et ciblé (changements seulement) plutôt que `text` complet | Moins de tours de conversation pour le joueur, et les toasts éphémères ne sont pas perdus. |
| `status` | Nombres seulement, lus dans `localStorage` | Cahier des charges ; les identifiants `found` ne sortent jamais du navigateur. |
| Pas de modification de `src/ui` | Filtrage dans l'outil | Consigne ; de toute façon rien de révélateur n'a été trouvé. |

## Limites connues

- **Honneur** : l'outil ne peut pas empêcher un agent de lire `src/content/` ou `docs/CONTENT.md` sur le disque, ni
  d'interroger le serveur Vite du démon (son port est dans `daemon.json`). Il garantit seulement que **ses
  propres sorties** ne révèlent rien. Le README demande de ne rien lire d'autre ; pour un test rigoureux,
  l'organisateur peut en plus répéter cette consigne dans le message de mission du joueur.
- La carte (canevas) n'est lisible que par captures : aucun texte ne décrit le contenu de la carte, c'est voulu
  (les noms de quartier de la minicarte, dessinés dans un canevas, ne sont donc visibles que sur capture).
- `text` renvoie aussi le texte des zones défilantes (briefing, liste des dossiers) même si une partie est
  hors de la vue ; `buttons` ne liste que les boutons réellement visibles et touchables (pour atteindre les
  derniers dossiers, il faut faire défiler avec `drag`).
- Les captures à grande échelle (`--crop`) donnent des images de 2,6 fois la taille demandée (densité de
  l'écran) : l'outil Read de l'agent peut les réduire si elles dépassent ≈ 1500 px.
- La stabilisation de la carte se fait par échantillonnage d'une miniature du canevas : une animation
  ambiante continue qui changerait la miniature empêcherait de conclure plus tôt que 3,5 s (aucune n'existe
  aujourd'hui en cours d'enquête).
- Un rechargement complet de la page par Vite (nouvelle dépendance découverte pendant le jeu) ferait revenir
  le jeu sur l'enquête sans bouger la sauvegarde ; très improbable avec les dépendances préparées.
- Tout l'outil est écrit en JavaScript (`.mjs`), hors du périmètre de `tsc` (qui ne couvre pas `tools/`),
  comme `scripts/shot.mjs` et `scripts/perf-map.mjs`.

## Comment vérifier

```bash
node tools/playtest/selftest.mjs              # ≈ 50 s ; doit finir par « SELFTEST OK » (code de sortie 0)
node tools/playtest/blind.mjs start c01 --player moi --device small
node tools/playtest/blind.mjs shot --grid --case c01 --player moi     # puis lire le PNG affiché
node tools/playtest/blind.mjs text --case c01 --player moi
node tools/playtest/blind.mjs stop --all
npx tsc --noEmit && npx vitest run && npm run content:check && npm run build   # inchangés : OK
```
