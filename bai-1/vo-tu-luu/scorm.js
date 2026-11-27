'use strict';

// SCORM 1.2 is provided by the player that launches this SCO.
window.SocEvidence = (() => {
  function find(start) {
    for (let frame = start, depth = 0; frame && depth < 12; depth++) {
      try {
        if (frame.API && typeof frame.API.LMSInitialize === 'function') return frame.API;
        if (frame.parent === frame) break;
        frame = frame.parent;
      } catch {
        break;
      }
    }
    return null;
  }

  function connect() {
    const api = find(window) || find(window.opener);
    const ok = value => value === 'true' || value === true;
    const call = (method, ...args) => {
      try { return api?.[method](...args); } catch { return undefined; }
    };
    let active = ok(call('LMSInitialize', ''));
    const get = name => call('LMSGetValue', name) ?? '';
    const identity = active ? get('cmi.core.student_id') : '';
    const mode = active && get('cmi.core.lesson_mode');
    const readOnly = active && mode && mode !== 'normal';
    const initial = active ? get('cmi.suspend_data') : '';
    let acknowledged = !!initial;
    const preview = document.body.dataset.preview === 'true';

    return {
      identity,
      preview,
      readOnly,
      initial,
      save(snapshot, q1Ready, q2Ready) {
        if (!active || readOnly || navigator.onLine === false) return false;
        const payload = JSON.stringify(snapshot);
        if (payload.length > 4096 || new TextEncoder().encode(payload).length > 4096) return false;
        const values = [
          ['cmi.suspend_data', payload],
          ['cmi.core.lesson_location', 'h' + snapshot.step],
          ['cmi.core.exit', 'suspend'],
          ['cmi.objectives.0.id', 'Q1-4.C2.1'],
          ['cmi.objectives.0.status', q1Ready ? 'completed' : 'incomplete'],
          ['cmi.objectives.1.id', 'Q2-4.C2.MR1'],
          ['cmi.objectives.1.status', q2Ready ? 'completed' : 'incomplete'],
          ['cmi.core.lesson_status', snapshot.finished ? 'completed' : 'incomplete'],
        ];
        for (const [name, value] of values) {
          if (!ok(call('LMSSetValue', name, value))) return false;
        }
        const saved = ok(call('LMSCommit', ''));
        if (saved) acknowledged = true;
        return saved;
      },
      close() {
        if (active && acknowledged && !readOnly) call('LMSFinish', '');
        active = false;
      },
    };
  }
  return { connect };
})();
