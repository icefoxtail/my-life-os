"""Native public-menu/button checks for Number Kingdom speech cancellation.

Spies call through to the real parent voice engine and native cancel methods.
The evidence is dispatch/cancellation requests, not audible silence. Queue and
late-callback behavior is covered by test-creator-number-mute.cjs.
"""
import argparse
import functools
import http.server
import importlib.util
import json
import pathlib
import threading
import traceback

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
COMMON_PATH = ROOT / "scripts/qa-creator-number-browser.py"
spec = importlib.util.spec_from_file_location("number_browser_common", COMMON_PATH)
common = importlib.util.module_from_spec(spec)
spec.loader.exec_module(common)
common.SOURCE_PATHS = (*common.SOURCE_PATHS, "js/voice-engine.js")


def install_request_spies(page, frame):
    page.evaluate("""() => {
      if (!window.SihyeonVoice?.stop || !window.SihyeonVoice?.speak)
        throw new Error('Actual parent voice engine unavailable');
      SihyeonVoice.stop();
      const probe = {engineStops: 0, nativeCancels: 0, speechRequests: []};
      const stop = SihyeonVoice.stop.bind(SihyeonVoice);
      const speak = SihyeonVoice.speak.bind(SihyeonVoice);
      const cancel = speechSynthesis.cancel.bind(speechSynthesis);
      SihyeonVoice.stop = (...args) => { probe.engineStops++; return stop(...args); };
      SihyeonVoice.speak = (text, options) => {
        probe.speechRequests.push({text, lang: options?.lang});
        return speak(text, options);
      };
      speechSynthesis.cancel = (...args) => { probe.nativeCancels++; return cancel(...args); };
      window.__numberMuteProbe = probe;
    }""")
    frame.evaluate("""() => {
      const probe = {nativeCancels: 0, sharedNativeObject: speechSynthesis === parent.speechSynthesis};
      const cancel = speechSynthesis.cancel.bind(speechSynthesis);
      speechSynthesis.cancel = (...args) => { probe.nativeCancels++; return cancel(...args); };
      window.__numberMuteProbe = probe;
    }""")


def snapshot(page, frame):
    return {"parent": page.evaluate("() => window.__numberMuteProbe"),
            "iframe": frame.evaluate("""() => ({...window.__numberMuteProbe,
              sound: NumberKingdomDebug.getState().sound,
              destroyed: NumberKingdomDebug.getState().destroyed,
              ariaPressed: document.querySelector('#sound').getAttribute('aria-pressed')})""")}


def native_mute(page, frame, output, size):
    common.webgl_runtime(frame)
    install_request_spies(page, frame)
    assert frame.locator("#sound").get_attribute("aria-pressed") == "true"
    frame.locator('#tray .toy[data-num="3"]').click()
    before = snapshot(page, frame)
    assert len(before["parent"]["speechRequests"]) == 1, before
    assert before["parent"]["speechRequests"][0]["text"] in ("셋", "three"), before
    frame.locator("#sound").click()
    muted = snapshot(page, frame)
    assert not muted["iframe"]["sound"] and muted["iframe"]["ariaPressed"] == "false", muted
    assert muted["parent"]["engineStops"] == before["parent"]["engineStops"] + 1, muted
    assert muted["parent"]["nativeCancels"] > before["parent"]["nativeCancels"], muted
    assert muted["iframe"]["nativeCancels"] > before["iframe"]["nativeCancels"], muted
    frame.locator('#tray .toy[data-num="4"]').click()
    during_mute = snapshot(page, frame)
    assert during_mute["parent"]["speechRequests"] == before["parent"]["speechRequests"], during_mute
    mute_image = f"number-mute-{size}.png"
    page.screenshot(path=str(output / mute_image))
    frame.locator("#sound").click()
    unmuted = snapshot(page, frame)
    assert unmuted["iframe"]["sound"] and unmuted["iframe"]["ariaPressed"] == "true", unmuted
    assert unmuted["parent"]["speechRequests"] == before["parent"]["speechRequests"], unmuted
    frame.locator('#tray .toy[data-num="5"]').click()
    new_action = snapshot(page, frame)
    assert len(new_action["parent"]["speechRequests"]) == 2, new_action
    assert new_action["parent"]["speechRequests"][-1]["text"] in ("다섯", "five"), new_action
    return {"driver": "Native number-tray and sound-button clicks; pass-through request spies",
            "beforeMute": before, "muted": muted, "mutedNewAction": during_mute,
            "unmuted": unmuted, "newAction": new_action, "screenshot": mute_image,
            "audibleVerification": "NOT_RUN"}


