# Prépare un dossier par personnage d'enquête pour le faire générer à la main dans Gemini :
# image du personnage de base, images des chapeaux / accessoires / objets à lui donner, et prompt.md.
# Usage : python3 tools/art/dossiers.py   (lit tools/art/sources/cast.json, écrit tools/art/personnages/)
import json, os, re, shutil, unicodedata
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = f'{ROOT}/sources'
OUT = f'{ROOT}/personnages'

# Personnage de base choisi pour chaque personnage d'enquête (silhouette, âge, peau, cheveux les plus proches).
# Les sosies et déguisements partent du résultat de leur « parent » pour rester identiques à lui.
BASE = {
    'Brigadier Gaston Picotin': 's3-1', 'Timothée Fournil': 's4-5', 'Rose Lemiel': 's6-1', 'Ernest Lafouine': 's5-4',
    'Adélaïde de la Botte': 's5-5', 'Hippolyte Barbarie': 's6-2', 'Lulu': 'base3', 'Gaspard Bigarade': 's4-1',
    'Achille Lapince, dit « le Hérisson »': 'base5', 'Lola Cachou': 's3-0', 'Octave Carat': 'base2', 'Ludo Taupin': 's3-5',
    'Zita Pistache': 'base4', 'Bérénice Fard': 's5-2', 'Gontran Lamèche': 'base1', 'Pétronille Doublure': 's2-4',
    'Hector Plumeau': 's5-1', 'Fortuné Cargo': 's4-2'}
PARENT = {
    'Motus': ('Ernest Lafouine', 'remove the black eye mask, the face is fully visible; everything else stays identical'),
    'Achille Lapince (déguisé)': ('Achille Lapince, dit « le Hérisson »', 'add the straw boater hat from image 2 on his head; everything else stays identical'),
    'Yves Le Goéland': ('Achille Lapince, dit « le Hérisson »', 'add the orange knitted beanie from image 2 on his head; the striped shirt now reads as a sailor\'s striped top; everything else stays identical'),
    'Épouvantail': ('Achille Lapince, dit « le Hérisson »', 'the shirt now has a blue CHECKED (gingham) pattern instead of stripes, a few wisps of straw stick out of the cuffs and collar, and he wears the straw boater hat from image 2; same face, hair, body and trousers'),
    'Épouvantail décoiffé': ('Épouvantail', 'remove the straw hat, showing the spiky blond hair; everything else stays identical'),
    'Lino Taupin': ('Ludo Taupin', 'remove the backpack and its straps; everything else stays identical (he is the identical twin)'),
    'Le faux infirmier': ('Gontran Lamèche', 'he is now disguised as a nurse: a long white nurse coat replaces the red suit jacket, and he wears the black eye mask from image 2; he KEEPS the same top hat, orange trousers, moustache and closed umbrella'),
}

SKIN = {'pale': 'very fair skin', 'light': 'fair skin', 'tan': 'light tan skin', 'brown': 'brown skin', 'dark': 'dark brown skin'}
HAIR = {'bald': 'bald head with a little {c} hair on the sides', 'short': 'short {c} hair', 'long': 'long {c} hair',
        'bun': '{c} hair in a bun', 'ponytail': '{c} hair in a ponytail', 'curly': 'curly {c} hair', 'spiky': 'spiky {c} hair'}
HAIRC = {'black': 'black', 'brown': 'brown', 'blond': 'blond', 'red': 'ginger red', 'grey': 'grey', 'white': 'white'}
BUILD = {'slim': 'slim build', 'regular': 'average build', 'large': 'stocky, plump build', 'child': 'young child'}
COLOR = {'red': 'red', 'orange': 'orange', 'yellow': 'yellow', 'pink': 'pink', 'purple': 'purple', 'blue': 'blue',
         'navy': 'navy blue', 'green': 'green', 'olive': 'olive green', 'brown': 'brown', 'beige': 'beige',
         'black': 'black', 'white': 'white', 'grey': 'grey'}
