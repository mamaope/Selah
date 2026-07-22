/**
 * SELAH — SAVINGS GOALS, EXECUTED
 * The required monthly is remaining ÷ months left. A projection needs a real pace.
 * An overdue goal is named, not quietly stretched.
 */
const assert = require('assert');
const G = require('./goals');

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); pass++; } catch (e) { fail++; console.error(`  \x1b[31m✗ ${n}\x1b[0m\n      ${e.message}`); } };

t('🔑 required monthly = remaining ÷ months left', () => {
  // 1,200,000 target, 200,000 saved, 5 months out → 1,000,000 / 5 = 200,000 a month
  const r = G.assess({ name: 'Laptop', target: 1_200_000, saved: 200_000, targetDate: '2026-12-21' }, { asOf: '2026-07-22' });
  assert.strictEqual(r.remaining, 1_000_000);
  assert.strictEqual(r.monthsLeft, 5);
  assert.strictEqual(r.requiredMonthly, 200_000);
  assert.strictEqual(r.pct, 17);
  assert.strictEqual(r.reached, false);
});

t('🔑 a reached goal says so and asks for nothing more', () => {
  const r = G.assess({ name: 'Trip', target: 500_000, saved: 500_000, targetDate: '2026-12-01' }, { asOf: '2026-07-22' });
  assert.strictEqual(r.reached, true);
  assert.strictEqual(r.remaining, 0);
  assert.strictEqual(r.requiredMonthly, null);
  assert.ok(/Reached/.test(r.says));
});

t('🔑 a projection needs a REAL pace — with one, it dates the finish', () => {
  const r = G.assess({ name: 'Land', target: 10_000_000, saved: 1_000_000, monthlyContribution: 1_000_000 }, { asOf: '2026-07-22' });
  assert.strictEqual(r.monthsAtPace, 9);                 // 9,000,000 / 1,000,000
  assert.ok(/^2027-/.test(r.projectedFinish));
});

t('🔴 no pace set → no projection is invented', () => {
  const r = G.assess({ name: 'Land', target: 10_000_000, saved: 1_000_000, targetDate: '2027-07-01' }, { asOf: '2026-07-22' });
  assert.strictEqual(r.projectedFinish, null);
  assert.strictEqual(r.monthsAtPace, null);
});

t('🔴 an overdue goal is NAMED, not quietly stretched', () => {
  const r = G.assess({ name: 'Fees', target: 1_000_000, saved: 400_000, targetDate: '2026-06-01' }, { asOf: '2026-07-22' });
  assert.strictEqual(r.overdue, true);
  assert.strictEqual(r.requiredMonthly, null);
  assert.ok(/date has passed/.test(r.says));
});

t('on track when your pace meets the required monthly', () => {
  const r = G.assess({ name: 'Car', target: 6_000_000, saved: 0, targetDate: '2027-01-22', monthlyContribution: 1_000_000 }, { asOf: '2026-07-22' });
  assert.strictEqual(r.requiredMonthly, 1_000_000);      // 6,000,000 / 6 months
  assert.strictEqual(r.onTrack, true);
});

t('behind when your pace is short of the required monthly', () => {
  const r = G.assess({ name: 'Car', target: 6_000_000, saved: 0, targetDate: '2027-01-22', monthlyContribution: 500_000 }, { asOf: '2026-07-22' });
  assert.strictEqual(r.onTrack, false);
});

t('🔴 no date → no required-monthly, and it says to add one', () => {
  const r = G.assess({ name: 'Rainy day', target: 2_000_000, saved: 500_000 }, { asOf: '2026-07-22' });
  assert.strictEqual(r.requiredMonthly, null);
  assert.strictEqual(r.monthsLeft, null);
  assert.ok(/Add a date/.test(r.says));
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} GOALS TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} GOALS TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
