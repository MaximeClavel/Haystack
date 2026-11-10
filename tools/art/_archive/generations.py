# Prépare les dossiers de génération Gemini pour le décor et le reste du jeu (bâtiments, lieux, véhicules,
# mobilier, nature, sols, population, interface) : un dossier = un sujet, avec prompt.md et les images de référence.
# Usage : python3 tools/art/generations.py   (écrit tools/art/generations/ ; ne touche pas aux dossiers qui ont un résultat)
import os, shutil, glob
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(ROOT))
STYLE_DIR = f'{REPO}/docs/art/style-retenu'
OUT = f'{ROOT}/generations'

# Références jointes : (fichier source, nom dans le dossier, rôle en français)
REFS = {
    'batiment': ('boulangerie.jpg', 'ref-batiment.jpg', 'référence de style et d\'angle pour un bâtiment seul'),
    'diorama': ('diorama.jpg', 'ref-diorama.jpg', 'référence de style et d\'angle pour la ville'),
    'objets': ('objets-1.jpg', 'ref-objets.jpg', 'référence de style pour les objets'),
    'habitants': ('bases-couleurs-reperes-2.jpg', 'ref-habitants.jpg', 'référence de style pour les habitants'),
}

STYLE = ('Same art style, outlines, colour palette and soft painted shading as the attached reference image: '
         'a lush, cozy French small town, hand-painted anime mobile-game look, warm daylight from the upper left.')
ISO = 'Isometric view from a high three-quarter angle, exactly the same camera angle as the reference.'
FACADE = ('The front facade with the entrance faces the lower left and the side wall faces the lower right, '
          'exactly like the reference building.')
WHITE = ('Plain white background, no ground under the objects, no cast shadow, no text, no letters or numbers anywhere '
         '(leave every sign board blank).')
SHEET = 'Separate objects side by side, same scale, generous empty space between them so they never touch or overlap.'
# couleurs repères pour que le programme recolore les bâtiments ordinaires (comme les vêtements des habitants)
KEY_BUILDING = ('IMPORTANT for recolouring: all plaster walls are painted bright saturated magenta (#FF00FF) and all roof '
                'tiles are bright saturated blue (#1E90FF); doors and shutters stay brown wood, stone corners grey, '
                'window-box flowers only red and white, ivy and moss green, awnings striped bright yellow and white.')
KEY_FR_BUILDING = ('Murs en **magenta** et toits en **bleu vif** : ce sont des couleurs repères, le programme les remplace '
                   'par les couleurs de chaque bâtiment du jeu (comme le vert/bleu des habitants). Stores rayés jaunes '
                   '= couleur du store recolorée aussi.')
KEY_VEHICLE = ('IMPORTANT for recolouring: the painted body of the car, the van, the bus and the truck is bright saturated '
               'green (#22CC22); windows light blue glass, tyres black, chrome grey.')


def bld(name, desc, fmt='1:1', extra=''):
    """Un lieu unique du jeu (couleurs réelles)."""
    return dict(name=name, fmt=fmt, text=f'{STYLE} {ISO} A single building: {desc}. {FACADE} {extra}{WHITE}')


F = []  # (dossier, titre, usage en français, références, [prompts], note)


def folder(slug, title, usage, refs, prompts, note=''):
    F.append(dict(slug=slug, title=title, usage=usage, refs=refs, prompts=prompts, note=note))


# --- 1. Bâtiments ordinaires (recolorables) ---------------------------------------------------------------
GEN = f'{STYLE} {ISO} {SHEET} {FACADE} {KEY_BUILDING} {WHITE}'
folder('01-maisons', 'Maisons', 'Maisons des quartiers résidentiels (style `house`).', ['batiment'], [
    dict(name='maisons', fmt='16:9', text=f'Three different small houses: a one-storey stone cottage with a dormer, a two-storey house with a chimney and shutters, a two-storey corner house with a small porch. {GEN}')],
    KEY_FR_BUILDING)
folder('02-maisons-de-ville', 'Maisons de ville', 'Maisons étroites mitoyennes des rues du centre (style `townhouse`).', ['batiment'], [
    dict(name='maisons-de-ville', fmt='16:9', text=f'Three different narrow three-storey town houses, each one bay wide, with balconies, window boxes and mansard roofs. {GEN}')],
    KEY_FR_BUILDING)
