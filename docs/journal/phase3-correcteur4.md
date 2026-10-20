# Phase 3 — correcteur 4 : trois amorces de lieu restantes après le rejeu à l’aveugle (c02 Q5, c03 Q3, bonus vers 9)

Source : `phase3-rejeu-c02.md`, `phase3-rejeu-c03.md`, `phase3-rejeu-bonus-aiguilles.md` (testeurs aveugles neufs). Périmètre : le **texte** de
trois enquêtes (`src/content/cases/c02.ts`, `c03.ts`, `bonus-aiguilles.ts`), plus le cadrage de départ de c02 (facultatif, appliqué) et le gabarit
`tools/content/CONTENT.template.md` (donc `docs/CONTENT.md`, régénéré). Aucun contrat touché, aucun id, aucune position d’entité, aucune
apparence, aucune règle modifiés ; aucune dépendance ajoutée ; rien de commité.

## Appliqué

| # | Où | Avant | Après |
|---|---|---|---|
| 1 | c02, `s4.solved` | « Au concours, devant le jury ! Duchesse s’est présentée toute seule, à l’heure. » | « … à l’heure. Barbarie, lui, a compris que la partie était perdue : il détale vers l’étang, Picotin aux trousses. » |
| 2 | c02, `s5.hints[0]` | « Il a filé vers le nord, là où les canards font la loi. » (seule source d’orientation, désormais redondante avec l’amorce) | « Pas sur la berge : il a pris le large, et les canards l’ont encerclé. » (apporte le **type** de la cible : sur l’eau, entourée de canards) |
| 3 | c02, `start` | `{ x: 5250, y: 980, zoom: 1.6 }` (Barbarie, cible de Q1, hors écran à droite) | `{ x: 5392, y: 955, zoom: 1.6 }` |
| 4 | c03, `s2.solved` | « … Un évanouissement bien commode. » | « … Un évanouissement bien commode. Pendant ce temps, Lapince s’éclipsait par les ruelles du sud. » |
| 5 | c03, `s3.hints[0]` | « Il est parti vers le sud, par les petites rues du quartier de la Gare. Le témoin est un client du bar Le Fer à Cheval. » (devenait redondant) | « Cherchez le bar Le Fer à Cheval, dans la rue du même nom : un client à casquette rouge y montre un coureur du doigt. » |
| 6 | bonus, vers 9 | « Aux jardins ouvriers, elle pousse devant la serre la plus au sud de toutes, juste à la sortie des parcelles. » | « Aux jardins ouvriers, elle pousse devant la serre du coin, là où le chemin des Arrosoirs rejoint celui des Serres. » |

Gabarit : `CONTENT.template.md` mis à jour (tableau du bonus, paragraphe « Un vers = un seul lieu », exemple de la règle 11.2.12 avec la règle « le critère
se vérifie à l’écran », ligne 2 du tableau 13.2, bullets c02 s4/s5/cadrage et c03 s3). `npm run content:doc` régénère `docs/CONTENT.md` : sa diff ne contient
que ces textes (cadrage, résolution s4, indice 1 s5 de c02 ; résolution s2 et indice 1 s3 de c03 ; vers 9 et son paragraphe ; bullets du gabarit).

### 1-2. c02 : où fuit Barbarie (Q5)
- L’amorce donne le **lieu** (« l’étang »), pas la réponse : ni le bateau, ni « LE BARON », ni « sur l’eau ». Elle pose aussi la prémisse de la Q5 (« Démasqué,
  Barbarie a pris la fuite pour échapper à Picotin » : Picotin est « aux trousses ») sans reprendre le mot « Démasqué » (déjà dans la question et la
  reconstitution : trois fois dans trois textes consécutifs aurait été lourd).
- L’indice 1 garde son rôle de palier payant : l’étang est connu, il dit désormais **quoi** chercher (pas sur la berge, sur l’eau : « pris le large » ; entouré :
  « les canards l’ont encerclé », ce que la scène montre : quatre canards autour du bateau). Il ne nomme pas le bateau et n’est pas la zone de l’indice 2
  (« Regardez au milieu de l’étang », zone inchangée).
- La fausse piste `z.etang` (« L’étang, oui. Mais où, au juste ? Cherchez ce qui flotte au milieu. ») est désormais le message que reçoit un joueur qui obéit à
  l’amorce et tape l’eau : cohérent, sans erreur comptée.