TOP = {'tshirt': 't-shirt', 'shirt': 'shirt', 'sweater': 'knitted sweater', 'coat': 'long coat', 'suit': 'suit jacket over a white shirt',
       'dress': 'dress', 'apron': 'apron over a white shirt', 'hoodie': 'hoodie', 'uniform': 'police uniform jacket with brass buttons',
       'overalls': 'overalls bib over a white t-shirt'}
BOTTOM = {'trousers': 'trousers', 'shorts': 'shorts', 'skirt': 'skirt'}
PATTERN = {'plain': '', 'stripes': ' with darker horizontal stripes', 'dots': ' with white polka dots', 'checks': ' with a darker checked pattern'}
# motifs décrits à la main quand la règle générale tromperait Gemini
TOP_OVERRIDE = {
    'Ernest Lafouine': 'black-and-white horizontally striped knitted sweater (classic burglar look)',
    'Achille Lapince, dit « le Hérisson »': 'white pyjama shirt with thin blue vertical stripes (escaped convict look)',
    'Rose Lemiel': 'pink baker\'s apron over a white shirt',
    'Gaspard Bigarade': 'white chef\'s jacket and white apron',
    'Lulu': 'blue overalls bib over a white t-shirt',
}
FACE = {'glasses': ('round glasses', 'acc-glasses'), 'sunglasses': ('sunglasses', 'acc-sunglasses'), 'mask': ('black burglar eye mask', 'acc-mask'),
        'mustache': ('a moustache', None), 'beard': ('a full beard', None)}
HAT = {'cap': 'hat-cap', 'beret': 'hat-beret', 'bowler': 'hat-bowler', 'tophat': 'hat-tophat', 'beanie': 'hat-beanie',
       'fedora': 'hat-fedora', 'helmet': 'hat-construction', 'chef': 'hat-chef', 'police': 'hat-kepi', 'straw': 'hat-boater'}
HAT_NAME = {'cap': 'flat cap', 'beret': 'beret', 'bowler': 'bowler hat', 'tophat': 'top hat', 'beanie': 'orange knitted beanie',
            'fedora': 'fedora', 'helmet': 'helmet', 'chef': 'white chef toque', 'police': 'police kepi', 'straw': 'straw boater'}
ACC = {'handbag': ('leather handbag, carried by its handles on the forearm', 'acc-handbag'),
       'briefcase': ('briefcase held by its handle', 'acc-briefcase'), 'backpack': ('backpack worn on the back, straps over the shoulders', 'acc-backpack'),
       'umbrella': ('closed umbrella held in one hand like a walking stick', 'it-umbrella-closed'),
       'cane': ('walking cane held in one hand', 'acc-cane'), 'camera': ('camera hanging from the neck', 'it-camera'),
       'newspaper': ('folded newspaper under the arm', 'it-newspaper'), 'flowers': ('bouquet of flowers held in one hand', 'it-flowers'),
       'balloon': ('red balloon on a string held in one hand', 'it-balloon'), 'suitcase': ('rolling suitcase pulled by its handle', 'acc-suitcase'),
       'scarf': ('striped knitted scarf around the neck', 'acc-scarf')}
HELD = {'knife': 'kitchen knife', 'moneybag': 'cloth money bag', 'painting': 'small framed painting', 'key': 'old brass key',
        'phone': 'smartphone', 'crowbar': 'crowbar', 'letter': 'letter in an envelope', 'bottle': 'glass bottle',
        'cake': 'cake on a plate', 'jewel': 'sparkling diamond', 'map': 'folded paper map', 'icecream': 'ice cream cone',
        'baguette': 'baguette', 'box': 'cardboard box', 'rope': 'coil of rope', 'needle': 'big sewing needle',
        'flashlight': 'flashlight', 'leash': 'dog on a red leash'}
