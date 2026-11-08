/* Browser-only author verification. Run the fixture with ?autotest=1.
 * These are scripted DOM / Pointer Event and viewport checks, not physical-device QA. */
(async function () {
  'use strict';
  const game = () => window.SihyeonGames.patternTrain;
  const model = window.SihyeonPatternTrainModel;
  const root = document.querySelector('#train-fixture');
  const result = { scope: 'Author scripted browser/DOM/Pointer Event/iframe viewport verification; not physical touch, audible speech or production deployment verification', status: 'RUNNING', checks: [], startedAt: new Date().toISOString() };
  window.patternTrainBrowserQa = result;
  const prefix = 'sihyeon-pattern-train-v1:';
  const original = {};
  for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key.startsWith(prefix) || key === 'sihyeon-play-settings-v1') original[key] = localStorage.getItem(key); }
  const progress = document.createElement('div'); progress.style.cssText = 'position:fixed;left:3px;bottom:2px;font:9px system-ui;color:#345e4c;background:#fff9;pointer-events:none;z-index:1000'; document.body.appendChild(progress);
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  function assert(value, message) { if (!value) throw new Error(message); }
  function snapshot() { return game().getSnapshot(); }
  function button(selector) { const el = root.querySelector(selector); assert(el, 'Missing control ' + selector); return el; }
  function click(selector) { const el = button(selector); assert(!el.disabled, 'Disabled control ' + selector); el.click(); }
  function equalBoard(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  async function waitFor(predicate, message, ms) { const end = Date.now() + (ms || 12000); while (!predicate() && Date.now() < end) await pause(35); assert(predicate(), message); }
  async function check(name, fn) {
    progress.textContent = '자동 검수: ' + name;
    try { await fn(); result.checks.push({ name, status: 'PASS' }); }
    catch (error) { result.checks.push({ name, status: 'FAIL', error: String(error.message || error) }); }
  }
  async function pick(id, fresh) {
    game().destroy(); game().render(root, fixtureOptions);
    await pause(530);
    const task = model.taskFor(id);
    if (snapshot().modal) click('[data-action="close-modal"]');
    if (snapshot().state.phase === 'ARRIVED') click('[data-action="edit"]');
    click('[data-action="challenge"]'); click('[data-action="level"][data-level="' + task.age + '"]');
    click('[data-action="stop"][data-stop="' + model.getTasks(task.age).indexOf(task) + '"]');
    if (fresh !== false) { click('[data-action="restart"]'); click('[data-action="confirm-reset"]'); }
    assert(snapshot().taskId === id, 'Wrong task after route selection');
    await pause(350);
  }
  function choose(token) { click('[data-action="select"][data-token="' + token + '"]'); }
  function place(index, token) { choose(token); click('[data-action="seat"][data-index="' + index + '"]'); }
  function solve(task) {
    let answer;
    if (task.kind === 'unit') { click('[data-action="period"][data-period="' + model.minimalPeriod(snapshot().state.board) + '"]'); return; }
    if (task.seedSize) {
      const seed = task.kind === 'alternative' ? ['red', 'blue', 'red', 'blue'] : ['red', 'blue', 'red'];
      seed.forEach((token, index) => { choose(token); click('[data-action="seed"][data-seed="' + index + '"]'); });
      click('[data-action="copy"]'); return;
    }
    if (task.unit) answer = model.repeat(task.unit, task.size);
    else answer = model.candidateUnits(task.clues, task.palette, task.allowedPeriods)[0].board;
    answer.forEach((token, index) => { if (task.clues[index] === null) place(index, token); });
  }
  function pointer(target, type, x, y, extra) { target.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 51, pointerType: 'touch', isPrimary: true, button: 0, clientX: x, clientY: y }, extra || {}))); }
  function center(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  async function drag(source, target, ending) {
    if (target) target.scrollIntoView({ block: 'nearest', inline: 'center' });
    await pause(40);
    const a = center(source), b = target ? center(target) : { x: -30, y: -30 };
    pointer(source, 'pointerdown', a.x, a.y); pointer(window, 'pointermove', a.x + 12, a.y - 12); pointer(window, 'pointermove', b.x, b.y);
    if (ending === 'cancel') pointer(window, 'pointercancel', b.x, b.y);
    else if (ending === 'lost') pointer(root, 'lostpointercapture', b.x, b.y);
    else pointer(window, 'pointerup', b.x, b.y);
    await pause(30);
  }
  try {
    for (const age of [4, 5, 6, 7]) await check(age + '세 전체 5개 정거장: 조립 → 실제 운행 → 도착 → 다음 판', async () => {
      const tasks = model.getTasks(age); await pick(tasks[0].id);
      for (let i = 0; i < tasks.length; i++) {
        if (i) { click('[data-action="next"]'); click('[data-action="restart"]'); click('[data-action="confirm-reset"]'); }
        assert(snapshot().taskId === tasks[i].id, 'Next stop mismatch');
        solve(tasks[i]); click('[data-action="start"]');
        assert(snapshot().state.phase === 'RUNNING', 'Valid train did not depart: ' + tasks[i].id);
        const count = snapshot().state.departures; button('[data-action="start"]').click();
        assert(snapshot().state.departures === count, 'Duplicate departure');
        assert(root.querySelector('.pt-running .pt-train-row'), 'No actual moving train row');
        await waitFor(() => snapshot().state.phase === 'ARRIVED', 'Train did not arrive: ' + tasks[i].id);
      }
      click('[data-action="next"]'); assert(snapshot().modal === 'complete', 'No session completion choice'); click('[data-action="close-modal"]');
    });
    await check('오답 보존·수정·교체·꺼내기·되돌리기·연속 탭', async () => {
      await pick('a4-first'); place(5, 'cat'); click('[data-action="start"]');
      assert(snapshot().state.phase === 'BUILDING' && snapshot().state.board[5] === 'cat', 'Incorrect answer discarded or accepted');
      place(5, 'rabbit'); const count = snapshot().state.history.length;
      for (let i = 0; i < 12; i++) click('[data-action="seat"][data-index="5"]');
      assert(snapshot().state.history.length === count, 'Repeated tap duplicated a placement');
      click('[data-action="remove"][data-index="5"]'); assert(snapshot().state.board[5] === null, 'Remove failed');
      click('[data-action="undo"]'); assert(snapshot().state.board[5] === 'rabbit', 'Undo failed');
      click('[data-action="eraser"]'); click('[data-action="seat"][data-index="5"]'); assert(snapshot().state.board[5] === null, 'Eraser failed');
    });
    await check('실제 좌표 Pointer Event 드래그·한 번만 배치·빈 객차로 이동', async () => {
      await pick('a5-abb');
      await drag(button('[data-action="select"][data-token="square"]'), button('[data-action="seat"][data-index="4"]'));
      assert(snapshot().state.board[4] === 'square', 'Palette drop failed');
      assert(snapshot().state.selected === 'square' && button('[data-action="select"][data-token="square"]').getAttribute('aria-pressed') === 'true', 'Dragged part not reflected in selection');
      pointer(window, 'pointerup', 0, 0); assert(snapshot().state.history.length === 1, 'Duplicate pointerup committed twice');
      await pause(540);
      const frame = button('.pt-train-scroll'); frame.scrollLeft = 320;
      await drag(button('[data-action="seat"][data-index="4"]'), button('[data-action="seat"][data-index="5"]'));
      assert(snapshot().state.board[4] === null && snapshot().state.board[5] === 'square', 'Coach move failed');
    });
    for (const ending of ['outside', 'cancel', 'lost']) await check('드래그 ' + ending + ' 취소 시 원본과 undo 보존', async () => {
      await pick('a4-first'); const before = snapshot().state;
      await drag(button('[data-action="select"][data-token="rabbit"]'), ending === 'outside' ? null : button('[data-action="seat"][data-index="5"]'), ending);
      assert(equalBoard(snapshot().state.board, before.board), 'Cancelled drag changed board');
      assert(snapshot().state.history.length === before.history.length && !snapshot().dragging, 'Cancelled drag mutated history or left ghost');
      assert(!document.querySelector('.pt-drag-ghost'), 'Drag ghost leaked');
    });
    await check('두 번째 손가락 입력·긴 hold 이후 첫 손가락 복구', async () => {
      await pick('a4-first'); place(5, 'rabbit'); choose('cat');
      const source = button('[data-action="seat"][data-index="5"]'); source.scrollIntoView({ inline: 'center' }); await pause(40); const p = center(source);
      pointer(source, 'pointerdown', p.x, p.y); pointer(window, 'pointermove', p.x + 12, p.y - 12);
      pointer(root, 'pointerdown', 15, 15, { pointerId: 52, isPrimary: false }); await pause(850);
      pointer(window, 'pointerup', 15, 15, { pointerId: 52, isPrimary: false }); pointer(window, 'pointerup', p.x, p.y);
      source.click();
      assert(snapshot().state.board[5] === 'rabbit', 'Long multi-touch cancellation allowed delayed click');
      assert(!snapshot().dragging && !document.querySelector('.pt-drag-ghost'), 'Multi-touch ghost leaked');
    });
    await check('직접 만든 ABA 묶음 복제·그림 대응 오답 검증', async () => {
      await pick('a6-copy'); solve(model.taskFor('a6-copy'));
      assert(equalBoard(snapshot().state.board, ['red', 'blue', 'red', 'red', 'blue', 'red', 'red', 'blue', 'red']), 'Created ABA not actually copied');
      click('[data-action="seed"][data-seed="0"]'); click('[data-action="copy"]');
      await pick('a6-abac');
      assert(root.querySelectorAll('.pt-mappings > span').length === 3, 'Explicit mapping missing');
      for (let i = 0; i < 8; i++) place(i, 'cat'); click('[data-action="start"]');
      assert(snapshot().state.phase === 'BUILDING', 'Wrong mapping accepted');
    });
    await check('7세 여러 타당한 완성·같은 재료 다른 규칙', async () => {
      await pick('a7-ambiguous'); const task = model.taskFor('a7-ambiguous');
      const alternatives = [...new Map(model.candidateUnits(task.clues, task.palette, task.allowedPeriods).map(c => [c.board.join('|'), c.board])).values()];
      assert(alternatives.length === 4, 'Missing valid alternatives');
      for (const answer of alternatives) {
        answer.forEach((token, index) => { if (task.clues[index] === null) place(index, token); });
        click('[data-action="start"]'); assert(snapshot().state.phase === 'RUNNING', 'Valid alternative rejected');
        game().destroy(); game().render(root, fixtureOptions); await pause(550);
      }
      await pick('a7-alternative');
      ['red','red','blue','blue'].forEach((token,index) => {choose(token);click('[data-action="seed"][data-seed="' + index + '"]');}); click('[data-action="copy"]'); click('[data-action="start"]'); assert(snapshot().state.phase === 'BUILDING', 'Original structure accepted as different');
      solve(model.taskFor('a7-alternative')); click('[data-action="start"]'); assert(snapshot().state.phase === 'RUNNING', 'Different valid structure rejected');
    });
    await check('자유 공작: 불규칙 배열도 출발·테마별 작품·객차 길이', async () => {
      await pick('a4-first'); click('[data-action="free"]'); click('[data-action="theme"][data-theme="animal"]'); click('[data-action="restart"]'); click('[data-action="confirm-reset"]');
      const length = snapshot().state.size;
      for (let i = 0; i < length; i++) place(i, ['cat','bear','rabbit','rabbit','frog','cat'][i % 6]);
      click('[data-action="longer"]'); assert(snapshot().state.size === length + 1, 'Add carriage failed'); place(length, 'bear');
      click('[data-action="start"]'); assert(snapshot().state.phase === 'RUNNING' && snapshot().state.lastResult.graded === false, 'Free arrangement was graded');
      game().destroy(); game().render(root, fixtureOptions); await pause(550);
      const board = snapshot().state.board; click('[data-action="theme"][data-theme="shape"]'); click('[data-action="theme"][data-theme="animal"]'); assert(equalBoard(snapshot().state.board, board), 'Theme switch lost free board');
    });
    await check('추천 연령과 도전 분리·다른 놀이 이동 복귀·재시작 분리', async () => {
      await pick('a4-first'); click('[data-action="age"][data-age="4"]'); click('[data-action="challenge"]'); click('[data-action="level"][data-level="7"]');
      assert(snapshot().age === 4 && snapshot().level === 7, 'Challenge locked to age');
      await pick('a4-first'); place(5, 'rabbit'); click('[data-action="home"]'); document.querySelector('#return-to-train').click();
      assert(snapshot().state.board[5] === 'rabbit', 'Exit did not preserve board');
      click('[data-action="restart"]'); click('[data-action="close-modal"]'); assert(snapshot().state.board[5] === 'rabbit', 'Cancel reset lost board');
      click('[data-action="restart"]'); click('[data-action="confirm-reset"]'); assert(snapshot().state.board[5] === null, 'Current board reset failed');
    });
    await check('쓰기 실패·읽기 가능한 옛 저장보다 같은 탭 최신 메모리 우선', async () => {
      await pick('a4-first'); place(5, 'cat');
      const originalSet = Storage.prototype.setItem;
      try {
        Storage.prototype.setItem = function (key, value) { if (String(key).startsWith(prefix)) throw new DOMException('QA write rejected', 'QuotaExceededError'); return originalSet.call(this, key, value); };
        place(5, 'rabbit'); game().destroy(); game().render(root, fixtureOptions);
        assert(snapshot().state.board[5] === 'rabbit', 'Readable stale storage replaced latest memory'); assert(snapshot().saveFailed, 'Write failure not surfaced');
      } finally { Storage.prototype.setItem = originalSet; }
    });
    await check('음성 실패 시 시각 안내·런타임 이미지 요청 없이 SVG 조립', async () => {
      await pick('a4-first'); if (snapshot().muted) click('[data-action="mute"]'); click('[data-action="repeat"]'); await pause(60);
      assert(snapshot().voiceFailed && !button('.pt-voice-note').hidden, 'Voice failure lacks visual fallback');
      assert(root.querySelectorAll('.pt-stage svg').length >= 7 && root.querySelectorAll('img').length === 0, 'Core art depends on image network requests');
    });
    async function newFrame(width, height) {
      const frame = document.createElement('iframe'); frame.style.cssText = 'position:fixed;left:-3000px;top:0;border:0;width:' + width + 'px;height:' + height + 'px';
      const ready = new Promise((resolve, reject) => { frame.onload = resolve; frame.onerror = reject; });
      frame.src = './qa-pattern-train.html?age=4'; document.body.appendChild(frame); await ready; await pause(200); return frame;
    }
    await check('새 문서에서 저장 복원·손상 저장은 안전한 새 판', async () => {
      await pick('a4-first'); place(5, 'rabbit'); game().destroy();
      let frame = await newFrame(390, 844);
      assert(frame.contentWindow.SihyeonGames.patternTrain.getSnapshot().state.board[5] === 'rabbit', 'Fresh-document restoration failed'); frame.contentWindow.SihyeonGames.patternTrain.destroy(); frame.remove();
      localStorage.setItem(prefix + 'board:a4-first', JSON.stringify({ version: 1, taskId: 'a4-first', size: 4.5, phase: 'ARRIVED', board: ['cat'] }));
      frame = await newFrame(390, 844); assert(frame.contentWindow.SihyeonGames.patternTrain.getSnapshot().state.board[5] === null, 'Corrupt state was not rejected'); frame.contentWindow.SihyeonGames.patternTrain.destroy(); frame.remove();
      game().render(root, fixtureOptions);
    });
    for (const [width, height] of [[390,844],[844,390],[360,640],[768,1024],[1024,768],[1280,800]]) await check('실제 CSS iframe 뷰포트 ' + width + '×' + height + ': 주요 작업 영역 경계', async () => {
      const frame = await newFrame(width, height);
      try {
        const win = frame.contentWindow, doc = frame.contentDocument;
        const press = selector => { const el = doc.querySelector(selector); assert(el && !el.disabled, 'Viewport control missing: ' + selector); el.click(); };
        for (const taskId of ['a4-first','a6-abac','a7-alternative','a7-abacbc']) {
          const task = model.taskFor(taskId); press('[data-action="challenge"]'); press('[data-action="level"][data-level="' + task.age + '"]'); press('[data-action="stop"][data-stop="' + model.getTasks(task.age).indexOf(task) + '"]');
          if (win.SihyeonGames.patternTrain.getSnapshot().state.phase === 'ARRIVED') press('[data-action="edit"]');
          for (const name of ['.pt-top','.pt-mode-bar','.pt-guide','.pt-stage','.pt-palette','.pt-footer']) {
            const r = doc.querySelector(name).getBoundingClientRect();
            assert(r.left >= -1 && r.top >= -1 && r.right <= width + 1 && r.bottom <= height + 1, taskId + ' outside viewport: ' + name + ' ' + JSON.stringify({ left:r.left,top:r.top,right:r.right,bottom:r.bottom }));
          }
          const stage = doc.querySelector('.pt-stage').getBoundingClientRect(), seat = doc.querySelector('.pt-seat').getBoundingClientRect();
          assert(seat.top >= stage.top - 1 && seat.bottom <= stage.bottom + 1, 'Carriage vertically clipped: ' + taskId);
          const guide = doc.querySelector('.pt-guide').getBoundingClientRect();
          doc.querySelectorAll('.pt-guide-content > *').forEach(el => { const r=el.getBoundingClientRect(); assert(r.left >= guide.left-1 && r.right <= guide.right+1, 'Rule art clipped: ' + taskId); });
          assert(doc.documentElement.scrollWidth <= width, 'Page horizontally overflows');
        }
      } finally { frame.contentWindow.SihyeonGames.patternTrain.destroy(); frame.remove(); }
    });
  } finally {
    game().destroy();
    const remove = []; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key.startsWith(prefix) || key === 'sihyeon-play-settings-v1') remove.push(key); }
    remove.forEach(key => localStorage.removeItem(key)); Object.entries(original).forEach(([key,value]) => localStorage.setItem(key,value));
    result.status = result.checks.some(c => c.status === 'FAIL') ? 'FAIL' : 'PASS'; result.finishedAt = new Date().toISOString(); result.passed = result.checks.filter(c => c.status === 'PASS').length; result.failed = result.checks.length - result.passed;
    progress.remove(); const output = document.querySelector('#qa-results'); output.hidden = false; output.textContent = JSON.stringify(result, null, 2); document.title = result.status + ' · 패턴 기차 브라우저 검수';
  }
})();
