#!/usr/bin/env python3
"""Download the home-page hero photo from Wikimedia Commons and write web/public/hero*.webp
plus web/src/data/hero.json (credit). Needs: pip install pillow, and the `cwebp` binary."""
import io, json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from commons_search import api, fetch, strip
from PIL import Image

TITLE = 'File:Viñedos en el Calvario, Rodezno, La Rioja.jpg'
HERE = os.path.dirname(__file__)
PUBLIC = os.path.join(HERE, '..', 'web', 'public')
d = api(action='query', titles=TITLE, prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=3840)
ii = list(d['query']['pages'].values())[0]['imageinfo'][0]
md = ii['extmetadata']
im = Image.open(io.BytesIO(fetch(ii['thumburl']))).convert('RGB')
w, h = im.size
crop = im.crop((0, int(h * 0.12), w, int(h * 0.87)))      # 16:9-ish: keeps sky, horizon and the rows
for name, width, q in (('hero', 2560, 78), ('hero-mobile', 1100, 74)):
    out = crop.resize((width, round(crop.height * width / crop.width)), Image.LANCZOS)
    tmp = os.path.join(PUBLIC, name + '.png'); out.save(tmp)
    subprocess.run(['cwebp', '-q', str(q), '-quiet', tmp, '-o', os.path.join(PUBLIC, name + '.webp')], check=True)
    os.remove(tmp)
json.dump({'author': strip(md['Artist']['value']), 'license': md['LicenseShortName']['value'],
           'licenseUrl': md.get('LicenseUrl', {}).get('value', ''), 'page': ii['descriptionurl'],
           'caption': 'Vineyards at El Calvario, Rodezno, La Rioja'},
          open(os.path.join(HERE, '..', 'web', 'src', 'data', 'hero.json'), 'w'), ensure_ascii=False, indent=1)
print('ok')
