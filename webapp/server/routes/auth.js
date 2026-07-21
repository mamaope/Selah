/**
 * SELAH — AUTHENTICATION. Email and password.
 * ─────────────────────────────────────────────────────────────────────────────
 * The old door was phone + OTP, and it was a door with no key: the SMS gateway was
 * never wired, so `/auth/start` returned 503 in production and NOBODY COULD EVER
 * SIGN IN. A login method you cannot pay for is not a login method.
 *
 * Three controls in this file are not optional, and each exists because the
 * obvious implementation is subtly wrong:
 *
 *   1. YOU CANNOT USE THIS FORM TO FIND OUT WHO BANKS WITH US.
 *      "No such account" and "wrong password" must be THE SAME ANSWER. Otherwise
 *      the login form becomes a query interface: type an address, learn whether
 *      that person has Ugandan tax data with us. That is a privacy breach that
 *      does not require breaking in.
 *
 *   2. A WRONG PASSWORD MUST COST THE SAME TIME AS A MISSING ACCOUNT.
 *      Answer "no such account" instantly and "wrong password" 90ms later, and the
 *      clock leaks exactly what the words refused to. So we hash a decoy.
 *
 *   3. A PASSWORD IS ONLY AS STRONG AS THE NUMBER OF GUESSES ALLOWED AGAINST IT.
 *      Locked per-account AND per-IP — because credential stuffing tries one
 *      password across ten thousand accounts, and that is invisible per-account.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const crypto = require('crypto');
const db = require('../lib/db');
const { encrypt, decrypt, blindIndex } = require('../lib/crypto');
const session = require('../lib/session');
const pw = require('../lib/password');
const mail = require('../lib/mail');

const router = express.Router();

const MAX_FAILS_PER_ACCOUNT = 8;
const MAX_FAILS_PER_IP      = 30;
const WINDOW_MIN            = 15;
const VERIFY_TTL_HOURS      = 24;
const RESET_TTL_HOURS       = 1;

/**
 * 🔴 A DECOY HASH.
 *
 * When the account does not exist there is nothing to verify — so the natural code
 * returns immediately, and the response time announces "that address is not one of
 * ours" to anybody holding a stopwatch. We verify against a real scrypt hash of a
 * random string instead. Same 32 MB. Same ~90ms. Same answer. No signal.
 */
const DECOY = pw.hash(crypto.randomBytes(32).toString('hex'));

const normaliseEmail = (e) => {
  const s = String(e == null ? '' : e).trim().toLowerCase();
  // Deliberately permissive: the RFC allows more than any regex people write, and
  // an over-strict check locks real people out of their own address. The address is
  // proved by the fact that a link sent to it was clicked. That is the only proof
  // that means anything.
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 254 ? s : null;
};

const ipOf = (req) => String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();

async function isLockedOut(emailIdx, ip) {
  const { rows } = await db.query(
    `SELECT
       count(*) FILTER (WHERE email_idx = $1) AS by_account,
       count(*) FILTER (WHERE ip = $2)        AS by_ip
     FROM auth_failures
     WHERE at > now() - interval '${WINDOW_MIN} minutes'`,
    [emailIdx, ip]
  );
  const r = rows[0] || {};
  return Number(r.by_account) >= MAX_FAILS_PER_ACCOUNT || Number(r.by_ip) >= MAX_FAILS_PER_IP;
}

const recordFailure = (emailIdx, ip) =>
  db.query('INSERT INTO auth_failures (email_idx, ip) VALUES ($1,$2)', [emailIdx, ip]);

const lockedOut = (res) => res.status(429).json({
  ok: false, error: 'TOO_MANY_ATTEMPTS',
  headline: 'Too many attempts. Wait 15 minutes.',
  why: ['A password is only as strong as the number of guesses allowed against it, so we stop allowing them.'],
});

/**
 * The SAME answer for "no such account" and "wrong password". Do not, under any
 * pressure from any usability review, split these into two messages.
 */
