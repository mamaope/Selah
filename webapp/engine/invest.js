/**
 * SELAH — WHERE YOUR MONEY COULD WORK  (Ugandan savings & investment ladder)
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THIS IS INFORMATION, NOT ADVICE. Selah is not a licensed financial adviser and
 * this is not a recommendation to buy any product, nor a solicitation. It lists
 * options that exist in the Ugandan market with their real characteristics, and —
 * the one thing generic guidance never does — the AFTER-TAX return for your money,
 * using the same tax engine as the rest of Selah. Verify every figure and current
 * terms with the provider, and take a licensed adviser for a decision.
 *
 * 🔑 THE FIGURES ARE SOURCED, DATED AND CONFIDENCE-RATED, exactly like the tax
 * rules. A rate is a snapshot, not a promise; markets move, and a number here that
 * is three months old is a number to re-check, not to trust.
 * ─────────────────────────────────────────────────────────────────────────────
 * Sources (verified 2026-07-22):
 *  - 364-day T-bill ~12.0% (Jun 2026); T-bill/bond min UGX 100,000 — Bank of Uganda.
 *  - WHT on interest: T-bills & short bonds (2/3/5y) 20%; long bonds (10/15/20y) 10%;
 *    bank/fixed-deposit interest 15% — URA / Income Tax Act.
 *  - Money market funds ~11–13% p.a. (e.g. UAP Old Mutual MMF ~12%, Sanlam Income
 *    ~13%, mid-2025), quoted NET of fees and tax; min from ~UGX 100,000 — CMA-licensed
 *    managers (UAP Old Mutual, Sanlam, ICEA Lion, Britam, XENO, Stanbic, SBG, Cornerstone).
 */

const DISCLAIMER =
  'Information, not advice. Selah is not a licensed financial adviser, this is not a recommendation to buy any product, and it is not a solicitation. Rates are snapshots that move — verify current terms with the provider, and see a licensed adviser before deciding.';

const VERIFIED_ON = '2026-07-22';

// 🔑 The vehicles, each sourced. `taxedInterest` → after-tax is shown; `netQuoted`
//    means the provider already quotes net of tax and fees, so we do NOT re-tax it.
const VEHICLES = [
  {
    key: 'savings_account', name: 'Savings account (bank / mobile)', category: 'Buffer',
    liquidity: 'instant', horizon: 'any', risk: 'very low', minInvest: 0,
    grossReturnRange: [2, 5], taxedInterest: true, whtPct: 15,
    providers: ['Any bank', 'MTN MoMo / Airtel savings', 'a SACCO'],
    note: 'Where your emergency fund and short-term money belongs — reachable, safe, low return.',
    confidence: 'medium', source: 'General market; interest WHT 15% (URA).',
  },
  {
    key: 'mmf', name: 'Money market fund (unit trust)', category: 'Buffer / short-term',
    liquidity: '2–5 working days', horizon: '0–3 years', risk: 'low', minInvest: 100_000,
    grossReturnRange: [11, 13], netQuoted: true,
    providers: ['UAP Old Mutual', 'Sanlam', 'ICEA Lion', 'Britam', 'XENO', 'Stanbic'],
    note: 'Higher yield than a savings account, still near-liquid. Yields are quoted net of fees and tax. Not guaranteed, and not deposit-insured.',
    confidence: 'medium', source: 'CMA-licensed managers; ~11–13% mid-2025 (verify current).',
  },
  {
    key: 'tbill', name: 'Treasury bill', category: 'Short-term',
    liquidity: 'held 91–364 days (or sell on secondary market)', horizon: '3–12 months', risk: 'very low', minInvest: 100_000,
    grossReturnRange: [11.5, 12.5], taxedInterest: true, whtPct: 20,
    providers: ['Bank of Uganda (CDS account)', 'a commercial bank', 'a broker (e.g. SBG, Crested)'],
    note: 'Lending to the government for under a year. As safe as it gets in UGX. Your money is committed until maturity.',
    confidence: 'high', source: 'Bank of Uganda — 364-day ~12.0% Jun 2026; WHT 20%.',
  },
  {
    key: 'tbond', name: 'Treasury bond', category: 'Long-term',
    liquidity: '2–20 year term (coupons every 6 months; sellable on secondary market)', horizon: '2+ years', risk: 'low', minInvest: 100_000,
    grossReturnRange: [12, 16], taxedInterest: true, whtPct: 20,
    providers: ['Bank of Uganda (CDS account)', 'a commercial bank', 'a broker'],
    note: 'Locks a rate for years and pays you every six months. Long bonds (10y+) are taxed at 10%, not 20%. Selling early is at the market price of the day.',
    confidence: 'high', source: 'Bank of Uganda; WHT 20% (2/3/5y), 10% (10/15/20y).',
  },
  {
    key: 'fixed_deposit', name: 'Fixed deposit', category: 'Short/long-term',
    liquidity: 'locked for the term', horizon: '1 month–2 years', risk: 'very low', minInvest: 0,
    grossReturnRange: [8, 12], taxedInterest: true, whtPct: 15,
    providers: ['Any bank (rates vary widely — shop around)'],
    note: 'A fixed rate for a fixed term. Breaking it early usually costs the interest. Rates differ a lot between banks.',
    confidence: 'low', source: 'Bank-specific; verify the rate. Interest WHT 15%.',
  },
  {
    key: 'sacco', name: 'SACCO', category: 'Buffer / community',
    liquidity: 'savings usually withdrawable; shares usually not', horizon: 'any', risk: 'low–medium', minInvest: 0,
    grossReturnRange: [8, 14], netQuoted: true,
    providers: ['Your SACCO'],
    note: 'Returns are dividends declared yearly and vary by SACCO. Access to affordable credit is often the real benefit. Not deposit-insured — the SACCO’s governance matters.',
    confidence: 'low', source: 'Varies by SACCO; confirm dividend history and governance.',
  },
  {
    key: 'equity_fund', name: 'Equity / balanced unit trust', category: 'Growth (long-term)',
    liquidity: 'a few working days', horizon: '5+ years', risk: 'higher — value moves', minInvest: 100_000,
    grossReturnRange: null, netQuoted: true,
    providers: ['UAP Old Mutual', 'Sanlam', 'ICEA Lion', 'Britam', 'XENO'],
    note: 'For money you will not need for years. Value goes down as well as up; the point is long-run growth, not a steady yield. Only after your buffer is built.',
    confidence: 'low', source: 'CMA-licensed managers; returns not guaranteed and vary.',
  },
  {
    key: 'land', name: 'Land / property', category: 'Growth (long-term)',
    liquidity: 'illiquid — can take months to sell', horizon: '5+ years', risk: 'medium; title risk', minInvest: 0,
    grossReturnRange: null, netQuoted: true,
    providers: ['Direct purchase'],
    note: 'A common Ugandan store of value, but only real once sold, and only if the title is clean. Never your emergency fund.',
    confidence: 'low', source: 'Market-specific; verify title and valuation.',
  },
];

