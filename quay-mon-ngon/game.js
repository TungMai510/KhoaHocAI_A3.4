const $ = id => document.getElementById(id);
const foods = [['apple','táo'],['banana','chuối'],['milk','sữa']];
const orders = [[1,'Thỏ','bananas'],[2,'Gấu','milk'],[0,'Cú','apples']];
function findAPI(w) {
  for (let depth=0; w && depth<12; depth++) {
    try { if(w.API) return w.API; if(w.parent===w) break; w=w.parent; } catch {break;}
  }
}
const api=findAPI(window)||findAPI(window.opener);
const connected=api && api.LMSInitialize('')==='true';
if (!api && new URLSearchParams(location.search).get('flow') === 'lesson1') {
  $('onward').href = '../hl2_mo_phong.html?flow=lesson1';
  $('onward').target = '_self';
}
let done = 0;
let officialSession = false;
let hasOfficialProgress = false;
if (connected) {
  const saved = Number(api.LMSGetValue('cmi.core.lesson_location'));
  const status = api.LMSGetValue('cmi.core.lesson_status');
  const mode = api.LMSGetValue('cmi.core.lesson_mode');
  if (Number.isInteger(saved) && saved >= 0 && saved <= orders.length) done = saved;
  if (status === 'completed' || status === 'passed') done = orders.length;
  officialSession = mode === 'normal' && done < orders.length;
}
function record(){
  if (!officialSession) return;
  hasOfficialProgress = true;
  const values={'cmi.core.score.min':'0','cmi.core.score.max':'100','cmi.core.score.raw':String(Math.round(done*100/3)),'cmi.core.lesson_location':String(done),'cmi.core.lesson_status':done===3?'completed':'incomplete'};
  const ok=Object.entries(values).every(([key,value])=>api.LMSSetValue(key,value)==='true') && api.LMSCommit('')==='true';
  $('sync').textContent=ok?'':'Moodle chưa xác nhận lưu.';
}
function finishOfficialSession() {
  if (!officialSession) return;
  officialSession = false;
  // Moodle can write the current result on Finish. Close the official
  // session before resetting the local counter for a practice round.
  if (hasOfficialProgress) api.LMSFinish('');
}
addEventListener('pagehide', finishOfficialSession);

const introVideo = document.querySelector('#intro video');
introVideo?.addEventListener('error', () => {
  introVideo.hidden = true;
  introVideo.nextElementSibling.hidden = false;
});
function show(){
  introVideo?.pause();
  $('intro').hidden=true; $('game-heading').hidden=false; $('game').hidden=false; $('choices').replaceChildren();
  $('next').hidden=true; $('feedback').textContent=''; $('hint').textContent='';
  $('translate').hidden=done===3;
  $('result').hidden=done!==orders.length;
  $('served').hidden=done===orders.length;
  $('served').textContent=done+'/'+orders.length+' món';
  if(done===3){
    $('order').textContent='Sóc đã giao đủ ba món!';
    $('score').textContent='Kết quả: '+done+'/'+orders.length+' món.';
    $('onward').focus();
    return;
  }
  const [,friend,word]=orders[done];
  $('order').textContent=friend+' nói “I like '+word+'.”';
}
$('start').onclick=show;
$('next').onclick=show;
$('replay').onclick=()=>{
  finishOfficialSession();
  done = 0;
  show();
  $('order').focus();
};
$('translate').onclick=()=>{
  const [answer]=orders[done];
  $('translate').hidden=true;
  $('hint').textContent='Máy dịch mô phỏng gợi ý “Mình thích '+foods[answer][1]+'”. Em chọn món để kiểm tra nhé.';
  foods.forEach(([file,name],index)=>{
    const b=document.createElement('button');
    b.innerHTML='<img alt="" src="'+file+'.svg">'+name;
    b.onclick=()=>{
      if(index!==answer){$('feedback').textContent='Em đọc lại tên món trong bản dịch rồi thử lại nhé.';return;}
      done++; record(); $('choices').replaceChildren(); $('feedback').textContent='Đúng món rồi! Sóc đã giao '+done+'/3 món.';
      if(done===3) show();
      else $('next').hidden=false;
    };
    $('choices').append(b);
  });
};
