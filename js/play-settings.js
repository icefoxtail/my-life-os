(function () {
  'use strict';
  const KEY = 'sihyeon-play-settings-v1';
  const RANGES = ['1-10', '11-15', '16-20', '21-30'];
  const ICONS = {4:'🐣',5:'🐰',6:'🦊',7:'🐻'};
  let data = {version:1,ageMode:4,challenges:{},assistance:'with-me',language:'ko'};
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if ([4,5,6,7].includes(saved.ageMode)) data.ageMode = saved.ageMode;
      if (saved.language === 'en') data.language = 'en';
      if (saved.challenges && typeof saved.challenges === 'object') {
        Object.entries(saved.challenges).forEach(([key,value]) => {
          if (/^[a-zA-Z][a-zA-Z0-9]{0,40}$/.test(key) && (RANGES.includes(value) || (key === 'numberCount' && value === '1-5'))) data.challenges[key] = value;
        });
      }
      if (saved.assistance === 'on-my-own') data.assistance = saved.assistance;
    }
  } catch (_) { /* Storage can be unavailable; play remains available. */ }
  function snapshot() { return JSON.parse(JSON.stringify(data)); }
  function commit() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {}
    document.querySelectorAll('[data-play-age]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.playAge) === data.ageMode));
    });
    document.querySelectorAll('[data-play-age-label]').forEach(el => { el.textContent = ICONS[data.ageMode]+' '+data.ageMode+'세'; });
    document.querySelectorAll('[data-language-toggle]').forEach(el => { el.setAttribute('aria-pressed',String(data.language==='en'));el.querySelector('b').textContent=data.language==='en'?'EN':'KO'; });
    document.querySelectorAll('[data-ps-language]').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.psLanguage===data.language)));
    window.dispatchEvent(new CustomEvent('sihyeon-settings-change',{detail:snapshot()}));
  }
  function setAge(value) {
    const age=Number(value); if (![4,5,6,7].includes(age)) return false;
    data.ageMode=age; commit(); return true;
  }
  function setChallenge(key,value) {
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,40}$/.test(key) || !(RANGES.includes(value) || (key === 'numberCount' && value === '1-5'))) return false;
    data.challenges[key]=value; commit(); return true;
  }
  function setLanguage(language) {
    if (language !== 'ko' && language !== 'en') return false;
    if (data.language === language) return true;
    data.language = language;
    try { window.SihyeonVoice?.stop?.(); } catch (_) {}
    commit();
    return true;
  }
  function speak(text) {
    try {
      return window.SihyeonVoice?.speak?.(data.language === 'en' ? "Let's play!" : text,
        {lang:data.language==='en'?'en-US':'ko-KR',rate:data.language==='en'?0.88:0.85,pitch:1.04})?.catch?.(()=>false);
    } catch (_) {}
  }
  function languageButton() {
    return '<button type="button" class="ps-language-toggle" data-language-toggle aria-label="한국어와 영어 듣기 전환" aria-pressed="' + (data.language==='en') + '"><span aria-hidden="true">🌐</span><b>' + (data.language==='en'?'EN':'KO') + '</b></button>';
  }
  function ageButtons() {
    return [4,5,6,7].map(age=>`<button type="button" data-play-age="${age}" aria-pressed="${data.ageMode===age}" aria-label="${age}세 놀이"><span aria-hidden="true">${ICONS[age]}</span><b>${age}세</b></button>`).join('');
  }
  function openSettings() {
    if(document.getElementById('playSettingsDialog')) return;
    const returnFocus=document.activeElement;
    const backdrop=document.createElement('div'); backdrop.id='playSettingsDialog'; backdrop.className='ps-overlay';
    backdrop.innerHTML=`<section class="ps-dialog" role="dialog" aria-modal="true" aria-labelledby="psTitle"><header><h2 id="psTitle">함께 고르는 놀이</h2><button type="button" data-ps-close aria-label="설정 닫기">✕</button></header><p>나이는 놀이 방법의 추천이에요. 어느 놀이든 자유롭게 골라요.</p><div class="ps-age-row">${ageButtons()}</div><p class="ps-note">연령과 영어 듣기는 별도 설정이에요.</p><label>🔊 안내 음성 언어</label><div class="ps-language-row" role="group" aria-label="안내 음성 언어"><button type="button" data-ps-language="ko" aria-pressed="${data.language==='ko'}">🇰🇷 한국어</button><button type="button" data-ps-language="en" aria-pressed="${data.language==='en'}">🇺🇸 English Listening</button></div><p class="ps-note">그림과 놀이 방법은 그대로예요. 영어 음성은 기기의 TTS로 읽어요.</p><p class="ps-note">우체국에서 담던 상자는 보관돼요. 돌아오면 이어서 놀 수 있어요.</p><label for="psPostRange">📮 우체국 수량</label><select id="psPostRange">${RANGES.map(r=>`<option value="${r}" ${getChallenge('numberPostOffice',({4:'1-10',5:'11-15',6:'16-20',7:'21-30'})[data.ageMode])===r?'selected':''}>${r.replace('-', '~')}개${r==='11-15'?' · 10 넘게 세기':''}</option>`).join('')}</select><label for="psCountRange">🚗 자동차 수량</label><select id="psCountRange">${['1-5',...RANGES].map(r=>`<option value="${r}" ${getChallenge('numberCount','1-10')===r?'selected':''}>${r.replace('-', '~')}대</option>`).join('')}</select><p class="ps-note">수량은 나이와 따로 기억해요. 틀려도 자동으로 낮아지지 않아요.</p><button class="ps-done" type="button" data-ps-close>이어서 놀기 ▶</button></section>`;
    document.body.appendChild(backdrop);
    function close() { backdrop.remove();document.removeEventListener('keydown',keys);returnFocus?.isConnected&&returnFocus.focus?.(); }
    function keys(e) {
      if(e.key==='Escape'){e.preventDefault();close();}
      if(e.key==='Tab'){
        const all=[...backdrop.querySelectorAll('button,select')]; const first=all[0],last=all[all.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    }
    backdrop.querySelectorAll('[data-ps-close]').forEach(b=>b.onclick=close);
    backdrop.querySelectorAll('[data-play-age]').forEach(b=>b.onclick=()=>{setAge(b.dataset.playAge);if(!data.challenges.numberPostOffice)backdrop.querySelector('#psPostRange').value=({4:'1-10',5:'11-15',6:'16-20',7:'21-30'})[data.ageMode];speak(`${data.ageMode}세 놀이로 갈게!`);});
    backdrop.querySelectorAll('[data-ps-language]').forEach(b=>b.onclick=()=>{
      if(setLanguage(b.dataset.psLanguage)) {
        if(data.language==='en') window.SihyeonVoice?.speak?.("English listening is on! Let's play!",{lang:'en-US',rate:0.88})?.catch?.(()=>{});
        else speak('한국어 안내로 바꿨어!');
      }
    });
    backdrop.querySelector('#psPostRange').onchange=e=>setChallenge('numberPostOffice',e.target.value);
    backdrop.querySelector('#psCountRange').onchange=e=>setChallenge('numberCount',e.target.value);
    backdrop.onclick=e=>{if(e.target===backdrop)close();};
    document.addEventListener('keydown',keys);backdrop.querySelector('[data-ps-close]').focus();
  }
  function getChallenge(key,fallback='1-10'){return data.challenges[key]||fallback;}
  window.SihyeonPlaySettings={getAge:()=>data.ageMode,setAge,getLanguage:()=>data.language,setLanguage,getChallenge,setChallenge,get:snapshot,openSettings,ageButtons,languageButton};
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-home-age]');
    if(button){setAge(button.dataset.homeAge);speak(`${data.ageMode}세 놀이로 갈게!`);}
    const languageButton=event.target.closest?.('[data-language-toggle]');
    if(languageButton){
      setLanguage(data.language==='en'?'ko':'en');
      if(data.language==='en') window.SihyeonVoice?.speak?.("English listening is on! Let's play!",{lang:'en-US',rate:0.88})?.catch?.(()=>{});
      else speak('한국어 안내로 바꿨어!');
    }
  });
})();
