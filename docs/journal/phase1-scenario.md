# Phase 1 — agent `scenario` (compte rendu rédigé par l'orchestrateur)

L'agent `scenario` a été interrompu par la limite d'usage juste avant d'écrire son compte rendu ;
son travail était néanmoins complet et vérifié. Ce résumé est rédigé par l'orchestrateur.

## Ce qui a été fait
- Bible de Meulebourg (ton, quartiers, lexique, personnages récurrents : la commissaire Odile Fétu,
  voix des briefings, et le brigadier Gaston Picotin, présent dans chaque enquête) et conventions de
  mise en scène (le temps dans l'espace, ce qui se voit au zoom de jeu, personnages vs figurants).
- 7 enquêtes écrites directement en `CaseDef` TypeScript, placées sur la vraie ville :
  c00 *La Tarte de bienvenue* (tutoriel), c01 *La Main dans le sac*, c02 *Coin-coin !*,
  c03 *La Belle Évasion*, c04 *La Grande Paille*, c05 *Rideau !*, bonus *Les Aiguilles du Fondateur*.
- Outils : `check.ts` (validateur officiel + règles de la bible : hors chaussée, 80 u entre enquêtes,
  écarts d'apparence, figurants, sosies ambiants, rayons d'indice, occultation), `probe.ts`,
  `preview.html` (aperçu de la ville avec les enquêtes, fils rouges, projecteurs d'indice), `gen.ts`
  (génère `docs/CONTENT.md` à partir du gabarit et du code des enquêtes).

## Réorganisation par l'orchestrateur
- Les enquêtes sont devenues la **source unique** du jeu : `src/content/cases/*.ts`,
  `src/content/common.ts` (Picotin), `src/content/meta.ts` (sosies volontaires, récurrents),
  `src/content/index.ts` (`CASES`).
- Les outils ont été déplacés dans `tools/content/` ; scripts `npm run content:check` et
  `npm run content:doc`.
- Vérification : `content:check` → « OK : aucun problème » (7 notes informatives) ;
  `tests/unit/content.test.ts` (validateAllCases sur la vraie ville) vert ; 277 tests verts.
