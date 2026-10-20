# Rejeu aveugle de l'enquête c04 « La Grande Paille » (joueur `c04r`)

Testeur aveugle neuf : seul `tools/playtest/README.md` lu avant de jouer, aucune autre source du dépôt, aucun
compte rendu précédent. Commandes uniquement par `node tools/playtest/blind.mjs … --case c04 --player c04r`.
Captures : `.shots/playtest/c04/c04r/` (numérotées 001 à 050 + `minimap.png`).

## 1. Verdict

| | |
|---|---|
| Résolue ? | **Oui** (« Affaire classée », écran de fin atteint) |
| Questions | **6 / 6** |
| Erreurs | **1** (la poubelle à la question du diamant) |
| Indices | **4** (voisin ×1, jumeaux ×1, tarte finale ×2 : écrit puis projecteur) |
| Étoiles | **2 / 3** (plafonnées par les indices ; l'écran de fin l'explique clairement) |
| Commandes | 143 (+ `stop`) |
| Durée | 11 min 33 s |
| Captures prises / images lues | 50 / **48** (001 et 013 non lues) — aucune perte d'image, `imagesReadable = true` |
| Incidents techniques | **0** |

Résumé : enquête agréable, drôle et lisible, mais **deux questions (les jumeaux, le voisin) et la dernière (la tarte)
ne sont pas résolubles sans indice dans un temps raisonnable** : la cible est une silhouette minuscule noyée dans les
~200 passants de la Grand-Place, et l'énoncé ne donne ni lieu précis ni signe distinctif. Sans le premier indice j'ai
dépensé ~35 commandes et ~15 images sur les jumeaux et ~20 commandes sur le voisin avant de céder.

## 2. Question par question

Ordre réel de résolution : Q1 plaque d'égout → voisin (Octave) → tarte (Zita) → jumeaux (Ludo) → diamant (fontaine)
→ tarte finale (Picotin). Le jeu ouvre deux « pistes » en parallèle (onglets « La bijouterie » / « Le voisin »).

