'use strict';
const $ = s => document.querySelector(s);

const state = {
  step: 0,
  round: 'q3',
  datasets: [],
  datasetsPromise: null,
  datasetId: 'flowers',
  names: ['Hoa cúc', 'Hoa hướng dương'],
  sets: [[], []],
  trained: [],
  net: null,
  netPromise: null,
  busy: false,
  result: null,
  sampleCache: new Map(),
  poolOffset: 0,
  testOffset: 0,
  outsideIndex: 0,
  selectedSrc: null,
  feedback: null,
  history: [],
  quizIndex: 0,
  quizAnswers: [null, null, null],
  q4: { dataset: '', step1: '', step2: '', step3: '', step4: '' },
  speechEnabled: false,
  lastVoiceKey: 'welcome'
};

const Q4_STORAGE_KEY = 'ai4.bai2.q4.v1';
const isEmbed = () => !!window.AzotaEmbed?.active;

const esc = s =>
  String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

// Genuine Vietnamese Voice Engine (offline MP3 clips + strict vi-VN speechSynthesis fallback)
let voiceAudio = null;
let viSpeechVoice = null;

function refreshViVoice() {
  if (!('speechSynthesis' in window)) return;
  try {
    const voices = window.speechSynthesis.getVoices();
    viSpeechVoice =
      voices.find(
        v => /^vi\b/i.test(v.lang) || /vietnamese|tiếng việt|hoaimy|namminh/i.test(v.name)
      ) || null;
  } catch {}
}

if ('speechSynthesis' in window) {
  refreshViVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshViVoice);
}

function stopVoice() {
  if (voiceAudio) {
    try {
      voiceAudio.pause();
      voiceAudio.currentTime = 0;
    } catch {}
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

function speakViaViTTS(text) {
  refreshViVoice();
  if (!viSpeechVoice || !('speechSynthesis' in window)) return false;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = viSpeechVoice;
    u.lang = viSpeechVoice.lang || 'vi-VN';
    u.rate = 0.96;
    window.__mitLastSpeech = { text, voiceKey: state.lastVoiceKey, mode: 'tts-vi', lang: u.lang };
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

function speakVietnamese(text, voiceKey = state.lastVoiceKey) {
  stopVoice();
  window.__mitLastSpeech = { text, voiceKey: voiceKey || null, mode: null, src: null };
  if (voiceKey) {
    if (!voiceAudio) voiceAudio = new Audio();
    const src = `audio/${voiceKey}.mp3`;
    voiceAudio.src = src;
    voiceAudio.currentTime = 0;
    window.__mitLastSpeech = { text, voiceKey, mode: 'audio', src };
    const p = voiceAudio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => speakViaViTTS(text));
    }
    return;
  }
  speakViaViTTS(text);
}

function say(s, voiceKey = null) {
  const el = $('#speech');
  if (el) el.textContent = s;
  if (voiceKey !== undefined) state.lastVoiceKey = voiceKey;
  if (state.speechEnabled) speakVietnamese(s, voiceKey);
}

function pose(p) {
  window.dispatchEvent(new CustomEvent('mitPose', { detail: p }));
}

function emitTrays(active = null) {
  window.dispatchEvent(
    new CustomEvent('mitTrays', {
      detail: { counts: [state.sets[0].length, state.sets[1].length], active }
    })
  );
}

function emitTraining(active, progress = 0) {
  const box = $('#train-progress');
  const fill = $('#train-fill');
  const label = $('#train-label');
  if (box) box.hidden = !active;
  if (fill) fill.style.width = Math.round(progress * 100) + '%';
  if (label) label.textContent = active ? `Mít đang học (${Math.round(progress * 100)}%)…` : '';
  window.dispatchEvent(new CustomEvent('mitTraining', { detail: { active, progress } }));
}

function emitPredict(prediction) {
  window.dispatchEvent(
    new CustomEvent('mitPredict', {
      detail: {
        cls: prediction.cls,
        agreement: prediction.agreement,
        neighbours: prediction.neighbours
      }
    })
  );
}

function setStatus(s) {
  const el = $('#step-status');
  if (el) el.textContent = s;
}

function isFlowerPair(a, b) {
  const pair = [a.trim().toLocaleLowerCase(), b.trim().toLocaleLowerCase()].sort();
  return pair[0] === 'hoa cúc' && pair[1] === 'hoa hướng dương';
}

function samePair(aList, bList) {
  return (
    aList[0].trim().toLocaleLowerCase() === bList[0].trim().toLocaleLowerCase() &&
    aList[1].trim().toLocaleLowerCase() === bList[1].trim().toLocaleLowerCase()
  );
}

function validNames() {
  const a = state.names[0].trim();
  const b = state.names[1].trim();
  if (!a || !b) return false;
  if (a.toLocaleLowerCase() === b.toLocaleLowerCase()) return false;
  if (state.round === 'q4' && isFlowerPair(a, b)) return false;
  return true;
}

function getActiveDataset() {
  if (!state.datasetId || state.datasetId === 'custom') return null;
  return state.datasets.find(d => d.id === state.datasetId) || null;
}

function invalidate() {
  state.trained = [];
  state.feedback = null;
  state.history = [];
  if (state.result?.url?.startsWith('blob:') && !state.sampleCache.has(state.result.src)) {
    URL.revokeObjectURL(state.result.url);
  }
  state.result = null;
}

function warmUpNetwork() {
  if (state.net || state.netPromise || !window.tf || !window.mobilenet) return;
  state.netPromise = (async () => {
    await tf.ready();
    const net = await mobilenet.load({ version: 2, alpha: 1.0 });
    state.net = net;
    return net;
  })().catch(err => {
    state.netPromise = null;
    throw err;
  });
}

async function imageFile(file, extra = {}) {
  if (!file.type.startsWith('image/')) throw Error('Chọn ảnh JPG, PNG hoặc WebP nhé.');
  if (file.size > 15 * 1024 * 1024) throw Error('Ảnh quá lớn (>15 MB).');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return { img, url, name: file.name, size: file.size, lastModified: file.lastModified, hash, ...extra };
  } catch {
    URL.revokeObjectURL(url);
    throw Error('Không mở được ảnh này.');
  }
}

async function loadSample(entry) {
  if (state.sampleCache.has(entry.src)) return state.sampleCache.get(entry.src);
  const response = await fetch(entry.src);
  if (!response.ok) throw Error('Chưa tải được ảnh mẫu.');
  const blob = await response.blob();
  const item = await imageFile(new File([blob], entry.src.split('/').pop(), { type: 'image/jpeg', lastModified: 0 }), {
    src: entry.src,
    sampleCls: entry.cls
  });
  state.sampleCache.set(entry.src, item);
  return item;
}

