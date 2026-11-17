/**
 * 시현이 놀이터 OS — 🏗️ 공사장 (Construction Site)
 * 파일: js/games/construction-site.js
 * 세 작업으로 길·앞마당·낮은 다리를 만들고, 완성한 장소에서 다시 놀아요.
 * 기존 공사차 연습의 일곱 역할과 복수 정답은 같은 규칙을 사용합니다.
 */
(function () {
  const GAME_KEY = 'constructionSite';
  const STYLE_ID = 'sihyeon-construction-site-style';
  const MANIFEST_URL = './assets/vehicles/construction_manifest.json';
  
  // ★ 시현이 집중력 맞춤: 6라운드 -> 딱 3번만!
  const TOTAL_ROUNDS = 3; 

  const FALLBACK_VEHICLES = [
    { id: 'excavator', category: 'construction', file: 'assets/vehicles/construction/excavator.png', name_ko: '포크레인', sound_ko: '쿠궁쿠궁 흙을 퍼요!' },
    { id: 'mini_excavator', category: 'construction', file: 'assets/vehicles/construction/mini_excavator.png', name_ko: '미니 굴착기', sound_ko: '작지만 힘차게 파요!' },
    { id: 'bulldozer', category: 'construction', file: 'assets/vehicles/construction/bulldozer.png', name_ko: '불도저', sound_ko: '쓱쓱 밀고 지나가요!' },
    { id: 'wheel_loader', category: 'construction', file: 'assets/vehicles/construction/wheel_loader.png', name_ko: '휠로더', sound_ko: '커다란 삽으로 담아요!' },
    { id: 'dump_truck', category: 'construction', file: 'assets/vehicles/construction/dump_truck.png', name_ko: '덤프트럭', sound_ko: '우르르 짐을 내려요!' },
    { id: 'concrete_mixer', category: 'construction', file: 'assets/vehicles/construction/concrete_mixer.png', name_ko: '레미콘', sound_ko: '빙글빙글 섞어요!' },
    { id: 'concrete_pump_truck', category: 'construction', file: 'assets/vehicles/construction/concrete_pump_truck.png', name_ko: '콘크리트 펌프카', sound_ko: '쭉쭉 뻗어서 보내요!' },
    { id: 'crane_truck', category: 'construction', file: 'assets/vehicles/construction/crane_truck.png', name_ko: '크레인차', sound_ko: '번쩍 들어 올려요!' },
    { id: 'forklift', category: 'construction', file: 'assets/vehicles/construction/forklift.png', name_ko: '지게차', sound_ko: '삐리리 짐을 들어요!' }
  ];

  const MISSIONS = [
    { id: 'dig', title: '땅을 파야 해요!', question: '땅을 파야 해. 어떤 차가 좋을까?', answerIds: ['excavator', 'mini_excavator', 'backhoe_loader'], targetIcon: '🟫', resultIcon: '🕳️', workLabel: '흙 파기', successText: '쿠궁쿠궁! 땅을 팠어!', wrongText: '괜찮아. 이 차는 다른 일을 잘해. 땅 파는 차를 같이 찾아볼까?', stageClass: 'cs-stage-dig' },
    { id: 'push', title: '흙더미를 밀어야 해요!', question: '흙더미를 밀어야 해. 어떤 차가 좋을까?', answerIds: ['bulldozer', 'grader', 'wheel_loader', 'backhoe_loader', 'skid_steer_loader'], targetIcon: '🧱', resultIcon: '🟩', workLabel: '밀기', successText: '쓱쓱! 흙더미를 밀었어!', wrongText: '괜찮아. 이 차는 다른 일을 잘해. 다른 차를 같이 볼까?', stageClass: 'cs-stage-push' },
    { id: 'load', title: '흙을 담아야 해요!', question: '흙을 담아야 해. 어떤 차가 좋을까?', answerIds: ['wheel_loader', 'backhoe_loader', 'skid_steer_loader', 'excavator', 'mini_excavator'], targetIcon: '🟤', resultIcon: '🪣', workLabel: '담기', successText: '삽으로 흙을 담았어!', wrongText: '괜찮아. 삽이 있는 차를 같이 찾아볼까?', stageClass: 'cs-stage-load' },
    { id: 'carry', title: '짐을 멀리 옮겨야 해요!', question: '흙과 돌을 옮겨야 해. 어떤 차가 좋을까?', answerIds: ['dump_truck', 'articulated_dump_truck', 'dump_loader', 'cargo_truck'], targetIcon: '📦', resultIcon: '🏁', workLabel: '', successText: '우르르! 짐을 싣고 옮겼어!', wrongText: '괜찮아. 짐 옮기는 차를 같이 찾아볼까?', stageClass: 'cs-stage-carry' },
    { id: 'mix', title: '콘크리트를 만들어야 해요!', question: '콘크리트를 만들어야 해. 어떤 차가 좋을까?', answerIds: ['concrete_mixer'], targetIcon: '🌀', resultIcon: '⬛', workLabel: '섞기', successText: '빙글빙글! 콘크리트가 완성됐어!', wrongText: '괜찮아. 빙글빙글 도는 차를 같이 찾아볼까?', stageClass: 'cs-stage-mix' },
    { id: 'lift', title: '무거운 짐을 들어야 해요!', question: '무거운 짐을 들어야 해. 어떤 차가 좋을까?', answerIds: ['crane_truck', 'forklift', 'tower_crane', 'mobile_crane'], targetIcon: '📦', resultIcon: '✨', workLabel: '들기', successText: '번쩍! 무거운 짐을 들어 올렸어!', wrongText: '괜찮아. 들기 대장을 같이 찾아볼까?', stageClass: 'cs-stage-lift' },
    { id: 'pump', title: '콘크리트를 높은 곳으로!', question: '긴 관으로 콘크리트를 높은 곳에 보내요. 어떤 차가 필요할까?', answerIds: ['concrete_pump_truck'], targetIcon: '🏢', resultIcon: '🌟', workLabel: '콘크리트 보내기', successText: '쭉쭉! 긴 관으로 콘크리트를 보냈어!', wrongText: '괜찮아. 콘크리트를 보낼 긴 관이 있는 차를 찾아볼까?', stageClass: 'cs-stage-pump' }
  ];

  // A vehicle outside answerIds is not automatically wrong: loaders can dig,
  // lift and carry, and a drill can make a hole too. Only reviewed, clearly
  // different roles may be distractors for the current broad spoken question.
  // Unlisted/new vehicles remain out of the question until their role is reviewed.
  const SAFE_DISTRACTOR_IDS = {
    dig: ['concrete_mixer', 'concrete_pump_truck', 'road_roller', 'water_truck', 'fuel_truck', 'sweeper_truck', 'forklift', 'crane_truck', 'tower_crane', 'mobile_crane', 'scissor_lift'],
    push: ['concrete_mixer', 'concrete_pump_truck', 'water_truck', 'fuel_truck', 'forklift', 'crane_truck', 'tower_crane', 'mobile_crane', 'scissor_lift'],
    load: ['concrete_mixer', 'concrete_pump_truck', 'road_roller', 'water_truck', 'fuel_truck', 'pile_driver', 'drilling_rig', 'excavator_breaker'],
    carry: ['concrete_mixer', 'concrete_pump_truck', 'road_roller', 'water_truck', 'fuel_truck', 'pile_driver', 'drilling_rig', 'excavator_breaker'],
    mix: ['excavator', 'mini_excavator', 'bulldozer', 'wheel_loader', 'dump_truck', 'concrete_pump_truck', 'crane_truck', 'forklift', 'backhoe_loader', 'skid_steer_loader', 'road_roller', 'tower_crane', 'mobile_crane', 'pile_driver', 'drilling_rig', 'excavator_breaker', 'dump_loader', 'articulated_dump_truck', 'water_truck', 'sweeper_truck', 'fuel_truck', 'lowbed_trailer', 'cargo_truck', 'scissor_lift'],
    lift: ['concrete_mixer', 'concrete_pump_truck', 'road_roller', 'asphalt_paver', 'water_truck', 'fuel_truck', 'sweeper_truck'],
    pump: ['excavator', 'mini_excavator', 'bulldozer', 'wheel_loader', 'dump_truck', 'concrete_mixer', 'crane_truck', 'forklift', 'backhoe_loader', 'skid_steer_loader', 'road_roller', 'asphalt_paver', 'grader', 'tower_crane', 'mobile_crane', 'pile_driver', 'drilling_rig', 'excavator_breaker', 'dump_loader', 'articulated_dump_truck', 'water_truck', 'sweeper_truck', 'fuel_truck', 'lowbed_trailer', 'cargo_truck', 'scissor_lift']
  };

  // These are small, visible pieces of a place that already exists. Three
  // machine actions do not magically construct an entire building or bridge.
  const PROJECTS = [
    { id: 'playground', title: '놀이터 길 만들기', short: '놀이터 길', icon: '🛝', en: 'Make a playground path', play: '길을 걸어요', playEn: 'Walk along the path',
      steps: [
        { id: 'push', label: '자리 정리', title: '길 위의 흙을 밀어요', question: '놀이터로 가는 길에 흙더미가 있어. 흙을 밀 차를 골라 줘.', en: 'A pile of soil is blocking the playground path. Choose a machine that can push the soil.', action: '흙을 쓱 밀기', actionEn: 'Push the soil aside', result: '흙더미를 밀어서 길 자리를 정리했어.', resultEn: 'The soil is pushed aside. There is space for our path.' },
        { id: 'load', label: '재료 담기', title: '길에 쓸 모래를 담아요', question: '길에 쓸 모래를 삽으로 담아야 해. 어떤 차가 좋을까?', en: 'We need to scoop sand for the path. Which machine can scoop it?', action: '모래 한 삽 담기', actionEn: 'Scoop the sand', result: '삽으로 모래를 담았어. 이제 길로 옮기자.', resultEn: 'The sand is loaded. Now we can carry it to the path.' },
        { id: 'carry', label: '길로 옮기기', title: '모래를 길로 옮겨요', question: '담은 모래를 놀이터 길로 옮겨야 해. 짐을 옮길 차를 골라 줘.', en: 'Carry the loaded sand to the playground path. Choose a vehicle that carries loads.', action: '길로 옮겨 내리기', actionEn: 'Deliver the sand', result: '모래를 옮겨 내렸어. 준비한 길을 걸어 볼까?', resultEn: 'The sand has arrived. Let us walk along our prepared path.' }
      ] },
    { id: 'station', title: '소방서 앞마당 만들기', short: '소방서 앞마당', icon: '🚒', en: 'Make a fire station apron', play: '소방차 출동!', playEn: 'Drive out of the fire station',
      steps: [
        { id: 'dig', label: '자리 파기', title: '앞마당 자리를 파요', question: '소방서 앞마당의 낮은 바닥 자리를 파야 해. 땅을 파는 차를 골라 줘.', en: 'Dig a shallow space for the fire station apron. Choose a machine that digs.', action: '흙 한 삽 파기', actionEn: 'Dig a scoop of soil', result: '낮게 파서 앞마당 바닥 자리를 준비했어.', resultEn: 'We dug a shallow space for the apron.' },
        { id: 'mix', label: '콘크리트 준비', title: '콘크리트를 섞어요', question: '앞마당에 쓸 콘크리트를 빙글빙글 섞어야 해. 어떤 차가 좋을까?', en: 'Mix the concrete for the apron. Which truck can turn its drum to mix?', action: '빙글빙글 섞기', actionEn: 'Turn and mix', result: '콘크리트를 섞었어. 이제 긴 관으로 보내자.', resultEn: 'The concrete is mixed. Now we can send it through a pipe.' },
        { id: 'pump', label: '바닥 채우기', title: '관으로 앞마당에 보내요', question: '긴 관으로 콘크리트를 앞마당 바닥에 보내요. 어떤 차가 필요할까?', en: 'Send concrete through a long pipe into the shallow apron. Which truck can do that?', action: '관으로 보내기', actionEn: 'Pump through the pipe', result: '콘크리트를 보내 바닥을 채웠어. 놀이 속에서 단단해진 앞마당으로 출동하자!', resultEn: 'The concrete fills the apron. In our play, it is now firm and ready to drive on.' }
      ] },
    { id: 'bridge', title: '다리 잇기', short: '작은 다리', icon: '🌉', en: 'Join a small bridge', play: '다리를 건너요', playEn: 'Cross the small bridge',
      steps: [
        { id: 'dig', label: '받침 자리', title: '받침 옆의 흙을 파요', question: '작은 물길 양쪽의 낮은 받침을 가린 흙을 파야 해. 어떤 차가 좋을까?', en: 'Dig away the soil covering the low supports beside a small stream. Which machine can dig?', action: '받침 자리 파기', actionEn: 'Dig beside the supports', result: '받침을 가린 흙을 파서 다리판을 놓을 자리를 준비했어.', resultEn: 'The soil is dug away. Our low supports are ready for the bridge pieces.' },
        { id: 'carry', label: '작은 판 운반', title: '작은 다리판을 옮겨요', question: '차에 실을 수 있는 작은 다리판을 옮겨야 해. 짐을 옮길 차를 골라 줘.', en: 'Carry the small bridge pieces that fit in a truck. Choose a load-carrying vehicle.', action: '작은 판 옮기기', actionEn: 'Carry the small pieces', result: '작은 다리판이 도착했어. 낮은 받침에 올려 보자.', resultEn: 'The small bridge pieces have arrived. Let us place them on the low supports.' },
        { id: 'lift', label: '낮게 올리기', title: '낮은 받침에 올려요', question: '작은 다리판을 바로 옆 낮은 받침에 올려야 해. 들어 올리는 차를 골라 줘.', en: 'Lift a small bridge piece onto the low support beside it. Choose a machine that lifts.', action: '받침에 올리기', actionEn: 'Lift onto the low support', result: '작은 판을 낮은 받침에 올려 다리가 이어졌어!', resultEn: 'The small pieces join our low bridge. It is ready to cross!' }
      ] }
  ];

  const MISSION_GUIDES = {
    dig: ['땅을 파는', 'dig soil', '흙 한 삽 파기', 'Dig a scoop of soil'],
    push: ['흙을 미는', 'push soil', '흙을 쓱 밀기', 'Push the soil'],
    load: ['삽으로 흙을 담는', 'scoop soil', '흙 한 삽 담기', 'Scoop the soil'],
    carry: ['짐을 옮기는', 'carry loads', '짐을 옮겨 내리기', 'Carry and unload'],
    mix: ['콘크리트를 섞는', 'mix concrete', '빙글빙글 섞기', 'Mix the concrete'],
    lift: ['짐을 들어 올리는', 'lift a load', '짐 들어 올리기', 'Lift the load'],
    pump: ['긴 관으로 콘크리트를 보내는', 'pump concrete through a pipe', '관으로 보내기', 'Pump through the pipe']
  };
  const VEHICLE_ROLES = {
    excavator: ['삽으로 땅을 파고 흙을 담아요.', 'digs and scoops soil'],
    mini_excavator: ['작은 삽으로 땅을 파고 흙을 담아요.', 'digs and scoops with a small bucket'],
    bulldozer: ['앞의 넓은 판으로 흙을 밀어요.', 'pushes soil with a wide blade'],
    wheel_loader: ['앞의 큰 삽으로 흙을 담고 밀어요.', 'scoops and pushes soil with a front bucket'],
    dump_truck: ['적재함에 흙과 돌을 싣고 옮겨요.', 'carries soil and stones in its bed'],
    concrete_mixer: ['통을 돌려 콘크리트를 섞어요.', 'mixes concrete in a turning drum'],
    concrete_pump_truck: ['긴 관으로 콘크리트를 보내요.', 'pumps concrete through a long pipe'],
    crane_truck: ['갈고리로 무거운 짐을 들어 올려요.', 'lifts heavy loads with a hook'],
    forklift: ['앞의 두 갈래 포크로 짐을 들어요.', 'lifts loads with two forks'],
    road_roller: ['무거운 바퀴로 바닥을 다져요.', 'compacts the ground with a heavy roller'],
    asphalt_paver: ['도로 위에 아스팔트를 펼쳐요.', 'spreads asphalt on a road'],
    grader: ['긴 판으로 흙을 밀며 땅을 고르게 해요.', 'levels soil with a long blade'],
    backhoe_loader: ['앞뒤 삽으로 땅을 파고 흙을 담아요.', 'digs and scoops with front and rear buckets'],
    skid_steer_loader: ['앞의 삽으로 흙을 담고 밀어요.', 'scoops and pushes soil with its front bucket'],
    tower_crane: ['높은 탑의 갈고리로 짐을 들어요.', 'lifts loads with a hook on a tall tower'],
    mobile_crane: ['이동해서 갈고리로 짐을 들어요.', 'moves into position and lifts loads with a hook'],
    pile_driver: ['긴 기둥을 땅속으로 박아요.', 'drives long piles into the ground'],
    drilling_rig: ['드릴을 돌려 땅에 구멍을 뚫어요.', 'drills holes in the ground'],
    excavator_breaker: ['단단한 바위나 콘크리트를 깨요.', 'breaks hard rock or concrete'],
    dump_loader: ['흙을 담고 적재함으로 옮겨요.', 'loads soil and carries it in its bed'],
    articulated_dump_truck: ['흙과 돌을 싣고 굽은 길도 가요.', 'carries soil and stones on winding tracks'],
    water_truck: ['탱크에 물을 싣고 물을 뿌려요.', 'carries and sprays water'],
    sweeper_truck: ['솔로 도로의 먼지를 쓸어요.', 'sweeps dust off a road'],
    fuel_truck: ['탱크에 연료를 싣고 보내요.', 'carries fuel in a tank'],
    lowbed_trailer: ['낮은 짐칸에 큰 기계를 싣고 옮겨요.', 'carries large machines on a low trailer'],
    cargo_truck: ['짐칸에 재료를 싣고 옮겨요.', 'carries materials in its cargo bed'],
    scissor_lift: ['작업대에 탄 사람을 위로 올려요.', 'raises people on a work platform']
  };

  const state = {
    container: null,
    options: {},
    vehicles: [],
    missions: [],
    currentRound: 1,
    currentMission: null,
    currentChoices: [],
    completedVehicles: [], // ★ 피날레를 위해 성공한 차량 기록
    locked: false,
    destroyed: false,
    timers: [],
    layoutMode: 'portrait',
    resizeTimer: null,
    handleResizeBound: null,
    successRewardGiven: false,
    completeRewardGiven: false,
    session: 0,
    roundToken: 0,
    mode: 'chooser',
    projectId: null,
    completedSteps: [],
    selectedVehicle: null,
    workPhase: 'choose',
    workMode: null,
    scenePlayCount: 0,
    scenePlaying: false
  };

  function playGameVoice(id) {
    const aliases = {
      'games.common.wrong': 'games.construction.wrong',
      'games.common.correct': 'games.construction.correct',
      'games.common.complete': 'games.construction.complete'
    };
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(aliases[id] || id).catch(() => {});
    }
  }
  function getConstructionVehicleVoiceId(vehicle, kind) {
    const map = {
      excavator: 'excavator',
      mini_excavator: 'miniExcavator',
      bulldozer: 'bulldozer',
      wheel_loader: 'wheelLoader',
      dump_truck: 'dumpTruck',
      concrete_mixer: 'concreteMixer',
      concrete_pump_truck: 'concretePumpTruck',
      crane_truck: 'craneTruck',
      forklift: 'forklift'
    };
    const key = map[vehicle?.id];
    return key ? `vehicles.construction.${key}.${kind}` : '';
  }

  function announceConstructionVehicle(vehicle) {
    const nameId = getConstructionVehicleVoiceId(vehicle, 'name');
    const labels = window.SihyeonVoiceLabels;
    if (!nameId && window.SihyeonPlaySettings?.getLanguage?.() === 'en'
      && labels?.entry?.('vehicle', vehicle.id)?.en && typeof labels.say === 'function') {
      // Newly eligible machines have no legacy voice ID. The shared label
      // registry supplies their English name; untranslated roles stay silent.
      return labels.say('vehicle', vehicle.id, { lang: 'en' }).catch(() => false);
    }
    if (typeof window.SihyeonVoice?.playSequence !== 'function') return Promise.resolve(false);
    return window.SihyeonVoice.playSequence([
      [nameId, vehicle.name],
      [getConstructionVehicleVoiceId(vehicle, 'sound'), vehicle.sound]
    ], { allowTtsFallback: true }).catch(() => false);
  }

  function speak(text, force, englishText) {
    const phrase = window.SihyeonPlaySettings?.getLanguage?.() === 'en' ? englishText : text;
    if (!phrase || state.destroyed) return;
    try { state.options.say?.(phrase)?.catch?.(() => {}); } catch (_) {}
  }

  function stopSpeech() {
    try { window.SihyeonVoice?.stop?.(); } catch (_) {}
  }

  function reward(amount) {
    try { state.options.fireConfetti?.(); } catch (_) {}
    try { state.options.gainExp?.(amount); } catch (_) {}
  }

  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (error) {}
  }

  function setManagedTimeout(fn, delay) {
    const session = state.session, round = state.roundToken;
    const id = window.setTimeout(() => {
      state.timers = state.timers.filter((timerId) => timerId !== id);
      if (!state.destroyed && state.session === session && state.roundToken === round) fn();
    }, delay);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach((id) => window.clearTimeout(id));
    state.timers = [];
  }

  function isLandscapeMode() {
    try {
      return window.matchMedia('(orientation: landscape) and (min-width: 768px) and (min-height: 520px)').matches;
    } catch (error) {
      return window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
    }
  }

  function getLayoutMode() {
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  function getRootLayoutClass() {
    const mode = getLayoutMode();
    state.layoutMode = mode;
    return `construction-root construction-${mode}`;
  }

  function applyRootLayoutClass() {
    const root = state.container?.querySelector('.cs-root');
    if (!root) return;
    root.classList.remove('construction-portrait', 'construction-landscape');
    root.classList.add('construction-root', `construction-${getLayoutMode()}`);
  }

  function bindResizeEvents() {
    if (state.handleResizeBound) return;
    state.handleResizeBound = handleResize;
    window.addEventListener('resize', state.handleResizeBound, { passive: true });
    window.addEventListener('orientationchange', state.handleResizeBound, { passive: true });
  }

  function unbindResizeEvents() {
    if (!state.handleResizeBound) return;
    window.removeEventListener('resize', state.handleResizeBound);
    window.removeEventListener('orientationchange', state.handleResizeBound);
    state.handleResizeBound = null;
  }

  function handleResize() {
    if (state.destroyed || !state.container) return;
    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(() => {
      state.resizeTimer = null;
      refreshLayoutOnly();
    }, 120);
  }

  function refreshLayoutOnly() {
    if (state.destroyed || !state.container) return;
    const nextMode = getLayoutMode();
    if (state.layoutMode === nextMode) {
      applyRootLayoutClass();
      return;
    }
    state.layoutMode = nextMode;

    if (state.locked || !state.currentMission) {
      applyRootLayoutClass();
      return;
    }

    renderGame();
  }

  function injectStyle() {
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .cs-root { width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; position: relative; overflow: hidden; color: #223047; background: radial-gradient(circle at 18% 14%, rgba(255,255,255,0.95) 0 0.8%, transparent 1.2%), radial-gradient(circle at 76% 18%, rgba(255,255,255,0.9) 0 0.7%, transparent 1.1%), linear-gradient(180deg, #60c8ff 0%, #9ee7ff 36%, #ffe59c 36.4%, #f8b24d 100%); font-family: 'Jua', sans-serif; user-select: none; touch-action: manipulation; }
      .cs-root::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 18% 21%, rgba(255,255,255,0.85) 0 7%, transparent 7.4%), radial-gradient(ellipse at 28% 18%, rgba(255,255,255,0.76) 0 6%, transparent 6.4%), radial-gradient(ellipse at 68% 25%, rgba(255,255,255,0.74) 0 8%, transparent 8.4%), radial-gradient(ellipse at 81% 21%, rgba(255,255,255,0.82) 0 6%, transparent 6.5%); opacity: 0.96; pointer-events: none; animation: csCloudFloat 7s ease-in-out infinite alternate; }
      .cs-root::after { content: ""; position: absolute; left: -8%; right: -8%; bottom: -10%; height: 34%; background: repeating-linear-gradient(-18deg, rgba(255,255,255,0.16) 0 12px, transparent 12px 26px), linear-gradient(180deg, #d28b34 0%, #a76524 100%); border-radius: 50% 50% 0 0 / 22% 22% 0 0; box-shadow: inset 0 18px 0 rgba(255,255,255,0.18); pointer-events: none; }

      .construction-root { isolation: isolate; }
      .construction-portrait { flex-direction: column; }
      .construction-landscape { display: grid; grid-template-columns: minmax(220px, 27%) minmax(360px, 1fr) minmax(230px, 28%); grid-template-rows: auto auto 1fr; gap: 12px; padding: 12px; align-items: stretch; }
      .construction-landscape::before, .construction-landscape::after { z-index: 0; }
      .construction-landscape .cs-top { grid-column: 1; grid-row: 1; padding: 0; align-self: start; flex-direction: column; align-items: stretch; gap: 10px; }
      .construction-landscape .cs-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .construction-landscape .cs-pill, .construction-landscape .cs-btn { width: 100%; min-height: 48px; display: grid; place-items: center; text-align: center; }
      .construction-landscape .cs-progress { grid-column: 1; grid-row: 2; padding: 0; align-self: start; justify-content: flex-start; }
      .construction-landscape .cs-question-card { grid-column: 1; grid-row: 3; margin: 0; align-self: stretch; display: flex; flex-direction: column; justify-content: center; }
      .construction-landscape .cs-stage { grid-column: 2; grid-row: 1 / span 3; margin: 0; min-height: 0; height: 100%; }
      .construction-landscape .cs-choices { grid-column: 3; grid-row: 1 / span 3; padding: 0; display: grid; grid-template-columns: 1fr; align-content: center; gap: 12px; min-height: 0; }
      .construction-landscape .cs-choice { min-height: clamp(126px, 25vh, 190px); padding: 10px; }
      .construction-landscape .cs-choice-img { max-height: clamp(92px, 20vh, 150px); }
      .construction-landscape .cs-message { left: 50%; bottom: 24px; width: min(54vw, 560px); }
      .construction-landscape .cs-worker-vehicle { width: min(90%, 760px); height: min(78%, 560px); }
      .construction-landscape .cs-target-zone { width: clamp(190px, 24vw, 340px); height: clamp(128px, 17vw, 210px); }
      .construction-landscape .cs-road { width: min(34vw, 430px); }

      .cs-top { position: relative; z-index: 5; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 10px 12px 6px; }
      .cs-pill { padding: 8px 16px; border-radius: 999px; background: rgba(255,255,255,0.9); border: 4px solid #fff; box-shadow: 0 6px 0 rgba(102,60,14,0.22); font-size: clamp(17px, 4.6vw, 24px); font-weight: 900; }
      .cs-actions { display: flex; gap: 8px; flex-shrink: 0; }
      .cs-btn { min-width: 44px; min-height: 44px; padding: 8px 13px; border-radius: 999px; border: 4px solid #fff; background: linear-gradient(180deg, #fff 0%, #ffe477 100%); box-shadow: 0 6px 0 rgba(102,60,14,0.22); font: inherit; font-size: 17px; font-weight: 900; cursor: pointer; }
      .cs-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(102,60,14,0.22); }

      .cs-progress { position: relative; z-index: 5; flex-shrink: 0; display: flex; justify-content: center; gap: 7px; padding: 0 12px 6px; }
      .cs-dot { width: clamp(15px, 4vw, 22px); height: clamp(15px, 4vw, 22px); border-radius: 999px; background: rgba(255,255,255,0.62); border: 3px solid #fff; box-shadow: 0 3px 0 rgba(102,60,14,0.18); }
      .cs-dot.active { background: linear-gradient(180deg, #fff36d 0%, #ff9e2c 100%); transform: scale(1.18); }
      .cs-dot.done { background: linear-gradient(180deg, #9cff86 0%, #23b94a 100%); }

      .cs-question-card { position: relative; z-index: 5; margin: 0 12px 8px; padding: 10px 12px; border-radius: 24px; border: 5px solid #fff; background: rgba(255,255,255,0.88); box-shadow: 0 7px 0 rgba(102,60,14,0.2); text-align: center; flex-shrink: 0; }
      .cs-title { font-size: clamp(20px, 5.5vw, 30px); font-weight: 900; color: #1f2d44; }
      .cs-question { margin-top: 5px; font-size: clamp(15px, 4.2vw, 21px); font-weight: 900; color: #5a3a12; }

      .cs-stage { position: relative; z-index: 3; flex: 1; min-height: 0; margin: 0 12px 10px; border-radius: 30px; border: 6px solid rgba(255,255,255,0.92); overflow: hidden; background: radial-gradient(circle at 50% 18%, rgba(255,255,255,0.28) 0 6%, transparent 6.5%), linear-gradient(180deg, rgba(255,244,185,0.84) 0%, rgba(255,196,89,0.84) 46%, rgba(158,92,29,0.9) 100%); box-shadow: 0 9px 0 rgba(102,60,14,0.22), inset 0 5px 0 rgba(255,255,255,0.34); }
      .cs-site-board { position: absolute; left: 14px; top: 14px; z-index: 5; padding: 7px 14px; border-radius: 999px; background: linear-gradient(180deg, #fffdf2 0%, #ffe082 100%); border: 4px solid #fff; box-shadow: 0 5px 0 rgba(102,60,14,0.2); font-size: clamp(15px, 4vw, 21px); font-weight: 900; color: #4b2e08; display: inline-flex; }
      .cs-sun { position: absolute; right: clamp(14px, 5vw, 40px); top: clamp(18px, 5vw, 42px); width: clamp(58px, 15vw, 96px); height: clamp(58px, 15vw, 96px); border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff 0%, #fff58a 22%, #ffbb22 70%, #ff8f00 100%); box-shadow: 0 0 0 12px rgba(255,230,80,0.22), 0 0 36px rgba(255,193,7,0.55); animation: csPulseSun 2.8s ease-in-out infinite alternate; }
      .cs-ground { position: absolute; left: -4%; right: -4%; bottom: -2%; height: 37%; border-radius: 50% 50% 0 0 / 18% 18% 0 0; background: repeating-linear-gradient(14deg, rgba(255,255,255,0.16) 0 12px, transparent 12px 24px), linear-gradient(180deg, #d78a31 0%, #9d5c21 100%); box-shadow: inset 0 14px 0 rgba(255,255,255,0.16); }
      .cs-road { position: absolute; left: 50%; bottom: -8%; width: min(52vw, 390px); height: 42%; transform: translateX(-50%) perspective(240px) rotateX(34deg); transform-origin: bottom center; background: linear-gradient(90deg, transparent 0 45%, rgba(255,255,255,0.65) 45% 55%, transparent 55% 100%), linear-gradient(180deg, #6d7279 0%, #313942 100%); border-left: 6px solid rgba(255,255,255,0.45); border-right: 6px solid rgba(255,255,255,0.45); clip-path: polygon(34% 0%, 66% 0%, 100% 100%, 0% 100%); opacity: 0.92; }
      
      .cs-target-zone { position: absolute; left: 50%; bottom: 26%; width: clamp(155px, 46vw, 290px); height: clamp(110px, 27vw, 175px); transform: translateX(-50%); border-radius: 28px; border: 6px dashed rgba(255,255,255,0.9); background: radial-gradient(circle at 28% 32%, rgba(255,255,255,0.55) 0 11%, transparent 12%), linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.12)); display: grid; place-items: center; box-shadow: inset 0 0 20px rgba(255,255,255,0.28), 0 8px 0 rgba(102,60,14,0.15); }
      .cs-target-icon { font-size: clamp(58px, 17vw, 104px); filter: drop-shadow(0 7px 0 rgba(0,0,0,0.16)); animation: csTargetWiggle 1.7s ease-in-out infinite alternate; }
      .cs-result-icon { position: absolute; left: 50%; bottom: 28%; z-index: 8; transform: translateX(-50%) scale(0); width: clamp(116px, 33vw, 210px); height: clamp(90px, 23vw, 145px); border-radius: 28px; border: 5px solid #fff; background: radial-gradient(circle at 32% 26%, rgba(255,255,255,0.68) 0 15%, transparent 16%), linear-gradient(180deg, #d7ff8d 0%, #58d46f 100%); box-shadow: 0 8px 0 rgba(44,113,44,0.25); display: grid; place-items: center; font-size: clamp(48px, 14vw, 88px); }
      .cs-root.is-success .cs-result-icon { animation: csResultPop 0.72s cubic-bezier(0.2, 1.4, 0.32, 1) forwards; }

      /* ★ 초거대 공사차 등장 애니메이션 */
      .cs-worker-vehicle { position: absolute; left: -50%; bottom: 17%; z-index: 50; width: min(90%, 700px); height: min(78%, 500px); display: grid; place-items: center; opacity: 0; pointer-events: none; }
      .cs-worker-vehicle img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 12px 0 rgba(0,0,0,0.16)) drop-shadow(0 16px 18px rgba(0,0,0,0.2)); }
      .cs-worker-fallback { font-size: clamp(80px, 22vw, 150px); }

      .cs-root.is-working .cs-worker-vehicle { animation: csMegaVehicleWork 4.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      @keyframes csMegaVehicleWork {
        0%   { left: -50%; opacity: 0; transform: translateX(0) scale(0.5); }
        15%  { left: 50%; opacity: 1; transform: translateX(-50%) scale(.92); }
        25%  { left: 50%; opacity: 1; transform: translateX(-50%) scale(1) rotate(-1.5deg); }
        75%  { left: 50%; opacity: 1; transform: translateX(-50%) scale(1) rotate(1.5deg); }
        100% { left: 150%; opacity: 0; transform: translateX(-50%) scale(1); }
      }

      .cs-root.is-working .cs-target-zone { animation: csWorkShake 0.22s ease-in-out 4 alternate; }
      .cs-dust { position: absolute; left: 50%; bottom: 31%; z-index: 9; width: clamp(160px, 42vw, 290px); height: clamp(84px, 20vw, 128px); transform: translateX(-50%); pointer-events: none; opacity: 0; }
      .cs-dust span { position: absolute; bottom: 0; width: clamp(26px, 7vw, 46px); height: clamp(26px, 7vw, 46px); border-radius: 50%; background: rgba(255,235,169,0.9); box-shadow: inset 0 4px 0 rgba(255,255,255,0.34); }
      .cs-root.is-working .cs-dust { animation: csDustBoom 1.2s ease-out 0.55s forwards; }

      .cs-finish-build { position: absolute; left: 50%; bottom: 32%; z-index: 6; width: clamp(124px, 34vw, 230px); height: clamp(96px, 25vw, 170px); transform: translateX(-50%); opacity: 0; pointer-events: none; }
      .cs-build-base { position: absolute; left: 8%; right: 8%; bottom: 0; height: 56%; border-radius: 18px 18px 8px 8px; border: 5px solid #fff; background: linear-gradient(180deg, #ffef8a 0%, #ff9d3d 100%); box-shadow: 0 8px 0 rgba(102,60,14,0.22); }
      .cs-build-roof { position: absolute; left: 0; right: 0; bottom: 46%; height: 50%; clip-path: polygon(50% 0%, 100% 68%, 88% 80%, 50% 30%, 12% 80%, 0 68%); background: linear-gradient(180deg, #ff5a76 0%, #d12d44 100%); filter: drop-shadow(0 6px 0 rgba(102,60,14,0.18)); }
      .cs-build-door { position: absolute; left: 50%; bottom: 0; width: 24%; height: 34%; transform: translateX(-50%); border-radius: 12px 12px 0 0; background: #744123; border: 4px solid rgba(255,255,255,0.75); }
      .cs-root.is-complete .cs-finish-build { animation: csHousePop 0.8s cubic-bezier(0.2, 1.4, 0.32, 1) forwards; }

      /* ★ 3대 피날레 차량 뷰 */
      .cs-finale-vehicles { position: absolute; bottom: 8%; left: 0; width: 100%; display: flex; justify-content: center; align-items: flex-end; gap: 10px; z-index: 20; opacity: 0; pointer-events: none; }
      .cs-root.is-complete .cs-finale-vehicles { animation: csFinaleFadeIn 1s 0.5s forwards; }
      .cs-finale-vehicles img { width: 30%; max-width: 140px; object-fit: contain; filter: drop-shadow(0 8px 10px rgba(0,0,0,0.2)); animation: csFinaleBounce 1.5s infinite alternate; }
      .cs-finale-vehicles img:nth-child(2) { transform: scale(1.1); animation-delay: 0.2s; z-index: 2; margin-bottom: 10px; }
      .cs-finale-vehicles img:nth-child(3) { animation-delay: 0.4s; }

      @keyframes csFinaleFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes csFinaleBounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }

      /* ── 선택지 스타일 (글자 빼고 이미지만 꽉 채움!) ── */
      .cs-choices { position: relative; z-index: 6; flex-shrink: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(7px, 2.2vw, 13px); padding: 0 12px 14px; }
      .cs-choice { min-height: clamp(112px, 25vw, 166px); border-radius: 24px; border: 5px solid #fff; background: radial-gradient(circle at 28% 22%, rgba(255,255,255,0.7) 0 13%, transparent 14%), linear-gradient(180deg, #ffffff 0%, #fff1b8 100%); box-shadow: 0 8px 0 rgba(102,60,14,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 12px; transition: opacity 0.2s, transform 0.1s; }
      .cs-choice:active { transform: translateY(5px); box-shadow: 0 3px 0 rgba(102,60,14,0.2); }
      .cs-choice.is-disabled { pointer-events: none; }
      .cs-choice.is-correct { background: linear-gradient(180deg, #f7fff1 0%, #8cff79 100%); box-shadow: 0 8px 0 rgba(38,122,37,0.25), 0 0 0 6px rgba(126,217,87,0.28); }
      .cs-choice.is-wrong { animation: csWrongWobble 0.42s ease-in-out; opacity: 0.6; } /* 틀렸을 때 부드럽게 흔들리고 연해짐 */

      .cs-choice-img { max-width: 100%; max-height: clamp(80px, 18vw, 130px); object-fit: contain; filter: drop-shadow(0 8px 0 rgba(0,0,0,0.12)); }
      .cs-choice-img-wrap { display: grid; place-items: center; width: 100%; height: clamp(80px, 18vw, 130px); min-width: 0; }
      .construction-landscape .cs-choice-img-wrap { height: clamp(92px, 20vh, 150px); }
      .cs-finale-vehicle { width: 30%; max-width: 140px; height: 115px; display: grid; place-items: center; animation: csFinaleBounce 1.5s infinite alternate; }
      .cs-finale-vehicle:nth-child(2) { animation-delay: .2s; }
      .cs-finale-vehicle:nth-child(3) { animation-delay: .4s; }
      .cs-finale-vehicle img { width: 100%; max-height: 100%; }
      @media (max-height: 520px) and (orientation: landscape) { .construction-landscape .cs-choice-img-wrap { height: 72px; } }
      @media (max-width: 390px) { .cs-choice-img-wrap { height: 70px; } }
      .cs-choice-emoji { font-size: clamp(56px, 15vw, 100px); filter: drop-shadow(0 7px 0 rgba(0,0,0,0.14)); }
      .cs-choice-name { display: none; } /* ★ 글자 숨김: 그림에만 집중! */

      .cs-message { position: absolute; left: 50%; bottom: clamp(128px, 27vw, 185px); z-index: 30; width: min(88vw, 520px); transform: translateX(-50%) translateY(20px) scale(0.92); opacity: 0; padding: 14px 16px; border-radius: 28px; border: 5px solid #fff; background: rgba(255,255,255,0.94); box-shadow: 0 9px 0 rgba(102,60,14,0.22); text-align: center; font-size: clamp(21px, 5.8vw, 34px); font-weight: 900; }
      .cs-message.show { animation: csMessagePop 1.35s ease-out forwards; }

      .cs-loading, .cs-error { width: 100%; height: 100%; display: grid; place-items: center; text-align: center; color: #fff; background: linear-gradient(180deg, #60c8ff 0%, #f7b143 100%); font-size: clamp(24px, 7vw, 38px); font-weight: 900; text-shadow: 0 3px 0 rgba(0,0,0,0.18); }

      /* 애니메이션 키프레임 */
      @keyframes csCloudFloat { from { transform: translateX(-10px); } to { transform: translateX(14px); } }
      @keyframes csPulseSun { from { transform: scale(1) rotate(0deg); } to { transform: scale(1.08) rotate(8deg); } }
      @keyframes csTargetWiggle { from { transform: rotate(-3deg) scale(1); } to { transform: rotate(4deg) scale(1.05); } }
      @keyframes csWorkShake { from { transform: translateX(-50%) rotate(-1.8deg); } to { transform: translateX(-50%) rotate(1.8deg); } }
      @keyframes csDustBoom { 0% { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.6); } 30% { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.08); } 100% { opacity: 0; transform: translateX(-50%) translateY(-28px) scale(1.35); } }
      @keyframes csResultPop { 0% { transform: translateX(-50%) scale(0); opacity: 0; } 70% { transform: translateX(-50%) scale(1.1); opacity: 1; } 100% { transform: translateX(-50%) scale(1); opacity: 1; } }
      @keyframes csHousePop { 0% { transform: translateX(-50%) translateY(30px) scale(0.4); opacity: 0; } 70% { transform: translateX(-50%) translateY(-5px) scale(1.08); opacity: 1; } 100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; } }
      @keyframes csWrongWobble { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-9px) rotate(-2deg); } 40% { transform: translateX(8px) rotate(2deg); } 60% { transform: translateX(-6px) rotate(-1deg); } 80% { transform: translateX(4px) rotate(1deg); } }
      @keyframes csMessagePop { 0% { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.86); } 18% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.04); } 78% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } 100% { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.98); } }

      /* 태블릿 최적화 */
      @media (min-width: 768px) and (min-height: 600px) {
        .cs-pill { font-size: 28px; padding: 12px 24px; }
        .cs-btn { font-size: 22px; padding: 12px 24px; }
        .cs-title { font-size: 42px; }
        .cs-question { font-size: 26px; }
        .cs-choice { min-height: 220px; border-radius: 36px; border-width: 8px; }
        .cs-choice-img { max-height: 160px; }
      }

      @media (orientation: landscape) and (min-width: 1024px) and (min-height: 640px) {
        .construction-landscape { grid-template-columns: minmax(250px, 25%) minmax(0, 1fr) minmax(270px, 27%); gap: 16px; padding: 16px; }
        .construction-landscape .cs-stage { border-radius: 36px; border-width: 8px; }
        .construction-landscape .cs-title { font-size: clamp(30px, 3vw, 44px); }
        .construction-landscape .cs-question { font-size: clamp(20px, 2vw, 28px); line-height: 1.25; }
        .construction-landscape .cs-choice { border-radius: 32px; border-width: 7px; }
      }

      @media (orientation: landscape) and (max-width: 900px) {
        .construction-landscape { grid-template-columns: minmax(180px, 26%) minmax(280px, 1fr) minmax(190px, 28%); gap: 8px; padding: 8px; }
        .construction-landscape .cs-pill, .construction-landscape .cs-btn { min-height: 44px; font-size: 16px; padding: 6px 10px; }
        .construction-landscape .cs-question-card { padding: 8px; border-radius: 20px; }
        .construction-landscape .cs-title { font-size: 20px; }
        .construction-landscape .cs-question { font-size: 15px; }
        .construction-landscape .cs-choice { min-height: 88px; border-radius: 18px; border-width: 4px; padding: 5px; }
        .construction-landscape .cs-choice-img { max-height: 72px; }
      }

      /* 스마트폰 가로모드 최적화 */
      @media (max-height: 500px) and (orientation: landscape) {
        .game-play-screen:has(> #constructionSiteTarget) > .game-back-floating { width: 44px; height: 44px; }
        .cs-top { padding: 4px 12px 4px 58px; }
        .cs-pill { min-height: 36px; padding: 4px 12px; font-size: 16px; }
        .cs-btn { min-height: 44px; padding: 4px 12px; font-size: 14px; }
        .cs-question-card { margin: 0 12px 4px; padding: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .cs-title { font-size: 18px; }
        .cs-question { display: none; }
        .cs-stage { margin-bottom: 4px; }
        /* Keep the scene inside its remaining height, including the listen-button mission. */
        .cs-site-board { top: 8px; left: 8px; padding: 4px 8px; border-width: 3px; font-size: 13px; }
        .cs-sun { top: 8px; right: 18px; width: 40px; height: 40px; }
        .cs-target-zone { width: min(40%, 190px); height: 64%; max-height: 100px; bottom: 16%; border-width: 4px; border-radius: 18px; }
        .cs-target-icon { font-size: clamp(32px, 10vh, 44px); line-height: 1; }
        .cs-result-icon { width: min(34%, 160px); height: 58%; max-height: 86px; bottom: 18%; border-width: 4px; border-radius: 18px; font-size: clamp(28px, 9vh, 40px); line-height: 1; }
        .cs-choices { padding: 0 12px 6px; gap: 6px; }
        .cs-choice { min-height: 90px; border-radius: 16px; border-width: 4px; padding: 4px; }
        .cs-choice-img { max-height: 70px; }
        .cs-choice-img-wrap { height: 70px; }
        .cs-message { bottom: 104px; padding: 8px 12px; border-width: 4px; border-radius: 20px; font-size: 18px; line-height: 1.25; }
      }
      
      .cs-success-panel { position: absolute; inset: 0; z-index: 60; display: grid; place-items: center; padding: 18px; background: rgba(70, 170, 255, 0.2); backdrop-filter: blur(4px); }
      .cs-success-box { width: min(92vw, 540px); border-radius: 32px; border: 7px solid #fff; background: radial-gradient(circle at 28% 16%, rgba(255,255,255,0.82) 0 10%, transparent 11%), linear-gradient(180deg, #ffffff 0%, #fff0a6 100%); box-shadow: 0 14px 0 rgba(102,60,14,0.22); padding: 24px 18px 20px; text-align: center; display: grid; gap: 14px; }
      .cs-success-icon { font-size: clamp(78px, 23vw, 132px); animation: csSuccessBounce 1s ease-in-out infinite alternate; }
      @keyframes csSuccessBounce { from { transform: translateY(0) rotate(-2deg); } to { transform: translateY(-10px) rotate(3deg); } }
      .cs-success-title { font-size: clamp(30px, 8vw, 46px); font-weight: 900; color: #223047; }
      .cs-success-sub { font-size: clamp(17px, 4.8vw, 24px); font-weight: 900; color: #74501c; }
      .cs-success-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      @media (max-height: 500px) and (orientation: landscape) {
        .cs-success-panel { padding: 12px; }
        .cs-success-box { max-width: 100%; padding: 12px 16px; gap: 6px; }
        .cs-success-icon { font-size: 56px; line-height: 1; }
        .cs-success-title { font-size: 28px; line-height: 1.1; }
        .cs-success-sub { font-size: 16px; line-height: 1.25; }
      }

      /* Work controls replace the choice tray; they never float over a scene. */
      .cs-work-panel { position: relative; z-index: 6; flex-shrink: 0; display: grid; gap: 8px; padding: 8px 12px 14px; min-height: 116px; box-sizing: border-box; }
      .cs-work-panel[hidden], .cs-choices[hidden] { display: none !important; }
      .cs-work-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .cs-work-buttons .cs-btn { min-height: 58px; font-size: clamp(16px, 4vw, 23px); padding: 8px; }
      .cs-work-buttons .cs-primary { background: linear-gradient(180deg,#dfff9c,#81d87b); border-color:#fff; }
      .cs-work-status { margin: 0; color:#34465c; font-size:clamp(16px,3.8vw,22px); line-height:1.35; text-align:center; }
      .construction-landscape .cs-work-panel { grid-column: 3; grid-row: 1 / span 3; min-height:0; padding:8px; align-content:center; }
      .construction-landscape .cs-work-buttons { grid-template-columns: 1fr; }
      .cs-root.cs-ready .cs-worker-vehicle, .cs-root.cs-result-held .cs-worker-vehicle { animation:none; left:5%; bottom:9%; width:43%; height:61%; opacity:1; transform:none; z-index:10; }
      .cs-root.cs-result-held .cs-result-icon { left:72%; }
      .cs-root.cs-ready .cs-message, .cs-root.cs-result-held .cs-message, .cs-root.is-working .cs-message { display:none; }
      .cs-root.cs-result-held .cs-target-zone { opacity:.25; }
      .cs-work-status .cs-current-car { font-size: .9em; }
      .cs-project-picker { display:grid !important; grid-template-columns:1fr !important; grid-template-rows:auto minmax(0,1fr) auto !important; padding:12px; gap:12px; box-sizing:border-box; }
      .cs-picker-heading { position:relative; z-index:2; display:flex; align-items:center; justify-content:center; gap:12px; min-height:48px; padding-left:42px; }
      .cs-picker-heading h2 { font-size:clamp(21px,4vw,34px); margin:0; }
      .cs-project-cards { min-height:0; display:grid; grid-template-columns:1fr; gap:10px; position:relative; z-index:2; }
      .cs-project-card { min-width:0; min-height:80px; display:grid; grid-template-columns:38% 1fr; grid-template-rows:1fr 1fr; align-items:center; gap:0 8px; border:5px solid #fff; border-radius:24px; padding:8px; background:#fff8df; color:#30465d; font:inherit; cursor:pointer; box-shadow:0 5px 0 #bc8957; overflow:hidden; }
      .cs-project-card:active { transform:translateY(3px); }
      .cs-project-card:disabled { opacity:.55; cursor:default; }
      .cs-project-thumb { grid-row:1 / 3; display:block; min-width:0; height:100%; max-height:180px; }
      .cs-project-name { font-size:clamp(17px,3.7vw,27px); line-height:1.25; align-self:end; }
      .cs-project-small { font-size:clamp(12px,2.7vw,17px); color:#6c725d; align-self:start; margin-top:6px; }
      .cs-picker-footer { position:relative; z-index:2; display:flex; justify-content:center; align-items:center; gap:14px; color:#755635; }
      .cs-picker-footer .cs-btn { min-height:48px; }
      .cs-picker-footer span { font-size:15px; }
      .cs-scene-svg { width:100%; height:100%; display:block; overflow:hidden; }
      .cs-project-game .cs-stage { min-height:100px; background:#d9f3ff; border:5px solid #fff; }
      .cs-project-game .cs-stage::before, .cs-project-game .cs-stage::after { display:none; }
      .cs-project-scene { width:100%; height:100%; position:absolute; inset:0; }
      .cs-project-game .cs-worker-vehicle { width:30%; height:35%; left:3%; bottom:3%; z-index:4; opacity:0; }
      .cs-project-game.cs-ready .cs-worker-vehicle, .cs-project-game.cs-result-held .cs-worker-vehicle { left:3%; bottom:3%; width:30%; height:35%; opacity:1; }
      .cs-project-game.is-working .cs-worker-vehicle { animation:csProjectWork .85s ease-in-out forwards; }
      @keyframes csProjectWork { 0%{opacity:1;transform:translateX(0) rotate(0)} 50%{opacity:1;transform:translateX(22%) rotate(-3deg)} 100%{opacity:1;transform:translateX(12%) rotate(0)} }
      .cs-project-game .cs-question-card { display:grid; grid-template-columns:minmax(0,1fr) 48px; gap:6px; align-items:center; }
      .cs-project-game .cs-title { font-size:clamp(18px,4.6vw,28px); line-height:1.2; }
      .cs-project-game .cs-question { display:none; }
      .cs-project-game .cs-question-card .cs-message { position:static; display:none; transform:none; animation:none; margin:0; padding:0; width:auto; max-width:none; border:0; border-radius:0; background:transparent; box-shadow:none; font-size:16px; line-height:1.3; text-align:center; opacity:1; }
      .cs-project-game .cs-question-card.has-feedback .cs-title { display:none; }
      .cs-project-game .cs-question-card.has-feedback .cs-message.show { display:block; }
      .cs-project-game .cs-top { padding-left:58px; gap:8px; }
      .cs-project-game .cs-pill { font-size:clamp(16px,3.5vw,23px); padding:6px 10px; border-width:3px; min-width:0; }
      .cs-project-game .cs-btn { min-width:44px; min-height:44px; }
      .cs-project-game .cs-top .cs-btn { padding:6px 8px; font-size:16px; }
      .cs-project-game .cs-progress { align-items:center; gap:6px; min-height:24px; }
      .cs-step-label { font-size:clamp(12px,2.7vw,17px); color:#5b633e; }
      .cs-project-game .cs-message { font-size:17px; line-height:1.3; padding:9px 12px; border-width:3px; max-width:90%; bottom:122px; }
      .cs-project-game .cs-choice { min-height:100px; padding:6px; }
      .cs-project-game .cs-choice-img-wrap { height:82px; }
      .cs-project-game .cs-work-panel { height:156px; min-height:156px; grid-template-rows:minmax(0,1fr) auto; }
      .cs-project-game .cs-work-status { align-self:center; }
      .cs-project-complete .cs-stage { flex:1; }
      .cs-project-complete .cs-work-panel { display:grid; height:auto; min-height:174px; }
      .cs-project-complete .cs-work-buttons { grid-template-columns:1fr 1fr; }
      .cs-project-complete .cs-work-buttons .cs-primary { grid-column:1 / -1; }
      .cs-scene-svg.is-playing .cs-walker { animation:csWalkPath 1.7s ease-in-out forwards; }
      .cs-scene-svg.is-playing .cs-fire-engine { animation:csApronDrive 1.7s ease-in-out forwards; }
      .cs-scene-svg.is-playing .cs-bridge-car { animation:csCrossBridge 1.7s ease-in-out forwards; }
      @keyframes csWalkPath { to { transform:translate(236px,-82px); } }
      @keyframes csApronDrive { to { transform:translate(-138px,48px); } }
      @keyframes csCrossBridge { to { transform:translateX(370px); } }
      .cs-work-spark { animation:csSpark .85s ease-out infinite; transform-origin:center; }
      @keyframes csSpark { 50%{opacity:.25;transform:translateY(-15px) scale(1.2)} }
      @media (orientation:landscape) {
        .cs-project-picker { gap:8px; padding:8px; }
        .cs-project-cards { grid-template-columns:repeat(3,minmax(0,1fr)); }
        .cs-project-card { display:flex; flex-direction:column; justify-content:center; padding:6px; min-height:0; }
        .cs-project-thumb { width:100%; flex:1; min-height:0; max-height:none; }
        .cs-project-name { font-size:clamp(15px,2.2vw,25px); align-self:stretch; }
        .cs-project-small { font-size:12px; align-self:center; margin:4px 0; }
        .cs-picker-heading h2 { font-size:clamp(21px,3vw,30px); }
        .cs-picker-footer span { display:none; }
        .cs-project-game { display:grid; grid-template-columns:minmax(118px,22%) minmax(0,1fr) minmax(158px,28%); grid-template-rows:48px 26px minmax(0,1fr); gap:6px; padding:6px; box-sizing:border-box; }
        .cs-project-game .cs-top { grid-column:1 / -1; grid-row:1; flex-direction:row; align-items:center; padding:0 2px 0 50px; }
        .cs-project-game .cs-pill { width:auto; min-height:40px; display:flex; align-items:center; justify-content:center; }
        .cs-project-game .cs-actions { display:flex; gap:6px; }
        .cs-project-game .cs-top .cs-btn { width:auto; min-height:44px; }
        .cs-project-game .cs-progress { grid-column:1; grid-row:2; padding:0; justify-content:center; flex-wrap:wrap; }
        .cs-project-game .cs-step-label { display:none; }
        .cs-project-game .cs-question-card { grid-column:1; grid-row:3; margin:0; align-self:stretch; display:flex; flex-direction:column; justify-content:center; padding:8px; border-radius:18px; }
        .cs-project-game .cs-title { font-size:clamp(17px,2.2vw,26px); }
        .cs-project-game .cs-question-card .cs-message { font-size:clamp(13px,1.8vw,19px); }
        .cs-project-game .cs-question-card .cs-btn { width:48px; padding:4px; margin-top:8px; }
        .cs-project-game .cs-stage { grid-column:2; grid-row:2 / 4; margin:0; height:100%; min-height:0; border-radius:22px; }
        .cs-project-game .cs-choices, .cs-project-game .cs-work-panel { grid-column:3; grid-row:2 / 4; min-height:0; padding:0; align-content:stretch; }
        .cs-project-game .cs-choices { grid-template-columns:1fr; grid-template-rows:repeat(3,minmax(0,1fr)); gap:6px; }
        .cs-project-game .cs-choice { min-height:0; padding:3px; border-width:4px; border-radius:18px; }
        .cs-project-game .cs-choice-img-wrap { height:clamp(44px,13vh,90px); }
        .cs-project-game .cs-work-panel { align-content:center; gap:8px; height:100%; min-height:0; grid-template-rows:minmax(0,1fr) auto; }
        .cs-project-game .cs-work-buttons { grid-template-columns:1fr; }
        .cs-project-game .cs-work-buttons .cs-btn { min-height:48px; font-size:clamp(15px,2vw,22px); padding:6px; }
        .cs-project-game .cs-work-status { font-size:clamp(14px,1.9vw,21px); line-height:1.25; }
        .cs-project-game .cs-message { left:50%; bottom:14px; width:min(90%,560px); font-size:16px; }
        .cs-project-complete .cs-stage { grid-column:1 / 3; grid-row:2 / 4; }
        .cs-project-complete .cs-work-panel { grid-column:3; grid-row:2 / 4; }
        .cs-project-complete .cs-work-buttons { grid-template-columns:1fr; }
      }
      @media (max-width:360px) and (orientation:portrait) {
        .cs-project-game .cs-top { padding-left:50px; gap:4px; }
        .cs-project-game .cs-pill { font-size:14px; padding:4px 6px; }
        .cs-project-game .cs-top .cs-btn { font-size:14px; padding:4px; }
        .cs-project-game .cs-choice-img-wrap { height:60px; }
        .cs-project-game .cs-choice { min-height:78px; }
        .cs-work-panel { min-height:100px; padding:6px 10px; }
        .cs-project-card { padding:5px; }
      }
      @media (max-height:500px) and (orientation:landscape) {
        .cs-work-panel { min-height:88px; padding:4px 12px 6px; }
        .cs-work-status { font-size:15px; }
        .cs-work-buttons .cs-btn { min-height:44px; font-size:16px; padding:4px; }
        .cs-project-game .cs-work-panel { min-height:0; padding:0; }
        .cs-project-game .cs-work-status { font-size:14px; }
        .cs-project-game .cs-work-buttons { gap:6px; }
        .cs-project-game .cs-work-buttons .cs-btn { min-height:44px; }
        .cs-project-card { border-width:4px; border-radius:18px; }
        .cs-project-picker { grid-template-rows:44px minmax(0,1fr) 44px; }
        .cs-picker-heading { min-height:44px; }
        .cs-picker-footer .cs-btn { min-height:44px; padding:4px 12px; }
      }
      @media (prefers-reduced-motion:reduce) {
        .cs-scene-svg.is-playing .cs-scene-actor, .cs-work-spark { animation-duration:.01s; }
      }
    `;
    document.head.appendChild(style);
  }

  function shuffle(list) {
    const copy = Array.isArray(list) ? [...list] : [];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function normalizeVehicle(vehicle, index) {
    if (!vehicle) return null;
    const file = vehicle.file || vehicle.src || vehicle.image || '';
    const name = vehicle.name_ko || vehicle.name || vehicle.id || `공사차${index + 1}`;
    return {
      id: vehicle.id || `${file}-${index}`,
      category: vehicle.category || 'construction',
      file,
      name,
      sound: vehicle.sound_ko || vehicle.sound || name
    };
  }

  async function fetchConstructionVehicles() {
    try {
      const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Construction manifest load failed: ${response.status}`);
      const manifest = await response.json();
      const raw = Array.isArray(manifest) ? manifest : Array.isArray(manifest.vehicles) ? manifest.vehicles : [];
      const list = raw.map(normalizeVehicle).filter((vehicle) => vehicle && vehicle.file);
      if (list.length < 3) throw new Error('Construction manifest has too few vehicles.');
      if (!MISSIONS.some((mission) => list.some((vehicle) => mission.answerIds.includes(vehicle.id)))) {
        throw new Error('Construction manifest has no supported mission vehicle.');
      }
      return list;
    } catch (error) {
      return FALLBACK_VEHICLES.map(normalizeVehicle).filter((vehicle) => vehicle && vehicle.file);
    }
  }

  function pickMissions() {
    const availableVehicleIds = new Set(state.vehicles.map((vehicle) => vehicle.id));
    const possible = MISSIONS.filter((mission) => mission.answerIds.some((id) => availableVehicleIds.has(id)));
    return shuffle(possible).slice(0, TOTAL_ROUNDS);
  }

  function getVehicleById(id) {
    return state.vehicles.find((vehicle) => vehicle.id === id) || null;
  }

  function getAnswerVehicle(mission) {
    const answers = state.vehicles.filter((vehicle) => mission.answerIds.includes(vehicle.id));
    return shuffle(answers)[0] || null;
  }

  function makeChoices(mission) {
    const answer = getAnswerVehicle(mission);
    if (!answer) return [];

    const answerIds = new Set(mission.answerIds);
    const safeWrongIds = new Set(SAFE_DISTRACTOR_IDS[mission.id] || []);
    const wrong = shuffle(state.vehicles.filter((vehicle) => !answerIds.has(vehicle.id) && safeWrongIds.has(vehicle.id)));
    const otherAnswers = state.vehicles.filter((vehicle) => vehicle.id !== answer.id && answerIds.has(vehicle.id));
    const choices = wrong.length ? [answer, wrong[0]] : [answer];
    const alternatives = shuffle([...otherAnswers, ...wrong.slice(1)]);
    // More than one displayed vehicle may be right; handleChoice accepts all.
    // A small catalog gets fewer choices, never an arbitrary false distractor.
    return shuffle([...choices, ...alternatives.slice(0, 3 - choices.length)]);
  }

  function projectById(id) { return PROJECTS.find((project) => project.id === id) || null; }

  function projectAvailable(project) {
    return project.steps.every((step) => MISSIONS.find((mission) => mission.id === step.id)
      .answerIds.some((id) => state.vehicles.some((vehicle) => vehicle.id === id)));
  }

  function sceneSvg(id, progress, playing = false) {
    const n = Math.max(0, Math.min(3, progress));
    let scene = '', actor = '';
    const tree = (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 25v42" stroke="#975b35" stroke-width="12" stroke-linecap="round"/><circle cy="10" r="35" fill="#3fac68"/><circle cx="-16" cy="1" r="25" fill="#62cb7b"/></g>`;
    if (id === 'playground') {
      scene = `${tree(82,128)}${tree(560,125)}
        <g aria-label="이미 있는 놀이터"><path d="M335 203V114h42v89M335 131h42M335 151h42M335 171h42" fill="none" stroke="#73549d" stroke-width="9" stroke-linecap="round"/><path d="M371 115q3 58 80 90h28q-80-50-81-90" fill="#ffcf4c" stroke="#dd8b2c" stroke-width="5"/><path d="M168 200l24-104 28 104m-26-102h90l27 102" fill="none" stroke="#ef805b" stroke-width="9" stroke-linecap="round"/><path d="M222 102v67m38-67v67" stroke="#706251" stroke-width="4"/><rect x="216" y="165" width="52" height="12" rx="6" fill="#8c63ab"/></g>
        <path d="M84 383q39-124 218-147l97-11 20 46-112 12q-117 22-161 100" fill="${n >= 1 ? '#d7b77d' : '#bb8957'}" stroke="#fff1c7" stroke-width="6"/>
        ${n < 1 ? '<g data-piece="soil-pile" fill="#9c6b42"><path d="M155 324q50-97 102-14z"/><path d="M272 274q45-65 83-15z"/></g>' : '<g data-piece="cleared-path" stroke="#c49c65" stroke-width="5"><path d="M140 335l81-38m30-28 103-27"/></g>'}
        ${n >= 2 && n < 3 ? '<g data-piece="loaded-sand"><rect x="418" y="280" width="116" height="51" rx="12" fill="#f6bd4c" stroke="#bd7c28" stroke-width="5"/><path d="M425 287q49-57 102 0" fill="#f5d99b"/><circle cx="441" cy="337" r="12" fill="#50606b"/><circle cx="511" cy="337" r="12" fill="#50606b"/></g>' : ''}
        ${n >= 3 ? '<g data-piece="finished-path"><path d="M98 383q41-118 213-139l88-10 14 29-107 12q-123 22-173 108" fill="#f5d99b"/><path d="M145 344l26-25m34-22 31-14m43-20 33-8m36-7 29-5" stroke="#e0bc77" stroke-width="8" stroke-linecap="round"/></g>' : ''}`;
      actor = '<g class="cs-scene-actor cs-walker" aria-label="길을 걷는 아이"><circle cx="144" cy="305" r="14" fill="#ffd0a1"/><path d="M133 325h22l2 24h-26z" fill="#ed6963"/><path d="M136 349l-6 17m21-17 7 16" stroke="#394b72" stroke-width="7" stroke-linecap="round"/><path d="M134 332l-12 10m32-10 12-9" stroke="#ffd0a1" stroke-width="7" stroke-linecap="round"/></g>';
    } else if (id === 'station') {
      scene = `${tree(70,132)}
        <g aria-label="이미 있는 소방서"><rect x="266" y="98" width="284" height="149" rx="12" fill="#fff3d9" stroke="#c96348" stroke-width="7"/><path d="M247 111l24-38h271l27 38z" fill="#dc6457"/><rect x="289" y="136" width="56" height="46" rx="7" fill="#8ed1e1" stroke="#fff" stroke-width="6"/><rect x="368" y="141" width="136" height="106" rx="8" fill="#526f83"/><path d="M370 158h132m-132 20h132m-132 20h132m-132 20h132" stroke="#91a8b7" stroke-width="5"/><rect x="353" y="82" width="117" height="32" rx="9" fill="#fff"/><path d="M406 86v25m-13-12h26" stroke="#dd6258" stroke-width="8" stroke-linecap="round"/></g>
        <path d="M244 254h326l40 118H189z" fill="${n >= 3 ? '#b7c4c9' : n >= 1 ? '#96714c' : '#cfaa74'}" stroke="${n >= 1 ? '#ece2cd' : '#b98d59'}" stroke-width="8"/>
        ${n >= 1 && n < 3 ? '<path data-piece="shallow-apron-space" d="M247 264h315l27 89H212z" fill="#815e40"/><path d="M220 348l26-76m25 68 18-65m259 65-17-65" stroke="#a17e54" stroke-width="5"/>' : ''}
        ${n >= 2 && n < 3 ? '<g data-piece="mixed-concrete"><path d="M49 272h118l-13 71H62z" fill="#fac04c" stroke="#b98036" stroke-width="5"/><ellipse cx="108" cy="272" rx="58" ry="17" fill="#aebabe" stroke="#e2ecec" stroke-width="5"/><path d="M88 270q18-17 40 0t-36 6" fill="none" stroke="#7d919b" stroke-width="4"/></g>' : ''}
        ${n >= 3 ? '<g data-piece="finished-apron"><path d="M272 279l-18 67h87m125 0h89l-21-67" fill="none" stroke="#ffe68a" stroke-width="7"/><path d="M393 277v68" stroke="#eff6f6" stroke-width="5" stroke-dasharray="13 12"/></g>' : ''}`;
      actor = '<g class="cs-scene-actor cs-fire-engine" aria-label="앞마당을 지나는 소방차"><image href="./assets/vehicles/fire/pump_engine.png" x="352" y="180" width="171" height="151" preserveAspectRatio="xMidYMid meet"/></g>';
    } else {
      scene = `${tree(67,112)}${tree(570,126)}
        <path d="M255 170q-30 63-65 109t-52 121h366q-38-72-94-118t-63-112" fill="#76cae2"/>
        <path d="M262 191q-37 75-55 100m94-98q-20 80 38 154m8-123q23 55 75 101" fill="none" stroke="#beeaf3" stroke-width="10" stroke-linecap="round"/>
        <path d="M0 288h196m237 0h207" stroke="#ddc391" stroke-width="70"/>
        <g data-piece="low-supports" fill="#9ba8a9" stroke="#6e858c" stroke-width="4"><rect x="178" y="264" width="52" height="38" rx="5"/><rect x="404" y="264" width="52" height="38" rx="5"/></g>
        ${n < 1 ? '<g data-piece="soil-over-supports" fill="#a67b51"><path d="M161 301q42-59 83 0z"/><path d="M389 301q43-59 84 0z"/></g>' : ''}
        ${n >= 2 && n < 3 ? '<g data-piece="small-bridge-pieces" fill="#e7bd72" stroke="#a57a44" stroke-width="4"><rect x="47" y="322" width="91" height="19" rx="3"/><rect x="57" y="344" width="91" height="19" rx="3"/><rect x="466" y="323" width="91" height="19" rx="3"/></g>' : ''}
        ${n >= 3 ? '<g data-piece="joined-low-bridge"><rect x="178" y="245" width="278" height="27" rx="5" fill="#e7bd72" stroke="#a57a44" stroke-width="5"/><path d="M234 247v22m55-22v22m55-22v22m55-22v22" stroke="#b88c50" stroke-width="4"/><path d="M182 246v-31m69 31v-31m69 31v-31m69 31v-31m63 31v-31m-270 8h270" stroke="#db9970" stroke-width="6" stroke-linecap="round"/></g>' : ''}`;
      actor = '<g class="cs-scene-actor cs-bridge-car" aria-label="낮은 다리를 건너는 차"><rect x="70" y="205" width="85" height="35" rx="10" fill="#f1ad44" stroke="#fff3cb" stroke-width="4"/><path d="M88 207l13-23h30l14 23" fill="#77c7e0" stroke="#fff3cb" stroke-width="4"/><circle cx="89" cy="242" r="12" fill="#47576d"/><circle cx="140" cy="242" r="12" fill="#47576d"/></g>';
    }
    const project = projectById(id);
    return `<svg class="cs-scene-svg ${playing ? 'is-playing' : ''}" viewBox="0 0 640 400" role="img" aria-label="${escapeAttr(project?.title || '')}, ${n}단계 완료" data-progress="${n}">
      <rect width="640" height="400" rx="28" fill="#d9f3ff"/><circle cx="540" cy="60" r="29" fill="#ffd573"/><path d="M0 215q105-62 219-4t232-7 189 9v187H0z" fill="#a1d996"/>
      <path d="M75 64h65m285-5h54" stroke="#fff" stroke-width="22" stroke-linecap="round"/><path d="M0 313q133-41 287 4t353-3v86H0" fill="#90ca82"/>
      ${scene}${n >= 3 ? actor : ''}
      ${state.workPhase === 'working' && state.projectId === id ? '<g class="cs-work-spark" fill="#fff1ba"><circle cx="270" cy="300" r="16"/><circle cx="320" cy="277" r="11"/><circle cx="360" cy="306" r="15"/></g>' : ''}
    </svg>`;
  }

  function showProjectChooser() {
    if (!state.container || state.destroyed) return;
    clearTimers(); stopSpeech(); state.roundToken += 1;
    state.mode = 'chooser'; state.projectId = null; state.currentMission = null;
    state.selectedVehicle = null; state.workPhase = 'choose'; state.locked = false;
    state.container.innerHTML = `<div class="cs-root ${getRootLayoutClass()} cs-project-picker">
      <div class="cs-picker-heading"><h2>어디를 만들어 볼까?</h2><button class="cs-btn" data-action="listen-projects" aria-label="현장 안내 다시 듣기">🔊</button></div>
      <div class="cs-project-cards">${PROJECTS.map((project) => `<button class="cs-project-card" data-project="${project.id}" ${projectAvailable(project) ? '' : 'disabled'}>
        <span class="cs-project-thumb">${sceneSvg(project.id, 3)}</span><span class="cs-project-name">${project.icon} ${project.title}</span><span class="cs-project-small">${projectAvailable(project) ? '세 가지 일을 함께 해요' : '필요한 차를 준비하고 있어요'}</span>
      </button>`).join('')}</div>
      <div class="cs-picker-footer"><button class="cs-btn" data-action="practice">🚜 공사차 연습</button><span>그림을 고르고 직접 뚝딱!</span></div>
    </div>`;
    state.container.querySelectorAll('[data-project]').forEach((button) => button.addEventListener('click', () => beginProject(button.dataset.project)));
    state.container.querySelector('[data-action="practice"]')?.addEventListener('click', () => beginProject(null));
    state.container.querySelector('[data-action="listen-projects"]')?.addEventListener('click', announceProjects);
    announceProjects();
  }

  function announceProjects() {
    speak('놀이터 길, 소방서 앞마당, 작은 다리. 어디를 만들어 볼까?', true,
      'A playground path, a fire station apron, or a small bridge. What shall we make?');
  }

  function beginProject(id) {
    const project = id ? projectById(id) : null;
    if (id && (!project || !projectAvailable(project))) return false;
    clearTimers(); stopSpeech(); state.roundToken += 1;
    state.mode = project ? 'project' : 'practice'; state.projectId = project?.id || null;
    state.currentRound = 1; state.completedVehicles = []; state.completedSteps = [];
    state.selectedVehicle = null; state.scenePlaying = false; state.scenePlayCount = 0;
    state.successRewardGiven = false; state.completeRewardGiven = false;
    state.missions = project ? project.steps.map((step) => ({...MISSIONS.find((mission) => mission.id === step.id),
      title: step.title, question: step.question, englishQuestion: step.en, workAction: step.action,
      englishAction: step.actionEn, successText: step.result, englishSuccess: step.resultEn, stepLabel: step.label})) : pickMissions();
    startRound(); return true;
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();

    state.container = container;
    state.options = options || {};
    state.destroyed = false;
    state.locked = false;
    state.currentRound = 1;
    state.currentMission = null;
    state.currentChoices = [];
    state.completedVehicles = [];
    state.layoutMode = getLayoutMode();
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    state.mode = 'chooser'; state.projectId = null; state.completedSteps = [];
    state.selectedVehicle = null; state.workPhase = 'choose';
    state.scenePlaying = false; state.scenePlayCount = 0;
    bindResizeEvents();
    const session = state.session;

    container.innerHTML = `
      <div class="cs-loading">
        <div>🏗️<br>공사장을 준비하고 있어요!</div>
      </div>
    `;

    fetchConstructionVehicles().then((vehicles) => {
      if (state.destroyed || state.session !== session || state.container !== container) return;
      state.vehicles = vehicles;
      showProjectChooser();
    }).catch(() => {
      if (!state.container || state.destroyed || state.session !== session || state.container !== container) return;
      state.container.innerHTML = `<div class="cs-error"><div>공사차를 불러오지 못했어요.</div></div>`;
    });
  }

  function startRound() {
    if (!state.container || state.destroyed) return;
    clearTimers(); stopSpeech(); state.roundToken += 1;
    state.locked = false;

    if (state.currentRound > state.missions.length) {
      showCompleteScreen();
      return;
    }

    state.currentMission = state.missions[state.currentRound - 1];
    state.currentChoices = makeChoices(state.currentMission);
    state.successRewardGiven = false;
    state.selectedVehicle = null; state.workPhase = 'choose'; state.workMode = null;

    renderGame();
    speakMission();
  }

  function speakMission() {
    const mission = state.currentMission;
    if (!mission) return;
    state.container?.querySelector('.cs-question-card')?.classList.remove('has-feedback');
    const english = mission.englishQuestion || `We need a vehicle that can ${MISSION_GUIDES[mission.id][1]}. Which one can help?`;
    speak(mission.question, true, english);
  }

  function renderGame() {
    const mission = state.currentMission;
    if (!mission) return;
    const project = projectById(state.projectId);

    state.container.innerHTML = `
      <div class="cs-root ${getRootLayoutClass()} ${project ? 'cs-project-game' : ''} ${escapeAttr(mission.stageClass || '')}" data-phase="choose" data-project-id="${project?.id || 'practice'}">
        <div class="cs-top">
          <div class="cs-pill">${project ? `${project.icon} ${escapeHtml(project.short)}` : `🏗️ ${state.currentRound}번 공사`}</div>
          <div class="cs-actions">
            <button class="cs-btn" type="button" data-action="projects" aria-label="현장 고르기">현장</button>
            <button class="cs-btn" type="button" data-action="restart">다시</button>
          </div>
        </div>

        <div class="cs-progress">
          ${state.missions.map((_, index) => `
            <span class="cs-dot ${index + 1 < state.currentRound ? 'done' : index + 1 === state.currentRound ? 'active' : ''}"></span>
          `).join('')}
          ${project ? `<span class="cs-step-label">${state.currentRound}/3 · ${escapeHtml(mission.stepLabel)}</span>` : ''}
        </div>

        <div class="cs-question-card">
          <div class="cs-title">${escapeHtml(mission.title)}</div>
          <div class="cs-question">${escapeHtml(mission.question)}</div>
          ${project ? '<div class="cs-message" id="csMessage" role="status"></div>' : ''}
          <button class="cs-btn" type="button" data-action="listen" aria-label="주문 다시 듣기">🔊</button>
        </div>

        <div class="cs-stage" aria-label="공사장">
          ${project ? `<div class="cs-project-scene" id="csProjectScene">${sceneSvg(project.id, state.completedSteps.length)}</div>` : `
          <div class="cs-stage-sky-shine"></div>
          ${mission.workLabel ? `<div class="cs-site-board">🚧 ${escapeHtml(mission.workLabel)}</div>` : ''}
          <div class="cs-sun"></div>
          <div class="cs-ground"></div>
          <div class="cs-road"></div>

          <div class="cs-target-zone">
            <div class="cs-target-icon">${escapeHtml(mission.targetIcon)}</div>
          </div>
          <div class="cs-result-icon">${escapeHtml(mission.resultIcon)}</div>
          <div class="cs-dust">
            <span></span><span></span><span></span><span></span>
          </div>
          `}
          <div class="cs-worker-vehicle" id="csWorkerVehicle"></div>
        </div>

        <div class="cs-choices">
          ${state.currentChoices.map((vehicle) => `
            <button class="cs-choice" type="button" data-id="${escapeAttr(vehicle.id)}" aria-label="${escapeAttr(vehicle.name)}">
              <span class="cs-choice-img-wrap">
                <img class="cs-choice-img" src="./${escapeAttr(vehicle.file)}" alt="${escapeAttr(vehicle.name)}" draggable="false">
                <span class="cs-choice-emoji" hidden>🚜</span>
              </span>
              <span class="cs-choice-name">${escapeHtml(vehicle.name)}</span>
            </button>
          `).join('')}
        </div>

        <div class="cs-work-panel" id="csWorkPanel" hidden></div>
        ${project ? '' : '<div class="cs-message" id="csMessage" role="status"></div>'}
      </div>
    `;
    bindEvents();
  }

  function bindEvents() {
    const root = state.container;
    if (!root) return;

    root.querySelector('[data-action="restart"]')?.addEventListener('click', restartGame);
    root.querySelector('[data-action="projects"]')?.addEventListener('click', showProjectChooser);
    root.querySelector('[data-action="listen"]')?.addEventListener('click', speakMission);
    root.querySelector('[data-action="home"]')?.addEventListener('click', () => {
      state.options.closeToParkHome?.();
    });

    root.querySelectorAll('.cs-choice').forEach((button) => {
      button.addEventListener('click', () => handleChoice(button.dataset.id, button));
    });

    root.querySelectorAll('.cs-choice-img').forEach((img) => {
      window.SihyeonVehicleDisplay?.apply(img);
      img.addEventListener('error', () => {
        window.SihyeonVehicleDisplay?.reset(img);
        img.hidden = true;
        const fallback = img.parentElement?.querySelector('.cs-choice-emoji');
        if (fallback) fallback.hidden = false;
      });
    });
  }

  function handleChoice(vehicleId, button) {
    if (state.locked || !state.currentMission) return;

    const mission = state.currentMission;
    const selectedVehicle = getVehicleById(vehicleId);
    if (!selectedVehicle || !state.currentChoices.some((vehicle) => vehicle.id === vehicleId)) return;
    const isCorrect = mission.answerIds.includes(vehicleId);

    if (!isCorrect) {
      const explanation = wrongExplanation(selectedVehicle, mission);
      button.classList.add('is-wrong');
      vibrate(50);
      showMessage(explanation.ko);
      speak(explanation.ko, true, explanation.en);

      setManagedTimeout(() => {
        button.classList.remove('is-wrong');
      }, 520);
      return;
    }

    state.locked = true;
    state.container?.querySelector('.cs-question-card')?.classList.remove('has-feedback');
    state.selectedVehicle = selectedVehicle;
    state.workPhase = 'selected';
    button.classList.add('is-correct');
    rootDisableChoices();
    
    // 정답 차량 기록 (피날레용)
    state.completedVehicles.push(selectedVehicle);

    stopSpeech(); vibrate(70);
    
    // ★ "아 알겠다!" 시간을 위한 여유 0.4초 대기 후 애니메이션 재생
    setManagedTimeout(() => {
      runWorkAnimation(selectedVehicle);
    }, 400);
  }

  function rootDisableChoices() {
    state.container?.querySelectorAll('.cs-choice').forEach((el) => {
      el.classList.add('is-disabled');
      el.disabled = true;
    });
  }

  function runWorkAnimation(vehicle) {
    const root = state.container?.querySelector('.cs-root');
    const worker = state.container?.querySelector('#csWorkerVehicle');
    const mission = state.currentMission;
    if (!root || !worker || !mission || !vehicle || state.workPhase !== 'selected') return;

    worker.innerHTML = `
      <img src="./${escapeAttr(vehicle.file)}" alt="${escapeAttr(vehicle.name)}" draggable="false">
      <span class="cs-worker-fallback" hidden>🚜</span>
    `;

    const img = worker.querySelector('img');
    window.SihyeonVehicleDisplay?.apply(img);
    img?.addEventListener('error', () => {
      window.SihyeonVehicleDisplay?.reset(img);
      img.hidden = true;
      const fallback = worker.querySelector('.cs-worker-fallback');
      if (fallback) fallback.hidden = false;
    });

    state.workPhase = 'ready'; root.dataset.phase = 'ready'; root.classList.add('cs-ready');
    const tray = state.container.querySelector('.cs-choices'); if (tray) tray.hidden = true;
    renderWorkPanel();
    speak(`${vehicle.name}${getSubjectParticle(vehicle.name)} 이 일을 할 수 있어. 큰 버튼을 눌러 함께 해 보자.`, true,
      `${englishVehicleName(vehicle)} can do this job. Tap the big button to help, or choose watch.`);
  }

  function englishVehicleName(vehicle) {
    return window.SihyeonVoiceLabels?.entry?.('vehicle', vehicle.id)?.en || 'This machine';
  }

  function wrongExplanation(vehicle, mission) {
    const role = VEHICLE_ROLES[vehicle.id];
    const need = MISSION_GUIDES[mission.id];
    return {
      ko: `괜찮아. ${vehicle.name}${getSubjectParticle(vehicle.name)} ${role ? role[0] : '다른 일을 도와요.'} 지금은 ${need[0]} 차를 찾아보자.`,
      en: `${englishVehicleName(vehicle)} ${role ? role[1] : 'helps with another job'}. We need a vehicle that can ${need[1]}. Try another one.`
    };
  }

  function renderWorkPanel() {
    const panel = state.container?.querySelector('#csWorkPanel'), mission = state.currentMission;
    if (!panel || !mission) return;
    panel.hidden = false;
    const label = mission.workAction || MISSION_GUIDES[mission.id][2];
    if (state.workPhase === 'ready') {
      panel.innerHTML = `<p class="cs-work-status">직접 해 볼까?</p><div class="cs-work-buttons"><button class="cs-btn cs-primary" data-action="work">👆 ${escapeHtml(label)}</button><button class="cs-btn" data-action="auto-work">▶ 자동으로 보기</button></div>`;
      panel.querySelector('[data-action="work"]')?.addEventListener('click', () => performWork(false));
      panel.querySelector('[data-action="auto-work"]')?.addEventListener('click', () => performWork(true));
    } else if (state.workPhase === 'working') {
      panel.innerHTML = `<p class="cs-work-status">${escapeHtml(label)} 중이에요</p><div class="cs-work-buttons"><button class="cs-btn" disabled>🚧 함께 만드는 중</button></div>`;
    } else if (state.workPhase === 'result') {
      panel.innerHTML = `<p class="cs-work-status" role="status">${escapeHtml(mission.successText)}</p><div class="cs-work-buttons"><button class="cs-btn cs-primary" data-action="next-work">${state.currentRound === state.missions.length ? '🏁 완성한 곳에서 놀기' : '➡ 다음 공사'}</button><button class="cs-btn" data-action="listen-result" aria-label="결과 다시 듣기">🔊 다시 듣기</button></div>`;
      panel.querySelector('[data-action="next-work"]')?.addEventListener('click', nextWork);
      panel.querySelector('[data-action="listen-result"]')?.addEventListener('click', speakResult);
    }
  }

  function updateProjectScene() {
    const scene = state.container?.querySelector('#csProjectScene');
    if (scene && state.projectId) scene.innerHTML = sceneSvg(state.projectId, state.completedSteps.length, state.scenePlaying);
  }

  function performWork(automatic) {
    if (state.destroyed || state.workPhase !== 'ready' || !state.selectedVehicle) return false;
    stopSpeech(); state.workPhase = 'working'; state.workMode = automatic ? 'auto' : 'tap';
    const root = state.container?.querySelector('.cs-root');
    if (root) { root.dataset.phase = 'working'; root.dataset.workMode = state.workMode; root.classList.remove('cs-ready'); root.classList.add('is-working'); }
    renderWorkPanel(); updateProjectScene();
    const mission = state.currentMission;
    speak(mission.workAction || MISSION_GUIDES[mission.id][2], true, mission.englishAction || MISSION_GUIDES[mission.id][3]);
    setManagedTimeout(finishWork, 900);
    return true;
  }

  function finishWork() {
    if (state.destroyed || state.workPhase !== 'working' || !state.currentMission) return false;
    state.workPhase = 'result';
    if (!state.completedSteps.includes(state.currentRound)) state.completedSteps.push(state.currentRound);
    const root = state.container?.querySelector('.cs-root');
    if (root) { root.dataset.phase = 'result'; root.classList.remove('is-working'); root.classList.add('is-success', 'cs-result-held'); }
    updateProjectScene(); renderWorkPanel();
    const vehicle = state.selectedVehicle;
    const ending = getSubjectParticle(vehicle.name) === '은' ? '이야' : '야';
    showMessage(`우와! 시현이가 고른 ${vehicle.name}${ending}! ${state.currentMission.successText}`);
    speakResult();
    if (!state.successRewardGiven) { state.successRewardGiven = true; reward(10); }
    return true;
  }

  function speakResult() {
    const mission = state.currentMission;
    if (!mission) return;
    speak(mission.successText, true, mission.englishSuccess || `The machine helped us ${MISSION_GUIDES[mission.id][1]}. The job is done.`);
  }

  function nextWork() {
    if (state.destroyed || state.workPhase !== 'result') return false;
    state.workPhase = 'transition'; state.currentRound += 1; startRound(); return true;
  }

  function getSubjectParticle(text) {
    const last = String(text || '').trim().slice(-1);
    if (!last) return '는';
    const code = last.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return '는';
    return (code - 0xac00) % 28 === 0 ? '는' : '은';
  }

  function buildVehicleWrongText(vehicle, text) {
    if (!vehicle?.name) return text;
    const subject = `${vehicle.name}${getSubjectParticle(vehicle.name)}`;
    if (text.startsWith('이 차는')) return subject + text.slice('이 차는'.length);
    return `${subject} ${text}`;
  }

  function showMessage(text) {
    const message = state.container?.querySelector('#csMessage');
    if (!message) return;
    if (state.projectId && state.workPhase === 'choose') state.container.querySelector('.cs-question-card')?.classList.add('has-feedback');
    message.textContent = text;
    message.classList.remove('show');
    void message.offsetWidth;
    message.classList.add('show');
  }

  function showCompleteScreen() {
    if (!state.container || state.destroyed) return;

    clearTimers();
    state.locked = true;
    state.workPhase = 'complete';

    if (!state.completeRewardGiven) {
      state.completeRewardGiven = true;
      reward(30);
      speak(state.projectId ? '세 가지 일을 함께 했어. 완성한 곳에서 놀아 보자!' : '세 가지 공사차 연습을 마쳤어!', true,
        state.projectId ? 'We did three jobs together. Let us play in the place we prepared!' : 'We finished our three construction jobs!');
    }

    const project = projectById(state.projectId);
    if (project) {
      state.container.innerHTML = `<div class="cs-root ${getRootLayoutClass()} cs-project-game cs-project-complete is-complete" data-phase="complete" data-project-id="${project.id}">
        <div class="cs-top"><div class="cs-pill">${project.icon} ${escapeHtml(project.short)} 완성!</div><div class="cs-actions"><button class="cs-btn" data-action="projects">현장</button><button class="cs-btn" data-action="restart-complete">다시</button></div></div>
        <div class="cs-stage" aria-label="완성한 현장"><div class="cs-project-scene" id="csProjectScene">${sceneSvg(project.id, 3)}</div></div>
        <div class="cs-work-panel"><p class="cs-work-status" role="status">우리가 준비한 곳에서 놀아요.</p><div class="cs-work-buttons">
          <button class="cs-btn cs-primary" data-action="play-scene">${escapeHtml(project.play)}</button>
          <button class="cs-btn" data-action="projects">🏗️ 다른 현장</button><button class="cs-btn" data-action="home-complete">🏠 놀이터</button>
        </div></div></div>`;
      state.container.querySelector('[data-action="play-scene"]')?.addEventListener('click', playCompletedScene);
      state.container.querySelectorAll('[data-action="projects"]').forEach((button) => button.addEventListener('click', showProjectChooser));
      state.container.querySelector('[data-action="restart-complete"]')?.addEventListener('click', restartGame);
      state.container.querySelector('[data-action="home-complete"]')?.addEventListener('click', () => state.options.closeToParkHome?.());
      return;
    }

    // ★ 피날레 뷰: 시현이가 고른 3대의 차를 나란히 배치
    const finaleImages = state.completedVehicles.map((v) => 
      `<span class="cs-finale-vehicle"><img src="./${escapeAttr(v.file)}" alt="${escapeAttr(v.name)}"><span hidden>🚜</span></span>`
    ).join('');

    state.container.innerHTML = `
      <div class="cs-root ${getRootLayoutClass()} is-complete">
        <div class="cs-stage" style="flex:1; margin:12px;">
          <div class="cs-stage-sky-shine"></div>
          <div class="cs-site-board">🏁 멋지게 완성!</div>
          <div class="cs-sun"></div>
          <div class="cs-ground"></div>
          <div class="cs-road"></div>
          
          <div class="cs-finale-vehicles">
            ${finaleImages}
          </div>
        </div>

        <div class="cs-success-panel">
          <div class="cs-success-box">
            <div class="cs-success-icon">🏗️</div>
            <div class="cs-success-title">공사차 연습 완료!</div>
            <div class="cs-success-sub">세 가지 일을 함께 했어!</div>
            <div class="cs-success-actions">
              <button class="cs-btn" type="button" data-action="restart-complete">또 할래!</button>
              <button class="cs-btn" type="button" data-action="home-complete">놀이터</button>
            </div>
          </div>
        </div>
      </div>
    `;

    state.container.querySelectorAll('.cs-finale-vehicle img').forEach(img => {
      window.SihyeonVehicleDisplay?.apply(img);
      img.addEventListener('error', () => {
        window.SihyeonVehicleDisplay?.reset(img);
        img.hidden = true;
        if (img.nextElementSibling) img.nextElementSibling.hidden = false;
      });
    });
    state.container.querySelector('[data-action="restart-complete"]')?.addEventListener('click', restartGame);
    state.container.querySelector('[data-action="home-complete"]')?.addEventListener('click', () => {
      state.options.closeToParkHome?.();
    });
  }

  function playCompletedScene() {
    const project = projectById(state.projectId);
    if (!project || state.destroyed || state.workPhase !== 'complete' || state.scenePlaying) return false;
    state.scenePlaying = true; state.scenePlayCount += 1;
    const button = state.container?.querySelector('[data-action="play-scene"]'); if (button) button.disabled = true;
    updateProjectScene(); speak(project.play, true, project.playEn);
    setManagedTimeout(() => {
      state.scenePlaying = false;
      // Leave the actor where the animation ended until the child plays again.
      const activeButton = state.container?.querySelector('[data-action="play-scene"]'); if (activeButton) activeButton.disabled = false;
    }, 1750);
    return true;
  }

  function restartGame() {
    if (state.mode === 'chooser') showProjectChooser();
    else beginProject(state.projectId);
  }

  function destroy() {
    state.session += 1; state.roundToken += 1;
    clearTimers();
    stopSpeech();
    if (state.resizeTimer) {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }
    unbindResizeEvents();
    state.destroyed = true;
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();
    if (state.container) state.container.innerHTML = '';
    state.container = null;
    state.options = {};
    state.vehicles = [];
    state.missions = [];
    state.currentRound = 1;
    state.currentMission = null;
    state.currentChoices = [];
    state.completedVehicles = [];
    state.locked = false;
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    state.mode = 'chooser'; state.projectId = null; state.completedSteps = [];
    state.selectedVehicle = null; state.workPhase = 'choose'; state.workMode = null;
    state.scenePlayCount = 0; state.scenePlaying = false;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function escapeAttr(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