folder('03-immeubles', 'Immeubles', 'Immeubles d\'habitation (style `apartment`).', ['batiment'], [
    dict(name='immeubles', fmt='16:9', text=f'Two different five-storey Parisian-style apartment buildings with wrought-iron balconies and zinc mansard roofs with dormers, and a smaller four-storey one. {GEN}')],
    KEY_FR_BUILDING)
folder('04-commerces', 'Commerces', 'Boutiques sans nom (style `shop`), plus café, bar et petit hôtel ordinaires.', ['batiment'], [
    dict(name='boutiques', fmt='16:9', text=f'Three different two-storey buildings with a shop on the ground floor: big display window, striped awning, blank sign board above the window, flat above. {GEN}'),
    dict(name='cafe-bar-hotel', fmt='16:9', text=f'Three different buildings: a café with a striped awning and big windows, a small neighbourhood bar with a blank hanging sign, a small three-storey hotel with a blank sign over the door. {GEN}')],
    KEY_FR_BUILDING)
folder('05-industrie', 'Industrie', 'Entrepôts, usine, garage (styles `warehouse`, `factory`, `garage`).', ['batiment'], [
    dict(name='industrie', fmt='16:9', text=f'Three different buildings: a long brick warehouse with large wooden sliding doors, a small factory with a tall brick chimney and saw-tooth roof, a mechanic\'s garage with a roller door. {GEN}')],
    KEY_FR_BUILDING)
folder('06-annexes', 'Cabanes et serres', 'Petites constructions des jardins et des cours (styles `shed`, `greenhouse`).', ['batiment'], [
    dict(name='annexes', fmt='16:9', text=f'{STYLE} {ISO} {SHEET} Four small garden structures: a wooden tool shed, a smaller lean-to shed, a glass greenhouse with white frames and plants inside, a wooden garden hut with a tiny porch. The entrance faces the lower left. {WHITE}')])

