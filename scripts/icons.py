# Builds every app icon from resources/logo-source.jpg: Android launcher icons (adaptive + legacy), splash
# screens, the in-app header logo (public/logo.png) and the favicon. Usage: python scripts/icons.py
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / 'android/app/src/main/res'
src = Image.open(ROOT / 'resources/logo-source.jpg').convert('RGB')
W, H = src.size
# The ornament (bow to ball, measured on the source): what every icon frames.
CX, CY = 368, 715   # middle of bow top (y 322) and ball bottom (y ~1110)
BG = '#337346'      # average of the green cloth, for the adaptive icon background layer

# Green cloth beyond the photo's edges: a clean corner patch, mirror-tiled so it has no seams.
patch = src.crop((0, 0, 300, 300))
tile = Image.new('RGB', (600, 600))
tile.paste(patch, (0, 0))
tile.paste(patch.transpose(Image.FLIP_LEFT_RIGHT), (300, 0))
tile.paste(patch.transpose(Image.FLIP_TOP_BOTTOM), (0, 300))
tile.paste(patch.transpose(Image.ROTATE_180), (300, 300))

# Photo edges fade into the cloth instead of showing a hard seam.
fade = Image.new('L', (W, H), 0)
ImageDraw.Draw(fade).rectangle((40, 40, W - 41, H - 41), fill=255)
fade = fade.filter(ImageFilter.GaussianBlur(20))


def frame(side):
    """Square of `side` source pixels centred on the ornament."""
    out = Image.new('RGB', (side, side))
    for x in range(0, side, 600):
        for y in range(0, side, 600):
            out.paste(tile, (x, y))
    out.paste(src, (side // 2 - CX, side // 2 - CY), fade)
    return out


def rounded(img, r=0.22):
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width - 1, img.height - 1), int(img.width * r), fill=255)
    out = img.convert('RGBA')
    out.putalpha(mask)
    return out


def circle(img):
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, img.width - 1, img.height - 1), fill=255)
    out = img.convert('RGBA')
    out.putalpha(mask)
    return out


big = frame(880)         # legacy icons, splash, header: ornament fills ~90%
adaptive = frame(1320)   # adaptive foreground: ornament inside the 66/108 safe zone
DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for d, k in DENS.items():
    m = RES / f'mipmap-{d}'
    adaptive.resize((int(108 * k),) * 2, Image.LANCZOS).save(m / 'ic_launcher_foreground.png')
    rounded(big.resize((int(48 * k),) * 2, Image.LANCZOS)).save(m / 'ic_launcher.png')
    circle(big.resize((int(48 * k),) * 2, Image.LANCZOS)).save(m / 'ic_launcher_round.png')
(RES / 'values/ic_launcher_background.xml').write_text(
    f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">{BG}</color>\n</resources>')

# Splash: the rounded icon, 40% of the short side, on the app's ink.
for f in RES.glob('drawable*/splash.png'):
    w, h = Image.open(f).size
    s = int(min(w, h) * 0.4)
    out = Image.new('RGB', (w, h), '#0D0D0D')
    icon = rounded(big.resize((s, s), Image.LANCZOS))
    out.paste(icon, ((w - s) // 2, (h - s) // 2), icon)
    out.save(f)

rounded(big.resize((192, 192), Image.LANCZOS)).save(ROOT / 'public/logo.png')
rounded(big.resize((64, 64), Image.LANCZOS)).save(ROOT / 'public/favicon.png')
print('icons written')
