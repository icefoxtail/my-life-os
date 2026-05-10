/**
 * 시현이 놀이터 OS — 럭셔리 자동차 정비소 (Premium Car Garage)
 * 파일: js/games/car-garage.js
 * 버전: 4살 시현이 맞춤형 최종 통합본 (v3.0)
 */

(function () {
  const GAME_KEY = 'carGarage';
  const STYLE_ID = 'sihyeon-car-garage-style';

  // 1. 차량별 맞춤형 데이터 (수리 순서 및 피날레 정의)
  const VEHICLE_META = {
    fire:      { name: '소방차', emoji: '🚒', color: '#FF3B3B', tasks: ['wheel', 'wash', 'siren'], action: 'fire_fin' },
    police:    { name: '경찰차', emoji: '🚓', color: '#1E90FF', tasks: ['wheel', 'light', 'siren'], action: 'police_fin' },
    bus:       { name: '버스',   emoji: '🚌', color: '#FFD93D', tasks: ['wheel', 'light', 'wash'],  action: 'bus_fin' },
    ambulance: { name: '구급차', emoji: '🚑', color: '#FFFFFF', tasks: ['wheel', 'light', 'gas'],   action: 'amb_fin' },
    rocket:    { name: '로켓카', emoji: '🚀', color: '#9C27B0', tasks: ['wheel', 'gas', 'light'],   action: 'rocket_fin' }
  };

  const TASK_ICONS = {
    wheel: '⚙️',
    light: '💡',
    wash:  '🧼',
    gas:   '⛽',
    siren: '🚨'
  };

  const state = {
    container: null,
    options: {},
    currentVehicle: null,
    phase: 'arrival', 
    currentTaskIdx: 0,
    audioCtx: null,
    destroyed: false
  };

  // ─── 오디오 합성 유틸리티 ──────────────────────────
  function initAudio() {
    if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
  }

  function playComplexSound(type) {
    if (!state.audioCtx) return;
    const ctx = state.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);

    switch(type) {
      case 'wheel': // 칙칙칙!
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        osc.start(); osc.stop(now + 0.1);
        break;
      case 'light': // 띠링!
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        osc.start(); osc.stop(now + 0.2);
        break;
      case 'gas': // 푸우우웅!
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.8);
        gain.gain.setValueAtTime(0.2, now);
        osc.start(); osc.stop(now + 0.8);
        break;
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(); osc.stop(now + 0.2);
    }
  }

  function vibrate(p) { if (navigator.vibrate) try { navigator.vibrate(p); } catch(e) {} }

  // ─── 초호화 CSS 스타일 ────────────────────────────────
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .cg-root {
        width: 100%; height: 100%; display: flex; flex-direction: column;
        background: linear-gradient(180deg, #1a2a33 0%, #000 100%);
        font-family: 'Jua', sans-serif; position: relative; overflow: hidden;
        user-select: none; touch-action: none; transition: filter 0.2s ease-in-out;
      }
      .cg-floor {
        position: absolute; bottom: 0; width: 100%; height: 32%;
        background: linear-gradient(180deg, #37474f 0%, #1a1a1a 100%);
        border-top: 6px solid #4fc3f7; box-shadow: 0 -10px 30px rgba(79, 195, 247, 0.2);
      }
      .cg-stage { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; z-index: 10; }
      .cg-car-unit { position: relative; transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .cg-car-body {
        font-size: clamp(180px, 45vw, 300px); position: relative; z-index: 5;
        filter: drop-shadow(0 20px 40px rgba(0,0,0,0.8));
        transition: filter 0.5s, transform 0.3s;
      }
      
      /* 자동차 피드백 클래스 */
      .cg-car-body.is-clean { filter: drop-shadow(0 0 25px #fff) brightness(1.2); }
      .cg-car-body.is-powered { animation: carPulse 2s infinite alternate; }
      @keyframes carPulse { from { filter: brightness(1); } to { filter: brightness(1.3) drop-shadow(0 0 30px gold); } }
      .cg-car-body.happy-jump { animation: happyJump 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      @keyframes happyJump { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.25) translateY(-40px); } }

      /* 도구 바 */
      .cg-toolbox {
        height: 125px; background: rgba(0,0,0,0.6); backdrop-filter: blur(20px);
        display: flex; align-items: center; justify-content: center; gap: 15px;
        border-top: 4px solid rgba(255,255,255,0.2); z-index: 100;
      }
      .cg-tool-btn {
        width: 85px; height: 85px; border-radius: 50%; background: #fff; border: 5px solid #FF7A1A;
        font-size: 42px; display: grid; place-items: center; box-shadow: 0 6px 0 #E65100;
        transition: transform 0.1s, opacity 0.3s, background 0.2s; cursor: pointer;
      }
      .cg-tool-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #E65100; }
      
      /* 틀렸을 때 시각 피드백 */
      .cg-tool-btn.wrong { animation: plWobble 0.4s; border-color: #ff0000 !important; background: #ffcccc !important; }
      @keyframes plWobble { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(15deg); } }

      /* 힌트 애니메이션 (2회만 깜빡임) */
      .cg-tool-btn.next-hint {
        animation: toolHint 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) 2;
        border-color: #00FF00; box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
      }
      @keyframes toolHint { from { transform: scale(1); } to { transform: scale(1.15); } }

      /* 세차 거품 */
      .cg-bubbles { position: absolute; inset: 0; pointer-events: none; z-index: 6; display: block; }
      .cg-bubble-item { position: absolute; background: rgba(255,255,255,0.8); border-radius: 50%; animation: bubbleUp 0.6s forwards; }
      @keyframes bubbleUp { 
        0% { transform: scale(0) translateY(0); opacity: 1; } 
        100% { transform: scale(1.5) translateY(-160px); opacity: 0; } 
      }

      /* 말풍선 */
      .cg-speech {
        position: absolute; top: 12%; left: 50%; transform: translateX(-50%);
        background: #fff; padding: 15px 35px; border-radius: 35px; font-size: 40px;
        border: 6px solid #FF7A1A; box-shadow: 0 12px 25px rgba(0,0,0,0.4); z-index: 150;
        animation: cgPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes cgPopIn { from { transform: translateX(-50%) scale(0); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
      
      /* 데코레이션 */
      .cg-deco-item { position: absolute; font-size: 65px; z-index: 15; pointer-events: none; }
    `;
    document.head.appendChild(style);
  }

  // ─── 게임 진행 엔진 ──────────────────────────────────────
  
  function startVehicle() {
    if (state.destroyed) return;
    const keys = Object.keys(VEHICLE_META);
    const key = keys[Math.floor(Math.random() * keys.length)];
    state.currentVehicle = { ...VEHICLE_META[key], id: key };
    state.currentTaskIdx = 0;
    state.phase = 'repair';
    
    renderUI();
    vibrate(100);
    speak(`와! 멋진 ${state.currentVehicle.name}가 왔어요!`);
  }

  function renderUI() {
    if (!state.container || state.destroyed) return;
    const root = state.container.querySelector('.cg-root');
    const v = state.currentVehicle;
    const nextTask = v.tasks[state.currentTaskIdx];

    root.innerHTML = `
      <div class="cg-floor"></div>
      <div class="cg-stage">
        <div class="cg-car-unit" id="carUnit">
          <div class="cg-bubbles" id="bubbleLayer"></div>
          <div class="cg-car-body" id="carBody">${v.emoji}</div>
          <div id="decoLayer"></div>
        </div>
        <div class="cg-speech" id="speechBubble">
           ${state.phase === 'repair' ? `${TASK_ICONS[nextTask]} ?` : '😊 👍'}
        </div>
      </div>
      <div class="cg-toolbox">
        ${Object.keys(TASK_ICONS).map(t => {
          const isNext = (state.phase === 'repair' && t === nextTask);
          return `<button class="cg-tool-btn ${isNext ? 'next-hint' : ''}" data-task="${t}">${TASK_ICONS[t]}</button>`;
        }).join('')}
        ${state.phase === 'tuning' ? `<button class="cg-tool-btn" id="btnDeco">🎀</button><button class="cg-tool-btn" id="btnGo">✅</button>` : ''}
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const root = state.container;
    if (!root) return;

    // 도구 버튼 이벤트
    root.querySelectorAll('.cg-tool-btn[data-task]').forEach(btn => {
      btn.onclick = () => {
        if (state.phase !== 'repair') return;
        const selectedTask = btn.dataset.task;
        const v = state.currentVehicle;
        const correctTask = v.tasks[state.currentTaskIdx];

        // [중복 클릭 방지] 이미 완료한 도구는 무시
        const completedTasks = v.tasks.slice(0, state.currentTaskIdx);
        if (completedTasks.includes(selectedTask)) return;

        if (selectedTask === correctTask) {
          handleRepairSuccess(selectedTask);
        } else {
          handleRepairWrong(btn);
        }
      };
    });

    // 튜닝 및 완료 버튼
    root.querySelector('#btnDeco')?.addEventListener('click', addDecoration);
    root.querySelector('#btnGo')?.addEventListener('click', startFinale);
  }

  function handleRepairSuccess(task) {
    initAudio();
    vibrate(70);
    playComplexSound(task);
    
    const carBody = state.container.querySelector('#carBody');
    const speech = state.container.querySelector('#speechBubble');
    if (speech) speech.textContent = '😊 👍';

    // 부품별 맞춤 칭찬 보이스
    if (task === 'wheel') speak("바퀴 끼웠어! 짝짝!");
    else if (task === 'light') speak("불이 들어왔어! 반짝반짝!");
    else if (task === 'wash') speak("깨끗해졌어! 우와~!");
    else if (task === 'gas') speak("에너지 가득! 준비됐어!");
    else if (task === 'siren') speak("사이렌 소리 멋지다! 삐용삐용!");

    // 시각 리액션
    carBody.classList.add('happy-jump');
    if (task === 'wash') {
      showBubbles();
      carBody.classList.add('is-clean');
    } else {
      carBody.classList.add('is-powered');
      setTimeout(() => carBody.classList.remove('is-powered'), 2000);
    }
    setTimeout(() => carBody.classList.remove('happy-jump'), 500);

    // 다음 단계 진행
    state.currentTaskIdx++;
    if (state.currentTaskIdx >= state.currentVehicle.tasks.length) {
      state.phase = 'tuning';
      setTimeout(() => renderUI(), 800);
    } else {
      setTimeout(() => renderUI(), 800);
    }
  }

  function handleRepairWrong(btn) {
    initAudio();
    vibrate([50, 50]);
    const speech = state.container.querySelector('#speechBubble');
    
    btn.classList.add('wrong');
    if (speech) speech.textContent = '😕';
    speak("아, 이건 나중에! 다른 걸 먼저 해볼까?"); 

    setTimeout(() => {
      btn.classList.remove('wrong');
      if (speech && state.phase === 'repair') {
        const nextTask = state.currentVehicle.tasks[state.currentTaskIdx];
        speech.textContent = `${TASK_ICONS[nextTask]} ?`;
      }
    }, 800);
  }

  function showBubbles() {
    const layer = state.container.querySelector('#bubbleLayer');
    if (!layer) return;
    for(let i=0; i<15; i++) {
      const b = document.createElement('div');
      b.className = 'cg-bubble-item';
      b.style.left = Math.random() * 90 + '%';
      b.style.top = Math.random() * 80 + '%';
      const s = Math.random() * 25 + 15 + 'px';
      b.style.width = s; b.style.height = s;
      layer.appendChild(b);
      setTimeout(() => b.remove(), 650);
    }
  }

  function addDecoration() {
    initAudio();
    vibrate(30);
    const layer = state.container.querySelector('#decoLayer');
    const decos = ['🕶️', '👑', '🎀', '💎', '🔥', '🍭', '🍀'];
    const d = document.createElement('div');
    d.className = 'cg-deco-item';
    d.textContent = decos[Math.floor(Math.random() * decos.length)];
    d.style.left = (Math.random() * 60 + 10) + '%';
    d.style.top = (Math.random() * 30) + '%';
    layer.appendChild(d);
    playComplexSound('light');
  }

  function startFinale() {
    state.phase = 'photo';
    vibrate(300);
    speak("시현아, 김치~! 사진 찍자!");

    setTimeout(() => {
      const root = state.container.querySelector('.cg-root');
      root.style.filter = 'brightness(2) saturate(1.3)'; // 부드러운 플래시
      playComplexSound('light');

      setTimeout(() => {
        root.style.filter = '';
        performSpecialAction();
      }, 200);
    }, 1500);
  }

  function performSpecialAction() {
    const v = state.currentVehicle;
    const unit = state.container.querySelector('#carUnit');
    if (!unit) return;
    
    if (v.action === 'fire_fin') {
       unit.animate([
         { transform: 'rotate(0) scale(1)' },
         { transform: 'rotate(720deg) scale(1.5)', offset: 0.5 },
         { transform: 'rotate(1080deg) scale(1.2) translateX(120vw)' }
       ], { duration: 2500, easing: 'ease-in-out' });
       showBubbles();
       speak("불을 꺼요! 부릉부릉 출동!");
    } else if (v.action === 'police_fin') {
       unit.animate([
         { transform: 'translateX(0) rotate(0)', filter: 'brightness(2)' },
         { transform: 'translateX(40vw) rotate(-10deg)', filter: 'hue-rotate(180deg)', offset: 0.3 },
         { transform: 'translateX(120vw) rotate(0)' }
       ], { duration: 2200 });
       speak("경찰차 출동! 삐용삐용 잡으러 가자!");
    } else if (v.action === 'rocket_fin') {
       unit.animate([
         { transform: 'translateY(0)' },
         { transform: 'translateY(10px)', offset: 0.1 },
         { transform: 'translateY(-180vh) scale(0.4)' }
       ], { duration: 2800 });
       speak("우주로 발사! 콰아아앙! 대단해!");
    } else {
       unit.style.transform = 'translateX(120vw) rotate(5deg)';
       speak("부릉부릉 출발! 시현아 정말 잘했어!");
    }

    if (state.options.fireConfetti) state.options.fireConfetti();
    if (state.options.gainExp) state.options.gainExp(40);
    if (state.options.unlockCar) state.options.unlockCar(v.emoji);

    setTimeout(() => { if (!state.destroyed) startVehicle(); }, 7600);
  }

  function speak(text) {
    if (state.options.speakGuide) state.options.speakGuide(text, true);
  }

  // ─── LifeCycle API ────────────────────────────────────
  function render(container, options = {}) {
    this.destroy();
    injectStyle();
    state.container = container;
    state.options = options;
    state.destroyed = false;

    container.innerHTML = `<div class="cg-root"></div>`;
    startVehicle();
  }

  function destroy() {
    state.destroyed = true;
    if (state.audioCtx) {
      state.audioCtx.close().catch(() => {});
      state.audioCtx = null;
    }
    if (state.container) state.container.innerHTML = '';
    state.container = null;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };

})();
