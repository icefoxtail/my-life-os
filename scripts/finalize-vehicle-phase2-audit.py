#!/usr/bin/env python3
"""Finalize inspected dispositions, never edit product image bytes or infer visual PASS."""
import csv,hashlib,json,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1];QA=ROOT/'docs/qa/sihyeon-phase2'
path=QA/'vehicle-visual-review.json';reviews=json.loads(path.read_text())
extra={
 'assets/vehicles/construction/pile_driver.webp':('HOLD_SOURCE_PIXELS_MISSING','Top of pile-driving mast is cut at the original top frame boundary; uncropped source is required.'),
 'assets/vehicles/construction/drilling_rig.webp':('HOLD_SOURCE_PIXELS_MISSING','Upper drilling mast and head are clipped at the original top frame boundary; do not invent missing machinery.'),
 'assets/vehicles/airport/passenger_airplane.webp':('HOLD_SOURCE_PIXELS_MISSING','Right wing/tail region extends through the original right frame edge; full aircraft silhouette cannot be certified.'),
 'assets/vehicles/port/cargo_ship.webp':('HOLD_SOURCE_PIXELS_MISSING','Original bow and anchor-side hull are clipped at the left frame; candidate cannot restore absent pixels.'),
 'assets/vehicles/road_service/road_sign_truck.webp':('HOLD_CANDIDATE_REJECTED','Enlarged candidate retains white/checker patches in open frame below signs. Precise hole cleanup is unresolved; original preserved.'),
 'assets/vehicles/port/harbor_crane.webp':('HOLD_CANDIDATE_REJECTED','Enlarged mask fills upper rail gaps and removes fine rail segments. Failed candidate is excluded, original preserved.'),
 'assets/vehicles/port/ferry.webp':('HOLD_CANDIDATE_REJECTED','White mast/upper-rail gaps retain opaque patches and fine antenna fidelity is insufficient. Candidate excluded, original preserved.'),
 'assets/vehicles/transport/helicopter.png':('HOLD_SOURCE_ALPHA_DAMAGE','Original cabin/window seam contains transparency holes with lost RGB. Fragment removal alone is not a full repair; original preserved.')
}
for file,(action,reason) in extra.items():
 reviews[file].update(initialClassification=reviews[file].get('initialClassification',reviews[file]['classification']),classification='4_PRECISE_REVIEW',action=action,holdReason=reason,finding=reason,visualReviewed=True,reviewMethod='Coordinator enlarged original/candidate inspection; no new independent agent')
for file,review in reviews.items():
 if review['action']=='RESTORED_AND_VISUALLY_REVIEWED':
  review.pop('holdReason',None)
 elif file not in extra and not review['action'].startswith('HOLD_'):
  assert file.endswith('.png') and review['classification']=='2_DISPLAY_ONLY','Unprocessed asset must not be silently marked preserved: '+file
  review['action']='ORIGINAL_PRESERVED_DISPLAY_NORMALIZED'
path.write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
subprocess.run(['python3','scripts/vehicle-phase2-audit.py','--contact'],cwd=ROOT,check=True)
inv=json.loads((QA/'vehicle-inventory.json').read_text());rows=[];counts={'restored':0,'preservedDisplayOnly':0,'hold':0}
for e in inv['entries']:
 action=e['action'];kind='restored' if action=='RESTORED_AND_VISUALLY_REVIEWED' else 'hold' if action.startswith('HOLD_') else 'preservedDisplayOnly'
 counts[kind]+=1
 assert e['before']['sourceAspectRatio']==e['after']['sourceAspectRatio'],'aspect changed'
 if kind!='restored':assert e['before']['sha256']==e['after']['sha256'],'preserved/held original changed'
 if kind=='restored':assert e['originalChanged'],'claimed restoration has no changed bytes'
 rows.append({'id':e['id'],'file':e['file'],'disposition':kind,'action':action,'beforeSha256':e['before']['sha256'],'afterSha256':e['after']['sha256'],'reason':reviews[e['file']].get('holdReason','')})
assert len(rows)==138 and counts=={'restored':77,'preservedDisplayOnly':36,'hold':25},counts
with (QA/'vehicle-final-dispositions.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
summary={'denominator':138,'sharedManifest':129,'separateFireSpecial':9,'counts':counts,'newlyRestoredThisResume':49,'previouslyRestored':28,'holdsAreNotQualityPass':True,'independentSubagentsThisResume':False,'browserRegression':'PENDING_SEPARATE_EVIDENCE','physicalDevices':'NOT_RUN','entries':rows}
(QA/'vehicle-final-dispositions.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
for test in ['test-vehicle-display.cjs','test-legacy-inputs.cjs','qa-static.cjs']:
 subprocess.run(['node','scripts/'+test],cwd=ROOT,check=True)
print(json.dumps(counts))
