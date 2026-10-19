# Phase 3 — Joueur test aveugle : « Les Aiguilles du Fondateur » (bonus-aiguilles)

Joueur test aveugle, profil neuf (`--player bonus-aiguilles`), écran 412×915. Seul le `README` du
playtest a été lu avant la fin de la partie. Captures : `.shots/playtest/bonus-aiguilles/bonus-aiguilles/`.

## 1. Verdict

| | |
|---|---|
| Enquête résolue | **Oui** : « Affaire classée », 10 aiguilles sur 10 (le `status` compte 1 question sur 1, car l'enquête n'a qu'une étape) |
| Erreurs | **0** (les 10 désignations ont été justes du premier coup) |
| Indices | **2** (indice 1 puis indice 2) |
| Étoiles | **1 sur 3** (0 erreur, mais 2 indices : 3 → 2 → 1 étoile) |
| Commandes | **536** au total (`commands.jsonl`) ; **environ 270 seulement** si l'on retire ~285 taps d'exploration de la minicarte (voir §3, problème 1) |
| Durée | 19 min 50 s mesurées (0,9 s de latence moyenne par commande, max 2,1 s). Ressenti : un joueur humain y passerait plutôt 30 à 45 min |
| Incidents techniques | **0** (aucune erreur de page signalée, `daemon.log` sans erreur ; une seule commande a échoué, par ma faute : `press "Voir la zone"` alors que le bouton était masqué) |

Rythme (numéro de commande à chaque désignation) : 1re aiguille à la cmd 33, 2e à 64, 3e à 260, 4e à 292,
5e à 306, 6e à 369, 7e à 386. Indices demandés aux cmd 405 et 408. 8e à 416, 9e à 429, 10e à 530.

## 2. Question par question (une seule question, dix aiguilles, ordre libre)

**Question unique** : « Retrouvez les dix aiguilles d'or du Fondateur. Chaque vers du testament désigne un
lieu. » (compteur 0/10 → 10/10). Le briefing est un poème de dix vers, avec la consigne « Zoomez bien : une
aiguille d'or n'est qu'un petit trait doré ». Chaque aiguille trouvée affiche « Bien vu ! n sur 10 ».
Ordre dans lequel j'ai résolu les vers, avec ce qui m'a aidé ou perdu :

1. **« Là où l'on attend les trains, le temps a deux aiguilles : j'en ai mis une troisième. »** Gare, horloge.
   Déduit sans difficulté (gare + « deux aiguilles » = horloge). Il a fallu 3 doubles-touchers et un `crop`
   pour distinguer la petite aiguille dorée sur le cadran (captures 013 à 016). 1 tentative. Déductible. Très
   bon « aha ».
2. **« Les enfants creusent pour trouver des trésors : au parc, un bac à sable en cache un. »** Parc des Meules,
   aire de jeux (captures 028 à 030). Le chemin était évident (parc + bac à sable). L'aiguille se voit au zoom
   2×, avec son scintillement. 1 tentative. Déductible.
3. **« Aux jardins ouvriers, elle pousse devant la serre la plus au sud, un peu à l'écart des autres. »** Le plus
   long à chercher (~200 commandes, dont ~140 de sondage de la minicarte pour localiser le quartier). Les
   jardins comptent une vingtaine de serres sur plusieurs rangées. J'ai balayé la rangée du bas à zoom max
   (captures 042 à 049) : la partie gauche était vide, l'aiguille se trouvait devant une serre de la rangée du
   bas, vers le milieu (captures 049 à 051). « La plus au sud » restreint à une rangée, pas à une serre : j'ai
   trouvé grâce au scintillement et non par pure déduction. « Un peu à l'écart des autres » ne m'a pas servi.
   1 tentative. Partiellement déductible.
4. **« La capitainerie garde tout ce qui entre au port… même une aiguille. »** Port, bâtiment « CAPITAINERIE »
   (enseigne lisible). Je l'ai trouvé en balayant les quais (captures 052 à 060). L'aiguille est sur le pavé
   devant la devanture. 1 tentative. Déductible (enseigne lisible).
5. **« Un ange veille sur les morts, et sur une aiguille. »** Cimetière, statue d'ange (captures 061 à 066). La
   statue blanche à ailes est reconnaissable. L'aiguille est sur le chemin, juste en dessous d'elle. 1 tentative.
   Déductible.
6. **« Sur le Pont Central, une aiguille regarde couler la Fenaison. »** Le nom « Pont Central » n'apparaît pas
   sur la minicarte. J'ai dû sonder la bande du fleuve point par point pour tomber dessus (~60 commandes, voir
   problème 1). L'aiguille est sur le trottoir du pont, côté fleuve, et le scintillement la rend visible
   (captures 072 à 074). 1 tentative. Déductible une fois le pont localisé.
