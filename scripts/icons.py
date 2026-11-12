# Builds the app icons from the ₹ coin (same shapes as ART.coin in src/ui.jsx): Android launcher icons (adaptive +
# legacy) and splash screens. Usage: python scripts/icons.py
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / 'android/app/src/main/res'
RED, INK, CREAM = '#E8130C', '#0D0D0D', '#F3ECD6'  # --red, --ink, --cream in src/index.css


def quad(p0, p1, p2, n=24):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / n for i in range(n + 1))]


def coin(px):
    """The coin on a transparent px*px square, drawn 4x and scaled down for smooth edges."""
    S = px * 4
    k = S / 100
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    w = round(4 * k)
    ring = lambda r, fill: d.ellipse([(50 - r - 2) * k, (50 - r - 2) * k, (50 + r + 2) * k, (50 + r + 2) * k], fill=fill, outline=INK, width=w)
    ring(40, RED)
    ring(29, CREAM)

    def stroke(pts):
        pts = [(x * k, y * k) for x, y in pts]
        d.line(pts, fill=INK, width=w, joint='curve')
        for x, y in (pts[0], pts[-1]):  # round caps
            d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=INK)
    stroke([(40, 36), (62, 36)])
    stroke([(40, 46), (62, 46)])
    stroke(quad((50, 36), (64, 38), (56, 50)) + quad((56, 50), (50, 56), (40, 56))[1:] + [(60, 70)])
    return im.resize((px, px), Image.LANCZOS)


def tile(px, coin_frac, radius=0.22):
    """Cream rounded square with the coin centred."""
    S = px * 4
    bg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(bg).rounded_rectangle((0, 0, S - 1, S - 1), int(S * radius), fill=CREAM)
    bg = bg.resize((px, px), Image.LANCZOS)
    c = coin(int(px * coin_frac))
    bg.alpha_composite(c, ((px - c.width) // 2, (px - c.height) // 2))
    return bg


DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for d, k in DENS.items():
    m = RES / f'mipmap-{d}'
    fg = Image.new('RGBA', (int(108 * k),) * 2, (0, 0, 0, 0))   # adaptive: coin inside the 66/108 safe zone
    c = coin(int(66 * k))
    fg.alpha_composite(c, ((fg.width - c.width) // 2,) * 2)
    fg.save(m / 'ic_launcher_foreground.png')
    tile(int(48 * k), 0.84).save(m / 'ic_launcher.png')
    tile(int(48 * k), 0.84, radius=0.5).save(m / 'ic_launcher_round.png')
(RES / 'values/ic_launcher_background.xml').write_text(
    f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">{CREAM}</color>\n</resources>')

# Splash: the icon, 40% of the short side, on the app's ink.
for f in RES.glob('drawable*/splash.png'):
    w, h = Image.open(f).size
    s = int(min(w, h) * 0.4)
    out = Image.new('RGBA', (w, h), INK)
    out.alpha_composite(tile(s, 0.84), ((w - s) // 2, (h - s) // 2))
    out.convert('RGB').save(f)
print('icons written')
