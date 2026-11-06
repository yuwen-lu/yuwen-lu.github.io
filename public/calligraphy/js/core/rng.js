// Seeded pseudo-random number generator (mulberry32) so every painting is
// reproducible from a seed, and "new variation" is just a new seed. The state
// is one 32-bit integer, which the gallery saves and restores to step back
// through a painting without replaying it from the start.
window.RNG = (() => {
  class Rng {
    constructor(seed) { this.seed = seed >>> 0; this.a = this.seed | 0; }
    next() {
      const a = this.a = (this.a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    f() { return this.next(); }
    get state() { return this.a; }
    set state(v) { this.a = v | 0; }
    range(a, b) { return a + (b - a) * this.next(); }
    int(a, b) { return Math.floor(this.range(a, b + 1)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
    sign() { return this.next() < 0.5 ? -1 : 1; }
    // approximately normal, mean 0, sd 1
    gauss() { let s = 0; for (let i = 0; i < 4; i++) s += this.next(); return (s - 2) * 1.732; }
    jitter(v, amt) { return v + (this.next() * 2 - 1) * amt; }
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
    fork() { return new Rng(Math.floor(this.next() * 4294967295)); }
  }
  return { Rng, randomSeed: () => Math.floor(Math.random() * 4294967295) };
})();
