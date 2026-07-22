/**
 * SELAH — SAVINGS & RESILIENCE
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 SAVINGS IS NOT A NEW POT. It is a lens on money you already track.
 *
 * Your accounts already say what they are — liquid or not, asset or debt. "Saving"
 * is money in a savings or investment account — not the cash, MoMo and current-account
 * money you spend from day to day. This module reads those balances and answers a
 * saver actually asks:
 *
 *   1. HOW LONG WOULD I LAST?  — runway: liquid savings ÷ what a month costs you.
 *   2. HOW AM I DOING, AND WHAT IS NEXT?  — a resilience ladder you climb rung by
 *      rung: no cushion → one month → three → six → a year and into investing.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE RUNGS ARE EARNED, AND HONEST.
 *
 * A rung is reached only by money that is actually liquid and actually there. Land
 * you cannot eat next month, and a fixed deposit is locked — the accounts engine
 * already knows this, and we defer to it. We never celebrate a cushion built from
 * money you cannot reach, and if we do not yet know what a month costs you, we say
 * the runway is unknown rather than divide by zero and hand you a proud, empty
 * number. The gamification motivates a real thing or it motivates nothing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const { UGX } = require('./engine');
const ACC = require('./accounts');

// The ladder. Each rung is a number of months of expenses covered by LIQUID money.
const RUNGS = [
  { key: 'none',  label: 'No cushion yet',        atMonths: 0,
    blurb: 'Every shock lands straight on you. The first month of runway is the biggest one you will ever build.' },
  { key: 'one',   label: 'One month',             atMonths: 1,
    blurb: 'One month between you and a bad week. Aim for three.' },
  { key: 'three', label: 'Three months',          atMonths: 3,
    blurb: 'Thin, but standing. Most emergencies are survivable from here.' },
  { key: 'six',   label: 'Six months',            atMonths: 6,
    blurb: 'Solid. A lost job or a big bill will not sink you.' },
  { key: 'year',  label: 'A year — and investing', atMonths: 12,
    blurb: 'Beyond a buffer. Money past this point is money that can be put to work.' },
];

/**
 * Where are you on the ladder, and what does the next rung cost?
 * @param months            runway in months (liquid ÷ monthly outgoings), or null
 * @param monthlyOutgoings  what a month costs you (minor units), for "how much more"
 */
function resilience(months, monthlyOutgoings) {
  const m = Number(months) || 0;
  const out = UGX(monthlyOutgoings);

  // current rung = the highest one you have actually reached
  let idx = 0;
  for (let i = 0; i < RUNGS.length; i++) if (m >= RUNGS[i].atMonths) idx = i;

  const current = RUNGS[idx];
  const next = RUNGS[idx + 1] || null;
  const needMore = next && out > 0 ? UGX((next.atMonths - m) * out) : null;

  return {
    level: idx,
    maxLevel: RUNGS.length - 1,
    key: current.key,
    label: current.label,
    blurb: current.blurb,
    months: Math.round(m * 10) / 10,
    next: next
      ? { key: next.key, label: next.label, atMonths: next.atMonths, needMore }
      : null,                                  // null = top of the ladder
    ladder: RUNGS.map((r, i) => ({
      key: r.key, label: r.label, atMonths: r.atMonths, reached: i <= idx, current: i === idx,
    })),
  };
}

/**
 * The whole savings picture, from account balances and what a month costs.
 * Never refuses: if a month's cost is unknown, it still shows what you hold and
 * simply says the runway cannot be computed yet.
 *
 * @param balances          [{ name, type, side, liquid, computed, currency }]
 * @param monthlyOutgoings  minor units, or 0/undefined if not yet known
 */
function overview(balances, monthlyOutgoings) {
  const bs = Array.isArray(balances) ? balances : [];
  const out = UGX(monthlyOutgoings);

  // 🔑 SAVINGS IS MONEY IN A SAVINGS/INVESTMENT ACCOUNT — not cash, not MoMo, not
  //    your current account. Those hold this month's spending, not a cushion.
  const savings = bs.filter((b) => b.side === 'asset' && ACC.isSavings(b));

  // 🔑 THE EMERGENCY FUND IS ITS OWN ACCOUNT. The runway is measured against THAT
  //    account alone — not every liquid shilling you happen to hold. Your SACCO and
  //    your fixed deposit are savings, but they are not your emergency cushion unless
  //    you have decided they are, by putting the money in the emergency-fund account.
  const efAccounts    = savings.filter((b) => ACC.isEmergencyFund(b));
  const otherLiquid   = savings.filter((b) => !ACC.isEmergencyFund(b) && b.liquid);
  const lockedAccounts = savings.filter((b) => !ACC.isEmergencyFund(b) && !b.liquid);

  const emergencyFund    = efAccounts.reduce((a, b) => a + UGX(b.computed), 0);
  const otherLiquidTotal = otherLiquid.reduce((a, b) => a + UGX(b.computed), 0);
  const longTerm         = lockedAccounts.reduce((a, b) => a + UGX(b.computed), 0);

  const knowMonthly = out > 0;
  // runway = how many months the EMERGENCY FUND ACCOUNT covers
  const months = knowMonthly && emergencyFund > 0 ? emergencyFund / out
               : knowMonthly ? 0
               : null;

  const shape = (b) => ({ name: b.name, type: b.type, amount: UGX(b.computed), liquid: Boolean(b.liquid) });

  return {
    emergencyFund,                             // the balance of your emergency-fund account(s)
    hasEmergencyFund: efAccounts.length > 0,
    emergencyAccounts: efAccounts.map(shape),

    otherLiquid: otherLiquid.map(shape),       // liquid savings that are NOT the emergency fund
    otherLiquidTotal,
    longTerm,                                  // locked or working (fixed deposits, shares, land…)
    longTermAccounts: lockedAccounts.map(shape),

    totalSaved: emergencyFund + otherLiquidTotal + longTerm,
    monthlyOutgoings: out,
    knowMonthly,
    runwayMonths: months != null ? Math.round(months * 10) / 10 : null,
    resilience: months != null ? resilience(months, out) : null,

    // 🔴 said out loud: no emergency-fund account, or no month cost to divide by
    note: efAccounts.length === 0
      ? 'Your emergency fund lives in its own account. Add an “Emergency fund” account and move money into it — three to six months of expenses, kept for emergencies only.'
      : (knowMonthly ? null : 'Confirm a month of spending in your Books, and Selah can tell you how many months your emergency fund covers.'),
  };
}

module.exports = { RUNGS, resilience, overview };
