import fs from 'node:fs/promises';

// Run with HTTP 8340 and a separate Chrome CDP session on 9340.
await fs.mkdir('.preview', {recursive:true});
const base='http://127.0.0.1:8340/';
const tabs=await (await fetch('http://127.0.0.1:9340/json')).json();
const target=tabs.find(t=>t.type==='page'&&t.url.startsWith(base))||tabs.find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let id=0;
const pending=new Map(),errors=[],reports=[];
socket.onmessage=({data})=>{
  const m=JSON.parse(data);
  if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}
  else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
  else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text);
};
function c(method,params={}){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});}
async function e(expression){const r=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function check(condition,message){if(!await e(`(async()=>(${condition}))()`))throw Error(message);reports.push(message);}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(expression){for(let i=0;i<100;i++){try{if(await e(expression))return;}catch{}await pause(50);}throw Error('Timeout: '+expression);}
async function nav(path){await c('Page.navigate',{url:base+path});await until(`document.readyState==='complete'&&location.href.startsWith(${JSON.stringify(base+path)})`);await pause(60);}
async function click(selector){await check(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});return !!b&&!!b.getClientRects().length&&!b.disabled;})()`,'Can operate '+selector);await e(`document.querySelector(${JSON.stringify(selector)}).click()`);await pause(60);}
async function fill(selector,value){await e(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
async function keyboardActivate(selector){await e(`document.querySelector(${JSON.stringify(selector)}).focus()`);await c('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await c('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(60);}
async function screenshot(name){const r=await c('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile('.preview/'+name+'.png',Buffer.from(r.data,'base64'));}
async function clipboardDenied(){await e(`Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('Denied for QA')}})`);}
async function clipboardRestore(){await e('delete navigator.clipboard.writeText');}
async function checkLayout(label,selectors=[]){
  await check('document.documentElement.scrollWidth<=innerWidth',`${label}: page has no horizontal overflow`);
  for(const selector of selectors){
    await check(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});return !!el&&el.clientWidth>0&&el.scrollWidth<=el.clientWidth;})()`,`${label}: ${selector} content fits its visible width`);
  }
}


