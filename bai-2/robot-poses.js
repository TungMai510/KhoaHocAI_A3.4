// Pose targets are measured from this rig, not assumed Euler axes.
// Coordinate convention (Mít faces +Z):
//   -X = Mít's right / viewer's left (Tray A) -> negative Y rotation turns toward Tray A
//   +X = Mít's left / viewer's right (Tray B) -> positive Y rotation turns toward Tray B
export function createPoses(T, model) {
  const V = () => new T.Vector3();
  const Q = () => new T.Quaternion();
  const find = n =>
    model.getObjectByName('mixamorig:' + n) ||
    model.getObjectByName(T.PropertyBinding.sanitizeNodeName('mixamorig:' + n));

  const requiredKeys = ['RightArm', 'RightForeArm', 'RightHand', 'LeftArm', 'LeftForeArm', 'LeftHand', 'Head'];
  const optionalKeys = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'LeftShoulder', 'RightShoulder'];

  const b = {};
  for (const n of requiredKeys) {
    b[n] = find(n);
    if (!b[n]) throw Error('Thiếu khớp tay của Mít: ' + n);
  }
  for (const n of optionalKeys) {
    const bone = find(n);
    if (bone) b[n] = bone;
  }

  const allKeys = Object.keys(b);
  const rest = Object.fromEntries(allKeys.map(n => [n, b[n].quaternion.clone()]));

  model.updateWorldMatrix(true, true);
  const toLocal = p => model.worldToLocal(p.clone());
  const restAnchor = Object.fromEntries(allKeys.map(n => [n, toLocal(b[n].getWorldPosition(V()))]));
  const length =
    restAnchor.RightArm.distanceTo(restAnchor.RightForeArm) +
    restAnchor.RightForeArm.distanceTo(restAnchor.RightHand);

  const axisX = new T.Vector3(1, 0, 0);
  const axisY = new T.Vector3(0, 1, 0);
  const axisZ = new T.Vector3(0, 0, 1);

  function rotateBone(bone, rx, ry, rz) {
    if (!bone) return;
    if (ry) bone.quaternion.multiply(Q().setFromAxisAngle(axisY, ry));
    if (rx) bone.quaternion.multiply(Q().setFromAxisAngle(axisX, rx));
    if (rz) bone.quaternion.multiply(Q().setFromAxisAngle(axisZ, rz));
  }

  function aim(bone, child, target) {
    const origin = bone.getWorldPosition(V());
    const from = child.getWorldPosition(V()).sub(origin).normalize();
    const to = target.clone().sub(origin).normalize();
    if (from.lengthSq() < 1e-8 || to.lengthSq() < 1e-8) return;
    const delta = Q().setFromUnitVectors(from, to);
    const desired = delta.multiply(bone.getWorldQuaternion(Q()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(Q()).invert().multiply(desired));
    bone.updateWorldMatrix(false, true);
  }

  function liveAnchor(name) {
    return toLocal(b[name].getWorldPosition(V()));
  }

  function reach(side, localTarget) {
    const upper = b[side + 'Arm'];
    const lower = b[side + 'ForeArm'];
    const hand = b[side + 'Hand'];
    const a = upper.getWorldPosition(V());
    const e = lower.getWorldPosition(V());
    const h = hand.getWorldPosition(V());
    const l1 = a.distanceTo(e);
    const l2 = e.distanceTo(h);
    const target = model.localToWorld(localTarget.clone());
    const dir = target.clone().sub(a);
    const d = T.MathUtils.clamp(dir.length(), Math.abs(l1 - l2) + 0.0001, l1 + l2 - 0.0001);
    dir.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const shoulderLocal = liveAnchor(side + 'Arm');
    const pole = model
      .localToWorld(shoulderLocal.clone().add(new T.Vector3(side === 'Right' ? -0.35 : 0.35, -1, -0.15)))
      .sub(a);
    pole.addScaledVector(dir, -pole.dot(dir));
    if (pole.lengthSq() < 1e-6) pole.set(0, -1, 0);
    pole.normalize();
    const elbow = a.clone().addScaledVector(dir, along).addScaledVector(pole, height);
    aim(upper, lower, elbow);
    aim(lower, hand, a.clone().addScaledVector(dir, d));
  }

  return {
    bones: b,
    rest,
    anchor: restAnchor,
    length,
    update(name, time, dt, reduced = false, lookTarget = { x: 0, y: 0 }) {
      const previous = Object.fromEntries(allKeys.map(n => [n, b[n].quaternion.clone()]));
      allKeys.forEach(n => b[n].quaternion.copy(rest[n]));
      model.updateWorldMatrix(true, true);

      const lx = T.MathUtils.clamp(lookTarget?.x || 0, -1, 1);
      const ly = T.MathUtils.clamp(lookTarget?.y || 0, -1, 1);
      const motion = reduced ? 0 : 1;

      if (name === 'idle') {
        const breath = motion * Math.sin(time * 2.2);
        const sway = motion * Math.sin(time * 1.1);
        rotateBone(b.Spine1, breath * 0.02, lx * 0.09, sway * 0.015);
        rotateBone(b.Spine2, breath * 0.025, lx * 0.07, -sway * 0.01);
        rotateBone(b.LeftShoulder, 0, 0, breath * 0.03);
        rotateBone(b.RightShoulder, 0, 0, -breath * 0.03);
        rotateBone(b.Neck, -ly * 0.08, lx * 0.16, 0);
        rotateBone(b.Head, -ly * 0.15 + breath * 0.02, lx * 0.24, sway * 0.04);
      } else if (name === 'wave') {
        const w = motion * Math.sin(time * 7.2);
        rotateBone(b.Spine1, -0.03, 0.06, -0.05);
        rotateBone(b.Spine2, -0.02, 0.05, -0.04);
        rotateBone(b.RightShoulder, 0, 0, -0.16);
        rotateBone(b.Neck, -0.03, 0.04, 0.04);
        rotateBone(b.Head, -0.04, 0.06, 0.1 + w * 0.035);
      } else if (name === 'lookLeft') {
        const bob = motion * Math.sin(time * 3);
        rotateBone(b.Spine1, 0.03, -0.22, 0.04);
        rotateBone(b.Spine2, 0.03, -0.18, 0.03);
        rotateBone(b.Neck, 0.03, -0.16, 0.02);
        rotateBone(b.Head, 0.04 + bob * 0.025, -0.26, 0.06);
      } else if (name === 'lookRight') {
        const bob = motion * Math.sin(time * 3);
        rotateBone(b.Spine1, 0.03, 0.22, -0.04);
        rotateBone(b.Spine2, 0.03, 0.18, -0.03);
        rotateBone(b.Neck, 0.03, 0.16, -0.02);
        rotateBone(b.Head, 0.04 + bob * 0.025, 0.26, -0.06);
      } else if (name === 'pointLeft') {
        const nod = motion * Math.sin(time * 5);
        rotateBone(b.Spine1, 0.05, -0.30, 0.07);
        rotateBone(b.Spine2, 0.04, -0.24, 0.05);
        rotateBone(b.RightShoulder, 0, -0.12, -0.12);
        rotateBone(b.Neck, 0.03, -0.14, 0.02);
        rotateBone(b.Head, 0.07 + nod * 0.05, -0.24, 0.06);
      } else if (name === 'pointRight') {
        const nod = motion * Math.sin(time * 5);
        rotateBone(b.Spine1, 0.05, 0.30, -0.07);
        rotateBone(b.Spine2, 0.04, 0.24, -0.05);
        rotateBone(b.LeftShoulder, 0, 0.12, 0.12);
        rotateBone(b.Neck, 0.03, 0.14, -0.02);
        rotateBone(b.Head, 0.07 + nod * 0.05, 0.24, -0.06);
      } else if (name === 'think') {
        const scan = motion * Math.sin(time * 2);
        const tilt = motion * Math.sin(time * 2.6);
        rotateBone(b.Spine1, 0.06, scan * 0.10, 0);
        rotateBone(b.Spine2, 0.05, scan * 0.10, 0);
        rotateBone(b.Neck, 0.03, scan * 0.08, 0.05);
        rotateBone(b.Head, 0.05, scan * 0.14, 0.10 + tilt * 0.06);
      } else if (name === 'unsure') {
        const sway = motion * Math.sin(time * 2.8);
        rotateBone(b.Spine1, -0.02, sway * 0.06, 0);
        rotateBone(b.LeftShoulder, 0, 0, 0.20);
        rotateBone(b.RightShoulder, 0, 0, -0.20);
        rotateBone(b.Neck, -0.02, sway * 0.07, 0.05);
        rotateBone(b.Head, 0.02, sway * 0.12, 0.16);
      } else if (name === 'happy') {
        const beat = motion * Math.sin(time * 5.8);
        rotateBone(b.Spine1, -0.06, 0, beat * 0.06);
        rotateBone(b.Spine2, -0.05, 0, beat * 0.06);
        rotateBone(b.LeftShoulder, 0, 0, 0.18);
        rotateBone(b.RightShoulder, 0, 0, -0.18);
        rotateBone(b.Neck, -0.04, 0, beat * 0.05);
        rotateBone(b.Head, -0.06, beat * 0.07, beat * 0.09);
      } else if (name === 'sad') {
        const shake = motion * Math.sin(time * 2.4);
        rotateBone(b.Spine1, 0.09, 0, 0);
        rotateBone(b.Spine2, 0.09, 0, 0);
        rotateBone(b.LeftShoulder, 0, 0, -0.10);
        rotateBone(b.RightShoulder, 0, 0, 0.10);
        rotateBone(b.Neck, 0.09, shake * 0.05, -0.02);
        rotateBone(b.Head, 0.24, shake * 0.09, -0.08);
      }

      model.updateWorldMatrix(true, true);

      const rightShoulder = liveAnchor('RightArm');
      const leftShoulder = liveAnchor('LeftArm');
      const right = rightShoulder.clone().add(new T.Vector3(-length * 0.18, -length * 0.86, length * 0.16));
      const left = leftShoulder.clone().add(new T.Vector3(length * 0.18, -length * 0.86, length * 0.16));

      if (name === 'idle') {
        const breath = motion * Math.sin(time * 2.2);
        right.y += breath * length * 0.02;
        left.y += breath * length * 0.02;
      } else if (name === 'wave') {
        const w = motion * Math.sin(time * 7.2);
        const wCos = motion * Math.cos(time * 7.2);
        right.copy(rightShoulder).add(new T.Vector3(-length * 0.66 + w * length * 0.14, length * 0.42 + wCos * length * 0.06, length * 0.24));
      } else if (name === 'lookLeft') {
        right.copy(rightShoulder).add(new T.Vector3(-length * 0.72, -length * 0.18, length * 0.34));
      } else if (name === 'lookRight') {
        left.copy(leftShoulder).add(new T.Vector3(length * 0.72, -length * 0.18, length * 0.34));
      } else if (name === 'pointLeft') {
        const pulse = motion * Math.sin(time * 5);
        right.copy(rightShoulder).add(new T.Vector3(-length * 0.94, length * 0.10 + pulse * length * 0.04, length * 0.28));
        left.copy(leftShoulder).add(new T.Vector3(length * 0.16, -length * 0.84, length * 0.08));
      } else if (name === 'pointRight') {
        const pulse = motion * Math.sin(time * 5);
        left.copy(leftShoulder).add(new T.Vector3(length * 0.94, length * 0.10 + pulse * length * 0.04, length * 0.28));
        right.copy(rightShoulder).add(new T.Vector3(-length * 0.16, -length * 0.84, length * 0.08));
      } else if (name === 'think') {
        const pulse = motion * Math.sin(time * 2.6);
        right.copy(rightShoulder).add(new T.Vector3(-length * 0.30, -length * 0.36 + pulse * length * 0.03, length * 0.44));
        left.copy(leftShoulder).add(new T.Vector3(length * 0.32, -length * 0.54, length * 0.34));
      } else if (name === 'unsure') {
        const pulse = motion * Math.sin(time * 3.2);
        right.copy(rightShoulder).add(new T.Vector3(-length * 0.64, -length * 0.28 + pulse * length * 0.04, length * 0.34));
        left.copy(leftShoulder).add(new T.Vector3(length * 0.64, -length * 0.28 - pulse * length * 0.04, length * 0.34));
      } else if (name === 'happy') {
        const beat = motion * Math.sin(time * 5.8);
        right.copy(rightShoulder).add(new T.Vector3(-length * 0.74, length * 0.42 + beat * length * 0.13, length * 0.22));
        left.copy(leftShoulder).add(new T.Vector3(length * 0.74, length * 0.42 - beat * length * 0.13, length * 0.22));
      } else if (name === 'sad') {
        right.copy(rightShoulder).add(new T.Vector3(-length * 0.24, -length * 0.74, length * 0.22));
        left.copy(leftShoulder).add(new T.Vector3(length * 0.24, -length * 0.74, length * 0.22));
      }

      reach('Right', right);
      reach('Left', left);

      const alpha = reduced ? 1 : 1 - Math.exp(-11 * Math.min(dt, 0.05));
      allKeys.forEach(n => {
        const target = b[n].quaternion.clone();
        b[n].quaternion.copy(previous[n]).slerp(target, alpha);
      });
      model.updateWorldMatrix(true, true);
    }
  };
}
