// InkBrush: a Chinese brush simulation for p5.
//
// A stroke is rendered as a bundle of bristles. Each bristle carries its own
// ink load that depletes along the stroke; when the brush is "dry" bristles
// drop out and reveal the paper — the "flying white" (飞白) effect. A wet
// brush leaves a faint bleeding halo (洇). Everything draws with black ink at
// varying alpha onto a multiply-blended paper layer, so overlapping strokes
// darken the way layered ink does.
window.InkBrush = (() => {
  const TAU = Math.PI * 2;

  function create(env) {
    const { p, g, rng, W, H } = env;
    const ctx = g.drawingContext;
    let clipDepth = 0;
    const noise = (x, y = 0) => p.noise(x, y);

    // per-bristle alpha from an "ink darkness" value in [0,1]
    const alphaFor = (ink) => Math.min(1, Math.pow(Math.max(0, ink), 1.4) * 0.7);

    function pathTo(poly) {
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
    }

    // Clip to `include` polygon and cut out every polygon in `excludes`
    // (shapes painted earlier that sit in front of this one).
    function clipBegin(include, excludes = []) {
      ctx.save(); clipDepth++;
      if (include) { ctx.beginPath(); pathTo(include); ctx.clip(); }
      for (const ex of excludes) {
        if (!ex || ex.length < 3) continue;
        ctx.beginPath(); ctx.rect(-20, -20, W + 40, H + 40); pathTo(ex); ctx.clip('evenodd');
      }
    }
    // Clip to a Path2D (used for glyph strokes).
    function clipPath(path) { ctx.save(); clipDepth++; ctx.clip(path); }
    function clipEnd() { if (clipDepth > 0) { ctx.restore(); clipDepth--; } }
    function resetState() { while (clipDepth > 0) clipEnd(); }

    // ---- the brush stroke -------------------------------------------------
    // pts: polyline; o: { w, ink, dry, wet, taperIn, taperOut, press(t), tremor,
    //   spacing, bristleDensity, alphaAt(x,y), yieldEvery, minW,
    //   wetSpread, wetPad — the wet halo's radius is wetSpread × width + wetPad,
    //   cap — the bristles' line cap: 'round' (default) or 'butt', which keeps
    //   consecutive segments from overlapping into dark dots on wide strokes,
    //   maxBristles — at most this many bristles (default 16; more for big strokes),
    //   bristleAlpha — [min, max] spread of the bristles' ink (default [0.7, 1.08]) }
    function* stroke(pts, o = {}) {
      const w = o.w ?? 4;
      const ink = o.ink ?? 0.8;
      const dry = o.dry ?? 0.2;
      const wet = o.wet ?? 0;
      const tin = o.taperIn ?? 0.15, tout = o.taperOut ?? 0.3;
      const press = o.press || null;
      const tremor = o.tremor ?? 0.6;
      const spacing = o.spacing ?? Math.max(1.2, w * 0.22);
      const yieldEvery = o.yieldEvery ?? 3;
      const minW = o.minW ?? 0.5;
      const path = Path.resample(pts, spacing);
      if (path.length < 2) return;
      const nB = Math.max(2, Math.min(o.maxBristles ?? 16, Math.round(w * (o.bristleDensity ?? 0.9))));
      const bristles = [];
      for (let i = 0; i < nB; i++) {
        bristles.push({
          off: ((i + 0.5) / nB - 0.5) + rng.range(-0.05, 0.05),
          a: alphaFor(ink * rng.range(o.bristleAlpha ? o.bristleAlpha[0] : 0.7, o.bristleAlpha ? o.bristleAlpha[1] : 1.08)),
          rad: rng.range(0.75, 1.35),
          phase: rng.range(0, 1000),
          px: 0, py: 0, on: false,
        });
      }
      const seed2 = rng.range(0, 1000);
      ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
      const dryGap = dry * 0.62;
      for (let k = 0; k < path.length; k++) {
        const pt = path[k], t = pt.t;
        let wd = w;
        if (tin > 0) wd *= Math.pow(Math.min(1, t / tin), 0.55);
        if (tout > 0) wd *= Math.pow(Math.min(1, (1 - t) / tout), 0.75);
        if (press) wd *= press(t);
        wd *= 1 + tremor * 0.35 * (noise(seed2 + pt.x * 0.04, pt.y * 0.04) - 0.5);
        if (wd < minW) wd = minW;
        const inkLeft = 1 - t * dry * 0.8;
        const posMod = o.alphaAt ? o.alphaAt(pt.x, pt.y, t) : 1;
        const swBase = Math.max(0.6, (wd / nB) * 2.0);
        for (const b of bristles) {
          const bx = pt.x + pt.nx * b.off * wd, by = pt.y + pt.ny * b.off * wd;
          let a = b.a * inkLeft * posMod;
          if (dry > 0.05) {
            const n = noise(b.phase + t * (3 + dry * 9), b.off * 4 + seed2);
            if (n < dryGap) a *= 0.12;
          }
          if (b.on && a > 0.015) {
            ctx.strokeStyle = `rgba(0,0,0,${a.toFixed(3)})`;
            ctx.lineWidth = swBase * b.rad;
            ctx.beginPath(); ctx.moveTo(b.px, b.py); ctx.lineTo(bx, by); ctx.stroke();
          }
          b.px = bx; b.py = by; b.on = true;
        }
        if (wet > 0 && (k % 2) === 0) {
          ctx.fillStyle = `rgba(0,0,0,${(wet * alphaFor(ink) * 0.16 * posMod).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, wd * (o.wetSpread ?? 0.95) + (o.wetPad ?? 1.5), 0, TAU); ctx.fill();
        }
        if (k % yieldEvery === 0) yield { x: pt.x, y: pt.y, w: wd };
      }
    }

    // A single dab (点): a short stroke with a bell-shaped pressure profile.
    function* dab(x, y, o = {}) {
      const w = o.w ?? 6;
      const len = o.len ?? w * 0.9;
      const ang = o.angle ?? rng.range(-0.25, 0.25);
      const pts = [{ x, y }, { x: x + Math.cos(ang) * len, y: y + Math.sin(ang) * len }];
      const press = o.press || ((t) => 0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.15)));
      yield* stroke(pts, { taperIn: 0.2, taperOut: 0.25, tremor: 0.2, spacing: 1, ...o, w, press, yieldEvery: o.yieldEvery ?? 6 });
    }

    // ---- soft, wet strokes made of pre-rendered radial stamps ----------
    const stampC = document.createElement('canvas'); stampC.width = stampC.height = 64;
    (() => {
      const sc = stampC.getContext('2d');
      const grd = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(0.45, 'rgba(0,0,0,0.6)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      sc.fillStyle = grd; sc.fillRect(0, 0, 64, 64);
    })();
    // A broad soft stroke (for washes / mist). Darkness ~ o.ink at full overlap.
    function* softStroke(pts, o = {}) {
      const w = o.w ?? 30, ink = o.ink ?? 0.3, tremor = o.tremor ?? 0.5;
      const spacing = o.spacing ?? w * 0.2;
      const path = Path.resample(pts, spacing);
      const overlap = (w / spacing) * 0.55 * (o.rows ?? 2);
      const a = Math.min(0.5, 1.15 * (1 - Math.pow(1 - Math.min(0.97, ink), 1 / Math.max(1, overlap))));
      const ph = rng.range(0, 100);
      const yieldEvery = o.yieldEvery ?? 6;
      for (let k = 0; k < path.length; k++) {
        const pt = path[k];
        let wd = w * (1 + tremor * 0.5 * (noise(ph + pt.x * 0.01, pt.y * 0.01) - 0.5));
        if (o.taper) { const t = pt.t; wd *= Math.min(1, t / 0.15, (1 - t) / 0.15) * 0.6 + 0.4; }
        const mod = o.alphaAt ? o.alphaAt(pt.x, pt.y, pt.t) : 1;
        if (mod > 0.01) {
          ctx.globalAlpha = Math.min(1, a * mod * rng.range(0.8, 1.1));
          ctx.drawImage(stampC, pt.x - wd / 2, pt.y - wd / 2, wd, wd);
        }
        if (k % yieldEvery === 0) yield { x: pt.x, y: pt.y, w: wd };
      }
      ctx.globalAlpha = 1;
    }

    // Broad wash sweeps (染) inside a polygon. Alpha can be modulated per
    // position with o.fade(x, y) -> 0..1 to let a shape melt into mist.
    function* wash(poly, o = {}) {
      const bb = Path.bbox(poly);
      const sw = o.sweep ?? 26;
      const step = sw * (o.stepFactor ?? 0.42);
      clipBegin(poly, o.excludes || []);
      let flip = rng.chance(0.5);
      const seed = rng.range(0, 100);
      const rows = Math.ceil((bb.h + sw * 0.6) / step) + 1;
      for (let y = bb.y0 - sw * 0.25; y <= bb.y1 + sw * 0.35; y += step) {
        const n = Math.max(3, Math.round(bb.w / 45));
        const pts = [];
        for (let i = 0; i <= n; i++) {
          const u = i / n;
          const x = bb.x0 - 12 + (bb.w + 24) * u;
          pts.push({ x, y: y + (noise(seed + x * 0.006, y * 0.03) - 0.5) * sw * 0.8 });
        }
        if (flip) pts.reverse();
        flip = !flip;
        yield* softStroke(pts, { w: sw, ink: o.ink ?? 0.3, alphaAt: o.fade ? (x, yy) => o.fade(x, yy) : null, rows: 2.2, yieldEvery: 7 });
      }
      // a few darker pools where the ink settled (积墨)
      const pools = o.pools ?? 3;
      for (let k = 0; k < pools; k++) {
        const x = rng.range(bb.x0, bb.x1), y = rng.range(bb.y0, bb.y1);
        if (!Path.inside(poly, x, y)) continue;
        const f = o.fade ? o.fade(x, y) : 1;
        if (f < 0.2) continue;
        const pts = [{ x: x - sw, y }, { x: x + sw * rng.range(0.5, 1.5), y: y + rng.range(-6, 6) }];
        yield* softStroke(pts, { w: sw * 1.3, ink: (o.ink ?? 0.3) * 0.7, alphaAt: o.fade ? (xx, yy) => o.fade(xx, yy) : null, rows: 1, yieldEvery: 7 });
      }
      clipEnd();
    }

    // Flat fill with the given alpha (used sparingly, e.g. roofs, boat hulls).
    function* fill(poly, ink = 0.8) {
      ctx.fillStyle = `rgba(0,0,0,${alphaFor(ink).toFixed(3)})`;
      ctx.beginPath(); pathTo(poly); ctx.fill();
      yield { x: poly[0].x, y: poly[0].y, w: 4 };
    }

    return { stroke, dab, wash, softStroke, fill, clipBegin, clipPath, clipEnd, resetState, noise, rng, W, H, p, g, ctx, alphaFor };
  }

  return { create };
})();
