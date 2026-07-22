/**
 * SELAH — GAMIFICATION, EXECUTED
 * Streaks and badges are earned by real saved money. A broken streak keeps the
 * best run and never shames. Every badge says what earns it.
 */
const assert = require('assert');
const G = require('./gamify');

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); pass++; } catch (e) { fail++; console.error(`  \x1b[31m✗ ${n}\x1b[0m\n      ${e.message}`); } };

const M = (nets) => nets.map((net, i) => ({ month: '2026-' + String(i + 1).padStart(2, '0'), net }));

// ── STREAKS ──────────────────────────────────────────────────────────────────

t('🔑 current streak = trailing months with a positive net save', () => {
  const r = G.savingStreak(M([100, 0, 200, 300, 400]));   // last 3 positive
  assert.strictEqual(r.current, 3);
  assert.strictEqual(r.savedThisMonth, true);
});

t('🔴 a zero/negative month ends the current streak', () => {
  const r = G.savingStreak(M([100, 200, 300, 0]));         // last month saved nothing
  assert.strictEqual(r.current, 0);
  assert.strictEqual(r.savedThisMonth, false);
});

t('🔴 the BEST run is kept even after a reset — effort is not erased', () => {
  const r = G.savingStreak(M([100, 200, 300, 0, 100]));    // best run was 3
  assert.strictEqual(r.best, 3);
  assert.strictEqual(r.current, 1);
  assert.ok(/running/.test(r.says));   // current run is 1, best kept at 3
});

t('no history is honest, not a crash', () => {
  const r = G.savingStreak([]);
  assert.strictEqual(r.current, 0);
  assert.strictEqual(r.best, 0);
});

// ── BADGES ───────────────────────────────────────────────────────────────────

t('🔑 badges are earned by real state, and each is either earned or locked', () => {
  const b = G.badges({ totalSaved: 1_200_000, hasEmergencyFund: true, resilienceLevel: 2, currentStreak: 3, goalsReached: 1 });
  const keys = b.earned.map((x) => x.key);
  assert.ok(keys.includes('first_save'));
  assert.ok(keys.includes('ef_opened'));
  assert.ok(keys.includes('saved_1m'));
  assert.ok(keys.includes('one_month'));
  assert.ok(keys.includes('three_months'));
  assert.ok(keys.includes('streak_3'));
  assert.ok(keys.includes('goal_reached'));
  assert.strictEqual(b.earned.length + b.locked.length, b.total);
});

t('🔴 nothing saved → no badges, and a next one to chase', () => {
  const b = G.badges({ totalSaved: 0 });
  assert.strictEqual(b.count, 0);
  assert.ok(b.next && b.next.key === 'first_save');
});

t('the 5,000,000 and six-months badges stay locked until truly earned', () => {
  const b = G.badges({ totalSaved: 1_000_000, resilienceLevel: 2 });
  const locked = b.locked.map((x) => x.key);
  assert.ok(locked.includes('saved_5m'));
  assert.ok(locked.includes('six_months'));
});

t('every badge carries a reason you can read', () => {
  assert.ok(G.BADGES.every((b) => b.label && b.blurb));
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} GAMIFY TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} GAMIFY TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
