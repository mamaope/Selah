-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 014: PLANNED ITEMS INSIDE A BUDGET CATEGORY
--
-- 🔑 A category's budget can be built bottom-up: the specific things you plan to
--    buy this month. The budget is the SUM of them by default, but you may set it
--    HIGHER (money aside for the unknown) — and never LOWER than the sum.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS budget_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name_enc     TEXT NOT NULL,
  estimate_enc TEXT NOT NULL,                       -- planned cost, encrypted
  starts_on    DATE NOT NULL,
  ends_on      DATE NOT NULL,
  shopping_item_id UUID REFERENCES shopping_items(id) ON DELETE SET NULL,  -- if pushed to a list
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS budget_items_book_period_idx ON budget_items (book_id, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS budget_items_category_idx ON budget_items (category_id);
