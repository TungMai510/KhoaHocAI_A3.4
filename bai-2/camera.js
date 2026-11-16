// Camera streams are local, video-only, and released on every exit path.
const cameraDialog=document.querySelector('#camera-dialog');
const cameraVideo=document.querySelector('#camera-video');
const cameraMessage=document.querySelector('#camera-message');
const shutter=document.querySelector('#camera-shutter');
let cameraStream=null,cameraTarget=null,cameraGeneration=0,cameraReturnFocus=null,cameraCapturing=false;
function releaseCamera(){cameraGeneration++;if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}cameraVideo.srcObject=null;shutter.disabled=true;}
function closeCamera(){releaseCamera();if(cameraDialog.open)cameraDialog.close();cameraReturnFocus?.focus?.()}
function cameraError(error){const n=error?.name;return n==='NotAllowedError'?'Camera chưa được cho phép. Cho phép camera trong trình duyệt hoặc chọn ảnh từ máy.':n==='NotFoundError'?'Thiết bị chưa có camera. Bạn vẫn có thể chọn ảnh từ máy.':n==='NotReadableError'?'Camera đang bận. Đóng ứng dụng đang dùng camera rồi thử lại nhé.':'Chưa mở được camera. Thử lại hoặc chọn ảnh từ máy nhé.'}
async function startCamera(){
 releaseCamera();const generation=cameraGeneration;cameraMessage.textContent='Đang mở camera… Nếu được hỏi, chọn Cho phép camera.';$('#camera-retry').hidden=true;shutter.disabled=true;
 if(!navigator.mediaDevices?.getUserMedia){cameraMessage.textContent='Trình duyệt chưa mở được camera. Mở bài bằng Chrome hoặc Safari qua đường dẫn HTTPS nhé.';$('#camera-retry').hidden=false;return}
 try{const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'user'},width:{ideal:960},height:{ideal:960}}});
 if(generation!==cameraGeneration||!cameraDialog.open){stream.getTracks().forEach(t=>t.stop());return}
 cameraStream=stream;cameraVideo.srcObject=stream;cameraVideo.classList.toggle('mirror',stream.getVideoTracks()[0]?.getSettings().facingMode==='user');await cameraVideo.play();
 if(generation!==cameraGeneration||!cameraDialog.open)return;
 shutter.disabled=false;cameraMessage.textContent='Đưa đồ vật vào giữa khung, giữ yên rồi bấm chụp.';
 stream.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(cameraStream===stream){releaseCamera();cameraMessage.textContent='Camera đã dừng. Bấm Mở lại camera để tiếp tục.';$('#camera-retry').hidden=false}}));
 }catch(e){if(generation!==cameraGeneration)return;releaseCamera();cameraMessage.textContent=cameraError(e);$('#camera-retry').hidden=false}
}
async function openCamera(target){if(state.busy)return;if(target==='test'&&!state.trained.length){go(2);return}cameraTarget=target;cameraReturnFocus=document.activeElement;$('#camera-title').textContent=target==='test'?'Cho Mít xem đồ vật':'Chụp ảnh cho '+state.names[target];shutter.textContent=target==='test'?'Chụp và nhờ Mít đoán':'Chụp vào khay '+(target===0?'A':'B');$('#camera-result-note').textContent='';cameraDialog.showModal();await startCamera()}
shutter.onclick=async()=>{if(cameraCapturing||shutter.disabled||!cameraVideo.videoWidth)return;cameraCapturing=true;shutter.disabled=true;const generation=cameraGeneration;
 try{const c=document.createElement('canvas');c.width=c.height=480;const w=cameraVideo.videoWidth,h=cameraVideo.videoHeight,size=Math.min(w,h);c.getContext('2d').drawImage(cameraVideo,(w-size)/2,(h-size)/2,size,size,0,0,480,480);const img=new Image();const url=c.toDataURL('image/jpeg',.9);img.src=url;await img.decode();if(generation!==cameraGeneration)return;
 const item={img,url,name:'camera-'+Date.now(),size:0,lastModified:Date.now()};
 if(cameraTarget==='test'){closeCamera();await predict(item)}else{const i=cameraTarget;if(state.sets[i].length>=20){cameraMessage.textContent='Khay đã đủ 20 ảnh. Đóng camera để bỏ bớt ảnh nhé.';return}state.sets[i].push(item);invalidate();render();$('#camera-result-note').textContent=`Đã chụp ${state.sets[i].length} ảnh vào ${state.names[i]}.`;cameraMessage.textContent='Đổi góc hoặc khoảng cách của đồ vật rồi chụp tiếp nhé.';if(state.sets[i].length>=20)cameraMessage.textContent='Đã đủ 20 ảnh. Bạn có thể đóng camera.'}
 }catch{cameraMessage.textContent='Chưa chụp được ảnh. Giữ yên đồ vật rồi thử lại nhé.'}finally{cameraCapturing=false;if(cameraStream&&cameraDialog.open)shutter.disabled=false}
};
$('#camera-close').onclick=closeCamera;$('#camera-done').onclick=closeCamera;$('#camera-retry').onclick=startCamera;
cameraDialog.addEventListener('cancel',e=>{e.preventDefault();closeCamera()});cameraDialog.addEventListener('close',releaseCamera);
window.addEventListener('pagehide',releaseCamera);document.addEventListener('visibilitychange',()=>{if(document.hidden&&cameraDialog.open)closeCamera()});
