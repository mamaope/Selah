-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 013: ACCOUNTS ARE SHARED ACROSS BOOKS (personal again)
--
-- 🔑 You have ONE MoMo, ONE bank, ONE SACCO — used everywhere. An account belongs
--    to the PERSON and is usable from any Book. (011 had put them in books so that
--    savings could be per-book; savings is now attributed per-book by CONTRIBUTION
--    — what each Book moved into savings — so accounts no longer need a home Book.)
--
-- 🔴 Reverses 011: move every book-scoped account back to its owner. The XOR
--    constraint (owner_id vs book_id) is satisfied — owner_id set, book_id NULL.
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE accounts a
   SET owner_id = b.owner_id, book_id = NULL
  FROM books b
 WHERE a.book_id = b.id
   AND a.owner_id IS NULL;
