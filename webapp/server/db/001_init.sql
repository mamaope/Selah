-- ═══════════════════════════════════════════════════════════════════════════════
-- SELAH — THE SCHEMA
--
-- 🔴 EVERY COLUMN THAT IDENTIFIES A PERSON, OR REVEALS THEIR MONEY, IS ENCRYPTED
--    BEFORE IT ARRIVES HERE. This database never sees a phone number, a TIN, or a
--    salary in plaintext. If it is dumped, it yields ciphertext.
--
--    Columns ending `_enc` are AES-256-GCM. Columns ending `_idx` are blind
--    indexes — an HMAC, so we can find a user by phone without storing the phone.
--
-- 🔴 AND EVERY READ IS AUDITED. Not every WRITE — every READ.
--
--    Most platforms log writes, because writes are what break things. But the
--    thing that destroys a company holding Ugandans' tax data is not a bad write.
--    It is somebody LOOKING at data they had no business looking at, and nobody
--    ever knowing.
--
--    Under DPPA a data subject can ask what was done with their data. If we
--    cannot answer, we are not a controller — we are a liability.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── the person ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taxpayers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🔑 TAXPAYER IS THE ROOT OBJECT. Anything with a TIN is a taxpayer. An
  -- individual and an entity are SUBTYPES, not separate systems — because the
  -- question that matters ("whose personal failure blocks this company's TCC?")
  -- lives in the edge between them, and a schema that separates them cannot ask it.
  kind              TEXT NOT NULL CHECK (kind IN ('individual', 'entity')),

  phone_enc         TEXT,          -- AES-256-GCM
  phone_idx         TEXT UNIQUE,   -- HMAC. Queryable. One-way.
  name_enc          TEXT,
  tin_enc           TEXT,
  tin_idx           TEXT,

  -- Never encrypted: it identifies nobody, and we need it for the rules engine.
  residence         TEXT DEFAULT 'resident' CHECK (residence IN ('resident', 'non-resident')),

  -- 🔴 CONSENT IS A RECORD, NOT A CHECKBOX.
  -- DPPA requires consent to be freely given, specific, informed — and PROVABLE.
  -- "They ticked a box" is not provable. This is.
  consent_given_at  TIMESTAMPTZ,
  consent_version   TEXT,
  consent_scope     JSONB,         -- exactly WHAT they consented to. Not "everything".

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 🔴 RETENTION. TPCA requires 5 years; we design for 7. A row past its date is
  -- not "old data" — it is unlawful processing. The reaper enforces this.
  delete_after      DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years')
);

CREATE INDEX IF NOT EXISTS taxpayers_phone_idx ON taxpayers (phone_idx);
CREATE INDEX IF NOT EXISTS taxpayers_reap_idx  ON taxpayers (delete_after);

-- ── login ─────────────────────────────────────────────────────────────────────
-- Phone-first OTP. Ugandans have phones, not email habits.
CREATE TABLE IF NOT EXISTS otp_challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_idx     TEXT NOT NULL,      -- we never store the phone itself here
  code_hash     TEXT NOT NULL,      -- and never the code, either
  attempts      INT  NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_phone_idx ON otp_challenges (phone_idx, expires_at);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id   UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,   -- the token itself is never stored
  user_agent    TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_taxpayer_idx ON sessions (taxpayer_id);

-- ── payslips — the Isaac-class finding, at national scale ─────────────────────
CREATE TABLE IF NOT EXISTS payslips (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id   UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,

  period        DATE NOT NULL,               -- the month it relates to
  employer_enc  TEXT,
  gross_enc     TEXT NOT NULL,               -- 🔴 money. encrypted.
  paye_enc      TEXT,                        -- what they ACTUALLY deducted
  nssf_enc      TEXT,
  lst_enc       TEXT,
  net_enc       TEXT,

  -- 🔑 WHAT THE ENGINE SAYS IT SHOULD HAVE BEEN — and the rule version that said so.
  -- Storing the rule id is not bureaucracy. When Parliament moves a band, we can
  -- find every person advised under the old one and TELL THEM. No Ugandan tax
  -- practice can do that.
  computed_paye_enc  TEXT,
  variance_enc       TEXT,
  rule_id            TEXT,
  rule_verified_on   DATE,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (taxpayer_id, period)
);
CREATE INDEX IF NOT EXISTS payslips_taxpayer_idx ON payslips (taxpayer_id, period DESC);