- **Question inchangée** : « Où s’est-il réfugié ? ». Toute précision (« sur quoi », « à bord de quoi », « dans quoi ») trahit le bateau ; « Où a-t-il trouvé
  refuge ? » ne change rien. Le défaut relevé (« où » ≠ toujours un lieu) est traité par l’amorce + l’indice 1, pas par la question.
- Cadrage de départ (facultatif) : appliqué. Mesure sur le vrai jeu, centre de la cible Q1 (`c02.barbarie.1`) en pixels d’écran, avant → après :
  390×844 : x 582 → 355 (hors écran → visible) ; 412×915 : x 593 → 366 ; 360×740 : x 567 → 340. La baronne (x 275 → 48 à 390, 33 à 360) et Picotin restent
  entiers à l’écran, le ponton aussi. Rien d’autre ne devient visible : Barbarie portant son carton (Q2, `c02.barbarie.2`) est sous le panneau (à 412×915
  son chapeau dépassait avec y 965 : y 955 l’a caché), le bateau de la Q5 est hors cadre (y d’écran −135 à 390×844), les canards de Q1 sont les bons, Lulu
  (fausse piste de Q1) est hors écran à droite. Q1 n’est pas « trop facile » : les cinq autres enquêtes ouvrent toutes sur leur première cible visible
  (mesure `worldToScreen` à 390×844 : c00, c01, c03, c04, c05), c02 était la seule exception. Écart avec la proposition du testeur (« décaler d’environ 100 px ») :
  100 px laissaient Barbarie hors écran (582 → 482) ; il fallait environ 230 px d’écran (≈ 145 u).

### 4-5. c03 : où file Lapince (Q3)
- L’amorce de la réussite de Q2 donne la **direction et le type de lieu** (« les ruelles du sud ») sans nommer le bar ni la rue. Comme la Q1 → Q2 et la Q3 → Q4 de
  c03, la fin du texte met la question suivante en place (premier défaut du testeur : « n’ouvre pas sur la question 3 »).
- L’indice 1 d’avant (« vers le sud, par les petites rues » + bar) aurait été redondant ; le nouveau donne **le bar, sa rue et le signe du témoin** : la rue porte le
  nom du bar (« Rue du Fer-à-Cheval », vérifié : `npm run world -- streets Fer`, axe y 2290, Lapince.1 en y 2267, donc sur la rue), ce que le testeur avait dû deviner
  par la pastille de lieu (« Le texte de l’indice ne dit pas “une rue porte aussi ce nom” »). Le témoin est décrit par ce que le dessin montre : casquette rouge
  (`cap` = rouge, contrôlé par `content:check`), bras tendu vers un coureur (pose `point`, regard à droite vers Lapince).
- Pas de spoiler : Q4 (le bateau de Lola) n’est pas évoqué ; la zone de l’indice 2 est inchangée (« Regardez devant la terrasse du Fer à Cheval »).
- La question de Q3 contient déjà « cheveux en épis » : inchangée.

### 6. Bonus, vers 9
- Mesures sur le monde : 33 serres ; `b.jardins.68` (2029, 4699, emprise 1994–2064 × 4655–4699) est à 85 u du carrefour du chemin des Arrosoirs (vertical, x 1955,
  de y 4010 à 4740) et du chemin des Serres (horizontal, y 4740, de x 350 à 2200), les deux voies s’arrêtant en T ; la serre suivante, `b.jardins.118`, est à 197 u,
  **dans** le carré des parcelles (qui s’arrête à x 1900). C’est aussi la serre la plus au sud (la suivante : 60 u plus haut), mais ce critère ne se vérifie pas à l’écran.
  Le testeur disait « angle sud-ouest » ; c’est en fait l’angle **sud-est** du carré des parcelles, mais l’angle nord-est du T des deux chemins (le verset ne cite plus de direction).
- Critère **vérifiable** : la pastille de lieu affiche les deux noms au carrefour. Mesure (camera centrée sur le carrefour, zoom 1,5, 390×844) :
  « Chemin des Arrosoirs / Chemin des Serres ». Le joueur cherche les deux chemins (comme il cherche « Pont Central » ou « capitainerie » pour les autres vers) et
  la serre « du coin » est la seule du carrefour. Capture : l’aiguille (trait doré) est devant la porte de la serre, sous la grande maison rose (détail vu par le testeur).
