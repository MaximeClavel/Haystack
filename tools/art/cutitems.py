# Découpe une planche d'objets (fond blanc, objets en grille) en images séparées, sans leur ombre au sol.
# Usage : python3 tools/art/cutitems.py <planche.jpg> <dossier_sortie> <nom1,nom2,…>  (noms dans l'ordre de lecture)
import sys
import numpy as np
from PIL import Image
from collections import deque


def cut(src, out, names):
    im = np.array(Image.open(src).convert('RGB')).astype(np.int16); h, w, _ = im.shape
    # fond = pixels clairs et peu saturés (blanc + ombres grises) reliés au bord ; l'intérieur des objets,
    # entouré par le contour, n'est jamais atteint même s'il est blanc (toque, enveloppe…)
    light = ((im.max(axis=2) - im.min(axis=2)) < 34) & (im.mean(axis=2) > 168)
    seen = np.zeros((h, w), bool); q = deque()
    for x in range(0, w, 2): q.append((0, x)); q.append((h - 1, x))
    for y in range(0, h, 2): q.append((y, 0)); q.append((y, w - 1))
    while q:
        y, x = q.popleft()
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x] or not light[y, x]: continue
        seen[y, x] = True; q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    fg = ~seen
    lab = np.zeros((h, w), np.int32); n = 0; comps = []
    for y0 in range(0, h, 3):
        for x0 in range(0, w, 3):
            if fg[y0, x0] and not lab[y0, x0]:
                n += 1; q = deque([(y0, x0)]); cnt = 0; xs = [w, 0]; ys = [h, 0]
                while q:
                    y, x = q.popleft()
                    if y < 0 or x < 0 or y >= h or x >= w or lab[y, x] or not fg[y, x]: continue
                    lab[y, x] = n; cnt += 1
                    xs[0] = min(xs[0], x); xs[1] = max(xs[1], x); ys[0] = min(ys[0], y); ys[1] = max(ys[1], y)
                    q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
                if cnt > 4000: comps.append([xs[0], xs[1], ys[0], ys[1], n])
    # fusionner les petits morceaux d'un même objet (étincelles, ficelle…) avec le plus proche voisin
    comps.sort(key=lambda c: -(c[1] - c[0]) * (c[3] - c[2]))
    main = comps[:len(names)]
    for c in comps[len(names):]:
        cx, cy = (c[0] + c[1]) / 2, (c[2] + c[3]) / 2
        best = min(main, key=lambda m: abs((m[0] + m[1]) / 2 - cx) + abs((m[2] + m[3]) / 2 - cy))
        best.append(c[4]); best[0] = min(best[0], c[0]); best[1] = max(best[1], c[1]); best[2] = min(best[2], c[2]); best[3] = max(best[3], c[3])
    # ordre de lecture : par rangée puis de gauche à droite
    main.sort(key=lambda c: ((c[2] + c[3]) / 2) // (h / 4))
    rows = {}
    for c in main:
        rows.setdefault(int(((c[2] + c[3]) / 2) // (h / 3.2)), []).append(c)
    ordered = [c for k in sorted(rows) for c in sorted(rows[k], key=lambda c: c[0])]
    for name, c in zip(names, ordered):
        x0, x1, y0, y1 = c[:4]; labels = c[4:]
        m = np.isin(lab[y0:y1 + 1, x0:x1 + 1], labels)
        rgba = np.dstack([im[y0:y1 + 1, x0:x1 + 1].astype(np.uint8), (m * 255).astype(np.uint8)])
        Image.fromarray(rgba).save(f'{out}/{name}.png')
    return len(ordered)


if __name__ == '__main__':
    print(cut(sys.argv[1], sys.argv[2], sys.argv[3].split(',')))
