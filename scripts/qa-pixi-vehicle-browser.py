"""Exercise the hidden Pixi builder through native mouse and touch input."""
import argparse
import functools
import http.server
import hashlib
import json
import pathlib
import runpy
import threading
import traceback

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
QA = runpy.run_path(str(ROOT / "scripts/qa-p1-voice-browser.py"))
SOURCE_FILES = ("index.html", "js/engine/pixi-runtime.js",
                "js/games-pixi/number-vehicles-pixi.js",
                "scripts/qa-pixi-vehicle-browser.py", "scripts/qa-p1-voice-browser.py",
                "scripts/test-pixi-lifecycle.cjs")
VEHICLES = (("소방차", "a fire truck"), ("경찰차", "a police car"), ("구급차", "an ambulance"))
POINTS = """() => {
  const r = __pixi, {offsetX,offsetY,scale}=r.getMetrics();
  const rect=r.app.canvas.getBoundingClientRect();
  const point=o=>[rect.left+offsetX+o.x*scale,rect.top+offsetY+o.y*scale];
  const [slots,placed,parts]=r.layers.objects.children;
  const launch=r.layers.ui.children[1].children[0];
  return {parts:parts.children.map(o=>[o.partNumber,point(o)]),
    slots:slots.children.map(point), placed:placed.children.length,
    launch:launch ? point(launch) : null};
}"""


def drag(page, touch, start, end):
    if not touch:
        page.mouse.move(*start)
        page.mouse.down()
        page.mouse.move(*end, steps=2)
        page.mouse.up()
        return
    send_touch(touch, "touchStart", start)
    for i in range(1, 13):
        point = [a+(b-a)*i/12 for a,b in zip(start,end)]
        send_touch(touch, "touchMove", point)
    send_touch(touch, "touchEnd")


def send_touch(session, event_type, point=None):
    session.send("Input.dispatchTouchEvent", {"type":event_type,
        "touchPoints":[{"x":point[0],"y":point[1]}] if point else []})


def install_runtime_probe(page, vehicle_index=0):
    page.evaluate("""index => {
      Math.random=()=>(index + 0.1)/3;
      window.__pixiHistory=[];
      const api=SihyeonPixiRuntime, create=api.createGame;
      api.createGame=async (...args)=>{
        const runtime=await create(...args);
        __pixiHistory.push(runtime);
        window.__pixi=runtime;
        if (window.__holdPixiReturn) await new Promise(resolve=>window.__releasePixi=resolve);
        return runtime;
      };
    }""", vehicle_index)


def wait_for_builder(page):
    page.wait_for_function("window.__pixi?.layers.objects?.children?.[2]?.children?.[0]?.partNumber===1",
                           timeout=35000)


def assert_disposed(page, old_name):
    result=page.evaluate("""name => {
      const old=window[name];
      return {destroyed:old.destroyed,tickers:old.tickers.size,timers:old.timers.length,
        fresh:__pixi!==old,placed:__pixi.layers.objects.children[1].children.length,
        parts:__pixi.layers.objects.children[2].children.length,
        canvases:document.querySelectorAll('#numberVehiclesPixiTarget canvas').length};
    }""",old_name)
    assert result=={"destroyed":True,"tickers":0,"timers":0,"fresh":True,
                    "placed":0,"parts":7,"canvases":1},result
    return result


def run(page, url, lang, touch, vehicle_index, output):
    QA["start"](page,url,lang)
    install_runtime_probe(page,vehicle_index)
    page.evaluate("openNumberVehiclesPixiGame()")
    wait_for_builder(page)
    state=page.evaluate(POINTS)
    start=state["parts"][1][1]
    tray_position=page.evaluate("""() => {
      const o=__pixi.layers.objects.children[2].children.find(o=>o.partNumber===2);
      return [o.x,o.y];
    }""")
    drag(page,touch,start,state["slots"][0])
    page.wait_for_function("""([x,y]) => {
      const o=__pixi.layers.objects.children[2].children.find(o=>o.partNumber===2);
      return o && Math.hypot(o.x-x,o.y-y)<0.01;
    }""",arg=tray_position,timeout=5000)
    state=page.evaluate(POINTS)
    assert state["placed"]==0,state

    for number in range(1,8):
        state=page.evaluate(POINTS)
        assert state["placed"]==number-1,state
        source=dict(state["parts"])[number]
        drag(page,touch,source,state["slots"][number-1])
        page.wait_for_function("(n)=>__pixi.layers.objects.children[1]?.children.length===n",
                               arg=number,timeout=5000)
    page.wait_for_function("__pixi.layers.ui.children[1]?.children.length===1",timeout=5000)
    launch=page.evaluate(POINTS)["launch"]
    QA["clear"](page)
    if touch:
        send_touch(touch,"touchStart",launch)
        send_touch(touch,"touchEnd")
    else:
        page.mouse.click(*launch)
    page.wait_for_function("__pixi.layers.ui.children[0].children.some(o=>o.text==='우와! 완성!')")
    korean,english=VEHICLES[vehicle_index]
    expected=(f"Hooray! We built {english}!","en-US") if lang=="en" else (f"우와! {korean} 출동!","ko-KR")
    calls=[(r["text"],r["lang"]) for r in QA["spoken"](QA["trace"](page))]
    assert calls==[expected],calls
    page.screenshot(path=str(output/f"completion-{vehicle_index}-{lang}.png"))
    result={"placed":7,"completion":calls,"pixiVersion":page.evaluate("PIXI.VERSION")}
    # Leave during the completion animation; the former round must not advance later.
    page.evaluate("window.__completedRuntime=__pixi")
    page.locator(".game-back-floating").click()
    page.evaluate("openNumberVehiclesPixiGame()")
    wait_for_builder(page)
    page.wait_for_timeout(600)
    result["completionExitReentry"]=assert_disposed(page,"__completedRuntime")
    return result


