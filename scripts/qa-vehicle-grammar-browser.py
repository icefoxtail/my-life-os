"""Verify catalog grammar and real number-count and construction controls."""
import argparse
import functools
import http.server
import json
import pathlib
import runpy
import threading
import traceback
import unicodedata

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
QA = runpy.run_path(str(ROOT / "scripts/qa-p1-voice-browser.py"))
MANIFEST = json.loads((ROOT / "assets/vehicles/vehicles_manifest.json").read_text(encoding="utf-8"))
CONSTRUCTION = json.loads((ROOT / "assets/vehicles/construction_manifest.json").read_text(encoding="utf-8"))


def catalog(page, url):
    QA["start"](page, url, "ko")
    expected = []
    labels = page.evaluate("Object.fromEntries(SihyeonVoiceLabels.vehicles.map(v => [v.id, v.en]))")
    for vehicle in MANIFEST["vehicles"]:
        vehicle_id, korean = vehicle["id"], vehicle["name_ko"]
        english = labels[vehicle_id]
        has_batchim = unicodedata.name(unicodedata.normalize("NFD", korean)[-1], "").startswith(
            "HANGUL JONGSEONG"
        )
        particle = "은" if has_batchim else "는"
        if vehicle_id == "ferry":
            plural = "ferries"
        elif english.split()[-1] == "bus":
            plural = english[:-3] + "buses"
        else:
            plural = english + "s"
        expected.extend([(f"{korean}{particle} 몇 대일까?", "ko-KR"),
                         (f"How many {plural} do you see?", "en-US"),
                         (f"Yes! one {english}! Great counting!", "en-US"),
                         (f"Yes! two {plural}! Great counting!", "en-US")])
    observed = page.evaluate("""vehicles => {
      const count = SihyeonGames.numberCount;
      const settings = SihyeonPlaySettings;
      const feedback = [];
      for (const vehicle of vehicles) {
        settings.setLanguage('ko');
        count.state.currentVehicle = {id: vehicle.id, name: vehicle.name_ko};
        window.__voiceTrace.length = 0;
        count.say('몇 대인지 세어볼까?');
        settings.setLanguage('en');
        count.say('몇 대인지 세어볼까?');
        count.state.currentAnswer = 1;
        count.say('우와 맞았어!');
        count.state.currentAnswer = 2;
        count.say('우와 맞았어!');
        feedback.push(...window.__voiceTrace.filter(row => row.kind === 'tts'));
      }
      return feedback;
    }""", MANIFEST["vehicles"])
    assert len(observed) == len(expected), (len(observed), len(expected))
    for i, (row, pair) in enumerate(zip(observed, expected)):
        assert (row["text"], row["lang"]) == pair, (MANIFEST["vehicles"][i // 4]["id"], row, pair)
    return {"vehicleCount": len(MANIFEST["vehicles"]), "utterances": len(observed)}


def count_round(page, url, lang, vehicle_id, n, question, answer):
    vehicle = next(item for item in MANIFEST["vehicles"] if item["id"] == vehicle_id)
    # Keep the real catalog and routes. Limit the selected category to one vehicle
    # to make the first question predictable without replacing game logic.
    category = vehicle["category"]
    vehicles = [item for item in MANIFEST["vehicles"]
                if item["category"] != category or item["id"] == vehicle_id]
    page.route("**/vehicles_manifest.json", lambda route: route.fulfill(json={**MANIFEST, "vehicles": vehicles}))
    page.add_init_script(f"Math.random = () => {0.01 if n == 1 else 0.25};")
    page.add_init_script("""localStorage.setItem('sihyeon-play-settings-v1',
      JSON.stringify({version: 1, ageMode: 4, challenges: {numberCount: '1-5'}}));""")
    QA["start"](page, url, lang)
    QA["enter"](page, "숫자놀이터", "몇 대일까?")
    page.locator(f'[data-vehicle-cat="{category}"]').click()
    page.wait_for_function("(text) => window.__voiceTrace.some(row => row.text === text)", arg=question)
    expect(page.locator(".nc-vehicle-cell")).to_have_count(n)
    page.locator(f'.nc-toy-block-btn[data-answer="{n}"]').click()
    expect(page.locator(".nc-number-stamp")).to_have_text(str(n), timeout=15000)
    page.wait_for_function("(text) => window.__voiceTrace.some(row => row.text === text)", arg=answer)
    return {"question": question, "answer": answer, "visibleVehicles": n}


def construction(page, url):
    ids = {"wheel_loader", "dump_truck", "concrete_pump_truck"}
    page.route("**/construction_manifest.json", lambda route: route.fulfill(
        json=[item for item in CONSTRUCTION if item["id"] in ids]))
    page.add_init_script("Math.random = () => 0.999;")
    QA["start"](page, url, "ko")
    QA["enter"](page, "자동차놀이터", "공사장")
    results = []
    for vehicle, phrase in [("wheel_loader", "휠로더야!"), ("dump_truck", "덤프트럭이야!")]:
        page.locator(f'.cs-choice[data-id="{vehicle}"]').click(timeout=10000)
        expect(page.locator("#csMessage")).to_contain_text(phrase)
        results.append(phrase)
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=pathlib.Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    cases = [
        ("129 vehicle names", catalog),
        ("Korean count question", lambda page, url: count_round(
            page, url, "ko", "dump_truck", 2, "덤프트럭은 몇 대일까?", "우와 맞았어! 두 대야!")),
        ("English single ferry", lambda page, url: count_round(
            page, url, "en", "ferry", 1, "How many ferries do you see?", "Yes! one ferry! Great counting!")),
        ("English two ferries", lambda page, url: count_round(
            page, url, "en", "ferry", 2, "How many ferries do you see?", "Yes! two ferries! Great counting!")),
        ("Korean construction choices", construction),
    ]
    handler = functools.partial(QA["QuietServer"], directory=str(ROOT))
    results = []
    with http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{server.server_port}/index.html"
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for name, case in cases:
                cx = browser.new_context(viewport={"width": 1366, "height": 768}, service_workers="block")
                cx.add_init_script(QA["PROBE"])
                page = cx.new_page()
                page.set_default_timeout(7000)
                row = {"case": name}
                try:
                    row["observed"] = case(page, url)
                    row["status"] = "PASS"
                except Exception:
                    row["status"] = "FAIL"
                    row["failure"] = traceback.format_exc()
                    row["trace"] = QA["trace"](page)[-30:]
                finally:
                    cx.close()
                results.append(row)
                print(name, row["status"], flush=True)
        server.shutdown()
    (args.output / "vehicle-grammar-browser.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    return int(any(row["status"] != "PASS" for row in results))


if __name__ == "__main__":
    raise SystemExit(main())
