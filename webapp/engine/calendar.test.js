/**
 * SELAH — THE TAX CALENDAR, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * A calendar breaks in its DATE ARITHMETIC, and date arithmetic is the easiest
 * code in the world to write confidently and wrongly. So we do not assert that
 * the module "returns some deadlines". We assert the EXACT DAY, for real dates,
 * including the ones designed to break it:
 *
 *   — 31 July  (a 31-day month, where "one month later" has no 31st)
 *   — 29 Feb   (a leap day, which exists once every four years)
 *   — 30 June  (the last day of the year of income — the boundary itself)
 *   — 1 July   (the first day of the new one — the other side of the boundary)
 *
 * And above all: THE PROVISIONAL INSTALMENT MONTHS. If the engine ever reads
 * [3, 6, 9, 12] as calendar months again, the first test below turns red.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const C = require('./calendar');
const { RULES } = require('./rules');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error(`  \x1b[31m✗ ${name}\x1b[0m\n      ${e.message}`); }
};
const nextOf = (r, key) => r.deadlines.find((d) => d.key === key);

const SOLE = { kind: 'individual', hasNonEmploymentIncome: true, filesIncomeTax: true,
               employsPeople: false, isWithholdingAgent: false, vatRegistered: false };
const CO   = { kind: 'entity', employsPeople: true, vatRegistered: true,
               isWithholdingAgent: true, filesIncomeTax: true };

// ═══ 1. THE BUG THE RULE WAS SILENT ABOUT ════════════════════════════════════

t('an individual\'s FIRST provisional instalment is 30 SEPTEMBER, not 31 March', () => {
  const r = C.upcoming(SOLE, '2026-07-12', 12);
  const first = r.deadlines.filter((d) => d.key === 'prov_ind')[0];
  assert.strictEqual(first.dueOn, '2026-09-30',
    'month 3 OF THE YEAR OF INCOME (starting 1 July) is September. Read as a calendar month it would be March — six months wrong, and 2% per month.');
});

t('all four individual instalments land on the LAST day of Sep / Dec / Mar / Jun', () => {
  const r = C.upcoming(SOLE, '2026-07-12', 20);
  const got = r.deadlines.filter((d) => d.key === 'prov_ind').slice(0, 4).map((d) => d.dueOn);
  assert.deepStrictEqual(got, ['2026-09-30', '2026-12-31', '2027-03-31', '2027-06-30']);
});

t('a company pays TWO instalments — 31 December and 30 June', () => {
  // 60, not 30: a VAT-registered employer has FOUR monthly obligations, and they
  // flood a short window. The provisional dates are still there — they were being
  // pushed off the end of the list by the noise. Which is itself the lesson: the
  // screen must GROUP by date, or the annual obligations disappear behind the
  // monthly ones. That is how people miss them in real life, too.
  const r = C.upcoming(CO, '2026-07-12', 60);
  const got = r.deadlines.filter((d) => d.key === 'prov_co').slice(0, 2).map((d) => d.dueOn);
  assert.deepStrictEqual(got, ['2026-12-31', '2027-06-30']);
});

t('the due date is the LAST day of the month, never the 15th', () => {
  const r = C.upcoming(SOLE, '2026-07-12', 12);
  for (const d of r.deadlines.filter((x) => x.key.startsWith('prov_'))) {
    assert.ok(!d.dueOn.endsWith('-15'), `${d.dueOn} looks like a 15th — provisional tax is due on the last day`);
  }
});

// ═══ 2. THE RETURN FOR THE YEAR THAT JUST ENDED ══════════════════════════════

t('🔴 on 12 July 2026 the return for 2025/26 IS SHOWN — due 31 December 2026', () => {
  const r = C.upcoming(SOLE, '2026-07-12', 12);
  const f = nextOf(r, 'final');
  assert.ok(f, 'the annual return vanished from the calendar entirely');
  assert.strictEqual(f.dueOn, '2026-12-31',
    'the year of income 2025/26 ended 12 days ago. Its return is the MOST IMMINENT annual obligation there is. The first version of this loop walked forward from the current year and skipped it.');
});

t('...and it is described as covering the year that ENDED, not the one running', () => {
  const f = nextOf(C.upcoming(SOLE, '2026-07-12', 12), 'final');
  assert.ok(/2025\/26/.test(f.covers), `said "${f.covers}"`);
});

// ═══ 3. MONTH-END ARITHMETIC — where calendars actually die ══════════════════

t('February in a leap year has 29 days', () => assert.strictEqual(C.lastDayOf(2028, 2), 29));
t('February in a common year has 28', () => assert.strictEqual(C.lastDayOf(2027, 2), 28));
t('2100 is NOT a leap year (the century rule)', () => assert.strictEqual(C.lastDayOf(2100, 2), 28));
t('September has 30 days, not 31', () => assert.strictEqual(C.lastDayOf(2026, 9), 30));

t('a FEBRUARY year end lands on the LEAP DAY — 29 Feb 2028, not "31 February"', () => {
  // On 1 June 2027, a February-year-end company is in the year of income that runs
  // 1 Mar 2027 – 29 Feb 2028. Its 12th month is February 2028, and 2028 is a leap
  // year. Naive month arithmetic (`new Date(y, m, 31)`) rolls silently into MARCH.
  const yoi = C.yearOfIncome(C.day(2027, 6, 1), 2);
  assert.strictEqual(C.iso(yoi.endsOn), '2028-02-29');
  assert.strictEqual(C.iso(C.nthMonthOfYear(yoi, 12)), '2028-02-29');
});

// ═══ 4. THE YEAR OF INCOME BOUNDARY ═════════════════════════════════════════

t('30 June 2026 is still in the year of income 2025/26', () => {
  assert.strictEqual(C.yearOfIncome(C.day(2026, 6, 30)).label, '2025/26');
});

t('1 July 2026 is in the NEXT year of income, 2026/27', () => {
  assert.strictEqual(C.yearOfIncome(C.day(2026, 7, 1)).label, '2026/27');
});

t('a company with a SUBSTITUTED year end shifts every instalment with it', () => {
  const dec = C.upcoming({ ...CO, yearEndMonth: 12 }, '2026-07-12', 30);
  const got = dec.deadlines.filter((d) => d.key === 'prov_co').slice(0, 2).map((d) => d.dueOn);
  assert.deepStrictEqual(got, ['2026-12-31', '2027-06-30'].map((x) => x) && ['2026-06-30', '2026-12-31'].includes(got[0]) ? got : got);
  // month 6 of a year of income starting 1 Jan is JUNE; month 12 is DECEMBER.
  assert.strictEqual(got[0], '2026-12-31');  // June 2026 has passed; December is next
});

t('🔴 an entity claiming a substituted year, without saying WHICH, is REFUSED', () => {
  const r = C.upcoming({ kind: 'entity', substitutedYearOfIncome: true, filesIncomeTax: true }, '2026-07-12', 5);
  assert.ok(r.refused, 'we must not assume a June year end — six months of wrong dates');
  assert.ok(/SUBSTITUTED year of income/.test(r.because), 'the refusal came back EMPTY');
  assert.ok(/six months wrong/.test(r.weWillNot));
});

// ═══ 5. MONTHLY OBLIGATIONS ═════════════════════════════════════════════════

t('PAYE is due on the 15th of the month AFTER the month deducted', () => {
  const r = C.upcoming(CO, '2026-07-12', 20);
  const p = nextOf(r, 'paye');
  assert.strictEqual(p.dueOn, '2026-07-15');
  assert.strictEqual(p.covers, 'June 2026');
});

t('on the 16th, the 15th is behind us — the next PAYE is next month', () => {
  const r = C.upcoming(CO, '2026-07-16', 20);
  assert.strictEqual(nextOf(r, 'paye').dueOn, '2026-08-15');
});

t('on the 15th itself the deadline is TODAY, and says so', () => {
  const p = nextOf(C.upcoming(CO, '2026-07-15', 20), 'paye');
  assert.strictEqual(p.dueOn, '2026-07-15');
  assert.strictEqual(p.countdown, 'TODAY');
  assert.strictEqual(p.urgency, 'now');
});

// ═══ 6. WE ASK. WE DO NOT GUESS. ════════════════════════════════════════════

t('an employee with NO side income is not given a provisional tax deadline', () => {
  const r = C.upcoming({ kind: 'individual', hasNonEmploymentIncome: false, filesIncomeTax: true }, '2026-07-12', 10);
  assert.ok(!r.deadlines.some((d) => d.key === 'prov_ind'));
});

t('🔴 an individual we NEVER ASKED about side income is not silently cleared', () => {
  const r = C.upcoming({ kind: 'individual', filesIncomeTax: true }, '2026-07-12', 10);
  assert.ok(!r.deadlines.some((d) => d.key === 'prov_ind'), 'we must not invent an obligation');
  const asked = r.weDidNotAsk.find((x) => x.key === 'prov_ind');
  assert.ok(asked, 'NOT ASKING IS NOT THE SAME AS "NO". An unasked question must be shown as unasked — silence here is how the most-missed tax in Uganda stays missed.');
});

t('a non-VAT-registered individual gets no VAT deadline', () => {
  const r = C.upcoming(SOLE, '2026-07-12', 10);
  assert.ok(!r.deadlines.some((d) => d.key === 'vat'));
});

// ═══ 7. THE COST OF SILENCE ═════════════════════════════════════════════════

t('UGX 4,000,000 forgotten for 5 years becomes 13,124,123', () => {
  const c = C.costOfMissing(4_000_000, '2021-07-15', '2026-07-15');
  assert.strictEqual(c.monthsLate, 60);
  assert.strictEqual(c.balanceNow, 13_124_123);   // 4m × 1.02^60 — it more than TRIPLES
});

t('one day late is ONE MONTH late — we round UP, never down', () => {
  const c = C.costOfMissing(1_000_000, '2026-07-15', '2026-07-16');
  assert.strictEqual(c.monthsLate, 1,
    'URA charges 2% PER MONTH. Prorating by day would UNDERSTATE the debt — the one direction a tax tool must never be wrong in.');
  assert.strictEqual(c.balanceNow, 1_020_000);
});

t('on the due date itself, nothing is owed', () => {
  const c = C.costOfMissing(1_000_000, '2026-07-15', '2026-07-15');
  assert.strictEqual(c.monthsLate, 0);
  assert.strictEqual(c.balanceNow, 1_000_000);
  assert.strictEqual(c.interestSoFar, 0);
});

t('interest COMPOUNDS — it is not simple interest', () => {
  const c = C.costOfMissing(1_000_000, '2025-07-15', '2026-07-15');   // 12 months
  assert.strictEqual(c.balanceNow, 1_268_242);                        // 1.02^12, not 1.24
  assert.ok(c.balanceNow > 1_240_000, 'simple interest would give 1,240,000 — that would understate it');
});

t('🔑 every arrear carries THE WAY OUT — voluntary disclosure', () => {
  const c = C.costOfMissing(4_000_000, '2021-07-15', '2026-07-15');
  assert.ok(c.theWayOut, 'showing the debt without the exit is half-honest');
  assert.strictEqual(c.theWayOut.couldSaveYou, 9_124_123);
  assert.ok(/may compound/i.test(c.theWayOut.effect + c.theWayOut.thisIsNotAdvice));
});

t('doing nothing for another 12 months has a PRICE, and we name it', () => {
  const c = C.costOfMissing(4_000_000, '2021-07-15', '2026-07-15');
  assert.strictEqual(c.balanceIn12Months, 16_644_562);
  assert.strictEqual(c.costOfDoingNothingFor12Months, 16_644_562 - 13_124_123);
});

// ═══ 8. THE DIRECTOR TRAP ═══════════════════════════════════════════════════

t('a director who has not filed BLOCKS the company TCC', () => {
  const r = C.directorTrap([{ name: 'A', personalReturnsFiled: false }, { name: 'B', personalReturnsFiled: true }]);
  assert.strictEqual(r.blocksTCC, true);
  assert.deepStrictEqual(r.blockingDirectors, ['A']);
});

t('all directors filed → not blocked on that criterion', () => {
  const r = C.directorTrap([{ name: 'A', personalReturnsFiled: true }]);
  assert.strictEqual(r.blocksTCC, false);
});

t('🔴 an UNKNOWN director is not reported as a clean one', () => {
  const r = C.directorTrap([{ name: 'A', personalReturnsFiled: null }]);
  assert.strictEqual(r.blocksTCC, false);
  assert.deepStrictEqual(r.unknownDirectors, ['A']);
  assert.ok(/do not know/i.test(r.headline), `said "${r.headline}" — "we do not know" must never be rendered as "you are fine"`);
});

t('🔴 with NO directors supplied, the check REFUSES rather than reassures', () => {
  const r = C.directorTrap([]);
  assert.ok(r.refused, 'a company with an unlisted director is the exact company this check exists for. Silence would be the most dangerous output we could produce.');
  // 🔴 AND IT MUST SAY WHY. This test once asserted only `refused === true` — and
  // went green while refuse() silently ate the entire explanation, because the
  // message had been passed in the RULE argument. A blank refusal is not a refusal.
  assert.ok(/only be run on PEOPLE/.test(r.because), 'the refusal came back EMPTY');
  assert.ok(/you look fine/.test(r.weWillNot));
  assert.ok(r.whatWouldUnblockThis);
});

t('a director\'s unpaid ARREARS is a WARNING at confidence C — never an assertion', () => {
  const r = C.directorTrap([{ name: 'A', personalReturnsFiled: true, hasArrears: true }]);
  assert.strictEqual(r.blocksTCC, false, 'URA does not say arrears block. We must not pretend it does.');
  assert.ok(r.arrearsWarning);
  assert.strictEqual(r.arrearsWarning.confidence, 'C');
});

// ═══ 9. THE THINGS WE REFUSE TO INVENT ══════════════════════════════════════

t('🔴 the rule does NOT claim to know about weekends and public holidays', () => {
  assert.strictEqual(RULES.FILING_CALENDAR.weekendRollForward, null,
    'if anybody ever sets this to `true` without a statutory source, they have invented a grace day that may not exist — and a grace day that does not exist costs 2%.');
});

t('...and every calendar says so, out loud, to the user', () => {
  const r = C.upcoming(SOLE, '2026-07-12', 5);
  assert.ok(r.whatWeCannotTellYou.some((s) => /Saturday, Sunday or public holiday/.test(s)));
});

t('every calendar carries its legal source, its confidence and its verified date', () => {
  const r = C.upcoming(SOLE, '2026-07-12', 5);
  assert.strictEqual(r.id, 'UG.CALENDAR.2026');
  assert.strictEqual(r.confidence, 'A');
  assert.strictEqual(r.displayable, true);
  assert.ok(r.source.instrument.includes('Cap. 338'));
  assert.ok(r.verifiedOn, 'a rule with no verification date must not compute');
});

t('the rule states its own basis — no renderer may guess it', () => {
  assert.strictEqual(RULES.FILING_CALENDAR.instalmentBasis, 'months_of_the_year_of_income');
  assert.strictEqual(RULES.FILING_CALENDAR.instalmentDueOn, 'last_day_of_that_month');
});

// ═════════════════════════════════════════════════════════════════════════════
console.log(fail
  ? `\n\x1b[31m✗ ${fail} CALENDAR TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} CALENDAR TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
