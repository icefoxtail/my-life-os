"""Chromium UI + TTS invocation smoke, not a physical/audio-listening claim."""
import argparse, functools, http.server, json, pathlib, re, threading, traceback
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--output',default='qa-english-evidence')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
out=pathlib.Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',8879),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={'scope':'Chromium English TTS invocation/DOM smoke, not speaker playback, Android/iOS or child observation','cases':[],'pageErrors':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True);report['browser']=browser.version
    for width,height in [(390,844),(844,390)]:
        context=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
        pg=context.new_page();pg.on('pageerror',lambda err: report['pageErrors'].append(str(err)))
        def check(name,fn):
            try:
                result=fn()
                report['cases'].append({'viewport':[width,height],'name':name,'status':'PASS','result':result})
            except Exception as exc:
                report['cases'].append({'viewport':[width,height],'name':name,'status':'FAIL','error':str(exc),'trace':traceback.format_exc()})
            print(report['cases'][-1],flush=True)
        def load():
            pg.goto('http://127.0.0.1:8879/index.html',wait_until='load')
            pg.evaluate("""() => {
                window.__spoken=[];
                const synth=window.speechSynthesis;
                synth.cancel=function(){window.__cancels=(window.__cancels||0)+1;};
                synth.speak=function(u){
                    window.__spoken.push({text:u.text,lang:u.lang});
                    setTimeout(()=>{if(typeof u.onend==='function')u.onend();},30);
                };
            }""")
            pg.wait_for_timeout(80)
        def latest(): return pg.evaluate('window.__spoken.slice()')
        def clear(): pg.evaluate('window.__spoken.length=0')
        def wait_phrase(needle):
            pg.wait_for_function("(text) => window.__spoken.some(s=>s.text.includes(text))",arg=needle,timeout=9000)
            pg.wait_for_timeout(670)  # catch any delayed home welcome interrupting gameplay
            items=latest()
            assert all(x['lang']=='en-US' for x in items),items
            assert all(not re.search(r'[\uac00-\ud7a3]',x['text']) for x in items),items
            assert not any(x['text']=="Hi there! Ready to play?" for x in items),items
            matching=[x for x in items if needle in x['text']]
            assert matching,items
            return matching[-1]
        def home():
            load()
            button=pg.locator('[data-language-toggle]')
            button.wait_for()
            bounds=button.bounding_box()
            assert bounds and bounds['x']>=0 and bounds['x']+bounds['width']<=width
            assert bounds['y']>=0 and bounds['y']+bounds['height']<=height
            button.click()
            assert pg.evaluate("SihyeonPlaySettings.getLanguage()")== 'en'
            assert pg.locator('[data-language-toggle]').get_attribute('aria-pressed')=='true'
            return {'language':'en','bounds':bounds}
        check('home language selection',home)
        if pg.evaluate("SihyeonPlaySettings.getLanguage()")!='en':
            context.close();continue
        def balloon():
            clear()
            pg.evaluate('openColorBalloonGame()')
            pg.wait_for_function("Boolean(SihyeonGames.colorBalloon.state.targetColor)")
            target=pg.evaluate('SihyeonGames.colorBalloon.state.targetColor.id')
            phrase=wait_phrase('Find the '+target+' balloon!')
            pg.screenshot(path=str(out/f'color-{width}x{height}.png'))
            return {'target':target,'utterance':phrase}
        check('color balloon contextual speech',balloon)
        def counting():
            clear()
            pg.evaluate("SihyeonPlaySettings.setChallenge('numberCount','1-5');openNumberCountGame()")
            pg.wait_for_function("Boolean(SihyeonGames.numberCount.state.currentVehicle)",timeout=15000)
            phrase=wait_phrase('How many ')
            answer=pg.evaluate("SihyeonGames.numberCount.state.currentAnswer")
            return {'answer':answer,'utterance':phrase}
        check('counting number question',counting)
        def train():
            clear()
            pg.evaluate('openPatternTrainGame()')
            pg.locator('.pt-app').wait_for(timeout=12000)
            pg.wait_for_function("window.__spoken.some(x=>/pattern|train|next/i.test(x.text))",timeout=8500)
            phrase=latest()[-1]
            assert phrase['lang']=='en-US' and not re.search(r'[\uac00-\ud7a3]',phrase['text']),phrase
            return phrase
        check('pattern train narration',train)
        def postoffice():
            clear()
            pg.evaluate('openNumberPostOfficeGame()')
            pg.wait_for_function("window.__spoken.some(x=>x.text.startsWith(\"Let's send\"))",timeout=9000)
            phrase=latest()[-1]
            assert phrase['lang']=='en-US'
            return phrase
        check('post office order narration',postoffice)
        def persisted():
            pg.reload(wait_until='load')
            assert pg.evaluate("SihyeonPlaySettings.getLanguage()")=='en'
            btn=pg.locator('[data-language-toggle]')
            assert btn.get_attribute('aria-pressed')=='true'
            btn.click()
            assert pg.evaluate("SihyeonPlaySettings.getLanguage()")=='ko'
            pg.reload(wait_until='load')
            assert pg.evaluate("SihyeonPlaySettings.getLanguage()")=='ko'
            return {'enPersists':True,'koRestores':True}
        check('persist and switch back to Korean',persisted)
        def latest_zone_wins():
            load()
            pg.evaluate("SihyeonPlaySettings.setLanguage('en')")
            clear()
            pg.evaluate("travelToZone('numbers');travelToZone('letters');")
            pg.locator('.zone-card-land .zone-title').wait_for(timeout=15000)
            pg.wait_for_timeout(1100)
            title=pg.locator('.zone-card-land .zone-title').inner_text()
            assert '글자놀이터' in title,title
            assert not any('Let's play with numbers!' in x['text'] for x in latest()),latest()
            return {'lastRequestedZone':'letters','actualTitle':title}
        check('rapid menu change drops obsolete route and voice',latest_zone_wins)
        context.close()
    browser.close()
server.shutdown()
report['status']='FAIL' if report['pageErrors'] or any(x['status']=='FAIL' for x in report['cases']) else 'PASS'
(out/'english-listening-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('ENGLISH_LISTENING_BROWSER',report['status'],flush=True)
raise SystemExit(0 if report['status']=='PASS' else 1)
