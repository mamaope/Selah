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
  { name: 'MTN MoMo',    type: 'mobile_money',   side: 'asset', liquid: true,  computed: 1_500_000, currency: 'UGX' },  // spending money
  { name: 'Stanbic',     type: 'bank',           side: 'asset', liquid: true,  computed: 2_500_000, currency: 'UGX' },  // current account
  { name: 'My cushion',  type: 'emergency_fund', side: 'asset', liquid: true,  computed: 4_000_000, currency: 'UGX' },  // THE emergency fund
  { name: 'Unity SACCO', type: 'sacco',          side: 'asset', liquid: true,  computed: 3_000_000, currency: 'UGX' },  // other liquid savings
  { name: 'Fixed depo',  type: 'fixed_deposit',  side: 'asset', liquid: false, computed: 5_000_000, currency: 'UGX' },  // long-term
  { name: 'DFCU loan',   type: 'loan',           side: 'debt',                 computed: 3_000_000, currency: 'UGX' },  // debt
];

t('🔑 THE RUNWAY IS THE EMERGENCY-FUND ACCOUNT ÷ a month — 4,000,000 ÷ 2,000,000 = 2 months', () => {
  const o = S.overview(BAL, 2_000_000);
  assert.strictEqual(o.emergencyFund, 4_000_000);      // only the emergency-fund account
  assert.strictEqual(o.hasEmergencyFund, true);
  assert.strictEqual(o.runwayMonths, 2);
  assert.strictEqual(o.resilience.key, 'one');
});

t('🔑 THE SACCO IS SAVINGS, BUT NOT THE EMERGENCY FUND — it is shown separately, off the runway', () => {
  const o = S.overview(BAL, 2_000_000);
  assert.strictEqual(o.otherLiquidTotal, 3_000_000);   // the SACCO
  assert.ok(o.otherLiquid.some((a) => a.name === 'Unity SACCO'));
  assert.strictEqual(o.runwayMonths, 2);                // adding the SACCO does NOT change the runway
});

t('🔴 cash, mobile money and a current account are not savings at all', () => {
  const o = S.overview(BAL, 2_000_000);
  const named = [...o.emergencyAccounts, ...o.otherLiquid, ...o.longTermAccounts].map((a) => a.name);
  assert.ok(!named.includes('MTN MoMo'));
  assert.ok(!named.includes('Stanbic'));
  assert.strictEqual(o.totalSaved, 12_000_000);         // EF 4M + SACCO 3M + FD 5M; the 4M of float is excluded
});

t('🔴 the fixed deposit is long-term savings, not the runway', () => {
  const o = S.overview(BAL, 2_000_000);
  assert.strictEqual(o.longTerm, 5_000_000);
  assert.ok(o.longTermAccounts.some((a) => a.name === 'Fixed depo'));
});

t('🔴 debt is never counted as savings', () => {
  const o = S.overview(BAL, 2_000_000);
  const named = [...o.emergencyAccounts, ...o.otherLiquid, ...o.longTermAccounts].map((a) => a.name);
  assert.ok(!named.includes('DFCU loan'));
});

t('🔑 NO EMERGENCY-FUND ACCOUNT → runway is zero and it says to open one', () => {
  const noEF = BAL.filter((b) => b.type !== 'emergency_fund');
  const o = S.overview(noEF, 2_000_000);
  assert.strictEqual(o.hasEmergencyFund, false);
  assert.strictEqual(o.emergencyFund, 0);
  assert.strictEqual(o.runwayMonths, 0);
  assert.ok(/its own account/.test(o.note));
  assert.strictEqual(o.otherLiquidTotal, 3_000_000);    // the SACCO is still shown as savings
});

t('🔴 with no month cost known, runway is unknown — not a divide-by-zero boast', () => {
  const o = S.overview(BAL, 0);
  assert.strictEqual(o.knowMonthly, false);
  assert.strictEqual(o.runwayMonths, null);
  assert.strictEqual(o.resilience, null);
  assert.strictEqual(o.emergencyFund, 4_000_000);       // it still shows the fund you hold
});

t('an empty picture is honest, not a crash', () => {
  const o = S.overview([], 500_000);
  assert.strictEqual(o.totalSaved, 0);
  assert.strictEqual(o.emergencyFund, 0);
  assert.strictEqual(o.hasEmergencyFund, false);
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} SAVINGS TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} SAVINGS TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
