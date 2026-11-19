#!/usr/bin/env python3
"""Add a `core_ingredients` list to every item in web/src/data/menu.json.

`ingredients` stays the full list (the review page and allergy info use it). `core_ingredients`
is that list minus seasonings, herbs, oils, pantry staples, garnishes, cooking liquids and vague
entries, so quiz questions are about the food itself rather than "salt" or "parsley".

Edit MINOR / FORCE_CORE below and re-run; the script is safe to run repeatedly.
The file is hand-formatted, so this inserts one line per item instead of re-dumping the JSON.
"""
import json, os, re, sys

PATH = os.path.join(os.path.dirname(__file__), '..', 'web', 'src', 'data', 'menu.json')

MINOR = {
    # seasonings and spices
    'salt', 'black pepper', 'white pepper', 'cracked black pepper', 'cayenne', 'cayenne pepper',
    'crushed red peppers', 'paprika', 'cumin', 'nutmeg', 'tabasco', 'cinnamon sticks', 'bay leaves',
    # herbs and garnish
    'parsley', 'chives', 'dill', 'cilantro', 'basil', 'fresh basil', 'thyme', 'oregano', 'rosemary',
    'lemon wedge', 'lemon', 'lemon juice', 'orange zest',
    # oils, fats and liquids
    'olive oil', 'extra virgin olive oil', 'olive juice', 'butter', 'water',
    # pantry staples and flavourings
    'sugar', 'flour', 'baking powder', 'flavor extract', 'simple syrup', 'vanilla bean', 'garlic',
    'minced garlic', 'roasted garlic cloves',
    # cooking liquids and bases
    'white wine', 'red wine', 'dry sherry', 'sherry vinegar', 'tomato juice', 'tomato paste',
    # too vague to be a good quiz answer
    'vegetables', 'assorted vegetables', 'seasonal vegetables', 'julienne vegetables',
    'julienned vegetables', 'fresh fruit',
}

# dish name -> ingredients that ARE core in that dish even though they are minor elsewhere
FORCE_CORE = {
    # 'Gambas Al Ajillo': ['garlic'],
}

def norm(s):
    return re.sub(r'\s+', ' ', s.strip().lower())

def core_for(name, ingredients):
    forced = {norm(x) for x in FORCE_CORE.get(name, [])}
    core = [i for i in ingredients if norm(i) not in MINOR or norm(i) in forced]
    # Never promote a garnish just to pad the list: a dish with one real ingredient simply gets
    # fewer ingredient questions. (An item with no core at all keeps its full list.)
    return core or list(ingredients)

def main(write=True):
    lines = open(PATH, encoding='utf-8').read().split('\n')
    out, name, report = [], None, []
    skip_next_core = False
    for line in lines:
        if line.startswith('    "core_ingredients"'):
            continue                                   # regenerate on every run
        m = re.match(r'    "name": (".*"),?$', line)
        if m:
            name = json.loads(m.group(1))
        out.append(line)
        m = re.match(r'    "ingredients": (\[.*\]),$', line)
        if m:
            ing = json.loads(m.group(1))
            core = core_for(name, ing)
            out.append('    "core_ingredients": ' + json.dumps(core, ensure_ascii=False) + ',')
            report.append((name, ing, core))
    text = '\n'.join(out)
    json.loads(text)                                   # must still be valid JSON
    if write:
        open(PATH, 'w', encoding='utf-8').write(text)
    return report

if __name__ == '__main__':
    rep = main(write='--dry' not in sys.argv)
    thin = [r for r in rep if len(r[2]) < 3]
    print(f'{len(rep)} items; {sum(len(r[1]) - len(r[2]) for r in rep)} minor ingredients set aside; '
          f'{len(thin)} items with fewer than 3 core ingredients (one-ingredient dishes get no select-all question)')
    for name, ing, core in rep:
        if '-v' in sys.argv or len(core) < 3:
            print(f'- {name}\n    core : {", ".join(core)}\n    minor: {", ".join(i for i in ing if i not in core)}')
