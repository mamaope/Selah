/**
 * SELAH — THE RULES
 * ─────────────────────────────────────────────────────────────────────────────
 * Uganda's tax and compliance rules, encoded.
 *
 * THIS FILE IS THE COMPANY. Everything else is a rendering of it.
 *
 * FOUR LAWS, and they are not negotiable:
 *
 *   1. RULES ARE IMMUTABLE. Never edit a rule in place. Supersede it, with an
 *      effective date, and keep the old one. A return filed for FY2025/26 must
 *      still compute under FY2025/26 law, forever.
 *
 *   2. EVERY RULE CARRIES ITS SOURCE. Act, section, gazette. Never a blog.
 *
 *   3. EVERY RULE CARRIES A CONFIDENCE. A / B / C / F.
 *      C or F → THE ENGINE REFUSES TO COMPUTE. It does not guess and disclaim.
 *
 *   4. EVERY RULE CARRIES A VERIFIED DATE. Uganda's tax law changes every 1 July.
 *      An undated tax claim is a liability.
 *
 * Why this matters: on the day this was written, URA's own website published the
 * WRONG PAYE bands, PwC published the WRONG VAT threshold, and Grant Thornton's
 * guide still carried a table that expired in 2020.
 *
 * Being right is the product. This file is where being right lives.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CONFIDENCE = {
  A: 'A', // primary law confirmed + corroborated. Safe to display.
  B: 'B', // multiple independent professional sources. Safe, with the date.
  C: 'C', // single or conflicting source. DO NOT DISPLAY A NUMBER.
  F: 'F', // unknown. REFUSE.
};

// A rule may only be displayed at confidence A or B.
const DISPLAYABLE = new Set([CONFIDENCE.A, CONFIDENCE.B]);

// ═════════════════════════════════════════════════════════════════════════════
// PAYE — employment income
// ═════════════════════════════════════════════════════════════════════════════

const PAYE_RESIDENT_2026 = {
  id: 'UG.PAYE.RESIDENT.2026',
  label: 'PAYE — resident individual',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2026-07-01',
  effectiveTo: null,
  supersedes: 'UG.PAYE.RESIDENT.2012',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax (Amendment) Act 2026',
    provision: 'Schedule 4, Part I',
    gazette: 'Bills Supplement No. 2, Uganda Gazette No. 33, Vol. CXIX, 27 March 2026',
    corroboration: ['KPMG Uganda Budget Brief 2026', 'MMAKS Advocates, 13 Apr 2026', 'PwC Uganda, 21 Apr 2026'],
  },
  // Monthly bands. from is exclusive, to is inclusive.
  bands: [
    { from: 0,          to: 335_000,    rate: 0.00, base: 0,      note: 'Tax-free threshold. Raised from 235,000 on 1 July 2026.' },
    { from: 335_000,    to: 410_000,    rate: 0.20, base: 0,      note: 'The old 10% band was ABOLISHED. The first taxable shilling is now taxed at 20%.' },
    { from: 410_000,    to: 485_000,    rate: 0.25, base: 15_000, note: 'New band, introduced 1 July 2026.' },
    { from: 485_000,    to: Infinity,   rate: 0.30, base: 33_750, note: null },
  ],
  // The additional charge above 10m/month. Effective top marginal rate: 40%.
  surcharge: { threshold: 10_000_000, rate: 0.10,
    note: 'An additional 10% on the excess over 10,000,000/month. Effective top rate: 40%. ICPAU and the Uganda Manufacturers Association lobbied against this and lost.' },
  warnings: [{
    severity: 'high',
    text: "URA's own PAYE rate page still displays the superseded bands. If your employer is using URA's website, you are being over-deducted.",
    evidenceUrl: 'https://ura.go.ug/en/domestic-taxes/paye-rates/',
  }],
};

const PAYE_RESIDENT_2012 = {
  id: 'UG.PAYE.RESIDENT.2012',
  label: 'PAYE — resident individual (superseded)',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2012-07-01',
  effectiveTo: '2026-06-30',
  supersedes: null,
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax Act Cap. 338',
    provision: 'Schedule 4, Part I (pre-2026)',
    gazette: null,
    corroboration: ['URA, PAYE rates', 'RSM Uganda Tax Guide 2025/26'],
  },
  bands: [
    { from: 0,       to: 235_000,  rate: 0.00, base: 0,      note: null },
    { from: 235_000, to: 335_000,  rate: 0.10, base: 0,      note: null },
    { from: 335_000, to: 410_000,  rate: 0.20, base: 10_000, note: null },
    { from: 410_000, to: Infinity, rate: 0.30, base: 25_000, note: null },
  ],
  surcharge: { threshold: 10_000_000, rate: 0.10, note: null },
  warnings: [],
};

/**
 * 🔴 THE REFUSAL.
 *
 * Clause 20(a) of the 2026 Act substitutes the WHOLE of Part I of Schedule 4 —
 * which contained both the resident AND non-resident tables — with a table
 * headed "applicable to RESIDENT individuals". No non-resident table follows it.
 *
 * Read in full, from two independent copies of the gazetted Bill. EY and MMAKS
 * reproduce the same resident-only table. NO SOURCE IN UGANDA publishes
 * non-resident bands for FY2026/27.
 *
 * Either the schedule was repealed by accident, or the text is somewhere we
 * cannot reach. We don't know — and neither does anyone else.
 *
 * SO WE REFUSE. Every competitor's calculator will return a number here.
 * Ours returns the truth. This is the most persuasive screen in the product.
 */
const PAYE_NONRESIDENT_2026 = {
  id: 'UG.PAYE.NONRESIDENT.2026',
  label: 'PAYE — non-resident individual',
  confidence: CONFIDENCE.F,
  effectiveFrom: '2026-07-01',
  effectiveTo: null,
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax (Amendment) Act 2026',
    provision: 'Schedule 4, Part I — non-resident table NOT FOUND',
    gazette: 'Bills Supplement No. 2, Uganda Gazette No. 33, Vol. CXIX, 27 March 2026',
    corroboration: [],
  },
  refusal: {
    headline: 'We cannot calculate this, and we will not guess.',
    why: [
      'The 2026 Act replaced the whole of Schedule 4 Part I with a table headed "applicable to resident individuals". No non-resident bands follow it.',
      'We read the gazetted Bill in full, twice, from two independent copies. EY and MMAKS reproduce the same resident-only table.',
      'No source in Uganda publishes non-resident PAYE bands for this year. Not URA. Not the Big Four. Nobody.',
      'Either the schedule was repealed by accident, or the text is somewhere we cannot reach. We do not know — and neither does anyone else.',
    ],
    whatWeAreDoing: 'We have requested the enacted Act from URA and are preparing a private ruling request under TPCA s.53.',
    whatYouShouldDo: 'Speak to a licensed Ugandan tax adviser. Do not use a calculator that gives you a confident answer here — it does not know either.',
  },
  bands: null,
};

// ═════════════════════════════════════════════════════════════════════════════
// NSSF · LST
// ═════════════════════════════════════════════════════════════════════════════

const NSSF_2026 = {
  id: 'UG.NSSF.2026',
  label: 'National Social Security Fund',
  confidence: CONFIDENCE.B,
  effectiveFrom: '2022-01-02',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'National Social Security Fund Act Cap. 230, as amended 2021',
    provision: 's.7(2), s.11',
    corroboration: ['RSM Uganda Tax Guide 2025/26', 'URA'],
  },
  employeeRate: 0.05,
  employerRate: 0.10,
  deadlineDay: 15,
  notes: [
    'Charged on GROSS, not on chargeable income after PAYE.',
    'Every employer must register, IRRESPECTIVE of the number of employees. The old 5-employee threshold was removed in 2021.',
    'The employer 10% is a cost to the employer, not a deduction from the employee.',
    'Employer contributions to a retirement fund are EXEMPT going in (ITA s.19(2)(g)) and a lump sum is EXEMPT coming out (s.21(1)(n)). The employee\'s own contribution is NOT deductible (s.22(3)(h)).',
    'This is the MamaOpe rule: NSSF accrues silently with no notification event. Penalty is 10% per month, compounding.',
  ],
};

const LST_2026 = {
  id: 'UG.LST.2026',
  label: 'Local Service Tax',
  confidence: CONFIDENCE.B,
  effectiveFrom: '2008-07-01',
  verifiedOn: '2026-07-11',
  source: { instrument: 'Local Governments Act', provision: 'Local Service Tax schedule', corroboration: ['RSM Uganda Tax Guide 2025/26'] },
  // Annual, banded on monthly income. Deducted by the employer in 4 instalments Jul–Oct.
  bands: [
    { from: 0,         to: 100_000,   amount: 0 },
    { from: 100_000,   to: 200_000,   amount: 5_000 },
    { from: 200_000,   to: 300_000,   amount: 10_000 },
    { from: 300_000,   to: 400_000,   amount: 20_000 },
    { from: 400_000,   to: 500_000,   amount: 30_000 },
    { from: 500_000,   to: 600_000,   amount: 40_000 },
    { from: 600_000,   to: 700_000,   amount: 60_000 },
    { from: 700_000,   to: 800_000,   amount: 70_000 },
    { from: 800_000,   to: 900_000,   amount: 80_000 },
    { from: 900_000,   to: 1_000_000, amount: 90_000 },
    { from: 1_000_000, to: Infinity,  amount: 100_000 },
  ],
  deadline: '31 October',
  notes: [
    'Remitted to the LOCAL AUTHORITY of the employee\'s residence — NOT to URA.',
    'This is the most commonly missed employer obligation in Uganda, precisely because it is the only one that is not paid to URA.',
    'Penalty for late or non-remittance: 50% of the LST payable.',
    'LST paid by an individual IS deductible (ITA s.22(1)(d)).',
  ],
  bandsConfidence: CONFIDENCE.C, // the exact band amounts need a primary-source check
};

