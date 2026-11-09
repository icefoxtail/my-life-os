"""Exercise the hidden Pixi builder through native mouse and touch input."""
import argparse
import functools
import http.server
import json
import pathlib
import runpy
import threading
import traceback

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
QA = runpy.run_path(str(ROOT / "scripts/qa-p1-voice-browser.py"))
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


def run(page, url, lang, touch):
    QA["start"](page,url,lang)
    page.evaluate("""() => {
      Math.random=()=>0;
      const api=SihyeonPixiRuntime, create=api.createGame;
      api.createGame=async (...args)=>window.__pixi=await create(...args);
      openNumberVehiclesPixiGame();
    }""")
    page.wait_for_function("window.__pixi?.layers.objects?.children?.[2]?.children?.[0]?.partNumber===1",
                           timeout=35000)
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
    expected=("Hooray! We built a fire truck!","en-US") if lang=="en" else ("우와! 소방차 출동!","ko-KR")
    calls=[(r["text"],r["lang"]) for r in QA["spoken"](QA["trace"](page))]
    assert calls==[expected],calls
    return {"placed":7,"completion":calls,"pixiVersion":page.evaluate("PIXI.VERSION")}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=pathlib.Path,required=True)
    args=parser.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    results=[]
    handler=functools.partial(QA["QuietServer"],directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1",0),handler) as server:
        threading.Thread(target=server.serve_forever,daemon=True).start()
        url=f"http://127.0.0.1:{server.server_port}/index.html"
        with sync_playwright() as pw:
            browser=pw.chromium.launch(args=["--enable-unsafe-swiftshader"])
            for lang,touch in [("ko",False),("en",True)]:
                context=browser.new_context(viewport={"width":390,"height":844} if touch else
                    {"width":1366,"height":768},has_touch=touch,service_workers="block",
                    ignore_https_errors=True)
                context.add_init_script(QA["PROBE"])
                page=context.new_page()
                errors=[]
                page.on("pageerror",lambda error:errors.append(str(error)))
                row={"language":lang,"input":"touch" if touch else "mouse","errors":errors}
                try:
                    row.update(run(page,url,lang,context.new_cdp_session(page) if touch else None))
                    assert not errors,errors
                    row["status"]="PASS"
                    page.screenshot(path=str(args.output/f"completed-{lang}.png"))
                except Exception:
                    row["status"]="FAIL"
                    row["failure"]=traceback.format_exc()
                    page.screenshot(path=str(args.output/f"failed-{lang}.png"))
                finally:context.close()
                results.append(row)
                print(lang,row["status"],flush=True)
        server.shutdown()
    (args.output/"pixi-vehicle-browser.json").write_text(
        json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    return int(any(row["status"]!="PASS" for row in results))


if __name__=="__main__":
    raise SystemExit(main())
