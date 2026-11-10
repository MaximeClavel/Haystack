# Carte de Meulebourg générée section par section dans Gemini (personnages, actions et objets des enquêtes
# compris dans l'image). Écrit l'arborescence à déposer sur Google Drive :
#   tools/art/drive/00-references, 01-personnages/<NN-nom>/prompt.md, 02-carte/<section>/prompt.md
# Usage : python3 tools/art/carte.py [--plan sortie.png]
import os, shutil, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = f'{ROOT}/drive'

# --- Personnages des enquêtes -------------------------------------------------------------------------------
# clé : (dossier, nom, description anglaise complète, modèle dont il doit rester le sosie ou None)
CH = {
    'picotin': ('01-brigadier-gaston-picotin', 'Brigadier Gaston Picotin', 'a stocky, plump policeman with fair skin, short ginger hair and a big ginger moustache, wearing a navy police kepi, a blue police uniform jacket with brass buttons, beige Bermuda shorts and a red-and-yellow striped scarf', None),
    'timothee': ('02-timothee-fournil', 'Timothée Fournil, le livreur', 'a slim young delivery boy with light tan skin and curly black hair, wearing a red flat cap, a white apron over a white shirt and red shorts', None),
    'rose': ('03-rose-lemiel', 'Rose Lemiel, la boulangère', 'a plump woman baker with very fair skin and blond hair in a bun, wearing a white chef\'s toque, a pink apron over a white blouse and a white skirt', None),
    'lafouine': ('04-ernest-lafouine', 'Ernest Lafouine, le voleur', 'a tall slim thief with fair skin and short brown hair, wearing an orange knitted beanie, a black bandit eye mask, a black-and-white horizontally striped sweater and black trousers', None),
    'motus': ('05-motus', 'Motus, le mime', 'a mime who looks exactly like the thief (same tall slim body, same face, short brown hair, same orange knitted beanie, same black-and-white striped sweater, black trousers) but with NO mask at all', 'lafouine'),
    'baronne': ('06-adelaide-de-la-botte', 'Adélaïde de la Botte, la baronne', 'a plump old baroness with very fair skin, white hair in a bun, round glasses, wearing a straw hat, a purple dress with white polka dots, and carrying a leather handbag', None),
    'barbarie': ('07-hippolyte-barbarie', 'Hippolyte Barbarie, l\'éleveur', 'a stocky bald man with very fair skin and a full grey beard, wearing a brown fedora, a long green checked coat and yellow trousers', None),
    'lulu': ('08-lulu', 'Lulu, le petit témoin', 'a small child with brown skin, spiky blond hair and round glasses, wearing blue dungarees over a white t-shirt and orange shorts, holding a red balloon on a string', None),
    'bigarade': ('09-gaspard-bigarade', 'Gaspard Bigarade, le chef cuisinier', 'a stocky cook with brown skin, short black hair and a black moustache, wearing a white chef\'s toque, a white chef\'s jacket with an apron and black trousers', None),
    'lapince': ('10-achille-lapince', 'Achille Lapince, l\'évadé', 'a slim escaped convict with fair skin and spiky blond hair, no hat, wearing a white pyjama shirt with blue stripes and grey trousers', None),
    'lapince-paille': ('11-achille-lapince-deguise', 'Achille Lapince déguisé en épouvantail', 'the same convict (same face, spiky blond hair, same blue-STRIPED white pyjama shirt, grey trousers) now wearing a straw hat', 'lapince'),
    'lola': ('12-lola-cachou', 'Lola Cachou, la fiancée', 'a slim young woman with brown skin and curly ginger-red hair, wearing a red beret, sunglasses, a pink dress with white polka dots, and carrying a handbag', None),
    'marin': ('13-yves-le-goeland', 'Yves Le Goéland, le marin', 'a sailor who looks very much like the convict (slim, fair skin, spiky blond hair sticking out, blue-striped white top, grey trousers) but wears an orange knitted beanie', 'lapince'),
    'epouvantail': ('14-epouvantail', 'Épouvantail', 'a scarecrow standing on a wooden pole with its arms stretched out, with a simple cloth face, spiky blond straw hair, a straw hat, a white shirt with blue CHECKS (gingham, not stripes) and grey trousers', None),
    'epouvantail-nu': ('15-epouvantail-decoiffe', 'Épouvantail décoiffé', 'the same scarecrow (cloth face, blue-CHECKED white shirt, grey trousers, arms stretched out on its pole) with NO hat, its spiky blond straw hair blowing in the wind', 'epouvantail'),
    'octave': ('16-octave-carat', 'Octave Carat, le bijoutier', 'a slim elderly bald jeweller with very fair skin, a little grey hair on the sides and round glasses, wearing a black top hat, a purple suit and carrying a walking cane', None),
    'ludo': ('17-ludo-taupin', 'Ludo Taupin, le jumeau au sac à dos', 'a stocky burglar with light tan skin and curly black hair, wearing an orange knitted beanie, sunglasses, a grey hoodie, black trousers and a BACKPACK', None),
    'lino': ('18-lino-taupin', 'Lino Taupin, le jumeau sans sac', 'the identical twin of the burglar (same stocky body, light tan skin, curly black hair, orange knitted beanie, sunglasses, grey hoodie, black trousers) but with NO backpack', 'ludo'),
    'zita': ('19-zita-pistache', 'Zita Pistache, la sœur du bijoutier', 'a plump elderly woman with dark brown skin and grey hair in a bun, no hat, wearing a yellow checked coat and a green skirt, and carrying a handbag', None),
    'berenice': ('20-berenice-fard', 'Bérénice Fard, la diva', 'a slim diva with fair skin and long black hair, wearing a long red dress, with a bouquet of flowers', None),
    'gontran': ('21-gontran-lameche', 'Gontran Lamèche, le doyen', 'a stocky elderly actor with very fair skin, short grey hair and a grey moustache, wearing a black top hat, a RED suit jacket and ORANGE trousers, and carrying a closed black umbrella', None),
    'infirmier': ('22-le-faux-infirmier', 'Le faux infirmier', 'the same stocky elderly man disguised as a nurse (same black top hat, same ORANGE trousers, same closed black umbrella, short grey hair) but wearing a long white nurse coat instead of the red jacket and a white surgical mask over his nose and mouth', 'gontran'),
    'petronille': ('23-petronille-doublure', 'Pétronille Doublure, la doublure', 'a slim actress with light tan skin and long ginger-red hair, wearing a black top hat, a long green coat and ORANGE trousers, and leaning on a walking cane', None),
    'hector': ('24-hector-plumeau', 'Hector Plumeau, le jeune premier', 'a young actor of average build with brown skin and curly brown hair, wearing a black bowler hat, a blue suit jacket and ORANGE trousers, and carrying a closed black umbrella', None),
    'cargo': ('25-fortune-cargo', 'Fortuné Cargo, l\'armateur', 'a stocky elderly shipowner with very fair skin, short grey hair and a grey moustache, wearing a black top hat, a red suit jacket and BLACK trousers, and carrying a closed black umbrella', None),
}

# description autonome pour les sections (la fiche personnage, elle, se réfère au modèle joint)
IN_SCENE = {
    'infirmier': 'a stocky elderly man disguised as a nurse: black top hat, short grey hair, a long white nurse coat, ORANGE trousers, a closed black umbrella, and a white surgical mask over his nose and mouth',
    'lapince-paille': 'the escaped convict in disguise: a slim man with fair skin and spiky blond hair, wearing a straw hat, a white pyjama shirt with blue STRIPES (not checks) and grey trousers',
}
FEM = {'rose', 'baronne', 'lola', 'zita', 'berenice', 'petronille'}
CH_STYLE = ('Same art style, proportions, outlines and soft painted shading as the attached character sheet. ')
CH_END = (' Draw this ONE character twice on the same image, side by side, same scale: once in three-quarter front view and once in three-quarter back view, '
          'standing, full body, natural colours. Plain white background, generous empty space, no ground shadow, no text.')

