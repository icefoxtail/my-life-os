"""Exercise home guide timing and language through real Chromium controls."""
import argparse
import datetime
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
GUIDE = {
    "ko": ("시현아 안녕. 놀이공원에 온 걸 환영해.",
           "어디로 갈까? 가고 싶은 곳을 살짝 눌러볼까?"),
    "en": ("Hi there! Ready to play?", "Where shall we go?"),
}
OLD_CLIPS = ("common-welcome", "common-wheretogo")


def require_speech(page, lang, text):
    rows = QA["trace"](page)
    locale = {"ko": "ko-KR", "en": "en-US"}[lang]
    assert [(row["text"], row["lang"]) for row in QA["spoken"](rows)] == [(text, locale)], rows
    QA["assert_no_recording"](rows, *OLD_CLIPS)
    return rows


def regular(page, url, lang):
    welcome, guide = GUIDE[lang]
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_function(
        "(text) => window.__voiceTrace.some(row => row.text === text)", arg=welcome
    )
    first = require_speech(page, lang, welcome)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(700)
    assert not QA["spoken"](QA["trace"](page)), QA["trace"](page)
    QA["assert_no_recording"](QA["trace"](page), *OLD_CLIPS)
    page.get_by_role("button", name="즐거운놀이터", exact=True).click()
    back = page.get_by_role("button", name="홈으로", exact=True)
    expect(back).to_be_visible(timeout=15000)
    page.evaluate("window.__voiceTrace.length = 0")
    back.click()
    if lang == "ko":
        page.wait_for_function("window.__voiceTrace.some(row => row.path?.endsWith('common-backtopark.mp3'))")
    else:
        page.wait_for_function("window.__voiceTrace.some(row => /welcome back/i.test(row.text))")
    returned = QA["trace"](page)
    QA["assert_no_recording"](returned, *OLD_CLIPS)
    assert not any(row.get("text") == welcome for row in returned), returned

    page.evaluate("window.__holdVoice = true; window.__voiceTrace.length = 0")
    mic = page.get_by_role("button", name="안내", exact=True)
    mic.click(click_count=2)
    rapid = QA["trace"](page)
    speech = QA["spoken"](rapid)
    assert [row["text"] for row in speech] == [guide, guide], rapid
    assert speech[0]["lang"] == speech[1]["lang"] == {"ko": "ko-KR", "en": "en-US"}[lang]
    assert any(row["kind"] == "cancel" and row["active"] == guide for row in rapid), rapid
    QA["assert_no_recording"](rapid, *OLD_CLIPS)
    return {"first": first, "return": returned, "rapid": rapid}


def early_guide(page, url, lang):
    # Freeze the clock before navigation so network timing cannot consume 600 ms.
    start = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
    page.clock.install(time=start)
    page.clock.pause_at(start + datetime.timedelta(minutes=1))
    page.goto(url, wait_until="domcontentloaded")
    page.get_by_role("button", name="안내", exact=True).click(force=True)
    page.clock.run_for(750)
    return require_speech(page, lang, GUIDE[lang][1])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(QA["QuietServer"], directory=str(ROOT))
    rows = []
    with http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{server.server_port}/index.html"
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for lang in GUIDE:
                for case in (regular, early_guide):
                    row = {"language": lang, "case": case.__name__}
                    rows.append(row)
                    cx = browser.new_context(
                        viewport={"width": 390, "height": 844} if case is early_guide
                        else {"width": 1366, "height": 768},
                        service_workers="block",
                    )
                    cx.add_init_script(QA["PROBE"])
                    if lang == "en":
                        cx.add_init_script("""
                          localStorage.setItem('sihyeon-play-settings-v1',
                            JSON.stringify({version: 1, language: 'en'}));
                        """)
                    page = cx.new_page()
                    page.set_default_timeout(5000)
                    try:
                        row["observed"] = case(page, url, lang)
                        row["status"] = "PASS"
                    except Exception:
                        row["status"] = "FAIL"
                        row["failure"] = traceback.format_exc()
                        row["trace"] = QA["trace"](page)
                    finally:
                        cx.close()
                    print(lang, case.__name__, row["status"], flush=True)
        server.shutdown()
    (args.output / "home-voice-browser.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return int(any(row["status"] != "PASS" for row in rows))


if __name__ == "__main__":
    raise SystemExit(main())
