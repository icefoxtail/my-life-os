"""Stage 3 garage checks through the actual public menu in real Chromium.

Native clicks repair, decorate, keep two distinct cars, drive an older saved
car, reload its collection and recover an intentional deletion. Part screenshot
hashes establish visible before/after changes independently of data-ready flags.
No private product handler/state is injected. Physical touch and audible speech
remain outside this browser harness.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import shutil
import threading
import traceback
from urllib.parse import urljoin, urlsplit, urlunsplit

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = ("index.html", "js/games/car-garage.js")
KEY = "sihyeon_car_garage_v1"
TASKS = {
    "fire": ("wheel", "wash", "siren"), "police": ("wheel", "light", "siren"),
    "bus": ("wheel", "light", "wash"), "ambulance": ("wheel", "light", "gas"),
    "rocket": ("wheel", "gas", "light")
}
CASES = [("fire", 320, 568), ("fire", 390, 844), ("fire", 640, 360), ("fire", 844, 390),
         ("police", 390, 844), ("bus", 390, 844), ("ambulance", 390, 844), ("rocket", 390, 844)]


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def sha(data):
    return hashlib.sha256(data).hexdigest()


def normalize(value):
    parsed = urlsplit(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("--base-url must be an HTTP(S) playground URL")
    path = parsed.path
    if path.endswith("/index.html"):
        path = path[:-len("index.html")]
    return urlunsplit((parsed.scheme, parsed.netloc, path.rstrip("/") + "/", "", ""))


def visible_control(page, locator):
    expect(locator).to_be_visible()
    expect(locator).to_be_enabled()
    box = locator.bounding_box()
    viewport = page.viewport_size
    assert box and box["width"] >= 44 and box["height"] >= 44, box
    assert box["x"] >= -1 and box["y"] >= -1, box
    assert box["x"] + box["width"] <= viewport["width"] + 1, box
    assert box["y"] + box["height"] <= viewport["height"] + 1, box
    assert locator.evaluate("""element => {
      const b = element.getBoundingClientRect();
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return hit === element || element.contains(hit);
    }"""), "Control is covered"
    return box


def click(page, selector):
    locator = page.locator(selector).first
    locator.scroll_into_view_if_needed()
    visible_control(page, locator)
    locator.click()


def source_evidence(responses, base):
    evidence = {}
    paths = {urlsplit(urljoin(base, name)).path: name for name in SOURCES}
    for response in responses:
        name = paths.get(urlsplit(response.url).path)
        if name:
            actual = sha(response.body())
            expected = sha((ROOT / name).read_bytes())
            evidence[name] = {"url": response.url, "httpStatus": response.status,
                              "servedSha256": actual, "checkoutSha256": expected,
                              "matchesCheckout": actual == expected}
    assert set(evidence) == set(SOURCES), evidence
    assert all(item["httpStatus"] == 200 and item["matchesCheckout"] for item in evidence.values()), evidence
    return evidence


def enter(page, base, first=True):
    if first:
        response = page.goto(urljoin(base, "index.html"), wait_until="load", timeout=60000)
        assert response and response.ok
    click(page, '.world-zone[onclick="travelToZone(\'cars\')"]')
    click(page, '.zone-game-card[onclick="openCarGarageGame()"]')
    expect(page.locator(".cg-phase-repair")).to_be_visible()


def readiness(page):
    return page.locator(".cg-stage [data-part]").evaluate_all(
        "(els) => Object.fromEntries(els.map(e => [e.dataset.part, e.dataset.ready]))")


def collection(page):
    return page.evaluate("(key) => JSON.parse(localStorage.getItem(key)).cars", KEY)


def stage_within_viewport(page):
    box = page.locator(".cg-stage").bounding_box()
    viewport = page.viewport_size
    assert box and box["x"] >= 0 and box["y"] >= 0, box
    assert box["x"] + box["width"] <= viewport["width"] + 1, box
    assert box["y"] + box["height"] <= viewport["height"] + 1, box
    return box


def solve(page, vehicle, output=None, prefix=None):
    parts = {}
    for task in TASKS[vehicle]:
        expect(page.locator(f'.cg-stage [data-part="{task}"]')).to_have_attribute("data-ready", "false")
        if output:
            before = page.locator(f'.cg-stage [data-part="{task}"]').screenshot(
                path=str(output / f"{prefix}-{task}-before.png"))
            parts[task] = {"beforeSha256": sha(before)}
    completed = []
    for task in reversed(TASKS[vehicle]):
        click(page, f'[data-task="{task}"]')
        expect(page.locator(".cg-nav-btn")).to_be_enabled(timeout=4000)
        completed.append(task)
        flags = readiness(page)
        for expected in TASKS[vehicle]:
            assert flags[expected] == ("true" if expected in completed else "false"), (task, flags)
        if output:
            after = page.locator(f'.cg-stage [data-part="{task}"]').screenshot(
                path=str(output / f"{prefix}-{task}-after.png"))
            parts[task]["afterSha256"] = sha(after)
            assert parts[task]["beforeSha256"] != parts[task]["afterSha256"], (task, "No visible repair change")
    expect(page.locator(".cg-phase-tuning")).to_be_visible()
    return parts


def one_case(page, base, output, vehicle, width, height, responses):
    prefix = f"{vehicle}-{width}x{height}"
    seed = (list(TASKS).index(vehicle) + 0.1) / len(TASKS)
    page.add_init_script(f"Math.random = () => {seed};")
    enter(page, base)
    page.evaluate("""() => {
      window.__garageRewards = [];
      const gain = window.gainExp;
      if (typeof gain !== 'function') throw new Error('Shared reward function missing');
      window.gainExp = (...args) => { __garageRewards.push(args[0]); return gain(...args); };
    }""")
    # gameOptions captured gainExp on entry. Re-enter using the actual menu so the
    # observation wrapper records real reward calls without replacing behavior.
    page.locator(".game-back-floating").click()
    click(page, '.zone-game-card[onclick="openCarGarageGame()"]')
    expect(page.locator(".cg-stage .cg-vehicle-svg")).to_have_attribute("data-vehicle", vehicle)
    sources = source_evidence(responses, base)
    initial_box = stage_within_viewport(page)
    page.screenshot(path=str(output / f"{prefix}-repair-before.png"))
    parts = solve(page, vehicle, output, prefix)
    click(page, '[data-before="1"]')
    assert all(readiness(page)[task] == "false" for task in TASKS[vehicle])
    click(page, '[data-before="0"]')
    assert all(readiness(page)[task] == "true" for task in TASKS[vehicle])
    click(page, '[data-deco="2"]')
    click(page, '[data-deco="1"]')
    click(page, '[data-deco="5"]')
    click(page, "[data-undo-deco]")
    expect(page.locator(".cg-stage [data-decal]")).to_have_count(2)
    decorations = page.locator(".cg-stage [data-decal]").evaluate_all(
        "els => els.map(e => ({emoji: e.dataset.decal, x: +e.getAttribute('x'), y: +e.getAttribute('y')}))")
    click(page, "#btnGo")
    expect(page.locator(".cg-phase-photo")).to_be_visible()
    first = collection(page)[0]
    assert first["decorations"] == decorations
    assert page.evaluate("window.__garageRewards") == [40]
    page.screenshot(path=str(output / f"{prefix}-completed-first.png"))
    click(page, "[data-new-car]")
    solve(page, vehicle)
    click(page, '[data-deco="3"]')
    click(page, "#btnGo")
    saved = collection(page)
    assert len(saved) == 2 and saved[1] == first and saved[0]["id"] != first["id"], saved
    assert saved[0]["decorations"] != saved[1]["decorations"]
    assert page.evaluate("window.__garageRewards") == [40, 40]
    click(page, "[data-garage]")
    expect(page.locator(".cg-saved-card")).to_have_count(2)
    click(page, f'[data-drive-id="{first["id"]}"]')
    expect(page.locator(".cg-phase-drive")).to_be_visible()
    assert page.locator(".cg-drive-car [data-decal]").evaluate_all(
        "els => els.map(e => ({emoji: e.dataset.decal, x: +e.getAttribute('x'), y: +e.getAttribute('y')}))") == decorations
    drive_box = stage_within_viewport(page)
    for stop in (2, 0, 1):
        click(page, f'[data-stop="{stop}"]')
        expect(page.locator(f'[data-stop="{stop}"]')).to_have_class("cg-road-stop visited", timeout=4000)
    expect(page.locator(".cg-stage-message")).to_have_text("동네 한 바퀴를 다 돌았어요!")
    assert page.evaluate("window.__garageRewards") == [40, 40], "Reusing a saved car gave duplicate rewards"
    page.screenshot(path=str(output / f"{prefix}-drive-finish.png"))
    click(page, "[data-drive-again]")
    expect(page.locator(".cg-road-stop.visited")).to_have_count(0)
    click(page, "[data-garage]")
    click(page, "[data-workshop]")
    expect(page.locator(".cg-phase-photo")).to_be_visible()
    assert page.locator(".cg-stage [data-decal]").first.get_attribute("data-decal") == "💎"
    assert page.evaluate("window.__garageRewards") == [40, 40]
    page.reload(wait_until="load", timeout=60000)
    enter(page, base, first=False)
    click(page, "[data-garage]")
    expect(page.locator(".cg-saved-card")).to_have_count(2)
    assert collection(page)[1] == first, "Reload changed the saved original"
    click(page, f'[data-delete-id="{first["id"]}"]')
    click(page, "[data-delete-cancel]")
    assert len(collection(page)) == 2
    click(page, f'[data-delete-id="{first["id"]}"]')
    click(page, f'[data-delete-confirm="{first["id"]}"]')
    assert len(collection(page)) == 1
    click(page, "[data-undo-delete]")
    assert collection(page)[1] == first
    page.screenshot(path=str(output / f"{prefix}-garage-restored.png"))
    # Returning from the collection restores the fresh unfinished workshop.
    click(page, "[data-workshop]")
    expect(page.locator(".cg-phase-repair")).to_be_visible()
    assert all(readiness(page)[task] == "false" for task in TASKS[vehicle])
    return {"status": "PASS", "vehicle": vehicle, "viewport": {"width": width, "height": height},
            "sourceSha256": sources, "repairPartPixels": parts, "savedCars": 2,
            "firstCarId": first["id"], "decorations": decorations, "driveOrder": [2, 0, 1],
            "rewardCallsBeforeReload": [40, 40], "initialStage": initial_box, "driveStage": drive_box,
            "checks": ["repair order and visible part change", "before/after view", "sticker removal",
                       "two independent saved cars", "saved-car drive", "no duplicate reward",
                       "workshop restore", "reload persistence", "delete cancel and undo"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url")
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path("qa-creator-garage"))
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    report = {"status": "RUNNING", "checks": [], "pageErrors": [], "failedRequests": [],
              "testScriptSha256": sha(pathlib.Path(__file__).read_bytes()),
              "notRun": ["physical device touch", "audible speech listening", "child observation"]}
    server = None
    if args.base_url:
        base = normalize(args.base_url)
    else:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_address[1]}/"
    report["baseUrl"] = base
    try:
        with sync_playwright() as playwright:
            executable = shutil.which("chromium") or shutil.which("chromium-browser")
            options = {"headless": True, "args": ["--no-sandbox", "--disable-dev-shm-usage"]}
            if executable:
                options["executable_path"] = executable
            browser = playwright.chromium.launch(**options)
            for vehicle, width, height in CASES:
                context = browser.new_context(viewport={"width": width, "height": height},
                                              service_workers="block", reduced_motion="reduce")
                page = context.new_page()
                responses = []
                page.on("response", lambda response: responses.append(response))
                page.on("pageerror", lambda error: report["pageErrors"].append(str(error)))
                page.on("requestfailed", lambda request: report["failedRequests"].append(
                    {"url": request.url, "failure": request.failure}))
                try:
                    report["checks"].append(one_case(page, base, output, vehicle, width, height, responses))
                except Exception:
                    page.screenshot(path=str(output / f"FAIL-{vehicle}-{width}x{height}.png"))
                    raise
                finally:
                    context.close()
            browser.close()
        assert not report["pageErrors"], report["pageErrors"]
        report["status"] = "PASS"
        report["totalCases"] = len(report["checks"])
    except Exception:
        report["status"] = "FAIL"
        report["error"] = traceback.format_exc()
        raise
    finally:
        (output / "creator-garage-browser.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        if server:
            server.shutdown()
        print(json.dumps({"status": report["status"], "cases": len(report["checks"]),
                          "report": str(output / "creator-garage-browser.json")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
