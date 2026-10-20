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
| `npm run content:check` (ou `npx tsx tools/content/check.ts --verbose`) | construit la ville AVEC les enquêtes, lance `validateAllCases`, puis les règles de la bible : hors chaussée, 80 u entre enquêtes, écarts d’apparence (≥ 3 attributs saillants sauf sosies déclarés), figurants, sosies ambiants, rayons d’indice, occultation des réponses, couleur d’un bas caché (tablier, manteau, robe) citée dans un texte |
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

<!-- GEN:fiche:c00 -->

<!-- GEN:textes:c00 -->

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
| s3 | désigner un animal / un objet ; les fausses pistes | le chien blanc se tient devant la tarte entière ; la tarte, les pigeons et le dormeur ont chacun un message dédié |

**Amorce loyale** : le briefing signale que le chien blanc de la commissaire, Croquette, a lui aussi disparu ce
matin (« je suppose que c’est une coïncidence ») ; la résolution de s3 la reprend. Le coupable n’est donc
plus un deus ex machina.

Toutes les scènes tiennent dans un rectangle de 130 × 70 u : à la caméra de départ (zoom 1,6), tout
est à l’écran d’un téléphone. Seul piège : un chien orange tenu en laisse se promène dans le square
(décor ambiant) ; il n’a pas de tarte.

<!-- GEN:personnages:c00 -->

**Entités**

<!-- GEN:entites:c00 -->

**Étapes**

<!-- GEN:etapes:c00 -->

**Reconstitution** (`replay`)

<!-- GEN:replay:c00 -->

---

## 4. c01 — La Main dans le sac

<!-- GEN:fiche:c01 -->

<!-- GEN:textes:c01 -->

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

<!-- GEN:personnages:c01 -->

**Entités**

<!-- GEN:entites:c01 -->

Les deux affiches « LE CASSE DU SIÈCLE » ajoutées au cinéma (`landmarkOverrides.cinema`) sont un clin
d’œil : leur texte n’est pas lisible au zoom de jeu et n’entre dans aucune déduction.

**Étapes**

<!-- GEN:etapes:c01 -->

**Reconstitution** (`replay`)

<!-- GEN:replay:c01 -->

---

## 5. c02 — Coin-coin !

<!-- GEN:fiche:c02 -->

<!-- GEN:textes:c02 -->

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
  concours annoncé dans le briefing, au kiosque à musique, 270 u au sud-ouest. La résolution de s4 amorce
  s5 : Barbarie « détale vers l’étang, Picotin aux trousses » (le lieu, sans nommer le bateau ni la
  réponse).
- **s5** : Barbarie est debout sur le pont de son bateau « LE BARON » (le bateau à moteur de 90 u du
  vocabulaire : les textes ne parlent ni de « barque » ni de « ramer »), bras levés, en sueur, au milieu de
  l’étang ; on accepte le bateau **et** lui. Les autres apparitions de Barbarie et les canards ont leur
  `nearMiss`. Sans l’amorce de s4, rien ne disait où il fuyait (rejeu de la phase 3 : 35 commandes
  perdues à chercher un bâtiment, indice obligatoire) ; l’indice 1 (« Pas sur la berge : il a pris le
  large, et les canards l’ont encerclé ») apporte alors le **type** de la cible (sur l’eau, entourée de
  canards) sans nommer le bateau, l’indice 2 la zone. La question garde « Où s’est-il réfugié ? » : toute
  formulation plus précise (« sur quoi », « à bord de quoi ») trahirait le bateau.
- **Cadrage de départ** : (5392, 955) au zoom 1,6. Le ponton, la baronne et Picotin (à gauche), Barbarie
  accroupi avec sa baguette et Duchesse (à droite) tiennent à l’écran à 360, 390 et 412 px de large ; la
  première réponse était auparavant hors écran à droite (rejeu : 8 commandes perdues), alors qu’elle est
  visible dès le départ dans c00, c01, c03, c04 et c05. Barbarie qui porte son carton (s2, 5370 × 1190)
  reste sous le panneau de question, et le bateau de s5 hors cadre.
