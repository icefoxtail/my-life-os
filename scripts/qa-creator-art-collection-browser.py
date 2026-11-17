"""Native-menu checks for real template previews and independent saved artworks.

The shared speech transport fixture completes utterances; game functions and
handlers remain production code. Storage failures and legacy data are explicit
fixtures. Physical touch, audible listening, and child observation are NOT_RUN.
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
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
ART = runpy.run_path(str(ROOT / 'scripts/qa-art-reference-browser.py'))
QP = ART['QP']
KEY = 'sihyeon-art-collection-v1'
WORK = 'sihyeon-art-work-v1'
VIEWPORTS = [(320, 568), (390, 844), (640, 360), (844, 390), (1024, 768)]
SOURCES = ['index.html', 'js/games/art-zone.js', 'js/play-objects.js']


def data(page):
    return page.evaluate('(key) => JSON.parse(localStorage.getItem(key) || "null")', KEY)


def open_gallery(page):
    page.locator('#azCollectionButton').click()
    page.locator('#azCollection [role="dialog"]').wait_for(state='visible')
    ART['settle'](page)


def close_gallery(page):
    page.locator('#azCollectionClose').click()
    assert page.locator('#azCollection').count() == 0


def save_picture(page):
    open_gallery(page)
    page.locator('#azCollectionSave').click()
    ART['settle'](page)


def paint(page, color):
    page.locator('[data-tpl="police"]').click()
    page.locator('.az-color-circle[data-color="%s"]' % color).click()
    page.locator('#azColoringWrap [data-part="light_red"]').click()
    assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == color


def choose_work(page, index):
    page.locator('[data-open-work]').nth(index).click()
    assert page.locator('#azCollection').count() == 0
    ART['settle'](page)


def button_layout(page, selectors):
    result = page.evaluate('''selectors => selectors.map(selector => {
      const element = document.querySelector(selector), r = element.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
      return {selector, left:r.left, top:r.top, right:r.right, bottom:r.bottom,
        width:r.width, height:r.height, reachable:element===hit || element.contains(hit)};
    })''', selectors)
    viewport = page.viewport_size
    for row in result:
        assert row['width'] >= 43.5 and row['height'] >= 43.5, row
        assert row['left'] >= -1 and row['top'] >= -1, row
        assert row['right'] <= viewport['width'] + 1 and row['bottom'] <= viewport['height'] + 1, row
        assert row['reachable'], row
    return result


def gallery_layout(page):
    result = page.evaluate('''() => {
      const d=document.querySelector('.az-collection-dialog'),g=document.querySelector('.az-collection-grid');
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
      return {dialog:rect(d),grid:rect(g),width:innerWidth,height:innerHeight,
        pageWidth:document.documentElement.scrollWidth,gridWidth:g.clientWidth,gridScrollWidth:g.scrollWidth};
    }''')
    assert result['dialog']['left'] >= 0 and result['dialog']['right'] <= result['width'] + 1, result
    assert result['dialog']['top'] >= 0 and result['dialog']['bottom'] <= result['height'] + 1, result
    assert result['grid']['height'] >= 70, result
    assert result['gridScrollWidth'] <= result['gridWidth'] + 1, result
    assert result['pageWidth'] <= result['width'] + 1, result
    result['buttons'] = button_layout(page, ['#azCollectionClose', '#azCollectionSave'])
    return result


def compare_preview(page, template_id):
    page.wait_for_function('''id => {const image=document.querySelector('[data-tpl="'+id+'"] img');
        return image?.complete && image.naturalWidth>0;}''', arg=template_id)
    result = page.evaluate('''id => {
      const image=document.querySelector('[data-tpl="'+id+'"] img');
      const source=decodeURIComponent(image.getAttribute('src').split(',').slice(1).join(','));
      const template=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
      const actual=document.querySelector('#azColoringWrap svg');
      const regions=svg=>[...svg.querySelectorAll('.fillable')].map(el=>({
        tag:el.localName, attributes:[...el.attributes].filter(a=>a.name!=='style').map(a=>[a.name,a.value]).sort()
      }));
      return {id,decoded:image.complete&&image.naturalWidth>0,preview:regions(template),editor:regions(actual),
        version:document.querySelector('#azColoringWrap').dataset.svgVersion};
    }''', template_id)
    assert result['decoded'], result
    assert result['preview'] == result['editor'], result
    return {'id': template_id, 'regions': len(result['editor']), 'version': result['version']}


def stroke(page, color, y_ratio):
    page.locator('.az-color-circle[data-color="%s"]' % color).click()
    page.wait_for_function("document.querySelector('#azRestoreNotice').hidden")
    box = page.locator('#azCanvas').bounding_box()
    x, y = box['x'] + box['width'] * .25, box['y'] + box['height'] * y_ratio
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + box['width'] * .4, y + 15, steps=9)
    page.mouse.up()


def paint_pixels(page):
    return page.evaluate('''() => {
      const c=document.querySelector('#azCanvas'),rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let red=0,blue=0,total=0;
      for(let i=0;i<rgba.length;i+=4){if(rgba[i+3]<50)continue;total++;
        if(rgba[i]>rgba[i+2]+60)red++;if(rgba[i+2]>rgba[i]+60)blue++;}
      return {red,blue,total};
    }''')


def free_theme(page, theme, color):
    assert page.locator('[data-theme].active').get_attribute('data-theme') == theme
    # Restoring a picture also restores its background. Wait for the existing
    # CSS transition so evidence records the restored color, not its midpoint.
    page.wait_for_function('''color => getComputedStyle(document.querySelector('#azCanvasWrap')).backgroundColor === color''', arg=color)
    result = page.evaluate('''key => ({
        theme: document.querySelector('[data-theme].active').dataset.theme,
        background: getComputedStyle(document.querySelector('#azCanvasWrap')).backgroundColor,
        storedTheme: JSON.parse(localStorage.getItem(key)).activeTheme
    })''', WORK)
    assert result == {'theme': theme, 'background': color, 'storedTheme': theme}, result
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', '--base-url', dest='base_url')
    parser.add_argument('--output', default='qa-creator-art-collection-evidence')
    args = parser.parse_args()
    out = pathlib.Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    report = {'suite': 'Creator stage3 art collection', 'checks': [], 'pageErrors': [],
              'screenshots': [], 'servedSources': [],
              'notRun': ['physical touch', 'audible speech listening', 'child observation'],
              'fixture': 'Speech transport completion; explicit storage failure and legacy seeds only'}
    server = None
    current = {'name': 'startup'}

    def screen(page, name):
        filename = 'art-collection-' + name + '.png'
        page.screenshot(path=str(out / filename), full_page=True, timeout=15000)
        report['screenshots'].append(filename)

    def verify_sources(responses, base):
        expected = {urlsplit(urljoin(base, name)).path: name for name in SOURCES}
        evidence = {}
        for response in reversed(responses):
            name = expected.get(urlsplit(response.url).path)
            if name and name not in evidence:
                assert response.status == 200, {'source': name, 'url': response.url, 'status': response.status}
                served = hashlib.sha256(response.body()).hexdigest()
                checkout = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
                evidence[name] = {'url': response.url, 'status': response.status,
                                  'servedSha256': served, 'checkoutSha256': checkout,
                                  'matchesCheckout': served == checkout}
        assert set(evidence) == set(SOURCES), evidence
        assert all(row['status'] == 200 and row['matchesCheckout'] for row in evidence.values()), evidence
        return evidence

    def enter_verified(page, reload=False, coloring=True):
        responses = []
        capture = lambda response: responses.append(response)
        page.on('response', capture)
        try:
            ART['enter_art'](page, base, reload=reload, coloring=coloring)
            # Chromium can release an earlier document's response bodies on
            # reload. Verify every navigation while those exact bytes are live,
            # including the initial document before any scenario can reload it.
            proof = verify_sources(responses, base)
            report['servedSources'].append({'check': current['name'],
                'navigation': 'reload' if reload else 'initial', 'files': proof})
        finally:
            page.remove_listener('response', capture)

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

            def run_case(name, fn, size=(390, 844), init=None):
                current['name'] = name
                context = browser.new_context(viewport={'width': size[0], 'height': size[1]}, has_touch=True, service_workers='block')
                context.add_init_script(script=QP['SPEECH_FIXTURE'])
                if init:
                    context.add_init_script(script=init)
                page = context.new_page()
                # This suite attests the body of every loaded source on reload.
                # Keep those navigations on the network: a cache validation or
                # redirect response need not expose a response body to CDP.
                # Installed/offline cache behavior is outside this SW-blocked suite.
                source_session = context.new_cdp_session(page)
                source_session.send('Network.enable')
                source_session.send('Network.setCacheDisabled', {'cacheDisabled': True})
                page.set_default_timeout(12000)
                page.on('pageerror', lambda error: report['pageErrors'].append({'check': current['name'], 'message': str(error)}))
                try:
                    enter_verified(page)
                    detail = fn(page)
                    row = {'name': name, 'status': 'PASS', 'detail': detail}
                except Exception as error:
                    row = {'name': name, 'status': 'FAIL', 'error': str(error), 'trace': traceback.format_exc()}
                    try:
                        screen(page, 'failure-' + re.sub(r'[^a-zA-Z0-9]+', '-', name)[:70])
                    except Exception:
                        pass
                report['checks'].append(row)
                print(json.dumps(row, ensure_ascii=False), flush=True)
                context.close()

            for size in VIEWPORTS:
                def responsive(page, size=size):
                    page.wait_for_function("[...document.querySelectorAll('#azTplRow img')].every(img=>img.complete&&img.naturalWidth>0)")
                    assert page.locator('#azTplRow img').count() == 28
                    toolbar = button_layout(page, ['#azUndo', '#azNewPaper', '#azCollectionButton',
                        '.az-mode-tab[data-tab="free"]', '.az-mode-tab[data-tab="coloring"]'])
                    rows = []
                    for template_id in ['police', 'police_swat_suv', 'butterfly']:
                        page.locator('[data-tpl="%s"]' % template_id).tap()
                        rows.append(compare_preview(page, template_id))
                    paint(page, '#9944FF')
                    compare_preview(page, 'police')
                    screen(page, 'preview-%sx%s' % size)
                    save_picture(page)
                    assert page.locator('[data-work-id]').count() == 1
                    page.wait_for_function("document.querySelector('.az-collected-work img').complete&&document.querySelector('.az-collected-work img').naturalWidth>0")
                    layout = gallery_layout(page)
                    screen(page, 'gallery-%sx%s' % size)
                    close_gallery(page)
                    button_layout(page, ['#azCollectionButton'])
                    return {'viewport': list(size), 'toolbar': toolbar, 'templates': rows, 'gallery': layout}
                run_case('actual previews and gallery controls %sx%s' % size, responsive, size)

            def all_templates(page):
                ids = page.locator('[data-tpl]').evaluate_all('(buttons)=>buttons.map(button=>button.dataset.tpl)')
                result = []
                for template_id in ids:
                    page.locator('[data-tpl="%s"]' % template_id).click()
                    result.append(compare_preview(page, template_id))
                assert len(result) == 28 and len({row['id'] for row in result}) == 28
                return result
            run_case('all 28 previews match their actual editor geometry', all_templates)

            def two_versions(page):
                paint(page, '#9944FF'); save_picture(page); close_gallery(page)
                paint(page, '#44CC44'); save_picture(page)
                saved = data(page)
                assert len(saved['items']) == 2
                assert saved['items'][0]['work']['parts']['light_red'] == '#9944FF'
                assert saved['items'][1]['work']['parts']['light_red'] == '#44CC44'
                choose_work(page, 0)
                assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == '#9944FF'
                page.locator('#azUndo').click()
                assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == '#44CC44'
                open_gallery(page); choose_work(page, 0)
                paint(page, '#4488FF')
                assert data(page) == saved, 'editing a reopened picture changed a stored snapshot'
                enter_verified(page, reload=True)
                open_gallery(page)
                assert page.locator('[data-work-id]').count() == 2
                choose_work(page, 0)
                assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == '#9944FF'
                QP['retain_engine_reference'](page)
                page.locator('#azPlayArtwork').click()
                page.locator('.qp-root').wait_for(state='visible')
                QP['select_number'](page, 3)
                completed = QP['finish'](page, 3)
                images = page.locator('.qp-item img').evaluate_all('(nodes)=>nodes.map(node=>node.getAttribute("src"))')
                assert completed['objectId'] == 'art:police' and len(images) == 3
                picture = ET.fromstring(unquote(images[0].split(',', 1)[1]))
                light = next(node for node in picture.iter() if node.attrib.get('data-part') == 'light_red')
                assert light.attrib['fill'] == '#9944FF'
                assert data(page) == saved
                screen(page, 'stored-purple-picture-number-play')
                return {'separatePictures': 2, 'restoreUndo': True, 'reload': True, 'numberPlayUsesSelectedStoredColor': '#9944FF'}
            run_case('two versions remain independent through restore undo reload and number play', two_versions)

            def undo_other_edits(page):
                paint(page, '#9944FF'); save_picture(page); close_gallery(page)
                paint(page, '#44CC44')
                page.locator('[data-tpl="fire_pump"]').click()
                page.locator('.az-color-circle[data-color="#FF4444"]').click()
                page.locator('#azColoringWrap [data-part="body"]').click()
                open_gallery(page); choose_work(page, 0)
                page.locator('[data-tpl="fire_pump"]').click()
                page.locator('.az-color-circle[data-color="#4488FF"]').click()
                page.locator('#azColoringWrap [data-part="body"]').click()
                page.locator('.az-mode-tab[data-tab="free"]').click()
                stroke(page, '#4488FF', .5)
                free_png = ART['read_work'](page)['freeImage']
                page.locator('.az-mode-tab[data-tab="coloring"]').click()
                page.locator('[data-tpl="police"]').click()
                page.locator('#azUndo').click()
                work = ART['read_work'](page)
                assert work['templates']['fire_pump']['parts']['body'] == '#4488FF', 'restore Undo rolled back a later edit to another template'
                assert work['templates']['police']['parts']['light_red'] == '#44CC44'
                assert work['freeImage'] == free_png, 'restore Undo rolled back a later free-canvas edit'
                screen(page, 'undo-preserves-other-pages')
                return {'restoredPoliceLight': '#44CC44', 'laterFireBodyPreserved': '#4488FF', 'laterFreeDrawingPreserved': True}
            run_case('restore undo preserves later edits on other coloring and free pages', undo_other_edits)

            def free_versions(page):
                page.locator('.az-mode-tab[data-tab="free"]').click()
                page.locator('[data-theme="ocean"]').click(); stroke(page, '#FF4444', .3)
                save_picture(page); close_gallery(page)
                page.locator('#azNewPaper').click()
                page.locator('[data-theme="forest"]').click(); stroke(page, '#4488FF', .65)
                save_picture(page)
                saved = data(page)
                assert len(saved['items']) == 2 and saved['items'][0]['image'] != saved['items'][1]['image']
                assert [item['theme'] for item in saved['items']] == ['ocean', 'forest']
                choose_work(page, 0); page.wait_for_function("document.querySelector('#azRestoreNotice').hidden")
                first = paint_pixels(page); assert first['red'] > 50 and first['blue'] == 0, first
                first_theme = free_theme(page, 'ocean', 'rgb(224, 247, 250)')
                open_gallery(page); choose_work(page, 1); page.wait_for_function("document.querySelector('#azRestoreNotice').hidden")
                second = paint_pixels(page); assert second['blue'] > 50 and second['red'] == 0, second
                second_theme = free_theme(page, 'forest', 'rgb(241, 248, 233)')
                enter_verified(page, reload=True, coloring=False)
                open_gallery(page); choose_work(page, 0); page.wait_for_function("document.querySelector('#azRestoreNotice').hidden")
                after_reload = paint_pixels(page); assert after_reload['red'] > 50 and after_reload['blue'] == 0, after_reload
                reload_theme = free_theme(page, 'ocean', 'rgb(224, 247, 250)')
                assert data(page) == saved
                screen(page, 'red-free-picture-restored')
                return {'first': first, 'second': second, 'reload': after_reload,
                        'backgrounds': [first_theme, second_theme, reload_theme], 'originalPngSnapshotsUnchanged': True}
            run_case('two free pictures keep their colors backgrounds and saved PNGs after reload', free_versions)

            legacy = {'tab': 'coloring', 'activeTemplateId': 'police', 'templates': {
                'police': {'fills': ['#9944FF' if index % 2 == 0 else '#FFF' for index in range(15)], 'completed': True}}}
            def legacy_picture(page):
                assert page.locator('#azColoringWrap').get_attribute('data-svg-version') == '1'
                compare_preview(page, 'police'); save_picture(page); close_gallery(page)
                page.locator('#azNewPaper').click()
                assert page.locator('#azColoringWrap').get_attribute('data-svg-version') == '2'
                open_gallery(page); choose_work(page, 0)
                assert page.locator('#azColoringWrap').get_attribute('data-svg-version') == '1'
                assert page.locator('#azColoringWrap .fillable').count() == 15
                assert [row['fill'] for row in ART['fills'](page)] == legacy['templates']['police']['fills']
                compare_preview(page, 'police')
                screen(page, 'legacy-fifteen-regions-restored')
                return {'storedVersion': 1, 'restoredRegions': 15, 'fillsPreserved': True}
            run_case('legacy fifteen-region artwork can be collected and reopened unchanged', legacy_picture,
                     init='localStorage.setItem(%s,%s);' % (json.dumps(WORK), json.dumps(json.dumps(legacy))))

            def quota(page):
                paint(page, '#9944FF'); save_picture(page); close_gallery(page)
                original = data(page)
                page.evaluate('''key=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('full','QuotaExceededError');return set.call(this,k,v);};}''', KEY)
                paint(page, '#44CC44'); save_picture(page)
                assert page.locator('[data-work-id]').count() == 2
                assert '이번 놀이' in page.locator('#azCollectionStatus').inner_text()
                assert page.locator('.az-session-picture').count() == 1
                assert data(page) == original
                choose_work(page, 1)
                assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == '#44CC44'
                page.locator('.game-back-floating').click()
                page.locator(ART['ART_CARD']).click()
                page.locator('.az-root').wait_for(state='visible')
                open_gallery(page)
                assert page.locator('[data-work-id]').count() == 2
                screen(page, 'quota-session-picture')
                enter_verified(page, reload=True)
                open_gallery(page)
                assert page.locator('[data-work-id]').count() == 1
                assert data(page) == original
                return {'oldDiskPictures': 1, 'sessionPicturesBeforeReload': 2, 'clearSessionOnlyNotice': True, 'diskBytesPreserved': True}
            run_case('storage quota keeps the old disk picture and provides usable session-only work', quota)

            existing = {'version': 1, 'items': [{'id': 'aw-existing', 'createdAt': 1, 'kind': 'coloring',
                'templateId': 'police', 'work': {'svgVersion': 1, 'fills': ['#4488FF'] * 15, 'completed': False}}]}
            read_fixture = '''(() => {const key=%s,original=%s;localStorage.setItem(key,original);
              const get=Storage.prototype.getItem;window.__originalCollection=()=>get.call(localStorage,key);
              Storage.prototype.getItem=function(k){if(k===key)throw new DOMException('denied','SecurityError');return get.call(this,k);};})();''' % (json.dumps(KEY), json.dumps(json.dumps(existing)))
            def denied_read(page):
                paint(page, '#9944FF'); save_picture(page)
                assert page.locator('[data-work-id]').count() == 1
                assert '이번 놀이' in page.locator('#azCollectionStatus').inner_text()
                assert json.loads(page.evaluate('window.__originalCollection()')) == existing
                choose_work(page, 0)
                assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == '#9944FF'
                return {'readDeniedWriteAllowed': True, 'existingDiskPicturePreserved': True, 'sessionRestore': True}
            run_case('denied collection reads do not overwrite existing pictures', denied_read, init=read_fixture)

            def deletion(page):
                paint(page, '#9944FF'); save_picture(page)
                original = data(page)
                page.locator('[data-delete-work]').click()
                assert data(page) == original
                page.locator('[data-keep]').click()
                assert data(page) == original
                page.locator('[data-delete-work]').click()
                page.locator('[data-confirm-delete]').click()
                assert data(page)['items'] == []
                assert page.locator('[data-work-id]').count() == 0
                close_gallery(page)
                assert page.locator('#azColoringWrap [data-part="light_red"]').get_attribute('fill') == '#9944FF'
                return {'cancelPreservesPicture': True, 'explicitConfirmDeletesOnlyStoredCopy': True, 'currentPicturePreserved': True}
            run_case('collection deletion requires confirmation and keeps the working picture', deletion)
            browser.close()
    except Exception as error:
        report['checks'].append({'name': 'browser harness execution', 'status': 'FAIL', 'error': str(error), 'trace': traceback.format_exc()})
    finally:
        if server:
            server.shutdown(); server.server_close()
        report['status'] = 'FAIL' if report['pageErrors'] or any(row['status'] == 'FAIL' for row in report['checks']) else 'PASS'
        report['passed'] = sum(row['status'] == 'PASS' for row in report['checks'])
        report['failed'] = sum(row['status'] == 'FAIL' for row in report['checks'])
        (out / 'art-collection-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print('ART_COLLECTION_BROWSER', report['status'], flush=True)
    return 0 if report['status'] == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
