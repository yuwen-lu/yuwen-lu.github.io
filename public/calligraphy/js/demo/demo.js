// Demo runtime: a 1280×720 canvas, a list of scenes, and a deterministic
// render(scene, t) for t in 0..1 so the same frames come out in the browser
// and in tools/record-demo.js. Scenes live in js/demo/scenes.js.
window.Demo = (() => {
  const W = 1280, H = 720;
  const scenes = [], byId = {};
  const font = { zh: '"Songti SC", "Songti TC", "Noto Serif CJK SC", serif', en: '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif', mono: 'Menlo, Consolas, monospace' };
  const colors = { paper: '#f1ece1', ink: '#171614', ink2: '#4a4640', ink3: '#8a847a', rule: '#cfc7b6', accent: '#9c2f2f', blue: '#2b6cb0', green: '#2f855a', orange: '#c05621', purple: '#6b46c1' };
  const hue = (k) => `hsl(${(k * 47) % 360},80%,42%)`;
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  // progress of a sub-stage [a, b] of the timeline
  const stage = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let canvas, ctx;
  function attach(c) { canvas = c; canvas.width = W; canvas.height = H; ctx = canvas.getContext('2d'); return ctx; }

  // ---- assets --------------------------------------------------------------------
  const cache = {};
  function loadImage(src) {
    if (cache[src]) return cache[src];
    cache[src] = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const id = g.getImageData(0, 0, c.width, c.height);
        resolve({ img, canvas: c, px: { data: id.data, width: c.width, height: c.height, channels: 4 } });
      };
      img.onerror = () => reject(new Error('cannot load ' + src));
      img.src = src;
    });
    return cache[src];
  }

  // ---- drawing helpers ------------------------------------------------------------
  function paper() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = colors.paper; ctx.fillRect(0, 0, W, H);
  }
  let currentIdx = null;   // the number of the scene being drawn (1-based)
  function title(zh, en, idx) {
    idx = currentIdx ?? idx;
    ctx.fillStyle = colors.ink; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = `500 30px ${font.zh}`; ctx.fillText(zh, 40, 54);
    const w = ctx.measureText(zh).width;
    ctx.fillStyle = colors.ink3; ctx.font = `15px ${font.en}`; ctx.fillText(en, 40 + w + 16, 54);
    if (idx != null) { ctx.textAlign = 'right'; ctx.font = `13px ${font.mono}`; ctx.fillText(String(idx).padStart(2, '0'), W - 40, 54); ctx.textAlign = 'left'; }
    ctx.strokeStyle = colors.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(40, 70); ctx.lineTo(W - 40, 70); ctx.stroke();
  }
  // caption: a Chinese line and an English line at the bottom; k fades it in
  function caption(zh, en, k = 1) {
    ctx.save(); ctx.globalAlpha = clamp(k, 0, 1);
    ctx.fillStyle = colors.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // shrink a long line until it fits the width
    const fitFont = (text, size, fam, min) => { let sz = size; ctx.font = `${sz}px ${fam}`; while (ctx.measureText(text).width > W - 80 && sz > min) { sz -= 1; ctx.font = `${sz}px ${fam}`; } };
    fitFont(zh, 22, font.zh, 15); ctx.fillText(zh, 40, H - 62);
    ctx.fillStyle = colors.ink2; fitFont(en, 15, font.en, 11); ctx.fillText(en, 40, H - 34);
    ctx.restore();
  }
  function label(text, x, y, o = {}) {
    if (o.maxWidth) {
      // wrap: a character at a time (the labels are mostly Chinese, which breaks anywhere)
      ctx.save(); ctx.font = `${o.size || 13}px ${o.zh ? font.zh : font.en}`;
      const lines = []; let cur = '';
      for (const ch of String(text)) { if (ctx.measureText(cur + ch).width > o.maxWidth && cur) { lines.push(cur); cur = ch.trim() ? ch : ''; } else cur += ch; }
      if (cur) lines.push(cur);
      ctx.restore();
      const lh = (o.size || 13) * 1.5;
      lines.forEach((ln, i) => label(ln, x, y + i * lh, { ...o, maxWidth: 0 }));
      return;
    }
    ctx.save(); ctx.font = `${o.size || 13}px ${o.zh ? font.zh : font.en}`; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.baseline || 'alphabetic';
    ctx.globalAlpha = o.alpha ?? 1;
    if (o.bg) { const w = ctx.measureText(text).width + 10; const xx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x - 5; ctx.fillStyle = o.bg; ctx.fillRect(xx, y - (o.size || 13) - 3, w, (o.size || 13) + 8); }
    ctx.fillStyle = o.color || colors.ink; ctx.globalAlpha = o.alpha ?? 1; ctx.fillText(text, x, y); ctx.restore();
  }
  function rect(x, y, w, h, o = {}) {
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fillRect(x, y, w, h); }
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width || 1; if (o.dash) ctx.setLineDash(o.dash); ctx.strokeRect(x, y, w, h); }
    ctx.restore();
  }
  // a polyline of points {x,y} through a transform tf
  function poly(pts, tf, o = {}) {
    if (pts.length < 2) return;
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.strokeStyle = o.color || colors.ink; ctx.lineWidth = o.width || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); const p0 = tf(pts[0]); ctx.moveTo(p0.x, p0.y);
    const n = o.upTo != null ? Math.max(1, Math.min(pts.length, Math.round(o.upTo * pts.length))) : pts.length;
    for (let i = 1; i < n; i++) { const p = tf(pts[i]); ctx.lineTo(p.x, p.y); }
    ctx.stroke(); ctx.restore();
  }
  function arrow(a, b, o = {}) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x), ah = o.head || 9;
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.strokeStyle = ctx.fillStyle = o.color || colors.ink; ctx.lineWidth = o.width || 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - ah * Math.cos(ang - 0.45), b.y - ah * Math.sin(ang - 0.45)); ctx.lineTo(b.x - ah * Math.cos(ang + 0.45), b.y - ah * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function dot(x, y, r, color, o = {}) { ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width || 1.5; ctx.stroke(); } ctx.restore(); }
  function badge(n, x, y, color, o = {}) {
    dot(x, y, o.r || 11, 'white', { stroke: color, width: 2, alpha: o.alpha });
    label(String(n), x, y + 4.5, { size: 12, color, align: 'center', alpha: o.alpha });
  }
  // draw a region of a source canvas into a destination rect (keeps aspect, centred)
  function fit(sw, sh, dx, dy, dw, dh) { const s = Math.min(dw / sw, dh / sh); return { s, x: dx + (dw - sw * s) / 2, y: dy + (dh - sh * s) / 2, w: sw * s, h: sh * s }; }
  function image(src, sx, sy, sw, sh, dx, dy, dw, dh, o = {}) {
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1; if (o.filter) ctx.filter = o.filter;
    ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh); ctx.restore();
  }
  // paint a set of pixel indices (of an image of width iw) as a bitmap, scaled to the rect
  function pixels(px, iw, ih, region, tf, color, o = {}) {
    const c = pixelCanvas(px, iw, ih, region, color, o);
    const p0 = tf({ x: region.x0, y: region.y0 }), p1 = tf({ x: region.x1, y: region.y1 });
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.imageSmoothingEnabled = o.smooth ?? true;
    ctx.drawImage(c, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y); ctx.restore();
  }
  function pixelCanvas(px, iw, ih, region, color, o = {}) {
    const rw = region.x1 - region.x0, rh = region.y1 - region.y0;
    const c = document.createElement('canvas'); c.width = rw; c.height = rh;
    const g = c.getContext('2d'); const id = g.createImageData(rw, rh); const d = id.data;
    const [r, gg, b] = color;
    for (const i of px) { const x = i % iw - region.x0, y = ((i / iw) | 0) - region.y0; if (x < 0 || y < 0 || x >= rw || y >= rh) continue; const j = (y * rw + x) * 4; d[j] = r; d[j + 1] = gg; d[j + 2] = b; d[j + 3] = 255; }
    g.putImageData(id, 0, 0); return c;
  }
  // a mask (Uint8Array over an image of width iw) painted in colour
  function maskCanvas(mask, iw, ih, region, color) {
    const rw = region.x1 - region.x0, rh = region.y1 - region.y0;
    const c = document.createElement('canvas'); c.width = rw; c.height = rh;
    const g = c.getContext('2d'); const id = g.createImageData(rw, rh); const d = id.data;
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { if (!mask[(y + region.y0) * iw + x + region.x0]) continue; const j = (y * rw + x) * 4; d[j] = color[0]; d[j + 1] = color[1]; d[j + 2] = color[2]; d[j + 3] = 255; }
    g.putImageData(id, 0, 0); return c;
  }
  const hsl = (h, s = 80, l = 45) => { const a = s * Math.min(l, 100 - l) / 100, f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)].map((v) => Math.round(v * 2.55)); };

  // ---- scenes ---------------------------------------------------------------------
  // def: { id, zh, en, seconds, setup() -> state (async ok), draw(ctx, t, state) }
  function scene(def) { scenes.push(def); byId[def.id] = def; }
  async function prepare(id) { const d = byId[id]; if (!d) throw new Error('no scene ' + id); if (!d.state) d.state = await d.setup(); return d; }
  function render(id, t) { const d = byId[id]; if (!d || !d.state) throw new Error('scene not prepared: ' + id); currentIdx = scenes.indexOf(d) + 1; paper(); d.draw(ctx, clamp(t, 0, 1), d.state); }

  return { W, H, font, colors, hue, hsl, ease, stage, clamp, attach, loadImage, paper, title, caption, label, rect, poly, arrow, dot, badge, fit, image, pixels, pixelCanvas, maskCanvas, scene, scenes, byId, prepare, render, get ctx() { return ctx; } };
})();
