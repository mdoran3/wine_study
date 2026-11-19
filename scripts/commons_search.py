#!/usr/bin/env python3
"""Search Wikimedia Commons for freely-licensed photos and build labelled contact sheets.

Usage:
  commons_search.py search OUTDIR key1="query one" key2="query two" ...
      -> OUTDIR/candidates_<key>.json  and  OUTDIR/sheet_<key>.jpg

Only images under CC0 / public domain / CC BY / CC BY-SA licences are kept; the author
and licence are recorded so credits can be shown on the site.
"""
import io, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from PIL import Image, ImageDraw

API = 'https://commons.wikimedia.org/w/api.php'
UA = 'wine-study-map/1.0 (educational project)'
OK_LICENSE = re.compile(r'^(cc0|pd|public domain|cc[- ]by(-sa)?[- ]?\d|cc[- ]by(-sa)?$|attribution)', re.I)

def fetch(url, tries=8):
    """GET with polite retry/backoff (Commons rate-limits with HTTP 429)."""
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            return urllib.request.urlopen(req, timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == tries - 1:
                raise
            wait = int(e.headers.get('Retry-After', 0) or 0)
            time.sleep(max(wait, 20 * (i + 1)))

def api(**params):
    params['format'] = 'json'
    time.sleep(1.2)
    return json.loads(fetch(API + '?' + urllib.parse.urlencode(params)))

def strip(html):
    return re.sub(r'<[^>]+>', '', html or '').strip()

def search(query, limit=14, min_w=2000):
    data = api(action='query', generator='search', gsrsearch=query, gsrnamespace=6, gsrlimit=limit,
               prop='imageinfo', iiprop='url|size|extmetadata|mime', iiurlwidth=330)
    out = []
    for page in (data.get('query', {}).get('pages', {})).values():
        ii = (page.get('imageinfo') or [{}])[0]
        if ii.get('mime') not in ('image/jpeg', 'image/png') or ii.get('width', 0) < min_w:
            continue
        md = ii.get('extmetadata', {})
        lic = md.get('LicenseShortName', {}).get('value', '')
        if not OK_LICENSE.match(lic.replace('CC BY', 'CC-BY').replace('CC-BY-SA', 'CC-BY-SA')) and 'public domain' not in lic.lower() and not lic.lower().startswith(('cc', 'pd')):
            continue
        if re.search(r'nc|nd', lic.lower().replace('and', '')) and 'cc' in lic.lower():
            continue
        out.append({
            'title': page['title'], 'thumb': ii.get('thumburl'), 'url': ii.get('url'),
            'page': ii.get('descriptionurl'), 'w': ii.get('width'), 'h': ii.get('height'),
            'license': lic, 'licenseUrl': md.get('LicenseUrl', {}).get('value', ''),
            'author': strip(md.get('Artist', {}).get('value', '')),
            'desc': strip(md.get('ImageDescription', {}).get('value', ''))[:160],
        })
    return out

def sheet(cands, path, cols=4, tw=300, th=210):
    rows = (len(cands) + cols - 1) // cols
    img = Image.new('RGB', (cols * tw, rows * (th + 34)), 'white')
    d = ImageDraw.Draw(img)
    for i, c in enumerate(cands):
        try:
            time.sleep(0.5)
            im = Image.open(io.BytesIO(fetch(c['thumb']))).convert('RGB')
            im.thumbnail((tw - 6, th - 6))
            x, y = (i % cols) * tw, (i // cols) * (th + 34)
            img.paste(im, (x + 3, y + 3))
            d.text((x + 4, y + th + 2), f"#{i} {c['title'][5:44]}", fill='black')
            d.text((x + 4, y + th + 16), f"{c['license'][:22]} {c['w']}px", fill='gray')
        except Exception as e:
            print('thumb failed', c['title'], e)
    img.save(path, quality=80)

if __name__ == '__main__':
    mode, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    for arg in sys.argv[3:]:
        key, q = arg.split('=', 1)
        if os.path.exists(os.path.join(outdir, f'sheet_{key}.jpg')):
            continue
        cands = search(q)
        json.dump(cands, open(os.path.join(outdir, f'candidates_{key}.json'), 'w'), ensure_ascii=False, indent=1)
        if cands:
            sheet(cands, os.path.join(outdir, f'sheet_{key}.jpg'))
        print(key, len(cands))
