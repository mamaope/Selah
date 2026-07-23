-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 012: A TRANSFER CAN BE EARMARKED FOR A GOAL
--
-- 🔑 A transfer INTO a savings account may name the goal it is for. A goal's
--    progress becomes the money TAGGED to it — so one savings account can hold
--    several goals, and each shows only what was put toward it.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE entries ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS entries_goal_idx ON entries (goal_id);
