# Carte mère de Meulebourg : un plan schématique en vue isométrique (plan.png) que Gemini transforme en une
# seule image illustrée de toute la ville. Cette image est ensuite découpée en morceaux à agrandir un par un.
# Usage : python3 tools/art/carte_mere.py   (écrit tools/art/drive/02-carte-mere/plan.png et prompt.md)
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = f'{ROOT}/drive/02-carte-mere'
SIZE = 1600
A, B = 130, 90  # demi-largeur et demi-hauteur d'un pâté de maisons à l'écran (vue plongeante, comme le diorama)
CX, Y0 = SIZE // 2, 265
M = 0.07  # demi-largeur d'une rue, en pâtés

STREET, BLOCK, PARK, WATER, FIELD, GARDEN, QUAY, RAIL, COUNTRY = (
    '#9a9a98', '#ead9b8', '#8fcf6e', '#6fb2e6', '#ecd67a', '#b9d68a', '#d8cdb8', '#4a4038', '#c9dfa0')

# numéro → (colonne, rangée, couleur, contenu en anglais)
CELLS = [
    (0, 0, BLOCK, 'railway depot: locomotive shed, water tower, wagons, railway tracks arriving from the upper right of the image'),
    (1, 0, BLOCK, 'quiet residential street: ivy-covered town houses with small gardens'),
    (2, 0, BLOCK, 'market square with striped stalls, a bakery with a pink awning and a butcher\'s shop behind it'),
    (3, 0, BLOCK, 'art deco cinema with a rounded corner tower'),
    (4, 0, PARK, 'park: lawns, trees and the bronze statue of the town founder on a pedestal'),
    (5, 0, PARK, 'park: large duck pond with a wooden jetty and a small rowing boat'),
    (0, 1, BLOCK, 'railway station: long stone building with a clock tower, wide forecourt, grand hotel next to it'),
    (1, 1, BLOCK, 'post office and pharmacy behind a small public garden with a bench'),
    (2, 1, BLOCK, 'town hall with a belfry, large cobbled square with a round fountain in its centre'),
    (3, 1, BLOCK, 'stone church with a tall bell tower, a corner café with a terrace, a florist'),
    (4, 1, PARK, 'park: white octagonal bandstand with a green roof in a clearing'),
    (5, 1, PARK, 'park: children\'s playground with a slide, swings and a sandpit'),
    (0, 2, BLOCK, 'working-class street with a small bar and narrow houses'),
    (1, 2, BLOCK, 'red brick police station with police cars parked in front'),
    (2, 2, BLOCK, 'elegant jewellery shop with a purple front, next to a bank with columns'),
    (3, 2, BLOCK, 'shopping street with a bookshop and small shops'),
    (4, 2, BLOCK, 'fine arts museum: grand classical building with a dome and columns'),
    (5, 2, BLOCK, 'ornate theatre with a paved forecourt'),
    (0, 3, BLOCK, 'car repair garage with a petrol pump and stacks of tyres'),
    (1, 3, BLOCK, 'primary school with a walled school yard and two plane trees'),
    (2, 3, BLOCK, 'modest suburb: small workers\' houses, a washhouse, workshops'),
    (3, 3, '#e8c9a0', 'construction site: half-built tower in scaffolding, tall yellow crane'),
    (4, 3, '#b7c9a4', 'old walled cemetery with tombstones, cypress trees and a stone angel statue'),
    (5, 3, BLOCK, 'long white hospital with a red cross and an ambulance'),
    (0, 4, QUAY, 'river quay with moored barges; a small red motor boat on the river'),
    (1, 4, QUAY, 'riverside promenades; the old stone bridge with three arches crosses the river here'),
    (2, 4, QUAY, 'riverside open-air café with lanterns on the north bank, washhouse and willows on the south bank'),
    (3, 4, QUAY, 'riverside promenades; a graceful iron footbridge crosses the river here'),
    (4, 4, QUAY, 'the river widens: fishing boats, a small beacon, fish stalls'),
    (5, 4, QUAY, 'harbour quay with a crane and a white passenger boat moored'),
    (0, 5, GARDEN, 'allotment gardens: small vegetable plots, sheds, scarecrows'),
    (1, 5, GARDEN, 'allotment gardens: vegetable plots, fruit trees, a small greenhouse'),
    (2, 5, FIELD, 'hay fields with big haystacks and a stone farmhouse'),
    (3, 5, FIELD, 'stone windmill on a small mound, wheat field, orchard'),
    (4, 5, BLOCK, 'harbour master\'s office: small white building with a lookout tower and flags'),
    (5, 5, BLOCK, 'three long brick harbour warehouses, crates and barrels'),
]


def P(u, v):
    return (CX + (u - v) * A, Y0 + (u + v) * B)


def quad(d, u0, v0, u1, v1, fill):
    d.polygon([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], fill=fill)


