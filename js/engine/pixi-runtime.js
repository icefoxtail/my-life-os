/**
 * 시현이 놀이터 OS — Pixi Runtime Engine v1
 * 파일: js/engine/pixi-runtime.js
 */
(function () {
  'use strict';

  const RUNTIME_KEY = 'SihyeonPixiRuntime';
  const PIXI_CDN_URL = 'https://pixijs.download/release/pixi.min.js';

  const DEFAULT_VIEWPORTS = {
    portrait: { width: 900, height: 1600 },
    landscape: { width: 1600, height: 900 }
  };

  const DEFAULT_OPTIONS = {
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    resizeDebounce: 120,
    safePadding: 0
  };

  let pixiLoadPromise = null;

  function isLandscapeMode() {
    try {
      return window.matchMedia('(orientation: landscape) and (min-width: 768px) and (min-height: 520px)').matches;
    } catch (error) {
      return window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
    }
  }

  function getMode() {
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function loadPixi() {
    if (window.PIXI) return Promise.resolve(window.PIXI);
    if (pixiLoadPromise) return pixiLoadPromise;

    pixiLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-sihyeon-pixi-loader="1"]');

      if (existing) {
        existing.addEventListener('load', () => resolve(window.PIXI));
        existing.addEventListener('error', () => reject(new Error('PIXI 로드 실패')));
        return;
      }

      const script = document.createElement('script');
      script.src = PIXI_CDN_URL;
      script.async = true;
      script.dataset.sihyeonPixiLoader = '1';

      script.onload = () => {
        if (window.PIXI) resolve(window.PIXI);
        else reject(new Error('PIXI 전역 객체가 없습니다.'));
      };

      script.onerror = () => reject(new Error('PIXI CDN 로드 실패'));

      document.head.appendChild(script);
    });

    return pixiLoadPromise;
  }

  function makeTextStyle(PIXI, options = {}) {
    return new PIXI.TextStyle({
      fontFamily: options.fontFamily || 'Jua, Pretendard, sans-serif',
      fontSize: options.fontSize || 42,
      fontWeight: options.fontWeight || '900',
      fill: options.fill || '#17324a',
      align: options.align || 'center',
      stroke: options.stroke || '#ffffff',
      strokeThickness: options.strokeThickness ?? 6,
      dropShadow: options.dropShadow ?? true,
      dropShadowColor: options.dropShadowColor || 'rgba(0,0,0,0.25)',
      dropShadowBlur: options.dropShadowBlur ?? 4,
      dropShadowDistance: options.dropShadowDistance ?? 3,
      wordWrap: options.wordWrap ?? true,
      wordWrapWidth: options.wordWrapWidth || 720,
      lineJoin: 'round'
    });
  }

  function destroyDisplayObject(displayObject) {
    if (!displayObject) return;
    try {
      if (displayObject.parent) displayObject.parent.removeChild(displayObject);
      if (typeof displayObject.destroy === 'function') {
        displayObject.destroy({ children: true, texture: false, baseTexture: false });
      }
    } catch (error) {}
  }

  class SihyeonPixiGame {
    constructor(container, options = {}) {
      this.container = container;
      this.options = Object.assign({}, DEFAULT_OPTIONS, options || {});
      this.viewports = Object.assign({}, DEFAULT_VIEWPORTS, this.options.viewports || {});
      this.mode = getMode();
      this.base = this.viewports[this.mode];
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.width = this.base.width;
      this.height = this.base.height;
      this.PIXI = window.PIXI;
      this.app = null;
      this.stage = null;
      this.layers = { bg: null, world: null, objects: null, ui: null, fx: null, overlay: null };
      this.resizeTimer = null;
      this.resizeHandler = null;
      this.destroyed = false;
      this.timers = [];
      this.tickers = new Set();
      this.interactiveObjects = new Set();
    }

    async init() {
      this.PIXI = await loadPixi();
      if (this.destroyed) return this;
      this.container.innerHTML = '';
      this.app = new this.PIXI.Application();

      if (typeof this.app.init === 'function') {
        await this.app.init({
          width: this.container.clientWidth || window.innerWidth,
          height: this.container.clientHeight || window.innerHeight,
          backgroundAlpha: this.options.backgroundAlpha,
          antialias: this.options.antialias,
          autoDensity: this.options.autoDensity,
          resolution: this.options.resolution
        });
      } else {
        this.app = new this.PIXI.Application({
          width: this.container.clientWidth || window.innerWidth,
          height: this.container.clientHeight || window.innerHeight,
          transparent: true,
          backgroundAlpha: this.options.backgroundAlpha,
          antialias: this.options.antialias,
          autoDensity: this.options.autoDensity,
          resolution: this.options.resolution
        });
      }

      const view = this.app.canvas || this.app.view;
      view.style.width = '100%';
      view.style.height = '100%';
      view.style.display = 'block';
      view.style.touchAction = 'none';
      this.container.appendChild(view);

      this.stage = new this.PIXI.Container();
      this.app.stage.addChild(this.stage);
      this.layers.bg = new this.PIXI.Container();
      this.layers.world = new this.PIXI.Container();
      this.layers.objects = new this.PIXI.Container();
      this.layers.ui = new this.PIXI.Container();
      this.layers.fx = new this.PIXI.Container();
      this.layers.overlay = new this.PIXI.Container();
      this.stage.addChild(this.layers.bg, this.layers.world, this.layers.objects, this.layers.ui, this.layers.fx, this.layers.overlay);

      this.resizeHandler = () => this.scheduleResize();
      window.addEventListener('resize', this.resizeHandler, { passive: true });
      window.addEventListener('orientationchange', this.resizeHandler, { passive: true });
      this.resizeNow();
      return this;
    }

    scheduleResize() {
      if (this.destroyed) return;
      if (this.resizeTimer) window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        this.resizeTimer = null;
        this.resizeNow();
        if (typeof this.options.onResize === 'function') this.options.onResize(this.getMetrics());
      }, this.options.resizeDebounce);
    }

    resizeNow() {
      if (this.destroyed || !this.app || !this.container) return;
      const nextMode = getMode();
      this.mode = nextMode;
      this.base = this.viewports[nextMode] || DEFAULT_VIEWPORTS[nextMode];
      const rect = this.container.getBoundingClientRect();
      const cw = Math.max(1, Math.floor(rect.width || window.innerWidth || this.base.width));
      const ch = Math.max(1, Math.floor(rect.height || window.innerHeight || this.base.height));
      if (this.app.renderer && typeof this.app.renderer.resize === 'function') this.app.renderer.resize(cw, ch);
      const scale = Math.min(cw / this.base.width, ch / this.base.height);
      this.scale = scale;
      this.offsetX = (cw - this.base.width * scale) / 2;
      this.offsetY = (ch - this.base.height * scale) / 2;
      this.width = this.base.width;
      this.height = this.base.height;
      this.stage.scale.set(scale);
      this.stage.position.set(this.offsetX, this.offsetY);
    }

    getMetrics() {
      return { mode: this.mode, width: this.width, height: this.height, scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY, viewport: this.base };
    }

    createContainer(parent = this.layers.objects) {
      const c = new this.PIXI.Container();
      parent.addChild(c);
      return c;
    }

    createRoundRect(options = {}, parent = this.layers.objects) {
      const { x = 0, y = 0, width = 100, height = 100, radius = 24, fill = 0xffffff, alpha = 1, strokeColor = null, strokeWidth = 0, strokeAlpha = 1 } = options;
      const g = new this.PIXI.Graphics();
      if (strokeColor !== null && strokeWidth > 0) g.lineStyle(strokeWidth, strokeColor, strokeAlpha);
      g.beginFill(fill, alpha);
      g.drawRoundedRect(-width / 2, -height / 2, width, height, radius);
      g.endFill();
      g.position.set(x, y);
      parent.addChild(g);
      return g;
    }

    createCircle(options = {}, parent = this.layers.objects) {
      const { x = 0, y = 0, radius = 50, fill = 0xffffff, alpha = 1, strokeColor = null, strokeWidth = 0, strokeAlpha = 1 } = options;
      const g = new this.PIXI.Graphics();
      if (strokeColor !== null && strokeWidth > 0) g.lineStyle(strokeWidth, strokeColor, strokeAlpha);
      g.beginFill(fill, alpha);
      g.drawCircle(0, 0, radius);
      g.endFill();
      g.position.set(x, y);
      parent.addChild(g);
      return g;
    }

    createText(text, options = {}, parent = this.layers.ui) {
      const obj = new this.PIXI.Text(String(text ?? ''), makeTextStyle(this.PIXI, options));
      obj.anchor.set(options.anchorX ?? 0.5, options.anchorY ?? 0.5);
      obj.position.set(options.x || 0, options.y || 0);
      parent.addChild(obj);
      return obj;
    }

    makeDraggable(displayObject, options = {}) {
      if (!displayObject) return displayObject;
      displayObject.eventMode = 'static';
      displayObject.cursor = options.cursor || 'grab';
      const startData = { dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 };
      const down = (event) => {
        if (this.destroyed || (options.disabled && options.disabled())) return;
        const p = event.global;
        startData.dragging = true;
        startData.startX = p.x;
        startData.startY = p.y;
        startData.originX = displayObject.x;
        startData.originY = displayObject.y;
        displayObject.cursor = 'grabbing';
        displayObject.zIndex = options.dragZIndex ?? 9999;
        options.onStart?.({ event, object: displayObject, state: startData });
      };
      const move = (event) => {
        if (!startData.dragging || this.destroyed) return;
        const p = event.global;
        const dx = (p.x - startData.startX) / this.scale;
        const dy = (p.y - startData.startY) / this.scale;
        displayObject.x = startData.originX + dx;
        displayObject.y = startData.originY + dy;
        options.onMove?.({ event, object: displayObject, state: startData, dx, dy });
      };
      const up = (event) => {
        if (!startData.dragging || this.destroyed) return;
        startData.dragging = false;
        displayObject.cursor = options.cursor || 'grab';
        options.onEnd?.({ event, object: displayObject, state: startData });
      };
      const cancel = (event) => {
        if (!startData.dragging || this.destroyed) return;
        startData.dragging = false;
        displayObject.cursor = options.cursor || 'grab';
        options.onCancel?.({ event, object: displayObject, state: startData });
      };
      displayObject.on('pointerdown', down);
      displayObject.on('pointermove', move);
      displayObject.on('pointerup', up);
      displayObject.on('pointerupoutside', up);
      displayObject.on('pointercancel', cancel);
      displayObject.__sihyeonDragCleanup = () => {
        displayObject.off('pointerdown', down);
        displayObject.off('pointermove', move);
        displayObject.off('pointerup', up);
        displayObject.off('pointerupoutside', up);
        displayObject.off('pointercancel', cancel);
      };
      this.interactiveObjects.add(displayObject);
      return displayObject;
    }

    setInteractiveTap(displayObject, handler) {
      if (!displayObject || typeof handler !== 'function') return displayObject;
      displayObject.eventMode = 'static';
      displayObject.cursor = 'pointer';
      const tap = (event) => { if (!this.destroyed) handler(event, displayObject); };
      displayObject.on('pointertap', tap);
      displayObject.__sihyeonTapCleanup = () => displayObject.off('pointertap', tap);
      this.interactiveObjects.add(displayObject);
      return displayObject;
    }

    getDistance(a, b) {
      if (!a || !b) return Infinity;
      const dx = (a.x || 0) - (b.x || 0);
      const dy = (a.y || 0) - (b.y || 0);
      return Math.sqrt(dx * dx + dy * dy);
    }

    tween(displayObject, to, duration = 300, easing = 'easeOutCubic') {
      if (!displayObject) return Promise.resolve();
      const from = {};
      const keys = Object.keys(to || {});
      keys.forEach((key) => { from[key] = displayObject[key]; });
      const ease = this.getEase(easing);
      const start = performance.now();
      return new Promise((resolve) => {
        const tick = () => {
          if (this.destroyed || !displayObject) { resolve(); return; }
          const t = clamp((performance.now() - start) / duration, 0, 1);
          const k = ease(t);
          keys.forEach((key) => { displayObject[key] = from[key] + (to[key] - from[key]) * k; });
          if (t >= 1) { this.removeTicker(tick); resolve(); }
        };
        this.addTicker(tick);
      });
    }

    getEase(name) {
      const eases = {
        linear: (t) => t,
        easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
        easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        backOut: (t) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
      };
      return eases[name] || eases.easeOutCubic;
    }

    addTicker(fn) {
      if (!this.app || !this.app.ticker || typeof fn !== 'function') return;
      this.app.ticker.add(fn);
      this.tickers.add(fn);
    }

    removeTicker(fn) {
      if (!this.app || !this.app.ticker || typeof fn !== 'function') return;
      this.app.ticker.remove(fn);
      this.tickers.delete(fn);
    }

    setTimeout(fn, delay) {
      const id = window.setTimeout(() => {
        this.timers = this.timers.filter((timerId) => timerId !== id);
        if (!this.destroyed && typeof fn === 'function') fn();
      }, delay);
      this.timers.push(id);
      return id;
    }

    clearTimers() {
      this.timers.forEach((id) => window.clearTimeout(id));
      this.timers = [];
      if (this.resizeTimer) {
        window.clearTimeout(this.resizeTimer);
        this.resizeTimer = null;
      }
    }

    async snapTo(displayObject, target, options = {}) {
      if (!displayObject || !target) return;
      await this.tween(displayObject, { x: target.x, y: target.y, rotation: target.rotation ?? displayObject.rotation, alpha: target.alpha ?? displayObject.alpha }, options.duration ?? 220, options.easing || 'backOut');
      if (options.scale !== undefined) displayObject.scale.set(options.scale);
    }

    async returnTo(displayObject, origin, options = {}) {
      if (!displayObject || !origin) return;
      await this.tween(displayObject, { x: origin.x, y: origin.y, rotation: origin.rotation ?? 0 }, options.duration ?? 260, options.easing || 'backOut');
    }

    async wrongShake(displayObject, options = {}) {
      if (!displayObject) return;
      const originX = displayObject.x;
      const distance = options.distance ?? 18;
      const duration = options.duration ?? 55;
      await this.tween(displayObject, { x: originX - distance }, duration, 'linear');
      await this.tween(displayObject, { x: originX + distance }, duration, 'linear');
      await this.tween(displayObject, { x: originX - distance * 0.55 }, duration, 'linear');
      await this.tween(displayObject, { x: originX }, duration, 'linear');
    }

    async successPop(displayObject, options = {}) {
      if (!displayObject) return;
      const sx = displayObject.scale.x;
      const sy = displayObject.scale.y;
      const amount = options.amount ?? 1.18;
      await this.tween(displayObject.scale, { x: sx * amount, y: sy * amount }, options.upDuration ?? 130, 'easeOutCubic');
      await this.tween(displayObject.scale, { x: sx, y: sy }, options.downDuration ?? 170, 'backOut');
    }

    hintGlow(displayObject, options = {}) {
      if (!displayObject || !displayObject.scale || displayObject.destroyed) return () => {};
      const baseScaleX = displayObject.scale?.x ?? 1;
      const baseScaleY = displayObject.scale?.y ?? 1;
      let elapsed = 0;
      let active = true;
      displayObject.alpha = 1;

      const tick = (ticker) => {
        if (!active || this.destroyed || !displayObject || !displayObject.scale || displayObject.destroyed) {
          this.removeTicker(tick);
          return;
        }
        elapsed += ticker?.deltaMS || 16;
        const wave = Math.sin(elapsed / 180) * 0.04 + 1.04;
        try {
          displayObject.scale.set(baseScaleX * wave, baseScaleY * wave);
        } catch (error) {
          this.removeTicker(tick);
        }
      };

      this.addTicker(tick);

      return () => {
        active = false;
        this.removeTicker(tick);
        try {
          if (displayObject && displayObject.scale && !displayObject.destroyed) {
            displayObject.scale.set(baseScaleX, baseScaleY);
            displayObject.alpha = 1;
          }
        } catch (error) {}
      };
    }

    spawnParticles(x, y, options = {}) {
      const count = options.count ?? 28;
      const colors = options.colors || [0xff5b5b, 0xffd93d, 0x45c2ff, 0x82ff4d, 0xb366ff];
      const duration = options.duration ?? 700;
      const parent = options.parent || this.layers.fx;
      for (let i = 0; i < count; i += 1) {
        const color = colors[i % colors.length];
        const p = new this.PIXI.Graphics();
        const size = Math.random() * 10 + 8;
        p.beginFill(color, 1);
        p.drawRoundedRect(-size / 2, -size / 2, size, size, 3);
        p.endFill();
        p.position.set(x, y);
        p.rotation = Math.random() * Math.PI;
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 180;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        parent.addChild(p);
        const start = performance.now();
        const tick = () => {
          if (this.destroyed) { destroyDisplayObject(p); this.removeTicker(tick); return; }
          const t = clamp((performance.now() - start) / duration, 0, 1);
          const dt = (this.app?.ticker?.deltaMS || 16) / 1000;
          p.x += vx * dt;
          p.y += vy * dt + 180 * t * dt;
          p.alpha = 1 - t;
          p.rotation += 0.12;
          if (t >= 1) { destroyDisplayObject(p); this.removeTicker(tick); }
        };
        this.addTicker(tick);
      }
    }

    clearLayer(layerName) {
      const layer = this.layers[layerName];
      if (!layer) return;
      while (layer.children.length) destroyDisplayObject(layer.children[0]);
    }

    clearAllLayers() {
      Object.keys(this.layers).forEach((name) => this.clearLayer(name));
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.clearTimers();
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
        window.removeEventListener('orientationchange', this.resizeHandler);
        this.resizeHandler = null;
      }
      this.interactiveObjects.forEach((obj) => {
        try {
          obj.__sihyeonDragCleanup?.();
          obj.__sihyeonTapCleanup?.();
        } catch (error) {}
      });
      this.interactiveObjects.clear();
      this.tickers.forEach((fn) => {
        try { this.app?.ticker?.remove(fn); } catch (error) {}
      });
      this.tickers.clear();
      try { this.app?.destroy(true, { children: true, texture: false, baseTexture: false }); } catch (error) {}
      if (this.container) this.container.innerHTML = '';
      this.app = null;
      this.stage = null;
      this.container = null;
      this.layers = { bg: null, world: null, objects: null, ui: null, fx: null, overlay: null };
    }
  }

  async function createGame(container, options = {}) {
    const game = new SihyeonPixiGame(container, options);
    await game.init();
    return game;
  }

  window[RUNTIME_KEY] = {
    version: '1.0.1',
    loadPixi,
    createGame,
    SihyeonPixiGame,
    isLandscapeMode,
    getMode,
    DEFAULT_VIEWPORTS
  };
})();
