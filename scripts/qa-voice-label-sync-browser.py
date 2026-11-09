"""Voice sync release: inspect the actual clicked item and speechSynthesis request.
This test does not hear speakers or certify content of legacy MP3 recordings.
"""
import argparse, functools, http.server, json, pathlib, re, threading, traceback
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--output',default='qa-voice-sync')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
out=pathlib.Path(args.output).resolve()
out.mkdir(parents=True,exist_ok=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

server=http.server.ThreadingHTTPServer(('127.0.0.1',8887),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:8887/index.html'
report={'scope':'Actual Chromium button/DOM events and observed speechSynthesis request text; no audio hearing or physical phone test','checks':[], 'errors':[]}

def check(name, action):
    try:
        data=action()
        report['checks'].append({'name':name,'status':'PASS','data':data})
    except Exception as exc:
        report['checks'].append({'name':name,'status':'FAIL','error':str(exc),'trace':traceback.format_exc()})
    print(report['checks'][-1],flush=True)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width,height in [(390,844),(844,390)]:
        context=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
        page=context.new_page()
        page.on('pageerror',lambda error:report['errors'].append(str(error)))
        def start():
            page.goto(base,wait_until='load',timeout=40000)
            page.evaluate("""() => {
              window.__heard = [];
              window.__canceled = 0;
              const synth=window.speechSynthesis;
              synth.cancel=function(){window.__canceled++;};
              synth.speak=function(utterance){
                window.__heard.push({text:utterance.text,lang:utterance.lang});
                setTimeout(()=>utterance.onend?.(),25);
              };
            }""")
        def clear():page.evaluate('window.__heard.length=0')
        def last():
            heard=page.evaluate('window.__heard')
            assert heard,'Expected a speech request but none arrived'
            return heard[-1]
        def compare(lang,kind,value):
            expected=page.evaluate("""([kind,id,lang]) => SihyeonVoiceLabels.spoken(kind,id,lang)""",[kind,value,lang])
            actual=last()
            assert expected and actual['text']==expected,(kind,value,lang,expected,actual)
            assert actual['lang']==('en-US' if lang=='en' else 'ko-KR'),actual
            return {'kind':kind,'id':value,'spoken':actual['text'],'lang':actual['lang']}
        def art_all():
            start()
            page.evaluate('openArtZoneGame()')
            page.locator('.az-root').wait_for()
            checkResults=[]
            for lang in ['ko','en']:
                page.evaluate("(lang) => SihyeonPlaySettings.setLanguage(lang)",lang)
                templates=page.evaluate("SihyeonVoiceLabels.templates.filter(x=>x.id!=='helicopter').map(x=>x.id)")
                for t in templates:
                    clear()
                    if t in ['police','fire_ladder','dino','icecream']:
                        page.locator('[data-tpl="'+t+'"]').click(timeout=6000)
                    else:
                        page.evaluate("(id) => document.querySelector('[data-tpl=\"'+id+'\"]').click()",t)
                    checkResults.append(compare(lang,'template',t))
                colors=page.evaluate("SihyeonVoiceLabels.palettes.map(x=>x.hex)")
                for color in colors:
                    clear()
                    if color in ['rainbow','#1A1A1A','#FF4444','#4488FF']:
                        page.locator('.az-color-circle[data-color="'+color+'"]').click(timeout=6000)
                    else:
                        page.evaluate("(hex) => document.querySelector('.az-color-circle[data-color=\"'+hex+'\"]').click()",color)
                    checkResults.append(compare(lang,'color',color))
            page.screenshot(path=str(out/('art-'+str(width)+'x'+str(height)+'.png')),full_page=True)
            assert len(checkResults)==62,len(checkResults)
            return {'viewport':[width,height],'languageModes':2,'templates':15,'colors':16,'verified':len(checkResults),'examples':[x for x in checkResults if x['id'] in ['police','dino','icecream','#FF4444']]}
        check('art picture+color real buttons '+str(width)+'x'+str(height),art_all)
        def blocks_both():
            samples=[]
            for lang in ['ko','en']:
                page.evaluate("(value) => SihyeonPlaySettings.setLanguage(value)",lang)
                clear()
                page.evaluate('openNumberBlocksGame()')
                first=page.locator('.nb-tray .nb-block').first
                first.wait_for(timeout=10000)
                value=int(first.get_attribute('data-val'))
                first.click(timeout=6000)
                page.wait_for_function("window.__heard.length > 0",timeout=4000)
                page.wait_for_timeout(610)
                expected=page.evaluate("(n) => SihyeonVoiceLabels.numberEn(n)",value) if lang=='en' else page.evaluate("(n) => SihyeonVoiceLabels.numberKo(n)",value)
                phrase=last()
                assert phrase['text'].lower().startswith(expected.lower()),(lang,value,expected,phrase)
                assert phrase['lang']==('en-US' if lang=='en' else 'ko-KR'),phrase
                samples.append({'value':value,'phrase':phrase})
            return samples
        check('number-block click speaks actual value '+str(width)+'x'+str(height),blocks_both)
        def menu_ko_en():
            results=[]
            for lang in ['ko','en']:
                page.evaluate("(value) => SihyeonPlaySettings.setLanguage(value)",lang)
                clear()
                page.evaluate("openStoryLand()")
                expect='만화극장' if lang=='ko' else 'Story time! Let\'s listen!'
                page.wait_for_function("(text) => window.__heard.some(x=>x.text===text)",arg=expect,timeout=9000)
                heard=page.evaluate('window.__heard')
                assert not any(x['text']=='글자놀이터' for x in heard),heard
                results.append({'lang':lang,'expected':expect,'heard':heard})
            return results
        check('story-zone menu never says letters '+str(width)+'x'+str(height),menu_ko_en)
        context.close()
    browser.close()
server.shutdown()
report['status']='FAIL' if report['errors'] or any(c['status']=='FAIL' for c in report['checks']) else 'PASS'
(out/'voice-label-sync-browser.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('VOICE_LABEL_SYNC_BROWSER',report['status'],flush=True)
raise SystemExit(0 if report['status']=='PASS' else 1)
