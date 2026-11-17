"""Stage 5 public UI continuity. Only browser speech transport is a fixture.
Checks actual DOM identity, counts, pause/mute, grouping and responsive controls.
No physical-device or audible-speech claim is made.
"""
import argparse
import functools
import hashlib
import http.server
import importlib.util
import json
import pathlib
import threading
import traceback
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
    result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result);return result
N=module('number_continuity_base','qa-number-picture-browser.py')
G=module('garden_continuity_base','qa-ten-frame-garden-browser.py')
SIZES=[(320,568),(390,844),(640,360),(844,390),(768,1024),(1024,768)]

def wait_number(page,n):
    page.wait_for_function('n=>{const s=SihyeonGames.numberPicture.getSnapshot();return s.quantity===n&&s.complete&&s.sequence.status==="completed"}',arg=n,timeout=25000)
    s=N.snap(page);assert s['actualCount']==n and s['counted']==n,s
    assert page.locator('.qp-item.is-current').count()==0
    return s

def remember_number(page):
    page.evaluate('window.__keptItems=[...document.querySelectorAll(".qp-item")]')

def assert_number_identity(page,n):
    actual=page.evaluate('n=>__keptItems.slice(0,n).every((e,i)=>e===document.querySelector(`[data-object-index="${i}"]`))',n)
    assert actual,'Existing pictures were replaced'

def control_bounds(page,selectors):
    data=page.evaluate('selectors=>selectors.map(selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect();const center=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {selector,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,hit:e===center||e.contains(center)}})',selectors)
    for r in data:
        assert r['width']>=43.5 and r['height']>=43.5,r
        assert r['x']>=0 and r['y']>=0 and r['right']<=page.viewport_size['width']+1 and r['bottom']<=page.viewport_size['height']+1 and r['hit'],r
    return data

def number_change(page,base,out,size):
    N.enter(page,base);N.select_number(page,15);wait_number(page,15);remember_number(page)
    N.action(page,'plus');assert_number_identity(page,15);added=wait_number(page,16)
    assert added['sequence']['totalSteps']==1,added
    N.action(page,'minus');assert_number_identity(page,15);removed=wait_number(page,15)
    assert removed['sequence']['totalSteps']==1,removed
    for expected in ['tens','scatter','rows']:
        old=N.snap(page)['sequence']['runId'];N.action(page,'layout');assert_number_identity(page,15)
        now=N.snap(page);assert now['layout']==expected and now['sequence']['runId']==old and now['actualCount']==15,now
    layout=N.image_and_layout(page);controls=control_bounds(page,['[data-qp-action="pause"]','[data-qp-action="replay"]'])
    name=f'number-continuity-{size[0]}x{size[1]}.png';page.screenshot(path=str(out/name))
    return {'added':added,'removed':removed,'retainedPictures':15,'layout':layout,'controls':controls,'screenshot':name}

def number_pause(page,base,out):
    N.enter(page,base);page.evaluate('__numberPictureSpeech.delayMs=1200');N.select_number(page,15)
    page.wait_for_function('SihyeonGames.numberPicture.getSnapshot().counted>=2')
    N.action(page,'pause');paused=N.snap(page);remember_number(page);page.wait_for_timeout(500)
    assert N.snap(page)['counted']==paused['counted'] and N.snap(page)['sequence']['status']=='paused'
    N.action(page,'mute');muted=N.snap(page)
    assert muted['counted']==paused['counted'] and muted['sequence']['runId']==paused['sequence']['runId'] and muted['sequence']['status']=='paused',muted
    N.action(page,'style','sino');changed=N.snap(page)
    assert changed['counted']==paused['counted'] and changed['sequence']['status']=='paused',changed
    N.action(page,'layout');assert_number_identity(page,15)
    N.action(page,'choosePicture');N.action(page,'closePictures')
    assert N.snap(page)['sequence']['status']=='paused','Closing chooser released an explicit pause'
    N.action(page,'pause');done=wait_number(page,15);assert done['muted'] and done['readingStyle']=='sino'
    # Resume must start after the last visible count, not from one.
    assert done['sequence']['totalSteps']==15-paused['counted']+1,done
    return {'paused':paused,'mutedSameRun':muted,'changedWhilePaused':changed,'done':done,'retainedPictures':15}


