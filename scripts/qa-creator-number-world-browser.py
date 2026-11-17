"""Public Number Kingdom controls: saved worlds, restoration and landscape space.

The 300-block/empty-world boundary uses the existing debug API to set a known
scene, then native buttons/re-entry. This is Chromium/WebGL, not physical touch
or audible-TTS evidence. Every served runtime file is checked against checkout.
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
from urllib.parse import urljoin, urlsplit

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("number_world_common", ROOT / "scripts/qa-creator-number-browser.py")
common = importlib.util.module_from_spec(spec)
spec.loader.exec_module(common)
SOURCES = ("index.html", "games/number-kingdom-3d.html", "js/engine/webgl-fallback.js", "js/games/number-world-save.js")
SIZES = ((320, 568), (390, 844), (640, 360), (844, 390), (768, 1024), (1024, 768))
KEY = "sihyeon.number-world.v1"


def capture(frame):
    return frame.evaluate("""() => {
      const raw = NumberKingdomDebug.captureWorld();
      const ids = new Map([...raw.props.map((p,i)=>[p.id,'p'+i]), ...raw.friends.map((f,i)=>[f.id,'f'+i])]);
      const item = p => { const {id,_old,...data} = p; return {...data,carrier:ids.get(data.carrier)||null}; };
      return {...raw,friends:raw.friends.map(item),props:raw.props.map(item),selected:ids.get(raw.selected)||null};
    }""")



def track_page_errors(context, report, case):
    # These failure/edge paths open their own contexts; their exceptions must
    # participate in the same final gate as the six viewport paths.
    context.on('page', lambda page: page.on('pageerror', lambda error:
        report['pageErrors'].append({'case':case,'error':str(error)})))


def assert_rendered_world(frame, expected):
    """Read actual Three.js objects via the existing getState() API."""
    actual = frame.evaluate("""() => {
      const world=NumberKingdomDebug.getState(), entities=[...world.friends,...world.props];
      const inVisibleScene=node=>{
        const seen=new Set();
        while(node&&!seen.has(node)){
          if(node.visible===false)return false;
          if(node.isScene===true)return true;
          seen.add(node);node=node.parent;
        }
        return false;
      };
      const cellKey=c=>`${c.dx}:${c.dy}:${c.dz}`;
      const read=entity=>{
        const cells=entity.cells||[], cubes=entity.cubeMeshes||[];
        return {kind:entity.kind,n:entity.n||null,pose:entity.pose||null,type:entity.type||null,
          cells:cells.length,uniqueCells:new Set(cells.map(cellKey)).size,cubes:cubes.length,
          uniqueMeshes:new Set(cubes.map(c=>c.mesh?.uuid)).size,
          rootMatches:entity.mesh?.userData.entityId===entity.id,
          visualAttached:entity.visual?.parent===entity.mesh,
          attachedToVisibleScene:inVisibleScene(entity.mesh),
          cubesAttached:cubes.every(c=>c.mesh?.isMesh===true&&c.mesh.parent===entity.visual&&
            c.mesh.userData.entityId===entity.id&&inVisibleScene(c.mesh)&&
            (c.mesh.geometry?.attributes?.position?.count||0)>0&&
            cells.includes(c.cell)),
          cubeCellsMatch:cubes.map(c=>cellKey(c.cell)).sort().join('|')===cells.map(cellKey).sort().join('|')};
      };
      const group=entities[0]?.mesh?.parent;
      const ids=new Set(entities.map(e=>e.id));
      return {friends:world.friends.map(read),props:world.props.map(read),
        sceneEntityCount:group?group.children.filter(c=>c.userData.entityId).length:0,
        sceneEntityIdsMatch:!group||group.children.filter(c=>c.userData.entityId).every(c=>ids.has(c.userData.entityId))};
    }""")
    assert len(actual['friends']) == len(expected['friends']) and len(actual['props']) == len(expected['props']), actual
    assert actual['sceneEntityCount'] == len(expected['friends']) + len(expected['props']), actual
    assert actual['sceneEntityIdsMatch'], actual
    for row, saved in zip(actual['friends'], expected['friends']):
        assert row['n'] == saved['n'] and row['pose'] == saved['pose'], (row,saved)
        assert row['cells'] == row['cubes'] == row['uniqueCells'] == row['uniqueMeshes'] == saved['n'], row
    for row, saved in zip(actual['props'], expected['props']):
        assert row['type'] == saved['type'] and row['cells'] > 0, (row,saved)
        assert row['cells'] == row['cubes'] == row['uniqueCells'] == row['uniqueMeshes'], row
    for row in actual['friends'] + actual['props']:
        assert all(row[k] for k in ('rootMatches','visualAttached','attachedToVisibleScene','cubesAttached','cubeCellsMatch')), row
    return actual


def current_frame(page):
    page.wait_for_function("""() => {
      try { return Boolean(document.querySelector('#numberKingdomFrame')?.contentWindow?.NumberKingdomDebug); }
      catch (_) { return false; }
    }""", timeout=45000)
    frame = page.locator("#numberKingdomFrame").element_handle().content_frame()
    common.webgl_runtime(frame)
    return frame


def enter(page, base, navigate=True):
    if navigate:
        response = page.goto(urljoin(base, "index.html"), wait_until="domcontentloaded", timeout=45000)
        assert response and response.ok
    if page.locator('.world-zone[onclick="travelToZone(\'numbers\')"]').count():
        page.locator('.world-zone[onclick="travelToZone(\'numbers\')"]').click()
    page.locator('.zone-game-card[onclick="openNumberKingdom3DGame()"]').click()
    return current_frame(page)


def close_and_reenter(page, base):
    page.locator('.game-back-floating').click()
    page.locator('#numberKingdomFrame').wait_for(state='detached')
    return enter(page, base, navigate=False)


def settle(frame):
    frame.wait_for_function("""() => {
      const w=NumberKingdomDebug.getState();
      return !w.drag && !w.train.departing && w.friends.every(f=>!f.walk && Math.abs(f.vy)<.02 && f.anim.arcTimer<=0);
    }""", timeout=15000)


def open_settings(frame):
    if not frame.locator('#settingsPop').is_visible():
        frame.locator('#settingsBtn').click()


def save_button(frame):
    open_settings(frame)
    frame.locator('#worldSaveBtn').click()
    status = frame.locator('#worldSaveStatus').get_attribute('data-mode')
    assert status in ('local', 'session', 'memory'), status
    button = frame.locator('#worldSaveBtn').bounding_box()
    assert button and button['width'] >= 44 and button['height'] >= 44, button
    frame.locator('#settingsBtn').click()
    return status


def layout(frame):
    result = frame.evaluate("""() => {
      const box=id=>{const r=document.getElementById(id).getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return {profile:document.getElementById('game').dataset.layout,canvas:box('scene3d'),actions:box('actions'),
        actionsVisible:getComputedStyle(document.getElementById('actions')).display!=='none',
        controls:[...document.querySelectorAll('#poseList .poseCard,#dockAddBtn,#dockDecompBtn,#undo')].map(el=>{
          const r=el.getBoundingClientRect();return {id:el.id,label:el.getAttribute('aria-label'),width:r.width,height:r.height};})};
    }""")
    assert result['canvas']['width'] >= 180 and result['canvas']['height'] >= 180, result
    for control in result['controls']:
        assert control['width'] >= 44 and control['height'] >= 44, control
    if 'Landscape' in result['profile'] and result['actionsVisible']:
        assert result['canvas']['bottom'] <= result['actions']['top'] + 1, result
        assert result['actions']['height'] >= 52, result
    return result


def served_sources(responses, base):
    expected = {p: common.sha256((ROOT / p).read_bytes()) for p in SOURCES}
    mapping = {urlsplit(urljoin(base, p)).path:p for p in SOURCES}
    found = {}
    for response in responses:
        name = mapping.get(urlsplit(response.url).path)
        if name and name not in found:
            digest = common.sha256(response.body())
            assert response.status == 200 and digest == expected[name], (name,response.status,digest,expected[name])
            found[name] = {'status':response.status,'servedSha256':digest,'checkoutSha256':expected[name]}
    assert set(found) == set(SOURCES), found
    return found


def build_save(page, frame, out, size):
    frame.locator('#sound').click()
    frame.locator('#zones [data-zone="town"]').click()
    frame.wait_for_function("NumberKingdomDebug.getState().zone === 'town'", timeout=15000)
    frame.locator('#tray .toy[data-num="8"]').click()
    frame.locator('.poseCard[aria-label="3D 모양 bridge"]').click()
    settle(frame)
    open_settings(frame)
    frame.locator('#camBtn').click()
    mode = save_button(frame)
    assert mode == 'local'
    before = capture(frame)
    assert before['zone'] == 'town' and before['friends'][-1]['n'] == 8 and before['friends'][-1]['pose'] == 'bridge', before
    assert before['selected'] == 'f'+str(len(before['friends'])-1), before
    frame.wait_for_timeout(300)
    bounds=layout(frame)
    image=f'number-world-saved-{size}.png'
    page.screenshot(path=str(out/image))
    return {'snapshot':before,'saveMode':mode,'layout':bounds,'screenshot':image,'driver':'native zone/tray/shape/camera/save controls'}


def restore_check(page, base, before, out, size):
    page.reload(wait_until='domcontentloaded')
    frame=enter(page,base,navigate=False)
    settle(frame)
    restored=capture(frame)
    assert restored == before, {'before':before,'after':restored}
    assert frame.evaluate('NumberKingdomDebug.getSaveStatus().restored')
    reload_meshes=assert_rendered_world(frame,before)
    frame=close_and_reenter(page,base)
    settle(frame)
    assert capture(frame) == before
    reentry_meshes=assert_rendered_world(frame,before)
    image=f'number-world-restored-{size}.png'
    page.screenshot(path=str(out/image))
    return {'restored':restored,'afterReloadAndReentry':True,'reloadMeshes':reload_meshes,'reentryMeshes':reentry_meshes,'screenshot':image}


def reset_undo(page, frame, before):
    open_settings(frame)
    frame.locator('#reset').click()
    frame.locator('#resetNo').click()
    assert capture(frame) == before, 'cancel changed the saved artwork'
    open_settings(frame)
    frame.locator('#reset').click()
    frame.locator('#resetYes').click()
    settle(frame)
    fresh=capture(frame)
    assert fresh != before and fresh['zone']=='plaza' and fresh['selected'] is None, fresh
    if frame.locator('#settingsPop').is_visible():
        frame.locator('#settingsBtn').click()
    frame.locator('#undo').click()
    settle(frame)
    assert capture(frame) == before, {'wanted':before,'actual':capture(frame)}
    return {'cancelPreserves':True,'confirmedResetChanges':True,'undoRestoresExactPreviousWorld':True}


def rotate(page, frame, before, out, size, width, height):
    page.set_viewport_size({'width':height,'height':width})
    frame.wait_for_timeout(300)
    assert capture(frame) == before
    bounds=layout(frame)
    image=f'number-world-rotated-{size}.png'
    page.screenshot(path=str(out/image))
    page.set_viewport_size({'width':width,'height':height})
    return {'snapshotPreserved':True,'layout':bounds,'screenshot':image}


def storage_failure(browser, base, out, report):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,service_workers='block',reduced_motion='reduce')
    track_page_errors(context,report,'denied-storage-and-same-tab-recovery')
    context.add_init_script("""(() => {
      const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
      Storage.prototype.getItem=function(k){if(k==='sihyeon.number-world.v1')throw new DOMException('denied','SecurityError');return get.call(this,k);};
      Storage.prototype.setItem=function(k,v){if(k==='sihyeon.number-world.v1')throw new DOMException('quota','QuotaExceededError');return set.call(this,k,v);};
    })();""")
    try:
        page=context.new_page();page.set_default_timeout(15000);frame=enter(page,base)
        frame.locator('#tray .toy[data-num="5"]').click();settle(frame)
        assert save_button(frame)=='memory'
        before=capture(frame)
        frame=close_and_reenter(page,base);settle(frame)
        assert capture(frame)==before
        meshes=assert_rendered_world(frame,before)
        open_settings(frame)
        text=frame.locator('#worldSaveStatus').inner_text()
        assert '새로고침' in text and '사라질' in text, text
        image='number-world-storage-denied.png';page.screenshot(path=str(out/image))
        return {'sameTabReentryPreserved':True,'meshes':meshes,'honestSaveMessage':text,'screenshot':image}
    finally:
        context.close()


def corrupt_save(browser, base, report):
    context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,service_workers='block',reduced_motion='reduce')
    track_page_errors(context,report,'corrupt-saved-data')
    context.add_init_script("""if(location.pathname.endsWith('/games/number-kingdom-3d.html')){
      localStorage.setItem('sihyeon.number-world.v1','{broken world');
      sessionStorage.removeItem('sihyeon.number-world.v1');
    }""")
    try:
        page=context.new_page();frame=enter(page,base);frame.wait_for_timeout(900)
        assert frame.evaluate('NumberKingdomDebug.getSaveStatus().mode')=='invalid'
        assert frame.evaluate("localStorage.getItem('sihyeon.number-world.v1')")=='{broken world'
        frame.locator('#tray .toy[data-num="4"]').click();settle(frame)
        assert save_button(frame)=='local'
        assert frame.evaluate("JSON.parse(localStorage.getItem('sihyeon.number-world.v1')).snapshot.friends.at(-1).n")==4
        return {'invalidBytesPreservedUntilFirstEdit':True,'newArtworkSaveWorks':True}
    finally:
        context.close()


def boundaries(browser, base, out, report):
    context=browser.new_context(viewport={'width':844,'height':390},has_touch=True,service_workers='block',reduced_motion='reduce')
    track_page_errors(context,report,'300-blocks-and-empty-world')
    try:
        page=context.new_page();frame=enter(page,base)
        frame.evaluate("""() => {
          const d=NumberKingdomDebug,w=d.getState();w.sound=false;
          for(const e of [...w.friends,...w.props])d.deleteObject(e,w);
          w.zone='plaza';w.goalX=w.cameraX=15;
          const a=d.spawnFriend(100,w,2,-4),b=d.spawnFriend(100,w,14,-4),c=d.spawnFriend(100,w,26,-4);
          d.selectEntity(b.id);
        }""")
        frame.wait_for_function("NumberKingdomDebug.resolvePlusActionPlan().sum === 300")
        preview=frame.locator('#mergePreview').inner_text()
        assert preview=='100 × 3 → 300', preview
        frame.locator('#dockAddBtn').click();settle(frame)
        assert frame.evaluate("NumberKingdomDebug.getState().friends.map(f=>[f.n,f.cells.length])")==[[300,300]]
        save_button(frame)
        before=capture(frame);frame=close_and_reenter(page,base);settle(frame)
        assert capture(frame)==before
        meshes=assert_rendered_world(frame,before)
        assert [row['cells'] for row in meshes['friends']]==[300], meshes
        image='number-world-three-hundreds.png';page.screenshot(path=str(out/image))
        frame.evaluate("""() => {const d=NumberKingdomDebug,w=d.getState();for(const e of [...w.friends,...w.props])d.deleteObject(e,w);d.selectEntity(null);}""")
        assert save_button(frame)=='local'
        frame=close_and_reenter(page,base)
        assert frame.evaluate('NumberKingdomDebug.getState().friends.length + NumberKingdomDebug.getState().props.length')==0
        return {'preview':preview,'threeHundredBlocksRestored':True,'restoredMeshes':meshes,'emptyWorldRestored':True,'screenshot':image,
          'fixture':'debug setup only; native merge/save/exit/re-entry'}
    finally:
        context.close()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url')
    parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path('qa-number-world'))
    args=parser.parse_args();out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    report={'status':'RUNNING','checks':[],'pageErrors':[],'sourceSha256':{},'checkoutSourceSha256':{p:common.sha256((ROOT/p).read_bytes()) for p in SOURCES},
      'testScriptSha256':common.sha256(pathlib.Path(__file__).read_bytes()),'scope':{'input':'native controls; clearly labeled boundary setup',
      'notRun':['physical device','audible speech','child observation','offline service-worker upgrade']}}
    server=None
    try:
        if args.base_url:base=common.normalized_base(args.base_url)
        else:
            server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(common.QuietServer,directory=str(ROOT)))
            threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
        report['baseUrl']=base
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=common.WEBGL_ARGS);report['browserVersion']=browser.version
            for width,height in SIZES:
                size=f'{width}x{height}'
                context=browser.new_context(viewport={'width':width,'height':height},has_touch=True,service_workers='block',reduced_motion='reduce')
                try:
                    page=context.new_page();page.set_default_timeout(15000);responses=[]
                    page.on('response',lambda r:responses.append(r))
                    page.on('pageerror',lambda error,s=size:report['pageErrors'].append({'viewport':s,'error':str(error)}))
                    frame=enter(page,base)
                    report['sourceSha256'][size]=served_sources(responses,base)
                    built=common.record(report,f'build-save-layout {size}','NATIVE',lambda:build_save(page,frame,out,size))
                    if built['status']!='PASS':continue
                    before=built['detail']['snapshot']
                    restored=common.record(report,f'reload-reentry {size}','NATIVE',lambda:restore_check(page,base,before,out,size))
                    if restored['status']!='PASS':continue
                    frame=current_frame(page)
                    common.record(report,f'reset-cancel-undo {size}','NATIVE',lambda:reset_undo(page,frame,before))
                    common.record(report,f'rotate-preserve {size}','NATIVE',lambda:rotate(page,frame,before,out,size,width,height))
                except Exception as exc:
                    report['checks'].append({'name':f'entry {size}','status':'FAIL','error':str(exc),'trace':traceback.format_exc()})
                    try:page.screenshot(path=str(out/f'failure-{size}.png'))
                    except Exception:pass
                finally:context.close()
            common.record(report,'denied storage and same-tab recovery','FAILURE',lambda:storage_failure(browser,base,out,report))
            common.record(report,'corrupt saved data','FAILURE',lambda:corrupt_save(browser,base,report))
            common.record(report,'300 blocks and empty world','BOUNDARY',lambda:boundaries(browser,base,out,report))
            browser.close()
    except Exception as exc:
        report['checks'].append({'name':'setup','status':'FAIL','error':str(exc),'trace':traceback.format_exc()})
    finally:
        if server:server.shutdown();server.server_close()
        report['status']='PASS' if report['checks'] and all(c['status']=='PASS' for c in report['checks']) and not report['pageErrors'] else 'FAIL'
        (out/'number-world-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print('NUMBER_WORLD_BROWSER '+report['status'],flush=True)
    return 0 if report['status']=='PASS' else 1


if __name__=='__main__':
    raise SystemExit(main())
