# Phase 3 — Joueur test aveugle : enquête c02 « Coin-coin ! »

Joueur : `c02` (appareil par défaut, Pixel 7 émulé 412×915). Règles respectées : seul `tools/playtest/README.md`
lu avant la fin de la partie, seules commandes `node tools/playtest/blind.mjs …`, aucun indice demandé.
Captures citées : `.shots/playtest/c02/c02/NNN.png`.

## 1. Verdict

| Mesure | Résultat |
|---|---|
| Enquête résolue | **Oui** (« Affaire classée ») |
| Questions résolues | **5 / 5** |
| Erreurs | **1** (Q2, un bateau) |
| Indices utilisés | **0** |
| Étoiles | **3 / 3** (capture 052) |
| Commandes | 106 au total, dont 52 captures, 19 `press`, 9 `tap`, 12 `drag`, 6 `pinch`, 4 `dtap`, 3 `status` |
| Durée | 7 min 53 s mesurées (assez fluide, aucune attente gênante : 0,8 s par commande en moyenne, 1,8 s au maximum) |
| Incidents techniques | 0 (aucune commande en échec dans `commands.jsonl`, aucune erreur dans `daemon.log`) |

Ressenti global : une enquête courte, lisible et plaisante. Les questions 1, 3 et 4 se résolvent du premier coup
par observation. La question 2 oblige à tâtonner une fois à cause d'une fausse piste qui n'est pas signalée
comme telle. La question 5 est « offerte » par une découverte faite plus tôt.

## 2. Question par question

### Q1 — « Quelqu'un a attiré Duchesse hors de l'eau avec du pain. Qui ? » (1 tentative, 0 erreur)
- **Compris** : chercher une personne qui tend du pain à un canard au bord de l'étang.
- **Regardé** : la vue de départ (002) montre l'étang et le parc ; j'ai d'abord observé le groupe sur le chemin
  (femme à pois violets, agent de police, 003), puis j'ai fait glisser la carte vers le ponton (004).
  Un petit canard jaune au bord de l'eau, à côté d'un homme accroupi qui tend une baguette (005, 009) :
  la scène « il l'attire avec du pain » se lit immédiatement.
- **Aide** : le canard jaune isolé (couleur dorée, citée dans le briefing : « plumage entièrement doré »)
  plus la baguette. La vignette de confirmation (010) montrait bien l'homme.
- **Gêne** : une autre personne tient une baguette ou un bâton à quelques mètres (femme au chapeau de paille
  avec un enfant, 021). Je l'avais repérée par hasard ; elle aurait pu être un sosie crédible si la
  réponse n'avait pas été accompagnée du canard. Pas de gêne réelle, la déduction était possible.
- **Déductible** : oui, à partir du texte et de l'image.

### Q2 — « Barbarie a fourré Duchesse dans un carton. Où l'a-t-il emportée ? » (2 tentatives, 1 erreur)
- **Compris** : « où » = un lieu ou un véhicule. Le mot « emportée » m'a fait chercher un point d'arrivée,
  pas une personne. Je me suis demandé s'il fallait retrouver un deuxième Barbarie.
- **Regardé** : le carnet puis `Voir` (011) recentre sur Barbarie. La minicarte (012-013) donne les quartiers
  mais ne dit rien sur la cible. J'ai dézoomé pour balayer le parc (014-017), puis zoomé sur les bateaux (018-019).
- **Erreur** : sur le bateau « LE BARON » je vois un personnage à la veste verte à carreaux et au chapeau (Barbarie
  sans aucun doute), bras levés avec une goutte dans une bulle. Le nom du bateau rappelle « le Baron »
  (le canard rival cité à la question 1). Le jeu a répondu « Ce n'est pas ça… » (022-023). Cette piste est
  très séduisante : un Barbarie reconnaissable, un nom parlant, et aucun carton visible.
  Je n'ai vu qu'après (Q5) qu'elle sert à la dernière question.