def mode_cleanup(page, frame, output, size):
    before = snapshot(page, frame)
    result = frame.evaluate("""() => {
      Sihyeon2DFallback.show('numbers');
      return {fallback: Boolean(document.querySelector('.s2d-root')),
        destroyed: NumberKingdomDebug.getState().destroyed,
        staleActionAccepted: NumberKingdomDebug.sayNumber(9)};
    }""")
    after = snapshot(page, frame)
    assert result == {"fallback": True, "destroyed": True, "staleActionAccepted": False}, result
    assert after["parent"]["engineStops"] > before["parent"]["engineStops"], after
    assert after["parent"]["nativeCancels"] > before["parent"]["nativeCancels"], after
    assert after["iframe"]["nativeCancels"] > before["iframe"]["nativeCancels"], after
    assert after["parent"]["speechRequests"] == before["parent"]["speechRequests"], after
    image = f"number-mode-cleanup-{size}.png"
    page.screenshot(path=str(output / image))
    return {"driver": "Existing companion show API triggers registered 3D disposal; no GPU failure simulation",
            "result": result, "before": before, "after": after, "screenshot": image,
            "audibleVerification": "NOT_RUN"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", help="Existing playground base URL or index.html URL")
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path("qa-creator-number-mute"))
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    report = {"status": "RUNNING", "checks": [], "pageErrors": [], "failedRequests": [],
              "consoleWarningsAndErrors": [], "sourceSha256": {},
              "checkoutSourceSha256": {name: common.sha256((ROOT / name).read_bytes())
                                       for name in common.SOURCE_PATHS},
              "testScriptSha256": common.sha256(pathlib.Path(__file__).read_bytes()),
              "testHelperSha256": common.sha256(COMMON_PATH.read_bytes()),
              "scope": {"entry": "Native public menu -> number zone -> Number Kingdom card",
                        "mute": "Native number and sound buttons; real parent voice engine with pass-through spies",
                        "mode": "Existing companion API invoked for controlled mode transition",
                        "notRun": ["audible TTS/silence", "physical device"],
                        "renderer": "Real Chromium WebGL; startup 2D fallback fails"}}
    server = None
    try:
        if args.base_url:
            base = common.normalized_base(args.base_url)
        else:
            handler = functools.partial(common.QuietServer, directory=str(ROOT))
            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = f"http://127.0.0.1:{server.server_port}/"
        report["baseUrl"] = base
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=common.WEBGL_ARGS)
            report["browserVersion"] = browser.version
            for width, height in common.VIEWPORTS:
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
                    def console_event(message, s=size):
                        if message.type in ("warning", "error"):
                            report["consoleWarningsAndErrors"].append(
                                {"viewport": s, "type": message.type, "text": message.text})
                    page.on("console", console_event)
                    entry = common.record(report, f"public menu {size}", "NATIVE_MENU",
                        lambda: common.native_entry(page, base, output, size, responses, report))
                    if entry["status"] != "PASS":
                        continue
                    frame = page.locator("#numberKingdomFrame").element_handle().content_frame()
                    mute = common.record(report, f"mute and unmute {size}", "NATIVE_UI_REQUEST_SPY",
                        lambda: native_mute(page, frame, output, size))
                    if mute["status"] == "PASS":
                        common.record(report, f"3D companion cleanup {size}", "EXISTING_API_REQUEST_SPY",
                            lambda: mode_cleanup(page, frame, output, size))
                finally:
                    context.close()
            browser.close()
    except Exception as exc:
        report["checks"].append({"name": "browser/server execution", "kind": "ENVIRONMENT",
                                 "status": "FAIL", "error": str(exc), "trace": traceback.format_exc()})
    finally:
        if server:
            server.shutdown()
            server.server_close()
        self_test_errors = [item for item in report["consoleWarningsAndErrors"]
                            if "self-test failed" in item["text"]]
        report["status"] = "PASS" if (len(report["checks"]) == 6
            and all(row["status"] == "PASS" for row in report["checks"])
            and not report["pageErrors"] and not self_test_errors) else "FAIL"
        report["startupSelfTestErrors"] = self_test_errors
        (output / "number-mute-browser.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("NUMBER_MUTE_BROWSER " + report["status"], flush=True)
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