async function loadDatasets() {
  if (state.datasetsPromise) return state.datasetsPromise;
  state.datasetsPromise = (async () => {
    const res = await fetch('samples/datasets.json');
    if (!res.ok) throw Error('Chưa tải được kho ảnh mẫu.');
    const data = await res.json();
    state.datasets = Array.isArray(data.datasets) ? data.datasets : [];
    const active = getActiveDataset();
    if (active && state.step === 0 && !state.names[0] && !state.names[1]) {
      state.names = [...active.names];
    }
    if (state.step <= 1) render();
    return state.datasets;
  })().catch(err => {
    state.datasetsPromise = null;
    setStatus(err.message);
  });
  return state.datasetsPromise;
}

function getUnusedSampleGroups() {
  const ds = getActiveDataset();
  if (!ds) return { c0: [], c1: [] };
  const usedSrc = new Set(state.sets.flat().map(x => x.src).filter(Boolean));
  const usedHashes = new Set(state.sets.flat().map(x => x.hash).filter(Boolean));
  const keep = x => !usedSrc.has(x.src) && (!x.sha256 || !usedHashes.has(x.sha256));
  return {
    c0: ds.train.filter(x => x.cls === 0 && keep(x)),
    c1: ds.train.filter(x => x.cls === 1 && keep(x))
  };
}

function pickRotated(list, offset, count) {
  if (!list.length) return [];
  const out = [];
  const take = Math.min(count, list.length);
  const start = offset % list.length;
  for (let i = 0; i < take; i++) {
    out.push(list[(start + i) % list.length]);
  }
  return out;
}

function getVisiblePoolEntries() {
  const { c0, c1 } = getUnusedSampleGroups();
  const pick0 = pickRotated(c0, state.poolOffset, 4);
  const pick1 = pickRotated(c1, state.poolOffset, 4);
  const mixed = [];
  const maxLen = Math.max(pick0.length, pick1.length);
  for (let i = 0; i < maxLen; i++) {
    if (pick0[i]) mixed.push(pick0[i]);
    if (pick1[i]) mixed.push(pick1[i]);
  }
  return mixed;
}

function getVisibleTestEntries() {
  const ds = getActiveDataset();
  if (!ds) return [];
  const usedHashes = new Set(state.sets.flat().map(x => x.hash).filter(Boolean));
  const usedSrc = new Set(state.sets.flat().map(x => x.src).filter(Boolean));
  const unseenTest = ds.test.filter(x => !usedSrc.has(x.src) && (!x.sha256 || !usedHashes.has(x.sha256)));
  const t0 = unseenTest.filter(x => x.cls === 0);
  const t1 = unseenTest.filter(x => x.cls === 1);
  const p0 = pickRotated(t0, state.testOffset, 3);
  const p1 = pickRotated(t1, state.testOffset, 2);
  const out = [];
  for (let i = 0; i < Math.max(p0.length, p1.length); i++) {
    if (p0[i]) out.push({ ...p0[i], isOutside: false });
    if (p1[i]) out.push({ ...p1[i], isOutside: false });
  }
  if (ds.outside?.length) {
    const outEntry = ds.outside[state.outsideIndex % ds.outside.length];
    out.push({ ...outEntry, isOutside: true, outsideName: ds.outsideName });
  }
  return out;
}

async function addPoolPhoto(entry, chosenTray) {
  if (state.busy || !entry) return;
  if (state.sets[chosenTray].length >= 20) {
    setStatus('Khay đã đầy 20 ảnh rồi!');
    return;
  }
  state.busy = true;
  render();
  try {
    const item = await loadSample(entry);
    if (state.sets.flat().some(x => (x.src && x.src === item.src) || (x.hash && x.hash === item.hash))) {
      setStatus('Ảnh này đã nằm trong khay rồi!');
      return;
    }
    state.sets[chosenTray].push(item);
    state.selectedSrc = null;
    invalidate();
    window.MitSound?.play('pop');
    window.dispatchEvent(new CustomEvent('mitPhotoFly', { detail: { cls: chosenTray, url: item.url } }));
    setStatus('');

    if (typeof entry.cls === 'number' && entry.cls !== chosenTray) {
      say(`Ơ, ảnh này trông giống ${state.names[entry.cls]} hơn nhỉ? Thử xem Mít học thế nào nhé!`, 'wrong_tray');
    } else if (state.sets.every(x => x.length >= 3)) {
      say('Đủ ảnh rồi! Bạn có thể kéo thêm ảnh khác góc chụp hoặc bấm Dạy Mít nào!', 'ready');
    }
  } catch (e) {
    setStatus(e.message);
  } finally {
    state.busy = false;
    render();
    emitTrays(chosenTray);
  }
}

async function predictSampleEntry(entry, isOutside = false) {
  if (state.busy || !entry) return;
  if (!state.trained.length) {
    go(2);
    return;
  }
  try {
    const item = await loadSample(entry);
    const ds = getActiveDataset();
    if (ds?.outsideName) item.outsideName = ds.outsideName;
    await predict(item, isOutside);
  } catch (e) {
    setStatus(e.message);
  }
}

// Unified Pointer Drag-and-Drop (mouse + touch) with clean ghost card & target highlighting
function findHitTarget(x, y, targets) {
  for (const t of targets) {
    if (!t.el) continue;
    const r = t.el.getBoundingClientRect();
    if (r.width && r.height && x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 8 && y <= r.bottom + 8) {
      return t;
    }
  }
  return null;
}

function attachTilePointerDrag(tile, { getEntry, getTargets, onTap, onHoverChange }) {
  let suppressNextClick = false;

  tile.addEventListener('click', e => {
    if (e.target.closest('.tile-quick-actions')) return;
    if (suppressNextClick || state.busy) return;
    onTap?.(tile, getEntry());
  });

  tile.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.tile-quick-actions')) return;
    if (state.busy) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const imgEl = tile.querySelector('img');
    const imgSrc = imgEl?.src || tile.dataset.src;
    let dragging = false;
    let ghost = null;
    let lastTargetKey = null;

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      tile.classList.remove('is-dragging');
      if (ghost) {
        ghost.remove();
        ghost = null;
      }
      for (const t of getTargets()) t.el?.classList.remove('is-drop-target');
    };

    const onMove = ev => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) > 6) {
        dragging = true;
        tile.classList.add('is-dragging');
        ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        const gImg = document.createElement('img');
        gImg.src = imgSrc;
        gImg.alt = '';
        ghost.appendChild(gImg);
        document.body.appendChild(ghost);
      }
      if (!dragging || !ghost) return;
      ev.preventDefault();
      ghost.style.left = ev.clientX + 'px';
      ghost.style.top = ev.clientY + 'px';

      const targets = getTargets();
      const hit = findHitTarget(ev.clientX, ev.clientY, targets);
      for (const t of targets) {
        t.el?.classList.toggle('is-drop-target', !!hit && hit === t);
      }
      const nextKey = hit ? hit.key : null;
      if (nextKey !== lastTargetKey) {
        lastTargetKey = nextKey;
        onHoverChange?.(hit);
      }
    };

    const onUp = ev => {
      const targets = getTargets();
      const hit = dragging ? findHitTarget(ev.clientX, ev.clientY, targets) : null;
      if (dragging) {
        suppressNextClick = true;
        setTimeout(() => {
          suppressNextClick = false;
        }, 60);
      }
      cleanup();
      if (dragging && hit) hit.onDrop(getEntry());
    };

    const onCancel = () => cleanup();

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  });
}

