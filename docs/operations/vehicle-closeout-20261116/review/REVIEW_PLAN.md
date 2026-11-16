# Independent review gates

Reviewer: `/root/live_status`; baseline main: `833cc1ec5cd38728850957c47b33a6bb24c0ada3`.

These gates were defined from the existing main, approved image ledger, and original PR 5 failure logs before reading new implementation changes.

## Scope and source authority

- Use `docs/qa/release/VEHICLE_IMAGE_ONLY_RELEASE_20261109.json`: 76 approved current images, each bound to `resultSha256`.
- Baseline display metadata has 129 entries and 39 `clean` entries. Only submarine overlaps the approved 76, making the union 114. Approval, display fitting, and eligibility are separate concepts.
- Preserve current image bytes and current selectable vehicles. A rejected replacement candidate does not invalidate its preserved original. Do not import the four excluded replacement candidates.
- Confirm the candidate source commit and individual file hashes before and after each observation. Independent scripts do not edit product code.

## Vehicle display

1. Approved 76 bytes match the exact current ledger; all 138 manifest image paths decode; candidate image bytes remain current-main bytes.
2. Geometry uses current dimensions and visible alpha bounds, preserves aspect ratio, encloses visible edges with transparent safety padding, and preserves consistent baseline alignment. Opaque originals use safe full-image bounds.
3. Six consuming games retain their entry, selection, and original image fallback. Repeated normalization cannot nest frames. Error cleanup restores sibling relationships. The cancelled first parking ghost cannot change the second active ghost.
4. Inspect count, matching, parking, construction, fire dispatch, and coding at 390×844, 844×390, 640×360, 768×1024, 1024×768, and 1280×800. Check primary control bounds, usable hit targets, images, and document overflow. Coding currently has no public menu card: test its existing internal entry and label it as such.
5. Recheck the original concrete layout failures: parking 640×360; fire 640×360 and 768×1024; coding 844×390. Use existing required native-session gates for correct/wrong responses, completion, and replay. Do not broaden into unrelated new-game validation.

## Pixi vehicle builder

- Native mouse and emulated touch: wrong placement returns without credit, seven correct parts place once, dispatch completes, completion speech is requested once in the selected language.
- Drag continues beyond the original part bounds. A different pointer cannot end the active gesture. Cancellation restores a movable part.
- Exiting during animation and re-entering leaves no active old runtime, canvas, or subsequent uncaught error.
- Inspect desktop and phone screenshots. The existing hidden/internal entry remains explicitly distinguished from public navigation.

## Historical failure interpretation

Original PR 5 head `f35dec64c8b69aea8a6091f2b95d55d896776885`, Actions run `42488183999`, job `128754556435`: seven failures in the broader follow-up script. Four were layout overflow; one coding native click timed out on continuing animation; one garage test attempted a deliberately pointer-disabled tool; one post-office completion wait timed out. The dedicated vehicle decode, count matrix, parking, matching, construction, and dispatch checks passed then. These observations are historical evidence, not candidate PASS.

No physical-device touch, audible speaker output, or child usability claim is made by these automated checks.
