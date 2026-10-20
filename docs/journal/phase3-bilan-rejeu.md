# Phase 3 — Bilan : avant / après les corrections issues des joueurs test

Méthode : à chaque passage, un **testeur aveugle** différent (il ne connaît ni les réponses, ni le code, ni les comptes rendus des
autres ; il ne voit que des captures d'un téléphone émulé et agit au doigt, voir `tools/playtest/README.md`). Premier passage :
`phase3-joueur-<enquête>.md`. Passage après corrections : `phase3-rejeu-<enquête>.md`. Corrections intermédiaires : triage et vérification sur
le vrai jeu des remarques (`phase3-arbitrage-orchestrateur.md`), 12 correcteurs (`phase3-correcteur2-*.md`), deux relectures
indépendantes, un lot final (`phase3-correcteur3-*.md`).

## Résultats

| Enquête | Avant : commandes · minutes · erreurs · indices · étoiles | Après : commandes · minutes · erreurs · indices · étoiles |
|---|---|---|
| c00 Tutoriel | 70 · 4,1 · 0 · 0 · 3★ | **22 · 2,1** · 0 · 0 · 3★ |
| c01 La Main dans le sac | 106 · 7,9 · 0 · 1 · 2★ | **56 · 4,9** · 0 · **0** · **3★** |
| c02 Coin-coin ! | 106 · 7,9 · 1 · 0 · 3★ | 93 · 9,2 · 0 · 1 · 2★ |
| c03 La Belle Évasion | 162 · 11,4 · 0 · 0 · 3★ | 116 · 11,3 · 0 · 1 · 2★ |
| c04 La Grande Paille | 295 · 21,0 · 2 · 5 · 2★ (second testeur : 138 · – · 3 · 4 · 2★) | **143 · 11,6** · 1 · 4 · 2★ |
| c05 Rideau ! | ≈ 250 (648 bruts dont ≈ 400 taps de sondage) · 24,0 · 0 · 6 · 2★ | **143 · 10,7** · 0 · **0** · **3★** |
| Bonus Les Aiguilles du Fondateur | 536 · 19,8 · 0 · 2 · 1★ | **195 · 14,1** · 0 · 2 · 1★ |
| **Total commandes** | ≈ 1 525 | **768** (−50 %) |

Lecture honnête : un testeur par enquête et par passage, donc beaucoup de variance (le premier testeur de c02 avait eu de la chance en
croisant le bateau de Q5 à la Q2 ; le second de c03 a eu besoin d'un indice à la Q3 que le premier avait évité grâce à un témoin).
Les gains les plus nets sont là où les constats étaient clairs : c00 (le signalement du livreur), c01 (la Q3 sans repère), c05 (les indices
redondants et le bateau non nommé), le bonus (vers ambigus, noms de lieux dans la pastille). Deux enquêtes (c02, c03) sont passées de
« 0 indice » à « 1 indice » : la cause est identifiée (Q5 de c02 et Q3 de c03 n'ont pas d'amorce de lieu dans la réussite de l'étape
précédente) et traitée par le lot final (`phase3-correcteur4.md`).

## Ce qui reste difficile par construction
- **c04** (difficulté 4) : le voisin à la tarte et les jumeaux se cherchent dans la foule de la Grand-Place ; la cible mesure 8 à 25 px. Les
  deux testeurs ont demandé 4 indices ; le texte annonce clairement le coût (2★). Jugé acceptable pour une enquête difficile.
- **Bonus** : 10 aiguilles de 8 px dans toute la ville ; 1★ dès l'indice 2 (règle gardée, expliquée dans le texte du palier 2).
- **Tutoriel** : n'enseigne pas le pincer ni le glisser (le cadrage de départ contient toutes les cibles) ; les boutons Minicarte, Punaise
  et Indice ne sont pas expliqués. Piste pour plus tard.

## Autres constats des rejeux (non traités, mineurs)
- La minicarte ne montre que les quartiers (décision : pas de noms de lieux, cela donnerait l'indice 2 gratuitement) ; la pastille de
  lieu en haut à gauche (avec les noms de rues) a été citée comme l'outil de repérage qui a sauvé plusieurs recherches.
- Le panneau de question replié tronque l'énoncé avec une ellipse (critères distinctifs masqués quand on cherche).
- « Rapprochez-vous pour désigner » : seuil de zoom invisible, recentrage qui déplace la cible (reporté : `g-seuil-designation-sans-tolerance`).
- Plusieurs canards jaunes identiques en c02 Q4 (voulu : fausses pistes gratuites qui orientent).
