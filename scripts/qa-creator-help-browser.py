#!/usr/bin/env python3
"""Public-menu Chromium checks for reversible balloon/fire assistance.

All game actions use browser pointer/keyboard input. Balloon state is read only
to identify the current target; no level, timers, rendering or game rules are
overridden. Separate contexts exercise absent and write-only storage access.
"""
from __future__ import annotations

import argparse
import hashlib
import http.server
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import traceback
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = [(390, 844), (844, 390)]
SOURCE_PATHS = ["index.html", "js/games/color-balloon.js", "js/games/megaDispatch.js"]
BALLOON_KEY = "sihyeon-color-balloon-help-v1"
FIRE_KEY = "sihyeon-mega-dispatch-help-v1"
BALLOON_HELP = "#cbHelpToggle"
FIRE_HELP = ".md14-help-toggle"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def verify_sources(base_url):
    sources = []
    for relative in SOURCE_PATHS:
        request = urllib.request.Request(base_url + "/" + relative, headers={"Cache-Control": "no-cache"})
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read()
            assert response.status == 200, relative
        assert data == (ROOT / relative).read_bytes(), f"Served source differs from checkout: {relative}"
        sources.append({"path": relative, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
                        "git_blob_sha1": hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()})
    return sources


def open_public(page, base_url, game):
    zone, title = ("game", "색깔 풍선") if game == "balloon" else ("cars", "소방 출동")
    page.goto(base_url + "/index.html", wait_until="domcontentloaded", timeout=60000)
    page.locator(f"button.world-zone[onclick=\"travelToZone('{zone}')\"]").click(timeout=30000)
    page.locator("button.zone-game-card", has_text=title).click(timeout=30000)
    page.locator(BALLOON_HELP if game == "balloon" else FIRE_HELP).wait_for(state="visible")


def exit_and_reenter(page, game):
    page.locator(".game-back-floating").click()
    title = "색깔 풍선" if game == "balloon" else "소방 출동"
    page.locator("button.zone-game-card", has_text=title).click()
    page.locator(BALLOON_HELP if game == "balloon" else FIRE_HELP).wait_for(state="visible")


def assert_help_button(page, selector, enabled):
    button = page.locator(selector)
    assert button.get_attribute("aria-pressed") == str(enabled).lower()
    assert button.get_attribute("aria-label") and button.inner_text().strip()
    box = button.bounding_box()
    geometry = button.evaluate("""button => {
      const own=getComputedStyle(button), shell=button.closest('.game-play-screen');
      return {active:button.matches(':active'),cssWidth:own.width,cssHeight:own.height,
        transform:own.transform,shellTransform:shell?getComputedStyle(shell).transform:null};
    }""")
    assert box and box["width"] >= 44 and box["height"] >= 44, {"box": box, **geometry}
    viewport = page.viewport_size
    assert box["x"] >= 0 and box["y"] >= 0, box
    assert box["x"] + box["width"] <= viewport["width"] + 1, box
    assert box["y"] + box["height"] <= viewport["height"] + 1, box
    assert button.evaluate("""button => {
      const r=button.getBoundingClientRect(), hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return hit===button || button.contains(hit);
    }"""), "Help button is covered at its click point"
    return box


BALLOON_SNAPSHOT = """() => {
  const s=SihyeonGames.colorBalloon.state;
  return {level:s.currentLevel,target:s.targetColor.id,help:s.helpEnabled,animating:s.isAnimating,
    batchSize:SihyeonGames.colorBalloon.balloonCountByLevel[s.currentLevel-1],
    balloons:[...document.querySelectorAll('.cb-balloon:not(.cb-pop)')].map(b=>{
      const c=getComputedStyle(b);return {color:b.dataset.colorId,width:c.width,height:c.height,filter:c.filter,
        target:b.classList.contains('cb-balloon-target'),glow:b.classList.contains('cb-target-glow'),jump:b.classList.contains('cb-hint-jump')};
    })};
}"""


def assert_balloon_clues(page, enabled, rendered=False):
    snapshot = page.evaluate(BALLOON_SNAPSHOT)
    assert snapshot["help"] is enabled and snapshot["balloons"], snapshot
    assert any(b["color"] == snapshot["target"] for b in snapshot["balloons"]), snapshot
    for balloon in snapshot["balloons"]:
        target = balloon["color"] == snapshot["target"]
        assert balloon["target"] is (enabled and target) and balloon["glow"] is (enabled and target), snapshot
        if not enabled:
            assert not balloon["jump"], snapshot
            if rendered:
                assert balloon["filter"] == "none", snapshot
    if not enabled and rendered:
        assert len({(b["width"], b["height"]) for b in snapshot["balloons"]}) == 1, snapshot
    assert_help_button(page, BALLOON_HELP, enabled)
    return snapshot


