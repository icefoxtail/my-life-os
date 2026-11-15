"""Exercise the real flower-garden UI in Chromium and save source-bound evidence.

Only speechSynthesis.speak/cancel are a 25 ms completion fixture. The application's
SihyeonVoice, quantity sequencer, model, render code, and persistence stay intact.
This is DOM/input/speech-request QA, not audible TTS or physical-device testing.
Run in the existing GitHub Actions Chromium job; this script never uses force
clicks, invokes a game's render function, or asks the app model for expected counts.
"""

import argparse
from collections import Counter
import datetime
import functools
import hashlib
import http.server
import json
import pathlib
import re
import subprocess
import threading
import traceback
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
CARD = '.zone-game-card[onclick="openTenFrameGardenGame()"]'
VIEWPORTS = [(320, 568), (568, 320), (390, 844), (844, 390),
             (768, 1024), (1024, 768)]
NATIVE = ["영", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉",
          "열", "열하나", "열둘", "열셋", "열넷", "열다섯", "열여섯", "열일곱",
          "열여덟", "열아홉", "스물", "스물하나", "스물둘", "스물셋", "스물넷",
          "스물다섯", "스물여섯", "스물일곱", "스물여덟", "스물아홉", "서른"]
SINO = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십", "십일",
        "십이", "십삼", "십사", "십오", "십육", "십칠", "십팔", "십구", "이십",
        "이십일", "이십이", "이십삼", "이십사", "이십오", "이십육", "이십칠",
        "이십팔", "이십구", "삼십"]
ENGLISH = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
           "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
           "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one",
           "twenty-two", "twenty-three", "twenty-four", "twenty-five", "twenty-six",
           "twenty-seven", "twenty-eight", "twenty-nine", "thirty"]
COUNT_WORDS = set(NATIVE + SINO + ENGLISH)
SOURCE_PATHS = ["index.html", "sw.js", "js/play-settings.js", "js/voice-engine.js",
                "js/quantity-sequencer.js", "js/games/quantity-play-model.js",
                "js/games/ten-frame-garden.js", "css/games/ten-frame-garden.css",
                "assets/games/ten-frame-garden/card.svg",
                "scripts/qa-ten-frame-garden-browser.py"]
CRITICAL_ASSETS = tuple("/" + name for name in SOURCE_PATHS
                        if name.startswith(("js/", "css/", "assets/")))


SPEECH_FIXTURE = r"""
(() => {
  const synth = window.speechSynthesis;
  const rows = [];
  const cancelled = [];
  let active = null;
  let serial = 0;
  function box(element) {
    const r = element.getBoundingClientRect();
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
  }
  function dom() {
    const root = document.querySelector('.tfg-app');
    if (!root) return {garden: false};
    const slots = [...root.querySelectorAll('.tfg-slot')];
    const board = root.querySelector('.tfg-frames');
    const boardRect = board.getBoundingClientRect();
    const activeSlot = slots.find(s => s.dataset.active === 'true');
    return {
      garden: true,
      mode: root.dataset.mode,
      chosen: Number(root.querySelector('.tfg-quantity-button strong')?.textContent),
      counter: root.querySelector('[data-count-value]')?.textContent?.trim(),
      word: root.querySelector('[data-count-word]')?.textContent?.trim(),
      goal: root.querySelector('.tfg-goal strong')?.textContent?.trim(),
      filled: slots.filter(s => s.querySelector(':scope > svg.tfg-flower'))
                   .map(s => Number(s.dataset.slot)),
      active: slots.filter(s => s.dataset.active === 'true')
                   .map(s => Number(s.dataset.slot)),
      boardViewport: {left:boardRect.left + board.clientLeft, top:boardRect.top + board.clientTop,
        right:boardRect.left + board.clientLeft + board.clientWidth,
        bottom:boardRect.top + board.clientTop + board.clientHeight,
        width:board.clientWidth, height:board.clientHeight},
      activeSlot: activeSlot ? box(activeSlot) : null,
      activeFrame: activeSlot ? box(activeSlot.closest('.tfg-frame')) : null
    };
  }
  function record(kind, extra) {
    rows.push({kind, time: performance.now(), ...extra, dom: dom()});
  }
  function finish(entry) {
    if (!entry || active !== entry) return false;
    active = null;
    record('end', {id: entry.id, text: entry.utterance.text});
    entry.utterance.onend?.({type: 'end', elapsedTime: 0.025});
    return true;
  }
  const probe = window.__gardenProbe = {
    fixture: 'native speechSynthesis boundary; completion after 25 ms',
    rows, hold: false,
    finishActive: () => finish(active),
    fireCancelled: () => {
      const pending = cancelled.splice(0);
      for (const entry of pending) {
        record('late-cancelled-end', {id: entry.id, text: entry.utterance.text});
        entry.utterance.onend?.({type: 'end', elapsedTime: 0.025});
      }
      return pending.length;
    },
    activeId: () => active?.id ?? null
  };
  synth.speak = utterance => {
    const entry = {id: ++serial, utterance};
    active = entry;
    record('speak', {id: entry.id, text: utterance.text, lang: utterance.lang});
    utterance.onstart?.({type: 'start', elapsedTime: 0});
    setTimeout(() => { if (!probe.hold) finish(entry); }, 25);
  };
  synth.cancel = () => {
    record('cancel', {id: active?.id ?? null, text: active?.utterance.text ?? null});
    if (active) cancelled.push(active);
    active = null;
  };
})();
"""


