'use strict';

(() => {
  const origin = 'https://nhom7ai-hcmue.moodlecloud.com';
  const search = new URLSearchParams(location.search);
  const active = search.get('classroom') === 'moodle' ||
    document.referrer.startsWith(origin + '/');
  if (!active) return;

  const examplesTitle = 'AI giúp em học và giúp mọi người làm gì?';
  const diaryTitle = 'Sóc hỏi: Em đưa gì cho máy? Máy trả lời gì?';
  window.Bai1Moodle = Object.freeze({
    examplesTitle,
    diaryTitle,
    url: path => origin + path
  });
  document.documentElement.classList.add('bai1-moodle');

  // Moodle's resource frame has a minimum width of 500 px, even on phones.
  function fitPhoneFrame() {
    const screenWidth = window.screen.width;
    const frameWidth = window.innerWidth;
    let contentWidth = 0;
    if (window.self !== window.top) {
      if (screenWidth <= 600 && frameWidth > screenWidth) {
        contentWidth = screenWidth - 32;
      } else if (frameWidth === 500 && screenWidth > 600) {
        // Some cross-origin frames report the desktop screen during mobile emulation.
        contentWidth = 352;
      }
    }
    document.documentElement.style.maxWidth = contentWidth ? `${contentWidth}px` : '';
  }
  fitPhoneFrame();
  window.addEventListener('resize', fitPhoneFrame);

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.moodle-only').forEach(element => {
      element.hidden = false;
    });
    document.querySelectorAll('[data-moodle-text]').forEach(element => {
      element.textContent = element.dataset.moodleText;
    });
    document.querySelectorAll('a[data-moodle-href]').forEach(link => {
      link.href = origin + link.dataset.moodleHref;
      link.target = '_top';
      link.classList.add('azota-expand');
    });
  });
})();
