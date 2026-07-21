-- ═══════════════════════════════════════════════════════════════════════════
-- SELAH — 004: BOOKS, ACCOUNTS, BUDGETS, ENTRIES
--
-- 🔴 THREE THINGS ARE BUILT IN FROM ROW ONE, BECAUSE RETROFITTING THEM IS AGONY:
--
--   1. OWNERSHIP AND MEMBERSHIP. Sharing ships later. But bolting `owner_id` and
--      a members table onto every row afterwards means rewriting every query and
--      every permission check — and a permission check added late is a permission
--      check that gets forgotten in one place.
--
--   2. CURRENCY. Many Ugandans hold USD. A currency column added later means
--      migrating every amount, every total, every comparison, in a live database
--      full of real money.
--
--   3. MINOR UNITS. Every amount is an INTEGER of its minor unit — 1 for UGX,
--      100 (cents) for USD. Store money as a float and you WILL lose a cent, and
--      you will lose it silently.
--
-- 🔴 AND EVERY AMOUNT IS ENCRYPTED.
--
-- Which means we CANNOT SUM IN SQL. Every total is computed in Node, by the
-- engine, from decrypted values. That is a deliberate cost: a database that can
-- add up a Ugandan's salary is a database that can read it.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── BOOKS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  name_enc      TEXT NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  kind          TEXT NOT NULL DEFAULT 'personal' CHECK (kind IN ('personal', 'shared')),
  currency      TEXT NOT NULL DEFAULT 'UGX' CHECK (currency IN ('UGX', 'USD')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  delete_after  DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years')
);
CREATE INDEX IF NOT EXISTS books_owner_idx ON books (owner_id);
-- Exactly one default Book per person.
CREATE UNIQUE INDEX IF NOT EXISTS books_one_default ON books (owner_id) WHERE is_default;

-- ── MEMBERSHIP — the shared-Book table, present before the feature ──────────
-- 🔴 A LEAVER'S ENTRIES SURVIVE. Deleting them would blow a hole in the OTHER
--    person's financial history — 4,000,000 of school fees vanishing from a Book
--    that really did pay it. So membership goes 'former', and the entries stay.
--
--    This MUST be disclosed BEFORE somebody joins. A consent that did not say so
--    was not informed, and an uninformed consent is not a consent. `consent_id`
--    points at the row that proves we told them.
CREATE TABLE IF NOT EXISTS book_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  -- NOT a cascade delete: if the person deletes their Selah account, the
  -- membership survives as 'former', severed from a taxpayer that no longer exists.
  taxpayer_id   UUID REFERENCES taxpayers(id) ON DELETE SET NULL,
  display_enc   TEXT,                       -- what the other members see them as
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'former')),
  consent_id    UUID REFERENCES consents(id),
  joined_at     TIMESTAMPTZ,
  left_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS book_members_book_idx ON book_members (book_id);
CREATE INDEX IF NOT EXISTS book_members_person_idx ON book_members (taxpayer_id);

-- ── ACCOUNTS ───────────────────────────────────────────────────────────────
-- 🔴 THE PRIVACY BOUNDARY, EXPRESSED AS A CONSTRAINT.
--
--   owner_id set  → a PERSONAL account. Yours. Its BALANCE IS NEVER SHOWN to a
--                   co-member. They see "Dad contributed 500,000 from MTN MoMo" —
--                   the name, the amount, the person. Never the balance.
--   book_id set   → a BOOK account (the child's savings). Every member sees it,
--                   balance and all. That is the point of it.
--
-- Exactly one of the two. A leak here is a financial-coercion tool.
CREATE TABLE IF NOT EXISTS accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES taxpayers(id) ON DELETE CASCADE,
  book_id       UUID REFERENCES books(id) ON DELETE CASCADE,
  name_enc      TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN (
                  'cash','mobile_money','bank','sacco','vsla','fixed_deposit',
                  'unit_trust','treasury','shares','land','loan','borrowing','receivable')),
  currency      TEXT NOT NULL DEFAULT 'UGX' CHECK (currency IN ('UGX', 'USD')),
  liquid        BOOLEAN,                    -- NULL = use the type's default
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  delete_after  DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years'),

  CONSTRAINT accounts_owner_xor_book CHECK (
    (owner_id IS NOT NULL AND book_id IS NULL) OR
    (owner_id IS NULL AND book_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS accounts_owner_idx ON accounts (owner_id);
CREATE INDEX IF NOT EXISTS accounts_book_idx  ON accounts (book_id);

-- ── OPENING BALANCES — reality, recorded ───────────────────────────────────
-- 🔑 This is what re-grounds the books every month, so that drift CANNOT COMPOUND.
--    We are not a bank. We cannot see your balance. You tell us what it said.
CREATE TABLE IF NOT EXISTS opening_balances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  as_of         DATE NOT NULL,
  amount_enc    TEXT NOT NULL,              -- integer minor units, encrypted
  recorded_by   UUID REFERENCES taxpayers(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, as_of)
);

-- ── CATEGORIES — the join between the plan and the reality ──────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  key           TEXT NOT NULL,
  label_enc     TEXT NOT NULL,
  direction     TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  -- 🔴 A LUMPY category may NEVER be averaged into a monthly figure.
  --    School fees are not one-third of a term each month.
  lumpy         BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, key)
);

-- ── TEMPLATES — the plan ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name_enc      TEXT,
  cadence       TEXT NOT NULL CHECK (cadence IN ('weekly', 'monthly', 'quarterly', 'annual')),
  -- 🔴 REQUIRED for quarterly and annual. We do not assume January, and we do not
  --    assume July. Assume wrong and every date is up to three months out — and it
  --    looks perfectly reasonable.
  anchor        DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT templates_anchor_required CHECK (
    cadence IN ('weekly', 'monthly') OR anchor IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS template_lines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  direction     TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  label_enc     TEXT NOT NULL,
  amount_enc    TEXT NOT NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  position      INT NOT NULL DEFAULT 0
);

