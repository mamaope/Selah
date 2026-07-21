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

const { RULES } = require('./rules');

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

function fmt(n) {
  if (n === Infinity || n == null) return '—';
  return new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(Math.round(n));
}

module.exports = { taxProfile, QUESTIONS, taxYear, fmtDate, daysUntil, next15th, nextLst, nextFinalReturn, nextProvisional };