# --- Carte ----------------------------------------------------------------------------------------------------
FRAME = ('Same art style, colours, lighting and camera angle as the attached reference diorama (image 1): one square piece of a lush, cozy French small town '
         'standing on a thick earth slab, isometric view from a high three-quarter angle. The slab must fill the image exactly like in the reference: same size, '
         'same position, its four corners at the top, left, right and bottom of the image, soft plain light background around it. '
         'This image is ONE TILE of a larger city map that will be assembled with its neighbours, so follow the edges described below precisely.')
EDGE = {
    ('S', 'rue'): 'a street (asphalt roadway, with a stone pavement on the inner side) runs along the whole lower-left edge',
    ('E', 'rue'): 'a second street of the same width runs along the whole lower-right edge; the two streets meet at the bottom corner',
    ('E', 'rue1'): 'a street (asphalt roadway, with a stone pavement on the inner side) runs along the whole lower-right edge',
    ('N', 'bord'): 'the upper-right edge is a clean straight cut along the backs of the buildings, garden walls and trees (no street there)',
    ('W', 'bord'): 'the upper-left edge is a clean straight cut along the sides of the buildings, garden walls and trees (no street there)',
    ('N', 'ext'): 'the upper-right edge is the end of the town: a hedge, a strip of hay field and a few haystacks',
    ('W', 'ext'): 'the upper-left edge is the end of the town: a hedge, a strip of hay field and a few haystacks',
    ('E', 'ext'): 'the lower-right edge is the end of the town: a hedge, a strip of hay field and a few haystacks (no street there)',
    ('S', 'ext'): 'the lower-left edge is the end of the town: a hedge, a strip of hay field and a few haystacks (no street there)',
    ('N', 'parc'): 'across the upper-right edge the park lawns and paths simply continue (no fence, no street)',
    ('W', 'parc'): 'across the upper-left edge the park lawns and paths simply continue (no fence, no street)',
    ('E', 'parc'): 'across the lower-right edge the park lawns and paths simply continue (no fence, no street)',
    ('S', 'parc'): 'across the lower-left edge the park lawns and paths simply continue (no fence, no street)',
    ('W', 'grille'): 'along the upper-left edge runs the park\'s wrought-iron railing with a gate and a row of trees',
    ('N', 'rails'): 'the railway tracks continue straight across the upper-right edge',
    ('S', 'rails'): 'the railway tracks continue straight across the lower-left edge (no street there)',
    ('N', 'quai'): 'the upper-right edge is a clean straight cut along a riverside promenade with a row of plane trees',
    ('W', 'riv'): 'the river and both banks continue straight across the upper-left edge',
    ('E', 'riv'): 'the river and both banks continue straight across the lower-right edge (no street there)',
    ('E', 'pont'): None,  # décrit dans la scène
    ('W', 'rivext'): 'on the upper-left edge the river arrives from the countryside between hay fields',
    ('E', 'rivext'): 'on the lower-right edge the river leaves the town between hay fields (no street there)',
}
RIVER = ('The river La Fenaison, about one third of the tile wide, flows straight across the middle of the tile from the upper-left edge to the lower-right edge. '
         'The north bank is the upper-right third of the tile, the south bank is the lower-left third. ')
CROWD_RULE = ('All the other townspeople must look clearly different from the story characters listed above (different hats, hair, clothes and colours) '
              'so that nobody can be mistaken for them.')
END = ('Every story character must be fully visible (never hidden behind a tree, a building or another person), drawn at the same size as the other '
       'townspeople, and appear only as many times as listed. No frame, no caption, no user interface, no logo.')

S = []  # sections


def sec(id, slug, title, cases, scene, edges, cast=(), extras=(), crowd='', texts=(), rules='', checks=(), river=False):
    S.append(dict(id=id, slug=slug, title=title, cases=cases, scene=scene, edges=edges, cast=list(cast), extras=list(extras),
                  crowd=crowd, texts=list(texts), rules=rules, checks=list(checks), river=river))


STD = dict(N='bord', W='bord', S='rue', E='rue')

# Rangée 1 (nord)
sec('1A', 'depot-ferroviaire', 'Dépôt ferroviaire', 'Décor (pas d\'enquête).',
    'A small railway depot: three railway tracks cross the tile from the upper-right edge to the lower-left edge, a brick locomotive shed, a steam locomotive, two goods wagons, a water tower, a signal box, piles of coal.',
    dict(N='ext', W='ext', S='rails', E='rue1'), crowd='About 10 railway workers in blue overalls and caps at work.')
sec('1B', 'rue-des-lilas', 'Rue des Lilas', 'Décor (pas d\'enquête).',
    'A quiet residential street: a row of ivy-covered town houses with small front gardens, lilac bushes, a corner grocery with crates of vegetables, washing lines, a cat on a wall.',
    dict(N='ext', W='bord', S='rue', E='rue'), crowd='About 15 townspeople: neighbours chatting, children playing hopscotch, a postman, a woman watering flowers.')
sec('1C', 'les-halles', 'Les Halles : boulangerie, boucherie, marché', '« La Main dans le sac » (étapes 1 et 2), aiguille n° 3.',
    'Market day. At the back, side by side and facing the square: the bakery (pink-and-white striped awning, bread in the window, sign reading "BOULANGERIE LEMIEL") and the butcher\'s shop (red-and-white tiled front, red awning, sign reading "BOUCHERIE TENDRON"). In front of them, a cobbled market square crowded with about eight stalls with striped awnings (fruit, vegetables, cheese, flowers, fish).',
    STD,
    cast=[('rose', 'standing in front of her bakery, furious, pointing towards the market with one arm fully stretched, an angry red comic symbol above her head'),
          ('picotin', 'standing right next to the baker, holding a baguette in one hand, looking at it lovingly, a small red heart bubble above his head'),
          ('lafouine', 'running through the middle of the market towards the lower-right edge, holding a cloth money bag in one hand'),
          ('motus', 'standing among the stalls not far from the thief, frozen with both hands raised and flat as if pressed against an invisible box, empty hands')],
    extras=['a tiny shiny golden sewing needle stuck in the wooden frame of the butcher\'s door (very small, a little golden stroke with a sparkle)'],
    crowd='About 25 shoppers and stallholders with baskets, in everyday clothes.',
    texts=['BOULANGERIE LEMIEL', 'BOUCHERIE TENDRON'],
    rules='Nobody else wears a beanie, a mask or a striped sweater.',
    checks=['Le voleur a un masque ET un sac d\'argent ; le mime est identique mais SANS masque et les mains vides.', 'Personne d\'autre en bonnet, masque ou pull rayé.',
            'Rose pointe du doigt, Picotin tient une baguette.', 'L\'aiguille dorée est visible sur la porte de la boucherie.'])
sec('1D', 'cinema-le-rex', 'Cinéma Le Rex', '« La Main dans le sac » (étapes 3 et 4).',
    'At the back, an art deco cinema with a rounded corner tower and a vertical sign reading "LE REX", a canopy edged with light bulbs, a ticket window, and two identical film posters reading "LE CASSE DU SIÈCLE". A wide pavement in front. On the left part of the pavement, near the street corner, a green public litter bin with a cloth money bag sticking out of it.',
    STD,
    cast=[('lafouine', 'FIRST TIME: walking calmly on the pavement between the litter bin and the cinema, hands empty, whistling'),
          ('lafouine', 'SECOND TIME (the same thief shown again, later in the story): standing in the queue at the ticket window, third in line, holding a cinema ticket, with a small music-notes bubble above his head')],
    extras=['the queue at the ticket window, four people in a row facing the cinema: first a slim woman with dark brown skin, long black hair and glasses, in a yellow polka-dot dress with a handbag, holding a ticket; second a stocky bald man with a grey moustache, a black bowler hat, a brown coat, beige trousers and an umbrella, reading a newspaper; third the thief (see above); fourth a little girl with a red ponytail, a cap, a green hoodie, blue shorts and a backpack, eating an ice cream cone'],
    crowd='About 15 other townspeople walking by or looking at the posters.',
    texts=['LE REX', 'LE CASSE DU SIÈCLE'],
    rules='Nobody else wears a beanie, a mask or a striped sweater. Only one litter bin has a money bag in it.',
    checks=['Le voleur apparaît 2 fois : marchant les mains vides, puis dans la file avec un ticket.', 'Le sac d\'argent dépasse d\'une poubelle verte.',
            'La file compte 4 personnes dans l\'ordre : dame en robe jaune, monsieur au chapeau melon, voleur, fillette à la glace.'])
