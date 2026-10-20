# Phase 3 — correcteur 2 : périmètre MONDE

Périmètre : `src/world/people.ts`, `src/world/names.ts`, tests `src/world/**`.
Constats traités : `c04-q5-leurre-dessert` (tartes de la foule) et `c05-q2-bateau-sainte-paille` (nom des bateaux).
Aucun contrat touché (`src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts` inchangés).

## Appliqué

### `c04-q5-leurre-dessert` — plus aucune tarte dans la foule
Cause : la « dame au dessert » (c04, Q4/Q5/Q6) était un passant ambiant (`a.p.1605`, en (3168, 2226), pose `carry`,
110 u à l'est d'Octave) ; 22 passants de la ville portaient une tarte, ce qui supprimait à la tarte son rôle de signe distinctif.

Correctif dans `src/world/people.ts`, **sans toucher au flux pseudo-aléatoire** (même nombre de tirages, mêmes bornes) :
- `holdingFor` : l'entrée `['cake', 0.6]` du tirage pondéré devient `['baguette', 0.6]` (laissée à sa place, donc les seuils
  cumulés des autres objets ne bougent pas ; on ne fusionne pas avec l'entrée `baguette 2,5` pour la même raison) ;
- activité `carry` : `'box'` à 85 %, sinon `'baguette'` (au lieu de `'cake'`) ;
- groupes assis (pique-nique) : `rng.pick(['bottle', 'baguette', 'cake'])` devient `['bottle', 'baguette', 'bottle']`
  (liste de même taille : `pick` consomme le même tirage).
Des commentaires en français expliquent pourquoi les entrées sont dupliquées (ne pas « simplifier » sans re-vérifier l'instantané).

### `c05-q2-bateau-sainte-paille` — bateaux renommés
`src/world/names.ts`, `BOAT_NAMES` : `'SAINTE-PAILLE'` devient `'LA FANEUSE'` (même position dans la liste, même longueur :
l'indexation modulo et le mélange ne changent pas). Les deux bateaux concernés sont `a.v.223` (3713, 3740) et `a.v.29` (4719, 3950).
`LA FANEUSE` ne coïncide avec aucun nom ni enseigne de lieu remarquable (vérifié sur `LANDMARKS`).

## Écarté
- Variante « entité d'enquête `c04.mamie` » (alternative du vérificateur) : retire 6 voisins ambiants et ne règle pas le
  problème de fond (le signe distinctif de la tarte). Non retenue ; décision de l'orchestrateur : supprimer les tartes de la foule.
- Partie `c04.ts` de `c04-proposed.patch` : hors périmètre (agent c04). Seule la partie `people.ts` a été reprise.
- Template `tools/content/CONTENT.template.md` : **non modifié**. La phrase de la bible c04 « Trois personnes portent une tarte à
  l’écran (Octave à l’aube, Zita, Picotin) » était fausse avant le correctif (22 passants en portaient) ; elle est maintenant
  exacte (voir le test ci-dessous). Elle ne devient ni fausse ni inexacte, donc pas d'édition (et `content:doc` n'a pas été lancé).
  Précision utile : le livreur de c00 (`c00.livreur.1`) porte aussi une tarte, ailleurs sur la carte, hors de l'écran de c04.

## Instantané du monde, avant / après
Méthode : script `tsx` sur `buildWorld` qui sérialise **chaque entité telle quelle** (id, position, apparence, objet tenu, étiquette,
pose…) dans l'ordre de génération, pour le monde avec les 7 enquêtes (8 275 entités) et le monde de base sans enquête (8 291).
Fichiers (hors dépôt) : `scratchpad/world-before.json` (avant), `scratchpad/c2m/world-after.json` (après),
`scratchpad/c2m/snap.ts` et `scratchpad/c2m/cmp.ts` (scripts). L'instantané « avant » a été vérifié déterministe (deux
générations identiques octet pour octet).

Résultat du comparateur, identique pour les deux mondes :
- mêmes ids, **dans le même ordre** ; **0 position changée** ; **0 changement inattendu** (tout champ autre que `holding` pour
  les passants, ou `label` pour les deux bateaux) ;
- **22 passants changent d'objet tenu** (16 `cake -> baguette`, 6 `cake -> bottle`) ;
- **2 bateaux changent d'étiquette** (`SAINTE-PAILLE -> LA FANEUSE`) ;
- porteurs de tarte : avant 26 avec enquêtes (22 ambiants + 4 personnages), après **4** : `c04.octave.1`, `c04.zita.1`,
  `c04.picotin.2`, `c00.livreur.1` ; dans le monde de base, 22 -> 0 ; le seul accessoire « tarte » restant est `c00.tarte`.

Passants dont l'objet change (id, position, pose, changement) :