- Un personnage qui **pointe** est lu comme un indice : la baronne a donc les bras au ciel (`handsup`) et
  non plus le doigt tendu vers l’ouest, à l’opposé du ravisseur.
- La ville possède déjà un bateau ambiant nommé « LE COLVERT » sur l’étang : c’est pourquoi le ravisseur
  ne s’appelle pas Colvert.

<!-- GEN:personnages:c02 -->

**Entités**

<!-- GEN:entites:c02 -->

**Étapes**

<!-- GEN:etapes:c02 -->

**Reconstitution** (`replay`)

<!-- GEN:replay:c02 -->

---

## 6. c03 — La Belle Évasion

<!-- GEN:fiche:c03 -->

<!-- GEN:textes:c03 -->

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
  repérer. La résolution de s2 amorce s3 (« Pendant ce temps, Lapince s’éclipsait par les ruelles du
  sud » : direction, sans nommer le bar ni la rue) ; l’indice 1 apporte alors l’information nouvelle :
  le bar, sa rue (la pastille de lieu affiche « Rue du Fer-à-Cheval ») et le témoin (client à
  casquette rouge qui montre un coureur du doigt) ; l’indice 2 donne la zone. Sans cette amorce, le
  rejeu de la phase 3 a dû acheter l’indice 1 (« vers le sud ») pour une question sans ancrage spatial.
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

<!-- GEN:personnages:c03 -->

**Entités**

<!-- GEN:entites:c03 -->

**Étapes**

<!-- GEN:etapes:c03 -->

**Reconstitution** (`replay`)

<!-- GEN:replay:c03 -->

---

## 7. c04 — La Grande Paille

<!-- GEN:fiche:c04 -->

<!-- GEN:textes:c04 -->

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

<!-- GEN:personnages:c04 -->

**Entités**

<!-- GEN:entites:c04 -->

**Étapes**

<!-- GEN:etapes:c04 -->

**Reconstitution** (`replay`)

<!-- GEN:replay:c04 -->

---

## 8. c05 — Rideau !

<!-- GEN:fiche:c05 -->

<!-- GEN:textes:c05 -->

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

<!-- GEN:personnages:c05 -->

**Entités**

<!-- GEN:entites:c05 -->

**Étapes**

<!-- GEN:etapes:c05 -->

**Reconstitution** (`replay`)

<!-- GEN:replay:c05 -->

---

## 9. Bonus — Les Aiguilles du Fondateur

<!-- GEN:fiche:bonus-aiguilles -->

<!-- GEN:textes:bonus-aiguilles -->

### Principe

Une seule étape, dix réponses (`required: 10`). Chaque vers du testament désigne un lieu remarquable ;
chaque aiguille est un objet `needle` agrandi ×1,5 (9 u, soit 18 px au zoom 2) et tagué `'needle'`. Les
dix lieux couvrent les neuf quartiers :

| # | Vers du testament | Lieu | Quartier |
|---|---|---|---|
| 1 | « Là où l’on attend les trains, le temps a deux aiguilles : j’en ai mis une troisième. » | sur le cadran de l’horloge de la gare (en hauteur : `z` 139) | Gare |
| 2 | « Au parc qui porte mon nom, ma main levée en tient une, et ne la lâche pas. » | dans la main levée de la Statue du Fondateur (`z` 36) | Parc |
| 3 | « Le boucher a ses crochets ; à sa porte, mon aiguille. » | devant la Boucherie Tendron | Halles |
| 4 | « La police perd ses affaires : cherchez entre ses voitures. » | devant le commissariat, entre deux voitures de police | Vieille Ville |
| 5 | « À l’école, on apprend à compter : commencez dans la cour. » | cour de l’école Jules-Botte, au pied de la façade | Faubourg |
| 6 | « Les enfants creusent pour trouver des trésors : au parc, un bac à sable en cache un. » | bac à sable de l’aire de jeux | Parc |
| 7 | « Un ange veille sur les morts, et sur une aiguille. » | au pied de l’ange est du cimetière | Arts |
| 8 | « Sur le Pont Central, une aiguille regarde couler la Fenaison. » | trottoir est du Pont Central, côté nord | Fenaison |
| 9 | « Aux jardins ouvriers, elle pousse devant la serre du coin, là où le chemin des Arrosoirs rejoint celui des Serres. » | devant la serre du coin (`b.jardins.68`, 2029 × 4699), au carrefour du chemin des Arrosoirs et du chemin des Serres | Jardins |
| 10 | « La capitainerie garde tout ce qui entre au port… même une aiguille. » | devant la porte de la capitainerie | Port |

