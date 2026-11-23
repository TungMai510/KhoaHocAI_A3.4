'use strict';
const $ = id => document.getElementById(id);
const page = document.body.dataset.page;
const moodle = window.Bai1Moodle;
const steps = moodle ? [
  ['Khám phá', moodle.url('/mod/url/view.php?id=45')],
  ['Thử dự đoán', moodle.url('/mod/url/view.php?id=57')],
  ['Tự luyện', moodle.url('/mod/url/view.php?id=58')],
  ['Gửi ví dụ của em', moodle.url('/mod/assign/view.php?id=59')]
] : [['Khám phá','hl1_kham_pha.html'],['Thử dự đoán','hl2_mo_phong.html'],['Tự luyện','hl3_luyen_tap.html'],['Nộp Q1','hl3_luyen_tap.html#q1']];
// Chỉ thể hiện vị trí đang học, không xác nhận đã nộp bài trên Azota.
function progress(step){
  $('journey').innerHTML=steps.map(([label,href],i)=>`<a href="${href}" ${moodle?'target="_top"':''} ${i+1===step?'aria-current="step"':''} class="${i+1<step?'done':''}"><span class="number">${i+1}</span>${label}</a>`).join('');
  $('progress-label').textContent=step?`Chặng ${step}: ${steps[step-1][0]}`:'Mỗi manh mối, một khám phá!';
  $('progress-count').textContent=step?`${step} / 4`:'4 chặng nhỏ';
  document.querySelector('.progress-fill').style.width=`${step*25}%`;
  document.querySelector('[role=progressbar]').setAttribute('aria-valuenow',step);
}
progress({home:0,explore:1,challenge:2,practice:3}[page]);
function feedback(id,text,correct=true){const el=$(id);el.hidden=false;el.textContent=text;el.className='feedback'+(correct?'':' wrong');if(correct&&window.AzotaEmbed?.active)el.classList.add('azota-success');}
function selected(container,button){document.querySelectorAll(`#${container} button`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
function bringIntoView(el){if(el.getBoundingClientRect().top<0||el.getBoundingClientRect().bottom>innerHeight)el.scrollIntoView({block:'nearest'});}

if(page==='explore'){
  const foods={apple:{source:'I like apples.',translation:'Tôi thích táo.',word:'apples'},banana:{source:'I like bananas.',translation:'Tôi thích chuối.',word:'bananas'},milk:{source:'I like milk.',translation:'Tôi thích sữa.',word:'milk'}};
  let food=null, translated=false;
  function clearTranslation(){translated=false;$('translation-panel').hidden=true;$('translation-result').textContent='';$('source-sentence').textContent='';$('translation-feedback').hidden=true;$('explore-next').hidden=true;document.querySelectorAll('[data-check]').forEach(b=>b.setAttribute('aria-pressed','false'));}
  document.querySelectorAll('[data-food]').forEach(b=>b.addEventListener('click',()=>{
    food=b.dataset.food;clearTranslation();selected('food-cards',b);$('try-translate').disabled=false;$('selected-sentence').textContent=`Em đã chọn: ${foods[food].source}`;
    b.querySelector('small').textContent='Đã chọn ✓';document.querySelectorAll('[data-food]').forEach(other=>{if(other!==b)other.querySelector('small').textContent='Chọn thẻ này';});
  }));
  $('try-translate').onclick=()=>{
    if(!food)return;translated=true;$('choose-stage').hidden=true;$('translation-panel').hidden=false;$('source-sentence').textContent=foods[food].source;$('translation-result').textContent=foods[food].translation;
    $('food-instruction').textContent='Chọn món khớp với bản dịch để kiểm tra giúp Sóc.';
    document.querySelector('[data-check]').focus({preventScroll:true});bringIntoView($('translation-panel'));
  };
  document.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{
    if(!translated)return;selected('food-checks',b);const correct=b.dataset.check===food;
    feedback('translation-feedback',correct?'Em đưa câu tiếng Anh vào, AI gợi ý bản dịch, rồi em kiểm tra.':`Chưa khớp rồi! Đọc lại từ “${foods[food].word}” và bản dịch, rồi chọn món khác nhé.`,correct);
    $('explore-next').hidden=!correct;bringIntoView($('translation-feedback'));
  });
  $('change-food').onclick=()=>{
    clearTranslation();food=null;$('choose-stage').hidden=false;$('try-translate').disabled=true;$('selected-sentence').textContent='Em muốn thử câu nào?';$('food-instruction').innerHTML='Sóc nhờ em: Chọn một thẻ câu rồi bấm <strong>Thử dịch</strong>.';document.querySelectorAll('[data-food]').forEach(b=>{b.setAttribute('aria-pressed','false');b.querySelector('small').textContent='Chọn thẻ này';});document.querySelector('[data-food]').focus({preventScroll:true});bringIntoView($('choose-stage'));
  };
}

if(page==='challenge'){
  let guess=null,clueFound=false,solved=false,viewer=null;
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
    if(!guess)return;$('blur-stage').hidden=true;$('investigate-stage').hidden=false;$('case-instruction').textContent='Xoay vật chứng và chọn một chi tiết để kiểm tra.';
    // Module cung cấp sẵn cả WebGL và ảnh tương tác, không cần tải mạng.
    viewer=window.createEvidenceModel($('model-host'),clueSelected);
    bringIntoView($('investigate-stage'));
  };
  document.querySelectorAll('[data-verdict]').forEach(b=>b.onclick=()=>{
    if(!clueFound||solved)return;selected('verdict',b);
    if(b.dataset.verdict!=='Lon'){
      feedback('verdict-feedback','Em xem lại chi tiết trên nắp nhé. Nó có giống cách mở một chiếc chai không?',false);return;
    }
    solved=true;$('case-solved').hidden=false;$('challenge-next').hidden=false;$('investigate-stage').hidden=true;$('initial-guess').textContent=`Lúc đầu em đoán: ${guess}.`;$('case-instruction').textContent='Em đã tự tìm manh mối và kiểm tra gợi ý của AI!';viewer?.destroy();viewer=null;bringIntoView($('case-solved'));
  });
  $('challenge-reset').onclick=()=>{
    viewer?.destroy();viewer=null;guess=null;clueFound=false;solved=false;
    $('model-host').replaceChildren();delete $('model-host').dataset.view;
    $('blur-stage').hidden=false;$('investigate-stage').hidden=true;$('case-solved').hidden=true;$('challenge-next').hidden=true;$('ai-feedback').hidden=true;$('more-clue').hidden=true;$('clue-feedback').hidden=true;$('verdict').hidden=true;$('verdict-feedback').hidden=true;$('case-instruction').textContent='Nhìn vật chứng và chọn dự đoán của em.';
    document.querySelectorAll('[data-predict],[data-verdict]').forEach(b=>b.setAttribute('aria-pressed','false'));document.querySelector('[data-predict]').focus({preventScroll:true});bringIntoView($('blur-stage'));
  };
  window.addEventListener('pagehide',()=>viewer?.destroy());
}

