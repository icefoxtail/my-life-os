"""Independent visible-bounds and six-game browser review.

Audio completion is simulated; neither audible speech nor physical touch is claimed.
Coding uses its existing internal entry because it has no current public menu card.
"""
import argparse
import functools
import hashlib
import http.server
import json
import pathlib
import runpy
import subprocess
import threading
import traceback

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASELINE = "833cc1ec5cd38728850957c47b33a6bb24c0ada3"
QA = runpy.run_path(str(ROOT / "scripts/qa-p1-voice-browser.py"))
SIZES = [(390, 844), (844, 390), (640, 360), (768, 1024), (1024, 768), (1280, 800)]
GAMES = [
    ("count", "numbers", "openNumberCountGame", "#ncGame", ".nc-toy-block-btn, #ncRange"),
    ("memory", "game", "openMemoryGame", ".memory-game-container", ".memory-card"),
    ("parking", "cars", "openParkingGame", ".pl-root", ".pl-slot, .pl-car-drag"),
    ("construction", "cars", "openConstructionSiteGame", ".cs-root", ".cs-choice"),
    ("fire", "cars", "openMegaDispatchGame", ".md14-root", ".md14-truck-btn"),
    ("coding", "cars", "openCodingCarGame", ".cc-root", ".cc-btn-arrow, #ccGoBtn"),
]
SOURCE_FILES = [
    "index.html", "sw.js", "js/vehicle-display.js", "assets/vehicles/display_bounds.json",
    "assets/vehicles/vehicles_manifest.json", "assets/vehicles/fire_special_manifest.json",
    "docs/qa/release/VEHICLE_IMAGE_ONLY_RELEASE_20261109.json",
    "js/games/number-count.js", "js/games/vehicle-memory.js", "js/games/parking-lot.js",
    "js/games/construction-site.js", "js/games/megaDispatch.js", "js/games/coding-car.js",
    "scripts/qa-vehicle-display-browser.py",
]


def hashes():
    return {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in SOURCE_FILES}


def image_paths():
    shared = json.loads((ROOT / "assets/vehicles/vehicles_manifest.json").read_text())["vehicles"]
    fire = json.loads((ROOT / "assets/vehicles/fire_special_manifest.json").read_text())
    if isinstance(fire, dict):
        fire = fire["vehicles"]
    paths = sorted({row["file"].removeprefix("./") for row in shared + fire})
    assert len(paths) == 138, len(paths)
    return paths


