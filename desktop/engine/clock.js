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

const { RULES, CONFIDENCE, STAGE } = require('./rules');
const { UGX, fmt } = require('./engine');

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

module.exports = { watchlist, exposure, commence, WATCHLIST };
