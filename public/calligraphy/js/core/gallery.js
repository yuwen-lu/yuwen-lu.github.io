// Gallery: mounts a painting spec into a card as its own p5 instance and wires
// its player: play / pause, a step at a time (one op: a stroke, a wash, a
// motif), a group at a time (a character), a timeline to scrub, restart,
// finish, a new variation, and saving the picture. The toolbar's controls
// apply to every card.
//
// Going back is exact and quick: the card in use keeps snapshots of its
// canvas (and the random generator's state) at op boundaries, restores the
// nearest one before the target and replays from there.
window.Gallery = (() => {
  const state = { playing: true, loop: true, speed: 1, sketches: [] };
  const listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function emit() { for (const fn of listeners) fn(state); }
  function setPlaying(v) { state.playing = !!v; for (const h of state.sketches) if (!h.spec.solo) h.localPlaying = state.playing; emit(); }
  function setLoop(v) { state.loop = !!v; emit(); }
  function setSpeed(v) { state.speed = v; emit(); }

  // only the card in use keeps snapshots
  let active = null;
  function activate(h) { if (active && active !== h && active.dropSnaps) active.dropSnaps(); active = h; }

  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      const h = e.target.__handle; if (!h) continue;
      h.visible = e.isIntersecting;
      if (h.p) { if (h.visible) h.p.loop(); else h.p.noLoop(); }
    }
  }, { rootMargin: '200px' }) : null;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const I = (name) => UI.icon(name);

  // spec: { id, W, H, seed, build(env) -> ops[], paper(p, W, H, rng) -> p5.Graphics,
  //         unitsPerSecond, cursor: 'ink'|'crayon', blend: 'multiply'|'source-over',
  //         underlay(dc, W, H)   drawn under the painting when handle.showUnderlay,
  //         guide(dc, mode)      drawn over it (multiply) when handle.guide is set,
  //         overlay(dc, info)    hints drawn on top while paused or hovered,
  //         hitTest(x, y)        → a group (character) under the pointer, or null,
  //         describe(info)       → the status line (HTML), default: the op's label,
  //         groupName            what a group is called ('character'), if ops have groups }
  function mount(card, spec) {
    const handle = { spec, seed: spec.seed, localPlaying: state.playing, visible: true, p: null, player: null, card, guide: null, showUnderlay: false, filter: '' };
    card.__handle = handle;
    const wrap = card.querySelector('.canvas-wrap');
    const host = card.querySelector('.controls') || document.createElement('div');
    const grouped = !!spec.groupName;
    const stepName = spec.stepName || (grouped ? 'stroke' : null);
    host.classList.add('player');
    host.innerHTML = `
      <div class="player__row">
        <div class="player__transport">
          ${grouped ? UI.iconButton({ icon: 'chevron-first', label: `Previous ${spec.groupName}`, kbd: '⇧ ←', cls: 'prev-group' }) : ''}
          ${UI.iconButton({ icon: 'step-back', label: stepName ? `Previous ${stepName}` : 'Step back', kbd: '←', cls: 'prev-step' })}
          ${UI.iconButton({ icon: 'pause', label: 'Pause', kbd: 'Space', variant: 'primary', cls: 'play' })}
          ${UI.iconButton({ icon: 'step-forward', label: stepName ? `Next ${stepName}` : 'Step forward', kbd: '→', cls: 'next-step' })}
          ${grouped ? UI.iconButton({ icon: 'chevron-last', label: `Next ${spec.groupName}`, kbd: '⇧ →', cls: 'next-group' }) : ''}
        </div>
        <input type="range" class="slider scrub" min="0" max="1000" step="1" value="0" aria-label="Position in the painting">
      </div>
      <div class="player__row player__row--meta">
        <span class="player__status" aria-live="polite"></span>
        <span class="player__actions">
          ${UI.iconButton({ icon: 'rotate', label: 'Start over', kbd: 'Home', cls: 'restart' })}
          ${UI.iconButton({ icon: 'fast-forward', label: 'Finish now', kbd: 'End', cls: 'finish' })}
          ${spec.vary === false ? '' : UI.iconButton({ icon: 'shuffle', label: 'New variation (new random seed)', cls: 'vary' })}
          ${spec.save === false ? '' : UI.iconButton({ icon: 'download', label: 'Save as PNG', cls: 'save' })}
        </span>
      </div>`;
    const $ = (sel) => host.querySelector(sel);
    const playBtn = $('.play'), scrub = $('.scrub'), status = $('.player__status');
    let scrubbing = false, pendingSeek = null, lastStatus = '';

    const sketch = (p) => {
      let pg, paper, rng, env, ops;
      const player = new StrokePlayer({
        unitsPerSecond: spec.unitsPerSecond || 900,
        holdAtEnd: spec.holdAtEnd ?? 2400,
        onRestart: () => reset(spec.nextSeed ? spec.nextSeed(handle.seed) : handle.seed),
      });
      handle.player = player;

      // ---- snapshots --------------------------------------------------------------
      const snaps = new Map(), pool = [];
      const every = () => Math.max(6, Math.ceil(ops.length / 12));
      function snap() {
        if (active !== handle || player.gen || snaps.has(player.idx)) return;
        const c = pool.pop() || document.createElement('canvas');
        c.width = spec.W; c.height = spec.H;
        c.getContext('2d').drawImage(pg.elt, 0, 0);
        snaps.set(player.idx, { c, rng: rng.state, units: player.unitsDone, label: player.label });
      }
      handle.dropSnaps = () => { for (const s of snaps.values()) { s.c.width = s.c.height = 1; pool.push(s.c); } snaps.clear(); };
      function restore(i) {
        const s = snaps.get(i), ctx = pg.drawingContext;
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'copy';
        ctx.drawImage(s.c, 0, 0); ctx.restore();
        if (env.brush && env.brush.resetState) env.brush.resetState();
        rng.state = s.rng;
        player.idx = i; player.gen = null; player.done = false; player.cursor = null;
        player.unitsDone = s.units; player.label = s.label;
      }
      // run forward to op index `to`, leaving snapshots along the way
      function runTo(to) {
        if (player.gen) player.runOp();
        while (!player.done && player.idx < to) { player.runOp(); if (player.idx % every() === 0) snap(); }
      }

      function reset(seed) {
        if (seed !== handle.seed) handle.dropSnaps();
        handle.seed = seed;
        rng = new RNG.Rng(seed);
        p.noiseSeed(seed);
        if (env && env.brush && env.brush.resetState) env.brush.resetState();
        const ctx = pg.drawingContext;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, spec.W, spec.H);
        ctx.drawImage(paper.elt, 0, 0);
        ctx.globalCompositeOperation = spec.blend || 'multiply';
        env = { p, g: pg, rng, W: spec.W, H: spec.H, seed };
        ops = spec.build(env);
        player.load(ops);
        handle.ops = ops;
        snap();
        p.redraw();
      }
      handle.reset = reset;

      // go to the boundary after `target` ops
      function seekOp(target) {
        activate(handle);
        target = clamp(Math.round(target), 0, ops.length);
        const here = player.gen ? -1 : (player.done ? ops.length : player.idx);
        if (here >= 0 && target >= here) { runTo(target); }
        else if (player.gen && target > player.idx) { runTo(target); }
        else {
          let best = -1; for (const k of snaps.keys()) if (k <= target && k > best) best = k;
          if (best < 0) { reset(handle.seed); best = 0; } else restore(best);
          runTo(target);
        }
        if (target >= ops.length) player.finishUp();
        p.redraw();
      }
      handle.seekOp = seekOp;
      handle.finish = () => { activate(handle); runTo(ops.length); player.finishUp(); p.redraw(); };
      handle.restart = () => { seekOp(0); player.startedAt = performance.now(); };

      // ---- stepping -----------------------------------------------------------------
      const pause = () => { handle.localPlaying = false; };
      handle.step = (d) => {
        pause(); activate(handle);
        if (d > 0) { if (player.done) return; player.stepForward(); if (player.done) player.finishUp(); snapMaybe(); p.redraw(); }
        else if (!player.done || ops.length) seekOp(player.done ? lastStepStart() : player.prevStepBoundary());
      };
      function snapMaybe() { if (!player.gen && player.idx % every() === 0) snap(); }
      // the start of the last step op (going back from the end)
      function lastStepStart() { let i = ops.length - 1; while (i > 0 && !player.isStep(i)) i--; return i; }
      // groups: the op indices where each group starts
      const groupOf = (i) => (ops[i] ? ops[i].group : undefined);
      function groupStart(g) { for (let i = 0; i < ops.length; i++) if (ops[i].group === g) return i; return 0; }
      function groupEnd(g) { let last = -1; for (let i = 0; i < ops.length; i++) if (ops[i].group === g) last = i; return last + 1; }
      // the group being written or about to be
      function focusGroup() {
        if (!ops.length) return undefined;
        if (player.gen) return groupOf(player.idx);
        if (player.done || player.idx >= ops.length) return groupOf(ops.length - 1);
        let i = player.idx; while (i < ops.length - 1 && !player.isStep(i)) i++;
        return groupOf(i);
      }
      handle.stepGroup = (d) => {
        pause(); activate(handle);
        const g = focusGroup(); if (g === undefined) return;
        if (d > 0) {
          const end = groupEnd(g);
          seekOp(player.done ? ops.length : (player.idx >= end && !player.gen ? groupEnd(groupOf(end)) : end));
        } else {
          const start = groupStart(g);
          const atStart = !player.gen && player.idx <= start;
          seekOp(atStart && start > 0 ? groupStart(groupOf(start - 1)) : start);
        }
      };
      handle.goToGroup = (g) => { pause(); seekOp(groupStart(g)); };
      // what the status line and the overlay need to know
      function info() {
        const g = grouped ? focusGroup() : undefined;
        let done = 0, total = 0, next = -1;
        if (g !== undefined) {
          for (let i = 0; i < ops.length; i++) {
            if (ops[i].group !== g || !player.isStep(i)) continue;
            total++;
            if (i < player.idx || (player.done)) done++;
            else if (next < 0 && !(player.gen && i === player.idx)) next = i;
          }
        } else if (!player.done) {
          let i = player.idx + (player.gen ? 1 : 0); while (i < ops.length && !player.isStep(i)) i++; next = i < ops.length ? i : -1;
        }
        return { ops, idx: player.idx, inOp: !!player.gen, done: player.done, playing: player.playing, group: g, groupDone: done, groupTotal: total, next, hover: handle.hover, label: player.label, op: ops[Math.min(player.idx, ops.length - 1)] };
      }
      handle.info = info;

      // ---- drawing ------------------------------------------------------------------
      let frame = 0;
      p.setup = () => {
        p.pixelDensity(1);
        const c = p.createCanvas(spec.W, spec.H);
        c.parent(wrap);
        c.elt.setAttribute('role', 'img'); c.elt.setAttribute('aria-label', spec.alt || 'painting');
        p.frameRate(60);
        pg = p.createGraphics(spec.W, spec.H); pg.pixelDensity(1);
        paper = spec.paper(p, spec.W, spec.H, new RNG.Rng(spec.seed ^ 0x9e3779b9));
        reset(spec.seed);
      };
      p.draw = () => {
        if (pendingSeek != null) { const t = pendingSeek; pendingSeek = null; seekOp(t); }
        player.playing = handle.localPlaying && !scrubbing;
        player.loop = state.loop;
        player.speed = state.speed * (spec.speedScale || 1);
        const before = player.idx;
        player.advance(Math.min(p.deltaTime || 16, 100));
        if (player.idx !== before && !player.gen && player.idx % every() === 0) snap();
        const dc = p.drawingContext;
        dc.save();
        if (handle.filter) dc.filter = handle.filter;
        if (spec.underlay && handle.showUnderlay) {
          // the scan of the original under the writing: paper and ink multiply onto it
          dc.fillStyle = '#fff'; dc.fillRect(0, 0, spec.W, spec.H);
          spec.underlay(dc, spec.W, spec.H);
          dc.globalCompositeOperation = 'multiply';
          dc.drawImage(pg.elt, 0, 0);
        } else {
          dc.globalCompositeOperation = 'copy';
          dc.drawImage(pg.elt, 0, 0);
        }
        dc.restore();
        if (spec.guide && handle.guide) { dc.save(); dc.globalCompositeOperation = handle.filter ? 'screen' : 'multiply'; spec.guide(dc, handle.guide); dc.restore(); }
        const inf = (spec.overlay || grouped) ? info() : null;
        if (spec.overlay) { dc.save(); spec.overlay(dc, inf); dc.restore(); }
        const c = player.cursor;
        if (c && player.playing && !player.done) drawCursor(p, c, spec.cursor || 'ink');
        if ((frame++ % 3) === 0 || !player.playing) {
          if (!scrubbing) { scrub.value = Math.round(player.progress * 1000); UI.paintRange(scrub); }
          const st = spec.describe ? spec.describe(inf || info()) : UI.esc(player.done ? 'Finished' : player.label);
          if (st !== lastStatus) { status.innerHTML = st; lastStatus = st; }
        }
        const playing = player.playing && !player.done;
        if (playBtn.__on !== playing) {
          playBtn.__on = playing;
          playBtn.innerHTML = UI.icon(playing ? 'pause' : 'play');
          playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play'); playBtn.setAttribute('data-tip', playing ? 'Pause' : 'Play');
        }
      };
    };

    // ---- wiring -----------------------------------------------------------------------
    const togglePlay = () => {
      activate(handle);
      const pl = handle.player;
      if (pl.done) { handle.reset(handle.seed); handle.localPlaying = true; return; }
      handle.localPlaying = !(handle.localPlaying && pl.playing);
    };
    playBtn.addEventListener('click', togglePlay);
    $('.prev-step').addEventListener('click', () => handle.step(-1));
    $('.next-step').addEventListener('click', () => handle.step(1));
    if (grouped) { $('.prev-group').addEventListener('click', () => handle.stepGroup(-1)); $('.next-group').addEventListener('click', () => handle.stepGroup(1)); }
    $('.restart').addEventListener('click', () => { handle.restart(); handle.localPlaying = true; });
    $('.finish').addEventListener('click', () => handle.finish());
    if ($('.vary')) $('.vary').addEventListener('click', () => { handle.reset(RNG.randomSeed()); handle.localPlaying = true; });
    if ($('.save')) $('.save').addEventListener('click', () => save(handle));
    scrub.addEventListener('pointerdown', () => { scrubbing = true; activate(handle); });
    const endScrub = () => { scrubbing = false; };
    scrub.addEventListener('pointerup', endScrub); scrub.addEventListener('pointercancel', endScrub); scrub.addEventListener('blur', endScrub);
    scrub.addEventListener('input', () => {
      UI.paintRange(scrub); handle.localPlaying = false;
      const pl = handle.player; if (!pl || !handle.ops) return;
      pendingSeek = pl.opAt(scrub.value / 1000);
      if (handle.p) handle.p.redraw();
    });

    // keyboard, when the card (or anything in it) has focus
    card.tabIndex = card.tabIndex >= 0 ? card.tabIndex : 0;
    card.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;
      const k = e.key;
      if (k === ' ' || k === 'k') togglePlay();
      else if (k === 'ArrowRight') { if (e.shiftKey && grouped) handle.stepGroup(1); else handle.step(1); }
      else if (k === 'ArrowLeft') { if (e.shiftKey && grouped) handle.stepGroup(-1); else handle.step(-1); }
      else if (k === 'Home') handle.restart();
      else if (k === 'End') handle.finish();
      else return;
      e.preventDefault();
    });

    // pointing at the painting: hover a group to see it, click to write it again
    if (spec.hitTest) {
      const toCanvas = (e) => { const r = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - r.left) * spec.W / r.width, y: (e.clientY - r.top) * spec.H / r.height }; };
      wrap.addEventListener('pointermove', (e) => {
        const q = toCanvas(e), hit = spec.hitTest(q.x, q.y);
        handle.hover = hit ? hit.group : undefined;
        wrap.style.cursor = hit ? 'pointer' : '';
        if (hit && hit.tip) UI.floatTip(hit.tip, e.clientX, e.clientY - 4); else UI.floatTip(null);
        if (handle.p && !handle.player.playing) handle.p.redraw();
      });
      wrap.addEventListener('pointerleave', () => { handle.hover = undefined; UI.floatTip(null); wrap.style.cursor = ''; });
      wrap.addEventListener('click', (e) => {
        const q = toCanvas(e), hit = spec.hitTest(q.x, q.y);
        if (!hit) return;
        card.focus({ preventScroll: true });
        if (spec.onPick) spec.onPick(hit.group); else handle.goToGroup(hit.group);
      });
    }

    handle.p = new p5(sketch);
    state.sketches.push(handle);
    if (io) io.observe(card);
    return handle;
  }

  // take a mounted card's sketch down again (the character view does this)
  function unmount(h) {
    if (!h) return;
    if (active === h) { h.dropSnaps && h.dropSnaps(); active = null; }
    if (io) io.unobserve(h.card);
    if (h.p) h.p.remove();
    const i = state.sketches.indexOf(h); if (i >= 0) state.sketches.splice(i, 1);
  }

  function save(h) {
    const name = (h.spec.id || 'painting') + '.png';
    const go = (canvas) => canvas.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
    try { go(h.p.canvas); } catch (e) { /* a tainted canvas (file://): save the painting alone */ }
  }

  function drawCursor(p, c, kind) {
    p.push();
    if (kind === 'crayon') {
      const col = c.color || [40, 40, 40];
      p.translate(c.x, c.y); p.rotate(-0.7);
      p.noStroke(); p.fill(col[0], col[1], col[2], 235);
      p.rect(-4, -2, 8, 40, 2);
      p.fill(col[0] * 0.7, col[1] * 0.7, col[2] * 0.7, 235);
      p.triangle(-4, -2, 4, -2, 0, -10);
    } else {
      p.noFill(); p.stroke(0, 0, 0, 70); p.strokeWeight(1);
      p.circle(c.x, c.y, Math.max(6, (c.w || 6) + 6));
      p.stroke(0, 0, 0, 160); p.line(c.x, c.y, c.x + 12, c.y - 34);
      p.stroke(0, 0, 0, 90); p.strokeWeight(3); p.line(c.x + 12, c.y - 34, c.x + 22, c.y - 62);
    }
    p.pop();
  }

  // Wire the page toolbar (every element is optional):
  // [data-global-play] button, [data-global-loop] toggle button,
  // [data-global-speed] range (log2 of the speed) + [data-global-speed-out],
  // [data-finish-all], [data-restart-all].
  function bindToolbar(root) {
    const play = root.querySelector('[data-global-play]');
    const loop = root.querySelector('[data-global-loop]');
    const speed = root.querySelector('[data-global-speed]');
    const speedOut = root.querySelector('[data-global-speed-out]');
    const finishAll = root.querySelector('[data-finish-all]');
    const restartAll = root.querySelector('[data-restart-all]');
    const paintPlay = () => {
      if (!play) return;
      const on = state.sketches.some((h) => h.localPlaying && !h.spec.solo);
      play.innerHTML = `${UI.icon(on ? 'pause' : 'play')}<span>${on ? 'Pause all' : 'Play all'}</span>`;
      play.setAttribute('aria-pressed', on);
    };
    if (play) play.addEventListener('click', () => { setPlaying(!state.sketches.some((h) => h.localPlaying && !h.spec.solo)); paintPlay(); });
    if (loop) UI.toggle(loop, (on) => setLoop(on));
    if (speed) speed.addEventListener('input', () => { const v = Math.pow(2, parseFloat(speed.value)); setSpeed(v); if (speedOut) speedOut.textContent = (v < 1 ? v.toFixed(2).replace(/0$/, '') : v.toFixed(v % 1 ? 1 : 0)) + '×'; });
    if (finishAll) finishAll.addEventListener('click', () => state.sketches.forEach((h) => !h.spec.solo && h.finish && h.finish()));
    if (restartAll) restartAll.addEventListener('click', () => state.sketches.forEach((h) => { if (!h.spec.solo && h.restart) { h.restart(); h.localPlaying = true; } }));
    paintPlay(); setInterval(paintPlay, 500);
    UI.bindRanges(root);
  }

  return { mount, unmount, state, setPlaying, setLoop, setSpeed, onChange, bindToolbar };
})();
