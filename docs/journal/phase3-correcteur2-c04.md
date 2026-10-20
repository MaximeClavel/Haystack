# Phase 3 — correcteur 2 : périmètre c04 (« La Grande Paille »)

Périmètre : `src/content/cases/c04.ts` (seul fichier du dépôt modifié, hors ce journal). Verdicts : `scratchpad/fix/c04.json` ;
référence testée hors dépôt : `scratchpad/c04-proposed.patch` (partie `c04.ts` seulement, relue ligne à ligne).
Aucun contrat touché, aucun id, aucune position, aucune apparence modifiés ; aucune dépendance ajoutée. Uniquement des textes
(questions, indices, réussites, fausses pistes). `docs/CONTENT.md` n'est pas régénéré (`npm run content:doc` : à l'intégration).

## Appliqué

| Constat | Champ de `c04.ts` | Texte appliqué |
|---|---|---|
| `c04-q2-jumeaux-sac-vert` | `s2.hints[0].text` | « Rappelez-vous la scène de la vitrine : un seul des jumeaux tenait le diamant, celui qui avait un sac au dos. Il est parti vers le nord, vers la Grand-Place. » (repris tel quel) |
| idem (+ `c04r-textes-solved-decalage-sprite`, volet Ludo) | `s2.solved` | « Ludo Taupin, sac au dos, a traversé la Grand-Place avec le butin. Son frère Lino est parti de l’autre côté, vers le Faubourg, pour brouiller les pistes. » (neutre : Ludo.3, immobile à la fontaine, est aussi accepté) |
| `c04-q4-tarte-sans-repere` | `s4.question` | « Un voisin a vu quelqu’un s’éloigner de la bijouterie à l’aube, vers la Grand-Place, une tarte à la main. Retrouvez-le. » (**adapté**, voir plus bas) |
| `c04-q5-sans-direction` + `c04r-textes-solved-decalage-sprite` (volet Octave) | `s4.solved` | « Octave Carat en personne, à l’aube, une tarte plaquée devant le visage ! Il file vers le nord. Le bijoutier « effondré » avait des choses à cacher. » (repris tel quel) |
| `c04-q5-sans-direction` | `s5.hints[0].text` | « Il ne s’est arrêté qu’à une terrasse où l’on sert le café. » (la direction est maintenant dans la réussite de Q4 ; l'indice 1 garde ce qu'il apporte de neuf : le café) |
| `c04r-textes-solved-decalage-sprite` | `s5.nearMiss[c04.octave.1]` | « C’est bien Octave, tarte à la main, mais plus tôt. Suivez-le : à qui va-t-il la confier ? » (« tarte au bras » ne correspondait pas au dessin) |
| `c04-nearmiss-picotin-spoile-q6` | `s4.nearMiss[c04.picotin.2]` | « Picotin ? À l’aube, il dormait encore. » (ne dit plus que Picotin a une tarte) |
| idem | `s5.nearMiss[c04.picotin.2]` | « Picotin n’a rien à voir avec ce que le bijoutier a confié : il n’était même pas là. » |
| `c04-q6-sans-lieu-ni-description` | `s6.question` | « Le diamant de la vitrine était un faux : le vrai était caché dans la tarte. Mais Zita ne l’a plus ! Où est la tarte, sur la place ? » (**adapté**, voir plus bas) |
| `c04-q6-indice1-moins-soupconneuse` | `s6.hints[0].text` | « Zita a voulu se débarrasser de la tarte au plus vite, en la donnant à la dernière personne qu’on irait soupçonner. » (repris tel quel : « la moins soupçonneuse » voulait dire « la plus méfiante ») |
| `c04r-q6-quitter-la-ville-egare` | (aucun changement propre) | Couvert par `s6.question` (« sur la place ») comme le dit le verdict : le texte de réussite de Q5 (« Elle devait quitter la ville avec… la tarte. ») n'est pas modifié. |

### Adaptations (deux écarts au NOUVEAU TEXTE du verdict, imposés par le contrôle de largeur)
Le verdict annonçait « 3 lignes en 412 px ». À 390 et 412 px c'est exact, mais **à 360 px (et 375 px) les deux textes passaient sur 4 lignes**
(mesuré dans le panneau réel), alors que la consigne est ≤ 3 lignes à 390, 412 et 360 px. Adaptation minimale, vérifiée au pixel :
- `s4.question` : « … Retrouvez cette personne. » devient « … Retrouvez-le. » (−12 caractères). L'ancrage « vers la Grand-Place » est conservé.
  « quelqu’un » est masculin en français : « Retrouvez-le » est la tournure naturelle et ne dévoile rien de plus (le joueur voit Octave, un homme, au premier regard).
  Mesure : « Retrouvez cette personne. » = 4 lignes à 360 et 375 px ; « Retrouvez-le. » = 3 lignes à 360, 375, 390 et 412 px.
