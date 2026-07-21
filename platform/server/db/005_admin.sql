-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 005: a role flag
--
-- 🔴 THIS COLUMN GRANTS NO POWER TODAY, AND THAT IS DELIBERATE.
--
-- There is NO admin panel, and there is deliberately no way for one account to
-- read another taxpayer's financial data. Under Uganda's Data Protection and
-- Privacy Act that would be the single most dangerous thing in the system.
--
-- 'admin' currently means one thing only: a login that was SEEDED (created by an
-- operator, already verified) rather than self-registered. When — IF — real admin
-- features are ever built, they must be a separate, audited, deliberate decision.
-- Until then this is a label, not a licence.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE taxpayers
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('member', 'admin'));
