# Les 25 morceaux de la carte mère (5 × 5, carrés de 400 px qui se chevauchent de 100 px) : pour chacun, le prompt
# d'agrandissement avec les passants, les scènes d'enquête, les aiguilles et les enseignes.
# Usage : python3 tools/art/morceaux25.py   (écrit tools/art/drive/03-morceaux/<morceau>/prompt.md et TACHES.md)
import os, re, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = f'{ROOT}/drive/03-morceaux'
SIDE, STEP = 400, 300

# clé → (dossier de la fiche, nom français, désignation anglaise, signes distinctifs)
WHO = {
    'picotin': ('01-brigadier-gaston-picotin', 'Picotin', 'the policeman', 'navy kepi, big ginger moustache, blue uniform jacket, beige Bermuda shorts, red-and-yellow striped scarf'),
    'timothee': ('02-timothee-fournil', 'Timothée', 'the delivery boy', 'red flat cap, curly black hair, white apron, red shorts'),
    'rose': ('03-rose-lemiel', 'Rose', 'the baker woman', 'white chef\'s toque, blond bun, pink apron, white skirt'),
    'lafouine': ('04-ernest-lafouine', 'Lafouine', 'the thief', 'orange knitted beanie, black bandit eye mask, black-and-white striped sweater, black trousers'),
    'motus': ('05-motus', 'Motus', 'the mime', 'same orange beanie and same black-and-white striped sweater as the thief, but NO mask'),
    'baronne': ('06-adelaide-de-la-botte', 'la baronne', 'the old baroness', 'straw hat, white bun, round glasses, purple dress with white polka dots, handbag'),
    'barbarie': ('07-hippolyte-barbarie', 'Barbarie', 'the bearded man', 'brown fedora, full grey beard, long green checked coat, yellow trousers'),
    'lulu': ('08-lulu', 'Lulu', 'the child', 'spiky blond hair, round glasses, blue dungarees, orange shorts, red balloon'),
    'bigarade': ('09-gaspard-bigarade', 'Bigarade', 'the cook', 'white chef\'s toque, black moustache, white chef\'s jacket, black trousers'),
    'lapince': ('10-achille-lapince', 'Lapince', 'the escaped convict', 'spiky blond hair, no hat, white pyjama shirt with blue stripes, grey trousers'),
    'lapince-paille': ('11-achille-lapince-deguise', 'Lapince déguisé', 'the convict in disguise', 'straw hat, spiky blond hair, white shirt with blue STRIPES, grey trousers'),
    'lola': ('12-lola-cachou', 'Lola', 'the young woman', 'red beret, sunglasses, curly ginger-red hair, pink dress with white polka dots'),
    'marin': ('13-yves-le-goeland', 'le marin', 'the sailor', 'orange knitted beanie, spiky blond hair, blue-striped white top, grey trousers'),
    'epouvantail': ('14-epouvantail', 'épouvantail', 'the scarecrow', 'on a wooden pole, arms stretched out, straw hat, blond straw hair, white shirt with blue CHECKS, grey trousers'),
    'epouvantail-nu': ('15-epouvantail-decoiffe', 'épouvantail décoiffé', 'the hatless scarecrow', 'the same scarecrow with NO hat, its blond straw hair blowing in the wind'),
    'octave': ('16-octave-carat', 'Octave', 'the jeweller', 'black top hat, round glasses, purple suit, walking cane'),
    'ludo': ('17-ludo-taupin', 'Ludo', 'the burglar with a backpack', 'orange knitted beanie, sunglasses, grey hoodie, black trousers, BACKPACK'),
    'lino': ('18-lino-taupin', 'Lino', 'his identical twin', 'orange knitted beanie, sunglasses, grey hoodie, black trousers, NO backpack'),
    'zita': ('19-zita-pistache', 'Zita', 'the old woman', 'grey bun, no hat, yellow checked coat, green skirt, handbag'),
    'berenice': ('20-berenice-fard', 'Bérénice', 'the diva', 'long black hair, long red dress'),
    'gontran': ('21-gontran-lameche', 'Gontran', 'the old actor', 'black top hat, grey moustache, RED suit jacket, ORANGE trousers, closed black umbrella'),
    'infirmier': ('22-le-faux-infirmier', 'le faux infirmier', 'the fake nurse', 'black top hat, long white nurse coat, white surgical mask, ORANGE trousers, closed black umbrella'),
    'petronille': ('23-petronille-doublure', 'Pétronille', 'the actress', 'black top hat, long ginger-red hair, long green coat, ORANGE trousers, walking cane'),
    'hector': ('24-hector-plumeau', 'Hector', 'the young actor', 'black bowler hat, curly brown hair, blue suit jacket, ORANGE trousers, closed black umbrella'),
    'cargo': ('25-fortune-cargo', 'Cargo', 'the shipowner', 'black top hat, grey moustache, red suit jacket, BLACK trousers, closed black umbrella'),
}
NEEDLE = 'a tiny shiny golden sewing needle (a little golden stroke with a sparkle)'
GARAGE = 'The sign above the door of the garage with the stacks of tyres reads "GARAGE PISTONS".'
REX = 'The white marquee of the cream art deco cinema reads "LE REX".'