try {
await c('Page.enable');await c('Runtime.enable');await c('Log.enable');await c('Network.enable');await c('Network.setCacheDisabled',{cacheDisabled:true});await c('Page.bringToFront');await c('Emulation.setFocusEmulationEnabled',{enabled:true});await c('Browser.grantPermissions',{origin:base,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
async function pasteCheck(selector,expected){await click(selector);const copied=await e('navigator.clipboard.readText()');for(const part of expected)if(!copied.includes(part))throw Error('Clipboard missing '+part);await e(`(()=>{const t=document.createElement('textarea');t.id='paste-proof';document.body.append(t);t.focus()})()`);await c('Input.insertText',{text:copied});await check(`document.querySelector('#paste-proof').value===${JSON.stringify(copied.replaceAll(String.fromCharCode(13),String()))}`,'Pasted clipboard contains all required fields');await e("document.querySelector('#paste-proof').remove()");}
for(const [label,width,height] of [['desktop',1366,900],['mobile',390,844]]){
await c('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:label==='mobile'});
await nav('khoa_hoc.html');
await click('a[href="index.html"]');
await until("location.pathname.endsWith('/index.html') && !!document.querySelector('#entry-title')");
await nav('khoa_hoc.html');
for(const href of ['bai3_y_tuong.html','bai4_cai_tien.html']) {
  await click(`a[href="${href}"]`);
  await until(`location.pathname.endsWith('${href}') && !!document.querySelector('a.course-link')`);
  await click('a.course-link');
  await until("location.pathname.endsWith('khoa_hoc.html')");
}
await nav('bai3_y_tuong.html');await click('[data-q5-choice="waste"]');await click('#q5-next');await click('[data-q5-choice="1"]');await check("document.querySelector('#q5-next').disabled",'Wrong example data needs correction');await click('[data-q5-choice="0"]');await click('#q5-next');await click('[data-q5-choice="0"]');await click('#q5-next');await check("!document.querySelector('#q5-write').hidden",'Example leads to own two ideas');await click('#own-preview');await check("!document.querySelector('#own-feedback').hidden",'Both own ideas required');
for(const i of [1,2]){await fill('#own-problem-'+i,'Vấn đề riêng '+i);await fill('#own-support-'+i,'AI hỗ trợ việc '+i);}await click('#own-preview');await pasteCheck('#idea-copy',['Vấn đề riêng 1','Vấn đề riêng 2','AI hỗ trợ việc 1','AI hỗ trợ việc 2']);await click('#q6-open');await e("document.querySelector('#q6-choice').value='1';document.querySelector('#q6-choice').dispatchEvent(new Event('change'))");await check("document.querySelector('#q6-problem').value==='Vấn đề riêng 2'",'Q6 develops chosen Q5 idea');await check("document.querySelectorAll('#idea-form textarea').length===4",'Q6 exactly four text fields');await click('#q6-generate');await check("!document.querySelector('#q6-feedback').hidden",'All four Q6 parts required');await fill('#q6-data','Ảnh rõ của đồ vật');await fill('#q6-user','Các bạn trong lớp');await click('#q6-generate');await pasteCheck('#idea-copy',['Ý tưởng 1','Ý tưởng 2','Vấn đề riêng 1','Vấn đề riêng 2','Dữ liệu: Ảnh rõ','Kết quả: AI hỗ trợ việc 2','Người sử dụng: Các bạn']);await check('document.documentElement.scrollWidth<=innerWidth','Idea preview fits screen');await screenshot('aligned-'+label+'-idea');
await nav('bai4_cai_tien.html');await click('#l4-start');const images=[];
for(let i=0;i<6;i++){images.push(await e("document.querySelector('#l4-image').getAttribute('src')"));await check(`document.querySelector('#l4-image').dataset.imageId==='T${i+1}'`,'T row identifier matches');await click(`[data-judge="${i<4?'correct':'wrong'}"]`);if(i>=4)await click('[data-reason="0"]');await click('#l4-next-baseline');}
await check("document.querySelector('#l4-before-count').textContent==='4 / 6'",'Baseline 4/6');await click('[data-improvement="photos"]');await click('#l4-start-retest');let correct=0;
for(let i=0;i<6;i++){await check(`document.querySelector('#l4-retest-image').getAttribute('src')===${JSON.stringify(images[i])}`,'Same test image on retest');await click('#l4-run-retest');const result=await e("document.querySelector('#l4-retest-result').textContent");if(result==='Đúng')correct++;if(i===4)await check("document.querySelector('#l4-retest-result').textContent==='Sai'",'T5 remains wrong');await click('#l4-next-retest');}
if(correct!==5)throw Error('Expected five correct retests');await check("document.querySelector('#l4-after-count').textContent.includes('5 / 6')",'After 5/6');for(const [key,value] of [['error','T5 đoán nhầm lon thành chai'],['change','Thêm ảnh rõ nhiều góc'],['result','4/6 lên 5/6']])await fill('#l4-'+key,value);await click('#l4-preview-report');await check("!document.querySelector('#l4-report-stage').hidden",'Human explanation required');await fill('#l4-reflection','T5 vẫn sai sau cải tiến nên con người cần kiểm tra lại vật thật.');await click('#l4-preview-report');await pasteCheck('#l4-copy-report',['T5 đoán nhầm','Thêm ảnh rõ','4/6 lên 5/6','T5 vẫn sai sau cải tiến']);await check('document.documentElement.scrollWidth<=innerWidth','Report fits screen');await screenshot('aligned-'+label+'-report');await click('#l4-reset');await check("document.querySelector('#l4-reflection').value===''",'Reset clears reflection');
}
if(errors.length)throw Error(errors.join(';'));await fs.writeFile('.preview/course-test-results.json',JSON.stringify({checks:reports.length,errors,reports},null,2));console.log(JSON.stringify({checks:reports.length,errors}));
} finally {socket.close();}
