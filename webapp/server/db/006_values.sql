-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 006: VALUE HISTORY
--
-- 🔑 A DEFAULT IS NOT A NUMBER. IT IS A NUMBER WITH A HISTORY.
--
-- When a template default changes — the gas price creeps up, the salary is raised
-- — we do NOT overwrite it. We APPEND a dated point. The change is the data: it is
-- how we show growth, show inflation, and project better. Every amount is
-- encrypted, so the trend is computed in Node by the engine, never in SQL.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS value_points (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  -- what is being tracked. A stable key ("gas", "salary") groups the history.
  item_key     TEXT NOT NULL,
  label_enc    TEXT,
  unit_enc     TEXT,                        -- "per refill", "per month" — cosmetic
  amount_enc   TEXT NOT NULL,               -- integer, encrypted
  as_of        DATE NOT NULL,               -- the value AS OF this date
  note_enc     TEXT,
  recorded_by  UUID REFERENCES taxpayers(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- one value per item per day — recording twice on the same day is a correction,
  -- not a second point.
  UNIQUE (book_id, item_key, as_of)
);
CREATE INDEX IF NOT EXISTS value_points_item_idx ON value_points (book_id, item_key, as_of);
