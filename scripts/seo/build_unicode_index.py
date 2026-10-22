"""Build the index behind /unicode from the Unicode Character Database, emoji-test.txt and the WHATWG entity list.

    base=https://www.unicode.org/Public
    for f in UnicodeData Blocks Scripts NameAliases DerivedAge; do curl -sO $base/UCD/latest/ucd/$f.txt; done
    curl -sO $base/emoji/latest/emoji-test.txt; curl -sO https://html.spec.whatwg.org/entities.json
    python -I scripts/seo/build_unicode_index.py <that folder> app/lib/unicode

Only characters with a real name get a page. Skipped: names that are just a number (CJK COMPATIBILITY IDEOGRAPH-F900,
TANGUT COMPONENT-001), the big algorithmically named ranges (CJK ideographs, Hangul syllables), private use and surrogates.
Unicode data: Unicode License v3; WHATWG entities: CC BY 4.0. Both are credited on the pages.
"""
import json
import re
import sys
from pathlib import Path

src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)


def ranges(path):
    """Yield (start, end, value) from a UCD 'XXXX..YYYY ; value' file."""
    for line in (src / path).read_text(encoding="utf-8").splitlines():
        line = line.split("#")[0].strip()
        if not line:
            continue
        cps, val = [x.strip() for x in line.split(";")[:2]]
        a, _, b = cps.partition("..")
        yield int(a, 16), int(b or a, 16), val


def version(path):
    m = re.search(r"(\d+\.\d+\.\d+)", (src / path).read_text(encoding="utf-8")[:200])
    return m.group(1) if m else "unknown"


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


blocks = [(a, b, name) for a, b, name in ranges("Blocks.txt")]
scripts = list(ranges("Scripts.txt"))
ages = list(ranges("DerivedAge.txt"))


def lookup(table, cp):
    for a, b, v in table:
        if a <= cp <= b:
            return v
    return None


aliases = {}
for line in (src / "NameAliases.txt").read_text(encoding="utf-8").splitlines():
    if line and not line.startswith("#"):
        cp, alias, kind = line.split(";")
        if kind in ("control", "correction", "figment") or int(cp, 16) not in aliases:
            aliases.setdefault(int(cp, 16), alias.title() if kind == "control" else alias)

emoji = {}
for line in (src / "emoji-test.txt").read_text(encoding="utf-8").splitlines():
    m = re.match(r"^([0-9A-F]{4,6})\s+; fully-qualified\s+# \S+ E(\d+\.\d+) (.+)$", line)
    if m:
        emoji[int(m.group(1), 16)] = m.group(3)
    m2 = re.match(r"^([0-9A-F]{4,6}) FE0F\s+; fully-qualified\s+# \S+ E(\d+\.\d+) (.+)$", line)
    if m2:
        emoji.setdefault(int(m2.group(1), 16), m2.group(3))

entities = {}
for name, v in json.loads((src / "entities.json").read_text(encoding="utf-8")).items():
    if name.endswith(";") and len(v["codepoints"]) == 1:
        entities.setdefault(v["codepoints"][0], []).append(name)

SKIP_NAME = re.compile(r"-[0-9A-F]{3,6}$")  # names that are only a number
chars = []
for line in (src / "UnicodeData.txt").read_text(encoding="utf-8").splitlines():
    f = line.split(";")
    cp, name, gc = int(f[0], 16), f[1], f[2]
    if gc in ("Co", "Cs") or name.endswith(", First>") or name.endswith(", Last>"):
        continue
    if name == "<control>":
        name = aliases.get(cp) or f[10]
        if not name:
            continue
    if SKIP_NAME.search(name):
        continue
    block = lookup(blocks, cp)
    chars.append([
        cp, name, gc, int(f[3]), f[4], f[5], f[8], 1 if f[9] == "Y" else 0,
        int(f[12], 16) if f[12] else None, int(f[13], 16) if f[13] else None, int(f[14], 16) if f[14] else None,
        lookup(scripts, cp), lookup(ages, cp), blocks.index(next(b for b in blocks if b[2] == block)) if block else None,
        emoji.get(cp), sorted(entities.get(cp, []), key=len)[:4] or None,
        aliases.get(cp) if aliases.get(cp) and aliases.get(cp) != name else None,
    ])

kept = {c[13] for c in chars}
block_rows = [[a, b, name, slugify(name), sum(1 for c in chars if c[13] == i)] for i, (a, b, name) in enumerate(blocks)]
meta = {"version": version("Blocks.txt"), "emoji_version": version("emoji-test.txt") if False else re.search(r"Version: (\S+)", (src / "emoji-test.txt").read_text(encoding="utf-8")).group(1), "count": len(chars), "blocks": block_rows}
(out / "chars.json").write_text(json.dumps(chars, separators=(",", ":"), ensure_ascii=True))
(out / "meta.json").write_text(json.dumps(meta, separators=(",", ":")))
print(f"Unicode {meta['version']}: {len(chars)} characters with pages, {sum(1 for b in block_rows if b[4])} blocks with pages, {sum(1 for c in chars if c[14])} emoji")