P = []


def piece(rc, slug, title, cases, people, n, story=(), texts=(), forbid='', keep='', details='', checks=()):
    P.append(dict(rc=rc, slug=slug, title=title, cases=cases, people=people, n=n, story=list(story), texts=list(texts),
                  forbid=forbid, keep=keep, details=details, checks=list(checks)))


# --- Rangée 1 ---------------------------------------------------------------------------------------------------
piece((1, 1), 'champs-cimetiere', 'Champs de meules et cimetière', '« Rideau ! » (Pétronille), aiguille n° 7.',
      'farm workers in flat caps making hay with pitchforks in the fields, a gardener with a wheelbarrow and an old lady with flowers in the cemetery', 14,
      story=['In the walled cemetery, in its upper half, {petronille} stands between two tombstones, leaning on her cane with one hand and holding an open script in the other, reciting theatrically, with a small music-notes bubble above her head.',
             f'The tall grey monument standing among the tombstones is a stone angel statue; the angel holds {NEEDLE} in its hand.'],
      forbid='nobody else wears a top hat or orange trousers', keep='haystack, tombstone, cypress',
      checks=['Pétronille dans le cimetière : haut-de-forme, manteau vert, pantalon orange, canne.', 'L\'ange de pierre tient une aiguille dorée.'])
piece((1, 2), 'champs-hotel', 'Champs de meules et toit du Grand Hôtel', 'Décor.',
      'farm workers in flat caps making hay with pitchforks in the fields, a hay cart pulled by a horse, hotel guests at the windows', 12,
      keep='haystack')
piece((1, 3), 'gare', 'Gare de Meulebourg', '« La Belle Évasion » (fourgon, Lola, Picotin), aiguille n° 1.',
      'travellers with suitcases, porters with trolleys, people sitting on the benches', 40,
      story=['The stone building with the clock tower is the railway station: put the sign "GARE DE MEULEBOURG" above its columned entrance.',
             'A navy blue police van marked "POLICE" is parked in the street right at the foot of the station steps, its rear doors wide open and empty inside.',
             'On the paving next to the van, {lola} lies flat on her back, pretending to have fainted, one hand on her forehead, with a small dizzy-stars bubble above her head.',
             'Crouching beside her, {picotin}, worried, with a blue sweat drop above his head, his back turned to the van.',
             'On the LEFT clock face of the tower there are THREE hands: the third one is a tiny shiny golden sewing needle.'],
      texts=['GARE DE MEULEBOURG', 'POLICE'], forbid='nobody else wears a beret, a pink dress, sunglasses or a police uniform', keep='haystack',
      checks=['Fourgon « POLICE » bleu marine au pied des marches, portes ouvertes.', 'Lola allongée à côté, Picotin accroupi.', 'Troisième aiguille dorée sur le cadran de gauche.', 'Enseigne « GARE DE MEULEBOURG ».'])
piece((1, 4), 'depot', 'Château d\'eau et dépôt', 'Décor.',
      'railway workers in blue overalls and caps around the engine shed, the locomotive and the crates', 25,
      keep='railway track, crate, the locomotive', details=', rivets on the locomotive, planks of the engine shed')
piece((1, 5), 'voies-wagons', 'Voies ferrées et wagons', 'Décor.',
      'railway workers in blue overalls and caps loading the wagons, a few strollers under the trees', 18,
      keep='railway track, wagon, crate, barrel')

# --- Rangée 2 ---------------------------------------------------------------------------------------------------
piece((2, 1), 'commissariat', 'Commissariat', 'Aiguille n° 4.',
      'police officers in navy uniforms and kepis around the police station, shoppers at the little shops with awnings, a gardener in the cemetery', 30,
      story=['The red brick building is the police station: put the sign "COMMISSARIAT" above its columned door and a blue lamp next to it.',
             f'Three white-and-blue police cars are parked side by side in the street in front of the police station; {NEEDLE} lies on the ground between two of them.'],
      texts=['COMMISSARIAT'], forbid='no policeman with a ginger moustache and Bermuda shorts here', keep='tombstone',
      checks=['Enseigne « COMMISSARIAT » sur le bâtiment en brique.', 'Trois voitures de police, une aiguille dorée au sol entre deux.'])
