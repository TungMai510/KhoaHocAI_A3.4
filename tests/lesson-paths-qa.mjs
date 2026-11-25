import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

// Use the local HTTP server and Chrome CDP session from XEM_THU.md.
const base = 'http://127.0.0.1:8340/';
const endpoint = 'http://127.0.0.1:9340';
const target = await (await fetch(endpoint + '/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

const pending = new Map();
const errors = [];
let sequence = 0;
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const result = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) result.reject(new Error(message.error.message));
    else result.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params.exceptionDetails.text);
  } else if (message.method === 'Network.responseReceived') {
    const { url, status } = message.params.response;
    if (url.startsWith(base) && status >= 400) errors.push(`${status} ${url}`);
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true });
  assert(!response.exceptionDetails, JSON.stringify(response.exceptionDetails));
  return response.result.value;
}

async function waitFor(expression) {
  for (let attempt = 0; attempt < 160; attempt++) {
    if (await evaluate(expression)) return;
    await delay(50);
  }
  assert.fail(expression);
}

const suffix = '?classroom=moodle&embed=azota&flow=lesson1&x=a%2Bb&x=2';
const routes = [
  ['bai-1/', 'index.html', '#entry-title'],
  ['bai-1/bai1_hoc_lieu.html', 'bai1_hoc_lieu.html', '#h1'],
  ['bai-1/hl1_kham_pha.html', 'hl1_kham_pha.html', '#try-translate'],
  ['bai-1/hl2_mo_phong.html', 'hl2_mo_phong.html', '#model-host'],
  ['bai-1/hl3_luyen_tap.html', 'hl3_luyen_tap.html', '#quiz-next'],
  ['bai-2/', 'bai-2/', '#workbench'],
  ['bai-3/', 'bai3_y_tuong.html', '#q5-next'],
  ['bai-4/', 'bai4_cai_tien.html', '#l4-start'],
];

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  let checks = 0;
  for (const [width, height] of [[1366, 900], [390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: width < 600,
    });
    for (const [entry, legacy, selector] of routes) {
      const url = JSON.stringify(base + legacy + suffix + '#h1');
      await send('Page.navigate', { url: base + entry + suffix + '#h1' });
      await waitFor(`location.href === ${url} && !!document.querySelector(${JSON.stringify(selector)})`);
      await waitFor("document.readyState !== 'loading'");
      assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), entry);
      checks++;
    }
  }

  await send('Page.navigate', { url: base + 'bai1_hoc_lieu.html#h3' });
  await waitFor("location.hash === '#h3' && !!document.querySelector('#study')");
  await evaluate(`(() => {
    const field = document.querySelector('#study');
    field.value = 'Ví dụ kiểm thử cục bộ';
    field.dispatchEvent(new Event('input'));
  })()`);
  await send('Page.navigate', { url: base + 'bai-1/bai1_hoc_lieu.html#h3' });
  await waitFor(`location.pathname === '/bai1_hoc_lieu.html' &&
    location.hash === '#h3' && document.querySelector('#study')?.value === 'Ví dụ kiểm thử cục bộ'`);
  checks++;

  await send('Page.navigate', { url: base + 'azota-preview.html' });
  await waitFor("location.pathname === '/azota-preview.html' && !!document.querySelector('iframe')");
  await evaluate(`document.querySelector('iframe').src = 'bai-1/hl2_mo_phong.html${suffix}#main'`);
  await waitFor(`(() => {
    const frame = document.querySelector('iframe').contentWindow;
    return frame.location.href === ${JSON.stringify(base + 'hl2_mo_phong.html' + suffix + '#main')} &&
      frame.AzotaEmbed?.active && frame.Bai1Moodle &&
      frame.document.querySelector('.azota-expand[target="_blank"]')?.href === frame.location.href;
  })()`);
  checks++;

  assert.deepEqual(errors, []);
  console.log(`${checks} checks passed across route aliases, mobile layout, session draft and iframe.`);
} finally {
  socket.close();
  await fetch(endpoint + '/json/close/' + target.id);
}
