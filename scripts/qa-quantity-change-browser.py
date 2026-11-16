"""Real Chromium menu/input, quantity conservation and comparison/subtraction QA.

The existing arithmetic harness supplies only speechSynthesis transport completion.
Game handlers, the shared Voice engine, sequencer, rendering and timers stay intact.
Physical devices, audible speech and child observation are explicitly NOT_RUN.
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

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
ARITHMETIC = runpy.run_path(str(ROOT / 'scripts/qa-picture-arithmetic-browser.py'))
GARDEN = runpy.run_path(str(ROOT / 'scripts/qa-ten-frame-garden-browser.py'))
WORDS = {'native': GARDEN['NATIVE'], 'sino': GARDEN['SINO'], 'en': GARDEN['ENGLISH']}
GAME = 'SihyeonGames.quantityChange.getSnapshot()'
CARD = '.zone-game-card[onclick="openQuantityChangeGame()"]'
ZONE = '.world-zone[onclick="travelToZone(\'numbers\')"]'
SAVE_KEY = 'sihyeon-quantity-change-v1'
VIEWPORTS = [(320, 568), (390, 844), (844, 390), (1024, 768)]

PROBE = r"""(() => {
  const rect = element => {
    const r = element.getBoundingClientRect();
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
  };
  window.__qcRead = () => {
    const root = document.querySelector('.qc-root'), board = root?.querySelector('.qc-board');
    if (!root || !board) return null;
    const items = [...board.querySelectorAll('.qc-item')], b = board.getBoundingClientRect();
    const area = {left:b.left+board.clientLeft,top:b.top+board.clientTop,
      right:b.left+board.clientLeft+board.clientWidth,bottom:b.top+board.clientTop+board.clientHeight};
    const current = [...board.querySelectorAll('.qc-item.is-current')].map(item => {
      const r = rect(item), header = item.closest('.qc-bucket')?.querySelector('header');
      const h = header ? rect(header) : null;
      return {id:item.dataset.itemId,rect:r,visible:r.left>=area.left-2&&r.right<=area.right+2&&
        r.top>=area.top-2&&r.bottom<=area.bottom+2&&(!h||r.bottom<=h.top+1||r.top>=h.bottom-1)};
    });
    const ids = selector => [...board.querySelectorAll(selector)].map(item => item.dataset.itemId);
    return {ids:items.map(item=>item.dataset.itemId),count:items.length,
      left:ids('.qc-item[data-side="left"]'),right:ids('.qc-item[data-side="right"]'),
      remaining:ids('.qc-remaining-items .qc-item'),departed:ids('.qc-departed-items .qc-item'),
      pairRows:[...board.querySelectorAll('.qc-pair')].map(pair=>({index:Number(pair.dataset.pairIndex),
        ids:[...pair.querySelectorAll('.qc-item')].map(item=>item.dataset.itemId),paired:pair.classList.contains('is-paired')})),
      extraIds:ids('.qc-extra-row .qc-item'),current,
      currentRows:[...board.querySelectorAll('.qc-match-row.is-current')].map(row=>{
        const r=rect(row);return {rect:r,visible:r.left>=area.left-2&&r.right<=area.right+2&&r.top>=area.top-2&&r.bottom<=area.bottom+2};
      }),board:area,
      result:root.querySelector('.qc-result-number')?.textContent.trim(),
      relation:root.querySelector('.qc-relation')?.textContent.trim(),
      answer:root.querySelector('.qc-answer strong')?.textContent.trim(),
      remainingLabel:root.querySelector('[data-qc-remaining-count]')?.textContent.trim(),
      departedLabel:root.querySelector('[data-qc-departed-count]')?.textContent.trim()};
  };
})();"""
SPEECH_FIXTURE = ARITHMETIC['SPEECH_FIXTURE'].replace('pictureArithmetic', 'quantityChange').replace('__arithmeticSpeech', '__quantityChangeSpeech')
SPEECH_FIXTURE = SPEECH_FIXTURE.replace(
    'actualCount:s?.actualCount,poolCount:s?.poolCount,actualGroups:s?.actualGroups',
    'actualCount:s?.actualCount,a:s?.a,b:s?.b,currentStep:s?.currentStep,matchedPairs:s?.matchedPairs,extrasShown:s?.extrasShown,dom:window.__qcRead?.()')
TRANSPORT_END = "pending.delete(entry.index);entry.endedAt=performance.now();utterance.onend?.(new Event('end'));"
assert TRANSPORT_END in SPEECH_FIXTURE, 'The shared transport fixture contract changed'
SPEECH_FIXTURE = PROBE + SPEECH_FIXTURE.replace(TRANSPORT_END,
    "pending.delete(entry.index);if(state.fail){entry.failedAt=performance.now();utterance.onerror?.({error:'synthesis-failed'});}else{entry.endedAt=performance.now();utterance.onend?.(new Event('end'));}")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def snap(page):
    return page.evaluate(GAME)


def observed(page):
    return page.evaluate('__qcRead()')


def mark(page):
    return page.evaluate('__quantityChangeSpeech.entries.length')


def entries(page, start, run_id):
    return page.evaluate('([start,id])=>__quantityChangeSpeech.entries.slice(start).filter(e=>e.gameActive&&e.runId===id)', [start, run_id])


def control(page, name, value=None):
    selector = '[data-qc-action="%s"]' % name
    if value is not None:
        selector += '[data-value="%s"]' % value
    dialog = page.locator('.qc-picture-dialog')
    return (dialog if dialog.count() else page.locator('.qc-root')).locator(selector + ':visible').first


def action(page, name, value=None):
    control(page, name, value).click(timeout=12000)


def enter(page, base, reload=False):
    if reload:
        page.reload(wait_until='load', timeout=45000)
    else:
        page.goto(base + 'index.html', wait_until='load', timeout=45000)
    assert page.evaluate('__quantityChangeSpeech.available'), 'Speech transport is unavailable'
    page.evaluate('window.__qcEngine={voice:SihyeonVoice,speak:SihyeonVoice.speak,stop:SihyeonVoice.stop,sequencer:SihyeonQuantitySequencer}')
    page.locator(ZONE).click(timeout=20000)
    page.locator(CARD).wait_for(state='visible', timeout=20000)
    start = mark(page)
    page.locator(CARD).click()
    page.locator('.qc-root').wait_for(state='visible')
    assert not snap(page)['error'], snap(page)
    return start


def choose_number(page, n, term):
    action(page, 'term', term)
    action(page, 'range', 0 if n <= 10 else 1 if n <= 20 else 2)
    start = mark(page)
    action(page, 'number', n)
    return start, snap(page)


def choose(page, mode, a, b, capture_initial=False):
    action(page, 'mode', mode)
    if mode == 'subtract':
        # Use the valid zero departure control before changing the starting count.
        choose_number(page, 0, 'b')
    choose_number(page, a, 'a')
    if capture_initial:
        page.evaluate('__quantityChangeSpeech.delayMs=350')
    start, value = choose_number(page, b, 'b')
    if capture_initial:
        initial = observed(page)
        assert initial['count'] == (a + b if mode == 'compare' else a), initial
        if mode == 'subtract':
            assert len(initial['remaining']) == a and not initial['departed'], initial
        begin_ledger(page)
        page.evaluate('__quantityChangeSpeech.delayMs=25')
    return start, value


def begin_ledger(page):
    page.evaluate("""() => {
      window.__qcLedger?.observer?.disconnect();
      const board=document.querySelector('.qc-board'), originals=[...board.querySelectorAll('.qc-item')];
      const ledger=window.__qcLedger={originals,ids:originals.map(item=>item.dataset.itemId),errors:[],samples:0};
      const runId=SihyeonGames.quantityChange.getSnapshot().sequence.runId;
      ledger.inspect=()=>{
        if(SihyeonGames.quantityChange.getSnapshot().sequence.runId!==runId)return;
        const current=[...board.querySelectorAll('.qc-item')];ledger.samples++;
        if(current.length!==originals.length||new Set(current).size!==originals.length||
           current.some(item=>!originals.includes(item))||originals.some(item=>!board.contains(item)))
          ledger.errors.push({count:current.length,ids:current.map(item=>item.dataset.itemId)});
      };
      ledger.observer=new MutationObserver(ledger.inspect);
      ledger.observer.observe(board,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
      ledger.inspect();
    }""")


def ledger_result(page):
    value = page.evaluate("""() => {
      const ledger=__qcLedger;ledger.inspect();ledger.observer.disconnect();
      return {originalIds:ledger.ids,observations:ledger.samples,errors:ledger.errors};
    }""")
    assert value['observations'] > 0 and not value['errors'], value
    return value


def assert_dom(page, mode, a, b, completed=True):
    d, s = observed(page), snap(page)
    total = a + b if mode == 'compare' else a
    assert d['count'] == total and len(set(d['ids'])) == total, d
    assert s['actualCount'] == total and (s['a'], s['b']) == (a, b), s
    if mode == 'compare':
        relation = 'left' if a > b else 'right' if b > a else 'equal'
        assert [len(d['left']), len(d['right'])] == [a, b], d
        assert len(d['pairRows']) == min(a, b), d
        assert all(len(pair['ids']) == 2 and pair['ids'][0] in d['left'] and pair['ids'][1] in d['right'] for pair in d['pairRows']), d
        assert len(d['extraIds']) == abs(a - b), d
        assert [s['pairCount'], s['difference'], s['relation']] == [min(a, b), abs(a - b), relation], s
        assert d['relation'] == ('>' if a > b else '<' if a < b else '＝'), d
        if completed:
            assert all(pair['paired'] for pair in d['pairRows']), d
            assert [s['matchedPairs'], s['extrasShown'], s['actualPairedRows']] == [min(a, b), abs(a - b), min(a, b)], s
        result = abs(a - b)
    else:
        assert len(d['remaining']) + len(d['departed']) == a, d
        assert not set(d['remaining']) & set(d['departed']), d
        if completed:
            assert [len(d['remaining']), len(d['departed']), s['moved']] == [a - b, b, b], (d, s)
            assert [d['remainingLabel'], d['departedLabel'], d['answer']] == [str(a - b), str(b), str(a - b)], d
        result = a - b
    assert int(re.match(r'\d+', d['result']).group()) == result, d
    return d


def finish(page, mode, a, b, audio_failure=False, muted=False):
    page.wait_for_function("""wanted => {
      const s=SihyeonGames.quantityChange.getSnapshot();
      return s.active&&s.mode===wanted.mode&&s.a===wanted.a&&s.b===wanted.b&&s.complete&&s.sequence?.status==='completed';
    }""", arg={'mode': mode, 'a': a, 'b': b}, timeout=45000)
    s = snap(page)
    expected_steps = (max(a, b) if mode == 'compare' else b) + 2
    assert s['sequence']['completedSteps'] == expected_steps, s
    assert s['sequence']['audioAttempted'] == (0 if muted else expected_steps), s
    assert s['audioFailed'] is audio_failure, s
    if not audio_failure:
        assert s['sequence']['audioSucceeded'] == (0 if muted else expected_steps), s
        assert not s['sequence']['audioFailed'], s
    assert page.locator('.qc-item.is-current').count() == 0
    assert page.evaluate('__qcEngine.voice===SihyeonVoice&&__qcEngine.speak===SihyeonVoice.speak&&__qcEngine.stop===SihyeonVoice.stop&&__qcEngine.sequencer===SihyeonQuantitySequencer'), 'Production speech/sequence API changed'
    assert_dom(page, mode, a, b)
    return s


def speech(page, start, value, style='native', language='ko'):
    rows = entries(page, start, value['sequence']['runId'])
    expected_steps = (max(value['a'], value['b']) if value['mode'] == 'compare' else value['b']) + 2
    assert len(rows) == expected_steps, rows
    locale = 'en-US' if language == 'en' else 'ko-KR'
    assert all(row['lang'] == locale and row['endedAt'] is not None and row['userGestureSeen'] for row in rows), rows
    vocabulary = WORDS['en' if language == 'en' else style]
    if value['mode'] == 'compare':
        ordinals = list(range(1, min(value['a'], value['b']) + 1)) + list(range(1, abs(value['a'] - value['b']) + 1))
    else:
        ordinals = list(range(value['a'] - 1, value['a'] - value['b'] - 1, -1))
    assert [row['text'] for row in rows[1:-1]] == [vocabulary[n] for n in ordinals], rows
    if language == 'en':
        assert all(not re.search('[가-힣]', row['text']) for row in rows), rows
    for row in rows:
        d = row['dom']
        assert d and d['count'] == (value['a'] + value['b'] if value['mode'] == 'compare' else value['a']), row
        assert len(set(d['ids'])) == d['count'], row
        assert all(item['visible'] for item in d['current']), row
        assert all(item['visible'] for item in d['currentRows']), row
        step = row['currentStep']
        if step['kind'] == 'depart':
            assert len(d['remaining']) == step['number'] and len(d['departed']) == value['a'] - step['number'], row
        elif step['kind'] == 'pair':
            assert sum(pair['paired'] for pair in d['pairRows']) == step['number'], row
    return [{'text': row['text'], 'lang': row['lang'], 'step': row['currentStep']} for row in rows]


def layout(page):
    page.wait_for_function("[...document.querySelectorAll('.qc-root img')].every(img=>img.complete)", timeout=15000)
    value = page.evaluate("""() => {
      const root=document.querySelector('.qc-root'),board=root.querySelector('.qc-board');
      const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,
        clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight};};
      const visibleCenter=button=>{
        const r=button.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
        if(x<0||x>innerWidth||y<0||y>innerHeight)return null;
        for(let parent=button.parentElement;parent&&parent!==root;parent=parent.parentElement){
          const css=getComputedStyle(parent),b=parent.getBoundingClientRect();
          if(/auto|scroll|hidden|clip/.test(css.overflowY)&&(y<b.top||y>b.bottom))return null;
          if(/auto|scroll|hidden|clip/.test(css.overflowX)&&(x<b.left||x>b.right))return null;
        }
        return {label:button.textContent,action:button.dataset.qcAction,value:button.dataset.value,
          reachable:document.elementFromPoint(x,y)?.closest('button')===button,...box(button)};
      };
      const panels=[...root.querySelectorAll('.qc-modes button,.qc-term-number,.qc-result,.qc-progress')].map(el=>{
        const r=el.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(el);
        const lines=[...range.getClientRects()].filter(line=>line.width>0&&line.height>0);
        return {text:el.textContent.trim(),contained:lines.every(line=>line.left>=r.left-1&&line.right<=r.right+1&&line.top>=r.top-1&&line.bottom<=r.bottom+1)};
      });
      const rowHeights=[...board.querySelectorAll('.qc-match-row')].map(row=>row.getBoundingClientRect().height);
      const bucketHeights=[...board.querySelectorAll('.qc-bucket')].map(bucket=>{
        const items=[...bucket.querySelectorAll('.qc-item')];
        return items.length ? bucket.querySelector('header').getBoundingClientRect().height+
          Math.max(...items.map(item=>item.getBoundingClientRect().height)) : 0;
      });
      return {viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,root:box(root),board:box(board),
        minimumVisibleRowHeight:Math.max(0,...rowHeights,...bucketHeights),
        controls:[...root.querySelectorAll('button:not([disabled])')].filter(b=>b.getClientRects().length).map(visibleCenter).filter(Boolean),text:panels,
        brokenImages:[...root.querySelectorAll('img')].filter(img=>!img.naturalWidth).map(img=>img.getAttribute('src'))};
    }""")
    w, h = value['viewport']
    r = value['root']
    assert value['documentWidth'] <= w + 1 and r['left'] >= -1 and r['top'] >= -1 and r['right'] <= w + 1 and r['bottom'] <= h + 1, value
    assert r['scrollWidth'] <= r['clientWidth'] + 1 and r['scrollHeight'] <= r['clientHeight'] + 1, value
    assert value['board']['width'] > 0 and value['board']['height'] > 0, value
    assert value['board']['clientHeight'] >= value['minimumVisibleRowHeight'] - 1, value
    assert not value['brokenImages'], value
    assert all(item['reachable'] for item in value['controls']), value
    assert all(item['contained'] for item in value['text']), value
    for item in value['controls']:
        if item['action'] in ('mode', 'term', 'choosePicture', 'home', 'mute', 'settings'):
            assert item['width'] >= 43.5 and item['height'] >= 43.5, item
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', '--base-url', dest='base')
    parser.add_argument('--output', default='qa-quantity-change-evidence')
    args = parser.parse_args()
    out = pathlib.Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    report = {'scope': 'Native menu/button input, exact picture counts, original DOM identity, current-step visibility, persistence and speech requests',
              'nativeAudio': {'status': 'NOT_RUN', 'reason': 'Transport completion/failure fixture; no speaker hearing claim'},
              'physicalDevice': {'status': 'NOT_RUN', 'reason': 'Chromium viewports/touch emulation only'},
              'fixture': {'sharedVoiceEngineReplaced': False, 'gameHandlersReplaced': False, 'gameTimersReplaced': False},
              'checks': [], 'pageErrors': [], 'screenshots': [], 'sources': {}}
    for relative in ['index.html', 'sw.js', 'js/games/quantity-change.js', 'css/games/quantity-change.css',
                     'assets/games/quantity-change/card.svg', 'js/games/quantity-play-model.js', 'js/quantity-sequencer.js',
                     'js/play-objects.js', 'js/games/art-zone.js', 'js/voice-engine.js', 'js/play-settings.js',
                     'scripts/qa-quantity-change-browser.py']:
        report['sources'][relative] = hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()
    server = None
    if args.base:
        base = args.base.rstrip('/') + '/'
    else:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = 'http://127.0.0.1:%s/' % server.server_address[1]
    report['baseUrl'] = base

    def capture(page, name):
        filename = 'quantity-change-' + name + '.png'
        page.screenshot(path=str(out / filename), full_page=True, timeout=15000)
        report['screenshots'].append(filename)
        return filename

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            report['browser'] = browser.version

            def run_case(name, fn, size=(390, 844), init=None):
                context = browser.new_context(viewport={'width': size[0], 'height': size[1]}, has_touch=True,
                                              reduced_motion='reduce', service_workers='block')
                context.add_init_script(SPEECH_FIXTURE)
                if init:
                    context.add_init_script(init)
                page = context.new_page()
                page.on('pageerror', lambda error: report['pageErrors'].append({'case': name, 'error': str(error)}))
                try:
                    row = {'name': name, 'viewport': list(size), 'status': 'PASS', 'detail': fn(page)}
                except Exception as error:
                    row = {'name': name, 'viewport': list(size), 'status': 'FAIL', 'error': str(error), 'trace': traceback.format_exc()}
                    try:
                        row['screenshot'] = capture(page, 'failure-' + re.sub('[^a-zA-Z0-9]+', '-', name))
                        row['snapshot'] = page.evaluate('window.SihyeonGames?.quantityChange?.getSnapshot?.()||null')
                        row['DOM'] = observed(page)
                    except Exception as evidence_error:
                        row['evidenceError'] = str(evidence_error)
                finally:
                    context.close()
                report['checks'].append(row)
                print('QUANTITY_CHANGE', name, row['status'], flush=True)

            for size in VIEWPORTS:
                def comparison_layout(page, size=size):
                    enter(page, base)
                    results = []
                    for a, b in [(15, 12), (30, 30)]:
                        start, _ = choose(page, 'compare', a, b)
                        s = finish(page, 'compare', a, b)
                        results.append({'a': a, 'b': b, 'snapshot': s, 'speech': speech(page, start, s),
                                        'layout': layout(page), 'screenshot': capture(page, 'compare-%s-%s-%sx%s' % (a, b, *size))})
                    return results
                run_case('comparison and sixty originals %sx%s' % size, comparison_layout, size)

                def subtraction_layout(page, size=size):
                    enter(page, base)
                    start, _ = choose(page, 'subtract', 15, 4, capture_initial=True)
                    s = finish(page, 'subtract', 15, 4)
                    identity = ledger_result(page)
                    d = observed(page)
                    assert d['remaining'] == identity['originalIds'][:11] and d['departed'] == list(reversed(identity['originalIds'][11:])), (d, identity)
                    return {'snapshot': s, 'originalNodes': identity, 'speech': speech(page, start, s),
                            'layout': layout(page), 'screenshot': capture(page, 'subtract-15-4-%sx%s' % size)}
                run_case('fifteen minus four original-node movement %sx%s' % size, subtraction_layout, size)

            def comparisons(page):
                enter(page, base)
                rows = []
                for a, b in [(12, 15), (15, 15), (0, 30), (0, 0)]:
                    start, _ = choose(page, 'compare', a, b)
                    s = finish(page, 'compare', a, b)
                    rows.append({'a': a, 'b': b, 'DOM': assert_dom(page, 'compare', a, b), 'speech': speech(page, start, s)})
                capture(page, 'compare-zero-zero')
                return rows
            run_case('left right equal and zero comparisons', comparisons)

            def subtractions(page):
                enter(page, base)
                rows = []
                for a, b in [(15, 15), (15, 0), (0, 0), (30, 30)]:
                    start, _ = choose(page, 'subtract', a, b, capture_initial=True)
                    s = finish(page, 'subtract', a, b)
                    identity = ledger_result(page)
                    d = observed(page)
                    assert d['remaining'] == identity['originalIds'][:a - b] and d['departed'] == list(reversed(identity['originalIds'][a - b:])), (d, identity)
                    rows.append({'a': a, 'b': b, 'originalNodes': identity, 'speech': speech(page, start, s)})
                capture(page, 'subtract-thirty-thirty')
                return rows
            run_case('subtract all none zero and thirty', subtractions)

            def modes_and_reload(page):
                enter(page, base)
                choose(page, 'compare', 0, 30)
                choose(page, 'subtract', 5, 4)
                action(page, 'mode', 'compare')
                assert [snap(page)['a'], snap(page)['b']] == [0, 30], snap(page)
                action(page, 'mode', 'subtract')
                assert [snap(page)['a'], snap(page)['b']] == [5, 4], snap(page)
                action(page, 'term', 'a'); action(page, 'range', 0)
                assert control(page, 'number', 3).is_disabled(), 'An invalid starting quantity must not clamp the departure value'
                action(page, 'term', 'b')
                assert control(page, 'number', 6).is_disabled(), 'Taking more than the original must be unavailable'
                before = snap(page)
                finish(page, 'subtract', 5, 4)
                action(page, 'home')
                assert not snap(page)['active']
                page.locator(CARD).click()
                page.locator('.qc-root').wait_for(state='visible')
                restored = finish(page, 'subtract', 5, 4)
                enter(page, base, reload=True)
                reloaded = finish(page, 'subtract', 5, 4)
                assert [reloaded['state']['compare']['a'], reloaded['state']['compare']['b']] == [0, 30], reloaded
                assert [reloaded['state']['subtract']['a'], reloaded['state']['subtract']['b']] == [5, 4], reloaded
                return {'before': before, 'homeRestored': restored, 'reloaded': reloaded}
            run_case('independent mode values invalid controls home and reload', modes_and_reload)

            def pictures_and_dialog(page):
                enter(page, base)
                choose(page, 'compare', 3, 2)
                action(page, 'choosePicture', 'a')
                page.locator('.qc-picture-dialog').wait_for(state='visible')
                assert snap(page)['sequence']['status'] == 'cancelled'
                page.keyboard.press('Shift+Tab')
                assert page.evaluate("document.activeElement===[...document.querySelectorAll('.qc-picture-dialog button:not([disabled])')].at(-1)"), 'Shift+Tab did not wrap to the last chooser control'
                page.keyboard.press('Tab')
                assert page.evaluate("document.activeElement===document.querySelector('.qc-picture-dialog button:not([disabled])')"), 'Tab did not wrap to the first chooser control'
                action(page, 'category', 'food')
                start = mark(page); action(page, 'object', 'cookie')
                s = finish(page, 'compare', 3, 2)
                assert s['state']['compare']['aId'] == 'cookie' and s['state']['compare']['bId'] == 'korean_police_car', s
                assert page.locator('.qc-item[data-object-id="cookie"]').count() == 3
                assert page.locator('.qc-item[data-object-id="korean_police_car"]').count() == 2
                spoken = speech(page, start, s)
                action(page, 'choosePicture', 'b')
                page.keyboard.press('Escape')
                page.locator('.qc-picture-dialog').wait_for(state='detached')
                resumed = finish(page, 'compare', 3, 2)
                return {'independentPictures': s['state']['compare'], 'speech': spoken, 'escapeResumed': resumed['complete'], 'layout': layout(page)}
            run_case('independent picture chooser focus and Escape resume', pictures_and_dialog)

            def cancellation(page):
                enter(page, base)
                choose(page, 'compare', 5, 2)
                page.evaluate('__quantityChangeSpeech.delayMs=1000')
                action(page, 'replay'); old = snap(page)
                assert old['sequence']['running'], old
                choose_number(page, 8, 'a'); cutoff = mark(page)
                page.evaluate('__quantityChangeSpeech.delayMs=25')
                changed = finish(page, 'compare', 8, 2)
                assert not entries(page, cutoff, old['sequence']['runId']), 'Cancelled comparison spoke after replacement'
                assert page.evaluate('id=>__quantityChangeSpeech.entries.some(e=>e.runId===id&&e.cancelledAt!==null)', old['sequence']['runId'])
                page.evaluate('__quantityChangeSpeech.delayMs=1000'); action(page, 'replay'); old = snap(page)
                action(page, 'mode', 'subtract'); cutoff = mark(page)
                page.evaluate('__quantityChangeSpeech.delayMs=25')
                switched = finish(page, 'subtract', 15, 4)
                assert not entries(page, cutoff, old['sequence']['runId']), 'Cancelled comparison survived a mode change'
                action(page, 'replay'); old = snap(page); action(page, 'home'); cutoff = mark(page)
                page.wait_for_timeout(500)
                assert not snap(page)['active'] and not entries(page, cutoff, old['sequence']['runId'])
                return {'replacement': changed, 'modeChange': switched, 'homeStopped': True}
            run_case('rapid selection mode and home cancel pending speech', cancellation)

            def settings(page):
                enter(page, base)
                choose(page, 'compare', 3, 2)
                action(page, 'style', 'sino'); start = mark(page); action(page, 'replay')
                s = finish(page, 'compare', 3, 2); sino = speech(page, start, s, style='sino')
                page.evaluate('__quantityChangeSpeech.delayMs=1000'); action(page, 'replay'); old = snap(page)
                action(page, 'settings'); page.locator('#playSettingsDialog').wait_for(state='visible')
                assert snap(page)['sequence']['status'] == 'cancelled'
                page.evaluate('__quantityChangeSpeech.delayMs=25')
                start = mark(page); page.locator('[data-ps-close]').last.click()
                page.locator('#playSettingsDialog').wait_for(state='detached')
                resumed = finish(page, 'compare', 3, 2)
                assert resumed['sequence']['runId'] != old['sequence']['runId']
                speech(page, start, resumed, style='sino')
                saved_values = {mode: [resumed['state'][mode]['a'], resumed['state'][mode]['b']] for mode in ('compare', 'subtract')}
                action(page, 'settings')
                page.locator('[data-play-age="7"]').click(); page.locator('[data-ps-language="en"]').click()
                start = mark(page); page.locator('[data-ps-close]').last.click()
                page.locator('#playSettingsDialog').wait_for(state='detached')
                english = finish(page, 'compare', 3, 2)
                assert english['age'] == 7 and english['language'] == 'en'
                assert {mode: [english['state'][mode]['a'], english['state'][mode]['b']] for mode in saved_values} == saved_values
                return {'sino': sino, 'unchangedCloseResumed': resumed['complete'], 'english': speech(page, start, english, language='en')}
            run_case('reading settings unchanged close age and English', settings)

            def audio_fallback(page):
                enter(page, base)
                page.evaluate('__quantityChangeSpeech.fail=true')
                choose(page, 'subtract', 3, 2)
                failed = finish(page, 'subtract', 3, 2, audio_failure=True)
                assert page.locator('.qc-audio-note').is_visible()
                failed_layout = layout(page); capture(page, 'audio-failure-visual-completion')
                page.evaluate('__quantityChangeSpeech.fail=false'); action(page, 'replay')
                recovered = finish(page, 'subtract', 3, 2)
                action(page, 'mute'); start = mark(page)
                muted = finish(page, 'subtract', 3, 2, muted=True)
                assert muted['muted'] and not entries(page, start, muted['sequence']['runId'])
                return {'failure': failed, 'fallbackLayout': failed_layout, 'recovered': recovered, 'muted': muted}
            run_case('speech failure visual fallback recovery and mute', audio_fallback, (320, 568))

            def unavailable_storage(page):
                enter(page, base)
                choose(page, 'compare', 7, 6); changed = finish(page, 'compare', 7, 6)
                assert changed['storage']['write'] == 'memory-only', changed
                action(page, 'home'); page.locator(CARD).click()
                page.locator('.qc-root').wait_for(state='visible')
                remembered = finish(page, 'compare', 7, 6)
                assert remembered['storage']['read'] == 'memory', remembered
                enter(page, base, reload=True)
                defaulted = finish(page, 'compare', 15, 12)
                assert defaulted['storage']['read'] == 'unavailable', defaulted
                return {'memoryFallback': remembered, 'reloadUsesPlayableDefault': defaulted}
            storage_fixture = """(() => {
              const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
              Storage.prototype.getItem=function(key){if(key==='sihyeon-quantity-change-v1')throw new DOMException('Controlled read denial','SecurityError');return get.call(this,key);};
              Storage.prototype.setItem=function(key,value){if(key==='sihyeon-quantity-change-v1')throw new DOMException('Controlled quota denial','QuotaExceededError');return set.call(this,key,value);};
            })();"""
            run_case('denied storage preserves in-session choices and playable reload', unavailable_storage, init=storage_fixture)
            browser.close()
    except Exception as error:
        report['checks'].append({'name': 'browser setup', 'status': 'FAIL', 'error': str(error), 'trace': traceback.format_exc()})
    finally:
        if server:
            server.shutdown()
    report['passed'] = sum(row['status'] == 'PASS' for row in report['checks'])
    report['failed'] = sum(row['status'] == 'FAIL' for row in report['checks'])
    report['status'] = 'PASS' if report['checks'] and not report['failed'] and not report['pageErrors'] else 'FAIL'
    (out / 'quantity-change-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print('QUANTITY_CHANGE_BROWSER', report['status'], flush=True)
    return 0 if report['status'] == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