piece((2, 2), 'hotel-pharmacie', 'Grand Hôtel et pharmacies', 'Décor (enseignes).',
      'hotel guests and porters with luggage under the hotel awnings, pharmacists at their doors, shoppers, a postman', 35,
      story=['The large building with the awnings at the top is a hotel: put the sign "GRAND HÔTEL" above its awnings.',
             'The red brick building at the left edge is the police station: the sign "COMMISSARIAT" above its columned door.'],
      texts=['GRAND HÔTEL', 'COMMISSARIAT'], forbid='no police uniform with Bermuda shorts here',
      checks=['Enseignes « GRAND HÔTEL » et « COMMISSARIAT ».'])
piece((2, 3), 'marche', 'Marché et beffroi', '« La Main dans le sac » (Rose, Picotin, le voleur, le mime).',
      'shoppers with baskets and stallholders in aprons at the market stalls', 45,
      story=['The market stall with the pink-and-white striped awning in the centre of the image is the bakery stall: hang a banner reading "BOULANGERIE LEMIEL" on it. Standing right in front of it, {rose}, furious, pointing towards the right with one arm fully stretched, with an angry red comic symbol above her head.',
             'Right next to her, {picotin}, holding a baguette in one hand and looking at it lovingly, with a small red heart bubble above his head.',
             '{lafouine} is running between the stalls towards the lower right, holding a cloth money bag in one hand.',
             'Not far from him, {motus}, standing frozen with both hands raised and flat as if pressed against an invisible box, empty hands.'],
      texts=['BOULANGERIE LEMIEL'], forbid='nobody else wears a beanie, a mask, a striped sweater, a chef\'s toque or a police uniform', keep='market stall',
      details=', bread, fruit and vegetables on the market stalls',
      checks=['Le voleur a un masque ET un sac d\'argent ; le mime est identique mais SANS masque, mains vides.', 'Rose pointe du doigt devant l\'étal « BOULANGERIE LEMIEL », Picotin tient une baguette.', 'Personne d\'autre en bonnet, masque ou pull rayé.'])
piece((2, 4), 'cinema', 'Cinéma Le Rex et boucherie', '« La Main dans le sac » (file du cinéma, sac caché), aiguille n° 3.',
      'shoppers at the market stalls, people looking at the cinema, neighbours in the gardens', 40,
      story=[REX,
             'A queue of four people stands on the pavement just left of the cinema\'s rounded front, facing the cinema: first a slim woman with dark brown skin, long black hair and glasses, in a yellow polka-dot dress, holding a ticket; second a stocky bald man with a grey moustache, a black bowler hat and a brown coat, reading a newspaper; third {lafouine}, holding a cinema ticket, with a small music-notes bubble above his head; fourth a little girl with a red ponytail and a green hoodie, eating an ice cream cone.',
             'The SAME thief is shown a second time (earlier in the story): walking calmly, hands empty, between the market stalls and the cinema.',
             'Next to the big wooden crate left of the cinema, a green public litter bin with a cloth money bag sticking out of it.',
             f'The ivy-covered house in the centre of the image is a butcher\'s shop: a red-and-white striped awning over its door, a sign reading "BOUCHERIE TENDRON", sausages hanging in its window, and {NEEDLE} stuck in the wooden frame of its door.'],
      texts=['LE REX', 'BOUCHERIE TENDRON'], forbid='nobody else wears a beanie, a mask or a striped sweater', keep='market stall, crate',
      checks=['Le voleur apparaît 2 fois : 3e de la file avec un ticket, et marchant les mains vides.', 'Poubelle verte avec le sac d\'argent.', 'Enseignes « LE REX » et « BOUCHERIE TENDRON », aiguille dorée sur la porte de la boucherie.'])
piece((2, 5), 'statue', 'Parc : Statue du Fondateur', 'Aiguille n° 2.',
      'people strolling, picnicking on the lawn, a painter at an easel, children with a dog', 25,
      story=[f'The bronze statue on the pedestal is the town founder: he raises one hand high and holds {NEEDLE} in it.', REX],
      texts=['LE REX'], keep='crate, barrel, the pond',
      checks=['La statue lève une main qui tient une aiguille dorée.'])

# --- Rangée 3 ---------------------------------------------------------------------------------------------------
piece((3, 1), 'bar-ecole', 'Bar Le Fer à Cheval et cour de l\'école', '« La Belle Évasion » (Lapince court), aiguille n° 5.',
      'children playing in the school yard with a teacher, customers of the shops, anglers and bargemen on the quay', 35,
      story=['The LEFT one of the two stone houses with pink striped awnings is a bar: put the sign "LE FER À CHEVAL" and a golden horseshoe above its door, and two small tables in front of it.',
             '{lapince} is running at full speed along the pavement in front of the bar, towards the left.',
             'A customer standing at the door of the bar points at him, with a "!" bubble above his head: a stocky bald man with a grey beard, a cap, an orange t-shirt and blue trousers.',
             f'The hedged yard in the centre of the image is a school yard: a hopscotch grid with the numbers 1 to 8 is chalked on its ground, children are playing there, and {NEEDLE} lies on square number 1.',
             GARAGE],
      texts=['LE FER À CHEVAL', 'GARAGE PISTONS', '1 2 3 4 5 6 7 8'], forbid='nobody else wears stripes, nobody else is running', keep='boat',
      checks=['Lapince (pyjama rayé, cheveux en épis) court devant le bar « LE FER À CHEVAL ».', 'Un client en t-shirt orange le montre du doigt.', 'Marelle dans la cour, aiguille dorée sur la case 1.'])
