#!/usr/bin/env python3
"""Apply an explicit review ledger, never approve model output automatically.
Only named asset paths already present in the 138-file inventory are writable.
Source bytes, artifact bytes, candidate bytes and reviewed decoded RGBA are bound.
"""
import hashlib, io, json, os, pathlib, re, subprocess, zipfile
import numpy as np
import requests
from PIL import Image

ROOT=pathlib.Path(__file__).resolve().parents[1]
QA=ROOT/'docs/qa/sihyeon-phase2'
ledger=json.loads((QA/'vehicle-matte-approved.json').read_text())
known={e['file'] for e in json.loads((QA/'vehicle-inventory.json').read_text())['entries']}
reviews=json.loads((QA/'vehicle-visual-review.json').read_text())
bounds=json.loads((ROOT/'assets/vehicles/display_bounds.json').read_text())
provenance_path=QA/'vehicle-matte-provenance.json'
provenance=json.loads(provenance_path.read_text()) if provenance_path.exists() else {'method':'Original RGB preserved; reviewed alpha masks and explicit source-pixel restorations only','model':'BiRefNet-general-lite','modelSha256':'5600024376f572a557870a5eb0afb1e5961636bef4e1e22132025467d0f03333','reviewsAreIndependentAgents':False,'entries':[]}
prior={e['source']:e for e in provenance['entries']}
archives={}; changed=[]
def sha(data):return hashlib.sha256(data).hexdigest()
for entry in ledger['entries']:
    path=entry['source'];assert path in known and path.startswith('assets/vehicles/')
    assert entry['review']=='APPROVED_AFTER_INDIVIDUAL_THREE_BACKGROUND_COMPARISON'
    target=ROOT/path
    current=target.read_bytes()
    if path in prior and sha(current)==prior[path]['outputSha256']:
        assert prior[path]['reviewedRgbaSha256']==entry['reviewedRgbaSha256'],'review changed after application'
        continue
    assert sha(current)==entry['sourceSha256'], 'source changed since visual review: '+path
    artifact=entry['artifactId']
    if artifact not in archives:
        response=requests.get(f'https://api.github.com/repos/icefoxtail/my-life-os/actions/artifacts/{artifact}/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'},timeout=120)
        response.raise_for_status()
        assert sha(response.content)==entry['artifactSha256'],'artifact digest changed'
        archives[artifact]=zipfile.ZipFile(io.BytesIO(response.content))
    data=archives[artifact].read(entry['candidate'])
    assert sha(data)==entry['candidateSha256'],'candidate bytes changed'
    original=np.array(Image.open(io.BytesIO(current)).convert('RGBA'))
    pixels=np.array(Image.open(io.BytesIO(data)).convert('RGBA'))
    assert pixels.shape==original.shape and list(pixels.shape[1::-1])==entry['size']
    assert np.array_equal(pixels[:,:,:3],original[:,:,:3]),'candidate synthesized RGB'
    for repair in entry.get('alphaRepairs',[]):
        x0,y0,x1,y1=repair['box']; assert 0<=x0<x1<=pixels.shape[1] and 0<=y0<y1<=pixels.shape[0]
        region=np.zeros(pixels.shape[:2],bool);region[y0:y1,x0:x1]=True
        if repair['op']=='restore_green_source':
            rgb=original[:,:,:3].astype(int)
            select=region&(rgb[:,:,1]-rgb[:,:,0]>=repair['greenMinusRedMin'])&(rgb[:,:,1]-rgb[:,:,2]>=repair['greenMinusBlueMin'])
            pixels[:,:,3][select]=original[:,:,3][select]
        elif repair['op']=='restore_source': pixels[:,:,3][region]=original[:,:,3][region]
        elif repair['op']=='clear_alpha': pixels[:,:,3][region]=0
        else: raise ValueError('unrecognized explicit repair')
    assert sha(pixels.tobytes())==entry['reviewedRgbaSha256'],'pixels differ from reviewed final candidate'
    image=Image.fromarray(pixels)
    if target.suffix=='.webp': image.save(target,format='WEBP',lossless=True,exact=True,method=6)
    elif target.suffix=='.png': image.save(target,format='PNG')
    else: raise ValueError('unsupported asset extension')
    assert sha(Image.open(target).convert('RGBA').tobytes())==entry['reviewedRgbaSha256'],'delivery encoding changed RGBA'
    box=image.getchannel('A').point(lambda x:255 if x>16 else 0).getbbox();assert box
    key=path.removeprefix('assets/vehicles/')
    bounds[key]={'box':list(box),'width':image.width,'height':image.height,'clean':True}
    reviews[path].update({'action':'RESTORED_REVIEWED','finding':entry['notes'],'background':'transparent, original RGB retained','visualReviewed':True,'visualEvidence':'comparisons/'+path.split('/')[-2]+'-'+target.stem+'.jpg','reviewMethod':'Coordinator three-background comparison, explicit pixel repair and delivery-RGBA equality; not a new independent agent'})
    record={**entry,'outputSha256':sha(target.read_bytes()),'outputBytes':target.stat().st_size,'outputRgbaSha256':sha(Image.open(target).convert('RGBA').tobytes()),'displayBounds':bounds[key]}
    prior[path]=record;changed.append(path)
(QA/'vehicle-visual-review.json').write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
(ROOT/'assets/vehicles/display_bounds.json').write_text(json.dumps(bounds,ensure_ascii=False,indent=2)+'\n')
js=ROOT/'js/vehicle-display.js';text=js.read_text();text,n=re.subn(r'^const bounds = .*?;$','const bounds = '+json.dumps(bounds,separators=(',',':'))+';',text,count=1,flags=re.M);assert n==1;js.write_text(text)
provenance['entries']=list(prior.values());provenance_path.write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
subprocess.run(['python3','scripts/vehicle-phase2-audit.py','--contact'],cwd=ROOT,check=True)
subprocess.run(['node','scripts/test-vehicle-display.cjs'],cwd=ROOT,check=True)
subprocess.run(['node','scripts/test-legacy-inputs.cjs'],cwd=ROOT,check=True)
subprocess.run(['node','scripts/qa-static.cjs'],cwd=ROOT,check=True)
print(json.dumps({'applied':changed,'approvedTotal':len(prior)},ensure_ascii=False))
