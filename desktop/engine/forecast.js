/**
 * SELAH — FORECASTING
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 A FORECAST IS THE WEAKEST OBJECT IN THIS SYSTEM, AND MUST STAY THAT WAY.
 *
 * We built Books on "a draft is not money". A forecast is weaker still: it is a
 * GUESS FROM HISTORY. So it may produce a SUGGESTED BUDGET — a plan, which a human
 * accepts, edits or rejects — and it may NEVER produce a transaction, never touch a
 * balance, and never be confirmed.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 AND YOU CANNOT FORECAST A LUMP BY AVERAGING IT.
 *
 * Average six months of school fees and you get "200,000 a month" — a number that
 * is wrong in EVERY SINGLE MONTH. Wrong at zero in the months with no bill; wrong
 * at 200,000 in the month with a 1,200,000 one.
 *
 * The founder put it better than I did:
 *
 *     "I want to see when the next time I will refill gas is, based on my history."
 *
 * That is the whole feature. Not "gas: 22,000 a month" — which is true of no month
 * that has ever existed — but:
 *
 *     "Gas: you refill every 48–56 days. Last on 2 June. Next around 24 July.
 *      About 90,000."
 *
 * FORECAST WHEN. Then how much. Never a monthly slice of a thing that does not
 * arrive monthly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { UGX, refuse } = require('./engine');

/** Below this, we do not forecast. A forecast from two points is a guess in a suit. */
const MIN_OBSERVATIONS = 3;

/** Above this coefficient of variation, we give a RANGE, never a point. */
const ERRATIC = 0.25;

const MOVED = new Set(['confirmed', 'unplanned']);
const day = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const iso = (dt) => dt.toISOString().slice(0, 10);
function parseDay(s) {
  if (s instanceof Date) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const d = day(+m[1], +m[2], +m[3]);
  return isNaN(d.getTime()) ? null : d;
}
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const daysBetween = (a, b) => Math.round((b - a) / 86400000);

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stdev = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
};

/** Normalise a label so "Gas", " gas ", "GAS refill" group together. */
const normalise = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * 🔑 THE GAS CYLINDER.
 *
 * Find every repeated purchase, work out how often it happens, and say when the
 * next one is due. Auto-detected from repeated labels — you never have to tell us
 * that gas is a recurring thing, because you already did, three times, by buying it.
 */
