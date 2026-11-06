// UI: the small set of pieces every page is built from — icons (drawn after
// Lucide, ISC licence), buttons, toggles, a segmented control, a range
// slider and tooltips. Plain DOM; the look lives in styles.css.
window.UI = (() => {
  // 24 × 24 stroke icons (Lucide's geometry)
  const ICONS = {
    play: '<path d="M6 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5Z"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/>',
    'step-back': '<path d="M18 19.5V4.5a1 1 0 0 0-1.5-.86l-9.6 7.5a1 1 0 0 0 0 1.72l9.6 7.5A1 1 0 0 0 18 19.5Z"/><path d="M5 4v16"/>',
    'step-forward': '<path d="M6 4.5v15a1 1 0 0 0 1.5.86l9.6-7.5a1 1 0 0 0 0-1.72l-9.6-7.5A1 1 0 0 0 6 4.5Z"/><path d="M19 4v16"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevrons-left': '<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>',
    'chevrons-right': '<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>',
    'chevron-first': '<path d="m17 18-6-6 6-6"/><path d="M7 6v12"/>',
    'chevron-last': '<path d="m7 18 6-6-6-6"/><path d="M17 6v12"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.97a4 4 0 0 0 3.3-1.7l5.45-7.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.97a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.04a4 4 0 0 1-3.3-1.8l-.36-.45"/>',
    download: '<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    'fast-forward': '<path d="M12 6v12l8-6-8-6Z"/><path d="M3 6v12l8-6-8-6Z"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 13h6"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m2 12 9.17 4.16a2 2 0 0 0 1.66 0L22 12"/><path d="m2 17 9.17 4.16a2 2 0 0 0 1.66 0L22 17"/>',
    pointer: '<path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.04 9.37a.5.5 0 0 1 .62-.62l9.97 3.63a.5.5 0 0 1-.04.95l-3.83 1.1a1 1 0 0 0-.68.68l-1.1 3.83a.5.5 0 0 1-.95.04Z"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  };
  function icon(name, cls = '') {
    return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
  }

  // ---- tooltips ------------------------------------------------------------------
  // Any element with data-tip gets a tooltip on hover and keyboard focus;
  // data-kbd adds a key hint. One floating element, placed above (or below,
  // if there is no room) and kept inside the viewport.
  let tipEl = null, tipFor = null, tipTimer = 0;
  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement('div'); tipEl.className = 'tooltip'; tipEl.setAttribute('role', 'tooltip'); tipEl.id = 'ui-tooltip';
    document.body.appendChild(tipEl); return tipEl;
  }
  function showTip(el) {
    const text = el.getAttribute('data-tip'); if (!text) return;
    const t = ensureTip(), kbd = el.getAttribute('data-kbd');
    t.innerHTML = `<span>${text}</span>${kbd ? kbd.split(' ').map((k) => `<kbd>${k}</kbd>`).join('') : ''}`;
    t.classList.add('show'); tipFor = el;
    const r = el.getBoundingClientRect(), tr = t.getBoundingClientRect();
    let x = r.left + r.width / 2 - tr.width / 2, y = r.top - tr.height - 8;
    if (y < 6) y = r.bottom + 8;
    x = Math.max(6, Math.min(window.innerWidth - tr.width - 6, x));
    t.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
  function hideTip() { clearTimeout(tipTimer); if (tipEl) tipEl.classList.remove('show'); tipFor = null; }
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) { if (tipFor) hideTip(); return; }
    if (el === tipFor) return;
    clearTimeout(tipTimer); tipTimer = setTimeout(() => showTip(el), tipFor ? 0 : 350);
  });
  document.addEventListener('pointerdown', hideTip);
  document.addEventListener('focusin', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && el.matches(':focus-visible')) showTip(el); });
  document.addEventListener('focusout', hideTip);
  window.addEventListener('scroll', hideTip, { passive: true });
  // a tooltip that follows something other than an element (a character on a canvas)
  function floatTip(html, x, y) {
    const t = ensureTip();
    if (html == null) { t.classList.remove('show'); return; }
    t.innerHTML = html; t.classList.add('show');
    const tr = t.getBoundingClientRect();
    let px = x - tr.width / 2, py = y - tr.height - 14;
    if (py < 6) py = y + 18;
    px = Math.max(6, Math.min(window.innerWidth - tr.width - 6, px));
    t.style.transform = `translate(${Math.round(px)}px, ${Math.round(py)}px)`;
  }

  // ---- controls ------------------------------------------------------------------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // an icon button: { icon, label (for screen readers and the tooltip), kbd, variant, cls }
  function iconButton(o) {
    return `<button type="button" class="btn btn-icon ${o.variant ? 'btn-' + o.variant : 'btn-ghost'} ${o.cls || ''}" aria-label="${esc(o.label)}" data-tip="${esc(o.tip || o.label)}"${o.kbd ? ` data-kbd="${esc(o.kbd)}"` : ''}${o.attrs ? ' ' + o.attrs : ''}>${icon(o.icon)}</button>`;
  }
  // a range slider that paints its own fill (CSS reads --fill)
  function paintRange(input) {
    const min = +input.min || 0, max = +input.max || 100, v = +input.value;
    input.style.setProperty('--fill', `${((v - min) / (max - min)) * 100}%`);
  }
  function bindRanges(root = document) {
    root.querySelectorAll('input[type="range"].slider').forEach((r) => { paintRange(r); r.addEventListener('input', () => paintRange(r)); });
  }
  // a segmented control: role=radiogroup of buttons with aria-checked
  function segmented(root, onChange) {
    const items = [...root.querySelectorAll('[role="radio"]')];
    const set = (el, fire) => { items.forEach((b) => { const on = b === el; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; }); if (fire) onChange(el.dataset.value); };
    items.forEach((b, i) => {
      b.addEventListener('click', () => set(b, true));
      b.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return; e.preventDefault(); const n = items[(i + d + items.length) % items.length]; n.focus(); set(n, true);
      });
    });
    return { set: (v) => { const el = items.find((b) => b.dataset.value === v); if (el) set(el, false); } };
  }
  // toggle buttons (aria-pressed)
  function toggle(btn, onChange) {
    btn.addEventListener('click', () => { const on = btn.getAttribute('aria-pressed') !== 'true'; btn.setAttribute('aria-pressed', on); onChange(on); });
    return { set: (on) => btn.setAttribute('aria-pressed', !!on), get: () => btn.getAttribute('aria-pressed') === 'true' };
  }

  // the site header: brand, page links, source link. page: the current page's file
  function header(page) {
    const links = [['ink.html', '山水', 'Ink'], ['calligraphy.html', '摹帖', 'Calligraphy'], ['crayon.html', '', 'Crayon'], ['demo.html', '解', 'How it works']];
    return `<div class="site-header__inner">
      <a class="brand" href="index.html" aria-label="p5 brush, home"><span class="brand__mark" aria-hidden="true">筆</span><span class="brand__name">p5 brush</span></a>
      <nav class="site-nav" aria-label="Pages">${links.map(([href, zh, en]) => `<a href="${href}"${href === page ? ' aria-current="page"' : ''}>${zh ? `<span class="zh">${zh}</span>` : ''}<span>${en}</span></a>`).join('')}</nav>
      <a class="btn btn-icon btn-ghost site-header__src" href="https://github.com/yuwen-lu/p5-brush" aria-label="Source on GitHub" data-tip="Source on GitHub">${icon('github')}</a>
    </div>`;
  }

  return { icon, ICONS, iconButton, bindRanges, paintRange, segmented, toggle, header, floatTip, hideTip, esc };
})();
