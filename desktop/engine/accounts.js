/**
 * SELAH — ACCOUNTS
 * ─────────────────────────────────────────────────────────────────────────────
 * A Book tracks money MOVING. An account tracks money SITTING. Flow and stock.
 *
 * Most personal finance apps blur the two and double-count: the salary arrives as
 * income AND raises the bank balance, so net worth grows twice for one payday.
 * Here the two are joined by exactly one rule, and it is arithmetic, not opinion:
 *
 *     closing = opening + (confirmed money IN) − (confirmed money OUT) ± transfers
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WE CANNOT SEE YOUR BALANCES. WE ARE NOT A BANK.
 *
 * There is no Open Banking in Uganda, we do not screen-scrape, and we will not.
 * So every figure here is either something YOU recorded, or something we COMPUTED
 * from what you recorded. It is never something we observed.
 *
 * A computed balance is only as good as what was written down — and Ugandan life
 * is full of cash that never gets written down. Left alone, a derived balance
 * becomes fiction within about six weeks, and it does so QUIETLY, which is the
 * dangerous part.
 *
 * So the month is RE-GROUNDED IN REALITY. On the 1st you record what the account
 * ACTUALLY says. We compute what it SHOULD have said. The difference is not an
 * error to be smoothed away — it is money that left your life without being
 * recorded, and it is the single most useful number in this module:
 *
 *              WHERE DID IT ACTUALLY GO?
 *
 * We show it. We do not absorb it. And because every month starts from reality,
 * the error can never compound.
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 A TRANSFER IS NOT INCOME. IT IS NOT SPENDING EITHER.
 *
 * Moving 500,000 from the bank to MoMo makes you no richer and no poorer. Count it
 * as income and your savings rate is a fantasy; count it as spending and you look
 * broke. It touches TWO accounts and ZERO totals. This is the single most common
 * way a personal finance app lies about a person's money.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { UGX, refuse } = require('./engine');
const M = require('./money');

/**
 * 🔴 `liquid` IS NOT DECORATION. It decides the emergency-fund answer — "how many
 * months could I survive?" — and getting it wrong is the difference between a
 * comforting number and a true one.
 *
 * Land is not liquid. A VSLA pays out at the END of its cycle. A fixed deposit is
 * fixed. Money a cousin owes you is not money. NONE of these can be eaten next
 * month, and none of them may be counted as though they could.
 */
const ACCOUNT_TYPES = {
  cash:          { label: 'Cash',                     side: 'asset', liquid: true },
  mobile_money:  { label: 'Mobile money',             side: 'asset', liquid: true,
                   note: 'MTN MoMo, Airtel Money. Withdrawals carry a 0.5% excise duty — the balance you see is not the cash you get.' },
  bank:          { label: 'Bank account',             side: 'asset', liquid: true },

  sacco:         { label: 'SACCO savings',            side: 'asset', liquid: true,
                   note: 'SACCO SAVINGS are usually withdrawable. SACCO SHARES usually are NOT. If this account is shares, mark it as not liquid.' },
  vsla:          { label: 'Village savings (VSLA)',   side: 'asset', liquid: false,
                   note: 'A VSLA pays out at the END of the cycle. It is real money and you cannot touch it next month.' },
  fixed_deposit: { label: 'Fixed deposit',            side: 'asset', liquid: false,
                   note: 'Fixed. Breaking it early usually costs the interest.' },

  unit_trust:    { label: 'Unit trust',               side: 'asset', liquid: true,
                   note: 'Usually redeemable in a few working days. Its VALUE moves — what you record is what it is worth today, not what you put in.' },
  treasury:      { label: 'Treasury bills / bonds',   side: 'asset', liquid: false,
                   note: 'Held to maturity unless you sell on the secondary market at whatever it fetches.' },
  shares:        { label: 'Shares',                   side: 'asset', liquid: false,
                   note: 'The USE is thin. "Worth" and "what somebody will pay you this week" are not the same number.' },
  land:          { label: 'Land / property',          side: 'asset', liquid: false,
                   note: '🔴 RECORD WHAT YOU PAID, not what you think it is worth. Nobody knows what a plot is worth until it sells, and a net worth built on a hoped-for land price is a net worth built on a hope.' },

  loan:          { label: 'Loan (you owe)',           side: 'debt' },
  borrowing:     { label: 'Informal borrowing',       side: 'debt',
                   note: 'Money owed to family, a friend, a shopkeeper. It is still debt.' },

  receivable:    { label: 'Owed to you',              side: 'asset', liquid: false,
                   note: '🔴 Money a person owes you is NOT money you have. It is not liquid, it may never arrive, and counting it as savings is how people discover they have no savings.' },
};