// ═════════════════════════════════════════════════════════════════════════════
// PRESUMPTIVE TAX — small business
// ═════════════════════════════════════════════════════════════════════════════

const PRESUMPTIVE_2020 = {
  id: 'UG.PRESUMPTIVE.2020',
  label: 'Presumptive tax — small business',
  confidence: CONFIDENCE.A, // the highest-confidence rule in the engine
  effectiveFrom: '2020-07-01',
  effectiveTo: null,
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax (Amendment) Act 2020, s.9 → Schedule 3, ITA Cap. 338',
    provision: 'Schedule 3 (formerly the Second Schedule)',
    gazette: 'Parliament of Uganda',
    corroboration: [
      'URA, "Taxation of Small Businesses", Vol 1 Issue 4, FY2024/25 — official leaflet, table reproduced IDENTICALLY',
      'URA, Small Business Taxpayer (web)',
      'PwC Worldwide Tax Summaries',
    ],
  },
  // Annual gross turnover. from exclusive, to inclusive.
  bands: [
    { from: 0,           to: 10_000_000,  noRecords: 0,       withRecords: { base: 0,       rate: 0,     over: 0 } },
    { from: 10_000_000,  to: 30_000_000,  noRecords: 80_000,  withRecords: { base: 0,       rate: 0.004, over: 10_000_000 } },
    { from: 30_000_000,  to: 50_000_000,  noRecords: 200_000, withRecords: { base: 80_000,  rate: 0.005, over: 30_000_000 } },
    { from: 50_000_000,  to: 80_000_000,  noRecords: 400_000, withRecords: { base: 180_000, rate: 0.006, over: 50_000_000 } },
    { from: 80_000_000,  to: 150_000_000, noRecords: 900_000, withRecords: { base: 360_000, rate: 0.007, over: 80_000_000 } },
  ],
  ceiling: 150_000_000,
  /**
   * THE EDGE CASE, RESOLVED.
   * s.4(5) says "LESS THAN 150m" — it excludes exactly 150,000,000.
   * Schedule 3's top band says "does not EXCEED 150m" — it includes it.
   *
   * It resolves cleanly, because Schedule 3 has no independent charging force.
   * Its own opening words: "The amount of tax payable FOR PURPOSES OF SECTION
   * 4(5) is—". It is a rate card, not a gateway. It computes; it does not qualify.
   *
   * At exactly 150,000,000: s.4(5) does not engage → ORDINARY regime.
   */
  ceilingIsExclusive: true,
  // s.4(8) — the statutory wording. Note it is BROADER than URA's own leaflet,
  // which says only "dental, medical and architectural... among others".
  excludedServices: [
    'medical', 'dental', 'architectural', 'engineering', 'accounting', 'legal',
    'other professional services', 'public entertainment services',
    'public utility services', 'construction services',
  ],
  notes: [
    'The tax is FINAL. No deductions for expenditure or losses.',
    'NO tax credits — EXCEPT withholding tax credit and provisional tax paid (Schedule 3, Part II). The WHT certificate retains its value in EVERY regime.',
    'A taxpayer may ELECT OUT in writing to the Commissioner and be taxed normally. This is a real planning lever.',
    'A CONSULTANT IS EXCLUDED (s.4(8)). Isaac was never in this regime. Half of Uganda\'s published tax guidance would route him into it anyway.',
    'URA does not compute this tax. The taxpayer types the amount into the portal themselves, from the brackets. There is no validation.',
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// CORPORATE INCOME TAX · RENTAL
// ═════════════════════════════════════════════════════════════════════════════

const CIT_2026 = {
  id: 'UG.CIT.2026',
  label: 'Corporate income tax',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2026-07-01',
  verifiedOn: '2026-07-11',
  source: { instrument: 'Income Tax Act Cap. 338', provision: 's.4', corroboration: ['PwC Worldwide Tax Summaries'] },
  rate: 0.30,
  /**
   * 🔴🔴 WE BUILT A TAX THAT DOES NOT EXIST. READ THIS BEFORE YOU TOUCH ANYTHING.
   *
   * This rule used to carry a "0.5% minimum tax on companies still carrying
   * losses after 7 years (new s.36(6a))". `corporateIncomeTax()` computed it.
   * Tests asserted it. It shipped.
   *
   * IT IS NOT LAW. It never was.
   *
   * It was CLAUSE 8 of the Income Tax (Amendment) Bill 2026 — gazetted, real,
   * and quoted by MMAKS, Crowe, mrt.tax and half of Kampala. Then, at the
   * Committee of the Whole House on 23 APRIL 2026, MP Dicksons Kateshumbwa said
   * it "sends the wrong signal to investors", Speaker Anita Among asked "after
   * seven years of losses, WHAT EXACTLY ARE YOU TAXING?", the Minister conceded,
   * and PARLIAMENT VOTED TO DELETE IT. KPMG's post-passage summary does not list
   * it. It is absent from the Act.
   *
   * WE READ THE BILL AND CALLED IT THE LAW.
   *
   * That is precisely the failure this company exists to name in other people.
   * URA publishes a stale rate; PwC publishes the wrong threshold; and Selah
   * published a tax Parliament had thrown out three months earlier.
   *
   * THE RULE THAT COMES OUT OF THIS, AND IT IS NOW LAW HERE:
   *
   *   A BILL IS NOT AN ACT. A GAZETTED BILL IS NOT AN ACT. A CLAUSE QUOTED BY
   *   FOUR LAW FIRMS IS NOT AN ACT. Parliament amends bills on the floor, and
   *   the floor is not always reported.
   *
   *   Every rule must name the stage it was read at: BILL / PASSED / ASSENTED /
   *   COMMENCED. Only COMMENCED may compute. (See SEVERANCE_2025 for the
   *   assented-but-not-commenced case — same disease, different symptom.)
   */
  notes: [
    'Charged on CHARGEABLE INCOME — gross income less allowable deductions. NOT on "gross profit", and NOT on your accounting profit.',
    'THERE IS NO MINIMUM TAX. The 0.5%-of-gross-income charge on long-term loss-makers was Clause 8 of the 2026 Bill and PARLIAMENT DELETED IT on 23 April 2026.',
    'What DOES exist (s.36(6), in force since 1 July 2023): a taxpayer still carrying forward assessed losses after SEVEN years may deduct only FIFTY PERCENT of the loss brought forward in each following year. The loss is throttled, not taxed.',
  ],
  lossRestriction: {
    afterYears: 7,
    deductiblePctOfCarriedLoss: 0.50,
    source: 'ITA Cap 338 s.36(6), in force 1 July 2023',
    note: 'Half the brought-forward loss is deductible. The rest waits. This is a THROTTLE on relief, not a charge to tax.',
  },
  minimumTax: null,   // ← does not exist. Do not resurrect it.
};

const DIVIDEND_WHT_2026 = {
  id: 'UG.WHT.DIVIDEND.2026',
  label: 'Withholding tax on dividends',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2026-07-01',
  verifiedOn: '2026-07-11',
  source: { instrument: 'Income Tax Act Cap. 338', provision: 's.118', corroboration: ['RSM Uganda Tax Guide 2025/26'] },
  rate: 0.15,
  listedIndividualRate: 0.10, // USE-listed, to resident individuals
};

const RENTAL_2026 = {
  id: 'UG.RENTAL.2026',
  label: 'Rental income tax',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2026-07-01',
  verifiedOn: '2026-07-11',
  source: { instrument: 'Income Tax Act Cap. 338', provision: 's.5', corroboration: ['RSM Uganda Tax Guide 2025/26'] },
  individual: { rate: 0.12, threshold: 2_820_000 },
  company:    { rate: 0.30, expenseCapPct: 0.50 },
  notes: [
    'The 2,820,000 individual threshold has NOT moved, even though the PAYE annual threshold moved from 2,820,000 to 4,020,000 on 1 July 2026.',
    'They used to be the same number. THEY ARE NO LONGER. Keep them as separate constants — this is the error the engine is most likely to make.',
    'For a person other than an individual or partnership, deductible expenditure is capped at 50% of rental income.',
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// WITHHOLDING TAX — the Isaac engine
// ═════════════════════════════════════════════════════════════════════════════

const WHT_2026 = {
  id: 'UG.WHT.2026',
  label: 'Withholding tax',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2026-07-01',
  verifiedOn: '2026-07-11',
  source: { instrument: 'Income Tax Act Cap. 338', provision: 's.118 et seq.', corroboration: ['RSM Uganda Tax Guide 2025/26', 'KPMG Uganda Budget Brief 2026'] },
  rates: [
    { key: 'professional_fees',   label: 'Professional / management / technical fees', resident: 0.06, nonResident: 0.15, final: false },
    { key: 'goods_services',      label: 'Goods or services over UGX 1,000,000',       resident: 0.06, nonResident: 0.06, final: false },
    { key: 'dividends',           label: 'Dividends',                                   resident: 0.15, nonResident: 0.15, final: false, note: '10% if listed on the USE, to resident individuals' },
    { key: 'interest',            label: 'Interest',                                    resident: 0.15, nonResident: 0.15, final: false },
    { key: 'govt_securities',     label: 'Interest on government securities',           resident: 0.20, nonResident: 0.20, final: false },
    { key: 'royalties',           label: 'Royalties (incl. SOFTWARE from 1 Jul 2026)',  resident: null, nonResident: 0.15, final: true, note: 'Raised from 5% to 15%, and extended to software, on 1 July 2026' },
    { key: 'rent_nonresident',    label: 'Rent to a non-resident',                      resident: null, nonResident: 0.15, final: true },
    { key: 'land_purchase',       label: 'Purchase of land (not a business asset)',     resident: 0.005, nonResident: null, final: false },
    { key: 'business_asset',      label: 'Purchase of a business or business asset',    resident: 0.06, nonResident: 0.10, final: false },
    { key: 'commissions',         label: 'Insurance/advertising agents, payment providers', resident: 0.10, nonResident: 0.15, final: false },
    { key: 'imports',             label: 'Imports (goods)',                             resident: 0.06, nonResident: 0.06, final: false },
    { key: 'shipping_air',        label: 'Ship / air transport operators',              resident: null, nonResident: 0.02, final: true },
    { key: 'entertainers_res',    label: 'Public entertainers (resident) — NEW 1 Jul 2026', resident: 0.06, nonResident: 0.15, final: false, confidence: CONFIDENCE.B },
    { key: 'foreign_debt',        label: 'Interest on foreign debt — NEW 1 Jul 2026',   resident: null, nonResident: 0.05, final: false, confidence: CONFIDENCE.B },
    { key: 'betting',             label: 'Betting / sports winnings — reinstated 1 Jul 2026', resident: 0.15, nonResident: 0.15, final: true, confidence: CONFIDENCE.B },
  ],
  deadlineDay: 15,
  /**
   * 🔑 THE CREDIT MECHANISM — THIS IS THE PRODUCT.
   *
   * WHT deducted from a resident is a CREDIT against income tax. It is NOT a
   * cost. It is PREPAID TAX.
   *
   * But the credit is only claimable IF THE TAXPAYER HOLDS THE CERTIFICATE.
   * No certificate → no credit → tax paid twice on the same income.
   *
   * Most Ugandan consultants never collect their certificates. This is not a
   * marginal problem. It is a systematic, silent, five-figure-USD transfer from
   * small consultants to the state, every year, entirely by accident.
   *
   * This is Isaac. UGX 70,000,000, over five years.
   */
  creditRules: {
    creditableIfCertificateHeld: true,
    survivesPresumptiveRegime: true, // Schedule 3, Part II
    note: 'A credit you cannot evidence is a credit you do not have.',
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// VAT
// ═════════════════════════════════════════════════════════════════════════════

const VAT_2026 = {
  id: 'UG.VAT.2026',
  label: 'Value Added Tax',
  confidence: CONFIDENCE.B,
  effectiveFrom: '2026-07-01',
  supersedes: 'UG.VAT.2015',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'VAT Act Cap. 349, as amended by the VAT (Amendment) Act 2026',
    provision: 's.7 (registration), s.9 (cancellation), s.24 (rate)',
    corroboration: [
      'Parliament of Uganda, 21 April 2026 — threshold raised to 300m',
      'KPMG TaxNewsFlash, 26 June 2026',
      'KPMG Uganda Budget Brief 2026',
    ],
  },
  rate: 0.18,
  annualThreshold: 300_000_000,
  /**
   * 🔑 THE QUARTERLY TRIGGER AUTO-SCALES, AND THIS IS THE ELEGANT BIT.
   *
   * 37,500,000 was NEVER a statutory number. VAT Act s.7(1) says a person must
   * register if, in any 3 calendar months, taxable supplies exceeded
   * "ONE-QUARTER OF THE ANNUAL REGISTRATION THRESHOLD SET OUT IN SUBSECTION (2)".
   *
   * s.7(2) is the ONLY place a number lives. So 37.5m was simply 150m ÷ 4.
   *
   * When s.7(2) went 50m → 150m in 2015, the quarterly trigger moved 12.5m →
   * 37.5m automatically. Nobody amended a "12.5m", because there was no such
   * figure to amend.
   *
   * Therefore from 1 July 2026: 300,000,000 ÷ 4 = 75,000,000.
   */
  quarterlyDivisor: 4,
  /**
   * 🔴 THE DEREGISTRATION TRAP — AND PwC IS WRONG ABOUT IT IN PUBLIC.
   *
   * s.9(2) is CUMULATIVE:
   *   last 3 months  ≤ one-quarter of the threshold  (75,000,000)  AND
   *   last 12 months ≤ 75 PERCENT of the threshold   (225,000,000)
   *
   * PwC's public commentary says businesses under 300m can deregister.
   * That is wrong on the statute. The 12-month limb is 225m.
   *
   * A business on 260m/year is BELOW the registration threshold but CANNOT meet
   * the deregistration test. It is stuck: not required to register, not entitled
   * to deregister.
   *
   * There is a real population of Ugandan businesses sitting in that gap right
   * now, being told by their accountants that they can come off VAT.
   *
   * That is a Selah product, fully formed, living in a two-word discrepancy that
   * a Big Four firm got wrong in print.
   */
  deregistration: { quarterlyDivisor: 4, annualPct: 0.75 },
  deadlineDay: 15,
  notes: [
    'The registration test is FORWARD-LOOKING too (s.7(1)(b)): registration is triggered at the BEGINNING of a quarter where there are reasonable grounds to expect supplies will exceed the trigger. A seasonal business must self-assess prospectively.',
    'The quarterly limb is the FASTER test. A business on 160m/year with an 80m quarter MUST register, even though its annual turnover is far below 300m.',
    'VAT withholding is disapplied where an EFRIS e-invoice or e-receipt is issued (new 1 Jul 2026).',
    'Time of supply for Government is CASH BASIS — VAT falls due when Government PAYS, not when invoiced.',
    'VAT collected is not your money. A business that spends it as revenue creates a liability it cannot see.',
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// PENALTIES & INTEREST — the mathematics of silence
// ═════════════════════════════════════════════════════════════════════════════

const PENALTIES_2026 = {
  id: 'UG.PENALTY.2026',
  label: 'Penalties and interest',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2026-07-01',
  verifiedOn: '2026-07-11',
  source: { instrument: 'Income Tax Act Cap. 338 s.148; Tax Procedures Code Act Cap. 343', provision: 's.148, ss.56–59', corroboration: ['RSM Uganda Tax Guide 2025/26', 'ENSafrica, 2 July 2026'] },
  interestPerMonth: 0.02,
  vatCompounds: true,
  currencyPointUGX: 20_000,
  /**
   * 🔑 THE MOST VALUABLE LEGAL FACT IN THE ENGINE.
   *
   * Where a taxpayer VOLUNTARILY DISCLOSES an offence to the Commissioner BEFORE
   * court proceedings commence, the Commissioner may compound the offence — the
   * taxpayer pays the outstanding tax, and NO INTEREST AND NO FINE.
   *
   * This converts Radar from a DIAGNOSIS into a CURE.
   *
   * Find the arrear → disclose it voluntarily → agree an instalment plan →
   * get the TCC → win the tender.
   *
   * Every step of that is in URA's own published rules. Nobody in Uganda is
   * selling it as a product.
   */
  voluntaryDisclosure: {
    available: true,
    condition: 'Before court proceedings commence',
    effect: 'The Commissioner MAY compound the offence: pay the outstanding tax, with no interest and no fine.',
  },
  notes: [
    '2% per month, compounding on VAT, is roughly 27% a year.',
    'This is how a forgotten UGX 4,000,000 becomes UGX 13,124,123 in five years while you do nothing wrong. It more than TRIPLES.',
    'Interest does NOT stop while you dispute. URA v Airtel (Supreme Court): penal tax and interest continue to accrue throughout objection and TAT proceedings. The 30% deposit is a condition of being HEARD, not a moratorium.',
    'Radar\'s core computation is not "what do you owe" — it is "what is the accruing balance, and what will it be in 12 months if you do nothing".',
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// THE 3-YEAR STARTUP EXEMPTION — the biggest lever, and almost nobody knows
// ═════════════════════════════════════════════════════════════════════════════

const STARTUP_EXEMPTION = {
  id: 'UG.EXEMPTION.STARTUP.2025',
  label: 'Three-year income tax exemption — citizen startup',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2025-07-01',
  effectiveTo: null, // NO SUNSET CLAUSE
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax (Amendment) Act 2025 (Act 13 of 2025)',
    provision: 'ITA Cap. 338, s.21(1)(za)',
    gazette: 'Acts Supplement No. 9, Uganda Gazette No. 54, Vol. CXVIII, 4 July 2025. Assented 30 June 2025.',
    corroboration: ['ICPAU submission to Parliament, April 2025', 'Parliament of Uganda, 14 May 2025', 'PwC Uganda / Daily Monitor'],
  },
  exemptionYears: 3,
  capitalCeiling: 500_000_000,
  // ALL THREE CONDITIONS ARE CUMULATIVE. The gazetted Act says "and".
  // (RSM's tax guide prints "or" between them. RSM is wrong. Do not build on RSM here.)
  conditions: [
    { key: 'established_after',  test: 'Business established AFTER 1 July 2025' },
    { key: 'capital_under_cap',  test: 'Registered with investment capital NOT EXCEEDING UGX 500,000,000' },
    { key: 'no_prior_benefit',   test: 'Neither the citizen NOR AN ASSOCIATE has previously benefited. "Associate" (s.3) INCLUDES RELATIVES.' },
    { key: 'files_returns',      test: 'The citizen files a tax return INCLUDING the s.147 business information return' },
  ],
  conditionsAreCumulative: true,
  citizenDefinition: 'An EAC-partner-state natural person, OR a company incorporated in an EAC state with at least 51% EAC-citizen shareholding. A COMPANY CAN QUALIFY.',
  sectorRestriction: null, // ICPAU proposed one. PARLIAMENT REJECTED IT.
  selfAssessed: true,      // No application. No certificate. Contrast s.21(1)(z), which expressly requires one.
  /**
   * 🔴 HOW BURIED IS THIS?
   *
   *   — URA's own "Income Tax Exemption" page DOES NOT MENTION IT.
   *   — PwC's Worldwide Tax Summaries DOES NOT LIST IT.
   *   — RSM lists it, and gets the conditions wrong.
   *   — The s.147 form it requires may never have been prescribed.
   *
   * A three-year total income tax holiday, available to almost any new Ugandan
   * business, is absent from the tax authority's own exemptions page and from
   * the Big Four's reference summary.
   *
   * How many Ugandan businesses have paid income tax in the last twelve months
   * that they did not owe?
   *
   * Nobody knows. That is the point. And that is the company.
   */
  openQuestions: [
    '"Investment capital" is UNDEFINED in the Act. ICPAU formally asked Parliament to define it. Parliament did not.',
    'What happens if you exceed 500m mid-period? Undefined.',
    'Does "three years" run from establishment, or mean three years of income? Undefined.',
    'Interaction with presumptive tax (s.4(5)) for a sub-150m business: NO guidance, NO ruling, NO commentary exists. The defensive move is the s.4(5) written election.',
    'The s.147 business information return form may never have been prescribed by URA.',
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// TCC — and the director trap
// ═════════════════════════════════════════════════════════════════════════════

const TCC_2026 = {
  id: 'UG.TCC.2026',
  label: 'Tax Clearance Certificate',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2026-07-01',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Tax Procedures Code Act Cap. 343, s.50; URA administrative criteria',
    provision: 's.50; URA TCC page',
    corroboration: ['URA, Tax Clearance (official)'],
  },
  /**
   * 🔴 THE TPCA IS COMPLETELY SILENT ON ISSUANCE CRITERIA.
   * s.50 says only WHO must obtain a TCC. No definition of "tax compliant",
   * no criteria, no validity period, no SLA. All five criteria below are
   * ADMINISTRATIVE, not statutory — which means a refusal is a "tax decision",
   * objectionable under TPCA s.24 and appealable to the Tax Appeals Tribunal.
   *
   * Most Ugandan business owners do not know that remedy exists.
   */
  criteria: [
    { key: 'profile_current',      text: 'The registration profile is up to date',              blocking: true },
    { key: 'returns_filed',        text: 'All returns filed for all registered tax types',      blocking: true },
    { key: 'director_returns',     text: 'For NON-INDIVIDUALS: the associated persons (DIRECTORS or partners) MUST have submitted all their returns', blocking: true },
    { key: 'returns_satisfactory', text: 'The submitted returns are satisfactory',              blocking: true },
    { key: 'taxes_paid_or_mou',    text: 'All taxes due are paid, OR there is a Memorandum of Understanding to pay in instalments', blocking: true },
  ],
  /**
   * 🔑 THE DIRECTOR TRAP — THE ANSWER TO THE FOUNDER'S OWN QUESTION.
   *
   * "For some reason we always have arrears with URA that are unknown to us,
   *  either by company or directors?"
   *
   * A company can be SPOTLESS — every return filed, every shilling paid — and
   * still be refused a TCC because a passive, absentee, long-forgotten director
   * has never filed a PERSONAL income tax return.
   *
   * It is invisible from inside the company's own ledger. There is no warning.
   * You find out when you lose the tender.
   *
   * Note the split, and it is the whole insight:
   *   — Director's UNFILED RETURNS   → BLOCKS the company TCC.  (Confidence A)
   *   — Director's UNPAID ARREARS    → NOT STATED BY URA.       (Confidence C — warn only)
   */
  directorUnfiledReturnsBlock: true,
  directorArrearsBlock: null, // C — warn, do not block. Settle by private ruling.
  paymentPlanSatisfies: true,
  annualRequiresYearsMonitored: 3, // a startup cannot get an ANNUAL TCC; transactional only
  notes: [
    'NSSF is a SEPARATE PPDA document from the URA TCC. Unremitted NSSF does not block a TCC — but it will still sink the bid. This is MamaOpe, precisely. Compliance must be MULTI-AUTHORITY.',
    'There is NO statutory validity period and NO 12-month expiry. A transactional TCC is consumed on delivery to the named addressee.',
    'URA operates dedicated Ledger Reconciliation Sections. The existence of that department is an admission that the ledgers are wrong often enough to need one — and the taxpayer bears the burden of proving it.',
  ],
};

// ═════════════════════════════════════════════════════════════════════════════

const FILING_CALENDAR = {
  id: 'UG.CALENDAR.2026',
  label: 'Filing calendar',
  confidence: CONFIDENCE.A,
  verifiedOn: '2026-07-11',
  source: { instrument: 'Income Tax Act Cap. 338; VAT Act Cap. 349; NSSF Act', provision: 'various', corroboration: ['RSM Uganda Tax Guide 2025/26'] },
  obligations: [
    { key: 'paye',        label: 'PAYE return + remittance',     cadence: 'monthly',   day: 15, who: 'employers' },
    { key: 'wht',         label: 'WHT return + remittance',      cadence: 'monthly',   day: 15, who: 'withholding agents' },
    { key: 'nssf',        label: 'NSSF remittance',              cadence: 'monthly',   day: 15, who: 'employers' },
    { key: 'vat',         label: 'VAT return + payment',         cadence: 'monthly',   day: 15, who: 'VAT-registered' },
    { key: 'prov_co',     label: 'Provisional tax — companies',  cadence: 'biannual',  months: [6, 12], who: 'non-individuals', formula: '(50% × estimated annual tax) − WHT already withheld' },
    { key: 'prov_ind',    label: 'Provisional tax — individuals',cadence: 'quarterly', months: [3, 6, 9, 12], who: 'individuals', formula: '(25% × estimated annual tax) − WHT already withheld' },
    { key: 'final',       label: 'Self-assessment return',       cadence: 'annual',    monthsAfterYearEnd: 6, who: 'all' },
    { key: 'lst',         label: 'Local Service Tax',            cadence: 'annual',    fixedDate: '31 October', who: 'employers → local authority' },
  ],
  notes: [
    'THE BELIEF THAT TAX IS AN ANNUAL EVENT IS PRECISELY THE BELIEF THAT PRODUCES ARREARS.',
    'It is a CONTINUOUS obligation: monthly, provisional, and annual.',
    'Understating a provisional estimate: 20% × (tax on 90% of final chargeable income − tax on the estimate).',
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// DEDUCTION BLOCKERS — the Harriet-class failures
// ═════════════════════════════════════════════════════════════════════════════

const DEDUCTION_BLOCKERS = {
  id: 'UG.DEDUCTION.BLOCKERS.2026',
  label: 'Deduction blockers',
  confidence: CONFIDENCE.A,
  effectiveFrom: '2026-07-01',
  verifiedOn: '2026-07-11',
  source: { instrument: 'Income Tax Act Cap. 338', provision: 's.22(3)(l), s.22(3)(m)', corroboration: ['PwC WWTS — Deductions'] },
  tinRule:   { threshold: 5_000_000, text: 'Expenditure ABOVE UGX 5,000,000 in ONE TRANSACTION from a supplier who does not have a TIN is DISALLOWED.' },
  efrisRule: { threshold: 0,         text: 'Expenses from a supplier DESIGNATED to use EFRIS are DISALLOWED unless supported by an e-invoice or e-receipt. NO THRESHOLD. Any amount.' },
  /**
   * 🔴 These are Harriet-class killers. You spend the money correctly. The
   * PAPERWORK makes it non-deductible.
   *
   * Selah must BLOCK OR FLAG THIS AT THE POINT OF PAYMENT — not discover it
   * eight months later at audit.
   */
  generalRule: 'Uganda has NO "wholly and exclusively" test. s.22(1)(a) says "TO THE EXTENT TO WHICH" the expenditure was incurred in producing income — an APPORTIONMENT test. Mixed-purpose expenditure is APPORTIONABLE, not wholly disallowed. This is significantly more generous than most Ugandan business owners believe.',
};

// ═════════════════════════════════════════════════════════════════════════════


// ═════════════════════════════════════════════════════════════════════════════
// SEVERANCE — 🔴 THE LAW THAT IS SIGNED BUT NOT IN FORCE
//
// This is a rule STATE the engine did not previously have, and it is a real one.
//
// The Employment (Amendment) Act 2025 was ASSENTED BY THE PRESIDENT on 29 April
// 2026. It standardises severance at one month's salary per year worked. Every
// law firm in Kampala has published an alert about it. Our own UI was already
// telling users it was the law.
//
// IT IS NOT THE LAW. THE COMMENCEMENT DATE HAS NOT BEEN GAZETTED.
//
// An Act of the Ugandan Parliament that has been assented to but whose
// commencement has not been gazetted is NOT IN FORCE. Until the Minister
// publishes that notice, severance is still what section 89 of the 2006 Act says
// it is: NEGOTIATED between employer and employee.
//
// So there are two live regimes and the switch between them is a piece of paper
// nobody has published yet. An employer accruing at one month per year today is
// over-providing. An employer who signs a contract today that is silent on
// severance will find the new formula imposed on him the moment the notice lands.
//
// THE ENGINE MUST HOLD BOTH, AND MUST NOT CHOOSE.
//
// Every calculator in Uganda will get this wrong in one of two directions, and
// both directions are confident.
// ═════════════════════════════════════════════════════════════════════════════

/** The law as it ACTUALLY STANDS on 11 July 2026. */
const SEVERANCE_2006 = {
  id: 'UG.SEVERANCE.2006',
  label: 'Severance allowance — the law in force',
  confidence: CONFIDENCE.A,
  status: 'in_force',
  effectiveFrom: '2006-06-08',
  effectiveTo: null,
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Employment Act, Cap. 226 (2006, revised 2023)',
    provision: 's.87 (entitlement), s.89 (calculation)',
    corroboration: ['ULII, Employment Act Cap. 226 as at 31 Dec 2023', 'Daily Monitor, "What you need to know about severance pay"'],
  },
  formula: null, // 🔴 PARLIAMENT FIXED NONE. This null is the whole point.
  calculation: 'NEGOTIATED between the employer and the employee — or with the union, under a collective bargaining agreement.',
  notes: [
    'There is NO statutory formula in the Act in force. Section 89 leaves the amount to negotiation.',
    'The "one month per year of service" figure printed by almost every Ugandan HR blog is a CUSTOM and an anticipation of the amendment — it is not the law in force.',
    'Because the amount is negotiated, the ONLY reliable source for an employer\'s severance liability today is their own contract.',
  ],
};

/** 🔴 SIGNED. PUBLISHED. DISCUSSED EVERYWHERE. NOT IN FORCE. */
const SEVERANCE_2025 = {
  id: 'UG.SEVERANCE.2025',
  label: 'Severance allowance — assented, awaiting commencement',
  confidence: CONFIDENCE.B,
  // 🔑 THE NEW STATE. Not "effective". Not "superseded". ASSENTED AND WAITING.
  status: 'assented_not_commenced',
  assentedOn: '2026-04-29',
  effectiveFrom: null,        // ← UNKNOWN. This is not an oversight. It is the fact.
  commencementGazettedOn: null,
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Employment (Amendment) Act 2025',
    provision: 'ss.86 and 88, amending the Employment Act Cap. 226',
    gazette: null, // ← THE MISSING PIECE OF PAPER
    corroboration: [
      'MMAKS Advocates, Legal Alert, 18 May 2026 — "The commencement date of the Employment (Amendment) Act, 2025, is yet to be gazetted."',
      'Kampala Associated Advocates, Key Employment Law Amendments 2026',
      'Onyango & Company Advocates',
      'AmCham Uganda',
    ],
  },
  formula: { monthsOfSalaryPerYearWorked: 1 },
  calculation: "One month's salary for each year worked.",
  /**
   * AND THERE IS A SECOND UNCERTAINTY INSIDE THE FIRST.
   * The 2023 Bill said "one month's GROSS salary". Firms reporting on the enacted
   * Act say "one month's SALARY — not gross salary". On a package with allowances,
   * those are materially different numbers. We have not read the enacted text
   * ourselves, so we do not know which it is.
   */
  openQuestions: [
    'WHEN does it commence? Nobody knows. The Minister has not gazetted it.',
    'Is the base SALARY or GROSS SALARY? The 2023 Bill said "gross". Law firms reporting the enacted Act say "salary, not gross salary". On a package with allowances these differ materially. We have not read the enacted section ourselves.',
    'Does it apply to service accrued BEFORE commencement, or only after? Not addressed in any commentary we have found. For a 10-year employee this is the difference between a large liability and a small one.',
  ],
  alsoChangesOnCommencement: [
    'SICK LEAVE: 2 months at full pay, then 4 months at half pay (replacing the 3-month regime). A real, uncosted employer liability.',
    'PRE-DISMISSAL HEARING: failure to hold one = AUTOMATIC liability of 4 weeks\' net pay, regardless of whether the dismissal was justified.',
    'UNFAIR DISMISSAL: a labour officer\'s basic compensatory order rises from 4 to 8 weeks\' wages.',
    'PROBATION: payment in lieu of notice rises from 7 days to ONE MONTH.',
    'CASUAL WORKERS: no continuous casual employment beyond 6 months — and re-hiring after a lay-off does NOT reset the clock.',
  ],
  notes: [
    'This rule MUST NOT be used to compute a present liability. It is held so that we can tell an employer what is coming, and so that the day the notice is gazetted we can switch every affected client\'s figures in one commit.',
  ],
};


// ═════════════════════════════════════════════════════════════════════════════
// TIER 2 — verified 11 July 2026 against primary law.
//
// 🔴 EVERY CITATION IN THIS ENGINE WAS USING DEAD SECTION NUMBERS.
//
// The Income Tax Act was revised and consolidated as at 31 Dec 2023. It is now
// Cap 338, NOT Cap 340 — and the sections were RENUMBERED:
//
//     WHT on goods & services   s.119  →  s.136
//     Provisional tax           s.112  →  s.121 + s.122
//     Advance tax (transport)   s.123A →  s.141
//     Depreciation              6th Sch → Schedule 7
//     Benefits valuation        5th Sch → Schedule 6
//
// URA's own guidance, PwC, and every Ugandan firm still cite the OLD numbers.
// They are describing the right rule under the wrong name. We carry BOTH, with
// Cap 338 as canonical — because a citation you cannot follow is not a citation.
// ═════════════════════════════════════════════════════════════════════════════

/** 🔑 THE STAGE A RULE WAS READ AT. Added after we shipped a tax Parliament deleted. */
const STAGE = {
  BILL:      'bill',                 // 🔴 MAY NEVER COMPUTE. Parliament amends on the floor.
  PASSED:    'passed',               // 🔴 MAY NEVER COMPUTE. Not yet assented.
  ASSENTED:  'assented_not_commenced',// 🔴 MAY NEVER COMPUTE. No commencement notice.
  COMMENCED: 'in_force',             // ✅ the only stage that may compute
};

const MV_BENEFIT_2026 = {
  id: 'UG.BENEFIT.MOTORVEHICLE.2026',
  label: 'Motor vehicle benefit',
  confidence: CONFIDENCE.A,
  status: STAGE.COMMENCED,
  effectiveFrom: '2017-07-01',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax Act Cap. 338 (formerly Cap. 340)',
    provision: 's.19(3) + Schedule 6 para 3 (formerly the Fifth Schedule), as amended by the Income Tax (Amendment) Act 2017 (Act 10 of 2017)',
    corroboration: ['PwC Uganda Tax Alert 2017 — quotes the amended paragraph verbatim', 'RSM Uganda Tax Guide 2025/26'],
  },
  formula: '(20% × A × B/C) − D',
  rate: 0.20,
  depreciationRate: 0.35,     // reducing balance, on A, FOR SUBSEQUENT YEARS ONLY
  depreciateInFirstYear: false,
  warnings: [{
    severity: 'high',
    text: "URA's own tax-education page still publishes the PRE-2017 formula, with NO 35% depreciation on the vehicle's value. URA is nine years out of date on its own public guidance. If your payroll follows URA's page, you are over-taxing every company car in the business after year one.",
    evidenceUrl: 'https://thetaxman.ura.go.ug/?p=3641',
  }],
  notes: [
    'A = market value when the vehicle was FIRST provided for private use, depreciated 35% reducing-balance for SUBSEQUENT years. B = days available for private use. C = days in the year. D = anything the employee pays.',
    '"Available for use" — not "used". A car parked at the employee\'s home over a weekend is available.',
    'The UGX 60,000,000 vehicle ceiling is a CAPITAL ALLOWANCE rule (Schedule 7 Part II). It does NOT cap A. Do not let the two collide.',
  ],
};

const HOUSING_BENEFIT_2026 = {
  id: 'UG.BENEFIT.HOUSING.2026',
  label: 'Housing / accommodation benefit',
  confidence: CONFIDENCE.A,
  status: STAGE.COMMENCED,
  effectiveFrom: '1997-07-01',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax Act Cap. 338',
    provision: 'Schedule 6 para 8 (formerly the Fifth Schedule)',
    corroboration: ['URA, reproduced verbatim with a worked example', 'RSM Uganda Tax Guide 2025/26'],
  },
  pctOfEmploymentIncome: 0.15,
  /**
   * 🔴 THERE IS NO GROSS-UP. Our own calculator-centre document said there was.
   *
   * The benefit is the LESSER of:
   *   (a) market rent LESS anything the employee pays; and
   *   (b) 15% of employment income INCLUDING the amount in (a).
   *
   * "Including the amount in (a)" is NOT a circular solve. It does not mean
   * 15%/(1−15%) = 17.647%. It means: add (a) to cash pay, then take 15%.
   *
   * URA's own worked example proves it. Implement the iterative gross-up and you
   * OVER-TAX every housed employee in Uganda.
   */
  grossUp: false,
  warnings: [{
    severity: 'medium',
    text: "URA's own published worked example for this benefit contains an arithmetic error: it states a transport allowance of 3,000,000 and then computes with 300,000. The method is right; the number is a typo. We follow the METHOD.",
  }],
};

const LOAN_BENEFIT_2026 = {
  id: 'UG.BENEFIT.LOAN.2026',
  label: 'Employee loan benefit',
  confidence: CONFIDENCE.B,   // the RULE is A. The RATE is the risk. See below.
  status: STAGE.COMMENCED,
  effectiveFrom: '1997-07-01',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax Act Cap. 338',
    provision: 'Schedule 6 para 5 (formerly the Fifth Schedule)',
    corroboration: ['PwC Uganda Tax Alert 2017', 'RSM Uganda Tax Guide 2025/26', 'Bank of Uganda MPC, 14 May 2026'],
  },
  threshold: 1_000_000,      // loans TOTALLING more than this
  /**
   * 🔴 THE STATUTORY RATE IS A LIVE LEGAL QUESTION, AND WE SAY SO.
   *
   * The Act says "the Bank of Uganda DISCOUNT RATE at the commencement of the
   * year of income" — so it is FIXED at 1 July 2026 for the whole of FY2026/27.
   *
   * But BoU today publishes THREE rates:
   *     Central Bank Rate  9.75%   (held since Oct 2024; MPC 14 May 2026)
   *     Rediscount rate   12.75%   (CBR + 3)
   *     Bank rate         13.75%   (CBR + 4)
   *
   * The Act's "discount rate" matches NONE of them by name. Professional practice
   * — and PwC's own 2017 worked example — treats it as the CBR. We follow that,
   * and we DISCLOSE that it is an interpretation, not a certainty.
   */
  statutoryRate: 0.0975,
  statutoryRateSource: 'Bank of Uganda Central Bank Rate as at 1 July 2026 (held at 9.75% since October 2024; confirmed at the MPC of 14 May 2026)',
  statutoryRateConfidence: CONFIDENCE.C,   // ← the LEGAL question, not the number
  warnings: [
    { severity: 'high',
      text: 'The Act says "the Bank of Uganda DISCOUNT RATE". BoU publishes a Central Bank Rate (9.75%), a rediscount rate (12.75%) and a bank rate (13.75%) — and none of them is called the "discount rate". We use the CBR, because that is what PwC\'s own worked example does and what practice assumes. IT IS AN INTERPRETATION. On a large loan the difference between 9.75% and 13.75% is real money, and we will not pretend the question is settled.' },
    { severity: 'medium',
      text: 'PwC adds a condition that the loan must be "for a term exceeding three months". That condition appears in NO other source — not in URA\'s verbatim reproduction of the paragraph, not in RSM. We have NOT coded it.' },
  ],
};

const TERMINAL_BENEFITS_2026 = {
  id: 'UG.TERMINAL.2026',
  label: 'Terminal benefits — the 25% relief',
  confidence: CONFIDENCE.A,
  status: STAGE.COMMENCED,
  effectiveFrom: '1997-07-01',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax Act Cap. 338',
    provision: 's.19(4) read with s.19(1)(d)',
    corroboration: ['Primary statutory text, read in full', 'URA — states it correctly'],
  },
  exemptPct: 0.25,
  minimumYearsWithSameEmployer: 10,
  /**
   * 🔴 RSM'S PUBLISHED TAX GUIDE IS WRONG ABOUT THIS, IN PRINT.
   *
   * RSM Uganda Tax Guide 2025/26: "For an employee in employment for at least 10
   * years, 25% of GRATUITY PAYMENTS shall be considered tax exempt."
   *
   * THAT IS NOT WHAT THE ACT SAYS.
   *
   *   s.19(4) applies the 75% formula to "the amount to which SUBSECTION (1)(d)
   *   applies" — and s.19(1)(d) is COMPENSATION FOR TERMINATION of a contract of
   *   employment, or commutation of amounts due under it.
   *
   *   GRATUITY is s.19(1)(a) — listed beside wages, salary, leave pay, overtime,
   *   fees, commission and bonus. IT IS FULLY TAXABLE. There is no 25% relief.
   *
   * An employer who exempts 25% of a gratuity is under-deducting PAYE, and will
   * pay the shortfall plus 2%/month when it is found.
   */
  appliesTo: 'termination_compensation_only',
  gratuityIsFullyTaxable: true,
  warnings: [{
    severity: 'high',
    text: 'RSM Uganda\'s published guide says 25% of GRATUITY is exempt. The Act says the relief attaches to COMPENSATION FOR TERMINATION (s.19(1)(d)) — not gratuity, which is ordinary employment income under s.19(1)(a) and is FULLY TAXABLE. If your payroll has been exempting a quarter of every gratuity, you have been under-deducting PAYE.',
  }],
};

const EXEMPT_BENEFITS_2026 = {
  id: 'UG.BENEFIT.EXEMPT.2026',
  label: 'Exempt employment benefits',
  confidence: CONFIDENCE.A,
  status: STAGE.COMMENCED,
  effectiveFrom: '1997-07-01',
  verifiedOn: '2026-07-11',
  source: { instrument: 'Income Tax Act Cap. 338', provision: 's.19(2)(a)–(g)', corroboration: ['Primary statutory text, read in full'] },
  deMinimisMonthly: 10_000,
  items: [
    { key: 'medical',    label: 'Medical expenses — reimbursed or discharged', cap: null, condition: 'NO CAP AND NO CONDITIONS. The single most under-used exemption in Uganda. Medical insurance premiums are included.' },
    { key: 'retirement', label: "Employer's contribution to a retirement fund", cap: null, condition: 'The EMPLOYER\'s contribution only. The employee\'s own contribution is NOT deductible (s.22(3)(h)). Exempt going in, and the lump sum is exempt coming out (s.21(1)(n)). Of all the money you spend on an employee, this is the least wasteful.' },
    { key: 'life',       label: 'Life insurance premiums on the employee or dependants', cap: null, condition: 'Exempt only if the employer is a TAXABLE employer. Premiums paid by a tax-exempt employer are taxable in the employee\'s hands (s.19(1)(e)).' },
    { key: 'per_diem',   label: 'Per diem / travel allowance', cap: null, condition: '🔴 THERE IS NO FIXED SHILLING CAP IN THE ACT. It is exempt only "to the extent it does not exceed the cost actually or likely to be incurred" on accommodation, travel, meals and refreshment WHILE TRAVELLING on the employer\'s business. Any excess over likely cost is TAXABLE. Ugandan employers routinely treat a round-sum per diem as automatically exempt. It is not.' },
    { key: 'meals',      label: 'Meals and refreshments on the premises', cap: null, condition: 'Premises operated by or for the employer SOLELY for employees, and available to ALL full-time employees ON EQUAL TERMS. A directors\' dining room fails this test.' },
    { key: 'passage',    label: 'Passage costs to and from Uganda', cap: null, condition: 'ALL THREE, cumulatively: recruited OUTSIDE Uganda, in Uganda SOLELY to serve this employer, and NOT a Ugandan citizen.' },
    { key: 'deminimis',  label: 'De minimis benefits', cap: 10_000, condition: 'Where the TOTAL value of ALL benefits from this employer FOR THE MONTH is less than UGX 10,000. It is a CLIFF on the monthly total, not an allowance per benefit. At 10,001 the whole lot is taxable.' },
  ],
  warnings: [{
    severity: 'medium',
    text: 'Employee share schemes (ESAS) are NOT an s.19(2) exemption, though URA and RSM both list them as one. The GRANT of an option is simply outside the charge; s.19(1)(g) taxes the SHARES when issued and s.19(1)(h) taxes the gain on disposal of the right. The distinction matters the moment you compute a cap.',
  }],
};

const MULTIPLE_EMPLOYMENT_2026 = {
  id: 'UG.PAYE.SECONDARY.2026',
  label: 'Second employment — the flat-rate trap',
  confidence: CONFIDENCE.B,   // the RULE is B (URA operates it). The CITATION is F.
  status: STAGE.COMMENCED,
  effectiveFrom: '2022-10-04',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax Act Cap. 338 — Schedule 4 Part I',
    provision: '🔴 SECTION NOT VERIFIED. We could not read the enabling paragraph.',
    corroboration: ['URA, PAYE rates page', 'URA DT-2008 PAYE return (applies 30%/40% since 4 Oct 2022)', 'Daily Monitor, May 2026 — enforcement live'],
  },
  secondaryRate: 0.30,
  secondaryRateAbove: 0.40,
  surchargeThresholdMonthly: 10_000_000,
  reclaimable: true,
  warnings: [
    { severity: 'high',
      text: 'A SECOND job is taxed at a FLAT 30% of the whole of it — with no tax-free band, no 20% step, no 25% step. On a modest second income that is brutal: a 500,000/month side job is taxed 150,000, where the same 500,000 inside your main salary would attract about 38,000.' },
    { severity: 'high',
      text: 'AND YOU CAN CLAIM IT BACK. URA\'s own page says an employee aggrieved by this treatment "may submit a return of emoluments from all sources and make a claim of tax overpaid". Almost nobody does. This is a second Isaac, hiding in plain sight on hundreds of thousands of payslips.' },
    { severity: 'medium',
      text: '🔴 WE COULD NOT READ THE ENABLING SECTION. URA operates this rule, its return applies it, and enforcement is live — but the statutory paragraph should sit in Schedule 4 Part I, and every full text of the Act we could reach truncates before the schedules. We rate the RULE confidence B and the CITATION confidence F. We are telling you this because a citation we have not read is not a citation.' },
    { severity: 'medium',
      text: 'URA CONTRADICTS ITSELF. Its PAYE rates page says a flat 30%. Its own DT-2008 return has applied 30% up to 10,000,000/month and 40% above it since 4 October 2022. The return is what actually runs.' },
  ],
};

const CAPITAL_ALLOWANCES_2026 = {
  id: 'UG.CAPALLOW.2026',
  label: 'Capital allowances (depreciation)',
  confidence: CONFIDENCE.A,
  status: STAGE.COMMENCED,
  effectiveFrom: '2021-07-01',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax Act Cap. 338',
    provision: 's.27 + Schedule 7 Part I (formerly the Sixth Schedule); s.28 (industrial buildings); s.29 (start-up costs)',
    corroboration: ['ULII consolidated Cap 338', 'PwC Worldwide Tax Summaries — Deductions, reviewed 12 Jan 2026'],
  },
  // FOUR classes became THREE on 1 July 2021. Any table showing four is stale.
  classes: [
    { cls: 1, rate: 0.40, label: 'Computers and data-handling equipment' },
    { cls: 2, rate: 0.30, label: 'Plant and machinery used in farming, manufacturing or mining' },
    { cls: 3, rate: 0.20, label: 'Everything else — vehicles, furniture, fixtures, office equipment, and ANY depreciable asset not in another class' },
  ],
  industrialBuildingRate: 0.05,        // straight line, s.28
  startupCostPct: 0.25,                // s.29 — 25% a year for 4 years
  startupCostYears: 4,
  vehicleCeiling: 60_000_000,
  vehicleCeilingConfidence: CONFIDENCE.B,   // 🔴 read it off Schedule 7 Part II before relying on it
  initialAllowance: null,              // 🔴 ABOLISHED 1 July 2023. Any source showing 50%/20% is stale.
  warnings: [
    { severity: 'high',
      text: 'THE INITIAL ALLOWANCE IS GONE. The 50% initial allowance on plant and machinery, and the 20% on industrial buildings, were ABOLISHED with effect from 1 July 2023. Grant Thornton\'s data card still shows them. Any model built on a first-year 50% write-off is overstating your relief by a wide margin.' },
    { severity: 'medium',
      text: 'The UGX 60,000,000 ceiling on a non-commercial road vehicle\'s cost base is confidence B — the MECHANISM is in primary law (s.27(11)–(15)), but the FIGURE itself we could only source to one professional guide. It lives in Schedule 7 Part II, which a Minister may amend by statutory instrument. Verify before you rely on it for a large vehicle.' },
    { severity: 'info',
      text: 'The excess above the ceiling is NOT lost — s.27(12) splits it out as a non-depreciable business asset, so it still sits in your cost base when you sell. A "commercial vehicle" (over half a tonne of load, or more than 13 passengers, or used in a transport/rental business) is NOT capped at all.' },
  ],
};

const PROVISIONAL_TAX_2026 = {
  id: 'UG.PROVISIONAL.2026',
  label: 'Provisional tax',
  confidence: CONFIDENCE.A,
  status: STAGE.COMMENCED,
  effectiveFrom: '1997-07-01',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax Act Cap. 338 (formerly Cap. 340 s.112); Tax Procedures Code Act Cap. 343',
    provision: 'ITA s.121 (payment) and s.122 (estimated tax); TPCA s.60 (the penalty)',
    corroboration: ['ULII TPCA Cap 343 — s.60 read verbatim', 'RSM Uganda Tax Guide 2025/26', 'PwC — Tax administration'],
  },
  company:    { instalments: 2, months: [6, 12],       pct: 0.50 },
  individual: { instalments: 4, months: [3, 6, 9, 12], pct: 0.25 },
  penalty: {
    triggerBelowPctOfActual: 0.90,
    rate: 0.20,
    basis: '20% × [ tax on 90% of ACTUAL chargeable income − tax on your ESTIMATE ]',
    statute: 'TPCA Cap 343 s.60 — NOT the Income Tax Act. Every Ugandan guide puts this penalty in the wrong Act.',
    farmingExempt: true,
  },
  warnings: [{
    severity: 'info',
    text: 'TPCA s.60(3): the understatement penalty DOES NOT APPLY to a taxpayer in the business of agricultural, plantation or horticultural farming. A hard carve-out that almost no published guide mentions.',
  }],
};

const INPUT_VAT_BLOCKED_2026 = {
  id: 'UG.VAT.BLOCKED.2026',
  label: 'Input VAT you may not reclaim',
  confidence: CONFIDENCE.A,
  status: STAGE.COMMENCED,
  effectiveFrom: '1996-07-01',
  verifiedOn: '2026-07-11',
  source: { instrument: 'VAT Act Cap. 349', provision: 's.28(5)(a)–(c)', corroboration: ['Statutory text read verbatim', 'PwC — Other taxes'] },
  blocked: [
    { key: 'passenger_auto', label: 'A passenger automobile — and its repair, maintenance and spare parts', pctBlocked: 1.00,
      exception: 'Unless you are in the continuous and regular business of SELLING, DEALING IN or HIRING passenger automobiles.' },
    { key: 'entertainment',  label: 'Entertainment — food, drink, tobacco, accommodation, amusement, recreation, hospitality of any kind', pctBlocked: 1.00,
      exception: 'Unless you are in the business of providing entertainment, OR you supply meals to employees on premises operated SOLELY for their benefit.' },
    { key: 'telephone',      label: 'Telephone services', pctBlocked: 0.10,
      exception: '🔑 NINETY PERCENT IS RECOVERABLE. Exactly 10% of the input tax on telephone services is blocked — it is a partial restriction, not a full block. Almost every Ugandan business either claims 100% (and is wrong) or claims nothing (and is poorer).' },
  ],
  warnings: [{
    severity: 'medium',
    text: 'RSM\'s published guide lists "electronic services" as a blocked input and OMITS the telephone 10% restriction entirely. The Act has three paragraphs — (a) passenger automobile, (b) entertainment, (c) telephone at 10% — and no electronic-services paragraph. VAT on imported services is indeed not creditable, but that falls out of s.28(1), not s.28(5).',
  }],
};

const ADVANCE_TAX_TRANSPORT_2026 = {
  id: 'UG.ADVANCETAX.TRANSPORT.2026',
  label: 'Advance income tax — transport',
  confidence: CONFIDENCE.A,
  status: STAGE.COMMENCED,
  effectiveFrom: '1997-07-01',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Income Tax Act Cap. 338',
    provision: 's.141 (formerly Cap. 340 s.123A — RSM still prints the dead number)',
    corroboration: ['URA — Advance Income Tax on the Transport Sector, with worked examples'],
  },
  goodsVehiclePerTonne: 50_000,
  passengerSeatPerYear: 20_000,
  bodaPerYear: 20_000,
  goodsVehicleThresholdTonnes: 2,
  creditable: true,
  warnings: [{
    severity: 'high',
    text: '🔑 THE TONNAGE IS THE LOADING CAPACITY — gross weight MINUS net weight, both from the logbook. It is NOT the gross vehicle weight, which is what almost every published guide implies. Using gross weight overstates the tax substantially. And it only applies ABOVE 2 tonnes.',
  }, {
    severity: 'info',
    text: 'This is ADVANCE tax, not a final tax. It is CREDITABLE against your income tax on the return. Pay it and forget to claim it, and you have simply given URA money.',
  }],
};

