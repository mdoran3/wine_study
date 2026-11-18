#!/usr/bin/env python3
"""Build web/src/data/spain_map.json (pre-projected SVG paths) for the Wine Regions map.

Sources (downloaded on first run into a cache dir):
  - Natural Earth 10m (public domain): countries, rivers, lakes
  - Spanish provinces GeoJSON (codeforgermany/click_that_hood)

Wine region outlines are APPROXIMATE: unions/clips of province geometry and boxes
around each appellation's core, not official DO boundaries.

Usage: python3 scripts/build_spain_map.py [cache_dir]
Needs: pip install shapely
"""
import json, math, os, sys, urllib.request
from shapely.geometry import shape, box, LineString, MultiLineString, Polygon, MultiPolygon, mapping
from shapely.ops import unary_union
from shapely import affinity

CACHE = sys.argv[1] if len(sys.argv) > 1 else '/tmp/spain_map_cache'
OUT = os.path.join(os.path.dirname(__file__), '..', 'web', 'src', 'data', 'spain_map.json')
NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'
SOURCES = {
    'prov.geojson': 'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/spain-provinces.geojson',
    'countries.geojson': NE + 'ne_10m_admin_0_countries.geojson',
    'rivers.geojson': NE + 'ne_10m_rivers_lake_centerlines.geojson',
    'rivers_eu.geojson': NE + 'ne_10m_rivers_europe.geojson',
}
os.makedirs(CACHE, exist_ok=True)
for fn, url in SOURCES.items():
    path = os.path.join(CACHE, fn)
    if not os.path.exists(path):
        print('downloading', fn)
        urllib.request.urlretrieve(url, path)

def load(fn):
    return json.load(open(os.path.join(CACHE, fn)))

# ---- projection (equirectangular, scaled at 40N) -------------------------------
LON0, LON1, LAT0, LAT1 = -10.2, 4.8, 34.6, 44.2   # mainland + Balearics frame
K = 62.0                                            # px per degree of latitude
COS = math.cos(math.radians(40))
W = round((LON1 - LON0) * COS * K)
H = round((LAT1 - LAT0) * K)

def proj(lon, lat, lon0=LON0, lat1=LAT1, k=K):
    return ((lon - lon0) * COS * k, (lat1 - lat) * k)

def ring_d(coords, **kw):
    pts = [proj(x, y, **kw) for x, y in coords]
    return 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'

def line_d(coords, **kw):
    pts = [proj(x, y, **kw) for x, y in coords]
    return 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)

def poly_d(geom, **kw):
    polys = [geom] if geom.geom_type == 'Polygon' else [g for g in geom.geoms if g.geom_type == 'Polygon']
    out = []
    for p in polys:
        if p.is_empty:
            continue
        out.append(ring_d(p.exterior.coords, **kw))
        for r in p.interiors:
            out.append(ring_d(r.coords, **kw))
    return ''.join(out)

def lines_d(geom, **kw):
    gs = [geom] if geom.geom_type == 'LineString' else [g for g in geom.geoms if g.geom_type == 'LineString']
    return ''.join(line_d(g.coords, **kw) for g in gs)

FRAME = box(LON0 - 0.5, LAT0 - 0.5, LON1 + 0.5, LAT1 + 0.5)

# ---- land ----------------------------------------------------------------------
countries = {f['properties']['NAME']: shape(f['geometry']) for f in load('countries.geojson')['features']}
spain_all = countries['Spain']
neighbors = {}
for name in ['Portugal', 'France', 'Andorra', 'Morocco', 'Algeria', 'Gibraltar', 'Italy', 'Tunisia']:
    if name in countries:
        neighbors[name] = countries[name].intersection(FRAME).simplify(0.01)

spain_main = spain_all.intersection(FRAME).simplify(0.008)

# ---- provinces -----------------------------------------------------------------
prov = {}
for f in load('prov.geojson')['features']:
    prov[f['properties']['name']] = shape(f['geometry']).simplify(0.006)

def P(*names):
    return unary_union([prov[n] for n in names])

# ---- rivers --------------------------------------------------------------------
RIVER_NAMES = {'Duero': 'Duero', 'Ebro': 'Ebro', 'Tajo': 'Tajo', 'Guadiana': 'Guadiana',
               'Guadalquivir': 'Guadalquivir', 'Minho': 'Miño', 'Min': 'Miño', 'Segre': 'Segre',
               'Júcar': 'Júcar', 'Segura': 'Segura', 'Turia': 'Turia', 'Sil': 'Sil',
               'Cinca': 'Cinca', 'Genil': 'Genil'}
