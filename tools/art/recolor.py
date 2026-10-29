# Variantes d'habitants à partir des personnages Gemini : recoloration par zones en gardant les ombres peintes.
# Usage : python3 tools/art/recolor.py <dossier contenant char0.png … char3.png> (prototype)
import numpy as np, colorsys, json, sys
from PIL import Image, ImageFilter
D = sys.argv[1]

def hsv(img):
    a = np.array(img.convert('RGB').convert('HSV')).astype(np.float32)
    return a[..., 0], a[..., 1], a[..., 2]

def band(shape, y0, y1, x0=0, x1=1):
    h, w = shape; m = np.zeros(shape, bool)
    m[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = True; return m

def clean(mask, k=3):
    im = Image.fromarray((mask * 255).astype(np.uint8))
    if k > 1:
        im = im.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))
    im = im.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.8))
    return np.array(im).astype(np.float32) / 255

def hue_in(H, a, b):  # degrés
    h = H * 360 / 255
    return (h >= a) & (h <= b) if a <= b else (h >= a) | (h <= b)

COL = {'red': '#d9493e', 'orange': '#ef8f3a', 'yellow': '#f2cd48', 'pink': '#f2a0b8', 'purple': '#9461b4', 'blue': '#4f97de',
       'navy': '#2e3f73', 'green': '#4ea25c', 'olive': '#9c9440', 'brown': '#8d5a38', 'beige': '#dcc79c', 'black': '#3a3534',
       'white': '#f4f1ea', 'grey': '#a3a6aa', 'skin1': '#fbd9bd', 'skin3': '#d79c72', 'skin4': '#b07048', 'skin5': '#7e4c30',
       'blond': '#e0b860', 'hblack': '#2a201c', 'hgrey': '#c8c3bd', 'hred': '#b8502a'}

def recolor(rgb, mask, target):
    r, g, b = (int(target[i:i + 2], 16) / 255 for i in (1, 3, 5))
    th, ts, tv = colorsys.rgb_to_hsv(r, g, b)
    a = np.array(Image.fromarray(rgb).convert('HSV')).astype(np.float32)
    v = a[..., 2]; sel = mask > .5
    if sel.sum() == 0: return rgb
    vref = np.percentile(v[sel], 80)
    nv = np.clip(v * (tv * 255) / max(vref, 1), 0, 255)
    nh = np.full_like(v, th * 255); ns = np.full_like(v, ts * 255)
    if ts < .12:  # cible grise ou blanche : garder un soupçon de la saturation d'origine
        ns = np.minimum(a[..., 1] * .25, 30)
    out = np.array(Image.fromarray(np.dstack([nh, ns, nv]).astype(np.uint8), 'HSV').convert('RGB')).astype(np.float32)
    m = mask[..., None]
    return (rgb * (1 - m) + out * m).astype(np.uint8)

def zones(name, img):
    H, Sa, V = hsv(img); sh = H.shape; A = np.array(img)[..., 3] > 0
    z = {}
    if name == 'baker':
        z['apron'] = clean(hue_in(H, 320, 12) & (Sa > 45) & (V > 130) & band(sh, .58, .98) & A)
        z['skirt'] = clean(hue_in(H, 200, 250) & (Sa > 60) & (V < 150) & band(sh, .6, 1) & A)
        z['skin'] = clean(hue_in(H, 8, 30) & (Sa > 30) & (Sa < 125) & (V > 175) & (band(sh, .2, .5) | (band(sh, .5, .78) & (Sa < 105))) & A, 1)
        z['hair'] = clean(hue_in(H, 10, 35) & (Sa > 70) & (V > 50) & (V < 165) & band(sh, .15, .5, 0, .62) & A)
    if name == 'cop':
        z['uniform'] = clean(hue_in(H, 205, 245) & (Sa > 60) & (V < 160) & A)
        z['skin'] = clean(hue_in(H, 8, 32) & (Sa > 45) & (Sa < 150) & (V > 160) & band(sh, .15, .45) & A, 1)
        z['hair'] = clean(hue_in(H, 10, 40) & (Sa > 60) & (V > 40) & (V < 140) & band(sh, .15, .42) & A)
    if name == 'tourist':
        z['shirt'] = clean(hue_in(H, 180, 225) & (Sa > 80) & (V > 100) & band(sh, .4, .8) & A)
        z['shorts'] = clean(hue_in(H, 31, 55) & (Sa > 30) & (Sa < 130) & (V > 130) & band(sh, .74, .92) & A)
        z['hatband'] = clean(hue_in(H, 180, 225) & (Sa > 80) & band(sh, 0, .32) & A)
        z['skin'] = clean(hue_in(H, 3, 29) & (Sa > 28) & (Sa < 170) & (V > 150) & (band(sh, .2, .56) | band(sh, .6, .74) | band(sh, .84, 1)) & A, 1)
    if name == 'thief':
        z['stripes'] = clean((V < 75) & (Sa < 110) & band(sh, .42, .67, .18, .8) & A, 5)
        z['beanie'] = clean((V < 80) & (Sa < 110) & band(sh, 0, .23) & A, 5)
        z['skin'] = clean(hue_in(H, 5, 30) & (Sa > 45) & (Sa < 160) & (V > 160) & band(sh, .2, .45) & A, 1)
    return z

def variant(name, img, changes):
    rgba = np.array(img); rgb = rgba[..., :3].copy()
    z = zones(name, img)
    for zone, col in changes.items():
        rgb = recolor(rgb, z[zone], COL[col])
    return Image.fromarray(np.dstack([rgb, rgba[..., 3]]))

VARIANTS = {
    'baker': [{}, {'apron': 'green', 'skirt': 'brown', 'hair': 'blond'}, {'apron': 'blue', 'skirt': 'red', 'hair': 'hblack'},
              {'apron': 'yellow', 'skirt': 'olive', 'hair': 'hred'}, {'apron': 'purple', 'skirt': 'black', 'hair': 'hgrey'}, {'apron': 'orange', 'skirt': 'navy', 'hair': 'hblack'}],
    'cop': [{}, {'uniform': 'green'}, {'uniform': 'grey', 'skin': 'skin4', 'hair': 'hblack'}, {'uniform': 'brown', 'skin': 'skin1', 'hair': 'blond'},
            {'uniform': 'red', 'skin': 'skin5'}, {'uniform': 'black', 'hair': 'hred'}],
    'tourist': [{}, {'shirt': 'red', 'shorts': 'navy'}, {'shirt': 'green', 'shorts': 'olive'}, {'shirt': 'yellow', 'hatband': 'red', 'shorts': 'grey'},
                {'shirt': 'purple', 'shorts': 'grey', 'hatband': 'purple'}, {'shirt': 'pink', 'shorts': 'brown'}],
    'thief': [{}, {'stripes': 'red'}, {'stripes': 'navy', 'beanie': 'navy', 'skin': 'skin4'}, {'stripes': 'green', 'beanie': 'green'},
              {'stripes': 'purple', 'skin': 'skin5'}, {'stripes': 'orange', 'beanie': 'brown', 'skin': 'skin3'}],
}
if __name__ == '__main__':
    names = ['baker', 'cop', 'tourist', 'thief']
    for i, n in enumerate(names):
        img = Image.open(f'{D}/char{i}.png').convert('RGBA')
        for j, ch in enumerate(VARIANTS[n]):
            variant(n, img, ch).save(f'{D}/{n}-{j}.png')
    print('ok')
