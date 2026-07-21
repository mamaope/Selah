/**
 * SELAH — UNIT PRICING
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 EVERY LINE IS A UNIT PRICE × A QUANTITY, AND THE PRICE BOOK MAINTAINS ITSELF.
 *
 * Sugar is 1,000 per Kg. Buy 2 Kg and you spent 2,000 — you should not have to do
 * that multiplication, and you should not have to remember the price. So a line
 * carries a QUANTITY, a UNIT, and a UNIT PRICE; the total falls out of the first two.
 *
 * And it works both ways, which is the useful part:
 *
 *   • Give a quantity only → the total is filled from the known unit price.
 *       (2 Kg of sugar → 2,000, because sugar is 1,000/Kg.)
 *
 *   • Give a total that implies a DIFFERENT unit price → the price book UPDATES,
 *     and the change is recorded. (1,200 for 1 Kg → sugar is now 1,200/Kg, up 20%.)
 *
 *   • An item with no known price → the first thing you enter BECOMES the price.
 *       (Rent 600, never set before → rent is now 600.)
 *
 * The rule underneath all three: WHAT YOU ACTUALLY PAID IS THE TRUTH. The unit
 * price in the book is always the most recent real price — never a guess, never an
 * average. That is what makes the price history (engine/values.js) trustworthy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { UGX, refuse } = require('./engine');

/**
 * Resolve one line into { quantity, unit, unitPrice, total, priceChanged, recordPrice }.
 *
 * @param input      { quantity?, unit?, total?, unitPrice? }
 * @param known      { unitPrice, unit } | null   — the item's current price, if any
 *
 * `recordPrice` (when set) is the new unit price to append to the item's history —
 * i.e. the default that should be updated. `null` means the price did not move.
 */
function resolveLine(input, known) {
  const i = input || {};
  const has = (v) => v !== undefined && v !== null && v !== '';

  const qtyGiven = has(i.quantity) && Number(i.quantity) >= 0;
  const totalGiven = has(i.total) && Number(i.total) >= 0;
  const priceGiven = has(i.unitPrice) && Number(i.unitPrice) >= 0;

  // quantity defaults to 1 — "rent 600" is one of a thing that costs 600.
  const quantity = qtyGiven ? Number(i.quantity) : 1;
  const unit = i.unit || (known && known.unit) || null;

  const knownPrice = known && Number(known.unitPrice) >= 0 ? Number(known.unitPrice) : null;

  // ── which figures do we have? ────────────────────────────────────────────
  // 1) an explicit total (what was actually paid) → it is authoritative.
  // 2) an explicit unit price.
  // 3) a known price from the book.
  // We must end up with BOTH a total and a unit price, or we refuse.

  let total, unitPrice, priceChanged = false, recordPrice = null;

  if (totalGiven) {
    total = UGX(i.total);
    // 🔴 WHAT WAS PAID DEFINES THE PRICE. Back the unit price out of it.
    if (quantity > 0) {
      unitPrice = UGX(total / quantity);
    } else {
      // bought zero of something? keep the known/entered price; total is 0.
      unitPrice = priceGiven ? UGX(i.unitPrice) : (knownPrice != null ? knownPrice : 0);
    }
    // did the price move from the book?
    if (knownPrice == null) {
      recordPrice = unitPrice;                 // first time — this becomes the price
    } else if (unitPrice !== knownPrice) {
      priceChanged = true;
      recordPrice = unitPrice;                 // 🔑 the price changed — update the default
    }
  } else if (priceGiven) {
    unitPrice = UGX(i.unitPrice);
    total = UGX(unitPrice * quantity);
    if (knownPrice == null) recordPrice = unitPrice;
    else if (unitPrice !== knownPrice) { priceChanged = true; recordPrice = unitPrice; }
  } else if (knownPrice != null) {
    // 🔑 quantity only → auto-fill the total from the known unit price.
    unitPrice = knownPrice;
    total = UGX(unitPrice * quantity);
    // used the book's price, unchanged — nothing to record.
  } else {
    // nothing to go on: no total, no price entered, no price known.
    return refuse({ label: 'Pricing' }, {
      question: 'How much was it?',
      because: 'This item has no known price yet, and you have entered neither a total nor a unit price.',
      weWillNot: 'We will not invent a number. The first time you record an item, tell us what it cost.',
      whatWouldUnblockThis: 'Type the total, or the price per unit.',
    });
  }

  return {
    quantity,
    unit,
    unitPrice,
    total,
    priceChanged,
    // the value to append to this item's price history (engine/values.js), or null
    recordPrice,
    // a plain-words explanation the UI can show
    note: explain({ quantity, unit, unitPrice, total, knownPrice, priceChanged, recordPrice }),
  };
}

function explain(x) {
  const per = x.unit ? ` per ${x.unit}` : '';
  if (x.priceChanged) {
    const dir = x.unitPrice > x.knownPrice ? 'up from' : 'down from';
    return `Price ${dir} ${x.knownPrice.toLocaleString()}${per} to ${x.unitPrice.toLocaleString()}${per}. The default is updated.`;
  }
  if (x.recordPrice != null && x.knownPrice == null) {
    return `First price recorded: ${x.unitPrice.toLocaleString()}${per}. It becomes the default for this item.`;
  }
  if (x.unit) return `${x.quantity} ${x.unit} × ${x.unitPrice.toLocaleString()} = ${x.total.toLocaleString()}.`;
  return `${x.total.toLocaleString()}.`;
}

module.exports = { resolveLine };
