/**
 * SELAH — INVESTMENT LADDER, EXECUTED
 * The after-tax return is the moat: gross × (1 − WHT). netQuoted vehicles are not
 * re-taxed. The rung you are on is decided by your runway. Everything is sourced.
 */
const assert = require('assert');
const I = require('./invest');

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); pass++; } catch (e) { fail++; console.error(`  \x1b[31m✗ ${n}\x1b[0m\n      ${e.message}`); } };

// ── AFTER-TAX MATH — the point of the feature ────────────────────────────────

t('🔑 a T-bill at 12% with 20% WHT is 9.6% AFTER TAX', () => {
  const v = I.VEHICLES.find((x) => x.key === 'tbill');
  const net = I.afterTax({ ...v, grossReturnRange: [12, 12] });
  assert.strictEqual(net[0], 9.6);
});

t('🔑 fixed-deposit interest is taxed at 15% — 12% gross → 10.2% net', () => {
  const net = I.afterTax({ grossReturnRange: [12, 12], taxedInterest: true, whtPct: 15 });
  assert.strictEqual(net[0], 10.2);
});

t('🔴 a net-quoted fund is NOT taxed again', () => {
  const v = I.VEHICLES.find((x) => x.key === 'mmf');
  const net = I.afterTax(v);
  assert.deepStrictEqual(net, v.grossReturnRange);      // unchanged
});

t('vehicles() attaches a net range and shows the tax working', () => {
  const tbill = I.vehicles().find((x) => x.key === 'tbill');
  assert.ok(Array.isArray(tbill.netReturnRange));
  assert.ok(/withheld/.test(tbill.taxWorking));
});

// ── THE LADDER — where you are decides what fits ─────────────────────────────

t('🔴 no emergency fund → build the buffer first; nothing is locked', () => {
  const l = I.ladder({ runwayMonths: 0, hasEmergencyFund: false });
  assert.strictEqual(l.rung, 'buffer');
  assert.ok(!l.fits.includes('tbond'));                 // no locking money you may need
  assert.ok(l.fits.includes('mmf'));
});

t('under six months → short-term, still reachable', () => {
  const l = I.ladder({ runwayMonths: 4, hasEmergencyFund: true });
  assert.strictEqual(l.rung, 'short');
  assert.ok(l.fits.includes('tbill'));
});

t('🔑 six months+ → beyond the buffer, money that can work', () => {
  const l = I.ladder({ runwayMonths: 8, hasEmergencyFund: true });
  assert.strictEqual(l.rung, 'invest');
  assert.ok(l.fits.includes('tbond') && l.fits.includes('equity_fund'));
});

// ── DISCIPLINE — sourced, dated, and framed as information not advice ────────

t('🔴 every vehicle is sourced and confidence-rated', () => {
  assert.ok(I.VEHICLES.every((v) => v.source && v.confidence && v.providers && v.providers.length));
});

t('🔴 the not-advice disclaimer is present and explicit', () => {
  assert.ok(/not.*licensed financial adviser/i.test(I.DISCLAIMER));
  assert.ok(/not a recommendation|not a solicitation/i.test(I.DISCLAIMER));
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} INVEST TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} INVEST TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
