/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - NUMBER COUNT GAME MODULE
   js/games/number-count.js
═══════════════════════════════════════════ */
(function(){
  window.SihyeonGames = window.SihyeonGames || {};

  const STYLE_ID = 'sihyeon-number-count-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';
  
  const FALLBACK = [
    // 소방차
    { id:'pump_engine', category:'fire', name_ko:'펌프차', file:'./assets/vehicles/fire/pump_engine.png', sound_ko:'삐뽀삐뽀, 물을 뿜어요!' },
    { id:'water_tanker', category:'fire', name_ko:'물탱크차', file:'./assets/vehicles/fire/water_tanker.png', sound_ko:'출렁출렁 물을 싣고 가요!' },
    { id:'ladder_truck', category:'fire', name_ko:'사다리차', file:'./assets/vehicles/fire/ladder_truck.png', sound_ko:'사다리가 쭉쭉 올라가요!' },
    { id:'aerial_ladder_truck', category:'fire', name_ko:'고가사다리차', file:'./assets/vehicles/fire/aerial_ladder_truck.png', sound_ko:'높이높이 올라가요!' },
    { id:'articulating_ladder_truck', category:'fire', name_ko:'굴절사다리차', file:'./assets/vehicles/fire/articulating_ladder_truck.png', sound_ko:'팔이 꺾여서 슈욱 움직여요!' },
    { id:'rescue_fire_truck', category:'fire', name_ko:'구조공작차', file:'./assets/vehicles/fire/rescue_fire_truck.png', sound_ko:'구조 장비를 싣고 출동해요!' },
    { id:'airport_fire_truck', category:'fire', name_ko:'공항소방차', file:'./assets/vehicles/fire/airport_fire_truck.png', sound_ko:'커다란 바퀴로 힘차게 출동해요!' },
    { id:'foam_fire_truck', category:'fire', name_ko:'포소화차', file:'./assets/vehicles/fire/foam_fire_truck.png', sound_ko:'몽글몽글 거품을 뿜어요!' },
    { id:'fire_command_vehicle', category:'fire', name_ko:'소방 지휘차', file:'./assets/vehicles/fire/fire_command_vehicle.png', sound_ko:'현장을 살피며 지휘해요!' },
    // 경찰차
    { id:'korean_police_car', category:'police', name_ko:'한국 경찰차', file:'./assets/vehicles/police/korean_police_car.png', sound_ko:'위용위용 순찰해요!' },
    { id:'us_police_car', category:'police', name_ko:'미국 경찰차', file:'./assets/vehicles/police/us_police_car.png', sound_ko:'우웅, 멋지게 달려요!' },
    { id:'police_motorcycle', category:'police', name_ko:'경찰 오토바이', file:'./assets/vehicles/police/police_motorcycle.png', sound_ko:'부릉부릉 빠르게 달려요!' },
    { id:'swat_truck', category:'police', name_ko:'경찰특공대차', file:'./assets/vehicles/police/swat_truck.png', sound_ko:'튼튼하게 출동해요!' },
    { id:'forensic_bus', category:'police', name_ko:'과학수사버스', file:'./assets/vehicles/police/forensic_bus.png', sound_ko:'차근차근 단서를 찾아요!' },
    { id:'riot_police_bus', category:'police', name_ko:'기동대 버스', file:'./assets/vehicles/police/riot_police_bus.png', sound_ko:'큰 버스가 안전하게 이동해요!' },
    // 구급/구조
    { id:'ambulance', category:'rescue', name_ko:'구급차', file:'./assets/vehicles/rescue/ambulance.png', sound_ko:'애앵애앵 도와주러 가요!' },
    { id:'doctor_car', category:'rescue', name_ko:'닥터카', file:'./assets/vehicles/rescue/doctor_car.png', sound_ko:'의사 선생님이 빨리 도착해요!' },
    { id:'rescue_helicopter', category:'rescue', name_ko:'구조 헬기', file:'./assets/vehicles/rescue/rescue_helicopter.png', sound_ko:'두두두두 하늘을 날아요!' },
    // 중장비
    { id:'excavator', category:'construction', name_ko:'포크레인', file:'./assets/vehicles/construction/excavator.png', sound_ko:'쿠궁쿠궁 흙을 퍼요!' },
    { id:'mini_excavator', category:'construction', name_ko:'미니 굴착기', file:'./assets/vehicles/construction/mini_excavator.png', sound_ko:'작지만 힘차게 파요!' },
    { id:'bulldozer', category:'construction', name_ko:'불도저', file:'./assets/vehicles/construction/bulldozer.png', sound_ko:'쓱쓱 밀고 지나가요!' },
    { id:'wheel_loader', category:'construction', name_ko:'휠로더', file:'./assets/vehicles/construction/wheel_loader.png', sound_ko:'커다란 삽으로 담아요!' },
    { id:'dump_truck', category:'construction', name_ko:'덤프트럭', file:'./assets/vehicles/construction/dump_truck.png', sound_ko:'우르르 짐을 내려요!' },
    { id:'concrete_mixer', category:'construction', name_ko:'레미콘', file:'./assets/vehicles/construction/concrete_mixer.png', sound_ko:'빙글빙글 섞어요!' },
    { id:'concrete_pump_truck', category:'construction', name_ko:'콘크리트 펌프카', file:'./assets/vehicles/construction/concrete_pump_truck.png', sound_ko:'쭉쭉 뻗어서 보내요!' },
    { id:'crane_truck', category:'construction', name_ko:'크레인차', file:'./assets/vehicles/construction/crane_truck.png', sound_ko:'번쩍 들어 올려요!' },
    { id:'forklift', category:'construction', name_ko:'지게차', file:'./assets/vehicles/construction/forklift.png', sound_ko:'삐리리 짐을 들어요!' },
    // 이동수단
    { id:'train', category:'transport', name_ko:'기차', file:'./assets/vehicles/transport/train.png', sound_ko:'칙칙폭폭 달려요!' },
    { id:'bus', category:'transport', name_ko:'버스', file:'./assets/vehicles/transport/bus.png', sound_ko:'빵빵 친구들을 태워요!' },
    { id:'car', category:'transport', name_ko:'자동차', file:'./assets/vehicles/transport/car.png', sound_ko:'부릉부릉 달려요!' },
    { id:'taxi', category:'transport', name_ko:'택시', file:'./assets/vehicles/transport/taxi.png', sound_ko:'띠띠 목적지로 가요!' },
    { id:'school_bus', category:'transport', name_ko:'스쿨버스', file:'./assets/vehicles/transport/school_bus.png', sound_ko:'친구들을 데리러 가요!' },
    { id:'rocket', category:'transport', name_ko:'로켓', file:'./assets/vehicles/transport/rocket.png', sound_ko:'슈우웅 하늘로 날아요!' },
    { id:'submarine', category:'transport', name_ko:'잠수함', file:'./assets/vehicles/transport/submarine.png', sound_ko:'꼬르륵 바닷속으로 가요!' },
    { id:'tow_truck', category:'transport', name_ko:'견인차', file:'./assets/vehicles/transport/tow_truck.png', sound_ko:'고장난 차를 도와줘요!' },
    { id:'garbage_truck', category:'transport', name_ko:'청소차', file:'./assets/vehicles/transport/garbage_truck.png', sound_ko:'쓱싹쓱싹 깨끗하게 해요!' },
    { id:'tractor', category:'transport', name_ko:'트랙터', file:'./assets/vehicles/transport/tractor.png', sound_ko:'덜컹덜컹 밭으로 가요!' },
    { id:'airplane', category:'transport', name_ko:'비행기', file:'./assets/vehicles/transport/airplane.png', sound_ko:'슝 하늘을 날아요!' },
    { id:'helicopter', category:'transport', name_ko:'헬리콥터', file:'./assets/vehicles/transport/helicopter.png', sound_ko:'두두두두 날아가요!' }
  ];

  function normalizeVehicle(item){
    if(!item) return null;
    const name = item.name_ko || item.name || item.id || '자동차';
    const image = item.file || item.image || '';
    return { id:item.id || name, category:item.category || 'etc', name, image, sound:item.sound_ko || name };
  }

  function shuffle(list){
    const arr = Array.isArray(list) ? list : [];
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }

  function playGameVoice(id) {
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(id).catch(() => {});
    }
  }

  window.SihyeonGames.numberCount = {
    id:'numberCount',
    title:'🚗 차량 몇 대일까?',
    state:{
      currentLevel:1,
      currentAnswer:0,
      currentVehicle:null,
      correctCount:0,
      vehicles:[],
      gameVehicles:[],
      container:null,
      styleElement:null,
      isAnimating:false,
      options:{},
      timeoutIds:[]
    },

    render: async function(container, options={}){
      this.destroy();
      this.state.container = container;
      this.state.options = options || {};
      this.injectStyles();

      container.innerHTML = `
        <div class="number-count-game">
          <div class="nc-loading-card">
            <div class="nc-loading-icon">🚗</div>
            <div>자동차 친구들을 부르고 있어요...</div>
          </div>
        </div>
      `;

      await this.loadVehicles();
      if(this.state.container !== container) return;

      container.innerHTML = `
        <div class="number-count-game">
          <div class="nc-cloud nc-c1"></div>
          <div class="nc-cloud nc-c2"></div>
          <div class="nc-game-header">
            <h1 class="nc-game-title">🚗 몇 개일까?</h1>
            <div class="nc-level-badge" id="ncLevelBadge">1 / 5</div>
          </div>
          <div class="nc-objects-area" id="ncObjectsArea">
            <div class="nc-road-bg"></div>
            <div class="nc-vehicles-wrapper" id="ncVehiclesWrapper"></div>
          </div>
          <div class="nc-feedback-area" id="ncFeedback"></div>
          <div class="nc-interaction-area" id="ncInteractionArea">
            <div class="nc-choices-area" id="ncChoicesArea"></div>
            <div class="nc-success-panel" id="ncSuccessPanel" style="display:none;">
              <h2 class="nc-success-title">🎉 대단해! 다 맞혔어!</h2>
              <div class="nc-action-buttons">
                <button type="button" class="nc-action-btn nc-btn-replay" id="ncRestartBtn">🔁 다시 하기</button>
                <button type="button" class="nc-action-btn nc-btn-next" id="ncNextBtn">🎲 다음 게임</button>
                <button type="button" class="nc-action-btn nc-btn-home" id="ncPlazaBtn">🏠 광장으로</button>
              </div>
            </div>
          </div>
        </div>
      `;

      this.attachEvents();
      this.startNewGameSession();
    },

    loadVehicles: async function(){
      try{
        const res = await fetch(MANIFEST_URL, { cache:'no-store' });
        if(!res.ok) throw new Error('MANIFEST_LOAD_FAILED');
        const data = await res.json();
        const raw = Array.isArray(data.vehicles) ? data.vehicles : (Array.isArray(data) ? data : []);
        const list = raw.map(normalizeVehicle).filter(v => v && v.id && v.image && v.name);
        if(list.length < 5) throw new Error('NOT_ENOUGH_VEHICLES');
        this.state.vehicles = list;
      }catch(error){
        console.warn('number-count: 차량 데이터를 불러오지 못해 기본값을 사용합니다.', error);
        this.state.vehicles = FALLBACK.map(normalizeVehicle).filter(Boolean);
      }
    },

    startNewGameSession:function(){
      this.clearTimers();
      const pool = this.state.vehicles.length ? this.state.vehicles : FALLBACK.map(normalizeVehicle).filter(Boolean);
      this.state.gameVehicles = shuffle([...pool]).slice(0, Math.min(5, pool.length));
      this.restart();
    },

    restart:function(){
      this.clearTimers();
      this.state.currentLevel = 1;
      this.state.currentAnswer = 0;
      this.state.currentVehicle = null;
      this.state.correctCount = 0;
      this.state.isAnimating = false;
      const panel = this.query('#ncSuccessPanel');
      const choices = this.query('#ncChoicesArea');
      const feedback = this.query('#ncFeedback');
      if(panel) panel.style.display = 'none';
      if(choices) choices.style.display = 'flex';
      if(feedback) feedback.innerHTML = '';
      playGameVoice('games.number.intro');
      this.loadNextQuestion();
    },

    loadNextQuestion:function(){
      this.clearTimers();
      if(!this.state.container) return;
      if(this.state.currentLevel > 5){ this.showCompleteScreen(); return; }

      this.state.isAnimating = false;
      const badge = this.query('#ncLevelBadge');
      const feedback = this.query('#ncFeedback');
      const wrapper = this.query('#ncVehiclesWrapper');
      if(!badge || !feedback || !wrapper) return;

      badge.textContent = `${this.state.currentLevel} / 5`;
      feedback.innerHTML = '';
      
      this.state.currentAnswer = Math.floor(Math.random()*10)+1;
      this.state.currentVehicle = this.state.gameVehicles[(this.state.currentLevel-1) % this.state.gameVehicles.length];
      wrapper.innerHTML = '';

      for(let i=0;i<this.state.currentAnswer;i++){
        const img = document.createElement('img');
        img.src = this.state.currentVehicle.image;
        img.alt = this.state.currentVehicle.name;
        img.className = 'nc-vehicle-img';
        img.draggable = false;
        img.onerror = () => { img.onerror = null; img.src = './assets/vehicles/transport/car.png'; };
        wrapper.appendChild(img);
      }

      playGameVoice('games.number.question');
      this.say(`${this.state.currentVehicle.name} 친구들이 왔어! 모두 몇 개일까?`, true);
      this.renderChoices();
    },

    renderChoices:function(){
      const choicesArea = this.query('#ncChoicesArea');
      if(!choicesArea) return;
      const choices = [this.state.currentAnswer];
      while(choices.length < 3){
        const n = Math.floor(Math.random()*10)+1;
        if(!choices.includes(n)) choices.push(n);
      }
      shuffle(choices);
      choicesArea.innerHTML = '';
      choices.forEach(num => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nc-toy-block-btn';
        btn.textContent = num;
        btn.setAttribute('aria-label', `숫자 ${num}`);
        btn.onclick = () => this.checkAnswer(num);
        choicesArea.appendChild(btn);
      });
    },

    checkAnswer:function(selected){
      if(this.state.isAnimating || !this.state.container) return;
      const feedback = this.query('#ncFeedback');
      const wrapper = this.query('#ncVehiclesWrapper');
      const choicesArea = this.query('#ncChoicesArea');
      if(!feedback || !wrapper || !choicesArea) return;
      const imgs = wrapper.querySelectorAll('.nc-vehicle-img');

      if(selected === this.state.currentAnswer){
        this.state.isAnimating = true;
        this.state.correctCount++;
        choicesArea.querySelectorAll('button').forEach(btn => { btn.disabled = true; });
        imgs.forEach((img,index) => {
          img.style.animationDelay = `${index*0.06}s`;
          img.classList.add('dance');
        });
        
        const sinoKoreanNumbers = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'];
        const spokenNumber = sinoKoreanNumbers[this.state.currentAnswer] || this.state.currentAnswer;
        const vName = this.state.currentVehicle.name;
        const vSound = this.state.currentVehicle.sound;

        feedback.innerHTML = `🎉 정답은 숫자 ${this.state.currentAnswer}!`;
        feedback.style.color = '#FF7A1A';
        this.createStars(14);
        
        // 아이디어가 반영된 음성: "정답은 숫자 일! 펌프차, 삐뽀삐뽀 물을 뿜어요!"
        playGameVoice('games.number.correct');
        this.say(`정답은 숫자 ${spokenNumber}! ${vName}, ${vSound}`, true);
        
        if(this.state.options.fireConfetti) this.state.options.fireConfetti();
        
        // 읽어주는 문장이 길어졌으므로 다음 문제로 넘어가는 대기시간을 4.0초(4000ms)로 늘림
        this.setManagedTimeout(() => {
          this.state.currentLevel++;
          this.state.isAnimating = false;
          this.loadNextQuestion();
        }, 4000); 
        return;
      }

      this.state.isAnimating = true;
      feedback.innerHTML = '🤗 괜찮아, 다시 천천히 세어보자!';
      feedback.style.color = '#1E90FF';
      playGameVoice('games.number.wrong');
      this.say('괜찮아, 다시 세어보자!', true);
      wrapper.classList.add('shake');
      this.setManagedTimeout(() => {
        wrapper.classList.remove('shake');
        this.state.isAnimating = false;
      }, 560);
    },

    createStars:function(count){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      for(let i=0;i<count;i++){
        const star = document.createElement('div');
        star.className = 'nc-star';
        star.textContent = ['⭐','✨','🌟'][Math.floor(Math.random()*3)];
        star.style.left = `${10 + Math.random()*80}%`;
        star.style.top = `${10 + Math.random()*62}%`;
        star.style.animationDelay = `${Math.random()*0.3}s`;
        area.appendChild(star);
        this.setManagedTimeout(() => star.remove(), 1500);
      }
    },

    showCompleteScreen:function(){
      const choices = this.query('#ncChoicesArea');
      const panel = this.query('#ncSuccessPanel');
      const feedback = this.query('#ncFeedback');
      if(!choices || !panel || !feedback) return;
      this.clearTimers();
      this.state.isAnimating = false;
      feedback.innerHTML = '';
      choices.style.display = 'none';
      panel.style.display = 'flex';
      this.state.container.querySelectorAll('.nc-vehicle-img').forEach((img,index) => {
        img.style.animationDelay = `${index*0.06}s`;
        img.classList.add('dance');
      });
      playGameVoice('games.number.complete');
      this.say('우와! 다 맞혔어. 시현이가 숫자 박사야!', true);
      if(this.state.options.fireConfetti) this.state.options.fireConfetti();
      if(this.state.options.gainExp) this.state.options.gainExp(30);
    },

    attachEvents:function(){
      const restart = this.query('#ncRestartBtn');
      const next = this.query('#ncNextBtn');
      const home = this.query('#ncPlazaBtn');
      if(restart) restart.onclick = () => this.restart();
      if(next) next.onclick = () => this.startNewGameSession();
      if(home) home.onclick = () => { if(this.state.options.closeToParkHome) this.state.options.closeToParkHome(); };
    },

    say:function(text, force=false){
      const speak = this.state.options && this.state.options.speakGuide;
      if(typeof speak === 'function') speak(text, force);
    },

    query:function(selector){
      return this.state.container ? this.state.container.querySelector(selector) : null;
    },

    setManagedTimeout:function(fn, delay){
      const id = setTimeout(() => {
        this.state.timeoutIds = this.state.timeoutIds.filter(item => item !== id);
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
      const existing = document.getElementById(STYLE_ID);
      if(existing) existing.remove();
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        .number-count-game{width:100%;height:100%;min-height:100%;position:relative;overflow:hidden;display:flex;flex-direction:column;font-family:'Jua','Apple SD Gothic Neo',sans-serif;background:linear-gradient(180deg,#87CEEB 0%,#E0F7FA 67%,#C8E6C9 100%);isolation:isolate;}
        .nc-loading-card{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;font-size:clamp(22px,5vw,34px);color:#1565c0;font-weight:900;text-align:center;}
        .nc-loading-icon{font-size:clamp(70px,18vw,130px);filter:drop-shadow(0 12px 0 rgba(0,0,0,.12));animation:ncLoadingBounce .9s ease-in-out infinite alternate;}
        @keyframes ncLoadingBounce{from{transform:translateY(0) rotate(-3deg);}to{transform:translateY(-14px) rotate(3deg);}}
        .nc-cloud{position:absolute;background:#fff;border-radius:50px;opacity:.82;z-index:0;pointer-events:none;}.nc-cloud:before,.nc-cloud:after{content:'';position:absolute;background:#fff;border-radius:50%;}
        .nc-c1{width:120px;height:40px;top:15%;left:10%;animation:ncFloatCloud 25s linear infinite;}.nc-c1:before{width:50px;height:50px;top:-20px;left:15px;}.nc-c1:after{width:60px;height:60px;top:-30px;left:45px;}
        .nc-c2{width:100px;height:35px;top:25%;right:-20px;animation:ncFloatCloud 35s linear infinite reverse;}.nc-c2:before{width:40px;height:40px;top:-15px;left:10px;}.nc-c2:after{width:50px;height:50px;top:-20px;left:40px;}
        @keyframes ncFloatCloud{from{transform:translateX(-10vw);}to{transform:translateX(100vw);}}
        .nc-game-header{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:clamp(10px,2vw,18px) clamp(12px,3vw,24px);background:rgba(255,255,255,.72);box-shadow:0 4px 12px rgba(0,0,0,.05);border-radius:0 0 24px 24px;}
        .nc-game-title{margin:0;font-size:clamp(24px,6vw,38px);color:#FF7A1A;text-shadow:0 2px 0 #fff;line-height:1.1;}.nc-level-badge{flex-shrink:0;background:#1E90FF;color:white;padding:6px 16px;border-radius:99px;font-size:clamp(18px,4vw,24px);font-weight:900;border:3px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.1);}
        .nc-objects-area{flex:1;min-height:0;position:relative;z-index:5;display:flex;align-items:center;justify-content:center;padding:clamp(10px,3vw,28px);overflow:hidden;}.nc-road-bg{position:absolute;bottom:10%;left:-10%;right:-10%;height:clamp(48px,9vw,76px);background:#9E9E9E;border-radius:50%;transform:rotateX(70deg);border:4px solid #fff;box-shadow:0 15px 0 #757575;z-index:0;}
        .nc-vehicles-wrapper{position:relative;z-index:10;width:min(100%,960px);display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:clamp(6px,1.5vw,15px);padding:4px;}
        .nc-vehicle-img{width:clamp(50px,14vw,130px);max-height:clamp(45px,12vw,110px);object-fit:contain;user-select:none;pointer-events:none;filter:drop-shadow(0 15px 10px rgba(0,0,0,.3));transition:transform .3s;}
        .dance{animation:ncDance .6s infinite alternate cubic-bezier(.4,0,.2,1);}@keyframes ncDance{from{transform:translateY(0) rotate(-7deg);}to{transform:translateY(-24px) rotate(7deg) scale(1.05);}}.shake{animation:ncShake .42s ease-in-out;}@keyframes ncShake{0%,100%{transform:translateX(0);}25%{transform:translateX(-15px) rotate(-4deg);}75%{transform:translateX(15px) rotate(4deg);}}
        .nc-star{position:absolute;font-size:clamp(32px,9vw,58px);pointer-events:none;z-index:20;animation:ncStarBurst 1.2s forwards cubic-bezier(.175,.885,.32,1.275);}@keyframes ncStarBurst{0%{transform:scale(0) rotate(0deg);opacity:1;}50%{transform:scale(1.5) rotate(180deg);opacity:1;}100%{transform:scale(2) rotate(360deg);opacity:0;}}
        .nc-feedback-area{position:relative;z-index:10;text-align:center;min-height:clamp(42px,7vw,58px);font-size:clamp(20px,5vw,30px);font-weight:900;padding:0 10px;text-shadow:0 2px 0 #fff;display:flex;align-items:center;justify-content:center;}.nc-interaction-area{position:relative;z-index:10;padding:10px clamp(12px,3vw,22px) max(22px,env(safe-area-inset-bottom));}
        .nc-choices-area{display:flex;justify-content:center;gap:clamp(14px,4vw,24px);flex-wrap:wrap;}.nc-toy-block-btn{width:clamp(82px,21vw,124px);height:clamp(82px,21vw,124px);font-size:clamp(42px,10vw,64px);font-weight:900;font-family:'Jua','Apple SD Gothic Neo',sans-serif;border-radius:22px;border:5px solid #fff;background:linear-gradient(135deg,#FFD93D,#FFAA00);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.2);box-shadow:0 10px 0 #E65100,0 15px 20px rgba(0,0,0,.2);transition:transform .1s,box-shadow .1s,filter .15s;cursor:pointer;}
        .nc-toy-block-btn:nth-child(2){background:linear-gradient(135deg,#4CAF50,#2E7D32);box-shadow:0 10px 0 #1B5E20,0 15px 20px rgba(0,0,0,.2);}.nc-toy-block-btn:nth-child(3){background:linear-gradient(135deg,#1E90FF,#1565C0);box-shadow:0 10px 0 #0D47A1,0 15px 20px rgba(0,0,0,.2);}.nc-toy-block-btn:active{transform:translateY(10px);box-shadow:0 0 0 transparent,0 5px 10px rgba(0,0,0,.2);}.nc-toy-block-btn:disabled{filter:saturate(.7);cursor:default;}
        .nc-success-panel{flex-direction:column;align-items:center;width:min(100%,620px);margin:0 auto;background:rgba(255,255,255,.96);padding:clamp(18px,4vw,28px);border:5px solid #FFD93D;border-radius:30px;box-shadow:0 10px 30px rgba(0,0,0,.15);animation:ncPopUpPanel .5s cubic-bezier(.175,.885,.32,1.275);}@keyframes ncPopUpPanel{from{opacity:0;transform:translateY(50px) scale(.9);}to{opacity:1;transform:translateY(0) scale(1);}}
        .nc-success-title{font-size:clamp(24px,6vw,36px);color:#FF7A1A;margin:0 0 20px;text-align:center;text-shadow:0 2px 0 #FFF9C4;}.nc-action-buttons{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;width:100%;}.nc-action-btn{flex:1;min-width:132px;min-height:64px;font-size:clamp(18px,4vw,22px);font-weight:900;font-family:'Jua','Apple SD Gothic Neo',sans-serif;border-radius:999px;border:4px solid #fff;box-shadow:0 6px 0 rgba(0,0,0,.15);transition:transform .1s,box-shadow .1s;cursor:pointer;}.nc-action-btn:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.15);}.nc-btn-replay{background:#4CAF50;color:white;}.nc-btn-next{background:#2196F3;color:white;}.nc-btn-home{background:#FF9800;color:white;}
        @media (min-width:768px){.nc-objects-area{padding-inline:36px;}.nc-vehicle-img{width:clamp(90px,12vw,160px);max-height:clamp(80px,11vw,140px);}.nc-toy-block-btn{width:clamp(112px,13vw,150px);height:clamp(112px,13vw,150px);}}
        @media (max-width:430px){.nc-game-header{padding-inline:12px;}.nc-vehicles-wrapper{gap:6px;}.nc-vehicle-img{width:clamp(45px,18vw,85px);max-height:60px;}.nc-action-buttons{flex-direction:column;}.nc-action-btn{width:100%;}}
        @media (max-height:600px){.nc-vehicle-img{width:clamp(50px,13vw,80px);max-height:55px;}.nc-toy-block-btn{width:74px;height:74px;font-size:40px;}.nc-success-title{margin-bottom:10px;}}
      `;
      document.head.appendChild(style);
      this.state.styleElement = style;
    },

    destroy:function(){
      this.clearTimers();
      if(this.state.styleElement){ this.state.styleElement.remove(); this.state.styleElement = null; }
      if(this.state.container){ this.state.container.innerHTML = ''; }
      this.state.currentLevel = 1;
      this.state.currentAnswer = 0;
      this.state.currentVehicle = null;
      this.state.correctCount = 0;
      this.state.isAnimating = false;
      this.state.gameVehicles = [];
      this.state.container = null;
      this.state.options = {};
    }
  };
})();
