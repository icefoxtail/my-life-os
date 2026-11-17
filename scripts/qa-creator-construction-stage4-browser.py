"""Public construction projects: native buttons, visible work and persistent scenes.

This uses the existing audio-completion probe, not product state injection.
Physical devices and audible speech remain NOT_RUN. Public URL mode verifies
both fetched release bytes and the resources actually loaded by Chromium.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import re
import runpy
import subprocess
import threading
import traceback
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
QA = runpy.run_path(str(ROOT / 'scripts/qa-p1-voice-browser.py'))
SOURCES = ['index.html', 'sw.js', 'js/games/construction-site.js', 'js/vehicle-display.js',
           'assets/vehicles/construction_manifest.json', 'assets/vehicles/fire/pump_engine.png']
LOADED = ['index.html', 'js/games/construction-site.js', 'js/vehicle-display.js',
          'assets/vehicles/construction_manifest.json']
CASES = [(project, w, h) for project in ['playground', 'station', 'bridge']
         for w, h in [(390, 844), (844, 390), (640, 360), (320, 568), (768, 1024), (1024, 768)]]
# Independent role expectations, preserved from the existing rule oracle.
VALID = {
    'dig': {'excavator', 'mini_excavator', 'backhoe_loader'},
    'push': {'bulldozer', 'grader', 'wheel_loader', 'backhoe_loader', 'skid_steer_loader'},
    'load': {'wheel_loader', 'backhoe_loader', 'skid_steer_loader', 'excavator', 'mini_excavator'},
    'carry': {'dump_truck', 'articulated_dump_truck', 'dump_loader', 'cargo_truck'},
    'mix': {'concrete_mixer'}, 'lift': {'crane_truck', 'forklift', 'tower_crane', 'mobile_crane'},
    'pump': {'concrete_pump_truck'}
}
ORDERS = {'playground': ['push', 'load', 'carry'], 'station': ['dig', 'mix', 'pump'], 'bridge': ['dig', 'carry', 'lift']}

LAYOUT = r"""() => {
  const root=document.querySelector('.cs-root'),rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const visible=e=>{const r=rect(e),s=getComputedStyle(e);return r.width>.1&&r.height>.1&&s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.05;};
  const inside=(r,b)=>r.left>=b.left-1&&r.top>=b.top-1&&r.right<=b.right+1&&r.bottom<=b.bottom+1;
  const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
  const view={left:0,top:0,right:innerWidth,bottom:innerHeight},issues=[],controls=[];
  const buttons=[...root.querySelectorAll('button'),...document.querySelectorAll('.game-back-floating')].filter(visible);
  for(const e of buttons){const r=rect(e),hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2),label=e.dataset.action||e.dataset.project||e.dataset.id||e.className;
    const item={label,rect:r,disabled:e.disabled,hit:!!hit&&(hit===e||e.contains(hit))};controls.push(item);
    if(r.width<43.8||r.height<43.8)issues.push({kind:'small-control',...item});
    if(!inside(r,view))issues.push({kind:'clipped-control',...item});
    if(!e.disabled&&!item.hit)issues.push({kind:'covered-control',...item});
  }
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)if(overlap(controls[i].rect,controls[j].rect))issues.push({kind:'overlapping-controls',a:controls[i].label,b:controls[j].label});
  const texts=[...root.querySelectorAll('.cs-title,.cs-project-name,.cs-project-small,.cs-work-status,.cs-message.show,.cs-pill')].filter(visible).map(e=>({text:e.textContent,rect:rect(e),overflow:e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2}));
  for(const row of texts){if(!inside(row.rect,view)||row.overflow)issues.push({kind:'clipped-text',...row});}
  const stage=root.querySelector('.cs-stage'),panel=root.querySelector('.cs-work-panel');
  if(stage&&visible(stage)&&!inside(rect(stage),view))issues.push({kind:'stage-outside-viewport',rect:rect(stage)});
  if(stage&&panel&&visible(panel)&&overlap(rect(stage),rect(panel)))issues.push({kind:'work-panel-over-scene'});
  const status=root.querySelector('.cs-work-status');
  if(status&&visible(status))for(const control of controls)if(overlap(rect(status),control.rect))issues.push({kind:'status-over-control',control:control.label});
  const svg=root.querySelector('#csProjectScene svg'),pieces=[];
  if(svg){for(const e of svg.querySelectorAll('[data-piece],.cs-scene-actor')){const r=rect(e);pieces.push({name:e.dataset.piece||'actor',rect:r});if(!inside(r,rect(svg)))issues.push({kind:'scene-piece-clipped',name:e.dataset.piece||'actor',rect:r,boundary:rect(svg)});}}
  let sceneCoordinates=null;
  if(svg){
    const canvas=root.querySelector('.cs-project-canvas'),worker=root.querySelector('#csWorkerVehicle');
    sceneCoordinates={svg:rect(svg),canvas:canvas?rect(canvas):null,worker:worker&&visible(worker)?rect(worker):null};
    if(!canvas)issues.push({kind:'missing-common-scene-canvas'});
    else{
      const c=rect(canvas),s=rect(svg);
      if(Math.abs(c.width/c.height-8/5)>.001||!inside(c,rect(stage)))issues.push({kind:'scene-canvas-fit',...sceneCoordinates});
      if(['left','top','right','bottom'].some(key=>Math.abs(c[key]-s[key])>1))issues.push({kind:'svg-outside-common-canvas',...sceneCoordinates});
      if(worker&&visible(worker)&&(worker.offsetParent!==canvas||!inside(rect(worker),c)))issues.push({kind:'worker-outside-common-canvas',...sceneCoordinates});
    }
    const walker=svg.querySelector('.cs-walker'),path=svg.querySelector('[data-piece="finished-path"] path');
    if(walker&&path){
      const legs=walker.querySelector('path[stroke="#394b72"]'),numbers=legs.getAttribute('d').match(/[-+]?\d*\.?\d+/g).map(Number);
      const feet=[[numbers[0]+numbers[2],numbers[1]+numbers[3]],[numbers[0]+numbers[2]+numbers[4]+numbers[6],numbers[1]+numbers[3]+numbers[5]+numbers[7]]];
      const matrix=path.getCTM().inverse().multiply(legs.getCTM()),radius=+legs.getAttribute('stroke-width')/2;
      sceneCoordinates.walkerFeet=feet.map(([x,y])=>{
        const point=new DOMPoint(x,y).matrixTransform(matrix);
        const insidePath=Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return path.isPointInFill(new DOMPoint(x+radius*Math.cos(a),y+radius*Math.sin(a)).matrixTransform(matrix));}).every(Boolean);
        if(!insidePath)issues.push({kind:'walker-foot-outside-finished-path',point:{x:point.x,y:point.y}});
        return {x:point.x,y:point.y,insidePath};
      });
    }
  }
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push({kind:'horizontal-document-overflow'});
  return {viewport:[innerWidth,innerHeight],phase:root.dataset.phase||'chooser',project:root.dataset.projectId,root:rect(root),controls,texts,pieces,sceneCoordinates,issues};
}"""


def sha(data):
    return hashlib.sha256(data).hexdigest()


def hashes():
    return {name: sha((ROOT / name).read_bytes()) for name in SOURCES}


def normalize(value):
    p = urlsplit(value)
    if p.scheme not in ('http', 'https') or not p.netloc:
        raise ValueError('--base-url must be an HTTP(S) playground URL')
    path = p.path[:-len('index.html')] if p.path.endswith('/index.html') else p.path
    return urlunsplit((p.scheme, p.netloc, path.rstrip('/') + '/', '', ''))


def fetched_sources(base, expected):
    actual = {}
    for name in SOURCES:
        with urlopen(Request(urljoin(base, name), headers={'Cache-Control': 'no-cache'}), timeout=30) as response:
            assert response.status == 200, (name, response.status)
            actual[name] = sha(response.read())
    return {'baseUrl': base, 'expected': expected, 'actual': actual, 'matchesCheckout': actual == expected}


def loaded_sources(responses, expected):
    result = {}
    for name in LOADED:
        response = responses.get(name)
        assert response is not None, 'Browser did not load ' + name
        actual = sha(response.body())
        result[name] = {'url': response.url, 'httpStatus': response.status,
                        'servedSha256': actual, 'checkoutSha256': expected[name], 'matchesCheckout': actual == expected[name]}
    assert all(row['httpStatus'] == 200 and row['matchesCheckout'] for row in result.values()), result
    return result


def decoded_art(page):
    result = page.evaluate(r"""async () => {
      await document.fonts.ready;
      const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
      const result={html:[],svg:[],failures:[]};
      for(const image of [...document.querySelectorAll('.cs-root img')].filter(visible)){
        try{await image.decode();result.html.push({src:image.currentSrc,width:image.naturalWidth,height:image.naturalHeight});if(!image.naturalWidth)throw new Error('zero width');}
        catch(error){result.failures.push({src:image.src,error:String(error)});}
      }
      for(const image of [...document.querySelectorAll('.cs-root svg image')].filter(visible)){
        const href=image.href.baseVal,url=new URL(href,document.baseURI).href;
        try{const probe=new Image();probe.src=url;await probe.decode();const b=image.getBoundingClientRect();result.svg.push({href:url,width:probe.naturalWidth,height:probe.naturalHeight,renderedWidth:b.width,renderedHeight:b.height});if(!probe.naturalWidth||!b.width||!b.height)throw new Error('SVG image not rendered');}
        catch(error){result.failures.push({href:url,error:String(error)});}
      }
      return result;
    }""")
    assert not result['failures'], result
    return result


def touch(page, selector):
    locator = page.locator(selector).first
    expect(locator).to_be_visible()
    expect(locator).to_be_enabled()
    box = locator.bounding_box()
    assert box and box['width'] >= 43.8 and box['height'] >= 43.8, (selector, box)
    assert box['x'] >= -1 and box['y'] >= -1 and box['x'] + box['width'] <= page.viewport_size['width'] + 1 and box['y'] + box['height'] <= page.viewport_size['height'] + 1, (selector, box)
    assert locator.evaluate("e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!h&&(h===e||e.contains(h));}"), selector + ' is covered'
    page.touchscreen.tap(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)


def open_game(page, base, language='ko'):
    response = page.goto(urljoin(base, 'index.html'), wait_until='load', timeout=60000)
    assert response and response.ok
    if language == 'en':
        page.locator('[data-language-toggle]').click()
    page.locator('[data-home-age="4"]').click()
    page.locator('.world-zone[onclick="travelToZone(\'cars\')"]').click()
    page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]',).click()
    expect(page.locator('.cs-project-picker')).to_be_visible()
    page.wait_for_function("() => {const e=document.querySelector('.game-play-screen');return e&&+getComputedStyle(e).opacity>=.99&&e.getAnimations().every(a=>a.playState==='finished');}")


def total_exp(page):
    return page.evaluate('() => (db.progress.level-1)*100+db.progress.exp')


def project_flow(page, project, capture, language='ko'):
    viewport = page.viewport_size
    compact = viewport['width'] == 640
    capture('chooser')
    voice_start = page.evaluate('window.__voiceTrace.length')
    touch(page, f'[data-project="{project}"]')
    expect(page.locator('.cs-root[data-phase="choose"]')).to_be_visible()
    initial_exp = total_exp(page)
    results = []
    for index, mission in enumerate(ORDERS[project], start=1):
        root = page.locator('.cs-root')
        expect(root).to_have_class(re.compile(r'\bcs-stage-' + mission + r'\b'))
        expect(page.locator('#csProjectScene svg')).to_have_attribute('data-progress', str(index - 1))
        touch(page, '[data-action="listen"]')
        page.wait_for_timeout(80)
        offered = page.locator('.cs-choice').evaluate_all('els=>els.map(e=>e.dataset.id)')
        assert len(offered) == len(set(offered)) == 3 and any(x in VALID[mission] for x in offered), offered
        if index == 1:
            wrong = next(x for x in offered if x not in VALID[mission])
            touch(page, f'.cs-choice[data-id="{wrong}"]')
            expect(page.locator('#csMessage')).to_contain_text('괜찮아')
            expect(root).to_have_attribute('data-phase', 'choose')
            capture('wrong-role')
            touch(page, '[data-action="listen"]')
            expect(page.locator('.cs-question-card')).not_to_have_class(re.compile(r'has-feedback'))
        answer = next(x for x in offered if x in VALID[mission])
        touch(page, f'.cs-choice[data-id="{answer}"]')
        expect(root).to_have_attribute('data-phase', 'ready')
        decoded_art(page)
        before_rect = page.locator('#csProjectScene').bounding_box()
        before = page.locator('#csProjectScene').screenshot()
        if compact:
            capture(f'job-{index}-ready')
        action = 'auto-work' if index == 2 else 'work'
        touch(page, f'[data-action="{action}"]')
        expect(root).to_have_attribute('data-phase', 'working')
        if compact:
            capture(f'job-{index}-working')
        expect(root).to_have_attribute('data-phase', 'result')
        expect(page.locator('#csProjectScene svg')).to_have_attribute('data-progress', str(index))
        decoded_art(page)
        after_rect = page.locator('#csProjectScene').bounding_box()
        after = page.locator('#csProjectScene').screenshot()
        assert abs(before_rect['width'] - after_rect['width']) < 1 and abs(before_rect['height'] - after_rect['height']) < 1, {'before': before_rect, 'after': after_rect}
        assert sha(before) != sha(after), 'The actual scene did not change after work'
        capture(f'job-{index}-result')
        assert total_exp(page) == initial_exp + index * 10, 'one reward per performed job'
        if index == 1:
            if viewport['width'] == 390:
                page.set_viewport_size({'width': viewport['height'], 'height': viewport['width']})
                page.wait_for_timeout(200)
                capture('result-rotated')
                expect(page.locator('#csProjectScene svg')).to_have_attribute('data-progress', '1')
                page.set_viewport_size(viewport)
                page.wait_for_timeout(200)
            if compact:
                page.wait_for_timeout(5100)
                expect(root).to_have_attribute('data-phase', 'result')
                expect(root).to_have_class(re.compile(r'\bcs-stage-' + mission + r'\b'))
            touch(page, '[data-action="listen-result"]')
            page.wait_for_timeout(80)
            assert total_exp(page) == initial_exp + 10
        results.append({'mission': mission, 'offered': offered, 'answer': answer, 'mode': action,
                        'sceneBeforeSha256': sha(before), 'sceneAfterSha256': sha(after), 'sameFrame': True})
        touch(page, '[data-action="next-work"]')
    expect(page.locator('.cs-project-complete')).to_be_visible()
    final_images = capture('complete')
    if project == 'station':
        assert any('fire/pump_engine.png' in item['href'] and item['renderedWidth'] > 0 for item in final_images['images']['svg']), final_images
    final_exp = total_exp(page)
    assert final_exp == initial_exp + 60, {'initialExp': initial_exp, 'finalExp': final_exp}
    for turn in range(2):
        touch(page, '[data-action="play-scene"]')
        expect(page.locator('[data-action="play-scene"]')).to_be_disabled()
        page.wait_for_timeout(1000)
        capture(f'play-{turn+1}')
        expect(page.locator('[data-action="play-scene"]')).to_be_enabled()
        if project == 'playground' and viewport['width'] == 390 and turn == 0:
            endpoint = capture('walk-finished')
            feet = endpoint['layout']['sceneCoordinates']['walkerFeet']
            assert abs(feet[0]['x'] - 366) < 1 and abs(feet[0]['y'] - 262) < 1, feet
        assert total_exp(page) == final_exp, 'replay must not grant another completion reward'
    speech = page.evaluate('i=>window.__voiceTrace.slice(i).filter(r=>r.kind==="tts")', voice_start)
    assert speech, 'No project instructions were spoken'
    if language == 'en':
        assert all(row['lang'].startswith('en') and not re.search('[가-힣]', row['text']) for row in speech), speech
    else:
        assert any(re.search('[가-힣]', row['text']) for row in speech), speech
    touch(page, '.cs-work-buttons [data-action="projects"]')
    expect(page.locator('.cs-project-picker')).to_be_visible()
    touch(page, f'[data-project="{project}"]')
    expect(page.locator('#csProjectScene svg')).to_have_attribute('data-progress', '0')
    return {'project': project, 'jobs': results, 'finalExpGain': final_exp-initial_exp,
            'replayKeepsReward': True, 'reentryStartsNewProject': True, 'speech': speech}


def interrupted_work(page, capture):
    touch(page, '[data-project="bridge"]')
    offered = page.locator('.cs-choice').evaluate_all('els=>els.map(e=>e.dataset.id)')
    answer = next(x for x in offered if x in VALID['dig'])
    touch(page, f'.cs-choice[data-id="{answer}"]')
    expect(page.locator('.cs-root')).to_have_attribute('data-phase', 'ready')
    before_exp = total_exp(page)
    touch(page, '[data-action="auto-work"]')
    touch(page, '.game-back-floating')
    expect(page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]')).to_be_visible()
    page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]',).click()
    expect(page.locator('.cs-project-picker')).to_be_visible()
    touch(page, '[data-project="station"]')
    page.wait_for_timeout(1700)
    expect(page.locator('.cs-root')).to_have_attribute('data-phase', 'choose')
    expect(page.locator('#csProjectScene svg')).to_have_attribute('data-progress', '0')
    assert total_exp(page) == before_exp, 'destroyed work must not grant an old reward'
    capture('new-session-after-old-work')
    return {'oldWorkCancelled': True, 'newProject': 'station', 'lateReward': False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url')
    parser.add_argument('--output', required=True, type=pathlib.Path)
    args = parser.parse_args()
    out = args.output.resolve(); out.mkdir(parents=True, exist_ok=True)
    expected = hashes()
    report = {'gitSha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT).decode().strip(),
              'sourceHashesBefore': expected, 'checks': [], 'pageErrors': [], 'screenshots': [], 'loadedSources': [],
              'scope': 'Public project choices and native touch; simulated audio completion. Physical device and audible speech NOT_RUN.'}
    server = None
    if args.base_url:
        base = normalize(args.base_url)
    else:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QA['QuietServer'], directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f'http://127.0.0.1:{server.server_port}/'
    report['baseUrl'] = base
    try:
        report['servedSourcesBefore'] = fetched_sources(base, expected)
        assert report['servedSourcesBefore']['matchesCheckout'], report['servedSourcesBefore']
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            report['browserVersion'] = browser.version
            runs = [(f'{p}-{w}x{h}', p, w, h, 'ko', 'project') for p, w, h in CASES]
            runs += [('station-English-390x844', 'station', 390, 844, 'en', 'project'),
                     ('interrupt-work-390x844', None, 390, 844, 'ko', 'interrupt')]
            for name, project, width, height, language, kind in runs:
                row = {'name': name}; report['checks'].append(row)
                context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True, service_workers='block')
                context.add_init_script(QA['PROBE'])
                context.add_init_script('Math.random = () => 0.3;')
                page = context.new_page(); responses = {}
                paths = {urlsplit(urljoin(base, path)).path: path for path in LOADED}
                def remember(response):
                    key = paths.get(urlsplit(response.url).path)
                    if key:
                        responses[key] = response
                page.on('response', remember)
                page.on('pageerror', lambda error, n=name: report['pageErrors'].append({'screen': n, 'error': str(error)}))
                def capture(label):
                    images = decoded_art(page)
                    layout = page.evaluate(LAYOUT)
                    filename = name + '-' + label
                    page.screenshot(path=str(out / (filename + '.png')))
                    detail = {'layout': layout, 'images': images}
                    (out / (filename + '.json')).write_text(json.dumps(detail, ensure_ascii=False, indent=2))
                    report['screenshots'].append(filename + '.png')
                    assert not layout['issues'], layout['issues']
                    return detail
                try:
                    open_game(page, base, language)
                    report['loadedSources'].append({'case': name, 'sources': loaded_sources(responses, expected)})
                    row['detail'] = project_flow(page, project, capture, language) if kind == 'project' else interrupted_work(page, capture)
                    row['status'] = 'PASS'
                except Exception as exc:
                    row.update(status='FAIL', error=str(exc), trace=traceback.format_exc())
                    try:
                        page.screenshot(path=str(out / (name + '-failure.png')))
                        row['screenshot'] = name + '-failure.png'
                    except Exception:
                        pass
                finally:
                    context.close()
                print(name, row['status'], row.get('error', ''), flush=True)
            browser.close()
    except Exception as exc:
        report['runnerError'] = str(exc); report['runnerTrace'] = traceback.format_exc()
    finally:
        try:
            report['servedSourcesAfter'] = fetched_sources(base, expected)
        except Exception as exc:
            report['servedSourcesAfter'] = {'matchesCheckout': False, 'error': str(exc)}
        if server:
            server.shutdown()
        report['sourceHashesAfter'] = hashes()
        report['sourcesUnchanged'] = expected == report['sourceHashesAfter']
        report['status'] = 'PASS' if len(report['checks']) == 20 and all(row['status'] == 'PASS' for row in report['checks']) and not report['pageErrors'] and not report.get('runnerError') and report['sourcesUnchanged'] and report.get('servedSourcesBefore', {}).get('matchesCheckout') and report['servedSourcesAfter']['matchesCheckout'] else 'FAIL'
        (out / 'construction-stage4-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print('CONSTRUCTION_STAGE4', report['status'], flush=True)
    return int(report['status'] != 'PASS')


if __name__ == '__main__':
    raise SystemExit(main())
