/**
 * SELAH — THE SERVER TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE MOST IMPORTANT TEST IN THIS REPOSITORY IS THE FIRST ONE.
 *
 * It asserts that this server REFUSES to store a Ugandan's payslip while we are
 * unregistered with the Personal Data Protection Office.
 *
 * On 10 July 2025 a digital lender's DIRECTOR was personally convicted for
 * exactly that failure. Not the company — the director. This test is the thing
 * standing between that outcome and a founder who is tired and in a hurry.
 *
 * 🔑 AND NOTE WHAT IT PROVES WITHOUT A DATABASE: the gate sits IN FRONT of the
 * database. If the gate could only be tested with Postgres running, the gate
 * would be in the wrong place.
 * ─────────────────────────────────────────────────────────────────────────────
 */
process.env.SELAH_ENCRYPTION_KEY = process.env.SELAH_ENCRYPTION_KEY
  || '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

const request = require('supertest');
const assert = require('assert');

let pass = 0, fail = 0;
const failures = [];
const ok = (name, cond) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; const m = `  ✗ ${name}`; failures.push(m); console.log(m); }
};
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

(async () => {

  // ═══════════════════════════════════════════════════════════════════════════
  section('🔴 THE PDPO GATE — while UNREGISTERED, we must refuse');
  // ═══════════════════════════════════════════════════════════════════════════
  delete process.env.PDPO_REGISTRATION_NUMBER;
  delete process.env.PDPO_REGISTERED_ON;
  delete process.env.DPO_NAME;
  delete process.env.DPO_EMAIL;
  for (const k of Object.keys(require.cache)) delete require.cache[k];

  const app = require('./index');
  const compliance = require('./lib/compliance');

  ok('we are NOT registered with the PDPO', compliance.isRegistered() === false);

  // Every endpoint that would touch a person.
  for (const [method, path] of [
    ['post',   '/api/auth/start'],
    ['post',   '/api/auth/verify'],
    ['get',    '/api/me'],
    ['get',    '/api/me/export'],
    ['delete', '/api/me'],
    ['post',   '/api/payslips'],
    ['get',    '/api/payslips/check'],
    ['post',   '/api/invoices'],
    ['get',    '/api/invoices/credits'],
    ['post',   '/api/money'],
    ['get',    '/api/money'],
  ]) {
    const res = await request(app)[method](path).send({ phone: '0700123456', gross: 1_000_000 });
    ok(`${method.toUpperCase().padEnd(6)} ${path.padEnd(24)} → 451, and stores NOTHING`,
       res.status === 451 && res.body.error === 'UNAVAILABLE_FOR_LEGAL_REASONS');
  }

  const refusal = (await request(app).post('/api/payslips').send({ gross: 1_000_000 })).body;
  ok('the refusal cites the ACT, not a policy',
     refusal.why.some((w) => w.includes('s.9(1)')));
  ok('...and names the DIRECTOR conviction, because the risk is personal',
     refusal.why.some((w) => w.includes('DIRECTOR was personally convicted')));
  ok('...and tells the user what still works',
     refusal.whatYouCanDoNow.some((w) => w.includes('stores nothing')));
  ok('...and tells US exactly what is missing',
     refusal._forOperators.missing.length === 4);

  section('The calculators are UNAFFECTED — they never needed an account');
  const health = await request(app).get('/api/healthz');
  ok('/api/healthz is always up', health.status === 200);

  const status = await request(app).get('/api/compliance');
  ok('/api/compliance answers honestly, without being asked twice', status.status === 200);
  ok('...and says plainly that we may NOT store your data', status.body.canStoreYourData === false);
  ok('...and lists the rights you have anyway', status.body.yourRights.length >= 5);
  ok('...and does not pretend to have a DPO', status.body.dpo === null);

  // ═══════════════════════════════════════════════════════════════════════════
  section('🔑 And the day registration lands — the gate opens, and ONLY then');
  // ═══════════════════════════════════════════════════════════════════════════
  process.env.PDPO_REGISTRATION_NUMBER = 'PDPO/REG/2026/00417';
  process.env.PDPO_REGISTERED_ON = '2026-05-25';   // a date in the PAST. A certificate cannot be issued tomorrow.
  process.env.DPO_NAME = 'The Variable';
  process.env.DPO_EMAIL = 'dpo@selah.ug';
  for (const k of Object.keys(require.cache)) delete require.cache[k];

  const app2 = require('./index');
  const c2 = require('./lib/compliance');
  ok('with all four set, we ARE registered', c2.isRegistered() === true);

  const status2 = await request(app2).get('/api/compliance');
  ok('/api/compliance now says we may store your data', status2.body.canStoreYourData === true);
  ok('...and names the DPO — a human being, reachable', status2.body.dpo.email === 'dpo@selah.ug');

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴🔴 THE FAKE REGISTRATION. THIS ACTUALLY HAPPENED, AND THE GATE OPENED.
  //
  // The founder's .env came back with:
  //
  //     PDPO_REGISTRATION_NUMBER = "1234"
  //     PDPO_REGISTERED_ON       = "true"
  //     DPO_NAME                 = "vvvvv"
  //
  // He had not lied. Docker was refusing to start over unset variables, so he
  // filled in the blanks — which is what ANY reasonable person does with a config
  // file full of holes. And this server would have begun storing Ugandans'
  // payslips believing itself a registered data controller.
  //
  // The comments warning him were there, in capitals. They did not help.
  //
  // A safety gate whose only test is "did somebody type something?" is not a
  // safety gate. It is a formality — and formalities are exactly what people fill
  // in at 1am to make an error message go away.
  // ═══════════════════════════════════════════════════════════════════════════
  process.env.PDPO_REGISTRATION_NUMBER = '1234';
  process.env.PDPO_REGISTERED_ON = 'true';
  process.env.DPO_NAME = 'vvvvv';
  process.env.DPO_EMAIL = 'a@b.c';
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const cFake = require('./lib/compliance');

  ok('🔴 a FOUR-CHARACTER registration number does NOT open the gate', cFake.isRegistered() === false);
  ok('   ...and "true" is not a date', cFake.whatIsMissing().some((m) => m.includes('PDPO_REGISTERED_ON') && m.includes('not credible')));
  ok('   ...and "vvvvv" is not a human a regulator can ask for', cFake.whatIsMissing().some((m) => m.includes('DPO_NAME') && m.includes('not credible')));
  ok('   ...and it tells him to EMPTY ALL FOUR, because the 451 is not a bug',
     cFake.whatIsMissing().some((m) => m.includes('EMPTY ALL FOUR')));

  const appFake = require('./index');
  const resFake = await request(appFake).post('/api/payslips').send({ gross: 1_000_000 });
  ok('   ...and a payslip is STILL refused, 451, with a fake registration in place',
     resFake.status === 451);

  // A PLAUSIBLE registration opens it — the gate must not be so strict it is useless.
  process.env.PDPO_REGISTRATION_NUMBER = 'PDPO/REG/2026/00417';
  process.env.PDPO_REGISTERED_ON = '2026-05-25';   // a date in the PAST. A certificate cannot be issued tomorrow.
  process.env.DPO_NAME = 'Isaac Mukasa';
  process.env.DPO_EMAIL = 'dpo@selah.ug';
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  ok('a CREDIBLE registration does open the gate — the check must not be useless',
     require('./lib/compliance').isRegistered() === true);

  // 🔴 THE PARTIAL CASE. THIS IS THE ONE THAT WOULD HAVE CAUGHT A REAL MISTAKE:
  // somebody sets the registration number, forgets the DPO, and assumes they are
  // compliant. A registration with no accountable human is not a registration.
  process.env.DPO_EMAIL = '';
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const c3 = require('./lib/compliance');
  ok('🔴 a registration number with NO reachable DPO is NOT compliance',
     c3.isRegistered() === false);

  // ═══════════════════════════════════════════════════════════════════════════
  section('Encryption — and the tamper that must NOT silently succeed');
  // ═══════════════════════════════════════════════════════════════════════════
  const crypt = require('./lib/crypto');
  crypt.assertReady();

  const blob = crypt.encrypt('+256700123456');
  ok('a phone number is CIPHERTEXT at rest', !blob.includes('256700123456'));
  ok('and it round-trips exactly', crypt.decrypt(blob) === '+256700123456');
  ok('two encryptions of the same value DIFFER (a random IV, every time)',
     crypt.encrypt('x') !== crypt.encrypt('x'));

  // 🔴 If a tampered ciphertext decrypted to a DIFFERENT NUMBER, a tax platform
  // would compute a confident, wrong answer. AES-GCM is authenticated; it throws.
  let threw = false;
  try { crypt.decrypt(blob.slice(0, -4) + 'AAAA'); } catch { threw = true; }
  ok('a TAMPERED ciphertext THROWS — it does not return a plausible wrong number', threw);

  const idx = crypt.blindIndex('+256700123456');
  ok('the blind index is deterministic — so we can find you', idx === crypt.blindIndex('+256700123456'));
  ok('...and one-way — so a leaked database is not a phone book', !idx.includes('256700123456'));
  ok('...and different numbers give different indexes', idx !== crypt.blindIndex('+256700999999'));

  // A server with no key would write every payslip to disk in plaintext.
  const savedKey = process.env.SELAH_ENCRYPTION_KEY;
  process.env.SELAH_ENCRYPTION_KEY = '';
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  let refusedToStart = false;
  try { require('./lib/crypto').assertReady(); } catch { refusedToStart = true; }
  ok('🔴 WITHOUT AN ENCRYPTION KEY, THE SERVER REFUSES TO START', refusedToStart);
  process.env.SELAH_ENCRYPTION_KEY = savedKey;

  // ═══════════════════════════════════════════════════════════════════════════
  section('The schema — what it promises');
  // ═══════════════════════════════════════════════════════════════════════════
  const sql = require('fs').readFileSync(require('path').join(__dirname, 'db/001_init.sql'), 'utf8');
  ok('the audit log is APPEND ONLY, enforced by the database',
     /BEFORE UPDATE OR DELETE ON audit_log/.test(sql));
  ok('deleting a taxpayer CASCADES — no orphaned payslips survive an erasure',
     (sql.match(/ON DELETE CASCADE/g) || []).length >= 4);
  ok('every money and identity column is stored ENCRYPTED (_enc)',
     /gross_enc/.test(sql) && /phone_enc/.test(sql) && /amount_enc/.test(sql) && /tin_enc/.test(sql));
  ok('consent is a RECORD with a version and a withdrawal date, not a checkbox',
     /withdrawn_at/.test(sql) && /consent_version/.test(sql));
  ok('retention is enforced by a column, not by good intentions',
     /delete_after/.test(sql));
  ok('TAXPAYER is the root object — individual and entity are subtypes',
     /kind\s+TEXT NOT NULL CHECK \(kind IN \('individual', 'entity'\)\)/.test(sql));

  // ═══════════════════════════════════════════════════════════════════════════
  section('THE GATE COVERS EVERY ROUTE — checked structurally, not by memory');
  // 🔴 I MOUNTED /api/calendar AND FORGOT THE GATE.
  //
  // The route went in. The `compliance.requireRegistration` line did not, because a
  // whitespace mismatch made a find-and-replace miss silently. For a few minutes
  // there was an endpoint serving a person's tax profile and their directors' names
  // with the PDPO gate WIDE OPEN — the precise failure this company exists to
  // prevent, and the one a Ugandan digital lender's director was personally
  // CONVICTED for on 10 July 2025.
  //
  // Every existing test passed. Of course they did: they test the routes somebody
  // remembered to write a test for.
  //
  // So this test does not check a list I maintain by hand. It READS index.js, finds
  // EVERY mounted /api route, and asserts each one has a gate. A new route is
  // guarded the moment it is mounted, or this suite goes red. You cannot forget
  // your way past it.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'index.js'), 'utf8')
      .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

    const mounted = [...src.matchAll(/app\.use\(\s*'(\/api\/[a-z0-9_-]+)'\s*,\s*require\(/g)].map((m) => m[1]);
    const gated   = new Set([...src.matchAll(/app\.use\(\s*'(\/api\/[a-z0-9_-]+)'\s*,\s*compliance\.requireRegistration\s*\)/g)].map((m) => m[1]));

    ok('index.js actually mounts routes (the regex still matches reality)', mounted.length >= 5);

    const ungated = mounted.filter((r) => !gated.has(r));
    ok(`EVERY mounted /api route is behind the PDPO gate${ungated.length ? ' — UNGATED: ' + ungated.join(', ') : ''}`,
       ungated.length === 0);

    ok('/api/calendar specifically is gated (it serves a tax profile and directors\' names)',
       gated.has('/api/calendar'));
  }


  // ═══════════════════════════════════════════════════════════════════════════
  section('SEPARATE ACCOUNTS — a person and a company are not the same taxpayer');
  // 🔴 Before this, auth hardcoded kind='individual' and did a plain "find or
  // create" on the credential.
  //
  // So a director whose personal account is 0772-... opening a COMPANY account on
  // the same number would have been QUIETLY SIGNED INTO THEIR PERSONAL ACCOUNT,
  // and handed the organisation screens wired to their own tax data. Every figure
  // real. Every figure the wrong taxpayer's. Nothing looking broken.
  //
  // The server must refuse, in words. It must never guess which account you meant.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'routes/auth.js'), 'utf8')
      .split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n');

    ok('auth no longer HARDCODES every new taxpayer as an individual',
       !/VALUES \('individual'/.test(src));

    ok('the account kind comes from the request (the front door you came through)',
       /req\.body\?\.kind === 'entity' \? 'entity' : 'individual'/.test(src));

    ok('🔴 the RIGHT password for the WRONG KIND of account is still REFUSED',
       /WRONG_ACCOUNT_KIND/.test(src) && /t\.kind !== kind/.test(src));

    ok('...and the refusal is a 409 that explains itself, not a silent redirect',
       /status\(409\)/.test(src) && /headline:/.test(src) && /whatYouCanDoNow:/.test(src));

    ok('...and the mismatch is written to the audit log',
       /LOGIN_KIND_MISMATCH/.test(src));

    const me = require('fs').readFileSync(require('path').join(__dirname, 'routes/me.js'), 'utf8');
    ok('GET /me reports the account KIND, so a page can tell whose screens it is showing',
       /kind: t\.kind/.test(me));
  }


  console.log('\n' + '═'.repeat(60));
  if (!fail) {
    console.log(`\x1b[32m✓ ALL ${pass} SERVER TESTS PASSED\x1b[0m`);
    console.log('\nThe server refuses to hold a Ugandan\'s data until it is lawfully allowed to.');
  } else {
    console.log(`\x1b[31m✗ ${fail} FAILED\x1b[0m, ${pass} passed\n`);
    failures.forEach((f) => console.log(f));
  }



  console.log('═'.repeat(60));
  process.exit(fail ? 1 : 0);
})();