river_geoms = {}
for fn in ['rivers.geojson', 'rivers_eu.geojson']:
    for f in load(fn)['features']:
        n = f['properties'].get('name')
        if n in RIVER_NAMES and f['geometry']:
            g = shape(f['geometry'])
            if g.intersects(FRAME):
                river_geoms.setdefault(RIVER_NAMES[n], []).append(g)
rivers = {}
for n, gs in river_geoms.items():
    rivers[n] = unary_union(gs).intersection(FRAME).simplify(0.01)

# ---- wine regions (approximate) ------------------------------------------------
def B(lon0, lat0, lon1, lat1):
    return box(lon0, lat0, lon1, lat1)

def E(lon, lat, rx, ry):
    """Ellipse centred on lon/lat with radii in degrees."""
    from shapely.geometry import Point
    return affinity.scale(Point(lon, lat).buffer(1, 32), rx, ry)

duero = rivers['Duero']
regions_geo = {
    # DOCa Rioja: La Rioja plus Rioja Alavesa (southern Álava)
    'rioja': unary_union([P('La Rioja'), B(-2.95, 42.42, -2.3, 42.64).intersection(P('Araba/Álava'))]),
    'navarra': P('Navarra'),
    'rias-baixas': P('Pontevedra'),
    'ribera-del-duero': duero.buffer(0.11).intersection(B(-4.55, 41.4, -2.6, 42.0))
                        .intersection(P('Burgos', 'Valladolid', 'Segovia', 'Soria', 'Palencia')),
    'rueda': E(-4.75, 41.3, 0.45, 0.28).intersection(P('Valladolid', 'Segovia', 'Ávila')),
    'toro': E(-5.4, 41.52, 0.32, 0.2).intersection(P('Zamora', 'Valladolid')),
    'bierzo': E(-6.6, 42.55, 0.5, 0.22).intersection(P('León')),
    'getariako-txakolina': E(-2.2, 43.3, 0.2, 0.1).intersection(P('Gipuzkoa/Guipúzcoa')),
    'campo-de-borja': E(-1.5, 41.85, 0.3, 0.17).intersection(P('Zaragoza')),
    'penedes': E(1.7, 41.4, 0.5, 0.22).intersection(P('Barcelona', 'Tarragona')),
    'priorat': E(0.83, 41.2, 0.12, 0.09).intersection(P('Tarragona')),
    'jumilla': E(-1.35, 38.5, 0.38, 0.33).intersection(P('Murcia', 'Albacete')),
    'alicante': P('Alacant/Alicante'),
    'valencia': P('València/Valencia'),
    'jerez': E(-6.2, 36.72, 0.3, 0.2).intersection(P('Cádiz')),
}
regions_geo['montsant'] = E(0.8, 41.25, 0.4, 0.2).intersection(P('Tarragona')).difference(regions_geo['priorat'])
# keep only sensible pieces
for k, g in list(regions_geo.items()):
    if g.is_empty:
        raise SystemExit(f'empty region {k}')

# ---- Canary Islands inset --------------------------------------------------------
CAN_BOX = (-18.4, 27.5, -13.2, 29.5)
canary = spain_all.intersection(box(*CAN_BOX)).simplify(0.006)
CAN_K = 40.0
CAN_W = (CAN_BOX[2] - CAN_BOX[0]) * COS * CAN_K
CAN_H = (CAN_BOX[3] - CAN_BOX[1]) * CAN_K
# place the inset in the Atlantic, lower-left of the main frame
INSET_X, INSET_Y = 10, H - CAN_H - 10
canary_kw = dict(lon0=CAN_BOX[0], lat1=CAN_BOX[3], k=CAN_K)

