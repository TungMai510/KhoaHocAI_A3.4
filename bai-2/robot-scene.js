import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { createPoses } from './robot-poses.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';

const stage = document.querySelector('.robot-stage');
const loaderBadge = document.querySelector('#stage-loader');
const motionStatus = document.querySelector('#motion-status');
const tryButton = document.querySelector('#try-motion');
const runButton = document.querySelector('#run-motion');
const pauseButton = document.querySelector('#pause-motion');

function hide3DControls(message) {
  if (loaderBadge) loaderBadge.hidden = true;
  if (tryButton) tryButton.hidden = true;
  if (runButton) runButton.hidden = true;
  if (pauseButton) pauseButton.hidden = true;
  document.querySelector('.motion-more')?.setAttribute('hidden', '');
  document.querySelector('.view-controls')?.setAttribute('hidden', '');
  document.querySelector('.view-hint')?.setAttribute('hidden', '');
  if (motionStatus && message) motionStatus.textContent = message;
}

try {
  const canvas = document.querySelector('#scene');
  if (!canvas) throw Error('Thiếu canvas 3D');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0.1, 1.85, 4.9);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1.56, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 2.4;
  controls.maxDistance = 9.0;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.update();

  let homeDistance = 4.9;
  function homeView() {
    const halfFov = THREE.MathUtils.degToRad(35 / 2);
    homeDistance = Math.max(3.6, 1.50 / Math.sin(Math.atan(Math.tan(halfFov) * Math.min(camera.aspect || 1, 1))));
    controls.target.set(0, 1.56, 0);
    camera.position.set(0.1, 1.88, homeDistance);
    controls.maxDistance = Math.max(9.0, homeDistance * 1.75);
    controls.update();
  }
  function zoomView(factor) {
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
  function turnView(angle) {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }

  document.querySelector('#view-left')?.addEventListener('click', () => turnView(-0.32));
  document.querySelector('#view-right')?.addEventListener('click', () => turnView(0.32));
  document.querySelector('#view-in')?.addEventListener('click', () => zoomView(0.82));
  document.querySelector('#view-out')?.addEventListener('click', () => zoomView(1.22));
  document.querySelector('#view-reset')?.addEventListener('click', homeView);

  // Studio 3-point garden lighting
  scene.add(new THREE.HemisphereLight(0xfffdf5, 0x70af88, 2.15));
  const sun = new THREE.DirectionalLight(0xfff3d8, 2.55);
  sun.position.set(-3.2, 7.5, 5.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 20;
  sun.shadow.camera.left = -3.8;
  sun.shadow.camera.right = 3.8;
  sun.shadow.camera.top = 4.2;
  sun.shadow.camera.bottom = -1.5;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0xb5f5e0, 1.1);
  rim.position.set(3.5, 4.0, -4.5);
  scene.add(rim);

  const mat = (color, roughness = 0.52, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, ...extra });

  const ivory = mat(0xfff8eb);
  const mint = mat(0x99d9bf);
  const dark = mat(0x173d48);
  const yellow = mat(0xffcc6f);
  const turq = mat(0x22a995);

  function cube(w, h, d, m, x, y, z, parent = scene) {
    const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z);
    q.castShadow = true;
    q.receiveShadow = true;
    parent.add(q);
    return q;
  }
  function ball(r, m, x, y, z, parent = scene) {
    const q = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m);
    q.position.set(x, y, z);
    q.castShadow = true;
    parent.add(q);
    return q;
  }

  // Garden pedestal & warm workshop desk
  const turfOuter = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.22, 48), mat(0x9bc982, 0.85));
  turfOuter.position.y = -0.14;
  turfOuter.receiveShadow = true;
  scene.add(turfOuter);

  const turfInner = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.7, 0.14, 48), mat(0xb2db96, 0.82));
  turfInner.position.y = -0.02;
  turfInner.receiveShadow = true;
  scene.add(turfInner);

  cube(2.35, 0.24, 1.12, mat(0xdab77e, 0.65), 0, 0.52, 0);
  cube(2.14, 0.14, 0.96, ivory, 0, 0.70, 0);
  for (const x of [-0.92, 0.92]) {
    for (const z of [-0.36, 0.36]) cube(0.12, 0.56, 0.12, mat(0xb98b6a, 0.7), x, 0.20, z);
  }

  for (const x of [-2.15, 2.15]) {
    cube(0.46, 0.62, 0.46, mat(0xe6b388, 0.75), x, 0.32, -1.55);
    ball(0.36, mat(0x52be8e, 0.65), x, 0.92, -1.55);
  }

  // Interactive 3D trays (Left = Tray A at -X, Right = Tray B at +X) + prediction glow columns
  const trayConfigs = [
    { x: -1.52, z: -0.32, baseColor: 0x6ea0ee, rimColor: 0x4b89f0, cardColor: 0xdbe7fd, borderColor: 0x4b7cd4 },
    { x: 1.52, z: -0.32, baseColor: 0xee9c6e, rimColor: 0xe67c3c, cardColor: 0xffe8d6, borderColor: 0xd16f38 }
  ];
  const trayGroups = [];
  const trayCardPools = [[], []];
  const trayHalos = [];
  const trayColumns = [];
  const trayBounce = [0, 0];

  trayConfigs.forEach((cfg, idx) => {
    const g = new THREE.Group();
    g.position.set(cfg.x, 0.08, cfg.z);
    scene.add(g);

    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.66), mat(cfg.baseColor, 0.55));
    pad.castShadow = true;
    pad.receiveShadow = true;
    g.add(pad);

    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 0.58), mat(0xfffdf5, 0.65));
    lip.position.y = 0.05;
    lip.receiveShadow = true;
    g.add(lip);

    const haloMat = new THREE.MeshBasicMaterial({
      color: cfg.rimColor,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.62, 32), haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.06;
    g.add(halo);
    trayHalos.push({ mesh: halo, mat: haloMat, baseColor: cfg.rimColor, active: false, pulseSpeed: 4 });

    const colMat = new THREE.MeshBasicMaterial({
      color: cfg.rimColor,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.48, 2.25, 24, 1, true), colMat);
    col.position.y = 1.15;
    g.add(col);
    trayColumns.push({ mesh: col, mat: colMat, baseColor: cfg.rimColor, active: false });

    const pool = [];
    for (let k = 0; k < 12; k++) {
      const card = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.28), mat(0xffffff, 0.4));
      frame.castShadow = true;
      const pic = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.028, 0.20), mat(cfg.cardColor, 0.5));
      pic.position.z = -0.015;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.029, 0.03), mat(cfg.borderColor, 0.45));
      strip.position.z = 0.105;
      card.add(frame, pic, strip);
      const colIdx = (k % 3) - 1;
      const row = Math.floor(k / 3) % 2;
      const layer = Math.floor(k / 6);
      card.position.set(colIdx * 0.21 + layer * 0.02, 0.085 + layer * 0.032, (row - 0.5) * 0.24);
      card.rotation.y = ((k % 5) - 2) * 0.11;
      card.visible = false;
      g.add(card);
      pool.push(card);
    }
    trayCardPools[idx] = pool;
    trayGroups.push(g);
  });

  // Flying textured photo cards (spawned on mitPhotoFly and cleanly disposed on arrival)
  const flyingCards = [];
  const texLoader = new THREE.TextureLoader();

  function spawnFlyingCard(cls, url) {
    if (reducedMotion) return;
    const targetCfg = trayConfigs[cls === 1 ? 1 : 0];
    const group = new THREE.Group();
    const borderGeo = new THREE.BoxGeometry(0.42, 0.46, 0.025);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    const photoGeo = new THREE.PlaneGeometry(0.35, 0.35);
    const photoMat = new THREE.MeshBasicMaterial({
      color: url ? 0xffffff : targetCfg.cardColor,
      side: THREE.DoubleSide
    });
    const photo = new THREE.Mesh(photoGeo, photoMat);
    photo.position.set(0, 0.025, 0.014);
    group.add(border, photo);
    group.position.set(0, 1.55, 0.85);
    scene.add(group);

    let tex = null;
    if (url) {
      tex = texLoader.load(
        url,
        t => {
          t.colorSpace = THREE.SRGBColorSpace;
          photoMat.map = t;
          photoMat.needsUpdate = true;
        },
        undefined,
        () => {}
      );
    }

    flyingCards.push({
      group,
      targetX: targetCfg.x,
      targetZ: targetCfg.z,
      progress: 0,
      dispose() {
        scene.remove(group);
        borderGeo.dispose();
        borderMat.dispose();
        photoGeo.dispose();
        photoMat.dispose();
        tex?.dispose();
      }
    });
  }

  // Holographic training scan ring + 16 orbiting data orbs
  const holoGroup = new THREE.Group();
  holoGroup.position.set(0, 1.68, 0);
  holoGroup.visible = false;
  scene.add(holoGroup);

  const holoRingMat = new THREE.MeshBasicMaterial({ color: 0xf6be43, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
  const holoRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.026, 12, 56), holoRingMat);
  holoRing.rotation.x = Math.PI / 2;
  holoGroup.add(holoRing);

  const holoRingInnerMat = new THREE.MeshBasicMaterial({ color: 0x55d8b2, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  const holoRingInner = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.018, 10, 48), holoRingInnerMat);
  holoRingInner.rotation.x = Math.PI / 2.4;
  holoGroup.add(holoRingInner);

  const orbPool = [];
  const orbColors = [0x4b89f0, 0xf28749];
  for (let i = 0; i < 16; i++) {
    const cls = i % 2;
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 12, 10),
      new THREE.MeshBasicMaterial({ color: orbColors[cls], transparent: true, opacity: 0.92 })
    );
    orb.visible = false;
    scene.add(orb);
    orbPool.push({ mesh: orb, cls, phase: i / 16 });
  }

  // Ambient garden fireflies + 3D celebration stars
  const fireflies = [];
  const fireflyGeo = new THREE.SphereGeometry(0.032, 8, 8);
  for (let i = 0; i < 12; i++) {
    const f = new THREE.Mesh(
      fireflyGeo,
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffe484 : 0xaef5d5, transparent: true, opacity: 0.62 })
    );
    f.userData = {
      angle: (i / 12) * Math.PI * 2,
      radius: 1.55 + (i % 3) * 0.45,
      yBase: 0.95 + (i % 4) * 0.42,
      speed: 0.28 + (i % 5) * 0.07
    };
    scene.add(f);
    fireflies.push(f);
  }

  const stars3D = [];
  const starGeo = new THREE.OctahedronGeometry(0.085, 0);
  const starPalette = [0xffd35e, 0x58c994, 0x5698f5, 0xf27d52, 0xb87cf2];
  for (let i = 0; i < 22; i++) {
    const s = new THREE.Mesh(
      starGeo,
      new THREE.MeshBasicMaterial({ color: starPalette[i % starPalette.length], transparent: true, opacity: 0 })
    );
    s.visible = false;
    scene.add(s);
    stars3D.push({ mesh: s, vx: 0, vy: 0, vz: 0, life: 0 });
  }

  // Primitive fallback robot (shown only if GLB fails)
  const bot = new THREE.Group();
  bot.position.set(0, 0.78, 0);
  scene.add(bot);
  cube(0.65, 0.62, 0.42, ivory, 0, 0.65, 0, bot);
  cube(0.36, 0.22, 0.06, turq, 0, 0.66, 0.23, bot);
  cube(0.82, 0.66, 0.58, ivory, 0, 1.34, 0, bot);
  cube(0.66, 0.43, 0.07, dark, 0, 1.34, 0.32, bot);
  ball(0.065, mint, -0.17, 1.38, 0.37, bot);
  ball(0.065, mint, 0.17, 1.38, 0.37, bot);
  cube(0.16, 0.025, 0.03, mint, 0, 1.2, 0.37, bot);
  cube(0.06, 0.22, 0.06, mint, 0, 1.75, 0, bot);
  ball(0.09, yellow, 0, 1.9, 0, bot);
  const botLeft = cube(0.16, 0.46, 0.18, ivory, -0.46, 0.66, 0, bot);
  const botRight = cube(0.16, 0.46, 0.18, ivory, 0.46, 0.66, 0, bot);
  botLeft.rotation.z = -0.45;
  botRight.rotation.z = 0.45;
  cube(0.22, 0.25, 0.26, mint, -0.2, 0.22, 0, bot);
  cube(0.22, 0.25, 0.26, mint, 0.2, 0.22, 0, bot);
  bot.visible = false;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let poses = null;
  let paused = false;
  let mixer = null;
  let walkAction = null;
  let runAction = null;
  let activeClip = null;
  let clipTimer = null;
  let bones = null;
  let poseName = 'idle';
  let poseElapsed = 0;
  let poseTimer = null;
  let trainingActive = false;
  let predictHighlightTimer = null;
  let celebrateTimer = 0;
  let targetYaw = 0;
  let moveImpulse = 0;
  let enterActive = false;
  let enterProgress = 0;
  let targetFov = 35;
  const lookTarget = { x: 0, y: 0, tx: 0, ty: 0 };

  const character = new THREE.Group();
  character.position.set(0, 0.78, 0);
  scene.add(character);

  function stopClips() {
    if (activeClip) {
      activeClip.fadeOut(0.2);
      activeClip = null;
    }
    clearTimeout(clipTimer);
  }

  function finishEntrance() {
    if (!enterActive) return;
    enterActive = false;
    character.position.set(0, 0.78, 0);
    targetYaw = 0;
    stopClips();
  }

  function setStatus(text) {
    if (motionStatus) motionStatus.textContent = text || '';
  }

  function choosePose(name, durationMs = 3600) {
    finishEntrance();
    paused = false;
    if (pauseButton) pauseButton.textContent = 'Tạm dừng';
    stopClips();
    clearTimeout(poseTimer);
    poseName = name || 'idle';
    poseElapsed = 0;

    const labels = {
      wave: 'Mít đang vẫy tay chào bạn.',
      think: 'Mít đang suy nghĩ và so sánh ảnh.',
      happy: 'Mít đang vui mừng cùng bạn!',
      sad: 'Mít đang lắng nghe để cùng thử lại.',
      unsure: 'Mít hơi phân vân giữa hai nhóm.',
      lookLeft: 'Mít đang nhìn sang Khay A.',
      lookRight: 'Mít đang nhìn sang Khay B.',
      pointLeft: 'Mít chỉ tay về Khay A.',
      pointRight: 'Mít chỉ tay về Khay B.'
    };
    setStatus(labels[poseName] || '');

    if (poseName !== 'idle' && durationMs > 0) {
      poseTimer = setTimeout(() => {
        poseName = 'idle';
        targetYaw = 0;
        setStatus('');
      }, durationMs);
    }
  }

  function playClip(action, modeName, label) {
    if (!action) return;
    finishEntrance();
    clearTimeout(poseTimer);
    paused = false;
    if (pauseButton) pauseButton.textContent = 'Tạm dừng';
    stopClips();
    poseName = modeName;
    for (const entry of Object.values(bones || {})) entry.bone.quaternion.copy(entry.rest);
    action.reset().fadeIn(0.2).play();
    activeClip = action;
    setStatus(label);
    clipTimer = setTimeout(() => {
      action.fadeOut(0.25);
      activeClip = null;
      poseName = 'idle';
      setStatus('');
    }, 3000);
  }

  function launchStars3D() {
    if (reducedMotion) return;
    celebrateTimer = 2.6;
    stars3D.forEach((s, i) => {
      const a = (i / stars3D.length) * Math.PI * 2;
      const spd = 1.4 + (i % 4) * 0.45;
      s.mesh.visible = true;
      s.mesh.position.set(0, 1.9, 0.2);
      s.vx = Math.cos(a) * spd;
      s.vy = 1.6 + (i % 5) * 0.45;
      s.vz = Math.sin(a) * spd;
      s.life = 1;
      s.mesh.material.opacity = 1;
    });
  }

  function updateTrayCards(counts = [0, 0], activeTray = null) {
    for (let i = 0; i < 2; i++) {
      const n = Math.min(12, Math.max(0, Number(counts[i]) || 0));
      const pool = trayCardPools[i];
      const wasCount = pool.filter(c => c.visible).length;
      pool.forEach((card, k) => {
        card.visible = k < n;
      });
      if (n > wasCount) trayBounce[i] = 1;
    }
    if (activeTray === 0) {
      targetYaw = -0.22;
      choosePose('lookLeft', 2000);
    } else if (activeTray === 1) {
      targetYaw = 0.22;
      choosePose('lookRight', 2000);
    }
  }

  function highlightTrayPrediction(cls, uncertain = false) {
    clearTimeout(predictHighlightTimer);
    trayHalos.forEach((h, idx) => {
      h.active = idx === cls;
      h.mat.color.setHex(uncertain ? 0xf5b83d : h.baseColor);
      h.pulseSpeed = uncertain ? 6.5 : 3.5;
      if (!h.active) h.mat.opacity = 0;
    });
    trayColumns.forEach((col, idx) => {
      col.active = idx === cls;
      col.mat.color.setHex(uncertain ? 0xf5b83d : col.baseColor);
      if (!col.active) col.mat.opacity = 0;
    });
    targetYaw = cls === 0 ? -0.26 : 0.26;
    if (uncertain) choosePose('unsure', 4400);
    else choosePose(cls === 0 ? 'pointLeft' : 'pointRight', 4400);

    predictHighlightTimer = setTimeout(() => {
      trayHalos.forEach(h => {
        h.active = false;
        h.mat.opacity = 0;
      });
      trayColumns.forEach(c => {
        c.active = false;
        c.mat.opacity = 0;
      });
    }, 5200);
  }

  const gltfLoader = new GLTFLoader();
  function loadMitModel(attempt = 0) {
    gltfLoader.load(
      './mit.glb',
      gltf => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        if (!size.y || !Number.isFinite(size.y)) throw new Error('Model size invalid');

        const scale = 1.92 / size.y;
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
        model.traverse(o => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        character.add(model);
        model.updateMatrixWorld(true);

        poses = createPoses(THREE, model);
        bones = Object.fromEntries(Object.entries(poses.bones).map(([n, bone]) => [n, { bone, rest: poses.rest[n] }]));

        if (pauseButton) {
          pauseButton.disabled = false;
          pauseButton.onclick = () => {
            paused = !paused;
            pauseButton.textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
            if (paused) {
              clearTimeout(poseTimer);
              clearTimeout(clipTimer);
            } else {
              poseTimer = setTimeout(() => {
                stopClips();
                poseName = 'idle';
                setStatus('');
              }, 3000);
            }
          };
        }

        [
          ['wave-motion', 'wave'],
          ['think-motion', 'think'],
          ['unsure-motion', 'unsure'],
          ['happy-motion', 'happy'],
          ['sad-motion', 'sad']
        ].forEach(([id, name]) => {
          const btn = document.getElementById(id);
          if (!btn) return;
          btn.disabled = !bones.RightArm || !bones.Head;
          btn.addEventListener('click', () => {
            if (name === 'happy') launchStars3D();
            choosePose(name);
          });
        });

        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          const walkClip = gltf.animations.find(a => a.name === 'Casual_Walk') || gltf.animations.find(a => a.name === 'Walking');
          const runClip = gltf.animations.find(a => a.name === 'Running');

          if (walkClip) {
            walkAction = mixer.clipAction(walkClip);
            walkAction.setLoop(THREE.LoopRepeat, Infinity);
            if (tryButton) {
              tryButton.disabled = false;
              tryButton.textContent = '▶ Đi bộ';
              tryButton.addEventListener('click', () => playClip(walkAction, 'walk', 'Mít đang đi bộ trong vườn.'));
            }
          }
          if (runClip && runButton) {
            runAction = mixer.clipAction(runClip);
            runAction.setLoop(THREE.LoopRepeat, Infinity);
            runButton.disabled = false;
            runButton.textContent = '▶ Chạy vui';
            runButton.addEventListener('click', () => playClip(runAction, 'run', 'Mít đang chạy hào hứng!'));
          }
          if (reducedMotion) setStatus('Đã giảm chuyển động theo cài đặt thiết bị.');
        }

        if (loaderBadge) loaderBadge.hidden = true;
        const fallbackEl = document.querySelector('#sceneFallback');
        if (fallbackEl) fallbackEl.style.display = 'none';

        if (walkAction && !reducedMotion) {
          enterActive = true;
          enterProgress = 0;
          character.position.set(-0.74, 0.78, -0.26);
          character.rotation.y = 0.58;
          targetYaw = 0.58;
          poseName = 'walk';
          walkAction.reset().fadeIn(0.15).play();
          activeClip = walkAction;
        } else {
          choosePose('wave', 2200);
        }
      },
      progress => {
        if (!loaderBadge) return;
        if (progress && progress.total > 0) {
          const pct = Math.min(99, Math.round((progress.loaded / progress.total) * 100));
          loaderBadge.textContent = `Đang gọi Mít 3D… ${pct}%`;
        } else {
          loaderBadge.textContent = 'Đang gọi Mít 3D…';
        }
      },
      error => {
        if (attempt < 1) {
          setTimeout(() => loadMitModel(attempt + 1), 400);
          return;
        }
        console.error('Không tải được robot 3D:', error);
        if (loaderBadge) loaderBadge.hidden = true;
        bot.visible = true;
        const fallbackEl = document.querySelector('#sceneFallback');
        if (fallbackEl) fallbackEl.style.display = 'none';
        if (tryButton) tryButton.textContent = 'Chế độ robot đơn giản';
        if (runButton) runButton.hidden = true;
      }
    );
  }
  loadMitModel();

  if (stage) {
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      lookTarget.tx = THREE.MathUtils.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      lookTarget.ty = THREE.MathUtils.clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1, 1);
    });
    stage.addEventListener('pointerleave', () => {
      lookTarget.tx = 0;
      lookTarget.ty = 0;
    });
  }

  window.addEventListener('mitPose', e => {
    const p = e.detail;
    if (p === 'happy') launchStars3D();
    choosePose(p);
  });

  window.addEventListener('mitTrays', e => {
    const { counts, active } = e.detail || {};
    updateTrayCards(counts, active);
  });

  window.addEventListener('mitPhotoFly', e => {
    const { cls, url } = e.detail || {};
    spawnFlyingCard(cls, url);
  });

  window.addEventListener('mitTraining', e => {
    const { active } = e.detail || {};
    finishEntrance();
    trainingActive = !!active;
    holoGroup.visible = trainingActive;
    targetFov = trainingActive ? 29 : 35;
    if (trainingActive) {
      targetYaw = 0;
      if (poseName !== 'think') choosePose('think', 0);
    } else {
      orbPool.forEach(o => {
        o.mesh.visible = false;
      });
    }
  });

  window.addEventListener('mitPredict', e => {
    const { cls, agreement, neighbours } = e.detail || {};
    const uncertain = typeof agreement === 'number' && typeof neighbours === 'number' && agreement < neighbours;
    highlightTrayPrediction(cls === 1 ? 1 : 0, uncertain);
  });

  window.addEventListener('mitFeedback', e => {
    if (e.detail === 'yes') {
      launchStars3D();
      targetYaw = 0;
      choosePose('happy', 3800);
    } else {
      targetYaw = 0;
      choosePose('sad', 3200);
    }
  });

  window.addEventListener('robotResult', e => {
    targetYaw = e.detail ? 0.22 : -0.22;
    moveImpulse = 1;
    choosePose('happy', 2600);
    setTimeout(() => {
      targetYaw = 0;
    }, 2500);
  });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w && h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', () => {
    resize();
    homeView();
  });
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();
  homeView();

  let isVisible = true;
  let rafId = 0;
  let previous = 0;

  function startLoop() {
    if (rafId) return;
    previous = performance.now();
    rafId = requestAnimationFrame(tick);
  }
  function stopLoop() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else if (isVisible) startLoop();
  });

  if (stage && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      isVisible = !!entries[0]?.isIntersecting;
      if (isVisible && !document.hidden) startLoop();
      else stopLoop();
    }, { threshold: 0.05 }).observe(stage);
  }

  function tick(t) {
    rafId = requestAnimationFrame(tick);
    const dt = previous ? Math.min((t - previous) / 1000, 0.05) : 0;
    previous = t;

    lookTarget.x += (lookTarget.tx - lookTarget.x) * Math.min(1, dt * 6);
    lookTarget.y += (lookTarget.ty - lookTarget.y) * Math.min(1, dt * 6);

    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 4);
      camera.updateProjectionMatrix();
    }

    if (enterActive) {
      enterProgress = Math.min(1, enterProgress + dt / 0.95);
      const ease = 1 - Math.pow(1 - enterProgress, 2.5);
      character.position.x = THREE.MathUtils.lerp(-0.74, 0, ease);
      character.position.z = THREE.MathUtils.lerp(-0.26, 0, ease);
      if (enterProgress > 0.45) targetYaw = 0;
      if (enterProgress >= 1) {
        finishEntrance();
        choosePose('wave', 2400);
      }
    }

    if (mixer && !paused) mixer.update(dt);
    if (!paused) poseElapsed += dt;

    if (poses && poseName !== 'walk' && poseName !== 'run' && !paused) {
      poses.update(poseName, poseElapsed, dt, reducedMotion, lookTarget);
    }

    bot.position.y = 0.78 + Math.sin(t * 0.002) * 0.045;
    bot.rotation.y += (targetYaw - bot.rotation.y) * 0.06;
    botRight.rotation.z = 0.45 + Math.sin(t * 0.003) * 0.15 + moveImpulse * 0.4;
    moveImpulse *= 0.96;

    if (!paused) {
      const excited = poseName === 'happy' && !reducedMotion;
      const sad = poseName === 'sad';
      const envelope = Math.min(1, poseElapsed / 0.22, Math.max(0, (3.6 - poseElapsed) / 0.35));
      const jump = excited ? Math.abs(Math.sin(poseElapsed * 5.8)) * 0.28 * envelope : 0;
      character.position.y += (0.78 + jump - character.position.y) * Math.min(1, dt * 16);
      character.rotation.z += ((excited ? Math.sin(poseElapsed * 5.8) * 0.07 : sad ? 0.06 : 0) - character.rotation.z) * Math.min(1, dt * 8);
      character.rotation.x += ((sad ? 0.09 : 0) - character.rotation.x) * Math.min(1, dt * 8);
      character.rotation.y += (targetYaw - character.rotation.y) * Math.min(1, dt * 6);
    }

    // Update flying photo cards
    for (let i = flyingCards.length - 1; i >= 0; i--) {
      const fc = flyingCards[i];
      fc.progress = Math.min(1, fc.progress + dt * 2.1);
      const u = fc.progress;
      fc.group.position.x = THREE.MathUtils.lerp(0, fc.targetX, u);
      fc.group.position.z = THREE.MathUtils.lerp(0.85, fc.targetZ, u);
      fc.group.position.y = THREE.MathUtils.lerp(1.55, 0.22, u) + Math.sin(u * Math.PI) * 0.95;
      fc.group.rotation.x = -u * Math.PI * 0.45;
      fc.group.rotation.y = (1 - u) * 0.4;
      const s = THREE.MathUtils.lerp(1.15, 0.52, u);
      fc.group.scale.setScalar(s);
      if (u >= 1) {
        fc.dispose();
        flyingCards.splice(i, 1);
      }
    }

    for (let i = 0; i < 2; i++) {
      if (trayBounce[i] > 0.01) {
        trayBounce[i] *= Math.exp(-8 * dt);
        trayGroups[i].position.y = 0.08 + Math.sin(trayBounce[i] * Math.PI) * 0.09;
      } else {
        trayGroups[i].position.y = 0.08;
      }
      const h = trayHalos[i];
      if (h.active) {
        const pulse = 0.45 + 0.45 * Math.sin(t * 0.001 * h.pulseSpeed * Math.PI);
        h.mat.opacity = pulse;
        const sc = 1 + 0.06 * Math.sin(t * 0.004 * h.pulseSpeed);
        h.mesh.scale.set(sc, sc, 1);
      }
      const c = trayColumns[i];
      if (c.active) {
        c.mat.opacity = 0.16 + 0.14 * Math.sin(t * 0.006);
      }
    }

    if (trainingActive && !reducedMotion) {
      holoGroup.position.y = 1.55 + Math.sin(t * 0.004) * 0.25;
      holoRing.rotation.z += dt * 2.8;
      holoRingInner.rotation.z -= dt * 3.6;
      holoRingInner.rotation.y += dt * 1.4;
      holoRingMat.opacity = 0.55 + 0.35 * Math.sin(t * 0.008);

      orbPool.forEach(o => {
        o.phase = (o.phase + dt * 0.85) % 1;
        const u = o.phase;
        const startX = o.cls === 0 ? -1.52 : 1.52;
        const angle = u * Math.PI * 2.5 + o.cls * Math.PI;
        const radius = THREE.MathUtils.lerp(1.55, 0.45, u);
        o.mesh.visible = true;
        o.mesh.position.set(
          THREE.MathUtils.lerp(startX, Math.cos(angle) * radius, u),
          0.3 + Math.sin(u * Math.PI) * 1.45 + u * 0.4,
          -0.32 * (1 - u) + Math.sin(angle) * radius * 0.7
        );
        o.mesh.scale.setScalar(0.6 + Math.sin(u * Math.PI) * 0.6);
      });
    }

    if (!reducedMotion) {
      fireflies.forEach((f, idx) => {
        const d = f.userData;
        const a = d.angle + t * 0.0003 * d.speed;
        f.position.set(
          Math.cos(a) * d.radius,
          d.yBase + Math.sin(t * 0.0014 + idx) * 0.22,
          Math.sin(a) * d.radius - 0.3
        );
      });
    }

    if (celebrateTimer > 0) {
      celebrateTimer = Math.max(0, celebrateTimer - dt);
      stars3D.forEach(s => {
        if (!s.mesh.visible) return;
        s.mesh.position.x += s.vx * dt;
        s.mesh.position.y += s.vy * dt;
        s.mesh.position.z += s.vz * dt;
        s.vy -= 4.2 * dt;
        s.mesh.rotation.x += dt * 5;
        s.mesh.rotation.y += dt * 4;
        s.life = Math.max(0, s.life - dt * 0.48);
        s.mesh.material.opacity = s.life;
        if (s.life <= 0) s.mesh.visible = false;
      });
    }

    controls.update();
    renderer.render(scene, camera);
  }

  startLoop();
} catch (e) {
  hide3DControls('Chế độ minh họa · Bốn bước học vẫn dùng được bình thường.');
  console.error('Cảnh 3D không khả dụng trên thiết bị này:', e);
}
