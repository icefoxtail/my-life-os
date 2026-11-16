"""Native public-menu free-train editing; existing suite is an external CI gate.

Only visible controls edit the new scenario. DOM and the existing read-only
snapshot/localStorage confirm the result. Voice is muted; no audible or physical
touch claim is made. --include-existing also runs the unchanged existing suite,
which uses scripted DOM/Pointer Events and real CSS, as its own report states.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import subprocess
import threading
import traceback
import urllib.request

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
SAVE_KEY = "sihyeon-pattern-train-v1:board:free-animal"


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def mute(page):
    page.evaluate("""() => {
      const voice = window.SihyeonVoice || {};
      for (const method of ['play', 'playSequence', 'speak']) voice[method] = () => Promise.resolve(false);
      voice.stop = () => {};
      window.SihyeonVoice = voice;
    }""")


def enter_train(page):
    mute(page)
    page.locator('.world-zone[onclick="travelToZone(\'numbers\')"]').click()
    page.locator('.zone-game-card[onclick="openPatternTrainGame()"]' ).click()
    expect(page.locator(".pt-app")).to_be_visible()


def action(page, name):
    return page.locator(f'.pt-app [data-action="{name}"]')


def select(page, token):
    page.locator(f'.pt-part[data-token="{token}"]').click()


def board(page, expected, selected=None):
    expect(page.locator(".pt-seat")).to_have_count(len(expected))
    actual = page.locator(".pt-seat").evaluate_all("seats => seats.map(seat => seat.dataset.token || null)")
    assert actual == expected, (actual, expected)
    expect(page.locator(".pt-length-controls > span")).to_have_text(f"{len(expected)}칸")
    snapshot = page.evaluate("SihyeonGames.patternTrain.getSnapshot()")
    assert snapshot["state"]["size"] == len(expected)
    assert snapshot["state"]["board"] == expected
    if selected:
        expect(page.locator(f'.pt-part[data-token="{selected}"]')).to_have_attribute("aria-pressed", "true")
        assert snapshot["state"]["selected"] == selected
    return snapshot


def native_case(page, base, output):
    page.goto(base + "index.html", wait_until="load")
    enter_train(page)
    action(page, "free").click()
    for _ in range(3):
        action(page, "shorter").click()
    board(page, [None, None, None])
    original = ["cat", "rabbit", "bear"]
    for index, token in enumerate(original):
        select(page, token)
        page.locator(f'.pt-seat[data-index="{index}"]').click()
    select(page, "frog")
    before = board(page, original, "frog")
    action(page, "shorter").click()
    board(page, original[:2], "frog")
    expect(action(page, "undo")).to_be_enabled()
    select(page, "cat")
    action(page, "undo").click()
    after = board(page, original, "frog")
    assert after["state"]["history"] == before["state"]["history"]
    page.screenshot(path=str(output / "train-shortened-then-restored.png"))

    page.set_viewport_size({"width": 844, "height": 390})
    action(page, "longer").click()
    board(page, original + [None], "frog")
    action(page, "undo").click()
    board(page, original, "frog")
    action(page, "longer").click()
    select(page, "cat")
    page.locator('.pt-seat[data-index="3"]').click()
    action(page, "shorter").click()
    action(page, "undo").click()
    board(page, original + ["cat"], "cat")
    action(page, "undo").click()
    board(page, original + [None], "cat")
    action(page, "undo").click()
    board(page, original, "frog")
    page.screenshot(path=str(output / "train-repeated-undo-landscape.png"))

    action(page, "shorter").click()
    saved = page.evaluate("key => JSON.parse(localStorage.getItem(key))", SAVE_KEY)
    assert saved["version"] == 1 and saved["size"] == 2
    assert saved["history"][-1]["board"] == original
    assert saved["history"][-1]["selected"] == "frog"
    page.reload(wait_until="load")
    enter_train(page)
    board(page, original[:2], "frog")
    action(page, "undo").click()
    restored = board(page, original, "frog")
    assert restored["state"]["history"] == before["state"]["history"]
    page.screenshot(path=str(output / "train-reloaded-undo-restored.png"))
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "page must not overflow"
    return {"initialBoard": original, "selected": "frog", "shrinkUndo": True, "expandUndo": True,
            "mixedEditUndoCount": 3, "freshDocumentUndo": True, "savedVersion": saved["version"],
            "historyRestored": len(restored["state"]["history"]), "viewports": [[390, 844], [844, 390]]}


def existing_case(page, base, output):
    page.goto(base + "scripts/qa-pattern-train.html?autotest=1", wait_until="load")
    page.wait_for_function("window.patternTrainBrowserQa?.status !== undefined && window.patternTrainBrowserQa.status !== 'RUNNING'", timeout=360000)
    result = page.evaluate("window.patternTrainBrowserQa")
    (output / "existing-pattern-train-browser-results.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    page.screenshot(path=str(output / "existing-pattern-train-browser-results.png"))
    assert result["status"] == "PASS", [item for item in result["checks"] if item["status"] != "PASS"]
    return {"scope": result["scope"], "passed": result["passed"], "failed": result["failed"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url")
    parser.add_argument("--output", default="qa-creator-train-edit-evidence")
    parser.add_argument("--include-existing", action="store_true", help="Also run the existing 20-course fixture; the Phase 2 workflow already requires it")
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
    report = {"scope": "native public-menu free editing and fresh-document restoration",
              "audio": "muted/stubbed, no audible or physical-device verification",
              "baseUrl": base, "checks": [], "pageErrors": [], "sourceHashes": {},
              "externalGate": {"workflow": ".github/workflows/phase2-browser-release.yml",
                               "runner": "scripts/qa-phase2-release-browser.py",
                               "fixture": "scripts/qa-pattern-train.html?autotest=1",
                               "requiredAtSameCommit": True,
                               "executionHere": "included" if args.include_existing else "NOT_RUN; check the separate Phase 2 workflow"}}
    try:
        report["sourceCommit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        report["sourceCommit"] = None
    try:
        files = ["index.html", "js/games/pattern-train.js", "js/games/pattern-train-model.js", "css/games/pattern-train.css"]
        if args.include_existing:
            files += ["scripts/qa-pattern-train.html", "scripts/qa-pattern-train-browser.js"]
        for filename in files:
            local = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()
            request = urllib.request.Request(base + filename, headers={"Cache-Control": "no-cache"})
            with urllib.request.urlopen(request, timeout=30) as response:
                served = hashlib.sha256(response.read()).hexdigest()
            report["sourceHashes"][filename] = {"local": local, "served": served, "match": local == served}
            assert local == served, f"source mismatch: {filename}"
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            report["browser"] = browser.version
            cases = [("native-free-edit", native_case)]
            if args.include_existing:
                cases.append(("existing-train-regression", existing_case))
            for name, run in cases:
                context = browser.new_context(viewport={"width": 390, "height": 844}, service_workers="block")
                page = context.new_page()
                page.on("pageerror", lambda error, name=name: report["pageErrors"].append({"case": name, "error": str(error)}))
                try:
                    detail = run(page, base, output)
                    report["checks"].append({"name": name, "status": "PASS", "detail": detail})
                except Exception as error:
                    page.screenshot(path=str(output / f"{name}-failure.png"))
                    report["checks"].append({"name": name, "status": "FAIL", "error": str(error), "trace": traceback.format_exc()})
                finally:
                    print(json.dumps(report["checks"][-1], ensure_ascii=False), flush=True)
                    context.close()
            browser.close()
        report["status"] = "PASS" if len(report["checks"]) == len(cases) and all(item["status"] == "PASS" for item in report["checks"]) and not report["pageErrors"] else "FAIL"
    except Exception as error:
        report["status"] = "FAIL"
        report["fatalError"] = str(error)
        report["trace"] = traceback.format_exc()
    finally:
        if server:
            server.shutdown()
        (output / "creator-train-edit-results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    raise SystemExit(0 if report["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
