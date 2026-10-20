<!-- Copie de la feuille de route donnée aux correcteurs (les JSON de verdicts cités sont dans le dossier de travail de la session, pas dans le dépôt). -->
# Décisions de l'orchestrateur — correction des constats des joueurs test (phase 3)

Source : 7 comptes rendus `docs/journal/phase3-joueur-*.md` (+ `…-c04-rejeu.md`), triés puis **vérifiés un par un sur le vrai
jeu** par des vérificateurs en lecture seule. Leurs verdicts complets (cause racine, reproduction, correctif minimal, NOUVEAU
TEXTE EXACT) sont dans `scratchpad/fix/*.json` (un fichier par périmètre : `c00.json` … `bonus-aiguilles.json`,
`g-<thème>.json`). Ce document fixe ce que l'on applique, ce que l'on écarte, et qui s'en charge.

## Principes
1. On applique le correctif **le plus petit** recommandé par le vérificateur. Le NOUVEAU TEXTE est repris tel quel, sauf défaut
   constaté (débordement du panneau, échec de `content:check`, incohérence) : alors adaptation minimale, justifiée au journal.
2. **On ne change aucune règle du jeu** (calcul des étoiles, paliers d'indice, désignation). On les **explique** mieux.
3. Aucun changement de contrat (`src/types.ts`, `src/config.ts`, `src/art/bounds.ts`, `src/world/layoutSpec.ts`). Ids d'entités,
   positions et aspects du monde inchangés (sauf les deux exceptions explicites du périmètre MONDE). Pas de dépendance npm.
4. Les prototypes testés hors dépôt par les vérificateurs sont des **références** (à relire, pas à appliquer en aveugle) :
   `scratchpad/c04-proposed.patch`, `scratchpad/bonus-fixes.patch`, `scratchpad/fix2/` (copie de travail du correctif caméra).
5. Ne pas lancer `npm run content:doc` (l'intégration le fait une seule fois à la fin) ; en revanche éditer
   `tools/content/CONTENT.template.md` quand un verdict le demande (il alimente `docs/CONTENT.md`). Utiliser l'outil Edit
   (remplacements ciblés), jamais de réécriture complète d'un fichier partagé.
6. Plusieurs agents travaillent en même temps dans le même dépôt (fichiers distincts). Un échec de `tsc`/`vitest`/`content:check`
   dû à un fichier que vous n'avez pas touché = quelqu'un d'autre est en train d'éditer : attendre ~1 min et relancer ; ne jamais
   « réparer » le fichier d'un autre. Ports : `E2E_PORT` distinct par agent (voir votre mission).
7. Vérifier visuellement tout texte de question modifié dans le **panneau réel** (390×844, 412×915, 360×740) : il doit rester
   court (≤ 3 lignes) et ne pas masquer la carte. Captures brouillons dans `.shots/`.
8. Ne pas committer. Écrire `docs/journal/phase3-correcteur2-<périmètre>.md` : ce qui est appliqué (ids), écarté (pourquoi),
   vérifié (commandes et résultats), limites.

## Décisions de conception (réponses aux `designQuestion`)
| Question | Décision |
|---|---|
| Étoiles/indices : resserrer le budget d'indices ? | **Non.** Garder la règle, l'expliquer : horizon dans le texte de coût (« au-delà de N indices en tout… »), ligne explicative à l'écran de fin, texte « Comment jouer ». |
| Bonus : projecteur gratuit après l'indice 2, indice 3 qui montre tout | **Garder.** Le dire dans le texte du palier 2 (verdict bonus). |
| Noms de rues dans la pastille de lieu ? | **Oui** (verdict `g-noms-de-rues-absents-c01`), + marge de capture en pixels pour les lieux étroits (pont). |
| Noms de lieux / marqueur de la zone de la question sur la minicarte ? | **Non** (donnerait l'indice 2 gratuitement). Seulement corriger le débordement de la croix ✕. |
| Minicarte qui se ferme après un tap ? | **Non**, garder. |
| Panneau de question qui se redéploie à chaque question | **Garder.** |
| Cercles verts des trouvailles (c05 Q6) | **Garder** (aide-mémoire). |
| Bulles ambiantes, genre du livreur, jumeaux, sosies ambiants légitimes | **Aucun changement.** |
| Retour narratif dans le bonus | Au plus l'extrait du vers dans le toast « Bien vu ! n sur 10 · … ». |
| Tartes portées par la foule | **Supprimer** (périmètre MONDE) : la tarte redevient un signe distinctif. |
| Fil rouge de c00 | Ne pas le recolorer ; l'expliquer (texte de réussite c00 + « Comment jouer »). |
| Agrandir un sprite (sac, tarte, aiguille) | **Non** (exigerait `bounds.ts`). Corriger par le texte. |

## Périmètres et constats (ids = `findingId` / `id` dans les JSON)
**MONDE** (`src/world/people.ts`, `src/world/names.ts`, tests `src/world/**`) — `c04-q5-leurre-dessert` (retirer les tartes de la
foule : mêmes ids et positions, seuls les objets tenus changent), `c05-q2-bateau-sainte-paille` (renommer l'entrée en « LA FANEUSE »).
Vérifier : tests monde, `content:check`, qu'aucun id ni aucune position ne bouge, et lister les passants dont l'objet change.

**c00** (`src/content/cases/c00.ts`) — `c00-q2-short-rouge-invisible`, `c00-q2-ou-chercher-et-quel-moment`, `c00-q2-panneau-sans-signalement`,
`c00-q3-gateau-intact-sans-creme`, `c00-q3-croquette-non-decrit`, `g-fil-rouge-confondu-avec-laisse-c00` (voir `g-fil-rouge-et-fausses-pistes.json`).
Aucun : `c00-q2-faux-dormeur-gare`, `c00-q2-genre-livreur`.

**c01** (`c01.ts`) — `c01-q3-lieu-plus-loin-non-localisable`, `c01-q3-file-cinema-compte-erreur` (nearMiss), `c01-replay-motus-apres-lafouine-et-sous-le-bras`
(légende/ordre de la reconstitution). Aucun : les autres.

**c02** (`c02.ts`) — `c02-q2-faux-bateau-le-baron` (+ `g-message-erreur-transitoire-c02` : **un seul** jeu de nearMiss, prendre les textes de
`c02-q2-faux-bateau-le-baron`), `c02-q2-enonce-sans-nature-de-cible`, `c02-s5-camionnette-sans-fausse-piste` (nearMiss de s5, et de s3 si le
verdict le dit), briefing « votre coéquipier Picotin » (facultatif, retenu). Aucun : les autres.

**c03** (`c03.ts`) — `c03-q2-ailleurs-fausse-piste-pont` (+ `c03-q2-pont-compte-comme-erreur`), `c03-q3-aucune-indication-spatiale`,
`c03-fin-picotin-non-presente`, `c03-q5-nearmiss-lapince-spoile-q6`. Aucun : `c03-pont-central-sans-agents`, `c03-q4-qui-et-comment`, `c03-parvis-marinieres-sosies`.

**c04** (`c04.ts`) — `c04-q2-jumeaux-sac-vert`, `c04-q4-tarte-sans-repere`, `c04-q5-sans-direction`, `c04-q6-sans-lieu-ni-description`,
`c04-q6-indice1-moins-soupconneuse`, `c04r-q6-quitter-la-ville-egare`, `c04r-textes-solved-decalage-sprite`, `c04-nearmiss-picotin-spoile-q6`.
Référence : `scratchpad/c04-proposed.patch` (partie `c04.ts` seulement ; la partie `people.ts` est du périmètre MONDE).
Reportés (non traités) : `c04r-q3-reponse-visible-des-q2`, `c04r-q2-sosie-ambiant-a-p-1480`.

**c05** (`c05.ts`) — `c05-q3-indice1-redondant` (+ `c05-q3-cimetiere-recherche-longue`), `c05-q3-pantalon-orange-invisible`, `c05-q4-indice1-redondant`,
`c05-q5-journal-sans-lien-avec-le-lieu`, `c05-q7-bateau-non-nomme` (+ `c05-q7-indice-pont-du-parc-introuvable`, `c05-q7-sosie-passerelle`),
`c05-q3-pas-de-fausse-piste-cimetiere` (nearMiss s3), `c05-s2-retenez-bien-sans-pointer-vers-le-carnet` (voir `g-criteres-non-rappeles.json`).

**bonus** (`bonus-aiguilles.ts` + `tools/content/CONTENT.template.md`) — `bonus-indice1-generique-coute-une-etoile` (+ `bonus-bas-zoom-aiguille-invisible`),
`bonus-projecteurs-gratuits-apres-indice2` (+ `g-regle-etoiles-differente-selon-enquete` : texte du palier 2), `bonus-vers-statue-sans-lieu`, `bonus-vers-serre-ambigu`.
Référence : `scratchpad/bonus-fixes.patch` (ne reprendre que les blocs `bonus-aiguilles.ts` et `CONTENT.template.md` ; les blocs `Investigation.tsx`/`Notebook.tsx` sont du périmètre UI).

**UI-1** (`src/ui/**` hors pastille/minicarte, `tests/e2e/**` pour ajuster les libellés changés) — `g-indices-gratuits-apres-le-premier-c04`,
`g-etoiles-plafond-1er-indice-c05`, `howto-regle-des-etoiles-absente`, `n-howto-fil-rouge-non-explique`, `g-bouton-indice-trop-voyant-c00`,
`g-indice-replie-sans-texte-c01`, `g-voir-la-zone-cache-si-fiche-repliee-bonus` (+ `bonus-projecteur-assombrit-la-carte-apres-trouvaille`),
`ind-oui-sous-le-bouton-indice`, `n-erreur-toast-3-pas-tout-a-fait` (+ `c04r-toast-pas-tout-a-fait-rotation`, `c04-q5-erreur-sans-orientation` : `WRONG_MESSAGES[2]` = « Toujours pas… Cherchez encore. »),
`g-numerotation-question-4-sur-6-c04`, `g-briefing-loupes-sans-libelle-c03` (+ `n-liste-dossiers-loupes-sans-libelle`),
`g-carnet-trois-voir-identiques-c04` (+ `n-carnet-voir-bonus-identiques`), `bonus-carnet-et-compteur-incoherents`,
`bonus-carnet-personnages-identifies-toujours-vide`, `bonus-reussite-pauvre` (extrait du vers dans le toast), `bonus-fin-bande-noire`,
`n-onglets-c05-coupes-petit-ecran`, `c04-onglet-saute-vers-premiere-piste`.
Aucun : `g-panneau-se-redeplie-c05`, `g-carnet-notes-vide-c05` (non réel), `bonus-indice3-revele-*` (règle gardée, documentée par le texte du palier 2).

**UI-2** (pastille de lieu, minicarte, feuille de confirmation : `src/ui/format.ts` + tests, `PlaceChip.tsx`, `Minimap.tsx`, feuille « Désigner ») —
`g-noms-de-rues-absents-c01`, `g-pont-central-non-nomme-c03` (marge de capture), `g-pastille-lieu-doublon-c05`,
`bonus-pastille-ne-nomme-pas-le-lieu-du-vers` (résolu par la marge), `g-minicarte-se-ferme-sans-message-c05` (croix ✕ : CSS), `c05-vignette-confirmation-rogne-parapluie`.
Aucun : tous les autres `g-minicarte-*` (décisions ci-dessus), `mc-plaques-de-rue-absentes-ou-illisibles` (reporté : trop gros ; les noms de rues dans la pastille répondent au besoin).

**MOTEUR** (`src/engine/camera.ts` + appelants, tests) — `g-defilement-bas-masque-par-panneau-c03` : les marges de l'interface comptent dans les bornes de
la caméra (paramètre optionnel `insets` ; comportement inchangé sans lui). Référence : `scratchpad/fix2/`. Contrôler la fluidité (`node scripts/perf-map.mjs --gestures`).
Reportés : `g-seuil-designation-sans-tolerance`, `g-retap-pendant-le-vol-avale`.

**OUTILS** (`tools/playtest/**`, `tools/content/**` hors CONTENT.template.md) — voir `g-outil-de-test.json` : ligne « Incidents techniques » toujours affichée,
`--crop` agrandi (≥ 480 px de côté, lissé) et message exact, `press` avec numéro d'occurrence pour les libellés identiques, incidents non comptés en double ;
`c00-outil-check-bas-masque-par-tablier` : `content:check` doit signaler un texte qui cite la couleur d'un bas (short, pantalon, jupe) caché par un tablier / manteau / robe.
`node tools/playtest/selftest.mjs` doit passer.
