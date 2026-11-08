"""Real Chromium vehicle regression. Not a physical-phone or audible-TTS test."""
import argparse,functools,hashlib,http.server,json,pathlib,threading,traceback
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--base-url');p.add_argument('--output',default='qa-vehicle-browser');a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];out=pathlib.Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True)
inv=json.loads((root/'docs/qa/sihyeon-phase2/vehicle-inventory.json').read_text());entries=inv['entries']
assert len(entries)==138 and len({e['file'] for e in entries})==138
report={'scope':'Actual Chromium rendering and native mouse clicks; controlled count fixture clearly separated from menu sessions','checks':[],'pageErrors':[],'sourceHashes':{}}
for name in ['js/vehicle-display.js','js/games/number-count.js','js/games/parking-lot.js','js/games/vehicle-memory.js','js/games/construction-site.js','js/games/megaDispatch.js','assets/vehicles/display_bounds.json']:
 report['sourceHashes'][name]=hashlib.sha256((root/name).read_bytes()).hexdigest()
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=None
if a.base_url:base=a.base_url.rstrip('/')+'/'
else:
 server=http.server.ThreadingHTTPServer(('127.0.0.1',8878),functools.partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start();base='http://127.0.0.1:8878/'
report['baseUrl']=base

def check(name,fn):
 try:report['checks'].append({'name':name,'status':'PASS','detail':fn()})
 except Exception as e:report['checks'].append({'name':name,'status':'FAIL','error':str(e),'trace':traceback.format_exc()})
 print(report['checks'][-1],flush=True)
def enter(pg,zone,action):
 pg.goto(base+'index.html',wait_until='load');pg.locator('.world-zone[onclick="travelToZone(\'%s\')"]'%zone).click();pg.locator('.zone-game-card[onclick="%s()"]'%action).click()
def images_ok(pg,selector):
 pg.wait_for_function('(s)=>[...document.querySelectorAll(s)].length>0 && [...document.querySelectorAll(s)].every(i=>i.complete&&i.naturalWidth>0)',arg=selector,timeout=20000)

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True);report['browser']=browser.version
 ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block');pg=ctx.new_page();pg.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
 def all_images():
  pg.goto(base+'scripts/qa-phase2-vehicle-scene.html',wait_until='load')
  results=pg.evaluate('''async entries=>{const result=[];for(let i=0;i<entries.length;i+=8){result.push(...await Promise.all(entries.slice(i,i+8).map(e=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve({file:e.file,width:image.naturalWidth,height:image.naturalHeight,pass:image.naturalWidth===e.after.width&&image.naturalHeight===e.after.height});image.onerror=()=>resolve({file:e.file,pass:false});image.src=e.file;}))));}return result;}''',entries)
  (out/'all-138-image-decodes.json').write_text(json.dumps(results,indent=2));assert all(x['pass'] for x in results)
  return {'images':len(results),'failures':0}
 check('all 138 exact image paths decode in Chromium',all_images)
 def matrix():
  vehicle=next(e for e in entries if e['id']=='tractor');results=[]
  for w,h in [(390,844),(844,390),(360,640),(768,1024),(1024,768),(1280,800)]:
   pg.set_viewport_size({'width':w,'height':h})
   for count in [1,5,9,11,20,30]:
    pg.evaluate('async v=>vehicleQA.render(v[0],v[1])',[vehicle,count])
    pg.wait_for_function('vehicleQA.inspect().settled && vehicleQA.inspect().imageFailures===0',timeout=15000)
    result=pg.evaluate('vehicleQA.inspect()');results.append(result)
    assert result['pass'] and result['uniformAspectFit'],str(result)
    if count in [1,30]:pg.screenshot(path=str(out/('count-%s-%sx%s.png'%(count,w,h))))
  for key in ['aerial_ladder_truck','snow_rescue_vehicle','submarine','garbage_truck','lowbed_trailer']:
   e=next(e for e in entries if e['id']==key);pg.set_viewport_size({'width':844,'height':390});pg.evaluate('async v=>vehicleQA.render(v[0],v[1])',[e,9]);pg.wait_for_function('vehicleQA.inspect().settled && vehicleQA.inspect().imageFailures===0',timeout=15000);result=pg.evaluate('vehicleQA.inspect()');assert result['pass'];pg.screenshot(path=str(out/('count-special-'+key+'.png')))
  (out/'count-36-layouts.json').write_text(json.dumps(results,indent=2));return {'matrix':36,'additionalExtremeAssets':5,'source':'actual number-count module with explicit QA count/vehicle inputs'}
 check('actual counting module 6 quantities x 6 sizes and extreme proportions',matrix);ctx.close()
 for w,h in [(390,844),(844,390)]:
  ctx=browser.new_context(viewport={'width':w,'height':h},service_workers='block');pg=ctx.new_page()
  def parking():
   enter(pg,'cars','openParkingGame');pg.locator('.pl-car-drag').first.wait_for();pg.locator('.pl-cat-chip[data-cat="farm"]').click();images_ok(pg,'.pl-car-drag img')
   ids=pg.locator('.pl-car-drag').evaluate_all('(els)=>els.map(x=>x.dataset.vehicleId)');assert len(ids)==4
   pg.locator('[data-vehicle-id="%s"]'%ids[0]).click();pg.locator('[data-slot-id="%s"]'%ids[1]).click();pg.wait_for_timeout(1100);assert pg.locator('.pl-slot.correct').count()==0
   car=pg.locator('[data-vehicle-id="%s"]'%ids[0]);box=car.bounding_box();pg.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);pg.mouse.down();pg.mouse.move(2,2,steps=12);pg.mouse.up();pg.wait_for_timeout(750);assert pg.locator('.pl-slot.correct').count()==0
   for key in ids:
    pg.locator('[data-vehicle-id="%s"]'%key).click();pg.locator('[data-slot-id="%s"]'%key).click();pg.wait_for_timeout(650)
   pg.locator('.pl-success-overlay').wait_for(timeout=12000);pg.screenshot(path=str(out/('parking-complete-%sx%s.png'%(w,h))));pg.locator('.pl-btn-next').click();assert pg.locator('.pl-slot.correct').count()==0
   return {'size':[w,h],'wrongTap':True,'outsideDrop':True,'fourCorrect':True,'nextRound':True}
  check('native parking wrong/outside/correct/next %sx%s'%(w,h),parking);ctx.close()
 ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block');pg=ctx.new_page()
 def memory():
  enter(pg,'game','openMemoryGame');pg.locator('.memory-card').first.wait_for();pg.wait_for_function('!document.querySelector(".memory-card.is-preview")',timeout=15000)
  cards=pg.locator('.memory-card').evaluate_all('(es)=>es.map(e=>({i:e.dataset.index,k:e.dataset.pairKey}))');pairs={}
  for card in cards:pairs.setdefault(card['k'],[]).append(card['i'])
  for key,indices in pairs.items():
   assert len(indices)==2
   for index in indices:pg.locator('.memory-card[data-index="%s"]'%index).click();pg.wait_for_timeout(220)
   pg.wait_for_timeout(1100)
  pg.locator('[data-action="next"]').last.wait_for(timeout=12000);pg.screenshot(path=str(out/'memory-complete.png'));pg.locator('[data-action="next"]').last.click();return {'pairs':len(pairs),'completed':True,'next':True}
 check('native matching complete round and next',memory);ctx.close()
 ctx=browser.new_context(viewport={'width':844,'height':390},service_workers='block');pg=ctx.new_page()
 def construction():
  enter(pg,'cars','openConstructionSiteGame');pg.locator('.cs-choice').first.wait_for()
  mapping={'dig':['excavator','mini_excavator'],'push':['bulldozer'],'load':['wheel_loader'],'carry':['dump_truck'],'mix':['concrete_mixer'],'lift':['crane_truck','forklift'],'pump':['concrete_pump_truck']};played=[]
  for turn in range(3):
   pg.locator('.cs-choice:not(.is-disabled)').first.wait_for(timeout=15000);cls=pg.locator('.cs-root').get_attribute('class');kind=next(k for k in mapping if 'cs-stage-'+k in cls);before=pg.locator('.cs-pill').inner_text()
   available=pg.locator('.cs-choice').evaluate_all('(es)=>es.map(e=>e.dataset.id)');correct=next(x for x in available if x in mapping[kind]);pg.locator('.cs-choice[data-id="%s"]'%correct).click();played.append(kind)
   if turn<2:pg.wait_for_function('(v)=>document.querySelector(".cs-pill")?.textContent!==v',arg=before,timeout=20000)
  pg.locator('[data-action="restart-complete"]').wait_for(timeout=20000);pg.screenshot(path=str(out/'construction-complete.png'));return {'rounds':3,'missions':played}
 check('native construction all three missions',construction);ctx.close()
 ctx=browser.new_context(viewport={'width':844,'height':390},service_workers='block');pg=ctx.new_page()
 def dispatch():
  enter(pg,'cars','openMegaDispatchGame');pg.locator('[data-mode-size="4"]').click();pg.locator('.md14-truck-btn').first.wait_for(timeout=20000);clicks=0
  for step in range(35):
   if pg.locator('[data-action="replay"]').count():break
   target=pg.locator('.md-mission-card.active img').get_attribute('src');buttons=pg.locator('.md14-truck-btn').evaluate_all('(es)=>es.map(e=>({id:e.dataset.gameId,src:e.querySelector("img")?.getAttribute("src")}))');chosen=next(x for x in buttons if x['src']==target)
   old=pg.locator('.md14-level-badge').inner_text();pg.locator('[data-game-id="%s"]'%chosen['id']).click();clicks+=1
   pg.wait_for_function('(old)=>!!document.querySelector("[data-action=replay]") || document.querySelector(".md14-level-badge")?.textContent!==old',arg=old,timeout=20000);pg.wait_for_timeout(700)
  pg.locator('[data-action="replay"]').wait_for(timeout=12000);pg.screenshot(path=str(out/'fire-dispatch-complete.png'));return {'mode':4,'correctDispatches':clicks,'completed':True}
 check('native fire dispatch completed mission sequence',dispatch);ctx.close();browser.close()
if server:server.shutdown()
report['status']='PASS' if all(x['status']=='PASS' for x in report['checks']) and not report['pageErrors'] else 'FAIL'
(out/'vehicle-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('VEHICLE_BROWSER',report['status'],flush=True);raise SystemExit(0 if report['status']=='PASS' else 1)