# --- 2. Lieux uniques ---------------------------------------------------------------------------------------
LM = [
    ('10-gare', 'Gare de Meulebourg', bld('gare', 'the Meulebourg railway station, a very long and low symmetric stone building (front facade about four times longer than the side), a central clock tower, tall arched windows, slate roof, a glass and iron canopy along the front', '16:9')),
    ('11-grand-hotel', 'Grand Hôtel', bld('grand-hotel', 'the Grand Hotel, an elegant four-storey Belle Époque hotel in cream stone, wrought-iron balconies, a red canopy over the revolving door, flags, potted palm trees by the entrance')),
    ('12-bar-fer-a-cheval', 'Bar Le Fer à Cheval', bld('bar-fer-a-cheval', 'a small old bar-tabac with a dark green wooden shopfront, a big golden horseshoe emblem above the door, a green striped awning, a blank sign board')),
    ('13-garage-pistons', 'Garage Pistons', bld('garage-pistons', 'a 1950s car repair garage, two large open roller doors showing a car on a lift inside, an old petrol pump in front, stacked tyres, oil cans, a blank sign board', '16:9')),
    ('15-boucherie-tendron', 'Boucherie Tendron', bld('boucherie', 'a traditional butcher\'s shop with a red and white tiled shopfront, a red striped awning, sausages and hams hanging in the window, a golden bull head emblem, a blank sign board')),
    ('16-cinema-le-rex', 'Cinéma Le Rex', bld('cinema', 'an art deco cinema with a rounded corner tower carrying a tall blank vertical sign, a canopy edged with light bulbs over the entrance, empty poster frames, cream and red facade', '16:9')),
    ('17-hotel-de-ville', 'Hôtel de Ville', bld('hotel-de-ville', 'the town hall, a grand symmetric stone building with a central belfry and clock, French tricolour flags, a balcony above the main door, wide front steps', '16:9')),
    ('18-cafe-du-centre', 'Café du Centre', bld('cafe-du-centre', 'a corner café with a dark red awning, large windows, a few small round terrace tables and wicker chairs on the pavement in front, a blank sign board')),
    ('19-banque-dufric', 'Banque Dufric', bld('banque', 'a neoclassical bank with four columns, a triangular pediment, a heavy bronze door, barred windows, pale stone walls')),
    ('20-eglise-saint-foin', 'Église Saint-Foin', bld('eglise', 'a Romanesque stone church with a tall square bell tower and spire, a rose window above an arched wooden door, slate roof, a little moss')),
    ('21-bijouterie-carat', 'Bijouterie Carat', bld('bijouterie', 'an elegant narrow jewellery shop with a deep purple painted wooden shopfront, gold trim, display windows with sparkling jewels, a small diamond-shaped hanging sign left blank')),
    ('22-commissariat', 'Commissariat', bld('commissariat', 'the police station, a sturdy two-storey red brick building with blue shutters, a blue lamp over the door, a French flag, a police car parking space in front', '16:9')),
    ('23-pharmacie', 'Pharmacie', bld('pharmacie', 'a pharmacy with a white and green shopfront, a glowing green cross sign without letters, display windows with old glass bottles')),
    ('24-la-poste', 'La Poste', bld('poste', 'the post office, a two-storey building with yellow and blue details, a yellow letter box by the door, a clock above the entrance', '16:9')),
    ('25-fleuriste-petale', 'Fleuriste Pétale', bld('fleuriste', 'a florist\'s shop with a pastel pink facade covered in flowers, buckets and shelves of flowers on the pavement, a blank sign board')),
    ('26-librairie-marque-page', 'Librairie Le Marque-Page', bld('librairie', 'a bookshop with a dark green wooden shopfront, windows full of books, crates of second-hand books on trestles outside, a blank sign board')),
    ('27-ecole-jules-botte', 'École Jules-Botte', bld('ecole', 'a primary school, a long two-storey building with tall windows, a small bell turret on the roof, a gate with a blank sign above it', '16:9')),
    ('28-musee-beaux-arts', 'Musée des Beaux-Arts', bld('musee', 'a fine arts museum, a grand classical building with a dome, a colonnade, wide steps and two blank hanging banners', '16:9')),
    ('29-theatre-de-la-botte', 'Théâtre de la Botte', bld('theatre', 'an ornate Italian-style theatre with arched entrances, sculpted comedy and tragedy masks, red and gold decoration, empty poster frames, a balcony with columns', '16:9')),
    ('30-hopital-sainte-paille', 'Hôpital Sainte-Paille', bld('hopital', 'a hospital, a long white three-storey building with a red cross without letters, an ambulance canopy at the entrance, many windows', '16:9')),
    ('31-capitainerie', 'Capitainerie', bld('capitainerie', 'a harbour master\'s office, a small white building with a lookout tower, maritime signal flags, an anchor and life buoys on the wall')),
    ('32-chantier-de-la-tour', 'Chantier de la Tour', bld('chantier', 'a construction site: a half-built tower wrapped in scaffolding, a yellow tower crane, piles of bricks, a cement mixer, a site hut, safety barriers', '1:1')),
]
for slug, title, p in LM:
    folder(slug, title, f'Lieu de l\'enquête « {title} » (couleurs réelles, une seule image).', ['batiment'], [p])

folder('33-ponts', 'Ponts', 'Pont Central et Pont du Parc sur la Fenaison.', ['diorama'], [
    dict(name='pont-central', fmt='16:9', text=f'{STYLE} {ISO} A single old stone road bridge with three arches and stone parapets, lamp posts, a road and two pavements on top, running diagonally from the upper left to the lower right. No water, no river banks. {WHITE}'),
    dict(name='pont-du-parc', fmt='16:9', text=f'{STYLE} {ISO} A single small footbridge in wood and wrought iron with a gentle arch, running diagonally from the upper left to the lower right. No water, no river banks. {WHITE}')])
