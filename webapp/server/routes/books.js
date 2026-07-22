/**
 * SELAH — BOOKS, ACCOUNTS, BUDGETS, ENTRIES
 * ─────────────────────────────────────────────────────────────────────────────
 * Every number returned by this file is computed by the ENGINE — engine/books.js,
 * engine/accounts.js, engine/rollup.js, engine/forecast.js. The same modules the
 * browser runs, and the same ones 561 tests execute.
 *
 * The server holds no rules of its own. It decrypts, calls the engine, encrypts.
 * A second copy of the law is a second law, and one of them will be wrong.
 *
 * 🔴 AND EVERY AMOUNT IS ENCRYPTED, so we CANNOT SUM IN SQL. Every total is
 *    computed in Node from decrypted values. That is a deliberate cost: a database
 *    that can add up a Ugandan's salary is a database that can read it.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const db = require('../lib/db');
const { encrypt, decrypt } = require('../lib/crypto');
const session = require('../lib/session');

const B = require('../../engine/books');
const A = require('../../engine/accounts');
const R = require('../../engine/rollup');
const SAV = require('../../engine/savings');
const GOALS = require('../../engine/goals');
const F = require('../../engine/forecast');

const router = express.Router();
router.use(session.require);

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(decrypt(v)));
const str = (v) => (v ? decrypt(v) : null);
const today = () => new Date().toISOString().slice(0, 10);
const iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);

/**
 * 🔴 THE PERMISSION CHECK. It lives HERE, in the query, not in the UI.
 *
 * A boundary enforced in the interface is a boundary that leaks the first time
 * somebody calls the API directly. You may touch a Book if you OWN it, or if you
 * are an ACTIVE member of it. A 'former' member may not.
 */
async function mayUse(bookId, taxpayerId) {
  const { rows } = await db.query(
    `SELECT b.* FROM books b
      LEFT JOIN book_members m ON m.book_id = b.id AND m.taxpayer_id = $2 AND m.status = 'active'
     WHERE b.id = $1 AND (b.owner_id = $2 OR m.id IS NOT NULL)`,
    [bookId, taxpayerId]
  );
  return rows[0] || null;
}

/** Accounts this person may name on an entry in this Book: their own + the Book's. */
async function usableAccounts(bookId, taxpayerId) {
  const { rows } = await db.query(
    `SELECT * FROM accounts WHERE owner_id = $1 OR book_id = $2 ORDER BY created_at`,
    [taxpayerId, bookId]
  );
  return rows.map(shapeAccount);
}

const shapeAccount = (a) => ({
  id: a.id, name: str(a.name_enc), type: a.type, currency: a.currency,
  liquid: a.liquid,
  shared: Boolean(a.book_id),
  // 🔴 A PERSONAL account belongs to a person. A BOOK account belongs to the Book,
  //    and every member sees it — balance and all. That is the whole boundary.
  scope: a.book_id ? 'book' : 'personal',
});

const shapeEntry = (e) => ({
  id: e.id, bookId: e.book_id, authorId: e.author_id,
  occurredOn: e.occurred_on ? e.occurred_on.toISOString().slice(0, 10) : null,
  periodStart: e.period_start ? e.period_start.toISOString().slice(0, 10) : null,
  direction: e.direction,
  label: str(e.label_enc),
  category: e.category_key || null,
  currency: e.currency,
  expected: num(e.expected_enc),
  actual: num(e.actual_enc),
  status: e.status,
  note: str(e.note_enc),
  accountId: e.account_id,
  fromAccountId: e.from_account_id,
  toAccountId: e.to_account_id,
  templateLineId: e.template_line_id,
  createdAt: e.created_at ? e.created_at.toISOString() : null,
});

