/**
 * SELAH — BOOKS
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE LAW OF THIS MODULE, AND IT HAS ONE:
 *
 *                          A DRAFT IS NOT MONEY.
 *
 * A template says what you EXPECT. Expectation is not receipt. Every ordinary
 * budgeting app collapses those two, and the moment it does it begins to lie:
 * your salary appears in your total because a RULE said it would, not because it
 * came. Your "money left this month" is computed from income you have not been
 * paid. And the app is most confidently wrong in exactly the month the money did
 * NOT arrive — which is the month you most needed the truth.
 *
 * The founder asked the question that kills the naive version:
 *
 *     "What happens if the salary does not come that month?"
 *
 * So:
 *
 *   1. A staged line is a DRAFT. It counts in NO total. Ever.
 *   2. Only a CONFIRMED line is money.
 *   3. A confirmed line carries the ACTUAL amount, which may differ from expected.
 *   4. NOTHING IS EVER AUTO-CONFIRMED. Not after 30 days. Not "probably".
 *   5. "IT DID NOT COME" is a first-class outcome, recorded and KEPT.
 *   6. A target counts CONFIRMED only. A goal that counts your hopes is a lie.
 *
 * Rule 5 is the one nobody else has. Salary late. Salary short. Tenant didn't pay.
 * Today that fact is destroyed — you pretend you were paid, or you delete the line
 * and lose the evidence. We record `expected 2,500,000 → received 0`, and keep it.
 * That record is what later proves an employer was short-paying you.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 AND BOOKS DO NOT TALK TO THE TAX ENGINE. That is a decision, not an omission.
 *
 * A Book called "Shop" looks like business income. Concluding that from a LABEL
 * would mean inventing a provisional tax obligation — 2% a month, four times a
 * year — out of a word the user typed into a budget. We watched Uganda's whole tax
 * profession publish unverified rules as law, and we built a company to say so.
 *
 * A BUDGET LABEL IS NOT A TAX FACT. The tax calendar ASKS. It stays a question.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { UGX, refuse } = require('./engine');

const CADENCES = ['weekly', 'monthly', 'quarterly', 'annual'];

const STATUS = {
  EXPECTED:       'expected',        // staged from a template. Counts in NOTHING.
  CONFIRMED:      'confirmed',       // it happened. THIS is money.
  DID_NOT_ARRIVE: 'did_not_arrive',  // 🔑 it was expected, and it did not come. KEPT.
  UNPLANNED:      'unplanned',       // it happened; no template predicted it. Money.
};

/** The only two statuses that are money. If you are adding a third, stop and think. */
const COUNTS = new Set([STATUS.CONFIRMED, STATUS.UNPLANNED]);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

// ── dates: UTC calendar days. A budget month is a DAY RANGE, not an instant. ──
const day = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const lastDayOf = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const iso = (dt) => dt.toISOString().slice(0, 10);
function parseDay(s) {
  if (s instanceof Date) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const d = day(+m[1], +m[2], +m[3]);
  return isNaN(d.getTime()) ? null : d;
}
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

/**
 * The period containing `asOf`, for a template's cadence.
 *
 * 🔴 WE DO NOT GUESS AN ANCHOR.
 *
 * A monthly period is obvious. A QUARTERLY or ANNUAL one is not: does your year
 * start in January, or in July with the tax year, or in March when you opened the
 * shop? Assume January and every quarterly deadline we ever show is up to three
 * months wrong. Assume July and we are wrong the other way.
 *
 * So a quarterly or annual template MUST carry an `anchor` — a date its cycle
 * starts from. Without one we REFUSE. We do not pick a hemisphere and hope.
 */