| id | position | pose | avant → après |
|---|---|---|---|
| a.p.795 | (6139, 643) | sit | cake → bottle |
| a.p.1291 | (2527, 659) | walk | cake → baguette |
| a.p.2002 | (3428, 906) | carry | cake → baguette |
| a.p.3057 | (1797, 1318) | walk | cake → baguette |
| a.p.619 | (6177, 1404) | sit | cake → bottle |
| a.p.1102 | (366, 1491) | carry | cake → baguette |
| a.p.1063 | (662, 1681) | carry | cake → baguette |
| a.p.922 | (5173, 1696) | sit | cake → bottle |
| a.p.587 | (5416, 1733) | sit | cake → bottle |
| a.p.821 | (6364, 1734) | sit | cake → bottle |
| a.p.1430 | (2643, 1824) | walk | cake → baguette |
| a.p.651 | (4478, 1868) | sit | cake → bottle |
| a.p.1659 | (2577, 2003) | carry | cake → baguette |
| a.p.1597 | (3258, 2108) | carry | cake → baguette |
| a.p.1605 | (3168, 2226) | carry | cake → baguette |
| a.p.2417 | (6228, 2545) | walk | cake → baguette |
| a.p.3156 | (1995, 2638) | walk | cake → baguette |
| a.p.3044 | (6290, 2720) | carry | cake → baguette |
| a.p.1780 | (195, 3359) | walk | cake → baguette |
| a.p.2676 | (5699, 4099) | carry | cake → baguette |
| a.p.2700 | (4323, 4471) | carry | cake → baguette |
| a.p.2698 | (5159, 4619) | carry | cake → baguette |

Bateaux dont l'étiquette change : `a.v.223` (3713, 3740) et `a.v.29` (4719, 3950), `SAINTE-PAILLE` → `LA FANEUSE`.

## Tests ajoutés (`src/world/world.test.ts`)
- `la tarte, signe distinctif des personnages d’enquête` (nouveau bloc, 3 tests) :
  1. ville de base : aucun passant ambiant ne tient de tarte, aucun accessoire `cake` ambiant ;
  2. enquête factice qui donne une tarte à un personnage : c'est le seul porteur de tarte du monde intégré (`['cx.suspect']`) ;
  3. vraie ville (`buildWorld({ cases: CASES })`, import de `../content`) : au moins un porteur (garde-fou contre un test vide),
     et tout porteur n'est pas un id `a.*` et porte l'étiquette `story` (= personnages d'enquête uniquement).
- `robustesse : autres graines` : `it.each([1, 2, 3])` « aucune tarte dans la foule » (la règle ne dépend pas de la graine).
- `véhicules, arbres, objets` : aucun bateau ne porte le nom ou l'enseigne d'un lieu remarquable (garde-fou général contre un
  nouveau cas « SAINTE-PAILLE »).
Contrôle de mutation : avec les anciens `people.ts` / `names.ts` (copie hors dépôt), ces 7 tests échouent (22 porteurs d'abord
listés, bateau « SAINTE-PAILLE » homonyme de « Hôpital Sainte-Paille ») ; avec le correctif, ils passent.

## Vérifications
| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | passe (aucune sortie) |
| `npx vitest run` | 16 fichiers, **311 tests passent** (dont 43 dans `src/world/world.test.ts`, 7 de plus qu'avant) |
| `npm run content:check` | `OK : aucun problème.` Les 6 notes anti-sosie sont **identiques** avant (anciens fichiers du monde, copie hors dépôt) et après : mêmes paires, mêmes écarts (les apparences n'ont pas changé, seuls des objets tenus ont changé, et la distance anti-sosie ne regarde que l'apparence) |
| `E2E_PORT=5190 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` | 1 test passé (1,4 min) : c00 à bonus-aiguilles résolues au doigt |
| Contrôle visuel (`scripts/shot.mjs`, 390×500, zoom 4) | `a.p.1605` tient bien une baguette en pose « carry » ; le bateau en (3713, 3740) affiche `LA FANEUSE` lisiblement (captures brouillons `.shots/c2m-dame-baguette.png` et `.shots/c2m-bateau-faneuse.png`) |

## Limites et à savoir
- Les captures de référence existantes qui montrent l'un de ces 22 passants ou l'un des deux bateaux sont désormais différentes
  (objet tenu / nom de coque) ; je n'ai pas vérifié si `docs/screenshots/` en contient.
- Les baguettes sont un peu plus fréquentes dans la foule (+16 passants en pose `carry`/`walk`) ; la baguette est déjà un objet
  ordinaire des Halles, aucune enquête ne s'y appuie comme signe distinctif.
- Le test « vraie ville » importe `../content` : il dépend donc des enquêtes publiées, mais seulement pour la règle générale
  (« aucun porteur ambiant »), pas pour des ids précis.
- Si l'on touche un jour à la liste de poids de `holdingFor`, au `rng.chance(0.85)` du cas `carry` ou au `rng.pick` des
  pique-niques, relancer l'instantané avant/après : toute modification de la **taille** des listes ou du nombre de tirages
  décalerait tout le flux aléatoire et donc tous les ids/positions suivants.
