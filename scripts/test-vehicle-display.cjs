/* Contract/geometric checks for SVG alpha-bound fitting; not a screenshot test. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../js/vehicle-display.js'),'utf8');
const bounds=JSON.parse(source.match(/const bounds = (.*);\n/)[1]);
class Element {
  constructor(tag){this.tagName=tag;this.attributes={};this.children=[];this.style={cssText:''};this.alt='';}
  setAttribute(name,value){this.attributes[name]=value;}
  getAttribute(name){return this.attributes[name]??null;}
  appendChild(child){child.remove();this.children.push(child);child.parentElement=this;}
  before(child){const parent=this.parentElement,index=parent.children.indexOf(this);child.remove();parent.children.splice(index,0,child);child.parentElement=parent;}
  remove(){if(this.parentElement){const p=this.parentElement;p.children.splice(p.children.indexOf(this),1);this.parentElement=null;}}
}
const window={};
vm.runInNewContext(source,{window,document:{createElementNS:(namespace,tag)=>new Element(tag)}});
const api=window.SihyeonVehicleDisplay;
const clean=Object.entries(bounds).filter(([,value])=>value.clean);
assert.equal(clean.length,39,'the reviewed clean asset pool must remain unchanged');
let scenarios=0;
for(const [name,b] of clean){
  const parent=new Element('button'),image=new Element('img');
  image.setAttribute('src','./assets/vehicles/'+name);parent.appendChild(image);
  const frame=api.apply(image);
  assert.equal(frame.tagName,'svg');
  assert.equal(frame.getAttribute('preserveAspectRatio'),'xMidYMid meet');
  const [x,y,w,h]=frame.getAttribute('viewBox').split(' ').map(Number);
  assert.ok(w>0&&h>0&&x>=0&&y>=0&&x+w<=b.width&&y+h<=b.height);
  assert.equal(image.parentElement.getAttribute('width'),String(b.width));
  assert.equal(image.parentElement.getAttribute('height'),String(b.height));
  for(const [cellWidth,cellHeight] of [[320,260],[180,140],[110,86],[75,50],[60,120],[280,72]]){
    // SVG meet uses one uniform scale and centers any remaining viewport space.
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
assert.equal(first.getAttribute('viewBox'),'310 131 362 716');
image.setAttribute('src','./assets/vehicles/transport/car.png');
const replacement=api.apply(image);
assert.equal(replacement,first,'fallback reuses one frame instead of nesting wrappers');
assert.equal(parent.children.length,1);
assert.equal(replacement.getAttribute('viewBox'),'194 356 732 342','fallback uses car bounds, never rocket bounds');
api.reset(image);assert.equal(parent.children[0],image);assert.equal(parent.children.length,1);
assert.equal(image.style.cssText,'color:red;','cleanup restores the original image style');
image.setAttribute('src','./assets/vehicles/transport/car.png?v=2');
assert.equal(api.isClean(image.getAttribute('src')),true,'cache-busting source retains its metadata');
api.apply(image);image.setAttribute('src','./unknown.png');assert.equal(api.apply(image),null);
assert.equal(parent.children[0],image,'unknown replacements return to ordinary contain layout');
console.log(`PASS ${scenarios} uniform-scale layouts for all ${clean.length} clean assets; tall rocket, replacement bounds, idempotent apply and cleanup.`);
