# Phase 3 — Rejeu aveugle de l'enquête c03 « La Belle Évasion » (joueur c03r)

Testeur aveugle (nouveau) : seul `tools/playtest/README.md` lu avant de jouer ; aucune lecture de `src/`, `tests/`,
`scripts/`, `docs/` (hors rédaction de ce compte rendu), ni des parties des autres testeurs. Partie lancée par
`node tools/playtest/blind.mjs start c03 --player c03r`. Captures dans `.shots/playtest/c03/c03r/`.

## 1. Verdict

| Mesure | Valeur |
|---|---|
| Enquête résolue | **Oui** (« Affaire classée ») |
| Questions résolues | **6 / 6** |
| Erreurs | **0** (6 désignations sur 6 justes du premier coup) |
| Indices | **1** (indice n° 1 de la question 3) |
| Étoiles | **2 sur 3** (plafonnées par l'indice : « de 3 à 2 étoiles au plus ») |
| Commandes | **116** |
| Durée | **11 min 17 s** |
| Captures prises / images lues | 48 / 47 (la n° 001 n'a pas été lue) — **imagesReadable = true**, aucune lecture d'image n'a échoué |
| Incidents techniques de la page | 0 |

Répartition approximative des commandes : Q1 ≈ 7, Q2 ≈ 8, **Q3 ≈ 60** (et 26 images lues sur 47), Q4 ≈ 16, Q5 ≈ 16,
Q6 ≈ 5, fin ≈ 3. Toute la difficulté du dossier est concentrée sur la question 3.

## 2. Question par question

### Q1 — « Trouvez le fourgon de police, portière ouverte, devant la gare. »
- **Compris** : un fourgon de police, portière ouverte, près de la gare. Le cadrage de départ montre déjà le parvis et,
  en bas, un fourgon bleu « POLICE » dont le flanc est une grande zone sombre (portière ouverte).
- **Regardé** : une capture avec grille (002), un agrandissement du fourgon (003, portière sombre bien lisible).
- **Tentatives** : 1 (juste). Le fourgon est le seul véhicule de police dans la vue.
- **Déductible ?** Oui, sans aucune ambiguïté. Bon démarrage pédagogique (le texte de réussite se termine par
  « Mais que faisaient les agents pendant l'évasion ? », ce qui accroche la question suivante).

### Q2 — « Devant la gare, les agents ont été distraits au moment de l'évasion. Qui a fait diversion ? »
- **Compris** : chercher, sur le parvis, quelqu'un dont l'attitude a pu détourner les agents.
- **Regardé** : carnet (vide, rien d'utile), agrandissement de la scène près du fourgon (004) : une dame allongée
  (bulle « spirale », étourdie) et un agent qui transpire (bulle « goutte »). Autre zone du parvis (005) : une foule de
  passants, quelques bulles « ! » et « … ».
- **Tentatives** : 1 (juste), après contrôle de la vignette de confirmation (006 : la dame allongée, cadre blanc sur elle).
- **Déductible ?** Oui : la seule personne allongée, avec un agent penché sur elle juste à côté du fourgon. Le texte
  de réussite (« évanouie », « robe rose à pois ») donne le détail mémorisable qui sert ensuite. (Je n'ai pas pu
  vérifier le « béret » cité par le texte : sur l'image on voit des cheveux roux bouclés ou un couvre-chef roux et des
  lunettes noires.)
- **Point faible** : la fin du texte de réussite (« Un évanouissement bien commode ») n'ouvre pas sur la question 3,
  contrairement à celle de Q1.

### Q3 — « Lapince a quitté le parvis à pied, en pyjama rayé, cheveux en épis. Quelqu'un l'a vu courir : retrouvez-le. »
C'est la question qui a failli me bloquer (≈ 60 commandes, 26 images).
- **Compris** : retrouver Lapince en train de courir, ailleurs que sur le parvis. Rien n'indique **où** : ni direction, ni
  rue, ni quartier. Le « quelqu'un » qui l'a vu n'est pas désigné.
- **Regardé / tentatives** (≈ 28 commandes avant l'indice) :
  minicarte (007 : seuls les noms de quartiers sont écrits, « Quartier de la Gare » est un grand bloc) ; dézoom et
  balayage de la gare à ×0,5 (008, 009, 017) ; rues autour du parvis, côté ouest (013, 014), côté est (015, 016),
  parc de la Vieille Ville (018). Aucune cible n'a été touchée, donc aucune erreur. Pistes fausses : un personnage aux
  cheveux noirs en épis avec une bulle « ! » caché derrière une vieille dame sur le parvis (005, 012) ; plusieurs
  passants en marinière bleu et blanc (013, 024 : un bonnet orange à bulle « ! », un chapeau de paille) ; un passant à
  casque jaune (016).
- **Indice** : je l'ai demandé après ≈ 28 commandes et 12 images vues sans piste (un peu avant le seuil de 40, par
  souci de ménager les images). Le jeu annonce clairement le coût (« Votre note passera de 3 à 2 étoiles au plus »).
  Contenu : « Il est parti vers le sud, par les petites rues du quartier de la Gare. Le témoin est un client du bar
  Le Fer à Cheval. » Très utile, mais encore à ≈ 30 commandes de la solution.
- **Après l'indice** (≈ 32 commandes) : lecture des enseignes des commerces au sud de la gare (« Chapellerie »,
  « Papeterie », « Droguerie », « Cordonnier », « Primeur », « Caviste », « Coiffeur », « Laverie », « Brasserie ») :
  des enseignes génériques, aucune n'est le bar. J'ai trouvé la rue du Fer-à-Cheval grâce à l'étiquette de lieu en
  haut de l'écran, puis le bar en voyant l'étiquette « Bar Le Fer à Cheval » apparaître quand il passait sous le
  centre de la carte (030). Devant la terrasse : un homme à casquette rouge et bulle « ! » qui pointe du doigt (le
  témoin) et, à sa droite, un coureur blond en épis, haut rayé bleu et blanc, pantalon gris (031).
  « Rapprochez-vous pour désigner » une fois (zoom automatique centré sur la cible : très bien), puis juste.
- **Déductible ?** **Pas sans l'indice** : le texte donne l'apparence mais pas le lieu. Avec l'indice, oui : le bar est
  repérable par son enseigne et par l'étiquette de lieu, et le coureur est reconnaissable (épis blonds + rayures + course
  + un témoin qui le montre). Les passants en marinière sont de bons leurres, mais seul le coureur a les épis et
  l'attitude.

### Q4 — « Le Pont Central est gardé, et Lapince a pourtant gagné la rive sud. Quelqu'un l'a aidé à traverser la Fenaison. Qui, et comment ? »
- **Compris** : traverser la rivière autrement que par le pont, donc par bateau ; « qui » = un batelier.
  Le texte de réussite de Q3 (« il se dirige vers la rivière ») orientait déjà vers le sud.
- **Regardé** : la minicarte (033) où « La Fenaison » est un grand bandeau bleu ; un tap sur la minicarte m'a amené
  directement au quai Nord. Au zoom de départ la rivière paraît vide (035) ; en dézoomant (036, 037) on voit trois
  bateaux : LE HÉRON, BELLE-MEULE et LA COCOTTE. Seul le troisième a quelqu'un sur le pont (038) : une dame à robe rose
  à pois, c'est-à-dire **la dame « évanouie » de la question 2**.
- **Tentatives** : 1 (juste, la dame de La Cocotte). J'ai hésité un instant sur la cible (la personne ou le bateau)
  car le « comment » n'appelle pas de seconde désignation ; la feuille de confirmation m'a proposé « Désigner cette
  personne ? » et c'était bon.
- **Déductible ?** Oui, et c'est le meilleur moment du dossier : on reconnaît un personnage déjà croisé grâce à la
  description du texte de Q2 (« robe rose à pois »).

### Q5 — « Aux jardins ouvriers, des épouvantails montent la garde, les bras en l'air. L'un d'eux s'est fait voler son chapeau de paille. Lequel ? »
- **Compris** : repérer, dans les jardins ouvriers, des personnages figés bras levés (les « épouvantails ») et trouver
  celui qui n'a pas de chapeau. Le texte de réussite de Q4 (« un jardinier des jardins ouvriers… le vol du chapeau de
  paille d'un de ses épouvantails ») et l'étiquette de lieu « Jardins ouvriers · Les Jardins » m'ont guidé.
- **Regardé** : sud de la rivière (039, 040), agrandissements (041 : épouvantail avec chapeau de paille ; 042 :
  épouvantail blond en épis, **sans chapeau**, chemise blanche à carreaux, pantalon gris), jardins plus au sud (043),
  un jardinier à une seule main levée sous un chapeau (045 : pas un épouvantail).
- **Tentatives** : 1 (juste, l'épouvantail sans chapeau), après un « Rapprochez-vous » dû à mon niveau de zoom.
- **Déductible ?** Oui. Seul risque : la présence d'au moins trois personnages bras levés (avec chapeau, sans chapeau,
  et le faux épouvantail de Q6) ainsi que de jardiniers en pose proche ; il faut regarder de près.

### Q6 — « Lapince s'est déguisé en épouvantail avec le chapeau volé, mais il porte toujours son pyjama. Démasquez-le ! »
- **Compris** : un épouvantail avec un chapeau de paille et un haut rayé.
- **Regardé** : je l'avais déjà vu en balayant les jardins pour Q5 (043 puis agrandissement 044 : chapeau de paille,
  haut rayé bleu et blanc, bras levés, bulle « goutte de sueur »). Il m'a suffi de le retrouver (047) et de le toucher.
- **Tentatives** : 1 (juste). **Déductible ?** Oui, très bien : rayures + chapeau + goutte de sueur.
  Note : sur ce dossier, Q5 et Q6 se jouent dans les mêmes jardins, donc Q6 est quasi gratuite pour qui a bien regardé
  pendant Q5 (pas un défaut en soi).

## 3. Problèmes classés par gravité

### Bloquant
Aucun au sens strict (j'ai fini, 0 erreur, 0 incident technique), **mais** Q3 est à la limite : sans l'indice, je
n'avais aucune chance raisonnable de la résoudre sans balayer toute la ville.

### Gênant
1. **Q3 sans ancrage spatial** (captures 007–018 : 12 images sans aucune piste). Le texte décrit Lapince mais ne dit ni
   direction, ni rue, ni lieu. Le texte de réussite de Q2 n'ouvre pas sur Q3 (contrairement à Q1 → Q2, Q3 → Q4, Q4 →
   Q5, qui sont des enchaînements parfaits). L'information décisive (« vers le sud », « client du bar Le Fer à Cheval »)
   n'est dans le jeu que **derrière le premier indice**, qui fait perdre une étoile (3 → 2 au plus). Sur ce dossier, le
   joueur est donc quasi forcé de payer une étoile pour une question dont la réponse n'est pas déductible du texte.
2. **Q3 : trouver le bar reste long même avec l'indice** (≈ 32 commandes, 14 images). Les enseignes des commerces sont
   génériques (Laverie, Brasserie, Papeterie…) et le bar est à ≈ 3 écrans au sud-ouest du parvis. Ce qui m'a sauvé :
   l'étiquette de lieu (« Rue du Fer-à-Cheval », puis « Bar Le Fer à Cheval ») qui apparaît sous le centre de la carte.
   Mais le joueur doit deviner qu'il faut regarder cette étiquette en balayant. Le texte de l'indice ne dit pas
   « une rue porte aussi ce nom ».
3. **Plusieurs leurres rayés** (013, 024, 031 et 005/012) : au moins quatre passants en marinière bleu et blanc, dont un
   avec une bulle « ! », et un personnage aux cheveux noirs en épis caché derrière une vieille dame avec une bulle « ! »
   (005, 012) que je n'ai jamais pu identifier (leurre voulu ? défaut d'occlusion ?). Les bulles « ! » ne discriminent
   pas : le vrai témoin en a une, les leurres aussi.

