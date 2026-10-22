"""Build the index behind /data from the World Bank's World Development Indicators bulk download.

    curl -L -o WDI_CSV.zip https://databank.worldbank.org/data/download/WDI_CSV.zip && unzip WDI_CSV.zip -d wdi
    python -I scripts/seo/build_wdi_index.py wdi app/lib/wdi

Writes three JSON files the pages read:
  meta.json   countries (and regional/income aggregates: [iso3, name, slug, region code, income group, is aggregate, iso2]) and indicators, with slugs
  cells.json  per indicator, which economies have a page: [country index, observations, first year, last year, last value]
  defs.json   the World Bank's definition and source note for each indicator (CC BY 4.0, credited on every page)

A country x indicator pair only gets a page if it has at least MIN_OBS yearly values and its latest value is from
MIN_LAST_YEAR or later; a sparse or stale series would make a thin page. The full series is fetched from the World Bank
API when a page is first rendered, so this index stays small and the numbers on the page come straight from the source.
"""
import csv
import json
import re
import sys
from pathlib import Path

MIN_OBS = 10
MIN_LAST_YEAR = 2015
MIN_COUNTRIES = 20  # an indicator covered by fewer economies than this has no useful ranking page

src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
csv.field_size_limit(10_000_000)


def find(name):
    hits = [p for p in src.rglob("*.csv") if p.name.lower() == name.lower()]
    if not hits:
        sys.exit(f"{name} not found under {src}")
    return hits[0]


def rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f)


def slugify(s):
    s = s.replace("US$", " usd ").lower().replace("%", " pct ").replace("&", " and ").replace("+", " plus ").replace("$", " usd ")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return re.sub(r"-+", "-", s)


def unique(slug, seen, extra):
    if slug not in seen:
        seen.add(slug)
        return slug
    alt = f"{slug}-{slugify(extra)}"
    seen.add(alt)
    return alt


def clip(text, limit=1400):
    text = re.sub(r"\s+", " ", (text or "").strip())
    if len(text) <= limit:
        return text
    cut = text[:limit]
    end = cut.rfind(". ")
    return cut[: end + 1] if end > limit // 2 else cut.rstrip() + "…"


# ---- countries and aggregates ----
country_rows = list(rows(find("WDICountry.csv")))
region_code_by_name = {}
for r in country_rows:
    if not r.get("Region"):  # aggregates have no region of their own
        region_code_by_name[r["Table Name"].strip()] = r["Country Code"]
countries, cidx, seen = [], {}, set()
for r in sorted(country_rows, key=lambda r: (bool(not r.get("Region")), r["Table Name"])):
    name = r["Table Name"].strip()
    agg = not r.get("Region")
    region = region_code_by_name.get(r.get("Region", "").strip()) if not agg else None
    cidx[r["Country Code"]] = len(countries)
    iso2 = (r.get("2-alpha code") or "").strip() or None
    countries.append([r["Country Code"], name, unique(slugify(name), seen, r["Country Code"]), region, (r.get("Income Group") or "").strip() or None, 1 if agg else 0, iso2])

# ---- indicators ----
series = {r["Series Code"]: r for r in rows(find("WDISeries.csv"))}

# ---- cells ----
cells, latest_year = {}, 0
data_path = find("WDICSV.csv")
with open(data_path, encoding="utf-8-sig", newline="") as f:
    reader = csv.reader(f)
    head = next(reader)
    years = [(i, int(h)) for i, h in enumerate(head) if h.strip().isdigit()]
    ci, ii = head.index("Country Code"), head.index("Indicator Code")
    for rec in reader:
        code, ind = rec[ci], rec[ii]
        if code not in cidx:
            continue
        obs = [(y, float(rec[i])) for i, y in years if i < len(rec) and rec[i].strip() not in ("", "..")]
        if len(obs) < MIN_OBS or obs[-1][0] < MIN_LAST_YEAR:
            continue
        latest_year = max(latest_year, obs[-1][0])
        cells.setdefault(ind, []).append([cidx[code], len(obs), obs[0][0], obs[-1][0], float(f"{obs[-1][1]:.6g}")])

indicators, defs, seen = [], {}, set()
for code, cs in sorted(cells.items()):
    s = series.get(code)
    if not s or sum(1 for c in cs if not countries[c[0]][5]) < MIN_COUNTRIES:
        continue
    name = s["Indicator Name"].strip()
    topic = (s.get("Topic") or "").split(":")[0].strip() or "Other"
    indicators.append([code, name, unique(slugify(name), seen, code), topic, clip(s.get("Source", ""), 300)])
    defs[code] = {"def": clip(s.get("Long definition") or s.get("Short definition") or ""), "unit": (s.get("Unit of measure") or "").strip(), "agg": (s.get("Aggregation method") or "").strip(), "limits": clip(s.get("Limitations and exceptions") or "", 700)}
kept = {i[0] for i in indicators}
cells = {k: v for k, v in cells.items() if k in kept}

pages = sum(len(v) for v in cells.values())
meta = {"source": "World Development Indicators, World Bank", "license": "CC BY 4.0", "built_from": data_path.name, "latest_year": latest_year, "min_obs": MIN_OBS, "min_last_year": MIN_LAST_YEAR, "pages": pages, "countries": countries, "indicators": indicators}
(out / "meta.json").write_text(json.dumps(meta, separators=(",", ":")))
(out / "cells.json").write_text(json.dumps(cells, separators=(",", ":")))
(out / "defs.json").write_text(json.dumps(defs, separators=(",", ":")))
print(f"{len(countries)} economies, {len(indicators)} indicators, {pages} country x indicator pages; latest year {latest_year}")
