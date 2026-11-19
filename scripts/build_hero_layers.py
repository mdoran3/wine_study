#!/usr/bin/env python3
"""Cut the home-page hero photo into depth layers for the parallax.

Writes web/public/hero-<layer>.webp (and -mobile) for: land, mid, front. The existing hero.webp is
the full photo and stays the back layer (sky). Each layer is the ORIGINAL pixels with an alpha mask, so
stacking them at rest reproduces the photo exactly, and when they move at different speeds the layer
behind always has real picture content to show.

Layers (back to front):  sky = hero.webp (the whole photo)
                         land  = everything below the ridge line (distant hills and below)
                         mid   = below the distant hills: trees, winery, fields
                         front = the foreground slope and vine rows

The boundaries are traced by eye on the 1280px-wide photo (the coordinates below), then feathered.
Needs: pillow, numpy, and the cwebp binary. Reads web/public/hero.webp; run build_hero.py first.
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(__file__)
PUBLIC = os.path.join(HERE, '..', 'web', 'public')
SRC = os.path.join(PUBLIC, 'hero.webp')
REF_W = 1280          # the coordinate system the lines were traced in
W_OUT = 2048          # layer resolution

# ridge: where the dark distant hills meet the sky
RIDGE = [(0, 292), (40, 288), (100, 280), (200, 272), (330, 271), (430, 272), (520, 281), (575, 282), (600, 270),
         (650, 258), (720, 256), (800, 265), (860, 270), (905, 262), (925, 254), (1000, 250), (1100, 248), (1280, 250)]
# bottom of the distant-hills band: below this line everything is "mid ground"
MID_TOP = [(0, 352), (150, 350), (300, 342), (450, 345), (600, 345), (700, 338), (800, 332), (1000, 328), (1280, 325)]
# near/far split: the road and embankment on the left, the first rows of vines in the middle and right
FRONT_TOP = [(0, 503), (200, 472), (400, 441), (560, 417), (650, 395), (720, 392), (800, 408), (1000, 424), (1280, 458)]


def line_mask(size, pts, scale, feather):
    """Alpha = 1 below the polyline, 0 above, with a soft edge."""
    w, h = size
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    poly = [(x * scale, y * scale) for x, y in pts]
    d.polygon([(0, h)] + [(0, poly[0][1])] + poly + [(w, poly[-1][1]), (w, h)], fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather)) if feather else m


def save(im_rgba, name, width, quality):
    out = im_rgba.resize((width, round(im_rgba.height * width / im_rgba.width)), Image.LANCZOS)
    tmp = os.path.join(PUBLIC, name + '.png')
    out.save(tmp)
    subprocess.run(['cwebp', '-q', str(quality), '-alpha_q', '85', '-quiet', tmp, '-o', os.path.join(PUBLIC, name + '.webp')], check=True)
    os.remove(tmp)
    return os.path.getsize(os.path.join(PUBLIC, name + '.webp')) // 1024


def main(debug_dir=None):
    photo = Image.open(SRC).convert('RGB')
    photo = photo.resize((W_OUT, round(W_OUT * photo.height / photo.width)), Image.LANCZOS)
    W, H = photo.size
    s = W / REF_W
    a = np.asarray(photo).astype(np.float32)

    land = np.asarray(line_mask((W, H), RIDGE, s, 1.4)).astype(np.float32) / 255

    # mid ground: below MID_TOP, plus anything under the ridge that is not blue-grey hill
    # (the trees, houses and the winery that stand in front of the hills)
    blue = (a[..., 2] - a[..., 0]) > 6
    not_hill = Image.fromarray(((~blue) * 255).astype(np.uint8))
    not_hill = not_hill.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    band = np.asarray(line_mask((W, H), RIDGE, s, 0)).astype(np.float32) / 255
    mid_top = np.asarray(line_mask((W, H), MID_TOP, s, 0)).astype(np.float32) / 255
    # only trust the colour rule in a band just above the mid-ground line
    near = np.zeros((H, W), np.float32)
    for x in range(W):
        yt = np.interp(x / s, [p[0] for p in MID_TOP], [p[1] for p in MID_TOP]) * s
        near[int(max(0, yt - 30 * s)):int(yt), x] = 1
    mid = np.maximum(mid_top, band * (np.asarray(not_hill).astype(np.float32) / 255) * near)
    mid = np.asarray(Image.fromarray((mid * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255
    mid = mid * land                                    # never above the ridge

    front = np.asarray(line_mask((W, H), FRONT_TOP, s, 26 * s / 1.6)).astype(np.float32) / 255
    front = np.minimum(front, mid)                      # front lives inside mid

    # Each layer only has to exist down to just past the top edge of the layer in front of it: the layer
    # in front is fully opaque below that, and (because nearer layers drift less) never uncovers more
    # of the one behind. So each cut-out keeps a band below its own edge and the rest is transparent,
    # which makes the files much smaller without changing anything that can be seen.
    def below(pts, extra):
        return np.asarray(line_mask((W, H), [(x, y + extra) for x, y in pts], s, 2.0)).astype(np.float32) / 255
    land = land * (1 - below(MID_TOP, 45))
    mid = mid * (1 - below(FRONT_TOP, 90))

    layers = {'land': land, 'mid': mid, 'front': front}
    sizes = {}
    for name, alpha in layers.items():
        rgba = np.dstack([a, alpha[..., None] * 255]).astype(np.uint8)
        im = Image.fromarray(rgba, 'RGBA')
        sizes[name] = (save(im, f'hero-{name}', 2048, 74), save(im, f'hero-{name}-mobile', 1100, 70))
        if debug_dir:
            os.makedirs(debug_dir, exist_ok=True)
            im.save(os.path.join(debug_dir, f'{name}.png'))
    print('layer sizes KB (desktop, mobile):', sizes)

    # check: stacking the layers at rest reproduces the photo
    comp = a.copy()
    for alpha in (land, mid, front):
        comp = comp * (1 - alpha[..., None]) + a * alpha[..., None]
    print('stacked vs original, max pixel difference:', float(np.abs(comp - a).max()))

    if debug_dir:
        # a simulated scroll frame: each layer shifted by its own amount (px at 2048 wide)
        def shifted(arr, dy):
            out = np.zeros_like(arr)
            out[dy:] = arr[:H - dy] if dy else arr
            if dy: out[:dy] = arr[0]
            return out
        for tag, k in (('mid_scroll', 1.0), ('far_scroll', 1.8)):
            base = shifted(a, int(70 * k))
            for alpha, dy in ((land, 52), (mid, 34), (front, 14)):
                al = shifted(alpha[..., None], int(dy * k)); src = shifted(a, int(dy * k))
                base = base * (1 - al) + src * al
            Image.fromarray(base.astype(np.uint8)).resize((1280, round(1280 * H / W))).save(os.path.join(debug_dir, tag + '.png'))
        # masks as colour overlay
        ov = a.copy()
        for alpha, col in ((land, (0, 90, 255)), (mid, (0, 200, 90)), (front, (255, 60, 40))):
            ov = ov * (1 - 0.38 * alpha[..., None]) + np.array(col, np.float32) * 0.38 * alpha[..., None]
        Image.fromarray(ov.astype(np.uint8)).resize((1280, round(1280 * H / W))).save(os.path.join(debug_dir, 'overlay.png'))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
