// The demo scenes: each one runs a real stage of the tracer on a crop of a
// scan and draws what it does, as a function of time t in 0..1.
(() => {
  const D = window.Demo, Core = window.TraceCore, Sk = window.Skeleton;
  const { W, H, colors, font, ease, stage, clamp, hue, hsl } = D;
  const px2 = (p) => ({ x: p[0], y: p[1] });

  // ---- shared state: the 蘭亭序 crop (columns 1–4 of the 神龍本) ------------------
  const LANTING_COLS = ['永和九年歲在癸丑暮春之初會', '于會稽山陰之蘭亭脩禊事', '也羣賢畢至少長咸集此地', '有峻領茂林脩竹又有清流激'];
  const LANTING_INSERTS = { 3: [{ after: 0, text: '崇山' }] };
  let lantingP = null;
  function lanting() {
    if (lantingP) return lantingP;
    lantingP = (async () => {
      const { canvas, px } = await D.loadImage('assets/demo/lanting-cols.jpg');
      const IW = px.width, IH = px.height; const R = { x0: 0, x1: IW, y0: 0, y1: IH };
      const opts = { lum: 110, red: 40 };
      const mask = Core.inkMask(px, R, opts); Core.despeckle(mask, IW, R);
      const comps = Core.components(mask, IW, R);
      const redness = (c) => { let s = 0; for (const i of c.px) { const j = i * 4; s += px.data[j] / (px.data[j + 1] + 1); } return s / c.px.length; };
      const kept = Core.filterComponents(comps, { minArea: 20 }, redness);
      const mask2 = Core.maskFromComponents(new Uint8Array(IW * IH), kept);
      const prof = Core.columnProfile(mask2, IW, R);
      const raw = Core.findColumns(prof, R, { split: 1e9, narrow: 0 }, kept);
      const found = Core.findColumns(prof, R, {}, kept);
      const blind = Core.findColumns(prof, R, { componentAware: false }, kept);
      const cols = found.runs.map((r) => ({ x0: Math.max(R.x0, r.x0 - 6), x1: Math.min(R.x1, r.x1 + 6) }));
      const medianFor = (ch) => (window.GLYPHS && window.GLYPHS[ch] ? window.GLYPHS[ch].m : null);
      const cutOf = (ci, o = {}) => {
        const col = cols[ci]; const inCol = kept.filter((c) => c.cx >= col.x0 && c.cx < col.x1);
        const text = [...LANTING_COLS[ci]];
        return Core.cutColumn(inCol, col, R, IW, IH, { text, inserts: LANTING_INSERTS[ci] || [], strokeCounts: text.map((ch) => (medianFor(ch) ? medianFor(ch).length : 0)), ...o });
      };
      return { canvas, px, IW, IH, R, opts, mask, comps, kept, mask2, prof, raw, found, blind, cols, medianFor, cutOf, redness };
    })();
    return lantingP;
  }
  // a character's bitmap from a pixel list (padded), plus its offset
  function charBitmap(pxList, IW, pad = 3) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const i of pxList) { const x = i % IW, y = (i / IW) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const bw = x1 - x0 + 1 + pad * 2, bh = y1 - y0 + 1 + pad * 2;
    const bm = { w: bw, h: bh, data: new Uint8Array(bw * bh) };
    for (const i of pxList) bm.data[(((i / IW) | 0) - y0 + pad) * bw + (i % IW - x0 + pad)] = 1;
    return { bm, x0: x0 - pad, y0: y0 - pad };
  }
  // the pixels of one character of one column (cell k), from cutColumn
  async function charPixels(ci, k) {
    const L = await lanting(); const cut = L.cutOf(ci);
    return { px: cut.cells[k], ch: cut.text[k], cut };
  }
  // draw a bitmap as big pixels: value 1 = ink
  function bigPixels(bm, x, y, s, color, o = {}) {
    const ctx = D.ctx; ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.fillStyle = color;
    for (let yy = 0; yy < bm.h; yy++) for (let xx = 0; xx < bm.w; xx++) if (bm.data[yy * bm.w + xx]) ctx.fillRect(x + xx * s, y + yy * s, s + 0.5, s + 0.5);
    ctx.restore();
  }
  const mkTf = (rx0, ry0, s, dx, dy) => (p) => ({ x: dx + (p.x - rx0) * s, y: dy + (p.y - ry0) * s });

  // =============================================================================
  // 1. ink, paper, seal
  D.scene({
    id: 'ink', zh: '墨、纸、印', en: 'ink, paper and seals by colour', seconds: 11,
    async setup() {
      const L = await lanting();
      // the second and third columns, upper part: seals sit on the paper here
      const reg = { x0: 300, x1: 660, y0: 30, y1: 700 };
      const rw = reg.x1 - reg.x0, rh = reg.y1 - reg.y0;
      const make = (fn) => { const c = document.createElement('canvas'); c.width = rw; c.height = rh; const g = c.getContext('2d'); const id = g.createImageData(rw, rh); const d = id.data; for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { const j = ((y + reg.y0) * L.IW + x + reg.x0) * 4, k = (y * rw + x) * 4; const [r, gg, b] = fn(L.px.data[j], L.px.data[j + 1], L.px.data[j + 2], x + reg.x0, y + reg.y0); d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255; } g.putImageData(id, 0, 0); return c; };
      const lum = make((r, g, b) => { const l = r * 0.3 + g * 0.59 + b * 0.11; return [l, l, l]; });
      const red = make((r, g, b) => { const v = clamp((r - Math.max(g, b)) * 4, 0, 255); return [255 - v * 0.1, 255 - v, 255 - v]; });
      const cls = make((r, g, b, x, y) => { const c = Core.classify(L.px, x, y, L.opts); return c === 'ink' ? [23, 22, 20] : c === 'seal' ? [200, 60, 50] : [240, 234, 220]; });
      return { L, reg, lum, red, cls };
    },
    draw(ctx, t, S) {
      D.title('墨、纸、印', 'which pixels are ink', null);
      const { L, reg } = S; const rw = reg.x1 - reg.x0, rh = reg.y1 - reg.y0;
      const panels = [
        { src: L.canvas, sx: reg.x0, sy: reg.y0, zh: '扫描原图', en: 'the scan', at: 0.0 },
        { src: S.lum, sx: 0, sy: 0, zh: '亮度 L = 0.3R + 0.59G + 0.11B', en: 'luminance', at: 0.22 },
        { src: S.red, sx: 0, sy: 0, zh: '偏红 R − max(G, B)', en: 'redness', at: 0.44 },
        { src: S.cls, sx: 0, sy: 0, zh: '墨：L < 110 且不偏红', en: 'ink = dark and not red; seals go', at: 0.66 },
      ];
      const pw = 270, gap = 26, x0 = (W - (pw * 4 + gap * 3)) / 2, y0 = 86, ph = 500;
      const f = D.fit(rw, rh, 0, 0, pw, ph);
      panels.forEach((p, i) => {
        const k = ease(stage(t, p.at, p.at + 0.12)); if (k <= 0) return;
        const x = x0 + i * (pw + gap);
        D.rect(x, y0, pw, ph, { fill: '#fff', stroke: colors.rule, alpha: k });
        D.image(p.src, p.sx, p.sy, rw, rh, x + f.x, y0 + f.y, f.w, f.h, { alpha: k });
        D.label(p.zh, x + pw / 2, y0 + ph + 26, { zh: true, size: 15, align: 'center', alpha: k });
        D.label(p.en, x + pw / 2, y0 + ph + 46, { size: 12, color: colors.ink3, align: 'center', alpha: k });
      });
      if (t < 0.66) D.caption('每个像素先按颜色分三类：亮度低的是墨，偏红的是朱印，其余是纸。', 'Every pixel is sorted by colour: dark is ink, reddish is a seal, the rest is paper.', ease(stage(t, 0.05, 0.2)));
      else D.caption('阈值：亮度 < 110，且 R − max(G,B) < 40。印章被整个去掉，压在字上的印也一起消失。', 'Thresholds: luminance under 110 and redness under 40. Seals vanish, including where they cover the writing.', ease(stage(t, 0.7, 0.82)));
    },
  });

  // =============================================================================
  // 2. connected components and what gets dropped
  D.scene({
    id: 'components', zh: '连通域与去噪', en: 'connected components, dust and seal remnants', seconds: 10,
    async setup() {
      const L = await lanting();
      const reg = { x0: 300, x1: 660, y0: 30, y1: 700 };
      const inReg = L.comps.filter((c) => c.cx >= reg.x0 && c.cx < reg.x1 && c.cy >= reg.y0 && c.cy < reg.y1);
      const layer = D.pixelCanvas([], L.IW, L.IH, reg, [0, 0, 0]);
      const g = layer.getContext('2d');
      // colour every component; remember the dropped ones
      const dropped = [];
      inReg.forEach((c, k) => {
        const why = L.kept.reasons.get(c.id);
        const col = why ? [200, 200, 200] : hsl((k * 47) % 360);
        const pc = D.pixelCanvas(c.px, L.IW, L.IH, reg, col); g.drawImage(pc, 0, 0);
        if (why) dropped.push({ c, why });
      });
      const dropLayer = D.pixelCanvas([], L.IW, L.IH, reg, [0, 0, 0]); const gd = dropLayer.getContext('2d');
      for (const { c, why } of dropped) gd.drawImage(D.pixelCanvas(c.px, L.IW, L.IH, reg, why === 'seal' ? [220, 60, 50] : [240, 150, 40]), 0, 0);
      return { L, reg, layer, dropLayer, dropped, n: inReg.length };
    },
    draw(ctx, t, S) {
      D.title('连通域与去噪', 'connected components; dust and seal remnants dropped', null);
      const { L, reg } = S; const rw = reg.x1 - reg.x0, rh = reg.y1 - reg.y0;
      const f = D.fit(rw, rh, 0, 0, 340, 560);
      const x0 = 140, y0 = 90;
      D.rect(x0, y0, 340, 560, { fill: '#fff', stroke: colors.rule });
      D.image(L.canvas, reg.x0, reg.y0, rw, rh, x0 + f.x, y0 + f.y, f.w, f.h, { alpha: 0.35 });
      const k1 = ease(stage(t, 0.05, 0.3));
      D.image(S.layer, 0, 0, rw, rh, x0 + f.x, y0 + f.y, f.w, f.h, { alpha: k1 });
      // the dropped ones flash, then fade
      const k2 = stage(t, 0.5, 0.95);
      const blink = k2 > 0 && k2 < 0.6 ? 0.55 + 0.45 * Math.sin(k2 * 40) : 0;
      const fade = k2 > 0.6 ? 1 - ease(stage(k2, 0.6, 1)) : 1;
      if (k2 > 0) D.image(S.dropLayer, 0, 0, rw, rh, x0 + f.x, y0 + f.y, f.w, f.h, { alpha: fade * (k2 < 0.6 ? blink : 1) });
      // right: legend
      const lx = 560, ly = 140;
      D.label(`${S.n} 个连通域（8 邻接）`, lx, ly, { zh: true, size: 20, alpha: k1 });
      D.label(`${S.n} components, 8-connected`, lx, ly + 24, { size: 13, color: colors.ink3, alpha: k1 });
      const dust = S.dropped.filter((d) => d.why === 'dust').length, seal = S.dropped.filter((d) => d.why === 'seal').length;
      const k3 = ease(stage(t, 0.5, 0.6));
      D.dot(lx + 8, ly + 70, 7, 'rgb(240,150,40)', { alpha: k3 }); D.label(`面积 < 20 px：尘点，${dust} 个`, lx + 26, ly + 75, { zh: true, size: 16, alpha: k3 });
      D.label('area under 20 px: dust', lx + 26, ly + 94, { size: 12, color: colors.ink3, alpha: k3 });
      D.dot(lx + 8, ly + 130, 7, 'rgb(220,60,50)', { alpha: k3 }); D.label(`小而偏红（R/G > 1.3）：印章残迹，${seal} 个`, lx + 26, ly + 135, { zh: true, size: 16, alpha: k3 });
      D.label('small and red-tinted: what the seal left behind', lx + 26, ly + 154, { size: 12, color: colors.ink3, alpha: k3 });
      D.label('之后每个连通域只属于一个字（或两个字共用，见后）', lx, ly + 220, { zh: true, size: 15, color: colors.ink2, alpha: ease(stage(t, 0.85, 0.95)) });
      D.caption(t < 0.5 ? '把墨像素连成块：相连的像素是一个连通域，记下它的外框、面积和重心。' : '太小的是纸上的尘点，小而偏红的是去印章后留下的残迹，先扔掉。',
        t < 0.5 ? 'Ink pixels are grouped into connected components with their box, area and centre.' : 'Tiny ones are dust; small red-tinted ones are what the seals left. Both are dropped.', ease(stage(t, 0.05, 0.15)));
    },
  });

  // =============================================================================
  // 3. columns from the ink profile
  D.scene({
    id: 'columns', zh: '分列', en: 'columns from the ink per x', seconds: 13,
    async setup() { const L = await lanting(); return { L }; },
    draw(ctx, t, S) {
      D.title('分列', 'columns: ink per x, a threshold, runs', null);
      const { L } = S; const IW = L.IW, IH = L.IH;
      const f = D.fit(IW, IH, 0, 0, 560, 400); const x0 = 60, y0 = 84;
      const tf = mkTf(0, 0, f.s, x0 + f.x, y0 + f.y);
      D.image(L.canvas, 0, 0, IW, IH, x0 + f.x, y0 + f.y, f.w, f.h, { alpha: 0.9 });
      // the mask as ink
      D.image(D.maskCanvas(L.mask2, IW, IH, L.R, [23, 22, 20]), 0, 0, IW, IH, x0 + f.x, y0 + f.y, f.w, f.h, { alpha: 0.6 * ease(stage(t, 0, 0.1)) });
      // profile chart under the image
      const cy = y0 + f.y + f.h + 10, ch = 80;
      const k1 = ease(stage(t, 0.08, 0.35));
      const maxP = L.found.p95 * 1.4;
      ctx.save(); ctx.fillStyle = colors.blue; ctx.globalAlpha = 0.8;
      const upto = Math.round(IW * k1);
      for (let x = 0; x < upto; x++) { const v = Math.min(1, L.found.sm[x] / maxP); const p = tf({ x, y: 0 }); ctx.fillRect(p.x, cy + ch - v * ch, Math.max(1, f.s), v * ch); }
      ctx.restore();
      D.label('每一列像素里的墨点数（平滑后）', x0 + f.x, cy + ch + 20, { zh: true, size: 13, color: colors.ink2, alpha: k1 });
      D.label('ink pixels per x, smoothed over ±3 px', x0 + f.x, cy + ch + 36, { size: 11, color: colors.ink3, alpha: k1 });
      // threshold
      const k2 = ease(stage(t, 0.36, 0.46));
      if (k2 > 0) {
        const ty = cy + ch - Math.min(1, L.found.thr / maxP) * ch;
        ctx.save(); ctx.globalAlpha = k2; ctx.strokeStyle = colors.accent; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tf({ x: 0, y: 0 }).x, ty); ctx.lineTo(tf({ x: IW, y: 0 }).x, ty); ctx.stroke(); ctx.restore();
        D.label(`阈值 = 0.15 × 第95百分位 = ${L.found.thr.toFixed(0)}`, tf({ x: IW, y: 0 }).x + 8, ty + 4, { zh: true, size: 12, color: colors.accent, alpha: k2 });
      }
      // raw runs (before splitting)
      const k3 = ease(stage(t, 0.46, 0.58));
      const band = (r, color, alpha, y) => { const a = tf({ x: r.x0, y: 0 }), b = tf({ x: r.x1, y: 0 }); D.rect(a.x, y0 + f.y, b.x - a.x, f.h, { fill: color, alpha }); };
      const wide = L.raw.runs.find((r) => r.x1 - r.x0 > 200);
      if (k3 > 0 && t < 0.62) L.raw.runs.forEach((r, i) => band(r, r === wide ? colors.orange : colors.blue, 0.22 * k3));
      // split
      const k4 = ease(stage(t, 0.62, 0.8));
      if (k4 > 0) {
        L.found.runs.forEach((r, i) => band(r, colors.blue, 0.22));
        if (wide) { const a = tf({ x: wide.x0, y: 0 }), b = tf({ x: wide.x1, y: 0 }); D.rect(a.x, y0 + f.y, b.x - a.x, f.h, { stroke: colors.orange, width: 2, alpha: 1 - k4 }); }
        const splits = L.found.log.filter((l) => l.startsWith('split')).map((l) => parseInt(l.match(/at (\d+)/)[1], 10));
        splits.forEach((sx) => { const p = tf({ x: sx, y: 0 }); ctx.save(); ctx.globalAlpha = k4; ctx.strokeStyle = colors.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, y0 + f.y); ctx.lineTo(p.x, y0 + f.y + f.h); ctx.stroke(); ctx.restore(); });
      }
      // right panel: the log
      const lx = 680, ly = 110;
      D.label('步骤', lx, ly, { zh: true, size: 18 });
      const lines = [
        [0.1, '1. 统计每个 x 上的墨像素，平滑'],
        [0.36, `2. 高于阈值的连续段是一列（${L.raw.runs.length} 段）`],
        [0.5, '3. 比中位宽 1.5 倍以上的段是两列黏在一起'],
        [0.62, '   → 在最空、且切不穿字的地方劈开'],
        [0.8, `4. 窄而墨少的段并入左边的列（补字）→ ${L.found.runs.length} 列`],
      ];
      lines.forEach(([at, s], i) => D.label(s, lx, ly + 34 + i * 30, { zh: true, size: 15, color: colors.ink2, alpha: ease(stage(t, at, at + 0.08)) }));
      const logs = L.found.log.filter((l) => /split|merge/.test(l));
      logs.forEach((l, i) => D.label(l, lx, ly + 215 + i * 20, { size: 11, color: colors.ink3, alpha: ease(stage(t, 0.62 + i * 0.06, 0.7 + i * 0.06)) }));
      D.caption('竖排：每一列在 x 轴上是一段连续的墨；两列之间落回零。', 'Text runs in columns, so the ink per x is a row of bumps with gaps between them.', ease(stage(t, 0.05, 0.15)));
    },
  });

  // =============================================================================
  // 4. 崇山 before / after
  D.scene({
    id: 'chongshan', zh: '补字：崇山', en: 'two small characters between columns, before and after', seconds: 13,
    async setup() {
      const L = await lanting();
      const reg = { x0: 20, x1: 300, y0: 60, y1: 480 };
      // after: the real pipeline on column 4 (index 3)
      const cutA = L.cutOf(3);
      const recsA = Core.traceColumn(cutA, L.IW, L.medianFor);
      // before: blind split, pixel cells, inserts by whole components in the box
      const colsB = L.blind.runs.map((r) => ({ x0: Math.max(0, r.x0 - 6), x1: Math.min(L.IW, r.x1 + 6) }));
      const colB = colsB[3], inColB = L.kept.filter((c) => c.cx >= colB.x0 && c.cx < colB.x1);
      const cutB = Core.cutColumn(inColB, colB, L.R, L.IW, L.IH, { text: [...LANTING_COLS[3]], inserts: LANTING_INSERTS[3] });
      const recsB = [];
      cutB.text.forEach((ch, k) => { const r = Core.traceChar(cutB.cells[k], L.IW, ch, L.medianFor(ch)); if (r) recsB.push(r); for (const e of cutB.extra) if (e.after === k) { const r2 = Core.traceChar(e.px, L.IW, e.ch, L.medianFor(e.ch)); if (r2) recsB.push({ ...r2, small: true }); } });
      const splitB = parseInt(L.blind.log.find((l) => l.startsWith('split')).match(/at (\d+)/)[1], 10);
      const splitsA = L.found.log.filter((l) => l.startsWith('split')).map((l) => parseInt(l.match(/at (\d+)/)[1], 10));
      return { L, reg, cutA, recsA, cutB, recsB, splitB, splitsA, colA: L.cols[3], colB };
    },
    draw(ctx, t, S) {
      D.title('补字：崇山', '崇山 written small between two columns — before and after', null);
      const { L, reg } = S; const rw = reg.x1 - reg.x0, rh = reg.y1 - reg.y0;
      const pw = 400, ph = 520, y0 = 90;
      const sides = [{ x: 200, zh: '改前', en: 'before', recs: S.recsB, cut: S.cutB, splits: [S.splitB], col: S.colB, note: '崇 被切成两个"字"，山 并进了峻', noteEn: '崇 in two pieces; 山 swallowed by 峻' }, { x: 680, zh: '改后', en: 'after', recs: S.recsA, cut: S.cutA, splits: S.splitsA, col: S.colA, note: '崇、山 各是一个完整的小字，峻的捺留给峻', noteEn: '崇 and 山 whole; 峻 keeps its 捺' }];
      for (const side of sides) {
        const f = D.fit(rw, rh, 0, 0, pw, ph); const tf = mkTf(reg.x0, reg.y0, f.s, side.x + f.x, y0 + f.y);
        D.rect(side.x, y0, pw, ph, { fill: '#fff', stroke: colors.rule });
        ctx.save(); ctx.beginPath(); ctx.rect(side.x, y0, pw, ph); ctx.clip();
        D.image(L.canvas, reg.x0, reg.y0, rw, rh, side.x + f.x, y0 + f.y, f.w, f.h, { alpha: 0.45 });
        D.label(side.zh, side.x + pw / 2, y0 - 8, { zh: true, size: 18, align: 'center' });
        D.label(side.en, side.x + pw / 2 + 40, y0 - 8, { size: 12, color: colors.ink3 });
        // stage A: the column cut lines
        const k1 = ease(stage(t, 0.05, 0.2));
        for (const sx of side.splits) { const p = tf({ x: sx, y: reg.y0 }); ctx.save(); ctx.globalAlpha = k1; ctx.strokeStyle = colors.accent; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(p.x, y0 + f.y); ctx.lineTo(p.x, y0 + f.y + f.h); ctx.stroke(); ctx.restore(); }
        // stage B: the insert box (after only)
        if (side.cut.inserts && side.cut.inserts.length && t > 0.25) {
          const b = side.cut.inserts[0].box; const a = tf({ x: b.x0, y: b.y0 }), c = tf({ x: Math.min(b.x1, reg.x1), y: b.y1 });
          D.rect(a.x, a.y, c.x - a.x, c.y - a.y, { stroke: colors.green, width: 2, dash: [4, 3], alpha: ease(stage(t, 0.25, 0.35)) });
        }
        // stage C: the characters traced, one colour and one box per record
        const k3 = stage(t, 0.4, 0.85);
        if (k3 > 0) {
          side.recs.forEach((rec, ri) => {
            const col = rec.small ? colors.accent : hue(ri * 2 + 1);
            const a = 0.9 * ease(stage(k3, 0, 0.5));
            rec.strokes.forEach((s) => D.poly(s.map(px2), tf, { color: col, width: 3.5, alpha: a }));
            const b0 = tf({ x: rec.box[0], y: rec.box[1] }), b1 = tf({ x: rec.box[0] + rec.box[2], y: rec.box[1] + rec.box[3] });
            D.rect(b0.x - 3, b0.y - 3, b1.x - b0.x + 6, b1.y - b0.y + 6, { stroke: col, width: 1.5, dash: rec.small ? [] : [3, 3], alpha: a * 0.8 });
            D.label(rec.ch, b1.x + 6, b0.y + 16, { zh: true, size: rec.small ? 20 : 15, color: col, bg: '#fff', alpha: ease(stage(k3, 0.5, 0.8)) });
          });
        }
        ctx.restore();
        if (k3 > 0) {
          D.label(side.note, side.x + pw / 2, y0 + ph + 26, { zh: true, size: 16, align: 'center', color: side.zh === '改前' ? colors.accent : colors.green, alpha: ease(stage(k3, 0.6, 0.9)) });
          D.label(side.noteEn, side.x + pw / 2, y0 + ph + 46, { size: 12, align: 'center', color: colors.ink3, alpha: ease(stage(k3, 0.6, 0.9)) });
        }
      }
      if (t < 0.4) D.caption('两列之间补写的小字「崇山」。改前，两列黏成一段，只在最空的一条 x 上劈开——正好劈在小字中间。', 'The small 崇山 sit between two columns. The bridged run used to be split at its emptiest x, right through them.', ease(stage(t, 0.05, 0.15)));
      else D.caption('改后：劈缝要付"切穿连通域"的代价，滑进小字旁的缝里；峻的捺碰着山，就按笔画而不是按像素归属。', 'After: the split pays for cutting through components and slides into the gap; 峻\'s 捺 touches 山, so strokes are assigned, not pixels.', ease(stage(t, 0.42, 0.52)));
    },
  });

  // =============================================================================
  // 5. cells: cutting one column into characters
  D.scene({
    id: 'cells', zh: '切字', en: 'cutting a column into characters', seconds: 13,
    async setup() {
      const L = await lanting(); const cut = L.cutOf(0);
      const plain = L.cutOf(0, { strokeCounts: null, depthWeight: 0 });
      return { L, cut, plain };
    },
    draw(ctx, t, S) {
      D.title('切字', 'cells: a dynamic programme over cut rows', null);
      const { L, cut } = S; const col = L.cols[0];
      const reg = { x0: col.x0 - 10, x1: col.x1 + 10, y0: cut.top - 10, y1: cut.bottom + 10 };
      const rw = reg.x1 - reg.x0, rh = reg.y1 - reg.y0;
      const f = D.fit(rw, rh, 0, 0, 240, 580); const x0 = 70, y0 = 85; const tf = mkTf(reg.x0, reg.y0, f.s, x0 + f.x, y0 + f.y);
      D.image(L.canvas, reg.x0, reg.y0, rw, rh, x0 + f.x, y0 + f.y, f.w, f.h);
      // row ink profile to the right
      const bx = x0 + f.x + f.w + 30, bw = 150;
      const maxI = Math.max(...Array.from(cut.rowInk).slice(cut.top, cut.bottom));
      const k1 = ease(stage(t, 0.05, 0.3));
      ctx.save(); ctx.fillStyle = colors.blue; ctx.globalAlpha = 0.75;
      const upto = cut.top + Math.round((cut.bottom - cut.top) * k1);
      for (let y = cut.top; y < upto; y++) { const p = tf({ x: 0, y }); const v = cut.rowInk[y] / maxI; ctx.fillRect(bx, p.y, v * bw, Math.max(1, f.s)); }
      // depth penalty
      const k2 = ease(stage(t, 0.3, 0.45));
      ctx.fillStyle = colors.orange; ctx.globalAlpha = 0.55 * k2;
      const maxD = Math.max(0.001, ...Array.from(cut.depth).slice(cut.top, cut.bottom));
      for (let y = cut.top; y < cut.bottom; y++) { const p = tf({ x: 0, y }); const v = cut.depth[y] / maxD; ctx.fillRect(bx + bw + 10, p.y, v * 60, Math.max(1, f.s)); }
      ctx.restore();
      D.label('每行墨量', bx, y0 + f.y - 8, { zh: true, size: 12, color: colors.blue, alpha: k1 });
      D.label('切穿字身的深度', bx + bw + 10, y0 + f.y - 8, { zh: true, size: 12, color: colors.orange, alpha: k2 });
      // cuts appear one by one
      const k3 = stage(t, 0.45, 0.75);
      const nCut = Math.floor(k3 * (cut.cuts.length - 1));
      cut.cuts.forEach((cy, i) => {
        if (i === 0 || i === cut.cuts.length - 1) return;
        const a = ease(stage(k3, (i - 1) / (cut.cuts.length - 2), i / (cut.cuts.length - 2)));
        if (a <= 0) return;
        const p = tf({ x: reg.x0, y: cy }), q = tf({ x: reg.x1, y: cy });
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = colors.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x + 20 + bw + 70, p.y); ctx.stroke(); ctx.restore();
      });
      // labels
      const k4 = ease(stage(t, 0.75, 0.9));
      cut.text.forEach((ch, k) => { const p = tf({ x: reg.x0, y: (cut.cuts[k] + cut.cuts[k + 1]) / 2 }); D.label(ch, p.x - 14, p.y + 7, { zh: true, size: 20, align: 'right', color: colors.accent, alpha: k4 }); });
      // explanation
      const lx = 640, ly = 120;
      const rows = [
        [0.05, '已知这一列是「永和九年歲在癸丑暮春之初會」，13 个字，要放 12 条切线。'],
        [0.3, '每条切线的代价 = 那一行的墨量 + 切穿了哪个连通域多深'],
        [0.45, '每个格子的代价 = 高度偏离平均值² + 墨量份额偏离该字笔画数的份额'],
        [0.55, '动态规划：从上往下，每个可能的切线位置记住到它为止的最小代价'],
        [0.75, `结果：${cut.text.join('')}`],
      ];
      rows.forEach(([at, s], i) => D.label(s, lx, ly + i * 46, { zh: true, size: 15, color: colors.ink2, alpha: ease(stage(t, at, at + 0.08)) }));
      D.label('cut cost = ink in the row + depth into a component; cell cost = (height − mean)² + |ink share − stroke-count share|', lx, ly + 5 * 46, { size: 12, color: colors.ink3, alpha: ease(stage(t, 0.6, 0.7)) });
      D.caption('切线落在行间空白处；字身高矮不一时，用每个字的笔画数估计它该有多少墨，给格子定大小。', 'Cuts land in the empty rows; cells are sized by how much ink each character should have, from its stroke count.', ease(stage(t, 0.05, 0.15)));
    },
  });

  // =============================================================================
  // 6. thinning
  D.scene({
    id: 'thinning', zh: '细化：剥出中线', en: 'thinning to a one-pixel centre line', seconds: 11,
    async setup() {
      const { px, ch } = await charPixels(0, 0);
      const L = await lanting();
      const { bm } = charBitmap(px, L.IW);
      const steps = []; let last = null;
      for (let k = 1; k < 60; k++) { const r = Sk.thin(bm, { maxIter: k, noClean: true }); steps.push(r); if (r.iterations < k) break; }
      const final = Sk.thin(bm);
      return { bm, steps, final, ch };
    },
    draw(ctx, t, S) {
      D.title('细化：剥出中线', 'Zhang–Suen thinning: peel a layer per pass until one pixel remains', null);
      const { bm } = S; const s = Math.min(560 / bm.h, 420 / bm.w); const x0 = 110, y0 = 90 + (560 - bm.h * s) / 2;
      D.rect(x0 - 10, 90, bm.w * s + 20, 560, { fill: '#fff', stroke: colors.rule });
      const k = stage(t, 0.1, 0.8);
      const idx = Math.min(S.steps.length - 1, Math.floor(k * S.steps.length));
      const cur = t < 0.1 ? bm : (t < 0.85 ? S.steps[idx] : S.final);
      bigPixels(bm, x0, y0, s, 'rgba(23,22,20,0.18)');
      // pixels removed in this pass, in orange
      if (t >= 0.1 && t < 0.85 && idx > 0) { const prev = S.steps[idx - 1]; const rem = { w: bm.w, h: bm.h, data: prev.data.map((v, i) => (v && !cur.data[i] ? 1 : 0)) }; bigPixels(rem, x0, y0, s, colors.orange, { alpha: 0.9 }); }
      bigPixels(cur, x0, y0, s, colors.ink);
      const lx = 640, ly = 130;
      D.label(`第 ${t < 0.1 ? 0 : t < 0.85 ? idx + 1 : S.final.iterations} 轮`, lx, ly, { zh: true, size: 26 });
      D.label(t < 0.85 ? `pass ${t < 0.1 ? 0 : idx + 1} of ${S.final.iterations}` : 'done, plus a staircase clean-up', lx + 110, ly, { size: 13, color: colors.ink3 });
      const rules = [
        [0.12, '每轮两遍：先删右下侧的边缘像素，再删左上侧的'],
        [0.12, '删除条件：2–6 个邻居为墨，且绕一圈只有一次 0→1（不是桥、不是端点）'],
        [0.5, '这样两侧同速剥，中线留在原地；笔画越粗，轮数越多'],
        [0.85, '最后清掉台阶上的冗余像素，得到 8 邻接的一像素骨架'],
      ];
      rules.forEach(([at, s], i) => D.label(s, lx, ly + 50 + i * 40, { zh: true, size: 15, color: colors.ink2, alpha: ease(stage(t, at, at + 0.08)) }));
      D.label('two sub-passes per round; a pixel goes if it has 2–6 ink neighbours, exactly one 0→1 transition around it, and lies on the right edge', lx, ly + 220, { size: 11, color: colors.ink3, alpha: ease(stage(t, 0.2, 0.3)) });
      D.caption(`「${S.ch}」的墨块，每一轮从两侧各剥掉一层像素（橙色是本轮剥掉的）。`, `The ink of ${S.ch}; each pass strips one layer from both sides (orange = removed this pass).`, ease(stage(t, 0.05, 0.15)));
    },
  });

  // =============================================================================
  // 7. width from the distance transform
  D.scene({
    id: 'width', zh: '宽度：距离变换', en: 'stroke width from the distance transform', seconds: 10,
    async setup() {
      const { px, ch } = await charPixels(0, 0); const L = await lanting();
      const { bm } = charBitmap(px, L.IW);
      const dist = Sk.distanceTransform(bm); const sk = Sk.thin(bm);
      let maxD = 0; for (let i = 0; i < dist.length; i++) maxD = Math.max(maxD, dist[i]);
      const heat = document.createElement('canvas'); heat.width = bm.w; heat.height = bm.h; const g = heat.getContext('2d'); const id = g.createImageData(bm.w, bm.h);
      for (let i = 0; i < dist.length; i++) { if (!bm.data[i]) continue; const v = dist[i] / maxD; const [r, gg, b] = hsl(220 - v * 200, 85, 50); id.data[i * 4] = r; id.data[i * 4 + 1] = gg; id.data[i * 4 + 2] = b; id.data[i * 4 + 3] = 255; }
      g.putImageData(id, 0, 0);
      const raw = Sk.extractRaw(bm);
      return { bm, dist, sk, heat, maxD, raw, ch };
    },
    draw(ctx, t, S) {
      D.title('宽度：距离变换', 'width along the centre line = 2 × distance to the edge', null);
      const { bm } = S; const s = Math.min(560 / bm.h, 420 / bm.w); const x0 = 110, y0 = 90 + (560 - bm.h * s) / 2;
      D.rect(x0 - 10, 90, bm.w * s + 20, 560, { fill: '#fff', stroke: colors.rule });
      const k1 = ease(stage(t, 0.05, 0.25));
      bigPixels(bm, x0, y0, s, 'rgba(23,22,20,0.15)');
      ctx.save(); ctx.globalAlpha = k1; ctx.imageSmoothingEnabled = false; ctx.drawImage(S.heat, x0, y0, bm.w * s, bm.h * s); ctx.restore();
      const k2 = ease(stage(t, 0.3, 0.5));
      bigPixels(S.sk, x0, y0, s, colors.ink, { alpha: k2 });
      // circles on the skeleton
      const k3 = stage(t, 0.5, 0.8);
      if (k3 > 0) {
        const pts = []; for (let i = 0; i < S.sk.data.length; i++) if (S.sk.data[i]) pts.push(i);
        const n = Math.round(pts.length * k3);
        ctx.save(); ctx.strokeStyle = colors.accent; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
        for (let j = 0; j < n; j += 5) { const i = pts[j]; const x = i % bm.w, y = (i / bm.w) | 0; ctx.beginPath(); ctx.arc(x0 + (x + 0.5) * s, y0 + (y + 0.5) * s, S.dist[i] * s, 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
      }
      // ribbon: strokes drawn with their measured width
      const k4 = ease(stage(t, 0.8, 0.95));
      if (k4 > 0) {
        ctx.save(); ctx.globalAlpha = k4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(43,108,176,0.6)';
        for (const st of S.raw.strokes) for (let i = 1; i < st.length; i++) { ctx.lineWidth = Math.max(1, st[i].w * s); ctx.beginPath(); ctx.moveTo(x0 + st[i - 1].x * s, y0 + st[i - 1].y * s); ctx.lineTo(x0 + st[i].x * s, y0 + st[i].y * s); ctx.stroke(); }
        ctx.restore();
      }
      const lx = 640, ly = 130;
      [[0.05, '每个墨像素到最近的纸像素有多远（精确欧氏距离，Felzenszwalb 算法）'], [0.3, '中线上的像素，这个距离就是半宽'], [0.5, '沿着骨架每一点画一个圆，圆的直径就是笔画在这里的粗细'], [0.8, '写的时候，这条宽度曲线就是毛笔的压力曲线']]
        .forEach(([at, s], i) => D.label(s, lx, ly + i * 44, { zh: true, size: 15, color: colors.ink2, alpha: ease(stage(t, at, at + 0.08)) }));
      D.label(`max distance here: ${S.maxD.toFixed(1)} px → width ${(2 * S.maxD).toFixed(0)} px`, lx, ly + 4 * 44, { size: 12, color: colors.ink3, alpha: ease(stage(t, 0.5, 0.6)) });
      D.caption('细化只给出路径；粗细从距离变换上读：越靠近笔画中心，离边缘越远。', 'Thinning gives the path; the width comes from the distance transform: the centre is the farthest from the edge.', ease(stage(t, 0.05, 0.15)));
    },
  });

  // =============================================================================
  // 8. the skeleton as a graph
  D.scene({
    id: 'graph', zh: '骨架转图', en: 'the skeleton as a graph: ends, junctions and the paths between them', seconds: 13,
    async setup() {
      const { px, ch } = await charPixels(0, 0); const L = await lanting();
      const { bm } = charBitmap(px, L.IW);
      const sk = Sk.thin(bm), dist = Sk.distanceTransform(bm);
      const events = []; const strokes = Sk.strokes(sk, dist, { events, bitmap: bm });
      const G = events.find((e) => e.stage === 'graph');
      const cluster = events.find((e) => e.stage === 'cluster');
      // short paths hanging off a junction: what thinning grows at stroke ends
      const deg = new Map(); for (const px of G.paths) for (const i of [px[0], px[px.length - 1]]) deg.set(i, (deg.get(i) || 0) + 1);
      const endPx = new Set(G.nodes.filter((n) => n.end).flatMap((n) => n.px));
      const spurs = G.paths.filter((px) => (endPx.has(px[0]) || endPx.has(px[px.length - 1])) && px.length < 9).map((px) => ({ px }));
      return { bm, sk, G, spurs, cluster, strokes, ch };
    },
    draw(ctx, t, S) {
      D.title('骨架转图', 'end points, junctions and the paths between them', null);
      const { bm, G } = S; const s = Math.min(560 / bm.h, 420 / bm.w); const x0 = 110, y0 = 90 + (560 - bm.h * s) / 2;
      D.rect(x0 - 10, 90, bm.w * s + 20, 560, { fill: '#fff', stroke: colors.rule });
      bigPixels(bm, x0, y0, s, 'rgba(23,22,20,0.12)');
      const P = (i) => ({ x: x0 + ((i % bm.w) + 0.5) * s, y: y0 + (((i / bm.w) | 0) + 0.5) * s });
      const k1 = ease(stage(t, 0.05, 0.2));
      // paths coloured
      G.paths.forEach((px, i) => { const pts = px.map(P); D.poly(pts, (p) => p, { color: hue(i), width: 3, alpha: 0.9 * k1 }); });
      // nodes
      const k2 = ease(stage(t, 0.2, 0.35));
      G.nodes.forEach((n) => { const p = { x: x0 + (n.x + 0.5) * s, y: y0 + (n.y + 0.5) * s }; D.dot(p.x, p.y, n.end ? 4.5 : 6, n.end ? colors.green : colors.accent, { alpha: k2, stroke: '#fff', width: 1.5 }); });
      // short end paths blink: spurs or real short strokes? decided in the next scene
      const k3 = stage(t, 0.45, 0.75);
      if (k3 > 0) {
        const a = 0.55 + 0.45 * Math.sin(k3 * 40);
        S.spurs.forEach((sp) => D.poly(sp.px.map(P), (p) => p, { color: colors.orange, width: 6, alpha: a * (1 - ease(stage(t, 0.7, 0.78))) }));
      }
      // clusters
      const k4 = ease(stage(t, 0.75, 0.9));
      if (S.cluster) S.cluster.merged.forEach((m) => { const p = { x: x0 + (m.x + 0.5) * s, y: y0 + (m.y + 0.5) * s }; ctx.save(); ctx.globalAlpha = k4; ctx.strokeStyle = colors.purple; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); });
      const lx = 640, ly = 130;
      const ends = G.nodes.filter((n) => n.end).length, junc = G.nodes.length - ends;
      [[0.05, `骨架像素按 8 邻居数分类：1 个是端点（绿，${ends}），≥3 个是交叉点（红，${junc}）`], [0.05, `从每个端点或交叉点出发，沿着 2 邻居的像素走到下一个：${G.paths.length} 条路径`], [0.45, `细化在笔画末端和拐角会长出短毛刺（橙）；是毛刺还是短笔画，下一步看墨决定`], [0.75, `粗笔画的十字交叉会细化成两个 Y：相距不到 1.2 个宽度的交叉点合并成一个（${S.cluster ? S.cluster.merged.length : 0}）`], [0.9, `每条路径都只是候选：哪些连成一笔、哪些丢掉，看它们解释了多少墨`]]
        .forEach(([at, s], i) => D.label(s, lx, ly + i * 50, { zh: true, size: 14, color: colors.ink2, alpha: ease(stage(t, at, at + 0.08)) }));
      D.caption('一笔一笔的中线还连在一起：先把骨架读成图，图上的每条路径都是一笔的候选。', 'The centre lines still touch: read the skeleton as a graph first; every path on it is a candidate piece of a stroke.', ease(stage(t, 0.05, 0.15)));
    },
  });

  // =============================================================================
  // 9. choosing the strokes by the ink they explain
  D.scene({
    id: 'select', zh: '选笔：看解释了多少墨', en: 'choosing strokes by the ink they explain', seconds: 15,
    async setup() {
      const L = await lanting();
      const { px, ch } = await charPixels(0, 3);          // 年: crossings, short strokes, a long vertical
      const { bm } = charBitmap(px, L.IW);
      const sk = Sk.thin(bm), dist = Sk.distanceTransform(bm);
      const events = []; const strokes = Sk.strokes(sk, dist, { events, bitmap: bm });
      const sel = events.find((e) => e.stage === 'select');
      // the ink each chain explains, as a disc of its width at every pixel of it
      const cover = sel.chains.map((c) => { const set = new Set(); for (const i of c.px) { const x0 = i % bm.w, y0 = (i / bm.w) | 0, r = (dist[i] || 0.5) + 0.7, R = Math.ceil(r); for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= bm.w || y >= bm.h || dx * dx + dy * dy > r * r) continue; const j = y * bm.w + x; if (bm.data[j]) set.add(j); } } return [...set]; });
      return { bm, sk, sel, cover, strokes, ch };
    },
    draw(ctx, t, S) {
      D.title('选笔：看解释了多少墨', 'a chain of paths is a stroke only if it explains ink no other stroke does', null);
      const { bm, sel } = S; const s = Math.min(560 / bm.h, 400 / bm.w); const x0 = 90, y0 = 90 + (560 - bm.h * s) / 2;
      D.rect(x0 - 10, 90, bm.w * s + 20, 560, { fill: '#fff', stroke: colors.rule });
      bigPixels(bm, x0, y0, s, 'rgba(23,22,20,0.13)');
      bigPixels(S.sk, x0, y0, s, 'rgba(23,22,20,0.55)', { alpha: 1 - ease(stage(t, 0.1, 0.2)) * 0.6 });
      const P = (i) => ({ x: x0 + ((i % bm.w) + 0.5) * s, y: y0 + (((i / bm.w) | 0) + 0.5) * s });
      // the chains, one after another, in the order they were grown
      const n = sel.chains.length, tA = 0.12, tB = 0.78;
      const shown = Math.min(n, Math.floor(stage(t, tA, tB) * n + 0.0001) + (t > tA ? 1 : 0));
      const covered = new Uint8Array(bm.w * bm.h);
      let k = 0;
      for (let c = 0; c < shown; c++) {
        const ch = sel.chains[c], isLast = c === shown - 1 && t < tB;
        const col = ch.accepted ? hue(k) : colors.orange;
        // the ink it explains
        ctx.save(); ctx.globalAlpha = ch.accepted ? (isLast ? 0.45 : 0.22) : (isLast ? 0.5 : 0); ctx.fillStyle = col;
        for (const j of S.cover[c]) { if (ch.accepted && covered[j]) continue; const x = j % bm.w, y = (j / bm.w) | 0; ctx.fillRect(x0 + x * s, y0 + y * s, s + 0.5, s + 0.5); }
        ctx.restore();
        if (ch.accepted) for (const j of S.cover[c]) covered[j] = 1;
        if (ch.accepted || isLast) D.poly(ch.px.map(P), (p) => p, { color: col, width: ch.accepted ? 4 : 3, alpha: ch.accepted ? 1 : (isLast ? 0.9 : 0) });
        if (ch.accepted) k++;
      }
      // the ledger
      const lx = 560, ly = 118, rowH = 21;
      const lines = [[0.12, '每条路径解释一片墨：沿着它、在测得的宽度以内的墨'], [0.3, '从解释新墨最多的路径起头，在交叉处只接转角不到 75° 的路径'], [0.55, '一串新解释的墨不到一个笔宽的平方，就付不起一笔：毛刺和噪点就这样丢掉'], [0.82, '最后，两笔在同一点收尾、没有第三笔穿过：合成一笔转折']];
      lines.forEach(([at, txt], i) => D.label(txt, lx, ly + i * 26, { zh: true, size: 14, color: colors.ink2, alpha: ease(stage(t, at, at + 0.06)) }));
      const ly2 = ly + 130;
      D.label(`代价：一个笔宽的平方 = ${Math.round(sel.cost)} 像素（笔宽 ${sel.medW.toFixed(1)} px），按新解释的墨排先后`, lx, ly2, { zh: true, size: 13, color: colors.ink3, alpha: ease(stage(t, 0.06, 0.12)) });
      // every stroke kept so far, then the latest chains turned down, up to 12 rows
      const kept = [], dropped = [];
      for (let c = 0; c < shown; c++) (sel.chains[c].accepted ? kept : dropped).push(c);
      const list = [...kept, ...dropped.slice(Math.max(0, dropped.length - Math.max(3, 12 - kept.length)))];
      const rankOf = new Map(kept.map((c, i) => [c, i]));
      list.forEach((c, row) => {
        const ch = sel.chains[c], y = ly2 + 32 + row * rowH;
        const ki = rankOf.get(c);
        const col = ch.accepted ? hue(ki) : colors.orange;
        D.dot(lx + 6, y - 5, 5, col);
        const w = Math.min(220, (ch.gain / sel.cost) * 40);
        D.rect(lx + 22, y - 11, w, 12, { fill: col, alpha: 0.35 });
        D.rect(lx + 22 + 40, y - 14, 1.5, 18, { fill: colors.ink3 });
        D.label(`+${ch.gain} px  ${ch.accepted ? '✓ 一笔' : '✗ 付不起，丢掉'}`, lx + 22 + Math.max(w, 40) + 10, y, { zh: true, size: 13, color: ch.accepted ? colors.ink : colors.orange });
      });
      D.caption('哪些路径连成一笔，看它们解释了多少墨：毛刺解释不了新墨，点和墨团里的分支可以。', 'Which paths make a stroke depends on the ink they explain: a spur explains nothing new, a dot or the branches inside a blob do.', ease(stage(t, 0.04, 0.12)));
    },
  });

  // =============================================================================
  // 10. measuring every stroke again on the ink
  D.scene({
    id: 'refine', zh: '再量一遍：笔画对照墨', en: 'measuring every stroke again on the ink itself', seconds: 15,
    async setup() {
      const L = await lanting();
      const { px, ch } = await charPixels(0, 0);          // 永
      const { bm } = charBitmap(px, L.IW);
      const before = Sk.extractRaw(bm, { refine: false }), after = Sk.extractRaw(bm);
      const fb = Sk.fidelity(before.strokes, bm, { residual: true }), fa = Sk.fidelity(after.strokes, bm, { residual: true });
      // the stroke to show the probes on: the longest
      let best = 0; after.strokes.forEach((st, i) => { if (Sk.length(st) > Sk.length(after.strokes[best])) best = i; });
      return { bm, before, after, fb, fa, best, ch };
    },
    draw(ctx, t, S) {
      D.title('再量一遍：笔画对照墨', 'probe across every stroke to both edges; walk past each end while there is ink', null);
      const { bm } = S; const s = Math.min(560 / bm.h, 420 / bm.w); const x0 = 90, y0 = 90 + (560 - bm.h * s) / 2;
      D.rect(x0 - 10, 90, bm.w * s + 20, 560, { fill: '#fff', stroke: colors.rule });
      bigPixels(bm, x0, y0, s, 'rgba(23,22,20,0.14)');
      const T = (q) => ({ x: x0 + q.x * s, y: y0 + q.y * s });
      // 1. the skeleton's strokes, and the ink they miss
      const k1 = ease(stage(t, 0.04, 0.14)), k5 = ease(stage(t, 0.72, 0.8));
      const miss = (f, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(214,52,40,0.85)'; for (let i = 0; i < f.residual.length; i++) if (f.residual[i]) ctx.fillRect(x0 + (i % bm.w) * s, y0 + ((i / bm.w) | 0) * s, s + 0.5, s + 0.5); ctx.restore(); };
      miss(S.fb, k1 * (1 - k5));
      miss(S.fa, k5);
      for (const st of S.before.strokes) D.poly(st.map(T), (p) => p, { color: colors.blue, width: 2, alpha: k1 * (1 - ease(stage(t, 0.62, 0.7))) * 0.9 });
      // 2. probes along the longest stroke
      const st = S.after.strokes[S.best], k2 = stage(t, 0.18, 0.5);
      if (k2 > 0) {
        const n = Math.round(st.length * k2);
        ctx.save(); ctx.lineWidth = 1.2; ctx.strokeStyle = colors.green;
        for (let i = 1; i < Math.min(n, st.length - 1); i += 2) {
          const a = st[i - 1], b = st[i + 1], q = st[i]; const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; const nx = -dy / l, ny = dx / l, r = q.w / 2;
          const p0 = T({ x: q.x + nx * r, y: q.y + ny * r }), p1 = T({ x: q.x - nx * r, y: q.y - ny * r });
          ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        }
        ctx.restore();
        D.poly(st.slice(0, n).map(T), (p) => p, { color: colors.accent, width: 2.5 });
      }
      // 3. all the refined strokes, with their width
      const k3 = ease(stage(t, 0.5, 0.66));
      if (k3 > 0) {
        // what the refined strokes paint, as the brush would
        if (!S.hitA) S.hitA = Sk.hits(S.after.strokes, bm.w, bm.h, 0.5);
        ctx.save(); ctx.globalAlpha = k3 * 0.55; ctx.fillStyle = colors.ink;
        for (let i = 0; i < S.hitA.length; i++) if (S.hitA[i]) ctx.fillRect(x0 + (i % bm.w) * s, y0 + ((i / bm.w) | 0) * s, s + 0.5, s + 0.5);
        ctx.restore();
        for (const r of S.after.strokes) D.poly(r.map(T), (p) => p, { color: colors.accent, width: 2, alpha: k3 });
      }
      const lx = 600, ly = 128, pct = (f) => `${(100 * f.recall).toFixed(1)}%`;
      [[0.04, '蓝线：细化给的中线。它在笔画中间附近，不在正中；宽度取能塞进去的最大圆，交叉处被撑大；两头还差半个笔宽'],
       [0.18, '绿线：沿每条笔画、大约每个像素，往两边量到墨的边缘。两边的中点是新的中心，距离是新的宽度'],
       [0.34, '每个墨像素归离它最近的那一笔。量到别的笔画的墨里，就是交叉处：这一段从两边插值'],
       [0.5, '两头顺着笔势往前量，直到墨尽：钝头还是钝头，尖锋还是尖锋'],
       [0.72, `红色是笔画漏掉的墨：这个字从 ${pct(S.fb)} 到 ${pct(S.fa)}`]]
        .forEach(([at, txt], i) => D.label(txt, lx, ly + i * 64, { zh: true, size: 14, color: colors.ink2, alpha: ease(stage(t, at, at + 0.06)), maxWidth: 620 }));
      D.caption('细化给出的中线只是近似：拿每一笔回到墨上再量一遍。', 'The thinned centre line is only close: take every stroke back to the ink and measure it again.', ease(stage(t, 0.03, 0.1)));
    },
  });

  // =============================================================================
  // 11. the outline of a character, and how much of it the strokes fill
  D.scene({
    id: 'outline', zh: '描紅：輪廓與對照', en: 'the outline of a character, and how much of it the strokes fill', seconds: 13,
    async setup() {
      const L = await lanting();
      const { px, ch } = await charPixels(1, 7);          // 蘭: dense, many strokes
      const { bm, x0, y0 } = charBitmap(px, L.IW);
      const rings = Core.outline(px, L.IW).map((r) => r.map((q) => ({ x: q.x - x0, y: q.y - y0 })));
      const raw = Sk.extractRaw(bm), f = Sk.fidelity(raw.strokes, bm, { residual: true });
      return { bm, rings, raw, f, ch };
    },
    draw(ctx, t, S) {
      D.title('描紅：輪廓與對照', 'the edge of the ink as smooth rings; the brush footprint against it', null);
      const { bm } = S; const s = Math.min(560 / bm.h, 430 / bm.w); const x0 = 90, y0 = 90 + (560 - bm.h * s) / 2;
      D.rect(x0 - 10, 90, bm.w * s + 20, 560, { fill: '#fff', stroke: colors.rule });
      const T = (q) => ({ x: x0 + q.x * s, y: y0 + q.y * s });
      const k1 = 1 - ease(stage(t, 0.36, 0.46));
      bigPixels(bm, x0, y0, s, 'rgba(23,22,20,0.22)', { alpha: Math.max(0.35, k1) });
      // the outline, drawn round
      const k2 = stage(t, 0.12, 0.36);
      if (k2 > 0) for (const r of S.rings) D.poly([...r, r[0]].map(T), (p) => p, { color: colors.accent, width: 2, upTo: k2 });
      // the strokes' footprint and the comparison
      const k3 = ease(stage(t, 0.46, 0.62));
      if (k3 > 0) {
        const hit = Sk.hits(S.raw.strokes, bm.w, bm.h, 0.5);
        ctx.save(); ctx.globalAlpha = k3;
        for (let i = 0; i < hit.length; i++) {
          const a = bm.data[i], b = hit[i]; if (!a && !b) continue;
          ctx.fillStyle = a && b ? 'rgba(40,38,34,0.85)' : a ? 'rgba(214,52,40,0.95)' : 'rgba(43,108,176,0.75)';
          ctx.fillRect(x0 + (i % bm.w) * s, y0 + ((i / bm.w) | 0) * s, s + 0.5, s + 0.5);
        }
        ctx.restore();
        for (const r of S.rings) D.poly([...r, r[0]].map(T), (p) => p, { color: '#7a1d16', width: 1, alpha: 0.5 * (1 - k3) + 0.25 });
      }
      const lx = 600, ly = 128, f = S.f;
      [[0.04, '每个字拥有自己的墨。连成一片的草书，按离哪个字的笔画近来分'],
       [0.12, '墨的边缘先轻轻模糊，再在一半的地方描线（marching squares）：平滑的轮廓，不是像素台阶'],
       [0.46, '笔画按毛笔的样子铺开：每两点之间，是一排笔毫横扫出来的四边形'],
       [0.62, `灰：两者都有。红：笔画漏掉的墨，${(100 * (1 - f.recall)).toFixed(1)}%。蓝：涂到墨外，${(100 * (1 - f.precision)).toFixed(1)}%`],
       [0.78, '页面上的「描紅」就是这条轮廓：红色留下的地方，是毛笔没写到的墨']]
        .forEach(([at, txt], i) => D.label(txt, lx, ly + i * 64, { zh: true, size: 14, color: colors.ink2, alpha: ease(stage(t, at, at + 0.06)), maxWidth: 620 }));
      D.caption('描紅：画出每个字的轮廓，再看笔画能不能把它填满。', 'The outline of every character, and how much of it the strokes fill.', ease(stage(t, 0.03, 0.1)));
    },
  });

  // =============================================================================
  // 10. stroke order from the template
  D.scene({
    id: 'order', zh: '笔画与笔顺：模板对上墨', en: 'which pieces make each stroke, and their order: the regular-script template fitted to the ink', seconds: 16,
    async setup() {
      const L = await lanting();
      const pick = async (ci, k) => {
        const { px, ch } = await charPixels(ci, k); const { bm } = charBitmap(px, L.IW);
        const med = L.medianFor(ch); if (!med) return null;
        const sk = Sk.thin(bm), dist = Sk.distanceTransform(bm);
        let chains = Sk.strokes(sk, dist, { bitmap: bm }).map((st) => st.map((q) => ({ x: q.x + 0.5, y: q.y + 0.5, w: Math.max(1, q.w) })));
        chains = chains.map((st) => (st.length > 2 ? Sk.resample(Sk.smooth(st, 1), 1) : st));
        const fit = Sk.byTemplate(chains, med, { bitmap: bm, debugLabels: true });
        const res = Sk.parseChar(bm, med, {});
        // the template's strokes where the fit starts (box to box) and where it ends
        const tm = med.map((m) => m.map(([x, y]) => ({ x, y: -y })));
        const ap = (A, q) => ({ x: A.a * q.x + A.b * q.y + A.c, y: A.d * q.x + A.e * q.y + A.f });
        const from = tm.map((st) => st.map((q) => ap(fit.A0, q)));
        const to = tm.map((st, k) => st.map((q) => { const r = ap(fit.A, q); return { x: r.x + fit.shiftOf[k].x, y: r.y + fit.shiftOf[k].y }; }));
        // the strokes as played: consecutive pieces of one template stroke are one step
        const steps = []; res.strokes.forEach((st, i) => { const key = res.tIndex[i]; const last = steps[steps.length - 1]; if (last && key !== -1 && last.key === key) last.pieces.push(st); else steps.push({ key, pieces: [st] }); });
        return { bm, ch, med, chains, fit, from, to, steps };
      };
      return (await pick(0, 3)) || (await pick(0, 0));          // 年
    },
    draw(ctx, t, S) {
      D.title('笔画与笔顺：模板对上墨', 'the template says which pieces belong to one stroke, and in what order', null);
      const { bm } = S; const s = Math.min(560 / bm.h, 470 / bm.w); const x0 = 70, y0 = 90 + (560 - bm.h * s) / 2;
      D.rect(x0 - 10, 90, bm.w * s + 20, 560, { fill: '#fff', stroke: colors.rule });
      bigPixels(bm, x0, y0, s, 'rgba(23,22,20,0.12)');
      const T = (q) => ({ x: x0 + q.x * s, y: y0 + q.y * s });
      const K = S.fit.K;
      // 1. the skeleton's chains: pieces of ink, not yet strokes
      const k1 = ease(stage(t, 0.03, 0.12)), kLab = ease(stage(t, 0.42, 0.55)), kOut = ease(stage(t, 0.66, 0.74));
      S.chains.forEach((c) => D.poly(c.map(T), (p) => p, { color: 'rgba(23,22,20,0.55)', width: 3, alpha: k1 * (1 - kLab) }));
      // 2. the template, moved from box-to-box onto the ink
      const kFit = ease(stage(t, 0.14, 0.4)), kT = ease(stage(t, 0.12, 0.16)) * (1 - ease(stage(t, 0.5, 0.6)));
      if (kT > 0) S.from.forEach((st, k) => {
        const pts = st.map((q, i) => ({ x: q.x + (S.to[k][i].x - q.x) * kFit, y: q.y + (S.to[k][i].y - q.y) * kFit }));
        D.poly(pts.map(T), (p) => p, { color: hue(k), width: 2.5, alpha: 0.9 * kT });
        const p0 = T(pts[0]); D.badge(k + 1, p0.x, p0.y, hue(k), { alpha: kT, r: 9 });
      });
      // 3. every sample of every chain takes the label of a template stroke (or none)
      if (kLab > 0) S.chains.forEach((c, ci) => {
        const lab = S.fit.labelArrays[ci];
        for (let i = 1; i < c.length; i++) {
          const k = lab[i]; const col = k === K ? 'rgba(23,22,20,0.35)' : hue(k);
          const a = T(c[i - 1]), b = T(c[i]);
          ctx.save(); ctx.globalAlpha = kLab * (1 - kOut * 0.85); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
        }
      });
      // 4. the strokes as written, one after another
      const n = S.steps.length, kSeq = stage(t, 0.72, 0.95);
      S.steps.forEach((stp, i) => {
        const show = clamp(kSeq * n - i, 0, 1); if (show <= 0) return;
        const col = stp.key >= 0 ? hue(stp.key) : colors.ink2;
        stp.pieces.forEach((pc, j) => D.poly(pc.map(T), (p) => p, { color: col, width: 3.5, alpha: show, upTo: j === stp.pieces.length - 1 ? show : 1 }));
        const last = stp.pieces[stp.pieces.length - 1]; if (last.length > 3 && show >= 1) D.arrow(T(last[last.length - 4]), T(last[last.length - 1]), { color: col, width: 2.5, head: 10 });
        const p0 = T(stp.pieces[0][0]); D.badge(i + 1, p0.x, p0.y, col, { alpha: show });
      });
      // right: what happens
      const lx = 620, ly = 128;
      [[0.03, `${S.ch}：细化和选笔给出 ${S.chains.length} 段墨。一段可能是半笔，也可能是两笔连在一起：墨本身不说`],
       [0.14, `楷书模板（hanzi-writer）知道这个字有 ${S.med.length} 笔、各在哪里、先写哪笔。先按外框放上去`],
       [0.24, '再用迭代最近点对齐（仿射变换，近的点、方向一致的点权重大），每笔再微调位置'],
       [0.42, '沿着每段墨逐点决定它属于模板的哪一笔（或哪笔都不是），在一笔转进下一笔的地方切开'],
       [0.66, '同一笔的几段按模板的走向排好、接起来；整个字按模板的笔顺写，每笔的方向跟模板一致'],
       [0.86, `模板对不上的字（异体、草书）退回去，按笔势排序`]]
        .forEach(([at, txt], i) => D.label(txt, lx, ly + i * 62, { zh: true, size: 14, color: colors.ink2, alpha: ease(stage(t, at, at + 0.05)), maxWidth: 600 }));
      D.caption('切成哪几笔、先写哪笔，用同一个字的楷书模板来定；笔画的形状和粗细仍然全部来自墨。', 'The template decides which pieces make one stroke and the order they are written in; every stroke\'s shape and width still come from the ink.', ease(stage(t, 0.02, 0.1)));
    },
  });

  // =============================================================================
  // 11. wild cursive: columns and cells of 自敘帖
  let zixuP = null;
  function zixu() {
    if (zixuP) return zixuP;
    zixuP = (async () => {
      const { canvas, px } = await D.loadImage('assets/demo/zixu-cols.jpg');
      const IW = px.width, IH = px.height; const R = { x0: 0, x1: IW, y0: 0, y1: IH };
      const mask = Core.inkMask(px, R, { lum: 100, red: 40 }); Core.despeckle(mask, IW, R);
      const comps = Core.components(mask, IW, R);
      const redness = (c) => { let s = 0; for (const i of c.px) { const j = i * 4; s += px.data[j] / (px.data[j + 1] + 1); } return s / c.px.length; };
      const kept = Core.filterComponents(comps, { minArea: 30 }, redness);
      const mask2 = Core.maskFromComponents(new Uint8Array(IW * IH), kept);
      const prof = Core.columnProfile(mask2, IW, R);
      const found = Core.findColumns(prof, R, { split: 1.8, narrow: 0.3 }, kept);
      const cols = found.runs.map((r) => ({ x0: Math.max(R.x0, r.x0 - 6), x1: Math.min(R.x1, r.x1 + 6) }));
      const stream = [...'懷素家長沙幼而事佛經禪之暇頗好筆翰然恨未能遠覩前人之奇迹所見甚淺遂擔笈杖錫西遊上國謁見當代名公錯綜其事'];
      const cuts = cols.map((col) => { const inCol = kept.filter((c) => c.cx >= col.x0 && c.cx < col.x1); return Core.cutColumn(inCol, col, R, IW, IH, { stream, k: 0.95, shapeWeight: 2 }); });
      const medianFor = (ch) => (window.GLYPHS && window.GLYPHS[ch] ? window.GLYPHS[ch].m : null);
      return { canvas, px, IW, IH, R, kept, mask2, prof, found, cols, cuts, medianFor };
    })();
    return zixuP;
  }
  D.scene({
    id: 'cursive-columns', zh: '狂草：分列与切字', en: 'wild cursive: columns, and how many characters a column holds', seconds: 15,
    async setup() { const Z = await zixu(); return { Z }; },
    draw(ctx, t, S) {
      D.title('狂草：分列与切字', '自敘帖: the ink hardly breaks, so the count per column is decided by cost', null);
      const { Z } = S; const IW = Z.IW, IH = Z.IH;
      const f = D.fit(IW, IH, 0, 0, 340, 470); const x0 = 60, y0 = 86; const tf = mkTf(0, 0, f.s, x0 + f.x, y0 + f.y);
      D.image(Z.canvas, 0, 0, IW, IH, x0 + f.x, y0 + f.y, f.w, f.h, { alpha: 0.9 });
      // columns
      const k1 = ease(stage(t, 0.05, 0.2));
      Z.found.runs.forEach((r) => { const a = tf({ x: r.x0, y: 0 }), b = tf({ x: r.x1, y: 0 }); D.rect(a.x, y0 + f.y, b.x - a.x, f.h, { fill: colors.blue, alpha: 0.18 * k1 }); });
      // profile beneath
      const cy = y0 + f.y + f.h + 8, ch = 60; const maxP = Z.found.p95 * 1.4;
      ctx.save(); ctx.fillStyle = colors.blue; ctx.globalAlpha = 0.8 * k1;
      for (let x = 0; x < IW; x += 2) { const v = Math.min(1, Z.found.sm[x] / maxP); const p = tf({ x, y: 0 }); ctx.fillRect(p.x, cy + ch - v * ch, Math.max(1, 2 * f.s), v * ch); }
      ctx.restore();
      // one column's candidates
      const ci = 0, cut = Z.cuts[ci], col = Z.cols[ci];
      const k2 = ease(stage(t, 0.25, 0.4));
      const a = tf({ x: col.x0, y: cut.top }), b = tf({ x: col.x1, y: cut.bottom });
      D.rect(a.x, a.y, b.x - a.x, b.y - a.y, { stroke: colors.accent, width: 2, alpha: k2 });
      // bar chart of candidate n
      const bx = 470, by = 130, bw = 300, bh = 220;
      D.label('这一列放几个字？', bx, by - 10, { zh: true, size: 16, alpha: k2 });
      D.label('score(n) = cut cost / n + 2 × ln²(cell height / (0.95 × column width))', bx, by + 6, { size: 11, color: colors.ink3, alpha: k2 });
      if (cut.candidates && k2 > 0) {
        const cands = cut.candidates; const maxS = Math.max(...cands.map((c) => c.score)); const best = cands.reduce((m, c) => (c.score < m.score ? c : m), cands[0]);
        const bwid = Math.min(40, bw / cands.length - 6);
        cands.forEach((c, i) => {
          const k3 = ease(stage(t, 0.4 + i * 0.03, 0.48 + i * 0.03));
          const hgt = (c.score / maxS) * bh * k3; const x = bx + i * (bwid + 6);
          D.rect(x, by + 20 + bh - hgt, bwid, hgt, { fill: c === best ? colors.green : colors.blue, alpha: 0.8 });
          D.label(`n=${c.n}`, x + bwid / 2, by + 20 + bh + 16, { size: 11, align: 'center', color: colors.ink2, alpha: k3 });
        });
        const k4 = ease(stage(t, 0.62, 0.72));
        D.label(`选 n = ${cut.N}：${cut.text.join('')}`, bx, by + 20 + bh + 44, { zh: true, size: 16, color: colors.green, alpha: k4 });
        // cuts on the column
        cut.cuts.forEach((cy2, i) => { if (i === 0 || i === cut.cuts.length - 1) return; const p = tf({ x: col.x0, y: cy2 }), q = tf({ x: col.x1, y: cy2 }); ctx.save(); ctx.globalAlpha = k4; ctx.strokeStyle = colors.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore(); });
        // spanning components: strokes assigned by their middle
        const k5 = ease(stage(t, 0.78, 0.92));
        if (k5 > 0 && cut.split.length) {
          const c = cut.split[0]; const strokes = Core.traceComponent(c, IW);
          const cellOf = (y) => { let k = 0; while (k < cut.N - 1 && y >= cut.cuts[k + 1]) k++; return k; };
          strokes.forEach((s) => { const mid = s[Math.floor(s.length / 2)]; D.poly(s, tf, { color: hue(cellOf(mid.y)), width: 3, alpha: k5 }); });
          D.label(`一个连通域跨了 ${cellOf(c.y1 - 1) - cellOf(c.y0) + 1} 个格子：它的每一笔按笔画中点归格`, bx, by + 20 + bh + 76, { zh: true, size: 14, color: colors.ink2, alpha: k5 });
          D.label('a component spanning cells: each of its strokes goes to the cell its middle lies in', bx, by + 20 + bh + 94, { size: 11, color: colors.ink3, alpha: k5 });
        }
      }
      D.caption(t < 0.62 ? '狂草一列往往是一条连续的墨，格子之间没有空行。不知道每列几个字时，把全文当一串，让每列自己选字数：切线代价 + 格子形状偏离字宽的代价。' : '选定字数后照常切格。跨格的连通域不按像素切，而是先提取笔画，再把每一笔归到它中点所在的格子——牵丝不断。',
        t < 0.62 ? 'A cursive column is often one unbroken run of ink. With the text as a stream, each column picks its own count by cost.' : 'Spanning components are not cut by pixel: their strokes are extracted first, then each stroke goes to the cell of its midpoint.', ease(stage(t, 0.05, 0.15)));
    },
  });

  // =============================================================================
  // 12. wild cursive: one character's tracks and their order
  D.scene({
    id: 'cursive-strokes', zh: '狂草：一笔一势', en: 'a cursive character as the movements of the brush, put back together and ordered by the flow of the hand', seconds: 16,
    async setup() {
      const Z = await zixu();
      // among the first characters, the one where the most pieces are put back together
      let best = null;
      for (const [ci, cut] of Z.cuts.entries()) for (let k = 0; k < Math.min(cut.N, 9); k++) {
        const pxList = cut.cells[k]; if (!pxList || pxList.length < 400) continue;
        const { bm } = charBitmap(pxList, Z.IW);
        const sk = Sk.thin(bm), dist = Sk.distanceTransform(bm);
        const chains = Sk.strokes(sk, dist, { bitmap: bm }).map((st) => st.map((q) => ({ x: q.x + 0.5, y: q.y + 0.5, w: Math.max(1, q.w) }))).map((st) => (st.length > 2 ? Sk.resample(Sk.smooth(st, 1), 1) : st));
        const tracks = Sk.joinTracks(chains);
        const groups = Sk.groupAlongside(tracks);
        const links = Sk.linkMovements(groups.map((g) => g.spine), { indices: true });
        const score = chains.length - links.length;
        if (!best || score > best.score) best = { score, bm, ch: cut.text[k], chains, tracks, groups, links };
        if (ci > 0 && k > 6) break;
      }
      const med = Z.medianFor(best.ch);
      const res = Sk.parseChar(best.bm, med, { cursive: true });
      const steps = []; res.strokes.forEach((st, i) => { const key = res.tIndex[i]; const last = steps[steps.length - 1]; if (last && last.key === key) last.pieces.push(st); else steps.push({ key, pieces: [st] }); });
      return { ...best, res, steps };
    },
    draw(ctx, t, S) {
      D.title('狂草：一笔一势', 'pieces of ink, joined into the movements of the brush, ordered by where it flows', null);
      const { bm } = S; const s = Math.min(560 / bm.h, 470 / bm.w); const x0 = 70, y0 = 90 + (560 - bm.h * s) / 2;
      D.rect(x0 - 10, 90, bm.w * s + 20, 560, { fill: '#fff', stroke: colors.rule });
      bigPixels(bm, x0, y0, s, 'rgba(23,22,20,0.12)');
      const T = (q) => ({ x: x0 + q.x * s, y: y0 + q.y * s });
      const ph = [stage(t, 0.03, 0.08), stage(t, 0.2, 0.25), stage(t, 0.37, 0.42), stage(t, 0.54, 0.59), stage(t, 0.71, 0.76)];
      const fade = (i) => ease(ph[i]) * (1 - ease(i < 4 ? ph[i + 1] : 0));
      // 1. pieces: what the selection kept, each its own colour
      if (fade(0) > 0) S.chains.forEach((c, k) => D.poly(c.map(T), (p) => p, { color: hue(k), width: 4, alpha: fade(0) }));
      // 2. tracks: pieces whose ends meet are one track, joined at the smoothest pairing
      if (fade(1) > 0) S.tracks.forEach((c, k) => D.poly(c.map(T), (p) => p, { color: hue(k), width: 4, alpha: fade(1) }));
      // 3. a fringe piece or a parallel dry streak goes with the track it runs along
      if (fade(2) > 0) S.groups.forEach((g, k) => [g.spine, ...g.extras].forEach((c, j) => D.poly(c.map(T), (p) => p, { color: hue(k), width: j ? 2.5 : 4, alpha: fade(2), dash: j ? [5, 4] : null })));
      // 4. movements: tracks broken by a dry brush, strung back together across the gaps
      if (fade(3) > 0) S.links.forEach((seq, k) => {
        let prev = null;
        for (const { i, rev } of seq) {
          const g = S.groups[i], sp = rev ? g.spine.slice().reverse() : g.spine;
          [sp, ...g.extras].forEach((c, j) => D.poly(c.map(T), (p) => p, { color: hue(k), width: j ? 2.5 : 4, alpha: fade(3) }));
          if (prev) { const a = T(prev), b = T(sp[0]); D.poly([a, b], (p) => p, { color: hue(k), width: 2, alpha: fade(3), dash: [3, 4] }); }
          prev = sp[sp.length - 1];
        }
      });
      // 5. the movements in the order the hand wrote them
      const n = S.steps.length, kSeq = stage(t, 0.76, 0.96);
      S.steps.forEach((stp, i) => {
        const show = clamp(kSeq * n - i, 0, 1); if (show <= 0) return;
        const col = hue(i);
        stp.pieces.forEach((pc, j) => D.poly(pc.map(T), (p) => p, { color: col, width: 3.5, alpha: show }));
        const last = stp.pieces[stp.pieces.length - 1]; if (last.length > 3 && show >= 1) D.arrow(T(last[last.length - 4]), T(last[last.length - 1]), { color: col, width: 2.5, head: 10 });
        const p0 = T(stp.pieces[0][0]); D.badge(i + 1, p0.x, p0.y, col, { alpha: show });
      });
      const lx = 620, ly = 128;
      [[0.03, `选笔留下 ${S.chains.length} 段墨。懷素的笔几乎不离纸，墨断开是因为笔干了、交叉了`],
       [0.2, `两段的端点碰在一起，就是同一笔接着走：按最顺的方向配对，接成 ${S.tracks.length} 条`],
       [0.37, `贴着一条走的短段（厚笔的毛边、笔毛分叉留下的平行干笔）归给那一条`],
       [0.54, `干笔留下的空白，前后两段方向一致、相隔几个笔宽，就是同一势：连成 ${S.links.length} 势`],
       [0.71, `楷书模板对得上就按模板排，对不上就按笔势：从左上起，下一势从离上一势收笔最近的地方起`]]
        .forEach(([at, txt], i) => D.label(txt, lx, ly + i * 70, { zh: true, size: 14, color: colors.ink2, alpha: ease(stage(t, at, at + 0.05)), maxWidth: 600 }));
      D.caption('草书一笔就是一势：把断开的墨按笔的走向接回去，一势一步。', 'In cursive a stroke is a movement of the brush: the broken ink is joined back along the way the brush went, one movement per step.', ease(stage(t, 0.02, 0.1)));
    },
  });

  // =============================================================================
  // 13. the brush writes the tracks
  D.scene({
    id: 'brush', zh: '毛笔沿轨迹书写', en: 'the brush writes along the extracted tracks', seconds: 14,
    async setup() {
      const L = await lanting();
      const T = window.TRACED && window.TRACED.lanting; if (!T) throw new Error('data/traced/lanting.js not loaded');
      const recs = T.chars.filter((c) => c.col === 0).slice(0, 7);
      const pw = 300, ph = 550;
      // scan → panel scale: the column's box
      let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
      for (const r of recs) { x0 = Math.min(x0, r.box[0]); x1 = Math.max(x1, r.box[0] + r.box[2]); y0 = Math.min(y0, r.box[1]); y1 = Math.max(y1, r.box[1] + r.box[3]); }
      const s = Math.min((pw - 40) / (x1 - x0), (ph - 40) / (y1 - y0));
      const L2 = { s, tf: (x, y) => ({ x: 20 + (x - x0) * s, y: 20 + (y - y0) * s }) };
      // a p5 instance with an offscreen buffer for the ink brush
      const state = { recs, L2, pw, ph, ops: null, pg: null, p: null, idx: 0, gen: null, done: 0, total: 0 };
      await new Promise((resolve) => {
        new p5((p) => {
          p.setup = () => {
            p.noCanvas(); p.pixelDensity(1); p.noiseSeed(7);
            const pg = p.createGraphics(pw, ph); pg.pixelDensity(1);
            pg.background(246, 242, 232);
            const env = { p, g: pg, rng: new RNG.Rng(7), W: pw, H: ph, seed: 7 };
            const B = InkBrush.create(env); pg.drawingContext.globalCompositeOperation = 'multiply';
            const Tr = Traced.create(B);
            const style = { weight: 1.15, tremor: 0.45, wet: 0.25, dryScale: 0.7 };
            state.ops = recs.flatMap((rec, i) => Tr.charOps(rec, L2, style, 1 - i * 0.08));
            state.total = state.ops.reduce((a, o) => a + o.units, 0);
            state.pg = pg; state.p = p; state.env = env; state.B = B;
            resolve();
          };
        });
      });
      state.reset = () => { state.pg.drawingContext.globalCompositeOperation = 'source-over'; state.pg.background(246, 242, 232); state.pg.drawingContext.globalCompositeOperation = 'multiply'; state.env.rng = new RNG.Rng(7); state.p.noiseSeed(7); state.idx = 0; state.gen = null; state.done = 0; state.frac = 0; };
      state.reset();
      return state;
    },
    draw(ctx, t, S) {
      D.title('毛笔沿轨迹书写', 'the measured width is the pressure; the brush adds bristles, dry streaks and pooling', null);
      // tracks on the left
      const lx = 120, ly = 90;
      D.rect(lx, ly, S.pw, S.ph, { fill: '#fff', stroke: colors.rule });
      S.recs.forEach((rec, i) => rec.strokes.forEach((s) => { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(43,108,176,0.55)'; for (let k = 1; k < s.length; k++) { ctx.lineWidth = Math.max(1, s[k][2] * S.L2.s); const a = S.L2.tf(s[k - 1][0], s[k - 1][1]), b = S.L2.tf(s[k][0], s[k][1]); ctx.beginPath(); ctx.moveTo(lx + a.x, ly + a.y); ctx.lineTo(lx + b.x, ly + b.y); ctx.stroke(); } ctx.restore(); }));
      D.label('提取的轨迹（宽度 = 距离变换）', lx, ly - 8, { zh: true, size: 13, color: colors.ink2 });
      // the brush, advanced to the fraction of ops for t (monotone; reset when going back)
      const frac = stage(t, 0.08, 0.95);
      if (frac < S.frac) S.reset();
      const target = Math.round(frac * S.total);
      let guard = 0;
      while (S.done < target && guard++ < 200000) {
        if (!S.gen) { if (S.idx >= S.ops.length) break; S.gen = S.ops[S.idx].run(); }
        const r = S.gen.next(); if (r.done) { S.gen = null; S.idx++; continue; } S.done++;
      }
      S.frac = frac;
      const rx = 560;
      D.rect(rx, ly, S.pw, S.ph, { fill: '#fff', stroke: colors.rule });
      ctx.drawImage(S.pg.elt, rx, ly);
      D.label('毛笔写出来的', rx, ly - 8, { zh: true, size: 13, color: colors.ink2 });
      const cur = S.ops[Math.min(S.idx, S.ops.length - 1)];
      D.label(cur ? cur.label : '', rx + 120, ly - 8, { size: 12, color: colors.ink3 });
      const tx = 910, ty = 130;
      [[0.05, '轨迹上每一点带着 (x, y, 宽度)'], [0.1, '毛笔是一束笔毫，各有墨量和位置'], [0.2, '宽度曲线当作压力：笔毫沿法线铺开'], [0.35, '墨随行笔渐干：部分笔毫断墨，露出飞白'], [0.5, '蘸墨后第一笔略带涨墨'], [0.5, '两端不再另加收尖：墨迹里已经有了'], [0.7, '笔顺就是上一节定下的顺序']]
        .forEach(([at, s], i) => D.label(s, tx, ty + i * 38, { zh: true, size: 14, color: colors.ink2, alpha: ease(stage(t, at, at + 0.08)) }));
      D.caption('从扫描件到毛笔：位置、粗细、连断、笔顺都来自原帖；笔毫、飞白、涨墨来自毛笔模拟。', 'From scan to brush: path, width, links and order come from the original; bristles, flying white and pooling from the simulation.', ease(stage(t, 0.05, 0.15)));
    },
  });
})();
