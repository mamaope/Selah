/**
 * SELAH — MONEY AND CURRENCY, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * One rule, tested from every angle: WE NEVER SILENTLY CONVERT.
 *
 * A person holds 2,500,000 shillings and 200 dollars. Every app on earth prints a
 * single net worth figure. To do that it must pick a rate — and the rate is the
 * only invented thing in the whole calculation. It then puts that invented number
 * at the TOP of the screen, in the LARGEST font on the page, and lets a person
 * make decisions on it.
 *
 * Two true numbers beat one invented one.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const M = require('./money');
const A = require('./accounts');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error(`  \x1b[31m✗ ${name}\x1b[0m\n      ${e.message}`); }
};

// ═══ 1. MINOR UNITS — a float loses a cent, quietly, for ever ═══════════════

t('UGX is whole shillings — the coins are gone', () => {
  assert.strictEqual(M.money(2_500_000, 'UGX').minor, 2_500_000);
  assert.strictEqual(M.CURRENCIES.UGX.decimals, 0);
});

t('🔴 USD is stored as INTEGER CENTS, never as a float', () => {
  const m = M.money(200.50, 'USD');
  assert.strictEqual(m.minor, 20_050);
  assert.strictEqual(Number.isInteger(m.minor), true,
    'store money as a float and you will lose a cent — and a platform that loses cents has no business telling anybody they lost cents');
});

t('a hundred cents added one at a time is exactly one dollar', () => {
  const cents = Array.from({ length: 100 }, () => M.money(0.01, 'USD'));
  assert.strictEqual(M.add(cents).minor, 100);   // 0.01 × 100 in floats is NOT 1
});

t('an unknown currency is not a currency', () => {
  assert.strictEqual(M.money(100, 'KES'), null);
  assert.strictEqual(M.isCurrency('BTC'), false);
});

// ═══ 2. 🔴 UGX + USD IS REFUSED. IT IS A CATEGORY ERROR. ═══════════════════

t('🔴 adding shillings to dollars is REFUSED', () => {
  const r = M.add([M.money(2_500_000, 'UGX'), M.money(200, 'USD')]);
  assert.ok(r.refused);
  assert.ok(/no true total without a rate/.test(r.because));
  assert.ok(/Kikuubo/.test(r.weWillNot), 'the rate at a bureau, at BoU, and at your bank are three different numbers');
});

t('...and the refusal still hands back BOTH true totals', () => {
  const r = M.add([M.money(2_500_000, 'UGX'), M.money(200, 'USD'), M.money(500_000, 'UGX')]);
  const ugx = r.totals.find((x) => x.currency === 'UGX');
  const usd = r.totals.find((x) => x.currency === 'USD');
  assert.strictEqual(ugx.minor, 3_000_000);
  assert.strictEqual(usd.minor, 20_000);
});

t('same currency adds normally', () => {
  assert.strictEqual(M.add([M.money(100, 'UGX'), M.money(250, 'UGX')]).minor, 350);
});

// ═══ 3. CONVERSION — only with a rate a human gave us ══════════════════════

t('🔴 converting with NO rate is REFUSED', () => {
  const r = M.convert(M.money(200, 'USD'), 'UGX');
  assert.ok(r.refused);
  assert.ok(/will not invent a rate/.test(r.weWillNot));
});

t('with a rate, it converts — and says so, for ever', () => {
  const c = M.convert(M.money(200, 'USD'), 'UGX', 3750, '2026-07-12', 'Stanbic buying rate');
  assert.strictEqual(c.minor, 750_000);
  assert.strictEqual(c.converted, true);
  assert.strictEqual(c.rate, 3750);
  assert.ok(/not a fact of the world/.test(c.thisIsConverted),
    'this sentence must survive all the way to the screen');
});

t('converting to the same currency is a no-op, not a conversion', () => {
  const c = M.convert(M.money(100, 'UGX'), 'UGX', 1);
  assert.strictEqual(c.converted, false);
});

// ═══ 4. NET WORTH ACROSS TWO CURRENCIES ═══════════════════════════════════

const bal = (name, type, currency, amount) => ({
  name, type, currency,
  side: type === 'loan' ? 'debt' : 'asset',
  liquid: true, computed: amount, openingAsOf: '2026-07-01',
});

t('🔴 holding UGX and USD with NO rate → there is NO single net worth, and we do not invent one', () => {
  const n = A.netWorth([
    bal('Stanbic', 'bank', 'UGX', 2_500_000),
    bal('USD savings', 'bank', 'USD', 200),
  ]);
  assert.strictEqual(n.netWorth, null,
    'NULL, not zero and not a guess — a screen that forgets to handle this must BREAK LOUDLY rather than print a confident invented figure');
  assert.strictEqual(n.combined.available, false);
  assert.ok(/biggest font on the page/.test(n.combined.weWillNot));
});

t('...and it shows BOTH true totals instead', () => {
  const n = A.netWorth([
    bal('Stanbic', 'bank', 'UGX', 2_500_000),
    bal('USD savings', 'bank', 'USD', 200),
  ]);
  const ugx = n.perCurrency.find((c) => c.currency === 'UGX');
  const usd = n.perCurrency.find((c) => c.currency === 'USD');
  assert.strictEqual(ugx.netWorth.minor, 2_500_000);
  assert.strictEqual(usd.netWorth.minor, 20_000);          // cents
  assert.strictEqual(usd.formatted, '$ 200.00');
});

t('give us a rate and we combine — and the screen says we converted', () => {
  const n = A.netWorth([
    bal('Stanbic', 'bank', 'UGX', 2_500_000),
    bal('USD savings', 'bank', 'USD', 200),
  ], { rate: 3750, on: '2026-07-12', source: 'Stanbic buying rate' });

  assert.strictEqual(n.combined.available, true);
  assert.strictEqual(n.combined.netWorth.minor, 2_500_000 + 750_000);
  assert.strictEqual(n.combined.rate, 3750);
  assert.ok(/not a fact of the world/.test(n.combined.thisIsConverted));
});

t('a USD debt is still subtracted, in USD', () => {
  const n = A.netWorth([bal('USD savings', 'bank', 'USD', 500), bal('USD loan', 'loan', 'USD', 200)]);
  const usd = n.perCurrency.find((c) => c.currency === 'USD');
  assert.strictEqual(usd.netWorth.minor, 30_000);          // $300.00
});

t('a single-currency person still gets a plain, simple number', () => {
  const n = A.netWorth([bal('Stanbic', 'bank', 'UGX', 3_000_000), bal('Loan', 'loan', 'UGX', 1_000_000)]);
  assert.strictEqual(n.netWorth, 2_000_000);
  assert.strictEqual(n.combined, null, 'no currency ceremony for somebody who holds one currency');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log(fail
  ? `\n\x1b[31m✗ ${fail} MONEY TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} MONEY TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
