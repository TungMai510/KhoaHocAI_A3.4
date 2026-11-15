'use strict';
(() => {
  const $=id=>document.getElementById(id);
  // The image IDs and order stay fixed for the baseline and every retest.
  const examples=[
    {id:'case1',src:'assets/test-bottle.svg',alt:'Đồ vật trong suốt có thân dài, cổ thon và nắp vặn.',actual:'Chai',before:'Chai',why:'Ảnh có cổ thon và nắp vặn: đây là chai. Gợi ý “Chai” khớp với ảnh.'},
    {id:'case2',src:'assets/test-can-clear.svg',alt:'Đồ vật xanh thân hình trụ, nắp phẳng có chi tiết kim loại.',actual:'Lon',before:'Lon',why:'Thân hình trụ và khoen kéo trên nắp cho thấy đây là lon. Gợi ý “Lon” khớp với ảnh.'},
    {id:'case3',src:'assets/test-can-obscured.svg',alt:'Đồ vật thân hình trụ ngắn, mép nắp phẳng; phía trên bị nhoè một phần.',actual:'Lon',before:'Chai',why:'Đây là lon: thân hình trụ ngắn, mép nắp phẳng và không có cổ chai. Phần nắp bị nhoè khiến AI mô phỏng nhầm.',reasons:['Thân ngắn, mép nắp phẳng, không có cổ chai.','Màu xanh luôn có nghĩa là chai.','Vì em thích chọn tên “lon”.']},
    {id:'case4',src:'assets/test-bottle-side.svg',alt:'Đồ vật đặt nghiêng, nhìn thấy cổ hẹp và nắp có rãnh vặn.',actual:'Chai',before:'Lon',why:'Đây là chai: dù đặt nghiêng, em vẫn thấy cổ hẹp và nắp vặn. Góc chụp khác làm AI mô phỏng nhầm.',reasons:['Có cổ hẹp và nắp vặn dù đồ vật đặt nghiêng.','Đồ vật nằm ngang nên chắc chắn là lon.','Chỉ cần nhìn màu của nền ảnh.']}
  ];
  const cases=[examples[0],examples[1],{...examples[0],src:'assets/test-bottle-t3.svg'},{...examples[1],src:'assets/can.svg'},examples[2],examples[3]].map((c,i)=>({...c,id:'T'+(i+1)}));
  const improvements={
    photos:{label:'Bổ sung ảnh chai/lon rõ, từ nhiều góc, có tên đúng.',feedback:'Ảnh rõ, nhiều góc và tên đúng giúp AI học đặc điểm cổ chai, nắp vặn, thân lon. Ta vẫn kiểm tra lại bằng đúng 6 ảnh cũ nhé!',after:['Chai','Lon','Chai','Lon','Chai','Chai']},
    schedule:{label:'Bổ sung thời khoá biểu của lớp.',feedback:'Thời khoá biểu không cho thấy hình dạng chai/lon. Em vẫn có thể thử để xem thay đổi này có giúp ích không.',after:['Chai','Lon','Chai','Lon','Chai','Lon']},
    color:{label:'Chỉ bổ sung ảnh đồ vật có màu xanh.',feedback:'Chai và lon đều có thể màu xanh. Chỉ thêm một màu chưa giúp AI thấy đủ hình dạng và góc nhìn. Em hãy thử kiểm tra lại.',after:['Chai','Lon','Chai','Lon','Chai','Lon']}
  };
  let trial=0,retrial=0,judgmentOK=false,reasonOK=false,improvement=null,retestRun=false,report='';
  const baselineCount=cases.filter(c=>c.before===c.actual).length;
  const stageNames=['start','test','improve','retest','report','preview'];
  const tasks={start:'Giúp Sóc kiểm tra trợ lý phân loại chai và lon nhé!',test:'Nhìn ảnh, rồi kiểm tra gợi ý của AI.',improve:'Chọn một thay đổi và đọc xem vì sao.',retest:'Bấm thử lại từng ảnh để xem gợi ý sau khi thay đổi.',report:'Ghi một lỗi, một thay đổi và kết quả em đã thấy.',preview:'Đọc lại báo cáo, sửa hoặc sao chép khi đã sẵn sàng.'};
  function show(stage){
    stageNames.forEach(name=>$('l4-'+name+'-stage').hidden=name!==stage);
    $('l4-task').textContent=tasks[stage];
    const current={start:0,test:0,improve:1,retest:2,report:3,preview:3}[stage];
    document.querySelectorAll('#l4-stepper li').forEach((node,i)=>{if(i===current)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');});
    const target=$('l4-'+stage+'-stage');target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'nearest'});
  }
  function tell(id,text,correct=true){const el=$(id);el.textContent=text;el.className='feedback'+(correct?'':' wrong');el.hidden=false;}
  function press(group,b){document.querySelectorAll(group).forEach(el=>el.setAttribute('aria-pressed',String(el===b)));}
  function setImage(id,c){const image=$(id);image.src=c.src;image.alt=c.alt;image.dataset.imageId=c.id;}
  function prepareBaseline(){
    judgmentOK=false;reasonOK=false;const c=cases[trial];
    $('l4-trial-count').textContent=`Q7a–b · Ảnh ${trial+1} / ${cases.length}`;setImage('l4-image',c);$('l4-image-caption').textContent=`${c.id} · Nhìn chi tiết trước khi chọn`;
    $('l4-ai-guess').textContent=`“${c.before}”`;$('l4-judgment-feedback').hidden=true;$('l4-reason-feedback').hidden=true;$('l4-reason-stage').hidden=true;$('l4-next-baseline').disabled=true;
    $('l4-next-baseline').textContent=trial===cases.length-1?'Chọn cách cải tiến →':'Ảnh tiếp theo →';press('[data-judge]',null);$('l4-reasons').replaceChildren();
    (c.reasons||[]).forEach((text,i)=>{const button=document.createElement('button');button.className='choice';button.dataset.reason=String(i);button.setAttribute('aria-pressed','false');button.textContent=text;button.onclick=()=>{press('[data-reason]',button);reasonOK=i===0;tell('l4-reason-feedback',reasonOK?'Đúng! Em dùng chi tiết nhìn thấy trong ảnh để giải thích lỗi.':'Chi tiết này chưa giúp phân biệt. Em nhìn lại cổ, nắp và dáng thân nhé.',reasonOK);$('l4-next-baseline').disabled=!(judgmentOK&&reasonOK);};$('l4-reasons').append(button);});
  }
  document.querySelectorAll('[data-judge]').forEach(button=>button.onclick=()=>{
    const c=cases[trial],correctGuess=c.before===c.actual,chosenCorrect=button.dataset.judge==='correct';
    press('[data-judge]',button);judgmentOK=chosenCorrect===correctGuess;reasonOK=correctGuess;
    tell('l4-judgment-feedback',(judgmentOK?'Em kiểm tra đúng! ':'Em xem lại nhé. ')+c.why,judgmentOK);
    $('l4-reason-stage').hidden=correctGuess||!judgmentOK;$('l4-next-baseline').disabled=!(judgmentOK&&reasonOK);
  });
  $('l4-start').onclick=()=>{trial=0;prepareBaseline();show('test');};
  $('l4-next-baseline').onclick=()=>{
    if(!judgmentOK||!reasonOK)return;
    if(++trial<cases.length){prepareBaseline();show('test');}
    else{$('l4-before-count').textContent=`${baselineCount} / ${cases.length}`;show('improve');}
  };
  document.querySelectorAll('[data-improvement]').forEach(button=>button.onclick=()=>{improvement=button.dataset.improvement;press('[data-improvement]',button);tell('l4-improve-feedback',improvements[improvement].feedback,improvement==='photos');$('l4-start-retest').disabled=false;});
  function prepareRetest(){
    const c=cases[retrial];retestRun=false;setImage('l4-retest-image',c);$('l4-retest-count').textContent=`Q7d · Thử lại ảnh ${retrial+1} / ${cases.length}`;
    $('l4-chosen-change').textContent='Thay đổi em thử: '+improvements[improvement].label;$('l4-before-guess').textContent=`AI gợi ý “${c.before}”`;
    $('l4-retest-feedback').hidden=true;$('l4-run-retest').hidden=false;$('l4-next-retest').hidden=true;$('l4-next-retest').textContent=retrial===cases.length-1?'So sánh kết quả →':'Thử ảnh tiếp theo →';
  }
  $('l4-start-retest').onclick=()=>{if(!improvement)return;retrial=0;prepareRetest();show('retest');};
  $('l4-run-retest').onclick=()=>{
    if(!improvement||retestRun)return;retestRun=true;const c=cases[retrial],after=improvements[improvement].after[retrial],correct=after===c.actual;
    let explanation=correct?'Gợi ý khớp với chi tiết trong cùng ảnh kiểm tra.':improvement==='photos'?'Phần trên ảnh này vẫn bị nhoè. Thêm ảnh học chưa bảo đảm mọi gợi ý đều đúng; cần chụp ảnh kiểm tra rõ hơn hoặc nhìn vật thật.':'Thay đổi này chưa bổ sung đủ thông tin về hình dạng và góc nhìn, nên gợi ý sai vẫn còn.';
    const output=$('l4-retest-feedback');output.replaceChildren();output.className='feedback'+(correct?'':' wrong');output.hidden=false;
    const guess=document.createElement('strong');guess.id='l4-retest-ai-guess';guess.textContent=`AI mô phỏng gợi ý “${after}”`;
    const result=document.createElement('span');result.id='l4-retest-result';result.textContent=correct?'Đúng':'Sai';
    output.append(guess,document.createTextNode(' — '),result,document.createTextNode('. '+explanation));$('l4-run-retest').hidden=true;$('l4-next-retest').hidden=false;
  };
  $('l4-next-retest').onclick=()=>{if(!retestRun)return;if(++retrial<cases.length){prepareRetest();show('retest');}else{prepareReport();show('report');}};
  function prepareReport(){
    const after=improvements[improvement].after,afterCount=cases.filter((c,i)=>after[i]===c.actual).length;
    $('l4-final-before').textContent=`${baselineCount} / ${cases.length} ảnh đúng`;$('l4-after-count').textContent=`${afterCount} / ${cases.length} ảnh đúng`;
    $('l4-result-explanation').textContent=afterCount>baselineCount?'Lần thử này tốt hơn, nhưng vẫn có ảnh AI đoán nhầm. Cải tiến cần được kiểm tra lại; kết quả mô phỏng không bảo đảm AI thật sẽ đạt giống vậy.':'Lần thử này chưa tăng số ảnh đúng. Em có thể làm lại và thử một thay đổi phù hợp hơn với dữ liệu hình ảnh.';
    const table=document.createElement('table');table.className='result-table';const caption=document.createElement('caption');caption.textContent='Cùng 6 ảnh trước và sau thay đổi';table.append(caption);
    const head=document.createElement('tr');['Ảnh','Vật trong ảnh','Trước','Sau'].forEach(text=>{const th=document.createElement('th');th.scope='col';th.textContent=text;head.append(th);});const thead=document.createElement('thead');thead.append(head);table.append(thead);const body=document.createElement('tbody');
    cases.forEach((c,i)=>{const row=document.createElement('tr');[c.id,c.actual,`${c.before} ${c.before===c.actual?'✓':'✗'}`,`${after[i]} ${after[i]===c.actual?'✓':'✗'}`].forEach(text=>{const cell=document.createElement('td');cell.textContent=text;row.append(cell);});body.append(row);});table.append(body);$('l4-results-table').replaceChildren(table);
  }
  $('l4-preview-report').onclick=()=>{
    const error=$('l4-error').value.trim(),change=$('l4-change').value.trim(),result=$('l4-result').value.trim(),reflection=$('l4-reflection').value.trim();
    if(!error||!change||!result||!reflection){tell('l4-report-feedback','Em điền đủ câu giải thích dùng T5 và ba ý: lỗi đã thấy, thay đổi đã thử và kết quả sau khi thử lại nhé.',false);(!error?$('l4-error'):!change?$('l4-change'):!result?$('l4-result'):$('l4-reflection')).focus();return;}
    report=`BÁO CÁO KIỂM TRA VÀ CẢI TIẾN AI — BÀI 4\n1. Lỗi em đã thấy: ${error}\n2. Thay đổi em đã thử: ${change}\n3. Kết quả sau khi thử lại: ${result}\n4. Vì sao con người vẫn cần kiểm tra và cải tiến AI (dẫn chứng T5): ${reflection}\n\nThử nghiệm mô phỏng; gợi ý và kết quả được viết sẵn.`;
    $('l4-report-text').textContent=report;$('l4-copy-status').hidden=true;$('l4-manual-copy').hidden=true;show('preview');
  };
  $('l4-edit-report').onclick=()=>show('report');
  $('l4-copy-report').onclick=async()=>{if(!report)return;$('l4-manual-copy').hidden=true;try{await navigator.clipboard.writeText(report);tell('l4-copy-status','Đã sao chép báo cáo! Em dùng theo hướng dẫn của giáo viên; trang này chưa gửi bài đi.');}catch{tell('l4-copy-status','Chưa sao chép tự động được. Em sao chép nội dung đã chọn bên dưới nhé.',false);$('l4-manual-copy').value=report;$('l4-manual-copy').hidden=false;$('l4-manual-copy').focus();$('l4-manual-copy').select();}};
  $('l4-reset').onclick=()=>{
    trial=0;retrial=0;judgmentOK=false;reasonOK=false;improvement=null;retestRun=false;report='';
    press('[data-judge],[data-reason],[data-improvement]',null);
    ['l4-judgment-feedback','l4-reason-feedback','l4-improve-feedback','l4-retest-feedback','l4-report-feedback','l4-copy-status','l4-manual-copy'].forEach(id=>$(id).hidden=true);
    $('l4-reason-stage').hidden=true;$('l4-start-retest').disabled=true;$('l4-next-baseline').disabled=true;$('l4-report-text').textContent='';$('l4-manual-copy').value='';['l4-error','l4-change','l4-result','l4-reflection'].forEach(id=>$(id).value='');show('start');$('l4-start').focus({preventScroll:true});
  };
  // A Bài 3 card is optional context; it never changes this fixed bottle/can experiment.
  if (!window.AzotaEmbed?.active) try{
    const idea=JSON.parse(localStorage.getItem('ai4.idea.v1')||'null');
    if(idea&&idea.version===1&&['problem','data','support'].every(key=>typeof idea[key]==='string'&&idea[key].trim()&&idea[key].length<=1500)){
      const list=document.createElement('dl');[['Vấn đề',idea.problem],['Dữ liệu',idea.data],['AI hỗ trợ',idea.support]].forEach(([label,value])=>{const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=value;list.append(dt,dd);});$('l4-prior-content').append(list);$('l4-prior-idea').hidden=false;
    }
  }catch{$('l4-storage-note').textContent='Chưa đọc được phiếu Bài 3 trong trình duyệt này. Em vẫn bắt đầu ngay bằng trợ lý mẫu.';}
})();
