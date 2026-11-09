"""Check the home-to-land voice sequence with real Chromium menu clicks."""
import argparse
import functools
import http.server
import json
import pathlib
import runpy
import threading
import traceback

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
QA = runpy.run_path(str(ROOT / "scripts/qa-p1-voice-browser.py"))
ZONES = {
    "game": ("즐거운놀이터", "Let's play some games!"),
    "numbers": ("숫자놀이터", "Let's play with numbers!"),
    "letters": ("글자놀이터", "Let's play with letters!"),
    "cars": ("자동차놀이터", "Let's play with cars!"),
    "story": ("만화극장", "Story time! Let's listen!"),
    "voice": ("말하기놀이터", "Let's talk and sing!"),
}
ARRIVAL = ("도착했어! 어떤 놀이를 해 볼까?", "Here we are! What shall we play?")


def choose(page, zone):
    page.locator(f'.world-zone[onclick="travelToZone(\'{zone}\')"]').click()


def wait_land(page, zone):
    expect(page.locator(".zone-title")).to_contain_text(ZONES[zone][0], timeout=12000)


def speech(page):
    return [(r["text"], r["lang"]) for r in QA["spoken"](QA["trace"](page))]


def check_menus(page, url, lang):
    QA["start"](page, url, lang)
    index = int(lang == "en")
    locale = "en-US" if index else "ko-KR"
    cases = {}
    for zone, labels in ZONES.items():
        QA["clear"](page)
        choose(page, zone)
        wait_land(page, zone)
        observed = speech(page)
        assert observed == [(labels[index], locale), (ARRIVAL[index], locale)], (zone, observed)
        cases[zone] = observed
        page.get_by_role("button", name="홈으로", exact=True).click()
        expect(page.locator("#worldMapScreen")).to_be_visible()
    return cases


def check_switch_and_back(page, url, lang):
    QA["start"](page, url, lang)
    index = int(lang == "en")
    locale = "en-US" if index else "ko-KR"
    # Hold synthesis open to observe cancellation when switching screens.
    page.evaluate("window.__holdVoice = true")
    QA["clear"](page)
    choose(page, "numbers")
    choose(page, "letters")
    wait_land(page, "letters")
    observed = speech(page)
    assert observed == [(ZONES["numbers"][index], locale),
                        (ZONES["letters"][index], locale), (ARRIVAL[index], locale)], observed
    trace = QA["trace"](page)
    assert any(r["kind"] == "cancel" and r["active"] == ZONES["numbers"][index] for r in trace), trace
    QA["clear"](page)
    page.get_by_role("button", name="홈으로", exact=True).click()
    expect(page.locator("#worldMapScreen")).to_be_visible()
    trace = QA["trace"](page)
    assert any(r["kind"] == "cancel" and r["active"] == ARRIVAL[index] for r in trace), trace
    page.wait_for_timeout(500)
    assert all(row["text"] != ARRIVAL[index] for row in QA["spoken"](QA["trace"](page)))

    QA["clear"](page)
    choose(page, "game")
    wait_land(page, "game")
    page.locator(".zone-game-card").filter(has_text="매직 그림판").click()
    expect(page.locator("#artZoneTarget")).to_be_visible()
    trace = QA["trace"](page)
    assert any(r["kind"] == "cancel" and r["active"] == ARRIVAL[index] for r in trace), trace
    QA["clear"](page)
    page.locator(".game-back-floating").click()
    wait_land(page, "game")
    assert speech(page) == [(ARRIVAL[index], locale)], QA["trace"](page)
    return {"rapidSwitch": observed, "gameReturn": speech(page)}


def check_without_synthesis(page, url, _lang):
    page.add_init_script("Object.defineProperty(window, 'SpeechSynthesisUtterance', {value: undefined})")
    QA["start"](page, url, "en")
    QA["clear"](page)
    choose(page, "story")
    wait_land(page, "story")
    page.get_by_role("button", name="홈으로", exact=True).click()
    expect(page.locator("#worldMapScreen")).to_be_visible()
    assert not speech(page), QA["trace"](page)
    assert not any(r["kind"] == "mp3" for r in QA["trace"](page)), QA["trace"](page)
    return {"arrivedAndReturned": True, "speech": speech(page)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(QA["QuietServer"], directory=str(ROOT))
    results = []
    cases = [(lang, check) for lang in ("ko", "en") for check in (check_menus, check_switch_and_back)]
    cases.append(("en", check_without_synthesis))
    with http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{server.server_port}/index.html"
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for lang, check in cases:
                viewport = {"width":390,"height":844} if lang == "en" else {"width":1366,"height":768}
                context = browser.new_context(viewport=viewport, service_workers="block")
                context.add_init_script(QA["PROBE"])
                context.add_init_script("sessionStorage.setItem('greeted','1')")
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                row = {"language":lang, "case":check.__name__, "errors":errors}
                try:
                    row["observed"] = check(page, url, lang)
                    assert not errors, errors
                    row["status"] = "PASS"
                except Exception:
                    row["status"] = "FAIL"
                    row["failure"] = traceback.format_exc()
                    row["trace"] = QA["trace"](page)
                finally:
                    context.close()
                results.append(row)
                print(lang, row["case"], row["status"], flush=True)
        server.shutdown()
    (args.output / "menu-voice-browser.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    return int(any(row["status"] != "PASS" for row in results))


if __name__ == "__main__":
    raise SystemExit(main())
