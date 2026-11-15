/* Lightweight, local WebGL evidence viewer. No library, downloads, or analytics. */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
    .evidence-viewer{position:relative;width:100%;color:#184b3e}
    .evidence-viewer [hidden]{display:none!important}
    .evidence-viewer .model-stage{position:relative;height:330px;max-height:48vh;min-height:240px;border-radius:28px;overflow:hidden;background:radial-gradient(ellipse at 50% 36%,#fffdf1 0,#e1edcf 65%,#c8ddad 100%);box-shadow:inset 0 0 0 1px #c6d9b0}
    .evidence-viewer .model-stage:after{content:'';pointer-events:none;position:absolute;width:43%;height:8%;border-radius:50%;background:#395b3b20;filter:blur(8px);left:29%;bottom:10%}
    .evidence-viewer .model-canvas{position:relative;z-index:1;display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline-offset:-5px;border-radius:28px}
    .evidence-viewer .model-canvas:active{cursor:grabbing}
    .evidence-viewer .model-canvas:focus-visible{outline:3px solid #a45b21}
    .evidence-viewer .model-tools{display:flex;justify-content:center;flex-wrap:wrap;gap:7px;margin:10px 0 5px}
    .evidence-viewer button{font:inherit;color:inherit;cursor:pointer;min-height:44px;border:1px solid #afc393;background:#fffdf2;border-radius:12px;padding:8px 13px}
    .evidence-viewer button:hover{background:#fff0b0}
    .evidence-viewer button:focus-visible{outline:3px solid #a45b21;outline-offset:3px}
    .evidence-viewer .model-instruction{text-align:center;font-size:.82rem;color:#44634e;margin:4px 0 10px}
    .evidence-viewer .clue-options{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
    .evidence-viewer .clue-options button{flex:1 1 110px;font-size:.85rem;background:#fff8dc}
    .evidence-viewer .clue-options [aria-pressed=true]{border:2px solid #1d6a4a;background:#e0f0c9}
    .evidence-viewer .fallback-art{position:relative;z-index:1;max-width:410px;height:100%;margin:auto}
    .evidence-viewer .fallback-art img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
    .evidence-viewer .fallback-hotspot{position:absolute;padding:0;min-height:44px;width:48px;height:44px;border:2px dashed transparent;background:transparent;transform:translate(-50%,-50%);border-radius:50%;z-index:2}
    .evidence-viewer .fallback-hotspot:hover,.evidence-viewer .fallback-hotspot:focus-visible{border-color:#286b48;background:#fff3b44d}
    .evidence-viewer .model-mode{border:0;background:transparent;text-decoration:underline;font-size:.8rem;display:block;margin:6px auto 0}
    .evidence-viewer .model-rotate{font-size:1rem;padding:5px 14px;min-width:44px}
    @media(max-width:500px){.evidence-viewer .model-stage{height:280px;min-height:230px}.evidence-viewer .clue-options{gap:5px}.evidence-viewer .clue-options button{padding:7px;font-size:.78rem;flex-basis:85px}.evidence-viewer .model-instruction{font-size:.77rem}.evidence-viewer .model-tools{gap:5px}.evidence-viewer .model-rotate{padding:6px 11px}}
  `;
  document.head.append(style);

  function createEvidenceModel(host, onSelect) {
    host.classList.add('evidence-viewer');
    host.innerHTML = `<div class="model-stage">
      <canvas class="model-canvas" tabindex="0" role="img" aria-label="Mô hình vật chứng có thể xoay. Dùng phím mũi tên để xoay, hoặc chọn chi tiết bằng các nút dưới hình."></canvas>
      <div class="fallback-art" hidden><img src="assets/can.svg" alt="Ảnh rõ của cùng vật chứng. Chọn một chi tiết trên nắp, thân hoặc đáy.">
        <button class="fallback-hotspot" data-hotspot="tab" style="left:48%;top:23%" aria-label="Chọn chi tiết trên nắp"></button>
        <button class="fallback-hotspot" data-hotspot="body" style="left:49%;top:53%" aria-label="Chọn thân màu xanh"></button>
        <button class="fallback-hotspot" data-hotspot="base" style="left:50%;top:81%" aria-label="Chọn đáy đồ vật"></button>
      </div>
    </div>
    <div class="model-tools" aria-label="Xoay vật chứng">
      <button class="model-rotate" data-rotate="left" aria-label="Xoay sang trái">↶</button>
      <button class="model-rotate" data-rotate="right" aria-label="Xoay sang phải">↷</button>
      <button class="model-rotate" data-rotate="up" aria-label="Nhìn từ trên xuống">↑</button>
      <button class="model-rotate" data-rotate="down" aria-label="Nhìn từ phía dưới">↓</button>
      <button class="model-rotate" data-rotate="reset" aria-label="Đặt lại góc nhìn">↺</button>
    </div>
    <p class="model-instruction">Kéo ngang để xoay · Vuốt dọc để cuộn · Chạm chi tiết em chọn.</p>
    <div class="clue-options" role="group" aria-label="Chọn chi tiết bằng bàn phím hoặc nút">
      <button data-clue="tab" aria-pressed="false">Chi tiết trên nắp</button>
      <button data-clue="body" aria-pressed="false">Thân màu xanh</button>
      <button data-clue="base" aria-pressed="false">Đáy đồ vật</button>
    </div>
    <button id="model-fallback" class="model-mode">Dùng ảnh thay thế</button>`;
    const canvas = host.querySelector('canvas'), fallback = host.querySelector('.fallback-art');
    const instruction = host.querySelector('.model-instruction'), toggle = host.querySelector('#model-fallback');
    const tools = host.querySelector('.model-tools');
    let gl, program, buffer, ro, yaw = -.42, pitch = .28, destroyed = false, pointer = null, mode = '2d';
    let vertices = [], faces = [], selectedClue = null;
    const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
    function choose(part) {
      if (destroyed) return;
      selectedClue = part;
      host.querySelectorAll('[data-clue]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.clue===part)));
      onSelect(part);
    }
    host.querySelectorAll('[data-clue]').forEach(b=>b.onclick=()=>choose(b.dataset.clue));
    host.querySelectorAll('[data-hotspot]').forEach(b=>b.onclick=()=>choose(b.dataset.hotspot));
    function changeView(view) {
      mode = view; host.dataset.view = view;
      canvas.hidden = view !== '3d'; fallback.hidden = view === '3d'; tools.hidden = view !== '3d';
      toggle.textContent = view === '3d' ? 'Dùng ảnh thay thế' : gl ? 'Trở lại mô hình 3D' : 'Đang dùng ảnh tương tác';
      toggle.hidden = !gl;
      instruction.textContent = view === '3d' ? 'Kéo ngang để xoay · Vuốt dọc để cuộn · Chạm chi tiết em chọn.' : 'Chạm một chi tiết trong ảnh, hoặc chọn bằng các nút bên dưới.';
      if(view === '3d') render(); else positionHotspots();
    }
    toggle.onclick=()=>changeView(mode==='3d'?'2d':'3d');

    const green=[.09,.48,.36], lightGreen=[.15,.62,.46], silver=[.77,.84,.77], darkSilver=[.39,.52,.44], gold=[.98,.79,.28];
    function triangle(a,b,c,color,part='body') {
      const u=b.map((x,i)=>x-a[i]), v=c.map((x,i)=>x-a[i]);
      let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const len=Math.hypot(...n)||1;n=n.map(x=>x/len);
      [a,b,c].forEach(p=>vertices.push(...p,...n,...color));
      faces.push({a,b,c,part});
    }
    function quad(a,b,c,d,color,part) {triangle(a,b,c,color,part);triangle(a,c,d,color,part);}
    function cylinder(radius, y1,y2,color,part='body',radius2=radius) {
      for(let i=0;i<80;i++) {
        const t=i/80*Math.PI*2,t2=(i+1)/80*Math.PI*2;
        const a=[Math.cos(t)*radius,y1,Math.sin(t)*radius],b=[Math.cos(t2)*radius,y1,Math.sin(t2)*radius];
        const c=[Math.cos(t2)*radius2,y2,Math.sin(t2)*radius2],d=[Math.cos(t)*radius2,y2,Math.sin(t)*radius2];
        quad(a,d,c,b,color,part);
      }
    }
    function disk(radius,y,color,part) {
      for(let i=0;i<80;i++){let t=i/80*Math.PI*2,t2=(i+1)/80*Math.PI*2;triangle([0,y,0],[Math.cos(t)*radius,y,Math.sin(t)*radius],[Math.cos(t2)*radius,y,Math.sin(t2)*radius],color,part);}
    }
    function ring(rx,rz,tube,y,zc,color,part='tab') {
      const point=(u,v)=>[(rx+tube*Math.cos(v))*Math.cos(u),y+tube*Math.sin(v),zc+(rz+tube*Math.cos(v))*Math.sin(u)];
      for(let i=0;i<64;i++)for(let j=0;j<10;j++) {
        const u=i/64*Math.PI*2,u2=(i+1)/64*Math.PI*2,v=j/10*Math.PI*2,v2=(j+1)/10*Math.PI*2;
        quad(point(u,v),point(u2,v),point(u2,v2),point(u,v2),color,part);
      }
    }
    // Rolled rims, shoulders, body, recessed metal lid, and raised pull ring.
    cylinder(.65,-1.13,-1.07,silver,'base',.73); cylinder(.73,-1.07,-.91,darkSilver,'base',.76);
    cylinder(.76,-.94,.86,green); cylinder(.76,.86,1.03,lightGreen,'body',.69);
    cylinder(.69,1.03,1.10,silver,'body',.70);disk(.70,1.10,silver,'body');
    ring(.70,.70,.027,1.10,0,silver,'body');ring(.63,.63,.014,1.107,0,darkSilver,'body');
    ring(.70,.70,.025,-1.10,0,silver,'base');disk(.65,-1.13,darkSilver,'base');
    // Dark opening beside the ring, shaped in the lid plane.
    for(let i=0;i<50;i++){const t=i/50*Math.PI*2,t2=(i+1)/50*Math.PI*2;triangle([0,1.114,-.28],[.18*Math.cos(t),1.114,-.28+.22*Math.sin(t)],[.18*Math.cos(t2),1.114,-.28+.22*Math.sin(t2)],[.13,.23,.18],'body');}
    ring(.13,.235,.034,1.158,.13,[.92,.94,.85]);
    quad([-.12,1.16,-.025],[.12,1.16,-.025],[.12,1.16,.035],[-.12,1.16,.035],silver,'tab');
    // Gold circular leaf label, gently curved around the front of the body.
    const label=(x,y,r=.773)=>[x,y,Math.sqrt(r*r-x*x)];
    for(let band=0;band<12;band++)for(let i=0;i<64;i++) {
      const t=i/64*Math.PI*2,t2=(i+1)/64*Math.PI*2,r1=.35*band/12,r2=.35*(band+1)/12;
      quad(label(r1*Math.cos(t),-.03+r1*Math.sin(t)),label(r2*Math.cos(t),-.03+r2*Math.sin(t)),label(r2*Math.cos(t2),-.03+r2*Math.sin(t2)),label(r1*Math.cos(t2),-.03+r1*Math.sin(t2)),gold);
    }
    // A little green leaf on the curved yellow badge.
    for(let band=0;band<8;band++)for(let i=0;i<40;i++) {
      const t=i/40*Math.PI*2,t2=(i+1)/40*Math.PI*2,r1=band/8,r2=(band+1)/8;
      const point=(r,a)=>{const x=.13*r*Math.cos(a),y=.23*r*Math.sin(a);return label(x*.8+y*.6,y*.8-x*.6,.785);};
      quad(point(r1,t),point(r2,t),point(r2,t2),point(r1,t2),green);
    }

    function rotate(p) {
      const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch);
      const x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy;
      return [x,p[1]*cx-z*sx,p[1]*sx+z*cx];
    }
    function matrix() {
      const a=rotate([1,0,0]),b=rotate([0,1,0]),c=rotate([0,0,1]);
      const aspect=canvas.clientWidth/canvas.clientHeight;
      const sx=1/(1.62*aspect),sy=1/1.62;
      return new Float32Array([a[0]*sx,a[1]*sy,-a[2]/8,0,b[0]*sx,b[1]*sy,-b[2]/8,0,c[0]*sx,c[1]*sy,-c[2]/8,0,0,0,0,1]);
    }
    function render() {
      host.dataset.yaw=yaw.toFixed(3); host.dataset.pitch=pitch.toFixed(3);
      if(!gl || mode!=='3d' || destroyed) return;
      const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
      if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,12],['aColor',3,24]]) {const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,36,offset);}
      gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMatrix'),false,matrix());
      const a=rotate([1,0,0]),b=rotate([0,1,0]),cc=rotate([0,0,1]);
      gl.uniformMatrix3fv(gl.getUniformLocation(program,'uNormal'),false,new Float32Array([...a,...b,...cc]));
      gl.drawArrays(gl.TRIANGLES,0,vertices.length/9);
    }
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    try {
      if(new URLSearchParams(location.search).get('view')==='2d')throw Error('2D selected');
      gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});
      if(!gl)throw Error('WebGL unavailable');
      program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec3 aPosition,aNormal,aColor;uniform mat4 uMatrix;uniform mat3 uNormal;varying vec3 vNormal,vColor;void main(){gl_Position=uMatrix*vec4(aPosition,1.);vNormal=uNormal*aNormal;vColor=aColor;}`));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 vNormal,vColor;void main(){vec3 n=normalize(vNormal);float light=.62+.38*abs(dot(n,normalize(vec3(-.5,.8,1.))));float shine=pow(max(0.,dot(reflect(-normalize(vec3(-.5,.8,1.)),n),vec3(0.,0.,1.))),28.)*.16;gl_FragColor=vec4(vColor*light+shine,1.);}`));
      gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader program');
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);gl.enable(gl.DEPTH_TEST);
      changeView('3d');
    } catch (_) {gl=null;changeView('2d');}

    function hitTest(x,y) {
      const r=canvas.getBoundingClientRect(), aspect=r.width/r.height;
      const project=p=>{const v=rotate(p);return [(v[0]/(1.62*aspect)+1)*r.width/2,(1-v[1]/1.62)*r.height/2,v[2]];};
      const tab=project([0,1.16,.13]);
      // A generous touch target over the small physical detail, while it is visible.
      if(pitch>.13 && Math.hypot(x-tab[0],y-tab[1])<24)return 'tab';
      let found=null,depth=-Infinity;
      for(const f of faces){const [a,b,c]=[f.a,f.b,f.c].map(project),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<.001)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,w=1-u-v;if(u>=0&&v>=0&&w>=0){const z=u*a[2]+v*b[2]+w*c[2];if(z>depth){depth=z;found=f.part;}}}
      return found;
    }
    canvas.onpointerdown=ev=>{if(mode!=='3d')return;pointer={id:ev.pointerId,x:ev.clientX,y:ev.clientY,start:ev.clientX,vertical:ev.clientY,moved:false};canvas.setPointerCapture(ev.pointerId);};
    canvas.onpointermove=ev=>{if(!pointer||pointer.id!==ev.pointerId)return;const dx=ev.clientX-pointer.x,dy=ev.clientY-pointer.y;if(Math.hypot(ev.clientX-pointer.start,ev.clientY-pointer.vertical)>7)pointer.moved=true;if(Math.abs(ev.clientX-pointer.start)>Math.abs(ev.clientY-pointer.vertical)){yaw+=dx*.013;render();}pointer.x=ev.clientX;pointer.y=ev.clientY;};
    canvas.onpointerup=ev=>{if(!pointer||pointer.id!==ev.pointerId)return;if(!pointer.moved){const r=canvas.getBoundingClientRect(),part=hitTest(ev.clientX-r.left,ev.clientY-r.top);if(part)choose(part);}pointer=null;};
    canvas.onpointercancel=()=>{pointer=null;};
    function turn(dir){if(dir==='reset'){yaw=-.42;pitch=.28;}if(dir==='left')yaw-=.35;if(dir==='right')yaw+=.35;if(dir==='up')pitch=clamp(pitch+.23,-.45,1.15);if(dir==='down')pitch=clamp(pitch-.23,-.45,1.15);render();}
    host.querySelectorAll('[data-rotate]').forEach(b=>b.onclick=()=>turn(b.dataset.rotate));
    canvas.onkeydown=ev=>{const key={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Home:'reset'}[ev.key];if(key){ev.preventDefault();turn(key);}};
    canvas.addEventListener('webglcontextlost',ev=>{ev.preventDefault();gl=null;changeView('2d');});
    ro=new ResizeObserver(()=>{render();positionHotspots();});ro.observe(host);
    function positionHotspots(){const r=fallback.getBoundingClientRect();if(!r.width||!r.height)return;const width=Math.min(r.width,r.height*440/360),height=width*360/440,left=(r.width-width)/2,top=(r.height-height)/2;const points={tab:[.465,.225],body:[.50,.55],base:[.50,.805]};for(const b of host.querySelectorAll('[data-hotspot]')){const p=points[b.dataset.hotspot];b.style.left=`${left+p[0]*width}px`;b.style.top=`${top+p[1]*height}px`;}}
    fallback.querySelector('img').onload=positionHotspots;
    host.dataset.yaw=yaw.toFixed(3);host.dataset.pitch=pitch.toFixed(3);
    return {
      reset(){yaw=-.42;pitch=.28;selectedClue=null;host.querySelectorAll('[data-clue]').forEach(b=>b.setAttribute('aria-pressed','false'));render();},
      useFallback(){changeView('2d');positionHotspots();},
      destroy(){destroyed=true;ro.disconnect();if(gl){gl.deleteBuffer(buffer);gl.deleteProgram(program);}host.replaceChildren();},
      get mode(){return mode;},get selected(){return selectedClue;}
    };
  }
  window.createEvidenceModel=createEvidenceModel;
}());
