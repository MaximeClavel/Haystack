# Rejeu aveugle de l'enquête c02 « Coin-coin ! » (joueur `c02r`)

Testeur aveugle neuf : seul `tools/playtest/README.md` a été lu avant la partie. Aucun autre fichier du dépôt
(code, docs, tests, comptes rendus des autres joueurs) n'a été ouvert avant d'avoir fini de jouer. Les captures
citées sont dans `.shots/playtest/c02/c02r/` (numéro = nom du fichier, ex. `018.png`).

## 1. Verdict

| | |
|---|---|
| Enquête résolue | **oui** (« Affaire classée ») |
| Questions résolues | **5 / 5** |
| Erreurs | **0** (aucune désignation fausse) |
| Indices | **1** (indice 1 « conseil écrit », demandé sur la question 5 après ~35 commandes de recherche) |
| Étoiles | **2 sur 3** (plafonnées à 2 par l'indice ; sans indice j'aurais eu 3) |
| Commandes | 93 (94 avec `stop`) |
| Durée | 9 min 10 s |
| Captures prises / images lues | 40 prises / **38 lues** (toutes sauf la 001 et la 024) ; **imagesReadable = true**, aucune lecture d'image n'a échoué |
| Incidents techniques de la page | 0 |

Répartition des commandes par question (approx.) : Q1 ≈ 13, Q2 ≈ 16, Q3 ≈ 5, Q4 ≈ 15, Q5 ≈ 39 dont 35 avant l'indice
et 11 après.

## 2. Question par question

### Q1 — « Quelqu'un a attiré Duchesse hors de l'eau avec du pain. Qui ? » (réponse : Hippolyte Barbarie)

- **Compris** : chercher une personne qui tend du pain à un canard. La question parle de « pain » ; je cherchais
  donc quelqu'un qui lance/tend du pain, ou un objet pain/baguette. Le briefing m'avait aussi dit que la baronne
  et Picotin attendent « au pied du ponton ».
- **Regardé** : écran de départ (002) : étang, bateau blanc « LA CANE », promenade avec 5-6 personnages (une
  vieille dame à pois avec une bulle « goutte », un agent bleu à képi, une dame assise au béret). Rien qui ressemble à
  du pain. Zoom sur ces personnages (003) : pas de pain. Panoramique vers la droite (004) : ponton, pêcheur assis,
  femme en vert sur un banc, puis à l'extrême droite un homme à chapeau et veste à carreaux verts qui tient un long
  objet orangé devant un canard jaune (005, 008). Zoom (008) : c'est une baguette, le canard jaune est à ses pieds.
