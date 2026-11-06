// Polyline helpers shared by the ink and crayon engines.
window.Path = (() => {
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

  // Resample a polyline at a fixed spacing. Returns points with t in [0,1],
  // unit tangent (tx,ty) and unit normal (nx,ny).
  function resample(pts, spacing) {
    if (!pts || pts.length === 0) return [];
    const cum = [0]; let total = 0;
    for (let i = 1; i < pts.length; i++) { total += dist(pts[i - 1], pts[i]); cum.push(total); }
    if (total < 1e-6) return [{ x: pts[0].x, y: pts[0].y, t: 0, tx: 1, ty: 0, nx: 0, ny: 1 }];
    const n = Math.max(2, Math.ceil(total / spacing) + 1);
    const out = []; let seg = 0;
    for (let i = 0; i < n; i++) {
      const d = (total * i) / (n - 1);
      while (seg < pts.length - 2 && cum[seg + 1] < d) seg++;
      const a = pts[seg], b = pts[seg + 1];
      const sl = cum[seg + 1] - cum[seg];
      const u = sl > 0 ? (d - cum[seg]) / sl : 0;
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, t: i / (n - 1) });
    }
    for (let i = 0; i < out.length; i++) {
      const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)];
      let dx = b.x - a.x, dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      out[i].tx = dx; out[i].ty = dy; out[i].nx = -dy; out[i].ny = dx;
    }
    return out;
  }

  function length(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; }

  // Catmull-Rom spline through the control points.
  function catmull(pts, seg = 8, closed = false) {
    if (pts.length < 3) return pts.slice();
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
    const out = [];
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      for (let j = 0; j < seg; j++) {
        const t = j / seg, t2 = t * t, t3 = t2 * t;
        out.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        });
      }
    }
    if (!closed) out.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y });
    return out;
  }

  // Chaikin corner cutting (softens polylines).
  function chaikin(pts, iters = 2, closed = false) {
    let cur = pts.slice();
    for (let k = 0; k < iters; k++) {
      const out = [];
      const n = cur.length;
      if (!closed) out.push(cur[0]);
      const last = closed ? n : n - 1;
      for (let i = 0; i < last; i++) {
        const a = cur[i], b = cur[(i + 1) % n];
        out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
        out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
      }
      if (!closed) out.push(cur[n - 1]);
      cur = out;
    }
    return cur;
  }

  // Displace a polyline perpendicular to itself with a smooth noise function.
  function wobble(pts, noise, amp, freq = 0.02, phase = 0) {
    const rs = resample(pts, 3);
    return rs.map((q, i) => {
      const n = (noise(phase + i * freq * 3, phase * 0.37) - 0.5) * 2 * amp;
      return { x: q.x + q.nx * n, y: q.y + q.ny * n };
    });
  }

  function circle(cx, cy, r, n = 40, a0 = 0, a1 = Math.PI * 2) {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }
    return out;
  }

  function ellipse(cx, cy, rx, ry, n = 40, a0 = 0, a1 = Math.PI * 2) {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }); }
    return out;
  }

  function line(a, b, n = 8) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push({ x: a.x + (b.x - a.x) * i / n, y: a.y + (b.y - a.y) * i / n });
    return out;
  }

  function bbox(poly) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const q of poly) { if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }

  function inside(poly, x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
  }

  function translate(pts, dx, dy) { return pts.map(q => ({ x: q.x + dx, y: q.y + dy })); }
  function scale(pts, cx, cy, sx, sy = sx) { return pts.map(q => ({ x: cx + (q.x - cx) * sx, y: cy + (q.y - cy) * sy })); }
  function rotate(pts, cx, cy, a) { const c = Math.cos(a), s = Math.sin(a); return pts.map(q => ({ x: cx + (q.x - cx) * c - (q.y - cy) * s, y: cy + (q.x - cx) * s + (q.y - cy) * c })); }
  function reverse(pts) { return pts.slice().reverse(); }
  function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }

  return { resample, length, catmull, chaikin, wobble, circle, ellipse, line, bbox, inside, translate, scale, rotate, reverse, lerp, dist };
})();
