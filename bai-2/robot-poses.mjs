// Pose targets are measured from this rig, not assumed Euler axes.
export function createPoses(T, model) {
  const V=()=>new T.Vector3(), Q=()=>new T.Quaternion();
  const find=n=>model.getObjectByName('mixamorig:'+n)||model.getObjectByName(T.PropertyBinding.sanitizeNodeName('mixamorig:'+n));
  const keys=['RightArm','RightForeArm','RightHand','LeftArm','LeftForeArm','LeftHand','Head'];
  const b=Object.fromEntries(keys.map(n=>[n,find(n)]));
  if(Object.values(b).some(x=>!x))throw Error('Thiếu khớp tay của Mít');
  const rest=Object.fromEntries(keys.map(n=>[n,b[n].quaternion.clone()]));
  model.updateWorldMatrix(true,true);
  const pos=n=>b[n].getWorldPosition(V());
  const toLocal=p=>model.worldToLocal(p.clone());
  const anchor=Object.fromEntries(keys.map(n=>[n,toLocal(pos(n))]));
  const length=anchor.RightArm.distanceTo(anchor.RightForeArm)+anchor.RightForeArm.distanceTo(anchor.RightHand);
  function aim(bone,child,target){
    const origin=bone.getWorldPosition(V());
    const delta=Q().setFromUnitVectors(child.getWorldPosition(V()).sub(origin).normalize(),target.clone().sub(origin).normalize());
    const desired=delta.multiply(bone.getWorldQuaternion(Q()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(Q()).invert().multiply(desired));
    bone.updateWorldMatrix(false,true);
  }
  function reach(side,localTarget){
    const upper=b[side+'Arm'],lower=b[side+'ForeArm'],hand=b[side+'Hand'];
    const a=upper.getWorldPosition(V()), e=lower.getWorldPosition(V()), h=hand.getWorldPosition(V());
    const l1=a.distanceTo(e),l2=e.distanceTo(h),target=model.localToWorld(localTarget.clone());
    const dir=target.clone().sub(a), d=T.MathUtils.clamp(dir.length(),Math.abs(l1-l2)+.00001,l1+l2-.00001);dir.normalize();
    const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
    const pole=model.localToWorld(anchor[side+'Arm'].clone().add(new T.Vector3(side==='Right'?-.35:.35,-1,.2))).sub(a);
    pole.addScaledVector(dir,-pole.dot(dir)).normalize();
    const elbow=a.clone().addScaledVector(dir,along).addScaledVector(pole,height);
    aim(upper,lower,elbow);aim(lower,hand,a.clone().addScaledVector(dir,d));
  }
  return {bones:b,rest,anchor,length, update(name,time,dt,reduced=false){
    const previous=Object.fromEntries(keys.map(n=>[n,b[n].quaternion.clone()]));
    keys.forEach(n=>b[n].quaternion.copy(rest[n]));model.updateWorldMatrix(true,true);
    const right=anchor.RightHand.clone(),left=anchor.LeftHand.clone();
    if(name==='think'){
      // Oversized head: keep hands in their safe resting positions, express thought with the head.
      b.Head.quaternion.multiply(Q().setFromAxisAngle(new T.Vector3(0,0,1),.07+(reduced?0:Math.sin(time*2)*.025)));
      b.Head.quaternion.multiply(Q().setFromAxisAngle(new T.Vector3(1,0,0),.035));
    } else if(name==='sad'){
      b.Head.quaternion.multiply(Q().setFromAxisAngle(new T.Vector3(1,0,0),.28));
      b.Head.quaternion.multiply(Q().setFromAxisAngle(new T.Vector3(0,0,1),-.09));
    } else if(name==='wave'){
      right.copy(anchor.RightArm).add(new T.Vector3(-length*.88,length*.12,length*.20));
      right.y+=reduced?0:Math.sin(time*7)*length*.08;
    } else if(name==='happy'){
      const beat=reduced?0:Math.sin(time*5);
      right.copy(anchor.RightArm).add(new T.Vector3(-length*.75,length*(-.16+.18*beat),length*.18));
      left.copy(anchor.LeftArm).add(new T.Vector3(length*.75,length*(-.16-.18*beat),length*.18));
      b.Head.quaternion.multiply(Q().setFromAxisAngle(new T.Vector3(0,0,1),reduced?0:Math.sin(time*5)*.025));
    }
    reach('Right',right);reach('Left',left);
    const alpha=reduced?1:1-Math.exp(-10*Math.min(dt,.05));
    keys.forEach(n=>{const target=b[n].quaternion.clone();b[n].quaternion.copy(previous[n]).slerp(target,alpha)});
    model.updateWorldMatrix(true,true);
  }};
}