sec('1E', 'parc-statue-du-fondateur', 'Parc des Meules : Statue du Fondateur', 'Aiguille n° 2.',
    'The north-west corner of a large park: lawns, winding gravel paths, big leafy trees, flower beds, benches, a few decorative haystacks. In the middle, on a stone pedestal, the bronze statue of the town founder, a 19th-century gentleman in a frock coat with one hand raised high.',
    dict(N='ext', W='grille', S='parc', E='parc'),
    extras=['the statue\'s raised hand holds a tiny shiny golden sewing needle (a little golden stroke with a sparkle)'],
    crowd='About 15 people strolling, picnicking, reading on benches, a painter at an easel, a few dogs.',
    checks=['La statue lève une main qui tient une petite aiguille dorée.', 'Pas de rue : la pelouse continue en bas à gauche et en bas à droite.'])
sec('1F', 'etang-aux-canards', 'Parc des Meules : Étang aux Canards', '« Coin-coin ! » (étapes 1 et 5).',
    'A big duck pond fills the upper two thirds of the tile, with reeds and water lilies. A wooden jetty reaches into the water from the lower-left shore. In the middle of the pond, a small green rowing boat with the name "LE BARON" painted on its side.',
    dict(N='ext', W='parc', S='parc', E='ext'),
    cast=[('barbarie', 'FIRST TIME: crouching at the water\'s edge on the lower shore, to the right of the jetty, holding out a baguette to lure a golden duck that is coming out of the water towards him'),
          ('barbarie', 'SECOND TIME (the same man shown again, later in the story): standing in the green rowing boat in the middle of the pond with both hands raised, a blue sweat drop above his head, surrounded by four angry ordinary mallard ducks swimming around the boat'),
          ('baronne', 'standing on the lower shore at the foot of the jetty, both hands raised in despair, a blue sweat drop above her head'),
          ('picotin', 'standing right next to the baroness, reading his little notebook'),
          ('lulu', 'standing on the lower shore further to the right, pointing at the crouching man, a piece of baguette in the other hand, with two ordinary mallard ducks at his feet')],
    extras=['exactly ONE golden duck (a female duck with entirely shiny golden feathers) in this tile: the one walking out of the water towards the crouching man'],
    crowd='About 10 other people around the pond: anglers, a couple on a bench, a jogger.',
    texts=['LE BARON'],
    rules='Nobody else wears a fedora or a green coat. All the other ducks are ordinary brown and green mallards.',
    checks=['Barbarie apparaît 2 fois : accroupi avec une baguette devant la cane dorée, puis debout mains en l\'air dans la barque « LE BARON ».', 'Une seule cane dorée.',
            'La baronne et Picotin sont au pied du ponton.', 'Lulu pointe du doigt, deux canards ordinaires à ses pieds.'])

# Rangée 2
sec('2A', 'gare', 'Gare de Meulebourg et Grand Hôtel', '« La Belle Évasion » (étapes 1 et 2), aiguille n° 1.',
    'Along the upper-right side, the long, low stone railway station with a central clock tower, tall arched windows and a sign reading "GARE DE MEULEBOURG"; behind it, platforms and railway tracks with a train. In front of the station, a wide paved forecourt. On the right side of the forecourt, an elegant four-storey Belle Époque hotel with a red canopy and a sign reading "GRAND HÔTEL". On the forecourt near the hotel, a navy blue police van marked "POLICE", its rear doors wide open and empty inside.',
    dict(N='rails', W='ext', S='rue', E='rue'),
    cast=[('lola', 'lying flat on her back on the forecourt next to the police van, pretending to have fainted, one hand on her forehead, a small dizzy-stars bubble above her head'),
          ('picotin', 'crouching beside the fainted woman, worried, a blue sweat drop above his head, his back turned to the van')],
    extras=['the station clock has THREE hands: the third one is a tiny shiny golden sewing needle'],
    crowd='About 25 travellers with suitcases, porters with trolleys, a taxi, a newspaper seller.',
    texts=['GARE DE MEULEBOURG', 'GRAND HÔTEL', 'POLICE'],
    rules='Nobody else wears a beret or a pink dress. Nobody in striped pyjamas in this tile.',
    checks=['Fourgon « POLICE » bleu marine, portes arrière ouvertes et vide.', 'Lola allongée à côté du fourgon, Picotin accroupi près d\'elle.', 'L\'horloge de la gare a une troisième aiguille dorée.'])
sec('2B', 'square-de-la-rue-neuve', 'Square de la rue Neuve, La Poste, Pharmacie', '« La Tarte de bienvenue » (toute l\'enquête).',
    'At the back, the post office (yellow letter box, clock, sign reading "LA POSTE") and a pharmacy (green cross, sign reading "PHARMACIE"). In front, a small public garden: lawn, three trees, a gravel path, a green wooden bench on the left side, a flower bed.',
    STD,
    cast=[('picotin', 'standing at the right-hand entrance of the garden, waving hello with one raised hand'),
          ('timothee', 'FIRST TIME: walking into the garden near the policeman, carrying a strawberry tart on a plate with both hands'),
          ('timothee', 'SECOND TIME (the same delivery boy shown again, later in the story): fast asleep on the green bench, empty hands, a "Zzz" bubble above his head')],
    extras=['a strawberry tart on a plate lying in the grass a few steps in front of the bench', 'a small white dog standing right in front of the tart, looking innocent', 'a group of three pigeons on the grass a little further away'],
    crowd='About 15 townspeople: people posting letters, a pharmacist at her door, a mother with a pram, an old man feeding nobody.',
    texts=['LA POSTE', 'PHARMACIE'],
    rules='Nobody else wears an apron or a red cap. Only one white dog, only one tart on the ground.',
    checks=['Le livreur apparaît 2 fois : portant la tarte, puis endormi sur le banc vert (Zzz), les mains vides.', 'La tarte est dans l\'herbe, le chien blanc juste devant, les pigeons plus loin.', 'Picotin fait signe de la main.'])
sec('2C', 'hotel-de-ville-grand-place', 'Hôtel de Ville et Grand-Place (fontaine)', '« La Grande Paille » (étapes 2, 3 et 6).',
    'At the back, the grand symmetric stone town hall with a central belfry and clock, French flags and a sign reading "HÔTEL DE VILLE". In front, a large cobbled square with a round stone fountain in its centre, lamp posts, benches and a few pigeons. A sparkling diamond lies in the water of the fountain basin.',
    STD,
    cast=[('ludo', 'FIRST TIME: running across the lower part of the square towards the fountain, coming from the lower-left edge'),
          ('ludo', 'SECOND TIME (the same burglar shown again, later in the story): standing next to the fountain, pointing angrily at the diamond in the water, an angry red comic symbol above his head'),
          ('zita', 'standing in front of the town hall steps, waving with one hand, empty hands'),
          ('picotin', 'standing next to the woman in the yellow coat, happily holding a strawberry tart on a plate, a small red heart bubble above his head')],
    crowd='About 20 townspeople crossing the square, sitting on benches, a wedding party on the town hall steps.',
    texts=['HÔTEL DE VILLE'],
    rules='Nobody else wears a beanie, sunglasses, a grey hoodie or a backpack. Nobody else carries a tart.',
    checks=['Ludo (avec sac à dos) apparaît 2 fois : en train de courir, puis près de la fontaine, furieux, pointant le diamant.', 'Un diamant brille dans la fontaine.',
            'Zita (manteau jaune à carreaux) salue, Picotin tient la tarte.'])
