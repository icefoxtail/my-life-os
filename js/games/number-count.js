/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - NUMBER COUNT GAME MODULE
   js/games/number-count.js  [v3 — 이미지 퍼스트]
═══════════════════════════════════════════ */
(function(){
  window.SihyeonGames = window.SihyeonGames || {};

  const STYLE_ID     = 'sihyeon-number-count-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';
  const TOTAL_ROUNDS = 5;

  /* ── 라운드별 배경 테마 ── */
  const BG_THEMES = [
    /* 1 - 맑은 낮 */
    { sky:'linear-gradient(180deg,#87CEEB 0%,#E0F7FA 65%,#C8E6C9 100%)', road:'#9E9E9E', roadShadow:'#757575', cloud:true  },
    /* 2 - 저녁노을 */
    { sky:'linear-gradient(180deg,#FF7043 0%,#FFA726 45%,#FFE082 100%)', road:'#795548', roadShadow:'#4E342E', cloud:false },
    /* 3 - 별밤 */
    { sky:'linear-gradient(180deg,#1A237E 0%,#283593 50%,#1565C0 100%)', road:'#37474F', roadShadow:'#263238', cloud:false },
    /* 4 - 눈 내리는 날 */
    { sky:'linear-gradient(180deg,#B0BEC5 0%,#ECEFF1 60%,#E3F2FD 100%)', road:'#78909C', roadShadow:'#546E7A', cloud:true  },
    /* 5 - 무지개 */
    { sky:'linear-gradient(180deg,#F48FB1 0%,#CE93D8 25%,#90CAF9 55%,#A5D6A7 100%)', road:'#8D6E63', roadShadow:'#6D4C41', cloud:true  },
  ];

  const FALLBACK = [
    { id:'pump_engine',               category:'fire',         name_ko:'펌프차',           file:'./assets/vehicles/fire/pump_engine.png',               sound_ko:'삐뽀삐뽀, 물을 뿜어요!' },
    { id:'water_tanker',              category:'fire',         name_ko:'물탱크차',          file:'./assets/vehicles/fire/water_tanker.png',              sound_ko:'출렁출렁 물을 싣고 가요!' },
    { id:'ladder_truck',              category:'fire',         name_ko:'사다리차',          file:'./assets/vehicles/fire/ladder_truck.png',              sound_ko:'사다리가 쭉쭉 올라가요!' },
    { id:'aerial_ladder_truck',       category:'fire',         name_ko:'고가사다리차',       file:'./assets/vehicles/fire/aerial_ladder_truck.png',       sound_ko:'높이높이 올라가요!' },
    { id:'articulating_ladder_truck', category:'fire',         name_ko:'굴절사다리차',       file:'./assets/vehicles/fire/articulating_ladder_truck.png', sound_ko:'팔이 꺾여서 슈욱 움직여요!' },
    { id:'rescue_fire_truck',         category:'fire',         name_ko:'구조공작차',         file:'./assets/vehicles/fire/rescue_fire_truck.png',         sound_ko:'구조 장비를 싣고 출동해요!' },
    { id:'airport_fire_truck',        category:'fire',         name_ko:'공항소방차',         file:'./assets/vehicles/fire/airport_fire_truck.png',        sound_ko:'커다란 바퀴로 힘차게 출동해요!' },
    { id:'foam_fire_truck',           category:'fire',         name_ko:'포소화차',           file:'./assets/vehicles/fire/foam_fire_truck.png',           sound_ko:'몽글몽글 거품을 뿜어요!' },
    { id:'fire_command_vehicle',      category:'fire',         name_ko:'소방 지휘차',        file:'./assets/vehicles/fire/fire_command_vehicle.png',      sound_ko:'현장을 살피며 지휘해요!' },
    { id:'korean_police_car',         category:'police',       name_ko:'한국 경찰차',        file:'./assets/vehicles/police/korean_police_car.png',       sound_ko:'위용위용 순찰해요!' },
    { id:'us_police_car',             category:'police',       name_ko:'미국 경찰차',        file:'./assets/vehicles/police/us_police_car.png',           sound_ko:'우웅, 멋지게 달려요!' },
    { id:'police_motorcycle',         category:'police',       name_ko:'경찰 오토바이',       file:'./assets/vehicles/police/police_motorcycle.png',       sound_ko:'부릉부릉 빠르게 달려요!' },
    { id:'swat_truck',                category:'police',       name_ko:'경찰특공대차',        file:'./assets/vehicles/police/swat_truck.png',              sound_ko:'튼튼하게 출동해요!' },
    { id:'forensic_bus',              category:'police',       name_ko:'과학수사버스',        file:'./assets/vehicles/police/forensic_bus.png',            sound_ko:'차근차근 단서를 찾아요!' },
    { id:'riot_police_bus',           category:'police',       name_ko:'기동대 버스',         file:'./assets/vehicles/police/riot_police_bus.png',         sound_ko:'큰 버스가 안전하게 이동해요!' },
    { id:'ambulance',                 category:'rescue',       name_ko:'구급차',              file:'./assets/vehicles/rescue/ambulance.png',               sound_ko:'애앵애앵 도와주러 가요!' },
    { id:'doctor_car',                category:'rescue',       name_ko:'닥터카',              file:'./assets/vehicles/rescue/doctor_car.png',              sound_ko:'의사 선생님이 빨리 도착해요!' },
    { id:'rescue_helicopter',         category:'rescue',       name_ko:'구조 헬기',           file:'./assets/vehicles/rescue/rescue_helicopter.png',       sound_ko:'두두두두 하늘을 날아요!' },
    { id:'excavator',                 category:'construction', name_ko:'포크레인',            file:'./assets/vehicles/construction/excavator.png',         sound_ko:'쿠궁쿠궁 흙을 퍼요!' },
    { id:'mini_excavator',            category:'construction', name_ko:'미니 굴착기',         file:'./assets/vehicles/construction/mini_excavator.png',    sound_ko:'작지만 힘차게 파요!' },
    { id:'bulldozer',                 category:'construction', name_ko:'불도저',              file:'./assets/vehicles/construction/bulldozer.png',         sound_ko:'쓱쓱 밀고 지나가요!' },
    { id:'wheel_loader',              category:'construction', name_ko:'휠로더',              file:'./assets/vehicles/construction/wheel_loader.png',      sound_ko:'커다란 삽으로 담아요!' },
    { id:'dump_truck',                category:'construction', name_ko:'덤프트럭',            file:'./assets/vehicles/construction/dump_truck.png',        sound_ko:'우르르 짐을 내려요!' },
    { id:'concrete_mixer',            category:'construction', name_ko:'레미콘',              file:'./assets/vehicles/construction/concrete_mixer.png',    sound_ko:'빙글빙글 섞어요!' },
    { id:'concrete_pump_truck',       category:'construction', name_ko:'콘크리트 펌프카',      file:'./assets/vehicles/construction/concrete_pump_truck.png',sound_ko:'쭉쭉 뻗어서 보내요!' },
    { id:'crane_truck',               category:'construction', name_ko:'크레인차',            file:'./assets/vehicles/construction/crane_truck.png',       sound_ko:'번쩍 들어 올려요!' },
    { id:'forklift',                  category:'construction', name_ko:'지게차',              file:'./assets/vehicles/construction/forklift.png',          sound_ko:'삐리리 짐을 들어요!' },
    { id:'train',                     category:'transport',    name_ko:'기차',                file:'./assets/vehicles/transport/train.png',                sound_ko:'칙칙폭폭 달려요!' },
    { id:'bus',                       category:'transport',    name_ko:'버스',                file:'./assets/vehicles/transport/bus.png',                  sound_ko:'빵빵 친구들을 태워요!' },
    { id:'car',                       category:'transport',    name_ko:'자동차',              file:'./assets/vehicles/transport/car.png',                  sound_ko:'부릉부릉 달려요!' },
    { id:'taxi',                      category:'transport',    name_ko:'택시',                file:'./assets/vehicles/transport/taxi.png',                 sound_ko:'띠띠 목적지로 가요!' },
    { id:'school_bus',                category:'transport',    name_ko:'스쿨버스',            file:'./assets/vehicles/transport/school_bus.png',           sound_ko:'친구들을 데리러 가요!' },
    { id:'rocket',                    category:'transport',    name_ko:'로켓',                file:'./assets/vehicles/transport/rocket.png',               sound_ko:'슈우웅 하늘로 날아요!' },
    { id:'submarine',                 category:'transport',    name_ko:'잠수함',              file:'./assets/vehicles/transport/submarine.png',            sound_ko:'꼬르륵 바닷속으로 가요!' },
    { id:'tow_truck',                 category:'transport',    name_ko:'견인차',              file:'./assets/vehicles/transport/tow_truck.png',            sound_ko:'고장난 차를 도와줘요!' },
    { id:'garbage_truck',             category:'transport',    name_ko:'청소차',              file:'./assets/vehicles/transport/garbage_truck.png',        sound_ko:'쓱싹쓱싹 깨끗하게 해요!' },
    { id:'tractor',                   category:'transport',    name_ko:'트랙터',              file:'./assets/vehicles/transport/tractor.png',              sound_ko:'덜컹덜컹 밭으로 가요!' },
    { id:'airplane',                  category:'transport',    name_ko:'비행기',              file:'./assets/vehicles/transport/airplane.png',             sound_ko:'슝 하늘을 날아요!' },
    { id:'helicopter',                category:'transport',    name_ko:'헬리콥터',            file:'./assets/vehicles/transport/helicopter.png',           sound_ko:'두두두두 날아가요!' }
  ];

  function normalizeVehicle(item){
    if(!item) return null;
    const name  = item.name_ko || item.name || item.id || '자동차';
    const image = item.file    || item.image || '';
    return { id:item.id||name, category:item.category||'etc', name, image, sound:item.sound_ko||name };
  }

  function shuffle(list){
    const arr = Array.isArray(list) ? [...list] : [];
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }

  function playGameVoice(id){
    if(window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function')
      window.SihyeonVoice.play(id).catch(()=>{});
  }

  const SINO_KR = ['','일','이','삼','사','오','육','칠','팔','구'];

  /* 1라운드는 무조건 1, 이후는 2~9 랜덤 */
  function pickAnswer(level){
    if(level === 1) return 1;
    return Math.floor(Math.random()*8)+2;
  }

  /* 그리드 열 수 */
  function colsFor(n){
    if(n === 1) return 1;
    if(n <= 4)  return 2;
    return 3;
  }

  /* ══════════════════════════════════════════════
     메인 게임 오브젝트
  ══════════════════════════════════════════════ */
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

    /* ════════════════════════════
       render
    ════════════════════════════ */
    render: async function(container, options={}){
      this.destroy();
      this.state.container = container;
      this.state.options   = options || {};
      this.injectStyles();

      /* 로딩: 이모지만 */
      container.innerHTML = `
        <div class="number-count-game">
          <div class="nc-loading-card">
            <div class="nc-loading-icon">🚗</div>
          </div>
        </div>`;

      await this.loadVehicles();
      if(this.state.container !== container) return;

      /* 메인 레이아웃 — 텍스트 0, 이모지/이미지만 */
      container.innerHTML = `
        <div class="number-count-game" id="ncGame">
          <div class="nc-cloud nc-c1"></div>
          <div class="nc-cloud nc-c2"></div>

          <div class="nc-game-header">
            <div class="nc-dot-progress" id="ncDotProgress"></div>
            <div class="nc-home-btn" id="ncPlazaBtn">🏠</div>
          </div>

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
              <button type="button" class="nc-action-btn nc-btn-next"   id="ncNextBtn">🎲</button>
              <button type="button" class="nc-action-btn nc-btn-home2"  id="ncPlazaBtn2">🏠</button>
            </div>
          </div>
        </div>`;

      this.attachEvents();
      this.startNewGameSession();
    },

    /* ════════════════════════════
       loadVehicles
    ════════════════════════════ */
    loadVehicles: async function(){
      try{
        const res  = await fetch(MANIFEST_URL, {cache:'no-store'});
        if(!res.ok) throw new Error('fail');
        const data = await res.json();
        const raw  = Array.isArray(data.vehicles) ? data.vehicles : (Array.isArray(data) ? data : []);
        const list = raw.map(normalizeVehicle).filter(v=>v&&v.id&&v.image&&v.name);
        if(list.length < TOTAL_ROUNDS) throw new Error('too few');
        this.state.vehicles = list;
      }catch(e){
        this.state.vehicles = FALLBACK.map(normalizeVehicle).filter(Boolean);
      }
    },

    /* ════════════════════════════
       세션 / 재시작
    ════════════════════════════ */
    startNewGameSession:function(){
      this.clearTimers();
      const pool = this.state.vehicles.length ? this.state.vehicles : FALLBACK.map(normalizeVehicle).filter(Boolean);
      this.state.gameVehicles = shuffle(pool).slice(0, TOTAL_ROUNDS);
      this.restart();
    },

    restart:function(){
      this.clearTimers();
      this.state.currentLevel   = 1;
      this.state.currentAnswer  = 0;
      this.state.currentVehicle = null;
      this.state.correctCount   = 0;
      this.state.isAnimating    = false;
      const panel   = this.query('#ncSuccessPanel');
      const choices = this.query('#ncChoicesArea');
      if(panel)   panel.style.display = 'none';
      if(choices) choices.style.display = 'flex';
      playGameVoice('games.number.intro');
      this.loadNextQuestion();
    },

    /* ════════════════════════════
       문제 로드
    ════════════════════════════ */
    loadNextQuestion:function(){
      this.clearTimers();
      if(!this.state.container) return;
      if(this.state.currentLevel > TOTAL_ROUNDS){ this.showCompleteScreen(); return; }

      this.state.isAnimating    = false;
      this.state.currentAnswer  = pickAnswer(this.state.currentLevel);
      this.state.currentVehicle = this.state.gameVehicles[(this.state.currentLevel-1) % this.state.gameVehicles.length];

      /* 배경 테마 적용 */
      this.applyTheme(this.state.currentLevel - 1);

      /* 도트 진행 */
      this.renderDotProgress();

      /* 차량 그리드 */
      const wrapper = this.query('#ncVehiclesWrapper');
      if(!wrapper) return;
      wrapper.innerHTML = '';
      const count = this.state.currentAnswer;
      const cols  = colsFor(count);
      wrapper.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

      for(let i=0;i<count;i++){
        const wrap = document.createElement('div');
        wrap.className = 'nc-vehicle-cell';

        const img = document.createElement('img');
        img.src       = this.state.currentVehicle.image;
        img.alt       = '';
        img.className = 'nc-vehicle-img';
        img.draggable = false;
        img.onerror   = ()=>{ img.onerror=null; img.src='./assets/vehicles/transport/car.png'; };

        wrap.appendChild(img);
        wrapper.appendChild(wrap);
      }

      playGameVoice('games.number.question');
      this.say(`${this.state.currentVehicle.name} 친구들이 왔어! 모두 몇 개일까?`, true);
      this.renderChoices();
    },

    /* ════════════════════════════
       배경 테마
    ════════════════════════════ */
    applyTheme:function(idx){
      const t    = BG_THEMES[idx] || BG_THEMES[0];
      const game = this.query('#ncGame');
      const road = this.query('#ncRoadBg');
      const c1   = this.query('.nc-c1');
      const c2   = this.query('.nc-c2');
      if(game) game.style.background = t.sky;
      if(road){
        road.style.background  = t.road;
        road.style.boxShadow   = `0 12px 0 ${t.roadShadow}`;
      }
      /* 밤 테마일 때 구름 숨김, 별 표시 */
      const showCloud = t.cloud;
      if(c1) c1.style.opacity = showCloud ? '0.82' : '0';
      if(c2) c2.style.opacity = showCloud ? '0.82' : '0';
      if(idx === 2) this.spawnStars(); /* 별밤 전용 별 장식 */
      /* 눈 라운드 눈송이 */
      if(idx === 3) this.spawnSnowflakes();
    },

    /* 배경용 별 (게임 진행 내내 유지) */
    spawnStars:function(){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      for(let i=0;i<18;i++){
        const s = document.createElement('div');
        s.className = 'nc-bg-star';
        s.style.left = `${Math.random()*100}%`;
        s.style.top  = `${Math.random()*55}%`;
        s.style.animationDelay = `${Math.random()*3}s`;
        area.appendChild(s);
      }
    },

    spawnSnowflakes:function(){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      const flakes = ['❄','❅','❆','✻'];
      for(let i=0;i<14;i++){
        const f = document.createElement('div');
        f.className   = 'nc-snowflake';
        f.textContent = flakes[Math.floor(Math.random()*flakes.length)];
        f.style.left  = `${Math.random()*100}%`;
        f.style.animationDuration  = `${3+Math.random()*4}s`;
        f.style.animationDelay     = `${Math.random()*4}s`;
        area.appendChild(f);
        /* 라운드 끝나면 정리 */
        this.setManagedTimeout(()=>{ if(f.parentNode) f.parentNode.removeChild(f); }, 9000);
      }
    },

    /* ════════════════════════════
       진행 도트
    ════════════════════════════ */
    renderDotProgress:function(){
      const el = this.query('#ncDotProgress');
      if(!el) return;
      el.innerHTML = '';
      for(let i=1;i<=TOTAL_ROUNDS;i++){
        const d = document.createElement('div');
        d.className = 'nc-dot'
          + (i <  this.state.currentLevel ? ' done'   : '')
          + (i === this.state.currentLevel ? ' active' : '');
        el.appendChild(d);
      }
    },

    /* ════════════════════════════
       선택 버튼
    ════════════════════════════ */
    renderChoices:function(){
      const area = this.query('#ncChoicesArea');
      if(!area) return;
      const ans  = this.state.currentAnswer;
      const set  = [ans];
      while(set.length < 3){
        const n = Math.floor(Math.random()*9)+1;
        if(!set.includes(n)) set.push(n);
      }
      shuffle(set);
      area.innerHTML = '';
      set.forEach(num => {
        const btn = document.createElement('button');
        btn.type        = 'button';
        btn.className   = 'nc-toy-block-btn';
        btn.textContent = num;
        btn.setAttribute('aria-label', String(num));
        btn.onclick = ()=> this.checkAnswer(num);
        area.appendChild(btn);
      });
    },

    /* ════════════════════════════
       정답 확인
    ════════════════════════════ */
    checkAnswer:function(selected){
      if(this.state.isAnimating || !this.state.container) return;
      const wrapper = this.query('#ncVehiclesWrapper');
      const choices = this.query('#ncChoicesArea');
      if(!wrapper || !choices) return;

      /* ── 정답 ── */
      if(selected === this.state.currentAnswer){
        this.state.isAnimating = true;
        this.state.correctCount++;
        choices.querySelectorAll('button').forEach(b=>{ b.disabled=true; });

        /* ① 카운팅 하이라이트: 1번씩 순서대로 빛나는 동그라미 */
        this.runCountingHighlight(wrapper, ()=>{

          /* ② 차량 달려나가기 애니메이션 */
          this.driveOut(wrapper, ()=>{

            /* ③ 별 폭죽 + 정답 이모지 코너 팝업 */
            this.createStars(18);
            this.showCorrectEmoji();
            if(this.state.options.fireConfetti) this.state.options.fireConfetti();

            /* ④ 음성 */
            const spokenNum = SINO_KR[this.state.currentAnswer] || this.state.currentAnswer;
            const vName     = this.state.currentVehicle.name;
            const vSound    = this.state.currentVehicle.sound;
            playGameVoice('games.number.correct');
            this.say(`정답은 숫자 ${spokenNum}! ${vName}, ${vSound}`, true);

            /* ⑤ 6초 후 다음 문제 */
            this.setManagedTimeout(()=>{
              this.state.currentLevel++;
              this.state.isAnimating = false;
              this.loadNextQuestion();
            }, 6000);
          });
        });
        return;
      }

      /* ── 오답: 화면 빨간빛 + 슬픈 이모지 ── */
      this.state.isAnimating = true;
      playGameVoice('games.number.wrong');
      this.say('괜찮아, 다시 세어보자!', true);
      this.showWrongFlash();
      wrapper.classList.add('shake');
      this.setManagedTimeout(()=>{
        wrapper.classList.remove('shake');
        this.state.isAnimating = false;
      }, 600);
    },

    /* ════════════════════════════
       ① 카운팅 하이라이트
          각 차량 위에 빛나는 동그라미가 하나씩 순서대로 등장
    ════════════════════════════ */
    runCountingHighlight:function(wrapper, done){
      const cells = Array.from(wrapper.querySelectorAll('.nc-vehicle-cell'));
      const delay = 380; /* 한 대당 딜레이 ms */

      cells.forEach((cell, i)=>{
        this.setManagedTimeout(()=>{
          const dot = document.createElement('div');
          dot.className   = 'nc-count-dot';
          dot.textContent = i+1;          /* 숫자 공부: 순서대로 숫자 표시 */
          cell.appendChild(dot);
        }, i * delay);
      });

      /* 전부 등장한 뒤 done 호출 */
      this.setManagedTimeout(done, cells.length * delay + 400);
    },

    /* ════════════════════════════
       ② 차량 달려나가기
    ════════════════════════════ */
    driveOut:function(wrapper, done){
      const cells = Array.from(wrapper.querySelectorAll('.nc-vehicle-cell'));
      cells.forEach((cell, i)=>{
        this.setManagedTimeout(()=>{
          cell.classList.add('drive-out');
        }, i * 80);
      });
      this.setManagedTimeout(done, cells.length * 80 + 600);
    },

    /* ════════════════════════════
       정답 이모지 코너 팝업 (화면 안 가림)
    ════════════════════════════ */
    showCorrectEmoji:function(){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      const ov = document.createElement('div');
      ov.className   = 'nc-correct-overlay';
      ov.textContent = ['🎉','🌟','🏆','✨'][Math.floor(Math.random()*4)];
      area.appendChild(ov);
      this.setManagedTimeout(()=>{ if(ov.parentNode) ov.parentNode.removeChild(ov); }, 2000);
    },

    /* ════════════════════════════
       오답 빨간빛 플래시 + 슬픈 이모지
    ════════════════════════════ */
    showWrongFlash:function(){
      const game = this.query('#ncGame');
      if(!game) return;

      /* 빨간 오버레이 */
      const flash = document.createElement('div');
      flash.className = 'nc-wrong-flash';
      game.appendChild(flash);
      this.setManagedTimeout(()=>{ if(flash.parentNode) flash.parentNode.removeChild(flash); }, 700);

      /* 슬픈 이모지 중앙 */
      const sad = document.createElement('div');
      sad.className   = 'nc-sad-emoji';
      sad.textContent = ['😢','🙈','😅'][Math.floor(Math.random()*3)];
      game.appendChild(sad);
      this.setManagedTimeout(()=>{ if(sad.parentNode) sad.parentNode.removeChild(sad); }, 900);
    },

    /* ════════════════════════════
       별 폭죽 효과
    ════════════════════════════ */
    createStars:function(count){
      const area = this.query('#ncObjectsArea');
      if(!area) return;
      const emojis = ['⭐','✨','🌟','💫','🎊'];
      for(let i=0;i<count;i++){
        const s = document.createElement('div');
        s.className   = 'nc-star';
        s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
        s.style.left  = `${5+Math.random()*90}%`;
        s.style.top   = `${5+Math.random()*75}%`;
        s.style.animationDelay = `${Math.random()*0.5}s`;
        area.appendChild(s);
        this.setManagedTimeout(()=>{ if(s.parentNode) s.parentNode.removeChild(s); }, 1800);
      }
    },

    /* ════════════════════════════
       완료 화면
    ════════════════════════════ */
    showCompleteScreen:function(){
      const choices = this.query('#ncChoicesArea');
      const panel   = this.query('#ncSuccessPanel');
      if(!choices || !panel) return;
      this.clearTimers();
      this.state.isAnimating = false;
      choices.style.display  = 'none';
      panel.style.display    = 'flex';

      /* 남은 차량들 춤 */
      this.state.container.querySelectorAll('.nc-vehicle-img').forEach((img,i)=>{
        img.style.animationDelay = `${i*0.07}s`;
        img.classList.add('dance');
      });
      this.createStars(24);
      playGameVoice('games.number.complete');
      this.say('우와! 다 맞혔어. 시현이가 숫자 박사야!', true);
      if(this.state.options.fireConfetti) this.state.options.fireConfetti();
      if(this.state.options.gainExp)      this.state.options.gainExp(30);
    },

    /* ════════════════════════════
       이벤트 연결
    ════════════════════════════ */
    attachEvents:function(){
      const restart = this.query('#ncRestartBtn');
      const next    = this.query('#ncNextBtn');
      const home    = this.query('#ncPlazaBtn');
      const home2   = this.query('#ncPlazaBtn2');
      if(restart) restart.onclick = ()=> this.restart();
      if(next)    next.onclick    = ()=> this.startNewGameSession();
      const goHome = ()=>{ if(this.state.options.closeToParkHome) this.state.options.closeToParkHome(); };
      if(home)  home.onclick  = goHome;
      if(home2) home2.onclick = goHome;
    },

    say:function(text, force=false){
      const speak = this.state.options && this.state.options.speakGuide;
      if(typeof speak === 'function') speak(text, force);
    },
    query:function(sel){
      return this.state.container ? this.state.container.querySelector(sel) : null;
    },
    setManagedTimeout:function(fn, delay){
      const id = setTimeout(()=>{
        this.state.timeoutIds = this.state.timeoutIds.filter(x=>x!==id);
        fn();
      }, delay);
      this.state.timeoutIds.push(id);
      return id;
    },
    clearTimers:function(){
      this.state.timeoutIds.forEach(id=>clearTimeout(id));
      this.state.timeoutIds = [];
    },

    /* ════════════════════════════
       스타일
    ════════════════════════════ */
    injectStyles:function(){
      const ex = document.getElementById(STYLE_ID);
      if(ex) ex.remove();
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        /* ── 기본 레이아웃 ── */
        .number-count-game{
          width:100%;height:100%;min-height:100%;position:relative;overflow:hidden;
          display:flex;flex-direction:column;
          font-family:'Jua','Apple SD Gothic Neo',sans-serif;
          transition:background 1.2s ease;
          isolation:isolate;
        }

        /* ── 로딩 ── */
        .nc-loading-card{flex:1;display:flex;align-items:center;justify-content:center;}
        .nc-loading-icon{
          font-size:clamp(80px,22vw,160px);
          filter:drop-shadow(0 12px 0 rgba(0,0,0,.12));
          animation:ncLoadBounce .9s ease-in-out infinite alternate;
        }
        @keyframes ncLoadBounce{from{transform:translateY(0) rotate(-3deg);}to{transform:translateY(-16px) rotate(3deg);}}

        /* ── 구름 ── */
        .nc-cloud{position:absolute;background:#fff;border-radius:50px;z-index:0;pointer-events:none;transition:opacity .8s;}
        .nc-cloud:before,.nc-cloud:after{content:'';position:absolute;background:#fff;border-radius:50%;}
        .nc-c1{width:130px;height:44px;top:12%;left:6%;animation:ncCloud 28s linear infinite;}
        .nc-c1:before{width:52px;height:52px;top:-22px;left:14px;}
        .nc-c1:after{width:62px;height:62px;top:-32px;left:46px;}
        .nc-c2{width:105px;height:36px;top:24%;right:-8%;animation:ncCloud 38s linear infinite reverse;}
        .nc-c2:before{width:42px;height:42px;top:-16px;left:10px;}
        .nc-c2:after{width:52px;height:52px;top:-22px;left:42px;}
        @keyframes ncCloud{from{transform:translateX(-18vw);}to{transform:translateX(115vw);}}

        /* ── 배경 별 (별밤 라운드) ── */
        .nc-bg-star{
          position:absolute;width:6px;height:6px;border-radius:50%;
          background:#fff;pointer-events:none;z-index:1;
          animation:ncTwinkle 2s ease-in-out infinite alternate;
        }
        @keyframes ncTwinkle{from{opacity:.2;transform:scale(.8);}to{opacity:1;transform:scale(1.3);}}

        /* ── 눈송이 ── */
        .nc-snowflake{
          position:absolute;top:-40px;font-size:clamp(16px,4vw,26px);
          color:rgba(255,255,255,.8);pointer-events:none;z-index:2;
          animation:ncSnowFall linear infinite;
        }
        @keyframes ncSnowFall{
          0%{top:-40px;transform:translateX(0) rotate(0deg);}
          100%{top:110%;transform:translateX(30px) rotate(360deg);}
        }

        /* ── 헤더 ── */
        .nc-game-header{
          position:relative;z-index:10;
          display:flex;align-items:center;justify-content:space-between;
          padding:8px 16px;min-height:52px;
          background:rgba(255,255,255,.55);
          backdrop-filter:blur(6px);
          box-shadow:0 3px 10px rgba(0,0,0,.07);
          border-radius:0 0 22px 22px;
        }

        /* ── 진행 도트 ── */
        .nc-dot-progress{display:flex;gap:10px;align-items:center;}
        .nc-dot{
          width:20px;height:20px;border-radius:50%;
          background:rgba(255,255,255,.5);
          border:3px solid rgba(255,255,255,.9);
          box-shadow:0 2px 6px rgba(0,0,0,.18);
          transition:background .4s,transform .4s,box-shadow .4s;
        }
        .nc-dot.done{background:#4CAF50;border-color:#fff;}
        .nc-dot.active{
          background:#FF7A1A;border-color:#fff;
          transform:scale(1.45);
          box-shadow:0 0 0 5px rgba(255,122,26,.35);
        }

        /* ── 홈 버튼 ── */
        .nc-home-btn{
          font-size:30px;cursor:pointer;user-select:none;
          line-height:1;transition:transform .15s;
        }
        .nc-home-btn:active{transform:scale(.85);}

        /* ── 차량 영역 ── */
        .nc-objects-area{
          flex:1;min-height:0;position:relative;z-index:5;
          display:flex;align-items:center;justify-content:center;
          padding:clamp(6px,2vw,20px);
          overflow:hidden;
        }
        .nc-road-bg{
          position:absolute;bottom:6%;left:-12%;right:-12%;
          height:clamp(44px,8vw,72px);
          border-radius:50%;transform:rotateX(70deg);
          border:3px solid rgba(255,255,255,.6);
          z-index:0;transition:background .8s,box-shadow .8s;
        }

        /* ── 차량 그리드 ── */
        .nc-vehicles-wrapper{
          position:relative;z-index:10;
          width:min(100%, 780px);
          display:grid;
          gap:clamp(8px,2.5vw,24px);
          padding:4px;
          justify-items:center;align-items:center;
        }

        /* ── 차량 셀 (카운팅 도트 포지션 기준) ── */
        .nc-vehicle-cell{
          position:relative;
          display:flex;align-items:flex-end;justify-content:center;
        }

        /* ── 차량 이미지 ── */
        .nc-vehicle-img{
          width:clamp(88px,22vw,220px);
          max-height:clamp(78px,20vw,200px);
          object-fit:contain;
          user-select:none;pointer-events:none;
          filter:drop-shadow(0 10px 12px rgba(0,0,0,.28));
          transition:filter .2s;
        }

        /* ── 카운팅 하이라이트 동그라미 ── */
        .nc-count-dot{
          position:absolute;top:-18px;left:50%;transform:translateX(-50%);
          width:clamp(26px,7vw,40px);height:clamp(26px,7vw,40px);
          border-radius:50%;
          background:radial-gradient(circle at 35% 35%, #fff 0%, #FFD700 50%, #FF8C00 100%);
          border:3px solid #fff;
          box-shadow:0 0 10px 4px rgba(255,200,0,.7);
          display:flex;align-items:center;justify-content:center;
          font-size:clamp(13px,3.5vw,20px);font-weight:900;color:#7B3F00;
          animation:ncCountPop .35s cubic-bezier(.175,.885,.32,1.275);
          pointer-events:none;z-index:20;
        }
        @keyframes ncCountPop{
          0%{transform:translateX(-50%) scale(0);}
          70%{transform:translateX(-50%) scale(1.25);}
          100%{transform:translateX(-50%) scale(1);}
        }

        /* ── 달려나가기 ── */
        .drive-out{animation:ncDriveOut .55s cubic-bezier(.4,0,.2,1) forwards;}
        @keyframes ncDriveOut{
          0%{transform:translateX(0) scaleX(1);opacity:1;}
          40%{transform:translateX(15px) scaleX(1.08);opacity:1;}
          100%{transform:translateX(140vw) scaleX(1.1);opacity:0;}
        }

        /* ── 춤 ── */
        .dance{animation:ncDance .6s infinite alternate cubic-bezier(.4,0,.2,1);}
        @keyframes ncDance{
          from{transform:translateY(0) rotate(-7deg);}
          to{transform:translateY(-20px) rotate(7deg) scale(1.07);}
        }

        /* ── 오답 흔들림 ── */
        .shake{animation:ncShake .45s ease-in-out;}
        @keyframes ncShake{
          0%,100%{transform:translateX(0);}
          22%{transform:translateX(-16px) rotate(-4deg);}
          66%{transform:translateX(16px) rotate(4deg);}
        }

        /* ── 오답 빨간빛 플래시 ── */
        .nc-wrong-flash{
          position:absolute;inset:0;z-index:50;pointer-events:none;
          background:rgba(220,30,30,.38);
          animation:ncRedFlash .65s ease-out forwards;
        }
        @keyframes ncRedFlash{
          0%{opacity:0;}20%{opacity:1;}100%{opacity:0;}
        }

        /* ── 오답 슬픈 이모지 ── */
        .nc-sad-emoji{
          position:absolute;top:50%;left:50%;z-index:55;pointer-events:none;
          font-size:clamp(60px,18vw,120px);
          transform:translate(-50%,-50%);
          animation:ncSadPop .85s cubic-bezier(.175,.885,.32,1.275) forwards;
        }
        @keyframes ncSadPop{
          0%{transform:translate(-50%,-50%) scale(0);opacity:0;}
          40%{transform:translate(-50%,-50%) scale(1.2);opacity:1;}
          75%{transform:translate(-50%,-50%) scale(1);opacity:1;}
          100%{transform:translate(-50%,-50%) scale(0.8);opacity:0;}
        }

        /* ── 정답 이모지 코너 팝업 ── */
        .nc-correct-overlay{
          position:absolute;top:8%;right:5%;z-index:30;pointer-events:none;
          font-size:clamp(48px,13vw,100px);
          animation:ncCornerPop 2s cubic-bezier(.175,.885,.32,1.275) forwards;
        }
        @keyframes ncCornerPop{
          0%{transform:scale(0) rotate(-25deg);opacity:0;}
          30%{transform:scale(1.3) rotate(10deg);opacity:1;}
          70%{transform:scale(1.1) rotate(-5deg);opacity:1;}
          100%{transform:scale(1.4) rotate(0);opacity:0;}
        }

        /* ── 별 폭죽 ── */
        .nc-star{
          position:absolute;pointer-events:none;z-index:20;
          font-size:clamp(26px,8vw,50px);
          animation:ncStarBurst 1.5s forwards cubic-bezier(.175,.885,.32,1.275);
        }
        @keyframes ncStarBurst{
          0%{transform:scale(0) rotate(0deg);opacity:1;}
          55%{transform:scale(1.7) rotate(210deg);opacity:1;}
          100%{transform:scale(2.3) rotate(400deg);opacity:0;}
        }

        /* ── 하단 선택 버튼 영역 ── */
        .nc-interaction-area{
          position:relative;z-index:10;
          padding:8px clamp(10px,3vw,20px) max(18px,env(safe-area-inset-bottom));
        }
        .nc-choices-area{
          display:flex;justify-content:center;
          gap:clamp(14px,4vw,30px);flex-wrap:wrap;
        }

        /* ── 숫자 버튼 ── */
        .nc-toy-block-btn{
          width:clamp(90px,22vw,144px);
          height:clamp(90px,22vw,144px);
          font-size:clamp(48px,12vw,80px);
          font-weight:900;font-family:'Jua','Apple SD Gothic Neo',sans-serif;
          border-radius:26px;border:5px solid #fff;
          color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.22);
          background:linear-gradient(135deg,#FFD93D,#FFAA00);
          box-shadow:0 10px 0 #E65100,0 14px 22px rgba(0,0,0,.22);
          transition:transform .1s,box-shadow .1s,filter .15s;cursor:pointer;
        }
        .nc-toy-block-btn:nth-child(2){background:linear-gradient(135deg,#4CAF50,#2E7D32);box-shadow:0 10px 0 #1B5E20,0 14px 22px rgba(0,0,0,.22);}
        .nc-toy-block-btn:nth-child(3){background:linear-gradient(135deg,#1E90FF,#1565C0);box-shadow:0 10px 0 #0D47A1,0 14px 22px rgba(0,0,0,.22);}
        .nc-toy-block-btn:active{transform:translateY(10px);box-shadow:0 0 0 transparent,0 4px 10px rgba(0,0,0,.2);}
        .nc-toy-block-btn:disabled{filter:saturate(.55) brightness(.88);cursor:default;}

        /* ── 완료 패널 ── */
        .nc-success-panel{
          position:absolute;bottom:0;left:0;right:0;z-index:40;
          flex-direction:column;align-items:center;
          padding:22px 16px max(22px,env(safe-area-inset-bottom));
          background:rgba(255,255,255,.93);
          backdrop-filter:blur(8px);
          border-radius:32px 32px 0 0;
          box-shadow:0 -10px 36px rgba(0,0,0,.14);
          animation:ncSlideUp .55s cubic-bezier(.175,.885,.32,1.275);
        }
        @keyframes ncSlideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
        .nc-action-buttons{display:flex;gap:18px;justify-content:center;}
        .nc-action-btn{
          width:clamp(82px,20vw,112px);height:clamp(82px,20vw,112px);
          font-size:clamp(36px,9vw,54px);
          border-radius:50%;border:5px solid #fff;
          box-shadow:0 8px 0 rgba(0,0,0,.16);
          transition:transform .1s,box-shadow .1s;cursor:pointer;
        }
        .nc-action-btn:active{transform:translateY(6px);box-shadow:0 2px 0 rgba(0,0,0,.16);}
        .nc-btn-replay{background:#4CAF50;}
        .nc-btn-next{background:#2196F3;}
        .nc-btn-home2{background:#FF9800;}

        /* ── 반응형 ── */
        @media (min-width:600px){
          .nc-vehicle-img{width:clamp(120px,18vw,220px);max-height:clamp(110px,16vw,200px);}
          .nc-toy-block-btn{width:clamp(112px,14vw,152px);height:clamp(112px,14vw,152px);}
        }
        @media (max-width:380px){
          .nc-vehicle-img{width:clamp(70px,24vw,110px);max-height:78px;}
          .nc-toy-block-btn{width:80px;height:80px;font-size:40px;}
        }
        @media (max-height:600px){
          .nc-vehicle-img{width:clamp(58px,15vw,110px);max-height:74px;}
          .nc-toy-block-btn{width:74px;height:74px;font-size:40px;}
          .nc-game-header{min-height:38px;padding:5px 12px;}
        }
      `;
      document.head.appendChild(style);
      this.state.styleElement = style;
    },

    /* ════════════════════════════
       destroy
    ════════════════════════════ */
    destroy:function(){
      this.clearTimers();
      if(this.state.styleElement){ this.state.styleElement.remove(); this.state.styleElement=null; }
      if(this.state.container)   { this.state.container.innerHTML=''; }
      this.state.currentLevel   = 1;
      this.state.currentAnswer  = 0;
      this.state.currentVehicle = null;
      this.state.correctCount   = 0;
      this.state.isAnimating    = false;
      this.state.gameVehicles   = [];
      this.state.container      = null;
      this.state.options        = {};
    }
  };
})();