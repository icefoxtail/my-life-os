(function(){
  const GAME_KEY = 'numberVehicles';
  const STYLE_ID = 'sihyeon-number-vehicles-style';
  const BLOCKS_PATH = './assets/games/number-vehicles/blocks';

  const BLOCK_FALLBACKS = {
    'roof_red_1': '<svg viewBox="0 0 100 100"><polygon points="50,20 80,60 20,60" fill="#ff5b5b"/></svg>',
    'square_blue_2': '<svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#45c2ff"/></svg>',
    'triangle_yellow_3': '<svg viewBox="0 0 100 100"><polygon points="50,15 85,85 15,85" fill="#ffd93d"/></svg>',
    'rectangle_green_4': '<svg viewBox="0 0 100 100"><rect x="15" y="30" width="70" height="40" fill="#82ff4d"/></svg>',
    'wheel_purple_5': '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#b366ff"/><circle cx="50" cy="50" r="20" fill="#fff"/></svg>'
  };

  const COLORS = {
    1:'red',
    2:'blue',
    3:'yellow',
    4:'green',
    5:'purple'
  };

  const VEHICLES = [
    {
      name:'소방차',
      slots:[
        { shape:'roof', x:40, y:14, w:18, h:16, number:1 },
        { shape:'square', x:26, y:26, w:18, h:18, number:2 },
        { shape:'triangle', x:54, y:26, w:18, h:18, number:3 },
        { shape:'rectangle', x:24, y:48, w:48, h:18, number:4 },
        { shape:'wheel', x:38, y:70, w:22, h:18, number:5 }
      ]
    },
    {
      name:'경찰차',
      slots:[
        { shape:'roof', x:40, y:16, w:18, h:16, number:1 },
        { shape:'triangle', x:28, y:30, w:18, h:18, number:2 },
        { shape:'rectangle', x:38, y:44, w:34, h:18, number:3 },
        { shape:'rectangle', x:22, y:58, w:50, h:18, number:4 },
        { shape:'wheel', x:38, y:78, w:22, h:18, number:5 }
      ]
    },
    {
      name:'구급차',
      slots:[
        { shape:'square', x:36, y:18, w:18, h:18, number:1 },
        { shape:'triangle', x:54, y:18, w:18, h:18, number:2 },
        { shape:'rectangle', x:30, y:40, w:44, h:18, number:3 },
        { shape:'rectangle', x:24, y:60, w:50, h:18, number:4 },
        { shape:'wheel', x:38, y:80, w:22, h:18, number:5 }
      ]
    }
  ];

  function isLandscapeMode(){
    try{
      return window.matchMedia('(orientation: landscape) and (min-width: 768px) and (min-height: 520px)').matches;
    }catch(error){
      return window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
    }
  }

  function getLayoutMode(){
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  function injectStyle(){
    const prev = document.getElementById(STYLE_ID);
    if(prev) prev.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .number-vehicles-root{
        width:100%;
        height:100%;
        overflow:hidden;
        font-family:'Pretendard','Jua',sans-serif;
        background:
          radial-gradient(circle at 18% 16%, rgba(255,255,255,0.85) 0 8%, transparent 8.5%),
          radial-gradient(circle at 82% 20%, rgba(255,255,255,0.72) 0 7%, transparent 7.5%),
          linear-gradient(to bottom, #72cfff 0%, #bde9ff 45%, #89d66a 46%, #74c85a 100%);
        user-select:none;
        touch-action:manipulation;
        color:#17324a;
        box-sizing:border-box;
      }

      .number-vehicles-root *,
      .number-vehicles-root *::before,
      .number-vehicles-root *::after{
        box-sizing:border-box;
        -webkit-tap-highlight-color:transparent;
      }

      .number-vehicles-root.number-vehicles-portrait{
        display:flex;
        flex-direction:column;
      }

      .number-vehicles-root.number-vehicles-landscape{
        display:grid;
        grid-template-columns:minmax(220px, 25%) minmax(380px, 1fr) minmax(240px, 28%);
        grid-template-rows:1fr;
        gap:clamp(10px, 1.6vw, 18px);
        padding:max(12px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
      }

      .nv-info-panel{
        position:relative;
        z-index:10;
        min-height:0;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:flex-start;
        flex-shrink:0;
        padding:2vh 3vw 0;
        text-align:center;
      }

      .number-vehicles-landscape .nv-info-panel{
        grid-column:1;
        grid-row:1;
        justify-content:center;
        align-items:stretch;
        gap:14px;
        padding:0;
      }

      .nv-info-card{
        display:grid;
        gap:10px;
        width:100%;
      }

      .number-vehicles-landscape .nv-info-card{
        border:6px solid rgba(255,255,255,0.82);
        border-radius:32px;
        background:rgba(255,255,255,0.72);
        box-shadow:0 12px 30px rgba(0,0,0,0.14);
        padding:18px 14px;
      }

      .title{
        font-size:min(7vw,42px);
        font-weight:900;
        color:white;
        text-shadow:0 4px 12px rgba(0,0,0,0.25);
        line-height:1.08;
      }

      .number-vehicles-landscape .title{
        font-size:clamp(28px,3.2vw,44px);
        color:#17324a;
        text-shadow:none;
      }

      .guide-text{
        margin-top:1vh;
        font-size:min(4vw,24px);
        color:#fff;
        font-weight:800;
        text-shadow:0 2px 8px rgba(0,0,0,0.25);
        line-height:1.25;
        min-height:1.25em;
      }

      .number-vehicles-landscape .guide-text{
        margin-top:0;
        font-size:clamp(17px,1.8vw,24px);
        color:#0d47a1;
        text-shadow:none;
      }

      .nv-progress-card{
        display:none;
      }

      .number-vehicles-landscape .nv-progress-card{
        display:grid;
        place-items:center;
        min-height:110px;
        border:5px dashed rgba(255,255,255,0.78);
        border-radius:28px;
        background:rgba(255,255,255,0.38);
        padding:14px;
        text-align:center;
        font-size:clamp(18px,2vw,28px);
        font-weight:900;
        color:#17324a;
        line-height:1.3;
      }

      .vehicle-stage{
        position:relative;
        width:min(92vw,900px);
        height:54vh;
        display:flex;
        align-items:center;
        justify-content:center;
        flex:1;
        min-height:0;
      }

      .number-vehicles-landscape .vehicle-stage{
        grid-column:2;
        grid-row:1;
        width:100%;
        height:100%;
        min-height:0;
        border:7px solid rgba(255,255,255,0.78);
        border-radius:36px;
        background:rgba(255,255,255,0.2);
        box-shadow:0 14px 32px rgba(0,0,0,0.14);
        overflow:hidden;
      }

      .vehicle-base{
        position:absolute;
        width:min(90vw,760px);
        aspect-ratio:1.4/1;
        border-radius:40px;
        background:
          linear-gradient(to bottom,
            rgba(255,255,255,0.18),
            rgba(255,255,255,0.06));
        backdrop-filter: blur(8px);
        box-shadow:
          inset 0 4px 20px rgba(255,255,255,0.15),
          0 20px 40px rgba(0,0,0,0.12);
      }

      .number-vehicles-landscape .vehicle-base{
        width:min(100%,760px);
        max-height:78vh;
      }

      .slot{
        position:absolute;
        border-radius:24px;
        border:4px dashed rgba(255,255,255,0.5);
        background:rgba(255,255,255,0.14);
        display:flex;
        align-items:center;
        justify-content:center;
        transition:all .25s ease;
      }

      .slot.active{
        transform:scale(1.04);
        border-color:#fff176;
        box-shadow:0 0 20px rgba(255,241,118,0.7);
      }

      .slot.filled{
        border:none;
        background:transparent;
        box-shadow:none;
      }

      .slot img,
      .slot svg{
        width:100%;
        height:100%;
        object-fit:contain;
      }

      .blocks-wrap{
        position:relative;
        z-index:20;
        width:100%;
        display:flex;
        justify-content:center;
        gap:min(2vw,18px);
        flex-wrap:wrap;
        padding:0 3vw 2vh;
        flex-shrink:0;
      }

      .number-vehicles-landscape .blocks-wrap{
        grid-column:3;
        grid-row:1;
        width:100%;
        height:100%;
        min-height:0;
        display:grid;
        grid-template-columns:1fr;
        align-content:center;
        justify-items:center;
        gap:clamp(10px,1.6vw,16px);
        padding:0;
        border:6px solid rgba(255,255,255,0.82);
        border-radius:32px;
        background:rgba(255,255,255,0.68);
        box-shadow:0 12px 30px rgba(0,0,0,0.14);
      }

      .block{
        position:relative;
        width:min(22vw,130px);
        height:min(22vw,130px);
        cursor:pointer;
        transition:
          transform .18s ease,
          opacity .35s ease,
          filter .25s ease;
        border:0;
        background:transparent;
        padding:0;
        touch-action:manipulation;
      }

      .number-vehicles-landscape .block{
        width:clamp(88px,12vw,142px);
        height:clamp(88px,12vw,142px);
      }

      .block:active{
        transform:scale(0.94);
      }

      .block.disabled{
        pointer-events:none;
        opacity:0.25;
      }

      .block img,
      .block svg{
        width:100%;
        height:100%;
        object-fit:contain;
        pointer-events:none;
        filter:drop-shadow(0 8px 0 rgba(0,0,0,0.12));
      }

      .complete-banner{
        position:absolute;
        top:8%;
        left:50%;
        transform:translateX(-50%) scale(.7);
        padding:16px 28px;
        border-radius:999px;
        background:rgba(255,255,255,0.92);
        font-size:min(7vw,48px);
        font-weight:900;
        color:#ff5b5b;
        opacity:0;
        transition:all .4s ease;
        box-shadow:0 10px 30px rgba(0,0,0,0.18);
        z-index:60;
        pointer-events:none;
        white-space:nowrap;
      }

      .number-vehicles-landscape .complete-banner{
        font-size:clamp(32px,4.2vw,58px);
      }

      .complete-banner.show{
        opacity:1;
        transform:translateX(-50%) scale(1);
      }

      .confetti{
        position:absolute;
        width:16px;
        height:16px;
        border-radius:4px;
        animation:fall 1.4s linear forwards;
        z-index:100;
        pointer-events:none;
      }

      @keyframes fall{
        from{
          transform:translateY(0) rotate(0deg);
          opacity:1;
        }
        to{
          transform:translateY(300px) rotate(720deg);
          opacity:0;
        }
      }

      .vehicle-finished{
        animation:bounce 1s ease infinite alternate;
      }

      @keyframes bounce{
        from{ transform:translateY(0px); }
        to{ transform:translateY(-10px); }
      }

      .vehicle-drive{
        animation:driveAway 2.2s ease forwards;
      }

      @keyframes driveAway{
        0%{
          transform:translateX(0);
        }
        100%{
          transform:translateX(120vw);
        }
      }

      @media (max-width:700px){
        .vehicle-stage{
          height:50vh;
        }

        .slot{
          border-radius:16px;
        }
      }

      @media (orientation:landscape) and (max-height:540px){
        .number-vehicles-root.number-vehicles-landscape{
          grid-template-columns:minmax(170px,24%) minmax(300px,1fr) minmax(180px,28%);
          gap:8px;
          padding:8px;
        }

        .number-vehicles-landscape .nv-info-card,
        .number-vehicles-landscape .blocks-wrap,
        .number-vehicles-landscape .vehicle-stage{
          border-width:4px;
          border-radius:24px;
        }

        .number-vehicles-landscape .title{
          font-size:22px;
        }

        .number-vehicles-landscape .guide-text,
        .number-vehicles-landscape .nv-progress-card{
          font-size:14px;
        }

        .number-vehicles-landscape .block{
          width:72px;
          height:72px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function removeStyle(){
    const prev = document.getElementById(STYLE_ID);
    if(prev) prev.remove();
  }

  function createFallbackElement(key){
    const wrap = document.createElement('span');
    wrap.innerHTML = BLOCK_FALLBACKS[key] || '<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#999"/></svg>';
    return wrap.firstElementChild;
  }

  function createBlockImage(slot){
    const color = COLORS[slot.number];
    const fallbackKey = `${slot.shape}_${color}_${slot.number}`;
    const img = document.createElement('img');
    img.src = `${BLOCKS_PATH}/${slot.shape}_${color}_${slot.number}.webp`;
    img.alt = '';
    img.draggable = false;
    img.onerror = () => {
      const fallback = createFallbackElement(fallbackKey);
      img.replaceWith(fallback);
    };
    return img;
  }

  const game = {
    container: null,
    options: {},
    stage: null,
    blocksWrap: null,
    guideText: null,
    completeBanner: null,
    progressCard: null,
    layoutMode: 'portrait',
    resizeTimer: null,
    handleResizeBound: null,
    timers: [],
    confettiNodes: [],
    locked: false,
    isCompleting: false,
    successRewardGiven: false,
    completeRewardGiven: false,
    state: {
      currentVehicle: null,
      currentSlotIndex: 0,
      slotElements: [],
      placedSlots: []
    },

    render(container, options) {
      this.destroy();

      this.container = container;
      this.options = options || {};
      this.layoutMode = getLayoutMode();
      this.locked = false;
      this.isCompleting = false;
      this.successRewardGiven = false;
      this.completeRewardGiven = false;
      this.state.currentVehicle = null;
      this.state.currentSlotIndex = 0;
      this.state.slotElements = [];
      this.state.placedSlots = [];

      injectStyle();
      this.bindResizeEvents();
      this.renderShell();
      this.nextRound();
    },

    bindResizeEvents() {
      if (this.handleResizeBound) return;
      this.handleResizeBound = () => this.handleResize();
      window.addEventListener('resize', this.handleResizeBound, { passive: true });
      window.addEventListener('orientationchange', this.handleResizeBound, { passive: true });
    },

    unbindResizeEvents() {
      if (!this.handleResizeBound) return;
      window.removeEventListener('resize', this.handleResizeBound);
      window.removeEventListener('orientationchange', this.handleResizeBound);
      this.handleResizeBound = null;
    },

    handleResize() {
      if (!this.container) return;
      if (this.resizeTimer) window.clearTimeout(this.resizeTimer);

      this.resizeTimer = window.setTimeout(() => {
        this.resizeTimer = null;
        if (!this.container) return;

        const nextMode = getLayoutMode();
        if (nextMode === this.layoutMode) return;

        if (this.isCompleting) {
          return;
        }

        this.layoutMode = nextMode;
        this.renderShell();
        this.rebuildCurrentRound();
      }, 140);
    },

    setManagedTimeout(fn, delay) {
      const id = window.setTimeout(() => {
        this.timers = this.timers.filter((timerId) => timerId !== id);
        if (this.container) fn();
      }, delay);
      this.timers.push(id);
      return id;
    },

    clearTimers() {
      this.timers.forEach((id) => window.clearTimeout(id));
      this.timers = [];
      if (this.resizeTimer) {
        window.clearTimeout(this.resizeTimer);
        this.resizeTimer = null;
      }
    },

    renderShell() {
      if (!this.container) return;

      const mode = getLayoutMode();
      this.layoutMode = mode;

      if (mode === 'landscape') {
        this.container.innerHTML = `
          <div class="number-vehicles-root number-vehicles-landscape">
            <aside class="nv-info-panel">
              <div class="nv-info-card">
                <div class="title">숫자 탈것 만들기</div>
                <div class="guide-text" id="guideText">반짝이는 칸에 맞는 블록을 골라볼까?</div>
              </div>
              <div class="nv-progress-card" id="progressCard">1번 블록부터<br>차례대로 골라요</div>
            </aside>

            <main class="vehicle-stage" id="vehicleStage">
              <div class="complete-banner" id="completeBanner">우와! 완성!</div>
              <div class="vehicle-base"></div>
            </main>

            <section class="blocks-wrap" id="blocksWrap"></section>
          </div>
        `;
      } else {
        this.container.innerHTML = `
          <div class="number-vehicles-root number-vehicles-portrait">
            <div class="nv-info-panel">
              <div class="nv-info-card">
                <div class="title">숫자 탈것 만들기</div>
                <div class="guide-text" id="guideText">반짝이는 칸에 맞는 블록을 골라볼까?</div>
              </div>
            </div>

            <div class="vehicle-stage" id="vehicleStage">
              <div class="complete-banner" id="completeBanner">우와! 완성!</div>
              <div class="vehicle-base"></div>
            </div>

            <div class="blocks-wrap" id="blocksWrap"></div>
          </div>
        `;
      }

      this.stage = this.container.querySelector('#vehicleStage');
      this.blocksWrap = this.container.querySelector('#blocksWrap');
      this.guideText = this.container.querySelector('#guideText');
      this.completeBanner = this.container.querySelector('#completeBanner');
      this.progressCard = this.container.querySelector('#progressCard');
    },

    rebuildCurrentRound() {
      if (!this.state.currentVehicle) return;
      this.createVehicle({ preserveVehicle: true, silent: true });
      this.createBlocks();
      this.updateGuide();
    },

    speak(text) {
      if (!text) return;

      if (this.options.speakGuide) {
        this.options.speakGuide(text, true);
        return;
      }

      if (!window.speechSynthesis) return;

      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ko-KR';
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
      } catch (error) {}
    },

    shuffle(array) {
      return [...array].sort(() => Math.random() - 0.5);
    },

    createVehicle(config = {}) {
      if (!this.stage) return;

      this.stage.querySelectorAll('.slot').forEach(el => el.remove());

      if (!config.preserveVehicle || !this.state.currentVehicle) {
        this.state.currentVehicle = this.shuffle(VEHICLES)[0];
        this.state.currentSlotIndex = 0;
        this.state.placedSlots = [];
      }

      this.state.slotElements = [];

      this.state.currentVehicle.slots.forEach((slot, index) => {
        const div = document.createElement('div');
        div.className = 'slot';
        div.style.left = slot.x + '%';
        div.style.top = slot.y + '%';
        div.style.width = slot.w + '%';
        div.style.height = slot.h + '%';

        const isPlaced = this.state.placedSlots.includes(index);
        if (isPlaced) {
          div.classList.add('filled');
          div.appendChild(createBlockImage(slot));
        } else if (index === this.state.currentSlotIndex) {
          div.classList.add('active');
        }

        this.stage.appendChild(div);
        this.state.slotElements.push(div);
      });

      this.updateGuide();

      if (!config.silent) {
        this.speak(`${this.state.currentVehicle.name}를 만들어보자!`);
      }
    },

    updateGuide() {
      if (!this.state.currentVehicle) return;

      const nextSlot = this.state.currentVehicle.slots[this.state.currentSlotIndex];
      const nextNumber = nextSlot ? nextSlot.number : '';

      if (this.guideText) {
        this.guideText.textContent = `${this.state.currentVehicle.name}를 만들어볼까?`;
      }

      if (this.progressCard) {
        this.progressCard.innerHTML = nextSlot
          ? `${nextNumber}번 블록을<br>찾아볼까요?`
          : `완성 준비!`;
      }
    },

    createBlocks() {
      if (!this.blocksWrap || !this.state.currentVehicle) return;

      this.blocksWrap.innerHTML = '';
      const mixed = this.shuffle(this.state.currentVehicle.slots);

      mixed.forEach(slot => {
        const block = document.createElement('button');
        block.type = 'button';
        block.className = 'block';
        block.dataset.number = String(slot.number);

        const slotIndex = this.state.currentVehicle.slots.indexOf(slot);
        if (this.state.placedSlots.includes(slotIndex)) {
          block.classList.add('disabled');
        }

        block.appendChild(createBlockImage(slot));
        block.addEventListener('click', () => this.onBlockClick(block, slot));
        this.blocksWrap.appendChild(block);
      });
    },

    onBlockClick(block, blockData) {
      if (this.locked || this.isCompleting || !this.state.currentVehicle) return;

      const target = this.state.currentVehicle.slots[this.state.currentSlotIndex];
      if (!target) return;

      if (blockData.number !== target.number) {
        this.wrongEffect(block);
        this.speak(`${target.number}번을 찾아볼까?`);
        return;
      }

      this.placeBlock(block, blockData);
    },

    wrongEffect(block) {
      if (!block || typeof block.animate !== 'function') return;

      block.animate([
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-12px)' },
        { transform: 'translateX(12px)' },
        { transform: 'translateX(0px)' }
      ], { duration: 320 });
    },

    placeBlock(block, blockData) {
      if (this.locked || this.isCompleting) return;

      const slotIndex = this.state.currentSlotIndex;
      const targetEl = this.state.slotElements[slotIndex];
      if (!targetEl) return;

      this.locked = true;

      targetEl.classList.remove('active');
      targetEl.classList.add('filled');
      targetEl.appendChild(createBlockImage(blockData));

      block.classList.add('disabled');

      if (!this.state.placedSlots.includes(slotIndex)) {
        this.state.placedSlots.push(slotIndex);
      }

      this.speak(`${blockData.number}! 좋아!`);

      this.state.currentSlotIndex++;

      if (this.state.currentSlotIndex < this.state.slotElements.length) {
        this.state.slotElements[this.state.currentSlotIndex].classList.add('active');
        this.updateGuide();
        this.locked = false;
      }

      if (this.state.currentSlotIndex >= this.state.slotElements.length) {
        this.locked = false;
        this.completeVehicle();
      }
    },

    completeVehicle() {
      if (this.isCompleting) return;

      this.isCompleting = true;
      this.locked = true;

      if (this.completeBanner) {
        this.completeBanner.classList.add('show');
      }

      if (this.stage) {
        this.stage.classList.add('vehicle-finished');
      }

      this.createConfetti();

      if (!this.successRewardGiven) {
        this.successRewardGiven = true;
        this.options.fireConfetti?.();
        this.options.gainExp?.(25);
      }

      this.speak('우와! 탈것 완성!');

      this.setManagedTimeout(() => {
        if (this.stage) this.stage.classList.add('vehicle-drive');
      }, 1200);

      this.setManagedTimeout(() => {
        this.nextRound();
      }, 3600);
    },

    createConfetti() {
      const root = this.container?.querySelector('.number-vehicles-root');
      if (!root) return;

      const colors = ['#ff5b5b', '#ffd93d', '#45c2ff', '#82ff4d', '#b366ff'];
      const rect = root.getBoundingClientRect();

      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * rect.width + 'px';
        confetti.style.top = Math.random() * Math.min(180, rect.height * 0.3) + 'px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        root.appendChild(confetti);
        this.confettiNodes.push(confetti);
        this.setManagedTimeout(() => {
          confetti.remove();
          this.confettiNodes = this.confettiNodes.filter((node) => node !== confetti);
        }, 1400);
      }
    },

    nextRound() {
      this.clearTimers();
      this.confettiNodes.forEach((node) => node.remove());
      this.confettiNodes = [];

      this.locked = false;
      this.isCompleting = false;
      this.successRewardGiven = false;

      if (this.completeBanner) {
        this.completeBanner.classList.remove('show');
      }

      if (this.stage) {
        this.stage.classList.remove('vehicle-finished');
        this.stage.classList.remove('vehicle-drive');
      }

      this.createVehicle();
      this.createBlocks();
    },

    destroy() {
      this.clearTimers();
      this.unbindResizeEvents();

      this.confettiNodes.forEach((node) => node.remove());
      this.confettiNodes = [];

      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch (error) {}

      if (this.container) {
        this.container.innerHTML = '';
      }

      removeStyle();

      this.container = null;
      this.options = {};
      this.stage = null;
      this.blocksWrap = null;
      this.guideText = null;
      this.completeBanner = null;
      this.progressCard = null;
      this.layoutMode = 'portrait';
      this.resizeTimer = null;
      this.handleResizeBound = null;
      this.locked = false;
      this.isCompleting = false;
      this.successRewardGiven = false;
      this.completeRewardGiven = false;
      this.state.currentVehicle = null;
      this.state.currentSlotIndex = 0;
      this.state.slotElements = [];
      this.state.placedSlots = [];
    }
  };

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = game;
})();