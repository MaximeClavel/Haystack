# Phase 3 — correcteur 2 : périmètre bonus (« Les Aiguilles du Fondateur »)

Périmètre : `src/content/cases/bonus-aiguilles.ts` et `tools/content/CONTENT.template.md`. Verdicts :
`scratchpad/fix/bonus-aiguilles.json` (+ `g-regle-etoiles-differente-selon-enquete` de `g-indices-et-etoiles.json`).
Référence : `scratchpad/bonus-fixes.patch` (seuls les blocs `bonus-aiguilles.ts` et `CONTENT.template.md` relus ; les blocs
`Investigation.tsx` et `Notebook.tsx` sont du périmètre UI-1).
Aucun contrat touché, aucun id, aucune position, aucune apparence modifiés ; aucune dépendance ajoutée ; aucune règle de jeu changée
(étoiles, paliers, désignation). Uniquement des textes (briefing, deux indices) et leur documentation.

## Appliqué

| Constat | Champ de `bonus-aiguilles.ts` | Nouveau texte |
|---|---|---|
| `bonus-vers-statue-sans-lieu` | `intro`, vers 2 | « Au parc qui porte mon nom, ma main levée en tient une, et ne la lâche pas. » (repris tel quel) |
| `bonus-vers-serre-ambigu` | `intro`, vers 9 | « Aux jardins ouvriers, elle pousse devant la serre la plus au sud de toutes, juste à la sortie des parcelles. » (repris tel quel ; commentaire de l'aiguille 9 aligné) |
| `bonus-indice1-generique-coute-une-etoile` + `bonus-bas-zoom-aiguille-invisible` | `s1.hints[0].text` | « Chaque quartier cache au moins une aiguille. Zoomez jusqu’à bien voir les passants : l’aiguille porte une étoile claire. » (**adapté**, voir plus bas) |
| `bonus-projecteurs-gratuits-apres-indice2` + `g-regle-etoiles-differente-selon-enquete` | `s1.hints[1].text` | « Le projecteur éclaire les environs d’une aiguille encore cachée ; une fois celle-ci trouvée, il passe à une autre. » (repris tel quel) |

`tools/content/CONTENT.template.md` (alimente `docs/CONTENT.md`, **non régénéré** ici : `npm run content:doc` se fait une fois à
l'intégration) :
- lignes 2 et 9 du tableau des vers : nouveaux vers ;
- § « Un vers = un seul lieu » : vers 9 mis à jour, `b.jardins.68` est la seule serre la plus au sud (la suivante est 60 u plus haut)
  mais hors du carré des parcelles ; avertissement : le correctif suggéré par le joueur (« la dernière serre de la rangée du bas »)
  désignerait `b.jardins.118`, à 240 u, donc faux ; justification du vers 2 ;
- nouveau paragraphe « Indices » : le palier 1 repose sur « 10 aiguilles pour 9 quartiers, au moins une par quartier » (à revoir si
  une aiguille change de quartier), l'échelle utile, le fait qu'il tienne en 3 lignes, la persistance du palier 2 voulue, le palier 3
  qui montre tout, et le coût en étoiles (3 → 2 → 1, plancher à 1) ;
- tableau « Problèmes corrigés » (§ 13.2, ligne 2) : citation du vers 9 mise à jour.

### Adaptation d'un texte (justifiée)
Le texte d'indice 1 du verdict (« Chaque quartier cache au moins une aiguille. Zoomez jusqu’à bien distinguer les passants : de près,
une aiguille d’or porte une petite étoile claire. », 149 caractères) tient sur 3 lignes à 412 px mais sur **4 lignes à 390 px et 360 px**
(mesuré dans le panneau réel, hauteur du `.hint-text` / 20 px de ligne), alors que la consigne impose ≤ 3 lignes aux trois largeurs
(l'ancien texte, 123 caractères, tenait sur 3 lignes partout). Variantes mesurées (lignes à 360 / 390 / 412 px) :

| Variante | Car. | 360 | 390 | 412 |
|---|---|---|---|---|
| verdict | 149 | 4 | 4 | 3 |
| « … bien voir les passants : de près, l’or porte une étoile claire. » | 123 | 4 | 3 | 3 |
| « … bien voir les passants : l’or y porte une petite étoile claire. » | 123 | 4 | 3 | 3 |
| « … bien voir les passants : de près, l’or brille d’une étoile. » | 119 | 3 | 3 | 3 |
| **« … bien voir les passants : l’aiguille porte une étoile claire. » (retenue)** | 120 | 3 | 3 | 3 |
| « … jusqu’à voir les passants : de près, l’or a une étoile claire. » | 114 | 3 | 3 | 3 |

Retenue : la plus claire des variantes qui tiennent en 3 lignes partout. Informations conservées : (1) au moins une aiguille par
quartier, (2) l'échelle utile (« bien voir les passants », environ zoom 2), (3) le signe distinctif (l'éclat blanc, une étoile claire,
vérifié sur capture à zoom 2,5 : trait doré avec une petite étoile blanche à son extrémité). Perdus : « de près » (déjà impliqué par
« zoomez ») et « petite » (l'étoile est effectivement petite, mais le mot coûtait une ligne).

## Écarté / non traité

- `bonus-parking-fausse-piste-police` (verdict « aucun » : fausse piste honnête, départageable par la livrée POLICE ; ne pas ajouter de
  `nearMiss`, une voiture civile désignée n'est de toute façon pas une réponse).
- `bonus-indice3-revele-toutes-les-aiguilles-sans-surcout` (décision de l'orchestrateur : garder la règle ; elle est documentée par le texte
  du palier 2 et le paragraphe « Indices » du modèle de documentation). Aucune règle changée.
- Du périmètre UI-1 (non touchés ici) : `bonus-fin-bande-noire`, `bonus-carnet-et-compteur-incoherents`,
  `bonus-carnet-personnages-identifies-toujours-vide`, `bonus-reussite-pauvre` (extrait du vers dans le toast),
  `g-voir-la-zone-cache-si-fiche-repliee-bonus`. Du périmètre UI-2 : `bonus-pastille-ne-nomme-pas-le-lieu-du-vers`.
- `g-regle-etoiles-differente-selon-enquete` propose pour le palier 2 « …, puis d’une autre à chaque aiguille trouvée. » ; j'ai gardé la
  formulation du verdict bonus (« …; une fois celle-ci trouvée, il passe à une autre. »), testée dans le prototype et plus claire à la
  lecture ; les deux disent la même chose et il ne faut qu'un seul texte.

## Vérifications

- Vrai jeu, `?debug&case=bonus-aiguilles` (Playwright, téléphone émulé, serveur Vite sur le port 5197), à **390×844, 412×915 et
  360×740** : briefing puis achat des indices 1 et 2 par de vrais taps. Hauteur des `.hint-text` : **3 lignes pour les deux textes à
  chacune des trois largeurs** (326, 348 et 296 px de large) ; panneau après l'indice 2 : 431 px sur 844, 431 sur 915, 454 sur 740 (la
  carte reste visible, la fiche d'indice est repliable). Captures dans `.shots/correcteur2-bonus/` (`brief-*.png`, `hint1-*.png`,
  `hint2-*.png`, `needle3-z2.5.png`). Le vers 2 tient sur 2 lignes dans le briefing à 360 px (vu sur capture) ; le vers 9, plus long, passe aussi à la ligne ; rien n'est coupé (le briefing défile déjà).
- Pas de spoiler : l'indice 1 donne de la méthode (au moins une aiguille par quartier, l'échelle, le signe distinctif) mais ne nomme ni
  lieu ni aiguille ; le vers 2 ancre « le parc qui porte mon nom » sans nommer la statue ; le vers 9 garde l'unicité (« la plus au sud
  de toutes ») sans désigner le carré des parcelles. « Chaque quartier » vérifié : `npm run world -- districts` donne 9 quartiers
  (`gare`, `parc`, `halles`, `centre`, `faubourg`, `arts`, `riviere`, `jardins`, `port`) et les 10 aiguilles tombent dans
  `gare, parc, halles, centre, faubourg, parc, arts, riviere, jardins, port` : les 9 sont couverts.
