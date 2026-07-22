/**
 * SELAH — SAVINGS GOALS
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 A GOAL IS A TARGET, A DATE, AND A POT. The pot is a real savings account —
 * the goal does not hold money of its own; it watches an account you are filling.
 *
 * From the target, the date, and how much is already in the account, Selah works
 * out the one number that matters: how much a month gets you there. If it also
 * knows your recent pace (what you have actually been putting in), it projects a
 * finish date — and says, out loud, that a projection is a guess.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 A PROJECTION IS A GUESS, AND A DEADLINE IN THE PAST IS NOT MOVED QUIETLY.
 *
 * We never invent a pace you have not set by saving. If the target date has already
 * passed and the goal is not met, we say it is overdue — we do not silently stretch
 * the plan to make the picture comfortable. If there is no date, there is no
 * required-monthly, and we say so rather than divide by a month count we do not have.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const { UGX } = require('./engine');

const DAY = 86400000;
const MONTH_DAYS = 30.436875;            // average, so a "month" is stable across the year

const parseDay = (d) => {
  if (!d) return null;
  const t = Date.parse(String(d).slice(0, 10) + 'T00:00:00Z');
  return Number.isNaN(t) ? null : t;
};
const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * @param goal { name, target, saved, targetDate?, monthlyContribution? }
 *   - saved               current balance of the backing account (minor units)
 *   - monthlyContribution recent pace, if known (minor units/month) — for the projection
 * @param opts { asOf }
 */
function assess(goal, opts = {}) {
  const asOf = opts.asOf || new Date().toISOString().slice(0, 10);
  const now = parseDay(asOf);

  const target = UGX(goal.target);
  const saved = UGX(goal.saved);
  const remaining = Math.max(0, target - saved);
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : null;
  const reached = target > 0 && saved >= target;

  // ── time left, and the required monthly to hit the date ──
  const targetMs = parseDay(goal.targetDate);
  let monthsLeft = null, requiredMonthly = null, overdue = false;
  if (targetMs != null) {
    monthsLeft = Math.round(((targetMs - now) / DAY / MONTH_DAYS) * 10) / 10;
    if (!reached && monthsLeft <= 0) overdue = true;
    else if (!reached && monthsLeft > 0) requiredMonthly = UGX(remaining / monthsLeft);
  }

  // ── projected finish, ONLY from a real pace you have set by saving ──
  const pace = UGX(goal.monthlyContribution);
  let projectedFinish = null, monthsAtPace = null;
  if (!reached && pace > 0) {
    monthsAtPace = Math.ceil(remaining / pace);
    projectedFinish = isoOf(now + monthsAtPace * MONTH_DAYS * DAY);
  }

  // ── are you on track? only answerable when we have both numbers ──
  let onTrack = null;
  if (requiredMonthly != null && pace > 0) onTrack = pace >= requiredMonthly;

  const says = reached
    ? 'Reached. 🎉'
    : overdue
      ? `The date has passed and ${fmt(remaining)} is still to go. Move the date, or keep going.`
      : requiredMonthly != null
        ? `Put in ${fmt(requiredMonthly)} a month to reach it by ${goal.targetDate}.`
        : targetMs != null
          ? 'The target date is here.'
          : `${fmt(remaining)} to go. Add a date and Selah will tell you the monthly.`;

  return {
    name: goal.name,
    target, saved, remaining, pct, reached,
    targetDate: goal.targetDate || null,
    monthsLeft, overdue,
    requiredMonthly,                       // null = no date, or already reached
    monthlyContribution: pace || null,
    projectedFinish,                       // 🔴 a guess — labelled as such in the UI
    monthsAtPace,
    onTrack,                               // null = not enough to say
    says,
  };
}

function fmt(n) { return Number(n || 0).toLocaleString(); }

module.exports = { assess };
