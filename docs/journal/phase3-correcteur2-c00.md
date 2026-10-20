# Phase 3 — correcteur 2 : périmètre c00 (« La Tarte de bienvenue »)

Périmètre : `src/content/cases/c00.ts` (seul fichier de code modifié). Verdicts : `scratchpad/fix/c00.json` et
`scratchpad/fix/g-fil-rouge-et-fausses-pistes.json` (id `g-fil-rouge-confondu-avec-laisse-c00`).
Aucun contrat touché, aucun id, aucune position, aucune apparence modifiés ; aucune dépendance ajoutée.
Il ne s'agit que de textes (briefing, question, indice, fausse piste, réussites).

## Appliqué

| Constat | Champ de `c00.ts` | Texte |
|---|---|---|
| `c00-q2-short-rouge-invisible` | `s1.solved` | « …avec la tarte : tablier blanc, casquette rouge, cheveux bouclés. Il traversait le square vers l’ouest… et il n’en est jamais ressorti. » (le short, masqué par le tablier, n'est plus cité ; le plus rare, le tablier, passe en premier) |
| `c00-q2-ou-chercher-et-quel-moment` | `s1.solved` (« il n’en est jamais ressorti ») et `s2.question` (« dans le square ») | voir ci-dessous. L'astuce et la règle « maintenant = la plus tardive » ne sont pas touchées (le `nearMiss` gratuit de `c00.livreur.1` l'enseigne déjà). |
| `c00-q2-panneau-sans-signalement` | `s2.question` | « Où est le livreur (tablier blanc, casquette rouge) MAINTENANT, dans le square ? Astuce : un même personnage peut apparaître plusieurs fois sur la carte, à différents moments de son histoire. » |
| `c00-q3-gateau-intact-sans-creme` | `s3.question`, `s3.solved`, `nearMiss[c00.tarte]`, `hints[1]` | question : « Le livreur dort, la tarte traîne dans l’herbe. Qui va s’en régaler ? » ; résolution : « Croquette ! Le chien de la commissaire Fétu, planté devant la tarte, l’air trop innocent. Une coïncidence, disiez-vous ? Affaire classée. » ; fausse piste de la tarte : « La voilà, encore entière. Mais qui la lorgne ? » ; indice 2 : « Un gourmand à quatre pattes, le nez sur la tarte… » (le sol du square est bien `park` à (1575, 1946) : « dans l’herbe » est exact) |
| `c00-q3-croquette-non-decrit` | `intro` | « …Mon chien blanc, Croquette, a lui aussi disparu ce matin : je suppose que c’est une coïncidence. » |
| `g-fil-rouge-confondu-avec-laisse-c00` | `s2.solved` | « Le livreur dort à poings fermés sur un banc. Et ses bras sont vides : plus de tarte ! Le fil rouge relie vos trouvailles, dans l’ordre de l’histoire. » (la phrase s'affiche au moment où le fil apparaît derrière la carte ; le fil n'est pas recoloré, décision de l'orchestrateur) |

### Adaptation unique par rapport aux textes des vérificateurs
Résolution de s3 : « l’air **bien** trop innocent » devient « l’air trop innocent ». Raison : la consigne demande ≤ 3 lignes dans le
panneau ; avec « bien trop », la carte tenait sur 4 lignes à 390 px (3 avant correction) ; sans « bien », elle tient sur 3 lignes à 390
et 412 px (4 à 360 px, 3 avant). Le sens et la voix sont conservés. Tous les autres textes sont repris tels quels.

### Pas de spoiler
- La question de s3 ne nomme ni le chien ni Croquette ; « traîne dans l’herbe » reprend ce qui est à l'écran.
- La fausse piste de la tarte (« Mais qui la lorgne ? ») oriente sans nommer la réponse ; l'indice 2 (palier payant) reste le premier
  texte qui parle d'« un gourmand à quatre pattes ».
- La question de s2 dit « dans le square » (lieu déjà connu par Picotin) et rappelle le signalement, mais ne dit pas laquelle des
  deux apparitions est la bonne : c'est « MAINTENANT » + la fausse piste gratuite qui départagent.
- Le critère de la question de s2 (« tablier blanc, casquette rouge ») est un sous-ensemble de celui du témoignage de Picotin.

## Écarté / non traité
- `c00-q2-faux-dormeur-gare` : aucun changement prévu (le « dans le square » de la question de s2 écarte déjà le candidat) ; monde et
  art intouchés.
- `c00-q2-genre-livreur` : aucun changement prévu (toucher à `hair` ou `build` déplacerait le tirage anti-sosie du monde).
- `c00-outil-check-bas-masque-par-tablier` : périmètre OUTILS (`tools/content/check.ts`). Côté c00, plus aucun texte ne cite le short
  du livreur, donc la future règle ne produira pas de faux positif sur c00.
- Compléments facultatifs du verdict fil rouge : laisse recolorée (`src/art/held.ts`, change toutes les laisses) non faite (hors
  périmètre, choix visuel) ; texte de l'étape 2 de « Comment jouer » = périmètre UI-1 (`n-howto-fil-rouge-non-explique`).

## Vérifications

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | passe (aucune sortie) |
| `npx vitest run` | 17 fichiers, 328 tests passent |
| `npm run content:check` | `OK : aucun problème.` (aucune note c00) |
| `E2E_PORT=5191 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` | 1 test passé (1,4 min) ; c00 résolue au doigt avec 3 étoiles, puis c01 à bonus-aiguilles |
| `E2E_PORT=5191 npx playwright test tests/e2e/02-tutoriel.spec.ts` | 1 test passé (tutoriel c00, fil rouge posé, 3 étoiles, relu après rechargement) |

### Contrôle en jeu réel (script Playwright hors dépôt, Pixel 7 émulé, `?debug&case=c00`)
Script : `scratchpad/c00/verify.mjs` (serveur Vite propre, vrais taps, vrai panneau). Captures brouillons dans
`.shots/c00-correcteur2/` (`<largeur>x<hauteur>-0N-….png`, plus `baseline/` = anciens textes injectés à l'exécution pour comparer, et
`report.json`). Nombre de lignes mesuré dans le DOM (390×844 / 412×915 / 360×740), avant → après :

| Texte | avant | après |
|---|---|---|
| briefing, paragraphe du chien | 6 / 6 / 7 | 6 / 6 / 7 (la fiche ne défile pas) |
| carte « Bien vu ! » de s1 (citation de Picotin) | 5 / 4 / 5 | 5 / 5 / 6 |
| question de s2 | 4 / 4 / 4 | 5 / 5 / 5 |
| carte « Excellent ! » de s2 (avec le fil rouge) | 2 / 2 / 3 | 3 / 3 / 4 |
| question de s3 | 2 / 2 / 2 | 2 / 2 / 2 |
| fausse piste de la tarte | 2 / 2 / 2 | 1 / 1 / 2 |
| indice 2 de s3 | 2 / 2 / 2 | 2 / 1 / 2 |
| carte « Affaire résolue ! » de s3 | 3 / 3 / 3 | 3 / 3 / 4 |

Aucun texte ne défile (`scrollHeight <= clientHeight`), aucune erreur console. Cibles et panneau (question de s2, la plus haute) :
à 390×844 le panneau commence à y = 597 et les deux apparitions du livreur sont à y ≈ 296 et 302 ; à 412×915 : 668 contre 331 et 337 ;
à 360×740 : 493 contre 244 et 250. Rien n'est masqué ; en s3 (panneau à 667 / 738 / 563), Croquette et la tarte sont à y ≈ 387–393 /
422–429 / 335–341. Captures regardées : question de s2 et de s3, cartes de réussite, indices, à 360 et 390 px.

## Limites
- Le critère « ≤ 3 lignes » n'est pas atteignable partout : la question de s2 doit porter le signalement + « dans le square » + l'astuce
  (4 lignes avant, 5 après, comme le prévoyait le vérificateur, sans objet masqué ni défilement ; le panneau se replie) ; la citation
  de Picotin (carte de s1) faisait déjà 4–5 lignes (5–6 maintenant) ; la carte de s2 passe à 4 lignes à 360 px (3 avant) parce qu'elle
  explique le fil rouge ; la carte de fin de s3 passe à 4 lignes à 360 px (3 avant). Dans tous ces cas les cibles restent visibles
  au-dessus de la carte.
- « cheveux bouclés » (témoignage de s1) : la bible (§ 1.4) range « cheveux sous un chapeau » parmi ce qui se voit mal. Ici les boucles
  noires dépassent nettement de la casquette (vérifié sur les captures au zoom de jeu) et le texte de s2 n'en dépend pas : retirer ces
  deux mots ramènerait la carte de s1 au nombre de lignes d'avant si on préfère s'en tenir à deux critères.
- Sur 360 px de large, la fausse piste de la tarte est sur 2 lignes (avant aussi).
- **`docs/CONTENT.md` n'est pas régénéré** (`npm run content:doc` fait par l'intégration). **`tools/content/CONTENT.template.md`**
  (périmètre bonus/outils, non modifié par moi) contient une phrase devenue inexacte pour c00 : tableau « Ce que le tutoriel enseigne », ligne s3
  (« le chien blanc a la tarte sous le museau »), à remplacer par exemple par « le chien blanc se tient devant la tarte entière ».
  Le § « La vérité » (« …flaire les fraises et mange la tarte », ce qui se passe après la scène), la légende de la reconstitution
  et l'épilogue restent justes.
