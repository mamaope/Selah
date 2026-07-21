/**
 * SELAH — VALUE TRACKING, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * The founder's two examples, made into tests: a gas price creeping up, and a
 * salary growing. The history must survive, the change must be measured, and a
 * projection must never pretend to be a promise.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const V = require('./values');

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); pass++; } catch (e) { fail++; console.error(`  \x1b[31m✗ ${n}\x1b[0m\n      ${e.message}`); } };

// ═══ 1. 🔑 THE GAS PRICE, CREEPING UP ═══════════════════════════════════════
const GAS = [
  { amount: 100000, asOf: '2026-05-15' },
  { amount: 105000, asOf: '2026-06-15' },
  { amount: 108000, asOf: '2026-07-15' },
];

t('the latest value is the current one; the first is kept', () => {
  const r = V.track(GAS, { label: 'Gas' });
  assert.strictEqual(r.current.amount, 108000);
  assert.strictEqual(r.first.amount, 100000);
  assert.strictEqual(r.points, 3);
});

t('🔑 the change since last time is measured — the whole point', () => {
  const r = V.track(GAS);
  assert.strictEqual(r.sinceLast.abs, 3000);
  assert.strictEqual(r.sinceLast.pct, 2.9);          // (108-105)/105
  assert.strictEqual(r.direction, 'up');
});

t('the change across the whole history is measured too', () => {
  const r = V.track(GAS);
  assert.strictEqual(r.sinceStart.abs, 8000);
  assert.strictEqual(r.sinceStart.pct, 8);            // 100k → 108k
  assert.ok(r.sinceStart.months >= 1.9 && r.sinceStart.months <= 2.1);
});

t('a monthly GROWTH RATE is computed — how fast it is moving', () => {
  const r = V.track(GAS);
  assert.ok(r.monthlyGrowthPct > 3 && r.monthlyGrowthPct < 4);   // ~3.9%/month compounding
});

t('the one-line summary reads like a human wrote it', () => {
  const r = V.track(GAS, { label: 'Gas' });
  assert.ok(/Gas: 108,000/.test(r.says) && /▲/.test(r.says) && /since 2026-06-15/.test(r.says));
});

// ═══ 2. 🔑 THE SALARY, GROWING ══════════════════════════════════════════════
t('a salary that jumps 1,000,000 → 1,200,000 shows +20%', () => {
  const r = V.track([
    { amount: 1000000, asOf: '2026-06-01' },
    { amount: 1200000, asOf: '2026-07-01' },
  ], { label: 'Salary' });
  assert.strictEqual(r.sinceLast.pct, 20);
  assert.strictEqual(r.direction, 'up');
});

// ═══ 3. 🔴 A PROJECTION IS A GUESS, AND SAYS SO ════════════════════════════
t('with 3+ points, it projects next month — LABELLED a guess', () => {
  const r = V.track(GAS);
  assert.ok(r.projection.nextMonth > 108000);
  assert.ok(/trend continues/i.test(r.projection.thisIsAGuess));
  assert.ok(/not a fact, and not money/i.test(r.projection.thisIsAGuess));
});

t('🔴 with only 2 points it REFUSES to project — a line through a coincidence', () => {
  const r = V.track([
    { amount: 100000, asOf: '2026-06-01' },
    { amount: 105000, asOf: '2026-07-01' },
  ]);
  assert.strictEqual(r.projection.nextMonth, null);
  assert.ok(/guess wearing a suit/.test(r.projection.whyNot));
});

// ═══ 4. FALLING VALUES, AND EDGE CASES ═════════════════════════════════════
t('a falling value reads as down, with a negative change', () => {
  const r = V.track([
    { amount: 200000, asOf: '2026-05-01' },
    { amount: 180000, asOf: '2026-06-01' },
  ], { label: 'Rent' });
  assert.strictEqual(r.direction, 'down');
  assert.strictEqual(r.sinceLast.pct, -10);
});

t('🔴 a first value of ZERO does not divide-by-zero — abs only, pct is null', () => {
  const r = V.track([
    { amount: 0, asOf: '2026-05-01' },
    { amount: 50000, asOf: '2026-06-01' },
  ]);
  assert.strictEqual(r.sinceLast.abs, 50000);
  assert.strictEqual(r.sinceLast.pct, null);
});

t('one point: current only, and it says there is nothing to compare yet', () => {
  const r = V.track([{ amount: 100000, asOf: '2026-07-01' }], { label: 'Gas' });
  assert.strictEqual(r.current.amount, 100000);
  assert.strictEqual(r.sinceLast, null);
  assert.strictEqual(r.direction, 'first');
  assert.ok(/nothing to compare yet/.test(r.says));
});

t('no points: an honest empty state, not a crash', () => {
  const r = V.track([]);
  assert.strictEqual(r.current, null);
  assert.ok(/Nothing recorded yet/.test(r.note));
});

t('points recorded out of order are sorted by date before anything is computed', () => {
  const r = V.track([
    { amount: 108000, asOf: '2026-07-15' },
    { amount: 100000, asOf: '2026-05-15' },
    { amount: 105000, asOf: '2026-06-15' },
  ]);
  assert.strictEqual(r.first.amount, 100000);
  assert.strictEqual(r.current.amount, 108000);
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} VALUE TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} VALUE TRACKING TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
