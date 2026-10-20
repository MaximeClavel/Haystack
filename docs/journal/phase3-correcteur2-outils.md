# Phase 3 — correcteur 2 — périmètre OUTILS

Périmètre : `tools/playtest/**` et `tools/content/**` (sauf `tools/content/CONTENT.template.md`). Aucun fichier du jeu
(`src/`), aucun contrat, aucune dépendance npm. Sources : `scratchpad/fix/DECISIONS.md`, `g-outil-de-test.json`, `c00.json`.

## Appliqué

| Id | Changement |
|---|---|
| `g-outil-status-sans-incidents-c00` / `-c05` | `status` affiche **toujours** « Incidents techniques de la page : N » (dernière ligne, donc les lignes lues par le selftest ne bougent pas) ; « … : 0 » quand il n'y en a aucun. Documenté dans `README.md` et l'aide de `blind.mjs`. |
| `outil-incidents-comptes-en-double` | Dans `daemon.mjs`, le message console « Failed to load resource… » (qui double une requête échouée ou une réponse HTTP ≥ 400, déjà comptées par `requestfailed` / `response`) est noté au journal (`[page:ressource] … (déjà comptée par la requête)`) mais n'est plus recompté. |
| `g-outil-crop-petit-c00` | `shot --crop` : capture à la densité de l'écran, puis agrandissement **entier** (facteur k) pour que le plus petit côté fasse au moins 480 px, lissé (canevas `imageSmoothingQuality = 'high'`), dans une **page vierge** `about:blank` ouverte puis refermée (aucun accès au jeu : anti-triche intact). Plafond de 1800 px sur le grand côté (zones très allongées : facteur réduit). Message exact : « zone agrandie (150, 300) 70×70 px d'écran → image de 560×560 px (agrandie ×4 ; les détails réels sont ceux de l'écran, l'agrandissement est lissé) ». Zone ramenée aux bords de l'écran : signalé dans le message. Zone déjà assez grande (≥ 480) : « … pas d'agrandissement ». README et aide à jour (au moins 100×100 px pour un personnage). |
| `outil-press-libelles-identiques` | `press <libellé> --nth N` : N-ième bouton de haut en bas (puis de gauche à droite) parmi les candidats ; `nth` ajouté à `VALUE_FLAGS` (`common.mjs`). Sans `--nth`, plusieurs candidats = erreur qui donne le centre de chacun et la commande à taper : libellés identiques → « « Voir » existe 3 fois, de haut en bas : (330, 400), (330, 520), (330, 640). Choisissez avec `press Voir --nth 2`, ou touchez-le avec `tap x y`. » ; libellés différents (cas réel du carnet : le texte affiché est « Voir » mais le nom accessible est « Voir la réponse de la question N ») → liste des noms complets avec leur centre. `--nth` hors limites → « n'existe que 2 fois (--nth 3 demandé) ». La réponse de `press` rappelle « (n° 2 de haut en bas) ». `commands.jsonl` note désormais aussi les options de la commande (hors `--case` / `--player`). |
| `c00-outil-check-bas-masque-par-tablier` | Voir ci-dessous. |

### Contrôle « bas masqué » (`tools/content/hidden.ts`, `check.ts`, `gen.ts`)

Règle mesurée sur le dessin (`src/art/person.ts` : `garmentKinds`, `legsFill`, `topOverlayShape` ; `skeleton.ts`), puis vérifiée par
des captures zoom ×7 de c00.livreur, c01.rose, c01.spectateur.1, c02.barbarie, c02.baronne, c02.bigarade, c02.lulu, c04.zita, c05.petronille :

| Haut \ bas | short | jupe | pantalon |
|---|---|---|---|
| tablier | caché (liseré de quelques px) | bord visible | bas des jambes visible |
| manteau | caché | **caché** (jambes nues) | bas des jambes visible (chevilles) |
| robe | caché | bord (jupon) visible | bas des jambes visible |
| salopette (et tous les autres hauts) | visible | visible | visible |

- **Salopette : pas de règle.** Le verdict la rangeait avec le tablier, mais sa pièce de dessin (`topOverlayShape`) n'est qu'une bavette sur le buste :
  le short orange de c02.lulu se voit en entier (capture). La consigne de l'orchestrateur ne cite d'ailleurs que tablier, manteau, robe.
- **Alerte** : un texte (briefing, épilogue, légendes de reconstitution, question, résolution, indices, fausses pistes) qui cite
  `short|bermuda|pantalon|jean|jupe` suivi d'une couleur (« short rouge », « pantalon NOIR », « jupe verte », « pantalon bleu marine »…) que portent des
  personnages de l'enquête (personnages + figurants) **uniquement cachés**.
  - bas **entièrement** caché (short sous tablier/manteau/robe, jupe sous manteau) → **erreur** (`problems`, `content:check` échoue) ;
  - bas **en partie** caché (pantalon sous tablier/manteau/robe, jupe sous tablier/robe) → **note**.
- **Garde-fous contre les faux positifs** : (1) si un autre personnage de l'enquête porte ce même bas **à découvert**, la citation peut le désigner : pas d'alerte ;
  (2) si la phrase reconnaît elle-même que le bas est caché (« dépasse », « chevilles », « caché », « masqué », « sous le manteau »…), pas d'alerte (c'est le cas de la
  réussite de c05 s3 : « pantalon orange qui dépasse du long manteau vert »).