function selectDataset(id) {
  if (state.busy) return;
  if (id === 'custom') {
    state.datasetId = 'custom';
    state.names = ['', ''];
    state.sets = [[], []];
    state.selectedSrc = null;
    invalidate();
    window.MitSound?.play('step');
    render();
    emitTrays();
    say('Hãy gõ tên 2 nhóm vào Khay A và Khay B, rồi bấm Xếp ảnh nào nhé!', 'pick_custom');
    $('#name-0')?.focus();
    return;
  }
  const ds = state.datasets.find(d => d.id === id);
  if (!ds) return;
  if (state.round === 'q4' && isFlowerPair(ds.names[0], ds.names[1])) {
    setStatus('Lượt 2 (Q4) chọn kho ảnh khác Hoa cúc – Hướng dương nhé!');
    say('Lượt 2 bạn chọn bộ ảnh khác với Hoa cúc và Hướng dương nhé!', 'need_diff');
    return;
  }
  state.datasetId = ds.id;
  state.names = [...ds.names];
  state.sets = [[], []];
  state.poolOffset = 0;
  state.testOffset = 0;
  state.outsideIndex = 0;
  state.selectedSrc = null;
  setStatus('');
  invalidate();
  window.MitSound?.play('step');
  render();
  emitTrays();
  pose('lookLeft');
  say(`Đã chọn kho ${ds.names[0]} và ${ds.names[1]}! Bấm Xếp ảnh nào nhé.`, 'pick_' + ds.id);
}

function renderTrays() {
  for (let i = 0; i < 2; i++) {
    const tray = $('#tray-' + i);
    const items = state.sets[i];
    const dotCount = Math.min(3, items.length);
    const dotsHtml =
      `<div class="tray-dots" aria-label="Đã có ${items.length} ảnh">` +
      [0, 1, 2].map(d => `<span class="t-dot ${d < dotCount ? 'on' : ''}"></span>`).join('') +
      (items.length >= 3 ? `<span class="t-ok">✓ ${items.length} ảnh</span>` : `<span class="t-ok">${items.length}/3</span>`) +
      `</div>`;

    tray.innerHTML =
      `<div class="tray-heading"><span>KHAY ${i === 0 ? 'A' : 'B'}</span><small class="tray-count">${items.length ? items.length + ' ảnh' : 'Trống'}</small></div>` +
      (state.step === 0
        ? `<input id="name-${i}" type="text" maxlength="30" autocomplete="off" aria-label="Tên nhóm khay ${i === 0 ? 'A' : 'B'}" value="${esc(state.names[i])}" placeholder="${i === 0 ? (state.round === 'q4' ? 'Ví dụ: Chai nhựa' : 'Ví dụ: Hoa cúc') : (state.round === 'q4' ? 'Ví dụ: Lon nước' : 'Ví dụ: Hoa hướng dương')}">`
        : `<h2 class="tray-name">${esc(state.names[i])}</h2>`) +
      (state.step === 1 ? dotsHtml : '') +
      (items.length
        ? `<div class="photos">${items
            .map(
              (x, k) =>
                `<div class="photo"><img src="${x.url}" width="72" height="72" alt="Ảnh ${k + 1} của ${esc(state.names[i])}">${state.step === 1 ? `<button type="button" data-remove="${i},${k}" aria-label="Bỏ ảnh ${k + 1}">×</button>` : ''}</div>`
            )
            .join('')}</div>`
        : `<div class="empty-photos" aria-hidden="true"><div class="paper-photo"></div><div class="paper-photo second"></div></div>`) +
      (state.step === 1
        ? `<div class="tray-mini-actions"><button type="button" class="mini-btn cam" data-camera="${i}">📷 Chụp</button><label class="mini-btn">📁 Chọn ảnh<input type="file" accept="image/*" multiple data-upload="${i}" aria-label="Chọn ảnh vào khay ${i === 0 ? 'A' : 'B'}"></label></div>`
        : '');
  }

  document.querySelectorAll('[id^="name-"]').forEach((e, i) => {
    e.oninput = () => {
      state.names[i] = e.value;
      const match = state.datasets.find(d => samePair(state.names, d.names));
      state.datasetId = match ? match.id : 'custom';
      invalidate();
      if (state.round === 'q4' && isFlowerPair(state.names[0], state.names[1])) {
        setStatus('Lượt 2 (Q4) chọn cặp khác Hoa cúc – Hướng dương nhé!');
      } else {
        setStatus('');
      }
      renderArenaChipsPressed();
      renderSessionSummary();
    };
    e.onfocus = () => pose(i === 0 ? 'lookLeft' : 'lookRight');
  });

  document.querySelectorAll('[data-camera]').forEach(b => (b.onclick = () => openCamera(+b.dataset.camera)));
  document.querySelectorAll('[data-upload]').forEach(e => (e.onchange = () => addFiles(+e.dataset.upload, [...e.files])));
  document.querySelectorAll('[data-remove]').forEach(
    b =>
      (b.onclick = () => {
        if (state.busy) return;
        const [i, k] = b.dataset.remove.split(',').map(Number);
        const [x] = state.sets[i].splice(k, 1);
        if (x?.url?.startsWith('blob:') && !state.sampleCache.has(x.src)) {
          URL.revokeObjectURL(x.url);
        }
        invalidate();
        render();
        emitTrays();
      })
  );
}

function renderArenaChipsPressed() {
  const activeDs = getActiveDataset();
  document.querySelectorAll('[data-dataset]').forEach(btn => {
    const id = btn.dataset.dataset;
    const pressed = id === 'custom' ? !activeDs && state.datasetId === 'custom' : activeDs?.id === id;
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  });
}

function renderNeighbors(r) {
  if (!r?.nearest?.length || !state.trained.length) return '';
  const dots = r.nearest
    .map(n => `<span class="vote-dot ${n.cls === 0 ? 'tray-a-dot' : 'tray-b-dot'}" title="${esc(state.names[n.cls])}"></span>`)
    .join('');

  const voteText =
    r.agreement < r.neighbours
      ? `${r.agreement}/${r.neighbours} giống nhất · Mít chưa chắc!`
      : `${r.agreement}/${r.neighbours} giống nhất`;

  const thumbs = r.nearest
    .map(n => {
      const sampleItem = state.trained[n.index];
      if (!sampleItem) return '';
      return `<div class="neighbor-card ${n.cls === 0 ? 'a' : 'b'}"><img src="${sampleItem.url}" width="52" height="52" alt="${esc(state.names[n.cls])}"><span>${esc(state.names[n.cls])}</span></div>`;
    })
    .join('');

  return `<div class="vote-dots">${dots}<span class="vote-caption">${voteText}</span></div><div class="neighbors-box"><p class="neighbors-title">Mít thấy giống 3 ảnh này nhất:</p><div class="neighbors-grid">${thumbs}</div></div>`;
}