7. **« À l'école, on apprend à compter : commencez dans la cour. »** École du Faubourg, cour (captures 077 à 082).
   La pastille de lieu « Cour de l'école » m'a confirmé l'endroit. L'aiguille est en haut de la cour, près de la
   barrière et des marelles (« compter » = marelle numérotée, joli clin d'œil). 1 tentative. Déductible.
8. **« Ma main levée en tient une, et ne la lâche pas. »** J'ai cherché ~30 commandes sur la Grand-Place (horloge
   de l'hôtel de ville, fontaine, hôtel du Nord), puis j'ai pris les **indices 1 et 2**. L'indice 2 (projecteur)
   m'a amené au Parc des Meules, devant une statue verte dont la main levée tient l'aiguille (captures hint2,
   092 à 094). Non déduit sans aide : le vers ne donne aucun lieu, et je n'avais pas remarqué la statue en
   passant dans le parc pour le bac à sable. 1 tentative. Pas déductible.
9. **« Le boucher a ses crochets ; à sa porte, mon aiguille. »** Les Halles, « BOUCHERIE ». Je suis passé devant
   en début de partie (captures 020 à 026) sans la voir : à zoom large, l'aiguille (un trait de ~10 px) est
   invisible. Trouvée grâce au projecteur gratuit (zone3), puis à zoom max : elle est sur le pavé, au pied de la
   devanture, un peu à gauche de la porte (captures 097 à 099). 1 tentative. Déductible pour le lieu (enseigne),
   pas pour la position exacte sans balayage serré.
10. **« La police perd ses affaires : cherchez entre ses voitures. »** Commissariat, Vieille Ville. J'ai d'abord
    pensé au grand parking rempli de voitures civiles au nord de la Grand-Place (capture 087), sans aiguille
    visible. Le commissariat est juste au nord de ce parking, hors de l'écran. Trouvé grâce au projecteur
    gratuit (zone4) : l'aiguille est sur le trottoir contre la façade, entre les 2e et 3e voitures de police
    (captures 105 à 107). 1 tentative. Piste trompeuse (le parking) mais déductible : la police a ses propres
    voitures marquées « POLICE ».

Message de fin : « Affaire résolue ! Les dix aiguilles d'or sont réunies sur votre bureau. », puis après
« Conclure » : « Affaire classée », la Meule d'Or, la phrase de Hector Meule, « Indices utilisés 2 · Erreurs aucune ».

## 3. Problèmes, par gravité

### Bloquant
Aucun.

### Gênant

1. **La minicarte ne nomme pas les lieux du poème.** Elle n'affiche que les noms de quartiers (Gare, Vieille Ville,
   Les Halles, Faubourg, La Fenaison, Les Jardins, Le Port, Quartier des Arts, Parc des Meules). Le poème cite
   des lieux précis : Pont Central, Capitainerie, commissariat, école, cimetière, jardins ouvriers. Le seul
   nom visible est la pastille en haut à gauche, qui se met à jour avec le centre de la carte (« Pont Central ·
   La Fenaison »). Pour savoir où se trouve le Pont Central, j'ai dû taper la minicarte tous les 4 px le long du
   fleuve (≈ 285 taps de sondage en tout, ce qui explique 536 commandes). Un joueur humain ferait l'équivalent
   en faisant défiler la carte. Preuves : `032`, `067`, `069`, `070`, `100`, `102` (la minicarte ne montre que des
   noms de quartier). Le coût du fleuve, qui traverse toute la ville, est surtout élevé.
2. **L'indice 1 est générique et coûte quand même une étoile.** Texte reçu : « Relisez le testament : chaque
   vers désigne un lieu de Meulebourg. Une aiguille est un petit trait doré : zoomez au maximum. » Il répète le
   briefing, sans rien dire sur les aiguilles restantes, mais fait passer la note de 3 à 2 étoiles (message
   de confirmation clair, `hint1.png`, `hint1b.png`).
3. **Un seul indice 2 offre ensuite des projecteurs gratuits pour toutes les aiguilles restantes.** Après
   le paiement de l'indice 2, « Voir la zone » repointe automatiquement sur une autre aiguille cachée après
   chaque trouvaille : statue (`hint2.png`), puis boucherie (`zone3.png`), puis commissariat (`zone4.png`). Les trois
   dernières aiguilles se sont donc résolues avec un seul indice payé. À confirmer si c'est voulu, mais cela annule
   l'intérêt de l'indice 3 et de la pénalité sur ce mode.
4. **Le vers « Ma main levée en tient une, et ne la lâche pas » n'a aucun lieu.** Il faut deviner qu'il s'agit d'une
   statue (celle du Fondateur, dans le parc qui porte son nom), alors que la ville a d'autres statues (ange au
   cimetière, fontaine). C'était la seule vraie « devinette sans ancrage » : je suis resté coincé 30 commandes
   puis j'ai cédé à l'indice. Une allusion de lieu (« au milieu de la verdure ») suffirait.
