/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - NUMBER COUNT GAME MODULE
   js/games/number-count.js  [v5.2 — 자동차 우선 가로 최적화 완성본]
   - 세로모드 기존 흐름 유지
   - 가로모드: 좌측 자동차 종류 우선 / 중앙 자동차 최대 / 우측 숫자 보기
   - 자동차 1~9대 개수별 출력 크기 보정
═══════════════════════════════════════════ */
(function(){
  'use strict';

  window.SihyeonGames = window.SihyeonGames || {};

  const GAME_KEY     = 'numberCount';
  const STYLE_ID     = 'sihyeon-number-count-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';
  const TOTAL_ROUNDS = 5;

  const VEHICLE_CATEGORIES = [
    { id: 'all', label: '🚗전체' },
    { id: 'fire', label: '🚒소방' },
    { id: 'police', label: '🚓경찰' },
    { id: 'rescue', label: '🚑구조' },
    { id: 'construction', label: '🏗️공사' },
    { id: 'transport', label: '🚌교통' },
    { id: 'airport', label: '✈️공항' },
    { id: 'farm', label: '🚜농장' },
    { id: 'port', label: '⚓항구' },
    { id: 'road_service', label: '🛣️도로' },
    { id: 'military_special', label: '🛡️특수' },
    { id: 'town', label: '🏘️동네' },
  ];

  const KOREAN_COUNT = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
  const SINO_KR      = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

  const BG_THEMES = [
    { sky:'linear-gradient(180deg,#87CEEB 0%,#E0F7FA 65%,#C8E6C9 100%)', road:'#9E9E9E', roadShadow:'#757575', cloud:true  },
    { sky:'linear-gradient(180deg,#FF7043 0%,#FFA726 45%,#FFE082 100%)', road:'#795548', roadShadow:'#4E342E', cloud:false },
    { sky:'linear-gradient(180deg,#1A237E 0%,#283593 50%,#1565C0 100%)', road:'#37474F', roadShadow:'#263238', cloud:false },
    { sky:'linear-gradient(180deg,#B0BEC5 0%,#ECEFF1 60%,#E3F2FD 100%)', road:'#78909C', roadShadow:'#546E7A', cloud:true  },
    { sky:'linear-gradient(180deg,#F48FB1 0%,#CE93D8 25%,#90CAF9 55%,#A5D6A7 100%)', road:'#8D6E63', roadShadow:'#6D4C41', cloud:true  },
  ];

  const FALLBACK = [
    { id:'pump_engine',    category:'fire',         name_ko:'펌프차',   file:'./assets/vehicles/fire/pump_engine.png',            sound_ko:'삐뽀삐뽀, 물을 뿜어요!' },
    { id:'ladder_truck',   category:'fire',         name_ko:'사다리차', file:'./assets/vehicles/fire/ladder_truck.png',           sound_ko:'사다리가 쭉쭉 올라가요!' },
    { id:'ambulance',      category:'rescue',       name_ko:'구급차',   file:'./assets/vehicles/rescue/ambulance.png',            sound_ko:'애앵애앵 도와주러 가요!' },
    { id:'excavator',      category:'construction', name_ko:'포크레인', file:'./assets/vehicles/construction/excavator.png',      sound_ko:'쿠궁쿠궁 흙을 퍼요!' },
    { id:'dump_truck',     category:'construction', name_ko:'덤프트럭', file:'./assets/vehicles/construction/dump_truck.png',     sound_ko:'우르르 짐을 내려요!' },
    { id:'concrete_mixer', category:'construction', name_ko:'레미콘',   file:'./assets/vehicles/construction/concrete_mixer.png', sound_ko:'빙글빙글 섞어요!' },
    { id:'train',          category:'transport',    name_ko:'기차',     file:'./assets/vehicles/transport/train.png',             sound_ko:'칙칙폭폭 달려요!' },
    { id:'bus',            category:'transport',    name_ko:'버스',     file:'./assets/vehicles/transport/bus.png',               sound_ko:'빵빵 친구들을 태워요!' },
    { id:'car',            category:'transport',    name_ko:'자동차',   file:'./assets/vehicles/transport/car.png',               sound_ko:'부릉부릉 달려요!' },
    { id:'airplane',       category:'transport',    name_ko:'비행기',   file:'./assets/vehicles/transport/airplane.png',          sound_ko:'슝 하늘을 날아요!' },
  ];

  function normalizeVehicle(item){
    if(!item) return null;
    const name  = item.name_ko || item.name || item.id || '자동차';
    const image = item.file || item.image || '';
    return {
      id: item.id || name,
      category: item.category || 'etc',
      name,
      image,
      sound: item.sound_ko || item.sound || name
    };
  }

  function shuffle(list){
    const arr = Array.isArray(list) ? [...list] : [];
    for(let i = arr.length - 1; i > 0; i -= 1){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function playGameVoice(id){
    if(!id) return;
    if(window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function'){
      window.SihyeonVoice.play(id).catch(()=>{});
    }
  }

  function getVehicleSoundVoiceId(vehicle){
    const map = {
      pump_engine: 'games.number.vehicleSound.siren',
      ladder_truck: 'games.number.vehicleSound.ladder',
      ambulance: 'games.number.vehicleSound.ambulance',
      excavator: 'games.number.vehicleSound.excavator',
      dump_truck: 'games.number.vehicleSound.dump',
      concrete_mixer: 'games.number.vehicleSound.mixer',
      train: 'games.number.vehicleSound.train',
      bus: 'games.number.vehicleSound.bus',
      car: 'games.number.vehicleSound.car',
      airplane: 'games.number.vehicleSound.airplane'
    };
    return map[vehicle && vehicle.id] || '';
  }

  function getAnswerMax(difficulty, level){
    if(difficulty === 1) return 5;
    if(difficulty === 2) return 9;
    return level <= 3 ? 5 : 9;
  }

  function pickAnswer(level, difficulty){
    const max = getAnswerMax(difficulty, level);
    return Math.floor(Math.random() * max) + 1;
  }

  function colsFor(n){
    if(n === 1) return 1;
    if(n <= 4) return 2;
    return 3;
  }

  function getChoices(answer, level, difficulty){
    const set = [answer];
    const max = getAnswerMax(difficulty, level);
    let attempts = 0;

    while(set.length < 3 && attempts < 80){
      attempts += 1;
      let n;
      if(max <= 5){
        const offset = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? 1 : -1);
        n = Math.max(1, Math.min(max, answer + offset));
      } else {
        n = Math.floor(Math.random() * max) + 1;
      }
      if(!set.includes(n)) set.push(n);
    }

    for(let n = 1; n <= max && set.length < 3; n += 1){
      if(!set.includes(n)) set.push(n);
    }

    return shuffle(set);
  }

  window.SihyeonGames[GAME_KEY] = {
    id: 'numberCount',
    title: '🚗',

    state: {
      currentLevel: 1,
      currentAnswer: 0,
      currentVehicle: null,
      correctCount: 0,
      wrongCount: 0,
      vehicles: [],
      gameVehicles: [],
      difficulty: 1,
      selectedVehicleCategory: 'all',
      container: null,
      styleElement: null,
      isAnimating: false,
      options: {},
      timeoutIds: [],
      audioCtx: null,
      layoutMode: 'portrait',
      resizeTimer: null,
      handleResizeBound: null,
      successRewardGiven: false,
      completeRewardGiven: false
    },

    initAudio:function(){
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if(!AudioContext) return;
      if(!this.state.audioCtx) this.state.audioCtx = new AudioContext();
      if(this.state.audioCtx.state === 'suspended') this.state.audioCtx.resume().catch(()=>{});
    },

    playTone:function(type){
      if(!this.state.audioCtx) return;
      const ctx = this.state.audioCtx;
      const now = ctx.currentTime;

      if(type === 'complete'){
        [440, 554.37, 659.25, 880].forEach((freq, i)=>{
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.6);
        });
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if(type === 'pop'){
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.2);
        return;
      }

      if(type === 'wrong'){
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    },

    render:async function(container, options = {}){
      this.destroy();
      this.state.container = container;
      this.state.options = options || {};
      this.initAudio();
      this.injectStyles();
      this.state.layoutMode = this.getLayoutMode();
      this.bindResizeEvents();

      container.innerHTML = `
        <div class="number-count-game number-count-root ${this.getLayoutClass()}">
          <div class="nc-loading-card">
            <div class="nc-loading-icon">🚗</div>
          </div>
        </div>`;

      await this.loadVehicles();
      if(this.state.container !== container) return;

      container.innerHTML = `
        <div class="number-count-game number-count-root ${this.getLayoutClass()}" id="ncGame">
          <div class="nc-cloud nc-c1"></div>
          <div class="nc-cloud nc-c2"></div>

          <div class="nc-game-header">
            <div class="nc-dot-progress" id="ncDotProgress"></div>
            <div class="nc-home-btn" id="ncPlazaBtn">🏠</div>
          </div>

          <div class="nc-difficulty-tabs" id="ncDifficultyTabs">
            <button type="button" class="nc-difficulty-tab active" data-difficulty="1">⭐1단계 1~5</button>
            <button type="button" class="nc-difficulty-tab" data-difficulty="2">⭐⭐2단계 1~9</button>
          </div>

          <div class="nc-vehicle-cat-tabs" id="ncVehicleCatTabs"></div>

          <div class="nc-objects-area" id="ncObjectsArea">
            <div class="nc-road-bg" id="ncRoadBg"></div>
            <div class="nc-vehicles-wrapper" id="ncVehiclesWrapper"></div>
          </div>

          <div class="nc-interaction-area">
            <div class="nc-choices-area" id="ncChoicesArea"></div>
          </div>

          <div class="nc-success-panel" id="ncSuccessPanel" style="display:none;">
            <div class="nc-action-buttons">
              <button type="button" class="nc-action-btn nc-btn-replay" id="ncRestartBtn">🔁</button>
              <button type="button" class="nc-action-btn nc-btn-next" id="ncNextBtn">🎲</button>
              <button type="button" class="nc-action-btn nc-btn-home2" id="ncPlazaBtn2">🏠</button>
            </div>
          </div>
        </div>`;

      this.attachEvents();
      this.startNewGameSession();
    },

    loadVehicles:async function(){
      try{
        const res = await fetch(MANIFEST_URL, { cache:'no-store' });
        if(!res.ok) throw new Error('manifest fail');
        const data = await res.json();
        const raw = Array.isArray(data.vehicles) ? data.vehicles : (Array.isArray(data) ? data : []);
        const list = raw.map(normalizeVehicle).filter(v => v && v.id && v.image && v.name);
        if(list.length < TOTAL_ROUNDS) throw new Error('too few');
        this.state.vehicles = list;
      }catch(e){
        this.state.vehicles = FALLBACK.map(normalizeVehicle).filter(Boolean);
      }
    },

    startNewGameSession:function(){
      this.clearTimers();
      const allVehicles = this.state.vehicles.length ? this.state.vehicles : FALLBACK.map(normalizeVehicle).filter(Boolean);
      const filtered = this.state.selectedVehicleCategory === 'all'
        ? allVehicles
        : allVehicles.filter(v => v.category === this.state.selectedVehicleCategory);
      const pool = filtered.length ? filtered : allVehicles;
      this.state.gameVehicles = shuffle(pool).slice(0, TOTAL_ROUNDS);
      this.state.completeRewardGiven = false;
      this.restart();
    },

    restart:function(){
      this.clearTimers();
      this.state.currentLevel = 1;
      this.state.currentAnswer = 0;
      this.state.currentVehicle = null;
      this.state.correctCount = 0;
      this.state.wrongCount = 0;
      this.state.isAnimating = false;
      this.state.difficulty = this.state.difficulty || 1;
      this.state.successRewardGiven = false;
      this.state.completeRewardGiven = false;

      const panel = this.query('#ncSuccessPanel');
      const choices = this.query('#ncChoicesArea');
      if(panel) panel.style.display = 'none';
      if(choices){
        choices.style.display = 'flex';
        choices.style.visibility = 'visible';
      }

      playGameVoice('games.number.intro');
      this.loadNextQuestion();
    },

    loadNextQuestion:function(){
      this.clearTimers();
      if(!this.state.container) return;
      if(this.state.currentLevel > TOTAL_ROUNDS){
        this.showCompleteScreen();
        return;
      }

      this.state.isAnimating = false;
      this.state.wrongCount = 0;
      this.state.successRewardGiven = false;
      this.state.currentAnswer = pickAnswer(this.state.currentLevel, this.state.difficulty);
      this.state.currentVehicle = this.state.gameVehicles[(this.state.currentLevel - 1) % this.state.gameVehicles.length];

      this.applyTheme(this.state.currentLevel - 1);
      this.renderDotProgress();

      const wrapper = this.query('#ncVehiclesWrapper');
      if(!wrapper) return;

      const count = this.state.currentAnswer;
      const cols = colsFor(count);
      wrapper.innerHTML = '';
      wrapper.className = `nc-vehicles-wrapper nc-count-${count}`;
      wrapper.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

      for(let i = 0; i < count; i += 1){
        const wrap = document.createElement('div');
        wrap.className = 'nc-vehicle-cell';
        wrap.style.transform = 'translateX(-110vw)';
        wrap.style.opacity = '0';
        wrap.style.transition = 'none';

        const img = document.createElement('img');
        img.src = this.state.currentVehicle.image;
        img.alt = '';
        img.className = 'nc-vehicle-img nc-idle-anim';
        img.draggable = false;
        img.onerror = ()=>{
          img.onerror = null;
          img.src = './assets/vehicles/transport/car.png';
        };

        wrap.appendChild(img);
        wrapper.appendChild(wrap);

        wrap.addEventListener('click', ()=>{
          this.initAudio();
          this.playTone('pop');
          playGameVoice(getVehicleSoundVoiceId(this.state.currentVehicle));
          this.say(this.state.currentVehicle.sound, true);
          wrap.style.transition = 'transform 0.15s';
          wrap.style.transform = 'scale(1.2) rotate(-5deg)';
          this.setManagedTimeout(()=>{ wrap.style.transform = ''; }, 160);
        });
      }

      const choicesArea = this.query('#ncChoicesArea');
      if(choicesArea) choicesArea.style.visibility = 'hidden';

      this.driveIn(wrapper, ()=>{
        if(choicesArea) choicesArea.style.visibility = 'visible';
        this.renderChoices();
        playGameVoice(getVehicleSoundVoiceId(this.state.currentVehicle));
        this.say(`시현아! ${this.state.currentVehicle.name}가 몇 대인지 세어볼까?`, true);
      });
    },

    driveIn:function(wrapper, done){
      const cells = Array.from(wrapper.querySelectorAll('.nc-vehicle-cell'));
      cells.forEach((cell, i)=>{
        this.setManagedTimeout(()=>{
          cell.style.transition = 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1), opacity 0.4s';
          cell.style.transform = 'translateX(0)';
          cell.style.opacity = '1';
        }, i * 100);
      });
      this.setManagedTimeout(done, cells.length * 100 + 400);
    },

    applyTheme:function(idx){
      const t = BG_THEMES[idx] || BG_THEMES[0];
      const game = this.query('#ncGame');
      const road = this.query('#ncRoadBg');
      const c1 = this.query('.nc-c1');
      const c2 = this.query('.nc-c2');
      if(game) game.style.background = t.sky;
      if(road){
        road.style.background = t.road;
        road.style.boxShadow = `0 12px 0 ${t.roadShadow}`;
      }
      if(c1) c1.style.opacity = t.cloud ? '0.82' : '0';
      if(c2) c2.style.opacity = t.cloud ? '0.82' : '0';

      const area = this.query('#ncObjectsArea');
      if(area) area.querySelectorAll('.nc-bg-star, .nc-snowflake').forEach(el => el.remove());
      if(idx === 2) this.spawnStars();
      if(idx === 3) this.spawnSnowflakes();
    },

    spawnStars:function(){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      for(let i = 0; i < 18; i += 1){
        const s = document.createElement('div');
        s.className = 'nc-bg-star';
        s.style.left = `${Math.random() * 100}%`;
        s.style.top = `${Math.random() * 55}%`;
        s.style.animationDelay = `${Math.random() * 3}s`;
        area.appendChild(s);
      }
    },

    spawnSnowflakes:function(){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      const flakes = ['❄', '❅', '❆', '✻'];
      for(let i = 0; i < 14; i += 1){
        const f = document.createElement('div');
        f.className = 'nc-snowflake';
        f.textContent = flakes[Math.floor(Math.random() * flakes.length)];
        f.style.left = `${Math.random() * 100}%`;
        f.style.animationDuration = `${3 + Math.random() * 4}s`;
        f.style.animationDelay = `${Math.random() * 4}s`;
        area.appendChild(f);
        this.setManagedTimeout(()=>{ if(f.parentNode) f.parentNode.removeChild(f); }, 9000);
      }
    },

    renderDotProgress:function(){
      const el = this.query('#ncDotProgress');
      if(!el) return;
      el.innerHTML = '';
      for(let i = 1; i <= TOTAL_ROUNDS; i += 1){
        const d = document.createElement('div');
        d.className = 'nc-dot'
          + (i < this.state.currentLevel ? ' done' : '')
          + (i === this.state.currentLevel ? ' active' : '');
        el.appendChild(d);
      }
    },

    renderChoices:function(){
      const area = this.query('#ncChoicesArea');
      if(!area) return;
      const ans = this.state.currentAnswer;
      const choices = getChoices(ans, this.state.currentLevel, this.state.difficulty);
      area.innerHTML = '';

      choices.forEach(num => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nc-toy-block-btn';
        btn.dataset.answer = String(num);
        if(num === ans) btn.dataset.correct = 'true';

        const dotHTML = '<span class="nc-choice-dot"></span>'.repeat(num);
        btn.innerHTML = `
          <div class="nc-choice-num">${num}</div>
          <div class="nc-choice-dots">${dotHTML}</div>
        `;
        btn.onclick = ()=>{
          this.initAudio();
          this.checkAnswer(num);
        };
        area.appendChild(btn);
      });
    },

    checkAnswer:function(selected){
      if(this.state.isAnimating || !this.state.container) return;
      const wrapper = this.query('#ncVehiclesWrapper');
      const choices = this.query('#ncChoicesArea');
      if(!wrapper || !choices) return;

      if(selected === this.state.currentAnswer){
        this.state.isAnimating = true;
        this.state.correctCount += 1;
        choices.querySelectorAll('button').forEach(b => { b.disabled = true; });

        this.flashScreen();
        this.playTone('pop');
        if(navigator.vibrate) try{ navigator.vibrate([100, 50, 100]); }catch(e){}

        this.runCountingHighlight(wrapper, ()=>{
          this.driveOut(wrapper, ()=>{
            this.showNumberStamp(this.state.currentAnswer);
            this.createParticles(15);
            this.showCorrectEmoji();
            const spokenNum = KOREAN_COUNT[this.state.currentAnswer] || this.state.currentAnswer;
            if(!this.state.successRewardGiven){
              this.state.successRewardGiven = true;
              if(this.state.options.fireConfetti) this.state.options.fireConfetti();
              playGameVoice('games.number.correct');
              this.say(`우와 맞았어! ${spokenNum} 대야!`, true);
            }

            this.setManagedTimeout(()=>{
              this.state.currentLevel += 1;
              this.state.isAnimating = false;
              this.loadNextQuestion();
            }, 3200);
          });
        });
        return;
      }

      this.state.isAnimating = true;
      this.state.wrongCount += 1;
      this.playTone('wrong');
      if(navigator.vibrate) try{ navigator.vibrate([50, 50]); }catch(e){}

      if(this.state.wrongCount >= 1){
        this.query('.nc-toy-block-btn[data-correct="true"]')?.classList.add('hint-glow');
      }

      playGameVoice('games.number.wrong');
      this.say('어라? 다시 한 번 천천히 세어보자!', true);
      this.showWrongFlash();
      wrapper.classList.add('shake');
      this.setManagedTimeout(()=>{
        wrapper.classList.remove('shake');
        this.state.isAnimating = false;
      }, 620);
    },

    flashScreen:function(){
      const game = this.query('#ncGame');
      if(!game) return;
      const flash = document.createElement('div');
      flash.className = 'nc-mega-flash';
      game.appendChild(flash);
      this.setManagedTimeout(()=>{ if(flash.parentNode) flash.parentNode.removeChild(flash); }, 600);
    },

    runCountingHighlight:function(wrapper, done){
      const cells = Array.from(wrapper.querySelectorAll('.nc-vehicle-cell'));
      const delay = 650;

      cells.forEach((cell, i)=>{
        this.setManagedTimeout(()=>{
          const dot = document.createElement('div');
          dot.className = 'nc-count-dot';
          dot.textContent = i + 1;
          cell.appendChild(dot);

          if(i === cells.length - 1){
            this.speakDirect(KOREAN_COUNT[i + 1] || String(i + 1));
          }
        }, i * delay);
      });

      this.setManagedTimeout(done, cells.length * delay + 300);
    },

    driveOut:function(wrapper, done){
      const cells = Array.from(wrapper.querySelectorAll('.nc-vehicle-cell'));
      cells.forEach((cell, i)=>{
        this.setManagedTimeout(()=>{
          cell.style.transition = 'transform 0.4s cubic-bezier(0.4,0,1,1), opacity 0.4s';
          cell.style.transform = 'translateX(130vw) rotate(10deg)';
          cell.style.opacity = '0';
        }, i * 60);
      });
      this.setManagedTimeout(done, cells.length * 60 + 400);
    },

    showNumberStamp:function(num){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      const stamp = document.createElement('div');
      stamp.className = 'nc-number-stamp';
      stamp.textContent = num;
      area.appendChild(stamp);

      this.speakDirect(KOREAN_COUNT[num] || String(num));

      this.setManagedTimeout(()=>{ if(stamp.parentNode) stamp.parentNode.removeChild(stamp); }, 1500);
    },

    showCorrectEmoji:function(){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      const ov = document.createElement('div');
      ov.className = 'nc-correct-overlay';
      ov.textContent = ['🎉', '🌟', '🏆', '✨'][Math.floor(Math.random() * 4)];
      area.appendChild(ov);
      this.setManagedTimeout(()=>{ if(ov.parentNode) ov.parentNode.removeChild(ov); }, 2000);
    },

    showWrongFlash:function(){
      const game = this.query('#ncGame');
      if(!game) return;
      const flash = document.createElement('div');
      flash.className = 'nc-wrong-flash';
      game.appendChild(flash);
      this.setManagedTimeout(()=>{ if(flash.parentNode) flash.parentNode.removeChild(flash); }, 600);

      const sad = document.createElement('div');
      sad.className = 'nc-sad-emoji';
      sad.textContent = ['😢', '🙈', '😅'][Math.floor(Math.random() * 3)];
      game.appendChild(sad);
      this.setManagedTimeout(()=>{ if(sad.parentNode) sad.parentNode.removeChild(sad); }, 800);
    },

    createParticles:function(count){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      const emojis = ['⭐', '✨', '🌟', '💫', '🎊'];
      for(let i = 0; i < count; i += 1){
        const s = document.createElement('div');
        s.className = 'nc-star';
        s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        s.style.left = `${20 + Math.random() * 60}%`;
        s.style.top = `${20 + Math.random() * 60}%`;
        s.style.animationDelay = `${Math.random() * 0.2}s`;

        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 100;
        s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

        area.appendChild(s);
        this.setManagedTimeout(()=>{ if(s.parentNode) s.parentNode.removeChild(s); }, 1000);
      }
    },

    showCompleteScreen:function(){
      const choices = this.query('#ncChoicesArea');
      const panel = this.query('#ncSuccessPanel');
      const wrapper = this.query('#ncVehiclesWrapper');
      if(!choices || !panel) return;
      this.clearTimers();
      this.state.isAnimating = false;
      choices.style.display = 'none';
      this.playTone('complete');

      const runCompleteReward = ()=>{
        if(this.state.completeRewardGiven) return;
        this.state.completeRewardGiven = true;
        playGameVoice('games.number.complete');
        this.say('우와! 다 맞혔어! 시현이 최고야!', true);
        if(this.state.options.fireConfetti) this.state.options.fireConfetti();
        if(this.state.options.gainExp) this.state.options.gainExp(30);
      };

      if(wrapper){
        this.driveOut(wrapper, ()=>{
          panel.style.display = 'flex';
          this.createParticles(30);
          runCompleteReward();
        });
      } else {
        panel.style.display = 'flex';
        runCompleteReward();
      }
    },

    attachEvents:function(){
      const restart = this.query('#ncRestartBtn');
      const next = this.query('#ncNextBtn');
      const home = this.query('#ncPlazaBtn');
      const home2 = this.query('#ncPlazaBtn2');

      if(restart) restart.onclick = ()=>{ this.initAudio(); this.restart(); };
      if(next) next.onclick = ()=>{ this.initAudio(); this.startNewGameSession(); };

      this.query('#ncDifficultyTabs')?.querySelectorAll('[data-difficulty]').forEach(btn=>{
        btn.onclick = ()=>{
          this.initAudio();
          const difficulty = Number(btn.dataset.difficulty) || 1;
          if(this.state.difficulty === difficulty || this.state.isAnimating) return;
          this.state.difficulty = difficulty;
          this.query('#ncDifficultyTabs')?.querySelectorAll('[data-difficulty]').forEach(tab=>{
            tab.classList.toggle('active', Number(tab.dataset.difficulty) === difficulty);
          });
          this.startNewGameSession();
        };
      });

      this.renderVehicleCategoryTabs();
      const goHome = ()=>{ if(this.state.options.closeToParkHome) this.state.options.closeToParkHome(); };
      if(home) home.onclick = goHome;
      if(home2) home2.onclick = goHome;
    },

    renderVehicleCategoryTabs:function(){
      const bar = this.query('#ncVehicleCatTabs');
      if(!bar) return;
      const available = new Set(this.state.vehicles.map(v => v.category));
      bar.innerHTML = VEHICLE_CATEGORIES
        .filter(cat => cat.id === 'all' || available.has(cat.id))
        .map(cat => `
          <button type="button"
            class="nc-vehicle-cat-tab ${this.state.selectedVehicleCategory === cat.id ? 'active' : ''}"
            data-vehicle-cat="${cat.id}">${cat.label}</button>
        `).join('');

      bar.querySelectorAll('[data-vehicle-cat]').forEach(btn=>{
        btn.onclick = ()=>{
          this.initAudio();
          const category = btn.dataset.vehicleCat || 'all';
          if(this.state.selectedVehicleCategory === category || this.state.isAnimating) return;
          this.state.selectedVehicleCategory = category;
          bar.querySelectorAll('[data-vehicle-cat]').forEach(tab=>{
            tab.classList.toggle('active', tab.dataset.vehicleCat === category);
          });
          this.startNewGameSession();
        };
      });
    },

    isLandscapeMode:function(){
      try{
        return window.matchMedia('(orientation: landscape) and (min-width: 768px) and (min-height: 520px)').matches;
      }catch(e){
        return window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
      }
    },

    getLayoutMode:function(){
      return this.isLandscapeMode() ? 'landscape' : 'portrait';
    },

    getLayoutClass:function(){
      const mode = this.getLayoutMode();
      this.state.layoutMode = mode;
      return `number-count-${mode}`;
    },

    applyLayoutClass:function(){
      const game = this.query('#ncGame') || this.state.container?.querySelector('.number-count-game');
      if(!game) return;
      game.classList.add('number-count-root');
      game.classList.remove('number-count-portrait', 'number-count-landscape');
      game.classList.add(`number-count-${this.getLayoutMode()}`);
    },

    bindResizeEvents:function(){
      if(this.state.handleResizeBound) return;
      this.state.handleResizeBound = ()=>this.handleResize();
      window.addEventListener('resize', this.state.handleResizeBound, { passive:true });
      window.addEventListener('orientationchange', this.state.handleResizeBound, { passive:true });
    },

    unbindResizeEvents:function(){
      if(!this.state.handleResizeBound) return;
      window.removeEventListener('resize', this.state.handleResizeBound);
      window.removeEventListener('orientationchange', this.state.handleResizeBound);
      this.state.handleResizeBound = null;
    },

    handleResize:function(){
      if(!this.state.container) return;
      if(this.state.resizeTimer) clearTimeout(this.state.resizeTimer);
      this.state.resizeTimer = setTimeout(()=>{
        this.state.resizeTimer = null;
        this.refreshLayoutOnly();
      }, 120);
    },

    refreshLayoutOnly:function(){
      if(!this.state.container) return;
      const nextMode = this.getLayoutMode();
      this.state.layoutMode = nextMode;
      this.applyLayoutClass();
    },

    say:function(text, force = false){
      if(!text) return;
      const raw = String(text).trim();
      const guideMap = [
        { test:/몇 대인지 세어볼까/, ids:['games.number.guide.countQuestion', 'games.number.countQuestion'] }
      ];
      const found = guideMap.find(item => item.test.test(raw));
      if(found) this.playFirstVoice(found.ids);
    },

    speakDirect:function(text){
      if(!text) return;
      const raw = String(text).trim();

      const countMap = {
        '하나': 1,
        '둘': 2,
        '셋': 3,
        '넷': 4,
        '다섯': 5,
        '여섯': 6,
        '일곱': 7,
        '여덟': 8,
        '아홉': 9
      };

      const unitMap = {
        '하나': 1,
        '한': 1,
        '둘': 2,
        '두': 2,
        '셋': 3,
        '세': 3,
        '넷': 4,
        '네': 4,
        '다섯': 5,
        '여섯': 6,
        '일곱': 7,
        '여덟': 8,
        '아홉': 9
      };

      const unitMatch = raw.match(/^(하나|한|둘|두|셋|세|넷|네|다섯|여섯|일곱|여덟|아홉)\s*대$/);
      if(unitMatch){
        const n = unitMap[unitMatch[1]];
        this.playFirstVoice([
          `games.number.countVehicle.${n}`,
          `games.number.countUnit.${n}`,
          `games.number.count.${n}`
        ]);
        return;
      }

      if(Object.prototype.hasOwnProperty.call(countMap, raw)){
        const n = countMap[raw];
        this.playFirstVoice([
          `games.number.count.${n}`,
          `games.number.koreanCount.${n}`
        ]);
      }
    },

    playFirstVoice:function(ids){
      if(!window.SihyeonVoice || typeof window.SihyeonVoice.play !== 'function') return;
      const list = Array.isArray(ids) ? ids.filter(Boolean) : [ids].filter(Boolean);
      let index = 0;
      const next = ()=>{
        const id = list[index++];
        if(!id) return;
        window.SihyeonVoice.play(id).catch(next);
      };
      next();
    },

    query:function(sel){
      return this.state.container ? this.state.container.querySelector(sel) : null;
    },

    setManagedTimeout:function(fn, delay){
      const id = setTimeout(()=>{
        this.state.timeoutIds = this.state.timeoutIds.filter(x => x !== id);
        fn();
      }, delay);
      this.state.timeoutIds.push(id);
      return id;
    },

    clearTimers:function(){
      this.state.timeoutIds.forEach(id => clearTimeout(id));
      this.state.timeoutIds = [];
    },

    injectStyles:function(){
      const ex = document.getElementById(STYLE_ID);
      if(ex) ex.remove();

      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        .number-count-game{
          width:100%;height:100%;min-height:100%;position:relative;overflow:hidden;
          display:flex;flex-direction:column;
          font-family:'Jua','Nanum Gothic','Apple SD Gothic Neo',sans-serif;
          transition:background 1s ease; isolation:isolate;
        }
        .number-count-root{box-sizing:border-box;}
        .number-count-root *{box-sizing:border-box;}
        .number-count-portrait{display:flex;flex-direction:column;}

        .number-count-landscape{
          display:grid;
          grid-template-columns:180px minmax(0,1fr) 220px;
          grid-template-rows:minmax(0,1fr) auto auto;
          gap:10px;
          padding:10px;
          align-items:stretch;
        }
        .number-count-landscape .nc-cloud{z-index:0;}
        .number-count-landscape .nc-vehicle-cat-tabs{
          grid-column:1;grid-row:1;
          display:grid;grid-auto-rows:min-content;align-content:start;
          gap:8px;overflow-y:auto;overflow-x:hidden;
          padding:2px 2px 6px;min-height:0;z-index:20;
        }
        .number-count-landscape .nc-game-header{
          grid-column:1;grid-row:2;margin:0;border-radius:22px;min-height:52px;
          align-self:end;padding:8px 10px;z-index:20;
        }
        .number-count-landscape .nc-dot-progress{gap:6px;flex-wrap:wrap;}
        .number-count-landscape .nc-dot{width:18px;height:18px;border-width:2px;}
        .number-count-landscape .nc-home-btn{font-size:27px;}
        .number-count-landscape .nc-difficulty-tabs{
          grid-column:1;grid-row:3;display:grid;grid-template-columns:1fr;gap:8px;
          padding:0;align-self:end;z-index:20;
        }
        .number-count-landscape .nc-difficulty-tab{width:100%;min-height:48px;font-size:clamp(15px,1.45vw,20px);}
        .number-count-landscape .nc-vehicle-cat-tab{width:100%;min-height:47px;font-size:clamp(14px,1.35vw,19px);}
        .number-count-landscape .nc-objects-area{
          grid-column:2;grid-row:1 / span 3;
          padding:clamp(8px,1vw,16px);border-radius:30px;border:5px solid rgba(255,255,255,.55);
          background:rgba(255,255,255,.16);box-shadow:inset 0 4px 0 rgba(255,255,255,.22),0 10px 28px rgba(0,0,0,.08);
        }
        .number-count-landscape .nc-vehicles-wrapper{
          width:min(100%,1120px);height:100%;align-content:center;justify-content:center;
          gap:clamp(8px,1.6vw,24px);padding:0;
        }
        .number-count-landscape .nc-road-bg{height:clamp(54px,7vw,92px);bottom:7%;}
        .number-count-landscape .nc-interaction-area{
          grid-column:3;grid-row:1 / span 3;
          display:flex;align-items:center;justify-content:center;padding:0;min-height:0;z-index:20;
        }
        .number-count-landscape .nc-choices-area{
          width:100%;display:grid;grid-template-columns:1fr;gap:14px;align-content:center;justify-items:center;
        }
        .number-count-landscape .nc-toy-block-btn{width:min(100%,194px);min-height:clamp(120px,22vh,180px);font-size:clamp(48px,7vw,78px);}
        .number-count-landscape .nc-choice-num{font-size:clamp(48px,6vw,80px);}
        .number-count-landscape .nc-success-panel{left:50%;right:auto;bottom:20px;width:min(520px,46vw);transform:translateX(-50%);border-radius:35px;padding:24px;}

        .number-count-landscape .nc-count-1 .nc-vehicle-img{width:clamp(280px,30vw,430px);max-height:clamp(230px,30vw,390px);}
        .number-count-landscape .nc-count-2 .nc-vehicle-img{width:clamp(240px,25vw,360px);max-height:clamp(210px,25vw,330px);}
        .number-count-landscape .nc-count-3 .nc-vehicle-img,
        .number-count-landscape .nc-count-4 .nc-vehicle-img{width:clamp(190px,21vw,310px);max-height:clamp(170px,21vw,280px);}
        .number-count-landscape .nc-count-5 .nc-vehicle-img,
        .number-count-landscape .nc-count-6 .nc-vehicle-img{width:clamp(160px,17vw,250px);max-height:clamp(140px,17vw,220px);}
        .number-count-landscape .nc-count-7 .nc-vehicle-img,
        .number-count-landscape .nc-count-8 .nc-vehicle-img,
        .number-count-landscape .nc-count-9 .nc-vehicle-img{width:clamp(135px,14vw,210px);max-height:clamp(120px,14vw,190px);}

        .nc-mega-flash{position:absolute;inset:0;z-index:999;pointer-events:none;background:#fff;animation:ncFlashAnim 0.5s ease-out forwards;}
        @keyframes ncFlashAnim{0%{opacity:.9;}100%{opacity:0;}}

        .nc-loading-card{flex:1;display:flex;align-items:center;justify-content:center;}
        .nc-loading-icon{font-size:clamp(80px,22vw,160px);filter:drop-shadow(0 12px 0 rgba(0,0,0,.12));animation:ncLoadBounce .9s ease-in-out infinite alternate;}
        @keyframes ncLoadBounce{from{transform:translateY(0) rotate(-3deg);}to{transform:translateY(-16px) rotate(3deg);}}

        .nc-cloud{position:absolute;background:#fff;border-radius:50px;z-index:0;pointer-events:none;transition:opacity .8s;}
        .nc-cloud:before,.nc-cloud:after{content:'';position:absolute;background:#fff;border-radius:50%;}
        .nc-c1{width:130px;height:44px;top:12%;left:6%;animation:ncCloud 28s linear infinite;}
        .nc-c1:before{width:52px;height:52px;top:-22px;left:14px;}
        .nc-c1:after{width:62px;height:62px;top:-32px;left:46px;}
        .nc-c2{width:105px;height:36px;top:24%;right:-8%;animation:ncCloud 38s linear infinite reverse;}
        .nc-c2:before{width:42px;height:42px;top:-16px;left:10px;}
        .nc-c2:after{width:52px;height:52px;top:-22px;left:42px;}
        @keyframes ncCloud{from{transform:translateX(-18vw);}to{transform:translateX(115vw);}}

        .nc-bg-star{position:absolute;width:8px;height:8px;border-radius:50%;background:#fff;pointer-events:none;z-index:1;animation:ncTwinkle 2s ease-in-out infinite alternate;}
        @keyframes ncTwinkle{from{opacity:.2;transform:scale(.8);}to{opacity:1;transform:scale(1.5);box-shadow:0 0 10px #fff;}}
        .nc-snowflake{position:absolute;top:-40px;font-size:clamp(16px,4vw,26px);color:rgba(255,255,255,.9);pointer-events:none;z-index:2;animation:ncSnowFall linear infinite;}
        @keyframes ncSnowFall{0%{top:-40px;transform:translateX(0) rotate(0deg);}100%{top:110%;transform:translateX(30px) rotate(360deg);}}

        .nc-game-header{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;min-height:55px;background:rgba(255,255,255,.6);backdrop-filter:blur(8px);box-shadow:0 4px 15px rgba(0,0,0,.08);border-radius:0 0 25px 25px;}
        .nc-dot-progress{display:flex;gap:12px;align-items:center;}
        .nc-dot{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.6);border:3px solid rgba(255,255,255,.9);box-shadow:0 2px 6px rgba(0,0,0,.15);transition:background .3s,transform .3s,box-shadow .3s;}
        .nc-dot.done{background:#4CAF50;border-color:#fff;}
        .nc-dot.active{background:#FF7A1A;border-color:#fff;transform:scale(1.4);box-shadow:0 0 0 4px rgba(255,122,26,.3);}
        .nc-home-btn{font-size:32px;cursor:pointer;user-select:none;line-height:1;transition:transform .15s;}
        .nc-home-btn:active{transform:scale(.85);}

        .nc-difficulty-tabs{position:relative;z-index:10;display:flex;justify-content:center;gap:10px;padding:12px 10px 4px;}
        .nc-difficulty-tab{min-height:40px;padding:0 15px;border:4px solid rgba(255,255,255,.9);border-radius:20px;background:rgba(255,255,255,.7);color:#1B5E20;font-family:'Jua',sans-serif;font-size:clamp(15px,3.8vw,20px);font-weight:900;box-shadow:0 5px 0 rgba(0,0,0,.1);cursor:pointer;transition:all .2s;}
        .nc-difficulty-tab.active{background:#FFD93D;color:#3E2723;box-shadow:0 5px 0 #F57F17;transform:translateY(-2px);}

        .nc-vehicle-cat-tabs{position:relative;z-index:10;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:8px 12px 6px;}
        .nc-vehicle-cat-tabs::-webkit-scrollbar{display:none;}
        .nc-vehicle-cat-tab{flex:0 0 auto;min-height:38px;padding:0 15px;border:4px solid rgba(255,255,255,.9);border-radius:999px;background:rgba(255,255,255,.7);color:#263238;font-family:'Jua',sans-serif;font-size:clamp(14px,3.5vw,18px);font-weight:900;box-shadow:0 5px 0 rgba(0,0,0,.1);cursor:pointer;white-space:nowrap;transition:all .2s;}
        .nc-vehicle-cat-tab.active{background:#B3E5FC;color:#0D47A1;box-shadow:0 5px 0 rgba(13,71,161,.25);transform:translateY(-2px);}

        .nc-objects-area{flex:1;min-height:0;position:relative;z-index:5;display:flex;align-items:center;justify-content:center;padding:clamp(10px,2vw,20px);overflow:hidden;}
        .nc-road-bg{position:absolute;bottom:8%;left:-15%;right:-15%;height:clamp(50px,10vw,90px);border-radius:50%;transform:rotateX(72deg);border:4px solid rgba(255,255,255,.7);z-index:0;transition:background .8s,box-shadow .8s;}
        .nc-vehicles-wrapper{position:relative;z-index:10;width:min(100%,800px);display:grid;gap:clamp(10px,3vw,30px);padding:5px;justify-items:center;align-items:center;}
        .nc-vehicle-cell{position:relative;display:flex;align-items:flex-end;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;}
        .nc-vehicle-img{width:clamp(95px,24vw,230px);max-height:clamp(85px,22vw,210px);object-fit:contain;user-select:none;pointer-events:none;filter:drop-shadow(0 12px 15px rgba(0,0,0,.3));}
        .nc-idle-anim{animation:ncIdleBounce 1.5s ease-in-out infinite alternate;}
        @keyframes ncIdleBounce{from{transform:translateY(0);}to{transform:translateY(-8px);}}

        .nc-count-dot{position:absolute;top:-25px;left:50%;transform:translateX(-50%);width:clamp(32px,8vw,48px);height:clamp(32px,8vw,48px);border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff 0%,#FFD700 50%,#FF8C00 100%);border:4px solid #fff;box-shadow:0 0 15px 5px rgba(255,200,0,.8);display:flex;align-items:center;justify-content:center;font-size:clamp(16px,4vw,24px);font-weight:900;color:#7B3F00;animation:ncCountPop .35s cubic-bezier(.175,.885,.32,1.275);pointer-events:none;z-index:20;}
        @keyframes ncCountPop{0%{transform:translateX(-50%) scale(0);}70%{transform:translateX(-50%) scale(1.3);}100%{transform:translateX(-50%) scale(1);}}
        .shake{animation:ncShake .45s ease-in-out;}
        @keyframes ncShake{0%,100%{transform:translateX(0);}22%{transform:translateX(-16px) rotate(-4deg);}66%{transform:translateX(16px) rotate(4deg);}}

        .nc-wrong-flash{position:absolute;inset:0;z-index:50;pointer-events:none;background:rgba(255,0,0,.3);animation:ncRedFlash .6s ease-out forwards;}
        @keyframes ncRedFlash{0%{opacity:0;}20%{opacity:1;}100%{opacity:0;}}
        .nc-sad-emoji{position:absolute;top:50%;left:50%;z-index:55;pointer-events:none;font-size:clamp(70px,20vw,140px);transform:translate(-50%,-50%);animation:ncSadPop .8s cubic-bezier(.175,.885,.32,1.275) forwards;}
        @keyframes ncSadPop{0%{transform:translate(-50%,-50%) scale(0);opacity:0;}40%{transform:translate(-50%,-50%) scale(1.2);opacity:1;}75%{transform:translate(-50%,-50%) scale(1);opacity:1;}100%{transform:translate(-50%,-50%) scale(.8);opacity:0;}}
        .nc-correct-overlay{position:absolute;top:10%;right:5%;z-index:30;pointer-events:none;font-size:clamp(60px,15vw,120px);animation:ncCornerPop 2s cubic-bezier(.175,.885,.32,1.275) forwards;}
        @keyframes ncCornerPop{0%{transform:scale(0) rotate(-25deg);opacity:0;}30%{transform:scale(1.4) rotate(10deg);opacity:1;}70%{transform:scale(1.1) rotate(-5deg);opacity:1;}100%{transform:scale(1.5) rotate(0);opacity:0;}}
        .nc-number-stamp{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);font-size:clamp(150px,40vw,250px);font-weight:900;color:#FFD700;text-shadow:0 0 60px rgba(255,200,0,.8),0 0 20px rgba(255,150,0,.5),0 10px 0 rgba(0,0,0,.2);z-index:300;pointer-events:none;animation:ncStampPop 1.2s cubic-bezier(.34,1.56,.64,1) forwards;line-height:1;}
        @keyframes ncStampPop{0%{transform:translate(-50%,-50%) scale(0) rotate(-15deg);opacity:1;}40%{transform:translate(-50%,-50%) scale(1.15) rotate(5deg);opacity:1;}70%{transform:translate(-50%,-50%) scale(1) rotate(0deg);opacity:1;}100%{transform:translate(-50%,-60%) scale(.8) rotate(0deg);opacity:0;}}
        .nc-star{position:absolute;pointer-events:none;z-index:20;font-size:clamp(30px,8vw,60px);animation:ncStarBurst 1s forwards cubic-bezier(.1,.8,.2,1);}
        @keyframes ncStarBurst{0%{transform:scale(0) rotate(0deg);opacity:1;}100%{transform:translate(var(--dx),var(--dy)) scale(1.5) rotate(360deg);opacity:0;}}

        .nc-interaction-area{position:relative;z-index:10;padding:10px clamp(12px,4vw,25px) max(20px,env(safe-area-inset-bottom));}
        .nc-choices-area{display:flex;justify-content:center;gap:clamp(15px,4vw,30px);flex-wrap:wrap;}
        .nc-toy-block-btn{width:clamp(95px,24vw,150px);min-height:clamp(110px,26vw,170px);font-size:clamp(48px,12vw,80px);font-weight:900;font-family:'Jua',sans-serif;border-radius:30px;border:6px solid #fff;color:#fff;background:linear-gradient(135deg,#FFD93D,#FFAA00);box-shadow:0 12px 0 #E65100,0 15px 25px rgba(0,0,0,.25);transition:transform .1s,box-shadow .1s,filter .15s;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 8px;-webkit-tap-highlight-color:transparent;}
        .nc-toy-block-btn:nth-child(2){background:linear-gradient(135deg,#4CAF50,#2E7D32);box-shadow:0 12px 0 #1B5E20,0 15px 25px rgba(0,0,0,.25);}
        .nc-toy-block-btn:nth-child(3){background:linear-gradient(135deg,#1E90FF,#1565C0);box-shadow:0 12px 0 #0D47A1,0 15px 25px rgba(0,0,0,.25);}
        .nc-toy-block-btn:active{transform:translateY(12px);box-shadow:0 0 0 transparent,0 5px 10px rgba(0,0,0,.2);}
        .nc-toy-block-btn:disabled{filter:saturate(.5) brightness(.9);cursor:default;}
        .nc-toy-block-btn.hint-glow{animation:ncBtnGlow .6s ease-in-out infinite alternate !important;}
        @keyframes ncBtnGlow{from{filter:brightness(1) drop-shadow(0 0 5px rgba(255,255,255,.4));}to{filter:brightness(1.3) drop-shadow(0 0 25px rgba(255,255,255,1));}}
        .nc-choice-num{font-size:clamp(48px,12vw,80px);font-weight:900;line-height:1;text-shadow:0 4px 0 rgba(0,0,0,.25);}
        .nc-choice-dots{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:40px;margin:0 auto;}
        .nc-choice-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 2px 0 rgba(0,0,0,.15);}

        .nc-success-panel{position:absolute;bottom:0;left:0;right:0;z-index:100;flex-direction:column;align-items:center;padding:25px 16px max(25px,env(safe-area-inset-bottom));background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border-radius:35px 35px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.2);animation:ncSlideUp .5s cubic-bezier(.175,.885,.32,1.275);}
        @keyframes ncSlideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
        .nc-action-buttons{display:flex;gap:20px;justify-content:center;}
        .nc-action-btn{width:clamp(90px,22vw,120px);height:clamp(90px,22vw,120px);font-size:clamp(40px,10vw,60px);border-radius:50%;border:6px solid #fff;box-shadow:0 10px 0 rgba(0,0,0,.15);transition:transform .1s,box-shadow .1s;cursor:pointer;}
        .nc-action-btn:active{transform:translateY(8px);box-shadow:0 2px 0 rgba(0,0,0,.15);}
        .nc-btn-replay{background:#4CAF50;}.nc-btn-next{background:#2196F3;}.nc-btn-home2{background:#FF9800;}

        @media (orientation:landscape) and (min-width:1024px) and (min-height:640px){
          .number-count-landscape{grid-template-columns:200px minmax(0,1fr) 240px;gap:12px;padding:12px;}
          .number-count-landscape .nc-objects-area{border-radius:38px;border-width:7px;}
          .number-count-landscape .nc-vehicles-wrapper{width:min(100%,1180px);}
          .number-count-landscape .nc-toy-block-btn{width:min(100%,214px);min-height:clamp(136px,23vh,200px);}
          .number-count-landscape .nc-choice-num{font-size:clamp(58px,6vw,86px);}
        }

        @media (orientation:landscape) and (max-height:520px){
          .number-count-landscape{grid-template-columns:108px minmax(0,1fr) 118px;grid-template-rows:minmax(0,1fr) auto auto;gap:4px;padding:4px;}
          .number-count-landscape .nc-game-header{min-height:36px;padding:4px 6px;border-radius:12px;}
          .number-count-landscape .nc-dot-progress{gap:3px;}
          .number-count-landscape .nc-dot{width:11px;height:11px;border-width:1px;}
          .number-count-landscape .nc-dot.active{transform:scale(1.28);box-shadow:0 0 0 2px rgba(255,122,26,.25);}
          .number-count-landscape .nc-home-btn{font-size:18px;}
          .number-count-landscape .nc-difficulty-tabs{gap:4px;}
          .number-count-landscape .nc-difficulty-tab{min-height:30px;font-size:10px;border-width:2px;padding:0 4px;border-radius:11px;box-shadow:0 3px 0 rgba(0,0,0,.1);}
          .number-count-landscape .nc-vehicle-cat-tabs{gap:4px;padding:0 1px 4px;}
          .number-count-landscape .nc-vehicle-cat-tab{min-height:30px;font-size:10px;border-width:2px;padding:0 4px;border-radius:10px;box-shadow:0 3px 0 rgba(0,0,0,.1);}
          .number-count-landscape .nc-objects-area{border-width:2px;border-radius:14px;padding:4px;}
          .number-count-landscape .nc-vehicles-wrapper{width:100%;gap:clamp(4px,1vw,9px);}
          .number-count-landscape .nc-road-bg{height:38px;bottom:5%;}
          .number-count-landscape .nc-count-1 .nc-vehicle-img{width:clamp(150px,28vw,230px);max-height:clamp(120px,27vw,200px);}
          .number-count-landscape .nc-count-2 .nc-vehicle-img{width:clamp(130px,22vw,190px);max-height:clamp(110px,22vw,170px);}
          .number-count-landscape .nc-count-3 .nc-vehicle-img,
          .number-count-landscape .nc-count-4 .nc-vehicle-img{width:clamp(100px,18vw,150px);max-height:clamp(86px,18vw,135px);}
          .number-count-landscape .nc-count-5 .nc-vehicle-img,
          .number-count-landscape .nc-count-6 .nc-vehicle-img{width:clamp(78px,14vw,120px);max-height:clamp(68px,14vw,106px);}
          .number-count-landscape .nc-count-7 .nc-vehicle-img,
          .number-count-landscape .nc-count-8 .nc-vehicle-img,
          .number-count-landscape .nc-count-9 .nc-vehicle-img{width:clamp(64px,12vw,102px);max-height:clamp(58px,12vw,92px);}
          .number-count-landscape .nc-interaction-area{padding:0;}
          .number-count-landscape .nc-choices-area{gap:6px;}
          .number-count-landscape .nc-toy-block-btn{width:min(100%,106px);min-height:78px;border-width:3px;border-radius:16px;padding:6px 4px;box-shadow:0 6px 0 #E65100,0 8px 14px rgba(0,0,0,.18);}
          .number-count-landscape .nc-toy-block-btn:nth-child(2){box-shadow:0 6px 0 #1B5E20,0 8px 14px rgba(0,0,0,.18);}
          .number-count-landscape .nc-toy-block-btn:nth-child(3){box-shadow:0 6px 0 #0D47A1,0 8px 14px rgba(0,0,0,.18);}
          .number-count-landscape .nc-choice-num{font-size:36px;}
          .number-count-landscape .nc-choice-dots{max-width:28px;gap:3px;}
          .number-count-landscape .nc-choice-dot{width:7px;height:7px;}
        }

        @media (max-width:380px){
          .nc-vehicle-img{width:clamp(75px,24vw,115px);max-height:85px;}
          .nc-toy-block-btn{width:85px;min-height:95px;font-size:38px;}
          .nc-choice-dots{max-width:30px;}
          .nc-choice-dot{width:8px;height:8px;}
        }

        @media (max-height:600px) and (orientation:portrait){
          .nc-vehicle-img{width:clamp(65px,15vw,115px);max-height:80px;}
          .nc-toy-block-btn{width:80px;min-height:90px;}
          .nc-game-header{min-height:42px;padding:6px 14px;}
        }
      `;
      document.head.appendChild(style);
      this.state.styleElement = style;
    },

    destroy:function(){
      this.clearTimers();
      if(this.state.resizeTimer){
        clearTimeout(this.state.resizeTimer);
        this.state.resizeTimer = null;
      }
      this.unbindResizeEvents();
      if(this.state.styleElement){
        this.state.styleElement.remove();
        this.state.styleElement = null;
      }
      if(this.state.container){
        this.state.container.innerHTML = '';
      }
      if(this.state.audioCtx && this.state.audioCtx.state !== 'closed'){
        this.state.audioCtx.close().catch(()=>{});
      }

      this.state.currentLevel = 1;
      this.state.currentAnswer = 0;
      this.state.currentVehicle = null;
      this.state.correctCount = 0;
      this.state.wrongCount = 0;
      this.state.isAnimating = false;
      this.state.difficulty = 1;
      this.state.selectedVehicleCategory = 'all';
      this.state.gameVehicles = [];
      this.state.container = null;
      this.state.options = {};
      this.state.audioCtx = null;
      this.state.layoutMode = 'portrait';
      this.state.successRewardGiven = false;
      this.state.completeRewardGiven = false;
    }
  };
})();