sec('2D', 'cafe-du-centre-eglise', 'Café du Centre, Église Saint-Foin, Fleuriste Pétale', '« La Grande Paille » (étapes 4 et 5).',
    'At the back right, the Romanesque stone church with a tall bell tower and a rose window. At the back left, a corner café with a dark red awning, a sign reading "CAFÉ DU CENTRE" and a terrace of small round tables and wicker chairs. Between them, a florist\'s shop with a pastel pink front covered in flowers and a sign reading "FLEURISTE PÉTALE". A small cobbled square in front.',
    STD,
    cast=[('octave', 'FIRST TIME: tiptoeing sneakily across the lower part of the square, coming from the lower-left edge, holding a strawberry tart on a plate up in front of his face to hide'),
          ('octave', 'SECOND TIME (the same jeweller shown again, later in the story): standing at the café terrace, empty hands, pointing discreetly towards the upper-left'),
          ('zita', 'standing at the café terrace right next to the jeweller, carrying the strawberry tart on a plate with both hands')],
    crowd='About 20 townspeople: customers at the terrace, a waiter, a florist, people leaving the church, a choir boy.',
    texts=['CAFÉ DU CENTRE', 'FLEURISTE PÉTALE'],
    rules='Nobody else wears a top hat or a purple suit. Nobody else carries a tart or a cake.',
    checks=['Octave (haut-de-forme, costume violet, canne) apparaît 2 fois : furtif avec la tarte devant le visage, puis à la terrasse sans tarte.', 'Zita porte la tarte à la terrasse du café.'])
sec('2E', 'kiosque-a-musique', 'Parc des Meules : Kiosque à musique', '« Coin-coin ! » (étape 4).',
    'A park clearing with a white wrought-iron octagonal bandstand with a green roof. In front of it, the duck beauty contest: a wooden signpost reading "CONCOURS DE CANES", a long table with velvet cushions and rosettes, bunting between the trees, rows of garden chairs, lawns and gravel paths.',
    dict(N='parc', W='grille', S='rue', E='parc'),
    extras=['the contest president standing by the table: a slim elderly man with dark brown skin, short white hair and glasses, a black bowler hat, a navy striped suit, a newspaper under his arm, pointing at the golden duck, a "!" bubble above his head',
            'a female duck with entirely shiny golden feathers sitting proudly on a cushion on the table, and next to her one ordinary mallard duck on another cushion',
            'a jealous contestant standing on the other side: a woman with fair skin and curly grey hair, a beret, a red sweater, a brown skirt and a walking cane, an angry red comic symbol above her head',
            'the SAME golden duck shown a second time (earlier in the story): waddling alone along a gravel path, arriving from the lower-right edge'],
    crowd='About 20 spectators, some holding ordinary ducks in their arms or in baskets, a small brass band in the bandstand.',
    texts=['CONCOURS DE CANES'],
    rules='Exactly two golden ducks are visible (the same duck at two moments); every other duck is an ordinary brown and green mallard.',
    checks=['Panneau « CONCOURS DE CANES ».', 'La cane dorée est sur un coussin à côté d\'un canard ordinaire ; une deuxième fois, elle marche seule sur l\'allée.', 'Le président pointe la cane, la concurrente est furieuse.'])
sec('2F', 'aire-de-jeux', 'Parc des Meules : allée et aire de jeux', '« Coin-coin ! » (étapes 2 et 3), aiguille n° 6.',
    'The south-east corner of the park: lawns, a wide gravel path, trees. On the right, a children\'s playground with a slide, swings, a seesaw and a sandpit. Parked on the street along the lower-left edge, a white delivery van with the words "VOLAILLES BARBARIE" on its side, its rear doors open and empty inside.',
    dict(N='parc', W='parc', S='rue', E='ext'),
    cast=[('barbarie', 'walking along the gravel path towards the van, carrying a closed cardboard box with air holes in both arms'),
          ('bigarade', 'walking along the path in the opposite direction, carrying a similar cardboard box in both arms, whistling, a small music-notes bubble above his head'),
          ('lulu', 'standing next to the open rear doors of the van, waving happily, a small red heart bubble above his head')],
    extras=['a female duck with entirely shiny golden feathers standing on the ground next to the child, just out of the van (the only golden duck in this tile)',
            'a tiny shiny golden sewing needle sticking out of the sand in the sandpit (a little golden stroke with a sparkle)'],
    crowd='About 15 children playing and parents on benches.',
    texts=['VOLAILLES BARBARIE'],
    rules='Nobody else wears a fedora, a green coat or a chef\'s toque. Nobody else carries a cardboard box.',
    checks=['Camionnette blanche « VOLAILLES BARBARIE », portes arrière ouvertes.', 'Barbarie ET le chef Bigarade portent chacun un carton, dans des sens opposés.', 'Lulu et la cane dorée à côté de la camionnette.', 'Aiguille dorée dans le bac à sable.'])

# Rangée 3
sec('3A', 'bar-le-fer-a-cheval', 'Bar Le Fer à Cheval', '« La Belle Évasion » (étape 3).',
    'A working-class street near the station. At the back, a small old bar with a dark green wooden front, a big golden horseshoe above the door, a green awning, a sign reading "LE FER À CHEVAL" and a terrace with a few tables. Next to it, a row of narrow houses, a bicycle repair shop, a barber.',
    dict(N='bord', W='ext', S='rue', E='rue'),
    cast=[('lapince', 'running at full speed along the pavement in front of the bar, towards the lower-left edge')],
    extras=['a customer standing at the bar terrace, pointing at the running convict, a "!" bubble above his head: a stocky bald man with tan skin and a grey beard, a cap, an orange t-shirt and blue trousers'],
    crowd='About 15 townspeople: customers at the terrace, a barber, a cyclist, children.',
    texts=['LE FER À CHEVAL'],
    rules='Nobody else wears stripes. Nobody else is running.',
    checks=['Lapince (pyjama rayé bleu et blanc, cheveux blonds en épis, sans chapeau) court devant le bar.', 'Un client en t-shirt orange le montre du doigt.', 'Personne d\'autre en rayures.'])
sec('3B', 'commissariat', 'Commissariat', 'Aiguille n° 4.',
    'At the back, the police station: a sturdy two-storey red brick building with blue shutters, a blue lamp over the door, a French flag and a sign reading "COMMISSARIAT". In front, three white-and-blue police cars parked side by side, a notice board, a bicycle rack.',
    STD,
    extras=['a tiny shiny golden sewing needle lying on the ground between two of the police cars (a little golden stroke with a sparkle)'],
    crowd='About 12 people: police officers in navy uniforms and kepis, a lady reporting a lost umbrella, a man with a lost dog.',
    texts=['COMMISSARIAT'],
    rules='No ginger-moustached policeman in Bermuda shorts in this tile.',
    checks=['Trois voitures de police garées, une aiguille dorée au sol entre deux voitures.'])
