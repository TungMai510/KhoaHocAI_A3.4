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

// Module-specific flows below deliberately operate the rendered UI rather than
// calling implementation functions or comparing implementation-generated scores.
async function coreLesson3(mistakes=false){
  await check(`document.querySelector('#q5-next').disabled`,'Q5 requires a learner choice');
  await click('[data-q5-choice="waste"]');await click('#q5-next');
  if(mistakes){await click('[data-q5-choice="1"]');await check(`document.querySelector('#q5-next').disabled&&document.querySelector('#q5-feedback').textContent.includes('hình dạng')`,'Schedule does not identify bottle/can shape: explained retry');}
  await click('[data-q5-choice="0"]');await click('#q5-next');
  if(mistakes){await click('[data-q5-choice="1"]');await check(`document.querySelector('#q5-next').disabled&&document.querySelector('#q5-feedback').textContent.includes('thiết bị')`,'AI image suggestion cannot physically sort waste without equipment');}
  await click('[data-q5-choice="0"]');await click('#q5-next');
  await check(`!document.querySelector('#idea-preview').hidden&&document.querySelector('#idea-source').textContent.includes('Q5')`,'Coherent sample completes Q5 core without Q6');
  await check(`document.querySelector('#idea-problem').textContent.includes('chai')&&document.querySelector('#idea-data').textContent.includes('Ảnh')&&document.querySelector('#idea-support').textContent.includes('phân loại')`,'Q5 card links problem → image data → AI support');
}
async function lesson3Flow(){
  await nav('bai3_y_tuong.html');await coreLesson3(true);
  await click('#idea-copy');await check(`(await navigator.clipboard.readText()).includes('Phiếu ý tưởng AI – Q5')`,'Core Q5 card can be copied');
  await click('#lesson3-to-4');await until(`location.pathname.endsWith('bai4_cai_tien.html')&&document.readyState==='complete'`);
  await check(`!!document.querySelector('#l4-start')`,'Core route reaches Bài4 without doing optional Q6');
  await nav('bai3_y_tuong.html');await coreLesson3();
  await click('#q6-open');await checkLayout('Q6 editing form',['#q6-stage','#idea-form']);await fill('#q6-data','   ');await click('#q6-generate');
  await check(`!document.querySelector('#q6-stage').hidden&&!document.querySelector('#q6-feedback').hidden`,'Q6 requires all three meaningful fields');
  const problem='Góc sách hay bị xếp nhầm ngăn.';
  const data='Ảnh bìa, tên sách và các ngăn sách của lớp.';
  const support='<img src=x onerror="window.injected=true"> AI gợi ý ngăn sách để em kiểm tra.';
  await fill('#q6-problem',problem);await fill('#q6-data',data);await fill('#q6-support',support);await click('#q6-generate');
  await checkLayout('Q6 own-idea preview',['#idea-preview','#idea-card','#idea-support']);
  await check(`document.querySelector('#idea-support').textContent===${JSON.stringify(support)}&&!document.querySelector('#idea-card img')&&!window.injected`,'Own idea is rendered as literal text, not HTML');
  await click('#q6-open');await check(`document.querySelector('#q6-problem').value===${JSON.stringify(problem)}&&document.querySelector('#q6-support').value===${JSON.stringify(support)}`,'Editing optional idea preserves entered fields');
  await fill('#q6-problem','Góc sách cần tìm đúng ngăn nhanh hơn.');await click('#q6-generate');
  await checkLayout('Q6 edited preview',['#idea-card']);
  await check(`document.querySelector('#idea-problem').textContent.includes('nhanh hơn')`,'Edited idea refreshes preview');
  await click('#idea-copy');await check(`(await navigator.clipboard.readText()).includes('Góc sách cần tìm đúng ngăn nhanh hơn.')&&(await navigator.clipboard.readText()).includes(${JSON.stringify(support)})`,'Own idea actual clipboard includes edited problem, data and support');
  await clipboardDenied();await click('#idea-copy');await check(`!document.querySelector('#idea-manual-copy').hidden&&document.querySelector('#idea-copy-output').value.includes(${JSON.stringify(data)})`,'Idea clipboard denial offers complete selectable text');await clipboardRestore();
  await click('#q5-edit');await click('[data-q5-choice="books"]');await click('#q5-next');await click('[data-q5-choice="0"]');await click('#q5-next');
  await check(`document.querySelector('#q5-next').disabled`,'Changed problem invalidates previous support choice');
  await click('#q5-back');await click('#q5-back');await click('[data-q5-choice="waste"]');await click('#q5-next');
  await check(`document.querySelector('#q5-next').disabled&&document.querySelectorAll('#q5-choices [aria-pressed=true]').length===0`,'Returning to another problem clears downstream data choice');
  await click('[data-q5-choice="0"]');await click('#q5-next');await click('[data-q5-choice="0"]');await click('#q5-next');
}
async function baselineLesson4({exerciseMistakes=true}={}){
  await click('#l4-start');
  const images=[];
  for(let i=0;i<4;i++){
    await checkLayout(`Bài4 baseline trial ${i+1}`,['#l4-test-stage']);
    images.push(await e(`(()=>{const img=document.querySelector('#l4-image');return {id:img.dataset.imageId,src:img.getAttribute('src')};})()`));
    await check(`document.querySelector('#l4-next-baseline').disabled`,`Trial ${i+1}: student must inspect before advancing`);
    const judgment=i<2?'correct':'wrong',opposite=i<2?'wrong':'correct';
    if(exerciseMistakes){await click(`[data-judge="${opposite}"]`);await check(`document.querySelector('#l4-next-baseline').disabled`,`Trial ${i+1}: incorrect judgment gives retry`);}
    await click(`[data-judge="${judgment}"]`);
    await check(`!document.querySelector('#l4-judgment-feedback').hidden`,`Trial ${i+1}: feedback follows choice`);
    await checkLayout(`Bài4 baseline feedback ${i+1}`,['#l4-judgment-feedback']);
    if(i>=2){
      await check(`document.querySelector('#l4-next-baseline').disabled`,`Trial ${i+1}: observed detail required for wrong AI guess`);
      if(exerciseMistakes){await click('[data-reason="1"]');await check(`document.querySelector('#l4-next-baseline').disabled`,'Unrelated reason cannot complete observation');}
      await keyboardActivate('[data-reason="0"]');
    }
    await click('#l4-next-baseline');
  }
  await check(`document.querySelector('#l4-before-count').textContent.includes('2 / 4')`,'Baseline AI accuracy is 2/4, separate from student judgments');
  return images;
}
async function retestLesson4(improvement,images,expectedCorrect){
  await click(`[data-improvement="${improvement}"]`);
  await check(`!document.querySelector('#l4-improve-feedback').hidden`,'Improvement choice explains connection to image data');
  await click('#l4-start-retest');
  let observedCorrect=0;
  for(let i=0;i<4;i++){
    await checkLayout(`Bài4 retest trial ${i+1}`,['#l4-retest-stage']);
    const observed=await e(`(()=>{const img=document.querySelector('#l4-retest-image');return {id:img.dataset.imageId,src:img.getAttribute('src')};})()`);
    if(observed.id!==images[i].id||observed.src!==images[i].src)throw Error('Retest changed image/order at '+i);
    reports.push(`Retest trial ${i+1}: same test image and order`);
    await check(`document.querySelector('#l4-next-retest').hidden`,`Retest ${i+1}: run simulation before advancing`);
    await click('#l4-run-retest');
    await check(`!document.querySelector('#l4-next-retest').hidden&&!!document.querySelector('#l4-retest-ai-guess')`,`Retest ${i+1}: result available after run`);
    await checkLayout(`Bài4 retest result ${i+1}`,['#l4-retest-feedback']);
    const result=await e(`document.querySelector('#l4-retest-result').textContent`);
    if(result==='Đúng')observedCorrect++;
    await click('#l4-next-retest');
  }
  if(observedCorrect!==expectedCorrect)throw Error(`Per-image retest results total ${observedCorrect}, expected ${expectedCorrect}`);
  reports.push(`Per-image observations independently total ${observedCorrect}/4`);
  await check(`document.querySelector('#l4-after-count').textContent.includes('${expectedCorrect} / 4')`,`Improvement ${improvement}: observed final accuracy ${expectedCorrect}/4`);
}
async function reportLesson4(){
  await click('#l4-preview-report');
  await check(`!document.querySelector('#l4-report-stage').hidden`,'Incomplete report stays editable');
  const error='AI nhầm chai có nắp vặn thành lon.';
  const change='Em bổ sung ảnh rõ ở nhiều góc.';
  const result='Đúng 3/4 lượt; vẫn còn một ảnh khó nhìn.';
  await fill('#l4-error',error);await fill('#l4-change',change);await fill('#l4-result',result);
  await checkLayout('Bài4 report editing',['#l4-report-stage']);
  await click('#l4-preview-report');
  await checkLayout('Bài4 report preview',['#l4-preview-stage','#l4-report-text']);
  await check(`document.querySelector('#l4-report-text').textContent.includes(${JSON.stringify(error)})&&document.querySelector('#l4-report-text').textContent.includes(${JSON.stringify(result)})`,'Report preview includes error, change and retest outcome');
  await click('#l4-edit-report');await check(`document.querySelector('#l4-error').value===${JSON.stringify(error)}`,'Edit report preserves learner text');
  const literal='<img src=x onerror="window.injected=true"> Em đã kiểm tra lại.';
  await fill('#l4-error',literal);await click('#l4-preview-report');
  await checkLayout('Bài4 report preview with literal markup',['#l4-report-text']);
  await check(`document.querySelector('#l4-report-text').textContent.includes('<img')&&!document.querySelector('#l4-report-text img')&&!window.injected`,'Report handles entered markup as text');
  await click('#l4-copy-report');
  await check(`(await navigator.clipboard.readText()).includes(${JSON.stringify(literal)})&&(await navigator.clipboard.readText()).includes(${JSON.stringify(change)})`,'Report actual clipboard contains learner fields');
  await clipboardDenied();await click('#l4-copy-report');
  await check(`!document.querySelector('#l4-manual-copy').hidden&&document.querySelector('#l4-manual-copy').value.includes(${JSON.stringify(change)})`,'Report clipboard denial offers complete manual text');await clipboardRestore();
}

