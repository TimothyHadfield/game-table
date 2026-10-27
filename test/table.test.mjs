// Node tests for the pure helpers in table.js. Run: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// TABLE_JS lets a mutated copy be tested (to prove the tests can fail).
const here = dirname(fileURLToPath(import.meta.url));
await import(pathToFileURL(process.env.TABLE_JS || resolve(here, '../table.js')).href);
const T = globalThis.TABLE;

test('deck thickness tracks the count and caps', () => {
  assert.equal(T.deckThickness(0), 0);
  assert.equal(T.deckThickness(-3), 0);
  assert.equal(T.deckThickness(1), 1);
  assert.equal(T.deckThickness(52), 13);
  assert.equal(T.deckThickness(500), 14);
  let prev = 0;
  for (let n = 0; n <= 200; n++) { const t = T.deckThickness(n); assert.ok(t >= prev, `thickness drops at ${n}`); prev = t; }
  assert.ok(T.deckThickness(40) > T.deckThickness(10), 'a fuller deck looks thicker');
});

test('stack shadow has one edge line per px plus a drop shadow', () => {
  for (const n of [0, 1, 10, 52, 108]) {
    const s = T.stackShadow(n);
    assert.equal(s.layers, T.deckThickness(n));
    assert.equal(s.shadow.split(/,\s(?![^(]*\))/).length, s.layers + 1);
  }
});

test('fan fits 5..40 cards in a 393px phone (361px inside the gutters)', () => {
  for (const cardW of [44, 56, 64]) {
    let prevStep = Infinity;
    for (let n = 5; n <= 40; n++) {
      const L = T.fanLayout(n, { width: 361, cardW, spread: 0.55 });
      assert.equal(L.length, n);
      const step = L[1].x - L[0].x;
      assert.ok(L[0].x >= 0, `left edge off-screen n=${n}`);
      assert.ok(L[n - 1].x + cardW <= 361 + 0.05, `right edge off-screen n=${n} w=${cardW}`);
      assert.ok(step <= cardW * 0.55 + 0.01, 'never spread wider than asked');
      assert.ok(step <= prevStep + 0.01, `step grows at n=${n}`);
      assert.ok(step > 0, 'cards still step apart');
      prevStep = step;
    }
  }
  // few cards: not compressed, centred
  const L5 = T.fanLayout(5, { width: 361, cardW: 56, spread: 0.55 });
  assert.ok(Math.abs((L5[1].x - L5[0].x) - 56 * 0.55) < 0.02);
  assert.ok(Math.abs(L5[0].x - (361 - (L5[4].x + 56))) < 0.05, 'centred');
});

test('fan is a symmetric arc: ends rotate out and sit lower', () => {
  for (const n of [3, 8, 13, 26]) {
    const L = T.fanLayout(n, { width: 361, cardW: 56 });
    assert.equal(L[0].r, -L[n - 1].r);
    assert.ok(L[0].r < 0 && L[n - 1].r > 0);
    const mid = L[Math.floor((n - 1) / 2)];
    assert.ok(L[0].y > mid.y, 'ends lower than middle');
  }
  assert.deepEqual(T.fanLayout(0), []);
  assert.equal(T.fanLayout(1, { width: 361, cardW: 56 })[0].r, 0);
});

test('seeded jitter is stable and bounded', () => {
  for (let i = 0; i < 300; i++) {
    const a = T.jitter('discard', i), b = T.jitter('discard', i);
    assert.deepEqual(a, b, 'same seed+index gives the same jitter');
    assert.ok(Math.abs(a.r) <= 14 && Math.abs(a.x) <= 5 && Math.abs(a.y) <= 5);
  }
  assert.notDeepEqual(T.jitter('discard', 1), T.jitter('discard', 2));
  assert.notDeepEqual(T.jitter('p1', 1), T.jitter('p2', 1));
  const r = T.jitter('x', 3, { rot: 2, off: 1 });
  assert.ok(Math.abs(r.r) <= 2 && Math.abs(r.x) <= 1);
  // spread: rotations are not all the same sign
  const signs = new Set(Array.from({ length: 20 }, (_, i) => Math.sign(T.jitter('s', i).r)));
  assert.ok(signs.has(1) && signs.has(-1));
});

