/* Contract/geometric checks for SVG alpha-bound fitting; not a screenshot test. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const source=fs.readFileSync(path.resolve(__dirname,'../js/vehicle-display.js'),'utf8');
const bounds=JSON.parse(source.match(/const bounds = (.*);\n/)[1]);
class Element {
  constructor(tag){this.tagName=tag;this.attributes={};this.children=[];this.style={cssText:''};this.alt='';this.listeners=[];}
  setAttribute(name,value){this.attributes[name]=value;}
  getAttribute(name){return this.attributes[name]??null;}
  appendChild(child){child.remove();this.children.push(child);child.parentElement=this;}
  before(child){const parent=this.parentElement,index=parent.children.indexOf(this);child.remove();parent.children.splice(index,0,child);child.parentElement=parent;}
  remove(){if(this.parentElement){const p=this.parentElement;p.children.splice(p.children.indexOf(this),1);this.parentElement=null;}}
  addEventListener(type,fn,capture){this.listeners.push({type,fn,capture});}
  removeEventListener(type,fn,capture){this.listeners=this.listeners.filter(l=>!(l.type===type&&l.fn===fn&&l.capture===capture));}
  error(){this.listeners.filter(l=>l.type==='error').sort((a,b)=>Number(!!b.capture)-Number(!!a.capture)).forEach(l=>l.fn());}
}
const window={};
vm.runInNewContext(source,{window,document:{createElementNS:(namespace,tag)=>new Element(tag)}});
const api=window.SihyeonVehicleDisplay;
const clean=Object.entries(bounds).filter(([,value])=>value.clean);
const inventory=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../docs/qa/sihyeon-phase2/vehicle-inventory.json'),'utf8'));
const original39=inventory.entries.filter(e=>e.file.endsWith('.png'));
assert.equal(original39.length,39,'all 39 original transparent assets remain represented');
for(const entry of original39){
  const name=entry.file.split('assets/vehicles/')[1];
  const sha=crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'..',entry.file))).digest('hex');
  const repaired=entry.action==='RESTORED_AND_VISUALLY_REVIEWED';
  assert.equal(sha,repaired?entry.after.sha256:entry.before.sha256,'original unchanged or independently recorded repair: '+name);
  assert.equal(bounds[name].clean,true,'original clean pool preserved: '+name);
  assert.deepEqual(bounds[name].box,repaired?entry.after.alphaBounds16:entry.before.displayBounds.box,'measured visible bounds: '+name);
  assert.equal(bounds[name].width,repaired?entry.after.width:entry.before.width);
  assert.equal(bounds[name].height,repaired?entry.after.height:entry.before.height);
}
const restored=inventory.entries.filter(e=>e.action==='RESTORED_AND_VISUALLY_REVIEWED');
assert.equal(clean.length,39+restored.filter(e=>!e.file.endsWith('.png')).length,'only explicitly reviewed restorations may join the clean pool');
for(const entry of restored){
  const name=entry.file.split('assets/vehicles/')[1];
  assert.equal(bounds[name].clean,true,'restored vehicle joins common display pool: '+name);
  assert.deepEqual(bounds[name].box,entry.after.alphaBounds16,'restored visible bounds match decoded alpha: '+name);
  const sha=crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'..',entry.file))).digest('hex');
  assert.equal(sha,entry.after.sha256,'reviewed bytes still match: '+name);
}
assert.ok(clean.length>=39,'no clean original is silently removed');
let scenarios=0;
for(const [name,b] of clean){
  const parent=new Element('button'),image=new Element('img');
  image.setAttribute('src','./assets/vehicles/'+name);parent.appendChild(image);
  const frame=api.apply(image);
  assert.equal(frame.tagName,'svg');
  assert.equal(frame.getAttribute('preserveAspectRatio'),'xMidYMax meet');
  const [x,y,w,h]=frame.getAttribute('viewBox').split(' ').map(Number);
  assert.ok(w>0&&h>0&&x<b.box[0]&&y<b.box[1]&&x+w>b.box[2]&&y+h>b.box[3],'transparent safety margin encloses all visible edges');
  const geometry=api.geometry('./assets/vehicles/'+name);
  assert.equal(geometry.groundY,b.box[3]);
  assert.deepEqual(Array.from(geometry.center),[(b.box[0]+b.box[2])/2,(b.box[1]+b.box[3])/2]);
  assert.equal(image.parentElement.getAttribute('width'),String(b.width));
  assert.equal(image.parentElement.getAttribute('height'),String(b.height));
  for(const [cellWidth,cellHeight] of [[320,260],[180,140],[110,86],[75,50],[60,120],[280,72]]){
    // SVG meet uses one uniform scale, centers horizontally and aligns the base.
    const viewportWidth=cellWidth*.9,viewportHeight=cellHeight*.88;
    const scale=Math.min(viewportWidth/w,viewportHeight/h);
    const renderedWidth=w*scale,renderedHeight=h*scale;
    assert.ok(renderedWidth<=viewportWidth+1e-8&&renderedHeight<=viewportHeight+1e-8);
    assert.ok(Math.abs(renderedWidth/renderedHeight-w/h)<1e-10,'visible proportions must stay constant');
    assert.ok((viewportWidth-renderedWidth)/2>=-1e-8&&(viewportHeight-renderedHeight)/2>=-1e-8);
    scenarios++;
  }
}

const parent=new Element('button'),image=new Element('img');
image.style.cssText='color:red;';parent.appendChild(image);
image.setAttribute('src','./assets/vehicles/transport/rocket.png');
const first=api.apply(image);
assert.equal(first.getAttribute('viewBox'),api.geometry('./assets/vehicles/transport/rocket.png').viewBox.join(' '));
image.setAttribute('src','./assets/vehicles/transport/car.png');
const replacement=api.apply(image);
assert.equal(replacement,first,'fallback reuses one frame instead of nesting wrappers');
assert.equal(parent.children.length,1);
assert.equal(replacement.getAttribute('viewBox'),api.geometry('./assets/vehicles/transport/car.png').viewBox.join(' '),'fallback uses car bounds, never rocket bounds');
api.reset(image);assert.equal(parent.children[0],image);assert.equal(parent.children.length,1);
assert.equal(image.style.cssText,'color:red;','cleanup restores the original image style');
image.setAttribute('src','./assets/vehicles/transport/car.png?v=2');
assert.equal(api.isClean(image.getAttribute('src')),true,'cache-busting source retains its metadata');
api.apply(image);image.setAttribute('src','./unknown.png');assert.equal(api.apply(image),null);
assert.equal(parent.children[0],image,'unknown replacements return to ordinary contain layout');
image.setAttribute('src','./assets/vehicles/transport/car.png');
api.apply(image);
let fallbackRestored=false;
image.addEventListener('error',()=>{fallbackRestored=image.parentElement===parent;},false);
image.error();
assert.equal(fallbackRestored,true,'error capture restores original sibling DOM before game fallback');
assert.equal(parent.children[0],image);
assert.equal(api.apply(null),null);
console.log(`PASS ${scenarios} uniform-scale layouts for all ${clean.length} clean assets; transparent safety margin, floor alignment, tall rocket, replacement bounds, error fallback, idempotent apply and cleanup.`);
