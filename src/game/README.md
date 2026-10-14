# Module `game` — règles du jeu

Logique d'une partie : désignation au doigt, étapes d'une enquête, réponses, fausses pistes, indices
progressifs, fils rouges, étoiles, punaises et notes, sauvegarde, validation du contenu.
Module **pur** : aucun accès au DOM (le stockage est injecté, l'horloge aussi), testable sous Node.

```ts
import { CaseSession, createSaveStore, isUnlocked, pickAt, withCaseProgress } from '../game';

const store = createSaveStore();                       // localStorage, repli en mémoire
let save = store.load();
const session = new CaseSession(def, world, save.cases[def.id]);   // reprise éventuelle

// Tap du joueur (zoom ≥ PICK_MIN_ZOOM, sinon l'interface rapproche la caméra) :
const pick = pickAt(world, worldPoint, map.getCamera().zoom);      // { point, entityId | null }
const out = session.submit(stepId, pick);   // 'correct' | 'near' | 'already' | 'wrong'
save = withCaseProgress(save, session.progress());
store.save(save);
```

## API (`src/game/index.ts`)

| Export | Rôle |
|---|---|
| `pickAt(world, point, zoom): Pick` | Entité sous le doigt (règles ci-dessous) ; `entityId: null` si rien. |
| `pickTolerance(zoom)` | `PICK_TOLERANCE_PX / zoom` (unités monde). |
| `new CaseSession(def, world, progress?, { now? })` | Partie d'une enquête (voir ci-dessous). `now` : horloge injectable (défaut `Date.now`). |
| `entityCenter(world, id): Vec2` | Centre du rectangle de désignation d'une entité, centroïde d'une zone ; **erreur** si l'id est inconnu. |
| `targetCenter`, `targetRect`, `targetExists` | Variantes tolérantes (renvoient `undefined` / `false`). |
| `createSaveStore(storage?, key?)` | `{ load(), save(data), reset(), isPersistent() }`. `storage` : défaut `localStorage` ; `null` = mémoire seule. |
| `defaultSave()`, `DEFAULT_SETTINGS` | Partie vierge (objets neufs à chaque appel). |
| `isUnlocked(def, save)` | Toutes les enquêtes de `unlockAfter` sont résolues. |
| `withCaseProgress(save, progress)` | Copie de la sauvegarde avec la progression d'une enquête remplacée. |
| `sanitizeSave(raw)`, `sanitizeCaseProgress(raw, id)` | Nettoyage d'un JSON lu du stockage (`null` si inexploitable). |
| `validateCase(def, world): string[]` | Problèmes d'une enquête (messages en français, préfixés `[<id>]`). |
| `validateAllCases(cases, world): string[]` | Toutes les enquêtes + contrôles croisés. |
| `computeStars`, `requiredOf`, `stepDependencies`, `matchTargets`, `newCaseProgress` | Briques pures utilisées par la session (exportées pour l'interface et les tests). |
| Constantes | `AUTO_HINT_RADIUS` (220), `REVEAL_MARGIN` (12), `MIN_REVEAL_RADIUS` (28), `REVEAL_TEXT`, `MAX_HINT_LEVEL` (3), `MAX_PINS` (30), `MAX_NOTES_LENGTH` (4000), `STAR_RULES`. |

## Désignation (`pick.ts`)

Candidats : `world.index.query` autour du point, élargi de la tolérance `t = PICK_TOLERANCE_PX / zoom`.

1. On préfère une entité dont `getHitRect` contient **exactement** le point ; sinon une entité dont
   ce rectangle élargi de `t` le contient.
2. En cas d'égalité : la plus **en avant** dans l'ordre de dessin (la plus tardive). Une entité cachée
   derrière un toit (dessinée avant le bâtiment) n'est donc jamais désignée à travers lui.
3. **Exception « décor »** (ajoutée à la règle de base) : si l'entité touchée exactement est un
   **bâtiment** et qu'une entité non-bâtiment dessinée **devant** lui est à portée de tolérance, c'est
   elle qui est désignée. Un doigt qui frôle un passant devant une façade vise le passant, pas la
   façade de 200 u derrière lui. Une réponse « bâtiment » reste acceptée par `submit` (règle (c)).

`pickAt` ne renvoie jamais une zone : les zones sont reconnues par `submit` à partir du point.

## Partie (`session.ts`)

- **Disponibilité** : une étape dépend de `step.after`, sinon de l'étape précédente du tableau
  (aucune pour la première ; `after: []` = ouverte dès le début, branche parallèle).
  `openSteps()` = débloquées et non résolues, dans l'ordre du tableau ; `solvedSteps()` ;
  `isStepUnlocked/isStepOpen/isStepSolved(id)`.
- **`submit(stepId, pick)`** — l'étape doit être ouverte (sinon **erreur**). Correspondance d'un id de
  `accept` : (a) `pick.entityId` ; (b) une **zone** qui contient `pick.point` ; (c) un **bâtiment**
  dont `getHitRect` (toit + façade) contient le point. Résultat :
  - `correct` : une réponse pas encore trouvée (`found`, `required`, `stepSolved`, `caseSolved`) ;
  - `already` : ne désigne que des réponses déjà trouvées (pas une erreur) ;
  - `near` : même logique (a)(b)(c) appliquée à `nearMiss` → son `feedback` (pas une erreur) ;
  - `wrong` : une erreur de plus (y compris un tap dans le vide).
  Une étape est résolue quand `found.length ≥ required` (défaut 1, borné à `[1, accept.length]`).
- **`hint(stepId)`** — niveau suivant (max 3, l'étape doit être ouverte) ; au-delà, renvoie de
  nouveau la révélation sans rien compter. `currentHint(stepId)` : indice courant (recalculé, il suit
  les réponses trouvées) ou `null` (aucun indice, ou étape résolue).
  1. `hints[0].text` ;
  2. `hints[1].text` + `area` : `hints[1].area` si fournie, sinon cercle automatique de rayon
     `max(220, 1,25 × demi-diagonale)` autour de la première réponse non trouvée, centre **décalé**
     de 35 à 75 % de la marge (graine `enquête/étape/réponse`) : déterministe, ne pointe pas la
     réponse, la contient entièrement, centre ramené dans le monde ;
  3. révélation : `reveal` = les réponses non trouvées nécessaires (`required − found`, ordre de
     `accept`), texte `REVEAL_TEXT` (« Voici où regarder. »), cercle serré (marge 12 u, rayon ≥ 28)
     autour de toutes si elles tiennent dans 220 u, sinon autour de la première.
- **`threads()`** — fils rouges (`step.thread`) des étapes résolues : `{ stepId, ids, from, to }`
  (centres ; ids inconnus ignorés). `foundMarks()` : réponses trouvées, pour les anneaux `found`.
- **Étoiles** (`STAR_RULES`, figées à la résolution ; avant, estimation) :
  - 3 : aucun indice et au plus 2 erreurs ;
  - 2 : aucune révélation, niveaux d'indice cumulés ≤ nombre d'étapes, au plus 6 erreurs ;
  - 1 : sinon. Chaque appel à `hint()` coûte un niveau (une révélation complète en coûte 3).
- **Progression** — `progress()` renvoie une copie JSON. Statut `new` → `active` (première action :
  réponse, indice, punaise ou note ; `startedAt`) → `solved` (`solvedAt`, `stars`). À la reprise, la
  progression est copiée et **nettoyée** : réponses hors `accept` et doublons retirés, compteurs
  bornés, étapes inconnues oubliées, nouvelles étapes ajoutées ; une enquête résolue à laquelle on a
  ajouté une étape redevient `active`. Une progression d'une autre enquête lève une erreur.
- **Carnet** — `addPin(p)` (ramenée dans le monde ; au-delà de 30, la plus ancienne disparaît ;
  coordonnées non finies : erreur), `removePin(i)` (faux si l'indice n'existe pas), `pins()`,
  `setNotes(text)` (tronqué à 4000 caractères), `notes()`. `totals()` : erreurs et indices.

## Sauvegarde (`save.ts`)

JSON `SaveData` sous `STORAGE_KEY` (`haystack:v1`). `load()` ne lève jamais : JSON corrompu, version
inconnue ou valeur qui n'est pas un objet → partie vierge ; champs invalides → valeur par défaut.
`save()` ne lève jamais : si le stockage échoue (quota, navigation privée, cookies bloqués), la partie
continue **en mémoire** (`isPersistent()` devient faux) et le stockage est réessayé au `save()`
suivant. `load` et `save` travaillent sur des copies.

## Validation (`validate.ts`)

Le monde doit être construit **avec** les enquêtes (`buildWorld({ cases })`). Contrôles :

- métadonnées : id (`[a-z0-9-]`), titre, accroche, briefing, épilogue non vides, difficulté 1–5,
  caméra de départ dans le monde et zoom dans `[MIN_ZOOM_FLOOR, MAX_ZOOM]`, `unlockAfter` ≠ soi ;
- personnages : id préfixé `<enquête>.`, nom, unicité ; `character` des entités existant
  (`validateAllCases` accepte un personnage défini par une autre enquête) ;
- entités : id préfixé, unicité, présentes dans le monde avec le même type, position finie,
  `sortY` obligatoire si `z > 0`, emprise visuelle dans le monde ; **placement** avec les utilitaires
  purs de `src/world` : bateau sur l'eau ; autres entités (hors `z > 0` et pose `window`) sur un sol
  praticable (`isWalkable` ; canard toléré sur l'eau ; message précisant l'eau ou le bâtiment via
  `buildingAt`) et **pas cachées par un toit** (`isHiddenByRoof`) ;
- zones : id préfixé, unicité, libellé, ≥ 3 sommets dans le monde, présentes, pas d'id d'entité ;
- `landmarkOverrides` : lieu bâti existant (`banque` ou `lm.banque`), enseigne non vide ;
- étapes : au moins une, ids uniques, question et texte de résolution, `after` valides, sans cycle,
  toutes atteignables ; `accept` non vide, sans doublon, cibles existantes (entité ou zone), pas
  d'id ambiant `a.*` (instable) ; `required` entier dans `[1, accept.length]` ; `nearMiss` existants,
  non ambiants, uniques, disjoints de `accept`, avec message, et **non masqués** (une fausse piste
  dont le centre est dans une zone ou sur la façade d'un bâtiment de `accept` serait acceptée comme
  bonne réponse) ; au moins 2 indices non vides ; zones d'indices valides et dans le monde ; la zone
  de l'indice 2 contient au moins une réponse ; fils rouges vers des cibles existantes et distinctes ;
- reconstitution : non vide (sauf enquête `bonus`), cibles existantes, légendes non vides ;
- `validateAllCases` en plus : ids d'enquêtes, de personnages et d'entités uniques entre enquêtes,
  `unlockAfter` existants, sans cycle, toutes débloquables, et **aucun chevauchement** des emprises
  visuelles entre entités d'enquêtes **différentes**.

## Fichiers

| Fichier | Contenu |
|---|---|
| `geometry.ts` | Rectangles, polygones (point intérieur, centroïde, englobant), cercles ; cibles (entité ou zone) |
| `pick.ts` | `pickAt`, `pickTolerance` |
| `session.ts` | `CaseSession` et ses briques pures (étoiles, dépendances, correspondance) |
| `save.ts` | Magasin de sauvegarde, nettoyage, déblocage |
| `validate.ts` | `validateCase`, `validateAllCases` |
| `testkit.ts` | Monde factice fait main (1000 × 800 : banque, maison, fontaine, place, étang, route) et fabriques d'entités / d'étapes / d'enquêtes, pour les tests |

## Notes pour l'interface

- Overlays : `found` sur `foundMarks()` ; niveau 2 → `spotlight` sur `area` ; niveau 3 → `ring`
  `reveal` sur `area` (et sur chaque id de `reveal` via `entityCenter`/`getHitRect`) ; `thread` pour
  chaque élément de `threads()` ; `pin` pour `pins()`.
- Plusieurs étapes peuvent être ouvertes à la fois : l'interface choisit l'étape à laquelle répondre
  (onglets ou question active), `submit` ne devine pas.
- Sauvegarder après chaque action : `store.save(withCaseProgress(save, session.progress()))`.

## Tests

```bash
npx vitest run src/game          # 169 tests : géométrie, désignation, session, sauvegarde, validation
npx vitest run tests/unit        # contenu publié + enquête d'essai dans la vraie ville
```