folder('34-place-et-parc', 'Fontaine, statue, kiosque', 'Fontaine de la Grand-Place, Statue du Fondateur (et variantes ange / sculpture), Kiosque à musique.', ['diorama'], [
    dict(name='fontaine-statues', fmt='16:9', text=f'{STYLE} {ISO} {SHEET} A round stone fountain with water jets and a basin, a bronze statue of a 19th-century town founder on a stone pedestal, a stone angel statue on a pedestal, a small abstract modern sculpture on a plinth. {WHITE}'),
    dict(name='kiosque', fmt='1:1', text=f'{STYLE} {ISO} A single park bandstand: octagonal, white wrought-iron columns, green roof with a little spire, a few steps. {WHITE}')])
folder('35-port', 'Port', 'Quais et entrepôts du port.', ['diorama'], [
    dict(name='port', fmt='16:9', text=f'{STYLE} {ISO} {SHEET} A harbour crane on rails, a stack of wooden crates, mooring bollards with rope, a pile of fishing nets with floats, a life buoy on a post, a ship anchor, an oil drum, a fisherman\'s hut. {WHITE}')])
folder('36-cimetiere', 'Cimetière', 'Cimetière du Quartier des Arts.', ['diorama'], [
    dict(name='cimetiere', fmt='16:9', text=f'{STYLE} {ISO} {SHEET} Four different old mossy tombstones, a stone cross, a small family chapel tomb, a wrought-iron cemetery gate with stone pillars, a cypress tree, a stone bench. {WHITE}')])
folder('37-jardins-ouvriers', 'Jardins ouvriers', 'Potagers des Jardins (les épouvantails sont des personnages, voir `personnages/`).', ['diorama'], [
    dict(name='jardins', fmt='16:9', text=f'{STYLE} {ISO} {SHEET} A rectangular vegetable plot with rows of cabbages and leeks, a plot with tomato stakes, a wooden compost bin, a rain barrel, a wheelbarrow, a watering can, a small pumpkin patch, a stack of terracotta pots. {WHITE}')])

# --- 3. Véhicules -------------------------------------------------------------------------------------------
VEH = 'a small rounded 1950s French car, a delivery van, a taxi (black with a small white roof light without letters), a police car (white and blue), a city bus, a small truck, an ambulance (white with a red cross)'
folder('40-vehicules', 'Véhicules', 'Voitures, utilitaire, taxi, police, bus, camion, ambulance. Deux images : vus de face, vus de dos (l\'autre sens s\'obtient en retournant l\'image).', ['diorama'], [
    dict(name='vehicules-avant', fmt='16:9', text=f'{STYLE} {ISO} {SHEET} Seven vehicles, all driving towards the lower left (front and left side visible): {VEH}. {KEY_VEHICLE} {WHITE}'),
    dict(name='vehicules-arriere', fmt='16:9', text=f'{STYLE} {ISO} {SHEET} The same seven vehicles, all driving towards the upper left (rear and left side visible): {VEH}. {KEY_VEHICLE} {WHITE}')],
    'Carrosserie de la voiture, de l\'utilitaire, du bus et du camion en **vert** : couleur repère recolorée par le programme. Taxi, police et ambulance gardent leurs vraies couleurs.')
folder('41-deux-roues-bateaux', 'Vélos, scooters, bateaux', 'Vélo, scooter, barque et bateaux de la rivière et du port.', ['diorama'], [
    dict(name='deux-roues-bateaux', fmt='16:9', text=f'{STYLE} {ISO} {SHEET} A bicycle facing lower left, the same bicycle facing upper left, a vintage scooter facing lower left, the same scooter facing upper left, a wooden rowing boat, a small fishing boat with a cabin, a long river barge. The scooter body is bright saturated green (#22CC22). {WHITE}')])

# --- 4. Mobilier, nature, animaux, objets ---------------------------------------------------------------------
PROPS = f'{STYLE} {ISO} {SHEET}'
folder('50-mobilier-urbain', 'Mobilier urbain', 'Bancs, lampadaires, poubelles, boîtes aux lettres, bornes, cabines, abribus, panneaux, cônes, barrières, plaques d\'égout.', ['diorama'], [
    dict(name='mobilier-1', fmt='16:9', text=f'{PROPS} A wooden park bench, the same bench broken in the middle, an old cast-iron street lamp, a green public litter bin, a yellow French letter box on a post, a red fire hydrant, an orange traffic cone. {WHITE}'),
    dict(name='mobilier-2', fmt='16:9', text=f'{PROPS} A red telephone box, a green newspaper kiosk, a bus stop shelter, a blank signpost on a pole, a red and white road barrier, a closed round manhole cover lying on the ground, an open manhole with its cover pushed aside. {WHITE}')])
