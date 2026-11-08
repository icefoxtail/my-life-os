#!/usr/bin/env python3
"""Apply explicit visual approvals only. No automatic approval or synthesized RGB."""
import argparse,hashlib,io,json,os,pathlib,re,subprocess,zipfile
import numpy as np
import requests
from PIL import Image
parser=argparse.ArgumentParser();parser.add_argument('--batch',default='farm');args=parser.parse_args()
ROOT=pathlib.Path(__file__).resolve().parents[1];QA=ROOT/'docs/qa/sihyeon-phase2'
known={e['file'] for e in json.loads((QA/'vehicle-inventory.json').read_text())['entries']}
reviews=json.loads((QA/'vehicle-visual-review.json').read_text());bounds=json.loads((ROOT/'assets/vehicles/display_bounds.json').read_text())
pp=QA/'vehicle-matte-provenance.json'
provenance=json.loads(pp.read_text()) if pp.exists() else {'method':'Original RGB preserved; explicit visual approvals and source-alpha repairs only','model':'BiRefNet-general-lite','modelSha256':'5600024376f572a557870a5eb0afb1e5961636bef4e1e22132025467d0f03333','reviewsAreIndependentAgents':False,'entries':[]}
prior={e['source']:e for e in provenance['entries']};archives={};changed=[]
def sha(data):return hashlib.sha256(data).hexdigest()
def archive(aid,digest):
    if aid not in archives:
        response=requests.get(f'https://api.github.com/repos/icefoxtail/my-life-os/actions/artifacts/{aid}/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'},timeout=120)
        response.raise_for_status();assert sha(response.content)==digest,'artifact digest changed'
        archives[aid]=zipfile.ZipFile(io.BytesIO(response.content))
    return archives[aid]
entries=json.loads((QA/'vehicle-matte-approved.json').read_text())['entries'] if args.batch=='farm' else []
bp=QA/'vehicle-matte-approved-batches.json'
if bp.exists():
    for batch in json.loads(bp.read_text())['batches']:
        if batch['group']!=args.batch:continue
        z=archive(batch['artifactId'],batch['artifactSha256'])
        manifest={e['candidate']:e for e in json.loads(z.read('manifest.json'))['entries']}
        for candidate,approval in batch['approved'].items():
            # Only these manually named bytes are approved, not every output in the artifact.
            e=manifest[candidate];data=z.read(candidate);assert sha(data)==e['candidateSha256']
            rgba=Image.open(io.BytesIO(data)).convert('RGBA')
            expected=approval.get('reviewedRgbaSha256')
            assert expected or not approval.get('alphaRepairs'),'manual repairs require a separately reviewed final RGBA digest'
            entries.append({**e,'artifactId':batch['artifactId'],'artifactSha256':batch['artifactSha256'],'alphaRepairs':approval.get('alphaRepairs',[]),'reviewedRgbaSha256':expected or sha(rgba.tobytes()),'review':'APPROVED_AFTER_INDIVIDUAL_THREE_BACKGROUND_COMPARISON','notes':approval['notes'],'approvalBinding':'Explicit candidate name within immutable SHA-256-bound artifact; no inferred approval','batch':args.batch})
for entry in entries:
    path=entry['source'];assert path in known and path.startswith('assets/vehicles/')
    assert entry['review']=='APPROVED_AFTER_INDIVIDUAL_THREE_BACKGROUND_COMPARISON'
    target=ROOT/path;current=target.read_bytes()
    if path in prior and sha(current)==prior[path]['outputSha256']:
        assert prior[path]['reviewedRgbaSha256']==entry['reviewedRgbaSha256'],'review changed after application'
        continue
    assert sha(current)==entry['sourceSha256'],'source changed since visual review: '+path
    data=archive(entry['artifactId'],entry['artifactSha256']).read(entry['candidate'])
    assert sha(data)==entry['candidateSha256'],'candidate bytes changed'
    original=np.array(Image.open(io.BytesIO(current)).convert('RGBA'));pixels=np.array(Image.open(io.BytesIO(data)).convert('RGBA'))
    assert pixels.shape==original.shape and list(pixels.shape[1::-1])==entry['size']
    assert np.array_equal(pixels[:,:,:3],original[:,:,:3]),'candidate synthesized RGB'
    for repair in entry.get('alphaRepairs',[]):
        x0,y0,x1,y1=repair['box'];assert 0<=x0<x1<=pixels.shape[1] and 0<=y0<y1<=pixels.shape[0]
        region=np.zeros(pixels.shape[:2],bool);region[y0:y1,x0:x1]=True
        if repair['op']=='restore_green_source':
            rgb=original[:,:,:3].astype(int)
            select=region&(rgb[:,:,1]-rgb[:,:,0]>=repair['greenMinusRedMin'])&(rgb[:,:,1]-rgb[:,:,2]>=repair['greenMinusBlueMin'])
            pixels[:,:,3][select]=original[:,:,3][select]
        elif repair['op']=='restore_source':pixels[:,:,3][region]=original[:,:,3][region]
        elif repair['op']=='clear_alpha':pixels[:,:,3][region]=0
        else:raise ValueError('unrecognized explicit repair')
    assert sha(pixels.tobytes())==entry['reviewedRgbaSha256'],'pixels differ from reviewed final candidate'
    image=Image.fromarray(pixels)
    if target.suffix=='.webp':image.save(target,format='WEBP',lossless=True,exact=True,method=6)
    elif target.suffix=='.png':image.save(target,format='PNG')
    else:raise ValueError('unsupported asset extension')
    assert sha(Image.open(target).convert('RGBA').tobytes())==entry['reviewedRgbaSha256'],'delivery encoding changed RGBA'
    box=image.getchannel('A').point(lambda x:255 if x>16 else 0).getbbox();assert box
    key=path.removeprefix('assets/vehicles/');bounds[key]={'box':list(box),'width':image.width,'height':image.height,'clean':True}
    reviews[path].update({'action':'RESTORED_AND_VISUALLY_REVIEWED','finding':entry['notes'],'background':'transparent, original RGB retained','visualReviewed':True,'visualEvidence':'comparisons/'+path.split('/')[-2]+'-'+target.stem+'.jpg','reviewMethod':'Coordinator individual three-background review and decoded-RGBA readback; not an independent agent'})
    prior[path]={**entry,'outputSha256':sha(target.read_bytes()),'outputBytes':target.stat().st_size,'outputRgbaSha256':sha(Image.open(target).convert('RGBA').tobytes()),'displayBounds':bounds[key]};changed.append(path)
if changed:
    (QA/'vehicle-visual-review.json').write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'assets/vehicles/display_bounds.json').write_text(json.dumps(bounds,ensure_ascii=False,indent=2)+'\n')
    js=ROOT/'js/vehicle-display.js';text=js.read_text();text,n=re.subn(r'^const bounds = .*?;$','const bounds = '+json.dumps(bounds,separators=(',',':'))+';',text,count=1,flags=re.M);assert n==1;js.write_text(text)
    provenance['entries']=list(prior.values());pp.write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
    subprocess.run(['python3','scripts/vehicle-phase2-audit.py','--contact'],cwd=ROOT,check=True)
for command in ['test-vehicle-display.cjs','test-legacy-inputs.cjs','qa-static.cjs']:
    subprocess.run(['node','scripts/'+command],cwd=ROOT,check=True)
print(json.dumps({'batch':args.batch,'applied':changed,'approvedTotal':len(prior)},ensure_ascii=False))