piece((3, 2), 'fontaine', 'Grand-Place : fontaine et bancs', '« La Tarte de bienvenue » (toute l\'enquête), « La Grande Paille » (diamant dans la fontaine).',
      'people strolling on the square, sitting on the other benches, children around the fountain', 35,
      story=['On the wooden bench at the upper left of the square (the bench nearest to the left edge), {timothee} is fast asleep, empty hands, with a "Zzz" bubble above his head.',
             'On the cobblestones a few steps in front of that bench, a strawberry tart on a plate lies on the ground; a small white dog stands right in front of it, looking innocent; three pigeons a little further away.',
             'The SAME delivery boy is shown a second time (earlier in the story): walking across the square towards the bench, carrying the strawberry tart on a plate with both hands.',
             '{picotin} stands near the big tree in the middle of the image, waving hello with one raised hand.',
             'Standing at the LEFT side of the fountain, {ludo}, pointing angrily at a sparkling diamond lying in the water of the fountain basin, with an angry red comic symbol above his head.',
             GARAGE],
      texts=['GARAGE PISTONS'], forbid='nobody else wears an apron, a red cap, a beanie, sunglasses, a hoodie or a backpack; only one white dog; no other tart',
      checks=['Le livreur apparaît 2 fois : endormi sur le banc (Zzz) et portant la tarte.', 'Tarte au sol, chien blanc devant, pigeons.', 'Picotin fait signe.', 'Ludo (sac à dos) pointe le diamant dans la fontaine.'])
piece((3, 3), 'hotel-de-ville', 'Hôtel de Ville et terrasse du café', '« La Grande Paille » (la tarte : Octave, Zita, Picotin).',
      'people strolling on the square, a wedding party on the town hall steps, customers at the café tables, a waiter', 35,
      story=['On the square in front of the town hall, next to the bench under its windows, {zita} waves with one hand (empty hands), and right beside her {picotin} happily holds a strawberry tart on a plate, with a small red heart bubble above his head.',
             'Three small round café tables with chairs and a parasol stand on the cobblestones along the hedge, in the lower middle of the square (a café terrace). Standing at this terrace, the SAME old woman is shown a second time (earlier in the story), carrying a strawberry tart on a plate with both hands.',
             '{octave} tiptoes sneakily along the street at the bottom of the image, heading left, holding a strawberry tart on a plate up in front of his face to hide.'],
      forbid='nobody else wears a top hat, a purple suit, a yellow coat or a police uniform; nobody else carries a tart', keep='market stall, the fountain',
      checks=['Zita (manteau jaune à carreaux) apparaît 2 fois : saluant près de Picotin, et portant la tarte à la terrasse.', 'Picotin tient la tarte, cœur au-dessus de la tête.', 'Octave furtif en bas, la tarte devant le visage.'])
piece((3, 4), 'kiosque', 'Parc : kiosque à musique', '« Coin-coin ! » (le concours).',
      'spectators, some holding ordinary ducks in their arms or in baskets, a small brass band in the bandstand, strollers', 40,
      story=['On the lawn between the two big trees and the bandstand, the duck beauty contest: a wooden signpost reading "CONCOURS DE CANES" and a long table with velvet cushions and rosettes.',
             'A duck with entirely shiny golden feathers sits proudly on a cushion on the table, and next to her one ordinary mallard duck on another cushion.',
             'The contest president stands by the table, pointing at the golden duck, with a "!" bubble above his head: a slim elderly man with dark brown skin, short white hair and glasses, a black bowler hat and a navy striped suit, a newspaper under his arm.',
             'On the other side of the table, a jealous contestant with an angry red comic symbol above her head: a woman with curly grey hair, a beret, a red sweater, a brown skirt and a walking cane.',
             REX],
      texts=['CONCOURS DE CANES', 'LE REX'], forbid='exactly ONE golden duck; every other duck is an ordinary brown and green mallard', keep='the bandstand, market stall',
      checks=['Panneau « CONCOURS DE CANES », table avec coussins.', 'Une seule cane dorée, sur un coussin, à côté d\'un canard ordinaire.', 'Le président pointe la cane, la concurrente est furieuse.'])
