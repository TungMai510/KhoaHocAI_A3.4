import fs from 'node:fs/promises';
// Local server 8340; separate Chrome with working WebGL and CDP on 9340.
await fs.mkdir('.preview',{recursive:true});
const base='http://127.0.0.1:8340/';
const targets=await (await fetch('http://127.0.0.1:9340/json')).json();
const target=targets.find(t=>t.type==='page'&&t.url.startsWith(base))||targets.find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
let id=0;const pending=new Map(),errors=[],reports=[];
socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text);};
function c(method,params={}){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});}
async function e(expression){const r=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function check(condition,message){if(!await e(`(async()=>(${condition}))()`))throw Error(message);reports.push(message);}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expr){for(let i=0;i<100;i++){try{if(await e(expr))return;}catch{}await pause(50);}throw Error('Timeout: '+expr);}
async function nav(path){await c('Page.navigate',{url:base+path});await until(`document.readyState==='complete'&&document.querySelector('#journey a')`);}
async function click(selector){await check(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});return !!b&&!!b.getClientRects().length&&!b.disabled;})()`,'Can operate '+selector);await e(`document.querySelector(${JSON.stringify(selector)}).click()`);await pause(60);}
async function bounds(selector){await e(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);await pause(80);return e(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()`);}
async function pointerClick(selector){const r=await bounds(selector),x=r.x+r.width/2,y=r.y+r.height/2;await c('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await c('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});await pause(80);}
async function keyboardActivate(selector){await e(`document.querySelector(${JSON.stringify(selector)}).focus()`);await c('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await c('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(60);}
async function screenshot(name){const r=await c('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile('.preview/'+name+'.png',Buffer.from(r.data,'base64'));}
async function rotateModel(mobile,label){
  await until(`document.querySelector('#model-host').dataset.view`);
  await check(`document.querySelector('#model-host').dataset.view==='3d'`,`${label}: normal path creates actual 3D`);
  const r=await bounds('.model-canvas'),x=r.x+r.width*.35,y=r.y+r.height*.55;
  const before=await e(`Number(document.querySelector('#model-host').dataset.yaw)`);
  if(mobile){
    await c('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=6;i++)await c('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*14,y:y+1}]});
    await c('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{
    await c('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
    for(let i=1;i<=6;i++)await c('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+i*14,y,button:'left',buttons:1});
    await c('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+84,y,button:'left',clickCount:1});
  }
  await pause(100);
  await check(`Math.abs(Number(document.querySelector('#model-host').dataset.yaw)-(${before}))>.01`,`${label}: real ${mobile?'touch swipe':'mouse drag'} rotates model`);
  const beforeKey=await e(`Number(document.querySelector('#model-host').dataset.yaw)`);
  await e(`document.querySelector('.model-canvas').focus()`);
  await c('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
  await c('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
  await check(`Math.abs(Number(document.querySelector('#model-host').dataset.yaw)-(${beforeKey}))>.01`,`${label}: arrow key rotates focused model`);
  await check(`getComputedStyle(document.querySelector('.model-canvas')).touchAction.includes('pan-y')`,`${label}: viewer allows browser vertical scrolling`);
  await click('#model-fallback');await check(`document.querySelector('#model-host').dataset.view==='2d'`,`${label}: learner can switch to interactive image`);
  await click('#model-fallback');await check(`document.querySelector('#model-host').dataset.view==='3d'`,`${label}: learner can return to 3D`);
  if(mobile){
    const r2=await bounds('.model-canvas'),x2=r2.x+r2.width/2,y2=r2.y+r2.height*.7;
    const scrollBefore=await e('scrollY');
    await c('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x2,y:y2}]});
    for(let i=1;i<=8;i++){await c('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x2+1,y:y2-i*14}]});await pause(20);}
    await c('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(200);
    await check(`scrollY>${scrollBefore}+10`,'Mobile: vertical swipe beginning on model actually scrolls page');
  }
}
async function tap3dDetail(mobile){
  await click('[data-rotate="up"]');
  const r=await bounds('.model-canvas');
  const rotation=await e(`({yaw:Number(document.querySelector('#model-host').dataset.yaw),pitch:Number(document.querySelector('#model-host').dataset.pitch)})`);
  const x3=.13*Math.sin(rotation.yaw),z3=.13*Math.cos(rotation.yaw);
  const y3=1.16*Math.cos(rotation.pitch)-z3*Math.sin(rotation.pitch);
  const x=r.x+r.width/2+x3*r.height/3.24,y=r.y+r.height/2-y3*r.height/3.24;
  if(mobile){await c('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await c('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await c('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await c('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});}
  await pause(100);await check(`!document.querySelector('#verdict').hidden&&document.querySelector('[data-clue="tab"]').getAttribute('aria-pressed')==='true'`,`${mobile?'Mobile touch':'Mouse click'} on actual 3D detail finds clue`);
}
async function openInvestigation(prediction='Lon'){
  await check(`document.querySelector('#ai-feedback').hidden&&document.querySelector('#investigate-stage').hidden`,'Blur initially hides AI and clear model');
  await click(`[data-predict="${prediction}"]`);
  await check(`!document.querySelector('#ai-feedback').hidden&&document.querySelector('#ai-feedback').textContent.includes('Chai')`,'Prediction precedes simulated Chai suggestion');
  await check(`!document.querySelector('#ai-feedback').textContent.includes('khoen')&&!document.querySelector('#ai-feedback').textContent.includes('nhầm')`,'Initial AI suggestion does not give solution');
  await click('#more-clue');
  await check(`document.querySelector('#blur-stage').hidden&&!document.querySelector('#investigate-stage').hidden&&document.querySelector('#case-solved').hidden`,'Clear evidence opens without explanation');
}
async function solveKeyboard(){
  await keyboardActivate('[data-clue="body"]');
  await check(`!document.querySelector('#clue-feedback').hidden&&document.querySelector('#case-solved').hidden`,'Insufficient detail gives a retry hint');
  await keyboardActivate('[data-clue="tab"]');
  await check(`!document.querySelector('#verdict').hidden&&document.querySelector('#case-solved').hidden`,'Finding tab opens conclusion; explanation remains hidden');
  await click('[data-verdict="Chai"]');await check(`document.querySelector('#case-solved').hidden`,'Wrong conclusion keeps solution hidden');
  await click('[data-verdict="Lon"]');
  await check(`!document.querySelector('#case-solved').hidden&&document.querySelector('#case-solved').textContent.includes('khoen')&&!document.querySelector('#challenge-next').hidden`,'Tab plus Lon unlocks explanation and next step');
}
try{
  await c('Page.enable');await c('Runtime.enable');await c('Log.enable');await c('Page.bringToFront');await c('Emulation.setFocusEmulationEnabled',{enabled:true});
  await c('Browser.grantPermissions',{origin:base,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
  for(const [label,width,height] of [['desktop',1366,900],['mobile',390,844]]){
    const mobile=label==='mobile';
    await c('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
    await c('Emulation.setTouchEmulationEnabled',{enabled:mobile});
    for(const path of ['index.html','hl1_kham_pha.html','hl2_mo_phong.html','hl3_luyen_tap.html','hl3_luyen_tap.html#q1']){
      await nav(path);await check('document.documentElement.scrollWidth<=innerWidth',`${label}: no horizontal overflow on ${path}`);
      await check(`Array.from(document.querySelectorAll('button,.btn,.journey a')).filter(b=>b.getClientRects().length).every(b=>b.getBoundingClientRect().height>=44)`,`${label}: visible controls >=44px on ${path}`);
      await check(`Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0)`,`${label}: illustrations load on ${path}`);
      if(path==='index.html')await screenshot(label+'-home');if(path.includes('#q1'))await screenshot(label+'-q1');
      if(path==='hl1_kham_pha.html')await screenshot(label+'-food-start');
      if(path==='hl2_mo_phong.html')await screenshot(label+'-blur-start');
    }
    await nav('index.html');await click('.welcome-copy .btn');await until(`document.body.dataset.page==='explore'`);
    await check(`document.querySelector('#try-translate').disabled&&document.querySelector('#translation-panel').hidden`,'Choose card first; translation initially hidden');
    const foods=[['apple','Tôi thích táo.'],['banana','Tôi thích chuối.'],['milk','Tôi thích sữa.']];
    for(let i=0;i<foods.length;i++){
      const [food,result]=foods[i],wrong=foods[(i+1)%3][0];
      if(i)await click('#change-food');
      await check(`!document.querySelector('#choose-stage').hidden&&document.querySelector('#translation-panel').hidden&&document.querySelector('#translation-feedback').hidden&&document.querySelector('#explore-next').hidden`,'Changing sentence clears previous round');
      await click(`[data-food="${food}"]`);await check(`document.querySelector('#translation-panel').hidden`,`${food}: selecting card alone does not reveal answer`);
      await click('#try-translate');
      await check(`document.querySelector('#choose-stage').hidden&&!document.querySelector('#translation-panel').hidden&&document.querySelector('#translation-result').textContent.includes(${JSON.stringify(result)})`,`${food}: translate then show only image-check task`);
      await click(`[data-check="${wrong}"]`);await check(`!document.querySelector('#translation-feedback').hidden&&document.querySelector('#explore-next').hidden`,`${food}: wrong image gives retry`);
      await click(`[data-check="${food}"]`);await check(`document.querySelector('#translation-feedback').textContent.includes('Em đưa câu tiếng Anh vào, AI gợi ý bản dịch, rồi em kiểm tra.')&&!document.querySelector('#explore-next').hidden`,`${food}: correct image explains input → AI → check`);
    }
    await screenshot(label+'-food-counter');await click('#explore-next');await until(`document.body.dataset.page==='challenge'`);
    await openInvestigation();await rotateModel(mobile,label);await screenshot(label+'-3d');await tap3dDetail(mobile);await solveKeyboard();await screenshot(label+'-case-solved');
    await click('#challenge-reset');
    await check(`!document.querySelector('#blur-stage').hidden&&document.querySelector('#investigate-stage').hidden&&document.querySelector('#ai-feedback').hidden&&document.querySelector('#case-solved').hidden&&document.querySelector('#challenge-next').hidden`,'Whole challenge reset restores initial state');
    await click('[data-predict="Chưa chắc"]');await click('#more-clue');
    await e(`document.querySelector('.model-canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext()`);
    await until(`document.querySelector('#model-host').dataset.view==='2d'`);
    reports.push(`${label}: actual WebGL context loss automatically switches to interactive image`);
    await solveKeyboard();await click('#challenge-next');await until(`document.body.dataset.page==='practice'`);
    const keys=[0,1];
    for(let q=0;q<2;q++){
      await check(`document.querySelector('#quiz-count').textContent.includes('${q+1}')&&document.querySelector('#quiz-count').textContent.includes('2')&&document.querySelector('#quiz-next').disabled`,`New two-question quiz: question ${q+1} requires choice`);
      for(let a=0;a<3;a++){await click(`#quiz-answers button:nth-child(${a+1})`);await check(`document.querySelector('#quiz-feedback').classList.contains('wrong')===${a!==keys[q]}`,`Question ${q+1} option ${a+1}: immediate explanation`);}
      await click(`#quiz-answers button:nth-child(${keys[q]+1})`);await click('#quiz-next');
    }
    await check(`document.querySelector('#score').textContent.includes('2 / 2')`,'Quiz scores 2/2');await click('#quiz-again');
    await check(`document.querySelector('#quiz-feedback').hidden&&document.querySelector('#quiz-next').disabled`,'Restart clears quiz answer and feedback');
    for(let q=0;q<2;q++){await click(`#quiz-answers button:nth-child(${(keys[q]+1)%3+1})`);await click('#quiz-next');}
    await check(`document.querySelector('#score').textContent.includes('0 / 2')`,'Quiz scores 0/2');await click('#quiz-summary a');await until(`!document.querySelector('#q1').hidden`);
    await check(`document.querySelector('.journey [aria-current=step]').textContent.includes('Nộp Q1')`,'Q1 active progress');await click('#copy');await check(`document.querySelector('#copy-status').textContent.includes('đủ cả hai')`,'Empty Q1 asks for both examples');
    await e(`document.querySelector('#study').value='Ứng dụng dịch có AI giúp em hiểu câu tiếng Anh.';document.querySelector('#life').value='Nhận dạng ảnh có AI giúp em phân loại chai và lon.';`);
    await click('#copy');await until(`document.querySelector('#copy-status').textContent.includes('Đã sao chép')`);
    await check(`(await navigator.clipboard.readText()).includes('1. Trong học tập: Ứng dụng dịch')&&(await navigator.clipboard.readText()).includes('2. Trong đời sống: Nhận dạng ảnh')`,'Real clipboard contains both answers');
    await e(`Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('Blocked for QA')}})`);await click('#copy');
    await check(`!document.querySelector('#manual-copy').hidden&&document.querySelector('#copy-output').value.includes('Nhận dạng ảnh')`,'Clipboard denied: complete manual fallback');await e('delete navigator.clipboard.writeText');
    await check(`document.querySelector('#azota').href==='https://azota.vn/vi/khoa-hoc/ireehs'&&document.querySelector('#azota').target==='_blank'`,'Preserved exact Azota URL and target');
    await click('#back-practice');await until(`!document.querySelector('#quiz-summary').hidden`);await check(`document.querySelector('#score').textContent.includes('0 / 2')`,'Q1 return preserves result');
    await nav('hl2_mo_phong.html?view=2d');await openInvestigation('Chai');await until(`document.querySelector('#model-host').dataset.view==='2d'`);
    await pointerClick('[data-hotspot="body"]');await check(`!document.querySelector('#clue-feedback').hidden&&document.querySelector('#case-solved').hidden`,'Fallback body hotspot gives hint');
    await pointerClick('[data-hotspot="tab"]');await check(`!document.querySelector('#verdict').hidden`,'Fallback pull-tab hotspot finds clue');await click('[data-verdict="Lon"]');await check(`!document.querySelector('#case-solved').hidden`,`${label}: complete task with 3D unavailable`);await screenshot(label+'-fallback');
    await click('#challenge-reset');await click('[data-predict="Lon"]');await click('#more-clue');await solveKeyboard();reports.push(`${label}: fallback completes using keyboard clues`);
  }
  await nav('hl3_luyen_tap.html#q1');await check(`!document.querySelector('#q1').hidden`,'Direct Q1 deep link preserved');await click('#back-practice');await check(`!document.querySelector('#practice').hidden`,'Direct Q1 returns to unanswered quiz');
  await c('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:1,mobile:true});
  for(const path of ['index.html','hl1_kham_pha.html','hl2_mo_phong.html','hl3_luyen_tap.html#q1']){await nav(path);await check('document.documentElement.scrollWidth<=innerWidth',`320px: no overflow on ${path}`);}
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  await fs.writeFile('.preview/test-results.json',JSON.stringify({checks:reports.length,errors,reports},null,2));console.log(JSON.stringify({checks:reports.length,errors},null,2));
}catch(error){await fs.writeFile('.preview/test-results.json',JSON.stringify({failed:String(error),checks:reports.length,errors,reports},null,2));try{await screenshot('failure');}catch{}throw error;}finally{socket.close();}
