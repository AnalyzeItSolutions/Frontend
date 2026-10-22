"""Check the codes published on every /unicode page by decoding them with Python's own codecs.

    node scripts/seo/export_unicode.mjs /tmp/u.json && python -I scripts/seo/verify_unicode.py /tmp/u.json
"""
import codecs
import html
import json
import sys
import unicodedata
import urllib.parse

items = json.load(open(sys.argv[1], encoding="utf-8"))
bad = []
for it in items:
    cp, ch, c = it["cp"], chr(it["cp"]), it["codes"]

    def expect(label, got):
        if got != ch:
            bad.append(f"U+{cp:04X} {label}: {got!r}")

    expect("UTF-8", bytes.fromhex(c["UTF-8 bytes"]).decode("utf-8"))
    expect("UTF-16", bytes.fromhex(c["UTF-16 (big-endian)"]).decode("utf-16-be"))
    expect("UTF-32", bytes.fromhex(c["UTF-32"]).decode("utf-32-be"))
    if "HTML decimal" in c:
        expect("HTML decimal", html.unescape(c["HTML decimal"]))
        expect("HTML hex", html.unescape(c["HTML hex"]))
    elif not (cp == 0 or cp == 0x0D or (cp < 0x20 and cp not in (9, 10, 12)) or 0x7F <= cp <= 0x9F):
        bad.append(f"U+{cp:04X} is marked invalid in HTML but is not a control the HTML Standard rejects")
    for ent in c.get("HTML named", "").split():
        expect(f"entity {ent}", html.unescape(ent))
    expect("JSON", json.loads(f'"{c["JSON"]}"'))
    expect("Python", codecs.decode(c["Python"], "unicode_escape"))
    expect("URL", urllib.parse.unquote(c["URL (percent-encoded)"]))
    expect("CSS", chr(int(c["CSS"][1:], 16)))
    expect("Rust", chr(int(c["Rust, Swift"][3:-1], 16)))
    if "Python by name" in c:
        try:
            expect("Python by name", unicodedata.lookup(c["Python by name"][3:-1]))
        except KeyError:
            pass  # newer than this Python's Unicode database; the name itself is checked against UnicodeData.txt
        else:
            if unicodedata.name(ch, None) not in (None, it["name"]):
                bad.append(f"U+{cp:04X} name {it['name']!r} vs Python {unicodedata.name(ch)!r}")

print(f"checked {len(items)} characters against Python {unicodedata.unidata_version} codecs")
if bad:
    print(len(bad), "FAILURES"); print("\n".join(bad)); sys.exit(1)
print("all codes decode to the right character")
