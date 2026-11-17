#!/usr/bin/env python3
"""Stage 4 fire checks using the real public menu, native clicks and rendered scenes.

No private game state or handlers are injected. Exact vehicle variants are selected
through their displayed buttons; SVG geometry and scene screenshots establish the
visible water/flame/ladder/person/smoke changes. Separate contexts simulate failed
manifest HTTP responses, speech failure and help-storage refusal. Reward observation
wraps the public gainExp callback and calls its original implementation.
"""
from __future__ import annotations

import argparse
import functools
import hashlib
import http.server
import json
from pathlib import Path
import shutil
import threading
import traceback
from urllib.parse import urljoin, urlsplit, urlunsplit

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ("index.html", "js/games/megaDispatch.js", "js/vehicle-display.js",
           "assets/vehicles/fire_manifest.json", "assets/vehicles/fire_special_manifest.json")
VIEWPORTS = [(320, 568), (390, 844), (640, 360), (844, 390), (768, 1024), (1024, 768)]
LADDERS = ("n_ladder_truck", "n_aerial_ladder_truck", "n_articulating_ladder_truck", "s_aerial_ladder_truck")
TANKERS = ("n_water_tanker", "s_water_tanker")
FIRE_KEY = "sihyeon-mega-dispatch-help-v1"


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def sha(data):
    return hashlib.sha256(data).hexdigest()


