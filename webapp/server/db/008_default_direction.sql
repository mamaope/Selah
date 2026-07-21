-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 008: a default is income OR expense, and it remembers its unit.
--
-- The "default values" table unifies the price book with the monthly plan: each
-- item is a default with a direction (money in / money out), a unit, and a price
-- that carries its own history. Income (salary) and expense (sugar) live in one
-- list, told apart by this column.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE value_points ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'out'
  CHECK (direction IN ('in', 'out'));
