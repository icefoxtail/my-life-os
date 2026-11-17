/* Pick a picture and a number. The whole set appears, then counts itself. */
(function () {
  'use strict';
  const KEY='numberPicture', SAVE_KEY='sihyeon-number-picture-v1';
  const view={container:null,options:{},objects:[],objectId:'korean_police_car',custom:null,n:9,style:'native',layout:'rows',range:0,category:'vehicle',muted:false,counted:0,complete:false,sequence:null,handlers:null,audioFailed:false,picturePicker:false,settingsObserver:null,boardObserver:null,scrollFrame:0,userPaused:false,resumeAfterModal:false,renderObjectId:null,currentLanguage:'ko'};
  let memory=null;
  const M=()=>window.SihyeonQuantityPlayModel;
  const C=()=>window.SihyeonPlayObjects;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function language(){return window.SihyeonPlaySettings?.getLanguage?.()==='en'?'en':'ko';}
  function age(){return window.SihyeonPlaySettings?.getAge?.()||view.options.ageMode||4;}
  function subject(name){const c=name.charCodeAt(name.length-1);return name+(c>=0xac00&&c<=0xd7a3&&(c-0xac00)%28?'이':'가');}
  function object(){return view.custom && view.custom.id===view.objectId?view.custom:view.objects.find(o=>o.id===view.objectId)||view.objects[0];}
  function save(){
    const selected=object();
    memory={version:1,objectId:view.objectId,n:view.n,style:view.style,layout:view.layout,muted:view.muted,category:view.category,fromArtwork:selected.fromArtwork===true,artTemplateId:selected.artTemplateId||null};
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(memory));}catch(_){}
  }
  function load(){
    let saved=memory;
    if(!saved){try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(_){}}
    if(!saved||saved.version!==1)return;
    if(M().isQuantity(saved.n))view.n=saved.n;
    if(view.objects.some(o=>o.id===saved.objectId))view.objectId=saved.objectId;
    if(saved.fromArtwork===true&&typeof saved.artTemplateId==='string'){
      const painted=window.SihyeonArtPlayBridge?.getSavedPlayObject?.(saved.artTemplateId);
      if(C().isValid(painted)&&painted.id===saved.objectId){view.custom=painted;view.objects=view.objects.map(o=>o.id===painted.id?painted:o);}
    }
    if(['native','sino'].includes(saved.style))view.style=saved.style;
    if(['rows','tens','scatter'].includes(saved.layout))view.layout=saved.layout;
    view.muted=saved.muted===true;
    view.category=object().category||'vehicle';
  }
  function totalText(){
    const item=object();
    if(view.n===0)return subject(item.nameKo)+' 없어요';
    return item.nameKo+' '+M().quantityText(view.n,item.unitKo,'ko');
  }
  function completionText(){return view.n===0?'없어요':M().quantityText(view.n,object().unitKo,'ko');}
  function keepCountedVisible(){
    if(!view.container||view.picturePicker)return;
    const board=view.container.querySelector('.qp-board');
    if(!board)return;
    const ordinal=Math.min(view.n,view.complete?view.n:view.counted);
    if(!ordinal){board.scrollTop=0;return;}
    const item=board.querySelector('[data-object-index="'+(ordinal-1)+'"]');
    if(!item)return;
    const area=board.getBoundingClientRect(),box=item.getBoundingClientRect();
    const top=area.top+board.clientTop+4,bottom=area.top+board.clientTop+board.clientHeight-4;
    // Only move the board. scrollIntoView also moves overflow:hidden ancestors,
    // which can clip the stage/header or leave the last row outside the board.
    if(box.top<top)board.scrollTop+=box.top-top;
    else if(box.bottom>bottom)board.scrollTop+=box.bottom-bottom;
  }
  function scheduleBoardFocus(){
    if(view.scrollFrame)cancelAnimationFrame(view.scrollFrame);
    view.scrollFrame=requestAnimationFrame(()=>{view.scrollFrame=0;keepCountedVisible();});
  }
  function observeBoard(){
    view.boardObserver?.disconnect();view.boardObserver=null;
    const board=view.container?.querySelector('.qp-board');
    if(board&&typeof window.ResizeObserver==='function'){
      view.boardObserver=new window.ResizeObserver(scheduleBoardFocus);
      view.boardObserver.observe(board);
    }
    keepCountedVisible();scheduleBoardFocus();
  }
  function summaryStep(){
    const item=object();
    return {id:'total',kind:'total',text:view.n===0?subject(item.nameKo)+' 없어요. 영이에요.':'모두 '+totalText()+'!',enText:view.n===0?'There are none. Zero.':(view.n===1?'There is ':'There are ')+M().countWord(view.n,'sino','en')+' '+(view.n===1?item.nameEn:(item.pluralEn||'in all'))+'.'};
  }
  function updateProgress(step){
    if(!view.container)return;
    const root=view.container.querySelector('.qp-root');
    root.querySelectorAll('.qp-item.is-current').forEach(el=>el.classList.remove('is-current'));
    if(step.kind==='count'||step.kind==='change'){
      view.counted=step.ordinal;
      const el=root.querySelector('[data-object-index="'+(step.ordinal-1)+'"]');
      el?.classList.add('is-current','is-counted');
    }
    root.querySelector('.qp-count-now').textContent=step.kind==='total'?String(view.n):String(view.counted);
    root.querySelector('.qp-count-word').textContent=step.kind==='change'?(language()==='en'?step.enText:step.text):step.kind==='total'?completionText():M().countWord(view.counted,view.style,language());
    root.querySelector('.qp-progress').textContent=step.kind==='change'?(step.delta>0?'한 개 더!':'한 개 덜!'):step.kind==='total'?'모두 '+view.n+object().unitKo:'지금 '+view.counted+object().unitKo+' 셌어요';
    keepCountedVisible();scheduleBoardFocus();
  }
  function run(firstOrdinal){
    if(!view.container||!view.sequence)return;
    firstOrdinal=Number.isInteger(firstOrdinal)?Math.max(1,Math.min(view.n+1,firstOrdinal)):1;
    view.counted=firstOrdinal-1;view.complete=false;view.audioFailed=false;
    const root=view.container.querySelector('.qp-root');
    root.classList.remove('qp-finished');
    root.querySelectorAll('.qp-item').forEach((el,i)=>{el.classList.remove('is-current');el.classList.toggle('is-counted',i<view.counted);});
    root.querySelector('.qp-sound-note').hidden=true;
    root.querySelector('.qp-count-now').textContent=String(view.counted);
    root.querySelector('.qp-count-word').textContent=view.n===0?'없어요':'같이 세어요';
    root.querySelector('.qp-progress').textContent=view.n===0?'0'+object().unitKo:'그림이 '+view.n+object().unitKo+' 있어요';
    const steps=M().items(view.n,'count').filter(item=>item.ordinal>=firstOrdinal).map(item=>({id:item.id,kind:'count',ordinal:item.ordinal,nativeText:M().countWord(item.ordinal,'native','ko'),sinoText:M().countWord(item.ordinal,'sino','ko'),enText:M().countWord(item.ordinal,'sino','en'),readingStyle:view.style}));
    steps.push(summaryStep());
    view.sequence.start(steps,{muted:view.muted,paused:view.userPaused||view.picturePicker||!!document.getElementById('playSettingsDialog'),delayMs:170,onState:updatePlayback,onStep:updateProgress,onError:()=>{
      if(!view.container)return;view.audioFailed=true;
      const note=view.container.querySelector('.qp-sound-note');if(note){note.hidden=false;note.textContent='그림과 숫자로 함께 세어요';}
    },onEnd:()=>{
      if(!view.container)return;view.counted=view.n;view.complete=true;
      const currentRoot=view.container.querySelector('.qp-root');currentRoot?.classList.add('qp-finished');
      currentRoot?.querySelectorAll('.qp-item.is-current').forEach(el=>el.classList.remove('is-current'));
      keepCountedVisible();scheduleBoardFocus();updatePlayback();
    }});
    if(view.userPaused)view.sequence.pause();
    updatePlayback();
  }
  function updatePlayback(){
    const b=view.container?.querySelector('[data-qp-action="pause"]');
    if(!b)return;
    const paused=view.sequence?.isPaused?.()||view.userPaused;
    b.innerHTML=(paused?'▶':'⏸')+'<span>'+(paused?'이어서':'잠깐')+'</span>';
    b.setAttribute('aria-label',paused?'이어서 세기':'잠깐 멈추기');
    b.setAttribute('aria-pressed',String(paused));
    b.disabled=view.complete&&!view.sequence?.isRunning?.()&&!view.sequence?.isPaused?.();
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
    const small=view.n<=10;
    return '<div class="qp-items '+(small?'qp-small ':'')+(view.layout==='scatter'?'qp-scatter':'')+'"'+(small?' style="--qp-small-rows:'+Math.ceil(view.n/3)+'"':'')+'>'+M().items(view.n).map(i=>itemMarkup(i.index)).join('')+'</div>';
  }
  function categories(){
    return [['vehicle','🚓','탈것'],['food','🍎','음식'],['toy','🧸','장난감'],['art','🎨','그림판']].filter(c=>view.objects.some(o=>o.category===c[0]));
  }
  function choice(o){return '<button type="button" class="qp-object-choice" data-qp-action="object" data-value="'+esc(o.id)+'" aria-label="'+esc(o.nameKo)+' 고르기" aria-pressed="'+(object().id===o.id)+'">'+C().picture(o)+'<span>'+esc(o.nameKo)+'</span></button>';}
  function pictureDialog(){
    if(!view.picturePicker)return '';
    return '<div class="qp-picture-modal" role="dialog" aria-modal="true" aria-labelledby="qpPictureTitle"><header><h3 id="qpPictureTitle">어떤 그림으로 놀까?</h3><button type="button" data-qp-action="closePictures" aria-label="그림 고르기 닫기">✕</button></header><div class="qp-dialog-objects">'+view.objects.map(choice).join('')+'</div></div>';
  }
  function repaint(){
    if(!view.container)return;
    const previous=view.container.querySelector('.qp-board');
    const preserved=view.renderObjectId===view.objectId?new Map([...view.container.querySelectorAll('.qp-item')].map(el=>[el.dataset.objectIndex,el])):new Map();
    const oldScroll=previous?.scrollTop||0;
    const oldRects=new Map([...preserved].map(([id,el])=>[id,el.getBoundingClientRect()]));
    const item=object(),rangeStart=[0,11,21][view.range],rangeEnd=[10,20,30][view.range];
    const choices=view.objects.filter(o=>o.category===view.category);
    if(view.custom && !choices.some(o=>o.id===view.custom.id) && view.category==='art')choices.unshift(view.custom);
    const numbers=Array.from({length:rangeEnd-rangeStart+1},(_,i)=>i+rangeStart);
    view.container.innerHTML='<section class="qp-root" data-age="'+age()+'">'+
      '<header class="qp-top"><button type="button" data-qp-action="home" class="qp-icon qp-home" aria-label="숫자놀이터로">🏠</button><h2>내가 만드는<br><strong>숫자놀이</strong></h2><div class="qp-top-tools"><button type="button" data-qp-action="mute" class="qp-icon" aria-label="'+(view.muted?'소리 켜기':'소리 끄기')+'" aria-pressed="'+view.muted+'">'+(view.muted?'🔇':'🔊')+'</button><button type="button" data-qp-action="settings" class="qp-icon qp-age" aria-label="놀이 모드 설정"><strong>'+age()+'</strong><small>세 ⚙</small></button></div></header>'+
      '<main class="qp-stage"><div class="qp-summary"><button type="button" class="qp-object-launch" data-qp-action="choosePicture" aria-label="다른 그림 고르기">'+C().picture(item,'qp-summary-picture')+'<span>그림 고르기 ▾</span></button><div class="qp-target-summary"><span class="qp-object-name">'+esc(item.nameKo)+'</span><strong class="qp-target">'+view.n+'<small>'+esc(item.unitKo)+'</small></strong></div><div class="qp-live"><strong class="qp-count-now">0</strong><span class="qp-count-word">같이 세어요</span></div></div>'+
      '<div class="qp-board" role="img" aria-label="'+esc(totalText())+'" data-layout="'+view.layout+'">'+boardMarkup()+'</div>'+
      '<div class="qp-stage-bottom"><span class="qp-progress" role="status" aria-live="polite">그림이 나타나요</span><button type="button" data-qp-action="minus" aria-label="한 개 덜" '+(view.n===0?'disabled':'')+'>−1</button><button type="button" data-qp-action="plus" aria-label="한 개 더" '+(view.n===30?'disabled':'')+'>+1</button></div></main>'+
      '<aside class="qp-picker" aria-label="그림과 숫자 고르기"><div class="qp-categories">'+categories().map(c=>'<button type="button" data-qp-action="category" data-value="'+c[0]+'" aria-pressed="'+(view.category===c[0])+'"><span>'+c[1]+'</span>'+c[2]+'</button>').join('')+'</div>'+
      '<div class="qp-objects" role="group" aria-label="그림 고르기">'+choices.map(choice).join('')+'</div>'+
      '<div class="qp-ranges" role="group" aria-label="숫자 범위">'+['0–10','11–20','21–30'].map((r,i)=>'<button type="button" data-qp-action="range" data-value="'+i+'" aria-pressed="'+(view.range===i)+'">'+r+'</button>').join('')+'</div>'+
      '<div class="qp-numbers" role="group" aria-label="원하는 숫자">'+numbers.map(n=>'<button type="button" data-qp-action="number" data-value="'+n+'" aria-label="'+n+' 선택" aria-pressed="'+(view.n===n)+'">'+n+'</button>').join('')+'</div></aside>'+
      '<footer class="qp-footer"><button type="button" data-qp-action="pause" class="qp-pause" aria-label="잠깐 멈추기">⏸ 잠깐</button><div class="qp-readings" role="group" aria-label="수 읽는 방법"><button type="button" data-qp-action="style" data-value="native" aria-pressed="'+(view.style==='native')+'">하나·둘</button><button type="button" data-qp-action="style" data-value="sino" aria-pressed="'+(view.style==='sino')+'">일·이</button></div><button type="button" data-qp-action="layout" class="qp-layout" aria-label="배열 바꾸기">'+({rows:'▦ 줄 맞추기',tens:'▦ 열 칸 보기',scatter:'✦ 흩어 놓기'})[view.layout]+'</button><button type="button" data-qp-action="replay" class="qp-replay" aria-label="자동으로 다시 세기">↻ <span>다시 세기</span></button><p class="qp-sound-note" hidden></p></footer>'+pictureDialog()+'</section>';
    view.container.querySelectorAll('.qp-item').forEach(el=>{const prior=preserved.get(el.dataset.objectIndex);if(prior)el.replaceWith(prior);});
    view.renderObjectId=view.objectId;
    view.container.querySelector('.qp-board').scrollTop=oldScroll;
    if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){preserved.forEach((el,id)=>{if(!el.isConnected)return;const a=oldRects.get(id),b=el.getBoundingClientRect();if(a&&b.width&&b.height&&(Math.abs(a.left-b.left)>2||Math.abs(a.top-b.top)>2))el.animate?.([{transform:'translate('+(a.left-b.left)+'px,'+(a.top-b.top)+'px)'},{transform:'none'}],{duration:350,easing:'ease-out'});});}
    C().preparePictures(view.container);
    const currentRoot=view.container.querySelector('.qp-root');
    currentRoot.classList.toggle('qp-finished',view.complete);
    currentRoot.querySelector('.qp-count-now').textContent=String(view.counted);
    currentRoot.querySelector('.qp-count-word').textContent=view.complete?completionText():(view.counted?M().countWord(view.counted,view.style,language()):'같이 세어요');
    currentRoot.querySelector('.qp-progress').textContent=view.complete?'모두 '+view.n+item.unitKo:'지금 '+view.counted+item.unitKo+' 셌어요';
    currentRoot.querySelectorAll('.qp-item').forEach((el,i)=>{el.classList.toggle('is-counted',i<view.counted);el.classList.toggle('is-current',!view.complete&&i===view.counted-1);});
    if(view.audioFailed){currentRoot.querySelector('.qp-sound-note').hidden=false;currentRoot.querySelector('.qp-sound-note').textContent='그림과 숫자로 함께 세어요';}
    observeBoard();updatePlayback();
  }
  function openSettings(){
    view.resumeAfterModal=view.sequence.isRunning();view.sequence.pause();
    const open=view.options.openSettings||window.SihyeonPlaySettings?.openSettings;
    if(typeof open!=='function'){if(view.resumeAfterModal)view.sequence.resume();return;}
    open();
    view.settingsObserver?.disconnect();
    if(!document.getElementById('playSettingsDialog')){if(view.resumeAfterModal)view.sequence.resume();return;}
    view.settingsObserver=new MutationObserver(function(){
      if(!document.getElementById('playSettingsDialog')){
        view.settingsObserver?.disconnect();view.settingsObserver=null;
        if(view.container){repaint();if(view.resumeAfterModal&&!view.userPaused)view.sequence.resume();}
      }
    });
    view.settingsObserver.observe(document.body,{childList:true});
  }
  function onKey(event){
    if(!view.picturePicker)return;
    if(event.key==='Escape'){event.preventDefault();closePictures();return;}
    if(event.key==='Tab'){
      const buttons=Array.from(view.container.querySelectorAll('.qp-picture-modal button'));
      const first=buttons[0],last=buttons[buttons.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  }
  function closePictures(){
    view.picturePicker=false;repaint();
    if(view.resumeAfterModal&&!view.userPaused)view.sequence.resume();
  }
  function changeNumber(n,incremental){
    if(!M().isQuantity(n))return;if(n===view.n){if(!incremental)run();return;}
    const previous=view.n,delta=n-previous;
    view.sequence.stop();view.n=n;view.range=n<=10?0:n<=20?1:2;
    if(!incremental||Math.abs(delta)!==1){save();repaint();run();return;}
    view.counted=n;view.complete=false;save();repaint();
    const fresh=view.container.querySelector('[data-object-index="'+(n-1)+'"]');
    if(delta>0)fresh?.classList.add('is-new');
    const step={id:'change-'+n,kind:'change',delta,ordinal:n,text:(delta>0?'하나 더, ':'하나 덜, ')+M().countWord(n,view.style,'ko'),enText:(delta>0?'One more, ':'One fewer, ')+M().countWord(n,view.style,'en')};
    updateProgress(step);
    view.sequence.start([step],{muted:view.muted,paused:view.userPaused,onStep:updateProgress,onState:updatePlayback,onEnd:()=>{
      if(!view.container)return;view.complete=true;view.counted=n;
      view.container.querySelector('.qp-root')?.classList.add('qp-finished');
      fresh?.classList.remove('is-new');view.container.querySelectorAll('.qp-item.is-current').forEach(el=>el.classList.remove('is-current'));updatePlayback();
    }});
    if(view.userPaused)view.sequence.pause();
  }
  function onClick(event){
    const b=event.target.closest?.('[data-qp-action]');if(!b||!view.container?.contains(b)||b.disabled)return;
    const action=b.dataset.qpAction,value=b.dataset.value;
    if(action==='home'){destroy();view.options.closeToParkHome?.();return;}
    if(action==='settings'){openSettings();return;}
    if(action==='choosePicture'){view.resumeAfterModal=view.sequence.isRunning();view.sequence.pause();view.picturePicker=true;repaint();view.container.querySelector('[data-qp-action="closePictures"]')?.focus();return;}
    if(action==='closePictures'){closePictures();return;}
    if(action==='number'){changeNumber(Number(value));return;}
    if(action==='minus'||action==='plus'){changeNumber(view.n+(action==='plus'?1:-1),true);return;}
    if(action==='category'){view.category=value;repaint();return;}
    if(action==='range'){view.range=Number(value);repaint();return;}
    if(action==='object'){
      if(!(view.custom?.id===value)&&!view.objects.some(o=>o.id===value))return;
      view.objectId=value;view.picturePicker=false;view.category=object().category||'vehicle';save();repaint();run();return;
    }
    if(action==='style'){view.style=value;save();repaint();run(view.counted+1);return;}
    if(action==='layout'){const a=['rows','tens','scatter'];view.layout=a[(a.indexOf(view.layout)+1)%3];save();repaint();view.container.querySelector('.qp-progress').textContent='자리를 바꿔도 '+view.n+object().unitKo;return;}
    if(action==='mute'){view.muted=!view.muted;view.sequence.setMuted(view.muted);save();repaint();return;}
    if(action==='pause'){view.userPaused=!view.sequence.isPaused();if(view.userPaused)view.sequence.pause();else view.sequence.resume();updatePlayback();return;}
    if(action==='replay'){view.userPaused=false;run();}
  }
  function render(container,options){
    destroy();view.container=container;view.options=options||{};view.objects=C().list();
    view.objectId='korean_police_car';view.n=9;view.custom=null;view.category='vehicle';view.style='native';view.layout='rows';view.muted=false;load();
    if(C().isValid(view.options.initialObject)){
      view.custom=Object.assign({emoji:'🎨',category:'art'},view.options.initialObject);view.objectId=view.custom.id;view.category='art';
      if(!view.objects.some(o=>o.id===view.custom.id))view.objects.push(view.custom);
      else view.objects=view.objects.map(o=>o.id===view.custom.id?view.custom:o);
      save();
    }
    view.range=view.n<=10?0:view.n<=20?1:2;
    view.sequence=window.SihyeonQuantitySequencer.create();
    view.picturePicker=false;view.userPaused=false;view.currentLanguage=language();
    view.handlers={click:onClick,key:onKey,resize:scheduleBoardFocus,settings:()=>{if(!view.container)return;const changed=language()!==view.currentLanguage;view.currentLanguage=language();repaint();if(changed){run(view.counted+1);if(document.getElementById('playSettingsDialog'))view.sequence.pause();}},visibility:()=>{if(document.hidden){view.resumeAfterVisibility=view.sequence?.isRunning();view.sequence?.pause();}else if(view.resumeAfterVisibility&&view.container&&!view.userPaused&&!document.getElementById('playSettingsDialog')&&!view.picturePicker)view.sequence?.resume();}};
    container.addEventListener('click',view.handlers.click);container.addEventListener('keydown',view.handlers.key);window.addEventListener('sihyeon-settings-change',view.handlers.settings);document.addEventListener('visibilitychange',view.handlers.visibility);
    window.addEventListener('resize',view.handlers.resize);window.addEventListener('orientationchange',view.handlers.resize);
    repaint();run();
  }
  function destroy(){
    view.sequence?.stop();
    view.settingsObserver?.disconnect();view.settingsObserver=null;
    view.boardObserver?.disconnect();view.boardObserver=null;
    if(view.scrollFrame)cancelAnimationFrame(view.scrollFrame);view.scrollFrame=0;
    if(view.handlers){view.container?.removeEventListener('click',view.handlers.click);view.container?.removeEventListener('keydown',view.handlers.key);window.removeEventListener('sihyeon-settings-change',view.handlers.settings);document.removeEventListener('visibilitychange',view.handlers.visibility);window.removeEventListener('resize',view.handlers.resize);window.removeEventListener('orientationchange',view.handlers.resize);}
    view.container=null;view.sequence=null;view.handlers=null;view.renderObjectId=null;
  }
  function getSnapshot(){return {active:!!view.container,objectId:view.objectId,quantity:view.n,actualCount:view.container?.querySelectorAll('.qp-item').length||0,counted:view.counted,readingStyle:view.style,layout:view.layout,age:age(),language:language(),muted:view.muted,complete:view.complete,audioFailed:view.audioFailed,sequence:view.sequence?.getSnapshot()||null};}
  window.SihyeonGames=window.SihyeonGames||{};
  window.SihyeonGames[KEY]={id:KEY,title:'내가 만드는 숫자놀이',render:render,destroy:destroy,getSnapshot:getSnapshot};
})();
