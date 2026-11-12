# Découpe la carte mère en morceaux carrés qui se chevauchent, à faire agrandir un par un par Gemini.
# Usage : python3 tools/art/morceaux.py <carte_mere.jpg> <dossier_sortie> [rangée-colonne …]   (ex. 1-2 1-3 ; sans liste : tous)
import os, sys
from PIL import Image

N = 4          # morceaux par côté
OVERLAP = 0.35  # part d'un morceau partagée avec son voisin


def boxes(size):
    """Position (x, y, côté) de chaque morceau, par (rangée, colonne) à partir de 1."""
    side = round(size / (N - (N - 1) * OVERLAP)); step = (size - side) / (N - 1)
    return {(r + 1, c + 1): (round(c * step), round(r * step), side) for r in range(N) for c in range(N)}


def main():
    src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
    im = Image.open(src).convert('RGB'); B = boxes(im.width)
    want = [tuple(int(v) for v in a.split('-')) for a in sys.argv[3:]] or sorted(B)
    for k in want:
        x, y, s = B[k]
        # agrandi deux fois (net) : Gemini suit mieux un modèle de bonne taille
        im.crop((x, y, x + s, y + s)).resize((2 * s, 2 * s), Image.LANCZOS).save(f'{out}/morceau-{k[0]}-{k[1]}.png')
        print(k, (x, y, s))


if __name__ == '__main__':
    main()
