/* SELAH — browser bundle. GENERATED. Do not edit.
   Built from engine/rules.js + engine/engine.js + engine/tier1.js + engine/applicability.js
   — byte for byte the same code the test suite runs against. If the browser and
   the tests can disagree, the tests are decorative. */
(function (global) {
'use strict';
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


/**
 * SELAH — THE ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * THE ENGINE NEVER RETURNS A NUMBER. IT RETURNS A PROOF.
 *
 * Every computation emits a TRACE: the inputs, the steps, the rule applied, the
 * legal source, the effective date, and the confidence. The UI RENDERS that
 * trace. It does not INVENT it.
 *
 * WHY THIS IS THE ARCHITECTURE AND NOT A UI PREFERENCE:
 *
 *   The obvious way to build "explain the calculation" is to compute a number,
 *   hand it to an LLM, and ask it to write an explanation.
 *
 *   NEVER DO THIS.
 *
 *   An LLM handed `188,250` and asked to explain it will produce a fluent,
 *   confident, plausible explanation — and it will sometimes use the OLD BANDS,
 *   because the old bands are what it learned. It will be wrong in exactly the
 *   way that is hardest to catch: articulate, well-formatted, and internally
 *   consistent.
 *
 *   Uganda already has a surplus of confident, well-formatted, wrong tax
 *   explanations. URA's website has one. The last thing this market needs is a
 *   machine that generates more of them, faster.
 *
 *   THE LLM'S JOB IS GRAMMAR, NOT ARITHMETIC. It may re-word a step. It may
 *   never invent one.
 *
 *   THE TEST: delete the LLM entirely, and the explanation must still be
 *   CORRECT — just less pleasantly phrased. If deleting it breaks the reasoning,
 *   the architecture is wrong.
 *
 * AND THE TRACE IS ALSO OUR LEGAL DEFENCE. Under TPCA s.69(2), a registered tax
 * agent who aids a tax offence faces double the tax evaded and up to 5 years.
 * A trace is a permanent, timestamped record of what we told this client, on
 * what date, on what authority, with what confidence, under which rule version.
 * When a rule changes on 1 July, we can identify every client advised under the
 * old one.
 *
 * Explainability is not a pedagogy feature that happens to help with liability.
 * It is a liability feature that happens to teach.
 * ─────────────────────────────────────────────────────────────────────────────
 */


const UGX = (n) => Math.round(n);

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 THE LOAD-TIME INVARIANT — A MALFORMED RULE MUST NOT LOAD.
//
// This exists because of a real bug, found by deliberately sabotaging the engine.
//
// We reverted the PAYE threshold to the old 235,000 — exactly the error URA's own
// website is making right now. The band table became:
//
//     0 – 235,000  @ 0%        ← changed
//     335,000 – 410,000 @ 20%  ← unchanged
//
// A GAP. Nothing between 235,000 and 335,000. And the engine happily computed
// ZERO TAX for everyone in that gap. Silently. Confidently. Wrongly.
//
// AND THE 93-TEST SUITE PASSED, because it only ever tested POINTS — never the
// INTEGRITY OF THE TABLE ITSELF.
//
// That is the exact shape of the failure this company exists to prevent: not a
// number that is obviously wrong, but a number that is quietly, plausibly,
// confidently wrong.
//
// So: bands are now validated at module load. A gap, an overlap, a table that
// doesn't start at zero or end at infinity — and the ENGINE REFUSES TO LOAD.
// Not a warning. Not a test failure. It will not start.
//
// You cannot ship a wrong number if the wrong number will not boot.
// ═════════════════════════════════════════════════════════════════════════════

function assertContiguous(rule, bands, kind = 'bands') {
  if (!Array.isArray(bands) || bands.length === 0) {
    throw new Error(`[${rule.id}] has no ${kind}. A rule that computes nothing must not load.`);
  }
  if (bands[0].from !== 0) {
    throw new Error(`[${rule.id}] ${kind} do not start at 0 — they start at ${bands[0].from}. Income below that would be computed as zero, silently.`);
  }
  for (let i = 0; i < bands.length - 1; i++) {
    const a = bands[i], b = bands[i + 1];
    if (a.to !== b.from) {
      const problem = a.to < b.from
        ? `A GAP between ${a.to} and ${b.from}. Anyone in that range would be computed as ZERO, silently.`
        : `An OVERLAP between ${b.from} and ${a.to}. Income in that range would be taxed twice, or not at all.`;
      throw new Error(`[${rule.id}] ${kind} are not contiguous. ${problem}`);
    }
    if (a.to <= a.from) {
      throw new Error(`[${rule.id}] band ${i} is inverted or empty: from ${a.from} to ${a.to}.`);
    }
  }
  const last = bands[bands.length - 1];
  if (last.to !== Infinity) {
    throw new Error(`[${rule.id}] ${kind} do not end at Infinity — they end at ${last.to}. Income above that would be computed as zero, silently.`);
  }
}

/** Run on every rule, at load. If this throws, nothing starts. That is the point. */
(function validateAllRules() {
  const errors = [];
  for (const rule of Object.values(RULES)) {
    try {
      if (rule.bands && rule.confidence !== CONFIDENCE.F) {
        // Presumptive and LST are lookup tables with a natural ceiling; PAYE is a
        // marginal-rate ladder that must run to infinity.
        const isLadder = rule.surcharge !== undefined;
        if (isLadder) assertContiguous(rule, rule.bands);
        else {
          // Lookup tables must still be contiguous and start at zero — a gap here
          // is just as silent — but their top band may be bounded.
          if (rule.bands[0].from !== 0) throw new Error(`[${rule.id}] bands do not start at 0.`);
          for (let i = 0; i < rule.bands.length - 1; i++) {
            if (rule.bands[i].to !== rule.bands[i + 1].from) {
              throw new Error(`[${rule.id}] bands are not contiguous around ${rule.bands[i].to}. A taxpayer there would be computed as zero, silently.`);
            }
          }
        }
      }
      if (!rule.confidence) throw new Error(`[${rule.id}] carries no CONFIDENCE. Every rule must declare how sure we are.`);
      if (!rule.verifiedOn) throw new Error(`[${rule.id}] carries no VERIFIED DATE. An undated tax claim is a liability.`);
      if (!rule.source || !rule.source.instrument) throw new Error(`[${rule.id}] carries no SOURCE. We cite primary law, or we do not compute.`);
    } catch (e) { errors.push(e.message); }
  }
  if (errors.length) {
    throw new Error(
      '\n\n🔴 SELAH WILL NOT START. The rules are malformed.\n\n' +
      errors.map((e) => '  • ' + e).join('\n') +
      '\n\nA wrong number must not be servable. Fix the rules.\n'
    );
  }
})();

/** Build the rule block that every trace carries. Never optional. */
function ruleBlock(rule) {
  return {
    id: rule.id,
    confidence: rule.confidence,
    effectiveFrom: rule.effectiveFrom,
    supersedes: rule.supersedes || null,
    verifiedOn: rule.verifiedOn,
    source: rule.source,
    displayable: DISPLAYABLE.has(rule.confidence),
  };
}

/**
 * 🔴 COMPOSE CONFIDENCE — a trace is only as good as its WORST input.
 *
 * This exists because of a real defect, caught by an independent check of the
 * arithmetic rather than by our own tests.
 *
 * Net pay = gross − PAYE − NSSF − LST.
 *   PAYE is confidence A. NSSF is B. LST's BAND AMOUNTS are C.
 *
 * And `netPay` was stamping the whole thing "A · primary law", because it took
 * its rule block from PAYE. A confidence-C input was laundering into a
 * confidence-A output, on a page whose entire promise is that we tell you how
 * sure we are.
 *
 * Rules law 3 says C or F → REFUSE. But refusing to tell an employee their net
 * pay because one band table is unverified would be over-correction dressed up
 * as principle: the LST component is at most 8,333/month, it is DISCLOSED, and
 * the rest of the answer is solid.
 *
 * So we do the honest thing instead of the dramatic one:
 *   — the composite carries the WORST confidence of its inputs,
 *   — it NAMES the input that limited it,
 *   — and it hands back the figure computed WITHOUT that input, so the user
 *     always has a number they can fully trust alongside the one they cannot.
 *
 * Claiming more certainty than your weakest input is exactly what URA's website,
 * PwC and Grant Thornton are all doing right now. We do not get to do it too.
 */
const CONFIDENCE_ORDER = { A: 3, B: 2, C: 1, F: 0 };

function composeConfidence(parts) {
  // parts: [{ id, confidence, label }]
  let worst = parts[0];
  for (const p of parts) {
    if (CONFIDENCE_ORDER[p.confidence] < CONFIDENCE_ORDER[worst.confidence]) worst = p;
  }
  return {
    confidence: worst.confidence,
    limitedBy: worst.confidence === CONFIDENCE.A ? null : worst,
    parts,
  };
}

/**
 * THE REFUSAL.
 * Confidence C or F → we do not compute and disclaim. WE REFUSE, AND WE EXPLAIN.
 * Every competitor's calculator returns a number here. Ours returns the truth.
 */
function refuse(rule, extra = {}) {
  return {
    ok: false,
    refused: true,
    result: null,
    label: rule.label,
    rule: ruleBlock(rule),
    refusal: rule.refusal || {
      headline: 'We cannot calculate this, and we will not guess.',
      why: [`The rule "${rule.label}" is rated confidence ${rule.confidence}. We are not certain enough to give you a number.`],
      whatWeAreDoing: 'We are seeking a primary source or a ruling.',
      whatYouShouldDo: 'Speak to a licensed Ugandan tax adviser.',
    },
    ...extra,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PAYE
// ═════════════════════════════════════════════════════════════════════════════

function computeBanded(monthly, rule) {
  const steps = [];
  let tax = 0;

  for (const b of rule.bands) {
    if (monthly <= b.from) break;
    const upper = Math.min(monthly, b.to);
    const amount = upper - b.from;
    const bandTax = amount * b.rate;
    tax = b.base + bandTax; // bands are cumulative-base, per the statute's own form
    steps.push({
      band: b.to === Infinity
        ? `${fmt(b.from + 1)} and above`
        : `${b.from === 0 ? '0' : fmt(b.from + 1)} – ${fmt(b.to)}`,
      amount: UGX(amount),
      rate: b.rate,
      tax: UGX(bandTax),
      note: b.note || null,
    });
  }

  let surcharge = 0;
  if (rule.surcharge && monthly > rule.surcharge.threshold) {
    surcharge = (monthly - rule.surcharge.threshold) * rule.surcharge.rate;
    tax += surcharge;
    steps.push({
      band: `Additional charge above ${fmt(rule.surcharge.threshold)}`,
      amount: UGX(monthly - rule.surcharge.threshold),
      rate: rule.surcharge.rate,
      tax: UGX(surcharge),
      note: rule.surcharge.note,
    });
  }
  return { tax, steps };
}

/**
 * PAYE.
 * @param {number} grossMonthly
 * @param {'resident'|'non-resident'} residence
 */
function paye(grossMonthly, residence = 'resident') {
  if (residence === 'non-resident') {
    // 🔴 We do not know the FY2026/27 non-resident bands. Nobody in Uganda does.
    return refuse(RULES.PAYE_NONRESIDENT_2026, { inputs: { grossMonthly, residence } });
  }

  const rule = RULES.PAYE_RESIDENT_2026;
  const old = RULES.PAYE_RESIDENT_2012;

  const { tax, steps } = computeBanded(grossMonthly, rule);
  const { tax: oldTax } = computeBanded(grossMonthly, old);

  return {
    ok: true,
    refused: false,
    result: UGX(tax),
    currency: 'UGX',
    label: 'PAYE due this month',
    rule: ruleBlock(rule),
    inputs: { grossMonthly: UGX(grossMonthly), residence },
    steps,
    comparison: {
      under: old.id,
      result: UGX(oldTax),
      delta: UGX(tax - oldTax),
      meaning: tax < oldTax
        ? `You pay ${fmt(UGX(oldTax - tax))} LESS per month under the new rules.`
        : tax > oldTax
          ? `You pay ${fmt(UGX(tax - oldTax))} MORE per month under the new rules.`
          : 'No change under the new rules.',
    },
    warnings: rule.warnings,
    nextAction: {
      text: 'Your employer may still be using the old bands. Shall we check your last six payslips?',
      product: 'health_check',
    },
  };
}

/** Net pay: gross − PAYE − employee NSSF − LST. */
function netPay(grossMonthly, { residence = 'resident', nssf = true, lst = true } = {}) {
  const p = paye(grossMonthly, residence);
  if (p.refused) return p;

  const n = RULES.NSSF_2026;

  // 🔴 EVERY LINE ON A PAYSLIP IS A WHOLE NUMBER OF SHILLINGS.
  //
  // This function used to round PAYE and then subtract UNROUNDED NSSF and LST
  // from it — mixing rounded and unrounded money inside a single subtraction.
  // The result was a net pay with a meaningless fractional part, and a
  // net-to-gross solver that could disagree with itself by a shilling depending
  // on which side of the rounding you approached from.
  //
  // An independent hand-check of the arithmetic found it. Our own tests could
  // not have: they asserted the engine against the engine.
  //
  // There is no such thing as 0.37 of a shilling on a payslip. Each deduction is
  // computed, rounded, and subtracted — exactly as a payroll clerk does it. The
  // net is then an integer by construction, and the ambiguity simply ceases to
  // exist rather than being papered over with a tolerance.
  const employeeNssf = nssf ? UGX(grossMonthly * n.employeeRate) : 0;
  const employerNssf = nssf ? UGX(grossMonthly * n.employerRate) : 0;
  const lstAnnual = lst ? lstFor(grossMonthly).result : 0;
  const lstMonthly = UGX(lstAnnual / 12);

  const net = grossMonthly - p.result - employeeNssf - lstMonthly;
  const netExcludingLst = grossMonthly - p.result - employeeNssf;

  // 🔴 The composite is only as good as its worst input. LST's band amounts are C.
  const conf = composeConfidence([
    { id: RULES.PAYE_RESIDENT_2026.id, confidence: RULES.PAYE_RESIDENT_2026.confidence, label: 'PAYE bands' },
    { id: RULES.NSSF_2026.id,          confidence: RULES.NSSF_2026.confidence,          label: 'NSSF rates' },
    ...(lst ? [{ id: RULES.LST_2026.id, confidence: RULES.LST_2026.bandsConfidence,     label: 'Local Service Tax band amounts' }] : []),
  ]);

  return {
    ok: true,
    refused: false,
    result: UGX(net),
    resultExact: net,          // An INTEGER by construction. No fractional shillings exist.
    currency: 'UGX',
    label: 'Net pay',
    rule: { ...ruleBlock(RULES.PAYE_RESIDENT_2026), ...conf },
    inputs: { grossMonthly: UGX(grossMonthly), residence },
    steps: [
      { band: 'Gross',                  amount: UGX(grossMonthly),  rate: null, tax: null },
      { band: 'PAYE',                   amount: null, rate: null, tax: -UGX(p.result) },
      { band: 'NSSF — employee (5%)',   amount: null, rate: n.employeeRate, tax: -UGX(employeeNssf) },
      { band: 'Local Service Tax',      amount: null, rate: null, tax: -UGX(lstMonthly), note: 'Annual LST, spread monthly. Remitted to your LOCAL AUTHORITY by 31 October — not to URA.' },
    ],
    detail: {
      paye: p,
      employeeNssf: UGX(employeeNssf),
      employerNssf: UGX(employerNssf),
      trueEmployerCost: UGX(grossMonthly + employerNssf),
      lstAnnual: UGX(lstAnnual),
    },
    // The figure with NO unverified input in it. Always give the user a number
    // they can fully trust, next to the one they cannot.
    certain: {
      netExcludingLst: UGX(netExcludingLst),
      confidence: CONFIDENCE.B,
      note: 'PAYE and NSSF only. Both verified against primary law. No confidence-C input.',
    },
    warnings: [
      ...RULES.PAYE_RESIDENT_2026.warnings,
      ...(conf.limitedBy ? [{ severity: 'medium',
        text: `THIS ANSWER IS RATED CONFIDENCE ${conf.confidence}, NOT A — and the reason is ${conf.limitedBy.label}. We have not verified the LST band amounts against a primary source, so we will not claim we have. Your PAYE and NSSF are certain: without LST, your net pay is ${fmt(UGX(netExcludingLst))}. LST can move that by at most ${fmt(UGX(100000 / 12))} a month.` }] : []),
      { severity: 'info',
        text: `The employer also pays ${fmt(UGX(employerNssf))} in NSSF (10%). Your true cost to the employer is ${fmt(UGX(grossMonthly + employerNssf))} — before leave, notice and severance.` },
    ],
    nextAction: { text: 'Shall we check your last six payslips against the correct bands?', product: 'health_check' },
  };
}

function lstFor(grossMonthly) {
  const rule = RULES.LST_2026;
  const band = rule.bands.find((b) => grossMonthly > b.from && grossMonthly <= b.to)
            || rule.bands[rule.bands.length - 1];
  return {
    ok: true, refused: false,
    result: band.amount,
    currency: 'UGX',
    label: 'Local Service Tax (annual)',
    rule: { ...ruleBlock(rule), confidence: rule.bandsConfidence },
    inputs: { grossMonthly: UGX(grossMonthly) },
    steps: [{ band: `Monthly income ${fmt(band.from)} – ${band.to === Infinity ? 'above' : fmt(band.to)}`, amount: null, rate: null, tax: band.amount }],
    warnings: [{ severity: 'medium',
      text: 'The LST band amounts are rated confidence C — verify against your local authority before relying on them. The obligation itself, and the 31 October deadline, are certain.' }],
    notes: rule.notes,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PRESUMPTIVE TAX
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {number} turnover  annual gross turnover
 * @param {boolean} hasRecords
 * @param {boolean} isProfessional  s.4(8) — a consultant is EXCLUDED
 */
function presumptive(turnover, hasRecords = true, isProfessional = false) {
  const rule = RULES.PRESUMPTIVE_2020;

  if (isProfessional) {
    return {
      ok: true, refused: false, result: null, excluded: true,
      label: 'Presumptive tax — EXCLUDED',
      rule: ruleBlock(rule),
      inputs: { turnover: UGX(turnover), hasRecords, isProfessional },
      steps: [],
      warnings: [{ severity: 'high',
        text: 'You are EXCLUDED from presumptive tax. ITA s.4(8) excludes medical, dental, architectural, engineering, ACCOUNTING, LEGAL and other professional services, public entertainment, public utility and construction. You are taxed at ordinary rates on your PROFIT, not your turnover.',
      }, { severity: 'info',
        text: 'Note: URA\'s own leaflet says only "dental, medical and architectural… among others". The STATUTE is broader. Half of Uganda\'s published guidance would route you into the wrong regime.' }],
      nextAction: { text: 'Shall we model your ordinary income tax instead?', product: 'ordinary_tax' },
    };
  }

  // The exactly-150,000,000 edge case. s.4(5) says "less than" → it does not engage.
  if (turnover >= rule.ceiling) {
    return {
      ok: true, refused: false, result: null, outOfRegime: true,
      label: 'Presumptive tax — does not apply',
      rule: ruleBlock(rule),
      inputs: { turnover: UGX(turnover), hasRecords },
      steps: [],
      warnings: [{ severity: 'info',
        text: turnover === rule.ceiling
          ? 'At EXACTLY UGX 150,000,000, presumptive tax does not engage. s.4(5) requires turnover "LESS THAN" 150m. Schedule 3 is a rate card, not a gateway — its own words are "the amount of tax payable FOR PURPOSES OF SECTION 4(5)". You are in the ORDINARY regime. (This is our legal analysis; URA has published no position and there is no case law.)'
          : 'Turnover exceeds UGX 150,000,000. You are in the ordinary regime — 30% of chargeable income.' }],
      nextAction: { text: 'Shall we model your corporate income tax instead?', product: 'cit' },
    };
  }

  const band = rule.bands.find((b) => turnover > b.from && turnover <= b.to) || rule.bands[0];
  let tax, steps;

  if (turnover <= 10_000_000) {
    tax = 0;
    steps = [{ band: 'Not exceeding 10,000,000', amount: UGX(turnover), rate: 0, tax: 0, note: 'No income tax is payable on business income at this turnover.' }];
  } else if (hasRecords) {
    const w = band.withRecords;
    const excess = turnover - w.over;
    tax = w.base + excess * w.rate;
    steps = [
      { band: `Base for the ${fmt(band.from)}–${fmt(band.to)} band`, amount: null, rate: null, tax: UGX(w.base) },
      { band: `${(w.rate * 100).toFixed(1)}% of turnover above ${fmt(w.over)}`, amount: UGX(excess), rate: w.rate, tax: UGX(excess * w.rate) },
    ];
  } else {
    tax = band.noRecords;
    steps = [{ band: `${fmt(band.from)} – ${fmt(band.to)}, WITHOUT records`, amount: UGX(turnover), rate: null, tax: UGX(band.noRecords),
      note: 'A fixed amount. Keeping records would almost certainly cost you less — see the comparison.' }];
  }

  const withRecordsTax = (() => {
    if (turnover <= 10_000_000) return 0;
    const w = band.withRecords;
    return w.base + (turnover - w.over) * w.rate;
  })();

  return {
    ok: true, refused: false,
    result: UGX(tax),
    currency: 'UGX',
    label: 'Presumptive tax (final)',
    rule: ruleBlock(rule),
    inputs: { turnover: UGX(turnover), hasRecords },
    steps,
    comparison: !hasRecords && turnover > 10_000_000 ? {
      under: 'with records',
      result: UGX(withRecordsTax),
      delta: UGX(withRecordsTax - tax),
      meaning: `If you kept records, you would pay ${fmt(UGX(withRecordsTax))} — ${fmt(UGX(tax - withRecordsTax))} LESS. Keeping records is not a chore. It is a discount.`,
    } : null,
    warnings: [
      { severity: 'info', text: 'This tax is FINAL. No deductions for expenditure or losses.' },
      { severity: 'info', text: 'BUT withholding tax credits and provisional tax paid REMAIN claimable (Schedule 3, Part II). The WHT certificate keeps its value in every regime.' },
      { severity: 'medium', text: 'URA does not compute this. You type the amount into the portal yourself, from the brackets. There is no validation. Type too little and you attract an assessment; type too much and nobody tells you.' },
    ],
    notes: rule.notes,
    nextAction: { text: 'You may ELECT OUT of presumptive tax in writing. Shall we model both regimes side by side?', product: 'presumptive_election' },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ANNUAL INDIVIDUAL INCOME TAX (the same bands, annualised)
// ═════════════════════════════════════════════════════════════════════════════

function individualIncomeTaxAnnual(annualProfit) {
  const monthlyEquiv = annualProfit / 12;
  const p = paye(monthlyEquiv, 'resident');
  if (p.refused) return p;
  return { ...p, result: UGX(p.result * 12), label: 'Individual income tax (annual)', inputs: { annualProfit: UGX(annualProfit) } };
}

// ═════════════════════════════════════════════════════════════════════════════
// THE ENTITY CROSSOVER — sole trader vs company
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 🔑 Everyone assumes the company pays more tax. Up to UGX 133,410,000 of annual
 * profit, THE OPPOSITE IS TRUE — and the crossover is exactly computable.
 *
 * Below 120m the individual's effective rate NEVER reaches 30%: the tax-free
 * band plus the 20% and 25% bands always hold it under a flat 30%. Maximum
 * advantage: UGX 1,341,000/year.
 *
 * Above 120m the additional 10% bites, and the individual's effective rate
 * climbs past 30% at exactly 133,410,000.
 */
const ENTITY_CROSSOVER = 133_410_000;

function soleTraderVsCompany(annualProfit) {
  const sole = individualIncomeTaxAnnual(annualProfit);
  const cit = annualProfit * RULES.CIT_2026.rate;

  return {
    ok: true, refused: false,
    result: null,
    label: 'Sole trader or company?',
    rule: ruleBlock(RULES.CIT_2026),
    inputs: { annualProfit: UGX(annualProfit) },
    options: [
      { id: 'sole_trader', label: 'Sole trader',
        tax: UGX(sole.result), effectiveRate: sole.result / annualProfit,
        howItWorks: ['Business profit is treated as your PERSONAL income and taxed at individual rates.'],
        requiresOfYou: 'Nothing. But you are PERSONALLY LIABLE for every business debt. Your house is on the line.',
        costs: ['Unlimited personal liability.', 'You cannot pay yourself a deductible salary — you cannot employ yourself.', 'Harder to raise investment. Often excluded from corporate tenders.'],
        stopsWorkingWhen: `Your annual profit passes ${fmt(ENTITY_CROSSOVER)}. Above that, the company pays less tax.` },
      { id: 'company', label: 'Limited company',
        tax: UGX(cit), effectiveRate: RULES.CIT_2026.rate,
        howItWorks: ['Corporation tax at a flat 30% of chargeable income.'],
        requiresOfYou: 'Real corporate formality — URSB registration, directors\' TINs, filings, and a TCC that your directors\' personal returns can block.',
        costs: ['Real administrative cost.', `Below ${fmt(ENTITY_CROSSOVER)} of profit you pay MORE tax — up to UGX 1,341,000/year more.`],
        stopsWorkingWhen: null,
        benefits: ['LIMITED LIABILITY.', 'You can pay yourself a DEDUCTIBLE salary (see the extraction model).', 'You can retain profit at 30% to fund growth.', 'You can raise investment.'] },
    ],
    whatTheNumbersFavour: {
      option: annualProfit < ENTITY_CROSSOVER ? 'sole_trader' : annualProfit > ENTITY_CROSSOVER ? 'company' : 'neither — they are equal',
      by: UGX(Math.abs(sole.result - cit)),
      caveat: 'On TAX ALONE. And the tax difference is small. Unlimited personal liability is not a tax question — it is a risk question that happens to have a tax consequence. Below the crossover, the sole trader saves at most UGX 1,341,000 a year, and pays for it with his house.',
    },
    whatWeCannotTellYou: [
      'Whether you can tolerate unlimited personal liability.',
      'Whether you will ever want outside investment.',
      'Whether your customers require you to be a company.',
    ],
    crossover: ENTITY_CROSSOVER,
    disclaimerTier: 3,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// EXTRACTION — salary vs dividend vs retain
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 NEVER DEFAULT TO DIVIDENDS.
 * 30% CIT, then 15% WHT on the remaining 70% = 40.5% effective.
 * That is worse than the top marginal PAYE rate.
 *
 * A Ugandan owner who pays himself in dividends "because that's what
 * shareholders get" is volunteering an extra 10.5 points.
 */
function extraction(profit) {
  const cit = RULES.CIT_2026.rate;
  const divWht = RULES.DIVIDEND_WHT_2026.rate;

  const afterCit = profit * (1 - cit);
  const dividendNet = afterCit * (1 - divWht);
  const salaryTax = individualIncomeTaxAnnual(profit).result;
  const salaryNet = profit - salaryTax;

  return {
    ok: true, refused: false,
    result: null,
    label: 'How should I take money out of my company?',
    rule: ruleBlock(RULES.DIVIDEND_WHT_2026),
    inputs: { profit: UGX(profit) },
    options: [
      { id: 'salary', label: 'Pay it as salary',
        youKeep: UGX(salaryNet), totalTax: UGX(salaryTax), effectiveRate: salaryTax / profit,
        howItWorks: [
          'Salary is DEDUCTIBLE to the company — so no 30% corporation tax on it.',
          'The first UGX 4,020,000/year is taxed at 0% in your hands.',
          'The rest is taxed progressively — 20%, then 25%, then 30%.',
        ],
        requiresOfYou: 'It must be a GENUINE salary, for GENUINE work you actually do for the company. A salary paid to someone who does no work is a distribution wearing a costume — and ITA s.117 (the GAAR) lets URA say so, with no mental-element defence.',
        costs: [
          'NSSF at 15% (5% you + 10% the company). A real cash cost — but it is YOUR money, it is deductible to the company, and it comes back out of a retirement fund TAX-FREE (s.21(1)(n)).',
          'PAYE is due monthly, by the 15th. An administrative burden a dividend does not carry.',
        ],
        stopsWorkingWhen: 'Your personal income passes UGX 120,000,000/year. Above that your marginal PAYE rate is 40% — worse than the company\'s 30%. Stop, and retain.' },

      { id: 'retain', label: 'Leave it in the company',
        youKeep: UGX(afterCit), note: 'in the company, not in your pocket',
        totalTax: UGX(profit * cit), effectiveRate: cit,
        howItWorks: ['Corporation tax at 30%. The money stays in the business to fund growth.'],
        requiresOfYou: 'Nothing. This is the default.',
        costs: ['You cannot spend it personally without later triggering one of the other options.'],
        stopsWorkingWhen: null },

      { id: 'dividend', label: 'Take it as a dividend',
        youKeep: UGX(dividendNet),
        totalTax: UGX(profit - dividendNet),
        effectiveRate: (profit - dividendNet) / profit,
        flag: 'THE MOST EXPENSIVE ROUTE.',
        howItWorks: [
          'The company pays 30% corporation tax on the profit.',
          'Then 15% withholding tax is deducted from the distribution.',
          'Two taxes on the same money: 40.5% effective.',
        ],
        requiresOfYou: 'Nothing — it is entirely legitimate. It is simply the most expensive route available to you.',
        costs: [`UGX ${fmt(UGX(dividendNet ? salaryNet - dividendNet : 0))} less in your pocket than the salary route, on this profit.`],
        stopsWorkingWhen: null },
    ],
    whatTheNumbersFavour: {
      option: 'salary',
      by: UGX(salaryNet - dividendNet),
      caveat: 'On tax alone. Tax is not the only thing that matters — your cash-flow needs, your growth plans, and whether you actually work in the business may all point elsewhere.',
    },
    whatWeCannotTellYou: [
      'Whether you actually perform work that justifies a salary — only you know that.',
      'Whether you need the cash personally or can leave it in the business.',
      'Whether your shareholders\' agreement or loan covenants restrict any of these.',
    ],
    theTest: 'If URA asked you why you did this — and "to save tax" were not an allowed answer — could you answer?',
    disclaimerTier: 3,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// WHT — the Isaac engine
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 🔑 THIS IS THE PRODUCT.
 *
 * WHT deducted from you is a CREDIT — prepaid tax. But it is only claimable if
 * you HOLD THE CERTIFICATE.
 *
 * Isaac invoiced UGX 60,000,000 over five years. 6% was withheld: UGX 3,600,000.
 * He held 4 certificates out of 11. He paid tax twice on the rest.
 */
function whtCredits({ invoiced, rateKey = 'professional_fees', residence = 'resident', certificatesExpected, certificatesHeld }) {
  const rule = RULES.WHT_2026;
  const spec = rule.rates.find((r) => r.key === rateKey);
  if (!spec) throw new Error(`Unknown WHT type: ${rateKey}`);

  const rate = residence === 'resident' ? spec.resident : spec.nonResident;
  if (rate == null) {
    return refuse({ ...rule, confidence: CONFIDENCE.F, label: `${spec.label} — ${residence}`,
      refusal: {
        headline: 'This withholding tax does not apply in the way you have described.',
        why: [`${spec.label} has no ${residence} rate in the Act.`],
        whatWeAreDoing: 'Check the payment type.',
        whatYouShouldDo: 'Confirm the correct category with a licensed adviser.',
      } });
  }

  const withheld = invoiced * rate;
  const perCert = certificatesExpected > 0 ? withheld / certificatesExpected : 0;
  const claimable = perCert * certificatesHeld;
  const lost = withheld - claimable;

  return {
    ok: true, refused: false,
    result: UGX(withheld),
    currency: 'UGX',
    label: 'Withholding tax — and what you can actually claim',
    rule: ruleBlock(rule),
    inputs: { invoiced: UGX(invoiced), rateKey, residence, certificatesExpected, certificatesHeld },
    steps: [
      { band: `${spec.label} — ${residence}`, amount: UGX(invoiced), rate, tax: UGX(withheld),
        note: 'This is NOT a cost. It is PREPAID TAX — a credit against your income tax liability.' },
    ],
    credits: {
      withheld: UGX(withheld),
      certificatesExpected,
      certificatesHeld,
      certificatesMissing: certificatesExpected - certificatesHeld,
      claimable: UGX(claimable),
      atRisk: UGX(lost),
    },
    warnings: lost > 0 ? [{
      severity: 'high',
      text: `URA is holding UGX ${fmt(UGX(withheld))} that belongs to you. You hold ${certificatesHeld} of ${certificatesExpected} certificates. Without the other ${certificatesExpected - certificatesHeld}, UGX ${fmt(UGX(lost))} of that is UNCLAIMABLE — and you will pay tax twice on the same income.`,
    }] : [{ severity: 'info', text: 'You hold every certificate. The full credit is claimable. This is rarer than it should be.' }],
    nextAction: lost > 0
      ? { text: `Chase the ${certificatesExpected - certificatesHeld} missing certificates. We have drafted the requests.`, product: 'wht_chase' }
      : { text: 'Claim the credit on your return.', product: 'filing' },
    notes: ['A credit you cannot evidence is a credit you do not have.'],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// VAT REGISTRATION — and the trap PwC got wrong in public
// ═════════════════════════════════════════════════════════════════════════════

function vatRegistration({ annualTurnover, bestQuarterTurnover = 0, expectedNextQuarter = 0 }) {
  const rule = RULES.VAT_2026;
  const quarterlyTrigger = rule.annualThreshold / rule.quarterlyDivisor; // 75,000,000

  const byAnnual = annualTurnover > rule.annualThreshold;
  const byQuarter = bestQuarterTurnover > quarterlyTrigger;
  const byForecast = expectedNextQuarter > quarterlyTrigger;
  const mustRegister = byAnnual || byQuarter || byForecast;

  const reasons = [];
  if (byAnnual)   reasons.push(`Annual turnover of ${fmt(UGX(annualTurnover))} exceeds the ${fmt(rule.annualThreshold)} threshold.`);
  if (byQuarter)  reasons.push(`You made ${fmt(UGX(bestQuarterTurnover))} in three consecutive months — above the ${fmt(quarterlyTrigger)} quarterly trigger. THIS LIMB BITES FIRST, even if your annual turnover is far below 300m.`);
  if (byForecast) reasons.push(`You expect ${fmt(UGX(expectedNextQuarter))} next quarter. s.7(1)(b) is FORWARD-LOOKING: registration is triggered at the BEGINNING of a quarter where there are reasonable grounds to expect supplies will exceed the trigger.`);

  // The deregistration trap
  const deregQuarterly = rule.annualThreshold / rule.deregistration.quarterlyDivisor; // 75m
  const deregAnnual = rule.annualThreshold * rule.deregistration.annualPct;           // 225m
  const canDeregister = bestQuarterTurnover <= deregQuarterly && annualTurnover <= deregAnnual;
  const stuck = !mustRegister && !canDeregister;

  return {
    ok: true, refused: false,
    result: mustRegister,
    label: 'Must I register for VAT?',
    rule: ruleBlock(rule),
    inputs: { annualTurnover: UGX(annualTurnover), bestQuarterTurnover: UGX(bestQuarterTurnover), expectedNextQuarter: UGX(expectedNextQuarter) },
    steps: [
      { band: 'Annual threshold',    amount: rule.annualThreshold, rate: null, tax: null, note: 'Raised from 150,000,000 on 1 July 2026.' },
      { band: 'Quarterly trigger',   amount: quarterlyTrigger,     rate: null, tax: null,
        note: 'ONE-QUARTER of the annual threshold. The 37,500,000 figure everyone still quotes was NEVER a statutory number — it was simply 150m ÷ 4. s.7(1) says "one-quarter of the annual registration threshold". It auto-scales.' },
    ],
    mustRegister,
    reasons,
    deregistration: {
      canDeregister,
      quarterlyLimb: deregQuarterly,
      annualLimb: deregAnnual,
      stuck,
    },
    warnings: [
      ...(stuck ? [{ severity: 'high',
        text: `YOU ARE STUCK. At ${fmt(UGX(annualTurnover))} you are BELOW the ${fmt(rule.annualThreshold)} registration threshold — but you CANNOT deregister, because s.9(2) requires your last 12 months to be at or below 75% of the threshold (${fmt(deregAnnual)}), not below the threshold itself. PwC's public commentary says otherwise. PwC is wrong on the statute.` }] : []),
      { severity: 'info',
        text: 'PwC Uganda publicly states the new threshold is UGX 250,000,000. Parliament passed 300,000,000 on 21 April 2026. Their note also gets the deregistration test wrong.' },
    ],
    nextAction: mustRegister
      ? { text: 'Shall we model your VAT position and input recovery?', product: 'vat' }
      : { text: 'Shall we model whether VOLUNTARY registration would benefit you? It depends on your input VAT and whether your customers can reclaim.', product: 'vat_voluntary' },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PENALTY & INTEREST — the mathematics of silence
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 🔑 RADAR'S BEATING HEART.
 *
 * "Your UGX 4,000,000 arrear becomes UGX 11,000,000 in five years if you do
 *  nothing."
 *
 * And then the cure: voluntary disclosure BEFORE court proceedings commence, and
 * the Commissioner MAY waive the interest and the penalty entirely.
 */
function arrearsProjection({ principal, monthsOverdue = 0, projectMonths = 12, compounds = true }) {
  const rule = RULES.PENALTIES_2026;
  const r = rule.interestPerMonth;

  const grow = (months) => compounds
    ? principal * Math.pow(1 + r, months)
    : principal * (1 + r * months);

  const today = grow(monthsOverdue);
  const future = grow(monthsOverdue + projectMonths);
  const fiveYears = grow(monthsOverdue + 60);

  return {
    ok: true, refused: false,
    result: UGX(today),
    currency: 'UGX',
    label: 'What this arrear actually costs',
    rule: ruleBlock(rule),
    inputs: { principal: UGX(principal), monthsOverdue, projectMonths, compounds },
    steps: [
      { band: 'Principal',                                  amount: UGX(principal),             rate: null,  tax: null },
      { band: `Interest — ${monthsOverdue} months @ 2%/mo${compounds ? ', compounding' : ''}`, amount: null, rate: r, tax: UGX(today - principal) },
      { band: 'Balance today',                              amount: null,                       rate: null,  tax: UGX(today) },
    ],
    projection: {
      today: UGX(today),
      inMonths: projectMonths,
      then: UGX(future),
      growth: UGX(future - today),
      inFiveYears: UGX(fiveYears),
      annualisedRate: Math.pow(1 + r, 12) - 1,
    },
    warnings: [
      { severity: 'high',
        text: `Do nothing for ${projectMonths} more months and this becomes ${fmt(UGX(future))} — it grows by ${fmt(UGX(future - today))}. In five years from the due date: ${fmt(UGX(fiveYears))}.` },
      { severity: 'high',
        text: 'Interest does NOT stop while you dispute. In URA v Airtel the Supreme Court held that penal tax and interest continue to accrue throughout objection and Tribunal proceedings. The 30% deposit is a condition of being heard — not a moratorium.' },
    ],
    theCure: {
      headline: 'This may be curable — entirely.',
      text: 'Where a taxpayer VOLUNTARILY DISCLOSES an offence to the Commissioner BEFORE court proceedings commence, the Commissioner may compound it: you pay the outstanding tax, and NO INTEREST AND NO FINE.',
      worth: UGX(today - principal),
      steps: ['Find the arrear', 'Disclose it voluntarily', 'Agree an instalment plan (URA expressly accepts an MOU)', 'Get the TCC', 'Win the tender'],
      note: 'Every step of that is in URA\'s own published rules. Nobody in Uganda is selling it as a product.',
    },
    nextAction: { text: `Voluntary disclosure could be worth ${fmt(UGX(today - principal))} to you. Shall we draft the letter?`, product: 'voluntary_disclosure' },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// THE STARTUP EXEMPTION — three questions, three years of zero tax
// ═════════════════════════════════════════════════════════════════════════════

function startupExemption({ establishedAfter1Jul2025, eacCitizenOwnedAtLeast51pct, registeredCapital, priorBenefitBySelfOrRelative, willFileReturns }) {
  const rule = RULES.STARTUP_EXEMPTION;

  const checks = [
    { key: 'established_after', label: 'Established after 1 July 2025', pass: !!establishedAfter1Jul2025 },
    { key: 'citizen',           label: 'At least 51% EAC-citizen owned (a COMPANY can qualify)', pass: !!eacCitizenOwnedAtLeast51pct },
    { key: 'capital',           label: `Registered investment capital not exceeding ${fmt(rule.capitalCeiling)}`, pass: registeredCapital <= rule.capitalCeiling },
    { key: 'no_prior',          label: 'Neither you NOR A RELATIVE has previously benefited', pass: !priorBenefitBySelfOrRelative },
    { key: 'files',             label: 'You will file returns, including the s.147 business information return', pass: !!willFileReturns },
  ];
  const qualifies = checks.every((c) => c.pass);
  const failed = checks.filter((c) => !c.pass);

  return {
    ok: true, refused: false,
    result: qualifies,
    label: 'The three-year income tax exemption',
    rule: ruleBlock(rule),
    inputs: { establishedAfter1Jul2025, eacCitizenOwnedAtLeast51pct, registeredCapital: UGX(registeredCapital), priorBenefitBySelfOrRelative, willFileReturns },
    checks,
    qualifies,
    headline: qualifies
      ? 'You may owe NO income tax at all — for three years.'
      : `You do not appear to qualify. ${failed.length} condition${failed.length > 1 ? 's' : ''} not met.`,
    warnings: [
      { severity: 'info',
        text: 'This exemption is not on URA\'s own Income Tax Exemption page, and it is not in PwC\'s Worldwide Tax Summaries. We found it in the gazette. RSM lists it and prints the conditions wrong ("or" where the Act says "and").' },
      { severity: 'medium',
        text: '"Associate" (ITA s.3) INCLUDES RELATIVES. If a sibling has claimed this exemption, you may be out. This is untested.' },
      { severity: 'medium',
        text: '"Investment capital" is UNDEFINED in the Act. ICPAU formally asked Parliament to define it. Parliament did not.' },
      { severity: 'high',
        text: 'The interaction with PRESUMPTIVE TAX (s.4(5)) for a sub-150m business is UNRESOLVED — no URA guidance, no ruling, no commentary exists anywhere. The defensive move is a written s.4(5) election into normal assessment.' },
    ],
    openQuestions: rule.openQuestions,
    whatWeCannotTellYou: [
      'Whether a relative has already claimed it — only you know that.',
      'What "investment capital" means. Nobody knows. Parliament was asked and did not answer.',
    ],
    nextAction: qualifies
      ? { text: 'This is worth a private ruling request (TPCA s.53) to make certain. Shall we draft it?', product: 'private_ruling' }
      : { text: 'Shall we model your ordinary tax position?', product: 'ordinary_tax' },
    disclaimerTier: 2,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// TCC READINESS — including the director trap
// ═════════════════════════════════════════════════════════════════════════════

function tccReadiness({ profileCurrent, companyReturnsFiled, companyArrears = 0, hasPaymentPlan = false, directors = [], nssfArrears = 0 }) {
  const rule = RULES.TCC_2026;
  const blockers = [];
  const warnings = [];

  if (!profileCurrent)      blockers.push({ key: 'profile',  text: 'Your URA registration profile is not up to date. Stale directors, addresses or tax types will block the certificate — and it is a very common SILENT blocker.' });
  if (!companyReturnsFiled) blockers.push({ key: 'returns',  text: 'The company has unfiled returns. This means ANY registered tax head — VAT, PAYE, WHT, provisional, rental — not just income tax.' });
  if (companyArrears > 0 && !hasPaymentPlan)
    blockers.push({ key: 'arrears',  text: `The company has UGX ${fmt(UGX(companyArrears))} outstanding and no payment plan. This includes penal tax and interest, not just principal.`,
      cure: 'URA criterion 5 EXPRESSLY accepts a Memorandum of Understanding to pay in instalments as an alternative to full payment. The Commissioner General has publicly confirmed distressed businesses are "not automatically disqualified".' });

  // 🔑 THE DIRECTOR TRAP
  for (const d of directors) {
    if (!d.personalReturnsFiled) {
      blockers.push({
        key: `director_returns:${d.name}`,
        text: `HARD BLOCK — Director ${d.name} has not filed their PERSONAL tax returns.`,
        why: 'URA criterion 3, verbatim: "For Non-Individuals, the associated persons (directors or partners) MUST have submitted all their returns."',
        insight: 'Your company can be spotless — every return filed, every shilling paid — and still be refused its certificate because of one director\'s personal return. It is invisible from inside your own ledger. You find out when you lose the tender.',
      });
    }
    if (d.personalArrears > 0) {
      warnings.push({
        severity: 'medium',
        text: `Director ${d.name} has personal arrears of UGX ${fmt(UGX(d.personalArrears))}. URA does NOT state that a director's unpaid arrears block a company's TCC — criterion 5's payment test refers to "the taxpayer", i.e. the applicant entity. We rate this confidence C and WARN rather than block. Settle it by private ruling if it matters to you.`,
      });
    }
  }

  if (nssfArrears > 0) {
    warnings.push({
      severity: 'high',
      text: `You have UGX ${fmt(UGX(nssfArrears))} of NSSF arrears. This will NOT block your URA Tax Clearance Certificate — but PPDA's bidding documents list the Social Security contribution certificate as a SEPARATE requirement. You can hold a valid TCC and still lose the tender. This is MamaOpe, precisely.`,
    });
  }

  return {
    ok: true, refused: false,
    result: blockers.length === 0,
    label: 'Will URA issue your Tax Clearance Certificate?',
    rule: ruleBlock(rule),
    inputs: { profileCurrent, companyReturnsFiled, companyArrears: UGX(companyArrears), hasPaymentPlan, directorCount: directors.length },
    ready: blockers.length === 0,
    blockers,
    warnings,
    criteria: rule.criteria,
    notes: [
      'The Tax Procedures Code Act is COMPLETELY SILENT on issuance criteria. All five are ADMINISTRATIVE, not statutory — which means a refusal is a "tax decision", objectionable under TPCA s.24 and appealable to the Tax Appeals Tribunal. Most Ugandan business owners do not know that remedy exists.',
      'A company under 3 years old cannot get an ANNUAL TCC — it must use transactional TCCs, one per counterparty, one per deal.',
    ],
    nextAction: blockers.length
      ? { text: 'Shall we produce the exact list of what must be fixed, and in what order?', product: 'tcc_remediation' }
      : { text: 'You appear ready. Shall we prepare the application?', product: 'tcc_apply' },
  };
}

// ═════════════════════════════════════════════════════════════════════════════

function fmt(n) {
  if (n === Infinity) return '∞';
  return new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(Math.round(n));
}


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


/**
 * SELAH — F4, THE COMMENCEMENT CLOCK
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THIS FOUNDATION EXISTS BECAUSE WE GOT IT WRONG TWICE IN ONE WEEK.
 *
 *   1. We SHIPPED a 0.5% minimum tax on loss-making companies. It was Clause 8
 *      of the Income Tax (Amendment) Bill 2026 — gazetted, real, and published as
 *      law by MMAKS, Crowe, mrt.tax and Global Law Experts. PARLIAMENT DELETED IT
 *      ON THE FLOOR on 23 April 2026. We read the Bill and called it the Act.
 *
 *   2. We nearly shipped a 3% stamp duty on land transfers. Same Bill season,
 *      same firms, same confidence. PARLIAMENT REJECTED IT ON 21 APRIL 2026.
 *      This time we refused to compute — and we were right.
 *
 *   3. And the Employment (Amendment) Act 2025 is ASSENTED — signed by the
 *      President on 29 April 2026 — and STILL NOT IN FORCE, because no
 *      commencement notice has been gazetted. Every HR guide in Uganda is already
 *      reporting its severance rule as law. It is not.
 *
 * THREE FAILURES, ONE CAUSE: nobody in Uganda tracks WHAT STAGE A TAX IS AT.
 *
 *     BILL       → proposed. May die on the floor. MAY NEVER COMPUTE.
 *     PASSED     → survived the floor. Not yet signed. MAY NEVER COMPUTE.
 *     ASSENTED   → signed. NOT IN FORCE until a commencement notice is gazetted.
 *                  MAY NEVER COMPUTE.
 *     IN FORCE   → the only stage that may touch a number.
 *
 * The whole Ugandan tax profession collapses these four into one, calls it "the
 * new law", and publishes it in April. Two of this year's headline taxes died in
 * between — and the alerts were never corrected.
 *
 * SO THE CLOCK'S JOB IS NOT TO COMPUTE. IT IS TO KNOW WHAT IS COMING, WHAT DIED,
 * AND WHOSE NUMBERS MOVE ON THE DAY A NOTICE LANDS.
 *
 * 🔑 AND IT NEEDS NO PERSONAL DATA. It holds RULES, not people. So it can ship
 *    while the PDPO registration is still in the post — which is why it is the
 *    first foundation to build.
 * ─────────────────────────────────────────────────────────────────────────────
 */



// ═════════════════════════════════════════════════════════════════════════════
// THE LEDGER OF WHAT IS COMING — AND WHAT DIED
//
// Every entry is a change that is NOT currently computing, and the reason why.
// This is the list nobody in Uganda maintains.
// ═════════════════════════════════════════════════════════════════════════════

const WATCHLIST = [
  {
    id: 'UG.SEVERANCE.2025',
    title: 'Severance standardised at one month per year worked',
    instrument: 'Employment (Amendment) Act 2025',
    stage: STAGE.ASSENTED,
    assentedOn: '2026-04-29',
    commencementGazettedOn: null,
    affects: ['trueCostOfEmployee'],
    whoCares: 'every employer in Uganda',
    theGap: 'Your contract probably accrues nothing. The Act would require one month\'s salary per year worked — possibly including service ALREADY worked.',
    alsoLands: [
      'SICK LEAVE rewritten: 2 months at full pay, then 4 at half pay (replacing the 3-month regime).',
      'A missed PRE-DISMISSAL HEARING becomes an automatic 4 weeks\' net pay, whether or not the dismissal was justified.',
      'UNFAIR DISMISSAL award doubles: 4 → 8 weeks\' wages.',
      'PROBATION notice rises from 7 days to ONE MONTH.',
      'CASUAL WORKERS: no continuous casual employment beyond 6 months, and re-hiring does not reset the clock.',
    ],
    openQuestions: [
      'WHEN does it commence? Nobody knows. The Minister has not gazetted it.',
      'Does it bite RETROSPECTIVELY on service already worked? No commentary addresses this. For a ten-year employee it is the difference between a small liability and a large one.',
      'Is the base "salary" or "GROSS salary"? The 2023 Bill said gross. Firms reporting the enacted Act say salary. On a package with allowances those differ materially.',
    ],
    watchFor: 'A commencement notice in the Uganda Gazette, signed by the Minister of Gender, Labour and Social Development.',
  },
  {
    id: 'UG.CIT.MINIMUMTAX.2026',
    title: '0.5% minimum tax on companies carrying losses beyond 7 years',
    instrument: 'Income Tax (Amendment) Bill 2026, Clause 8',
    stage: STAGE.BILL,
    outcome: 'DELETED_ON_THE_FLOOR',
    killedOn: '2026-04-23',
    evidence: 'Committee of the Whole House, 23 April 2026. MP Dicksons Kateshumbwa: it "sends the wrong signal to investors". Speaker Anita Among: "after seven years of losses, what exactly are you taxing?" The Minister conceded. The House voted to delete Clause 8. KPMG\'s post-passage summary does not list it.',
    stillPublishedAsLawBy: ['MMAKS Advocates', 'Crowe', 'mrt.tax', 'Global Law Experts'],
    weShippedIt: true,
    affects: ['corporateIncomeTax'],
    whoCares: 'every company carrying forward losses',
  },
  {
    id: 'UG.STAMPDUTY.TRANSFER3PCT.2026',
    title: 'Stamp duty on transfers doubled from 1.5% to 3%',
    instrument: 'Stamp Duty (Amendment) Bill 2026, Schedule 2 item 63(a)',
    stage: STAGE.BILL,
    outcome: 'REJECTED_ON_THE_FLOOR',
    killedOn: '2026-04-21',
    evidence: 'Parliament of Uganda news release, 21 April 2026: "Parliament passed the Stamp Duty (Amendment) Bill, 2026, REJECTING PROPOSED INCREASES IN TAXES ON LAND AND MOTORCYCLE TRANSFERS while approving new measures on motor vehicle transactions."',
    stillPublishedAsLawBy: ['MMAKS Advocates', 'CEO East Africa', 'Global Law Experts', 'mrt.tax'],
    weShippedIt: false,
    affects: ['stampDuty'],
    whoCares: 'anyone buying land or shares',
    worthOnA500mProperty: 7_500_000,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// THE THREE JOBS
// ═════════════════════════════════════════════════════════════════════════════

/** 1. WARN. What is coming, what died, and what is merely claimed. */
function watchlist(today = new Date()) {
  const pending = WATCHLIST.filter((w) => w.stage === STAGE.ASSENTED || w.stage === STAGE.PASSED);
  const dead    = WATCHLIST.filter((w) => w.outcome && w.outcome.includes('FLOOR'));

  return {
    ok: true, refused: false,
    result: pending.length,
    label: 'Ugandan tax changes that are NOT law — and what everyone is telling you',
    verifiedOn: '2026-07-11',

    coming: pending.map((w) => ({
      title: w.title,
      instrument: w.instrument,
      status: w.stage === STAGE.ASSENTED
        ? `SIGNED on ${w.assentedOn} — but NOT IN FORCE. No commencement notice has been gazetted.`
        : 'PASSED by Parliament — not yet signed.',
      whoCares: w.whoCares,
      theGap: w.theGap,
      alsoLands: w.alsoLands || [],
      openQuestions: w.openQuestions || [],
      watchFor: w.watchFor,
    })),

    // 🔴 The list that does not exist anywhere else.
    killedOnTheFloor: dead.map((w) => ({
      title: w.title,
      instrument: w.instrument,
      killedOn: w.killedOn,
      evidence: w.evidence,
      stillPublishedAsLawBy: w.stillPublishedAsLawBy,
      weShippedIt: w.weShippedIt,
      lesson: w.weShippedIt
        ? 'WE SHIPPED THIS. We read the Bill and called it the Act — the exact failure we exist to name in other people.'
        : 'We REFUSED to compute this. We were right.',
    })),

    warnings: [
      { severity: 'high',
        text: `TWO of this year's headline tax changes DIED ON THE FLOOR OF PARLIAMENT — and the alerts announcing them were never corrected. The 0.5% minimum tax on loss-making companies, and the doubling of stamp duty on land transfers. Both are still being published as law by Ugandan firms today. If your adviser quotes you either, they are reading a Bill.` },
      { severity: 'high',
        text: `And ONE law is signed but NOT IN FORCE: the Employment (Amendment) Act 2025, which standardises severance at one month per year worked. The President signed it on 29 April 2026. NO COMMENCEMENT NOTICE HAS BEEN GAZETTED. Every HR guide in Uganda is already reporting it as the law. It is not — yet. And when it lands, you will not be told.` },
      { severity: 'medium',
        text: 'Nobody in Uganda tracks the STAGE a tax is at. Bill, passed, assented, in force — the profession collapses all four into "the new law" and publishes it in April. This page is the only place we know of that keeps them apart.' },
    ],
  };
}

/**
 * 2. QUANTIFY THE GAP.
 * "Your contract accrues nothing. The Act would require 1,000,000 a year for this
 *  employee — and if it bites retrospectively, 10,000,000 for the years already
 *  worked."
 *
 * A number no one else in Uganda can produce, sitting on a balance sheet whether
 * anyone computes it or not.
 */
function exposure({ employees = [] } = {}) {
  const sev = RULES.SEVERANCE_2025;
  const perMonthPerYear = sev.formula.monthsOfSalaryPerYearWorked;

  const lines = employees.map((e) => {
    const annualAccrual = e.monthlyGross * perMonthPerYear;
    const currentAccrual = (e.contractSeveranceMonthsPerYear || 0) * e.monthlyGross;
    const gapPerYear = Math.max(0, annualAccrual - currentAccrual);
    const backBook = annualAccrual * (e.yearsOfService || 0);
    return {
      name: e.name,
      monthlyGross: UGX(e.monthlyGross),
      yearsOfService: e.yearsOfService || 0,
      wouldAccruePerYear: UGX(annualAccrual),
      yourContractAccrues: UGX(currentAccrual),
      unprovidedPerYear: UGX(gapPerYear),
      retrospectiveBackBook: UGX(backBook),
    };
  });

  const totalAnnualGap = lines.reduce((a, l) => a + l.unprovidedPerYear, 0);
  const totalBackBook  = lines.reduce((a, l) => a + l.retrospectiveBackBook, 0);

  return {
    ok: true, refused: false,
    result: UGX(totalAnnualGap),
    currency: 'UGX',
    label: 'Your unprovided exposure to a law that is not yet in force',
    rule: {
      id: sev.id,
      status: sev.status,                 // ← assented_not_commenced
      assentedOn: sev.assentedOn,
      confidence: sev.confidence,
      source: sev.source,
      verifiedOn: sev.verifiedOn,
      displayable: false,                 // 🔴 IT MAY NOT COMPUTE A LIABILITY
    },
    inputs: { employeeCount: employees.length },
    steps: [
      { band: 'Employees',                                       amount: employees.length, rate: null, tax: null },
      { band: 'What the assented Act would accrue, per year',    amount: null, rate: null, tax: UGX(lines.reduce((a, l) => a + l.wouldAccruePerYear, 0)) },
      { band: 'What your contracts accrue today',                amount: null, rate: null, tax: UGX(lines.reduce((a, l) => a + l.yourContractAccrues, 0)) },
      { band: 'UNPROVIDED, per year',                            amount: null, rate: null, tax: UGX(totalAnnualGap) },
      { band: 'And if it bites on service ALREADY worked',       amount: null, rate: null, tax: UGX(totalBackBook),
        note: 'Nobody has answered whether it is retrospective. No commentary addresses it. We will not put a number on your balance sheet that Parliament has not authorised — but you should know it exists.' },
    ],
    lines,
    totals: { unprovidedPerYear: UGX(totalAnnualGap), retrospectiveBackBook: UGX(totalBackBook) },

    // 🔴 THE LINE THAT MAKES THIS HONEST.
    isThisALiability: false,
    whatWeCannotTellYou: [
      'WHETHER YOU OWE ANY OF THIS. The Act is not in force. This is NOT a liability, it is an EXPOSURE — the difference between what you have provided for and what the law will require the day it commences. We will not book it for you and no auditor should.',
      'WHEN it commences. The Minister has not gazetted a notice, and there is no published date.',
      'WHETHER it is retrospective. If it is, the back-book number above lands in one go.',
    ],
    warnings: [
      { severity: 'high',
        text: `${fmt(UGX(totalAnnualGap))} a year is accruing against a law that has been SIGNED and is NOT YET IN FORCE. If it commences and applies to service already worked, ${fmt(UGX(totalBackBook))} lands at once. You will not be given notice: a commencement notice is gazetted, not posted to you.` },
      { severity: 'medium',
        text: 'This is not a provision. It is a number you should be able to say out loud in a board meeting. Booking it would be wrong; not knowing it would be worse.' },
    ],
    disclaimerTier: 4,
  };
}

/**
 * 3. SWITCH.
 * The day a commencement notice is gazetted, ONE rule flips and every affected
 * client moves with it. This function is the switch — and its most important
 * property is that IT REFUSES to flip on anything less than a gazette reference.
 */
function commence({ ruleId, gazettedOn, gazetteReference, verifiedBy }) {
  const rule = Object.values(RULES).find((r) => r.id === ruleId);

  if (!rule) {
    return { ok: false, refused: true, why: `No rule with id ${ruleId}.` };
  }
  if (rule.status !== STAGE.ASSENTED) {
    return { ok: false, refused: true,
      why: `${ruleId} is at stage "${rule.status}". Only an ASSENTED rule can be commenced. A Bill cannot be commenced — it must first survive the floor, and two of them did not this year.` };
  }

  // 🔴 THE GATE. A commencement without a gazette reference is a rumour.
  if (!gazettedOn || !gazetteReference) {
    return { ok: false, refused: true,
      why: 'REFUSED. A commencement notice has a GAZETTE REFERENCE — a number, a volume, a date. Without one you are asking us to make a law out of a rumour, and that is precisely how we shipped a tax Parliament had already deleted. Bring the gazette.',
      whatWeNeed: ['The date the notice was gazetted', 'The Uganda Gazette reference (No., Vol., date)', 'Who verified it'],
    };
  }

  return {
    ok: true, refused: false,
    label: `${ruleId} may now compute`,
    change: {
      ruleId,
      from: STAGE.ASSENTED,
      to: STAGE.COMMENCED,
      gazettedOn,
      gazetteReference,
      verifiedBy,
      verifiedOn: new Date().toISOString().slice(0, 10),
    },
    affects: (WATCHLIST.find((w) => w.id === ruleId) || {}).affects || [],
    // Every trace ever emitted carries its rule version. So we can name every
    // client advised under the old one — which no Ugandan tax practice can do.
    thenWhat: [
      `Set status: "${STAGE.COMMENCED}" and effectiveFrom: "${gazettedOn}" on ${ruleId} in engine/rules.js.`,
      'Add the gazette reference to rule.source.gazette. A rule without one may not compute.',
      'Run the tests. The load-time invariant will refuse to start if the rule is now malformed.',
      'Identify every trace issued under the superseded rule and tell those clients. This is what versioned rules were always for.',
    ],
    notes: [
      'Rules are IMMUTABLE and SUPERSEDED, never edited in place. A return filed for FY2025/26 must still compute under FY2025/26 law, forever.',
    ],
  };
}


/**
 * SELAH — WHICH TAXES APPLY TO ME?
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 THIS IS THE MOST IMPORTANT FILE IN THE PRODUCT.
 *
 * A calculator asks: "how much PAYE do I owe?"
 * That question ALREADY ASSUMES you know PAYE applies to you.
 *
 * But the founding failure of this company was not people getting a number wrong.
 * It was people not knowing the number EXISTED.
 *
 *   Isaac didn't miscalculate his WHT. He didn't know he had any.
 *   MamaOpe didn't miscalculate NSSF. She didn't know it was still accruing.
 *   The TCC wasn't refused over a number. It was refused over a return
 *     a director didn't know he had to file.
 *
 * "Ignorance by individuals" — the founder's own words.
 *
 * So this file does not compute tax. It answers three questions that come BEFORE
 * the tax:
 *
 *     WHICH taxes apply to me?
 *     WHY do they apply to ME, specifically?
 *     WHEN are they due — and what happens if I miss them?
 *
 * You do not need to know a single tax term to use it. You answer questions
 * about your life. Selah tells you what that means.
 * ─────────────────────────────────────────────────────────────────────────────
 */


// ═════════════════════════════════════════════════════════════════════════════
// WHEN — real dates, not "monthly"
//
// "Due monthly" is useless to someone who has never filed. They need a DATE.
// ═════════════════════════════════════════════════════════════════════════════

/** Uganda's default tax year runs 1 July → 30 June. */
function taxYear(today = new Date()) {
  const y = today.getFullYear();
  const startYear = today.getMonth() >= 6 ? y : y - 1; // month 6 = July
  return {
    start: new Date(startYear, 6, 1),
    end: new Date(startYear + 1, 5, 30),
    label: `FY${startYear}/${String(startYear + 1).slice(2)}`,
  };
}

const D = (y, m, d) => new Date(y, m, d);
const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const daysUntil = (d, today = new Date()) => Math.ceil((d - today) / 86_400_000);

/** The 15th of next month — PAYE, WHT, NSSF, VAT all land here. */
function next15th(today = new Date()) {
  const d = D(today.getFullYear(), today.getMonth() + 1, 15);
  return d <= today ? D(today.getFullYear(), today.getMonth() + 2, 15) : d;
}

/** LST — 31 October, to your LOCAL AUTHORITY. Not URA. */
function nextLst(today = new Date()) {
  const d = D(today.getFullYear(), 9, 31);
  return d < today ? D(today.getFullYear() + 1, 9, 31) : d;
}

/** The final return — last day of the 6th month after year end. */
function nextFinalReturn(today = new Date()) {
  const d = D(today.getFullYear(), 11, 31); // 31 December
  return d < today ? D(today.getFullYear() + 1, 11, 31) : d;
}

/** Provisional tax — months 3/6/9/12 (individuals) or 6/12 (companies) of the tax year. */
function nextProvisional(isCompany, today = new Date()) {
  const ty = taxYear(today);
  const months = isCompany ? [11] : [8, 11, 2, 5]; // Dec | Sep, Dec, Mar, Jun
  const candidates = [
    D(ty.start.getFullYear(), 8, 30),   // 30 Sep
    D(ty.start.getFullYear(), 11, 31),  // 31 Dec
    D(ty.end.getFullYear(), 2, 31),     // 31 Mar
    D(ty.end.getFullYear(), 5, 30),     // 30 Jun
  ].filter((_, i) => isCompany ? (i === 1 || i === 3) : true)
   .filter((d) => d > today);
  return candidates[0] || D(ty.end.getFullYear() + 1, 8, 30);
}

// ═════════════════════════════════════════════════════════════════════════════
// THE CATALOGUE
//
// Each entry says, in plain language a person can act on:
//   what   — what this tax actually is
//   why    — WHY IT APPLIES TO YOU, built from your own answers
//   when   — the real date
//   miss   — what happens if you don't
// ═════════════════════════════════════════════════════════════════════════════

function buildObligations(a, today = new Date()) {
  const out = [];
  const ty = taxYear(today);
  const add = (o) => out.push(o);

  // ── EMPLOYMENT ────────────────────────────────────────────────────────────
  if (a.hasJob) {
    add({
      key: 'paye_employee', name: 'PAYE', who: 'you',
      what: 'Income tax on your salary. Your employer takes it out of your pay before you see it and sends it to URA on your behalf.',
      why: 'You earn a salary from an employer. PAYE is deducted from every payslip.',
      when: 'Your employer must remit it by the 15th of the following month.',
      nextDue: next15th(today),
      yourJob: 'Nothing to file — but CHECK IT. Your employer may be using the wrong bands.',
      miss: 'If your employer under-deducts, URA can come after them — and in some cases, after you.',
      severity: 'check',
      rule: RULES.PAYE_RESIDENT_2026,
      calc: 'paye',
      alert: "The bands changed on 1 July 2026. URA's own website still shows the old ones. If your employer copied URA's site, you are being over-deducted.",
    });
    add({
      key: 'nssf_employee', name: 'NSSF', who: 'you',
      what: 'Your retirement savings. 5% comes out of your pay; your employer adds 10% on top. It is not a tax — it is your money.',
      why: 'You are employed. Every employer must contribute, no matter how few staff they have.',
      when: 'Your employer must remit it by the 15th of the following month.',
      nextDue: next15th(today),
      yourJob: 'Check your NSSF statement. Money deducted from you but never remitted is a common and silent failure.',
      miss: 'If your employer does not remit, the money is simply not there when you retire.',
      severity: 'check',
      rule: RULES.NSSF_2026, calc: 'paye',
    });
  }

  // ── CONSULTING / FREELANCE ────────────────────────────────────────────────
  if (a.consults) {
    add({
      key: 'wht_credits', name: 'Withholding tax — money owed TO you', who: 'you',
      what: 'When a government body or a big company pays you, they take 6% off and send it to URA. THAT 6% IS NOT A COST. It is tax you have already paid.',
      why: 'You do consulting work. Your clients almost certainly withhold 6% from every invoice.',
      when: 'You claim it back on your annual return — but ONLY if you hold the certificate.',
      nextDue: nextFinalReturn(today),
      yourJob: '🔑 COLLECT YOUR CERTIFICATES. Every single one. No certificate = no credit = you pay tax twice on the same money.',
      miss: 'You pay tax twice. This is how one Ugandan consultant lost UGX 70,000,000 over five years without noticing.',
      severity: 'money_owed_to_you',
      rule: RULES.WHT_2026, calc: 'wht',
      alert: 'This is the single most common way Ugandan consultants lose money. Most never collect the certificates at all.',
    });
    add({
      key: 'income_tax_self', name: 'Income tax on your consulting profit', who: 'you',
      what: 'Tax on what you earn from consulting, after deducting your genuine business expenses.',
      why: 'You earn business income as an individual. It is taxed at the same rates as a salary — but nobody deducts it for you.',
      when: `Final return by ${fmtDate(nextFinalReturn(today))}. And provisional tax in four instalments during the year.`,
      nextDue: nextProvisional(false, today),
      yourJob: 'File a return. Deduct your genuine expenses. Claim your WHT credits.',
      miss: 'Interest at 2% a MONTH, compounding. A UGX 4,000,000 arrear becomes UGX 13,124,123 in five years.',
      severity: 'must_file',
      rule: RULES.PAYE_RESIDENT_2026, calc: 'paye',
      alert: 'A CONSULTANT IS NOT A SMALL TRADER. Professional services are EXCLUDED from the simple turnover-based presumptive tax. You are taxed on PROFIT, and you must keep records.',
    });
  }

  // ── SMALL TRADING BUSINESS ────────────────────────────────────────────────
  if (a.trades && !a.isProfessional) {
    const t = a.turnover || 0;
    if (t < RULES.PRESUMPTIVE_2020.ceiling) {
      add({
        key: 'presumptive', name: 'Presumptive tax (small business tax)', who: a.isBusiness ? 'your business' : 'you',
        what: 'A simple, FINAL tax based on your SALES — not your profit. No deductions, no complicated accounts.',
        why: t <= 10_000_000
          ? `Your turnover is under UGX 10,000,000 a year. You pay NOTHING on your business income.`
          : `Your turnover is UGX ${fmt(t)} a year — under the UGX 150,000,000 ceiling — so you fall into the simple small-business regime.`,
        when: `Once a year, with your return by ${fmtDate(nextFinalReturn(today))}.`,
        nextDue: nextFinalReturn(today),
        yourJob: t <= 10_000_000
          ? 'Still get a TIN and file. Nil tax is not the same as no obligation.'
          : '🔑 KEEP RECORDS. With records you pay a small percentage. Without them you pay a flat amount that is usually MUCH higher.',
        miss: 'URA raises an assessment against you — their number, not yours.',
        severity: t <= 10_000_000 ? 'nil' : 'must_file',
        rule: RULES.PRESUMPTIVE_2020, calc: 'presump',
        alert: 'URA does NOT calculate this for you. You type the amount into the portal yourself, from the brackets. There is no validation. Type too little and you attract an assessment.',
      });
    }
  }

  // ── COMPANY ───────────────────────────────────────────────────────────────
  if (a.isBusiness && (a.isProfessional || (a.turnover || 0) >= RULES.PRESUMPTIVE_2020.ceiling)) {
    add({
      key: 'cit', name: 'Corporation tax', who: 'your business',
      what: '30% of your PROFIT — that is, your income after all your genuine allowable expenses.',
      why: a.isProfessional
        ? 'You provide professional services. Professional services are EXCLUDED from the simple small-business regime, whatever your turnover. You are taxed on profit.'
        : `Your turnover is UGX ${fmt(a.turnover)} — at or above the UGX 150,000,000 ceiling. You are taxed on profit, not turnover.`,
      when: `Final return by ${fmtDate(nextFinalReturn(today))}. Provisional tax in two instalments during the year.`,
      nextDue: nextProvisional(true, today),
      yourJob: 'Keep proper books. Every deductible expense you fail to record is money you give away.',
      miss: 'Interest at 2% a month, compounding. And after 7 loss-making years you pay a 0.5% minimum tax on GROSS income regardless.',
      severity: 'must_file',
      rule: RULES.CIT_2026, calc: 'entity',
    });
  }

  // ── EMPLOYER ──────────────────────────────────────────────────────────────
  if (a.hasEmployees) {
    add({
      key: 'paye_employer', name: 'PAYE — as an employer', who: 'your business',
      what: "Income tax you must deduct from your staff's pay and send to URA on their behalf.",
      why: 'You have employees. The law makes YOU responsible for deducting and remitting their tax.',
      when: `By the 15th of every month. Next: ${fmtDate(next15th(today))}.`,
      nextDue: next15th(today),
      yourJob: 'Deduct correctly. Remit by the 15th. File the return.',
      miss: '🔴 If you fail to deduct, YOU become personally liable for the tax you should have taken — plus 2% a month interest, from the original due date.',
      severity: 'critical',
      rule: RULES.PAYE_RESIDENT_2026, calc: 'paye',
      alert: 'The bands changed on 1 July 2026. If your payroll still uses the old table, every payslip you issue is wrong.',
    });
    add({
      key: 'nssf_employer', name: 'NSSF — as an employer', who: 'your business',
      what: "5% from your employee + 10% from you. Both must be remitted. The 10% is YOUR cost, on top of their salary.",
      why: 'You have employees. EVERY employer must register — the old five-employee threshold was removed in 2021.',
      when: `By the 15th of every month. Next: ${fmtDate(next15th(today))}.`,
      nextDue: next15th(today),
      yourJob: 'Register with NSSF. Remit monthly. Do not let it drift when payroll changes.',
      miss: '🔴 10% PER MONTH penalty, compounding. And NSSF audits separately from URA — being clean with one tells you nothing about the other.',
      severity: 'critical',
      rule: RULES.NSSF_2026, calc: 'paye',
      alert: 'This one accrues SILENTLY. There is no notification. When a grant ends or payroll is restructured, the obligation does not stop — it just stops being paid.',
    });
    add({
      key: 'lst', name: 'Local Service Tax', who: 'your business',
      what: 'A small annual tax on your employees, deducted by you — but paid to the LOCAL COUNCIL, not URA.',
      why: 'You have employees. You must deduct LST from them and remit it to their local authority.',
      when: `Once a year, by 31 October. Next: ${fmtDate(nextLst(today))}.`,
      nextDue: nextLst(today),
      yourJob: 'Deduct it. Pay your local council — NOT URA.',
      miss: 'A 50% penalty on the amount you failed to remit.',
      severity: 'often_missed',
      rule: RULES.LST_2026, calc: 'paye',
      alert: '🔑 THIS IS THE MOST-MISSED OBLIGATION IN UGANDA — precisely because it is the only one that is not paid to URA. People who are perfectly compliant with URA miss this every single year.',
    });
  }

  // ── WITHHOLDING AGENT ─────────────────────────────────────────────────────
  if (a.paysSuppliers) {
    add({
      key: 'wht_agent', name: 'Withholding tax — money you must deduct', who: 'your business',
      what: 'When you pay a consultant or supplier, you may have to hold back 6% and send it to URA instead of to them.',
      why: 'You pay consultants or suppliers. If you are a designated withholding agent, or you pay a professional, you must withhold.',
      when: `By the 15th of the month after you pay them. Next: ${fmtDate(next15th(today))}.`,
      nextDue: next15th(today),
      yourJob: '🔑 Deduct it. Remit it. AND ISSUE THE CERTIFICATE. All three. Doing the first two without the third harms your supplier and helps nobody.',
      miss: '🔴 If you fail to withhold, YOU pay it yourself. It comes out of your own pocket, and you will not get it back.',
      severity: 'critical',
      rule: RULES.WHT_2026, calc: 'wht',
      alert: 'This is exactly how one Ugandan company reached audit with nothing reconciling: consultants paid in full, all year, with no WHT deducted at all.',
    });
  }

  // ── VAT ───────────────────────────────────────────────────────────────────
  if (a.isBusiness || a.trades) {
    const t = a.turnover || 0;
    const q = a.bestQuarter || 0;
    const mustVat = t > RULES.VAT_2026.annualThreshold || q > RULES.VAT_2026.annualThreshold / 4;
    if (mustVat) {
      add({
        key: 'vat', name: 'VAT', who: 'your business',
        what: '18% that you add to your prices, collect from your customers, and pass to URA. IT IS NOT YOUR MONEY. You are just holding it.',
        why: t > RULES.VAT_2026.annualThreshold
          ? `Your turnover of UGX ${fmt(t)} is above the UGX 300,000,000 registration threshold.`
          : `You made UGX ${fmt(q)} in three consecutive months — above the UGX 75,000,000 quarterly trigger. THIS LIMB BITES FIRST, even though your annual turnover is below 300m.`,
        when: `By the 15th of every month. Next: ${fmtDate(next15th(today))}.`,
        nextDue: next15th(today),
        yourJob: 'Register. Charge 18%. File monthly. Ring-fence the money — do not spend it.',
        miss: '🔴 2% a month, COMPOUNDING. VAT is the one that compounds. And a business that spends collected VAT as revenue builds a liability it cannot see.',
        severity: 'critical',
        rule: RULES.VAT_2026, calc: 'vat',
      });
    } else if (t > 0) {
      add({
        key: 'vat_watch', name: 'VAT — not yet, but watch it', who: 'your business',
        what: 'You do not have to register for VAT yet.',
        why: `Your turnover of UGX ${fmt(t)} is below the UGX 300,000,000 threshold, and you have not exceeded UGX 75,000,000 in any three consecutive months.`,
        when: 'You must register within 20 days of the END of any three months in which you exceed UGX 75,000,000 — OR at the START of a quarter you EXPECT to exceed it.',
        nextDue: null,
        yourJob: 'Watch the QUARTERLY trigger, not just the annual one. It bites first.',
        miss: 'Registering late means paying VAT you never charged your customers. It comes out of your margin.',
        severity: 'watch',
        rule: RULES.VAT_2026, calc: 'vat',
        alert: 'Almost everyone in Uganda still thinks the threshold is 150m and the quarterly trigger is 37.5m. Both changed on 1 July 2026. PwC\'s own published guidance still has it wrong.',
      });
    }
  }

  // ── RENTAL ────────────────────────────────────────────────────────────────
  if (a.rentsOutProperty) {
    add({
      key: 'rental', name: 'Rental income tax', who: a.isBusiness ? 'your business' : 'you',
      what: a.isBusiness
        ? '30% of your rental profit. You may deduct expenses — but only up to HALF your rental income.'
        : '12% of your rental income above UGX 2,820,000 a year.',
      why: 'You earn rent from property. This is taxed separately from your other income.',
      when: `With your annual return, by ${fmtDate(nextFinalReturn(today))}.`,
      nextDue: nextFinalReturn(today),
      yourJob: 'Declare it. Rent is one of the easiest things for URA to find — the tenant is a witness.',
      miss: 'Interest at 2% a month, plus an assessment.',
      severity: 'must_file',
      rule: RULES.RENTAL_2026, calc: null,
      alert: 'The UGX 2,820,000 rental threshold did NOT move when the PAYE threshold moved to 4,020,000 on 1 July 2026. They used to be the same number. They are not any more.',
    });
  }

  // ── SELLING TO GOVERNMENT ─────────────────────────────────────────────────
  if (a.sellsToGovernment) {
    add({
      key: 'tcc', name: 'Tax Clearance Certificate', who: a.isBusiness ? 'your business' : 'you',
      what: 'A certificate from URA saying you are tax-compliant. Without it you cannot supply Government — it is a legal requirement, not a formality.',
      why: 'You supply, or want to supply, Government. TPCA s.50(3) requires a TCC.',
      when: 'Before you bid. Allow at least a week — and much longer if your ledger needs reconciling.',
      nextDue: null,
      yourJob: '🔑 CHECK YOUR DIRECTORS. A spotless company is refused a certificate if ONE DIRECTOR has not filed their OWN personal return.',
      miss: 'You lose the tender. And you usually find out at the worst possible moment.',
      severity: 'critical',
      rule: RULES.TCC_2026, calc: 'tcc',
      alert: 'NSSF is a SEPARATE document from the URA certificate. You can hold a valid TCC and still lose the bid on an NSSF certificate you did not know you needed.',
    });
  }

  // ── THE EXEMPTION ─────────────────────────────────────────────────────────
  if (a.newBusiness) {
    add({
      key: 'startup_exemption', name: '🔑 You may owe NOTHING for three years', who: a.isBusiness ? 'your business' : 'you',
      what: 'A total exemption from income tax for the first three years, for a new business started by a citizen.',
      why: 'You told us your business was established after 1 July 2025. If your registered capital is under UGX 500,000,000, and neither you nor a relative has claimed this before, you may owe no income tax at all.',
      when: 'It is SELF-ASSESSED. There is no application and no certificate. But you must still FILE.',
      nextDue: nextFinalReturn(today),
      yourJob: 'Check the four conditions. File your returns anyway — filing is one of the conditions.',
      miss: 'You pay tax you never owed. Nobody will tell you.',
      severity: 'money_owed_to_you',
      rule: RULES.STARTUP_EXEMPTION, calc: 'exempt',
      alert: 'This exemption is NOT on URA\'s own exemptions page, and NOT in PwC\'s tax summary. We found it in the gazette. How many Ugandan businesses paid income tax last year that they did not owe?',
    });
  }

  // ── EVERYONE ──────────────────────────────────────────────────────────────
  add({
    key: 'tin', name: 'A TIN', who: a.isBusiness ? 'your business' : 'you',
    what: 'Your Taxpayer Identification Number. Nothing else can happen without it.',
    why: 'Everyone who earns income in Uganda needs one. It is free.',
    when: 'Before anything else.',
    nextDue: null,
    yourJob: a.isBusiness
      ? 'Register with URSB first, then get the company TIN — you will need EVERY DIRECTOR\'S TIN to do it.'
      : 'Register on ura.go.ug with your National ID. It is free and it takes minutes.',
    miss: 'Without a TIN you cannot file, cannot get a certificate, and cannot legally be paid by many customers.',
    severity: 'foundation',
    rule: null, calc: null,
  });

  // Nearest deadline first; undated obligations last.
  out.sort((x, y) => {
    if (!x.nextDue && !y.nextDue) return 0;
    if (!x.nextDue) return 1;
    if (!y.nextDue) return -1;
    return x.nextDue - y.nextDue;
  });

  return { taxYear: ty, obligations: out, today };
}

// ═════════════════════════════════════════════════════════════════════════════
// THE QUESTIONS
//
// Plain. No tax words. Nobody has to know what "presumptive" means to answer.
// ═════════════════════════════════════════════════════════════════════════════

const QUESTIONS = [
  { key: 'who',               q: 'Who are you asking for?',                                     type: 'choice',
    options: [{ v: 'me', label: 'Myself' }, { v: 'business', label: 'My business' }] },
  { key: 'hasJob',            q: 'Do you earn a salary from an employer?',                      type: 'bool', showIf: (a) => a.who === 'me' },
  { key: 'consults',          q: 'Do you do consulting, freelance or professional work?',       type: 'bool', showIf: (a) => a.who === 'me' },
  { key: 'trades',            q: 'Do you buy and sell things, or run a shop or trade?',         type: 'bool' },
  { key: 'isProfessional',    q: 'Is your business a professional practice?',                   type: 'bool',
    hint: 'Medical, dental, engineering, architectural, accounting, legal, or construction.',
    showIf: (a) => a.who === 'business' },
  { key: 'hasEmployees',      q: 'Do you pay anyone a salary?',                                 type: 'bool',
    hint: 'Even one person counts.', showIf: (a) => a.who === 'business' },
  { key: 'paysSuppliers',     q: 'Do you pay consultants, contractors or suppliers?',           type: 'bool', showIf: (a) => a.who === 'business' },
  { key: 'turnover',          q: 'Roughly how much do you sell in a year? (UGX)',               type: 'number',
    hint: 'Total sales, before any costs. A rough figure is fine.',
    showIf: (a) => a.who === 'business' || a.trades },
  { key: 'bestQuarter',       q: 'What is the most you have sold in any three months? (UGX)',   type: 'number',
    hint: 'This matters more than you think — it can force you into VAT before your annual turnover does.',
    showIf: (a) => a.who === 'business' || a.trades },
  { key: 'rentsOutProperty',  q: 'Do you earn rent from property?',                             type: 'bool' },
  { key: 'sellsToGovernment', q: 'Do you sell to Government, or want to bid for tenders?',      type: 'bool' },
  { key: 'newBusiness',       q: 'Was your business established after 1 July 2025?',            type: 'bool',
    hint: 'If so, you may owe no income tax at all for three years.',
    showIf: (a) => a.who === 'business' || a.trades },
];

function taxProfile(answers, today = new Date()) {
  const a = { ...answers, isBusiness: answers.who === 'business' };
  const { taxYear: ty, obligations } = buildObligations(a, today);

  const counts = {
    critical:  obligations.filter((o) => o.severity === 'critical').length,
    moneyBack: obligations.filter((o) => o.severity === 'money_owed_to_you').length,
    total:     obligations.length,
  };

  return {
    ok: true,
    answers: a,
    taxYear: ty,
    obligations: obligations.map((o) => ({
      ...o,
      nextDueLabel: o.nextDue ? fmtDate(o.nextDue) : null,
      daysUntil: o.nextDue ? daysUntil(o.nextDue, today) : null,
      rule: o.rule ? { id: o.rule.id, confidence: o.rule.confidence, verifiedOn: o.rule.verifiedOn, source: o.rule.source } : null,
    })),
    counts,
    summary: counts.moneyBack > 0
      ? 'Some of these may mean money coming BACK to you.'
      : counts.critical > 0
        ? 'Some of these can make you personally liable if you get them wrong.'
        : 'Here is everything that applies to you.',
  };
}




global.Selah = {
  taxProfile, QUESTIONS, taxYear, fmtDate, daysUntil,
  paye, netPay, lstFor, presumptive, individualIncomeTaxAnnual,
  soleTraderVsCompany, ENTITY_CROSSOVER, extraction, whtCredits,
  vatRegistration, arrearsProjection, startupExemption, tccReadiness,
  netToGross, trueCostOfEmployee, corporateIncomeTax, presumptiveElection,
  rentalIncome, whtRate, vatAmount, vatDeregistration, voluntaryDisclosure,
  motorVehicleBenefit, housingBenefit, employeeLoanBenefit, terminalBenefits,
  multipleEmployers, capitalAllowances, startupCosts, provisionalTax,
  inputVatRecoverable, advanceTaxTransport, stampDuty,
  loanSchedule, savings, retirement, debtPayoff, emergencyFund, netWorth,
  budget, treasuryYield, mortgageAffordability, businessValuation,
  watchlist, exposure, commence, WATCHLIST,
  fmt, RULES, CONFIDENCE, BLACKLIST
};
})(window);
