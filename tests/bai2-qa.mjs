import fs from 'node:fs/promises';

// Run with HTTP 8340 and a separate Chrome CDP session on 9340 (or override via QA_HTTP_PORT / QA_CDP_PORT).
await fs.mkdir('.preview', { recursive: true });
const httpPort = process.env.QA_HTTP_PORT || '8340';
const cdpPort = process.env.QA_CDP_PORT || '9340';
const base = `http://127.0.0.1:${httpPort}/`;
const tabs = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json();
const target = tabs.find(t => t.type === 'page' && t.url.startsWith(base)) || tabs.find(t => t.type === 'page');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

let id = 0;
const pending = new Map();
const runtimeErrors = [];
const consoleErrors = [];
const cdnWarnings = [];
const reports = [];
const metrics = {};

socket.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.id) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.reject(m.error) : p.resolve(m.result);
  } else if (m.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
  } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    const txt = m.params.entry.text || '';
    const url = m.params.entry.url || '';
    if (url.includes('cdn.jsdelivr.net') || txt.includes('cdn.jsdelivr.net')) {
      cdnWarnings.push(txt + ' (' + url + ')');
    } else {
      consoleErrors.push(txt + (url ? ' (' + url + ')' : ''));
    }
  }
};

function c(method, params = {}) {
  return new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    socket.send(JSON.stringify({ id: n, method, params }));
  });
}

