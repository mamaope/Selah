/**
 * SELAH — PERIODS, CATEGORIES, AND BUDGET vs ACTUAL
 * ─────────────────────────────────────────────────────────────────────────────
 * THE TRANSACTION IS THE ATOM. Every entry carries a DATE.
 *
 * A period is therefore not a container you put things into. It is a VIEW over
 * dated facts: this week, this month, this quarter, this year. You record once,
 * and every rollup is derived. Nothing is ever entered twice, and no two views can
 * disagree — because there is only one set of facts underneath them.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE LAW OF THIS MODULE:  YOU CANNOT AVERAGE A LUMPY EXPENSE.
 *
 * School fees are NOT one-third of a term each month. Rent paid six months up front
 * is NOT a monthly cost. A bull bought at Christmas is not 1/12th of a bull in May.
 *
 * The tempting thing — the thing every budgeting app does — is to make periods
 * comparable by PRO-RATING: divide the annual figure by twelve, multiply the
 * monthly one by three. Every month then looks tidy, every month looks on-budget,
 * and the numbers reconcile beautifully.
 *
 * And then the term bill lands and the money is not there.
 *
 * Averaging a lump does not smooth the cost. It smooths the WARNING. The cost
 * arrives in full, on one day, exactly as it always did — and the app that spread
 * it evenly across the year is the reason nobody saw it coming.
 *
 * So, in this module:
 *
 *     ACTUALS aggregate perfectly. They are dated facts. Sum them over any window.
 *
 *     BUDGETS DO NOT AGGREGATE. They are summed as INSTANCES — July's budget plus
 *     August's plus September's — and a budget that only PARTLY overlaps the window
 *     is EXCLUDED AND NAMED, never sliced.
 *
 * There is no divide-by-twelve in this file. There never will be.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { UGX, refuse } = require('./engine');

/** Only money that MOVED. A draft is not a fact and belongs in no total. */
const MOVED = new Set(['confirmed', 'unplanned']);
const SPEND = (e) => e.direction === 'out';
const EARN  = (e) => e.direction === 'in';
// 🔴 A transfer is neither. It moves money between your own pockets.
const REAL  = (e) => e.direction === 'in' || e.direction === 'out';

/**
 * The starter categories — Ugandan life, not a Silicon Valley budgeting app's idea
 * of it. Every one of these is editable, renameable and deletable. They exist so
 * that a person's FIRST screen is not an empty list, which is the single most
 * common reason a budgeting app is abandoned before anything is ever entered.
 */
const DEFAULT_CATEGORIES = [
  // money in
  { key: 'salary',        label: 'Salary',                    direction: 'in'  },
  { key: 'business',      label: 'Business / shop takings',   direction: 'in'  },
  { key: 'consultancy',   label: 'Consultancy / freelance',   direction: 'in'  },
  { key: 'rent_income',   label: 'Rent received',             direction: 'in'  },
  { key: 'gifts_in',      label: 'Gifts / support received',  direction: 'in'  },

  // money out — the ones that actually empty a Ugandan wallet
  { key: 'rent',          label: 'Rent',                      direction: 'out' },
  { key: 'food',          label: 'Food',                      direction: 'out' },
  { key: 'transport',     label: 'Transport (boda, taxi, fuel)', direction: 'out' },
  { key: 'airtime',       label: 'Airtime & data',            direction: 'out' },
  { key: 'utilities',     label: 'Water, electricity (Yaka)', direction: 'out' },
  { key: 'school_fees',   label: 'School fees',               direction: 'out', lumpy: true,
    note: '🔴 Termly, not monthly. This is the single largest predictable shock in most Ugandan households, and it is NOT one-third of a term each month.' },
  { key: 'medical',       label: 'Medical',                   direction: 'out' },
  { key: 'family',        label: 'Family & contributions',    direction: 'out',
    note: 'Money sent home, burials, weddings, introductions. Real, recurring, and almost never budgeted for.' },
  { key: 'worship',       label: 'Church / mosque',           direction: 'out' },
  { key: 'loan_repay',    label: 'Loan repayment',            direction: 'out' },
  { key: 'savings',       label: 'Savings & SACCO',           direction: 'out',
    note: 'Only a real outflow if the money LEAVES your accounts. Moving it to your own savings account is a TRANSFER, not spending.' },
  { key: 'stock',         label: 'Business stock',            direction: 'out' },
  { key: 'other',         label: 'Other',                     direction: 'out' },
];