def click_balloon(page, correct):
    # Balloons keep moving. Read the visible hit point then click it immediately;
    # waiting for Playwright's "stable element" would wait for the game to stop.
    point = page.wait_for_function("""correct => {
      const target=window.SihyeonGames?.colorBalloon?.state.targetColor?.id;
      const area=document.querySelector('#cbBalloonArea')?.getBoundingClientRect();
      if(!area) return false;
      for(const b of document.querySelectorAll('.cb-balloon:not(.cb-pop)')){
        if((b.dataset.colorId===target)!==correct || b.classList.contains('cb-wobble')) continue;
        const r=b.getBoundingClientRect(), left=Math.max(0,area.left,r.left),right=Math.min(innerWidth,area.right,r.right);
        const top=Math.max(0,area.top,r.top),bottom=Math.min(innerHeight,area.bottom,r.bottom);
        if(right-left<24 || bottom-top<24) continue;
        const x=(left+right)/2,y=(top+bottom)/2,hit=document.elementFromPoint(x,y);
        if(hit?.closest('.cb-balloon')===b) return {x,y};
      }
      return false;
    }""", arg=correct, timeout=25000).json_value()
    page.mouse.click(point["x"], point["y"])


def check_balloon(page, base_url, output, tag, checks):
    open_public(page, base_url, "balloon")
    initial = assert_balloon_clues(page, True)
    page.wait_for_timeout(3200)
    page.screenshot(path=str(output / f"balloon-help-on-{tag}.png"))
    page.locator(BALLOON_HELP).click()
    off = assert_balloon_clues(page, False)
    assert (off["level"], off["target"], off["batchSize"]) == (initial["level"], initial["target"], initial["batchSize"])
    page.wait_for_timeout(3300)
    assert_balloon_clues(page, False, rendered=True)
    page.screenshot(path=str(output / f"balloon-find-{tag}.png"))
    checks.append({"case": "balloon-off-removes-immediate-delayed-size-glow", "viewport": tag, "status": "PASS"})

    click_balloon(page, False)
    page.wait_for_function("Boolean(document.querySelector('.cb-wrong-face'))", timeout=2000)
    wrong = assert_balloon_clues(page, False)
    assert wrong["level"] == initial["level"] and not wrong["animating"]
    click_balloon(page, True)
    page.wait_for_function("SihyeonGames.colorBalloon.state.isAnimating", timeout=2000)
    page.wait_for_function("level => SihyeonGames.colorBalloon.state.currentLevel===level", arg=initial["level"] + 1, timeout=5000)
    advanced = assert_balloon_clues(page, False)
    page.locator(BALLOON_HELP).click()
    restored = assert_balloon_clues(page, True)
    assert (restored["level"], restored["target"]) == (advanced["level"], advanced["target"])
    page.locator(BALLOON_HELP).click()
    checks.append({"case": "balloon-wrong-correct-and-help-return", "viewport": tag, "status": "PASS"})

    exit_and_reenter(page, "balloon")
    assert_balloon_clues(page, False)
    assert page.evaluate("key => localStorage.getItem(key)", BALLOON_KEY) == "off"
    open_public(page, base_url, "balloon")
    assert_balloon_clues(page, False)
    checks.append({"case": "balloon-reentry-and-reload-persistence", "viewport": tag, "status": "PASS"})


FIRE_SNAPSHOT = """() => {
  const cards=[...document.querySelectorAll('.md-mission-card')],buttons=[...document.querySelectorAll('.md14-truck-btn')];
  const target=document.querySelector('.md-mission-card.active img')?.getAttribute('src');
  return {badge:document.querySelector('.md14-level-badge')?.innerText,done:cards.filter(c=>c.classList.contains('done')).length,
    mission:cards.map(c=>c.querySelector('img')?.getAttribute('src')),
    target:buttons.find(b=>b.querySelector('img')?.getAttribute('src')===target)?.dataset.gameId,
    choices:buttons.map(b=>({id:b.dataset.gameId,glow:b.classList.contains('target-glow'),image:Boolean(b.querySelector('img')?.naturalWidth)}))};
}"""


