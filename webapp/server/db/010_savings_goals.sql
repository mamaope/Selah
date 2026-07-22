-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 010: SAVINGS GOALS  (+ the new savings account types)
--
-- 🔑 A goal is a target, a date, and a POT — a real savings account it watches.
--    The goal holds no money of its own; progress is the account's balance.
-- 🔴 The account `type` CHECK must learn the two new savings vehicles, or an
--    Emergency-fund / Savings account can never be created.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) teach the accounts type constraint the new savings vehicles
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check CHECK (type IN (
  'cash','mobile_money','bank',
  'emergency_fund','savings','sacco','vsla','fixed_deposit',
  'unit_trust','treasury','shares','land',
  'loan','borrowing','receivable'));

-- 2) the goals themselves
CREATE TABLE IF NOT EXISTS savings_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  account_id   UUID REFERENCES accounts(id) ON DELETE SET NULL,   -- the pot backing it
  name_enc     TEXT NOT NULL,
  target_enc   TEXT NOT NULL,                                     -- encrypted amount
  target_date  DATE,                                              -- nullable: a goal may have no date
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS savings_goals_owner_idx ON savings_goals (owner_id);