- Le fil rouge de c00 ressemble toujours à la laisse du promeneur voisin (même rouge) : traité par le texte seulement, comme décidé.

## Second passage de contrôle (état du dépôt au commit 356f00f)
Le périmètre c00 était déjà appliqué et committé (`src/content/cases/c00.ts` identique au commit ; aucun nouveau changement de code
nécessaire). Chaque texte a été recomparé au `newText` des verdicts : identique, sauf l'adaptation unique de s3.solved (« bien trop » →
« trop », voir plus haut). Contrôles relancés à froid :

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | passe |
| `npx vitest run` | 17 fichiers, 329 tests passent |
| `npm run content:check` | `OK : aucun problème.` |
| `scratchpad/c00/verify.mjs` (panneau réel, 390×844, 412×915, 360×740) | mêmes mesures de lignes que le tableau ci-dessus, aucun défilement, aucune erreur console |
| `E2E_PORT=5191 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` | 1 test passé (1,5 min), c00 résolue en 6 s |
| `E2E_PORT=5191 npx playwright test tests/e2e/02-tutoriel.spec.ts` | 1 échec isolé pendant qu'un autre agent éditait `src/ui/*` (pastille, styles), puis 3 passages verts consécutifs ; non lié aux textes de c00 |

## Troisième passage de contrôle (état du dépôt au commit d57a900, arbre propre)
`src/content/cases/c00.ts` est identique au commit : aucun changement de code. Les six constats appliqués et l'adaptation unique de
`s3.solved` (« bien trop » → « trop », 4 lignes → 3 à 390 et 412 px) sont inchangés. `docs/CONTENT.md` et le gabarit
`tools/content/CONTENT.template.md` ont été alignés par l'intégration (commit d57a900) : plus rien à faire de ce côté pour c00.
Contrôles relancés, aucun autre agent n'éditant le dépôt :

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | passe |
| `npx vitest run` | 17 fichiers, 362 tests passent |
| `npm run content:check` | `OK : aucun problème.` (7 notes de sosies déclarés, aucune sur c00) |
| `scratchpad/c00/verify.mjs` (panneau réel, 390×844 / 412×915 / 360×740) | mêmes mesures qu'au premier passage : question de s2 5 / 5 / 5 lignes, carte de s2 3 / 3 / 4, question de s3 2 / 2 / 2, résolution de s3 3 / 3 / 4, fausse piste de la tarte 1 / 1 / 2 ; aucun défilement, aucune erreur console ; panneau de s2 à y = 597 / 668 / 493 contre les cibles à y ≈ 296–302 / 331–337 / 244–250 (rien de masqué) |
| `E2E_PORT=5191 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` | 1 test passé (1,5 min) ; c00 résolue en 6,9 s, 3 étoiles, puis c01 à bonus-aiguilles |
| `E2E_PORT=5191 npx playwright test tests/e2e/02-tutoriel.spec.ts` | 1 test passé (14 s) |