def number_modal_visibility(page,base,out):
    N.enter(page,base);N.select_number(page,15);wait_number(page,15)
    page.evaluate("""() => {window.__creatorDocHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__creatorDocHidden});}""")
    checks=[]
    for modal in ['chooser','settings']:
        page.evaluate('__numberPictureSpeech.delayMs=600');N.action(page,'replay')
        page.wait_for_function('SihyeonGames.numberPicture.getSnapshot().counted>=2')
        N.action(page,'choosePicture' if modal=='chooser' else 'settings')
        before=N.snap(page)
        page.evaluate("""() => {window.__creatorDocHidden=true;document.dispatchEvent(new Event('visibilitychange'));document.dispatchEvent(new Event('visibilitychange'));}""")
        if modal=='chooser':N.action(page,'closePictures')
        else:page.get_by_role('button',name='설정 닫기',exact=True).click()
        page.wait_for_timeout(250)
        held=N.snap(page)
        assert held['sequence']['status']=='paused' and held['counted']==before['counted'],held
        assert held['sequence']['runId']==before['sequence']['runId'],held
        page.evaluate("""() => {__numberPictureSpeech.delayMs=25;window.__creatorDocHidden=false;document.dispatchEvent(new Event('visibilitychange'));}""")
        done=wait_number(page,15);assert done['sequence']['runId']==before['sequence']['runId'],done
        checks.append({'modal':modal,'hidden':held,'visibleDone':done})
    return {'cases':checks,'fixture':'document visibility events only; native modal controls and real sequencer'}


def garden_change(page,base,out,size):
    G.enter(page,base+'index.html');G.button(page,'mode','free').click();G.choose_number(page,15);G.complete(page,15)
    assert G.snapshot(page)['state']['mode']=='free'
    page.evaluate('window.__keptSlots=[...document.querySelectorAll(".tfg-slot")];window.__keptFlowers=__keptSlots.slice(0,15).map(s=>s.querySelector("svg"))')
    G.button(page,'more').click();G.complete(page,16)
    assert page.evaluate('__keptFlowers.every((el,i)=>el===document.querySelector(`[data-slot="${i+1}"] svg`))')
    assert G.snapshot(page)['sequence']['totalSteps']==1
    G.button(page,'less').click();G.complete(page,15)
    assert page.evaluate('__keptFlowers.every((el,i)=>el===document.querySelector(`[data-slot="${i+1}"] svg`))')
    G.button(page,'mode','colors').click();G.complete(page,15)
    before=G.dom(page)['split'][0]
    page.evaluate('window.__colorFlowers=[...document.querySelectorAll(".tfg-slot[data-filled=true]")].map(s=>s.querySelector("svg"));window.__colorSlots=[...document.querySelectorAll(".tfg-slot")]')
    G.button(page,'split-more').click();G.complete(page,15);G.assert_colors(page,15,before+1)
    changed=page.evaluate('__colorFlowers.map((el,i)=>el!==document.querySelector(`[data-slot="${i+1}"] svg`)).filter(Boolean).length')
    assert changed==1,{'changedFlowerSVGs':changed}
    assert page.evaluate('__colorSlots.every((el,i)=>el===document.querySelector(`[data-slot="${i+1}"]`))')
    G.button(page,'mode','number').click();G.complete(page,15)
    groups=[]
    for kind in ['fives','tens']:
        start=G.click_and_mark(page,G.button(page,'group'));G.complete(page,15)
        state=G.snapshot(page);assert state['groupMode']==kind,state
        counts=[r for r in G.speech_rows(page,start) if r['kind']=='speak' and r['dom']['active']]
        expected=[5,10,15] if kind=='fives' else [10,15]
        assert [int(r['dom']['counter']) for r in counts]==expected,counts
        assert all(r['dom']['filled']==list(range(1,16)) for r in counts),counts
        groups.append({'strategy':kind,'ordinals':expected,'spoken':[r['text'] for r in counts]})
    layout=G.inspect_layout(page,*size);controls=control_bounds(page,['.tfg-app [data-action="pause"]','.tfg-app [data-action="group"]'])
    name=f'garden-continuity-{size[0]}x{size[1]}.png';page.screenshot(path=str(out/name))
    return {'retainedFlowers':15,'changedColorSVGs':changed,'groups':groups,'layout':layout,'controls':controls,'screenshot':name}

def garden_pause(page,base,out):
    G.enter(page,base+'index.html');page.evaluate('__gardenProbe.hold=true');G.choose_number(page,15)
    G.button(page,'pause').click();before=G.snapshot(page);G.button(page,'mute').click();G.button(page,'reading','sino').click()
    after=G.snapshot(page);page.wait_for_timeout(300)
    assert after['sequence']['status']=='paused' and G.snapshot(page)['state']['active']==after['state']['active']
    assert after['state']['count']==15 and after['muted'] and after['state']['reading']=='sino'
    G.button(page,'settings').click();G.button(page,'close-modal').first.click()
    assert G.snapshot(page)['sequence']['status']=='paused'
    page.evaluate('__gardenProbe.hold=false');G.button(page,'pause').click();G.complete(page,15)
    return {'before':before,'after':after,'completed':G.snapshot(page)}


