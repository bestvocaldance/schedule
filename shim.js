// BVD 스케줄 — 빠른 서버 연결
// 기존 화면 코드는 그대로 두고, 구글 Apps Script 에 묻던 부분(google.script.run)을
// Supabase 빠른 서버(schedule-fast)로 보내도록 바꿔 주는 작은 파일입니다.
(function () {
  var API = 'https://vchztldfletlvrvhsgtv.supabase.co/functions/v1/schedule-fast';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjaHp0bGRmbGV0bHZydmhzZ3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3ODU0MzIsImV4cCI6MjEwOTM2MTQzMn0.psF30JqpjQtRFsQJrZwm_alY6AlnT78U0vZBdBk6HfY';

  // 예전 게스트 링크(주소?token=...)로 들어오면 게스트 화면으로 보냅니다.
  try {
    var qs = new URLSearchParams(location.search);
    if (qs.get('token') && !/guest\.html$/.test(location.pathname)) {
      location.replace('guest.html?token=' + encodeURIComponent(qs.get('token')));
    }
  } catch (e) {}

  function call(fn, args, ok, fail) {
    var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 60000);
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8', 'Authorization': 'Bearer ' + ANON, 'apikey': ANON },
      body: JSON.stringify({ fn: fn, args: args }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(timer);
      if (j && j.ok) { if (ok) ok(j.result); }
      else { if (fail) fail(new Error((j && j.error) || 'SERVER_ERROR')); }
    }, function (e) {
      clearTimeout(timer);
      if (fail) fail(new Error('NETWORK_ERROR: 인터넷 연결을 확인해 주세요.'));
    });
  }

  function runner(ok, fail) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === 'withSuccessHandler') return function (f) { return runner(f, fail); };
        if (name === 'withFailureHandler') return function (f) { return runner(ok, f); };
        if (name === 'withUserObject') return function () { return runner(ok, fail); };
        return function () { call(String(name), Array.prototype.slice.call(arguments), ok, fail); };
      }
    });
  }

  window.google = window.google || {};
  window.google.script = { run: runner(null, null), host: { close: function () {}, setHeight: function () {}, setWidth: function () {} } };
})();