try{
  await c('Page.enable');await c('Runtime.enable');await c('Log.enable');await c('Network.enable');await c('Network.setCacheDisabled',{cacheDisabled:true});await c('Page.bringToFront');await c('Emulation.setFocusEmulationEnabled',{enabled:true});
  await c('Browser.grantPermissions',{origin:base,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
  for(const [label,width,height] of [['desktop',1366,900],['mobile',390,844]]){
    await c('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:label==='mobile'});
    await nav('khoa_hoc.html');
    await check(`document.querySelector('[data-lesson="2"]')&&!document.querySelector('[data-lesson="2"] a')&&!document.querySelector('[data-lesson="2"] button')`,'Bài2 remains a placeholder without unconfirmed link');
    for(const href of ['index.html','bai3_y_tuong.html','bai4_cai_tien.html']){
      await click(`a[href="${href}"]`);await until(`location.pathname.endsWith(${JSON.stringify(href)})&&document.readyState==='complete'`);
      await check(`!!document.querySelector('a.course-link[href="khoa_hoc.html"]')`,'Lesson has a return link to course contents: '+href);
      await click('a.course-link');await until(`location.pathname.endsWith('khoa_hoc.html')`);
    }
    for(const path of ['khoa_hoc.html','bai3_y_tuong.html','bai4_cai_tien.html']){
      await nav(path);
      await check('document.documentElement.scrollWidth<=innerWidth',`${label}: no horizontal overflow on ${path}`);
      await check(`Array.from(document.querySelectorAll('button,.btn')).filter(b=>b.getClientRects().length).every(b=>b.getBoundingClientRect().height>=44)`,`${label}: active controls at least 44px on ${path}`);
      await check(`Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0)`,`${label}: image assets load on ${path}`);
      await screenshot(`course-${label}-${path.split('.')[0]}`);
    }
    await lesson3Flow();
    await screenshot(`course-${label}-idea`);
    // Bài4 must be independently usable even if the learner never did Bài3.
    await e(`localStorage.removeItem('ai4.idea.v1')`);await nav('bai4_cai_tien.html');
    await check(`!!document.querySelector('#l4-start')`,'Standalone Bài4 starts from fixed sample without Bài3');
    const images=await baselineLesson4();await retestLesson4('photos',images,3);await reportLesson4();
    await screenshot(`course-${label}-report`);
    await click('#l4-reset');await check(`!document.querySelector('#l4-start').disabled&&!!document.querySelector('#l4-start').getClientRects().length`,'Reset restores initial sample activity');
    const secondImages=await baselineLesson4({exerciseMistakes:false});await retestLesson4('schedule',secondImages,2);
    await check(`document.querySelector('#l4-error').value===''&&document.querySelector('#l4-change').value===''&&document.querySelector('#l4-result').value===''`,'Reset cleared previous report inputs');
    const unrelated={version:1,problem:'Bé muốn luyện nói tiếng Anh.',data:'Giọng nói tiếng Anh.',support:'Gợi ý phát âm.',source:'Q6'};
    await e(`localStorage.setItem('ai4.idea.v1',${JSON.stringify(JSON.stringify(unrelated))})`);await nav('bai4_cai_tien.html');
    await check(`document.querySelector('#l4-prior-idea').textContent.includes('luyện nói')&&document.body.textContent.includes('mẫu')`,'Unrelated saved idea is context only; bottle/can sample remains explicit');
    await click('#l4-start');await check(`document.querySelector('#l4-image').dataset.imageId===${JSON.stringify(images[0].id)}`,'Saved unrelated idea does not silently change fixed test set');
  }
  await nav('khoa_hoc.html');await e(`localStorage.setItem('ai4.idea.v1','{not valid JSON')`);
  await nav('bai4_cai_tien.html');await check(`!!document.querySelector('#l4-start').getClientRects().length`,'Malformed saved idea falls back to sample');
  const blocked=await c('Page.addScriptToEvaluateOnNewDocument',{source:`for(const method of ['getItem','setItem','removeItem'])Storage.prototype[method]=function(){throw new DOMException('Storage blocked for QA','SecurityError')}`});
  await nav('bai3_y_tuong.html');await coreLesson3();
  await check(`!document.querySelector('#idea-storage-status').hidden&&!document.querySelector('#idea-preview').hidden`,'Storage blocked: Q5 completes and offers copying');
  await nav('bai4_cai_tien.html');await check(`!!document.querySelector('#l4-start').getClientRects().length`,'Storage blocked: Bài4 still opens standalone sample');
  await c('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocked.identifier});
  await c('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:1,mobile:true});
  for(const path of ['khoa_hoc.html','bai3_y_tuong.html','bai4_cai_tien.html']){await nav(path);await check('document.documentElement.scrollWidth<=innerWidth',`320px: no horizontal overflow on ${path}`);}
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  await fs.writeFile('.preview/course-test-results.json',JSON.stringify({checks:reports.length,errors,reports},null,2));
  console.log(JSON.stringify({checks:reports.length,errors},null,2));
}catch(error){
  await fs.writeFile('.preview/course-test-results.json',JSON.stringify({failed:String(error),checks:reports.length,errors,reports},null,2));
  try{await screenshot('course-failure');}catch{}
  throw error;
}finally{socket.close();}