function renderArena() {
  const arena = $('#step-arena');
  if (!arena) return;

  if (state.step === 0) {
    const fallbackChips = [
      { id: 'flowers', label: 'Hoa vườn', hint: 'Hoa cúc · Hoa hướng dương' },
      { id: 'recycle', label: 'Chai & Lon', hint: 'Chai nhựa · Lon nước' },
      { id: 'fruits', label: 'Hoa quả', hint: 'Quả táo · Quả chuối' },
      { id: 'pets', label: 'Thú cưng', hint: 'Mèo · Chó' }
    ];
    const sourceList = state.datasets.length
      ? state.datasets.map(d => ({
          id: d.id,
          label: d.title,
          hint: `${d.names[0]} · ${d.names[1]}`,
          thumb: d.thumb
        }))
      : fallbackChips;

    const visibleList = state.round === 'q4' ? sourceList.filter(d => d.id !== 'flowers') : sourceList;
    const chipsHtml =
      visibleList
        .map(d => {
          const pressed = state.datasetId === d.id;
          return `<button type="button" class="dataset-chip" data-dataset="${d.id}" title="${esc(d.hint)}" aria-label="${esc(d.label + ': ' + d.hint)}" aria-pressed="${pressed}">${d.thumb ? `<img src="${d.thumb}" width="26" height="26" alt="">` : ''}<span>${esc(d.label)}</span></button>`;
        })
        .join('') +
      `<button type="button" class="dataset-chip" data-dataset="custom" aria-pressed="${state.datasetId === 'custom'}">✏️ Tự tạo</button>`;

    arena.innerHTML =
      `<div class="dataset-chips">${chipsHtml}</div>` +
      `<div class="arena-cta"><button type="button" id="step0-next" class="primary">Xếp ảnh nào →</button></div>`;

    arena.querySelectorAll('[data-dataset]').forEach(btn => {
      btn.onclick = () => selectDataset(btn.dataset.dataset);
    });
    $('#step0-next').onclick = () => go(1);
    return;
  }

  if (state.step === 1) {
    const canTrain = state.sets.every(x => x.length >= 3);
    const activeDs = getActiveDataset();

    if (activeDs) {
      const visibleEntries = getVisiblePoolEntries();
      const tilesHtml = visibleEntries.length
        ? `<div class="pool-grid">${visibleEntries
            .map(entry => {
              const sel = state.selectedSrc === entry.src;
              const groupLabel = activeDs.names[entry.cls] || 'ảnh mẫu';
              return (
                `<div class="pool-tile ${sel ? 'is-selected' : ''}" data-src="${esc(entry.src)}" data-cls="${entry.cls}" tabindex="0" role="button" aria-label="Ảnh ${esc(groupLabel)}. Kéo vào Khay A hoặc B">` +
                `<img src="${entry.src}" width="96" height="96" alt="${esc(groupLabel)}" draggable="false">` +
                (sel
                  ? `<div class="tile-quick-actions"><button type="button" class="tile-btn tile-to-a" data-assign="0">← A</button><button type="button" class="tile-btn tile-to-b" data-assign="1">B →</button></div>`
                  : '') +
                `</div>`
              );
            })
            .join('')}</div>`
        : `<p class="pool-empty">Đã chọn hết ảnh trong kho mẫu! Bạn có thể bấm Dạy Mít hoặc chụp thêm ảnh.</p>`;

      arena.innerHTML =
        `<div id="sample-pool">` +
        `<div class="sample-pool-head"><span>🧺 Kéo ảnh bạn chọn vào Khay A hoặc B</span><button type="button" id="pool-shuffle" class="mini-pill" ${state.busy ? 'disabled' : ''}>🔄 Ảnh khác</button></div>` +
        tilesHtml +
        `</div>` +
        `<div class="deck-footer"><button type="button" id="go-train" class="primary" ${canTrain && !state.busy ? '' : 'disabled'}>Dạy Mít nào →</button></div>`;

      const entryBySrc = new Map(visibleEntries.map(x => [x.src, x]));
      $('#pool-shuffle')?.addEventListener('click', () => {
        state.poolOffset += 4;
        state.selectedSrc = null;
        window.MitSound?.play('step');
        renderArena();
      });

      arena.querySelectorAll('.pool-tile').forEach(tile => {
        const src = tile.dataset.src;
        attachTilePointerDrag(tile, {
          getEntry: () => entryBySrc.get(src),
          getTargets: () => [
            { el: $('#tray-0'), key: 0, onDrop: entry => addPoolPhoto(entry, 0) },
            { el: $('#tray-1'), key: 1, onDrop: entry => addPoolPhoto(entry, 1) }
          ],
          onHoverChange: hit => {
            if (hit?.key === 0) pose('lookLeft');
            else if (hit?.key === 1) pose('lookRight');
          },
          onTap: () => {
            state.selectedSrc = state.selectedSrc === src ? null : src;
            renderArena();
          }
        });

        tile.addEventListener('keydown', ev => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            state.selectedSrc = state.selectedSrc === src ? null : src;
            renderArena();
          }
        });

        tile.querySelectorAll('[data-assign]').forEach(btn => {
          btn.onclick = ev => {
            ev.stopPropagation();
            addPoolPhoto(entryBySrc.get(src), +btn.dataset.assign);
          };
        });
      });

      $('#go-train').onclick = () => go(2);
    } else {
      arena.innerHTML =
        `<div class="sample-pool-head"><span>📷 Tự chụp hoặc chọn ít nhất 3 ảnh vào mỗi khay</span></div>` +
        `<div class="test-quick-row">` +
        `<button type="button" class="test-action-btn" id="center-cam-a">📷 Chụp ${esc(state.names[0])}</button>` +
        `<button type="button" class="test-action-btn" id="center-cam-b">📷 Chụp ${esc(state.names[1])}</button>` +
        `</div>` +
        `<div class="deck-footer"><button type="button" id="go-train" class="primary" ${canTrain && !state.busy ? '' : 'disabled'}>Dạy Mít nào →</button></div>`;
      $('#center-cam-a').onclick = () => openCamera(0);
      $('#center-cam-b').onclick = () => openCamera(1);
      $('#go-train').onclick = () => go(2);
    }
    return;
  }

  if (state.step === 2) {
    arena.innerHTML =
      `<div class="train-arena">` +
      `<div class="train-pills"><span class="train-pill">${esc(state.names[0])}: ${state.sets[0].length}</span><span>+</span><span class="train-pill b">${esc(state.names[1])}: ${state.sets[1].length}</span><span>→ 🤖</span></div>` +
      `<button type="button" id="train-btn" class="primary train-btn" ${state.busy ? 'disabled' : ''}>${state.trained.length ? 'Thử ảnh mới →' : '⚡ Dạy Mít học!'}</button>` +
      `<div id="train-progress" class="train-progress" hidden><div class="train-bar"><div id="train-fill" class="train-fill"></div></div><span id="train-label" class="train-label"></span></div>` +
      `</div>`;
    $('#train-btn').onclick = () => {
      if (state.trained.length) go(3);
      else train();
    };
    return;
  }

  // Step 3: X-Ray Drag-and-Drop Test Station
  const r = state.result;
  const activeDs = getActiveDataset();
  const testEntries = activeDs ? getVisibleTestEntries() : [];

  const testPoolHtml = activeDs
    ? `<div id="test-pool" class="test-pool">` +
      `<div class="test-pool-head"><span>🃏 Kho ảnh mới (kéo lên ô trên hoặc chạm)</span><button type="button" id="test-pool-more" class="mini-pill" ${state.busy ? 'disabled' : ''}>🔄 Ảnh khác</button></div>` +
      `<div class="test-pool-grid">${testEntries
        .map(
          entry =>
            `<div class="test-tile ${entry.isOutside ? 'is-outside' : ''}" data-src="${esc(entry.src)}" data-outside="${entry.isOutside ? 'true' : 'false'}" tabindex="0" role="button" aria-label="${entry.isOutside ? 'Ảnh bí mật ngoài 2 nhóm' : 'Ảnh mới kiểm tra Mít'}">` +
            `<img src="${entry.src}" width="92" height="92" alt="" draggable="false">` +
            (entry.isOutside ? `<span class="outside-badge" aria-hidden="true">🎁</span>` : '') +
            `</div>`
        )
        .join('')}</div></div>`
    : '';

  const historyHtml = state.history.length
    ? `<div class="test-history">${state.history
        .map(
          h =>
            `<div class="history-chip ${h.feedback || ''}"><img src="${h.url}" width="24" height="24" alt=""><span>${esc(h.predName)} ${h.feedback === 'yes' ? '✓' : h.feedback === 'no' ? '✗' : ''}</span></div>`
        )
        .join('')}</div>`
    : '';

  arena.innerHTML =
    `<div id="test-station">` +
    `<div id="test-dropzone" class="test-dropzone" role="region" aria-label="Ô thả ảnh mới cho Mít đoán">🎯 Kéo ảnh mới thả vào đây cho Mít đoán</div>` +
    (r
      ? `<div class="prediction-card"><img class="test-image" src="${r.url}" width="78" height="78" alt="Ảnh đang thử"><div><span class="pred-eyebrow">${r.isOutside ? 'Ảnh ngoài 2 nhóm' : 'Mít đoán'}</span><p class="prediction">${esc(state.names[r.cls])}</p></div></div>` +
        renderNeighbors(r) +
        (r.isOutside
          ? `<div class="outside-note"><strong>🎁 Bất ngờ chưa!</strong> Đây là <b>${esc(r.outsideName || activeDs?.outsideName || 'vật ngoài 2 nhóm')}</b>. Mít chỉ biết chọn giữa <i>${esc(state.names[0])}</i> và <i>${esc(state.names[1])}</i>!</div>`
          : '') +
        `<div class="feedback-buttons"><button type="button" data-feedback="yes" aria-pressed="${state.feedback === 'yes'}">👍 Đúng rồi!</button><button type="button" data-feedback="no" aria-pressed="${state.feedback === 'no'}">🤔 Chưa đúng</button></div>` +
        (state.feedback === 'no' ? '<button type="button" id="improve" class="text-button">+ Thêm ảnh dạy lại →</button>' : '')
      : '') +
    testPoolHtml +
    `<div class="test-quick-row">` +
    `<button type="button" id="test-camera" class="test-action-btn" ${state.busy ? 'disabled' : ''}>📷 Chụp thử</button>` +
    `<label class="test-action-btn">📁 Ảnh từ máy<input type="file" accept="image/*" id="test-file" aria-label="Chọn ảnh mới thử Mít" ${state.busy ? 'disabled' : ''}></label>` +
    `</div>` +
    historyHtml +
    `<div class="step3-finish-row">` +
    `<button type="button" id="open-quiz" class="finish-pill warn">🎯 Thử tài 3 câu</button>` +
    `<button type="button" id="start-round2" class="finish-pill">🔄 Đổi bộ mới (Lượt 2)</button>` +
    `<button type="button" id="open-notebook-step3" class="finish-pill">📋 Viết Phiếu Q4</button>` +
    `</div>` +
    `</div>`;

  const entryMap = new Map(testEntries.map(x => [x.src, x]));
  $('#test-pool-more')?.addEventListener('click', () => {
    state.testOffset += 2;
    state.outsideIndex++;
    window.MitSound?.play('step');
    renderArena();
  });

  arena.querySelectorAll('.test-tile').forEach(tile => {
    const src = tile.dataset.src;
    const isOutside = tile.dataset.outside === 'true';
    const handleDrop = entry => predictSampleEntry(entry, isOutside);
    attachTilePointerDrag(tile, {
      getEntry: () => entryMap.get(src),
      getTargets: () => [
        { el: $('#test-dropzone'), key: 'dropzone', onDrop: handleDrop },
        { el: $('.robot-stage'), key: 'stage', onDrop: handleDrop }
      ],
      onHoverChange: hit => {
        if (hit) pose('think');
      },
      onTap: (_, entry) => handleDrop(entry)
    });
    tile.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        handleDrop(entryMap.get(src));
      }
    });
  });

  const dropzoneEl = $('#test-dropzone');
  const stageEl = $('.robot-stage');
  const bindTestDrop = targetEl => {
    if (!targetEl) return;
    targetEl.ondragover = e => {
      if (state.step !== 3 || state.busy) return;
      e.preventDefault();
      targetEl.classList.add('is-drop-target');
    };
    targetEl.ondragleave = () => targetEl.classList.remove('is-drop-target');
    targetEl.ondrop = e => {
      targetEl.classList.remove('is-drop-target');
      if (state.step !== 3 || state.busy) return;
      e.preventDefault();
      const testSrc = e.dataTransfer?.getData('application/x-mit-test');
      if (testSrc) {
        const entry = entryMap.get(testSrc);
        if (entry) predictSampleEntry(entry, !!entry.isOutside);
        return;
      }
      const file = e.dataTransfer?.files?.[0];
      if (file) testFile(file);
    };
  };
  bindTestDrop(dropzoneEl);
  bindTestDrop(stageEl);

  $('#test-camera').onclick = () => openCamera('test');
  $('#test-file').onchange = e => {
    if (e.target.files[0]) testFile(e.target.files[0]);
  };
  arena.querySelectorAll('[data-feedback]').forEach(
    b =>
      (b.onclick = () => {
        state.feedback = b.dataset.feedback;
        if (state.history.length) state.history[0].feedback = state.feedback;
        render();
        say(
          state.feedback === 'yes' ? 'Hoan hô! Mít học giỏi quá!' : 'Ôi nhầm rồi! Mình thêm ảnh rõ hơn nhé.',
          state.feedback === 'yes' ? 'happy' : 'oops'
        );
        pose(state.feedback === 'yes' ? 'happy' : 'sad');
        window.dispatchEvent(new CustomEvent('mitFeedback', { detail: state.feedback }));
      })
  );
  $('#improve')?.addEventListener('click', () => go(1));
  $('#open-quiz').onclick = openQuiz;
  $('#start-round2').onclick = startRound2;
  $('#open-notebook-step3').onclick = openNotebook;
}

