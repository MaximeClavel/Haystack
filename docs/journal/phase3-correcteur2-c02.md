# Phase 3 — correcteur 2 : périmètre c02 (« Coin-coin ! »)

Périmètre : `src/content/cases/c02.ts` (seul fichier de code modifié). Verdicts : `scratchpad/fix/c02.json` et
`scratchpad/fix/g-fil-rouge-et-fausses-pistes.json` (id `g-message-erreur-transitoire-c02`).
Aucun contrat touché, aucun id, aucune position, aucune apparence modifiés ; aucune dépendance ajoutée.
Uniquement des textes (briefing, question) et des fausses pistes (`nearMiss`) sur des entités déjà présentes dans l'enquête.

## Point de départ : la première tentative (interrompue)

Une première tentative, interrompue par une limite d'usage, avait déjà modifié `c02.ts` ; ses changements ont été sauvegardés dans le
commit intermédiaire `356f00f` (aucun compte rendu n'avait été écrit). Je les ai relus un par un contre les verdicts
(`git show HEAD -- src/content/cases/c02.ts`) : **tous sont conformes**, au mot près, et sans doublon de `nearMiss`
(chaque `id` n'apparaît qu'une fois par étape). Je les ai donc gardés, puis complété et vérifié le reste en jeu réel.

## Appliqué

| Constat | Champ de `c02.ts` | Texte |
|---|---|---|
| `c02-q2-faux-bateau-le-baron` (+ `g-message-erreur-transitoire-c02`, un seul jeu de fausses pistes) | `s2.nearMiss` + `c02.barbarie.3` | « C’est bien Barbarie, mais les bras en l’air et sans carton : ce n’est pas ce moment-là de l’histoire. Suivez plutôt le carton. » (repris tel quel) |
| idem | `s2.nearMiss` + `c02.barque` | « Barbarie est à bord… mais les bras en l’air et sans carton : ce n’est pas ce moment-là de l’histoire. Suivez plutôt le carton. » (**une adaptation**, voir plus bas) |
| `c02-q2-enonce-sans-nature-de-cible` | `s2.question` | « Barbarie a fourré Duchesse dans un carton et s’en va avec. Où l’emporte-t-il ? » (repris tel quel ; pas de « (un véhicule) », qui viderait l'indice 2) |
| `c02-s5-camionnette-sans-fausse-piste` | `s5.nearMiss` + `c02.camionnette` | « Sa camionnette est vide, portière grande ouverte : Barbarie n’est plus dans les parages. » (tel quel ; aucune direction, réservée à l'indice 1 de Q5) |
| idem (la partie s3 du verdict) | `s3.nearMiss` + `c02.camionnette` | « Elle est vide, justement. Qui a ouvert la portière ? » (tel quel) |
| briefing « votre coéquipier Picotin » (facultatif, retenu par DECISIONS.md ; volet de `c02-picotin-et-baronne-non-identifies`) | `intro` | « …au pied du ponton, avec votre coéquipier Picotin. Elle offre… » (le rôle « votre coéquipier » est déjà celui de `c02.picotin`) |

### Adaptation unique par rapport aux textes des vérificateurs
Fausse piste `c02.barque` : « Barbarie est **bien** à bord… » devient « Barbarie est à bord… ». Raison : la consigne impose ≤ 3 lignes dans
le panneau ; avec « bien », la carte tombait sur **4 lignes à 360 px** (le mot « carton. » seul sur la dernière ligne), alors que
`c02.barbarie.3` (texte voisin, un peu plus court) tient sur 3. Quatre variantes ont été essayées en jeu réel à 360, 390 et 412 px
(sans « bien », sans « et », « pas ce moment-là », « y est bien ») : toutes tiennent sur 3 lignes ; j'ai gardé la plus proche du verdict
(un seul mot retiré, sens et voix conservés, la conjonction « mais » porte déjà la nuance).

### Pas de spoiler (contrôle des paliers d'indice)
- Les deux fausses pistes de s2 disent seulement que ce n'est pas le moment du rapt (« les bras en l'air et sans carton ») et renvoient
  vers le carton. Elles ne disent ni « plus tard » ni « sur ce bateau » : le bateau n'est pas désigné comme le refuge de Q5, la
  déduction de la dernière question (« c'est donc ça, le bateau ») reste entière. Le bateau n'est jamais nommé ; « Barbarie est à bord »
  décrit seulement ce que le joueur a sous les yeux.
- La question de s2 ne cite ni véhicule ni direction : l'indice 1 (l'allée vers le boulevard) et l'indice 2 (« un véhicule à son nom »)
  gardent toute leur valeur. Elle ajoute seulement la dynamique « s'en va avec », donc le fil à suivre (Barbarie portant le carton).
- La fausse piste de la camionnette en s3 ne fait que reprendre le fait établi par la question (« la camionnette est vide ») ; celle de
  s5 dit seulement que Barbarie n'est plus là, sans « nord » ni « étang » (indice 1) ni « milieu de l'étang » (indice 2).
- Les ids ne bougent pas et l'unicité de la désignation est intacte : `c02.barque` et `c02.barbarie.3` ne sont dans aucun `accept` de
  s2 ; `c02.camionnette` n'est dans aucun `accept` de s3 ni de s5. Une fausse piste ne compte pas comme une erreur (règle du jeu,
  inchangée) : le piège du bateau devient gratuit, comme l'est déjà celui de `barbarie.1` / `barbarie.2` en s5.

## Écarté / non traité

| Constat | Raison |
|---|---|
| `c02-q2-inscription-camionnette-petite` | Verdict « aucun » : l'enseigne ne sert qu'à confirmer, le fourgon est seul de sa zone et reconnaissable dès le dézoom. Raccourcir le `label` ou toucher `vehicle.ts` toucherait l'art de tous les fourgons étiquetés (et diverge du texte de réussite de Q2). |
| `c02-q4-trois-canards` | Verdict « aucun » : voulu (trois moments de Duchesse), se tromper est gratuit (fausses pistes sur `duchesse.1`, `.2`, `.3`) ; « à l'heure du concours » reprendrait l'indice 1 et donnerait la réponse. |
| `c02-q1-baguette-seconde-personne` | Verdict « aucun » : la porteuse de baguette est une passante ambiante à 790 px de la cible ; la pose accroupie et le canard doré distinguent Barbarie. |
| `c02-picotin-et-baronne-non-identifies` | Verdict « aucun » hors la phrase facultative du briefing (appliquée ci-dessus). Le carnet ne liste que les personnages trouvés comme réponses : fonctionnement voulu. |
| `c02-bulles-identiques-sans-sens` | Verdict « aucun » : ambiance voulue ; y toucher changerait la génération du monde. |
| `g-message-erreur-transitoire-c02` — durée du toast d'erreur (1800 → 2600 ms, `src/ui/App.tsx`) | Hors périmètre (fichier de l'agent UI) et facultatif dans le verdict. La cause racine (le leurre du bateau n'avait aucune fausse piste) est traitée par les deux entrées de `s2.nearMiss`. |

## Vérifications

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | passe (aucune sortie) |
| `npx vitest run` | 17 fichiers, 351 tests passent |
| `npm run content:check` | `OK : aucun problème.` (aucune fausse piste masquée ni occultée ; notes préexistantes c01, c04, c05 seulement) |
| `E2E_PORT=5193 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` | 1 test passé (1,5 min) ; c02 résolue au doigt en 10,9 s, 3 étoiles (le test impose `stars === 3`) |

### Contrôle en jeu réel (Playwright hors dépôt, Pixel 7 émulé, `?debug&case=c02`)
Scripts : `scratchpad/c02v/verify.mjs` (partie complète au doigt : briefing, Q1 à Q5, fausses pistes tapées, fin), `variants.mjs` (essai des
variantes du texte du bateau), `q2start.mjs` (départ réel de Q2 : panneau et cibles). Captures brouillons dans `.shots/c02-correcteur2/`
(`<largeur>x<hauteur>-0N-….png`, `report.json`). Lignes mesurées dans le DOM (390×844 / 412×915 / 360×740) :

| Texte | lignes |
|---|---|
| question de Q2 (modifiée) | 2 / 2 / 3 (avant : 2 / 2 / 2) |
| fausse piste du Barbarie sur le bateau, `c02.barbarie.3` (nouvelle) | 3 / 3 / 3 |
| fausse piste du bateau, `c02.barque` (nouvelle, adaptée) | 3 / 3 / 3 (4 à 360 px avant adaptation) |
| fausse piste de la camionnette en Q3 (nouvelle) | 2 / 1 / 2 |
| fausse piste de la camionnette en Q5 (nouvelle) | 2 / 2 / 3 |
| briefing (« votre coéquipier Picotin ») | tient sans défilement aux trois largeurs, bouton « Commencer l’enquête » visible |

- Aucun texte ne défile (`scrollHeight <= clientHeight`) ; aucune erreur console ni exception de page, aux trois tailles.
- Aucune des quatre fausses pistes ne compte d'erreur : `session.totals().mistakes` vaut 0 avant et après chaque tap ; la partie finit à
  0 erreur, 3 étoiles, aux trois tailles. Les cartes « Pas tout à fait… » persistent jusqu'à « Compris » (anneau orange, pas de toast).
- Départ réel de Q2 (caméra recentrée par le jeu sur la zone libre au-dessus du panneau) : à 360×740 le panneau monte de 563 à 540 px
  (une ligne de plus) ; Barbarie portant le carton reste à y = 495 et le chef Bigarade à y = 455, donc au-dessus du panneau : la carte
  n'est pas masquée. À 390 et 412 px la question reste sur 2 lignes (panneau inchangé).

## Limites
- À 360 px, la question de Q2 se coupe au trait d'union (« …Où l’emporte-t- / il ? ») : 3 lignes, donc dans la limite, mais un « il ? »
  orphelin ; je n'ai pas modifié le texte du verdict pour cela (cosmétique, uniquement à cette largeur). À 320 px (hors cibles), les
  fausses pistes du bateau passent sur 4 lignes ; non traité (la consigne vise 360, 390, 412).
- `docs/CONTENT.md` n'est pas régénéré ici (consigne : `npm run content:doc` se lance une seule fois à l'intégration). Il cite encore l'ancien
  briefing (« avec Picotin », ligne 483) et l'ancienne question de Q2 (ligne 598) ; il devra recevoir : la nouvelle question de s2, les deux
  fausses pistes de s2 (`c02.barbarie.3`, `c02.barque`), celles de la camionnette en s3 et s5 et la phrase du briefing.
- Une fausse piste n'étant pas comptée comme erreur, un joueur qui sonde le bateau en Q2 apprend que cette scène est « un autre moment de
  l'histoire » : la surprise de Q5 est un peu atténuée (le bateau n'est pas nommé comme refuge), mais pas supprimée. Compromis assumé par
  le verdict.