sec('3C', 'bijouterie-carat', 'Bijouterie Carat et Banque Dufric', '« La Grande Paille » (étape 1).',
    'At the back left, an elegant narrow jewellery shop with a deep purple wooden front, gold trim and a sign reading "BIJOUTERIE CARAT": its display window is smashed, with broken glass on the pavement. At the back right, a neoclassical bank with four columns and a sign reading "BANQUE DUFRIC". In the roadway right in front of the jewellery shop, an open manhole with its round cover pushed aside.',
    STD,
    cast=[('lino', 'climbing out of the open manhole, only his upper body out, both hands on the edge'),
          ('ludo', 'tiptoeing away from the manhole towards the right, bent forward, holding a sparkling diamond in one hand'),
          ('octave', 'standing in front of his smashed window, talking on a telephone held to his ear, a blue sweat drop above his head'),
          ('picotin', 'standing next to the jeweller, reading his little notebook')],
    crowd='About 12 onlookers and passers-by, a bank guard at the bank door.',
    texts=['BIJOUTERIE CARAT', 'BANQUE DUFRIC'],
    rules='The two burglars are identical twins: the ONLY difference is the backpack. Nobody else wears a beanie, sunglasses or a top hat.',
    checks=['Vitrine de la bijouterie cassée, plaque d\'égout ouverte devant.', 'Lino (SANS sac à dos) sort de l\'égout ; Ludo (AVEC sac à dos) s\'éloigne avec le diamant.', 'Octave téléphone, Picotin lit son carnet.'])
sec('3D', 'librairie-le-marque-page', 'Librairie Le Marque-Page', '« La Grande Paille » (étape 2, fausse piste).',
    'A shopping street of the old town: at the back, a bookshop with a dark green wooden front, windows full of books, trestles of second-hand books outside and a sign reading "LE MARQUE-PAGE"; next to it a hat shop, a toy shop and a tea room, with flats above.',
    STD,
    cast=[('lino', 'running along the pavement towards the lower-left edge, empty hands')],
    crowd='About 18 townspeople window-shopping, browsing the book trestles, a street musician with an accordion.',
    texts=['LE MARQUE-PAGE'],
    rules='Nobody else wears a beanie, sunglasses, a grey hoodie or a backpack. Nobody else is running.',
    checks=['Lino court SANS sac à dos.', 'Personne d\'autre en bonnet ou en sweat gris.'])
sec('3E', 'musee-des-beaux-arts', 'Musée des Beaux-Arts', '« Rideau ! » (étape 4).',
    'At the back, the fine arts museum: a grand classical building with a dome, a colonnade, wide steps and a sign reading "MUSÉE DES BEAUX-ARTS". In front, a forecourt with two statues, clipped hedges and benches.',
    STD,
    cast=[('hector', 'standing at the foot of the museum steps, looking dreamy, a small red heart bubble above his head')],
    extras=['an admirer standing right next to the young actor, gazing at him, a small red heart bubble above her head: a slim woman with very fair skin and a blond ponytail, sunglasses, a straw hat, a yellow polka-dot dress and a handbag'],
    crowd='About 15 visitors: art students sketching, tourists with cameras, a museum guard, a school group.',
    texts=['MUSÉE DES BEAUX-ARTS'],
    rules='Nobody else wears orange trousers, a bowler hat or a top hat. Nobody else carries an umbrella.',
    checks=['Hector : chapeau melon, costume bleu, pantalon ORANGE, parapluie.', 'L\'admiratrice en robe jaune à pois est à côté de lui.', 'Personne d\'autre en pantalon orange.'])
sec('3F', 'theatre-de-la-botte', 'Théâtre de la Botte', '« Rideau ! » (étapes 1, 5 et 6).',
    'At the back, an ornate Italian-style theatre with arched entrances, red and gold decoration, sculpted comedy and tragedy masks, a sign reading "THÉÂTRE DE LA BOTTE" and two posters reading "LES MOISSONNEURS". In front, a paved forecourt with lamp posts. It is the interval: elegant spectators have come out.',
    dict(N='bord', W='bord', S='rue', E='ext'),
    cast=[('berenice', 'collapsed on her back in the middle of the forecourt, eyes closed, still holding a small glass bottle in one hand, her bouquet fallen beside her, a small dizzy-stars bubble above her head'),
          ('picotin', 'crouching beside the collapsed diva, worried, a blue sweat drop above his head'),
          ('gontran', 'standing a few steps away from the diva, calmly reading an open newspaper, not looking at her, his closed umbrella hooked on his arm')],
    crowd='About 20 spectators in evening dress, shocked, whispering in small groups, an usher.',
    texts=['THÉÂTRE DE LA BOTTE', 'LES MOISSONNEURS'],
    rules='Nobody else wears a top hat, orange trousers or a red jacket. Nobody else carries an umbrella or reads a newspaper.',
    checks=['Bérénice (robe rouge) effondrée, une bouteille à la main.', 'Picotin accroupi près d\'elle.', 'Gontran : haut-de-forme, veste ROUGE, pantalon ORANGE, parapluie, lit son journal.', 'Personne d\'autre en haut-de-forme ou en pantalon orange.'])

# Rangée 4 (faubourg)
sec('4A', 'garage-pistons', 'Garage Pistons', '« La Belle Évasion » (étape 3).',
    'At the back, a 1950s car repair garage with two large open doors showing a car on a lift, an old petrol pump in front, stacks of tyres, oil drums and a sign reading "GARAGE PISTONS". Next to it, a scrap yard with a fence and a few small workshops.',
    dict(N='bord', W='ext', S='rue', E='rue'),
    cast=[('lapince', 'tiptoeing sneakily past the stacks of tyres, bent forward, looking around, heading towards the lower-left edge')],
    crowd='About 8 people: mechanics in overalls working on cars, a customer, a boy with a bicycle.',
    texts=['GARAGE PISTONS'],
    rules='Nobody else wears stripes.',
    checks=['Lapince (pyjama rayé, cheveux en épis) se faufile près des pneus.', 'Personne d\'autre en rayures.'])
sec('4B', 'ecole-jules-botte', 'École Jules-Botte et sa cour', 'Aiguille n° 5.',
    'At the back, a primary school: a long two-storey building with tall windows, a small bell turret and a sign reading "ÉCOLE JULES-BOTTE". In front, the school yard enclosed by a low wall with a gate: two plane trees, a hopscotch grid chalked on the ground with the numbers 1 to 8, a covered playground.',
    STD,
    extras=['a tiny shiny golden sewing needle lying on square number 1 of the hopscotch grid (a little golden stroke with a sparkle)'],
    crowd='About 20 children playing (skipping rope, marbles, football) and two teachers.',
    texts=['ÉCOLE JULES-BOTTE'],
    checks=['Marelle dessinée dans la cour, aiguille dorée sur la case 1.'])
sec('4C', 'le-faubourg', 'Le Faubourg', 'Décor (pas d\'enquête).',
    'A modest suburb: small workers\' houses with vegetable gardens, a public washhouse, a carpenter\'s workshop with planks outside, a corner bistro, a coal merchant\'s cart, washing lines between the houses.',
    STD, crowd='About 15 townspeople: craftsmen at work, women at the washhouse, children with a dog, a knife grinder.')
sec('4D', 'chantier-de-la-tour', 'Chantier de la Tour', 'Décor (pas d\'enquête).',
    'A construction site surrounded by a wooden fence: a half-built stone tower wrapped in scaffolding, a tall yellow tower crane, piles of bricks and sand, a cement mixer, a site hut, a sign reading "CHANTIER DE LA TOUR".',
    STD, crowd='About 12 construction workers in helmets, a foreman with plans, two curious passers-by at the fence.', texts=['CHANTIER DE LA TOUR'])
