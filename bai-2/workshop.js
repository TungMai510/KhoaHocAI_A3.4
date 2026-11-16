'use strict';
const $=s=>document.querySelector(s);
const state={step:0,names:['',''],sets:[[],[]],trained:[],net:null,busy:false,result:null,sample:false,testIndex:0,feedback:null,sampleManifest:null};
const titles=['Mình cùng dạy Mít nhé!','Thêm ảnh cho Mít','Mít sẵn sàng rồi!','Mít đoán, em kiểm tra!'];
const hints=['Đặt tên cho hai khay ảnh.','Thêm ít nhất 3 ảnh khác nhau vào mỗi khay.','Mít sẽ học từ các ảnh bạn đã xếp vào hai nhóm.','Dùng một ảnh chưa đưa vào khay. Bạn kiểm tra Mít nhé!'];
const captions=['Bắt đầu từ một ý tưởng','Ảnh mẫu là điều Mít học','Bạn là người dạy máy','Máy cũng có thể nhầm'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function say(s){$('#speech').textContent=s}
function pose(p){window.dispatchEvent(new CustomEvent('mitPose',{detail:p}))}
function setStatus(s){$('#step-status').textContent=s}
function validNames(){return state.names.every(x=>x.trim())&&state.names[0].trim().toLocaleLowerCase()!==state.names[1].trim().toLocaleLowerCase()}
function invalidate(){state.trained=[];state.feedback=null;if(state.result?.url?.startsWith('blob:'))URL.revokeObjectURL(state.result.url);state.result=null}
function render(){
 document.body.dataset.step=state.step;
 $('#task-title').textContent=titles[state.step];$('#task-hint').textContent=hints[state.step];$('#step-caption').textContent=captions[state.step];
 document.querySelectorAll('[data-step]').forEach(b=>{b.setAttribute('aria-current',+b.dataset.step===state.step?'step':'false');b.disabled=state.busy});
 for(let i=0;i<2;i++){
 const tray=$('#tray-'+i),items=state.sets[i];
 tray.innerHTML=`<div class="tray-heading"><span>KHAY ${i===0?'A':'B'}</span><small class="tray-count">${items.length?items.length+' ảnh mẫu':'Chưa có ảnh'}</small></div>`+(state.step===0?`<label class="name-label" for="name-${i}">Tên nhóm ảnh</label><input id="name-${i}" type="text" maxlength="30" autocomplete="off" value="${esc(state.names[i])}" placeholder="${i===0?'Ví dụ: Lá cây':'Ví dụ: Bông hoa'}">`:`<h2 class="tray-name">${esc(state.names[i])}</h2>`)+(items.length?`<div class="photos">${items.map((x,k)=>`<div class="photo"><img src="${x.url}" width="80" height="80" alt="Ảnh mẫu ${k+1} của ${esc(state.names[i])}">${state.step===1?`<button data-remove="${i},${k}" aria-label="Bỏ ảnh ${k+1} khỏi ${esc(state.names[i])}">×</button>`:''}</div>`).join('')}</div>`:`<div class="empty-photos" aria-hidden="true"><div class="paper-photo"></div><div class="paper-photo second"></div></div>`)+(state.step===1?`<label class="tray-add">＋ Chọn ảnh<input type="file" accept="image/*" multiple data-upload="${i}" aria-label="Thêm ảnh vào khay ${i===0?'A':'B'}"></label><button class="camera-button" data-camera="${i}">Chụp ảnh</button>`:`<p class="tray-help">${state.step===0?'Mỗi khay là một nhóm ảnh.':state.step===2?items.length+' ví dụ để Mít học.':'Đây là ảnh Mít đã học.'}</p>`);
 }
 document.querySelectorAll('[id^="name-"]').forEach((e,i)=>e.oninput=()=>{state.names[i]=e.value;invalidate();setStatus('Hai nhóm cần có tên khác nhau nhé.')});
 document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>openCamera(+b.dataset.camera));
 document.querySelectorAll('[data-upload]').forEach(e=>e.onchange=()=>addFiles(+e.dataset.upload,[...e.files]));
 document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(state.busy)return;const [i,k]=b.dataset.remove.split(',').map(Number);const [x]=state.sets[i].splice(k,1);if(x.url.startsWith('blob:'))URL.revokeObjectURL(x.url);invalidate();render()});
 $('#sample').hidden=state.step>1||state.sample;$('#sample').disabled=state.busy;
 $('#primary').disabled=state.busy;$('#primary').textContent=['Đặt tên xong →','Đã thêm ảnh →',state.trained.length?'Thử ảnh mới →':'Dạy Mít ngay →','Ghi vào sổ khám phá →'][state.step];
 const counts=state.sets.map(x=>x.length);setStatus(state.step===0?'Hai nhóm. Một khám phá mới.':state.step===1?`${counts[0]} ảnh khay A · ${counts[1]} ảnh khay B. Mỗi khay cần ít nhất 3 ảnh.`:state.step===2?(state.trained.length?'Mít đã học xong. Thử một ảnh mới nhé!':`${counts[0]+counts[1]} ảnh mẫu đang chờ Mít học.`):'Bạn kiểm tra kết quả. Mít không phải lúc nào cũng đúng.');
 renderTest();
}
function renderTest(){
 const panel=$('#test-station');panel.hidden=state.step!==3;if(state.step!==3)return;
 const r=state.result;
 panel.innerHTML=`<h2>Ảnh mới cho Mít</h2>${r?`<img class="test-image" src="${r.url}" width="78" height="78" alt="Ảnh mới đang thử"><p class="prediction">Mít đoán: ${esc(state.names[r.cls])}</p><p class="test-feedback">${r.agreement<r.neighbours?"Các ảnh giống nhất còn khác nhóm. Mít chưa chắc nhé!":"Đây là dự đoán, chưa chắc đúng."}</p><p class="test-feedback">Bạn thấy Mít đoán đúng chưa?</p><div class="feedback-buttons"><button data-feedback="yes" aria-pressed="${state.feedback==='yes'}">Đúng rồi!</button><button data-feedback="no" aria-pressed="${state.feedback==='no'}">Chưa đúng</button></div>`:'<p class="test-feedback">Đặt một ảnh mới vào đây để Mít thử nhận biết.</p>'}<label class="tray-add">＋ Chọn ảnh mới<input type="file" accept="image/*" id="test-file" aria-label="Chọn ảnh mới để thử Mít" ${state.busy?'disabled':''}></label><button id="test-camera" class="camera-button">Chụp để thử</button>${state.sample?'<button id="sample-test" class="text-button">Thử ảnh hoa chưa học</button>':''}<p id="test-status" class="test-feedback" role="status"></p>${state.feedback==='no'?'<button id="improve" class="text-button">Thêm ảnh để dạy Mít lại →</button>':''}`;
 $('#test-camera').disabled=state.busy;$('#test-camera').onclick=()=>openCamera('test');
 $('#test-file').onchange=e=>{if(e.target.files[0])testFile(e.target.files[0])};
 if($('#sample-test')){$('#sample-test').disabled=state.busy;$('#sample-test').onclick=async()=>{if(state.busy)return;const n=state.testIndex++;const cls=n%2;const list=state.sampleManifest.test.filter(x=>x.cls===cls);try{await predict(await loadSample(list[Math.floor(n/2)%list.length]));}catch(e){$('#test-status').textContent=e.message;}}};
 panel.querySelectorAll('[data-feedback]').forEach(b=>b.onclick=()=>{state.feedback=b.dataset.feedback;renderTest();say(state.feedback==='yes'?'Hoan hô! Cảm ơn bạn đã dạy mình!':'Ôi, mình nhầm rồi. Mình cùng thử lại nhé!');pose(state.feedback==='yes'?'happy':'sad');window.dispatchEvent(new CustomEvent('mitFeedback',{detail:state.feedback}))});
 if($('#improve'))$('#improve').onclick=()=>go(1);
}
function go(step){if(state.busy)return;if(step>0&&!validNames()){setStatus('Hãy đặt hai tên khác nhau cho khay A và khay B.');$('#name-0')?.focus();return}if(step>=2&&state.sets.some(x=>x.length<3)){state.step=1;render();setStatus('Thêm ít nhất 3 ảnh vào mỗi khay trước nhé.');return}if(step===3&&!state.trained.length){state.step=2;render();setStatus('Bấm “Dạy Mít ngay” trước khi thử ảnh nhé.');return}state.step=step;render();say(['Chào bạn! Hôm nay mình học gì nhỉ?','Cho mình xem ảnh ở hai khay nhé!','Mình đã có ảnh mẫu. Bạn bấm nút để mình học nhé!','Mình thử đoán. Còn bạn là người kiểm tra!'][step])}
document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>go(+b.dataset.step));
$('#primary').onclick=()=>{if(state.step<2)go(state.step+1);else if(state.step===2){if(state.trained.length)go(3);else train()}else openNotebook()};
async function imageFile(file){if(!file.type.startsWith('image/'))throw Error('Chọn tệp ảnh JPG, PNG hoặc WebP nhé.');if(file.size>15*1024*1024)throw Error('Ảnh quá lớn. Chọn ảnh dưới 15 MB nhé.');let url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(b=>b.toString(16).padStart(2,'0')).join('');return {img,url,name:file.name,size:file.size,lastModified:file.lastModified,hash}}catch(e){URL.revokeObjectURL(url);throw Error('Không mở được ảnh này. Thử ảnh JPG hoặc PNG nhé.')}}
async function addFiles(i,files){if(state.busy||!files.length)return;state.busy=true;render();setStatus('Đang xếp ảnh vào khay…');let errors=0;try{for(const f of files.slice(0,20-state.sets[i].length)){try{const item=await imageFile(f);if(state.sets.flat().some(x=>x.hash&&x.hash===item.hash)){URL.revokeObjectURL(item.url);errors++;continue}state.sets[i].push(item)}catch{errors++}}invalidate()}finally{state.busy=false;render();if(errors)setStatus(`Có ${errors} ảnh bị trùng hoặc không mở được. Chọn ảnh khác, dưới 15 MB nhé.`);else if(state.sets[i].length===20)setStatus('Khay đã có 20 ảnh. Có thể bỏ ảnh cũ để thêm ảnh khác.')}}
async function loadSample(entry){
 const response=await fetch(entry.src);if(!response.ok)throw Error('Chưa tải được ảnh mẫu. Kiểm tra mạng rồi thử lại.');
 const blob=await response.blob();return imageFile(new File([blob],entry.src.split('/').pop(),{type:'image/jpeg',lastModified:0}));
}
$('#sample').onclick=async()=>{
 if(state.busy)return;
 if(state.sets.flat().length&&!confirm('Thay ảnh hiện tại bằng bộ Hoa cúc và Hoa hướng dương?'))return;
 state.busy=true;render();setStatus('Đang mở bộ ảnh hoa thật…');let loaded=[];
 try{
  const response=await fetch('samples/manifest.json');if(!response.ok)throw Error('Chưa mở được bộ ảnh mẫu.');
  const manifest=await response.json();const data=[[],[]];
  for(const entry of manifest.train){const item=await loadSample(entry);loaded.push(item);data[entry.cls].push(item);}
  state.sets.flat().forEach(x=>{if(x.url.startsWith('blob:'))URL.revokeObjectURL(x.url)});
  invalidate();state.names=manifest.names;state.sets=data;state.sample=true;state.sampleManifest=manifest;state.testIndex=0;state.step=0;
  say('Hoa cúc và hoa hướng dương! Em xem hai tên nhóm, rồi bấm Đặt tên xong nhé.');
 }catch(e){loaded.forEach(x=>URL.revokeObjectURL(x.url));state.error=e.message;}
 finally{state.busy=false;render();if(state.error){setStatus(state.error);state.error=null;}}
};
function loadNetwork(){return new Promise((resolve,reject)=>{let expired=false;const timer=setTimeout(()=>{expired=true;reject(Error('Tải AI hơi lâu. Kiểm tra mạng rồi bấm Dạy Mít để thử lại nhé.'))},45000);mobilenet.load({version:2,alpha:1.0}).then(net=>{clearTimeout(timer);if(expired){net.model?.dispose();return}resolve(net)},error=>{clearTimeout(timer);reject(error)})})}
async function train(){if(state.busy)return;if(state.sets.some(x=>x.length<3)){go(1);return}state.busy=true;render();setStatus('Mít đang mở bộ máy học ảnh…');pose('think');try{if(!window.tf||!window.mobilenet)throw Error('Chưa tải được công cụ AI. Kiểm tra mạng rồi thử lại nhé.');await tf.ready();if(!state.net)state.net=await loadNetwork();let features=[];for(let i=0;i<2;i++)for(const item of state.sets[i]){setStatus(`Mít đang học ảnh ${features.length+1}/${state.sets.flat().length}…`);await tf.nextFrame();const vec=tf.tidy(()=>Array.from(state.net.infer(item.img,true).dataSync()));features.push({cls:i,vec})}state.trained=features;state.step=3;state.result=null;say('Mình học xong rồi! Bạn thử cho mình một ảnh mới nhé.');pose('happy')}catch(e){state.trained=[];state.error=e.message;say('Mình chưa học được. Bạn kiểm tra thông báo phía dưới nhé.')}finally{state.busy=false;render();if(state.error){setStatus(state.error);state.error=null}}}
async function testFile(file){if(state.busy)return;let item;try{item=await imageFile(file);if(state.sets.flat().some(x=>x.hash===item.hash)){URL.revokeObjectURL(item.url);$('#test-status').textContent='Ảnh này đã dùng để dạy, kể cả khi đổi tên tệp. Chọn một ảnh mới nhé.';return}await predict(item)}catch(e){$('#test-status').textContent=e.message}}
async function predict(item){if(state.busy)return;if(!state.trained.length){go(2);return}state.busy=true;state.feedback=null;render();$('#test-status').textContent='Mít đang quan sát ảnh…';pose('think');try{await tf.nextFrame();const vec=tf.tidy(()=>Array.from(state.net.infer(item.img,true).dataSync()));const prediction=MitClassifier.classify(state.trained,vec);if(state.result?.url?.startsWith('blob:'))URL.revokeObjectURL(state.result.url);state.result={url:item.url,...prediction};say(`Mình đoán là ${state.names[state.result.cls]}. Bạn kiểm tra giúp mình nhé!`)}catch(e){state.error='Chưa đọc được ảnh. Thử ảnh khác nhé.';if(item.url.startsWith('blob:'))URL.revokeObjectURL(item.url)}finally{state.busy=false;render();if(state.error){$('#test-status').textContent=state.error;state.error=null}}}
function openNotebook(){$('#notebook').hidden=false;$('#notebook').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('#answers').focus({preventScroll:true})}
$('#open-notebook').onclick=openNotebook;$('#close-notebook').onclick=()=>{$('#notebook').hidden=true;$('#open-notebook').focus()};
$('#copy').onclick=async()=>{const text=$('#answers').value.trim();if(!text){$('#copyStatus').textContent='Em viết điều mình khám phá trước nhé.';return}try{await navigator.clipboard.writeText(text);$('#copyStatus').textContent='Đã sao chép. Dán vào bài nộp của giáo viên nhé.'}catch{$('#copyStatus').textContent='Chọn đoạn chữ trong ô rồi dùng lệnh Sao chép nhé.'}};
$('#reset').onclick=()=>{if(state.busy){setStatus('Chờ Mít xử lý xong rồi bắt đầu bộ mới nhé.');return}if(!confirm('Xóa ảnh mẫu và bắt đầu bộ mới? Câu trả lời trong sổ vẫn được giữ.'))return;state.sets.flat().forEach(x=>{if(x.url.startsWith('blob:'))URL.revokeObjectURL(x.url)});invalidate();state.sets=[[],[]];state.names=['',''];state.step=0;state.sample=false;$('#notebook').hidden=true;document.querySelectorAll('.check input').forEach(x=>x.checked=false);render();say('Một bộ ảnh mới! Lần này bạn muốn dạy mình điều gì?');$('#task').scrollIntoView({block:'start'})};
render();