const STAMP_DUTY_2026 = {
  id: 'UG.STAMPDUTY.2026',
  label: 'Stamp duty',
  confidence: CONFIDENCE.A,
  status: STAGE.COMMENCED,
  effectiveFrom: '2025-07-01',
  verifiedOn: '2026-07-11',
  source: {
    instrument: 'Stamp Duty Act Cap. 339 (Act 13 of 2014), as amended',
    provision: 's.3 + Schedule 2',
    corroboration: ['ULII Cap 339', 'Stamp Duty (Amendment) Act 2024', 'ENSafrica — the 2020 and 2025 repeals'],
  },
  items: [
    { key: 'transfer',        label: 'Transfer — land, or shares in an unlisted company', rate: 0.015, fixed: null },
    { key: 'transfer_listed', label: 'Transfer of listed shares, traded on the exchange',  rate: 0.005, fixed: null },
    { key: 'lease',           label: 'Lease — of the total value',                          rate: 0.01,  fixed: null },
    { key: 'share_capital',   label: 'Nominal share capital, or any increase of it',        rate: 0.005, fixed: null },
    { key: 'exchange',        label: 'Exchange of property',                                rate: 0.02,  fixed: null },
    { key: 'gift',            label: 'Gift',                                                rate: 0.01,  fixed: null },
    { key: 'hire_purchase',   label: 'Hire purchase',                                       rate: 0.01,  fixed: null },
    { key: 'conveyance',      label: 'Conveyance NOT being a transfer',                     rate: null,  fixed: 15_000 },
    { key: 'other',           label: 'Any instrument not specifically mentioned',           rate: null,  fixed: 15_000 },
    { key: 'guarantee',       label: 'Bank guarantee, performance or indemnity bond',       rate: null,  fixed: 100_000 },
    { key: 'debenture',       label: 'Debenture',                                           rate: 0,     fixed: 0, note: 'NIL since the Stamp Duty (Amendment) Act 2020.' },
    { key: 'mortgage',        label: 'Mortgage deed',                                       rate: 0,     fixed: 0, note: 'NIL from 1 July 2025.' },
    { key: 'agreement',       label: 'Agreement or memorandum of agreement',                rate: 0,     fixed: 0, note: 'NIL from 1 July 2025.' },
    { key: 'small_loan',      label: 'Loan instrument not exceeding UGX 3,000,000',         rate: 0,     fixed: 0 },
    // NEW, item 67 — enacted 1 July 2026. The Bill said 50,000 for a motorcycle;
    // Parliament cut it to 30,000. Another figure that changed on the floor.
    { key: 'vehicle_moto',    label: 'Registration or transfer of a motorcycle, tricycle or quadricycle', rate: null, fixed: 30_000,
      note: 'NEW from 1 July 2026. The Bill proposed 50,000; Parliament reduced it to 30,000.' },
    { key: 'vehicle_other',   label: 'Registration or transfer of any other motor vehicle',  rate: null,  fixed: 200_000,
      note: 'NEW from 1 July 2026.' },
  ],
  daysToStamp: 45,
  /**
   * ✅ THE 3% QUESTION — ANSWERED. PARLIAMENT REJECTED IT.
   *
   * The Stamp Duty (Amendment) Bill 2026 proposed substituting the TRANSFER rate
   * with 3% (from 1.5%). The Bill text is unambiguous, and MMAKS, CEO East Africa,
   * Global Law Experts and mrt.tax all published it as though it were law.
   *
   * IT IS NOT LAW. PARLIAMENT STRUCK IT OUT ON THE FLOOR.
   *
   * Parliament of Uganda's own news release, 21 April 2026, the day the Bill was
   * passed:
   *
   *     "Parliament passed the Stamp Duty (Amendment) Bill, 2026, REJECTING
   *      PROPOSED INCREASES IN TAXES ON LAND AND MOTORCYCLE TRANSFERS while
   *      approving new measures on motor vehicle transactions."
   *
   * KPMG's list of the enacted stamp duty measures contains three items, and the
   * transfer rate is not among them. Daily Monitor's post-budget summary agrees.
   *
   * 🔑 THIS IS THE SECOND TIME IN ONE BUDGET CYCLE that Parliament deleted a tax
   * on the floor and the profession went on publishing it. The first was the 0.5%
   * minimum tax, which WE SHIPPED before catching it.
   *
   * Our refusal to compute the 3% was correct. So the rule is not "be cautious".
   * The rule is: A BILL IS NOT AN ACT, and in Uganda the floor is where taxes die.
   */
  transferRateIncrease: {
    proposed: 0.03,
    stage: STAGE.BILL,
    outcome: 'REJECTED_ON_THE_FLOOR',
    rejectedOn: '2026-04-21',
    evidence: 'Parliament of Uganda news release, 21 April 2026: "rejecting proposed increases in taxes on land and motorcycle transfers"',
    corroboration: ['KPMG, 26 June 2026 — lists the enacted stamp duty measures; the transfer rate is not among them', 'Daily Monitor, 11 June 2026 — "New Stamp Duty Charges" lists only the vehicle duty'],
  },
  warnings: [{
    severity: 'high',
    text: 'YOUR ADVISER MAY TELL YOU THIS IS 3%. IT IS NOT. The Stamp Duty (Amendment) Bill 2026 proposed doubling the transfer rate from 1.5% to 3%, and MMAKS, CEO East Africa and Global Law Experts all published it. PARLIAMENT REJECTED IT ON 21 APRIL 2026 — its own news release says so, in terms: "rejecting proposed increases in taxes on land and motorcycle transfers". The rate is 1.5%. On a 500,000,000 property, being told otherwise would cost you 7,500,000 shillings you do not owe.',
  }, {
    severity: 'medium',
    text: 'This is the SECOND tax in one budget cycle that Parliament deleted on the floor while the profession went on publishing it — the first was the 0.5% minimum tax on loss-making companies. In Uganda, the floor is where taxes die, and almost nobody watches the floor.',
  }, {
    severity: 'medium',
    text: 'PwC\'s Worldwide Tax Summaries contradicts itself here — it lists "conveyance, transfers" at 1% and then says 1.5% applies to all transfers. The Act distinguishes a TRANSFER (1.5%) from a CONVEYANCE NOT BEING A TRANSFER (a flat UGX 15,000). They are different instruments.',
  }],
};

