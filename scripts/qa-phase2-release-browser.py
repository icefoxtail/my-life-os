"""Chromium release evidence; no physical-device or audible-TTS claim."""
import argparse, functools, hashlib, http.server, json, pathlib, threading, traceback
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base-url')
parser.add_argument('--output',default='qa-release-evidence')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
out=pathlib.Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
report={'scope':'Chromium DOM/Pointer Events plus native Playwright clicks; not physical-device/audio QA','checks':[],'pageErrors':[],'sources':{}}
for path in ['index.html','sw.js','js/games/pattern-train-model.js','js/games/pattern-train.js','css/games/pattern-train.css','scripts/qa-pattern-train-browser.js']:
    report['sources'][path]=hashlib.sha256((root/path).read_bytes()).hexdigest()
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
server=None
if args.base_url: base=args.base_url.rstrip('/')+'/'
else:
    server=http.server.ThreadingHTTPServer(('127.0.0.1',8877),functools.partial(Quiet,directory=str(root)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base='http://127.0.0.1:8877/'
report['baseUrl']=base

def check(name,fn):
    try: report['checks'].append({'name':name,'status':'PASS','detail':fn()})
    except Exception as e: report['checks'].append({'name':name,'status':'FAIL','error':str(e),'trace':traceback.format_exc()})
    print(report['checks'][-1],flush=True)

def snapshot(page): return page.evaluate('SihyeonGames.patternTrain.getSnapshot()')
def number_land(page): page.locator('.world-zone[onclick="travelToZone(\'numbers\')"]').click()
def train_card(page): page.locator('.zone-game-card[onclick="openPatternTrainGame()"]').click()
def enter(page,age=4):
    page.goto(base+'index.html',wait_until='load')
    page.locator('[data-home-age="%s"]'%age).click()
    number_land(page);train_card(page)
    page.locator('.pt-app').wait_for();page.wait_for_timeout(650)
def fresh(page):
    if snapshot(page)['state']['phase']=='ARRIVED': page.locator('[data-action="edit"]').click()
    page.locator('[data-action="restart"]').click();page.locator('[data-action="confirm-reset"]').click()
    page.wait_for_timeout(550)
def solve(page):
    task=page.evaluate('SihyeonPatternTrainModel.taskFor(SihyeonGames.patternTrain.getSnapshot().taskId)')
    if task['kind']=='unit':
        period=page.evaluate('(t)=>SihyeonPatternTrainModel.minimalPeriod(t.clues)',task)
        page.locator('[data-action="period"][data-period="%s"]'%period).click()
    else:
        assert task.get('unit'),'This native-menu smoke expects a fixed first activity'
        for i,clue in enumerate(task['clues']):
            if clue is None:
                token=task['unit'][i%len(task['unit'])]
                page.locator('[data-action="select"][data-token="%s"]'%token).click()
                page.locator('[data-action="seat"][data-index="%s"]'%i).click()
    page.locator('[data-action="start"]').click()
    page.wait_for_function('SihyeonGames.patternTrain.getSnapshot().state.phase==="ARRIVED"',timeout=18000)
    return snapshot(page)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True);report['browser']=browser.version
    context=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
    page=context.new_page();page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
    def fixture():
        page.goto(base+'scripts/qa-pattern-train.html?autotest=1',wait_until='load')
        page.wait_for_function('window.patternTrainBrowserQa && ["PASS","FAIL"].includes(patternTrainBrowserQa.status)',timeout=300000)
        result=page.evaluate('patternTrainBrowserQa')
        (out/'train-final24.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
        page.screenshot(path=str(out/'train-final24.png'),full_page=True)
        assert result['status']=='PASS' and result['passed']==24,str(result)
        return {'passed':result['passed'],'failed':result['failed']}
    check('latest fixture: all ages, failure recovery and six viewports',fixture);context.close()
    for age in [4,5,6,7]:
        ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
        pg=ctx.new_page();pg.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
        def menu_session():
            enter(pg,age);fresh(pg);task=snapshot(pg)['taskId']
            for w,h in [(390,844),(844,390),(360,640),(768,1024),(1024,768),(1280,800)]:
                pg.set_viewport_size({'width':w,'height':h});pg.wait_for_timeout(350)
                assert snapshot(pg)['taskId']==task,'orientation lost board'
                pg.screenshot(path=str(out/('train-age%s-%sx%s.png'%(age,w,h))))
                assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth'),'page overflow'
            pg.set_viewport_size({'width':390,'height':844});arrived=solve(pg)
            assert arrived['state']['departures']==1
            pg.screenshot(path=str(out/('train-age%s-arrived.png'%age)))
            pg.locator('[data-action="home"]').click();train_card(pg)
            assert snapshot(pg)['state']['board']==arrived['state']['board']
            pg.reload(wait_until='load');number_land(pg);train_card(pg)
            assert snapshot(pg)['state']['board']==arrived['state']['board']
            assert snapshot(pg)['state']['phase']=='ARRIVED'
            pg.locator('[data-action="edit"]').click()
            assert snapshot(pg)['state']['phase']=='BUILDING'
            return {'age':age,'task':task,'departures':1,'exitAndReloadRestored':True,'sixSizes':True}
        check('real menu and representative play age '+str(age),menu_session);ctx.close()
    for missing in ['model','ui','card']:
        ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block');pg=ctx.new_page()
        pattern={'model':'**/js/games/pattern-train-model.js','ui':'**/js/games/pattern-train.js','card':'**/assets/games/pattern-train/card.svg'}[missing]
        pg.route(pattern,lambda route:route.abort())
        def failure():
            pg.goto(base+'index.html',wait_until='load');number_land(pg);train_card(pg)
            if missing=='card':
                pg.locator('.pt-app').wait_for();assert pg.locator('.pt-token').count()>0
            else:
                assert '기차를 불러오지 못했어요' in pg.locator('#patternTrainTarget').inner_text()
                pg.locator('.game-back-floating').click()
                pg.locator('.zone-game-card[onclick="openPatternTrainGame()"]').wait_for()
            return {'blockedResource':missing,'escapeOrPlay':True}
        check('network failure '+missing,failure);ctx.close()
    for zone,action in [('numbers','openNumberPostOfficeGame'),('numbers','openNumberCountGame'),('game','openMemoryGame'),('game','openArtZoneGame'),('cars','openParkingGame'),('cars','openConstructionSiteGame'),('cars','openCarGarageGame'),('cars','openMegaDispatchGame')]:
        ctx=browser.new_context(viewport={'width':844,'height':390},service_workers='block');pg=ctx.new_page()
        def legacy():
            pg.goto(base+'index.html',wait_until='load')
            pg.locator('.world-zone[onclick="travelToZone(\'%s\')"]'%zone).click()
            pg.locator('.zone-game-card[onclick="%s()"]'%action).click()
            pg.locator('.game-play-body').wait_for();pg.wait_for_timeout(1600)
            body=pg.locator('.game-play-body')
            assert body.locator('button,canvas,svg,img').count()>0,'game has no controls/art'
            assert '불러오지 못했어요' not in body.inner_text(),'load error'
            pg.screenshot(path=str(out/(action+'.png')))
            return {'action':action,'scope':'actual-menu entry, controls/art present; not a full legacy session'}
        check('legacy entry '+action,legacy);ctx.close()
    browser.close()
if server: server.shutdown()
report['status']='FAIL' if any(x['status']=='FAIL' for x in report['checks']) or report['pageErrors'] else 'PASS'
(out/'release-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('RELEASE_BROWSER',report['status'],flush=True)
raise SystemExit(0 if report['status']=='PASS' else 1)
