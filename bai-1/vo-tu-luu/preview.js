'use strict';

// Local QA only. This API is outside the exported SCORM package.
(() => {
  const token = new URLSearchParams(location.search).get('luot');
  let revision = 0;
  let values = {};
  const endpoint = '/api/attempt/' + encodeURIComponent(token);
  function request(method, data) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, endpoint, false);
      if (data) xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data ? JSON.stringify(data) : null);
      return xhr.status === 200 ? JSON.parse(xhr.responseText) : null;
    } catch {
      return null;
    }
  }
  window.API = {
    LMSInitialize() {
      const result = request('GET');
      if (!result) return 'false';
      revision = result.revision;
      values = result.values;
      return 'true';
    },
    LMSGetValue(key) {
      if (key === 'cmi.core.student_id') return token;
      if (key === 'cmi.core.lesson_mode') return 'normal';
      return values[key] || '';
    },
    LMSSetValue(key, value) {
      values[key] = String(value);
      return 'true';
    },
    LMSCommit() {
      const saved = request('POST', { revision, values });
      if (!saved) return 'false';
      revision = saved.revision;
      return 'true';
    },
    LMSFinish() { return 'true'; },
  };
})();