### Mineur
4. **« Replier la question »** fait disparaître la ligne de l'indice affiché (« Indice 1 sur 3 · relire » n'est plus
   visible une fois le panneau replié et le texte est tronqué) : il faut déplier pour relire le conseil écrit.
5. **Q4 : le « comment » n'est pas demandé** à l'écran (une seule désignation) : j'ai hésité entre la dame et le
   bateau ; la feuille de confirmation (« Désigner cette personne ? ») lève le doute mais seulement après le tap.
6. **Q4 : première vue de la rivière vide** au zoom de départ (035) ; il faut dézoomer pour voir les bateaux (036–037).
   La minicarte et l'étiquette « La Fenaison » aident, mais un joueur peu habitué pourrait croire qu'il n'y a rien.
7. **« béret » (texte de réussite de Q2)** : détail introuvable à l'écran à ce niveau de zoom (voir Q2) — mineur.
8. **Cadrage** : la caméra ne bouge pas entre les questions (voulu probablement) ; c'est précisément ce qui rend Q3
   coûteuse (le joueur démarre sur le parvis alors que la cible est à ≈ 700 px au sud).

## 4. Ce qui m'a plu
- **Le fil narratif et la reconnaissance de personnage** : la dame « évanouie » de Q2 réapparaît capitaine de La
  Cocotte en Q4, et Lapince se déguise en épouvantail en Q6. Les textes de réussite sont courts, drôles, et chaque
  fin de texte (sauf Q2) met la question suivante en place. L'écran final est excellent (tampon « AFFAIRE CLASSÉE »,
  étoiles, explication du plafonnement par les indices, tracé du parcours sur la minicarte).
