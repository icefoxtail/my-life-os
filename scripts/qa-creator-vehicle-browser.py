"""Native-menu Chromium regression for creator stage 1 vehicle rules.

No private game state or synthetic click events are injected. Deterministic
randomness chooses reproducible questions; one named catalog fixture removes
two diggers to exercise the new backhoe answer. SihyeonVoice is stubbed, so this
does not establish audible speech, physical-touch, or child-observation quality.
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
CONSTRUCTION = json.loads((ROOT / "assets/vehicles/construction_manifest.json").read_text())
VALID = {
    "dig": {"excavator", "mini_excavator", "backhoe_loader"},
    "push": {"bulldozer", "grader", "wheel_loader", "backhoe_loader", "skid_steer_loader"},
    "load": {"wheel_loader", "backhoe_loader", "skid_steer_loader", "excavator", "mini_excavator"},
    "carry": {"dump_truck", "articulated_dump_truck", "dump_loader", "cargo_truck"},
    "mix": {"concrete_mixer"},
    "lift": {"crane_truck", "forklift", "tower_crane", "mobile_crane"},
    "pump": {"concrete_pump_truck"},
}
BUCKETS = {"excavator", "mini_excavator", "wheel_loader", "backhoe_loader", "skid_steer_loader", "dump_loader"}
TRANSPORT = {"dump_truck", "articulated_dump_truck", "dump_loader", "cargo_truck", "lowbed_trailer", "forklift"}
PROTECTED = {
    "dig": BUCKETS | {"bulldozer", "grader", "drilling_rig", "excavator_breaker", "pile_driver"},
    "push": BUCKETS | {"bulldozer", "grader", "road_roller", "asphalt_paver"},
    "load": BUCKETS | TRANSPORT | {"bulldozer", "grader", "sweeper_truck"},
    "carry": BUCKETS | TRANSPORT | {"bulldozer", "grader", "scissor_lift"},
    "mix": {"concrete_mixer", "asphalt_paver"},
    "lift": BUCKETS | TRANSPORT | {"crane_truck", "tower_crane", "mobile_crane", "scissor_lift", "pile_driver"},
    "pump": {"concrete_pump_truck"},
}


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def mute_voice(page):
    page.evaluate("""() => {
      const done = () => Promise.resolve(false);
      window.__creatorVoiceCalls = [];
      const voice = window.SihyeonVoice || {};
      for (const name of ['play', 'playSequence', 'speak']) {
        voice[name] = (...args) => { window.__creatorVoiceCalls.push({name, args}); return done(); };
      }
      voice.stop = () => {};
      window.SihyeonVoice = voice;
    }""")


def open_menu_game(page, base, zone, action):
    page.goto(base + "index.html", wait_until="load")
    mute_voice(page)
    page.locator(f'.world-zone[onclick="travelToZone(\'{zone}\')"]').click()
    page.locator(f'.zone-game-card[onclick="{action}()"]').click()


def memory_cards(page):
    return page.locator(".memory-card").evaluate_all("""cards => cards.map(card => ({
      index: Number(card.dataset.index), uid: card.dataset.cardUid,
      src: card.querySelector('img')?.getAttribute('src'), matched: card.classList.contains('is-matched')
    }))""")


def click_memory_pair(page, first, second, expected):
    page.locator(f'.memory-card[data-index="{first}"]').click()
    expect(page.locator(f'.memory-card[data-index="{first}"]')).to_have_class(re.compile(r"\bis-open\b"))
    page.locator(f'.memory-card[data-index="{second}"]').click()
    expect(page.locator(".memory-card.is-matched")).to_have_count(expected, timeout=5000)


def memory_case(page, base, output, category, count):
    open_menu_game(page, base, "game", "openMemoryGame")
    page.locator(".memory-card").first.wait_for()
    page.locator(f'.memory-level-chip[data-count="{count}"]').click()
    page.locator('[data-action="open-category-sheet"]').click()
    page.locator(f'.memory-vehicle-cat-chip[data-vehicle-cat="{category}"]').click()
    expect(page.locator(".memory-card")).to_have_count(count)
    expect(page.locator(".memory-card.is-preview")).to_have_count(0, timeout=6000)
    page.wait_for_function("""() => Array.from(document.querySelectorAll('.memory-card-front img'))
      .every(img => img.complete && img.naturalWidth > 0)""")
    cards = memory_cards(page)
    assert len({card["uid"] for card in cards}) == count, "physical card UIDs are distinct"
    groups = collections.defaultdict(list)
    for card in cards:
        groups[card["src"]].append(card)
    duplicate = next(group for group in groups.values() if len(group) >= 4)
    first = duplicate[0]
    second = next(card for card in duplicate if card["uid"][:-2] != first["uid"][:-2])
    click_memory_pair(page, first["index"], second["index"], 2)
    selected_uids = {first["uid"], second["uid"]}
    assert {card["uid"] for card in memory_cards(page) if card["matched"]} == selected_uids
    page.screenshot(path=str(output / f"memory-{category}-{count}-cross-pair.png"))
    page.set_viewport_size({"width": 844, "height": 390})
    expect(page.locator(".memory-game-container.memory-landscape")).to_be_visible()
    expect(page.locator(".memory-card.is-matched")).to_have_count(2)
    after_rotation = memory_cards(page)
    assert {card["uid"] for card in after_rotation if card["matched"]} == selected_uids
    assert [(card["uid"], card["src"]) for card in cards] == [(card["uid"], card["src"]) for card in after_rotation]
    page.screenshot(path=str(output / f"memory-{category}-{count}-rotated.png"))
    # Rotating rebuilds the banner DOM, so its disappearance cannot signal the
    # existing speech-completion lock. Allow its documented maximum 4.2s once.
    page.wait_for_timeout(4400)
    matched = 2
    while matched < count:
        remaining = [card for card in memory_cards(page) if not card["matched"]]
        first = remaining[0]
        second = next(card for card in remaining[1:] if card["src"] == first["src"])
        matched += 2
        click_memory_pair(page, first["index"], second["index"], matched)
        if matched < count:
            expect(page.locator(".memory-speech-banner")).to_have_count(0, timeout=7000)
    expect(page.locator(".memory-success-panel")).to_be_visible(timeout=10000)
    page.screenshot(path=str(output / f"memory-{category}-{count}-complete.png"))
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "viewport overflow"
    return {"category": category, "cards": count, "crossPairUids": sorted(selected_uids),
            "matchedAfterRotation": 2, "completed": count, "source": "deployed full vehicle catalog"}


def mission_id(page):
    return page.locator(".cs-root").evaluate("el => Array.from(el.classList).find(v => v.startsWith('cs-stage-')).slice(9)")


def choice_ids(page):
    return page.locator(".cs-choice").evaluate_all("buttons => buttons.map(button => button.dataset.id)")


def construction_case(page, base, output, mission, random_value, backhoe_fixture=False):
    if backhoe_fixture:
        vehicles = [vehicle for vehicle in CONSTRUCTION if vehicle["id"] not in {"excavator", "mini_excavator"}]
        page.route("**/construction_manifest.json", lambda route: route.fulfill(json=vehicles))
    page.add_init_script(f"Math.random = () => {random_value};")
    open_menu_game(page, base, "cars", "openConstructionSiteGame")
    expect(page.locator(".cs-root")).to_be_visible()
    page.locator('[data-action="practice"]').click()
    expect(page.locator('.cs-choice').first).to_be_visible()
    preliminary = []
    # Constant random 0.0005 gives push, load, carry; the load scenario therefore
    # completes the preceding real push round through its visible choice.
    if mission == "load":
        assert mission_id(page) == "push"
        before = choice_ids(page)
        answer = next(vehicle for vehicle in before if vehicle in VALID["push"])
        page.locator(f'.cs-choice[data-id="{answer}"]').click()
        page.locator('[data-action="work"]').click()
        expect(page.locator('[data-action="next-work"]')).to_be_visible(timeout=10000)
        page.locator('[data-action="next-work"]').click()
        expect(page.locator(".cs-root.cs-stage-load")).to_be_visible(timeout=10000)
        preliminary.append({"mission": "push", "answer": answer})
    assert mission_id(page) == mission
    offered = choice_ids(page)
    assert len(offered) == len(set(offered)) == 3
    assert any(vehicle in VALID[mission] for vehicle in offered)
    assert not any(vehicle in PROTECTED[mission] and vehicle not in VALID[mission] for vehicle in offered), offered
    wrong = next(vehicle for vehicle in offered if vehicle not in VALID[mission])
    wrong_button = page.locator(f'.cs-choice[data-id="{wrong}"]')
    wrong_button.click()
    expect(wrong_button).to_have_class(re.compile(r"\bis-wrong\b"))
    expect(page.locator("#csMessage")).to_contain_text("괜찮아")
    assert mission_id(page) == mission, "wrong answer must keep the current question"
    answer = "backhoe_loader" if backhoe_fixture else "tower_crane" if mission == "lift" else next(vehicle for vehicle in offered if vehicle in VALID[mission])
    assert answer in offered, (mission, answer, offered)
    page.locator(f'.cs-choice[data-id="{answer}"]').click()
    expect(page.locator(f'.cs-choice[data-id="{answer}"]')).to_have_class(re.compile(r"\bis-correct\b"))
    page.locator('[data-action="work"]').click()
    expect(page.locator(".cs-root.is-success")).to_be_visible(timeout=6000)
    expect(page.locator("#csWorkerVehicle img")).to_have_count(1)
    expect(page.locator("#csWorkerVehicle img")).to_have_attribute("src", "./" + next(vehicle["file"] for vehicle in CONSTRUCTION if vehicle["id"] == answer))
    label = "backhoe-dig" if backhoe_fixture else mission
    page.screenshot(path=str(output / f"construction-{label}-success.png"))
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "viewport overflow"
    return {"mission": mission, "offered": offered, "wrong": wrong, "accepted": answer,
            "randomConstant": random_value, "preliminaryRounds": preliminary,
            "catalogFixture": "full catalog minus excavator and mini_excavator to force backhoe" if backhoe_fixture else "unmodified 27-vehicle catalog"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url")
    parser.add_argument("--output", default="qa-creator-vehicle-evidence")
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
    report = {"scope": "native-menu Chromium DOM/click regression; not physical-touch or audible-speech QA",
              "audio": "SihyeonVoice play/playSequence/speak are stubbed to resolved false and logged",
              "baseUrl": base, "checks": [], "pageErrors": [], "sourceHashes": {}}
    try:
        report["sourceCommit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        report["sourceCommit"] = None
    try:
        for filename in ["index.html", "js/games/vehicle-memory.js", "js/games/construction-site.js",
                         "assets/vehicles/vehicles_manifest.json", "assets/vehicles/construction_manifest.json"]:
            local_sha = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()
            request = urllib.request.Request(base + filename, headers={"Cache-Control": "no-cache"})
            with urllib.request.urlopen(request, timeout=30) as response:
                served_sha = hashlib.sha256(response.read()).hexdigest()
            report["sourceHashes"][filename] = {"local": local_sha, "served": served_sha, "match": local_sha == served_sha}
            assert local_sha == served_sha, f"source mismatch: {filename}"
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            report["browser"] = browser.version

            def check(name, run, landscape=False):
                context = browser.new_context(viewport={"width": 844, "height": 390} if landscape else {"width": 390, "height": 844}, service_workers="block")
                page = context.new_page()
                page.on("pageerror", lambda error: report["pageErrors"].append({"case": name, "error": str(error)}))
                try:
                    detail = run(page)
                    report["checks"].append({"name": name, "status": "PASS", "detail": detail})
                except Exception as error:
                    try:
                        page.screenshot(path=str(output / (name.replace(" ", "-") + "-failure.png")))
                    except Exception:
                        pass
                    report["checks"].append({"name": name, "status": "FAIL", "error": str(error), "trace": traceback.format_exc()})
                finally:
                    print(json.dumps(report["checks"][-1], ensure_ascii=False), flush=True)
                    context.close()

            for category, count in [("rescue", 8), ("police", 16)]:
                check(f"memory-{category}-{count}", lambda page, category=category, count=count: memory_case(page, base, output, category, count))
            for mission, value in [("dig", .5005), ("push", .0005), ("load", .0005), ("carry", .2505), ("mix", .2005), ("lift", .3995), ("pump", .1435)]:
                check(f"construction-{mission}", lambda page, mission=mission, value=value: construction_case(page, base, output, mission, value), landscape=mission in {"load", "lift", "pump"})
            check("construction-backhoe-dig", lambda page: construction_case(page, base, output, "dig", .5005, backhoe_fixture=True))
            browser.close()
        report["status"] = "PASS" if all(check["status"] == "PASS" for check in report["checks"]) and not report["pageErrors"] else "FAIL"
    except Exception as error:
        report["status"] = "FAIL"
        report["fatalError"] = str(error)
        report["trace"] = traceback.format_exc()
    finally:
        if server:
            server.shutdown()
        (output / "creator-vehicle-results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"status": report["status"], "checks": len(report["checks"]), "pageErrors": len(report["pageErrors"])}), flush=True)
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