**Indice 2 sans zone** (exception documentée à la règle « l’indice 2 a une zone ») : avec dix réponses
dispersées, une zone fixe montrerait toujours la même aiguille, même trouvée. Sans `area`, le jeu
(`CaseSession`) calcule le projecteur autour d’une aiguille **non trouvée**, et le recalcule à chaque
aiguille trouvée.

Les aiguilles n° 1, 2, 7 et 9 dépendent d’éléments de décor : le cadran de la gare et la statue sont des
lieux remarquables (fixes) ; l’ange du cimetière (`a.o.517`, 4890 × 3246) et la serre du coin
(`b.jardins.68`) sont ambiants mais stables pour la graine de la ville — si le générateur change,
revérifier par capture.

**Un vers = un seul lieu.** La ville compte trois horloges (gare, Hôtel de Ville, église Saint-Foin) et
33 serres : les vers 1 et 9 ont été précisés (« Là où l’on attend les trains… », « la serre du coin, là où
le chemin des Arrosoirs rejoint celui des Serres ») et l’aiguille 9 placée devant cette serre-là (elle était
devant l’une des 33, au hasard). `b.jardins.68` est la serre du carrefour : le chemin des Arrosoirs (vertical,
axe x 1955) s’arrête en T sur le chemin des Serres (horizontal, axe y 4740), et la serre occupe le coin de la
parcelle voisine (emprise 1994–2064 × 4655–4699, à 85 u du carrefour ; la suivante, `b.jardins.118`, est à
197 u, dans le carré des parcelles). Centrée sur le carrefour au zoom 1,5, la pastille de lieu affiche
« Chemin des Arrosoirs / Chemin des Serres » : le critère se vérifie à l’écran. C’est aussi la serre la plus
au sud (la suivante est 60 u plus haut), mais une première version (« la plus au sud de toutes, juste à la
sortie des parcelles ») était invérifiable parmi 33 serres en grille (rejeu de la phase 3 : 35 commandes
perdues, aiguille introuvable sans projecteur) : on ne décrit pas cette serre comme « la dernière de la
rangée du bas » (ce serait `b.jardins.118`) ni par une direction seule. Le vers 6 dit « au parc » (le
terrain de jeux de l’école a lui aussi un toboggan). Le vers 2 dit « au parc qui porte mon nom » : sans lieu,
il pouvait désigner n’importe laquelle des 9 statues de la ville (le fondateur s’appelle Hector Meule, le
parc des Meules).

**Indices.** Le palier 1 (« Chaque quartier cache au moins une aiguille… ») s’appuie sur le tableau
ci-dessus : 10 aiguilles pour 9 quartiers, au moins une par quartier (vérifié par la liste des quartiers du
monde, `npm run world -- districts`). Si une aiguille change de quartier, revoir ce texte. Il ne peut pas
viser une aiguille précise (un texte statique pour dix réponses) ; il donne donc une méthode et l’échelle
utile (« bien voir les passants », soit un zoom d’environ 2, où l’aiguille se distingue ; son éclat blanc
n’est dessiné qu’à partir du zoom 1). Le texte tient en 3 lignes dans le panneau à 360, 390 et 412 px de
large (≈ 120 caractères au plus). Le palier 2 dit que le projecteur passe à une autre aiguille
à chaque aiguille trouvée : c’est voulu (voir ci-dessus), et le palier 3 montre d’un coup toutes les
aiguilles restantes. Le bonus n’ayant qu’une étape, `computeStars` (niveaux d’indice cumulés ≤ nombre
d’étapes pour garder 2 étoiles) donne : le palier 1 coûte une étoile (3 → 2), le palier 2 une seconde
(2 → 1), le palier 3 est gratuit (plancher à 1 étoile).

