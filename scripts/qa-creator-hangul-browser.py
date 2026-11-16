#!/usr/bin/env python3
"""Real Chromium/WebGL checks for creator-stage Hangul content.

The public menu entry and 2D controls use ordinary browser clicks. 3D content
setup uses the existing OpenWorldDebug spawn/merge API, not a pointer simulation.
GPU/CDN failure is FAIL, never a successful 2D substitution for the 3D checks.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import http.server
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import traceback
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = [(390, 844), (844, 390)]
SOURCE_PATHS = ["index.html", "games/hangul-playmat-3d.html", "js/engine/webgl-fallback.js"]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def write_png(data_url, target):
    assert data_url.startswith("data:image/png;base64,")
    target.write_bytes(base64.b64decode(data_url.split(",", 1)[1]))


def verify_sources(base_url):
    sources = []
    for relative in SOURCE_PATHS:
        req = urllib.request.Request(base_url + "/" + relative, headers={"Cache-Control": "no-cache"})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            assert response.status == 200, relative
        local = (ROOT / relative).read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        assert data == local, f"Served source differs from checkout: {relative} ({digest})"
        sources.append({"path": relative, "bytes": len(data), "sha256": digest,
                        "git_blob_sha1": hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()})
    return sources


COMPOSE = """([cho,jung]) => {
  const api=window.OpenWorldDebug;
  api.state.sound=false;
  api.resetInitialBlocks();
  const c=api.spawnFromTray('cho',cho), j=api.spawnFromTray('jung',jung);
  return api.mergeChoAndJung(c,j).char;
}"""

READ_TOY = """() => {
  const t=window.OpenWorldDebug.state.toys.at(-1);
  if(!t) throw new Error('No live toy');
  const card=t.mesh.userData.wordPicture;
  const image=card?.material.map.image;
  let inkPixels=null;
  if(image){
    const data=image.getContext('2d').getImageData(56,30,400,300).data;
    inkPixels=0;
    for(let i=0;i<data.length;i+=4) if(data[i+3]>0 && (data[i]<210 || data[i+1]<210 || data[i+2]<210)) inkPixels++;
  }
  return {word:t.word,emoji:t.emoji,picture:Boolean(card),pictureWord:t.mesh.userData.word||null,
    firstGeometry:t.mesh.children[0]?.geometry?.type||null,inkPixels,
    picturePng:image?.toDataURL('image/png')||null};
}"""

COMPARE_PIXELS = """(screen, reference, width, height, bounds) => {
  const counts={picture:{ink:0,matched:0},label:{ink:0,matched:0}};
  for(let y=Math.max(0,Math.floor(bounds.y));y<Math.min(height,Math.ceil(bounds.y+bounds.height));y++){
    for(let x=Math.max(0,Math.floor(bounds.x));x<Math.min(width,Math.ceil(bounds.x+bounds.width));x++){
      const nx=(x-bounds.x)/bounds.width,ny=(y-bounds.y)/bounds.height;
      const zone=nx>.10&&nx<.90&&ny>.08&&ny<.74?'picture':nx>.07&&nx<.93&&ny>.80&&ny<.96?'label':null;
      if(!zone) continue;
      const p=(y*width+x)*4;
      if(reference[p+3]<245 || Math.min(reference[p],reference[p+1],reference[p+2])>195) continue;
      counts[zone].ink++;
      let matched=false;
      for(let dy=-2;dy<=2&&!matched;dy++) for(let dx=-2;dx<=2;dx++){
        const sx=x+dx,sy=y+dy;
        if(sx<0||sy<0||sx>=width||sy>=height) continue;
        const q=(sy*width+sx)*4;
        if(Math.max(Math.abs(reference[p]-screen[q]),Math.abs(reference[p+1]-screen[q+1]),Math.abs(reference[p+2]-screen[q+2]))<=40){matched=true;break;}
      }
      if(matched) counts[zone].matched++;
    }
  }
  return {pictureInk:counts.picture.ink,labelInk:counts.label.ink,
    pictureMatch:counts.picture.matched/Math.max(1,counts.picture.ink),
    labelMatch:counts.label.matched/Math.max(1,counts.label.ink)};
}"""

READ_VISIBLE_PICTURE = "async (png) => { const compare = " + COMPARE_PIXELS + """;
  const t=OpenWorldDebug.state.toys.at(-1), sprite=t.mesh.userData.wordPicture;
  const bounds={...t.mesh.userData.pictureBounds};
  if(!sprite || !bounds.width) throw new Error('No projected picture card');
  const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
  const actual=document.createElement('canvas');actual.width=image.width;actual.height=image.height;
  const a=actual.getContext('2d');a.drawImage(image,0,0);
  const screen=a.getImageData(0,0,actual.width,actual.height).data;

  // A 2D drawImage downsample is not a WebGL texture reference: sRGB sampling,
  // mipmaps and subpixel rasterization differ. Render an isolated clone through
  // the same GPU pipeline at the live card's exact projected size instead.
  // This renderer never receives the game's scene, camera or owned material.
  const reference=document.createElement('canvas');reference.width=actual.width;reference.height=actual.height;
  const refContext=reference.getContext('2d');
  const gpu=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  const texture=sprite.material.map.clone();texture.needsUpdate=true;
  const material=sprite.material.clone();material.map=texture;
  try {
    gpu.setPixelRatio(1);gpu.setSize(actual.width,actual.height,false);
    gpu.setClearColor(0x000000,0);
    if('outputEncoding' in gpu) gpu.outputEncoding=THREE.sRGBEncoding;
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(0,actual.width,actual.height,0,.1,10);camera.position.z=1;
    const card=new THREE.Sprite(material);
    card.position.set(bounds.x+bounds.width/2,actual.height-bounds.y-bounds.height/2,0);
    card.scale.set(bounds.width,bounds.height,1);scene.add(card);
    gpu.render(scene,camera);
    refContext.drawImage(gpu.domElement,0,0);
  } finally {
    material.dispose();texture.dispose();gpu.dispose();gpu.forceContextLoss();
  }
  const referencePixels=refContext.getImageData(0,0,reference.width,reference.height).data;
  const measured=compare(screen,referencePixels,actual.width,actual.height,bounds);

  // Keep the old reference only as diagnostic evidence of the raster mismatch.
  const legacy=document.createElement('canvas');legacy.width=actual.width;legacy.height=actual.height;
  const legacyContext=legacy.getContext('2d');
  legacyContext.drawImage(sprite.material.map.image,Math.round(bounds.x),Math.round(bounds.y),Math.round(bounds.width),Math.round(bounds.height));
  const legacyPixels=legacyContext.getImageData(0,0,legacy.width,legacy.height).data;
  const legacyMeasured=compare(screen,legacyPixels,actual.width,actual.height,bounds);
  const pipelineDifference=compare(referencePixels,legacyPixels,actual.width,actual.height,bounds);

  // The unchanged thresholds must reject actual missing content. Mask only a
  // copy of the GPU reference, never the live world, for these negative controls.
  function occluded(zone){
    const copy=document.createElement('canvas');copy.width=reference.width;copy.height=reference.height;
    const ctx=copy.getContext('2d');ctx.drawImage(reference,0,0);ctx.fillStyle='#fffdf5';
    if(zone==='picture') ctx.fillRect(bounds.x+bounds.width*.25,bounds.y+bounds.height*.08,bounds.width*.5,bounds.height*.66);
    else ctx.fillRect(bounds.x+bounds.width*.5,bounds.y+bounds.height*.78,bounds.width*.5,bounds.height*.22);
    return compare(ctx.getImageData(0,0,copy.width,copy.height).data,referencePixels,copy.width,copy.height,bounds);
  }
  const selfTests={unoccluded:compare(referencePixels,referencePixels,actual.width,actual.height,bounds),
    pictureOccluded:occluded('picture'),labelOccluded:occluded('label')};

  // Actual / GPU reference / old 2D reference, enlarged without smoothing.
  const labels=document.createElement('canvas'),labelHeight=Math.ceil(bounds.height*.22);
  labels.width=Math.ceil(bounds.width)*3*4;labels.height=labelHeight*4;
  const labelsContext=labels.getContext('2d');labelsContext.imageSmoothingEnabled=false;
  [actual,reference,legacy].forEach((source,i)=>labelsContext.drawImage(source,bounds.x,bounds.y+bounds.height*.78,bounds.width,labelHeight,i*Math.ceil(bounds.width)*4,0,Math.ceil(bounds.width)*4,labelHeight*4));
  const toast=document.getElementById('toast').getBoundingClientRect();
  const tray=document.getElementById('trayWrap').getBoundingClientRect();
  return {bounds,screen:{width:actual.width,height:actual.height,dpr:devicePixelRatio},toastBottom:toast.bottom,trayTop:tray.top,
    depthTest:sprite.material.depthTest,worldZ:t.mesh.position.z,...measured,
    legacyMeasured,pipelineDifference,selfTests,
    referencePng:reference.toDataURL('image/png'),labelsPng:labels.toDataURL('image/png')};
}"""


def verify_visible_picture(frame, output, name):
    # Save actual pixels before any assertions, including a failure of comparison
    # code itself. Every attempted case keeps its screenshot, reference and scores.
    png = frame.locator("#scene3d").screenshot(path=str(output / f"{name}-actual.png"))
    visible = frame.evaluate(READ_VISIBLE_PICTURE, base64.b64encode(png).decode())
    write_png(visible.pop("referencePng"), output / f"{name}-reference.png")
    write_png(visible.pop("labelsPng"), output / f"{name}-labels-actual-gpu-2d.png")
    (output / f"{name}-visibility.json").write_text(json.dumps(visible, ensure_ascii=False, indent=2) + "\n")
    bounds = visible["bounds"]
    assert visible["screen"]["dpr"] == 1, "Reference and screenshot require the same device pixel ratio"
    assert bounds["width"] >= 80 and bounds["height"] >= 70, visible
    assert bounds["x"] >= 4 and bounds["x"] + bounds["width"] <= visible["screen"]["width"] - 4, visible
    assert bounds["y"] >= visible["toastBottom"] + 3, visible
    assert bounds["y"] + bounds["height"] <= visible["trayTop"] - 3, visible
    assert visible["depthTest"] is True and abs(visible["worldZ"] - 5) < .01, visible
    assert visible["pictureInk"] > 100 and visible["labelInk"] > 20, visible
    controls = visible["selfTests"]
    assert controls["unoccluded"]["pictureMatch"] == 1 and controls["unoccluded"]["labelMatch"] == 1, visible
    assert controls["pictureOccluded"]["pictureMatch"] < .90, visible
    assert controls["labelOccluded"]["labelMatch"] < .88, visible
    assert visible["pictureMatch"] >= .90 and visible["labelMatch"] >= .88, visible
    return visible


BUILD_BONUS = """(pairs) => {
  const api=window.OpenWorldDebug;api.state.sound=false;api.resetInitialBlocks();
  for(const [cho,jung] of pairs){
    const c=api.spawnFromTray('cho',cho), j=api.spawnFromTray('jung',jung);
    api.mergeChoAndJung(c,j);
  }
  // A normal tray spawn promotes the final syllable and invokes the real shelf check.
  api.spawnFromTray('cho','ㄱ');
}"""


def open_public_hangul(page, base_url):
    page.goto(base_url + "/index.html", wait_until="domcontentloaded", timeout=60000)
    page.locator("button.world-zone[onclick=\"travelToZone('letters')\"]").click(timeout=30000)
    page.locator("button.zone-game-card", has_text="3D 한글 블록").click(timeout=30000)
    handle = page.locator("#hangulPlaymatFrame").element_handle(timeout=20000)
    frame = handle.content_frame()
    assert frame is not None
    frame.wait_for_function("Boolean(window.OpenWorldDebug?.state && window.THREE && document.querySelector('#scene3d'))", timeout=25000)
    assert frame.locator("#sihyeon-2d-root").count() == 0, "3D test entered fallback"
    first_tick = frame.evaluate("OpenWorldDebug.state.lastTick")
    frame.wait_for_function("OpenWorldDebug.state.lastTick > " + str(first_tick), timeout=5000)
    webgl = frame.evaluate("""() => {
      const canvas=document.getElementById('scene3d');
      const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
      if(!gl || gl.isContextLost()) throw new Error('No active WebGL context');
      const ext=gl.getExtension('WEBGL_debug_renderer_info');
      return {version:gl.getParameter(gl.VERSION),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
    }""")
    return frame, webgl


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", help="Existing checkout server or deployed site root")
    parser.add_argument("--output", default="artifacts/creator-hangul-browser")
    args = parser.parse_args()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    server = None
    result = {"status": "RUNNING", "checks": [], "page_errors": [], "sources": [],
              "limitations": ["Machine browser checks, not a physical touch or child observation session.",
                              "3D content composition uses the existing OpenWorldDebug API; drag gestures are not certified.",
                              "Speech is muted during 3D checks; audio listening is NOT_RUN."],
              "test_api_scope": ["OpenWorldDebug.state.sound=false", "resetInitialBlocks()", "spawnFromTray()", "mergeChoAndJung()",
                                 "Read state.toys, lastBonusWord, projected pictureBounds and CanvasTexture image.",
                                 "Compare the actual screenshot with an isolated offscreen WebGL clone; keep the live scene unchanged.",
                                 "Use copied PNG occlusion controls and save actual/reference/label pixels and all scores before assertions."]}
    try:
        try:
            result["checkout_commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        except (OSError, subprocess.CalledProcessError):
            result["checkout_commit"] = None
        if args.base_url:
            base_url = args.base_url.rstrip("/")
        else:
            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base_url = f"http://127.0.0.1:{server.server_port}"
        result["base_url"] = base_url
        result["sources"] = verify_sources(base_url)
        with sync_playwright() as pw:
            launch = {"headless": True, "args": ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]}
            if os.environ.get("CHROMIUM_PATH"):
                launch["executable_path"] = os.environ["CHROMIUM_PATH"]
            browser = pw.chromium.launch(**launch)
            try:
                for width, height in VIEWPORTS:
                    tag = f"{width}x{height}"
                    context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1, service_workers="block")
                    page = context.new_page()
                    page.on("pageerror", lambda error, tag=tag: result["page_errors"].append({"viewport": tag, "error": str(error)}))
                    frame, webgl = open_public_hangul(page, base_url)
                    result["checks"].append({"case": "public-menu-to-real-webgl", "viewport": tag, "status": "PASS", "webgl": webgl})
                    cases = [("robot","ㄹ","ㅗ","로","로봇",True), ("rabbit","ㅌ","ㅗ","토","토끼",True),
                             ("tiger","ㅎ","ㅗ","호","호랑이",True), ("acorn","ㄷ","ㅗ","도","도토리",True),
                             ("apple","ㅅ","ㅏ","사","사과",False), ("letter","ㄱ","ㅑ","갸","갸 블록",True)]
                    for name, cho, jung, char, word, is_picture in cases:
                        assert frame.evaluate(COMPOSE, [cho,jung]) == char
                        page.wait_for_timeout(260)
                        toy = frame.evaluate(READ_TOY)
                        assert toy["word"] == word and toy["picture"] is is_picture, toy
                        if is_picture:
                            assert toy["pictureWord"] == word and toy["inkPixels"] > 1500, toy
                            write_png(toy.pop("picturePng"), output / f"picture-{name}-{tag}.png")
                            toy["visiblePicture"] = verify_visible_picture(frame, output, f"hangul-{name}-{tag}")
                        else:
                            assert toy["firstGeometry"] == "SphereGeometry", toy
                            toy.pop("picturePng")
                        page.screenshot(path=str(output / f"hangul-{name}-{tag}.png"))
                        result["checks"].append({"case": name, "viewport": tag, "status": "PASS", "toy": toy})
                    for word, pairs in [("두부", [["ㄷ","ㅜ"],["ㅂ","ㅜ"]]), ("고구마", [["ㄱ","ㅗ"],["ㄱ","ㅜ"],["ㅁ","ㅏ"]])]:
                        frame.evaluate(BUILD_BONUS, pairs)
                        frame.wait_for_function("word => OpenWorldDebug.state.lastBonusWord === word", arg=word, timeout=5000)
                        toy = frame.evaluate(READ_TOY)
                        assert toy["word"] == word and toy["picture"] and toy["pictureWord"] == word, toy
                        assert toy["inkPixels"] > 1500
                        toy.pop("picturePng")
                        page.wait_for_timeout(200)
                        assert frame.evaluate("OpenWorldDebug.state.toys.length") == 1, "Bonus must replace previous syllable popups"
                        name = "tofu" if word == "두부" else "sweet-potato"
                        toy["visiblePicture"] = verify_visible_picture(frame, output, f"shelf-{name}-{tag}")
                        page.screenshot(path=str(output / f"shelf-{name}-{tag}.png"))
                        result["checks"].append({"case": "shelf-" + name, "viewport": tag, "status": "PASS", "toy": toy})

                    # Explicit 2D checks use real UI controls and remain separate from WebGL evidence.
                    page.goto(base_url + "/games/hangul-playmat-3d.html?view=2d", wait_until="domcontentloaded")
                    page.locator("#sihyeon-2d-root").wait_for(state="visible")
                    mute = page.locator("button[aria-label='소리 끄기']")
                    if mute.count():
                        mute.click()
                    for name, cho, jung, word in [("acorn","ㄷ","ㅗ","도토리"), ("tofu","ㄷ","ㅜ","두부"),
                                                  ("ostrich","ㅌ","ㅏ","타조"), ("stroller","ㅇ","ㅠ","유모차"),
                                                  ("piggy-bank","ㅈ","ㅓ","저금통")]:
                        page.locator(f"button[data-cho='{cho}']").click()
                        page.locator(f"button[data-jung='{jung}']").click()
                        page.locator("button[data-action='join']").click()
                        assert page.locator(".s2d-word svg").count() == 1
                        picture = page.locator(f".s2d-word svg[aria-label='{word}']")
                        assert picture.is_visible()
                        assert word in page.locator(".s2d-word").inner_text()
                        if name in ("acorn", "stroller"):
                            page.screenshot(path=str(output / f"fallback-{name}-{tag}.png"))
                        result["checks"].append({"case": "fallback-" + name, "viewport": tag, "status": "PASS", "word": word})
                    context.close()
                assert not result["page_errors"], result["page_errors"]
            finally:
                browser.close()
        result["status"] = "PASS"
    except Exception as error:
        result["status"] = "FAIL"
        result["error"] = str(error)
        result["traceback"] = traceback.format_exc()
    finally:
        if server:
            server.shutdown()
        (output / "results.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"status": result["status"], "checks": len(result["checks"]), "output": str(output), "error": result.get("error")}, ensure_ascii=False))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
