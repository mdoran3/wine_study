#!/usr/bin/env python3
"""Download the photos listed in scripts/map_media_picks.json from Wikimedia Commons.

For every picked file this saves a resized JPEG under web/public/regions/ or
web/public/bodegas/ and writes web/src/data/map_media.json with the caption, author,
licence and Commons page so the site can show proper credit.

Needs: pip install pillow
"""
import io, json, os, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from commons_search import api, fetch, strip
from PIL import Image

HERE = os.path.dirname(__file__)
PICKS = json.load(open(os.path.join(HERE, 'map_media_picks.json')))
PUBLIC = os.path.join(HERE, '..', 'web', 'public')
OUT = os.path.join(HERE, '..', 'web', 'src', 'data', 'map_media.json')

def meta_for(titles, width):
    info = {}
    titles = list(titles)
    for i in range(0, len(titles), 20):
        chunk = titles[i:i + 20]
        data = api(action='query', titles='|'.join(chunk), prop='imageinfo',
                   iiprop='url|extmetadata', iiurlwidth=width)
        norm = {n['to']: n['from'] for n in data.get('query', {}).get('normalized', [])}
        for page in data['query']['pages'].values():
            ii = (page.get('imageinfo') or [None])[0]
            if not ii:
                print('missing', page.get('title'))
                continue
            md = ii['extmetadata']
            info[norm.get(page['title'], page['title'])] = {
                'thumb': ii['thumburl'],
                'page': ii['descriptionurl'],
                'author': strip(md.get('Artist', {}).get('value', '')) or 'Unknown',
                'license': md.get('LicenseShortName', {}).get('value', ''),
                'licenseUrl': md.get('LicenseUrl', {}).get('value', ''),
            }
    return info

def save(url, path, width):
    time.sleep(1.5)
    im = Image.open(io.BytesIO(fetch(url))).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'JPEG', quality=80, optimize=True, progressive=True)

out = {'regions': {}, 'bodegas': {}}
if os.path.exists(OUT):
    out = json.load(open(OUT))
    out.setdefault('regions', {}); out.setdefault('bodegas', {})

def run(kind, width):
    items = []
    for key, lst in PICKS.get(kind, {}).items():
        lst = lst if isinstance(lst, list) else [lst]
        for n, p in enumerate(lst, 1):
            items.append((key, n, p))
    todo = [(k, n, p) for k, n, p in items
            if not os.path.exists(os.path.join(PUBLIC, kind, f'{k}-{n}.jpg'))]
    if not todo:
        return
    info = meta_for({p['title'] for _, _, p in todo}, width)
    for key, n, p in todo:
        m = info.get(p['title'])
        if not m:
            continue
        save(m['thumb'], os.path.join(PUBLIC, kind, f'{key}-{n}.jpg'), width)
        entry = {'file': f'/{kind}/{key}-{n}.jpg', 'caption': p['caption'], 'author': m['author'],
                 'license': m['license'], 'licenseUrl': m['licenseUrl'], 'page': m['page']}
        out[kind].setdefault(key, [])
        out[kind][key] = [e for e in out[kind][key] if e['file'] != entry['file']] + [entry]
        out[kind][key].sort(key=lambda e: e['file'])
        print('saved', kind, key, n, m['license'])
        json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1)

run('regions', 960)
run('bodegas', 960)
json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1)
