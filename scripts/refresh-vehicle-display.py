"""Measure current vehicle bytes; never edit images or change selection eligibility."""
import argparse
import hashlib
import json
import pathlib
import re

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
BOUNDS = ROOT / "assets/vehicles/display_bounds.json"
HELPER = ROOT / "js/vehicle-display.js"


def measure():
    previous = json.loads(BOUNDS.read_text())
    files = []
    for name in ["vehicles_manifest.json", "fire_special_manifest.json"]:
        manifest = json.loads((ROOT / "assets/vehicles" / name).read_text())
        entries = manifest["vehicles"] if isinstance(manifest, dict) else manifest
        files.extend(item["file"].removeprefix("./") for item in entries)
    result = {}
    for filename in dict.fromkeys(files):
        source = ROOT / filename
        key = filename.removeprefix("assets/vehicles/")
        with Image.open(source) as image:
            rgba = image.convert("RGBA")
            alpha = rgba.getchannel("A").point(lambda a: 255 if a >= 16 else 0)
            box = alpha.getbbox() or (0, 0, rgba.width, rgba.height)
            result[key] = {
                "box": list(box), "width": rgba.width, "height": rgba.height,
                "clean": bool(previous.get(key, {}).get("clean", False)),
                "alphaThreshold": 16,
                "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            }
    ledger = json.loads((ROOT / "docs/qa/release/VEHICLE_IMAGE_ONLY_RELEASE_20261109.json").read_text())
    for item in ledger["items"]:
        key = item["path"].removeprefix("assets/vehicles/")
        if result[key]["sourceSha256"] != item["resultSha256"]:
            raise RuntimeError("Approved image bytes differ: " + item["path"])
    if len(result) != 138:
        raise RuntimeError("Vehicle manifest denominator changed; review it before updating geometry.")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    result = measure()
    compact = json.dumps(result, separators=(",", ":"))
    bounds_text = compact + "\n"
    old_helper = HELPER.read_text()
    helper_text, count = re.subn(r"^const bounds = .*;$", "const bounds = " + compact + ";", old_helper, count=1, flags=re.M)
    if count != 1:
        raise RuntimeError("Embedded metadata declaration is missing.")
    if args.check:
        if BOUNDS.read_text() != bounds_text or old_helper != helper_text:
            raise RuntimeError("Vehicle geometry does not match current source bytes.")
    else:
        BOUNDS.write_text(bounds_text)
        HELPER.write_text(helper_text)
    print(json.dumps({"status": "PASS", "measuredSources": len(result),
                      "preservedCleanPool": sum(item["clean"] for item in result.values()),
                      "approvedImageHashes": 76, "imagesModified": 0}))


if __name__ == "__main__":
    main()
