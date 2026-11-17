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

  // ===== 화면 보기 선택 (PC 화면 / 모바일 화면) =====
  // 폰에서만 오른쪽 아래에 전환 버튼이 보입니다. 기본은 예전과 같은 PC 화면입니다.
  // 선택은 그 폰(브라우저)에 저장되어 다음에 열어도 그대로 유지됩니다.
  var VIEW_KEY = 'bvd_sched_view';
  var PC_VIEWPORT = 'width=980';
  var MOBILE_VIEWPORT = 'width=device-width, initial-scale=1.0, user-scalable=no';
  var isPhone = Math.min(screen.width || 9999, screen.height || 9999) <= 820;
  function getView() { try { return localStorage.getItem(VIEW_KEY) || 'pc'; } catch (e) { return 'pc'; } }
  function setView(v) { try { localStorage.setItem(VIEW_KEY, v); } catch (e) {} }
  var view = isPhone ? getView() : 'mobile';
  function applyViewport(meta) {
    if (!meta || !isPhone) return;
    var want = view === 'pc' ? PC_VIEWPORT : MOBILE_VIEWPORT;
    if (meta.getAttribute('content') !== want) meta.setAttribute('content', want);
  }
  if (isPhone && view === 'pc') {
    try {
      var mo = new MutationObserver(function () {
        var m = document.querySelector('meta[name="viewport"]');
        if (m) { applyViewport(m); mo.disconnect(); }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }
  document.addEventListener('DOMContentLoaded', function () {
    applyViewport(document.querySelector('meta[name="viewport"]'));
    if (!isPhone) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = view === 'pc' ? '📱 모바일 화면으로' : '🖥 PC 화면으로';
    b.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:99999;padding:' + (view === 'pc' ? '14px 22px' : '8px 12px') +
      ';font-size:' + (view === 'pc' ? '26px' : '13px') + ';font-weight:700;border:none;border-radius:999px;background:rgba(17,17,17,0.82);color:#fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
    b.onclick = function () { setView(view === 'pc' ? 'mobile' : 'pc'); location.reload(); };
    document.body.appendChild(b);
  });
})();
