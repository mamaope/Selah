/**
 * SELAH — THE API
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 READ server/lib/compliance.js BEFORE YOU CHANGE ANYTHING IN HERE.
 *
 * This server will not store a payslip, a TIN, a phone number or an invoice
 * until Selah Solutions Ltd is registered with Uganda's Personal Data Protection
 * Office. Every such endpoint returns HTTP 451 until then.
 *
 * That is not caution. On 10 July 2025 a digital lender's DIRECTOR was
 * personally convicted for failing to register. The gate is there to protect a
 * human being, not a company.
 *
 * The calculators are unaffected. They store nothing and never did.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const cookieParser = require('cookie-parser');

const compliance = require('./lib/compliance');
const cryptoLib = require('./lib/crypto');
const db = require('./lib/db');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

// ── liveness. No personal data. Always available. ────────────────────────────
app.get('/api/healthz', (_req, res) => res.type('text').send('ok\n'));

/**
 * 🔑 THE HONEST STATUS ENDPOINT.
 *
 * Anyone may ask whether we are allowed to hold their data. Most platforms bury
 * this in a privacy policy. We answer it in one HTTP call, truthfully, including
 * when the answer is embarrassing.
 */
app.get('/api/compliance', (_req, res) => {
  const registered = compliance.isRegistered();
  res.json({
    registered,
    canStoreYourData: registered,
    dpo: registered ? { name: compliance.REGISTRATION.dpoName, email: compliance.REGISTRATION.dpoEmail } : null,
    registration: registered
      ? { number: compliance.REGISTRATION.number, registeredOn: compliance.REGISTRATION.registeredOn }
      : null,
    statement: registered
      ? 'Selah is registered with Uganda\'s Personal Data Protection Office. Your data is encrypted at rest, every read of it is audited, and you may ask us for that audit trail at any time.'
      : 'Selah is NOT yet registered with Uganda\'s Personal Data Protection Office. Until we are, this server REFUSES to store your data — every account endpoint returns 451. The calculators work and store nothing.',
    yourRights: [
      'Ask what we hold about you.',
      'Ask for the audit trail of who read it.',
      'Ask us to correct it.',
      'Ask us to delete it — and we will, not archive it.',
      'Withdraw your consent. Consent that cannot be withdrawn is not consent.',
    ],
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 THE GATE. Everything below this line touches a person.
// ═════════════════════════════════════════════════════════════════════════════
app.use('/api/auth',      compliance.requireRegistration);
app.use('/api/me',        compliance.requireRegistration);
app.use('/api/payslips',  compliance.requireRegistration);
app.use('/api/invoices',  compliance.requireRegistration);
app.use('/api/money',     compliance.requireRegistration);
app.use('/api/calendar',   compliance.requireRegistration);
app.use('/api/books',      compliance.requireRegistration);
app.use('/api/entries',    compliance.requireRegistration);

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/me',       require('./routes/me'));
app.use('/api/payslips', require('./routes/payslips'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/money',    require('./routes/money'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/books',    require('./routes/books'));
app.use('/api/entries',  require('./routes/entries'));

// ── errors: never leak a stack trace, never leak a value ─────────────────────
app.use((err, _req, res, _next) => {
  console.error('  ✗', err.message);
  res.status(500).json({ ok: false, error: 'INTERNAL', message: 'Something failed on our side. Nothing was stored.' });
});

const PORT = process.env.PORT || 3000;

async function start() {
  // 🔴 FAIL FAST. A tax platform that boots without its encryption key would
  // write every Ugandan's payslip to disk in plaintext.
  cryptoLib.assertReady();

  if (process.env.MIGRATE === 'true') await db.migrate();

  compliance.announce();

  app.listen(PORT, () => {
    console.log(`  Selah API on :${PORT}`);
    console.log(`  compliance status: GET /api/compliance`);
    console.log('');
  });
}

if (require.main === module) start().catch((e) => { console.error(e.message); process.exit(1); });

module.exports = app;
