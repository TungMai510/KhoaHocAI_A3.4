'use strict';

(() => {
  const element = id => document.getElementById(id);
  const panels = [...document.querySelectorAll('.activity')];
  const readingCards = [...document.querySelectorAll('.reading-question')];
  const storage = window.SocEvidence.connect();
  const key = 'soc-evidence-draft-v1:' + (storage.identity || 'standalone');
  const fresh = () => ({
    version: 1, step: 1, reading: 0, finished: false,
    q1: { examplesMode: 'write', study: '', life: '' },
    q2: { translate: { sentence: '', prediction: '', opened: false, translation: '', comparison: '' },
          ocean: { opened: false, 'labels-used': '', 'ocean-result': '' } },
  });
  let baseline = storage.initial;
  let state = fresh();
  let protectedData = false;
  let dirty = false;
  let warning = '';
  const translation = () => state.q2.translate;
  const ocean = () => state.q2.ocean;

  function decode(raw) {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || ![1,2,3,4,5,6].includes(value.step) ||
        ![0,1,2,3].includes(value.reading) || !value.q1 || !value.q2?.translate ||
        !value.q2?.ocean || typeof value.finished !== 'boolean') throw new Error('Invalid lesson state');
    return value;
  }

  try {
    if (baseline) state = decode(baseline);
  } catch {
    protectedData = true;
  }
  try {
    const draft = JSON.parse(sessionStorage.getItem(key));
    if (draft && !protectedData && !storage.readOnly && !state.finished &&
        (baseline || storage.preview || !storage.identity) && draft.baseline === baseline) {
      state = decode(draft.payload);
      dirty = true;
      warning = 'Bản nháp chưa được gửi. Em có thể tiếp tục và thử lưu lại.';
    }
  } catch {
    // A damaged browser draft does not replace the saved LMS record.
  }

  function draft() {
    dirty = true;
    try {
      sessionStorage.setItem(key, JSON.stringify({ baseline, payload: JSON.stringify(state) }));
    } catch {
      // The current form stays available when storage is unavailable.
    }
  }

  const writtenExamples = () => state.q1.examplesMode === 'write' && !!state.q1.study.trim() && !!state.q1.life.trim();
  const hasObservation = value => !!value && value !== 'pending';
  const diaryReady = () => hasObservation(translation().translation) && !!translation().comparison &&
    hasObservation(ocean()['labels-used']) && hasObservation(ocean()['ocean-result']);
  const status = (text, error = false) => {
    const box = element('lesson-status');
    box.textContent = text;
    box.hidden = !text;
    box.dataset.error = String(error);
  };

  function submit(snapshot = state) {
    if (protectedData || storage.readOnly) return false;
    snapshot.q2.notes = {
      googleDich: {
        cauDaChon: translation().sentence ? label('sentence', translation().sentence) : '',
        duDoan: translation().prediction ? choice(translation().prediction) : '',
        ketQuaQuanSat: translation().translation ? label('translation', translation().translation) : '',
        doiChieu: translation().comparison ? label('comparison', translation().comparison) : '',
      },
      aiForOceans: {
        nhanDaDung: ocean()['labels-used'] ? label('labels-used', ocean()['labels-used']) : '',
        ketQuaQuanSat: ocean()['ocean-result'] ? label('ocean-result', ocean()['ocean-result']) : '',
      },
      nguon: 'Học sinh tự báo cáo',
    };
    if (!storage.save(snapshot, writtenExamples(), snapshot.finished && diaryReady())) {
      warning = 'Chưa gửi được kết quả. Giữ trang này mở rồi thử lại khi có kết nối.';
      status(warning, true);
      return false;
    }
    state = snapshot;
    baseline = JSON.stringify(snapshot);
    dirty = false;
    warning = '';
    try { sessionStorage.removeItem(key); } catch {}
    status('');
    return true;
  }

  const label = (id, value) => [...element(id).options].find(item => item.value === value)?.textContent.trim() || 'Chưa ghi';
  const choice = value => {
    const input = [...document.querySelectorAll('input[name="prediction"]')].find(input => input.value === value);
    return input?.closest('label').textContent.trim() || 'Chưa ghi';
  };

  const answers = [
    ['lan-output', 'text', 'Lan đọc lại lời cô trên màn hình. Em chọn lại nhé.'],
    ['nam-input', 'photo', 'Nam chụp món đồ bằng máy ảnh. Em chọn lại nhé.'],
    ['fix-word', 'sách', 'Nghe lại lời cô: “Mời cả lớp mở sách.”'],
  ];
  const bound = [
    ['study', () => state.q1], ['life', () => state.q1],
    ['sentence', translation], ['translation', translation], ['comparison', translation],
    ['labels-used', ocean], ['ocean-result', ocean],
  ];

  function render() {
    panels.forEach((panel, index) => { panel.hidden = index + 1 !== state.step; });
    element('lesson-step').textContent = 'Bước ' + state.step + ' trong 6';
    element('lesson-progress').value = state.step;
    element('lesson-back').hidden = state.finished || state.step === 1;
    element('lesson-next').hidden = state.finished || state.step === 6 || (state.step === 2 && state.reading < 3);
    element('finish').hidden = state.finished;
    element('onward').hidden = !state.finished;
    readingCards.forEach((card, index) => { card.hidden = index !== Math.min(state.reading, 2); });
    element('check-reading').hidden = state.reading === 3;
    element('check-reading').textContent = state.reading === 2 ? 'Kiểm tra' : 'Tiếp tục';
    element('example-fields').hidden = state.q1.examplesMode !== 'write';
    element('oral-note').hidden = state.q1.examplesMode !== 'tell';
    element('translate-observation').hidden = !translation().opened;
    element('ocean-observation').hidden = !ocean().opened;

    const translateLink = element('translate-tool');
    const canOpen = !!translation().sentence && !!translation().prediction;
    translateLink.setAttribute('aria-disabled', String(!canOpen));
    const tool = new URL('https://translate.google.com/');
    tool.search = new URLSearchParams({ sl: 'en', tl: 'vi', text: label('sentence', translation().sentence), op: 'translate' });
    translateLink.href = tool.href;

    element('review-translate').textContent =
      'Câu đã thử: ' + label('sentence', translation().sentence) +
      '\nEm đoán: ' + choice(translation().prediction) +
      '\nBản dịch em thấy: ' + label('translation', translation().translation) +
      '\nĐối chiếu: ' + label('comparison', translation().comparison);
    element('review-ocean').textContent =
      'Nhãn em đã dùng: ' + label('labels-used', ocean()['labels-used']) +
      '\nKết quả em thấy: ' + label('ocean-result', ocean()['ocean-result']);
    for (const link of element('h6').querySelectorAll('a[href^="#"]')) link.hidden = state.finished;
    if (protectedData) status('Bài đã lưu dùng phiên bản khác. Nhờ thầy cô mở lại học liệu.', true);
    else if (storage.readOnly) status('Chế độ xem trước. Kết quả ở chế độ này không được ghi.');
    else if (warning) status(warning, true);
    else if (state.finished) status(storage.preview
      ? 'Đã lưu trong bản xem thử.'
      : 'Đã gửi nhật ký. Thầy cô kiểm tra kết quả trong báo cáo Moodle.');
  }

  function move(step, focus = true) {
    state.step = step;
    history.replaceState(null, '', '#h' + step);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    render();
    if (focus) {
      panels[step - 1].querySelector('h1').focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  for (const [id, owner] of bound) {
    const field = element(id);
    field.value = owner()[id];
    field.addEventListener('input', () => {
      if (id === 'sentence' && translation().sentence !== field.value) {
        Object.assign(translation(), { opened: false, translation: '', comparison: '' });
        element('translation').value = '';
        element('comparison').value = '';
      }
      owner()[id] = field.value;
      draft();
      render();
    });
  }
  for (const [name, owner] of [['examplesMode', () => state.q1], ['prediction', translation]]) {
    for (const input of document.querySelectorAll('input[name="' + name + '"]')) {
      input.checked = owner()[name] === input.value;
      input.addEventListener('change', () => {
        owner()[name] = input.value;
        if (name === 'prediction') {
          translation().comparison = '';
          element('comparison').value = '';
        }
        draft();
        render();
      });
    }
  }
  element('recognition').addEventListener('click', event => {
    const answer = event.target.dataset.answer;
    if (!answer) return;
    const feedback = element('recognition-feedback');
    feedback.textContent = answer === 'yes'
      ? 'Đúng rồi. AI gợi ý cách phát âm để Mai luyện nói.'
      : 'Em xem lại gợi ý và thử chọn lần nữa nhé.';
    feedback.hidden = false;
  });

  element('reading-form').addEventListener('submit', event => {
    event.preventDefault();
    if (state.reading === 3) return;
    const [id, expected, hint] = answers[state.reading];
    const feedback = element('reading-feedback');
    if (element(id).value.trim().normalize('NFC').toLocaleLowerCase('vi') !== expected) {
      feedback.textContent = hint;
      feedback.hidden = false;
      element(id).focus();
      return;
    }
    state.reading++;
    draft();
    submit();
    feedback.hidden = state.reading !== 3;
    feedback.textContent = 'Đúng rồi! Lan kiểm tra lại và sửa thành “mở sách”.';
    render();
    element(state.reading === 3 ? 'lesson-next' : answers[state.reading][0]).focus();
  });

  element('translate-tool').addEventListener('click', event => {
    if (event.currentTarget.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      status('Em chọn câu và dự đoán một món trước nhé.', true);
      return;
    }
    translation().opened = true;
    draft();
    submit();
    render();
  });
  element('ocean-tool').addEventListener('click', () => {
    ocean().opened = true;
    draft();
    submit();
    render();
  });

  function go(step) {
    move(step);
    draft();
    submit();
    render();
  }
  element('lesson-back').addEventListener('click', () => go(state.step - 1));
  element('lesson-next').addEventListener('click', () => {
    if (state.step === 2 && state.reading < 3) return;
    if (state.step === 3 && state.q1.examplesMode === 'write' && !writtenExamples()) {
      status('Em ghi một ví dụ vào mỗi ô, hoặc chọn kể cho thầy cô.', true);
      element(state.q1.study.trim() ? 'life' : 'study').focus();
      return;
    }
    if (state.step === 4 && (!translation().opened || !translation().translation ||
        (hasObservation(translation().translation) && !translation().comparison))) {
      status('Em mở Google Dịch rồi chọn bản dịch em thấy và kết quả đối chiếu.', true);
      return;
    }
    if (state.step === 5 && (!ocean().opened || !ocean()['labels-used'] || !ocean()['ocean-result'])) {
      status('Em mở AI for Oceans rồi chọn thao tác và điều em quan sát.', true);
      return;
    }
    go(state.step + 1);
  });

  for (const link of element('h6').querySelectorAll('a[href^="#"]')) {
    link.addEventListener('click', event => {
      event.preventDefault();
      go(Number(link.hash.slice(2)));
    });
  }

  element('finish').addEventListener('click', () => {
    if (!diaryReady()) {
      status('Em còn thiếu kết quả của một lần thử. Bấm Sửa để quay lại công cụ.', true);
      return;
    }
    const snapshot = structuredClone(state);
    snapshot.finished = true;
    if (snapshot.q1.examplesMode === 'tell') {
      snapshot.q1.study = '';
      snapshot.q1.life = '';
    }
    if (!submit(snapshot)) return;
    render();
    element('onward').focus();
  });

  addEventListener('pagehide', () => {
    if (!dirty) storage.close();
  });
  addEventListener('pageshow', event => {
    if (event.persisted && !dirty) location.reload();
  });
  move(state.step, false);
})();
