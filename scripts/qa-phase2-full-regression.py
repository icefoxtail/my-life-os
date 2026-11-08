"""Native Chromium menu/viewport regression. Never claims physical-device/audio QA."""
import argparse, functools, hashlib, http.server, json, pathlib, subprocess, threading, traceback
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url')
parser.add_argument('--output', default='qa-full-regression')
args = parser.parse_args()
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = pathlib.Path(args.output).resolve()
OUT.mkdir(parents=True, exist_ok=True)
REPORT = {'scope': 'Actual Chromium native menu clicks and screenshots; 9 games x 5 viewports; no physical touch or audible listening',
          'gitSha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT).decode().strip(),
          'checks': [], 'pageErrors': [], 'sourceHashes': {}}
for name in ['index.html', 'sw.js', 'js/vehicle-display.js', 'assets/vehicles/display_bounds.json',
             'scripts/qa-phase2-full-regression.py']:
    REPORT['sourceHashes'][name] = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

server = None
if args.base_url:
    BASE = args.base_url.rstrip('/') + '/'
else:
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 8879), functools.partial(Quiet, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    BASE = 'http://127.0.0.1:8879/'
REPORT['baseUrl'] = BASE

GAMES = [
    ('count', 'numbers', 'openNumberCountGame', '#ncGame', '.nc-toy-block-btn, #ncRange'),
    ('memory', 'game', 'openMemoryGame', '.memory-game-container', '.memory-card'),
    ('parking', 'cars', 'openParkingGame', '.pl-root', '.pl-slot, .pl-car-drag'),
    ('construction', 'cars', 'openConstructionSiteGame', '.cs-root', '.cs-choice'),
    ('fire', 'cars', 'openMegaDispatchGame', '.md14-root', '.md14-truck-btn'),
    ('coding', 'cars', 'openCodingCarGame', '.cc-root', '.cc-btn-arrow, #ccGoBtn'),
    ('garage', 'cars', 'openCarGarageGame', '.cg-root', '.cg-tool-btn'),
    ('post', 'numbers', 'openNumberPostOfficeGame', '.npo-root', '.npo-deliver-button, .npo-type'),
    ('train', 'numbers', 'openPatternTrainGame', '.pt-app', '[data-action="start"], [data-action="select"]'),
]
SIZES = [(390, 844), (844, 390), (640, 360), (768, 1024), (1280, 800)]

def enter(page, game):
    _, zone, action, root, _ = game
    page.goto(BASE + 'index.html', wait_until='load')
    page.locator('[data-home-age="4"]').click()
    page.locator('.world-zone[onclick="travelToZone(\'%s\')"]' % zone).click()
    page.locator('.zone-game-card[onclick="%s()"]' % action).click()
    page.locator(root).wait_for()
    if game[0] == 'fire':
        page.locator('[data-mode-size="4"]').click()
        page.locator('.md14-truck-btn').first.wait_for()
    page.wait_for_timeout(1800)

def check(name, fn, page=None):
    try:
        detail = fn()
        REPORT['checks'].append({'name': name, 'status': 'PASS', 'detail': detail})
    except Exception as exc:
        item = {'name': name, 'status': 'FAIL', 'error': str(exc), 'trace': traceback.format_exc()}
        if page:
            try:
                path = 'failure-%02d.png' % len(REPORT['checks'])
                page.screenshot(path=str(OUT / path))
                item['screenshot'] = path
            except Exception: pass
        REPORT['checks'].append(item)
    print(REPORT['checks'][-1], flush=True)

def inspect_layout(page, game):
    root, controls = game[3], game[4]
    result = page.evaluate('''([root, controls]) => {
      const host = document.querySelector(root);
      const visible = el => {const b=el.getBoundingClientRect(),s=getComputedStyle(el);return b.width>0&&b.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
      const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
      const active = [...host.querySelectorAll(controls)].filter(visible).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim().slice(0,45),rect:rect(el)}));
      const outside = active.filter(({rect:r})=>r.x < -2 || r.y < -2 || r.right > innerWidth+2 || r.bottom > innerHeight+2);
      const images = [...host.querySelectorAll('img')].filter(visible);
      const broken = images.filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'));
      const pending = images.filter(i=>!i.complete).map(i=>i.getAttribute('src'));
      const held = images.filter(i=>i.getAttribute('src')?.includes('assets/vehicles/') && window.SihyeonVehicleDisplay && !SihyeonVehicleDisplay.isClean(i.getAttribute('src'))).map(i=>i.getAttribute('src'));
      return {viewport:[innerWidth,innerHeight],root:rect(host),controls:active,outside,broken,pending,held,
        pageOverflow:document.documentElement.scrollWidth>innerWidth+2};
    }''', [root, controls])
    assert result['controls'], 'No primary game controls'
    assert not result['outside'], 'Primary controls clipped: ' + json.dumps(result['outside'], ensure_ascii=False)
    assert not result['pageOverflow'], 'Horizontal document overflow'
    assert not result['broken'] and not result['pending'], 'Visible image failed/pending: ' + str(result)
    assert not result['held'], 'Held image exposed to player: ' + str(result['held'])
    return result

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    REPORT['browser'] = browser.version
    for game in GAMES:
        for w, h in SIZES:
            context = browser.new_context(viewport={'width': w, 'height': h}, service_workers='block')
            page = context.new_page()
            page.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error)))
            def matrix_case():
                enter(page, game)
                result = inspect_layout(page, game)
                shot = '%s-%sx%s.png' % (game[0], w, h)
                page.screenshot(path=str(OUT / shot))
                result['screenshot'] = shot
                return result
            check('viewport %s %sx%s' % (game[0], w, h), matrix_case, page)
            context.close()

    def new_page(w=844, h=390):
        context = browser.new_context(viewport={'width': w, 'height': h}, service_workers='block')
        page = context.new_page()
        page.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error)))
        return context, page

    context, page = new_page()
    def counting():
        enter(page, GAMES[0])
        page.locator('#ncRange').select_option('1')
        page.wait_for_function('SihyeonGames.numberCount.state.isAnimating === false')
        wrong = page.locator('.nc-toy-block-btn:not([data-correct="true"])').first
        wrong.click()
        page.wait_for_function('SihyeonGames.numberCount.state.wrongCount === 1 && !SihyeonGames.numberCount.state.isAnimating')
        assert page.locator('.nc-vehicle-cell').count() > 0
        for level in range(1, 6):
            page.wait_for_function('(level)=>SihyeonGames.numberCount.state.currentLevel===level && !SihyeonGames.numberCount.state.isAnimating', arg=level, timeout=30000)
            page.locator('.nc-toy-block-btn[data-correct="true"]').click()
        page.locator('#ncSuccessPanel').wait_for(state='visible', timeout=30000)
        page.screenshot(path=str(OUT / 'count-complete-native.png'))
        page.locator('#ncRestartBtn').click()
        assert page.evaluate('SihyeonGames.numberCount.state.currentLevel') == 1
        return {'rounds': 5, 'wrongRetried': True, 'completed': True, 'restarted': True}
    check('native counting wrong, five rounds and restart', counting, page)
    context.close()

    context, page = new_page(640, 360)
    def coding():
        enter(page, GAMES[5])
        page.locator('.cc-btn-arrow[data-dir="up"]').click()
        page.locator('[data-action="undo"]').click()
        assert page.locator('#ccGoBtn').is_disabled()
        start = page.locator('.cc-map').evaluate('e=>({x:+e.style.getPropertyValue("--start-x"),y:+e.style.getPropertyValue("--start-y"),gx:+e.style.getPropertyValue("--goal-x"),gy:+e.style.getPropertyValue("--goal-y")})')
        wrong = 'left' if start['x'] == 0 else 'right' if start['x'] == 2 else 'up' if start['y'] == 0 else 'down'
        page.locator('.cc-btn-arrow[data-dir="%s"]' % wrong).click()
        page.locator('#ccGoBtn').click()
        page.wait_for_function('document.querySelectorAll(".cc-slot.active").length===0 && document.querySelector("#ccGoBtn").disabled', timeout=15000)
        commands = (['right'] * max(0, start['gx'] - start['x']) + ['left'] * max(0, start['x'] - start['gx']) +
                    ['down'] * max(0, start['gy'] - start['y']) + ['up'] * max(0, start['y'] - start['gy']))
        for command in commands:
            page.locator('.cc-btn-arrow[data-dir="%s"]' % command).click()
        page.locator('#ccGoBtn').click()
        page.locator('.cc-success-overlay').wait_for(timeout=20000)
        page.screenshot(path=str(OUT / 'coding-complete-small-landscape.png'))
        page.locator('.cc-success-retry').click()
        assert not page.locator('.cc-success-overlay').count()
        return {'route': commands, 'undo': True, 'wrongRecovered': True, 'success': True, 'retry': True}
    check('native coding undo, wrong route, correct route and restart', coding, page)
    context.close()

    context, page = new_page()
    def garage():
        enter(page, GAMES[6])
        wrong = page.locator('.cg-tool-btn.is-dimmed').first
        if wrong.count():
            wrong.click()
            assert page.locator('.cg-tool-btn.is-done').count() == 0
        tasks = 0
        while page.locator('.cg-tool-btn.is-target').count() and tasks < 8:
            previous = page.locator('.cg-tool-btn.is-target').count()
            page.locator('.cg-tool-btn.is-target').first.click()
            page.wait_for_function('(n)=>document.querySelectorAll(".cg-tool-btn.is-target").length<n', arg=previous, timeout=10000)
            tasks += 1
        page.locator('[data-deco]').first.wait_for(timeout=12000)
        page.locator('[data-deco]').first.click()
        assert page.locator('.cg-deco-item').count() == 1
        page.locator('#btnGo').click()
        page.locator('.cg-success-panel').wait_for(timeout=12000)
        page.screenshot(path=str(OUT / 'garage-complete-native.png'))
        page.locator('.cg-panel-btn.restart').click()
        assert page.locator('.cg-tool-btn.is-target').count() > 0
        return {'repairs': tasks, 'wrongTool': True, 'decoration': True, 'departure': True, 'restart': True}
    check('native garage wrong tool, repair, decorate, depart and restart', garage, page)
    context.close()

    context, page = new_page(390, 844)
    def post_office():
        enter(page, GAMES[7])
        page.locator('[data-action="deliver"]').click()
        assert page.locator('.npo-root').get_attribute('data-phase') == 'SELECTING'
        requirements = page.evaluate('SihyeonGames.numberPostOffice.getSnapshot().state.mission.requirements')
        for need in requirements:
            page.locator('[data-action="type"][data-type="%s"]' % need['type']).click()
            for _ in range(need['count']):
                page.locator('.npo-stock-item:not([disabled])').first.click()
        page.locator('[data-action="undo"]').click()
        assert page.locator('.npo-stock-item:not([disabled])').count() > 0
        page.locator('.npo-stock-item:not([disabled])').first.click()
        page.locator('[data-action="deliver"]').click()
        page.locator('.npo-result').wait_for(timeout=18000)
        page.screenshot(path=str(OUT / 'post-office-complete-native.png'))
        page.locator('[data-action="replay"]').click()
        assert page.locator('.npo-root').get_attribute('data-phase') == 'SELECTING'
        return {'requirements': requirements, 'emptyDeliveryRetried': True, 'undo': True, 'delivered': True, 'replay': True}
    check('native post office wrong quantity, undo, delivery and replay', post_office, page)
    context.close()
    browser.close()

if server: server.shutdown()
REPORT['status'] = 'PASS' if all(x['status'] == 'PASS' for x in REPORT['checks']) and not REPORT['pageErrors'] else 'FAIL'
(OUT / 'full-regression.json').write_text(json.dumps(REPORT, ensure_ascii=False, indent=2))
print('FULL_REGRESSION', REPORT['status'], flush=True)
raise SystemExit(0 if REPORT['status'] == 'PASS' else 1)