def draw_plan(path):
    im = Image.new('RGB', (SIZE, SIZE), COUNTRY); d = ImageDraw.Draw(im)
    # campagne : quelques champs de foin autour de la ville
    for u, v in [(-2.2, 1), (-1.6, 4.2), (2, -2), (5, -1.8), (7.6, 1.5), (7.2, 4.6), (3.5, 7.6), (0.5, 7.2), (-2.5, -1.5), (8, 7.5)]:
        quad(d, u, v, u + 1.2, v + 1.0, FIELD)
    quad(d, 0, 0, 6, 6, STREET)  # emprise de la ville : les rues
    for c, r, col, _ in CELLS:
        if r == 4 or col == PARK:
            continue
        quad(d, c + M, r + M, c + 1 - M, r + 1 - M, col)
    quad(d, 4 + M, 0 + M, 6 - M, 2 - M, PARK)  # le parc d'un seul tenant
    d.polygon([P(5.15, 0.15), P(5.8, 0.12), P(5.85, 0.6), P(5.5, 0.72), P(5.12, 0.55)], fill=WATER)  # l'étang
    # la rivière traverse toute l'image ; quais au nord et au sud
    for c in range(6):
        quad(d, c + M, 4 + M, c + 1 - M, 4.3, QUAY); quad(d, c + M, 4.7, c + 1 - M, 5 - M, QUAY)
    quad(d, -6, 4.3, 12, 4.7, WATER)
    for u in (2, 4):  # les deux ponts
        quad(d, u - M, 4.25, u + M, 4.75, '#77736e')
    for du in (0.26, 0.34, 0.42):  # voies ferrées arrivant du haut jusqu'à la gare
        d.line([P(du, -6), P(du, 1.22)], fill=RAIL, width=5)
    try:
        f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    except OSError:
        f = ImageFont.load_default()
    for i, (c, r, _, _) in enumerate(CELLS):
        x, y = P(c + 0.5, r + 0.5)
        d.ellipse([x - 26, y - 26, x + 26, y + 26], fill='white', outline='#333333', width=3)
        d.text((x, y), str(i + 1), fill='#222222', font=f, anchor='mm')
    im.save(path)


PROMPT = ('Image 1 is the STYLE reference. Image 2 is a LAYOUT SKETCH of a whole small French town seen from above in isometric view: '
          'grey = streets, beige = built city blocks, green = park, blue = river and pond, yellow = hay fields, light green = countryside and gardens, '
          'dark lines = railway tracks. Each numbered circle tells what its block contains (legend below).\n\n'
          'Paint image 2 as ONE finished, richly detailed illustration, in exactly the art style, colours, lighting and camera angle of image 1 '
          '(lush, cozy French small town, hand-painted, ivy and moss, warm daylight from the upper left).\n\n'
          'LAYOUT RULES: keep the layout of image 2 exactly. Every street, block, the river, the two bridges, the pond and the railway stay at the same '
          'position, with the same size and the same orientation as in the sketch. All streets are straight and run along the two diagonal directions. '
          'The picture fills the whole frame from edge to edge: no floating slab, no border, no empty background. Around the town: countryside with hay '
          'fields, haystacks, hedges and trees; the river continues to the edges of the image.\n\n'
          'CONTENT RULES: do NOT draw the numbered circles, and no text or label anywhere. The whole town is visible, so buildings are small: draw each one '
          'carefully (roofs, windows, awnings, trees, gardens). In every block the main building stands at the back of the block (upper side) and faces the '
          'lower left or the lower right. No people and no vehicles at this scale.\n\n'
          'LEGEND:\n')


def main():
    os.makedirs(OUT, exist_ok=True)
    draw_plan(f'{OUT}/plan.png')
    legend = '\n'.join(f'{i + 1}. {t}.' for i, (_, _, _, t) in enumerate(CELLS))
    L = ['# Carte mère de Meulebourg', '',
         'Une seule image de toute la ville. Elle fixe l\'angle, l\'échelle, les rues et la rivière ; elle est ensuite découpée en morceaux '
         'que Gemini agrandit un par un (dossier `03-morceaux`, rempli après cette étape).', '',
         '## Pièces jointes, dans cet ordre', '',
         '1. `00-references/diorama.jpg` (style)', '2. `02-carte-mere/plan.png` (plan schématique à respecter)', '',
         '## Prompt — format **1:1**, résolution la plus haute', '', '```', PROMPT + legend, '```', '',
         '## À vérifier avant de garder l\'image', '',
         '- La ville remplit toute l\'image, sans dalle flottante ni fond vide.',
         '- Les rues sont droites et en diagonale, la rivière traverse l\'image de gauche à droite en descendant, avec deux ponts.',
         '- Le parc (étang, kiosque) est à droite, la gare et les voies ferrées en haut, le port en bas.',
         '- Aucun numéro ni texte dans l\'image.', '',
         'Enregistre l\'image réussie dans ce dossier sous le nom `resultat.png`.', '']
    open(f'{OUT}/prompt.md', 'w').write('\n'.join(L))
    print('plan.png et prompt.md écrits dans', OUT)


if __name__ == '__main__':
    main()