piece((3, 5), 'etang', 'Parc : Étang aux Canards', '« Coin-coin ! » (Barbarie, la baronne, Lulu).',
      'anglers, a couple on the grass, joggers on the path', 20,
      story=['Write "LE BARON" on the side of the brown rowing boat. Standing in this boat, {barbarie}, both hands raised, with a blue sweat drop above his head, and four angry ordinary mallard ducks swimming around the boat.',
             'On the shore at the foot of the wooden jetty, {baronne}, both hands raised in despair, with a blue sweat drop above her head.',
             'The SAME bearded man is shown a second time (earlier in the story): crouching at the water\'s edge on the grassy shore between the jetty and the boat, holding out a baguette to a duck with entirely shiny golden feathers that is coming out of the water towards him.',
             'A little further right on the shore, {lulu}, pointing at the crouching man, with two ordinary mallard ducks at his feet.',
             REX],
      texts=['LE BARON', 'LE REX'], forbid='exactly ONE golden duck, every other duck is an ordinary mallard; nobody else wears a fedora, a green coat or a straw hat', keep='the pond, the jetty, the boat, water lily',
      checks=['Barbarie apparaît 2 fois : debout mains en l\'air dans la barque « LE BARON », et accroupi avec une baguette devant la cane dorée.', 'La baronne au pied du ponton, mains en l\'air.', 'Lulu pointe du doigt.', 'Une seule cane dorée.'])

# --- Rangée 4 ---------------------------------------------------------------------------------------------------
piece((4, 1), 'quai-nord', 'Quai Nord et traversée', '« La Belle Évasion » (le marin, Lola en bateau, Lapince).',
      'bargemen on the boats, anglers on the quay, a washerwoman on the lower bank', 20,
      story=['On the stone quay at the top, near a mooring bollard, {marin} stands holding a coil of rope in his hands.',
             'The small boat with a white cabin moored at the lower bank, next to the weeping willows, is painted red and has the name "LA COCOTTE" on its side. {lola} stands at its helm, waving with one hand.',
             '{lapince} is climbing out of that red boat onto the lower bank, both hands on the edge of the bank.',
             GARAGE],
      texts=['LA COCOTTE', 'GARAGE PISTONS'], forbid='nobody else wears stripes, a beanie, a beret or a pink dress', keep='boat, the river, the windmill',
      checks=['Le marin (bonnet orange, rayures) sur le quai avec une corde.', 'Bateau rouge « LA COCOTTE » près des saules, Lola à la barre.', 'Lapince (sans bonnet) grimpe sur la rive.'])
piece((4, 2), 'pont-central', 'Pont Central', '« La Belle Évasion » (les agents), « Rideau ! » (Hector), aiguille n° 8.',
      'walkers on the quay and on the bridge, anglers, bargemen', 25,
      story=['Two police officers stand guard at the upper end of the stone bridge (where it meets the quay), next to a red-and-white barrier: a policeman with dark brown skin and short black hair, and a policewoman with very fair skin, a brown ponytail and sunglasses, both in navy uniforms and kepis.',
             f'{NEEDLE[0].upper() + NEEDLE[1:]} stands upright on the stone parapet in the middle of the bridge.',
             'On the quay near the lamp post at the right end of the bridge, {hector}, looking dreamy, with a small red heart bubble above his head; right beside him an admirer gazing at him, with a small red heart bubble above her head: a slim woman with a blond ponytail, sunglasses, a straw hat and a yellow polka-dot dress.',
             GARAGE],
      texts=['GARAGE PISTONS'], forbid='nobody else wears orange trousers, a bowler hat or stripes; nobody else carries an umbrella', keep='boat, the river, the bridge',
      checks=['Deux agents (un homme, une femme à lunettes noires) à l\'entrée du pont.', 'Aiguille dorée sur le parapet.', 'Hector (chapeau melon, costume bleu, pantalon orange, parapluie) et son admiratrice.'])
piece((4, 3), 'bijouterie', 'Bijouterie Carat', '« La Grande Paille » (le cambriolage).',
      'onlookers on the quay, bargemen on the boats', 25,
      story=['The building with the purple awnings is a jewellery shop: put the sign "BIJOUTERIE CARAT" above the awnings. One of its display windows is smashed, with broken glass on the pavement.',
             'On the pavement right in front of the shop, an open manhole with its round cover pushed aside; {lino} is climbing out of it, only his upper body out, both hands on the edge.',
             '{ludo} tiptoes away from the manhole towards the right, bent forward, holding a sparkling diamond in one hand.',
             '{octave} stands in front of the smashed window, talking on a telephone held to his ear, with a blue sweat drop above his head.',
             'Next to him, {picotin}, reading his little notebook.'],
      texts=['BIJOUTERIE CARAT'], forbid='the two burglars are identical twins, the ONLY difference is the backpack; nobody else wears a beanie, sunglasses or a top hat', keep='boat, the river, crate',
      checks=['Vitrine cassée, plaque d\'égout ouverte devant la bijouterie.', 'Lino (SANS sac à dos) sort de l\'égout ; Ludo (AVEC sac à dos) s\'éloigne avec le diamant.', 'Octave téléphone, Picotin lit son carnet.', 'Enseigne « BIJOUTERIE CARAT ».'])
