#!/usr/bin/env python3
"""Render shaded-relief images for the Wine Regions map.

Uses AWS Terrain Tiles (Terrarium PNG, public elevation data) and the projection
constants stored in web/src/data/spain_map.json (run build_spain_map.py first).

Outputs: web/public/spain_relief.webp and web/public/canary_relief.webp
Needs: pip install numpy pillow   (and the `cwebp` binary)
"""
import io, json, math, os, subprocess, sys, urllib.request
import numpy as np
from PIL import Image

HERE = os.path.dirname(__file__)
CACHE = sys.argv[1] if len(sys.argv) > 1 else '/tmp/spain_relief_cache'
DATA = json.load(open(os.path.join(HERE, '..', 'web', 'src', 'data', 'spain_map.json')))
PUBLIC = os.path.join(HERE, '..', 'web', 'public')
F = DATA['frame']
Z = 7
DETAIL_W = 1400   # px width of each per-region detail image
SCALE = 2          # output pixels per map unit
os.makedirs(CACHE, exist_ok=True)

def tile_xy(lon, lat, z=7):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y

def mosaic(lon0, lon1, lat0, lat1, Z=7):
    x0, y1 = tile_xy(lon0, lat0, Z)
    x1, y0 = tile_xy(lon1, lat1, Z)
    xs = range(int(x0) - 1, int(x1) + 2)
    ys = range(int(y0) - 1, int(y1) + 2)
    arr = np.zeros((len(ys) * 256, len(xs) * 256), dtype=np.float32)
    for j, ty in enumerate(ys):
        for i, tx in enumerate(xs):
            path = os.path.join(CACHE, f'{Z}_{tx}_{ty}.png')
            if not os.path.exists(path):
                url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png'
                urllib.request.urlretrieve(url, path)
            rgb = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)
            elev = rgb[..., 0] * 256 + rgb[..., 1] + rgb[..., 2] / 256 - 32768
            arr[j * 256:(j + 1) * 256, i * 256:(i + 1) * 256] = elev
    return arr, xs[0], ys[0]

def sample(arr, tx0, ty0, lons, lats, Z=7):
    n = 2 ** Z
    px = ((lons + 180) / 360 * n - tx0) * 256 - 0.5
    py = ((1 - np.arcsinh(np.tan(np.radians(lats))) / math.pi) / 2 * n - ty0) * 256 - 0.5
    x0 = np.clip(np.floor(px).astype(int), 0, arr.shape[1] - 2)
    y0 = np.clip(np.floor(py).astype(int), 0, arr.shape[0] - 2)
    fx, fy = px - x0, py - y0
    a = arr[y0, x0] * (1 - fx) + arr[y0, x0 + 1] * fx
    b = arr[y0 + 1, x0] * (1 - fx) + arr[y0 + 1, x0 + 1] * fx
    return a * (1 - fy) + b * fy

# hypsometric tint: warm, muted palette that sits under the region colours
STOPS = [(0, (223, 227, 192)), (200, (232, 226, 184)), (500, (228, 211, 164)), (800, (219, 193, 144)),
         (1200, (203, 168, 120)), (1800, (180, 140, 100)), (2500, (156, 128, 106)),
         (3000, (190, 180, 170)), (3700, (245, 243, 240))]

def tint(elev):
    e = np.clip(elev, 0, STOPS[-1][0])
    out = np.zeros(e.shape + (3,), dtype=np.float32)
    for (e0, c0), (e1, c1) in zip(STOPS, STOPS[1:]):
        m = (e >= e0) & (e <= e1)
        t = ((e[m] - e0) / (e1 - e0))[:, None]
        out[m] = np.array(c0) * (1 - t) + np.array(c1) * t
    return out

def render(lon0, lon1, lat0, lat1, w, h, name, Z=7, exag=4.0, out_dir=None):
    arr, tx0, ty0 = mosaic(lon0 - 0.05, lon1 + 0.05, lat0 - 0.05, lat1 + 0.05, Z)
    lons = lon0 + (np.arange(w) + 0.5) / w * (lon1 - lon0)
    lats = lat1 - (np.arange(h) + 0.5) / h * (lat1 - lat0)
    LON, LAT = np.meshgrid(lons, lats)
    elev = sample(arr, tx0, ty0, LON, LAT, Z)
    # smooth lightly to avoid tile-stepping artefacts
    k = np.array([1, 2, 1], dtype=np.float32) / 4
    for ax in (0, 1):
        elev = np.apply_along_axis(lambda v: np.convolve(np.pad(v, 1, mode='edge'), k, mode='valid'), ax, elev)
    land = np.maximum(elev, 0)
    dx = (lon1 - lon0) / w * 111320 * np.cos(np.radians(LAT))
    dy = (lat1 - lat0) / h * 110540
    gy, gx = np.gradient(land)
    gx = gx / dx
    gy = gy / dy              # image y points south
    # light from the north-west
    az, alt = math.radians(315), math.radians(42)
    slope = np.arctan(exag * np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    shade = np.clip(shade, 0, 1)
    base = np.sin(alt)
    mult = 1 + (shade - base) * 1.15
    rgb = np.clip(tint(land) * mult[..., None], 0, 255).astype(np.uint8)
    png = os.path.join(CACHE, name + '.png')
    Image.fromarray(rgb).save(png)
    out = os.path.join(out_dir or PUBLIC, name + '.webp')
    subprocess.run(['cwebp', '-q', '74', '-quiet', png, '-o', out], check=True)
    print(name, w, 'x', h, os.path.getsize(out) // 1024, 'KB')

W, H = DATA['viewBox']
render(F['lon0'], F['lon1'], F['lat0'], F['lat1'], W * SCALE, H * SCALE, 'spain_relief')
cb = F['canaryBox']
cw = round((cb[2] - cb[0]) * F['cos'] * F['canaryK'])
ch = round((cb[3] - cb[1]) * F['canaryK'])
render(cb[0], cb[2], cb[1], cb[3], cw * 3, ch * 3, 'canary_relief')

# detailed relief per region view, loaded lazily when the user zooms in
DETAIL = os.path.join(PUBLIC, 'relief')
os.makedirs(DETAIL, exist_ok=True)
for rid, (vx, vy, vw, vh) in DATA['regionViews'].items():
    if rid == 'canary-islands':
        continue
    lon0 = F['lon0'] + vx / (F['cos'] * F['k'])
    lon1 = F['lon0'] + (vx + vw) / (F['cos'] * F['k'])
    lat1 = F['lat1'] - vy / F['k']
    lat0 = F['lat1'] - (vy + vh) / F['k']
    span = lon1 - lon0
    z = min(10, max(7, math.ceil(math.log2(DETAIL_W * 360 / (256 * span)))))
    render(lon0, lon1, lat0, lat1, DETAIL_W, round(DETAIL_W * vh / vw), rid, Z=z, exag=3.0, out_dir=DETAIL)
