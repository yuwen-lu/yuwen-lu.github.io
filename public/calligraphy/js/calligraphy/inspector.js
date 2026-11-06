// The character view: click a character on the calligraphy page and it opens
// here, large, and the brush writes it again stroke by stroke over its
// outline, next to the original. The player is the gallery's own, so the
// same buttons and keys step through the strokes; ⇧ ← → (or the arrows in
// the header) move to the neighbouring characters.
window.Inspector = (() => {
  let dlg = null, h = null, cur = null, guideMode = 'outline', origImg = {};
  const SIZE = 880;

  function ensure() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'inspector';
    dlg.setAttribute('aria-labelledby', 'inspTitle');
    dlg.innerHTML = `
      <div class="inspector__panel">
        <header class="inspector__head">
          <div class="inspector__id">
            <span class="inspector__ch" id="inspCh" aria-hidden="true"></span>
            <div><h2 id="inspTitle"></h2><p id="inspMeta"></p></div>
          </div>
          <div class="inspector__nav">
            ${UI.iconButton({ icon: 'chevron-left', label: 'Previous character', kbd: '⇧ ←', variant: 'outline', cls: 'insp-prev' })}
            ${UI.iconButton({ icon: 'chevron-right', label: 'Next character', kbd: '⇧ →', variant: 'outline', cls: 'insp-next' })}
            <span class="toolbar__sep" aria-hidden="true"></span>
            ${UI.iconButton({ icon: 'x', label: 'Close', kbd: 'Esc', cls: 'insp-close' })}
          </div>
        </header>
        <div class="inspector__body">
          <div class="card inspector__card"><div class="frame"><div class="canvas-wrap"></div></div><div class="controls"></div></div>
          <aside class="inspector__side">
            <figure class="inspector__orig"><canvas width="480" height="480"></canvas><figcaption>原帖 The original</figcaption></figure>
            <div class="inspector__row">
              <span class="toolbar__label" id="inspGuideLabel">Guide</span>
              <div class="segmented" role="radiogroup" aria-labelledby="inspGuideLabel">
                <button type="button" role="radio" data-value="off" aria-checked="false" tabindex="-1">None</button>
                <button type="button" role="radio" data-value="outline" aria-checked="true"><span class="zh">雙鉤</span>Outline</button>
                <button type="button" role="radio" data-value="fill" aria-checked="false" tabindex="-1"><span class="zh">描紅</span>Filled</button>
              </div>
            </div>
            <div class="inspector__strokes-wrap">
              <span class="toolbar__label">Strokes</span>
              <ol class="inspector__strokes" aria-label="Go to a stroke"></ol>
            </div>
            <p class="inspector__fit"></p>
          </aside>
        </div>
      </div>`;
    document.body.appendChild(dlg);
    dlg.addEventListener('close', teardown);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.querySelector('.insp-close').addEventListener('click', () => dlg.close());
    dlg.querySelector('.insp-prev').addEventListener('click', () => move(-1));
    dlg.querySelector('.insp-next').addEventListener('click', () => move(1));
    dlg.addEventListener('keydown', (e) => {
      if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); e.stopPropagation(); move(e.key === 'ArrowLeft' ? -1 : 1); }
    }, true);
    const seg = UI.segmented(dlg.querySelector('.segmented'), (v) => { guideMode = v; if (h) { h.guide = v === 'off' ? null : v; h.p.redraw(); } });
    seg.set(guideMode);
    return dlg;
  }

  function teardown() { if (h) { Gallery.unmount(h); h = null; } UI.floatTip(null); }

  // the characters that have strokes, in order
  const written = (T) => T.chars.map((r, i) => (r.strokes.length ? i : -1)).filter((i) => i >= 0);

  function move(d) {
    if (!cur) return;
    const list = written(cur.piece.data), k = list.indexOf(cur.group);
    const next = list[k + d];
    if (next !== undefined) show(cur.piece, next);
  }

  function open(piece, group) {
    ensure();
    if (!dlg.open) dlg.showModal();
    show(piece, group);
  }

  function show(piece, group) {
    teardown();
    cur = { piece, group };
    const T = piece.data, rec = T.chars[group];
    const list = written(T), k = list.indexOf(group);
    const [bx, by, bw, bh] = rec.box;
    const side = Math.max(bw, bh) * 1.22;
    const s = SIZE / side, ox = (SIZE - bw * s) / 2, oy = (SIZE - bh * s) / 2;
    const L = { s, ox, oy, W: SIZE, H: SIZE, tf: (x, y) => ({ x: ox + (x - bx) * s, y: oy + (y - by) * s }) };
    const G = Traced.geometry({ chars: [rec] }, L);
    const n = Traced.steps(rec).length;
    // header
    dlg.querySelector('#inspCh').textContent = rec.ch;
    dlg.querySelector('#inspTitle').innerHTML = `${UI.esc(rec.ch)} <span class="muted">in</span> ${UI.esc(piece.title)} <span class="en">${UI.esc(piece.en || '')}</span>`;
    dlg.querySelector('#inspMeta').textContent = `${piece.authorEn || piece.author} · character ${k + 1} of ${list.length} · ${n} stroke${n > 1 ? 's' : ''}`;
    dlg.querySelector('.insp-prev').disabled = k <= 0;
    dlg.querySelector('.insp-next').disabled = k >= list.length - 1;
    dlg.querySelector('.inspector__fit').innerHTML = rec.fit
      ? `The traced strokes paint <b>${Math.round(rec.fit[0] * 1000) / 10}%</b> of this character's ink, and <b>${Math.round(rec.fit[1] * 1000) / 10}%</b> of what they paint is ink.`
      : '';
    // the original, cropped from the scan copy
    drawOriginal(piece, rec, side);
    // stroke chips
    const ol = dlg.querySelector('.inspector__strokes');
    ol.innerHTML = Array.from({ length: n }, (_, i) => `<li><button type="button" data-k="${i}" aria-label="Write up to stroke ${i + 1}">${i + 1}</button></li>`).join('');
    ol.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { if (!h) return; h.localPlaying = false; h.seekOp(+b.dataset.k + 1); }));
    // the brush
    const card = dlg.querySelector('.inspector__card');
    const spec = {
      id: `${piece.id}-${rec.ch}`, W: SIZE, H: SIZE, seed: (piece.seed + group * 7919) >>> 0, solo: true, vary: true, save: true, stepName: 'stroke',
      alt: `The character ${rec.ch}, written by a simulated brush`,
      unitsPerSecond: 70, holdAtEnd: 2600, cursor: 'ink', blend: 'multiply',
      paper: (p, W, H, rng) => InkPaper(p, W, H, rng, { base: [240, 232, 214], mottle: 0.5, grain: 10 }),
      build: (env) => { const B = InkBrush.create(env); env.brush = B; return Traced.create(B).charOps(rec, L, { ...piece.style, wet: Math.min(piece.style.wet ?? 0, 0.3) }, 1, 0); },
      guide: (dc, mode) => dc.drawImage(G.guide(mode), 0, 0),
      overlay: (dc, info) => {
        // the done/next state of the chips
        const done = info.done ? n : info.idx;
        ol.querySelectorAll('button').forEach((b, i) => { b.classList.toggle('done', i < done); b.classList.toggle('next', !info.done && i === done && !info.inOp); });
        if (info.playing || info.done) return;
        const op = info.next >= 0 ? info.ops[info.next] : null;
        Traced.drawNextStroke(dc, op, L, { minW: 3, maxW: 7, dot: 15 });
      },
      describe: (info) => info.done
        ? `<span class="status__done">Finished</span> <span class="status__muted">${n} stroke${n > 1 ? 's' : ''}</span>`
        : `<b class="status__ch">${UI.esc(rec.ch)}</b> <span>${Traced.strokeText(info.idx, n, info.inOp)}</span>`,
    };
    card.querySelector('.canvas-wrap').innerHTML = '';
    h = Gallery.mount(card, spec);
    h.guide = guideMode === 'off' ? null : guideMode;
    card.focus({ preventScroll: true });
  }

  function drawOriginal(piece, rec, side) {
    const c = dlg.querySelector('.inspector__orig canvas'), g = c.getContext('2d');
    const T = piece.data, [bx, by, bw, bh] = rec.box;
    const paint = (img) => {
      const k = img.naturalWidth / T.w, cx = bx + bw / 2, cy = by + bh / 2;
      g.fillStyle = '#efe8da'; g.fillRect(0, 0, c.width, c.height);
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, (cx - side / 2) * k, (cy - side / 2) * k, side * k, side * k, 0, 0, c.width, c.height);
    };
    const src = piece.image;
    let img = origImg[src];
    if (!img) { img = origImg[src] = new Image(); img.src = src; }
    if (img.complete && img.naturalWidth) paint(img);
    else { g.fillStyle = '#efe8da'; g.fillRect(0, 0, c.width, c.height); img.addEventListener('load', () => { if (cur && cur.piece === piece) paint(img); }, { once: true }); }
  }

  return { open };
})();