HELD_FILE = {'leash': 'it-dog'}
HELD_FR = {'knife': 'couteau', 'moneybag': 'sac d\'argent', 'painting': 'tableau', 'key': 'clé', 'phone': 'téléphone', 'crowbar': 'pied-de-biche',
           'letter': 'lettre', 'bottle': 'flacon', 'cake': 'gâteau', 'jewel': 'diamant', 'map': 'plan', 'icecream': 'glace',
           'baguette': 'baguette', 'box': 'carton', 'rope': 'corde', 'needle': 'aiguille', 'flashlight': 'lampe', 'leash': 'chien en laisse'}
POSE = {  # (action en anglais, nom français)
    'stand': ('standing', 'debout'), 'walk': ('walking to the right, mid-stride, arms swinging naturally', 'marche'),
    'run': ('running to the right, dynamic stride, arms pumping', 'court'),
    'sit': ('sitting as if on a bench, knees bent, hands on the lap (do not draw the bench)', 'assis'),
    'lie': ('lying flat on the back on the ground, eyes closed, seen from the side', 'allongé'),
    'crouch': ('crouching down, looking at something on the ground', 'accroupi'),
    'climb': ('climbing a short wooden ladder, both arms raised to grab the rungs', 'grimpe'),
    'point': ('pointing forward to the right with one arm fully extended', 'montre du doigt'),
    'wave': ('waving hello with one raised hand', 'salue'),
    'carry': ('carrying something in front of the body with both arms', 'porte'),
    'phone': ('talking on a smartphone held to the ear', 'téléphone'),
    'fight': ('in a comic fighting stance, fists raised, angry face', 'se bat'),
    'handsup': ('both hands raised high, surprised face', 'mains en l\'air'),
    'sneak': ('tiptoeing sneakily, bent forward, looking around suspiciously', 'furtif'),
    'read': ('reading an open newspaper held in both hands', 'lit'),
    'window': ('shown from the waist up only, leaning on the forearms as if looking out of a window (do not draw the window)', 'à la fenêtre')}

STYLE_END = ('Full body, three-quarter view, body turned slightly to the right, same scale and same art style, '
             'plain white background, no ground shadow, no text, no other character, no object other than those mentioned.')


def slug(s):
    s = unicodedata.normalize('NFKD', s.split(',')[0]).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def on_white(src, dst, max_side=1024):
    im = Image.open(src).convert('RGBA'); im.thumbnail((max_side, max_side), Image.LANCZOS)
    pad = int(max(im.size) * .06)
    bg = Image.new('RGB', (im.width + 2 * pad, im.height + 2 * pad), 'white')
    bg.paste(im, (pad, pad), im); bg.save(dst)


def describe(c):
    a = c['appearance']; n = c['name']
    top = TOP_OVERRIDE.get(n) or f"{COLOR[a['topColor']]} {TOP[a['top']]}{PATTERN[a['topPattern']]}"
    if a['top'] == 'dress':
        top = f"{COLOR[a['topColor']]} dress{PATTERN[a['topPattern']]}"; bottom = None
    else:
        bottom = f"{COLOR[a['bottomColor']]} {BOTTOM[a['bottom']]}"
    hair = HAIR[a['hair']].format(c=HAIRC[a['hairColor']])
    face = FACE.get(a['face'], (None, None))[0] if a['face'] != 'none' else None
    return dict(top=top, bottom=bottom, hair=hair, skin=SKIN[a['skin']], build=BUILD[a['build']], face=face)


