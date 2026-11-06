// The stages that turn a scan of a calligraphy work into characters ready
// for skeleton extraction. Pure functions on pixel buffers, so the same code
// runs in the Node tracer (tools/trace-model.js) and in the browser (the
// demo page). Coordinates are scan pixels; a region R = {x0, x1, y0, y1}
// limits every stage to the text area.
//
//   inkMask          which pixels are ink (dark and not red; light on a rubbing)
//   eraseRules       ruled lines and frames are long straight runs, not writing
//   components       8-connected blobs of ink with their boxes and centroids
//   filterComponents dust, damage blotches, seal remnants and line fragments
//   columnProfile / findColumns   the columns of text from the ink per x
//   cutColumn        the cells (characters) of one column, and inserts beside it
//   traceColumn      every character's strokes and the ink pixels it owns
//   outline          the outline of a character's ink, as smooth closed rings
//   charFidelity     how much of a character's ink its strokes paint
//   traceChar        one character's pixels → its strokes (via Skeleton)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./skeleton.js'));
  else root.TraceCore = factory(root.Skeleton);
})(typeof self !== 'undefined' ? self : this, function (Skeleton) {
  const region = (px, R) => ({ x0: 0, x1: px.width, y0: 0, y1: px.height, ...(R || {}) });

  // ---- 1. ink ------------------------------------------------------------
  // px: { data, width, height, channels }. o: { invert, lum, red }.
  // Ink is darker than o.lum and not red (r - max(g, b) < o.red); on a
  // rubbing (o.invert) ink is the paper showing through, lighter than o.lum.
  function inkMask(px, R, o = {}) {
    const { data, width: W, channels: C } = px; R = region(px, R);
    const lumT = o.lum ?? (o.invert ? 150 : 110), redT = o.red ?? 40;
    const mask = new Uint8Array(W * px.height);
    for (let y = R.y0; y < R.y1; y++) for (let x = R.x0; x < R.x1; x++) {
      const i = (y * W + x) * C, r = data[i], g = data[i + 1], b = data[i + 2];
      const L = r * 0.3 + g * 0.59 + b * 0.11;
      if (o.invert ? L > lumT : (L < lumT && (r - Math.max(g, b)) < redT)) mask[y * W + x] = 1;
    }
    return mask;
  }
  // Luminance and redness of one pixel (for the demo's colour views).
  function classify(px, x, y, o = {}) {
    const i = (y * px.width + x) * px.channels, r = px.data[i], g = px.data[i + 1], b = px.data[i + 2];
    const L = r * 0.3 + g * 0.59 + b * 0.11, red = r - Math.max(g, b);
    const lumT = o.lum ?? (o.invert ? 150 : 110), redT = o.red ?? 40;
    if (o.invert) return L > lumT ? 'ink' : 'paper';
    if (red >= redT) return 'seal';
    return L < lumT ? 'ink' : 'paper';
  }

  // rules: { frac, fracX, colFrac, rowFrac } — vertical runs longer than
  // frac × region height (and horizontal ones longer than fracX × width) are
  // erased; colFrac / rowFrac erase whole pixel columns / rows that are mostly
  // ink (broken or faint lines). Returns the number of pixels erased.
  function eraseRules(mask, W, R, rules) {
    let erased = 0;
    const minRun = Math.round((R.y1 - R.y0) * (rules.frac ?? 0.2));
    for (let x = R.x0; x < R.x1; x++) {
      let start = -1;
      for (let y = R.y0; y <= R.y1; y++) {
        const on = y < R.y1 && mask[y * W + x];
        if (on && start < 0) start = y;
        if (!on && start >= 0) { if (y - start >= minRun) { for (let k = start; k < y; k++) { mask[k * W + x] = 0; erased++; } } start = -1; }
      }
    }
    const minRunX = Math.round((R.x1 - R.x0) * (rules.fracX ?? 0.1));
    for (let y = R.y0; y < R.y1; y++) {
      let start = -1;
      for (let x = R.x0; x <= R.x1; x++) {
        const on = x < R.x1 && mask[y * W + x];
        if (on && start < 0) start = x;
        if (!on && start >= 0) { if (x - start >= minRunX) { for (let k = start; k < x; k++) { mask[y * W + k] = 0; erased++; } } start = -1; }
      }
    }
    if (rules.colFrac) {
      const RH = R.y1 - R.y0;
      for (let x = R.x0; x < R.x1; x++) {
        let n = 0; for (let y = R.y0; y < R.y1; y++) n += mask[y * W + x];
        if (n >= RH * rules.colFrac) for (let y = R.y0; y < R.y1; y++) { if (mask[y * W + x]) { mask[y * W + x] = 0; erased++; } }
      }
    }
    if (rules.rowFrac) {
      const RW = R.x1 - R.x0;
      for (let y = R.y0; y < R.y1; y++) {
        let n = 0; for (let x = R.x0; x < R.x1; x++) n += mask[y * W + x];
        if (n >= RW * rules.rowFrac) for (let x = R.x0; x < R.x1; x++) { if (mask[y * W + x]) { mask[y * W + x] = 0; erased++; } }
      }
    }
    return erased;
  }
  // ink pixels with no ink neighbour are dust
  function despeckle(mask, W, R) {
    for (let y = R.y0 + 1; y < R.y1 - 1; y++) for (let x = R.x0 + 1; x < R.x1 - 1; x++) {
      const i = y * W + x; if (!mask[i]) continue;
      if (!(mask[i - 1] || mask[i + 1] || mask[i - W] || mask[i + W] || mask[i - W - 1] || mask[i - W + 1] || mask[i + W - 1] || mask[i + W + 1])) mask[i] = 0;
    }
  }

  // ---- 2. components -------------------------------------------------------
  // 8-connected components inside R: { px: [pixel index], x0, x1, y0, y1, area, cx, cy }
  function components(mask, W, R) {
    const comps = [];
    const RW = R.x1 - R.x0, RH = R.y1 - R.y0;
    const label = new Int32Array(RW * RH).fill(-1);
    for (let y = R.y0; y < R.y1; y++) for (let x = R.x0; x < R.x1; x++) {
      if (!mask[y * W + x] || label[(y - R.y0) * RW + (x - R.x0)] >= 0) continue;
      const id = comps.length; const px = [];
      const stack = [[x, y]]; label[(y - R.y0) * RW + (x - R.x0)] = id;
      let bx0 = x, bx1 = x, by0 = y, by1 = y, sx = 0, sy = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop(); px.push(cy * W + cx); sx += cx; sy += cy;
        if (cx < bx0) bx0 = cx; if (cx > bx1) bx1 = cx; if (cy < by0) by0 = cy; if (cy > by1) by1 = cy;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < R.x0 || nx >= R.x1 || ny < R.y0 || ny >= R.y1) continue;
          if (!mask[ny * W + nx] || label[(ny - R.y0) * RW + (nx - R.x0)] >= 0) continue;
          label[(ny - R.y0) * RW + (nx - R.x0)] = id; stack.push([nx, ny]);
        }
      }
      comps.push({ id, px, x0: bx0, x1: bx1 + 1, y0: by0, y1: by1 + 1, area: px.length, cx: sx / px.length, cy: sy / px.length });
    }
    return comps;
  }
  // o: { minArea, maxArea, blobFill, blobMin, lineComp: {maxW, minH}, invert, ratio }
  // redness(c): mean r/g of a component (seal remnants are red-tinted)
  // A small component redder than the ink is a seal fragment. "Redder than
  // the ink" is measured on the scan itself: the ink's redness (R / G) is the
  // 90th percentile over the large components, and a small one is a seal
  // only if it is at least 0.1 above that (and above o.ratio, default 1.3);
  // on a warm-toned scan the ink itself reads 1.3 and a fixed threshold
  // would throw away every dot.
  function filterComponents(comps, o = {}, redness) {
    const minArea = o.minArea ?? 20;
    const blob = (c) => o.blobFill && c.area > (o.blobMin ?? 1200) && c.area / ((c.x1 - c.x0) * (c.y1 - c.y0)) > o.blobFill;
    const lineFrag = (c) => o.lineComp && (c.x1 - c.x0) <= o.lineComp.maxW && (c.y1 - c.y0) >= o.lineComp.minH;
    let sealRatio = o.ratio ?? 1.3;
    if (redness && !o.invert) {
      const big = comps.filter((c) => c.area >= 400).map(redness).sort((a, b) => a - b);
      if (big.length) sealRatio = Math.max(sealRatio, big[Math.floor(big.length * 0.9)] + 0.1);
    }
    const reasons = new Map();
    const kept = comps.filter((c) => {
      let why = null;
      if (c.area < minArea) why = 'dust';
      else if (c.area < 400 && !o.invert && redness && redness(c) > sealRatio) why = 'seal';
      else if (o.maxArea && c.area > o.maxArea) why = 'damage';
      else if (blob(c)) why = 'blob';
      else if (lineFrag(c)) why = 'line';
      if (why) reasons.set(c.id, why);
      return !why;
    });
    kept.reasons = reasons; kept.sealRatio = sealRatio;
    return kept;
  }
  function maskFromComponents(mask, comps) { mask.fill(0); for (const c of comps) for (const i of c.px) mask[i] = 1; return mask; }

  // ---- 3. columns ---------------------------------------------------------------
  function columnProfile(mask, W, R) {
    const prof = new Float32Array(W);
    for (let y = R.y0; y < R.y1; y++) for (let x = R.x0; x < R.x1; x++) if (mask[y * W + x]) prof[x]++;
    return prof;
  }
  const median = (arr) => { const a = arr.slice().sort((p, q) => p - q); return a[a.length >> 1] || 1; };
  // o: { smooth, threshold, thresholdFrac, gap, minWidth, split, narrow,
  //      dropNarrow, componentAware }. comps: the kept components — a wide
  // run is only split where no component straddles the cut, so a small
  // character written between two columns is never cut in half.
  // Returns { runs (right to left), sm, thr, p95, log }.
  function findColumns(prof, R, o = {}, comps = []) {
    const W = prof.length, log = [];
    const sm = new Float32Array(W);
    const smR = o.smooth ?? 3;
    for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let k = -smR; k <= smR; k++) { if (x + k >= 0 && x + k < W) { s += prof[x + k]; n++; } } sm[x] = s / n; }
    const sorted = Array.from(sm.slice(R.x0, R.x1)).sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;
    const thr = o.threshold ?? p95 * (o.thresholdFrac ?? 0.15);
    log.push(`column profile p95 ${p95.toFixed(0)}, threshold ${thr.toFixed(0)}`);
    let runs = []; let start = -1;
    for (let x = R.x0; x <= R.x1; x++) {
      const on = x < R.x1 && sm[x] > thr;
      if (on && start < 0) start = x;
      if (!on && start >= 0) { runs.push({ x0: start, x1: x }); start = -1; }
    }
    const minGap = o.gap ?? 14;
    const merged = [];
    for (const r of runs) { const last = merged[merged.length - 1]; if (last && r.x0 - last.x1 < minGap) last.x1 = r.x1; else merged.push({ ...r }); }
    const inkOf = (r) => { let s = 0; for (let x = r.x0; x < r.x1; x++) s += prof[x]; return s; };
    runs = merged.map((r) => ({ ...r, ink: inkOf(r) })).filter((r) => r.x1 - r.x0 >= (o.minWidth ?? 40) && r.ink > 400);
    // a run much wider than the others is two columns bridged by something
    // (a small inserted character, a stroke reaching across): split it at the
    // emptiest place inside. With componentAware the cut also pays for every
    // component it passes through, by how deep it cuts into it, so it slides
    // off a small character written between the columns and lands in the
    // gap beside it instead of slicing the character in half.
    const aware = o.componentAware ?? true;
    const depthCost = (x) => { let s = 0; for (const c of comps) if (c.x0 < x && c.x1 > x) s += Math.min(x - c.x0, c.x1 - x); return s * (o.cutPenalty ?? 4); };
    for (let guard = 0; guard < 12; guard++) {
      const medW = median(runs.map((r) => r.x1 - r.x0));
      const wide = runs.findIndex((r) => r.x1 - r.x0 > medW * (o.split ?? 1.5));
      if (wide < 0) break;
      const r = runs[wide], w = r.x1 - r.x0;
      let bx = -1, bv = Infinity;
      const lo = Math.round(r.x0 + w * 0.22), hi = Math.round(r.x1 - w * 0.22);
      for (let x = lo; x <= hi; x++) { const v = sm[x] + (aware ? depthCost(x) : 0); if (v < bv) { bv = v; bx = x; } }
      const a = { x0: r.x0, x1: bx, ink: inkOf({ x0: r.x0, x1: bx }) }, b = { x0: bx, x1: r.x1, ink: inkOf({ x0: bx, x1: r.x1 }) };
      runs.splice(wide, 1, a, b);
      log.push(`split wide run ${r.x0}-${r.x1} at ${bx} (profile ${sm[bx].toFixed(0)}${aware ? `, cut depth ${(depthCost(bx) / (o.cutPenalty ?? 4)).toFixed(0)} px` : ''})`);
    }
    runs.sort((a, b) => b.x0 - a.x0); // right to left = reading order
    {
      const medW = median(runs.map((r) => r.x1 - r.x0)), medInk = median(runs.map((r) => r.ink));
      for (let i = runs.length - 1; i >= 0; i--) {
        const r = runs[i], w = r.x1 - r.x0;
        const narrow = w < medW * (o.narrow ?? 0.55) || (o.narrowByInk && w < medW * 0.8 && r.ink < medInk * 0.3);
        if (narrow && i + 1 < runs.length) {
          if (o.dropNarrow) { log.push(`drop narrow run ${r.x0}-${r.x1}`); runs.splice(i, 1); continue; }
          log.push(`merge narrow run ${r.x0}-${r.x1} into the column on its left`); runs[i + 1].x1 = r.x1; runs[i + 1].ink += r.ink; runs.splice(i, 1);
        }
      }
    }
    return { runs, sm, thr, p95, log };
  }

  // A component that reaches across a column boundary is usually two things
  // joined by a hair of ink (a stroke tip touching the next column, a small
  // character written between the columns touching its neighbour). Where
  // its own ink per x drops to a hair (≤ bridge px) near the boundary, cut
  // it there into two components. Solid characters that merely overlap the
  // boundary are left whole, to be assigned by their centre.
  function splitAtColumns(comps, runs, W, o = {}) {
    const bridge = o.bridge ?? 2, reach = o.reach ?? 30;
    const bounds = runs.slice(0, -1).map((r, i) => (r.x0 + runs[i + 1].x1) / 2); // runs are right to left
    const out = [];
    const remake = (px, id) => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, sx = 0, sy = 0;
      for (const i of px) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; sx += x; sy += y; }
      return { id, px, x0, x1: x1 + 1, y0, y1: y1 + 1, area: px.length, cx: sx / px.length, cy: sy / px.length };
    };
    let next = comps.length;
    for (const c of comps) {
      const b = bounds.find((x) => c.x0 < x - 4 && c.x1 > x + 4);
      if (b === undefined) { out.push(c); continue; }
      const prof = new Map();
      for (const i of c.px) { const x = i % W; prof.set(x, (prof.get(x) || 0) + 1); }
      let bx = -1, bv = Infinity;
      for (let x = Math.max(c.x0 + 4, Math.round(b - reach)); x <= Math.min(c.x1 - 5, Math.round(b + reach)); x++) { const v = prof.get(x) || 0; if (v < bv) { bv = v; bx = x; } }
      if (bx < 0 || bv > bridge) { out.push(c); continue; }
      const left = c.px.filter((i) => i % W <= bx), right = c.px.filter((i) => i % W > bx);
      if (left.length && right.length) { out.push(remake(left, c.id), remake(right, next++)); c.splitAt = bx; }
      else out.push(c);
    }
    return out;
  }

  // ---- 4. cells --------------------------------------------------------------
  // The N-1 cuts of a column: a dynamic programme over cut rows, cheap where
  // the row is empty (cost = ink fraction × 3) and where the cells come out
  // even (lambda × relative deviation²). Returns { cuts, cost, hbar }.
  // depth: optional per-row penalty for cutting through a component (how
  // deep into it the row lies, in cell heights), so cuts prefer the gaps
  // between characters to the thin rows inside one.
  // share: optional expected share of the column's ink per cell (from the
  // stroke counts of the characters), so a four-stroke 丑 between a 癸 and a
  // 暮 gets a small cell and the cut lands where the ink says it should.
  // occ: optional per-row count of what would land in a cell there (component
  // centroids, plus the rows of components tall enough to be split across
  // cells); every cell must then hold something, so a character can never be
  // given an empty cell while its ink slides into the next one.
  // blank: optional per-cell flags for the blank cells of the text (a gap
  // left in the column): those must stay empty instead.
  function dpCuts(rowInk, cw, N, top, bottom, lambda = 1.2, depth = null, share = null, areaWeight = 1.0, occ = null, blank = null) {
    const cost = (y) => rowInk[y] / cw + (depth ? depth[y] : 0);
    const hbar = (bottom - top) / N;
    const P = new Float64Array(bottom - top + 1);
    for (let y = top; y < bottom; y++) P[y - top + 1] = P[y - top] + rowInk[y];
    const totalInk = P[bottom - top] || 1;
    const O = new Float64Array(bottom - top + 1);
    if (occ) for (let y = top; y < bottom; y++) O[y - top + 1] = O[y - top] + occ[y];
    const has = (a, b) => O[b - top] - O[a - top] > 0;
    const filled = (a, b, k) => !occ || (blank && blank[k] ? !has(a, b) : has(a, b));
    const cellCost = (k, a, b) => {
      const dev = ((b - a) - hbar) / hbar;
      let c = lambda * dev * dev;
      if (share) { const area = (P[b - top] - P[a - top]) / totalInk; c += areaWeight * Math.abs(area - share[k]) * N; }
      return c;
    };
    const cuts = [top];
    let total = 0;
    if (N > 1) {
      const lo = (i) => Math.max(top + 1, Math.round(top + i * hbar - hbar * 0.9));
      const hi = (i) => Math.min(bottom - 1, Math.round(top + i * hbar + hbar * 0.9));
      let prev = new Map([[top, { c: 0, from: null }]]);
      const layers = [];
      const minCell = hbar * 0.35;               // no character is this small
      for (let i = 1; i < N; i++) {
        const cur = new Map();
        for (let y = lo(i); y <= hi(i); y++) {
          let best = null;
          for (const [py, st] of prev) {
            if (y - py < minCell || !filled(py, y, i - 1)) continue;
            const c = st.c + cost(y) * 3 + cellCost(i - 1, py, y);
            if (!best || c < best.c) best = { c, from: py };
          }
          if (best) cur.set(y, best);
        }
        layers.push(cur); prev = cur;
      }
      let bestEnd = null;
      for (const [py, st] of prev) { if (bottom - py < minCell || !filled(py, bottom, N - 1)) continue; const c = st.c + cellCost(N - 1, py, bottom); if (!bestEnd || c < bestEnd.c) bestEnd = { c, y: py }; }
      if (!bestEnd) for (const [py, st] of prev) { const c = st.c + cellCost(N - 1, py, bottom); if (!bestEnd || c < bestEnd.c) bestEnd = { c, y: py }; }
      if (!bestEnd) return null;
      total = bestEnd.c;
      let y = bestEnd.y;
      const back = [y];
      for (let i = layers.length - 1; i >= 1; i--) { y = layers[i].get(y).from; back.push(y); }
      back.reverse();
      cuts.push(...back);
    }
    cuts.push(bottom);
    return { cuts, cost: total, hbar };
  }

  // One column. comps: the components whose centre lies in the column. col:
  // {x0, x1}. o: { text (array of characters) | stream (array, consumed),
  //   k, shapeWeight, lambda, grid: {y0, pitch}, inserts: [{after, text}], H }
  // Returns { text, N, cuts, top, bottom, hbar, cells: [[pixel index]],
  //   extra: [{ch, px, after, small}], candidates (stream mode), log }
  function cutColumn(comps, col, R, W, H, o = {}) {
    const log = [];
    const cw = col.x1 - col.x0;
    let big = comps.slice();
    let text = o.text ? o.text.slice() : null;
    let N = text ? text.length : 0;
    // inserts: small characters written beside the column, to its right,
    // between the characters `after` and `after + 1`. Components that lie
    // wholly in that box are the insert's; a component that reaches into the
    // box from the column (a stroke of the neighbour touching the small
    // character) is `shared`, and its strokes are divided later.
    const extra = [], inserts = [];
    for (const it of o.inserts || []) {
      let t0 = R.y1, t1 = R.y0;
      for (const c of big) { if (c.y0 < t0) t0 = c.y0; if (c.y1 > t1) t1 = c.y1; }
      const hr = (t1 - t0) / (N || 1);
      // the box beside the column where the small characters are: from half a
      // cell below the character they follow, two cells tall, unless the spec
      // says where (it.from, it.span, in cells from the column's top)
      const yA = t0 + (it.from ?? it.after + 0.5) * hr, yB = yA + (it.span ?? 2) * hr, xA = col.x0 + cw * 0.6;
      const side = big.filter((c) => c.y0 >= yA && c.y1 <= yB && c.x0 > xA && (c.y1 - c.y0) < hr * 0.7);
      side.sort((a, b) => a.y0 - b.y0);
      const n = [...it.text].length;
      const gaps = side.slice(1).map((c, k) => ({ k: k + 1, g: c.y0 - side[k].y1 })).sort((a, b) => b.g - a.g).slice(0, n - 1).map((g) => g.k).sort((a, b) => a - b);
      const groups = []; let s = 0;
      for (const k of [...gaps, side.length]) { groups.push(side.slice(s, k)); s = k; }
      groups.forEach((grp, k) => { if (grp.length) extra.push({ ch: [...it.text][k], px: grp.flatMap((c) => c.px), comps: grp, after: it.after, small: true }); });
      big = big.filter((c) => !side.includes(c));
      const box = { x0: xA, x1: col.x1 + cw * 0.4, y0: yA, y1: yB };
      const shared = big.filter((c) => c.x1 > xA + 4 && c.y1 > yA && c.y0 < yB && !(c.y0 >= yA && c.y1 <= yB && c.x0 > xA));
      inserts.push({ after: it.after, chars: [...it.text], box, comps: side, shared });
      log.push(`insert ${it.text} — ${side.length} components in the box, ${shared.length} shared with the column`);
    }
    let rowInk = new Float32Array(H);
    for (const c of big) for (const i of c.px) rowInk[(i / W) | 0]++;
    let top = R.y0, bottom = R.y1 - 1;
    while (top < bottom && rowInk[top] === 0) top++;
    while (bottom > top && rowInk[bottom] === 0) bottom--;
    bottom++;
    // a short column (a title, a signature) whose ink runs far longer than its
    // text needs at the work's usual character size (o.expectCell) has
    // something else in it — on a rubbing, scratches and damage. With
    // o.trimSparse, keep the window that holds the most ink for its text and
    // leave the components outside it out of this column.
    if (o.trimSparse && o.expectCell && N && !o.stream && bottom - top > N * o.expectCell * (o.sparseRatio ?? 1.3)) {
      const Lw = Math.round(N * o.expectCell * 1.12);
      const P = new Float64Array(bottom - top + 1);
      for (let y = top; y < bottom; y++) P[y - top + 1] = P[y - top] + rowInk[y];
      let best = top, bestInk = -1;
      for (let a = top; a + Lw <= bottom; a += 2) { const ink = P[a + Lw - top] - P[a - top]; if (ink > bestInk) { bestInk = ink; best = a; } }
      // let the window's edges settle in the emptiest rows nearby
      const slack = Math.round(o.expectCell * 0.35);
      const quiet = (y0, y1) => { let by = y0, bv = Infinity; for (let y = Math.max(top, y0); y <= Math.min(bottom - 1, y1); y++) if (rowInk[y] < bv) { bv = rowInk[y]; by = y; } return by; };
      const wTop = quiet(best - slack, best + slack), wBot = quiet(best + Lw - slack, best + Lw + slack);
      const inside = (c) => c.cy >= wTop && c.cy < wBot;
      const out = big.filter((c) => !inside(c));
      if (out.length) {
        big = big.filter(inside);
        rowInk = new Float32Array(H);
        for (const c of big) for (const i of c.px) rowInk[(i / W) | 0]++;
        top = wTop; bottom = wBot;
        while (top < bottom && rowInk[top] === 0) top++;
        while (bottom > top && rowInk[bottom - 1] === 0) bottom--;
        log.push(`sparse column: kept rows ${top}-${bottom} for ${N} characters, left out ${out.length} component${out.length > 1 ? 's' : ''} (${out.reduce((a, c) => a + c.area, 0)} px)`);
      }
    }
    const lambda = o.lambda ?? 1.2;
    // cutting through the body of a character costs more than cutting a
    // thin row: penalise rows by how deep they lie inside a component (only
    // components of about one character's height — a cursive sweep down the
    // whole column has to be cut somewhere)
    const depth = new Float32Array(H);
    {
      const hr = (bottom - top) / Math.max(1, N || Math.round((bottom - top) / cw));
      for (const c of big) {
        if ((c.y1 - c.y0) > hr * 1.6) continue;
        for (let y = c.y0; y < c.y1; y++) depth[y] += Math.min(y - c.y0, c.y1 - y) / hr * (o.depthWeight ?? 0.6);
      }
    }
    let candidates = null;
    if (o.stream) {
      // how many characters this column holds: the cut cost plus a prior on
      // the cell shape (height ≈ k × column width)
      const k = o.k ?? 1.0, h = bottom - top;
      const nGuess = h / (cw * k);
      candidates = [];
      let best = null;
      for (let n = Math.max(1, Math.floor(nGuess * 0.55)); n <= Math.min(o.stream.length, Math.ceil(nGuess * 1.6)); n++) {
        const r = dpCuts(rowInk, cw, n, top, bottom, lambda, depth); if (!r) continue;
        const shape = Math.log((h / n) / (cw * k));
        const score = r.cost / n + (o.shapeWeight ?? 0.9) * shape * shape;
        candidates.push({ n, score, cutCost: r.cost / n, shape: shape * shape, cuts: r.cuts });
        if (!best || score < best.score) best = { n, score };
      }
      N = best ? best.n : Math.max(1, Math.round(nGuess));
      text = o.stream.splice(0, N);
      N = text.length;
    }
    let cuts;
    if (o.grid) {
      top = o.grid.y0; bottom = Math.min(R.y1, o.grid.y0 + o.grid.pitch * N);
      cuts = [top]; for (let k = 1; k < N; k++) cuts.push(Math.round(top + k * o.grid.pitch)); cuts.push(bottom);
    } else {
      // expected share of the ink per character from the stroke counts of
      // the text (unknown characters take the average)
      // (damped: a two-stroke 又 written large has far more than a fifth of
      // the ink of a ten-stroke neighbour)
      const blank = text ? text.map((ch) => ch === ' ') : null;
      let share = null;
      if (o.strokeCounts && N > 1) {
        const known = o.strokeCounts.filter((n) => n), mean = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 1;
        const sc = o.strokeCounts.map((n, k) => (blank && blank[k] ? 0.05 : (n || mean) + (o.strokeDamp ?? 5))), sum = sc.reduce((a, b) => a + b, 0);
        share = sc.map((n) => n / sum);
      }
      // what a cell would receive: a component by its centroid, a tall
      // component (split at the cuts) by its rows
      const occ = new Float32Array(H);
      const hr = (bottom - top) / Math.max(1, N);
      for (const c of big) {
        if ((c.y1 - c.y0) >= hr * 1.25) { for (let y = c.y0; y < c.y1; y++) occ[y] += 1; }
        else occ[Math.round(c.cy)] += 1;
      }
      const r = dpCuts(rowInk, cw, Math.max(1, N), top, bottom, lambda, depth, share, o.areaWeight, occ, blank && blank.some(Boolean) ? blank : null) || dpCuts(rowInk, cw, Math.max(1, N), top, bottom, lambda, depth, share, o.areaWeight);
      cuts = r.cuts;
    }
    const hbar = (bottom - top) / Math.max(1, N);
    // assign components to cells by centroid; split tall components at the cuts
    const cellOf = (y) => { let k = 0; while (k < N - 1 && y >= cuts[k + 1]) k++; return k; };
    const cells = (text || []).map(() => []);
    const split = [];
    for (const c of big) {
      const spanTop = cellOf(c.y0), spanBot = cellOf(c.y1 - 1);
      if (spanTop === spanBot || (c.y1 - c.y0) < hbar * 1.25) {
        cells[cellOf(c.cy)].push(...c.px);
      } else {
        split.push(c);
        for (const i of c.px) cells[cellOf((i / W) | 0)].push(i);
      }
    }
    return { text, N, cuts, top, bottom, hbar, cells, extra, rowInk, depth, candidates, split, log, big, inserts, col };
  }

  // ---- 5. strokes per component, characters from strokes ------------------------
  // The strokes of one connected component, in scan pixels (unordered).
  function traceComponent(c, W, o = {}) {
    const pad = 3, bw = c.x1 - c.x0 + pad * 2, bh = c.y1 - c.y0 + pad * 2;
    const bm = { w: bw, h: bh, data: new Uint8Array(bw * bh) };
    for (const i of c.px) bm.data[(((i / W) | 0) - c.y0 + pad) * bw + (i % W - c.x0 + pad)] = 1;
    const raw = Skeleton.extractRaw(bm, o.extract || {});
    const out = raw.strokes.map((s) => s.map((q) => ({ x: q.x - pad + c.x0, y: q.y - pad + c.y0, w: q.w })));
    out.cover = raw.cover;
    if (o.tally) { o.tally.ink = (o.tally.ink || 0) + raw.cover.ink; o.tally.covered = (o.tally.covered || 0) + raw.cover.covered; }
    return out;
  }
  const strokeMid = (s) => { let L = 0; const cum = [0]; for (let i = 1; i < s.length; i++) { L += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y); cum.push(L); } const h = L / 2; let i = 0; while (i < cum.length - 1 && cum[i + 1] < h) i++; return s[i]; };
  // strokes are written out with the samples they need (position and width
  // within 0.3 px of the dense measurement) to a tenth of a pixel
  const roundStroke = (s) => Skeleton.simplify(s, 0.3).map((q) => [Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10, Math.round(q.w * 10) / 10]);
  // a character's box: its ink and its strokes together, in whole pixels
  const boxOf = (strokes, px, W) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const st of strokes) for (const q of st) { const r = q.w / 2; if (q.x - r < x0) x0 = q.x - r; if (q.x + r > x1) x1 = q.x + r; if (q.y - r < y0) y0 = q.y - r; if (q.y + r > y1) y1 = q.y + r; }
    if (px) for (const i of px) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x + 1 > x1) x1 = x + 1; if (y < y0) y0 = y; if (y + 1 > y1) y1 = y + 1; }
    x0 = Math.floor(x0); y0 = Math.floor(y0);
    return [x0, y0, Math.ceil(x1) - x0, Math.ceil(y1) - y0];
  };
  const pushAll = (dst, src) => { for (let i = 0; i < src.length; i++) dst.push(src[i]); };
  // the ink pixels of a component divided among the owners of its strokes:
  // each pixel goes to the stroke whose painted edge is nearest
  // (strokes: [[{x, y, w}]], owners: one key per stroke). Returns key → pixels.
  function dividePixels(px, W, strokes, owners) {
    const out = new Map();
    const keys = [...new Set(owners)];
    if (keys.length <= 1) { out.set(keys[0], px.slice()); return out; }
    for (const k of keys) out.set(k, []);
    const samples = [];
    strokes.forEach((st, si) => { for (const q of st) samples.push(q.x, q.y, q.w / 2, si); });
    for (const i of px) {
      const x = i % W + 0.5, y = ((i / W) | 0) + 0.5;
      let best = 0, bd = Infinity;
      for (let k = 0; k < samples.length; k += 4) {
        const d = Math.hypot(samples[k] - x, samples[k + 1] - y) - samples[k + 2];
        if (d < bd) { bd = d; best = samples[k + 3]; }
      }
      out.get(owners[best]).push(i);
    }
    return out;
  }

  // The characters of a column from a cutColumn result: every component is
  // traced on its own, then its strokes go to characters — a component that
  // stands in one cell gives all its strokes to that character; one that
  // spans cells (cursive that never lifts) gives each stroke to the cell its
  // middle lies in; one shared between the column and a small character
  // written beside it gives the strokes that lie in the insert's box to the
  // insert. Then every character's strokes are ordered and oriented with its
  // template (medianFor(ch) → medians or null). Returns records in reading
  // order: { ch, box, strokes, small?, order }.
  // Every character also gets the ink pixels it owns (rec.px, scan pixel
  // indices; not written out): the whole component when all its strokes are
  // the character's, otherwise the pixels nearest the character's strokes.
  // That ink is what the outline is drawn around and what the strokes are
  // checked against.
  function traceColumn(cut, W, medianFor, o = {}) {
    const { text, N, cuts, hbar, big, inserts } = cut;
    const cellOf = (y) => { let k = 0; while (k < N - 1 && y >= cuts[k + 1]) k++; return k; };
    const perCell = text.map(() => []), pxCell = text.map(() => []);
    const perInsert = inserts.map(() => []), pxInsert = inserts.map(() => []);
    const inBox = (q, b) => q.x >= b.x0 && q.x < b.x1 && q.y >= b.y0 && q.y < b.y1;
    const giveTo = (key, list) => pushAll(key < 0 ? pxInsert[-1 - key] : pxCell[key], list);
    // a stroke that runs on from one character into the next (a link, a long
    // tail) is cut where it crosses the cut between their cells; a piece too
    // short to matter stays with its neighbour
    const splitAtCuts = (st) => {
      if (st.length < 3) return [st];
      const ws = st.map((q) => q.w).sort((a, b) => a - b), minLen = Math.max(2 * ws[ws.length >> 1], 0.12 * hbar);
      const pieces = []; let cur = [st[0]];
      for (let i = 1; i < st.length; i++) {
        if (cellOf(st[i].y) !== cellOf(st[i - 1].y)) { cur.push(st[i]); pieces.push(cur); cur = [st[i]]; }
        else cur.push(st[i]);
      }
      pieces.push(cur);
      const len = (pp) => { let L = 0; for (let i = 1; i < pp.length; i++) L += Math.hypot(pp[i].x - pp[i - 1].x, pp[i].y - pp[i - 1].y); return L; };
      // merge short pieces into the longer neighbour
      for (let changed = true; changed && pieces.length > 1;) {
        changed = false;
        for (let i = 0; i < pieces.length; i++) {
          if (len(pieces[i]) >= minLen) continue;
          const j = i === 0 ? 1 : i === pieces.length - 1 ? i - 1 : (len(pieces[i - 1]) >= len(pieces[i + 1]) ? i - 1 : i + 1);
          pieces[Math.min(i, j)] = j < i ? pieces[j].concat(pieces[i].slice(1)) : pieces[i].concat(pieces[j].slice(1));
          pieces.splice(Math.max(i, j), 1); changed = true; break;
        }
      }
      return pieces;
    };
    for (const c of big) {
      let strokes = traceComponent(c, W, o);
      const spans = cellOf(c.y0) !== cellOf(c.y1 - 1) && (c.y1 - c.y0) >= hbar * 1.25;
      if (spans) strokes = strokes.flatMap(splitAtCuts);
      const sharedWith = inserts.findIndex((it) => it.shared.includes(c));
      // owner key: cell index k ≥ 0, insert j as -1 - j
      const owners = strokes.map((s) => {
        if (sharedWith >= 0) {
          const inside = s.filter((q) => inBox(q, inserts[sharedWith].box)).length / s.length;
          if (inside >= (o.insertFrac ?? 0.6)) return -1 - sharedWith;
        }
        return spans ? cellOf(strokeMid(s).y) : cellOf(c.cy);
      });
      strokes.forEach((s, i) => (owners[i] < 0 ? perInsert[-1 - owners[i]] : perCell[owners[i]]).push(s));
      if (!strokes.length) { giveTo(cellOf(c.cy), c.px); continue; }
      for (const [key, list] of dividePixels(c.px, W, strokes, owners)) giveTo(key, list);
    }
    inserts.forEach((it, k) => { for (const c of it.comps) { perInsert[k].push(...traceComponent(c, W, o)); pushAll(pxInsert[k], c.px); } });
    // every character is parsed again from the ink it owns: cut into strokes
    // and ordered by its template when that fits (Skeleton.parseChar), so a
    // stroke is a stroke of the character and not a run of connected ink
    const record = (ch, strokes, px, flags) => {
      if (!strokes.length) return null;
      const med = medianFor ? medianFor(ch) : null;
      if (px && px.length && o.parse !== false) {
        const r = parseChar(px, W, med, { ...(o.extract || {}), flow: o.flow, cursive: o.flow });
        if (r && r.strokes.length) return { ch, box: boxOf(r.strokes, px, W), strokes: r.strokes.map(roundStroke), t: r.tIndex, px, order: { method: r.method, quality: r.quality }, ...flags };
      }
      const ord = Skeleton.order(strokes, med, { flow: o.flow });
      return { ch, box: boxOf(ord.strokes, px, W), strokes: ord.strokes.map(roundStroke), px, order: { method: ord.method, info: ord.info }, ...flags };
    };
    const out = [];
    text.forEach((ch, k) => {
      const rec = ch === ' ' ? null : record(ch, perCell[k], pxCell[k], {});
      if (rec) out.push(rec);
      inserts.forEach((it, j) => {
        if (it.after !== k) return;
        // divide the insert's strokes among its characters, top to bottom, at the widest gaps
        const ss = perInsert[j].map((s) => ({ s, y0: Math.min(...s.map((q) => q.y)), y1: Math.max(...s.map((q) => q.y)) })).sort((a, b) => a.y0 - b.y0);
        const n = it.chars.length;
        let groups = [ss];
        if (n > 1 && ss.length > 1) {
          let reach = -Infinity;
          const gaps = ss.map((e, i) => { const g = i ? e.y0 - reach : -Infinity; reach = Math.max(reach, e.y1); return { i, g }; }).slice(1).sort((a, b) => b.g - a.g).slice(0, n - 1).map((g) => g.i).sort((a, b) => a - b);
          groups = []; let s0 = 0;
          for (const i of [...gaps, ss.length]) { groups.push(ss.slice(s0, i)); s0 = i; }
        }
        // and its pixels: each to the character of the nearest stroke
        const flat = [], owner = [];
        groups.forEach((g, gi) => g.forEach((e) => { flat.push(e.s); owner.push(gi); }));
        const pxOf = flat.length ? dividePixels(pxInsert[j], W, flat, owner) : new Map();
        groups.forEach((g, i) => { const r = record(it.chars[i] || '?', g.map((e) => e.s), pxOf.get(i) || [], { small: true }); if (r) out.push(r); });
      });
    });
    return out;
  }

  // one character's strokes from the scan pixels it owns (see Skeleton.parseChar),
  // in scan coordinates
  function parseChar(px, W, medians, o = {}) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const i of px) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = 3, bw = x1 - x0 + 1 + pad * 2, bh = y1 - y0 + 1 + pad * 2;
    const bm = { w: bw, h: bh, data: new Uint8Array(bw * bh) };
    for (const i of px) bm.data[(((i / W) | 0) - y0 + pad) * bw + (i % W - x0 + pad)] = 1;
    const r = Skeleton.parseChar(bm, medians, o);
    r.strokes = r.strokes.map((s) => s.map((q) => ({ x: q.x - pad + x0, y: q.y - pad + y0, w: q.w })));
    return r;
  }

  // ---- 6. outlines and fidelity ---------------------------------------------
  // The outline of a set of ink pixels (scan pixel indices, image width W)
  // as closed rings in scan coordinates, where pixel (i, j) covers
  // [i, i+1) × [j, j+1). The mask is blurred a little (3 × 3 binomial) and
  // traced at the half-way level with marching squares, which follows the
  // edge between pixels smoothly instead of in stairs; each ring is then
  // simplified to within o.tol px (default 0.35). Holes are rings too, so
  // fill with the even-odd rule. Rings smaller than o.minArea px² (default
  // 3) are dropped.
  function outline(px, W, o = {}) {
    if (!px || !px.length) return [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const i of px) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = 2, w = x1 - x0 + 1 + pad * 2, h = y1 - y0 + 1 + pad * 2;
    const m = new Float32Array(w * h);
    for (const i of px) m[(((i / W) | 0) - y0 + pad) * w + (i % W - x0 + pad)] = 1;
    // separable [1 2 1] / 4 blur
    const t = new Float32Array(w * h), v = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; t[i] = (m[i - 1] + 2 * m[i] + m[i + 1]) / 4; }
    for (let y = 1; y < h - 1; y++) for (let x = 0; x < w; x++) { const i = y * w + x; v[i] = (t[i - w] + 2 * t[i] + t[i + w]) / 4; }
    const iso = 0.5, at = (x, y) => v[y * w + x];
    // edge keys: horizontal edge (x, y)-(x+1, y) → 2 (y w + x); vertical (x, y)-(x, y+1) → 2 (y w + x) + 1
    const H = (x, y) => 2 * (y * w + x), V = (x, y) => 2 * (y * w + x) + 1;
    const adj = new Map();
    const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
      const tl = at(x, y) > iso, tr = at(x + 1, y) > iso, br = at(x + 1, y + 1) > iso, bl = at(x, y + 1) > iso;
      const c = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
      if (c === 0 || c === 15) continue;
      const T = H(x, y), R = V(x + 1, y), B = H(x, y + 1), L = V(x, y);
      const mid = (at(x, y) + at(x + 1, y) + at(x + 1, y + 1) + at(x, y + 1)) / 4 > iso;
      switch (c) {
        case 1: case 14: link(L, B); break;
        case 2: case 13: link(B, R); break;
        case 3: case 12: link(L, R); break;
        case 4: case 11: link(T, R); break;
        case 6: case 9: link(T, B); break;
        case 7: case 8: link(L, T); break;
        case 5: if (mid) { link(L, T); link(B, R); } else { link(T, R); link(L, B); } break;
        case 10: if (mid) { link(T, R); link(L, B); } else { link(L, T); link(B, R); } break;
      }
    }
    const pos = (k) => {
      const e = k >> 1, gx = e % w, gy = (e / w) | 0;
      let ax = gx, ay = gy, bx = gx + 1, by = gy;
      if (k & 1) { bx = gx; by = gy + 1; }
      const va = at(ax, ay), vb = at(bx, by), u = Math.abs(vb - va) > 1e-9 ? (iso - va) / (vb - va) : 0.5;
      return { x: ax + (bx - ax) * u + 0.5 + x0 - pad, y: ay + (by - ay) * u + 0.5 + y0 - pad };
    };
    const seen = new Set(), rings = [];
    for (const k0 of adj.keys()) {
      if (seen.has(k0)) continue;
      const ring = []; let prev = -1, cur = k0, guard = 0;
      while (cur !== undefined && !seen.has(cur) && guard++ < 1e6) {
        seen.add(cur); ring.push(pos(cur));
        const nb = adj.get(cur); const next = nb[0] !== prev ? nb[0] : nb[1];
        prev = cur; cur = next;
      }
      if (ring.length >= 3) rings.push(ring);
    }
    const tol = o.tol ?? 0.35, minArea = o.minArea ?? 3;
    const area = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.y - q.x * p.y; } return a / 2; };
    return rings.filter((r) => Math.abs(area(r)) >= minArea).map((r) => simplifyRing(r, tol));
  }
  // Douglas–Peucker on a closed ring: split at the point farthest from the first
  function simplifyRing(r, tol) {
    if (r.length <= 4) return r;
    let far = 0, fd = -1;
    for (let i = 1; i < r.length; i++) { const d = (r[i].x - r[0].x) ** 2 + (r[i].y - r[0].y) ** 2; if (d > fd) { fd = d; far = i; } }
    const dp = (pts) => Skeleton.simplify(pts.map((q) => ({ x: q.x, y: q.y, w: 0 })), tol);
    const a = dp(r.slice(0, far + 1)), b = dp(r.slice(far).concat([r[0]]));
    return a.concat(b.slice(1, -1)).map((q) => ({ x: q.x, y: q.y }));
  }
  // How much of a character's ink its strokes paint, by the brush's footprint
  // (Skeleton.hits): { ink, covered, recall, precision, residual } where
  // residual is a list of the scan pixel indices left unpainted.
  // strokes: [[x, y, w], ...] as written out, or [{x, y, w}].
  function charFidelity(strokes, px, W) {
    if (!px || !px.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const i of px) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = 4; x0 -= pad; y0 -= pad;
    const w = x1 - x0 + 1 + pad, h = y1 - y0 + 1 + pad;
    const bm = { w, h, data: new Uint8Array(w * h) };
    for (const i of px) bm.data[(((i / W) | 0) - y0) * w + (i % W - x0)] = 1;
    const local = strokes.map((s) => s.map((q) => (Array.isArray(q) ? { x: q[0] - x0, y: q[1] - y0, w: q[2] } : { x: q.x - x0, y: q.y - y0, w: q.w })));
    const f = Skeleton.fidelity(local, bm, { residual: true });
    const residual = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (f.residual[y * w + x]) residual.push((y + y0) * W + x + x0);
    return { ink: f.ink, covered: f.covered, recall: f.recall, precision: f.precision, residual };
  }

  // ---- 6. one character from its pixels (the older path, kept for comparison) ---
  // px: pixel indices of the character's ink. Returns { ch, box: [x, y, w, h],
  // strokes: [[x, y, w], ...] (scan px, 0.1 px), bitmap, result } — result is
  // Skeleton.extract's output for the demo.
  function traceChar(px, W, ch, medians, o = {}) {
    if (!px.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const i of px) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = 3, bw = x1 - x0 + 1 + pad * 2, bh = y1 - y0 + 1 + pad * 2;
    const bm = { w: bw, h: bh, data: new Uint8Array(bw * bh) };
    for (const i of px) { const x = i % W - x0 + pad, y = ((i / W) | 0) - y0 + pad; bm.data[y * bw + x] = 1; }
    const res = Skeleton.extract(bm, { medians: medians || null, ...(o.extract || {}) });
    const strokes = res.strokes.map((s) => s.map((q) => [Math.round((q.x - pad + x0) * 10) / 10, Math.round((q.y - pad + y0) * 10) / 10, Math.round(q.w * 10) / 10]));
    return { ch, box: [x0, y0, x1 - x0 + 1, y1 - y0 + 1], strokes, bitmap: bm, offset: [x0 - pad, y0 - pad], result: res };
  }

  return { region, inkMask, classify, eraseRules, despeckle, components, filterComponents, maskFromComponents, columnProfile, findColumns, splitAtColumns, dpCuts, cutColumn, traceComponent, traceColumn, parseChar, outline, charFidelity, traceChar, median };
});
