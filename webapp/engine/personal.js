/**
 * SELAH — PERSONAL FINANCE
 * ─────────────────────────────────────────────────────────────────────────────
 * Eleven calculators. NO UGANDAN TAX LAW IN ANY OF THEM — except where tax is
 * genuinely part of the answer, and then it comes from the same verified rules
 * as everything else.
 *
 * WHICH MEANS THERE IS NO EXCUSE FOR GETTING THESE WRONG. The engine's other
 * tiers can be defeated by a Parliament that deletes a clause on the floor.
 * Compound interest cannot. If a number here is wrong, it is wrong because we
 * were careless.
 *
 * THE ONE THING THAT MAKES THESE UGANDAN, AND IT IS NOT DECORATION:
 *
 *   Ugandan retail lending is quoted at a FLAT rate. "18% a year on 10,000,000
 *   over 3 years" is presented as though you pay 18% — and the true cost, on a
 *   reducing balance, is about 32%. It is not a scam and it is not hidden. It is
 *   simply a different quantity from the one the borrower thinks they are
 *   hearing, and almost nobody converts it.
 *
 *   So `loanSchedule` computes BOTH, and shows the gap.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { RULES, CONFIDENCE } = require('./rules');
const { UGX, fmt, ruleBlock, refuse } = require('./engine');

// Money maths is not tax law. But it still has to say where it came from.
const MATH_RULE = {
  id: 'MATH.TIMEVALUE',
  label: 'Time value of money',
  confidence: CONFIDENCE.A,
  effectiveFrom: '1494-01-01',   // Pacioli. The maths has not changed.
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Arithmetic',
    provision: 'Compound interest; the annuity formula',
    corroboration: ['Not in dispute anywhere on earth'],
  },
};
const mathBlock = () => ({ ...ruleBlock(MATH_RULE), displayable: true });

// ═════════════════════════════════════════════════════════════════════════════
// 44. LOAN / AMORTISATION — and the flat rate that is not the rate
// ═════════════════════════════════════════════════════════════════════════════

function loanSchedule({ principal, annualRate, months, quotedAsFlat = false }) {
  // A FLAT quote charges interest on the ORIGINAL principal for the whole term,
  // even though you are paying the principal down every month. The money you have
  // already repaid keeps being charged for.
  const flatTotalInterest = principal * annualRate * (months / 12);
  const flatPayment = (principal + flatTotalInterest) / months;

  // The reducing-balance rate that produces the SAME monthly payment. This is the
  // rate the borrower is actually paying, and it is roughly double the quote.
  const solveEffective = (payment) => {
    let lo = 0, hi = 5;                       // 0% .. 500% a year
    for (let i = 0; i < 200; i++) {
      const r = (lo + hi) / 2, m = r / 12;
      const pay = m === 0 ? principal / months
                          : principal * m / (1 - Math.pow(1 + m, -months));
      if (pay > payment) hi = r; else lo = r;
    }
    return (lo + hi) / 2;
  };

  const monthlyRate = annualRate / 12;
  const reducingPayment = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));

  const payment = quotedAsFlat ? flatPayment : reducingPayment;
  const effectiveRate = quotedAsFlat ? solveEffective(flatPayment) : annualRate;

  // Amortise on the TRUE reducing balance, at the effective rate.
  const em = effectiveRate / 12;
  const schedule = [];
  let bal = principal, totalInterest = 0;
  for (let m = 1; m <= months; m++) {
    const interest = bal * em;
    const capital = Math.min(payment - interest, bal);
    totalInterest += interest;
    bal = Math.max(0, bal - capital);
    if (m <= 6 || m === months) {
      schedule.push({ month: m, payment: UGX(payment), interest: UGX(interest), capital: UGX(capital), balance: UGX(bal) });
    }
  }
  const totalPaid = payment * months;

  return {
    ok: true, refused: false,
    result: UGX(payment),
    currency: 'UGX',
    label: 'Your monthly repayment',
    rule: mathBlock(),
    inputs: { principal: UGX(principal), annualRate, months, quotedAsFlat },
    steps: [
      { band: 'You borrow',                       amount: null, rate: null, tax: UGX(principal) },
      { band: `Quoted rate — ${(annualRate * 100).toFixed(1)}% ${quotedAsFlat ? 'FLAT' : 'reducing balance'}`, amount: null, rate: annualRate, tax: null },
      { band: `Over ${months} months`,            amount: null, rate: null, tax: null },
      { band: 'Monthly repayment',                amount: null, rate: null, tax: UGX(payment) },
      { band: 'Total interest you will pay',      amount: null, rate: null, tax: UGX(totalPaid - principal) },
      { band: 'Total you repay',                  amount: null, rate: null, tax: UGX(totalPaid) },
    ],
    schedule,
    totalInterest: UGX(totalPaid - principal),
    totalRepaid: UGX(totalPaid),
    // 🔑 THE NUMBER THE BORROWER IS NEVER TOLD.
    trueRate: {
      quoted: annualRate,
      effective: effectiveRate,
      multiple: effectiveRate / annualRate,
      meaning: quotedAsFlat
        ? `You were quoted ${(annualRate * 100).toFixed(1)}%. You are actually paying ${(effectiveRate * 100).toFixed(1)}% — ${(effectiveRate / annualRate).toFixed(1)}× the quoted rate. A flat rate charges interest on the WHOLE loan for the WHOLE term, even on the money you have already paid back.`
        : `Quoted on a reducing balance, so the quoted rate is the real rate. ${(annualRate * 100).toFixed(1)}%.`,
    },
    warnings: quotedAsFlat ? [{
      severity: 'high',
      text: `🔴 A FLAT RATE IS NOT THE RATE YOU PAY. You were quoted ${(annualRate * 100).toFixed(1)}% flat. The true cost, on a reducing balance, is ${(effectiveRate * 100).toFixed(1)}% — roughly ${(effectiveRate / annualRate).toFixed(1)} times what you think. This is not hidden and it is not illegal. It is simply a different quantity from the one you believe you are being quoted, and almost no Ugandan borrower converts it. ASK EVERY LENDER FOR THE REDUCING-BALANCE RATE, and compare only those.`,
    }] : [{
      severity: 'info',
      text: 'This is a reducing-balance rate, so the quoted figure is the real one. If a lender quotes you a FLAT rate instead, it is not comparable — convert it before you compare.',
    }],
    whatWeCannotTellYou: [
      'Arrangement fees, insurance, and "processing" charges. They are not interest, they do not appear in the rate, and they can add several points to the true cost. Ask for the TOTAL COST OF CREDIT in shillings, not a percentage.',
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 45. SAVINGS & COMPOUND INTEREST
// ═════════════════════════════════════════════════════════════════════════════

function savings({ initial = 0, monthlyDeposit = 0, annualRate, years, annualInflation = null }) {
  const m = annualRate / 12;
  const n = years * 12;

  const fromInitial = initial * Math.pow(1 + m, n);
  const fromDeposits = m === 0 ? monthlyDeposit * n
                               : monthlyDeposit * ((Math.pow(1 + m, n) - 1) / m);
  const nominal = fromInitial + fromDeposits;
  const contributed = initial + monthlyDeposit * n;
  const interest = nominal - contributed;

  // 🔑 Uganda's inflation is not a rounding error. A nominal number here is a lie
  // of omission — it tells you the size of the pile, not what it will buy.
  const real = annualInflation != null ? nominal / Math.pow(1 + annualInflation, years) : null;

  return {
    ok: true, refused: false,
    result: UGX(nominal),
    currency: 'UGX',
    label: `What you will have in ${years} years`,
    rule: mathBlock(),
    inputs: { initial: UGX(initial), monthlyDeposit: UGX(monthlyDeposit), annualRate, years, annualInflation },
    steps: [
      { band: 'You start with',                       amount: null, rate: null, tax: UGX(initial) },
      { band: `You add ${fmt(UGX(monthlyDeposit))} a month`, amount: null, rate: null, tax: UGX(monthlyDeposit * n) },
      { band: 'Total you put in',                     amount: null, rate: null, tax: UGX(contributed) },
      { band: `Interest, compounding at ${(annualRate * 100).toFixed(1)}%`, amount: null, rate: annualRate, tax: UGX(interest) },
      { band: 'What you end up with',                 amount: null, rate: null, tax: UGX(nominal) },
      ...(real != null ? [{ band: `In TODAY'S money, after ${(annualInflation * 100).toFixed(1)}% inflation`, amount: null, rate: null, tax: UGX(real),
        note: 'This is the number that matters. The other one just has more digits.' }] : []),
    ],
    contributed: UGX(contributed),
    interestEarned: UGX(interest),
    realValue: real != null ? UGX(real) : null,
    warnings: [
      ...(real != null && real < contributed ? [{ severity: 'high',
        text: `🔴 YOU ARE GOING BACKWARDS. After inflation, ${fmt(UGX(nominal))} in ${years} years buys ${fmt(UGX(real))} of today's goods — LESS than the ${fmt(UGX(contributed))} you put in. At ${(annualRate * 100).toFixed(1)}% against ${(annualInflation * 100).toFixed(1)}% inflation, this account is a slow loss dressed as a saving.` }] : []),
      { severity: 'info',
        text: 'Interest on a savings account is income. Interest paid by a financial institution to a resident carries 15% withholding tax — and interest on GOVERNMENT SECURITIES carries 20%. This projection is BEFORE tax.' },
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 46. RETIREMENT — and Uganda's double exemption, which is a genuine gift
//
// 🔑 EXEMPT IN, EXEMPT OUT.
//   The EMPLOYER's contribution to a retirement fund is exempt going in
//     (ITA s.19(2)(g)) — it is not taxed as your income.
//   The lump sum is exempt coming out (s.21(1)(n)) — it is not taxed on the way out.
//
// Of every shilling an employer can spend on you, this is the least wasteful one
// in the entire Ugandan tax code. Almost nobody structures around it.
// ═════════════════════════════════════════════════════════════════════════════

function retirement({ currentAge, retireAge, currentPot = 0, monthlyGross, employeePct = 0.05, employerPct = 0.10, annualReturn = 0.10, annualInflation = 0.055 }) {
  const years = Math.max(0, retireAge - currentAge);
  const n = years * 12;
  const m = annualReturn / 12;

  const monthlyIn = monthlyGross * (employeePct + employerPct);
  const fromPot = currentPot * Math.pow(1 + m, n);
  const fromContrib = m === 0 ? monthlyIn * n : monthlyIn * ((Math.pow(1 + m, n) - 1) / m);
  const pot = fromPot + fromContrib;
  const real = pot / Math.pow(1 + annualInflation, years);

  // The employer's half is FREE MONEY, exempt at both ends.
  const employerTotal = monthlyGross * employerPct * n;

  return {
    ok: true, refused: false,
    result: UGX(pot),
    currency: 'UGX',
    label: `Your retirement pot at ${retireAge}`,
    rule: { ...ruleBlock(RULES.NSSF_2026), confidence: CONFIDENCE.B },
    inputs: { currentAge, retireAge, currentPot: UGX(currentPot), monthlyGross: UGX(monthlyGross), employeePct, employerPct, annualReturn, annualInflation },
    steps: [
      { band: `You contribute ${(employeePct * 100).toFixed(0)}% of gross`,      amount: null, rate: employeePct, tax: UGX(monthlyGross * employeePct) },
      { band: `Your employer adds ${(employerPct * 100).toFixed(0)}%`,           amount: null, rate: employerPct, tax: UGX(monthlyGross * employerPct),
        note: '🔑 EXEMPT GOING IN (s.19(2)(g)) and EXEMPT COMING OUT (s.21(1)(n)). It is never taxed. Not once.' },
      { band: `Compounding at ${(annualReturn * 100).toFixed(1)}% for ${years} years`, amount: null, rate: annualReturn, tax: null },
      { band: 'Your pot at retirement',                                          amount: null, rate: null, tax: UGX(pot) },
      { band: `In TODAY'S money, after ${(annualInflation * 100).toFixed(1)}% inflation`, amount: null, rate: null, tax: UGX(real) },
    ],
    realValue: UGX(real),
    employerContributedTotal: UGX(employerTotal),
    warnings: [
      { severity: 'high',
        text: `🔑 THE DOUBLE EXEMPTION. Your employer's ${(employerPct * 100).toFixed(0)}% — ${fmt(UGX(employerTotal))} over your working life — is EXEMPT when it goes in AND EXEMPT when it comes out. It is never taxed, at either end. There is no other shilling in the Ugandan tax code that is treated this kindly, and almost nobody structures their pay around it.` },
      { severity: 'medium',
        text: 'Your OWN contribution is NOT deductible (s.22(3)(h)). You pay tax on it, then save it. Only the employer\'s side gets the exemption going in — which is an argument for negotiating a higher employer contribution rather than a higher salary.' },
      { severity: 'info',
        text: `Inflation is doing most of the damage here. ${fmt(UGX(pot))} sounds like a lot; in today's money it is ${fmt(UGX(real))}. Always look at the second number.` },
    ],
    whatWeCannotTellYou: [
      'What return your fund will actually achieve. We have assumed one. Nobody knows.',
      'What inflation will do over decades. We have assumed 5.5%. Uganda has seen far worse and far better.',
    ],
    disclaimerTier: 2,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 49. DEBT PAYOFF — avalanche vs snowball, priced
// ═════════════════════════════════════════════════════════════════════════════

function debtPayoff({ debts, monthlyBudget, method = 'avalanche' }) {
  const run = (order) => {
    let list = order.map((d) => ({ ...d, bal: d.balance }));
    let month = 0, totalInterest = 0;
    while (list.some((d) => d.bal > 0) && month < 600) {
      month++;
      let budget = monthlyBudget;
      // minimums first
      for (const d of list) {
        if (d.bal <= 0) continue;
        const interest = d.bal * (d.annualRate / 12);
        d.bal += interest; totalInterest += interest;
      }
      for (const d of list) {
        if (d.bal <= 0) continue;
        const pay = Math.min(d.minimum, d.bal, budget);
        d.bal -= pay; budget -= pay;
      }
      // then everything spare at the FIRST debt in the order
      for (const d of list) {
        if (budget <= 0) break;
        if (d.bal <= 0) continue;
        const pay = Math.min(budget, d.bal);
        d.bal -= pay; budget -= pay;
      }
    }
    return { months: month, totalInterest };
  };

  const avalanche = run([...debts].sort((a, b) => b.annualRate - a.annualRate));  // highest RATE first
  const snowball  = run([...debts].sort((a, b) => a.balance - b.balance));        // smallest BALANCE first
  const chosen = method === 'avalanche' ? avalanche : snowball;

  const totalDebt = debts.reduce((a, d) => a + d.balance, 0);

  return {
    ok: true, refused: false,
    result: chosen.months,
    currency: null,
    label: `Debt-free in ${chosen.months} months`,
    rule: mathBlock(),
    inputs: { debts, monthlyBudget: UGX(monthlyBudget), method },
    steps: [
      { band: 'Total you owe',                    amount: null, rate: null, tax: UGX(totalDebt) },
      { band: `You can pay ${fmt(UGX(monthlyBudget))} a month`, amount: null, rate: null, tax: null },
      { band: `AVALANCHE — highest interest rate first`, amount: avalanche.months, rate: null, tax: UGX(avalanche.totalInterest) },
      { band: `SNOWBALL — smallest balance first`,      amount: snowball.months,  rate: null, tax: UGX(snowball.totalInterest) },
    ],
    options: [
      { id: 'avalanche', label: 'Avalanche — attack the highest INTEREST RATE first',
        months: avalanche.months, totalInterest: UGX(avalanche.totalInterest),
        howItWorks: ['Pay the minimum on everything. Throw every spare shilling at the debt with the HIGHEST RATE.'],
        requiresOfYou: 'Patience. The biggest, most expensive debt may take a long time to visibly move, and you will feel like you are getting nowhere.',
        costs: ['It is mathematically optimal and psychologically brutal.'],
        stopsWorkingWhen: 'You give up. Which is not a small risk, and is the entire argument for the other method.' },
      { id: 'snowball', label: 'Snowball — kill the SMALLEST debt first',
        months: snowball.months, totalInterest: UGX(snowball.totalInterest),
        howItWorks: ['Pay the minimum on everything. Throw every spare shilling at the SMALLEST balance, whatever its rate.'],
        requiresOfYou: 'Nothing but momentum. Debts disappear early and often.',
        costs: [`It costs ${fmt(UGX(snowball.totalInterest - avalanche.totalInterest))} more in interest than the avalanche.`],
        stopsWorkingWhen: 'Never, really — it just costs more.' },
    ],
    whatTheNumbersFavour: {
      option: 'avalanche',
      by: UGX(snowball.totalInterest - avalanche.totalInterest),
      caveat: `On arithmetic alone, ALWAYS the avalanche. But arithmetic is not what makes people give up on debt. The snowball costs ${fmt(UGX(snowball.totalInterest - avalanche.totalInterest))} more and it works, because closing an account is the only feedback most people ever get. A plan you abandon in month four is worse than a slightly expensive plan you finish. Choose the one you will actually do.`,
    },
    whatWeCannotTellYou: [
      'Whether you will stick to it. That is the only variable that matters here, and it is not in the arithmetic.',
    ],
    disclaimerTier: 2,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 48. EMERGENCY FUND · 47. NET WORTH · 43. BUDGET
// ═════════════════════════════════════════════════════════════════════════════

function emergencyFund({ monthlyEssentials, currentSavings = 0, monthsOfCover = 6, monthlySaving = 0 }) {
  const target = monthlyEssentials * monthsOfCover;
  const gap = Math.max(0, target - currentSavings);
  const monthsToTarget = monthlySaving > 0 ? Math.ceil(gap / monthlySaving) : null;
  const coverNow = monthlyEssentials > 0 ? currentSavings / monthlyEssentials : 0;

  return {
    ok: true, refused: false,
    result: UGX(target),
    currency: 'UGX',
    label: `Your ${monthsOfCover}-month emergency fund`,
    rule: mathBlock(),
    inputs: { monthlyEssentials: UGX(monthlyEssentials), currentSavings: UGX(currentSavings), monthsOfCover, monthlySaving: UGX(monthlySaving) },
    steps: [
      { band: 'Essentials, per month (rent, food, school fees, transport, medical)', amount: null, rate: null, tax: UGX(monthlyEssentials) },
      { band: `× ${monthsOfCover} months`,   amount: null, rate: null, tax: UGX(target) },
      { band: 'You have',                    amount: null, rate: null, tax: UGX(currentSavings) },
      { band: 'The gap',                     amount: null, rate: null, tax: UGX(gap) },
      ...(monthsToTarget != null ? [{ band: `At ${fmt(UGX(monthlySaving))} a month, you get there in`, amount: monthsToTarget, rate: null, tax: null }] : []),
    ],
    monthsOfCoverNow: coverNow,
    gap: UGX(gap),
    monthsToTarget,
    warnings: [
      ...(coverNow < 1 ? [{ severity: 'high',
        text: `You have less than ONE month of cover. A single hospital bill, a broken vehicle, or one late-paying client and you will borrow at a rate you would never accept if you had a choice. That is what an emergency fund actually buys: not safety, but the ability to say no to bad credit.` }] : []),
      { severity: 'info',
        text: 'ESSENTIALS, not spending. Rent, food, school fees, transport, medical, minimum debt payments. Not airtime, not eating out, not the things you would stop instantly if the income stopped.' },
    ],
  };
}

function netWorth({ assets = [], liabilities = [] }) {
  const totalAssets = assets.reduce((a, x) => a + x.value, 0);
  const totalLiabilities = liabilities.reduce((a, x) => a + x.value, 0);
  const net = totalAssets - totalLiabilities;

  return {
    ok: true, refused: false,
    result: UGX(net),
    currency: 'UGX',
    label: 'Your net worth',
    rule: mathBlock(),
    inputs: { assets, liabilities },
    steps: [
      ...assets.map((a) => ({ band: a.label, amount: null, rate: null, tax: UGX(a.value) })),
      { band: 'Total assets',      amount: null, rate: null, tax: UGX(totalAssets) },
      ...liabilities.map((l) => ({ band: l.label, amount: null, rate: null, tax: -UGX(l.value) })),
      { band: 'Total owed',        amount: null, rate: null, tax: -UGX(totalLiabilities) },
      { band: 'NET WORTH',         amount: null, rate: null, tax: UGX(net) },
    ],
    totalAssets: UGX(totalAssets),
    totalLiabilities: UGX(totalLiabilities),
    warnings: [
      ...(net < 0 ? [{ severity: 'high',
        text: 'Your net worth is NEGATIVE. That is a fact, not a verdict — most people who own a home with a mortgage pass through it. But it means that if everything were sold and every debt settled today, you would still owe. Know it; do not hide from it.' }] : []),
      { severity: 'info',
        text: 'A business you own is an asset — but at what it would SELL for, not at what you hope. Land you cannot get a title for is not an asset you can borrow against. Be honest here or the number is decoration.' },
    ],
  };
}

function budget({ monthlyIncome, expenses = [] }) {
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const left = monthlyIncome - total;
  const byCategory = {};
  for (const e of expenses) byCategory[e.category || 'other'] = (byCategory[e.category || 'other'] || 0) + e.amount;

  return {
    ok: true, refused: false,
    result: UGX(left),
    currency: 'UGX',
    label: left >= 0 ? 'Left over each month' : 'SHORT each month',
    rule: mathBlock(),
    inputs: { monthlyIncome: UGX(monthlyIncome), expenses },
    steps: [
      { band: 'Income (take-home)', amount: null, rate: null, tax: UGX(monthlyIncome) },
      ...Object.entries(byCategory).map(([c, v]) => ({ band: c, amount: null, rate: null, tax: -UGX(v) })),
      { band: 'Total out',          amount: null, rate: null, tax: -UGX(total) },
      { band: left >= 0 ? 'Left over' : 'SHORTFALL', amount: null, rate: null, tax: UGX(left) },
    ],
    savingsRate: monthlyIncome > 0 ? left / monthlyIncome : 0,
    byCategory,
    warnings: [
      ...(left < 0 ? [{ severity: 'high',
        text: `You are spending ${fmt(UGX(-left))} more than you earn, every month. That gap is being filled by something — savings, a loan, or an unpaid bill. Find out which, because the answer decides what you do next.` }] : []),
      ...(left >= 0 && monthlyIncome > 0 && left / monthlyIncome < 0.10 ? [{ severity: 'medium',
        text: `You are saving ${((left / monthlyIncome) * 100).toFixed(1)}% of your income. Under 10% leaves no room for a single bad month.` }] : []),
      { severity: 'info',
        text: 'Use TAKE-HOME pay, not gross. PAYE and NSSF have already gone. Budgeting from gross is the most common way to be wrong by 30%.' },
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 50. TREASURY BILLS & BONDS — and the 20% almost nobody nets off
// ═════════════════════════════════════════════════════════════════════════════

function treasuryYield({ faceValue, purchasePrice, days, isBond = false, couponRate = 0 }) {
  const wht = RULES.WHT_2026.rates.find((r) => r.key === 'govt_securities');

  const discount = faceValue - purchasePrice;
  const grossAnnual = purchasePrice > 0 && days > 0 ? (discount / purchasePrice) * (365 / days) : 0;
  const taxWithheld = discount * wht.resident;
  const netReturn = discount - taxWithheld;
  const netAnnual = purchasePrice > 0 && days > 0 ? (netReturn / purchasePrice) * (365 / days) : 0;

  return {
    ok: true, refused: false,
    result: netAnnual,
    currency: null,
    label: 'Your ACTUAL annualised return, after tax',
    rule: { ...ruleBlock(RULES.WHT_2026), confidence: CONFIDENCE.A },
    inputs: { faceValue: UGX(faceValue), purchasePrice: UGX(purchasePrice), days, isBond },
    steps: [
      { band: 'You pay',                         amount: null, rate: null, tax: UGX(purchasePrice) },
      { band: 'You receive at maturity',         amount: null, rate: null, tax: UGX(faceValue) },
      { band: 'Your gain',                       amount: null, rate: null, tax: UGX(discount) },
      { band: `Gross annualised yield`,          amount: null, rate: grossAnnual, tax: null },
      { band: `less WHT on government securities — 20%`, amount: null, rate: wht.resident, tax: -UGX(taxWithheld),
        note: 'TWENTY percent — not the 15% that applies to ordinary bank interest. Government securities are taxed HIGHER, and the rate advertised to you is almost always the gross one.' },
      { band: 'Your ACTUAL return',              amount: null, rate: netAnnual, tax: UGX(netReturn) },
    ],
    grossYield: grossAnnual,
    netYield: netAnnual,
    taxWithheld: UGX(taxWithheld),
    warnings: [
      { severity: 'high',
        text: `THE ADVERTISED YIELD IS BEFORE TAX. You will see ${(grossAnnual * 100).toFixed(2)}% quoted. You will actually receive ${(netAnnual * 100).toFixed(2)}%, because 20% withholding tax comes off the interest. On a treasury bill that gap is the difference between beating inflation and not.` },
      { severity: 'info',
        text: 'But note: a gain on DISPOSING of a government security on the SECONDARY market is EXEMPT (ITA s.21). Hold to maturity and the interest is taxed at 20%. Sell it on before maturity and the gain is not taxed at all. That is a real and entirely legitimate planning point.' },
    ],
    disclaimerTier: 2,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 52. MORTGAGE AFFORDABILITY · 53. BUSINESS VALUATION
// ═════════════════════════════════════════════════════════════════════════════

function mortgageAffordability({ monthlyNetIncome, existingDebtPayments = 0, annualRate, years, maxDtiPct = 0.40, deposit = 0 }) {
  const capacity = Math.max(0, monthlyNetIncome * maxDtiPct - existingDebtPayments);
  const m = annualRate / 12, n = years * 12;
  const borrow = m === 0 ? capacity * n : capacity * (1 - Math.pow(1 + m, -n)) / m;
  const propertyValue = borrow + deposit;

  return {
    ok: true, refused: false,
    result: UGX(propertyValue),
    currency: 'UGX',
    label: 'The most you can afford',
    rule: mathBlock(),
    inputs: { monthlyNetIncome: UGX(monthlyNetIncome), existingDebtPayments: UGX(existingDebtPayments), annualRate, years, maxDtiPct, deposit: UGX(deposit) },
    steps: [
      { band: 'Take-home pay, per month',                                amount: null, rate: null, tax: UGX(monthlyNetIncome) },
      { band: `Lenders cap total debt at about ${(maxDtiPct * 100).toFixed(0)}% of it`, amount: null, rate: maxDtiPct, tax: UGX(monthlyNetIncome * maxDtiPct) },
      { band: 'less debt you already service',                           amount: null, rate: null, tax: -UGX(existingDebtPayments) },
      { band: 'Available for a mortgage payment',                        amount: null, rate: null, tax: UGX(capacity) },
      { band: `At ${(annualRate * 100).toFixed(1)}% over ${years} years, that borrows`, amount: null, rate: annualRate, tax: UGX(borrow) },
      { band: 'plus your deposit',                                       amount: null, rate: null, tax: UGX(deposit) },
      { band: 'Property you can afford',                                 amount: null, rate: null, tax: UGX(propertyValue) },
    ],
    maxLoan: UGX(borrow),
    monthlyPayment: UGX(capacity),
    warnings: [
      { severity: 'high',
        text: 'THIS IS THE MAXIMUM, NOT THE TARGET. A lender will happily let you spend 40% of your take-home on a house. That leaves nothing for a bad year, and Ugandan mortgage rates are variable. Borrow less than you can.' },
      { severity: 'medium',
        text: 'Not included: stamp duty (1.5% of the transfer value, and possibly 3% — see the stamp duty calculator), legal fees, valuation, and the mortgage deed. Budget several percent of the price on top.' },
    ],
    whatWeCannotTellYou: [
      'Whether the rate is fixed. Most Ugandan mortgages are not. A 3-point rise on a 20-year loan is not a small thing.',
      'Whether the title is clean. It is the single largest risk in a Ugandan property purchase and it is not a financial question.',
    ],
    disclaimerTier: 3,
  };
}

function businessValuation({ annualProfit, annualRevenue, multiple = 3, netAssets = 0 }) {
  const earningsBased = annualProfit * multiple;
  const assetBased = netAssets;
  const revenueBased = annualRevenue * 0.5;

  return {
    ok: true, refused: false,
    result: null,
    label: 'What your business might be worth',
    rule: mathBlock(),
    inputs: { annualProfit: UGX(annualProfit), annualRevenue: UGX(annualRevenue), multiple, netAssets: UGX(netAssets) },
    steps: [
      { band: `Earnings × ${multiple}`,        amount: null, rate: null, tax: UGX(earningsBased) },
      { band: 'Net assets',                    amount: null, rate: null, tax: UGX(assetBased) },
      { band: 'Revenue × 0.5 (a crude sanity check)', amount: null, rate: null, tax: UGX(revenueBased) },
    ],
    options: [
      { id: 'earnings', label: `Earnings multiple — profit × ${multiple}`, value: UGX(earningsBased),
        howItWorks: ['The most common method for a profitable small business. A buyer is buying the profit.'],
        requiresOfYou: 'Profits that a buyer can VERIFY. Unaudited management accounts and cash sales that never touched a bank will be discounted heavily, or ignored.',
        costs: ['A multiple of 3 on a Ugandan SME is optimistic unless the profit is durable and not dependent on you personally.'],
        stopsWorkingWhen: 'The business IS you. If it does not run without you for a month, a buyer is buying a job, not a business — and will pay accordingly.' },
      { id: 'assets', label: 'Net asset value', value: UGX(assetBased),
        howItWorks: ['What you would get by selling everything and paying every debt. The FLOOR under the valuation.'],
        requiresOfYou: 'Clean title to the assets. Land without a title is not an asset a buyer will pay for.',
        costs: ['It ignores everything you have built that is not on the balance sheet.'],
        stopsWorkingWhen: 'The business is profitable — then it is worth more than its parts, and this method undersells you.' },
    ],
    whatWeCannotTellYou: [
      '🔴 WHAT IT IS ACTUALLY WORTH. A business is worth what someone will pay for it. Every method here is a way of starting the conversation, not a price. We will not pretend otherwise, and neither should anyone who charges you for a valuation.',
      'Whether your profits would survive due diligence. Most Ugandan SME profits do not, and that is where the price falls apart.',
    ],
    disclaimerTier: 4,
  };
}

module.exports = {
  loanSchedule, savings, retirement, debtPayoff,
  emergencyFund, netWorth, budget,
  treasuryYield, mortgageAffordability, businessValuation,
};