def start_fire(page):
    page.locator("button[data-mode-size='4']").click()
    page.wait_for_function("document.querySelectorAll('.md14-truck-btn').length===4", timeout=20000)
    page.wait_for_function("[...document.querySelectorAll('.md14-truck-btn img')].length===4 && [...document.querySelectorAll('.md14-truck-btn img')].every(i=>i.complete&&i.naturalWidth>0)", timeout=20000)


def assert_fire_clues(page, enabled):
    snapshot = page.evaluate(FIRE_SNAPSHOT)
    assert len(snapshot["choices"]) == 4 and snapshot["target"], snapshot
    for choice in snapshot["choices"]:
        assert choice["image"] and choice["glow"] is (enabled and choice["id"] == snapshot["target"]), snapshot
    assert_help_button(page, FIRE_HELP, enabled)
    return snapshot


def check_fire(page, base_url, output, tag, checks):
    open_public(page, base_url, "fire")
    assert_help_button(page, FIRE_HELP, True)  # Balloon OFF must not change fire's preference.
    start_fire(page)
    initial = assert_fire_clues(page, True)
    page.screenshot(path=str(output / f"fire-help-on-{tag}.png"))
    page.locator(FIRE_HELP).click()
    off = assert_fire_clues(page, False)
    assert (off["badge"], off["mission"], [c["id"] for c in off["choices"]]) == (initial["badge"], initial["mission"], [c["id"] for c in initial["choices"]])
    wrong_id = next(c["id"] for c in off["choices"] if c["id"] != off["target"])
    page.locator(f".md14-truck-btn[data-game-id='{wrong_id}']").click()
    page.wait_for_timeout(550)
    wrong = assert_fire_clues(page, False)
    assert wrong["done"] == 0 and wrong["target"] == off["target"]
    page.locator(f".md14-truck-btn[data-game-id='{off['target']}']").click()
    advanced = assert_fire_clues(page, False)
    assert advanced["done"] == 1 and page.locator(".water-drop").count() == 15, advanced
    page.screenshot(path=str(output / f"fire-find-water-{tag}.png"))
    page.wait_for_timeout(800)
    assert page.locator(".water-drop").count() == 0
    page.locator(FIRE_HELP).click()
    restored = assert_fire_clues(page, True)
    assert restored["mission"] == advanced["mission"] and restored["target"] == advanced["target"] and restored["done"] == 1
    page.locator(FIRE_HELP).click()
    page.screenshot(path=str(output / f"fire-find-{tag}.png"))
    checks.append({"case": "fire-off-wrong-correct-restored-help-and-water-lifetime", "viewport": tag, "status": "PASS"})

    target = page.locator(f".md14-truck-btn[data-game-id='{advanced['target']}']")
    target.focus()
    box = target.bounding_box()
    target.press("Enter")
    water = page.evaluate("""() => {
      const r=document.querySelector('.md14-root').getBoundingClientRect(), d=document.querySelector('.water-drop');
      return {count:document.querySelectorAll('.water-drop').length,x:r.left+parseFloat(d?.style.left),y:r.top+parseFloat(d?.style.top)};
    }""")
    assert water["count"] == 30, water
    assert abs(water["x"] - box["x"] - box["width"] / 2) < 1 and abs(water["y"] - box["y"] - box["height"] / 2) < 1, water
    checks.append({"case": "fire-keyboard-water-origin", "viewport": tag, "status": "PASS"})

    exit_and_reenter(page, "fire")
    assert_help_button(page, FIRE_HELP, False)
    start_fire(page)
    assert_fire_clues(page, False)
    assert page.evaluate("key => localStorage.getItem(key)", FIRE_KEY) == "off"
    open_public(page, base_url, "fire")
    assert_help_button(page, FIRE_HELP, False)
    checks.append({"case": "fire-reentry-and-reload-persistence", "viewport": tag, "status": "PASS"})


def storage_script(mode):
    return """(() => {
      const keys=new Set(%s), mode=%s;
      const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
      window.__qaStorageDenials=[];
      if(mode==='write') for(const key of keys) set.call(localStorage,key,'on');
      Storage.prototype.getItem=function(key){
        if(mode==='all'&&keys.has(key)){window.__qaStorageDenials.push('get:'+key);throw new DOMException('QA denied','SecurityError');}
        return get.call(this,key);
      };
      Storage.prototype.setItem=function(key,value){
        if(keys.has(key)){window.__qaStorageDenials.push('set:'+key);throw new DOMException('QA denied','QuotaExceededError');}
        return set.call(this,key,value);
      };
    })();""" % (json.dumps([BALLOON_KEY, FIRE_KEY]), json.dumps(mode))