- `s6.question` : « Où est la tarte à présent, sur la place ? » devient « Où est la tarte, sur la place ? » (−10 caractères). « à présent » est déjà porté par « Mais Zita ne l’a plus ! ».
  Mesure : 141 caractères = 4 lignes à 360 et 375 px ; 131 caractères = 3 lignes à 360, 375, 390 et 412 px.

## Écarté / non traité
- `c04-couverture-q1-q2-non-evaluee`, `c04-q1-plaque-egout-petite-depart`, `c04-q4-tarte-10-px`, `c04-q4-indice1-apparence-sans-lieu`,
  `c04-q4-octave-vu-sans-tarte`, `c04-q6-leurres-glace-et-agent` : verdicts « aucun correctif » (limite d'outil, plaque visible dès le départ,
  tarte lisible à 1,6 donc agrandir le sprite exigerait `bounds.ts`, lieu volontairement réservé à l'indice 2, coup de théâtre voulu,
  pièges ambiants légitimes dont l'id ne peut pas porter de fausse piste).
- `c04r-q4-tarte-non-discriminante` et `c04-q5-leurre-dessert` : périmètre MONDE (`src/world/people.ts`), pas ici. Le texte de Q4/Q5 compense déjà
  (direction donnée), mais la recherche n'est vraiment équitable qu'une fois les tartes de la foule retirées.
- `c04-q5-erreur-sans-orientation`, `c04r-toast-pas-tout-a-fait-rotation` (`WRONG_MESSAGES[2]`), `c04-onglet-saute-vers-premiere-piste` : périmètre UI-1.
- `c04r-q5-camera-et-trait-rouge-sans-direction` : pas de recentrage automatique de la caméra (il montrerait la zone) ; la direction passe par le texte
  de réussite de Q4.
- `c04r-q2-sosie-ambiant-a-p-1480`, `c04r-q3-reponse-visible-des-q2` : reportés (DECISIONS.md) ; le rappel du sac dans l'indice 1 de Q2 aide déjà
  à écarter le sosie ambiant au bonnet orange.

## Vérifications
- **Panneau réel**, script Playwright hors dépôt (`scratchpad/c04-verify.mjs`, `?debug&case=c04`, vrais taps, 390×844, 412×915, 360×740, dpr 2) :
  chaque question, indice 1 et 2, fausse piste modifiée et carte de réussite lus et mesurés ; captures dans `.shots/c04-correcteur2/` (ignoré par git).
  - Questions : toutes ≤ 3 lignes aux trois largeurs (s4 : 3/3/3 ; s6 : 3/3/3 ; s2 : 2/2/3 ; s1 : 3/2/3 ; s3 : 2/2/2 ; s5 : 1/1/1).
  - Indice 1 de s2 : 4 lignes à 390 et 360, 3 à 412 (l'indice 2 qui l'accompagne tient aussi) ; le panneau ne masque pas la carte (captures relues).
  - Réussites : s2 4/4/4 lignes, s4 4 (360, 390) et 3 (412) lignes, comme les réussites d'origine de s1/s6 (4 lignes) : la feuille s'adapte, relue à 360 px.
  - Fausses pistes (s4 Picotin, s5 Octave.1, s5 Picotin.2) : 1 à 2 lignes. Aucune erreur console.
- **Pas de spoiler** : la question de Q4 donne une direction, pas Octave ; la réussite de Q4 donne « vers le nord », pas le café ; la question de Q6 dit « sur la place »
  sans nommer l'Hôtel de Ville, la police ni Picotin (l'indice 2 garde le lieu, la blague du nearMiss de Zita.2 reste intacte) ; les fausses pistes de Picotin en Q4/Q5
  ne disent plus où est la tarte.
- `npx tsc --noEmit` : OK. `npx vitest run` : 17 fichiers, 351 tests OK. `npm run content:check` : « OK : aucun problème. »
- `E2E_PORT=5195 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` : 1 test OK (1,5 min) ; c04 résolue au doigt en 13,2 s, 3 étoiles.

## Limites
- `docs/CONTENT.md` reprend encore les anciens textes tant que `npm run content:doc` n'est pas relancé (intégration).
- Sans le correctif MONDE (tartes de la foule), la dame au dessert reste un leurre proche d'Octave en Q4/Q5 ; ce journal ne le règle que par le texte.
- Le texte de réussite de Q5 (« Elle devait quitter la ville avec… la tarte. ») peut encore faire chercher loin ; seul l'énoncé de Q6 (« sur la place ») corrige le tir.
  À surveiller dans un prochain rejeu.