GEOMETRY = r"""async paths => {
  const api = SihyeonVehicleDisplay, rows = [], failures = [];
  const cells = [[320,260],[180,140],[110,86],[75,50],[60,120],[280,72]];
  const assert = (ok,message) => {if(!ok)throw new Error(message);};
  const host = document.createElement('div'); document.body.append(host);
  host.style.cssText='position:absolute;left:0;top:0;background:#e7f2ff;z-index:999999';
  for (const path of paths) {
    try {
      const source = new Image(); source.src = path;
      await source.decode();
      const w = source.naturalWidth, h = source.naturalHeight;
      const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
      const context = canvas.getContext('2d',{willReadFrequently:true}); context.drawImage(source,0,0);
      const pixels=context.getImageData(0,0,w,h).data;
      let left=w,top=h,right=0,bottom=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>=16){
        left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
      }
      assert(right>left&&bottom>top,'No visible alpha>=16 pixels');
      const actual=[left,top,right,bottom], meta=api.meta(path);
      assert(meta && meta.width===w && meta.height===h,'metadata dimensions differ from decoded source');
      assert(meta.box.every((v,i)=>v===actual[i]),'metadata bounds differ from decoded alpha>=16');
      let layouts=0;
      for(const [cw,ch] of cells){
        host.replaceChildren();
        const cell=document.createElement('div');cell.style.cssText=`position:relative;width:${cw}px;height:${ch}px`;
        const img=source.cloneNode();img.style.cssText='width:100%;height:100%;object-fit:contain';
        cell.append(img);host.append(cell);
        const frame=api.apply(img);assert(frame,'known current image is not fitted');
        assert(frame.getAttribute('preserveAspectRatio')==='xMidYMax meet','aspect/baseline contract');
        const vb=frame.viewBox.baseVal;
        assert(vb.x<left&&vb.y<top&&vb.x+vb.width>right&&vb.y+vb.height>bottom,'no enclosing transparent safety margin');
        const m=frame.getScreenCTM(), box=frame.getBoundingClientRect();
        const sx=Math.hypot(m.a,m.b),sy=Math.hypot(m.c,m.d);
        assert(Math.abs(sx-sy)<1e-6,'nonuniform image scaling');
        const corners=[[left,top],[right,top],[right,bottom],[left,bottom]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));
        assert(corners.every(p=>p.x>=box.left-0.1&&p.x<=box.right+0.1&&p.y>=box.top-0.1&&p.y<=box.bottom+0.1),'visible pixels outside fitted frame');
        assert(api.apply(img)===frame&&cell.querySelectorAll('.sv-vehicle-frame').length===1,'repeat apply nests frames');
        api.reset(img);assert(img.parentElement===cell&&cell.children.length===1,'reset does not restore original location');
        layouts++;
      }
      rows.push({path,width:w,height:h,alpha16:actual,layouts,status:'PASS'});
    } catch(error) {failures.push({path,error:String(error)});}
  }
  host.remove();
  const parent=document.createElement('button'),img=new Image(),fallback=document.createElement('span');
  img.setAttribute('src',paths[0]);img.style.cssText='opacity:0.8';parent.append(img,fallback);document.body.append(parent);
  const saved=img.style.cssText;let fallbackSawOriginal=false;
  img.addEventListener('error',()=>{fallbackSawOriginal=img.parentElement===parent&&img.nextElementSibling===fallback;});
  api.apply(img);img.dispatchEvent(new Event('error'));
  const fallbackRestored=fallbackSawOriginal&&img.style.cssText===saved&&!parent.querySelector('.sv-vehicle-frame');parent.remove();
  return {images:paths.length,passed:rows.length,layouts:rows.reduce((s,r)=>s+r.layouts,0),failures,fallbackRestored,rows};
}"""

LAYOUT = r"""([rootSelector,controlSelector])=>{
  const root=document.querySelector(rootSelector),rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0.05;};
  const controls=[...root.querySelectorAll(controlSelector)].filter(visible).map(e=>{
    const r=rect(e),cx=(r.x+r.right)/2,cy=(r.y+r.bottom)/2,hit=document.elementFromPoint(cx,cy);
    return {label:e.getAttribute('aria-label')||e.textContent.trim().slice(0,45),rect:r,disabled:!!e.disabled,hit:!!hit&&(hit===e||e.contains(hit))};
  });
  const outside=controls.filter(({rect:r})=>r.x< -2||r.y< -2||r.right>innerWidth+2||r.bottom>innerHeight+2);
  const images=[...root.querySelectorAll('img')].filter(visible);
  const failed=images.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src'));
  const unfitted=images.filter(i=>/assets\/vehicles\//.test(i.getAttribute('src')||'')&&!i.closest('.sv-vehicle-frame')).map(i=>i.getAttribute('src'));
  return {viewport:[innerWidth,innerHeight],root:rect(root),controls,outside,failed,unfitted,
    pageOverflow:document.documentElement.scrollWidth>innerWidth+2};
}"""


