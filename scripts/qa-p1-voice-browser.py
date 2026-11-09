"""P1 browser regressions. Click the application UI and capture speech requests,
media paths, and cancellations. This does not measure device audio output.
"""
import argparse
import functools
import http.server
import json
import pathlib
import re
import threading
import traceback

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROBE = r"""
(() => {
  let root;
  try { root = window.top; if (!root.__voiceTrace) root.__voiceTrace = []; }
  catch (_) { return; }
  const record = row => root.__voiceTrace.push({
    ...row, frame: window === root ? 'parent' : location.pathname, time: Date.now()
  });
  const synth = window.speechSynthesis;
  let active;
  synth.speak = utterance => {
    active = utterance;
    record({kind: 'tts', text: utterance.text, lang: utterance.lang});
    if (root.__holdVoice) return;
    setTimeout(() => {
      if (active === utterance) { active = null; utterance.onend?.({}); }
    }, 35);
  };
  synth.cancel = () => {
    record({kind: 'cancel', active: active?.text ?? null});
    active = null;
  };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (/\.mp3(?:\?|$)/i.test(this.src)) {
      record({kind: 'mp3', path: new URL(this.src).pathname});
      setTimeout(() => this.getAttribute('src') && this.dispatchEvent(new Event('ended')), 35);
      return Promise.resolve();
    }
    return play.call(this);
  };
})();
"""

KO_COUNTS = (
    "", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열",
    "열한", "열두", "열세", "열네", "열다섯", "열여섯", "열일곱", "열여덟", "열아홉",
    "스무", "스물한", "스물두", "스물세", "스물네", "스물다섯", "스물여섯",
    "스물일곱", "스물여덟", "스물아홉", "서른",
)
EN_COUNTS = (
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two",
    "twenty-three", "twenty-four", "twenty-five", "twenty-six", "twenty-seven",
    "twenty-eight", "twenty-nine", "thirty",
)


