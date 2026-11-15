import fs from 'node:fs/promises';
await fs.mkdir('.preview',{recursive:true});
const base='http://127.0.0.1:8340/';
const targets=await (await fetch('http://127.0.0.1:9340/json')).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
let id=0;const pending=new Map(),errors=[],reports=[];
socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text);};
function c(method,params={}){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});}
async function e(expression){const r=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function check(condition,message){if(!await e(`(async()=>(${condition}))()`))throw Error(message);reports.push(message);}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expr){for(let i=0;i<60;i++){try{if(await e(expr))return;}catch{}await pause(50);}throw Error('Timeout: '+expr);}
async function nav(path){await c('Page.navigate',{url:base+path});await until(`document.readyState==='complete' && document.querySelector('#journey a')`);}
async function click(selector){await check(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});return !!b&&!!b.getClientRects().length&&!b.disabled;})()`,'Clickable: '+selector);await e(`document.querySelector(${JSON.stringify(selector)}).click()`);await pause(70);}
async function screenshot(name){await e('window.scrollTo(0,0)');const r=await c('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile('.preview/'+name+'.png',Buffer.from(r.data,'base64'));}
await c('Page.enable');await c('Runtime.enable');await c('Log.enable');await c('Page.bringToFront');await c('Emulation.setFocusEmulationEnabled',{enabled:true});
await c('Browser.grantPermissions',{origin:base,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
for(const [label,width,height] of [['desktop',1366,900],['mobile',390,844]]){
  await c('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:label==='mobile'});
  for(const path of ['index.html','hl1_kham_pha.html','hl2_mo_phong.html','hl3_luyen_tap.html','hl3_luyen_tap.html#q1']){
    await nav(path);await check('document.documentElement.scrollWidth<=innerWidth',`${label}: no horizontal overflow on ${path}`);
    await check(`Array.from(document.querySelectorAll('button, .btn, .journey a')).filter(b=>b.getClientRects().length).every(b=>b.getBoundingClientRect().height>=44)`,`${label}: touch targets >=44px on ${path}`);
    await check(`Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0)`,`${label}: images loaded on ${path}`);
    if(path==='index.html')await screenshot(label+'-home');
    if(path==='hl2_mo_phong.html')await screenshot(label+'-challenge');
    if(path.includes('#q1'))await screenshot(label+'-q1');
  }
  await nav('index.html');await click('.hero .btn');await until(`document.body.dataset.page==='explore'`);
  await click('#case-answers button:nth-child(2)');await check(`document.querySelector('#case-feedback').textContent.includes('Chưa đúng')`,'Explore incorrect feedback');
  await click('#case-answers button:nth-child(1)');await check(`document.querySelector('#case-feedback').textContent.includes('Đúng rồi')`,'Explore correct feedback');await click('#case-next');
  await click('#case-answers button:nth-child(1)');await check(`document.querySelector('#case-feedback').classList.contains('wrong')`,'Life case incorrect feedback');await click('#case-answers button:nth-child(2)');await click('#case-next');await until(`document.body.dataset.page==='challenge'`);
  await check(`document.querySelector('#reveal').disabled && document.querySelector('#ai-feedback').hidden`,'Prediction required before AI reveal');
  await click('[data-predict="Lon"]');await click('#reveal');await check(`document.querySelector('#ai-feedback').textContent.includes('“Chai”') && document.querySelector('#ai-feedback').textContent.includes('khoen kéo')`,'Blur feedback explains mistaken features');
  await click('#clear-photo');await check(`!document.querySelector('#photo-frame').classList.contains('blurred') && document.querySelector('#reveal').disabled`,'Clear image requires a fresh prediction');
  await click('[data-predict="Chưa chắc"]');await click('#reveal');await check(`!document.querySelector('#comparison').hidden && document.querySelector('#guess-blur').textContent.includes('Lon') && document.querySelector('#guess-clear').textContent.includes('Chưa chắc')`,'Comparison retains both student predictions');
  for(const i of [0,2,1]){await click(`[data-reflect="${i}"]`);await check(`document.querySelector('#reflection-feedback').classList.contains('wrong')===${i!==1}`,'Reflection explanation '+i);}
  await screenshot(label+'-comparison');
  await click('#challenge-reset');await check(`document.querySelector('#photo-frame').classList.contains('blurred') && document.querySelector('#comparison').hidden && document.querySelector('#challenge-next').hidden && document.querySelectorAll('#predictions [aria-pressed=true]').length===0`,'Challenge reset clears all rounds');
  await click('[data-predict="Chai"]');await click('#reveal');await click('#clear-photo');await click('[data-predict="Lon"]');await click('#reveal');await click('[data-reflect="1"]');await click('#challenge-next');await until(`document.body.dataset.page==='practice'`);
  const keys=[0,1,2,1];
  for(let q=0;q<4;q++){
    await check(`document.querySelector('#quiz-next').disabled`,'Quiz next requires choice '+q);
    for(let a=0;a<3;a++){await click(`#quiz-answers button:nth-child(${a+1})`);await check(`document.querySelector('#quiz-feedback').classList.contains('wrong')===${a!==keys[q]}`,'Quiz answer feedback '+q+'/'+a);}
    await click(`#quiz-answers button:nth-child(${keys[q]+1})`);await click('#quiz-next');
  }
  await check(`document.querySelector('#score').textContent.includes('4 / 4')`,'Quiz scores 4/4');await screenshot(label+'-score');
  await click('#quiz-again');await check(`document.querySelector('#quiz-count').textContent==='Câu 1 / 4' && document.querySelector('#quiz-feedback').hidden && document.querySelector('#quiz-next').disabled`,'Quiz reset clears score and answer');
  for(let q=0;q<4;q++){await click(`#quiz-answers button:nth-child(${(keys[q]+1)%3+1})`);await click('#quiz-next');}
  await check(`document.querySelector('#score').textContent.includes('0 / 4')`,'Quiz scores 0/4');await click('#quiz-summary a');await until(`!document.querySelector('#q1').hidden`);
  await check(`document.querySelector('.journey [aria-current=step]').textContent.includes('Nộp Q1')`,'Q1 progress step');
  await click('#copy');await check(`document.querySelector('#copy-status').textContent.includes('đủ cả hai')`,'Empty Q1 prompts student');
  await e(`document.querySelector('#study').value='Ứng dụng dịch có AI giúp em hiểu câu tiếng Anh.';document.querySelector('#life').value='Nhận dạng ảnh có AI giúp em phân loại chai và lon.';`);
  await click('#copy');await until(`document.querySelector('#copy-status').textContent.includes('Đã sao chép')`);
  await check(`(await navigator.clipboard.readText()).includes('1. Trong học tập: Ứng dụng dịch') && (await navigator.clipboard.readText()).includes('2. Trong đời sống: Nhận dạng ảnh')`,'Clipboard contains both actual answers');
  await e(`Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('Blocked for test')}})`);await click('#copy');await check(`!document.querySelector('#manual-copy').hidden && document.querySelector('#copy-output').value.includes('Nhận dạng ảnh')`,'Clipboard denied: manual copy fallback');
  await e(`delete navigator.clipboard.writeText`);
  await check(`document.querySelector('#azota').href==='https://azota.vn/vi/khoa-hoc/ireehs' && document.querySelector('#azota').target==='_blank'`,'Exact Azota link and new tab');
  await click('#azota');await pause(300);
  const tabs=(await c('Target.getTargets')).targetInfos;const azota=tabs.find(t=>t.url.startsWith('https://azota.vn/'));if(!azota)throw Error('Azota tab did not open');reports.push('Azota click opens correct external tab');await c('Target.closeTarget',{targetId:azota.targetId});
  await click('#back-practice');await until(`!document.querySelector('#quiz-summary').hidden`);await check(`document.querySelector('#score').textContent.includes('0 / 4')`,'Returning from Q1 preserves result');
  await click('#quiz-again');await check(`document.querySelector('#quiz-count').textContent==='Câu 1 / 4'`,'Can restart after returning from Q1');
}
await nav('hl3_luyen_tap.html#q1');await check(`!document.querySelector('#q1').hidden`,'Direct Q1 deep link opens');await click('#back-practice');await check(`!document.querySelector('#practice').hidden`,'Direct Q1 can return to unanswered quiz');
await nav('hl2_mo_phong.html');await c('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:1,mobile:true});await check('document.documentElement.scrollWidth<=innerWidth','320px screen has no horizontal overflow');
await fs.writeFile('.preview/test-results.json',JSON.stringify({browser:'Chrome 157 headless',checks:reports.length,errors,reports},null,2));
console.log(JSON.stringify({checks:reports.length,errors},null,2));socket.close();