piece((4, 4), 'theatre', 'Théâtre de la Botte', 'Décor (enseigne).',
      'elegant spectators in evening dress near the theatre, strollers in the park, a gardener', 25,
      story=['The large building with the columns and the curved roof is a theatre: write "THÉÂTRE DE LA BOTTE" on the frieze under its pediment.'],
      texts=['THÉÂTRE DE LA BOTTE'], forbid='nobody wears a top hat or orange trousers', keep='the bandstand',
      checks=['Enseigne « THÉÂTRE DE LA BOTTE » sur le fronton.'])
piece((4, 5), 'aire-de-jeux', 'Parc : aire de jeux', '« Coin-coin ! » (la camionnette), aiguille n° 6.',
      'children playing on the slide and the swings, parents watching', 30,
      story=['A white delivery van with the words "VOLAILLES BARBARIE" on its side is parked on the path just below the playground fence, its rear doors open and empty inside.',
             'Next to its open rear doors, {lulu}, waving happily, with a small red heart bubble above his head; at his feet a duck with entirely shiny golden feathers.',
             '{barbarie} walks along the path on the left towards the van, carrying a closed cardboard box with air holes in both arms.',
             '{bigarade} walks along the same path in the opposite direction, carrying a similar cardboard box in both arms, whistling, with a small music-notes bubble above his head.',
             f'{NEEDLE[0].upper() + NEEDLE[1:]} sticks out of the sand of the playground, near the slide.'],
      texts=['VOLAILLES BARBARIE'], forbid='exactly ONE golden duck; nobody else wears a fedora, a green coat or a chef\'s toque; nobody else carries a cardboard box', keep='the slide, the swings, the greenhouse',
      checks=['Camionnette blanche « VOLAILLES BARBARIE », portes arrière ouvertes.', 'Lulu et la cane dorée à côté.', 'Barbarie ET Bigarade portent chacun un carton, en sens opposés.', 'Aiguille dorée dans le sable près du toboggan.'])

# --- Rangée 5 ---------------------------------------------------------------------------------------------------
piece((5, 1), 'moulin-jardins', 'Moulin et jardins ouvriers', '« La Belle Évasion » (les épouvantails).',
      'gardeners in overalls and caps in the vegetable plots, the miller at the door of the windmill', 12,
      story=['{epouvantail}: draw THREE identical scarecrows of this kind, far apart from each other: two in the hay field left of the windmill and one in the vegetable plots at the bottom.',
             '{epouvantail-nu}: draw ONE, standing in the vegetable plots at the bottom.',
             '{lapince-paille} stands perfectly still in the hay field in front of the windmill, his arms stretched out, pretending to be a scarecrow, his feet on the ground (no pole), with a blue sweat drop on his forehead and three pigeons pecking at his feet.'],
      forbid='exactly five figures have their arms stretched out: three scarecrows with a straw hat and a CHECKED shirt, one scarecrow without a hat and with a CHECKED shirt, and the convict with a straw hat and a STRIPED shirt; nobody else wears a straw hat, stripes or checks',
      keep='haystack, the windmill, the greenhouse',
      checks=['3 épouvantails avec chapeau de paille et chemise à CARREAUX.', '1 épouvantail SANS chapeau.', 'Lapince : chapeau de paille mais chemise à RAYURES, goutte de sueur, pigeons à ses pieds.'])
piece((5, 2), 'serre-capitainerie', 'Serre des jardins et capitainerie', 'Aiguilles n° 9 et n° 10.',
      'gardeners in the vegetable plots, dockers near the warehouse, a sailor on the quay', 20,
      story=[f'{NEEDLE[0].upper() + NEEDLE[1:]} is planted upright in the soil just in front of the glass greenhouse.',
             f'The stone house on the quay with the flags next to it is the harbour master\'s office: put the sign "CAPITAINERIE" above its door; a life buoy hangs next to the door, with {NEEDLE} stuck in it.'],
      texts=['CAPITAINERIE'], forbid='no scarecrow here', keep='haystack, the greenhouse, the bridge, crate, flag',
      checks=['Aiguille dorée plantée devant la serre.', 'Enseigne « CAPITAINERIE », bouée avec une aiguille dorée à côté de la porte.'])
piece((5, 3), 'entrepots', 'Entrepôts et passerelle', '« Rideau ! » (Gontran s\'enfuit).',
      'dockers carrying sacks and rolling barrels near the warehouses, rowers in the boats', 25,
      story=['{gontran} is running along the stone quay at the top right, between the crates, towards the right, holding his closed umbrella and looking back over his shoulder.'],
      forbid='nobody else wears a top hat, orange trousers or a red jacket', keep='boat, the river, crate, the iron footbridge',
      checks=['Gontran (haut-de-forme, veste rouge, pantalon orange, parapluie) court sur le quai en haut à droite.'])
