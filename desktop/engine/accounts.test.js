/**
 * SELAH — ACCOUNTS, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * Four ways this module could quietly lie to a Ugandan about their own money, and
 * a test for each:
 *
 *   1. Count a TRANSFER as income        → a savings rate that is pure fantasy
 *   2. Get the DEBT SIGN backwards       → every repayment grows what you owe
 *   3. Call LAND "liquid"                → "you have 8 months of runway" (you have 3 weeks)
 *   4. Silently absorb the RECONCILIATION gap → destroy the one number that answers
 *                                            "where does my money actually go?"
 *
 * None of these throw. None of them look wrong. The arithmetic adds up perfectly in
 * every one. That is exactly why they need tests.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const A = require('./accounts');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error(`  \x1b[31m✗ ${name}\x1b[0m\n      ${e.message}`); }
};

const BANK = { id: 'a1', name: 'Stanbic', type: 'bank' };
const MOMO = { id: 'a2', name: 'MTN MoMo', type: 'mobile_money' };
const CASH = { id: 'a3', name: 'Cash',     type: 'cash' };
const LOAN = { id: 'a4', name: 'DFCU loan', type: 'loan' };
const LAND = { id: 'a5', name: 'Plot in Gayaza', type: 'land' };

const conf = (dir, amt, acc) => ({ direction: dir, expected: amt, actual: amt, status: 'confirmed', accountId: acc });

// ═══ 1. THE BALANCE ═════════════════════════════════════════════════════════

t('a balance is opening + confirmed in − confirmed out', () => {
  const b = A.computedBalance(BANK, { amount: 1_000_000, asOf: '2026-07-01' },
    [conf('in', 2_500_000, 'a1'), conf('out', 800_000, 'a1')], []);
  assert.strictEqual(b.computed, 2_700_000);
  assert.strictEqual(b.entriesCounted, 2);
});

t('🔴 a DRAFT touches no balance. Ever.', () => {
  const b = A.computedBalance(BANK, { amount: 1_000_000 },
    [{ direction: 'in', expected: 2_500_000, actual: null, status: 'expected', accountId: 'a1' }], []);
  assert.strictEqual(b.computed, 1_000_000, 'the salary has NOT arrived — the balance must not move');
});

t('entries for OTHER accounts are ignored', () => {
  const b = A.computedBalance(BANK, { amount: 0 },
    [conf('in', 500_000, 'a1'), conf('in', 900_000, 'a2')], []);
  assert.strictEqual(b.computed, 500_000);
});

t('a confirmed line counts its ACTUAL, not the template\'s guess', () => {
  const b = A.computedBalance(BANK, { amount: 0 },
    [{ direction: 'in', expected: 2_500_000, actual: 2_100_000, status: 'confirmed', accountId: 'a1' }], []);
  assert.strictEqual(b.computed, 2_100_000);
});

t('the balance says out loud that we did NOT observe it', () => {
  const b = A.computedBalance(BANK, { amount: 0 }, [], []);
  assert.ok(/We cannot see your accounts/.test(b.thisIsNotObserved));
});

// ═══ 2. 🔴 A TRANSFER MOVES MONEY AND CHANGES NO TOTAL ══════════════════════

t('🔴 a transfer LEAVES one account and ARRIVES in the other', () => {
  const ts = [{ fromAccountId: 'a1', toAccountId: 'a2', amount: 500_000, status: 'confirmed' }];
  const bank = A.computedBalance(BANK, { amount: 1_000_000 }, [], ts);
  const momo = A.computedBalance(MOMO, { amount: 100_000 }, [], ts);
  assert.strictEqual(bank.computed, 500_000);
  assert.strictEqual(momo.computed, 600_000);
});

t('🔴 ...and the person is no richer. Net worth is UNCHANGED by a transfer.', () => {
  const ts = [{ fromAccountId: 'a1', toAccountId: 'a2', amount: 500_000, status: 'confirmed' }];
  const before = A.netWorth([A.computedBalance(BANK, { amount: 1_000_000 }, [], []),
                             A.computedBalance(MOMO, { amount: 100_000 }, [], [])]);
  const after  = A.netWorth([A.computedBalance(BANK, { amount: 1_000_000 }, [], ts),
                             A.computedBalance(MOMO, { amount: 100_000 }, [], ts)]);
  assert.strictEqual(before.netWorth, after.netWorth,
    'moving money between your own pockets must not make you richer — this is the most common lie in personal finance software');
  assert.strictEqual(after.netWorth, 1_100_000);
});

// ═══ 3. 🔴 THE DEBT SIGN — where arithmetic that "adds up" is still wrong ═══

t('🔴 REPAYING a loan makes the debt SMALLER', () => {
  const b = A.computedBalance(LOAN, { amount: 5_000_000 }, [conf('in', 500_000, 'a4')], []);
  assert.strictEqual(b.computed, 4_500_000,
    'treat a loan like a bank account and every repayment GROWS what you owe — and the arithmetic never once complains');
  assert.strictEqual(b.side, 'debt');
});

t('🔴 BORROWING more makes the debt BIGGER', () => {
  const b = A.computedBalance(LOAN, { amount: 5_000_000 }, [conf('out', 1_000_000, 'a4')], []);
  assert.strictEqual(b.computed, 6_000_000);
});

t('a debt is SUBTRACTED from net worth, never added', () => {
  const n = A.netWorth([
    A.computedBalance(BANK, { amount: 3_000_000 }, [], []),
    A.computedBalance(LOAN, { amount: 5_000_000 }, [], []),
  ]);
  assert.strictEqual(n.assets, 3_000_000);
  assert.strictEqual(n.debts, 5_000_000);
  assert.strictEqual(n.netWorth, -2_000_000, 'this person owes more than they own, and must be told so');
});

// ═══ 4. 🔑 RECONCILIATION — "where does my money actually go?" ══════════════

t('🔑 the gap between the books and reality is NAMED, not absorbed', () => {
  const b = A.computedBalance(CASH, { amount: 200_000, asOf: '2026-07-01' },
    [conf('out', 20_000, 'a3')], []);
  assert.strictEqual(b.computed, 180_000);

  const r = A.reconcile(b, 95_000, '2026-08-01');
  assert.strictEqual(r.weComputed, 180_000);
  assert.strictEqual(r.youSay, 95_000);
  assert.strictEqual(r.unaccounted, 85_000);
  assert.ok(/85,000 left this account and was never recorded/.test(r.headline));
  assert.ok(/where does my money go/.test(r.whatThisMeans),
    'every app that silently resets the balance destroys the most useful number it had');
});

t('...and the books are RE-GROUNDED in reality, so drift cannot compound', () => {
  const b = A.computedBalance(CASH, { amount: 200_000 }, [conf('out', 20_000, 'a3')], []);
  const r = A.reconcile(b, 95_000, '2026-08-01');
  assert.deepStrictEqual(r.newOpening, { amount: 95_000, asOf: '2026-08-01' });
});

t('money that appeared unexplained is reported too — probably a wrong account', () => {
  const b = A.computedBalance(MOMO, { amount: 100_000 }, [], []);
  const r = A.reconcile(b, 160_000, '2026-08-01');
  assert.strictEqual(r.unexplainedIncrease, 60_000);
  assert.strictEqual(r.unaccounted, 0);
  assert.ok(/logged against the wrong account/.test(r.whatThisMeans));
});

t('a perfect match says so plainly', () => {
  const b = A.computedBalance(MOMO, { amount: 100_000 }, [], []);
  assert.strictEqual(A.reconcile(b, 100_000).matches, true);
});

t('reconciling against nothing is REFUSED — we cannot see your balance', () => {
  const b = A.computedBalance(MOMO, { amount: 100_000 }, [], []);
  const r = A.reconcile(b, null);
  assert.ok(r.refused);
  assert.ok(/not your bank/.test(r.weWillNot));
});

t('🔴 a transfer recorded as an ENTRY works exactly like the legacy array', () => {
  // ONE representation. Two would drift, and money would appear or vanish with every
  // total still adding up perfectly.
  const asEntry = [{ direction: 'transfer', status: 'confirmed', amount: 500_000,
                     fromAccountId: 'a1', toAccountId: 'a2' }];
  const bank = A.computedBalance(BANK, { amount: 1_000_000 }, asEntry);
  const momo = A.computedBalance(MOMO, { amount: 100_000 }, asEntry);
  assert.strictEqual(bank.computed, 500_000);
  assert.strictEqual(momo.computed, 600_000);
});

// ═══ 5b. 🔴 AN IMPOSSIBLE BALANCE IS A SIGNAL, NOT A NUMBER ════════════════

t('🔴 you cannot hold MINUS 250,000 in mobile money — and we say so', () => {
  const b = A.computedBalance(MOMO, { amount: 100_000 }, [conf('out', 350_000, 'a2')]);
  assert.strictEqual(b.computed, -250_000);
  assert.strictEqual(b.impossible, true);
  assert.ok(/never recorded|wrong account/.test(b.impossibleBecause),
    'printing the negative and moving on is arithmetically defensible and useless — the person concludes the app is broken');
});

t('...but a LOAN is allowed to be large, and a repaid loan is allowed to hit zero', () => {
  const b = A.computedBalance(LOAN, { amount: 5_000_000 }, [conf('in', 5_000_000, 'a4')]);
  assert.strictEqual(b.computed, 0);
  assert.strictEqual(b.impossible, false, 'a debt is not an impossible balance — it is the point of a debt');
});

t('a healthy account is not flagged', () => {
  assert.strictEqual(A.computedBalance(BANK, { amount: 1_000_000 }, []).impossible, false);
});

// ═══ 5c. 🔴 LAND IS NOT LUNCH ══════════════════════════════════════════════

t('🔴 the emergency fund counts LIQUID money only', () => {
  const bs = [
    A.computedBalance(CASH, { amount: 200_000 }, [], []),
    A.computedBalance(MOMO, { amount: 300_000 }, [], []),
    A.computedBalance(LAND, { amount: 40_000_000 }, [], []),      // not lunch
  ];
  const e = A.emergencyFund(bs, 1_000_000);
  assert.strictEqual(e.liquid, 500_000);
  assert.strictEqual(e.months, 0.5,
    'counting the plot would say 40 MONTHS of runway. They have two weeks.');
  assert.strictEqual(e.verdict, 'You have no cushion.');
});

t('...and it NAMES what it excluded, and why', () => {
  const e = A.emergencyFund([A.computedBalance(LAND, { amount: 40_000_000 }, [], []),
                             A.computedBalance(CASH, { amount: 6_000_000 }, [], [])], 1_000_000);
  assert.strictEqual(e.excluded.length, 1);
  assert.strictEqual(e.excluded[0].name, 'Plot in Gayaza');
  assert.ok(/RECORD WHAT YOU PAID/.test(e.excluded[0].why));
  assert.strictEqual(e.months, 6);
  assert.strictEqual(e.verdict, 'Solid.');
});

t('🔴 money a cousin OWES you is not money you have', () => {
  const owed = { id: 'a6', name: 'Loan to Peter', type: 'receivable' };
  const e = A.emergencyFund([A.computedBalance(owed, { amount: 3_000_000 }, [], []),
                             A.computedBalance(CASH, { amount: 100_000 }, [], [])], 500_000);
  assert.strictEqual(e.liquid, 100_000, 'it may never arrive — counting it is how people discover they have no savings');
  assert.strictEqual(e.months, 0.2);
});

t('a VSLA is real money you cannot touch until the cycle ends', () => {
  assert.strictEqual(A.isLiquid({ type: 'vsla' }), false);
  assert.strictEqual(A.isLiquid({ type: 'fixed_deposit' }), false);
  assert.strictEqual(A.isLiquid({ type: 'mobile_money' }), true);
});

t('an account can OVERRIDE its liquidity (SACCO shares are not SACCO savings)', () => {
  assert.strictEqual(A.isLiquid({ type: 'sacco' }), true);
  assert.strictEqual(A.isLiquid({ type: 'sacco', liquid: false }), false);
});

t('🔴 with no confirmed spending, the runway REFUSES rather than dividing by zero', () => {
  const e = A.emergencyFund([A.computedBalance(CASH, { amount: 500_000 }, [], [])], 0);
  assert.ok(e.refused);
  assert.ok(/infinite months/.test(e.weWillNot));
});

// ═══ 6. THE SAVINGS RATE ═══════════════════════════════════════════════════

t('the savings rate uses confirmed money only', () => {
  const s = A.savingsRate(2_100_000, 1_650_000);
  assert.strictEqual(s.kept, 450_000);
  assert.strictEqual(s.percent, 21.4);
});

t('spending more than came in is reported as such, not hidden', () => {
  const s = A.savingsRate(1_000_000, 1_400_000);
  assert.strictEqual(s.kept, -400_000);
  assert.ok(/came from somewhere — savings, or debt/.test(s.negative));
});

t('no confirmed income → REFUSED, not "0%"', () => {
  const s = A.savingsRate(0, 500_000);
  assert.ok(s.refused);
  assert.ok(/has not arrived/.test(s.weWillNot));
});

// ═══ 7. NET WORTH TELLS YOU WHAT IT DOES NOT KNOW ══════════════════════════

t('an account never grounded in a real balance is NAMED in the total', () => {
  const n = A.netWorth([
    A.computedBalance(BANK, { amount: 1_000_000, asOf: '2026-07-01' }, [], []),
    A.computedBalance(CASH, { amount: 50_000 }, [], []),          // never reconciled
  ]);
  assert.deepStrictEqual(n.accountsNeverReconciled, ['Cash']);
  assert.ok(/unverified/.test(n.confidence), 'a caveat with no names is a caveat nobody reads');
});

t('every account grounded → the total says so', () => {
  const n = A.netWorth([A.computedBalance(BANK, { amount: 1_000_000, asOf: '2026-07-01' }, [], [])]);
  assert.strictEqual(n.accountsNeverReconciled.length, 0);
  assert.ok(/grounded in a real balance/.test(n.confidence));
});

t('🔴 land is recorded at what you PAID, and the module says so', () => {
  assert.ok(/RECORD WHAT YOU PAID/.test(A.ACCOUNT_TYPES.land.note));
  assert.ok(/built on a hope/.test(A.ACCOUNT_TYPES.land.note));
});

t('mobile money warns about the 0.5% withdrawal duty', () => {
  assert.ok(/0.5% excise duty/.test(A.ACCOUNT_TYPES.mobile_money.note));
});

// ═══════════════════════════════════════════════════════════════════════════
console.log(fail
  ? `\n\x1b[31m✗ ${fail} ACCOUNTS TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} ACCOUNTS TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