function periodFor(cadence, asOf, anchor) {
  const now = parseDay(asOf);
  if (!now) return null;
  if (!CADENCES.includes(cadence)) return null;

  if (cadence === 'monthly') {
    const y = now.getUTCFullYear(), m = now.getUTCMonth() + 1;
    return { cadence, startsOn: iso(day(y, m, 1)), endsOn: iso(day(y, m, lastDayOf(y, m))),
             label: `${MONTHS[m - 1]} ${y}` };
  }

  if (cadence === 'weekly') {
    // Monday-start. Ugandan payroll is monthly; weekly is for traders, and a
    // trader's week is a market week. We picked Monday and we SAY we picked it —
    // see `assumption` below. It is not hidden in a date library.
    const dow = (now.getUTCDay() + 6) % 7;              // 0 = Monday
    const start = addDays(now, -dow);
    const end = addDays(start, 6);
    return { cadence, startsOn: iso(start), endsOn: iso(end),
             label: `week of ${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]}`,
             assumption: 'A week starts on MONDAY. We chose that; the Act does not say. If your trading week runs otherwise, tell us.' };
  }

  const a = parseDay(anchor);
  if (!a) return null;                                  // caller must REFUSE. See stage().

  const step = cadence === 'quarterly' ? 3 : 12;
  // Walk whole steps from the anchor until we contain `now`. Anchors may be in the
  // future (a Book starting next month) — then there is no current period yet.
  let s = new Date(a.getTime());
  if (s > now) return null;
  for (;;) {
    const nextM = s.getUTCMonth() + step;
    const next = new Date(Date.UTC(s.getUTCFullYear(), nextM, s.getUTCDate()));
    if (next > now) {
      return { cadence, startsOn: iso(s), endsOn: iso(addDays(next, -1)),
               label: cadence === 'quarterly'
                 ? `quarter from ${s.getUTCDate()} ${MONTHS[s.getUTCMonth()]} ${s.getUTCFullYear()}`
                 : `year from ${s.getUTCDate()} ${MONTHS[s.getUTCMonth()]} ${s.getUTCFullYear()}`,
               anchoredOn: iso(a) };
    }
    s = next;
  }
}

/**
 * Stage a template into its current period. Produces DRAFTS. Not money.
 */
function stage(template, asOf, alreadyStaged) {
  const t = template || {};

  if (!CADENCES.includes(t.cadence)) {
    return refuse({ label: 'Books' }, {
      question: 'When does this template repeat?',
      because: `"${t.cadence}" is not a cadence we know. It must be one of: ${CADENCES.join(', ')}.`,
      weWillNot: 'We will not guess how often your money moves.',
      whatWouldUnblockThis: 'Pick a cadence: weekly, monthly, quarterly or annual.',
    });
  }

  if (!Array.isArray(t.lines) || t.lines.length === 0) {
    return refuse({ label: 'Books' }, {
      question: 'What does a normal month look like?',
      because: 'This template has no lines in it, so there is nothing to stage.',
      weWillNot: 'We will not create an empty month and call it a budget.',
      whatWouldUnblockThis: 'Add at least one line — what comes in, or what goes out.',
    });
  }

  if ((t.cadence === 'quarterly' || t.cadence === 'annual') && !parseDay(t.anchor)) {
    return refuse({ label: 'Books' }, {
      question: `When does your ${t.cadence === 'quarterly' ? 'quarter' : 'year'} start?`,
      because: 'A quarterly or annual cycle has no natural starting point. January, July and the month you opened the shop are all defensible — and they give completely different dates.',
      weWillNot: 'We will not assume January. If we assumed wrong, every date on this Book would be up to three months out, and it would look perfectly reasonable.',
      whatWouldUnblockThis: 'The date the cycle starts from.',
    });
  }

  const period = periodFor(t.cadence, asOf, t.anchor);
  if (!period) {
    return refuse({ label: 'Books' }, {
      question: 'Which period are we staging?',
      because: 'The cycle has not started yet — its anchor is in the future.',
      weWillNot: 'We will not stage a period before it exists. July is not staged in June.',
      whatWouldUnblockThis: 'Wait for the cycle to begin, or move its start date.',
    });
  }

  // 🔴 IDEMPOTENT. Staging twice would DOUBLE a person's rent, silently, and every
  // total would still add up. A duplicate is not an error the user can see.
  if (Array.isArray(alreadyStaged) && alreadyStaged.some((p) => p === period.startsOn)) {
    return { ok: true, period, entries: [], alreadyStaged: true,
             note: 'This period was already staged. We did not stage it again — doing so would have silently doubled every line.' };
  }

  const entries = t.lines.map((l, i) => ({
    templateLineId: l.id || null,
    direction: l.direction === 'in' ? 'in' : 'out',
    label: l.label,
    category: l.category || null,
    expected: UGX(l.amount),
    actual: null,                       // 🔴 NOT the expected amount. Nothing has happened.
    status: STATUS.EXPECTED,            // 🔴 counts in NOTHING

    // 🔴 NULL, AND DELIBERATELY SO. Balances are DERIVED from entries, so an entry
    // must say which account the money touched — and the founder ruled: required
    // every time, NO DEFAULTS. A pre-filled account is a guess that will be tapped
    // through without being read, and it will put a month of rent in the wrong
    // account. The UI may SUGGEST. It may not SELECT.
    accountId: null,
    order: i,
  }));

  return {
    ok: true,
    period,
    entries,
    staged: entries.length,
    // Said on the screen, every time, in grey:
    note: 'These are EXPECTED, not received. They are counted in no total until you confirm them.',
  };
}

