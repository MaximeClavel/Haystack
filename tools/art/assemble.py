# Assemble des habitants : bases Gemini (couleurs repères) recolorées + chapeaux pris sur la planche d'origine.
import numpy as np, colorsys, random, sys
from PIL import Image, ImageOps, ImageFilter
sys.path.insert(0, sys.argv[1])
from recolor import recolor, clean, hue_in, COL
B, R, OUT = sys.argv[2], sys.argv[3], sys.argv[4]

def hsv(a):
    x = np.array(Image.fromarray(a[..., :3]).convert('HSV')).astype(np.float32)
    return x[..., 0], x[..., 1], x[..., 2]

def skin_mask(a):
    H, S, V = hsv(a)
    return hue_in(H, 5, 35) & (S > 45) & (S < 190) & (V > 75) & (a[..., 3] > 0)

def face_top(a):
    m = skin_mask(a); h, w = m.shape
    mid = m[:, int(w * .25):int(w * .75)]
    rows = np.where(mid.sum(axis=1) > max(6, w * .04))[0]
    return int(rows[0]) if len(rows) else int(h * .2)

def head_width(a, y):
    m = skin_mask(a)
    cols = np.where(m[y:y + max(4, a.shape[0] // 40)].any(axis=0))[0]
    return (int(cols.min()), int(cols.max())) if len(cols) else (0, a.shape[1])

# chapeaux : bande haute de chaque personnage d'origine (hauteurs relevées à la main)
HAT_CUT = {'toque': .265, 'kepi': .2, 'straw': .27, 'beanie': .175}
FOREHEAD = {'toque': .42, 'kepi': .5, 'straw': .55, 'beanie': .58}   # bas du chapeau, en largeurs de tête sous le sommet du crâne

def alpha_width(a, y):
    cols = np.where(a[int(y), :, 3] > 0)[0]
    return (int(cols.min()), int(cols.max())) if len(cols) else (0, a.shape[1])

def largest(mask):
    """Plus grande composante connexe (4-voisinage)."""
    from collections import deque
    h, w = mask.shape; lab = np.zeros((h, w), np.int32); best, bestn = 0, 0; n = 0
    for y0 in range(h):
        for x0 in range(w):
            if mask[y0, x0] and not lab[y0, x0]:
                n += 1; q = deque([(y0, x0)]); cnt = 0
                while q:
                    y, x = q.popleft()
                    if y < 0 or x < 0 or y >= h or x >= w or lab[y, x] or not mask[y, x]: continue
                    lab[y, x] = n; cnt += 1; q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
                if cnt > bestn: best, bestn = n, cnt
    return lab == best

hats = {}
for i, name in enumerate(['toque', 'kepi', 'straw', 'beanie']):
    a = np.array(Image.open(f'{R}/char{i}.png').convert('RGBA'))
    h = a.shape[0]; cut = int(h * HAT_CUT[name])
    crop = a[:cut].copy()
    H_, S_, V_ = hsv(crop)
    if name == 'toque':
        keep = (S_ < 55) & (V_ > 140)
    elif name == 'kepi':
        keep = (hue_in(H_, 195, 255) & (S_ > 50) & (V_ < 190)) | (V_ < 60) | (hue_in(H_, 35, 60) & (S_ > 90))
    elif name == 'straw':
        keep = (hue_in(H_, 28, 62) & (S_ > 22) & (V_ > 95)) | (hue_in(H_, 185, 225) & (S_ > 50))
    else:
        keep = (V_ < 95) & (S_ < 120)
    keep &= crop[..., 3] > 0
    km = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    ring = np.array(km.filter(ImageFilter.MaxFilter(9))) > 0
    dark = V_ < 110
    final = (np.array(km) > 0) | (ring & dark)
    crop[..., 3] = np.where(final, crop[..., 3], 0)
    crop[..., 3] = np.where(largest(crop[..., 3] > 0), crop[..., 3], 0)
    ys, xs = np.where(crop[..., 3] > 0)
    crop = crop[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    x0, x1 = alpha_width(a, cut + h * .05)
    hats[name] = (crop, crop.shape[1] / max(1, x1 - x0))
    Image.fromarray(crop).save(f'{OUT}/hat-{name}.png')

def put_hat(a, name):
    crop, ratio = hats[name]
    H = a.shape[0]; top = int(np.where(a[..., 3].max(axis=1) > 0)[0][0])
    x0, x1 = alpha_width(a, top + H * .08); hw0 = x1 - x0
    x0, x1 = alpha_width(a, top + hw0 * .5); hw = x1 - x0
    tw = int(hw * ratio); th = int(crop.shape[0] * tw / crop.shape[1])
    hat = Image.fromarray(crop).resize((tw, th), Image.LANCZOS)
    pad = th + 10
    base = Image.new('RGBA', (a.shape[1] + 2 * tw, H + pad), (0, 0, 0, 0))
    base.alpha_composite(Image.fromarray(a), (tw, pad))
    cx = tw + (x0 + x1) // 2
    bottom = pad + top + int(hw * FOREHEAD[name])
    base.alpha_composite(hat, (cx - tw // 2, bottom - th))
    arr = np.array(base); ys, xs = np.where(arr[..., 3] > 0)
    return arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

def variant(a, top, bottom, hat):
    H, S, V = hsv(a); A = a[..., 3] > 0
    mt = clean(hue_in(H, 75, 160) & (S > 90) & (V > 60) & A)
    mb = clean(hue_in(H, 190, 232) & (S > 90) & (V > 60) & A)
    rgb = a[..., :3].copy()
    rgb = recolor(rgb, mt, COL[top]); rgb = recolor(rgb, mb, COL[bottom])
    out = np.dstack([rgb, a[..., 3]])
    return put_hat(out, hat) if hat else out

if __name__ == '__main__':
    rng = random.Random(4)
    tops = ['red', 'orange', 'yellow', 'pink', 'purple', 'blue', 'navy', 'green', 'olive', 'brown', 'beige', 'white', 'grey', 'black']
    bots = ['navy', 'black', 'brown', 'beige', 'grey', 'olive', 'blue', 'red', 'green']
    hatsel = [None, None, 'straw', 'beanie', 'kepi', 'toque']
    for b in range(6):
        a = np.array(Image.open(f'{B}/base{b}.png').convert('RGBA'))
        for v in range(5):
            if v == 0:
                img = a
            else:
                img = variant(a, rng.choice(tops), rng.choice(bots), hatsel[(b + v) % len(hatsel)])
            Image.fromarray(img).save(f'{OUT}/b{b}-{v}.png')
    print('ok')
