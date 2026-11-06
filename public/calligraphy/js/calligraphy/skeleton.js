// Skeleton extraction for scanned calligraphy: turns a binary ink bitmap of
// one character into brush paths — the centre line of every stroke and the
// ink width along it — so the brush can re-write the character along the
// calligrapher's own track (摹 tracing) instead of a font skeleton.
//
// Pipeline: thin the bitmap to a 1-pixel skeleton (Zhang–Suen + staircase
// clean-up), measure the width with an exact Euclidean distance transform,
// read the skeleton as a graph (end points, junctions, paths between them),
// then choose the strokes by how much ink they explain: a stroke is a chain
// of paths that continues smoothly through junctions, and it is kept only if
// the ink within its width is ink that no other kept stroke covers already.
// Spurs and specks explain nothing of their own and drop out; the branches
// inside a blob of thick ink stay because nothing else explains the blob.
// (The older method — prune spurs by length, then pair path ends at every
// junction by tangent continuity — is still there as method 'pair'.)
// Finally the strokes are given a direction and an order, preferably by
// matching them against a regular-script template of the same character
// (data/glyphs.js), which carries the real stroke order.
//
// Works in the browser (window.Skeleton) and in Node (module.exports).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Skeleton = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // A bitmap is { w, h, data: Uint8Array } with 1 = ink.
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---- thinning ------------------------------------------------------------
  // Zhang & Suen (1984). Returns a new bitmap.
  // o.maxIter caps the passes (the demo shows the layers coming off one by
  // one); o.noClean skips the staircase clean-up.
  function thin(bm, o = {}) {
    const { w, h } = bm;
    const a = Uint8Array.from(bm.data);
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : a[y * w + x];
    const del = [];
    let changed = true, iter = 0;
    while (changed && iter < (o.maxIter ?? 200)) {
      changed = false; iter++;
      for (let pass = 0; pass < 2; pass++) {
        del.length = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (!a[y * w + x]) continue;
          const p2 = at(x, y - 1), p3 = at(x + 1, y - 1), p4 = at(x + 1, y), p5 = at(x + 1, y + 1);
          const p6 = at(x, y + 1), p7 = at(x - 1, y + 1), p8 = at(x - 1, y), p9 = at(x - 1, y - 1);
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;
          const A = (p2 === 0 && p3 === 1) + (p3 === 0 && p4 === 1) + (p4 === 0 && p5 === 1) + (p5 === 0 && p6 === 1) +
                    (p6 === 0 && p7 === 1) + (p7 === 0 && p8 === 1) + (p8 === 0 && p9 === 1) + (p9 === 0 && p2 === 1);
          if (A !== 1) continue;
          if (pass === 0) { if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue; }
          else { if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) continue; }
          del.push(y * w + x);
        }
        if (del.length) { changed = true; for (const i of del) a[i] = 0; }
      }
    }
    // staircase clean-up: a pixel whose only neighbours are two 4-adjacent
    // ones (N+E, E+S, S+W, W+N) is redundant for 8-connectivity
    if (!o.noClean) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!a[y * w + x]) continue;
      const n = at(x, y - 1), e = at(x + 1, y), s = at(x, y + 1), wst = at(x - 1, y);
      const ne = at(x + 1, y - 1), se = at(x + 1, y + 1), sw = at(x - 1, y + 1), nw = at(x - 1, y - 1);
      const cnt = n + e + s + wst + ne + se + sw + nw;
      if (cnt === 2 && ((n && e) || (e && s) || (s && wst) || (wst && n))) a[y * w + x] = 0;
      else if (cnt === 3 && ((n && e && ne) || (e && s && se) || (s && wst && sw) || (wst && n && nw))) a[y * w + x] = 0;
    }
    // Zhang–Suen deletes an isolated 2 × 2 block in a single pass, so a round
    // dot can thin to nothing at all: give every ink component that lost its
    // skeleton one pixel, the ink pixel nearest its centroid
    if (!o.noKeep) {
      const seen = new Uint8Array(w * h), stack = [];
      for (let i = 0; i < w * h; i++) {
        if (!bm.data[i] || seen[i]) continue;
        const comp = []; let has = false; seen[i] = 1; stack.push(i);
        while (stack.length) {
          const j = stack.pop(); comp.push(j); if (a[j]) has = true;
          const x = j % w, y = (j / w) | 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const k = yy * w + xx; if (bm.data[k] && !seen[k]) { seen[k] = 1; stack.push(k); }
          }
        }
        if (has) continue;
        let cx = 0, cy = 0; for (const j of comp) { cx += j % w; cy += (j / w) | 0; } cx /= comp.length; cy /= comp.length;
        let best = comp[0], bd = Infinity;
        for (const j of comp) { const d = (j % w - cx) ** 2 + (((j / w) | 0) - cy) ** 2; if (d < bd) { bd = d; best = j; } }
        a[best] = 1;
      }
    }
    return { w, h, data: a, iterations: iter };
  }

  // ---- exact Euclidean distance transform (Felzenszwalb & Huttenlocher) ---
  // Returns Float32Array of the distance from every ink pixel to the nearest
  // background pixel (0 for background).
  function distanceTransform(bm) {
    const { w, h, data } = bm;
    const INF = 1e12;
    const f = new Float64Array(Math.max(w, h)), d = new Float64Array(Math.max(w, h));
    const v = new Int32Array(Math.max(w, h)), z = new Float64Array(Math.max(w, h) + 1);
    const g = new Float64Array(w * h);
    function edt1d(n) {
      let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
      for (let q = 1; q < n; q++) {
        let s;
        while (true) {
          const p = v[k];
          s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p);
          if (s <= z[k]) { k--; if (k < 0) { k = 0; break; } } else break;
        }
        if (k === 0 && v[0] === 0 && q > 0) {
          const p = v[0]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p);
          if (s <= z[0]) { v[0] = q; z[0] = -INF; z[1] = INF; continue; }
        }
        k++; v[k] = q; z[k] = s; z[k + 1] = INF;
      }
      k = 0;
      for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[p]; }
    }
    // columns
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) f[y] = data[y * w + x] ? INF : 0;
      edt1d(h);
      for (let y = 0; y < h; y++) g[y * w + x] = d[y];
    }
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) f[x] = g[y * w + x];
      edt1d(w);
      for (let x = 0; x < w; x++) out[y * w + x] = Math.sqrt(d[x]);
    }
    return out;
  }

  // ---- skeleton graph -------------------------------------------------------
  const N8 = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

  // Reads a 1-px skeleton into nodes (end points / junction clusters) and
  // paths between them. Returns { nodes: [{id, px:[i...], x, y}], paths:
  // [{a, b, px:[i...]}] } where px are pixel indices including the node pixel
  // at each end.
  function graph(sk) {
    const { w, h, data } = sk;
    const deg = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!data[i]) continue;
      let c = 0;
      for (const [dx, dy] of N8) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && data[yy * w + xx]) c++; }
      deg[i] = c;
    }
    // node pixels: degree != 2; junction pixels touching each other are one node
    const nodeOf = new Int32Array(w * h).fill(-1);
    const nodes = [], specks = [];
    for (let i = 0; i < w * h; i++) {
      if (!data[i] || deg[i] === 2 || nodeOf[i] >= 0) continue;
      if (deg[i] === 0) { nodeOf[i] = -2; specks.push(i); continue; } // isolated pixel: a dot, or a speck
      const id = nodes.length; const px = [i]; nodeOf[i] = id;
      if (deg[i] >= 3) {
        const stack = [i];
        while (stack.length) {
          const j = stack.pop(); const x = j % w, y = (j / w) | 0;
          for (const [dx, dy] of N8) {
            const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const k = yy * w + xx;
            if (data[k] && deg[k] >= 3 && nodeOf[k] < 0) { nodeOf[k] = id; px.push(k); stack.push(k); }
          }
        }
      }
      let sx = 0, sy = 0; for (const j of px) { sx += j % w; sy += (j / w) | 0; }
      nodes.push({ id, px, x: sx / px.length, y: sy / px.length, end: deg[i] === 1 && px.length === 1 });
    }
    // trace paths
    const visited = new Uint8Array(w * h);
    const paths = [];
    for (const nd of nodes) for (const start of nd.px) {
      const sx = start % w, sy = (start / w) | 0;
      for (const [dx, dy] of N8) {
        const xx = sx + dx, yy = sy + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        let cur = yy * w + xx;
        if (!data[cur]) continue;
        if (nodeOf[cur] === nd.id) continue;            // inside the same cluster
        if (nodeOf[cur] >= 0) {                          // adjacent node: zero-length path
          if (nodeOf[cur] > nd.id) paths.push({ a: nd.id, b: nodeOf[cur], px: [start, cur] });
          continue;
        }
        if (visited[cur]) continue;
        const px = [start, cur]; visited[cur] = 1; let prev = start;
        while (true) {
          const cx = cur % w, cy = (cur / w) | 0; let next = -1, endNode = -1;
          for (const [ex, ey] of N8) {
            const nx = cx + ex, ny = cy + ey; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const k = ny * w + nx; if (!data[k] || k === prev) continue;
            // the pixel we just left may still touch the node we started from
            // (diagonal steps): that is not the path coming back on itself
            if (nodeOf[k] === nd.id && px.length < 4) continue;
            if (nodeOf[k] >= 0) { endNode = nodeOf[k]; next = k; break; }
            if (!visited[k]) next = k;
          }
          if (next < 0) break;                           // dead end (should not happen)
          px.push(next);
          if (endNode >= 0) { paths.push({ a: nd.id, b: endNode, px }); break; }
          visited[next] = 1; prev = cur; cur = next;
        }
      }
    }
    // closed loops without any node (e.g. a ring): break at an arbitrary pixel
    for (let i = 0; i < w * h; i++) {
      if (!data[i] || visited[i] || nodeOf[i] !== -1) continue;
      const id = nodes.length; nodes.push({ id, px: [i], x: i % w, y: (i / w) | 0, end: false }); nodeOf[i] = id;
      let prev = i, cur = -1; const px = [i];
      const x0 = i % w, y0 = (i / w) | 0;
      for (const [dx, dy] of N8) { const k = (y0 + dy) * w + x0 + dx; if (x0 + dx >= 0 && y0 + dy >= 0 && x0 + dx < w && y0 + dy < h && data[k]) { cur = k; break; } }
      if (cur < 0) continue;
      let guard = 0;
      while (cur !== i && guard++ < w * h) {
        px.push(cur); visited[cur] = 1;
        const cx = cur % w, cy = (cur / w) | 0; let next = -1;
        for (const [dx, dy] of N8) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const k = ny * w + nx; if (data[k] && k !== prev && (k === i || !visited[k])) { next = k; break; } }
        if (next < 0) break; prev = cur; cur = next;
      }
      px.push(i);
      paths.push({ a: id, b: id, px });
    }
    return { nodes, paths, specks, w, h };
  }

  // ---- strokes from the graph -----------------------------------------------
  // dist: distance transform of the original bitmap (for widths / pruning).
  // o.bitmap: the ink bitmap; with it the strokes are chosen by coverage
  //   (method 'cover', see selectByCoverage), without it by spur pruning and
  //   tangent pairing (method 'pair'). o.method forces one or the other.
  // o.join: minimum turning angle (degrees) to run straight through a junction (default 105)
  // o.cluster: junctions closer than o.cluster * local width are merged (default 1.2)
  // o.cost, o.fresh: coverage selection, see below
  // o.spur: 'pair' only — spurs shorter than o.spur * local width are removed (default 0.9)
  // o.stats: an object to receive ink / covered pixel counts (coverage method)
  function strokes(sk, dist, o = {}) {
    const { w } = sk;
    const spurK = o.spur ?? 0.9, joinAngle = ((o.join ?? 105) * Math.PI) / 180, clusterK = o.cluster ?? 1.2;
    const P = (i) => ({ x: i % w, y: (i / w) | 0, w: 2 * (dist[i] || 0.5) });
    let G = graph(sk);
    let { nodes, paths } = G;
    const dbg = o.debug ? (stage) => console.log(`  [${stage}] paths ${paths.length}, px ${paths.reduce((s, p) => s + p.px.length - 1, 0)}`) : () => {};
    const ev = o.events || null;                 // the demo collects what happens
    if (ev) ev.push({ stage: 'graph', nodes: nodes.map((n) => ({ x: n.x, y: n.y, end: n.end, px: n.px.slice() })), paths: paths.map((p) => p.px.slice()) });
    dbg('graph');

    // merge junctions that sit within a stroke width of each other (a thick
    // crossing thins into two Y junctions with a short bridge), but only while
    // the cluster stays compact — never chaining along a stroke
    const parent = nodes.map((_, i) => i);
    const bb = nodes.map((n) => ({ x0: n.x, x1: n.x, y0: n.y, y1: n.y }));
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const cand = [];
    for (const p of paths) {
      if (p.a === p.b) continue;
      const A = nodes[p.a], B = nodes[p.b];
      if (A.end || B.end) continue;
      const wl = Math.max(P(A.px[0]).w, P(B.px[0]).w);
      const len = p.px.length - 1;
      if (len <= clusterK * wl) cand.push({ p, len, wl });
    }
    cand.sort((a, b) => a.len - b.len);
    for (const c of cand) {
      const ra = find(c.p.a), rb = find(c.p.b); if (ra === rb) continue;
      const u = { x0: Math.min(bb[ra].x0, bb[rb].x0), x1: Math.max(bb[ra].x1, bb[rb].x1), y0: Math.min(bb[ra].y0, bb[rb].y0), y1: Math.max(bb[ra].y1, bb[rb].y1) };
      if (Math.hypot(u.x1 - u.x0, u.y1 - u.y0) > c.wl * 1.6) continue;
      parent[ra] = rb; bb[rb] = u;
    }
    for (const p of paths) { p.a = find(p.a); p.b = find(p.b); }
    if (ev) { const merged = nodes.filter((n, i) => find(i) !== i || nodes.some((m, j) => j !== i && find(j) === i)).map((n) => ({ x: n.x, y: n.y })); ev.push({ stage: 'cluster', merged }); }
    const method = o.method || (o.bitmap ? 'cover' : 'pair');
    if (method === 'cover') {
      if (!o.bitmap) throw new Error('coverage selection needs o.bitmap');
      return selectByCoverage(paths, G.specks, sk, dist, P, o.bitmap, o, ev);
    }
    paths = paths.filter((p) => !(p.a === p.b && p.px.length - 1 <= clusterK * P(p.px[0]).w + 2));
    dbg('cluster');

    // prune spurs: short paths ending at an end point, then re-link pairs at
    // junctions that dropped to degree 2
    const prune = () => {
      const inc = new Map();
      for (const p of paths) { inc.set(p.a, (inc.get(p.a) || 0) + 1); inc.set(p.b, (inc.get(p.b) || 0) + 1); }
      const isEnd = (id) => inc.get(id) === 1;
      let removed = 0;
      paths = paths.filter((p) => {
        if (p.a === p.b) return true;
        const endA = isEnd(p.a), endB = isEnd(p.b);
        if (endA === endB) return true;                    // free segment or bridge
        const junction = endA ? p.b : p.a;
        if ((inc.get(junction) || 0) < 3) return true;     // a bend, not a fork: this is the stroke's own end
        const wj = P(nodes[junction].px[0]).w;
        const len = p.px.length - 1;
        if (len < spurK * wj + 1.5) { removed++; if (ev) ev.push({ stage: 'spur', px: p.px.slice(), len, limit: spurK * wj + 1.5 }); if (o.debug) console.log(`    spur len ${len} < ${(spurK * wj + 1.5).toFixed(1)} at (${nodes[junction].x.toFixed(0)},${nodes[junction].y.toFixed(0)})`); return false; }
        return true;
      });
      return removed;
    };
    dbg('cluster');

    // stitch paths through nodes that now have exactly two incident paths
    const stitch = () => {
      const inc = new Map();
      for (const p of paths) { for (const id of [p.a, p.b]) { if (!inc.has(id)) inc.set(id, []); inc.get(id).push(p); } }
      for (const [id, ps] of inc) {
        if (ps.length !== 2 || ps[0] === ps[1]) continue;
        const [p, q] = ps;
        const pa = p.b === id ? p.px : p.px.slice().reverse();        // p ends at id
        const qb = q.a === id ? q.px : q.px.slice().reverse();        // q starts at id
        const merged = { a: p.b === id ? p.a : p.b, b: q.a === id ? q.b : q.a, px: pa.concat(qb.slice(1)) };
        paths = paths.filter((r) => r !== p && r !== q); paths.push(merged);
        return true;
      }
      return false;
    };
    // prune spurs and stitch the bends they leave behind, until stable
    for (let k = 0; k < 6; k++) { const r = prune(); while (stitch()); if (r === 0) break; }
    dbg('prune+stitch');

    // pair path ends at each junction by tangent continuity
    const dirAt = (p, atA) => {
      const px = atA ? p.px : p.px.slice().reverse();
      const w0 = P(px[0]).w;
      const n = Math.min(px.length - 1, Math.max(3, Math.round(w0 * 1.5)));
      const a = P(px[0]), b = P(px[n]);
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
    };
    const ends = new Map(); // node id -> [{path, atA}]
    for (const p of paths) {
      if (p.a === p.b) continue;
      for (const atA of [true, false]) { const id = atA ? p.a : p.b; if (!ends.has(id)) ends.set(id, []); ends.get(id).push({ path: p, atA }); }
    }
    const link = new Map(); // key `${pathIndex}:${atA}` -> {path, atA}
    const key = (e) => paths.indexOf(e.path) + ':' + (e.atA ? 'a' : 'b');
    for (const [nid, es] of ends) {
      if (es.length < 2) continue;
      const pool = es.slice();
      const evJ = ev ? { stage: 'junction', x: nodes[nid].x, y: nodes[nid].y, ends: es.map((e) => ({ dir: dirAt(e.path, e.atA), px: (e.atA ? e.path.px : e.path.px.slice().reverse()).slice(0, 12) })), pairs: [] } : null;
      if (evJ) ev.push(evJ);
      while (pool.length >= 2) {
        let best = null;
        for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) {
          const di = dirAt(pool[i].path, pool[i].atA), dj = dirAt(pool[j].path, pool[j].atA);
          const ang = Math.acos(Math.max(-1, Math.min(1, di.x * dj.x + di.y * dj.y)));
          if (!best || ang > best.ang) best = { ang, i, j };
        }
        if (o.debug) console.log(`    junction (${nodes[es[0].atA ? es[0].path.a : es[0].path.b].x.toFixed(0)},${nodes[es[0].atA ? es[0].path.a : es[0].path.b].y.toFixed(0)}) pool ${pool.length} best ${best ? (best.ang * 180 / Math.PI).toFixed(0) : '-'}°`);
        if (!best || best.ang < joinAngle) break;
        const ei = pool[best.i], ej = pool[best.j];
        if (evJ) evJ.pairs.push({ i: es.indexOf(ei), j: es.indexOf(ej), angle: best.ang });
        link.set(key(ei), ej); link.set(key(ej), ei);
        pool.splice(best.j, 1); pool.splice(best.i, 1);
      }
    }
    // walk the links into strokes
    const used = new Set();
    const out = [];
    const walk = (e) => {
      // e: an end to start from; returns pixel list
      const px = [];
      let cur = e; let guard = 0;
      while (cur && guard++ < paths.length + 2) {
        const p = cur.path; if (used.has(p)) break; used.add(p);
        const seq = cur.atA ? p.px : p.px.slice().reverse();
        for (let i = px.length ? 1 : 0; i < seq.length; i++) px.push(seq[i]);
        const other = { path: p, atA: !cur.atA };
        cur = link.get(key(other)) || null;
      }
      return px;
    };
    // start from free ends first (ends without a link), then whatever is left (loops)
    for (const p of paths) {
      if (used.has(p)) continue;
      if (p.a === p.b) { used.add(p); out.push(p.px.map(P)); continue; }
      const freeA = !link.has(paths.indexOf(p) + ':a'), freeB = !link.has(paths.indexOf(p) + ':b');
      if (freeA) out.push(walk({ path: p, atA: true }).map(P));
      else if (freeB) out.push(walk({ path: p, atA: false }).map(P));
    }
    for (const p of paths) { if (!used.has(p)) out.push(walk({ path: p, atA: true }).map(P)); }
    if (o.debug) console.log(`  [walk] strokes ${out.length}, px ${out.reduce((s, q) => s + q.length, 0)}, links ${link.size / 2}`);
    return out.filter((s) => s.length >= 2);
  }

  // ---- strokes by coverage ----------------------------------------------------
  // Every path of the skeleton graph is a candidate piece; a stroke is a chain
  // of pieces that continues smoothly (turning angle ≥ o.join) through the
  // junctions. Each piece covers the ink pixels within its measured width.
  // Chains are grown greedily — seed on the piece that covers the most ink not
  // yet explained, extend it at both ends to the freshest, straightest
  // continuation — and a chain is kept only if it explains at least
  // o.cost × (median width)² pixels of its own (default 1.0). Rejected chains
  // are discarded. This is a minimum-description-length choice: a spur or a
  // speck cannot pay for a stroke, a dot can, and the branches inside a blob
  // of thick ink are kept because nothing else covers the blob. Nothing here
  // knows what a character is; the order is decided afterwards.
  // o.fresh: a continuation must be at least this fraction uncovered (0.3).
  // A piece too short to have a direction (a dot thins to a pixel or two) is
  // drawn as a short segment along the axis of the ink it covers.
  function selectByCoverage(paths, specks, sk, dist, P, bm, o, ev) {
    const { w, h } = sk; const ink = bm.data;
    const joinAngle = ((o.join ?? 105) * Math.PI) / 180, fresh = o.fresh ?? 0.3;
    // the pieces and the ink each one covers
    const atoms = [];
    const stamp = new Int32Array(w * h).fill(-1);
    const pieces = paths.concat(specks.map((i, k) => ({ a: -1 - k, b: -1 - k, px: [i] })));
    for (const p of pieces) {
      const idx = atoms.length, list = [];
      for (const i of p.px) {
        const r = (dist[i] || 0.5) + 0.7, R = Math.ceil(r), x0 = i % w, y0 = (i / w) | 0;
        for (let dy = -R; dy <= R; dy++) {
          const y = y0 + dy; if (y < 0 || y >= h) continue;
          for (let dx = -R; dx <= R; dx++) {
            const x = x0 + dx; if (x < 0 || x >= w || dx * dx + dy * dy > r * r) continue;
            const j = y * w + x; if (!ink[j] || stamp[j] === idx) continue;
            stamp[j] = idx; list.push(j);
          }
        }
      }
      atoms.push({ a: p.a, b: p.b, px: p.px, cov: Int32Array.from(list), used: false });
    }
    let inkCount = 0; for (let i = 0; i < w * h; i++) if (ink[i]) inkCount++;
    const ws = []; for (const at of atoms) for (const i of at.px) ws.push(P(i).w);
    ws.sort((a, b) => a - b); const medW = ws.length ? ws[ws.length >> 1] : 2;
    const cost = (o.cost ?? 1.0) * medW * medW;
    // piece ends at every node, with the direction the piece leaves in
    const dirAt = (at, atA) => {
      const px = atA ? at.px : at.px.slice().reverse();
      const n = Math.min(px.length - 1, Math.max(3, Math.round(P(px[0]).w * 1.5)));
      const a = P(px[0]), b = P(px[n]); const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
    };
    const ends = new Map();
    for (const at of atoms) for (const atA of [true, false]) {
      if (at.px.length < 2) continue;
      const id = atA ? at.a : at.b; if (!ends.has(id)) ends.set(id, []);
      ends.get(id).push({ at, atA, dir: dirAt(at, atA) });
    }
    // a piece of one or two pixels: a segment through the ink's centroid along
    // its principal axis, as long as the ink's spread
    const tinyStroke = (at) => {
      let n = 0, mx = 0, my = 0; for (const j of at.cov) { mx += j % w; my += (j / w) | 0; n++; }
      mx /= n || 1; my /= n || 1;
      let sxx = 0, syy = 0, sxy = 0; for (const j of at.cov) { const dx = j % w - mx, dy = ((j / w) | 0) - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
      sxx /= n || 1; syy /= n || 1; sxy /= n || 1;
      const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
      const l1 = Math.max(0.25, (sxx + syy) / 2 + Math.hypot((sxx - syy) / 2, sxy));
      const k = Math.max(1, Math.sqrt(l1) * 1.4), ww = P(at.px[0]).w;
      return [{ x: mx - Math.cos(th) * k, y: my - Math.sin(th) * k, w: ww }, { x: mx + Math.cos(th) * k, y: my + Math.sin(th) * k, w: ww }];
    };
    const angle = (u, v) => Math.acos(Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y)));
    const covered = new Uint8Array(w * h); let coveredCount = 0;
    const gainOf = (at) => { let g = 0; for (const j of at.cov) if (!covered[j]) g++; return g; };
    const out = [], chains = [];
    const pixels = (ps) => ps.flatMap((p) => (p.fwd ? p.at.px : p.at.px.slice().reverse()));
    while (true) {
      let seed = null, g0 = 0;
      for (const at of atoms) { if (at.used) continue; const g = gainOf(at); if (g > g0) { g0 = g; seed = at; } }
      if (!seed) break;
      seed.used = true;
      // cover as we go, so the pieces of one chain do not count the same ink twice
      const touched = [];
      const take = (at) => { let g = 0; for (const j of at.cov) if (!covered[j]) { covered[j] = 1; touched.push(j); g++; } return g; };
      let gain = take(seed);
      const parts = [{ at: seed, fwd: true }];   // fwd: the piece is walked a → b
      for (const side of ['b', 'a']) {
        let cur = { at: seed, atA: side === 'a' };
        while (cur.at.px.length >= 2) {
          const nid = cur.atA ? cur.at.a : cur.at.b;
          const es = ends.get(nid);
          const here = es.find((e) => e.at === cur.at && e.atA === cur.atA);
          let best = null;
          for (const e of es) {
            if (e.at.used) continue;
            const ang = angle(here.dir, e.dir); if (ang < joinAngle) continue;
            const g = gainOf(e.at); if (g < fresh * e.at.cov.length) continue;
            const score = g * (1 + (ang - joinAngle) / (Math.PI - joinAngle));
            if (!best || score > best.score) best = { e, score };
          }
          if (!best) break;
          const { e } = best; e.at.used = true; gain += take(e.at);
          // walked away from the junction: a → b if we entered at a
          if (side === 'b') parts.push({ at: e.at, fwd: e.atA }); else parts.unshift({ at: e.at, fwd: !e.atA });
          cur = { at: e.at, atA: !e.atA };
        }
      }
      // a chain must pay for itself, except the first: ink that is there at
      // all (it survived the dust filter) gets at least one stroke
      const accepted = gain >= cost || out.length === 0;
      chains.push({ px: pixels(parts), gain, accepted });
      if (!accepted) { for (const j of touched) covered[j] = 0; continue; }
      coveredCount += touched.length;
      out.push(parts);
    }
    // merge at bends: where exactly two kept strokes end at a node and nothing
    // passes through it, they are one stroke turning a corner (a 折), unless
    // the turn is sharper than o.bend degrees (default 80: 撇 and 捺 meeting
    // at the top of 人 stay two strokes)
    const bendAngle = ((o.bend ?? 80) * Math.PI) / 180;
    const nodeOfEnd = (p, first) => (first ? (p.fwd ? p.at.a : p.at.b) : (p.fwd ? p.at.b : p.at.a));
    const endDir = (p, first) => dirAt(p.at, first ? p.fwd : !p.fwd);   // pointing from the node into the stroke
    const alive = out.map(() => true);
    const touch = new Map();   // node -> { ends: [{ s, first }], through: n }
    out.forEach((parts, si) => {
      if (parts.length === 1 && parts[0].at.px.length < 2) return;
      const add = (nid, rec) => { if (!touch.has(nid)) touch.set(nid, { ends: [], through: 0 }); const t = touch.get(nid); if (rec) t.ends.push(rec); else t.through++; };
      add(nodeOfEnd(parts[0], true), { s: si, first: true });
      add(nodeOfEnd(parts[parts.length - 1], false), { s: si, first: false });
      for (let i = 0; i + 1 < parts.length; i++) add(nodeOfEnd(parts[i], false), null);
    });
    const find = (si) => { while (out[si].into != null) si = out[si].into; return si; };
    // which end of stroke si sits at node nid, if any (strokes change as they merge)
    const endAt = (si, nid) => { const ps = out[si]; if (nodeOfEnd(ps[0], true) === nid) return true; if (nodeOfEnd(ps[ps.length - 1], false) === nid) return false; return null; };
    const flip = (ps) => ps.slice().reverse().map((p) => ({ at: p.at, fwd: !p.fwd }));
    for (const [nid, t] of touch) {
      if (t.ends.length !== 2 || t.through) continue;
      const s1 = find(t.ends[0].s), s2 = find(t.ends[1].s);
      if (s1 === s2) continue;
      const f1 = endAt(s1, nid), f2 = endAt(s2, nid);
      if (f1 == null || f2 == null) continue;
      const p1 = out[s1], p2 = out[s2];
      const end1 = f1 ? p1[0] : p1[p1.length - 1], end2 = f2 ? p2[0] : p2[p2.length - 1];
      if (angle(endDir(end1, f1), endDir(end2, f2)) < bendAngle) continue;
      // orient s1 to end at the node and s2 to start there, then join
      const a = f1 ? flip(p1) : p1.slice(), b = f2 ? p2.slice() : flip(p2);
      out[s1] = a.concat(b); out[s2].into = s1; alive[s2] = false;
    }
    const result = [];
    out.forEach((parts, si) => {
      if (!alive[si]) return;
      const px = pixels(parts);
      result.push(px.length >= 3 ? px.map(P) : tinyStroke(parts[0].at));
    });
    if (ev) ev.push({ stage: 'select', chains, cost, medW, merged: out.length - result.length });
    if (o.stats) Object.assign(o.stats, { ink: inkCount, covered: coveredCount, pieces: atoms.length, chains: chains.length, kept: result.length, merged: out.length - result.length });
    return result;
  }

  // How much of the ink lies within the strokes' width: { ink, covered } in
  // pixels, for any set of strokes [{x, y, w}] over the bitmap they came from.
  function coverage(strokes, bm) {
    const { w, h, data } = bm; const hit = new Uint8Array(w * h);
    for (const s of strokes) for (const q of s) {
      const r = q.w / 2 + 0.7, R = Math.ceil(r), x0 = Math.round(q.x - 0.5), y0 = Math.round(q.y - 0.5);
      for (let dy = -R; dy <= R; dy++) {
        const y = y0 + dy; if (y < 0 || y >= h) continue;
        for (let dx = -R; dx <= R; dx++) { const x = x0 + dx; if (x < 0 || x >= w || dx * dx + dy * dy > r * r) continue; hit[y * w + x] = 1; }
      }
    }
    let ink = 0, covered = 0;
    for (let i = 0; i < w * h; i++) if (data[i]) { ink++; if (hit[i]) covered++; }
    return { ink, covered };
  }

  // ---- what the strokes paint ---------------------------------------------------
  // The brush (js/ink/brush.js) is a row of bristles held across the stroke:
  // at every sample it spans w along the normal, and each bristle draws a
  // line to its next position. So between two samples it paints the
  // quadrilateral spanned by their two cross-segments, and a stroke ends
  // flat, not with a round cap. hits() marks the pixels of a w × h grid whose
  // centres lie in that footprint (or within tol of it, default 0.5 px: a
  // pixel the edge passes through counts). Coordinates are continuous: pixel
  // (i, j) covers [i, i+1) × [j, j+1).
  // where segments p1–p2 and q1–q2 cross, or null
  function segX(p1, p2, q1, q2) {
    const rx = p2.x - p1.x, ry = p2.y - p1.y, sx = q2.x - q1.x, sy = q2.y - q1.y;
    const den = rx * sy - ry * sx; if (Math.abs(den) < 1e-9) return null;
    const t = ((q1.x - p1.x) * sy - (q1.y - p1.y) * sx) / den, u = ((q1.x - p1.x) * ry - (q1.y - p1.y) * rx) / den;
    return t > 0 && t < 1 && u > 0 && u < 1 ? { x: p1.x + rx * t, y: p1.y + ry * t } : null;
  }
  function hits(strokes, w, h, tol = 0.5) {
    const hit = new Uint8Array(w * h);
    // fill the convex hull of a few points, grown by tol
    const fillHull = (P) => {
      // hull of ≤ 4 points (monotone chain)
      const pts = P.slice().sort((a, b) => a.x - b.x || a.y - b.y);
      const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
      const lower = [], upper = [];
      for (const q of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
      for (let i = pts.length - 1; i >= 0; i--) { const q = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
      const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const q of P) { if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; }
      const X0 = Math.max(0, Math.floor(x0 - tol - 0.5)), X1 = Math.min(w - 1, Math.ceil(x1 + tol - 0.5));
      const Y0 = Math.max(0, Math.floor(y0 - tol - 0.5)), Y1 = Math.min(h - 1, Math.ceil(y1 + tol - 0.5));
      if (hull.length < 3) {
        // degenerate (a point or a line): a segment grown by tol
        const a = hull[0] || P[0], b = hull[hull.length - 1] || P[0];
        const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy, r = tol + 0.5;
        for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
          const px = x + 0.5 - a.x, py = y + 0.5 - a.y, t = L2 > 1e-9 ? Math.max(0, Math.min(1, (px * dx + py * dy) / L2)) : 0;
          const ex = px - dx * t, ey = py - dy * t; if (ex * ex + ey * ey <= r * r) hit[y * w + x] = 1;
        }
        return;
      }
      // edges with outward unit normals (hull is counter-clockwise in y-down? use signed area)
      let area = 0; for (let i = 0; i < hull.length; i++) { const a = hull[i], b = hull[(i + 1) % hull.length]; area += a.x * b.y - b.x * a.y; }
      const sgn = area > 0 ? 1 : -1;
      const E = hull.map((a, i) => { const b = hull[(i + 1) % hull.length]; const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return { a, nx: sgn * dy / l, ny: -sgn * dx / l }; });
      for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
        const cx = x + 0.5, cy = y + 0.5; let ok = true;
        for (const e of E) { if ((cx - e.a.x) * e.nx + (cy - e.a.y) * e.ny > tol) { ok = false; break; } }
        if (ok) hit[y * w + x] = 1;
      }
    };
    for (const s of strokes) {
      const n = s.length; if (!n) continue;
      if (n === 1) { const q = s[0], r = q.w / 2; fillHull([{ x: q.x - r, y: q.y }, { x: q.x + r, y: q.y }, { x: q.x, y: q.y - r }, { x: q.x, y: q.y + r }]); continue; }
      const nrm = s.map((q, i) => {
        const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)];
        const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
        return { x: -dy / l, y: dx / l };
      });
      for (let i = 1; i < n; i++) {
        const a = s[i - 1], b = s[i], na = nrm[i - 1], nb = nrm[i], ra = a.w / 2, rb = b.w / 2;
        const ap = { x: a.x + na.x * ra, y: a.y + na.y * ra }, am = { x: a.x - na.x * ra, y: a.y - na.y * ra };
        const bp = { x: b.x + nb.x * rb, y: b.y + nb.y * rb }, bm2 = { x: b.x - nb.x * rb, y: b.y - nb.y * rb };
        // on a turn tighter than the stroke is wide the outer bristles cross
        // the inner ones: the swept area is a bow-tie, not the quadrilateral
        const X = segX(ap, bp, am, bm2);
        if (X) { fillHull([ap, am, X]); fillHull([bp, bm2, X]); }
        else fillHull([ap, am, bp, bm2]);
      }
    }
    return hit;
  }
  // How faithfully the strokes reproduce the ink of bitmap bm: recall is the
  // share of ink pixels the strokes paint, precision the share of painted
  // pixels that are ink or touch it. residual: the ink they miss (a mask).
  function fidelity(strokes, bm, o = {}) {
    const { w, h, data } = bm;
    const hit = hits(strokes, w, h, o.tol ?? 0.5);
    let ink = 0, covered = 0, painted = 0, onInk = 0;
    const residual = o.residual ? new Uint8Array(w * h) : null;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (data[i]) { ink++; if (hit[i]) covered++; else if (residual) residual[i] = 1; }
      if (hit[i]) {
        painted++;
        let near = data[i];
        for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) {
          const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && data[yy * w + xx]) near = 1;
        }
        if (near) onInk++;
      }
    }
    return { ink, covered, painted, onInk, recall: ink ? covered / ink : 1, precision: painted ? onInk / painted : 1, residual, hit };
  }

  // Drop the samples a stroke does not need: Douglas–Peucker on position and
  // half-width together, so a sample stays wherever the line bends or the
  // width changes by more than tol (px). The brush resamples on its own.
  function simplify(pts, tol = 0.3) {
    if (pts.length <= 2) return pts.slice();
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [i0, i1] = stack.pop(); const a = pts[i0], b = pts[i1];
      const dx = b.x - a.x, dy = b.y - a.y, dw = (b.w - a.w) / 2, L2 = dx * dx + dy * dy;
      let worst = -1, wd = tol;
      for (let i = i0 + 1; i < i1; i++) {
        const q = pts[i]; const t = L2 > 1e-9 ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / L2)) : 0;
        const ex = q.x - a.x - dx * t, ey = q.y - a.y - dy * t, ew = (q.w - a.w) / 2 - dw * t;
        const d = Math.sqrt(ex * ex + ey * ey + ew * ew);
        if (d > wd) { wd = d; worst = i; }
      }
      if (worst >= 0) { keep[worst] = 1; stack.push([i0, worst], [worst, i1]); }
    }
    return pts.filter((_, i) => keep[i]);
  }

  // Which stroke each ink pixel of bm belongs to: the one whose centre line
  // passes nearest, less its half-width (so a thick stroke claims more of a
  // junction than a thin one crossing it). -1 for paper. A bucket grid keeps
  // the search local.
  function territory(strokes, bm) {
    const { w: W, h: H, data } = bm;
    const owner = new Int32Array(W * H).fill(-1);
    const samples = [];
    strokes.forEach((s, si) => { const d = s.length > 1 ? resample(s, 1) : s; for (const q of d) samples.push({ x: q.x, y: q.y, r: q.w / 2, si }); });
    if (!samples.length) return owner;
    const B = 8, gw = Math.ceil(W / B), gh = Math.ceil(H / B), grid = Array.from({ length: gw * gh }, () => []);
    for (const q of samples) { const gx = Math.min(gw - 1, Math.max(0, Math.floor(q.x / B))), gy = Math.min(gh - 1, Math.max(0, Math.floor(q.y / B))); grid[gy * gw + gx].push(q); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!data[y * W + x]) continue;
      const cx = x + 0.5, cy = y + 0.5, gx = Math.floor(cx / B), gy = Math.floor(cy / B);
      let best = -1, bd = Infinity;
      for (let ring = 0; ring < Math.max(gw, gh); ring++) {
        for (let yy = gy - ring; yy <= gy + ring; yy++) for (let xx = gx - ring; xx <= gx + ring; xx++) {
          if (Math.max(Math.abs(yy - gy), Math.abs(xx - gx)) !== ring || xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
          for (const q of grid[yy * gw + xx]) { const d = Math.hypot(q.x - cx, q.y - cy) - q.r; if (d < bd) { bd = d; best = q.si; } }
        }
        // anything in a farther ring is at least (ring) buckets away
        if (best >= 0 && bd + 40 < ring * B) break;
        if (best >= 0 && ring >= 2 && bd < (ring - 1) * B - 20) break;
      }
      owner[y * W + x] = best;
    }
    return owner;
  }

  // ---- refining the strokes against the ink ---------------------------------------
  // The skeleton runs near the middle of a stroke, not exactly along it, its
  // width comes from the largest disc that fits (too wide where strokes
  // cross), and it stops about half a width short of each end. refine()
  // measures every stroke again on the ink itself, the way a ruler would:
  //  - at each sample, probe along the normal to both edges, move the sample
  //    to the middle and take the distance between the edges as the width
  //    (where a probe runs on into a crossing stroke, the sample takes its
  //    centre and width from its neighbours);
  //  - past each end, keep walking along the stroke's direction while there
  //    is ink, measuring the width as it narrows, so a blunt end stays blunt
  //    and a pointed one stays pointed.
  // bm: the ink bitmap the strokes were found in. Nothing here knows what
  // the strokes are; it only asks the ink where its edges are.
  function refine(strokes, bm, o = {}) {
    const { w: W, h: H, data } = bm;
    const step = o.probeStep ?? 0.25;
    const inkAt = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y); return xi >= 0 && yi >= 0 && xi < W && yi < H && data[yi * W + xi] === 1; };
    // Every ink pixel belongs to the stroke whose centre line is nearest (less
    // its half-width). A probe that walks out of its own stroke's pixels into
    // another stroke's has crossed a junction, not reached an edge.
    const owner = territory(strokes, bm);
    // distance from (x, y) to the ink's edge along (nx, ny): Infinity past
    // max, or when the probe enters another stroke's ink (si: the stroke)
    const probe = (x, y, nx, ny, max, si) => {
      for (let s = step; s <= max; s += step) {
        const px = x + nx * s, py = y + ny * s;
        if (!inkAt(px, py)) return s - step / 2;
        if (si != null) { const ow = owner[Math.floor(py) * W + Math.floor(px)]; if (ow >= 0 && ow !== si) return Infinity; }
      }
      return Infinity;
    };
    const median = (a) => { const b = a.filter((v) => v != null && isFinite(v)).sort((p, q) => p - q); return b.length ? b[b.length >> 1] : null; };
    const smooth1 = (arr) => arr.map((v, i) => (i === 0 || i === arr.length - 1) ? v : (arr[i - 1] + 2 * v + arr[i + 1]) / 4);
    const out = [];
    for (let si = 0; si < strokes.length; si++) {
      const s0 = strokes[si];
      if (s0.length < 2) { out.push(s0); continue; }
      // measure about every pixel, whatever the stroke's sampling
      const s = resample(s0, o.measureStep ?? 1);
      const n = s.length;
      if (n < 2) { out.push(s0); continue; }
      const tan = s.map((q, i) => {
        const k = Math.max(1, Math.round(q.w / 3));
        const a = s[Math.max(0, i - k)], b = s[Math.min(n - 1, i + k)];
        const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
        return { x: dx / l, y: dy / l };
      });
      // 1. centre and width across the stroke
      const meas = s.map((q, i) => {
        if (!inkAt(q.x, q.y)) return null;
        const nx = -tan[i].y, ny = tan[i].x, max = Math.max(3, q.w * 1.6);
        const a = probe(q.x, q.y, nx, ny, max, si), b = probe(q.x, q.y, -nx, -ny, max, si);
        if (!isFinite(a) || !isFinite(b)) return null;
        return { off: (a - b) / 2, w: a + b };
      });
      // a sample much wider than the stroke around it sits in a crossing or a blob
      const ws = meas.map((m) => (m ? m.w : null));
      for (let i = 0; i < n; i++) {
        if (!meas[i]) continue;
        const loc = median(ws.slice(Math.max(0, i - 6), i + 7));
        if (loc != null && meas[i].w > loc * 1.45 + 1) meas[i] = null;
      }
      const valid = meas.map((m) => !!m);
      if (!valid.some(Boolean)) { out.push(s0); continue; }
      // fill the gaps by interpolating between the nearest measured samples
      const off = new Array(n), wd = new Array(n);
      let prev = -1;
      for (let i = 0; i <= n; i++) {
        if (i < n && !valid[i]) continue;
        const a = prev, b = i < n ? i : -1;
        for (let k = a + 1; k < (b < 0 ? n : b); k++) {
          if (a < 0) { off[k] = meas[b].off; wd[k] = meas[b].w; }
          else if (b < 0) { off[k] = meas[a].off; wd[k] = meas[a].w; }
          else { const u = (k - a) / (b - a); off[k] = meas[a].off + (meas[b].off - meas[a].off) * u; wd[k] = meas[a].w + (meas[b].w - meas[a].w) * u; }
        }
        if (b >= 0) { off[b] = meas[b].off; wd[b] = meas[b].w; }
        prev = b;
      }
      // smooth over about half the stroke's width: a ragged edge (a rubbing's
      // erosion, a thick brush's fringe) must not make the centre line wiggle
      const gauss = (arr, sigmaOf) => arr.map((v, i) => {
        const sg = Math.max(0.8, sigmaOf(i)), R = Math.ceil(sg * 2.5);
        let a = 0, ws2 = 0;
        for (let j = Math.max(0, i - R); j <= Math.min(arr.length - 1, i + R); j++) { const g = Math.exp(-0.5 * ((j - i) / sg) ** 2); a += g * arr[j]; ws2 += g; }
        return a / ws2;
      });
      const offS = gauss(off, (i) => (wd[i] || 2) * (o.centreSmooth ?? 0.45)), wS = gauss(wd, (i) => (wd[i] || 2) * (o.widthSmooth ?? 0.3));
      let pts = s.map((q, i) => ({ x: q.x - tan[i].y * offS[i], y: q.y + tan[i].x * offS[i], w: Math.max(1, wS[i]) }));
      // 2. follow the ink past each end
      if (o.tips !== false) {
        const tip = (atStart) => {
          const e = atStart ? pts[0] : pts[pts.length - 1];
          const r = atStart ? pts[Math.min(3, pts.length - 1)] : pts[Math.max(0, pts.length - 4)];
          let tx = e.x - r.x, ty = e.y - r.y; const l = Math.hypot(tx, ty); if (l < 1e-6) return [];
          tx /= l; ty /= l;
          const ext = [], ds = Math.max(0.5, Math.min(1.5, e.w * 0.2)), maxLen = Math.max(2, e.w * (o.tipReach ?? 2.5));
          let cx = e.x, cy = e.y, run = 0;
          while (run < maxLen) {
            const px = cx + tx * ds, py = cy + ty * ds; run += ds;
            if (!inkAt(px, py)) break;
            // into another stroke's ink: step a pixel in, so the two overlap
            // instead of leaving a hairline seam where they meet, and stop
            const lastW = ext.length ? ext[ext.length - 1].w : e.w;
            const ow = owner[Math.floor(py) * W + Math.floor(px)];
            if (ow >= 0 && ow !== si) { ext.push({ x: cx + tx * Math.min(ds, 1), y: cy + ty * Math.min(ds, 1), w: lastW }); break; }
            const nx = -ty, ny = tx, max = Math.max(3, e.w * 1.6);
            const a = probe(px, py, nx, ny, max, si), b = probe(px, py, -nx, -ny, max, si);
            if (!isFinite(a) || !isFinite(b)) { ext.push({ x: cx + tx * Math.min(ds, 1), y: cy + ty * Math.min(ds, 1), w: lastW }); break; }
            const wv = a + b;
            if (wv > e.w * 1.35 + 1) break;                    // widening: another stroke
            cx = px + nx * (a - b) / 2; cy = py + ny * (a - b) / 2;
            ext.push({ x: cx, y: cy, w: Math.max(0.6, wv) });
          }
          // the last bit: from the last sample to where the ink runs out ahead
          // (the brush ends flat, so the stroke ends at the ink's edge)
          const last = ext.length ? ext[ext.length - 1] : e;
          const ahead = probe(last.x, last.y, tx, ty, Math.max(2, last.w), si);
          if (isFinite(ahead) && ahead > 0.4) ext.push({ x: last.x + tx * (ahead - 0.25), y: last.y + ty * (ahead - 0.25), w: Math.max(0.6, last.w * 0.6) });
          return ext;
        };
        const head = tip(true), tail = tip(false);
        pts = [...head.reverse(), ...pts, ...tail];
      }
      out.push(pts);
    }
    return o.fill === false ? out : fillMissed(out, bm, owner, o);
  }

  // 3. The ink no stroke paints yet — mostly the blob where two strokes meet,
  // which belongs to one of them but lay outside its measured width. Each
  // missed pixel asks the stroke it belongs to (owner, from territory()) to
  // reach it: the sample nearest to it grows on that side, and its centre
  // moves so the other side stays put. A stroke reaches at most a little
  // more than its own width; pixels farther away stay missed.
  function fillMissed(strokes, bm, owner, o = {}) {
    const { w: W, h: H, data } = bm;
    const hit = hits(strokes, W, H, 0.5);
    const adj = strokes.map((s) => s.map(() => ({ l: 0, r: 0 })));
    const nrm = strokes.map((s) => s.map((q, i) => {
      const a = s[Math.max(0, i - 2)], b = s[Math.min(s.length - 1, i + 2)];
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return { x: -dy / l, y: dx / l };
    }));
    let any = false;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!data[i] || hit[i]) continue;
      const si = owner[i]; if (si < 0 || !strokes[si] || strokes[si].length < 2) continue;
      const s = strokes[si], cx = x + 0.5, cy = y + 0.5;
      let best = -1, bd = Infinity;
      for (let k = 0; k < s.length; k++) { const d = (s[k].x - cx) ** 2 + (s[k].y - cy) ** 2; if (d < bd) { bd = d; best = k; } }
      if (best < 2 || best > s.length - 3) continue;                  // the ends are the tips' business
      const q = s[best], n = nrm[si][best];
      const along = (cx - q.x) * n.y * -1 + (cy - q.y) * n.x;        // along the stroke
      const d = (cx - q.x) * n.x + (cy - q.y) * n.y;                  // across it
      const half = q.w / 2;
      if (Math.abs(along) > 1.5) continue;
      const need = Math.abs(d) + 0.5 - half;
      // a pixel just outside the edge is sub-pixel noise, not missing ink;
      // and a stroke does not stretch more than a third of its width
      if (need < 1 || need > Math.max(1.5, q.w * (o.reach ?? 0.35))) continue;
      const a = adj[si][best];
      if (d > 0) a.r = Math.max(a.r, need); else a.l = Math.max(a.l, need);
      any = true;
    }
    if (!any) return strokes;
    return strokes.map((s, si) => {
      if (s.length < 2) return s;
      // spread each adjustment a little along the stroke so the edge stays smooth
      const A = adj[si], n = s.length;
      const L = A.map((a) => a.l), R = A.map((a) => a.r);
      const spread = (arr) => arr.map((v, i) => Math.max(v, (arr[i - 1] || 0) * 0.6, (arr[i + 1] || 0) * 0.6));
      const Ls = spread(L), Rs = spread(R);
      return s.map((q, i) => {
        if (!Ls[i] && !Rs[i]) return q;
        const nn = nrm[si][i], shift = (Rs[i] - Ls[i]) / 2;
        return { x: q.x + nn.x * shift, y: q.y + nn.y * shift, w: q.w + Ls[i] + Rs[i] };
      });
    });
  }

  // ---- post-processing --------------------------------------------------------
  function smooth(pts, iters = 2) {
    let cur = pts;
    for (let k = 0; k < iters; k++) {
      const out = cur.map((q) => ({ ...q }));
      for (let i = 1; i < cur.length - 1; i++) {
        out[i].x = (cur[i - 1].x + 2 * cur[i].x + cur[i + 1].x) / 4;
        out[i].y = (cur[i - 1].y + 2 * cur[i].y + cur[i + 1].y) / 4;
        out[i].w = (cur[i - 1].w + 2 * cur[i].w + cur[i + 1].w) / 4;
      }
      cur = out;
    }
    return cur;
  }
  function resample(pts, spacing) {
    if (pts.length < 2) return pts.slice();
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1]; if (total < 1e-6) return [pts[0]];
    const n = Math.max(2, Math.round(total / spacing) + 1);
    const out = []; let seg = 0;
    for (let i = 0; i < n; i++) {
      const d = (total * i) / (n - 1);
      while (seg < pts.length - 2 && cum[seg + 1] < d) seg++;
      const a = pts[seg], b = pts[seg + 1], sl = cum[seg + 1] - cum[seg], u = sl > 0 ? (d - cum[seg]) / sl : 0;
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, w: a.w + (b.w - a.w) * u });
    }
    return out;
  }
  const length = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return s; };

  // ---- direction and order ------------------------------------------------------
  const bboxOf = (strokes) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of strokes) for (const q of s) { if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; }
    return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  };
  // Heuristic start: the end that is higher and further left (reading order of
  // a single stroke: horizontals left→right, verticals top→bottom, 撇 and 捺
  // from the top).
  function orient(pts) {
    const a = pts[0], b = pts[pts.length - 1];
    const sa = a.y + 0.6 * a.x, sb = b.y + 0.6 * b.x;
    return sb < sa ? pts.slice().reverse() : pts;
  }
  function orderHeuristic(strokes) {
    return strokes.map(orient).sort((a, b) => (a[0].y + 0.45 * a[0].x) - (b[0].y + 0.45 * b[0].x));
  }
  // Cursive flow: the brush hardly leaves the paper, so the next stroke
  // starts near where the last one ended. Begin with the stroke whose start
  // is highest (and leftmost), then always take the unwritten stroke whose
  // start is nearest the current end, preferring not to jump back up.
  function orderFlow(strokes) {
    const box = bboxOf(strokes), scale = Math.max(box.w, box.h) || 1;
    const rest = strokes.map(orient);
    rest.sort((a, b) => (a[0].y + 0.45 * a[0].x) - (b[0].y + 0.45 * b[0].x));
    const out = [rest.shift()];
    while (rest.length) {
      const end = out[out.length - 1][out[out.length - 1].length - 1];
      let bi = 0, bc = Infinity;
      rest.forEach((s, i) => {
        const a = s[0], d = Math.hypot(a.x - end.x, a.y - end.y) / scale;
        const up = Math.max(0, (end.y - a.y) / scale);          // jumping back up the character
        const c = d + 0.6 * up;
        if (c < bc) { bc = c; bi = i; }
      });
      out.push(rest.splice(bi, 1)[0]);
    }
    return out;
  }

  // Order and orient strokes with a template: `medians` are the strokes of
  // the same character in regular script ([[x, y], ...] per stroke, in
  // stroke order, y up as in hanzi-writer data). Both the template and the
  // extracted strokes are normalised to their own bounding boxes; the
  // template is sampled densely, every sample knowing which template stroke
  // it belongs to and how far along it lies (progress = index + t). Every
  // extracted stroke then reads, sample by sample, which template strokes it
  // runs over:
  //   - its place in the order is the first template stroke it covers
  //     (a cursive sweep that covers strokes 3, 4 and 5 is written third),
  //   - its direction is the direction in which the template progress grows
  //     along it (a stroke read backwards runs the template from 5 to 3),
  //   - two strokes covering the same template stroke are ordered by where
  //     along it they start.
  // Returns { strokes, info } with info[i] = { key, reversed, dist, cover }
  // in the returned order. Without a usable template, falls back to the
  // heuristic (top-left first).
  function order(strokes, medians, o = {}) {
    if (!strokes.length) return { strokes: [], info: [], method: 'none' };
    if (o.flow) return { strokes: orderFlow(strokes), info: null, method: 'flow' };
    if (!medians || !medians.length) return { strokes: orderFlow(strokes), info: null, method: 'flow (no template)' };
    const box = o.box || bboxOf(strokes);
    const norm = (pts, b) => pts.map((q) => ({ x: (q.x - b.x) / b.w, y: (q.y - b.y) / b.h, w: 0 }));
    const step = o.step ?? 0.02;
    // the template, densely sampled
    const tstrokes = medians.map((m) => m.map(([x, y]) => ({ x, y: -y, w: 0 })));
    const tb = bboxOf(tstrokes);
    const T = [];
    tstrokes.forEach((m, idx) => {
      const pts = resample(norm(m, tb), step);
      pts.forEach((q, i) => T.push({ x: q.x, y: q.y, idx, t: pts.length > 1 ? i / (pts.length - 1) : 0 }));
    });
    const nearest = (q) => { let best = null, bd = Infinity; for (const p of T) { const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2; if (d < bd) { bd = d; best = p; } } return { p: best, d: Math.sqrt(bd) }; };
    const scored = strokes.map((st) => {
      const a = resample(norm(st, box), step);
      const m = a.map(nearest);
      const dist = m.reduce((s, r) => s + r.d, 0) / m.length;
      // which template strokes this one covers, and how much of it lies on each
      const cover = new Map();
      m.forEach((r) => { if (r.d < (o.near ?? 0.18)) cover.set(r.p.idx, (cover.get(r.p.idx) || 0) + 1 / m.length); });
      const covered = [...cover.entries()].filter(([, f]) => f >= (o.minCover ?? 0.12)).map(([idx]) => idx);
      // direction: does the template progress grow along the stroke?
      const prog = m.map((r) => r.p.idx + r.p.t);
      const n = prog.length, mi = (n - 1) / 2, mp = prog.reduce((s, v) => s + v, 0) / n;
      let num = 0, den1 = 0, den2 = 0;
      prog.forEach((v, i) => { num += (i - mi) * (v - mp); den1 += (i - mi) ** 2; den2 += (v - mp) ** 2; });
      const corr = den1 && den2 ? num / Math.sqrt(den1 * den2) : 0;
      let reversed = corr < -0.15;
      if (Math.abs(corr) <= 0.15) reversed = orient(st) !== st;   // too short to tell: heuristic
      const pts = reversed ? st.slice().reverse() : st;
      // its place in the order: where in the template its opening part lies —
      // the mean progress over the first 40% of the stroke, weighted by how
      // close each sample sits to the template, so a stroke that merely
      // crosses an earlier template stroke is not written in its place
      const seq = reversed ? m.slice().reverse() : m;
      const head = seq.slice(0, Math.max(2, Math.ceil(seq.length * 0.4)));
      let ws = 0, wp = 0;
      for (const r of head) { const wgt = 1 / (r.d + 0.05); ws += wgt; wp += wgt * (r.p.idx + r.p.t); }
      const key = wp / ws;
      const start = reversed ? prog[prog.length - 1] : prog[0];
      const detail = o.detail ? { samples: (reversed ? a.slice().reverse() : a).map((q) => ({ x: q.x, y: q.y })), matches: seq.map((r) => ({ x: r.p.x, y: r.p.y, idx: r.p.idx, t: r.p.t, d: r.d })), corr } : null;
      return { pts, key, start, dist, reversed, cover: covered, detail };
    });
    const meanDist = scored.reduce((s, r) => s + r.dist, 0) / scored.length;
    if (meanDist > (o.maxDist ?? 0.3)) return { strokes: orderFlow(strokes), info: null, method: 'flow (poor match)' };
    scored.sort((p, q) => p.key - q.key || p.start - q.start);
    return { strokes: scored.map((r) => r.pts), info: scored.map((r) => ({ key: r.key, start: r.start, dist: r.dist, reversed: r.reversed, cover: r.cover, detail: r.detail })), method: 'template', template: o.detail ? { points: T, box: tb } : null, box };
  }
  // kept for callers of the old API
  function orderByTemplate(strokes, medians, box) { return order(strokes, medians, { box }).strokes; }

  // ---- strokes by the template --------------------------------------------------------
  // What counts as one stroke, and in which order the strokes were written, is
  // not in the ink: a corner may be one stroke turning or two strokes meeting,
  // a long chain through a junction may be three strokes. The regular-script
  // template of the same character (data/glyphs.js: one median polyline per
  // stroke, in writing order, y up) knows. parseChar() keeps the geometry
  // general — thinning, coverage selection, measuring on the ink — and asks
  // the template only which pieces belong together and in what order:
  //  1. fit the template to the skeleton: an affine transform by iterative
  //     closest points (template → ink and ink → template, weighted by
  //     distance and by how parallel the two directions are), then a small
  //     shift per stroke, since calligraphers move components around;
  //  2. label every sample of every skeleton chain with the template stroke
  //     it belongs to, or none, by a Viterbi pass along the chain (distance
  //     and direction to each stroke, a cost for switching), which also cuts
  //     a chain where it turns from one stroke into the next;
  //  3. assemble each template stroke from its pieces in the order of the
  //     template (sorted and oriented along it, bridged across the gap where
  //     another stroke crosses it), and hang the unclaimed pieces — links and
  //     flourishes — on the stroke they touch.
  // If the template does not fit (cursive forms, variants), the chains keep
  // their own shape and are ordered by template progress or by the flow of
  // the hand (order()).
  function gridIndex(points, cell) {
    const g = new Map();
    for (let i = 0; i < points.length; i++) { const p = points[i], k = Math.floor(p.x / cell) + ',' + Math.floor(p.y / cell); if (!g.has(k)) g.set(k, []); g.get(k).push(i); }
    return {
      nearest(x, y, maxR = Infinity) {
        const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
        let best = -1, bd = Infinity;
        for (let r = 0; r < 64; r++) {
          for (let yy = cy - r; yy <= cy + r; yy++) for (let xx = cx - r; xx <= cx + r; xx++) {
            if (Math.max(Math.abs(xx - cx), Math.abs(yy - cy)) !== r) continue;
            const list = g.get(xx + ',' + yy); if (!list) continue;
            for (const i of list) { const d = (points[i].x - x) ** 2 + (points[i].y - y) ** 2; if (d < bd) { bd = d; best = i; } }
          }
          if (best >= 0 && Math.sqrt(bd) <= r * cell) break;
          if (r * cell > maxR) break;
        }
        return best < 0 ? null : { i: best, d: Math.sqrt(bd) };
      },
    };
  }
  // weighted least squares for x' = a x + b y + c, y' = d x + e y + f
  function solveAffine(pairs) {
    const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], rx = [0, 0, 0], ry = [0, 0, 0];
    for (const [px, py, qx, qy, w] of pairs) {
      const v = [px, py, 1];
      for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) M[i][j] += w * v[i] * v[j]; rx[i] += w * v[i] * qx; ry[i] += w * v[i] * qy; }
    }
    const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const D = det3(M); if (Math.abs(D) < 1e-12) return null;
    const solve = (r) => [0, 1, 2].map((c) => det3(M.map((row, i) => row.map((v, j) => (j === c ? r[i] : v)))) / D);
    const [a, b, c] = solve(rx), [d, e, f] = solve(ry);
    return { a, b, c, d, e, f };
  }
  const applyA = (A, p) => ({ x: A.a * p.x + A.b * p.y + A.c, y: A.d * p.x + A.e * p.y + A.f });

  function byTemplate(chains, medians, o = {}) {
    // the template, densely sampled, with stroke index, position along the stroke and direction
    const tm = medians.map((m) => m.map(([x, y]) => ({ x, y: -y, w: 0 })));
    const tb = bboxOf(tm), tSize = Math.max(tb.w, tb.h) || 1;
    const tS = [];
    tm.forEach((st, k) => {
      const r = st.length > 1 ? resample(st, tSize / 60) : st;
      const n = r.length;
      r.forEach((q, i) => {
        const a = r[Math.max(0, i - 1)], b = r[Math.min(n - 1, i + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        tS.push({ x: q.x, y: q.y, k, u: n > 1 ? i / (n - 1) : 0.5, tx: (b.x - a.x) / l, ty: (b.y - a.y) / l });
      });
    });
    // the ink's chains, sampled every 2 px for the fit
    const cS = [];
    chains.forEach((st, c) => {
      const n = st.length;
      for (let i = 0; i < n; i += (n > 4 ? 2 : 1)) {
        const a = st[Math.max(0, i - 2)], b = st[Math.min(n - 1, i + 2)], l = Math.hypot(b.x - a.x, b.y - a.y);
        cS.push({ x: st[i].x, y: st[i].y, tx: l ? (b.x - a.x) / l : 0, ty: l ? (b.y - a.y) / l : 0, w: st[i].w });
      }
    });
    if (!cS.length || !tS.length) return null;
    const cb = bboxOf(chains), size = Math.max(cb.w, cb.h, 4);
    // 1. the fit, starting from box to box (per axis, within a factor of two of uniform: 一 has no height)
    const su = size / tSize;
    const sx = clamp(tb.w > 0.25 * tSize ? cb.w / tb.w : su, su / 2, su * 2), sy = clamp(tb.h > 0.25 * tSize ? cb.h / tb.h : su, su / 2, su * 2);
    const A0 = { a: sx, b: 0, c: cb.x + cb.w / 2 - sx * (tb.x + tb.w / 2), d: 0, e: sy, f: cb.y + cb.h / 2 - sy * (tb.y + tb.h / 2) };
    let A = { ...A0 };
    const cGrid = gridIndex(cS, Math.max(2, size / 24));
    const prior = [tb.x, tb.x + tb.w].flatMap((x) => [tb.y, tb.y + tb.h].map((y) => ({ x, y }))).concat([{ x: tb.x + tb.w / 2, y: tb.y + tb.h / 2 }]);
    const iters = o.fitIters ?? 14;
    for (let it = 0; it < iters; it++) {
      const sigma = size * (0.24 - 0.17 * it / Math.max(1, iters - 1));
      const lin = (t) => { const x = A.a * t.tx + A.b * t.ty, y = A.d * t.tx + A.e * t.ty, l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; };
      const T = tS.map((t) => ({ ...applyA(A, t), dir: lin(t) }));
      const tGrid = gridIndex(T, Math.max(2, size / 24));
      const pairs = []; let wsum = 0;
      T.forEach((p, i) => {
        const nn = cGrid.nearest(p.x, p.y, sigma * 3); if (!nn) return;
        const c = cS[nn.i], cos = Math.abs(p.dir.x * c.tx + p.dir.y * c.ty);
        const w = Math.exp(-((nn.d / sigma) ** 2)) * (0.3 + 0.7 * cos);
        if (w > 1e-4) { pairs.push([tS[i].x, tS[i].y, c.x, c.y, w]); wsum += w; }
      });
      cS.forEach((c) => {
        const nn = tGrid.nearest(c.x, c.y, sigma * 3); if (!nn) return;
        const p = T[nn.i], cos = Math.abs(p.dir.x * c.tx + p.dir.y * c.ty);
        const w = Math.exp(-((nn.d / sigma) ** 2)) * (0.3 + 0.7 * cos);
        if (w > 1e-4) { pairs.push([tS[nn.i].x, tS[nn.i].y, c.x, c.y, w]); wsum += w; }
      });
      // a little pull towards the box-to-box fit, so a sparse match cannot fold the template
      const pw = 0.06 * wsum / prior.length + 1e-6;
      for (const q of prior) { const r = applyA(A0, q); pairs.push([q.x, q.y, r.x, r.y, pw]); }
      const next = solveAffine(pairs); if (!next) break;
      // keep it a sensible transform: no flips, no extreme shear or squash
      const det = next.a * next.e - next.b * next.d;
      if (!(det > 0.15 * sx * sy) || det > 6 * sx * sy) break;
      A = next;
    }
    // per-stroke shift: where the template stroke's own nearest ink sits
    const shiftOf = tm.map(() => ({ x: 0, y: 0 }));
    {
      const sigma = size * 0.08, acc = tm.map(() => ({ x: 0, y: 0, w: 0 }));
      for (const t of tS) {
        const p = applyA(A, t), nn = cGrid.nearest(p.x, p.y, sigma * 3); if (!nn) continue;
        const c = cS[nn.i], w = Math.exp(-((nn.d / sigma) ** 2));
        acc[t.k].x += w * (c.x - p.x); acc[t.k].y += w * (c.y - p.y); acc[t.k].w += w;
      }
      acc.forEach((a, k) => { if (a.w > 2) { const m = size * 0.1; shiftOf[k] = { x: clamp(a.x / a.w, -m, m), y: clamp(a.y / a.w, -m, m) }; } });
    }
    // the template strokes as they now sit on the ink, sampled every ~1.5 px
    const placed = tm.map((st, k) => {
      const pts = st.map((q) => { const r = applyA(A, q); return { x: r.x + shiftOf[k].x, y: r.y + shiftOf[k].y, w: 0 }; });
      const r = pts.length > 1 ? resample(pts, 1.5) : pts;
      const n = r.length;
      return r.map((q, i) => { const a = r[Math.max(0, i - 1)], b = r[Math.min(n - 1, i + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: q.x, y: q.y, u: n > 1 ? i / (n - 1) : 0.5, tx: (b.x - a.x) / l, ty: (b.y - a.y) / l }; });
    });
    const K = tm.length;
    // 2. label the chains' samples
    const sig = Math.max(2.5, size * (o.labelSigma ?? 0.07)), beta = o.dirCost ?? 1.4, noneCost = o.noneCost ?? 6.5, switchCost = o.switchCost ?? 5, noneSwitch = o.noneSwitch ?? 3.5;
    const labelled = chains.map((st) => {
      const n = st.length;
      const tan = st.map((q, i) => { const a = st[Math.max(0, i - 2)], b = st[Math.min(n - 1, i + 2)], l = Math.hypot(b.x - a.x, b.y - a.y); return l ? { x: (b.x - a.x) / l, y: (b.y - a.y) / l } : null; });
      // cost of sample i on stroke k (k = K: none), and where along stroke k it falls
      const cost = new Float64Array(n * (K + 1)), uAt = new Float64Array(n * K), dAt = new Float64Array(n * K);
      for (let i = 0; i < n; i++) {
        for (let k = 0; k < K; k++) {
          let bd = Infinity, bj = 0; const P = placed[k];
          for (let j = 0; j < P.length; j++) { const d = (P[j].x - st[i].x) ** 2 + (P[j].y - st[i].y) ** 2; if (d < bd) { bd = d; bj = j; } }
          const d = Math.sqrt(bd), pj = P[bj];
          const cos = tan[i] ? Math.abs(tan[i].x * pj.tx + tan[i].y * pj.ty) : 1;
          cost[i * (K + 1) + k] = (d / sig) ** 2 + beta * (1 - cos);
          uAt[i * K + k] = pj.u; dAt[i * K + k] = d;
        }
        cost[i * (K + 1) + K] = noneCost;
      }
      // Viterbi
      const L = K + 1, acc = new Float64Array(n * L), from = new Int32Array(n * L);
      for (let k = 0; k < L; k++) acc[k] = cost[k];
      for (let i = 1; i < n; i++) {
        let best = 0; for (let k = 1; k < L; k++) if (acc[(i - 1) * L + k] < acc[(i - 1) * L + best]) best = k;
        for (let k = 0; k < L; k++) {
          const stay = acc[(i - 1) * L + k];
          const sw = acc[(i - 1) * L + best] + (k === K || best === K ? noneSwitch : switchCost);
          if (stay <= sw || best === k) { acc[i * L + k] = stay + cost[i * L + k]; from[i * L + k] = k; }
          else { acc[i * L + k] = sw + cost[i * L + k]; from[i * L + k] = best; }
        }
      }
      const lab = new Int32Array(n);
      let kk = 0; for (let k = 1; k < L; k++) if (acc[(n - 1) * L + k] < acc[(n - 1) * L + kk]) kk = k;
      for (let i = n - 1; i >= 0; i--) { lab[i] = kk; kk = from[i * L + kk]; }
      return { st, lab, uAt, dAt, n };
    });
    // runs of one label along each chain
    const runs = [];
    labelled.forEach(({ st, lab, uAt, n }, c) => {
      let i0 = 0;
      for (let i = 1; i <= n; i++) {
        if (i < n && lab[i] === lab[i0]) continue;
        const k = lab[i0], pts = st.slice(i0, i);
        const us = k < K ? Array.from({ length: i - i0 }, (_, j) => uAt[(i0 + j) * K + k]) : null;
        runs.push({ c, k: k < K ? k : -1, i0, i1: i, pts, us, len: length(pts) });
        i0 = i;
      }
    });
    // 3. assemble each template stroke
    const bm = o.bitmap;
    const inkAlong = (a, b) => {
      if (!bm) return 0;
      const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
      let on = 0;
      for (let i = 0; i <= n; i++) { const x = Math.floor(a.x + (b.x - a.x) * i / n), y = Math.floor(a.y + (b.y - a.y) * i / n); if (x >= 0 && y >= 0 && x < bm.w && y < bm.h && bm.data[y * bm.w + x]) on++; }
      return on / (n + 1);
    };
    const ws = []; for (const st of chains) for (const q of st) ws.push(q.w); ws.sort((a, b) => a - b);
    const medW = ws.length ? ws[ws.length >> 1] : 3;
    const perStroke = tm.map(() => []);
    for (const r of runs) if (r.k >= 0 && (r.len >= 1.5 || r.pts.length <= 2)) {
      // orient along the template: u should grow
      const du = r.us.length > 1 ? r.us[r.us.length - 1] - r.us[0] : 0;
      const fwd = du >= 0 || (Math.abs(du) < 0.02 && orient(r.pts) === r.pts);
      const pts = fwd ? r.pts : r.pts.slice().reverse(), us = fwd ? r.us : r.us.slice().reverse();
      perStroke[r.k].push({ pts, u0: Math.min(...us), u1: Math.max(...us), um: us.reduce((a, b) => a + b, 0) / us.length, len: r.len, run: r });
    }
    const strokesOut = [], tIndex = [];
    let found = 0, foundW = 0, totalW = 0;
    const tLen = tm.map((st) => length(st.map((q) => applyA(A, q))));
    perStroke.forEach((segs, k) => {
      totalW += tLen[k];
      if (!segs.length) return;
      segs.sort((a, b) => a.um - b.um);
      // a second piece lying along the same stretch of the stroke (a fork in a thick stroke) is a duplicate
      const kept = [];
      for (const s of segs) {
        const dup = kept.find((t) => Math.min(t.u1, s.u1) - Math.max(t.u0, s.u0) > 0.6 * Math.min(t.u1 - t.u0, s.u1 - s.u0) && Math.min(t.u1 - t.u0, s.u1 - s.u0) > 0.05);
        if (dup) { if (s.len > dup.len) kept.splice(kept.indexOf(dup), 1, s); continue; }
        kept.push(s);
      }
      kept.sort((a, b) => a.um - b.um);
      // chain the pieces: bridge a gap of a few widths, or any gap whose
      // straight line runs through ink (the stroke passing under another one
      // at a crossing); lift the brush otherwise
      const lines = [];
      let cur = null;
      for (const s of kept) {
        if (cur) {
          const a = cur[cur.length - 1], b = s.pts[0], gap = Math.hypot(b.x - a.x, b.y - a.y);
          if (gap <= Math.max(3, medW * (o.bridge ?? 2.6)) || (gap <= size * 0.4 && inkAlong(a, b) >= 0.85)) { cur.push(...s.pts); continue; }
          lines.push(cur);
        }
        cur = s.pts.slice();
      }
      if (cur) lines.push(cur);
      const span = kept.reduce((a, s) => a + (s.u1 - s.u0), 0);
      if (span >= 0.3 || kept.some((s) => s.len >= medW * 1.5)) { found++; foundW += tLen[k]; }
      for (const ln of lines) { strokesOut.push(ln); tIndex.push(k); }
    });
    // unclaimed pieces: a link or flourish hangs on the stroke whose end it touches,
    // a separate one becomes a stroke of its own after the stroke nearest to it
    const near = Math.max(3, medW * 1.5);
    for (const r of runs) {
      if (r.k >= 0 || r.len < Math.max(3, medW * 0.8)) continue;
      const a = r.pts[0], b = r.pts[r.pts.length - 1];
      let best = null;
      strokesOut.forEach((ln, j) => {
        const s0 = ln[0], s1 = ln[ln.length - 1];
        for (const [end, q, rev] of [[s1, a, false], [s1, b, true], [s0, b, 'pre'], [s0, a, 'prerev']]) {
          const d = Math.hypot(end.x - q.x, end.y - q.y);
          if (d <= near && (!best || d < best.d)) best = { d, j, rev };
        }
      });
      if (best) {
        const ln = strokesOut[best.j];
        if (best.rev === false) ln.push(...r.pts); else if (best.rev === true) ln.push(...r.pts.slice().reverse());
        else if (best.rev === 'pre') ln.unshift(...r.pts); else ln.unshift(...r.pts.slice().reverse());
      } else {
        // after the template stroke passing nearest its middle
        const m = r.pts[r.pts.length >> 1];
        let bk = 0, bd = Infinity;
        placed.forEach((P, k) => { for (const q of P) { const d = Math.hypot(q.x - m.x, q.y - m.y); if (d < bd) { bd = d; bk = k; } } });
        let at = strokesOut.length; for (let j = 0; j < tIndex.length; j++) if (tIndex[j] > bk) { at = j; break; }
        strokesOut.splice(at, 0, orient(r.pts)); tIndex.splice(at, 0, -1);
      }
    }
    // how well the template explains the ink
    let lab = 0, all = 0, dsum = 0, dn = 0;
    for (const { lab: L1, dAt, n } of labelled) for (let i = 0; i < n; i++) { all++; if (L1[i] < K) { lab++; dsum += dAt[i * K + L1[i]]; dn++; } }
    const quality = { labeled: all ? lab / all : 0, found: totalW ? foundW / totalW : 0, foundCount: found, strokes: K, meanDist: dn ? dsum / dn / size : 1 };
    const accept = quality.labeled >= (o.minLabeled ?? 0.72) && quality.found >= (o.minFound ?? 0.6);
    const labels = o.debugLabels ? labelled.map(({ lab }) => { const out = []; let prev = null, n = 0; for (const k of lab) { if (k === prev) n++; else { if (prev !== null) out.push(`${prev === K ? '·' : prev + 1}×${n}`); prev = k; n = 1; } } if (prev !== null) out.push(`${prev === K ? '·' : prev + 1}×${n}`); return out.join(' '); }) : undefined;
    return { strokes: strokesOut, tIndex, quality, accept, A, A0, placed, shiftOf, labels, labelArrays: o.debugLabels ? labelled.map(({ lab }) => Array.from(lab)) : undefined, K };
  }

  // A track through a thick blob of ink wanders and can loop back on itself:
  // cut out every loop (the track returns within half a width of where it was,
  // after travelling more than two widths), then smooth the positions with a
  // window as wide as the stroke, which keeps the stroke's own curves (they
  // are wider than the stroke) and drops the wiggles (they are narrower).
  function tidy(pts) {
    if (pts.length < 4) return pts;
    let q = pts;
    for (let pass = 0; pass < 3; pass++) {
      let cut = false;
      const out = [];
      for (let i = 0; i < q.length; i++) {
        out.push(q[i]);
        const r = Math.max(1, q[i].w * 0.5), need = Math.max(4, q[i].w * 2.2);
        let travel = 0, jump = -1;
        for (let j = i + 1; j < q.length; j++) {
          travel += Math.hypot(q[j].x - q[j - 1].x, q[j].y - q[j - 1].y);
          if (travel > need && Math.hypot(q[j].x - q[i].x, q[j].y - q[i].y) < r) jump = j;
          if (travel > need * 4) break;
        }
        if (jump > 0) { i = jump - 1; cut = true; }
      }
      q = out; if (!cut) break;
    }
    if (q.length < 4) return q;
    const ws = q.map((p) => p.w).sort((a, b) => a - b), wMed = ws[ws.length >> 1];
    const half = Math.max(1, Math.round(wMed * 0.45));
    const cum = [0]; for (let i = 1; i < q.length; i++) cum.push(cum[i - 1] + Math.hypot(q[i].x - q[i - 1].x, q[i].y - q[i - 1].y));
    return q.map((p, i) => {
      if (i === 0 || i === q.length - 1) return p;
      let sx = 0, sy = 0, sw = 0;
      for (let j = Math.max(0, i - 3 * half); j <= Math.min(q.length - 1, i + 3 * half); j++) {
        const d = cum[j] - cum[i], wt = Math.exp(-0.5 * (d / half) ** 2);
        sx += wt * q[j].x; sy += wt * q[j].y; sw += wt;
      }
      // never pull the ends of a stroke in: blend towards the original near them
      const edge = Math.min(cum[i], cum[q.length - 1] - cum[i]) / Math.max(1, wMed);
      const k = Math.min(1, edge);
      return { x: p.x + (sx / sw - p.x) * k, y: p.y + (sy / sw - p.y) * k, w: p.w };
    });
  }

  // Ink still unpainted after the strokes are measured — a blot beside a
  // stroke, the fringe of a thick one, a piece the template left unclaimed —
  // gets short strokes of its own when a patch is worth more than half a
  // stroke width squared. Each goes right after the stroke it lies against
  // and belongs to that stroke's step (same template index), so the strokes
  // stay the strokes and the ink is still all there.
  function patchMissed(strokesIn, tIn, bm, medW, o = {}) {
    const { w: W, h: H } = bm;
    const f = fidelity(strokesIn, bm, { residual: true }), res = f.residual;
    const minArea = Math.max(6, (o.patchArea ?? 0.5) * medW * medW);
    const seen = new Uint8Array(W * H), patches = [];
    for (let i = 0; i < W * H; i++) {
      if (!res[i] || seen[i]) continue;
      const comp = [], stack = [i]; seen[i] = 1;
      while (stack.length) {
        const j = stack.pop(); comp.push(j);
        const x = j % W, y = (j / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const k = yy * W + xx; if (res[k] && !seen[k]) { seen[k] = 1; stack.push(k); }
        }
      }
      if (comp.length >= minArea) patches.push(comp);
    }
    if (!patches.length) return { strokes: strokesIn, tIndex: tIn };
    const strokes = strokesIn.map((s) => s), tIndex = (tIn || strokesIn.map(() => -1)).slice();
    const after = strokes.map(() => []);
    for (const comp of patches) {
      // the patch's own strokes, from its own bitmap
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, cx = 0, cy = 0;
      for (const j of comp) { const x = j % W, y = (j / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; cx += x; cy += y; }
      cx = cx / comp.length + 0.5; cy = cy / comp.length + 0.5;
      const pad = 2, pw = x1 - x0 + 1 + pad * 2, ph = y1 - y0 + 1 + pad * 2, pbm = { w: pw, h: ph, data: new Uint8Array(pw * ph) };
      for (const j of comp) pbm.data[(((j / W) | 0) - y0 + pad) * pw + (j % W - x0 + pad)] = 1;
      const r = extractRaw(pbm, { patch: false, fill: false });
      // the stroke it lies against
      let owner = 0, bd = Infinity;
      strokes.forEach((st, k) => { for (const q of st) { const d = Math.hypot(q.x - cx, q.y - cy) - q.w / 2; if (d < bd) { bd = d; owner = k; } } });
      for (const st of r.strokes) after[owner].push(st.map((q) => ({ x: q.x - pad + x0, y: q.y - pad + y0, w: q.w })));
    }
    // a stroke and its patches share one key: its template index, or for a
    // stroke the template did not name, a key of its own below -1
    const outS = [], outT = [];
    strokes.forEach((st, k) => {
      // (a key of its own: below every movement key, so it cannot run into one)
      const key = tIndex[k] !== -1 ? tIndex[k] : (after[k].length ? -1000 - k : -1);
      outS.push(st); outT.push(key);
      for (const p of after[k]) { outS.push(p); outT.push(key); }
    });
    return { strokes: outS, tIndex: outT };
  }

  // Cursive is written in a few long movements; the skeleton breaks them at
  // every place the track crosses or touches itself. joinTracks() puts them
  // back together: where the ends of two pieces meet (within about a width),
  // they are one movement, joined at the smoothest pairing first — a
  // crossing continues straight through, a cusp turns as sharply as it must.
  function joinTracks(chains, o = {}) {
    const tr = chains.filter((c) => c.length >= 2).map((c) => c.slice());
    const dirIn = (c, atStart) => {   // unit vector from the end into the track
      const n = c.length, a = atStart ? c[0] : c[n - 1];
      let k = atStart ? 0 : n - 1, L = 0; const reach = Math.max(4, a.w * 1.2);
      while (L < reach && (atStart ? k < n - 1 : k > 0)) { const nk = atStart ? k + 1 : k - 1; L += Math.hypot(c[nk].x - c[k].x, c[nk].y - c[k].y); k = nk; }
      const b = c[k], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
    };
    for (let guard = 0; guard < 500; guard++) {
      let best = null;
      for (let i = 0; i < tr.length; i++) for (let j = i + 1; j < tr.length; j++) {
        for (const ai of [true, false]) for (const bj of [true, false]) {
          const a = ai ? tr[i][0] : tr[i][tr[i].length - 1], b = bj ? tr[j][0] : tr[j][tr[j].length - 1];
          const d = Math.hypot(a.x - b.x, a.y - b.y), lim = Math.max(2.5, (o.joinReach ?? 0.9) * Math.max(a.w, b.w));
          if (d > lim) continue;
          const u = dirIn(tr[i], ai), v = dirIn(tr[j], bj);
          const turn = Math.PI - Math.acos(Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y)));   // 0 = straight on
          const cost = turn + d / lim * 0.3;
          if (!best || cost < best.cost) best = { cost, i, j, ai, bj };
        }
      }
      if (!best) break;
      const { i, j, ai, bj } = best;
      // orient i to end at the joint and j to start there
      const A = ai ? tr[i].slice().reverse() : tr[i], Bt = bj ? tr[j] : tr[j].slice().reverse();
      tr[i] = A.concat(Bt.slice(1)); tr.splice(j, 1);
    }
    return tr;
  }
  // A dry brush (飛白) leaves one movement as several pieces of ink with paper
  // between them. linkMovements() strings such pieces back together: an end
  // of one piece links to an end of another if the gap is short (a few stroke
  // widths) and runs on in the direction both pieces point — the brush
  // carried on across it. Returns the movements, each a list of pieces in
  // the order the brush met them, each piece oriented that way. The pieces
  // are not joined: the paper in the gaps stays paper.
  function linkMovements(tracks, o = {}) {
    const n = tracks.length;
    if (n < 2) return tracks.map((t, i) => [o.indices ? { i, rev: false } : t]);
    const box = bboxOf(tracks), size = Math.max(box.w, box.h) || 1;
    const ws = tracks.flat().map((q) => q.w).sort((a, b) => a - b), medW = ws[ws.length >> 1] || 2;
    const maxGap = Math.max(3 * medW, (o.gapFrac ?? 0.14) * size), maxAng = ((o.gapAngle ?? 50) * Math.PI) / 180;
    const dirIn = (c, atStart) => {
      const m = c.length, a = atStart ? c[0] : c[m - 1];
      let k = atStart ? 0 : m - 1, L = 0; const reach = Math.max(4, a.w * 1.5);
      while (L < reach && (atStart ? k < m - 1 : k > 0)) { const nk = atStart ? k + 1 : k - 1; L += Math.hypot(c[nk].x - c[k].x, c[nk].y - c[k].y); k = nk; }
      const b = c[k], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
    };
    const ang = (u, v) => Math.acos(Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y)));
    // candidate links between ends: end e = 2 * track + (0: start, 1: end)
    const endPt = (e) => { const t = tracks[e >> 1]; return (e & 1) ? t[t.length - 1] : t[0]; };
    const cands = [];
    for (let e1 = 0; e1 < 2 * n; e1++) for (let e2 = e1 + 1; e2 < 2 * n; e2++) {
      if ((e1 >> 1) === (e2 >> 1)) continue;
      const a = endPt(e1), b = endPt(e2), g = { x: b.x - a.x, y: b.y - a.y }, d = Math.hypot(g.x, g.y);
      if (d > maxGap || d < 1e-6) continue;
      const gu = { x: g.x / d, y: g.y / d };
      const outA = dirIn(tracks[e1 >> 1], !(e1 & 1)), outB = dirIn(tracks[e2 >> 1], !(e2 & 1));   // pointing into each track
      // leaving piece 1 at e1 means moving against its inward direction
      const a1 = ang({ x: -outA.x, y: -outA.y }, gu), a2 = ang(gu, outB);
      if (a1 > maxAng || a2 > maxAng) continue;
      cands.push({ e1, e2, cost: (a1 + a2) / Math.PI + d / maxGap });
    }
    cands.sort((p, q) => p.cost - q.cost);
    const parent = tracks.map((_, i) => i), find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const linkOf = new Map();
    for (const c of cands) {
      if (linkOf.has(c.e1) || linkOf.has(c.e2)) continue;
      const r1 = find(c.e1 >> 1), r2 = find(c.e2 >> 1); if (r1 === r2) continue;
      parent[r1] = r2; linkOf.set(c.e1, c.e2); linkOf.set(c.e2, c.e1);
    }
    // walk every chain of linked pieces from a free end
    const used = new Uint8Array(n), out = [];
    for (let t = 0; t < n; t++) {
      if (used[t]) continue;
      // find a free end of t's chain
      let cur = t, e = 2 * t;
      for (let guard = 0; guard < n + 1; guard++) {
        const other = linkOf.get(e); if (other === undefined) break;
        cur = other >> 1; e = other ^ 1;
        if (cur === t) break;
      }
      const seq = [];
      // e is a free end of track cur: enter cur at e, leave at e ^ 1
      for (let guard = 0; guard < n + 1 && !used[cur]; guard++) {
        used[cur] = 1;
        seq.push(o.indices ? { i: cur, rev: !!(e & 1) } : ((e & 1) ? tracks[cur].slice().reverse() : tracks[cur]));
        const nxt = linkOf.get(e ^ 1); if (nxt === undefined) break;
        cur = nxt >> 1; e = nxt;
      }
      out.push(seq);
    }
    return out;
  }

  // Pieces that run alongside a longer one belong to its movement: the
  // fringe of a thick stroke the skeleton split off, or the parallel streaks
  // a dry brush leaves when its hairs part (飛白). Returns groups
  // { spine, extras } with every track in exactly one group, longest first.
  function groupAlongside(tracks, o = {}) {
    const ws = tracks.flat().map((q) => q.w).sort((a, b) => a - b), medW = ws[ws.length >> 1] || 2;
    const order = tracks.map((t, i) => ({ t, i, L: length(t) })).sort((a, b) => b.L - a.L);
    const groups = [];
    const near = (q, sp) => {   // nearest point of spine sp to q, with the spine's direction there
      let bj = 0, bd = Infinity;
      for (let j = 0; j < sp.length; j++) { const d = (sp[j].x - q.x) ** 2 + (sp[j].y - q.y) ** 2; if (d < bd) { bd = d; bj = j; } }
      const a = sp[Math.max(0, bj - 2)], b = sp[Math.min(sp.length - 1, bj + 2)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { d: Math.sqrt(bd), j: bj, tx: (b.x - a.x) / l, ty: (b.y - a.y) / l, w: sp[bj].w };
    };
    const med = (arr) => { const b = arr.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
    for (const { t, L } of order) {
      let home = null;
      for (const g of groups) {
        const sp = g.spine, ds = [], cs = [], wsp = [];
        for (let k = 0; k < t.length; k += 2) {
          const q = t[k], nq = near(q, sp);
          const a = t[Math.max(0, k - 2)], b = t[Math.min(t.length - 1, k + 2)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          ds.push(nq.d); cs.push(Math.abs(((b.x - a.x) * nq.tx + (b.y - a.y) * nq.ty) / l)); wsp.push(nq.w);
        }
        const dMed = med(ds), cMed = med(cs), wMed = med(wsp);
        const fringe = L <= Math.max(6, 4 * medW) && dMed <= wMed * 0.6 + 1.5;
        const streak = dMed <= Math.max(2.5, (o.streakReach ?? 1.6) * medW) && cMed >= 0.75;
        if (fringe || streak) { home = g; break; }
      }
      if (home) home.extras.push(t); else groups.push({ spine: t, extras: [] });
    }
    // within a group, extras follow the spine: oriented with it, in order along it
    for (const g of groups) {
      const sp = g.spine;
      g.extras = g.extras.map((t) => {
        const m = t[t.length >> 1], nq = near(m, sp);
        const dx = t[t.length - 1].x - t[0].x, dy = t[t.length - 1].y - t[0].y;
        const tt = (dx * nq.tx + dy * nq.ty) < 0 ? t.slice().reverse() : t;
        return { t: tt, at: near(tt[0], sp).j };
      }).sort((a, b) => a.at - b.at).map((e) => e.t);
    }
    return groups;
  }

  // Flow order for whole movements: start at the end nearest the top-left
  // corner, then always take the movement — either way round — whose start
  // is nearest to where the last one ended, preferring not to jump back up.
  function orderFlowBoth(strokes) {
    if (!strokes.length) return [];
    const box = bboxOf(strokes), scale = Math.max(box.w, box.h) || 1;
    const rest = strokes.slice(), out = [];
    let bi = 0, bRev = false, bk = Infinity;
    rest.forEach((s, i) => { for (const rev of [false, true]) { const a = rev ? s[s.length - 1] : s[0]; const k = (a.y - box.y) + 0.45 * (a.x - box.x); if (k < bk) { bk = k; bi = i; bRev = rev; } } });
    let first = rest.splice(bi, 1)[0]; out.push(bRev ? first.slice().reverse() : first);
    while (rest.length) {
      const end = out[out.length - 1][out[out.length - 1].length - 1];
      let ci = 0, cRev = false, cc = Infinity;
      rest.forEach((s, i) => { for (const rev of [false, true]) { const a = rev ? s[s.length - 1] : s[0]; const d = Math.hypot(a.x - end.x, a.y - end.y) / scale, up = Math.max(0, (end.y - a.y) / scale); const c = d + 0.6 * up; if (c < cc) { cc = c; ci = i; cRev = rev; } } });
      const s = rest.splice(ci, 1)[0]; out.push(cRev ? s.slice().reverse() : s);
    }
    return out;
  }

  // One character's strokes from its ink bitmap, cut and ordered by the
  // template when it fits (see above), by geometry and flow when it does not.
  // Returns { strokes, tIndex (template stroke per stroke, -1 for extras),
  // method, quality, fid, medianWidth }.
  function parseChar(bm, medians, o = {}) {
    const sk = thin(bm), dist = distanceTransform(bm);
    let chains = strokes(sk, dist, { ...o, bitmap: bm }).map((s) => s.map((q) => ({ x: q.x + 0.5, y: q.y + 0.5, w: Math.max(1, q.w) })));
    chains = chains.map((s) => (s.length > 2 ? resample(smooth(s, 1), 1) : s));
    const ws = chains.flat().map((q) => q.w).sort((a, b) => a - b);
    const medW = ws.length ? ws[ws.length >> 1] : 2;
    let out = null, method = 'none', quality = null, tIndex = null, fit = null;
    // cursive is written in continuous movements: cutting one by the template
    // and replaying the pieces in template order would make the brush jump
    // about. Keep every movement whole; the template only says which end it
    // starts from and which movement comes first (order()), or the flow of
    // the hand does when the template does not fit.
    if (o.cursive && chains.length) {
      const tracks = joinTracks(chains).map((s) => resample(s, 1));
      // fringe pieces and parallel dry streaks go with the track they run along;
      // tracks broken by a dry brush are strung back into one movement
      const groups = groupAlongside(tracks, o);
      const links = linkMovements(groups.map((g) => g.spine), { ...o, indices: true });
      // each movement as its pieces, in order and oriented, and as one line for ordering
      const moves = links.map((seq) => {
        const pieces = [];
        for (const { i, rev } of seq) {
          const g = groups[i];
          const parts = [g.spine, ...g.extras];
          if (rev) parts.reverse();
          for (const p of parts) pieces.push(rev ? p.slice().reverse() : p);
        }
        return pieces;
      });
      const lines = moves.map((m) => m.flat());
      // the template orders and orients the movements when it fits, the flow of the hand when it does not
      const ord = order(lines, medians, {});
      let seq;
      if (ord.method === 'template') { seq = ord.strokes; method = 'movements · template'; }
      else { seq = orderFlowBoth(lines); method = 'movements · flow'; }
      out = []; tIndex = [];
      const sp = Math.max(1.2, medW * 0.35);
      seq.forEach((line, k) => {
        const mi = lines.findIndex((l) => l[0] === line[0] || l[0] === line[line.length - 1]);
        const m = mi >= 0 ? moves[mi] : [line];
        const rev = mi >= 0 && lines[mi][0] !== line[0];
        const pieces = rev ? m.slice().reverse().map((p) => p.slice().reverse()) : m;
        for (const p of pieces) { out.push(p.length > 2 ? resample(p, sp) : p); tIndex.push(-2 - k); }
      });
    }
    if (!out && medians && medians.length && chains.length && !o.noTemplate) {
      fit = byTemplate(chains, medians, { ...o, bitmap: bm });
      if (fit) quality = fit.quality;
      if (fit && fit.accept) { out = fit.strokes; tIndex = fit.tIndex; method = 'template'; }
    }
    if (!out) {
      const ord = order(chains.map((s) => resample(s, Math.max(1.2, medW * 0.35))), medians, { flow: o.flow });
      out = ord.strokes; method = ord.method; tIndex = out.map(() => -1);
    }
    out = out.map((s) => (s.length > 2 ? resample(tidy(resample(s, 1)), Math.max(1.2, medW * 0.35)) : s));
    if (o.refine !== false) {
      out = refine(out, bm, o);
      if (o.patch !== false) ({ strokes: out, tIndex } = patchMissed(out, tIndex, bm, medW, o));
    }
    return { strokes: out, tIndex, method, quality, medianWidth: medW, fid: fidelity(out, bm), fit: o.debug ? fit : undefined };
  }

  // ---- all together ---------------------------------------------------------------
  // bm: ink bitmap (padded by a pixel or two). Returns the strokes as arrays
  // of {x, y, w} in bitmap pixels, not yet ordered — plus the skeleton, the
  // distance transform and the median width, for the demo.
  // o.minLen: drop strokes shorter than this many pixels (default: 0.6 × median width).
  function extractRaw(bm, o = {}) {
    const sk = thin(bm);
    const dist = distanceTransform(bm);
    const stats = {};
    let st = strokes(sk, dist, { ...o, bitmap: bm, stats });
    // widths: the distance transform is 0 at the outline, so a skeleton pixel
    // that sits on the outline (1-px strokes) still gets ~1 px
    st = st.map((s) => s.map((q) => ({ x: q.x + 0.5, y: q.y + 0.5, w: Math.max(1, q.w) })));
    const ws = st.flat().map((q) => q.w).sort((a, b) => a - b);
    const medW = ws.length ? ws[ws.length >> 1] : 2;
    // (the coverage selection already decides what is worth a stroke; the
    // length filter is only for the older method)
    if ((o.method || 'cover') === 'pair') {
      const minLen = o.minLen ?? medW * 0.6;
      st = st.filter((s) => length(s) >= minLen || s.length > 1 && s.some((q) => q.w > medW * 1.4));
    }
    const spacing = o.spacing ?? Math.max(1.2, medW * 0.35);
    st = st.map((s) => resample(smooth(s, 2), spacing));
    if (o.refine !== false) st = refine(st, bm, o);
    const fid = fidelity(st, bm);
    return { strokes: st, skeleton: sk, dist, medianWidth: medW, cover: coverage(st, bm), fid, stats };
  }
  // One character: extract, then order and orient (o.medians: the template).
  function extract(bm, o = {}) {
    const raw = extractRaw(bm, o);
    const box = bboxOf(raw.strokes);
    const ord = order(raw.strokes, o.medians, { box });
    return { strokes: ord.strokes, order: ord, box, skeleton: raw.skeleton, dist: raw.dist, medianWidth: raw.medianWidth };
  }

  return { thin, distanceTransform, graph, strokes, coverage, hits, fidelity, refine, territory, simplify, parseChar, byTemplate, tidy, joinTracks, linkMovements, groupAlongside, orderFlowBoth, extract, extractRaw, order, orderByTemplate, orderHeuristic, orderFlow, orient, bboxOf, smooth, resample, length };
});
