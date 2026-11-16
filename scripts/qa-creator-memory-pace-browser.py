"""Public-menu memory pacing regression in Chromium.

All selections use native Playwright clicks. The real shared TTS engine receives
controlled SpeechSynthesisUtterance.onend callbacks; the native speech device and
unrelated recorded prompts are muted. This is callback/DOM evidence, not audible
speech or physical-touch verification. No private game state is changed.
"""
import argparse
import collections
import functools
import hashlib
import http.server
import json
import pathlib
import re
import subprocess
import threading
import traceback
import urllib.request

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEECH_DEVICE = """(() => {
  const device = window.__memoryPaceSpeech = {requests: [], cancels: 0};
  Object.defineProperty(speechSynthesis, 'speak', {value(utterance) {
    device.requests.push({utterance, text: utterance.text, ended: false});
  }});
  Object.defineProperty(speechSynthesis, 'cancel', {value() { device.cancels++; }});
  Object.defineProperty(speechSynthesis, 'getVoices', {value() { return []; }});
  device.finish = id => {
    const request = device.requests[id];
    if (!request || request.ended) throw new Error('No pending speech request ' + id);
    request.ended = true;
    request.utterance.onend?.(new Event('end'));
    return performance.now();
  };
})();"""


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def run_case(page, base, output, category, count):
    page.add_init_script(SPEECH_DEVICE)
    page.goto(base + "index.html", wait_until="load")
    page.evaluate("""() => {
      if (!window.SihyeonVoice?.speak) throw new Error('real TTS engine missing');
      // Keep the actual speak/stop implementation; only unrelated MP3 prompts
      // are silenced so no audible-quality claim depends on this device stub.
      window.SihyeonVoice.play = () => Promise.resolve(false);
    }""")
    page.locator('.world-zone[onclick="travelToZone(\'game\')"]').click()
    page.locator('.zone-game-card[onclick="openMemoryGame()"]' ).click()
    page.locator(".memory-card").first.wait_for()
    back = page.locator(".game-back-floating").bounding_box()
    level = page.locator('.memory-level-chip[data-count="8"]').bounding_box()
    assert back and level and level["y"] >= back["y"] + back["height"], "portrait level controls must clear the public back button"
    page.screenshot(path=str(output / f"memory-{category}-{count}-controls.png"))
    page.locator(f'.memory-level-chip[data-count="{count}"]').click()
    page.locator('[data-action="open-category-sheet"]').click()
    page.locator(f'.memory-vehicle-cat-chip[data-vehicle-cat="{category}"]').click()
    expect(page.locator(".memory-card")).to_have_count(count)
    expect(page.locator(".memory-card.is-preview")).to_have_count(0, timeout=6000)
    page.wait_for_function("""() => [...document.querySelectorAll('.memory-card-front img')]
      .every(img => img.complete && img.naturalWidth > 0)""")
    cards = page.locator(".memory-card").evaluate_all("""cards => cards.map(card => ({
      index: Number(card.dataset.index), uid: card.dataset.cardUid,
      src: card.querySelector('img')?.getAttribute('src')
    }))""")
    groups = collections.defaultdict(list)
    for card in cards:
        groups[card["src"]].append(card)
    group = next(values for values in groups.values() if len(values) >= 4)
    first = group[0]
    second = next(card for card in group if card["uid"][:-2] != first["uid"][:-2])
    third = next(card for card in group if card["uid"] not in {first["uid"], second["uid"]})
    page.locator(f'.memory-card[data-index="{first["index"]}"]').click()
    expect(page.locator(f'.memory-card[data-index="{first["index"]}"]')).to_have_class(re.compile(r"\bis-open\b"))
    before_role = page.evaluate("""() => {
      const d = window.__memoryPaceSpeech;
      d.finish(d.requests.length - 1);
      return d.requests.length;
    }""")
    page.locator(f'.memory-card[data-index="{second["index"]}"]').click()
    expect(page.locator(".memory-card.is-matched")).to_have_count(2)
    page.wait_for_function("n => window.__memoryPaceSpeech.requests.length > n", arg=before_role)
    role_id = page.evaluate("window.__memoryPaceSpeech.requests.length - 1")
    role_text = page.evaluate("id => window.__memoryPaceSpeech.requests[id].text", role_id)
    cancels = page.evaluate("window.__memoryPaceSpeech.cancels")
    if count == 16:
        page.set_viewport_size({"width": 844, "height": 390})
        expect(page.locator(".memory-game-container.memory-landscape")).to_be_visible()
        expect(page.locator(".memory-card.is-matched")).to_have_count(2)
    next_card = page.locator(f'.memory-card[data-index="{third["index"]}"]')
    next_card.click()
    expect(next_card).not_to_have_class(re.compile(r"\bis-open\b"))
    assert page.evaluate("window.__memoryPaceSpeech.cancels") == cancels, "waiting does not stop the role voice"
    ended_at = page.evaluate("id => window.__memoryPaceSpeech.finish(id)", role_id)
    next_card.click()
    expect(next_card).to_have_class(re.compile(r"\bis-open\b"), timeout=750)
    accepted_at = page.evaluate("performance.now()")
    assert accepted_at - ended_at < 1000, "the next native click must be accepted within 1s of actual speech completion"
    expect(page.locator(".memory-card.is-matched")).to_have_count(2)
    page.screenshot(path=str(output / f"memory-{category}-{count}-next-card.png"))
    return {"category": category, "cardCount": count, "crossPairUids": [first["uid"], second["uid"]],
            "roleText": role_text, "nextCardUid": third["uid"], "inputAfterEndMs": round(accepted_at - ended_at, 1),
            "rotatedWhileSpeaking": count == 16, "heldDuringSpeech": True, "backBounds": back, "levelBounds": level}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url")
    parser.add_argument("--output", default="qa-creator-memory-pace-evidence")
    args = parser.parse_args()
    output = pathlib.Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    server = None
    if args.base_url:
        base = args.base_url.rstrip("/") + "/"
    else:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_port}/"
    report = {"scope": "public-menu native clicks and actual TTS engine completion callbacks",
              "audio": "native speech device controlled; MP3 play muted; no audible or physical-touch QA",
              "baseUrl": base, "checks": [], "pageErrors": [], "sourceHashes": {}}
    try:
        report["sourceCommit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        report["sourceCommit"] = None
    try:
        for filename in ["index.html", "js/games/vehicle-memory.js", "js/voice-engine.js", "js/voice-labels.js",
                         "assets/vehicles/vehicles_manifest.json"]:
            local = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()
            request = urllib.request.Request(base + filename, headers={"Cache-Control": "no-cache"})
            with urllib.request.urlopen(request, timeout=30) as response:
                served = hashlib.sha256(response.read()).hexdigest()
            report["sourceHashes"][filename] = {"local": local, "served": served, "match": local == served}
            assert local == served, f"source mismatch: {filename}"
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            report["browser"] = browser.version
            for category, count in [("rescue", 8), ("police", 16)]:
                name = f"memory-{category}-{count}"
                context = browser.new_context(viewport={"width": 390, "height": 844}, service_workers="block")
                page = context.new_page()
                page.on("pageerror", lambda error, name=name: report["pageErrors"].append({"case": name, "error": str(error)}))
                try:
                    detail = run_case(page, base, output, category, count)
                    report["checks"].append({"name": name, "status": "PASS", "detail": detail})
                except Exception as error:
                    page.screenshot(path=str(output / f"{name}-failure.png"))
                    report["checks"].append({"name": name, "status": "FAIL", "error": str(error), "trace": traceback.format_exc()})
                finally:
                    print(json.dumps(report["checks"][-1], ensure_ascii=False), flush=True)
                    context.close()
            browser.close()
        report["status"] = "PASS" if len(report["checks"]) == 2 and all(case["status"] == "PASS" for case in report["checks"]) and not report["pageErrors"] else "FAIL"
    except Exception as error:
        report["status"] = "FAIL"
        report["fatalError"] = str(error)
        report["trace"] = traceback.format_exc()
    finally:
        if server:
            server.shutdown()
        (output / "creator-memory-pace-results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    raise SystemExit(0 if report["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
