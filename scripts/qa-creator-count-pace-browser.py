"""Actual menu/click pace checks; deterministic quantities, no replaced game handlers.

Speech is stubbed. This does not establish audible speech, physical touch or
child usability. Screenshot review remains separate from automated assertions.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import runpy
import threading
import traceback
import urllib.request

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
UI = runpy.run_path(str(ROOT / "scripts/qa-creator-vehicle-browser.py"))


def case(page, base, output, width, height):
    page.add_init_script("Math.random = () => 0.9999;")
    UI["open_menu_game"](page, base, "numbers", "openNumberCountGame")
    page.locator("#ncRange").select_option("5")
    expect(page.locator(".nc-vehicle-cell")).to_have_count(30)
    answer = page.locator('.nc-toy-block-btn[data-answer="30"]')
    expect(answer).to_be_visible()
    answer.click()
    expect(page.locator("#ncContinueBtn")).to_be_enabled()
    expect(page.locator(".nc-round-result")).to_have_text("🌟 30대, 맞았어!")
    expect(page.locator(".nc-vehicle-cell")).to_have_count(30)
    for selector in ["#ncContinueBtn", "#ncRecountBtn"]:
        box = page.locator(selector).bounding_box()
        assert box and box["width"] >= 44 and box["height"] >= 44, (selector, box)
        assert box["x"] >= 0 and box["y"] >= 0 and box["x"] + box["width"] <= width + 1 and box["y"] + box["height"] <= height + 1, box
    page.screenshot(path=str(output / f"correct-30-{width}x{height}.png"))
    page.locator("#ncRecountBtn").click()
    expect(page.locator("#ncRecountBtn")).to_have_attribute("aria-pressed", "true")
    expect(page.locator(".nc-count-dot")).not_to_have_count(0)
    page.set_viewport_size({"width": height, "height": width})
    expect(page.locator("#ncGame")).to_have_class(__import__('re').compile("number-count-" + ("landscape" if height > width else "portrait")))
    expect(page.locator("#ncRecountBtn")).to_have_attribute("aria-pressed", "true")
    page.screenshot(path=str(output / f"recount-rotated-{height}x{width}.png"))
    page.locator("#ncContinueBtn").click()
    expect(page.locator("#ncContinueBtn")).to_have_count(0)
    expect(page.locator(".nc-count-dot")).to_have_count(0)
    expect(page.locator('.nc-toy-block-btn[data-answer="30"]')).to_be_visible()
    assert page.evaluate("SihyeonGames.numberCount.state.currentLevel") == 2
    assert page.locator(".nc-star").count() == 0, "quick next cleans obsolete celebration nodes"
    page.locator('.nc-toy-block-btn[data-answer="30"]').click()
    page.locator("#ncRecountBtn").click()
    expect(page.locator(".nc-count-dot")).not_to_have_count(0)
    page.locator("#ncRecountBtn").click()
    expect(page.locator(".nc-count-dot")).to_have_count(0)
    page.wait_for_timeout(750)
    expect(page.locator(".nc-count-dot")).to_have_count(0)
    for current in range(2, 6):
        if current > 2:
            page.locator('.nc-toy-block-btn[data-answer="30"]').click()
        page.locator("#ncContinueBtn").click()
    expect(page.locator("#ncSuccessPanel")).to_be_visible(timeout=5000)
    assert page.evaluate("SihyeonGames.numberCount.state.correctCount") == 5
    assert page.evaluate("SihyeonGames.numberCount.state.completeRewardGiven")
    page.screenshot(path=str(output / f"five-rounds-{width}x{height}.png"))
    page.locator("#ncRestartBtn").click()
    expect(page.locator('.nc-toy-block-btn[data-answer="30"]')).to_be_visible()
    assert page.evaluate("SihyeonGames.numberCount.state.correctCount") == 0
    page.locator('.nc-toy-block-btn[data-answer="30"]').click()
    page.locator("#ncRecountBtn").click()
    page.locator("#ncPlazaBtn").click()
    expect(page.locator("#ncGame")).to_have_count(0)
    assert page.evaluate("SihyeonGames.numberCount.state.container === null")
    return {"quantity": 30, "completedRounds": 5, "nativeControls": True,
            "nextDuringRecount": True, "rotatePreservesRecount": True,
            "restartAndExit": True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url")
    parser.add_argument("--output", default="qa-creator-count-pace-evidence")
    args = parser.parse_args()
    output = pathlib.Path(args.output).resolve(); output.mkdir(parents=True, exist_ok=True)
    server = None
    if args.base_url:
        base = args.base_url.rstrip("/") + "/"
    else:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(UI["Quiet"], directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_port}/"
    report = {"checks": [], "pageErrors": [], "sourceHashes": {}, "scope": __doc__, "baseUrl": base}
    try:
        for name in ["index.html", "js/games/number-count.js"]:
            expected = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
            with urllib.request.urlopen(base + name, timeout=30) as response:
                actual = hashlib.sha256(response.read()).hexdigest()
            report["sourceHashes"][name] = {"checkout": expected, "served": actual}
            assert expected == actual, name
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            report["browser"] = browser.version
            for width, height in [(390, 844), (844, 390)]:
                context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block")
                page = context.new_page()
                page.on("pageerror", lambda error: report["pageErrors"].append(str(error)))
                try:
                    detail = case(page, base, output, width, height)
                    report["checks"].append({"viewport": [width, height], "status": "PASS", "detail": detail})
                except Exception as error:
                    page.screenshot(path=str(output / f"failure-{width}x{height}.png"))
                    report["checks"].append({"viewport": [width, height], "status": "FAIL", "error": str(error), "trace": traceback.format_exc()})
                finally:
                    context.close()
            browser.close()
        report["status"] = "PASS" if all(c["status"] == "PASS" for c in report["checks"]) and not report["pageErrors"] else "FAIL"
    except Exception as error:
        report.update(status="FAIL", error=str(error), trace=traceback.format_exc())
    finally:
        if server: server.shutdown()
        (output / "count-pace-results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
