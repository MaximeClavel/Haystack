# Phase 1 — agent `game` : logique de jeu

Périmètre : `src/game/**`, `tests/unit/content.test.ts`. Documentation détaillée : `src/game/README.md`.

Travail repris après une interruption (limite d'usage) : le code de `src/game` (geometry, pick, save,
session, validate, testkit, index) existait déjà mais sans tests, README ni compte rendu. Il a été
relu point par point contre la mission, retouché (voir ci-dessous), puis entièrement couvert de tests.

## Ce qui a été fait

- **Désignation** (`pick.ts`) : `pickAt(world, point, zoom)` — candidats par `world.index.query`,
  tolérance `PICK_TOLERANCE_PX / zoom`, contact exact préféré, sinon tolérance ; égalité → la plus en
  avant dans l'ordre de dessin ; exception « décor » (voir Décisions).
- **Partie** (`session.ts`) : `CaseSession(def, world, progress?, { now? })` — disponibilité des étapes
  (`after`, sinon l'étape précédente ; branches parallèles), `submit` (correct / near / already / wrong,
  correspondance entité → zone → façade de bâtiment), réponses multiples (`required`), indices 1–3
  (texte, projecteur fourni ou automatique décalé de façon déterministe, révélation serrée),
  `currentHint`, fils rouges, étoiles, progression sérialisable avec statut et dates, reprise nettoyée,
  punaises et notes.
- **Géométrie** (`geometry.ts`) : `entityCenter` (erreur si inconnu) et variantes tolérantes,
  point dans un polygone, centroïde, rectangles, cercles.
- **Sauvegarde** (`save.ts`) : `createSaveStore(storage?)` robuste (JSON corrompu, version inconnue,
  champs invalides, `getItem`/`setItem`/`removeItem` qui lèvent, `localStorage` absent ou interdit →
  repli mémoire, retour au stockage dès qu'il refonctionne), `defaultSave`, `isUnlocked`,
  `withCaseProgress`, nettoyage `sanitizeSave` / `sanitizeCaseProgress`.
- **Validation** (`validate.ts`) : `validateCase` et `validateAllCases` — tous les contrôles demandés
  (liste complète dans le README), avec les utilitaires purs du monde `groundAt`, `isWalkable`,
  `buildingAt`, `isHiddenByRoof`.
- **Retouches de la reprise** :
  - `addPin` ramène la punaise dans les limites du monde au lieu de garder un point hors carte
    (et le message d'erreur des coordonnées non finies est corrigé) ;
  - reconstitution (`replay`) facultative pour une enquête `bonus` (pas de chronologie) ;
  - nouveau contrôle : **fausse piste masquée** — si le centre d'une fausse piste est dans une zone ou
    sur la façade d'un bâtiment de `accept`, un tap dessus serait accepté comme bonne réponse et son
    message ne s'afficherait jamais ;
  - message de placement plus précis : « dans l'eau » ou « dans le bâtiment « b.centre.12 » ».
- **Tests** : 169 tests dans `src/game` + 5 dans `tests/unit/content.test.ts` (voir Comment vérifier).

## Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Exception « décor » de `pickAt` | Si l'entité touchée exactement est un bâtiment et qu'une entité non-bâtiment **dessinée devant lui** est à portée de tolérance, on désigne cette dernière | Écart assumé à la règle de base : sans elle, un doigt qui manque un passant de 3 u devant une façade désigne la banque derrière lui (erreur comptée). Le cas inverse (viser la façade, frôler un passant) reste juste grâce à la règle (c) de `submit`. Testé dans les deux sens et à deux zooms |
| Ordre de correspondance | entité désignée, puis zones contenant le point, puis bâtiments dont toit + façade contient le point | Le plus précis d'abord ; la réponse retenue est la première non encore trouvée |
| `already` | Seulement si toutes les cibles touchées sont déjà trouvées ; ni erreur ni fausse piste | Retaper une réponse trouvée n'est pas une faute |
| Indice automatique (niveau 2) | Rayon `max(220, 1,25 × demi-diagonale)`, centre décalé de 35–75 % de la marge, graine `enquête/étape/réponse`, centre ramené dans le monde | Ne pointe jamais la réponse mais la contient toujours entièrement ; stable d'une partie à l'autre |
| Révélation (niveau 3) | Les réponses manquantes nécessaires seulement ; un cercle commun si elles tiennent dans 220 u, sinon autour de la première | Ne pas tout dévoiler d'une étape à réponses multiples |
| Au-delà du niveau 3 | `hint()` renvoie la révélation sans rien compter | L'interface peut rappeler l'indice sans pénalité |
| Étoiles | 3 : aucun indice, ≤ 2 erreurs ; 2 : aucune révélation, niveaux cumulés ≤ nombre d'étapes, ≤ 6 erreurs ; 1 sinon. Figées à la résolution | Règle simple, documentée dans `STAR_RULES` ; fausses pistes et « already » ne coûtent rien |
| Statut | `new` → `active` à la première action (réponse, indice, punaise, note) → `solved` | Ouvrir une enquête pour la lire ne la « commence » pas |
| Reprise | Progression copiée et nettoyée ; enquête résolue + nouvelle étape au contenu → redevient `active` sans étoiles | Le contenu évoluera entre les phases ; la sauvegarde ne doit jamais casser une partie |
| Stockage en panne | Repli mémoire, nouvel essai à chaque `save()` ; `isPersistent()` l'indique | Safari privé, quota, cookies bloqués : la partie continue |
| Validation : ids ambiants | Réponse ou fausse piste `a.*` refusée | Ces ids changent avec le générateur et une scène peut retirer l'entité |
| Validation : placement | Bateaux sur l'eau ; le reste (hors `z > 0` et pose `window`) praticable et pas sous un toit ; canard toléré sur l'eau | Utilise les utilitaires exacts de `src/world` (terminé), pas d'heuristique |
| Garde-fou de contenu | En plus de `validateAllCases(CASES, …) = []`, une **enquête d'essai** est posée dans la vraie ville (emplacements libres de la Grand-Place via `findFreeSpots`), validée avec les enquêtes publiées, désignée par `pickAt` et jouée jusqu'au bout | Vérifie toute la chaîne contenu → monde → jeu (vrai index, vraies zones `z.*`, vrais lieux `lm.*`) avant que la première enquête n'existe |

Aucun changement de contrat (`src/types.ts`, `src/config.ts`, `bounds.ts`, `layoutSpec.ts` intacts).
L'option `{ now }` du constructeur et les exports supplémentaires (`isPersistent`, `withCaseProgress`,
`foundMarks`, `totals`, constantes…) sont des ajouts propres au module.

## Limites connues

- `pickAt` ne considère que les rectangles de désignation (`getHitRect`), pas la silhouette exacte :
  un tap dans un coin vide du rectangle d'un arbre désigne l'arbre.
- L'exception « décor » ne vaut que pour les bâtiments : les grands objets (grue, kiosque à musique,
  échafaudage) se comportent comme les autres entités.