- `selfTest()` (15 cas d'école) est exécuté à chaque `content:check` : une règle cassée en silence ne signalerait plus rien ; un échec devient une erreur.
- `gen.ts` : dans « Signes distinctifs », le trait « bas » est annoté, par exemple « bas rouge (2,8 % — masqué par le tablier, à ne pas citer) » ou
  « bas orange (0,7 % — en partie masqué par le manteau, signe peu fiable : dire où il se voit) ». **`docs/CONTENT.md` n'a pas été régénéré** (consigne) ;
  la sortie de `gen.ts` a été vérifiée dans un fichier hors dépôt (copie de travail qui écrit dans le dossier de travail de la session, supprimée ensuite).

## Écarté

- `g-couverture-non-testee` : aucun défaut (verdict : « rien à corriger dans le jeu »). Les e2e optionnels proposés (`tests/e2e/03…`, `07…`) ne sont pas dans mon périmètre
  (UI-1). Le « Voir » du carnet est en revanche désormais couvert par le selftest de l'outil (voir plus bas).
- `bonus-indice3-revele-les-dix-aiguilles` : règle de jeu (`src/game/session.ts`), décision de l'orchestrateur « garder, documenter » : hors périmètre.

## Vérifications

| Commande | Résultat |
|---|---|
| `node tools/playtest/selftest.mjs` | **SELFTEST OK**, 84 contrôles, ≈ 55 s ; `node tools/playtest/blind.mjs list` → « Aucune partie en cours. », aucun processus `daemon.mjs`. |
| `npx tsc --noEmit` | 0 erreur. |
| `npx tsc -p tools/content/tsconfig.json` | 0 erreur (les outils de contenu ont leur propre tsconfig). |
| `npx vitest run` | 17 fichiers, 362 tests verts. |
| `npm run content:check` | « OK : aucun problème. » — **aucune nouvelle note** du fait de la règle sur les enquêtes actuelles (état du dépôt au moment de la vérification, textes c00/c05 des correcteurs déjà passés). |
| Preuve que la règle déclenche (copie temporaire de `check.ts` qui injecte des textes en mémoire, supprimée ensuite) | « tablier blanc, casquette, short rouge » (c00 s1 résolution) → **erreur** ; « une dame en jupe verte » (c04) → **erreur** ; « Pantalon jaune de la capitaine » (c02, manteau) → **note** ; « Son pantalon noir dépasse sous le tablier » → rien. |
| Contrôles manuels de l'outil (partie `small` 390×844) | `status` sans incident → « … : 0 » ; `shot --crop 150,300,70,70` → PNG 560×560 et message exact ; `--crop 100,300,300,300 --grid` → zone ramenée à 290×300 signalée, 580×600 sans agrandissement ; `press Indice --nth 2` → « n'existe que 1 fois » ; `--nth abc` / `--nth 0` → message d'usage ; `press Minicarte --nth 1` → touche le bouton. |
| `selftest.mjs` (nouveaux contrôles) | `status` début/fin « Incidents … : 0 » ; `--crop 120×120` → 630×630 (×2, Pixel 7), `--crop 20×20 --grid` → 530×530, `--crop` plein écran non agrandi ; `cropFactor` ; `findButton` (rang, messages, guillemets) sur des interfaces fictives ; carnet à 2 réponses → « press Voir » refusé avec positions, `--nth 3` refusé ; carnet de fin d'enquête → `press Voir --nth 2` touche exactement le 2ᵉ « Voir » (même centre que dans `buttons`) ; `daemon.log` sans `[page:error|exception|ressource|HTTP|requête échouée]`. |

## Limites

- Le facteur d'agrandissement est entier : l'image dépasse donc souvent 480 px (jusqu'à presque le double). Les zones très allongées (grand côté × k > 1800 px) gardent un petit côté inférieur à 480 px. Un lecteur d'images qui réduit les grandes images annule le gain au-delà d'environ 1500 px.
- Le message console « Failed to load resource » est reconnu par son texte anglais (celui du navigateur d'essai). Sans la requête correspondante (`requestfailed` ou HTTP ≥ 400), une telle erreur ne serait plus comptée : cas jamais observé.
- La règle du bas masqué repose sur des mots-clés français (short, bermuda, pantalon, jean, jupe + couleur). « un bas rouge », « tout en rouge », une couleur placée avant le mot ou une description plus longue (« pantalon à rayures bleues ») ne sont pas vues. Elle ne rattache pas un texte à un personnage précis : elle regarde tous les personnages de l'enquête (voir garde-fous).
- `docs/CONTENT.md` doit être régénéré à l'intégration (`npm run content:doc`) pour afficher les annotations « masqué » ; le gabarit (`tools/content/CONTENT.template.md`, hors périmètre) pourrait ajouter une ligne à la liste des règles vérifiées par `content:check` (« la couleur d'un bas caché par un tablier, un manteau ou une robe ne se cite pas ») et expliquer l'annotation de « Signes distinctifs ».
