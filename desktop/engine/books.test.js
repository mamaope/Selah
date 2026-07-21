/**
 * SELAH — BOOKS, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * Every test below exists to answer ONE question the founder asked:
 *
 *     "What happens if the salary does not come that month?"
 *
 * The answer must be the same in every code path: NOTHING COUNTS UNTIL A HUMAN
 * SAYS IT HAPPENED. If a single one of these goes red, the budget has started
 * lying, and a budget that lies is worse than no budget — because it is trusted.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const B = require('./books');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error(`  \x1b[31m✗ ${name}\x1b[0m\n      ${e.message}`); }
};

const SALARY = { id: 'l1', direction: 'in',  label: 'Salary',      amount: 2_500_000 };
const RENT   = { id: 'l2', direction: 'out', label: 'Rent',        amount: 800_000, category: 'housing' };
const FOOD   = { id: 'l3', direction: 'out', label: 'Food',        amount: 400_000, category: 'food' };
const FEE    = { id: 'l4', direction: 'in',  label: 'Consultancy', amount: 1_000_000 };

const TPL = { cadence: 'monthly', lines: [SALARY, RENT, FOOD, FEE] };

// ═══ 1. A DRAFT IS NOT MONEY ════════════════════════════════════════════════

t('staging a template produces DRAFTS, not money', () => {
  const r = B.stage(TPL, '2026-07-01');
  assert.strictEqual(r.entries.length, 4);
  assert.ok(r.entries.every((e) => e.status === B.STATUS.EXPECTED));
  assert.ok(r.entries.every((e) => e.actual === null), 'a staged line has NO actual amount — nothing has happened');
});

t('🔴 an unconfirmed month counts as ZERO. Not the salary. Not the rent. Zero.', () => {
  const { entries } = B.stage(TPL, '2026-07-01');
  const s = B.summarise(entries);
  assert.strictEqual(s.confirmedIn, 0);
  assert.strictEqual(s.confirmedOut, 0);
  assert.strictEqual(s.net, 0,
    'Every other budgeting app would say this person has 1,300,000 left. They have been paid NOTHING.');
});

t('...but the expectation is still SHOWN — kept separate, never added in', () => {
  const { entries } = B.stage(TPL, '2026-07-01');
  const s = B.summarise(entries);
  assert.strictEqual(s.stillExpectedIn, 3_500_000);
  assert.strictEqual(s.stillExpectedOut, 1_200_000);
  assert.strictEqual(s.unconfirmedCount, 4);
});

t('"if everything arrives" exists, and is LABELLED A FORECAST', () => {
  const { entries } = B.stage(TPL, '2026-07-01');
  const s = B.summarise(entries);
  assert.strictEqual(s.ifEverythingArrives.net, 2_300_000);
  assert.ok(/It is not money/.test(s.ifEverythingArrives.thisIsAForecast),
    'the moment this is displayed without that sentence, the module has become the thing it replaced');
});

// ═══ 2. THE QUESTION THAT STARTED IT ════════════════════════════════════════

t('🔑 THE SALARY DID NOT COME — and the app does not pretend it did', () => {
  const { entries } = B.stage(TPL, '2026-07-01');
  const after = entries.map((e) =>
    e.label === 'Salary' ? B.markDidNotArrive(e, 'Employer paid late') : e);

  const s = B.summarise(after);
  assert.strictEqual(s.confirmedIn, 0, 'no income was received, and the app says so');
  assert.strictEqual(s.incomeThatDidNotArrive, 2_500_000);
  assert.strictEqual(s.didNotArrive.length, 1);
  assert.strictEqual(s.didNotArrive[0].label, 'Salary');
});

t('🔑 ...and the record is KEPT, not deleted. It is the evidence.', () => {
  const e = B.markDidNotArrive({ label: 'Salary', expected: 2_500_000, direction: 'in', status: 'expected' });
  assert.strictEqual(e.status, 'did_not_arrive');
  assert.strictEqual(e.expected, 2_500_000, 'we still know what was PROMISED');
  assert.strictEqual(e.actual, 0, 'and we know what CAME');
  assert.ok(/fact destroyed/.test(e.whyThisMatters));
});

t('🔴 there is NO way to auto-confirm — the module exports no such function', () => {
  for (const k of ['autoConfirm', 'settle', 'assumeReceived', 'rollForward', 'accrue']) {
    assert.strictEqual(B[k], undefined, `books.js exports ${k}() — an expectation must never become a fact without a human`);
  }
});

// ═══ 3. CONFIRMING — and the shortfall nobody records ═══════════════════════

t('confirming with no amount means "it came, exactly as expected"', () => {
  const e = B.confirmEntry({ label: 'Salary', expected: 2_500_000, direction: 'in' }, null, null, 'acc-bank');
  assert.strictEqual(e.status, 'confirmed');
  assert.strictEqual(e.actual, 2_500_000);
  assert.strictEqual(e.differsFromExpected, false);
});

t('🔑 PAID SHORT — the actual is what counts, and the shortfall is kept', () => {
  const e = B.confirmEntry({ label: 'Salary', expected: 2_500_000, direction: 'in' }, 2_100_000, null, 'acc-bank');
  assert.strictEqual(e.actual, 2_100_000);
  assert.strictEqual(e.differsFromExpected, true);
  assert.strictEqual(e.shortfall, 400_000,
    'this is the number that later proves an employer was short-paying you');
});

t('a confirmed line counts its ACTUAL, never the template\'s guess', () => {
  const { entries } = B.stage(TPL, '2026-07-01');
  const after = entries.map((e) => (e.label === 'Salary' ? B.confirmEntry(e, 2_100_000, null, 'acc-bank') : e));
  const s = B.summarise(after);
  assert.strictEqual(s.confirmedIn, 2_100_000, 'NOT 2,500,000 — the template was wrong, life was right');
});

t('confirming twice does not double the money', () => {
  const once = B.confirmEntry({ label: 'Rent', expected: 800_000, direction: 'out' }, 850_000, null, 'acc-momo');
  const twice = B.confirmEntry(once, 850_000, null, 'acc-momo');
  assert.strictEqual(twice.actual, 850_000);
  assert.strictEqual(B.summarise([twice]).confirmedOut, 850_000);
});

t('unplanned money counts — most of a real month is unplanned', () => {
  const s = B.summarise([{ direction: 'out', label: 'Hospital', expected: 300_000, actual: 300_000, status: 'unplanned', accountId: 'acc-cash' }]);
  assert.strictEqual(s.confirmedOut, 300_000);
});

// ═══ 3b. AN ENTRY MUST SAY WHICH ACCOUNT THE MONEY TOUCHED ══════════════════

t('🔴 confirming WITHOUT an account is REFUSED — a balance would be silently wrong for ever', () => {
  const r = B.confirmEntry({ label: 'Rent', expected: 800_000, direction: 'out' }, 800_000);
  assert.ok(r.refused);
  assert.ok(/Which account/.test(r.question));
  assert.ok(/wrong pocket/.test(r.weWillNot));
});

t('🔴 a staged draft carries NO account — the UI may suggest, it may not select', () => {
  const { entries } = B.stage(TPL, '2026-07-01');
  assert.ok(entries.every((e) => e.accountId === null),
    'a pre-filled account is a guess that gets tapped through without being read');
});

t('a confirmed entry remembers which account it touched', () => {
  const e = B.confirmEntry({ label: 'Salary', expected: 2_500_000, direction: 'in' }, 2_500_000, '2026-07-05', 'acc-bank');
  assert.strictEqual(e.accountId, 'acc-bank');
  assert.strictEqual(e.occurredOn, '2026-07-05');
});

// ═══ 3c. 🔴 A TRANSFER IS NOT INCOME, AND IT IS NOT SPENDING ════════════════

t('🔴 moving money bank → MoMo is counted in NO total', () => {
  const s = B.summarise([
    { direction: 'in',       label: 'Salary',   expected: 2_500_000, actual: 2_500_000, status: 'confirmed', accountId: 'acc-bank' },
    { direction: 'transfer', label: 'To MoMo',  expected: 500_000,   actual: 500_000,   status: 'confirmed', accountId: 'acc-bank' },
  ]);
  assert.strictEqual(s.confirmedIn, 2_500_000, 'the transfer must NOT appear as income — that is a savings rate built on a fantasy');
  assert.strictEqual(s.confirmedOut, 0, 'nor as spending — a person doing fine would look broke');
  assert.strictEqual(s.net, 2_500_000);
  assert.strictEqual(s.transfers.count, 1);
  assert.strictEqual(s.transfers.moved, 500_000);
});

// ═══ 4. STAGING TWICE WOULD DOUBLE THE RENT, AND NOBODY WOULD SEE IT ════════

t('🔴 staging the SAME period twice is refused — it would silently double every line', () => {
  const first = B.stage(TPL, '2026-07-15');
  const again = B.stage(TPL, '2026-07-20', [first.period.startsOn]);
  assert.strictEqual(again.entries.length, 0);
  assert.strictEqual(again.alreadyStaged, true);
  assert.ok(/silently doubled/.test(again.note));
});

t('a different period stages normally', () => {
  const july = B.stage(TPL, '2026-07-15');
  const aug  = B.stage(TPL, '2026-08-03', [july.period.startsOn]);
  assert.strictEqual(aug.entries.length, 4);
  assert.strictEqual(aug.period.label, 'August 2026');
});

// ═══ 5. PERIODS — and the anchor we refuse to guess ═════════════════════════

t('a monthly period is the calendar month', () => {
  const p = B.periodFor('monthly', '2026-07-12');
  assert.strictEqual(p.startsOn, '2026-07-01');
  assert.strictEqual(p.endsOn, '2026-07-31');
  assert.strictEqual(p.label, 'July 2026');
});

t('February is 28 days, and 29 in a leap year', () => {
  assert.strictEqual(B.periodFor('monthly', '2027-02-10').endsOn, '2027-02-28');
  assert.strictEqual(B.periodFor('monthly', '2028-02-10').endsOn, '2028-02-29');
});

t('a week starts on Monday — and the module SAYS that it chose', () => {
  const p = B.periodFor('weekly', '2026-07-12');       // a Sunday
  assert.strictEqual(p.startsOn, '2026-07-06');        // the Monday before
  assert.strictEqual(p.endsOn, '2026-07-12');
  assert.ok(/We chose that/.test(p.assumption), 'an assumption we do not admit to is a bug waiting to happen');
});

t('🔴 a QUARTERLY template with no anchor is REFUSED — we do not assume January', () => {
  const r = B.stage({ cadence: 'quarterly', lines: [RENT] }, '2026-07-12');
  assert.ok(r.refused);
  assert.ok(/will not assume January/.test(r.weWillNot),
    'assume wrong and every date is up to three months out — and it looks perfectly reasonable');
});

t('...and with an anchor, it computes the right quarter', () => {
  const r = B.stage({ cadence: 'quarterly', anchor: '2026-01-01', lines: [RENT] }, '2026-07-12');
  assert.strictEqual(r.period.startsOn, '2026-07-01');
  assert.strictEqual(r.period.endsOn, '2026-09-30');
});

t('an annual anchor of 1 July gives the Ugandan tax year, because we were TOLD to', () => {
  const r = B.stage({ cadence: 'annual', anchor: '2025-07-01', lines: [SALARY] }, '2026-07-12');
  assert.strictEqual(r.period.startsOn, '2026-07-01');
  assert.strictEqual(r.period.endsOn, '2027-06-30');
});

t('🔴 a period that has not started yet is not staged. July is not staged in June.', () => {
  const r = B.stage({ cadence: 'quarterly', anchor: '2026-12-01', lines: [RENT] }, '2026-07-12');
  assert.ok(r.refused);
  assert.ok(/before it exists/.test(r.weWillNot));
});

t('an empty template is refused — an empty month is not a budget', () => {
  const r = B.stage({ cadence: 'monthly', lines: [] }, '2026-07-12');
  assert.ok(r.refused);
  assert.ok(/nothing to stage/.test(r.because));
});

t('an unknown cadence is refused — we do not guess how often your money moves', () => {
  const r = B.stage({ cadence: 'fortnightly', lines: [SALARY] }, '2026-07-12');
  assert.ok(r.refused);
  assert.ok(/not a cadence we know/.test(r.because));
});

// ═══ 6. TARGETS — a goal that counts your hopes is a mood ═══════════════════

t('🔴 a target counts CONFIRMED money only — never expected', () => {
  const entries = [
    { direction: 'in', label: 'Salary', expected: 2_500_000, actual: 2_500_000, status: 'confirmed' },
    { direction: 'in', label: 'Fee',    expected: 1_000_000, actual: null,      status: 'expected' },
  ];
  const p = B.targetProgress({ kind: 'goal', amount: 5_000_000, label: 'The plot' }, entries);
  assert.strictEqual(p.confirmed, 2_500_000, 'the 1,000,000 has NOT arrived and must not fill the bar');
  assert.strictEqual(p.percent, 50);
  assert.strictEqual(p.met, false);
});

t('a savings goal is MET when the confirmed money reaches it', () => {
  const p = B.targetProgress({ kind: 'goal', amount: 1_000_000 },
    [{ direction: 'in', expected: 1_000_000, actual: 1_000_000, status: 'confirmed' }]);
  assert.strictEqual(p.met, true);
  assert.strictEqual(p.percent, 100);
});

t('a spending LIMIT is breached by going over, and says by how much', () => {
  const p = B.targetProgress({ kind: 'limit', amount: 400_000, category: 'food' },
    [{ direction: 'out', category: 'food', expected: 400_000, actual: 470_000, status: 'confirmed' }]);
  assert.strictEqual(p.breached, true);
  assert.strictEqual(p.over, 70_000);
  assert.strictEqual(p.met, false);
});

t('a limit you are under is MET, not breached', () => {
  const p = B.targetProgress({ kind: 'limit', amount: 400_000, category: 'food' },
    [{ direction: 'out', category: 'food', expected: 400_000, actual: 380_000, status: 'confirmed' }]);
  assert.strictEqual(p.met, true);
  assert.strictEqual(p.breached, false);
  assert.strictEqual(p.remaining, 20_000);
});

t('a target with no amount is REFUSED — no progress bar without a destination', () => {
  const p = B.targetProgress({ kind: 'goal' }, []);
  assert.ok(p.refused);
  assert.ok(/no destination/.test(p.weWillNot));
});

// ═══ 7. THE TAX BOUNDARY — DELIBERATE ══════════════════════════════════════

t('🔴 books.js does NOT import the tax engine. A budget label is not a tax fact.', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, 'books.js'), 'utf8');
  const code = src.split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//')).join('\n');
  for (const m of ['./calendar', './tier1', './tier2', './rules']) {
    assert.ok(!code.includes(`require('${m}')`),
      `books.js requires ${m} — a Book called "Shop" would then invent a provisional tax obligation out of a word the user typed into a budget`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ═══ 10. 🔴 THE SUMMARY IS FOR ONE MONTH — a window, not the whole Book ══════

t('🔴 summarise windows to a month — it once summed the whole Book under one month heading', () => {
  const july = { direction: 'in', label: 'Salary', expected: 2_000_000, actual: 2_000_000, status: 'confirmed', accountId: 'a1', occurredOn: '2026-07-05' };
  const august = { direction: 'in', label: 'Salary', expected: 2_000_000, actual: 2_000_000, status: 'confirmed', accountId: 'a1', occurredOn: '2026-08-05' };

  const all = B.summarise([july, august]);
  assert.strictEqual(all.confirmedIn, 4_000_000, 'with no window, everything');

  const julyOnly = B.summarise([july, august], { from: '2026-07-01', to: '2026-07-31' });
  assert.strictEqual(julyOnly.confirmedIn, 2_000_000, 'July must NOT include the August salary');
});

t('a DRAFT belongs to the month it was STAGED into, not to no month', () => {
  const draft = { direction: 'out', label: 'Rent', expected: 800_000, actual: null, status: 'expected', periodStart: '2026-08-01' };
  assert.strictEqual(B.summarise([draft], { from: '2026-08-01', to: '2026-08-31' }).unconfirmedCount, 1);
  assert.strictEqual(B.summarise([draft], { from: '2026-07-01', to: '2026-07-31' }).unconfirmedCount, 0);
});

t('belongsToWindow: confirmed by date, draft by periodStart, undated belongs to nothing', () => {
  assert.strictEqual(B.belongsToWindow({ status: 'confirmed', occurredOn: '2026-07-15' }, '2026-07-01', '2026-07-31'), true);
  assert.strictEqual(B.belongsToWindow({ status: 'confirmed', occurredOn: '2026-08-01' }, '2026-07-01', '2026-07-31'), false);
  assert.strictEqual(B.belongsToWindow({ status: 'expected', periodStart: '2026-07-01' }, '2026-07-01', '2026-07-31'), true);
  assert.strictEqual(B.belongsToWindow({ status: 'confirmed', occurredOn: null }, '2026-07-01', '2026-07-31'), false);
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} BOOKS TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} BOOKS TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