const badCredentials = (res) => res.status(401).json({
  ok: false, error: 'BAD_CREDENTIALS',
  headline: 'That email and password do not match an account.',
  why: ['We will not tell you which of the two was wrong. If we did, this form would become a way to find out who has tax data with us — and that is a privacy breach that does not require breaking in.'],
});

async function issueToken(taxpayerId, purpose, hours) {
  const t = pw.token();
  await db.query(
    `INSERT INTO email_tokens (taxpayer_id, purpose, token_hash, expires_at)
     VALUES ($1,$2,$3, now() + interval '${hours} hours')`,
    [taxpayerId, purpose, pw.tokenHash(t)]
  );
  return t;
}

const baseUrl = (req) => process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/register  { email, password, kind }
// ═══════════════════════════════════════════════════════════════════════════
router.post('/register', async (req, res, next) => {
  try {
    const email = normaliseEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ ok: false, error: 'BAD_EMAIL', message: 'That does not look like an email address.' });
    }
    const strength = pw.check(req.body?.password);
    if (!strength.ok) return res.status(400).json({ ok: false, ...strength });

    // 🔴 A person and a company are SEPARATE ACCOUNTS. Which door did you come in?
    const kind = req.body?.kind === 'entity' ? 'entity' : 'individual';
    const idx = blindIndex(email);

    const { rows: existing } = await db.query('SELECT id, kind FROM taxpayers WHERE email_idx = $1', [idx]);
    if (existing.length) {
      // 🔴 REGISTRATION IS AN ENUMERATION ORACLE TOO, and a nastier one than login:
      // "that email is taken" tells an attacker, for free, that this person has tax
      // data with us. So we say the same thing we would say on success, and we send
      // an email to the address — one that says "somebody tried to register your
      // address; you already have an account". The real owner learns something
      // useful. The attacker learns nothing at all.
      await db.audit({ action: 'REGISTER_EXISTING', entity: 'taxpayers', entityId: existing[0].id, req });
      if (mail.isConfigured()) {
        await mail.send({
          to: email,
          subject: 'You already have a Selah account',
          html: '<p>Somebody tried to create a Selah account with this email address, but you already have one.</p>' +
                '<p>If that was you, just sign in. If you have forgotten your password, use "forgot password".</p>' +
                '<p>If it was not you, you can ignore this — nobody has been given access to your account.</p><p>— Selah</p>',
        });
      }
      return res.json({ ok: true, created: true, checkYourEmail: true });
    }

    const { rows } = await db.query(
      `INSERT INTO taxpayers (kind, email_enc, email_idx, password_hash)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [kind, encrypt(email), idx, pw.hash(req.body.password)]
    );
    const id = rows[0].id;
    await db.audit({ actorId: id, subjectId: id, action: 'ACCOUNT_CREATED', entity: 'taxpayers', entityId: id, req });

    if (!mail.isConfigured()) {
      // The account exists and they can sign in — but we cannot confirm the address,
      // and we will not claim to have emailed them. Say exactly that.
      return res.json({
        ok: true, created: true, checkYourEmail: false,
        warning: 'Your account exists and you can sign in. We could NOT send you a confirmation email, because no mail provider is configured on this server. We are not going to tell you to check an inbox for a message nothing tried to send.',
        _forOperators: { missing: mail.whatIsMissing() },
      });
    }

    const t = await issueToken(id, 'verify', VERIFY_TTL_HOURS);
    const tpl = mail.templates.verify(`${baseUrl(req)}/verify-email.html?token=${t}`);
    await mail.send({ to: email, ...tpl });

    res.json({ ok: true, created: true, checkYourEmail: true });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/login  { email, password, kind }
// ═══════════════════════════════════════════════════════════════════════════
router.post('/login', async (req, res, next) => {
  try {
    const email = normaliseEmail(req.body?.email);
    const ip = ipOf(req);
    const idx = email ? blindIndex(email) : null;

    if (await isLockedOut(idx, ip)) return lockedOut(res);

    if (!email) { await recordFailure(null, ip); return badCredentials(res); }

    const { rows } = await db.query(
      'SELECT id, kind, password_hash, email_verified FROM taxpayers WHERE email_idx = $1', [idx]
    );
    const t = rows[0];

    // 🔴 HASH SOMETHING EITHER WAY. See DECOY, above. An early return here is a
    // timing oracle that answers the exact question the words above refuse to.
    const good = pw.verify(req.body?.password, t ? t.password_hash : DECOY);

    if (!t || !t.password_hash || !good) {
      await recordFailure(idx, ip);
      await db.audit({ action: 'LOGIN_FAILED', entity: 'taxpayers', entityId: t ? t.id : null, req });
      return badCredentials(res);
    }

    // 🔴 THE RIGHT PASSWORD FOR THE WRONG KIND OF ACCOUNT IS STILL THE WRONG DOOR.
    //
    // A director signing in on the organisations page with their PERSONAL account
    // would otherwise be handed the company screens wired to their own tax data.
    // Every figure real. Every figure the wrong taxpayer's. Nothing looking broken.
    const kind = req.body?.kind === 'entity' ? 'entity' : 'individual';
    if (t.kind !== kind) {
      await db.audit({ actorId: t.id, action: 'LOGIN_KIND_MISMATCH', entity: 'taxpayers', entityId: t.id, req });
      return res.status(409).json({
        ok: false, error: 'WRONG_ACCOUNT_KIND',
        registeredAs: t.kind, youAskedFor: kind,
        headline: t.kind === 'individual'
          ? 'This is a personal account.'
          : 'This is a company account.',
        why: [
          'On Selah, a person and a company are separate accounts. Your password is correct — but this is the wrong door.',
          'We will not sign you into one and let you believe you are looking at the other. Every number on the screen would have been real, and every number would have been the wrong taxpayer\'s.',
        ],
        whatYouCanDoNow: t.kind === 'individual'
          ? ['Sign in on the individuals page.']
          : ['Sign in on the organisations page.'],
      });
    }

    // A clean login clears the account's failure count. The IP's stays.
    await db.query('DELETE FROM auth_failures WHERE email_idx = $1', [idx]);

    const token = await session.issue(t.id, req);
    res.cookie('selah_session', token, session.cookieOptsFor(req));
    await db.audit({ actorId: t.id, subjectId: t.id, action: 'LOGIN', entity: 'taxpayers', entityId: t.id, req });

    res.json({ ok: true, kind: t.kind, emailVerified: t.email_verified });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/verify-email  { token }
// ═══════════════════════════════════════════════════════════════════════════
router.post('/verify-email', async (req, res, next) => {
  try {
    const h = pw.tokenHash(String(req.body?.token || ''));
    const { rows } = await db.query(
      `SELECT * FROM email_tokens
       WHERE token_hash = $1 AND purpose = 'verify' AND consumed_at IS NULL AND expires_at > now()`, [h]
    );
    if (!rows.length) {
      return res.status(400).json({ ok: false, error: 'BAD_TOKEN',
        headline: 'That confirmation link is not valid any more.',
        why: ['It may have expired, or already been used. Sign in and we will send you a fresh one.'] });
    }
    await db.query('UPDATE email_tokens SET consumed_at = now() WHERE id = $1', [rows[0].id]);
    await db.query('UPDATE taxpayers SET email_verified = true WHERE id = $1', [rows[0].taxpayer_id]);
    await db.audit({ actorId: rows[0].taxpayer_id, subjectId: rows[0].taxpayer_id,
      action: 'EMAIL_VERIFIED', entity: 'taxpayers', entityId: rows[0].taxpayer_id, req });
    res.json({ ok: true, verified: true });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/forgot  { email }
// ═══════════════════════════════════════════════════════════════════════════
router.post('/forgot', async (req, res, next) => {
  try {
    // 🔴 WE CANNOT EMAIL. SO WE SAY SO — we do not return a soothing "check your
    // inbox" for a message that nothing in this system ever tried to send.
    if (!mail.isConfigured()) return mail.notConfigured(res, 'reset your password');

    const email = normaliseEmail(req.body?.email);
    const ip = ipOf(req);
    if (await isLockedOut(email ? blindIndex(email) : null, ip)) return lockedOut(res);

    // From here the answer is ALWAYS the same, whether or not the account exists.
    // Anything else turns this endpoint into a "does this person use Selah?" API.
    const generic = { ok: true, sent: true,
      message: 'If that address has a Selah account, we have emailed a link to reset the password. The link expires in 1 hour.' };

    if (!email) return res.json(generic);

    const { rows } = await db.query('SELECT id FROM taxpayers WHERE email_idx = $1', [blindIndex(email)]);
    if (!rows.length) {
      await recordFailure(null, ip);       // an unknown address still costs an attempt
      return res.json(generic);
    }

    const t = await issueToken(rows[0].id, 'reset', RESET_TTL_HOURS);
    const tpl = mail.templates.reset(`${baseUrl(req)}/reset-password.html?token=${t}`);
    const sent = await mail.send({ to: email, ...tpl });

    await db.audit({ actorId: rows[0].id, subjectId: rows[0].id, action: 'PASSWORD_RESET_REQUESTED',
      entity: 'taxpayers', entityId: rows[0].id, req });

    // The provider rejected it or is down. That is OUR failure, not a secret, and a
    // person who never gets the email deserves to know we know.
    if (!sent.ok) {
      return res.status(502).json({ ok: false, error: 'MAIL_TRANSPORT_FAILED',
        headline: 'We could not send the email.',
        why: ['Our mail provider did not accept the message. This is our problem, not yours. Please try again shortly.'] });
    }
    res.json(generic);
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/reset  { token, password }
// ═══════════════════════════════════════════════════════════════════════════
router.post('/reset', async (req, res, next) => {
  try {
    const strength = pw.check(req.body?.password);
    if (!strength.ok) return res.status(400).json({ ok: false, ...strength });

    const h = pw.tokenHash(String(req.body?.token || ''));
    const { rows } = await db.query(
      `SELECT * FROM email_tokens
       WHERE token_hash = $1 AND purpose = 'reset' AND consumed_at IS NULL AND expires_at > now()`, [h]
    );
    if (!rows.length) {
      return res.status(400).json({ ok: false, error: 'BAD_TOKEN',
        headline: 'That reset link is not valid any more.',
        why: ['A reset link works ONCE, and expires after an hour. Ask for a new one.'] });
    }
    const tok = rows[0];

    await db.query('UPDATE email_tokens SET consumed_at = now() WHERE id = $1', [tok.id]);
    await db.query('UPDATE taxpayers SET password_hash = $1, email_verified = true WHERE id = $2',
      [pw.hash(req.body.password), tok.taxpayer_id]);

    // 🔴 KILL EVERY EXISTING SESSION.
    //
    // The whole point of a reset is often that somebody else is in the account. If
    // we leave their session alive, we have changed the lock and left the intruder
    // inside the house.
    await db.query('DELETE FROM sessions WHERE taxpayer_id = $1', [tok.taxpayer_id]);
    await db.query('DELETE FROM auth_failures WHERE email_idx = (SELECT email_idx FROM taxpayers WHERE id = $1)', [tok.taxpayer_id]);

    await db.audit({ actorId: tok.taxpayer_id, subjectId: tok.taxpayer_id, action: 'PASSWORD_RESET',
      entity: 'taxpayers', entityId: tok.taxpayer_id, req });

    res.json({ ok: true, reset: true,
      message: 'Your password has been changed, and every device that was signed in has been signed out.' });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
router.post('/signout', session.require, async (req, res, next) => {
  try {
    await db.query('DELETE FROM sessions WHERE taxpayer_id = $1 AND token_hash = $2',
      [req.taxpayerId, session.hash(req.cookies?.selah_session || '')]);
    res.clearCookie('selah_session', session.cookieOptsFor(req));
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'LOGOUT', entity: 'sessions', req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