5. **La recherche à bas zoom est aveugle.** Une aiguille à zoom ×1 mesure ~10 px et ressemble à un brin
   d'herbe ; seul le scintillement aide à zoom fort. J'ai traversé la boucherie sans rien voir (captures 020 à
   026 ; l'aiguille apparaît nettement dans `097.png`). Rien ne signale les zones déjà balayées, et la ville est
   grande. Voulu (« Zoomez bien »), mais la fatigue est réelle.

### Mineur

6. **« La serre la plus au sud » est ambiguë** : la rangée du bas contient 3 à 4 serres à peu près alignées
   (`044`, `049`). « Un peu à l'écart des autres » ne m'a pas servi.
7. **Fausse piste involontaire du parking** de la Grand-Place pour le vers de la police (`087.png`) : des
   voitures rangées en grille, avec une camionnette, à côté d'un commissariat à peine visible.
8. **Écran de fin** : la vue d'ensemble affiche une grande bande noire en haut (≈ 300 px) au-dessus de la ville
   (`fin2.png`). La mise en page est correcte en bas, mais la bande donne un air de chargement raté.
9. **Carnet incohérent** : après la première aiguille, la rubrique « Questions résolues » du carnet dit encore
   « Aucune pour l'instant. Observez, puis désignez. » (`carnet1.png`), alors que le testament affiche un ✓
   devant le vers résolu. La feuille de confirmation affiche toujours « Question 1 sur 1 » pendant que la mission
   compte dix aiguilles.
10. **« Voir la zone » est caché** quand la fiche d'indice est repliée (ce qui arrive après chaque trouvaille ou
    après « Replier la question ») : il faut d'abord toucher « Indice 2 sur 3 » (mon erreur de commande, cmd ~418).
11. **Retour de réussite pauvre** : « Bien vu ! n sur 10 » seulement. Aucune phrase d'histoire ni indication du
    vers résolu, hormis le ✓ dans le testament (que je n'ai relu qu'une fois).

Non testés : les punaises, le bouton « Voir » du testament, le troisième indice, `Recommencer`.

## 4. Ce qui m'a plu

- Le **briefing en poème** : chaque vers cible un lieu et un type d'image différent (horloge, statue, bac à sable,
  jardin, pont, port), et la mission se lit comme une chasse au trésor, sans texte de consigne lourd.
- Les **moments « aha »** : l'aiguille en guise de troisième aiguille de l'horloge ; la statue verte qui brandit
  l'aiguille ; l'aiguille sur le trottoir du pont qui regarde l'eau couler ; les marelles de la cour (« à l'école on
  apprend à compter »).
- **Zéro faux positif** : les 10 désignations ont été reconnues du premier coup, et la vignette de confirmation
  montre toujours le trait doré encadré (tolérance au toucher bonne même avec une cible de 15 px).
- Le **scintillement** (✦) au bout de chaque aiguille rend l'aiguille repérable à zoom fort.
- La **transparence des indices** (« Votre note passera de 3 à 2 étoiles au plus ») et le **projecteur** (zone
  circulaire claire, reste du monde assombri) sont très lisibles, et la ville est belle et lisible à toutes les échelles.
- Texte de conclusion : « il suffit de regarder chaque brin » et la Meule d'Or.
- Fluidité : aucun ralentissement perçu, ~0,9 s par commande.

## 5. Suggestions minimales

1. Ajouter les **noms de lieux du poème** (Pont Central, Capitainerie, Commissariat, École, Cimetière, Jardins
   ouvriers) sur la minicarte, ou au moins un petit index « Lieux du testament » dans le carnet avec « Voir ».
2. **Indice 1 par aiguille** : reformuler un des vers restants (« Le commissariat se trouve au nord de la
   Grand-Place ») au lieu d'un conseil générique, ou ne pas le facturer s'il reste générique.
3. Soit **limiter le projecteur** à la première aiguille concernée (puis il faut un nouvel indice pour la suivante),
   soit l'assumer et le dire dans le texte de l'indice.
4. **Vers de la statue** : ajouter un ancrage (« au parc qui porte mon nom »).
5. Vers des jardins : remplacer « la serre la plus au sud » par une phrase qui désigne une serre sans ambiguïté
   (« la dernière serre de la rangée du bas, côté route »).
6. Écran de fin : recadrer la vue d'ensemble sans la bande noire.
7. Carnet : cocher aussi la mission (« 10/10 » ou « n aiguilles trouvées ») dans « Questions résolues », et
   remplacer « Question 1 sur 1 » par « Aiguille n sur 10 » dans la feuille de confirmation.
8. Garder « Voir la zone » visible même quand la fiche d'indice est repliée.