const isAsset  = (a) => (ACCOUNT_TYPES[a.type] || {}).side === 'asset';
const isDebt   = (a) => (ACCOUNT_TYPES[a.type] || {}).side === 'debt';
const isLiquid = (a) => a.liquid !== undefined ? Boolean(a.liquid) : Boolean((ACCOUNT_TYPES[a.type] || {}).liquid);

// ─────────────────────────────────────────────────────────────────────────────
// THE BALANCE
// ─────────────────────────────────────────────────────────────────────────────

/** Only money that MOVED. A draft touches no balance, ever. */
const MOVED = new Set(['confirmed', 'unplanned']);

/**
 * What this account SHOULD hold, given what was recorded.
 *
 * @param opening  { amount, asOf }  — what the account ACTUALLY said on the 1st.
 * @param entries  confirmed Book entries, each naming an accountId
 * @param transfers [{ fromAccountId, toAccountId, amount, status }]
 */
function computedBalance(account, opening, entries, alsoTransfers) {
  const acc = account || {};

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 ONE REPRESENTATION OF A TRANSFER. NOT TWO.
  //
  // This function once took transfers as a SEPARATE ARRAY, while books.js recorded
  // them as entries with `direction: 'transfer'`. Two descriptions of the same
  // event, maintained in two places, is not a design — it is a countdown. They will
  // drift, and when they do, a transfer will exist for the balance and not for the
  // summary (or the reverse), and money will appear or vanish with every total
  // still adding up perfectly.
  //
  // A transfer is an ENTRY, like everything else. It carries fromAccountId and
  // toAccountId, it counts in NO income or spending total, and it moves exactly two
  // balances. The legacy array is still accepted, and merged, so nothing breaks.
  // ═══════════════════════════════════════════════════════════════════════════
  const all = (Array.isArray(entries) ? entries : []).concat(Array.isArray(alsoTransfers) ? alsoTransfers : []);
  const moved = all.filter((e) => MOVED.has(e.status));

  const es = moved.filter((e) => (e.direction === 'in' || e.direction === 'out') && e.accountId === acc.id);
  const ts = moved.filter((e) => e.direction === 'transfer' || (e.fromAccountId && e.toAccountId));

  const amt = (e) => UGX(e.actual != null ? e.actual : e.expected != null ? e.expected : e.amount);

  const inflow  = es.filter((e) => e.direction === 'in').reduce((a, e) => a + amt(e), 0);
  const outflow = es.filter((e) => e.direction === 'out').reduce((a, e) => a + amt(e), 0);

  // 🔴 A transfer moves money and changes NO total. It only relocates it.
  const transferIn  = ts.filter((t) => t.toAccountId === acc.id).reduce((a, t) => a + amt(t), 0);
  const transferOut = ts.filter((t) => t.fromAccountId === acc.id).reduce((a, t) => a + amt(t), 0);

  const start = UGX((opening || {}).amount || 0);

  // 🔑 A DEBT MOVES THE OTHER WAY. Money "in" to a loan account is a REPAYMENT — it
  // makes the debt SMALLER. Treat a loan like a bank account and every repayment
  // grows what you owe, and the arithmetic never once complains.
  const computed = isDebt(acc)
    ? start - inflow + outflow + transferOut - transferIn
    : start + inflow - outflow + transferIn - transferOut;

  return {
    accountId: acc.id,
    name: acc.name,
    type: acc.type,
    side: isDebt(acc) ? 'debt' : 'asset',
    liquid: isLiquid(acc),

    openingRecorded: start,
    openingAsOf: (opening || {}).asOf || null,

    moneyIn: inflow,
    moneyOut: outflow,
    transferredIn: transferIn,
    transferredOut: transferOut,

    computed,

    /**
     * 🔴 A NEGATIVE CASH BALANCE IS NOT A NUMBER. IT IS A SIGNAL.
     *
     * You cannot have minus 250,000 in mobile money. The arithmetic is right and the
     * world is not — so something recorded is wrong: money came in and was never
     * logged, or an entry was filed against the wrong account.
     *
     * The lazy thing is to print the negative and move on. It is arithmetically
     * defensible and it is useless: the person stares at an impossible number and
     * concludes the app is broken. Which, in the only sense that matters, it is.
     */
    impossible: isDebt(acc) ? false : computed < 0,
    impossibleBecause: (!isDebt(acc) && computed < 0)
      ? `You cannot hold ${UGX(computed).toLocaleString()} in ${acc.name}. Either money arrived that was never recorded, or something was logged against the wrong account. Reconcile this one — tell us what it actually says.`
      : null,

    /**
     * 🔴 THE WORD "COMPUTED" IS DOING WORK HERE, AND IT MUST BE ON THE SCREEN.
     * We did not look in your wallet. This is arithmetic on what you wrote down.
     */
    thisIsNotObserved: 'We cannot see your accounts. This is what the balance SHOULD be, given everything you recorded. Check it against the real thing.',
    entriesCounted: es.length,
    transfersCounted: transferIn + transferOut > 0 ? ts.filter((t) => t.toAccountId === acc.id || t.fromAccountId === acc.id).length : 0,
  };
}

