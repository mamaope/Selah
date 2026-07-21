/**
 * SELAH — SEED A READY-TO-USE ADMIN LOGIN
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a VERIFIED account at boot, so you can sign in immediately — no
 * registration, no email-confirmation step (which does not work until a mail
 * provider is wired anyway).
 *
 * 🔴 THE PASSWORD IS NEVER IN THE CODE. It comes from an environment variable you
 *    control, and it is scrypt-hashed the moment it is read. A default admin
 *    password baked into an image is the "default credentials" breach — anyone who
 *    reads the repo, or pulls the image, can log in to production. We do not ship
 *    that. No SEED_ADMIN_* env vars → no seed, no warning, nothing.
 *
 * 🔴 "ADMIN" GRANTS NO SPECIAL POWER. See 005_admin.sql. It is a verified login,
 *    flagged for the day admin features exist. It cannot read anyone else's data,
 *    because nothing in Selah can.
 *
 * Set, in your .env:
 *     SEED_ADMIN_EMAIL=you@yourdomain.ug
 *     SEED_ADMIN_PASSWORD=<at least 10 characters>
 *     SEED_ADMIN_KIND=individual        # or 'entity'. Defaults to individual.
 *
 * Then REMOVE them once the account exists, and change the password from inside
 * the app if you ever add that. The seed is idempotent — it will not recreate or
 * silently reset an account that is already there.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const db = require('./db');
const { encrypt, blindIndex } = require('./crypto');
const pw = require('./password');

async function seedAdmin() {
  const crypto = require('crypto');
  const email = String(process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  let password = process.env.SEED_ADMIN_PASSWORD || '';
  const kind = process.env.SEED_ADMIN_KIND === 'entity' ? 'entity' : 'individual';

  // 🔴 OPT-IN ONLY. No env, no seed. A seed that runs by default is a backdoor.
  if (!email && !password) return { seeded: false, reason: 'not requested' };

  // 🔑 GAVE AN EMAIL BUT NO PASSWORD? We generate a STRONG one and print it ONCE,
  //    below. This is how you get a working admin without ever choosing — or
  //    storing in a file — a password yourself. Grab it from the boot logs.
  let generated = false;
  if (email && !password) {
    password = crypto.randomBytes(12).toString('base64url');   // ~16 chars, unguessable
    generated = true;
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('\n  🔴 SEED_ADMIN_PASSWORD is set but SEED_ADMIN_EMAIL is missing or not an email. No admin was seeded.\n');
    return { seeded: false, reason: 'bad email' };
  }

  // 🔴 THE SAME STRENGTH RULE AS EVERY OTHER PASSWORD. A weak seeded admin is a
  //    weak door into everything.
  const strength = pw.check(password);
  if (!strength.ok) {
    console.error(`\n  🔴 SEED_ADMIN_PASSWORD is too weak (${strength.error}). No admin was seeded.`);
    console.error('     A seeded login is a permanent one — it deserves a real password.\n');
    return { seeded: false, reason: 'weak password' };
  }

  const idx = blindIndex(email);
  const { rows } = await db.query('SELECT id, role, email_verified FROM taxpayers WHERE email_idx = $1', [idx]);

  if (rows.length) {
    // 🔴 DO NOT RESET THE PASSWORD ON EVERY BOOT. That would be a surprise, and a
    //    dangerous one. We only ensure the account is verified and flagged admin.
    await db.query("UPDATE taxpayers SET email_verified = true, role = 'admin' WHERE id = $1", [rows[0].id]);
    console.log(`  ✓ seed: admin ${email} already exists — ensured verified + admin (password left unchanged).`);
    return { seeded: false, existed: true };
  }

  await db.query(
    `INSERT INTO taxpayers (kind, email_enc, email_idx, password_hash, email_verified, role)
     VALUES ($1, $2, $3, $4, true, 'admin')`,
    [kind, encrypt(email), idx, pw.hash(password)]
  );

  console.log('');
  console.log('  🔑 SEEDED A VERIFIED ADMIN LOGIN');
  console.log(`     email:    ${email}  (${kind})`);
  if (generated) {
    console.log(`     password: ${password}`);
    console.log('     🔴 THIS IS THE ONLY TIME THIS PASSWORD IS SHOWN. Copy it now — it is');
    console.log('        stored only as a scrypt hash and cannot be recovered.');
  }
  console.log('     Sign in on the ' + (kind === 'entity' ? 'organisations' : 'individuals') + ' page.');
  console.log('     🔴 Now REMOVE SEED_ADMIN_* from your .env. The account persists; the');
  console.log('        credentials in the environment do not need to.');
  console.log('');
  return { seeded: true, email, kind };
}

module.exports = { seedAdmin };
