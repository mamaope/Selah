/**
 * SELAH — ENCRYPTION AT REST
 * ─────────────────────────────────────────────────────────────────────────────
 * Every field that identifies a person, or reveals their money, is encrypted
 * before it touches the database.
 *
 * 🔴 WHY NOT JUST DISK ENCRYPTION?
 *
 * Because disk encryption protects you from someone STEALING THE DISK. It does
 * not protect you from a leaked database dump, a misconfigured backup, a rogue
 * `pg_dump`, or a support engineer with read access and a bad week.
 *
 * The threat is not a burglar. The threat is a Tuesday.
 *
 * AES-256-GCM. Authenticated — so a tampered ciphertext fails to decrypt rather
 * than quietly returning a different number. On a tax platform that distinction
 * is not academic.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE KEY
 *
 *     SELAH_ENCRYPTION_KEY = 64 hex characters (32 bytes)
 *
 *     openssl rand -hex 32
 *
 * IT IS NOT IN THE REPOSITORY AND IT NEVER WILL BE. If you lose it, the data is
 * gone — and that is the correct behaviour, not a design flaw. A key you can
 * recover from the repo is a key an attacker can recover from the repo.
 *
 * The server REFUSES TO START without it. A tax platform that boots without its
 * encryption key would silently write every Ugandan's payslip to disk in
 * plaintext, and nobody would notice until it was in a paste bin.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 🔴 THE ERROR MESSAGE IS PART OF THE PRODUCT.
 *
 * This used to throw, in its entirety:
 *
 *     SELAH_INDEX_KEY is missing or malformed.
 *
 * And then the process exited 1, docker restarted it, it exited 1 again, and
 * nginx — patiently trying to connect to a container that kept dying — returned
 * 504 GATEWAY TIMEOUT to the user's browser.
 *
 * So a person trying to create an account was shown a TIMEOUT. Which pointed at
 * the network, and at nginx, and at the proxy config, and at DNS — at everything
 * except the one true cause, which was a single environment variable with the
 * wrong value in it. Hours can go into that.
 *
 * "Missing or malformed" is two completely different problems joined by an "or",
 * and it told you which one it was NOT. It did not say what it found, what it
 * wanted, where the file lives, or how to make a valid one.
 *
 * A fatal error gets ONE chance to explain itself. This is that chance.
 *
 * We never print the value — a wrong key can still be a near-miss of a real one.
 * We print its LENGTH and the OFFENDING CHARACTERS, which is everything you need
 * to diagnose it and nothing an attacker can use.
 * ═════════════════════════════════════════════════════════════════════════════
 */
function describeKey(name, raw) {
  const v = raw === undefined || raw === null ? '' : String(raw);

  if (v.trim() === '') {
    return `${name} is NOT SET. It is empty, or it is not reaching the container at all.`;
  }
  const bad = [...new Set(v.split('').filter((c) => !/[0-9a-fA-F]/.test(c)))]
    .map((c) => (c === ' ' ? "' ' (a space)" : JSON.stringify(c)));

  if (bad.length) {
    return `${name} is SET, but it is not hexadecimal.\n` +
           `      It is ${v.length} characters long, and contains ${bad.length} character type(s) ` +
           `that are not hex digits: ${bad.slice(0, 8).join(', ')}\n` +
           `      (If that looks like the words of a shell command, the command was pasted\n` +
           `       into the .env file instead of being RUN and its OUTPUT pasted.)`;
  }
  return `${name} is SET and is valid hex, but it is ${v.length} characters long. It must be exactly 64.`;
}

function keyProblem(name, raw) {
  const v = raw === undefined || raw === null ? '' : String(raw);
  return /^[0-9a-fA-F]{64}$/.test(v) ? null : describeKey(name, raw);
}

