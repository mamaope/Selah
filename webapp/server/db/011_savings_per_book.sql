-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 011: SAVINGS IS PER-BOOK
--
-- 🔑 A runway is only honest when the savings and the expenses come from the SAME
--    context — and that context is a Book. So accounts move INTO books, and goals
--    learn which book they belong to.
--
-- 🔴 A blended runway (a shop's cash over personal groceries) is the meaningless
--    number this whole product refuses. Per-book, each is apples-to-apples.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Attach every PERSONAL account to its owner's default book. The XOR constraint
--    (owner_id vs book_id) is satisfied: we set book_id and clear owner_id.
UPDATE accounts a
   SET book_id = b.id, owner_id = NULL
  FROM books b
 WHERE a.owner_id IS NOT NULL
   AND b.owner_id = a.owner_id
   AND b.is_default;
-- (Any account whose owner has no default book is left personal — an edge case,
--  not silently mis-filed.)

-- 2) Goals belong to a book now — for the runway they are read against.
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES books(id) ON DELETE CASCADE;

-- backfill: a goal with an account takes that account's book…
UPDATE savings_goals g
   SET book_id = a.book_id
  FROM accounts a
 WHERE g.account_id = a.id AND g.book_id IS NULL AND a.book_id IS NOT NULL;

-- …and any remaining goal goes to the owner's default book.
UPDATE savings_goals g
   SET book_id = b.id
  FROM books b
 WHERE g.book_id IS NULL AND b.owner_id = g.owner_id AND b.is_default;

CREATE INDEX IF NOT EXISTS savings_goals_book_idx ON savings_goals (book_id);
