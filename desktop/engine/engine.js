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

const { RULES, CONFIDENCE, DISPLAYABLE } = require('./rules');

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

module.exports = {
  paye, netPay, lstFor,
  presumptive,
  individualIncomeTaxAnnual,
  soleTraderVsCompany, ENTITY_CROSSOVER,
  extraction,
  whtCredits,
  vatRegistration,
  arrearsProjection,
  startupExemption,
  tccReadiness,
  assertContiguous,
  fmt,
  RULES, CONFIDENCE,

  // The kernel. Exported so that other calculator modules are built ON the engine
  // rather than BESIDE it. There must only ever be ONE refusal, ONE trace shape,
  // ONE rule block and ONE banded computation in this codebase. The moment a
  // second one exists, they will disagree — and one of them will be wrong.
  UGX, ruleBlock, refuse, computeBanded, composeConfidence,
};
