# Habille un personnage de base Gemini : recoloration, chapeau, lunettes/masque, objet tenu en main, bulle d'émotion.
# Les points d'accroche (sommet du crâne, largeur de tête, yeux, mains) sont détectés automatiquement sur l'image.
import numpy as np, colorsys
from PIL import Image, ImageFilter, ImageOps

COL = {'red': '#d9493e', 'orange': '#ef8f3a', 'yellow': '#f2cd48', 'pink': '#f2a0b8', 'purple': '#9461b4', 'blue': '#4f97de',
       'navy': '#2e3f73', 'green': '#4ea25c', 'olive': '#9c9440', 'brown': '#8d5a38', 'beige': '#dcc79c', 'black': '#3a3534',
       'white': '#f4f1ea', 'grey': '#a3a6aa'}


def hsv(a):
    x = np.array(Image.fromarray(a[..., :3]).convert('HSV')).astype(np.float32)
    return x[..., 0], x[..., 1], x[..., 2]


def hue_in(H, a, b):
    h = H * 360 / 255
    return (h >= a) & (h <= b) if a <= b else (h >= a) | (h <= b)


def soft(mask, k=3):
    im = Image.fromarray((mask * 255).astype(np.uint8))
    im = im.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.8))
    return np.array(im).astype(np.float32) / 255


def recolor(rgb, mask, target):
    r, g, b = (int(target[i:i + 2], 16) / 255 for i in (1, 3, 5))
    th, ts, tv = colorsys.rgb_to_hsv(r, g, b)
    a = np.array(Image.fromarray(rgb).convert('HSV')).astype(np.float32); v = a[..., 2]; sel = mask > .5
    if sel.sum() == 0: return rgb
    vref = np.percentile(v[sel], 80)
    nv = np.clip(v * (tv * 255) / max(vref, 1), 0, 255)
    ns = np.full_like(v, ts * 255) if ts >= .12 else np.minimum(a[..., 1] * .25, 30)
    out = np.array(Image.fromarray(np.dstack([np.full_like(v, th * 255), ns, nv]).astype(np.uint8), 'HSV').convert('RGB')).astype(np.float32)
    m = mask[..., None]
    return (rgb * (1 - m) + out * m).astype(np.uint8)


def recolor_outfit(a, top=None, bottom=None):
    H, S, V = hsv(a); A = a[..., 3] > 0; rgb = a[..., :3].copy()
    if top: rgb = recolor(rgb, soft(hue_in(H, 75, 160) & (S > 90) & (V > 60) & A), COL[top])
    if bottom: rgb = recolor(rgb, soft(hue_in(H, 190, 232) & (S > 90) & (V > 60) & A), COL[bottom])
    return np.dstack([rgb, a[..., 3]])


def anchors(a):
    """Points d'accroche d'un personnage debout, vu de trois-quarts face."""
    H_, S_, V_ = hsv(a); A = a[..., 3] > 0; h, w = A.shape
    skin = hue_in(H_, 5, 35) & (S_ > 45) & (S_ < 190) & (V_ > 70) & A
    top = int(np.where(A.any(axis=1))[0][0])
    def width(y):
        c = np.where(A[int(min(h - 1, y))])[0]; return (int(c.min()), int(c.max())) if len(c) else (0, w)
    x0, x1 = width(top + h * .08); hw0 = x1 - x0
    x0, x1 = width(top + hw0 * .5); hw = x1 - x0
    # yeux : pixels sombres encadrés de peau à gauche et à droite, dans la tête
    d = int(max(4, hw * .05)); y_hi = int(top + hw * 1.3)
    dark = (V_ < 75)
    cand = np.zeros_like(dark)
    cand[:, d:-d] = dark[:, d:-d] & skin[:, :-2 * d] & skin[:, 2 * d:]
    cand[:top] = False; cand[y_hi:] = False
    ys, xs = np.where(cand)
    if len(ys) > 10:
        eye_y, cx = float(np.median(ys)), float(np.median(xs))
    else:
        eye_y, cx = top + hw * .62, (x0 + x1) / 2
    # mains : peau aux extrémités gauche et droite, entre 40 % et 70 % de la hauteur
    band = skin.copy(); band[:int(top + (h - top) * .38)] = False; band[int(top + (h - top) * .7):] = False
    ys, xs = np.where(band)
    if len(xs) > 20:
        lo, hi = np.percentile(xs, 12), np.percentile(xs, 88)
        L = (float(xs[xs <= lo].mean()), float(ys[xs <= lo].mean())); R = (float(xs[xs >= hi].mean()), float(ys[xs >= hi].mean()))
    else:
        L = R = (w / 2, top + (h - top) * .55)
    return dict(top=top, hw=hw, cx=cx, eye=eye_y, L=L, R=R, H=h - top, w=w, h=h)


# taille relative et point de prise (fraction de la boîte de l'objet)
HAT = {  # largeur en largeurs de tête, bas du chapeau en largeurs de tête sous le sommet du crâne
    'cap': (1.05, .40), 'beret': (1.12, .33), 'bowler': (1.12, .40), 'tophat': (1.08, .40), 'beanie': (1.0, .47),
    'fedora': (1.4, .42), 'construction': (1.1, .46), 'bike': (1.12, .44), 'chef': (.98, .36), 'kepi': (.95, .42),
    'boater': (1.35, .40), 'sunhat': (1.75, .45)}