const round1 = (n) => Math.round(n * 10) / 10;

/** After-tax range for an interest-bearing vehicle. netQuoted vehicles pass through. */
function afterTax(v) {
  if (!v.grossReturnRange) return null;
  if (v.netQuoted || !v.taxedInterest) return v.grossReturnRange.slice();
  const f = 1 - (v.whtPct || 0) / 100;
  return v.grossReturnRange.map((r) => round1(r * f));
}

/** Every vehicle, with after-tax return computed and the tax shown as working. */
function vehicles() {
  return VEHICLES.map((v) => ({
    ...v,
    netReturnRange: afterTax(v),
    taxWorking: (v.grossReturnRange && v.taxedInterest && !v.netQuoted)
      ? `${v.grossReturnRange[0]}–${v.grossReturnRange[1]}% before tax, ${v.whtPct}% withheld → ${round1(v.grossReturnRange[1] * (1 - v.whtPct / 100))}% net at the top`
      : (v.netQuoted ? 'Quoted net of tax and fees.' : null),
  }));
}

// The rungs of the ladder — WHERE you are decides WHAT fits.
function ladder(situation = {}) {
  const runway = Number(situation.runwayMonths) || 0;
  const hasEF = Boolean(situation.hasEmergencyFund);

  let rung, headline, guidance, fits;
  if (!hasEF || runway < 3) {
    rung = 'buffer';
    headline = 'Build the buffer first';
    guidance = 'Before anything is invested or locked, fill your emergency fund to about three months of expenses — and keep it liquid. Locking money you might need next month is the most expensive mistake here.';
    fits = ['savings_account', 'mmf', 'sacco'];
  } else if (runway < 6) {
    rung = 'short';
    headline = 'Short-term, still reachable';
    guidance = 'Your buffer is taking shape. Money you may need within a year or two can earn more without being locked away — but keep it low-risk and accessible.';
    fits = ['mmf', 'tbill', 'fixed_deposit', 'sacco'];
  } else {
    rung = 'invest';
    headline = 'Beyond the buffer — money that can work';
    guidance = 'With six months of runway behind you, money you will not need for years can take more risk for more return, and can be locked for a better rate. Match the horizon to the vehicle: a bond you hold to maturity, a fund you leave for years.';
    fits = ['tbond', 'tbill', 'fixed_deposit', 'equity_fund', 'land', 'mmf'];
  }

  return { rung, headline, guidance, fits, runwayMonths: round1(runway), hasEmergencyFund: hasEF };
}

module.exports = { DISCLAIMER, VERIFIED_ON, VEHICLES, vehicles, afterTax, ladder };
