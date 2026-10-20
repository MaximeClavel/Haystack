# Phase 3 — correcteur 2 : périmètre c01 (« La Main dans le sac »)

Périmètre : `src/content/cases/c01.ts` (seul fichier modifié). Verdicts : `scratchpad/fix/c01.json`.
Aucun contrat touché, aucun id, aucune position, aucune apparence modifiés ; aucune dépendance ajoutée. Uniquement des textes
(question, indice, réussite, fausse piste, légendes de la reconstitution) et un ordre (reconstitution).

## Appliqué

| Constat | Champ de `c01.ts` | Texte (repris tel quel du verdict) |
|---|---|---|
| `c01-q3-lieu-plus-loin-non-localisable` | `s3.question` | « Plus loin, à l’est du marché, le voleur marche les mains vides. Où a-t-il caché la caisse ? » |
| idem | `s3.hints[0].text` | « Il a traversé la rue des Étals, celle qui longe le marché. » (le « à la sortie est du marché » d'avant devenait redondant avec la question) |
| idem (option « gratuite » du verdict) | `s2.solved` | « Le voici, le sac de la recette à la main, qui fend la foule vers l’est, en direction de la rue des Étals. » |
| `c01-q3-file-cinema-compte-erreur` | `s3.nearMiss` (+ `c01.lafouine.3`) | « Vous l’avez retrouvé, mais c’est la caisse qu’on cherche. Revenez sur ses pas. » |
| `c01-replay-motus-apres-lafouine-et-sous-le-bras` | `replay[1]` et `replay[2]` permutés, légendes corrigées | 2/6 `c01.motus.1` : « Lafouine file devant Motus, le mime, qui ne dira rien — évidemment. » ; 3/6 `c01.lafouine.1` : « Il traverse le marché en courant, la caisse à la main. » |

### Vérifié sur les données avant d'écrire
- « celle qui longe le marché » est exact : la place des Halles (`z.halles`) couvre x 2500 à 3200 ; la rue des Étals est le rect
  `{3200, 0, 56, 1300}`, donc contre son bord est (`npm run world -- landmarks` / `streets`).
- La nouvelle fausse piste : `c01.lafouine.3` existe dans l'enquête, n'est ni ambiant ni dans `accept` de `s3` ; `content:check` l'accepte.
- La reconstitution suit maintenant le trajet réel du voleur (Rose x 2612, Motus x 2716, voleur x 2850, poubelle x 3250, …) : la caméra
  avance toujours vers l'est, au lieu de reculer à l'étape 3 (mesuré en jeu, voir plus bas).

### Pas de spoiler
- La question de Q3 ne nomme ni la poubelle ni la caisse cachée ; elle donne seulement le côté (« à l’est du marché »), la poubelle
  restant à trouver (voleur d'abord, cachette ensuite). L'indice 1 dit où est la rue des Étals sans nommer la cachette ; l'indice 2
  (palier suivant, inchangé) garde la zone du coin.
- La fausse piste de la file du Rex est muette sur le cinéma et sur la suite : elle ne gâche pas Q4 (« Le voleur fait la queue au
  cinéma Le Rex. Désignez-le. »). Elle confirme seulement ce que le joueur voit déjà (le personnage masqué est bien le voleur) et
  le renvoie vers la caisse.

## Écarté / non traité (« Aucun » dans DECISIONS.md)
- `c01-q3-consigne-en-deux-temps` : fonctionnement voulu et déjà accompagné (fausses pistes sur `lafouine.1` et `lafouine.2`) ; le
  correctif de lieu suffit, ajouter « Désignez l'endroit où… » casserait la tournure habituelle « Où … ? ».
- `c01-q2-marche-trop-grand-sans-zone`, `c01-q2-q3-sacs-minuscules`, `c01-bulles-attirent-l-oeil`, `c01-q3-reussite-seance` : aucun
  correctif (verdicts « partiel »/« non » sans changement recommandé : difficulté 1 résolue sans indice, agrandir le sac imposerait
  `bounds.ts`, bulles d'ambiance volontaires, « séance » est un clin d'œil narratif sans spoiler).
- Option « vers l'est » en Q1 (`s1.solved`, citée dans `c01-q2-marche-trop-grand-sans-zone`) : non appliquée ; le verdict ne la
  recommande pas (« aucun correctif nécessaire ») et elle rendrait l'indice 1 de Q2 en partie redondant.

## Vérifications

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | passe (aucune sortie) |
| `npx vitest run` | 17 fichiers, 329 tests passent |
| `npm run content:check` | `OK : aucun problème.` (la seule note c01 : « `c01.poubelle` recouvert à 28 % par `c01.caisse` », préexistante et voulue) |
| `E2E_PORT=5192 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` | 1 test passé (1,5 min) ; c01 résolue au doigt avec 3 étoiles (le test impose `stars === 3` et l'image « 3 étoiles sur 3 » dans les dossiers) |

### Contrôle en jeu réel (script Playwright hors dépôt, Pixel 7 émulé, `?debug&case=c01`)
Script : `scratchpad/c01/verify.mjs` (serveur Vite propre, vrais taps, vrai panneau, partie jouée jusqu'à la reconstitution). Captures
brouillons dans `.shots/c01-correcteur2/` (`<largeur>x<hauteur>-0N-….png` et `report.json`). Lignes mesurées dans le DOM
(390×844 / 412×915 / 360×740) :

| Texte | lignes |
|---|---|
| question de Q3 (modifiée) | 2 / 2 / 3 |
| indice 1 de Q3 (modifié) | 2 / 2 / 2 |
| indice 2 de Q3 (inchangé) | 2 / 2 / 2 |
| fausse piste de la file du Rex (nouvelle) | 2 / 2 / 2 |
| carte « Excellent ! » de Q2 (modifiée) | 3 / 2 / 3 |
| carte de réussite de Q3 (inchangée) | 3 / 3 / 3 |
| légendes de la reconstitution (modifiées) | 2 / 2 / 2 |
| question de Q2 (inchangée, pour mémoire) | 3 / 3 / 4 |

- Tout texte modifié tient en ≤ 3 lignes sur les trois largeurs ; aucun ne défile (`scrollHeight <= clientHeight`) ; aucune erreur console.
- Q3 : au départ de la question, le voleur de Q2 est visible au-dessus du panneau (panneau à y = 667 / 738 / 540, voleur à
  y ≈ 309 / 344 / 245). Le panneau ne masque rien.
- La nouvelle fausse piste ne compte pas d'erreur : `session.totals().mistakes` vaut 0 avant et après le tap sur `c01.lafouine.3`
  en Q3 (aux trois tailles). Captures regardées : question de Q3 et fausse piste à 360 px, indice 1 à 390 px.
- Reconstitution : caméra aux six étapes x = 2612, 2716, 2850, 3250, 3302, 3535 (croissante) ; avant correction, 2/6 était à x 2850
  puis 3/6 à x 2716.
- Étoiles du passage de contrôle : 2 (deux indices volontairement pris pour afficher les textes), sans rapport avec la correction.

## Limites
- **`docs/CONTENT.md` n'est pas régénéré** (`npm run content:doc`, fait une seule fois par l'intégration) : il cite encore les anciens
  textes de Q3 (question, indice 1, réussite de Q2) et l'ancien ordre/légendes de la reconstitution. `tools/content/CONTENT.template.md`
  n'a pas besoin de modification pour c01 (sa « vérité » dit déjà « traverse le marché en courant vers l’est, devant Motus » ; ses
  mentions de « caisse sous le bras » sont des exemples de règle et l'historique d'une correction passée).
- Le fond du problème (la rue des Étals et la rue du Cinéma n'ont aucune plaque lisible ; `placeName` affiche « Les Halles » sur la
  rue) n'est pas traité ici : c'est le thème transversal des noms de rues (périmètre UI-2, constat `g-noms-de-rues-absents-c01`).
  Le texte de Q3 fonctionne sans lui.
- Un joueur qui file vers l'est après avoir lu « à l'est du marché » verra plus tôt la file du Rex ; taper le voleur masqué de la file
  en Q3 donne maintenant une fausse piste orientante sans erreur (au lieu d'une erreur simple comptée).