// ── dates: UTC calendar days. A day is a day. ────────────────────────────────
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
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Which bucket does a date fall in, at this granularity? */
function bucketOf(d, granularity) {
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
  switch (granularity) {
    case 'day':     return { key: iso(d), label: `${d.getUTCDate()} ${MONTHS[m - 1]}` };
    case 'week': {
      const dow = (d.getUTCDay() + 6) % 7;                    // Monday = 0
      const s = new Date(d.getTime() - dow * 86400000);
      return { key: iso(s), label: `w/c ${s.getUTCDate()} ${MONTHS[s.getUTCMonth()]}` };
    }
    case 'month':   return { key: `${y}-${String(m).padStart(2, '0')}`, label: `${MONTHS[m - 1]} ${y}` };
    case 'quarter': { const q = Math.floor((m - 1) / 3) + 1; return { key: `${y}-Q${q}`, label: `Q${q} ${y}` }; }
    case 'year':    return { key: String(y), label: String(y) };
    default:        return null;
  }
}

const amountOf = (e) => UGX(e.actual != null ? e.actual : e.expected != null ? e.expected : e.amount);
const dateOf = (e) => parseDay(e.occurredOn || e.date);

/**
 * ACTUALS over a window. Dated facts, summed. This part is easy and honest.
 *
 * 🔴 An entry with NO DATE cannot be placed in any period. We do not "assume today"
 * — that would silently drop a June expense into July and no total would ever
 * disagree. It is reported as undated, by name, and counted in NOTHING.
 */
function actuals(entries, from, to) {
  const a = parseDay(from), b = parseDay(to);
  if (!a || !b) return null;

  const all = (Array.isArray(entries) ? entries : []).filter((e) => MOVED.has(e.status) && REAL(e));

  const undated = all.filter((e) => !dateOf(e));
  const dated = all.filter((e) => {
    const d = dateOf(e);
    return d && d >= a && d <= b;
  });

  const income  = dated.filter(EARN).reduce((s, e) => s + amountOf(e), 0);
  const spend   = dated.filter(SPEND).reduce((s, e) => s + amountOf(e), 0);

  const byCategory = {};
  for (const e of dated) {
    const k = e.category || 'uncategorised';
    byCategory[k] = byCategory[k] || { category: k, in: 0, out: 0, count: 0 };
    byCategory[k][e.direction] += amountOf(e);
    byCategory[k].count += 1;
  }

  return {
    from: iso(a), to: iso(b),
    income, spend, net: income - spend,
    count: dated.length,
    byCategory: Object.values(byCategory).sort((x, y) => (y.out + y.in) - (x.out + x.in)),

    // 🔴 Named, never silently dropped, never silently dated.
    undated: undated.map((e) => ({ label: e.label, amount: amountOf(e) })),
    undatedWarning: undated.length
      ? `${undated.length} entr${undated.length === 1 ? 'y has' : 'ies have'} no date, so ${undated.length === 1 ? 'it belongs' : 'they belong'} to no period and ${undated.length === 1 ? 'is' : 'are'} counted in nothing. We will not guess when they happened.`
      : null,
  };
}

/** The same facts, cut into buckets — the trend line. */
function series(entries, from, to, granularity) {
  const a = parseDay(from), b = parseDay(to);
  if (!a || !b || !bucketOf(a, granularity)) {
    return refuse({ label: 'Books' }, {
      question: 'Over what period?',
      because: `"${granularity}" is not a period we know. It must be one of: day, week, month, quarter, year.`,
      weWillNot: 'We will not guess how you want your money grouped.',
      whatWouldUnblockThis: 'Pick day, week, month, quarter or year.',
    });
  }

  const buckets = new Map();
  for (const e of (Array.isArray(entries) ? entries : [])) {
    if (!MOVED.has(e.status) || !REAL(e)) continue;
    const d = dateOf(e);
    if (!d || d < a || d > b) continue;
    const bk = bucketOf(d, granularity);
    if (!buckets.has(bk.key)) buckets.set(bk.key, { key: bk.key, label: bk.label, in: 0, out: 0, net: 0, count: 0 });
    const row = buckets.get(bk.key);
    row[e.direction] += amountOf(e);
    row.net = row.in - row.out;
    row.count += 1;
  }
  return {
    granularity,
    buckets: [...buckets.values()].sort((x, y) => (x.key < y.key ? -1 : 1)),
  };
}