class QuietServer(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def start(page, url, lang):
    page.goto(url, wait_until="domcontentloaded")
    toggle = page.locator("[data-language-toggle]")
    expect(toggle).to_be_visible()
    if lang == "en":
        toggle.click()


def enter(page, zone, game):
    page.get_by_role("button", name=zone, exact=True).click()
    card = page.locator(".zone-game-card").filter(has_text=game)
    expect(card).to_be_visible(timeout=15000)
    card.click()


def trace(page):
    return page.evaluate("window.__voiceTrace.slice()")


def clear(page):
    page.evaluate("window.__voiceTrace.length = 0")


def spoken(rows):
    return [row for row in rows if row["kind"] == "tts"]


def matching(rows, lang, pattern):
    return [
        row for row in spoken(rows)
        if row["lang"] == ("en-US" if lang == "en" else "ko-KR")
        and re.search(pattern, row["text"], re.IGNORECASE)
    ]


def assert_no_recording(rows, *names):
    bad = [row for row in rows if row["kind"] == "mp3"
           and any(row["path"].endswith(name + ".mp3") for name in names)]
    assert not bad, bad


def count_case(page, lang, count_range):
    enter(page, "숫자놀이터", "몇 대일까?")
    page.locator("#ncRange").select_option(count_range)
    correct = page.locator('.nc-toy-block-btn[data-correct="true"]')
    wrong = page.locator('.nc-toy-block-btn:not([data-correct="true"])').first
    expect(correct).to_be_visible(timeout=20000)
    n = page.locator(".nc-vehicle-cell").count()
    assert n in (range(1, 6) if count_range == "1" else range(21, 31)), n
    assert re.search(rf"(?<!\d){n}(?!\d)", correct.inner_text()), correct.inner_text()

    clear(page)
    wrong.click()
    page.wait_for_function("window.__voiceTrace.some(x => x.kind === 'tts')")
    wrong_rows = trace(page)
    pattern = r"다시.*세" if lang == "ko" else r"(again|try|count)"
    assert len(matching(wrong_rows, lang, pattern)) == 1, wrong_rows
    assert_no_recording(wrong_rows, "games-number-wrong")

    page.wait_for_timeout(850)
    clear(page)
    correct.click()
    stamp = page.locator(".nc-number-stamp")
    expect(stamp).to_have_text(str(n), timeout=27000)
    page.wait_for_timeout(180)
    right_rows = trace(page)
    expected = rf"{KO_COUNTS[n]}\s*대" if lang == "ko" else rf"\b{EN_COUNTS[n]}\b"
    praise = r"(맞았|잘했|정답)" if lang == "ko" else r"(yes|right|great|well done)"
    result = matching(right_rows, lang, expected)
    assert sum(bool(re.search(praise, row["text"], re.IGNORECASE)) for row in result) == 1, right_rows
    assert_no_recording(right_rows, "games-number-correct", "games-number-wrong")
    return {"vehicles": n, "wrong": spoken(wrong_rows), "right": spoken(right_rows)}


def wait_for_memory(page):
    expect(page.locator(".memory-card").first).to_be_visible(timeout=15000)
    expect(page.locator(".memory-card.is-preview")).to_have_count(0, timeout=10000)


def memory_case(page, lang):
    enter(page, "즐거운놀이터", "짝맞추기")
    wait_for_memory(page)
    intro = trace(page)
    assert matching(intro, lang, r"(카드.*(골라|찾)|짝.*찾)" if lang == "ko" else r"(match|same).*card|card.*(match|same)"), intro
    assert_no_recording(intro, "games-memory-intro")
    first = page.locator(".memory-card").first
    key = first.get_attribute("data-pair-key")
    other = page.locator(f'.memory-card:not([data-pair-key="{key}"])').first
    clear(page)
    first.click()
    other.click()
    page.wait_for_timeout(250)
    wrong = trace(page)
    assert matching(wrong, lang, r"(다시|다르)" if lang == "ko" else r"(again|not quite|different|try another)"), wrong
    assert_no_recording(wrong, "games-memory-wrong")
    expect(page.locator(".memory-card.is-open")).to_have_count(0, timeout=6000)

    pair = page.locator(f'.memory-card[data-pair-key="{key}"]')
    expect(pair).to_have_count(2)
    pair.nth(0).click()
    pair.nth(1).click()
    close_started = page.evaluate("performance.now()")
    page.locator(".game-back-floating").click()
    card = page.locator(".zone-game-card").filter(has_text="짝맞추기")
    clear(page)
    card.click()
    reopen_ms = page.evaluate("performance.now()") - close_started
    assert reopen_ms < 330, f"Reopen took {reopen_ms:.0f} ms, outside the match timer window"
    expect(page.locator(".memory-card").first).to_be_visible()
    page.wait_for_timeout(650)
    expect(page.locator(".memory-card.is-matched")).to_have_count(0)
    reopened = trace(page)
    assert not matching(reopened, lang, r"(great match|짝을 찾았|짝을 맞혔)"), reopened
    return {"intro": spoken(intro), "wrong": spoken(wrong),
            "reopened": spoken(reopened), "reopen_ms": round(reopen_ms)}


def art_case(page, lang):
    enter(page, "즐거운놀이터", "매직 그림판")
    expect(page.locator('.az-mode-tab[data-tab="coloring"]')).to_be_visible()
    actions = [
        ("coloring", r"어떤 그림.*색칠" if lang == "ko" else r"which picture.*color"),
        ("free", r"자유롭게.*그려" if lang == "ko" else r"draw anything"),
    ]
    transitions = []
    for mode, pattern in actions:
        clear(page)
        page.locator(f'.az-mode-tab[data-tab="{mode}"]').click()
        page.wait_for_function("window.__voiceTrace.some(x => x.kind === 'tts')")
        rows = trace(page)
        assert len(matching(rows, lang, pattern)) == 1, rows
        assert_no_recording(rows, "games-paint-free", "games-paint-choose")
        transitions.extend(spoken(rows))
    page.evaluate("window.__holdVoice = true")
    clear(page)
    for mode, _ in actions:
        page.locator(f'.az-mode-tab[data-tab="{mode}"]').click()
    page.locator(".game-back-floating").click()
    rows = trace(page)
    for _, pattern in actions:
        assert len(matching(rows, lang, pattern)) == 1, rows
    assert sum(row["kind"] == "cancel" and bool(row["active"]) for row in rows) >= 2, rows
    return {"transitions": transitions, "rapid_and_exit": rows}


def hangul_case(page, lang):
    enter(page, "글자놀이터", "3D 한글 블록")
    frame = page.frame_locator("#hangulPlaymatFrame")
    tiles = frame.locator("#choRow button")
    expect(tiles.first).to_be_visible(timeout=25000)
    clear(page)
    page.evaluate("window.__holdVoice = true")
    tiles.first.click()
    rows = trace(page)
    assert all(row["frame"] == "parent" for row in spoken(rows)), rows
    if lang == "ko":
        assert len(matching(rows, lang, r"기역")) == 1, rows
    else:
        assert not spoken(rows), rows
    frame.locator("#soundBtn").click()
    muted = trace(page)
    if spoken(rows):
        assert any(row["kind"] == "cancel" and row["active"] == spoken(rows)[-1]["text"]
                   for row in muted), muted
    clear(page)
    tiles.nth(1).click()
    assert not spoken(trace(page)), trace(page)
    frame.locator("#soundBtn").click()
    tiles.first.click()
    page.locator(".game-back-floating").click()
    assert page.locator("#hangulPlaymatFrame").count() == 0
    exited = trace(page)
    if lang == "ko":
        assert any(row["kind"] == "cancel" and "기역" in (row["active"] or "")
                   for row in exited), exited
    return {"first_tile": spoken(rows), "muted_trace": muted, "exit_trace": exited}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=pathlib.Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(QuietServer, directory=str(ROOT))
    results = []
    with http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{server.server_port}/index.html"
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
            )
            for lang in ("ko", "en"):
                cases = [
                    ("count 1-5", lambda page: count_case(page, lang, "1")),
                    ("count 21-30", lambda page: count_case(page, lang, "5")),
                    ("memory feedback and reopen", lambda page: memory_case(page, lang)),
                    ("drawing transitions and exit", lambda page: art_case(page, lang)),
                    ("3D Hangul speech and mute", lambda page: hangul_case(page, lang)),
                ]
                for name, run in cases:
                    row = {"language": lang, "case": name, "errors": []}
                    results.append(row)
                    phone = name.startswith("drawing")
                    viewport = {"width": 390, "height": 844} if phone else {"width": 1366, "height": 768}
                    context = browser.new_context(viewport=viewport, has_touch=phone, service_workers="block")
                    context.add_init_script(PROBE)
                    page = context.new_page()
                    page.on("pageerror", lambda error: row["errors"].append(str(error)))
                    try:
                        start(page, url, lang)
                        row["observed"] = run(page)
                        assert not row["errors"], row["errors"]
                        row["status"] = "PASS"
                    except Exception:
                        row["status"] = "FAIL"
                        row["failure"] = traceback.format_exc()
                        row["trace"] = trace(page)
                    finally:
                        context.close()
                    print(lang, name, row["status"], flush=True)
                    (args.output / "p1-voice-browser.json").write_text(
                        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
                    )
        server.shutdown()
    return int(any(row["status"] != "PASS" for row in results))


if __name__ == "__main__":
    raise SystemExit(main())