sec('4E', 'cimetiere', 'Cimetière', '« Rideau ! » (étape 3), aiguille n° 7.',
    'An old walled cemetery: mossy tombstones in rows, stone crosses, a small chapel tomb, cypress trees, gravel alleys, a wrought-iron gate on the lower-left side, and in the middle a tall stone angel statue on a pedestal.',
    STD,
    cast=[('petronille', 'standing between two tombstones, leaning on her cane with one hand and holding an open script in the other, reciting theatrically, a small music-notes bubble above her head')],
    extras=['a tiny shiny golden sewing needle held in the hand of the stone angel statue (a little golden stroke with a sparkle)'],
    crowd='Only about 5 other people: a gardener with a wheelbarrow, an old lady with flowers, a gravedigger.',
    rules='Nobody else wears a top hat or orange trousers.',
    checks=['Pétronille : haut-de-forme, long manteau VERT, pantalon ORANGE, canne.', 'L\'ange de pierre tient une aiguille dorée.'])
sec('4F', 'hopital-sainte-paille', 'Hôpital Sainte-Paille', '« Rideau ! » (étape 2).',
    'At the back, a long white three-storey hospital with a red cross, an ambulance canopy over the entrance and a sign reading "HÔPITAL SAINTE-PAILLE". In front, a forecourt with benches, a white ambulance, a small garden.',
    dict(N='bord', W='bord', S='rue', E='ext'),
    cast=[('infirmier', 'tiptoeing sneakily away from the hospital entrance, bent forward, holding a small glass bottle in one hand')],
    extras=['a puzzled woman doctor standing at the entrance, watching him leave, a "?" bubble above her head: dark brown skin, black hair in a bun, glasses, a white coat, white trousers and a briefcase'],
    crowd='About 12 people: real nurses in white uniforms and caps (no hats, no masks), patients in wheelchairs, visitors with flowers, ambulance men.',
    texts=['HÔPITAL SAINTE-PAILLE'],
    rules='Nobody else wears a top hat, orange trousers or a face mask. Nobody else carries an umbrella.',
    checks=['Le faux infirmier : blouse blanche, masque, mais HAUT-DE-FORME, PARAPLUIE et pantalon ORANGE ; il tient un flacon.', 'La médecin le regarde, perplexe.', 'Aucun autre masque ni haut-de-forme.'])

# Rangée 5 (la Fenaison)
sec('5A', 'quai-nord', 'La Fenaison : Quai Nord', '« La Belle Évasion » (étapes 3 et 4).',
    'North bank: a stone quay with iron mooring bollards, coils of rope, fishing nets drying, a few moored barges. South bank: a grassy bank with a stone retaining wall and an iron ladder going down to the water. On the river near the south bank, a small red motor boat with the name "LA COCOTTE" painted on its side.',
    dict(N='quai', W='rivext', S='rue', E='riv'), river=True,
    cast=[('marin', 'standing on the north quay, holding a coil of rope in his hands'),
          ('lola', 'standing at the helm of the red motor boat, waving with one hand'),
          ('lapince', 'climbing up the iron ladder from the red boat onto the south bank, both hands on the rungs')],
    crowd='About 8 other people: bargemen, an angler, a washerwoman.',
    texts=['LA COCOTTE'],
    rules='Nobody else wears stripes or a beanie.',
    checks=['Le marin (bonnet orange, rayures) est sur le quai nord avec une corde.', 'Bateau rouge « LA COCOTTE », Lola à la barre.', 'Lapince (sans bonnet) grimpe sur la rive sud.'])
sec('5B', 'pont-central', 'La Fenaison : Pont Central', '« La Belle Évasion » (fausse piste), aiguille n° 8.',
    'An old stone road bridge with three arches and stone parapets crosses the river along the lower-right edge of the tile, linking the north bank to the south bank; lamp posts on the bridge. A police barrier stands at the south end of the bridge. Riverside promenades on both banks, a moored barge.',
    dict(N='quai', W='riv', S='rue', E='pont'), river=True,
    extras=['two police officers standing guard at the barrier at the south end of the bridge: a policeman with dark brown skin and short black hair, and a policewoman with very fair skin, a brown ponytail and sunglasses, both in navy uniforms and kepis',
            'a tiny shiny golden sewing needle stuck upright on the stone parapet near the north end of the bridge (a little golden stroke with a sparkle)'],
    crowd='About 10 other people: walkers on the promenades, an angler, a painter.',
    rules='Nobody in stripes in this tile.',
    checks=['Le pont longe le bord en bas à droite.', 'Deux agents (un homme, une femme à lunettes noires) gardent l\'entrée sud.', 'Aiguille dorée sur le parapet côté nord.'])
sec('5C', 'la-guinguette', 'La Fenaison : la Guinguette', 'Décor (pas d\'enquête).',
    'North bank: a riverside open-air café with strings of lanterns, a small dance floor and an accordion player. South bank: a wooden washhouse and weeping willows. On the river: two rowing boats and a slow barge loaded with hay.',
    dict(N='quai', W='riv', S='rue', E='riv'), river=True,
    crowd='About 20 people: couples dancing, customers at tables, rowers, washerwomen, anglers.')
sec('5D', 'pont-du-parc', 'La Fenaison : Pont du Parc', '« Rideau ! » (étape 6).',
    'A graceful footbridge in wood and wrought iron with a gentle arch crosses the river along the lower-right edge of the tile, linking the north bank to the south bank. Riverside promenades with benches and lamp posts, rowing boats for hire at a small landing stage.',
    dict(N='quai', W='riv', S='rue', E='pont'), river=True,
    cast=[('gontran', 'running across the footbridge towards the south bank, holding his closed umbrella, looking back over his shoulder')],
    crowd='About 10 other people: walkers, a boat keeper, an angler.',
    rules='Nobody else wears a top hat, orange trousers or a red jacket.',
    checks=['La passerelle longe le bord en bas à droite.', 'Gontran (haut-de-forme, veste rouge, pantalon orange, parapluie) court dessus vers le sud.'])
sec('5E', 'entree-du-port', 'La Fenaison : entrée du port', 'Décor (pas d\'enquête).',
    'The river widens. North bank: a promenade with a small lighthouse-shaped beacon and a fish stall. South bank: the beginning of the harbour quay with stacked lobster pots, nets, barrels and a small fish auction shed. On the water: three fishing boats.',
    dict(N='quai', W='riv', S='rue', E='riv'), river=True,
    crowd='About 15 people: fishermen unloading fish, a fishmonger, cats waiting, seagulls.')
sec('5F', 'quais-du-port', 'Quais du port', '« Rideau ! » (étape 7).',
    'The harbour. South bank: a wide stone quay with a harbour crane on rails, mooring bollards and stacked goods. Moored along the quay, a white passenger boat with the name "L\'ENTRACTE" painted on its hull, a gangway leading to the quay. Three steps from the gangway, two big wooden crates stand side by side with a narrow gap between them.',
    dict(N='quai', W='riv', S='rue', E='rivext'), river=True,
    cast=[('gontran', 'crouching in the gap between the two big wooden crates as if hiding from the people on the quay, but clearly visible to the viewer, holding his closed umbrella, a blue sweat drop above his head'),
          ('cargo', 'standing on the quay next to the gangway of the white boat, waving with one hand')],
    crowd='About 12 other people: dockers, sailors, passengers with trunks.',
    texts=['L\'ENTRACTE'],
    rules='Exactly two men wear a top hat. The crouching one has ORANGE trousers, the waving one has BLACK trousers. Nobody else wears orange trousers.',
    checks=['Bateau blanc « L\'ENTRACTE » à quai.', 'Gontran (pantalon ORANGE) accroupi entre deux caisses.', 'Fortuné Cargo (pantalon NOIR) salue près de la passerelle.'])

