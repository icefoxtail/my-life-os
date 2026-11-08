#!/usr/bin/env python3
"""Import explicitly reviewed Imagegen outputs for web delivery, preserving alpha.
Input is a JSON array of {file, generatedPath, visuallyApproved:true, prompt}.
Only generated outputs are proportionally downscaled/encoded for web delivery.
This performs no source-image background segmentation, cropping or recoloring.
"""
from pathlib import Path
from PIL import Image
import argparse, hashlib, json, re, subprocess, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/qa/sihyeon-phase2'
BASE='58eb1fad34bba957812b08cf55bdf28c5595ca60'
TEMPLATE='Remove only the baked checkerboard/white backdrop and residual fringe. Use genuine transparent alpha. Keep this exact vehicle, original shape, paint, equipment structure, wheels, glass, white highlights, thin parts and camera angle. No cropping, stretching, redesign, added text, scenery or shadow. Preserve source aspect ratio with a small transparent safety margin.'

def sha(data):return hashlib.sha256(data).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('reviewed_manifest');args=p.parse_args()
 entries=json.loads(Path(args.reviewed_manifest).read_text())
 reviews=json.loads((OUT/'vehicle-visual-review.json').read_text())
 bounds=json.loads((ROOT/'assets/vehicles/display_bounds.json').read_text())
 provenance_path=OUT/'vehicle-imagegen-provenance.json'
 prov=json.loads(provenance_path.read_text()) if provenance_path.exists() else {'method':'Built-in Imagegen; one original per call; original inspected before editing. Explicit visual approval before import.','promptTemplate':TEMPLATE,'entries':[]}
 indexed={x['file']:x for x in prov['entries']}
 for e in entries:
  rel=e['file'];source=Path(e['generatedPath'])
  assert e.get('visuallyApproved') is True,'Never automatically approve an unreviewed edit'
  assert rel in reviews and source.is_file()
  original=subprocess.check_output(['git','show',f'{BASE}:{rel}'],cwd=ROOT)
  im=Image.open(source).convert('RGBA');assert im.getchannel('A').getextrema()==(0,255)
  generated_size=im.size
  im.thumbnail((e.get('maxEdge',768),e.get('maxEdge',768)),Image.Resampling.LANCZOS)
  dest=ROOT/rel
  if e.get('deliveryPath'):
   delivery=Path(e['deliveryPath']);candidate=Image.open(delivery).convert('RGBA')
   assert candidate.size==im.size and candidate.getchannel('A').tobytes()==im.getchannel('A').tobytes(),'Reviewed delivery must preserve downscaled generated alpha'
   assert Image.open(delivery).format==('WEBP' if dest.suffix=='.webp' else 'PNG'),'Keep the existing asset format'
   shutil.copyfile(delivery,dest)
  elif dest.suffix=='.webp':im.save(dest,format='WEBP',quality=e.get('quality',92),method=6,exact=True)
  elif dest.suffix=='.png':im.save(dest,format='PNG')
  else:raise ValueError(rel)
  reread=Image.open(dest).convert('RGBA');assert reread.size==im.size and reread.getchannel('A').tobytes()==im.getchannel('A').tobytes(),'Delivery encoding must preserve downscaled alpha exactly'
  box=reread.getchannel('A').point(lambda x:255 if x>16 else 0).getbbox();assert box is not None
  bounds[rel.split('assets/vehicles/')[1]]={'box':list(box),'width':im.width,'height':im.height,'clean':True}
  reviews[rel].update(action='RESTORED_AND_VISUALLY_REVIEWED',finding=e.get('finding','Baked background removed; original color, silhouette and equipment preserved in three-background comparison. No visible new clipping, white halo or interior deletion at game scale.'),restorationMethod='Imagegen background-extraction; proportional generated-output web delivery; exact alpha',reviewedOn=['white','dark','checkerboard'],comparison='comparisons/'+rel.split('/')[2]+'-'+Path(rel).stem+'.jpg',displayNormalized=True)
  delivery_format=('WebP quality '+str(e.get('quality',92))+' method 6, alpha channel lossless') if dest.suffix=='.webp' else 'PNG lossless RGBA'
  indexed[rel]={'file':rel,'inputSha256':sha(original),'generatedSourceName':source.name,'generatedSha256':sha(source.read_bytes()),'outputSha256':sha(dest.read_bytes()),'generatedWidth':generated_size[0],'generatedHeight':generated_size[1],'deliveryWidth':im.width,'deliveryHeight':im.height,'formatConversion':'Generated PNG proportionally downscaled to max edge '+str(e.get('maxEdge',768))+'; '+delivery_format,'visualReview':'Original identity/color/equipment and alpha edges checked on three backgrounds; not a claim of pixel-identical original vehicle interior.','prompt':e.get('prompt',TEMPLATE)}
 prov['entries']=list(indexed.values())
 (ROOT/'assets/vehicles/display_bounds.json').write_text(json.dumps(bounds,ensure_ascii=False,indent=2)+'\n')
 p=ROOT/'js/vehicle-display.js';s=p.read_text();s=re.sub(r'const bounds = .*;\n',lambda _: 'const bounds = '+json.dumps(bounds,ensure_ascii=False,separators=(',',':'))+';\n',s,count=1);p.write_text(s)
 (OUT/'vehicle-visual-review.json').write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
 provenance_path.write_text(json.dumps(prov,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'imported':len(entries),'totalReviewed':len(prov['entries']),'files':[x['file'] for x in entries]}))
if __name__=='__main__':main()
