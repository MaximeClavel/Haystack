# Habitants chibis dessinés par le code (repère 100 x 140, pieds en y = 131), d'après la planche Gemini.
# Chaque habitant est une combinaison de pièces : corpulence, peau, cheveux, chapeau, haut, bas, accessoire, pose.
import random

OUT = '#4a3428'      # contour brun foncé
OW = 2.0

COLOR = {  # vocabulaire des 14 couleurs du jeu (src/art/palette.ts), légèrement réchauffé
    'red': '#d9493e', 'orange': '#ef8f3a', 'yellow': '#f2cd48', 'pink': '#f2a0b8', 'purple': '#9461b4',
    'blue': '#4f97de', 'navy': '#2e3f73', 'green': '#4ea25c', 'olive': '#9c9440', 'brown': '#8d5a38',
    'beige': '#dcc79c', 'black': '#3a3534', 'white': '#fbf7f0', 'grey': '#a3a6aa',
}
SKIN = ['#fbd9bd', '#f2c29a', '#e0a77c', '#b67a52', '#8a5636']
HAIR = ['#3a2a22', '#7a4a2a', '#a8643a', '#e3c27a', '#c8c3bd', '#1f1a1a']


def hx(c):
    c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def shade(c, f):
    return '#%02x%02x%02x' % tuple(max(0, min(255, round(v * f))) for v in hx(c))


def mix(a, b, t):
    A, B = hx(a), hx(b); return '#%02x%02x%02x' % tuple(round(A[i] + (B[i] - A[i]) * t) for i in range(3))


