'use strict';
const $ = id => document.getElementById(id);
const page = document.body.dataset.page;
const steps = [ ['Khám phá', 'hl1_kham_pha.html'], ['Thử dự đoán', 'hl2_mo_phong.html'], ['Tự luyện', 'hl3_luyen_tap.html'], ['Nộp Q1', 'hl3_luyen_tap.html#q1'] ];
// Tiến trình thể hiện vị trí hiện tại; không tuyên bố học sinh đã nộp Azota.
function progress(step) {
  $('journey').innerHTML = steps.map(([label, href], i) => `<a href="${href}" ${i + 1 === step ? 'aria-current="step"' : ''} class="${i + 1 < step ? 'done' : ''}"><span class="number">${i + 1}</span>${label}</a>`).join('');
  $('progress-label').textContent = step ? `Em đang ở chặng ${step}: ${steps[step - 1][0]}` : 'Sẵn sàng nhận nhiệm vụ?';
  $('progress-count').textContent = step ? `${step} / 4` : '4 chặng khám phá';
  document.querySelector('.progress-fill').style.width = `${step * 25}%`;
  document.querySelector('[role=progressbar]').setAttribute('aria-valuenow', step);
}
progress({home:0, explore:1, challenge:2, practice:3}[page]);
function feedback(id, text, correct = true) {
  const el = $(id); el.hidden = false; el.textContent = text; el.className = 'feedback' + (correct ? '' : ' wrong');
}
function selected(container, button) {
  document.querySelectorAll(`#${container} button`).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
}
if (page === 'explore') {
  let current = 0;
  const cases = [
    {title:'Hồ sơ 01 · Học tập', exhibit:'<p class="muted">Câu tiếng Anh em muốn hiểu</p><p class="english" lang="en">Good morning!</p><p aria-hidden="true">↓ AI gợi ý ↓</p><p class="translation">Chào buổi sáng!</p>', input:'Câu tiếng Anh “Good morning!”.', help:'Gợi ý bản dịch tiếng Việt để em hiểu câu.', check:'Đọc lại câu gốc và bản dịch; đối chiếu từ điển hoặc hỏi thầy cô xem có đúng ý, hợp tình huống không.', question:'AI giúp em việc gì trong tình huống này?', answers:['Gợi ý bản dịch để em tham khảo.','Học tiếng Anh thay em, em không cần kiểm tra.'], correct:0, explanations:['Đúng rồi! AI hỗ trợ dịch. Em vẫn cần hiểu câu và kiểm tra bản dịch.','Chưa đúng. AI chỉ gợi ý bản dịch; em vẫn cần học và kiểm tra nghĩa của câu.']},
    {title:'Hồ sơ 02 · Đời sống', exhibit:'<img src="assets/can.svg" alt="Hình minh hoạ một chiếc lon màu xanh"><p class="translation">AI gợi ý: “Lon”</p>', input:'Hình ảnh một đồ vật, như chai hoặc lon.', help:'Gợi ý đồ vật trong ảnh là chai hay lon để hỗ trợ phân loại.', check:'Quan sát ảnh rõ hoặc vật thật: miệng, nắp, thân và chất liệu. Kiểm tra hướng dẫn phân loại ở nơi em sống.', question:'AI nhận thông tin gì để gợi ý chai hay lon?', answers:['Một bài hát về đồ vật.','Hình ảnh của đồ vật.'], correct:1, explanations:['Chưa đúng. Nhận dạng hình ảnh cần ảnh đồ vật để tìm các đặc điểm như miệng, nắp và thân.','Đúng rồi! Ảnh là thông tin đầu vào. Ảnh mờ có thể khiến AI nhầm chai với lon.']}
  ];
  function renderCase(i) {
    current = i; const d = cases[i];
    $('case-study').setAttribute('aria-pressed', String(i===0)); $('case-life').setAttribute('aria-pressed', String(i===1));
    $('case-content').innerHTML = `<span class="tag">${d.title}</span><div class="case-layout"><div class="exhibit">${d.exhibit}</div><dl class="facts"><div><dt>01 · AI nhận gì?</dt><dd>${d.input}</dd></div><div><dt>02 · AI giúp gì?</dt><dd>${d.help}</dd></div><div><dt>03 · Em kiểm tra ở đâu?</dt><dd>${d.check}</dd></div></dl></div>`;
    $('case-question').textContent = d.question;
    $('case-answers').replaceChildren();
    d.answers.forEach((answer,j)=>{const b=document.createElement('button'); b.className='choice'; b.textContent=answer; b.setAttribute('aria-pressed','false'); b.onclick=()=>{selected('case-answers',b);feedback('case-feedback',d.explanations[j],j===d.correct);$('case-next').hidden=false;};$('case-answers').append(b);});
    $('case-feedback').hidden=true; $('case-next').hidden=true;
    $('case-next').textContent = i===0 ? 'Tiếp theo: Nhận biết chai / lon →' : 'Tiếp theo: Thử dự đoán →';
  }
  $('case-study').onclick=()=>renderCase(0); $('case-life').onclick=()=>renderCase(1);
  $('case-next').onclick=()=>{if(current===0) {renderCase(1);$('case-life').focus();} else location.href='hl2_mo_phong.html';}; renderCase(0);
}
if (page === 'challenge') {
  let round=0, guess=null, guesses=[], revealed=false;
  const predictButtons=[...document.querySelectorAll('[data-predict]')];
  function resetRound() {
    guess=null;revealed=false;
    predictButtons.forEach(b=>{b.disabled=false;b.setAttribute('aria-pressed','false');});
    $('prediction-status').textContent='';$('reveal').disabled=true;$('reveal').hidden=false;
    $('ai-feedback').hidden=true;$('clear-photo').hidden=true;
  }
  predictButtons.forEach(b=>b.onclick=()=>{if(revealed)return;guess=b.dataset.predict;selected('predictions',b);$('prediction-status').textContent=`Em dự đoán: ${guess}. Giờ hãy xem AI gợi ý gì.`;$('reveal').disabled=false;});
  $('reveal').onclick=()=>{
    if(!guess || revealed)return;revealed=true;guesses[round]=guess;
    predictButtons.forEach(b=>b.disabled=true);$('reveal').hidden=true;
    if(round===0){feedback('ai-feedback',`Em dự đoán: ${guess}. AI mô phỏng gợi ý: “Chai”. Ảnh mờ làm nhoè miệng lon và khoen kéo; đường viền thân khó thấy nên AI có thể nhầm với chai. Chưa vội kết luận nhé!`,false);$('clear-photo').hidden=false;}
    else {feedback('ai-feedback',`Em dự đoán: ${guess}. AI mô phỏng gợi ý: “Lon”. Ảnh rõ cho thấy thân hình trụ, nắp kim loại và khoen kéo. Đây là một chiếc lon. Ảnh rõ giúp kiểm tra dễ hơn, nhưng AI vẫn có thể sai.`);$('guess-blur').textContent=`Em đã đoán: ${guesses[0]}.`;$('guess-clear').textContent=`Em đã đoán: ${guesses[1]}.`;$('comparison').hidden=false;}
  };
  $('clear-photo').onclick=()=>{round=1;resetRound();$('photo-frame').classList.remove('blurred');$('evidence-img').alt='Ảnh rõ hơn: một chiếc lon xanh có thân hình trụ, nắp kim loại và khoen kéo.';$('photo-caption').textContent='Manh mối B · Cùng đồ vật, ảnh rõ hơn';$('round-label').textContent='LƯỢT 2 / 2 · QUAN SÁT ẢNH RÕ';$('prediction-title').textContent='Nhìn rõ hơn, em đoán lại nhé!';predictButtons[0].focus();};
  document.querySelectorAll('[data-reflect]').forEach(b=>b.onclick=()=>{selected('reflection',b);const correct=b.dataset.reflect==='1';feedback('reflection-feedback',correct?'Đúng rồi! AI có thể nhầm khi thiếu chi tiết. Em cần xem ảnh rõ, nhìn vật thật và kiểm tra gợi ý trước khi dùng.':b.dataset.reflect==='0'?'Chưa đúng. Gợi ý “Chai” ở ảnh mờ đã sai. AI có thể nhầm, nên em cần tự kiểm tra.':'Chưa đúng. Ảnh rõ giúp thấy nhiều chi tiết hơn, nhưng không bảo đảm AI luôn đúng. Em vẫn cần kiểm tra.',correct);$('challenge-next').hidden=false;});
  $('challenge-reset').onclick=()=>{round=0;guesses=[];resetRound();$('photo-frame').classList.add('blurred');$('evidence-img').alt='Đồ vật màu xanh bị làm mờ, khó thấy rõ phần miệng và thân.';$('photo-caption').textContent='Manh mối A · Ảnh mờ';$('round-label').textContent='LƯỢT 1 / 2 · QUAN SÁT ẢNH MỜ';$('prediction-title').textContent='Em đoán đây là gì?';$('comparison').hidden=true;$('reflection-feedback').hidden=true;$('challenge-next').hidden=true;document.querySelectorAll('[data-reflect]').forEach(b=>b.setAttribute('aria-pressed','false'));predictButtons[0].focus();};
}
if (page === 'practice') {
  // Giữ lại bốn câu hỏi và đáp án từ học liệu gốc.
  const quiz=[
    {q:'Khi học từ tiếng Anh, ứng dụng dịch giúp em việc gì?',a:['Gợi ý bản dịch để em tham khảo.','Bảo đảm em luôn hiểu đúng mà không cần kiểm tra.','Tự quyết định mọi việc học thay em.'],key:0,why:['Ứng dụng dịch gợi ý nghĩa của từ hoặc câu. Em cần kiểm tra xem có hợp ngữ cảnh không.','AI có thể dịch chưa đúng ý. Em cần đối chiếu câu gốc, từ điển hoặc hỏi thầy cô.','AI hỗ trợ dịch, còn em vẫn học và tự quyết định cách dùng bản dịch.']},
    {q:'Ở góc phân loại rác, AI nhận biết chai – lon thường cần dữ liệu gì?',a:['Một bài hát.','Hình ảnh đồ vật.','Thời khóa biểu.'],key:1,why:['Bài hát không cho thấy miệng, nắp hay thân đồ vật. Công cụ này cần hình ảnh.','AI tìm các đặc điểm trong ảnh để gợi ý chai hay lon.','Thời khóa biểu cho biết giờ học, không cho thấy hình dạng đồ vật. AI nhận dạng cần hình ảnh.']},
    {q:'Nếu ứng dụng trả lời “lon” nhưng vật thật là chai, em nên làm gì?',a:['Tin ngay vì máy không thể sai.','Giấu kết quả vì em trả lời không đúng.','Quan sát lại và ghi nhận AI dự đoán chưa đúng.'],key:2,why:['Máy có thể nhầm. Em cần nhìn vật thật, không làm theo gợi ý sai.','Không cần giấu. Phát hiện AI nhầm là một cách kiểm tra rất tốt.','Đối chiếu với vật thật giúp em nhận ra gợi ý sai và chọn cách xử lí phù hợp.']},
    {q:'Ví dụ nào nêu đúng ứng dụng AI và việc nó hỗ trợ trong đời sống?',a:['Điện thoại: có màn hình to.','Nhận dạng hình ảnh: gợi ý chai hay lon trong ảnh.','Cái bàn: giúp ngồi học.'],key:1,why:['Màn hình to là đặc điểm của thiết bị, chưa nêu ứng dụng AI và việc AI hỗ trợ.','Ví dụ nêu cả ứng dụng AI (nhận dạng hình ảnh) và việc hỗ trợ (gợi ý chai hay lon).','Cái bàn giúp ngồi học nhưng không phải ứng dụng AI.']}
  ];
  let current=0, answers=Array(4).fill(null), completed=false;
  function renderQuiz(focus=false){const d=quiz[current];$('quiz-count').textContent=`Câu ${current+1} / 4`;$('quiz-question').textContent=d.q;$('quiz-answers').replaceChildren();$('quiz-feedback').hidden=true;$('quiz-next').disabled=true;$('quiz-next').textContent=current===3?'Xem kết quả tự luyện →':'Câu tiếp theo →';d.a.forEach((a,i)=>{const b=document.createElement('button');b.className='choice';b.textContent=a;b.setAttribute('aria-pressed','false');b.onclick=()=>{answers[current]=i;selected('quiz-answers',b);feedback('quiz-feedback',(i===d.key?'Đúng rồi! ':'Chưa đúng. ')+d.why[i],i===d.key);$('quiz-next').disabled=false;};$('quiz-answers').append(b);});if(focus)$('quiz-question').focus();}
  function restart(){current=0;completed=false;answers.fill(null);$('practice').hidden=false;$('quiz-summary').hidden=true;location.hash='practice';renderQuiz(true);}
  $('quiz-next').onclick=()=>{if(answers[current]===null)return;if(current<3){current++;renderQuiz(true);}else{completed=true;const score=answers.reduce((sum,a,i)=>sum+Number(a===quiz[i].key),0);$('practice').hidden=true;$('quiz-summary').hidden=false;$('score').textContent=`Em đúng ${score} / 4 câu.`;$('score').focus();}};
  $('quiz-reset').onclick=restart;$('quiz-again').onclick=restart;
  function route(){const isQ1=location.hash==='#q1';$('q1').hidden=!isQ1;$('practice-heading').hidden=isQ1;$('practice').hidden=isQ1||completed;$('quiz-summary').hidden=isQ1||!completed;progress(isQ1?4:3);}
  window.addEventListener('hashchange',route);renderQuiz();route();
  $('copy').onclick=async()=>{
    $('manual-copy').hidden=true;
    const study=$('study').value.trim(),life=$('life').value.trim();
    if(!study||!life){feedback('copy-status','Em hãy viết đủ cả hai ví dụ, mỗi ví dụ có ứng dụng AI và việc AI hỗ trợ.',false);(!study?$('study'):$('life')).focus();return;}
    const text=`Q1 – Ứng dụng AI quanh em\n1. Trong học tập: ${study}\n2. Trong đời sống: ${life}`;
    try{await navigator.clipboard.writeText(text);feedback('copy-status','Đã sao chép! Em hãy mở Azota, vào bài Q1, dán câu trả lời và nộp bài.');}
    catch{feedback('copy-status','Trình duyệt chưa cho phép sao chép tự động. Em hãy sao chép nội dung đã chọn bên dưới, rồi dán vào Q1 trên Azota.',false);$('copy-output').value=text;$('manual-copy').hidden=false;$('copy-output').focus();$('copy-output').select();}
  };
}
