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


// ═══════════════════════════════════════════════════════════════════════════
// FORECAST — what you are likely due to buy, from your own history.
//
// 🔑 A PATTERN, NOT A GUESS ABOUT ONE PURCHASE. We look only at items you have
//    bought REPEATEDLY (3+ times). For those, we learn the rhythm — the typical
//    gap between purchases — and, if you are at or past ~80% of that gap since you
//    last bought it, we say it is due. Quantity is your usual quantity; cost is
//    priced from the book, and left blank if the book cannot price it.
//
// 🔴 IT IS A FORECAST, AND IT SAYS SO. An item bought once or twice is NOT a
//    pattern and is never forecast. We never invent a cadence from a single gap
//    of nonsense, and we never invent a price. This is what a careful person would
//    infer from your receipts — nothing more.
// ═══════════════════════════════════════════════════════════════════════════

const DAY = 86400000;
const median = (xs) => {
  const a = xs.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
};

/**
 * @param history [{ key, label, unit, unitPrice, purchases: [{ asOf, quantity }] }]
 * @param opts    { asOf: 'YYYY-MM-DD', minHistory=3, dueAt=0.8 }
 * @returns { asOf, items:[...], estimatedTotal, unpricedCount, note }
 */
function forecastDue(history, opts = {}) {
  const asOf = opts.asOf || new Date().toISOString().slice(0, 10);
  const minHistory = opts.minHistory || 3;      // fewer than this is not a pattern
  const dueAt = opts.dueAt != null ? opts.dueAt : 0.8;   // due at 80% of the cadence
  const now = Date.parse(asOf + 'T00:00:00Z');

  const items = [];
  for (const h of history || []) {
    const buys = (h.purchases || [])
      .filter((b) => b && b.asOf)
      .sort((a, b) => String(a.asOf).localeCompare(String(b.asOf)));
    if (buys.length < minHistory) continue;      // 🔴 not enough to call it a rhythm

    const gaps = [];
    for (let i = 1; i < buys.length; i++) {
      const g = Math.round((Date.parse(buys[i].asOf) - Date.parse(buys[i - 1].asOf)) / DAY);
      if (g > 0) gaps.push(g);
    }
    if (!gaps.length) continue;                  // all on one day — no cadence

    const cadence = median(gaps);
    const last = buys[buys.length - 1].asOf;
    const daysSince = Math.round((now - Date.parse(last + 'T00:00:00Z')) / DAY);
    if (daysSince < cadence * dueAt) continue;   // not due yet — leave it off

    const dueIn = cadence - daysSince;           // ≤ 0 means overdue
    const typicalQty = median(buys.map((b) => (b.quantity != null ? Number(b.quantity) : 1)));
    const unitPrice = h.unitPrice != null ? Number(h.unitPrice) : null;
    const estimate = unitPrice != null ? UGX(typicalQty * unitPrice) : null;

    const every = cadence === 1 ? 'about every day' : `about every ${cadence} days`;
    const when = dueIn < 0 ? `${-dueIn} day${dueIn === -1 ? '' : 's'} overdue`
               : dueIn === 0 ? 'due today'
               : `due in ${dueIn} day${dueIn === 1 ? '' : 's'}`;
    items.push({
      key: h.key, label: h.label, unit: h.unit || null,
      quantity: typicalQty, timesBought: buys.length, cadenceDays: cadence,
      lastBought: last, daysSince, dueIn, overdue: dueIn < 0,
      estimate,
      says: `Bought ${buys.length} times, ${every}; last ${daysSince} day${daysSince === 1 ? '' : 's'} ago — ${when}.`,
    });
  }

  // most overdue first — the things you have gone longest without
  items.sort((a, b) => a.dueIn - b.dueIn);

  const priced = items.filter((i) => i.estimate != null);
  const unpriced = items.filter((i) => i.estimate == null);
  return {
    asOf,
    items,
    estimatedTotal: priced.reduce((s, i) => s + i.estimate, 0),
    unpricedCount: unpriced.length,
    note: items.length
      ? 'A forecast from your own buying history — a guess, not a list you must buy. Only things you buy repeatedly appear here.'
      : 'Not enough history yet to forecast. Keep recording what you buy, and items you purchase regularly will start to show up here.',
  };
}

module.exports = { planList, keyOf, forecastDue };