- `npx tsc --noEmit` : aucune erreur.
- `npx vitest run` : 17 fichiers, 351 tests verts.
- `npm run content:check` : « OK : aucun problème. »
- `E2E_PORT=5197 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts` : vert (1 passed, 1,4 min ; le bonus résolu au doigt en
  12 s, 3 étoiles). Un premier essai a échoué sur **c01** (« Cannot read properties of null (reading 'openSteps') », session absente
  pendant une résolution de c01) alors qu'un autre agent éditait le dépôt (rechargement à chaud de Vite) : relancé une minute plus tard,
  vert sans rien changer.
- `E2E_PORT=5197 npx playwright test tests/e2e/07-corrections.spec.ts -g M6` (testament du bonus : 10 vers, relisibles, cochés) : vert.

## Limites

- `docs/CONTENT.md` n'est pas régénéré (consigne) : il montre encore les anciens textes tant que `npm run content:doc` n'a pas été lancé
  à l'intégration.
- L'indice 1 coûte toujours une étoile (règle gardée) ; il apporte désormais un vrai conseil (méthode et échelle) au lieu de recopier le
  briefing.
- « Chaque quartier cache au moins une aiguille » devient faux si une aiguille est déplacée de façon à vider un quartier (noté dans le
  commentaire de `hints[0]` et dans la documentation).
- La difficulté de la chasse à bas zoom n'est pas changée (le dessin de l'aiguille reste petit, voulu) : le texte dit seulement l'échelle
  utile.
