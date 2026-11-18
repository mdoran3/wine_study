#!/usr/bin/env python3
"""Look up candidate coordinates for a list of bodegas using OpenStreetMap Nominatim.

Usage: geocode_bodegas.py OUT.json
Results are only candidates: they are checked against the region geometry and by hand
before being used on the map.
"""
import json, sys, time, urllib.parse, urllib.request

# (key, region id, query)
BODEGAS = [
    ('muga', 'rioja', 'Bodegas Muga Haro'),
    ('la-rioja-alta', 'rioja', 'La Rioja Alta S.A. Haro'),
    ('murrieta', 'rioja', 'Marqués de Murrieta Castillo Ygay Logroño'),
    ('el-coto', 'rioja', 'Bodegas El Coto de Rioja Oyón'),
    ('riscal', 'rioja', 'Marqués de Riscal Elciego'),
    ('cvne', 'rioja', 'CVNE Compañía Vinícola del Norte de España Haro'),
    ('lopez-heredia', 'rioja', 'R. López de Heredia Viña Tondonia Haro'),
    ('arinzano', 'navarra', 'Hacienda de Arínzano Aberin'),
    ('chivite', 'navarra', 'Bodegas Chivite Cintruénigo'),
    ('pazo-barrantes', 'rias-baixas', 'Pazo de Barrantes Ribadumia'),
    ('mar-de-frades', 'rias-baixas', 'Mar de Frades Meaño'),
    ('pazo-senorans', 'rias-baixas', 'Pazo de Señoráns Meis'),
    ('emilio-moro', 'ribera-del-duero', 'Bodegas Emilio Moro Pesquera de Duero'),
    ('pesquera', 'ribera-del-duero', 'Bodegas Alejandro Fernández Tinto Pesquera Pesquera de Duero'),
    ('vega-sicilia', 'ribera-del-duero', 'Bodegas Vega Sicilia Valbuena de Duero'),
    ('pingus', 'ribera-del-duero', 'Dominio de Pingus Quintanilla de Onésimo'),
    ('shaya', 'rueda', 'Bodegas Shaya La Seca'),
    ('marques-riscal-rueda', 'rueda', 'Marqués de Riscal La Seca Rueda bodega'),
    ('palacios-bierzo', 'bierzo', 'Descendientes de J. Palacios Villafranca del Bierzo'),
    ('numanthia', 'toro', 'Bodega Numanthia Valdefinjas'),
    ('vatan', 'toro', 'Bodegas Vatan Toro Zamora'),
    ('juan-gil', 'jumilla', 'Bodegas Juan Gil Jumilla'),
    ('el-nido', 'jumilla', 'Bodegas El Nido Jumilla'),
    ('volver', 'alicante', 'Bodegas Volver Pinoso'),
    ('vicente-gandia', 'valencia', 'Bodegas Vicente Gandía Chiva'),
    ('inazio-urruzola', 'getariako-txakolina', 'Inazio Urruzola Bodega Getaria'),
    ('txomin-etxaniz', 'getariako-txakolina', 'Txomin Etxaniz Getaria'),
    ('ameztoi', 'getariako-txakolina', 'Ameztoi Txakolina Getaria'),
    ('codorniu', 'penedes', 'Codorníu Sant Sadurní d\'Anoia'),
    ('segura-viudas', 'penedes', 'Segura Viudas Torrelavit'),
    ('gramona', 'penedes', 'Gramona Sant Sadurní d\'Anoia'),
    ('torres', 'penedes', 'Bodegas Torres Vilafranca del Penedès'),
    ('clos-erasmus', 'priorat', 'Clos Erasmus Gratallops'),
    ('alvaro-palacios', 'priorat', 'Álvaro Palacios Gratallops'),
    ('scala-dei', 'priorat', 'Cellers Scala Dei La Morera de Montsant'),
    ('can-blau', 'montsant', 'Celler Can Blau Montsant'),
    ('alto-moncayo', 'campo-de-borja', 'Bodegas Alto Moncayo Ainzón'),
    ('borsao', 'campo-de-borja', 'Bodegas Borsao Borja'),
    ('los-bermejos', 'canary-islands', 'Bodega Los Bermejos Teguise Lanzarote'),
    ('el-grifo', 'canary-islands', 'Bodega El Grifo Lanzarote San Bartolomé'),
    ('gonzalez-byass', 'jerez', 'González Byass Jerez de la Frontera'),
    ('lustau', 'jerez', 'Bodegas Lustau Jerez de la Frontera'),
    ('barbadillo', 'jerez', 'Bodegas Barbadillo Sanlúcar de Barrameda'),
]

def lookup(q):
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
        {'q': q, 'format': 'jsonv2', 'limit': 4, 'countrycodes': 'es', 'addressdetails': 0})
    req = urllib.request.Request(url, headers={'User-Agent': 'wine-study-map/1.0 (educational project)'})
    return json.load(urllib.request.urlopen(req, timeout=40))

if __name__ == '__main__':
    out = {}
    for key, region, q in BODEGAS:
        try:
            res = lookup(q)
        except Exception as e:
            res = []
            print('ERR', key, e)
        out[key] = {'region': region, 'query': q, 'results': [
            {'name': r.get('display_name', '')[:110], 'lat': float(r['lat']), 'lon': float(r['lon']),
             'type': f"{r.get('category')}/{r.get('type')}"} for r in res]}
        print(key, len(res), res[0]['display_name'][:70] if res else '-')
        time.sleep(1.2)
    json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
