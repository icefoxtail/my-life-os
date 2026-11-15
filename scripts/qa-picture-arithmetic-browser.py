"""Actual Chromium menu/DOM and shared-engine speech request checks.

Only speechSynthesis.speak/cancel are a transport-completion fixture. Production
SihyeonVoice, the quantity sequencer, UI and timers remain intact. This does not
certify audible speech, a physical phone or observed child usability.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import re
import threading
import traceback

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
GAME = 'SihyeonGames.pictureArithmetic.getSnapshot()'
CARD = '.zone-game-card[onclick="openPictureArithmeticGame()"]'
ZONE = '.world-zone[onclick="travelToZone(\'numbers\')"]'
VIEWPORTS = [(320, 568), (360, 640), (390, 844), (844, 390), (1024, 768), (1365, 936)]
NATIVE = ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
          '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물',
          '스물하나', '스물둘', '스물셋', '스물넷', '스물다섯', '스물여섯', '스물일곱', '스물여덟', '스물아홉', '서른']
SPEECH_FIXTURE = r"""(() => {
  const state={entries:[],cancels:[],delayMs:25,available:!!window.speechSynthesis};
  window.__arithmeticSpeech=state;
  if(!window.speechSynthesis)return;
  const pending=new Map();
  speechSynthesis.speak=function(utterance){
    const s=window.SihyeonGames?.pictureArithmetic?.getSnapshot?.();
    const entry={index:state.entries.length,text:utterance.text,lang:utterance.lang,
      startedAt:performance.now(),endedAt:null,cancelledAt:null,
      userGestureSeen:!!navigator.userActivation?.hasBeenActive,
      gameActive:!!s?.active,runId:s?.sequence?.runId??null,
      mode:s?.mode,total:s?.total,counted:s?.counted,moved:s?.moved,
      actualCount:s?.actualCount,poolCount:s?.poolCount,actualGroups:s?.actualGroups};
    state.entries.push(entry);
    const timer=setTimeout(()=>{
      if(!pending.has(entry.index))return;
      pending.delete(entry.index);entry.endedAt=performance.now();utterance.onend?.(new Event('end'));
    },state.delayMs);
    pending.set(entry.index,{timer,entry});
  };
  speechSynthesis.cancel=function(){
    const now=performance.now();state.cancels.push({at:now,pending:[...pending.keys()]});
    for(const {timer,entry} of pending.values()){clearTimeout(timer);entry.cancelledAt=now;}
    pending.clear();
  };
})();"""


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def snap(page):
    return page.evaluate(GAME)


def action(page, name, value=None):
    selector = '[data-pa-action="%s"]' % name
    if value is not None:
        selector += '[data-value="%s"]' % value
    page.locator(selector + ':visible').first.click(timeout=12000)


def mark(page):
    return page.evaluate('__arithmeticSpeech.entries.length')


def requests(page, start, run_id):
    return page.evaluate('([start,id])=>__arithmeticSpeech.entries.slice(start).filter(e=>e.gameActive&&e.runId===id)', [start, run_id])


def enter(page, base, reload=False):
    if reload:
        page.reload(wait_until='load', timeout=45000)
    else:
        page.goto(base + 'index.html', wait_until='load', timeout=45000)
    assert page.evaluate('__arithmeticSpeech.available'), 'speechSynthesis fixture transport missing'
    page.evaluate('window.__arithmeticEngine={api:SihyeonVoice,speak:SihyeonVoice.speak,stop:SihyeonVoice.stop}')
    page.locator(ZONE).click(timeout=15000)
    page.locator(CARD).wait_for(state='visible', timeout=20000)
    start = mark(page)
    page.locator(CARD).click()
    page.locator('.pa-root').wait_for(state='visible')
    assert not snap(page)['error'], snap(page)
    return start


def choose_number(page, n, term=None):
    if term:
        action(page, 'term', term)
    action(page, 'range', 0 if n <= 10 else 1 if n <= 20 else 2)
    start = mark(page)
    action(page, 'number', n)
    return start, snap(page)


def addition(page, a, b):
    action(page, 'mode', 'add')
    # Clearing the second term first allows every valid target sum without truncation.
    choose_number(page, 0, 'b')
    choose_number(page, a, 'a')
    return choose_number(page, b, 'b')


def sharing(page, total, groups):
    action(page, 'mode', 'share')
    choose_number(page, total)
    page.evaluate('__arithmeticSpeech.delayMs=250')
    start = mark(page)
    action(page, 'groups', groups)
    value = snap(page)
    initial = requests(page, start, value['sequence']['runId'])[0]
    assert value['actualCount'] == total, value
    assert initial['actualCount'] == total and initial['poolCount'] == total and initial['actualGroups'] == [0] * groups, initial
    page.evaluate('__arithmeticSpeech.delayMs=25')
    return start, value


def finish(page, mode, total, groups=None, muted=False):
    page.wait_for_function(
        '(wanted)=>{const s=SihyeonGames.pictureArithmetic.getSnapshot();return s.active&&s.mode===wanted.mode&&s.total===wanted.total&&s.complete&&s.sequence?.status==="completed";}',
        arg={'mode': mode, 'total': total}, timeout=30000)
    value = snap(page)
    assert value['actualCount'] == total, value
    assert not value['audioFailed'] and value['sequence']['audioFailed'] == 0, value
    assert page.locator('.pa-item.is-current').count() == 0
    if mode == 'add':
        assert value['actualLeft'] == value['a'] and value['actualRight'] == value['b'], value
        assert value['counted'] == total, value
        expected_steps = total + 1
    else:
        each, remainder = divmod(total, groups)
        assert value['groups'] == groups and value['each'] == each and value['remainder'] == remainder, value
        assert value['actualGroups'] == [each] * groups and value['poolCount'] == remainder, value
        assert value['moved'] == total - remainder, value
        assert sum(value['actualGroups']) + value['poolCount'] == total, value
        expected_steps = total - remainder + 2
    assert value['sequence']['completedSteps'] == expected_steps, value
    assert value['sequence']['audioAttempted'] == (0 if muted else expected_steps), value
    assert value['sequence']['audioSucceeded'] == (0 if muted else expected_steps), value
    assert page.evaluate('__arithmeticEngine.api===SihyeonVoice&&__arithmeticEngine.speak===SihyeonVoice.speak&&__arithmeticEngine.stop===SihyeonVoice.stop'), 'Shared engine was replaced'
    return value


def speech(page, start, value, expected_counts=None, lang='ko-KR'):
    entries = requests(page, start, value['sequence']['runId'])
    assert entries and all(e['lang'] == lang and e['endedAt'] is not None for e in entries), entries
    assert all(e['userGestureSeen'] for e in entries), entries
    if lang == 'en-US':
        assert all(not re.search('[가-힣]', e['text']) for e in entries), entries
    if expected_counts is not None:
        counts = entries[:-1] if value['mode'] == 'add' else entries[1:-1]
        assert [e['text'] for e in counts] == expected_counts, entries
    return [{'text': e['text'], 'lang': e['lang']} for e in entries]


def layout(page):
    page.wait_for_function("[...document.querySelectorAll('.pa-root img')].every(img=>img.complete)", timeout=15000)
    result = page.evaluate("""()=>{
      const root=document.querySelector('.pa-root'),r=root.getBoundingClientRect(),b=root.querySelector('.pa-board').getBoundingClientRect();
      return {viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,
        root:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,clientWidth:root.clientWidth,scrollWidth:root.scrollWidth,clientHeight:root.clientHeight,scrollHeight:root.scrollHeight},
        board:{width:b.width,height:b.height},brokenImages:[...root.querySelectorAll('img')].filter(img=>!img.naturalWidth).map(img=>img.getAttribute('src'))};
    }""")
    width, height = result['viewport']
    bounds = result['root']
    assert result['documentWidth'] <= width + 1, result
    assert bounds['left'] >= -1 and bounds['top'] >= -1 and bounds['right'] <= width + 1 and bounds['bottom'] <= height + 1, result
    assert bounds['scrollWidth'] <= bounds['clientWidth'] + 1 and bounds['scrollHeight'] <= bounds['clientHeight'] + 1, result
    assert result['board']['width'] > 0 and result['board']['height'] >= 32, result
    assert not result['brokenImages'], result
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', '--base-url', dest='base')
    parser.add_argument('--output', default='qa-picture-arithmetic-evidence')
    args = parser.parse_args()
    out = pathlib.Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    report = {'scope': 'Actual Chromium menu/native click/DOM checks with lower speechSynthesis transport completion fixture',
              'nativeAudio': {'status': 'NOT_RUN', 'reason': 'No speaker hearing, physical device or child-observation claim'},
              'fixture': {'sharedVoiceEngineReplaced': False, 'gameTimersReplaced': False},
              'checks': [], 'pageErrors': [], 'screenshots': [], 'sources': {}}
    for relative in ['index.html', 'js/games/picture-arithmetic.js', 'css/games/picture-arithmetic.css',
                     'js/games/quantity-play-model.js', 'js/quantity-sequencer.js', 'js/play-objects.js',
                     'js/voice-engine.js', 'scripts/qa-picture-arithmetic-browser.py']:
        source = ROOT / relative
        if source.exists():
            report['sources'][relative] = hashlib.sha256(source.read_bytes()).hexdigest()
    server = None
    if args.base:
        base = args.base.rstrip('/') + '/'
    else:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = 'http://127.0.0.1:%s/' % server.server_address[1]
    report['baseUrl'] = base

    def capture(page, name):
        filename = 'picture-arithmetic-' + name + '.png'
        page.screenshot(path=str(out / filename), full_page=True, timeout=15000)
        report['screenshots'].append(filename)
        return filename

    def check(name, fn, page):
        try:
            entry = {'name': name, 'status': 'PASS', 'detail': fn()}
        except Exception as exc:
            entry = {'name': name, 'status': 'FAIL', 'error': str(exc), 'trace': traceback.format_exc()}
            try:
                entry['screenshot'] = capture(page, 'failure-' + re.sub('[^a-zA-Z0-9]+', '-', name))
                entry['snapshot'] = page.evaluate('window.SihyeonGames?.pictureArithmetic?.getSnapshot?.()||null')
            except Exception:
                pass
        report['checks'].append(entry)
        print(json.dumps(entry, ensure_ascii=False), flush=True)

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            report['browser'] = browser.version
            for width, height in VIEWPORTS:
                context = browser.new_context(viewport={'width': width, 'height': height}, service_workers='block')
                context.add_init_script(SPEECH_FIXTURE)
                page = context.new_page()
                page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))

                def initial_add():
                    start = enter(page, base)
                    before = snap(page)
                    assert [before['a'], before['b'], before['actualCount']] == [9, 6, 15], before
                    assert [before['leftObjectId'], before['rightObjectId']] == ['korean_police_car', 'pump_engine'], before
                    value = finish(page, 'add', 15)
                    text = speech(page, start, value, NATIVE[:15])
                    dimensions = layout(page)
                    return {'snapshot': value, 'speech': text, 'layout': dimensions, 'screenshot': capture(page, 'add-%sx%s' % (width, height))}
                check('9 police + 6 fire / %sx%s' % (width, height), initial_add, page)

                def fifteen_four():
                    start, before = sharing(page, 15, 4)
                    # Record identities and every observable move, independently of model fields.
                    page.evaluate("""()=>{
                      window.__paOriginals=[...document.querySelectorAll('.pa-item')];window.__paConservation=[];
                      window.__paObserver?.disconnect();
                      window.__paObserver=new MutationObserver(()=>{
                        const s=SihyeonGames.pictureArithmetic.getSnapshot(),nodes=[...document.querySelectorAll('.pa-item')];
                        __paConservation.push({actual:nodes.length,same:nodes.every(n=>__paOriginals.includes(n)),groups:s.actualGroups,pool:s.poolCount});
                      });
                      __paObserver.observe(document.querySelector('.pa-board'),{childList:true,subtree:true});
                    }""")
                    value = finish(page, 'share', 15, 4)
                    observations = page.evaluate('(()=>{__paObserver.disconnect();return __paConservation;})()')
                    assert observations, 'No DOM moves were observed'
                    assert all(x['actual'] == 15 and x['same'] and sum(x['groups']) + x['pool'] == 15 for x in observations), observations
                    assert all(max(x['groups']) - min(x['groups']) <= 1 for x in observations), observations
                    text = speech(page, start, value, ['하나'] * 4 + ['둘'] * 4 + ['셋'] * 4)
                    dimensions = layout(page)
                    return {'initial': before, 'snapshot': value, 'speech': text, 'observedMoves': len(observations), 'layout': dimensions, 'screenshot': capture(page, 'share-%sx%s' % (width, height))}
                check('15 shared among 4 / %sx%s' % (width, height), fifteen_four, page)

                if (width, height) == (390, 844):
                    def boundaries():
                        cases = []
                        for a, b in [(0, 0), (30, 0)]:
                            start, before = addition(page, a, b)
                            assert before['actualCount'] == a + b, before
                            value = finish(page, 'add', a + b)
                            cases.append({'operation': '%s+%s' % (a, b), 'snapshot': value, 'speech': speech(page, start, value, NATIVE[:a+b])})
                        for total, groups in [(3, 5), (0, 3), (30, 6)]:
                            start, _ = sharing(page, total, groups)
                            value = finish(page, 'share', total, groups)
                            counts = [word for word in NATIVE[:total // groups] for _ in range(groups)]
                            cases.append({'operation': '%s/%s' % (total, groups), 'snapshot': value, 'speech': speech(page, start, value, counts)})
                        return cases
                    check('zero, thirty and incomplete rounds', boundaries, page)

                    def independent_pictures():
                        addition(page, 9, 6)
                        action(page, 'term', 'b'); action(page, 'category', 'food')
                        action(page, 'object', 'cookie')
                        value = finish(page, 'add', 15)
                        assert value['leftObjectId'] == 'korean_police_car' and value['rightObjectId'] == 'cookie', value
                        assert page.locator('.pa-item[data-object-id="korean_police_car"]').count() == 9
                        assert page.locator('.pa-item[data-object-id="cookie"]').count() == 6
                        return value
                    check('independent types for the two addends', independent_pictures, page)

                    def rapid_changes():
                        addition(page, 5, 2)
                        page.evaluate('__arithmeticSpeech.delayMs=400')
                        action(page, 'replay')
                        old = snap(page)
                        _, replacement = choose_number(page, 8, 'a')
                        start = mark(page)
                        page.evaluate('__arithmeticSpeech.delayMs=25')
                        value = finish(page, 'add', 10)
                        stale = page.evaluate('([start,id])=>__arithmeticSpeech.entries.slice(start).filter(e=>e.runId===id)', [start, old['sequence']['runId']])
                        assert not stale, stale
                        assert page.evaluate('id=>__arithmeticSpeech.entries.some(e=>e.runId===id&&e.cancelledAt!==null)', old['sequence']['runId'])
                        page.evaluate('__arithmeticSpeech.delayMs=400'); action(page, 'replay')
                        old = snap(page)
                        action(page, 'mode', 'share')
                        start = mark(page)
                        page.evaluate('__arithmeticSpeech.delayMs=25')
                        sharing(page, 3, 5); shared_result = finish(page, 'share', 3, 5)
                        assert not page.evaluate('([start,id])=>__arithmeticSpeech.entries.slice(start).some(e=>e.runId===id)', [start, old['sequence']['runId']])
                        return {'replacement': replacement, 'addition': value, 'sharing': shared_result}
                    check('rapid quantity and mode replacement cancel prior speech', rapid_changes, page)

                    def settings_and_languages():
                        addition(page, 2, 3)
                        action(page, 'style', 'sino'); start = mark(page); action(page, 'replay')
                        value = finish(page, 'add', 5)
                        sino = speech(page, start, value, ['일', '이', '삼', '사', '오'])
                        action(page, 'settings'); page.locator('#playSettingsDialog').wait_for(state='visible')
                        assert snap(page)['sequence']['status'] == 'cancelled'
                        page.locator('[data-play-age="7"]').click()
                        assert snap(page)['age'] == 7 and snap(page)['total'] == 5
                        page.locator('[data-ps-language="en"]').click()
                        start = mark(page); page.locator('[data-ps-close]').last.click()
                        page.locator('#playSettingsDialog').wait_for(state='detached')
                        value = finish(page, 'add', 5)
                        english = speech(page, start, value, ['one', 'two', 'three', 'four', 'five'], 'en-US')
                        action(page, 'settings'); start = mark(page); page.locator('[data-ps-close]').last.click()
                        unchanged = finish(page, 'add', 5)
                        speech(page, start, unchanged, ['one', 'two', 'three', 'four', 'five'], 'en-US')
                        action(page, 'settings'); page.locator('[data-ps-language="ko"]').click(); page.locator('[data-ps-close]').last.click()
                        finish(page, 'add', 5)
                        action(page, 'style', 'native')
                        return {'sino': sino, 'english': english, 'unchangedCloseResumed': unchanged}
                    check('reading modes and settings close automatically resume', settings_and_languages, page)

                    def persistence():
                        addition(page, 7, 6)
                        value = finish(page, 'add', 13)
                        enter(page, base, reload=True)
                        restored = finish(page, 'add', 13)
                        assert [restored['a'], restored['b']] == [7, 6], restored
                        page.evaluate("""()=>{
                          window.__paOriginalSet=Storage.prototype.setItem;
                          Storage.prototype.setItem=function(key,value){if(key==='sihyeon-picture-arithmetic-v1')throw new DOMException('Controlled quota failure','QuotaExceededError');return __paOriginalSet.call(this,key,value);};
                        }""")
                        try:
                            choose_number(page, 8, 'a')
                            changed = snap(page)
                            assert changed['storage']['write'] == 'memory-only', changed
                            action(page, 'home'); page.locator(CARD).click(); page.locator('.pa-root').wait_for(state='visible')
                            recovered = finish(page, 'add', 14)
                            assert recovered['a'] == 8 and recovered['storage']['read'] == 'memory', recovered
                            disk = page.evaluate("JSON.parse(localStorage.getItem('sihyeon-picture-arithmetic-v1'))")
                            assert disk['a'] == 7, disk
                        finally:
                            page.evaluate('Storage.prototype.setItem=__paOriginalSet')
                        return {'saved': value, 'reloaded': restored, 'memoryRecovered': recovered}
                    check('reload restoration and memory after failed storage writes', persistence, page)

                    def mute_and_exit():
                        sharing(page, 3, 5)
                        action(page, 'mute')
                        value = finish(page, 'share', 3, 5, muted=True)
                        assert value['muted'] is True
                        action(page, 'mute'); action(page, 'replay')
                        old = snap(page)
                        action(page, 'home')
                        start = mark(page)
                        page.wait_for_timeout(650)
                        assert not snap(page)['active']
                        assert not page.evaluate('([start,id])=>__arithmeticSpeech.entries.slice(start).some(e=>e.gameActive&&e.runId===id)', [start, old['sequence']['runId']])
                        return {'mutedCompletion': value, 'exitActive': snap(page)['active']}
                    check('mute keeps visual sharing and exit cancels future steps', mute_and_exit, page)

                context.close()
            browser.close()
    except Exception as exc:
        report['checks'].append({'name': 'browser setup', 'status': 'FAIL', 'error': str(exc), 'trace': traceback.format_exc()})
    finally:
        if server:
            server.shutdown()
    report['status'] = 'FAIL' if report['pageErrors'] or any(check['status'] == 'FAIL' for check in report['checks']) else 'PASS'
    (out / 'picture-arithmetic-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print('PICTURE_ARITHMETIC_BROWSER', report['status'], flush=True)
    return 0 if report['status'] == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
