'use strict';
const $ = id => document.getElementById(id);
const page = document.body.dataset.page;
const moodle = window.Bai1Moodle;
// Standalone pupils enter these practice pages after the guided notebook.
const guided = new URLSearchParams(location.search).get('flow') === 'lesson1';
if (guided && !moodle) {
  const onward = $('explore-next') || $('challenge-next');
  if (onward) {
    const url = new URL(onward.href);
    url.searchParams.set('flow', 'lesson1');
    onward.href = url.href;
  }
}
function feedback(id,text,correct=true){const el=$(id);el.hidden=false;el.textContent=text;el.className='feedback'+(correct?'':' wrong');if(correct&&window.AzotaEmbed?.active)el.classList.add('azota-success');}
function selected(container,button){document.querySelectorAll(`#${container} button`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
function bringIntoView(el){if(el.getBoundingClientRect().top<0||el.getBoundingClientRect().bottom>innerHeight)el.scrollIntoView({block:'nearest'});}

if(page==='explore'){
  const foods={apple:{source:'I like apples.',translation:'Tôi thích táo.',word:'apples'},banana:{source:'I like bananas.',translation:'Tôi thích chuối.',word:'bananas'},milk:{source:'I like milk.',translation:'Tôi thích sữa.',word:'milk'}};
  let food=null, translated=false;
  function clearTranslation(){translated=false;$('translation-panel').hidden=true;$('translation-result').textContent='';$('source-sentence').textContent='';$('translation-feedback').hidden=true;$('explore-next').hidden=true;document.querySelectorAll('[data-check]').forEach(b=>b.setAttribute('aria-pressed','false'));}
  document.querySelectorAll('[data-food]').forEach(b=>b.addEventListener('click',()=>{
    food=b.dataset.food;clearTranslation();selected('food-cards',b);$('try-translate').disabled=false;$('selected-sentence').textContent=`Em đã chọn: ${foods[food].source}`;
  }));
  $('try-translate').onclick=()=>{
    if(!food)return;translated=true;$('choose-stage').hidden=true;$('translation-panel').hidden=false;$('source-sentence').textContent=foods[food].source;$('translation-result').textContent=foods[food].translation;
    $('food-instruction').textContent='Chọn món khớp với bản dịch.';
    document.querySelector('[data-check]').focus({preventScroll:true});bringIntoView($('translation-panel'));
  };
  document.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{
    if(!translated)return;selected('food-checks',b);const correct=b.dataset.check===food;
    feedback('translation-feedback',correct?'Em đưa câu tiếng Anh vào, AI gợi ý bản dịch, rồi em kiểm tra.':`Chưa khớp rồi! Đọc lại từ “${foods[food].word}” và bản dịch, rồi chọn món khác nhé.`,correct);
    $('explore-next').hidden=!correct;bringIntoView($('translation-feedback'));
  });
  $('change-food').onclick=()=>{
    clearTranslation();food=null;$('choose-stage').hidden=false;$('try-translate').disabled=true;$('selected-sentence').textContent='Em muốn thử câu nào?';$('food-instruction').innerHTML='Chọn một câu rồi bấm <strong>Thử dịch</strong>.';document.querySelectorAll('[data-food]').forEach(b=>{b.setAttribute('aria-pressed','false');});document.querySelector('[data-food]').focus({preventScroll:true});bringIntoView($('choose-stage'));
  };
}

if(page==='challenge'){
  let guess=null,clueFound=false,solved=false,viewer=null;
  let cameraActive=false,mediaStream=null,handLandmarker=null,rafId=0;
  let cursorNormX=.5,cursorNormY=.5,cursorReady=false,dwellTarget=null,dwellStart=0,gestureLocked=null;
  const DWELL_MS=1000,RING_LEN=150.8,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function updateDwellRing(target,progress){
    const pct=clamp(progress,0,1);
    const fg=$('cursor-ring-fg');
    if(fg)fg.style.strokeDashoffset=String(RING_LEN*(1-pct));
    document.querySelectorAll('[data-verdict]').forEach(b=>{
      b.classList.toggle('gesture-hover',b.dataset.verdict===target&&pct>0);
    });
  }
  function cancelDwell(){dwellTarget=null;dwellStart=0;updateDwellRing(null,0);}
  function stopCamera(msg=''){
    cameraActive=false;
    if(rafId){cancelAnimationFrame(rafId);rafId=0;}
    cancelDwell();cursorReady=false;
    const video=$('camera-video');
    if(video){try{video.pause();}catch(_){}video.srcObject=null;}
    if(mediaStream){try{mediaStream.getTracks().forEach(t=>t.stop());}catch(_){}mediaStream=null;}
    if(handLandmarker&&typeof handLandmarker.close==='function'){try{handLandmarker.close();}catch(_){}handLandmarker=null;}
    if($('hand-cursor'))$('hand-cursor').hidden=true;
    if($('camera-toggle-btn')){$('camera-toggle-btn').setAttribute('aria-expanded','false');$('camera-toggle-btn').hidden=false;}
    if($('camera-stop-btn'))$('camera-stop-btn').hidden=true;
    if(msg&&$('camera-status')){feedback('camera-status',msg);}
    else if($('camera-panel'))$('camera-panel').hidden=true;
  }
  async function loadHandLandmarker(){
    if(typeof window.__createHandLandmarker==='function')return await window.__createHandLandmarker();
    const vision=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs');
    const fileset=await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm');
    const modelAssetPath='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
    try{return await vision.HandLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath,delegate:'GPU'},runningMode:'VIDEO',numHands:1});}
    catch(_){return await vision.HandLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath,delegate:'CPU'},runningMode:'VIDEO',numHands:1});}
  }
  function processHandFrame(){
    if(!cameraActive||!handLandmarker)return;
    const video=$('camera-video'),arena=$('verdict-arena'),cursor=$('hand-cursor');
    if(video&&(video.readyState>=2||video.srcObject)&&arena&&cursor){
      const now=performance.now();
      let res=null;try{res=handLandmarker.detectForVideo(video,now);}catch(_){}
      const lm=res?.landmarks;
      const cnv=$('camera-canvas');
      if(cnv){
        const ctx=cnv.getContext('2d');ctx.clearRect(0,0,cnv.width,cnv.height);
        if(lm?.length&&lm[0][8]){
          const tip=lm[0][8];
          ctx.beginPath();ctx.arc((1-tip.x)*cnv.width,tip.y*cnv.height,8,0,Math.PI*2);
          ctx.fillStyle='#ff6b35';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
        }
      }
      if(lm?.length&&lm[0][8]){
        const tip=lm[0][8],rx=clamp(1-tip.x,0,1),ry=clamp(tip.y,0,1);
        if(!cursorReady){cursorNormX=rx;cursorNormY=ry;cursorReady=true;}
        else{cursorNormX+=(rx-cursorNormX)*.45;cursorNormY+=(ry-cursorNormY)*.45;}
        const ar=arena.getBoundingClientRect(),lx=cursorNormX*ar.width,ly=cursorNormY*ar.height;
        const sx=ar.left+lx,sy=ar.top+ly;
        cursor.hidden=false;cursor.style.left=`${lx}px`;cursor.style.top=`${ly}px`;
        let hovered=null;
        for(const b of document.querySelectorAll('[data-verdict]')){
          const br=b.getBoundingClientRect();
          if(sx>=br.left&&sx<=br.right&&sy>=br.top&&sy<=br.bottom){hovered=b.dataset.verdict;break;}
        }
        if(!hovered){gestureLocked=null;cancelDwell();}
        else if(gestureLocked===hovered){cancelDwell();}
        else{
          if(dwellTarget!==hovered){dwellTarget=hovered;dwellStart=now;}
          const elapsed=now-dwellStart,prog=clamp(elapsed/DWELL_MS,0,1);
          updateDwellRing(hovered,prog);
          if(elapsed>=DWELL_MS){
            gestureLocked=hovered;cancelDwell();
            const btn=document.querySelector(`[data-verdict="${hovered}"]`);
            btn?.click();
            return;
          }
        }
      }else{
        cursor.hidden=true;cursorReady=false;gestureLocked=null;cancelDwell();
      }
    }
    if(cameraActive)rafId=requestAnimationFrame(processHandFrame);
  }
  async function startCamera(){
    if(cameraActive){stopCamera();return;}
    const panel=$('camera-panel');
    panel.hidden=false;
    feedback('camera-status','Đang chuẩn bị camera...');
    if(!navigator.mediaDevices?.getUserMedia){
      feedback('camera-status','Thiết bị hoặc khung nhúng không hỗ trợ camera. Em hãy bấm chọn trực tiếp Đây là chai hoặc Đây là lon nhé.',false);
      return;
    }
    try{
      mediaStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
      const video=$('camera-video');video.srcObject=mediaStream;await video.play();
      handLandmarker=await loadHandLandmarker();
      cameraActive=true;
      $('camera-toggle-btn').setAttribute('aria-expanded','true');$('camera-toggle-btn').hidden=true;
      $('camera-stop-btn').hidden=false;
      feedback('camera-status','Đưa ngón trỏ vào ô Đây là chai hoặc Đây là lon và giữ khoảng 1 giây để chọn.');
      rafId=requestAnimationFrame(processHandFrame);
    }catch(_){
      stopCamera();panel.hidden=false;
      feedback('camera-status','Chưa bật được camera trên thiết bị này. Em hãy bấm chọn trực tiếp Đây là chai hoặc Đây là lon nhé.',false);
    }
  }
  $('camera-toggle-btn')?.addEventListener('click',startCamera);
  $('camera-stop-btn')?.addEventListener('click',()=>stopCamera());

  document.querySelectorAll('[data-predict]').forEach(b=>b.onclick=()=>{
    guess=b.dataset.predict;selected('predictions',b);
    feedback('ai-feedback',`Em dự đoán: ${guess}. AI mô phỏng gợi ý: “Chai”.`);
    $('more-clue').hidden=false;bringIntoView($('more-clue'));
  });
  function clueSelected(clue){
    if(solved)return;
    if(clue==='tab'){
      clueFound=true;feedback('clue-feedback','Em đã tìm được một chi tiết ở trên nắp. Dựa vào chi tiết đó, em chốt lại nhé!');$('verdict').hidden=false;
    }else{
      feedback('clue-feedback',clue==='body'?'Màu xanh và dáng thân chưa đủ để phân biệt. Em thử nhìn phần trên của vật chứng nhé!':'Đáy tròn có thể gặp ở nhiều đồ vật. Em thử nhìn phần trên nhé!',false);
    }
    bringIntoView(clueFound?$('verdict'):$('clue-feedback'));
  }
  $('more-clue').onclick=()=>{
    if(!guess)return;$('blur-stage').hidden=true;$('investigate-stage').hidden=false;$('case-instruction').textContent='Tìm chi tiết giúp em phân biệt chai và lon.';
    // Module cung cấp sẵn cả WebGL và ảnh tương tác, không cần tải mạng.
    viewer=window.createEvidenceModel($('model-host'),clueSelected);
    bringIntoView($('investigate-stage'));
  };
  document.querySelectorAll('[data-verdict]').forEach(b=>b.onclick=()=>{
    if(!clueFound||solved)return;selected('verdict',b);
    if(b.dataset.verdict!=='Lon'){
      feedback('verdict-feedback','Em xem lại chi tiết trên nắp nhé. Nó có giống cách mở một chiếc chai không?',false);return;
    }
    stopCamera();
    solved=true;$('case-solved').hidden=false;$('challenge-next').hidden=false;$('investigate-stage').hidden=true;$('initial-guess').textContent=`Lúc đầu em đoán: ${guess}.`;$('case-instruction').textContent='Em đã tự tìm manh mối và kiểm tra gợi ý của AI!';viewer?.destroy();viewer=null;bringIntoView($('case-solved'));
  });
  $('challenge-reset').onclick=()=>{
    stopCamera();
    viewer?.destroy();viewer=null;guess=null;clueFound=false;solved=false;
    $('model-host').replaceChildren();delete $('model-host').dataset.view;
    $('blur-stage').hidden=false;$('investigate-stage').hidden=true;$('case-solved').hidden=true;$('challenge-next').hidden=true;$('ai-feedback').hidden=true;$('more-clue').hidden=true;$('clue-feedback').hidden=true;$('verdict').hidden=true;$('verdict-feedback').hidden=true;$('case-instruction').textContent='Nhìn ảnh mờ. Em đoán đây là chai hay lon?';
    document.querySelectorAll('[data-predict],[data-verdict]').forEach(b=>b.setAttribute('aria-pressed','false'));document.querySelector('[data-predict]').focus({preventScroll:true});bringIntoView($('blur-stage'));
  };
  window.addEventListener('pagehide',()=>{stopCamera();viewer?.destroy();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&cameraActive)stopCamera();});
}