- **Résolution** : en dézoomant le long de la route au sud du parc (024), j'ai vu une camionnette blanche ;
  en agrandissant (025) : « VOLAILLES BARBARIE » sur la caisse, porte ouverte. Le lien est évident une fois
  lu, et dès le zoom suivant (026) un Barbarie en veste verte portait un carton (262, 350 à l'écran) vers la route.
  Le message de succès (« Sa camionnette … garée sur le boulevard ») confirme.
- **Déductible** : oui, mais seulement après avoir lu le texte minuscule sur la camionnette. Sans cette lecture, l'énoncé
  ne donne aucune piste (« où » sans aucun indice de lieu). Un joueur qui part du principe que l'énoncé
  désigne un lieu fixe passera du temps sur la carte entière.

### Q3 — « Quand Barbarie revient, la camionnette est vide ! Quelqu'un a libéré Duchesse. Qui ? » (1 tentative, 0 erreur)
- **Compris** : chercher une personne près de la camionnette qui a laissé sortir le canard.
- **Regardé** : la carte, déjà centrée sur la camionnette après la validation de Q2 (028). Juste à côté :
  un enfant blond avec un ballon rouge et une bulle cœur, et un canard jaune posé sur le trottoir (029).
- **Aide** : la proximité immédiate de la camionnette (zone déjà à l'écran) ; la ligne rouge d'enquête qui
  relie les réponses précédentes (028) et mène l'œil vers la camionnette.
- **Déductible** : oui. Seul bémol, le même « cœur » apparaît sur d'autres personnages (femme à la baguette en Q1),
  ce n'est pas un indice discriminant. Il y a peu de personnages près de la camionnette : cible facile.

### Q4 — « Où est Duchesse à présent ? » (1 tentative, 0 erreur)
- **Compris** : retrouver le canard doré au moment présent de l'histoire, donc pas à l'endroit où il a été libéré.
- **Regardé** : trois canards jaunes sur la carte au sud-ouest du parc : un près de l'enfant (devant la camionnette),
  un sur le trottoir au sud de la route (035), un près du kiosque à musique (039). J'ai interprété la suite
  de canards comme la trajectoire de sa fuite, jusqu'au kiosque où « se tient le concours » (briefing).
  Le dernier : un monsieur à chapeau melon pointe le canard avec un point d'exclamation, une dame à béret rouge a une
  bulle de colère (039). Vignette correcte (043).
- **Doute avant de valider** : j'ai hésité entre les trois canards. Le canard devant la camionnette
  (032, que j'ai annulé) aurait été une erreur plausible. Ce qui a tranché : « à présent » plus le
  kiosque cité dans le briefing.
- **Déductible** : oui, mais seulement si l'on relie le briefing (kiosque) à la question. L'énoncé seul laisse
  trois canards identiques en lice. La réponse « Au concours, devant le jury ! » confirme.

### Q5 — « Démasqué, Barbarie a pris la fuite pour échapper à Picotin. Où s'est-il réfugié ? » (1 tentative, 0 erreur)
- **Compris** : un lieu où Barbarie se cache encore.
- **Regardé** : je me suis souvenu du Barbarie aux bras levés avec la goutte de sueur sur « LE BARON » (018-019),
  vu en Q2 : posture de panique, loin de tout, au milieu de l'étang. J'ai vérifié les deux autres bateaux
  (049-050 : rien à bord de « LA CANE », « LE COLVERT » partiellement vu), puis désigné le bateau (051).
- **Résolution** : « Au milieu de l'étang, à bord de son bateau LE BARON … encerclé par des canards furieux. »
- **Déductible** : oui, mais surtout parce que j'avais déjà croisé ce Barbarie. Je n'ai pas cherché Picotin : je ne
  sais pas qui c'est (voir problèmes).

## 3. Problèmes

### Gênant
1. **Q2 : fausse piste « bateau Le Baron » très tentante et non signalée**. Le jeu a un message de fausse piste
   (« Pas tout à fait… ») prévu par le README, mais ici j'ai seulement reçu « Ce n'est pas ça… » (capture 022-023, texte
   transitoire). Le joueur ne sait pas pourquoi le bateau est faux : le Barbarie est bien sur le bateau, la
   scène a l'air de répondre à la question. Ce même bateau est la bonne réponse à Q5 : l'enquête repose sur
   une désignation identique à deux moments différents. Cohérent côté scénario, mais le joueur qui s'est trompé
   en Q2 n'a pas de signal que ce Barbarie appartient à un autre moment de l'histoire.
2. **Q2 : énoncé sans indice de lieu**. La seule piste est le texte « VOLAILLES BARBARIE » sur la camionnette, long
   de quelques pixels à l'échelle du parc (025). Un joueur qui n'a pas dézoomé jusqu'à la route ne la trouve pas.
   Ce n'est pas bloquant car les camionnettes sont rares, mais l'énoncé gagnerait une indication (« …dans un
   véhicule ? »).
3. **Q4 : trois canards jaunes sans différence visible** sur l'itinéraire de fuite (032, 035, 039). Chacun est
   à un moment différent, mais l'énoncé ne dit rien du moment : « à présent » est à déduire du briefing (kiosque).
   La logique est bonne (le jeu valorise l'attention), mais un joueur pressé valide le canard le plus proche de
   la camionnette. Je suggère un indice textuel dans l'énoncé (« au concours »).

### Mineur
4. **Une désignation sur un bateau a besoin d'un double geste** : tap, « Rapprochez-vous pour désigner » (020), le
   jeu s'approche, retap. Normal selon le README, mais la première fois l'effet de zoom automatique a déplacé le
   point de vue et j'ai dû reprendre une capture. Pas d'erreur côté jeu.
5. **Minicarte peu lisible** (013) : les quartiers sont nommés mais le parc, avec ses points verts, est écrasé par
   le titre « Parc des Meules » ; j'ai tapé à côté du lieu visé (046 : le jeu m'a envoyé à l'ouest de l'étang,
   pas au nord). Les points verts (réponses déjà trouvées) sont un bon repère.
6. **Pas de nom pour « Picotin »** : le briefing en parle (« avec Picotin »), Q5 aussi (« échapper à Picotin »),
   mais je n'ai jamais identifié Picotin sur la carte, ni dans le carnet. Je suppose que c'est le policier ou un
   chien proche de la baronne ; pas essentiel pour répondre. La baronne (Adélaïde de la Botte) ne figure jamais
   dans le carnet.
7. **Messages passagers brefs** : « Ce n'est pas ça… » n'apparaît que dans le résumé de la commande ; sur le
   téléphone réel, il disparaît vite.
8. **Rendu des bulles** : plusieurs personnages portent bulles « cœur », « !» ou « goutte » identiques d'une
   scène à l'autre ; sans les relier à un sens, elles ne guident pas (le « cœur » de Lulu en Q3 et celui de
   la femme à la baguette en Q1 sont identiques).

### Rien de bloquant
Aucun bug technique, aucune erreur de page, aucun blocage de geste.
`drag`, `pinch` (dézoom ×0,5 puis zoom ×2) et `dtap` répondent bien ; le dézoom maximal montre bien
l'ensemble du parc et permet de lire les marques sur les véhicules, ce qui m'a sauvé en Q2.

## 4. Ce qui m'a plu
- **Briefing** : ton drôle (« recette de canard à l'orange — non, pardon, pas celle-là »), objectif clair
  (« Retrouvez Duchesse avant le concours »), signature « Commissaire Odile Fétu ».
- **Chaîne narrative** : Q1 → Q5 forment une vraie histoire, avec un retour en boucle : le Barbarie « bizarre »
  de Q2 devient la réponse de Q5. Un vrai moment « aha » (« c'est donc ça, le bateau »).
- **Illustration** : le canard jaune qui suit une traînée de scènes, la camionnette « VOLAILLES BARBARIE »,
  le bateau « LE BARON » (nom parlant), le monsieur au chapeau melon qui pointe le canard avec « ! ».
- **Retours du jeu** : textes de résolution courts et drôles (« Duchesse s'est présentée toute seule, à l'heure. »),
  écran final avec le tracé d'enquête sur la carte (052), trois étoiles.
- **Ligne rouge reliant les réponses** (028, 044) : agréable et utile pour suivre le fil.
- **Vignette de confirmation** (010, 030, 043) : fiable, a toujours montré ce que j'allais désigner.
- **Rythme** : 5 questions, ~8 minutes, bien dosé pour un jeu d'enquête sur mobile.

## 5. Suggestions concrètes et minimales
1. **Q2** : ajouter dans l'énoncé un indice de nature de la cible, par exemple « Où l'a-t-il emportée ? (un
   véhicule) » ou « Dans quoi… », ou rendre la camionnette repérable dès le dézoom (inscription plus grande).
2. **Q2 (fausse piste du bateau)** : transformer le « Ce n'est pas ça… » en carte « Pas tout à fait… » du
   type « Barbarie sera sur ce bateau plus tard… » : cela récompense l'attention et évite la frustration.
3. **Q4** : préciser le moment dans l'énoncé (« Où est Duchesse, à l'heure du concours ? ») pour départager les
   trois canards jaunes de l'itinéraire de fuite.
4. **Picotin** : l'inclure dans le carnet (« Personnages identifiés ») dès le briefing, ou changer la formule
   « pour échapper à Picotin » en précisant qui c'est (chien ? agent ?).
5. **Minicarte** : afficher un point ou une flèche sur la zone de la question, ou rendre les titres de quartiers
   moins envahissants dans le parc (le titre « Parc des Meules » couvre les points verts).
6. **Q1** : rien à changer ; la scène est lisible.

---

### Résumé
Verdict : enquête **résolue 5/5**, **3 étoiles**, 1 erreur, 0 indice, 106 commandes, ~8 minutes, 0 incident technique.
Problèmes principaux :
1. Q2 : fausse piste très tentante (le Barbarie sur « LE BARON ») sans explication, alors que ce même bateau est la réponse de Q5.
2. Q2 : l'énoncé ne donne aucun indice sur la nature de la cible ; il faut lire « VOLAILLES BARBARIE » sur la camionnette.
3. Q4 : trois canards jaunes interchangeables ; seul le lien avec le briefing (kiosque) permet de départager.