**Entités**

<!-- GEN:entites:bonus-aiguilles -->

**Étape**

<!-- GEN:etapes:bonus-aiguilles -->

---

## 10. Récapitulatif de toutes les entités

Chaque entité d’enquête, avec son lieu (lieu remarquable le plus proche à moins de 90 u, sinon rue la
plus proche) et l’entité **d’une autre enquête** la plus proche. Règle : aucune entité de deux enquêtes
différentes à moins de 80 u (ancre à ancre). Le validateur officiel vérifie en plus qu’aucune emprise
ne se chevauche.

<!-- GEN:recap -->

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
   tarte — `people.ts` n’en donne à aucun passant ambiant, `world.test.ts` le vérifie…). Un personnage reconnaissable seulement par une combinaison banale est une faute.
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
    personnage qui pointe désigne quelque chose : ne pas le tourner vers un autre suspect), et les **bas
    cachés** : sous un tablier, un manteau ou une robe, le short (ou la jupe sous un manteau) ne se voit pas,
    le pantalon seulement en bas des jambes. Un texte qui cite « short rouge », « jupe verte »… d’un bas
    entièrement caché est une **erreur** de `content:check`, d’un bas en partie caché une note ; la liste des
    « Signes distinctifs » de chaque enquête annote ces bas (« masqué par le tablier, à ne pas citer »). La phrase
    qui reconnaît elle-même le bas caché (« pantalon orange qui dépasse du long manteau ») passe. Pour le texte
    d’une étape (question, indices, réussite) ou d’une fausse piste, le contrôle juge d’abord la ou les personnes
    visées (cibles de l’étape, cible de la fausse piste) : si l’une porte le bas cité, c’est d’elle qu’il s’agit, même
    si un autre personnage de l’enquête montre le même bas à découvert (c05 : le pantalon orange du comédien en
    costume se voit, celui de la comédienne sous le manteau beaucoup moins). L’apparence jugée est celle que le monde
    dessine : celle du personnage quand l’entité en désigne un, et non celle déclarée sur l’entité.
12. **Une question, un indice ou un vers désigne UNE seule chose.** Vérifier avec `npm run world --
    landmarks | near x y r | rect …` qu’aucun autre élément visible ne répond aussi bien : trois horloges
    en ville (gare, Hôtel de Ville, église), 33 serres aux jardins ouvriers, plusieurs bateaux rouges sur la
    Fenaison, trois porteurs de tarte à l’écran en c04… Sinon on précise le texte (« là où l’on attend les
    trains », « la serre du coin, là où le chemin des Arrosoirs rejoint celui des Serres »), on déplace l’entité
    ou on ajoute un `nearMiss`. Le critère doit se **vérifier à l’écran** : un superlatif parmi une trentaine
    d’objets en grille (« la plus au sud ») ne se contrôle pas, un nom de rue affiché par la pastille de lieu, si.
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
| 2 | Bonus, vers 9 | « devant une serre » : **33 serres** aux jardins ouvriers, énigme sans solution unique. | Vers précisé (« la serre la plus au sud de toutes, juste à la sortie des parcelles ») et aiguille 9 déplacée devant `b.jardins.68`, la serre la plus au sud. Repris après le rejeu à l’aveugle (critère invérifiable à l’écran) : « la serre du coin, là où le chemin des Arrosoirs rejoint celui des Serres ». |
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
