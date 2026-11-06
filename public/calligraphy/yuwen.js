// yuwen.io/calligraphy: the header and the dot grid of yuwen.io, for the
// pages tools/export-yuwen.js writes. Plain DOM, like the rest of the site.
window.YuwenSite = (() => {
  // links resolve against <base href="/calligraphy/">
  const PAGES = [['./', 'calligraphy'], ['how-it-works', 'how it works']];

  function header(current) {
    return `<div class="site-header__inner">
      <a class="yw-brand" href="/" aria-label="yuwen lu, home">yuwen lu</a>
      <nav class="yw-nav" aria-label="Pages">${PAGES.map(([href, label]) =>
        `<a href="${href}"${label === current ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    </div>`;
  }

  // The dot grid behind yuwen.io (src/components/DotGridBackground.tsx there):
  // 2 px dots every 24 px, faint, brighter near the pointer, moving with the page.
  const DOT = 2, GAP = 24, NEAR = 180, BASE = 0.08, MAX = 0.5;
  function dots() {
    const canvas = document.createElement('canvas');
    canvas.className = 'yw-dots'; canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    let mx = -9999, my = -9999, queued = false;
    function draw() {
      queued = false;
      const dpr = window.devicePixelRatio || 1, w = window.innerWidth, h = window.innerHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      }
      const rgb = dark.matches ? '232, 226, 216' : '44, 40, 36';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const oy = window.scrollY % GAP, ox = (w % GAP) / 2;
      const cols = Math.ceil(w / GAP) + 1, rows = Math.ceil(h / GAP) + 2;
      for (let r = 0; r < rows; r++) {
        const y = -oy + r * GAP;
        for (let c = 0; c < cols; c++) {
          const x = ox + c * GAP;
          const t = Math.max(0, 1 - Math.hypot(x - mx, y - my) / NEAR);
          ctx.fillStyle = `rgba(${rgb}, ${BASE + (MAX - BASE) * t * t})`;
          ctx.fillRect(Math.round(x - DOT / 2), Math.round(y - DOT / 2), DOT, DOT);
        }
      }
    }
    const later = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { mx = e.clientX; my = e.clientY; later(); } }, { passive: true });
    document.addEventListener('pointerleave', () => { mx = my = -9999; later(); });
    window.addEventListener('scroll', later, { passive: true });
    window.addEventListener('resize', later);
    dark.addEventListener('change', later);
    draw();
  }

  return { header, dots };
})();
