#!/usr/bin/env node
/**
 * SELAH — CREATE OR RESET AN ADMIN, ON THE SPOT
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this INSIDE the api container, where the encryption keys and the database
 * connection already live. It takes the email and password as ARGUMENTS — so it
 * does not depend on .env, cannot be poisoned by a Windows CRLF, and needs no
 * rebuild:
 *
 *     docker compose exec api node server/admin.js create you@example.com 'YourPassw0rd'
 *     docker compose exec api node server/admin.js reset  you@example.com 'NewPassw0rd'
 *     docker compose exec api node server/admin.js list
 *
 * `create` makes the account (verified) if it does not exist; if it does, it
 * behaves like `reset`. `reset` force-sets the password on an existing account.
 * `list` shows every account without revealing the (encrypted) email addresses.
 * ─────────────────────────────────────────────────────────────────────────────
 */
require('./lib/env').loadEnv();            // no-op inside the container (env already set)

const db = require('./lib/db');
const { encrypt, blindIndex } = require('./lib/crypto');
const pw = require('./lib/password');

const [, , cmdRaw, emailRaw, passwordRaw] = process.argv;
const cmd = (cmdRaw || '').toLowerCase();

function usage(msg) {
  if (msg) console.error('\n  ' + msg);
  console.error('\n  usage:');
  console.error('    node server/admin.js create <email> <password>');
  console.error('    node server/admin.js reset  <email> <password>');
  console.error('    node server/admin.js list\n');
  process.exit(1);
}

(async () => {
  try {
    if (cmd === 'list') {
      const { rows } = await db.query(
        `SELECT kind, role, email_verified,
                (password_hash IS NOT NULL) AS has_password,
                created_at
           FROM taxpayers ORDER BY created_at`);
      if (!rows.length) { console.log('\n  No accounts exist yet.\n'); process.exit(0); }
      console.log('\n  ' + rows.length + ' account(s):');
      for (const r of rows) {
        console.log(`    ${r.role.padEnd(6)} ${r.kind.padEnd(10)} verified=${r.email_verified}  has_password=${r.has_password}  ${new Date(r.created_at).toISOString().slice(0,10)}`);
      }
      console.log('  (emails are encrypted and cannot be listed — that is by design.)\n');
      process.exit(0);
    }

    if (cmd !== 'create' && cmd !== 'reset') usage('unknown command: ' + (cmdRaw || '(none)'));

    // 🔴 The password is an ARGUMENT, so no .env / CRLF can corrupt it — but strip a
    //    trailing CR just in case a shell passes one, and validate strength.
    const email = String(emailRaw || '').trim().toLowerCase();
    const password = String(passwordRaw || '').replace(/[\r\n]+$/, '');

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) usage('that does not look like an email: ' + emailRaw);
    const strength = pw.check(password);
    if (!strength.ok) usage('password rejected: ' + strength.message);

    const idx = blindIndex(email);
    const { rows } = await db.query('SELECT id FROM taxpayers WHERE email_idx = $1', [idx]);

    if (rows.length) {
      await db.query(
        "UPDATE taxpayers SET password_hash = $1, email_verified = true, role = 'admin' WHERE id = $2",
        [pw.hash(password), rows[0].id]);
      console.log(`\n  ✓ Updated ${email}: password set, verified, role=admin.\n    Sign in on the individuals page.\n`);
    } else {
      await db.query(
        `INSERT INTO taxpayers (kind, email_enc, email_idx, password_hash, email_verified, role)
         VALUES ('individual', $1, $2, $3, true, 'admin')`,
        [encrypt(email), idx, pw.hash(password)]);
      console.log(`\n  ✓ Created ${email}: verified admin.\n    Sign in on the individuals page.\n`);
    }
    process.exit(0);
  } catch (e) {
    console.error('\n  ✗ ' + e.message + '\n');
    process.exit(1);
  }
})();
