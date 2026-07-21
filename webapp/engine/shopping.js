/**
 * SELAH — SHOPPING LISTS
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 A SHOPPING LIST IS A PLAN THAT BECOMES SPENDING.
 *
 * You write "grocery": 2 Kg sugar, a gas refill, 5 Kg rice. Before you shop, Selah
 * ESTIMATES the cost — from the price book, the same unit prices your defaults hold.
 * You do not have to remember what sugar costs; you already told it, the last time
 * you bought sugar.
 *
 * Then you shop, and mark each item done with what you ACTUALLY paid. That actual:
 *   1. becomes a real expense in the Book (it happened — it is not a draft), and
 *   2. flows through the pricing engine, so if the price moved, the default updates
 *      and the change is tracked.
 *
 * The loop closes: plan → estimate from the book → shop → the actual updates the book.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 AN ESTIMATE IS A GUESS, AND IT SAYS SO.
 *
 * If we know the price, we estimate. If we do NOT — a first-time item — we show
 * "no price yet", never a made-up number. The estimated total is only the sum of
 * what we actually know, and we say how many items we could not price. A shopping
 * total that quietly invents prices for things it has never seen is the exact kind
 * of comfortable lie this whole product refuses.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const { UGX } = require('./engine');
const PRICE = require('./pricing');

const keyOf = (label) => String(label || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

/**
 * Enrich a list's items with an estimate each, and total the list.
 *
 * @param items     [{ id, label, quantity, unit, status, actualAmount }]
 * @param priceBook { key: { unitPrice, unit } }
 */
function planList(items, priceBook) {
  const book = priceBook || {};
  const list = Array.isArray(items) ? items : [];

  const rows = list.map((it) => {
    const known = book[keyOf(it.label)] || null;
    let estimate = null;
    let unit = it.unit || (known && known.unit) || null;

    if (known) {
      // reuse the pricing engine — quantity × the known unit price
      const r = PRICE.resolveLine({ quantity: it.quantity, unit }, known);
      if (!r.refused) { estimate = r.total; unit = r.unit; }
    }

    const done = it.status === 'done';
    return {
      id: it.id,
      label: it.label,
      quantity: it.quantity != null ? it.quantity : 1,
      unit,
      status: done ? 'done' : 'pending',
      hasPrice: Boolean(known),
      knownUnitPrice: known ? known.unitPrice : null,
      estimate,                                   // null = we have no price yet
      actualAmount: done && it.actualAmount != null ? UGX(it.actualAmount) : null,
      entryId: it.entryId || null,
    };
  });

  const pending = rows.filter((r) => r.status !== 'done');
  const doneRows = rows.filter((r) => r.status === 'done');

  const estimatedTotal = rows.filter((r) => r.estimate != null).reduce((s, r) => s + r.estimate, 0);
  const remainingEstimate = pending.filter((r) => r.estimate != null).reduce((s, r) => s + r.estimate, 0);
  const spentSoFar = doneRows.filter((r) => r.actualAmount != null).reduce((s, r) => s + r.actualAmount, 0);
  const unpriced = rows.filter((r) => !r.hasPrice).map((r) => r.label);

  return {
    rows,
    counts: { total: rows.length, pending: pending.length, done: doneRows.length },

    estimatedTotal,
    remainingEstimate,          // estimate of what is still to buy
    spentSoFar,                 // actual, from items already marked done

    // 🔴 said out loud: the estimate covers only the items we could price.
    unpricedCount: unpriced.length,
    unpriced,
    note: unpriced.length
      ? `${unpriced.length} item${unpriced.length === 1 ? '' : 's'} have no price yet, so ${unpriced.length === 1 ? 'it is' : 'they are'} not in the estimate. The first time you buy ${unpriced.length === 1 ? 'it' : 'them'}, the price is learned.`
      : null,

    // how the real total compared to the guess, once things are bought
    variance: (doneRows.length && doneRows.every((r) => r.estimate != null))
      ? spentSoFar - doneRows.reduce((s, r) => s + (r.estimate || 0), 0)
      : null,
  };
}

module.exports = { planList, keyOf };
