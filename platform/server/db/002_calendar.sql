-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 002: THE TAX CALENDAR
--
-- Two tables, and the second one is the whole product.
--
-- `tax_profile` is what we ASKED the taxpayer. Note that every flag is
-- THREE-STATE: true, false, or NULL. NULL means WE NEVER ASKED — and a NULL
-- must never be rendered as a "no". The most-missed tax obligation in Uganda
-- (provisional tax on side income) is missed precisely because nobody asks.
--
-- `directors` is THE DIRECTOR TRAP. A director's unfiled PERSONAL return blocks
-- the COMPANY's tax clearance certificate. That obligation belongs to a human
-- being, appears on no company ledger, and is invisible from inside the company's
-- own books. It is the only row in this schema that describes a person who may
-- not be our user at all — which is exactly why it is encrypted, and exactly why
-- it is behind the PDPO gate.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tax_profile (
  taxpayer_id           UUID PRIMARY KEY REFERENCES taxpayers(id) ON DELETE CASCADE,

  -- 🔴 BOOLEAN, NULLABLE, ON PURPOSE. NULL = NOT ASKED ≠ FALSE.
  employs_people        BOOLEAN,
  is_withholding_agent  BOOLEAN,
  vat_registered        BOOLEAN,
  files_income_tax      BOOLEAN,
  has_non_employment_income BOOLEAN,

  -- A company may hold a SUBSTITUTED year of income (ITA s.39). If it does and we
  -- are not told WHICH month it ends, the engine REFUSES to place a date rather
  -- than assume June. Six months of wrong deadlines is not a rounding error.
  year_end_month        SMALLINT CHECK (year_end_month BETWEEN 1 AND 12),

  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  delete_after          DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years')
);

CREATE TABLE IF NOT EXISTS directors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id           UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,

  -- A named third party. Encrypted, always.
  name_enc              BYTEA NOT NULL,
  tin_enc               BYTEA,

  -- 🔴 THE SPLIT THAT IS THE WHOLE INSIGHT:
  --    unfiled RETURNS → BLOCKS the company TCC   (URA states it — confidence A)
  --    unpaid ARREARS  → URA IS SILENT            (confidence C — warn, never assert)
  personal_returns_filed BOOLEAN,   -- NULL = we do not know. Not the same as "yes".
  has_arrears            BOOLEAN,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  delete_after          DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years')
);

CREATE INDEX IF NOT EXISTS directors_taxpayer_idx ON directors (taxpayer_id);