/**
 * The truth about a period.
 *
 * 🔴 EVERY FIGURE HERE IS SPLIT: what is REAL, and what is merely EXPECTED. They
 * are never added together, and the real one is always the one we lead with.
 */
/**
 * 🔑 WHICH MONTH DOES AN ENTRY BELONG TO?
 *
 * Defined ONCE, here, so the summary, the ledger and the server can never disagree
 * about it — a screen that counts an entry the server excludes is a screen that
 * lies about a total.
 *
 *   confirmed / unplanned → the day it HAPPENED (occurredOn).
 *   expected / did_not_arrive → the PERIOD it was staged for (periodStart). A draft
 *       has no occurredOn — it has not happened — so it belongs to the month it was
 *       drafted INTO.
 *
 * An undated confirmed entry belongs to NO month, and is counted in none of them.
 * We do not guess a date, because guessing would drop a June expense into July and
 * no total would ever disagree.
 */
function belongsToWindow(e, from, to) {
  if (!from || !to) return true;
  const moved = e.status === STATUS.CONFIRMED || e.status === STATUS.UNPLANNED;
  const d = moved
    ? (e.occurredOn || e.date || null)
    : (e.periodStart || e.period_start || e.occurredOn || e.date || null);
  if (!d) return false;
  const day = String(d).slice(0, 10);
  return day >= from && day <= to;
}