- **Les bulles d'état** (spirale, goutte, « ! », « … ») donnent de la vie et des indices subtils (la dame étourdie, l'agent
  qui transpire, Lapince qui transpire sous son chapeau).
- **L'étiquette de lieu** sous le centre de la carte (nom de rue, du bar, des jardins ouvriers) est un très bon outil de
  navigation ; elle m'a fait gagner la question 3.
- **La minicarte avec noms de quartiers** : un tap m'a amené au quai en une commande (Q4).
- **Le coût des indices est annoncé avant** (« Votre note passera de 3 à 2 étoiles au plus »), honnête et clair.
- **Auto-zoom « Rapprochez-vous »** : il recentre sur la cible touchée, je n'ai eu qu'à retoucher le centre de l'écran.
- **La vignette de confirmation** m'a toujours montré la bonne cible (contrôlée en Q2 ; les autres tap ont donné le
  bon type de cible « personne / véhicule » dans la feuille).
- Aucun incident technique, aucun geste ignoré, 0 erreur.

## 5. Suggestions concrètes et minimales
1. **Ajouter un ancrage dans le texte de Q3** (ou un lien dans la fin du texte de réussite de Q2) : par exemple
   « Lapince a filé vers le sud, par les petites rues de la Gare. Un client du bar Le Fer à Cheval l'a vu courir :
   retrouvez-le. » On peut alors garder l'indice n° 1 pour un conseil plus fin (par exemple : « Il court devant la
   terrasse du bar, un homme en orange le montre du doigt »). Ou bien ne pas faire perdre d'étoile au tout premier
   indice d'une question.
