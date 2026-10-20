# Phase 3 — Joueur test aveugle : enquête c03 « La Belle Évasion »

Joueur : `--player c03`, appareil par défaut (Pixel 7, 412×915), profil neuf. Seul fichier lu avant la fin
de la partie : `tools/playtest/README.md`. Captures dans `.shots/playtest/c03/c03/`
(`001.png` à `082.png`), journal des commandes dans `.shots/playtest/c03/c03/commands.jsonl`.

## 1. Verdict

- **Enquête résolue : oui**, 6 questions sur 6.
- **0 erreur, 0 indice**, **3 étoiles sur 3** (écran « Affaire classée » : indices « aucun », erreurs « aucune »).
- **162 commandes** (`stop`), dont 82 captures ; une seule commande en échec, de ma faute (un `press Suivant`
  sur le dernier écran de la reconstitution, où le bouton s'appelle « Terminer »).
- **Durée : 11 min 24 s** (`stop`). Ressenti : une partie fluide et agréable, sauf un gros creux sur la
  question 2 (voir ci-dessous).
- Commandes par question (comptées dans `commands.jsonl`, de « Continuer » à « Continuer ») :
  Q1 = 10, **Q2 = 56**, Q3 = 25, Q4 = 16, Q5 = 19, Q6 = 23, puis 14 pour « Revoir l'histoire »
  (reconstitution en 8 moments, que j'ai parcourue pour le plaisir).
- Aucun incident technique : `status` n'a signalé ni erreur de page ni plantage. Aucune lenteur ressentie
  (une seule commande dépasse 3 s : `press Suivant` de la reconstitution, 3,9 s).
- Je n'ai jamais utilisé le système d'indices : aucune question n'a dépassé ~56 commandes, et la Q2 (la pire)
  s'est débloquée d'elle-même quand j'ai changé d'hypothèse.

## 2. Question par question

### Q1 — « Trouvez le fourgon de police, portière ouverte, devant la gare. » (10 commandes, 1 tentative)
- **Compris** : un véhicule précis, sur le parvis de la gare. Le cadrage de départ montre déjà le parvis
  (`002.png`) : le fourgon bleu « POLICE » est visible sans bouger.
- **Regardé** : un `shot --grid`, puis un `crop` sur le fourgon (`003.png`) : la portière arrière/latérale est
  un grand rectangle sombre, donc « ouverte » se lit bien. Un seul fourgon à l'écran, aucun sosie.
- **Déductible** : oui, immédiatement. Excellente ouverture : le joueur apprend le geste (taper, vignette de
  confirmation `004.png`, « Désigner ») sans risque.
- Le texte de réussite se termine par « Mais où étaient les agents pendant l'évasion ? » : bon fil narratif.

### Q2 — « Au moment de l'évasion, les agents étaient occupés ailleurs. Qui a fait diversion ? » (56 commandes, 1 tentative réussie)
- **Compris (mal)** : j'ai lu « ailleurs » comme « à un autre endroit que la gare », et je me suis souvenu du
  briefing (« deux agents gardent le **Pont Central** »). J'en ai déduit que la diversion avait eu lieu au
  pont. J'ai donc quitté la gare, ouvert la minicarte, dézoomé, cherché le pont (`006`–`018`), examiné le pont
  et ses deux extrémités (`017`, `018`, `020`, `021`, `022`) : **aucun agent**, rien qui ressemble à une diversion.
  Environ **35 commandes perdues** à cette fausse piste (le pont est d'ailleurs introuvable sans aide : il n'est
  pas nommé sur la minicarte, voir problèmes).
- **Ce qui m'a fait changer d'avis** : j'ai relu l'énoncé, puis la dernière phrase de la Q1 (« où étaient les
  agents pendant l'évasion ? ») et je suis retourné à la gare. En regardant la scène de près, j'ai trouvé un agent
  (casquette bleue, goutte de sueur) penché sur une dame allongée avec une bulle en spirale (`028.png`).
  La dame était pourtant **visible dès la toute première capture** (`002.png`, vers (225,375)) : si j'avais
  scruté le cadrage de départ au lieu de m'enfuir, j'aurais trouvé en 3 commandes.
- **Tentatives** : 1 (la bonne). La vignette de confirmation (`031.png`) montre bien la dame et l'agent.
- **Déductible** : oui, à partir de la scène (malaise + agent qui accourt = diversion), mais **l'énoncé
  induit en erreur** (« ailleurs » + briefing sur le pont). Le texte de réussite (« lunettes noires, béret,
  robe rose à pois ») fournit la clé visuelle qui m'a servi pour la Q4.

### Q3 — « Lapince a filé à pied, toujours en pyjama rayé. Retrouvez-le dans sa fuite. » (25 commandes, 1 tentative)
- **Compris** : retrouver Lapince (cheveux en épis, pyjama rayé bleu et blanc) en train de fuir ; aucun lieu
  donné. J'ai d'abord fouillé le parvis : beaucoup de passants en **hauts rayés** type marinière
  (`033`, `035`, `037`, `039`), qui sont des sosies plausibles ; aucun n'avait les cheveux en épis.
- **Ce qui m'a aidé** : j'ai élargi aux rues au sud du parvis. Un passant en pull orange et casquette rouge,
  **bulle « ! »**, le bras tendu vers un coureur (`042.png`, `046.png`) : le coureur a des cheveux blonds en
  épis, un haut rayé bleu/blanc et un pantalon rayé gris/blanc. C'est le bon recoupement
  (épis + rayures + « ! » du témoin). Vignette `047.png` correcte.
- **Déductible** : plutôt oui, mais **par exploration large** ; ni l'énoncé ni la carte ne suggèrent par où il
  a fui. Le « ! » du témoin est le vrai indice visuel, et il est bien lisible une fois cadré.
- Le texte de réussite (« file vers le sud — devant le Fer à Cheval, puis près du Garage Pistons. Il se
  dirige vers la rivière ») m'a orienté sans rien révéler de la suite.

### Q4 — « Le Pont Central est gardé, et Lapince a pourtant gagné la rive sud. Quelqu'un l'a aidé à traverser la Fenaison. Qui, et comment ? » (16 commandes, 1 tentative)
- **Compris** : un complice, avec un moyen de traverser autre que le pont. J'ai suivi le fil rouge vers le sud
  (`048`–`050`) jusqu'au fleuve : trois bateaux (« Mariette », « Le Héron », « La Cocotte »). Seul « La Cocotte »
  avait quelqu'un à bord : une dame en robe rose à pois et béret (`051.png`), le même profil que la dame
  « évanouie ». Sur l'autre rive, Lapince bras en l'air (`053.png`).
- **Tentatives** : 1. Le jeu a retenu « cette personne » (la dame, pas le bateau) : `055.png`.
- **Déductible** : oui, et très satisfaisant : le texte de la Q2 donnait les clés (rose à pois, béret).
  Réserve : « Qui, et comment ? » annonce deux informations mais n'attend qu'un seul toucher ; je n'ai pas
  testé si le bateau aurait été accepté.

### Q5 — « Aux jardins ouvriers, des épouvantails montent la garde, les bras en l'air. L'un d'eux s'est fait voler son chapeau de paille. Lequel ? » (19 commandes, 1 tentative)
- **Compris** : chercher, parmi des figures bras levés, celle qui n'a pas de chapeau de paille. Le texte de la
  Q4 citait « les jardins ouvriers » et j'étais déjà sur la rive sud, donc je n'ai pas eu à chercher le lieu ;
  le bandeau de lieu « Jardins ouvriers · Les Jardins » a confirmé.
- **Regardé** : en balayant le quartier, j'ai croisé 4 épouvantails coiffés d'un chapeau (`059`, `060`, `063`,
  `070`) puis un épouvantail **nu-tête, blond, bras levés** (`062.png`, `065.png`). Vignette `066.png`.
- **Déductible** : oui, la différence « avec/sans chapeau » est lisible à zoom moyen. Remarque : ces épouvantails
  sont dessinés comme des personnes (le jeu dit « cette personne »), ce qui est cohérent avec le récit.
  Je n'ai pas inventorié tous les épouvantails du quartier, donc je ne sais pas s'il existait un second
  épouvantail sans chapeau (sosie) ; le premier trouvé était le bon.

### Q6 — « Lapince s'est déguisé en épouvantail avec le chapeau volé, mais il porte toujours son pyjama. Démasquez-le ! » (23 commandes, 1 tentative)
- **Compris** : parmi les épouvantails coiffés de paille, celui qui porte des rayures.
- **Regardé** : 6 épouvantails « normaux » (chemise blanche, pantalon gris) éliminés d'un coup d'œil
  (`068`, `070`, `072`, `073`, `074`, `079`), puis un épouvantail avec **haut rayé bleu/blanc, chapeau de paille
  et bulle de goutte de sueur** (`078.png`). Vignette `080.png`.
- **Déductible** : oui, parfaitement équitable : rayures + chapeau + sueur. C'est la meilleure question de
  l'enquête : sosies nombreux mais tous clairement différents.
- Le texte final (« Même les pigeons ne s'y trompent pas ») fait un clin d'œil à ce que l'on voit dans la
  vignette (petits oiseaux au sol).

## 3. Problèmes, classés par gravité

### Bloquant
- Aucun.

### Gênant
1. **Q2 : l'énoncé et le briefing orientent vers une fausse piste (le pont).** « occupés *ailleurs* » + « deux
   agents gardent le Pont Central » m'ont envoyé au pont ; la réponse était à 15 px du fourgon de la Q1
   (`002.png` : la dame et l'agent y sont déjà). Coût : ~35 commandes (≈ 5 minutes, la moitié de la partie).
   Un joueur moins obstiné aurait pris l'indice.
2. **« Le Pont Central est gardé » (briefing et Q4) n'a aucun écho visuel** dans ce que j'ai vu : sur le pont
   et à ses deux approches, je n'ai trouvé aucun agent (`018.png`, `020.png`, `021.png`). Je n'ai pas fouillé
   tout le voisinage : si les gardes existent, ils sont trop loin ou trop discrets pour que le texte tienne sa
   promesse. De plus, **le bandeau de lieu affichait « La Fenaison » sur le pont** (`017.png`, `018.png`) et
   la minicarte n'a aucun libellé de pont (`007.png`) : je n'ai jamais pu confirmer que c'était « le Pont Central ».
3. **Q3 : aucune indication spatiale** (« Retrouvez-le dans sa fuite »), alors que les sosies à rayures sont
   nombreux sur le parvis (`037.png`, `039.png`). Faisable (le « ! » du témoin est un bon repère), mais c'est
   une recherche à l'aveugle d'environ 25 commandes. Rien de faux ni d'injuste, juste un cran de plus que les
   autres questions.
4. **Dézoomé, la bande sud du monde est masquée par le panneau de question et inaccessible** : à zoom bas, la
   carte refuse de défiler vers le bas (`012.png`, `013.png` : mêmes images après deux glissements ; `014.png` :
   même panneau replié, la carte s'arrête à y≈760). La rive sud du fleuve et Les Jardins sont alors cachés sous
   le panneau et il faut rezoomer pour les atteindre. Ça m'a fait croire quelques commandes à un blocage.

### Mineur
5. **Minicarte** : petite, couvre le coin haut-droit, aucun repère nommé pour le pont ni la gare ; toucher la
   minicarte recentre la caméra sans la fermer (il faut un second `press`). Voir `006.png`, `007.png`,
   `008.png`.
6. **Briefing : trois loupes pleines sur cinq** en haut à droite (`001.png`), sans libellé. Je suppose que c'est
   la difficulté, rien ne le dit.
7. **Écran de fin : « avant que Picotin ne lui demande l'heure »** : Picotin n'a été présenté nulle part. Je
   soupçonne un pigeon (clin d'œil de la phrase « Même les pigeons… »), mais le joueur ne peut pas le savoir.
8. **« Rapprochez-vous pour désigner »** est apparu alors que la dame allongée mesurait environ 25 px
   (`027.png`) ; le jeu a zoomé tout seul et la cible a bougé de ~40 px, donc il a fallu une capture
   supplémentaire. Normal d'après le mode d'emploi, mais ça coûte une commande.
9. **Q4, « Qui, et comment ? »** : deux informations demandées, un seul toucher possible. Un joueur peut hésiter
   entre le bateau et la capitaine.
10. Tapis de **sosies à rayures** sur le parvis (marinières bleu/blanc) : pas un défaut en soi (c'est l'esprit du
    jeu), mais ils ressemblent beaucoup au haut du fugitif à zoom moyen.

## 4. Ce qui m'a plu

- **Le briefing** est court, drôle et utile (« cheveux en épis, pyjama rayé bleu et blanc »), le ton de la
  commissaire Fétu donne tout de suite l'ambiance.
- **Une histoire qui se lit sur la carte** : malaise « spectaculaire » avec agent à la goutte de sueur,
  fiancée capitaine de bateau, épouvantail dépossédé de son chapeau, fugitif en rayures qui transpire.
  Le moment « aha » de la partie : reconnaître la dame évanouie à la barre de « La Cocotte » grâce au texte de
  réussite de la Q2.
- **Les récompenses guident sans spoiler** : chaque texte donne des mots-clés (« Fer à Cheval », « Garage
  Pistons », « jardins ouvriers ») qui servent à la question suivante.
- **Le fil rouge** qui relie les positions déjà trouvées (`032.png`, `048.png`) donne la direction de la fuite et
  fait ressentir la reconstitution de l'enquête.
- **Les bulles** (« ! », « ? », « … », spirale, goutte) donnent de la vie et fournissent de vrais indices (le
  « ! » du témoin en Q3, la goutte de sueur en Q6).
- **La Q6** est un modèle d'équité : sosies nombreux mais tous éliminables à l'œil.
- **« Revoir l'histoire »** : reconstitution en 8 moments très agréable, sans bug (sauf le libellé du dernier
  bouton, « Terminer », rien de gênant).
- Fluidité générale : aucune saccade ni attente perceptible, vignettes de confirmation toujours fidèles.

## 5. Suggestions minimales

- **Q2** : remplacer « occupés ailleurs » par une formule qui ne suggère pas un autre lieu (ex. « les agents ont
  été détournés de leur mission au moment de l'évasion ») ou rappeler « à la gare » ; et/ou reformuler la
  dernière phrase de la Q1 pour pointer le parvis (« où étaient les agents… devant la gare ? »). Le briefing
  pourrait préciser que les agents gardent le pont *depuis* l'évasion, pas pendant.
- **Pont Central** : soit placer deux agents visibles sur le pont (cohérence avec « gardé »), soit retirer
  « gardé » du texte ; faire apparaître « Pont Central » dans le bandeau de lieu (et sur la minicarte) quand la
  caméra est dessus.
- **Q3** : ajouter un repère (« quelque part entre la gare et la rivière », ou « quelqu'un l'a vu courir »)
  ou un premier indice écrit gratuit ; le « ! » du témoin est de toute façon le bon repère.
- **Défilement** : faire tenir compte du panneau de question dans la limite basse du défilement, pour pouvoir
  amener le bord sud au-dessus du panneau à zoom bas.
- **Q4** : préciser « Qui ? (désignez-le) » ou accepter aussi le bateau.
- **Fin** : présenter Picotin (ou le supprimer), et libeller les trois loupes du briefing.
- Minicarte : fermer automatiquement après un toucher de navigation, ou ajouter quelques noms de lieux
  (gare, pont).