# ---- mountains (hand-placed ridgelines, lon/lat) ---------------------------------
MOUNTAINS = [
    ('Pyrenees', [(-1.9, 43.05), (-0.8, 42.85), (0.3, 42.75), (1.4, 42.55), (2.6, 42.4), (3.15, 42.35)], (0.5, 42.95), False),
    ('Cantabrian Mtns', [(-7.0, 42.85), (-6.0, 43.0), (-4.9, 43.05), (-3.9, 43.0), (-3.1, 42.95)], (-6.3, 43.1), False),
    ('Central System', [(-6.4, 40.3), (-5.4, 40.3), (-4.3, 40.75), (-3.6, 41.0)], (-4.5, 40.53), False),
    ('Iberian System', [(-3.1, 42.1), (-2.4, 41.3), (-1.6, 40.5), (-1.0, 40.0), (-0.4, 39.7)], (-1.1, 40.95), False),
    ('Sierra Morena', [(-7.4, 38.2), (-6.0, 38.2), (-4.6, 38.4), (-3.4, 38.5)], (-5.5, 38.6), False),
    ('Betic System', [(-5.3, 36.65), (-4.4, 36.9), (-3.4, 37.0), (-2.2, 37.15), (-1.2, 37.7)], (-2.3, 37.45), False),
    ('Catalan Coastal Range', [(0.9, 41.25), (1.8, 41.55), (2.4, 41.65)], (1.7, 41.85), False),
    # smaller ranges and massifs (labels only; the shaded relief shows the terrain itself)
    ('Picos de Europa', [], (-4.55, 43.03), True),
    ('Montes de León', [], (-6.2, 42.38), True),
    ('Macizo Galaico', [], (-7.6, 42.05), True),
    ('Sierra de la Demanda', [], (-3.15, 41.98), True),
    ('Sierra de Guadarrama', [], (-3.95, 40.93), True),
    ('Sierra de Gredos', [], (-5.3, 40.3), True),
    ('Montes de Toledo', [], (-4.3, 39.52), True),
    ('Montes Universales', [], (-1.75, 40.3), True),
    ('Serra da Estrela', [], (-7.6, 40.3), True),
    ('Sierra Nevada', [], (-3.2, 37.12), True),
    ('Sierra de Cazorla', [], (-2.9, 37.98), True),
    ('Serranía de Ronda', [], (-5.0, 36.82), True),
    ('Sierra de Aitana', [], (-0.6, 38.78), True),
    ('Serra de Tramuntana', [], (2.75, 39.83), True),
    ('Rif', [], (-4.4, 35.05), True),
]
mountains = []
for name, pts, lab, minor in MOUNTAINS:
    lx, ly = proj(*lab)
    mountains.append({'name': name, 'label': [round(lx, 1), round(ly, 1)], 'minor': minor})

# ---- notable peaks (lon, lat, metres) -----------------------------------------------
PEAKS = [
    ('Aneto', 0.657, 42.631, 3404),
    ('Mulhacén', -3.311, 37.053, 3479),
    ('Torre Cerredo', -4.851, 43.196, 2648),
    ('Almanzor', -5.298, 40.248, 2592),
    ('Peñalara', -3.955, 40.848, 2428),
    ('Moncayo', -1.840, 41.787, 2314),
    ('Montseny', 2.43, 41.77, 1712),
    ('Monte Perdido', 0.034, 42.68, 3355, True),
    ('Penyagolosa', -0.275, 40.225, 1813),
    ('Montserrat', 1.8115, 41.6017, 1236),
]
peaks = []
for name, lo, la, el, *flags in PEAKS:
    x, y = proj(lo, la)
    peaks.append({'name': name, 'elev': el, 'x': round(x, 1), 'y': round(y, 1), 'left': bool(flags and flags[0])})
tx, ty = proj(-16.642, 28.272, **canary_kw)
canary_peaks = [{'name': 'Teide', 'elev': 3715, 'x': round(tx, 1), 'y': round(ty, 1)}]

def bbox_px(g, **kw):
    x0, y0, x1, y1 = g.bounds
    ax, ay = proj(x0, y1, **kw)
    bx, by = proj(x1, y0, **kw)
    return [round(ax, 1), round(ay, 1), round(bx, 1), round(by, 1)]

# ---- text labels (seas, ocean, inlets, plateau) -------------------------------------
def lab(text, lon, lat, kind, rot=0):
    x, y = proj(lon, lat)
    return {'text': text, 'x': round(x, 1), 'y': round(y, 1), 'kind': kind, 'rot': rot}

labels = [
    lab('Atlantic Ocean', -9.1, 38.0, 'ocean', -90),
    lab('Bay of Biscay', -3.6, 44.0, 'sea'),
    lab('Mediterranean Sea', 1.2, 37.3, 'sea'),
    lab('Balearic Sea', 2.0, 40.1, 'sea', 0),
    lab('Alborán Sea', -3.2, 36.2, 'sea'),
    lab('Gulf of Cádiz', -7.2, 36.45, 'sea'),
    lab('Strait of Gibraltar', -5.6, 35.75, 'inlet'),
    lab('Gulf of Valencia', 0.65, 39.4, 'inlet', 0),
    lab('Rías Baixas', -9.6, 42.3, 'inlet', -80),
    lab('Meseta Central', -4.0, 39.6, 'land'),
    lab('PORTUGAL', -8.0, 40.4, 'country'),
    lab('FRANCE', 1.8, 43.9, 'country'),
    lab('MOROCCO', -5.0, 35.45, 'country'),
    lab('ANDORRA', 1.55, 42.55, 'tiny'),
]
river_labels = {
    'Duero': (-4.0, 41.63), 'Ebro': (-0.1, 41.45), 'Tajo': (-5.6, 39.95), 'Guadiana': (-5.8, 38.95),
    'Guadalquivir': (-5.4, 37.55), 'Miño': (-8.2, 42.35), 'Júcar': (-1.7, 39.5), 'Segura': (-1.5, 38.05),
}

