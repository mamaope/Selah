/**
 * SELAH — THE TAX CALENDAR
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 THE PRODUCT IS NOT "A LIST OF DATES". EVERY ACCOUNTANT IN KAMPALA HAS ONE.
 *
 * The product is: WHAT DOES IT COST YOU TO MISS THIS ONE, AND WHAT WILL IT COST
 * IN TWELVE MONTHS IF NOBODY EVER TELLS YOU?
 *
 * Because that is the actual failure. Nobody misses a deadline on purpose. They
 * miss it because NOTHING HAPPENED. No letter, no SMS, no red envelope. Uganda's
 * tax system generates no notification event on the day you fall out of
 * compliance. The arrear accrues at 2% a month, compounding, IN SILENCE — and the
 * taxpayer discovers it years later, at the exact moment they need a TCC for a
 * tender they were about to win.
 *
 * A forgotten UGX 4,000,000 becomes UGX 13,124,123 in five years. It more than
 * triples. The taxpayer did nothing wrong on any single day.
 *
 * So this module does three things a calendar does not:
 *
 *   1. It computes deadlines from the ENACTED RULE, not from a hard-coded list.
 *      When the law changes, the dates change with it. No calendar in Uganda is
 *      wired to the statute — they are all typed by hand, once, and left.
 *
 *   2. It attaches the ACCRUING COST to every missed obligation. Not "overdue" —
 *      "overdue, and this is now the balance, and this is what it becomes if you
 *      do nothing until next July".
 *
 *   3. It knows THE DIRECTOR TRAP. A company can be spotless and still be refused
 *      a TCC because a director it has forgotten about never filed a PERSONAL
 *      return. That obligation belongs to a HUMAN, appears on NO company ledger,
 *      and is invisible until the tender is lost. It is the only item on this
 *      calendar that a company cannot discover by looking at itself.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WHAT THIS MODULE MUST NEVER DO
 *
 * It must never invent a date. Not a grace day, not a weekend roll-forward, not a
 * "URA usually accepts the 16th". FILING_CALENDAR.weekendRollForward is `null` —
 * UNKNOWN — and unknown means WE SHOW THE STATUTORY DATE AND SAY WE DO NOT KNOW.
 * Paying early is never penalised. A grace day that does not exist costs 2%.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { RULES, CONFIDENCE, STAGE } = require('./rules');
const { UGX, ruleBlock, refuse, composeConfidence } = require('./engine');

const CAL = RULES.FILING_CALENDAR;
const PEN = RULES.PENALTIES_2026;
const TCC = RULES.TCC_2026;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

// ─────────────────────────────────────────────────────────────────────────────
// DATE PRIMITIVES
//
// All dates are handled as UTC calendar days. A tax deadline is a DAY, not an
// instant: "31 December" does not move because the user is in a different
// timezone, and a local-time Date() would silently shift it by a day for anyone
// west of Greenwich. Kampala is UTC+3, so a naive local Date parsed from
// '2026-12-31' can land on 30 December in the wrong hands. Not on our watch.
// ─────────────────────────────────────────────────────────────────────────────

function day(y, m, d) { return new Date(Date.UTC(y, m - 1, d)); }
function lastDayOf(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }   // m is 1-based
function iso(dt) { return dt.toISOString().slice(0, 10); }
function parseDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const dt = day(+m[1], +m[2], +m[3]);
  return isNaN(dt.getTime()) ? null : dt;
}
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function pretty(dt) {
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

/**
 * Months elapsed, for interest. Whole months only.
 *
 * 🔴 URA charges 2% PER MONTH. Not per day. A liability three days late and a
 * liability twenty-nine days late attract the same charge — and if we prorated by
 * day we would UNDERSTATE what somebody owes, which is the one direction a tax
 * tool must never be wrong in. Understating an arrear is how you tell a person
 * they are fine when they are not.
 *
 * So: any part of a month is a month. Ceiling, never floor.
 */