def build_folder(i, c, by_name, folder_of):
    a = c['appearance']; n = c['name']; d = f'{OUT}/{i:02d}-{slug(n)}'
    os.makedirs(d, exist_ok=True)
    k = describe(c)
    attach = []  # (fichier, rôle en anglais, rôle en français)
    parent = PARENT.get(n)
    # un sosie ne reçoit que les éléments qui diffèrent de son modèle (le reste est déjà sur le résultat du modèle)
    pa = by_name[parent[0]]['appearance'] if parent else {}
    new = lambda key: a[key] != 'none' and a[key] != pa.get(key)
    if not parent:
        on_white(f"{SRC}/bases/{BASE[n]}.png", f'{d}/1-personnage.png')
        attach.append(('1-personnage.png', 'the character to edit', 'le personnage de base'))
    if new('hat'):
        f = HAT[a['hat']]; on_white(f'{SRC}/objets/{f}.png', f'{d}/{len(attach) + 1 + bool(parent)}-chapeau.png')
        attach.append((f'{len(attach) + 1 + bool(parent)}-chapeau.png', f"the {HAT_NAME[a['hat']]}", 'le chapeau'))
    if new('face') and FACE.get(a['face'], (0, 0))[1]:
        f = FACE[a['face']][1]; name = f'{len(attach) + 1 + bool(parent)}-visage.png'; on_white(f'{SRC}/objets/{f}.png', f'{d}/{name}')
        attach.append((name, f"the {FACE[a['face']][0]}", 'lunettes / masque'))
    if new('accessory') and a['accessory'] in ACC:
        f = ACC[a['accessory']][1]; name = f'{len(attach) + 1 + bool(parent)}-accessoire.png'; on_white(f'{SRC}/objets/{f}.png', f'{d}/{name}')
        attach.append((name, f"the {ACC[a['accessory']][0]}", 'l\'accessoire'))
    held = sorted({u['holding'] for u in c['uses'] if u['holding'] != 'none'})
    for h in held:
        on_white(f"{SRC}/objets/{HELD_FILE.get(h, 'it-' + h)}.png", f'{d}/objet-{h}.png')

    L = [f"# {n}", '', f"**Rôle** : {', '.join(c['roles'])} · **Enquêtes** : {', '.join(c['cases'])}", '']
    A = []
    if parent:
        pd = folder_of[parent[0]]
        L += [f"**Sosie / déguisement de** « {parent[0]} » : il doit rester **identique** à lui, sauf la différence ci-dessous "
              "(c'est ce que le joueur doit repérer).", '',
              '## Étape 1 — le personnage', '',
              'Pièces jointes, dans cet ordre :', '',
              f"1. le résultat de l'étape 1 du dossier `{pd}` (`resultat.png`, à générer d'abord)"]
        for j, (f, _, fr) in enumerate(attach):
            L.append(f"{j + 2}. `{f}` — {fr}")
        en = (f"Same art style, outlines and shading as the attached images. Image 1 shows a character. Redraw EXACTLY the same character "
              f"(same face, expression, hair, body shape, proportions, clothes and colours) with one change: {parent[1]}. ")
        en += STYLE_END
    else:
        L += ['## Étape 1 — le personnage', '', 'Pièces jointes, dans cet ordre :', '']
        for j, (f, _, fr) in enumerate(attach):
            L.append(f"{j + 1}. `{f}` — {fr}")
        wear = [f"image {j + 1} = {en_}" for j, (_, en_, _) in enumerate(attach) if j > 0]
        feat = [k['build'], k['skin'], k['hair']] + ([k['face']] if k['face'] else [])
        en = ("Same art style, outlines and shading as the attached images. Edit the character in image 1: keep the same face shape, "
              "expression, proportions and drawing style, but give them: " + ', '.join(feat) + '. ')
        en += f"Outfit: {k['top']}" + (f", {k['bottom']}" if k['bottom'] else '') + ', dark brown shoes. '
        if wear:
            en += ('The character wears the items shown in the other attached images, copying their design and colours exactly: '
                   + '; '.join(wear) + '. ')
        en += STYLE_END
    L += ['', 'Prompt (format **3:4**) :', '', '```', en, '```', '',
          "Garde l'image réussie sous le nom `resultat.png` dans ce dossier.", '']

    poses = sorted({(u['pose'], u['holding']) for u in c['uses']}, key=lambda p: (list(POSE).index(p[0]), p[1]))
    L += ['## Étape 2 — les poses de l\'enquête', '',
          'Une génération par ligne. Pièces jointes : `resultat.png` (et l\'objet indiqué). '
          'Le regard vers la gauche s\'obtient en retournant l\'image : inutile de le générer.', '']
    keep = 'same face, hair, body shape, clothes, colours, hat and accessories'
    for p, h in poses:
        act, fr = POSE[p]
        if p == 'stand' and h == 'none':
            continue
        if p == 'carry' and h != 'none':
            act = f'carrying the {HELD[h]} (image 2) in front of the body with both arms'
        elif h != 'none':
            act += f', holding the {HELD[h]} (image 2) in one hand'
        files = '`resultat.png`' + (f" + `objet-{h}.png`" if h != 'none' else '')
        L += [f"### {fr}" + (f" — tient : {HELD_FR[h]}" if h != 'none' else '') + f"  ({files})", '', '```',
              f"Redraw exactly the same character as in image 1 ({keep}), now {act}. " + STYLE_END, '```', '']
    if all(p == 'stand' and h == 'none' for p, h in poses):
        L += ['Aucune autre pose : le résultat de l\'étape 1 suffit.', '']
    with open(f'{d}/prompt.md', 'w') as fh:
        fh.write('\n'.join(L))
    return d


