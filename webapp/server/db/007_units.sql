-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 007: UNIT PRICING ON ENTRIES
--
-- 🔑 An expense is a quantity of a thing at a price. "2 Kg of sugar" is 2 × 1,000.
--    The total is still authoritative (it is what was actually paid), but now we
--    also keep the quantity and the unit price — so the price book stays true and
--    "enter the quantity only" can auto-fill the rest.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE entries ADD COLUMN IF NOT EXISTS quantity     NUMERIC;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS unit         TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS unit_price_enc TEXT;