-- ── BUDGETS — INSTANCES, with a start and an end ───────────────────────────
-- 🔴 A BUDGET IS NEVER DIVIDED. To compare a quarter we SUM the budgets that fall
--    inside it. A budget that only PARTLY overlaps a window is EXCLUDED AND NAMED
--    — never sliced. Pro-rating a lump is how a person is on-budget every single
--    month, right up until the day the term bill lands and they are 1,200,000 short.
CREATE TABLE IF NOT EXISTS budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  label_enc     TEXT,
  amount_enc    TEXT NOT NULL,
  starts_on     DATE NOT NULL,
  ends_on       DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on),
  UNIQUE (book_id, category_id, starts_on, ends_on)
);
CREATE INDEX IF NOT EXISTS budgets_window_idx ON budgets (book_id, starts_on, ends_on);

-- ── ENTRIES — the atom. Every one carries a DATE. ──────────────────────────
CREATE TABLE IF NOT EXISTS entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id          UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  -- who recorded it. In a shared Book, NOBODY MAY EDIT ANOTHER PERSON'S ENTRY
  -- without their approval — see edit_requests.
  author_id        UUID REFERENCES taxpayers(id) ON DELETE SET NULL,

  occurred_on      DATE,                    -- 🔴 NULL is allowed, and it means the
                                            --    entry belongs to NO period and is
                                            --    counted in NOTHING. We never assume
                                            --    "today" — that would silently drop a
                                            --    June expense into July.
  direction        TEXT NOT NULL CHECK (direction IN ('in', 'out', 'transfer')),
  label_enc        TEXT,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,

  currency         TEXT NOT NULL DEFAULT 'UGX' CHECK (currency IN ('UGX', 'USD')),
  expected_enc     TEXT,                    -- what the template predicted
  actual_enc       TEXT,                    -- 🔴 what really moved. NULL until confirmed.

  -- 🔴 THE FOUR STATES. Only 'confirmed' and 'unplanned' are money.
  --    'expected'       — staged from a template. Counts in NOTHING.
  --    'did_not_arrive' — 🔑 it was expected and it did NOT come. KEPT, not deleted.
  status           TEXT NOT NULL DEFAULT 'expected'
                   CHECK (status IN ('expected', 'confirmed', 'did_not_arrive', 'unplanned')),
  note_enc         TEXT,

  -- Which account did the money touch? REQUIRED to confirm. No defaults.
  account_id       UUID REFERENCES accounts(id) ON DELETE SET NULL,
  -- ...and for a transfer, both ends. A transfer counts in NO total.
  from_account_id  UUID REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id    UUID REFERENCES accounts(id) ON DELETE SET NULL,

  template_line_id UUID REFERENCES template_lines(id) ON DELETE SET NULL,
  period_start     DATE,                    -- which staging run produced it

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT entries_transfer_has_both CHECK (
    direction <> 'transfer' OR (from_account_id IS NOT NULL AND to_account_id IS NOT NULL)
  ),
  CONSTRAINT entries_transfer_not_circular CHECK (
    direction <> 'transfer' OR from_account_id <> to_account_id
  )
);
CREATE INDEX IF NOT EXISTS entries_book_date_idx ON entries (book_id, occurred_on);
CREATE INDEX IF NOT EXISTS entries_account_idx   ON entries (account_id);

-- 🔴 STAGING THE SAME PERIOD TWICE WOULD SILENTLY DOUBLE EVERY LINE — your rent,
--    your salary, your school fees — and every total would still add up perfectly.
--    A duplicate is not an error the user can see. So the DATABASE forbids it,
--    not just the code: code can be called twice; a unique index cannot.
CREATE UNIQUE INDEX IF NOT EXISTS entries_no_double_staging
  ON entries (book_id, template_line_id, period_start)
  WHERE template_line_id IS NOT NULL AND period_start IS NOT NULL;

-- ── EDIT REQUESTS — "no member may edit another's entry without approval" ───
CREATE TABLE IF NOT EXISTS edit_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  requested_by  UUID REFERENCES taxpayers(id) ON DELETE SET NULL,
  proposed_enc  TEXT NOT NULL,              -- the proposed change, encrypted
  reason_enc    TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  decided_by    UUID REFERENCES taxpayers(id) ON DELETE SET NULL,
  decided_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS edit_requests_entry_idx ON edit_requests (entry_id, status);

-- ── TARGETS ────────────────────────────────────────────────────────────────
-- 🔴 Progress counts CONFIRMED money only. A goal that counts your hopes is a mood.
CREATE TABLE IF NOT EXISTS targets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('goal', 'limit')),
  label_enc     TEXT,
  amount_enc    TEXT NOT NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RECONCILIATIONS — "where did my money actually go?" ─────────────────────
-- 🔑 The gap between what we computed and what the account really said. We do NOT
--    absorb it. It is the airtime, the boda, the soda, the cousin — the honest
--    answer to the question everybody asks, and no other Ugandan app will show it.
CREATE TABLE IF NOT EXISTS reconciliations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  as_of         DATE NOT NULL,
  computed_enc  TEXT NOT NULL,
  actual_enc    TEXT NOT NULL,
  gap_enc       TEXT NOT NULL,
  recorded_by   UUID REFERENCES taxpayers(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reconciliations_account_idx ON reconciliations (account_id, as_of);