test('chip breakdown adds up', () => {
  assert.deepEqual(T.chipBreakdown(137), [{ v: 100, n: 1 }, { v: 25, n: 1 }, { v: 10, n: 1 }, { v: 1, n: 2 }]);
  assert.deepEqual(T.chipBreakdown(0), []);
  const r = T.rng(42);
  for (let k = 0; k < 200; k++) {
    const a = Math.floor(r() * 5000), b = T.chipBreakdown(a);
    assert.equal(b.reduce((s, x) => s + x.v * x.n, 0), a);
  }
  assert.deepEqual(T.chipBreakdown(30, [5, 10]), [{ v: 10, n: 3 }]);
});

test('seats sit left to right across the far side', () => {
  assert.deepEqual(T.seatPositions(1), [{ x: 50, y: 10 }]);
  for (let n = 1; n <= 9; n++) {
    const P = T.seatPositions(n);
    assert.equal(P.length, n);
    P.forEach((p, i) => {
      assert.ok(p.x > 0 && p.x < 100 && p.y > 0 && p.y <= 50);
      if (i) assert.ok(p.x > P[i - 1].x);
    });
  }
});

test('playing card faces', () => {
  const h = T.pc('10H');
  assert.match(h, /class="tbl-card tbl-pc red"/);
  assert.match(h, /data-card="10H"/);
  assert.match(T.pc('KS'), /court/);
  assert.doesNotMatch(T.pc('KS'), /red/);
  assert.match(T.pc('td'), /data-card="10D"/);
  assert.match(T.back({ pattern: 'sunburst' }), /tbl-back tbl-sunburst/);
  // number cards carry the real number of pips, the lower ones upside down
  for (let r = 2; r <= 10; r++) {
    const h = T.pc(r + 'S');
    assert.equal((h.match(/<b /g) || []).length, r, `pips on ${r}`);
    T.PIPXY[r].forEach(([x, y]) => assert.ok(x >= 25 && x <= 75 && y >= 15 && y <= 85));
  }
  assert.equal((T.pc('9H').match(/class="r"/g) || []).length, 4);
  assert.match(T.pc('QD'), /tbl-court/);
});

test('fan relayouts on the next frame, never inside the ResizeObserver callback (WebKit loop error)', () => {
  const fakeEl = (w) => {
    const props = {};
    return { nodeType: 1, clientWidth: w, offsetWidth: 56, offsetHeight: 78, innerHTML: '', children: [],
      style: { setProperty(k, v) { props[k] = v; }, props },
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      appendChild(c) { this.children.push(c); return c; }, addEventListener() {} };
  };
  let cb = null, frames = [];
  globalThis.ResizeObserver = class { constructor(f) { cb = f; } observe() {} disconnect() {} };
  globalThis.requestAnimationFrame = (f) => { frames.push(f); return frames.length; };
  try {
    const hand = fakeEl(200), cards = Array.from({ length: 7 }, () => fakeEl(56));
    const api = T.fan(hand, cards, {});
    const before = cards[6].style.props['--x'];
    hand.clientWidth = 361;            // hidden tab shown: the hand gets its real width
    cb([]); cb([]);                    // two notifications in one frame
    assert.equal(cards[6].style.props['--x'], before, 'no layout inside the observer callback');
    assert.equal(frames.length, 1, 'one deferred relayout per frame');
    frames.shift()();
    assert.notEqual(cards[6].style.props['--x'], before, 'the deferred relayout uses the new width');
    cb([]); api.disconnect(); const x = cards[6].style.props['--x']; hand.clientWidth = 200; frames.shift()();
    assert.equal(cards[6].style.props['--x'], x, 'no relayout after disconnect');
  } finally { delete globalThis.ResizeObserver; delete globalThis.requestAnimationFrame; }
});

test('motion is off with no document, and when FX says Animations off', () => {
  assert.equal(T.animOn(), false);
  globalThis.document = {};
  assert.equal(T.animOn(), true);
  globalThis.FX = { settings: { animations: false } };
  assert.equal(T.animOn(), false);
  globalThis.FX = { settings: { animations: true } };
  globalThis.matchMedia = () => ({ matches: true });
  assert.equal(T.animOn(), false, 'reduced motion wins');
  delete globalThis.document; delete globalThis.FX; delete globalThis.matchMedia;
});