def normalize(value):
    parsed = urlsplit(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("--base-url must be an HTTP(S) playground URL")
    path = parsed.path[:-len("index.html")] if parsed.path.endswith("/index.html") else parsed.path
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
      const r=element.getBoundingClientRect(), hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return hit===element || element.contains(hit);
    }"""), "Control is covered at its center"
    return box


def click(page, selector):
    locator = page.locator(selector).first
    locator.scroll_into_view_if_needed()
    visible_control(page, locator)
    locator.click()


def wait_images(page):
    page.wait_for_function("""() => [...document.querySelectorAll('#megaDispatchTarget img')]
      .every(image => image.complete && image.naturalWidth > 0)""", timeout=20000)
    page.locator("#megaDispatchTarget img").evaluate_all("images => Promise.all(images.map(i => i.decode()))")


def wait_shell(page):
    page.wait_for_function("""() => {
      const shell=document.querySelector('.game-play-screen');
      return shell && shell.getAnimations().every(a=>a.playState==='finished') && +getComputedStyle(shell).opacity>=.99;
    }""", timeout=5000)


def enter(page, base, fresh=True):
    if fresh:
        response = page.goto(urljoin(base, "index.html"), wait_until="load", timeout=60000)
        assert response and response.ok
        page.evaluate("""() => {
          window.__fireRewards=[];
          const original=window.gainExp;
          window.gainExp=function(...args){ window.__fireRewards.push(args[0]);return original.apply(this,args); };
        }""")
        page.locator('.world-zone[onclick="travelToZone(\'cars\')"]').click()
    page.locator('.zone-game-card[onclick="openMegaDispatchGame()"]').click()
    expect(page.locator("[data-field-start]")).to_be_visible()
    wait_shell(page)
    for size in (4, 9, 16):
        visible_control(page, page.locator(f"[data-mode-size='{size}']"))
    click(page, "[data-field-start]")
    expect(page.locator(".md-field-menu")).to_be_visible(timeout=20000)


def source_evidence(responses, base):
    paths = {urlsplit(urljoin(base, relative)).path: relative for relative in SOURCES}
    evidence = {}
    for response in responses:
        relative = paths.get(urlsplit(response.url).path)
        if relative and response.status == 200:
            data = response.body()
            actual = sha(data)
            expected = sha((ROOT / relative).read_bytes())
            evidence[relative] = {"url": response.url, "httpStatus": response.status,
                                  "servedSha256": actual, "checkoutSha256": expected,
                                  "matchesCheckout": actual == expected}
    assert set(evidence) == set(SOURCES), evidence
    assert all(item["matchesCheckout"] for item in evidence.values()), evidence
    return evidence


def scene_snapshot(page):
    return page.evaluate("""() => {
      const scene=document.querySelector('.md-field-scene');
      const fill=scene?.querySelector('[data-scene-water]');
      const person=scene?.querySelector('[data-scene-person]');
      const ladder=scene?.querySelector('[data-scene-ladder]');
      const layout=document.querySelector('[data-field-phase]');
      return {incident:scene?.dataset.fieldScene,phase:layout?.dataset.fieldPhase,role:layout?.dataset.fieldRole,
        water:fill?+fill.getAttribute('height'):null,fire:scene?.querySelectorAll('[data-scene-fire]').length,
        smoke:scene?.querySelectorAll('[data-scene-smoke]').length,person:person?.getAttribute('transform'),
        ladderParts:ladder?.childElementCount || 0,safe:!!scene?.querySelector('[data-scene-safe]')};
    }""")


def scene_bounds(page):
    box = page.locator(".md-field-scene").bounding_box()
    viewport = page.viewport_size
    assert box and box["width"] >= 180 and box["height"] >= 100, box
    assert box["x"] >= -1 and box["y"] >= -1, box
    assert box["x"] + box["width"] <= viewport["width"] + 1, box
    assert box["y"] + box["height"] <= viewport["height"] + 1, box
    for button in page.locator(".md-field-choice, [data-field-work]:not([disabled]), [data-field-next], [data-field-listen], [data-action='help']").all():
        visible_control(page, button)
    return box


def capture(page, output, tag):
    wait_images(page)
    page.screenshot(path=str(output / f"{tag}.png"))
    scene = page.locator(".md-field-canvas > svg")
    if scene.count():
        pixels = scene.screenshot(path=str(output / f"{tag}-scene.png"))
        return {"file": f"{tag}-scene.png", "sha256": sha(pixels), "scene": scene_snapshot(page)}
    return {"file": f"{tag}.png"}


def choices(page):
    wait_images(page)
    result = page.locator("[data-field-game-id]").evaluate_all("""buttons=>buttons.map(b=>({
      id:b.dataset.fieldGameId,glow:b.classList.contains('target-glow'),label:b.getAttribute('aria-label'),
      images:[...b.querySelectorAll('img')].map(i=>({src:i.currentSrc,width:i.naturalWidth}))}))""")
    assert all(len(item["images"]) == 1 and item["images"][0]["width"] > 0 for item in result), result
    return result


def arrival_geometry(page):
    return page.evaluate("""() => {
      const engine=document.querySelector('.md-field-engine'), canvas=document.querySelector('.md-field-canvas');
      const e=engine.getBoundingClientRect(), c=canvas.getBoundingClientRect(), animation=engine.getAnimations()[0];
      return {phase:document.querySelector('[data-field-phase]').dataset.fieldPhase,
        engine:{x:e.x,y:e.y,width:e.width,height:e.height},canvas:{x:c.x,y:c.y,width:c.width,height:c.height},
        relativeLeft:(e.left-c.left)/c.width,relativeBottom:(e.bottom-c.top)/c.height,
        animation:animation?{currentTime:animation.currentTime,duration:animation.effect.getComputedTiming().duration,playState:animation.playState}:null};
    }""")


def choose(page, vehicle, motion=None):
    click(page, f'[data-field-game-id="{vehicle}"]')
    expect(page.locator('[data-field-phase="arrival"]')).to_be_visible()
    expect(page.locator("[data-field-work]")).to_be_disabled()
    observed = None
    if motion:
        output, tag = motion
        wait_images(page)
        page.wait_for_function("""() => {
          const animation=document.querySelector('.md-field-engine')?.getAnimations()[0];
          return animation && animation.playState==='running' && animation.currentTime>=80;
        }""", timeout=1000)
        moving = arrival_geometry(page)
        moving_file = f"fire-{tag}-arrival-moving.png"
        page.screenshot(path=str(output / moving_file), animations="allow")
        after_capture = arrival_geometry(page)
        assert moving["phase"] == "arrival" and moving["animation"]["playState"] == "running", moving
        assert after_capture["animation"] and after_capture["animation"]["currentTime"] < after_capture["animation"]["duration"], after_capture
        observed = {"moving": moving, "afterMovingCapture": after_capture, "movingFile": moving_file}
    expect(page.locator('[data-field-phase="work"]')).to_be_visible(timeout=3000)
    wait_images(page)
    expect(page.locator(".md-field-engine img")).to_have_count(1)
    assert page.locator(".md-field-engine img").evaluate("image=>image.complete && image.naturalWidth>0")
    scene_bounds(page)
    if observed:
        arrived = arrival_geometry(page)
        assert arrived["phase"] == "work" and abs(arrived["relativeLeft"] - 0.05) < 0.01, arrived
        assert observed["moving"]["relativeLeft"] < arrived["relativeLeft"] - 0.02, observed
        assert 0.81 < arrived["relativeBottom"] < 1, "The vehicle must land on the SVG road, not in a letterbox margin"
        arrived_file = f"fire-{tag}-arrival-on-road.png"
        page.screenshot(path=str(output / arrived_file), animations="allow")
        observed.update({"arrived": arrived, "arrivedFile": arrived_file, "vehicle": vehicle,
                         "scope": "This one normal-motion arrival only; physical touch and the full motion catalog are not claimed"})
    return observed


def work(page):
    click(page, "[data-field-work]")
    scene_bounds(page)


def hints(page, correct_ids, enabled):
    snapshot = choices(page)
    assert all(item["glow"] == (enabled and item["id"] in correct_ids) for item in snapshot), snapshot
    expect(page.locator("[data-action='help']")).to_have_attribute("aria-pressed", str(enabled).lower())
    return snapshot


def one_viewport(page, base, output, index, width, height, responses):
    tag = f"{width}x{height}"
    enter(page, base)
    expect(page.locator("[data-field-incident]")).to_have_count(3)
    capture(page, output, f"fire-{tag}-incidents")
    click(page, '[data-field-incident="water"]')
    offered = hints(page, TANKERS, True)
    assert set(TANKERS).issubset({item["id"] for item in offered})
    initial = scene_snapshot(page)
    assert initial["water"] == 0 and initial["fire"] == 3 and not initial["safe"], initial
    scene_bounds(page)
    click(page, "[data-action='help']")
    assert [c["id"] for c in hints(page, TANKERS, False)] == [c["id"] for c in offered]
    assert scene_snapshot(page) == initial
    wrong_id = next(item["id"] for item in offered if item["id"] not in TANKERS)
    click(page, f'[data-field-game-id="{wrong_id}"]')
    assert scene_snapshot(page) == initial
    expect(page.locator(".md-field-feedback")).to_contain_text("이 차는")
    expect(page.locator(".md-shake")).to_have_count(0)
    scene_bounds(page)
    click(page, "[data-field-listen]")
    motion_observation = choose(page, TANKERS[index % 2], motion=(output, tag) if (width, height) == (390, 844) else None)
    water_before = capture(page, output, f"fire-{tag}-water-before")
    work(page)
    assert scene_snapshot(page)["water"] == 39 and scene_snapshot(page)["fire"] == 3
    work(page)
    filled = scene_snapshot(page)
    assert filled["water"] == 78 and filled["fire"] == 3 and filled["phase"] == "result", filled
    assert page.evaluate("window.__fireRewards") == [], "Supply is not yet a completed incident"
    page.wait_for_timeout(3000)
    assert scene_snapshot(page) == filled, "The game advanced before the child's next choice"
    if (width, height) == (390, 844):
        page.set_viewport_size({"width": 844, "height": 390})
        page.wait_for_timeout(250)
        assert scene_snapshot(page) == filled
        scene_bounds(page)
        capture(page, output, f"fire-{tag}-filled-rotated")
        page.set_viewport_size({"width": width, "height": height})
        page.wait_for_timeout(250)
        assert scene_snapshot(page) == filled
    filled_image = capture(page, output, f"fire-{tag}-water-ready")
    assert water_before["sha256"] != filled_image["sha256"]
    click(page, "[data-field-next]")
    prepared = scene_snapshot(page)
    assert prepared["water"] == 78 and prepared["fire"] == 3 and prepared["role"] == "pump", prepared
    pump_choices = choices(page)
    assert all(item["id"] not in TANKERS + LADDERS for item in pump_choices), "Possible water-capable variants became false distractors"
    choose(page, "n_pump_engine")
    for remaining in (2, 1, 0):
        work(page)
        assert scene_snapshot(page)["fire"] == remaining
    water_after = capture(page, output, f"fire-{tag}-fire-out")
    assert water_after["scene"]["safe"] and water_after["scene"]["phase"] == "result"
    assert page.evaluate("window.__fireRewards") == [20]
    assert water_after["sha256"] != filled_image["sha256"]
    click(page, "[data-field-next]")
    expect(page.locator(".md-field-done-mark")).to_have_count(1)

    click(page, '[data-field-incident="ladder"]')
    ladder_offered = hints(page, LADDERS, False)
    assert set(LADDERS).issubset({item["id"] for item in ladder_offered})
    assert "s_articulating_boom_truck" not in {item["id"] for item in ladder_offered}
    click(page, "[data-action='help']")
    hints(page, LADDERS, True)
    choose(page, LADDERS[index % len(LADDERS)])
    ladder_before = capture(page, output, f"fire-{tag}-ladder-before")
    original_person = scene_snapshot(page)["person"]
    work(page)
    assert scene_snapshot(page)["ladderParts"] > 0 and scene_snapshot(page)["person"] == original_person
    work(page)
    assert scene_snapshot(page)["person"] == original_person
    expect(page.locator("[data-field-work]")).to_contain_text("친구 내려오기")
    click(page, "[data-field-listen]")
    work(page)
    ladder_after = capture(page, output, f"fire-{tag}-friend-safe")
    assert ladder_after["scene"]["person"] != original_person and ladder_after["scene"]["safe"]
    assert ladder_before["sha256"] != ladder_after["sha256"]
    assert page.evaluate("window.__fireRewards") == [20, 20]
    click(page, "[data-field-next]")

    click(page, '[data-field-incident="smoke"]')
    before_smoke = scene_snapshot(page)
    assert before_smoke["fire"] == 0 and before_smoke["smoke"] == 3
    choose(page, "s_smoke_extraction_fan_truck")
    smoke_before = capture(page, output, f"fire-{tag}-smoke-before")
    for remaining in (2, 1, 0):
        work(page)
        assert scene_snapshot(page)["smoke"] == remaining and scene_snapshot(page)["fire"] == 0
    smoke_after = capture(page, output, f"fire-{tag}-smoke-clear")
    assert smoke_after["scene"]["safe"] and smoke_after["sha256"] != smoke_before["sha256"]
    assert page.evaluate("window.__fireRewards") == [20, 20, 20]
    click(page, "[data-field-next]")
    expect(page.locator(".md-field-done-mark")).to_have_count(3)
    expect(page.locator("[data-field-again]")).to_be_visible()
    capture(page, output, f"fire-{tag}-three-scenes-complete")
    click(page, "[data-field-again]")
    expect(page.locator(".md-field-done-mark")).to_have_count(0)
    assert page.evaluate("window.__fireRewards") == [20, 20, 20]
    return {"status": "PASS", "case": "three-incidents", "viewport": {"width": width, "height": height},
            "tankerVariant": TANKERS[index % 2], "ladderVariant": LADDERS[index % len(LADDERS)],
            "motion": "no-preference" if (width, height) == (390, 844) else "reduce",
            "arrivalObservation": motion_observation,
            "sources": source_evidence(responses, base), "water": [water_before, filled_image, water_after],
            "ladder": [ladder_before, ladder_after], "smoke": [smoke_before, smoke_after],
            "rewardCalls": [20, 20, 20], "checks": ["wrong role feedback", "all tanker and ladder variants offered",
              "help on/off unchanged scene", "vehicle arrival then manual work", "water persists into pump work",
              "no automatic next step", "visible flames/ladder/person/smoke change", "three incidents and voluntary replay"]}


def retry_case(browser, base, output):
    context = browser.new_context(viewport={"width": 390, "height": 844}, service_workers="block", reduced_motion="reduce")
    page = context.new_page()
    responses, errors, requests = [], [], []
    page.on("response", responses.append)
    page.on("pageerror", lambda error: errors.append(str(error)))
    failed = {"on": True}
    def route_manifest(route):
        requests.append(route.request.url)
        if failed["on"]:
            route.fulfill(status=503, content_type="application/json", body="[]")
        else:
            route.continue_()
    page.route("**/assets/vehicles/fire*_manifest.json", route_manifest)
    try:
        enter(page, base)
        expect(page.locator("[data-field-incident]")).to_have_count(0)
        expect(page.locator("[data-field-retry]")).to_be_visible()
        assert page.evaluate("window.__fireRewards") == []
        capture(page, output, "fire-manifest-failed")
        count = len(requests)
        failed["on"] = False
        click(page, "[data-field-retry]")
        expect(page.locator("[data-field-incident]")).to_have_count(3, timeout=20000)
        assert len(requests) >= count + 2, requests
        click(page, '[data-field-incident="water"]')
        choose(page, "s_water_tanker")
        work(page)
        assert scene_snapshot(page)["water"] == 39
        capture(page, output, "fire-manifest-retried")
        assert not errors, errors
        return {"case": "manifest-failure-and-real-retry", "status": "PASS", "requestCount": len(requests),
                "sourcesAfterRetry": source_evidence(responses, base), "expectedHttpFailure": 503}
    finally:
        context.close()


def lifecycle_case(browser, base, output):
    context = browser.new_context(viewport={"width": 390, "height": 844}, service_workers="block", reduced_motion="reduce")
    context.add_init_script("""(() => {
      localStorage.setItem('sihyeon-play-settings-v1',JSON.stringify({version:1,ageMode:4,language:'en',challenges:{},assistance:'with-me'}));
      window.__fireSpeech=[];
      const speak=utterance=>{window.__fireSpeech.push({text:utterance.text,lang:utterance.lang});queueMicrotask(()=>utterance.onerror?.({error:'synthesis-failed'}));};
      try{Object.defineProperty(window.speechSynthesis,'speak',{configurable:true,value:speak});}catch(_){window.speechSynthesis.speak=speak;}
      const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
      Storage.prototype.getItem=function(key){if(key==='sihyeon-mega-dispatch-help-v1')throw Error('denied');return get.call(this,key);};
      Storage.prototype.setItem=function(key,value){if(key==='sihyeon-mega-dispatch-help-v1')throw Error('denied');return set.call(this,key,value);};
    })();""")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    try:
        enter(page, base)
        start = page.evaluate("window.__fireSpeech.length")
        click(page, '[data-field-incident="smoke"]')
        click(page, "[data-action='help']")
        hints(page, ["s_smoke_extraction_fan_truck"], False)
        choose(page, "s_smoke_extraction_fan_truck")
        work(page)
        work(page)
        work(page)
        assert scene_snapshot(page)["safe"]
        requests = page.evaluate("start=>window.__fireSpeech.slice(start)", start)
        assert len(requests) >= 4 and all(item["lang"].startswith("en") for item in requests), requests
        assert all(not any('\uac00' <= c <= '\ud7a3' for c in item["text"]) for item in requests), requests
        capture(page, output, "fire-english-speech-failure-completed")
        click(page, "[data-field-next]")
        click(page, '[data-field-incident="water"]')
        click(page, '[data-field-game-id="n_water_tanker"]')
        expect(page.locator('[data-field-phase="arrival"]')).to_be_visible()
        click(page, ".game-back-floating")
        page.wait_for_timeout(1100)
        expect(page.locator(".md-field-root")).to_have_count(0)
        assert page.evaluate("window.__fireRewards") == [20], "Leaving during arrival gave a reward"
        enter(page, base, fresh=False)
        expect(page.locator("[data-action='help']")).to_have_attribute("aria-pressed", "false")
        click(page, "[data-field-home]")
        for size in (4, 9, 16):
            click(page, f'[data-mode-size="{size}"]')
            expect(page.locator(".md14-truck-btn")).to_have_count(size, timeout=10000)
            wait_images(page)
            capture(page, output, f"fire-practice-{size}-preserved")
            click(page, ".game-back-floating")
            page.locator('.zone-game-card[onclick="openMegaDispatchGame()"]').click()
            expect(page.locator("[data-field-start]")).to_be_visible()
            wait_shell(page)
        assert not errors, errors
        return {"case": "english-speech-failure-storage-refusal-and-lifecycle", "status": "PASS",
                "speechRequests": requests, "rewardCalls": [20], "legacyModes": [4, 9, 16],
                "scope": "Actual voice-engine requests with a deliberately failing browser TTS; no audible claim"}
    finally:
        context.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url")
    parser.add_argument("--output", type=Path, default=Path("artifacts/creator-fire-stage4"))
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    report = {"status": "RUNNING", "checks": [], "pageErrors": [], "consoleErrors": [], "httpErrors": [], "failedRequests": [],
              "testScriptSha256": sha(Path(__file__).read_bytes()),
              "inputMode": "native browser mouse/keyboard clicks; has_touch is not enabled",
              "motionMode": "390x844 uses no-preference with one arrival DOM/PNG observation; other five viewports and special failure contexts use reduce",
              "notRun": ["physical device touch", "audible speech listening", "full catalog motion trajectories", "child observation"]}
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
            for index, (width, height) in enumerate(VIEWPORTS):
                context = browser.new_context(viewport={"width": width, "height": height},
                                              service_workers="block", reduced_motion="no-preference" if (width, height) == (390, 844) else "reduce")
                page = context.new_page()
                responses = []
                def record_response(response):
                    responses.append(response)
                    if response.status >= 400:
                        report["httpErrors"].append({"url": response.url, "status": response.status})
                page.on("response", record_response)
                page.on("pageerror", lambda error: report["pageErrors"].append(str(error)))
                page.on("console", lambda message: report["consoleErrors"].append(message.text) if message.type == "error" else None)
                page.on("requestfailed", lambda request: report["failedRequests"].append({"url": request.url, "failure": request.failure}))
                try:
                    report["checks"].append(one_viewport(page, base, output, index, width, height, responses))
                except Exception:
                    page.screenshot(path=str(output / f"FAIL-fire-{width}x{height}.png"))
                    raise
                finally:
                    context.close()
            report["checks"].append(retry_case(browser, base, output))
            report["checks"].append(lifecycle_case(browser, base, output))
            browser.close()
        assert not report["pageErrors"], report["pageErrors"]
        vehicle_prefix = urljoin(base, "assets/vehicles/")
        critical = [failure for failure in report["failedRequests"] + report["httpErrors"] if failure["url"].startswith(vehicle_prefix)]
        assert not critical, critical
        report["status"] = "PASS"
        report["totalCases"] = len(report["checks"])
    except Exception:
        report["status"] = "FAIL"
        report["error"] = traceback.format_exc()
        raise
    finally:
        (output / "creator-fire-stage4-browser.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        if server:
            server.shutdown()
        print(json.dumps({"status": report["status"], "cases": len(report["checks"]),
                          "report": str(output / "creator-fire-stage4-browser.json")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