async function entriesOf(bookId) {
  const { rows } = await db.query(
    `SELECT e.*, c.key AS category_key FROM entries e
       LEFT JOIN categories c ON c.id = e.category_id
      WHERE e.book_id = $1 ORDER BY e.occurred_on NULLS LAST, e.created_at`,
    [bookId]
  );
  return rows.map(shapeEntry);
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOKS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'books', req },
      () => db.query(
        `SELECT b.*, (b.owner_id = $1) AS is_owner FROM books b
           LEFT JOIN book_members m ON m.book_id = b.id AND m.taxpayer_id = $1 AND m.status = 'active'
          WHERE b.owner_id = $1 OR m.id IS NOT NULL
          ORDER BY b.is_default DESC, b.created_at`, [req.taxpayerId])
    );
    res.json({
      ok: true,
      books: rows.map((b) => ({
        id: b.id, name: str(b.name_enc), isDefault: b.is_default,
        kind: b.kind, currency: b.currency, isOwner: b.is_owner,
      })),
    });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (name.length < 1) return res.status(400).json({ ok: false, error: 'NAME_REQUIRED' });

    const { rows: existing } = await db.query('SELECT count(*)::int AS n FROM books WHERE owner_id = $1', [req.taxpayerId]);
    const first = existing[0].n === 0;

    const { rows } = await db.query(
      `INSERT INTO books (owner_id, name_enc, is_default, kind, currency)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [req.taxpayerId, encrypt(name), first, req.body?.kind === 'shared' ? 'shared' : 'personal',
       req.body?.currency === 'USD' ? 'USD' : 'UGX']
    );
    const bookId = rows[0].id;

    // 🔑 Seed the starter categories. A blank category list on day one is the single
    //    most common reason a budgeting app is abandoned before anything is entered.
    for (const c of R.DEFAULT_CATEGORIES) {
      await db.query(
        `INSERT INTO categories (book_id, key, label_enc, direction, lumpy)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (book_id, key) DO NOTHING`,
        [bookId, c.key, encrypt(c.label), c.direction, Boolean(c.lumpy)]
      );
    }
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'books', entityId: bookId, req });
    res.json({ ok: true, id: bookId, isDefault: first });
  } catch (e) { next(e); }
});

router.get('/:id/categories', async (req, res, next) => {
  try {
    if (!await mayUse(req.params.id, req.taxpayerId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const { rows } = await db.query('SELECT * FROM categories WHERE book_id = $1 ORDER BY direction, key', [req.params.id]);
    res.json({ ok: true, categories: rows.map((c) => ({ id: c.id, key: c.key, label: str(c.label_enc), direction: c.direction, lumpy: c.lumpy })) });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/accounts/mine', async (req, res, next) => {
  try {
    const { rows } = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'accounts', req },
      () => db.query('SELECT * FROM accounts WHERE owner_id = $1 ORDER BY created_at', [req.taxpayerId])
    );
    res.json({ ok: true, accounts: rows.map(shapeAccount), types: A.ACCOUNT_TYPES });
  } catch (e) { next(e); }
});

router.post('/accounts', async (req, res, next) => {
  try {
    const { name, type, currency, bookId, liquid } = req.body || {};
    if (!name || !A.ACCOUNT_TYPES[type]) return res.status(400).json({ ok: false, error: 'BAD_ACCOUNT' });

    // A BOOK account is visible to every member. A PERSONAL one is visible to nobody
    // but its owner. The database enforces exactly-one-of; we choose which.
    if (bookId && !await mayUse(bookId, req.taxpayerId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    const { rows } = await db.query(
      `INSERT INTO accounts (owner_id, book_id, name_enc, type, currency, liquid)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [bookId ? null : req.taxpayerId, bookId || null, encrypt(String(name).trim()), type,
       currency === 'USD' ? 'USD' : 'UGX', liquid === undefined ? null : Boolean(liquid)]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'accounts', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

/** What the account ACTUALLY said. This is what re-grounds the books in reality. */
router.post('/accounts/:id/opening', async (req, res, next) => {
  try {
    const { amount, asOf } = req.body || {};
    if (amount === undefined || amount === null || !/^\d{4}-\d{2}-\d{2}$/.test(String(asOf || ''))) {
      return res.status(400).json({ ok: false, error: 'BAD_INPUT' });
    }
    const { rows: acc } = await db.query('SELECT * FROM accounts WHERE id = $1 AND owner_id = $2', [req.params.id, req.taxpayerId]);
    if (!acc.length) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    await db.query(
      `INSERT INTO opening_balances (account_id, as_of, amount_enc, recorded_by)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (account_id, as_of) DO UPDATE SET amount_enc = EXCLUDED.amount_enc`,
      [req.params.id, asOf, encrypt(Number(amount)), req.taxpayerId]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'opening_balances', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/** Compute every balance — from what was recorded. We did not look in your wallet. */
async function balancesFor(taxpayerId) {
  const { rows: accs } = await db.query(
    `SELECT a.* FROM accounts a
       LEFT JOIN books b ON b.id = a.book_id
       LEFT JOIN book_members m ON m.book_id = b.id AND m.taxpayer_id = $1 AND m.status = 'active'
      WHERE a.owner_id = $1 OR b.owner_id = $1 OR m.id IS NOT NULL`, [taxpayerId]);

  const { rows: ents } = await db.query(
    `SELECT e.* FROM entries e
       JOIN books b ON b.id = e.book_id
       LEFT JOIN book_members m ON m.book_id = b.id AND m.taxpayer_id = $1 AND m.status = 'active'
      WHERE b.owner_id = $1 OR m.id IS NOT NULL`, [taxpayerId]);

  const entries = ents.map(shapeEntry);

  const out = [];
  for (const a of accs) {
    const { rows: ob } = await db.query(
      'SELECT * FROM opening_balances WHERE account_id = $1 ORDER BY as_of DESC LIMIT 1', [a.id]);
    const opening = ob[0] ? { amount: num(ob[0].amount_enc), asOf: ob[0].as_of.toISOString().slice(0, 10) } : { amount: 0, asOf: null };
    const acc = { ...shapeAccount(a) };
    const b = A.computedBalance(acc, opening, entries);
    out.push({ ...b, currency: a.currency, scope: acc.scope, name: acc.name });
  }
  return out;
}

router.get('/health', async (req, res, next) => {
  try {
    const balances = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'accounts', req },
      () => balancesFor(req.taxpayerId)
    );

    const from = req.query.from || `${today().slice(0, 7)}-01`;
    const to = req.query.to || today();

    const { rows: ents } = await db.query(
      `SELECT e.*, c.key AS category_key FROM entries e
         JOIN books b ON b.id = e.book_id
         LEFT JOIN categories c ON c.id = e.category_id
        WHERE b.owner_id = $1`, [req.taxpayerId]);
    const entries = ents.map(shapeEntry);

    const act = R.actuals(entries, from, to);
    const rate = req.query.rate ? { rate: Number(req.query.rate), on: req.query.rateOn || today(), source: req.query.rateSource } : null;

    res.json({
      ok: true,
      balances,
      netWorth: A.netWorth(balances, rate),
      emergencyFund: A.emergencyFund(balances, act ? act.spend : 0),
      savingsRate: act ? A.savingsRate(act.income, act.spend) : null,
      period: act,
    });
  } catch (e) { next(e); }
});

/**
 * 🌱 SAVINGS — how long you would last, and where you are on the resilience ladder.
 *    Reuses the same balances and spending as health; the savings engine reads them.
 */
router.get('/savings', async (req, res, next) => {
  try {
    const balances = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'accounts', req },
      () => balancesFor(req.taxpayerId)
    );

    const from = req.query.from || `${today().slice(0, 7)}-01`;
    const to = req.query.to || today();

    const { rows: ents } = await db.query(
      `SELECT e.*, c.key AS category_key FROM entries e
         JOIN books b ON b.id = e.book_id
         LEFT JOIN categories c ON c.id = e.category_id
        WHERE b.owner_id = $1`, [req.taxpayerId]);
    const entries = ents.map(shapeEntry);
    const act = R.actuals(entries, from, to);

    // 🔑 GOALS — each watches a savings account. Progress is that account's balance;
    //    pace is what has actually gone INTO it lately, for an honest projection.
    const { rows: gs } = await db.query(
      "SELECT * FROM savings_goals WHERE owner_id = $1 AND status = 'active' ORDER BY created_at", [req.taxpayerId]);
    const balById = {};
    for (const b of balances) balById[b.accountId] = b;
    const goals = gs.map((g) => {
      const acct = g.account_id ? balById[g.account_id] : null;
      const saved = acct ? acct.computed : 0;
      const pace = g.account_id ? monthlyInflow(entries, g.account_id, today()) : 0;
      return {
        id: g.id, accountId: g.account_id, accountName: acct ? acct.name : null,
        ...GOALS.assess({ name: str(g.name_enc), target: num(g.target_enc),
          saved, targetDate: g.target_date ? iso(g.target_date) : null, monthlyContribution: pace }, { asOf: today() }),
      };
    });

    res.json({ ok: true, ...SAV.overview(balances, act ? act.spend : 0), goals });
  } catch (e) { next(e); }
});

/** Average money moved INTO an account per month over the trailing window (default 3 months). */
function monthlyInflow(entries, accountId, asOf, months = 3) {
  const cutoff = new Date(Date.parse(asOf + 'T00:00:00Z') - months * 30.436875 * 86400000).toISOString().slice(0, 10);
  let into = 0;
  for (const e of entries) {
    if (!e.occurredOn || e.occurredOn < cutoff) continue;
    if (!['confirmed', 'unplanned'].includes(e.status)) continue;
    const amt = e.actual != null ? e.actual : e.expected;
    if (e.direction === 'in' && e.accountId === accountId) into += Number(amt || 0);
    else if (e.direction === 'transfer' && e.toAccountId === accountId) into += Number(amt || 0);
  }
  return Math.round(into / months);
}

// ── GOAL CRUD ────────────────────────────────────────────────────────────────

router.post('/savings/goals', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const target = Number(req.body?.target || 0);
    if (!name) return res.status(400).json({ ok: false, error: 'NAME_REQUIRED', headline: 'Give the goal a name.' });
    if (!(target > 0)) return res.status(400).json({ ok: false, error: 'TARGET_REQUIRED', headline: 'How much are you saving toward?' });
    const { rows } = await db.query(
      'INSERT INTO savings_goals (owner_id, account_id, name_enc, target_enc, target_date) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [req.taxpayerId, req.body?.accountId || null, encrypt(name), encrypt(target), req.body?.targetDate || null]);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'savings_goals', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

router.delete('/savings/goals/:id', async (req, res, next) => {
  try {
    const { rowCount } = await db.query('DELETE FROM savings_goals WHERE id = $1 AND owner_id = $2', [req.params.id, req.taxpayerId]);
    if (!rowCount) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'savings_goals', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/** 🔑 "Where did my money actually go?" */
router.post('/accounts/:id/reconcile', async (req, res, next) => {
  try {
    const { actual, asOf } = req.body || {};
    const { rows: acc } = await db.query('SELECT * FROM accounts WHERE id = $1 AND owner_id = $2', [req.params.id, req.taxpayerId]);
    if (!acc.length) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    const balances = await balancesFor(req.taxpayerId);
    const computed = balances.find((b) => b.accountId === req.params.id);
    const r = A.reconcile(computed, actual, asOf || today());
    if (r.refused) return res.status(400).json(r);

    await db.query(
      `INSERT INTO reconciliations (account_id, as_of, computed_enc, actual_enc, gap_enc, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.params.id, r.asOf, encrypt(r.weComputed), encrypt(r.youSay), encrypt(r.difference), req.taxpayerId]
    );
    // 🔴 RE-GROUND IN REALITY. The next month starts from what the account really
    //    said — so the error can never compound.
    await db.query(
      `INSERT INTO opening_balances (account_id, as_of, amount_enc, recorded_by)
       VALUES ($1,$2,$3,$4) ON CONFLICT (account_id, as_of) DO UPDATE SET amount_enc = EXCLUDED.amount_enc`,
      [req.params.id, r.asOf, encrypt(r.youSay), req.taxpayerId]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'reconciliations', entityId: req.params.id, req });
    res.json({ ok: true, reconciliation: r });
  } catch (e) { next(e); }
});

/**
 * CATEGORIES — the join between the plan and the reality, and therefore editable.
 *
 * 🔴 DELETING A CATEGORY DOES NOT DELETE THE MONEY.
 *
 * `entries.category_id` is ON DELETE SET NULL. So the transactions survive — they
 * simply become uncategorised, and they still count in every total. That is the
 * only acceptable behaviour: a person tidying up their category list must never
 * discover afterwards that 400,000 of real spending went with it.
 */
router.post('/:id/categories', async (req, res, next) => {
  try {
    if (!await mayUse(req.params.id, req.taxpayerId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const label = String(req.body?.label || '').trim();
    if (!label) return res.status(400).json({ ok: false, error: 'LABEL_REQUIRED', headline: 'A category needs a name.' });

    const key = (req.body?.key || label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
    if (!key) return res.status(400).json({ ok: false, error: 'BAD_KEY', headline: 'That name has no letters or numbers in it.' });

    const { rows } = await db.query(
      `INSERT INTO categories (book_id, key, label_enc, direction, lumpy)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (book_id, key) DO UPDATE SET label_enc = EXCLUDED.label_enc
       RETURNING id`,
      [req.params.id, key, encrypt(label), req.body?.direction === 'in' ? 'in' : 'out', Boolean(req.body?.lumpy)]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'categories', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id, key });
  } catch (e) { next(e); }
});

router.patch('/:id/categories/:cid', async (req, res, next) => {
  try {
    if (!await mayUse(req.params.id, req.taxpayerId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const label = String(req.body?.label || '').trim();
    if (!label) return res.status(400).json({ ok: false, error: 'LABEL_REQUIRED' });

    const { rowCount } = await db.query(
      `UPDATE categories SET label_enc = $1, lumpy = COALESCE($2, lumpy)
        WHERE id = $3 AND book_id = $4`,
      [encrypt(label), req.body?.lumpy === undefined ? null : Boolean(req.body.lumpy), req.params.cid, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'categories', entityId: req.params.cid, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/:id/categories/:cid', async (req, res, next) => {
  try {
    if (!await mayUse(req.params.id, req.taxpayerId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    // How much real money is about to become uncategorised? Say so — do not just do it.
    const { rows: used } = await db.query(
      'SELECT count(*)::int AS n FROM entries WHERE category_id = $1', [req.params.cid]);

    const { rowCount } = await db.query('DELETE FROM categories WHERE id = $1 AND book_id = $2', [req.params.cid, req.params.id]);
    if (!rowCount) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'categories', entityId: req.params.cid, req });
    res.json({
      ok: true,
      entriesUncategorised: used[0].n,
      // 🔴 THE MONEY SURVIVED. Say it, because the person is about to worry.
      note: used[0].n
        ? `${used[0].n} transaction${used[0].n === 1 ? '' : 's'} used this category. They are still there, and they still count — they are simply uncategorised now. No money was deleted.`
        : null,
    });
  } catch (e) { next(e); }
});

module.exports = router;
module.exports.mayUse = mayUse;
module.exports.entriesOf = entriesOf;
module.exports.usableAccounts = usableAccounts;
module.exports.balancesFor = balancesFor;
