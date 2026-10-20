# Phase 3 — correcteur 3 : périmètre A (textes d’enquêtes et contrôle de contenu)

Périmètre : `src/content/cases/c01.ts`, `c04.ts`, `c05.ts`, `tools/content/check.ts`, `tools/content/hidden.ts` (et son autotest).
Source : défauts prouvés par les deux relectures indépendantes (code et textes). Aucun contrat touché, aucun id, aucune position, aucune
apparence modifiés ; aucune dépendance ajoutée. `docs/CONTENT.md` n’est pas régénéré ici (`npm run content:doc` : à l’intégration, trois
textes ont changé). `CONTENT.template.md` est intact : aucun des textes modifiés n’y figure.

## Appliqué

| # | Où | Avant | Après |
|---|---|---|---|
| 1 | c04, `s5.nearMiss[c04.picotin.2]` | « Picotin n’a rien à voir avec ce que le bijoutier a confié : il n’était même pas là. » (faux : la tarte finit chez Picotin) | « Ce n’est pas à Picotin que le bijoutier a confié la tarte : il n’était même pas là. » |
| 2 | c05, `s5.hints[0]` | « Il n’est pas allé bien loin : il est resté sur le parvis du théâtre. » (redit la question « n’a pas bougé ») | « Il est resté sur le parvis, à quelques pas de Bérénice : cherchez un costume rouge. » |
| 3 | c01, `s3.hints[0]` | « Il a traversé la rue des Étals, celle qui longe le marché. » (redit « à l’est du marché » et la réussite de l’étape 2) | « Cherchez le sac d’argent : il dépasse de quelque chose de vert, sur le trottoir est de la rue des Étals. » |
| 4 | `tools/content/check.ts` + `hidden.ts` | cibles d’une étape jugées sur `e.appearance` (apparence de l’entité) | jugées sur l’apparence que le monde dessine : celle du personnage quand l’entité a un `character` |

### 1. c04 étape 5, fausse piste de Picotin
- Vrai : Octave confie la tarte à Zita (étape 5), Zita l’offre ensuite à Picotin (étape 6). « Il n’était même pas là » reste vrai :
  Picotin est à l’Hôtel de Ville (2722, 1802), la remise a lieu à la terrasse du Café du Centre (3214, 1792).
- Sans spoiler : ne dit pas que Picotin finit avec la tarte.
- L’autre fausse piste de Picotin (étape 4, « Picotin ? À l’aube, il dormait encore. ») est compatible : à l’aube il dormait, plus tard il
  n’était pas au café. Les deux cartes ont été lues en jeu (390×844, 412×915, 360×740) : « Pas tout à fait… » + une phrase, 2 lignes,
  aucune erreur comptée, aucun défilement.

### 2. c05 étape 5, indice 1
- Information nouvelle : la proximité de la victime et le **costume rouge** (Gontran : `suit` rouge, vérifié sur capture au zoom de jeu :
  costume rouge, haut-de-forme, parapluie, pantalon orange, journal en main).
- **Écart avec la proposition du relecteur** : je n’ai pas repris « et un haut-de-forme ». Le haut-de-forme est l’un des trois critères
  de l’étape 6 (haut-de-forme, parapluie, pantalon orange) et Pétronille en porte un aussi : le citer ici mélangerait les deux étapes
  pour un gain de repérage faible (le chapeau se voit de toute façon). Le costume rouge n’est ni un critère de l’étape 6 ni porté par
  Pétronille (manteau vert) ou Hector (costume bleu).
- « costume rouge » : même formule que l’indice de c04 (« costume violet ») et que la fausse piste de l’armateur en c05 s7.
- L’indice 2 reste le palier suivant : « À l’est du parvis, un monsieur lit son journal… » avec la zone. Aucun mot de bas (pas de
  citation de pantalon : la règle du bas masqué n’a rien à dire).
- Longueur : 2 lignes à 390, 412 et 360 px (mesure sur `.hint-text`, 20 px de hauteur de ligne).

### 3. c01 étape 3, indice 1
- Information nouvelle, sans nommer la poubelle : (a) ce qu’on cherche, le **sac d’argent** (la question dit « la caisse », le joueur
  a vu un sac d’argent à l’étape 2) ; (b) la nature de la cachette : le sac **dépasse** de quelque chose, de **vert** (la poubelle
  `c01.poubelle` est verte, il y en a une grise un peu plus au nord, `a.o.1802`, qui n’est pas la bonne) ; (c) le côté : le **trottoir
  est** de la rue des Étals (rue : rect x 3200 à 3256, asphalte visible environ x 3210 à 3246 ; poubelle en x 3250, donc sur le trottoir
  est, du côté opposé au marché, qui s’arrête à x 3200).
- L’indice 2 garde la zone (« au coin de la rue des Étals et de la rue du Cinéma », cercle inchangé) : palier suivant.
- La proposition du relecteur (« un objet de la rue où l’on peut glisser un sac ») était trop vague (« glisser un sac » ne décrit pas une
  poubelle à l’écran) et ne donnait aucun signe visible ; la mienne s’appuie sur ce qu’on voit (capture au zoom 3 : le sac « € » dépasse
  d’une poubelle verte).
- Longueur : 3 lignes à 390, 412 et 360 px (limite atteinte à 360 : à ne pas allonger).

### 4. `check.ts` : apparence de l’entité contre celle du personnage
- Défaut : `check.ts` jugeait les cibles d’une étape (et de chaque fausse piste) sur `e.appearance`, alors que le monde remplace cette
  apparence par celle du personnage (`src/world/story.ts`, `integrateCases`) et que la liste `people` utilisait déjà les personnages.
  Aucun validateur n’impose l’égalité des deux ; aujourd’hui 0 divergence sur les 98 entités, donc rien ne cassait : défaut latent.
