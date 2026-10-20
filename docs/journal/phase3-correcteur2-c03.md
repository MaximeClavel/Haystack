# Phase 3 — correcteur 2 : périmètre c03 (« La Belle Évasion »)

Périmètre : `src/content/cases/c03.ts` (seul fichier de contenu modifié). Verdicts : `scratchpad/fix/c03.json`.
Aucun contrat touché, aucun id, aucune position, aucune apparence modifiés ; aucune dépendance ajoutée. Uniquement des textes
(briefing, question, indice, réussite, épilogue) et trois fausses pistes (`nearMiss`) ajoutées à Q2.

## Appliqué

| Constat | Champ de `c03.ts` | Nouveau texte |
|---|---|---|
| `c03-q2-ailleurs-fausse-piste-pont` (1) | `s2.question` | « Devant la gare, les agents ont été distraits au moment de l’évasion. Qui a fait diversion ? » (repris tel quel) |
| idem (2) | `s1.solved` | « Le fourgon est vide, portière grande ouverte. Mais que faisaient les agents pendant l’évasion ? » (repris tel quel) |
| idem (3) + `c03-q2-pont-compte-comme-erreur` | `s2.nearMiss` : + `c03.agent.1`, `c03.agent.2`, `z.pont-central` | agents : « Ces deux-là gardent le pont depuis l’alerte : l’évasion est déjà passée. Qui a retenu les agents devant la gare ? » ; zone : « Le pont est gardé depuis l’alerte : l’évasion est déjà passée. Qui a retenu les agents devant la gare ? » (repris tels quels) |
| `c03-q3-aucune-indication-spatiale` | `s3.question` | « Lapince a quitté le parvis à pied, en pyjama rayé, cheveux en épis. Quelqu’un l’a vu courir : retrouvez-le. » (**adapté**, voir plus bas) |
| idem (option du verdict) | `s3.hints[0].text` | « Il est parti vers le sud, par les petites rues du quartier de la Gare. Le témoin est un client du bar Le Fer à Cheval. » (évite de répéter « l’a vu » après la question) |
| `c03-fin-picotin-non-presente` | `epilogue` (1er paragraphe) | « … avant que le brigadier Picotin ne lui demande l’heure. Il a répondu. » (repris tel quel) |
| idem (option « meilleure cohérence » du verdict) | `intro` (1er paragraphe) | « Le fourgon s’est arrêté devant la gare, sous la garde du brigadier Picotin. Deux minutes plus tard, il était vide. » (c03 était le seul des briefings c00, c01, c02 et c05, selon le verdict, à ne pas nommer Picotin ; ancre aussi la présence des agents au fourgon, donc Q2) |
| `c03-q5-nearmiss-lapince-spoile-q6` | `s5.nearMiss` de `c03.lapince.4` | « Cet épouvantail a toujours son chapeau. » (aligné sur les trois autres épouvantails ; la surprise du déguisement de Q6 est préservée) |

### Adaptation d'un texte (justifiée)
La question de Q3 du verdict (« Lapince a quitté le parvis à pied, toujours en pyjama rayé, cheveux en épis. Quelqu’un l’a vu courir :
retrouvez-le dans sa fuite. ») tient sur 3 lignes à 390 et 412 px mais sur **4 lignes à 360 px** (mesuré dans le panneau réel), alors que
la consigne du lot impose ≤ 3 lignes aux trois largeurs. Variantes mesurées (360 / 390 / 412) : verdict 4/3/3 ; sans « toujours » 4/3/3 ;
sans « dans sa fuite » mais avec « toujours » 4/3/3 ; **sans « toujours » ni « dans sa fuite » : 3/3/3**. Retenue : la dernière. Aucune
information perdue : « dans sa fuite » était redondant (« a quitté le parvis », « l’a vu courir »), et « toujours » n’apporte rien (Q6 le dit).

### Pas de spoiler ni de piste ouverte
- Q2 : « Devant la gare » restreint la recherche au parvis mais ne nomme pas la cible (la dame allongée) ; les indices (« malaise très
  opportun, tout près du fourgon », puis la zone) gardent leur précision, les trois paliers tiennent. La dame est visible dès la première
  image de Q2 (mesuré : dame à (123, 288) au-dessus du panneau à y = 644 à 390 px ; (134, 323) / 738 à 412 px ; (108, 236) / 540 à 360 px).
- Fausses pistes du pont (agents, tablier) : elles disent que le pont est gardé et que l'évasion est déjà passée, puis ramènent au parvis ;
  elles ne nomment pas Lola et ne dévoilent aucune réponse future. Les cibles existent : `c03.agent.1` et `c03.agent.2` sont dans les
  entités de l'enquête, `z.pont-central` est la zone déjà utilisée par le nearMiss de Q4. Aucune n'est dans `accept` de Q2 ni ambiante.
- Q3 : n'ajoute ni direction ni lieu (l'indice 1 garde « vers le sud » et le bar) ; il ajoute le critère décisif « cheveux en épis » et
  signale qu'un témoin existe.
- Q5 : « Cet épouvantail a toujours son chapeau. » ne dit rien de Lapince ni du déguisement.

## Écarté / non traité

