/**
 * SELAH — TIER 2
 * ─────────────────────────────────────────────────────────────────────────────
 * Eleven calculators, verified against primary law on 11 July 2026.
 *
 * 🔴 THE LAW THIS TIER TAUGHT US, AND IT COST US A SHIPPED BUG:
 *
 *     A BILL IS NOT AN ACT.
 *     A GAZETTED BILL IS NOT AN ACT.
 *     A CLAUSE QUOTED BY FOUR LAW FIRMS IS NOT AN ACT.
 *
 * We shipped a 0.5% minimum tax on loss-making companies. It came from Clause 8
 * of the Income Tax (Amendment) Bill 2026 — real, gazetted, and repeated by MMAKS,
 * Crowe, mrt.tax and Global Law Experts. Parliament DELETED it on the floor on
 * 23 April 2026. The Speaker asked what exactly you are taxing after seven years
 * of losses. The Minister conceded. It never became law.
 *
 * We read the Bill and called it the Act — the precise failure this company was
 * founded to name in other people.
 *
 * So every rule now carries the STAGE it was read at, and only `in_force` may
 * compute. Where a rate is under active amendment and we cannot verify the
 * enacted text — stamp duty's 1.5% → 3% — WE COMPUTE THE VERIFIED RATE AND SAY
 * SO, LOUDLY. We do not guess twice.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { RULES, CONFIDENCE, STAGE } = require('./rules');
const { UGX, fmt, ruleBlock, refuse, composeConfidence, paye, individualIncomeTaxAnnual } = require('./engine');

// ═════════════════════════════════════════════════════════════════════════════
// 8. MOTOR VEHICLE BENEFIT — and URA is nine years out of date on its own page
//
//     (20% × A × B/C) − D
//
//   A = market value WHEN FIRST PROVIDED, then 35% reducing balance thereafter
//   B = days AVAILABLE for private use     C = days in the year     D = what the employee pays
//
// URA's own tax-education page still publishes the PRE-2017 formula with NO
// depreciation. Follow URA and you over-tax every company car from year two on.
// ═════════════════════════════════════════════════════════════════════════════

function motorVehicleBenefit({ marketValue, yearsSinceFirstProvided = 0, daysAvailable = 365, employeeContribution = 0 }) {
  const rule = RULES.MV_BENEFIT_2026;

  // "for the subsequent years" — no depreciation in the year of first provision.
  const depreciated = marketValue * Math.pow(1 - rule.depreciationRate, Math.max(0, yearsSinceFirstProvided));
  const annual = Math.max(0, rule.rate * depreciated * (daysAvailable / 365) - employeeContribution);

  // What URA's own stale page would tell you — the gap IS the product.
  const uraStale = Math.max(0, rule.rate * marketValue * (daysAvailable / 365) - employeeContribution);

  return {
    ok: true, refused: false,
    result: UGX(annual),
    currency: 'UGX',
    label: 'Motor vehicle benefit (annual, added to employment income)',
    rule: ruleBlock(rule),
    inputs: { marketValue: UGX(marketValue), yearsSinceFirstProvided, daysAvailable, employeeContribution: UGX(employeeContribution) },
    steps: [
      { band: 'A — market value when first provided', amount: UGX(marketValue), rate: null, tax: null },
      ...(yearsSinceFirstProvided > 0 ? [{
        band: `less 35% reducing-balance depreciation × ${yearsSinceFirstProvided} year(s)`,
        amount: null, rate: rule.depreciationRate, tax: UGX(depreciated - marketValue),
        note: 'The 2017 amendment. There is NO depreciation in the year the car is first provided — only "for the subsequent years".',
      }, { band: 'A — depreciated', amount: UGX(depreciated), rate: null, tax: null }] : []),
      { band: `20% of A × ${daysAvailable}/365 days available`, amount: null, rate: rule.rate, tax: UGX(rule.rate * depreciated * (daysAvailable / 365)) },
      ...(employeeContribution ? [{ band: 'D — less what the employee pays', amount: null, rate: null, tax: -UGX(employeeContribution) }] : []),
      { band: 'Benefit added to employment income', amount: null, rate: null, tax: UGX(annual) },
    ],
    monthly: UGX(annual / 12),
    comparison: yearsSinceFirstProvided > 0 ? {
      under: "URA's own published (stale) formula",
      result: UGX(uraStale),
      delta: UGX(uraStale - annual),
      meaning: `URA's tax-education page still shows the PRE-2017 formula, with no depreciation. Follow it and you would tax ${fmt(UGX(uraStale))} instead of ${fmt(UGX(annual))} — over-taxing this employee by ${fmt(UGX(uraStale - annual))} a year.`,
    } : null,
    warnings: [
      ...rule.warnings,
      { severity: 'medium',
        text: 'B is days AVAILABLE for private use — not days USED. A car parked at the employee\'s home over a weekend is available. Any part of a day counts as a whole day.' },
      { severity: 'info',
        text: 'The UGX 60,000,000 vehicle ceiling you may have heard of is a CAPITAL ALLOWANCE rule. It caps what the COMPANY may depreciate. It does NOT cap A here. Do not let the two collide.' },
    ],
    notes: rule.notes,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. HOUSING BENEFIT — and the gross-up that does not exist
//
// The benefit is the LESSER of:
//   (a) market rent LESS anything the employee pays
//   (b) 15% of employment income INCLUDING the amount in (a)
//
// 🔴 "Including the amount in (a)" is NOT a circular solve. Our own calculator
// spec said this was "grossed up". It is not. Implement the iterative
// 15%/(1−15%) = 17.647% and you OVER-TAX every housed employee in Uganda.
// ═════════════════════════════════════════════════════════════════════════════

function housingBenefit({ marketRent, cashEmploymentIncome, employeePays = 0 }) {
  const rule = RULES.HOUSING_BENEFIT_2026;

  const limbA = Math.max(0, marketRent - employeePays);
  const limbB = rule.pctOfEmploymentIncome * (cashEmploymentIncome + limbA);
  const benefit = Math.min(limbA, limbB);

  // The mistake, quantified. Showing it is the teaching.
  const wrongGrossUp = (rule.pctOfEmploymentIncome / (1 - rule.pctOfEmploymentIncome)) * cashEmploymentIncome;

  return {
    ok: true, refused: false,
    result: UGX(benefit),
    currency: 'UGX',
    label: 'Housing benefit (added to employment income)',
    rule: ruleBlock(rule),
    inputs: { marketRent: UGX(marketRent), cashEmploymentIncome: UGX(cashEmploymentIncome), employeePays: UGX(employeePays) },
    steps: [
      { band: 'Market rent',                                  amount: UGX(marketRent), rate: null, tax: null },
      ...(employeePays ? [{ band: 'less what the employee pays', amount: null, rate: null, tax: -UGX(employeePays) }] : []),
      { band: 'LIMB (a) — rent, net of employee payment',     amount: null, rate: null, tax: UGX(limbA) },
      { band: `LIMB (b) — 15% × (cash pay ${fmt(UGX(cashEmploymentIncome))} + limb (a) ${fmt(UGX(limbA))})`,
        amount: null, rate: rule.pctOfEmploymentIncome, tax: UGX(limbB),
        note: 'NOT a circular solve. Add limb (a) to cash pay, THEN take 15%. There is no gross-up.' },
      { band: 'The benefit — the LESSER of the two',          amount: null, rate: null, tax: UGX(benefit) },
    ],
    limbs: { a: UGX(limbA), b: UGX(limbB), binding: limbA <= limbB ? 'a' : 'b' },
    warnings: [
      { severity: 'high',
        text: `THERE IS NO GROSS-UP, and this is the error to avoid. The widely-circulated instruction to "gross up the housing benefit" at 15%/(1−15%) = 17.647% is not supported by the statute OR by URA's own worked example. Applying it here would give ${fmt(UGX(wrongGrossUp))} for limb (b) instead of ${fmt(UGX(limbB))} — and over-tax the employee.` },
      ...rule.warnings,
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. EMPLOYEE LOAN BENEFIT — and a live legal question we will not paper over
//
// The Act says "the Bank of Uganda DISCOUNT RATE at the commencement of the year
// of income". BoU publishes a Central Bank Rate (9.75%), a rediscount rate
// (12.75%) and a bank rate (13.75%) — and NONE of them is called "the discount
// rate". Practice uses the CBR. That is an interpretation, not a certainty, and
// on a large loan the difference is real money.
// ═════════════════════════════════════════════════════════════════════════════

function employeeLoanBenefit({ loanAmount, employerRate, monthsInYear = 12 }) {
  const rule = RULES.LOAN_BENEFIT_2026;

  if (loanAmount <= rule.threshold) {
    return {
      ok: true, refused: false, result: 0, currency: 'UGX',
      label: 'Employee loan benefit — none',
      rule: ruleBlock(rule),
      inputs: { loanAmount: UGX(loanAmount), employerRate, monthsInYear },
      steps: [{ band: `Loans totalling ${fmt(UGX(loanAmount))} — at or below the ${fmt(rule.threshold)} threshold`, amount: UGX(loanAmount), rate: null, tax: 0 }],
      belowThreshold: true,
      warnings: [{ severity: 'info',
        text: `The benefit only arises where loans TOTAL more than ${fmt(rule.threshold)}. Note "in total" — three separate 400,000 loans are one 1,200,000 loan for this purpose.` }],
    };
  }

  const statutory = rule.statutoryRate;
  const spread = Math.max(0, statutory - employerRate);
  const benefit = spread * loanAmount * (monthsInYear / 12);

  // The alternative reading of "discount rate". We show it because we are not sure.
  const altBenefit = Math.max(0, 0.1375 - employerRate) * loanAmount * (monthsInYear / 12);

  const conf = composeConfidence([
    { id: rule.id, confidence: CONFIDENCE.A, label: 'the benefit formula' },
    { id: rule.id, confidence: rule.statutoryRateConfidence, label: 'which BoU rate the Act means by "discount rate"' },
  ]);

  return {
    ok: true, refused: false,
    result: UGX(benefit),
    currency: 'UGX',
    label: 'Employee loan benefit (annual)',
    rule: { ...ruleBlock(rule), ...conf },
    inputs: { loanAmount: UGX(loanAmount), employerRate, monthsInYear },
    steps: [
      { band: 'Loan',                                        amount: UGX(loanAmount), rate: null, tax: null },
      { band: `Statutory rate — BoU CBR at 1 July 2026`,     amount: null, rate: statutory, tax: null,
        note: 'FIXED for the whole year of income at the rate on 1 July. It does not move when BoU moves.' },
      { band: 'Rate you actually charge the employee',       amount: null, rate: employerRate, tax: null },
      { band: `The spread — ${(spread * 100).toFixed(2)}%`,  amount: null, rate: spread, tax: null },
      { band: `× loan × ${monthsInYear}/12 months`,          amount: null, rate: null, tax: UGX(benefit) },
    ],
    alternativeReading: {
      rate: 0.1375,
      result: UGX(altBenefit),
      difference: UGX(altBenefit - benefit),
      meaning: `If "discount rate" means BoU's BANK RATE (13.75%) rather than the CBR, the benefit is ${fmt(UGX(altBenefit))} — ${fmt(UGX(altBenefit - benefit))} more. Nobody has settled which the Act means.`,
    },
    warnings: [
      ...rule.warnings,
      { severity: 'medium',
        text: `THIS ANSWER IS RATED CONFIDENCE ${conf.confidence}, and the reason is ${conf.limitedBy ? conf.limitedBy.label : 'an input'}. The formula is certain. The RATE is a legal question nobody in Uganda has answered.` },
    ],
    whatWeCannotTellYou: [
      'Which Bank of Uganda rate the Act means. It says "discount rate". BoU publishes three rates and calls none of them that. We use the CBR because PwC\'s own worked example does — but that is practice, not law.',
    ],
    disclaimerTier: 2,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. TERMINAL BENEFITS — and RSM is wrong about this in print
//
// The 25% relief attaches ONLY to compensation for TERMINATION (s.19(1)(d)),
// and only after 10 years with the SAME employer.
//
// GRATUITY IS NOT TERMINAL COMPENSATION. It is s.19(1)(a) — beside wages, salary,
// leave pay and bonus. IT IS FULLY TAXABLE.
//
// An employer exempting a quarter of every gratuity is under-deducting PAYE, and
// will pay the shortfall plus 2% a month when it is found.
// ═════════════════════════════════════════════════════════════════════════════

function terminalBenefits({ amount, kind = 'termination_compensation', yearsWithEmployer = 0 }) {
  const rule = RULES.TERMINAL_BENEFITS_2026;

  const isTermination = kind === 'termination_compensation';
  const qualifies = isTermination && yearsWithEmployer >= rule.minimumYearsWithSameEmployer;
  const taxable = qualifies ? amount * (1 - rule.exemptPct) : amount;
  const exempt = amount - taxable;

  // What an employer following RSM's guide would do — and the shortfall it creates.
  const rsmWouldExempt = yearsWithEmployer >= 10 ? amount * rule.exemptPct : 0;
  const rsmShortfall = !isTermination && rsmWouldExempt > 0 ? rsmWouldExempt : 0;

  return {
    ok: true, refused: false,
    result: UGX(taxable),
    currency: 'UGX',
    label: isTermination ? 'Termination compensation — taxable portion' : 'Gratuity — taxable portion',
    rule: ruleBlock(rule),
    inputs: { amount: UGX(amount), kind, yearsWithEmployer },
    steps: [
      { band: isTermination ? 'Compensation for termination (s.19(1)(d))' : 'Gratuity (s.19(1)(a))', amount: UGX(amount), rate: null, tax: null },
      qualifies
        ? { band: `less 25% exempt — ${yearsWithEmployer} years with this employer`, amount: null, rate: rule.exemptPct, tax: -UGX(exempt),
            note: 's.19(4): where s.19(1)(d) compensation is paid after TEN YEARS OR MORE with the same employer, only 75% is included in employment income.' }
        : { band: isTermination
              ? `NO relief — ${yearsWithEmployer} years is under the 10-year threshold`
              : 'NO relief — gratuity is FULLY TAXABLE. The 25% is not available on it.',
            amount: null, rate: null, tax: 0 },
      { band: 'Taxable', amount: null, rate: null, tax: UGX(taxable) },
    ],
    exemptAmount: UGX(exempt),
    warnings: [
      ...(!isTermination ? [{ severity: 'high',
        text: `GRATUITY IS FULLY TAXABLE. There is no 25% relief on it. RSM Uganda's published tax guide says "25% of GRATUITY payments shall be considered tax exempt" — that is wrong on the face of s.19. The relief in s.19(4) attaches to s.19(1)(d) COMPENSATION FOR TERMINATION. Gratuity is s.19(1)(a), listed beside wages and bonus.${rsmShortfall ? ` An employer following RSM here would exempt ${fmt(UGX(rsmShortfall))} that is taxable — and pay it back later with 2% a month on top.` : ''}` }] : []),
      ...(isTermination && !qualifies ? [{ severity: 'medium',
        text: `The 25% relief needs TEN YEARS OR MORE with the SAME employer. At ${yearsWithEmployer} years it does not apply — the whole payment is taxable. Service with a previous employer does not count.` }] : []),
      ...rule.warnings,
    ],
    notes: [
      'The exemption is 25% OF THE TERMINAL PAYMENT — not 25% of employment income, and not a 25% rate.',
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. THE SECOND-JOB TRAP — a second Isaac, on hundreds of thousands of payslips
//
// A second employment is taxed at a FLAT 30% of the whole of it. No tax-free
// band. No 20% step. No 25% step. A 500,000/month side job is taxed 150,000 —
// where the same 500,000 inside your main salary would attract about 38,000.
//
// 🔑 AND YOU CAN CLAIM IT BACK. URA's own page says so. Almost nobody does.
// ═════════════════════════════════════════════════════════════════════════════

function multipleEmployers({ mainMonthly, secondMonthly }) {
  const rule = RULES.MULTIPLE_EMPLOYMENT_2026;

  const flatRate = secondMonthly > rule.surchargeThresholdMonthly ? rule.secondaryRateAbove : rule.secondaryRate;
  const withheldOnSecond = secondMonthly * flatRate;
  const payeOnMain = paye(mainMonthly).result;
  const totalWithheld = payeOnMain + withheldOnSecond;

  // What you would ACTUALLY owe if both jobs were assessed together, properly.
  const trueTax = paye(mainMonthly + secondMonthly).result;
  const overpaid = totalWithheld - trueTax;

  return {
    ok: true, refused: false,
    result: UGX(withheldOnSecond),
    currency: 'UGX',
    label: 'Tax on your second job — and what you can claim back',
    rule: ruleBlock(rule),
    inputs: { mainMonthly: UGX(mainMonthly), secondMonthly: UGX(secondMonthly) },
    steps: [
      { band: 'PAYE on your main job (normal bands)',            amount: UGX(mainMonthly),   rate: null, tax: UGX(payeOnMain) },
      { band: `Second job — FLAT ${(flatRate * 100).toFixed(0)}%, no bands, no free allowance`,
        amount: UGX(secondMonthly), rate: flatRate, tax: UGX(withheldOnSecond),
        note: 'No tax-free threshold. No 20% step. No 25% step. The first shilling of a second job is taxed at 30%.' },
      { band: 'Total deducted from you, this month',             amount: null, rate: null, tax: UGX(totalWithheld) },
      { band: 'What you would owe if both were assessed TOGETHER', amount: UGX(mainMonthly + secondMonthly), rate: null, tax: UGX(trueTax) },
      { band: 'OVERPAID',                                        amount: null, rate: null, tax: UGX(overpaid) },
    ],
    reclaim: {
      monthly: UGX(overpaid),
      annual: UGX(overpaid * 12),
      how: 'Submit a return of emoluments from ALL sources and make a claim of tax overpaid. URA\'s own PAYE page says an employee aggrieved by the flat rate "may" do exactly this.',
    },
    warnings: [
      ...(overpaid > 0 ? [{ severity: 'high',
        text: `YOU ARE OVERPAYING ${fmt(UGX(overpaid))} EVERY MONTH — ${fmt(UGX(overpaid * 12))} a year. The flat rate ignores the tax-free band and the lower steps you have already used up. File a return of emoluments from all sources and claim it. URA's own page tells you that you may. Almost nobody does.` }] : []),
      ...rule.warnings,
    ],
    whatWeCannotTellYou: [
      'The enabling statutory paragraph. URA operates this rule, its DT-2008 return applies it, and enforcement is live — but the paragraph should sit in Schedule 4 Part I and every full text of the Act we could reach truncates before the schedules. We rate the RULE confidence B and the CITATION confidence F. A citation we have not read is not a citation, and we will not print one.',
    ],
    disclaimerTier: 2,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 19. CAPITAL ALLOWANCES — and the 50% first-year write-off that no longer exists
//
// Three classes, reducing balance: 40% / 30% / 20%. Four became three on 1 July
// 2021 — any table showing four is stale.
//
// 🔴 THE INITIAL ALLOWANCE IS GONE. The 50% on plant and machinery and the 20%
// on industrial buildings were ABOLISHED on 1 July 2023. Grant Thornton's data
// card still shows them. A model built on a first-year 50% write-off overstates
// your relief enormously — and the shortfall arrives as a tax bill.
// ═════════════════════════════════════════════════════════════════════════════

function capitalAllowances({ cost, assetClass = 3, years = 5, isCommercialVehicle = false, isRoadVehicle = false }) {
  const rule = RULES.CAPITAL_ALLOWANCES_2026;
  const spec = rule.classes.find((c) => c.cls === assetClass);
  if (!spec) throw new Error(`Unknown depreciation class: ${assetClass}`);

  // s.27(11)–(15): a NON-commercial road vehicle's cost base is capped.
  const capped = isRoadVehicle && !isCommercialVehicle && cost > rule.vehicleCeiling;
  const base = capped ? rule.vehicleCeiling : cost;
  const excluded = cost - base;

  const schedule = [];
  let wdv = base, total = 0;
  for (let y = 1; y <= years; y++) {
    const allowance = wdv * spec.rate;
    total += allowance;
    schedule.push({ year: y, opening: UGX(wdv), allowance: UGX(allowance), closing: UGX(wdv - allowance) });
    wdv -= allowance;
  }

  return {
    ok: true, refused: false,
    result: UGX(schedule[0].allowance),
    currency: 'UGX',
    label: `Capital allowances — class ${assetClass} at ${(spec.rate * 100)}% reducing balance`,
    rule: ruleBlock(rule),
    inputs: { cost: UGX(cost), assetClass, years, isRoadVehicle, isCommercialVehicle },
    steps: [
      { band: 'Cost of the asset',                              amount: UGX(cost), rate: null, tax: null },
      ...(capped ? [{ band: `CAPPED — a non-commercial road vehicle's cost base may not exceed ${fmt(rule.vehicleCeiling)}`,
        amount: UGX(excluded), rate: null, tax: null,
        note: `${fmt(UGX(excluded))} is excluded from depreciation. It is NOT LOST — s.27(12) splits it out as a non-depreciable business asset, so it still sits in your cost base when you sell.` }] : []),
      { band: `Class ${assetClass} — ${spec.label}`,            amount: UGX(base), rate: spec.rate, tax: null },
      { band: 'Year 1 allowance',                              amount: null, rate: spec.rate, tax: UGX(schedule[0].allowance) },
      { band: `Total over ${years} years`,                     amount: null, rate: null, tax: UGX(total) },
    ],
    schedule,
    totalOverPeriod: UGX(total),
    unrelievedAfterPeriod: UGX(wdv),
    vehicleCapApplied: capped,
    warnings: [
      ...rule.warnings,
      ...(capped ? [{ severity: 'high',
        text: `THE VEHICLE CAP BITES. ${fmt(UGX(excluded))} of this vehicle's cost cannot be depreciated. A "commercial vehicle" — designed to carry over half a tonne, or more than 13 passengers, or used in a transport or vehicle-rental business — is NOT capped. If this vehicle is genuinely commercial, tell us and the cap lifts.` }] : []),
      { severity: 'info',
        text: 'Assets are POOLED by class, not tracked individually. The allowance is the written-down value of the whole pool × the rate. Buying a second class-3 asset mid-year adds to the pool, it does not start a new one.' },
    ],
    notes: [
      'Reducing balance — so the relief never fully runs out. It just gets smaller. After 5 years at 20% you have relieved 67% of the cost, not 100%.',
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 20. START-UP COSTS — 25% a year for four years, and almost nobody claims it
// ═════════════════════════════════════════════════════════════════════════════

function startupCosts({ amount, yearsSinceIncurred = 0 }) {
  const rule = RULES.CAPITAL_ALLOWANCES_2026;
  const perYear = amount * rule.startupCostPct;
  const yearsLeft = Math.max(0, rule.startupCostYears - yearsSinceIncurred);
  const claimedSoFar = Math.min(yearsSinceIncurred, rule.startupCostYears) * perYear;

  return {
    ok: true, refused: false,
    result: UGX(yearsLeft > 0 ? perYear : 0),
    currency: 'UGX',
    label: 'Start-up cost deduction (this year)',
    rule: { ...ruleBlock(rule), source: { ...rule.source, provision: 'ITA Cap 338 s.29' } },
    inputs: { amount: UGX(amount), yearsSinceIncurred },
    steps: [
      { band: 'Non-recurring start-up costs',            amount: UGX(amount), rate: null, tax: null,
        note: 'Preliminary costs of establishing the business. Not recurring costs, and not the cost of assets (those are capital allowances).' },
      { band: '25% a year, for four years (s.29)',       amount: null, rate: rule.startupCostPct, tax: UGX(perYear) },
      { band: `Deductible THIS year`,                    amount: null, rate: null, tax: UGX(yearsLeft > 0 ? perYear : 0) },
      { band: 'Already claimed',                         amount: null, rate: null, tax: UGX(claimedSoFar) },
      { band: 'Still to come',                           amount: null, rate: null, tax: UGX(Math.max(0, yearsLeft - 1) * perYear) },
    ],
    perYear: UGX(perYear),
    yearsRemaining: yearsLeft,
    warnings: [
      { severity: 'high',
        text: 'ALMOST NOBODY CLAIMS THIS. Company formation, licences, legal fees on incorporation, initial market research — spread 25% a year over four years. It is a real deduction sitting in every Ugandan startup\'s first-year invoices, and most accountants expense it once and lose three quarters of it.' },
      ...(yearsLeft === 0 ? [{ severity: 'medium',
        text: 'The four-year window has closed on this expenditure. If you never claimed it, a voluntary amendment of prior returns may still be open to you — talk to an adviser before assuming it is gone.' }] : []),
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 18. PROVISIONAL TAX — and the penalty every Ugandan guide puts in the wrong Act
// ═════════════════════════════════════════════════════════════════════════════

function provisionalTax({ estimatedAnnualTax, whtAlreadyWithheld = 0, isCompany = true, actualChargeableIncome = null, estimatedChargeableIncome = null }) {
  const rule = RULES.PROVISIONAL_TAX_2026;
  const spec = isCompany ? rule.company : rule.individual;

  const perInstalment = Math.max(0, spec.pct * estimatedAnnualTax - whtAlreadyWithheld);

  // TPCA s.60 — and it is NOT in the Income Tax Act, whatever your guide says.
  let penalty = null;
  if (actualChargeableIncome != null && estimatedChargeableIncome != null) {
    const understated = estimatedChargeableIncome < rule.penalty.triggerBelowPctOfActual * actualChargeableIncome;
    if (understated) {
      const taxOn90 = individualIncomeTaxAnnual(rule.penalty.triggerBelowPctOfActual * actualChargeableIncome).result;
      const taxOnEstimate = individualIncomeTaxAnnual(estimatedChargeableIncome).result;
      penalty = {
        applies: true,
        amount: UGX(rule.penalty.rate * Math.max(0, taxOn90 - taxOnEstimate)),
        basis: rule.penalty.basis,
        statute: rule.penalty.statute,
      };
    } else {
      penalty = { applies: false, amount: 0, why: `Your estimate was at least 90% of your actual chargeable income. No penalty.` };
    }
  }

  return {
    ok: true, refused: false,
    result: UGX(perInstalment),
    currency: 'UGX',
    label: `Provisional tax — each of ${spec.instalments} instalments`,
    rule: ruleBlock(rule),
    inputs: { estimatedAnnualTax: UGX(estimatedAnnualTax), whtAlreadyWithheld: UGX(whtAlreadyWithheld), isCompany },
    steps: [
      { band: 'Your estimate of the year\'s tax',                         amount: null, rate: null, tax: UGX(estimatedAnnualTax) },
      { band: `× ${spec.pct * 100}% (${spec.instalments} instalments a year)`, amount: null, rate: spec.pct, tax: UGX(spec.pct * estimatedAnnualTax) },
      { band: 'less withholding tax already deducted FROM you',           amount: null, rate: null, tax: -UGX(whtAlreadyWithheld),
        note: 'WHT is PREPAID TAX. It reduces the instalment. Businesses routinely pay provisional tax in full AND suffer WHT — paying twice.' },
      { band: 'Each instalment',                                          amount: null, rate: null, tax: UGX(perInstalment) },
    ],
    schedule: { instalments: spec.instalments, dueEndOfMonths: spec.months, each: UGX(perInstalment) },
    penalty,
    warnings: [
      { severity: 'high',
        text: `UNDERSTATE THE ESTIMATE AND YOU ARE PENALISED. If your estimate is less than 90% of your actual chargeable income, TPCA s.60 charges 20% of the difference between the tax on 90% of the actual and the tax on your estimate. Note the Act: it is the TAX PROCEDURES CODE, not the Income Tax Act. Every Ugandan guide we checked puts this penalty in the wrong statute.` },
      ...rule.warnings,
      { severity: 'info',
        text: `${isCompany ? 'A company pays TWO instalments — by the end of month 6 and month 12.' : 'An individual pays FOUR instalments — by the end of months 3, 6, 9 and 12.'} And the final return is due six months after year end.` },
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 30. INPUT VAT — what you may NOT reclaim, and the 90% everyone forgets
//
// Passenger cars: fully blocked. Entertainment: fully blocked.
// 🔑 TELEPHONE: only 10% is blocked. NINETY PERCENT IS RECOVERABLE.
//
// Almost every Ugandan business either claims 100% of its phone VAT (and is
// wrong) or claims none of it (and is poorer than it needs to be).
// ═════════════════════════════════════════════════════════════════════════════

function inputVatRecoverable({ items }) {
  const rule = RULES.INPUT_VAT_BLOCKED_2026;
  const vatRule = RULES.VAT_2026;

  const lines = items.map((it) => {
    const spec = rule.blocked.find((b) => b.key === it.key);
    const vat = it.vatPaid != null ? it.vatPaid : it.amount * vatRule.rate;
    const blockedPct = spec ? spec.pctBlocked : 0;
    const blocked = vat * blockedPct;
    return {
      key: it.key,
      label: spec ? spec.label : (it.label || 'Ordinary business expense'),
      vat: UGX(vat),
      blockedPct,
      blocked: UGX(blocked),
      recoverable: UGX(vat - blocked),
      exception: spec ? spec.exception : null,
    };
  });

  const totalVat = lines.reduce((a, l) => a + l.vat, 0);
  const totalBlocked = lines.reduce((a, l) => a + l.blocked, 0);
  const totalRecoverable = totalVat - totalBlocked;

  return {
    ok: true, refused: false,
    result: UGX(totalRecoverable),
    currency: 'UGX',
    label: 'Input VAT you may actually reclaim',
    rule: ruleBlock(rule),
    inputs: { items },
    steps: lines.map((l) => ({
      band: `${l.label}${l.blockedPct ? ` — ${(l.blockedPct * 100).toFixed(0)}% BLOCKED` : ''}`,
      amount: l.vat, rate: l.blockedPct || null, tax: l.recoverable,
      note: l.exception,
    })).concat([
      { band: 'Total input VAT paid',   amount: null, rate: null, tax: UGX(totalVat) },
      { band: 'Blocked',                amount: null, rate: null, tax: -UGX(totalBlocked) },
      { band: 'RECOVERABLE',            amount: null, rate: null, tax: UGX(totalRecoverable) },
    ]),
    lines,
    warnings: [
      { severity: 'high',
        text: '🔑 TELEPHONE VAT IS ONLY 10% BLOCKED — NINETY PERCENT IS RECOVERABLE. It is a partial restriction, not a full block. Businesses either claim all of it (wrong, and an assessment waiting to happen) or none of it (and are simply poorer). On a year of company airtime that is real money left on the table.' },
      ...rule.warnings,
      { severity: 'medium',
        text: 'A "passenger automobile" is a road vehicle designed SOLELY for carrying seated people. A pickup or a goods vehicle is not one — its VAT is recoverable. The block is narrower than most businesses assume.' },
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 36. ADVANCE TAX — TRANSPORT. And the tonnage everyone gets wrong.
//
// 🔑 The tonnage is the LOADING CAPACITY — gross weight MINUS net weight, both
// off the logbook. It is NOT gross vehicle weight, which is what nearly every
// published guide implies. Use gross and you overstate the tax badly.
// ═════════════════════════════════════════════════════════════════════════════

function advanceTaxTransport({ kind = 'goods', loadingCapacityTonnes = 0, seats = 0, vehicles = 1 }) {
  const rule = RULES.ADVANCE_TAX_TRANSPORT_2026;

  let per = 0, steps = [];
  if (kind === 'goods') {
    if (loadingCapacityTonnes <= rule.goodsVehicleThresholdTonnes) {
      return {
        ok: true, refused: false, result: 0, currency: 'UGX',
        label: 'Advance tax — none',
        rule: ruleBlock(rule),
        inputs: { kind, loadingCapacityTonnes, vehicles },
        steps: [{ band: `Loading capacity ${loadingCapacityTonnes}t — at or below the 2-tonne threshold`, amount: null, rate: null, tax: 0 }],
        warnings: [{ severity: 'info', text: 'Advance tax on goods vehicles applies only ABOVE 2 tonnes of loading capacity.' }],
      };
    }
    per = loadingCapacityTonnes * rule.goodsVehiclePerTonne;
    steps = [
      { band: 'Loading capacity (gross weight − net weight, from the logbook)', amount: loadingCapacityTonnes, rate: null, tax: null,
        note: '🔑 NOT gross vehicle weight. Almost every guide implies gross. Using gross overstates the tax.' },
      { band: `× ${fmt(rule.goodsVehiclePerTonne)} per tonne, per year`, amount: null, rate: null, tax: UGX(per) },
    ];
  } else if (kind === 'passenger') {
    per = seats * rule.passengerSeatPerYear;
    steps = [
      { band: 'Passenger seats', amount: seats, rate: null, tax: null },
      { band: `× ${fmt(rule.passengerSeatPerYear)} per seat, per year`, amount: null, rate: null, tax: UGX(per) },
    ];
  } else {
    per = rule.bodaPerYear;
    steps = [{ band: 'Motorcycle (boda boda), licensed for one passenger', amount: null, rate: null, tax: UGX(per) }];
  }

  const total = per * vehicles;

  return {
    ok: true, refused: false,
    result: UGX(total),
    currency: 'UGX',
    label: 'Advance income tax — transport (annual)',
    rule: ruleBlock(rule),
    inputs: { kind, loadingCapacityTonnes, seats, vehicles },
    steps: [...steps, ...(vehicles > 1 ? [{ band: `× ${vehicles} vehicles`, amount: null, rate: null, tax: UGX(total) }] : [])],
    perVehicle: UGX(per),
    warnings: rule.warnings,
    nextAction: { text: 'This is CREDITABLE against your income tax. Are you claiming it on your return?', product: 'filing' },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 34. STAMP DUTY — and a rate we REFUSE to guess at
//
// The Stamp Duty (Amendment) Bill 2026 doubles the transfer rate from 1.5% to 3%.
// The Bill text is unambiguous. But KPMG's summary of what Parliament PASSED does
// not mention it, and neither does Daily Monitor's.
//
// 🔴 WE HAVE ALREADY BEEN BURNED BY EXACTLY THIS. We built a 0.5% minimum tax
// from a gazetted Bill clause that Parliament deleted on the floor.
//
// So we compute the VERIFIED rate, we show what the Bill would do, and we tell
// you to get the gazetted Act before you complete. On a 500m property the
// difference is 7,500,000 shillings.
// ═════════════════════════════════════════════════════════════════════════════

function stampDuty({ instrument, value = 0 }) {
  const rule = RULES.STAMP_DUTY_2026;
  const spec = rule.items.find((i) => i.key === instrument);

  if (!spec) {
    return refuse({ ...rule, confidence: CONFIDENCE.F, label: 'Stamp duty',
      refusal: {
        headline: 'We do not recognise that instrument, and we will not guess at the duty.',
        why: [`"${instrument}" is not in our verified schedule. Schedule 2 of the Stamp Duty Act has dozens of instruments and we have encoded only the ones we have read.`],
        whatWeAreDoing: 'Extending the schedule as we verify each item against the Act.',
        whatYouShouldDo: 'Tell us what the document IS, in plain words, and we will find it — or tell you honestly that we have not verified it.',
      } });
  }

  const duty = spec.fixed != null ? spec.fixed : value * spec.rate;
  const isTransfer = instrument === 'transfer';

  // ✅ ANSWERED. Parliament REJECTED the 3% on 21 April 2026.
  // We keep the rejected proposal in the trace, because the user's adviser may
  // still be quoting it — and showing them what they were NEARLY charged, and
  // that Parliament threw it out, is worth more than silence.
  const rejected = rule.transferRateIncrease;
  const ifItHadPassed = isTransfer ? value * rejected.proposed : null;

  return {
    ok: true, refused: false,
    result: UGX(duty),
    currency: 'UGX',
    label: `Stamp duty — ${spec.label}`,
    rule: ruleBlock(rule),
    inputs: { instrument, value: UGX(value) },
    steps: [
      { band: spec.label, amount: value ? UGX(value) : null, rate: spec.rate, tax: UGX(duty),
        note: spec.note || (spec.fixed != null ? 'A fixed duty. It does not scale with value.' : null) },
      { band: `Stamp within ${rule.daysToStamp} days of execution`, amount: null, rate: null, tax: null },
    ],
    // ✅ The tax you were NEARLY charged — and the day Parliament killed it.
    rejectedIncrease: isTransfer ? {
      proposedRate: rejected.proposed,
      outcome: rejected.outcome,
      rejectedOn: rejected.rejectedOn,
      wouldHaveBeen: UGX(ifItHadPassed),
      youAreSaving: UGX(ifItHadPassed - duty),
      evidence: rejected.evidence,
      meaning: `The 2026 Bill proposed 3%, which on this value would have been ${fmt(UGX(ifItHadPassed))} — ${fmt(UGX(ifItHadPassed - duty))} more. PARLIAMENT REJECTED IT on 21 April 2026. Several Ugandan firms are still publishing the 3% as though it passed. If you are quoted it, you are being quoted a Bill.`,
    } : null,
    warnings: [
      ...(isTransfer ? rule.warnings : []),
      ...(spec.rate === 0 ? [{ severity: 'info',
        text: `NIL. ${spec.note || ''} If your lawyer has quoted you stamp duty on this, ask them which year's schedule they are reading — ULII's accessible full text is still the 2019 version, and it shows rates that were repealed in 2020 and 2025.` }] : []),
    ],
    disclaimerTier: isTransfer ? 3 : 1,
  };
}

module.exports = {
  motorVehicleBenefit,
  housingBenefit,
  employeeLoanBenefit,
  terminalBenefits,
  multipleEmployers,
  capitalAllowances,
  startupCosts,
  provisionalTax,
  inputVatRecoverable,
  advanceTaxTransport,
  stampDuty,
};
