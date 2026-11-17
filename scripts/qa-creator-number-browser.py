"""Real Chromium/WebGL evidence for Number Kingdom quantity/action language.

Menu entry uses native Playwright clicks. Controlled game situations use the
existing NumberKingdomDebug interface; pose changes click real pose cards.
This is not physical-device testing or audible-TTS verification.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import threading
import time
import traceback
from urllib.parse import urljoin, urlsplit, urlunsplit

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE_PATHS = ("index.html", "games/number-kingdom-3d.html", "js/engine/webgl-fallback.js")
VIEWPORTS = ((390, 844), (844, 390))
WEBGL_ARGS = ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader",
              "--enable-unsafe-swiftshader"]

# Observe the product's real transition/timer without changing either one.
# The first computed-style read happens in the same iframe task as the last tap.
TOAST_SAMPLE_JS = """
function sampleToast(tapAtMs) {
  const element = document.querySelector('#toast');
  const opacity = Number(getComputedStyle(element).opacity);
  const rect = element.getBoundingClientRect(), sampleAtMs = performance.now();
  return {left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
    width: rect.width, height: rect.height, viewportWidth: innerWidth,
    viewportHeight: innerHeight, opacity, inlineOpacity: element.style.opacity,
    text: element.textContent, tapAtMs, sampleAtMs, elapsedMs: sampleAtMs - tapAtMs};
}
"""
TOAST_OBSERVER_JS = TOAST_SAMPLE_JS + """
function observeToast(expectedText, tapAtMs) {
  const initial = sampleToast(tapAtMs), minimumMs = 200, deadlineMs = 1000;
  return new Promise(resolve => {
    let frameId = 0, deadlineTimer = 0, firstFrame = null, samples = 0, finished = false;
    function finish(outcome, box) {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frameId);
      clearTimeout(deadlineTimer);
      resolve({outcome, expectedText, minimumMs, deadlineMs, initial, firstFrame, final: box, samples});
    }
    function inspectFrame() {
      const box = sampleToast(tapAtMs);
      samples++;
      if (!firstFrame) firstFrame = box;
      if (box.elapsedMs >= deadlineMs) return finish('deadline', box);
      const visible = box.width > 0 && box.height > 0 && box.opacity > 0 &&
        box.left >= -1 && box.right <= box.viewportWidth + 1 &&
        box.top >= 0 && box.bottom <= box.viewportHeight + 1;
      if (box.elapsedMs >= minimumMs && visible && box.text === expectedText) return finish('visible', box);
      frameId = requestAnimationFrame(inspectFrame);
    }
    deadlineTimer = setTimeout(() => finish('deadline', sampleToast(tapAtMs)),
      Math.max(0, deadlineMs - initial.elapsedMs));
    frameId = requestAnimationFrame(inspectFrame);
  });
}
"""


class QuietServer(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def sha256(raw):
    return hashlib.sha256(raw).hexdigest()


def normalized_base(value):
    parsed = urlsplit(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("--base-url must be an HTTP(S) playground URL")
    path = parsed.path
    if path.endswith("/index.html"):
        path = path[:-len("index.html")]
    return urlunsplit((parsed.scheme, parsed.netloc, path.rstrip("/") + "/", "", ""))


def record(report, name, kind, run):
    row = {"name": name, "kind": kind}
    try:
        row["detail"] = run()
        row["status"] = "PASS"
    except Exception as exc:
        row.update(status="FAIL", error=str(exc), trace=traceback.format_exc())
    report["checks"].append(row)
    print(f"{row['status']} {kind}: {name}", flush=True)
    return row


def webgl_runtime(frame):
    runtime = frame.evaluate("""() => {
      const canvas = document.querySelector('#scene3d');
      const fallback = Boolean(document.querySelector('.s2d-root'));
      const gl = canvas && (canvas.getContext('webgl2') || canvas.getContext('webgl'));
      return {
        debugReady: Boolean(window.NumberKingdomDebug), fallback,
        threeRevision: window.THREE?.REVISION || null,
        webgl: Boolean(gl), contextLost: gl ? gl.isContextLost() : null,
        renderer: gl ? gl.getParameter(gl.RENDERER) : null,
        version: gl ? gl.getParameter(gl.VERSION) : null,
        canvas: canvas ? {width: canvas.width, height: canvas.height} : null,
        loading: Boolean(document.querySelector('#sihyeon-3d-loading'))
      };
    }""")
    assert not runtime["fallback"], f"2D fallback is not a WebGL pass: {runtime}"
    assert runtime["debugReady"] and runtime["webgl"], f"3D runtime unavailable: {runtime}"
    assert not runtime["contextLost"] and not runtime["loading"], runtime
    assert runtime["canvas"]["width"] > 0 and runtime["canvas"]["height"] > 0, runtime
    return runtime


def loaded_sources(responses, base, checkout_hashes):
    by_path = {urlsplit(urljoin(base, name)).path: name for name in SOURCE_PATHS}
    evidence = {}
    for response in responses:
        name = by_path.get(urlsplit(response.url).path)
        if name is None:
            continue
        served_hash = sha256(response.body())
        evidence[name] = {
            "url": response.url, "httpStatus": response.status,
            "servedSha256": served_hash, "checkoutSha256": checkout_hashes[name],
            "matchesCheckout": served_hash == checkout_hashes[name],
        }
    assert set(evidence) == set(SOURCE_PATHS), f"Missing actual browser source responses: {evidence}"
    return evidence


def native_entry(page, base, output, size, responses, report):
    navigation = page.goto(urljoin(base, "index.html"), wait_until="domcontentloaded", timeout=45000)
    assert navigation and navigation.ok, "Playground index did not load successfully"
    page.locator(".world-zone[onclick=\"travelToZone('numbers')\"]").click()
    page.locator('.zone-game-card[onclick="openNumberKingdom3DGame()"]').click()
    page.locator("#numberKingdomFrame").wait_for(state="visible")
    page.wait_for_function("""() => {
      const frame = document.querySelector('#numberKingdomFrame');
      try {
        return Boolean(frame?.contentWindow?.NumberKingdomDebug ||
          frame?.contentDocument?.querySelector('.s2d-root'));
      } catch (_) { return false; }
    }""", timeout=45000)
    handle = page.locator("#numberKingdomFrame").element_handle()
    frame = handle.content_frame() if handle else None
    assert frame, "Public card did not create an accessible game iframe"
    assert urlsplit(frame.url).path == urlsplit(urljoin(base, "games/number-kingdom-3d.html")).path, frame.url
    runtime = webgl_runtime(frame)
    audit = frame.evaluate("NumberKingdomDebug.selfTest()")
    assert audit["pass"], f"Startup mathematical self-test: {audit}"
    evidence = loaded_sources(responses, base, report["checkoutSourceSha256"])
    report["sourceSha256"][size] = evidence
    assert all(item["httpStatus"] == 200 and item["matchesCheckout"] for item in evidence.values()), evidence
    page.wait_for_timeout(350)
    image = f"number-native-menu-{size}.png"
    page.screenshot(path=str(output / image))
    return {"actions": ["native click: number zone", "native click: Number Kingdom card"],
            "iframeUrl": frame.url, "runtime": runtime, "selfTest": audit, "screenshot": image}


def empty_world_and_spawn(frame, numbers):
    webgl_runtime(frame)
    return frame.evaluate("""numbers => {
      const d = NumberKingdomDebug, w = d.getState();
      w.sound = false; // Screen/state tests do not claim audible speech coverage.
      for (const entity of [...w.friends, ...w.props]) d.deleteObject(entity, w);
      w.zone = 'plaza'; w.cameraX = 9; w.goalX = 9;
      w.drag = null; w.pan = null; w.merging = null;
      Object.assign(d.tapTracker, {targetId: null, num: 0, count: 0, lastTime: 0});
      return numbers.map((n, index) => {
        const friend = d.spawnFriend(n, w, 3 + index * 17, 0);
        if (!friend) throw new Error('Could not create requested number ' + n);
        return friend.id;
      });
    }""", numbers)


def choose_pose(frame, friend_id, pose):
    current = frame.evaluate("""id => {
      const d = NumberKingdomDebug;
      d.selectEntity(id);
      return d.getState().friends.find(friend => friend.id === id)?.pose;
    }""", friend_id)
    assert current, f"Missing test friend {friend_id}"
    if current != pose:
        frame.locator(f'.poseCard[aria-label="3D 모양 {pose}"]').click()
    frame.wait_for_function("""({id, pose}) => {
      const friend = NumberKingdomDebug.getState().friends.find(item => item.id === id);
      return friend?.pose === pose && friend.anim.morphT >= 1;
    }""", arg={"id": friend_id, "pose": pose}, timeout=15000)


def place_neighbors(frame, friend_ids):
    return frame.evaluate("""ids => {
      const d = NumberKingdomDebug, w = d.getState();
      let nextX = 3;
      const details = ids.map(id => {
        const friend = w.friends.find(item => item.id === id);
        if (!friend) throw new Error('Missing test friend ' + id);
        const bounds = d.getBoundsLocal(friend.cells);
        friend.gx = nextX; friend.gy = 0; friend.gz = 0;
        friend.yPos = 0; friend.vy = 0; friend.walk = null; friend.carrier = null;
        friend.bridge = null; friend.train = false;
        nextX += bounds.w + 1;
        return {id, n: friend.n, pose: friend.pose, cells: friend.cells.length,
          renderedUnitMeshes: friend.cubeMeshes.length, height: bounds.h, width: bounds.w};
      });
      w.cameraX = (3 + nextX - 1) / 2; w.goalX = w.cameraX;
      d.selectEntity(ids[0]);
      Object.assign(d.tapTracker, {targetId: null, num: 0, count: 0, lastTime: 0});
      const pair = d.findPair3D(w);
      return {friends: details, pair: pair ? [pair.a.id, pair.b.id] : null};
    }""", friend_ids)


def check_toast_visible(observation, expected_text):
    box = observation["final"]
    assert box["width"] > 0 and box["height"] > 0 and box["opacity"] > 0, observation
    assert box["left"] >= -1 and box["right"] <= box["viewportWidth"] + 1, observation
    assert box["top"] >= 0 and box["bottom"] <= box["viewportHeight"] + 1, observation
    assert box["text"] == expected_text, observation
    assert observation["outcome"] == "visible" and 200 <= box["elapsedMs"] < 1000, observation
    return box


def capture_toast(page, frame, output, image, tap_at_ms):
    sampler = "tapAtMs => {" + TOAST_SAMPLE_JS + "return sampleToast(tapAtMs); }"
    before = frame.evaluate(sampler, tap_at_ms)
    host_start = time.perf_counter()
    page.screenshot(path=str(output / image))
    host_duration_ms = (time.perf_counter() - host_start) * 1000
    after = frame.evaluate(sampler, tap_at_ms)
    return {"before": before, "after": after, "hostScreenshotDurationMs": host_duration_ms,
            "scope": "Timing around the saved screenshot; the visibility assertion uses the in-frame observation above."}


def comparison_case(page, frame, output, size, spec):
    ids = empty_world_and_spawn(frame, [spec["a"][0], spec["b"][0]])
    for friend_id, (_, pose) in zip(ids, (spec["a"], spec["b"])):
        choose_pose(frame, friend_id, pose)
    placement = place_neighbors(frame, ids)
    a, b = placement["friends"]
    assert set(placement["pair"] or []) == set(ids), placement
    assert a["cells"] == a["renderedUnitMeshes"] == spec["a"][0], a
    assert b["cells"] == b["renderedUnitMeshes"] == spec["b"][0], b
    if spec["kind"] == "equal":
        assert a["n"] == b["n"] and a["height"] != b["height"], placement
    else:
        assert a["n"] > b["n"] and a["height"] < b["height"], placement
    page.wait_for_timeout(350)
    host_start = time.perf_counter()
    observed = frame.evaluate("async id => {" + TOAST_OBSERVER_JS + """
      const d = NumberKingdomDebug, friend = d.getState().friends.find(item => item.id === id);
      d.handleFriendTap(friend);
      const first = document.querySelector('#toast').textContent;
      const tapAtMs = performance.now();
      d.handleFriendTap(friend);
      const repeated = document.querySelector('#toast').textContent;
      const toastObservation = await observeToast(repeated, tapAtMs);
      return {first, repeated, toastObservation};
    }""", ids[0])
    observed["toastObservation"]["hostEvaluationDurationMs"] = (time.perf_counter() - host_start) * 1000
    message = observed["repeated"]
    assert "키" not in message and "커요" not in message, observed
    if spec["kind"] == "equal":
        assert "블록 수가 같아요" in message and f"{a['n']} = {b['n']}" in message, observed
        assert "+" not in message, observed
    else:
        for text in (f"숫자 {a['n']}", f"{a['n'] - b['n']}개 더 많아요", f"{b['n']} < {a['n']}"):
            assert text in message, observed
            if a["n"] >= 20:
                assert text in observed["first"], observed
    toast_box = check_toast_visible(observed["toastObservation"], message)
    runtime = webgl_runtime(frame)
    image = f"number-{spec['name']}-{size}.png"
    screenshot_timing = capture_toast(page, frame, output, image, toast_box["tapAtMs"])
    return {"driver": "existing debug API for world setup/taps; native pose-card clicks",
            "placement": placement, "observed": observed, "toastBox": toast_box,
            "runtime": runtime, "screenshot": image, "screenshotTiming": screenshot_timing}


def tap_count_case(page, frame, output, size):
    ids = empty_world_and_spawn(frame, [1])
    place_neighbors(frame, ids)
    page.wait_for_timeout(350)
    host_start = time.perf_counter()
    result = frame.evaluate("async id => {" + TOAST_OBSERVER_JS + """
      const d = NumberKingdomDebug, friend = d.getState().friends.find(item => item.id === id);
      const steps = [];
      let tapAtMs;
      for (let count = 1; count <= 10; count++) {
        tapAtMs = performance.now();
        d.handleFriendTap(friend);
        steps.push({count, toast: document.querySelector('#toast').textContent,
          quantity: friend.n, cells: friend.cells.length, renderedUnitMeshes: friend.cubeMeshes.length});
      }
      const toastObservation = await observeToast(steps[steps.length - 1].toast, tapAtMs);
      return {steps, totalFriends: d.getState().friends.length, toastObservation};
    }""", ids[0])
    result["toastObservation"]["hostEvaluationDurationMs"] = (time.perf_counter() - host_start) * 1000
    assert result["totalFriends"] == 1, result
    for step in result["steps"]:
        assert step["quantity"] == step["cells"] == step["renderedUnitMeshes"] == 1, step
        if step["count"] >= 2:
            assert "번 두드렸어요" in step["toast"], step
            assert f"({step['count']}/10)" in step["toast"], step
            assert "개" not in step["toast"], step
    assert "열 번" in result["steps"][-1]["toast"], result
    result["toastBox"] = check_toast_visible(result["toastObservation"], result["steps"][-1]["toast"])
    result["runtime"] = webgl_runtime(frame)
    image = f"number-tap-count-ten-{size}.png"
    result["screenshotTiming"] = capture_toast(page, frame, output, image, result["toastBox"]["tapAtMs"])
    result.update(driver="existing debug API invoking the actual tap handler", screenshot=image,
                  audio="NOT_RUN; this screen/state scenario disables game audio")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", help="Existing playground base URL or its index.html URL")
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path("qa-creator-number"))
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    report = {
        "status": "RUNNING", "checks": [], "pageErrors": [], "consoleWarningsAndErrors": [],
        "failedRequests": [], "checkoutSourceSha256": {}, "sourceSha256": {},
        "testScriptSha256": sha256(pathlib.Path(__file__).read_bytes()),
        "scope": {"nativeMenu": "Real index -> number zone -> Number Kingdom card clicks at both sizes",
                  "scenarios": "Debug API drives controlled world setup/taps; real pose cards change rendered geometry",
                  "renderer": "Chromium WebGL using SwiftShader; 2D fallback is a failure",
                  "notRun": ["physical touch", "audible TTS", "child observation"]},
        "launchArgs": WEBGL_ARGS,
    }
    server = None
    try:
        report["checkoutSourceSha256"] = {name: sha256((ROOT / name).read_bytes()) for name in SOURCE_PATHS}
        if args.base_url:
            base = normalized_base(args.base_url)
        else:
            handler = functools.partial(QuietServer, directory=str(ROOT))
            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = f"http://127.0.0.1:{server.server_port}/"
        report["baseUrl"] = base
        cases = [
            {"name": "equal-four", "kind": "equal", "a": (4, "tall"), "b": (4, "rect2")},
            {"name": "equal-eight", "kind": "equal", "a": (8, "tall"), "b": (8, "bridge")},
            {"name": "equal-twelve", "kind": "equal", "a": (12, "ten"), "b": (12, "rect3")},
            {"name": "eight-more-but-shorter", "kind": "different", "a": (8, "bridge"), "b": (5, "tall")},
            {"name": "hundred-more-but-shorter", "kind": "different", "a": (100, "double"), "b": (20, "ten")},
        ]
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=WEBGL_ARGS)
            report["browserVersion"] = browser.version
            for width, height in VIEWPORTS:
                size = f"{width}x{height}"
                context = browser.new_context(viewport={"width": width, "height": height},
                                              service_workers="block", reduced_motion="reduce")
                try:
                    page = context.new_page()
                    page.set_default_timeout(15000)
                    responses = []
                    page.on("response", lambda response, target=responses: target.append(response))
                    page.on("pageerror", lambda error, s=size: report["pageErrors"].append(
                        {"viewport": s, "error": str(error)}))
                    page.on("requestfailed", lambda request, s=size: report["failedRequests"].append(
                        {"viewport": s, "url": request.url, "failure": request.failure}))
                    def on_console(message, s=size):
                        if message.type in ("warning", "error"):
                            report["consoleWarningsAndErrors"].append({"viewport": s, "type": message.type,
                                                                       "text": message.text})
                    page.on("console", on_console)
                    entry = record(report, f"public menu entry {size}", "NATIVE_MENU",
                                   lambda: native_entry(page, base, output, size, responses, report))
                    if entry["status"] != "PASS":
                        try:
                            page.screenshot(path=str(output / f"number-entry-failure-{size}.png"))
                        except Exception:
                            pass
                        report["checks"].append({"name": f"game scenarios {size}", "kind": "DEBUG_SCENARIO",
                                                 "status": "NOT_RUN", "reason": "WebGL/native entry prerequisite failed"})
                        continue
                    frame = page.locator("#numberKingdomFrame").element_handle().content_frame()
                    for spec in cases:
                        record(report, f"{spec['name']} {size}", "DEBUG_SCENARIO",
                               lambda spec=spec: comparison_case(page, frame, output, size, spec))
                    record(report, f"one block ten taps {size}", "DEBUG_SCENARIO",
                           lambda: tap_count_case(page, frame, output, size))
                finally:
                    context.close()
            browser.close()
    except Exception as exc:
        report["checks"].append({"name": "browser/server setup or execution", "kind": "ENVIRONMENT",
                                 "status": "FAIL", "error": str(exc), "trace": traceback.format_exc()})
    finally:
        if server:
            server.shutdown()
            server.server_close()
        self_test_errors = [item for item in report["consoleWarningsAndErrors"]
                            if "self-test failed" in item["text"]]
        report["status"] = "PASS" if (report["checks"]
            and all(row["status"] == "PASS" for row in report["checks"])
            and not report["pageErrors"] and not self_test_errors) else "FAIL"
        report["startupSelfTestErrors"] = self_test_errors
        (output / "number-browser.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                                                    encoding="utf-8")
        print("NUMBER_BROWSER " + report["status"], flush=True)
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
