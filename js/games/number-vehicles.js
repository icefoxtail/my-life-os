(function(){
  const GAME_KEY = 'numberVehicles';
  const BLOCKS_PATH = 'assets/games/number-vehicles/blocks';

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

  const styleHTML = `<style>
    *{
      margin:0;
      padding:0;
      box-sizing:border-box;
      -webkit-tap-highlight-color: transparent;
    }

    .number-vehicles-root{
      width:100%;
      height:100%;
      overflow:hidden;
      font-family:'Pretendard',sans-serif;
    }

    .game-wrap{
      width:100%;
      height:100%;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:space-between;
      padding:2vh 3vw;
      position:relative;
    }

    .title{
      font-size:min(7vw,42px);
      font-weight:900;
      color:white;
      text-shadow:0 4px 12px rgba(0,0,0,0.25);
    }

    .guide-text{
      margin-top:1vh;
      font-size:min(4vw,24px);
      color:#fff;
      font-weight:800;
      text-shadow:0 2px 8px rgba(0,0,0,0.25);
    }

    .vehicle-stage{
      position:relative;
      width:min(92vw,900px);
      height:54vh;
      display:flex;
      align-items:center;
      justify-content:center;
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

    .slot img{
      width:100%;
      height:100%;
      object-fit:contain;
    }

    .blocks-wrap{
      width:100%;
      display:flex;
      justify-content:center;
      gap:min(2vw,18px);
      flex-wrap:wrap;
      padding-bottom:2vh;
    }

    .block{
      position:relative;
      width:min(22vw,130px);
      height:min(22vw,130px);
      cursor:pointer;
      transition:
        transform .18s ease,
        opacity .35s ease;
    }

    .block:active{
      transform:scale(0.94);
    }

    .block.disabled{
      pointer-events:none;
      opacity:0.25;
    }

    .block img{
      width:100%;
      height:100%;
      object-fit:contain;
      pointer-events:none;
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
  </style>`;

  const templateHTML = `
    <div class="number-vehicles-root">
      <div class="game-wrap">
        <div>
          <div class="title">숫자 탈것 만들기</div>
          <div class="guide-text" id="guideText">반짝이는 칸에 맞는 블록을 골라볼까?</div>
        </div>

        <div class="vehicle-stage" id="vehicleStage">
          <div class="complete-banner" id="completeBanner">우와! 완성!</div>
          <div class="vehicle-base"></div>
        </div>

        <div class="blocks-wrap" id="blocksWrap"></div>
      </div>
    </div>`;

  const game = {
    container: null,
    options: {},
    state: {
      currentVehicle: null,
      currentSlotIndex: 0,
      slotElements: []
    },

    render(container, options) {
      this.container = container;
      this.options = options || {};
      this.container.innerHTML = styleHTML + templateHTML;
      this.stage = this.container.querySelector('#vehicleStage');
      this.blocksWrap = this.container.querySelector('#blocksWrap');
      this.guideText = this.container.querySelector('#guideText');
      this.completeBanner = this.container.querySelector('#completeBanner');
      this.nextRound();
    },

    speak(text) {
      if (this.options.speakGuide) {
        this.options.speakGuide(text, true);
        return;
      }
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ko-KR';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    },

    shuffle(array) {
      return [...array].sort(() => Math.random() - 0.5);
    },

    createVehicle() {
      this.stage.querySelectorAll('.slot').forEach(el => el.remove());
      this.state.currentVehicle = this.shuffle(VEHICLES)[0];
      this.state.currentSlotIndex = 0;
      this.state.slotElements = [];

      this.state.currentVehicle.slots.forEach((slot, index) => {
        const div = document.createElement('div');
        div.className = 'slot';
        div.style.left = slot.x + '%';
        div.style.top = slot.y + '%';
        div.style.width = slot.w + '%';
        div.style.height = slot.h + '%';
        if (index === 0) div.classList.add('active');
        this.stage.appendChild(div);
        this.state.slotElements.push(div);
      });

      this.guideText.textContent = `${this.state.currentVehicle.name}를 만들어볼까?`;
      this.speak(`${this.state.currentVehicle.name}를 만들어보자!`);
    },

    createBlocks() {
      this.blocksWrap.innerHTML = '';
      const mixed = this.shuffle(this.state.currentVehicle.slots);

      mixed.forEach(slot => {
        const block = document.createElement('div');
        block.className = 'block';
        const color = COLORS[slot.number];
        const file = `${slot.shape}_${color}_${slot.number}.webp`;
        block.dataset.number = slot.number;
        block.innerHTML = `<img src="${BLOCKS_PATH}/${file}">`;
        block.addEventListener('click', () => this.onBlockClick(block, slot));
        this.blocksWrap.appendChild(block);
      });
    },

    onBlockClick(block, blockData) {
      const target = this.state.currentVehicle.slots[this.state.currentSlotIndex];
      if (blockData.number !== target.number) {
        this.wrongEffect(block);
        this.speak(`${target.number}번을 찾아볼까?`);
        return;
      }
      this.placeBlock(block, blockData);
    },

    wrongEffect(block) {
      block.animate([
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-12px)' },
        { transform: 'translateX(12px)' },
        { transform: 'translateX(0px)' }
      ], { duration: 320 });
    },

    placeBlock(block, blockData) {
      const targetEl = this.state.slotElements[this.state.currentSlotIndex];
      const color = COLORS[blockData.number];
      const img = document.createElement('img');
      img.src = `${BLOCKS_PATH}/${blockData.shape}_${color}_${blockData.number}.webp`;
      targetEl.classList.remove('active');
      targetEl.classList.add('filled');
      targetEl.appendChild(img);
      block.classList.add('disabled');
      this.speak(`${blockData.number}! 좋아!`);
      this.state.currentSlotIndex++;

      if (this.state.currentSlotIndex < this.state.slotElements.length) {
        this.state.slotElements[this.state.currentSlotIndex].classList.add('active');
      }

      if (this.state.currentSlotIndex >= this.state.slotElements.length) {
        this.completeVehicle();
      }
    },

    completeVehicle() {
      this.completeBanner.classList.add('show');
      this.stage.classList.add('vehicle-finished');
      this.createConfetti();
      this.speak('우와! 탈것 완성!');
      setTimeout(() => {
        this.stage.classList.add('vehicle-drive');
      }, 1200);
      setTimeout(() => {
        this.nextRound();
      }, 3600);
    },

    createConfetti() {
      const colors = ['#ff5b5b', '#ffd93d', '#45c2ff', '#82ff4d', '#b366ff'];
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = Math.random() * 180 + 'px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1400);
      }
    },

    nextRound() {
      this.completeBanner.classList.remove('show');
      this.stage.classList.remove('vehicle-finished');
      this.stage.classList.remove('vehicle-drive');
      this.createVehicle();
      this.createBlocks();
    }
  };

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = game;
})();