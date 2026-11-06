// Rice-paper texture: warm base, low-frequency mottling, fine grain, a few fibres.
window.InkPaper = function (p, W, H, rng, opts = {}) {
  const pg = p.createGraphics(W, H); pg.pixelDensity(1);
  const ctx = pg.drawingContext;
  const base = opts.base || [244, 239, 226];
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, W, H);
  // mottling via a tiny noise canvas scaled up with smoothing
  const small = document.createElement('canvas');
  small.width = Math.ceil(W / 24); small.height = Math.ceil(H / 24);
  const sctx = small.getContext('2d');
  const sid = sctx.createImageData(small.width, small.height);
  for (let i = 0; i < sid.data.length; i += 4) {
    const v = 225 + rng.next() * 30;
    sid.data[i] = v; sid.data[i + 1] = v - 2; sid.data[i + 2] = v - 10; sid.data[i + 3] = 255;
  }
  sctx.putImageData(sid, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = opts.mottle ?? 0.45;
  ctx.drawImage(small, 0, 0, W, H);
  ctx.globalAlpha = 1;
  // fine grain
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data; const grain = opts.grain ?? 9;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng.next() - 0.5) * grain;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(id, 0, 0);
  // fibres
  ctx.lineCap = 'round';
  const nf = opts.fibres ?? Math.round((W * H) / 4500);
  for (let i = 0; i < nf; i++) {
    const x = rng.range(0, W), y = rng.range(0, H), a = rng.range(0, Math.PI), l = rng.range(4, 22);
    const light = rng.chance(0.5);
    ctx.strokeStyle = light ? `rgba(255,255,255,${rng.range(0.15, 0.4)})` : `rgba(120,100,70,${rng.range(0.05, 0.14)})`;
    ctx.lineWidth = rng.range(0.5, 1.2);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
  return pg;
};
