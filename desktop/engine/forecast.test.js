/**
 * SELAH — FORECASTING, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 THE GAS CYLINDER TEST. The founder's own words:
 *
 *     "I want to see when the next time I will refill gas is, based on my history."
 *
 * Not "gas: 22,000 a month" — a figure true of no month that has ever existed —
 * but "you refill every 50 days; the next one is due around 24 July."
 *
 * FORECAST WHEN. Then how much.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const F = require('./forecast');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error(`  \x1b[31m✗ ${name}\x1b[0m\n      ${e.message}`); }
};

const buy = (date, amount, label, category) => ({
  occurredOn: date, direction: 'out', actual: amount, expected: amount,
  label, category, status: 'confirmed', accountId: 'a1',
});

// ═══ 1. 🔑 THE GAS CYLINDER ════════════════════════════════════════════════

const GAS = [
  buy('2026-02-14',  88_000, 'Gas',  'utilities'),
  buy('2026-04-05',  90_000, 'gas',  'utilities'),   // 50 days — and note the case
  buy('2026-05-26',  92_000, 'Gas ', 'utilities'),   // 51 days — and the stray space
];

t('🔑 "when do I next refill gas?" — answered from three refills', () => {
  const r = F.recurringItems(GAS, '2026-07-12');
  const gas = r.items.find((i) => /gas/i.test(i.label));
  assert.ok(gas, 'the pattern was not found at all');
  assert.strictEqual(gas.seen, 3);
  assert.strictEqual(gas.everyDays, 51);              // median of 50 and 51
  assert.strictEqual(gas.lastOn, '2026-05-26');
  assert.strictEqual(gas.nextDue, '2026-07-16');      // 26 May + 51 days
  assert.strictEqual(gas.typicalAmount, 90_000);
});

t('...and "Gas", "gas" and "Gas " are the SAME thing', () => {
  const r = F.recurringItems(GAS, '2026-07-12');
  assert.strictEqual(r.items.filter((i) => /gas/i.test(i.label)).length, 1,
    'three spellings of one purchase must not become three separate patterns');
});

t('...and if it is late, it SAYS it is late', () => {
  const r = F.recurringItems(GAS, '2026-08-01');
  const gas = r.items.find((i) => /gas/i.test(i.label));
  assert.strictEqual(gas.overdue, true);
  assert.strictEqual(gas.overdueByDays, 16);
});

t('a steady purchase is described as steady', () => {
  const r = F.recurringItems(GAS, '2026-07-12');
  const gas = r.items.find((i) => /gas/i.test(i.label));
  assert.strictEqual(gas.regular, true);
  assert.strictEqual(gas.rangeDays, null);
  assert.ok(/about every 51 days/.test(gas.says));
});

t('🔴 an ERRATIC purchase gets a RANGE, not a false precise date', () => {
  const erratic = [
    buy('2026-01-05', 50_000, 'Car service', 'transport'),
    buy('2026-02-20', 50_000, 'Car service', 'transport'),   // 46 days
    buy('2026-06-01', 50_000, 'Car service', 'transport'),   // 101 days
    buy('2026-06-20', 50_000, 'Car service', 'transport'),   // 19 days
  ];
  const item = F.recurringItems(erratic, '2026-07-12').items[0];
  assert.strictEqual(item.regular, false);
  assert.deepStrictEqual(item.rangeDays, [19, 101]);
  assert.ok(/not a steady pattern/.test(item.says));
  assert.ok(/do not plan tightly/.test(item.says),
    'a single number implies a confidence we do not have, and people plan on single numbers');
});

t('🔴 TWO observations is not a pattern — we forecast NOTHING and say why', () => {
  const thin = [buy('2026-03-01', 40_000, 'Water filter', 'other'),
                buy('2026-05-01', 40_000, 'Water filter', 'other')];
  const r = F.recurringItems(thin, '2026-07-12');
  assert.strictEqual(r.items.length, 0);
  assert.strictEqual(r.notEnoughHistory.length, 1);
  assert.ok(/guess wearing a suit/.test(r.notEnoughHistory[0].why));
});

t('🔴 every forecast says what it CANNOT see', () => {
  const r = F.recurringItems(GAS, '2026-07-12');
  const cannot = r.whatThisCannotSee.join(' ');
  assert.ok(/funeral/.test(cannot) && /school term/.test(cannot) && /price rise/.test(cannot),
    'the things that wreck a Ugandan budget are exactly the things history cannot predict');
});

t('items are ordered by what is due SOONEST', () => {
  const many = GAS.concat([
    buy('2026-01-10', 30_000, 'Haircut', 'other'),
    buy('2026-02-10', 30_000, 'Haircut', 'other'),
    buy('2026-03-12', 30_000, 'Haircut', 'other'),
  ]);
  const r = F.recurringItems(many, '2026-07-12');
  assert.ok(r.items[0].nextDue <= r.items[1].nextDue);
});

// ═══ 2. 🔴 THE SUGGESTED BUDGET — AND THE SCHOOL FEES ══════════════════════

const SIX_MONTHS = [
  // steady, every month
  ...['01', '02', '03', '04', '05', '06'].map((m) => buy(`2026-${m}-03`, 800_000, 'Rent', 'rent')),
  ...['01', '02', '03', '04', '05', '06'].map((m) => buy(`2026-${m}-15`, 350_000, 'Shopping', 'food')),
  // 🔴 A LUMP. Two terms in six months.
  buy('2026-02-05', 1_200_000, 'School fees term 1', 'school_fees'),
  buy('2026-05-12', 1_200_000, 'School fees term 2', 'school_fees'),
  buy('2026-01-20', 1_150_000, 'School fees arrears', 'school_fees'),
];

t('a steady category gets a per-month figure, WITH ITS WORKING SHOWN', () => {
  const s = F.suggestBudget(SIX_MONTHS, '2026-01-01', '2026-06-30');
  const rent = s.lines.find((l) => l.category === 'rent');
  assert.strictEqual(rent.suggested, 800_000);
  assert.ok(/you spent 4,800,000 on this, across 6 transactions/.test(rent.working),
    'showing the working is the entire brand');
});

t('🔴 SCHOOL FEES IS NOT AVERAGED INTO THE MONTHLY BUDGET', () => {
  const s = F.suggestBudget(SIX_MONTHS, '2026-01-01', '2026-06-30');

  assert.ok(!s.lines.some((l) => l.category === 'school_fees'),
    'a 1,200,000 termly bill must NOT appear as a monthly budget line');

  const fees = s.lumpy.find((l) => l.category === 'school_fees');
  assert.ok(fees, 'it must appear as a LUMP, dated and sized');
  assert.strictEqual(fees.typicalAmount, 1_200_000);
  assert.strictEqual(fees.appearedInMonths, 3);
  assert.strictEqual(fees.ofMonths, 6);
  assert.strictEqual(fees.wouldHaveAveraged, 591_667);
  assert.ok(/WRONG IN EVERY ONE OF THOSE MONTHS/.test(fees.why));
  assert.ok(/around/.test(fees.budgetItAs), 'it must say WHEN, not how much per month');
});

t('...and the suggested monthly total EXCLUDES the lump', () => {
  const s = F.suggestBudget(SIX_MONTHS, '2026-01-01', '2026-06-30');
  assert.strictEqual(s.suggestedMonthlyTotal, 1_150_000,   // rent 800k + food 350k
    'the lump must not be smuggled into the monthly total by the back door');
});

t('🔴 a thin category is NOT forecast, and says why', () => {
  const s = F.suggestBudget(SIX_MONTHS.concat([buy('2026-03-01', 90_000, 'Hospital', 'medical')]),
    '2026-01-01', '2026-06-30');
  const med = s.tooThinToForecast.find((x) => x.category === 'medical');
  assert.ok(med);
  assert.ok(/hunch with a number on it/.test(med.why));
});

t('🔴 no history → REFUSED. We do not make up a budget out of nothing.', () => {
  const s = F.suggestBudget([], '2026-01-01', '2026-06-30');
  assert.ok(s.refused);
  assert.ok(/out of nothing/.test(s.weWillNot));
});

t('🔴 the result announces itself as a SUGGESTION, not a plan and not money', () => {
  const s = F.suggestBudget(SIX_MONTHS, '2026-01-01', '2026-06-30');
  assert.ok(/not a plan and certainly not money/.test(s.thisIsASuggestion));
  assert.ok(/nothing here becomes real until you say so/.test(s.thisIsASuggestion));
});

t('🔴 the forecast module cannot create a transaction — it exports no such thing', () => {
  for (const k of ['confirm', 'apply', 'commit', 'createEntry', 'autoBudget']) {
    assert.strictEqual(F[k], undefined,
      `forecast.js exports ${k}() — a guess from history must never become a fact`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
console.log(fail
  ? `\n\x1b[31m✗ ${fail} FORECAST TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} FORECAST TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
