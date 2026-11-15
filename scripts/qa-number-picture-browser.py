"""Actual Chromium/menu/DOM evidence for automatic picture counting.

The production SihyeonVoice engine and sequencer are not replaced. Only the
speechSynthesis speak/cancel transport is a fast completion fixture. This checks
requested text, cancellation and completion; it does NOT certify audible/native
TTS, a physical phone, or child usability. Launch in CI with installed Playwright.
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
from urllib.parse import unquote

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
GAME = "SihyeonGames.numberPicture.getSnapshot()"
CARD = '.zone-game-card[onclick="openNumberPictureGame()"]'
NUMBER_ZONE = '.world-zone[onclick="travelToZone(\'numbers\')"]'
VIEWPORTS = [(320, 568), (360, 640), (390, 844), (844, 390), (1024, 768), (1365, 936)]
NATIVE = [
    '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
    '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물',
    '스물하나', '스물둘', '스물셋', '스물넷', '스물다섯', '스물여섯', '스물일곱', '스물여덟', '스물아홉', '서른',
]
SINO_NINE = ['일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
ENGLISH_NINE = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

# add_init_script runs before the production engine. Native utterance objects,
# the shared engine's request generations, and all game timers remain real.
SPEECH_FIXTURE = r"""(() => {
  const state = {kind:'speechSynthesis transport completion fixture', delayMs:25,
    entries:[], cancels:[], available:!!window.speechSynthesis};
  window.__numberPictureSpeech = state;
  window.__numberPictureFocus = function() {
    const game=window.SihyeonGames?.numberPicture?.getSnapshot?.();
    const root=document.querySelector('.qp-root'),board=root?.querySelector('.qp-board');
    if(!game?.active||!board)return null;
    const area=board.getBoundingClientRect();
    const bounds={top:area.top+board.clientTop,left:area.left+board.clientLeft,
      bottom:area.top+board.clientTop+board.clientHeight,right:area.left+board.clientLeft+board.clientWidth};
    const ordinal=Math.min(game.quantity,game.complete?game.quantity:game.counted);
    const item=ordinal?board.querySelector('[data-object-index="'+(ordinal-1)+'"]'):null;
    const rect=item?.getBoundingClientRect();
    const inside=(a,b)=>a.top>=b.top-1&&a.left>=b.left-1&&a.bottom<=b.bottom+1&&a.right<=b.right+1;
    const summary=root.querySelector('.qp-summary').getBoundingClientRect();
    const textBounds=[...root.querySelectorAll('.qp-target,.qp-count-now,.qp-count-word')].map(el=>{
      const r=el.getBoundingClientRect();
      return {className:el.className,text:el.textContent,inside:inside(r,summary),
        width:r.width,height:r.height,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth};
    });
    const grid=board.querySelector('.qp-items,.qp-ten');
    return {ordinal,fullyVisible:!rect||inside(rect,bounds),board:bounds,
      item:rect?{top:rect.top,left:rect.left,bottom:rect.bottom,right:rect.right,width:rect.width,height:rect.height}:null,
      boardScrollTop:board.scrollTop,stageScrollTop:root.querySelector('.qp-stage').scrollTop,
      rootScrollTop:root.scrollTop,rootScrollLeft:root.scrollLeft,
      columns:grid?getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length:0,textBounds};
  };
  const synth = window.speechSynthesis;
  if (!synth) return;
  const pending = new Map();
  synth.speak = function(utterance) {
    const game = window.SihyeonGames?.numberPicture?.getSnapshot?.();
    const entry = {index:state.entries.length, text:utterance.text, lang:utterance.lang,
      startedAt:performance.now(), endedAt:null, cancelledAt:null,
      userGestureSeen:!!navigator.userActivation?.hasBeenActive,
      gameActive:!!game?.active, runId:game?.sequence?.runId ?? null,
      quantity:game?.quantity ?? null, counted:game?.counted ?? null,
      visibility:game?.active?window.__numberPictureFocus():null};
    state.entries.push(entry);
    const timer = setTimeout(() => {
      if (!pending.has(entry.index)) return;
      pending.delete(entry.index);
      entry.endedAt = performance.now();
      utterance.onend?.(new Event('end'));
    }, state.delayMs);
    pending.set(entry.index, {timer, entry});
  };
  synth.cancel = function() {
    const now = performance.now();
    state.cancels.push({at:now, pending:[...pending.keys()]});
    for (const {timer,entry} of pending.values()) {
      clearTimeout(timer);
      entry.cancelledAt = now;
    }
    pending.clear();
  };
})();"""


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def snap(page):
    return page.evaluate(GAME)


def mark(page):
    return page.evaluate('window.__numberPictureSpeech.entries.length')


def speech_for(page, start, run_id):
    return page.evaluate(
        '([start,id]) => __numberPictureSpeech.entries.slice(start).filter(x => x.gameActive && x.runId === id)',
        [start, run_id],
    )


def action(page, name, value=None, scope=None):
    selector = '[data-qp-action="%s"]' % name
    if value is not None:
        selector += '[data-value="%s"]' % value
    # A visible modal has a duplicate of the inline object buttons; scope it.
    target = (scope or page).locator(selector + ':visible').first
    target.click(timeout=12000)


def select_picture(page, object_id):
    # Exercise the same large picture chooser at every size, including the
    # compact layouts where the inline category/object rows are deliberately hidden.
    action(page, 'choosePicture')
    modal = page.locator('.qp-picture-modal')
    modal.wait_for(state='visible')
    start = mark(page)
    action(page, 'object', object_id, scope=modal)
    modal.wait_for(state='detached')
    assert snap(page)['objectId'] == object_id
    return start, snap(page)


def select_number(page, quantity):
    action(page, 'range', 0 if quantity <= 10 else 1 if quantity <= 20 else 2)
    start = mark(page)
    action(page, 'number', quantity)
    value = snap(page)
    assert value['quantity'] == quantity and value['actualCount'] == quantity, value
    return start, value


def finish(page, quantity):
    page.wait_for_function(
        'n => {const s=SihyeonGames.numberPicture.getSnapshot(); return s.active && s.quantity===n && s.complete && s.sequence?.status==="completed";}',
        arg=quantity, timeout=25000,
    )
    value = snap(page)
    assert value['actualCount'] == quantity and value['counted'] == quantity, value
    assert value['sequence']['completedSteps'] == quantity + 1, value
    assert value['sequence']['audioSucceeded'] == quantity + 1, value
    assert value['sequence']['audioFailed'] == 0 and not value['audioFailed'], value
    assert page.locator('.qp-item.is-counted').count() == quantity
    assert page.locator('.qp-item.is-current').count() == 0
    assert page.evaluate('window.__qpEngineReference.api===SihyeonVoice && window.__qpEngineReference.speak===SihyeonVoice.speak && window.__qpEngineReference.stop===SihyeonVoice.stop'), 'shared voice engine was replaced'
    # The onStep callback must make the current picture visible before speech.
    # Also verify completion after layout/ResizeObserver callbacks have settled.
    spoken = page.evaluate('([id,n])=>__numberPictureSpeech.entries.filter(x=>x.gameActive&&x.runId===id&&x.quantity===n).slice(-(n+1))', [value['sequence']['runId'], quantity])
    clipped = [entry for entry in spoken if entry['visibility'] and not entry['visibility']['fullyVisible']]
    assert not clipped, {'clippedWhileCounting':clipped[:3]}
    page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
    value['browserVisibility'] = assert_focus_visible(page)
    return value


def assert_focus_visible(page):
    data = page.evaluate('window.__numberPictureFocus()')
    assert data is not None and data['fullyVisible'], {'clippedCurrentOrLastPicture':data}
    assert data['rootScrollTop'] == 0 and data['rootScrollLeft'] == 0 and data['stageScrollTop'] == 0, {'anAncestorScrolled':data}
    assert all(text['inside'] and text['scrollWidth'] <= text['clientWidth'] + 1 for text in data['textBounds']), {'clippedSummary':data}
    value = snap(page)
    if value['quantity']:
        expected_columns = 5 if value['layout'] == 'tens' or value['quantity'] > 10 else 3
        assert data['columns'] == expected_columns, data
    return data


def assert_speech(page, start, value, expected, lang='ko-KR'):
    entries = speech_for(page, start, value['sequence']['runId'])
    assert [entry['text'] for entry in entries] == expected, entries
    assert all(entry['lang'] == lang and entry['endedAt'] is not None for entry in entries), entries
    assert all(entry['userGestureSeen'] for entry in entries), 'expected real menu/control user gestures'
    return [{'text':entry['text'], 'lang':entry['lang']} for entry in entries]


def retain_engine_reference(page):
    page.evaluate('window.__qpEngineReference={api:SihyeonVoice,speak:SihyeonVoice.speak,stop:SihyeonVoice.stop}')
    assert page.evaluate('window.__numberPictureSpeech.available'), 'speechSynthesis transport unavailable'


def enter(page, base, reload=False):
    if reload:
        page.reload(wait_until='load', timeout=45000)
    else:
        page.goto(base + 'index.html', wait_until='load', timeout=45000)
    retain_engine_reference(page)
    page.locator(NUMBER_ZONE).click(timeout=15000)
    page.locator(CARD).wait_for(state='visible', timeout=20000)
    start = mark(page)
    page.locator(CARD).click()
    page.locator('.qp-root').wait_for(state='visible')
    return start


def image_and_layout(page, allow_missing=False):
    page.wait_for_function("[...document.querySelectorAll('.qp-root img')].every(img => img.complete)", timeout=15000)
    data = page.evaluate("""() => {
      const root=document.querySelector('.qp-root'), r=root.getBoundingClientRect();
      const board=root.querySelector('.qp-board'), b=board.getBoundingClientRect();
      return {viewport:[innerWidth,innerHeight], documentWidth:document.documentElement.scrollWidth,
        root:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,
          clientWidth:root.clientWidth,scrollWidth:root.scrollWidth,clientHeight:root.clientHeight,scrollHeight:root.scrollHeight},
        board:{width:b.width,height:b.height},
        brokenImages:[...root.querySelectorAll('img')].filter(img=>!img.naturalWidth).map(img=>({
          src:img.getAttribute('src'),fallback:!!img.closest('.qp-picture')?.classList.contains('missing')}))};
    }""")
    width, height = data['viewport']
    bounds = data['root']
    assert data['documentWidth'] <= width + 1, data
    assert bounds['left'] >= -1 and bounds['top'] >= -1 and bounds['right'] <= width + 1 and bounds['bottom'] <= height + 1, data
    assert bounds['scrollWidth'] <= bounds['clientWidth'] + 1, data
    assert bounds['scrollHeight'] <= bounds['clientHeight'] + 1, data
    assert data['board']['height'] >= 40 and data['board']['width'] > 0, data
    if not allow_missing:
        assert not data['brokenImages'], data
    data['focusVisibility'] = assert_focus_visible(page)
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', '--base-url', dest='base_url')
    parser.add_argument('--output', default='qa-number-picture-evidence')
    args = parser.parse_args()
    out = pathlib.Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    report = {
        'scope':'Actual Chromium menu and native locator clicks, DOM quantities, requested speech text and cancellation; transport-completion fixture only',
        'nativeAudio':{'status':'NOT_RUN', 'reason':'speechSynthesis speak/cancel are a fixture; no speaker hearing or physical-device claim'},
        'fixture':{'transport':'speechSynthesis.speak/cancel', 'defaultCompletionMs':25, 'sharedVoiceEngineReplaced':False, 'gameTimersReplaced':False},
        'checks':[], 'pageErrors':[], 'sources':{}, 'screenshots':[],
    }
    for relative in [
        'index.html', 'js/games/number-picture.js', 'js/games/quantity-play-model.js',
        'js/quantity-sequencer.js', 'js/play-objects.js', 'js/voice-engine.js',
        'js/play-settings.js', 'css/games/number-picture.css', 'js/games/art-zone.js',
        'scripts/qa-number-picture-browser.py',
    ]:
        path = ROOT / relative
        if path.exists():
            report['sources'][relative] = hashlib.sha256(path.read_bytes()).hexdigest()

    server = None
    current = {'name':'startup'}
    if args.base_url:
        base = args.base_url.rstrip('/') + '/'
    else:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = 'http://127.0.0.1:%s/' % server.server_address[1]
    report['baseUrl'] = base

    def screenshot(page, name):
        filename = 'number-picture-' + name + '.png'
        page.screenshot(path=str(out / filename), full_page=True, timeout=15000)
        report['screenshots'].append(filename)
        return filename

    def check(name, fn, page=None):
        current['name'] = name
        try:
            detail = fn()
            status = 'NOT_APPLICABLE' if isinstance(detail, dict) and detail.get('notApplicable') else 'PASS'
            result = {'name':name, 'status':status, 'detail':detail}
        except Exception as exc:
            result = {'name':name, 'status':'FAIL', 'error':str(exc), 'trace':traceback.format_exc()}
            if page and not page.is_closed():
                try:
                    result['screenshot'] = screenshot(page, 'failure-' + re.sub(r'[^a-zA-Z0-9]+', '-', name).strip('-')[:90])
                    result['snapshot'] = page.evaluate('window.SihyeonGames?.numberPicture?.getSnapshot?.() || null')
                except Exception:
                    pass
        report['checks'].append(result)
        print(json.dumps(result, ensure_ascii=False), flush=True)

    def context_page(browser, size=(390, 844)):
        context = browser.new_context(viewport={'width':size[0], 'height':size[1]}, service_workers='block')
        context.add_init_script(script=SPEECH_FIXTURE)
        page = context.new_page()
        page.set_default_timeout(12000)
        page.on('pageerror', lambda error, pg=page: report['pageErrors'].append({'check':current['name'], 'url':pg.url, 'message':str(error)}))
        return context, page

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            report['browser'] = browser.version

            ctx, page = context_page(browser)

            def initial_nine():
                start = enter(page, base)
                initial = snap(page)
                assert initial['objectId'] == 'korean_police_car' and initial['quantity'] == 9 and initial['actualCount'] == 9, initial
                assert initial['readingStyle'] == 'native' and initial['counted'] < 9, initial
                completed = finish(page, 9)
                assert page.locator('.qp-count-word').inner_text() == '아홉 대'
                heard = assert_speech(page, start, completed, NATIVE[:9] + ['모두 경찰차 아홉 대!'])
                layout = image_and_layout(page)
                screenshot(page, 'police9-native-390x844')
                return {'initial':initial, 'completed':completed, 'speech':heard, 'layout':layout}
            check('real menu to immediate police9 and automatic native count', initial_nine, page)

            def fire_fifteen():
                select_picture(page, 'pump_engine')
                start, initial = select_number(page, 15)
                assert initial['counted'] < 15 and initial['objectId'] == 'pump_engine', initial
                completed = finish(page, 15)
                heard = assert_speech(page, start, completed, NATIVE[:15] + ['모두 소방차 열다섯 대!'])
                screenshot(page, 'fire15-native-390x844')
                return {'initial':initial, 'completed':completed, 'speech':heard}
            check('picture chooser and fifteen fire engines appear before counting finishes', fire_fifteen, page)

            def sino_and_boundaries():
                select_picture(page, 'korean_police_car')
                select_number(page, 9)
                start = mark(page)
                action(page, 'style', 'sino')
                nine = finish(page, 9)
                heard = assert_speech(page, start, nine, SINO_NINE + ['모두 경찰차 아홉 대!'])
                start, zero_initial = select_number(page, 0)
                zero = finish(page, 0)
                assert page.locator('.qp-zero').is_visible()
                assert page.locator('[data-qp-action="minus"]').is_disabled()
                assert_speech(page, start, zero, ['경찰차가 없어요. 영이에요.'])
                screenshot(page, 'zero-390x844')
                action(page, 'style', 'native')
                start, thirty_initial = select_number(page, 30)
                assert thirty_initial['actualCount'] == 30 and thirty_initial['counted'] < 30, thirty_initial
                thirty = finish(page, 30)
                assert_speech(page, start, thirty, NATIVE + ['모두 경찰차 서른 대!'])
                assert page.locator('[data-qp-action="plus"]').is_disabled()
                action(page, 'minus')
                assert snap(page)['quantity'] == 29 and snap(page)['actualCount'] == 29
                action(page, 'plus')
                finish(page, 30)
                return {'sinoNine':nine, 'sinoSpeech':heard, 'zeroInitial':zero_initial, 'zero':zero, 'thirtyInitial':thirty_initial, 'thirty':thirty, 'plusMinus':True}
            check('sino nine zero thirty and plus-minus boundaries', sino_and_boundaries, page)

            for width, height in VIEWPORTS:
                def viewport_check(width=width, height=height):
                    page.set_viewport_size({'width':width, 'height':height})
                    page.wait_for_timeout(250)
                    before = snap(page)
                    assert before['quantity'] == 30 and before['actualCount'] == 30 and before['complete'], before
                    layout = image_and_layout(page)
                    image = screenshot(page, '%sx%s-thirty' % (width, height))
                    # All six sizes must support the real chooser, including hidden inline rows.
                    action(page, 'choosePicture')
                    modal = page.locator('.qp-picture-modal')
                    assert modal.is_visible()
                    modal.locator('[data-qp-action="closePictures"]').click()
                    page.wait_for_function('SihyeonGames.numberPicture.getSnapshot().sequence.running')
                    completed = finish(page, 30)
                    return {'viewport':[width,height], 'layout':layout, 'screenshot':image, 'chooserClosedAndResumed':True,
                            'currentPicturesAndLastPictureVisible':completed['browserVisibility']}
                check('responsive root and chooser %sx%s' % (width, height), viewport_check, page)
            ctx.close()

            ctx, page = context_page(browser)

            def replacement_and_repaint():
                enter(page, base)
                # Keep an utterance pending across the three native UI clicks;
                # this avoids racing the normal 170ms inter-word pause in CI.
                page.evaluate('__numberPictureSpeech.delayMs=2500')
                _, old = select_number(page, 30)
                page.wait_for_function('SihyeonGames.numberPicture.getSnapshot().counted>=2')
                before = snap(page)
                # These are view-only changes: no restart, no forgotten highlights.
                action(page, 'category', 'food')
                category = snap(page)
                assert category['sequence']['runId'] == before['sequence']['runId'] and category['counted'] >= before['counted'], (before, category)
                assert page.locator('[data-qp-action="category"][data-value="food"]').get_attribute('aria-pressed') == 'true'
                action(page, 'range', 0)
                ranged = snap(page)
                assert ranged['sequence']['runId'] == before['sequence']['runId'] and ranged['counted'] >= category['counted'], (category, ranged)
                assert ranged['objectId'] == before['objectId'] and ranged['quantity'] == 30 and ranged['actualCount'] == 30
                assert page.locator('[data-qp-action="range"][data-value="0"]').get_attribute('aria-pressed') == 'true'
                assert page.evaluate('document.querySelectorAll(".qp-item.is-counted").length===SihyeonGames.numberPicture.getSnapshot().counted')
                start = mark(page)
                page.evaluate('__numberPictureSpeech.delayMs=25')
                action(page, 'number', 9)
                replaced = snap(page)
                assert replaced['sequence']['runId'] > old['sequence']['runId'] and replaced['counted'] < 9, replaced
                completed = finish(page, 9)
                assert_speech(page, start, completed, NATIVE[:9] + ['모두 경찰차 아홉 대!'])
                old_late = speech_for(page, start, old['sequence']['runId'])
                assert not old_late, old_late
                cancelled = page.evaluate('(id)=>__numberPictureSpeech.entries.filter(x=>x.gameActive&&x.runId===id&&x.cancelledAt!==null)', old['sequence']['runId'])
                assert cancelled, 'expected the pending old speech transport to be cancelled'
                return {'before':before, 'category':category, 'range':ranged, 'replacement':replaced, 'completed':completed, 'cancelledPendingSpeech':len(cancelled)}
            check('view-only category/range preserve progress and new number cancels old run', replacement_and_repaint, page)

            def settings_close():
                select_number(page, 15)
                page.evaluate('__numberPictureSpeech.delayMs=350')
                action(page, 'replay')
                page.wait_for_function('SihyeonGames.numberPicture.getSnapshot().counted>=2')
                before = snap(page)
                action(page, 'settings')
                page.locator('#playSettingsDialog').wait_for(state='visible')
                stopped = snap(page)
                assert not stopped['sequence']['running'], stopped
                page.wait_for_timeout(500)
                assert snap(page)['counted'] == stopped['counted'], 'count advanced behind settings'
                page.evaluate('__numberPictureSpeech.delayMs=25')
                start = mark(page)
                page.get_by_role('button', name='설정 닫기', exact=True).click()
                page.locator('#playSettingsDialog').wait_for(state='detached')
                resumed = snap(page)
                assert resumed['sequence']['runId'] > before['sequence']['runId'], (before, resumed)
                assert resumed['quantity'] == 15 and resumed['objectId'] == before['objectId'] and resumed['readingStyle'] == before['readingStyle']
                completed = finish(page, 15)
                assert_speech(page, start, completed, NATIVE[:15] + ['모두 경찰차 열다섯 대!'])
                return {'before':before, 'paused':stopped, 'resumed':resumed, 'completed':completed, 'settingsChanged':False}
            check('closing unchanged settings automatically restarts the preserved selection', settings_close, page)

            def leave_and_restore():
                select_picture(page, 'pump_engine')
                select_number(page, 15)
                action(page, 'style', 'sino')
                action(page, 'layout')
                page.evaluate('__numberPictureSpeech.delayMs=450')
                action(page, 'replay')
                page.wait_for_function('SihyeonGames.numberPicture.getSnapshot().counted>=2')
                before = snap(page)
                action(page, 'home')
                page.locator(CARD).wait_for(state='visible')
                left_mark = mark(page)
                left = snap(page)
                assert not left['active'] and left['sequence'] is None, left
                page.wait_for_timeout(800)
                assert not snap(page)['active']
                late = page.evaluate('(i)=>__numberPictureSpeech.entries.slice(i).filter(x=>x.gameActive)', left_mark)
                assert not late, late
                page.evaluate('__numberPictureSpeech.delayMs=25')
                page.locator(CARD).click()
                restored = snap(page)
                for key in ['objectId','quantity','readingStyle','layout','muted']:
                    assert restored[key] == before[key], (key, before, restored)
                finish(page, 15)
                enter(page, base, reload=True)
                reloaded = snap(page)
                for key in ['objectId','quantity','readingStyle','layout','muted']:
                    assert reloaded[key] == before[key], (key, before, reloaded)
                finish(page, 15)
                stored = page.evaluate("JSON.parse(localStorage.getItem('sihyeon-number-picture-v1'))")
                screenshot(page, 'saved-fire15-sino-tens-reloaded')
                return {'before':before, 'left':left, 'returned':restored, 'reloaded':reloaded, 'saved':stored}
            check('home cancels counting and selection survives return plus full reload', leave_and_restore, page)
            ctx.close()

            ctx, page = context_page(browser)

            def english():
                enter(page, base)
                action(page, 'settings')
                page.locator('#playSettingsDialog').wait_for(state='visible')
                page.locator('[data-ps-language="en"]').click()
                page.wait_for_timeout(80)
                assert snap(page)['language'] == 'en' and not snap(page)['sequence']['running'], snap(page)
                start = mark(page)
                page.get_by_role('button', name='설정 닫기', exact=True).click()
                completed = finish(page, 9)
                heard = assert_speech(page, start, completed, ENGLISH_NINE + ['There are nine police cars.'], 'en-US')
                start, _ = select_number(page, 1)
                one = finish(page, 1)
                assert_speech(page, start, one, ['one', 'There is one police car.'], 'en-US')
                start, _ = select_number(page, 0)
                zero = finish(page, 0)
                assert_speech(page, start, zero, ['There are none. Zero.'], 'en-US')
                screenshot(page, 'english-zero')
                return {'nine':completed, 'speech':heard, 'one':one, 'zero':zero, 'nativeAudio':'NOT_RUN'}
            check('English settings use English count text and singular/plural totals', english, page)
            ctx.close()

            # Missing dependencies must leave a real, clickable route to the menu.
            for name, pattern in [
                ('model','**/js/games/quantity-play-model.js'),
                ('sequencer','**/js/quantity-sequencer.js'),
                ('catalog','**/js/play-objects.js'),
                ('game','**/js/games/number-picture.js'),
            ]:
                ctx, page = context_page(browser)
                page.route(pattern, lambda route: route.abort())

                def dependency_failure(name=name):
                    page.goto(base + 'index.html', wait_until='load', timeout=45000)
                    page.locator(NUMBER_ZONE).click()
                    page.locator(CARD).click(timeout=20000)
                    target = page.locator('#numberPictureTarget')
                    assert '숫자놀이를 불러오지 못했어요' in target.inner_text()
                    page.get_by_role('button', name='놀이터로', exact=True).click()
                    page.locator(CARD).wait_for(state='visible')
                    return {'blockedResource':name, 'loadMessageVisible':True, 'returnedViaNativeClick':True}
                check('missing ' + name + ' allows menu recovery', dependency_failure, page)
                ctx.close()

            ctx, page = context_page(browser, (320, 568))
            page.route('**/assets/vehicles/police/korean_police_car.png', lambda route: route.abort())

            def missing_picture():
                enter(page, base)
                finish(page, 9)
                layout = image_and_layout(page, allow_missing=True)
                assert layout['brokenImages'] and all(image['fallback'] for image in layout['brokenImages']), layout
                assert page.locator('.qp-board .qp-image-fallback:visible').count() == 9
                screenshot(page, 'missing-picture-fallback-320x568')
                action(page, 'home')
                page.locator(CARD).wait_for(state='visible')
                return {'layout':layout, 'nineVisibleFallbacks':True, 'returnedViaNativeClick':True}
            check('missing picture has visible fallback and an exit', missing_picture, page)
            ctx.close()

            ctx, page = context_page(browser)

            def art_bridge():
                page.goto(base + 'index.html', wait_until='load', timeout=45000)
                retain_engine_reference(page)
                if not page.evaluate('!!window.SihyeonArtPlayBridge?.getSavedPlayObject'):
                    return {'notApplicable':True, 'reason':'Phase-2 artwork bridge is not present in this release.'}
                page.locator('.world-zone[onclick="travelToZone(\'game\')"]').click()
                page.locator('.zone-game-card[onclick="openArtZoneGame()"]').click(timeout=20000)
                page.locator('.az-root').wait_for(state='visible')
                page.locator('.az-mode-tab[data-tab="coloring"]').click()
                page.locator('[data-tpl="police"]').click()
                page.locator('.az-color-circle[data-color="#9944FF"]').click()
                region = page.locator('#azColoringWrap [data-part="light_red"]')
                region.click()
                assert region.get_attribute('fill') == '#9944FF'
                saved_before = page.evaluate("JSON.parse(localStorage.getItem('sihyeon-art-work-v1')).templates.police")
                page.locator('#azReferenceToggle').click()
                assert page.locator('#azReference').is_visible() and not page.locator('#azColoringWrap').is_visible()
                page.wait_for_function("document.querySelector('#azReference img').complete && document.querySelector('#azReference img').naturalWidth>0")
                screenshot(page, 'art-reference')
                page.locator('#azReferenceToggle').click()
                assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == '#9944FF'
                assert page.evaluate("JSON.parse(localStorage.getItem('sihyeon-art-work-v1')).templates.police") == saved_before
                page.locator('#azPlayArtwork').click()
                page.locator('.qp-root').wait_for(state='visible')
                initial = snap(page)
                assert initial['objectId'] == 'art:police' and initial['quantity'] == 9 and initial['actualCount'] == 9, initial
                finish(page, 9)

                def painted_snapshot(expected_src=None):
                    value = snap(page)
                    assert value['objectId'] == 'art:police' and value['quantity'] == 9 and value['actualCount'] == 9, value
                    sources = page.locator('.qp-item img').evaluate_all('(images)=>images.map(img=>img.getAttribute("src"))')
                    assert len(sources) == 9 and len(set(sources)) == 1, 'the nine pictures must share the same painted snapshot'
                    src = sources[0]
                    assert src.startswith('data:image/svg+xml'), src[:80]
                    svg = unquote(src.split(',', 1)[1])
                    assert re.search(r'data-part="light_red"[^>]*fill="#9944FF"', svg), 'number play did not restore the purple painted region'
                    if expected_src is not None:
                        assert src == expected_src, 'restoring number play changed the artwork snapshot'
                    assert page.evaluate("JSON.parse(localStorage.getItem('sihyeon-art-work-v1')).templates.police") == saved_before
                    return src, value

                painted_src, _ = painted_snapshot()
                saved_selection = page.evaluate("JSON.parse(localStorage.getItem('sihyeon-number-picture-v1'))")
                assert saved_selection['objectId'] == 'art:police' and saved_selection['fromArtwork'] is True and saved_selection['artTemplateId'] == 'police', saved_selection
                layout = image_and_layout(page)
                screenshot(page, 'painted-police9')
                action(page, 'home')
                page.locator(CARD).wait_for(state='visible')
                page.locator(CARD).click()
                page.locator('.qp-root').wait_for(state='visible')
                finish(page, 9)
                _, returned = painted_snapshot(painted_src)
                screenshot(page, 'painted-police9-returned')
                enter(page, base, reload=True)
                finish(page, 9)
                _, reloaded = painted_snapshot(painted_src)
                restored_layout = image_and_layout(page)
                screenshot(page, 'painted-police9-reloaded')
                return {'savedPaintingPreserved':True, 'referenceDidNotApplyPaint':True, 'handoff':initial,
                        'layout':layout, 'savedSelection':saved_selection, 'returned':returned, 'reloaded':reloaded,
                        'restoredLayout':restored_layout, 'purpleRegionRetainedAcrossReturnAndReload':True}
            check('phase2 painting reference handoff and painted image survives return/reload', art_bridge, page)
            ctx.close()

            ctx, page = context_page(browser)

            def decode_art_catalog():
                page.goto(base + 'index.html', wait_until='load', timeout=45000)
                if not page.evaluate('!!window.SihyeonArtPlayBridge?.getPlayObjects'):
                    return {'notApplicable':True, 'reason':'Phase-2 artwork bridge is not present in this release.'}
                result = page.evaluate("""async () => {
                  const bridge = SihyeonArtPlayBridge.getPlayObjects();
                  const catalog = SihyeonPlayObjects.list().filter(item =>
                    item.category === 'art' && item.src.startsWith('data:image/svg+xml'));
                  const images = await Promise.all(catalog.map(async item => {
                    const image = new Image();
                    let timeout;
                    try {
                      image.src = item.src;
                      await Promise.race([image.decode(), new Promise((_, reject) => {
                        timeout = setTimeout(() => reject(new Error('SVG decode timeout')), 8000);
                      })]);
                      return {id:item.id, artTemplateId:item.artTemplateId, name:item.nameKo,
                        decoded:image.naturalWidth>0 && image.naturalHeight>0,
                        width:image.naturalWidth, height:image.naturalHeight};
                    } catch (error) {
                      return {id:item.id, artTemplateId:item.artTemplateId, name:item.nameKo,
                        decoded:false, error:String(error)};
                    } finally { clearTimeout(timeout); }
                  }));
                  return {bridgeIds:bridge.map(item=>item.id), catalogIds:catalog.map(item=>item.id), images};
                }""")
                assert len(result['bridgeIds']) == 28 and len(set(result['bridgeIds'])) == 28, result
                assert len(result['catalogIds']) == 28 and sorted(result['catalogIds']) == sorted(result['bridgeIds']), result
                assert all(image['decoded'] for image in result['images']), result
                assert any(image['artTemplateId'] == 'police_swat_suv' for image in result['images']), result
                return {'scope':'Native Chromium Image.decode of the actual shared catalog data SVGs; no repeated game sessions',
                        'expected':28, 'decoded':len(result['images']), 'images':result['images']}
            check('phase2 all 28 shared catalog SVG images decode in Chromium', decode_art_catalog, page)
            ctx.close()
            browser.close()
    except Exception as exc:
        report['checks'].append({'name':'browser harness execution', 'status':'FAIL', 'error':str(exc), 'trace':traceback.format_exc()})
    finally:
        if server:
            server.shutdown()
            server.server_close()
        report['status'] = 'FAIL' if report['pageErrors'] or any(check['status'] == 'FAIL' for check in report['checks']) else 'PASS'
        report['passed'] = sum(check['status'] == 'PASS' for check in report['checks'])
        report['failed'] = sum(check['status'] == 'FAIL' for check in report['checks'])
        report['notApplicable'] = sum(check['status'] == 'NOT_APPLICABLE' for check in report['checks'])
        (out / 'number-picture-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print('NUMBER_PICTURE_BROWSER', report['status'], flush=True)
    return 0 if report['status'] == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
