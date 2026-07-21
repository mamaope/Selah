/**
 * SELAH — TIER 1, THE REST OF IT
 * ─────────────────────────────────────────────────────────────────────────────
 * The nine Tier-1 calculators that did not exist yet.
 *
 *   3. Net-to-gross (reverse PAYE)      — "I want them to take home 1,000,000."
 *   6. True cost of an employee          — and the part the law REFUSES to fix.
 *  13. Corporate income tax              — with the new 0.5% minimum-tax alarm.
 *  15. Presumptive election modeller     — and the BREAK-EVEN MARGIN.
 *  22. Rental income                     — and the threshold that did NOT move.
 *  24. WHT rate card                     — with the gross-up nobody computes.
 *  27. VAT inclusive / exclusive         — trivial, and universally got wrong.
 *  29. VAT DEREGISTRATION                — and the trap PwC published wrong.
 *  38. Voluntary disclosure              — what the waiver is actually worth.
 *
 * SAME LAW AS EVERY OTHER FILE: the engine never returns a number. It returns a
 * proof. Inputs, steps, rule, source, confidence, date. If we are not sure, we
 * refuse — we never compute and disclaim.
 *
 * AND ONE NEW LAW, LEARNED HERE:
 *
 *   WHERE THE STATUTE ITSELF DECLINES TO FIX A NUMBER, SO DO WE.
 *
 *   Employment Act s.89 says severance "shall be NEGOTIATED between the employer
 *   and the employee". It fixes no formula. Every HR blog in Uganda prints "one
 *   month per year of service" as though it were law. It is not. It is a custom.
 *
 *   So `trueCostOfEmployee` will not invent it. It computes what the law
 *   actually compels — and it tells you, in the output, exactly where the law
 *   stops and your contract begins. A calculator that guesses here is not being
 *   helpful. It is manufacturing a false liability, or hiding a real one.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { RULES, CONFIDENCE } = require('./rules');
const {
  UGX, fmt, ruleBlock, refuse, computeBanded,
  paye, netPay, lstFor, presumptive, individualIncomeTaxAnnual,
} = require('./engine');

// ═════════════════════════════════════════════════════════════════════════════
// 3. NET TO GROSS — reverse PAYE
//
// "I want my employee to take home UGX 1,000,000. What do I put in the contract?"
//
// Every Ugandan employer has had this conversation. Nobody has a tool for it.
// They guess, they under-gross, and the employee's payslip disappoints them.
//
// 🔴 AND THERE IS A REAL DISCONTINUITY IN HERE, which every naive implementation
// would hide. Net pay is NOT a continuous function of gross. Local Service Tax
// is a STEP: cross a band boundary and your annual LST jumps by up to 20,000 —
// so your NET pay FALLS as your GROSS pay RISES.
//
// There are therefore small windows of take-home pay that are UNREACHABLE. No
// gross salary produces them. A calculator that returns a confident number here
// is lying. We solve exactly where a solution exists, and we SAY SO where one
// does not.
// ═════════════════════════════════════════════════════════════════════════════

function netToGross(targetNet, { residence = 'resident', nssf = true, lst = true } = {}) {
  if (residence === 'non-resident') return paye(0, 'non-resident'); // the refusal propagates

  // 🔴 EXACT, not rounded. Bisecting on a ROUNDED net accepts a gross whose true
  // net is 999,999.37 and reports it as 1,000,000 — one shilling short, EVERY
  // TIME, always in the employer's favour. Found by an independent hand-check,
  // not by our own tests. A rounding error that is unbiased is noise; one that
  // always leans the same way is a defect.
  const net = (g) => netPay(g, { residence, nssf, lst }).resultExact;

  // Net is non-decreasing in gross EXCEPT at LST boundaries. Bisect for the
  // SMALLEST gross whose net reaches the target — that is the honest answer.
  let lo = targetNet;                       // gross can never be below net
  let hi = Math.max(targetNet * 3, 500_000); // 3× clears even the 40% top rate
  while (net(hi) < targetNet) hi *= 2;

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (net(mid) >= targetNet) hi = mid; else lo = mid;
  }
  const gross = hi;
  const achieved = net(gross);
  const overshoot = achieved - targetNet;

  const breakdown = netPay(gross, { residence, nssf, lst });
  const employerNssf = breakdown.detail.employerNssf;

  return {
    ok: true, refused: false,
    result: UGX(gross),
    currency: 'UGX',
    label: 'The gross salary that produces this take-home pay',
    rule: breakdown.rule,   // inherits the COMPOSED confidence, LST included
    inputs: { targetNet: UGX(targetNet), residence, nssf, lst },
    steps: [
      { band: 'Gross salary (what goes in the contract)', amount: null, rate: null, tax: UGX(gross) },
      { band: 'less PAYE',                                amount: null, rate: null, tax: -UGX(breakdown.detail.paye.result) },
      { band: 'less NSSF — employee 5%',                  amount: null, rate: RULES.NSSF_2026.employeeRate, tax: -UGX(breakdown.detail.employeeNssf) },
      { band: 'less Local Service Tax (monthly share)',   amount: null, rate: null, tax: -UGX(breakdown.detail.lstAnnual / 12) },
      { band: 'Take-home pay',                            amount: null, rate: null, tax: UGX(achieved) },
    ],
    // The number the employer actually cares about, and never asks for.
    employerView: {
      gross: UGX(gross),
      employerNssf: UGX(employerNssf),
      totalMonthlyCost: UGX(gross + employerNssf),
      costPerShillingDelivered: (gross + employerNssf) / targetNet,
      meaning: `To put ${fmt(UGX(targetNet))} in their hand, you must spend ${fmt(UGX(gross + employerNssf))} — ${((gross + employerNssf) / targetNet).toFixed(2)}× the take-home.`,
    },
    exact: overshoot <= 1,
    warnings: [
      ...(overshoot > 1 ? [{
        severity: 'medium',
        text: `EXACTLY ${fmt(UGX(targetNet))} of take-home pay is NOT ACHIEVABLE. The nearest gross that reaches it delivers ${fmt(UGX(achieved))} — ${fmt(UGX(overshoot))} over. This is not a rounding error: Local Service Tax is a STEP, not a rate, so net pay JUMPS. A small range of take-home figures cannot be produced by any salary. Most calculators would quietly hand you a number here.`,
      }] : []),
      ...RULES.PAYE_RESIDENT_2026.warnings,
    ],
    notes: [
      'Solved by search against the same banded computation used everywhere else in the engine — not by an inverted formula. An inverted formula would have to be re-derived every time Parliament touches the bands, and would silently break on the 10,000,000 surcharge.',
    ],
    nextAction: { text: 'Shall we compute the full cost of this hire, including what the law does NOT fix?', product: 'true_cost' },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. THE TRUE COST OF AN EMPLOYEE
//
// 🔴 THE CALCULATOR THAT REFUSES TO PICK A LAW — because Uganda currently has two.
//
// I first wrote this asserting that severance is negotiated under s.89 and that
// the "one month per year" figure is a myth. Our own UI asserted the opposite:
// that it is "now standardised" by the Employment (Amendment) Act 2025.
//
// BOTH WERE WRONG, AND THE TRUTH IS MORE USEFUL THAN EITHER.
//
//   The Employment (Amendment) Act 2025 WAS assented — on 29 April 2026.
//   It DOES standardise severance at one month's salary per year worked.
//   ITS COMMENCEMENT DATE HAS NOT BEEN GAZETTED. IT IS NOT IN FORCE.
//
// So today, severance is still negotiated. Tomorrow — whenever the Minister
// publishes a notice — it is one month per year, for every employer in Uganda,
// possibly including service already accrued.
//
// An employer accruing at one month per year today is over-providing against a
// law that has not commenced. An employer accruing nothing is about to be
// surprised. Neither of them knows which, because the trigger is a piece of
// paper with no publication date.
//
// WE HOLD BOTH REGIMES, WE PRICE BOTH, AND WE DO NOT CHOOSE.
// That is not a hedge. It is the only accurate description of the law.
// ═════════════════════════════════════════════════════════════════════════════

function trueCostOfEmployee({
  grossMonthly,
  yearsOfService = 1,
  severanceMonthsPerYear = null,   // what YOUR CONTRACT says. The Act in force fixes none.
  contractualGratuityPct = null,
  annualLeaveCoverCost = 0,
}) {
  const n = RULES.NSSF_2026;
  const inForce  = RULES.SEVERANCE_2006;  // negotiated. The law TODAY.
  const assented = RULES.SEVERANCE_2025;  // 1 month/year. Signed. NOT COMMENCED.

  const annualGross  = grossMonthly * 12;
  const employerNssf = annualGross * n.employerRate;
  const statutoryCost = annualGross + employerNssf;

  // What the CONTRACT compels — today, that is the only source of a severance number.
  const contractualSeverance = severanceMonthsPerYear != null ? grossMonthly * severanceMonthsPerYear : null;
  const gratuity = contractualGratuityPct != null ? annualGross * contractualGratuityPct : null;
  const contractualCost = (contractualSeverance || 0) + (gratuity || 0) + annualLeaveCoverCost;

  // What the ASSENTED Act would compel, the day it commences. Accrued, not payable.
  const pendingAnnualAccrual = grossMonthly * assented.formula.monthsOfSalaryPerYearWorked;
  const pendingBackBook = pendingAnnualAccrual * yearsOfService; // if it bites retrospectively

  const total = statutoryCost + contractualCost;
  const exposureGap = Math.max(0, pendingAnnualAccrual - (contractualSeverance || 0));

  return {
    ok: true, refused: false,
    result: UGX(total),
    currency: 'UGX',
    label: 'What this employee actually costs you, per year',
    rule: ruleBlock(n),
    inputs: { grossMonthly: UGX(grossMonthly), yearsOfService, severanceMonthsPerYear, contractualGratuityPct, annualLeaveCoverCost: UGX(annualLeaveCoverCost) },

    statutory: {
      label: 'What the LAW IN FORCE compels. Confidence A.',
      items: [
        { band: 'Gross salary × 12',   amount: null, rate: null, tax: UGX(annualGross) },
        { band: 'NSSF — employer 10%', amount: null, rate: n.employerRate, tax: UGX(employerNssf),
          note: 'A cost to YOU, not a deduction from them. Every employer must register, irrespective of headcount — the old 5-employee threshold was removed in 2021.' },
      ],
      total: UGX(statutoryCost),
      loading: employerNssf / annualGross,
    },
    contractual: {
      label: 'What YOUR CONTRACT compels. Not the law. We did not invent these.',
      items: [
        ...(contractualSeverance != null ? [{ band: `Severance accrual — ${severanceMonthsPerYear} month(s) per year of service`, amount: null, rate: null, tax: UGX(contractualSeverance), note: 'YOUR figure. The Act in force fixes none.' }] : []),
        ...(gratuity != null ? [{ band: `Contractual gratuity — ${(contractualGratuityPct * 100).toFixed(0)}% of annual salary`, amount: null, rate: null, tax: UGX(gratuity) }] : []),
        ...(annualLeaveCoverCost ? [{ band: 'Cover during annual leave', amount: null, rate: null, tax: UGX(annualLeaveCoverCost) }] : []),
      ],
      total: UGX(contractualCost),
    },

    // 🔑 THE THIRD COLUMN. The one nobody else has, because nobody else models
    // a law that is signed and not commenced.
    pending: {
      label: 'What is COMING — assented 29 April 2026, NOT YET IN FORCE.',
      rule: {
        id: assented.id,
        status: assented.status,
        assentedOn: assented.assentedOn,
        confidence: assented.confidence,
        source: assented.source,
        verifiedOn: assented.verifiedOn,
      },
      severancePerYear: UGX(pendingAnnualAccrual),
      ifItBitesRetrospectively: UGX(pendingBackBook),
      yourCurrentAccrual: contractualSeverance == null ? null : UGX(contractualSeverance),
      annualExposureGap: UGX(exposureGap),
      alsoChanges: assented.alsoChangesOnCommencement,
      openQuestions: assented.openQuestions,
    },

    steps: [
      { band: 'Statutory cost (law in force)', amount: null, rate: null, tax: UGX(statutoryCost) },
      { band: 'Contractual cost (your terms)', amount: null, rate: null, tax: UGX(contractualCost) },
      { band: 'TOTAL, on the law as it stands today', amount: null, rate: null, tax: UGX(total) },
      { band: 'Not included: severance under the assented Act, which is not in force', amount: null, rate: null, tax: null,
        note: `If it commences, it accrues ${fmt(UGX(pendingAnnualAccrual))} per year of service — and possibly ${fmt(UGX(pendingBackBook))} for the ${yearsOfService} year(s) already worked.` },
    ],

    // 🔴 THE REFUSAL, INSIDE A CALCULATOR THAT STILL RETURNS A NUMBER.
    whatWeCannotTellYou: [
      'WHEN THE NEW SEVERANCE RULE COMMENCES. The Employment (Amendment) Act 2025 was assented on 29 April 2026 and standardises severance at one month\'s salary per year worked. Its commencement date has NOT been gazetted. Until the Minister publishes that notice, it is not law — and we will not put it in your accounts as though it were. Nor will we pretend it is not coming.',
      'WHETHER IT WILL BITE RETROSPECTIVELY. No commentary we have found addresses whether the new formula applies to service accrued BEFORE commencement. For a long-serving employee that is the difference between a small liability and a large one. Nobody has answered this. We are not going to guess at it on your balance sheet.',
      'WHETHER THE BASE IS "SALARY" OR "GROSS SALARY". The 2023 Bill said gross. Firms reporting on the enacted Act say salary, not gross salary. On a package with allowances those are different numbers, and we have not read the enacted section ourselves.',
      severanceMonthsPerYear == null
        ? 'YOUR CURRENT SEVERANCE LIABILITY. Under the law in force (Employment Act s.89) the amount is NEGOTIATED. The only reliable source is your own contract. Tell us what it says and we will accrue it.'
        : 'Whether your contractual figure would survive a challenge at the Industrial Court. That is a legal question, not an arithmetic one.',
      'Whether this person is an EMPLOYEE at all. If they are genuinely a consultant, none of this applies — and if they are an employee dressed as a consultant, all of it does, retrospectively, with interest.',
    ],

    warnings: [
      { severity: 'high',
        text: `SEVERANCE IS ABOUT TO CHANGE, AND IT IS NOT LAW YET. The Employment (Amendment) Act 2025 was signed on 29 April 2026 and fixes severance at one month's salary per year worked — ${fmt(UGX(pendingAnnualAccrual))} a year for this employee. THE COMMENCEMENT DATE HAS NOT BEEN GAZETTED, so it is not in force today. Every HR guide in Uganda is already reporting it as the law. It is not. But it will be, and you are not told when.` },
      ...(exposureGap > 0 ? [{ severity: 'high',
        text: `Your contract accrues ${contractualSeverance == null ? 'NOTHING' : fmt(UGX(contractualSeverance))} of severance a year. The assented Act would require ${fmt(UGX(pendingAnnualAccrual))}. That is an unprovided exposure of ${fmt(UGX(exposureGap))} PER YEAR, per employee — and if it applies to service already worked, ${fmt(UGX(pendingBackBook))} for this one person alone.` }] : []),
      { severity: 'medium',
        text: 'The same Act also rewrites SICK LEAVE (2 months full pay, then 4 at half pay), makes a missed pre-dismissal hearing an automatic 4 weeks\' net pay, doubles the unfair-dismissal award to 8 weeks, and raises probation notice from 7 days to a month. None of it is costed in the figure above, because none of it is in force. All of it lands on the same day.' },
      { severity: 'info',
        text: 'Local Service Tax is NOT in this figure, and that is deliberate. You REMIT it, but you DEDUCT it from the employee — it is their tax, not your cost. Employers routinely double-count it.' },
      { severity: 'info',
        text: 'Annual leave (21 working days) and public holidays are PAID OUT OF SALARY. They are not an additional cash cost unless you actually hire cover — which is why that line is zero unless you tell us otherwise.' },
      { severity: 'medium',
        text: `NSSF adds ${((employerNssf / annualGross) * 100).toFixed(0)}% to every salary you pay. It is also the arrear that grows in silence: 10% per month, compounding, with no notification event. A grant ends, contributions stop, and nobody writes to tell you.` },
    ],
    notes: [
      'Employer NSSF contributions are DEDUCTIBLE to the company, and the employee\'s eventual lump sum is EXEMPT coming out (ITA s.21(1)(n)). Of all the money you spend on an employee, this is the least wasteful.',
      'The day the commencement notice is gazetted, one rule flips in this engine and every affected client\'s figures move with it. That is what versioned rules are FOR.',
    ],
    disclaimerTier: 3,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 13. CORPORATE INCOME TAX — and the tax we INVENTED and had to delete
//
// 🔴 THIS FUNCTION USED TO CHARGE A 0.5% MINIMUM TAX THAT DOES NOT EXIST.
//
// I built it from Clause 8 of the Income Tax (Amendment) Bill 2026. The clause
// was real, gazetted, and quoted by four Kampala law firms. And on 23 April 2026
// PARLIAMENT DELETED IT ON THE FLOOR. The Speaker asked what exactly you are
// taxing after seven years of losses; the Minister conceded; the House voted it
// out. KPMG's summary of the enacted Act does not mention it.
//
// I read the Bill and called it the law — the precise failure this company was
// founded to name in other people.
//
// WHAT ACTUALLY EXISTS is quieter and more useful: ITA Cap 338 s.36(6), in force
// since 1 July 2023. A company still carrying assessed losses after SEVEN years
// may deduct only FIFTY PERCENT of the brought-forward loss each year thereafter.
//
// The loss is THROTTLED, not taxed. Nobody pays tax on a loss. But relief that
// you assumed was banked is now released at half speed — and a business planning
// on a full offset in year eight is short by half.
// ═════════════════════════════════════════════════════════════════════════════

function corporateIncomeTax({ chargeableIncome, lossBroughtForward = 0, yearsCarryingLosses = 0 }) {
  const rule = RULES.CIT_2026;
  const lr = rule.lossRestriction;

  // s.36(6): after 7 years, only HALF the brought-forward loss may be deducted.
  const throttled = yearsCarryingLosses > lr.afterYears;
  const lossAllowed = throttled ? lossBroughtForward * lr.deductiblePctOfCarriedLoss : lossBroughtForward;
  const lossDeferred = lossBroughtForward - lossAllowed;

  const afterLosses = chargeableIncome - lossAllowed;
  const tax = Math.max(0, afterLosses) * rule.rate;

  const steps = [
    { band: 'Chargeable income', amount: UGX(chargeableIncome), rate: null, tax: null,
      note: 'Gross income LESS allowable deductions. Not "gross profit", and not your accounting profit.' },
    ...(lossBroughtForward > 0 ? [
      { band: 'Losses brought forward', amount: UGX(lossBroughtForward), rate: null, tax: null },
      ...(throttled ? [{
        band: `less the s.36(6) THROTTLE — only 50% is deductible after ${lr.afterYears} years`,
        amount: UGX(lossDeferred), rate: lr.deductiblePctOfCarriedLoss, tax: null,
        note: `You have carried losses for ${yearsCarryingLosses} years. From year 8, only half the brought-forward loss may be deducted each year. ${fmt(UGX(lossDeferred))} of relief is DEFERRED, not lost.`,
      }] : []),
      { band: 'Loss actually deducted', amount: null, rate: null, tax: -UGX(lossAllowed) },
    ] : []),
    { band: 'Taxable after losses', amount: UGX(Math.max(0, afterLosses)), rate: null, tax: null },
    { band: 'Corporation tax @ 30%', amount: null, rate: rule.rate, tax: UGX(tax) },
  ];

  return {
    ok: true, refused: false,
    result: UGX(tax),
    currency: 'UGX',
    label: 'Corporate income tax',
    rule: ruleBlock(rule),
    inputs: { chargeableIncome: UGX(chargeableIncome), lossBroughtForward: UGX(lossBroughtForward), yearsCarryingLosses },
    steps,
    losses: {
      broughtForward: UGX(lossBroughtForward),
      throttled,
      deducted: UGX(lossAllowed),
      deferredToNextYear: UGX(lossDeferred),
      rule: lr.source,
    },
    warnings: [
      ...(throttled ? [{ severity: 'high',
        text: `THE 50% LOSS THROTTLE IS BITING. You have carried assessed losses for ${yearsCarryingLosses} years. Under ITA s.36(6) — in force since 1 July 2023 — only HALF of a brought-forward loss is deductible from year 8 onward. ${fmt(UGX(lossDeferred))} of relief you were probably counting on this year is deferred. It is NOT lost — it carries on — but your cash tax this year is higher than your model says.` }] : []),
      ...(yearsCarryingLosses >= 6 && yearsCarryingLosses <= 7 ? [{ severity: 'medium',
        text: `You are ${8 - yearsCarryingLosses} year(s) from the s.36(6) loss throttle. Once you pass seven years of carried-forward losses, only half of the brought-forward loss is deductible each year. Plan the cash for it now.` }] : []),
      { severity: 'info',
        text: 'THERE IS NO MINIMUM TAX IN UGANDA. A 0.5%-of-gross-income charge on long-term loss-makers was Clause 8 of the 2026 Bill — and Parliament DELETED it on 23 April 2026. Several law firms published it as though it had passed. If your adviser has told you that losses now attract a minimum tax, they read the Bill and not the Act.' },
      { severity: 'info',
        text: 'Provisional tax is due in TWO instalments for a company — by the end of month 6 and month 12 — each 50% of estimated annual tax LESS withholding tax already withheld from you (ITA Cap 338 s.121–122). Understating the estimate carries its own penalty under TPCA s.60.' },
    ],
    notes: rule.notes,
    nextAction: { text: 'Has withholding tax been deducted from your income? It is a CREDIT against this — not a cost.', product: 'wht_credits' },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 15. THE PRESUMPTIVE ELECTION MODELLER
//
// 🔑 THE BREAK-EVEN MARGIN — a number nobody in Uganda computes.
//
// Presumptive tax is a TURNOVER tax. Ordinary tax is a PROFIT tax.
//
// So presumptive PUNISHES A LOW MARGIN and REWARDS A HIGH ONE. A trader on a 4%
// margin and a consultant on a 60% margin, at identical turnover, pay identical
// presumptive tax — and wildly different ordinary tax.
//
// s.4(5) lets you ELECT OUT, in writing, and be taxed normally. It is one of the
// few genuine, unambiguous, free planning levers in the whole Act.
//
// Almost nobody uses it, because almost nobody knows their break-even margin.
// So we compute it.
// ═════════════════════════════════════════════════════════════════════════════

function presumptiveElection({ turnover, expenses, hasRecords = true, isProfessional = false, isCompany = false }) {
  const profit = turnover - expenses;
  const margin = turnover > 0 ? profit / turnover : 0;

  const pres = presumptive(turnover, hasRecords, isProfessional);

  // Not available? Then there is no election to model. Say so plainly.
  if (pres.excluded || pres.outOfRegime) {
    return {
      ...pres,
      label: 'Presumptive election — not available to you',
      nextAction: { text: 'You are in the ordinary regime. Shall we model your income tax on profit?', product: isCompany ? 'cit' : 'ordinary_tax' },
    };
  }

  const presTax = pres.result;
  const ordinary = isCompany
    ? corporateIncomeTax({ chargeableIncome: profit })
    : individualIncomeTaxAnnual(profit);
  const ordTax = ordinary.result;

  // 🔑 The break-even margin: at what profit margin do the two regimes cost the same?
  // Ordinary tax is monotonic in profit, so bisect on profit ∈ [0, turnover].
  const ordinaryTaxOn = (p) => (isCompany
    ? corporateIncomeTax({ chargeableIncome: p }).result
    : individualIncomeTaxAnnual(p).result);

  let bLo = 0, bHi = turnover;
  if (ordinaryTaxOn(bHi) < presTax) {
    bLo = bHi = turnover; // even a 100% margin is cheaper under ordinary tax
  } else {
    for (let i = 0; i < 60; i++) {
      const mid = (bLo + bHi) / 2;
      if (ordinaryTaxOn(mid) >= presTax) bHi = mid; else bLo = mid;
    }
  }
  const breakEvenProfit = bHi;
  const breakEvenMargin = turnover > 0 ? breakEvenProfit / turnover : 0;
  const alwaysCheaperToElect = breakEvenProfit >= turnover;

  return {
    ok: true, refused: false,
    result: null,
    label: 'Presumptive tax, or elect out?',
    rule: ruleBlock(RULES.PRESUMPTIVE_2020),
    inputs: { turnover: UGX(turnover), expenses: UGX(expenses), profit: UGX(profit), margin, hasRecords, isCompany },

    // An options-trace must still SHOW ITS WORKING. Two regimes, side by side,
    // with the arithmetic visible. Nothing here is a recommendation.
    steps: [
      { band: 'Turnover',                                     amount: UGX(turnover), rate: null, tax: null },
      { band: 'less costs',                                   amount: null, rate: null, tax: -UGX(expenses) },
      { band: `Profit — a ${(margin * 100).toFixed(1)}% margin`, amount: null, rate: null, tax: UGX(profit) },
      { band: 'Presumptive tax — charged on TURNOVER, ignores your costs entirely', amount: UGX(turnover), rate: null, tax: UGX(presTax) },
      { band: `${isCompany ? 'Corporation tax' : 'Ordinary income tax'} — charged on PROFIT`, amount: UGX(profit), rate: null, tax: UGX(ordTax) },
      { band: 'The difference',                               amount: null, rate: null, tax: UGX(Math.abs(presTax - ordTax)) },
    ],

    options: [
      { id: 'presumptive', label: 'Stay on presumptive tax',
        tax: UGX(presTax), effectiveRateOnProfit: profit > 0 ? presTax / profit : null,
        howItWorks: [
          'A tax on TURNOVER, not on profit. Your costs are irrelevant to it.',
          'It is FINAL — no deductions for expenditure or losses.',
          'Withholding tax credits and provisional tax paid REMAIN claimable (Schedule 3, Part II).',
        ],
        requiresOfYou: 'Nothing. It is the default below 150,000,000 of turnover.',
        costs: [
          'You cannot deduct a single shilling of cost. A bad year costs you the same tax as a good one.',
          'You cannot carry forward a loss.',
        ],
        stopsWorkingWhen: `Your profit margin falls below ${(breakEvenMargin * 100).toFixed(1)}%. Below that, this regime taxes you more than ordinary tax would.` },

      { id: 'elect_out', label: 'Elect out — be taxed on profit',
        tax: UGX(ordTax), effectiveRateOnProfit: profit > 0 ? ordTax / profit : null,
        howItWorks: [
          isCompany
            ? 'Corporation tax at 30% of chargeable income — your actual profit after allowable deductions.'
            : 'Individual income tax at the ordinary bands — 0%, 20%, 25%, 30% — on your actual profit.',
          'Losses can be carried forward.',
        ],
        requiresOfYou: 'A WRITTEN ELECTION to the Commissioner under s.4(5). And then real books — because you are now taxed on a profit figure you must be able to prove.',
        costs: [
          'Bookkeeping. Real bookkeeping, of a standard that survives an audit.',
          'You become answerable for the deduction blockers: no TIN on a supplier over 5,000,000, no deduction. No EFRIS e-invoice from a designated supplier, no deduction — at ANY amount.',
        ],
        stopsWorkingWhen: `Your profit margin rises above ${(breakEvenMargin * 100).toFixed(1)}%. Above that, presumptive tax is cheaper.` },
    ],

    breakEven: {
      margin: breakEvenMargin,
      profit: UGX(breakEvenProfit),
      yourMargin: margin,
      alwaysCheaperToElect,
      meaning: alwaysCheaperToElect
        ? `At this turnover, ordinary tax is cheaper than presumptive tax AT EVERY MARGIN — even at a 100% margin. Presumptive tax has nothing to offer you here.`
        : `The two regimes cost the same at a profit margin of ${(breakEvenMargin * 100).toFixed(1)}% — that is a profit of ${fmt(UGX(breakEvenProfit))} on your turnover of ${fmt(UGX(turnover))}. You are running ${(margin * 100).toFixed(1)}%.`,
    },

    whatTheNumbersFavour: {
      option: ordTax < presTax ? 'elect_out' : ordTax > presTax ? 'presumptive' : 'neither — they are equal',
      by: UGX(Math.abs(presTax - ordTax)),
      caveat: 'On tax alone, for THIS year, on the numbers YOU gave us. Presumptive tax is a fixed cost and ordinary tax is a variable one — so the election is also a bet on your next few years, not just this one. A business with volatile margins may rationally pay more on average to pay less in a bad year.',
    },

    whatWeCannotTellYou: [
      'Whether your expense figure would survive an audit. Presumptive tax never asks. Ordinary tax always does.',
      'Whether the election, once made, binds you in future years. The Act does not say, URA has published no guidance, and there is no case law. This is a real open question and we will not pretend otherwise.',
      'Whether you can actually keep books to the standard the ordinary regime requires. Be honest with yourself here — a disallowed deduction is worse than a higher rate.',
    ],

    warnings: [
      { severity: 'medium',
        text: 'The election is a WRITTEN notice to the Commissioner. Not a checkbox, not a phone call, not a decision you make privately at year end. If it is not in writing, it did not happen.' },
      ...(margin < breakEvenMargin && presTax > ordTax ? [{ severity: 'high',
        text: `You are running a ${(margin * 100).toFixed(1)}% margin and paying presumptive tax at ${fmt(UGX(presTax))}. Ordinary tax on your actual profit would be ${fmt(UGX(ordTax))}. You are paying ${fmt(UGX(presTax - ordTax))} more than you need to, every year, because of a written election you have never made.` }] : []),
    ],
    theTest: 'If URA asked you why you did this — and "to save tax" were not an allowed answer — could you answer? Here you can: the election is an express statutory right, exercised in writing, and your books are real.',
    disclaimerTier: 3,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 22. RENTAL INCOME — and the threshold that did NOT move
//
// 🔴 THE ERROR THE ENGINE IS MOST LIKELY TO MAKE.
//
// On 1 July 2026 the annual PAYE tax-free threshold moved from 2,820,000 to
// 4,020,000. The RENTAL threshold did NOT move. It is still 2,820,000.
//
// They used to be the same number. THEY ARE NO LONGER THE SAME NUMBER.
//
// Anyone who "knows" the threshold is 2.82m and updates it globally will now
// under-tax every landlord in the country. Anyone who updates it globally to
// 4.02m will over-tax them. They are separate constants and they must stay that
// way. This comment exists so that whoever touches this next does not merge them.
// ═════════════════════════════════════════════════════════════════════════════

function rentalIncome({ grossRent, expenses = 0, isIndividual = true }) {
  const rule = RULES.RENTAL_2026;

  if (isIndividual) {
    const spec = rule.individual;
    const taxable = Math.max(0, grossRent - spec.threshold);
    const tax = taxable * spec.rate;

    return {
      ok: true, refused: false,
      result: UGX(tax),
      currency: 'UGX',
      label: 'Rental income tax — individual',
      rule: ruleBlock(rule),
      inputs: { grossRent: UGX(grossRent), isIndividual: true },
      steps: [
        { band: 'Gross rental income',        amount: UGX(grossRent), rate: null, tax: null },
        { band: `less the threshold`,         amount: null, rate: null, tax: -spec.threshold,
          note: 'UGX 2,820,000. This is NOT the PAYE threshold. The PAYE threshold moved to 4,020,000 on 1 July 2026. This one did not move.' },
        { band: 'Chargeable rental income',   amount: UGX(taxable), rate: null, tax: null },
        { band: 'Rental tax @ 12%',           amount: null, rate: spec.rate, tax: UGX(tax) },
      ],
      warnings: [
        { severity: 'high',
          text: 'As an individual you get NO deduction for expenses against rental income — not repairs, not agent fees, not the interest on the mortgage that bought the building. The 12% is charged on gross rent above the threshold. This is the single harshest feature of Ugandan rental tax and it surprises almost every first-time landlord.' },
        { severity: 'medium',
          text: 'The threshold is 2,820,000 — NOT the 4,020,000 PAYE threshold. They were identical until 1 July 2026 and they are now different. If your adviser has "updated the threshold", check WHICH threshold they updated.' },
        ...(expenses > 0 ? [{ severity: 'info',
          text: `You told us your expenses were ${fmt(UGX(expenses))}. We have ignored them, because the law does. If you held this property through a COMPANY instead, up to ${fmt(UGX(grossRent * rule.company.expenseCapPct))} of them would be deductible — see the comparison.` }] : []),
      ],
      comparison: (() => {
        const capped = Math.min(expenses, grossRent * rule.company.expenseCapPct);
        const coTax = Math.max(0, grossRent - capped) * rule.company.rate;
        return {
          under: 'a company',
          result: UGX(coTax),
          delta: UGX(coTax - tax),
          meaning: coTax > tax
            ? `Through a company this would be ${fmt(UGX(coTax))} — ${fmt(UGX(coTax - tax))} MORE. The company's 30% rate beats the 50% expense cap. Stay personal.`
            : `Through a company this would be ${fmt(UGX(coTax))} — ${fmt(UGX(tax - coTax))} LESS, because a company may deduct expenses (capped at 50% of rent). But you would then have to get the money OUT of the company, and a dividend costs 40.5% all-in. Model the whole route, not just this step.`,
        };
      })(),
      whatWeCannotTellYou: [
        'Whether you also have to charge VAT. Commercial rent is a taxable supply; residential letting is exempt. If you are letting commercial premises and your rents pass the VAT threshold, that is a separate and much larger obligation.',
        'How rental losses interact with your other income. Ask your adviser — we will not guess at it.',
      ],
      notes: rule.notes,
      disclaimerTier: 2,
    };
  }

  // Non-individual
  const spec = rule.company;
  const cap = grossRent * spec.expenseCapPct;
  const allowed = Math.min(expenses, cap);
  const disallowed = Math.max(0, expenses - cap);
  const chargeable = Math.max(0, grossRent - allowed);
  const tax = chargeable * spec.rate;

  return {
    ok: true, refused: false,
    result: UGX(tax),
    currency: 'UGX',
    label: 'Rental income tax — company',
    rule: ruleBlock(rule),
    inputs: { grossRent: UGX(grossRent), expenses: UGX(expenses), isIndividual: false },
    steps: [
      { band: 'Gross rental income',             amount: UGX(grossRent), rate: null, tax: null },
      { band: 'Expenses claimed',                amount: UGX(expenses),  rate: null, tax: null },
      { band: `Expense CAP — 50% of rent`,       amount: UGX(cap),       rate: spec.expenseCapPct, tax: null,
        note: 'For a person other than an individual or a partnership, deductible expenditure is capped at 50% of rental income. Spend more than that and the excess is simply lost.' },
      { band: 'Expenses ALLOWED',                amount: null, rate: null, tax: -UGX(allowed) },
      { band: 'Chargeable rental income',        amount: UGX(chargeable), rate: null, tax: null },
      { band: 'Tax @ 30%',                       amount: null, rate: spec.rate, tax: UGX(tax) },
    ],
    warnings: [
      ...(disallowed > 0 ? [{ severity: 'high',
        text: `${fmt(UGX(disallowed))} of your expenses are DISALLOWED — you spent the money and you get no relief for it. The cap is 50% of rental income (${fmt(UGX(cap))}), and you claimed ${fmt(UGX(expenses))}. A heavily-geared or heavily-maintained property held in a company hits this wall hard.` }] : []),
      { severity: 'info',
        text: 'And the money is still IN the company. Getting it out costs more: a dividend is 15% WHT on top of this 30%, i.e. 40.5% all-in. Model the extraction before you celebrate the deduction.' },
    ],
    notes: rule.notes,
    disclaimerTier: 2,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 24. THE WHT RATE CARD — with the gross-up nobody computes
//
// Two people sign a contract for "UGX 10,000,000". One means 10,000,000 into the
// bank. The other means 10,000,000 on the invoice. WHT of 6% sits between them,
// and neither of them has done the arithmetic.
//
// The gross-up is net ÷ (1 − rate). It is not net × (1 + rate). Getting this
// wrong under-pays the supplier every single time, by a small amount, forever.
// ═════════════════════════════════════════════════════════════════════════════

function whtRate({ paymentType, residence = 'resident', amount = 0, amountIsNet = false }) {
  const rule = RULES.WHT_2026;
  const spec = rule.rates.find((r) => r.key === paymentType);

  if (!spec) {
    return refuse({ ...rule, confidence: CONFIDENCE.F, label: 'Withholding tax',
      refusal: {
        headline: 'We do not recognise that payment type, and we will not guess at the rate.',
        why: [`"${paymentType}" is not in the rate card. Guessing a withholding rate is how a business becomes personally liable for tax it never deducted.`],
        whatWeAreDoing: 'The rate card carries every category in ITA s.118 et seq. that we have verified.',
        whatYouShouldDo: 'Tell us what the payment is FOR, in plain words, and we will find the category — or tell you that we cannot.',
      } });
  }

  const rate = residence === 'resident' ? spec.resident : spec.nonResident;

  if (rate == null) {
    return refuse({ ...rule, confidence: CONFIDENCE.F, label: `${spec.label} — ${residence}`,
      refusal: {
        headline: 'This withholding tax has no rate for that kind of recipient.',
        why: [
          `${spec.label} carries no ${residence} rate in the Act.`,
          residence === 'resident'
            ? 'This category applies only to NON-RESIDENTS. If your supplier is Ugandan, you are probably in the wrong category — which usually means you are about to deduct tax you should not deduct, or fail to deduct tax you must.'
            : 'This category applies only to RESIDENTS.',
        ],
        whatWeAreDoing: 'We encode only the rates the Act states. We do not interpolate.',
        whatYouShouldDo: 'Confirm the correct category with a licensed adviser before you pay. Withholding agent liability is PERSONAL — if you fail to withhold, URA collects from YOU, not from your supplier.',
      } });
  }

  // The gross-up. net = gross × (1 − rate)  ⟹  gross = net ÷ (1 − rate)
  const gross    = amountIsNet ? amount / (1 - rate) : amount;
  const withheld = gross * rate;
  const net      = gross - withheld;

  const lowerConfidence = spec.confidence && spec.confidence !== CONFIDENCE.A;

  return {
    ok: true, refused: false,
    result: UGX(withheld),
    currency: 'UGX',
    label: `Withholding tax — ${spec.label}`,
    rule: { ...ruleBlock(rule), confidence: spec.confidence || rule.confidence },
    inputs: { paymentType, residence, amount: UGX(amount), amountIsNet },
    steps: [
      { band: amountIsNet ? 'Agreed NET payment (what lands in their account)' : 'Invoice / contract value (GROSS)',
        amount: UGX(amount), rate: null, tax: null },
      ...(amountIsNet ? [{ band: `Grossed up — net ÷ (1 − ${(rate * 100).toFixed(1)}%)`, amount: null, rate: null, tax: UGX(gross),
        note: 'NOT net × (1 + rate). That is the mistake, and it under-pays the supplier every time.' }] : []),
      { band: `Withhold @ ${(rate * 100).toFixed(1)}% — ${residence}`, amount: UGX(gross), rate, tax: UGX(withheld) },
      { band: 'Pay the supplier', amount: null, rate: null, tax: UGX(net) },
      { band: 'Pay URA by the 15th of next month', amount: null, rate: null, tax: UGX(withheld) },
    ],
    isFinalTax: !!spec.final,
    creditToRecipient: !spec.final,
    warnings: [
      spec.final
        ? { severity: 'high',
            text: 'This is a FINAL tax. It is NOT a credit. The recipient cannot reclaim it, cannot offset it, and does not file against it. It is simply gone.' }
        : { severity: 'info',
            text: 'This is NOT a cost to your supplier. It is PREPAID TAX — a credit against their income tax liability. But ONLY if you give them the certificate. A credit they cannot evidence is a credit they do not have.' },
      { severity: 'high',
        text: 'Withholding agent liability is PERSONAL. If you fail to withhold, URA does not chase your supplier. It chases YOU — for the tax you did not deduct, plus interest at 2% per month.' },
      ...(spec.note ? [{ severity: 'info', text: spec.note }] : []),
      ...(lowerConfidence ? [{ severity: 'medium',
        text: `This rate is rated confidence ${spec.confidence}. It is new or recently changed, and we have corroboration but not yet a clean primary-source reading. Verify before you rely on it for a large payment. Verified ${rule.verifiedOn}.` }] : []),
    ],
    nextAction: spec.final
      ? { text: 'Remit it by the 15th. Nothing further is claimable.', product: 'filing' }
      : { text: 'ISSUE THE CERTIFICATE. Without it your supplier pays tax twice on the same income — and it costs you nothing to give.', product: 'wht_certificate' },
    notes: [
      'This is the Isaac mechanism, from the other side of the table. He never got his certificates. Somebody, on your side of a desk exactly like this one, did not issue them.',
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 27. VAT — INCLUSIVE / EXCLUSIVE
//
// The most-used and most-mis-used calculation in Uganda. To strip VAT from a
// gross figure you multiply by 18/118, NOT by 18%. Multiplying by 18% and
// subtracting is wrong by about 2.7% of the invoice — every time.
// ═════════════════════════════════════════════════════════════════════════════

function vatAmount({ amount, isInclusive = false }) {
  const rule = RULES.VAT_2026;
  const r = rule.rate;

  const exclusive = isInclusive ? amount / (1 + r) : amount;
  const vat       = isInclusive ? amount - exclusive : amount * r;
  const inclusive = exclusive + vat;

  // The mistake, quantified. Showing it is the teaching.
  const naiveWrong = isInclusive ? amount * r : null;

  return {
    ok: true, refused: false,
    result: UGX(vat),
    currency: 'UGX',
    label: isInclusive ? 'VAT contained in this amount' : 'VAT to add to this amount',
    rule: ruleBlock(rule),
    inputs: { amount: UGX(amount), isInclusive },
    steps: isInclusive
      ? [
          { band: 'Amount, VAT INCLUSIVE',   amount: UGX(amount),    rate: null, tax: null },
          { band: 'VAT = amount × 18 ÷ 118', amount: null,           rate: r,    tax: UGX(vat),
            note: 'NOT amount × 18%. The VAT is already inside the figure — you are extracting it, not adding it.' },
          { band: 'Amount, VAT EXCLUSIVE',   amount: null,           rate: null, tax: UGX(exclusive) },
        ]
      : [
          { band: 'Amount, VAT EXCLUSIVE',   amount: UGX(amount),    rate: null, tax: null },
          { band: 'VAT @ 18%',               amount: null,           rate: r,    tax: UGX(vat) },
          { band: 'Amount, VAT INCLUSIVE',   amount: null,           rate: null, tax: UGX(inclusive) },
        ],
    exclusive: UGX(exclusive),
    vat: UGX(vat),
    inclusive: UGX(inclusive),
    warnings: [
      ...(isInclusive ? [{ severity: 'medium',
        text: `The common error is to take 18% OF the gross: ${fmt(UGX(naiveWrong))}. That is ${fmt(UGX(naiveWrong - vat))} too much, on this invoice alone. Do it on every invoice for a year and it becomes a real number.` }] : []),
      { severity: 'high',
        text: 'VAT YOU COLLECT IS NOT YOUR MONEY. It is the government\'s money, passing through your account. A business that treats it as revenue is building a liability it cannot see — and at 2% per month, compounding, it will find it eventually.' },
      { severity: 'info',
        text: 'You may only charge VAT if you are REGISTERED. Charging VAT while unregistered is an offence; failing to charge it while registered means you pay it out of your own margin.' },
    ],
    nextAction: { text: 'Are you sure you must be registered? The threshold moved to 300,000,000 on 1 July 2026 — and the quarterly limb bites first.', product: 'vat_registration' },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 29. VAT DEREGISTRATION — the trap a Big Four firm published wrong
//
// s.9(2) is CUMULATIVE, and both limbs must be satisfied:
//
//     last 3 months  ≤ one-quarter of the threshold  →  75,000,000
//     last 12 months ≤ 75 PERCENT of the threshold   → 225,000,000
//
// PwC's public commentary says a business under 300,000,000 can deregister.
// That is wrong on the face of the statute. The 12-month limb is 225,000,000.
//
// 🔴 WHICH CREATES A TRAP WITH A REAL POPULATION IN IT.
//
// A business turning over 260,000,000 is BELOW the registration threshold and
// ABOVE the deregistration limb. It is not required to register. It is not
// entitled to deregister. IT IS STUCK — and its accountant is currently telling
// it, on the authority of a Big Four publication, that it can come off VAT.
//
// That gap is 75,000,000 wide. Every Ugandan business inside it is a customer.
// ═════════════════════════════════════════════════════════════════════════════

function vatDeregistration({ last3MonthsTurnover, last12MonthsTurnover }) {
  const rule = RULES.VAT_2026;
  const quarterlyLimb = rule.annualThreshold / rule.deregistration.quarterlyDivisor; //  75,000,000
  const annualLimb    = rule.annualThreshold * rule.deregistration.annualPct;        // 225,000,000
  const registrationThreshold = rule.annualThreshold;                                // 300,000,000

  const passesQuarterly = last3MonthsTurnover <= quarterlyLimb;
  const passesAnnual    = last12MonthsTurnover <= annualLimb;
  const canDeregister   = passesQuarterly && passesAnnual;

  const wouldHaveToRegister = last12MonthsTurnover > registrationThreshold;
  const stuck = !canDeregister && !wouldHaveToRegister;

  const failed = [];
  if (!passesQuarterly) failed.push(`Your last 3 months were ${fmt(UGX(last3MonthsTurnover))}, above the ${fmt(quarterlyLimb)} limb.`);
  if (!passesAnnual)    failed.push(`Your last 12 months were ${fmt(UGX(last12MonthsTurnover))}, above the ${fmt(annualLimb)} limb — which is 75% of the threshold, NOT the threshold itself.`);

  return {
    ok: true, refused: false,
    result: canDeregister,
    label: 'Can I come off VAT?',
    rule: ruleBlock(rule),
    inputs: { last3MonthsTurnover: UGX(last3MonthsTurnover), last12MonthsTurnover: UGX(last12MonthsTurnover) },
    steps: [
      { band: 'Limb 1 — last 3 months must be at or below',   amount: quarterlyLimb, rate: null, tax: null,
        note: `One-quarter of the 300,000,000 threshold. Yours: ${fmt(UGX(last3MonthsTurnover))} — ${passesQuarterly ? 'PASSES' : 'FAILS'}.` },
      { band: 'Limb 2 — last 12 months must be at or below',  amount: annualLimb,    rate: null, tax: null,
        note: `SEVENTY-FIVE PERCENT of the threshold — not the threshold. Yours: ${fmt(UGX(last12MonthsTurnover))} — ${passesAnnual ? 'PASSES' : 'FAILS'}.` },
      { band: 'Both limbs are required. s.9(2) is CUMULATIVE.', amount: null, rate: null, tax: null },
    ],
    canDeregister,
    limbs: { quarterly: { limit: quarterlyLimb, passes: passesQuarterly }, annual: { limit: annualLimb, passes: passesAnnual } },
    stuck,
    failed,

    // 🔴 The trap, named, with its exact boundaries.
    theGap: {
      from: annualLimb,
      to: registrationThreshold,
      width: registrationThreshold - annualLimb,
      youAreInIt: stuck,
      explanation: `Between ${fmt(annualLimb)} and ${fmt(registrationThreshold)} of annual turnover there is a 75,000,000-wide band in which a business is NOT REQUIRED TO REGISTER and NOT ENTITLED TO DEREGISTER. If you are already registered and you land here, you stay registered. There is no exit.`,
    },

    warnings: [
      ...(stuck ? [{ severity: 'high',
        text: `YOU ARE STUCK. At ${fmt(UGX(last12MonthsTurnover))} you are below the ${fmt(registrationThreshold)} registration threshold — so if you were starting today you would not have to register. But you CANNOT deregister, because s.9(2) requires your last 12 months to be at or below ${fmt(annualLimb)}. You must keep charging VAT, keep filing monthly, and keep the compliance burden of a much larger business.` }] : []),
      ...(canDeregister ? [{ severity: 'info',
        text: 'You appear to satisfy both limbs. Deregistration is an APPLICATION, not an automatic right — and think before you make it. Coming off VAT means you can no longer reclaim input VAT on your purchases. If your customers are themselves VAT-registered businesses, your VAT costs them nothing and your input recovery is worth real money. Deregistering can make you POORER.' }] : []),
      { severity: 'high',
        text: 'PwC Uganda\'s public commentary states that businesses under 300,000,000 can deregister. On the face of s.9(2), that is wrong: the 12-month limb is 75% of the threshold — 225,000,000. If your adviser has told you that you can come off VAT because you are "under the threshold", ask them which limb they applied.' },
    ],
    whatWeCannotTellYou: [
      'Whether you SHOULD deregister even if you can. That depends on your input VAT and on whether your customers can reclaim — and we have not seen your purchase ledger.',
      'How the Commissioner will exercise discretion on your application. s.9 gives criteria, not an entitlement.',
    ],
    nextAction: canDeregister
      ? { text: 'Before you apply — shall we model what you would LOSE in input VAT recovery?', product: 'vat_input' }
      : { text: 'Shall we model your VAT position as it stands?', product: 'vat' },
    disclaimerTier: 2,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 38. VOLUNTARY DISCLOSURE — what the waiver is actually worth
//
// 🔑 THE MOST VALUABLE LEGAL FACT IN THE ENGINE, PRICED.
//
// Where a taxpayer VOLUNTARILY DISCLOSES an offence to the Commissioner BEFORE
// court proceedings commence, the Commissioner MAY compound the offence: the
// taxpayer pays the outstanding tax, and no interest and no fine.
//
// This turns a diagnosis into a cure. And it has a number attached to it.
//
// 🔴 BUT NOTE THE WORD "MAY". This is a DISCRETION, not an entitlement. The
// arithmetic of what is at stake is confidence A. Whether the Commissioner will
// exercise the discretion in YOUR case is confidence C — so we compute the
// VALUE and we refuse to promise the OUTCOME. Those are different claims and a
// calculator that blurs them is selling false hope to a frightened person.
// ═════════════════════════════════════════════════════════════════════════════

function voluntaryDisclosure({ principal, monthsOverdue, compounds = true }) {
  const rule = RULES.PENALTIES_2026;
  const r = rule.interestPerMonth;

  const balanceNow = compounds
    ? principal * Math.pow(1 + r, monthsOverdue)
    : principal * (1 + r * monthsOverdue);

  const interest = balanceNow - principal;
  const ifYouDisclose = principal;         // the tax itself is NEVER waived
  const ifYouWait = balanceNow;
  const worth = interest;

  // And the cost of waiting another year to decide.
  const inTwelveMonths = compounds
    ? principal * Math.pow(1 + r, monthsOverdue + 12)
    : principal * (1 + r * (monthsOverdue + 12));

  return {
    ok: true, refused: false,
    result: UGX(worth),
    currency: 'UGX',
    label: 'What voluntary disclosure is worth to you',
    rule: ruleBlock(rule),
    inputs: { principal: UGX(principal), monthsOverdue, compounds },
    steps: [
      { band: 'The tax you actually owe (principal)', amount: null, rate: null, tax: UGX(principal),
        note: 'This is NEVER waived. Voluntary disclosure does not forgive the tax. It forgives what has grown on top of it.' },
      { band: `Interest — ${monthsOverdue} months @ 2%/month${compounds ? ', compounding' : ''}`, amount: null, rate: r, tax: UGX(interest) },
      { band: 'Balance if you do nothing', amount: null, rate: null, tax: UGX(ifYouWait) },
      { band: 'Balance if you disclose and it is compounded', amount: null, rate: null, tax: UGX(ifYouDisclose) },
      { band: 'THE WAIVER IS WORTH', amount: null, rate: null, tax: UGX(worth) },
    ],
    comparison: {
      under: 'doing nothing',
      result: UGX(ifYouWait),
      delta: UGX(worth),
      meaning: `Disclosing could save you ${fmt(UGX(worth))} — ${((worth / principal) * 100).toFixed(0)}% of the tax itself.`,
    },
    projection: {
      today: UGX(balanceNow),
      inTwelveMonths: UGX(inTwelveMonths),
      costOfWaitingOneYear: UGX(inTwelveMonths - balanceNow),
      annualisedRate: Math.pow(1 + r, 12) - 1,
    },
    theRoute: {
      headline: 'Find it → disclose it → agree instalments → get the TCC → win the tender.',
      steps: [
        'Find the arrear. Most people never do — it is invisible from inside their own books.',
        'Disclose it VOLUNTARILY, in writing, to the Commissioner — BEFORE any court proceedings commence. After that, this door is closed.',
        'Agree an instalment plan. URA\'s own TCC criteria EXPRESSLY accept a Memorandum of Understanding to pay in instalments as an alternative to paying in full.',
        'Get the Tax Clearance Certificate.',
        'Win the tender you have been losing.',
      ],
      note: 'Every step of that is in URA\'s own published rules. Nobody in Uganda is selling it as a product.',
    },

    // 🔴 The honest part.
    whatWeCannotTellYou: [
      'WHETHER THE COMMISSIONER WILL AGREE. The statute says the Commissioner MAY compound the offence. May. It is a discretion, not a right. We can tell you exactly what is at stake — that is arithmetic. We cannot tell you how the discretion will be exercised in your case, and anyone who tells you they can is guessing with your money.',
      'Whether your disclosure is still "voluntary". If URA has already opened an audit or issued an assessment, you may be past the point where this is available. The door closes quietly and you are not told.',
      'Whether there is more than one arrear. There usually is.',
    ],
    warnings: [
      { severity: 'high',
        text: `Interest does NOT stop while you dispute. In URA v Airtel the Supreme Court held that penal tax and interest continue to accrue throughout objection and Tribunal proceedings. The 30% deposit is the price of being HEARD — not a moratorium. Waiting another twelve months to decide costs you ${fmt(UGX(inTwelveMonths - balanceNow))}.` },
      { severity: 'medium',
        text: 'Disclosure is irrevocable. You are telling the tax authority about an offence. Do it with an adviser, in writing, and do it properly — a badly drafted disclosure can widen the enquiry rather than close it.' },
    ],
    nextAction: { text: 'Shall we draft the disclosure letter and the instalment MOU?', product: 'voluntary_disclosure_pack' },
    disclaimerTier: 4,
  };
}

// ═════════════════════════════════════════════════════════════════════════════

module.exports = {
  netToGross,
  trueCostOfEmployee,
  corporateIncomeTax,
  presumptiveElection,
  rentalIncome,
  whtRate,
  vatAmount,
  vatDeregistration,
  voluntaryDisclosure,
};