class Chibi:
    def __init__(self, uid, **kw):
        self.uid = uid; self.o = []; self.defs = []
        self.p = dict(body='normal', skin=SKIN[1], hair='short', hairc=HAIR[0], hat=None, hatc='navy', top='shirt',
                      topc='blue', bottom='trousers', bottomc='navy', apron=None, pose='idle', face='smile', scarf=None)
        self.p.update(kw)

    # -- primitives
    def path(self, d, fill, ol=True, extra=''):
        s = f' stroke="{OUT}" stroke-width="{OW}" stroke-linejoin="round" stroke-linecap="round"' if ol else ''
        self.o.append(f'<path d="{d}" fill="{fill}"{s}{extra}></path>')

    def line(self, d, color=OUT, w=1.4, extra=''):
        self.o.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"{extra}></path>')

    def circ(self, cx, cy, r, fill, ol=True):
        s = f' stroke="{OUT}" stroke-width="{OW}"' if ol else ''
        self.o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"{s}></circle>')

    def ell(self, cx, cy, rx, ry, fill, ol=True, extra=''):
        s = f' stroke="{OUT}" stroke-width="{OW}"' if ol else ''
        self.o.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"{s}{extra}></ellipse>')

    def limb(self, d, color, w=9.5):
        self.line(d, OUT, w + 2 * OW); self.line(d, color, w)

    # -- géométrie selon la corpulence
    def dims(self):
        b = self.p['body']
        sw, hw = {'slim': (13, 13), 'normal': (15, 16), 'plump': (17, 21), 'tall': (14, 15)}.get(b, (15, 16))
        return sw, hw

    def col(self, k):
        v = self.p[k]
        return COLOR.get(v, v) if isinstance(v, str) else v

    def draw(self):
        p = self.p; skin = p['skin']; sw, hw = self.dims()
        top, bot = 60, 98
        topc, botc = self.col('topc'), self.col('bottomc')
        pose = p['pose']
        self.ell(50, 131, 20, 4.4, '#3a2a20', False, ' opacity=".18"')
        # arrière-plan : sac, ballon, chignon, cheveux longs
        if pose == 'sack':
            self.path('M60 70Q56 46 72 42Q90 40 90 60Q90 78 74 80Q62 80 60 70Z', '#b88a58')
            self.path('M68 47q4 4 10 1', 'none'); self.line('M74 64l5 5M79 64l-5 5', shade('#b88a58', .7), 1.4)
        if pose == 'balloon':
            self.line('M66 74Q74 44 68 22', '#7a6a60', 1)
            self.path('M68 2Q80 2 80 13Q80 23 68 24Q56 23 56 13Q56 2 68 2Z', COLOR['red'])
            self.ell(63.5, 9, 2.6, 3.8, '#ffffff', False, ' opacity=".7"')
        hs = p['hair']
        if hs == 'bun':
            self.circ(36, 22, 8.5, p['hairc'])
        if hs == 'long':
            self.path('M28 40Q25 74 33 80L67 80Q75 74 72 40Z', p['hairc'])
        # jambes
        sneaky = pose == 'sack'
        legc = skin if p['bottom'] in ('shorts', 'skirt') else botc
        if sneaky:
            self.path('M41 96Q38 108 31 120Q30 124 33 125L39 126Q41 118 48 106L50 98Z', legc)
            self.path('M52 98Q58 110 63 120Q64 124 67 124L72 122Q70 112 62 96Z', shade(legc, .85))
            self.path('M24 126Q24 131 31 131L38 131Q41 131 40 127L38 123L27 123Q24 123 24 126Z', '#2b2224')
            self.path('M64 124Q64 129 71 129L77 128Q80 127 78 123L75 120L66 121Q64 121 64 124Z', '#2b2224')
        else:
            lw = 9.5 if p['body'] != 'plump' else 10.5
            self.path(f'M{50 - lw - 1} 96L{50 - lw - 1.5} 124Q{50 - lw - 1.5} 127 {50 - lw + 1.5} 127L47.5 127Q49.5 127 49.5 124L50 98Z', legc)
            self.path(f'M50 98L50.5 124Q50.5 127 52.5 127L{50 + lw - 1.5} 127Q{50 + lw + 1.5} 127 {50 + lw + 1.5} 124L{50 + lw + 1} 96Z', shade(legc, .87))
            if p['bottom'] == 'shorts':
                self.path(f'M{50 - hw - .5} 94L{50 + hw + .5} 94L{50 + hw + 1.5} 110L52 110L50 103L48 110L{50 - hw - 1.5} 110Z', botc)
                self.line('M50 96v7', shade(botc, .7), 1.2)
            shoe = '#8b5533' if p.get('sandals') else '#2e2626'
            self.path('M37 126Q37 131 43 131L48 131Q50.5 131 50 128L49.5 125L39 125Q37 125 37 126Z', shoe)
            self.path('M63 126Q63 131 57 131L52 131Q49.5 131 50 128L50.5 125L61 125Q63 125 63 126Z', shoe)
        # torse
        t = f'M{50 - sw} 72Q{50 - sw} {top + 2} {50 - sw + 10} {top}L{50 + sw - 10} {top}Q{50 + sw} {top + 2} {50 + sw} 72L{50 + hw} {bot}Q50 {bot + 4} {50 - hw} {bot}Z'
        fill = topc
        if p['top'] == 'striped':
            self.defs.append(f'<pattern id="st-{self.uid}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fbf7f0"></rect><rect width="6" height="3" fill="{topc}"></rect></pattern>')
            fill = f'url(#st-{self.uid})'
        if p['top'] == 'hawaiian':
            fc = '#f08a6a' if topc != COLOR['red'] else '#f2cd48'
            self.defs.append(f'<pattern id="hw-{self.uid}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="{topc}"></rect><circle cx="3.5" cy="3.5" r="2.4" fill="{fc}"></circle><circle cx="3.5" cy="3.5" r=".9" fill="#f2cd48"></circle><circle cx="10.5" cy="10.5" r="2.4" fill="#ffffff"></circle><circle cx="10.5" cy="10.5" r=".9" fill="#f2cd48"></circle><path d="M9 3q2-2 4 0q-2 2-4 0z" fill="#3f9a5a"></path></pattern>')
            fill = f'url(#hw-{self.uid})'
        if p['bottom'] == 'skirt':
            self.path(f'M{50 - hw} 90L{50 + hw} 90L{50 + hw + 5} 113Q50 117 {50 - hw - 5} 113Z', botc)
            self.line(f'M{50 - 6} 96l-2 15M{50 + 7} 96l2 15', shade(botc, .7), 1.2)
        self.path(t, fill)
        self.path(f'M{50 + sw - 7} {top + .5}Q{50 + sw} {top + 2} {50 + sw} 72L{50 + hw} {bot}Q{50 + hw - 3} {bot + 1.6} {50 + hw - 7} {bot + 1.4}Q{50 + sw - 1} 82 {50 + sw - 7} {top + .5}Z', '#3a2010', False, ' opacity=".13"')
        tp = p['top']
        if tp in ('shirt', 'hawaiian'):
            self.path('M43 60L50 69L57 60', '#ffffff' if tp == 'shirt' else fill)
            self.line('M50 69v26', shade(topc, .65), 1.2)
        if tp == 'blouse':
            self.path('M42 60Q50 66 58 60L56 64Q50 70 44 64Z', '#ffffff')
        if tp == 'uniform':
            self.path('M43 60L50 72L57 60', '#ffffff'); self.path('M48.5 64L51.5 64L51 74L49 74Z', shade(topc, .7), False)
            self.path(f'M{50 - hw + 1} 86L{50 + hw - 1} 86L{50 + hw - .5} 91L{50 - hw + .5} 91Z', '#2a2224')
            self.path('M47 86h6v5h-6z', '#e3b84a')
            for y in (76, 81):
                self.circ(45, y, 1, '#e3b84a', False); self.circ(55, y, 1, '#e3b84a', False)
            self.path('M38 68h7v5h-7z', shade(topc, .8))
        if tp == 'sweater':
            self.line(f'M{50 - hw + 1} {bot - 4}Q50 {bot} {50 + hw - 1} {bot - 4}', shade(topc, .7), 1.3)
        if tp == 'coat':
            self.line('M50 62L48 99', shade(topc, .62), 1.4)
            for y in (72, 82, 92):
                self.circ(52, y, 1.2, shade(topc, .55), False)
        if p['apron']:
            ac = COLOR.get(p['apron'], p['apron'])
            self.path(f'M42 68L58 68L58 78Q{50 + hw + 2} 80 {50 + hw + 3} 110Q50 114 {50 - hw - 3} 110Q{50 - hw - 2} 80 42 78Z', ac)
            self.line('M44 82Q50 84 56 82', shade(ac, .75), 1.2)
        if p.get('scarf'):
            sc = COLOR.get(p['scarf'], p['scarf'])
            self.path('M40 60Q50 67 60 60L58 65Q50 71 42 65Z', sc); self.path('M52 64l5 7-4 1-3-6z', sc)
        # bras + accessoires
        arm = topc if tp not in ('hawaiian',) else topc
        short = tp == 'hawaiian'
        L0, R0 = (50 - sw + 2, 66), (50 + sw - 2, 66)
        hands = []
        def arm2(a, b, c):
            d = f'M{a[0]} {a[1]}Q{b[0]} {b[1]} {c[0]} {c[1]}'
            if short:
                self.limb(d, skin, 8.5)
                self.limb(f'M{a[0]} {a[1]}Q{(a[0] + b[0]) / 2} {(a[1] + b[1]) / 2} {(a[0] + b[0]) / 2 + (b[0] - a[0]) * .1} {(a[1] + b[1]) / 2 + 2}', arm, 10)
            else:
                self.limb(d, arm, 9.5)
            hands.append(c)
        gloves = tp == 'uniform'
        if pose == 'baguette':
            arm2(L0, (34, 80), (42, 86)); arm2(R0, (68, 78), (60, 72))
            self.limb('M36 98L66 62', '#e3a85c', 9)
            self.line('M44 87l4 3M50 80l4 3M56 73l4 3', shade('#e3a85c', .72), 1.2)
        elif pose == 'wave':
            arm2(L0, (32, 80), (34, 92)); arm2(R0, (76, 58), (72, 40))
        elif pose == 'camera':
            arm2(L0, (32, 80), (42, 84)); arm2(R0, (68, 80), (58, 84))
            self.path('M38 76h24v12h-24z', '#3a3a40'); self.path('M42 73h7v3h-7z', '#3a3a40')
            self.circ(50, 82, 5, '#9aa0a8'); self.circ(50, 82, 2.2, '#3a3a40', False)
            self.line('M38 76Q36 66 42 61M62 76Q64 66 58 61', '#3a3a40', 1.2)
        elif pose == 'sack':
            arm2(L0, (34, 76), (40, 84)); arm2(R0, (70, 60), (66, 50))
        elif pose == 'balloon':
            arm2(L0, (32, 80), (34, 92)); arm2(R0, (70, 76), (66, 74))
        elif pose == 'bag':
            arm2(L0, (32, 80), (33, 92)); arm2(R0, (68, 80), (66, 92))
            self.path('M26 90h13l1 12h-15z', COLOR['brown']); self.line('M28 90q4-6 9 0', OUT, 1.4)
        elif pose == 'paper':
            arm2(L0, (34, 80), (40, 84)); arm2(R0, (66, 80), (60, 84))
            self.path('M36 74l26-2 2 16-26 2z', '#f4f0e6'); self.line('M40 78l18-1.4M40 82l18-1.4M40 86l12-1', '#9a948a', 1)
        else:
            arm2(L0, (32, 80), (34, 92)); arm2(R0, (68, 80), (66, 92))
        for (x, y) in hands:
            self.circ(x, y, 5.4, '#ffffff' if gloves else skin)
        # tête
        hc = p['hairc']
        self.ell(28.5, 44, 3.6, 4.6, skin); self.ell(71.5, 44, 3.6, 4.6, skin)
        self.ell(50, 40, 22, 21, skin)
        self.path('M64 22Q74 30 71 46Q68 58 56 61Q66 50 64 22Z', '#3a2010', False, ' opacity=".07"')
        if hs in ('short', 'bun', 'long'):
            self.path('M28 42Q25 17 50 16Q75 17 72 42Q69 29 60 27Q53 33 41 28Q32 31 28 42Z', hc)
            self.line('M40 21Q46 18 53 19', mix(hc, '#ffffff', .4), 1.6, ' opacity=".7"')
        if hs == 'bob':
            self.path('M27 52Q23 18 50 17Q77 18 73 52L68 52Q69 34 59 29Q49 35 38 29Q31 34 32 52Z', hc)
        if hs == 'curly':
            for (cx, cy, r) in ((32, 30, 7), (40, 21, 8), (50, 18, 8), (60, 21, 8), (68, 30, 7)):
                self.circ(cx, cy, r, hc)
        if hs == 'bald':
            self.path('M28 44Q27 36 31 33Q32 40 31 46Z', hc); self.path('M72 44Q73 36 69 33Q68 40 69 46Z', hc)
        # visage
        f = p['face']
        if f == 'happy':
            self.line('M37.5 46q3.6-3.6 7.2 0M55.3 46q3.6-3.6 7.2 0', '#2a1e1a', 1.8)
        elif f == 'sly':
            pass
        else:
            for x in (41, 59):
                self.ell(x, 45.5, 2.8, 3.6, '#2a1e1a', False)
                self.circ(x - .9, 44.2, 1.1, '#ffffff', False)
        if f != 'sly':
            self.line('M37 38.5q4-2 8 0M55 38.5q4-2 8 0', shade(hc, .8), 1.6)
        self.ell(35.5, 51.5, 4.2, 2.5, '#f08c8c', False, ' opacity=".45"'); self.ell(64.5, 51.5, 4.2, 2.5, '#f08c8c', False, ' opacity=".45"')
        self.line('M49 49.5q1.6 1.2 3 0', shade(skin, .7), 1.2)
        if f in ('smile', 'happy'):
            self.path('M45 54Q50 59.5 55 54Q50 56 45 54Z', '#a8443a', True)
        elif f == 'neutral':
            self.line('M46.5 55.5h7', '#7a3a30', 1.6)
        if p.get('mask'):
            self.path('M28 41Q50 35 72 41L71 49Q50 44 29 49Z', '#2a2426')
            for x in (41, 59):
                self.ell(x, 44.5, 4, 2.6, '#ffffff', False); self.circ(x + 1, 44.6, 1.4, '#2a1e1a', False)
            self.line('M37 39l8 2.4M63 39l-8 2.4', '#2a1e1a', 1.8)
            self.path('M44 54Q51 58 57 52Q51 55 44 54Z', '#a8443a', True)
        if p.get('moustache'):
            self.path('M41 53Q46 50 50 52.4Q54 50 59 53Q55 56 50 54.4Q45 56 41 53Z', shade(hc, .9))
        if p.get('glasses'):
            self.line('M35 45.5a5 5 0 1 0 12 0a5 5 0 1 0-12 0M53 45.5a5 5 0 1 0 12 0a5 5 0 1 0-12 0M47 45h6', '#3a3030', 1.3)
        # chapeaux
        h = p['hat']; hcol = COLOR.get(p['hatc'], p['hatc'])
        if h == 'toque':
            self.path('M31 28Q21 11 34 9Q38-1 50 2Q62-1 66 9Q79 11 69 28Z', '#ffffff')
            self.line('M42 10q-2 8 0 14M57 10q2 8 0 14', '#d8d2c8', 1.3)
            self.path('M29 24h42v9h-42z', '#ffffff')
        if h == 'kepi':
            self.path('M27 28Q25 13 50 11Q75 13 73 28Z', hcol); self.path('M28 24h44v5h-44z', shade(hcol, .6))
            self.path('M29 29Q50 37 71 29Q67 25 50 26Q33 25 29 29Z', '#1f1a1a'); self.circ(50, 18, 2.6, '#e3b84a')
        if h == 'straw':
            self.ell(50, 26, 33, 8.5, '#e6c47c'); self.path('M34 26Q34 7 50 7Q66 7 66 26Z', '#e6c47c')
            self.path('M34 18h32v6h-32z', COLOR['blue'], False); self.line('M38 12l3 12M48 9v14M58 11l-2 12', shade('#e6c47c', .8), 1)
        if h == 'beanie':
            self.path('M27 37Q25 13 50 12Q75 13 73 37Z', hcol); self.path('M26 30h48v9h-48z', shade(hcol, 1.25))
            self.line('M38 14v14M50 12v16M62 14v14', shade(hcol, .7), 1.1)
        if h == 'cap':
            self.path('M28 31Q27 14 50 13Q73 14 72 31Z', hcol); self.path('M62 30Q78 28 84 33Q76 37 62 34Z', shade(hcol, .8))
        if h == 'beret':
            self.path('M24 26Q30 12 52 12Q74 14 72 26Q50 31 24 26Z', hcol); self.circ(52, 11, 1.8, hcol)
        if h == 'bowler':
            self.ell(50, 27, 27, 5, hcol); self.path('M34 27Q33 8 50 8Q67 8 66 27Z', hcol); self.path('M34 22h32v4h-32z', shade(hcol, .6), False)
        g = ''.join(self.o)
        if p['body'] == 'kid':
            g = f'<g transform="translate(12.5 35) scale(.75)">{g}</g>'
        if p['body'] == 'tall':
            g = f'<g transform="translate(-2.5 -5) scale(1.05 1.04)">{g}</g>'
        return ''.join(self.defs), g


