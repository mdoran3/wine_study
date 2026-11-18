#!/usr/bin/env python3
"""Build scripts/cities_src.json: cities and wine towns for the Wine Regions map.

  tier 1: always shown     (largest cities)
  tier 2: shown when zoomed in a little (other cities, from Natural Earth)
  tier 3: shown when zoomed in a lot (wine towns, looked up in OpenStreetMap Nominatim)

Usage: fetch_cities.py CACHE_DIR
"""
import json, os, sys, time, urllib.parse, urllib.request

CACHE = sys.argv[1] if len(sys.argv) > 1 else '/tmp/spain_map_cache'
OUT = os.path.join(os.path.dirname(__file__), 'cities_src.json')
UA = 'wine-study-map/1.0 (educational project)'
NE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson'
path = os.path.join(CACHE, 'places.geojson')
os.makedirs(CACHE, exist_ok=True)
if not os.path.exists(path):
    urllib.request.urlretrieve(NE_URL, path)

RENAME = {'Seville': 'Sevilla', 'La Coruña': 'A Coruña', 'Castello': 'Castelló', 'San Sebastián': 'San Sebastián',
          'Palma': 'Palma', 'Lisbon': 'Lisbon', 'Mataró': None, 'Marbella': None, 'Biarritz': None,
          'Braga': None, 'Setúbal': None, 'Coimbra': None, 'Nîmes': None, 'Montpellier': 'Montpellier'}
TIER1 = {'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Bilbao', 'Lisbon', 'Porto',
         'Valladolid', 'Murcia', 'Palma'}
COUNTRIES = {'Spain', 'Portugal', 'France', 'Gibraltar'}
cities = []
for f in json.load(open(path))['features']:
    p = f['properties']
    lon, lat = f['geometry']['coordinates']
    if not (-10.2 <= lon <= 4.8 and 34.6 <= lat <= 44.2) or p['adm0name'] not in COUNTRIES:
        continue
    name = p['name'].replace('\u200E', '').strip()
    if name in RENAME and RENAME[name] is None:
        continue                     # skip secondary/duplicate places
    name = RENAME.get(name, name)
    if p['pop_max'] < 70000 and name not in TIER1:
        continue
    cities.append({'name': name, 'lat': round(lat, 4), 'lon': round(lon, 4),
                   'tier': 1 if name in TIER1 else 2})
# the Canary capitals (shown in the inset)
cities += [{'name': 'Las Palmas', 'lat': 28.1235, 'lon': -15.4363, 'tier': 2},
           {'name': 'Santa Cruz de Tenerife', 'lat': 28.4636, 'lon': -16.2518, 'tier': 2}]

WINE_TOWNS = ['Haro', 'Laguardia', 'Olite', 'Cambados', 'Peñafiel', 'Aranda de Duero', 'Rueda, Valladolid',
              'Toro, Zamora', 'Ponferrada', 'Jumilla', 'Requena, Valencia', 'Getaria',
              'Vilafranca del Penedès', "Sant Sadurní d'Anoia", 'Gratallops', 'Borja, Zaragoza',
              'Sanlúcar de Barrameda', 'Jerez de la Frontera', 'Pinoso', 'Falset', 'Medina del Campo',
              'Villafranca del Bierzo']
for q in WINE_TOWNS:
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
        {'q': q, 'format': 'jsonv2', 'limit': 1, 'countrycodes': 'es'})
    for attempt in range(4):
        try:
            res = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40))
            break
        except Exception as e:
            time.sleep(5 * (attempt + 1))
            res = []
    time.sleep(1.5)
    if not res:
        print('NOT FOUND', q)
        continue
    r = res[0]
    cities.append({'name': q.split(',')[0], 'lat': round(float(r['lat']), 4), 'lon': round(float(r['lon']), 4), 'tier': 3})
    print(q, r['lat'], r['lon'], r['category'], r['type'])
json.dump(cities, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(len(cities), 'places')
