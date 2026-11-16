"""Chromium checks for painting while a read-only color example stays visible.

All game actions use the real menu, buttons, and pointer input. Only the shared
number-picture harness's speech transport completion fixture is reused. No game
state, paint handler, undo history, rendering function, or save method is patched.
The one legacy case seeds a pre-versioning save, as a returning user would have.
Native audio, physical touch, and actual child usability remain NOT_RUN.
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
QP = runpy.run_path(str(ROOT / 'scripts/qa-number-picture-browser.py'))
WORK_KEY = 'sihyeon-art-work-v1'
ART_ZONE = '.world-zone[onclick="travelToZone(\'game\')"]'
ART_CARD = '.zone-game-card[onclick="openArtZoneGame()"]'
VIEWPORTS = [(320, 568), (390, 844), (844, 390), (1024, 768)]
REPRESENTATIVES = [('police', '경찰차'), ('police_swat_suv', '경찰 특공대 SUV'), ('butterfly', '나비')]
LEGACY_FILLS = ['#9944FF' if index % 2 == 0 else '#FFF' for index in range(15)]


def settle(page):
    page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')


def enter_art(page, base, reload=False, coloring=True):
    if reload:
        page.reload(wait_until='load', timeout=45000)
    else:
        page.goto(base + 'index.html', wait_until='load', timeout=45000)
    page.locator(ART_ZONE).click(timeout=20000)
    page.locator(ART_CARD).click(timeout=20000)
    page.locator('.az-root').wait_for(state='visible')
    if coloring:
        page.locator('.az-mode-tab[data-tab="coloring"]').click()
    settle(page)


def read_work(page):
    return page.evaluate('(key) => JSON.parse(localStorage.getItem(key) || "null")', WORK_KEY)


def fills(page):
    return page.locator('#azColoringWrap .fillable').evaluate_all(
        '(elements) => elements.map(el => ({part:el.getAttribute("data-part"), fill:el.getAttribute("fill")}))')


def stored_template(page, template='police'):
    return (read_work(page) or {}).get('templates', {}).get(template)


def show_reference(page):
    if page.locator('#azReferenceToggle').get_attribute('aria-pressed') != 'true':
        page.locator('#azReferenceToggle').click()
    page.locator('#azReference').wait_for(state='visible')
    page.wait_for_function("document.querySelector('#azReference img')?.complete && document.querySelector('#azReference img').naturalWidth > 0")
    assert page.locator('#azColoringWrap').is_visible(), 'opening the example hid the child artwork'
    assert page.locator('#azFreeColoring').get_attribute('aria-pressed') == 'false'
    settle(page)


def reference_colors(page):
    src = page.locator('#azReference img').get_attribute('src')
    assert src and src.startswith('data:image/svg+xml'), src
    svg = ET.fromstring(unquote(src.split(',', 1)[1]))
    return {el.attrib['data-part']: el.attrib.get('fill') for el in svg.iter() if 'data-part' in el.attrib}


def check_guidance(page, expected_first=None):
    hint = page.locator('#azPartHint')
    part = hint.get_attribute('data-part')
    assert part, 'the visible part hint must identify an actual paint region'
    if expected_first:
        assert part == expected_first, {'firstPart':part, 'expectedLargePart':expected_first}
    focused = page.locator('#azColoringWrap .az-guided-part')
    assert focused.count() == 1 and focused.get_attribute('data-part') == part
    color = page.locator('#azPartSwatch').get_attribute('data-color')
    assert color == reference_colors(page)[part], 'the hint color must agree with the visible example'
    assert hint.locator('.az-part-name').inner_text().strip()
    assert hint.locator('.az-part-color').inner_text().strip()
    assert page.locator('#azNextPart').is_visible() and page.locator('#azNextPart').is_enabled()
    return {'part':part, 'name':hint.locator('.az-part-name').inner_text(), 'color':color,
            'colorName':hint.locator('.az-part-color').inner_text()}


def check_layout(page):
    settle(page)
    data = page.evaluate("""() => {
      const root = document.querySelector('.az-root');
      const rect = element => {
        const r = element.getBoundingClientRect();
        return {left:r.left, top:r.top, right:r.right, bottom:r.bottom,
          width:r.width, height:r.height, clientWidth:element.clientWidth,
          scrollWidth:element.scrollWidth, clientHeight:element.clientHeight,
          scrollHeight:element.scrollHeight};
      };
      const selectors = ['#azReference', '#azReference img', '#azColoringWrap',
        '#azColoringWrap svg', '#azReferenceToggle', '#azFreeColoring', '#azNextPart',
        '#azUndo', '#azNewPaper', '#azPlayArtwork'];
      const boxes = Object.fromEntries(selectors.map(selector => [selector, rect(root.querySelector(selector))]));
      const controls = ['#azReferenceToggle', '#azFreeColoring', '#azNextPart', '#azUndo', '#azNewPaper'];
      const hits = controls.map(selector => {
        const el = root.querySelector(selector), r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return {selector, reachable:!!hit && (hit === el || el.contains(hit))};
      });
      return {viewport:[innerWidth, innerHeight], documentWidth:document.documentElement.scrollWidth,
        root:rect(root), boxes, hits,
        clippedText:[...root.querySelectorAll('#azPartHint strong,#azPartHint small,#azReference figcaption')]
          .filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
          .map(el => el.textContent)};
    }""")
    width, height = data['viewport']
    root = data['root']
    assert data['documentWidth'] <= width + 1, data
    assert root['left'] >= -1 and root['right'] <= width + 1 and root['top'] >= -1 and root['bottom'] <= height + 1, data
    assert root['scrollWidth'] <= root['clientWidth'] + 1 and root['scrollHeight'] <= root['clientHeight'] + 1, data
    for name, box in data['boxes'].items():
        assert box['width'] > 0 and box['height'] > 0, {'invisible':name, 'layout':data}
        assert box['left'] >= root['left'] - 1 and box['right'] <= root['right'] + 1, {'outsideRoot':name, 'layout':data}
        assert box['top'] >= root['top'] - 1 and box['bottom'] <= root['bottom'] + 1, {'outsideRoot':name, 'layout':data}
    sample = data['boxes']['#azReference']
    own = data['boxes']['#azColoringWrap']
    if width > height:
        assert sample['left'] >= own['right'] - 1, {'expected':'example beside child artwork', 'layout':data}
    else:
        assert sample['bottom'] <= own['top'] + 1, {'expected':'example above child artwork', 'layout':data}
    # Small-screen checks use visible rendered sizes, not intrinsic SVG pixels.
    sample_image = data['boxes']['#azReference img']
    own_svg = data['boxes']['#azColoringWrap svg']
    assert sample_image['width'] >= 64 and sample_image['height'] >= 48, data
    assert own_svg['width'] >= 140 and own_svg['height'] >= 90, data
    for selector in ['#azReferenceToggle', '#azFreeColoring', '#azNextPart']:
        assert data['boxes'][selector]['height'] >= 43.5, {'smallTouchControl':selector, 'layout':data}
    assert all(hit['reachable'] for hit in data['hits']), data
    assert not data['clippedText'], data
    return data


def paint_light(page, color='#9944FF'):
    page.locator('.az-color-circle[data-color="%s"]' % color).click()
    page.locator('#azColoringWrap [data-part="light_red"]').click()
    assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == color
    page.wait_for_function("color => JSON.parse(localStorage.getItem('sihyeon-art-work-v1')).templates.police.parts.light_red === color", arg=color)


def colored_pixels(page):
    return page.evaluate("""() => {
      const c = document.querySelector('#azCanvas'), data = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let painted = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 32) painted++;
      return {painted, width:c.width, height:c.height};
    }""")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', '--base-url', dest='base_url')
    parser.add_argument('--output', default='qa-art-reference-evidence')
    args = parser.parse_args()
    out = pathlib.Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    report = {
        'scope':'Visible companion example, native menu/pointer input, paint independence, undo, saved revisions and number-play handoff',
        'nativeAudio':{'status':'NOT_RUN', 'reason':'speech transport completion fixture; no speaker or physical-device claim'},
        'physicalDevice':{'status':'NOT_RUN', 'reason':'Chromium viewports and touch emulation only'},
        'fixture':{'transport':'speechSynthesis.speak/cancel', 'sharedVoiceEngineReplaced':False, 'gameFunctionsReplaced':False},
        'catalogDecodeScope':'All 28 catalog SVGs remain covered by qa-number-picture-browser.py; this suite checks three representative layouts.',
        'checks':[], 'pageErrors':[], 'screenshots':[], 'sources':{},
    }
    for relative in ['index.html', 'js/games/art-zone.js', 'js/games/number-picture.js',
                     'js/voice-engine.js', 'scripts/qa-art-reference-browser.py', 'scripts/qa-number-picture-browser.py']:
        report['sources'][relative] = hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()
    current = {'name':'startup'}
    server = None

    def screenshot(page, name):
        filename = 'art-reference-' + name + '.png'
        page.screenshot(path=str(out / filename), full_page=True, timeout=15000)
        report['screenshots'].append(filename)
        return filename

    def check(name, fn, page):
        current['name'] = name
        try:
            result = {'name':name, 'status':'PASS', 'detail':fn()}
        except Exception as error:
            result = {'name':name, 'status':'FAIL', 'error':str(error), 'trace':traceback.format_exc()}
            try:
                result['screenshot'] = screenshot(page, 'failure-' + re.sub(r'[^a-zA-Z0-9]+', '-', name)[:75])
            except Exception:
                pass
        report['checks'].append(result)
        print(json.dumps(result, ensure_ascii=False), flush=True)

    def new_page(browser, size=(390, 844)):
        context = browser.new_context(viewport={'width':size[0], 'height':size[1]}, has_touch=True, service_workers='block')
        context.add_init_script(script=QP['SPEECH_FIXTURE'])
        page = context.new_page()
        page.set_default_timeout(12000)
        page.on('pageerror', lambda error: report['pageErrors'].append({'check':current['name'], 'message':str(error)}))
        return context, page

    try:
        if args.base_url:
            base = args.base_url.rstrip('/') + '/'
        else:
            handler = functools.partial(QP['QuietHandler'], directory=str(ROOT))
            server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = 'http://127.0.0.1:%s/' % server.server_address[1]
        report['baseUrl'] = base
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            report['browser'] = browser.version

            for size in VIEWPORTS:
                context, page = new_page(browser, size)

                def responsive(size=size):
                    enter_art(page, base)
                    assert page.locator('#azFreeColoring').get_attribute('aria-pressed') == 'true'
                    assert not page.locator('#azReference').is_visible()
                    show_reference(page)
                    rows = []
                    for template, name in REPRESENTATIVES:
                        page.locator('[data-tpl="%s"]' % template).tap()
                        show_reference(page)
                        assert name in page.locator('#azReference img').get_attribute('alt')
                        guidance = check_guidance(page, 'body' if template == 'police' else None)
                        rows.append({'template':template, 'guidance':guidance, 'layout':check_layout(page)})
                        screenshot(page, '%s-%sx%s' % (template, *size))
                    return {'viewport':list(size), 'input':'native browser touch tap', 'representatives':rows}

                check('companion layout and reachable controls %sx%s' % size, responsive, page)
                context.close()

            context, page = new_page(browser)

            def painting_and_modes():
                enter_art(page, base)
                page.locator('[data-tpl="police"]').click()
                paint_light(page)
                before = stored_template(page)
                own_before = fills(page)
                show_reference(page)
                first = check_guidance(page, 'body')
                sample_src = page.locator('#azReference img').get_attribute('src')
                assert reference_colors(page)['light_red'] == '#FF4444'
                assert stored_template(page) == before and fills(page) == own_before
                page.locator('#azNextPart').click()
                second = check_guidance(page)
                assert second['part'] != first['part'], 'the next-part action did not advance the visible hint'
                assert stored_template(page) == before and fills(page) == own_before
                page.locator('#azFreeColoring').click()
                assert not page.locator('#azReference').is_visible()
                assert page.locator('#azColoringWrap').is_visible()
                assert page.locator('#azColoringWrap .az-guided-part').count() == 0
                assert page.locator('#azFreeColoring').get_attribute('aria-pressed') == 'true'
                show_reference(page)
                assert stored_template(page) == before and fills(page) == own_before
                page.locator('#azUndo').click()
                page.wait_for_function("JSON.parse(localStorage.getItem('sihyeon-art-work-v1')).templates.police.parts.light_red === '#FFF'")
                assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == '#FFF', 'view/hint actions polluted paint undo history'
                assert page.locator('#azReference').is_visible() and page.locator('#azReferenceToggle').get_attribute('aria-pressed') == 'true', 'undo interrupted the chosen example mode'
                show_reference(page)
                paint_light(page)
                assert page.locator('#azReference').is_visible(), 'painting while looking at the example closed it'
                assert page.locator('#azReference img').get_attribute('src') == sample_src, 'child paint recolored the example'
                assert reference_colors(page)['light_red'] == '#FF4444'
                painted = stored_template(page)
                screenshot(page, 'painted-purple-and-red-example')
                enter_art(page, base, reload=True)
                assert not page.locator('#azReference').is_visible(), 'a new visit should begin in free coloring'
                assert page.locator('#azFreeColoring').get_attribute('aria-pressed') == 'true'
                assert stored_template(page) == painted
                assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == '#9944FF'
                show_reference(page)
                QP['retain_engine_reference'](page)
                page.locator('#azPlayArtwork').click()
                page.locator('.qp-root').wait_for(state='visible')
                completed = QP['finish'](page, 9)
                assert completed['objectId'] == 'art:police'
                sources = page.locator('.qp-item img').evaluate_all('(images) => images.map(image => image.getAttribute("src"))')
                assert len(sources) == 9 and len(set(sources)) == 1
                delivered = ET.fromstring(unquote(sources[0].split(',', 1)[1]))
                light = next(el for el in delivered.iter() if el.attrib.get('data-part') == 'light_red')
                assert light.attrib['fill'] == '#9944FF', 'number play received the red example instead of the child artwork'
                assert stored_template(page) == painted
                screenshot(page, 'purple-artwork-number-play')
                return {'firstHint':first, 'nextHint':second, 'exampleNeverApplied':True,
                        'undoIgnoredModeAndHintChanges':True, 'savedPaintSurvivedReload':True,
                        'handoffWhileExampleOpen':{'objectId':completed['objectId'], 'pictures':len(sources), 'paint':'#9944FF'}}

            check('independent example paint undo reload and number-play handoff', painting_and_modes, page)
            context.close()

            context, page = new_page(browser)

            def legacy_save():
                page.goto(base + 'index.html', wait_until='load', timeout=45000)
                seed = {'tab':'coloring', 'activeTemplateId':'police',
                        'templates':{'police':{'fills':LEGACY_FILLS, 'completed':False}}}
                page.evaluate('([key,data]) => localStorage.setItem(key, JSON.stringify(data))', [WORK_KEY, seed])
                enter_art(page, base, reload=True)
                assert page.locator('#azColoringWrap').get_attribute('data-svg-version') == '1'
                assert [part['fill'] for part in fills(page)] == LEGACY_FILLS
                before = stored_template(page)
                show_reference(page)
                assert '내 그림은 그대로' in page.locator('#azReference figcaption').inner_text()
                assert page.locator('#azColoringWrap .az-guided-part').count() == 0, 'current part IDs were applied to legacy index-based paint'
                page.locator('#azNextPart').click()
                assert stored_template(page) == before and [part['fill'] for part in fills(page)] == LEGACY_FILLS
                screenshot(page, 'legacy-v1-with-current-example')
                page.locator('#azNewPaper').click()
                assert page.locator('#azColoringWrap').get_attribute('data-svg-version') == '2'
                assert all(part['fill'] == '#FFF' for part in fills(page))
                assert page.locator('#azReference').is_visible() and page.locator('#azReferenceToggle').get_attribute('aria-pressed') == 'true', 'new paper interrupted the chosen example mode'
                page.locator('#azUndo').click()
                page.wait_for_function("JSON.parse(localStorage.getItem('sihyeon-art-work-v1')).templates.police.svgVersion === 1")
                assert page.locator('#azColoringWrap').get_attribute('data-svg-version') == '1'
                assert [part['fill'] for part in fills(page)] == LEGACY_FILLS
                assert page.locator('#azReference').is_visible() and page.locator('#azColoringWrap .az-guided-part').count() == 0
                enter_art(page, base, reload=True)
                assert page.locator('#azColoringWrap').get_attribute('data-svg-version') == '1'
                assert [part['fill'] for part in fills(page)] == LEGACY_FILLS
                return {'preVersioningRegions':len(LEGACY_FILLS), 'legacyPaintUnchangedByReference':True,
                        'newPaperVersion':2, 'undoAndReloadVersion':1}

            check('legacy saved picture stays on its own geometry through reference new-paper undo and reload', legacy_save, page)
            context.close()

            context, page = new_page(browser)

            def free_drawing():
                enter_art(page, base)
                page.locator('.az-mode-tab[data-tab="free"]').click()
                canvas = page.locator('#azCanvas')
                canvas.wait_for(state='visible')
                page.wait_for_function("document.querySelector('#azRestoreNotice').hidden")
                box = canvas.bounding_box()
                x = box['x'] + box['width'] * .35
                y = box['y'] + box['height'] * .45
                page.mouse.move(x, y)
                page.mouse.down()
                page.mouse.move(x + box['width'] * .3, y + box['height'] * .1, steps=8)
                page.mouse.up()
                before_pixels = colored_pixels(page)
                assert before_pixels['painted'] > 20, before_pixels
                page.locator('.az-mode-tab[data-tab="coloring"]').click()
                saved_png = read_work(page)['freeImage']
                assert saved_png.startswith('data:image/png;base64,')
                show_reference(page)
                page.locator('#azNextPart').click()
                page.locator('#azFreeColoring').click()
                assert read_work(page)['freeImage'] == saved_png, 'reference controls changed the separate free drawing'
                page.locator('.az-mode-tab[data-tab="free"]').click()
                assert not page.locator('#azArtTools').is_visible() and not page.locator('#azReference').is_visible()
                page.wait_for_function("document.querySelector('#azRestoreNotice').hidden")
                after_pixels = colored_pixels(page)
                assert after_pixels['painted'] > 20, after_pixels
                screenshot(page, 'free-drawing-preserved')
                enter_art(page, base, reload=True, coloring=False)
                assert page.locator('#azCanvas').is_visible()
                page.wait_for_function("document.querySelector('#azRestoreNotice').hidden")
                reloaded_pixels = colored_pixels(page)
                assert reloaded_pixels['painted'] > 20, reloaded_pixels
                return {'storedDrawingUntouchedByReference':True, 'before':before_pixels,
                        'returned':after_pixels, 'reloaded':reloaded_pixels}

            check('separate free drawing survives companion controls and reload', free_drawing, page)
            context.close()
            browser.close()
    except Exception as error:
        report['checks'].append({'name':'browser harness execution', 'status':'FAIL', 'error':str(error), 'trace':traceback.format_exc()})
    finally:
        if server:
            server.shutdown()
            server.server_close()
        report['status'] = 'FAIL' if report['pageErrors'] or any(row['status'] == 'FAIL' for row in report['checks']) else 'PASS'
        report['passed'] = sum(row['status'] == 'PASS' for row in report['checks'])
        report['failed'] = sum(row['status'] == 'FAIL' for row in report['checks'])
        (out / 'art-reference-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print('ART_REFERENCE_BROWSER', report['status'], flush=True)
    return 0 if report['status'] == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