def check_storage_denial(page, base_url, output, mode, checks):
    for game, selector in [("balloon", BALLOON_HELP), ("fire", FIRE_HELP)]:
        open_public(page, base_url, game)
        assert_help_button(page, selector, True)
        page.locator(selector).click()
        assert_help_button(page, selector, False)
        exit_and_reenter(page, game)
        assert_help_button(page, selector, False)
        if game == "balloon":
            assert_balloon_clues(page, False)
            click_balloon(page, True)
            page.wait_for_function("SihyeonGames.colorBalloon.state.currentLevel===2", timeout=5000)
            assert_balloon_clues(page, False)
        else:
            start_fire(page)
            fire = assert_fire_clues(page, False)
            page.locator(f".md14-truck-btn[data-game-id='{fire['target']}']").click()
            assert assert_fire_clues(page, False)["done"] == 1
        page.locator(selector).click()
        assert_help_button(page, selector, True)
        denied = page.evaluate("window.__qaStorageDenials")
        assert any(entry.startswith("set:") for entry in denied), denied
        page.screenshot(path=str(output / f"{game}-storage-{mode}-390x844.png"))
        checks.append({"case": f"{game}-storage-{mode}-denied-session-choice-and-progress", "viewport": "390x844", "status": "PASS", "denials": denied})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", help="Existing checkout server or deployed site root")
    parser.add_argument("--output", default="artifacts/creator-help-browser")
    args = parser.parse_args()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    server = None
    result = {"status": "RUNNING", "checks": [], "page_errors": [], "sources": [],
              "limitations": ["Machine browser checks; physical touch and child observation are NOT_RUN.", "Audio listening is NOT_RUN."],
              "test_api_scope": ["Read colorBalloon.state and current target; game state/timers/assets remain unchanged.",
                                 "Read DOM, computed styles, hit points and water-particle coordinates.",
                                 "Separate denial contexts override Storage getItem/setItem for the two help keys only.",
                                 "All actions use real public menu, pointer clicks or keyboard Enter."]}
    page = None
    try:
        try:
            result["checkout_commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        except (OSError, subprocess.CalledProcessError):
            result["checkout_commit"] = None
        if args.base_url:
            base_url = args.base_url.rstrip("/")
        else:
            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base_url = f"http://127.0.0.1:{server.server_port}"
        result["base_url"] = base_url
        result["sources"] = verify_sources(base_url)
        with sync_playwright() as pw:
            launch = {"headless": True, "args": ["--no-sandbox"]}
            if os.environ.get("CHROMIUM_PATH"):
                launch["executable_path"] = os.environ["CHROMIUM_PATH"]
            browser = pw.chromium.launch(**launch)
            try:
                for width, height in VIEWPORTS:
                    tag = f"{width}x{height}"
                    context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block")
                    page = context.new_page()
                    page.on("pageerror", lambda error, tag=tag: result["page_errors"].append({"context": tag, "error": str(error)}))
                    check_balloon(page, base_url, output, tag, result["checks"])
                    check_fire(page, base_url, output, tag, result["checks"])
                    context.close()
                for mode in ["all", "write"]:
                    context = browser.new_context(viewport={"width": 390, "height": 844}, service_workers="block")
                    context.add_init_script(storage_script(mode))
                    page = context.new_page()
                    page.on("pageerror", lambda error, mode=mode: result["page_errors"].append({"context": "storage-" + mode, "error": str(error)}))
                    check_storage_denial(page, base_url, output, mode, result["checks"])
                    context.close()
                assert not result["page_errors"], result["page_errors"]
            except Exception:
                if page and not page.is_closed():
                    page.screenshot(path=str(output / "failure.png"))
                raise
            finally:
                browser.close()
        result["status"] = "PASS"
    except Exception as error:
        result["status"] = "FAIL"
        result["error"] = str(error)
        result["traceback"] = traceback.format_exc()
    finally:
        if server:
            server.shutdown()
        (output / "results.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"status": result["status"], "checks": len(result["checks"]), "output": str(output), "error": result.get("error")}, ensure_ascii=False))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