/**
 * 🔑 RECONCILIATION — the "where did it actually go" number.
 *
 * You tell us what the account really said. We tell you what it should have said.
 * The difference is money that left your life unrecorded. We do NOT absorb it, and
 * we do NOT quietly correct the books: we post it as a visible, named fact.
 */
function reconcile(computed, actualAmount, asOf) {
  if (actualAmount === null || actualAmount === undefined || isNaN(Number(actualAmount))) {
    return refuse({ label: 'Accounts' }, {
      question: 'What does the account actually say?',
      because: 'We cannot reconcile against a number you have not given us.',
      weWillNot: 'We will not guess your balance. We are not your bank and we cannot see it.',
      whatWouldUnblockThis: 'Dial *165# (or check your statement) and tell us the figure.',
    });
  }

  const actual = UGX(actualAmount);
  const expected = UGX(computed.computed);
  const gap = expected - actual;                 // positive: money is MISSING

  return {
    accountId: computed.accountId,
    name: computed.name,
    asOf: asOf || null,
    weComputed: expected,
    youSay: actual,
    difference: gap,
    matches: gap === 0,

    unaccounted: gap > 0 ? gap : 0,
    unexplainedIncrease: gap < 0 ? -gap : 0,

    headline: gap === 0
      ? 'The books match reality.'
      : gap > 0
        ? `${UGX(gap).toLocaleString()} left this account and was never recorded.`
        : `${UGX(-gap).toLocaleString()} arrived in this account and was never recorded.`,

    /**
     * 🔴 THE GAP IS NOT AN ERROR. IT IS THE ANSWER TO THE QUESTION EVERYBODY ASKS.
     *
     * "Where does my money go?" — THIS is where. It is the airtime, the boda, the
     * soda, the cousin, the thing you did not write down. Every app that silently
     * resets the balance to match the bank destroys this number, which is the most
     * useful one it had.
     */
    whatThisMeans: gap > 0
      ? 'This is not a bug in the app. It is spending that never got written down — airtime, boda, the small things. It is the honest answer to "where does my money go?", and no other app will show it to you.'
      : gap < 0
        ? 'Money came in that you did not record. A refund, a repayment, a gift, or an entry logged against the wrong account.'
        : null,

    // The books are now re-grounded in reality. Drift cannot compound.
    newOpening: { amount: actual, asOf: asOf || null },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW AM I DOING?
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param rate  { rate, on, source } — OPTIONAL. Given by a human, or not at all.
 *
 * 🔴 IF THIS PERSON HOLDS DOLLARS AND HAS NOT GIVEN US A RATE, THERE IS NO SINGLE
 *    NET WORTH FIGURE, AND WE DO NOT PRODUCE ONE.
 *
 * Every app produces one anyway. It picks a rate — some rate, any rate — and puts
 * the result at the top of the screen in the largest font on the page. The dollars
 * are real and the shillings are real; the RATE is invented, and it is now the most
 * prominent number in the person's financial life.
 *
 * We show two true totals instead of one invented one. If they want them combined,
 * they give us the rate they would ACTUALLY get — and the screen says, for ever,
 * that this figure was converted, at that rate, on that day.
 */
function netWorth(balances, rate) {
  const bs = Array.isArray(balances) ? balances : [];

  const cur = (b) => String(b.currency || 'UGX').toUpperCase();
  const currencies = [...new Set(bs.map(cur))];

  const sumIn = (side, c) => bs.filter((b) => b.side === side && cur(b) === c)
    .reduce((a, b) => a + Math.round(Number(b.computed || 0) * M.CURRENCIES[c].minor), 0);

  const perCurrency = currencies.map((c) => {
    const assets = sumIn('asset', c), debts = sumIn('debt', c);
    return {
      currency: c,
      assets: { minor: assets, currency: c },
      debts: { minor: debts, currency: c },
      netWorth: { minor: assets - debts, currency: c },
      formatted: M.format({ minor: assets - debts, currency: c }),
    };
  });

  const stale = bs.filter((b) => !b.openingAsOf);

  // Legacy single-currency fields — correct ONLY when everything is in one currency.
  const single = currencies.length <= 1;
  const c0 = currencies[0] || 'UGX';
  const assets = single ? sumIn('asset', c0) / M.CURRENCIES[c0].minor : null;
  const debts  = single ? sumIn('debt', c0)  / M.CURRENCIES[c0].minor : null;

  return {
    currencies,
    perCurrency,

    // 🔴 NULL when there is more than one currency and no rate. Not zero. Not a
    //    guess. Null, so that a screen which forgets to handle it BREAKS LOUDLY
    //    rather than printing a confident, invented figure.
    assets, debts,
    netWorth: single ? assets - debts : null,

    combined: (() => {
      if (single) return null;
      if (!rate || !(Number(rate.rate) > 0)) {
        return {
          available: false,
          because: `You hold ${currencies.join(' and ')}. There is no true single total without an exchange rate.`,
          weWillNot: 'We will not pick a rate for you and put the result at the top of your screen in the biggest font on the page. The dollars are real, the shillings are real, and the rate would be invented.',
          whatWouldUnblockThis: 'Tell us the rate you would ACTUALLY get, and the date. Then we will combine them — and say on the screen that we did.',
          showBoth: perCurrency,
        };
      }
      const to = 'UGX';
      let total = 0;
      for (const pc of perCurrency) {
        if (pc.currency === to) { total += pc.netWorth.minor; continue; }
        const conv = M.convert(pc.netWorth, to, rate.rate, rate.on, rate.source);
        if (conv && !conv.refused) total += conv.minor;
      }
      return {
        available: true,
        currency: to,
        netWorth: { minor: total, currency: to },
        formatted: M.format({ minor: total, currency: to }),
        rate: Number(rate.rate), rateOn: rate.on || null, rateSource: rate.source || null,
        thisIsConverted: `Combined using a rate of ${Number(rate.rate).toLocaleString()} on ${rate.on || 'an unstated date'}, which you gave us. It is not a fact of the world — the number you actually get will differ.`,
      };
    })(),


    // 🔴 An account never grounded in reality is a guess sitting inside a total.
    //    Say which ones, by name. A caveat with no names is a caveat nobody reads.
    accountsNeverReconciled: stale.map((b) => b.name),
    confidence: stale.length ? 'Some of this is unverified' : 'Every account has been grounded in a real balance',

    breakdown: bs.map((b) => ({ name: b.name, type: b.type, side: b.side, amount: UGX(b.computed) })),
    thisIsNotObserved: 'Computed from what you recorded, not from your banks.',
  };
}

/**
 * How many months could you survive if the income stopped tomorrow?
 *
 * 🔴 LIQUID ONLY. Land is not lunch. A VSLA pays out at the end of the cycle. Money
 * your cousin owes you is not money. Counting any of them here produces a
 * comforting number and a false one — and this is the number people bet on.
 */
function emergencyFund(balances, monthlyOutgoings) {
  const out = UGX(monthlyOutgoings);
  const liquid = (Array.isArray(balances) ? balances : [])
    .filter((b) => b.side === 'asset' && b.liquid)
    .reduce((a, b) => a + UGX(b.computed), 0);

  if (!(out > 0)) {
    return refuse({ label: 'Accounts' }, {
      question: 'How many months could you survive?',
      because: 'We do not yet know what a month costs you — there is no confirmed spending to divide by.',
      weWillNot: 'We will not divide by zero and call it "infinite months". You would sit on a beautiful number that means nothing.',
      whatWouldUnblockThis: 'Confirm a month of spending in your Books. Then we can answer this properly.',
    });
  }

  const months = liquid / out;
  return {
    liquid,
    monthlyOutgoings: out,
    months: Math.round(months * 10) / 10,
    excluded: (Array.isArray(balances) ? balances : [])
      .filter((b) => b.side === 'asset' && !b.liquid)
      .map((b) => ({ name: b.name, amount: UGX(b.computed),
                     why: (ACCOUNT_TYPES[b.type] || {}).note || 'Not liquid — you cannot spend it next month.' })),
    whatWeExcludedAndWhy: 'Land, VSLA, fixed deposits and money owed to you are NOT counted. They are real, and you cannot eat them next month.',
    verdict: months >= 6 ? 'Solid.' : months >= 3 ? 'Thin, but standing.' : months >= 1 ? 'One shock away.' : 'You have no cushion.',
  };
}

/**
 * What share of the money that actually came in did you actually keep?
 *
 * 🔴 CONFIRMED MONEY ONLY, AND NO TRANSFERS. Moving money to a savings account is
 * not saving it — it is moving it. An app that counts transfers as saving will tell
 * a person they saved 40% of their income while their net worth stands still.
 */
function savingsRate(confirmedIn, confirmedOut) {
  const inn = UGX(confirmedIn), out = UGX(confirmedOut);
  if (!(inn > 0)) {
    return refuse({ label: 'Accounts' }, {
      question: 'What did you keep?',
      because: 'No income has been confirmed this period, so there is nothing to take a share of.',
      weWillNot: 'We will not report a savings rate on money that has not arrived.',
      whatWouldUnblockThis: 'Confirm the income when it comes in.',
    });
  }
  const kept = inn - out;
  return {
    confirmedIn: inn,
    confirmedOut: out,
    kept,
    percent: Math.round((kept / inn) * 1000) / 10,
    transfersExcluded: 'Moving money into savings is not saving it. Only money that came IN and did not go back OUT counts here.',
    negative: kept < 0 ? 'You spent more than came in. The difference came from somewhere — savings, or debt.' : null,
  };
}

module.exports = {
  ACCOUNT_TYPES, MOVED,
  isAsset, isDebt, isLiquid,
  computedBalance, reconcile,
  netWorth, emergencyFund, savingsRate,
};
