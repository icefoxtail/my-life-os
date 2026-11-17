"""Stage 5 arithmetic: public controls, conserved DOM and exact alternative results.

The shared voice engine runs with a speechSynthesis completion transport fixture.
No physical-device, speaker listening or child-learning outcome is claimed.
"""
import argparse, functools, hashlib, http.server, importlib.util, json, pathlib, threading, traceback
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('arithmetic_regression', ROOT/'scripts/qa-picture-arithmetic-browser.py')
qa = importlib.util.module_from_spec(spec); spec.loader.exec_module(qa)
SIZES = [(320,568),(390,844),(640,360),(844,390),(768,1024),(1024,768)]
FILES = ['js/games/picture-arithmetic.js','css/games/picture-arithmetic.css','js/quantity-sequencer.js','js/games/quantity-play-model.js','js/play-objects.js','js/voice-engine.js']

def completed(page):
    page.wait_for_function('SihyeonGames.pictureArithmetic.getSnapshot().complete', timeout=35000)
    return qa.snap(page)

def visible_play_controls(page):
    controls=page.evaluate('''()=>[...document.querySelectorAll('.pa-footer button,.pa-modes button')].map(e=>{
      const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return {action:e.dataset.paAction,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,hit:e===hit||e.contains(hit)};
    })''')
    for c in controls:
        assert c['width']>=43.5 and c['height']>=43.5,c
        assert c['x']>=0 and c['y']>=0 and c['right']<=page.viewport_size['width']+1 and c['bottom']<=page.viewport_size['height']+1 and c['hit'],c
    return controls

def main():
    p=argparse.ArgumentParser();p.add_argument('--base-url');p.add_argument('--output',default='qa-stage5-arithmetic');args=p.parse_args()
    out=pathlib.Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
    report={'scope':__doc__,'checks':[],'pageErrors':[],'screenshots':[],'sources':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in FILES}}
    server=None
    if args.base_url: base=args.base_url.rstrip('/')+'/'
    else:
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(qa.QuietHandler,directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start();base='http://127.0.0.1:%s/'%server.server_address[1]
    report['baseUrl']=base
    def capture(page,name):
        path=out/(name+'.png');page.screenshot(path=str(path));report['screenshots'].append(path.name)
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True)
            for width,height in SIZES:
                name=f'{width}x{height}'
                context=browser.new_context(viewport={'width':width,'height':height},has_touch=True,device_scale_factor=1,service_workers='block')
                context.add_init_script(qa.SPEECH_FIXTURE)
                page=context.new_page();page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
                loaded={}
                def observe(response):
                    path=response.url.split('?')[0].split('/my-life-os/')[-1] if '/my-life-os/' in response.url else response.url.split('/',3)[-1].split('?')[0]
                    if path in FILES and response.status==200:
                        loaded[path]=hashlib.sha256(response.body()).hexdigest()
                page.on('response',observe)
                try:
                    qa.enter(page,base);qa.addition(page,9,6);completed(page)
                    qa.action(page,'strategy');page.wait_for_function('SihyeonGames.pictureArithmetic.getSnapshot().strategy==="on"')
                    page.evaluate('window.__stage5Nodes=[...document.querySelectorAll(".pa-item")]')
                    on=completed(page)
                    assert on['counted']==15 and on['actualCount']==15 and on['sequence']['totalSteps']==8,on
                    assert page.evaluate('[...document.querySelectorAll(".pa-item")].every(n=>__stage5Nodes.includes(n))')
                    texts=qa.requests(page,0,on['sequence']['runId'])
                    assert [e['text'] for e in texts[1:-1]]==['열','열하나','열둘','열셋','열넷','열다섯'],texts
                    assert page.locator('.pa-add-items .pa-item').count()==15
                    geometry=qa.layout(page);geometry['playControls']=visible_play_controls(page);capture(page,'count-on-'+name)
                    page.evaluate('__arithmeticSpeech.delayMs=500')
                    qa.action(page,'replay');page.wait_for_function('SihyeonGames.pictureArithmetic.getSnapshot().counted>=10')
                    qa.action(page,'pause');paused=qa.snap(page);mark=qa.mark(page)
                    assert paused['paused'] and paused['sequence']['status']=='paused',paused
                    page.wait_for_timeout(450);assert qa.snap(page)['counted']==paused['counted']
                    qa.action(page,'mute');assert qa.snap(page)['sequence']['runId']==paused['sequence']['runId']
                    qa.action(page,'pause');continued=completed(page)
                    assert continued['counted']==15 and continued['sequence']['runId']==paused['sequence']['runId']
                    assert not qa.requests(page,mark,continued['sequence']['runId'])
                    qa.action(page,'mute');page.evaluate('__arithmeticSpeech.delayMs=25')
                    qa.sharing(page,7,3);first=completed(page)
                    assert first['actualGroups']==[2,2,2] and first['poolCount']==1
                    page.evaluate('window.__stage5ShareNodes=[...document.querySelectorAll(".pa-item")]')
                    qa.action(page,'keepRemainder');assert qa.snap(page)['remainderKept']
                    capture(page,'kept-remainder-'+name)
                    qa.action(page,'moreGroup');second=completed(page)
                    assert second['actualGroups']==[1,1,1,1] and second['poolCount']==3
                    assert not second['remainderKept'], 'A different distribution inherited the old basket choice'
                    assert page.evaluate('[...document.querySelectorAll(".pa-item")].every(n=>__stage5ShareNodes.includes(n))')
                    qa.action(page,'compareShares');assert page.locator('.pa-comparison-card').count()==2
                    rows=second['shareHistory'];assert [(r['groups'],r['each'],r['remainder']) for r in rows]==[(3,2,1),(4,1,3)]
                    geometry2=qa.layout(page);geometry2['playControls']=visible_play_controls(page);capture(page,'compare-sharing-'+name)
                    qa.action(page,'keepRemainder');assert qa.snap(page)['remainderKept']
                    for path in FILES: assert loaded.get(path)==report['sources'][path],(path,loaded.get(path),report['sources'][path])
                    qa.action(page,'home');assert not qa.snap(page)['active'];page.locator(qa.CARD).click();restored=completed(page)
                    assert restored['total']==7 and restored['groups']==4 and len(restored['shareHistory'])==2
                    assert restored['remainderKept'] and '다음에 쓸 그림' in page.locator('.pa-pool-title').inner_text()
                    report['checks'].append({'name':name+' count-on/pause/mute/remainder/reshare/comparison/reentry','status':'PASS','addition':on,'paused':paused,'reshared':second,'restored':restored,'layout':[geometry,geometry2],'loadedSources':loaded})
                except Exception as e:
                    capture(page,'failure-'+name);report['checks'].append({'name':name,'status':'FAIL','error':str(e),'trace':traceback.format_exc()})
                context.close()
            browser.close()
    except Exception as e: report['checks'].append({'name':'setup','status':'FAIL','error':str(e),'trace':traceback.format_exc()})
    finally:
        if server:server.shutdown()
    report['status']='PASS' if report['checks'] and not report['pageErrors'] and all(x['status']=='PASS' for x in report['checks']) else 'FAIL'
    (out/'arithmetic-strategies-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print('STAGE5_ARITHMETIC',report['status'],flush=True);return 0 if report['status']=='PASS' else 1
if __name__=='__main__':raise SystemExit(main())
