/**
 * SELAH — PASSWORDS
 * ─────────────────────────────────────────────────────────────────────────────
 * scrypt, from Node's own crypto. NOT bcrypt, NOT argon2 — both are native
 * addons that must be compiled, and a native build step inside an Alpine image is
 * a supply-chain surface and a build failure waiting to happen. scrypt is in the
 * standard library, is memory-hard, and is what we can actually reason about.
 *
 * 🔴 WHAT A PASSWORD HASH IS FOR
 *
 * It is not to protect the password. It is to protect the USER — on the day our
 * database is copied, which is a day we should plan for rather than hope against.
 * A Ugandan's tax data is special personal data under the DPPA. If this table
 * leaks, the attacker gets what we chose to store, and nothing else.
 *
 * So: per-user random salt (no rainbow tables), memory-hard KDF (no cheap GPU
 * farm), constant-time comparison (no timing oracle), and the parameters written
 * INTO the stored string, so we can raise the cost later without locking anybody
 * out of their own account.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const crypto = require('crypto');

// N=2^15 (32,768) × r=8 × 128 bytes ≈ 32 MB per hash. Deliberate.
// A password check should be cheap for one honest user and ruinous for someone
// trying eight million of them.
const N = 32768, R = 8, P = 1, KEYLEN = 32, SALTLEN = 16;
const MAXMEM = 64 * 1024 * 1024;   // scrypt refuses above this; must exceed 128*N*r

/**
 * 🔴 A LENGTH CAP IS A DENIAL-OF-SERVICE CONTROL, NOT A NAG.
 *
 * scrypt costs the SERVER 32 MB. Hand it a 10 MB password and you have found a
 * way to make our own login endpoint exhaust our own memory, for free, from a
 * laptop. Bcrypt implementations have shipped exactly this bug.
 *
 * Minimum 10 characters, and NO composition rules — no "must contain a symbol".
 * Those rules produce Passw0rd! and nothing else. Length is what buys entropy.
 */
const MIN = 10, MAX = 256;

/** The 20 or so passwords that a Ugandan tax product WILL be attacked with first. */
const OBVIOUS = new Set([
  'password', 'password1', 'password123', 'passw0rd', '123456789', '1234567890',
  'qwertyuiop', 'letmein123', 'iloveyou1', 'admin12345', 'welcome123',
  'selah12345', 'uganda1234', 'kampala123', 'changeme123', 'abcdefghij',
]);

function check(pw) {
  const s = String(pw == null ? '' : pw);
  if (s.length < MIN) {
    return { ok: false, error: 'PASSWORD_TOO_SHORT',
      message: `A password must be at least ${MIN} characters. Length is what protects you — not a capital letter and an exclamation mark.` };
  }
  if (s.length > MAX) {
    return { ok: false, error: 'PASSWORD_TOO_LONG',
      message: `A password may be at most ${MAX} characters.` };
  }
  if (OBVIOUS.has(s.toLowerCase())) {
    return { ok: false, error: 'PASSWORD_TOO_OBVIOUS',
      message: 'That is one of the first passwords anybody attacking this site will try. Please pick another.' };
  }
  return { ok: true };
}

function hash(pw) {
  const salt = crypto.randomBytes(SALTLEN);
  const key = crypto.scryptSync(String(pw), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  // The parameters travel WITH the hash, so we can make it costlier next year and
  // still verify every password stored this year.
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

function verify(pw, stored) {
  try {
    const [algo, n, r, p, saltB64, keyB64] = String(stored || '').split('$');
    if (algo !== 'scrypt') return false;

    const s = String(pw == null ? '' : pw);
    if (s.length > MAX) return false;          // never scrypt an attacker's 10 MB

    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(keyB64, 'base64');
    const actual = crypto.scryptSync(s, salt, expected.length,
      { N: Number(n), r: Number(r), p: Number(p), maxmem: MAXMEM });

    // 🔴 timingSafeEqual, ALWAYS. `a === b` on a hash leaks, byte by byte, how much
    // of the hash you got right — and a leak that slow is still a leak.
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  } catch (e) {
    return false;   // a malformed stored hash is a FAILED login, never a passed one
  }
}

/**
 * A random token for email verification and password reset.
 * Stored HASHED — a leaked reset table must not be a set of working reset links.
 */
function token() { return crypto.randomBytes(32).toString('base64url'); }
function tokenHash(t) { return crypto.createHash('sha256').update(String(t)).digest('hex'); }

module.exports = { check, hash, verify, token, tokenHash, MIN, MAX };