- **Tentative** : 1 seule, juste. Vignette de confirmation (009) correcte (encadré blanc sur l'homme, canard visible).
- **Déductible ?** Oui, une fois la zone vue : baguette + canard doré qui le suit = lisible et drôle. En revanche
  la cible est **hors écran au départ** (à droite du ponton) : il faut deviner qu'il faut aller à droite. J'ai perdu
  ≈ 8 commandes et 5 images à examiner des personnages qui n'ont rien à voir (baronne ? Picotin ? bulles).
- **Aidé** : le texte de récompense (« Il l'attire avec une baguette ») confirme et nomme le personnage ; le carnet
  l'enregistre dans « Personnages identifiés ».

### Q2 — « Barbarie a fourré Duchesse dans un carton et s'en va avec. Où l'emporte-t-il ? » (réponse : la camionnette « VOLAILLES BARBARIE »)

- **Compris** : retrouver Barbarie plus tard dans son histoire, avec un carton. J'ai d'abord cru à un **lieu**
  (« où »), puis à un personnage, avant de comprendre qu'il fallait suivre Barbarie.
- **Regardé** : minicarte (010) peu utile à ce stade. Dézoom (011) : une silhouette verte à chapeau portant un carton
  au bord gauche du chemin (012). Je l'ai suivie vers le sud (013) : le chemin débouche sur le boulevard des Halles où
  une camionnette blanche est garée (014 : « VOLAILLES BARBARIE »). À côté, un enfant à ballon rouge et un canard jaune.
- **Tentatives** : 1 tap trop dézoomé → « Rapprochez-vous pour désigner » (l'auto-zoom a fonctionné), 2e tap OK.
  « Désigner ce véhicule ? » : bonne réponse.
- **Déductible ?** Oui : Barbarie avec carton visible en dézoomant, camionnette avec son nom lisible. Le seul flottement
  vient du mot « Où », qui peut faire croire à un bâtiment (voir problème 2).

### Q3 — « Quand Barbarie revient, la camionnette est vide ! Quelqu'un a libéré Duchesse. Qui ? » (réponse : le petit Lulu)

- **Compris** : chercher quelqu'un près de la camionnette qui a pu ouvrir la portière. Je venais de voir l'enfant au
  ballon et au canard à côté de la camionnette (014, 016).
- **Regardé** : zoom sur la zone (016) : enfant blond en salopette avec bulle « cœur » et le canard jaune juste à côté,
  portière de la camionnette ouverte (rectangle sombre).
- **Tentative** : 1, juste. Vignette (017) correcte.
- **Déductible ?** Oui, très bien : 5 commandes. La bulle « cœur » et le canard à ses pieds sont un bon indice visuel.
  Cette question est la plus fluide.

### Q4 — « Où est Duchesse à présent ? » (réponse : le canard jaune au kiosque à musique, devant le jury)

- **Compris** : retrouver le canard doré à son dernier endroit. Le briefing donne le but : « Cet après-midi, au kiosque
  à musique… concours ». Je me suis aussi appuyé sur la bande de ducks en dézoomant : après la résolution de Q3 la carte
  trace un **fil rouge** entre les réponses (018) et plusieurs canards jaunes jalonnent le trottoir sud du boulevard,
  tous tournés vers l'ouest (018, 019).
- **Regardé** : dézoom (018) ; panoramique vers l'ouest (020, 021) jusqu'au kiosque et à sa foule ; zoom (022) puis crop
  (023) : canard jaune entre un homme en marinière qui pointe du doigt avec bulle « ! » et une dame en colère, plus un colvert
  (le « Baron » ?) à côté.
- **Tentative** : 1, juste. Vignette (025) : le canard jaune encadré, pas le colvert voisin (15 px à côté).
- **Déductible ?** Oui grâce au briefing (concours au kiosque) et au chemin de canards. Risque : plusieurs canards jaunes
  (près de Lulu, sur le trottoir, au kiosque) sont des cibles plausibles : un joueur pressé pourrait désigner celui
  de Q3 ou du trottoir. Je n'ai pas testé le message « fausse piste ».
- **Remarque de libellé** : « Où est Duchesse ? » a pour réponse un animal (« Désigner cet animal ? »), pas un lieu.

### Q5 — « Démasqué, Barbarie a pris la fuite pour échapper à Picotin. Où s'est-il réfugié ? » (réponse : le bateau « LE BARON »)

- **Compris (à tort)** : « se réfugier » + « Où » + le schéma des réponses « lieu » → j'ai cherché un **bâtiment**.
- **Regardé** : autour du kiosque (026, 027, 028 : foule, quelqu'un allongé en vert/jaune qui n'est pas Barbarie),
  carte large (029), minicarte (030) et saut vers le « Musée des Beaux-Arts » (031-035 : musée, plaza avec panneau
  « EXPO », immeubles du Quartier des Arts), puis l'abribus du boulevard (036, 037). Je n'ai trouvé aucun Barbarie, aucun
  Picotin, aucun signe de poursuite. ≈ 35 commandes, 12 images.
- **Tentatives** : aucune désignation (pas d'erreur), mais j'ai ouvert la fenêtre d'indice deux fois (la première fois
  refusée, « Non merci », pour continuer à chercher ; la seconde acceptée).
- **Indice 1** : « Il a filé vers le nord, là où les canards font la loi. » → l'étang. Je suis retourné à l'étang par la
  minicarte (038, 039) : un bateau vert « LE BARON » (040) au milieu de l'eau avec Barbarie (veste à carreaux verts,
  bulle « goutte ») les bras en l'air. Tap sur la coque → « Désigner ce bateau ? » → bonne réponse, affaire résolue.
  Après l'indice : 11 commandes.
- **Déductible sans l'indice ?** **Non, pas de façon raisonnable.** Ni la question, ni le briefing, ni le texte de
  récompense de Q4 (« Au concours, devant le jury ! Duchesse s'est présentée toute seule, à l'heure. ») ne disent où
  Barbarie fuit. La seule voie sans indice est de balayer toute la ville ; l'étang est à ~1 minute de marche du kiosque et
  un bateau n'est pas un « refuge » évident. Une fois l'indice lu, tout est évident. Le jeu a bien fait de proposer
  l'indice 1 : il suffit à lui seul.
- **Détail qui m'a trompé** : le premier écran du jeu montrait déjà un bateau blanc « LA CANE » (002) ; le bateau « LE
  BARON » est plus loin à droite et n'était pas à l'écran.

## 3. Problèmes classés par gravité

### Bloquant (sans indice)

1. **Q5 : aucun indice dans le texte ni dans l'histoire sur la direction de la fuite.** J'ai passé 35 commandes et
   ≈ 12 images (031-037) à fouiller le musée, la plaza et l'abribus. Sans l'indice 1, la solution (un bateau au milieu de
   l'étang) n'est ni déductible ni facile à rencontrer par hasard.
   Preuve : 031 à 037 (recherches vaines), 038-040 (après l'indice).

### Gênant

2. **Le mot « Où » ne désigne pas toujours un lieu, et ça m'a mal orienté.** Q2 « Où l'emporte-t-il ? » → un véhicule,
   Q4 « Où est Duchesse ? » → un animal, Q5 « Où s'est-il réfugié ? » → un bateau. Seule la feuille de confirmation
   (« Désigner ce véhicule / cet animal / ce bateau ? ») révèle le type après coup. Après deux réponses non-bâtiment, j'ai
   quand même cherché un bâtiment en Q5.
3. **Q4 : plusieurs canards jaunes identiques** (au bord de l'étang à Q1, près de Lulu, plusieurs sur le trottoir du boulevard, au kiosque : 018,
   019, 022). Le bon (kiosque) est déductible par le briefing, mais rien dans la question ne dit « à présent = après le
   concours ». Risque d'erreur pour un joueur qui désigne le premier canard rencontré.

### Mineur

4. **Q1 : cible hors écran au départ.** Le cadrage initial (002) montre l'étang et 5 personnages sans rapport ; l'homme à
   la baguette est à droite du ponton, coupé par le bord. Le briefing parle du ponton (coupé lui aussi). J'ai perdu
   ≈ 8 commandes.
5. **Bulles d'humeur sans lien clair avec l'enquête** : « goutte » sur la dame à pois du départ (003), « ! », « … »,
   « colère », « cœur » sur beaucoup de passants. Certaines sont des indices (cœur sur Lulu, goutte sur Barbarie en fuite),
   d'autres du décor : le joueur ne sait pas lesquelles compter.
6. **Minicarte** : les noms de quartiers recouvrent les détails (« Parc des Meules » cache l'étang, 030), aucun repère
   de la question en cours ; utile seulement pour sauter d'un quartier à l'autre.
7. **Panneau d'indice ouvert** : la zone de question + indice prend ≈ 25 % de l'écran (038). Un bouton « replier » existe.
8. **Vignette de confirmation** : fiable (3 vérifiées sur 5 : Q1, Q3, Q4, toutes correctes) ; pour la camionnette et le
   bateau, le texte « Désigner ce véhicule / ce bateau » m'a suffi, sans vérifier l'image.

## 4. Ce qui m'a plu

- Le ton : jeu de mots du titre (« la Plus Belle Cane »), récompenses courtes et drôles (« canard à l'orange — non,
  pardon, pas celle-là », Barbarie bloqué deux heures sur l'étang par les canards, le bateau baptisé comme son canard).
- La **chaîne visuelle** : après chaque bonne réponse un fil rouge et des pastilles dorées relient les réponses sur la
  carte (018, 036) ; on voit l'histoire se dérouler du ponton au kiosque.
- Les canards jaunes en file sur le trottoir (018, 019) qui mènent au kiosque : un vrai chemin à suivre.
- Q2 et Q3 : un même personnage, deux moments, la camionnette lisible, l'enfant au cœur et au canard : excellent
  rapport indice visuel / effort.
- Feuille de confirmation (vignette encadrée, type de cible annoncé), auto-zoom de « Rapprochez-vous pour désigner »,
  texte d'indice qui reste relisible (« Indice 1 sur 3 · relire »), annonce explicite du coût en étoiles avant l'indice.
- Aucun incident technique, aucune désignation ratée (les prises de cible tombent juste, y compris le canard à 15 px d'un colvert).

## 5. Suggestions concrètes et minimales

1. **Q5 (priorité)** : donner une direction **dans le récit**, sans révéler la réponse. Par exemple ajouter à la fin du
   texte de récompense de Q4 : « Démasqué, Barbarie détale vers l'étang. » (ou reprendre le texte de l'indice 1 dans
   l'énoncé : « …Il a filé vers le nord, là où les canards font la loi »). L'indice 1 actuel est bon : le garder tel quel
   comme repli, ou le rendre moins coûteux pour cette question.
2. Reformuler les « Où » dont la réponse n'est pas un lieu : Q2 « À bord de quoi l'emporte-t-il ? » ou « Dans quoi
   l'emporte-t-il ? », Q4 « Où est Duchesse à présent ? » → « Où est Duchesse maintenant, après le concours ? » (ou
   « Retrouvez Duchesse au concours »), Q5 « Où s'est-il réfugié ? » pourrait rester si la direction est donnée en 1.
3. Q1 : décaler le cadrage de départ d'environ 100 px vers la droite (ponton entier + homme à la baguette à l'écran).
4. Q4 : faire apparaître une différence légère (ex. léger « halo » ou jury visible) autour du canard du kiosque, ou ne
   garder qu'un seul canard jaune hors du chemin de l'histoire ; à défaut, une phrase de récompense de Q3 qui précise
   « Duchesse file vers le kiosque à musique ».
5. Minicarte : placer le nom du quartier à côté plutôt que sur la zone, et/ou marquer la dernière réponse résolue.
