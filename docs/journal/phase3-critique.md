# Phase 3 — agent `critique` : revue adverse des sept enquêtes

Date : 15/10/2026. Les enquêtes (`src/content/cases/*.ts`, bible dans `docs/CONTENT.md`) n'avaient jamais été
relues par un regard extérieur. Mission : essayer de **casser** chaque enquête et chaque étape (ambiguïté,
visibilité, logique, difficulté, textes, plaisir), preuves à l'appui, puis corriger directement.

Périmètre respecté : `src/content/cases/*.ts` (les 7 fichiers), `tools/content/CONTENT.template.md`,
`docs/CONTENT.md` (régénéré par `npm run content:doc`). `common.ts` et `meta.ts` n'ont pas eu besoin de
changer. Aucun contrat modifié, aucune dépendance ajoutée, rien de commité. Les ids d'entités et d'étapes
sont restés stables.

## Méthode

1. Lecture du code de chaque enquête, de `src/game/session.ts` / `validate.ts` (comment les indices, fausses
   pistes, `after`, `required` fonctionnent) et de `src/ui/format.ts` (la typographie française est ajoutée à
   l'affichage : `fr()` met l'espace insécable avant `: ; ? ! »` et après `«`, donc aucune espace insécable
   n'est saisie à la main dans les textes).
2. Captures de la vraie carte pour chaque scène (aperçu `tools/content/preview.html`, zoom 1,5 / 2 / 3, avec
   et sans étiquettes, projecteur de l'indice 2 via `hint=cXX.sN`), page de jeu pour les briefings.
3. Requêtes sur le monde (`streets`, `landmarks`, `near`, `rect`) et petits scripts d'analyse jetables
   (dans le dossier de travail, non conservés) :
   - voisins d'apparence les plus proches de chaque réponse (ambiguïté) ;
   - position du centre du projecteur de l'indice 2 par rapport à la réponse ;
   - pickabilité au centre de chacune des **130 cibles** (réponses + fausses pistes) ;
   - recensement des horloges (3), serres (33), bateaux, statues, aires de jeux, sables, passants à pose
     « bras levés » (aucun en ambiant) ;
   - vérification de ce que les textes affirment du décor (rues, hôpital « au sud », taxis, bus).
4. Preuves conservées : `docs/screenshots/critique-*.jpg` (6 planches).

## Ce qui a été trouvé et corrigé (22 familles de problèmes, détail dans `docs/CONTENT.md` § 13)

Majeurs :

- **Indice 2 quasi centré sur la réponse dans 31 étapes sur 31** (distance centre → réponse : médiane 23 %
  du rayon, minimum 3 %) : le palier « projecteur » valait la révélation. Centres décalés (25 à 64 u,
  médiane 43 % du rayon), réponse entière dans le cercle, vérifié sur planches. Règle § 11.2.8 mise à jour.
- **Bonus, deux vers ambigus** : « devant une serre » (33 serres) → vers précisé + aiguille 9 déplacée devant
  la serre la plus au sud ; « là où le temps a deux aiguilles » (3 horloges) → « là où l'on attend les
  trains » ; vers 6 précisé (« au parc »). Le parsing du testament par l'interface (10 lignes = 10 réponses)
  est inchangé.
- **c03** : question de s4 qui ne dit pas qui chercher parmi plusieurs bateaux (ambiants, dont un rouge) ;
  prémisse de s5 (chapeau volé) jamais amenée ; s6 sans discriminant dans la question ; indice « à côté des
  taxis » faux (aucun taxi) ; accroche incorrecte (« si ? »).
- **c04** : « cette nuit » contredit l'ordre des événements ; l'observation clé de s2 (quel jumeau tient le
  diamant) non plantée ; trois porteurs de tarte sans messages ; coïncidence « tombait à pic » remplacée par
  une motivation (Octave comptait simuler un cambriolage).
- **c01** : « cagoule » alors que le dessin est un masque de bandit ; « caisse sous le bras » alors que le
  voleur tient un sac d'argent à la main.
- **c02** : « barque / ramer » devant un bateau à moteur ; la baronne pointait le doigt à l'opposé du
  ravisseur (faux indice) → bras au ciel.
- **c00** : le coupable tombait du ciel → amorce loyale dans le briefing (« je suppose que c'est une
  coïncidence ») ; légende finale contradictoire avec l'épilogue.
- **c05** : « au sud-est » (hôpital au sud) ; questions de s3 et s4 qui ne donnaient aucun moyen de déduire
  le lieu sans indice.
- **34 fausses pistes ajoutées** (autres apparitions du bon personnage, personnages visibles dans la première
  image, canards autour du bateau, et, sur les questions « où ? », le lieu désigné par erreur : vitrine,
  Hôtel de Ville, kiosque, étang, cinéma, hôpital, musée…) : ces taps comptaient comme des erreurs et
  coûtaient des étoiles.

## Décisions

- Changements **minimaux et rétro-compatibles** : textes, positions de zones, une aiguille déplacée, une pose
  (baronne), des `nearMiss`. Les ids restent (`c02.barque`, `c01.caisse` gardent leur nom).
- Zones décentrées vers la scène précédente (sens narratif : le projecteur recouvre le chemin parcouru), avec
  un jeu libre = rayon − demi-diagonale de la réponse ; la moitié environ est utilisée.
- Pas de nouvelle mécanique : « variété des mécaniques » est noté en piste (aucune zone `z.*` en réponse).
- Le dessin ne change pas : c'est le texte qui s'aligne (« masque de bandit », « bateau », « sac d'argent »).

## Limites connues / restes

- `tools/content/gen.ts` (hors périmètre) imprime encore « cagoule / masque » dans les « signes distinctifs ».
- c05 : l'élimination est lisible mais courte ; difficulté 5 portée surtout par la distance et le nombre de
  fils parallèles (piste : second déguisement ou témoin qui se trompe).
- Textes qui citent du décor ambiant (bus vert de c03 s1, ambulances de c05 s2, ange du cimetière, serre
  `b.jardins.68`) : à revérifier si la graine de la ville change.
- Au zoom 1,5 le masque du voleur de c01 ne se lit pas (il se lit à partir du zoom 2) ; le sac d'argent et la
  course suffisent (le texte les cite).

## Comment vérifier

```bash
npx tsc --noEmit
npx vitest run                       # 299 tests
npm run content:check                # « OK : aucun problème. »
npm run content:doc                  # régénère docs/CONTENT.md (§ 13 = annexe « Revue critique »)
npm run build
E2E_PORT=5182 npm run e2e            # parcours complets des 7 enquêtes, indices, fausses pistes
# Voir un projecteur d'indice 2 sur la vraie carte :
node scripts/shot.mjs "/tools/content/preview.html?x=2840&y=2085&zoom=1.8&hint=c04.s3&only=c04&hud=0" .shots/x.png --width 360 --height 360 --dpr 1
```