piece((5, 4), 'parvis-theatre', 'Parvis du théâtre et quai', '« Rideau ! » (Bérénice, Picotin, Gontran).',
      'spectators in evening dress, shocked, on the theatre steps and the forecourt, dockers on the quay', 30,
      story=['On the paved forecourt at the foot of the theatre steps, {berenice} has collapsed on her back, eyes closed, a small glass bottle in one hand, a bouquet of flowers fallen beside her, with a small dizzy-stars bubble above her head.',
             '{picotin} crouches beside her, worried, with a blue sweat drop above his head.',
             'A few steps away, near the lamp post on the quay, {gontran} stands calmly reading an open newspaper, not looking at her, his closed umbrella hooked on his arm.'],
      forbid='nobody else wears a top hat, orange trousers or a red jacket; nobody else reads a newspaper', keep='boat, the river, crate, the crane',
      checks=['Bérénice (robe rouge) effondrée au pied des marches, une bouteille à la main.', 'Picotin accroupi près d\'elle.', 'Gontran lit son journal près du lampadaire.'])
piece((5, 5), 'hopital-port', 'Hôpital et port', '« Rideau ! » (le faux infirmier ; Gontran caché au port).',
      'real nurses in white uniforms (no hats, no masks), patients, dockers, sailors, passengers with trunks', 30,
      story=['Write "L\'ENTRACTE" on the hull of the white passenger boat; a gangway links the boat to the quay.',
             '{infirmier} tiptoes sneakily away from the hospital entrance, bent forward, holding a small glass bottle in one hand.',
             'At the hospital door, a puzzled woman doctor watches him leave, with a "?" bubble above her head: dark brown skin, black hair in a bun, glasses, a white coat, white trousers, a briefcase.',
             '{gontran} crouches in the middle of the group of wooden crates on the quay at the lower right, as if hiding from the people on the quay but clearly visible to the viewer, holding his closed umbrella, with a blue sweat drop above his head.',
             '{cargo} stands on the quay next to the gangway of the white boat, waving with one hand.'],
      texts=['L\'ENTRACTE'], forbid='exactly three people wear a top hat: the fake nurse (white coat, mask, ORANGE trousers), the crouching actor (red jacket, ORANGE trousers) and the waving shipowner (red jacket, BLACK trousers); nobody else wears orange trousers or a face mask',
      keep='boat, crate, the crane',
      checks=['Le faux infirmier : blouse blanche, masque, haut-de-forme, parapluie, pantalon ORANGE, un flacon à la main.', 'La médecin à la porte, perplexe.', 'Gontran (pantalon ORANGE) accroupi au milieu des caisses.', 'Cargo (pantalon NOIR) salue près de la passerelle.', 'Bateau « L\'ENTRACTE ».'])


def name(p):
    return f'{p["rc"][0]}-{p["rc"][1]}-{p["slug"]}'


def build(p):
    sheets = []
    def sub(m):
        k = m.group(1)
        if k not in sheets:
            sheets.append(k)
        _, _, role, signs = WHO[k]
        return f'{role} shown on image {sheets.index(k) + 2} ({signs})'
    story = [re.sub(r'\{([a-z-]+)\}', sub, s) for s in p['story']]
    story = [s[0].upper() + s[1:] for s in story]
    keep = 'Every building, roof, chimney, street, hedge and tree' + (f', every {p["keep"]}' if p['keep'] else '')
    T = ['Image 1 is a crop from a larger hand-drawn isometric map of a small French town. Redraw image 1 as a sharp, high-resolution, richly detailed illustration.', '',
         f'KEEP EXACTLY: the same art style, outlines and colours, and the same composition and framing. {keep} stays at exactly the same place, with the same size, '
         'the same shape and the same viewing angle. Keep the colour of every roof, wall and awning exactly as in image 1. Everything that touches an edge of image 1 '
         'touches the same edge at the same place in your image. Do not zoom in or out, do not shift, crop, rotate or extend the view, do not add or remove any building.', '',
         f'ADD DETAILS that were too small to see: window frames, doors, roof tiles, ivy leaves, cobblestones, flower boxes, lamp posts, benches{p["details"]}.', '',
         f'ADD PEOPLE in the same hand-drawn style: about {p["n"]} small townspeople, each about as tall as a ground-floor door: {p["people"]}. '
         'They wear ordinary clothes and must look clearly different from the story characters' + (f': {p["forbid"]}' if p['forbid'] else '') + '.']
    if story:
        T += ['', 'STORY (draw every element exactly as described, clearly visible, never hidden behind a tree, a building or another person):'] + [f'- {s}' for s in story]
    if p['texts']:
        T += ['', 'The only written words in the image are: ' + ', '.join(f'"{t}"' for t in p['texts']) + ' (spelled exactly); every other sign stays blank. No frame, no caption.']
    else:
        T += ['', 'No written words anywhere: every sign stays blank. No frame, no caption.']
    return '\n'.join(T), sheets


