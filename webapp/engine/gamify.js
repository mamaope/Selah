/**
 * SELAH — SAVINGS GAMIFICATION
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 REWARD A REAL THING, OR REWARD NOTHING. Every streak and every badge here is
 * earned by money that actually moved into a savings account, or a cushion that is
 * actually there. There is no confetti for a draft, no points for logging in, and
 * no badge you cannot see the reason for.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 A BROKEN STREAK IS NOT A FAILURE, AND WE DO NOT SHAME IT.
 *
 * A month where nothing was saved simply ends the current run. We keep your best
 * run so the effort is not erased, and we never scold. Life happens; the point is
 * to make the next good month easy to start, not to punish the bad one.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Consecutive recent months in which you saved (net money INTO savings).
 * @param months  DENSE chronological array [{ month:'YYYY-MM', net }] oldest→newest,
 *                one entry per calendar month (net may be 0 or negative).
 */
function savingStreak(months) {
  const ms = Array.isArray(months) ? months : [];

  // current = trailing run of months with a positive net save
  let current = 0;
  for (let i = ms.length - 1; i >= 0; i--) {
    if (Number(ms[i].net) > 0) current++; else break;
  }

  // best = longest such run anywhere in the window (so effort is never erased)
  let best = 0, run = 0;
  for (const m of ms) {
    if (Number(m.net) > 0) { run++; if (run > best) best = run; } else run = 0;
  }

  return {
    current,
    best,
    savedThisMonth: ms.length ? Number(ms[ms.length - 1].net) > 0 : false,
    // 🔴 no shame — a gentle line for the state you are in
    says: current >= 3 ? `${current} months running. This is the habit now.`
        : current >= 1 ? `${current} month${current === 1 ? '' : 's'} running — keep it going.`
        : best > 0 ? `Streak reset — your best run was ${best}. Start a new one this month.`
        : 'Save anything into a savings account this month to start a streak.',
  };
}

// The badges. Each says exactly what earns it — no mystery achievements.
const BADGES = [
  { key: 'first_save',   label: 'First shilling saved',   blurb: 'Money in a savings account. You started.',            earned: (s) => s.totalSaved > 0 },
  { key: 'ef_opened',    label: 'Emergency fund opened',  blurb: 'A cushion in its own account.',                       earned: (s) => s.hasEmergencyFund },
  { key: 'saved_100k',   label: '100,000 saved',          blurb: 'Six figures set aside.',                              earned: (s) => s.totalSaved >= 100_000 },
  { key: 'one_month',    label: 'One month of runway',    blurb: 'One month between you and a bad week.',               earned: (s) => s.resilienceLevel >= 1 },
  { key: 'saved_1m',     label: '1,000,000 saved',        blurb: 'A million shillings, kept.',                          earned: (s) => s.totalSaved >= 1_000_000 },
  { key: 'streak_3',     label: 'Three months running',   blurb: 'Saved three months in a row — a habit, not a fluke.', earned: (s) => s.currentStreak >= 3 },
  { key: 'three_months', label: 'Three months of runway', blurb: 'Most emergencies are survivable from here.',          earned: (s) => s.resilienceLevel >= 2 },
  { key: 'goal_reached', label: 'First goal reached',     blurb: 'You set a target and hit it.',                        earned: (s) => s.goalsReached >= 1 },
  { key: 'saved_5m',     label: '5,000,000 saved',        blurb: 'Serious money, working for you.',                     earned: (s) => s.totalSaved >= 5_000_000 },
  { key: 'six_months',   label: 'Six months of runway',   blurb: 'Solid. A lost job will not sink you.',                earned: (s) => s.resilienceLevel >= 3 },
  { key: 'streak_6',     label: 'Half a year steady',     blurb: 'Six months of saving in a row.',                      earned: (s) => s.currentStreak >= 6 },
  { key: 'investing',    label: 'Into investing',         blurb: 'A year of runway — money past this can be put to work.', earned: (s) => s.resilienceLevel >= 4 },
];

/**
 * @param state { totalSaved, hasEmergencyFund, resilienceLevel, currentStreak, goalsReached }
 */
function badges(state) {
  const s = { totalSaved: 0, hasEmergencyFund: false, resilienceLevel: 0, currentStreak: 0, goalsReached: 0, ...(state || {}) };
  const earned = [], locked = [];
  for (const b of BADGES) {
    const row = { key: b.key, label: b.label, blurb: b.blurb };
    (b.earned(s) ? earned : locked).push(row);
  }
  return {
    earned,
    locked,
    count: earned.length,
    total: BADGES.length,
    next: locked[0] || null,     // the nearest one to chase
  };
}

module.exports = { savingStreak, badges, BADGES };
