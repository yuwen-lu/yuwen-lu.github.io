// 摹 tracing: the brush writes a piece along the brush tracks extracted from
// a scan of the original (data/traced/*.js, made by tools/trace-model.js).
// Nothing here comes from a font: every stroke's path and width is the
// calligrapher's own, read off the ink; the brush simulation only supplies
// the bristles, the drying and the pooling. The layout is the original's
// too, so the scan itself can be shown underneath, and every character's
// outline (描紅) can be drawn for the brush to fill.
window.Traced = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const SEAL_RED = [176, 46, 38];

  // Canvas geometry for a traced piece: scale the scan's text region so a
  // character cell is about `cell` px tall, with margins around it.
  // T only needs { region, cellH } (the index has them before the data loads).
  function layout(T, o = {}) {
    const cell = o.cell ?? 60;
    const s = cell / T.cellH;
    const rw = T.region.x1 - T.region.x0, rh = T.region.y1 - T.region.y0;
    const mx = o.marginX ?? 26, my = o.marginY ?? 22;
    const W = Math.round(rw * s + mx * 2), H = Math.round(rh * s + my * 2);
    return { s, ox: mx, oy: my, W, H, tf: (x, y) => ({ x: mx + (x - T.region.x0) * s, y: my + (y - T.region.y0) * s }) };
  }

  // Catmull-Rom through samples {x, y, w}, about `step` px apart
  function spline(pts, step) {
    if (pts.length < 3) return pts;
    const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      const n = Math.max(1, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y), w: Math.max(0.5, f(p0.w, p1.w, p2.w, p3.w)) });
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  // The steps of one traced character. rec.strokes are polylines
  // [[x, y, w], ...] in scan px; rec.t gives each polyline a key: the template
  // stroke it belongs to (≥ 0), a key shared by a stroke and the short patches
  // that fill the ink beside it (≤ -2), or -1 for a stroke on its own.
  // Consecutive polylines with one key are one step, written one after the
  // other (a stroke crossed by another, a gap of dry brush, a patch).
  function steps(rec) {
    const out = [];
    rec.strokes.forEach((raw, k) => {
      const t = rec.t ? rec.t[k] : -1;
      const last = out[out.length - 1];
      if (last && t !== -1 && last.t === t) last.raws.push(raw); else out.push({ t, raws: [raw] });
    });
    return out;
  }

  function create(B) {
    const { rng, ctx } = B;
    const op = (label, run, units = 30, extra = {}) => ({ label, run, units, ...extra });

    // ops for one traced character; strokes are [[x,y,w],...] in scan px
    function charOps(rec, L, st, inkLoad, group) {
      const ink = clamp(0.6 + 0.4 * inkLoad, 0, 1) * (st.ink ?? 1);
      const dry = clamp((1 - inkLoad) * 1.5 * (st.dryScale ?? 1) + (st.dry ?? 0), 0, 0.82);
      const wet = inkLoad > 0.82 ? (st.wet ?? 0) : (st.wet ?? 0) * 0.25;
      const wScale = (st.wScale ?? 1) * (st.weight ?? 1);
      const big = L.s > 1.2;
      const S = steps(rec), n = S.length;
      // one polyline with the brush
      function* line(raw, first) {
        // the tracks run all the way to the ink's ends, measured (tools/trace-model.js);
        // drawn large, a spline through the samples keeps the edges from faceting
        let pts = raw.map(([x, y, w]) => ({ ...L.tf(x, y), w: Math.max(0.8, w * L.s * wScale) }));
        if (pts.length < 2) return;
        if (big) {
          // a few passes of [1 2 1] over the samples (ends fixed): at seven
          // times the scan's size its pixel noise would show as wobble
          for (let it = 0; it < 2; it++) pts = pts.map((q, i) => (i === 0 || i === pts.length - 1) ? q : { x: (pts[i - 1].x + 2 * q.x + pts[i + 1].x) / 4, y: (pts[i - 1].y + 2 * q.y + pts[i + 1].y) / 4, w: (pts[i - 1].w + 2 * q.w + pts[i + 1].w) / 4 });
          pts = spline(pts, Math.max(1.5, L.s));
        }
        const cum = [0];
        for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
        const total = cum[cum.length - 1] || 1;
        let maxW = 1; for (const q of pts) maxW = Math.max(maxW, q.w);
        let cursor = 0;
        const widthAt = (t) => {
          const d = t * total;
          while (cursor < cum.length - 2 && cum[cursor + 1] < d) cursor++;
          while (cursor > 0 && cum[cursor] > d) cursor--;
          const a = pts[cursor], b = pts[Math.min(pts.length - 1, cursor + 1)];
          const seg = cum[cursor + 1] - cum[cursor] || 1;
          return lerp(a.w, b.w, clamp((d - cum[cursor]) / seg, 0, 1));
        };
        yield* B.stroke(pts, {
          w: maxW, press: (t) => Math.max(0.05, widthAt(t) / maxW),
          taperIn: 0, taperOut: 0,
          // the measured width already holds the original's bleeding: keep
          // the wet halo just past the edge, a soft rim rather than a glow
          ink, dry, wet, wetSpread: 0.56, wetPad: 0.4, tremor: (st.tremor ?? 0.4) * 0.5, bristleDensity: 1.6, cap: 'butt',
          // drawn large, more and finer bristles, sampled closer, so they read as ink and not as stripes
          maxBristles: big ? 56 : 16, spacing: big ? Math.max(1, Math.min(maxW * 0.14, 2.2)) : Math.max(1.0, maxW * 0.14),
          bristleAlpha: big ? [0.96, 1.06] : undefined,
          minW: 0.8, yieldEvery: big ? 6 : 3,
        });
        if (wet > 0.3 && first) {
          ctx.fillStyle = `rgba(0,0,0,${(wet * 0.3 * B.alphaFor(ink)).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(pts[1].x, pts[1].y, pts[1].w * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        const e = pts[pts.length - 1];
        yield { x: e.x, y: e.y, w: 6 };
      }
      return S.map((stp, k) => op(`${rec.ch} · stroke ${k + 1} of ${n}`, function* () {
        for (let j = 0; j < stp.raws.length; j++) yield* line(stp.raws[j], k === 0 && j === 0);
      }, 10 + Math.round(stp.raws.reduce((a, r) => a + lengthOf(r), 0) * L.s / 3), { group, stroke: k, strokes: n, raws: stp.raws, raw: stp.raws[0] }));
    }
    const lengthOf = (raw) => { let s = 0; for (let i = 1; i < raw.length; i++) s += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]); return s; };

    // Lay out the whole piece: characters in the order they were written,
    // ink draining from dip to dip. Every op of a character carries its index
    // in T.chars as `group`; dipping the brush is not a step of its own.
    function buildPiece(piece) {
      const T = piece.data, st = piece.style, L = piece.layout;
      const ops = [];
      let inkLoad = 1, sinceDip = 0;
      T.chars.forEach((rec, ci) => {
        if (!rec.strokes.length) return;
        const first = rec.strokes[0][0];
        if (sinceDip > 0 && (inkLoad < (st.redipAt ?? 0.5) || rng.chance(0.05))) {
          inkLoad = 1; sinceDip = 0;
          const q = L.tf(first[0], first[1]);
          ops.push(op('蘸墨 dip the brush', function* () { yield { x: q.x, y: q.y, w: 8 }; }, 2, { group: ci, step: false }));
        }
        ops.push(...charOps(rec, L, st, inkLoad, ci));
        inkLoad -= rng.range(st.drain?.[0] ?? 0.04, st.drain?.[1] ?? 0.08) * (rec.small ? 0.5 : 1);
        sinceDip++;
      });
      if (piece.seal !== false && window.Seal) {
        const C = Seal.create(B);
        const last = T.cols[T.cols.length - 1];
        const p0 = L.tf(last[0], T.region.y1);
        const size = Math.max(14, T.cellH * L.s * 0.55);
        ops.push(op('印 seal', function* () { yield* C.seal(p0.x + (last[1] - last[0]) * L.s * 0.5 - size / 2, p0.y - size * 1.1, size); }, 6, { group: 'seal' }));
      }
      return ops;
    }
    return { buildPiece, charOps };
  }

  // Draw the scan under the writing (the "underlay"): img is the downsized
  // copy in assets/models; scale from scan px to image px is img.width / T.w.
  function drawUnderlay(dc, img, T, L) {
    const k = img.naturalWidth / T.w;
    const R = T.region;
    dc.drawImage(img, R.x0 * k, R.y0 * k, (R.x1 - R.x0) * k, (R.y1 - R.y0) * k, L.ox, L.oy, (R.x1 - R.x0) * L.s, (R.y1 - R.y0) * L.s);
  }

  // ---- outlines, hints and pointing ----------------------------------------------
  // Everything the page draws about the characters (not with the brush):
  // the outline guide, the character being written, the next stroke, and
  // which character the pointer is over. Built once per piece, lazily.
  function geometry(T, L) {
    const chars = T.chars.map((rec, i) => {
      const [bx, by, bw, bh] = rec.box;
      const a = L.tf(bx, by), b = L.tf(bx + bw, by + bh);
      const path = new Path2D();
      for (const r of rec.ol || []) {
        for (let k = 0; k < r.length; k += 2) { const q = L.tf(bx + r[k] / 2, by + r[k + 1] / 2); if (k) path.lineTo(q.x, q.y); else path.moveTo(q.x, q.y); }
        path.closePath();
      }
      return { i, rec, x0: a.x, y0: a.y, x1: b.x, y1: b.y, path, hasOutline: !!(rec.ol && rec.ol.length) };
    });
    const guides = {};
    function guide(mode) {
      if (guides[mode]) return guides[mode];
      const c = document.createElement('canvas'); c.width = L.W; c.height = L.H;
      const g = c.getContext('2d');
      g.lineJoin = 'round';
      for (const ch of chars) {
        if (!ch.hasOutline) continue;
        if (mode === 'fill') { g.fillStyle = 'rgba(214, 92, 72, 0.42)'; g.fill(ch.path, 'evenodd'); }
        g.strokeStyle = mode === 'fill' ? 'rgba(190, 60, 44, 0.55)' : 'rgba(196, 52, 38, 0.82)';
        g.lineWidth = mode === 'fill' ? 0.6 : 0.9;
        g.stroke(ch.path);
      }
      return (guides[mode] = c);
    }
    const probe = document.createElement('canvas').getContext('2d');
    function hit(x, y) {
      let best = null, bestScore = Infinity;
      for (const ch of chars) {
        if (!ch.rec.strokes.length || x < ch.x0 - 2 || x > ch.x1 + 2 || y < ch.y0 - 2 || y > ch.y1 + 2) continue;
        const inside = ch.hasOutline && probe.isPointInPath(ch.path, x, y, 'evenodd');
        const cx = (ch.x0 + ch.x1) / 2, cy = (ch.y0 + ch.y1) / 2;
        const score = (inside ? 0 : 1e6) + Math.hypot(x - cx, y - cy);
        if (score < bestScore) { bestScore = score; best = ch; }
      }
      return best;
    }
    return { chars, guide, hit };
  }
  // a stroke's track on the canvas, for the "next stroke" hint
  const track = (raw, L) => raw.map(([x, y, w]) => ({ ...L.tf(x, y), w: w * L.s }));
  // The stroke that comes next: its track dashed, an arrowhead where it ends
  // and its number where it starts. op: an op from charOps (op.raw, op.stroke).
  function drawNextStroke(dc, op, L, o = {}) {
    if (!op || !(op.raws || op.raw)) return;
    const ts = (op.raws || [op.raw]).map((r) => track(r, L)).filter((t) => t.length >= 2);
    if (!ts.length) return;
    const accent = 'rgba(176, 46, 38, ';
    const lw = clamp(Math.min(...ts.flat().map((q) => q.w)) * 0.35, o.minW ?? 1.2, o.maxW ?? 2.4);
    dc.save();
    dc.lineCap = 'round'; dc.lineJoin = 'round';
    dc.setLineDash([lw * 2.2, lw * 2.2]); dc.lineWidth = lw; dc.strokeStyle = accent + '0.95)';
    for (const t of ts) { dc.beginPath(); dc.moveTo(t[0].x, t[0].y); for (let i = 1; i < t.length; i++) dc.lineTo(t[i].x, t[i].y); dc.stroke(); }
    dc.setLineDash([]);
    const t = ts[ts.length - 1], t0 = ts[0];
    let j = t.length - 2; while (j > 0 && Math.hypot(t[j].x - t[t.length - 1].x, t[j].y - t[t.length - 1].y) < lw * 3) j--;
    dc.fillStyle = accent + '0.95)'; arrowHead(dc, t[j], t[t.length - 1], Math.max(5, lw * 3.2));
    const r = Math.max(o.dot ?? 5.5, lw * 3);
    dc.beginPath(); dc.arc(t0[0].x, t0[0].y, r, 0, Math.PI * 2); dc.fillStyle = '#fff'; dc.fill();
    dc.lineWidth = Math.max(1.2, lw * 0.6); dc.strokeStyle = accent + '1)'; dc.stroke();
    dc.fillStyle = accent + '1)'; dc.font = `600 ${Math.round(r * 1.2)}px Inter, -apple-system, "Segoe UI", sans-serif`; dc.textAlign = 'center'; dc.textBaseline = 'middle';
    dc.fillText(String(op.stroke + 1), t0[0].x, t0[0].y + 0.5);
    dc.restore();
  }
  function arrowHead(dc, a, b, size) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    dc.beginPath(); dc.moveTo(b.x, b.y);
    dc.lineTo(b.x - size * Math.cos(ang - 0.5), b.y - size * Math.sin(ang - 0.5));
    dc.lineTo(b.x - size * Math.cos(ang + 0.5), b.y - size * Math.sin(ang + 0.5));
    dc.closePath(); dc.fill();
  }

  // ---- the catalogue -----------------------------------------------------------------
  // Order on the page, group, how the brush is loaded and driven along the
  // extracted tracks (the tracks themselves are the original's), and what to
  // say about each work.
  const order = ['shupu', 'zixu', 'shiqi', 'lanting', 'jizhi', 'hanshi', 'shusu', 'xinjing', 'jiuchenggong', 'duobaota', 'xuanmita', 'caoquan'];
  const groups = [
    { id: 'cao', title: '草書', en: 'Cursive', sub: 'The brush hardly leaves the paper: characters run into one another and the stroke order follows the hand.' },
    { id: 'xing', title: '行書', en: 'Running script', sub: 'Strokes linked, corners turned, the ink running from wet to dry between dips.' },
    { id: 'kai', title: '楷書 · 隸書', en: 'Regular and clerical script', sub: 'Every stroke lifted and placed. Most of these survive as rubbings of carved steles.' },
  ];
  const catalog = {
    lanting: { group: 'xing', en: 'Preface to the Orchid Pavilion Poems', author: 'Wang Xizhi', script: '行書 running script', year: '353',
      style: { tremor: 0.45, wet: 0.25, dryScale: 0.7, redipAt: 0.45, drain: [0.05, 0.1] },
      notes: 'Wang Xizhi’s preface to the poems written at a spring gathering in 353, known from Tang tracing copies; this is the Shenlong copy (神龍本). Look for the hairline links between strokes and the two small characters 崇山 squeezed in beside the fourth column.' },
    jizhi: { group: 'xing', en: 'Draft of a Requiem to My Nephew', author: 'Yan Zhenqing', script: '行書 running script', year: '758',
      style: { tremor: 0.5, wet: 0.6, dryScale: 1.3, redipAt: 0.35, drain: [0.07, 0.13] },
      notes: 'Yan Zhenqing’s draft eulogy for a nephew killed in the An Lushan rebellion, written in grief with the corrections left in. The brush is loaded until the ink pools, then driven until it runs dry.' },
    hanshi: { group: 'xing', en: 'Poems on the Cold Food Festival at Huangzhou', author: 'Su Shi', script: '行書 running script', year: '1082',
      style: { tremor: 0.4, wet: 0.4, dryScale: 0.8, redipAt: 0.4, drain: [0.06, 0.11] },
      notes: 'Two poems Su Shi wrote in exile at Huangzhou. The characters swell and shrink with the lines; the last stroke of 紙 drops through the column, and a crossed-out 子 and an added 病 are kept.' },
    shusu: { group: 'xing', en: 'Poems on Sichuan Silk', author: 'Mi Fu', script: '行書 running script', year: '1088',
      style: { tremor: 0.6, wet: 0.2, dryScale: 0.9, redipAt: 0.42, drain: [0.06, 0.11] },
      notes: 'The first poem on Mi Fu’s scroll of Sichuan silk, written between woven ruled lines (removed before tracing). Mi Fu brushed fast and sideways, so sharp tips fly off the ends of his strokes.' },
    xinjing: { group: 'xing', en: 'Heart Sutra', author: 'Zhao Mengfu', script: '行楷 running-regular script', year: 'c. 1300',
      style: { tremor: 0.3, wet: 0.2, dryScale: 0.5, redipAt: 0.5, drain: [0.04, 0.07] },
      notes: 'The complete Heart Sutra in 26 columns, in Zhao Mengfu’s round, even hand, with a small 呪 added beside 明 and his dedication at the end.' },
    shupu: { group: 'cao', en: 'Treatise on Calligraphy', author: 'Sun Guoting', script: '草書 cursive', year: '687',
      style: { tremor: 0.5, wet: 0.2, dryScale: 1.0, redipAt: 0.4, drain: [0.06, 0.11] },
      notes: 'The opening of Sun Guoting’s treatise on calligraphy, itself the model of cursive script: most characters are a single movement of the brush, with the dots absorbed into the line.' },
    zixu: { group: 'cao', en: 'Autobiographical Essay', author: 'Huaisu', script: '狂草 wild cursive', year: '777',
      style: { tremor: 0.5, wet: 0.15, dryScale: 1.2, redipAt: 0.3, drain: [0.07, 0.13] },
      notes: 'The monk Huaisu’s account of his own life in wild cursive. A whole column is often one connected sweep of ink; the tracer cuts it into characters and orders the strokes by the flow of the hand.' },
    shiqi: { group: 'cao', en: 'The Seventeenth Day Letters', author: 'Wang Xizhi', script: '草書 cursive', year: '4th c.',
      style: { tremor: 0.4, wet: 0.1, dryScale: 0.6, redipAt: 0.45, drain: [0.05, 0.1] },
      notes: 'Two of Wang Xizhi’s letters from a 13th-century rubbing. The writing is white on black, so the tracer reads the paper showing through as ink.' },
    jiuchenggong: { group: 'kai', en: 'Inscription on the Sweet Spring at Jiucheng Palace', author: 'Ouyang Xun', script: '楷書 regular script', year: '632',
      style: { tremor: 0.2, wet: 0.05, dryScale: 0.4, redipAt: 0.55, drain: [0.03, 0.06] },
      notes: 'Ouyang Xun’s stele for a summer palace, long the standard model of regular script: narrow, tall and exact. Thirty columns from six album pages of a rubbing; damage blotches are filtered out by their shape.' },
    duobaota: { group: 'kai', en: 'Stele of the Many Treasures Pagoda', author: 'Yan Zhenqing', script: '楷書 regular script', year: '752',
      style: { tremor: 0.2, wet: 0.3, dryScale: 0.35, redipAt: 0.6, drain: [0.03, 0.06] },
      notes: 'Yan Zhenqing’s early stele, in plump, muscular regular script. The rubbing’s grid lines are erased before the characters are read.' },
    xuanmita: { group: 'kai', en: 'Stele of the Xuanmi Pagoda', author: 'Liu Gongquan', script: '楷書 regular script', year: '841',
      style: { tremor: 0.2, wet: 0.1, dryScale: 0.5, redipAt: 0.55, drain: [0.03, 0.06] },
      notes: 'Liu Gongquan’s stele, the model of lean, sharp, tense strokes: the title lines and the first line of the text, from four album pages.' },
    caoquan: { group: 'kai', en: 'Stele of Cao Quan', author: 'Anonymous, Eastern Han', script: '隸書 clerical script', year: '185',
      style: { tremor: 0.25, wet: 0.2, dryScale: 0.45, redipAt: 0.55, drain: [0.03, 0.06] },
      notes: 'A clerical-script stele: flat, wide characters with rounded, even strokes on a loose grid, the script that came before regular script.' },
  };
  const speed = { cao: 700, xing: 520, kai: 400 };
  const seedOf = (id) => [...id].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0;

  // The gallery spec for a work, once its data T is loaded.
  function spec(id, T, o = {}) {
    const c = catalog[id] || { group: 'xing', en: '', author: '', script: '', year: '', style: {}, notes: '' };
    const L = layout(T, { cell: o.cell ?? 60 });
    const G = geometry(T, L);
    const strokeCount = T.chars.reduce((n, r) => n + steps(r).length, 0);
    const piece = {
      id, group: c.group, title: T.title, en: c.en, author: T.author, authorEn: c.author, script: c.script, year: c.year,
      credit: T.credit, notes: c.notes, W: L.W, H: L.H, layout: L, data: T, style: c.style, seed: seedOf(id),
      image: `assets/models/${id}.jpg`, unitsPerSecond: speed[c.group] || 520, groupName: 'character',
      alt: `${T.title} by ${c.author || T.author}, written by a simulated brush`,
    };
    piece.guide = (dc, mode) => dc.drawImage(G.guide(mode), 0, 0);
    piece.hitTest = (x, y) => {
      const ch = G.hit(x, y); if (!ch) return null;
      const fit = ch.rec.fit ? ` · strokes cover ${Math.round(ch.rec.fit[0] * 100)}% of its ink` : '';
      const n = steps(ch.rec).length;
      return { group: ch.i, tip: `<b class="tip-ch">${ch.rec.ch}</b> ${n} stroke${n > 1 ? 's' : ''}${fit}<br><span class="tip-hint">Click to write it stroke by stroke</span>` };
    };
    piece.overlay = (dc, info) => {
      const accent = 'rgba(176, 46, 38, ';
      // the character under the pointer
      if (info.hover !== undefined && G.chars[info.hover] && info.hover !== info.group) {
        const ch = G.chars[info.hover];
        dc.lineWidth = 1.2; dc.strokeStyle = accent + '0.75)'; dc.fillStyle = accent + '0.08)';
        if (ch.hasOutline) { dc.fill(ch.path, 'evenodd'); dc.stroke(ch.path); }
        else dc.strokeRect(ch.x0, ch.y0, ch.x1 - ch.x0, ch.y1 - ch.y0);
      }
      if (info.playing || typeof info.group !== 'number') return;
      // paused on a character: its outline, and the stroke that comes next
      const ch = G.chars[info.group]; if (!ch) return;
      dc.lineWidth = 1.4; dc.strokeStyle = accent + '0.9)'; dc.fillStyle = accent + '0.06)';
      if (ch.hasOutline) { dc.fill(ch.path, 'evenodd'); dc.stroke(ch.path); }
      const op = info.next >= 0 ? info.ops[info.next] : null;
      if (op && op.group === info.group) drawNextStroke(dc, op, L);
    };
    const nChars = T.chars.filter((r) => r.strokes.length).length;
    const rank = new Map(); { let k = 0; T.chars.forEach((r, i) => { if (r.strokes.length) rank.set(i, ++k); }); }
    piece.describe = (info) => {
      if (info.done) return `<span class="status__done">Finished</span> <span class="status__muted">${nChars} characters · ${strokeCount} strokes</span>`;
      if (info.group === 'seal') return '<b class="status__ch">印</b> <span class="status__muted">the seal</span>';
      const rec = T.chars[info.group]; if (!rec) return '';
      return `<b class="status__ch">${rec.ch}</b> <span>${strokeText(info.groupDone, info.groupTotal, info.inOp)}</span> <span class="status__muted">· character ${rank.get(info.group)} of ${nChars}</span>`;
    };
    piece.stats = { chars: nChars, strokes: strokeCount, fit: fitOf(T) };
    return piece;
  }
  // "writing stroke 3 of 7" while the brush moves, "2 of 7 strokes" between strokes
  function strokeText(done, total, inOp) {
    if (inOp) return `writing stroke ${done + 1} of ${total}`;
    return done >= total ? `${total} stroke${total > 1 ? 's' : ''}` : `${done} of ${total} strokes`;
  }
  // how much of the original's ink the strokes paint, over the whole piece
  function fitOf(T) {
    let w = 0, s = 0;
    for (const r of T.chars) if (r.fit && r.ol) { const a = r.box[2] * r.box[3]; w += a; s += a * r.fit[0]; }
    return w ? s / w : null;
  }

  // Load a work's data (a script that sets window.TRACED[id]) once.
  const loading = {};
  function load(id) {
    if (window.TRACED && window.TRACED[id]) return Promise.resolve(window.TRACED[id]);
    if (loading[id]) return loading[id];
    return (loading[id] = new Promise((resolve, reject) => {
      const s = document.createElement('script'); s.src = `data/traced/${id}.js`; s.async = true;
      s.onload = () => (window.TRACED && window.TRACED[id] ? resolve(window.TRACED[id]) : reject(new Error('no data in ' + s.src)));
      s.onerror = () => reject(new Error('cannot load ' + s.src));
      document.head.appendChild(s);
    }));
  }

  // kept for the demo and the tools: specs for every work already loaded
  function pieces() { return order.filter((id) => window.TRACED && window.TRACED[id]).map((id) => spec(id, window.TRACED[id])); }

  return { create, layout, drawUnderlay, geometry, drawNextStroke, strokeText, steps, spec, load, pieces, order, groups, catalog, seal: SEAL_RED };
})();
