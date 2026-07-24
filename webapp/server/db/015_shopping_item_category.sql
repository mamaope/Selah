-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 015: A SHOPPING ITEM CAN REMEMBER ITS BUDGET CATEGORY
--
-- 🔑 When a planned budget item is pushed to a shopping list, it carries the
--    category it belongs to — so when it is bought, the expense lands in the
--    right category without asking again.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
