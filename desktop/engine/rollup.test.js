/**
 * SELAH — ROLLUPS AND BUDGET vs ACTUAL, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE TEST THAT MATTERS IS THE SCHOOL FEES ONE.
 *
 * Every budgeting app on earth would take a 1,200,000 termly school-fees budget and
 * show it as 400,000 a month. Every month the parent is on-budget. Every month the
 * app is reassuring. And then the term bill lands and the money is not there.
 *
 * Averaging a lump does not smooth the COST. It smooths the WARNING.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const R = require('./rollup');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error(`  \x1b[31m✗ ${name}\x1b[0m\n      ${e.message}`); }
};

const tx = (date, dir, amt, cat, extra) => ({
  occurredOn: date, direction: dir, actual: amt, expected: amt,
  category: cat, status: 'confirmed', accountId: 'a1', ...(extra || {}),
});

const JULY = [
  tx('2026-07-05', 'in',  2_100_000, 'salary'),
  tx('2026-07-07', 'out',   850_000, 'rent'),
  tx('2026-07-08', 'out',     5_000, 'transport'),
  tx('2026-07-08', 'out',     3_000, 'transport'),
  tx('2026-07-09', 'out',    20_000, 'food'),
  tx('2026-07-12', 'out',    10_000, 'airtime'),
  tx('2026-07-20', 'out',    60_000, 'family'),
];

// ═══ 1. DATED FACTS AGGREGATE OVER ANY WINDOW ══════════════════════════════

t('a month is a VIEW over dated transactions', () => {
  const a = R.actuals(JULY, '2026-07-01', '2026-07-31');
  assert.strictEqual(a.income, 2_100_000);
  assert.strictEqual(a.spend, 948_000);
  assert.strictEqual(a.net, 1_152_000);
  assert.strictEqual(a.count, 7);
});

t('a WEEK is the same facts, cut differently — nothing is re-entered', () => {
  const a = R.actuals(JULY, '2026-07-06', '2026-07-12');
  assert.strictEqual(a.spend, 888_000);        // rent, 2 bodas, food, airtime
  // The salary landed on the 5th — the SUNDAY BEFORE this week. It is not in it.
  // A period is a window on dated facts, and a fact one day outside it is outside it.
  assert.strictEqual(a.income, 0);
});

t('transport rolls up from many small rides', () => {
  const a = R.actuals(JULY, '2026-07-01', '2026-07-31');
  const tr = a.byCategory.find((c) => c.category === 'transport');
  assert.strictEqual(tr.out, 8_000);
  assert.strictEqual(tr.count, 2);
});

t('categories are ordered by size — the biggest leak first', () => {
  const a = R.actuals(JULY, '2026-07-01', '2026-07-31');
  assert.strictEqual(a.byCategory[0].category, 'salary');    // 2.1m
  assert.strictEqual(a.byCategory[1].category, 'rent');      // 850k
});

t('🔴 a DRAFT is in no period. It is not a fact.', () => {
  const withDraft = JULY.concat([{ occurredOn: '2026-07-15', direction: 'in', expected: 1_000_000, actual: null, status: 'expected', category: 'consultancy' }]);
  assert.strictEqual(R.actuals(withDraft, '2026-07-01', '2026-07-31').income, 2_100_000);
});

t('🔴 a TRANSFER is in no total. It moves money between your own pockets.', () => {
  const withTransfer = JULY.concat([tx('2026-07-15', 'transfer', 500_000, null)]);
  const a = R.actuals(withTransfer, '2026-07-01', '2026-07-31');
  assert.strictEqual(a.income, 2_100_000);
  assert.strictEqual(a.spend, 948_000);
});

t('🔴 an UNDATED entry is named, and counted in NOTHING — we do not assume today', () => {
  const withUndated = JULY.concat([{ direction: 'out', actual: 99_000, status: 'confirmed', label: 'Something', category: 'other' }]);
  const a = R.actuals(withUndated, '2026-07-01', '2026-07-31');
  assert.strictEqual(a.spend, 948_000, 'assuming a date would drop a June expense into July and no total would ever disagree');
  assert.strictEqual(a.undated.length, 1);
  assert.ok(/will not guess when they happened/.test(a.undatedWarning));
});

// ═══ 2. TRENDS — the same atoms, bucketed ══════════════════════════════════

t('a year of months', () => {
  const two = [tx('2026-07-05', 'in', 2_000_000, 'salary'), tx('2026-08-05', 'in', 2_000_000, 'salary'),
               tx('2026-08-09', 'out', 300_000, 'food')];
  const s = R.series(two, '2026-01-01', '2026-12-31', 'month');
  assert.strictEqual(s.buckets.length, 2);
  assert.strictEqual(s.buckets[0].label, 'Jul 2026');
  assert.strictEqual(s.buckets[1].net, 1_700_000);
});

t('weeks bucket from Monday', () => {
  const s = R.series(JULY, '2026-07-01', '2026-07-31', 'week');
  assert.ok(s.buckets.some((b) => b.key === '2026-07-06'));
});

t('quarters and years work on the same facts', () => {
  assert.strictEqual(R.series(JULY, '2026-01-01', '2026-12-31', 'quarter').buckets[0].label, 'Q3 2026');
  assert.strictEqual(R.series(JULY, '2026-01-01', '2026-12-31', 'year').buckets[0].label, '2026');
});

t('an unknown granularity is REFUSED', () => {
  const s = R.series(JULY, '2026-01-01', '2026-12-31', 'fortnight');
  assert.ok(s.refused);
  assert.ok(/not a period we know/.test(s.because));
});

// ═══ 3. 🔴 THE SCHOOL FEES TEST ════════════════════════════════════════════

const TERM2 = { category: 'school_fees', label: 'Term 2', amount: 1_200_000,
                startsOn: '2026-05-01', endsOn: '2026-08-31' };
const JULY_RENT = { category: 'rent', amount: 800_000, startsOn: '2026-07-01', endsOn: '2026-07-31' };
const JULY_FOOD = { category: 'food', amount: 400_000, startsOn: '2026-07-01', endsOn: '2026-07-31' };

t('🔴 a TERMLY budget is NOT sliced into a monthly view. It is EXCLUDED and NAMED.', () => {
  const r = R.budgetVsActual([TERM2, JULY_RENT, JULY_FOOD], JULY, '2026-07-01', '2026-07-31');

  assert.strictEqual(r.totalBudgeted, 1_200_000,
    'rent 800k + food 400k. The school fees budget straddles the month and must NOT contribute 400,000 to it.');

  assert.strictEqual(r.budgetsExcluded.length, 1);
  assert.strictEqual(r.budgetsExcluded[0].category, 'school_fees');
  assert.ok(/not one-third of a term each month/.test(r.whyExcluded),
    'pro-rating a lump is how a person is on-budget every month until the day the bill lands');
});

t('🔴 no BUDGET is ever divided — no ÷12, no ÷3, no averaging', () => {
  // This guard once flagged `Math.floor((m - 1) / 3)` — the arithmetic that works out
  // which QUARTER a date falls in. That is not dividing a budget; it is dividing a
  // month number. A guard that cries wolf at correct code gets switched off, and then
  // it is not a guard at all.
  //
  // So it now looks only at lines that actually touch a MONEY figure.
  const src = require('fs').readFileSync(require('path').join(__dirname, 'rollup.js'), 'utf8');
  const lines = src.split('\n')
    .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//') && !l.trim().startsWith('/*'))
    .filter((l) => /budget|amount|planned|UGX\(/i.test(l));

  const divided = lines.filter((l) => /\/\s*(12|4|3|2)\b/.test(l));
  assert.deepStrictEqual(divided, [],
    'a budget figure is being divided. Averaging a lump does not smooth the cost — it smooths the WARNING.');
});

t('...and when the window CONTAINS the term, the budget IS counted, in full', () => {
  const fees = [tx('2026-05-12', 'out', 1_150_000, 'school_fees')];
  const r = R.budgetVsActual([TERM2], fees, '2026-05-01', '2026-08-31');
  assert.strictEqual(r.totalBudgeted, 1_200_000);
  assert.strictEqual(r.totalSpent, 1_150_000);
  assert.strictEqual(r.budgetsExcluded.length, 0);
  assert.strictEqual(r.rows[0].over, false);
});

t('a quarter SUMS the three monthly budgets that exist — it does not multiply one by 3', () => {
  const budgets = ['07', '08', '09'].map((m) => ({
    category: 'rent', amount: 800_000,
    startsOn: `2026-${m}-01`, endsOn: `2026-${m}-${m === '09' ? '30' : '31'}`,
  }));
  const r = R.budgetVsActual(budgets, JULY, '2026-07-01', '2026-09-30');
  assert.strictEqual(r.totalBudgeted, 2_400_000);
  assert.ok(/Nothing was divided, averaged or spread/.test(r.howBudgetsWereCounted));
});

// ═══ 4. BUDGET vs ACTUAL — the variance ════════════════════════════════════

t('over budget is reported, and by how much', () => {
  const r = R.budgetVsActual([JULY_RENT], JULY, '2026-07-01', '2026-07-31');
  const rent = r.rows.find((x) => x.category === 'rent');
  assert.strictEqual(rent.budgeted, 800_000);
  assert.strictEqual(rent.spent, 850_000);
  assert.strictEqual(rent.over, true);
  assert.strictEqual(rent.overBy, 50_000);
  assert.strictEqual(rent.percentUsed, 106);
});

t('under budget is reported as headroom, not as failure', () => {
  const r = R.budgetVsActual([JULY_FOOD], JULY, '2026-07-01', '2026-07-31');
  const food = r.rows.find((x) => x.category === 'food');
  assert.strictEqual(food.variance, 380_000);
  assert.strictEqual(food.over, false);
});

t('🔑 SPENDING YOU NEVER PLANNED FOR is called out — usually the most interesting line', () => {
  const r = R.budgetVsActual([JULY_RENT, JULY_FOOD], JULY, '2026-07-01', '2026-07-31');
  const fam = r.rows.find((x) => x.category === 'family');
  assert.strictEqual(fam.budgeted, null);
  assert.strictEqual(fam.unplanned, true);
  assert.strictEqual(r.unplannedSpending, 8_000 + 10_000 + 60_000);   // transport, airtime, family
});

t('a category budgeted but not spent still appears — that is the point of a budget', () => {
  const medical = { category: 'medical', amount: 100_000, startsOn: '2026-07-01', endsOn: '2026-07-31' };
  const r = R.budgetVsActual([medical], JULY, '2026-07-01', '2026-07-31');
  const m = r.rows.find((x) => x.category === 'medical');
  assert.strictEqual(m.budgeted, 100_000);
  assert.strictEqual(m.spent, 0);
  assert.strictEqual(m.percentUsed, 0);
});

// ═══ 5. THE CATEGORIES ═════════════════════════════════════════════════════

t('the starter categories fit Ugandan life, not a Californian budgeting app', () => {
  const keys = R.DEFAULT_CATEGORIES.map((c) => c.key);
  for (const k of ['school_fees', 'transport', 'airtime', 'family', 'worship', 'utilities']) {
    assert.ok(keys.includes(k), `missing ${k}`);
  }
});

t('🔴 school fees is MARKED LUMPY, and says why', () => {
  const f = R.DEFAULT_CATEGORIES.find((c) => c.key === 'school_fees');
  assert.strictEqual(f.lumpy, true);
  assert.ok(/NOT one-third of a term each month/.test(f.note));
});

t('"savings" warns that moving money to your own account is a TRANSFER, not spending', () => {
  const s = R.DEFAULT_CATEGORIES.find((c) => c.key === 'savings');
  assert.ok(/TRANSFER, not spending/.test(s.note));
});

// ═══════════════════════════════════════════════════════════════════════════
console.log(fail
  ? `\n\x1b[31m✗ ${fail} ROLLUP TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} ROLLUP TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