CAST = {
    'baker': dict(body='plump', skin=SKIN[1], hair='bun', hairc=HAIR[1], hat='toque', top='blouse', topc='white', bottom='skirt', bottomc='navy', apron='pink', scarf='pink', pose='baguette', face='happy'),
    'cop': dict(body='tall', skin=SKIN[1], hair='short', hairc=HAIR[0], hat='kepi', hatc='navy', top='uniform', topc='navy', bottom='trousers', bottomc='navy', pose='wave', face='neutral'),
    'tourist': dict(body='plump', skin=SKIN[1], hair='short', hairc=HAIR[0], hat='straw', top='hawaiian', topc='blue', bottom='shorts', bottomc='beige', sandals=True, pose='camera', face='smile'),
    'thief': dict(body='slim', skin=SKIN[1], hair='short', hairc=HAIR[0], hat='beanie', hatc='black', top='striped', topc='black', bottom='trousers', bottomc='black', pose='sack', face='sly', mask=True),
}


def random_villager(rng):
    tops = ['shirt', 'sweater', 'coat', 'striped', 'hawaiian', 'blouse', 'shirt', 'sweater']
    hats = [None, None, None, 'cap', 'beret', 'bowler', 'straw', 'beanie']
    hairs = ['short', 'bun', 'bob', 'long', 'curly', 'bald', 'short', 'bob']
    poses = ['idle', 'idle', 'bag', 'paper', 'balloon', 'camera', 'wave', 'idle']
    cols = list(COLOR)
    body = rng.choice(['slim', 'normal', 'normal', 'plump', 'tall', 'kid'])
    pose = rng.choice(poses)
    if body != 'kid' and pose == 'balloon':
        pose = 'idle'
    top = rng.choice(tops)
    hair = rng.choice(hairs)
    return dict(body=body, skin=rng.choice(SKIN), hair=hair, hairc=rng.choice(HAIR if body != 'kid' else HAIR[:4]),
                hat=rng.choice(hats), hatc=rng.choice(cols), top=top, topc=rng.choice([c for c in cols if c != 'white'] if top == 'striped' else cols),
                bottom=rng.choice(['trousers', 'trousers', 'skirt', 'shorts']), bottomc=rng.choice(['navy', 'black', 'brown', 'beige', 'grey', 'olive', 'blue', 'red']),
                pose=pose, face=rng.choice(['smile', 'happy', 'neutral', 'smile']), glasses=rng.random() < .15, moustache=rng.random() < .12 and hair in ('short', 'bald'))


def symbol(uid, spec):
    defs, g = Chibi(uid, **spec).draw()
    return defs, f'<symbol id="{uid}" viewBox="0 0 100 140">{g}</symbol>'