def lifecycle(page,url):
    QA["start"](page,url,"ko")
    install_runtime_probe(page)
    # Delay the async factory return to reproduce closing before game render resumes.
    page.evaluate("window.__holdPixiReturn=true; openNumberVehiclesPixiGame()")
    page.wait_for_function("typeof window.__releasePixi==='function'",timeout=35000)
    page.evaluate("window.__loadingRuntime=__pixi")
    page.locator(".game-back-floating").click()
    page.evaluate("window.__holdPixiReturn=false; __releasePixi()")
    page.wait_for_function("__loadingRuntime.destroyed")
    page.evaluate("openNumberVehiclesPixiGame()")
    wait_for_builder(page)
    loading=assert_disposed(page,"__loadingRuntime")

    # Leave immediately after a native drop, before its snap/pop animations finish.
    state=page.evaluate(POINTS)
    page.evaluate("window.__droppingRuntime=__pixi")
    drag(page,None,dict(state["parts"])[1],state["slots"][0])
    page.locator(".game-back-floating").click()
    page.evaluate("openNumberVehiclesPixiGame()")
    wait_for_builder(page)
    page.wait_for_timeout(700)
    dropping=assert_disposed(page,"__droppingRuntime")
    return {"loadingExitReentry":loading,"dropExitReentry":dropping}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=pathlib.Path,required=True)
    parser.add_argument("--base-url",help="Optional deployed index URL; defaults to the local checkout")
    parser.add_argument("--chromium",help="Optional system Chromium executable")
    args=parser.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    (args.output/"pixi-vehicle-sources.json").write_text(json.dumps({
        "baseUrl": args.base_url,
        "sourceSha256": {name: hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
                         for name in SOURCE_FILES},
        "physicalDevice": "NOT_RUN", "speakerListening": "NOT_RUN"
    },ensure_ascii=False,indent=2),encoding="utf-8")
    results=[]
    handler=functools.partial(QA["QuietServer"],directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1",0),handler) as server:
        threading.Thread(target=server.serve_forever,daemon=True).start()
        url=args.base_url or f"http://127.0.0.1:{server.server_port}/index.html"
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=args.chromium,
                args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
            cases=[(lang,touch,index) for index in range(3) for lang,touch in [("ko",False),("en",True)]]
            cases.append(("ko",False,None))
            for lang,touch,vehicle_index in cases:
                context=browser.new_context(viewport={"width":390,"height":844} if touch else
                    {"width":1366,"height":768},has_touch=touch,service_workers="block",
                    ignore_https_errors=True)
                context.add_init_script(QA["PROBE"])
                page=context.new_page()
                errors=[]
                page.on("pageerror",lambda error:errors.append(str(error)))
                case_name=f"{VEHICLES[vehicle_index][1]}-{lang}" if vehicle_index is not None else "lifecycle"
                row={"case":case_name,"language":lang,"input":"touch" if touch else "mouse","errors":errors}
                try:
                    if vehicle_index is None:row.update(lifecycle(page,url))
                    else:row.update(run(page,url,lang,context.new_cdp_session(page) if touch else None,vehicle_index,args.output))
                    assert not errors,errors
                    row["status"]="PASS"
                    page.screenshot(path=str(args.output/f"reentered-{vehicle_index}-{lang}.png"))
                except Exception:
                    row["status"]="FAIL"
                    row["failure"]=traceback.format_exc()
                    page.screenshot(path=str(args.output/f"failed-{vehicle_index}-{lang}.png"))
                finally:context.close()
                results.append(row)
                print(case_name,row["status"],flush=True)
        server.shutdown()
    (args.output/"pixi-vehicle-browser.json").write_text(
        json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    return int(any(row["status"]!="PASS" for row in results))


if __name__=="__main__":
    raise SystemExit(main())
