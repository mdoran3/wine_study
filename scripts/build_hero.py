#!/usr/bin/env python3
"""Download the home-page hero photo from Wikimedia Commons and write web/public/hero.webp and
hero-mobile.webp plus web/src/data/hero.json (credit). Needs: pillow, and the cwebp binary."""
import io, json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from commons_search import api, fetch, strip
from PIL import Image

# id -> (Commons title, crop top, crop bottom as fractions of height, CSS object-position y, caption)
PHOTOS = {
    'penedes': ('File:Vinyes del Penedes, Tardor, Fontrubí.jpg', 0.0, 0.84, 55, 'Autumn vines near Fontrubí, Penedès'),
}
HERE = os.path.dirname(__file__)
PUBLIC = os.path.join(HERE, '..', 'web', 'public')
out_meta = {}
for pid, (title, top, bottom, pos, caption) in PHOTOS.items():
    d = api(action='query', titles=title, prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=3840)
    ii = list(d['query']['pages'].values())[0]['imageinfo'][0]
    md = ii['extmetadata']
    im = Image.open(io.BytesIO(fetch(ii['thumburl']))).convert('RGB')
    w, h = im.size
    crop = im.crop((0, int(h * top), w, int(h * bottom)))
    for suffix, width, q in (('', 2560, 78), ('-mobile', 1100, 74)):
        o = crop.resize((width, round(crop.height * width / crop.width)), Image.LANCZOS)
        tmp = os.path.join(PUBLIC, f'hero{suffix}.png'); o.save(tmp)
        subprocess.run(['cwebp', '-q', str(q), '-quiet', tmp, '-o', os.path.join(PUBLIC, f'hero{suffix}.webp')], check=True)
        os.remove(tmp)
    out_meta = {'author': strip(md['Artist']['value']), 'license': md['LicenseShortName']['value'],
                     'licenseUrl': md.get('LicenseUrl', {}).get('value', ''), 'page': ii['descriptionurl'],
                     'caption': caption, 'position': pos}
    print(pid, 'ok')
json.dump(out_meta, open(os.path.join(HERE, '..', 'web', 'src', 'data', 'hero.json'), 'w'), ensure_ascii=False, indent=1)