- Ton : même mécanique que les autres vers (jeu de mots + lieu) : « elle pousse » (jardin), « la serre du coin » (comme « le café du coin »), « Arrosoirs » et
  « Serres » (deux chemins aux noms de jardin). Pas de rime dans le poème (aucun vers ne rime) ; c’est le vers le plus long (114 caractères ; l’ancien en faisait 108,
  les autres 50 à 86) : 3 lignes de texte dans le carnet à 360 px (capture lue), le même nombre à 390 et 412 px.
- Contraintes de l’interface respectées : toujours 10 lignes = 10 réponses (`testamentVerses`, test `texts.test.ts`) ; l’extrait du toast reste « Aux jardins ouvriers »
  (première virgule, 20 caractères).

## Écarté

- **Reformuler « Où s’est-il réfugié ? »** (voir plus haut) : écarté, tout remplaçant précis trahit le bateau.
- Les autres « Où » dont la réponse n’est pas un lieu (c02 Q2 « Où l’emporte-t-il ? », Q4 « Où est Duchesse à présent ? ») : hors de la demande ; l’amorce et la feuille de
  confirmation (« Désigner ce véhicule / cet animal ? ») suffisent, les deux étapes ont été résolues sans erreur par les deux testeurs.
- **Q4 de c02, plusieurs canards jaunes** ; **minicarte**, **indice 1 payant du bonus**, **seuil « Rapprochez-vous »**, **vers résolus barrés** : propositions des testeurs hors périmètre
  (interface ou décisions de conception déjà prises : voir `phase3-bilan-rejeu.md`).
- **Bonus : vers 9 avec « la plus au sud »** conservé en second critère : écarté, la phrase serait encore plus longue (4 lignes) pour un critère que le joueur ne vérifie pas ; le
  carrefour nommé suffit.
- **c03 Q4 (« Qui, et comment ? »)**, **« béret » introuvable à l’écran (Q2)**, **personnage aux cheveux noirs en épis derrière une vieille dame (c03 parvis)** : points mineurs du
  testeur de c03, hors de la demande ; « béret » est bien dans l’apparence de Lola (`hat: 'beret'`), il se lit mal à ce zoom : texte non changé.

## Vérifications

### Lecture dans le jeu réel (Playwright tactile, `?debug&case=<id>`, 390×844, 412×915, 360×740 ; scripts dans le répertoire de session, hors dépôt)
Les étapes sont jouées au doigt (vol vers la cible, tap, « Désigner ») jusqu’à la question voulue ; lignes = hauteur de l’élément / interligne.

| Texte | 390×844 | 412×915 | 360×740 | Capture lue |
|---|---|---|---|---|
| c02 Q4, carte « Bien joué ! » (réussite) | 4 lignes, carte 230 px | 4 lignes, 230 px | 5 lignes, 254 px | 360×740 : texte entier, « Continuer » visible |
| c02 Q5, question (inchangée) | 2 lignes | 2 | 2 | |
| c02 Q5, indice 1 | 2 lignes | 2 | 2 | 360×740 : lisible au-dessus des boutons |
| c03 Q2, carte « Excellent ! » (réussite) | 6 lignes, carte 278 px | 5 lignes, 254 px | 6 lignes, 278 px | 360×740 : texte entier, « Continuer » visible |
| c03 Q3, question (inchangée) | 3 lignes | 3 | 3 | |
| c03 Q3, indice 1 | 3 lignes | 3 | 3 | 360×740 : lisible |
| Bonus, vers 9 (carnet, « Relire le testament ») | 3 lignes de texte | 3 | 3 | 360×740 |
| c02, cadrage de départ | cible Q1 à x 355 | x 366 | x 340 | les trois (une capture par taille lue) |

Textes de réussite plus longs : c03 s2 passe à 220 caractères et c02 s4 à 178 ; le plus long du jeu en compte 255 (c03 s4). Aucune carte ne déborde de l’écran, aucune ellipse.

### Cohérence texte ↔ dessin (captures au zoom de jeu)
- c02 : le bateau « LE BARON » porte Barbarie (bras levés, goutte de sueur) au milieu de l’étang, entouré de canards (les quatre de la scène) : « pris le large »
  et « les canards l’ont encerclé » sont ce qu’on voit. L’étang est bien le lieu de la fuite.
