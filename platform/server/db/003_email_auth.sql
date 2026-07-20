-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 003: EMAIL + PASSWORD
--
-- Phone + OTP was a door with no key: the SMS gateway was never wired, so nobody
-- could ever sign in. Email and password work today.
--
-- 🔴 THE EMAIL IS ENCRYPTED, AND IT IS INDEXED BY A ONE-WAY HMAC.
--
-- The obvious schema is `email TEXT UNIQUE` and it is wrong. An email address is
-- personal data under Uganda's DPPA, and it is also the single most useful column
-- in this database to an attacker — it is the join key to every other breach on
-- the internet. So we store the CIPHERTEXT, and we search on a BLIND INDEX: an
-- HMAC that lets us ask "is this address already registered?" without ever holding
-- a readable list of our own users.
--
-- The password is NOT encrypted. It is HASHED with scrypt, per-user salt, and it
-- is not reversible even by us. See lib/password.js.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE taxpayers ADD COLUMN IF NOT EXISTS email_enc      TEXT;
ALTER TABLE taxpayers ADD COLUMN IF NOT EXISTS email_idx      TEXT;
ALTER TABLE taxpayers ADD COLUMN IF NOT EXISTS password_hash  TEXT;
ALTER TABLE taxpayers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- One account per address. The blind index is what enforces it — we never see
-- the addresses themselves in order to do so.
CREATE UNIQUE INDEX IF NOT EXISTS taxpayers_email_idx_uniq ON taxpayers (email_idx) WHERE email_idx IS NOT NULL;

-- The phone is now OPTIONAL — a profile field, not a credential.
ALTER TABLE taxpayers ALTER COLUMN phone_idx DROP NOT NULL;

-- ── verification + reset tokens ────────────────────────────────────────────
-- 🔴 STORED HASHED. A copy of this table must NOT be a set of working reset links
--    that hand an attacker every account in the system.
CREATE TABLE IF NOT EXISTS email_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id  UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  purpose      TEXT NOT NULL CHECK (purpose IN ('verify', 'reset')),
  token_hash   TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,               -- single use. A reset link is not a key.
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_tokens_hash_idx ON email_tokens (token_hash);
CREATE INDEX IF NOT EXISTS email_tokens_reap_idx ON email_tokens (expires_at);

-- ── brute force ────────────────────────────────────────────────────────────
-- A password is only as strong as the number of guesses allowed against it.
-- We count failures BY ACCOUNT and BY IP, because an attacker with a password list
-- attacks one account, and an attacker with an email list attacks one password
-- across thousands of accounts — and only the second is invisible per-account.
CREATE TABLE IF NOT EXISTS auth_failures (
  id         BIGSERIAL PRIMARY KEY,
  email_idx  TEXT,
  ip         TEXT,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_failures_email_idx ON auth_failures (email_idx, at);
CREATE INDEX IF NOT EXISTS auth_failures_ip_idx    ON auth_failures (ip, at);
