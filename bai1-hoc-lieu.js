'use strict';

(() => {
  const get = id => document.getElementById(id);
  const panels = [...document.querySelectorAll('.activity')];
  const fields = [...document.querySelectorAll('textarea[id], select[id], input[id]')]
    .filter(field => field.id !== 'copy-output');
  const readingQuestions = [...document.querySelectorAll('.reading-question')];
  const moodle = window.Bai1Moodle;
  const storageKey = 'ai4.lesson1.draft.v1';
  const diaryFields = ['translate-action', 'translate-observed', 'ocean-diary-action', 'ocean-diary-result'];

  function read(key) {
    try {
      const value = JSON.parse(sessionStorage.getItem(key));
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  const draft = read(storageKey);
  const flow = read(storageKey + '.steps');
  for (const field of fields) {
    if (typeof draft[field.id] === 'string' && draft[field.id].length <= 1800) field.value = draft[field.id];
  }
  let readingPart = Number.isInteger(flow.readingPart) && flow.readingPart >= 0 &&
    flow.readingPart < readingQuestions.length ? flow.readingPart : 0;
  const value = id => get(id).value.trim();
  const hasExampleDraft = () => Boolean(value('study') || value('life'));
  const stepIndex = () => Math.max(0, panels.findIndex(panel => '#' + panel.id === location.hash));
  const copyStatus = get('copy-status');
  const copyOutput = get('copy-output');

  function message(text) {
    copyStatus.textContent = text;
    copyStatus.hidden = !text;
  }

  function save() {
    for (const field of fields) draft[field.id] = field.value;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
      sessionStorage.setItem(storageKey + '.steps', JSON.stringify(flow));
    } catch {
      message('Bản nháp chỉ còn ở trang này. Em hãy sao chép trước khi đóng.');
    }
  }

  // A visit only changes the next instruction. The external tool or Moodle
  // records its own answers, submissions and scores.
  function updateTool(prefix, visited, label) {
    const link = get(prefix + '-tool');
    link.className = visited ? 'quiet-action' : 'btn';
    link.textContent = (visited ? 'Mở lại ' : 'Mở ') + label;
    get(prefix + '-diary').hidden = !visited;
  }

  function copyButton(id, copied, label) {
    const button = get(id);
    button.className = copied || !moodle ? 'quiet-action' : 'btn';
    button.textContent = copied ? 'Sao chép lại' : label;
  }

  // Fullscreen stays in this frame so the pupil keeps the same draft.
  if (window.self !== window.top && document.fullscreenEnabled) {
    const expand = get('lesson-expand');
    expand.hidden = false;
    expand.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch { message('Chưa mở rộng được. Em vẫn có thể học ngay tại đây.'); }
    });
    document.addEventListener('fullscreenchange', () => {
      const label = document.fullscreenElement ? 'Thu nhỏ hoạt động' : 'Mở rộng hoạt động';
      expand.setAttribute('aria-label', label);
      expand.title = label;
    });
  }

  function reviewDiary() {
    for (const id of diaryFields) {
      const label = id.endsWith('action') ? 'Em đã làm: ' : 'Máy trả lại: ';
      get('review-' + id).textContent = label + (value(id) || 'Chưa ghi');
    }
    get('pending-field').hidden = diaryFields.every(id => value(id)) && !value('pending');
  }

  function render() {
    const index = stepIndex();
    const panel = panels[index];
    for (const item of panels) item.hidden = item !== panel;
    get('lesson-step').textContent = 'Bước ' + (index + 1) + ' / ' + panels.length;
    get('lesson-progress').value = index + 1;
    const back = get('lesson-back');
    back.hidden = index === 0;
    back.hash = index ? panels[index - 1].id : panels[0].id;

    const next = get('lesson-next');
    next.hidden = false;
    next.textContent = 'Tiếp tục';
    next.target = '_self';
    next.href = '#' + panels[Math.min(index + 1, panels.length - 1)].id;

    if (panel.id === 'h2') {
      readingQuestions.forEach((item, i) => item.hidden = i !== readingPart);
      get('check-reading').textContent = readingPart === readingQuestions.length - 1 ? 'Kiểm tra' : 'Tiếp tục';
      get('check-reading').hidden = Boolean(flow.reading);
      next.hidden = !flow.reading;
    }
    if (panel.id === 'h3') {
      // Existing drafts are still editable and copyable. A pupil starting
      // in Moodle can write directly in the actual assignment, just once.
      const direct = moodle && !hasExampleDraft();
      get('q1-form').hidden = Boolean(direct);
      copyButton('examples-copy', flow.examplesCopied, 'Sao chép hai ví dụ');
      const submit = get('examples-submit');
      submit.hidden = !moodle || (!direct && !flow.examplesCopied);
      submit.className = flow.examplesOpened ? 'quiet-action' : 'btn';
      submit.textContent = flow.examplesOpened ? 'Mở lại bài viết' :
        direct ? 'Viết hai ví dụ trên Moodle' : 'Mở bài nộp trên Moodle';
      get('examples-instruction').textContent = moodle && flow.examplesOpened
        ? 'Nộp xong hai ví dụ trên Moodle, em quay lại đây và bấm Tiếp tục.'
        : 'Kể một việc AI giúp em học và một việc AI giúp trong cuộc sống.';
      next.hidden = Boolean(moodle && !flow.examplesOpened);
    }
    if (panel.id === 'h4') {
      updateTool('translate', flow.translateOpened, 'Google Dịch');
      get('translate-setup').hidden = Boolean(flow.translateOpened);
      get('translate-instruction').textContent = flow.translateOpened
        ? 'Câu em chọn: “' + get('sentence').value + '”'
        : 'Gõ câu em chọn vào Google Dịch, rồi quay lại đây.';
      next.hidden = !flow.translateOpened;
    }
    if (panel.id === 'h5') {
      updateTool('ocean', flow.oceanOpened, 'AI for Oceans');
      get('ocean-instruction').hidden = Boolean(flow.oceanOpened);
      next.hidden = !flow.oceanOpened;
    }
    if (panel.id === 'h6') {
      reviewDiary();
      copyButton('diary-copy', flow.diaryCopied, 'Sao chép nhật ký');
      const submit = get('diary-submit');
      submit.hidden = !moodle || !flow.diaryCopied;
      submit.className = flow.diaryOpened ? 'quiet-action' : 'btn';
      submit.textContent = flow.diaryOpened ? 'Mở lại bài nộp' : 'Mở bài nộp trên Moodle';
      const instruction = get('submit-instruction');
      instruction.hidden = !moodle || !flow.diaryCopied;
      instruction.textContent = flow.diaryOpened ? 'Nộp xong, em quay lại đây để vào quầy của Sóc.' : 'Dán nhật ký vào bài nộp trên Moodle rồi quay lại đây.';
      next.hidden = Boolean(moodle && !flow.diaryOpened);
      get("moodle-food-video").hidden = !moodle || next.hidden;
      next.textContent = 'Vào quầy của Sóc';
      next.href = moodle ? moodle.url('/mod/scorm/view.php?id=66') : 'quay-mon-ngon/index.html?flow=lesson1';
      next.target = moodle ? '_top' : '_self';
    }
    get('shared-device').hidden = !fields.some(field => field.matches('textarea,input') && field.value) &&
      !flow.examplesOpened && !flow.translateOpened && !flow.oceanOpened;
  }

  function route(focus) {
    message('');
    copyOutput.hidden = true;
    get('shared-device').open = false;
    render();
    if (focus) {
      panels[stepIndex()].querySelector('h1').focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }
  addEventListener('hashchange', () => route(true));

  for (const field of fields) {
    field.addEventListener('input', () => {
      if (field.closest('#reading-form')) {
        flow.reading = false;
        get('reading-feedback').hidden = true;
      }
      if (field.closest('#q1-form')) {
        flow.examplesCopied = false;
        flow.examplesOpened = false;
      }
      if (diaryFields.includes(field.id) || field.id === 'pending') {
        flow.diaryCopied = false;
        flow.diaryOpened = false;
      }
      message('');
      copyOutput.hidden = true;
      render();
      save();
    });
  }

  get('reading-form').addEventListener('submit', event => {
    event.preventDefault();
    const answers = [
      ['lan-output', 'text', 'Lan đọc lại lời cô trên màn hình. Em chọn lại nhé.'],
      ['nam-input', 'photo', 'Nam chụp món đồ bằng máy ảnh. Em chọn lại nhé.'],
      ['fix-word', 'sách', 'Nghe lại lời cô: “Mời cả lớp mở sách.”']
    ];
    const [id, answer, hint] = answers[readingPart];
    const field = get(id);
    if (!field.reportValidity()) return;
    const correct = value(id).normalize('NFC').toLocaleLowerCase('vi') === answer;
    const result = get('reading-feedback');
    if (!correct) {
      result.textContent = hint;
      result.hidden = false;
      field.focus();
      return;
    }
    result.hidden = true;
    if (readingPart < readingQuestions.length - 1) {
      readingPart++;
      flow.readingPart = readingPart;
      render();
      readingQuestions[readingPart].querySelector('select,input').focus();
    } else {
      result.textContent = 'Đúng rồi! Lan nghe lại lời cô để sửa chữ “sạch” thành “sách”.';
      result.hidden = false;
      flow.reading = true;
      render();
      get('lesson-next').focus();
    }
    save();
  });

  get('lesson-back').addEventListener('click', event => {
    if (panels[stepIndex()].id === 'h2' && readingPart > 0) {
      event.preventDefault();
      readingPart--;
      flow.readingPart = readingPart;
      flow.reading = false;
      get('reading-feedback').hidden = true;
      render();
      save();
      readingQuestions[readingPart].querySelector('select,input').focus();
    }
  });

  function onOpen(id, flag) {
    get(id).addEventListener('click', event => {
      if (id === 'translate-tool' && !flow.translateOpened && !value('food-guess')) {
        event.preventDefault();
        message('Em chọn một món hoặc chọn “Em chưa chắc” nhé.');
        get('food-guess').focus();
        return;
      }
      message('');
      flow[flag] = true;
      render();
      save();
    });
  }
  if (moodle) {
    get('examples-submit').href = moodle.url('/mod/assign/view.php?id=59');
    get('diary-submit').href = moodle.url('/mod/assign/view.php?id=60');
    onOpen('examples-submit', 'examplesOpened');
    onOpen('diary-submit', 'diaryOpened');
  }
  onOpen('translate-tool', 'translateOpened');
  onOpen('ocean-tool', 'oceanOpened');

  async function copyThenContinue(text, flag) {
    const startHash = location.hash;
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch { /* A school browser or iframe can require manual copying. */ }
    if (location.hash !== startHash) return;
    // A manual copy is offered before showing the next action. Neither
    // branch treats placing text on the clipboard as an LMS submission.
    flow[flag] = true;
    render();
    save();
    if (copied) {
      message(moodle ? 'Đã sao chép. Dán phần trả lời vào bài nộp trên Moodle.' : 'Đã sao chép phần trả lời của em.');
      const primary = panels[stepIndex()].querySelector('a.btn:not([hidden])') || get('lesson-next');
      primary.focus();
    } else {
      copyOutput.value = text;
      copyOutput.hidden = false;
      message('Em sao chép phần chữ đã chọn bên dưới.');
      copyOutput.focus();
      copyOutput.select();
    }
  }

  function examplesReady() {
    if (value('study') && value('life')) return true;
    message('Em ghi một ví dụ vào mỗi ô nhé.');
    get(value('study') ? 'life' : 'study').focus();
    return false;
  }
  function diaryReady() {
    if (diaryFields.every(id => value(id)) || value('pending')) return true;
    message('Em sửa phần còn trống hoặc ghi việc em cần thử lại.');
    get('pending').focus();
    return false;
  }
  get('lesson-next').addEventListener('click', event => {
    if (moodle) return;
    const id = panels[stepIndex()].id;
    if ((id === 'h3' && !examplesReady()) || (id === 'h6' && !diaryReady())) {
      event.preventDefault();
    }
  });

  get('q1-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!examplesReady()) return;
    copyThenContinue('AI giúp em học và giúp mọi người làm gì?\nKhi em học bài: ' + value('study') +
      '\nTrong cuộc sống: ' + value('life'), 'examplesCopied');
  });
  get('q2-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!diaryReady()) return;
    const lines = [
      'Sóc hỏi: Em đưa gì cho máy? Máy trả lời gì?',
      'Lần em thử dịch', value('translate-action'), value('translate-observed'),
      'Lần em thử với ảnh', value('ocean-diary-action'), value('ocean-diary-result')
    ];
    if (value('pending')) lines.push('Cần thử lại: ' + value('pending'));
    copyThenContinue(lines.join('\n'), 'diaryCopied');
  });

  get('clear-draft').addEventListener('click', () => {
    if (!confirm('Xóa bản nháp trong thẻ này để bạn khác bắt đầu?')) return;
    for (const field of fields) {
      if (field.tagName === 'SELECT') field.selectedIndex = 0;
      else field.value = '';
    }
    Object.keys(draft).forEach(key => delete draft[key]);
    Object.keys(flow).forEach(key => delete flow[key]);
    try {
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey + '.steps');
    } catch { /* In-memory fields have already been cleared. */ }
    get('reading-feedback').hidden = true;
    copyOutput.value = '';
    readingPart = 0;
    location.hash = 'h1';
    route(true);
  });
  route(false);
})();
