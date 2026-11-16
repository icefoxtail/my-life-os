"""Native-menu artwork integration and original-object neighborhood story QA.

Only speechSynthesis transport completion/failure is controlled. Production game
handlers, rendering, storage paths, Voice and sequencer timers remain untouched.
Legacy saved-data and denied-storage cases are explicitly identified fixtures.
Native speaker audio, physical devices and child observation remain NOT_RUN.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import re
import runpy
import threading
import traceback
import xml.etree.ElementTree as ET
from urllib.parse import unquote

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
ART = runpy.run_path(str(ROOT / 'scripts/qa-art-reference-browser.py'))
ARITHMETIC = runpy.run_path(str(ROOT / 'scripts/qa-picture-arithmetic-browser.py'))
ZONE = '.world-zone[onclick="travelToZone(\'numbers\')"]'
GAMES = {'ns': ('neighborhoodStory', 'openNeighborhoodStoryGame'),
         'pa': ('pictureArithmetic', 'openPictureArithmeticGame'),
         'qc': ('quantityChange', 'openQuantityChangeGame')}
SAVE = {'ns': 'sihyeon-neighborhood-story-v1', 'pa': 'sihyeon-picture-arithmetic-v1', 'qc': 'sihyeon-quantity-change-v1'}
VIEWPORTS = [(320, 568), (390, 844), (844, 390), (1024, 768)]
SMALL = {'fire': {'a': 4, 'b': 2}, 'police': {'a': 3, 'b': 2},
         'snack': {'total': 7, 'groups': 3}, 'neighborhood': {'a': 4, 'b': 2}}
LEGACY_FILLS = ['#9944FF' if i % 2 == 0 else '#FFF' for i in range(15)]

PROBE = r"""(() => {
  window.__storyRead=()=>{
    const root=document.querySelector('.ns-root'),board=root?.querySelector('.ns-board');
    if(!board)return null;
    const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const visible=el=>{
      const r=rect(el);
      if(r.left < -2||r.top < -2||r.right > innerWidth+2||r.bottom > innerHeight+2)return false;
      for(let p=el.parentElement;p&&p!==root;p=p.parentElement){
        const css=getComputedStyle(p),b=rect(p);
        if(/auto|scroll|hidden|clip/.test(css.overflowY)&&(r.top<b.top-2||r.bottom>b.bottom+2))return false;
        if(/auto|scroll|hidden|clip/.test(css.overflowX)&&(r.left<b.left-2||r.right>b.right+2))return false;
      }
      const header=el.closest('.ns-zone')?.querySelector('header');
      if(header){const h=rect(header);if(r.left<h.right&&r.right>h.left&&r.top<h.bottom-1&&r.bottom>h.top+1)return false;}
      return true;
    };
    const items=[...board.querySelectorAll('.ns-item')];
    return {ids:items.map(el=>el.dataset.itemId),
      zones:Object.fromEntries([...board.querySelectorAll('.ns-zone[data-zone-id]')].map(zone=>
        [zone.dataset.zoneId,[...zone.querySelectorAll('.ns-item')].map(el=>el.dataset.itemId)])),
      labels:Object.fromEntries([...board.querySelectorAll('.ns-zone[data-zone-id]')].map(zone=>
        [zone.dataset.zoneId,Number(zone.querySelector('.ns-zone-count')?.textContent)])),
      current:items.filter(el=>el.classList.contains('is-current')).map(el=>({id:el.dataset.itemId,visible:visible(el),rect:rect(el)})),
      frames:[...board.querySelectorAll('.ns-ten-frame,.ns-ones')].map(el=>({ten:el.classList.contains('ns-ten-frame'),items:el.querySelectorAll('.ns-item').length})),
      caption:root.querySelector('.ns-caption')?.textContent.trim(),
      equation:root.querySelector('.ns-equation')?.textContent.trim(),
      result:root.querySelector('.ns-result')?.textContent.trim()};
  };
})();"""
SPEECH_FIXTURE = ARITHMETIC['SPEECH_FIXTURE'].replace('__arithmeticSpeech', '__artStorySpeech')
SPEECH_FIXTURE = SPEECH_FIXTURE.replace(
    'const s=window.SihyeonGames?.pictureArithmetic?.getSnapshot?.();',
    "const active=['neighborhoodStory','pictureArithmetic','quantityChange'].map(key=>({key,s:window.SihyeonGames?.[key]?.getSnapshot?.()})).find(row=>row.s?.active);const s=active?.s;")
SPEECH_FIXTURE = SPEECH_FIXTURE.replace(
    'actualCount:s?.actualCount,poolCount:s?.poolCount,actualGroups:s?.actualGroups',
    'actualCount:s?.actualCount,poolCount:s?.poolCount,actualGroups:s?.actualGroups,gameKey:active?.key,scene:s?.scene,age:s?.age,currentEvent:s?.currentEvent,stageIndex:s?.stageIndex,dom:window.__storyRead?.()')
TRANSPORT_END = "pending.delete(entry.index);entry.endedAt=performance.now();utterance.onend?.(new Event('end'));"
assert TRANSPORT_END in SPEECH_FIXTURE, 'Shared speech transport fixture changed'
SPEECH_FIXTURE = PROBE + SPEECH_FIXTURE.replace(TRANSPORT_END,
    "pending.delete(entry.index);if(state.fail){entry.failedAt=performance.now();utterance.onerror?.({error:'synthesis-failed'});}else{entry.endedAt=performance.now();utterance.onend?.(new Event('end'));}")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def snap(page, game='ns'):
    return page.evaluate('key=>SihyeonGames[key].getSnapshot()', GAMES[game][0])


def control(page, name, value=None, game='ns'):
    selector = '[data-%s-action="%s"]' % (game, name)
    if value is not None:
        selector += '[data-value="%s"]' % value
    dialog = page.locator('.ns-dialog' if game == 'ns' else '.%s-picture-dialog' % game)
    scope = dialog if dialog.count() else page.locator('.%s-root' % game)
    return scope.locator(selector + ':visible').first


def action(page, name, value=None, game='ns'):
    control(page, name, value, game).click(timeout=15000)


def mark(page):
    return page.evaluate('__artStorySpeech.entries.length')


def requests(page, start, run_id, game='ns'):
    return page.evaluate('([start,id,key])=>__artStorySpeech.entries.slice(start).filter(e=>e.gameActive&&e.runId===id&&e.gameKey===key)', [start, run_id, GAMES[game][0]])


def enter(page, base, game='ns', reload=False):
    if reload:
        page.reload(wait_until='load', timeout=45000)
    else:
        page.goto(base + 'index.html', wait_until='load', timeout=45000)
    assert page.evaluate('__artStorySpeech.available'), 'Speech transport unavailable'
    page.evaluate('window.__storyEngine={voice:SihyeonVoice,speak:SihyeonVoice.speak,stop:SihyeonVoice.stop,sequencer:SihyeonQuantitySequencer}')
    page.locator(ZONE).click(timeout=20000)
    card = page.locator('.zone-game-card[onclick="%s()"]' % GAMES[game][1])
    card.wait_for(state='visible', timeout=20000)
    start = mark(page)
    card.click()
    page.locator('.%s-root' % game).wait_for(state='visible')
    assert not snap(page, game).get('error'), snap(page, game)
    return start


def settings(page, age=None, language=None):
    action(page, 'settings')
    page.locator('#playSettingsDialog').wait_for(state='visible')
    if age is not None:
        page.locator('[data-play-age="%s"]' % age).click()
    if language is not None:
        page.locator('[data-ps-language="%s"]' % language).click()
    page.locator('[data-ps-close]').last.click()
    page.locator('#playSettingsDialog').wait_for(state='detached')


def scene(page, name):
    action(page, 'openScene'); action(page, 'scene', name)
    page.locator('.ns-dialog').wait_for(state='detached')


def number(page, term, n):
    action(page, 'openNumber'); action(page, 'term', term)
    if term != 'groups':
        action(page, 'range', 0 if n <= 10 else 1 if n <= 20 else 2)
    action(page, 'number', n)
    page.locator('.ns-dialog').wait_for(state='detached')


def configure(page, name, values, age=None):
    if age is not None and snap(page)['age'] != age:
        settings(page, age=age)
    scene(page, name)
    if name in ('fire', 'police'):
        number(page, 'b', 0)
    for term, value in values.items():
        number(page, term, value)
    assert snap(page)['base'] == values, snap(page)


def select_picture(page, slot, object_id='art:police', source='artwork', game='ns'):
    action(page, 'choosePicture', None if game == 'ns' else slot, game)
    if game == 'ns':
        action(page, 'slot', slot)
    before = snap(page, game)['state']
    action(page, 'sourceKind', source, game)
    if source == 'recommended':
        action(page, 'category', 'art' if object_id.startswith('art:') else 'food', game)
    assert snap(page, game)['state'] == before, 'Browsing source/category changed saved choices'
    candidate = control(page, 'object', object_id, game)
    assert candidate.get_attribute('data-source-kind') == source
    assert control(page, 'sourceKind', source, game).get_attribute('aria-pressed') == 'true'
    candidate.click()
    page.locator('.ns-dialog' if game == 'ns' else '.%s-picture-dialog' % game).wait_for(state='detached')


def begin_ledger(page):
    page.evaluate("""() => {
      window.__storyLedger?.observer?.disconnect();
      const board=document.querySelector('.ns-board'),originals=[...board.querySelectorAll('.ns-item')];
      const pictures=new Map(originals.map(item=>[item,item.querySelector('img')?.getAttribute('src')]));
      const ledger=window.__storyLedger={ids:originals.map(item=>item.dataset.itemId),initial:__storyRead(),errors:[],samples:0};
      ledger.inspect=()=>{
        const now=[...board.querySelectorAll('.ns-item')];ledger.samples++;
        if(now.length!==originals.length||new Set(now).size!==originals.length||now.some(item=>!originals.includes(item))||originals.some(item=>!board.contains(item)||item.querySelector('img')?.getAttribute('src')!==pictures.get(item)))
          ledger.errors.push({ids:now.map(item=>item.dataset.itemId),originalCount:originals.length});
      };
      ledger.observer=new MutationObserver(ledger.inspect);ledger.observer.observe(board,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});ledger.inspect();
    }""")


def ledger_result(page):
    result = page.evaluate("""() => {const v=__storyLedger;v.inspect();v.observer.disconnect();return {ids:v.ids,initial:v.initial,samples:v.samples,errors:v.errors};}""")
    assert result['samples'] > 0 and not result['errors'], result
    return result


def start_story(page, prediction='wrong'):
    page.evaluate('__artStorySpeech.delayMs=250')
    start = mark(page)
    action(page, 'replay')
    s = snap(page)
    if s['age'] == 5:
        page.locator('.ns-prediction').wait_for(state='visible')
        assert len(s['prediction']['choices']) == 2 and s['prediction']['timerActive'], s
        if prediction == 'wrong':
            buttons = page.locator('[data-ns-action="prediction"]')
            wrong = next(buttons.nth(i) for i in range(buttons.count()) if buttons.nth(i).get_attribute('data-value') != str(s['prediction']['expected']))
            wrong.click()
        elif prediction == 'skip':
            action(page, 'skip')
        elif prediction == 'auto':
            page.wait_for_function("SihyeonGames.neighborhoodStory.getSnapshot().sequence?.running", timeout=5000)
        else:
            raise AssertionError('Unknown prediction test mode')
    begin_ledger(page)
    page.evaluate('__artStorySpeech.delayMs=25')
    return start


def expected_result(name, age, values):
    if name == 'fire':
        return {'kind': 'count', 'count': values['a'] - values['b'] + (min(2, values['b']) if age == 7 else 0)}
    if name == 'police':
        total = values['a'] + values['b']
        return {'kind': 'count', 'count': total - (min(3, total) if age == 7 else 0)}
    if name == 'snack':
        total, groups = values['total'], values['groups']
        return {'kind': 'share', 'total': total, 'groupCount': groups, 'each': total // groups, 'remainder': total % groups}
    a, b = values['a'], values['b']
    if age == 7:
        a = b = max(a, b)
    return {'kind': 'compare', 'a': a, 'b': b, 'pairCount': min(a, b), 'difference': abs(a - b), 'relation': 'left' if a > b else 'right' if b > a else 'equal'}


def finish_story(page, start, values, failure=False, muted=False, offset=0):
    page.wait_for_function("""() => {const s=SihyeonGames.neighborhoodStory.getSnapshot();return s.active&&s.complete&&s.sequence?.status==='completed';}""", timeout=60000)
    s = snap(page); model = s['model']; dom = page.evaluate('__storyRead()')
    assert s['base'] == values and model['base'] == values, s
    assert s['result'] == expected_result(s['scene'], s['age'], values) == model['result'], s
    assert dom['zones'] == model['finalZones'] == s['actualZones'], (dom, s)
    assert len(dom['ids']) == len(set(dom['ids'])) == len(model['entities']) == s['actualCount'], (dom, s)
    all_events = [event for stage in model['stages'] for event in stage['events']]
    events = all_events[offset:]
    assert s['sequence']['completedSteps'] == len(events) and len(all_events) == s['totalEvents'], s
    assert len(model['stages']) == (2 if s['age'] == 7 else 1), s
    assert s['audioFailed'] is failure, s
    assert s['sequence']['audioAttempted'] == (0 if muted else len(events)), s
    if not failure:
        assert s['sequence']['audioSucceeded'] == (0 if muted else len(events)) and s['sequence']['audioFailed'] == 0, s
    assert page.evaluate('__storyEngine.voice===SihyeonVoice&&__storyEngine.speak===SihyeonVoice.speak&&__storyEngine.stop===SihyeonVoice.stop&&__storyEngine.sequencer===SihyeonQuantitySequencer'), 'Production Voice/sequence engine was replaced'
    identity = ledger_result(page)
    assert identity['initial']['zones'] == model['initialZones'], (identity, model['initialZones'])
    rows = requests(page, start, s['sequence']['runId'])
    assert len(rows) == (0 if muted else len(events)), (len(rows), len(events))
    if not muted:
        assert [row['currentEvent']['id'] for row in rows] == [event['id'] for event in events], rows
        replay = {zone: list(ids) for zone, ids in model['initialZones'].items()}
        positions = {}
        for event in all_events:
            if event['kind'] == 'move':
                replay[event['from']].remove(event['itemId']); replay[event['to']].append(event['itemId'])
            positions[event['id']] = {zone: list(ids) for zone, ids in replay.items()}
        for row, event in zip(rows, events):
            assert row['userGestureSeen'] and row['lang'] == ('en-US' if s['language'] == 'en' else 'ko-KR'), row
            assert row.get('failedAt') if failure else row['endedAt'] is not None, row
            assert {key: len(ids) for key, ids in row['dom']['zones'].items()} == event['countsAfter'], row
            assert row['dom']['zones'] == positions[event['id']], 'A displayed step moved the wrong original ID: %r' % row
            assert row['dom']['labels'] == event['countsAfter'], 'The visible zone numbers disagree with actual pictures: %r' % row
            assert set(row['dom']['ids']) == set(identity['ids']) and len(row['dom']['ids']) == len(identity['ids']), row
            assert all(item['visible'] for item in row['dom']['current']), row
            current = {item['id'] for item in row['dom']['current']}
            if event['kind'] == 'move':
                assert event['itemId'] in current, 'The moving original was not visibly highlighted'
            elif event['kind'] == 'pair':
                assert current == {event['leftId'], event['rightId']}, 'The displayed pair does not identify both original objects'
            if s['age'] == 6:
                assert all(frame['items'] == 10 if frame['ten'] else 1 <= frame['items'] <= 9 for frame in row['dom']['frames']), row
                assert sum(frame['items'] for frame in row['dom']['frames']) == len(identity['ids']), row
            if s['language'] == 'en':
                assert not re.search('[가-힣]', row['text']), row
        for stage_index, stage in enumerate(model['stages']):
            intro = next((row for row in rows if row['currentEvent']['kind'] == 'stage' and row['currentEvent']['stageIndex'] == stage_index), None)
            if intro is None:
                assert offset > 0, 'The full episode omitted a stage introduction'
                continue
            numbers = [int(value) for value in re.findall(r'\d+', intro['dom']['equation'])]
            operands = stage['operands']
            expected = [operands['total'], operands['groups']] if stage['operator'] == 'share' else \
                [min(operands['a'], operands['b']), operands['add']] if stage['operator'] == 'equalize' and operands['add'] else [operands['a'], operands['b']]
            assert all(value in numbers for value in expected), (intro, operands)
    if s['age'] == 6 and model['entities']:
        assert dom['frames'], 'Age six did not group the real objects into ten frames'
    elif s['age'] != 6:
        assert not dom['frames'], 'Ten frames leaked into a different age presentation'
    return {'snapshot': s, 'identity': identity, 'speech': [{'text': row['text'], 'lang': row['lang'], 'event': row['currentEvent'], 'DOM': row['dom']} for row in rows]}


def layout(page, game='ns'):
    page.wait_for_function("p=>[...document.querySelectorAll('.'+p+'-root img')].every(img=>img.complete)", arg=game, timeout=15000)
    result = page.evaluate("""p=>{
      const root=document.querySelector('.'+p+'-root'),scope=root.querySelector('[role="dialog"]')||root;
      const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight};};
      const controls=[...scope.querySelectorAll('button:not([disabled])')].filter(el=>el.getClientRects().length).map(el=>{
        const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
        if(x<0||x>innerWidth||y<0||y>innerHeight)return null;
        for(let a=el.parentElement;a&&a!==root;a=a.parentElement){const css=getComputedStyle(a),b=a.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(css.overflowY)&&(y<b.top||y>b.bottom))return null;}
        return {...box(el),label:el.textContent.trim(),action:el.dataset[p+'Action'],hit:document.elementFromPoint(x,y)?.closest('button')===el};
      }).filter(Boolean);
      const text=[...root.querySelectorAll(p==='ns'?'.ns-caption,.ns-equation,.ns-result':'.'+p+'-expression,.'+p+'-result')].filter(el=>el.getClientRects().length).map(el=>{
        const r=el.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(el);
        return {text:el.textContent.trim(),contained:[...range.getClientRects()].filter(line=>line.width&&line.height).every(line=>line.left>=r.left-1&&line.right<=r.right+1&&line.top>=r.top-1&&line.bottom<=r.bottom+1)};
      });
      const dialog=root.querySelector('[role="dialog"]');
      return {viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,root:box(root),dialog:dialog?box(dialog):null,controls,text,
        brokenImages:[...root.querySelectorAll('img')].filter(img=>!img.naturalWidth).map(img=>img.getAttribute('src'))};
    }""", game)
    w, h = result['viewport']; r = result['root']
    assert result['documentWidth'] <= w + 1 and r['left'] >= -1 and r['top'] >= -1 and r['right'] <= w + 1 and r['bottom'] <= h + 1, result
    assert r['scrollWidth'] <= r['clientWidth'] + 1 and r['scrollHeight'] <= r['clientHeight'] + 1, result
    assert not result['brokenImages'] and all(row['contained'] for row in result['text']), result
    for row in result['controls']:
        assert row['hit'], row
        if game == 'ns' or row['action'] in ('sourceKind', 'object', 'closeDialog', 'choosePicture'):
            assert row['width'] >= 43.5 and row['height'] >= 43.5, row
    if result['dialog']:
        d = result['dialog']; assert d['left'] >= -1 and d['top'] >= -1 and d['right'] <= w + 1 and d['bottom'] <= h + 1, result
    return result


def paint(page, base, color='#9944FF', blank=False):
    ART['enter_art'](page, base)
    page.locator('[data-tpl="police"]').click()
    if blank:
        page.locator('#azNewPaper').click()
        assert all(part['fill'] == '#FFF' for part in ART['fills'](page))
    else:
        ART['paint_light'](page, color)
    return ART['stored_template'](page)


def assert_picture(page, selector, color, count, version=2):
    sources = page.locator(selector + ' img').evaluate_all('(items)=>items.map(img=>img.getAttribute("src"))')
    assert len(sources) == count and len(set(sources)) == (1 if count else 0), (selector, count, sources)
    if count:
        document = ET.fromstring(unquote(sources[0].split(',', 1)[1]))
        if version == 2:
            light = next(node for node in document.iter() if node.attrib.get('data-part') == 'light_red')
            assert light.attrib['fill'] == color, light.attrib
        else:
            regions = [node for node in document.iter() if 'fillable' in node.attrib.get('class', '').split()]
            assert [node.attrib.get('fill') for node in regions] == LEGACY_FILLS
    return hashlib.sha256(sources[0].encode()).hexdigest() if sources else None


def saved(page, game):
    value = page.evaluate('key=>JSON.parse(localStorage.getItem(key)||"null")', SAVE[game])
    assert value is not None
    def inspect(item):
        if isinstance(item, dict):
            assert not set(item) & {'src', 'svg', 'fills', 'parts'}, 'Game duplicated the artwork instead of storing a reference'
            for child in item.values(): inspect(child)
        elif isinstance(item, list):
            for child in item: inspect(child)
        elif isinstance(item, str):
            assert 'data:image' not in item and '<svg' not in item
    inspect(value)
    return value


def simple_finish(page, game):
    page.wait_for_function("key=>{const s=SihyeonGames[key].getSnapshot();return s.active&&s.complete&&s.sequence?.status==='completed';}", arg=GAMES[game][0], timeout=45000)
    s = snap(page, game)
    assert not s['error'] and not s['audioFailed'], s
    return s


def simple_number(page, game, term, n):
    if term:
        action(page, 'term', term, game)
    action(page, 'range', 0 if n <= 10 else 1 if n <= 20 else 2, game)
    action(page, 'number', n, game)


def assert_choice(s, slot, source, missing=False, game='ns', version=None):
    choice = s['resolved'][slot] if game == 'ns' else s['artworkChoices'][slot]
    assert choice['requested'] == {'id': 'art:police', 'sourceKind': source}, choice
    assert choice['actual'] == {'id': 'art:police', 'sourceKind': 'recommended' if missing else source}, choice
    assert choice['missingArtwork'] is missing, choice
    if version is not None:
        assert (choice.get('artVersion') if game != 'ns' else choice['object']['artVersion']) == version, choice
    return choice


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', '--base-url', dest='base')
    parser.add_argument('--output', default='qa-art-story-evidence')
    args = parser.parse_args(); out = pathlib.Path(args.output).resolve(); out.mkdir(parents=True, exist_ok=True)
    report = {'scope': 'Native menu, personal artwork reference/legacy/fallback, four scenes and ages, original-node continuity, lifecycle and visual completion',
              'nativeAudio': {'status': 'NOT_RUN', 'reason': 'Controlled speech transport completion/failure; no speaker hearing claim'},
              'physicalDevice': {'status': 'NOT_RUN', 'reason': 'Chromium viewport/touch emulation only'},
              'fixture': {'sharedVoiceEngineReplaced': False, 'gameHandlersReplaced': False, 'gameTimersReplaced': False},
              'checks': [], 'pageErrors': [], 'screenshots': [], 'sources': {}}
    relative_files = ['index.html', 'sw.js', 'js/play-objects.js', 'js/games/art-zone.js',
                      'js/games/picture-arithmetic.js', 'css/games/picture-arithmetic.css',
                      'js/games/quantity-change.js', 'css/games/quantity-change.css',
                      'js/games/neighborhood-story-model.js', 'js/games/neighborhood-story.js', 'css/games/neighborhood-story.css',
                      'assets/games/neighborhood-story/card.svg', 'js/games/quantity-play-model.js', 'js/quantity-sequencer.js',
                      'js/voice-engine.js', 'js/play-settings.js', 'scripts/qa-art-story-browser.py']
    for relative in relative_files:
        report['sources'][relative] = hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()
    server = None
    if args.base:
        base = args.base.rstrip('/') + '/'
    else:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start(); base = 'http://127.0.0.1:%s/' % server.server_address[1]
    report['baseUrl'] = base

    def capture(page, name):
        filename = 'art-story-' + name + '.png'; page.screenshot(path=str(out / filename), full_page=True, timeout=15000)
        report['screenshots'].append(filename); return filename

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True); report['browser'] = browser.version

            def run_case(name, fn, size=(390, 844), init=None):
                context = browser.new_context(viewport={'width': size[0], 'height': size[1]}, has_touch=True, reduced_motion='reduce', service_workers='block')
                context.add_init_script(SPEECH_FIXTURE)
                if init: context.add_init_script(init)
                page = context.new_page()
                page.on('pageerror', lambda error: report['pageErrors'].append({'case': name, 'error': str(error)}))
                try:
                    row = {'name': name, 'viewport': list(size), 'status': 'PASS', 'detail': fn(page)}
                except Exception as error:
                    row = {'name': name, 'viewport': list(size), 'status': 'FAIL', 'error': str(error), 'trace': traceback.format_exc()}
                    try:
                        row['screenshot'] = capture(page, 'failure-' + re.sub('[^a-zA-Z0-9]+', '-', name))
                        row['snapshots'] = {game: page.evaluate('key=>window.SihyeonGames?.[key]?.getSnapshot?.()||null', value[0]) for game, value in GAMES.items()}
                        row['DOM'] = page.evaluate('window.__storyRead?.()')
                    except Exception as evidence_error:
                        row['evidenceError'] = str(evidence_error)
                finally:
                    context.close()
                report['checks'].append(row); print('ART_STORY', name, row['status'], flush=True)

            responsive = [('fire', 7, {'a': 15, 'b': 4}), ('neighborhood', 6, {'a': 30, 'b': 30}),
                          ('snack', 7, {'total': 15, 'groups': 4}), ('police', 5, {'a': 9, 'b': 6})]
            for size, (name, age, values) in zip(VIEWPORTS, responsive):
                def viewport_case(page, size=size, name=name, age=age, values=values):
                    enter(page, base); configure(page, name, values, age)
                    start = start_story(page, 'auto' if age == 5 else 'wrong')
                    result = finish_story(page, start, values)
                    result['layout'] = layout(page)
                    result['screenshot'] = capture(page, '%s-age%s-%sx%s' % (name, age, *size))
                    before = snap(page)['state']
                    action(page, 'openNumber'); action(page, 'range', 2)
                    assert snap(page)['state'] == before, 'Number-range browsing changed saved values'
                    result['numberDialogLayout'] = layout(page)
                    page.keyboard.press('Escape'); page.locator('.ns-dialog').wait_for(state='detached')
                    action(page, 'openScene')
                    page.keyboard.press('Shift+Tab')
                    assert page.evaluate("document.activeElement===[...document.querySelectorAll('.ns-dialog button:not([disabled])')].at(-1)"), 'Chooser Shift+Tab did not wrap'
                    page.keyboard.press('Tab')
                    assert page.evaluate("document.activeElement===document.querySelector('.ns-dialog button:not([disabled])')"), 'Chooser Tab did not wrap'
                    result['sceneDialogLayout'] = layout(page)
                    capture(page, 'scene-dialog-%sx%s' % size)
                    return result
                run_case('responsive original objects and dialogs %sx%s' % size, viewport_case, size)

            for name, values in SMALL.items():
                def age_depth(page, name=name, values=values):
                    enter(page, base); rows = []
                    for age in (4, 5, 6, 7):
                        configure(page, name, values, age)
                        start = start_story(page)
                        result = finish_story(page, start, values)
                        assert result['snapshot']['age'] == age
                        if age == 5:
                            assert result['snapshot']['prediction']['correct'] is False, 'An unexpected prediction must still finish naturally'
                        assert result['snapshot']['state']['scenes'][name]['values'] == values, 'Age depth changed the saved base numbers'
                        rows.append(result)
                    return rows
                run_case('%s age four through seven actual depth' % name, age_depth)

            boundaries = {'fire': [{'a': 0, 'b': 0}, {'a': 30, 'b': 30}],
                          'police': [{'a': 0, 'b': 0}, {'a': 0, 'b': 30}],
                          'snack': [{'total': 0, 'groups': 6}, {'total': 30, 'groups': 6}],
                          'neighborhood': [{'a': 0, 'b': 0}, {'a': 0, 'b': 30}]}
            for name, cases in boundaries.items():
                def boundary_case(page, name=name, cases=cases):
                    enter(page, base); rows = []
                    for values in cases:
                        configure(page, name, values, age=7)
                        result = finish_story(page, start_story(page), values)
                        rows.append(result)
                    before = snap(page)['state']
                    action(page, 'openNumber')
                    if name == 'fire':
                        action(page, 'term', 'a'); action(page, 'range', 2)
                        assert control(page, 'number', 29).is_disabled(), 'A smaller starting number must not clamp a saved departure of thirty'
                    elif name == 'police':
                        action(page, 'term', 'a'); action(page, 'range', 0)
                        assert control(page, 'number', 1).is_disabled(), 'A sum above thirty must not clamp the other term'
                    elif name == 'snack':
                        action(page, 'term', 'groups')
                        assert page.locator('.ns-dialog [data-ns-action="number"]').count() == 6
                        assert not page.locator('.ns-dialog [data-ns-action="number"][data-value="0"]').count()
                    else:
                        action(page, 'term', 'a'); action(page, 'range', 2)
                        assert control(page, 'number', 30).is_enabled(), 'Each comparison side must allow thirty'
                    assert snap(page)['state'] == before
                    page.keyboard.press('Escape')
                    return rows
                run_case('%s zero and thirty without clamping' % name, boundary_case)

            def arithmetic_art(page):
                work = paint(page, base)
                enter(page, base, 'pa')
                action(page, 'mode', 'add', 'pa'); simple_number(page, 'pa', 'b', 0)
                simple_number(page, 'pa', 'a', 2); simple_number(page, 'pa', 'b', 1)
                select_picture(page, 'a', game='pa'); select_picture(page, 'b', source='recommended', game='pa')
                addition = simple_finish(page, 'pa')
                assert_choice(addition, 'a', 'artwork', game='pa', version=2)
                assert_choice(addition, 'b', 'recommended', game='pa', version=2)
                own = assert_picture(page, '.pa-item[data-source="a"]', '#9944FF', 2)
                example = assert_picture(page, '.pa-item[data-source="b"]', '#FF4444', 1)
                assert own != example
                addition_layout = layout(page, 'pa'); capture(page, 'addition-personal-and-example-same-id')
                action(page, 'mode', 'share', 'pa'); simple_number(page, 'pa', None, 5)
                action(page, 'chooseGroups', game='pa'); action(page, 'groups', 2, 'pa')
                select_picture(page, 'share', game='pa'); sharing = simple_finish(page, 'pa')
                assert sharing['actualGroups'] == [2, 2] and sharing['poolCount'] == 1
                assert_picture(page, '.pa-item', '#9944FF', 5)
                before = saved(page, 'pa'); assert ART['stored_template'](page) == work
                enter(page, base, 'pa', reload=True); restored = simple_finish(page, 'pa')
                assert_picture(page, '.pa-item', '#9944FF', 5); assert saved(page, 'pa') == before
                paint(page, base, blank=True)
                enter(page, base, 'pa'); missing = simple_finish(page, 'pa')
                assert missing['total'] == 5 and missing['groups'] == 2 and missing['missingArtwork']
                assert_choice(missing, 'share', 'artwork', missing=True, game='pa', version=2)
                assert page.locator('.pa-artwork-note[data-missing-artwork="true"]').is_visible()
                assert_picture(page, '.pa-item', '#FF4444', 5)
                assert saved(page, 'pa')['shareSourceKind'] == 'artwork'
                fallback_layout = layout(page, 'pa'); capture(page, 'arithmetic-deleted-artwork-fallback')
                return {'addition': addition, 'additionLayout': addition_layout, 'sharing': sharing, 'restored': restored, 'missing': missing, 'fallbackLayout': fallback_layout}
            run_case('personal artwork addition sharing refresh and deletion fallback', arithmetic_art, (320, 568))

            def quantity_art(page):
                work = paint(page, base)
                enter(page, base, 'qc'); action(page, 'mode', 'compare', 'qc')
                simple_number(page, 'qc', 'a', 3); simple_number(page, 'qc', 'b', 2)
                select_picture(page, 'a', game='qc'); select_picture(page, 'b', source='recommended', game='qc')
                compared = simple_finish(page, 'qc')
                assert [compared['pairCount'], compared['difference'], compared['relation']] == [2, 1, 'left']
                assert_picture(page, '.qc-item[data-side="left"]', '#9944FF', 3)
                assert_picture(page, '.qc-item[data-side="right"]', '#FF4444', 2)
                assert_choice(compared, 'a', 'artwork', game='qc', version=2)
                assert_choice(compared, 'b', 'recommended', game='qc', version=2)
                capture(page, 'comparison-personal-and-example-same-id')
                action(page, 'mode', 'subtract', 'qc'); simple_number(page, 'qc', 'b', 0)
                simple_number(page, 'qc', 'a', 5); simple_number(page, 'qc', 'b', 2)
                select_picture(page, 'source', game='qc'); subtracted = simple_finish(page, 'qc')
                assert [subtracted['actualRemaining'], subtracted['actualDeparted']] == [3, 2]
                assert_picture(page, '.qc-item', '#9944FF', 5)
                assert_choice(subtracted, 'object', 'artwork', game='qc', version=2)
                before = saved(page, 'qc'); assert ART['stored_template'](page) == work
                action(page, 'home', game='qc')
                page.locator('.zone-game-card[onclick="openQuantityChangeGame()"]').click()
                restored = simple_finish(page, 'qc'); assert_picture(page, '.qc-item', '#9944FF', 5)
                enter(page, base, 'qc', reload=True); simple_finish(page, 'qc')
                assert saved(page, 'qc') == before
                paint(page, base, blank=True); enter(page, base, 'qc'); missing = simple_finish(page, 'qc')
                assert [missing['a'], missing['b'], missing['actualRemaining'], missing['actualDeparted']] == [5, 2, 3, 2]
                assert_choice(missing, 'object', 'artwork', missing=True, game='qc')
                assert page.locator('.qc-artwork-note[data-missing-artwork="true"]').is_visible()
                assert_picture(page, '.qc-item', '#FF4444', 5)
                capture(page, 'subtraction-deleted-artwork-fallback')
                return {'compared': compared, 'subtracted': subtracted, 'restored': restored, 'missing': missing, 'layout': layout(page, 'qc')}
            run_case('personal artwork comparison subtraction return and deletion fallback', quantity_art)

            def story_art(page):
                work = paint(page, base); enter(page, base)
                configure(page, 'fire', {'a': 3, 'b': 1}, age=7); select_picture(page, 'main')
                result = finish_story(page, start_story(page), {'a': 3, 'b': 1})
                assert_choice(result['snapshot'], 'main', 'artwork', version=2)
                original = assert_picture(page, '.ns-item', '#9944FF', 3)
                before = saved(page, 'ns'); assert ART['stored_template'](page) == work
                capture(page, 'story-personal-police-originals-return')
                enter(page, base, reload=True)
                restored = finish_story(page, start_story(page), {'a': 3, 'b': 1})
                assert_picture(page, '.ns-item', '#9944FF', 3); assert saved(page, 'ns') == before
                paint(page, base, color='#44CC44'); enter(page, base)
                edited = finish_story(page, start_story(page), {'a': 3, 'b': 1})
                changed = assert_picture(page, '.ns-item', '#44CC44', 3); assert changed != original
                paint(page, base, blank=True); enter(page, base)
                missing = finish_story(page, start_story(page), {'a': 3, 'b': 1})
                assert_choice(missing['snapshot'], 'main', 'artwork', missing=True, version=2)
                assert page.locator('.ns-artwork-note').filter(has_text='내 그림이 없어 견본으로 놀아요').is_visible()
                assert_picture(page, '.ns-item', '#FF4444', 3)
                assert saved(page, 'ns')['scenes']['fire']['objects']['main']['sourceKind'] == 'artwork'
                capture(page, 'story-deleted-artwork-fallback')
                return {'painted': result, 'restored': restored, 'edited': edited, 'missing': missing, 'layout': layout(page)}
            run_case('story personal colors snapshot refresh edits and deleted artwork', story_art)

            def legacy_art(page):
                page.goto(base + 'index.html', wait_until='load', timeout=45000)
                seed = {'tab': 'coloring', 'activeTemplateId': 'police', 'templates': {'police': {'fills': LEGACY_FILLS, 'completed': False}}}
                page.evaluate('data=>localStorage.setItem("sihyeon-art-work-v1",JSON.stringify(data))', seed)
                enter(page, base, reload=True); configure(page, 'fire', {'a': 3, 'b': 1}, age=7)
                select_picture(page, 'main'); result = finish_story(page, start_story(page), {'a': 3, 'b': 1})
                assert_choice(result['snapshot'], 'main', 'artwork', version=1)
                assert_picture(page, '.ns-item', '#9944FF', 3, version=1)
                assert page.evaluate('JSON.parse(localStorage.getItem("sihyeon-art-work-v1"))') == seed
                capture(page, 'story-legacy-fifteen-regions')
                return result
            run_case('legacy artwork keeps its old geometry through connected story', legacy_art)

            def old_game_saves(page):
                page.goto(base + 'index.html', wait_until='load', timeout=45000)
                fixture = {ART['WORK_KEY']: {'templates': {'police': {'svgVersion': 2, 'parts': {'light_red': '#9944FF'}}}},
                           SAVE['pa']: {'version': 1, 'mode': 'add', 'a': 2, 'b': 1, 'aId': 'art:police', 'bId': 'art:police'},
                           SAVE['qc']: {'version': 1, 'mode': 'compare', 'compare': {'a': 2, 'b': 1, 'aId': 'art:police', 'bId': 'art:police'},
                                        'subtract': {'a': 3, 'b': 1, 'objectId': 'art:police'}}}
                page.evaluate('data=>Object.entries(data).forEach(([key,value])=>localStorage.setItem(key,JSON.stringify(value)))', fixture)
                enter(page, base, 'pa', reload=True); pa = simple_finish(page, 'pa')
                assert_choice(pa, 'a', 'recommended', game='pa'); assert_picture(page, '.pa-item', '#FF4444', 3)
                enter(page, base, 'qc'); qc = simple_finish(page, 'qc')
                assert_choice(qc, 'a', 'recommended', game='qc'); assert_picture(page, '.qc-item', '#FF4444', 3)
                action(page, 'mode', 'subtract', 'qc'); sub = simple_finish(page, 'qc')
                assert_choice(sub, 'object', 'recommended', game='qc'); assert_picture(page, '.qc-item', '#FF4444', 3)
                return {'oldArithmetic': pa, 'oldComparison': qc, 'oldSubtraction': sub}
            run_case('old v1 games default to recommended despite a matching personal ID', old_game_saves)

            def lifecycle(page):
                enter(page, base); configure(page, 'fire', {'a': 5, 'b': 2}, age=7)
                page.evaluate('__artStorySpeech.delayMs=1000'); action(page, 'replay'); old = snap(page)
                assert old['sequence']['running']
                scene(page, 'neighborhood'); cutoff = mark(page)
                page.evaluate('__artStorySpeech.delayMs=25')
                configure(page, 'neighborhood', {'a': 2, 'b': 1}, age=7)
                changed = finish_story(page, start_story(page), {'a': 2, 'b': 1})
                assert not requests(page, cutoff, old['sequence']['runId']), 'A cancelled scene continued speaking'
                page.evaluate('__artStorySpeech.delayMs=1000'); action(page, 'replay'); begin_ledger(page); pending = snap(page)
                action(page, 'settings'); page.locator('#playSettingsDialog').wait_for(state='visible')
                assert snap(page)['sequence']['status'] == 'cancelled'
                unchanged = snap(page)['state']
                page.evaluate('__artStorySpeech.delayMs=250'); start = mark(page)
                page.locator('[data-ps-close]').last.click(); page.locator('#playSettingsDialog').wait_for(state='detached')
                page.evaluate('__artStorySpeech.delayMs=25')
                resumed = finish_story(page, start, {'a': 2, 'b': 1}, offset=pending['eventIndex'] + 1)
                assert resumed['snapshot']['state'] == unchanged and resumed['snapshot']['sequence']['runId'] != pending['sequence']['runId']
                before = saved(page, 'ns')
                page.evaluate('__artStorySpeech.delayMs=1000'); action(page, 'replay'); pending = snap(page)
                action(page, 'home'); cutoff = mark(page); page.wait_for_timeout(350)
                assert not snap(page)['active'] and not requests(page, cutoff, pending['sequence']['runId'])
                page.locator('.zone-game-card[onclick="openNeighborhoodStoryGame()"]').click()
                page.evaluate('__artStorySpeech.delayMs=25')
                returned = finish_story(page, start_story(page), {'a': 2, 'b': 1})
                enter(page, base, reload=True); reloaded = finish_story(page, start_story(page), {'a': 2, 'b': 1})
                assert saved(page, 'ns') == before
                assert reloaded['snapshot']['state']['scenes']['fire']['values'] == {'a': 5, 'b': 2}
                settings(page, age=5); action(page, 'replay')
                assert snap(page)['prediction']['timerActive']
                action(page, 'home'); cutoff = mark(page)
                page.wait_for_timeout(3300)
                assert not snap(page)['active'] and not page.evaluate('start=>__artStorySpeech.entries.slice(start).some(e=>e.gameKey==="neighborhoodStory"&&e.gameActive)', cutoff)
                assert not snap(page)['prediction']['timerActive'], 'Prediction timer survived leaving the game'
                return {'replacement': changed, 'settingsResumed': resumed, 'returned': returned, 'reloaded': reloaded, 'predictionTimerCancelled': True}
            run_case('rapid scene selection settings home prediction cancellation and saved reentry', lifecycle)

            def english_units(page):
                enter(page, base); configure(page, 'neighborhood', {'a': 2, 'b': 1}, age=4)
                select_picture(page, 'left', 'art:house', 'recommended')
                select_picture(page, 'right', 'art:boat', 'recommended')
                settings(page, language='en')
                result = finish_story(page, start_story(page), {'a': 2, 'b': 1})
                text = ' '.join(row['text'] for row in result['speech']).lower()
                assert 'houses' in text and 'boat' in text, text
                assert not re.search('[가-힣]', text)
                assert result['snapshot']['resolved']['left']['object']['unitKo'] == '채'
                assert result['snapshot']['resolved']['right']['object']['unitKo'] == '척'
                assert [row['text'].lower() for row in result['speech'] if row['event']['kind'] == 'pair'] == ['one pair.']
                capture(page, 'chosen-house-and-boat-units')
                configure(page, 'fire', {'a': 2, 'b': 1}, age=7)
                select_picture(page, 'main', 'art:boat', 'recommended')
                singular = finish_story(page, start_story(page), {'a': 2, 'b': 1})
                spoken = ' '.join(row['text'] for row in singular['speech']).lower()
                assert 'one boat heads out.' in spoken and 'one boat comes back.' in spoken, spoken
                assert 'one boat is here now.' in spoken and 'two boats are here now.' in spoken, spoken
                before = saved(page, 'ns')['scenes']
                settings(page, language='ko'); action(page, 'style', 'sino')
                korean = finish_story(page, start_story(page), {'a': 2, 'b': 1})
                assert saved(page, 'ns')['scenes'] == before
                assert any(re.search('[가-힣]', row['text']) for row in korean['speech'])
                return {'english': result, 'singularAndPlural': singular, 'koreanSino': korean, 'layout': layout(page)}
            run_case('selected house boat names units English and Korean settings', english_units)

            def audio_fallback(page):
                enter(page, base); configure(page, 'fire', {'a': 3, 'b': 2}, age=7)
                page.evaluate('__artStorySpeech.fail=true')
                failed = finish_story(page, start_story(page), {'a': 3, 'b': 2}, failure=True)
                fallback_layout = layout(page); capture(page, 'story-speech-failure-completed')
                assert page.locator('.ns-audio-note').is_visible(), 'No visible speech-failure fallback message'
                page.evaluate('__artStorySpeech.fail=false')
                recovered = finish_story(page, start_story(page), {'a': 3, 'b': 2})
                action(page, 'mute'); muted = finish_story(page, start_story(page), {'a': 3, 'b': 2}, muted=True)
                assert muted['snapshot']['state']['muted']
                return {'failed': failed, 'fallbackLayout': fallback_layout, 'recovered': recovered, 'muted': muted}
            run_case('speech failure visual completion recovery and mute', audio_fallback, (320, 568))

            def denied_storage(page):
                enter(page, base); configure(page, 'police', {'a': 2, 'b': 1}, age=4)
                initial = finish_story(page, start_story(page), {'a': 2, 'b': 1})
                assert initial['snapshot']['storage']['write'] == 'memory-only'
                action(page, 'home'); page.locator('.zone-game-card[onclick="openNeighborhoodStoryGame()"]').click()
                remembered = finish_story(page, start_story(page), {'a': 2, 'b': 1})
                assert remembered['snapshot']['storage']['read'] == 'memory'
                enter(page, base, reload=True)
                defaults = snap(page)['base']; restored = finish_story(page, start_story(page), defaults)
                assert restored['snapshot']['storage']['read'] == 'unavailable' and restored['snapshot']['scene'] == 'fire'
                return {'memoryFallback': remembered, 'playableReload': restored}
            storage_fixture = """(() => {const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
              Storage.prototype.getItem=function(key){if(key==='sihyeon-neighborhood-story-v1')throw new DOMException('Controlled read denial','SecurityError');return get.call(this,key);};
              Storage.prototype.setItem=function(key,value){if(key==='sihyeon-neighborhood-story-v1')throw new DOMException('Controlled quota denial','QuotaExceededError');return set.call(this,key,value);};})();"""
            run_case('unavailable storage retains session values and reload stays playable', denied_storage, init=storage_fixture)

            browser.close()
    except Exception as error:
        report['checks'].append({'name': 'browser setup', 'status': 'FAIL', 'error': str(error), 'trace': traceback.format_exc()})
    finally:
        if server: server.shutdown()
    report['passed'] = sum(row['status'] == 'PASS' for row in report['checks']); report['failed'] = sum(row['status'] == 'FAIL' for row in report['checks'])
    report['status'] = 'PASS' if report['checks'] and not report['failed'] and not report['pageErrors'] else 'FAIL'
    (out / 'art-story-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print('ART_STORY_BROWSER', report['status'], flush=True)
    return 0 if report['status'] == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