def garden_modal_visibility(page,base,out):
    G.enter(page,base+'index.html');G.choose_number(page,15);G.complete(page,15)
    page.evaluate("""() => {window.__creatorDocHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__creatorDocHidden});}""")
    cases=[]
    for modal in ['number-picker','settings']:
        page.evaluate('__gardenProbe.hold=true');G.button(page,'replay').click()
        G.button(page,modal).click();before=G.snapshot(page)
        page.evaluate("""() => {window.__creatorDocHidden=true;document.dispatchEvent(new Event('visibilitychange'));document.dispatchEvent(new Event('visibilitychange'));}""")
        G.button(page,'close-modal').first.click();page.wait_for_timeout(250);held=G.snapshot(page)
        assert held['sequence']['status']=='paused' and held['state']['active']==before['state']['active'],held
        assert held['sequence']['runId']==before['sequence']['runId'],held
        page.evaluate("""() => {__gardenProbe.hold=false;window.__creatorDocHidden=false;document.dispatchEvent(new Event('visibilitychange'));}""")
        G.complete(page,15);done=G.snapshot(page);assert done['sequence']['runId']==before['sequence']['runId'],done
        cases.append({'modal':modal,'hidden':held,'visibleDone':done})
    return {'cases':cases,'fixture':'document visibility events only; native modal controls and real sequencer'}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--base-url');parser.add_argument('--output',default='qa-stage5-number-continuity');args=parser.parse_args()
    out=pathlib.Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
    report={'suite':'stage5-number-continuity','checks':[],'pageErrors':[],'limits':['Speech transport completion is a fixture; physical device, audible TTS and child observation NOT_RUN.']}
    paths=['index.html','sw.js','js/quantity-sequencer.js','js/games/number-picture.js','js/games/ten-frame-garden.js','css/games/number-picture.css','css/games/ten-frame-garden.css','scripts/qa-creator-number-continuity-browser.py','scripts/qa-number-picture-browser.py','scripts/qa-ten-frame-garden-browser.py']
    report['sourceSha256']={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in paths}
    server=None
    if args.base_url:base=args.base_url.rstrip('/')+'/'
    else:
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(N.QuietHandler,directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
    report['baseUrl']=base
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True)
            report['browser']=browser.version
            cases=[]
            for size in SIZES:
                cases.extend([(f'number-{size[0]}x{size[1]}',number_change,N.SPEECH_FIXTURE,size),(f'garden-{size[0]}x{size[1]}',garden_change,G.SPEECH_FIXTURE,size)])
            cases.extend([('number-pause-mute-style',number_pause,N.SPEECH_FIXTURE,(390,844)),('garden-pause-mute-style',garden_pause,G.SPEECH_FIXTURE,(390,844)),('number-hidden-modal-close',number_modal_visibility,N.SPEECH_FIXTURE,(390,844)),('garden-hidden-modal-close',garden_modal_visibility,G.SPEECH_FIXTURE,(390,844))])
            for name,fn,fixture,size in cases:
                context=browser.new_context(viewport={'width':size[0],'height':size[1]},service_workers='block')
                context.add_init_script(script=fixture);page=context.new_page();page.set_default_timeout(15000)
                page.on('pageerror',lambda e,name=name:report['pageErrors'].append({'case':name,'error':str(e)}))
                try:
                    data=fn(page,base,out,size) if fn in [number_change,garden_change] else fn(page,base,out)
                    row={'name':name,'status':'PASS','detail':data}
                except Exception as e:
                    row={'name':name,'status':'FAIL','error':str(e),'trace':traceback.format_exc()}
                    try:page.screenshot(path=str(out/(name+'-FAIL.png')))
                    except Exception:pass
                report['checks'].append(row);print(json.dumps({'name':name,'status':row['status'],'error':row.get('error')},ensure_ascii=False),flush=True);context.close()
            browser.close()
    except Exception as e:report['checks'].append({'name':'harness','status':'FAIL','error':str(e),'trace':traceback.format_exc()})
    finally:
        if server:server.shutdown();server.server_close()
        report['status']='PASS' if len(report['checks'])==16 and not report['pageErrors'] and all(r['status']=='PASS' for r in report['checks']) else 'FAIL'
        (out/'number-continuity-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return 0 if report['status']=='PASS' else 1
if __name__=='__main__':raise SystemExit(main())
