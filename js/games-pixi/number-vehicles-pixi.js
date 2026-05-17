/**
 * 시현이 놀이터 OS — 숫자 탈것 만들기 Pixi Edition v1
 * 파일: js/games-pixi/number-vehicles-pixi.js
 */
(function () {
  'use strict';

  const GAME_KEY = 'numberVehiclesPixi';

  const COLOR_HEX = {
    red: 0xff5b5b,
    blue: 0x45c2ff,
    yellow: 0xffd93d,
    green: 0x82ff4d,
    purple: 0xb366ff,
    white: 0xffffff,
    black: 0x1a2e3b,
    orange: 0xff9f1c,
    pink: 0xff7ac8,
    mint: 0x4ee6b8
  };

  const VEHICLES = [
    {
      id: 'firetruck', name: '소방차', emoji: '🚒', mainColor: 0xff4d4d, accentColor: 0xffd93d,
      completeVoice: '소방차 출동!', finaleParticles: [0xff4d4d, 0xffd93d, 0x45c2ff, 0xffffff],
      parts: [
        { id: 'body', number: 1, label: '차체', shape: 'rectangle', color: 'red', rx: 0, ry: 42, w: 430, h: 140 },
        { id: 'window', number: 2, label: '창문', shape: 'window', color: 'blue', rx: -110, ry: -34, w: 130, h: 92 },
        { id: 'ladder', number: 3, label: '사다리', shape: 'ladder', color: 'yellow', rx: 92, ry: -70, w: 280, h: 66 },
        { id: 'light', number: 4, label: '경광등', shape: 'light', color: 'orange', rx: 0, ry: -148, w: 92, h: 58 },
        { id: 'wheelLeft', number: 5, label: '왼쪽 바퀴', shape: 'wheel', color: 'purple', rx: -142, ry: 136, w: 104, h: 104 },
        { id: 'wheelRight', number: 6, label: '오른쪽 바퀴', shape: 'wheel', color: 'purple', rx: 142, ry: 136, w: 104, h: 104 },
        { id: 'hose', number: 7, label: '물호스', shape: 'hose', color: 'green', rx: 164, ry: 34, w: 118, h: 84 }
      ],
      decor: [{ id: 'water', label: '물방울', icon: '💧' }, { id: 'star', label: '별', icon: '⭐' }, { id: 'heart', label: '하트', icon: '💛' }]
    },
    {
      id: 'policecar', name: '경찰차', emoji: '🚓', mainColor: 0xffffff, accentColor: 0x3a7bff,
      completeVoice: '경찰차 출동!', finaleParticles: [0x45c2ff, 0xffffff, 0xffd93d, 0x3a7bff],
      parts: [
        { id: 'body', number: 1, label: '차체', shape: 'rectangle', color: 'white', rx: 0, ry: 46, w: 430, h: 138 },
        { id: 'window', number: 2, label: '창문', shape: 'window', color: 'blue', rx: -86, ry: -42, w: 150, h: 92 },
        { id: 'door', number: 3, label: '문', shape: 'door', color: 'blue', rx: 72, ry: 48, w: 106, h: 110 },
        { id: 'light', number: 4, label: '경광등', shape: 'light', color: 'red', rx: 0, ry: -144, w: 100, h: 58 },
        { id: 'wheelLeft', number: 5, label: '왼쪽 바퀴', shape: 'wheel', color: 'black', rx: -140, ry: 136, w: 104, h: 104 },
        { id: 'wheelRight', number: 6, label: '오른쪽 바퀴', shape: 'wheel', color: 'black', rx: 140, ry: 136, w: 104, h: 104 },
        { id: 'badge', number: 7, label: '경찰 별', shape: 'badge', color: 'yellow', rx: -168, ry: 44, w: 92, h: 92 }
      ],
      decor: [{ id: 'star', label: '별', icon: '⭐' }, { id: 'bolt', label: '번개', icon: '⚡' }, { id: 'flag', label: '깃발', icon: '🚩' }]
    },
    {
      id: 'ambulance', name: '구급차', emoji: '🚑', mainColor: 0xffffff, accentColor: 0xff5b5b,
      completeVoice: '구급차 출동!', finaleParticles: [0xff5b5b, 0xffffff, 0xff7ac8, 0x4ee6b8],
      parts: [
        { id: 'body', number: 1, label: '차체', shape: 'rectangle', color: 'white', rx: 0, ry: 46, w: 430, h: 138 },
        { id: 'window', number: 2, label: '창문', shape: 'window', color: 'mint', rx: -122, ry: -44, w: 128, h: 92 },
        { id: 'cross', number: 3, label: '십자가', shape: 'cross', color: 'red', rx: 76, ry: 38, w: 112, h: 112 },
        { id: 'light', number: 4, label: '경광등', shape: 'light', color: 'red', rx: 0, ry: -144, w: 100, h: 58 },
        { id: 'wheelLeft', number: 5, label: '왼쪽 바퀴', shape: 'wheel', color: 'black', rx: -140, ry: 136, w: 104, h: 104 },
        { id: 'wheelRight', number: 6, label: '오른쪽 바퀴', shape: 'wheel', color: 'black', rx: 140, ry: 136, w: 104, h: 104 },
        { id: 'bag', number: 7, label: '의료 가방', shape: 'bag', color: 'green', rx: 174, ry: 48, w: 98, h: 84 }
      ],
      decor: [{ id: 'heart', label: '하트', icon: '❤️' }, { id: 'sparkle', label: '반짝', icon: '✨' }, { id: 'plus', label: '플러스', icon: '➕' }]
    }
  ];

  const state = {
    container: null, options: {}, runtime: null, vehicleIndex: 0, currentVehicle: null,
    phase: 'build', currentPartIndex: 0, placedPartIds: new Set(), placedDecorCount: 0,
    locked: false, isDragging: false, completing: false, hintCleanup: null,
    rootContainers: {}, slotMap: new Map(), partMap: new Map(), decorMap: new Map(), trayOrigins: new Map(),
    successRewardGiven: false, completeRewardGiven: false
  };

  function getRuntime() { return window.SihyeonPixiRuntime || null; }
  function getMode() { return state.runtime?.getMetrics?.().mode || 'portrait'; }

  function getSceneConfig() {
    const mode = getMode();
    if (mode === 'landscape') {
      return {
        mode, width: 1600, height: 900,
        carCenter: { x: 820, y: 455 }, carScale: 1.08,
        trayStart: { x: 1375, y: 178 }, trayGap: 92, trayColumns: 1, trayItemSize: 86,
        infoPanel: { x: 178, y: 450, w: 300, h: 806 },
        trayPanel: { x: 1374, y: 450, w: 330, h: 806 },
        stagePanel: { x: 820, y: 450, w: 760, h: 806 },
        title: { x: 178, y: 124 }, guide: { x: 178, y: 236 }, progress: { x: 178, y: 368 },
        actionButton: { x: 1374, y: 774, w: 250, h: 82 }
      };
    }
    return {
      mode, width: 900, height: 1600,
      carCenter: { x: 450, y: 690 }, carScale: 0.86,
      trayStart: { x: 142, y: 1210 }, trayGap: 128, trayColumns: 4, trayItemSize: 104,
      infoPanel: { x: 450, y: 126, w: 810, h: 184 },
      trayPanel: { x: 450, y: 1284, w: 820, h: 430 },
      stagePanel: { x: 450, y: 684, w: 820, h: 830 },
      title: { x: 450, y: 82 }, guide: { x: 450, y: 154 }, progress: { x: 450, y: 226 },
      actionButton: { x: 450, y: 1456, w: 420, h: 92 }
    };
  }

  function playVoice(id) {
    if (id && window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') window.SihyeonVoice.play(id, '').catch(() => {});
  }

  function speakGuide(text) {
    if (!text) return;
    if (state.options && typeof state.options.speakGuide === 'function') state.options.speakGuide(text, true);
  }

  function gainExpOnce(amount) { if (state.options && typeof state.options.gainExp === 'function') state.options.gainExp(amount); }
  function fireConfetti() { if (state.options && typeof state.options.fireConfetti === 'function') state.options.fireConfetti(); }

  function makeLayer(name, parent) {
    const c = state.runtime.createContainer(parent);
    c.sortableChildren = true;
    state.rootContainers[name] = c;
    return c;
  }

  function clearHint() {
    if (typeof state.hintCleanup === 'function') state.hintCleanup();
    state.hintCleanup = null;
  }

  function resetRoundFlags() {
    state.locked = false;
    state.isDragging = false;
    state.completing = false;
    state.phase = 'build';
    state.currentPartIndex = 0;
    state.placedPartIds = new Set();
    state.placedDecorCount = 0;
    state.slotMap = new Map();
    state.partMap = new Map();
    state.decorMap = new Map();
    state.trayOrigins = new Map();
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    clearHint();
  }

  function drawSoftBackground() {
    const rt = state.runtime;
    const PIXI = rt.PIXI;
    const cfg = getSceneConfig();
    const g = new PIXI.Graphics();
    g.beginFill(0x72cfff, 1); g.drawRect(0, 0, cfg.width, cfg.height); g.endFill();
    g.beginFill(0xbde9ff, 1); g.drawRect(0, 0, cfg.width, cfg.height * 0.5); g.endFill();
    g.beginFill(0x74c85a, 1); g.drawRect(0, cfg.height * 0.5, cfg.width, cfg.height * 0.5); g.endFill();
    g.beginFill(0xffffff, 0.5);
    g.drawCircle(cfg.width * 0.16, cfg.height * 0.12, cfg.mode === 'landscape' ? 64 : 54);
    g.drawCircle(cfg.width * 0.23, cfg.height * 0.1, cfg.mode === 'landscape' ? 48 : 38);
    g.drawCircle(cfg.width * 0.78, cfg.height * 0.13, cfg.mode === 'landscape' ? 58 : 44);
    g.drawCircle(cfg.width * 0.86, cfg.height * 0.1, cfg.mode === 'landscape' ? 42 : 36);
    g.endFill();
    rt.layers.bg.addChild(g);
  }

  function drawPanel(rect, options = {}) {
    return state.runtime.createRoundRect({
      x: rect.x, y: rect.y, width: rect.w, height: rect.h, radius: options.radius || 36,
      fill: options.fill || 0xffffff, alpha: options.alpha ?? 0.7,
      strokeColor: options.strokeColor ?? 0xffffff, strokeWidth: options.strokeWidth ?? 6, strokeAlpha: options.strokeAlpha ?? 0.88
    }, state.rootContainers.panel);
  }

  function makeText(text, options, parent) { return state.runtime.createText(text, options, parent); }

  function getPartAbsPosition(part) {
    const cfg = getSceneConfig();
    return { x: cfg.carCenter.x + part.rx * cfg.carScale, y: cfg.carCenter.y + part.ry * cfg.carScale, w: part.w * cfg.carScale, h: part.h * cfg.carScale };
  }

  function drawShapeGraphic(part, sizeScale = 1, options = {}) {
    const rt = state.runtime;
    const PIXI = rt.PIXI;
    const g = new PIXI.Graphics();
    const color = COLOR_HEX[part.color] ?? 0xffffff;
    const w = (options.w || part.w || 110) * sizeScale;
    const h = (options.h || part.h || 110) * sizeScale;
    if (options.shadow !== false) {
      const shadow = new PIXI.Graphics();
      shadow.beginFill(0x000000, 0.13);
      shadow.drawRoundedRect(-w / 2 + 8, -h / 2 + 10, w, h, 20 * sizeScale);
      shadow.endFill();
      g.addChild(shadow);
    }
    const body = new PIXI.Graphics();
    body.lineStyle(Math.max(4, 7 * sizeScale), 0xffffff, 0.72);
    body.beginFill(color, 1);
    if (part.shape === 'wheel') {
      body.drawCircle(0, 0, Math.min(w, h) / 2); body.endFill();
      body.beginFill(0xffffff, 0.85); body.drawCircle(0, 0, Math.min(w, h) * 0.25); body.endFill();
      body.lineStyle(Math.max(3, 4 * sizeScale), 0x222222, 0.25); body.drawCircle(0, 0, Math.min(w, h) * 0.36);
    } else if (part.shape === 'roof') {
      body.drawPolygon([-w / 2, h / 2, 0, -h / 2, w / 2, h / 2]); body.endFill();
    } else if (part.shape === 'ladder') {
      body.drawRoundedRect(-w / 2, -h / 2, w, h, 18 * sizeScale); body.endFill();
      body.lineStyle(Math.max(5, 8 * sizeScale), 0xffffff, 0.86);
      body.moveTo(-w * 0.42, -h * 0.2); body.lineTo(w * 0.42, -h * 0.2);
      body.moveTo(-w * 0.42, h * 0.2); body.lineTo(w * 0.42, h * 0.2);
      for (let i = -3; i <= 3; i += 1) { const x = i * (w / 8); body.moveTo(x, -h * 0.32); body.lineTo(x, h * 0.32); }
    } else if (part.shape === 'cross') {
      body.drawRoundedRect(-w / 2, -h / 2, w, h, 22 * sizeScale); body.endFill();
      body.beginFill(0xffffff, 0.95);
      body.drawRoundedRect(-w * 0.12, -h * 0.34, w * 0.24, h * 0.68, 10 * sizeScale);
      body.drawRoundedRect(-w * 0.34, -h * 0.12, w * 0.68, h * 0.24, 10 * sizeScale);
      body.endFill();
    } else if (part.shape === 'light') {
      body.drawRoundedRect(-w / 2, -h / 2, w, h, 28 * sizeScale); body.endFill();
      body.beginFill(0xffffff, 0.45);
      body.drawRoundedRect(-w * 0.38, -h * 0.28, w * 0.28, h * 0.56, 18 * sizeScale);
      body.drawRoundedRect(w * 0.1, -h * 0.28, w * 0.28, h * 0.56, 18 * sizeScale);
      body.endFill();
    } else if (part.shape === 'window') {
      body.drawRoundedRect(-w / 2, -h / 2, w, h, 24 * sizeScale); body.endFill();
      body.beginFill(0xffffff, 0.38); body.drawRoundedRect(-w * 0.36, -h * 0.32, w * 0.28, h * 0.64, 12 * sizeScale); body.endFill();
    } else if (part.shape === 'door') {
      body.drawRoundedRect(-w / 2, -h / 2, w, h, 22 * sizeScale); body.endFill();
      body.beginFill(0xffffff, 0.7); body.drawCircle(w * 0.28, 0, Math.max(5, 8 * sizeScale)); body.endFill();
    } else if (part.shape === 'badge') {
      const points = []; const outer = Math.min(w, h) * 0.5; const inner = outer * 0.44;
      for (let i = 0; i < 10; i += 1) { const angle = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 === 0 ? outer : inner; points.push(Math.cos(angle) * r, Math.sin(angle) * r); }
      body.drawPolygon(points); body.endFill();
    } else if (part.shape === 'hose') {
      body.drawRoundedRect(-w / 2, -h / 2, w, h, 30 * sizeScale); body.endFill();
      body.lineStyle(Math.max(7, 10 * sizeScale), 0xffffff, 0.82);
      body.drawCircle(-w * 0.12, 0, Math.min(w, h) * 0.25);
      body.moveTo(w * 0.08, 0); body.lineTo(w * 0.38, -h * 0.18);
    } else if (part.shape === 'bag') {
      body.drawRoundedRect(-w / 2, -h / 2, w, h, 18 * sizeScale); body.endFill();
      body.lineStyle(Math.max(4, 6 * sizeScale), 0xffffff, 0.88); body.drawRoundedRect(-w * 0.22, -h * 0.62, w * 0.44, h * 0.28, 12 * sizeScale);
    } else {
      body.drawRoundedRect(-w / 2, -h / 2, w, h, 24 * sizeScale); body.endFill();
    }
    g.addChild(body);
    return g;
  }

  function addNumberBadge(container, number, size = 46) {
    const rt = state.runtime;
    const badge = rt.createCircle({ x: -size * 0.85, y: -size * 0.85, radius: size * 0.42, fill: 0xffffff, alpha: 1, strokeColor: 0xff9f1c, strokeWidth: 5 }, container);
    badge.zIndex = 20;
    const text = makeText(number, { x: -size * 0.85, y: -size * 0.87, fontSize: Math.round(size * 0.55), fill: '#17324a', strokeThickness: 3, dropShadow: false }, container);
    text.zIndex = 21;
  }

  function createPartDisplay(part, options = {}) {
    const rt = state.runtime;
    const c = rt.createContainer(options.parent || state.rootContainers.parts);
    c.sortableChildren = true;
    c.partId = part.id;
    c.partNumber = part.number;
    c.addChild(drawShapeGraphic(part, options.scale || 1, { w: options.w || 112, h: options.h || 112, shadow: options.shadow }));
    if (options.showNumber !== false) addNumberBadge(c, part.number, options.badgeSize || 48);
    if (options.x !== undefined && options.y !== undefined) c.position.set(options.x, options.y);
    c.hitArea = new rt.PIXI.Rectangle(-(options.hitW || 140) / 2, -(options.hitH || 140) / 2, options.hitW || 140, options.hitH || 140);
    return c;
  }

  function createSlot(part) {
    const rt = state.runtime;
    const PIXI = rt.PIXI;
    const cfg = getSceneConfig();
    const pos = getPartAbsPosition(part);
    const c = rt.createContainer(state.rootContainers.slots);
    c.slotId = part.id;
    c.snapRadius = Math.max(74, Math.min(pos.w, pos.h) * 0.75);
    c.point = { x: pos.x, y: pos.y };
    c.position.set(pos.x, pos.y);
    const ghost = new PIXI.Graphics();
    ghost.lineStyle(6, 0xffffff, 0.65);
    ghost.beginFill(0xffffff, 0.18);
    if (part.shape === 'wheel') ghost.drawCircle(0, 0, Math.min(pos.w, pos.h) / 2);
    else ghost.drawRoundedRect(-pos.w / 2, -pos.h / 2, pos.w, pos.h, Math.max(16, 22 * cfg.carScale));
    ghost.endFill();
    c.addChild(ghost);
    const label = makeText(part.number, { x: 0, y: 0, fontSize: Math.round(38 * cfg.carScale), fill: '#ffffff', stroke: '#17324a', strokeThickness: 5, dropShadow: false }, c);
    label.alpha = 0.7;
    state.slotMap.set(part.id, { id: part.id, part, display: c, point: { x: pos.x, y: pos.y }, x: pos.x, y: pos.y, snapRadius: c.snapRadius, filled: state.placedPartIds.has(part.id) });
    return c;
  }

  function buildVehicleShadow() {
    const rt = state.runtime;
    const cfg = getSceneConfig();
    const vehicle = state.currentVehicle;
    rt.createRoundRect({ x: cfg.carCenter.x, y: cfg.carCenter.y + 84 * cfg.carScale, width: 520 * cfg.carScale, height: 210 * cfg.carScale, radius: 42 * cfg.carScale, fill: vehicle.mainColor, alpha: 0.12, strokeColor: 0xffffff, strokeWidth: 5, strokeAlpha: 0.3 }, state.rootContainers.vehicle);
    rt.createRoundRect({ x: cfg.carCenter.x - 66 * cfg.carScale, y: cfg.carCenter.y - 18 * cfg.carScale, width: 250 * cfg.carScale, height: 150 * cfg.carScale, radius: 42 * cfg.carScale, fill: 0xffffff, alpha: 0.08, strokeColor: 0xffffff, strokeWidth: 4, strokeAlpha: 0.24 }, state.rootContainers.vehicle);
  }

  function renderSceneBase() {
    const rt = state.runtime;
    const cfg = getSceneConfig();
    const vehicle = state.currentVehicle;
    clearHint();
    rt.clearAllLayers();
    state.rootContainers = {};
    state.slotMap = new Map();
    state.partMap = new Map();
    state.decorMap = new Map();
    state.trayOrigins = new Map();
    drawSoftBackground();
    makeLayer('panel', rt.layers.world); makeLayer('vehicle', rt.layers.world); makeLayer('slots', rt.layers.objects); makeLayer('placed', rt.layers.objects); makeLayer('parts', rt.layers.objects); makeLayer('decor', rt.layers.objects); makeLayer('labels', rt.layers.ui); makeLayer('buttons', rt.layers.ui);
    drawPanel(cfg.infoPanel, { radius: 34, alpha: 0.72 });
    drawPanel(cfg.stagePanel, { radius: 42, alpha: 0.22, strokeAlpha: 0.72 });
    drawPanel(cfg.trayPanel, { radius: 34, alpha: 0.68 });
    makeText('숫자 탈것 만들기', { x: cfg.title.x, y: cfg.title.y, fontSize: cfg.mode === 'landscape' ? 42 : 48, fill: '#17324a', stroke: '#ffffff', strokeThickness: 7, wordWrapWidth: cfg.infoPanel.w - 36 }, state.rootContainers.labels);
    makeText(state.phase === 'decorate' ? `${vehicle.name}를 예쁘게 꾸며볼까?` : `${vehicle.name}를 만들어보자!`, { x: cfg.guide.x, y: cfg.guide.y, fontSize: cfg.mode === 'landscape' ? 24 : 30, fill: '#0d47a1', strokeThickness: 5, wordWrapWidth: cfg.infoPanel.w - 44 }, state.rootContainers.labels);
    makeText(state.phase === 'decorate' ? `꾸미기 ${state.placedDecorCount}/3` : `${Math.min(state.currentPartIndex + 1, vehicle.parts.length)}/${vehicle.parts.length} 단계`, { x: cfg.progress.x, y: cfg.progress.y, fontSize: cfg.mode === 'landscape' ? 34 : 36, fill: '#ff7a1a', strokeThickness: 6, wordWrapWidth: cfg.infoPanel.w - 44 }, state.rootContainers.labels);
    buildVehicleShadow();
  }

  function renderSlotsAndPlacedParts() {
    const vehicle = state.currentVehicle;
    vehicle.parts.forEach((part) => createSlot(part));
    vehicle.parts.forEach((part) => {
      if (!state.placedPartIds.has(part.id)) return;
      const pos = getPartAbsPosition(part);
      const placed = createPartDisplay(part, { parent: state.rootContainers.placed, x: pos.x, y: pos.y, w: pos.w, h: pos.h, scale: 1, showNumber: false, shadow: true, hitW: pos.w, hitH: pos.h });
      placed.zIndex = 20;
      const slot = state.slotMap.get(part.id);
      if (slot) { slot.filled = true; slot.display.alpha = 0; }
    });
    updateActiveSlotGlow();
  }

  function updateActiveSlotGlow() {
    clearHint();
    if (state.phase !== 'build') return;
    const target = state.currentVehicle.parts[state.currentPartIndex];
    if (!target) return;
    const slot = state.slotMap.get(target.id);
    if (!slot || !slot.display) return;
    slot.display.alpha = 1;
    state.hintCleanup = state.runtime.hintGlow(slot.display);
  }

  function getTrayPosition(index) {
    const cfg = getSceneConfig();
    if (cfg.mode === 'landscape') return { x: cfg.trayStart.x, y: cfg.trayStart.y + index * cfg.trayGap };
    const col = index % cfg.trayColumns;
    const row = Math.floor(index / cfg.trayColumns);
    return { x: cfg.trayStart.x + col * cfg.trayGap, y: cfg.trayStart.y + row * cfg.trayGap };
  }

  function renderBuildTray() {
    const available = state.currentVehicle.parts.filter((part) => !state.placedPartIds.has(part.id));
    available.forEach((part, index) => {
      const pos = getTrayPosition(index);
      const item = createPartDisplay(part, { parent: state.rootContainers.parts, x: pos.x, y: pos.y, w: getSceneConfig().trayItemSize, h: getSceneConfig().trayItemSize, scale: 0.72, badgeSize: 46, hitW: 132, hitH: 132 });
      state.partMap.set(part.id, item);
      state.trayOrigins.set(part.id, { x: pos.x, y: pos.y, rotation: 0 });
      state.runtime.makeDraggable(item, {
        disabled: () => state.locked || state.phase !== 'build' || state.completing,
        onStart: () => { state.isDragging = true; item.alpha = 0.95; item.scale.set(0.86); },
        onEnd: () => { state.isDragging = false; handlePartDrop(item, part); },
        onCancel: () => { state.isDragging = false; returnPartToTray(item, part); }
      });
    });
  }

  async function returnPartToTray(item, part) {
    const origin = state.trayOrigins.get(part.id);
    if (!origin) return;
    await state.runtime.returnTo(item, origin, { duration: 250 });
    item.scale.set(0.72);
    item.zIndex = 0;
  }

  async function handlePartDrop(item, part) {
    if (state.locked || state.phase !== 'build') return;
    const target = state.currentVehicle.parts[state.currentPartIndex];
    const activeSlot = state.slotMap.get(target.id);
    if (!target || !activeSlot) { returnPartToTray(item, part); return; }
    const distance = state.runtime.getDistance(item, activeSlot.point);
    const isNear = distance <= activeSlot.snapRadius;
    const isCorrect = part.id === target.id;
    if (!isNear || !isCorrect) {
      state.locked = true;
      await state.runtime.wrongShake(item);
      speakGuide(`괜찮아, ${target.number}번을 찾아볼까?`);
      await returnPartToTray(item, part);
      state.locked = false;
      return;
    }
    placeCorrectPart(item, part, activeSlot);
  }

  async function placeCorrectPart(item, part, slot) {
    if (state.locked) return;
    state.locked = true;
    clearHint();
    item.eventMode = 'none'; item.cursor = 'default';
    await state.runtime.snapTo(item, { x: slot.x, y: slot.y, rotation: 0 }, { duration: 220, easing: 'backOut' });
    item.scale.set(1); item.zIndex = 30;
    slot.filled = true; slot.display.alpha = 0;
    state.placedPartIds.add(part.id);
    state.runtime.spawnParticles(slot.x, slot.y, { count: 18, colors: [COLOR_HEX[part.color] || 0xffffff, 0xffffff, 0xffd93d], duration: 620 });
    await state.runtime.successPop(item, { amount: 1.12 });
    speakGuide(`${part.number}번 ${part.label}! 딸깍 붙었어!`);
    state.currentPartIndex += 1;
    if (state.currentPartIndex >= state.currentVehicle.parts.length) { state.locked = false; enterDecoratePhase(); return; }
    state.locked = false;
    renderAll({ preserve: true });
  }

  function renderDecorTray() {
    const cfg = getSceneConfig();
    state.currentVehicle.decor.slice(0, 3).forEach((decor, index) => {
      const pos = getTrayPosition(index);
      const c = state.runtime.createContainer(state.rootContainers.decor);
      c.decorId = decor.id; c.position.set(pos.x, pos.y);
      c.hitArea = new state.runtime.PIXI.Rectangle(-62, -62, 124, 124);
      state.runtime.createCircle({ x: 0, y: 0, radius: cfg.mode === 'landscape' ? 52 : 58, fill: 0xffffff, alpha: 0.96, strokeColor: 0xff9f1c, strokeWidth: 6 }, c);
      makeText(decor.icon, { x: 0, y: -2, fontSize: cfg.mode === 'landscape' ? 54 : 62, strokeThickness: 0, dropShadow: false }, c);
      state.decorMap.set(decor.id, c);
      state.trayOrigins.set(decor.id, { x: pos.x, y: pos.y, rotation: 0 });
      state.runtime.makeDraggable(c, {
        disabled: () => state.locked || state.phase !== 'decorate' || state.completing,
        onStart: () => { state.isDragging = true; c.scale.set(1.15); },
        onEnd: () => { state.isDragging = false; handleDecorDrop(c, decor); },
        onCancel: () => { state.isDragging = false; returnDecorToTray(c, decor); }
      });
    });
    createStartButton();
  }

  async function returnDecorToTray(item, decor) {
    const origin = state.trayOrigins.get(decor.id);
    if (!origin) return;
    await state.runtime.returnTo(item, origin, { duration: 250 });
    item.scale.set(1); item.zIndex = 0;
  }

  async function handleDecorDrop(item, decor) {
    if (state.locked || state.phase !== 'decorate') return;
    const cfg = getSceneConfig();
    const center = cfg.carCenter;
    const maxX = cfg.mode === 'landscape' ? 360 : 300;
    const maxY = cfg.mode === 'landscape' ? 210 : 190;
    const insideCar = Math.abs(item.x - center.x) <= maxX && Math.abs(item.y - center.y) <= maxY;
    if (!insideCar) { state.locked = true; await state.runtime.wrongShake(item); await returnDecorToTray(item, decor); state.locked = false; return; }
    item.eventMode = 'none'; item.cursor = 'default'; item.zIndex = 80; item.scale.set(0.82);
    state.placedDecorCount = Math.min(3, state.placedDecorCount + 1);
    state.runtime.spawnParticles(item.x, item.y, { count: 14, colors: [0xffd93d, 0xff7ac8, 0xffffff], duration: 520 });
    await state.runtime.successPop(item, { amount: 1.18 });
    speakGuide(`${decor.label} 붙였어!`);
    renderInfoOnly();
  }

  function createStartButton() {
    const cfg = getSceneConfig();
    const rt = state.runtime;
    const button = rt.createContainer(state.rootContainers.buttons);
    button.position.set(cfg.actionButton.x, cfg.actionButton.y);
    rt.createRoundRect({ x: 0, y: 0, width: cfg.actionButton.w, height: cfg.actionButton.h, radius: cfg.actionButton.h / 2, fill: 0x4caf50, alpha: 1, strokeColor: 0xffffff, strokeWidth: 7 }, button);
    makeText('출동하기 🚀', { x: 0, y: -2, fontSize: cfg.mode === 'landscape' ? 30 : 38, fill: '#ffffff', stroke: '#1b5e20', strokeThickness: 5, dropShadow: true, wordWrapWidth: cfg.actionButton.w - 20 }, button);
    rt.setInteractiveTap(button, () => { if (!state.locked && state.phase === 'decorate' && !state.completing) completeVehicle(); });
  }

  function renderInfoOnly() {
    const labels = state.rootContainers.labels;
    if (!labels) return;
    while (labels.children.length) {
      const child = labels.children[0];
      labels.removeChild(child);
      child.destroy?.({ children: true, texture: false, baseTexture: false });
    }
    const cfg = getSceneConfig();
    const vehicle = state.currentVehicle;
    makeText('숫자 탈것 만들기', { x: cfg.title.x, y: cfg.title.y, fontSize: cfg.mode === 'landscape' ? 42 : 48, fill: '#17324a', stroke: '#ffffff', strokeThickness: 7, wordWrapWidth: cfg.infoPanel.w - 36 }, labels);
    makeText(`${vehicle.name}를 예쁘게 꾸며볼까?`, { x: cfg.guide.x, y: cfg.guide.y, fontSize: cfg.mode === 'landscape' ? 24 : 30, fill: '#0d47a1', strokeThickness: 5, wordWrapWidth: cfg.infoPanel.w - 44 }, labels);
    makeText(`꾸미기 ${state.placedDecorCount}/3`, { x: cfg.progress.x, y: cfg.progress.y, fontSize: cfg.mode === 'landscape' ? 34 : 36, fill: '#ff7a1a', strokeThickness: 6, wordWrapWidth: cfg.infoPanel.w - 44 }, labels);
  }

  function enterDecoratePhase() {
    if (state.phase !== 'build') return;
    state.phase = 'decorate'; state.locked = false; state.placedDecorCount = 0;
    if (!state.successRewardGiven) { state.successRewardGiven = true; gainExpOnce(10); }
    const cfg = getSceneConfig();
    state.runtime.spawnParticles(cfg.carCenter.x, cfg.carCenter.y, { count: 45, colors: state.currentVehicle.finaleParticles, duration: 900 });
    fireConfetti();
    speakGuide(`우와! ${state.currentVehicle.name} 조립 완료! 이제 꾸며보자!`);
    state.runtime.setTimeout(() => renderAll({ preserve: true }), 700);
  }

  async function completeVehicle() {
    if (state.completing) return;
    state.completing = true; state.locked = true; state.phase = 'complete'; clearHint();
    const cfg = getSceneConfig();
    const carObjects = [...state.rootContainers.placed.children, ...state.rootContainers.decor.children];
    const group = state.runtime.createContainer(state.rootContainers.vehicle);
    group.zIndex = 200;
    carObjects.forEach((obj) => { const globalX = obj.x; const globalY = obj.y; if (obj.parent) obj.parent.removeChild(obj); obj.x = globalX - cfg.carCenter.x; obj.y = globalY - cfg.carCenter.y; group.addChild(obj); });
    group.position.set(cfg.carCenter.x, cfg.carCenter.y);
    state.runtime.spawnParticles(cfg.carCenter.x, cfg.carCenter.y, { count: 70, colors: state.currentVehicle.finaleParticles, duration: 1100 });
    fireConfetti();
    if (!state.completeRewardGiven) { state.completeRewardGiven = true; gainExpOnce(25); }
    speakGuide(`우와! ${state.currentVehicle.completeVoice}`);
    makeText('우와! 완성!', { x: cfg.width / 2, y: cfg.mode === 'landscape' ? 98 : 318, fontSize: cfg.mode === 'landscape' ? 58 : 66, fill: '#ff5b5b', stroke: '#ffffff', strokeThickness: 9, wordWrapWidth: 720 }, state.rootContainers.labels);
    await state.runtime.successPop(group, { amount: 1.12, upDuration: 220, downDuration: 260 });
    state.runtime.setTimeout(() => { state.runtime.tween(group, { x: cfg.width + 520, y: cfg.carCenter.y - 30, rotation: 0.08 }, 1400, 'easeInOutCubic'); }, 500);
    state.runtime.setTimeout(() => nextVehicle(), 2500);
  }

  function nextVehicle() {
    state.vehicleIndex = (state.vehicleIndex + 1) % VEHICLES.length;
    state.currentVehicle = VEHICLES[state.vehicleIndex];
    resetRoundFlags();
    renderAll({ preserve: false });
    speakGuide(`${state.currentVehicle.name}를 만들어보자!`);
  }

  function renderAll() {
    renderSceneBase();
    renderSlotsAndPlacedParts();
    if (state.phase === 'build') renderBuildTray();
    else if (state.phase === 'decorate') renderDecorTray();
  }

  async function render(container, options = {}) {
    destroy();
    const runtimeApi = getRuntime();
    if (!runtimeApi || typeof runtimeApi.createGame !== 'function') {
      container.innerHTML = '<div style="width:100%;height:100%;display:grid;place-items:center;text-align:center;font-family:Jua,sans-serif;font-size:24px;color:#17324a;background:#bde9ff;padding:24px;">Pixi Runtime을 불러오지 못했어요.<br>js/engine/pixi-runtime.js를 먼저 연결해 주세요.</div>';
      return;
    }
    state.container = container; state.options = options || {}; state.vehicleIndex = Math.floor(Math.random() * VEHICLES.length); state.currentVehicle = VEHICLES[state.vehicleIndex];
    resetRoundFlags();
    state.runtime = await runtimeApi.createGame(container, { backgroundAlpha: 0, onResize: () => { if (!state.runtime || state.isDragging || state.completing) return; renderAll({ preserve: true }); } });
    renderAll({ preserve: false });
    playVoice('games.numberVehicles.intro');
    speakGuide(`${state.currentVehicle.name}를 만들어보자!`);
  }

  function destroy() {
    clearHint();
    if (state.runtime) state.runtime.destroy();
    if (state.container) state.container.innerHTML = '';
    state.container = null; state.options = {}; state.runtime = null; state.currentVehicle = null; state.phase = 'build';
    state.currentPartIndex = 0; state.placedPartIds = new Set(); state.placedDecorCount = 0;
    state.locked = false; state.isDragging = false; state.completing = false; state.rootContainers = {};
    state.slotMap = new Map(); state.partMap = new Map(); state.decorMap = new Map(); state.trayOrigins = new Map();
    state.successRewardGiven = false; state.completeRewardGiven = false;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