- c02 : un joueur qui obéit à l’amorce et touche l’eau, ou l’autre bateau de l’étang (« LA CANE », ambiant `a.v.21`), reçoit « Pas tout à fait… L’étang, oui. Mais
  où, au juste ? Cherchez ce qui flotte au milieu. » (fausse piste `z.etang`) : aucune erreur comptée (`totals().mistakes` = 0 mesuré).
- c03 : devant le bar Le Fer à Cheval (façade verte, parasol), le client en T-shirt orange à **casquette rouge** tend le bras vers le coureur blond en épis (haut rayé).
  La rue porte le nom du bar (pastille de lieu « Rue du Fer-à-Cheval »).
- c03 Q2 : Lola couchée porte bien un béret bordeaux sur ses cheveux roux (visible à partir du zoom 3 environ ; inchangé, voir « Écarté »).
- Bonus : au zoom 1,5 centré sur le carrefour, la pastille affiche « Chemin des Arrosoirs / Chemin des Serres » et l’aiguille 9 est visible devant la serre, sous la grande
  maison rose. Les tests du monde (`npm run world -- streets`, requête `near`) confirment 33 serres, `b.jardins.68` à 85 u du carrefour, la suivante à 197 u.

### Commandes
- `npx tsc --noEmit` : OK ; `npx tsc -p tools/content/tsconfig.json` : OK.
- `npx vitest run` : 17 fichiers, **367 tests verts** (dont `texts.test.ts` : 10 vers = 10 réponses, extraits courts).
- `npm run content:check` : **« OK : aucun problème. »**, mêmes 9 notes qu’avant (aucune nouvelle).
- `npm run content:doc` : `docs/CONTENT.md` régénéré ; diff = 59 lignes, uniquement : cadrage de c02 (fiche), bullets du gabarit de c02 (s4, s5, cadrage) et c03 (s3),
  réussite de c02 s4, indice 1 de c02 s5, réussite de c03 s2, indice 1 de c03 s3, vers 9 (briefing, tableau, paragraphe « Un vers = un seul lieu »), règle 11.2.12, ligne 2 du tableau 13.2.
- `E2E_PORT=5311 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts tests/e2e/06-parcours-console.spec.ts tests/e2e/07-corrections.spec.ts` : **15 tests verts** (2,2 min) ;
  les sept enquêtes sont résolues au doigt (c02 en 12,3 s, c03 en 12,6 s, bonus en 12,5 s).
- En plus : `03-erreurs-indices`, `08-retours-joueurs-ui`, `09-camera-marges` : 19 tests verts (1,6 min).

## Limites et points ouverts

- Un rejeu aveugle serait seul à dire si l’amorce de c02 suffit sans indice (l’indice 1 reste payant) et si « les ruelles du sud » de c03 mène à la rue du Fer-à-Cheval sans indice ;
  la lecture des captures dit seulement que la chaîne texte → lieu est cohérente. La Q3 de c03 reste la plus longue de l’enquête (le bar est à environ 470 u au sud-ouest du parvis).
- c02 : après l’amorce, le joueur peut encore toucher « LA CANE » (bateau ambiant blanc, vide) avant « LE BARON » : message `z.etang`, sans erreur ; pas de `nearMiss` propre
  (règle 11.2.10 : pas d’identifiant ambiant en fausse piste).
- c02 : le cadrage de départ dépend de la taille de l’écran (cible à 20 px du bord droit à 360 px). Un écran plus étroit (320 px) la couperait ; non mesuré.
- Bonus : le vers 9 est le plus long du testament (114 caractères). Le critère « du coin » suppose que le joueur reconnaisse le T des deux chemins ; il lui suffit de lire
  la pastille de lieu, qui nomme les deux chemins quand le centre de la carte les touche (zoom ≳ 1,5).

## Comment vérifier

```
npx tsc --noEmit && npx tsc -p tools/content/tsconfig.json
npx vitest run
npm run content:check            # « OK : aucun problème. »
npm run content:doc && git diff docs/CONTENT.md
E2E_PORT=5311 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts tests/e2e/06-parcours-console.spec.ts tests/e2e/07-corrections.spec.ts
```
À la main : `/?debug&case=c02` (cadrage de départ ; Q4 puis Q5 : carte de réussite et indice 1), `/?debug&case=c03` (Q2 puis Q3), `/?debug&case=bonus-aiguilles`
(« Relire le testament », puis centrer la carte sur x 1955, y 4700 au zoom 1,5 : la pastille nomme les deux chemins).
