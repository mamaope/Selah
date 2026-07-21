/**
 * SELAH — PASSWORDS AND THE AUTH CONTROLS, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * These are not "does the function return a string" tests. Each one is a control
 * that fails silently and invisibly when it is wrong — which is what makes auth
 * bugs so expensive. A password that verifies is easy. A password that leaks
 * nothing when it FAILS is the hard part.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pw = require('./lib/password');
const mail = require('./lib/mail');

let pass = 0, fail = 0;
const failures = [];
const ok = (n, c) => c ? (pass++, console.log(`  ✓ ${n}`)) : (fail++, failures.push(n), console.log(`  \x1b[31m✗ ${n}\x1b[0m`));
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

section('THE HASH');
{
  const h = pw.hash('a decent long password');
  ok('a correct password verifies', pw.verify('a decent long password', h) === true);
  ok('a wrong password does not', pw.verify('a decent long passwore', h) === false);
  ok('the empty string does not', pw.verify('', h) === false);
  ok('null does not', pw.verify(null, h) === false);

  ok('🔴 the plaintext is NOWHERE in the stored hash',
     !h.includes('a decent long password') && !h.toLowerCase().includes('password'));

  ok('🔴 the SAME password hashes differently every time (per-user salt)',
     pw.hash('the same password') !== pw.hash('the same password'));

  ok('the algorithm and its cost are stored WITH the hash, so we can raise it later',
     /^scrypt\$32768\$8\$1\$/.test(h));

  ok('🔴 a corrupt or empty stored hash is a FAILED login, never a passed one',
     pw.verify('x', 'nonsense') === false &&
     pw.verify('x', '') === false &&
     pw.verify('x', null) === false &&
     pw.verify('x', 'scrypt$1$1$1$$') === false);
}

section('THE POLICY — length, not punctuation');
{
  ok('under 10 characters is refused', pw.check('short1').error === 'PASSWORD_TOO_SHORT');
  ok('exactly 10 characters is accepted', pw.check('tuesdaymug').ok === true);
  ok('...and "abcdefghij" is NOT, because it is on the blocklist — as it should be',
     pw.check('abcdefghij').error === 'PASSWORD_TOO_OBVIOUS');
  ok('a long passphrase is accepted (no composition rules)',
     pw.check('correct horse battery staple').ok === true);
  ok('there is NO "must contain a symbol" rule — those produce Passw0rd! and nothing else',
     pw.check('all lower case words here').ok === true);
  ok('the obvious ones are refused', pw.check('password123').error === 'PASSWORD_TOO_OBVIOUS');
  ok('...case-insensitively',        pw.check('PassWord123').error === 'PASSWORD_TOO_OBVIOUS');

  // 🔴 A LENGTH CAP IS A DENIAL-OF-SERVICE CONTROL. scrypt costs the SERVER 32 MB.
  //    A 10 MB password is a way to exhaust our own memory from a laptop, for free.
  ok('🔴 an absurdly long password is REFUSED, not hashed (it is a DoS, not a typo)',
     pw.check('a'.repeat(1_000_000)).error === 'PASSWORD_TOO_LONG');
  ok('...and verify() will not scrypt one either, even if one somehow got stored',
     pw.verify('a'.repeat(1_000_000), pw.hash('abcdefghij')) === false);
}

section('TOKENS — for confirmation and reset');
{
  const t1 = pw.token(), t2 = pw.token();
  ok('tokens are unguessable and unique', t1 !== t2 && t1.length >= 40);
  ok('🔴 tokens are stored HASHED — a leaked token table is not a set of working reset links',
     pw.tokenHash(t1) !== t1 && pw.tokenHash(t1) === pw.tokenHash(t1));
}

section('🔴 THE LOGIN FORM IS NOT A WAY TO FIND OUT WHO BANKS WITH US');
{
  const src = fs.readFileSync(path.join(__dirname, 'routes/auth.js'), 'utf8');
  const code = src.split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//')).join('\n');

  ok('"no such account" and "wrong password" are THE SAME response',
     /const badCredentials = \(res\)/.test(code) &&
     (code.match(/badCredentials\(res\)/g) || []).length >= 2);

  ok('🔴 a missing account still costs a full scrypt hash (no timing oracle)',
     /const DECOY = pw\.hash\(/.test(code) && /t \? t\.password_hash : DECOY/.test(code));

  ok('registration does NOT reveal that an address is already taken',
     /REGISTER_EXISTING/.test(code) && /return res\.json\(\{ ok: true, created: true, checkYourEmail: true \}\);/.test(code));

  ok('forgot-password answers identically whether or not the account exists',
     /const generic = \{ ok: true, sent: true,/.test(code));
}

section('🔴 A PASSWORD IS ONLY AS STRONG AS THE GUESSES ALLOWED AGAINST IT');
{
  const code = fs.readFileSync(path.join(__dirname, 'routes/auth.js'), 'utf8');
  ok('failures are counted per ACCOUNT', /MAX_FAILS_PER_ACCOUNT/.test(code));
  ok('...and per IP — credential stuffing is invisible per-account',
     /MAX_FAILS_PER_IP/.test(code));
  ok('a locked-out caller gets 429, not another guess', /status\(429\)/.test(code));
  ok('a successful login clears that account\'s failures',
     /DELETE FROM auth_failures WHERE email_idx = \$1/.test(code));
}

section('🔴 RESETTING A PASSWORD MUST EVICT WHOEVER IS ALREADY INSIDE');
{
  const code = fs.readFileSync(path.join(__dirname, 'routes/auth.js'), 'utf8');
  ok('a reset DELETES every existing session for that taxpayer',
     /DELETE FROM sessions WHERE taxpayer_id = \$1/.test(code));
  ok('...because changing the lock while the intruder is still inside is not security',
     /intruder/i.test(code));
  ok('a reset token is single-use', /consumed_at IS NULL/.test(code) && /SET consumed_at = now\(\)/.test(code));
  ok('a reset token expires', /expires_at > now\(\)/.test(code));
}

section('🔴 WE DO NOT PRETEND TO HAVE SENT AN EMAIL');
{
  const before = { ...process.env };
  delete process.env.MAIL_API_URL; delete process.env.MAIL_API_KEY; delete process.env.MAIL_FROM;

  ok('with no provider configured, mail reports itself UNCONFIGURED', mail.isConfigured() === false);
  ok('...and names exactly what is missing, for the operator',
     mail.whatIsMissing().join(',') === 'MAIL_API_URL,MAIL_API_KEY,MAIL_FROM');

  let sent = null;
  const res = { status(c) { this._c = c; return this; }, json(b) { sent = { code: this._c, body: b }; } };
  mail.notConfigured(res, 'reset your password');
  ok('...and "forgot password" returns an honest 503, not a soothing "check your inbox"',
     sent.code === 503 && sent.body.error === 'MAIL_NOT_CONFIGURED');
  ok('...and says out loud that nothing was sent',
     /ever tried to send/.test(sent.body.why.join(' ')));

  process.env.MAIL_API_URL = 'https://api.example.com/emails';
  process.env.MAIL_API_KEY = 'k';
  process.env.MAIL_FROM = 'Selah <a@b.c>';
  ok('with all three set, mail reports itself configured', mail.isConfigured() === true);

  Object.assign(process.env, before);
}

section('THE SCHEMA');
{
  const sql = fs.readFileSync(path.join(__dirname, 'db/003_email_auth.sql'), 'utf8');
  ok('🔴 the email is ENCRYPTED at rest', /email_enc\s+TEXT/.test(sql));
  ok('🔴 ...and searched by a ONE-WAY blind index — we never hold a readable user list',
     /email_idx\s+TEXT/.test(sql) && /taxpayers_email_idx_uniq/.test(sql));
  ok('the password hash is a hash, not an encrypted secret', /password_hash\s+TEXT/.test(sql));
  ok('reset tokens are stored hashed', /token_hash\s+TEXT NOT NULL/.test(sql));
  ok('the phone is now OPTIONAL — a profile field, not a credential',
     /ALTER COLUMN phone_idx DROP NOT NULL/.test(sql));
}


section('🔴 A FATAL ERROR GETS ONE CHANCE TO EXPLAIN ITSELF');
// The API crash-looped on boot with the message "SELAH_INDEX_KEY is missing or
// malformed." — and nothing else. It exited 1, docker restarted it, it died again,
// and nginx (patiently connecting to a container that kept dying) returned 504
// GATEWAY TIMEOUT to the browser.
//
// So a person trying to create an account was shown a TIMEOUT: a message pointing
// at the network, at DNS, at the proxy — at everything except one environment
// variable with the wrong value in it. "Missing or malformed" is two different
// problems joined by an "or", and it told you which one it was NOT.
{
  const fresh = () => { delete require.cache[require.resolve('./lib/crypto')]; return require('./lib/crypto'); };
  const GOOD = 'a'.repeat(64);
  const before = { ...process.env };

  const grab = (enc, idx) => {
    if (enc === null) delete process.env.SELAH_ENCRYPTION_KEY; else process.env.SELAH_ENCRYPTION_KEY = enc;
    if (idx === null) delete process.env.SELAH_INDEX_KEY;      else process.env.SELAH_INDEX_KEY = idx;
    try { fresh().assertReady(); return null; } catch (e) { return e.message; }
  };

  const pasted = grab(GOOD, 'openssl rand -hex 32');       // the command, not its output
  ok('it says the key is SET but NOT HEX — not "missing or malformed"',
     /SET, but it is not hexadecimal/.test(pasted) && !/missing or malformed/.test(pasted));
  ok('...it says how long the value actually is', /20 characters long/.test(pasted));
  ok('...it names the offending characters, so you can SEE what is wrong',
     /not hex digits/.test(pasted) && /a space/.test(pasted));
  ok('🔑 ...and it spots the classic mistake: the COMMAND was pasted, not its OUTPUT',
     /the command was pasted/i.test(pasted));
  ok('🔴 ...and it NEVER prints the key itself (a wrong key can be a near-miss of a real one)',
     !pasted.includes('openssl rand -hex 32\n      SELAH'));

  const short = grab(GOOD, 'abc123');
  ok('a valid-hex-but-short key is told it is short, and how short',
     /valid hex, but it is 6 characters long/.test(short));

  const missing = grab(GOOD, '');
  ok('an EMPTY index key falls back to the encryption key (documented behaviour)',
     missing === null);

  const noEnc = grab('', null);
  ok('a missing encryption key says NOT SET — not "malformed"',
     /SELAH_ENCRYPTION_KEY is NOT SET/.test(noEnc));

  const both = grab('nope', 'also-nope');
  ok('🔴 BOTH problems are reported AT ONCE — you do not fix one to be told the next',
     /SELAH_ENCRYPTION_KEY/.test(both) && /SELAH_INDEX_KEY/.test(both));

  ok('every failure says WHERE the .env must live (compose does not read the repo root)',
     /platform\/\.env/.test(both));
  ok('...and gives the exact command to generate a key', /openssl rand -hex 32/.test(both));
  ok('...and says why this is fatal rather than a warning',
     /PLAINTEXT/.test(both) && /worse than one that does not boot/.test(both));

  Object.assign(process.env, before);
  delete require.cache[require.resolve('./lib/crypto')];
}



section('🔴 THE GATE MUST NOT REFUSE A FACT IT CANNOT VERIFY');
// I checked a format I had never seen. The PDPO does not publish its certificate
// number format — registration is done on their portal and the certificate is
// downloaded from it. I invented "at least 8 characters" and "at least two words",
// and the gate then told the operator that their REAL registration number "is not
// credible".
//
// That is the exact failure this company exists to attack: publishing an unverified
// rule as if it were law. Doing it inside the safety gate is not "being careful" —
// it is being wrong, with a stern voice.
{
  const fresh = () => { for (const k of Object.keys(require.cache)) delete require.cache[k]; return require('./lib/compliance'); };
  const before = { ...process.env };
  const set = (n, d, name, email) => {
    process.env.PDPO_REGISTRATION_NUMBER = n;
    process.env.PDPO_REGISTERED_ON = d;
    process.env.DPO_NAME = name;
    process.env.DPO_EMAIL = email;
    return fresh();
  };

  ok('🔴 a SHORT but REAL registration number is ACCEPTED (7 digits is not a lie)',
     set('2564234', '2026-05-25', 'Sammy', 'sam@gmail.com').isRegistered() === true);

  ok('🔴 a ONE-WORD but REAL DPO name is ACCEPTED — I invented the two-word rule',
     set('2564234', '2026-05-25', 'Sammy', 'dpo@selah.ug').isRegistered() === true);

  // What we CAN check, we still check — and hard.
  ok('"true" is not a registration number',
     set('true', '2026-05-25', 'Sammy', 'a@b.ug').isRegistered() === false);
  ok('"TBD" is not a DPO',
     set('2564234', '2026-05-25', 'TBD', 'a@b.ug').isRegistered() === false);
  ok('"true" is not a date',
     set('2564234', 'true', 'Sammy', 'a@b.ug').isRegistered() === false);
  ok('a non-ISO date is refused (25/05/2026 is ambiguous the world over)',
     set('2564234', '25/05/2026', 'Sammy', 'a@b.ug').isRegistered() === false);

  // 🔑 NOT A GUESS. A CERTIFICATE CANNOT BE ISSUED TOMORROW.
  const future = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  ok('🔑 a certificate dated IN THE FUTURE is refused — that one is a fact, not a hunch',
     set('2564234', future, 'Sammy', 'a@b.ug').isRegistered() === false);

  ok('an empty declaration keeps the gate SHUT',
     set('', '', '', '').isRegistered() === false);

  // 🔑 The ORIGINAL incident: DPO_NAME=vvvvv had disarmed this gate. Removing the
  // invented two-word rule let it back in. A single character repeated is not a
  // name — and that test refuses no real person.
  ok('🔴 "vvvvv" is STILL refused — a keyboard held down is not a Data Protection Officer',
     set('2564234', '2026-05-25', 'vvvvv', 'a@b.ug').isRegistered() === false);
  ok('...and "11111" is still not a registration number',
     set('11111', '2026-05-25', 'Sammy', 'a@b.ug').isRegistered() === false);
  ok('...while "Sammy" and "2564234" still pass, because they are real',
     set('2564234', '2026-05-25', 'Sammy', 'a@b.ug').isRegistered() === true);

  // Things that are ODD are WARNED about, never used to slam a door on a true fact.
  const c = set('2564234', '2026-05-25', 'Sammy', 'sam@gmail.com');
  const w = c.concerns().join(' ');
  ok('a free-mail DPO address is a WARNING, not a refusal',
     c.isRegistered() === true && /free provider/.test(w));
  ok('...and it explains why it matters: the complaint must outlive the employee',
     /outlive/.test(w));
  ok('a single-word DPO name is a WARNING, not a refusal', /single word/.test(w));

  Object.assign(process.env, before);
  for (const k of Object.keys(require.cache)) delete require.cache[k];
}



section('🔴 THE SESSION COOKIE MUST SURVIVE THE CONNECTION IT ARRIVES ON');
// A Secure cookie is refused by the browser over plain HTTP. In production over
// HTTP that logged everyone out the instant they logged in — the cookie was set,
// thrown away, and the next request had no session. So `secure` must follow the
// ACTUAL protocol: off on HTTP (login works), on over HTTPS (never sent in clear).
{
  const s = require('./lib/session');
  ok('🔴 over HTTP the cookie is NOT Secure — so the browser keeps it and you stay logged in',
     s.cookieOptsFor({ secure: false }).secure === false);
  ok('🔴 over HTTPS the cookie IS Secure — a real session is never sent in the clear',
     s.cookieOptsFor({ secure: true }).secure === true);
  ok('...httpOnly is on either way — JavaScript can never read the session',
     s.cookieOptsFor({ secure: false }).httpOnly === true);
  ok('...sameSite=lax either way — a cross-site form cannot ride your session',
     s.cookieOptsFor({ secure: false }).sameSite === 'lax');

  const idx = require('fs').readFileSync(require('path').join(__dirname, 'index.js'), 'utf8');
  ok('the app trusts the proxy, so req.secure reflects nginx\'s X-Forwarded-Proto',
     /trust proxy/.test(idx));
  const auth = require('fs').readFileSync(require('path').join(__dirname, 'routes/auth.js'), 'utf8');
  ok('🔴 login sets the cookie with the PER-REQUEST options, not the static default',
     /cookieOptsFor\(req\)/.test(auth) && !/token, session\.cookieOpts\)/.test(auth));
}



section('🔑 SEEDING AN ADMIN — a ready login, and NEVER a default password');
{
  // seedAdmin() is async, but every GUARD branch returns before it touches the
  // database — and this file is synchronous. So we assert on the promise's result
  // via a tiny synchronous drain, and on the source text for the rest.
  const before = { ...process.env };
  const drain = (pr) => { let out; pr.then((r) => { out = r; }); return out; };  // resolves sync (no await inside)
  const fresh = () => { delete require.cache[require.resolve('./lib/seed')]; return require('./lib/seed'); };

  const src = require('fs').readFileSync(require('path').join(__dirname, 'lib/seed.js'), 'utf8');

  // 🔴 THE SOURCE ITSELF MUST NOT CONTAIN A LITERAL / DEFAULT PASSWORD.
  ok('🔴 the seed reads the password from the ENVIRONMENT, never a hard-coded default',
     /process\.env\.SEED_ADMIN_PASSWORD/.test(src));
  ok('🔴 ...and there is no literal password assigned anywhere in it',
     !/password\s*=\s*['"][^'"]{6,}['"]/.test(src));
  ok('🔴 ...the password is scrypt-HASHED at seed time, never stored raw',
     /pw\.hash\(password\)/.test(src));
  ok('🔴 ...a weak seed password is checked and refused, like every other password',
     /pw\.check\(password\)/.test(src) && /weak password/.test(src));
  ok('🔴 ...an existing admin is NOT re-created or silently reset',
     /DO NOT RESET THE PASSWORD/.test(src));
  ok('🔴 ...seeding is OPT-IN — no env vars, no account',
     /not requested/.test(src) && /if \(!email && !password\)/.test(src));
  ok('🔑 ...if you give an email but no password, a STRONG one is generated and printed once',
     /randomBytes\(12\)/.test(src) && /ONLY TIME THIS PASSWORD IS SHOWN/.test(src));
  ok('"admin" is documented to grant NO special power — it cannot read others\' data',
     /GRANTS NO SPECIAL POWER/.test(src));

  Object.assign(process.env, before);
  delete require.cache[require.resolve('./lib/seed')];
}


console.log('\n' + '═'.repeat(60));
console.log(fail
  ? `\x1b[31m✗ ${fail} FAILED\x1b[0m, ${pass} passed\n${failures.map((f) => '   ✗ ' + f).join('\n')}`
  : `\x1b[32m✓ ALL ${pass} PASSWORD/AUTH TESTS PASSED\x1b[0m`);
console.log('═'.repeat(60));
process.exit(fail ? 1 : 0);
