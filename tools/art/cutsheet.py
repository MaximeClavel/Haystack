# Détoure une planche de personnages sur fond blanc et enregistre chaque personnage (composantes connexes).
import numpy as np, sys
from PIL import Image
from collections import deque
src, out, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
im = np.array(Image.open(src).convert('RGB')).astype(np.int16); h, w, _ = im.shape
cand = np.abs(im - 255).sum(axis=2) < 60
seen = np.zeros((h, w), bool); q = deque()
for x in range(0, w, 2): q.append((0, x)); q.append((h - 1, x))
for y in range(0, h, 2): q.append((y, 0)); q.append((y, w - 1))
while q:
    y, x = q.popleft()
    if y < 0 or x < 0 or y >= h or x >= w or seen[y, x] or not cand[y, x]: continue
    seen[y, x] = True; q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
fg = ~seen
# ligne des ombres : la plus basse ligne où la silhouette est encore « pleine »
rows = fg.sum(axis=1); bottom = int(np.where(rows > 0)[0].max())
gray = (np.abs(im - im.mean(axis=2, keepdims=True)).sum(axis=2) < 25) & (im.mean(axis=2) > 150)
body = fg & ~gray
lab = np.zeros((h, w), np.int32); n = 0; comps = []
for y0 in range(0, h, 4):
    for x0 in range(0, w, 4):
        if body[y0, x0] and lab[y0, x0] == 0:
            n += 1; q = deque([(y0, x0)]); cnt = 0; x_min = w; x_max = 0; y_min = h; y_max = 0
            while q:
                y, x = q.popleft()
                if y < 0 or x < 0 or y >= h or x >= w or lab[y, x] or not body[y, x]: continue
                lab[y, x] = n; cnt += 1
                x_min = min(x_min, x); x_max = max(x_max, x); y_min = min(y_min, y); y_max = max(y_max, y)
                q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
            if cnt > 20000: comps.append((x_min, x_max, y_min, y_max, n))
comps.sort()
for i, (x0, x1, y0, y1, ln) in enumerate(comps):
    m = lab == ln
    sh = fg & gray; sh[:y1 - 40] = False; sh[:, :x0 - 30] = False; sh[:, x1 + 30:] = False
    a = ((m | sh) * 255).astype(np.uint8)
    sub = np.dstack([im.astype(np.uint8), a])[y0:min(h, y1 + 45), max(0, x0 - 30):x1 + 31]
    Image.fromarray(sub).save(f'{out}/{prefix}{i}.png')
print(src.split('/')[-1], len(comps))