if(page==='practice'){
  const quiz=[
    {q:'Mai nói một từ tiếng Anh. Ứng dụng có AI nghe và gợi ý cách phát âm. AI đang giúp Mai việc gì?',a:['Luyện phát âm tiếng Anh.','Tự học thay Mai mọi môn học.','Giúp Mai không cần luyện nói nữa.'],key:0,why:['AI nghe giọng nói và gợi ý phát âm để Mai luyện tập. Mai vẫn cần tự nói và kiểm tra.','Ứng dụng này hỗ trợ phát âm, không học mọi môn thay Mai.','AI chỉ hỗ trợ. Mai vẫn cần luyện nói để tiến bộ.'],scene:'🗣️',bubble:'Hello!',label:'Mai luyện nói'},
    {q:'AI gợi ý cây trong ảnh là cây xoài. Nam chưa chắc. Nam nên làm gì?',a:['Ghi ngay “cây xoài” vì AI luôn đúng.','Nhìn rõ lá, quả và hỏi người biết về cây để đối chiếu.','Chọn đại một tên cây khác.'],key:1,why:['AI có thể nhầm khi ảnh thiếu chi tiết. Nam cần kiểm tra trước khi dùng tên cây.','Quan sát lá, quả và hỏi người biết về cây giúp Nam kiểm tra gợi ý của AI.','Đoán một tên khác chưa phải là kiểm tra. Nam cần xem đặc điểm thật và đối chiếu.'],scene:'🌳',bubble:'Cây xoài?',label:'Nam kiểm tra ảnh'}
  ];
  let current=0,answers=Array(quiz.length).fill(null),completed=false;
  function renderQuiz(focus=false){
    const d=quiz[current];$('quiz-count').textContent=`Tình huống ${current+1} / ${quiz.length}`;$('quiz-question').textContent=d.q;
    $('quiz-exhibit').innerHTML=`<span class="scene-emoji">${d.scene}</span><span class="exhibit-bubble">${d.bubble}</span><span class="exhibit-label">${d.label}</span>`;
    $('quiz-answers').replaceChildren();$('quiz-feedback').hidden=true;$('quiz-next').disabled=true;$('quiz-next').textContent=current===quiz.length-1?'Xem kết quả →':'Tình huống tiếp theo →';
    d.a.forEach((a,i)=>{const b=document.createElement('button');b.className='choice';b.textContent=a;b.setAttribute('aria-pressed','false');b.onclick=()=>{answers[current]=i;selected('quiz-answers',b);feedback('quiz-feedback',(i===d.key?'Đúng rồi! ':'Chưa đúng. ')+d.why[i],i===d.key);$('quiz-next').disabled=false;};$('quiz-answers').append(b);});
    if(focus){$('quiz-question').focus({preventScroll:true});bringIntoView($('practice'));}
  }
  function restart(){current=0;completed=false;answers.fill(null);$('practice').hidden=false;$('quiz-summary').hidden=true;location.hash='practice';renderQuiz(true);}
  $('quiz-next').onclick=()=>{if(answers[current]===null)return;if(current<quiz.length-1){current++;renderQuiz(true);}else{completed=true;const score=answers.reduce((sum,a,i)=>sum+Number(a===quiz[i].key),0);$('practice').hidden=true;$('quiz-summary').hidden=false;$('score').textContent=`Em đúng ${score} / ${quiz.length} tình huống.`;$('score').focus({preventScroll:true});bringIntoView($('quiz-summary'));}};
  $('quiz-reset').onclick=restart;$('quiz-again').onclick=restart;
  function route(){const isQ1=location.hash==='#q1';$('q1').hidden=!isQ1;$('practice-heading').hidden=isQ1;$('practice').hidden=isQ1||completed;$('quiz-summary').hidden=isQ1||!completed;$('practice-score-note').hidden=isQ1;progress(isQ1?4:3);}
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