def main():
    cast = json.load(open(f'{SRC}/cast.json'))
    if os.path.isdir(OUT):
        for e in os.listdir(OUT):
            p = f'{OUT}/{e}'
            if os.path.isdir(p) and not os.path.exists(f'{p}/resultat.png'):  # ne jamais écraser un résultat déjà généré
                shutil.rmtree(p)
    os.makedirs(OUT, exist_ok=True)
    folder_of = {c['name']: f'{i + 1:02d}-{slug(c["name"])}' for i, c in enumerate(cast)}
    rows = []
    for i, c in enumerate(cast):
        d = build_folder(i + 1, c, {x['name']: x for x in cast}, folder_of)
        par = PARENT.get(c['name'])
        rows.append(f"| [`{os.path.basename(d)}`]({os.path.basename(d)}/prompt.md) | {c['name']} | {', '.join(c['roles'])} | "
                    + (f"d'après `{folder_of[par[0]]}`" if par else f"`{BASE[c['name']]}`") + ' |')
    with open(f'{OUT}/README.md', 'w') as fh:
        fh.write('\n'.join([
            '# Personnages d\'enquête à générer dans Gemini', '',
            'Un dossier par personnage (fichiers générés par `python3 tools/art/dossiers.py`). Dans chaque dossier :', '',
            '- `prompt.md` : les pièces jointes à donner, dans l\'ordre, et les prompts à copier ;',
            '- `1-personnage.png` : le personnage de base à transformer ;',
            '- `2-chapeau.png`, `3-visage.png`, `4-accessoire.png`… : ce qu\'il doit porter ;',
            '- `objet-*.png` : les objets qu\'il tient dans certaines poses (étape 2).', '',
            'Marche à suivre : étape 1 (le personnage habillé, debout) → enregistrer l\'image réussie en `resultat.png` '
            'dans le dossier → étape 2 (une génération par pose, en joignant `resultat.png`).', '',
            'Les sosies et déguisements (Motus, Lino, épouvantails…) se génèrent **après** leur modèle, '
            'à partir de son `resultat.png`, pour ne changer que le détail qui compte dans l\'enquête.', '',
            'Les bulles d\'émotion ne sont pas à dessiner sur les personnages : le jeu les pose par-dessus.', '',
            '| Dossier | Personnage | Rôle | Départ |', '|---|---|---|---|', *rows, '']))
    print(len(rows), 'dossiers')


if __name__ == '__main__':
    main()
