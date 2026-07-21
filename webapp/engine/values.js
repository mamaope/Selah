/**
 * SELAH — VALUE TRACKING
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 A VALUE HAS A HISTORY, AND THE HISTORY IS THE DATA.
 *
 * Gas is 100,000 this month. A budget app stores "100,000" and moves on. Next month
 * it is 105,000 and the app quietly overwrites the old number — and the single most
 * useful fact, THAT IT WENT UP, is gone.
 *
 * So Selah never overwrites a default. It APPENDS a dated point. Your salary was
 * 1,000,000, then 1,200,000 — and now we can tell you it grew 20%, roughly how fast
 * it is growing, and what it might be next if the trend holds. The same machine
 * shows a price creeping up (inflation you can see) and an income climbing (growth
 * you can measure).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE RULES, AND THEY ARE THE USUAL SELAH RULES
 *
 *   1. A point is {amount, asOf}. We keep every one. Updating a value is ADDING a
 *      point, never editing the last — the change is what we came for.
 *   2. A PROJECTION IS A GUESS, and it says so. "If the trend continues" is not a
 *      promise, and it is never money. With fewer than 3 points we do not project
 *      at all — two points is a line through a coincidence.
 *   3. We do not divide by a zero base. If the first value was 0, a percentage is
 *      meaningless; we show the absolute change and say so.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { UGX, refuse } = require('./engine');

const MIN_TO_PROJECT = 3;

function day(y, m, d) { return new Date(Date.UTC(y, m - 1, d)); }
function parseDay(s) {
  if (s instanceof Date) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const d = day(+m[1], +m[2], +m[3]);
  return isNaN(d.getTime()) ? null : d;
}
const iso = (dt) => dt.toISOString().slice(0, 10);
const monthsBetween = (a, b) => (b.getUTCFullYear() - a.getUTCFullYear()) * 12
  + (b.getUTCMonth() - a.getUTCMonth())
  + (b.getUTCDate() - a.getUTCDate()) / 30.44;

const pct = (from, to) => (from === 0 ? null : Math.round(((to - from) / from) * 1000) / 10);

/**
 * Track one named value over its history of dated points.
 *
 * @param points [{ amount, asOf }]
 * @param opts   { label, unit }   (unit is cosmetic — "per refill", "per month")
 */
function track(points, opts) {
  const o = opts || {};
  const pts = (Array.isArray(points) ? points : [])
    .map((p) => ({ amount: UGX(p.amount), on: parseDay(p.asOf || p.on) }))
    .filter((p) => p.on)
    .sort((a, b) => a.on - b.on);

  if (!pts.length) {
    return { label: o.label || null, points: 0, current: null,
      note: 'Nothing recorded yet. Add the value, and each time it changes, add the new one — the history is what tells you how it is moving.' };
  }

  const current = pts[pts.length - 1];
  const first = pts[0];
  const previous = pts.length >= 2 ? pts[pts.length - 2] : null;

  const series = pts.map((p) => ({ amount: p.amount, asOf: iso(p.on) }));

  // ── change since the last recorded value ─────────────────────────────────
  const sinceLast = previous ? {
    abs: current.amount - previous.amount,
    pct: pct(previous.amount, current.amount),
    from: previous.amount, fromOn: iso(previous.on),
    days: Math.round((current.on - previous.on) / 86400000),
  } : null;

  // ── change across the whole history ──────────────────────────────────────
  const spanMonths = monthsBetween(first.on, current.on);
  const sinceStart = pts.length >= 2 ? {
    abs: current.amount - first.amount,
    pct: pct(first.amount, current.amount),
    from: first.amount, fromOn: iso(first.on),
    months: Math.round(spanMonths * 10) / 10,
  } : null;

  // ── the growth RATE — compounding, per month — the honest "how fast" ─────
  //    (current/first)^(1/months) − 1. Guarded: needs a positive base and real time.
  let monthlyGrowthPct = null;
  if (first.amount > 0 && spanMonths >= 0.5) {
    monthlyGrowthPct = Math.round((Math.pow(current.amount / first.amount, 1 / spanMonths) - 1) * 1000) / 10;
  }

  const direction = !previous ? 'first'
    : current.amount > previous.amount ? 'up'
    : current.amount < previous.amount ? 'down' : 'flat';

  // ── the projection — a GUESS, labelled, and only with enough history ─────
  let projection = null;
  if (pts.length >= MIN_TO_PROJECT && monthlyGrowthPct !== null) {
    const nextIfTrend = UGX(current.amount * (1 + monthlyGrowthPct / 100));
    projection = {
      nextMonth: nextIfTrend,
      inSixMonths: UGX(current.amount * Math.pow(1 + monthlyGrowthPct / 100, 6)),
      basis: `at the ${monthlyGrowthPct}%/month it has averaged`,
      thisIsAGuess: 'If the trend continues — which it may not. This is a projection from your own history, not a fact, and not money. A price can jump; a raise can stall.',
    };
  } else if (pts.length < MIN_TO_PROJECT) {
    projection = {
      nextMonth: null,
      whyNot: `Only ${pts.length} value${pts.length === 1 ? '' : 's'} recorded. We will not project a trend from ${pts.length} — that is a guess wearing a suit. Record it a few more times.`,
    };
  }

  return {
    label: o.label || null,
    unit: o.unit || null,
    points: pts.length,
    current: { amount: current.amount, asOf: iso(current.on) },
    first: { amount: first.amount, asOf: iso(first.on) },
    direction,
    sinceLast,
    sinceStart,
    monthlyGrowthPct,
    projection,
    series,
    // a one-line human summary the UI can show without doing any maths
    says: summarise({ label: o.label, direction, sinceLast, sinceStart, monthlyGrowthPct, current }),
  };
}

function summarise(x) {
  const name = x.label || 'This';
  if (!x.sinceLast) return `${name} is ${x.current.amount.toLocaleString()}. First time recorded — nothing to compare yet.`;
  const arrow = x.direction === 'up' ? '▲' : x.direction === 'down' ? '▼' : '■';
  const move = x.sinceLast.pct === null
    ? `${x.sinceLast.abs >= 0 ? '+' : ''}${x.sinceLast.abs.toLocaleString()}`
    : `${x.sinceLast.pct >= 0 ? '+' : ''}${x.sinceLast.pct}%`;
  let s = `${name}: ${x.current.amount.toLocaleString()}  ${arrow} ${move} since ${x.sinceLast.fromOn}`;
  if (x.sinceStart && x.sinceStart.pct !== null && x.sinceStart.months >= 1) {
    s += `  ·  ${x.sinceStart.pct >= 0 ? '+' : ''}${x.sinceStart.pct}% over ${x.sinceStart.months} months`;
  }
  return s;
}

module.exports = { track, MIN_TO_PROJECT };