function render() {
  document.body.dataset.step = state.step;

  const pill = $('#round-pill');
  if (pill) pill.hidden = state.round !== 'q4';

  document.querySelectorAll('.journey [data-step]').forEach(b => {
    const s = +b.dataset.step;
    b.setAttribute('aria-current', s === state.step ? 'step' : 'false');
    const done =
      (s === 0 && validNames() && state.step > 0) ||
      (s === 1 && state.sets.every(x => x.length >= 3) && state.step > 1) ||
      (s === 2 && state.trained.length > 0 && state.step > 2) ||
      (s === 3 && state.history.length > 0);
    b.dataset.done = done ? 'true' : 'false';
    b.disabled = state.busy;
  });

  renderTrays();
  renderArena();
  renderSessionSummary();
}

function go(step) {
  if (state.busy) return;
  if (step === state.step) return;
  if (step > 0 && !validNames()) {
    if (state.round === 'q4' && isFlowerPair(state.names[0], state.names[1])) {
      setStatus('Lượt 2 (Q4) chọn cặp khác Hoa cúc – Hướng dương nhé!');
      say('Lượt 2 bạn chọn bộ ảnh khác với Hoa cúc và Hướng dương nhé!', 'need_diff');
    } else {
      setStatus('Đặt 2 tên khác nhau cho Khay A và Khay B nhé.');
    }
    $('#name-0')?.focus();
    return;
  }
  if (step >= 2 && state.sets.some(x => x.length < 3)) {
    state.step = 1;
    render();
    setStatus('Mỗi khay cần ít nhất 3 ảnh trước nhé.');
    return;
  }
  if (step === 3 && !state.trained.length) {
    state.step = 2;
    render();
    setStatus('Bấm Dạy Mít học trước khi thử ảnh nhé.');
    return;
  }

  state.step = step;
  setStatus('');
  window.MitSound?.play('step');

  if (step === 1) {
    warmUpNetwork();
    loadDatasets();
  }

  render();
  const hasBuiltIn = !!getActiveDataset();
  const stepVoiceKeys = [
    'welcome',
    hasBuiltIn ? 'step1' : 'step1_custom',
    'step2',
    'trained'
  ];
  const stepMsgs = [
    'Chào bạn! Chọn một kho ảnh hoặc tự đặt tên nhé!',
    hasBuiltIn
      ? 'Kéo ảnh bạn thích vào Khay A và Khay B. Mỗi khay ít nhất 3 ảnh nhé!'
      : 'Chụp hoặc chọn ít nhất 3 ảnh vào mỗi khay nhé!',
    'Bấm nút để Mít học từ các ảnh mẫu bạn vừa chọn nhé!',
    'Kéo ảnh mới vào ô thử tài xem Mít đoán đúng chưa nhé!'
  ];
  say(stepMsgs[step], stepVoiceKeys[step]);
  if (step === 2) pose('think');
}