async function e(expression) {
  const r = await c('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

async function check(condition, message) {
  if (!(await e(`(async () => (${condition}))()`))) throw Error('FAILED: ' + message);
  reports.push(message);
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function until(expression, limit = 150) {
  for (let i = 0; i < limit; i++) {
    try {
      if (await e(expression)) return;
    } catch {}
    await pause(80);
  }
  throw Error('Timeout: ' + expression);
}

async function nav(path) {
  await c('Page.navigate', { url: base + path });
  await until(`document.readyState === 'complete' && location.href.startsWith(${JSON.stringify(base + path)})`);
  await pause(120);
}

async function click(selector) {
  await check(
    `(() => { const b = document.querySelector(${JSON.stringify(selector)}); return !!b && !!b.getClientRects().length && !b.disabled; })()`,
    'Operable ' + selector
  );
  await e(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await pause(90);
}

async function fill(selector, value) {
  await e(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`
  );
}

async function dragElementTo(fromSel, toSel) {
  const coords = await e(`(() => {
    const a = document.querySelector(${JSON.stringify(fromSel)});
    const b = document.querySelector(${JSON.stringify(toSel)});
    if (!a || !b) return null;
    const ra0 = a.getBoundingClientRect();
    const rb0 = b.getBoundingClientRect();
    const topDoc = Math.min(ra0.top, rb0.top) + window.scrollY;
    window.scrollTo({ top: Math.max(0, topDoc - 40), behavior: 'instant' });
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return {
      fx: ra.left + ra.width / 2,
      fy: ra.top + ra.height / 2,
      tx: rb.left + rb.width / 2,
      ty: rb.top + Math.min(rb.height / 2, 90)
    };
  })()`);
  if (!coords) throw Error(`Missing drag element(s): ${fromSel} -> ${toSel}`);
  const { fx, fy, tx, ty } = coords;
  await c('Input.dispatchMouseEvent', { type: 'mousePressed', x: fx, y: fy, button: 'left', clickCount: 1 });
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const x = fx + ((tx - fx) * i) / steps;
    const y = fy + ((ty - fy) * i) / steps;
    await c('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
    await pause(18);
  }
  await c('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tx, y: ty, button: 'left', clickCount: 1 });
  await pause(120);
}

async function pressEscape() {
  await c('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await c('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await pause(60);
}

async function tapOutside(x = 6, y = 6) {
  await c('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await pause(60);
}

async function checkHintBubbleFits(contextLabel) {
  await check(
    `(() => {
      const b = document.querySelector('#hint-bubble');
      if (!b || b.hidden) return false;
      const r = b.getBoundingClientRect();
      return r.width > 40 && r.left >= 0 && r.right <= window.innerWidth && r.top >= 0 && r.bottom <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth;
    })()`,
    `${contextLabel}: Hint bubble fits cleanly inside viewport without horizontal overflow`
  );
}

async function screenshot(name) {
  const r = await c('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await fs.writeFile('.preview/' + name + '.png', Buffer.from(r.data, 'base64'));
}

async function clipboardDenied() {
  await e(`Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async () => { throw new Error('Denied for QA'); } })`);
}

async function clipboardRestore() {
  await e('delete navigator.clipboard.writeText');
}

try {
  await c('Page.enable');
  await c('Runtime.enable');
  await c('Log.enable');
  await c('Network.enable');
  await c('Network.setCacheDisabled', { cacheDisabled: true });
  await c('Page.bringToFront');
  await c('Emulation.setFocusEmulationEnabled', { enabled: true });
  await c('Browser.grantPermissions', { origin: base, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });

  for (const [label, width, height] of [
    ['desktop', 1366, 900],
    ['mobile', 390, 844]
  ]) {
    await c('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: label === 'mobile' });

    // 1. Course catalog -> Bai 2, Step 0 minimal words, 3D Mít, dataset gallery & Vietnamese MP3 voice
    await nav('khoa_hoc.html');
    await e("localStorage.removeItem('ai4.bai2.q4.v1')");
    await click('a[href="bai-2/index.html"]');
    await until("location.pathname.endsWith('bai-2/index.html') && document.readyState === 'complete'");
    await check("!!document.querySelector('a.course-link')", `${label}: Bai 2 has back-to-catalog link`);
    await check('document.documentElement.scrollWidth <= innerWidth', `${label}: Bai 2 Step 0 has no horizontal overflow`);
    await until("document.querySelector('#stage-loader').hidden", 250);
    await until("document.querySelectorAll('.dataset-chip[data-dataset]').length === 5", 150);
    await check("document.querySelector('#sceneFallback').style.display === 'none'", `${label}: 3D Mít model loaded and replaced 2D fallback`);
    await check("!document.querySelector('#view-left').disabled", `${label}: 3D view controls enabled`);
    await check('document.body.onclick === null', `${label}: document.body does not intercept clicks`);

    // Genuine Vietnamese MP3 playback on #speak-btn (never English David/Zira TTS)
    await check("!!document.querySelector('#speak-btn') && !document.querySelector('#speak-btn').hidden", `${label}: Speak button visible`);
    await click('#speak-btn');
    await check(
      "document.querySelector('#speak-btn').getAttribute('aria-pressed') === 'true' && window.__mitLastSpeech?.mode === 'audio' && window.__mitLastSpeech?.src.endsWith('audio/welcome.mp3')",
      `${label}: Speak button uses local Vietnamese audio MP3`
    );
    await check("(await fetch('audio/welcome.mp3')).status === 200", `${label}: Vietnamese MP3 audio file serves HTTP 200`);
    await click('#speak-btn');
    await check("document.querySelector('#speak-btn').getAttribute('aria-pressed') === 'false'", `${label}: Speak button toggles off`);

    const step0Words = await e("document.querySelector('main').innerText.trim().split(/\\s+/).filter(Boolean).length");
    metrics[`${label}Step0MainWords`] = step0Words;
    await check(`${step0Words} < 55`, `${label}: Step 0 main visible text is ultra-concise (${step0Words} words < 55)`);
    await check(
      "!/[🌱🧺🃏🎯🎁🔄📋✨🧹📌👩‍🏫🔎💡📷📁⚡🤖🔊🔇🗣️👍🤔✏️ⓘ⬇]/u.test(document.body.innerText)",
      `${label}: Bai 2 UI stripped decorative emoji spam`
    );

    await click('#view-left');
    await click('#view-reset');
    await pause(350);
    if (label === 'desktop') await screenshot('bai2-v3-step0');
    else await screenshot('bai2-v3-mobile');

    // Dataset switching on Step 0: recycle -> flowers
    await click('[data-dataset="recycle"]');
    await check(
      "document.querySelector('#name-0').value === 'Chai nhựa' && document.querySelector('#name-1').value === 'Lon nước' && document.querySelector('#speech').textContent.includes('Chai nhựa')",
      `${label}: Switching to recycle dataset fills Chai nhựa - Lon nước`
    );
    await click('[data-dataset="flowers"]');
    await check(
      "document.querySelector('#name-0').value === 'Hoa cúc' && document.querySelector('#name-1').value === 'Hoa hướng dương' && document.querySelector('#speech').textContent.includes('Hoa cúc')",
      `${label}: Switching back to flowers dataset fills Hoa cúc - Hoa hướng dương`
    );

    // 2. Step 1: Free Drag-and-Drop Sample Photo Pool (no dump-all button!)
    await click('#step0-next');
    await until("document.body.dataset.step === '1' && document.querySelectorAll('#sample-pool .pool-tile').length === 8", 250);
    await check("!document.querySelector('#quick-fill-rest')", `${label}: Dump-all button removed from Step 1`);
    await check('document.documentElement.scrollWidth <= innerWidth', `${label}: Step 1 has no horizontal overflow`);
    // Verify ? hint popover on Step 1 (click open, viewport fit, Escape close, outside-pointerdown close)
    await click('#sample-pool .hint-btn');
    await check(
      "document.querySelector('#sample-pool .hint-btn').getAttribute('aria-expanded') === 'true' && document.querySelector('#hint-bubble')?.textContent.includes('5–8 ảnh')",
      `${label}: Step 1 ? hint button opens diversity popover`
    );
    await checkHintBubbleFits(`${label} Step 1`);
    await pressEscape();
    await check(
      "document.querySelector('#hint-bubble').hidden && document.querySelector('#sample-pool .hint-btn').getAttribute('aria-expanded') === 'false'",
      `${label}: Escape closes Step 1 ? hint popover`
    );
    await click('#sample-pool .hint-btn');
    await tapOutside(4, 4);
    await check(
      "document.querySelector('#hint-bubble').hidden && document.querySelector('#sample-pool .hint-btn').getAttribute('aria-expanded') === 'false'",
      `${label}: Outside pointerdown closes Step 1 ? hint popover`
    );
    await pause(250);
    if (label === 'desktop') await screenshot('bai2-v3-step1-pool');

    const firstSrcBeforeShuffle = await e("document.querySelector('#sample-pool .pool-tile')?.dataset.src");
    await click('#pool-shuffle');
    const firstSrcAfterShuffle = await e("document.querySelector('#sample-pool .pool-tile')?.dataset.src");
    if (firstSrcBeforeShuffle === firstSrcAfterShuffle) {
      throw Error(`${label}: #pool-shuffle did not rotate visible pool photos`);
    }
    reports.push(`${label}: #pool-shuffle rotates sample pool photos`);

    // Wrong-tray hint: drag a class-1 tile into Khay A -> hints to click × -> remove it cleanly
    await dragElementTo('#sample-pool .pool-tile[data-cls="1"]', '#tray-0');
    await until("document.querySelectorAll('#tray-0 .photo').length === 1", 150);
    await check(
      "document.querySelector('#speech').textContent.includes('×') && document.querySelector('#step-status').textContent.includes('×')",
      `${label}: Wrong-tray drag shows clear undo (×) hint`
    );
    await click('#tray-0 [data-remove]');
    await until("document.querySelectorAll('#tray-0 .photo').length === 0", 120);

    // Drag 1 class-0 tile to #tray-0 and 1 class-1 tile to #tray-1 via real pointer events
    await dragElementTo('#sample-pool .pool-tile[data-cls="0"]', '#tray-0');
    await until("document.querySelectorAll('#tray-0 .photo').length === 1", 150);
    await dragElementTo('#sample-pool .pool-tile[data-cls="1"]', '#tray-1');
    await until("document.querySelectorAll('#tray-1 .photo').length === 1", 150);
    reports.push(`${label}: Pointer drag-and-drop moves chosen sample photos into Khay A and Khay B`);

    // Also verify tap quick-assign pills (← A / B →) for accessibility + add 2 more each -> 3 + 3
    for (let k = 0; k < 2; k++) {
      await click('#sample-pool .pool-tile[data-cls="0"]');
      await click('#sample-pool .pool-tile.is-selected [data-assign="0"]');
      await until(`document.querySelectorAll('#tray-0 .photo').length === ${2 + k}`, 150);

      await click('#sample-pool .pool-tile[data-cls="1"]');
      await click('#sample-pool .pool-tile.is-selected [data-assign="1"]');
      await until(`document.querySelectorAll('#tray-1 .photo').length === ${2 + k}`, 150);
    }

    // Remove 1 photo from Khay A -> disables #go-train -> re-add 1 photo -> enables #go-train
    await click('#tray-0 [data-remove]');
    await until("document.querySelectorAll('#tray-0 .photo').length === 2 && document.querySelector('#go-train').disabled", 120);
    await dragElementTo('#sample-pool .pool-tile[data-cls="0"]', '#tray-0');
    await until("document.querySelectorAll('#tray-0 .photo').length === 3 && !document.querySelector('#go-train').disabled", 150);
    reports.push(`${label}: Removing photo returns tray below 3 and re-adding enables Train`);

    await click('#go-train');
    await until("document.body.dataset.step === '2'", 100);
    await check('document.documentElement.scrollWidth <= innerWidth', `${label}: Step 2 has no horizontal overflow`);

    // 3. Step 2 Train -> Step 3 Drag-and-Drop Test Pool & X-Ray
    const hasTF = await e('!!window.tf && !!window.mobilenet');
    if (hasTF) {
      await click('#train-btn');
      await until("document.body.dataset.step === '3'", 550);
      await check("document.querySelector('.journey [data-step=\"2\"]').dataset.done === 'true'", `${label}: Step 2 marked done after training`);
      await check("!!document.querySelector('#test-dropzone') && document.querySelectorAll('#test-pool .test-tile').length === 6", `${label}: Step 3 shows dropzone and 6 test cards`);
      await check(
        "!!document.querySelector('#test-pool .test-tile.is-outside[data-outside=\"true\"]') && document.querySelector('#test-pool .test-tile.is-outside .outside-badge')?.textContent.trim() === 'Ảnh lạ'",
        `${label}: Test pool includes clean Ảnh lạ outside card`
      );

      const testFirstBefore = await e("document.querySelector('#test-pool .test-tile')?.dataset.src");
      await click('#test-pool-more');
      const testFirstAfter = await e("document.querySelector('#test-pool .test-tile')?.dataset.src");
      if (testFirstBefore === testFirstAfter) throw Error(`${label}: #test-pool-more did not rotate test pool`);
      reports.push(`${label}: #test-pool-more rotates unseen test images`);

      // Drag unseen test tile onto #test-dropzone
      await dragElementTo('#test-pool .test-tile[data-outside="false"]', '#test-dropzone');
      await until("!!document.querySelector('#test-station .prediction')", 200);
      await check("document.querySelectorAll('.neighbor-card').length === 3", `${label}: X-Ray renders 3 nearest neighbors in DOM`);
      await check("document.querySelectorAll('.vote-dot').length === 3", `${label}: Renders 3 vote dots without fake percentages`);
      await check("document.querySelector('.vote-caption').textContent.includes('trong 3 ảnh giống nhất là')", `${label}: Clear Grade-4 explanation of k=3 neighbor votes`);
      await check("!document.querySelector('.prediction-card').textContent.includes('%')", `${label}: No synthetic percentage displayed`);
      await click('.vote-dots .hint-btn');
      await check("document.querySelector('#hint-bubble')?.textContent.includes('3 ảnh trong khay')", `${label}: Vote ? hint explains how Mít compares 3 nearest photos`);
      await checkHintBubbleFits(`${label} Step 3 vote`);
      await pressEscape();
      await check("!!document.querySelector('#xray-more') && !document.querySelector('#xray-more').open", `${label}: 3 similar images & quiz collapsed under Xem thêm by default`);
      await click('[data-feedback="yes"]');
      await check("document.querySelector('[data-feedback=\"yes\"]').getAttribute('aria-pressed') === 'true'", `${label}: Learner verification works on in-group test image`);
      if (label === 'desktop') {
        await pause(450);
        await screenshot('bai2-v3-step3-drop');
      }

      // Drag outside surprise card onto #test-dropzone -> MUST NOT show Đúng rồi / Chưa đúng, MUST show reflection question
      await dragElementTo('#test-pool .test-tile.is-outside', '#test-dropzone');
      await until("!!document.querySelector('.outside-check-card')", 200);
      await check("document.querySelector('.outside-note').textContent.includes('Hoa hồng')", `${label}: Outside rose challenge names actual object`);
      await check(
        "!document.querySelector('[data-feedback=\"yes\"]') && !document.querySelector('.outside-check-card').textContent.includes('Đúng rồi') && !document.querySelector('.outside-check-card').textContent.includes('Chưa đúng')",
        `${label}: Outside image hides Đúng rồi/Chưa đúng so students cannot falsely praise wrong prediction`
      );
      await check("document.querySelector('.outside-q').textContent.includes('Vì sao Mít không gọi đúng tên')", `${label}: Outside image prompts pedagogical reflection question`);
      await click('[data-outside-ans="two-only"]');
      await check("document.querySelector('#outside-quiz-fb')?.classList.contains('ok')", `${label}: Outside reflection question validates 2-class explanation`);
      await check('document.documentElement.scrollWidth <= innerWidth', `${label}: Step 3 has no horizontal overflow`);

      // Open Xem thêm (#xray-more) -> Progressive 1-question Quiz Dialog -> Phiếu Q4
      await click('#xray-more > summary');
      await until("!!document.querySelector('#xray-more').open", 60);
      await click('#open-quiz');
      await until("!!document.querySelector('#quiz-dialog').open", 100);
      await check("document.querySelectorAll('#quiz-dialog .quiz-q').length === 1", `${label}: Quiz shows 1 question per screen`);
      await click('#quiz-dialog [data-qans="new"]');
      await check("!!document.querySelector('#quiz-dialog .qq-fb.ok')", `${label}: Quiz Q1 immediate positive feedback`);
      await click('#quiz-next');
      await click('#quiz-dialog [data-qans="diverse"]');
      await check("!!document.querySelector('#quiz-dialog .qq-fb.ok')", `${label}: Quiz Q2 immediate positive feedback`);
      await click('#quiz-next');
      await click('#quiz-dialog [data-qans="no"]');
      await check("!!document.querySelector('#quiz-dialog .qq-fb.ok')", `${label}: Quiz Q3 immediate positive feedback`);
      await click('#quiz-done');
      await until("!document.querySelector('#quiz-dialog').open && !!document.querySelector('#notebook-dialog').open", 100);
    } else {
      await click('#train-btn');
      await pause(200);
      await check("document.querySelector('#step-status').textContent.includes('Chưa tải được AI')", `${label}: Offline mode reports graceful message without crash`);
      await click('#open-notebook');
      await until("!!document.querySelector('#notebook-dialog').open", 100);
    }

    // 4. Phiếu Q4 Notebook Dialog (fills dataset+counts only, does not pre-write step explanations)
    await check('document.documentElement.scrollWidth <= innerWidth', `${label}: Notebook dialog has no horizontal overflow`);
    await click('#notebook-dialog .dialog-head .hint-btn');
    await checkHintBubbleFits(`${label} Notebook H8`);
    await click('#notebook-dialog .q4-label-main .hint-btn');
    await check(
      "document.querySelectorAll('.hint-btn[aria-expanded=\"true\"]').length === 1",
      `${label}: Opening second ? hint closes first (single popover invariant)`
    );
    await checkHintBubbleFits(`${label} Notebook H10`);
    await pressEscape();
    await check(
      "document.querySelector('#hint-bubble').hidden && document.querySelector('#notebook-dialog').open",
      `${label}: Escape inside Notebook closes ? hint without closing dialog`
    );
    await click('#fill-current-dataset');
    await check(
      "document.querySelector('#q4-dataset').value.includes('Hoa cúc') && document.querySelector('#q4-dataset').value.includes('ảnh') && document.querySelector('#q4-step1').value === ''",
      `${label}: Fill button inserts dataset & photo counts without auto-writing learner reflections`
    );
    await fill('#q4-step1', 'Em đặt Khay A là Hoa cúc, Khay B là Hoa hướng dương.');
    await fill('#q4-step2', 'Em kéo 3 ảnh hoa cúc và 3 ảnh hướng dương vào hai khay.');
    await fill('#q4-step3', 'Em bấm Dạy Mít học.');
    await fill('#q4-step4', 'Em kéo ảnh hoa chưa học và ảnh hoa hồng ngoài 2 nhóm.');
    await click('#copy');
    const copied = await e('navigator.clipboard.readText()');
    if (!copied.includes('PHIẾU THỰC HÀNH BÀI 2') || !copied.includes('Em bấm Dạy Mít học.')) {
      throw Error(`${label}: Clipboard missing Q4 content`);
    }
    reports.push(`${label}: Q4 clipboard copy contains all fields`);

    await clipboardDenied();
    await click('#copy');
    await check("!document.querySelector('#manual-copy-wrap').hidden && document.querySelector('#manual-copy').value.includes('PHIẾU THỰC HÀNH BÀI 2')", `${label}: Manual copy fallback opens when clipboard denied`);
    await clipboardRestore();

    // Verify confirmed "Làm phiếu mới" (keep old draft vs confirm clear) + stale localStorage detection across sessions
    await click('#clear-q4');
    await check("!document.querySelector('#q4-clear-confirm').hidden", `${label}: Làm phiếu mới asks confirmation before deleting student work`);
    await click('#cancel-clear-q4');
    await check("document.querySelector('#q4-clear-confirm').hidden && document.querySelector('#q4-step3').value.includes('Dạy Mít')", `${label}: Canceling reset preserves existing draft`);
    await click('#clear-q4');
    await click('#confirm-clear-q4');
    await check("document.querySelector('#q4-dataset').value === '' && document.querySelector('#q4-step3').value === '' && !localStorage.getItem('ai4.bai2.q4.v1')", `${label}: Confirming Làm phiếu mới clears fields and localStorage`);

    // Simulate stale previous-session draft (e.g. Táo–Chuối / Chai–Lon while current trays are Hoa cúc–Hoa hướng dương)
    await e("localStorage.setItem('ai4.bai2.q4.v1', JSON.stringify({ dataset: 'Quả táo và Quả chuối', step1: 'Chai nhựa và Lon nước', step2: '', step3: '', step4: '', pairKey: 'quả chuối||quả táo', pairLabel: 'Quả táo – Quả chuối' }))");

    // 5. Switch to Lượt 2 (Q4): shows clear Round 2 instruction banner, blocks flower pair -> select recycle dataset -> verify real Chai nhựa / Lon nước pool
    await click('#reset');
    await until("!document.querySelector('#notebook-dialog').open && document.body.dataset.step === '0'", 100);
    await check("!document.querySelector('#round-pill').hidden", `${label}: Lượt 2 round pill visible`);
    await check(
      "!!document.querySelector('#round2-banner') && document.querySelector('#round2-banner').textContent.includes('chọn bộ ảnh khác') && document.querySelector('#round2-banner .hint-btn')?.dataset.hint.includes('4 bước')",
      `${label}: Lượt 2 shows concise banner + ? hint to repeat 4 steps`
    );
    const round2Step0Words = await e("document.querySelector('main').innerText.trim().split(/\\s+/).filter(Boolean).length");
    metrics[`${label}Round2Step0Words`] = round2Step0Words;
    await check(`${round2Step0Words} < 70`, `${label}: Lượt 2 Step 0 main text stays < 70 words (${round2Step0Words})`);
    await check("!document.querySelector('[data-dataset=\"flowers\"]')", `${label}: Lượt 2 hides flowers preset chip`);

    await fill('#name-0', 'Hoa cúc');
    await fill('#name-1', 'Hoa hướng dương');
    await click('#step0-next');
    const flowerGuardDebug = await e("({ step: document.body.dataset.step, status: document.querySelector('#step-status')?.textContent })");
    if (flowerGuardDebug.step !== '0' || !flowerGuardDebug.status?.includes('khác')) {
      throw Error(`FAILED: ${label}: Q4 blocks reusing flower pair (debug=${JSON.stringify(flowerGuardDebug)})`);
    }
    reports.push(`${label}: Q4 blocks reusing flower pair`);

    await click('[data-dataset="recycle"]');
    await check("document.querySelector('#name-0').value === 'Chai nhựa' && document.querySelector('#name-1').value === 'Lon nước'", `${label}: Lượt 2 selects Chai nhựa - Lon nước dataset`);
    await click('#step0-next');
    await until("document.body.dataset.step === '1' && document.querySelectorAll('#sample-pool .pool-tile').length === 8", 150);
    await check("document.querySelector('#sample-pool .pool-tile').dataset.src.includes('samples/recycle/')", `${label}: Lượt 2 Step 1 renders real Chai nhựa / Lon nước photo pool`);
    await check('document.documentElement.scrollWidth <= innerWidth', `${label}: Q4 Step 1 recycle pool has no horizontal overflow`);
    if (label === 'desktop') {
      await pause(250);
      await screenshot('bai2-v3-recycle');

      // Verify generalized Round 2 guard when Round 1 starts with Recycle instead of Flowers
      await nav('bai-2/index.html');
      await until("document.querySelectorAll('.dataset-chip[data-dataset]').length === 5", 150);
      await click('[data-dataset="recycle"]');
      await click('#open-notebook');
      // Verify stale Q4 draft banner appears on reload when previous session saved mismatched pair
      await until("!!document.querySelector('#notebook-dialog').open", 100);
      await check("!document.querySelector('#q4-draft-banner').hidden && document.querySelector('#q4-draft-msg').textContent.includes('Quả táo')", `${label}: Stale previous-session Q4 draft shows clear mismatch banner`);
      await click('#keep-old-q4');
      await check("document.querySelector('#q4-draft-banner').hidden && document.querySelector('#q4-dataset').value.includes('Quả táo')", `${label}: Tiếp tục bài cũ keeps previous draft safely`);
      await click('#clear-q4');
      await click('#confirm-clear-q4');
      await check("document.querySelector('#q4-dataset').value === ''", `${label}: Làm phiếu mới clears stale draft after confirmation`);
      await click('#reset');
      await until("!document.querySelector('#notebook-dialog').open && document.body.dataset.step === '0'", 100);
      await check("!document.querySelector('[data-dataset=\"recycle\"]') && !!document.querySelector('[data-dataset=\"flowers\"]')", `${label}: Round 2 hides recycle when recycle was Round 1 and keeps flowers`);
      await fill('#name-0', 'Chai nhựa');
      await fill('#name-1', 'Lon nước');
      await click('#step0-next');
      await check("document.body.dataset.step === '0' && document.querySelector('#step-status').textContent.includes('khác')", `${label}: Round 2 blocks manually reusing Chai nhựa - Lon nước from Round 1`);
    }

    // 6. Huong dan 4 buoc page
    await nav('bai-2/huong-dan.html');
    await check("document.querySelectorAll('.step-card').length === 4", `${label}: Huong dan shows 4 step cards`);
    await check("!document.body.textContent.includes('Ảnh càng đa dạng, Mít học càng tốt')", `${label}: Huong dan avoids overclaiming diversity guarantees`);
    await check("!/[🌱🧺🃏🎯🎁🔄📋✨🧹📌👩‍🏫🔎💡📷📁⚡🤖🔊🔇🗣️👍🤔✏️ⓘ⬇]/u.test(document.body.innerText)", `${label}: Huong dan stripped decorative emoji spam`);
    await check("document.querySelectorAll('.hint-btn').length >= 8", `${label}: Huong dan renders ? hint buttons`);
    await click('.step-card:nth-child(2) .hint-btn');
    await checkHintBubbleFits(`${label} Huong dan G1`);
    await click('.remember li:last-child .hint-btn');
    await check("document.querySelectorAll('.hint-btn[aria-expanded=\"true\"]').length === 1", `${label}: Huong dan keeps only 1 ? hint open at a time`);
    await checkHintBubbleFits(`${label} Huong dan G9`);
    await pressEscape();
    await check("document.querySelector('#hint-bubble').hidden", `${label}: Escape closes ? hint on Huong dan`);
    await check('document.documentElement.scrollWidth <= innerWidth', `${label}: Huong dan has no horizontal overflow`);

    // 7. Moodle embed mode for Bai 2 (self-contained without azota-embed.js)
    await nav('bai-2/index.html?embed=moodle');
    await until('!!window.Bai2Embed?.active');
    await until("document.querySelector('#stage-loader').hidden", 250);
    await pause(150);
    await check("getComputedStyle(document.querySelector('header')).display === 'none'", `${label}: Moodle embed hides standalone header in Bai 2`);
    await check("getComputedStyle(document.querySelector('nav.journey')).display === 'flex'", `${label}: Moodle embed keeps 4-step journey visible in Bai 2`);
    const embedWords = await e("document.querySelector('main').innerText.trim().split(/\\s+/).filter(Boolean).length");
    metrics[`${label}EmbedStep0Words`] = embedWords;
    await check(`${embedWords} < 55`, `${label}: Moodle embed Step 0 main text stays < 55 words (${embedWords})`);
    await check('document.documentElement.scrollWidth <= innerWidth', `${label}: Moodle embed Bai 2 fits frame width`);
    await click('#open-notebook');
    await until("!!document.querySelector('#notebook-dialog').open", 100);
    await click('#notebook-dialog .dialog-head .hint-btn');
    await check(
      "document.querySelector('#copy')?.textContent.trim() === 'Sao chép nộp Moodle' && document.querySelector('#hint-bubble')?.textContent.includes('Moodle')",
      `${label}: Moodle embed provides Sao chép nộp Moodle button and ? hint`
    );
    await checkHintBubbleFits(`${label} Moodle embed Q4 hint`);
    await pressEscape();
    await click('#close-notebook');
  }

  if (runtimeErrors.length || consoleErrors.length) {
    throw Error(JSON.stringify({ runtimeErrors, consoleErrors }));
  }

  await fs.writeFile(
    '.preview/bai2-test-results.json',
    JSON.stringify({ checks: reports.length, metrics, runtimeErrors, consoleErrors, cdnWarnings, reports }, null, 2)
  );
  console.log(JSON.stringify({ checks: reports.length, metrics, runtimeErrors, consoleErrors, cdnWarningsCount: cdnWarnings.length }));
} finally {
  socket.close();
}