folder('51-marche-terrasse', 'Marché et terrasses', 'Étals, parasols, tables, chaises, charrettes, caisses, tonneaux, palettes.', ['diorama'], [
    dict(name='marche', fmt='16:9', text=f'{PROPS} A market stall with a striped awning and crates of fruit, the same stall selling vegetables, a café parasol, a small round bistro table, a bistro chair, a wooden hand cart, a wooden crate, a crate of vegetables, a wooden barrel, a wooden pallet. Awnings and parasol striped bright yellow and white (they will be recoloured). {WHITE}')],
    'Stores et parasols en **jaune** : couleur repère recolorée par le programme.')
folder('52-chantier-parc', 'Chantier et parc', 'Grue, échafaudage, tente, aire de jeux.', ['diorama'], [
    dict(name='chantier-parc', fmt='16:9', text=f'{PROPS} A yellow construction tower crane, a section of metal scaffolding with planks, a cement mixer, a pile of bricks, a white party tent, a children\'s playground with a slide and a swing set, a sandpit. {WHITE}')])
folder('53-arbres', 'Arbres', 'Les quatre arbres du jeu (rond, sapin, peuplier, arbre nu), deux variantes chacun.', ['diorama'], [
    dict(name='arbres', fmt='16:9', text=f'{PROPS} Two different round leafy deciduous trees, two different pine trees, two different tall slim poplar trees, two different bare leafless trees. {WHITE}')])
folder('54-buissons-fleurs-rochers', 'Buissons, massifs, rochers', 'Buissons, massifs de fleurs, rochers, flaques.', ['diorama'], [
    dict(name='vegetation', fmt='16:9', text=f'{PROPS} Two different round bushes, two different flower beds with a stone border, two different mossy rocks, a puddle of water on the ground, a clump of reeds, lily pads with a flower. {WHITE}')])
folder('55-animaux', 'Animaux', 'Chiens (petit, grand), chat, pigeons, canards — et la cane dorée de « Coin-coin ! ».', ['diorama'], [
    dict(name='animaux', fmt='16:9', text=f'{PROPS} A small dog, a big dog, a cat sitting, a group of three pigeons pecking, a mallard duck walking, a duck swimming, a shiny golden female duck. All facing the lower left. {WHITE}')])
folder('56-objets-au-sol', 'Objets d\'enquête posés au sol', 'Les objets à trouver sur la carte, posés par terre (vue de la carte, pas tenus en main).', ['diorama', 'objets'], [
    dict(name='objets-sol-1', fmt='16:9', text=f'{PROPS} Objects lying on the ground: a cloth money bag, a suitcase, a briefcase, a kitchen knife, a framed painting leaning on its side, a closed steel safe, the same safe open and empty, a wooden ladder lying flat. {WHITE}'),
    dict(name='objets-sol-2', fmt='16:9', text=f'{PROPS} Objects lying on the ground: a coil of rope, a trail of muddy footprints, a full black trash bag, a letter in an envelope, an old brass key, a sparkling diamond, a cake on a plate, a tiny shiny golden sewing needle. {WHITE}')])
folder('57-clotures-haies-murs', 'Clôtures, haies, murets', 'Segments répétables pour les clôtures, haies et murs des jardins et des parcs.', ['diorama'], [
    dict(name='clotures', fmt='16:9', text=f'{PROPS} Straight segments that can be repeated end to end, each shown twice (running towards the lower left and running towards the lower right): a white wooden picket fence, a black wrought-iron railing, a trimmed green hedge, a low mossy stone wall. {WHITE}')])

