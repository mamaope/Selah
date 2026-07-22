/**
 * SELAH — SAVINGS & RESILIENCE, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * The runway is liquid money ÷ what a month costs. Rungs are earned only by money
 * that is actually liquid and actually there. Unknown month cost → unknown runway,
 * never a divide-by-zero boast.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const S = require('./savings');

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); pass++; } catch (e) { fail++; console.error(`  \x1b[31m✗ ${n}\x1b[0m\n      ${e.message}`); } };

// ── THE LADDER ───────────────────────────────────────────────────────────────

t('no cushion at zero months, and the next rung is one month away', () => {
  const r = S.resilience(0, 500_000);
  assert.strictEqual(r.level, 0);
  assert.strictEqual(r.key, 'none');
  assert.strictEqual(r.next.key, 'one');
  assert.strictEqual(r.next.needMore, 500_000);      // one month of outgoings
});

t('🔑 the rung is the highest one actually reached — 4 months = three-month rung', () => {
  const r = S.resilience(4, 500_000);
  assert.strictEqual(r.key, 'three');
  assert.strictEqual(r.level, 2);
  assert.strictEqual(r.next.key, 'six');
  assert.strictEqual(r.next.needMore, (6 - 4) * 500_000);   // 1,000,000 more to six months
});

t('the top of the ladder has no next rung', () => {
  const r = S.resilience(15, 500_000);
  assert.strictEqual(r.key, 'year');
  assert.strictEqual(r.level, r.maxLevel);
  assert.strictEqual(r.next, null);
});

t('the ladder marks reached rungs and the current one', () => {
  const r = S.resilience(3.5, 400_000);
  const three = r.ladder.find((x) => x.key === 'three');
  const six = r.ladder.find((x) => x.key === 'six');
  assert.strictEqual(three.reached, true);
  assert.strictEqual(three.current, true);
  assert.strictEqual(six.reached, false);
});

// ── THE OVERVIEW ─────────────────────────────────────────────────────────────

const BAL = [
  { name: 'MTN MoMo',    type: 'mobile_money',  side: 'asset', liquid: true,  computed: 1_500_000, currency: 'UGX' },
  { name: 'Stanbic',     type: 'bank',          side: 'asset', liquid: true,  computed: 2_500_000, currency: 'UGX' },
  { name: 'Fixed depo',  type: 'fixed_deposit', side: 'asset', liquid: false, computed: 4_000_000, currency: 'UGX' },
  { name: 'DFCU loan',   type: 'loan',          side: 'debt',                 computed: 3_000_000, currency: 'UGX' },
];

t('🔑 runway counts only LIQUID assets — 4,000,000 liquid ÷ 2,000,000 a month = 2 months', () => {
  const o = S.overview(BAL, 2_000_000);
  assert.strictEqual(o.liquid, 4_000_000);           // MoMo + bank, not the fixed deposit
  assert.strictEqual(o.runwayMonths, 2);
  assert.strictEqual(o.resilience.key, 'one');        // 2 months → past one, short of three
});

t('🔴 the fixed deposit is savings, but it is NOT in the runway', () => {
  const o = S.overview(BAL, 2_000_000);
  assert.strictEqual(o.longTerm, 4_000_000);
  assert.strictEqual(o.totalSaved, 8_000_000);        // liquid + long-term
  assert.ok(o.longTermAccounts.some((a) => a.name === 'Fixed depo'));
});

t('🔴 debt is never counted as savings', () => {
  const o = S.overview(BAL, 2_000_000);
  assert.ok(!o.liquidAccounts.some((a) => a.name === 'DFCU loan'));
  assert.ok(!o.longTermAccounts.some((a) => a.name === 'DFCU loan'));
});

t('🔴 with no month cost known, runway is unknown — not a divide-by-zero boast', () => {
  const o = S.overview(BAL, 0);
  assert.strictEqual(o.knowMonthly, false);
  assert.strictEqual(o.runwayMonths, null);
  assert.strictEqual(o.resilience, null);
  assert.ok(/Confirm a month of spending/.test(o.note));
  assert.strictEqual(o.liquid, 4_000_000);            // it still shows what you hold
});

t('an empty picture is honest, not a crash', () => {
  const o = S.overview([], 500_000);
  assert.strictEqual(o.totalSaved, 0);
  assert.strictEqual(o.runwayMonths, 0);
  assert.strictEqual(o.resilience.key, 'none');
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} SAVINGS TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} SAVINGS TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