document.querySelectorAll('.journey [data-step]').forEach(b => (b.onclick = () => go(+b.dataset.step)));

async function addFiles(i, files) {
  if (state.busy || !files.length) return;
  state.busy = true;
  render();
  setStatus('Đang thêm ảnh…');
  let errors = 0;
  let lastUrl = null;
  try {
    for (const f of files.slice(0, 20 - state.sets[i].length)) {
      try {
        const item = await imageFile(f);
        if (state.sets.flat().some(x => x.hash && x.hash === item.hash)) {
          URL.revokeObjectURL(item.url);
          errors++;
          continue;
        }
        state.sets[i].push(item);
        lastUrl = item.url;
      } catch {
        errors++;
      }
    }
    invalidate();
  } finally {
    state.busy = false;
    if (lastUrl) {
      window.MitSound?.play('pop');
      window.dispatchEvent(new CustomEvent('mitPhotoFly', { detail: { cls: i, url: lastUrl } }));
    }
    render();
    emitTrays(i);
    if (errors) setStatus(`Bỏ qua ${errors} ảnh bị trùng hoặc không mở được.`);
    else setStatus('');
  }
}

for (let i = 0; i < 2; i++) {
  const tray = $('#tray-' + i);
  if (!tray) continue;
  tray.addEventListener('dragover', e => {
    if (state.step !== 1 || state.busy) return;
    e.preventDefault();
    tray.classList.add('is-dragover');
  });
  tray.addEventListener('dragleave', () => tray.classList.remove('is-dragover'));
  tray.addEventListener('drop', e => {
    tray.classList.remove('is-dragover');
    if (state.step !== 1 || state.busy) return;
    e.preventDefault();
    const poolSrc = e.dataTransfer?.getData('application/x-mit-train');
    if (poolSrc) {
      const ds = getActiveDataset();
      const entry = ds?.train.find(x => x.src === poolSrc);
      if (entry) addPoolPhoto(entry, i);
      return;
    }
    const files = [...(e.dataTransfer?.files || [])];
    if (files.length) addFiles(i, files);
  });
}

function getNetworkWithTimeout() {
  if (state.net) return Promise.resolve(state.net);
  if (!window.tf || !window.mobilenet) {
    return Promise.reject(Error('Chưa tải được AI. Kiểm tra mạng rồi thử lại nhé.'));
  }
  warmUpNetwork();
  return new Promise((resolve, reject) => {
    let expired = false;
    const timer = setTimeout(() => {
      expired = true;
      reject(Error('Tải AI hơi lâu. Bấm Dạy Mít thử lại nhé.'));
    }, 45000);
    state.netPromise.then(
      net => {
        clearTimeout(timer);
        if (!expired) resolve(net);
      },
      err => {
        clearTimeout(timer);
        if (!expired) reject(err);
      }
    );
  });
}

async function train() {
  if (state.busy) return;
  if (state.sets.some(x => x.length < 3)) {
    go(1);
    return;
  }
  state.busy = true;
  render();
  setStatus('Mít đang mở bộ máy học…');
  emitTraining(true, 0.05);
  window.MitSound?.play('scan');
  try {
    const net = await getNetworkWithTimeout();
    const total = state.sets.flat().length;
    const features = [];
    for (let i = 0; i < 2; i++) {
      for (const item of state.sets[i]) {
        const doneCount = features.length + 1;
        emitTraining(true, doneCount / total);
        setStatus(`Đang học ảnh ${doneCount}/${total}…`);
        await tf.nextFrame();
        const vec = tf.tidy(() => Array.from(net.infer(item.img, true).dataSync()));
        features.push({ cls: i, vec, url: item.url, name: item.name });
      }
    }
    state.trained = features;
    state.step = 3;
    state.result = null;
    window.MitSound?.play('done');
    say('Học xong rồi! Kéo ảnh mới vào ô thử tài nhé!', 'trained');
    pose('happy');
  } catch (e) {
    state.trained = [];
    state.error = e.message;
    say('Chưa học được. Kiểm tra thông báo bên dưới nhé.', null);
  } finally {
    emitTraining(false, 0);
    state.busy = false;
    render();
    if (state.error) {
      setStatus(state.error);
      state.error = null;
    }
  }
}