# --- 5. Sols ------------------------------------------------------------------------------------------------
GROUND = [('herbe', 'short lush grass with a few tiny flowers'), ('pelouse-parc', 'neatly mown park lawn with subtle mowing stripes'),
          ('eau', 'calm river water, greenish blue, soft ripples and highlights'), ('sable', 'fine light sand'),
          ('paves-place', 'old cobblestone square, warm grey and beige stones'), ('trottoir', 'pavement of large square stone slabs'),
          ('route', 'old asphalt road, dark grey, slightly worn'), ('parking', 'asphalt parking area'),
          ('quai', 'wooden dock planks'), ('potager', 'dark tilled garden soil'), ('cour', 'gravel courtyard'),
          ('pont', 'stone bridge deck paving'), ('voie-ferree', 'railway ballast gravel with wooden sleepers')]
folder('60-sols', 'Textures de sol', 'Les 13 sols du jeu (herbe, parc, eau, sable, place, trottoir, route, parking, quai, potager, cour, pont, voie ferrée). Le programme les met en perspective isométrique lui-même.', ['diorama'], [
    dict(name=n, fmt='1:1', text=f'{STYLE} A seamless tileable square texture of {d}, viewed straight from above (top-down, no perspective, no horizon), even lighting, no objects, no text, the left edge matches the right edge and the top edge matches the bottom edge.')
    for n, d in GROUND])

# --- 6. Population ------------------------------------------------------------------------------------------
PEOPLE = ('Same art style, proportions, outlines and shading as the attached character sheet. A character sheet of six new townspeople standing side by side, '
          'full body, three-quarter view facing the viewer, same scale, plain white background, lots of empty space between the characters, they must not touch or overlap, NO hats, NO accessories, NO text: ')
KEY_PEOPLE = ' Varied skin tones. IMPORTANT: tops painted in bright saturated green, trousers, skirts or shorts painted in bright saturated blue, shoes dark brown.'
folder('70-habitants-1', 'Habitants supplémentaires (1)', 'Encore plus de variété dans la foule (couleurs repères vert/bleu recolorées).', ['habitants'], [
    dict(name='habitants-1', fmt='16:9', text=PEOPLE + 'a tall young woman with a short pixie cut, a chubby teenage boy, a middle-aged woman with a grey bob, a young father with a short beard, a little girl with two braids, an old man with a big white moustache.' + KEY_PEOPLE)])
folder('71-habitants-2', 'Habitants supplémentaires (2)', 'Encore plus de variété dans la foule.', ['habitants'], [
    dict(name='habitants-2', fmt='16:9', text=PEOPLE + 'a young man with an afro, a woman with long straight blond hair, a stocky bald older man, a red-haired freckled boy, a woman with curly grey hair, a young man with a ponytail.' + KEY_PEOPLE)])
JOBS = ('Same art style, proportions, outlines and shading as the attached character sheet. A character sheet of four townspeople in work outfits, full body, '
        'three-quarter view facing the viewer, same scale, plain white background, lots of empty space between the characters, they must not touch or overlap, NO text: ')
folder('72-metiers', 'Métiers', 'Figurants en tenue de travail (couleurs réelles). Quatre par image pour qu\'ils ne se touchent pas.', ['habitants'], [
    dict(name='metiers-1', fmt='16:9', text=JOBS + 'a policeman in a navy uniform and kepi, a policewoman in a navy uniform and kepi, a doctor in a white coat with a stethoscope, a nurse in a white uniform.'),
    dict(name='metiers-2', fmt='16:9', text=JOBS + 'a waiter in a white shirt, black waistcoat and long black apron, a postman in a blue uniform and cap with a mail bag, a firefighter in a dark uniform with a helmet, a construction worker with an orange vest and yellow helmet.'),
    dict(name='metiers-3', fmt='16:9', text=JOBS + 'a gardener in green overalls and a straw hat, a sailor in a striped top and white cap, a fisherman in a yellow raincoat and boots, a market vendor in an apron.'),
    dict(name='metiers-4', fmt='16:9', text=JOBS + 'a priest in a black cassock, a museum guard in a grey uniform and cap, a street musician with an accordion, a mime with a white painted face and striped top.')])

ACTIONS = [('marche', 'walking to the right, mid-stride, arms swinging naturally'), ('assis', 'sitting as if on a bench, knees bent, hands on their lap (do not draw the bench)'),
           ('montre', 'pointing forward to the right with one arm fully extended'), ('telephone', 'talking on a smartphone held to the ear'),
           ('salue', 'waving hello with one raised hand'), ('lit', 'reading an open newspaper held in both hands')]