DOM_READ = r"""
() => {
  const root = document.querySelector('.tfg-app');
  if (!root) return null;
  const numbers = element => (element?.textContent?.match(/\d+/g) || []).map(Number);
  const slots = [...root.querySelectorAll('.tfg-slot')].map(slot => {
    const svg = slot.querySelector(':scope > svg.tfg-flower');
    return {ordinal: Number(slot.dataset.slot), drawn: !!svg,
      declaredFilled: slot.dataset.filled, active: slot.dataset.active === 'true',
      color: svg?.querySelector('g[fill]')?.getAttribute('fill') ?? null};
  });
  return {
    mode: root.dataset.mode, phase: root.dataset.phase,
    chosen: Number(root.querySelector('.tfg-quantity-button strong')?.textContent),
    goalNumbers: numbers(root.querySelector('.tfg-goal strong')),
    equationNumbers: numbers(root.querySelector('.tfg-equation')),
    counter: root.querySelector('[data-count-value]')?.textContent?.trim(),
    flower: root.querySelector('[data-action="flower"][aria-pressed="true"]')?.dataset.value,
    reading: root.querySelector('[data-action="reading"][aria-pressed="true"]')?.dataset.value,
    palette: Object.fromEntries([...root.querySelectorAll('[data-action="flower"]')]
      .map(button => [button.dataset.value, button.querySelector('svg g[fill]')?.getAttribute('fill')])),
    split: [...root.querySelectorAll('.tfg-split-controls > div > strong')]
      .map(element => Number(element.textContent)),
    slots,
    frames: [...root.querySelectorAll('.tfg-frame')].map(frame => ({
      slots: frame.querySelectorAll('.tfg-slot').length,
      actual: frame.querySelectorAll('.tfg-slot > svg.tfg-flower').length,
      label: Number(frame.querySelector('.tfg-frame-heading strong')?.textContent)
    }))
  };
}
"""


LAYOUT_READ = r"""
() => {
  const root = document.querySelector('.tfg-app');
  const box = el => {
    const b = el.getBoundingClientRect();
    return {left: b.left, top: b.top, right: b.right, bottom: b.bottom,
      width: b.width, height: b.height, clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth, clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight, clientLeft: el.clientLeft, clientTop: el.clientTop,
      scrollLeft: el.scrollLeft, scrollTop: el.scrollTop};
  };
  const artBox = svg => {
    const b = svg.getBBox(), m = svg.getScreenCTM();
    if (!m) return {width: 0, height: 0};
    const p = [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],
               [b.x+b.width,b.y+b.height]].map(([x,y]) => new DOMPoint(x,y).matrixTransform(m));
    const left = Math.min(...p.map(v=>v.x)), right = Math.max(...p.map(v=>v.x));
    const top = Math.min(...p.map(v=>v.y)), bottom = Math.max(...p.map(v=>v.y));
    return {left,top,right,bottom,width:right-left,height:bottom-top};
  };
  const board = root.querySelector('.tfg-frames'), boardRect = board.getBoundingClientRect();
  const focused = root.querySelector('.tfg-slot[data-active="true"]') ||
    (root.dataset.phase === 'complete' ? root.querySelector('[data-slot="' +
      root.querySelector('[data-count-value]')?.textContent?.trim() + '"]') : null);
  return {
    viewport: {width: innerWidth, height: innerHeight},
    documentWidth: document.documentElement.scrollWidth,
    app: box(root), stage: box(root.querySelector('.tfg-stage')),
    controls: box(root.querySelector('.tfg-controls')),
    frames: box(board),
    boardViewport: {left:boardRect.left + board.clientLeft, top:boardRect.top + board.clientTop,
      right:boardRect.left + board.clientLeft + board.clientWidth,
      bottom:boardRect.top + board.clientTop + board.clientHeight,
      width:board.clientWidth, height:board.clientHeight},
    focusedOrdinal: focused ? Number(focused.dataset.slot) : null,
    focusedSlot: focused ? box(focused) : null,
    focusedFrame: focused ? box(focused.closest('.tfg-frame')) : null,
    drawings: [...root.querySelectorAll('.tfg-slot > svg.tfg-flower')]
      .map(svg => ({ordinal: Number(svg.parentElement.dataset.slot), ...artBox(svg)})),
    brokenImages: [...root.querySelectorAll('img')]
      .filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src),
    buttons: [...root.querySelectorAll('button:not([disabled])')].map(button => ({
      action: button.dataset.action, value: button.dataset.value, ...box(button)
    }))
  };
}
"""


