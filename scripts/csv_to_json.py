import csv, json, pathlib

src = pathlib.Path("data/wines_by_the_glass.csv")
dst = pathlib.Path("web/src/data/wines.json")
dst.parent.mkdir(parents=True, exist_ok=True)

with src.open() as f:
    wines = list(csv.DictReader(f))

for w in wines:
    w["id"] = int(w["id"])

dst.write_text(json.dumps(wines, indent=2))
print(f"Wrote {len(wines)} wines to {dst}")
