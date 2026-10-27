/* Slide widgets for the digiTatti deck: each W.name binds to <section data-w="name">.
   Loaded before engine.js, which calls init / enter / step / leave. */
(function(){
  'use strict';
  var W = window.W = window.W || {};
  var $ = function(s, sel){ return s.querySelector(sel); };
  var $$ = function(s, sel){ return Array.prototype.slice.call(s.querySelectorAll(sel)); };

  // --- the life of a building: plays by itself when the slide opens; → then zooms out to the lagoon
  W.life = {
    BEATS: [1500, 1504, 1608, 1820, 2023],
    enter: function(s){
      var self = this;
      if (+s.dataset.k > 0){ this.show(s, this.BEATS.length - 1, true); return; }
      this.show(s, -1);
      this.BEATS.forEach(function(y, j){ later(s, function(){ self.show(s, j); }, 600 + j * 2600); });
    },
    // → before the end: skip to the last beat, then the zoom (data-at=1) takes over
    step: function(s, k){ if (k >= 1){ clearAll(s); this.show(s, this.BEATS.length - 1, true); } },
    show: function(s, j, instant){
      var lf = $(s, '.life');
      lf.dataset.b = j;
      $$(s, '.lf-doc').forEach(function(d, m){ d.classList.toggle('in', m <= j); d.classList.toggle('cur', m === j); });
      $$(s, '.lf-tick').forEach(function(d, m){ d.classList.toggle('in', m <= j); });
      var y = j < 0 ? null : this.BEATS[j], el = $(s, '.lf-year');
      if (y === null){ el.textContent = ''; return; }
      if (instant){ el.textContent = j === this.BEATS.length - 1 ? 'today' : y; return; }
      var from = j > 0 ? this.BEATS[j - 1] : 1490, to = y, a = null, last = j === this.BEATS.length - 1;
      (function f(t){
        if (t === undefined) return requestAnimationFrame(f);
        if (a === null) a = t;
        var p = Math.min(1, (t - a) / 900);
        el.textContent = last && p === 1 ? 'today' : Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1 && s.classList.contains('active')) requestAnimationFrame(f);
      })();
    },
    init: function(s){
      // survey points over what remains, for the last beat
      var g = $(s, '.lf-scan'), seed = 7, h = '';
      function rnd(){ seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }
      for (var n = 0; n < 140; n++){ var x = 200 + rnd() * 310, y = 112 + rnd() * 136; if (x < 300 && y < 196) continue; h += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.2"/>'; }
      g.innerHTML = h;
      var self = this, b = $(s, '[data-replay]'); if (b) b.onclick = function(e){ e.stopPropagation(); clearAll(s); self.enter(s); }; }
  };
  function clearAll(s){ (s._t || []).forEach(clearTimeout); s._t = []; }

  // --- a caption that follows the steps
  W.say = {
    step: function(s, k){
      var cur = null, xs = $$(s, '.say [data-k]');
      xs.forEach(function(x){ if (+x.dataset.k <= k) cur = x; });
      xs.forEach(function(x){ x.hidden = x !== cur; });
    }
  };

  // --- feature reel: each button plays its clip; when a clip ends the next one starts
  W.reel = {
    init: function(s){
      var self = this, v = $(s, '.reel-v'), bs = $$(s, '.rl');
      bs.forEach(function(b, j){ b.addEventListener('click', function(e){ e.stopPropagation(); self.play(s, j); }); });
      v.addEventListener('ended', function(){ if (s.classList.contains('active')) self.play(s, (s._r + 1) % bs.length); });
      v.addEventListener('timeupdate', function(){ if (v.duration && bs[s._r]) $(bs[s._r], 'i').style.width = (v.currentTime / v.duration * 100) + '%'; });
    },
    play: function(s, j){
      var bs = $$(s, '.rl'), v = $(s, '.reel-v');
      s._r = j;
      bs.forEach(function(b, m){ b.classList.toggle('on', m === j); $(b, 'i').style.width = 0; });
      v.poster = bs[j].dataset.v.replace('video/', 'video/posters/').replace('.mp4', '.jpg');
      v.src = bs[j].dataset.v;
      var p = v.play(); if (p) p.catch(function(){});
      var n = $(s, '.rl-name'); if (n) n.textContent = bs[j].dataset.name;
    },
    enter: function(s){ this.play(s, 0); },
    leave: function(s){ $(s, '.reel-v').pause(); }
  };

  // --- paired bars: rows .bp with data-a / data-b, on one scale
  W.bars = {
    init: function(s){
      var self = this;
      s._set = ($(s, '.bps') || {}).dataset ? $(s, '.bps').dataset.set : null;
      $$(s, 'button[data-set]').forEach(function(b){ b.addEventListener('click', function(e){
        e.stopPropagation(); s._set = b.dataset.set;
        $$(s, 'button[data-set]').forEach(function(x){ x.classList.toggle('on', x === b); });
        self.draw(s);
      }); });
    },
    draw: function(s, zero){
      $$(s, '.bps').forEach(function(g){ g.hidden = g.dataset.set !== s._set; });
      var rows = $$(s, '.bps[data-set="' + s._set + '"] .bp'), max = 0;
      rows.forEach(function(r){ max = Math.max(max, +r.dataset.a, +r.dataset.b); });
      rows.forEach(function(r){
        var a = +r.dataset.a, b = +r.dataset.b;
        $(r, '.fa').style.width = (zero ? 0 : a / max * 100) + '%';
        $(r, '.fb').style.width = (zero ? 0 : b / max * 100) + '%';
        $(r, '.va').textContent = zero ? '' : a.toLocaleString('en-US');
        $(r, '.vb').textContent = zero ? '' : b.toLocaleString('en-US');
      });
    },
    // data-bars-at="n" on the section: the bars grow at step n instead of on arrival
    enter: function(s){ var self = this, at = +(s.dataset.barsAt || 0); this.draw(s, true); if (!at || +s.dataset.k >= at) later(s, function(){ self.draw(s); }, 350); },
    step: function(s, k){ var at = +(s.dataset.barsAt || 0); if (at) this.draw(s, k < at); }
  };

  // --- then / now: drag to swipe, or a spyglass that follows the pointer
  W.swipe = {
    init: function(s){
      var self = this, box = $(s, '.sw'), drag = false;
      function pos(e){ var r = box.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100]; }
      box.addEventListener('pointerdown', function(e){ drag = true; s._auto = false; box.setPointerCapture(e.pointerId); self.at(s, pos(e)); });
      box.addEventListener('pointermove', function(e){ if (drag || box.classList.contains('spy')){ s._auto = false; self.at(s, pos(e)); } });
      box.addEventListener('pointerup', function(){ drag = false; });
      $$(s, 'button[data-then]').forEach(function(b){ b.addEventListener('click', function(e){
        e.stopPropagation();
        $$(s, 'button[data-then]').forEach(function(x){ x.classList.toggle('on', x === b); });
        $(box, '.then').src = b.dataset.then; $(box, '.now').src = b.dataset.now;
        $$(s, '.sw-note').forEach(function(n){ n.hidden = n.dataset.for !== b.dataset.then; });
      }); });
      $$(s, 'button[data-lens]').forEach(function(b){ b.addEventListener('click', function(e){
        e.stopPropagation();
        $$(s, 'button[data-lens]').forEach(function(x){ x.classList.toggle('on', x === b); });
        box.classList.toggle('spy', b.dataset.lens === 'spyglass');
      }); });
    },
    at: function(s, p){
      var box = $(s, '.sw');
      box.style.setProperty('--x', Math.max(0, Math.min(100, p[0])).toFixed(2) + '%');
      box.style.setProperty('--y', Math.max(0, Math.min(100, p[1])).toFixed(2) + '%');
    },
    enter: function(s){
      var self = this, t0 = null;
      s._auto = true;
      (function f(t){
        if (!s._auto || !s.classList.contains('active')) return;
        if (t === undefined) return requestAnimationFrame(f);
        if (t0 === null) t0 = t;
        var p = (t - t0) / 3200;
        if (p >= 1) return self.at(s, [50, 50]);
        self.at(s, [50 + 34 * Math.sin(p * Math.PI * 2), 50]);
        requestAnimationFrame(f);
      })();
    }
  };

  // --- live sites that load by themselves (data-autolive): when their slide opens, or just before
  window.liveOn = function(w){
    var v = $(w, '.bview'), b = $(w, '[data-act="live"]');
    if ($(v, 'iframe')) return;
    var f = document.createElement('iframe');
    f.src = w.dataset.live; f.title = 'live site'; f.setAttribute('allow', 'fullscreen; clipboard-read; clipboard-write');
    v.appendChild(f); if (b){ b.classList.add('on'); b.textContent = 'picture'; }
  };
  W.live = { enter: function(s){ $$(s, '.bwin[data-autolive]').forEach(window.liveOn); } };

  // --- browser frames: a screenshot that turns into the live site; ⤢ fills the screen
  document.addEventListener('DOMContentLoaded', function(){
    $$(document, '.bwin').forEach(function(w){
      var live = $(w, '[data-act="live"]'), max = $(w, '[data-act="max"]'), v = $(w, '.bview');
      if (live) live.addEventListener('click', function(e){
        e.stopPropagation();
        var f = $(v, 'iframe');
        if (f){ f.remove(); live.classList.remove('on'); live.textContent = 'live'; return; }
        f = document.createElement('iframe');
        f.src = w.dataset.live; f.title = 'live site'; f.setAttribute('allow', 'fullscreen; clipboard-read; clipboard-write');
        v.appendChild(f); live.classList.add('on'); live.textContent = 'picture';
      });
      if (max) max.addEventListener('click', function(e){ e.stopPropagation(); document.body.classList.toggle('frame-max', w.classList.toggle('max')); });
    });
  });
})();