async function testFile(file) {
  if (state.busy) return;
  try {
    const item = await imageFile(file);
    if (state.sets.flat().some(x => x.hash && x.hash === item.hash)) {
      URL.revokeObjectURL(item.url);
      setStatus('Ảnh này đã dùng khi học (kể cả khi đổi tên). Chọn ảnh mới nhé!');
      return;
    }
    await predict(item, false);
  } catch (e) {
    setStatus(e.message);
  }
}

async function predict(item, isOutside = false) {
  if (state.busy) return;
  if (!state.trained.length) {
    go(2);
    return;
  }
  state.busy = true;
  state.feedback = null;
  render();
  setStatus('Mít đang quan sát ảnh…');
  pose('think');
  try {
    await tf.nextFrame();
    const vec = tf.tidy(() => Array.from(state.net.infer(item.img, true).dataSync()));
    const prediction = MitClassifier.classify(state.trained, vec);
    state.result = {
      url: item.url,
      src: item.src || null,
      outsideName: item.outsideName || getActiveDataset()?.outsideName || '',
      ...prediction,
      isOutside
    };
    state.history = [
      { url: item.url, predName: state.names[prediction.cls], feedback: null, isOutside },
      ...state.history
    ].slice(0, 6);
    emitPredict(prediction);
    window.MitSound?.play('guess');
    say(
      isOutside
        ? `Mình đoán ${state.names[prediction.cls]} vì chỉ học 2 nhóm này!`
        : `Mình đoán là ${state.names[prediction.cls]}. Đúng chưa bạn?`,
      isOutside ? 'guess_outside' : prediction.cls === 0 ? 'guess_a' : 'guess_b'
    );
  } catch {
    state.error = 'Chưa đọc được ảnh. Thử ảnh khác nhé.';
    if (item.url.startsWith('blob:') && !state.sampleCache.has(item.src)) URL.revokeObjectURL(item.url);
  } finally {
    state.busy = false;
    render();
    if (state.error) {
      setStatus(state.error);
      state.error = null;
    }
  }
}

function clearWorksets() {
  state.sets.flat().forEach(x => {
    if (x.url.startsWith('blob:') && !state.sampleCache.has(x.src)) URL.revokeObjectURL(x.url);
  });
  state.history.forEach(h => {
    if (h.url.startsWith('blob:') && h.url !== state.result?.url) {
      // Leave cached sample URLs intact
      let cached = false;
      for (const v of state.sampleCache.values()) {
        if (v.url === h.url) {
          cached = true;
          break;
        }
      }
      if (!cached) URL.revokeObjectURL(h.url);
    }
  });
  state.sets = [[], []];
}

function startRound2() {
  if (state.busy) return;
  clearWorksets();
  invalidate();
  state.round = 'q4';
  state.datasetId = null;
  state.names = ['', ''];
  state.step = 0;
  state.poolOffset = 0;
  state.testOffset = 0;
  state.outsideIndex = 0;
  state.selectedSrc = null;
  $('#notebook-dialog')?.close();
  $('#quiz-dialog')?.close();
  document.querySelectorAll('.check input').forEach(x => (x.checked = false));
  window.MitSound?.play('step');
  render();
  emitTrays();
  say('Lượt 2 rồi! Hãy chọn một kho ảnh mới khác với lượt đầu nhé!', 'round2');
}

// Progressive 1-question-at-a-time Quiz Dialog
const QUIZ_ITEMS = [
  {
    q: 'Muốn biết Mít học tốt chưa, em dùng ảnh nào để thử?',
    choices: [
      { id: 'train', text: 'Ảnh đã bỏ vào khay lúc dạy' },
      { id: 'new', text: 'Ảnh mới chưa đưa vào khay học' }
    ],
    right: 'new',
    ok: 'Chính xác! Phải dùng ảnh mới chưa học để kiểm tra.',
    no: 'Chưa đúng: dùng lại ảnh đã học giống như xem lại đáp án cũ vậy!'
  },
  {
    q: 'Cách nào giúp Mít phân biệt ảnh tốt hơn?',
    choices: [
      { id: 'dup', text: 'Chép 10 bản giống hệt nhau của 1 ảnh' },
      { id: 'diverse', text: 'Thêm ảnh rõ, nhiều góc chụp và nền khác nhau' }
    ],
    right: 'diverse',
    ok: 'Đúng rồi! Ảnh đa dạng góc và nền giúp Mít học giỏi hơn.',
    no: '10 bản giống hệt không giúp Mít nhận ra vật ở góc chụp khác đâu.'
  },
  {
    q: 'Mít chỉ học 2 nhóm em dạy. Đưa ảnh một vật ngoài 2 nhóm (ảnh 🎁) vào, Mít có tự biết tên vật đó không?',
    choices: [
      { id: 'yes', text: 'Có, Mít tự biết mọi vật khác' },
      { id: 'no', text: 'Không, Mít chỉ chọn giữa 2 nhóm đã học' }
    ],
    right: 'no',
    ok: 'Chuẩn luôn! Mít chỉ chọn trong 2 nhóm em dạy, nên người dùng phải tự kiểm tra.',
    no: 'Chú ý nhé: Mít không tự biết thêm nhóm thứ 3 đâu!'
  }
];

function renderQuizModal() {
  const body = $('#quiz-body');
  if (!body) return;
  const i = state.quizIndex;
  const item = QUIZ_ITEMS[i];
  const chosen = state.quizAnswers[i];
  const correct = chosen === item.right;

  const dots = QUIZ_ITEMS.map((_, idx) => `<span class="q-dot ${idx < i ? 'done' : idx === i ? 'cur' : ''}"></span>`).join('');
  body.innerHTML =
    `<div class="quiz-dots">${dots}</div>` +
    `<p class="quiz-q">${i + 1}/3. ${item.q}</p>` +
    `<div class="qq-choices">${item.choices
      .map(c => `<button type="button" data-qans="${c.id}" aria-pressed="${chosen === c.id}">${c.text}</button>`)
      .join('')}</div>` +
    (chosen ? `<p class="qq-fb ${correct ? 'ok' : 'warn'}" role="status">${correct ? item.ok : item.no}</p>` : '') +
    `<div class="quiz-nav">` +
    (i > 0 ? `<button type="button" class="text-button" id="quiz-prev">← Câu trước</button>` : '') +
    (i < 2
      ? `<button type="button" class="primary" id="quiz-next" ${chosen ? '' : 'disabled'}>Câu tiếp →</button>`
      : `<button type="button" class="primary" id="quiz-done" ${chosen ? '' : 'disabled'}>Xong! Mở Phiếu Q4 →</button>`) +
    `</div>`;

  body.querySelectorAll('[data-qans]').forEach(btn => {
    btn.onclick = () => {
      state.quizAnswers[i] = btn.dataset.qans;
      window.MitSound?.play(btn.dataset.qans === item.right ? 'happy' : 'oops');
      renderQuizModal();
    };
  });
  $('#quiz-prev')?.addEventListener('click', () => {
    state.quizIndex--;
    renderQuizModal();
  });
  $('#quiz-next')?.addEventListener('click', () => {
    state.quizIndex++;
    renderQuizModal();
  });
  $('#quiz-done')?.addEventListener('click', () => {
    $('#quiz-dialog').close();
    openNotebook();
  });
}

