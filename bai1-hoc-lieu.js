'use strict';
(() => {
  const get = id => document.getElementById(id);
  const storageKey = 'ai4.lesson1.draft.v1';
  const fields = [...document.querySelectorAll('textarea[id], input[id], select[id]')]
    .filter(field => field.id !== 'copy-output');
  function saveDraft() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(fields.map(field => [field.id, field.value]))));
    } catch {
      get('copy-status').textContent = 'Chưa giữ được bản nháp khi tải lại trang. Em hãy sao chép phiếu trước khi đóng.';
    }
  }
  try {
    const draft = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    for (const field of fields) {
      if (typeof draft[field.id] === 'string' && draft[field.id].length <= 1800) field.value = draft[field.id];
    }
  } catch { /* The current page remains usable when browser storage is unavailable. */ }
  fields.forEach(field => field.addEventListener('input', saveDraft));
  function reviewDiary() {
    for (const id of ['translate-action', 'translate-observed', 'ocean-diary-action', 'ocean-diary-result']) {
      const label = id.endsWith('action') ? 'Em đã làm: ' : 'Máy trả lại: ';
      get('review-' + id).textContent = label + (get(id).value.trim() || 'Em chưa ghi. Quay lại hoạt động để điền hoặc ghi lượt cần bù.');
    }
  }
  function route() {
    const hash = /^#h[1-6]$/.test(location.hash) ? location.hash : '#h1';
    document.querySelectorAll('.activity').forEach(section => section.hidden = '#' + section.id !== hash);
    document.querySelectorAll('.activity-tabs a').forEach(link => {
      if (link.hash === hash) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    reviewDiary();
    get('copy-status').textContent = '';
    get('copy-output').hidden = true;
  }
  addEventListener('hashchange', route);
  route();
  get('check-reading').onclick = () => {
    const correct = get('lan-output').value === 'text' && get('nam-input').value === 'photo' &&
      get('fix-word').value.trim().normalize('NFC').toLocaleLowerCase('vi') === 'sách';
    get('reading-feedback').textContent = correct
      ? 'Đúng rồi! Lan nhận dòng chữ, Nam đưa ảnh vào. Nghe lại lời cô giúp em sửa thành “sách”.'
      : 'Em đọc lại: Lan đọc lời cô trên màn hình. Nam chụp một món đồ. Nghe lời cô rồi sửa chữ còn nhầm nhé.';
  };
  const value = id => get(id).value.trim();
  async function copy(text) {
    get('copy-output').hidden = true;
    try {
      await navigator.clipboard.writeText(text);
      get('copy-status').textContent = 'Đã sao chép. Em nộp tại mục thầy cô giao hoặc ghi vào phiếu riêng.';
    } catch {
      get('copy-output').value = text;
      get('copy-output').hidden = false;
      get('copy-output').focus();
      get('copy-output').select();
      get('copy-status').textContent = 'Em sao chép nội dung đã chọn bên dưới.';
    }
  }
  get('q1-form').onsubmit = event => {
    event.preventDefault();
    copy('Q1 – Hai việc AI có thể giúp\nTrong học tập: ' + value('study') + '\nTrong đời sống: ' + value('life'));
  };
  get('q2-form').onsubmit = event => {
    event.preventDefault();
    const ids = ['translate-action', 'translate-observed', 'ocean-diary-action', 'ocean-diary-result'];
    if (ids.some(id => !value(id)) && !value('pending')) {
      get('copy-status').textContent = 'Em ghi đủ hai lượt, hoặc ghi rõ lượt cần làm bù.';
      get('pending').focus();
      return;
    }
    copy('Q2 – Nhật ký hai lượt thực hành\nGoogle Dịch\nEm làm: ' + value('translate-action') +
      '\nEm thấy: ' + value('translate-observed') + '\nAI for Oceans\nEm làm: ' +
      value('ocean-diary-action') + '\nEm thấy: ' + value('ocean-diary-result') +
      '\nCần bù hoặc kiểm tra thêm: ' + value('pending'));
  };
  document.querySelectorAll('a.external-tool').forEach(link => link.classList.add('azota-expand'));
  get('clear-draft').onclick = () => {
    if (!confirm('Em đã sao chép hoặc nộp phiếu chưa? Xóa bản nháp trên trang này để bạn tiếp theo dùng máy?')) return;
    document.querySelectorAll('textarea,input').forEach(input => input.value = '');
    document.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    try { sessionStorage.removeItem(storageKey); } catch {}
    get('reading-feedback').textContent = '';
    location.hash = 'h1';
    route();
  };
})();