folder('73-actions-foule', 'Actions de la foule', 'Les habitants de base dans les 6 poses les plus fréquentes de la foule. Pour chaque planche `planche-*.jpg`, une génération par action (36 en tout ; commence par marche et assis).', [], [
    dict(name=f'{{planche}}-{n}', fmt='16:9', text=('Here is a character sheet of six townspeople. Redraw exactly the same six characters, same faces, hairstyles, body shapes, skin tones and clothes, '
         'with the top still bright saturated green and the bottom still bright saturated blue, in the same order from left to right, now '
         f'{a}. All facing right in three-quarter view, full body, same scale and same art style, plain white background, lots of empty space so they never touch, no text, no extra objects.'))
    for n, a in ACTIONS], 'Joins une seule planche par génération. Nom du résultat : par exemple `planche-2-marche.png`.')

# --- 7. Interface ---------------------------------------------------------------------------------------------
COVERS = [('c00-tarte-de-bienvenue', 'a strawberry tart has vanished between the bakery and the police station; a young police brigadier with a ginger moustache looks puzzled at an empty plate in front of a cozy bakery with a pink striped awning'),
          ('c01-main-dans-le-sac', 'market day at the covered market square: a burglar in a striped sweater, orange beanie and black eye mask runs off with a money bag between the fruit stalls, a mime frozen in the crowd'),
          ('c02-coin-coin', 'a duck contest in a big park with a pond and a bandstand: an empty velvet cushion where a golden duck should be, an old baroness in a straw hat throwing up her hands'),
          ('c03-belle-evasion', 'an escaped convict in blue and white striped pyjamas with spiky blond hair sneaks away from the railway station towards the river and the harbour'),
          ('c04-grande-paille', 'night at an elegant purple jewellery shop: an empty display case, a twin burglar with a backpack climbing out, a sparkling diamond'),
          ('c05-rideau', 'opening night at an ornate Italian theatre: the diva in a red dress has fainted on stage, actors in top hats and orange trousers around her, red velvet curtains')]
folder('80-couvertures-enquetes', 'Couvertures des enquêtes', 'Une illustration par enquête pour la liste des affaires (sans texte). Si les personnages sont déjà générés, joins aussi leurs `resultat.png` (dossiers `personnages/`) pour qu\'ils se ressemblent.', ['diorama'], [
    dict(name=n, fmt='16:9', text=f'{STYLE} {ISO} A small isometric diorama scene of a cozy French town telling a story: {d}. Cheerful, funny detective mood, no text, no letters.')
    for n, d in COVERS])
folder('81-ecran-titre', 'Écran d\'accueil', 'Grande vue de Meulebourg pour l\'écran d\'accueil (téléphone, vertical).', ['diorama'], [
    dict(name='accueil', fmt='9:16', text=f'{STYLE} {ISO} A bird\'s-eye isometric view of the whole small French town of Meulebourg on a sunny morning: a railway station on the left, a market square, an old town with a church spire and a town hall, a big park with a pond, a winding river with stone bridges, a little harbour with boats, allotment gardens with scarecrows. Haystacks in the fields around the town. Leave calm sky at the top for a title. No text.')])
folder('82-icones-interface', 'Icônes de l\'interface', 'Icônes des boutons du jeu.', ['objets'], [
    dict(name='icones', fmt='1:1', text=f'Same art style, outlines and shading as the attached reference. A sheet of sixteen game interface icons, each a simple object in a soft round shape, {SHEET[0].lower() + SHEET[1:]} Plain white background, no text: a magnifying glass, a detective notebook, a light bulb (hint), a gear (settings), a map pin, a folded map, a green check mark, a red cross, a gold star, a house (home), a back arrow, a speaker (sound), a vibrating phone, a question mark, a padlock, a haystack with a red thread and a needle (game logo).')])


def ref_copy(key, d):
    src, name, _ = REFS[key]
    im = Image.open(f'{STYLE_DIR}/{src}').convert('RGB'); im.thumbnail((1024, 1024), Image.LANCZOS)
    im.save(f'{d}/{name}', quality=88)
    return name