class QuietServer(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def snapshot(page):
    return page.evaluate("window.SihyeonGames?.tenFrameGarden?.getSnapshot?.() ?? null")


def dom(page):
    return page.evaluate(DOM_READ)


def mark(page):
    return page.evaluate("window.__gardenProbe.rows.length")


def speech_rows(page, after=0):
    return page.evaluate("i => window.__gardenProbe.rows.slice(i)", after)


def button(page, action, value=None):
    selector = f'.tfg-app button[data-action="{action}"]'
    if value is not None:
        selector += f'[data-value="{value}"]'
    return page.locator(selector)


def choose_number(page, n):
    # Deliberately use the same visible controls as a child. No model dispatches.
    quick = page.locator(f'.tfg-quick-numbers button[data-value="{n}"]')
    if quick.count() and quick.is_visible():
        quick.click()
    else:
        button(page, "number-picker").click()
        page.locator(f'.tfg-number-grid button[data-value="{n}"]').click()


def assert_board(page, chosen, actual=None, target=None):
    actual = chosen if actual is None else actual
    target = chosen if target is None else target
    value = dom(page)
    assert value is not None, "Garden DOM is absent"
    assert value["chosen"] == chosen, value
    expected_capacity = max(10, ((target + 9) // 10) * 10)
    slots = value["slots"]
    assert len(slots) == expected_capacity, (len(slots), expected_capacity)
    assert [slot["ordinal"] for slot in slots] == list(range(1, expected_capacity + 1)), slots
    drawn = [slot for slot in slots if slot["drawn"]]
    assert len(drawn) == actual, {"expectedActualSvg": actual, "DOM": value}
    assert [slot["ordinal"] for slot in drawn] == list(range(1, actual + 1)), drawn
    assert all(slot["declaredFilled"] == str(slot["drawn"]).lower() for slot in slots), slots
    assert all(frame["slots"] == 10 for frame in value["frames"]), value["frames"]
    expected_groups = [max(0, min(10, actual - start))
                       for start in range(0, expected_capacity, 10)]
    assert [frame["actual"] for frame in value["frames"]] == expected_groups, value
    assert [frame["label"] for frame in value["frames"]] == expected_groups, value
    expected_goals = [chosen, target] if value["mode"] == "fill" else [chosen]
    assert value["goalNumbers"] == expected_goals, value["goalNumbers"]
    # Snapshot is supplementary evidence; it cannot substitute for the SVG count.
    state = snapshot(page)
    assert state and state["state"]["quantity"] == chosen, state
    assert state["state"]["goal"] == target, state
    assert state["state"]["count"] == actual, state
    assert state["quantities"]["visible"] == actual, state
    if value["mode"] == "colors":
        assert len(value["split"]) == 2 and sum(value["split"]) == chosen, value
        assert value["equationNumbers"] == value["split"] + [chosen], value
    else:
        terms = value["equationNumbers"]
        assert terms and terms[-1] == actual and sum(terms[:-1]) == actual, terms
    return value


def complete(page, chosen, actual=None, target=None):
    page.wait_for_function("""() => {
      const root = document.querySelector('.tfg-app');
      const state = window.SihyeonGames?.tenFrameGarden?.getSnapshot?.();
      return root?.dataset.phase === 'complete' && state && !state.running;
    }""", timeout=20000)
    value = assert_board(page, chosen, actual, target)
    assert not any(slot["active"] for slot in value["slots"]), value
    assert snapshot(page)["sequence"]["status"] == "completed", snapshot(page)
    return value


def assert_inside(rect, viewport, label):
    assert rect and rect["width"] > 0 and rect["height"] > 0, (label, rect)
    assert rect["left"] >= viewport["left"] - 2 and rect["right"] <= viewport["right"] + 2, (label, rect, viewport)
    assert rect["top"] >= viewport["top"] - 2 and rect["bottom"] <= viewport["bottom"] + 2, (label, rect, viewport)


def assert_current_visible(observed):
    viewport = observed["boardViewport"]
    slot = observed.get("activeSlot", observed.get("focusedSlot"))
    frame = observed.get("activeFrame", observed.get("focusedFrame"))
    assert_inside(slot, viewport, "Current flower must be inside the board's scroll viewport")
    if frame["width"] <= viewport["width"] - 4 and frame["height"] <= viewport["height"] - 4:
        assert_inside(frame, viewport, "The current ten-frame must be visible when it fits")


def assert_automatic_speech(page, after, ordinals, chosen, style="native", fill=False):
    words = {"native": NATIVE, "sino": SINO, "en": ENGLISH}[style]
    locale = "en-US" if style == "en" else "ko-KR"
    rows = [row for row in speech_rows(page, after)
            if row["kind"] == "speak" and row["dom"]["garden"]]
    counts = [row for row in rows if row["text"] in COUNT_WORDS]
    expected = [words[n] for n in ordinals]
    assert [row["text"] for row in counts] == expected, {"expected": expected, "spoken": rows}
    for ordinal, row in zip(ordinals, counts):
        observed = row["dom"]
        assert row["lang"] == locale, row
        assert observed["chosen"] == chosen, row
        assert observed["active"] == [ordinal], row
        assert observed["counter"] == str(ordinal), row
        assert_current_visible(observed)
        visible = max(chosen, ordinal) if fill else chosen
        assert observed["filled"] == list(range(1, visible + 1)), row
    assert rows, "No request reached the real shared Voice → speechSynthesis boundary"
    return {"expectedOrdinals": list(ordinals), "observedWords": [r["text"] for r in counts],
            "lastSpeech": rows[-1]["text"], "locale": locale,
            "domAndSpeechSynchronized": True}


def open_card(page):
    card = page.locator(CARD)
    expect(card).to_be_visible(timeout=15000)
    image = card.locator("img")
    assert image.count() == 1, "The native flower-garden card must show its SVG asset"
    page.wait_for_function("""selector => {
      const img = document.querySelector(selector)?.querySelector('img');
      return img && img.complete && img.naturalWidth > 0;
    }""", arg=CARD, timeout=10000)
    src = image.get_attribute("src")
    assert "ten-frame-garden/" in src, src
    card.click()
    expect(page.locator(".tfg-app")).to_be_visible(timeout=15000)
    assert page.locator(".tfg-load-error").count() == 0
    page.evaluate("""() => {
      const p = window.__gardenProbe;
      p.voiceAtEntry = window.SihyeonVoice;
      p.sequencerAtEntry = window.SihyeonQuantitySequencer;
    }""")
    return src


def enter(page, url):
    page.goto(url, wait_until="load")
    page.locator('[data-home-age="4"]').click()
    page.locator('.world-zone[onclick="travelToZone(\'numbers\')"]').click()
    return open_card(page)


def set_split(page, target):
    initial = dom(page)["split"]
    assert len(initial) == 2, initial
    action = "split-more" if target > initial[0] else "split-less"
    for _ in range(abs(target - initial[0])):
        button(page, action).click()
    value = dom(page)
    assert value["split"][0] == target, value
    return value


def assert_colors(page, total, first, first_color="yellow", second_color="pink"):
    value = assert_board(page, total)
    assert value["split"] == [first, total - first], value
    assert value["palette"][first_color] != value["palette"][second_color], value["palette"]
    colors = Counter(slot["color"] for slot in value["slots"] if slot["drawn"])
    expected = Counter()
    if first:
        expected[value["palette"][first_color]] = first
    if total - first:
        expected[value["palette"][second_color]] = total - first
    assert colors == expected, {"actualSvgColors": dict(colors), "expected": dict(expected)}
    return {"total": total, "split": value["split"], "drawnColors": dict(colors)}


def inspect_layout(page, width, height):
    value = page.evaluate(LAYOUT_READ)
    assert value["documentWidth"] <= width + 2, value
    assert not value["brokenImages"], value["brokenImages"]
    for name in ("app", "stage", "controls", "frames"):
        rect = value[name]
        assert rect["width"] > 0 and rect["height"] > 0, (name, rect)
        assert rect["left"] >= -2 and rect["top"] >= -2, (name, rect)
        assert rect["right"] <= width + 2 and rect["bottom"] <= height + 2, (name, rect)
        if name != "frames":
            assert rect["scrollWidth"] <= rect["clientWidth"] + 2, (name, rect)
    assert value["app"]["scrollHeight"] <= value["app"]["clientHeight"] + 2, value["app"]
    if width > height:
        assert value["controls"]["left"] >= value["stage"]["right"] - 2, value
    else:
        assert value["controls"]["top"] >= value["stage"]["bottom"] - 2, value
    # Other ten-frames may be offscreen inside this deliberate scroll container.
    # All N flowers must stay in the DOM at a real drawing size; the active frame
    # must follow the count. The app/stage/controls themselves may not overflow.
    for art in value["drawings"]:
        assert art["width"] >= 24 and art["height"] >= 24, (
            "The actual flower drawing must be at least 24 CSS px on both axes", art)
    if value["drawings"]:
        assert value["focusedOrdinal"] is not None, "No current/final flower is available to inspect"
        assert_current_visible(value)
        focused_art = next(a for a in value["drawings"] if a["ordinal"] == value["focusedOrdinal"])
        assert_inside(focused_art, value["boardViewport"], "Current flower drawing is clipped")
    value["minimumDrawingWidth"] = min((a["width"] for a in value["drawings"]), default=None)
    value["minimumDrawingHeight"] = min((a["height"] for a in value["drawings"]), default=None)
    return value


def normal_fifteen(page, url, output):
    card_src = enter(page, url)
    start = mark(page)
    choose_number(page, 15)
    immediate = assert_board(page, 15)
    complete(page, 15)
    spoken = assert_automatic_speech(page, start, range(1, 16), 15)
    page.screenshot(path=str(output / "normal-15.png"))
    return {"nativeCard": card_src, "immediateDrawn": sum(s["drawn"] for s in immediate["slots"]),
            "speech": spoken, "snapshot": snapshot(page)}


def boundaries(page, url, output):
    enter(page, url)
    results = []
    for n in (0, 30):
        start = mark(page)
        choose_number(page, n)
        assert_board(page, n)
        complete(page, n)
        spoken = assert_automatic_speech(page, start, range(1, n + 1), n)
        page.screenshot(path=str(output / f"normal-{n}.png"))
        results.append({"quantity": n, "speech": spoken})
    return results


def fill_to_ten(page, url, output):
    enter(page, url)
    results = []
    for n, target in ((15, 20), (0, 10), (30, 30)):
        button(page, "mode", "number").click()
        choose_number(page, n)
        # Hold only the browser speech boundary so a busy CI worker can inspect
        # the starting amount before the first added flower. No app clock changes.
        page.evaluate("window.__gardenProbe.hold = true")
        start = mark(page)
        button(page, "mode", "fill").click()
        # The initial existing flowers must remain N; the target is displayed separately.
        initial = assert_board(page, n, actual=n, target=target)
        page.evaluate("window.__gardenProbe.hold = false; window.__gardenProbe.finishActive()")
        complete(page, n, actual=target, target=target)
        spoken = assert_automatic_speech(page, start, range(n + 1, target + 1), n, fill=True)
        page.screenshot(path=str(output / f"fill-{n}-to-{target}.png"))
        results.append({"chosen": n, "target": target, "initialGoal": initial["goalNumbers"],
                        "finalDrawn": len([s for s in dom(page)["slots"] if s["drawn"]]),
                        "speech": spoken})
    return results


def two_colors(page, url, output):
    enter(page, url)
    button(page, "mode", "colors").click()
    button(page, "flower", "yellow").click()
    results = []
    for n in (0, 15, 30):
        choose_number(page, n)
        for split in sorted({0, (n + 1) // 2, n}):
            set_split(page, split)
            actual = assert_colors(page, n, split)
            complete(page, n)
            assert_colors(page, n, split)
            results.append(actual)
        page.screenshot(path=str(output / f"two-colors-{n}.png"))
    return {"allTotalsPreserved": True, "independentlyCountedColors": results}


def selection_cancellation(page, url, output):
    enter(page, url)
    page.evaluate("window.__gardenProbe.hold = true")
    choose_number(page, 30)
    page.wait_for_function("window.__gardenProbe.activeId() !== null")
    old = snapshot(page)["sequence"]["runId"]
    start = mark(page)
    choose_number(page, 9)
    assert_board(page, 9)
    page.wait_for_function("window.__gardenProbe.activeId() !== null")
    before_late = mark(page)
    fired = page.evaluate("window.__gardenProbe.fireCancelled()")
    assert fired > 0, "No cancelled speech callback was exercised"
    page.wait_for_timeout(180)
    value = assert_board(page, 9)
    assert value["counter"] == "1", value
    assert not [row for row in speech_rows(page, before_late) if row["kind"] == "speak"], \
        speech_rows(page, before_late)
    rows = speech_rows(page, start)
    assert any(row["kind"] == "cancel" and row.get("text") for row in rows), rows
    assert snapshot(page)["sequence"]["runId"] != old
    page.evaluate("window.__gardenProbe.hold = false; window.__gardenProbe.finishActive()")
    complete(page, 9)
    spoken = assert_automatic_speech(page, start, range(1, 10), 9)
    page.screenshot(path=str(output / "replacement-30-to-9.png"))
    return {"cancelledCallbacksDeliveredLate": fired, "replacement": 9, "speech": spoken}


def settings_close_and_ages(page, url, output):
    enter(page, url)
    page.evaluate("window.__gardenProbe.hold = true")
    choose_number(page, 15)
    page.wait_for_function("window.__gardenProbe.activeId() !== null")
    button(page, "settings").click()
    expect(page.locator(".tfg-settings-dialog")).to_be_visible()
    assert snapshot(page)["running"] is False, snapshot(page)
    paused_mark = mark(page)
    page.evaluate("window.__gardenProbe.fireCancelled()")
    page.wait_for_timeout(180)
    assert not [r for r in speech_rows(page, paused_mark) if r["kind"] == "speak"], \
        speech_rows(page, paused_mark)
    start = mark(page)
    page.locator('.tfg-dialog-done[data-action="close-modal"]').click()
    expect(page.locator(".tfg-modal")).to_have_count(0)
    page.wait_for_function("window.__gardenProbe.activeId() !== null")
    assert_board(page, 15)
    page.evaluate("window.__gardenProbe.hold = false; window.__gardenProbe.finishActive()")
    complete(page, 15)
    resumed = assert_automatic_speech(page, start, range(1, 16), 15)
    observed_ages = []
    for age in (4, 5, 6, 7):
        button(page, "settings").click()
        button(page, "age", age).click()
        assert_board(page, 15)
        assert page.locator(".tfg-age-button b").inner_text() == str(age)
        assert snapshot(page)["age"] == age
        observed_ages.append(age)
    complete(page, 15)
    page.screenshot(path=str(output / "settings-resumed-age-7.png"))
    return {"closedWithoutChangeAndResumed": resumed, "actualAgeSelections": observed_ages,
            "quantityNeverLockedOrChanged": 15}


def reading_and_english(page, url, output):
    enter(page, url)
    choose_number(page, 9)
    start = mark(page)
    button(page, "reading", "sino").click()
    complete(page, 9)
    sino = assert_automatic_speech(page, start, range(1, 10), 9, style="sino")
    button(page, "settings").click()
    start = mark(page)
    button(page, "language", "en").click()
    complete(page, 9)
    english = assert_automatic_speech(page, start, range(1, 10), 9, style="en")
    garden_speech = [r for r in speech_rows(page, start)
                     if r["kind"] == "speak" and r["dom"]["garden"]]
    assert all(r["lang"] == "en-US" and not re.search("[가-힣]", r["text"])
               for r in garden_speech), garden_speech
    assert snapshot(page)["language"] == "en"
    page.screenshot(path=str(output / "english-nine.png"))
    return {"sino": sino, "english": english, "quantityUnchanged": 9}


def home_and_reload(page, url, output):
    enter(page, url)
    button(page, "mode", "colors").click()
    choose_number(page, 15)
    button(page, "flower", "purple").click()
    button(page, "reading", "sino").click()
    set_split(page, 6)
    assert_colors(page, 15, 6, "purple", "yellow")
    page.evaluate("window.__gardenProbe.hold = true")
    button(page, "replay").click()
    page.wait_for_function("window.__gardenProbe.activeId() !== null")
    button(page, "home").click()
    expect(page.locator(CARD)).to_be_visible(timeout=15000)
    assert snapshot(page) is None, snapshot(page)
    start = mark(page)
    late = page.evaluate("window.__gardenProbe.fireCancelled()")
    assert late > 0, "Home cancellation did not exercise a pending speech callback"
    page.wait_for_timeout(180)
    assert page.locator(".tfg-app").count() == 0
    assert not [r for r in speech_rows(page, start)
                if r["kind"] == "speak" and r["dom"]["garden"]], speech_rows(page, start)
    page.evaluate("window.__gardenProbe.hold = false; window.__gardenProbe.finishActive()")
    open_card(page)
    assert_colors(page, 15, 6, "purple", "yellow")
    assert dom(page)["reading"] == "sino"
    complete(page, 15)
    restored_home = snapshot(page)
    page.reload(wait_until="load")
    page.locator('.world-zone[onclick="travelToZone(\'numbers\')"]').click()
    open_card(page)
    assert_colors(page, 15, 6, "purple", "yellow")
    assert dom(page)["reading"] == "sino"
    complete(page, 15)
    page.screenshot(path=str(output / "saved-garden-after-reload.png"))
    saved = page.evaluate("JSON.parse(localStorage.getItem('sihyeon-ten-frame-garden-v1'))")
    assert {key: saved[key] for key in ("quantity", "mode", "flower", "reading", "split")} == {
        "quantity": 15, "mode": "colors", "flower": "purple", "reading": "sino", "split": 6}, saved
    return {"lateCallbacksAfterHome": late, "homeRestore": restored_home,
            "reloadRestore": snapshot(page), "savedPreferences": saved}


def responsive(page, url, output, width, height):
    enter(page, url)
    observations = []
    layout_failures = []
    # Every viewport uses native flower, number, and mode clicks before measurement.
    button(page, "flower", "pink").click()
    for quantity, mode in ((15, "number"), (30, "number"), (30, "colors")):
        button(page, "mode", mode).click()
        choose_number(page, quantity)
        if mode == "colors":
            set_split(page, 15)
            assert_colors(page, 30, 15, "pink", "purple")
        else:
            value = assert_board(page, quantity)
            assert all(s["color"] == value["palette"]["pink"]
                       for s in value["slots"] if s["drawn"]), value
        page.wait_for_timeout(80)
        path = output / f"viewport-{width}x{height}-{mode}-{quantity}.png"
        page.screenshot(path=str(path))
        observed = {"quantity": quantity, "mode": mode, "screenshot": path.name}
        try:
            observed["measured"] = inspect_layout(page, width, height)
        except AssertionError as error:
            observed["measured"] = page.evaluate(LAYOUT_READ)
            observed["layoutFailure"] = str(error)
            layout_failures.append({"quantity": quantity, "mode": mode, "failure": str(error)})
        observations.append(observed)
    # Keep every requested screen even if an earlier variant exposes clipping.
    (output / f"viewport-{width}x{height}.json").write_text(
        json.dumps(observations, ensure_ascii=False, indent=2), encoding="utf-8")
    assert not layout_failures, layout_failures
    return {"viewport": [width, height], "actualSelections": observations}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", "--base-url", dest="base",
                        help="Optional application directory URL (or index.html URL).")
    parser.add_argument("--output", type=pathlib.Path,
                        default=pathlib.Path("qa-release-evidence/ten-frame-garden"))
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    report = {
        "status": "NOT_RUN", "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "scope": "Actual Chromium native menu/button clicks, SVG counts, layout and speech requests",
        "limitations": ["No audible TTS verification", "No physical phone or tablet verification",
                        "Screenshots require visual review; actual SVG drawing bounds must be at least 24 CSS px",
                        "Other ten-frames may be offscreen inside the board scroll container; active flowers must be visible",
                        "Application author wrote this test; integer/DOM/speech observations are independent of app-model expectations"],
        "fixture": {"boundary": "speechSynthesis.speak/cancel only", "normalCompletionMs": 25,
                    "sharedVoiceAndSequencerUnmodified": True,
                    "adversarialCases": "held utterance, cancellation, delayed cancelled onend"},
        "sources": {}, "checks": [], "pageErrors": [], "networkFailures": []
    }
    for name in SOURCE_PATHS:
        path = ROOT / name
        report["sources"][name] = hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None
    try:
        report["gitHead"] = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, timeout=5).strip()
    except Exception:
        report["gitHead"] = None
    server = None
    browser = None
    try:
        if args.base:
            url = args.base if urlparse(args.base).path.endswith(".html") else args.base.rstrip("/") + "/index.html"
        else:
            handler = functools.partial(QuietServer, directory=str(ROOT))
            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            url = f"http://127.0.0.1:{server.server_port}/index.html"
        report["baseUrl"] = url
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            report["browser"] = browser.version

            def run_case(name, function, viewport=(390, 844)):
                row = {"name": name, "viewport": list(viewport), "status": "RUNNING",
                       "pageErrors": [], "criticalAssetFailures": []}
                report["checks"].append(row)
                context = browser.new_context(
                    viewport={"width": viewport[0], "height": viewport[1]},
                    device_scale_factor=1, has_touch=True, is_mobile=True,
                    reduced_motion="reduce", service_workers="block")
                context.add_init_script(SPEECH_FIXTURE)
                page = context.new_page()
                page.set_default_timeout(10000)
                page.on("pageerror", lambda error: row["pageErrors"].append(str(error)))

                def request_failure(request):
                    entry = {"url": request.url, "error": request.failure, "case": name}
                    report["networkFailures"].append(entry)
                    if urlparse(request.url).path.endswith(CRITICAL_ASSETS):
                        row["criticalAssetFailures"].append(entry)

                def response_failure(response):
                    if response.status >= 400 and urlparse(response.url).path.endswith(CRITICAL_ASSETS):
                        row["criticalAssetFailures"].append({"url": response.url, "status": response.status})

                page.on("requestfailed", request_failure)
                page.on("response", response_failure)
                try:
                    row["observed"] = function(page, url, output)
                    assert not row["pageErrors"], row["pageErrors"]
                    assert not row["criticalAssetFailures"], row["criticalAssetFailures"]
                    unchanged = page.evaluate("""() => {
                      const p = window.__gardenProbe;
                      return p.voiceAtEntry === window.SihyeonVoice &&
                        p.sequencerAtEntry === window.SihyeonQuantitySequencer;
                    }""")
                    assert unchanged, "The shared Voice or sequencer was replaced during this test"
                    row["status"] = "PASS"
                except Exception:
                    row["status"] = "FAIL"
                    row["failure"] = traceback.format_exc()
                    try:
                        page.screenshot(path=str(output / f"FAIL-{name}.png"))
                        row["lastDom"] = dom(page)
                        row["lastSnapshot"] = snapshot(page)
                        if page.locator(".tfg-app").count():
                            row["lastLayout"] = page.evaluate(LAYOUT_READ)
                    except Exception as evidence_error:
                        row["evidenceError"] = str(evidence_error)
                finally:
                    try:
                        trace_path = output / f"trace-{name}.json"
                        trace_path.write_text(json.dumps(speech_rows(page), ensure_ascii=False, indent=2), encoding="utf-8")
                        row["speechTrace"] = trace_path.name
                    except Exception as trace_error:
                        row["traceError"] = str(trace_error)
                        row["status"] = "FAIL"
                    report["pageErrors"].extend({"case": name, "error": error} for error in row["pageErrors"])
                    context.close()
                    print("TEN_FRAME_GARDEN", name, row["status"], flush=True)

            for name, function in [
                ("native-menu-fifteen", normal_fifteen),
                ("zero-and-thirty", boundaries),
                ("fill-selected-to-target", fill_to_ten),
                ("two-colors-preserve-total", two_colors),
                ("replacement-cancels-late-callback", selection_cancellation),
                ("settings-resume-and-ages", settings_close_and_ages),
                ("sino-and-english", reading_and_english),
                ("home-and-reload", home_and_reload),
            ]:
                run_case(name, function)
            for width, height in VIEWPORTS:
                run_case(f"viewport-{width}x{height}",
                         lambda page, base, out, w=width, h=height: responsive(page, base, out, w, h),
                         (width, height))
            browser.close()
            browser = None
        report["status"] = "PASS" if report["checks"] and not report["pageErrors"] and all(
            row["status"] == "PASS" and not row["criticalAssetFailures"]
            for row in report["checks"]) else "FAIL"
    except Exception:
        report["status"] = "FAIL"
        report["infrastructureFailure"] = traceback.format_exc()
    finally:
        if server:
            server.shutdown()
            server.server_close()
        report_path = output / "ten-frame-garden-browser.json"
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print("TEN_FRAME_GARDEN_BROWSER", report["status"], str(report_path), flush=True)
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
