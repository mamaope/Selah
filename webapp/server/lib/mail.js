/**
 * SELAH — OUTBOUND EMAIL
 * ─────────────────────────────────────────────────────────────────────────────
 * Sent over a provider's HTTPS API with the built-in `fetch`. NOT SMTP.
 *
 * Two reasons, and neither is fashion:
 *
 *   1. NO NEW DEPENDENCY. nodemailer would mean a new package in package.json, a
 *      new lockfile entry, and another thing that can be compromised upstream and
 *      run with our mail credentials. Node 22 has fetch. This file is 60 lines.
 *
 *   2. SMTP hand-rolled is a security bug generator. A JSON POST is not.
 *
 * Configure THREE variables. Any modern provider (Resend, Postmark, Mailgun,
 * SendGrid) exposes a JSON API shaped close enough to this:
 *
 *     MAIL_API_URL=https://api.resend.com/emails
 *     MAIL_API_KEY=re_xxxxxxxx
 *     MAIL_FROM=Selah <no-reply@yourdomain.ug>
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 IF IT IS NOT CONFIGURED, WE DO NOT PRETEND TO HAVE SENT ANYTHING.
 *
 * The lazy path is to swallow the error and return 200 — "if that address exists,
 * we've sent you a link" — which reads as reassuring and is a lie. A person would
 * then sit and wait for an email that no part of this system ever tried to send.
 *
 * `/auth/start` already refuses to fake an SMS. Email is held to the same rule.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const URL_ = () => process.env.MAIL_API_URL || '';
const KEY  = () => process.env.MAIL_API_KEY || '';
const FROM = () => process.env.MAIL_FROM    || '';

function isConfigured() {
  return Boolean(URL_() && KEY() && FROM());
}

function whatIsMissing() {
  const m = [];
  if (!URL_()) m.push('MAIL_API_URL');
  if (!KEY())  m.push('MAIL_API_KEY');
  if (!FROM()) m.push('MAIL_FROM');
  return m;
}

/** The honest 503. Returned by every route that cannot do its job without mail. */
function notConfigured(res, action) {
  return res.status(503).json({
    ok: false,
    error: 'MAIL_NOT_CONFIGURED',
    headline: `We cannot ${action}, because we cannot send you an email.`,
    why: [
      'No mail provider is configured on this server, so there is no way for us to reach you.',
      'We will not tell you to "check your inbox" for a message that nothing in this system ever tried to send.',
    ],
    _forOperators: { missing: whatIsMissing() },
  });
}

/**
 * @returns {Promise<{ok: boolean, status?: number, error?: string}>}
 */
async function send({ to, subject, html }) {
  if (!isConfigured()) return { ok: false, error: 'MAIL_NOT_CONFIGURED' };

  let res;
  try {
    res = await fetch(URL_(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM(), to: [to], subject, html }),
    });
  } catch (e) {
    // The provider is unreachable. Say so. Do not claim to have sent mail.
    return { ok: false, error: 'MAIL_TRANSPORT_FAILED' };
  }

  if (!res.ok) return { ok: false, status: res.status, error: 'MAIL_REJECTED' };
  return { ok: true };
}

/** The two messages we actually send. Plain, short, and they name the sender. */
const templates = {
  verify: (link) => ({
    subject: 'Confirm your Selah account',
    html: `<p>Confirm this email address to finish setting up your Selah account.</p>
           <p><a href="${link}">Confirm my email</a></p>
           <p>This link expires in 24 hours. If you did not create a Selah account, ignore this email — nothing will happen.</p>
           <p>— Selah</p>`,
  }),
  reset: (link) => ({
    subject: 'Reset your Selah password',
    html: `<p>Someone asked to reset the password on this Selah account.</p>
           <p><a href="${link}">Set a new password</a></p>
           <p>This link expires in 1 hour and can be used once. If it was not you, ignore this email — your password has not changed, and nobody has been let in.</p>
           <p>— Selah</p>`,
  }),
};

module.exports = { send, isConfigured, whatIsMissing, notConfigured, templates };