# Rangée 6 (sud)
sec('6A', 'jardins-ouvriers-ouest', 'Jardins ouvriers (ouest)', '« La Belle Évasion » (étapes 5 et 6).',
    'Allotment gardens: a patchwork of small vegetable plots (cabbages, leeks, tomato stakes, pumpkins) separated by narrow dirt paths, a few tool sheds, rain barrels, compost bins, a wheelbarrow.',
    dict(N='bord', W='ext', S='ext', E='rue1'),
    cast=[('epouvantail', 'THREE identical scarecrows of this kind, each standing in a different vegetable plot, far apart from each other'),
          ('epouvantail-nu', 'ONE hatless scarecrow standing in another plot'),
          ('lapince-paille', 'standing perfectly still in a cabbage plot with his arms stretched out, pretending to be a scarecrow, his feet on the ground (no pole), a blue sweat drop on his forehead, with three pigeons pecking at his feet')],
    crowd='Only about 6 gardeners at work, in overalls and caps (no straw hats).',
    rules='Exactly five figures have their arms stretched out: three scarecrows with a straw hat and a CHECKED shirt, one scarecrow without a hat and with a CHECKED shirt, and the convict with a straw hat and a STRIPED shirt. Nobody else wears a straw hat, stripes or checks.',
    checks=['3 épouvantails avec chapeau de paille et chemise à CARREAUX.', '1 épouvantail SANS chapeau (chemise à carreaux).', 'Lapince : chapeau de paille mais chemise à RAYURES, goutte de sueur, pigeons à ses pieds.', 'Aucun autre chapeau de paille.'])
sec('6B', 'jardins-ouvriers-est', 'Jardins ouvriers (est)', 'Aiguille n° 9.',
    'More allotment gardens: vegetable plots, fruit trees, bean poles, beehives, sheds. Two dirt paths cross near the lower corner; at this crossing stands a small glass greenhouse with white frames. Watering cans here and there.',
    dict(N='bord', W='bord', S='ext', E='rue1'),
    extras=['a tiny shiny golden sewing needle planted upright in the soil just in front of the corner greenhouse (a little golden stroke with a sparkle)'],
    crowd='About 8 gardeners at work, a beekeeper, a child chasing a hen.',
    rules='No scarecrow in this tile.',
    checks=['Une serre à l\'angle de deux chemins, une aiguille dorée plantée devant.', 'Pas d\'épouvantail ici.'])
sec('6C', 'champs-de-meules', 'Les champs de meules', 'Décor (pas d\'enquête).',
    'Hay fields at the edge of the town: a dozen big round haystacks, a hay cart pulled by a horse, a farm track, a stone farmhouse with a barn, hens, a pond with geese.',
    dict(N='bord', W='bord', S='ext', E='rue1'),
    crowd='About 10 farm workers making hay with pitchforks (flat caps, no straw hats), a farmer\'s wife feeding hens.')
sec('6D', 'moulin', 'Le Moulin', 'Décor (pas d\'enquête).',
    'A stone windmill on a small mound, a miller\'s house, sacks of flour on a cart, a field of wheat, a few haystacks, a donkey, an orchard.',
    dict(N='bord', W='bord', S='ext', E='rue1'),
    crowd='About 8 people: the miller covered in flour, a baker\'s apprentice loading sacks, children flying a kite.')
sec('6E', 'capitainerie', 'Capitainerie', 'Aiguille n° 10.',
    'At the back, the harbour master\'s office: a small white building with a lookout tower, maritime signal flags, an anchor and life buoys on the wall, a sign reading "CAPITAINERIE". Around it: a boat on a slipway being repainted, coils of rope, a ship chandler\'s shop, a customs shed.',
    dict(N='bord', W='bord', S='ext', E='rue1'),
    extras=['a tiny shiny golden sewing needle stuck in the life buoy hanging next to the office door (a little golden stroke with a sparkle)'],
    crowd='About 12 people: the harbour master with a telescope, sailors, a boat painter, customs officers.',
    texts=['CAPITAINERIE'],
    checks=['Aiguille dorée plantée dans la bouée à côté de la porte de la capitainerie.'])
sec('6F', 'entrepots-du-port', 'Entrepôts du port', 'Décor (pas d\'enquête).',
    'Harbour warehouses: three long brick warehouses with large wooden sliding doors, stacks of crates and barrels, pallets, a hand crane, a horse-drawn delivery cart, cats on the roofs.',
    dict(N='bord', W='bord', S='ext', E='ext'),
    crowd='About 15 dockers carrying sacks and rolling barrels, a warehouse keeper with a ledger.')


def edges_text(s):
    parts = [EDGE[(k, s['edges'][k])] for k in 'SENW' if EDGE.get((k, s['edges'][k]))]
    return 'EDGES OF THE TILE: ' + '; '.join(parts) + '.'


def section_prompt(s):
    names = []  # personnages nommés, dans l'ordre de première apparition
    for k, _ in s['cast']:
        if k not in names:
            names.append(k)
    P = [FRAME, '', 'SCENE: ' + (RIVER if s['river'] else '') + s['scene'], '', edges_text(s)]
    if s['cast']:
        P += ['', 'STORY CHARACTERS (draw each of them exactly as described' + (' and as shown on the attached character sheets' if names else '') + '):']
        seen = set()
        for k, action in s['cast']:
            ref = f' (character sheet: image {names.index(k) + 2})'
            name = CH[k][1].split(',')[0]
            if k in seen:
                P.append(f'- {name} AGAIN{ref}, drawn exactly as above. In this scene: {action}.')
            else:
                P.append(f'- {name}{ref}: {IN_SCENE.get(k, CH[k][2])}. In this scene: {action}.')
            seen.add(k)
    if s['extras']:
        P += ['', 'OTHER STORY ELEMENTS (all must be present and visible):'] + [f'- {e}.' for e in s['extras']]
    if s['crowd']:
        P += ['', 'CROWD: ' + s['crowd'] + (' ' + CROWD_RULE if s['cast'] else '')]
    story = bool(s['cast'] or s['extras'])
    rules = (s['rules'] + ' ' if s['rules'] else '') + (END if s['cast'] else ('Every story element listed above must be clearly visible. ' if story else '') + END.split('listed. ')[1])
    if s['texts']:
        rules += ' The only written words in the image are: ' + ', '.join(f'"{t}"' for t in s['texts']) + ' (spelled exactly); every other sign is blank or a simple pictogram.'
    else:
        rules += ' No written words anywhere: every sign is blank or a simple pictogram.'
    P += ['', 'RULES: ' + rules]
    return '\n'.join(P), names


def write_section(s):
    d = f'{ROOT}/_archive/drive-02-carte/{s["id"]}-{s["slug"]}'
    os.makedirs(d, exist_ok=True)
    prompt, names = section_prompt(s)
    col, row = s['id'][1], int(s['id'][0])
    def nb(dr, dc):
        r, c = row + dr, chr(ord(col) + dc)
        return next((f"{x['id']} {x['title']}" for x in S if x['id'] == f'{r}{c}'), 'bord de la carte')
    L = [f'# {s["id"]} — {s["title"]}', '', f'**Enquêtes** : {s["cases"]}', '',
         f'**Voisins** : en haut à droite (nord) {nb(-1, 0)} · en haut à gauche (ouest) {nb(0, -1)} · '
         f'en bas à gauche (sud) {nb(1, 0)} · en bas à droite (est) {nb(0, 1)}', '',
         '## Pièces jointes, dans cet ordre', '', '1. `00-references/diorama.jpg` (style, angle, cadrage)']
    for i, k in enumerate(names):
        L.append(f'{i + 2}. `01-personnages/{CH[k][0]}/resultat.png` ({CH[k][1]})')
    L += ['', '## Prompt — format **1:1**, résolution la plus haute', '', '```', prompt, '```', '']
    if s['checks']:
        L += ['## À vérifier avant de garder l\'image', ''] + [f'- {c}' for c in s['checks']] + ['']
    L += ['Enregistre l\'image réussie dans ce dossier sous le nom `resultat.png`.', '']
    open(f'{d}/prompt.md', 'w').write('\n'.join(L))


