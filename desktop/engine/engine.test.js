/**
 * SELAH — THE TEST SUITE
 * ─────────────────────────────────────────────────────────────────────────────
 * TAX RULES CANNOT BE HAND-CHECKED. THEY MUST BE EXECUTED.
 *
 * Any number that has not been produced by running the rule and reconciling it
 * against an independent path is not verified. It is just a number someone typed.
 *
 * This suite has already caught a real error: the first draft of the spec
 * asserted PAYE on UGX 15,000,000/month as 5,388,750. Executing the rule returns
 * 4,888,250 — a 500,000 shilling error, made by hand, in a document whose entire
 * purpose is not making that error.
 *
 * Run:  node engine.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const E = require('./engine');
const { RULES, CONFIDENCE } = require('./rules');

let passed = 0, failed = 0;
const failures = [];

function eq(name, actual, expected, tolerance = 0.5) {
  const ok = typeof expected === 'number'
    ? Math.abs(actual - expected) <= tolerance
    : actual === expected;
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else {
    failed++;
    const msg = `  ✗ ${name}\n      expected: ${expected}\n      actual:   ${actual}`;
    failures.push(msg); console.log(msg);
  }
}
function ok(name, cond) { eq(name, !!cond, true); }
function section(t) { console.log(`\n\x1b[1m${t}\x1b[0m`); }

// ═════════════════════════════════════════════════════════════════════════════
section('PAYE — resident, FY2026/27');

eq('335,000/mo → 0',                     E.paye(335_000).result, 0);
eq('410,000/mo → 15,000',                E.paye(410_000).result, 15_000);
eq('485,000/mo → 33,750',                E.paye(485_000).result, 33_750);
eq('1,000,000/mo → 188,250',             E.paye(1_000_000).result, 188_250);
eq('5,000,000/mo → 1,388,250',           E.paye(5_000_000).result, 1_388_250);
eq('15,000,000/mo → 4,888,250',          E.paye(15_000_000).result, 4_888_250);
// ↑ the figure the hand-written spec got WRONG by 500,000. This is why we execute.

section('PAYE — the regression that must never break');
// No resident taxpayer may be worse off under the 2026 rules than the 2025 rules.
// KPMG says no category suffers an increase. If this ever fails, our bands are wrong.
let worseOff = 0;
for (let m = 0; m <= 20_000_000; m += 1_000) {
  const now = E.paye(m).result;
  const then = E.paye(m).comparison.result;
  if (now > then + 0.01) worseOff++;
}
eq('nobody pays MORE under the 2026 bands (swept 0 → 20m in 1,000 steps)', worseOff, 0);

section('PAYE — annual ÷ 12 must equal monthly');
// The statute is ANNUAL. Payroll is MONTHLY. If these two paths disagree,
// one of our tables is wrong and we would never know from either alone.
for (const m of [335_000, 410_000, 485_000, 1_000_000, 5_000_000, 15_000_000]) {
  const monthly = E.paye(m).result;
  const annualDiv12 = E.individualIncomeTaxAnnual(m * 12).result / 12;
  eq(`  ${E.fmt(m)}/mo: monthly path = annual path`, annualDiv12, monthly, 1);
}

section('PAYE — the refusal');
const nr = E.paye(1_000_000, 'non-resident');
ok('non-resident → REFUSES', nr.refused === true);
ok('non-resident → returns NO number', nr.result === null);
ok('non-resident → confidence F', nr.rule.confidence === CONFIDENCE.F);
ok('non-resident → explains why, in full', nr.refusal.why.length >= 3);
ok('non-resident → says what we are doing about it', !!nr.refusal.whatWeAreDoing);

// ═════════════════════════════════════════════════════════════════════════════
section('Presumptive tax — all five bands');

eq('9,000,000 → 0',                             E.presumptive(9_000_000, true).result, 0);
eq('20,000,000 with records → 40,000',          E.presumptive(20_000_000, true).result, 40_000);
eq('20,000,000 no records → 80,000',            E.presumptive(20_000_000, false).result, 80_000);
eq('40,000,000 with records → 130,000',         E.presumptive(40_000_000, true).result, 130_000);
eq('65,000,000 with records → 270,000',         E.presumptive(65_000_000, true).result, 270_000);
// ↑ THE BAND THAT WAS MISSING from the founder's notes AND from most published
//   Ugandan tax tables. A business here would have been computed with no rule.
eq('65,000,000 no records → 400,000',           E.presumptive(65_000_000, false).result, 400_000);
eq('120,000,000 with records → 640,000',        E.presumptive(120_000_000, true).result, 640_000);
// ↑ NOT 840,000. It is 360,000 + 0.7% of the excess over 80m — not a flat 0.7%.

section('Presumptive — band continuity (no cliffs, no gaps)');
for (const b of [30_000_000, 50_000_000, 80_000_000]) {
  const lo = E.presumptive(b, true).result;
  const hi = E.presumptive(b + 1, true).result;
  eq(`  continuous at ${E.fmt(b)}`, hi, lo, 1);
}

section('Presumptive — the exclusions and the edge case');
const consultant = E.presumptive(40_000_000, true, true);
ok('a CONSULTANT is EXCLUDED (s.4(8))', consultant.excluded === true);
ok('  ...and is given no number', consultant.result === null);
ok('exactly 150,000,000 → ORDINARY regime, not presumptive', E.presumptive(150_000_000, true).outOfRegime === true);
ok('149,999,999 → still presumptive', E.presumptive(149_999_999, true).result > 0);

// ═════════════════════════════════════════════════════════════════════════════
section('The entity crossover — sole trader vs company');

eq('the crossover is exactly 133,410,000', E.ENTITY_CROSSOVER, 133_410_000);
const atX = E.soleTraderVsCompany(133_410_000);
eq('  at the crossover, both routes cost the same',
   atX.options[0].tax, atX.options[1].tax, 1);
ok('below it, the SOLE TRADER pays less',  E.soleTraderVsCompany(42_000_000).options[0].tax < E.soleTraderVsCompany(42_000_000).options[1].tax);
ok('above it, the COMPANY pays less',      E.soleTraderVsCompany(250_000_000).options[1].tax < E.soleTraderVsCompany(250_000_000).options[0].tax);
eq('at 42m profit, sole trader tax = 11,259,000', E.soleTraderVsCompany(42_000_000).options[0].tax, 11_259_000);

// ═════════════════════════════════════════════════════════════════════════════
section('Extraction — salary vs retain vs dividend');

const x = E.extraction(10_000_000);
const salary   = x.options.find(o => o.id === 'salary');
const retain   = x.options.find(o => o.id === 'retain');
const dividend = x.options.find(o => o.id === 'dividend');

eq('salary route:   you keep 8,341,000',   salary.youKeep,   8_341_000);
eq('retain route:   7,000,000 in the co',  retain.youKeep,   7_000_000);
eq('dividend route: you keep 5,950,000',   dividend.youKeep, 5_950_000);
eq('dividend effective rate = 40.5%',      dividend.effectiveRate, 0.405, 0.001);
ok('DIVIDENDS ARE THE WORST ROUTE',        dividend.youKeep < retain.youKeep && dividend.youKeep < salary.youKeep);
ok('every option states what it REQUIRES OF YOU (the GAAR guardrail)',
   x.options.every(o => typeof o.requiresOfYou === 'string' && o.requiresOfYou.length > 0));
ok('every option states its COSTS',        x.options.every(o => Array.isArray(o.costs)));
ok('we say what we CANNOT tell them',      x.whatWeCannotTellYou.length >= 3);
ok('the GAAR test is present, verbatim',   x.theTest.includes('to save tax'));

// ═════════════════════════════════════════════════════════════════════════════
section('WHT — the Isaac engine');

const isaac = E.whtCredits({
  invoiced: 60_000_000, rateKey: 'professional_fees', residence: 'resident',
  certificatesExpected: 11, certificatesHeld: 4,
});
eq('6% of 60,000,000 withheld → 3,600,000', isaac.credits.withheld, 3_600_000);
eq('  7 certificates missing',              isaac.credits.certificatesMissing, 7);
eq('  claimable with 4 of 11 held',         isaac.credits.claimable, Math.round(3_600_000 * 4 / 11), 1);
ok('  the rest is AT RISK',                 isaac.credits.atRisk > 2_000_000);
ok('  we warn, loudly',                     isaac.warnings.some(w => w.severity === 'high'));
ok('  and we offer the chase',              isaac.nextAction.product === 'wht_chase');

// ═════════════════════════════════════════════════════════════════════════════
section('VAT — the trigger that auto-scales, and the trap PwC got wrong');

const v1 = E.vatRegistration({ annualTurnover: 160_000_000, bestQuarterTurnover: 80_000_000 });
ok('160m/yr with an 80m quarter → MUST REGISTER', v1.mustRegister === true);
ok('  ...because the QUARTERLY limb bites first', v1.reasons.some(r => r.includes('three consecutive months')));
eq('  the quarterly trigger is 75,000,000 (300m ÷ 4)', v1.steps[1].amount, 75_000_000);

const v2 = E.vatRegistration({ annualTurnover: 260_000_000, bestQuarterTurnover: 65_000_000 });
ok('260m/yr → NOT required to register', v2.mustRegister === false);
ok('260m/yr → CANNOT deregister either', v2.deregistration.canDeregister === false);
ok('260m/yr → STUCK. Below the threshold, above the 75% deregistration limb.', v2.deregistration.stuck === true);
eq('  the deregistration annual limb is 225,000,000 (75% of 300m), NOT 300m',
   v2.deregistration.annualLimb, 225_000_000);
// ↑ PwC's published guidance says businesses under 300m can deregister.
//   PwC is wrong on the statute. There is a live population of Ugandan businesses
//   sitting in this gap being told by their accountants that they can come off VAT.

const v3 = E.vatRegistration({ annualTurnover: 50_000_000, bestQuarterTurnover: 10_000_000, expectedNextQuarter: 90_000_000 });
ok('the FORWARD-LOOKING limb bites too (s.7(1)(b))', v3.mustRegister === true);

// ═════════════════════════════════════════════════════════════════════════════
section('Arrears — the mathematics of silence');

const a = E.arrearsProjection({ principal: 4_000_000, monthsOverdue: 60, compounds: true });
eq('UGX 4m, 5 years overdue, compounding → 13,124,123', a.result, 13_124_123, 1);
// ↑ NOT 11m. Our own copy said 11m and was WRONG. 4,000,000 x 1.02^60 = 13,124,123.
//   It more than TRIPLES. Being wrong about our own headline number is unforgivable.
ok('  2%/month compounding ≈ 26.8% a year', Math.abs(a.projection.annualisedRate - 0.268) < 0.005);
ok('  and we tell them the CURE', !!a.theCure);
ok('  ...worth the whole interest balance', a.theCure.worth === a.result - 4_000_000);
ok('  ...and that interest does NOT stop while you dispute (URA v Airtel)',
   a.warnings.some(w => w.text.includes('Airtel')));

// ═════════════════════════════════════════════════════════════════════════════
section('The three-year startup exemption');

const qualifies = E.startupExemption({
  establishedAfter1Jul2025: true, eacCitizenOwnedAtLeast51pct: true,
  registeredCapital: 100_000_000, priorBenefitBySelfOrRelative: false, willFileReturns: true,
});
ok('a clean citizen startup QUALIFIES', qualifies.qualifies === true);
ok('  headline: no income tax for three years', qualifies.headline.includes('three years'));
ok('  we flag that a RELATIVE\'s prior claim could void it',
   qualifies.warnings.some(w => w.text.includes('RELATIVES')));
ok('  we flag that "investment capital" is UNDEFINED',
   qualifies.warnings.some(w => w.text.includes('UNDEFINED')));
ok('  we flag the UNRESOLVED presumptive interaction',
   qualifies.warnings.some(w => w.severity === 'high'));

ok('capital over 500m → does NOT qualify',
   E.startupExemption({ establishedAfter1Jul2025: true, eacCitizenOwnedAtLeast51pct: true,
     registeredCapital: 600_000_000, priorBenefitBySelfOrRelative: false, willFileReturns: true }).qualifies === false);
ok('a relative already claimed → does NOT qualify (s.3 "associate")',
   E.startupExemption({ establishedAfter1Jul2025: true, eacCitizenOwnedAtLeast51pct: true,
     registeredCapital: 100_000_000, priorBenefitBySelfOrRelative: true, willFileReturns: true }).qualifies === false);
ok('the conditions are CUMULATIVE (the gazetted Act says "and"; RSM prints "or")',
   RULES.STARTUP_EXEMPTION.conditionsAreCumulative === true);
ok('there is NO sector restriction — Parliament rejected ICPAU\'s proposal',
   RULES.STARTUP_EXEMPTION.sectorRestriction === null);

// ═════════════════════════════════════════════════════════════════════════════
section('TCC — and the director trap');

const clean = E.tccReadiness({
  profileCurrent: true, companyReturnsFiled: true, companyArrears: 0,
  directors: [{ name: 'A', personalReturnsFiled: true, personalArrears: 0 }],
});
ok('a clean company is READY', clean.ready === true);

const trapped = E.tccReadiness({
  profileCurrent: true, companyReturnsFiled: true, companyArrears: 0,
  directors: [
    { name: 'A', personalReturnsFiled: true,  personalArrears: 0 },
    { name: 'B', personalReturnsFiled: false, personalArrears: 0 },  // ← the trap
  ],
});
ok('SPOTLESS COMPANY + one director\'s unfiled personal return = BLOCKED', trapped.ready === false);
ok('  ...and we name the director', trapped.blockers.some(b => b.key === 'director_returns:B'));
ok('  ...and we quote URA\'s criterion 3 verbatim',
   trapped.blockers.some(b => b.why && b.why.includes('MUST have submitted all their returns')));

const arrearsOnly = E.tccReadiness({
  profileCurrent: true, companyReturnsFiled: true, companyArrears: 0,
  directors: [{ name: 'A', personalReturnsFiled: true, personalArrears: 4_000_000 }],
});
ok('a director\'s ARREARS (not returns) → WARN, do not block (confidence C)',
   arrearsOnly.ready === true && arrearsOnly.warnings.length > 0);

const withMou = E.tccReadiness({
  profileCurrent: true, companyReturnsFiled: true, companyArrears: 12_000_000, hasPaymentPlan: true,
  directors: [{ name: 'A', personalReturnsFiled: true, personalArrears: 0 }],
});
ok('company arrears + an agreed MOU → still READY (URA criterion 5)', withMou.ready === true);

const nssf = E.tccReadiness({
  profileCurrent: true, companyReturnsFiled: true, companyArrears: 0, nssfArrears: 4_000_000,
  directors: [{ name: 'A', personalReturnsFiled: true, personalArrears: 0 }],
});
ok('NSSF arrears do NOT block the TCC...', nssf.ready === true);
ok('  ...but we warn that PPDA lists it SEPARATELY, and the bid still fails (MamaOpe)',
   nssf.warnings.some(w => w.text.includes('MamaOpe')));

// ═════════════════════════════════════════════════════════════════════════════
section('The thresholds that DIVERGED — the errors we are most likely to make');

eq('VAT threshold (300m) ≠ presumptive ceiling (150m)',
   RULES.VAT_2026.annualThreshold !== RULES.PRESUMPTIVE_2020.ceiling, true);
eq('PAYE annual threshold (4,020,000) ≠ rental threshold (2,820,000)',
   4_020_000 !== RULES.RENTAL_2026.individual.threshold, true);
// ↑ Both pairs USED TO BE EQUAL. Every accountant in Uganda still has the old
//   pairing in their head. These are the two errors the engine is most likely
//   to make, which is exactly why they are tested.

// ═════════════════════════════════════════════════════════════════════════════
section('🔴 RULE INTEGRITY — the test that would have caught the bug we shipped');
//
// A deliberate sabotage found this. We reverted the PAYE threshold to the old
// 235,000 — exactly the error URA's own website is making right now — and the
// band table developed a GAP between 235,000 and 335,000.
//
// The engine computed ZERO TAX for everyone in that gap. Silently.
// AND ALL 93 TESTS PASSED, because they only ever tested POINTS.
//
// That is the exact shape of the failure this company exists to prevent: not a
// number that is obviously wrong, but one that is quietly, plausibly wrong.
//
// So the table itself is now the thing under test — and the engine will not even
// LOAD a malformed rule.

function bandsAreContiguous(bands) {
  if (!bands || bands[0].from !== 0) return false;
  for (let i = 0; i < bands.length - 1; i++) {
    if (bands[i].to !== bands[i + 1].from) return false;
    if (bands[i].to <= bands[i].from) return false;
  }
  return true;
}

for (const key of ['PAYE_RESIDENT_2026', 'PAYE_RESIDENT_2012']) {
  const r = RULES[key];
  ok(`${r.id} — bands are CONTIGUOUS (no gap, no overlap)`, bandsAreContiguous(r.bands));
  ok(`${r.id} — bands run to INFINITY (no silent ceiling)`, r.bands[r.bands.length - 1].to === Infinity);
}
ok('presumptive — bands are contiguous', bandsAreContiguous(RULES.PRESUMPTIVE_2020.bands));
ok('LST — bands are contiguous',         bandsAreContiguous(RULES.LST_2026.bands));

// EVERY shilling from 0 to 20m must fall inside EXACTLY ONE PAYE band.
// If a gap ever opens — even a one-shilling gap — this finds it.
let unbanded = 0;
for (let m = 500; m <= 20_000_000; m += 500) {
  const hits = RULES.PAYE_RESIDENT_2026.bands.filter((b) => m > b.from && m <= b.to).length;
  if (hits !== 1) unbanded++;
}
eq('every shilling 0 → 20m falls in EXACTLY ONE band (swept in 500s)', unbanded, 0);

// Every rule must declare its confidence, its source, and the date we checked it.
let undeclared = 0;
for (const r of Object.values(RULES)) {
  if (!r.confidence || !r.verifiedOn || !r.source || !r.source.instrument) undeclared++;
}
eq('every rule declares a CONFIDENCE, a VERIFIED DATE and a SOURCE', undeclared, 0);

// ═════════════════════════════════════════════════════════════════════════════
section('The architecture — every trace is a proof');

const t = E.paye(1_000_000);
ok('a trace carries its RULE ID',        !!t.rule.id);
ok('a trace carries its CONFIDENCE',     !!t.rule.confidence);
ok('a trace carries its SOURCE',         !!t.rule.source.instrument && !!t.rule.source.provision);
ok('a trace carries its EFFECTIVE DATE', !!t.rule.effectiveFrom);
ok('a trace carries its VERIFIED DATE',  !!t.rule.verifiedOn);
ok('a trace carries the WORKING, step by step', t.steps.length >= 3);
ok('a trace carries a COMPARISON to the old law', !!t.comparison);
ok('a trace WARNS that URA\'s own website is wrong',
   t.warnings.some(w => w.evidenceUrl && w.evidenceUrl.includes('ura.go.ug')));
ok('a trace ends with a DOOR', !!t.nextAction);


// ═════════════════════════════════════════════════════════════════════════════
// TIER 1 — the nine calculators added on 11 July 2026
// ═════════════════════════════════════════════════════════════════════════════

const T = require('./tier1');

section('Net-to-gross — the reverse PAYE nobody has');

// The PROPERTY, not a point. netToGross must return the SMALLEST gross whose net
// reaches the target. Sweeping the property is the only honest test here: a
// hand-picked example can be right by luck. A property cannot.
let notMinimal = 0, undershot = 0;
for (let target = 200_000; target <= 12_000_000; target += 137_000) {
  const g = T.netToGross(target).result;
  if (E.netPay(g).result < target) undershot++;
  if (E.netPay(g - 1).result >= target) notMinimal++;
}
eq('the gross always DELIVERS the target net (swept 200k → 12m)', undershot, 0);
eq('and it is the SMALLEST such gross — we never quietly over-gross', notMinimal, 0);

// 🔴 THE DISCONTINUITY. Net pay is NOT continuous in gross: Local Service Tax is
// a STEP, not a rate. Cross a band and net pay FALLS as gross pay RISES. So some
// take-home figures are UNREACHABLE by any salary.
//
// If this test ever fails, someone has "simplified" LST into a rate — and
// netToGross will start returning confident answers to impossible questions.
let nonMonotonic = 0;
for (let g = 100_000; g <= 1_200_000; g += 1_000) {
  if (E.netPay(g + 1_000).result < E.netPay(g).result) nonMonotonic++;
}
ok('net pay is NOT monotonic in gross — the LST steps are real, and we must not hide them', nonMonotonic > 0);

const ntg = T.netToGross(1_000_000);
ok('net-to-gross shows the EMPLOYER what the hire truly costs', ntg.employerView.totalMonthlyCost > ntg.result);
ok('and that it costs well over a shilling to deliver a shilling', ntg.employerView.costPerShillingDelivered > 1.3);
ok('net-to-gross REFUSES for a non-resident, like everything else in the engine',
   T.netToGross(1_000_000, { residence: 'non-resident' }).refused);

// ═════════════════════════════════════════════════════════════════════════════
section('🔴 Confidence laundering — the defect our own tests could not see');

// An INDEPENDENT hand-check of the arithmetic caught this. Our suite could not:
// it was asserting the engine against the engine.
//
// Net pay = gross − PAYE − NSSF − LST.
//   PAYE is confidence A. NSSF is B. LST's BAND AMOUNTS are C.
//
// And netPay stamped the whole answer "A · primary law", because it inherited
// its rule block from PAYE. A confidence-C input was laundering into a
// confidence-A output — on a product whose entire promise is telling you how
// sure we are.
//
// We wrote the law (rules.js, law 3) and broke it three functions later.
eq('LST band amounts are self-declared confidence C', RULES.LST_2026.bandsConfidence, CONFIDENCE.C);
eq('PAYE is confidence A', RULES.PAYE_RESIDENT_2026.confidence, CONFIDENCE.A);

const npc = E.netPay(1_000_000);
eq('a composite trace inherits its WORST input, not its best', npc.rule.confidence, CONFIDENCE.C);
ok('and it NAMES what dragged it down', npc.rule.limitedBy.label.includes('Local Service Tax'));
ok('...listing every rule that fed it', npc.rule.parts.length === 3);
ok('and it hands back the figure with NO unverified input in it',
   npc.certain.netExcludingLst === 1_000_000 - npc.detail.paye.result - npc.detail.employeeNssf);
eq('that figure is confidence B — trustworthy', npc.certain.confidence, CONFIDENCE.B);
ok('and it tells the user, out loud, why the headline is not an A',
   npc.warnings.some((w) => w.text.includes('RATED CONFIDENCE C, NOT A')));

// Drop LST and the answer earns its B back. Confidence is COMPUTED, not decorative.
eq('without LST the composite is B, not C', E.netPay(1_000_000, { lst: false }).rule.confidence, CONFIDENCE.B);
ok('and nothing is limiting it', E.netPay(1_000_000, { lst: false }).rule.limitedBy === null ||
   E.netPay(1_000_000, { lst: false }).rule.limitedBy.confidence === CONFIDENCE.B);

// PAYE alone must still be A. If this fails we have over-corrected and made the
// engine timid, which is its own kind of dishonesty.
eq('PAYE alone is still confidence A — we did not over-correct', E.paye(1_000_000).rule.confidence, CONFIDENCE.A);

section('🔴 Whole shillings — a payslip has no fractions');

// The same independent check found netPay rounding PAYE but subtracting UNROUNDED
// NSSF and LST from it. The net came out with a meaningless fractional part, and
// netToGross could disagree with itself by a shilling depending on which side of
// the rounding it approached from — ALWAYS understating the gross an employer
// must contract for. A rounding error that is unbiased is noise. One that always
// leans the same way is a defect.
let fractional = 0;
for (let g = 100_000; g <= 15_000_000; g += 7_331) {
  const np = E.netPay(g);
  if (!Number.isInteger(np.resultExact)) fractional++;
  if (np.resultExact !== np.result) fractional++;
  // and every line of the payslip must itself be a whole shilling
  if (!Number.isInteger(np.detail.employeeNssf) || !Number.isInteger(np.detail.paye.result)) fractional++;
}
eq('no fractional shilling exists anywhere on a payslip (swept 100k → 15m)', fractional, 0);

// The payslip must reconcile, line by line, to the shilling. Not to a tolerance.
let unreconciled = 0;
for (let g = 200_000; g <= 15_000_000; g += 11_117) {
  const np = E.netPay(g);
  const lstMonthly = Math.round(np.detail.lstAnnual / 12);
  if (g - np.detail.paye.result - np.detail.employeeNssf - lstMonthly !== np.result) unreconciled++;
}
eq('gross − PAYE − NSSF − LST equals net EXACTLY, every time', unreconciled, 0);

eq('and so net-to-gross has one unambiguous answer: 1,379,358', T.netToGross(1_000_000).result, 1_379_358);
ok('which hits the target EXACTLY — no overshoot to explain away', T.netToGross(1_000_000).exact);

section('True cost of an employee — and the law that is SIGNED BUT NOT IN FORCE');

const tc = T.trueCostOfEmployee({ grossMonthly: 1_000_000, yearsOfService: 10 });
eq('statutory cost = 12,000,000 salary + 1,200,000 employer NSSF', tc.statutory.total, 13_200_000);
eq('NSSF loads every salary by exactly 10%', tc.statutory.loading, 0.10, 0.0001);
eq('with no contract terms given, contractual cost is ZERO — not a guess', tc.contractual.total, 0);

// 🔴 THE RULE STATE NOTHING ELSE IN UGANDA MODELS.
//
// The Employment (Amendment) Act 2025 was ASSENTED on 29 April 2026 and fixes
// severance at one month's salary per year worked. THE COMMENCEMENT DATE HAS NOT
// BEEN GAZETTED — so it is NOT IN FORCE.
//
// Our own UI was already telling users it WAS the law. An earlier draft of this
// calculator insisted it was a myth. Both were confidently wrong in opposite
// directions, which is precisely the failure mode this company exists to kill.
eq('the law IN FORCE fixes NO severance formula — s.89 says it is negotiated',
   RULES.SEVERANCE_2006.formula, null);
eq('the ASSENTED Act fixes one month per year',
   RULES.SEVERANCE_2025.formula.monthsOfSalaryPerYearWorked, 1);
eq('...but its status is ASSENTED, NOT COMMENCED', RULES.SEVERANCE_2025.status, 'assented_not_commenced');
eq('...and it therefore has NO effective date. That null is the fact, not an oversight.',
   RULES.SEVERANCE_2025.effectiveFrom, null);
eq('...and no commencement gazette', RULES.SEVERANCE_2025.commencementGazettedOn, null);

// The number returned must be the law AS IT STANDS. The pending Act must NOT be
// silently baked into it — that would be inventing a liability that does not exist.
eq('the TOTAL uses the law in force only — 13,200,000, no severance', tc.result, 13_200_000);
ok('but the pending Act is priced ALONGSIDE it, not hidden',
   tc.pending.severancePerYear === 1_000_000);
eq('and the retrospective exposure on 10 years of service is quantified',
   tc.pending.ifItBitesRetrospectively, 10_000_000);
eq('an employer accruing NOTHING has a 1,000,000/year unprovided gap', tc.pending.annualExposureGap, 1_000_000);

ok('we say we do not know WHEN it commences',
   tc.whatWeCannotTellYou.some((s) => s.includes('has NOT been gazetted')));
ok('we say we do not know whether it bites RETROSPECTIVELY — nobody has answered this',
   tc.whatWeCannotTellYou.some((s) => s.includes('RETROSPECTIVELY')));
ok('we say we do not know whether the base is SALARY or GROSS SALARY',
   tc.whatWeCannotTellYou.some((s) => s.includes('GROSS SALARY')));
ok('and we warn that every HR guide in Uganda is already reporting it as law',
   tc.warnings.some((w) => w.severity === 'high' && w.text.includes('It is not.')));
ok('the other things that land on the same day are named — sick leave, dismissal, probation',
   tc.pending.alsoChanges.length >= 4);

const tc2 = T.trueCostOfEmployee({ grossMonthly: 1_000_000, severanceMonthsPerYear: 1 });
eq('given YOUR contract\'s figure it accrues it: 13,200,000 + 1,000,000', tc2.result, 14_200_000);
ok('and labels it as YOURS, not the law\'s',
   tc2.contractual.items.some((i) => (i.note || '').includes('The Act in force fixes none')));
eq('an employer ALREADY accruing a month a year has NO exposure gap', tc2.pending.annualExposureGap, 0);
ok('LST is NOT counted as an employer cost — it is the employee\'s tax, merely remitted by you',
   tc.warnings.some((w) => w.text.includes('DEDUCT it from the employee')));

// ═════════════════════════════════════════════════════════════════════════════
section('The commencement invariant — an uncommenced Act may NEVER compute');

// This is a load-bearing rule and it needs a guard. A rule whose commencement is
// not gazetted is NOT LAW. If a future edit gives SEVERANCE_2025 an effectiveFrom
// without a gazette reference, this test fails — and it should.
for (const r of Object.values(RULES)) {
  if (r.status === 'assented_not_commenced') {
    ok(`${r.id} — an uncommenced Act carries NO effective date`, r.effectiveFrom === null);
    ok(`${r.id} — and no commencement gazette`, !r.commencementGazettedOn);
    ok(`${r.id} — and says what ELSE lands on the same day`, Array.isArray(r.alsoChangesOnCommencement));
    ok(`${r.id} — and admits what is still unknown about it`, r.openQuestions.length >= 2);
  }
}

section('🔴 Corporate income tax — and the tax WE INVENTED');

eq('30% of 100,000,000 chargeable = 30,000,000',
   T.corporateIncomeTax({ chargeableIncome: 100_000_000 }).result, 30_000_000);
eq('a loss produces ZERO tax — never a negative one',
   T.corporateIncomeTax({ chargeableIncome: -50_000_000 }).result, 0);

// ═════════════════════════════════════════════════════════════════════════════
// 🔴🔴 THE MOST IMPORTANT TEST IN THIS FILE.
//
// This engine SHIPPED a 0.5% minimum tax on companies carrying losses beyond
// seven years. I built it from Clause 8 of the Income Tax (Amendment) Bill 2026.
// The clause was gazetted and quoted by four Kampala law firms.
//
// PARLIAMENT DELETED IT ON 23 APRIL 2026. It is not law. It never was.
//
// We read the Bill and called it the Act — which is exactly what we accuse URA,
// PwC and Grant Thornton of doing. This test exists so that nobody, ever, quietly
// puts it back.
//
//   A BILL IS NOT AN ACT.
//   A GAZETTED BILL IS NOT AN ACT.
//   A CLAUSE QUOTED BY FOUR LAW FIRMS IS NOT AN ACT.
// ═════════════════════════════════════════════════════════════════════════════
eq('THERE IS NO MINIMUM TAX. The rule must not carry one.', RULES.CIT_2026.minimumTax, null);
eq('a loss-making company with 9 years of losses pays NOTHING — not 0.5% of gross',
   T.corporateIncomeTax({ chargeableIncome: 0, lossBroughtForward: 500_000_000, yearsCarryingLosses: 9 }).result, 0);
ok('and the engine SAYS SO, out loud, to anyone whose adviser told them otherwise',
   T.corporateIncomeTax({ chargeableIncome: 10_000_000 }).warnings
     .some((w) => w.text.includes('Parliament DELETED it')));
ok('no rule anywhere still cites the phantom s.36(6a)',
   !JSON.stringify(RULES).includes('36(6a)'));

section('The loss throttle — s.36(6), which is REAL');

// What actually exists: after 7 years, only HALF the brought-forward loss is
// deductible. The loss is throttled, not taxed. Nobody pays tax on a loss.
eq('the throttle is 50% of the brought-forward loss', RULES.CIT_2026.lossRestriction.deductiblePctOfCarriedLoss, 0.50);
eq('and it bites after SEVEN years', RULES.CIT_2026.lossRestriction.afterYears, 7);

const c3 = T.corporateIncomeTax({ chargeableIncome: 100_000_000, lossBroughtForward: 80_000_000, yearsCarryingLosses: 3 });
eq('3 years of losses: the FULL 80m loss is deducted → 30% × 20m = 6,000,000', c3.result, 6_000_000);
ok('nothing is deferred', c3.losses.deferredToNextYear === 0);

const c9 = T.corporateIncomeTax({ chargeableIncome: 100_000_000, lossBroughtForward: 80_000_000, yearsCarryingLosses: 9 });
eq('9 years of losses: only HALF the loss is deducted → 30% × 60m = 18,000,000', c9.result, 18_000_000);
eq('and 40,000,000 of relief is DEFERRED — not lost', c9.losses.deferredToNextYear, 40_000_000);
ok('the engine warns that the cash tax is higher than the model says',
   c9.warnings.some((w) => w.severity === 'high' && w.text.includes('50% LOSS THROTTLE')));
eq('at exactly 7 years the throttle has NOT yet bitten',
   T.corporateIncomeTax({ chargeableIncome: 100_000_000, lossBroughtForward: 80_000_000, yearsCarryingLosses: 7 }).result, 6_000_000);
ok('and it warns you a year out',
   T.corporateIncomeTax({ chargeableIncome: 100_000_000, lossBroughtForward: 80_000_000, yearsCarryingLosses: 7 })
     .warnings.some((w) => w.text.includes('from the s.36(6) loss throttle')));

section('The presumptive election — and the BREAK-EVEN MARGIN');

const pe = T.presumptiveElection({ turnover: 100_000_000, expenses: 90_000_000 });
eq('presumptive on 100m WITH records = 360,000 + 0.7% of the excess over 80m = 500,000',
   pe.options.find((o) => o.id === 'presumptive').tax, 500_000);

// 🔑 The number nobody in Uganda computes. At the break-even margin the two
// regimes cost exactly the same. We verify it by EXECUTION — feeding the
// break-even profit back through the ORDINARY tax path and checking it lands.
eq('at the break-even PROFIT, ordinary tax equals presumptive tax',
   E.individualIncomeTaxAnnual(pe.breakEven.profit).result, 500_000, 250);
ok('the break-even MARGIN is around 6% — below that, a trader should elect out',
   pe.breakEven.margin > 0.05 && pe.breakEven.margin < 0.07);
ok('at a 10% margin the numbers favour STAYING on presumptive',
   pe.whatTheNumbersFavour.option === 'presumptive');

const peThin = T.presumptiveElection({ turnover: 100_000_000, expenses: 98_000_000 });
ok('at a 2% margin they favour ELECTING OUT', peThin.whatTheNumbersFavour.option === 'elect_out');
ok('and we tell the thin-margin trader exactly what his silence costs him every year',
   peThin.warnings.some((w) => w.severity === 'high' && w.text.includes('written election you have never made')));
ok('a consultant is EXCLUDED by s.4(8) — there is no election to model',
   T.presumptiveElection({ turnover: 50_000_000, expenses: 10_000_000, isProfessional: true }).excluded);
ok('and we ADMIT we do not know whether the election binds future years — nobody does',
   pe.whatWeCannotTellYou.some((s) => s.includes('binds you in future years')));

section('Rental income — and the threshold that did NOT move');

eq('individual: 12% of (10,000,000 − 2,820,000) = 861,600',
   T.rentalIncome({ grossRent: 10_000_000 }).result, 861_600);
eq('the individual gets NO expense deduction — so the answer does not change',
   T.rentalIncome({ grossRent: 10_000_000, expenses: 9_000_000 }).result, 861_600);
eq('at the threshold exactly, no rental tax at all',
   T.rentalIncome({ grossRent: 2_820_000 }).result, 0);

// 🔴 THE TRAP THE ENGINE IS MOST LIKELY TO FALL INTO.
// On 1 July 2026 the PAYE annual threshold moved 2,820,000 → 4,020,000.
// The RENTAL threshold did NOT move. They used to be the same number.
eq('the RENTAL threshold is still 2,820,000', RULES.RENTAL_2026.individual.threshold, 2_820_000);
eq('the PAYE annual threshold is now 4,020,000', RULES.PAYE_RESIDENT_2026.bands[0].to * 12, 4_020_000);
ok('THEY ARE NOT THE SAME NUMBER — and no future edit may merge them',
   RULES.RENTAL_2026.individual.threshold !== RULES.PAYE_RESIDENT_2026.bands[0].to * 12);

const rentCo = T.rentalIncome({ grossRent: 10_000_000, expenses: 8_000_000, isIndividual: false });
eq('company: expenses capped at 50% of rent → 30% × (10m − 5m) = 1,500,000', rentCo.result, 1_500_000);
ok('and it names the 3,000,000 you spent and will never get relief for',
   rentCo.warnings.some((w) => w.severity === 'high' && w.text.includes('DISALLOWED')));

section('WHT rate card — and the gross-up nobody computes');

eq('6% of a 10,000,000 professional fee = 600,000',
   T.whtRate({ paymentType: 'professional_fees', amount: 10_000_000 }).result, 600_000);

// gross = net ÷ (1 − rate).  NOT net × (1 + rate).
// The naive version under-pays the supplier every single time, forever.
const gu = T.whtRate({ paymentType: 'professional_fees', amount: 10_000_000, amountIsNet: true });
eq('to LAND 10,000,000 net at 6%, the invoice must be 10,638,298', gu.steps[1].tax, 10_638_298, 1);
eq('so the WHT is 638,298 — not 600,000', gu.result, 638_298, 1);
ok('the naive 10,600,000 gross-up is WRONG by more than 38,000 on this invoice alone',
   Math.abs(gu.steps[1].tax - 10_600_000) > 38_000);

const bet = T.whtRate({ paymentType: 'betting', amount: 1_000_000 });
ok('a FINAL tax is flagged as final, and is NOT a credit to anyone',
   bet.isFinalTax === true && bet.creditToRecipient === false);
ok('a non-final WHT tells you to ISSUE THE CERTIFICATE — the Isaac failure, seen from the other side of the desk',
   T.whtRate({ paymentType: 'professional_fees', amount: 1_000_000 }).nextAction.product === 'wht_certificate');
ok('royalties have NO resident rate → we REFUSE rather than interpolate one',
   T.whtRate({ paymentType: 'royalties', residence: 'resident', amount: 1_000_000 }).refused);
ok('an unknown payment type → we REFUSE. A guessed withholding rate becomes a PERSONAL liability.',
   T.whtRate({ paymentType: 'vibes', amount: 1_000_000 }).refused);
ok('a confidence-B rate surfaces its own uncertainty instead of hiding it',
   T.whtRate({ paymentType: 'foreign_debt', residence: 'non-resident', amount: 1_000_000 })
     .warnings.some((w) => w.text.includes('confidence B')));
ok('and every rate warns that withholding-agent liability is PERSONAL',
   T.whtRate({ paymentType: 'goods_services', amount: 2_000_000 })
     .warnings.some((w) => w.text.includes('It chases YOU')));

section('VAT — inclusive / exclusive, and the error everyone makes');

const vi = T.vatAmount({ amount: 118_000, isInclusive: true });
eq('the VAT inside 118,000 is 18,000 — that is × 18 ÷ 118, NOT × 18%', vi.result, 18_000);
eq('leaving 100,000 exclusive', vi.exclusive, 100_000);
ok('and we NAME the common error: 18% of the gross would be 21,240',
   vi.warnings.some((w) => w.text.includes('21,240')));

const ve = T.vatAmount({ amount: 100_000 });
eq('18% added to 100,000 = 18,000', ve.result, 18_000);
eq('giving 118,000 inclusive', ve.inclusive, 118_000);
ok('and we say the thing every business forgets: VAT you collect is NOT YOUR MONEY',
   ve.warnings.some((w) => w.text.includes('NOT YOUR MONEY')));

section('VAT deregistration — the 75,000,000-wide trap PwC published wrong');

const dOk = T.vatDeregistration({ last3MonthsTurnover: 50_000_000, last12MonthsTurnover: 200_000_000 });
ok('both limbs pass → you may apply to deregister', dOk.canDeregister === true && dOk.stuck === false);
ok('but we warn that deregistering can make you POORER — you lose input VAT recovery',
   dOk.warnings.some((w) => w.text.includes('POORER')));

// 🔴 THE TRAP. Below the 300m registration threshold. Above the 225m dereg limb.
// Not required to register. Not entitled to deregister. Stuck.
const stuck = T.vatDeregistration({ last3MonthsTurnover: 50_000_000, last12MonthsTurnover: 260_000_000 });
ok('at 260,000,000 you are STUCK — no obligation to register, no right to leave', stuck.stuck === true);
eq('the trap is exactly 75,000,000 wide', stuck.theGap.width, 75_000_000);
eq('its floor is the 225,000,000 deregistration limb — 75% of the threshold', stuck.theGap.from, 225_000_000);
eq('its ceiling is the 300,000,000 registration threshold', stuck.theGap.to, 300_000_000);
ok('and we say plainly, in the product, that PwC is wrong on this in public',
   stuck.warnings.some((w) => w.text.includes('PwC')));
ok('we report limb by limb — quarterly passed, annual failed',
   stuck.limbs.quarterly.passes === true && stuck.limbs.annual.passes === false);

const mustReg = T.vatDeregistration({ last3MonthsTurnover: 90_000_000, last12MonthsTurnover: 350_000_000 });
ok('above 300,000,000 you are not "stuck" — you simply must stay registered',
   mustReg.canDeregister === false && mustReg.stuck === false);

section('Voluntary disclosure — the cure, priced, WITHOUT the false promise');

const vd = T.voluntaryDisclosure({ principal: 4_000_000, monthsOverdue: 60 });
eq('4,000,000 unpaid for five years compounds to 13,124,123', vd.projection.today, 13_124_123, 1);
eq('so the waiver is worth 9,124,123 — the interest, never the tax', vd.result, 9_124_123, 1);
ok('the PRINCIPAL is never waived, and the trace says so on its first line',
   vd.steps[0].note.includes('NEVER waived'));
// 🔴 I TYPED 3,143,674 HERE AND THE SUITE CAUGHT ME. The real figure is
// 3,520,438 — because interest compounds on the BALANCE, not on the principal.
// That is the SECOND hand-written number this suite has caught (the first was
// PAYE on 15,000,000, wrong by 500,000). Both were typed by someone who knew
// the rule and was being careful. Neither survived execution.
//
// It is also the exact error a taxpayer makes when he reassures himself that
// the arrear is "only growing by 2% a month" — and understates the damage by
// 380,000 shillings a year, on a 4,000,000 debt, without noticing.
eq('waiting one more year to decide costs another 3,520,438',
   vd.projection.costOfWaitingOneYear, 3_520_438, 2);

// 🔴 THE HONESTY TEST. The arithmetic is certain. The OUTCOME is a discretion —
// the statute says the Commissioner MAY compound, not MUST. A calculator that
// blurs those two is selling false hope to a frightened person.
ok('we refuse to promise the outcome — "MAY compound" is a discretion, not a right',
   vd.whatWeCannotTellYou.some((s) => s.includes('discretion, not a right')));
ok('and we warn the door may ALREADY be closed if URA has opened an audit',
   vd.whatWeCannotTellYou.some((s) => s.toLowerCase().includes('audit')));
eq('this carries the HIGHEST disclaimer tier', vd.disclaimerTier, 4);

section('Tier 1 — every new calculator is still a PROOF, not a number');

const tier1Traces = [
  ['netToGross',          T.netToGross(1_000_000)],
  ['trueCostOfEmployee',  T.trueCostOfEmployee({ grossMonthly: 1_000_000 })],
  ['corporateIncomeTax',  T.corporateIncomeTax({ chargeableIncome: 10_000_000 })],
  ['presumptiveElection', T.presumptiveElection({ turnover: 100_000_000, expenses: 90_000_000 })],
  ['rentalIncome',        T.rentalIncome({ grossRent: 10_000_000 })],
  ['whtRate',             T.whtRate({ paymentType: 'professional_fees', amount: 1_000_000 })],
  ['vatAmount',           T.vatAmount({ amount: 100_000 })],
  ['vatDeregistration',   T.vatDeregistration({ last3MonthsTurnover: 10_000_000, last12MonthsTurnover: 40_000_000 })],
  ['voluntaryDisclosure', T.voluntaryDisclosure({ principal: 1_000_000, monthsOverdue: 12 })],
];
for (const [name, tr] of tier1Traces) {
  ok(`${name} carries a rule id, a confidence, a source and a verified date`,
     !!tr.rule.id && !!tr.rule.confidence && !!tr.rule.source.instrument && !!tr.rule.verifiedOn);
  ok(`${name} shows its WORKING`, Array.isArray(tr.steps) && tr.steps.length >= 2);
}

// ═════════════════════════════════════════════════════════════════════════════
section('The options invariant — a route is never a recommendation');

// The engine emits TWO legitimate trace shapes and, until this test, nothing
// enforced the second one. A COMPUTATION shows `steps`. An OPTIONS trace shows
// priced routes. `presumptiveElection` shipped with no `steps` at all and the
// architecture test caught it — which is exactly what an architecture test is for.
//
// Every option, in every options-trace, must carry the four fields the
// explainability spec makes mandatory. Without `requiresOfYou` we are giving
// tax advice with no GAAR guardrail. Without `stopsWorkingWhen` we are selling
// a structure without telling anyone when it expires.
const optionTraces = [
  ['soleTraderVsCompany', E.soleTraderVsCompany(42_000_000)],
  ['extraction',          E.extraction(10_000_000)],
  ['presumptiveElection', T.presumptiveElection({ turnover: 100_000_000, expenses: 90_000_000 })],
];
for (const [name, tr] of optionTraces) {
  ok(`${name} offers OPTIONS, never a recommendation`, Array.isArray(tr.options) && tr.options.length >= 2);
  ok(`${name} — every option says HOW IT WORKS`,
     tr.options.every((o) => Array.isArray(o.howItWorks) && o.howItWorks.length > 0));
  ok(`${name} — every option says WHAT IT REQUIRES OF YOU (the GAAR guardrail)`,
     tr.options.every((o) => typeof o.requiresOfYou === 'string' && o.requiresOfYou.length > 0));
  ok(`${name} — every option states its COSTS`,
     tr.options.every((o) => Array.isArray(o.costs)));
  ok(`${name} — every option declares WHEN IT STOPS WORKING`,
     tr.options.every((o) => 'stopsWorkingWhen' in o));
  ok(`${name} — says what we CANNOT tell you`,
     Array.isArray(tr.whatWeCannotTellYou) && tr.whatWeCannotTellYou.length >= 2);
  ok(`${name} — any steer is caveated, and is about NUMBERS, not about you`,
     !tr.whatTheNumbersFavour || typeof tr.whatTheNumbersFavour.caveat === 'string');
}

// 🔴 The bundle-drift check USED TO LIVE HERE, wrapped in `if (fs.existsSync(...))`.
//
// Which meant it ran on my machine (where a bundle happens to sit on disk) and
// SILENTLY SKIPPED inside the Docker verify stage (where it does not yet exist).
// The suite reported 243 tests locally and 242 in the container, and nobody would
// ever have noticed which one went missing.
//
// A TEST THAT SILENTLY SKIPS IS NOT A TEST. IT IS A COMMENT THAT COSTS CPU.
//
// The check now lives in the BUILD STAGE, where the bundle is guaranteed to exist
// and where a failure HALTS THE BUILD instead of quietly passing. Same assertion,
// enforced somewhere it cannot be optional.

// ═════════════════════════════════════════════════════════════════════════════
// TIER 2 — verified against primary law, 11 July 2026
// ═════════════════════════════════════════════════════════════════════════════

const T2 = require('./tier2');
const P  = require('./personal');

section('Motor vehicle benefit — and URA is 9 years stale on its own page');

// (20% × A × B/C) − D, with A depreciated 35% reducing-balance FOR SUBSEQUENT YEARS.
eq('year 1 (no depreciation): 20% of 100,000,000 = 20,000,000',
   T2.motorVehicleBenefit({ marketValue: 100_000_000, yearsSinceFirstProvided: 0 }).result, 20_000_000);
eq('year 2: A falls to 65,000,000 → 13,000,000',
   T2.motorVehicleBenefit({ marketValue: 100_000_000, yearsSinceFirstProvided: 1 }).result, 13_000_000);
eq('year 3: A falls to 42,250,000 → 8,450,000',
   T2.motorVehicleBenefit({ marketValue: 100_000_000, yearsSinceFirstProvided: 2 }).result, 8_450_000);
eq('200 days of availability in year 2 → 7,123,288',
   T2.motorVehicleBenefit({ marketValue: 100_000_000, yearsSinceFirstProvided: 1, daysAvailable: 200 }).result, 7_123_288, 1);
eq('and D — what the employee pays — comes off',
   T2.motorVehicleBenefit({ marketValue: 100_000_000, yearsSinceFirstProvided: 1, employeeContribution: 3_000_000 }).result, 10_000_000);
ok("we tell them URA's own page still shows the PRE-2017 formula",
   T2.motorVehicleBenefit({ marketValue: 100_000_000, yearsSinceFirstProvided: 1 })
     .warnings.some((w) => w.evidenceUrl && w.evidenceUrl.includes('ura.go.ug')));
ok('and we quantify the over-tax it would cause',
   T2.motorVehicleBenefit({ marketValue: 100_000_000, yearsSinceFirstProvided: 1 }).comparison.delta === 7_000_000);

section('🔴 Housing benefit — the gross-up that DOES NOT EXIST');

// URA's own worked example, reproduced exactly. Our calculator-centre spec said
// this benefit was "grossed up". It is not. The iterative solve OVER-TAXES.
const h = T2.housingBenefit({ marketRent: 600_000, cashEmploymentIncome: 3_500_000, employeePays: 50_000 });
eq("limb (a): rent 600,000 less the 50,000 the employee pays = 550,000", h.limbs.a, 550_000);
eq("limb (b): 15% × (3,500,000 cash + 550,000) = 607,500", h.limbs.b, 607_500);
eq('the benefit is the LESSER — 550,000', h.result, 550_000);
ok('limb (a) binds here', h.limbs.binding === 'a');
ok('and we warn, loudly, that there is NO gross-up',
   h.warnings.some((w) => w.severity === 'high' && w.text.includes('THERE IS NO GROSS-UP')));

section('Employee loan benefit — and a legal question nobody has answered');

eq('a 10,000,000 loan at 5%, statutory 9.75% → 475,000',
   T2.employeeLoanBenefit({ loanAmount: 10_000_000, employerRate: 0.05 }).result, 475_000);
eq('a loan at or below 1,000,000 gives NO benefit',
   T2.employeeLoanBenefit({ loanAmount: 1_000_000, employerRate: 0 }).result, 0);
eq('charge the statutory rate or more and there is no benefit',
   T2.employeeLoanBenefit({ loanAmount: 10_000_000, employerRate: 0.12 }).result, 0);

// 🔴 The Act says "BoU DISCOUNT RATE". BoU publishes a CBR (9.75%), a rediscount
// rate (12.75%) and a bank rate (13.75%) — and calls none of them that.
const ln = T2.employeeLoanBenefit({ loanAmount: 10_000_000, employerRate: 0.05 });
eq('the composite is rated C — the RATE is a legal question, not a number', ln.rule.confidence, CONFIDENCE.C);
ok('and we SHOW the alternative reading rather than hiding it',
   ln.alternativeReading.rate === 0.1375 && ln.alternativeReading.result === 875_000);
ok('and we say plainly that we cannot tell them which the Act means',
   ln.whatWeCannotTellYou.some((s) => s.includes('BoU publishes three rates')));

section('🔴 Terminal benefits — RSM is WRONG about this in print');

// s.19(4) applies the 75% formula to s.19(1)(d) — COMPENSATION FOR TERMINATION.
// Gratuity is s.19(1)(a), beside wages and bonus. IT IS FULLY TAXABLE.
eq('termination compensation, 12 years: 25% exempt → 37,500,000 taxable',
   T2.terminalBenefits({ amount: 50_000_000, kind: 'termination_compensation', yearsWithEmployer: 12 }).result, 37_500_000);
eq('GRATUITY, 12 years: FULLY taxable → 50,000,000',
   T2.terminalBenefits({ amount: 50_000_000, kind: 'gratuity', yearsWithEmployer: 12 }).result, 50_000_000);
eq('termination compensation, 9 years: NO relief — the threshold is TEN years',
   T2.terminalBenefits({ amount: 50_000_000, kind: 'termination_compensation', yearsWithEmployer: 9 }).result, 50_000_000);
ok('and we name RSM, because they publish it wrong and employers follow them',
   T2.terminalBenefits({ amount: 50_000_000, kind: 'gratuity', yearsWithEmployer: 12 })
     .warnings.some((w) => w.text.includes('RSM')));

section('The second-job trap — a second Isaac, on every payslip');

// The flat 30% hurts LOW earners. At a high salary the marginal rate is already
// 30%, so the flat rate is right — and above 10m it actually UNDER-taxes.
const lowPaid = T2.multipleEmployers({ mainMonthly: 400_000, secondMonthly: 500_000 });
eq('a 500,000 second job is taxed 150,000 — a flat 30%, no free band', lowPaid.result, 150_000);
ok('and on a 400,000 main salary that is a REAL overpayment', lowPaid.reclaim.monthly > 0);
ok('which we tell them they can CLAIM BACK',
   lowPaid.warnings.some((w) => w.severity === 'high' && w.text.includes('OVERPAYING')));

const wellPaid = T2.multipleEmployers({ mainMonthly: 2_000_000, secondMonthly: 500_000 });
eq('but at 2,000,000 main salary the flat 30% is EXACTLY right — no overpayment',
   wellPaid.reclaim.monthly, 0);
// ↑ honest, and the opposite of what a marketing-led calculator would claim.
ok('we admit the enabling SECTION could not be read — rule B, citation F',
   lowPaid.whatWeCannotTellYou.some((s) => s.includes('citation we have not read is not a citation')));

section('Capital allowances — and the 50% write-off that no longer exists');

eq('class 1 (computers) at 40%: year 1 on 10,000,000 = 4,000,000',
   T2.capitalAllowances({ cost: 10_000_000, assetClass: 1 }).result, 4_000_000);
eq('class 2 (plant) at 30%',  T2.capitalAllowances({ cost: 10_000_000, assetClass: 2 }).result, 3_000_000);
eq('class 3 (everything else) at 20%', T2.capitalAllowances({ cost: 10_000_000, assetClass: 3 }).result, 2_000_000);
eq('THE INITIAL ALLOWANCE IS ABOLISHED — the rule must carry none',
   RULES.CAPITAL_ALLOWANCES_2026.initialAllowance, null);
ok('and we say so, because Grant Thornton still prints it',
   T2.capitalAllowances({ cost: 10_000_000, assetClass: 2 })
     .warnings.some((w) => w.text.includes('THE INITIAL ALLOWANCE IS GONE')));

// The vehicle cap: mechanism is primary law, the FIGURE is confidence B.
const car = T2.capitalAllowances({ cost: 80_000_000, assetClass: 3, isRoadVehicle: true });
eq('an 80,000,000 non-commercial car is capped at a 60,000,000 base → 12,000,000', car.result, 12_000_000);
ok('the cap is flagged', car.vehicleCapApplied);
eq('a COMMERCIAL vehicle is NOT capped → 20% of the full 80,000,000',
   T2.capitalAllowances({ cost: 80_000_000, assetClass: 3, isRoadVehicle: true, isCommercialVehicle: true }).result, 16_000_000);
eq('the 60,000,000 figure itself is only confidence B — read it off Schedule 7',
   RULES.CAPITAL_ALLOWANCES_2026.vehicleCeilingConfidence, CONFIDENCE.B);

section('Start-up costs · provisional tax · blocked input VAT · advance tax');

eq('start-up costs: 25% a year for 4 years — 20,000,000 → 5,000,000 a year',
   T2.startupCosts({ amount: 20_000_000 }).result, 5_000_000);
eq('after 4 years the window has closed',
   T2.startupCosts({ amount: 20_000_000, yearsSinceIncurred: 4 }).result, 0);

const pv = T2.provisionalTax({ estimatedAnnualTax: 40_000_000, whtAlreadyWithheld: 5_000_000, isCompany: true });
eq('a company: 50% of 40,000,000 less 5,000,000 WHT = 15,000,000 an instalment', pv.result, 15_000_000);
eq('  ...in TWO instalments', pv.schedule.instalments, 2);
eq('an individual pays FOUR', T2.provisionalTax({ estimatedAnnualTax: 40_000_000, isCompany: false }).schedule.instalments, 4);
ok('and we put the penalty in the RIGHT Act — TPCA s.60, not the ITA',
   pv.warnings.some((w) => w.text.includes('TAX PROCEDURES CODE, not the Income Tax Act')));

// 🔑 Telephone VAT is only 10% blocked. NINETY PERCENT IS RECOVERABLE.
const iv = T2.inputVatRecoverable({ items: [
  { key: 'telephone', amount: 10_000_000 },
  { key: 'passenger_auto', amount: 50_000_000 },
  { key: 'stock', amount: 100_000_000 },
] });
eq('telephone: 90% of the VAT is recoverable — 1,800,000 of 1,800,000',
   iv.lines[0].recoverable, Math.round(10_000_000 * 0.18 * 0.9));
eq('a passenger car: 100% blocked', iv.lines[1].recoverable, 0);
eq('ordinary stock: fully recoverable', iv.lines[2].recoverable, 18_000_000);
ok('and we tell them the 90% almost nobody claims',
   iv.warnings.some((w) => w.text.includes('NINETY PERCENT IS RECOVERABLE')));

eq('advance tax: a 7-tonne goods vehicle → 350,000 a year',
   T2.advanceTaxTransport({ kind: 'goods', loadingCapacityTonnes: 7 }).result, 350_000);
eq('a 14-seat omnibus → 280,000', T2.advanceTaxTransport({ kind: 'passenger', seats: 14 }).result, 280_000);
eq('a 2-tonne vehicle is BELOW the threshold → nothing',
   T2.advanceTaxTransport({ kind: 'goods', loadingCapacityTonnes: 2 }).result, 0);
ok('and we warn that the tonnage is LOADING CAPACITY, not gross weight',
   T2.advanceTaxTransport({ kind: 'goods', loadingCapacityTonnes: 7 })
     .warnings.some((w) => w.text.includes('LOADING CAPACITY')));

section('🔴 Stamp duty — and a rate we REFUSE to guess at, having been burned once');

eq('a 500,000,000 land transfer at 1.5% = 7,500,000',
   T2.stampDuty({ instrument: 'transfer', value: 500_000_000 }).result, 7_500_000);
eq('a lease at 1%',        T2.stampDuty({ instrument: 'lease', value: 100_000_000 }).result, 1_000_000);
eq('share capital at 0.5%', T2.stampDuty({ instrument: 'share_capital', value: 100_000_000 }).result, 500_000);
eq('a conveyance NOT being a transfer is a FLAT 15,000 — PwC gets this wrong',
   T2.stampDuty({ instrument: 'conveyance', value: 500_000_000 }).result, 15_000);
eq('a mortgage deed is NIL since 1 July 2025',
   T2.stampDuty({ instrument: 'mortgage', value: 500_000_000 }).result, 0);

// ✅ ANSWERED — AND OUR REFUSAL WAS RIGHT, FOR THE SECOND TIME.
//
// The 2026 Bill proposed doubling the transfer rate to 3%. MMAKS, CEO East Africa,
// Global Law Experts and mrt.tax all published it as law.
//
// PARLIAMENT REJECTED IT ON 21 APRIL 2026. Its own news release: "rejecting
// proposed increases in taxes on land and motorcycle transfers".
//
// That is the SECOND tax in one budget cycle that Parliament deleted on the floor
// while the profession kept publishing it. The first was the 0.5% minimum tax —
// which we SHIPPED. This one we refused to compute, and we were right.
//
// In Uganda, the floor is where taxes die. Almost nobody watches the floor.
const sd = T2.stampDuty({ instrument: 'transfer', value: 500_000_000 });
eq('the transfer rate is 1.5% — the 3% was REJECTED', sd.result, 7_500_000);
eq('and we show what it WOULD have been: 15,000,000', sd.rejectedIncrease.wouldHaveBeen, 15_000_000);
eq('...and that Parliament threw it out', sd.rejectedIncrease.outcome, 'REJECTED_ON_THE_FLOOR');
eq('on 21 April 2026', sd.rejectedIncrease.rejectedOn, '2026-04-21');
ok('and we warn the user their adviser may still be quoting the Bill',
   sd.warnings.some((w) => w.severity === 'high' && w.text.includes('IT IS NOT')));
ok('and we name it as the SECOND tax killed on the floor this cycle',
   sd.warnings.some((w) => w.text.includes('SECOND tax in one budget cycle')));

// The vehicle duty that WAS enacted — and whose figure ALSO changed on the floor.
eq('a motorcycle: 30,000 — the Bill said 50,000', T2.stampDuty({ instrument: 'vehicle_moto' }).result, 30_000);
eq('any other vehicle: 200,000',                  T2.stampDuty({ instrument: 'vehicle_other' }).result, 200_000);
ok('an unknown instrument → we REFUSE', T2.stampDuty({ instrument: 'vibes', value: 1 }).refused);

// ═════════════════════════════════════════════════════════════════════════════
section('🔑 The flat rate that is not the rate');

// Ugandan retail lending is quoted FLAT. "18% over 3 years" sounds like 18%.
// It is about 31%. Not hidden, not illegal — just a different quantity from the
// one the borrower believes they are being quoted. Almost nobody converts it.
const flat = P.loanSchedule({ principal: 10_000_000, annualRate: 0.18, months: 36, quotedAsFlat: true });
eq('10,000,000 at 18% FLAT over 36 months → 427,778 a month', flat.result, 427_778, 1);
eq('total interest: 18% × 3 years × 10m = 5,400,000', flat.totalInterest, 5_400_000, 1);
ok('the TRUE reducing-balance rate is over 30%', flat.trueRate.effective > 0.30);
ok('...roughly 1.7× the quoted rate', flat.trueRate.multiple > 1.6 && flat.trueRate.multiple < 1.8);
ok('and we say so, loudly', flat.warnings.some((w) => w.severity === 'high' && w.text.includes('A FLAT RATE IS NOT THE RATE YOU PAY')));

// A reducing-balance quote is honest — the quoted rate IS the rate.
const red = P.loanSchedule({ principal: 10_000_000, annualRate: 0.18, months: 36 });
eq('quoted on a REDUCING balance, the true rate equals the quote', red.trueRate.effective, 0.18, 0.0001);
ok('and the payment is lower than the flat-quoted one', red.result < flat.result);

section('Savings, retirement and the double exemption');

const sv = P.savings({ initial: 0, monthlyDeposit: 200_000, annualRate: 0.08, years: 10, annualInflation: 0.055 });
eq('200,000/month at 8% for 10 years → 36,589,207', sv.result, 36_589_207, 2);
eq('you put in 24,000,000',           sv.contributed, 24_000_000);
ok('but in TODAY\'s money it is only 21,420,441 — LESS than you put in', sv.realValue < sv.contributed);
ok('and we say you are going BACKWARDS',
   sv.warnings.some((w) => w.severity === 'high' && w.text.includes('GOING BACKWARDS')));
// ↑ 8% nominal against 5.5% inflation over 10 years. The pile grows; the purchasing
//   power shrinks. A calculator that showed only the big number would be lying.

const ret = P.retirement({ currentAge: 30, retireAge: 60, monthlyGross: 2_000_000 });
ok('the retirement pot compounds', ret.result > 600_000_000);
ok('and we name the DOUBLE EXEMPTION — exempt in, exempt out',
   ret.warnings.some((w) => w.text.includes('EXEMPT when it goes in AND EXEMPT when it comes out')));
ok('and note the employee\'s OWN contribution is NOT deductible',
   ret.warnings.some((w) => w.text.includes('NOT deductible')));

section('Treasury bills — and the 20% the advertised yield never mentions');

const tb = P.treasuryYield({ faceValue: 1_000_000, purchasePrice: 920_000, days: 364 });
ok('the gross yield is about 8.7%', tb.grossYield > 0.086 && tb.grossYield < 0.088);
eq('WHT on government securities is 20% — not the 15% on bank interest',
   RULES.WHT_2026.rates.find((r) => r.key === 'govt_securities').resident, 0.20);
eq('so 16,000 of the 80,000 gain is withheld', tb.taxWithheld, 16_000);
ok('and the ACTUAL yield is ~7%, not the ~8.7% advertised', tb.netYield < tb.grossYield * 0.85);
ok('but a SECONDARY-market disposal is exempt — a real planning point',
   tb.warnings.some((w) => w.text.includes('SECONDARY market is EXEMPT') || w.text.includes('secondary')));

section('Debt, budgets and the things arithmetic cannot tell you');

const dp = P.debtPayoff({ monthlyBudget: 1_000_000, debts: [
  { label: 'Bank loan',   balance: 5_000_000, annualRate: 0.24, minimum: 200_000 },
  { label: 'Mobile loan', balance:   500_000, annualRate: 0.60, minimum:  50_000 },
  { label: 'Shop credit', balance: 2_000_000, annualRate: 0.12, minimum: 100_000 },
] });
ok('the avalanche costs less interest than the snowball',
   dp.options[0].totalInterest <= dp.options[1].totalInterest);
ok('the numbers favour the avalanche', dp.whatTheNumbersFavour.option === 'avalanche');
ok('but we say plainly that a plan you abandon is worse than one you finish',
   dp.whatTheNumbersFavour.caveat.includes('A plan you abandon'));

eq('a 6-month emergency fund on 1,500,000 of essentials = 9,000,000',
   P.emergencyFund({ monthlyEssentials: 1_500_000 }).result, 9_000_000);
ok('and under one month of cover gets a HIGH warning',
   P.emergencyFund({ monthlyEssentials: 1_500_000, currentSavings: 500_000 })
     .warnings.some((w) => w.severity === 'high'));

eq('net worth = assets − liabilities',
   P.netWorth({ assets: [{ label: 'Land', value: 80_000_000 }], liabilities: [{ label: 'Loan', value: 30_000_000 }] }).result, 50_000_000);
ok('a negative net worth is stated as a FACT, not a verdict',
   P.netWorth({ assets: [], liabilities: [{ label: 'Loan', value: 5_000_000 }] })
     .warnings.some((w) => w.text.includes('not a verdict')));

const bg = P.budget({ monthlyIncome: 2_000_000, expenses: [{ category: 'rent', amount: 800_000 }, { category: 'food', amount: 600_000 }] });
eq('2,000,000 in, 1,400,000 out → 600,000 left', bg.result, 600_000);
ok('and it insists on TAKE-HOME pay, not gross',
   bg.warnings.some((w) => w.text.includes('TAKE-HOME pay, not gross')));

ok('business valuation REFUSES to give a price', P.businessValuation({ annualProfit: 50_000_000, annualRevenue: 200_000_000 }).result === null);
ok('...and says why, in the first line of what it cannot tell you',
   P.businessValuation({ annualProfit: 50_000_000, annualRevenue: 200_000_000 })
     .whatWeCannotTellYou[0].includes('worth what someone will pay'));

section('Every Tier-2 and personal trace is still a PROOF');

for (const [name, tr] of [
  ['motorVehicleBenefit',  T2.motorVehicleBenefit({ marketValue: 50_000_000 })],
  ['housingBenefit',       T2.housingBenefit({ marketRent: 500_000, cashEmploymentIncome: 2_000_000 })],
  ['employeeLoanBenefit',  T2.employeeLoanBenefit({ loanAmount: 5_000_000, employerRate: 0.02 })],
  ['terminalBenefits',     T2.terminalBenefits({ amount: 10_000_000, yearsWithEmployer: 11 })],
  ['multipleEmployers',    T2.multipleEmployers({ mainMonthly: 500_000, secondMonthly: 300_000 })],
  ['capitalAllowances',    T2.capitalAllowances({ cost: 10_000_000 })],
  ['startupCosts',         T2.startupCosts({ amount: 10_000_000 })],
  ['provisionalTax',       T2.provisionalTax({ estimatedAnnualTax: 10_000_000 })],
  ['inputVatRecoverable',  T2.inputVatRecoverable({ items: [{ key: 'telephone', amount: 1_000_000 }] })],
  ['advanceTaxTransport',  T2.advanceTaxTransport({ kind: 'goods', loadingCapacityTonnes: 5 })],
  ['stampDuty',            T2.stampDuty({ instrument: 'lease', value: 10_000_000 })],
  ['loanSchedule',         P.loanSchedule({ principal: 1_000_000, annualRate: 0.2, months: 12 })],
  ['savings',              P.savings({ monthlyDeposit: 100_000, annualRate: 0.08, years: 5 })],
  ['retirement',           P.retirement({ currentAge: 30, retireAge: 60, monthlyGross: 1_000_000 })],
  ['debtPayoff',           P.debtPayoff({ monthlyBudget: 500_000, debts: [{ label: 'x', balance: 1_000_000, annualRate: 0.2, minimum: 50_000 }] })],
  ['emergencyFund',        P.emergencyFund({ monthlyEssentials: 500_000 })],
  ['netWorth',             P.netWorth({ assets: [{ label: 'a', value: 1 }], liabilities: [] })],
  ['budget',               P.budget({ monthlyIncome: 1_000_000, expenses: [{ category: 'rent', amount: 100_000 }] })],
  ['treasuryYield',        P.treasuryYield({ faceValue: 1_000_000, purchasePrice: 900_000, days: 182 })],
  ['mortgageAffordability',P.mortgageAffordability({ monthlyNetIncome: 3_000_000, annualRate: 0.18, years: 15 })],
  ['businessValuation',    P.businessValuation({ annualProfit: 10_000_000, annualRevenue: 50_000_000 })],
]) {
  ok(`${name.padEnd(22)} carries a rule, a source, a confidence and a date`,
     !!tr.rule.id && !!tr.rule.confidence && !!tr.rule.source.instrument && !!tr.rule.verifiedOn);
  ok(`${name.padEnd(22)} shows its WORKING`, Array.isArray(tr.steps) && tr.steps.length >= 2);
}

// ═════════════════════════════════════════════════════════════════════════════
// F4 — THE COMMENCEMENT CLOCK
//
// Built because we got this wrong TWICE IN ONE WEEK:
//   · we SHIPPED a 0.5% minimum tax Parliament deleted on 23 April 2026
//   · we nearly shipped a 3% stamp duty Parliament rejected on 21 April 2026
//   · and the Employment (Amendment) Act 2025 is SIGNED and STILL NOT IN FORCE
//
// Nobody in Uganda tracks the STAGE a tax is at. The profession collapses BILL /
// PASSED / ASSENTED / IN FORCE into "the new law" and publishes it in April. Two
// of this year's headline taxes died in between, and the alerts were never
// corrected.
// ═════════════════════════════════════════════════════════════════════════════
const CL = require('./clock');

section('F4 — the commencement clock');

const wl = CL.watchlist();
eq('ONE law is signed and not yet in force', wl.coming.length, 1);
eq('TWO taxes died on the floor of Parliament', wl.killedOnTheFloor.length, 2);

const minTax = wl.killedOnTheFloor.find((k) => k.title.includes('minimum tax'));
eq('the minimum tax was deleted on 23 April 2026', minTax.killedOn, '2026-04-23');
ok('and we ADMIT WE SHIPPED IT — the failure is ours, and named', minTax.weShippedIt === true);
ok('and we name the firms still publishing it as law',
   minTax.stillPublishedAsLawBy.length >= 3);

const stamp = wl.killedOnTheFloor.find((k) => k.title.includes('Stamp duty'));
eq('the 3% stamp duty was rejected on 21 April 2026', stamp.killedOn, '2026-04-21');
ok('and THAT one we refused to compute — and we were right', stamp.weShippedIt === false);
ok('with Parliament\'s own words as the evidence',
   /rejecting proposed increases/i.test(stamp.evidence));

section('The exposure — a number that is NOT a liability');

const ex = CL.exposure({ employees: [
  { name: 'A', monthlyGross: 2_000_000, yearsOfService: 10 },
  { name: 'B', monthlyGross: 1_200_000, yearsOfService: 4, contractSeveranceMonthsPerYear: 0.5 },
] });
eq('A accrues 2,000,000/yr under the assented Act; B accrues 1,200,000 but provides 600,000',
   ex.result, 2_600_000);
eq('and the retrospective back-book is 24,800,000', ex.totals.retrospectiveBackBook, 24_800_000);

// 🔴 THE LINE THAT MAKES IT HONEST. The Act is not in force. This is an EXPOSURE,
// not a liability. Booking it would be wrong. Not knowing it would be worse.
ok('IT IS NOT A LIABILITY, and the trace says so', ex.isThisALiability === false);
ok('the rule it rests on is NOT displayable — it may not compute a liability',
   ex.rule.displayable === false);
eq('...because its status is assented, not in force', ex.rule.status, 'assented_not_commenced');
ok('and we say we cannot tell them whether they owe any of it',
   ex.whatWeCannotTellYou.some((s) => s.includes('WHETHER YOU OWE ANY OF THIS')));
eq('it carries the highest disclaimer tier', ex.disclaimerTier, 4);

section('🔴 The switch — and it REFUSES a rumour');

// The day a commencement notice is gazetted, one rule flips and every affected
// client moves with it. But a commencement without a gazette reference is a
// rumour — and a rumour is exactly how we shipped a tax Parliament had deleted.
const noGazette = CL.commence({ ruleId: 'UG.SEVERANCE.2025' });
ok('commencing WITHOUT a gazette reference is REFUSED', noGazette.refused === true);
ok('...and it says why, in terms', noGazette.why.includes('make a law out of a rumour'));
ok('...and lists exactly what it needs', noGazette.whatWeNeed.length === 3);

const withGazette = CL.commence({
  ruleId: 'UG.SEVERANCE.2025',
  gazettedOn: '2026-09-01',
  gazetteReference: 'Uganda Gazette No. 61, Vol. CXIX',
  verifiedBy: 'TheVariable',
});
ok('WITH a gazette reference, it commences', withGazette.ok === true);
eq('  from assented...', withGazette.change.from, 'assented_not_commenced');
eq('  ...to in force',   withGazette.change.to, 'in_force');
ok('and it tells you to go and find every client advised under the old rule',
   withGazette.thenWhat.some((t) => t.includes('tell those clients')));

// A BILL may never be commenced. It has to survive the floor first — and two did not.
const bill = CL.commence({ ruleId: 'UG.PAYE.RESIDENT.2012', gazettedOn: 'x', gazetteReference: 'y' });
ok('a rule that is not ASSENTED cannot be commenced', bill.refused === true);

// ═════════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
if (failed === 0) {
  console.log(`\x1b[32m✓ ALL ${passed} TESTS PASSED\x1b[0m`);
  console.log('\nThe engine computes Ugandan tax law correctly, as at 11 July 2026.');
  console.log('Every figure above was EXECUTED, not asserted.');
} else {
  console.log(`\x1b[31m✗ ${failed} FAILED\x1b[0m, ${passed} passed\n`);
  failures.forEach(f => console.log(f));
  process.exitCode = 1;
}
console.log('═'.repeat(60));
