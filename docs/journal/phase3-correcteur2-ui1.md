# Phase 3 — Correcteur 2 : interface hors pastille et minicarte (UI-1)

Périmètre : `src/ui/**` (hors `format.ts`, `PlaceChip.tsx`, `Minimap.tsx`, feuille « Désigner », réservés à UI-2) et `tests/e2e/**`.
Sources : `scratchpad/fix/DECISIONS.md` et les verdicts `g-indices-et-etoiles`, `g-carnet-et-textes-ui`, `g-fil-rouge-et-fausses-pistes`,
`c03`, `c04`, `c05`, `bonus-aiguilles`. Aucune règle du jeu changée (étoiles, paliers d'indice, désignation) : on les **explique**.
Aucun contrat touché (`types.ts`, `config.ts`, `art/bounds.ts`, `layoutSpec.ts`), aucune dépendance, pas de `content:doc`, rien de commité.

## Appliqué (ids des verdicts)

| Id | Changement |
|---|---|
| `g-indices-gratuits-apres-le-premier-c04`, `g-etoiles-plafond-1er-indice-c05` | Coût d'un indice avec **horizon** : « Votre note reste à 2 étoiles ; au-delà de N indices en tout, elle passera à 1 étoile. » (N = nombre de questions). Les deux autres formules sont inchangées (testées par l'e2e 03). **Écran de fin** : une ligne sous les étoiles (`data-testid="stars-why"`) qui dit pourquoi cette note (3★ « le maximum », 2★ par les indices / les erreurs / les deux, 1★ par révélation / trop d'indices / trop d'erreurs). Logique pure dans `investigation/texts.ts` (`hintCostText`, `starsExplanation`). |
| `howto-regle-des-etoiles-absente` | « Comment jouer », étapes 3 et 4 : « Jusqu’à deux erreurs, rien n’est perdu ; au-delà, elles coûtent des étoiles. » et « Le premier indice vous fait perdre une étoile ; comptez ensuite à peu près un indice par question avant d’en perdre une autre. » |
| `n-howto-fil-rouge-non-explique` | Étape 2 : « … suivez-la : un fil rouge relie vos trouvailles. » |
| `g-bouton-indice-trop-voyant-c00` | Bouton **Indice** en style secondaire (fond papier, liseré et ampoule dorés) : le jaune plein reste à « Désigner » et « Commencer ». |
| `g-indice-replie-sans-texte-c01` | Fiche repliée : « Indice 1 sur 3 · relire ». |
| `g-voir-la-zone-cache-si-fiche-repliee-bonus`, `bonus-projecteur-assombrit-la-carte-apres-trouvaille` | (1) La fiche se **rouvre** quand le projecteur change de cible (aire en dépendance de l'effet, `Investigation.tsx`) ; (2) « Voir la zone » et « Masquer le projecteur » restent **accessibles fiche repliée** (`QuestionPanel.tsx`). |
| `ind-oui-sous-le-bouton-indice` | Droitier : `[data-hand='right'] .hint-ask .btn-row { flex-direction: row-reverse }` → « Non merci » recouvre le bouton Indice (« Oui » n'est plus dessus). Gaucher : déjà le cas. |
| `n-erreur-toast-3-pas-tout-a-fait`, `c04r-toast-pas-tout-a-fait-rotation`, `c04-q5-erreur-sans-orientation` | 3e toast d'erreur : « Toujours pas… Cherchez encore. » (jamais le titre « Pas tout à fait… » des fausses pistes). `WRONG_MESSAGES` et `wrongMessage()` déplacés dans `texts.ts`, testés. |
| `g-numerotation-question-4-sur-6-c04` | Panneau : « N pistes ouvertes » quand plusieurs questions sont ouvertes, sinon « Question N sur M ». Feuille de confirmation alignée (nom de la piste au lieu de l'ordinal). Le carnet garde « Q4 ». |
| `g-briefing-loupes-sans-libelle-c03` | Briefing : « Difficulté » (12 px, `aria-hidden`, les loupes gardent leur `aria-label`) dans un conteneur `.dossier-diff` (un seul enfant du `space-between`). |
| `g-carnet-trois-voir-identiques-c04`, `n-carnet-voir-bonus-identiques` | `aria-label` « Voir la réponse de la question N » et « Voir l’aiguille N » ; texte visible et `data-testid` inchangés. |
| `bonus-carnet-et-compteur-incoherents` | Feuille de confirmation : « Votre mission » pour une enquête à une seule question ; carnet du bonus : « Aucune aiguille trouvée pour l’instant… » / « n aiguille(s) trouvée(s) sur 10, cochée(s) dans le testament. » |
| `bonus-carnet-personnages-identifies-toujours-vide` | Rubrique « Personnages identifiés » masquée si `def.characters` est vide. |
| `bonus-reussite-pauvre` | Toast « Bien vu ! n sur 10 · Le boucher a ses crochets » (début du vers, `verseExcerpt`, 3,6 s). Rien dans le contrat. |
| `bonus-fin-bande-noire` | `fitFound` : pour le bonus, vue d'ensemble de l'accueil (`focusStart`) au lieu des bornes des dix réponses (zoom minimal, monde plus petit que l'écran). |
| `n-onglets-c05-coupes-petit-ecran` | `.tab { padding: 6px 8px }` : les 4 onglets de c05 tiennent à 360 px (scrollWidth 324 = clientWidth 324 ; avant 353). |
| `c04-onglet-saute-vers-premiere-piste` | `continueAfterCard` : si l'onglet résolu disparaît, on choisit d'abord l'étape qui en dépend (`stepDependencies`), sinon la première ouverte. Après « Le voisin » : « La tarte ». |

## Écarté ou sans changement

- `n-liste-dossiers-loupes-sans-libelle` : le verdict dit « ne rien ajouter si le briefing est libellé » (la comparaison entre dossiers suffit, les loupes ont
  déjà un nom accessible). Briefing libellé, liste inchangée.
- `g-panneau-se-redeplie-c05`, `g-carnet-notes-vide-c05`, `bonus-indice3-revele-*` : « Aucun » dans DECISIONS.
- 320 px : le 4e onglet de c05 reste coupé (le verdict l'accepte : le balayage fonctionne) et les deux liens de la fiche repliée passent sur deux lignes.

## Adaptations par rapport aux textes des verdicts

- Étoiles, ligne de fin : le verdict ne couvre pas « indices ET erreurs » en 1★ ; ajout de « Trop d’indices et plus de 6 erreurs : la note tombe à 1 étoile. »
  Le singulier (bonus, N = 1) est géré : « jusqu’à 1 indice », « Plus d’un indice ». Le coût sans horizon (« pour l’instant ») reste pour N = 1 et pour 1 étoile.
- `fr()` appliqué aux deux nouveaux textes (espace insécable avant « ; » et « : »). Les assertions e2e utilisent des espaces ordinaires : Playwright normalise.
- `testamentVerses` déplacé de `Notebook.tsx` vers `texts.ts` (pur, testable sous Node) ; aucun autre consommateur.

## Vérifications

- `npx tsc --noEmit` : propre.
- `npx vitest run` : 17 fichiers, 329 tests passent (dont `texts.test.ts` : 18 tests, dont le recoupement avec `computeStars` pour toutes les tailles d'enquête de 1 à 7
  questions, 0 à 9 erreurs : l'horizon annoncé et la cause expliquée sont exacts ; les 10 vers réels du bonus donnent un extrait court sans ponctuation forte).
- `npm run content:check` : « OK : aucun problème ».
- `E2E_PORT=5181 npx playwright test` : **33 passés (3,4 min)**, dont `08-retours-joueurs-ui.spec.ts` (nouveau, 10 tests) ; `play.ts` vérifie maintenant la ligne `stars-why`
  à la fin de chaque enquête (04) ; `03` vérifie l'horizon et le coût de la révélation ; `07` R2 vérifie « 4 pistes ouvertes ».
  Le serveur Vite était lancé hors dépôt sans rechargement à chaud (config dans le scratchpad), pour que les éditions des autres agents ne rechargent pas les pages de test.
- Contrôle à l'écran (Playwright, tactile, dpr 2, 390×844 et 360×740, 412×915 pour le bonus ; 320×640 pour les débordements) : panneau c04 avec deux pistes, confirmation
  d'indice (horizon, et 6 niveaux déjà pris), fiche repliée niveau 1 et 2, bouton Indice de c00, fins c00/c01/c02/c04/c05 (3★, 2★ indices, 2★ erreurs, 2★ les deux, 1★ révélation,
  1★ indices), carnet c04 et bonus, briefing c03, onglets c05 (390/360/320), « Comment jouer » 2 à 4, toast du bonus, fin du bonus (plus de bande noire),
  suite du fil c04. Montage conservé : `docs/screenshots/correcteur2-ui1-indices-fin-carnet.jpg` ; brouillons dans `.shots/ui1/`.

## Limites et points d'attention

- La ligne d'horizon ajoute une ligne au panneau de confirmation d'indice (≈ 20 px) ; à 360×740 le panneau c04 (deux onglets + indice + confirmation) occupe environ la moitié de l'écran.
- La fiche repliée au niveau 2 mesure 84 px (40 + 44) au lieu de 40 px : c'est le prix de l'accès à la zone et au projecteur.
- `tools/playtest/selftest.mjs` attend « Question 1 sur N » sur c00 (une seule piste) : inchangé. Sur les enquêtes à fils parallèles, l'outil lit désormais « N pistes ouvertes ».
- Pour UI-2 : `Investigation.tsx` a été modifié (imports, `questionLabel` de la feuille de confirmation via `confirmLabel`) ; relire le fichier avant d'y toucher. `ConfirmSheet.tsx` n'est pas touché.
- `docs/CONTENT.md` n'est pas concerné (aucun texte d'enquête modifié ici).