function summarise(entries, opts) {
  const o = opts || {};
  // 🔴 THE SUMMARY IS FOR ONE MONTH — a window, not the whole Book.
  //
  // This once summarised EVERY entry in the Book and called it "this month". A
  // person's lifetime totals sat under a heading that said July. The window fixes
  // it, and it is the same window the ledger and the server use.
  const all = Array.isArray(entries) ? entries : [];
  const es = (o.from && o.to) ? all.filter((e) => belongsToWindow(e, o.from, o.to)) : all;

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 A TRANSFER IS NOT INCOME. IT IS NOT SPENDING EITHER.
  //
  // Moving 500,000 from the bank to MoMo makes you no richer and no poorer. Count
  // it as income and the savings rate becomes a fantasy — "you saved 40% this
  // month!" while net worth stands perfectly still. Count it as spending and a
  // person who is doing fine looks broke.
  //
  // It touches TWO ACCOUNTS and ZERO TOTALS. This is the single most common way a
  // personal finance app lies to somebody about their own money, and it is excluded
  // here, at the source, so that no screen downstream can get it wrong.
  // ═══════════════════════════════════════════════════════════════════════════
  const notTransfer = (e) => e.direction === 'in' || e.direction === 'out';

  const money = es.filter((e) => COUNTS.has(e.status) && notTransfer(e));
  const drafts = es.filter((e) => e.status === STATUS.EXPECTED && notTransfer(e));
  const missed = es.filter((e) => e.status === STATUS.DID_NOT_ARRIVE && notTransfer(e));
  const transfers = es.filter((e) => e.direction === 'transfer' && COUNTS.has(e.status));

  // The amount that actually moved. NOT the expected figure — a confirmed line may
  // differ from what the template predicted, and the actual is the only one true.
  const amt = (e) => UGX(e.actual != null ? e.actual : e.expected);

  const inflow  = money.filter((e) => e.direction === 'in').reduce((a, e) => a + amt(e), 0);
  const outflow = money.filter((e) => e.direction === 'out').reduce((a, e) => a + amt(e), 0);

  const expectedIn  = drafts.filter((e) => e.direction === 'in').reduce((a, e) => a + UGX(e.expected), 0);
  const expectedOut = drafts.filter((e) => e.direction === 'out').reduce((a, e) => a + UGX(e.expected), 0);

  return {
    // ── WHAT IS REAL ───────────────────────────────────────────────────────
    confirmedIn: inflow,
    confirmedOut: outflow,
    net: inflow - outflow,

    // ── WHAT IS ONLY EXPECTED. Kept apart. Never added in. ──────────────────
    stillExpectedIn: expectedIn,
    stillExpectedOut: expectedOut,
    unconfirmedCount: drafts.length,

    // ── 🔑 WHAT DID NOT COME. INCOME promised and never paid — the number nobody
    //    else keeps. An EXPENSE that did not happen is not "did not come"; it is
    //    simply money you did not spend, so it never belongs on this list. ─────
    didNotArrive: missed.filter((e) => e.direction === 'in').map((e) => ({
      label: e.label, direction: e.direction, expected: UGX(e.expected),
    })),
    didNotArriveTotal: missed.reduce((a, e) => a + UGX(e.expected), 0),
    incomeThatDidNotArrive: missed.filter((e) => e.direction === 'in')
      .reduce((a, e) => a + UGX(e.expected), 0),

    /**
     * 🔴 "IF EVERYTHING ARRIVES" IS A FORECAST, AND IT IS LABELLED AS ONE.
     *
     * It is NOT your balance. It is not "money left". It is the answer to a
     * hypothetical, and the moment it is displayed without that word attached,
     * this whole module has become the thing it was built to replace.
     */
    ifEverythingArrives: {
      net: (inflow + expectedIn) - (outflow + expectedOut),
      thisIsAForecast: 'This assumes every unconfirmed line arrives exactly as expected. It has not. It is not money.',
    },

    // Transfers are reported, and counted in NOTHING.
    transfers: {
      count: transfers.length,
      moved: transfers.reduce((a, e) => a + UGX(e.actual != null ? e.actual : e.expected), 0),
      countedIn: 'nothing — a transfer relocates money, it does not create or destroy it',
    },

    counts: { total: es.length, confirmed: money.length, expected: drafts.length,
              didNotArrive: missed.length, transfers: transfers.length },
    asOf: o.asOf || null,
  };
}

/**
 * A target's progress — measured on CONFIRMED money only.
 *
 * 🔴 A goal that counts your hopes is not a goal, it is a mood. If we counted
 * expected lines here, a person saving for a plot of land would watch the bar fill
 * up on money that never came, and would find out at the land office.
 */