function recurringItems(entries, asOf) {
  const now = parseDay(asOf) || new Date();
  const all = (Array.isArray(entries) ? entries : [])
    .filter((e) => MOVED.has(e.status) && e.direction === 'out' && parseDay(e.occurredOn || e.date) && e.label);

  const groups = new Map();
  for (const e of all) {
    const k = normalise(e.label);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push({
      on: parseDay(e.occurredOn || e.date),
      amount: UGX(e.actual != null ? e.actual : e.expected),
      category: e.category || null,
      label: e.label,
    });
  }

  const found = [];
  const tooThin = [];

  for (const [key, obs] of groups) {
    obs.sort((a, b) => a.on - b.on);

    // 🔴 UNDER THREE OBSERVATIONS WE FORECAST NOTHING, AND WE SAY SO.
    //    Two points define a line through anything. It is not a pattern; it is a
    //    coincidence with an opinion.
    if (obs.length < MIN_OBSERVATIONS) {
      tooThin.push({
        label: obs[0].label, seen: obs.length, needed: MIN_OBSERVATIONS,
        why: `We have only seen this ${obs.length} time${obs.length === 1 ? '' : 's'}. We will not predict a pattern from ${obs.length} — that is a guess wearing a suit.`,
      });
      continue;
    }

    const gaps = [];
    for (let i = 1; i < obs.length; i++) gaps.push(daysBetween(obs[i - 1].on, obs[i].on));

    const typical = median(gaps);
    if (!(typical > 0)) continue;                          // same-day repeats: not a cycle

    const spread = stdev(gaps);
    const cv = spread / mean(gaps);
    const regular = cv <= ERRATIC;

    const last = obs[obs.length - 1];
    const due = addDays(last.on, typical);
    const overdueBy = daysBetween(due, now);

    const amounts = obs.map((o) => o.amount);
    const amtSpread = stdev(amounts) / (mean(amounts) || 1);
    const steadyAmount = amtSpread <= ERRATIC;

    found.push({
      label: last.label,
      category: last.category,
      seen: obs.length,

      everyDays: typical,
      // 🔴 A RANGE WHEN IT IS ERRATIC. A single number implies a confidence we do
      //    not have, and people plan on single numbers.
      rangeDays: regular ? null : [Math.min(...gaps), Math.max(...gaps)],
      regular,

      lastOn: iso(last.on),
      nextDue: iso(due),
      daysAway: -overdueBy,
      overdue: overdueBy > 0,
      overdueByDays: overdueBy > 0 ? overdueBy : 0,

      typicalAmount: median(amounts),
      amountRange: steadyAmount ? null : [Math.min(...amounts), Math.max(...amounts)],

      confidence: obs.length >= 5 && regular ? 'good'
                : obs.length >= 4 || regular ? 'fair'
                : 'thin',

      says: regular
        ? `You buy this about every ${typical} days. Last on ${iso(last.on)} — next around ${iso(due)}.`
        : `You buy this every ${Math.min(...gaps)}–${Math.max(...gaps)} days, which is not a steady pattern. Roughly ${iso(due)}, but do not plan tightly on it.`,
    });
  }

  found.sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1));
  return {
    asOf: iso(now),
    items: found,
    notEnoughHistory: tooThin,
    /**
     * 🔴 SAID EVERY TIME. The things that actually wreck a Ugandan budget are
     * exactly the things history cannot see coming.
     */
    whatThisCannotSee: [
      'A school term starting. A funeral. A wedding. A medical emergency.',
      'A price rise — this assumes things cost what they cost last time.',
      'Anything you have never bought before, which is most of what goes wrong.',
    ],
  };
}

/**
 * A SUGGESTED BUDGET — a plan, with its working shown. Never a transaction.
 */
