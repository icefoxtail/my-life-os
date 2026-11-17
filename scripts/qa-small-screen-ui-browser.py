"""Scoped construction/coding UI review, using real Chromium layout and touch.

The baseline modes keep observed layout failures as FAIL; exit zero only means
the named defects were reproduced. Audio completion alone is simulated by the
existing voice probe. No game state, answers, asset bytes, or CSS is rewritten.
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

from playwright.sync_api import sync_playwright

SCRIPT_ROOT = pathlib.Path(__file__).resolve().parents[1]
QA = runpy.run_path(str(SCRIPT_ROOT / "scripts/qa-p1-voice-browser.py"))
SIZES = [(390, 844), (844, 390), (640, 360), (360, 640), (768, 1024), (1024, 768)]
SOURCES = ["index.html", "sw.js", "js/games/construction-site.js", "js/games/coding-car.js",
           "js/vehicle-display.js", "assets/vehicles/display_bounds.json"]
ANSWERS = {
    "carry": ["dump_truck", "articulated_dump_truck", "dump_loader", "cargo_truck"],
    "pump": ["concrete_pump_truck"],
    "dig": ["excavator", "mini_excavator", "backhoe_loader"],
}

# Only the two consuming game screens are measured. Background clouds/roads and
# vehicle entrance/exit animations intentionally extend outside their stage.
MEASURE = r"""game => {
  const root = document.querySelector(game === 'construction' ? '.cs-root' : '.cc-root');
  const rect = e => { const r=e.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
  const visible = e => {const r=rect(e),s=getComputedStyle(e); return r.width>0.2&&r.height>0.2&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05;};
  const inside = (a,b,t=1) => a.left>=b.left-t&&a.top>=b.top-t&&a.right<=b.right+t&&a.bottom<=b.bottom+t;
  const viewport={left:0,top:0,right:innerWidth,bottom:innerHeight};
  const content = e => {const r=rect(e);return {left:r.left+e.clientLeft,top:r.top+e.clientTop,right:r.left+e.clientLeft+e.clientWidth,bottom:r.top+e.clientTop+e.clientHeight};};
  const label = e => e.id || e.getAttribute('data-action') || e.getAttribute('data-dir') || e.getAttribute('data-difficulty') || e.getAttribute('aria-label') || e.className;
  const issues=[];
  const panel=root.querySelector('.cc-ui-area');
  const scrollable=panel&&panel.scrollHeight>panel.clientHeight+1&&/auto|scroll/.test(getComputedStyle(panel).overflowY);
  const buttons=[...root.querySelectorAll('button,[role="button"]'),...document.querySelectorAll('.game-back-floating')].filter(visible);
  const controls=buttons.map(e=>{
    const r=rect(e),hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
    const row={label:label(e),rect:r,disabled:!!e.disabled||e.classList.contains('is-disabled'),hit:!!hit&&(hit===e||e.contains(hit)),viewport:inside(r,viewport),scrollPanel:!!(scrollable&&panel.contains(e))};
    if(r.width<43.8||r.height<43.8)issues.push({kind:'touch-target',label:row.label,rect:r});
    if(!row.disabled&&!row.scrollPanel&&(!row.viewport||!row.hit))issues.push({kind:'control-clipped-or-covered',label:row.label,rect:r,hit:row.hit});
    return row;
  });
  const result={viewport:[innerWidth,innerHeight],root:rect(root),controls,issues,
    page:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,x:scrollX,y:scrollY}};
  if(result.page.width>innerWidth+1)issues.push({kind:'horizontal-page-overflow'});
  if(!inside(rect(root),viewport))issues.push({kind:'root-outside-viewport'});
  if(game==='construction'){
    const stage=root.querySelector('.cs-stage');const frame=content(stage);
    result.stage={rect:rect(stage),content:frame};result.scene=[];
    const selectors=root.classList.contains('is-complete')?['.cs-success-box']:['.cs-target-zone','.cs-target-icon','.cs-site-board',...(root.classList.contains('is-success')?['.cs-result-icon']:[])];
    for(const selector of selectors){const e=root.querySelector(selector);if(!e||!visible(e))continue;
      const r=rect(e),boundary=selector==='.cs-success-box'?viewport:frame;
      result.scene.push({selector,rect:r,inside:inside(r,boundary)});
      if(!inside(r,boundary))issues.push({kind:'scene-clipped',selector,rect:r,boundary});
    }
    result.mission=[...root.classList].find(c=>c.startsWith('cs-stage-'))||'complete';
    result.round=root.querySelector('.cs-pill')?.textContent;
  }else{
    result.panel={rect:rect(panel),scrollTop:panel.scrollTop,scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,overflow:getComputedStyle(panel).overflowY,touchAction:getComputedStyle(panel).touchAction,rootTouchAction:getComputedStyle(root).touchAction,alignContent:getComputedStyle(panel).alignContent};
    const slots=root.querySelector('#ccSlots'),slotBoundary=content(slots),controlBoundary=rect(root.querySelector('.cc-controls'));
    const difficulty=root.querySelector('.cc-diff-btn.active')?.dataset.difficulty;
    const expectedSlots=difficulty==='easy'?4:difficulty==='challenge'?7:null;
    const overlaps=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    result.codeSlots={difficulty,expected:expectedSlots,group:rect(slots),groupContent:slotBoundary,controls:controlBoundary,rows:[]};
    const slotElements=[...slots.querySelectorAll('.cc-slot')];
    if(slotElements.length!==expectedSlots)issues.push({kind:'slot-count',expected:expectedSlots,actual:slotElements.length});
    for(const [index,e] of slotElements.entries()){
      const r=rect(e),row={index:index+1,rect:r,insideGroup:inside(r,slotBoundary),overlapsControls:overlaps(r,controlBoundary),insideViewport:inside(r,viewport),insidePanel:inside(r,content(panel))};
      result.codeSlots.rows.push(row);
      if(!row.insideGroup)issues.push({kind:'slot-outside-group',index:row.index,rect:r,boundary:slotBoundary});
      if(row.overlapsControls)issues.push({kind:'slot-control-overlap',index:row.index,rect:r,controls:controlBoundary});
      if(!scrollable&&(!row.insideViewport||!row.insidePanel))issues.push({kind:'slot-clipped-no-scroll',index:row.index,rect:r});
      for(const previous of result.codeSlots.rows.slice(0,-1))if(overlaps(r,previous.rect))issues.push({kind:'slot-slot-overlap',indices:[previous.index,row.index]});
    }
    result.arrows=[];
    for(const img of root.querySelectorAll('.cc-btn-arrow img')){
      const button=img.closest('button'),b=content(button),r=rect(img),style=getComputedStyle(button);
      const row={dir:button.dataset.dir,button:rect(button),buttonContent:b,imageRect:r,gridRows:style.gridTemplateRows,gridColumns:style.gridTemplateColumns,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight};
      if(!img.complete||!img.naturalWidth){issues.push({kind:'arrow-load',dir:row.dir});result.arrows.push(row);continue;}
      const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
      const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const px=ctx.getImageData(0,0,c.width,c.height).data;
      let l=c.width,t=c.height,rr=0,bb=0;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(px[(y*c.width+x)*4+3]>=16){l=Math.min(l,x);t=Math.min(t,y);rr=Math.max(rr,x+1);bb=Math.max(bb,y+1);}
      const scale=Math.min(r.width/c.width,r.height/c.height),ox=r.left+(r.width-c.width*scale)/2,oy=r.top+(r.height-c.height*scale)/2;
      row.alphaBounds={left:ox+l*scale,top:oy+t*scale,right:ox+rr*scale,bottom:oy+bb*scale};
      row.contained=inside(row.alphaBounds,b,0.5);
      if(!row.contained)issues.push({kind:'arrow-clipped',dir:row.dir,bounds:row.alphaBounds,boundary:b});
      result.arrows.push(row);
    }
    const map=root.querySelector('.cc-map');result.map={rect:rect(map),grid:map.style.getPropertyValue('--cc-grid-size'),start:[map.style.getPropertyValue('--start-x'),map.style.getPropertyValue('--start-y')],goal:[map.style.getPropertyValue('--goal-x'),map.style.getPropertyValue('--goal-y')]};
    if(!inside(result.map.rect,viewport))issues.push({kind:'map-clipped',rect:result.map.rect});
    const modal=root.querySelector('.cc-success-box');if(modal&&visible(modal)){result.modal=rect(modal);if(!inside(result.modal,viewport))issues.push({kind:'success-clipped',rect:result.modal});}
  }
  return result;
}"""

TOUCH_PROBE = r"""(() => {
  window.__smallScreenTouchEvents = [];
  const label = e => e?.id || (typeof e?.className === 'string' && e.className) || e?.tagName || 'document';
  for (const type of ['touchstart','touchmove','touchend','touchcancel','pointerdown','pointermove','pointerup','pointercancel','scroll']) {
    document.addEventListener(type, event => {
      const row={type,time:performance.now(),trusted:event.isTrusted,target:label(event.target),defaultPrevented:event.defaultPrevented};
      if(event.changedTouches)row.points=[...event.changedTouches].map(t=>({id:t.identifier,x:t.clientX,y:t.clientY}));
      if(event.pointerType)Object.assign(row,{pointerType:event.pointerType,pointerId:event.pointerId,x:event.clientX,y:event.clientY});
      if(type==='scroll')row.scrollTop=event.target.scrollTop;
      window.__smallScreenTouchEvents.push(row);
      setTimeout(()=>{row.defaultPrevented=event.defaultPrevented;},0);
    },{capture:true,passive:true});
  }
})();"""

SCROLL_SNAPSHOT = r"""([x,y]) => {
  const panel=document.querySelector('.cc-ui-area'),hit=document.elementFromPoint(x,y),ancestors=[];
  const label=e=>e?.id||(typeof e?.className==='string'&&e.className)||e?.tagName;
  for(let e=hit;e;e=e.parentElement){const s=getComputedStyle(e);ancestors.push({element:label(e),touchAction:s.touchAction,overflowX:s.overflowX,overflowY:s.overflowY,scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight});}
  const r=panel.getBoundingClientRect();
  return {scrollTop:panel.scrollTop,maxScroll:panel.scrollHeight-panel.clientHeight,hit:label(hit),ancestors,
    panel:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},eventIndex:window.__smallScreenTouchEvents.length,
    difficulty:document.querySelector('.cc-diff-btn.active')?.dataset.difficulty,
    input:{maxTouchPoints:navigator.maxTouchPoints,coarsePointer:matchMedia('(pointer:coarse)').matches}};
}"""


def hashes(root):
    return {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in SOURCES}


def runner_hashes():
    return {p: hashlib.sha256((SCRIPT_ROOT / p).read_bytes()).hexdigest()
            for p in ['scripts/qa-small-screen-ui-browser.py', 'scripts/qa-p1-voice-browser.py']}


def normalize_base(value):
    parsed = urlsplit(value)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc:
        raise ValueError('--base-url must be an HTTP(S) playground URL')
    path = parsed.path
    if path.endswith('/index.html'):
        path = path[:-len('index.html')]
    return urlunsplit((parsed.scheme, parsed.netloc, path.rstrip('/') + '/', '', ''))


def served_sources(base, expected):
    """Read the complete release surface, including the blocked service worker."""
    evidence = {'baseUrl': base, 'expected': expected, 'actual': {}, 'errors': {}}
    for name in SOURCES:
        try:
            request = Request(urljoin(base, name), headers={'Cache-Control': 'no-cache'})
            with urlopen(request, timeout=30) as response:
                if response.status != 200:
                    raise RuntimeError(f'HTTP {response.status}')
                evidence['actual'][name] = hashlib.sha256(response.read()).hexdigest()
        except Exception as exc:
            evidence['errors'][name] = str(exc)
    evidence['matchesCheckout'] = not evidence['errors'] and evidence['actual'] == expected
    return evidence


def page_source_evidence(responses, expected):
    """Check bytes Chromium loaded, separately from the release URL readback."""
    names = ('index.html', 'js/games/construction-site.js',
             'js/games/coding-car.js', 'js/vehicle-display.js')
    evidence = {}
    for name in names:
        response = responses.get(name)
        assert response is not None, f'Browser did not load {name}'
        actual = hashlib.sha256(response.body()).hexdigest()
        evidence[name] = {'url': response.url, 'httpStatus': response.status,
                          'servedSha256': actual, 'checkoutSha256': expected[name],
                          'matchesCheckout': actual == expected[name]}
    assert all(row['httpStatus'] == 200 and row['matchesCheckout']
               for row in evidence.values()), evidence
    return evidence


def enter(page, base, game):
    response = page.goto(urljoin(base, 'index.html'), wait_until='load', timeout=60000)
    assert response and response.ok, 'Playground entry did not load successfully'
    page.locator('[data-home-age="4"]').tap()
    page.locator('.world-zone[onclick="travelToZone(\'cars\')"]').tap()
    page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]',).wait_for()
    if game == "construction":
        page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]',).tap()
    else:
        # Existing internal entry only: the production menu has no coding card.
        page.evaluate("openCodingCarGame()")
    page.locator('.cs-root' if game == 'construction' else '.cc-root').wait_for()
    page.wait_for_timeout(1500)


def tap_exact(page, selector):
    """Touch the measured center; do not let locator.tap auto-scroll hide a bug."""
    loc = page.locator(selector)
    box = loc.bounding_box()
    assert box, f"Missing control {selector}"
    x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    assert box['width'] >= 43.8 and box['height'] >= 43.8, f"Small touch target {selector}: {box}"
    ok = loc.evaluate("e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!h&&(h===e||e.contains(h));}")
    assert ok, f"Control center not touchable: {selector}: {box}"
    page.touchscreen.tap(x, y)
    page.wait_for_timeout(130)


def touch_scroll(page, cdp, direction):
    p = page.locator('.cc-ui-area').bounding_box()
    assert p, 'Missing coding panel'
    # Real touch input, not DOM scrollTop, verifies the root touch-action policy.
    x = p['x'] + p['width'] / 2
    y = min(p['y'] + p['height'] * .78, page.viewport_size['height'] - 25) if direction > 0 else max(p['y'] + p['height'] * .22, 25)
    distance = min(p['height'] * .52, 260)
    end_y = y - distance if direction > 0 else y + distance
    before = page.evaluate(SCROLL_SNAPSHOT, [x, y])
    row = {'driver': 'Input.dispatchTouchEvent', 'direction': 'down' if direction > 0 else 'up',
           'from': [x, y], 'to': [x, end_y], 'moves': 12, 'stepDelayMs': 30, 'before': before}
    # Store the mutable row before input, so an interrupted gesture retains its
    # attempted coordinates and available diagnostics in the final report.
    page._ui_scroll_diagnostics.append(row)

    def capture_edge(snapshot):
        edge = 'top' if snapshot['scrollTop'] <= 1 else 'bottom' if snapshot['scrollTop'] >= snapshot['maxScroll'] - 1 else None
        if not edge:
            return
        key = snapshot['difficulty'] + '-' + edge
        if key in page._ui_scroll_shots:
            return
        page._ui_scroll_shots.add(key)
        label = page._ui_case_name + '-' + snapshot['difficulty'] + '-scroll-' + edge
        page.screenshot(path=str(page._ui_output / (label + '.png')))
        (page._ui_output / (label + '.json')).write_text(json.dumps(snapshot, ensure_ascii=False, indent=2))
        row.setdefault('screenshots', []).append(label + '.png')

    capture_edge(before)
    ended = False
    try:
        # Same native CDP touch path as the existing Pixi touch driver. Explicit
        # moves make event delivery observable; no DOM scroll or wheel fallback.
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
        page.wait_for_timeout(30)
        for step in range(1, 13):
            move_y = y + (end_y - y) * step / 12
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x, 'y': move_y}]})
            page.wait_for_timeout(30)
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        ended = True
    except Exception as exc:
        row['driverError'] = str(exc)
        raise
    finally:
        if not ended:
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        page.wait_for_timeout(220)
        row['after'] = page.evaluate(SCROLL_SNAPSHOT, [x, end_y])
        row['events'] = page.evaluate('i=>window.__smallScreenTouchEvents.slice(i)', before['eventIndex'])
        row['trustedTouchObserved'] = all(any(e['type'] == kind and e['trusted'] for e in row['events'])
                                          for kind in ['touchstart', 'touchmove', 'touchend'])
        row['scrollDelta'] = row['after']['scrollTop'] - before['scrollTop']
        capture_edge(row['after'])
    assert row['trustedTouchObserved'], f'Native touch event delivery not observed: {row}'


def reach(page, cdp, selector):
    for _ in range(8):
        info = page.locator(selector).evaluate("e=>{const r=e.getBoundingClientRect(),p=e.closest('.cc-ui-area'),q=p?.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),insidePanel=!q||(r.top>=q.top+p.clientTop-1&&r.bottom<=q.top+p.clientTop+p.clientHeight+1);return {ok:!!h&&(h===e||e.contains(h))&&r.y>=-1&&r.bottom<=innerHeight+1&&insidePanel,top:r.top,panelTop:q?.top,panelBottom:q?.bottom,scrollable:!!p&&p.scrollHeight>p.clientHeight+1};}")
        if info['ok']:
            return
        assert info['scrollable'], f"Unreachable control {selector}: {info}"
        touch_scroll(page, cdp, -1 if info['top'] < info['panelTop'] else 1)
    raise AssertionError(f"Touch scroll cannot reach {selector}: {info}")


def home_and_reenter(page, game):
    home = '.cs-root [data-action="home-complete"]' if game == 'construction' else '.cc-success-home'
    tap_exact(page, home)
    page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]',).wait_for()
    tap_exact(page, '.zone-home-btn')
    page.locator('.world-zone[onclick="travelToZone(\'cars\')"]').wait_for()
    page.locator('.world-zone[onclick="travelToZone(\'cars\')"]').tap()
    page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]',).wait_for()
    if game == 'construction':
        page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]',).tap()
    else:
        page.evaluate('openCodingCarGame()')
    page.locator('.cs-root' if game == 'construction' else '.cc-root').wait_for()
    page.wait_for_timeout(300)
    assert page.locator('.cs-success-panel,.cc-success-overlay').count() == 0
    tap_exact(page, '.game-back-floating')
    page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]',).wait_for()
    assert page.locator('.cs-root,.cc-root').count() == 0
    # Keep a fresh game available for the caller's reset-state observation.
    if game == 'construction':
        page.locator('.zone-game-card[onclick="openConstructionSiteGame()"]',).tap()
    else:
        page.evaluate('openCodingCarGame()')
    page.locator('.cs-root' if game == 'construction' else '.cc-root').wait_for()
    page.wait_for_timeout(250)


def construction_flow(page, capture, name):
    stages = []
    for round_number in range(1, 4):
        page.wait_for_function("!document.querySelector('.cs-root.is-working')")
        mission = page.locator('.cs-root').evaluate("e=>[...e.classList].find(c=>c.startsWith('cs-stage-')).slice(9)")
        assert mission in ANSWERS, f'Unexpected deterministic mission {mission}'
        detail = page.evaluate(MEASURE, 'construction')
        stages.append(detail)
        if mission == 'pump':
            capture(name + '-pump', detail)
            tap_exact(page, '.cs-root [data-action="listen"]')
        vehicle = next((v for v in ANSWERS[mission] if page.locator(f'.cs-choice[data-id="{v}"]').count()), None)
        assert vehicle, f'No displayed usable vehicle for {mission}'
        tap_exact(page, f'.cs-choice[data-id="{vehicle}"]')
        page.locator('.cs-root.is-success').wait_for()
        page.wait_for_timeout(850)
        detail = page.evaluate(MEASURE, 'construction')
        stages.append(detail)
        if mission == 'pump':
            capture(name + '-result', detail)
        if round_number < 3:
            page.wait_for_function("r=>document.querySelector('.cs-pill')?.textContent.includes(r+'번')", arg=round_number + 1, timeout=10000)
        else:
            page.locator('.cs-success-panel').wait_for(timeout=10000)
    page.wait_for_timeout(1100)
    final = page.evaluate(MEASURE, 'construction')
    capture(name + '-complete', final)
    stages.append(final)
    assert not [i for s in stages for i in s['issues']], [i for s in stages for i in s['issues']]
    home_and_reenter(page, 'construction')
    assert page.locator('.cs-pill').inner_text().strip().startswith('🏗️ 1')
    return {'stages': stages, 'pumpSeen': True, 'homeToWorldAndReentry': True}


def coding_flow(page, cdp, capture, name):
    states = []
    scroll_checks = []
    for difficulty in ['easy', 'challenge']:
        if difficulty == 'challenge':
            tap_exact(page, '.cc-diff-btn[data-difficulty="challenge"]')
            page.wait_for_timeout(250)
        detail = page.evaluate(MEASURE, 'coding')
        capture(name + '-' + difficulty, detail)
        states.append(detail)
        assert not detail['issues'], detail['issues']
        reach(page, cdp, '.cc-guide-text')
        # Code slots are not buttons, but every whole slot must remain readable.
        # A panel may legitimately scroll; use finger input to expose each slot
        # and never accept merely counting seven overlapped DOM elements.
        slot_reach = []
        assert page.locator('#ccSlots .cc-slot').count() == (4 if difficulty == 'easy' else 7)
        for index in range(1, (4 if difficulty == 'easy' else 7) + 1):
            selector = f'#ccSlots .cc-slot:nth-child({index})'
            reach(page, cdp, selector)
            slot_reach.append(page.locator(selector).evaluate("e=>{const r=e.getBoundingClientRect(),p=e.closest('.cc-ui-area');return {rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},panelScrollTop:p.scrollTop};}"))
        # Check all controls can be reached by finger movement, including ones
        # legitimately below a scrollable panel's initial viewport.
        for selector in ['.cc-btn-arrow[data-dir="up"]', '.cc-btn-arrow[data-dir="down"]',
                         '.cc-btn-arrow[data-dir="left"]', '.cc-btn-arrow[data-dir="right"]',
                         '.cc-btn-edit[data-action="undo"]', '.cc-btn-edit[data-action="clear"]', '#ccGoBtn']:
            reach(page, cdp, selector)
            box = page.locator(selector).bounding_box()
            assert box['width'] >= 43.8 and box['height'] >= 43.8, (selector, box)
        panel = page.evaluate("()=>{const p=document.querySelector('.cc-ui-area');return {scrollTop:p.scrollTop,max:p.scrollHeight-p.clientHeight};}")
        scroll_checks.append({'difficulty': difficulty, 'codeSlotsReached': slot_reach, **panel})
        start, goal = detail['map']['start'], detail['map']['goal']
        dx, dy = int(goal[0]) - int(start[0]), int(goal[1]) - int(start[1])
        route = (['right' if dx > 0 else 'left'] * abs(dx) + ['down' if dy > 0 else 'up'] * abs(dy))
        assert 1 <= len(route) <= (4 if difficulty == 'easy' else 7), route
        reach(page, cdp, '.cc-btn-arrow[data-dir="' + route[0] + '"]')
        tap_exact(page, '.cc-btn-arrow[data-dir="' + route[0] + '"]')
        before = page.locator('#ccSlots img').count()
        original = page.viewport_size
        page.set_viewport_size({'width': original['height'], 'height': original['width']})
        page.wait_for_timeout(300)
        page.set_viewport_size(original)
        page.wait_for_timeout(300)
        assert before == 1 and page.locator('#ccSlots img').count() == before, 'Rotation lost commands'
        reach(page, cdp, '.cc-btn-edit[data-action="undo"]')
        tap_exact(page, '.cc-btn-edit[data-action="undo"]')
        assert page.locator('#ccSlots img').count() == 0, 'Undo did not remove command'
        reach(page, cdp, '.cc-btn-edit[data-action="clear"]')
        tap_exact(page, '.cc-btn-edit[data-action="clear"]')
        for direction in route:
            selector = '.cc-btn-arrow[data-dir="' + direction + '"]'
            reach(page, cdp, selector)
            tap_exact(page, selector)
        assert page.locator('#ccSlots img').count() == len(route)
        reach(page, cdp, '#ccGoBtn')
        tap_exact(page, '#ccGoBtn')
        page.locator('.cc-success-overlay').wait_for(timeout=15000)
        page.wait_for_timeout(600)
        # Underlying controls are intentionally occluded by the success modal.
        modal = page.locator('.cc-success-box').evaluate("e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};}")
        assert modal['left'] >= -1 and modal['top'] >= -1 and modal['right'] <= original['width'] + 1 and modal['bottom'] <= original['height'] + 1, modal
        capture(name + '-' + difficulty + '-complete', {'modal': modal})
        if difficulty == 'easy':
            tap_exact(page, '.cc-success-retry')
            page.wait_for_timeout(250)
        else:
            home_and_reenter(page, 'coding')
    return {'states': states, 'scrollChecks': scroll_checks, 'rotationKeepsCommands': True,
            'undoAndRouteExecution': True, 'homeToWorldAndReentry': True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=pathlib.Path, default=SCRIPT_ROOT)
    parser.add_argument('--base-url', help='Verify the same checked-out runtime on a public HTTP(S) playground URL.')
    parser.add_argument('--output', type=pathlib.Path, required=True)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--baseline', action='store_true')
    modes.add_argument('--tablet-baseline', action='store_true', help='Reproduce code-slot overlap at 1024x768 on a frozen app revision.')
    parser.add_argument('--game', choices=['construction', 'coding'], help='Run only the selected candidate game; preserves the six viewport checks.')
    parser.add_argument('--viewport', help='Candidate-only size filter, e.g. 1024x768; requires --game and a previously defined viewport.')
    args = parser.parse_args()
    if args.base_url and (args.baseline or args.tablet_baseline):
        parser.error('--base-url verifies a release; baseline reproductions use a frozen local --root.')
    try:
        public_base = normalize_base(args.base_url) if args.base_url else None
    except ValueError as exc:
        parser.error(str(exc))
    if (args.game or args.viewport) and (args.baseline or args.tablet_baseline):
        parser.error('--game/--viewport are candidate-only; baseline modes select their exact reproduction cases.')
    selected_size = None
    if args.viewport:
        match = re.fullmatch(r'(\d+)x(\d+)', args.viewport)
        selected_size = tuple(map(int, match.groups())) if match else None
        if not args.game or selected_size not in SIZES:
            parser.error('--viewport requires --game and one of: ' + ', '.join(f'{w}x{h}' for w, h in SIZES))
    root, out = args.root.resolve(), args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    mode = 'baseline' if args.baseline else 'tablet-baseline' if args.tablet_baseline else 'production' if public_base else 'candidate'
    report = {'mode': mode, 'gameFilter': args.game, 'viewportFilter': selected_size, 'gitSha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root).decode().strip(),
              'sourceHashesBefore': hashes(root), 'checks': [], 'pageErrors': [],
              'scrollDiagnostics': [], 'browserSources': [],
              'runnerGitSha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=SCRIPT_ROOT).decode().strip(),
              'runnerSourceHashesBefore': runner_hashes(),
              'scope': 'Two games only. Chromium touch emulation; simulated audio completion; coding existing internal entry. Physical device/speaker NOT_RUN.'}
    server = None
    if public_base:
        base = public_base
    else:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QA['QuietServer'], directory=str(root)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f'http://127.0.0.1:{server.server_port}/'
    report['baseUrl'] = base
    try:
        report['servedSourcesBefore'] = served_sources(base, report['sourceHashesBefore'])
        assert report['servedSourcesBefore']['matchesCheckout'], report['servedSourcesBefore']
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            report['browserVersion'] = browser.version
            games = ['coding'] if args.tablet_baseline else [args.game] if args.game else ['construction', 'coding']
            for game in games:
                if args.tablet_baseline:
                    sizes = [(1024, 768)]
                elif args.baseline:
                    sizes = [(640, 360)] if game == 'construction' else [(390, 844)]
                else:
                    sizes = [selected_size] if selected_size else SIZES
                for width, height in sizes:
                    name = f'{game}-{width}x{height}'
                    context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True, service_workers='block')
                    context.add_init_script(QA['PROBE'])
                    context.add_init_script(TOUCH_PROBE)
                    # Stable random input selects carry/pump/dig, without changing
                    # any game state or granting answers. Same seed both versions.
                    context.add_init_script('Math.random = () => 0.3;')
                    page = context.new_page()
                    page._ui_scroll_diagnostics = []
                    page._ui_scroll_shots = set()
                    page._ui_case_name = name
                    page._ui_output = out
                    responses = {}
                    source_paths = {urlsplit(urljoin(base, path)).path: path for path in SOURCES}
                    def remember_source(response):
                        path = source_paths.get(urlsplit(response.url).path)
                        if path:
                            responses[path] = response
                    page.on('response', remember_source)
                    page.on('pageerror', lambda error, n=name: report['pageErrors'].append({'screen': n, 'error': str(error)}))
                    def capture(label, detail):
                        page.screenshot(path=str(out / (label + '.png')))
                        (out / (label + '.json')).write_text(json.dumps(detail, ensure_ascii=False, indent=2))
                    def record(label, fn):
                        row = {'name': label}
                        try:
                            row['detail'] = fn()
                            row['status'] = 'PASS'
                            if isinstance(row['detail'], dict) and row['detail'].get('issues'):
                                row['status'] = 'FAIL'
                        except Exception as exc:
                            row.update(status='FAIL', error=str(exc), trace=traceback.format_exc())
                        if row['status'] == 'FAIL':
                            try:
                                page.screenshot(path=str(out / (label + '-failure.png')))
                                row['screenshot'] = label + '-failure.png'
                            except Exception as exc:
                                row['screenshotError'] = str(exc)
                        report['checks'].append(row)
                        print(label, row['status'], row.get('error', ''), flush=True)
                        return row
                    try:
                        enter(page, base, game)
                        report['browserSources'].append({'screen': name,
                            'sources': page_source_evidence(responses, report['sourceHashesBefore'])})
                        if args.tablet_baseline:
                            for difficulty in ['easy', 'challenge']:
                                if difficulty == 'challenge':
                                    tap_exact(page, '.cc-diff-btn[data-difficulty="challenge"]')
                                    page.wait_for_timeout(250)
                                detail = page.evaluate(MEASURE, game)
                                capture(name + '-' + difficulty, detail)
                                record(name + '-' + difficulty + '-layout', lambda: detail)
                            continue
                        detail = page.evaluate(MEASURE, game)
                        capture(name + '-initial', detail)
                        record(name + '-layout', lambda: detail)
                        if not args.baseline:
                            if game == 'construction':
                                # Existing puzzle/round survives a responsive reflow.
                                identity = page.locator('.cs-pill').inner_text() + page.locator('.cs-title').inner_text()
                                page.set_viewport_size({'width': height, 'height': width})
                                page.wait_for_timeout(300)
                                page.set_viewport_size({'width': width, 'height': height})
                                page.wait_for_timeout(300)
                                assert identity == page.locator('.cs-pill').inner_text() + page.locator('.cs-title').inner_text(), 'Rotation lost construction round'
                                record(name + '-touch-flow', lambda: construction_flow(page, capture, name))
                            else:
                                cdp = context.new_cdp_session(page)
                                record(name + '-touch-flow', lambda: coding_flow(page, cdp, capture, name))
                    except Exception as exc:
                        record(name + '-entry', lambda: (_ for _ in ()).throw(exc))
                    finally:
                        report['scrollDiagnostics'].extend({'screen': name, **row} for row in page._ui_scroll_diagnostics)
                        context.close()
            browser.close()
    except Exception as exc:
        report['runnerError'] = str(exc)
        report['runnerTrace'] = traceback.format_exc()
    finally:
        report['servedSourcesAfter'] = served_sources(base, report['sourceHashesBefore'])
        if server:
            server.shutdown()
        report['sourceHashesAfter'] = hashes(root)
        report['runnerSourceHashesAfter'] = runner_hashes()
        report['sourcesUnchanged'] = report['sourceHashesBefore'] == report['sourceHashesAfter'] and report['runnerSourceHashesBefore'] == report['runnerSourceHashesAfter']
        report['servedSourcesMatchCheckout'] = report.get('servedSourcesBefore', {}).get('matchesCheckout', False) and report['servedSourcesAfter']['matchesCheckout']
        report['status'] = 'PASS' if report['checks'] and all(row['status'] == 'PASS' for row in report['checks']) and not report['pageErrors'] and report['sourcesUnchanged'] and report['servedSourcesMatchCheckout'] and not report.get('runnerError') else 'FAIL'
        if args.baseline:
            construction = next((r for r in report['checks'] if r['name'] == 'construction-640x360-layout'), {})
            coding = next((r for r in report['checks'] if r['name'] == 'coding-390x844-layout'), {})
            report['expectedDefectsReproduced'] = {
                'constructionScene': any(i['kind'] == 'scene-clipped' for i in construction.get('detail', {}).get('issues', [])),
                'codingArrow': any(i['kind'] == 'arrow-clipped' for i in coding.get('detail', {}).get('issues', [])),
            }
        elif args.tablet_baseline:
            slot_defects = {'slot-outside-group', 'slot-control-overlap', 'slot-slot-overlap'}
            report['expectedDefectsReproduced'] = {}
            for difficulty in ['easy', 'challenge']:
                row = next((r for r in report['checks'] if r['name'] == f'coding-1024x768-{difficulty}-layout'), {})
                report['expectedDefectsReproduced'][difficulty + 'CodeSlots'] = any(i['kind'] in slot_defects for i in row.get('detail', {}).get('issues', []))
        (out / 'small-screen-ui-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print('SMALL_SCREEN_UI', report['mode'], report['status'], flush=True)
    if args.baseline or args.tablet_baseline:
        return 0 if all(report['expectedDefectsReproduced'].values()) and report['sourcesUnchanged'] and report['servedSourcesMatchCheckout'] and not report['pageErrors'] and not report.get('runnerError') else 1
    return int(report['status'] != 'PASS')


if __name__ == '__main__':
    raise SystemExit(main())