/**
 * BUDGET vs ACTUAL.
 *
 * 🔴 THE ONE FUNCTION IN SELAH THAT MOST WANTS TO LIE TO YOU.
 *
 * A budget is an INSTANCE with a start and an end: "Home / school fees / Term 2
 * 2026 = 1,200,000". To compare a window against budget we SUM the instances that
 * FALL INSIDE IT. We never slice one, and we never divide one.
 *
 * A budget that only PARTLY overlaps the window is EXCLUDED AND NAMED. Including
 * a fraction of it would be pro-rating by another name, and pro-rating a lump is
 * how a person is on-budget every single month right up until the day they are
 * 1,200,000 short.
 */
function budgetVsActual(budgets, entries, from, to) {
  const a = parseDay(from), b = parseDay(to);
  if (!a || !b) return null;

  const act = actuals(entries, from, to);
  const bs = Array.isArray(budgets) ? budgets : [];

  const inside = [];
  const straddling = [];

  for (const g of bs) {
    const s = parseDay(g.startsOn), e = parseDay(g.endsOn);
    if (!s || !e) continue;
    if (s >= a && e <= b) inside.push(g);
    else if (e >= a && s <= b) straddling.push(g);       // overlaps, but is not contained
  }

  // Sum the budget INSTANCES, by category. No division. Ever.
  const planned = {};
  for (const g of inside) {
    const k = g.category;
    planned[k] = planned[k] || { category: k, budgeted: 0, instances: 0, direction: g.direction === 'in' ? 'in' : 'out' };
    planned[k].budgeted += UGX(g.amount);
    planned[k].instances += 1;
  }

  const actualBy = {};
  for (const c of act.byCategory) actualBy[c.category] = c;

  const rows = [];
  for (const k of new Set([...Object.keys(planned), ...Object.keys(actualBy)])) {
    const p = planned[k];
    const c = actualBy[k] || { in: 0, out: 0, count: 0 };
    const spent = UGX(c.out);
    const earned = UGX(c.in);
    const budgeted = p ? p.budgeted : null;

    rows.push({
      category: k,
      budgeted,                          // null = you never planned for this
      actual: spent || earned,
      spent, earned,
      variance: budgeted === null ? null : budgeted - spent,
      over: budgeted !== null && spent > budgeted,
      overBy: budgeted !== null && spent > budgeted ? spent - budgeted : 0,
      percentUsed: budgeted ? Math.round((spent / budgeted) * 100) : null,
      count: c.count,

      // 🔴 Spending you never planned for. Not an error — usually the most
      //    interesting line on the page.
      unplanned: budgeted === null && spent > 0,
    });
  }
  rows.sort((x, y) => y.actual - x.actual);

  // 🔑 BUDGETS HAVE A DIRECTION, AND THE TWO MUST NOT BE ADDED TOGETHER.
  //    What you plan to SPEND and what you expect to EARN are different questions;
  //    summing them and comparing spending to the total is meaningless.
  const totalExpenseBudgeted = Object.values(planned).filter((p) => p.direction !== 'in').reduce((s, p) => s + p.budgeted, 0);
  const totalIncomeBudgeted  = Object.values(planned).filter((p) => p.direction === 'in').reduce((s, p) => s + p.budgeted, 0);
  const totalBudgeted = totalExpenseBudgeted;   // "budgeted" means what you planned to spend

  return {
    from: iso(a), to: iso(b),
    rows,
    totalBudgeted,
    totalExpenseBudgeted,
    totalIncomeBudgeted,               // what you expect to earn — the spending-is-on-track denominator
    totalSpent: act.spend,
    totalIncome: act.income,
    variance: totalBudgeted - act.spend,
    over: act.spend > totalBudgeted,

    /**
     * 🔴 SAID OUT LOUD, EVERY TIME.
     */
    budgetsExcluded: straddling.map((g) => ({
      category: g.category, label: g.label || null,
      startsOn: g.startsOn, endsOn: g.endsOn, amount: UGX(g.amount),
    })),
    whyExcluded: straddling.length
      ? 'These budgets only PARTLY overlap the period you are looking at, so they are not counted. We will not include a slice of one — a school-fees budget is not one-third of a term each month, and pretending otherwise is how a person is on-budget every month until the day the bill lands.'
      : null,

    howBudgetsWereCounted: 'We SUMMED the budgets that fall entirely inside this window. Nothing was divided, averaged or spread. There is no divide-by-twelve in Selah.',

    unplannedSpending: rows.filter((r) => r.unplanned).reduce((s, r) => s + r.spent, 0),
    undated: act.undated,
    undatedWarning: act.undatedWarning,
  };
}

module.exports = {
  DEFAULT_CATEGORIES, MOVED,
  actuals, series, budgetVsActual, bucketOf,
  iso, parseDay, day,
};
