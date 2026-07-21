-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 009: SHOPPING LISTS
--
-- 🔑 A list is a plan; an item marked DONE becomes a real expense (entries), and
--    the actual price flows back into the price book. Amounts are encrypted, so
--    every total is computed in Node by the engine.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS shopping_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name_enc     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shopping_lists_book_idx ON shopping_lists (book_id);

CREATE TABLE IF NOT EXISTS shopping_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id        UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  label_enc      TEXT NOT NULL,
  quantity       NUMERIC,
  unit           TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  -- captured when marked done:
  actual_enc     TEXT,
  done_at        TIMESTAMPTZ,
  -- 🔑 the link back to the expense this became:
  entry_id       UUID REFERENCES entries(id) ON DELETE SET NULL,
  position       INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shopping_items_list_idx ON shopping_items (list_id);
