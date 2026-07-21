/**
 * SELAH — SHOPPING LISTS, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * The estimate comes from the price book; an unknown item is NOT priced (never
 * invented); and the done total is what was actually paid.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const S = require('./shopping');

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); pass++; } catch (e) { fail++; console.error(`  \x1b[31m✗ ${n}\x1b[0m\n      ${e.message}`); } };

const BOOK = { sugar: { unitPrice: 1000, unit: 'Kg' }, rice: { unitPrice: 4000, unit: 'Kg' } };

t('🔑 an item with a known price is ESTIMATED: 2 Kg sugar → 2,000', () => {
  const r = S.planList([{ id: 'i1', label: 'Sugar', quantity: 2, status: 'pending' }], BOOK);
  const sugar = r.rows[0];
  assert.strictEqual(sugar.estimate, 2000);
  assert.strictEqual(sugar.unit, 'Kg');
  assert.strictEqual(sugar.hasPrice, true);
});

t('🔴 an item with NO known price is NOT estimated — never invented', () => {
  const r = S.planList([{ id: 'i1', label: 'Toothpaste', quantity: 1, status: 'pending' }], BOOK);
  assert.strictEqual(r.rows[0].estimate, null);
  assert.strictEqual(r.rows[0].hasPrice, false);
  assert.strictEqual(r.unpricedCount, 1);
  assert.ok(/no price yet/.test(r.note));
});

t('the estimated total sums only the items we can actually price', () => {
  const r = S.planList([
    { id: 'i1', label: 'Sugar', quantity: 2, status: 'pending' },   // 2000
    { id: 'i2', label: 'Rice', quantity: 5, status: 'pending' },    // 20000
    { id: 'i3', label: 'Soap', quantity: 1, status: 'pending' },    // unknown
  ], BOOK);
  assert.strictEqual(r.estimatedTotal, 22000);
  assert.strictEqual(r.unpricedCount, 1);
  assert.deepStrictEqual(r.unpriced, ['Soap']);
});

t('🔑 a DONE item captures the actual, and it counts as spent — not the estimate', () => {
  const r = S.planList([
    { id: 'i1', label: 'Sugar', quantity: 2, status: 'done', actualAmount: 2400 },  // paid more than 2000
    { id: 'i2', label: 'Rice', quantity: 5, status: 'pending' },
  ], BOOK);
  assert.strictEqual(r.spentSoFar, 2400);
  assert.strictEqual(r.counts.done, 1);
  assert.strictEqual(r.counts.pending, 1);
  assert.strictEqual(r.remainingEstimate, 20000);   // only the pending rice
});

t('the variance shows how the real shop compared to the guess', () => {
  const r = S.planList([
    { id: 'i1', label: 'Sugar', quantity: 2, status: 'done', actualAmount: 2400 },  // est 2000, paid 2400
  ], BOOK);
  assert.strictEqual(r.variance, 400);              // 2400 − 2000
});

t('quantity defaults to 1 when omitted', () => {
  const r = S.planList([{ id: 'i1', label: 'Rice', status: 'pending' }], BOOK);
  assert.strictEqual(r.rows[0].quantity, 1);
  assert.strictEqual(r.rows[0].estimate, 4000);
});

t('a case/spacing-different label still matches the price book', () => {
  const r = S.planList([{ id: 'i1', label: '  SUGAR ', quantity: 3, status: 'pending' }], BOOK);
  assert.strictEqual(r.rows[0].estimate, 3000);
});

t('an empty list is an honest empty summary, not a crash', () => {
  const r = S.planList([], BOOK);
  assert.strictEqual(r.estimatedTotal, 0);
  assert.strictEqual(r.counts.total, 0);
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} SHOPPING TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} SHOPPING TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