function targetProgress(target, entries) {
  const t = target || {};
  const es = (Array.isArray(entries) ? entries : []).filter((e) => COUNTS.has(e.status));

  if (!(UGX(t.amount) > 0)) {
    return refuse({ label: 'Books' }, {
      question: 'What is the target?',
      because: 'A target needs an amount. Without one there is nothing to measure against.',
      weWillNot: 'We will not show a progress bar with no destination.',
      whatWouldUnblockThis: 'The amount you are aiming for.',
    });
  }

  const relevant = t.category
    ? es.filter((e) => e.category === t.category)
    : es.filter((e) => e.direction === (t.kind === 'limit' ? 'out' : 'in'));

  const actual = relevant.reduce((a, e) => a + UGX(e.actual != null ? e.actual : e.expected), 0);
  const goal = UGX(t.amount);
  const pct = Math.min(100, Math.round((actual / goal) * 100));

  // A LIMIT (keep food under 400k) is breached by going OVER.
  // A GOAL  (save 12m for the plot) is met by reaching it.
  const limit = t.kind === 'limit';

  return {
    kind: limit ? 'limit' : 'goal',
    label: t.label || null,
    target: goal,
    confirmed: actual,
    remaining: limit ? Math.max(0, goal - actual) : Math.max(0, goal - actual),
    percent: pct,
    met: limit ? actual <= goal : actual >= goal,
    breached: limit ? actual > goal : false,
    over: limit && actual > goal ? actual - goal : 0,
    countedOnly: 'Confirmed money. Expected lines are not counted towards a target — a goal that counts your hopes is a mood, not a goal.',
  };
}

/**
 * Confirm an entry. THE ONLY WAY A DRAFT BECOMES MONEY.
 *
 * 🔴 There is deliberately NO function in this file called autoConfirm, settle,
 * assumeReceived, or anything else that turns an expectation into a fact without a
 * human. If you are about to add one: the founder asked "what happens if the salary
 * does not come that month?", and THIS is the answer.
 */
function confirmEntry(entry, actualAmount, occurredOn, accountId) {
  const e = entry || {};
  if (e.status === STATUS.CONFIRMED) return { ...e };            // idempotent

  // 🔴 WHICH ACCOUNT DID THE MONEY TOUCH?
  //
  // Balances are DERIVED from confirmed entries. An entry with no account is money
  // that moved through nowhere — it changes no balance, and the account it really
  // came from is silently wrong from that moment on, for ever, with nothing to
  // show for it. Confirming without an account is not a small omission. It is a
  // corrupted balance with no error message.
  const account = accountId !== undefined && accountId !== null ? accountId : e.accountId;
  if (!account) {
    return refuse({ label: 'Books' }, {
      question: 'Which account did this money touch?',
      because: 'Your balances are worked out from these entries. An entry with no account changes no balance — and the account it really moved through would be quietly wrong from now on.',
      weWillNot: 'We will not guess. A guessed account puts your rent in the wrong pocket and never tells you.',
      whatWouldUnblockThis: 'Say where the money came from, or went to: cash, MoMo, the bank, the SACCO.',
    });
  }
  const actual = actualAmount === undefined || actualAmount === null
    ? UGX(e.expected)                                            // "it came, exactly as expected"
    : UGX(actualAmount);

  return {
    ...e,
    status: STATUS.CONFIRMED,
    actual,
    accountId: account,
    occurredOn: occurredOn || null,
    // The template said one thing; life said another. Keep both — this difference
    // is the evidence.
    differsFromExpected: actual !== UGX(e.expected),
    shortfall: UGX(e.expected) - actual,
  };
}

/** 🔑 It did not come. Record it. Keep it. Do not delete it. */
function markDidNotArrive(entry, note) {
  return {
    ...(entry || {}),
    status: STATUS.DID_NOT_ARRIVE,
    actual: 0,
    note: note || null,
    whyThisMatters: 'We keep this. A deleted line is a fact destroyed — and a record of income that was promised and never paid is exactly the evidence you will want later.',
  };
}

module.exports = {
  CADENCES, STATUS, COUNTS,
  periodFor, stage, summarise, targetProgress, confirmEntry, markDidNotArrive,
  belongsToWindow,
  // for the tests
  iso, day, parseDay,
};
