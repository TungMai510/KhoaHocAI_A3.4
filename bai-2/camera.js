// Camera streams are local, video-only, and released on every exit path.
const cameraDialog = document.querySelector('#camera-dialog');
const cameraVideo = document.querySelector('#camera-video');
const cameraMessage = document.querySelector('#camera-message');
const shutter = document.querySelector('#camera-shutter');
const burstButton = document.querySelector('#camera-burst');
const cameraFlash = document.querySelector('#camera-flash');
let cameraStream = null;
let cameraTarget = null;
let cameraGeneration = 0;
let cameraReturnFocus = null;
let cameraCapturing = false;
let burstTimer = null;

function stopBurst() {
  if (burstTimer) {
    clearInterval(burstTimer);
    burstTimer = null;
  }
  burstButton?.classList.remove('is-bursting');
}

function releaseCamera() {
  stopBurst();
  cameraGeneration++;
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  if (cameraVideo) cameraVideo.srcObject = null;
  if (shutter) shutter.disabled = true;
  if (burstButton) burstButton.disabled = true;
}

function closeCamera() {
  releaseCamera();
  if (cameraDialog?.open) cameraDialog.close();
  cameraReturnFocus?.focus?.();
}

function cameraError(error) {
  const n = error?.name;
  if (n === 'NotAllowedError') return 'Chưa có quyền camera. Hãy cho phép camera hoặc chọn ảnh từ máy.';
  if (n === 'NotFoundError') return 'Thiết bị chưa có camera. Em chọn ảnh từ máy nhé.';
  if (n === 'NotReadableError') return 'Camera đang bận. Đóng ứng dụng khác rồi thử lại.';
  return 'Chưa mở được camera. Thử lại hoặc chọn ảnh từ máy.';
}

async function startCamera() {
  releaseCamera();
  const generation = cameraGeneration;
  cameraMessage.textContent = 'Đang mở camera…';
  document.querySelector('#camera-retry').hidden = true;
  shutter.disabled = true;
  if (burstButton) burstButton.disabled = true;

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraMessage.textContent = 'Trình duyệt cần mở qua HTTPS hoặc tab riêng để dùng camera.';
    document.querySelector('#camera-retry').hidden = false;
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'user' }, width: { ideal: 960 }, height: { ideal: 960 } }
    });
    if (generation !== cameraGeneration || !cameraDialog.open) {
      stream.getTracks().forEach(t => t.stop());
      return;
    }
    cameraStream = stream;
    cameraVideo.srcObject = stream;
    cameraVideo.classList.toggle('mirror', stream.getVideoTracks()[0]?.getSettings().facingMode === 'user');
    await cameraVideo.play();
    if (generation !== cameraGeneration || !cameraDialog.open) return;
    shutter.disabled = false;
    if (burstButton) burstButton.disabled = cameraTarget === 'test';
    cameraMessage.textContent = 'Đưa đồ vật vào giữa khung rồi bấm chụp.';
    stream.getVideoTracks().forEach(t =>
      t.addEventListener('ended', () => {
        if (cameraStream === stream) {
          releaseCamera();
          cameraMessage.textContent = 'Camera đã dừng. Bấm Mở lại camera để tiếp tục.';
          document.querySelector('#camera-retry').hidden = false;
        }
      })
    );
  } catch (e) {
    if (generation !== cameraGeneration) return;
    releaseCamera();
    cameraMessage.textContent = cameraError(e);
    document.querySelector('#camera-retry').hidden = false;
  }
}

async function openCamera(target) {
  if (state.busy) return;
  if (target === 'test' && !state.trained.length) {
    go(2);
    return;
  }
  cameraTarget = target;
  cameraReturnFocus = document.activeElement;
  document.querySelector('#camera-title').textContent =
    target === 'test' ? 'Cho Mít xem đồ vật' : 'Chụp ảnh · ' + state.names[target];
  shutter.textContent = target === 'test' ? 'Chụp để Mít đoán' : 'Chụp 1 ảnh';
  if (burstButton) burstButton.hidden = target === 'test';
  document.querySelector('#camera-result-note').textContent = '';
  cameraDialog.showModal();
  await startCamera();
}

async function captureFrame() {
  if (cameraCapturing || !cameraVideo.videoWidth) return false;
  cameraCapturing = true;
  const generation = cameraGeneration;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 480;
    const w = cameraVideo.videoWidth;
    const h = cameraVideo.videoHeight;
    const size = Math.min(w, h);
    c.getContext('2d').drawImage(cameraVideo, (w - size) / 2, (h - size) / 2, size, size, 0, 0, 480, 480);

    if (cameraFlash) {
      cameraFlash.classList.remove('active');
      void cameraFlash.offsetWidth;
      cameraFlash.classList.add('active');
    }
    window.MitSound?.play('shutter');

    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.9));
    if (!blob) throw Error('Không tạo được ảnh chụp');
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    await img.decode();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    if (generation !== cameraGeneration) {
      URL.revokeObjectURL(url);
      return false;
    }

    const item = { img, url, name: 'camera-' + Date.now() + '.jpg', size: blob.size, lastModified: Date.now(), hash };
    if (cameraTarget === 'test') {
      closeCamera();
      await predict(item, false);
      return false;
    }

    const i = cameraTarget;
    if (state.sets[i].length >= 20) {
      URL.revokeObjectURL(url);
      stopBurst();
      cameraMessage.textContent = 'Khay đã đủ 20 ảnh!';
      return false;
    }
    state.sets[i].push(item);
    invalidate();
    render();
    emitTrays(i);
    window.dispatchEvent(new CustomEvent('mitPhotoFly', { detail: { cls: i, url } }));
    document.querySelector('#camera-result-note').textContent = `Đã thêm: ${state.sets[i].length} ảnh`;
    cameraMessage.textContent =
      state.sets[i].length >= 20
        ? 'Đã đủ 20 ảnh!'
        : 'Xoay góc đồ vật rồi chụp tiếp nhé.';
    return state.sets[i].length < 20;
  } catch {
    cameraMessage.textContent = 'Giữ yên đồ vật rồi thử lại nhé.';
    return false;
  } finally {
    cameraCapturing = false;
  }
}

shutter.onclick = async () => {
  if (shutter.disabled) return;
  shutter.disabled = true;
  await captureFrame();
  if (cameraStream && cameraDialog.open) shutter.disabled = false;
};

if (burstButton) {
  burstButton.addEventListener('pointerdown', e => {
    if (burstButton.disabled || cameraTarget === 'test') return;
    e.preventDefault();
    stopBurst();
    burstButton.classList.add('is-bursting');
    captureFrame();
    burstTimer = setInterval(async () => {
      const ok = await captureFrame();
      if (!ok || !cameraDialog.open) stopBurst();
    }, 450);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt => burstButton.addEventListener(evt, stopBurst));
}

document.querySelector('#camera-close').onclick = closeCamera;
document.querySelector('#camera-done').onclick = closeCamera;
document.querySelector('#camera-retry').onclick = startCamera;
cameraDialog.addEventListener('cancel', e => {
  e.preventDefault();
  closeCamera();
});
cameraDialog.addEventListener('close', releaseCamera);
window.addEventListener('pagehide', releaseCamera);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && cameraDialog.open) closeCamera();
});