function suggestBudget(entries, from, to, forPeriod) {
  const a = parseDay(from), b = parseDay(to);
  if (!a || !b) return null;

  const hist = (Array.isArray(entries) ? entries : []).filter((e) => {
    const d = parseDay(e.occurredOn || e.date);
    return MOVED.has(e.status) && e.direction === 'out' && d && d >= a && d <= b;
  });

  if (!hist.length) {
    return refuse({ label: 'Forecast' }, {
      question: 'What is next month likely to cost?',
      because: 'There is no history to learn from. You have not recorded any spending in this window.',
      weWillNot: 'We will not make up a budget out of nothing and present it as if it came from your life.',
      whatWouldUnblockThis: 'Record a month or two of spending. Then ask again.',
    });
  }

  // How many whole months of history? Used to work out a per-month figure — for
  // the categories where a per-month figure is an honest thing to produce.
  const months = Math.max(1, Math.round(daysBetween(a, b) / 30.44));

  const byCat = new Map();
  for (const e of hist) {
    const k = e.category || 'uncategorised';
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k).push({ on: parseDay(e.occurredOn || e.date), amount: UGX(e.actual != null ? e.actual : e.expected) });
  }

  const lines = [];
  const lumpy = [];
  const skipped = [];

  for (const [category, obs] of byCat) {
    if (obs.length < MIN_OBSERVATIONS) {
      skipped.push({
        category, seen: obs.length,
        why: `Seen ${obs.length} time${obs.length === 1 ? '' : 's'}. Too thin to forecast — a budget from ${obs.length} observation${obs.length === 1 ? '' : 's'} is not a plan, it is a hunch with a number on it.`,
      });
      continue;
    }

    // Which months did it appear in? A category that shows up in 2 of 6 months is
    // NOT a monthly cost, however neatly it averages.
    const monthsSeen = new Set(obs.map((o) => `${o.on.getUTCFullYear()}-${o.on.getUTCMonth()}`)).size;
    const everyMonth = monthsSeen >= Math.max(2, months - 1);

    const total = obs.reduce((s, o) => s + o.amount, 0);
    const perMonth = Math.round(total / months);
    const amounts = obs.map((o) => o.amount);
    const cv = stdev(amounts) / (mean(amounts) || 1);

    if (!everyMonth) {
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 A LUMP. DO NOT AVERAGE IT. NAME IT, DATE IT, AND SIZE IT.
      //
      // School fees appeared in 2 of the last 6 months. The average — 200,000 a
      // month — is a figure that was TRUE IN NONE OF THEM.
      // ═══════════════════════════════════════════════════════════════════════
      const gaps = [];
      const sorted = [...obs].sort((x, y) => x.on - y.on);
      for (let i = 1; i < sorted.length; i++) gaps.push(daysBetween(sorted[i - 1].on, sorted[i].on));
      const last = sorted[sorted.length - 1];
      const nextDue = gaps.length ? iso(addDays(last.on, median(gaps))) : null;

      lumpy.push({
        category,
        typicalAmount: median(amounts),
        appearedInMonths: monthsSeen,
        ofMonths: months,
        lastOn: iso(last.on),
        nextDue,
        wouldHaveAveraged: perMonth,
        why: `This did not happen every month — it appeared in ${monthsSeen} of ${months}. Spreading it evenly would put ${perMonth.toLocaleString()} a month in your budget, and that figure would have been WRONG IN EVERY ONE OF THOSE MONTHS. It arrives in full, on one day, exactly as it always has.`,
        budgetItAs: nextDue
          ? `About ${median(amounts).toLocaleString()}, around ${nextDue}.`
          : `About ${median(amounts).toLocaleString()}, when it next comes.`,
      });
      continue;
    }

    lines.push({
      category,
      suggested: cv > ERRATIC ? median(amounts) * Math.round(obs.length / months) : perMonth,
      range: cv > ERRATIC ? [Math.min(...amounts), Math.max(...amounts)] : null,
      erratic: cv > ERRATIC,
      seen: obs.length,
      monthsSeen,
      // 🔑 SHOW THE WORKING. This is the entire brand.
      working: cv > ERRATIC
        ? `Over ${months} month${months === 1 ? '' : 's'} this ran between ${Math.min(...amounts).toLocaleString()} and ${Math.max(...amounts).toLocaleString()} (median ${median(amounts).toLocaleString()}). It is not steady, so this is a range, not a promise.`
        : `Over ${months} month${months === 1 ? '' : 's'} you spent ${total.toLocaleString()} on this, across ${obs.length} transactions. That is ${perMonth.toLocaleString()} a month.`,
    });
  }

  lines.sort((x, y) => y.suggested - x.suggested);

  return {
    forPeriod: forPeriod || null,
    basedOn: { from: iso(a), to: iso(b), months, transactions: hist.length },

    lines,
    lumpy,
    tooThinToForecast: skipped,

    suggestedMonthlyTotal: lines.reduce((s, l) => s + l.suggested, 0),

    // 🔴 THE MOST IMPORTANT FIELD ON THE OBJECT.
    thisIsASuggestion: 'This is a SUGGESTED BUDGET, not a plan and certainly not money. Accept it, change it, or throw it away — nothing here becomes real until you say so.',
    whatThisCannotSee: [
      'A school term starting. A funeral. A wedding. A medical emergency.',
      'A price rise — this assumes things cost what they cost last time.',
      'Anything you have never bought before, which is most of what goes wrong.',
    ],
  };
}

module.exports = { recurringItems, suggestBudget, MIN_OBSERVATIONS, ERRATIC };