HELD = {  # hauteur (fraction de la taille du personnage), point de prise
    'handbag': (.17, (.45, .08)), 'briefcase': (.16, (.52, .05)), 'suitcase': (.34, (.55, .03)), 'umbrella': (.42, (.68, .96)),
    'umbrella-closed': (.4, (.2, .92)), 'cane': (.47, (.88, .06)), 'balloon': (.3, (.5, .99)), 'newspaper': (.15, (.5, .55)),
    'flowers': (.22, (.35, .9)), 'icecream': (.15, (.5, .9)), 'baguette': (.28, (.45, .62)), 'moneybag': (.19, (.55, .12)),
    'painting': (.24, (.5, .55)), 'flashlight': (.1, (.75, .55)), 'camera': (.11, (.5, .5)), 'cake': (.12, (.5, .4)),
    'box': (.22, (.5, .5)), 'bottle': (.16, (.5, .6)), 'key': (.1, (.8, .15)), 'knife': (.14, (.15, .85)), 'map': (.14, (.5, .5)),
    'letter': (.09, (.3, .6)), 'jewel': (.08, (.5, .5)), 'crowbar': (.3, (.15, .9)), 'rope': (.15, (.5, .3)), 'phone': (.09, (.5, .7)),
    'needle': (.12, (.2, .9))}


def load(items, name):
    g = Image.open(f'{items}/{name}.png').convert('RGBA')
    if name in ('hat-bike', 'acc-mask'):  # vides intérieurs (sangles, trous des yeux) : rendre transparent le blanc enfermé
        a = np.array(g); H_, S_, V_ = hsv(a)
        a[..., 3] = np.where((V_ > 225) & (S_ < 28), 0, a[..., 3]); g = Image.fromarray(a)
    return g


def dress(a, items, top=None, bottom=None, hat=None, face=None, held=None, hand='R', emote=None, dog=False):
    a = recolor_outfit(a, top, bottom)
    k = anchors(a)
    pad = int(k['h'] * .45)
    canvas = Image.new('RGBA', (k['w'] + 2 * pad, k['h'] + pad), (0, 0, 0, 0))
    ox, oy = pad, pad
    def put(img, x, y):  # x, y : coin haut gauche dans le repère du personnage
        canvas.alpha_composite(img, (int(ox + x), int(oy + y)))
    if held == 'umbrella':  # parapluie ouvert : la toile au-dessus de la tête, le manche passe derrière le corps
        g = load(items, 'it-umbrella'); tw = k['hw'] * 2.6
        g = g.resize((int(tw), int(g.height * tw / g.width)), Image.LANCZOS)
        put(g, k['cx'] - g.width * .42, k['top'] - g.height * .22)
        held = None
    canvas.alpha_composite(Image.fromarray(a), (ox, oy))
    if held == 'balloon':  # ballon : flotte au-dessus de la main, ficelle tracée jusqu'à la main
        from PIL import ImageDraw
        g = load(items, 'it-balloon'); th = k['H'] * .22
        g = g.resize((int(g.width * th / g.height), int(th)), Image.LANCZOS)
        hx, hy = k[hand]; bx, by = hx + k['hw'] * .35, k['top'] - k['H'] * .02
        ImageDraw.Draw(canvas).line([(ox + hx, oy + hy), (ox + bx, oy + by + g.height * .9)], fill=(70, 50, 40, 255), width=max(2, int(k['H'] / 300)))
        put(g, bx - g.width * .5, by)
        held = None
    if face:
        g = load(items, f'acc-{face}')
        gw = k['hw'] * (.78 if face == 'mask' else .66)
        g = g.resize((int(gw), int(g.height * gw / g.width)), Image.LANCZOS)
        put(g, k['cx'] - g.width * .5, k['eye'] - g.height * (.5 if face == 'mask' else .42))
    if hat:
        wr, br = HAT[hat]; g = load(items, f'hat-{hat}')
        tw = k['hw'] * wr; g = g.resize((int(tw), int(g.height * tw / g.width)), Image.LANCZOS)
        put(g, k['cx'] - g.width / 2, k['top'] + k['hw'] * br - g.height)
    if held:
        hr, (gx, gy) = HELD[held]; g = load(items, f'it-{held}' if not held in ('handbag', 'briefcase', 'suitcase', 'cane') else f'acc-{held}')
        th = k['H'] * hr; g = g.resize((int(g.width * th / g.height), int(th)), Image.LANCZOS)
        hx, hy = k[hand]
        if hand == 'L': g = ImageOps.mirror(g); gx = 1 - gx
        put(g, hx - g.width * gx, hy - g.height * gy)
    if dog:
        g = load(items, 'it-dog'); th = k['H'] * .22; g = g.resize((int(g.width * th / g.height), int(th)), Image.LANCZOS)
        put(g, k['w'] * .55, k['h'] - g.height * .95)
    if emote:
        g = load(items, f'em-{emote}'); tw = k['hw'] * .8; g = g.resize((int(tw), int(g.height * tw / g.width)), Image.LANCZOS)
        put(g, k['cx'] + k['hw'] * .3, k['top'] - g.height * .95)
    arr = np.array(canvas); ys, xs = np.where(arr[..., 3] > 0)
    return Image.fromarray(arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]), k