# ---- cities and wine towns (scripts/cities_src.json, built by fetch_cities.py) ------------
cities = []
for c in json.load(open(os.path.join(os.path.dirname(__file__), 'cities_src.json'))):
    if c['lon'] < -13 and c['lat'] < 30:          # Canary Islands: drawn in the inset
        x, y = proj(c['lon'], c['lat'], **canary_kw)
        x += INSET_X; y += INSET_Y
    else:
        x, y = proj(c['lon'], c['lat'])
        if not (0 <= x <= W and 0 <= y <= H):
            continue
    cities.append({'name': c['name'], 'tier': c['tier'], 'x': round(x, 1), 'y': round(y, 1)})

# ---- zoom views per region (x, y, w, h in map units) ----------------------------------
def view_for(box_, pad):
    x0, y0, x1, y1 = box_
    w = min(max((x1 - x0) * pad, (y1 - y0) * pad * (W / H), W / 7), W)
    h = w * H / W
    x = min(max((x0 + x1) / 2 - w / 2, 0), W - w)
    y = min(max((y0 + y1) / 2 - h / 2, 0), H - h)
    return [round(x, 1), round(y, 1), round(w, 1), round(h, 1)]

REGION_VIEWS = {k: view_for(bbox_px(g), 2.6) for k, g in regions_geo.items()}
_cb = bbox_px(canary, **canary_kw)
REGION_VIEWS['canary-islands'] = view_for([INSET_X + _cb[0], INSET_Y + _cb[1], INSET_X + _cb[2], INSET_Y + _cb[3]], 1.4)

out = {
    'viewBox': [W, H],
    'land': poly_d(spain_main),
    'neighbors': {n: poly_d(g) for n, g in neighbors.items()},
    'provinces': ''.join(lines_d(g.boundary) for n, g in prov.items()
                         if n not in ('Las Palmas', 'Santa Cruz De Tenerife')),
    'rivers': [{'name': n, 'd': lines_d(g)} for n, g in rivers.items()],
    'riverLabels': [{'name': n, 'x': round(proj(*p)[0], 1), 'y': round(proj(*p)[1], 1)} for n, p in river_labels.items()],
    'mountains': mountains,
    'labels': labels,
    'regions': {k: poly_d(g) for k, g in regions_geo.items()},
    'regionBoxes': {k: bbox_px(g) for k, g in regions_geo.items()},
    'frame': {'lon0': LON0, 'lon1': LON1, 'lat0': LAT0, 'lat1': LAT1, 'k': K, 'cos': COS,
              'canaryBox': CAN_BOX, 'canaryK': CAN_K},
    'peaks': peaks,
    'regionViews': REGION_VIEWS,
    'cities': cities,
    'regionCenters': {k: [round(c, 1) for c in proj(g.representative_point().x, g.representative_point().y)]
                      for k, g in regions_geo.items()},
    'canary': {
        'x': round(INSET_X, 1), 'y': round(INSET_Y, 1), 'w': round(CAN_W, 1), 'h': round(CAN_H, 1),
        'land': poly_d(canary, **canary_kw),
        'peaks': canary_peaks,
        'box': bbox_px(canary, **canary_kw),
    },
}
# ---- bodegas (verified coordinates, see scripts/bodegas_src.json) ------------------------
from shapely.geometry import Point
bod_src = json.load(open(os.path.join(os.path.dirname(__file__), 'bodegas_src.json')))
bodegas = []
for b in bod_src:
    pt = Point(b['lon'], b['lat'])
    geom = regions_geo.get(b['region'])
    if b['region'] == 'canary-islands':
        x, y = proj(b['lon'], b['lat'], **canary_kw)
        x += INSET_X; y += INSET_Y
    else:
        d = geom.distance(pt)
        if d > 0.02:
            raise SystemExit(f"{b['id']} is {d:.3f} deg outside region {b['region']}")
        x, y = proj(b['lon'], b['lat'])
    bodegas.append({'id': b['id'], 'name': b['name'], 'region': b['region'], 'town': b['town'],
                    'lat': b['lat'], 'lon': b['lon'], 'x': round(x, 1), 'y': round(y, 1), 'wines': b['wines']})
json.dump(bodegas, open(os.path.join(os.path.dirname(OUT), 'bodegas.json'), 'w'), ensure_ascii=False, indent=1)
print('bodegas:', len(bodegas))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print('wrote', os.path.normpath(OUT), os.path.getsize(OUT) // 1024, 'KB; view', W, 'x', H)
