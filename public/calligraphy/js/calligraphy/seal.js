// A vermilion seal (印), stamped after the last column of a piece: a
// carved-looking border and four cells of ruled marks, the impression
// broken up by small gaps as on a real stamp.
window.Seal = (() => {
  const TAU = Math.PI * 2;
  function create(B) {
    const { rng, ctx } = B;
    // A vermilion seal (印) with a carved-looking border.
    function* seal(x, y, size, o = {}) {
      const r = size, red = o.color || [178, 34, 34];
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const a = 0.85;
      const col = (aa) => `rgba(${red[0]},${red[1]},${red[2]},${aa})`;
      const pts = [{ x, y }, { x: x + r, y }, { x: x + r, y: y + r }, { x, y: y + r }, { x, y }];
      ctx.strokeStyle = col(a); ctx.lineWidth = Math.max(2, r * 0.09); ctx.lineJoin = 'round';
      for (let i = 0; i < 4; i++) {
        const p0 = pts[i], p1 = pts[i + 1];
        const n = 6;
        for (let k = 0; k < n; k++) {
          if (rng.chance(0.12)) continue;
          const a0 = k / n, a1 = (k + 1) / n;
          ctx.beginPath(); ctx.moveTo(p0.x + (p1.x - p0.x) * a0 + rng.range(-0.6, 0.6), p0.y + (p1.y - p0.y) * a0 + rng.range(-0.6, 0.6)); ctx.lineTo(p0.x + (p1.x - p0.x) * a1, p0.y + (p1.y - p0.y) * a1); ctx.stroke();
        }
      }
      ctx.lineWidth = Math.max(1.6, r * 0.075); ctx.lineCap = 'square';
      for (let gy = 0; gy < 2; gy++) for (let gx = 0; gx < 2; gx++) {
        const ox = x + r * 0.16 + gx * r * 0.36, oy = y + r * 0.16 + gy * r * 0.36, cs = r * 0.32;
        const nl = rng.int(2, 4);
        for (let k = 0; k < nl; k++) {
          const horiz = rng.chance(0.6);
          const u = (k + 0.5) / nl;
          ctx.strokeStyle = col(a * rng.range(0.75, 1));
          ctx.beginPath();
          if (horiz) { ctx.moveTo(ox, oy + cs * u); ctx.lineTo(ox + cs * rng.range(0.6, 1), oy + cs * u); }
          else { ctx.moveTo(ox + cs * u, oy); ctx.lineTo(ox + cs * u, oy + cs * rng.range(0.6, 1)); }
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      for (let k = 0; k < r * 0.6; k++) { ctx.beginPath(); ctx.arc(x + rng.range(0, r), y + rng.range(0, r), rng.range(0.3, 1.1), 0, TAU); ctx.fill(); }
      ctx.restore();
      ctx.globalCompositeOperation = 'multiply';
      yield { x: x + r / 2, y: y + r / 2, w: 6 };
    }
    return { seal };
  }
  return { create };
})();
