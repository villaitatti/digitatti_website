/*
  Presenter mode: several presenters, in different places, drive the same slides.
  Toggle with P or the "present" button. The first time, it asks for the presenter code (kept in this browser).
  While on, every slide or step change made here is sent to the others, and changes made by any other presenter
  are followed here. Off, the deck is a normal local presentation again.
  Needs the relay at /sync/ (publish/sync/server.mjs), so it works on the published site, not from a file.
*/
(function(){
  'use strict';
  var BASE = /^https?:$/.test(location.protocol) ? '/sync' : 'https://digitatti.itatti.net/sync';
  var me = 'p' + Math.random().toString(36).slice(2, 8);
  var es = null, on = false, lastSeq = -1, code = '';
  var btn = document.getElementById('pb'), badge = document.getElementById('live');

  function store(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function show(text, state){ badge.textContent = text; badge.dataset.state = state || ''; badge.hidden = !on; }

  function send(i, k){
    if (!on) return;
    fetch(BASE + '/state', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ i: i, k: k, from: me, code: code }) })
      .then(function(r){ if (r.status === 403){ store('dt-code', null); stop(); alert('The presenter code is no longer valid. Press P to enter it again.'); } })
      .catch(function(){ show('● offline: retrying', 'off'); });
  }

  function listen(){
    es = new EventSource(BASE + '/events');
    es.onopen = function(){ show('● presenting', 'on'); };
    es.onerror = function(){ show('● reconnecting…', 'off'); };
    es.onmessage = function(e){
      var m; try { m = JSON.parse(e.data); } catch (x) { return; }
      show('● presenting · ' + m.n + (m.n === 1 ? ' screen' : ' screens'), 'on');
      if (m.seq <= lastSeq) return;
      var first = lastSeq < 0; lastSeq = m.seq;
      if (m.from === me) return;
      if (first && m.seq === 0) { send(window.deck.i, window.deck.k); return; }   // a fresh relay: start from where we are
      window.deck.set(m.i, m.k);
    };
  }

  function start(){
    var c = store('dt-code') || prompt('Presenter code:');
    if (!c) return;
    fetch(BASE + '/check?code=' + encodeURIComponent(c), { cache: 'no-store' }).then(function(r){
      if (!r.ok){ store('dt-code', null); alert('That presenter code is not right.'); return; }
      code = c; store('dt-code', c); on = true; lastSeq = -1;
      document.body.classList.add('presenting'); btn.classList.add('on'); btn.textContent = 'presenting';
      store('dt-present', '1');
      show('● connecting…', 'off');
      listen();
    }).catch(function(){ alert('Presenter mode needs the published site (digitatti.itatti.net) and a connection.'); });
  }
  function stop(){
    on = false; if (es) es.close(); es = null;
    document.body.classList.remove('presenting'); btn.classList.remove('on'); btn.textContent = 'present';
    store('dt-present', null);
    badge.hidden = true;
  }
  function toggle(){ if (on) stop(); else start(); }

  window.deck.onchange = function(i, k){ send(i, k); };
  btn.onclick = toggle;
  addEventListener('keydown', function(e){
    if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
    if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey && !e.altKey) toggle();
  });
  // reloading the page keeps presenter mode on
  if (store('dt-present') === '1' && store('dt-code')) start();
})();