2. **Enchaîner Q2 → Q3** : terminer le texte de réussite de Q2 par une amorce du type « Pendant ce temps, Lapince
   détalait vers le sud… ».
3. **Ne pas replier l'indice** : garder une ligne « Indice 1 sur 3 · relire » visible même quand la question est
   repliée (ou le répéter dans le carnet, section Notes).
4. **Q4** : préciser dans le texte « Qui, et comment ? » ce qu'on désigne (« Désignez celle qui l'a aidé ») ou accepter
   aussi le bateau ; envisager que la caméra de Q4 se cale sur la rivière (cadrage large) à l'ouverture de la question.
5. Vérifier le **personnage aux cheveux noirs en épis caché derrière une vieille dame** sur le parvis (captures 005,
   012) : si c'est un leurre voulu, très bien ; sinon, c'est peut-être un défaut d'ordre de dessin.

## Annexes — captures utiles
- `002.png` départ ; `003.png` fourgon ; `004.png` / `006.png` dame étourdie et vignette ; `007.png` / `033.png` minicarte ;
  `013.png`, `024.png` leurres en marinière ; `005.png`, `012.png` épis noirs derrière une dame ; `030.png` / `031.png`
  bar Le Fer à Cheval, témoin et coureur ; `037.png` / `038.png` bateaux et La Cocotte ; `040.png`–`044.png` jardins
  ouvriers (épouvantail avec chapeau, sans chapeau, Lapince déguisé) ; `end-screen.png` écran de fin.
