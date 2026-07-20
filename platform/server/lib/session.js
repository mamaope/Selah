/** Sessions. The token is never stored — only a hash of it. */
const crypto = require('crypto');
const db = require('./db');

const DAYS = 30;
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

async function issue(taxpayerId, req) {
  const token = crypto.randomBytes(32).toString('base64url');
  await db.query(
    `INSERT INTO sessions (taxpayer_id, token_hash, user_agent, expires_at)
     VALUES ($1,$2,$3, now() + interval '${DAYS} days')`,
    [taxpayerId, hash(token), req?.get?.('user-agent') || null]
  );
  return token;
}

/** Auth middleware. Attaches req.taxpayerId, or 401s. */
async function require_(req, res, next) {
  const token = req.cookies?.selah_session;
  if (!token) return res.status(401).json({ ok: false, error: 'NOT_SIGNED_IN' });

  const { rows } = await db.query(
    `SELECT taxpayer_id FROM sessions
      WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [hash(token)]
  );
  if (!rows.length) return res.status(401).json({ ok: false, error: 'SESSION_EXPIRED' });

  req.taxpayerId = rows[0].taxpayer_id;
  next();
}

const cookieOpts = {
  httpOnly: true,                       // JS cannot read it. XSS cannot steal it.
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: DAYS * 24 * 60 * 60 * 1000,
  path: '/',
};

module.exports = { issue, require: require_, cookieOpts, hash };