const RULES = {
  PAYE_RESIDENT_2026, PAYE_RESIDENT_2012, PAYE_NONRESIDENT_2026,
  NSSF_2026, LST_2026,
  PRESUMPTIVE_2020,
  CIT_2026, DIVIDEND_WHT_2026, RENTAL_2026,
  WHT_2026, VAT_2026,
  PENALTIES_2026,
  STARTUP_EXEMPTION,
  TCC_2026,
  FILING_CALENDAR,
  DEDUCTION_BLOCKERS,
  SEVERANCE_2006, SEVERANCE_2025,
  MV_BENEFIT_2026, HOUSING_BENEFIT_2026, LOAN_BENEFIT_2026,
  TERMINAL_BENEFITS_2026, EXEMPT_BENEFITS_2026, MULTIPLE_EMPLOYMENT_2026,
  CAPITAL_ALLOWANCES_2026, PROVISIONAL_TAX_2026, INPUT_VAT_BLOCKED_2026,
  ADVANCE_TAX_TRANSPORT_2026, STAMP_DUTY_2026,
};

// Every source we have caught publishing a wrong or stale Ugandan tax figure.
// These may NEVER be cited by the engine.
const BLACKLIST = [
  { source: 'globallawexperts.com',            reason: 'Published a PAYE table that contradicts its own article body.' },
  { source: 'lawyard.org',                     reason: 'Reproduced the same wrong PAYE table verbatim.' },
  { source: 'The Independent (calculator)',    reason: 'Its PAYE calculator contradicts the body text of its own article.' },
  { source: 'Tally Solutions (Uganda guides)', reason: 'Pre-2020 presumptive table.' },
  { source: 'Grant Thornton Uganda (taxation PDF)', reason: 'Pre-2020 presumptive table; 50m VAT threshold. Years stale.' },
  { source: 'vuplon.com',                      reason: 'Wrong 2026 PAYE bands (10/20/30).' },
  { source: 'URA — PAYE rates page',           reason: 'STALE as at 11 July 2026 — still shows the pre-July-2026 bands. The tax authority is currently wrong.', officialButStale: true },
  { source: 'PwC Uganda — VAT threshold',      reason: 'States 250m. Parliament passed 300m. Also wrong on the deregistration test.', officialButStale: true },
];

module.exports = { RULES, CONFIDENCE, DISPLAYABLE, BLACKLIST, STAGE };
