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

// ═══════════════════════════════════════════════════════════════════════════
// FORECAST — recurring items that are due now
// ═══════════════════════════════════════════════════════════════════════════

// helper: n purchases every `gap` days, ending `endDaysAgo` before 2026-07-15
const buysEvery = (n, gap, endDaysAgo, qty) => {
  const end = Date.parse('2026-07-15T00:00:00Z') - endDaysAgo * 86400000;
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push({ asOf: new Date(end - i * gap * 86400000).toISOString().slice(0, 10), quantity: qty });
  return out;
};
const FASOF = { asOf: '2026-07-15' };

t('🔑 a regular buy that is due is forecast, with its cadence and quantity', () => {
  // bought 5 times, every 12 days, last 13 days ago → overdue
  const h = [{ key: 'sugar', label: 'Sugar', unit: 'Kg', unitPrice: 1000, purchases: buysEvery(5, 12, 13, 2) }];
  const f = S.forecastDue(h, FASOF);
  assert.strictEqual(f.items.length, 1);
  assert.strictEqual(f.items[0].label, 'Sugar');
  assert.strictEqual(f.items[0].cadenceDays, 12);
  assert.strictEqual(f.items[0].quantity, 2);
  assert.strictEqual(f.items[0].estimate, 2000);        // 2 Kg × 1000
  assert.ok(/Bought 5 times/.test(f.items[0].says));
});

t('🔴 an item bought only twice is NOT a pattern — never forecast', () => {
  const h = [{ key: 'gas', label: 'Gas', unitPrice: 90000, purchases: buysEvery(2, 30, 40, 1) }];
  assert.strictEqual(S.forecastDue(h, FASOF).items.length, 0);
});

t('🔑 a regular buy that is NOT due yet is left off', () => {
  // every 30 days, last bought 3 days ago → nowhere near due
  const h = [{ key: 'rice', label: 'Rice', unitPrice: 4000, purchases: buysEvery(4, 30, 3, 5) }];
  assert.strictEqual(S.forecastDue(h, FASOF).items.length, 0);
});

t('🔴 a due item with NO known price is still forecast, but its cost is blank', () => {
  const h = [{ key: 'soap', label: 'Soap', purchases: buysEvery(4, 10, 12, 1) }];   // no unitPrice
  const f = S.forecastDue(h, FASOF);
  assert.strictEqual(f.items.length, 1);
  assert.strictEqual(f.items[0].estimate, null);
  assert.strictEqual(f.unpricedCount, 1);
});

t('the estimated total sums only the items it could price', () => {
  const h = [
    { key: 'sugar', label: 'Sugar', unitPrice: 1000, purchases: buysEvery(4, 10, 12, 2) },  // due, 2000
    { key: 'soap',  label: 'Soap',  purchases: buysEvery(4, 10, 12, 1) },                    // due, no price
  ];
  const f = S.forecastDue(h, FASOF);
  assert.strictEqual(f.items.length, 2);
  assert.strictEqual(f.estimatedTotal, 2000);
});

t('most overdue is listed first', () => {
  const h = [
    { key: 'a', label: 'A', unitPrice: 100, purchases: buysEvery(4, 10, 11, 1) },   // 1 day over
    { key: 'b', label: 'B', unitPrice: 100, purchases: buysEvery(4, 10, 25, 1) },   // 15 days over
  ];
  const f = S.forecastDue(h, FASOF);
  assert.strictEqual(f.items[0].label, 'B');
});

t('no history at all is an honest empty forecast, not a crash', () => {
  const f = S.forecastDue([], FASOF);
  assert.strictEqual(f.items.length, 0);
  assert.ok(/Not enough history/.test(f.note));
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} SHOPPING TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} SHOPPING TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