- Correctif au plus petit, dans `tools/content/hidden.ts` (module pur) : trois fonctions que `check.ts` appelle au lieu de ses deux
  fermetures locales :
  - `drawnAppearance(c, e)` : apparence du personnage si l’entité a un `character` connu, sinon celle de l’entité (comme le monde) ;
  - `casePeople(c)` : les personnages puis les figurants (ce que faisait `people`) ;
  - `entityPeople(c, ids)` : les personnes désignées par des ids d’entités, avec l’apparence dessinée (ce que faisait `aboutIds`).
- Autotest (dans `selfTest()`, exécuté à chaque `content:check`) : une enquête fictive où l’entité et le personnage divergent, dans
  les deux sens (entité en t-shirt / personnage en manteau : alerte attendue ; entité en manteau / personnage en t-shirt : aucune alerte), plus
  quatre cas annexes (entité sans personnage, personnage inconnu, accessoire ou id inconnu, ordre et apparence de `casePeople`).
- **Mutation** : en remettant `return e.appearance;` dans `drawnAppearance`, `npm run content:check` échoue avec 3 problèmes
  (« cible : l’apparence est celle du personnage (manteau)… obtenu [], attendu ["pantalon orange:partial"] », « l’entité cache le bas, le
  personnage le montre… obtenu ["pantalon orange:partial"], attendu [] », « le personnage est ce que dessine le monde… obtenu ["tshirt"],
  attendu ["coat"] »). Fichier restauré, retour à « OK : aucun problème ».

## Écarté

- Point 5 de la mission (test faible de `src/ui/format.test.ts`) : périmètre B, non touché.
- Les points hors de ma liste dans `review-code.json` (apostrophes droites des noms de rues, `fr(toast.text)`, ordre du DOM des boutons
  d’indice, aria-label, largeur 320 px, contraste du bouton Indice) sont du périmètre B ou de l’interface : non touchés.
- `docs/CONTENT.md` : texte de l’étape et des fausses pistes périmé tant que `npm run content:doc` n’est pas relancé (intégration).
  Les journaux de la phase précédente citent les anciens textes : conservés tels quels (ils décrivent l’état d’alors).
- Suggestion non appliquée (hors périmètre, le gabarit n’est modifiable que pour un texte cité) : une phrase dans
  `CONTENT.template.md` § règle du bas caché (« l’apparence jugée est celle que le monde dessine : celle du personnage quand
  l’entité en a un ») pourrait documenter la règle.

## Vérifications chiffrées

- `npm run typecheck` : OK ; `npx tsc -p tools/content/tsconfig.json` : OK (une erreur transitoire de `src/ui/screens/investigation/texts.test.ts`,
  fichier de l’autre correcteur, vue au premier passage, disparue au suivant sans que je le touche).
- `npx vitest run` : 17 fichiers, 367 tests verts.
- `npm run content:check` : « OK : aucun problème. » avec les mêmes 9 notes qu’avant (aucune nouvelle ; les deux notes « pantalon orange » de
  c05 sont les notes `partial` connues). Avec la mutation de l’autotest : 3 problèmes (ci-dessus).
- Jeu réel (Playwright tactile, sauvegarde préparée pour ouvrir l’étape voulue ; scripts dans le répertoire de session, hors dépôt) :
  indice 1 de c01 s3, c04 s5 et c05 s5 ouvert par un tap sur « Indice » puis « Oui » ; nombre de lignes de `.hint-text` mesuré :
  c01 3 / 3 / 3, c05 2 / 2 / 2 (à 390×844 / 412×915 / 360×740) ; carte « Pas tout à fait… » de Picotin tapé en c04 s5 et s4 aux trois
  tailles : 2 lignes, lisible. Aucune erreur console. Espace insécable présent avant « : » dans les indices rendus (U+00A0).
  Captures lues : c01 360×740 (indice 3 lignes, au-dessus des boutons), c05 390×844, c04 s5 360×740 ; poubelle de c01 au zoom 3 et
  Gontran de c05 au zoom 4 (capture `scripts/shot.mjs`).
- `E2E_PORT=5301 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` : 1 test vert (1,5 min), les sept enquêtes résolues
  au doigt, trois étoiles chacune.

## Limites

- L’indice 1 de c01 s3 est à la limite des trois lignes à 360 px : toute rallonge le ferait passer à quatre.
- La couleur « vert » de l’indice 1 de c01 s3 suppose que le joueur distingue la poubelle verte de la grise voisine ; c’est précisément
  son intérêt, mais un joueur daltonien s’appuiera sur « dépasse » et le trottoir est (l’indice 2 donne la zone).
- `drawnAppearance` cherche le personnage dans l’enquête de l’entité, alors que le monde (et `validateAllCases`, qui n’exige que
  l’existence du personnage quelque part) cherche dans toutes les enquêtes : sans effet aujourd’hui (mesuré : 50 entités à `character`,
  0 qui désigne un personnage d’une autre enquête), et la liste `people` d’origine avait déjà cette portée.

## Comment vérifier

```
npm run typecheck && npx tsc -p tools/content/tsconfig.json
npx vitest run
npm run content:check            # « OK : aucun problème. »
E2E_PORT=5301 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts
```
Mutation de l’autotest : dans `tools/content/hidden.ts`, remplacer `return ch ? ch.appearance : e.appearance;` par `return e.appearance;`
puis relancer `npm run content:check` : trois problèmes « autotest du bas masqué : cible : … ».
