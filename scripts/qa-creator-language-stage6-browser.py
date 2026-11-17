#!/usr/bin/env python3
"""Stage6 language: native public menus, replay/next/match controls and 3D UI.

Voice spies call through to the real shared engine. The 3D card fixture uses the
existing OpenWorldDebug compose API (only for card geometry/pixels); the rest of
the actions are native clicks. No audible pronunciation or physical-device claim.
"""
from __future__ import annotations
import argparse
import functools
import hashlib
import http.server
import json
from pathlib import Path
import threading
import traceback
from urllib.parse import urljoin, urlsplit, urlunsplit
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = ((320, 568), (390, 844), (640, 360), (844, 390))
SOURCES = ('index.html', 'js/games/abc-phonics.js', 'games/hangul-playmat-3d.html', 'js/voice-engine.js')

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

def digest(data):
    return hashlib.sha256(data).hexdigest()

def normalize(value):
    parsed = urlsplit(value)
    assert parsed.scheme in ('http', 'https') and parsed.netloc, value
    path = parsed.path.removesuffix('index.html')
    return urlunsplit((parsed.scheme, parsed.netloc, path.rstrip('/') + '/', '', ''))

def evidence(responses, base):
    wanted = {urlsplit(urljoin(base, name)).path: name for name in SOURCES}
    result = {}
    for response in responses:
        name = wanted.get(urlsplit(response.url).path)
        if name:
            response.finished()
            served = digest(response.body())
            expected = digest((ROOT / name).read_bytes())
            assert response.status == 200 and served == expected, (name, response.status, served, expected)
            result[name] = {'url': response.url, 'status': response.status, 'servedSha256': served,
                            'checkoutSha256': expected, 'matches': True}
    assert set(result) == set(SOURCES), ('Missing actual browser responses', result)
    return result

def check_control(locator, viewport):
    expect(locator).to_be_visible()
    box = locator.bounding_box()
    assert box and box['width'] >= 44 and box['height'] >= 44, box
    assert box['x'] >= -1 and box['y'] >= -1, box
    assert box['x'] + box['width'] <= viewport['width'] + 1, box
    assert box['y'] + box['height'] <= viewport['height'] + 1, box
    assert locator.evaluate('''el => {
      const b=el.getBoundingClientRect(), hit=el.ownerDocument.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
      return hit===el || el.contains(hit);
    }'''), 'Control covered at native click point'
    return box

def voice_count(page):
    return page.evaluate('window.__stage6Voices.filter(x => x.kind !== "stop").length')

def open_abc(page):
    page.locator('.zone-game-card[onclick="openAbcPhonicsGame()"]').click()
    expect(page.locator('#ltMainCard')).to_be_visible()

def transform(page, word):
    page.locator('#ltMainCard').click()
    expect(page.locator('#ltWordLabel')).to_have_text(word)
    expect(page.locator('#ltHint')).to_have_attribute('aria-label', '다음 글자')
    expect(page.locator('#ltMainCard')).to_be_enabled()