if(page==='practice'){
  const quiz=[
    {q:'Mai nói một từ tiếng Anh. Ứng dụng có AI nghe và gợi ý cách phát âm. AI đang giúp Mai việc gì?',a:['Luyện phát âm tiếng Anh.','Tự học thay Mai mọi môn học.','Giúp Mai không cần luyện nói nữa.'],key:0,why:['AI nghe giọng nói và gợi ý phát âm để Mai luyện tập. Mai vẫn cần tự nói và kiểm tra.','Ứng dụng này hỗ trợ phát âm, không học mọi môn thay Mai.','AI chỉ hỗ trợ. Mai vẫn cần luyện nói để tiến bộ.'],scene:'🗣️',bubble:'Hello!',label:'Mai luyện nói'},
    {q:'AI gợi ý cây trong ảnh là cây xoài. Nam chưa chắc. Nam nên làm gì?',a:['Ghi ngay “cây xoài” vì AI luôn đúng.','Nhìn rõ lá, quả và hỏi người biết về cây để đối chiếu.','Chọn đại một tên cây khác.'],key:1,why:['AI có thể nhầm khi ảnh thiếu chi tiết. Nam cần kiểm tra trước khi dùng tên cây.','Quan sát lá, quả và hỏi người biết về cây giúp Nam kiểm tra gợi ý của AI.','Đoán một tên khác chưa phải là kiểm tra. Nam cần xem đặc điểm thật và đối chiếu.'],scene:'🌳',bubble:'Cây xoài?',label:'Nam kiểm tra ảnh'}
  ];
  if (guided && !moodle) {
    const finish = document.querySelector('#quiz-summary a');
    finish.href = 'index.html';
    finish.textContent = 'Về đầu bài';
  }
  let current=0,answers=Array(quiz.length).fill(null),completed=false;
  const videoIntro = $('quiz-video-intro');
  const scoreContent = $('quiz-score-content');
  function renderQuiz(focus=false){
    const d=quiz[current];$('quiz-count').textContent=`Tình huống ${current+1} / ${quiz.length}`;$('quiz-question').textContent=d.q;
    $('quiz-exhibit').innerHTML=`<span class="scene-emoji">${d.scene}</span><span class="exhibit-bubble">${d.bubble}</span><span class="exhibit-label">${d.label}</span>`;
    $('quiz-answers').replaceChildren();$('quiz-feedback').hidden=true;$('quiz-next').disabled=true;$('quiz-next').textContent=current===quiz.length-1?'Xem kết quả →':'Tình huống tiếp theo →';
    d.a.forEach((a,i)=>{const b=document.createElement('button');b.className='choice';b.textContent=a;b.setAttribute('aria-pressed','false');b.onclick=()=>{answers[current]=i;selected('quiz-answers',b);feedback('quiz-feedback',(i===d.key?'Đúng rồi! ':'Chưa đúng. ')+d.why[i],i===d.key);$('quiz-next').disabled=false;};$('quiz-answers').append(b);});
    if(focus){$('quiz-question').focus({preventScroll:true});bringIntoView($('practice'));}
  }
  function restart(){current=0;completed=false;answers.fill(null);$('practice').hidden=false;$('quiz-summary').hidden=true;location.hash='practice';renderQuiz(true);}
  $('quiz-next').onclick = () => {
    if (answers[current] === null) return;
    if (current < quiz.length - 1) {
      current++;
      renderQuiz(true);
      return;
    }

    completed = true;
    const score = answers.reduce((sum, answer, index) => sum + Number(answer === quiz[index].key), 0);
    $('score').textContent = 'Em đúng ' + score + ' / ' + quiz.length + ' tình huống.';
    route();
    scoreContent.hidden = true;
    videoIntro.hidden = false;
    videoIntro.querySelector('button').focus({ preventScroll: true });
    bringIntoView(videoIntro);
  };
  $('quiz-reset').onclick=restart;$('quiz-again').onclick=restart;
  function route(){const isQ1=location.hash==='#q1';$('q1').hidden=!isQ1;$('practice-heading').hidden=isQ1||completed;$('practice').hidden=isQ1||completed;$('quiz-summary').hidden=isQ1||!completed;}
  window.addEventListener('hashchange',route);renderQuiz();route();
  $('copy').onclick=async()=>{
    $('manual-copy').hidden=true;
    const study=$('study').value.trim(),life=$('life').value.trim();
    if(!study||!life){feedback('copy-status','Em hãy viết đủ cả hai ví dụ, mỗi ví dụ có ứng dụng AI và việc AI hỗ trợ.',false);(!study?$('study'):$('life')).focus();return;}
    const text = moodle
      ? `${moodle.examplesTitle}\nKhi em học bài: ${study}\nTrong cuộc sống: ${life}`
      : `Q1 – Ứng dụng AI quanh em\n1. Trong học tập: ${study}\n2. Trong đời sống: ${life}`;
    try {
      await navigator.clipboard.writeText(text);
      feedback('copy-status', moodle
        ? 'Đã sao chép! Mở bài nộp trên Moodle rồi dán câu trả lời của em.'
        : 'Đã sao chép! Em hãy mở Azota, vào bài Q1, dán câu trả lời và nộp bài.');
    } catch {
      feedback('copy-status', moodle
        ? 'Sao chép phần đã chọn bên dưới rồi dán vào bài nộp trên Moodle.'
        : 'Trình duyệt chưa cho phép sao chép tự động. Em hãy sao chép nội dung đã chọn bên dưới, rồi dán vào Q1 trên Azota.', false);
      $('copy-output').value=text;$('manual-copy').hidden=false;$('copy-output').focus();$('copy-output').select();
    }
  };
}
