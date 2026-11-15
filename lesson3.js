'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const storageKey = 'ai4.idea.v1';
  const scenarios = {
    waste: {
      problem: 'Góc phân loại rác của lớp thường bị bỏ nhầm chai và lon.',
      icon: '♻️', label: 'Chai và lon bị bỏ nhầm',
      data: [
        { label: 'Ảnh chai và lon, thấy rõ nắp và thân.', correct: true, why: 'Đúng rồi! AI cần thấy đặc điểm của chai và lon để gợi ý phân loại.' },
        { label: 'Lịch học của lớp.', correct: false, why: 'Lịch học cho biết giờ học, không cho thấy hình dạng chai và lon. Em chọn dữ liệu giúp AI nhìn thấy đồ vật nhé.' },
        { label: 'Một bài hát về môi trường.', correct: false, why: 'Bài hát nhắc chúng ta bảo vệ môi trường, nhưng không cho AI thấy nắp và thân của đồ vật cần phân loại.' }
      ],
      support: [
        { label: 'Gợi ý vật trong ảnh là chai hay lon để hỗ trợ phân loại.', correct: true, why: 'Đúng rồi! Từ ảnh chai và lon, AI có thể gợi ý phân loại. Em vẫn kiểm tra đồ vật trước khi bỏ vào thùng.' },
        { label: 'Tự nhặt và bỏ mọi rác vào thùng, không cần thiết bị khác.', correct: false, why: 'Nhìn ảnh chỉ giúp AI gợi ý loại đồ vật. Muốn tự nhặt rác còn cần thiết bị thực hiện; ý tưởng này chưa có thiết bị đó.' },
        { label: 'Gợi ý bài hát để lớp hát đầu giờ.', correct: false, why: 'Bài hát không giải quyết việc bỏ nhầm chai và lon. Em chọn việc hỗ trợ phân loại nhé.' }
      ],
      explanation: 'Ảnh rõ cho AI thấy nắp và thân → AI gợi ý chai hay lon → giúp lớp giảm bỏ nhầm. Con người vẫn kiểm tra gợi ý.'
    },
    books: {
      problem: 'Góc sách của lớp có nhiều cuốn bị đặt nhầm ngăn.',
      icon: '📚', label: 'Sách bị đặt nhầm ngăn',
      data: [
        { label: 'Ảnh bìa, tên sách và các nhóm sách của lớp.', correct: true, why: 'Đúng rồi! Tên và ảnh bìa giúp nhận biết cuốn sách; các nhóm sách giúp AI gợi ý ngăn phù hợp.' },
        { label: 'Lịch tưới cây của lớp.', correct: false, why: 'Lịch tưới cây không cho biết cuốn sách nói về điều gì hay thuộc nhóm nào. Em chọn dữ liệu về sách nhé.' },
        { label: 'Ảnh chiếc thùng rác.', correct: false, why: 'Ảnh thùng rác không giúp nhận biết tên và nhóm của sách. AI cần thông tin về những cuốn sách.' }
      ],
      support: [
        { label: 'Gợi ý ngăn sách phù hợp với tên và bìa sách.', correct: true, why: 'Đúng rồi! AI dùng thông tin sách để gợi ý ngăn. Em kiểm tra nhãn ngăn rồi tự xếp sách.' },
        { label: 'Tự mang mọi cuốn sách về đúng chỗ chỉ nhờ ảnh.', correct: false, why: 'Từ ảnh, AI có thể gợi ý ngăn sách. Muốn tự mang sách còn cần thiết bị thực hiện; em vẫn tự xếp sách.' },
        { label: 'Đổi lịch học của lớp.', correct: false, why: 'Đổi lịch học không giải quyết sách đặt nhầm ngăn. Em chọn việc liên quan đến sắp xếp sách nhé.' }
      ],
      explanation: 'Tên, bìa và nhóm sách → AI gợi ý ngăn phù hợp → giúp lớp xếp sách dễ hơn. Em vẫn kiểm tra nhãn ngăn.'
    }
  };
  let stage = 0, problem = null, data = null, support = null, currentIdea = null;
  let q6Draft = null;
  function message(id, text, correct = true) { const el = $(id); el.textContent = text; el.hidden = false; el.className = 'feedback' + (correct ? '' : ' wrong'); }
  function markChoice(button) { $('q5-choices').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); }
  function focusTitle(id) { $(id).focus({ preventScroll: true }); if ($(id).getBoundingClientRect().top < 0) $(id).scrollIntoView({ block: 'nearest' }); }
  function stepper(index) { document.querySelectorAll('[data-design-step]').forEach(el => { if (Number(el.dataset.designStep) === index) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); }); }
  function show(section) { ['q5-stage', 'idea-preview', 'q6-stage'].forEach(id => $(id).hidden = id !== section); }
  function save(idea) {
    try { localStorage.setItem(storageKey, JSON.stringify(idea)); $('idea-storage-status').hidden = true; }
    catch (_) { message('idea-storage-status', 'Trình duyệt chưa cho lưu phiếu. Em vẫn có thể sao chép; Bài 4 luôn có ý tưởng mẫu để bắt đầu.', false); }
  }
  function render(focus = false) {
    show('q5-stage'); stepper(stage);
    const scenario = scenarios[problem];
    $('q5-feedback').hidden = true; $('q5-next').disabled = true; $('q5-back').hidden = stage === 0;
    $('q5-step-label').textContent = `Ví dụ có gợi ý · Bước ${stage + 1} / 3`;
    $('lesson3-instruction').textContent = ['Chọn một việc của lớp mà em muốn AI hỗ trợ.', 'Chọn dữ liệu giúp AI hiểu đúng vấn đề.', 'Chọn việc AI có thể hỗ trợ từ dữ liệu đó.'][stage];
    $('q5-title').textContent = ['Lớp em đang gặp vấn đề nào?', 'AI cần xem dữ liệu gì?', 'AI sẽ giúp lớp làm việc gì?'][stage];
    $('q5-next').textContent = ['Chọn dữ liệu →', 'Chọn việc AI hỗ trợ →', 'Tự viết hai ý tưởng Q5 →'][stage];
    $('q5-context').textContent = stage ? scenario.problem : 'Em chọn tình huống mẫu về chai/lon, hoặc thử góc sách.';
    $('q5-exhibit').replaceChildren();
    if (stage === 0 || problem === 'waste') {
      const image = document.createElement('img'); image.src = 'assets/can.svg'; image.alt = ''; $('q5-exhibit').append(image);
    }
    if (stage === 0 || problem === 'books') {
      const exhibit = document.createElement('span'); exhibit.className = 'scene-emoji'; exhibit.textContent = '📚'; $('q5-exhibit').append(exhibit);
    }
    $('q5-choices').replaceChildren();
    const choices = stage === 0 ? Object.entries(scenarios).map(([key,s]) => ({key,label:s.label,correct:true,why:`Em chọn vấn đề: ${s.problem} Tiếp theo, hãy tìm dữ liệu phù hợp để AI hỗ trợ.`})) : scenario[stage === 1 ? 'data' : 'support'];
    choices.forEach((choice, index) => {
      const button = document.createElement('button'); button.className = 'choice'; button.type = 'button'; button.textContent = choice.label; button.dataset.q5Choice = choice.key || String(index); button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        markChoice(button);
        if (stage === 0) { problem = choice.key; data = null; support = null; }
        if (stage === 1) { data = choice.correct ? index : null; support = null; }
        if (stage === 2) support = choice.correct ? index : null;
        message('q5-feedback', choice.why, choice.correct); $('q5-next').disabled = !choice.correct;
      });
      $('q5-choices').append(button);
    });
    if (focus) focusTitle('q5-title');
  }
  let ideas=[], expanded=null;
  const keys=['problem','data','result','user'];
  function text(){return 'PHIẾU Ý TƯỞNG AI — Q5\n'+ideas.map((a,i)=>`Ý tưởng ${i+1}\nVấn đề: ${a.problem}\nAI hỗ trợ: ${a.support}`).join('\n\n')+(expanded?'\n\nQ6 — Phát triển ý tưởng '+(expanded.index+1)+'\n'+keys.map((k,i)=>['Vấn đề','Dữ liệu','Kết quả','Người sử dụng'][i]+': '+expanded[k]).join('\n'):'');}
  function review(){show('idea-preview');$('q5-write').hidden=true;stepper(3);$('ideas-text').textContent=text();$('idea-source').textContent=expanded?'Q5 + Q6 · Phiếu của em':'Q5 · Hai ý tưởng của em';$('idea-explanation').textContent='Đọc lại: mỗi ý tưởng đã nêu rõ vấn đề và việc AI hỗ trợ chưa?';$('idea-copy-status').hidden=true;$('idea-manual-copy').hidden=true;save({version:1,...(expanded?{problem:expanded.problem,support:expanded.result}:ideas[0]),data:expanded?.data||'Chưa phát triển dữ liệu ở Q6',source:expanded?'Q6':'Q5',ideas,expanded});focusTitle('idea-title');}
  $('q5-next').onclick=()=>{if(stage===0&&problem){stage=1;render(true);}else if(stage===1&&data!==null){stage=2;render(true);}else if(stage===2&&support!==null){show('none');$('q5-write').hidden=false;stepper(3);$('lesson3-instruction').textContent='Tự viết hai ý tưởng AI cho hai vấn đề khác nhau.';}};
  $('q5-back').onclick=()=>{if(stage>0){stage--;data=null;support=null;render(true);}};
  $('own-preview').onclick=()=>{const draft=[1,2].map(i=>({problem:$('own-problem-'+i).value.trim(),support:$('own-support-'+i).value.trim()}));if(draft.some(a=>!a.problem||!a.support)){message('own-feedback','Em viết đủ vấn đề và việc AI hỗ trợ cho cả hai ý tưởng nhé.',false);return;}if(draft[0].problem.toLowerCase()===draft[1].problem.toLowerCase()){message('own-feedback','Em chọn hai vấn đề khác nhau nhé.',false);return;}ideas=draft;expanded=null;review();};
  $('q5-edit').onclick=()=>{show('none');$('q5-write').hidden=false;};
  function seed(){const i=Number($('q6-choice').value),a=ideas[i];keys.forEach(k=>$('q6-'+k).value=expanded?.index===i?expanded[k]:(k==='problem'?a.problem:k==='result'?a.support:''));}
  $('q6-open').onclick=()=>{show('q6-stage');$('q5-write').hidden=true;$('q6-feedback').hidden=true;seed();};
  $('q6-choice').onchange=seed;
  $('idea-form').onsubmit=ev=>{ev.preventDefault();const draft={index:Number($('q6-choice').value)};for(const k of keys){draft[k]=$('q6-'+k).value.trim();if(!draft[k]){message('q6-feedback','Em điền đủ Vấn đề – Dữ liệu – Kết quả – Người sử dụng nhé.',false);$('q6-'+k).focus();return;}}expanded=draft;review();};
  $('q6-cancel').onclick=review;
  $('idea-copy').onclick=async()=>{try{await navigator.clipboard.writeText(text());message('idea-copy-status','Đã sao chép đủ hai ý tưởng Q5 và phần Q6 nếu đã làm.');}catch{$('idea-copy-output').value=text();$('idea-manual-copy').hidden=false;$('idea-copy-output').focus();$('idea-copy-output').select();message('idea-copy-status','Em sao chép nội dung đã chọn bên dưới nhé.',false);}};
  $('lesson3-reset').onclick=()=>{stage=0;problem=null;data=null;support=null;ideas=[];expanded=null;document.querySelectorAll('textarea').forEach(t=>t.value='');$('q5-write').hidden=true;try{localStorage.removeItem(storageKey);}catch{}render(true);};
  render();
})();
