-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 016: CLEAN UP MEANINGLESS "DID NOT COME" EXPENSES
--
-- 🔑 "Did not come" is for INCOME promised and never paid — evidence worth keeping.
--    An EXPENSE (or transfer) marked did-not-arrive is just money you did not spend;
--    it is nothing to keep, and it was cluttering the month view. Remove those.
--    (Income that did not arrive is untouched.)
-- ═══════════════════════════════════════════════════════════════════════════
DELETE FROM entries WHERE status = 'did_not_arrive' AND direction <> 'in';
