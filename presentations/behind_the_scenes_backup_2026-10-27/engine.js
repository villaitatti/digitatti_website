/*
  digiTatti deck engine
  =====================
  Slides are <section class="slide"> inside #stage (a 1600 × 900 page scaled to the window).
  · data-at="n" on any element: revealed at step n (→ / space / click); data-steps="n" forces a count.
  · data-w="name" on a section: binds it to W.name = { init, enter, step(k), leave }.
  · <aside class="notes"> in each section: the script, shown in the presenter window (N).
  · data-title on a section: its name in the presenter window and the overview (G).
  Keys: → ↓ space PgDn next · ← ↑ PgUp back · Home / End · N presenter notes · G overview · F fullscreen.
*/
(function(){
  'use strict';
  var W = window.W = window.W || {};
  var $ = function(s, sel){ return s.querySelector(sel); };
  var $$ = function(s, sel){ return Array.prototype.slice.call(s.querySelectorAll(sel)); };
  window.later = function(s, fn, ms){ var t = setTimeout(fn, ms); (s._t = s._t || []).push(t); return t; };
  window.every = function(s, fn, ms){ var t = setInterval(fn, ms); (s._i = s._i || []).push(t); return t; };
  function clearTimers(s){ (s._t || []).forEach(clearTimeout); (s._i || []).forEach(clearInterval); s._t = []; s._i = []; }

  var stage = document.getElementById('stage');
  var slides = $$(document, '#stage > .slide');
  var i = -1, k = 0, t0 = null;

  /* ---------- scale the 1600 × 900 stage to the window ---------- */
  function fitStage(){
    var s = Math.min(innerWidth / 1600, innerHeight / 900);
    stage.style.transform = 'translate(' + ((innerWidth - 1600 * s) / 2) + 'px,' + ((innerHeight - 900 * s) / 2) + 'px) scale(' + s + ')';
    document.documentElement.style.setProperty('--s', s);
  }
  addEventListener('resize', fitStage); fitStage();

  /* ---------- numbers that count up ---------- */
  function countUp(s){
    $$(s, '[data-count]').forEach(function(e){
      var to = +e.dataset.count, a = null, fmt = function(v){ return Math.round(v).toLocaleString('en-US'); };
      e.textContent = fmt(0);
      (function f(t){
        if (!s.classList.contains('active')) return;
        if (t === undefined) return requestAnimationFrame(f);
        if (a === null) a = t;
        var p = Math.min(1, (t - a) / 1400);
        e.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(f);
      })();
    });
  }

  function maxStep(s){
    if (s._max != null) return s._max;
    var m = +(s.dataset.steps || 0);
    $$(s, '[data-at]').forEach(function(e){ m = Math.max(m, +e.dataset.at); });
    return (s._max = m);
  }
  function applyStep(s, kk){
    $$(s, '[data-at]').forEach(function(e){ e.classList.toggle('on', kk >= +e.dataset.at); e.classList.toggle('now', kk === +e.dataset.at); });
    s.dataset.k = kk;
    var w = W[s.dataset.w]; if (w && w.step) w.step(s, kk);
    notes.update();
    changed();
  }

  /* ---------- lazy media: data-src on img / video / iframe loads near its slide ---------- */
  function preload(s){
    if (!s || s._pre) return; s._pre = true;
    $$(s, '[data-src]').forEach(function(e){ if (e.tagName !== 'IFRAME') e.src = e.dataset.src; });
    if (window.liveOn) $$(s, '.bwin[data-autolive]').forEach(window.liveOn);   // start loading live demos a slide or two ahead
  }

  function go(n, atEnd){
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === i) return;
    if (i >= 0){
      var o = slides[i]; o.classList.remove('active'); clearTimers(o);
      $$(o, '.bwin.max').forEach(function(w){ w.classList.remove('max'); }); document.body.classList.remove('frame-max');
      $$(o, '.bwin:not([data-autolive]) .bview iframe').forEach(function(f){ f.remove(); });   // live demos keep their state
      $$(o, 'video').forEach(function(v){ v.pause(); });
      var wo = W[o.dataset.w]; if (wo && wo.leave) wo.leave(o);
    }
    i = n; var s = slides[i];
    preload(s); preload(slides[i + 1]); preload(slides[i + 2]);
    s.classList.add('active');
    k = atEnd ? maxStep(s) : 0;
    applyStep(s, k);
    $$(s, 'video[data-auto]').forEach(function(v){ try { v.currentTime = 0; } catch (e) {} var p = v.play(); if (p) p.catch(function(){}); });
    document.getElementById('bar').style.width = (i / Math.max(1, slides.length - 1) * 100) + '%';
    document.body.classList.toggle('on-dark', s.classList.contains('dark'));
    document.body.classList.toggle('on-title', i === 0);
    document.body.classList.toggle('on-demo', slides[i].classList.contains('demo'));
    document.getElementById('pn').textContent = (i + 1) + ' / ' + slides.length;
    history.replaceState(null, '', '#' + (i + 1)); lastHash = location.hash;
    countUp(s);
    var w = W[s.dataset.w]; if (w && w.enter) w.enter(s);
    notes.update();
  }
  // tell presenter mode (sync.js) about local moves; deck.set() moves without telling it
  var quiet = false, told = '';
  function changed(){
    var key = i + '.' + k;
    if (quiet || key === told || i < 0) return;
    told = key;
    if (window.deck && window.deck.onchange) window.deck.onchange(i, k);
  }
  function set(n, kk){
    quiet = true;
    try {
      if (n !== i) go(n);
      var s = slides[i]; kk = Math.max(0, Math.min(kk, maxStep(s)));
      if (kk !== k){ k = kk; applyStep(s, k); }
    } finally { quiet = false; told = i + '.' + k; }
  }
  function next(){ overview(false); var s = slides[i]; if (k < maxStep(s)){ k++; applyStep(s, k); } else go(i + 1); }
  function prev(){ overview(false); var s = slides[i]; if (k > 0){ k--; applyStep(s, k); } else go(i - 1, true); }
  window.deck = { next: next, prev: prev, go: function(n){ go(n); }, set: set, get i(){ return i; }, get k(){ return k; }, slides: slides, onchange: null };

  /* ---------- titles, for the presenter window and the overview ---------- */
  function titleOf(s){
    if (!s) return '—';
    if (s.dataset.title) return s.dataset.title;
    var h = $(s, 'h1, h2, h3'); return h ? h.textContent.replace(/\s+/g, ' ').trim() : 'Slide';
  }
  function sectionOf(s){ var r = $(s, '.run b'); return r ? r.textContent : ''; }

  /* ---------- presenter notes: a separate window that follows the slides ---------- */
  var notes = {
    w: null,
    open: function(){
      if (this.w && !this.w.closed){ this.w.focus(); return; }
      var w = window.open('', 'digitatti-notes', 'width=760,height=900,menubar=no,toolbar=no,location=no');
      if (!w){ toast('Allow pop-ups for this page to open the presenter notes (or press N again).'); return; }
      this.w = w;
      w.document.open();
      w.document.write(NOTES_HTML);
      w.document.close();
      w.addEventListener('keydown', function(e){ key(e); });
      $(w.document, '[data-a="prev"]').onclick = prev;
      $(w.document, '[data-a="next"]').onclick = next;
      $(w.document, '[data-a="reset"]').onclick = function(){ t0 = Date.now(); };
      $(w.document, '[data-a="minus"]').onclick = function(){ notes.size(-2); };
      $(w.document, '[data-a="plus"]').onclick = function(){ notes.size(2); };
      if (!t0) t0 = Date.now();
      if (!this.tick) this.tick = setInterval(function(){ notes.clock(); }, 1000);
      this.update();
    },
    size: function(d){
      var b = this.w.document.body, v = Math.max(14, Math.min(40, (parseFloat(getComputedStyle(b).getPropertyValue('--fs')) || 21) + d));
      b.style.setProperty('--fs', v + 'px');
      try { localStorage.setItem('dt-notes-fs', v); } catch (e) {}
    },
    clock: function(){
      if (!this.w || this.w.closed) return;
      var d = this.w.document, e = Math.floor((Date.now() - t0) / 1000);
      $(d, '#el').textContent = Math.floor(e / 60) + ':' + ('0' + e % 60).slice(-2);
      $(d, '#ck').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    update: function(){
      if (!this.w || this.w.closed || i < 0) return;
      var d = this.w.document, s = slides[i], n = $(s, '.notes'), m = maxStep(s);
      $(d, '#where').textContent = (i + 1) + ' / ' + slides.length + (sectionOf(s) ? ' · ' + sectionOf(s) : '');
      $(d, '#title').textContent = titleOf(s);
      $(d, '#step').textContent = m ? 'step ' + k + ' of ' + m + (k < m ? ' · → reveals more' : ' · → next slide') : '';
      $(d, '#text').innerHTML = n ? n.innerHTML : '<p class="none">No notes for this slide.</p>';
      $(d, '#next').textContent = slides[i + 1] ? titleOf(slides[i + 1]) : 'End';
      // highlight the paragraph that belongs to the current step: <p data-k="n">
      $$(d, '#text [data-k]').forEach(function(p){ p.classList.toggle('cur', +p.dataset.k === k); p.classList.toggle('past', +p.dataset.k < k); });
      var cur = $(d, '#text .cur'); if (cur) cur.scrollIntoView({ block: 'center', behavior: 'smooth' }); else $(d, '#text').scrollTop = 0;
      this.clock();
    }
  };
  var NOTES_HTML = '<!doctype html><html><head><meta charset="utf-8"><title>Presenter notes · digiTatti</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">'
    + '<style>:root{color-scheme:dark}body{--fs:' + (function(){ try { return localStorage.getItem('dt-notes-fs') || 21; } catch (e) { return 21; } })() + 'px;margin:0;height:100vh;display:flex;flex-direction:column;background:#141414;color:#eee;font-family:Inter,system-ui,sans-serif}'
    + 'header{display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid #333;font-family:"IBM Plex Mono",monospace;font-size:13px;color:#999;flex-wrap:nowrap}'
    + 'header button{flex:none}header .nav{font-size:18px;padding:6px 16px}'
    + '#el{color:#fff;font-size:20px;min-width:4.2ch;text-align:right;font-variant-numeric:tabular-nums;flex:none}'
    + '#where{color:#d6324a;text-transform:uppercase;letter-spacing:.05em;flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-left:6px}#ck{flex:none;font-variant-numeric:tabular-nums}'
    + 'button{background:#262626;color:#eee;border:1px solid #444;font:inherit;padding:5px 11px;cursor:pointer;border-radius:3px}button:hover{background:#333}'
    + 'h1{font-size:calc(var(--fs) * 1.15);margin:16px 20px 2px;font-weight:600;line-height:1.25}#step{margin:0 20px 6px;font-family:"IBM Plex Mono",monospace;font-size:13px;color:#d6324a}'
    + '#text{flex:1;overflow:auto;padding:4px 20px 30px;font-size:var(--fs);line-height:1.55}#text p{margin:0 0 .75em;transition:opacity .3s}#text p[data-k].past{opacity:.45}#text p[data-k].cur{border-left:3px solid #d6324a;padding-left:12px;margin-left:-15px}'
    + '#text b,#text strong{color:#fff}#text em{color:#f0c9cf;font-style:normal}#text .cue{display:block;font-family:"IBM Plex Mono",monospace;font-size:.7em;color:#d6324a;text-transform:uppercase;letter-spacing:.04em;margin:.4em 0}#text .none{color:#777}'
    + 'footer{border-top:1px solid #333;padding:10px 18px;font-size:14px;color:#999;font-family:"IBM Plex Mono",monospace}footer span{color:#eee;font-family:Inter,sans-serif;font-size:16px}</style></head>'
    + '<body><header><button class="nav" data-a="prev" title="back (←)">◀</button><button class="nav" data-a="next" title="next (→)">▶</button><span id="el">0:00</span><button data-a="reset" title="restart the timer">↺</button><button data-a="minus">A−</button><button data-a="plus">A+</button><span id="where"></span><span id="ck"></span></header>'
    + '<h1 id="title"></h1><div id="step"></div><div id="text"></div><footer>next · <span id="next"></span></footer></body></html>';
  addEventListener('beforeunload', function(){ if (notes.w && !notes.w.closed) notes.w.close(); });

  /* ---------- overview: every slide by title, click to jump ---------- */
  var ov = document.getElementById('overview');
  function overview(show){
    if (show === undefined) show = !ov.classList.contains('open');
    if (show){
      var last = '';
      ov.innerHTML = '<div class="ov-in">' + slides.map(function(s, j){
        var sec = sectionOf(s), head = sec && sec !== last ? '<h4>' + sec + '</h4>' : ''; last = sec || last;
        return head + '<button data-j="' + j + '"' + (j === i ? ' class="cur"' : '') + '><span>' + (j + 1) + '</span>' + titleOf(s) + '</button>';
      }).join('') + '</div>';
      $$(ov, 'button').forEach(function(b){ b.onclick = function(){ overview(false); go(+b.dataset.j); }; });
    }
    ov.classList.toggle('open', show);
  }

  function toast(t){ var e = document.getElementById('toast'); e.textContent = t; e.classList.add('on'); setTimeout(function(){ e.classList.remove('on'); }, 4000); }

  /* ---------- input ---------- */
  function key(e){
    if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
    var c = e.key;
    if (c === 'ArrowRight' || c === 'ArrowDown' || c === ' ' || c === 'PageDown'){ e.preventDefault(); next(); }
    else if (c === 'ArrowLeft' || c === 'ArrowUp' || c === 'PageUp'){ e.preventDefault(); prev(); }
    else if (c === 'Home') go(0);
    else if (c === 'End') go(slides.length - 1);
    else if (c === 'n' || c === 'N' || c === 's' || c === 'S') notes.open();
    else if (c === 'g' || c === 'G' || c === 'o' || c === 'O') overview();
    else if (c === 'Escape'){ overview(false); var m = document.querySelector('.bwin.max'); if (m) m.classList.remove('max'); document.body.classList.remove('frame-max'); }
    else if (c === 'f' || c === 'F'){ if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function(){}); else document.exitFullscreen(); }
  }
  addEventListener('keydown', key);
  stage.addEventListener('click', function(e){
    if (e.target.closest('a, button, input, label, select, video, iframe, .live, .ia, .sw, .bwin, .rls')) return;
    if (e.clientX < innerWidth * 0.18) prev(); else next();
  });
  var tx = null;
  addEventListener('touchstart', function(e){ tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', function(e){ if (tx === null) return; var d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) (d < 0 ? next : prev)(); tx = null; });
  document.getElementById('nb').onclick = function(){ notes.open(); };
  document.getElementById('gb').onclick = function(){ overview(); };

  slides.forEach(function(s){ var w = W[s.dataset.w]; if (w && w.init) w.init(s); });
  // the hash changed by hand (or by a link): follow it
  var lastHash = '';
  addEventListener('hashchange', function(){ if (location.hash === lastHash) return; var n = parseInt(location.hash.slice(1), 10); if (n) go(n - 1); });
  // #12 opens slide 12; #12.3 opens it at step 3
  var h = location.hash.slice(1).split('.');
  go(Math.max(0, (parseInt(h[0], 10) || 1) - 1));
  for (var j = 0, n = parseInt(h[1], 10) || 0; j < n; j++) next();
})();
