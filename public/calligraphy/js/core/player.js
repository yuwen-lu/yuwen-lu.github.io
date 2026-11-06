// StrokePlayer: plays a list of "ops" (generator-producing functions) a little
// at a time so a painting builds up stroke by stroke. Each generator yields
// after a small amount of brush travel; a yield is one "unit" of work.
//
// An op is { label, run: () => Generator, units, step?, group? }. Ops with
// step: false (dipping the brush, say) draw nothing worth stopping on: a
// step runs through them to the next real one. group (any value) ties ops
// together, e.g. the strokes of one character, for stepping a group at a time.
//
// The state between ops is just "how many ops are done" (idx, with no
// generator running), so stepping and seeking move between those
// boundaries; the gallery restores earlier boundaries from snapshots.
window.StrokePlayer = class StrokePlayer {
  constructor(opts = {}) {
    this.unitsPerSecond = opts.unitsPerSecond || 900;
    this.holdAtEnd = opts.holdAtEnd ?? 2200;   // ms to admire the finished painting before looping
    this.holdAtStart = opts.holdAtStart ?? 500;
    this.loop = opts.loop ?? true;
    this.speed = 1;
    this.playing = opts.playing ?? true;
    this.onRestart = opts.onRestart || (() => {});
    this.ops = [];
    this.reset();
  }
  reset() {
    this.idx = 0; this.gen = null; this.done = false; this.doneAt = 0; this.startedAt = performance.now();
    this.carry = 0; this.cursor = null; this.label = ''; this.unitsDone = 0;
  }
  load(ops) {
    this.ops = ops; this.reset();
    // cumulative estimated units at the start of every op, for seeking by time
    this.cum = new Float64Array(ops.length + 1);
    for (let i = 0; i < ops.length; i++) this.cum[i + 1] = this.cum[i] + (ops[i].units || 40);
    this.totalUnits = this.cum[ops.length];
  }
  get progress() {
    if (this.done) return 1;
    if (!this.totalUnits) return 0;
    // the op in progress counts by how far its generator got, roughly
    const base = this.cum[Math.min(this.idx, this.ops.length)];
    const inOp = this.gen ? Math.min((this.ops[this.idx].units || 40) * 0.95, this.unitsInOp) : 0;
    return Math.min(0.999, (base + inOp) / this.totalUnits);
  }
  // the op index at a fraction of the painting's time
  opAt(frac) {
    const target = frac * this.totalUnits;
    let lo = 0, hi = this.ops.length;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (this.cum[mid] <= target) lo = mid; else hi = mid - 1; }
    return Math.min(this.ops.length, lo);
  }
  play() { this.playing = true; }
  pause() { this.playing = false; }
  toggle() { this.playing = !this.playing; }
  // Advance by dt milliseconds worth of brushwork.
  advance(dt) {
    if (!this.playing) return;
    const now = performance.now();
    if (this.done) {
      if (this.loop && now - this.doneAt > this.holdAtEnd) this.onRestart();
      return;
    }
    if (now - this.startedAt < this.holdAtStart) return;
    let units = this.unitsPerSecond * this.speed * (dt / 1000) + this.carry;
    units = Math.min(units, 4000);
    while (units >= 1) {
      if (!this.stepOne()) break;
      units -= 1;
    }
    this.carry = units;
  }
  // Runs one unit; returns false when finished.
  stepOne() {
    while (true) {
      if (!this.gen) {
        if (this.idx >= this.ops.length) { this.finishUp(); return false; }
        const op = this.ops[this.idx];
        this.label = op.label || this.label;
        this.gen = op.run(); this.unitsInOp = 0;
      }
      const r = this.gen.next();
      if (r.done) { this.gen = null; this.idx++; if (this.idx >= this.ops.length) { this.finishUp(); return false; } continue; }
      if (r.value) this.cursor = r.value;
      this.unitsDone++; this.unitsInOp++;
      return true;
    }
  }
  finishUp() { if (!this.done) { this.done = true; this.doneAt = performance.now(); } this.cursor = null; this.gen = null; }
  // Run the op in progress, or the next one, to its end.
  runOp() {
    if (this.done) return false;
    if (!this.gen) {
      if (this.idx >= this.ops.length) { this.finishUp(); return false; }
      const op = this.ops[this.idx];
      this.label = op.label || this.label;
      this.gen = op.run(); this.unitsInOp = 0;
    }
    let r;
    while (!(r = this.gen.next()).done) { this.unitsDone++; if (r.value) this.cursor = r.value; }
    this.gen = null; this.idx++;
    if (this.idx >= this.ops.length) this.finishUp();
    return true;
  }
  isStep(i) { const op = this.ops[i]; return !!op && op.step !== false; }
  // One step forward: finish the op in progress if there is one, otherwise
  // run any non-step ops and then the next step op. Returns whether it moved.
  stepForward() {
    if (this.done) return false;
    if (this.gen) { this.runOp(); return true; }
    while (this.idx < this.ops.length && !this.isStep(this.idx)) this.runOp();
    if (this.idx >= this.ops.length) { this.finishUp(); return true; }
    this.runOp();
    return true;
  }
  // The op boundary one step back from here (the gallery restores it).
  prevStepBoundary() {
    let i = this.gen ? this.idx : this.idx - 1;      // the last op that is done (or in progress)
    while (i > 0 && !this.isStep(i)) i--;            // back over dips
    // land just before that step op, but after the dips that lead into it
    return Math.max(0, i);
  }
  // Draw everything remaining immediately.
  finish() { while (!this.done) { if (!this.runOp()) break; } this.cursor = null; }
  // Run ops until the given op index (used for seeking forward).
  runUntil(opIndex) {
    if (this.gen && this.idx < opIndex) this.runOp();
    while (!this.done && !this.gen && this.idx < opIndex) this.runOp();
  }
};