### Q1 — « Par où les cambrioleurs sont-ils arrivés ? » : réussie du premier coup, sans indice (4 commandes)
- **Compris** : la vitrine fracassée est juste devant le cadrage de départ ; il faut désigner un « chemin d'entrée ».
- **Regardé** : capture plein écran avec grille, puis un `--crop` sur le trottoir devant la vitrine : deux hommes casqués
  de lampes orange (l'un jaillit d'un trou, l'autre tient une gemme bleue, sac à dos vert), une plaque d'égout
  ouverte (couvercle posé à côté), une seconde plaque fermée sur la chaussée.
- **Aidé** : cadrage de départ parfait, l'indice « les frères Taupin passent plus de temps sous la ville que dessus »
  du briefing, la plaque ouverte bien reconnaissable. La vignette de confirmation montrait exactement la plaque ouverte.
- **Déductible** : oui, pleinement. Meilleure question de l'enquête (un vrai « ah ! »).

### Q « Le voisin » — « Un voisin a vu quelqu'un s'éloigner de la bijouterie à l'aube, vers la Grand-Place, une tarte à la main. Retrouvez-le. » : réussie avec **1 indice**
- **Compris** : chercher un passant qui tient une tarte, sur la Grand-Place ; je n'ai aucun signalement.
- **Regardé** : ~20 commandes à parcourir la Grand-Place à deux niveaux de zoom (captures 009, 012, 016, 018, 020, 021, 023),
  1 faux espoir (une femme au chapeau haut-de-forme qui porte une caisse en carton, capture 017). Une tarte tenue en main
  fait ~8 px à un zoom où l'on voit assez de monde ; on ne la repère qu'avec un `crop`.
- **Indice 1** (« Haut-de-forme, costume violet, une tarte à la main, l'air de ne pas vouloir être vu… Ça ne vous rappelle
  personne ? ») : a débloqué. J'ai alors vu un homme en costume violet avec haut-de-forme et monocle **pointant du doigt
  près du Café du Centre** (sans tarte : fausse piste crédible, capture 022), puis le bon, en pleine marche, la tarte plaquée devant
  le visage (capture 024).
- **Déductible sans indice ?** Difficilement. Rien ne dit que « celui à la tarte » est un personnage déjà vu : le lien avec le
  monsieur violet de la vitrine (capture 003, goutte de sueur) n'est possible que si l'on sait que c'est Octave Carat, or
  le carnet affiche « Personne n'est encore identifié » après Q1.
- **Retour de la tarte** : « Excellent ! Octave Carat en personne… » — la révélation est bonne, mais je ne pouvais pas la
  deviner : le texte aurait gagné à être préparé.

### Q « La tarte » — « À qui le bijoutier a-t-il confié la tarte ? » : réussie du premier coup (≈ 8 commandes)
- Le texte précédent dit « Il file vers le nord » ; le fil rouge sur la carte relie le résultat précédent à une scène voisine :
  Octave pointant le bras vers une vieille dame en jaune qui tient la tarte (même scène que la fausse piste vue avant).
  Je l'avais déjà croisée : la désigner était évident. Vignette conforme. Réponse : Zita Pistache, déductible.

### Q2 « Les jumeaux » — « Les jumeaux se sont séparés en repartant. Retrouvez celui qui a emporté le diamant. » : réussie avec **1 indice** après ~35 commandes
- **Compris** : un des deux jumeaux casqués a le diamant ; il faut le retrouver ailleurs sur la carte. Aucune indication de lieu
  ni de direction : l'énoncé dit seulement « séparés ».
- **Regardé** : zoom arrière, minicarte (seulement les quartiers, utile pour s'orienter), balayage à l'ouest, au sud, à l'est de la
  bijouterie (captures 007 à 011), puis la Grand-Place. Mes captures de la Grand-Place ne cherchaient pas de casque orange et
  je suis (très probablement) passé devant sans le voir (silhouette de ~25 px, capture 016).
- **Indice 1** : « un seul jumeau tenait le diamant, celui au sac à dos. Il est parti vers le nord, vers la Grand-Place. » : a
  tout débloqué. En balayant avec ce signalement je l'ai trouvé près du kiosque à journaux (capture 033) : casque orange à lampe,
  sweat gris, sac à dos vert, en courant. La vignette confirmait.
- **Déductible sans indice ?** Le signalement (sac à dos + diamant en main) l'était à partir de Q1, mais pas **où chercher**.
  Il n'y a aucun repère géographique dans l'énoncé alors que la question « voisin » en donne un.
- **Gêne supplémentaire** : après Q1 les deux jumeaux restent dessinés devant la bijouterie ; on se demande un instant si
  c'est eux qu'il faut désigner.

### Q3 « Le diamant » — « Furieux, Ludo s'est débarrassé du diamant. Où est-il ? » : réussie avec **1 erreur**, sans indice
- **Compris** : un objet à trouver près de Ludo. « Se débarrasser » + poubelle verte à 70 px de lui (capture 037) : j'ai désigné
  la poubelle → « Ce n'est pas ça… » (simple message passager, sans carte d'orientation).
- **Corrigé** : le diamant que je cherchais est un objet petit et bleu ; la bulle « colère » sur Ludo et sa position près de la
  fontaine m'ont fait regarder la fontaine (capture 039) : la gemme bleue est visible dans le bassin. Vignette parfaite.
- **Déductible** : oui, mais la poubelle est un piège très naturel (je compte l'erreur comme équitable). La carte ne recentre
  pas la caméra sur Ludo (elle restait à son ancienne position, ~300 px plus au sud).
- Texte de réussite très bon : « c'est du verre. Le diamant de la vitrine était un FAUX. »

### Q6 « La tarte finale » — « …le vrai était caché dans la tarte. Mais Zita ne l'a plus ! Où est la tarte, sur la place ? » : réussie avec **2 indices** (écrit puis projecteur)
- **Compris** : la tarte est ailleurs sur la place, quelqu'un d'autre la tient. L'énoncé ne dit pas qui.
- **Regardé** : retour auprès de Zita (captures 044–046, terrasse du café : rien), puis indice 1 : « …en la donnant à la
  dernière personne qu'on irait soupçonner » → j'ai pensé « policier ». J'ai trouvé un agent blond en uniforme bleu au bord est
  de la place, les mains vides (capture 047) : mauvaise piste, et plusieurs agents sont visibles sur la place.
- **Indice 2** (« Regardez devant l'Hôtel de Ville » + projecteur) : a montré immédiatement Zita qui salue et l'agent aux cheveux
  roux, un cœur au-dessus de la tête, qui tient la tarte (captures 049, 050). Réponse : l'agent (personne, pas objet).
- **Déductible sans projecteur ?** Pas franchement : l'énoncé demande « où est la tarte » alors que la cible est une personne ;
  l'indice écrit est ambigu (plusieurs agents). Le projecteur est bien conçu (avec « Masquer le projecteur » et « Voir la zone »).
- Fin : « Picotin a retrouvé le diamant avec une molaire… La commissaire lui a offert un dentiste et une médaille, dans cet
  ordre. » Excellent.

## 3. Problèmes classés par gravité

### Bloquant (sans indice)
1. **Q2 jumeaux : aucun repère de lieu.** « Se sont séparés en repartant » n'indique ni direction ni zone ; la cible fait ~25 px
   au zoom où l'on couvre de la surface ; ~35 commandes et ~15 images sans résultat. L'indice 1 contient justement l'information
   manquante (« nord, Grand-Place »). Preuves : captures 007–011 (balayage vain), 016 (probablement visible mais non reconnu),
   033 (la cible une fois connue).

### Gênant
2. **Q « voisin » : cible sans signalement + objet minuscule dans une foule dense.** La tarte tenue en main est quasi invisible
   hors `crop` ; la question ne dit pas qui chercher (le lien avec le monsieur violet de la vitrine n'est fait que par l'indice).
   Preuves : 009, 016, 018, 021 (foule), 024 (cible une fois recadrée).
3. **Q6 : énoncé « Où est la tarte ? » alors que la réponse est un agent ; indice 1 ambigu.** Il y a plusieurs agents sur la place ;
   il a fallu le projecteur (indice 2). Preuves : 047 (agent blond, mains vides), 049/050 (le bon).
4. **Panneau de question replié : texte tronqué** (« Un voisin a vu quelqu'un s'éloigner de la… »). Une fois replié pour
   libérer la carte, on ne relit plus l'énoncé ni l'indice sans le rouvrir (le texte de l'indice remplace l'énoncé selon l'état).
   Preuves : 012, 018, 031.
5. **Numérotation incohérente** : « Question 2 sur 6 » alors que 3 sont résolues, « Question 3 sur 6 » avec 4 résolues, puis
   « Question 6 sur 6 ». Les deux pistes parallèles brouillent le compteur. Preuves : 031, 035, 041.
6. **Caméra non recentrée entre les questions** : après chaque « Continuer », la carte reste là où on l'a laissée, parfois à
   plusieurs centaines de pixels de la zone utile (Q3, Q6). Il faut s'aider de la minicarte.

### Mineur
7. Après Q1, les jumeaux **restent dessinés** devant la bijouterie alors que l'énoncé dit qu'ils sont partis (incohérence
   visuelle passagère, 005).
8. **Seuil « Rapprochez-vous pour désigner » imprévisible** : refusé à environ ×0,67 du cadrage de départ (capture 023), accepté
   dans des conditions voisines (032). Le jeu s'approche seul, ce qui limite la gêne.
9. Réponse fausse = simple message « Ce n'est pas ça… » (toast de 2 s) ; aucun texte d'orientation, contrairement à ce que
   décrit le README de l'outil (« Pas tout à fait… »). Probablement voulu pour une erreur « loin de la cible ».
10. Le carnet affichait « Personne n'est encore identifié » après la première bonne réponse (seule consultation faite) ;
    je n'ai pas vérifié s'il se remplissait ensuite. Aucune fiche de protagoniste n'aidait à relier les apparitions successives
    d'Octave avant l'indice.

## 4. Ce qui m'a plu
- Le scénario : faux diamant, tarte-cachette, jumeaux « sous la ville », agent amoureux, chute sur la molaire de Picotin.
- Les personnages sont reconnaissables à la loupe (casque et lampe orange, monocle, chapeau haut-de-forme, sac à dos vert) ;
  la même personne apparaît à plusieurs moments de l'histoire sans qu'on s'y perde.
- Les petites bulles (cœur, colère, « ? », goutte de sueur) racontent la scène sans texte.
- La **feuille de confirmation avec vignette** : j'ai pu annuler/valider en connaissance de cause à chaque fois.
- Le **fil rouge** qui relie les réponses résolues : on voit l'histoire se tisser sur la carte.
- La **minicarte** avec ses points verts sur les réponses déjà résolues, bien utile pour se repérer (et pour revenir à la scène).
- Le **système d'indices** : prix annoncé avant de payer (« passera de 3 à 2 étoiles au plus »), indices progressifs, projecteur
  qui peut être masqué ; l'écran de fin explique la note (« plafonné à 2 étoiles ; au-delà de 6 indices, 1 étoile »).
- Zéro incident technique, gestes (drag, pinch, tap) fiables, durée de 11 min 33 s agréable.

## 5. Suggestions concrètes et minimales
1. **Q2 jumeaux** : ajouter un repère à l'énoncé (« Celui au sac à dos a pris la direction de la Grand-Place ») ou, au minimum,
   déplacer ce texte-là de l'indice 1 à l'énoncé. Alternative : recentrer la caméra sur la zone après « Continuer ».
2. **Q voisin** : citer un signe distinctif dans l'énoncé (« en haut-de-forme ») ou faire apparaître Octave Carat dans le
   carnet (« Personnages identifiés ») dès la première bonne réponse.
3. **Q6** : reformuler « Qui tient maintenant la tarte, devant l'Hôtel de Ville ? » ou mettre « Hôtel de Ville » dans l'indice 1 ;
   alternativement dire « un représentant de l'ordre » dans l'indice 1 pour ne pas laisser croire à un seul agent.
4. **Panneau replié** : afficher au moins deux lignes de l'énoncé, ou un bouton « relire la question » constant.
5. **Compteur** : libeller « Piste 1/2 » ou ne compter que les questions réellement ouvertes ; ou afficher « 3 résolues sur 6 ».
6. **Après une bonne réponse, animer rapidement la caméra** vers le centre de la scène suivante (ou proposer un bouton « Aller
   sur place », comme la minicarte).
7. Masquer les jumeaux de la bijouterie une fois partis (ou leur donner une pose « à la fin de la scène »).
8. Ajouter, pour une réponse fausse mais plausible (poubelle), un court message d'orientation (« Pas tout à fait… ») à usage
   pédagogique.
