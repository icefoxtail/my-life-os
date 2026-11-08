#!/usr/bin/env python3
"""Read-only vehicle inventory and QA composites; never edits source images."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import argparse, hashlib, json, math, subprocess

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/qa/sihyeon-phase2'
BASE='58eb1fad34bba957812b08cf55bdf28c5595ca60'
FONT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
SMALL=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',11)

def raw(path, before=False):
    if before: return subprocess.check_output(['git','show',f'{BASE}:{path}'],cwd=ROOT)
    return (ROOT/path).read_bytes()

def decode(data):
    from io import BytesIO
    im=Image.open(BytesIO(data)); im.load(); return im

def metrics(data):
    im=decode(data); rgba=im.convert('RGBA'); alpha=rgba.getchannel('A')
    box=alpha.point(lambda x:255 if x>16 else 0).getbbox()
    bins=alpha.histogram(); n=im.width*im.height
    return dict(sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),format=im.format,mode=im.mode,width=im.width,height=im.height,
      alphaBounds16=list(box) if box else None,transparentFraction=round(sum(bins[:16])/n,6),partialAlphaFraction=round(sum(bins[16:255])/n,6),
      sourceAspectRatio=round(im.width/im.height,7),decoded=True)

def games(entry):
    g=['number-count','vehicle-memory','parking-lot','coding-car'] if entry['category']!='fire_special' else []
    if entry['category']=='construction':g.append('construction-site')
    if entry['category'] in ['fire','fire_special']:g.append('megaDispatch')
    if entry['file']=='assets/vehicles/transport/train.png':g.append('home-train')
    return g

def checker(w,h):
    im=Image.new('RGBA',(w,h),'#eaf1f5');d=ImageDraw.Draw(im)
    for y in range(0,h,12):
      for x in range(0,w,12):
       if (x//12+y//12)%2: d.rectangle((x,y,x+11,y+11),fill='#d1dfe6')
    return im

def contact(entries,label,before=True):
    files=[]; cols=4; cw=280; ch=270
    for offset in range(0,len(entries),16):
      page=entries[offset:offset+16];rows=math.ceil(len(page)/cols)
      canvas=Image.new('RGB',(cols*cw,rows*ch+44),'#fff8ed');draw=ImageDraw.Draw(canvas)
      draw.text((12,12),f'{label} / {offset+1}-{offset+len(page)} / original pixels, full frame',font=FONT,fill='#162c39')
      for i,e in enumerate(page):
        x=(i%cols)*cw;y=(i//cols)*ch+44
        bg=Image.new('RGBA',(cw-10,218),'#9db9ca')
        im=decode(raw(e['file'],before)).convert('RGBA');im.thumbnail((cw-18,210),Image.Resampling.LANCZOS)
        bg.alpha_composite(im,((bg.width-im.width)//2,(bg.height-im.height)//2));canvas.paste(bg.convert('RGB'),(x+5,y))
        draw.text((x+7,y+221),f"{e['index']:03d} {e['id']}",font=SMALL,fill='#162c39')
        draw.text((x+7,y+237),e['category'],font=SMALL,fill='#345166')
      fn=f"{label}-{offset//16+1:02d}.jpg";dest=OUT/'contact'/fn;dest.parent.mkdir(parents=True,exist_ok=True);canvas.save(dest,quality=89)
      files.append(str(dest.relative_to(ROOT)))
    return files

def compare(entry):
    a=decode(raw(entry['file'],True)).convert('RGBA');b=decode(raw(entry['file'])).convert('RGBA')
    # Display both at the same full-source-frame scale; do not conceal changed aspect.
    cell=380;top=40;canvas=Image.new('RGB',(cell*3,cell*2+top+50),'#fff')
    draw=ImageDraw.Draw(canvas); draw.text((10,10),f"{entry['index']:03d} {entry['file']}",font=FONT,fill='#132630')
    for row,im in enumerate([a,b]):
      for col,bgcolor in enumerate(['#ffffff','#203642',None]):
        bg=Image.new('RGBA',(cell,cell),bgcolor) if bgcolor else checker(cell,cell)
        tile=im.copy();tile.thumbnail((cell-20,cell-20),Image.Resampling.LANCZOS)
        bg.alpha_composite(tile,((cell-tile.width)//2,(cell-tile.height)//2));canvas.paste(bg.convert('RGB'),(col*cell,top+row*cell))
      draw.text((10,top+row*cell+3),'BEFORE' if row==0 else 'AFTER',font=FONT,fill='#598da4')
    fn=entry['category']+'-'+entry['id']+'.jpg';p=OUT/'comparisons'/fn;p.parent.mkdir(parents=True,exist_ok=True);canvas.save(p,quality=91)
    return str(p.relative_to(ROOT))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--contact',action='store_true');args=parser.parse_args()
    normal=json.loads((ROOT/'assets/vehicles/vehicles_manifest.json').read_text())['vehicles']
    special=json.loads((ROOT/'assets/vehicles/fire_special_manifest.json').read_text())
    source=normal+special
    assert len(normal)==129 and len(special)==9 and len({x['file'] for x in source})==138
    reviews_path=OUT/'vehicle-visual-review.json'
    reviews=json.loads(reviews_path.read_text()) if reviews_path.exists() else {}
    entries=[]
    for index,e in enumerate(source,1):
      original=metrics(raw(e['file'],True));current=metrics(raw(e['file']))
      review=reviews.get(e['file'],{'classification':'PENDING_VISUAL','finding':'Not yet reviewed in this phase'})
      item=dict(index=index,id=e['id'],name_ko=e['name_ko'],category=e['category'],file=e['file'],games=games(e),before=original,after=current,originalChanged=original['sha256']!=current['sha256'],**review)
      if item['originalChanged']:item['comparison']=compare(item)
      entries.append(item)
    out=dict(schemaVersion=1,sourceCommit=BASE,uniqueImageCount=len(entries),manifestCount=129,separateFireSpecialCount=9,existingTransparentCount=39,
       method='Read-only Pillow metadata/composites; visual decisions separately authored after inspection. Color mode alone never determines defects.',
       note='car-garage draws its cars with inline SVG, so it has no dependency on these 138 raster vehicle files.',
       classificationCounts={c:sum(e['classification']==c for e in entries) for c in sorted(set(e['classification'] for e in entries))},
       actualOriginalEdits=sum(e['originalChanged'] for e in entries),entries=entries)
    if args.contact:
      out['beforeContactSheets']=contact(entries,'vehicles-before',True)
      out['afterContactSheets']=contact(entries,'vehicles-after',False)
    OUT.mkdir(parents=True,exist_ok=True);(OUT/'vehicle-inventory.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in out.items() if k!='entries'},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