- La validation ne détecte pas une entité d'enquête masquée par une autre entité dessinée devant elle
  (arbre, véhicule, autre scène) : c'est la vérification par capture de la phase 3 qui s'en charge.
  Seul le masquage par un toit est contrôlé.
- `submit` compte un tap dans le vide comme une erreur (conforme à la mission) : l'interface devrait
  ne soumettre qu'après confirmation (feuille de confirmation avec vignette).
- Le test de contenu ne vérifie aujourd'hui que 0 enquête publiée (plus l'enquête d'essai) : il prendra
  tout son sens en phase 2–3.

## Comment vérifier

```bash
npx tsc --noEmit                 # aucune erreur
npx vitest run src/game          # 169 tests
npx vitest run tests/unit        # 5 tests (contenu + chaîne monde → jeu)
npm test                         # suite complète
```

- `geometry.test.ts` (9) : rectangles, polygones concaves, centroïdes, `entityCenter` d'entités et de zones.
- `pick.test.ts` (15) : tolérance selon le zoom, priorité à l'ordre de dessin et à l'id, contact exact
  prioritaire, entité derrière un toit, entité sur un toit, exception « décor », requête de l'index.
- `session.test.ts` (42) : dépendances, branches parallèles, étapes à plusieurs dépendances, erreurs
  d'usage, wrong / near / already / correct, réponses multiples, bâtiment par la façade, zones,
  indices 1–3 (déterminisme, décalage, bords du monde, zone fournie, révélation partielle ou éloignée),
  fils rouges, étoiles, progression, reprise (nettoyage, autre enquête, enquête résolue, contenu
  modifié), punaises et notes.
- `save.test.ts` (21) : aller-retour, copies, JSON corrompu, version inconnue, champs invalides, chaque
  méthode du stockage qui lève, `localStorage` absent ou interdit, déblocage, chaîne session →
  stockage → reprise.
- `validate.test.ts` (82) : une enquête de référence valide (avec personne sur un toit, à une fenêtre,
  bateau, canard), puis **une mutation par erreur** — la plupart vérifient qu'exactement ce message-là
  est produit — et les contrôles croisés de `validateAllCases`.
- Robustesse des tests vérifiée par mutation du code (8 mutations : exception décor, ordre de
  parcours, décalage du projecteur, « already », zones, repli mémoire, toit, fausse piste masquée) :
  chacune fait échouer au moins un test.
