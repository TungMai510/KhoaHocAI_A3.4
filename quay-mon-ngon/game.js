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
let done=0;
if(connected) {
  const saved=Number(api.LMSGetValue('cmi.core.lesson_location'));
  if(Number.isInteger(saved) && saved>=0 && saved<=3) done=saved;
}
function record(){
  if(!connected) return;
  const values={'cmi.core.score.min':'0','cmi.core.score.max':'100','cmi.core.score.raw':String(Math.round(done*100/3)),'cmi.core.lesson_location':String(done),'cmi.core.lesson_status':done===3?'completed':'incomplete'};
  const ok=Object.entries(values).every(([key,value])=>api.LMSSetValue(key,value)==='true') && api.LMSCommit('')==='true';
  $('sync').textContent=ok?'':'Moodle chưa xác nhận lưu.';
}
addEventListener('pagehide',()=>{if(connected)api.LMSFinish('');});
function show(){
  $('intro').hidden=true; $('game').hidden=false; $('choices').replaceChildren();
  $('next').hidden=true; $('feedback').textContent=''; $('hint').textContent='';
  $('translate').hidden=done===3;
  $('onward').hidden=done!==3;
  if(done===3){
    $('order').textContent='Sóc đã giao đủ ba món!';
    $('onward').focus();
    return;
  }
  const [,friend,word]=orders[done];
  $('order').textContent=friend+' nói “I like '+word+'.”';
}
$('start').onclick=show;
$('next').onclick=show;
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
