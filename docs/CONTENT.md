# Haystack — Bible et guide des enquêtes

> **Document généré.** Ne pas modifier `docs/CONTENT.md` à la main : éditer le gabarit
> `tools/content/CONTENT.template.md` (récit, bible, règles) et/ou les enquêtes
> `src/content/cases/*.ts` (données du jeu), puis lancer `npm run content:doc`.
> Tous les tableaux techniques (fiches, personnages, entités, étapes, récapitulatif) sont produits à
> partir du code des enquêtes, lui-même vérifié contre la vraie ville par `npx tsx tools/content/check.ts`
> (validateur officiel `validateAllCases` + règles de la bible). Ce qui est écrit ici est donc ce qui
> marche.

## Sommaire

0. [Mode d’emploi](#0-mode-demploi)
1. [La bible de Meulebourg](#1-la-bible-de-meulebourg)
2. [Vue d’ensemble des enquêtes](#2-vue-densemble-des-enquêtes)
3. [c00 — La Tarte de bienvenue (tutoriel)](#3-c00--la-tarte-de-bienvenue-tutoriel)
4. [c01 — La Main dans le sac](#4-c01--la-main-dans-le-sac)
5. [c02 — Coin-coin !](#5-c02--coin-coin-)
6. [c03 — La Belle Évasion](#6-c03--la-belle-évasion)
7. [c04 — La Grande Paille](#7-c04--la-grande-paille)
8. [c05 — Rideau !](#8-c05--rideau-)
9. [Bonus — Les Aiguilles du Fondateur](#9-bonus--les-aiguilles-du-fondateur)
10. [Récapitulatif de toutes les entités](#10-récapitulatif-de-toutes-les-entités)
11. [Comment écrire une nouvelle enquête](#11-comment-écrire-une-nouvelle-enquête)
12. [Limites connues et points d’attention](#12-limites-connues-et-points-dattention)
13. [Annexe — Revue critique](#13-annexe--revue-critique)

---

## 0. Mode d’emploi

**Pour qui ?** Les agents qui implémentent les enquêtes (`src/content/cases/<id>.ts`), ceux qui les
vérifient, et quiconque veut en écrire de nouvelles.

**Les enquêtes sont du code.** Chaque enquête est un `CaseDef` complet dans `src/content/cases/<id>.ts`,
enregistré dans `src/content/index.ts` (`CASES`). L'apparence du brigadier Picotin (personnage récurrent)
est dans `src/content/common.ts` ; les familles de sosies volontaires et les personnages récurrents
(utilisés par le contrôle) dans `src/content/meta.ts`. Les tableaux de ce document sont générés à partir
de ce code : ils sont toujours exacts.

**Outils du scénariste** (tous dans `tools/content/`, hors du build) :

| Commande | Rôle |
|---|---|
| `npm run content:check` (ou `npx tsx tools/content/check.ts --verbose`) | construit la ville AVEC les enquêtes, lance `validateAllCases`, puis les règles de la bible : hors chaussée, 80 u entre enquêtes, écarts d’apparence (≥ 3 attributs saillants sauf sosies déclarés), figurants, sosies ambiants, rayons d’indice, occultation des réponses |
| `npx tsx tools/content/probe.ts x,y [x,y…]` | pour chaque point : sol, praticable, passage piéton, caché par un toit, bâtiment, entités ambiantes à moins de 16 u |
| `node scripts/shot.mjs "/tools/content/preview.html?x=…&y=…&zoom=2&ids=1&only=c03" .shots/x.png` | aperçu de la ville avec les enquêtes ; `ids=1` étiquette les entités d’enquête, `threads=c03` trace les fils rouges, `hint=c03.s4` allume le projecteur de l’indice 2, `mark=id1,id2`, `grid=50` |
| `npm run content:doc` | régénère ce document |
| `npx tsc -p tools/content/tsconfig.json` | vérification des types des outils |

Captures de référence : `tools/content/captures/` (une planche par enquête, au zoom de jeu).

---

## 1. La bible de Meulebourg

### 1.1 Le ton

- **Polar léger, ambiance Cluedo.** Des crimes de bande dessinée : on vole des caisses, des canes et des
  diamants ; on s’évade en pyjama rayé ; il y a **un seul meurtre** dans tout le jeu (c05), sans une goutte
  de sang : la victime est allongée, yeux en croix (`emote: 'ko'`), et l’on parle de « camomille ».
- **L’humour naît de l’observation** : le voleur qui fait la queue au cinéma en masque de bandit, l’épouvantail qui
  transpire, le policier qui croque le diamant. Chaque enquête a au moins un gag **visible** sur la carte,
  pas seulement dans le texte.
- **Les textes sont courts.** Une question tient en une ou deux phrases ; une résolution en deux ; un
  briefing en trois ou quatre paragraphes, signé de la commissaire.
- **Jeux de mots sur le foin, la meule, la paille et l’aiguille**, sans en abuser (un ou deux par enquête).

**Lexique maison** (à piocher) : *chercher une aiguille dans une botte de foin* ; *être sur la paille*
(ruiné — le bijoutier de c04) ; *une paille* (défaut d’un diamant — la « Grande Paille ») ; *homme de paille*
(prête-nom) ; *feu de paille* ; *tirer à la courte paille* ; *faire du foin* (du scandale) ; *avoir du foin
dans ses bottes* (être riche) ; *coucher sur la paille* (en prison) ; *séparer le bon grain de l’ivraie* ;
*un picotin* (la ration d’avoine du cheval — d’où l’appétit du brigadier) ; *un fétu* (un brin de paille).

### 1.2 Meulebourg

Capitale (autoproclamée) du foin, bâtie sur la Fenaison. La légende veut que son fondateur, **Hector
Meule**, ait perdu une aiguille d’or dans une botte de foin et décidé de construire la ville autour pour
la chercher plus confortablement. Sa statue se dresse au Parc des Meules, la main levée (elle tient
d’ailleurs une aiguille : voir le bonus). Devise de la ville : **« Brin à brin. »**

| Quartier (`DistrictId`) | Ambiance | Lieux remarquables | Enquêtes |
|---|---|---|---|
| Quartier de la Gare (`gare`) | voyageurs, taxis, valises ; petites rues ouvrières à l’ouest, voie ferrée | Gare (grande horloge), parvis, Grand Hôtel, bar Le Fer à Cheval, Garage Pistons | c03, bonus |
| Les Halles (`halles`) | le marché : étals rayés, cagettes, foule très dense | place des Halles, Boulangerie Lemiel, Boucherie Tendron, cinéma Le Rex | c01, bonus |
| Vieille Ville (`centre`) | pavés, administrations, commerces chics | Grand-Place et fontaine, Hôtel de Ville, Café du Centre, Banque Dufric, église Saint-Foin, bijouterie Carat, commissariat, pharmacie, poste, fleuriste, librairie | c00, c04, bonus |
| Le Faubourg (`faubourg`) | quartier populaire, école, chantier | école Jules-Botte et sa cour, Chantier de la Tour | c04 (Lino), bonus |
| Parc des Meules (`parc`) | promeneurs, chiens, canards | étang aux Canards et ponton, kiosque à musique, Statue du Fondateur, aire de jeux ; le boulevard des Halles le traverse | c02, bonus |
| Quartier des Arts (`arts`) | culture et blouses blanches | Musée des Beaux-Arts, Théâtre de la Botte, hôpital Sainte-Paille, cimetière | c05, bonus |
| La Fenaison (`riviere`) | la rivière, ses quais et ses bateaux | Pont Central, Pont du Parc | c03, c05, bonus |
| Les Jardins (`jardins`) | pavillons et jardins ouvriers | jardins ouvriers (parcelles, cabanes, serres) | c03, bonus |
| Le Port (`port`) | dockers, grues, caisses, bateaux à quai | quais du port, capitainerie, entrepôts | c05, bonus |

Noms propres déjà établis par la ville (à respecter) : boulangerie **Lemiel**, boucherie **Tendron**,
banque **Dufric**, bijouterie **Carat**, fleuriste **Pétale**, librairie **Le Marque-Page**, église
**Saint-Foin**, hôpital **Sainte-Paille**, théâtre **de la Botte**, école **Jules-Botte**. Les enseignes de
ces lieux sont uniques en ville (le générateur ne les réutilise jamais) : une question peut dire « la
boulangerie » sans ambiguïté.

### 1.3 Personnages récurrents

**La commissaire Odile Fétu** — petite, sèche, toujours un brin de paille au coin des lèvres (d’où son
surnom, « le Fétu »). Elle n’apparaît pas sur la carte : c’est la **voix des briefings**, qu’elle signe
« — Commissaire Odile Fétu ». Phrases courtes, ironie à froid, aucune patience pour les adjectifs.
C’est son chien, Croquette, qui mange la tarte du tutoriel.

**Le brigadier Gaston Picotin** — le coéquipier du joueur. Grand cœur, gros appétit, aucune malice.
Il apparaît **dans chaque enquête**, en général au point de départ (c’est le « vous êtes ici » du
joueur), toujours en train de manger, de prendre des notes ou de transpirer. Il n’est **jamais
coupable** ; il peut être une réponse (c00 s1, c04 s6) et il est souvent une fausse piste aimable
(`nearMiss` dans la première étape).

Apparence de Picotin (identique dans toutes les enquêtes ; une `CharacterDef` par enquête, d’id
`<enquête>.picotin`, toutes avec `PICOTIN` de `common.ts`) :

| skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `light` | `short` | `red` | `police` | `uniform` | `blue` | `plain` | `shorts` | `beige` | `mustache` | `scarf` | `large` |

Pourquoi ce costume : les agents ordinaires du générateur portent l’uniforme **marine** et un pantalon
marine, sans accessoire. Picotin (uniforme **bleu**, **bermuda beige**, **écharpe**) diffère d’eux d’au moins
trois attributs saillants : la règle anti-sosie du monde ne repeint donc pas les policiers de la ville
(elle ne touche que les rares agents en bleu qui lui ressembleraient trop). Le bermuda est un gag.

### 1.4 Conventions de mise en scène (lire une scène)

- **Le temps est dans l’espace.** Un personnage apparaît plusieurs fois ; chaque apparition est un
  instant de son histoire. Les questions disent « maintenant », « plus tôt », « à l’aube » quand c’est
  nécessaire, et les `nearMiss` sur les autres apparitions disent « c’est bien lui, mais plus tôt ».
- **`facing` = sens de la marche.** Un personnage qui court vers la droite va vers l’est. Pour suggérer le
  nord ou le sud, on place les apparitions successives le long du trajet (on ne peut pas tourner un
  personnage vers le haut).
- **Émotions** : `'!'` alerte, `'?'` perplexité, `sweat` peur / effort / mauvaise conscience (le menteur
  transpire), `angry` colère, `heart` amour (ou gourmandise : Picotin), `sleep` sommeil, `music`
  insouciance, `idea`, `talk`, et **`ko` = inconscient** (la victime de c05, la fausse évanouie de c03).
- **Objets tenus** (`holding`) : le meilleur indice qui soit, car **aucun passant ambiant ne tient d’objet
  compromettant** (couteau, sac d’argent, bijou, aiguille…). Un sac d’argent à la main désigne un voleur.
- **Personnages et figurants.** Une personne qui doit être *reconnue* (suivie, comparée) est un
  **personnage** (`CharacterDef`, `character` sur l’entité) : la ville écarte alors tous les passants qui lui
  ressemblent. Une personne de décor nécessaire à la scène (spectateurs, agents, médecin) est un
  **figurant** : entité `person` sans `character`, apparence dans l’entité ; elle doit différer de tout
  personnage d’au moins 3 attributs saillants (vérifié par `check.ts`). Ne jamais faire d’un rôle générique
  (policier, infirmière, docker) un personnage : la règle anti-sosie repeindrait tous les passants de ce
  rôle dans la ville.
- **Ce qui se voit au zoom de jeu (1,5 à 2)** : chapeau, couleur et motif du haut, couleur du bas,
  accessoire (ballon et parapluie se voient de loin), objet tenu, pose, émotion, corpulence enfant /
  costaud. **Ce qui ne se voit pas assez** : lunettes, moustache, couleur de peau, cheveux sous un chapeau,
  textes des affiches et des panneaux, plaques d’immatriculation. Ceux-là ne portent jamais seuls une
  déduction. Le **masque de bandit** (`face: 'mask'`, une bande noire sur les yeux — ce n’est pas une
  cagoule) se lit à partir du zoom 2 ; au zoom 1,5, c’est l’objet tenu et la pose qui tranchent. Le texte
  dit donc « masque de bandit » (ou « masqué »), jamais « cagoule ».

---

## 2. Vue d’ensemble des enquêtes

| Enquête | Titre | Diff. | Crime | Quartiers | Étapes | Mécanique principale | Traversée | Fils parallèles |
|---|---|---|---|---|---|---|---|---|
| c00 | La Tarte de bienvenue | 1 | (gourmandise) | Vieille Ville | 3 | désigner ; un même personnage à deux moments | — | — |
| c01 | La Main dans le sac | 1 | vol de caisse | Halles | 4 | suivre un fuyard voyant ; cachette ; sosie (le mime) | — | — |
| c02 | Coin-coin ! | 2 | enlèvement (d’une cane) | Parc | 5 | suivre deux trajectoires (le ravisseur, la cane) ; fausse piste (le chef) | — | — |
| c03 | La Belle Évasion | 3 | évasion et complicité | Gare, Fenaison, Jardins | 6 | longue filature ; famille de sosies (pyjama, marinière, épouvantails) | **oui** (en bateau) | — |
| c04 | La Grande Paille | 4 | cambriolage + escroquerie à l’assurance | Vieille Ville, Faubourg | 6 | jumeaux (1 attribut) ; deux fils ouverts dès le début ; retournement | — | **oui** (`s1` et `s4` : `after: []`) |
| c05 | Rideau ! | 5 | meurtre (empoisonnement) | Arts, Fenaison, Port | 7 | élimination par attributs persistants d’un déguisement ; 4 fils parallèles ; sosie au port | **oui** (Pont du Parc) | **oui** (`s2` à `s5`) |
| bonus-aiguilles | Les Aiguilles du Fondateur | 3 | — | les 9 quartiers | 1 (10 réponses) | chasse au trésor sur énigmes | **oui** | — |

Déblocage : chaque enquête débloque la suivante (`unlockAfter: ['c00']` pour c01, `['c01']` pour c02…) ;
le bonus s’ouvre après le tutoriel.

**Progression de la difficulté** (jamais par un détail invisible) : c00 tient dans un square ; c01 dans
un rayon de 500 u avec un voleur unique (masque de bandit + sac d’argent) ; c02 étale cinq scènes sur 800 u et
ajoute une fausse piste ; c03 court sur 3 000 u, traverse la rivière et repose sur des sosies à un
attribut ; c04 ouvre deux fils dès le départ dans la foule de la Grand-Place et retourne l’histoire ;
c05 demande de comparer trois suspects à un déguisement, à travers tout le quartier des Arts, puis de
traverser la rivière.

---

## 3. c00 — La Tarte de bienvenue (tutoriel)

| champ | valeur |
|---|---|
| id | `c00` |
| titre | La Tarte de bienvenue |
| difficulté | 1 |
| déblocage (`unlockAfter`) | — (disponible d’emblée) |
| bonus | non |
| caméra de départ (`start`) | `{ x: 1595, y: 1925, zoom: 1.6 }` |
| étapes | 3 — ouvertes dès le début : `s1` |
| personnages / entités | 2 / 7 |
| quartiers | Vieille Ville |
| traverse la rivière | non |
| `landmarkOverrides` | — |
| `zones` | — (aucune zone d’enquête) |

**Accroche** (`teaser`) : Premier jour à la brigade : une tarte aux fraises s’est volatilisée entre la boulangerie et le commissariat.

**Briefing** (`intro`) :

> Bienvenue à Meulebourg, inspecteur. Ici, on cherche des aiguilles dans des bottes de foin… et on les trouve.
>
> Pour fêter votre arrivée, j’avais commandé une tarte aux fraises à la boulangerie. Elle n’est jamais arrivée. Ce n’est pas encore un crime, mais c’est déjà un drame. Mon chien Croquette a lui aussi disparu ce matin : je suppose que c’est une coïncidence.
>
> Le brigadier Picotin vous attend au square de la rue Neuve. Pincez pour zoomer, glissez pour vous déplacer, et touchez une personne ou un objet pour le désigner.
>
> — Commissaire Odile Fétu

**Épilogue** (`epilogue`) :

> Croquette s’était échappé du commissariat par la chatière et avait suivi l’odeur des fraises jusqu’au square. La commissaire a commandé une autre tarte… et confié la laisse à Picotin, qui n’a pas fini d’en entendre parler.
>
> Vous connaissez la méthode : observer, suivre, désigner. Bienvenue dans la brigade, inspecteur.

### La vérité

1. Le livreur de la boulangerie, Timothée Fournil, traverse le square de la rue Neuve vers l’ouest avec
   la tarte de bienvenue commandée par la commissaire. Picotin le voit passer.
2. Épuisé, il s’assoit sur un banc et s’endort.
3. Croquette, le chien de la commissaire (échappé du commissariat par la chatière), flaire les fraises
   et mange la tarte. Les pigeons attendent les miettes.

### Ce que le tutoriel enseigne, étape par étape

| Étape | Geste appris | Comment |
|---|---|---|
| s1 | désigner une personne | Picotin est décrit par ce qui se voit (casquette de police, uniforme bleu, bermuda beige : plus de moustache, invisible au zoom de jeu) et agite la main ; il est au centre de l’écran de départ |
| s2 | un personnage apparaît plusieurs fois ; suivre son sens de marche | les deux apparitions du livreur sont à 110 u l’une de l’autre, visibles ensemble ; le `nearMiss` sur la première explique le principe |
| s3 | désigner un animal / un objet ; les fausses pistes | le chien blanc a la tarte sous le museau ; la tarte, les pigeons et le dormeur ont chacun un message dédié |

**Amorce loyale** : le briefing signale que le chien de la commissaire, Croquette, a lui aussi disparu ce
matin (« je suppose que c’est une coïncidence ») ; la résolution de s3 la reprend. Le coupable n’est donc
plus un deus ex machina.

Toutes les scènes tiennent dans un rectangle de 130 × 70 u : à la caméra de départ (zoom 1,6), tout
est à l’écran d’un téléphone. Seul piège : un chien orange tenu en laisse se promène dans le square
(décor ambiant) ; il n’a pas de tarte.

| id | nom | rôle | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c00.picotin` | Brigadier Gaston Picotin | votre coéquipier | `light` | `short` | `red` | `police` | `uniform` | `blue` | `plain` | `shorts` | `beige` | `mustache` | `scarf` | `large` |
| `c00.livreur` | Timothée Fournil | le livreur de la boulangerie | `tan` | `curly` | `black` | `cap` | `apron` | `white` | `plain` | `shorts` | `red` | `none` | `none` | `slim` |

**Signes distinctifs** (traits portés par au plus 5 % des 3 231 passants ambiants, du plus rare au moins rare) :

- `c00.picotin` : casquette de police (0,4 %), uniforme (1,2 %), cheveux courts rouge (2,1 %)
- `c00.livreur` : tablier (2,6 %), bas rouge (2,8 %), cheveux bouclés noir (3,0 %)

**Entités**

| id | kind | x | y | z / sortY | détails | character | lieu |
|---|---|---|---|---|---|---|---|
| `c00.picotin.1` | person | 1612 | 1880 | — | pose: 'wave', facing: 'left' | `c00.picotin` | Rue des Remèdes (Vieille Ville) |
| `c00.livreur.1` | person | 1648 | 1914 | — | pose: 'carry', facing: 'left', holding: 'cake' | `c00.livreur` | Rue Neuve (Vieille Ville) |
| `c00.banc` | prop | 1540 | 1915 | — | prop: 'bench', color: 'green' |  | Avenue de la Gare (Vieille Ville) |
| `c00.livreur.2` | person | 1537 | 1915.6 | 0 / 1915.6 | pose: 'sit', facing: 'right', emote: 'sleep' | `c00.livreur` | Avenue de la Gare (Vieille Ville) |
| `c00.croquette` | prop | 1561 | 1945 | — | prop: 'dog', color: 'white', facing: 'right' |  | Avenue de la Gare (Vieille Ville) |
| `c00.tarte` | prop | 1575 | 1946 | — | prop: 'cake' |  | Rue des Remèdes (Vieille Ville) |
| `c00.pigeons` | prop | 1521 | 1949 | — | prop: 'pigeons' |  | Avenue de la Gare (Vieille Ville) |

**Étapes**

##### Étape `s1` — après : rien (ouverte dès le début) (`after` omis)

- **Question** : Trouvez le brigadier Picotin : casquette de police, uniforme bleu, bermuda beige. Il vous fait signe.
- **Réponses** (`accept`) : `c00.picotin.1`
- **Indice 1** : Il vous attend dans le square, du côté nord, près de l’allée.
- **Indice 2** : Cherchez l’homme en uniforme qui agite la main. — zone `{ x: 1600, y: 1905, radius: 90 }`
- **Résolution** (`solved`) : « Ah, inspecteur ! Le livreur de la boulangerie est passé devant moi avec la tarte : casquette, tablier blanc, short rouge. Il traversait le square vers l’ouest… et je ne l’ai jamais vu ressortir. »

##### Étape `s2` — après : `s1` (`after` omis)

- **Question** : Où est le livreur MAINTENANT ? Astuce : un même personnage peut apparaître plusieurs fois sur la carte, à différents moments de son histoire.
- **Réponses** (`accept`) : `c00.livreur.2`
- **Fausses pistes** (`nearMiss`) :
  - `c00.livreur.1` → « C’est bien lui… mais un peu plus tôt : il porte encore la tarte. Regardez vers où il marche et cherchez la suite de son histoire. »
  - `c00.picotin.1` → « Picotin vous fait signe. Il attend que vous trouviez le livreur. »
- **Indice 1** : Il marchait vers l’ouest du square. Un livreur fatigué, ça finit toujours par s’asseoir.
- **Indice 2** : Regardez les bancs, à l’ouest de l’allée centrale. — zone `{ x: 1570, y: 1890, radius: 80 }`
- **Résolution** (`solved`) : Le livreur dort à poings fermés sur un banc. Et ses bras sont vides : plus de tarte !
- **Fils rouges** (`thread`) : `c00.livreur.1` → `c00.livreur.2`

##### Étape `s3` — après : `s2` (`after` omis)

- **Question** : La tarte a disparu pendant la sieste du livreur. Qui l’a mangée ?
- **Réponses** (`accept`) : `c00.croquette`
- **Fausses pistes** (`nearMiss`) :
  - `c00.tarte` → « Voici ce qu’il reste de la tarte. Mais qui a croqué dedans ? »
  - `c00.pigeons` → « Les pigeons guettent les miettes. Une tarte entière, c’est trop lourd pour eux. »
  - `c00.livreur.2` → « Il ronfle. Difficile de manger une tarte en dormant. »
- **Indice 1** : Regardez juste devant le banc du livreur.
- **Indice 2** : Un gourmand à quatre pattes, le museau dans la crème… — zone `{ x: 1545, y: 1915, radius: 70 }`
- **Résolution** (`solved`) : Croquette ! Le chien de la commissaire Fétu, le museau plein de crème. Une coïncidence, disiez-vous ? Affaire classée.
- **Fils rouges** (`thread`) : `c00.livreur.2` → `c00.croquette`

**Reconstitution** (`replay`)

1. `c00.livreur.1` — Le livreur traverse le square, la tarte dans les bras, sous les yeux de Picotin.
2. `c00.livreur.2` — Épuisé par sa tournée, il s’assoit sur un banc… et s’endort.
3. `c00.croquette` — Croquette, échappé du commissariat, flaire les fraises et se sert.
4. `c00.picotin.1` — Picotin vous attend, sans se douter que le coupable est le chien de la commissaire.

---

## 4. c01 — La Main dans le sac

| champ | valeur |
|---|---|
| id | `c01` |
| titre | La Main dans le sac |
| difficulté | 1 |
| déblocage (`unlockAfter`) | `c00` |
| bonus | non |
| caméra de départ (`start`) | `{ x: 2640, y: 420, zoom: 1.6 }` |
| étapes | 4 — ouvertes dès le début : `s1` |
| personnages / entités | 4 / 11 |
| quartiers | Les Halles |
| traverse la rivière | non |
| `landmarkOverrides` | `{"cinema":{"features":[{"kind":"poster","at":0.12,"floor":0,"text":"LE CASSE DU SIÈCLE"},{"kind":"poster","at":0.88,"floor":0,"text":"LE CASSE DU SIÈCLE"}]}}` |
| `zones` | — (aucune zone d’enquête) |

**Accroche** (`teaser`) : Jour de marché aux Halles : la caisse de la boulangerie s’est envolée. Le voleur n’est pas très discret.

**Briefing** (`intro`) :

> Ce matin, à l’ouverture du marché, un individu a filé avec la caisse de la boulangerie Lemiel. Quand Rose Lemiel est en colère, tout le quartier des Halles l’entend — et là, elle est très en colère.
>
> Le brigadier Picotin est déjà sur place : il achetait son pain, comme par hasard. Retrouvez le voleur et l’argent avant la fin du marché.
>
> — Commissaire Odile Fétu

**Épilogue** (`epilogue`) :

> Ernest Lafouine, cambrioleur à mi-temps et distrait à plein temps, a été cueilli dans la file du Rex. Il comptait voir « Le Casse du siècle » pour prendre des notes.
>
> Rose Lemiel a récupéré sa caisse et offert à Picotin un pain de campagne… qu’il a terminé avant d’arriver au commissariat.

### La vérité

1. À l’ouverture du marché, Ernest Lafouine — cambrioleur à mi-temps, déguisé en cambrioleur à plein
   temps (bonnet orange, pull rayé noir, masque de bandit) — rafle la caisse de la boulangerie Lemiel.
2. Il traverse le marché en courant vers l’est, devant Motus, le mime, qui ne dira rien.
3. Au coin de la rue des Étals et de la rue du Cinéma, il cache la caisse dans une poubelle.
4. Il file au Rex se faire un alibi… et fait la queue, toujours masqué, pour voir « Le Casse du siècle ».

### Déduction et équité

- **s1** est un échauffement : la boulangère est décrite (toque, tablier rose) et la boulangerie est un
  lieu unique.
- **s2** se joue dans la foule la plus dense de la ville. Le voleur est pourtant unique : masque de bandit
  (0,3 % des passants), pull noir rayé, et surtout **un sac d’argent à la main** (aucun passant n’en
  tient) : la question le dit comme le dessin le montre. **Sosie volontaire** : Motus le mime a exactement
  la même tenue **sans le masque** (1 attribut : `face`), à 135 u du voleur ; son `nearMiss` le dit.
- **s3** : le voleur réapparaît de l’autre côté de la rue des Étals, les mains vides ; la caisse dépasse
  d’une poubelle 50 u derrière lui. On accepte la caisse **et** la poubelle (la caisse est petite).
- **s4** : la file d’attente compte quatre personnes ; trois figurants très différents, et le voleur,
  reconnaissable à son masque. Gag : il a gardé son masque de bandit pour se faire un alibi.

| id | nom | rôle | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c01.picotin` | Brigadier Gaston Picotin | votre coéquipier | `light` | `short` | `red` | `police` | `uniform` | `blue` | `plain` | `shorts` | `beige` | `mustache` | `scarf` | `large` |
| `c01.rose` | Rose Lemiel | la boulangère volée | `pale` | `bun` | `blond` | `chef` | `apron` | `pink` | `plain` | `skirt` | `white` | `none` | `none` | `large` |
| `c01.lafouine` | Ernest Lafouine | le voleur | `light` | `short` | `brown` | `beanie` | `sweater` | `black` | `stripes` | `trousers` | `black` | `mask` | `none` | `slim` |
| `c01.motus` | Motus | le mime du marché | `light` | `short` | `brown` | `beanie` | `sweater` | `black` | `stripes` | `trousers` | `black` | `none` | `none` | `slim` |

**Signes distinctifs** (traits portés par au plus 5 % des 3 231 passants ambiants, du plus rare au moins rare) :

- `c01.picotin` : casquette de police (0,4 %), uniforme (1,2 %), cheveux courts rouge (2,1 %)
- `c01.rose` : toque (0,3 %), cheveux chignon blonds (1,2 %), tablier (2,6 %), haut rose (3,1 %), bas blanc (4,4 %)
- `c01.lafouine` : cagoule / masque (0,3 %), haut noir rayé (1,2 %)
- `c01.motus` : haut noir rayé (1,2 %)

**Figurants** (personnes d’enquête SANS `character` : apparence portée par l’entité, sans effet sur la règle anti-sosie) :

| entité | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c01.spectatrice.1` | `dark` | `long` | `black` | `none` | `dress` | `yellow` | `dots` | `skirt` | `yellow` | `glasses` | `handbag` | `slim` |
| `c01.spectateur.1` | `pale` | `bald` | `grey` | `bowler` | `coat` | `brown` | `plain` | `trousers` | `beige` | `mustache` | `umbrella` | `large` |
| `c01.gamine.1` | `tan` | `ponytail` | `red` | `cap` | `hoodie` | `green` | `plain` | `shorts` | `blue` | `none` | `backpack` | `child` |

**Entités**

| id | kind | x | y | z / sortY | détails | character | lieu |
|---|---|---|---|---|---|---|---|
| `c01.rose.1` | person | 2612 | 369 | — | pose: 'point', facing: 'right', emote: 'angry' | `c01.rose` | près de : Boulangerie Lemiel (Les Halles) |
| `c01.picotin.1` | person | 2645 | 370 | — | pose: 'stand', facing: 'left', holding: 'baguette', emote: 'heart' | `c01.picotin` | près de : Boulangerie Lemiel (Les Halles) |
| `c01.lafouine.1` | person | 2850 | 531 | — | pose: 'run', facing: 'right', holding: 'moneybag' | `c01.lafouine` | Place des Halles (marché) (Les Halles) |
| `c01.motus.1` | person | 2716 | 534 | — | pose: 'handsup', facing: 'left' | `c01.motus` | Place des Halles (marché) (Les Halles) |
| `c01.poubelle` | prop | 3250 | 612 | — | prop: 'bin', color: 'green' |  | près de : Place des Halles (marché) (Les Halles) |
| `c01.caisse` | prop | 3250 | 612.5 | 7 / 612.5 | prop: 'moneybag' |  | près de : Place des Halles (marché) (Les Halles) |
| `c01.lafouine.2` | person | 3302 | 634 | — | pose: 'walk', facing: 'right' | `c01.lafouine` | près de : Cinéma Le Rex (Les Halles) |
| `c01.spectatrice.1` | person | 3506 | 633 | — | pose: 'stand', facing: 'left', holding: 'letter' | _figurant_ | près de : Cinéma Le Rex (Les Halles) |
| `c01.spectateur.1` | person | 3520 | 633 | — | pose: 'read', facing: 'left' | _figurant_ | près de : Cinéma Le Rex (Les Halles) |
| `c01.lafouine.3` | person | 3535 | 633 | — | pose: 'stand', facing: 'left', holding: 'letter', emote: 'music' | `c01.lafouine` | près de : Cinéma Le Rex (Les Halles) |
| `c01.gamine.1` | person | 3549 | 633 | — | pose: 'stand', facing: 'left', holding: 'icecream' | _figurant_ | près de : Cinéma Le Rex (Les Halles) |

Les deux affiches « LE CASSE DU SIÈCLE » ajoutées au cinéma (`landmarkOverrides.cinema`) sont un clin
d’œil : leur texte n’est pas lisible au zoom de jeu et n’entre dans aucune déduction.

**Étapes**

##### Étape `s1` — après : rien (ouverte dès le début) (`after` omis)

- **Question** : Trouvez la boulangère Rose Lemiel : toque blanche et tablier rose, devant sa boutique.
- **Réponses** (`accept`) : `c01.rose.1`
- **Fausses pistes** (`nearMiss`) :
  - `c01.picotin.1` → « Picotin a acheté sa baguette. Il vous montre la boulangère du menton, la bouche pleine. »
- **Indice 1** : La boulangerie Lemiel est au nord de la place des Halles, rue du Marché.
- **Indice 2** : Elle crie et montre le marché du doigt. — zone `{ x: 2625, y: 390, radius: 80 }`
- **Résolution** (`solved`) : « Au voleur ! Un grand maigre en pull rayé noir, avec un masque de bandit ! Il est parti dans le marché avec ma caisse ! »

##### Étape `s2` — après : `s1` (`after` omis)

- **Question** : Trouvez le voleur dans la foule du marché : bonnet orange, pull rayé noir, masque de bandit… et un sac d’argent à la main.
- **Réponses** (`accept`) : `c01.lafouine.1`
- **Fausses pistes** (`nearMiss`) :
  - `c01.motus.1` → « C’est Motus, le mime du marché : même bonnet, même pull rayé… mais pas de masque, et les mains vides. Il est coincé dans une boîte invisible depuis ce matin. »
- **Indice 1** : Il fonce vers l’est, dans l’allée entre les deux premières rangées d’étals.
- **Indice 2** : Cherchez quelqu’un qui court, un sac d’argent à la main. — zone `{ x: 2805, y: 490, radius: 120 }`
- **Résolution** (`solved`) : Le voici, le sac de la recette à la main, qui fend la foule en direction de la rue des Étals.
- **Fils rouges** (`thread`) : `c01.rose.1` → `c01.lafouine.1`

##### Étape `s3` — après : `s2` (`after` omis)

- **Question** : Plus loin, le voleur marche les mains vides. Où a-t-il caché la caisse ?
- **Réponses** (`accept`) : `c01.caisse`, `c01.poubelle`
- **Fausses pistes** (`nearMiss`) :
  - `c01.lafouine.2` → « Le voleur, les mains vides : il vient de se débarrasser de la caisse, quelque part derrière lui. »
  - `c01.lafouine.1` → « C’est bien lui, mais plus tôt : il tenait encore le sac. Où l’a-t-il laissé en chemin ? »
- **Indice 1** : Il a traversé la rue des Étals, à la sortie est du marché.
- **Indice 2** : Regardez au coin de la rue des Étals et de la rue du Cinéma. — zone `{ x: 3215, y: 595, radius: 80 }`
- **Résolution** (`solved`) : La recette dépasse d’une poubelle, au coin de la rue. Il comptait venir la rechercher après la séance.
- **Fils rouges** (`thread`) : `c01.lafouine.1` → `c01.caisse` ; `c01.caisse` → `c01.lafouine.2`

##### Étape `s4` — après : `s3` (`after` omis)

- **Question** : Pour se fabriquer un alibi, le voleur fait la queue au cinéma Le Rex. Désignez-le.
- **Réponses** (`accept`) : `c01.lafouine.3`
- **Fausses pistes** (`nearMiss`) :
  - `c01.spectatrice.1` → « Une cinéphile qui attend son film. Le voleur, lui, a oublié un petit détail en entrant dans la file. »
  - `c01.spectateur.1` → « Ce monsieur lit le programme. Rien à se reprocher, à part son chapeau. »
  - `c01.gamine.1` → « Une gamine et sa glace. Ce n’est pas elle. »
  - `c01.lafouine.2` → « Le voleur marche vers le cinéma, les mains vides. Suivez-le jusqu’à la file d’attente. »
  - `lm.cinema` → « Le cinéma Le Rex, oui. Mais c’est dans la file d’attente, devant la porte, qu’on cherche. »
- **Indice 1** : Le Rex est juste à l’est, rue du Cinéma. Le voleur n’a pas pensé à se changer.
- **Indice 2** : Regardez la file d’attente devant la porte du cinéma. — zone `{ x: 3505, y: 620, radius: 70 }`
- **Résolution** (`solved`) : Le seul spectateur masqué de toute l’histoire du Rex. Picotin arrive, sa baguette à la main, et lui tapote l’épaule.
- **Fils rouges** (`thread`) : `c01.lafouine.2` → `c01.lafouine.3`

**Reconstitution** (`replay`)

1. `c01.rose.1` — À l’ouverture, Rose Lemiel voit sa caisse filer sous son nez.
2. `c01.lafouine.1` — Lafouine traverse le marché en courant, la caisse sous le bras.
3. `c01.motus.1` — Il passe devant Motus, le mime, qui ne dira rien — évidemment.
4. `c01.caisse` — Au coin de la rue, il cache la caisse dans une poubelle.
5. `c01.lafouine.2` — Puis il file vers le cinéma, les mains vides, l’air innocent.
6. `c01.lafouine.3` — Dans la file du Rex, il attend son alibi… en masque de bandit.

---

## 5. c02 — Coin-coin !

| champ | valeur |
|---|---|
| id | `c02` |
| titre | Coin-coin ! |
| difficulté | 2 |
| déblocage (`unlockAfter`) | `c01` |
| bonus | non |
| caméra de départ (`start`) | `{ x: 5250, y: 980, zoom: 1.6 }` |
| étapes | 5 — ouvertes dès le début : `s1` |
| personnages / entités | 5 / 24 |
| quartiers | Parc des Meules |
| traverse la rivière | non |
| `landmarkOverrides` | — |
| `zones` | — (aucune zone d’enquête) |

**Accroche** (`teaser`) : Au Parc des Meules, la cane dorée de la baronne a disparu le jour du grand concours.

**Briefing** (`intro`) :

> Cet après-midi, au kiosque à musique, se tient le Grand Concours de la Plus Belle Cane. La grande favorite : Duchesse, la cane au plumage entièrement doré de la baronne Adélaïde de la Botte. Problème : ce matin, Duchesse a disparu de l’étang aux Canards.
>
> La baronne vous attend au bord de l’étang, au pied du ponton, avec Picotin. Elle offre une récompense, sa gratitude éternelle et sa recette de canard à l’orange — non, pardon, pas celle-là.
>
> Retrouvez Duchesse avant le concours.
>
> — Commissaire Odile Fétu

**Épilogue** (`epilogue`) :

> Duchesse a remporté le Grand Concours à l’unanimité. Le Baron a été disqualifié pour complicité, et Hippolyte Barbarie a passé deux heures au milieu de l’étang : les canards refusaient de le laisser accoster.
>
> Le petit Lulu a reçu une médaille… et le droit de nourrir Duchesse jusqu’à la fin de ses jours.

### La vérité

1. Au petit matin, Hippolyte Barbarie — éleveur de volailles et propriétaire du Baron, le grand rival de
   Duchesse — attire la cane dorée hors de l’étang avec une baguette (rive sud-est).
2. Il l’emporte dans un carton par l’allée qui descend vers le boulevard des Halles, et l’enferme dans
   sa camionnette « VOLAILLES BARBARIE ».
3. Le petit Lulu, qui nourrissait les canards et a tout vu, le suit et ouvre la portière : Duchesse
   s’échappe…
4. … traverse le boulevard et se présente d’elle-même au concours, devant le kiosque à musique.
5. Démasqué, Barbarie s’enfuit en bateau au milieu de l’étang. Les canards l’encerclent.

### Déduction et équité

- **Duchesse** est le seul canard **entièrement jaune** de la ville (`color: 'yellow'`, `scale: 1.4`) ;
  les canards ordinaires ont le corps blanc et la tête verte. Elle apparaît quatre fois : chaque
  apparition est un `nearMiss` des étapes où elle n’est pas la réponse.
- **s1** : une cane dorée hors de l’eau, un homme accroupi qui lui tend du pain. Fausse piste : Lulu
  nourrit des canards **ordinaires**, **sur l’eau**, 120 u plus loin.
- **s2** : deux hommes portent un carton dans le parc — Barbarie (feutre, manteau vert à carreaux,
  pantalon jaune, barbe) et le chef Bigarade (toque, tablier). La question porte sur le **véhicule** :
  la camionnette au nom de Barbarie, garée sur le boulevard au bout de l’allée qu’il descend.
- **s3** : la scène de la libération est à côté de la camionnette (Lulu, son ballon, un cœur ; Duchesse
  qui saute dehors). Désigner Lulu au bord de l’étang donne un `nearMiss` qui demande le bon moment.
- **s4** : Duchesse a traversé le boulevard (apparition 3, sur le trottoir sud) ; la suite logique est le
  concours annoncé dans le briefing, au kiosque à musique, 270 u au sud-ouest.
- **s5** : Barbarie est debout sur le pont de son bateau « LE BARON » (le bateau à moteur de 90 u du
  vocabulaire : les textes ne parlent ni de « barque » ni de « ramer »), bras levés, en sueur, au milieu de
  l’étang ; on accepte le bateau **et** lui. Les autres apparitions de Barbarie et les canards ont leur
  `nearMiss`.
- Un personnage qui **pointe** est lu comme un indice : la baronne a donc les bras au ciel (`handsup`) et
  non plus le doigt tendu vers l’ouest, à l’opposé du ravisseur.
- La ville possède déjà un bateau ambiant nommé « LE COLVERT » sur l’étang : c’est pourquoi le ravisseur
  ne s’appelle pas Colvert.

| id | nom | rôle | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c02.picotin` | Brigadier Gaston Picotin | votre coéquipier | `light` | `short` | `red` | `police` | `uniform` | `blue` | `plain` | `shorts` | `beige` | `mustache` | `scarf` | `large` |
| `c02.baronne` | Adélaïde de la Botte | la propriétaire de Duchesse | `pale` | `bun` | `white` | `straw` | `dress` | `purple` | `dots` | `skirt` | `purple` | `glasses` | `handbag` | `large` |
| `c02.barbarie` | Hippolyte Barbarie | éleveur de volailles, propriétaire du Baron | `pale` | `bald` | `grey` | `fedora` | `coat` | `green` | `checks` | `trousers` | `yellow` | `beard` | `none` | `large` |
| `c02.lulu` | Lulu | le petit témoin | `brown` | `spiky` | `blond` | `none` | `overalls` | `blue` | `plain` | `shorts` | `orange` | `glasses` | `balloon` | `child` |
| `c02.bigarade` | Gaspard Bigarade | chef cuisinier | `brown` | `short` | `black` | `chef` | `apron` | `white` | `plain` | `trousers` | `black` | `mustache` | `none` | `large` |

**Signes distinctifs** (traits portés par au plus 5 % des 3 231 passants ambiants, du plus rare au moins rare) :

- `c02.picotin` : casquette de police (0,4 %), uniforme (1,2 %), cheveux courts rouge (2,1 %)
- `c02.baronne` : haut violet à pois (0,4 %), bas violet (1,9 %), cheveux chignon blanc (2,1 %)
- `c02.barbarie` : haut vert à carreaux (0,7 %), bas jaune (1,7 %)
- `c02.lulu` : bas orange (0,7 %), cheveux en épis blonds (0,9 %), ballon (1,6 %), salopette (3,6 %)
- `c02.bigarade` : toque (0,3 %), tablier (2,6 %)

**Figurants** (personnes d’enquête SANS `character` : apparence portée par l’entité, sans effet sur la règle anti-sosie) :

| entité | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c02.president.1` | `dark` | `short` | `white` | `bowler` | `suit` | `navy` | `stripes` | `trousers` | `navy` | `glasses` | `newspaper` | `slim` |
| `c02.concurrente.1` | `light` | `curly` | `grey` | `beret` | `sweater` | `red` | `plain` | `skirt` | `brown` | `none` | `cane` | `regular` |

**Entités**

| id | kind | x | y | z / sortY | détails | character | lieu |
|---|---|---|---|---|---|---|---|
| `c02.baronne.1` | person | 5300 | 1066 | — | pose: 'handsup', facing: 'left', emote: 'sweat' | `c02.baronne` | Parc des Meules (Parc des Meules) |
| `c02.picotin.1` | person | 5322 | 1069 | — | pose: 'read', facing: 'left' | `c02.picotin` | Parc des Meules (Parc des Meules) |
| `c02.barbarie.1` | person | 5492 | 1040 | — | pose: 'crouch', facing: 'left', holding: 'baguette' | `c02.barbarie` | Parc des Meules (Parc des Meules) |
| `c02.duchesse.1` | prop | 5472 | 1041 | — | prop: 'duck', color: 'yellow', scale: 1.4, facing: 'right' |  | Parc des Meules (Parc des Meules) |
| `c02.lulu.1` | person | 5615 | 998 | — | pose: 'point', facing: 'left', holding: 'baguette' | `c02.lulu` | Parc des Meules (Parc des Meules) |
| `c02.canard.1` | prop | 5596 | 966 | — | prop: 'duck', facing: 'right' |  | Parc des Meules (Parc des Meules) |
| `c02.canard.2` | prop | 5576 | 973 | — | prop: 'duck', facing: 'right' |  | Parc des Meules (Parc des Meules) |
| `c02.barbarie.2` | person | 5370 | 1190 | — | pose: 'carry', facing: 'left', holding: 'box' | `c02.barbarie` | Parc des Meules (Parc des Meules) |
| `c02.bigarade.1` | person | 5585 | 1165 | — | pose: 'carry', facing: 'right', holding: 'box', emote: 'music' | `c02.bigarade` | Parc des Meules (Parc des Meules) |
| `c02.camionnette` | vehicle | 5300 | 1297 | — | vehicle: 'van', facing: 'left', color: 'white', label: 'VOLAILLES BARBARIE', doorOpen: true |  | Parc des Meules (Parc des Meules) |
| `c02.lulu.2` | person | 5266 | 1270 | — | pose: 'wave', facing: 'right', emote: 'heart' | `c02.lulu` | Parc des Meules (Parc des Meules) |
| `c02.duchesse.2` | prop | 5249 | 1272 | — | prop: 'duck', color: 'yellow', scale: 1.4, facing: 'left' |  | Parc des Meules (Parc des Meules) |
| `c02.duchesse.3` | prop | 5172 | 1333 | — | prop: 'duck', color: 'yellow', scale: 1.4, facing: 'left' |  | Parc des Meules (Parc des Meules) |
| `c02.panneau` | prop | 4906 | 1494 | — | prop: 'sign', label: 'CONCOURS DE CANES' |  | Parc des Meules (Parc des Meules) |
| `c02.president.1` | person | 4926 | 1500 | — | pose: 'point', facing: 'right', emote: 'exclaim' | _figurant_ | Parc des Meules (Parc des Meules) |
| `c02.duchesse.4` | prop | 4946 | 1503 | — | prop: 'duck', color: 'yellow', scale: 1.4, facing: 'left' |  | Parc des Meules (Parc des Meules) |
| `c02.canard.3` | prop | 4966 | 1504 | — | prop: 'duck', facing: 'left' |  | Parc des Meules (Parc des Meules) |
| `c02.concurrente.1` | person | 4984 | 1503 | — | pose: 'stand', facing: 'left', emote: 'angry' | _figurant_ | Parc des Meules (Parc des Meules) |
| `c02.barque` | vehicle | 5390 | 660 | — | vehicle: 'boat', facing: 'right', color: 'green', label: 'LE BARON' |  | Parc des Meules (Parc des Meules) |
| `c02.barbarie.3` | person | 5360 | 661 | 10 / 661 | pose: 'handsup', facing: 'right', emote: 'sweat' | `c02.barbarie` | Parc des Meules (Parc des Meules) |
| `c02.canard.4` | prop | 5322 | 676 | — | prop: 'duck', facing: 'right' |  | Parc des Meules (Parc des Meules) |
| `c02.canard.5` | prop | 5458 | 672 | — | prop: 'duck', facing: 'left' |  | Parc des Meules (Parc des Meules) |
| `c02.canard.6` | prop | 5352 | 690 | — | prop: 'duck', facing: 'right' |  | Parc des Meules (Parc des Meules) |
| `c02.canard.7` | prop | 5430 | 694 | — | prop: 'duck', facing: 'left' |  | Parc des Meules (Parc des Meules) |

**Étapes**

##### Étape `s1` — après : rien (ouverte dès le début) (`after` omis)

- **Question** : Quelqu’un a attiré Duchesse hors de l’eau avec du pain. Qui ?
- **Réponses** (`accept`) : `c02.barbarie.1`
- **Fausses pistes** (`nearMiss`) :
  - `c02.lulu.1` → « Le petit Lulu nourrit des canards ordinaires, sur l’eau. Duchesse, elle, est dorée de la tête à la queue. »
  - `c02.baronne.1` → « La baronne se lamente, les bras au ciel : « Ma Duchesse ! Ma toute belle ! » »
  - `c02.picotin.1` → « Picotin prend des notes. Enfin… il dessine des canards dans son carnet. »
- **Indice 1** : Cherchez une cane toute dorée hors de l’eau, sur la rive de l’étang.
- **Indice 2** : À l’est du ponton, quelqu’un tend une baguette à ras du sol… — zone `{ x: 5445, y: 1020, radius: 110 }`
- **Résolution** (`solved`) : Hippolyte Barbarie, éleveur de volailles… et propriétaire du Baron, le grand rival de Duchesse au concours. Il l’attire avec une baguette.
- **Fils rouges** (`thread`) : `c02.barbarie.1` → `c02.duchesse.1`

##### Étape `s2` — après : `s1` (`after` omis)

- **Question** : Barbarie a fourré Duchesse dans un carton. Où l’a-t-il emportée ?
- **Réponses** (`accept`) : `c02.camionnette`
- **Fausses pistes** (`nearMiss`) :
  - `c02.barbarie.2` → « C’est bien Barbarie, le carton dans les bras. Suivez-le : où va-t-il ? »
  - `c02.barbarie.1` → « C’est bien Barbarie, mais plus tôt, au bord de l’étang : il n’a pas encore de carton. Suivez-le. »
  - `c02.bigarade.1` → « Le chef Bigarade porte un carton, lui aussi : des oranges. Pour un canard à l’orange ? Il jure que non, la main sur la toque. »
- **Indice 1** : Barbarie a pris l’allée qui descend vers le boulevard des Halles, le boulevard qui traverse le parc.
- **Indice 2** : Un véhicule à son nom est garé sur le boulevard. — zone `{ x: 5325, y: 1250, radius: 110 }`
- **Résolution** (`solved`) : Sa camionnette, « VOLAILLES BARBARIE », garée sur le boulevard. Il y enferme le carton et repart chercher son propre canard.
- **Fils rouges** (`thread`) : `c02.barbarie.1` → `c02.barbarie.2` ; `c02.barbarie.2` → `c02.camionnette`

##### Étape `s3` — après : `s2` (`after` omis)

- **Question** : Quand Barbarie revient, la camionnette est vide ! Quelqu’un a libéré Duchesse. Qui ?
- **Réponses** (`accept`) : `c02.lulu.2`
- **Fausses pistes** (`nearMiss`) :
  - `c02.duchesse.2` → « Duchesse saute de la camionnette ! Mais qui lui a ouvert la portière ? »
  - `c02.lulu.1` → « C’est bien Lulu… mais plus tôt, au bord de l’étang. Désignez-le au moment où il libère Duchesse. »
- **Indice 1** : Regardez juste à côté de la camionnette, portière ouverte.
- **Indice 2** : Quelqu’un de petit, avec un ballon, qui a tout vu depuis la rive. — zone `{ x: 5295, y: 1280, radius: 70 }`
- **Résolution** (`solved`) : Le petit Lulu avait tout vu depuis la rive. Il a suivi Barbarie, ouvert la portière… et Duchesse a filé.
- **Fils rouges** (`thread`) : `c02.camionnette` → `c02.lulu.2`

##### Étape `s4` — après : `s3` (`after` omis)

- **Question** : Où est Duchesse à présent ?
- **Réponses** (`accept`) : `c02.duchesse.4`
- **Fausses pistes** (`nearMiss`) :
  - `c02.duchesse.3` → « Elle a traversé le boulevard. Bien. Mais où va-t-elle d’un pas si décidé ? »
  - `c02.duchesse.2` → « Là, elle s’échappe de la camionnette. Suivez-la. »
  - `c02.duchesse.1` → « Là, c’était ce matin, au bord de l’étang. Où est-elle maintenant ? »
  - `c02.canard.3` → « Une concurrente honorable, mais blanche comme un drap. Duchesse est dorée. »
  - `c02.president.1` → « Le président du jury, très ému. Regardez plutôt ce qu’il montre du doigt. »
  - `c02.concurrente.1` → « Mme Cancan fulmine : sa cane vient de perdre toutes ses chances. Pourquoi, à votre avis ? »
  - `lm.kiosque` → « Le kiosque à musique, oui. Mais Duchesse est juste à côté, devant le jury. »
- **Indice 1** : Elle a traversé le boulevard vers le sud. Une cane de concours sait où elle doit être cet après-midi.
- **Indice 2** : Regardez près du kiosque à musique. — zone `{ x: 4990, y: 1470, radius: 110 }`
- **Résolution** (`solved`) : Au concours, devant le jury ! Duchesse s’est présentée toute seule, à l’heure.
- **Fils rouges** (`thread`) : `c02.duchesse.2` → `c02.duchesse.3` ; `c02.duchesse.3` → `c02.duchesse.4`

##### Étape `s5` — après : `s4` (`after` omis)

- **Question** : Démasqué, Barbarie a pris la fuite pour échapper à Picotin. Où s’est-il réfugié ?
- **Réponses** (`accept`) : `c02.barque`, `c02.barbarie.3`
- **Fausses pistes** (`nearMiss`) :
  - `c02.barbarie.1` → « C’est bien Barbarie, mais ce matin, sur la rive. Depuis, il a pris le large. »
  - `c02.barbarie.2` → « C’est bien Barbarie, mais avec son carton, à travers le parc. Depuis, il a pris le large. »
  - `c02.canard.4` → « Un canard parmi d’autres. Regardez plutôt ce qu’ils encerclent. »
  - `c02.canard.5` → « Un canard parmi d’autres. Regardez plutôt ce qu’ils encerclent. »
  - `c02.canard.6` → « Un canard parmi d’autres. Regardez plutôt ce qu’ils encerclent. »
  - `c02.canard.7` → « Un canard parmi d’autres. Regardez plutôt ce qu’ils encerclent. »
  - `z.etang` → « L’étang, oui. Mais où, au juste ? Cherchez ce qui flotte au milieu. »
- **Indice 1** : Il a filé vers le nord, là où les canards font la loi.
- **Indice 2** : Regardez au milieu de l’étang. — zone `{ x: 5375, y: 675, radius: 120 }`
- **Résolution** (`solved`) : Au milieu de l’étang, à bord de son bateau « LE BARON » — il l’a baptisé comme son canard —, encerclé par des canards furieux. Il n’ose plus avancer.
- **Fils rouges** (`thread`) : `c02.camionnette` → `c02.barbarie.3`

**Reconstitution** (`replay`)

1. `c02.barbarie.1` — Au petit matin, Barbarie attire Duchesse hors de l’eau avec une baguette.
2. `c02.barbarie.2` — Il l’emporte dans un carton, à travers le parc.
3. `c02.camionnette` — Il l’enferme dans sa camionnette, garée sur le boulevard.
4. `c02.lulu.2` — Lulu, qui a tout vu, ouvre la portière.
5. `c02.duchesse.3` — Duchesse traverse le boulevard…
6. `c02.duchesse.4` — … et se présente au concours, à l’heure.
7. `c02.barbarie.3` — Démasqué, Barbarie s’enfuit en bateau. Les canards l’attendaient.

---

## 6. c03 — La Belle Évasion

| champ | valeur |
|---|---|
| id | `c03` |
| titre | La Belle Évasion |
| difficulté | 3 |
| déblocage (`unlockAfter`) | `c02` |
| bonus | non |
| caméra de départ (`start`) | `{ x: 1060, y: 1810, zoom: 1.5 }` |
| étapes | 6 — ouvertes dès le début : `s1` |
| personnages / entités | 7 / 18 |
| quartiers | Quartier de la Gare, La Fenaison, Les Jardins |
| traverse la rivière | oui |
| `landmarkOverrides` | — |
| `zones` | — (aucune zone d’enquête) |

**Accroche** (`teaser`) : Un détenu s’est fait la belle devant la gare, en pyjama rayé. Il ne devrait pas aller bien loin, sauf si quelqu’un l’attend.

**Briefing** (`intro`) :

> Ce matin, Achille Lapince, dit « le Hérisson » — cheveux en épis, pyjama rayé bleu et blanc —, devait être transféré à la prison de la Préfecture. Le fourgon s’est arrêté devant la gare. Deux minutes plus tard, il était vide.
>
> Depuis l’alerte, deux agents gardent le Pont Central. Lapince n’a ni argent ni vêtements de rechange, mais il a des amis. Retrouvez-le avant le train de midi.
>
> — Commissaire Odile Fétu

**Épilogue** (`epilogue`) :

> Achille Lapince a tenu quarante minutes immobile, les bras en l’air, avant que Picotin ne lui demande l’heure. Il a répondu.
>
> Lola Cachou a été arrêtée au quai Sud, à bord de « La Cocotte ». L’épouvantail a récupéré son chapeau, et les jardiniers jurent qu’il a l’air plus fier qu’avant.

### La vérité

1. Devant la gare, Lola Cachou, la fiancée d’Achille Lapince, simule un malaise sur le parvis. Tous les
   agents accourent ; Picotin l’évente de son képi.
2. Lapince saute du fourgon, toujours en pyjama rayé, et file vers le sud : devant la terrasse du Fer à
   Cheval (un client le montre du doigt), puis près du Garage Pistons.
3. Le Pont Central étant gardé, Lola l’attend sur la Fenaison avec un bateau, « La Cocotte ». Lapince
   escalade le quai Sud.
4. Aux jardins ouvriers, il vole le chapeau de paille d’un épouvantail et se plante au milieu des
   potagers, les bras en l’air, parmi les vrais épouvantails. Il transpire.

### Déduction et équité — la famille du pyjama rayé

c03 repose sur une **famille de sosies déclarée** : tous partagent les cheveux en épis blonds, la chemise
blanche, le pantalon gris et la carrure mince ; ils ne diffèrent que par **le chapeau** et **le motif de la
chemise** — deux attributs très visibles.

| Personnage | Chapeau | Motif de la chemise | Où | Rôle dans l’enquête |
|---|---|---|---|---|
| Lapince (évadé) | aucun | **rayures** | gare → bar → garage → quai Sud | la cible des étapes s3 et s4 |
| Le marin Yves Le Goéland | **bonnet** | rayures (marinière) | quai Nord | fausse piste de s3 (1 attribut : le bonnet) |
| Épouvantails | paille | **carreaux** | jardins ouvriers | le « foin » où se cache l’aiguille (s5, s6) |
| Épouvantail décoiffé | **aucun** | carreaux | jardins ouvriers | réponse de s5 |
| Lapince déguisé | **paille** | **rayures** | jardins ouvriers | réponse de s6 (1 attribut d’écart avec les épouvantails : les rayures — et il est le seul à transpirer) |

- **s1–s2** : le fourgon est vide, la « malade » est allongée à côté, Picotin penché sur elle.
- **s3** accepte l’une ou l’autre des deux apparitions de Lapince en fuite (devant le bar, ou près du
  garage) : le joueur peut le rattraper où il veut. Le client du bar qui pointe du doigt aide à le
  repérer.
- **s4** : deux agents gardent le Pont Central (figurants) ; désigner le pont donne un `nearMiss`. Le
  bateau rouge porte **Lola debout sur le pont**, reconnaissable (robe rose à pois, béret, lunettes
  noires) : la fausse évanouie de la gare. On accepte le bateau et Lola. La rivière porte plusieurs
  bateaux ambiants (dont un rouge, « LE HÉRON », 185 u plus au nord) : la question demande donc **qui**
  a aidé Lapince (« Qui, et comment ? ») et l’indice 1 promet « une connaissance » à bord ; l’indice 2
  précise « tout près du quai Sud ». Le marin du quai Nord, avec sa corde, a son `nearMiss`.
- **s5–s6** : cinq épouvantails bras levés, répartis dans trois parcelles ; un seul n’a pas de chapeau, un
  seul a des rayures et une goutte de sueur. La résolution de s4 amène le vol du chapeau (un jardinier
  téléphone à la brigade) ; la question de s5 dit que les épouvantails ont les bras en l’air ; celle de s6
  rappelle que Lapince « porte toujours son pyjama » ; l’indice 1 de s6 donne la règle (« un pyjama rayé ne
  ressemble pas tout à fait à une chemise à carreaux ; un épouvantail ne transpire jamais »). Les carreaux
  blancs sur blanc se lisent mal au zoom 1,5 : les messages disent « pas de rayures », et la goutte de
  sueur (une bulle) tranche à coup sûr.

| id | nom | rôle | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c03.picotin` | Brigadier Gaston Picotin | votre coéquipier | `light` | `short` | `red` | `police` | `uniform` | `blue` | `plain` | `shorts` | `beige` | `mustache` | `scarf` | `large` |
| `c03.lapince` | Achille Lapince, dit « le Hérisson » | l’évadé | `light` | `spiky` | `blond` | `none` | `shirt` | `white` | `stripes` | `trousers` | `grey` | `none` | `none` | `slim` |
| `c03.lapince-paille` | Achille Lapince (déguisé) | l’évadé, en épouvantail | `light` | `spiky` | `blond` | `straw` | `shirt` | `white` | `stripes` | `trousers` | `grey` | `none` | `none` | `slim` |
| `c03.lola` | Lola Cachou | la fiancée de Lapince | `brown` | `curly` | `red` | `beret` | `dress` | `pink` | `dots` | `skirt` | `pink` | `sunglasses` | `handbag` | `slim` |
| `c03.marin` | Yves Le Goéland | marin du quai Nord | `light` | `spiky` | `blond` | `beanie` | `shirt` | `white` | `stripes` | `trousers` | `grey` | `none` | `none` | `slim` |
| `c03.epouvantail` | Épouvantail | gardien des potagers | `light` | `spiky` | `blond` | `straw` | `shirt` | `white` | `checks` | `trousers` | `grey` | `none` | `none` | `slim` |
| `c03.epouvantail-nu` | Épouvantail décoiffé | gardien des potagers, sans chapeau | `light` | `spiky` | `blond` | `none` | `shirt` | `white` | `checks` | `trousers` | `grey` | `none` | `none` | `slim` |

**Signes distinctifs** (traits portés par au plus 5 % des 3 231 passants ambiants, du plus rare au moins rare) :

- `c03.picotin` : casquette de police (0,4 %), uniforme (1,2 %), cheveux courts rouge (2,1 %)
- `c03.lapince` : cheveux en épis blonds (0,9 %), haut blanc rayé (1,4 %)
- `c03.lapince-paille` : cheveux en épis blonds (0,9 %), haut blanc rayé (1,4 %)
- `c03.lola` : haut rose à pois (0,6 %), cheveux bouclés rouge (0,9 %), bas rose (1,5 %)
- `c03.marin` : cheveux en épis blonds (0,9 %), haut blanc rayé (1,4 %)
- `c03.epouvantail` : haut blanc à carreaux (0,9 %), cheveux en épis blonds (0,9 %)
- `c03.epouvantail-nu` : haut blanc à carreaux (0,9 %), cheveux en épis blonds (0,9 %)

**Figurants** (personnes d’enquête SANS `character` : apparence portée par l’entité, sans effet sur la règle anti-sosie) :

| entité | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c03.client` | `tan` | `bald` | `grey` | `cap` | `tshirt` | `orange` | `plain` | `trousers` | `blue` | `beard` | `none` | `large` |
| `c03.agent.1` | `dark` | `short` | `black` | `police` | `uniform` | `navy` | `plain` | `trousers` | `navy` | `none` | `none` | `regular` |
| `c03.agent.2` | `pale` | `ponytail` | `brown` | `police` | `uniform` | `navy` | `plain` | `trousers` | `navy` | `sunglasses` | `none` | `regular` |

**Entités**

| id | kind | x | y | z / sortY | détails | character | lieu |
|---|---|---|---|---|---|---|---|
| `c03.fourgon` | vehicle | 1110 | 1846 | — | vehicle: 'van', facing: 'left', color: 'navy', label: 'POLICE', doorOpen: true |  | près de : Parvis de la gare (Quartier de la Gare) |
| `c03.lola.1` | person | 1074 | 1797 | — | pose: 'lie', facing: 'right', emote: 'ko' | `c03.lola` | Parvis de la gare (Quartier de la Gare) |
| `c03.picotin.1` | person | 1098 | 1799 | — | pose: 'crouch', facing: 'left', emote: 'sweat' | `c03.picotin` | Parvis de la gare (Quartier de la Gare) |
| `c03.lapince.1` | person | 856 | 2267 | — | pose: 'run', facing: 'left' | `c03.lapince` | près de : Bar Le Fer à Cheval (Quartier de la Gare) |
| `c03.client` | person | 818 | 2269 | — | pose: 'point', facing: 'right', emote: 'exclaim' | _figurant_ | près de : Bar Le Fer à Cheval (Quartier de la Gare) |
| `c03.lapince.2` | person | 880 | 3270 | — | pose: 'sneak', facing: 'left' | `c03.lapince` | près de : Garage Pistons (Quartier de la Gare) |
| `c03.marin.1` | person | 1180 | 3693 | — | pose: 'stand', facing: 'left', holding: 'rope' | `c03.marin` | Quai Nord (La Fenaison) |
| `c03.agent.1` | person | 2170 | 3820 | — | pose: 'stand', facing: 'right' | _figurant_ | Pont Central (La Fenaison) |
| `c03.agent.2` | person | 2230 | 3842 | — | pose: 'stand', facing: 'left' | _figurant_ | Pont Central (La Fenaison) |
| `c03.bateau` | vehicle | 945 | 3925 | — | vehicle: 'boat', facing: 'left', color: 'red', label: 'LA COCOTTE' |  | Quai Sud (La Fenaison) |
| `c03.lola.2` | person | 968 | 3926 | 10 / 3926 | pose: 'wave', facing: 'left' | `c03.lola` | Quai Sud (La Fenaison) |
| `c03.lapince.3` | person | 905 | 3965 | — | pose: 'climb', facing: 'left' | `c03.lapince` | Quai Sud (La Fenaison) |
| `c03.epouvantail.1` | person | 760 | 4512 | — | pose: 'handsup', facing: 'right' | `c03.epouvantail` | Jardins ouvriers (Les Jardins) |
| `c03.epouvantail.2` | person | 1230 | 4520 | — | pose: 'handsup', facing: 'left' | `c03.epouvantail` | Jardins ouvriers (Les Jardins) |
| `c03.epouvantail.3` | person | 860 | 4350 | — | pose: 'handsup', facing: 'right' | `c03.epouvantail` | Jardins ouvriers (Les Jardins) |
| `c03.epouvantail-nu.1` | person | 1100 | 4380 | — | pose: 'handsup', facing: 'left' | `c03.epouvantail-nu` | Jardins ouvriers (Les Jardins) |
| `c03.lapince.4` | person | 960 | 4640 | — | pose: 'handsup', facing: 'right', emote: 'sweat' | `c03.lapince-paille` | Jardins ouvriers (Les Jardins) |
| `c03.pigeons` | prop | 942 | 4648 | — | prop: 'pigeons' |  | Jardins ouvriers (Les Jardins) |

**Étapes**

##### Étape `s1` — après : rien (ouverte dès le début) (`after` omis)

- **Question** : Trouvez le fourgon de police, portière ouverte, devant la gare.
- **Réponses** (`accept`) : `c03.fourgon`
- **Fausses pistes** (`nearMiss`) :
  - `c03.lola.1` → « Il y a de l’agitation sur le parvis, mais on y reviendra : trouvez d’abord le fourgon. »
  - `c03.picotin.1` → « Picotin est très occupé, là-bas. On y reviendra : trouvez d’abord le fourgon. »
- **Indice 1** : Il est garé rue de la Gare, au sud du parvis, juste à côté du bus vert.
- **Indice 2** : Un fourgon bleu marine, vide. — zone `{ x: 1080, y: 1820, radius: 90 }`
- **Résolution** (`solved`) : Le fourgon est vide, portière grande ouverte. Mais où étaient les agents pendant l’évasion ?

##### Étape `s2` — après : `s1` (`after` omis)

- **Question** : Au moment de l’évasion, les agents étaient occupés ailleurs. Qui a fait diversion ?
- **Réponses** (`accept`) : `c03.lola.1`
- **Fausses pistes** (`nearMiss`) :
  - `c03.picotin.1` → « Picotin évente la dame évanouie de son képi. Il n’a rien vu partir — il ne voit d’ailleurs pas grand-chose. »
  - `c03.fourgon` → « Le fourgon, toujours vide. Qui a détourné l’attention des agents ? »
- **Indice 1** : Quelqu’un a fait un malaise très opportun, tout près du fourgon.
- **Indice 2** : Regardez sur le parvis, juste au-dessus du fourgon. — zone `{ x: 1095, y: 1815, radius: 70 }`
- **Résolution** (`solved`) : Une dame s’est « évanouie » sur le parvis : lunettes noires, béret, robe rose à pois. Tous les agents ont couru à son secours… Un évanouissement bien commode.
- **Fils rouges** (`thread`) : `c03.lola.1` → `c03.fourgon`

##### Étape `s3` — après : `s2` (`after` omis)

- **Question** : Lapince a filé à pied, toujours en pyjama rayé. Retrouvez-le dans sa fuite.
- **Réponses** (`accept`) : `c03.lapince.1`, `c03.lapince.2`
- **Fausses pistes** (`nearMiss`) :
  - `c03.marin.1` → « Une marinière, pas un pyjama : ce marin porte un bonnet, et il n’a pas quitté son quai de la matinée. »
  - `c03.client` → « Un client du Fer à Cheval, très agité. Regardez plutôt ce qu’il montre du doigt. »
  - `c03.lola.1` → « La fausse malade est encore sur le parvis. Lapince, lui, a déjà pris la poudre d’escampette. »
  - `c03.lapince.3` → « C’est bien lui, mais beaucoup plus loin, de l’autre côté de la rivière. Retrouvez d’abord le début de sa fuite. »
- **Indice 1** : Il est parti vers le sud, par les petites rues du quartier de la Gare. Un client du bar Le Fer à Cheval l’a vu passer.
- **Indice 2** : Regardez devant la terrasse du Fer à Cheval. — zone `{ x: 875, y: 2220, radius: 90 }`
- **Résolution** (`solved`) : Le revoilà, qui file vers le sud — devant le Fer à Cheval, puis en se faufilant près du Garage Pistons. Il se dirige vers la rivière.
- **Fils rouges** (`thread`) : `c03.fourgon` → `c03.lapince.1` ; `c03.lapince.1` → `c03.lapince.2`

##### Étape `s4` — après : `s3` (`after` omis)

- **Question** : Le Pont Central est gardé, et Lapince a pourtant gagné la rive sud. Quelqu’un l’a aidé à traverser la Fenaison. Qui, et comment ?
- **Réponses** (`accept`) : `c03.bateau`, `c03.lola.2`
- **Fausses pistes** (`nearMiss`) :
  - `z.pont-central` → « Le Pont Central est gardé par deux agents depuis ce matin. Lapince a trouvé autre chose. »
  - `c03.lapince.3` → « C’est bien lui, déjà sur la rive sud ! Mais comment est-il arrivé là ? »
  - `c03.marin.1` → « Ce marin n’a pas bougé de son quai de la matinée : ce n’est pas lui qui a fait traverser Lapince. »
- **Indice 1** : Pas par un pont. Regardez sur l’eau, au sud du Garage Pistons : vous y croiserez une connaissance.
- **Indice 2** : Un bateau rouge, tout près du quai Sud. — zone `{ x: 945, y: 3880, radius: 100 }`
- **Résolution** (`solved`) : En bateau ! La capitaine n’est autre que la dame « évanouie » de la gare : Lola Cachou, la fiancée de Lapince. Pendant qu’il escalade le quai Sud, un jardinier des jardins ouvriers signale à la brigade le vol du chapeau de paille d’un de ses épouvantails.
- **Fils rouges** (`thread`) : `c03.lapince.2` → `c03.bateau` ; `c03.lola.1` → `c03.lola.2`

##### Étape `s5` — après : `s4` (`after` omis)

- **Question** : Aux jardins ouvriers, des épouvantails montent la garde, les bras en l’air. L’un d’eux s’est fait voler son chapeau de paille. Lequel ?
- **Réponses** (`accept`) : `c03.epouvantail-nu.1`
- **Fausses pistes** (`nearMiss`) :
  - `c03.epouvantail.1` → « Cet épouvantail a toujours son chapeau. »
  - `c03.epouvantail.2` → « Cet épouvantail a toujours son chapeau. »
  - `c03.epouvantail.3` → « Cet épouvantail a toujours son chapeau. »
  - `c03.lapince.4` → « Celui-ci a un chapeau… Gardez-le à l’œil quand même. »
- **Indice 1** : Ils se dressent au milieu des potagers, bras levés. Comptez les chapeaux.
- **Indice 2** : Cherchez dans la rangée nord des jardins. — zone `{ x: 1085, y: 4320, radius: 120 }`
- **Résolution** (`solved`) : Un épouvantail décoiffé, cheveux de paille au vent. Quelqu’un avait besoin d’un chapeau…
- **Fils rouges** (`thread`) : `c03.lapince.3` → `c03.epouvantail-nu.1`

##### Étape `s6` — après : `s5` (`after` omis)

- **Question** : Lapince s’est déguisé en épouvantail avec le chapeau volé, mais il porte toujours son pyjama. Démasquez-le !
- **Réponses** (`accept`) : `c03.lapince.4`
- **Fausses pistes** (`nearMiss`) :
  - `c03.epouvantail.1` → « Un vrai épouvantail : pas de rayures, et il ne transpire pas. »
  - `c03.epouvantail.2` → « Un vrai épouvantail : pas de rayures, et il ne transpire pas. »
  - `c03.epouvantail.3` → « Un vrai épouvantail : pas de rayures, et il ne transpire pas. »
  - `c03.epouvantail-nu.1` → « C’est l’épouvantail volé : il n’a plus de chapeau. L’imposteur, lui, l’a sur la tête. »
- **Indice 1** : Un pyjama rayé ne ressemble pas tout à fait à une chemise à carreaux. Et un épouvantail ne transpire jamais.
- **Indice 2** : Regardez la rangée sud des jardins. — zone `{ x: 985, y: 4585, radius: 110 }`
- **Résolution** (`solved`) : Des rayures sous le chapeau de paille, et une goutte de sueur sur le front : Achille Lapince ! Même les pigeons ne s’y trompent pas.
- **Fils rouges** (`thread`) : `c03.epouvantail-nu.1` → `c03.lapince.4`

**Reconstitution** (`replay`)

1. `c03.lola.1` — Devant la gare, Lola fait un malaise spectaculaire. Tous les agents accourent.
2. `c03.fourgon` — Pendant ce temps, Lapince saute du fourgon.
3. `c03.lapince.1` — Il file vers le sud, devant la terrasse du Fer à Cheval…
4. `c03.lapince.2` — … se faufile près du Garage Pistons…
5. `c03.bateau` — … et rejoint Lola, qui l’attend en bateau.
6. `c03.lapince.3` — Sur la rive sud, il escalade le quai.
7. `c03.epouvantail-nu.1` — Aux jardins ouvriers, il vole le chapeau d’un épouvantail…
8. `c03.lapince.4` — … et se plante au milieu des potagers. Il transpire.

---

## 7. c04 — La Grande Paille

| champ | valeur |
|---|---|
| id | `c04` |
| titre | La Grande Paille |
| difficulté | 4 |
| déblocage (`unlockAfter`) | `c03` |
| bonus | non |
| caméra de départ (`start`) | `{ x: 2705, y: 2500, zoom: 1.6 }` |
| étapes | 6 — ouvertes dès le début : `s1`, `s4` |
| personnages / entités | 5 / 14 |
| quartiers | Vieille Ville |
| traverse la rivière | non |
| `landmarkOverrides` | `{"bijouterie":{"features":[{"kind":"brokenWindow","at":0.62,"floor":0}]}}` |
| `zones` | — (aucune zone d’enquête) |

**Accroche** (`teaser`) : Le diamant le plus célèbre de Meulebourg a disparu de la bijouterie Carat. Tout le monde a menti, même le diamant.

**Briefing** (`intro`) :

> Ce matin, avant l’ouverture, la vitrine de la bijouterie Carat a volé en éclats. Disparue : « La Grande Paille », un diamant gros comme une noisette, ainsi nommé à cause du minuscule défaut qui le rend unique.
>
> Le bijoutier, Octave Carat, est effondré. Son assureur aussi, pour d’autres raisons. Les frères Taupin, deux jumeaux qui passent plus de temps sous la ville que dessus, sont déjà soupçonnés.
>
> Autre chose : un voisin insomniaque affirme avoir vu, à l’aube, quelqu’un s’éloigner de la bijouterie avec une tarte. Personne ne l’a cru. Vérifiez quand même.
>
> — Commissaire Odile Fétu

**Épilogue** (`epilogue`) :

> Octave Carat, ruiné, avait remplacé la Grande Paille par un faux pour toucher l’assurance, et confié le vrai diamant à sa sœur, caché dans une tarte. Il comptait simuler un cambriolage ; les jumeaux Taupin, qui n’ont jamais su ce qu’ils volaient, lui ont épargné la peine.
>
> Picotin a retrouvé le diamant avec une molaire. La commissaire lui a offert un dentiste et une médaille, dans cet ordre.

### La vérité

1. Octave Carat, bijoutier **sur la paille**, a remplacé la Grande Paille par un faux pour toucher
   l’assurance ; il comptait simuler lui-même un cambriolage. À l’aube, il sort de sa boutique avec le
   vrai diamant caché dans une tarte, traverse l’est de la Grand-Place…
2. … et confie la tarte à sa sœur, Zita Pistache, à la terrasse du Café du Centre.
3. Plus tard, les jumeaux Taupin surgissent d’une bouche d’égout devant la bijouterie, brisent la vitrine
   et emportent le diamant exposé — le faux. Ludo (sac à dos) a le diamant en main ; Lino fait le guet.
4. Ils se séparent : Lino file vers le Faubourg (rue des Sabots) ; Ludo traverse la Grand-Place, examine
   son butin au soleil près de la fontaine, comprend que c’est du verre et le jette dans la fontaine.
5. Octave joue la victime au téléphone avec son assureur, devant sa vitrine, pendant que Picotin prend sa
   déposition.
6. Zita, voyant des policiers partout, se débarrasse de la tarte en l’offrant… à Picotin, devant l’Hôtel
   de Ville. Il la trouve « un peu croquante au milieu ».

### Déduction et équité

- **Deux fils ouverts dès le début** (`after: []`) : le fil des cambrioleurs (s1 → s2 → s3) et le fil de
  la tarte (s4 → s5) ; la dernière étape (s6) attend les deux. Le joueur peut commencer par l’un ou
  l’autre ; le briefing mentionne explicitement le témoignage de la tarte.
- **Jumeaux** (sosies déclarés, 1 attribut) : Ludo et Lino Taupin sont identiques **sauf le sac à dos**.
  Sur la scène du cambriolage, c’est le jumeau au sac à dos qui tient le diamant : c’est l’observation
  clé de s2 : la résolution de s1 la plante (« l’autre, sac au dos, serre déjà le butin ») et l’indice 1
  la rappelle. Lino réapparaît rue des Sabots, sans sac : `nearMiss` explicite.
- **Chronologie** : le briefing dit « ce matin, avant l’ouverture » (et non plus « cette nuit », qui aurait
  placé le cambriolage avant la sortie d’Octave à l’aube). Trois personnes portent une tarte à l’écran
  (Octave à l’aube, Zita, Picotin) : chacune a son `nearMiss` dans les étapes où on peut la désigner par
  erreur (s4, s5, s6).
- **s3** accepte le faux diamant (posé sur le rebord de la fontaine, agrandi ×1,5) **et** la fontaine
  `lm.fontaine` : un tap sur la fontaine suffit.
- **s4** : sur la Grand-Place, un homme en haut-de-forme et costume violet, une tarte à la main, se
  faufile ; c’est le bijoutier « effondré » de la scène de départ (même haut-de-forme, même costume,
  même canne). Le retournement est **vu**, pas raconté.
- **s5** : 450 u plus au nord, Octave (mains vides) montre Zita, qui porte la tarte.
- **s6** : Zita, les mains vides, salue Picotin qui tient la tarte, un cœur au-dessus de la tête. Picotin
  est la seule réponse ; c’est le gag de l’enquête.
- La Grand-Place est la foule la plus dense après le marché : quelques passants portent un sweat gris
  et un sac à dos (écart de 3 attributs avec Ludo, notés par `check.ts`) ; Ludo s’en distingue par son
  bonnet, ses cheveux bouclés noirs et ses lunettes noires. C’est voulu : difficulté 4.

| id | nom | rôle | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c04.picotin` | Brigadier Gaston Picotin | votre coéquipier | `light` | `short` | `red` | `police` | `uniform` | `blue` | `plain` | `shorts` | `beige` | `mustache` | `scarf` | `large` |
| `c04.octave` | Octave Carat | le bijoutier | `pale` | `bald` | `grey` | `tophat` | `suit` | `purple` | `plain` | `trousers` | `purple` | `glasses` | `cane` | `slim` |
| `c04.ludo` | Ludo Taupin | cambrioleur (le jumeau au sac à dos) | `tan` | `curly` | `black` | `beanie` | `hoodie` | `grey` | `plain` | `trousers` | `black` | `sunglasses` | `backpack` | `large` |
| `c04.lino` | Lino Taupin | cambrioleur (le jumeau sans sac) | `tan` | `curly` | `black` | `beanie` | `hoodie` | `grey` | `plain` | `trousers` | `black` | `sunglasses` | `none` | `large` |
| `c04.zita` | Zita Pistache | la sœur du bijoutier | `dark` | `bun` | `grey` | `none` | `coat` | `yellow` | `checks` | `skirt` | `green` | `none` | `handbag` | `large` |

**Signes distinctifs** (traits portés par au plus 5 % des 3 231 passants ambiants, du plus rare au moins rare) :

- `c04.picotin` : casquette de police (0,4 %), uniforme (1,2 %), cheveux courts rouge (2,1 %)
- `c04.octave` : haut-de-forme (1,0 %), bas violet (1,9 %), haut violet (3,6 %)
- `c04.ludo` : cheveux bouclés noir (3,0 %)
- `c04.lino` : cheveux bouclés noir (3,0 %)
- `c04.zita` : haut jaune à carreaux (0,6 %), cheveux chignon gris (2,4 %), bas vert (3,1 %)

**Entités**

| id | kind | x | y | z / sortY | détails | character | lieu |
|---|---|---|---|---|---|---|---|
| `c04.egout` | prop | 2648 | 2526 | — | prop: 'manhole', variant: 'open' |  | près de : Bijouterie Carat (Vieille Ville) |
| `c04.lino.1` | person | 2663 | 2529 | — | pose: 'climb', facing: 'right' | `c04.lino` | près de : Bijouterie Carat (Vieille Ville) |
| `c04.ludo.1` | person | 2688 | 2523 | — | pose: 'sneak', facing: 'right', holding: 'jewel' | `c04.ludo` | près de : Bijouterie Carat (Vieille Ville) |
| `c04.octave.3` | person | 2730 | 2525 | — | pose: 'phone', facing: 'right', emote: 'sweat' | `c04.octave` | près de : Bijouterie Carat (Vieille Ville) |
| `c04.picotin.1` | person | 2756 | 2527 | — | pose: 'read', facing: 'left' | `c04.picotin` | près de : Bijouterie Carat (Vieille Ville) |
| `c04.ludo.2` | person | 2760 | 2282 | — | pose: 'run', facing: 'right' | `c04.ludo` | Grand-Place (Vieille Ville) |
| `c04.ludo.3` | person | 2892 | 2086 | — | pose: 'point', facing: 'left', emote: 'angry' | `c04.ludo` | Grand-Place (Vieille Ville) |
| `c04.faux` | prop | 2866 | 2081 | 9 / 2081 | prop: 'jewel', scale: 1.5 |  | Grand-Place (Vieille Ville) |
| `c04.lino.2` | person | 2796 | 2722 | — | pose: 'run', facing: 'left' | `c04.lino` | Rue des Sabots (Vieille Ville) |
| `c04.octave.1` | person | 3060 | 2250 | — | pose: 'sneak', facing: 'right', holding: 'cake' | `c04.octave` | Grand-Place (Vieille Ville) |
| `c04.zita.1` | person | 3214 | 1792 | — | pose: 'carry', facing: 'left', holding: 'cake' | `c04.zita` | près de : Café du Centre (Vieille Ville) |
| `c04.octave.2` | person | 3192 | 1795 | — | pose: 'point', facing: 'right' | `c04.octave` | près de : Café du Centre (Vieille Ville) |
| `c04.zita.2` | person | 2700 | 1800 | — | pose: 'wave', facing: 'right' | `c04.zita` | Grand-Place (Vieille Ville) |
| `c04.picotin.2` | person | 2722 | 1802 | — | pose: 'stand', facing: 'left', holding: 'cake', emote: 'heart' | `c04.picotin` | Grand-Place (Vieille Ville) |

**Étapes**

##### Étape `s1` — après : rien (ouverte dès le début) (`after: []`)

- **Question** : La vitrine de la bijouterie Carat a été fracassée. Par où les cambrioleurs sont-ils arrivés ?
- **Réponses** (`accept`) : `c04.egout`
- **Fausses pistes** (`nearMiss`) :
  - `c04.octave.3` → « Le bijoutier se lamente au téléphone avec son assureur. Il a l’air presque… soulagé ? »
  - `c04.picotin.1` → « Picotin prend la déposition du bijoutier. Il a faim, ça se voit. »
  - `c04.lino.1` → « C’est l’un des jumeaux, en train de sortir de quelque part. Mais d’où, au juste ? »
  - `c04.ludo.1` → « C’est l’autre jumeau, le butin déjà en main. Regardez plutôt d’où ils sont sortis tous les deux. »
  - `lm.bijouterie` → « La vitrine fracassée : c’est par là qu’ils sont repartis. Mais par où sont-ils arrivés ? »
- **Indice 1** : Les frères Taupin passent plus de temps sous la ville que dessus.
- **Indice 2** : Regardez par terre, sur le trottoir devant la bijouterie. — zone `{ x: 2675, y: 2515, radius: 70 }`
- **Résolution** (`solved`) : Une plaque d’égout ouverte, juste devant la vitrine : les jumeaux Taupin sont arrivés par les égouts. L’un d’eux en sort encore ; l’autre, sac au dos, serre déjà le butin.
- **Fils rouges** (`thread`) : `c04.egout` → `c04.ludo.1`

##### Étape `s2` — après : `s1` (`after: ["s1"]`)

- **Question** : Les jumeaux se sont séparés en repartant. Retrouvez celui qui a emporté le diamant.
- **Réponses** (`accept`) : `c04.ludo.2`, `c04.ludo.3`
- **Fausses pistes** (`nearMiss`) :
  - `c04.ludo.1` → « C’est bien lui, le diamant à la main… au moment du vol. Où est-il allé ensuite ? »
  - `c04.lino.1` → « Lino sort de l’égout : il n’a rien en main. Regardez lequel des deux tient le diamant devant la vitrine. »
  - `c04.lino.2` → « C’est Lino, le jumeau sans sac à dos. Devant la vitrine, c’est celui au sac à dos qui tenait le diamant. »
- **Indice 1** : Rappelez-vous la scène de la vitrine : un seul des jumeaux tenait le diamant. Il est parti vers le nord, vers la Grand-Place.
- **Indice 2** : Un costaud en sweat gris, bonnet orange et lunettes noires, avec un sac à dos, dans la foule. — zone `{ x: 2735, y: 2330, radius: 140 }`
- **Résolution** (`solved`) : Ludo Taupin, sac au dos, fend la foule de la Grand-Place. Son frère Lino est parti de l’autre côté, vers le Faubourg, pour brouiller les pistes.
- **Fils rouges** (`thread`) : `c04.ludo.1` → `c04.ludo.2`

##### Étape `s3` — après : `s2` (`after: ["s2"]`)

- **Question** : Furieux, Ludo s’est débarrassé du diamant. Où est-il ?
- **Réponses** (`accept`) : `c04.faux`, `lm.fontaine`
- **Fausses pistes** (`nearMiss`) :
  - `c04.ludo.3` → « Ludo est furieux. Il vient de jeter quelque chose, juste devant lui. »
  - `c04.ludo.2` → « C’est Ludo, un peu plus tôt : il a encore le diamant. Suivez-le jusqu’à ce qu’il s’en débarrasse. »
- **Indice 1** : Il a examiné son butin au grand jour, au milieu de la Grand-Place… et ne l’a pas aimé.
- **Indice 2** : Regardez la fontaine. — zone `{ x: 2840, y: 2085, radius: 90 }`
- **Résolution** (`solved`) : Dans la fontaine ! À la lumière du jour, Ludo a compris : c’est du verre. Le diamant de la vitrine était un FAUX.
- **Fils rouges** (`thread`) : `c04.ludo.2` → `c04.ludo.3` ; `c04.ludo.3` → `c04.faux`

##### Étape `s4` — après : rien (ouverte dès le début) (`after: []`)

- **Question** : Un voisin a vu quelqu’un s’éloigner de la bijouterie à l’aube, une tarte à la main. Retrouvez cette personne.
- **Réponses** (`accept`) : `c04.octave.1`
- **Fausses pistes** (`nearMiss`) :
  - `c04.octave.3` → « C’est le bijoutier, plus tard dans la matinée. Il n’a plus de tarte… Cherchez-le à l’aube, sur la Grand-Place. »
  - `c04.picotin.2` → « Picotin a une tarte, oui. Mais il ne l’avait pas à l’aube : il dormait. »
  - `c04.zita.1` → « Cette dame porte bien une tarte, mais elle est à la terrasse d’un café, bien loin de la bijouterie. Ce n’est pas elle que le voisin a vue. »
  - `c04.octave.2` → « C’est bien le bijoutier, mais les mains vides, plus au nord : la tarte n’est plus là. Cherchez-le à l’aube, près de la Grand-Place. »
- **Indice 1** : Haut-de-forme, costume violet, une tarte à la main, l’air de ne pas vouloir être vu… Ça ne vous rappelle personne ?
- **Indice 2** : Il a traversé l’est de la Grand-Place. — zone `{ x: 3010, y: 2280, radius: 140 }`
- **Résolution** (`solved`) : Octave Carat en personne, à l’aube, une tarte sous le bras ! Le bijoutier « effondré » avait des choses à cacher.
- **Fils rouges** (`thread`) : `c04.octave.3` → `c04.octave.1`

##### Étape `s5` — après : `s4` (`after: ["s4"]`)

- **Question** : À qui le bijoutier a-t-il confié la tarte ?
- **Réponses** (`accept`) : `c04.zita.1`
- **Fausses pistes** (`nearMiss`) :
  - `c04.octave.2` → « C’est Octave, les mains vides : il vient de donner la tarte. À qui ? »
  - `c04.octave.1` → « C’est bien Octave, tarte au bras, mais plus tôt. Suivez-le : à qui va-t-il la confier ? »
  - `c04.picotin.2` → « Picotin a une tarte, lui aussi : il en trouve toujours une. Mais ce n’est pas à lui que le bijoutier l’a confiée. »
  - `lm.cafe-du-centre` → « Le Café du Centre, oui. Mais c’est à une personne que le bijoutier a confié la tarte. »
- **Indice 1** : Il a continué vers le nord, jusqu’à une terrasse où l’on sert le café.
- **Indice 2** : Regardez devant le Café du Centre. — zone `{ x: 3200, y: 1820, radius: 90 }`
- **Résolution** (`solved`) : À sa sœur, Zita Pistache, à la terrasse du Café du Centre. Elle devait quitter la ville avec… la tarte.
- **Fils rouges** (`thread`) : `c04.octave.1` → `c04.octave.2` ; `c04.octave.2` → `c04.zita.1`

##### Étape `s6` — après : `s3`, `s5` (`after: ["s3","s5"]`)

- **Question** : Le diamant de la vitrine était un faux : le vrai était caché dans la tarte. Mais Zita ne l’a plus ! Où est la tarte à présent ?
- **Réponses** (`accept`) : `c04.picotin.2`
- **Fausses pistes** (`nearMiss`) :
  - `c04.zita.2` → « Zita, les mains vides. En voyant la police partout, elle s’est débarrassée de la tarte. Juste à côté… »
  - `c04.zita.1` → « Zita portait bien la tarte, à la terrasse du café. Mais elle n’a pas gardé cette tarte longtemps… »
  - `lm.hotel-de-ville` → « L’Hôtel de Ville, oui. Mais entre les mains de qui la tarte a-t-elle atterri ? »
- **Indice 1** : Zita a voulu se débarrasser de la tarte au plus vite, en la donnant à la personne la moins soupçonneuse de la ville.
- **Indice 2** : Regardez devant l’Hôtel de Ville. — zone `{ x: 2760, y: 1790, radius: 90 }`
- **Résolution** (`solved`) : Dans les mains de Picotin, qui la trouve « délicieuse, un peu croquante au milieu ». Le vrai diamant était dedans, comme une fève dans la galette.
- **Fils rouges** (`thread`) : `c04.zita.1` → `c04.zita.2` ; `c04.zita.2` → `c04.picotin.2`

**Reconstitution** (`replay`)

1. `c04.octave.1` — À l’aube, Octave Carat sort de sa bijouterie avec le vrai diamant, caché dans une tarte.
2. `c04.zita.1` — Il confie la tarte à sa sœur Zita, au Café du Centre.
3. `c04.lino.1` — Plus tard, les jumeaux Taupin surgissent des égouts…
4. `c04.ludo.1` — … brisent la vitrine et emportent le diamant — un faux.
5. `c04.lino.2` — Lino file vers le Faubourg pour brouiller les pistes.
6. `c04.ludo.3` — Ludo découvre la supercherie et jette le faux dans la fontaine.
7. `c04.octave.3` — Le bijoutier joue la victime au téléphone avec son assureur.
8. `c04.picotin.2` — Zita, prise de panique, offre la tarte au premier venu : Picotin.

---

## 8. c05 — Rideau !

| champ | valeur |
|---|---|
| id | `c05` |
| titre | Rideau ! |
| difficulté | 5 |
| déblocage (`unlockAfter`) | `c04` |
| bonus | non |
| caméra de départ (`start`) | `{ x: 5660, y: 2490, zoom: 1.5 }` |
| étapes | 7 — ouvertes dès le début : `s1` |
| personnages / entités | 7 / 14 |
| quartiers | Quartier des Arts, La Fenaison |
| traverse la rivière | oui |
| `landmarkOverrides` | — |
| `zones` | — (aucune zone d’enquête) |

**Accroche** (`teaser`) : Première au Théâtre de la Botte : la diva s’effondre à l’entracte. Trois comédiens, un costume, un assassin.

**Briefing** (`intro`) :

> Ce soir, première de « Les Moissonneurs » au Théâtre de la Botte. À l’entracte, la grande Bérénice Fard boit une gorgée de sa camomille… et s’effondre sur le parvis. Empoisonnée.
>
> Le poison a été volé ce matin à l’hôpital Sainte-Paille par un « infirmier » que personne n’y connaissait. Ce matin, justement, la troupe répétait EN COSTUME : les comédiens de la pièce portent tous le pantalon orange des moissonneurs.
>
> Trois d’entre eux avaient de bonnes raisons d’en vouloir à Bérénice : Pétronille Doublure, sa doublure, qui rêve de ses rôles ; Hector Plumeau, le jeune premier, qu’elle venait de quitter ; et Gontran Lamèche, le doyen, qu’elle voulait envoyer à la retraite.
>
> Picotin garde les lieux. Vous avez jusqu’au dernier bateau.
>
> — Commissaire Odile Fétu

**Épilogue** (`epilogue`) :

> Gontran Lamèche a avoué sur le quai, avec le sens du drame qu’on lui connaissait : « Trente ans de seconds rôles. Ce soir, enfin, j’avais le premier. » Il a salué. Personne n’a applaudi.
>
> Pétronille Doublure a repris le rôle dès le lendemain. Hector Plumeau s’est fiancé. Et Picotin a juré de ne plus jamais boire de camomille.

### La vérité

1. Le matin, pendant la répétition générale **en costume** (pantalon orange des « Moissonneurs »),
   Gontran Lamèche, doyen de la troupe que Bérénice voulait mettre à la retraite, enfile une blouse
   blanche et un masque et vole un flacon de poison à l’hôpital Sainte-Paille. Il a oublié d’ôter son
   haut-de-forme et de lâcher son parapluie.
2. Il verse le poison dans la bouteille de camomille de Bérénice.
3. À l’entracte, Bérénice boit et s’effondre sur le parvis du théâtre ; Gontran lit son journal à
   110 u de là, sans un regard.
4. Pendant ce temps, Pétronille Doublure répète la scène de la mort au cimetière, et Hector Plumeau se
   console avec une admiratrice devant le musée.
5. Quand l’étau se resserre, Gontran file par le Pont du Parc et longe les quais du port jusqu’au bateau
   « L’Entracte », où il se cache entre deux caisses. L’armateur, M. Cargo, l’attend sur le quai.

### Déduction et équité — l’élimination

Le cœur de c05 est un **raisonnement par élimination sur des attributs persistants**, entièrement
visible :

| Personnage | Haut-de-forme | Parapluie | Pantalon orange | Verdict |
|---|---|---|---|---|
| Faux infirmier (hôpital) | **oui** | **oui** | **oui** | l’assassin, déguisé (blouse blanche, masque) |
| Pétronille Doublure (cimetière) | oui | non (**canne**) | oui | innocente |
| Hector Plumeau (musée) | non (**chapeau melon**) | oui | oui | innocent |
| Gontran Lamèche (parvis) | oui | oui | oui | **coupable** |
| Fortuné Cargo, armateur (port) | oui | oui | non (**noir**) | sosie volontaire de Gontran (1 attribut), fausse piste de s7 |

- Le briefing donne les trois noms, leurs mobiles et le fait décisif (« ce matin, la troupe répétait en
  costume : pantalon orange »). La résolution de s2 dit « retenez bien ces détails ». Chaque question de
  recherche donne de quoi raisonner sans indice : Pétronille « répète la scène de la mort au calme »
  (cimetière), Hector se console « au milieu des belles choses » (musée).
- **Quatre fils parallèles** après s1 : le faux infirmier (s2) et chacun des trois comédiens (s3, s4, s5),
  dans l’ordre que le joueur veut ; s6 (« désignez l’assassin ») n’ouvre qu’une fois les quatre trouvés.
  s6 accepte n’importe quelle apparition de Gontran à visage découvert ; désigner le faux infirmier
  donne un `nearMiss` (« désignez-le à visage découvert »).
- Les trois attributs ont été choisis parmi les plus visibles : le haut-de-forme (1,1 % des passants), le
  parapluie ouvert au-dessus de la tête (4,2 %) et un pantalon orange (0,7 %). Aucun passant de la ville
  ne réunit les trois.
- **s7** se joue sur les quais du port, très animés : l’armateur, en tout point semblable à Gontran sauf
  le pantalon, attend devant le bateau ; Gontran est accroupi entre deux caisses, à 80 u, en sueur.
  La traversée de la rivière est montrée par l’apparition de Gontran sur le Pont du Parc (`nearMiss`).
- Le seul meurtre du jeu : pas de sang, une bouteille de camomille dans la main, `emote: 'ko'`.

| id | nom | rôle | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c05.picotin` | Brigadier Gaston Picotin | votre coéquipier | `light` | `short` | `red` | `police` | `uniform` | `blue` | `plain` | `shorts` | `beige` | `mustache` | `scarf` | `large` |
| `c05.berenice` | Bérénice Fard | la victime, diva | `light` | `long` | `black` | `none` | `dress` | `red` | `plain` | `skirt` | `red` | `none` | `flowers` | `slim` |
| `c05.gontran` | Gontran Lamèche | le doyen de la troupe | `pale` | `short` | `grey` | `tophat` | `suit` | `red` | `plain` | `trousers` | `orange` | `mustache` | `umbrella` | `large` |
| `c05.gontran-deguise` | Le faux infirmier | voleur de poison | `pale` | `short` | `grey` | `tophat` | `coat` | `white` | `plain` | `trousers` | `orange` | `mask` | `umbrella` | `large` |
| `c05.petronille` | Pétronille Doublure | la doublure | `tan` | `long` | `red` | `tophat` | `coat` | `green` | `plain` | `trousers` | `orange` | `none` | `cane` | `slim` |
| `c05.hector` | Hector Plumeau | le jeune premier | `brown` | `curly` | `brown` | `bowler` | `suit` | `blue` | `plain` | `trousers` | `orange` | `none` | `umbrella` | `regular` |
| `c05.armateur` | Fortuné Cargo | armateur | `pale` | `short` | `grey` | `tophat` | `suit` | `red` | `plain` | `trousers` | `black` | `mustache` | `umbrella` | `large` |

**Signes distinctifs** (traits portés par au plus 5 % des 3 231 passants ambiants, du plus rare au moins rare) :

- `c05.picotin` : casquette de police (0,4 %), uniforme (1,2 %), cheveux courts rouge (2,1 %)
- `c05.berenice` : bouquet (0,8 %), bas rouge (2,8 %), cheveux longs noir (3,6 %), haut rouge (3,8 %)
- `c05.gontran` : bas orange (0,7 %), haut-de-forme (1,0 %), haut rouge (3,8 %), parapluie (4,3 %)
- `c05.gontran-deguise` : cagoule / masque (0,3 %), bas orange (0,7 %), haut-de-forme (1,0 %), parapluie (4,3 %)
- `c05.petronille` : bas orange (0,7 %), haut-de-forme (1,0 %), cheveux longs rouge (1,3 %), haut vert (3,8 %)
- `c05.hector` : bas orange (0,7 %), cheveux bouclés marron (3,7 %), chapeau melon (3,9 %), parapluie (4,3 %)
- `c05.armateur` : haut-de-forme (1,0 %), haut rouge (3,8 %), parapluie (4,3 %)

**Figurants** (personnes d’enquête SANS `character` : apparence portée par l’entité, sans effet sur la règle anti-sosie) :

| entité | skin | hair | hairColor | hat | top | topColor | topPattern | bottom | bottomColor | face | accessory | build |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `c05.medecin` | `dark` | `bun` | `black` | `none` | `coat` | `white` | `plain` | `trousers` | `white` | `glasses` | `briefcase` | `regular` |
| `c05.admiratrice` | `pale` | `ponytail` | `blond` | `straw` | `dress` | `yellow` | `dots` | `skirt` | `yellow` | `sunglasses` | `handbag` | `slim` |

**Entités**

| id | kind | x | y | z / sortY | détails | character | lieu |
|---|---|---|---|---|---|---|---|
| `c05.berenice.1` | person | 5650 | 2500 | — | pose: 'lie', facing: 'right', holding: 'bottle', emote: 'ko' | `c05.berenice` | près de : Théâtre de la Botte (Quartier des Arts) |
| `c05.picotin.1` | person | 5626 | 2503 | — | pose: 'crouch', facing: 'right', emote: 'sweat' | `c05.picotin` | près de : Théâtre de la Botte (Quartier des Arts) |
| `c05.gontran.1` | person | 5762 | 2508 | — | pose: 'read', facing: 'right' | `c05.gontran` | près de : Théâtre de la Botte (Quartier des Arts) |
| `c05.faux-infirmier` | person | 5818 | 3197 | — | pose: 'sneak', facing: 'right', holding: 'bottle' | `c05.gontran-deguise` | près de : Hôpital Sainte-Paille (Quartier des Arts) |
| `c05.medecin` | person | 5758 | 3190 | — | pose: 'stand', facing: 'right', emote: 'question' | _figurant_ | près de : Hôpital Sainte-Paille (Quartier des Arts) |
| `c05.petronille.1` | person | 4600 | 3262 | — | pose: 'read', facing: 'right', emote: 'music' | `c05.petronille` | Cimetière (Quartier des Arts) |
| `c05.hector.1` | person | 4842 | 2532 | — | pose: 'stand', facing: 'right', emote: 'heart' | `c05.hector` | près de : Musée des Beaux-Arts (Quartier des Arts) |
| `c05.admiratrice` | person | 4860 | 2533 | — | pose: 'stand', facing: 'left', emote: 'heart' | _figurant_ | près de : Musée des Beaux-Arts (Quartier des Arts) |
| `c05.gontran.2` | person | 4220 | 3790 | — | pose: 'run', facing: 'left' | `c05.gontran` | Pont du Parc (La Fenaison) |
| `c05.bateau` | vehicle | 5555 | 3950 | — | vehicle: 'boat', facing: 'right', color: 'white', label: 'L’ENTRACTE' |  | près de : Quais du port (La Fenaison) |
| `c05.armateur.1` | person | 5592 | 3973 | — | pose: 'wave', facing: 'left' | `c05.armateur` | Quais du port (La Fenaison) |
| `c05.caisse.1` | prop | 5452 | 3996 | — | prop: 'crate' |  | Quais du port (La Fenaison) |
| `c05.gontran.3` | person | 5472 | 3992 | — | pose: 'crouch', facing: 'right', emote: 'sweat' | `c05.gontran` | Quais du port (La Fenaison) |
| `c05.caisse.2` | prop | 5492 | 3997 | — | prop: 'crate' |  | Quais du port (La Fenaison) |

**Étapes**

##### Étape `s1` — après : rien (ouverte dès le début) (`after` omis)

- **Question** : Trouvez Bérénice Fard, effondrée sur le parvis du théâtre.
- **Réponses** (`accept`) : `c05.berenice.1`
- **Fausses pistes** (`nearMiss`) :
  - `c05.picotin.1` → « Picotin veille sur le corps. Il est tout pâle : c’est son premier meurtre, à lui aussi. »
- **Indice 1** : Sur le parvis, au pied de la façade rouge du théâtre, au milieu des spectateurs de l’entracte.
- **Indice 2** : Une femme en robe rouge, allongée. — zone `{ x: 5670, y: 2470, radius: 80 }`
- **Résolution** (`solved`) : Bérénice Fard, la diva de Meulebourg, foudroyée à l’entracte. Elle tient encore sa bouteille de camomille.

##### Étape `s2` — après : `s1` (`after: ["s1"]`)

- **Question** : Ce matin, un faux infirmier a volé le poison à l’hôpital Sainte-Paille. Trouvez-le.
- **Réponses** (`accept`) : `c05.faux-infirmier`
- **Fausses pistes** (`nearMiss`) :
  - `c05.medecin` → « Une vraie médecin, en vraie blouse. Elle se demande qui était ce nouvel « infirmier »… »
  - `lm.hopital` → « L’hôpital Sainte-Paille, oui. Mais c’est l’infirmier qu’on cherche, dehors, devant l’entrée. »
- **Indice 1** : L’hôpital est au sud, rue des Brancards. Un infirmier avec un flacon… et un drôle de chapeau.
- **Indice 2** : Devant l’entrée de l’hôpital, près des ambulances. — zone `{ x: 5810, y: 3150, radius: 90 }`
- **Résolution** (`solved`) : Blouse blanche et masque… mais un haut-de-forme, un parapluie et le pantalon orange de la troupe ! L’assassin est l’un des comédiens. Retenez bien ces détails.

##### Étape `s3` — après : `s1` (`after: ["s1"]`)

- **Question** : Pétronille Doublure, la doublure de Bérénice, jure avoir répété « la scène de la mort » au calme pendant l’entracte. Trouvez-la.
- **Réponses** (`accept`) : `c05.petronille.1`
- **Indice 1** : Où répète-t-on le mieux la scène de la mort ? Dans l’endroit le plus calme du quartier des Arts.
- **Indice 2** : Au cimetière, sur l’allée centrale. — zone `{ x: 4640, y: 3225, radius: 110 }`
- **Résolution** (`solved`) : Au cimetière, entre deux tombes, Pétronille déclame la mort de l’héroïne. Haut-de-forme et pantalon orange… mais elle s’appuie sur une canne.

##### Étape `s4` — après : `s1` (`after: ["s1"]`)

- **Question** : Hector Plumeau, le jeune premier, s’est éclipsé pendant l’entracte pour se consoler au milieu des belles choses. Trouvez-le.
- **Réponses** (`accept`) : `c05.hector.1`
- **Fausses pistes** (`nearMiss`) :
  - `c05.admiratrice` → « Une admiratrice, très consolante. Elle n’a jamais mis les pieds au théâtre. »
  - `lm.musee` → « Le Musée des Beaux-Arts, oui. Mais c’est Hector qu’on cherche, sur le parvis. »
- **Indice 1** : Quel bâtiment du quartier des Arts abrite le plus de belles choses ? Marbre, colonnes, statues…
- **Indice 2** : Sur le parvis du Musée des Beaux-Arts. — zone `{ x: 4890, y: 2520, radius: 110 }`
- **Résolution** (`solved`) : Devant le musée, Hector se console déjà avec une admiratrice. Pantalon orange et parapluie… mais un chapeau melon.

##### Étape `s5` — après : `s1` (`after: ["s1"]`)

- **Question** : Gontran Lamèche, le doyen de la troupe, jure qu’il lisait son journal pendant l’entracte. Trouvez-le.
- **Réponses** (`accept`) : `c05.gontran.1`
- **Fausses pistes** (`nearMiss`) :
  - `c05.berenice.1` → « Bérénice ne lira plus rien ce soir. Cherchez celui qui lit. »
  - `c05.picotin.1` → « Picotin veille sur la victime. Cherchez plutôt celui qui lit son journal. »
- **Indice 1** : Il n’est pas allé bien loin : il est resté sur le parvis du théâtre.
- **Indice 2** : À l’est du parvis, un monsieur lit son journal sans lever les yeux. — zone `{ x: 5725, y: 2495, radius: 90 }`
- **Résolution** (`solved`) : Gontran lit tranquillement son journal à quelques pas de la victime, sans un regard pour elle. Haut-de-forme, parapluie, pantalon orange.

##### Étape `s6` — après : `s2`, `s3`, `s4`, `s5` (`after: ["s2","s3","s4","s5"]`)

- **Question** : Comparez les trois comédiens au faux infirmier de l’hôpital. Qui a empoisonné Bérénice ? Désignez-le.
- **Réponses** (`accept`) : `c05.gontran.1`, `c05.gontran.2`, `c05.gontran.3`
- **Fausses pistes** (`nearMiss`) :
  - `c05.petronille.1` → « Haut-de-forme et pantalon orange, oui… mais une canne. Le faux infirmier avait un parapluie. »
  - `c05.hector.1` → « Parapluie et pantalon orange, oui… mais un chapeau melon. Le faux infirmier portait un haut-de-forme. »
  - `c05.faux-infirmier` → « C’est bien l’assassin, déguisé. Désignez-le à visage découvert. »
- **Indice 1** : Le faux infirmier avait gardé trois choses : un haut-de-forme, un parapluie et le pantalon orange. Un seul comédien a les trois.
- **Indice 2** : Celui qui lisait son journal sans regarder la victime… — zone `{ x: 5790, y: 2470, radius: 90 }`
- **Résolution** (`solved`) : Gontran Lamèche : haut-de-forme, parapluie, pantalon orange. Le doyen a volé le poison ce matin, déguisé en infirmier, et l’a versé dans la camomille de Bérénice. Mais quand Picotin s’est retourné… Gontran avait disparu.
- **Fils rouges** (`thread`) : `c05.faux-infirmier` → `c05.gontran.1` ; `c05.gontran.1` → `c05.berenice.1`

##### Étape `s7` — après : `s6` (`after: ["s6"]`)

- **Question** : Gontran file vers le port pour embarquer sur le dernier bateau. Retrouvez-le avant le départ !
- **Réponses** (`accept`) : `c05.gontran.3`
- **Fausses pistes** (`nearMiss`) :
  - `c05.armateur.1` → « Monsieur Cargo, l’armateur de « L’Entracte » : haut-de-forme, costume rouge, parapluie… mais un pantalon NOIR. Il attend un passager en retard. »
  - `c05.gontran.2` → « C’est bien lui, sur le Pont du Parc. Il a traversé la rivière : cherchez-le sur l’autre rive. »
  - `c05.gontran.1` → « C’est bien lui, mais devant le théâtre : il n’y est plus. Il file vers le port. »
  - `c05.faux-infirmier` → « Le faux infirmier, ce matin, à l’hôpital. Depuis, il a retiré sa blouse. »
  - `c05.bateau` → « Le bateau « L’Entracte » attend son dernier passager. Il n’est pas encore à bord. »
- **Indice 1** : Il a traversé la Fenaison par le Pont du Parc, puis longé les quais vers l’est, jusqu’au bateau « L’Entracte ».
- **Indice 2** : Tout près du bateau, quelqu’un se cache entre deux caisses. — zone `{ x: 5480, y: 3940, radius: 100 }`
- **Résolution** (`solved`) : Accroupi entre deux caisses, à trois pas de la passerelle, le parapluie à la main. Picotin l’attendait — pour une fois, au bon endroit.
- **Fils rouges** (`thread`) : `c05.gontran.1` → `c05.gontran.2` ; `c05.gontran.2` → `c05.gontran.3`

**Reconstitution** (`replay`)

1. `c05.faux-infirmier` — Ce matin, Gontran, déguisé en infirmier, vole un flacon de poison à l’hôpital.
2. `c05.berenice.1` — Il verse le poison dans la camomille de Bérénice. À l’entracte, elle boit et s’effondre.
3. `c05.gontran.1` — Gontran lit son journal à deux pas, sans un regard.
4. `c05.petronille.1` — Pendant ce temps, Pétronille répète au cimetière…
5. `c05.hector.1` — … et Hector se console devant le musée.
6. `c05.gontran.2` — Démasqué, Gontran file par le Pont du Parc…
7. `c05.gontran.3` — … et se cache sur le quai, à trois pas de « L’Entracte ».

---

## 9. Bonus — Les Aiguilles du Fondateur

| champ | valeur |
|---|---|
| id | `bonus-aiguilles` |
| titre | Les Aiguilles du Fondateur |
| difficulté | 3 |
| déblocage (`unlockAfter`) | `c00` |
| bonus | oui |
| caméra de départ (`start`) | `{ x: 3200, y: 2400, zoom: 0.12 }` |
| étapes | 1 — ouvertes dès le début : `s1` |
| personnages / entités | 0 / 10 |
| quartiers | Quartier de la Gare, Parc des Meules, Les Halles, Vieille Ville, Le Faubourg, Quartier des Arts, La Fenaison, Les Jardins, Le Port |
| traverse la rivière | oui |
| `landmarkOverrides` | — |
| `zones` | — (aucune zone d’enquête) |

**Accroche** (`teaser`) : Dix aiguilles d’or, perdues il y a deux siècles par le fondateur de Meulebourg. La botte de foin, c’est la ville entière.

**Briefing** (`intro`) :

> On raconte qu’Hector Meule, fondateur de la ville, cherchait une aiguille d’or dans une botte de foin quand il décida de bâtir Meulebourg autour. Il en perdit dix autres en chemin, et laissa ce testament :
>
> « Là où l’on attend les trains, le temps a deux aiguilles : j’en ai mis une troisième.
> Ma main levée en tient une, et ne la lâche pas.
> Le boucher a ses crochets ; à sa porte, mon aiguille.
> La police perd ses affaires : cherchez entre ses voitures.
> À l’école, on apprend à compter : commencez dans la cour.
> Les enfants creusent pour trouver des trésors : au parc, un bac à sable en cache un.
> Un ange veille sur les morts, et sur une aiguille.
> Sur le Pont Central, une aiguille regarde couler la Fenaison.
> Aux jardins ouvriers, elle pousse devant la serre la plus au sud, un peu à l’écart des autres.
> La capitainerie garde tout ce qui entre au port… même une aiguille. »
>
> Zoomez bien : une aiguille d’or n’est qu’un petit trait doré.

**Épilogue** (`epilogue`) :

> Le maire de Meulebourg vous a remis la Meule d’Or, la plus haute distinction de la ville (un petit tas de foin en laiton, très lourd).
>
> Hector Meule avait raison : à Meulebourg, on finit toujours par trouver l’aiguille. Il suffit de regarder chaque brin.

### Principe

Une seule étape, dix réponses (`required: 10`). Chaque vers du testament désigne un lieu remarquable ;
chaque aiguille est un objet `needle` agrandi ×1,5 (9 u, soit 18 px au zoom 2) et tagué `'needle'`. Les
dix lieux couvrent les neuf quartiers :

| # | Vers du testament | Lieu | Quartier |
|---|---|---|---|
| 1 | « Là où l’on attend les trains, le temps a deux aiguilles : j’en ai mis une troisième. » | sur le cadran de l’horloge de la gare (en hauteur : `z` 139) | Gare |
| 2 | « Ma main levée en tient une, et ne la lâche pas. » | dans la main levée de la Statue du Fondateur (`z` 36) | Parc |
| 3 | « Le boucher a ses crochets ; à sa porte, mon aiguille. » | devant la Boucherie Tendron | Halles |
| 4 | « La police perd ses affaires : cherchez entre ses voitures. » | devant le commissariat, entre deux voitures de police | Vieille Ville |
| 5 | « À l’école, on apprend à compter : commencez dans la cour. » | cour de l’école Jules-Botte, au pied de la façade | Faubourg |
| 6 | « Les enfants creusent pour trouver des trésors : au parc, un bac à sable en cache un. » | bac à sable de l’aire de jeux | Parc |
| 7 | « Un ange veille sur les morts, et sur une aiguille. » | au pied de l’ange est du cimetière | Arts |
| 8 | « Sur le Pont Central, une aiguille regarde couler la Fenaison. » | trottoir est du Pont Central, côté nord | Fenaison |
| 9 | « Aux jardins ouvriers, elle pousse devant la serre la plus au sud, un peu à l’écart des autres. » | devant la serre la plus au sud (`b.jardins.68`, 2029 × 4699), près du chemin des Serres | Jardins |
| 10 | « La capitainerie garde tout ce qui entre au port… même une aiguille. » | devant la porte de la capitainerie | Port |

**Indice 2 sans zone** (exception documentée à la règle « l’indice 2 a une zone ») : avec dix réponses
dispersées, une zone fixe montrerait toujours la même aiguille, même trouvée. Sans `area`, le jeu
(`CaseSession`) calcule le projecteur autour d’une aiguille **non trouvée**, et le recalcule à chaque
aiguille trouvée.

Les aiguilles n° 1, 2, 7 et 9 dépendent d’éléments de décor : le cadran de la gare et la statue sont des
lieux remarquables (fixes) ; l’ange du cimetière (`a.o.517`, 4890 × 3246) et la serre la plus au sud
(`b.jardins.68`) sont ambiants mais stables pour la graine de la ville — si le générateur change,
revérifier par capture.

**Un vers = un seul lieu.** La ville compte trois horloges (gare, Hôtel de Ville, église Saint-Foin) et
33 serres : les vers 1 et 9 ont été précisés (« Là où l’on attend les trains… », « la serre la plus au sud,
un peu à l’écart des autres ») et l’aiguille 9 déplacée devant cette serre-là (elle était devant l’une des
33, au hasard). Le vers 6 dit « au parc » (le terrain de jeux de l’école a lui aussi un toboggan).

**Entités**

| id | kind | x | y | z / sortY | détails | character | lieu |
|---|---|---|---|---|---|---|---|
| `bonus-aiguilles.aiguille.1` | prop | 779 | 1571 | 139 / 1571 | prop: 'needle', scale: 1.5, tags: ["needle"] |  | près de : Gare de Meulebourg (Quartier de la Gare) |
| `bonus-aiguilles.aiguille.2` | prop | 4578 | 621 | 36 / 621 | prop: 'needle', scale: 1.5, tags: ["needle"] |  | Parc des Meules (Parc des Meules) |
| `bonus-aiguilles.aiguille.3` | prop | 2965 | 366 | — | prop: 'needle', scale: 1.5, tags: ["needle"] |  | près de : Boucherie Tendron (Les Halles) |
| `bonus-aiguilles.aiguille.4` | prop | 1820 | 2584 | — | prop: 'needle', scale: 1.5, tags: ["needle"] |  | près de : Commissariat (Vieille Ville) |
| `bonus-aiguilles.aiguille.5` | prop | 1860 | 3200 | — | prop: 'needle', scale: 1.5, tags: ["needle"] |  | Cour de l'école (Le Faubourg) |
| `bonus-aiguilles.aiguille.6` | prop | 6020 | 1690 | — | prop: 'needle', scale: 1.5, tags: ["needle"] |  | Parc des Meules (Parc des Meules) |
| `bonus-aiguilles.aiguille.7` | prop | 4890 | 3272 | — | prop: 'needle', scale: 1.5, tags: ["needle"] |  | Cimetière (Quartier des Arts) |
| `bonus-aiguilles.aiguille.8` | prop | 2232 | 3712 | — | prop: 'needle', scale: 1.5, tags: ["needle"] |  | Pont Central (La Fenaison) |
| `bonus-aiguilles.aiguille.9` | prop | 2029 | 4710 | — | prop: 'needle', scale: 1.5, tags: ["needle"] |  | Chemin des Serres (Les Jardins) |
| `bonus-aiguilles.aiguille.10` | prop | 4600 | 4338 | — | prop: 'needle', scale: 1.5, tags: ["needle"] |  | près de : Capitainerie (Le Port) |

**Étape**

##### Étape `s1` — après : rien (ouverte dès le début) (`after` omis)

- **Question** : Retrouvez les dix aiguilles d’or du Fondateur. Chaque vers du testament désigne un lieu.
- **Réponses** (`accept`) : `bonus-aiguilles.aiguille.1`, `bonus-aiguilles.aiguille.2`, `bonus-aiguilles.aiguille.3`, `bonus-aiguilles.aiguille.4`, `bonus-aiguilles.aiguille.5`, `bonus-aiguilles.aiguille.6`, `bonus-aiguilles.aiguille.7`, `bonus-aiguilles.aiguille.8`, `bonus-aiguilles.aiguille.9`, `bonus-aiguilles.aiguille.10` — `required: 10`
- **Indice 1** : Relisez le testament : chaque vers désigne un lieu de Meulebourg. Une aiguille est un petit trait doré : zoomez au maximum.
- **Indice 2** : Le projecteur éclaire les environs d’une aiguille encore cachée. — _pas de zone : projecteur automatique autour d’une réponse non trouvée_
- **Résolution** (`solved`) : Les dix aiguilles d’or sont réunies sur votre bureau. Elles brillent comme au premier jour.

---

## 10. Récapitulatif de toutes les entités

Chaque entité d’enquête, avec son lieu (lieu remarquable le plus proche à moins de 90 u, sinon rue la
plus proche) et l’entité **d’une autre enquête** la plus proche. Règle : aucune entité de deux enquêtes
différentes à moins de 80 u (ancre à ancre). Le validateur officiel vérifie en plus qu’aucune emprise
ne se chevauche.

| enquête | id | x | y | lieu | autre enquête la plus proche |
|---|---|---|---|---|---|
| c00 | `c00.picotin.1` | 1612 | 1880 | Rue des Remèdes (Vieille Ville) | `c03.fourgon` à 503 u |
| c00 | `c00.livreur.1` | 1648 | 1914 | Rue Neuve (Vieille Ville) | `c03.fourgon` à 542 u |
| c00 | `c00.banc` | 1540 | 1915 | Avenue de la Gare (Vieille Ville) | `c03.fourgon` à 436 u |
| c00 | `c00.livreur.2` | 1537 | 1915.6 | Avenue de la Gare (Vieille Ville) | `c03.fourgon` à 433 u |
| c00 | `c00.croquette` | 1561 | 1945 | Avenue de la Gare (Vieille Ville) | `c03.fourgon` à 462 u |
| c00 | `c00.tarte` | 1575 | 1946 | Rue des Remèdes (Vieille Ville) | `c03.fourgon` à 476 u |
| c00 | `c00.pigeons` | 1521 | 1949 | Avenue de la Gare (Vieille Ville) | `c03.fourgon` à 424 u |
| c01 | `c01.rose.1` | 2612 | 369 | près de : Boulangerie Lemiel (Les Halles) | `bonus-aiguilles.aiguille.3` à 353 u |
| c01 | `c01.picotin.1` | 2645 | 370 | près de : Boulangerie Lemiel (Les Halles) | `bonus-aiguilles.aiguille.3` à 320 u |
| c01 | `c01.lafouine.1` | 2850 | 531 | Place des Halles (marché) (Les Halles) | `bonus-aiguilles.aiguille.3` à 201 u |
| c01 | `c01.motus.1` | 2716 | 534 | Place des Halles (marché) (Les Halles) | `bonus-aiguilles.aiguille.3` à 300 u |
| c01 | `c01.poubelle` | 3250 | 612 | près de : Place des Halles (marché) (Les Halles) | `bonus-aiguilles.aiguille.3` à 376 u |
| c01 | `c01.caisse` | 3250 | 612.5 | près de : Place des Halles (marché) (Les Halles) | `bonus-aiguilles.aiguille.3` à 377 u |
| c01 | `c01.lafouine.2` | 3302 | 634 | près de : Cinéma Le Rex (Les Halles) | `bonus-aiguilles.aiguille.3` à 431 u |
| c01 | `c01.spectatrice.1` | 3506 | 633 | près de : Cinéma Le Rex (Les Halles) | `bonus-aiguilles.aiguille.3` à 603 u |
| c01 | `c01.spectateur.1` | 3520 | 633 | près de : Cinéma Le Rex (Les Halles) | `bonus-aiguilles.aiguille.3` à 616 u |
| c01 | `c01.lafouine.3` | 3535 | 633 | près de : Cinéma Le Rex (Les Halles) | `bonus-aiguilles.aiguille.3` à 629 u |
| c01 | `c01.gamine.1` | 3549 | 633 | près de : Cinéma Le Rex (Les Halles) | `bonus-aiguilles.aiguille.3` à 642 u |
| c02 | `c02.baronne.1` | 5300 | 1066 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 848 u |
| c02 | `c02.picotin.1` | 5322 | 1069 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 868 u |
| c02 | `c02.barbarie.1` | 5492 | 1040 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 837 u |
| c02 | `c02.duchesse.1` | 5472 | 1041 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 849 u |
| c02 | `c02.lulu.1` | 5615 | 998 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 802 u |
| c02 | `c02.canard.1` | 5596 | 966 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 839 u |
| c02 | `c02.canard.2` | 5576 | 973 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 843 u |
| c02 | `c02.barbarie.2` | 5370 | 1190 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 820 u |
| c02 | `c02.bigarade.1` | 5585 | 1165 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 682 u |
| c02 | `c02.camionnette` | 5300 | 1297 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 820 u |
| c02 | `c02.lulu.2` | 5266 | 1270 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 863 u |
| c02 | `c02.duchesse.2` | 5249 | 1272 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 877 u |
| c02 | `c02.duchesse.3` | 5172 | 1333 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.6` à 920 u |
| c02 | `c02.panneau` | 4906 | 1494 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 933 u |
| c02 | `c02.president.1` | 4926 | 1500 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 945 u |
| c02 | `c02.duchesse.4` | 4946 | 1503 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 956 u |
| c02 | `c02.canard.3` | 4966 | 1504 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 964 u |
| c02 | `c02.concurrente.1` | 4984 | 1503 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 971 u |
| c02 | `c02.barque` | 5390 | 660 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 813 u |
| c02 | `c02.barbarie.3` | 5360 | 661 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 783 u |
| c02 | `c02.canard.4` | 5322 | 676 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 746 u |
| c02 | `c02.canard.5` | 5458 | 672 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 881 u |
| c02 | `c02.canard.6` | 5352 | 690 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 777 u |
| c02 | `c02.canard.7` | 5430 | 694 | Parc des Meules (Parc des Meules) | `bonus-aiguilles.aiguille.2` à 855 u |
| c03 | `c03.fourgon` | 1110 | 1846 | près de : Parvis de la gare (Quartier de la Gare) | `c00.pigeons` à 424 u |
| c03 | `c03.lola.1` | 1074 | 1797 | Parvis de la gare (Quartier de la Gare) | `bonus-aiguilles.aiguille.1` à 372 u |
| c03 | `c03.picotin.1` | 1098 | 1799 | Parvis de la gare (Quartier de la Gare) | `bonus-aiguilles.aiguille.1` à 392 u |
| c03 | `c03.lapince.1` | 856 | 2267 | près de : Bar Le Fer à Cheval (Quartier de la Gare) | `bonus-aiguilles.aiguille.1` à 700 u |
| c03 | `c03.client` | 818 | 2269 | près de : Bar Le Fer à Cheval (Quartier de la Gare) | `bonus-aiguilles.aiguille.1` à 699 u |
| c03 | `c03.lapince.2` | 880 | 3270 | près de : Garage Pistons (Quartier de la Gare) | `bonus-aiguilles.aiguille.5` à 982 u |
| c03 | `c03.marin.1` | 1180 | 3693 | Quai Nord (La Fenaison) | `bonus-aiguilles.aiguille.5` à 840 u |
| c03 | `c03.agent.1` | 2170 | 3820 | Pont Central (La Fenaison) | `bonus-aiguilles.aiguille.8` à 125 u |
| c03 | `c03.agent.2` | 2230 | 3842 | Pont Central (La Fenaison) | `bonus-aiguilles.aiguille.8` à 130 u |
| c03 | `c03.bateau` | 945 | 3925 | Quai Sud (La Fenaison) | `bonus-aiguilles.aiguille.5` à 1167 u |
| c03 | `c03.lola.2` | 968 | 3926 | Quai Sud (La Fenaison) | `bonus-aiguilles.aiguille.5` à 1150 u |
| c03 | `c03.lapince.3` | 905 | 3965 | Quai Sud (La Fenaison) | `bonus-aiguilles.aiguille.5` à 1224 u |
| c03 | `c03.epouvantail.1` | 760 | 4512 | Jardins ouvriers (Les Jardins) | `bonus-aiguilles.aiguille.9` à 1284 u |
| c03 | `c03.epouvantail.2` | 1230 | 4520 | Jardins ouvriers (Les Jardins) | `bonus-aiguilles.aiguille.9` à 821 u |
| c03 | `c03.epouvantail.3` | 860 | 4350 | Jardins ouvriers (Les Jardins) | `bonus-aiguilles.aiguille.9` à 1223 u |
| c03 | `c03.epouvantail-nu.1` | 1100 | 4380 | Jardins ouvriers (Les Jardins) | `bonus-aiguilles.aiguille.9` à 986 u |
| c03 | `c03.lapince.4` | 960 | 4640 | Jardins ouvriers (Les Jardins) | `bonus-aiguilles.aiguille.9` à 1071 u |
| c03 | `c03.pigeons` | 942 | 4648 | Jardins ouvriers (Les Jardins) | `bonus-aiguilles.aiguille.9` à 1089 u |
| c04 | `c04.egout` | 2648 | 2526 | près de : Bijouterie Carat (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 830 u |
| c04 | `c04.lino.1` | 2663 | 2529 | près de : Bijouterie Carat (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 845 u |
| c04 | `c04.ludo.1` | 2688 | 2523 | près de : Bijouterie Carat (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 870 u |
| c04 | `c04.octave.3` | 2730 | 2525 | près de : Bijouterie Carat (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 912 u |
| c04 | `c04.picotin.1` | 2756 | 2527 | près de : Bijouterie Carat (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 938 u |
| c04 | `c04.ludo.2` | 2760 | 2282 | Grand-Place (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 987 u |
| c04 | `c04.ludo.3` | 2892 | 2086 | Grand-Place (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 1182 u |
| c04 | `c04.faux` | 2866 | 2081 | Grand-Place (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 1161 u |
| c04 | `c04.lino.2` | 2796 | 2722 | Rue des Sabots (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 986 u |
| c04 | `c04.octave.1` | 3060 | 2250 | Grand-Place (Vieille Ville) | `bonus-aiguilles.aiguille.4` à 1284 u |
| c04 | `c04.zita.1` | 3214 | 1792 | près de : Café du Centre (Vieille Ville) | `c01.lafouine.2` à 1161 u |
| c04 | `c04.octave.2` | 3192 | 1795 | près de : Café du Centre (Vieille Ville) | `c01.lafouine.2` à 1166 u |
| c04 | `c04.zita.2` | 2700 | 1800 | Grand-Place (Vieille Ville) | `c00.livreur.1` à 1058 u |
| c04 | `c04.picotin.2` | 2722 | 1802 | Grand-Place (Vieille Ville) | `c00.livreur.1` à 1080 u |
| c05 | `c05.berenice.1` | 5650 | 2500 | près de : Théâtre de la Botte (Quartier des Arts) | `bonus-aiguilles.aiguille.6` à 891 u |
| c05 | `c05.picotin.1` | 5626 | 2503 | près de : Théâtre de la Botte (Quartier des Arts) | `bonus-aiguilles.aiguille.6` à 903 u |
| c05 | `c05.gontran.1` | 5762 | 2508 | près de : Théâtre de la Botte (Quartier des Arts) | `bonus-aiguilles.aiguille.6` à 858 u |
| c05 | `c05.faux-infirmier` | 5818 | 3197 | près de : Hôpital Sainte-Paille (Quartier des Arts) | `bonus-aiguilles.aiguille.7` à 931 u |
| c05 | `c05.medecin` | 5758 | 3190 | près de : Hôpital Sainte-Paille (Quartier des Arts) | `bonus-aiguilles.aiguille.7` à 872 u |
| c05 | `c05.petronille.1` | 4600 | 3262 | Cimetière (Quartier des Arts) | `bonus-aiguilles.aiguille.7` à 290 u |
| c05 | `c05.hector.1` | 4842 | 2532 | près de : Musée des Beaux-Arts (Quartier des Arts) | `bonus-aiguilles.aiguille.7` à 742 u |
| c05 | `c05.admiratrice` | 4860 | 2533 | près de : Musée des Beaux-Arts (Quartier des Arts) | `bonus-aiguilles.aiguille.7` à 740 u |
| c05 | `c05.gontran.2` | 4220 | 3790 | Pont du Parc (La Fenaison) | `bonus-aiguilles.aiguille.10` à 667 u |
| c05 | `c05.bateau` | 5555 | 3950 | près de : Quais du port (La Fenaison) | `bonus-aiguilles.aiguille.7` à 950 u |
| c05 | `c05.armateur.1` | 5592 | 3973 | Quais du port (La Fenaison) | `bonus-aiguilles.aiguille.7` à 992 u |
| c05 | `c05.caisse.1` | 5452 | 3996 | Quais du port (La Fenaison) | `bonus-aiguilles.aiguille.7` à 917 u |
| c05 | `c05.gontran.3` | 5472 | 3992 | Quais du port (La Fenaison) | `bonus-aiguilles.aiguille.7` à 926 u |
| c05 | `c05.caisse.2` | 5492 | 3997 | Quais du port (La Fenaison) | `bonus-aiguilles.aiguille.7` à 942 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.1` | 779 | 1571 | près de : Gare de Meulebourg (Quartier de la Gare) | `c03.lola.1` à 372 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.2` | 4578 | 621 | Parc des Meules (Parc des Meules) | `c02.canard.4` à 746 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.3` | 2965 | 366 | près de : Boucherie Tendron (Les Halles) | `c01.lafouine.1` à 201 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.4` | 1820 | 2584 | près de : Commissariat (Vieille Ville) | `c00.tarte` à 683 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.5` | 1860 | 3200 | Cour de l'école (Le Faubourg) | `c03.agent.1` à 693 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.6` | 6020 | 1690 | Parc des Meules (Parc des Meules) | `c02.bigarade.1` à 682 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.7` | 4890 | 3272 | Cimetière (Quartier des Arts) | `c05.petronille.1` à 290 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.8` | 2232 | 3712 | Pont Central (La Fenaison) | `c03.agent.1` à 125 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.9` | 2029 | 4710 | Chemin des Serres (Les Jardins) | `c03.epouvantail.2` à 821 u |
| bonus-aiguilles | `bonus-aiguilles.aiguille.10` | 4600 | 4338 | près de : Capitainerie (Le Port) | `c05.gontran.2` à 667 u |

**Vérification** : 98 entités d’enquête. Plus petite distance entre deux entités d’enquêtes différentes : **125 u** (`c03.agent.1` ↔ `bonus-aiguilles.aiguille.8`) — règle des 80 u respectée.

---

## 11. Comment écrire une nouvelle enquête

### 11.1 Méthode

1. **Une idée de crime et un gag visible.** Varier la nature du crime (vol, enlèvement, évasion,
   escroquerie, meurtre — un seul pour tout le jeu —, sabotage, contrebande, chantage…) et le quartier.
   Le gag doit se *voir* (un voleur masqué dans une file de cinéma, un épouvantail qui transpire).
2. **Écrire la vérité** : la chronologie des faits, scène par scène. Chaque scène est un instant ; un
   personnage peut y figurer plusieurs fois (à des instants différents).
3. **Choisir les lieux** dans la vraie ville : `npm run world -- landmarks | streets | zones`, vue
   d’ensemble (`/dev/overview.html?labels=1&streets=1`), puis capture au zoom 2 de chaque scène
   (`/tools/content/preview.html?x=…&y=…&zoom=2&grid=20&ids=2`) pour repérer les places libres, les
   arbres, les voitures, les toits. Éviter les zones des autres enquêtes (récapitulatif ci-dessus).
4. **Écrire les questions** à rebours de la vérité : on part de ce que voit l’enquêteur (le crime) et
   chaque question fait découvrir une scène. 3 étapes pour un tutoriel, 4 à 7 pour une enquête.
5. **Dessiner les personnages** : apparence complète (les 12 champs de `PersonAppearance`), choisie pour
   être reconnaissable (voir les règles d’équité) ; figurants pour le décor.
6. **Placer les entités** (sonde : `npx tsx tools/content/probe.ts x,y …`), écrire le `CaseDef` dans
   `src/content/cases/`, l’ajouter à `cases/index.ts` (avec ses sosies dans `LOOKALIKES`).
7. **Vérifier** : `npx tsx tools/content/check.ts` (zéro problème), captures de chaque scène au zoom 2
   **et** de la caméra de départ au format téléphone (390 × 844), lecture critique des captures.
8. **Documenter** dans le gabarit (vérité, déduction et équité), régénérer ce document.

### 11.2 Règles d’équité

1. **Toute réponse est visible** au zoom 1,5–2 (on ne peut désigner qu’à partir du zoom 1,5) : une entité
   ou une zone, jamais un intérieur (sauf buste à une fenêtre, `pose: 'window'`).
2. **Personnage clé = au moins deux signes distinctifs rares** (≤ 5 % des passants : voir les listes
   « Signes distinctifs » générées) **ou** un objet tenu que la foule n’a jamais (sac d’argent, bijou,
   tarte…). Un personnage reconnaissable seulement par une combinaison banale est une faute.
3. **Deux personnages différents diffèrent d’au moins 3 attributs saillants** (`SALIENT_KEYS` : chapeau,
   haut, couleur du haut, motif, accessoire, coiffure, couleur des cheveux, couleur du bas, visage).
   **Exception : le sosie volontaire**, déclaré dans `LOOKALIKES`, documenté ici (quel attribut, où), qui
   diffère d’**un** attribut **bien visible** (chapeau, motif, accessoire, couleur du bas) et qui porte un
   `nearMiss` expliquant la différence.
4. **Figurants** : à au moins 3 attributs de tout personnage. Ne jamais faire d’un rôle générique un
   personnage (la règle anti-sosie repeindrait les passants de ce rôle).
5. **La question donne ce qu’il faut savoir** : soit la description de la cible, soit l’assurance que
   l’indice décisif a été montré plus tôt (« retenez bien ces détails »). Jamais de devinette sur un
   détail que le joueur n’a pas pu voir.
6. **Une étape, plusieurs bonnes réponses** quand plusieurs taps sont légitimes (la caisse et la
   poubelle ; le bateau et sa capitaine ; deux apparitions du fuyard).
7. **Chaque tap plausible mais faux a son `nearMiss`** : les autres apparitions du bon personnage
   (« c’est bien lui, mais plus tôt »), les sosies, les fausses pistes évidentes, Picotin, et, sur une
   question « où ? », le **lieu** cité (`lm.*` ou `z.*` : « le kiosque, oui, mais Duchesse est juste à
   côté »). Un `nearMiss` ne peut pas être à l’intérieur d’une zone ou d’un bâtiment accepté (le
   validateur le refuse). Un bâtiment en `nearMiss` capte aussi les taps sur les passants devant sa
   façade : à éviter sur la première étape d’une enquête testée en e2e (la « mauvaise réponse » du test
   doit rester une erreur).
8. **Deux indices par étape** : le premier, texte seul, oriente (quartier, direction, règle de
   déduction) ; le second ajoute une zone (`area`) qui contient **toute** la réponse **sans la centrer**,
   de rayon 60 à 150 u en général (450 au plus). Un projecteur centré sur la réponse vaut une
   révélation (indice 3) : on décale le centre de la moitié environ du jeu libre
   (`rayon − demi-diagonale de la réponse`), de préférence vers la scène précédente. Exception : le bonus
   (zone automatique, déjà décalée par `CaseSession`).
9. **La difficulté vient** de la distance entre les scènes, de la densité de la foule, des sosies, des
   fils parallèles, des traversées — **jamais** d’un détail invisible (lunettes, moustache, peau, texte
   d’affiche, plaque).
10. **Pas d’identifiant ambiant** (`a.*`) en réponse ni en fausse piste : ils peuvent changer ou être
    retirés. Utiliser `lm.*`, `z.*` ou ses propres entités.
11. **Le texte dit ce que le dessin montre.** La couleur d’un chapeau est **fixe par type** (`HAT_HEX` :
    casquette rouge, bonnet **orange**, casque jaune, képi bleu…) : écrire « bonnet orange », jamais
    « bonnet noir ». Le contrôle (`content:check`) refuse une couleur de chapeau citée qui ne correspond pas.
    Même exigence pour les objets (« sac d’argent à la main », pas « caisse sous le bras »), les masques
    (« masque de bandit », pas « cagoule »), les bateaux (« bateau », pas « barque »), les poses (un
    personnage qui pointe désigne quelque chose : ne pas le tourner vers un autre suspect).
12. **Une question, un indice ou un vers désigne UNE seule chose.** Vérifier avec `npm run world --
    landmarks | near x y r | rect …` qu’aucun autre élément visible ne répond aussi bien : trois horloges
    en ville (gare, Hôtel de Ville, église), 33 serres aux jardins ouvriers, plusieurs bateaux rouges sur la
    Fenaison, trois porteurs de tarte à l’écran en c04… Sinon on précise le texte (« là où l’on attend les
    trains », « la serre la plus au sud »), on déplace l’entité ou on ajoute un `nearMiss`.
13. **Ce que le texte affirme du décor ambiant se vérifie** (`npm run world -- near x y r`) : « à côté des
    taxis » alors qu’il n’y en a pas fait chercher un taxi qui n’existe pas. Les références au décor ambiant
    (bus, ambulances) sont à revérifier si la graine de la ville change.
14. **Chaque étape donne la prémisse de la suivante** : la question n’affirme pas un fait que le joueur n’a
    vu nulle part (le vol du chapeau de l’épouvantail, en c03, est annoncé dans la résolution de s4).
15. **Les étapes ouvertes en parallèle ont un `label`** (1 à 3 mots, deux étapes ouvertes ensemble n’ont
    pas le même) : c’est le texte de l’onglet.

### 11.3 Règles de placement

- **Sol praticable** (`walkable`), **jamais caché par un toit** (`hiddenByRoof: false`, y compris le haut
  du corps), **hors chaussée** sauf véhicules (les passages piétons sont tolérés), jamais sur le ballast.
- **Véhicules** : sur une voie **est-ouest** (ils sont dessinés de profil). On roule à droite : voie nord
  vers l’ouest (`facing: 'left'`), voie sud vers l’est (`facing: 'right'`). Ancre (roues) ≈ axe − 3 u pour
  la voie nord, axe + 23 u pour la voie sud (ex. boulevard des Halles, axe y = 1300 : 1297 / 1323).
  Un vélo garé n’a pas de `driver`.
- **Bateaux** : ancre sur l’eau (rivière y 3700–3960, étang). Un conducteur (`driver`) n’est visible que
  minuscule dans la cabine : pour qu’on reconnaisse quelqu’un à bord, poser une **personne sur le pont**
  (`z: 10`, `sortY` = y du bateau + 1).
- **En hauteur** (toit, statue, horloge) : `z` = hauteur, `sortY` explicite = clé de tri du support + 1
  (bâtiment : `footprint.y + footprint.h`). L’ancre (x, y) reste au sol, devant le support.
- **Assis sur un banc** : personne à (x du banc ± 5, y du banc + 0,6), `pose: 'sit'`, `sortY` = y.
- **Chien en laisse** : 16 u devant le maître, même `facing` ; le maître tient `'leash'`.
- **Retrait de l’ambiant** : toute entité ambiante (passant, arbre, réverbère, voiture…) dont l’emprise
  touche celle d’une entité d’enquête (marge 6 u) disparaît. C’est voulu, mais vérifier en capture qu’on
  n’a pas déboisé un square ou retiré la voiture qui donnait son sens à la scène.
- **80 u** au moins entre une entité et toute entité d’une autre enquête (récapitulatif, `check.ts`).
- **Caméra de départ** : sur la première scène, à un zoom ≥ 1,5 (on peut désigner tout de suite), sans
  montrer d’emblée les réponses des étapes suivantes.

### 11.4 Check-list avant de livrer une enquête

- [ ] `npx tsx tools/content/check.ts` : « OK : aucun problème » (inclut `validateAllCases`).
- [ ] `npx tsc -p tools/content/tsconfig.json` sans erreur.
- [ ] Une capture au zoom 2 de chaque scène, lue : chaque réponse est entière, non masquée, lisible.
- [ ] Une capture de la caméra de départ au format téléphone (390 × 844).
- [ ] Chaque personnage clé a ≥ 2 signes distinctifs rares (liste générée) ou un objet unique.
- [ ] Chaque sosie est déclaré dans `LOOKALIKES`, documenté, et a son `nearMiss`.
- [ ] Chaque étape : question autosuffisante, 2 indices (le 2ᵉ avec zone contenant une réponse),
      `nearMiss` pour chaque tap plausible, résolution qui fait avancer le récit, fils rouges.
- [ ] Reconstitution chronologique (les légendes racontent l’histoire vraie dans l’ordre).
- [ ] Un gag visible, un jeu de mots au plus deux, aucun gore.
- [ ] Le gabarit est complété (vérité, déduction et équité) et `gen.ts` relancé.

---

## 12. Limites connues et points d’attention

- **Épouvantails** : le vocabulaire n’a pas d’épouvantail ; ce sont des personnes `pose: 'handsup'`,
  chapeau de paille, plantées au milieu des potagers. Lisibles avec le texte de la question ; si l’art
  ajoute un jour une variante (ex. `prop: 'statue'`, `variant: 'scarecrow'`), c03 pourrait l’utiliser pour
  les vrais épouvantails (Lapince resterait une personne).
- **Textes trop petits** : les affiches (`poster`) et les étiquettes de panneaux (`sign`) ne sont pas
  lisibles au zoom de jeu ; elles ne servent que d’ambiance (c01 : « LE CASSE DU SIÈCLE » ; c02 :
  « CONCOURS DE CANES »). Les noms de bateaux et de camionnettes se lisent à partir du zoom 2 environ.
- **« Bateau »** : le seul bateau du vocabulaire est un bateau à moteur de 90 u (cabine, drapeau, bouée) :
  les textes disent « bateau » et jamais « barque » ni « ramer ». L’id `c02.barque` est resté tel quel
  (les ids sont stables).
- **Masque de bandit** : `face: 'mask'` est une bande noire sur les yeux. Les textes de c01 disent « masque
  de bandit » ; `tools/content/gen.ts` imprime encore « cagoule / masque » dans les listes de signes
  distinctifs (hors du périmètre de la revue).
- **Traces de pas** (`footprints`) : couleur fixe et peu contrastée sur les pavés ; aucune enquête ne
  s’en sert pour l’instant.
- **Passants à exactement 3 attributs** d’un personnage (autorisés par la règle anti-sosie) : `check.ts`
  les liste (option `--verbose`). Les plus proches d’une scène : un passant au sweat gris et sac à dos sur
  la Grand-Place (c04), un jardinier en chemise blanche rayée et chapeau de paille aux jardins ouvriers
  (c03 ; il n’a ni les cheveux en épis ni les bras levés). Assumés comme difficulté.
- **Fil rouge et reconstitution** utilisent le centre des entités ; le fil de c03 entre la gare et le quai
  traverse tout le quartier de la Gare (c’est l’effet recherché).
- **Ambiant retiré** : chaque scène retire les passants qu’elle chevauche ; quelques réverbères et
  arbres disparaissent (vérifié en capture : aucun décor important).
- **Dépendance au générateur** : les positions ont été choisies pour la graine `20261014` et le
  générateur de la phase 1. Si la ville change, relancer `check.ts` et refaire les captures.

---

## 13. Annexe — Revue critique

Revue **adverse** des sept enquêtes par l’agent « critique » (phase 3, 15/10/2026), suivie de corrections
directes dans `src/content/cases/*.ts` : les enquêtes n’avaient jamais été relues par un regard extérieur.
Les ids d’entités et d’étapes sont restés **stables** (aucune sauvegarde ni test cassé). Aucun contrat
(`types.ts`, `config.ts`…) n’a été modifié.

### 13.1 Méthode

- Lecture intégrale du code de chaque enquête, puis, pour **chaque étape**, une tentative de la casser :
  captures de la vraie carte (aperçu des scènes aux zooms 1,5 / 2 / 3, page de jeu, projecteur de l’indice 2),
  requêtes sur le monde (`npm run world -- near | rect | landmarks | streets`), comparaison texte ↔ dessin.
- Contrôles automatiques écrits pour l’occasion (non conservés) : voisins d’apparence les plus proches de
  chaque réponse (ambiguïté), position du projecteur de l’indice 2 par rapport à la réponse, pickabilité au
  centre de chacune des 130 réponses et fausses pistes, recensement des horloges, serres, bateaux,
  statues, aires de jeux et sables de la ville (unicité des énigmes du bonus), vérification des noms de rues
  et de lieux cités dans les textes.
- Preuves visuelles conservées dans `docs/screenshots/` : `critique-c05-elimination.jpg` (le raisonnement de
  c05 est lisible), `critique-c01-voleur-motus-file.jpg`, `critique-c03-epouvantails-bateau.jpg`,
  `critique-bonus-aiguilles.jpg` (les dix aiguilles après correction), `critique-indices-decentres-a.jpg`
  et `-b.jpg` (les projecteurs de l’indice 2 après décalage, réponse cerclée).

### 13.2 Problèmes corrigés

| # | Où | Problème (preuve) | Correction |
|---|---|---|---|
| 1 | **Toutes les étapes** (31 zones) | Le projecteur de l’indice 2 était quasi **centré sur la réponse** (distance centre → réponse : 3 à 47 % du rayon, médiane 23 %) : il équivalait à la révélation (indice 3) et ôtait tout intérêt au palier. | Centre décalé de 25 à 64 u (28 à 48 % du rayon, médiane 43 %), de préférence vers la scène précédente ; la réponse reste **entière** dans le cercle (vérifié sur planches). Règle ajoutée (§ 11.2.8). Rayon de c04 s3 porté à 90 (la fontaine est grande). |
| 2 | Bonus, vers 9 | « devant une serre » : **33 serres** aux jardins ouvriers, énigme sans solution unique. | Vers précisé (« la serre la plus au sud, un peu à l’écart des autres ») et aiguille 9 déplacée devant `b.jardins.68`, la serre la plus au sud. |
| 3 | Bonus, vers 1 | « Là où le temps a deux aiguilles » : **trois horloges** (gare, Hôtel de Ville, église). | « Là où l’on attend les trains… ». |
| 4 | Bonus, vers 6 | Le terrain de jeux de l’école a aussi un toboggan. | « … au parc, un bac à sable en cache un. » |
| 5 | c01 (6 textes) | « Cagoule » : le dessin est un **masque de bandit** (bande noire sur les yeux, avec le bonnet par-dessus). | « Masque de bandit » / « masqué » ; gag conservé. |
| 6 | c01 s2 | « La caisse sous le bras » alors que le voleur tient un **sac d’argent à la main** (capture zoom 2). | Question et résolution alignées sur le dessin. |
| 7 | c02 s5, replay | « Barque », « il n’ose plus ramer » : le bateau est un **bateau à moteur** de 90 u. | « Bateau », « il n’ose plus avancer » ; gag ajouté (il a baptisé son bateau comme son canard). |
| 8 | c02 s1 | La baronne **montrait du doigt l’ouest**, à l’opposé du ravisseur (est), vers une passante ambiante : un faux indice. | Bras au ciel (`handsup`), message de fausse piste adapté. |
| 9 | c03 s1 | « À côté des taxis » : **aucun taxi** près du fourgon (requête `near`), seulement un bus et des voitures. | « Juste à côté du bus vert ». |
| 10 | c03 s4 | Quatre bateaux ambiants sur la Fenaison (dont un rouge, « LE HÉRON ») et une question qui ne dit pas qui chercher. | « Qui, et comment ? » ; indice 1 : « une connaissance » ; `nearMiss` du marin du quai Nord. |
| 11 | c03 s5 | La **prémisse** (un chapeau d’épouvantail volé) n’était amenée nulle part ; « bras en l’air » ne figurait qu’à l’indice 1. | Résolution de s4 : un jardinier signale le vol ; question de s5 : « des épouvantails montent la garde, les bras en l’air ». |
| 12 | c03 s6 | La question ne donnait aucun discriminant (le seul vrai est le pyjama rayé et la sueur). | « … mais il porte toujours son pyjama » ; messages « pas de rayures ». |
| 13 | c03, accroche | « Il ne doit pas aller bien loin… si ? » : phrase incorrecte. | « … sauf si quelqu’un l’attend » (amorce de Lola). |
| 14 | c04, briefing | « **Cette nuit**, la vitrine a volé en éclats » contredit la chronologie (Octave sort **à l’aube, avant** les jumeaux). | « Ce matin, avant l’ouverture ». |
| 15 | c04 s2 | L’observation clé (quel jumeau tient le diamant) n’était **ni plantée ni rappelée** hors de l’indice 1. | Résolution de s1 : « l’autre, sac au dos, serre déjà le butin » ; indice 1 reformulé en rappel de la scène. |
| 16 | c04 s4, s5, s6 | **Trois porteurs de tarte** à l’écran (Octave, Zita, Picotin) : désigner l’un d’eux au mauvais moment comptait comme erreur (étoiles). | Sept `nearMiss` explicites (dont « Picotin a une tarte, lui aussi : il en trouve toujours une » et deux lieux : Café du Centre, Hôtel de Ville). Étiquette d’onglet de s4 : « Le voisin » (elle doublait celle de s5). |
| 17 | c04, épilogue | « Le cambriolage tombait à pic » : coïncidence non motivée. | Octave comptait simuler un cambriolage ; les jumeaux lui ont épargné la peine. |
| 18 | c00 | Le coupable (Croquette, chien de la commissaire) **tombait du ciel** ; la question de s1 s’appuyait sur la moustache (invisible) ; la légende finale contredisait l’épilogue (Picotin « devait garder » le chien). | Amorce loyale dans le briefing (« je suppose que c’est une coïncidence »), reprise en s3 ; moustache retirée ; légende corrigée. |
| 19 | c05 s2 | « L’hôpital est **au sud-est** » : il est au sud (dx +160, dy +700). | « Au sud ». |
| 20 | c05 s3, s4 | Les questions ne donnaient **aucun moyen de déduire le lieu** sans indice (cimetière, musée) : un indice était obligatoire, donc la 3ᵉ étoile perdue d’avance. | « …jure avoir répété « la scène de la mort » au calme… » ; « …se consoler au milieu des belles choses… ». |
| 21 | c05 s1 | « C’est son premier meurtre **aussi** » : ambigu. | « … à lui aussi ». |
| 22 | c01 s3-s4, c02 s2, s4 et s5, c03 s1-s4, c04 s1 et s3-s6, c05 s2, s4, s5 et s7 | **34 taps plausibles sans message** (autres apparitions du bon personnage, Lola et Picotin dans la première image de c03, canards autour du bateau de c02, Gontran au théâtre pendant la fuite, et, sur les questions « où ? », le lieu désigné par erreur : vitrine de la bijouterie, Café du Centre, Hôtel de Ville, kiosque, étang, cinéma, hôpital, musée) comptaient comme erreurs et coûtaient des étoiles. | 34 `nearMiss` ajoutés (8 lieux `lm.*` / `z.*`), tous les personnages et objets pickables (130 cibles contrôlées). |

### 13.3 Vérifié et laissé tel quel (pas un problème)

- **c05, l’élimination est lisible au zoom de jeu** (`critique-c05-elimination.jpg`) : haut-de-forme, parapluie
  ouvert et jambes orange du faux infirmier se voient sous la blouse ; Pétronille se trahit par l’**absence**
  de parapluie (sa canne, fine, ne suffit pas seule), Hector par son chapeau melon (rond, pas haut).
- **c04, les jumeaux** se distinguent au zoom 1,5 par le sac à dos (vert, sur le dos de Ludo).
- **c03 s6** : Lapince est le seul épouvantail dont le haut est rayé **et** qui porte une bulle de sueur ;
  les carreaux blancs sur blanc des vrais épouvantails ne se lisent pas au zoom 1,5, mais la bulle tranche.
- **Aucune pose « bras levés » ambiante** dans la ville (comptage) : les épouvantails de c03, Motus et la
  baronne ne sont jamais confondus avec un passant.
- **c01 s2** : au zoom 1,5 le masque ne se lit pas ; ce sont le sac d’argent (signe « € ») et la course qui
  distinguent le voleur de Motus (bras levés). Au zoom 2, le masque se lit.
- Toutes les distances d’apparence (≥ 3 attributs, sauf sosies déclarés), les placements et les noms de
  rues citées (`npm run world -- streets`) sont corrects ; les titres sont neutres ; la typographie est
  propre (apostrophes courbes, aucune espace insécable saisie à la main : l’interface les ajoute).

### 13.4 Problèmes restants et pistes

- **Variété des mécaniques** : aucune enquête ne demande de désigner une **zone** (`z.*`) ni de lire un
  texte ; tout se joue sur « qui / où / quel objet ». À étudier pour une prochaine enquête (un lieu à
  désigner, un vers à déchiffrer comme dans le bonus).
- **c05 est plus longue que difficile** : l’élimination (haut-de-forme, parapluie, pantalon) tient en deux
  comparaisons. Une version plus corsée ajouterait un second déguisement ou un témoin qui se trompe.
- **Dépendances au générateur** : les textes citent le bus vert de la gare (c03 s1), les ambulances de
  l’hôpital (c05 s2), l’ange du cimetière et la serre `b.jardins.68` (bonus). Si la graine change,
  revérifier (`npm run world -- near …`).
- **`tools/content/gen.ts`** imprime encore « cagoule / masque » dans les listes de « signes distinctifs »
  (hors du périmètre de la revue) : libellé à corriger en « masque de bandit ».
- **Gag de Motus** : « coincé dans une boîte invisible » mais le mime a les bras levés (la pose `handsup` est
  la plus proche du vocabulaire) ; assumé.
- **Les ids portent encore d’anciens noms** (`c02.barque`, `c01.caisse`) : volontairement conservés (ids stables).
- **Interface (hors périmètre)** : dans la barre haute, l’accent de l’« É » majuscule de « La Belle Évasion » est
  presque rogné (police Special Elite, interligne serré) ; à voir côté `src/ui/styles.css`.