def write_character(k):
    folder, name, desc, parent = CH[k]
    d = f'{OUT}/01-personnages/{folder}'
    os.makedirs(d, exist_ok=True)
    where = sorted({s['id'] for s in S for kk, _ in s['cast'] if kk == k})
    il = 'elle' if k in FEM else 'il'
    L = [f'# {name}', '', f'**Sections de la carte où {il} apparaît** : {", ".join(where) or "aucune"}', '', '## Pièces jointes, dans cet ordre', '',
         '1. `00-references/habitants.jpg` (style des personnages)']
    if parent:
        L += [f'2. `01-personnages/{CH[parent][0]}/resultat.png` (son modèle : à générer d\'abord)', '',
              f'C\'est un **sosie** de « {CH[parent][1]} » : seul le détail décrit doit changer, c\'est ce que le joueur doit repérer.']
        text = CH_STYLE + f'Image 2 shows a character. Draw {desc}. Everything not mentioned stays identical to image 2.' + CH_END
    else:
        text = CH_STYLE + f'A character reference sheet of {desc}.' + CH_END
    L += ['', '## Prompt — format **1:1**', '', '```', text, '```', '',
          f'Enregistre l\'image réussie dans ce dossier sous le nom `resultat.png` : elle sera jointe aux sections de la carte où {il} apparaît.', '']
    open(f'{d}/prompt.md', 'w').write('\n'.join(L))


def plan_md():
    L = ['# Plan de Meulebourg : 36 sections (6 × 6)', '',
         'Colonnes A à F d\'ouest en est, rangées 1 à 6 du nord au sud. En vue isométrique, la section 1A est tout en haut, '
         'les colonnes descendent vers la droite et les rangées vers la gauche.', '',
         '| | A | B | C | D | E | F |', '|---|---|---|---|---|---|---|']
    for r in range(1, 7):
        L.append(f'| **{r}** | ' + ' | '.join(next(s['title'] for s in S if s['id'] == f'{r}{c}') for c in 'ABCDEF') + ' |')
    L += ['', '## Ordre conseillé', '',
          '1. **Essai** : `1C-les-halles` puis `1D-cinema-le-rex` (deux sections voisines = toute l\'enquête « La Main dans le sac »). '
          'Envoie-moi les deux images avant d\'aller plus loin : je vérifie qu\'elles se raccordent.',
          '2. Les sections d\'enquête, dans l\'ordre des enquêtes : 2B · 1F, 2E, 2F · 2A, 3A, 4A, 5A, 6A · 3C, 2C, 2D, 3D · 3F, 4F, 4E, 3E, 5D, 5F.',
          '3. Les sections à aiguille : 1E, 3B, 4B, 5B, 6B, 6E.',
          '4. Le décor : 1A, 1B, 4C, 4D, 5C, 5E, 6C, 6D, 6F.', '',
          '## Règles de raccord (déjà écrites dans chaque prompt)', '',
          '- Chaque section est un carré de ville posé sur une dalle, cadré comme `diorama.jpg`.',
          '- Une rue longe le bord **bas-gauche** et une autre le bord **bas-droit** ; les deux bords du haut sont coupés net '
          '(la rue du voisin passe derrière).',
          '- Dans le parc (1E, 1F, 2E, 2F), la pelouse continue d\'une section à l\'autre, sans rue.',
          '- La Fenaison (rangée 5) traverse chaque section du bord haut-gauche au bord bas-droit ; les deux ponts longent le bord bas-droit.', '']
    open(f'{ROOT}/_archive/drive-02-carte/plan.md', 'w').write('\n'.join(L))


def readme():
    L = ['# Haystack — générations Gemini', '',
         'La carte de Meulebourg est générée **section par section**, personnages, actions et objets des enquêtes compris dans l\'image.', '',
         '## Contenu', '',
         '- `00-references/` : les deux images de style à joindre (`diorama.jpg`, `habitants.jpg`).',
         '- `01-personnages/` : un dossier par personnage d\'enquête (25). Chaque `prompt.md` donne une planche du personnage, de face et de dos. '
         'Elle sert de modèle pour que le personnage soit le même dans toutes les sections.',
         '- `02-carte/` : un dossier par section de la carte (36), plus `plan.md`.', '',
         '## Marche à suivre', '',
         '1. Générer les personnages d\'une enquête (leur `resultat.png` va dans leur dossier). Les sosies se font après leur modèle.',
         '2. Générer les sections où ils apparaissent, en joignant `diorama.jpg` puis leurs `resultat.png`, dans l\'ordre indiqué.',
         '3. Contrôler la liste « À vérifier » de la section, regénérer si un détail d\'enquête est faux.',
         '4. Enregistrer l\'image réussie en `resultat.png` dans le dossier de la section.', '']
    open(f'{OUT}/LISEZ-MOI.md', 'w').write('\n'.join(L))
    os.makedirs(f'{OUT}/00-references', exist_ok=True)
    open(f'{OUT}/00-references/LISEZ-MOI.md', 'w').write('\n'.join([
        '# Références de style', '', 'Dépose ici les deux images, avec exactement ces noms :', '',
        '- `diorama.jpg` : le diorama de ville du style retenu (jointe à chaque section de la carte) ;',
        '- `habitants.jpg` : une planche d\'habitants du style retenu (jointe à chaque personnage).', '']))


def plan_png(path):
    """Schéma isométrique du découpage, pour se repérer."""
    from PIL import Image, ImageDraw, ImageFont
    tw, th = 300, 150; W, H = 6 * tw + 80, 6 * th + 140
    im = Image.new('RGB', (W, H), '#eef3df'); d = ImageDraw.Draw(im)
    try:
        f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15); fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
    except OSError:
        f = fs = ImageFont.load_default()
    kind = lambda s: '#9fd0e6' if s['river'] else '#b9dba0' if s['id'] in ('1E', '1F', '2E', '2F') else '#e8d9a8' if 'Décor' in s['cases'] else '#f6c9a8'
    for s in S:
        r, c = int(s['id'][0]) - 1, 'ABCDEF'.index(s['id'][1])
        cx, cy = W / 2 + (c - r) * tw / 2, 60 + (c + r) * th / 2 + th / 2
        d.polygon([(cx, cy - th / 2), (cx + tw / 2, cy), (cx, cy + th / 2), (cx - tw / 2, cy)], fill=kind(s), outline='#5a6a48')
        d.text((cx, cy - 16), s['id'], fill='#2d3a24', font=f, anchor='mm')
        t = s['title'].replace('Parc des Meules : ', '').replace('La Fenaison : ', '')
        words, lines, cur = t.split(), [], ''
        for w in words:
            if len(cur) + len(w) > 20: lines.append(cur); cur = w
            else: cur = (cur + ' ' + w).strip()
        lines.append(cur)
        for i, ln in enumerate(lines[:3]):
            d.text((cx, cy + 2 + i * 14), ln, fill='#2d3a24', font=fs, anchor='mm')
    d.text((W / 2, 24), 'Meulebourg en 36 sections — orange : enquêtes · vert : parc · bleu : rivière · beige : décor', fill='#2d3a24', font=f, anchor='mm')
    d.text((W / 2 + 3.2 * tw / 2, 60 + th * 0.9), 'NORD ↗', fill='#5a6a48', font=f, anchor='lm')
    im.save(path)


def main():
    """Fiches des personnages (toujours valables). Les 36 sections séparées sont abandonnées au profit de la carte mère
    (carte_mere.py) ; leurs descriptions de scènes restent ici pour préparer les morceaux. `--sections` les réécrit dans _archive."""
    shutil.rmtree(f'{OUT}/01-personnages', ignore_errors=True)
    os.makedirs(OUT, exist_ok=True)
    for k in CH:
        write_character(k)
    if '--sections' in sys.argv:
        for s in S:
            write_section(s)
        plan_md()
    if '--plan' in sys.argv:
        plan_png(sys.argv[sys.argv.index('--plan') + 1])
    print(len(CH), 'personnages,', len(S), 'sections')


if __name__ == '__main__':
    main()
