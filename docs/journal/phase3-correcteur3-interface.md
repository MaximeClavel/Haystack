# Phase 3 — correcteur 3, périmètre B (interface `src/ui/**`)

Corrections des défauts prouvés par les deux relectures (code et textes) qui relèvent de l'interface.
Aucun contrat touché (`types.ts`, `config.ts`, `art/bounds.ts`, `layoutSpec.ts` : intacts), aucune dépendance,
aucun commit. Port e2e : 5302.

## Appliqué

1. **Apostrophes de la pastille de lieu** (`src/ui/format.ts`). Nouvelle fonction `apostrophes()` (’ pour '),
   appliquée à `placeName` (rues, lieux remarquables, quartiers) et à `districtName`. Le monde n'est pas touché :
   les noms de `src/world` gardent l'apostrophe droite (contrat `layoutSpec`), seul l'affichage est normalisé.
   Elle couvre aussi « Cour de l’école », lieu remarquable qui avait le même défaut que les 44 libellés de rues.
   Tests : `format.test.ts` (rues et lieu à apostrophe droite dans le monde de test, `apostrophes`, `districtName`)
   et e2e « pastille de lieu : apostrophe typographique » (« Boulevard des Halles / Rue de l’Aiguillage »).
2. **Toasts typographiés** (`src/ui/App.tsx`) : `fr(toast.text)`. Plus de retour à la ligne avant le deux-points du
   toast de sauvegarde impossible, et « Bien vu ! » porte son espace insécable. Les e2e en regex ont dû passer à
   `Bien vu !` (les assertions en chaîne de Playwright normalisent les espaces, pas les regex).
3. **Ordre du DOM = ordre visuel** (`QuestionPanel.tsx`, `Investigation.tsx`, `styles.css`). Nouvelle prop
   `leftHanded` : les deux boutons de la confirmation d'indice sont rendus dans l'ordre visuel (droitier :
   « Oui, un indice » puis « Non merci » ; gaucher : l'inverse), et les règles CSS `row-reverse` sont supprimées.
   `data-testid` inchangés. Extension assumée : la barre d'actions (Minicarte / Punaise / Indice) avait exactement
   le même défaut en gaucher (`[data-hand='left'] .actions { row-reverse }`) : elle est rangée de la même façon
   (gaucher : Indice, Punaise, Minicarte dans le DOM). Rendu visuel conservé : l'ordre mesuré à l'écran (390 × 844, deux mains) est
   celui que produisait le CSS supprimé, et il est désormais aussi celui du DOM.
4. **Noms accessibles**.
   a. Compteur « n/10 » du panneau : `role="img"` + `foundCountLabel()` (`texts.ts`) : « 0 aiguille trouvée sur 10 »,
      « 1 aiguille trouvée sur 10 », « 2 aiguilles trouvées sur 10 ». Seul le bonus a une étape à plusieurs
      réponses (`required > 1`) ; le nom dit « aiguille » quand `def.bonus`, « réponse » sinon (prévu pour une
      future enquête à réponses multiples). Test unitaire (`texts.test.ts`) et e2e (0, 1, 2 aiguilles).
   b. Reconstitution (`Panels.tsx`) : « Précédent : moment précédent » et « Suivant : moment suivant » (le nom
      commence par le texte visible, WCAG 2.5.3). Test e2e par rôle et nom.
5. **Largeur 320 px**.
   a. `HowTo.tsx` + `styles.css` : sous 601 px de haut seulement (`@media (max-height: 600px)`), illustration en
      2:1 au lieu de 16:10, titre et marge haute resserrés, texte 15 px / interligne 1,45. Une seule coupe de texte,
      sans perte d'information : étape 4, « Le carnet garde le briefing, vos découvertes, notes et punaises. »
      (au lieu de « …vos découvertes, vos notes et vos punaises. »). Le fil rouge et la règle des étoiles sont
      intacts (les assertions e2e existantes sur ces phrases passent telles quelles).
   b. Onglets de c05 : `@media (max-width: 340px)` (écart 4 px, remplissage 4 px, 13,5 px). Aucun effet à 360 px et plus.
6. **Contraste du bouton Indice** : nouveau jeton `--hay-3: #9a6e14` (même fichier), utilisé pour la bordure et
   l'icône de `.action.hint-action`. 3,87:1 sur `--paper` et 3,50:1 sur `--paper-2` (avant : 2,29 et 2,07).
   Le bouton garde son aspect « aide » (liseré ambre, pas de jaune plein) ; vérifié sur capture. Test e2e qui calcule
   le rapport sur les couleurs réelles. Le cadre pointillé de `.hint-ask` (`--hay-2`) n'est pas un contrôle et
   reste tel quel.
7. **Test faible de `format.test.ts`** remplacé : l'échelle de la vignette (`min(132/w, 99/h)`) doit être égale à
   celle de l'ancienne formule (`max(52, 1,4 × corps)` × `max(39, 1,4 × corps)`), sur sept entités fabriquées
   (personne simple, parapluie, haut-de-forme, objet, véhicule, arbre, bâtiment) et sur une entité sur quatre
   de la vraie ville (au moins une de chaque sorte). Vérifié par mutation : avec `r.w * 1.6` au lieu de `1.4`
   dans `thumbRect`, le test échoue ; l'ancien test passait.

## Écarté

- Rien d'écarté parmi les points de la mission. Les trois défauts de texte du rapport `review-textes.json`
  (c04 Picotin, c05 Gontran, c01 étape 3) et le défaut de `tools/content/check.ts` relèvent d'un autre périmètre.

## Vérifications chiffrées

- `npx tsc --noEmit` : propre. `npx vitest run` : 17 fichiers, 367 tests verts. `npm run content:check` : « OK : aucun problème ».
- Comment jouer à 320 × 568 (débordement de `.scroll`, bas des boutons) : avant 0 / 36 / 36 / 84 px et
  528 / 576 / 576 / 624 ; après 0 / 0 / 0 / 0 px et 472 / 494 / 494 / 538 (écran de 568). À 360 × 640 (13 px à
  l'étape 4, boutons à 625 < 640) : identique à avant ; à 390 × 844 et 412 × 915 : aucun débordement. Le média
  n'y est pas actif (seule la phrase du carnet de l'étape 4 est plus courte).
- Onglets de c05 : 320 px, scrollWidth 321 pour 284 avant, 284 pour 284 après (dernier onglet à 9 px du bord) ;
  360 / 390 / 412 px : 324 / 354 / 376, inchangés.
- Captures 390 × 844 droitier et gaucher : barre d'actions et confirmation d'indice (ordre DOM = ordre visuel,
  mesuré par `getBoundingClientRect`) ; bordure et icône de l'Indice plus foncées, lisibles.
- Pastille de lieu sur toute la carte (grille de 60 u, zooms 0,6 / 1 / 1,6) : 653 libellés distincts, 0 avec
  une apostrophe droite, 42 avec ’ (la relecture en comptait 44 sur un autre échantillonnage).
- e2e : suite COMPLÈTE sur le port 5302 (`E2E_PORT=5302 npx playwright test`) : 41 tests verts en 4,3 min, aucun
  test relancé (36 anciens + 5 nouveaux dans `08-retours-joueurs-ui.spec.ts` : reconstitution, apostrophe,
  contraste, et deux tests à 320 × 568). Les nouveaux tests échouent sur le code d'avant correction (vérifié
  dans un worktree de HEAD) : noms de la reconstitution introuvables, apostrophe droite reçue, etc.

## Limites

- À 320 × 568 le texte de « Comment jouer » est en 15 px (16 px ailleurs) et les illustrations sont plus plates.
- Les onglets de c05 à 320 px sont serrés (13,5 px, marge 9 px) ; une enquête avec un onglet de plus ou un libellé
  plus long retomberait sur le balayage horizontal (déjà géré par `overflow-x: auto`).
- Le nom du compteur ne dit « aiguille » que pour une enquête `bonus` ; aucun champ du contrat ne porte le nom
  de l'objet cherché.
