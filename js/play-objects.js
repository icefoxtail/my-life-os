/* Shared, existing pictures for quantity play. Artwork is read-only. */
(function () {
  'use strict';
  const VEHICLES = './assets/vehicles/';
  const OBJECTS = './assets/games/number-post-office/';
  const entries = [
    ['korean_police_car','경찰차','police car','police cars','대','vehicle',VEHICLES+'police/korean_police_car.png','🚓'],
    ['riot_police_bus','경찰버스','police bus','police buses','대','vehicle',VEHICLES+'police/riot_police_bus.png','🚌'],
    ['swat_truck','경찰특공대차','SWAT truck','SWAT trucks','대','vehicle',VEHICLES+'police/swat_truck.png','🚙'],
    ['pump_engine','소방차','fire engine','fire engines','대','vehicle',VEHICLES+'fire/pump_engine.png','🚒'],
    ['ladder_truck','소방사다리차','ladder truck','ladder trucks','대','vehicle',VEHICLES+'fire/ladder_truck.png','🚒'],
    ['excavator','포크레인','excavator','excavators','대','vehicle',VEHICLES+'construction/excavator.png','🚜'],
    ['apple','사과','apple','apples','개','food',OBJECTS+'apple.svg','🍎'],
    ['carrot','당근','carrot','carrots','개','food',OBJECTS+'carrot.svg','🥕'],
    ['cookie','쿠키','cookie','cookies','개','food',OBJECTS+'cookie.svg','🍪'],
    ['ball','공','ball','balls','개','toy',OBJECTS+'ball.svg','⚽'],
    ['block','블록','block','blocks','개','toy',OBJECTS+'block.svg','🧱'],
    ['teddy','곰인형','teddy bear','teddy bears','개','toy',OBJECTS+'teddy.svg','🧸']
  ].map(function (row) {
    return Object.freeze({id:row[0],nameKo:row[1],nameEn:row[2],pluralEn:row[3],unitKo:row[4],category:row[5],src:row[6],emoji:row[7]});
  });
  function valid(item) {
    return !!item && typeof item.id === 'string' && typeof item.nameKo === 'string' &&
      typeof item.src === 'string' && (item.src.startsWith('./assets/') || item.src.startsWith('data:image/svg+xml')) &&
      ['개','대','마리','송이','명','채','척'].includes(item.unitKo);
  }
  function list() {
    const result = entries.slice();
    try {
      const art = window.SihyeonArtPlayBridge?.getPlayObjects?.();
      if (Array.isArray(art)) art.filter(valid).forEach(function (item) { result.push(Object.assign({emoji:'🎨'},item)); });
    } catch (_) { /* The original picture catalog remains usable. */ }
    return result;
  }
  function get(id) { return list().find(function (item) { return item.id === id; }) || null; }
  function esc(text) { return String(text).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function picture(item, className) {
    return '<span class="qp-picture '+esc(className||'')+'"><img src="'+esc(item.src)+'" alt="" draggable="false"><span class="qp-image-fallback" aria-hidden="true">'+esc(item.emoji||'🎨')+'</span></span>';
  }
  function preparePictures(root) {
    root.querySelectorAll('.qp-picture img').forEach(function(img){
      const wrapper=img.closest('.qp-picture');
      const failed=function(){wrapper?.classList.add('missing');};
      img.addEventListener('error',failed,{once:true});
      if(img.complete && !img.naturalWidth) failed();
      if(img.getAttribute('src').includes('/vehicles/')) window.SihyeonVehicleDisplay?.apply?.(img);
    });
  }
  window.SihyeonPlayObjects = {list:list,get:get,isValid:valid,picture:picture,preparePictures:preparePictures};
})();