function monthsLate(due, on) {
  if (on <= due) return 0;
  let m = (on.getUTCFullYear() - due.getUTCFullYear()) * 12 + (on.getUTCMonth() - due.getUTCMonth());
  if (on.getUTCDate() > due.getUTCDate()) m += 1;      // part of a month is a month
  if (m < 1) m = 1;                                     // one day late is one month late
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// THE YEAR OF INCOME
//
// For an INDIVIDUAL it is fixed: 1 July – 30 June. For an ENTITY it may be
// SUBSTITUTED under s.39 — and if it is, EVERY instalment date moves. The engine
// is TOLD the year end. It never assumes one.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which year of income does `on` fall in, given a year end in month `endsMonth`?
 * Returns { startsOn, endsOn, label }.
 */
function yearOfIncome(on, endsMonth) {
  const em = endsMonth || CAL.yearOfIncome.endsMonth;    // default 6 (June)
  const y  = on.getUTCFullYear();
  const endThisYear = day(y, em, lastDayOf(y, em));
  const endsOn   = on <= endThisYear ? endThisYear : day(y + 1, em, lastDayOf(y + 1, em));
  const startsOn = new Date(Date.UTC(endsOn.getUTCFullYear() - 1, endsOn.getUTCMonth() + 1, 1));
  return {
    startsOn, endsOn,
    label: `${startsOn.getUTCFullYear()}/${String(endsOn.getUTCFullYear()).slice(2)}`,
  };
}

/**
 * The Nth month OF THE YEAR OF INCOME → a real calendar date (its last day).
 *
 * 🔴 THIS FUNCTION IS THE WHOLE BUG THAT WAS WAITING TO HAPPEN.
 *
 * The rule said `months: [3, 6, 9, 12]`. Months of WHAT? Read as calendar months,
 * an individual's first instalment is 31 March. Read correctly — months of the
 * YEAR OF INCOME, which starts 1 July — it is 30 SEPTEMBER. Six months apart.
 *
 * A taxpayer told in August that their next provisional payment is due in March
 * has been told something that costs them 2% a month from October.
 */
function nthMonthOfYear(yoi, n) {
  const start = yoi.startsOn;                                     // 1 July, normally
  const m0 = start.getUTCMonth() + (n - 1);                       // 0-based, may overflow
  const y  = start.getUTCFullYear() + Math.floor(m0 / 12);
  const m  = (m0 % 12) + 1;                                       // back to 1-based
  return day(y, m, lastDayOf(y, m));                              // DUE ON THE LAST DAY
}

// ─────────────────────────────────────────────────────────────────────────────
// THE COST OF SILENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What a missed obligation is worth today, and what it becomes if ignored.
 *
 * This is the number the whole product exists to show, and it is why the calendar
 * lives in the ENGINE and not in the front end. A date on a screen is decoration.
 * A date with a compounding balance attached is a reason to act.
 */
function costOfMissing(amountUGX, dueOn, asOf, opts) {
  const o = opts || {};
  const due = parseDay(dueOn) || dueOn;
  const now = parseDay(asOf) || asOf;
  const months = monthsLate(due, now);

  const rate = PEN.interestPerMonth;                 // 2% per month
  const compounds = o.compounds !== undefined ? o.compounds : true;

  const balNow = compounds
    ? UGX(amountUGX * Math.pow(1 + rate, months))
    : UGX(amountUGX * (1 + rate * months));

  const in12 = compounds
    ? UGX(amountUGX * Math.pow(1 + rate, months + 12))
    : UGX(amountUGX * (1 + rate * (months + 12)));

  return {
    principal: UGX(amountUGX),
    monthsLate: months,
    balanceNow: balNow,
    interestSoFar: balNow - UGX(amountUGX),
    balanceIn12Months: in12,
    costOfDoingNothingFor12Months: in12 - balNow,
    compounding: compounds,
    /**
     * 🔑 AND HERE IS THE PART NOBODY SELLS.
     *
     * Voluntary disclosure BEFORE court proceedings commence: the Commissioner MAY
     * compound the offence — you pay the TAX, with NO INTEREST AND NO FINE.
     *
     * Every number above can, lawfully, become zero. It is in URA's own published
     * rules. A calculator that shows you the debt and not the exit is only half
     * honest.
     */
    theWayOut: {
      route: 'Voluntary disclosure under the Tax Procedures Code Act',
      condition: PEN.voluntaryDisclosure.condition,
      effect: PEN.voluntaryDisclosure.effect,
      couldSaveYou: balNow - UGX(amountUGX),
      thisIsNotAdvice: 'The Commissioner MAY compound. It is a discretion, not a right. Take it to a registered tax agent before you write to URA — what you disclose, you cannot un-disclose.',
    },
    ...ruleBlock(PEN),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CALENDAR ITSELF
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which obligations apply to this taxpayer?
 *
 * 🔴 WE ASK. WE DO NOT GUESS.
 *
 * The temptation is to show everybody everything — all eight obligations, and let
 * them work out which are theirs. That is not a calendar, it is a wall of noise,
 * and a wall of noise is ignored exactly like the silence it replaced.
 *
 * The opposite temptation is worse: to infer. "You are an individual, so no VAT."
 * An individual sole trader over 300m MUST register for VAT. Inferring an
 * obligation away is how you tell somebody they are compliant when they are not.
 *
 * So: the profile is DECLARED, every flag is a question we asked, and anything we
 * were not told, we say we were not told.
 */
function obligationsFor(profile) {
  const p = profile || {};
  const on = [];
  const notAsked = [];

  const ask = (key, flag, why) => {
    if (flag === true) on.push(key);
    else if (flag === undefined || flag === null) notAsked.push({ key, why });
  };

  ask('paye',     p.employsPeople,      'Do you pay anyone a salary? (Including yourself, if you are a director on payroll.)');
  ask('nssf',     p.employsPeople,      'NSSF is now mandatory for EVERY employer — the 5-employee threshold is gone.');
  ask('wht',      p.isWithholdingAgent, 'Are you a designated withholding agent? URA publishes the list. Most people on it do not know they are on it.');
  ask('vat',      p.vatRegistered,      'Are you VAT-registered? (Turnover over UGX 300,000,000 in any 12 months makes it compulsory.)');
  ask('final',    p.filesIncomeTax,     'Do you have a return obligation? Almost everybody with non-employment income does.');
  ask('lst',      p.employsPeople,      'Local Service Tax is deducted by the EMPLOYER and paid to the local authority — not to URA.');

  // Provisional tax splits on WHAT YOU ARE, and it is the most-missed obligation
  // in the country, because PAYE lulls people into thinking tax is handled.
  if (p.kind === 'individual' && p.hasNonEmploymentIncome === true) on.push('prov_ind');
  else if (p.kind === 'entity') on.push('prov_co');
  else if (p.kind === 'individual' && p.hasNonEmploymentIncome === undefined) {
    notAsked.push({
      key: 'prov_ind',
      why: 'Do you earn ANYTHING outside your salary? Rent, consultancy, a side business, a directorship fee? If so you owe PROVISIONAL TAX four times a year, and nobody will remind you.',
    });
  }

  return { applies: on, weDidNotAsk: notAsked };
}

/**
 * The next `count` deadlines, computed from the enacted rule.
 */
function upcoming(profile, asOf, count) {
  const now = parseDay(asOf) || day(2026, 7, 12);
  const n = count || 8;
  const p = profile || {};
  const { applies, weDidNotAsk } = obligationsFor(p);

  const yearEndMonth = p.yearEndMonth || CAL.yearOfIncome.endsMonth;

  // A company with a SUBSTITUTED year of income moves every instalment. If the
  // caller claims one, they must tell us which month — we will not assume June.
  if (p.kind === 'entity' && p.yearEndMonth === undefined && p.substitutedYearOfIncome === true) {
    // refuse(rule, extra) — the FIRST argument is the RULE. Pass the message as
    // `extra`, or it is swallowed and the user is shown a blank refusal. Which is
    // exactly what happened: engine/calendar.test.js asserted `refused === true`
    // and went green while the explanation was silently dropped on the floor.
    // A refusal with nothing in it is worse than no refusal at all.
    return refuse(CAL, {
      question: 'When are this company\'s provisional tax instalments due?',
      because: 'You have told us this company has a SUBSTITUTED year of income under s.39, but not which month it ends in. Every instalment date hangs off that month.',
      weWillNot: 'We will not assume a 30 June year end. If we assumed June and your year ends in December, every date we showed you would be six months wrong — and you would find out from a penalty notice.',
      whatWouldUnblockThis: 'The month your accounting year ends. It is on your URA registration.',
    });
  }

  const items = [];
  const push = (o) => items.push(o);

  for (const ob of CAL.obligations) {
    if (!applies.includes(ob.key)) continue;

    if (ob.cadence === 'monthly') {
      // The 15th of the month AFTER the period. Emit the next few.
      for (let k = 0; k < Math.ceil(n / 2) + 1; k++) {
        const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + k, 15));
        if (base < now) continue;
        const forMonth = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1));
        push({
          key: ob.key, label: ob.label, dueOn: iso(base), cadence: 'monthly',
          covers: `${MONTHS[forMonth.getUTCMonth()]} ${forMonth.getUTCFullYear()}`,
          statutoryDay: 15,
        });
      }
    }

    if (ob.cadence === 'biannual' || ob.cadence === 'quarterly') {
      // Walk this year of income and the next, so a December user still sees March.
      for (const yoiOffset of [0, 1]) {
        const probe = new Date(Date.UTC(now.getUTCFullYear() + yoiOffset, now.getUTCMonth(), now.getUTCDate()));
        const yoi = yearOfIncome(probe, yearEndMonth);
        for (const m of ob.monthsOfYearOfIncome) {
          const d = nthMonthOfYear(yoi, m);
          if (d < now) continue;
          push({
            key: ob.key, label: ob.label, dueOn: iso(d), cadence: ob.cadence,
            covers: `instalment ${ob.monthsOfYearOfIncome.indexOf(m) + 1} of ${ob.monthsOfYearOfIncome.length}, year of income ${yoi.label}`,
            formula: ob.formula,
            basis: 'month ' + m + ' OF THE YEAR OF INCOME (which starts 1 July) — not the calendar month',
          });
        }
      }
    }

    if (ob.cadence === 'annual' && ob.monthsAfterYearEnd) {
      /**
       * 🔴 -1 IS NOT AN OPTIMISATION. IT IS THE BUG THIS FUNCTION SHIPPED WITH.
       *
       * The return you owe RIGHT NOW is for the year of income that has ALREADY
       * ENDED. On 12 July 2026 the year 2025/26 closed twelve days ago, and its
       * return is due 31 December 2026 — the most imminent annual obligation there
       * is. The first version of this loop started at the CURRENT year of income
       * and walked forward, so it skipped that return entirely and cheerfully
       * showed the user 31 December 2027 instead.
       *
       * A calendar that hides the deadline you are actually approaching is worse
       * than no calendar, because it is TRUSTED.
       */
      for (const yoiOffset of [-1, 0, 1]) {
        const probe = new Date(Date.UTC(now.getUTCFullYear() + yoiOffset, now.getUTCMonth(), now.getUTCDate()));
        const yoi = yearOfIncome(probe, yearEndMonth);
        const em = yoi.endsOn;
        const dueM = em.getUTCMonth() + 1 + ob.monthsAfterYearEnd;   // 1-based + 6
        const y = em.getUTCFullYear() + Math.floor((dueM - 1) / 12);
        const m = ((dueM - 1) % 12) + 1;
        const d = day(y, m, lastDayOf(y, m));
        if (d < now) continue;
        push({
          key: ob.key, label: ob.label, dueOn: iso(d), cadence: 'annual',
          covers: `year of income ${yoi.label} (ended ${pretty(em)})`,
          basis: `${ob.monthsAfterYearEnd} months after the year end`,
        });
      }
    }

    if (ob.cadence === 'annual' && ob.fixedDate === '31 October') {
      for (const yr of [now.getUTCFullYear(), now.getUTCFullYear() + 1]) {
        const d = day(yr, 10, 31);
        if (d < now) continue;
        push({ key: ob.key, label: ob.label, dueOn: iso(d), cadence: 'annual', covers: `${yr}`, statutoryDay: 31 });
      }
    }
  }

  const seen = new Set();
  const list = items
    .filter((i) => { const k = i.key + i.dueOn; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0))
    .slice(0, n)
    .map((i) => {
      const d = parseDay(i.dueOn);
      const days = daysBetween(now, d);
      return {
        ...i,
        prettyDue: pretty(d),
        daysAway: days,
        countdown: days === 0 ? 'TODAY' : days === 1 ? 'tomorrow' : `in ${days} days`,
        urgency: days <= 3 ? 'now' : days <= 14 ? 'soon' : 'later',
        penaltyIfMissed: `${(PEN.interestPerMonth * 100).toFixed(0)}% per month${PEN.vatCompounds && i.key === 'vat' ? ', COMPOUNDING' : ''}, from the day after the due date. No letter arrives.`,
      };
    });

  return {
    asOf: iso(now),
    yearOfIncome: yearOfIncome(now, yearEndMonth).label,
    deadlines: list,
    weDidNotAsk,

    /**
     * 🔴 SAID OUT LOUD, ON EVERY CALENDAR WE EVER RENDER.
     */
    whatWeCannotTellYou: [
      'Whether a due date that falls on a Saturday, Sunday or public holiday rolls forward to the next working day. We have NOT verified that Uganda has such a rule, and we will not invent one. Pay by the statutory date shown. Paying early is never penalised.',
      'How much you owe. This calendar knows WHEN, not HOW MUCH — that depends on figures only you have.',
      'Whether URA has registered you for a tax type you do not know about. Your URA portal is the only place that knows, and it will not tell you unless you look.',
    ],

    ...ruleBlock(CAL),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔑 THE DIRECTOR TRAP
//
// The one obligation on this calendar that a company CANNOT see by looking at
// itself. It belongs to a person. It appears on no company ledger. And it will
// refuse the company its TCC on the morning of the tender.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param directors [{ name, personalReturnsFiled: true|false|null, hasArrears: true|false|null }]
 */
function directorTrap(directors) {
  const ds = Array.isArray(directors) ? directors : [];

  if (!ds.length) {
    return refuse(TCC, {
      question: 'Will a director block this company\'s tax clearance certificate?',
      because: 'You have not told us who the directors are. This check cannot be run on a company — it can only be run on PEOPLE.',
      weWillNot: 'We will not return "you look fine". A company with an unlisted director is the exact company this check exists for. Silence here would be the most dangerous output we could produce.',
      whatWouldUnblockThis: 'Every director on the company\'s URA registration profile — including the ones who have not been to a board meeting in four years. Especially those.',
    });
  }

  const blocking = ds.filter((d) => d.personalReturnsFiled === false);
  const unknown  = ds.filter((d) => d.personalReturnsFiled === undefined || d.personalReturnsFiled === null);
  const arrears  = ds.filter((d) => d.hasArrears === true);

  return {
    headline: blocking.length
      ? `${blocking.length} director${blocking.length > 1 ? 's have' : ' has'} not filed a personal income tax return. THIS BLOCKS THE COMPANY'S TCC.`
      : unknown.length
        ? `We do not know whether ${unknown.length} of your directors have filed. That is not the same as "they have".`
        : 'No director is currently blocking the company\'s TCC on the filing criterion.',

    blocksTCC: blocking.length > 0,
    blockingDirectors: blocking.map((d) => d.name),
    unknownDirectors: unknown.map((d) => d.name),

    /**
     * 🔴 THE SPLIT, AND IT IS THE WHOLE INSIGHT.
     *
     *   Director's UNFILED RETURNS → BLOCKS the company TCC.   (Confidence A — URA states it)
     *   Director's UNPAID ARREARS  → URA DOES NOT SAY.         (Confidence C — WARN, do not assert)
     *
     * We warn on the second and we do not pretend it is the first. Stating an
     * unknown as a certainty is the failure mode of every tax blog in Uganda.
     */
    arrearsWarning: arrears.length ? {
      confidence: CONFIDENCE.C,
      directors: arrears.map((d) => d.name),
      text: 'A director with unpaid personal ARREARS may or may not block the company TCC. URA\'s published criteria say nothing about it. We will NOT tell you it is fine, and we will NOT tell you it is fatal — we do not know, and neither does anybody who claims to.',
      whatToDo: 'Ask URA for a private ruling, in writing, before the tender — not after.',
    } : null,

    whyThisIsInvisible:
      'It is invisible from inside your own books because IT IS NOT IN YOUR BOOKS. Your company can have filed every return and paid every shilling. A director who has not touched their personal TIN since 2019 will still fail you — and you will find out on the day you lose the tender.',

    whatToDoNow: blocking.length || unknown.length ? [
      'Get every director\'s TIN. All of them, including the dormant ones.',
      'Check each one\'s filing history on the URA portal. It takes minutes per person.',
      'A NIL return is still a return. Most blocked directors owe nothing at all — they simply never filed.',
      'If a director cannot be found, that is a corporate governance problem before it is a tax problem, and it will not fix itself.',
    ] : [
      'Re-run this before every tender. A director who was clean in July can be blocking you in November, and nothing will tell you.',
    ],

    ...ruleBlock(TCC),
    confidence: composeConfidence([
      { confidence: TCC.confidence, id: TCC.id, label: 'TCC criteria' },
    ]).confidence,
  };
}

module.exports = {
  upcoming,
  obligationsFor,
  costOfMissing,
  directorTrap,
  // exported for the tests — date arithmetic is where a calendar actually breaks
  yearOfIncome, nthMonthOfYear, monthsLate, lastDayOf, iso, day, pretty,
};