/** Every problem at once. Fixing one thing to be told about the next is a waste of a life. */
function keyFailure(problems) {
  return new Error(
    '\n\n🔴 SELAH WILL NOT START.\n\n' +
    problems.map((p) => '  ✗ ' + p).join('\n\n') + '\n\n' +
    '  ── HOW TO FIX IT ────────────────────────────────────────────────────\n\n' +
    '  Each key must be EXACTLY 64 hexadecimal characters (32 bytes). Generate them:\n\n' +
    '      openssl rand -hex 32        # run this, and paste the OUTPUT\n\n' +
    '  Put them in a file called  .env  IN THE SAME FOLDER AS docker-compose.yml\n' +
    '  (that is  platform/.env  — docker compose does NOT read a .env from the\n' +
    '  repository root), with no quotes and no spaces around the "=":\n\n' +
    '      SELAH_ENCRYPTION_KEY=3f9a...   # 64 hex characters\n' +
    '      SELAH_INDEX_KEY=b71c...        # 64 hex characters, DIFFERENT from the above\n\n' +
    '  Then:  docker compose up -d --force-recreate\n\n' +
    '  ── WHY THIS IS FATAL, RATHER THAN A WARNING ─────────────────────────\n\n' +
    '  Without the encryption key, this server would write every Ugandan\'s payslip\n' +
    '  to disk in PLAINTEXT, and nobody would notice until it was in a paste bin.\n\n' +
    '  Without the index key, we could not look up a taxpayer without holding a\n' +
    '  readable list of who they are — which is the thing we promised not to hold.\n\n' +
    '  A tax platform that boots without its keys is worse than one that does not boot.\n'
  );
}

const ALGO = 'aes-256-gcm';
const KEY_HEX = process.env.SELAH_ENCRYPTION_KEY || '';

function key() {
  const p = keyProblem('SELAH_ENCRYPTION_KEY', KEY_HEX);
  if (p) throw keyFailure([p]);
  return Buffer.from(KEY_HEX, 'hex');
}

/** Encrypt. Returns a single self-describing string: v1:iv:tag:ciphertext */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined) return null;
  const iv = crypto.randomBytes(12);                    // GCM wants 96 bits
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

/** Decrypt. THROWS on tampering — it does not return a plausible wrong answer. */
function decrypt(blob) {
  if (blob === null || blob === undefined) return null;
  const parts = String(blob).split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Ciphertext is not in the expected format. Refusing to guess at it.');
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const decipher = crypto.createDecipheriv(ALGO, key(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  // If the ciphertext or the tag has been touched, .final() throws. Good.
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
}

/**
 * 🔑 A BLIND INDEX — so we can look someone up WITHOUT storing their phone number.
 *
 * You cannot query an encrypted column (every ciphertext is different, by design).
 * But we must be able to find a user by phone at login.
 *
 * So: an HMAC of the phone number, with a SEPARATE key. It is deterministic —
 * the same phone always gives the same index — so we can index and query it.
 * And it is one-way: the index cannot be turned back into the number.
 *
 * A leaked database therefore yields an encrypted phone and a hash of it, and
 * neither one is a phone number.
 */
function blindIndex(value) {
  const idxKey = process.env.SELAH_INDEX_KEY || KEY_HEX;   // separate key in prod
  const p = keyProblem('SELAH_INDEX_KEY', idxKey);
  if (p) throw keyFailure([p]);
  return crypto.createHmac('sha256', Buffer.from(idxKey, 'hex'))
    .update(String(value).trim().toLowerCase())
    .digest('hex');
}

/**
 * Fail fast, at boot, not on the first payslip — and report EVERY problem at once.
 *
 * The old version checked the encryption key, threw, and never looked at the index
 * key. So you fixed one variable, restarted, and were told about the next. Each
 * cycle is a rebuild and a wait, and each one tells you the least it possibly can.
 */
function assertReady() {
  const problems = [
    keyProblem('SELAH_ENCRYPTION_KEY', KEY_HEX),
    keyProblem('SELAH_INDEX_KEY', process.env.SELAH_INDEX_KEY || KEY_HEX),
  ].filter(Boolean);

  if (problems.length) throw keyFailure(problems);

  // 🔴 The two keys must not be the SAME key. The blind index is an HMAC used to
  // look a taxpayer up; the encryption key protects the ciphertext. One key doing
  // both jobs means a single leak destroys both properties at once.
  if (process.env.SELAH_INDEX_KEY && process.env.SELAH_INDEX_KEY === KEY_HEX) {
    console.warn('\n  ⚠ SELAH_INDEX_KEY is IDENTICAL to SELAH_ENCRYPTION_KEY.\n' +
                 '    They must be two different keys — one leak should not cost you both.\n');
  }
  return true;
}

module.exports = { encrypt, decrypt, blindIndex, assertReady };
