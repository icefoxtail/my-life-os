"""Stage 6 language-of-care checks through the actual public menus.

Uses native clicks and pass-through speech/reward request probes. It does not
replace game state, response handlers, or timers. Reports served source hashes
and original screenshots. Audible speech and physical touch remain NOT_RUN.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import threading
import traceback
from urllib.parse import urljoin, urlsplit, urlunsplit

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = ('index.html', 'js/games/life-sequence.js', 'js/games/cat-care.js',
           'js/play-settings.js', 'js/voice-engine.js')
VIEWPORTS = ((320, 568), (390, 844), (640, 360), (844, 390), (768, 1024), (1024, 768))
MISSIONS = (
    ('손 씻기', ('water', 'soap', 'rinse', 'towel'), '비누'),
    ('양치하기', ('paste', 'brush', 'rinse'), '치약'),
    ('밥 먹기', ('sit', 'clean', 'eat'), '바꿔도'),
    ('잠자기', ('book', 'pajamas', 'light'), '달라도'),
    ('외출 준비', ('shoes', 'clothes', 'door'), '달라도'),
    ('장난감 정리', ('gather', 'basket', 'clean'), '바구니'),
)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def base_url(value):
    parsed = urlsplit(value)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc:
        raise ValueError('--base-url must be an HTTP(S) playground URL')
    path = parsed.path.removesuffix('index.html')
    return urlunsplit((parsed.scheme, parsed.netloc, path.rstrip('/') + '/', '', ''))


def evidence(responses, base):
    paths = {urlsplit(urljoin(base, file)).path: file for file in SOURCES}
    result = {}
    for response in responses:
        file = paths.get(urlsplit(response.url).path)
        if file:
            served = sha(response.body())
            expected = sha((ROOT / file).read_bytes())
            result[file] = {'url': response.url, 'status': response.status,
                            'servedSha256': served, 'checkoutSha256': expected,
                            'matchesCheckout': served == expected}
    assert set(result) == set(SOURCES), result
    assert all(item['status'] == 200 and item['matchesCheckout'] for item in result.values()), result
    return result


def hit_control(page, locator):
    expect(locator).to_be_visible()
    box = locator.bounding_box()
    viewport = page.viewport_size
    assert box and box['width'] >= 44 and box['height'] >= 44, box
    assert box['x'] >= -0.5 and box['y'] >= -0.5, box
    assert box['x'] + box['width'] <= viewport['width'] + 1, box
    assert box['y'] + box['height'] <= viewport['height'] + 1, box
    assert locator.evaluate('''el => {
      const b = el.getBoundingClientRect();
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return hit === el || el.contains(hit);
    }'''), 'Control is covered'
    return box


def readable(locator):
    expect(locator).to_be_visible()
    assert locator.evaluate('el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1'), 'Explanation is clipped'


def open_game(page, base, action):
    page.add_init_script('Math.random = () => 0.9999;')
    response = page.goto(urljoin(base, 'index.html'), wait_until='load', timeout=60000)
    assert response and response.ok
    page.evaluate('''() => {
      const probe = {speech: [], rewards: []};
      const speak = SihyeonVoice.speak.bind(SihyeonVoice);
      SihyeonVoice.speak = (...args) => { probe.speech.push(String(args[0])); return speak(...args); };
      const reward = window.gainExp;
      window.gainExp = (...args) => { probe.rewards.push(args[0]); return reward(...args); };
      window.__lifeCareProbe = probe;
    }''')
    page.locator('.world-zone[onclick="travelToZone(\'game\')"]').click()
    page.locator(f'.zone-game-card[onclick="{action}()"]').click()


def life_case(page, base, output, size):
    open_game(page, base, 'openLifeSequenceGame')
    steps = []
    for title, order, keyword in MISSIONS:
        expect(page.locator(f'.ls-mission-icon[aria-label="{title}"]')).to_be_visible()
        reason = page.locator('[data-life-reason]')
        expect(reason).to_contain_text(keyword)
        readable(reason)
        listen = page.locator('[data-life-listen]')
        button_box = hit_control(page, listen)
        hit_control(page, page.locator('[data-action="restart"]'))
        before = page.evaluate('window.__lifeCareProbe.speech.length')
        listen.click()
        current = reason.inner_text()
        page.wait_for_function('(text) => window.__lifeCareProbe.speech.at(-1) === text', arg=current)
        assert page.evaluate('window.__lifeCareProbe.speech.length') > before
        assert page.locator('.ls-slot.filled').count() == 0
        if title == '손 씻기' or size in ('390x844', '844x390'):
            page.screenshot(path=str(output / f'life-{MISSIONS.index((title, order, keyword))}-before-{size}.png'))
        for card in order:
            button = page.locator(f'.ls-pool-card[data-card="{card}"]')
            hit_control(page, button)
            button.click()
            readable(reason)
        expect(page.locator('[data-life-next]')).to_be_enabled(timeout=2000)
        expect(page.locator('.ls-round-status')).to_contain_text('맞았어요')
        hit_control(page, page.locator('[data-life-next]'))
        hit_control(page, page.locator('[data-life-replay]'))
        if title == '손 씻기':
            expect(page.locator('.ls-root.complete')).to_have_count(1, timeout=4000)
            page.screenshot(path=str(output / f'life-cause-result-{size}.png'))
        steps.append({'title': title, 'validOrder': order, 'replayButton': button_box, 'initialReason': current})
        page.locator('[data-life-next]').click()
    expect(page.locator('.ls-success')).to_be_visible()
    assert len(page.evaluate('window.__lifeCareProbe.rewards')) == 7
    page.screenshot(path=str(output / f'life-finish-{size}.png'))
    return {'missions': steps, 'rewardCalls': page.evaluate('window.__lifeCareProbe.rewards'),
            'driver': 'public menus, six native arrangements including three alternative valid preparation orders, explanation replay, next and finish'}


def cat_case(page, base, output, size):
    open_game(page, base, 'openCatCareGame')
    page.get_by_role('button', name='눈이', exact=True).click()
    expect(page.locator('[data-cat-need="hungry"]')).to_be_visible()
    for selector in ('#cc-change-cat', '[data-cat-listen]', '[data-cat-finish]'):
        hit_control(page, page.locator(selector))
    for action in ('eat', 'bath', 'sleep', 'wait'):
        hit_control(page, page.locator(f'[data-cat-action="{action}"]'))
    page.locator('[data-cat-action="sleep"]').click()
    expect(page.locator('[data-cat-next]')).to_be_disabled()
    expect(page.locator('[data-cat-resolved="false"]')).to_be_visible()
    page.locator('[data-cat-action="wait"]').click()
    expect(page.locator('[data-cat-feedback]')).to_contain_text('서두르지')
    expect(page.locator('[data-cat-next]')).to_be_disabled()
    assert page.evaluate('window.__lifeCareProbe.rewards.length') == 0
    states = []
    for need, action, image_key in (('hungry', 'eat', 'eat'), ('wash', 'bath', 'bath'), ('sleepy', 'sleep', 'sleep'), ('space', 'wait', 'sleep')):
        expect(page.locator(f'[data-cat-need="{need}"]')).to_be_visible()
        readable(page.locator('[data-cat-feedback]'))
        page.screenshot(path=str(output / f'cat-{need}-observe-{size}.png'))
        control = page.locator(f'[data-cat-action="{action}"]')
        hit_control(page, control)
        control.click()
        expect(page.locator('[data-cat-resolved="true"]')).to_be_visible()
        expect(page.locator('#cc-main-img')).to_have_attribute('src', f'./assets/games/cat-care/white_{image_key}.webp')
        page.wait_for_function('''() => {const img = document.querySelector('#cc-main-img'); return img?.complete && img.naturalWidth > 0;}''')
        expect(page.locator('[data-cat-next]')).to_be_enabled()
        copy = page.locator('[data-cat-feedback]').inner_text()
        page.locator('[data-cat-listen]').click()
        page.wait_for_function('(text) => window.__lifeCareProbe.speech.at(-1) === text', arg=copy)
        reward_count = page.evaluate('window.__lifeCareProbe.rewards.length')
        page.locator(f'[data-cat-action="{action}"]').click()
        assert page.evaluate('window.__lifeCareProbe.rewards.length') == reward_count
        readable(page.locator('[data-cat-feedback]'))
        hit_control(page, page.locator('[data-cat-next]'))
        hit_control(page, page.locator('[data-cat-finish]'))
        page.screenshot(path=str(output / f'cat-{need}-after-{size}.png'))
        if need == 'hungry':
            original = page.viewport_size
            page.set_viewport_size({'width': original['height'], 'height': original['width']})
            page.wait_for_timeout(250)
            expect(page.locator('[data-cat-need="hungry"][data-cat-resolved="true"]')).to_be_visible()
            hit_control(page, page.locator('#cc-change-cat'))
            hit_control(page, page.locator('[data-cat-next]'))
            page.screenshot(path=str(output / f'cat-rotated-{size}.png'))
            page.set_viewport_size(original)
            page.wait_for_timeout(250)
        states.append({'need': need, 'action': action, 'result': copy, 'image': image_key})
        if need != 'space':
            page.locator('[data-cat-next]').click()
    page.wait_for_timeout(2200)
    expect(page.locator('[data-cat-need="space"][data-cat-resolved="true"]')).to_be_visible()
    assert page.locator('.cc-complete').count() == 0
    assert page.evaluate('window.__lifeCareProbe.rewards') == [5, 5, 5, 5]
    page.locator('[data-cat-finish]').click()
    expect(page.locator('.cc-complete-title')).to_contain_text('함께했어요')
    assert page.evaluate('window.__lifeCareProbe.rewards') == [5, 5, 5, 5, 25]
    hit_control(page, page.locator('#cc-replay'))
    hit_control(page, page.locator('#cc-to-land'))
    page.screenshot(path=str(output / f'cat-manual-finish-{size}.png'))
    page.locator('#cc-replay').click()
    page.get_by_role('button', name='름이', exact=True).click()
    expect(page.locator('[data-cat-need="hungry"][data-cat-resolved="false"]')).to_be_visible()
    page.locator('[data-cat-action="eat"]').click()
    page.locator('#cc-change-cat').click()
    page.get_by_role('button', name='눈이', exact=True).click()
    expect(page.locator('#cc-main-img')).to_have_attribute('src', './assets/games/cat-care/white_default.webp')
    page.wait_for_timeout(1200)
    expect(page.locator('[data-cat-need="hungry"][data-cat-resolved="false"]')).to_be_visible()
    assert page.locator('.cc-particle').count() == 0
    return {'states': states, 'changeCat': 'portrait and landscape native controls',
            'manualCompletion': True, 'repeatRewardCalls': 'unchanged',
            'rotation': 'resolved care and controls preserved', 'oldCatImageCallbacks': 'no delayed replacement',
            'driver': 'public menu, wrong care, wait, four matching states, repeat, replay, rotation, finish, change cat'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url')
    parser.add_argument('--output', type=pathlib.Path, default=pathlib.Path('qa-life-care-stage6'))
    args = parser.parse_args()
    output = args.output.resolve(); output.mkdir(parents=True, exist_ok=True)
    report = {'status': 'RUNNING', 'checks': [], 'pageErrors': [], 'failedRequests': [],
              'testScriptSha256': sha(pathlib.Path(__file__).read_bytes()),
              'checkoutSourceSha256': {file: sha((ROOT / file).read_bytes()) for file in SOURCES},
              'scope': {'publicMenus': True, 'nativeClicks': True, 'privateGameStateInjection': False,
                        'voice': 'pass-through request probe', 'notRun': ['audible speech', 'physical touch', 'child observation']}}
    server = None
    try:
        if args.base_url:
            base = base_url(args.base_url)
        else:
            server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT)))
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = f'http://127.0.0.1:{server.server_port}/'
        report['baseUrl'] = base
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            report['browserVersion'] = browser.version
            for width, height in VIEWPORTS:
                size = f'{width}x{height}'
                for name, run in (('life', life_case), ('cat', cat_case)):
                    context = browser.new_context(viewport={'width': width, 'height': height}, service_workers='block')
                    page = context.new_page(); page.set_default_timeout(15000)
                    responses = []
                    page.on('response', lambda response, target=responses: target.append(response))
                    page.on('pageerror', lambda error, case=f'{name}-{size}': report['pageErrors'].append({'case': case, 'error': str(error)}))
                    page.on('requestfailed', lambda req, case=f'{name}-{size}': report['failedRequests'].append({'case': case, 'url': req.url, 'failure': req.failure}))
                    try:
                        detail = run(page, base, output, size)
                        report['checks'].append({'case': f'{name}-{size}', 'status': 'PASS', 'detail': detail,
                                                 'sourceSha256': evidence(responses, base)})
                    except Exception as exc:
                        report['checks'].append({'case': f'{name}-{size}', 'status': 'FAIL', 'error': str(exc), 'trace': traceback.format_exc()})
                        page.screenshot(path=str(output / f'{name}-failure-{size}.png'))
                    finally:
                        context.close()
            browser.close()
    except Exception as exc:
        report['checks'].append({'case': 'environment', 'status': 'FAIL', 'error': str(exc), 'trace': traceback.format_exc()})
    finally:
        if server: server.shutdown()
    report['status'] = 'PASS' if len(report['checks']) == 12 and all(c['status'] == 'PASS' for c in report['checks']) and not report['pageErrors'] else 'FAIL'
    (output / 'life-care-stage6-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': report['status'], 'checks': len(report['checks']), 'passed': sum(c['status'] == 'PASS' for c in report['checks']), 'pageErrors': len(report['pageErrors']), 'output': str(output)}, ensure_ascii=False))
    raise SystemExit(0 if report['status'] == 'PASS' else 1)


if __name__ == '__main__':
    main()