def write(f):
    d = f'{OUT}/{f["slug"]}'
    if glob.glob(f'{d}/resultat*') or glob.glob(f'{d}/*.png'):
        return False  # déjà des résultats : on ne touche à rien
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    refs = [ref_copy(k, d) for k in f['refs']]
    if f['slug'] == '73-actions-foule':
        for p in sorted(glob.glob(f'{STYLE_DIR}/bases-couleurs-reperes*.jpg')):
            n = 'planche-' + (p.rsplit('-', 1)[1][:-4] if p.endswith(tuple(f'-{i}.jpg' for i in range(2, 10))) else '1') + '.jpg'
            im = Image.open(p).convert('RGB'); im.thumbnail((1600, 1600), Image.LANCZOS); im.save(f'{d}/{n}', quality=88)
    L = [f'# {f["title"]}', '', f'**Dans le jeu** : {f["usage"]}', '']
    if f['note']:
        L += [f['note'], '']
    if refs:
        L += ['**Pièce jointe** (à chaque génération) : ' + ', '.join(f'`{r}` ({REFS[k][2]})' for r, k in zip(refs, f['refs'])), '']
    elif f['slug'] == '73-actions-foule':
        L += ['**Pièce jointe** : une planche `planche-*.jpg` de ce dossier.', '']
    for i, p in enumerate(f['prompts']):
        L += [f'## {i + 1}. {p["name"].replace("{planche}-", "")}  — format **{p["fmt"]}**', '', '```', p['text'], '```', '',
              f'Résultat à enregistrer ici sous le nom `{p["name"].replace("{planche}", "planche-N")}.png`.', '']
    with open(f'{d}/prompt.md', 'w') as fh:
        fh.write('\n'.join(L))
    return True


def main():
    os.makedirs(OUT, exist_ok=True)
    n = sum(write(f) for f in F)
    count = sum(len(f['prompts']) * (6 if f['slug'] == '73-actions-foule' else 1) for f in F)
    rows = [f'| [`{f["slug"]}`]({f["slug"]}/prompt.md) | {f["title"]} | {len(f["prompts"]) * (6 if f["slug"] == "73-actions-foule" else 1)} |' for f in F]
    with open(f'{OUT}/README.md', 'w') as fh:
        fh.write('\n'.join([
            '# Générations Gemini : décor, population, interface', '',
            f'Fichiers générés par `python3 tools/art/generations.py`. {len(F)} dossiers, {count} images en tout.', '',
            'Dans chaque dossier : `prompt.md` (un ou plusieurs prompts, avec le format d\'image à choisir) et la ou les '
            'images de référence `ref-*.jpg` à joindre **à chaque génération** pour garder le style et l\'angle de la planche retenue.', '',
            'Enregistre chaque image réussie dans son dossier, sous le nom indiqué dans `prompt.md` (je la découpe et la range ensuite).', '',
            'Ordre conseillé : bâtiments ordinaires (01–06), lieux (10–37), arbres et mobilier (50–57), véhicules (40–41), '
            'sols (60), population (70–73), interface (80–82). Les personnages d\'enquête sont dans `../personnages/` ; '
            'la boulangerie Lemiel est déjà faite (`docs/art/style-retenu/boulangerie.jpg`).', '',
            'Quelques règles communes à tous les prompts :', '',
            '- même vue isométrique que la référence ; les façades d\'entrée regardent vers le **bas à gauche** '
            '(l\'autre orientation s\'obtient en retournant l\'image) ;',
            '- fond blanc, pas d\'ombre portée, **aucun texte** : les enseignes restent vierges, le jeu y écrit lui-même les noms ;',
            '- les éléments qui changent de couleur dans le jeu sont peints en couleurs repères (murs magenta, toits bleus, '
            'carrosseries vertes, stores jaunes, hauts verts / bas bleus des habitants) : le programme les recolore.', '',
            '| Dossier | Sujet | Images |', '|---|---|---|', *rows, '']))
    print(n, 'dossiers écrits,', count, 'images')


if __name__ == '__main__':
    main()