-- ── the WHT register — this is the Isaac product ──────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id       UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,

  invoice_no_enc    TEXT,
  invoice_date      DATE NOT NULL,
  client_name_enc   TEXT,
  amount_enc        TEXT NOT NULL,

  payment_type      TEXT NOT NULL,           -- maps to the WHT rate card
  wht_withheld_enc  TEXT,

  -- 🔑 THE BOOLEAN THAT IS THE ENTIRE PRODUCT.
  -- WHT deducted from you is PREPAID TAX — a credit. But ONLY if you hold the
  -- certificate. A credit you cannot evidence is a credit you do not have.
  -- Isaac: UGX 70,000,000 over five years, because of this column.
  certificate_held  BOOLEAN NOT NULL DEFAULT FALSE,
  certificate_no_enc TEXT,
  chased_on         DATE,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_taxpayer_idx ON invoices (taxpayer_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS invoices_missing_cert ON invoices (taxpayer_id) WHERE certificate_held = FALSE;

-- ── money: budget, debts, assets ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS money_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id   UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('income','expense','debt','asset','liability','saving')),
  label_enc     TEXT,
  amount_enc    TEXT NOT NULL,
  meta          JSONB,               -- rate, term, category — never a name or a number
  as_of         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS money_taxpayer_idx ON money_items (taxpayer_id, kind, as_of DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔴 THE AUDIT LOG — AND IT LOGS READS, NOT JUST WRITES.
--
-- The thing that destroys a company holding this data is not a bad write. It is
-- somebody LOOKING at data they had no business looking at, and nobody ever
-- knowing.
--
-- Under DPPA a data subject may ask what was done with their data. If we cannot
-- answer that question, we are not a data controller. We are a liability with a
-- login screen.
--
-- APPEND ONLY. There is no UPDATE and no DELETE on this table, by design — see
-- the trigger below. An audit log you can edit is not an audit log.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  actor_id      UUID,                -- who looked
  subject_id    UUID,                -- whose data they looked at
  action        TEXT NOT NULL,       -- READ / CREATE / UPDATE / DELETE / EXPORT / LOGIN / REFUSED
  entity        TEXT NOT NULL,       -- payslips, invoices, taxpayers…
  entity_id     UUID,

  -- 🔴 NEVER the data itself. An audit log full of payslips is a second copy of
  -- the breach. We log THAT it happened, not WHAT was in it.
  detail        JSONB,

  ip            INET,
  user_agent    TEXT
);
CREATE INDEX IF NOT EXISTS audit_subject_idx ON audit_log (subject_id, at DESC);
CREATE INDEX IF NOT EXISTS audit_actor_idx   ON audit_log (actor_id, at DESC);

-- Append-only, enforced by the database and not by anyone's good intentions.
CREATE OR REPLACE FUNCTION audit_is_append_only() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is APPEND ONLY. An audit log you can edit is not an audit log.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audit_log;
CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_is_append_only();

-- ── consent, versioned ────────────────────────────────────────────────────────
-- 🔴 Including the one that will catch us: a DIRECTOR is a data subject too, and
-- the company cannot consent on their behalf. Their unfiled personal return is
-- our best finding — and looking it up without their own signature is a breach.
CREATE TABLE IF NOT EXISTS consents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id   UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  scope         TEXT NOT NULL,   -- 'records_review' | 'ura_correspondence' | 'director_lookup'
  version       TEXT NOT NULL,
  given_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at  TIMESTAMPTZ,     -- consent that cannot be withdrawn is not consent
  evidence      JSONB
);
CREATE INDEX IF NOT EXISTS consents_taxpayer_idx ON consents (taxpayer_id, scope);