- `c03-pont-central-sans-agents` (verdict « aucun » : le monde est correct, le joueur avait examiné le Pont du Parc, à 2 050 u à l'est) :
  rien à changer ; la cause racine (pastille/minicarte qui ne nomment pas le pont) relève de UI-2 (`g-pont-central-non-nomme-c03`), et le
  correctif de Q2 supprime la raison d'aller au pont.
- `c03-q4-qui-et-comment` (verdict « non » : `accept` = `c03.bateau` et `c03.lola.2`, les deux réussissent sans erreur) : aucun correctif.
- `c03-parvis-marinieres-sosies` (verdict « aucune » : propriété voulue du jeu, aucun sosie ambiant à moins de 3 attributs) : aucun
  correctif ; le rappel « cheveux en épis » de la question de Q3 couvre le seul vrai manque.

## Vérifications

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | passe (aucune sortie) |
| `npx vitest run` | 17 fichiers, 351 tests passent |
| `npm run content:check` | `OK : aucun problème.` (notes préexistantes seulement, dont c03.lapince-paille ~ a.p.329, voulue) |
| `E2E_PORT=5194 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` | 1 test passé (1,5 min) ; c03 résolue au doigt en 12,9 s, 3 étoiles imposées par le test |

### Contrôle en jeu réel (script Playwright hors cycle de tests, Pixel 7 émulé, `?debug&case=c03`)
Script : `.shots/c03-correcteur2/verify.mjs` (serveur Vite propre, vrais taps, vrai panneau, partie jouée jusqu'à l'écran de fin ; captures
et `report.json` dans `.shots/c03-correcteur2/`, ignoré par git ; `candidates.mjs` mesure les variantes de texte). Lignes mesurées dans le
DOM (390×844 / 412×915 / 360×740) :

| Texte | lignes |
|---|---|
| Q1 réussite (modifiée) | 3 / 2 / 3 |
| Q2 question (modifiée) | 3 / 2 / 3 |
| Q2 fausse piste agents (nouvelle, `agent.1` et `agent.2`) | 3 / 3 / 3 |
| Q2 fausse piste tablier du pont (nouvelle) | 3 / 3 / 3 |
| Q3 question (modifiée, version retenue) | 3 / 3 / 3 |
| Q3 indice 1 (modifié) | 3 / 3 / 3 |
| Q5 fausse piste `c03.lapince.4` (modifiée) | 1 / 1 / 1 |
| Briefing, 1er paragraphe (modifié) | 6 / 6 / 7 lignes, sans défilement du panneau |
| Épilogue, 1er paragraphe (modifié) | 3 / 3 / 4 lignes, sans défilement (zone de texte de l'écran de fin, pas le panneau de question) |

- Tout texte de panneau modifié tient en ≤ 3 lignes aux trois largeurs ; aucun ne défile (`scrollHeight <= clientHeight`) ; aucune erreur
  console aux trois tailles.
- Erreurs comptées : `session.totals().mistakes` vaut 0 avant et après les trois taps de fausse piste de Q2 (agent 1, agent 2, tablier du
  pont à (2200, 3790)) et après le tap sur `c03.lapince.4` en Q5, aux trois tailles. Carte « Pas tout à fait… » à chaque fois.
- Captures regardées : Q3 à 360 px (panneau sur 3 lignes, parvis visible au-dessus), fausse piste du tablier à 390 px (pont, deux agents
  visibles, carte sur 3 lignes), Q2 à 390 px (dame allongée et Picotin visibles au-dessus du panneau).

### Revérification (seconde passe, après l'intégration des autres périmètres)
`c03.ts` était déjà conforme aux verdicts (aucun écart avec `git diff HEAD`) : rien de plus à appliquer. Contrôles relancés :
`npx tsc --noEmit` passe ; `npx vitest run` 17 fichiers, 362 tests passent (les autres périmètres ont ajouté des tests) ;
`npm run content:check` finit par `OK : aucun problème.` ; `E2E_PORT=5194 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts`
1 test passé (1,4 min, c03 résolue en 13,1 s). `verify.mjs` rejoué : mêmes lignes que ci-dessus aux trois largeurs (Q2 question
3 / 2 / 3, nearMiss agents et tablier 3 / 3 / 3, Q3 question et indice 1 3 / 3 / 3, Q5 nearMiss 1 / 1 / 1), aucun défilement, aucune
erreur console, 0 erreur comptée sur les taps de fausse piste de Q2 et de Q5. (Précision : la réussite de Q2, non modifiée, fait 4 lignes ;
elle est hors du lot.) `docs/CONTENT.md` est déjà à jour pour c03 (régénéré par l'intégration : il cite les nouveaux textes de Q2 et
du briefing), ce qui rend caduque la première limite ci-dessous.

## Limites

- **`docs/CONTENT.md` n'est pas régénéré** (`npm run content:doc`, fait une seule fois à l'intégration) : il cite encore les anciens
  textes de Q2 (question), Q3 (question et indice 1), Q1 (réussite), le briefing, l'épilogue et le nearMiss de `c03.lapince.4`. Aucune
  mention de ces textes dans `tools/content/CONTENT.template.md` (vérifié par recherche).
- Le nearMiss de Q4 ne couvre toujours pas les deux agents du pont (seulement la zone `z.pont-central`) : taper un agent en Q4 reste une
  erreur comptée. Non traité (hors constat : à ce stade le joueur sait déjà que le pont est gardé).
- Le fond du problème de repérage (ni la pastille ni la minicarte ne distinguent le Pont Central du Pont du Parc) n'est pas traité ici :
  périmètre UI-2.
- Mettre le fourgon « sous la garde du brigadier Picotin » renforce un peu la fausse piste Picotin de Q2, déjà présente dans son nearMiss (« il n’a rien
  vu partir »).