function openQuiz() {
  renderQuizModal();
  $('#quiz-dialog')?.showModal();
}

$('#quiz-close').onclick = () => $('#quiz-dialog')?.close();

// Notebook & Q4 report
function renderSessionSummary() {
  const el = $('#session-summary');
  if (!el) return;
  const n0 = state.names[0].trim() || '(chưa đặt)';
  const n1 = state.names[1].trim() || '(chưa đặt)';
  el.innerHTML =
    `<span><strong>Chế độ:</strong> ${state.round === 'q3' ? 'Lượt 1 · Q3' : 'Lượt 2 · Q4'}</span>` +
    `<span><strong>Hai nhóm:</strong> ${esc(n0)} &amp; ${esc(n1)}</span>` +
    `<span><strong>Ảnh học:</strong> ${state.sets[0].length} + ${state.sets[1].length}</span>`;
}

function buildQ4Report() {
  const n0 = state.names[0].trim() || '...';
  const n1 = state.names[1].trim() || '...';
  const d = state.q4;
  return [
    'PHIẾU THỰC HÀNH BÀI 2 · VƯỜN HỌC CỦA MÍT (Q4 · 4.C5.MR2)',
    `Hai nhóm: ${n0} (${state.sets[0].length} ảnh) – ${n1} (${state.sets[1].length} ảnh)`,
    `Bộ dữ liệu: ${d.dataset.trim() || '(chưa ghi)'}`,
    `1. Đặt tên: ${d.step1.trim() || '(chưa ghi)'}`,
    `2. Xếp ảnh: ${d.step2.trim() || '(chưa ghi)'}`,
    `3. Dạy Mít: ${d.step3.trim() || '(chưa ghi)'}`,
    `4. Thử ảnh mới: ${d.step4.trim() || '(chưa ghi)'}`
  ].join('\n');
}

function syncQ4Preview() {
  const preview = $('#q4-preview');
  if (preview) preview.textContent = buildQ4Report();
}

function saveQ4Draft() {
  if (isEmbed()) return;
  try {
    localStorage.setItem(Q4_STORAGE_KEY, JSON.stringify(state.q4));
  } catch {}
}

function bindQ4Fields() {
  if (!isEmbed()) {
    try {
      const parsed = JSON.parse(localStorage.getItem(Q4_STORAGE_KEY) || 'null');
      if (parsed && typeof parsed === 'object') {
        for (const k of ['dataset', 'step1', 'step2', 'step3', 'step4']) {
          if (typeof parsed[k] === 'string') state.q4[k] = parsed[k];
        }
      }
    } catch {}
  }

  [
    ['#q4-dataset', 'dataset'],
    ['#q4-step1', 'step1'],
    ['#q4-step2', 'step2'],
    ['#q4-step3', 'step3'],
    ['#q4-step4', 'step4']
  ].forEach(([sel, key]) => {
    const el = $(sel);
    if (!el) return;
    el.value = state.q4[key] || '';
    el.addEventListener('input', () => {
      state.q4[key] = el.value;
      syncQ4Preview();
      saveQ4Draft();
    });
  });

  $('#fill-current-dataset').onclick = () => {
    const a = state.names[0].trim() || 'Nhóm A';
    const b = state.names[1].trim() || 'Nhóm B';
    state.q4.dataset = `${a} và ${b}`;
    $('#q4-dataset').value = state.q4.dataset;
    if (!state.q4.step1.trim()) {
      state.q4.step1 = `Đặt Khay A là ${a}, Khay B là ${b}.`;
      $('#q4-step1').value = state.q4.step1;
    }
    if (!state.q4.step2.trim() && state.sets.flat().length) {
      state.q4.step2 = `Kéo ${state.sets[0].length} ảnh ${a} và ${state.sets[1].length} ảnh ${b} vào khay.`;
      $('#q4-step2').value = state.q4.step2;
    }
    if (!state.q4.step3.trim() && state.trained.length) {
      state.q4.step3 = 'Bấm Dạy Mít học để máy học từ ảnh mẫu.';
      $('#q4-step3').value = state.q4.step3;
    }
    if (!state.q4.step4.trim() && state.result) {
      state.q4.step4 = `Kéo ảnh mới cho Mít đoán ${state.names[state.result.cls]}. Em tự kiểm tra lại.`;
      $('#q4-step4').value = state.q4.step4;
    }
    syncQ4Preview();
    saveQ4Draft();
  };
  syncQ4Preview();
}

function openNotebook() {
  renderSessionSummary();
  syncQ4Preview();
  $('#notebook-dialog')?.showModal();
}

$('#open-notebook').onclick = openNotebook;
$('#close-notebook').onclick = () => $('#notebook-dialog')?.close();

$('#copy').onclick = async () => {
  const hasAny = ['dataset', 'step1', 'step2', 'step3', 'step4'].some(k => state.q4[k].trim());
  if (!hasAny) {
    $('#copyStatus').textContent = 'Viết ít nhất 1 dòng trước nhé!';
    $('#q4-dataset')?.focus();
    return;
  }
  const text = buildQ4Report();
  try {
    await navigator.clipboard.writeText(text);
    $('#copyStatus').textContent = '✓ Đã sao chép! Dán nộp lên Azota nhé.';
    $('#manual-copy-wrap').hidden = true;
  } catch {
    $('#copyStatus').textContent = 'Sao chép ô bên dưới nhé:';
    $('#manual-copy-wrap').hidden = false;
    $('#manual-copy').value = text;
    $('#manual-copy').select();
  }
};

$('#reset').onclick = startRound2;

const soundBtn = $('#sound-btn');
if (soundBtn) {
  soundBtn.onclick = () => {
    const muted = window.MitSound?.setMuted(!window.MitSound.isMuted());
    soundBtn.textContent = muted ? '🔇' : '🔊';
    soundBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  };
}

const speakBtn = $('#speak-btn');
if (speakBtn) {
  speakBtn.hidden = false;
  speakBtn.onclick = () => {
    state.speechEnabled = !state.speechEnabled;
    speakBtn.setAttribute('aria-pressed', state.speechEnabled ? 'true' : 'false');
    if (state.speechEnabled) {
      speakVietnamese($('#speech').textContent, state.lastVoiceKey || 'welcome');
    } else {
      stopVoice();
    }
  };
}

bindQ4Fields();
loadDatasets();
render();
emitTrays();
