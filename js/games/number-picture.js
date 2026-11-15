/* Pick a picture and a number. The whole set appears, then counts itself. */
(function () {
  'use strict';
  const KEY='numberPicture', SAVE_KEY='sihyeon-number-picture-v1';
  const view={container:null,options:{},objects:[],objectId:'korean_police_car',custom:null,n:9,style:'native',layout:'rows',range:0,category:'vehicle',muted:false,counted:0,complete:false,sequence:null,handlers:null,audioFailed:false};
  let memory=null;
  const M=()=>window.SihyeonQuantityPlayModel;
  const C=()=>window.SihyeonPlayObjects;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function language(){return window.SihyeonPlaySettings?.getLanguage?.()==='en'?'en':'ko';}
  function age(){return window.SihyeonPlaySettings?.getAge?.()||view.options.ageMode||4;}
  function object(){return view.custom && view.custom.id===view.objectId?view.custom:view.objects.find(o=>o.id===view.objectId)||view.objects[0];}
  function save(){
    memory={version:1,objectId:view.objectId,n:view.n,style:view.style,layout:view.layout,muted:view.muted,category:view.category};
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(memory));}catch(_){}
  }
  function load(){
    let saved=memory;
    if(!saved){try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(_){}}
    if(!saved||saved.version!==1)return;
    if(M().isQuantity(saved.n))view.n=saved.n;
    if(view.objects.some(o=>o.id===saved.objectId))view.objectId=saved.objectId;
    if(['native','sino'].includes(saved.style))view.style=saved.style;
    if(['rows','tens','scatter'].includes(saved.layout))view.layout=saved.layout;
    view.muted=saved.muted===true;
    view.category=object().category||'vehicle';
  }
  function totalText(){
    const item=object();
    if(view.n===0)return item.nameKo+'가 없어요';
    return item.nameKo+' '+M().quantityText(view.n,item.unitKo,'ko');
  }
  function summaryStep(){
    const item=object();
    return {id:'total',kind:'total',text:view.n===0?item.nameKo+'가 없어요. 영이에요.':'모두 '+totalText()+'!',enText:view.n===0?'There are none. Zero.':'There are '+M().countWord(view.n,'sino','en')+' '+(view.n===1?item.nameEn:(item.pluralEn||'in all'))+'.'};
  }
  function updateProgress(step){
    if(!view.container)return;
    const root=view.container.querySelector('.qp-root');
    root.querySelectorAll('.qp-item.is-current').forEach(el=>el.classList.remove('is-current'));
    if(step.kind==='count'){
      view.counted=step.ordinal;
      const el=root.querySelector('[data-object-index="'+(step.ordinal-1)+'"]');
      el?.classList.add('is-current','is-counted');
      const board=root.querySelector('.qp-board');
      if(el && board){const a=el.getBoundingClientRect(),b=board.getBoundingClientRect();if(a.bottom>b.bottom||a.top<b.top)el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});}
    }
    root.querySelector('.qp-count-now').textContent=step.kind==='total'?String(view.n):String(view.counted);
    root.querySelector('.qp-count-word').textContent=step.kind==='total'?(view.n===0?'없어요':totalText()):M().countWord(view.counted,view.style,language());
    root.querySelector('.qp-progress').textContent=step.kind==='total'?'모두 '+view.n+object().unitKo:'지금 '+view.counted+object().unitKo+' 셌어요';
  }
  function run(){
    if(!view.container||!view.sequence)return;
    view.counted=0;view.complete=false;view.audioFailed=false;
    const root=view.container.querySelector('.qp-root');
    root.classList.remove('qp-finished');
    root.querySelectorAll('.qp-item').forEach(el=>el.classList.remove('is-current','is-counted'));
    root.querySelector('.qp-sound-note').hidden=true;
    root.querySelector('.qp-count-now').textContent='0';
    root.querySelector('.qp-count-word').textContent=view.n===0?'없어요':'같이 세어요';
    root.querySelector('.qp-progress').textContent=view.n===0?'0'+object().unitKo:'그림이 '+view.n+object().unitKo+' 있어요';
    const steps=M().items(view.n,'count').map(item=>({id:item.id,kind:'count',ordinal:item.ordinal,nativeText:M().countWord(item.ordinal,'native','ko'),sinoText:M().countWord(item.ordinal,'sino','ko'),enText:M().countWord(item.ordinal,'sino','en'),readingStyle:view.style}));
    steps.push(summaryStep());
    view.sequence.start(steps,{muted:view.muted,delayMs:170,onStep:updateProgress,onError:()=>{
      if(!view.container)return;view.audioFailed=true;
      const note=view.container.querySelector('.qp-sound-note');if(note){note.hidden=false;note.textContent='그림과 숫자로 함께 세어요';}
    },onEnd:()=>{
      if(!view.container)return;view.counted=view.n;view.complete=true;
      const currentRoot=view.container.querySelector('.qp-root');currentRoot?.classList.add('qp-finished');
      currentRoot?.querySelectorAll('.qp-item.is-current').forEach(el=>el.classList.remove('is-current'));
    }});
  }
  function itemMarkup(index){return '<div class="qp-item" data-object-index="'+index+'">'+C().picture(object())+'<span class="qp-ordinal" aria-hidden="true">'+(index+1)+'</span></div>';}
  function boardMarkup(){
    if(!view.n)return '<div class="qp-zero"><strong>0</strong><span>하나도 없어요</span><span aria-hidden="true">🌿</span></div>';
    if(view.layout==='tens'){
      let html='';
      for(let start=0;start<view.n;start+=10){
        html+='<section class="qp-ten" aria-label="'+(Math.floor(start/10)+1)+'번째 열 칸">';
        for(let k=0;k<10;k++)html+=start+k<view.n?itemMarkup(start+k):'<div class="qp-empty" aria-hidden="true"></div>';
        html+='</section>';
      }
      return html;
    }
    return '<div class="qp-items '+(view.layout==='scatter'?'qp-scatter':'')+'">'+M().items(view.n).map(i=>itemMarkup(i.index)).join('')+'</div>';
  }
  function categories(){
    return [['vehicle','🚓','탈것'],['food','🍎','음식'],['toy','🧸','장난감'],['art','🎨','그림판']].filter(c=>view.objects.some(o=>o.category===c[0]));
  }
  function repaint(){
    if(!view.container)return;
    const item=object(),rangeStart=[0,11,21][view.range],rangeEnd=[10,20,30][view.range];
    const choices=view.objects.filter(o=>o.category===view.category);
    if(view.custom && !choices.some(o=>o.id===view.custom.id) && view.category==='art')choices.unshift(view.custom);
    const numbers=Array.from({length:rangeEnd-rangeStart+1},(_,i)=>i+rangeStart);
    view.container.innerHTML='<section class="qp-root" data-age="'+age()+'">'+
      '<header class="qp-top"><button type="button" data-qp-action="home" class="qp-icon qp-home" aria-label="숫자놀이터로">🏠</button><h2>내가 만드는<br><strong>숫자놀이</strong></h2><div class="qp-top-tools"><button type="button" data-qp-action="mute" class="qp-icon" aria-label="'+(view.muted?'소리 켜기':'소리 끄기')+'" aria-pressed="'+view.muted+'">'+(view.muted?'🔇':'🔊')+'</button><button type="button" data-qp-action="settings" class="qp-icon qp-age" aria-label="놀이 모드 설정"><strong>'+age()+'</strong><small>세 ⚙</small></button></div></header>'+
      '<main class="qp-stage"><div class="qp-summary">'+C().picture(item,'qp-summary-picture')+'<div><span class="qp-object-name">'+esc(item.nameKo)+'</span><strong class="qp-target">'+view.n+'<small>'+esc(item.unitKo)+'</small></strong></div><div class="qp-live"><strong class="qp-count-now">0</strong><span class="qp-count-word">같이 세어요</span></div></div>'+
      '<div class="qp-board" role="img" aria-label="'+esc(totalText())+'" data-layout="'+view.layout+'">'+boardMarkup()+'</div>'+
      '<div class="qp-stage-bottom"><span class="qp-progress" role="status" aria-live="polite">그림이 나타나요</span><button type="button" data-qp-action="minus" aria-label="한 개 덜" '+(view.n===0?'disabled':'')+'>−1</button><button type="button" data-qp-action="plus" aria-label="한 개 더" '+(view.n===30?'disabled':'')+'>+1</button></div></main>'+
      '<aside class="qp-picker" aria-label="그림과 숫자 고르기"><div class="qp-categories">'+categories().map(c=>'<button type="button" data-qp-action="category" data-value="'+c[0]+'" aria-pressed="'+(view.category===c[0])+'"><span>'+c[1]+'</span>'+c[2]+'</button>').join('')+'</div>'+
      '<div class="qp-objects" role="group" aria-label="그림 고르기">'+choices.map(o=>'<button type="button" class="qp-object-choice" data-qp-action="object" data-value="'+esc(o.id)+'" aria-label="'+esc(o.nameKo)+' 고르기" aria-pressed="'+(item.id===o.id)+'">'+C().picture(o)+'<span>'+esc(o.nameKo)+'</span></button>').join('')+'</div>'+
      '<div class="qp-ranges" role="group" aria-label="숫자 범위">'+['0–10','11–20','21–30'].map((r,i)=>'<button type="button" data-qp-action="range" data-value="'+i+'" aria-pressed="'+(view.range===i)+'">'+r+'</button>').join('')+'</div>'+
      '<div class="qp-numbers" role="group" aria-label="원하는 숫자">'+numbers.map(n=>'<button type="button" data-qp-action="number" data-value="'+n+'" aria-label="'+n+' 선택" aria-pressed="'+(view.n===n)+'">'+n+'</button>').join('')+'</div></aside>'+
      '<footer class="qp-footer"><div class="qp-readings" role="group" aria-label="수 읽는 방법"><button type="button" data-qp-action="style" data-value="native" aria-pressed="'+(view.style==='native')+'">하나·둘</button><button type="button" data-qp-action="style" data-value="sino" aria-pressed="'+(view.style==='sino')+'">일·이</button></div><button type="button" data-qp-action="layout" class="qp-layout" aria-label="배열 바꾸기">'+({rows:'▦ 줄 맞추기',tens:'▦ 열 칸 보기',scatter:'✦ 흩어 놓기'})[view.layout]+'</button><button type="button" data-qp-action="replay" class="qp-replay" aria-label="자동으로 다시 세기">↻ <span>다시 세기</span></button><p class="qp-sound-note" hidden></p></footer></section>';
    C().preparePictures(view.container);
    const currentRoot=view.container.querySelector('.qp-root');
    currentRoot.classList.toggle('qp-finished',view.complete);
    currentRoot.querySelector('.qp-count-now').textContent=String(view.counted);
    currentRoot.querySelector('.qp-count-word').textContent=view.complete?(view.n===0?'없어요':totalText()):(view.counted?M().countWord(view.counted,view.style,language()):'같이 세어요');
    currentRoot.querySelector('.qp-progress').textContent=view.complete?'모두 '+view.n+item.unitKo:'지금 '+view.counted+item.unitKo+' 셌어요';
    currentRoot.querySelectorAll('.qp-item').forEach((el,i)=>{el.classList.toggle('is-counted',i<view.counted);el.classList.toggle('is-current',!view.complete&&i===view.counted-1);});
  }
  function changeNumber(n){if(!M().isQuantity(n))return;view.n=n;view.range=n<=10?0:n<=20?1:2;save();repaint();run();}
  function onClick(event){
    const b=event.target.closest?.('[data-qp-action]');if(!b||!view.container?.contains(b)||b.disabled)return;
    const action=b.dataset.qpAction,value=b.dataset.value;
    if(action==='home'){destroy();view.options.closeToParkHome?.();return;}
    if(action==='settings'){view.sequence.stop();view.options.openSettings?.();return;}
    if(action==='number'){changeNumber(Number(value));return;}
    if(action==='minus'||action==='plus'){changeNumber(view.n+(action==='plus'?1:-1));return;}
    if(action==='category'){view.category=value;repaint();return;}
    if(action==='range'){view.range=Number(value);repaint();return;}
    if(action==='object'){
      if(!(view.custom?.id===value)&&!view.objects.some(o=>o.id===value))return;
      view.objectId=value;save();repaint();run();return;
    }
    if(action==='style'){view.style=value;save();repaint();run();return;}
    if(action==='layout'){const a=['rows','tens','scatter'];view.layout=a[(a.indexOf(view.layout)+1)%3];save();repaint();run();return;}
    if(action==='mute'){view.muted=!view.muted;save();repaint();run();return;}
    if(action==='replay')run();
  }
  function render(container,options){
    destroy();view.container=container;view.options=options||{};view.objects=C().list();
    view.objectId='korean_police_car';view.n=9;view.custom=null;view.category='vehicle';view.style='native';view.layout='rows';view.muted=false;load();
    if(C().isValid(view.options.initialObject)){
      view.custom=Object.assign({emoji:'🎨',category:'art'},view.options.initialObject);view.objectId=view.custom.id;view.category='art';
      if(!view.objects.some(o=>o.id===view.custom.id))view.objects.push(view.custom);
      else view.objects=view.objects.map(o=>o.id===view.custom.id?view.custom:o);
    }
    view.range=view.n<=10?0:view.n<=20?1:2;
    view.sequence=window.SihyeonQuantitySequencer.create();
    view.handlers={click:onClick,settings:()=>{if(view.container){repaint();run();}},visibility:()=>{if(document.hidden)view.sequence?.stop();else if(view.container)run();}};
    container.addEventListener('click',view.handlers.click);window.addEventListener('sihyeon-settings-change',view.handlers.settings);document.addEventListener('visibilitychange',view.handlers.visibility);
    repaint();run();
  }
  function destroy(){
    view.sequence?.stop();
    if(view.handlers){view.container?.removeEventListener('click',view.handlers.click);window.removeEventListener('sihyeon-settings-change',view.handlers.settings);document.removeEventListener('visibilitychange',view.handlers.visibility);}
    view.container=null;view.sequence=null;view.handlers=null;
  }
  function getSnapshot(){return {active:!!view.container,objectId:view.objectId,quantity:view.n,actualCount:view.container?.querySelectorAll('.qp-item').length||0,counted:view.counted,readingStyle:view.style,layout:view.layout,age:age(),language:language(),muted:view.muted,complete:view.complete,audioFailed:view.audioFailed,sequence:view.sequence?.getSnapshot()||null};}
  window.SihyeonGames=window.SihyeonGames||{};
  window.SihyeonGames[KEY]={id:KEY,title:'내가 만드는 숫자놀이',render:render,destroy:destroy,getSnapshot:getSnapshot};
})();