def enter(page, base, game):
    name, zone, action, root, _ = game
    page.goto(base + "index.html", wait_until="load")
    page.locator('[data-home-age="4"]').click()
    if name == "coding":
        page.evaluate("openCodingCarGame()")
    else:
        page.locator(f'.world-zone[onclick="travelToZone(\'{zone}\')"]').click()
        page.locator(f'.zone-game-card[onclick="{action}()"]',).click()
    page.locator(root).wait_for()
    if name == "construction":
        page.locator('[data-action="practice"]').click()
        page.locator('.cs-choice').first.wait_for()
    if name == "fire":
        page.locator('[data-mode-size="4"]').click()
        page.locator('.md14-truck-btn').first.wait_for()
    page.wait_for_timeout(1600)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',required=True,type=pathlib.Path)
    parser.add_argument('--base-url')
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    report={'reviewer':'independent /root/live_status','scope':'current images, measured fitting and six consuming games; coding internal entry; simulated audio only',
        'gitSha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT).decode().strip(),
        'sourceHashesBefore':hashes(),'checks':[],'pageErrors':[]}
    def record(name,fn,page=None,shot=None):
        row={'name':name}
        try:
            row['detail']=fn();row['status']='PASS'
        except Exception as exc:
            row.update(status='FAIL',error=str(exc),trace=traceback.format_exc())
        if page and (shot or row['status']=='FAIL'):
            image=shot or f'failure-{len(report["checks"]):02d}.png'
            try:page.screenshot(path=str(args.output/image));row['screenshot']=image
            except Exception as exc:row['screenshotError']=str(exc)
        report['checks'].append(row);print(name,row['status'],row.get('error',''),flush=True)
    paths=image_paths()
    ledger=json.loads((ROOT/'docs/qa/release/VEHICLE_IMAGE_ONLY_RELEASE_20261109.json').read_text())
    def current_bytes():
        assert len(ledger['items'])==76
        for entry in ledger['items']:
            actual=hashlib.sha256((ROOT/entry['path']).read_bytes()).hexdigest()
            assert actual==entry['resultSha256'],entry['path']
        return {'approvedCurrentImages':76,'allApprovedHashesMatch':True,'manifestPaths':len(paths)}
    record('approved current 76 image bytes',current_bytes)
    server=None
    if args.base_url:base=args.base_url.rstrip('/')+'/'
    else:
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QA['QuietServer'],directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
    report['baseUrl']=base
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True)
            report['browser']=browser.version
            context=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
            context.add_init_script(QA['PROBE']);page=context.new_page()
            page.on('pageerror',lambda error:report['pageErrors'].append(str(error)))
            page.goto(base+'index.html',wait_until='load')
            def geometry():
                result=page.evaluate(GEOMETRY,paths)
                (args.output/'measured-image-geometry.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
                assert result['passed']==138 and not result['failures'],result['failures']
                assert result['layouts']==828 and result['fallbackRestored'],result
                return {k:v for k,v in result.items() if k!='rows'}
            record('138 decoded alpha bounds x 6 actual SVG viewport shapes',geometry,page)
            context.close()
            for game in GAMES:
                context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
                context.add_init_script(QA['PROBE']);page=context.new_page()
                page.on('pageerror',lambda error:report['pageErrors'].append(str(error)))
                try:
                    enter(page,base,game)
                    for width,height in SIZES:
                        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(550)
                        def inspect():
                            result=page.evaluate(LAYOUT,[game[3],game[4]])
                            assert result['controls'],'No primary controls'
                            assert not result['outside'],f'Clipped controls: {result["outside"]}'
                            assert not result['pageOverflow'],'Horizontal document overflow'
                            assert not result['failed'],f'Failed/pending visible images: {result["failed"]}'
                            assert not result['unfitted'],f'Unfitted current image: {result["unfitted"]}'
                            return result
                        shot=f'{game[0]}-{width}x{height}.png' if (width,height) in [(390,844),(640,360)] or (game[0],width,height) in [('fire',768,1024),('coding',844,390),('count',1280,800),('construction',1024,768)] else None
                        record(f'{game[0]} {width}x{height}'+(' internal entry' if game[0]=='coding' else ' menu entry'),inspect,page,shot)
                except Exception as exc:
                    record(game[0]+' entry',lambda:(_ for _ in ()).throw(exc),page)
                finally:context.close()
            browser.close()
    finally:
        if server:server.shutdown()
        report['sourceHashesAfter']=hashes()
        report['sourcesUnchanged']=report['sourceHashesBefore']==report['sourceHashesAfter']
        report['status']='PASS' if len(report['checks'])==38 and all(x['status']=='PASS' for x in report['checks']) and not report['pageErrors'] and report['sourcesUnchanged'] else 'FAIL'
        (args.output/'independent-vehicle-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print('INDEPENDENT_VEHICLE_BROWSER',report['status'],flush=True)
    return int(report['status']!='PASS')


if __name__=='__main__':
    raise SystemExit(main())
