"""Native public-menu progression checks for life-sequence in real Chromium.

Deterministic randomness preserves the six published mission orders. All game
actions use native Playwright clicks; no private game state or replacement game
handler is injected. Voice spies call through and establish requests only, not
audible silence. Source hashes come from actual browser response bodies.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import re
import threading
import time
import traceback
from urllib.parse import urljoin, urlsplit, urlunsplit

from playwright.sync_api import expect, sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = ("index.html", "js/games/life-sequence.js", "js/voice-engine.js")
VIEWPORTS = ((390, 844), (844, 390))
MISSIONS = (
    ("손 씻기", ("water", "soap", "rinse", "towel")),
    ("양치하기", ("paste", "brush", "rinse")),
    ("밥 먹기", ("clean", "sit", "eat")),
    ("잠자기", ("pajamas", "book", "light")),
    ("외출 준비", ("clothes", "shoes", "door")),
    ("장난감 정리", ("gather", "basket", "clean")),
)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def normalized_base(value):
    parsed = urlsplit(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("--base-url must be an HTTP(S) playground URL")
    path = parsed.path
    if path.endswith("/index.html"):
        path = path[:-len("index.html")]
    return urlunsplit((parsed.scheme, parsed.netloc, path.rstrip("/") + "/", "", ""))


def source_evidence(responses, base):
    by_path = {urlsplit(urljoin(base, name)).path: name for name in SOURCES}
    evidence = {}
    for response in responses:
        name = by_path.get(urlsplit(response.url).path)
        if name:
            served = sha(response.body())
            expected = sha((ROOT / name).read_bytes())
            evidence[name] = {"url": response.url, "httpStatus": response.status,
                              "servedSha256": served, "checkoutSha256": expected,
                              "matchesCheckout": served == expected}
    assert set(evidence) == set(SOURCES), f"Missing browser source responses: {evidence}"
    assert all(row["httpStatus"] == 200 and row["matchesCheckout"] for row in evidence.values()), evidence
    return evidence


def check_buttons(page, final=False):
    viewport = page.viewport_size
    boxes = {}
    for name in (("restart", "home") if final else ("next", "replay")):
        locator = page.locator(f"[data-{name}]" if final else f"[data-life-{name}]")
        expect(locator).to_be_enabled()
        box = locator.bounding_box()
        assert box and box["width"] >= 44 and box["height"] >= 44, (name, box)
        assert box["x"] >= 0 and box["y"] >= 0, box
        assert box["x"] + box["width"] <= viewport["width"] + 1, box
        assert box["y"] + box["height"] <= viewport["height"] + 1, box
        assert locator.evaluate("""element => {
          const box = element.getBoundingClientRect();
          const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
          return hit === element || element.contains(hit);
        }"""), f"{name} button is covered"
        boxes[name] = box
    return boxes


def check_completion_layout(page):
    # Inspect the real animated message while it is opaque, rather than relying
    # on hidden DOM rectangles or shortening the success text in the fixture.
    page.wait_for_function("""() => {
      const message = document.querySelector('.ls-root.complete #lsMessage.show');
      return message && Number(getComputedStyle(message).opacity) >= 0.98;
    }""", timeout=4000)
    selectors = {"scene": "#lsScene", "message": "#lsMessage",
                 "actions": ".ls-result-pool", "status": ".ls-round-status"}
    boxes = {name: page.locator(selector).bounding_box() for name, selector in selectors.items()}
    assert all(boxes.values()), boxes
    message, scene = boxes["message"], boxes["scene"]
    assert message["x"] >= scene["x"] and message["y"] >= scene["y"], boxes
    assert message["x"] + message["width"] <= scene["x"] + scene["width"] + 1, boxes
    assert message["y"] + message["height"] <= scene["y"] + scene["height"] + 1, boxes
    for name in ("actions", "status"):
        other = boxes[name]
        overlap_width = min(message["x"] + message["width"], other["x"] + other["width"]) - max(message["x"], other["x"])
        overlap_height = min(message["y"] + message["height"], other["y"] + other["height"]) - max(message["y"], other["y"])
        assert overlap_width <= 0 or overlap_height <= 0, (name, boxes)
    assert page.locator("#lsMessage").evaluate("""element =>
      element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1
    """), "Success text is clipped inside the message"
    return {"viewport": page.viewport_size, "boxes": boxes, "buttons": check_buttons(page),
            "message": page.locator("#lsMessage").inner_text(),
            "status": page.locator(".ls-round-status").inner_text()}


def install_voice_probe(page):
    page.evaluate("""() => {
      if (!window.SihyeonVoice?.stop) throw new Error('Actual shared voice engine missing');
      const probe = {engineStops: 0, nativeCancels: 0};
      const stop = SihyeonVoice.stop.bind(SihyeonVoice);
      SihyeonVoice.stop = (...args) => { probe.engineStops++; return stop(...args); };
      const cancel = speechSynthesis.cancel.bind(speechSynthesis);
      speechSynthesis.cancel = (...args) => { probe.nativeCancels++; return cancel(...args); };
      window.__lifeVoiceProbe = probe;
    }""")


def native_case(page, base, output, width, height, responses):
    size = f"{width}x{height}"
    page.add_init_script("Math.random = () => 0.9999;")
    navigation = page.goto(urljoin(base, "index.html"), wait_until="load", timeout=45000)
    assert navigation and navigation.ok
    page.locator('.world-zone[onclick="travelToZone(\'game\')"]').click()
    page.locator('.zone-game-card[onclick="openLifeSequenceGame()"]').click()
    expect(page.locator('.ls-mission-icon[aria-label="손 씻기"]')).to_be_visible()
    expect(page.locator(".ls-pool-card")).to_have_count(4)
    expect(page.locator('svg[aria-label="흐르는 물로 손의 거품을 헹구기"]')).to_have_count(1)
    page.wait_for_function("document.querySelector('#lsScene')?.dataset.complete === '1'")
    sources = source_evidence(responses, base)
    install_voice_probe(page)

    # Preserve the two already-correct slots while the swapped middle pair returns.
    for card_id in ("water", "rinse", "soap", "towel"):
        page.locator(f'.ls-pool-card[data-card="{card_id}"]').click()
    expect(page.locator(".ls-slot.wrong")).to_have_count(2)
    expect(page.locator('.ls-slot[data-slot="1"] [data-remove]')).to_have_count(0)
    expect(page.locator('.ls-slot[data-slot="2"] [data-remove]')).to_have_count(0)
    expect(page.locator('.ls-slot[data-slot="0"] [data-remove]')).to_have_attribute("aria-label", "손을 물에 적셔요")
    expect(page.locator('.ls-slot[data-slot="3"] [data-remove]')).to_have_attribute("aria-label", "수건으로 닦아요")
    expect(page.locator("[data-life-next]")).to_have_count(0)
    for card_id in ("soap", "rinse"):
        page.locator(f'.ls-pool-card[data-card="{card_id}"]').click()
    last_click = time.monotonic()
    expect(page.locator("[data-life-next]")).to_be_visible(timeout=1500)
    verdict_to_control = round((time.monotonic() - last_click) * 1000)
    buttons = check_buttons(page)
    page.screenshot(path=str(output / f"life-correct-{size}.png"))
    expect(page.locator(".ls-root.complete")).to_have_count(1, timeout=4000)
    expect(page.locator(".ls-scene.has-complete")).to_have_count(1)
    expect(page.locator(".ls-slot.correct")).to_have_count(4)
    completion_layouts = {"washHands": check_completion_layout(page)}
    page.screenshot(path=str(output / f"life-completion-{size}.png"))
    # The old implementation automatically moved on after about 12 seconds.
    page.wait_for_timeout(14000)
    expect(page.locator('.ls-mission-icon[aria-label="손 씻기"]')).to_be_visible()
    expect(page.locator(".ls-slot.correct")).to_have_count(4)
    expect(page.locator("[data-life-next]")).to_be_enabled()

    page.locator("[data-life-replay]").click()
    page.set_viewport_size({"width": height, "height": width})
    expect(page.locator(".ls-root")).to_have_class(re.compile(
        "life-sequence-" + ("landscape" if height > width else "portrait")))
    rotated_buttons = check_buttons(page)
    page.screenshot(path=str(output / f"life-replay-rotated-{height}x{width}.png"))
    before_next = page.evaluate("() => window.__lifeVoiceProbe")
    page.locator("[data-life-next]").click()
    expect(page.locator('.ls-mission-icon[aria-label="양치하기"]')).to_be_visible()
    after_next = page.evaluate("() => window.__lifeVoiceProbe")
    assert after_next["engineStops"] > before_next["engineStops"], (before_next, after_next)
    assert after_next["nativeCancels"] > before_next["nativeCancels"], (before_next, after_next)
    expect(page.locator("[data-life-next]")).to_have_count(0)
    expect(page.locator(".ls-slot.correct")).to_have_count(0)

    for title, cards in MISSIONS[1:]:
        expect(page.locator(f'.ls-mission-icon[aria-label="{title}"]')).to_be_visible()
        for card_id in cards:
            page.locator(f'.ls-pool-card[data-card="{card_id}"]').click()
        expect(page.locator("[data-life-next]")).to_be_enabled(timeout=1500)
        check_buttons(page)
        if title == MISSIONS[-1][0]:
            expect(page.locator("[data-life-next]")).to_have_text("🏁 마침")
            completion_layouts["cleanUp"] = check_completion_layout(page)
            expect(page.locator(".ls-success")).to_have_count(0)
            page.screenshot(path=str(output / f"life-before-finish-{size}.png"))
            page.wait_for_timeout(2000)
            expect(page.locator(".ls-success")).to_have_count(0)
        page.locator("[data-life-next]").click()
    expect(page.locator(".ls-success")).to_be_visible()
    expect(page.locator(".ls-success-title")).to_have_text("하루놀이 완료!")
    finished_buttons = check_buttons(page, final=True)
    finished_box = page.locator(".ls-success-box").bounding_box()
    viewport = page.viewport_size
    assert finished_box and finished_box["x"] >= 0 and finished_box["y"] >= 0, finished_box
    assert finished_box["x"] + finished_box["width"] <= viewport["width"] + 1, finished_box
    assert finished_box["y"] + finished_box["height"] <= viewport["height"] + 1, finished_box
    page.screenshot(path=str(output / f"life-finished-{size}.png"))
    page.locator("[data-home]").click()
    expect(page.locator('.zone-game-card[onclick="openLifeSequenceGame()"]')).to_be_visible()
    return {"driver": "Native public menu, wrong/correct card clicks, Replay, rotation, Next, Finish and Home",
            "sourceSha256": sources, "buttons": buttons, "rotatedButtons": rotated_buttons,
            "completionLayouts": completion_layouts, "finishedButtons": finished_buttons,
            "finishedPanel": {"viewport": viewport, "box": finished_box},
            "nextVisibleAfterFinalCardClickMs": verdict_to_control,
            "noAutomaticProgressionWaitMs": 14000,
            "voiceBeforeNext": before_next, "voiceAfterNext": after_next,
            "audibleVerification": "NOT_RUN", "completedMissions": len(MISSIONS)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url")
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path("qa-creator-life-pace"))
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    report = {"status": "RUNNING", "checks": [], "pageErrors": [], "failedRequests": [],
              "testScriptSha256": sha(pathlib.Path(__file__).read_bytes()),
              "checkoutSourceSha256": {name: sha((ROOT / name).read_bytes()) for name in SOURCES},
              "scope": {"nativeUI": True, "privateGameStateInjection": False,
                        "deterministicRandomness": True, "voice": "pass-through cancellation request spies",
                        "notRun": ["audible TTS", "physical device", "child observation"]}}
    server = None
    try:
        if args.base_url:
            base = normalized_base(args.base_url)
        else:
            handler = functools.partial(Quiet, directory=str(ROOT))
            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = f"http://127.0.0.1:{server.server_port}/"
        report["baseUrl"] = base
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            report["browserVersion"] = browser.version
            for width, height in VIEWPORTS:
                size = f"{width}x{height}"
                context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block")
                page = context.new_page()
                page.set_default_timeout(15000)
                responses = []
                page.on("response", lambda response, target=responses: target.append(response))
                page.on("pageerror", lambda error, s=size: report["pageErrors"].append({"viewport": s, "error": str(error)}))
                page.on("requestfailed", lambda request, s=size: report["failedRequests"].append(
                    {"viewport": s, "url": request.url, "failure": request.failure}))
                try:
                    detail = native_case(page, base, output, width, height, responses)
                    report["checks"].append({"viewport": size, "status": "PASS", "detail": detail})
                except Exception as exc:
                    report["checks"].append({"viewport": size, "status": "FAIL", "error": str(exc), "trace": traceback.format_exc()})
                    page.screenshot(path=str(output / f"life-failure-{size}.png"))
                finally:
                    context.close()
            browser.close()
    except Exception as exc:
        report["checks"].append({"status": "FAIL", "kind": "ENVIRONMENT", "error": str(exc), "trace": traceback.format_exc()})
    finally:
        if server:
            server.shutdown()
            server.server_close()
        report["status"] = "PASS" if (len(report["checks"]) == 2
            and all(row["status"] == "PASS" for row in report["checks"])
            and not report["pageErrors"]) else "FAIL"
        (output / "life-pace-results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("LIFE_PACE_BROWSER " + report["status"], flush=True)
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
