"""Public-menu train gallery and whole repeating-group comparison.

Native browser taps at six viewport sizes. Source-bound reports and original
PNGs are evidence of the exercised browser scope, not audible/device/child QA.
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
import urllib.parse
import urllib.request

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
KEY = "sihyeon-pattern-train-v1:collection"
FILES = ["index.html", "js/games/pattern-train.js", "js/games/pattern-train-model.js", "css/games/pattern-train.css"]
SIZES = [(320, 568), (390, 844), (640, 360), (844, 390), (768, 1024), (1024, 768)]


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def tap(page, action, extra=""):
    page.locator(f'.pt-app [data-action="{action}"]{extra}').tap()


def snap(page):
    return page.evaluate("SihyeonGames.patternTrain.getSnapshot()")


def enter(page, base):
    # Tag each real navigation so both the initial and restored document need
    # their own complete set of response-byte evidence.
    page._train_source_document = getattr(page, "_train_source_document", 0) + 1
    page.goto(base + "index.html", wait_until="load")
    page.evaluate("""() => {
      const v = window.SihyeonVoice || {};
      for (const name of ['play','playSequence','speak']) v[name] = () => Promise.resolve(false);
      v.stop = () => {}; window.SihyeonVoice = v;
    }""")
    page.locator('.world-zone[onclick="travelToZone(\'numbers\')"]').tap()
    page.locator('.zone-game-card[onclick="openPatternTrainGame()"]').tap()
    expect(page.locator(".pt-app")).to_be_visible()
    expect(page.locator('[data-action="collection"]')).to_be_visible()


def fill(page, values):
    for index, value in enumerate(values):
        seat = page.locator(f'.pt-seat[data-index="{index}"]')
        if seat.get_attribute("data-token") == value:
            continue
        tap(page, "select", f'[data-token="{value}"]')
        seat.tap()
    assert snap(page)["state"]["board"] == values


def screenshot(page, out, name):
    page.screenshot(path=str(out / (name + ".png")))


def compare_geometry(page):
    measure = page.locator(".pt-compare").evaluate("""root => {
      const cards = [...root.children].map(el => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}; });
      const dialog=root.closest('.pt-dialog'), dr=dialog.getBoundingClientRect();
      return {cards, dialogWidth:dialog.clientWidth, dialogScrollWidth:dialog.scrollWidth,
        dialogRect:{x:dr.x,y:dr.y,right:dr.right,bottom:dr.bottom}, viewport:{w:innerWidth,h:innerHeight}};
    }""")
    a, b = measure["cards"]
    assert a["x"] < b["x"] and abs(a["y"] - b["y"]) < 2, measure
    assert a["w"] >= 85 and b["w"] >= 85, measure
    assert measure["dialogScrollWidth"] <= measure["dialogWidth"] + 1, measure
    assert measure["dialogRect"]["right"] <= measure["viewport"]["w"] + 1, measure
    # The whole two-card comparison is visible at once; the rest of the gallery
    # can scroll. This must not be a comparison requiring alternate screens.
    assert a["y"] >= -1 and b["bottom"] <= measure["viewport"]["h"] + 1, measure
    return measure


def compare_case(page, base, out, width, height):
    enter(page, base)
    tap(page, "age", '[data-age="7"]')
    tap(page, "stop", '[data-stop="3"]')
    first = ["cat", "rabbit", "cat", "rabbit", "cat", "rabbit", "cat", "rabbit"]
    second = ["cat", "rabbit", "rabbit", "cat", "cat", "rabbit", "rabbit", "cat"]
    fill(page, first)
    tap(page, "start")
    expect(page.locator(".pt-app")).to_have_attribute("data-phase", "ARRIVED", timeout=14000)
    tap(page, "collection")
    tap(page, "save-work")
    expect(page.locator(".pt-collection-notice")).to_contain_text("보관했어요")
    stored = snap(page)["collection"]["works"][0]
    tap(page, "save-work")
    assert len(snap(page)["collection"]["works"]) == 1
    expect(page.locator(".pt-collection-notice")).to_contain_text("이미")
    tap(page, "close-modal")
    tap(page, "edit")
    fill(page, second)
    tap(page, "collection")
    expect(page.locator(".pt-collection-notice")).to_have_text("여섯 작품까지 보관할 수 있어요.")
    expect(page.locator('[data-comparison="first"] .pt-work-pattern')).to_have_attribute("data-period", "2")
    expect(page.locator('[data-comparison="current"] .pt-work-pattern')).to_have_attribute("data-period", "4")
    expect(page.locator('[data-comparison="first"] [data-full-group="true"]')).to_have_count(4)
    expect(page.locator('[data-comparison="current"] [data-full-group="true"]')).to_have_count(2)
    assert page.locator('[data-comparison="first"] .pt-unit-group').evaluate_all("gs=>gs.map(g=>g.querySelectorAll('.pt-token').length)") == [2] * 4
    assert page.locator('[data-comparison="current"] .pt-unit-group').evaluate_all("gs=>gs.map(g=>g.querySelectorAll('.pt-token').length)") == [4] * 2
    # Bring the comparison to the top after the dialog's automatic focus moves
    # to its save button. This is a real wheel gesture on the scrollable dialog.
    page.locator(".pt-collection-dialog").hover()
    page.mouse.wheel(0, -2000)
    page.wait_for_timeout(160)
    geometry = compare_geometry(page)
    screenshot(page, out, f"train-two-vs-four-{width}x{height}")
    if width == 390:
        page.set_viewport_size({"width": 844, "height": 390})
        page.locator(".pt-collection-dialog").hover()
        page.mouse.wheel(0, -2000)
        page.wait_for_timeout(160)
        compare_geometry(page)
        screenshot(page, out, "train-compare-rotated")
        assert snap(page)["state"]["board"] == second
        page.set_viewport_size({"width": width, "height": height})
    tap(page, "save-work")
    assert len(snap(page)["collection"]["works"]) == 2
    assert snap(page)["collection"]["works"][0] == stored
    current_id = snap(page)["collection"]["works"][1]["id"]
    # Reload is a new JS module; saved works are read from persistent storage.
    enter(page, base)
    tap(page, "collection")
    assert len(snap(page)["collection"]["works"]) == 2
    tap(page, "open-work", f'[data-work="{stored["id"]}"]')
    expect(page.locator("#ptDialogTitle")).to_contain_text("불러올까요")
    tap(page, "confirm-open-work")
    assert snap(page)["state"]["board"] == first
    assert snap(page)["state"]["phase"] == "BUILDING"
    fill(page, second)
    assert snap(page)["collection"]["works"][0] == stored
    tap(page, "collection")
    tap(page, "remove-work", f'[data-work="{current_id}"]')
    assert len(snap(page)["collection"]["works"]) == 2
    # The underlying gallery opener has the same action; exercise the visible
    # confirmation dialog's cancellation button, not the obscured background.
    page.get_by_role("dialog").locator('[data-action="collection"]').tap()
    assert len(snap(page)["collection"]["works"]) == 2
    tap(page, "remove-work", f'[data-work="{current_id}"]')
    tap(page, "confirm-remove-work")
    assert len(snap(page)["collection"]["works"]) == 1
    assert snap(page)["state"]["board"] == second
    return {"first": first, "second": second, "periods": [2, 4], "savedInBuildingAndArrived": True,
            "freshDocumentRestore": True, "immutableOriginal": True, "confirmedDelete": True, "comparisonGeometry": geometry}


def free_case(page, base, out):
    enter(page, base)
    tap(page, "free")
    tap(page, "shorter")
    tap(page, "shorter")
    free = ["cat", "rabbit", "bear", "frog"]
    fill(page, free)
    tap(page, "shorter")
    tap(page, "undo")
    assert snap(page)["state"]["board"] == free
    tap(page, "collection")
    expect(page.locator('[data-comparison="current"] .pt-work-pattern')).to_have_attribute("data-period", "0")
    expect(page.locator('[data-comparison="current"] .pt-pattern-label')).to_contain_text("자유 순서")
    tap(page, "save-work")
    saved_free = snap(page)["collection"]["works"][0]
    tap(page, "close-modal")
    for bits in range(5):
        values = ["rabbit" if (bits >> i) & 1 else "cat" for i in range(4)]
        fill(page, values)
        tap(page, "collection")
        tap(page, "save-work")
        tap(page, "close-modal")
    before = snap(page)["collection"]
    assert len(before["works"]) == 6
    fill(page, ["bear"] * 4)
    tap(page, "collection")
    tap(page, "save-work")
    expect(page.locator(".pt-collection-notice")).to_contain_text("여섯")
    assert snap(page)["collection"] == before
    screenshot(page, out, "train-gallery-full")
    tap(page, "open-work", f'[data-work="{saved_free["id"]}"]')
    tap(page, "confirm-open-work")
    assert snap(page)["state"]["board"] == free
    tap(page, "restart")
    tap(page, "confirm-reset")
    assert snap(page)["collection"] == before
    assert snap(page)["state"]["board"] == [None] * 4
    tap(page, "collection")
    expect(page.locator('[data-action="save-work"]')).to_be_disabled()
    return {"capacity": 6, "fullNeverOverwrites": True, "freeNonRepeatingPreserved": True, "resizeUndoPreserved": True, "resetPreservesGallery": True}


def failure_case(page, base, out, mode):
    original = "broken{" if mode == "corrupt" else json.dumps({"version": 99, "works": []}) if mode == "unknown" else "protected bytes" if mode == "read" else None
    config = json.dumps({"mode": mode, "original": original, "key": KEY})
    page.add_init_script("""(() => {
      const {mode, original, key} = CONFIG;
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      if (original !== null) set.call(localStorage, key, original);
      window.__galleryOriginalRaw = () => get.call(localStorage, key);
      if (mode === 'write') Storage.prototype.setItem = function(k,v) { if(k===key)throw new Error('storage full');return set.call(this,k,v); };
      if (mode === 'read') Storage.prototype.getItem = function(k) { if(k===key)throw new Error('read denied');return get.call(this,k); };
    })();""".replace("CONFIG", config))
    enter(page, base)
    tap(page, "free")
    fill(page, ["cat", "rabbit"] * 3)
    tap(page, "collection")
    tap(page, "save-work")
    assert len(snap(page)["collection"]["works"]) == 1
    assert snap(page)["collectionVolatile"]
    expect(page.locator(".pt-collection-warning").first).to_contain_text("이 화면")
    assert page.evaluate("window.__galleryOriginalRaw()") == original
    screenshot(page, out, "train-gallery-storage-" + mode)
    tap(page, "close-modal")
    tap(page, "home")
    # The game home button returns to the numbers land, not the world map.
    page.locator('.zone-game-card[onclick="openPatternTrainGame()"]').tap()
    tap(page, "collection")
    assert len(snap(page)["collection"]["works"]) == 1
    assert page.evaluate("window.__galleryOriginalRaw()") == original
    return {"mode": mode, "originalBytesPreserved": True, "sessionReentry": True, "volatileWarningVisible": True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url")
    parser.add_argument("--output", default="qa-train-collection-evidence")
    parser.add_argument("--executable-path", help="Optional local Chromium executable; CI uses its installed pinned browser")
    parser.add_argument("--case", action="append", help="Run only named cases while developing; omitted runs all eleven")
    args = parser.parse_args()
    out = pathlib.Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    server = None
    if args.base_url:
        base = args.base_url.rstrip("/") + "/"
    else:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_port}/"
    expected = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in FILES}
    report = {"baseUrl": base, "gitSha": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
              "testScriptSha256": hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(), "sourceHashes": expected, "checks": [], "pageErrors": [],
              "scope": "Public-menu native taps, six viewports, first/current complete-group comparison, saved train editing, storage failure recovery.",
              "notRun": ["physical device touch", "audible speech", "child observation", "installed offline SW update"]}
    try:
        served = {}
        for p in FILES:
            with urllib.request.urlopen(urllib.request.Request(base + p, headers={"Cache-Control": "no-cache"}), timeout=30) as response:
                served[p] = hashlib.sha256(response.read()).hexdigest()
        assert served == expected, (served, expected)
        report["servedBefore"] = served
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, **({"executable_path": args.executable_path} if args.executable_path else {}))
            report["browserVersion"] = browser.version
            cases = [(f"compare-{w}x{h}", w, h, lambda p, w=w, h=h: compare_case(p, base, out, w, h)) for w, h in SIZES]
            cases.append(("free-capacity", 390, 844, lambda p: free_case(p, base, out)))
            for mode in ["write", "read", "corrupt", "unknown"]:
                cases.append(("storage-" + mode, 390, 844, lambda p, mode=mode: failure_case(p, base, out, mode)))
            if args.case:
                assert set(args.case).issubset({c[0] for c in cases}), args.case
                cases = [c for c in cases if c[0] in args.case]
            report["expectedCaseCount"] = len(cases)
            for name, width, height, run in cases:
                context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block", has_touch=True, reduced_motion="reduce")
                page = context.new_page()
                source_session = context.new_cdp_session(page)
                source_session.send("Network.enable")
                source_session.send("Network.setCacheDisabled", {"cacheDisabled": True})
                page.on("pageerror", lambda error, name=name: report["pageErrors"].append({"case": name, "error": str(error)}))
                loaded = []

                def capture(response):
                    rel = urllib.parse.urlparse(response.url).path.removeprefix(urllib.parse.urlparse(base).path)
                    if rel not in expected:
                        return
                    record = {"path": rel, "url": response.url, "status": response.status,
                              "document": page._train_source_document}
                    try:
                        response.finished()
                        actual = hashlib.sha256(response.body()).hexdigest()
                        loaded.append({**record, "sha256": actual, "matchesCheckout": actual == expected[rel]})
                    except Exception as error:
                        loaded.append({**record, "error": str(error)})

                page.on("response", capture)
                try:
                    detail = run(page)
                    expected_documents = 2 if name.startswith("compare-") else 1
                    assert page._train_source_document == expected_documents
                    for document_number in range(1, expected_documents + 1):
                        document_sources = [x for x in loaded if x["document"] == document_number]
                        assert sorted(x["path"] for x in document_sources) == sorted(FILES), document_sources
                    assert all(x.get("matchesCheckout") and x.get("status") == 200 for x in loaded), loaded
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "page overflow"
                    report["checks"].append({"name": name, "status": "PASS", "detail": detail, "loadedSources": loaded})
                except Exception as error:
                    screenshot(page, out, name + "-failure")
                    report["checks"].append({"name": name, "status": "FAIL", "error": str(error), "trace": traceback.format_exc(), "loadedSources": loaded})
                finally:
                    print(json.dumps({k: v for k, v in report["checks"][-1].items() if k != "loadedSources"}, ensure_ascii=False), flush=True)
                    context.close()
            browser.close()
        report["status"] = "PASS" if len(report["checks"]) == len(cases) and all(x["status"] == "PASS" for x in report["checks"]) and not report["pageErrors"] else "FAIL"
    except Exception as error:
        report["status"] = "FAIL"
        report["fatalError"] = str(error)
        report["trace"] = traceback.format_exc()
    finally:
        if server:
            server.shutdown()
        report["totalCases"] = len(report["checks"])
        (out / "creator-train-collection-browser.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    raise SystemExit(0 if report["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
