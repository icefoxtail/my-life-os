# Pattern train — release verification, 2026-11-08

## Verified scope

The existing twenty activities and product code were preserved; this resume added a reproducible native Chromium release harness and CI gate. No new subagent ran in this Chat environment. The earlier independently authored model/UI oracles were rerun unchanged, and their authorship is not attributed to this coordinator.

- Fixed branch: feat/sihyeon-pattern-train-20261108; PR #6.
- Product/test snapshot: 7cb936186cc513fd0c119577150b26ed750ffaea. The subsequent 2fd2ee1ca3961fac65e086dacc38caf98122a9bc only removes the temporary source-export workflow after successful recovery; product bytes are unchanged.
- Source recovery: all 1,134 tracked files in the initial recovered train snapshot matched the remote Git tree blob hashes; no mismatch. The baseline and vehicle snapshots were likewise verified.
- Existing Node commands: 14/14 exit 0, including author model 205 cases, independently authored model 29 groups / 1,645 assertions / 14,684 board verdicts, UI 15 groups / 314 assertions, prior-game input/storage/art restoration, display and service-worker checks.

## Actual Chromium evidence

GitHub Actions run: https://github.com/icefoxtail/my-life-os/actions/runs/42480903024
Browser: Chromium 143.0.7499.4, headless Linux, Playwright 1.57.0, Ubuntu 24.04.
Artifact: phase2-browser-42480903024, id 13617976066.
Downloaded ZIP SHA-256: d8af07d0324b5d27d379f7a7b3a244d3ce1af37ac42fb713575f1b508306ba6f.
The coordinator downloaded and read the JSON and screenshots, rather than inferring gameplay success from job status.

- Latest in-browser fixture: **24/24 PASS**. Four complete five-activity sessions; editing, wrong answers, swapping/removal/undo; synthetic Pointer Events including cancellation/outside drop/second-pointer hold; free creation and multiple interpretations; storage failures, reload restoration, speech failure; six viewport layouts; model-load failure escape.
- Native Playwright menu clicks: **4/4 age sessions PASS**. Home age selection -> number world -> train card -> assemble/select repeat unit -> start -> ARRIVED -> leave/re-enter -> reload -> restored ARRIVED board -> edit again. Exactly one departure per representative session.
- Screenshots: all four ages at 390x844, 844x390, 360x640, 768x1024, 1024x768 and 1280x800, plus four arrived states. The coordinator reviewed the four six-view contact sheets and enlarged the portrait age-4 and landscape age-6 views. Palette, guidance, start/home and horizontal train controls remain visible. Partial end carriages at a horizontal scroll edge are intentionally scrollable, not clipped immutable content.
- Real network aborts of model/UI/card: **3/3 PASS**. Missing code preserves a working home route; missing card art does not prevent inline-SVG gameplay.
- Existing game menu-entry checks: **8/8 PASS**, covering post office, counting, memory, drawing, parking, construction, garage and fire dispatch. This is entry/control/art smoke coverage, not eight full sessions. Existing behavior is additionally covered by the unchanged Node regression scripts and prior release evidence.
- Browser page errors: **0** in monitored train/fixture sessions.

## Source binding

| File | SHA-256 |
|---|---|
| index.html | 393a10840c46f770314003ba06fded203804555c774dcbf858b1277913c6b1c1 |
| sw.js | a11e5811dd1554cf78b75ae64f5e165ec43f47741a45433204fba2c4e8fa3e43 |
| js/games/pattern-train-model.js | aff31cb58d8ba2fae9d83e6596e71224aa355ee200d116136d7ebb021bd1c8a9 |
| js/games/pattern-train.js | 2c63c7dd7ae80f301786c3cfd04e0d24f9b13d7489fd6d87f77e2f0eb8ac60f1 |
| css/games/pattern-train.css | d21c7eb5b290c35a6369a37b0de62183f99c9aefd145326f3e3c3f39293716d3 |
| scripts/qa-pattern-train-browser.js | 198960506704c6f01535f82355d1c898efdd33825dbc7f12b40ee5d6aad442a4 |

## Limits, failures preserved and next gate

The first new CI run 42480784511 failed during browser installation because ubuntu-latest resolved to unsupported Ubuntu 26.04 for the pinned Playwright. No gameplay assertion ran in that attempt. Pinning Ubuntu 24.04 fixed the environment; no product test was weakened or ignored.

The local container could not navigate localhost because of browser administrator policy. The successful evidence above comes from a normal repository GitHub Actions runner, not a claim that local blocked navigation succeeded.

Physical Android/iOS, real multitouch, audible Korean TTS and child observation remain NOT_RUN. The current user permits engineering release with these limits stated; this document does not assert those tests passed or educational efficacy. Prior failures and 23-item evidence remain unchanged.

Engineering release gates above are verified. Remaining: refresh PR head/main and all checks, merge PR #6 without force, verify deployed source bytes, then repeat representative live menu/play/reload and failure recovery. Until that live gate, status is RELEASE_READY, not LIVE_VERIFIED.
