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


async function f(expr){return e(`document.querySelector('iframe').contentWindow.eval(${JSON.stringify(expr)})`);}
async function frameClick(selector){await f(`document.querySelector(${JSON.stringify(selector)}).click()`);await pause(80);}
async function shotFrame(name){const r=await e("(()=>{const r=document.querySelector('iframe').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()");const img=await c('Page.captureScreenshot',{format:'png',clip:r});await fs.writeFile('.preview/'+name+'.png',Buffer.from(img.data,'base64'));}
try {
await c('Page.enable');await c('Runtime.enable');await c('Log.enable');await c('Network.enable');await c('Network.setCacheDisabled',{cacheDisabled:true});await c('Page.bringToFront');
for(const [label,width,height] of [['desktop',1100,780],['mobile',414,850]]){
await c('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:label==='mobile'});
for(const legacy of [false,true]){
await nav('azota-preview.html'+(legacy?'?legacy=1':''));await until("document.querySelector('iframe')?.contentWindow.AzotaEmbed?.active");
await check("document.querySelector('iframe').contentWindow.getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('header')).display==='none'",label+' hides header');
await check("document.querySelector('iframe').contentDocument.querySelectorAll('[data-food]').length===3",'Three cards immediately present');
if(label==='desktop')await check("(()=>{const d=document.querySelector('iframe').contentDocument;return [...d.querySelectorAll('[data-food],#try-translate')].every(b=>b.getBoundingClientRect().top>=0&&b.getBoundingClientRect().bottom<=540)})()",'All cards and translate button within 540px');
if(!legacy)await shotFrame('embed-'+label+'-before');
for(const selector of ['[data-food="apple"]','#try-translate']){const r=await e(`(()=>{const frame=document.querySelector('iframe'),p=frame.getBoundingClientRect(),b=frame.contentDocument.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:p.x+b.x+b.width/2,y:p.y+b.y+b.height/2};})()`);await c('Input.dispatchMouseEvent',{type:'mousePressed',...r,button:'left',clickCount:1});await c('Input.dispatchMouseEvent',{type:'mouseReleased',...r,button:'left',clickCount:1});await pause(80);}await check("!document.querySelector('iframe').contentDocument.querySelector('#translation-panel').hidden",'Translation replaces chooser');if(!legacy)await shotFrame('embed-'+label+'-after');
await frameClick('[data-check="milk"]');await check("document.querySelector('iframe').contentDocument.querySelector('#translation-feedback').classList.contains('wrong')",'Wrong feedback');await frameClick('[data-check="apple"]');await check("document.querySelector('iframe').contentDocument.querySelector('#translation-feedback').classList.contains('azota-success')",'Correct feedback with mild effect');
const old=await f('location.href');await frameClick('#explore-next');await check(`document.querySelector('iframe').contentWindow.location.href===${JSON.stringify(old)}`,'Cross-page next blocked');
await frameClick('#change-food');await check("document.querySelector('iframe').contentDocument.querySelector('#translation-panel').hidden",'Retry restores chooser');
await frameClick('.azota-expand');await pause(250);const targets=(await c('Target.getTargets')).targetInfos;const expanded=targets.find(t=>t.url.includes('hl1_kham_pha.html?embed=azota')&&t.type==='page');if(!expanded)throw Error('Expand tab missing');const ws=new WebSocket((await(await fetch('http://127.0.0.1:9340/json')).json()).find(t=>t.id===expanded.targetId).webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);const v=await new Promise(resolve=>{ws.onmessage=({data})=>resolve(JSON.parse(data));ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:"window.AzotaEmbed.active && getComputedStyle(document.querySelector('header')).display==='none'",returnByValue:true}}))});if(!v.result?.result?.value)throw Error('Expanded mode not isolated');reports.push('Expand opens same activity isolated in new tab');ws.close();await c('Target.closeTarget',{targetId:expanded.targetId});
}
for(const page of ['hl2_mo_phong.html','hl3_luyen_tap.html','bai3_y_tuong.html','bai4_cai_tien.html']){await nav('azota-preview.html?page='+page);await until("document.querySelector('iframe')?.contentWindow.AzotaEmbed?.active");await pause(120);await check("document.querySelector('iframe').contentDocument.documentElement.scrollWidth<=document.querySelector('iframe').clientWidth",page+' fits frame width');await check("[...document.querySelector('iframe').contentDocument.querySelectorAll('a[href]')].filter(a=>!a.classList.contains('azota-expand')&&new URL(a.href).pathname!==document.querySelector('iframe').contentWindow.location.pathname).every(a=>getComputedStyle(a).display==='none')",'Other activities hidden '+page);
if(page==='hl2_mo_phong.html'){await frameClick('[data-predict="Lon"]');await frameClick('#more-clue');const yaw=await f("document.querySelector('#model-host').dataset.yaw");await frameClick('[data-rotate="left"]');if(await f("document.querySelector('#model-host').dataset.yaw")===yaw)throw Error('Embedded rotation failed');await frameClick('[data-clue="body"]');await frameClick('[data-clue="tab"]');await frameClick('[data-verdict="Lon"]');await frameClick('#challenge-next');if(!await f("!document.querySelector('#case-solved').hidden"))throw Error('Embedded clue failed');await frameClick('#challenge-reset');reports.push('Embedded rotate, clue, conclude, reset and blocked next work');}
if(page==='hl3_luyen_tap.html'){for(const key of [1,2]){await frameClick('#quiz-answers button:nth-child('+key+')');await frameClick('#quiz-next');}await frameClick('#quiz-summary a');await f("document.querySelector('#study').value='AI giúp dịch câu';document.querySelector('#life').value='AI gợi ý phân loại rác'");await frameClick('#copy');reports.push('Embedded quiz and internal Q1 route work');}
if(page==='bai3_y_tuong.html'){await frameClick('[data-q5-choice="waste"]');await frameClick('#q5-next');await frameClick('[data-q5-choice="0"]');await frameClick('#q5-next');await frameClick('[data-q5-choice="0"]');await frameClick('#q5-next');await f("for(const i of [1,2]){document.querySelector('#own-problem-'+i).value='Vấn đề '+i;document.querySelector('#own-support-'+i).value='AI hỗ trợ '+i}");await frameClick('#own-preview');await frameClick('#q6-open');await f("document.querySelector('#q6-data').value='Hình ảnh';document.querySelector('#q6-user').value='Học sinh'");await frameClick('#q6-generate');await frameClick('#idea-copy');await frameClick('#lesson3-to-4');if(!await f("!document.querySelector('#idea-preview').hidden"))throw Error('B3 route escaped');reports.push('Embedded two Q5 ideas, four Q6 fields, copying and isolation work');}
if(page==='bai4_cai_tien.html'){await frameClick('#l4-start');for(let i=0;i<6;i++){await frameClick('[data-judge="'+(i<4?'correct':'wrong')+'"]');if(i>=4)await frameClick('[data-reason="0"]');await frameClick('#l4-next-baseline');}await frameClick('[data-improvement="photos"]');await frameClick('#l4-start-retest');for(let i=0;i<6;i++){await frameClick('#l4-run-retest');await frameClick('#l4-next-retest');}if(!await f("document.querySelector('#l4-after-count').textContent.includes('5 / 6')"))throw Error('Embedded six trials failed');await f("for(const key of ['error','change','result','reflection'])document.querySelector('#l4-'+key).value='T5 vẫn sai, cần kiểm tra'");await frameClick('#l4-preview-report');await frameClick('#l4-copy-report');await frameClick('#l4-reset');reports.push('Embedded six baseline/retest trials, report, copy and reset work');}
if(page==='bai4_cai_tien.html')await check("document.querySelector('iframe').contentDocument.querySelector('#l4-prior-content').children.length===0",'Embedded B4 does not load B3 idea');}
}
await nav('hl1_kham_pha.html?embed=azota');await check("window.AzotaEmbed.active&&self===top",'Explicit embed works outside iframe');
if(errors.length)throw Error(errors.join(';'));await fs.writeFile('.preview/embed-test-results.json',JSON.stringify({checks:reports.length,errors,reports},null,2));console.log(JSON.stringify({checks:reports.length,errors}));
}finally{socket.close();}