def native_case(page, base, output, width, height, responses):
    size = f'{width}x{height}'
    page.goto(urljoin(base, 'index.html'), wait_until='domcontentloaded', timeout=60000)
    page.evaluate('''() => {
      window.__stage6Voices=[];
      for(const kind of ['speak','play','stop']) {
        const original=SihyeonVoice[kind];
        SihyeonVoice[kind]=function(...args) {
          window.__stage6Voices.push({kind,text:kind==='play'?args[1]:args[0],id:kind==='play'?args[0]:null});
          return original.apply(this,args);
        };
      }
    }''')
    page.locator('button.world-zone[onclick="travelToZone(\'letters\')"]').click()
    open_abc(page)
    page.wait_for_timeout(500)
    controls = {selector: check_control(page.locator(selector), page.viewport_size)
                for selector in ('#ltMainCard', '#ltSound', '#ltReplayPrompt', '#ltFind', '#ltHint')}
    # An explicit replay is safe before and after the reveal.
    page.locator('#ltReplayPrompt').click()
    transform(page, 'Apple')
    count = voice_count(page)
    page.locator('#ltMainCard').click()
    assert voice_count(page) == count + 1
    expect(page.locator('#ltWordLabel')).to_have_text('Apple')
    page.wait_for_timeout(1100)
    expect(page.locator('#ltWordLabel')).to_have_text('Apple')
    page.locator('#ltFind').click()
    expect(page.locator('[data-choice]')).to_have_count(3)
    choices = page.locator('[data-choice]').evaluate_all('els=>els.map(e=>e.dataset.choice)')
    assert len(set(choices)) == 3 and 'Apple' in choices, choices
    page.locator('[data-choice="Ball"]').click()
    expect(page.locator('#ltContext')).to_contain_text('Apple')
    page.locator('[data-choice="Apple"]').click()
    page.locator('[data-choice="Apple"]').click()
    expect(page.locator('#ltContext')).to_contain_text('맞아요')
    for choice in page.locator('[data-choice]').all():
        check_control(choice, page.viewport_size)
    page.screenshot(path=str(output / f'abc-match-{size}.png'))
    # Orientation changes preserve the same visible exercise and answer.
    rotated = {'width': 844, 'height': 390} if width < height else {'width': 390, 'height': 844}
    page.set_viewport_size(rotated)
    page.wait_for_timeout(250)
    expect(page.locator('#ltWordLabel')).to_have_text('Apple')
    expect(page.locator('#ltChoices')).to_be_visible()
    expect(page.locator('#ltContext')).to_contain_text('맞아요')
    check_control(page.locator('#ltHint'), page.viewport_size)
    page.set_viewport_size({'width': width, 'height': height})
    page.wait_for_timeout(250)
    page.locator('#ltSound').click()
    expect(page.locator('#ltSound')).to_have_attribute('aria-pressed', 'false')
    count = voice_count(page)
    page.locator('#ltReplayPrompt').click()
    assert voice_count(page) == count
    page.locator('#ltSound').click()
    expect(page.locator('#ltSound')).to_have_attribute('aria-pressed', 'true')
    page.locator('#ltReplayPrompt').click()
    assert voice_count(page) == count + 1
    # Progress only through the explicit Next control to a reachable completion.
    page.locator('#ltHint').click()
    expect(page.locator('#ltWordLabel')).to_have_text('B')
    transform(page, 'Ball')
    page.locator('#ltHint').click()
    expect(page.locator('#ltWordLabel')).to_have_text('C')
    transform(page, 'Car')
    page.locator('#ltHint').click()
    expect(page.locator('.lt-complete-title')).to_have_text('ABC 변신 완료!')
    completion = {selector: check_control(page.locator(selector), page.viewport_size)
                  for selector in ('#ltReplay', '#ltSwitch', '#ltToLand')}
    page.screenshot(path=str(output / f'abc-complete-{size}.png'))
    page.locator('#ltToLand').click()
    open_abc(page)
    page.locator('#ltMainCard').click()
    # A native mode switch interrupts the old reveal instead of leaking its result.
    page.locator('[data-mode="hangul"]').click()
    page.wait_for_timeout(1100)
    expect(page.locator('#ltWordLabel')).to_have_text('ㄱ')
    transform(page, '가방')
    expect(page.locator('#ltContext')).to_have_text('기역 + 아 → 가')
    page.locator('#ltHint').click()
    expect(page.locator('#ltWordLabel')).to_have_text('ㄴ')
    transform(page, '나비')
    page.locator('#ltHint').click()
    expect(page.locator('#ltWordLabel')).to_have_text('ㄷ')
    transform(page, '도토리')
    expect(page.locator('#ltFallbackObject svg')).to_be_visible()
    expect(page.locator('#ltContext')).to_have_text('디귿 + 오 → 도')
    page.locator('#ltFind').click()
    expect(page.locator('[data-choice="도토리"] svg')).to_be_visible()
    page.locator('[data-choice="도토리"]').click()
    page.screenshot(path=str(output / f'hangul-meaning-{size}.png'))
    page.locator('.game-back-floating').click()
    page.locator('.zone-game-card[onclick="openHangulPlaymat3DGame()"]').click()
    element = page.locator('#hangulPlaymatFrame')
    expect(element).to_be_visible()
    frame = element.element_handle().content_frame()
    frame.wait_for_function('Boolean(window.OpenWorldDebug && OpenWorldDebug.state.blocks.length)', timeout=45000)
    iframe_box = element.bounding_box()
    frame_viewport = {'width': iframe_box['width'], 'height': iframe_box['height']}
    hangul_controls = {selector: check_control(frame.locator(selector), page.viewport_size)
                       for selector in ('#homeBtn', '#undoBtn', '#clearBtn', '#replayBtn', '#soundBtn')}
    frame.get_by_role('button', name='ㄱ, 자음 이름 기역', exact=True).click()
    assert frame.evaluate('OpenWorldDebug.state.lastSpeech') == '자음 이름은 기역.'
    count = voice_count(page)
    frame.locator('#replayBtn').click()
    assert voice_count(page) == count + 1
    frame.locator('#soundBtn').click()
    expect(frame.locator('#soundBtn')).to_have_attribute('aria-pressed', 'false')
    count = voice_count(page)
    frame.locator('#replayBtn').click()
    assert voice_count(page) == count
    frame.locator('#soundBtn').click()
    expect(frame.locator('#soundBtn')).to_have_attribute('aria-pressed', 'true')
    frame.locator('#replayBtn').click()
    assert voice_count(page) == count + 1
    # Same existing composition fixture as stage1, for exact 3D card rendering.
    frame.evaluate('''() => {
      const api=OpenWorldDebug; api.resetInitialBlocks();
      const c=api.spawnFromTray('cho','ㄷ'),j=api.spawnFromTray('jung','ㅗ');
      api.mergeChoAndJung(c,j);
    }''')
    frame.wait_for_timeout(500)
    card = frame.evaluate('''() => {
      const t=OpenWorldDebug.state.toys.at(-1),picture=t?.mesh.userData.wordPicture;
      if(!picture) throw new Error('3D acorn picture unavailable');
      return {word:t.word,bounds:t.mesh.userData.pictureBounds,textureHeight:picture.material.map.image.height,
        textureFont:picture.material.map.image.getContext('2d').font};
    }''')
    assert card['word'] == '도토리' and '72px' in card['textureFont'], card
    assert card['bounds']['width'] > 0 and card['bounds']['height'] > 0, card
    if width == 844:
        assert card['bounds']['height'] * 72 / card['textureHeight'] >= 16, card
    assert frame.evaluate('OpenWorldDebug.state.lastSpeech') == '디귿, 오. 합치면 도. 도토리!'
    page.screenshot(path=str(output / f'hangul-card-{size}.png'))
    frame.locator('#homeBtn').click()
    expect(page.locator('.zone-game-card[onclick="openHangulPlaymat3DGame()"]')).to_be_visible()
    sources = evidence(responses, base)
    return {'controls': controls, 'completionControls': completion, 'hangulControls': hangul_controls,
            'iframeViewport': frame_viewport, 'meaningCard': card, 'sourceResponses': sources,
            'nativeFlows': ['object-replay-preserves-word', 'explicit-next-and-completion', 'wrong-right-picture-match',
                            'rotate-preserves-match', 'mute-and-replay', 'mode-switch-cancels-reveal',
                            'hangul-name-combination', 'semantic-acorn', '3D-name-replay-mute', '3D-public-home'],
            'voiceRequests': page.evaluate('window.__stage6Voices')}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url')
    parser.add_argument('--output', type=Path, default=Path('qa-creator-language-stage6'))
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    report = {'status': 'RUNNING', 'checks': [], 'pageErrors': [], 'failedRequests': [],
              'testScriptSha256': digest(Path(__file__).read_bytes()),
              'checkoutSourceSha256': {p: digest((ROOT / p).read_bytes()) for p in SOURCES},
              'scope': {'nativePublicMenus': True, '3DMeaningCardSetup': 'existing OpenWorldDebug compose API',
                        'voice': 'pass-through shared voice requests',
                        'notRun': ['physical touch', 'audible pronunciation', 'child observation']}}
    server = None
    try:
        if args.base_url:
            base = normalize(args.base_url)
        else:
            server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT)))
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = f'http://127.0.0.1:{server.server_port}/'
        report['baseUrl'] = base
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
            report['browserVersion'] = browser.version
            for width, height in VIEWPORTS:
                size = f'{width}x{height}'
                context = browser.new_context(viewport={'width': width, 'height': height}, service_workers='block')
                page = context.new_page()
                page.set_default_timeout(15000)
                responses = []
                page.on('response', lambda r, target=responses: target.append(r))
                page.on('pageerror', lambda e, tag=size: report['pageErrors'].append({'viewport': tag, 'error': str(e)}))
                page.on('requestfailed', lambda r, tag=size: report['failedRequests'].append({'viewport': tag, 'url': r.url, 'error': r.failure}))
                try:
                    detail = native_case(page, base, output, width, height, responses)
                    report['checks'].append({'viewport': size, 'status': 'PASS', 'detail': detail})
                except Exception as error:
                    report['checks'].append({'viewport': size, 'status': 'FAIL', 'error': str(error), 'trace': traceback.format_exc()})
                    page.screenshot(path=str(output / f'language-failure-{size}.png'))
                finally:
                    context.close()
            browser.close()
    except Exception as error:
        report['checks'].append({'status': 'FAIL', 'kind': 'ENVIRONMENT', 'error': str(error), 'trace': traceback.format_exc()})
    finally:
        if server:
            server.shutdown()
            server.server_close()
        report['status'] = 'PASS' if len(report['checks']) == len(VIEWPORTS) and all(c['status'] == 'PASS' for c in report['checks']) and not report['pageErrors'] else 'FAIL'
        (output / 'language-stage6-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print('LANGUAGE_STAGE6_BROWSER ' + report['status'], flush=True)
    return 0 if report['status'] == 'PASS' else 1

if __name__ == '__main__':
    raise SystemExit(main())