def write(p):
    d = f'{OUT}/{name(p)}'; os.makedirs(d)
    prompt, sheets = build(p)
    x, y = STEP * (p['rc'][1] - 1), STEP * (p['rc'][0] - 1)
    L = [f'# Morceau {p["rc"][0]}-{p["rc"][1]} — {p["title"]}', '', f'**Enquêtes** : {p["cases"]}', '',
         '## Pièces jointes, dans cet ordre', '',
         f'1. `morceau.png`, dans ce dossier (à défaut : découper dans `02-carte-mere/resultat.jpg` le carré x = {x}, y = {y}, côté = {SIDE})']
    for i, k in enumerate(sheets):
        L.append(f'{i + 2}. `01-personnages/{WHO[k][0]}/resultat.png` (fiche de {WHO[k][1]})')
    L += ['', '## Prompt — format **1:1**, 1600 × 1600', '', '```', prompt, '```', '']
    if p['checks']:
        L += ['## À vérifier', '', '- Rien n\'a bougé par rapport au morceau (bâtiments, rues, bords), les couleurs des toits et des murs sont les mêmes.'] + [f'- {c}' for c in p['checks']] + ['']
    L += ['Enregistrer l\'image dans ce dossier sous le nom `resultat.png`.', '']
    open(f'{d}/prompt.md', 'w').write('\n'.join(L))
    return sheets


def crop_all(src, dst):
    """Découpe les 25 morceaux de la carte mère (agrandis ×2) dans dst/<morceau>/morceau.png."""
    from PIL import Image
    im = Image.open(src).convert('RGB')
    for p in P:
        x, y = STEP * (p['rc'][1] - 1), STEP * (p['rc'][0] - 1)
        os.makedirs(f'{dst}/{name(p)}', exist_ok=True)
        im.crop((x, y, x + SIDE, y + SIDE)).resize((2 * SIDE, 2 * SIDE), Image.LANCZOS).save(f'{dst}/{name(p)}/morceau.png')


def main():
    import sys
    if '--crop' in sys.argv:
        i = sys.argv.index('--crop'); crop_all(sys.argv[i + 1], sys.argv[i + 2])
    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
    used = []
    for p in P:
        for k in write(p):
            if k not in used:
                used.append(k)
    done = {'picotin', 'timothee', 'rose', 'lafouine', 'motus', 'lola'}  # fiches déjà générées
    todo = sorted((k for k in used if k not in done), key=lambda k: WHO[k][0])
    T = ['# Tâches pour Muse', '',
         'Tout se passe dans le dossier Drive « Haystack — Générations Gemini ». Traiter les tâches dans l\'ordre, sans s\'arrêter entre deux pour demander une validation. '
         'Enregistrer chaque image dans le dossier indiqué sous le nom `resultat.png`. Si un `resultat.png` existe déjà dans un dossier, passer au suivant.', '',
         '## A. Vérifier la carte mère', '',
         'Le fichier `02-carte-mere/resultat.jpg` doit exister et mesurer 1600 × 1600 pixels. Sinon, s\'arrêter et le signaler.', '',
         '## B. Fiches des personnages manquantes', '',
         'Pour chaque dossier ci-dessous, dans cet ordre : ouvrir son document « prompt », joindre les images listées sous « Pièces jointes » et générer avec exactement le texte du bloc « Prompt ».', '']
    T += [f'{i + 1}. `01-personnages/{WHO[k][0]}`' for i, k in enumerate(todo)]
    T += ['', '## C. Les 25 morceaux de la carte', '',
          'Pour chaque dossier ci-dessous, dans cet ordre : ouvrir son document « prompt » ; joindre `morceau.png` de ce dossier (image 1), '
          'puis les fiches de personnages listées ; générer avec exactement le texte du bloc « Prompt », sans le modifier ni le traduire, en 1:1, 1600 × 1600. '
          'Le plus important : redessiner le morceau sans rien déplacer et sans changer les couleurs des toits et des murs.', '']
    T += [f'{i + 1}. `03-morceaux/{name(p)}`' for i, p in enumerate(P)]
    T += ['', '## D. Compte rendu', '',
          'À la fin, donner un tableau : dossier, image enregistrée (oui/non), points de la liste « À vérifier » non respectés.', '']
    open(f'{OUT}/TACHES.md', 'w').write('\n'.join(T))
    print(len(P), 'morceaux ;', len(todo), 'fiches à générer :', ', '.join(todo))


if __name__ == '__main__':
    main()
