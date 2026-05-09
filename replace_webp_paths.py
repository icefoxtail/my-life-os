from pathlib import Path
import re

jobs = [
    ("index.html", [
        r'(assets/world/[^"\'\)]+)\.png',
        r'(assets/games/cards/[^"\'\)]+)\.png',
        r'(assets/voice/cards/[^"\'\)]+)\.png',
        r'(assets/stories/classic_covers/[^"\'\)]+)\.png',
        r'(assets/stories/folk_covers/[^"\'\)]+)\.png',
    ]),
    ("js/games/life-sequence.js", [
        r'(assets/life-sequence/[^"\'\)]+)\.png',
    ]),
]

for file, patterns in jobs:
    p = Path(file)
    s = p.read_text(encoding="utf-8")
    before = s
    for pat in patterns:
        s = re.sub(pat, r'\1.webp', s)
    p.write_text(s, encoding="utf-8")
    print(f"OK {file}: changed={before != s}")

print("DONE")
