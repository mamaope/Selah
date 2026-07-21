/**
 * SELAH — UNIT PRICING, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * The founder's four rules, each a test:
 *   1. a unit on the default            (sugar: 1,000 per Kg)
 *   2. quantity only → total auto-fills (2 Kg → 2,000)
 *   3. a different total → the price updates, and the change is recorded (1,200/Kg)
 *   4. an item with no default → the first entry becomes the default (rent 600)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const { resolveLine } = require('./pricing');

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); pass++; } catch (e) { fail++; console.error(`  \x1b[31m✗ ${n}\x1b[0m\n      ${e.message}`); } };

const SUGAR = { unitPrice: 1000, unit: 'Kg' };

// ═══ RULE 2 — quantity only → the total auto-fills from the known price ═════
t('🔑 2 Kg of sugar, no total typed → total auto-fills to 2,000', () => {
  const r = resolveLine({ quantity: 2 }, SUGAR);
  assert.strictEqual(r.total, 2000);
  assert.strictEqual(r.unitPrice, 1000);
  assert.strictEqual(r.unit, 'Kg');
  assert.strictEqual(r.priceChanged, false);
  assert.strictEqual(r.recordPrice, null);   // used the book's price, nothing to record
});

t('...and 1 Kg gives 1,000; quantity defaults to 1 when omitted', () => {
  assert.strictEqual(resolveLine({ quantity: 1 }, SUGAR).total, 1000);
  assert.strictEqual(resolveLine({}, SUGAR).total, 1000);     // "sugar" with nothing → 1 unit
});

// ═══ RULE 3 — a different total → the price UPDATES, change recorded ════════
t('🔑 1 Kg but you paid 1,200 → unit price becomes 1,200 and the change is recorded', () => {
  const r = resolveLine({ quantity: 1, total: 1200 }, SUGAR);
  assert.strictEqual(r.unitPrice, 1200);
  assert.strictEqual(r.total, 1200);
  assert.strictEqual(r.priceChanged, true);
  assert.strictEqual(r.recordPrice, 1200);   // 🔑 append this to the price history
  assert.ok(/up from 1,000.*to 1,200/.test(r.note));
});

t('🔑 2 Kg for 2,400 total → 1,200 per Kg, and that is the new default', () => {
  const r = resolveLine({ quantity: 2, total: 2400 }, SUGAR);
  assert.strictEqual(r.unitPrice, 1200);      // 2400 / 2
  assert.strictEqual(r.priceChanged, true);
  assert.strictEqual(r.recordPrice, 1200);
});

t('paying the SAME price does not record a spurious change', () => {
  const r = resolveLine({ quantity: 3, total: 3000 }, SUGAR);
  assert.strictEqual(r.unitPrice, 1000);
  assert.strictEqual(r.priceChanged, false);
  assert.strictEqual(r.recordPrice, null);
});

// ═══ RULE 4 — an item with NO default → the first entry becomes the default ═
t('🔑 rent 600, never set before → 600 becomes the default (recordPrice set)', () => {
  const r = resolveLine({ total: 600 }, null);
  assert.strictEqual(r.total, 600);
  assert.strictEqual(r.unitPrice, 600);       // qty defaults to 1
  assert.strictEqual(r.recordPrice, 600);     // 🔑 first price → it becomes the default
  assert.strictEqual(r.priceChanged, false);  // there was no old price to change FROM
  assert.ok(/First price recorded/.test(r.note));
});

// ═══ RULE 1 — a unit price entered directly ════════════════════════════════
t('entering a unit price directly computes the total', () => {
  const r = resolveLine({ quantity: 4, unitPrice: 500, unit: 'litre' }, null);
  assert.strictEqual(r.total, 2000);
  assert.strictEqual(r.unit, 'litre');
  assert.strictEqual(r.recordPrice, 500);
});

// ═══ EDGE CASES ════════════════════════════════════════════════════════════
t('🔴 no price known and no amount given → REFUSED, not invented', () => {
  const r = resolveLine({ quantity: 2 }, null);
  assert.ok(r.refused);
  assert.ok(/will not invent a number/.test(r.weWillNot));
});

t('buying zero does not divide by zero', () => {
  const r = resolveLine({ quantity: 0, total: 0 }, SUGAR);
  assert.strictEqual(r.total, 0);
  assert.ok(Number.isFinite(r.unitPrice));
});

t('the unit is inherited from the price book when not re-typed', () => {
  const r = resolveLine({ quantity: 2, total: 2400 }, SUGAR);
  assert.strictEqual(r.unit, 'Kg');
});

t('a fractional implied price rounds to whole shillings', () => {
  const r = resolveLine({ quantity: 3, total: 1000 }, null);   // 333.33 → 333
  assert.strictEqual(r.unitPrice, 333);
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} PRICING TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} PRICING TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
