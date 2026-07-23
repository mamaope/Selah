/**
 * SELAH — ENTRIES, TEMPLATES, BUDGETS, FORECAST
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE LAW, ENFORCED HERE AND IN THE DATABASE:
 *
 *   A DRAFT IS NOT MONEY.        Nothing is auto-confirmed. There is no endpoint
 *                                that turns an expectation into a fact.
 *   "IT DID NOT COME" IS KEPT.   Never deleted. It is the evidence.
 *   AN ENTRY NAMES ITS ACCOUNT.  Required to confirm. No defaults.
 *   A TRANSFER IS NOT INCOME.    It touches two accounts and zero totals.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const db = require('../lib/db');
const { encrypt, decrypt } = require('../lib/crypto');
const session = require('../lib/session');

const B = require('../../engine/books');
const R = require('../../engine/rollup');
const F = require('../../engine/forecast');
const VAL = require('../../engine/values');
const PRICE = require('../../engine/pricing');
const SHOP = require('../../engine/shopping');
const booksRoute = require('./books');

const router = express.Router();
router.use(session.require);

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(decrypt(v)));
const str = (v) => (v ? decrypt(v) : null);
const today = () => new Date().toISOString().slice(0, 10);
const iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);


/** The item's current unit price from its history (the latest value point), or null. */
async function currentPrice(bookId, itemKey) {
  if (!itemKey) return null;
  const { rows } = await db.query(
    'SELECT amount_enc, unit_enc FROM value_points WHERE book_id = $1 AND item_key = $2 ORDER BY as_of DESC LIMIT 1',
    [bookId, itemKey]);
  if (!rows.length) return null;
  return { unitPrice: num(rows[0].amount_enc), unit: str(rows[0].unit_enc) };
}

/** Append a price point for an item, as of a date — the price book updating itself. */
async function recordPricePoint(bookId, itemKey, label, unitPrice, unit, asOf, who, direction) {
  const key = String(itemKey).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  const dir = direction === 'in' ? 'in' : 'out';
  await db.query(
    `INSERT INTO value_points (book_id, item_key, label_enc, unit_enc, amount_enc, as_of, recorded_by, direction)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (book_id, item_key, as_of) DO UPDATE SET
       amount_enc = EXCLUDED.amount_enc,
       -- 🔑 a later entry that carries a unit FILLS IN a default that had none.
       unit_enc = COALESCE(EXCLUDED.unit_enc, value_points.unit_enc)`,
    [bookId, key, label ? encrypt(label) : null, unit ? encrypt(unit) : null, encrypt(Number(unitPrice)), asOf, who, dir]);
}


/**
 * Create an entry from a body, running unit pricing and maintaining the price book.
 * Shared by the Record sheet (POST /entries) and shopping mark-done — one path, so
 * a purchase logged from a shopping list is priced and tracked identically.
 * @returns { id } or { refused } (a pricing refusal to bubble up)
 */
async function createEntryFrom(bookId, authorId, body) {
  const { direction, label, category, accountId, fromAccountId, toAccountId, occurredOn, note, currency, goalId } = body || {};
  // 🔑 the money is `amount` (the Record sheet's name) OR `total` (a bought line's) —
  //    accept both, so no caller can silently drop the sum by naming it the other thing.
  const amount = (body && body.amount != null && body.amount !== '') ? body.amount : (body ? body.total : undefined);
  const when = occurredOn || today();
  let quantity = null, unit = null, unitPrice = null, finalTotal = Number(amount || 0);
  let categoryId = null;
  if (category) {
    const { rows } = await db.query('SELECT id FROM categories WHERE book_id = $1 AND key = $2', [bookId, category]);
    categoryId = rows[0] ? rows[0].id : null;
  }

  const itemLabel = String(label || '').trim();
  if (direction !== 'transfer' && itemLabel) {
    const itemKey = itemLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
    const known = await currentPrice(bookId, itemKey);
    const r = PRICE.resolveLine(
      { quantity: body.quantity, unit: body.unit, unitPrice: body.unitPrice,
        total: (amount === undefined || amount === null || amount === '') ? undefined : amount },
      known);
    if (r.refused) return { refused: r };
    quantity = r.quantity; unit = r.unit; unitPrice = r.unitPrice; finalTotal = r.total;
    if (r.recordPrice != null && itemKey) {
      await recordPricePoint(bookId, itemKey, itemLabel, r.recordPrice, r.unit, when, authorId, direction);
    }
  }

  const { rows } = await db.query(
    `INSERT INTO entries (book_id, author_id, occurred_on, direction, label_enc, category_id, currency,
                          expected_enc, actual_enc, status, note_enc, account_id, from_account_id, to_account_id,
                          quantity, unit, unit_price_enc, goal_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,'unplanned',$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
    [bookId, authorId, when, direction,
     encrypt(String(label || '')), categoryId, currency === 'USD' ? 'USD' : 'UGX',
     encrypt(Number(finalTotal || 0)), note ? encrypt(note) : null,
     direction === 'transfer' ? null : accountId,
     direction === 'transfer' ? fromAccountId : null,
     direction === 'transfer' ? toAccountId : null,
     quantity, unit, unitPrice != null ? encrypt(Number(unitPrice)) : null,
     direction === 'transfer' ? (goalId || null) : null]);
  return { id: rows[0].id, total: finalTotal, unit, quantity };
}

const guard = async (req, res) => {
  const book = await booksRoute.mayUse(req.params.bookId, req.taxpayerId);
  if (!book) { res.status(404).json({ ok: false, error: 'NOT_FOUND' }); return null; }
  return book;
};

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES — the plan
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:bookId/templates', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { cadence, anchor, name, lines } = req.body || {};

    if (!B.CADENCES.includes(cadence)) {
      return res.status(400).json({ ok: false, error: 'BAD_CADENCE',
        headline: 'When does this repeat?',
        why: [`It must be one of: ${B.CADENCES.join(', ')}. We will not guess how often your money moves.`] });
    }
    // 🔴 The DATABASE also refuses a quarterly/annual template with no anchor. We do
    //    not assume January and we do not assume July — assume wrong and every date
    //    is up to three months out, and it looks perfectly reasonable.
    if ((cadence === 'quarterly' || cadence === 'annual') && !/^\d{4}-\d{2}-\d{2}$/.test(String(anchor || ''))) {
      return res.status(400).json({ ok: false, error: 'ANCHOR_REQUIRED',
        headline: `When does your ${cadence === 'quarterly' ? 'quarter' : 'year'} start?`,
        why: ['A quarterly or annual cycle has no natural starting point. January, July and the month you opened the shop are all defensible — and they give completely different dates.'] });
    }
    if (!Array.isArray(lines) || !lines.length) {
      return res.status(400).json({ ok: false, error: 'NO_LINES',
        headline: 'What does a normal month look like?',
        why: ['A template with no lines stages an empty month, and an empty month is not a budget.'] });
    }

    const { rows } = await db.query(
      `INSERT INTO templates (book_id, name_enc, cadence, anchor) VALUES ($1,$2,$3,$4) RETURNING id`,
      [req.params.bookId, name ? encrypt(name) : null, cadence, anchor || null]
    );
    const tid = rows[0].id;
    let pos = 0;
    for (const l of lines) {
      await db.query(
        `INSERT INTO template_lines (template_id, direction, label_enc, amount_enc, category_id, position)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [tid, l.direction === 'in' ? 'in' : 'out', encrypt(String(l.label || '')), encrypt(Number(l.amount || 0)),
         l.categoryId || null, pos++]
      );
    }
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'templates', entityId: tid, req });
    res.json({ ok: true, id: tid });
  } catch (e) { next(e); }
});

/**
 * STAGE the current period. Produces DRAFTS. Not money.
 *
 * 🔴 IDEMPOTENT — and the DATABASE enforces it, not just this code. Code can be
 *    called twice (a double tap, a retried request, two devices). A unique index
 *    cannot. Staging twice would silently DOUBLE your rent, your salary and your
 *    school fees, and every total would still add up perfectly. A duplicate is not
 *    an error the user can see.
 */
router.post('/:bookId/stage', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;

    const { rows: tpls } = await db.query('SELECT * FROM templates WHERE book_id = $1', [req.params.bookId]);
    const staged = [];

    for (const t of tpls) {
      const { rows: lines } = await db.query('SELECT * FROM template_lines WHERE template_id = $1 ORDER BY position', [t.id]);
      const template = {
        cadence: t.cadence,
        anchor: t.anchor ? iso(t.anchor) : null,
        lines: lines.map((l) => ({ id: l.id, direction: l.direction, label: str(l.label_enc), amount: num(l.amount_enc), category: l.category_id })),
      };

      const { rows: already } = await db.query(
        `SELECT DISTINCT period_start FROM entries WHERE book_id = $1 AND template_line_id IN
           (SELECT id FROM template_lines WHERE template_id = $2) AND period_start IS NOT NULL`,
        [req.params.bookId, t.id]);

      const r = B.stage(template, req.body?.asOf || today(), already.map((a) => iso(a.period_start)));
      if (r.refused) { staged.push({ templateId: t.id, refused: r }); continue; }
      if (r.alreadyStaged) { staged.push({ templateId: t.id, period: r.period, alreadyStaged: true, note: r.note }); continue; }

      for (const e of r.entries) {
        const line = lines.find((l) => l.id === e.templateLineId);
        await db.query(
          `INSERT INTO entries (book_id, author_id, direction, label_enc, category_id, currency,
                                expected_enc, actual_enc, status, template_line_id, period_start, account_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,'expected',$8,$9,NULL)
           ON CONFLICT DO NOTHING`,
          [req.params.bookId, req.taxpayerId, e.direction, encrypt(e.label), line ? line.category_id : null,
           'UGX', encrypt(e.expected), e.templateLineId, r.period.startsOn]
        );
      }
      await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'entries', entityId: t.id, req });
      staged.push({ templateId: t.id, period: r.period, staged: r.entries.length, note: r.note });
    }
    res.json({ ok: true, staged });
  } catch (e) { next(e); }
});

/** Record something that happened — money in, out, or a transfer. Unit pricing runs. */
router.post('/:bookId/entries', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { direction, accountId, fromAccountId, toAccountId } = req.body || {};
    if (!['in', 'out', 'transfer'].includes(direction)) return res.status(400).json({ ok: false, error: 'BAD_DIRECTION' });

    // 🔴 A TRANSFER TOUCHES TWO ACCOUNTS AND ZERO TOTALS.
    if (direction === 'transfer') {
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
        return res.status(400).json({ ok: false, error: 'BAD_TRANSFER',
          headline: 'A transfer needs two different accounts.',
          why: ['Moving money from an account to itself is not a transfer, and moving it out of nowhere is not either.'] });
      }
    } else if (!accountId) {
      // 🔴 REQUIRED. NO DEFAULTS. A pre-filled account is a guess that puts your rent in the wrong pocket.
      return res.status(400).json({ ok: false, error: 'ACCOUNT_REQUIRED',
        headline: 'Which account did this money touch?',
        why: ['Your balances are worked out from these entries. An entry with no account changes no balance — and the account it really moved through would be quietly wrong from now on.'],
        whatYouCanDoNow: ['Say where the money came from, or went to: cash, MoMo, the bank, the SACCO.'] });
    }

    const created = await createEntryFrom(req.params.bookId, req.taxpayerId, req.body);
    if (created.refused) return res.status(400).json(created.refused);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'entries', entityId: created.id, req });
    res.json({ ok: true, id: created.id });
  } catch (e) { next(e); }
});

/** CONFIRM. The only way a draft becomes money — and it needs a human and an account. */
router.post('/:bookId/entries/:id/confirm', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { rows } = await db.query('SELECT * FROM entries WHERE id = $1 AND book_id = $2', [req.params.id, req.params.bookId]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    const e = rows[0];
    const entry = { status: e.status, expected: num(e.expected_enc), accountId: e.account_id, direction: e.direction };
    const r = B.confirmEntry(entry, req.body?.actual, req.body?.occurredOn || today(), req.body?.accountId);
    if (r.refused) return res.status(400).json(r);

    await db.query(
      `UPDATE entries SET status='confirmed', actual_enc=$1, account_id=$2, occurred_on=$3, updated_at=now()
       WHERE id = $4`,
      [encrypt(r.actual), r.accountId, r.occurredOn, req.params.id]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'entries', entityId: req.params.id, req });

    res.json({ ok: true,
      actual: r.actual,
      differsFromExpected: r.differsFromExpected,
      // 🔑 The template said one thing; life said another. Keep both — this
      //    difference is what later proves an employer was short-paying you.
      shortfall: r.shortfall });
  } catch (e) { next(e); }
});

/** 🔑 IT DID NOT COME. Recorded, and KEPT. */
router.post('/:bookId/entries/:id/did-not-arrive', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { rowCount } = await db.query(
      `UPDATE entries SET status='did_not_arrive', actual_enc=$1, note_enc=$2, updated_at=now()
       WHERE id = $3 AND book_id = $4`,
      [encrypt(0), req.body?.note ? encrypt(req.body.note) : null, req.params.id, req.params.bookId]
    );
    if (!rowCount) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'entries', entityId: req.params.id, req });
    res.json({ ok: true,
      kept: true,
      whyThisMatters: 'We keep this. A deleted line is a fact destroyed — and a record of income that was promised and never paid is exactly the evidence you will want later.' });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
// BUDGETS — instances, never divided
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:bookId/budgets', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { category, amount, startsOn, endsOn, label } = req.body || {};
    const { rows: cat } = await db.query('SELECT id FROM categories WHERE book_id = $1 AND key = $2', [req.params.bookId, category]);
    if (!cat.length) return res.status(400).json({ ok: false, error: 'UNKNOWN_CATEGORY' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startsOn || '')) || !/^\d{4}-\d{2}-\d{2}$/.test(String(endsOn || ''))) {
      return res.status(400).json({ ok: false, error: 'BAD_WINDOW',
        headline: 'A budget needs a start and an end.',
        why: ['A budget is an INSTANCE with a window — "school fees, Term 2". That is what lets us sum budgets over a quarter instead of dividing one by three.'] });
    }
    const { rows } = await db.query(
      `INSERT INTO budgets (book_id, category_id, label_enc, amount_enc, starts_on, ends_on)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (book_id, category_id, starts_on, ends_on)
       DO UPDATE SET amount_enc = EXCLUDED.amount_enc RETURNING id`,
      [req.params.bookId, cat[0].id, label ? encrypt(label) : null, encrypt(Number(amount || 0)), startsOn, endsOn]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'budgets', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
// THE VIEW — any window, any granularity. One set of facts underneath.
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:bookId/period', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const from = req.query.from || `${today().slice(0, 7)}-01`;
    const to = req.query.to || today();

    const entries = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'entries', req },
      () => booksRoute.entriesOf(req.params.bookId)
    );

    const { rows: bud } = await db.query(
      `SELECT b.*, c.key AS category_key, c.direction AS category_direction FROM budgets b JOIN categories c ON c.id = b.category_id
        WHERE b.book_id = $1`, [req.params.bookId]);
    const budgets = bud.map((b) => ({
      id: b.id,
      category: b.category_key, label: str(b.label_enc), amount: num(b.amount_enc),
      direction: b.category_direction,          // so income and expense budgets are never summed together
      startsOn: iso(b.starts_on), endsOn: iso(b.ends_on),
    }));

    // 🔑 PAST, PRESENT OR FUTURE? The screen must know — you cannot RECORD what
    //    happened in a month that has not happened, and a future month is for
    //    BUDGETING, not for pretending money has moved.
    const t = today();
    const monthState = to < t.slice(0, 7) + '-01' ? 'past'
                     : from > t ? 'future'
                     : 'current';

    // 🔴 THE ENTRIES SHOWN ARE THIS MONTH'S — not the whole Book. The ledger used to
    //    show every transaction ever, under a heading that named one month.
    const monthEntries = entries.filter((e) => B.belongsToWindow(e, from, to));

    res.json({
      ok: true,
      from, to,
      month: { from, to, state: monthState },
      // 🔴 The summary is WINDOWED to the month now — it once showed lifetime totals.
      summary: B.summarise(entries, { from, to }),
      entries: monthEntries,
      // 🔴 The BUDGETS THEMSELVES, not just the comparison.
      budgets,
      // budgetVsActual windows internally, so it is fed the FULL history — the
      // budget is compared against what actually happened in ITS window.
      budget: R.budgetVsActual(budgets, entries, from, to),
      accounts: await booksRoute.usableAccounts(req.params.bookId, req.taxpayerId),
      // 🔑 the Book's goals, so a transfer INTO a savings account can be earmarked
      goals: (await db.query("SELECT id, name_enc, account_id FROM savings_goals WHERE book_id = $1 AND status = 'active' ORDER BY created_at", [req.params.bookId]))
               .rows.map((g) => ({ id: g.id, name: str(g.name_enc), accountId: g.account_id })),
    });
  } catch (e) { next(e); }
});

router.get('/:bookId/series', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const entries = await booksRoute.entriesOf(req.params.bookId);
    const s = R.series(entries, req.query.from || '2020-01-01', req.query.to || today(), req.query.by || 'month');
    if (s.refused) return res.status(400).json(s);
    res.json({ ok: true, ...s });
  } catch (e) { next(e); }
});

/**
 * 🔑 "WHEN DO I NEXT REFILL GAS?"
 *
 * A forecast is the WEAKEST object in this system. It produces a SUGGESTION —
 * never a transaction, never a balance, and it cannot be confirmed. There is no
 * endpoint here that applies it, deliberately.
 */
router.get('/:bookId/forecast', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const entries = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'entries', req },
      () => booksRoute.entriesOf(req.params.bookId)
    );
    const from = req.query.from || '2020-01-01';
    const to = req.query.to || today();
    res.json({
      ok: true,
      comingUp: F.recurringItems(entries, today()),
      suggestedBudget: F.suggestBudget(entries, from, to, req.query.forPeriod || null),
    });
  } catch (e) { next(e); }
});


router.delete('/:bookId/budgets/:id', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { rowCount } = await db.query('DELETE FROM budgets WHERE id = $1 AND book_id = $2', [req.params.id, req.params.bookId]);
    if (!rowCount) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'budgets', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/**
 * Delete an entry.
 *
 * 🔴 NOTE WHAT THIS IS *NOT* FOR. If money was expected and did not come, DO NOT
 * delete the line — mark it `did_not_arrive`. A deleted line is a fact destroyed,
 * and a record of income promised and never paid is exactly the evidence you will
 * want later. This endpoint is for a MISTAKE: a wrong amount, a double entry.
 */
router.delete('/:bookId/entries/:id', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { rowCount } = await db.query('DELETE FROM entries WHERE id = $1 AND book_id = $2', [req.params.id, req.params.bookId]);
    if (!rowCount) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'entries', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
// VALUE TRACKING — how a price or a value moves over time.
//
// 🔑 Recording a new value ADDS a dated point; it never overwrites the last one.
//    The engine turns the history into change, growth and an honest projection.
// ═══════════════════════════════════════════════════════════════════════════

/** Record the value of an item AS OF a date. Same day = a correction, not a new point. */
router.post('/:bookId/values', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { itemKey, label, amount, asOf, unit, note, direction } = req.body || {};
    if (!itemKey || amount == null || !/^\d{4}-\d{2}-\d{2}$/.test(String(asOf || ''))) {
      return res.status(400).json({ ok: false, error: 'BAD_INPUT',
        headline: 'A value needs an item, an amount, and the date it applied.' });
    }
    const key = String(itemKey).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
    const { rows } = await db.query(
      `INSERT INTO value_points (book_id, item_key, label_enc, unit_enc, amount_enc, as_of, note_enc, recorded_by, direction)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (book_id, item_key, as_of)
       DO UPDATE SET amount_enc = EXCLUDED.amount_enc, note_enc = EXCLUDED.note_enc,
                     unit_enc = COALESCE(EXCLUDED.unit_enc, value_points.unit_enc)
       RETURNING id`,
      [req.params.bookId, key, label ? encrypt(label) : null, unit ? encrypt(unit) : null,
       encrypt(Number(amount)), asOf, note ? encrypt(note) : null, req.taxpayerId,
       direction === 'in' ? 'in' : 'out']
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'value_points', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id, itemKey: key });
  } catch (e) { next(e); }
});

/** Every tracked item, each with its full history and trend — computed by the engine. */
router.get('/:bookId/values', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { rows } = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'value_points', req },
      () => db.query('SELECT * FROM value_points WHERE book_id = $1 ORDER BY item_key, as_of', [req.params.bookId])
    );
    const byItem = {};
    for (const r of rows) {
      const it = byItem[r.item_key] || (byItem[r.item_key] = {
        key: r.item_key, label: str(r.label_enc), unit: str(r.unit_enc),
        direction: r.direction || 'out', points: [] });
      // the newest non-null unit / direction wins as the item's current facts
      if (str(r.unit_enc)) it.unit = str(r.unit_enc);
      it.direction = r.direction || it.direction;
      it.points.push({ id: r.id, amount: num(r.amount_enc), asOf: iso(r.as_of) });
    }
    const items = Object.values(byItem).map((it) => ({
      key: it.key,
      direction: it.direction,
      unit: it.unit,
      lastUpdated: it.points.length ? it.points[it.points.length - 1].asOf : null,
      ...VAL.track(it.points, { label: it.label || it.key, unit: it.unit }),
      pointIds: it.points,
    }));
    res.json({ ok: true, items });
  } catch (e) { next(e); }
});

router.delete('/:bookId/values/:id', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { rowCount } = await db.query('DELETE FROM value_points WHERE id = $1 AND book_id = $2', [req.params.id, req.params.bookId]);
    if (!rowCount) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'value_points', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/**
 * Draft this month from the DEFAULT VALUES. Each default (an item with a price and a
 * direction) becomes an EXPECTED entry for the current month — a draft, counted in
 * nothing until confirmed. Idempotent: a default already staged this month is skipped.
 */
router.post('/:bookId/stage-defaults', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const asOf = req.body?.asOf || today();
    const from = asOf.slice(0, 7) + '-01';
    const last = new Date(Date.UTC(Number(from.slice(0,4)), Number(from.slice(5,7)), 0)).getUTCDate();
    const to = asOf.slice(0, 7) + '-' + String(last).padStart(2, '0');

    // the defaults (latest value point per item)
    const { rows: vp } = await db.query('SELECT * FROM value_points WHERE book_id = $1 ORDER BY item_key, as_of', [req.params.bookId]);
    const defaults = {};
    for (const r of vp) defaults[r.item_key] = { key: r.item_key, label: str(r.label_enc) || r.item_key,
      amount: num(r.amount_enc), unit: str(r.unit_enc), direction: r.direction || 'out' };

    // what is already staged this month (dedupe by item key)
    const { rows: existing } = await db.query(
      "SELECT label_enc FROM entries WHERE book_id = $1 AND status = 'expected' AND period_start = $2", [req.params.bookId, from]);
    const staged = new Set(existing.map((e) => String(str(e.label_enc) || '').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40)));

    let n = 0;
    for (const d of Object.values(defaults)) {
      if (staged.has(d.key)) continue;
      await db.query(
        `INSERT INTO entries (book_id, author_id, direction, label_enc, currency, expected_enc, actual_enc,
                              status, period_start, unit, unit_price_enc)
         VALUES ($1,$2,$3,$4,'UGX',$5,NULL,'expected',$6,$7,$8)`,
        [req.params.bookId, req.taxpayerId, d.direction, encrypt(d.label), encrypt(d.amount), from,
         d.unit || null, encrypt(d.amount)]);
      n++;
    }
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'entries', req });
    res.json({ ok: true, staged: n, period: { from, to },
      note: n ? `${n} default${n===1?'':'s'} drafted for this month. They are counted in nothing until you confirm them.`
              : 'Everything from your defaults is already drafted for this month.' });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════════════════
// SHOPPING LISTS — a plan that becomes spending.
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:bookId/shopping', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { rows: lists } = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'shopping_lists', req },
      () => db.query("SELECT * FROM shopping_lists WHERE book_id = $1 AND status = 'open' ORDER BY created_at DESC", [req.params.bookId]));

    // the price book, so each item can be estimated
    const { rows: vp } = await db.query('SELECT DISTINCT ON (item_key) item_key, amount_enc, unit_enc FROM value_points WHERE book_id = $1 ORDER BY item_key, as_of DESC', [req.params.bookId]);
    const priceBook = {};
    for (const r of vp) priceBook[r.item_key] = { unitPrice: num(r.amount_enc), unit: str(r.unit_enc) };

    const out = [];
    for (const l of lists) {
      const { rows: items } = await db.query('SELECT * FROM shopping_items WHERE list_id = $1 ORDER BY position, created_at', [l.id]);
      const shaped = items.map((i) => ({
        id: i.id, label: str(i.label_enc), quantity: i.quantity != null ? Number(i.quantity) : 1,
        unit: i.unit, status: i.status, actualAmount: num(i.actual_enc), entryId: i.entry_id,
      }));
      out.push({ id: l.id, name: str(l.name_enc), ...SHOP.planList(shaped, priceBook) });
    }

    // 🔑 FORECAST — recurring buys that are due, learned from the purchase history.
    //    Every money-out entry that named an item IS a purchase; grouped by item,
    //    a rhythm emerges, and SHOP.forecastDue decides what is due now.
    const { rows: buys } = await db.query(
      "SELECT label_enc, occurred_on, quantity FROM entries WHERE book_id = $1 AND direction = 'out' AND label_enc IS NOT NULL AND occurred_on IS NOT NULL",
      [req.params.bookId]);
    const hist = {};
    for (const e of buys) {
      const label = str(e.label_enc); if (!label) continue;
      const key = SHOP.keyOf(label);
      (hist[key] = hist[key] || { key, label, purchases: [] })
        .purchases.push({ asOf: iso(e.occurred_on), quantity: e.quantity != null ? Number(e.quantity) : 1 });
    }
    for (const k of Object.keys(hist)) {
      const pb = priceBook[k];
      if (pb) { hist[k].unitPrice = pb.unitPrice; hist[k].unit = pb.unit; }
    }
    const forecast = SHOP.forecastDue(Object.values(hist), { asOf: today() });

    res.json({ ok: true, lists: out, forecast });
  } catch (e) { next(e); }
});

router.post('/:bookId/shopping', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ ok: false, error: 'NAME_REQUIRED', headline: 'Give the list a name.' });
    const { rows } = await db.query('INSERT INTO shopping_lists (book_id, name_enc) VALUES ($1,$2) RETURNING id', [req.params.bookId, encrypt(name)]);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'shopping_lists', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

async function listInBook(listId, bookId) {
  const { rows } = await db.query('SELECT id FROM shopping_lists WHERE id = $1 AND book_id = $2', [listId, bookId]);
  return rows.length > 0;
}

router.post('/:bookId/shopping/:listId/items', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    if (!await listInBook(req.params.listId, req.params.bookId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const label = String(req.body?.label || '').trim();
    if (!label) return res.status(400).json({ ok: false, error: 'LABEL_REQUIRED', headline: 'What are you buying?' });
    const { rows } = await db.query(
      'INSERT INTO shopping_items (list_id, label_enc, quantity, unit) VALUES ($1,$2,$3,$4) RETURNING id',
      [req.params.listId, encrypt(label), req.body?.quantity != null ? Number(req.body.quantity) : null, req.body?.unit || null]);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'shopping_items', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

router.delete('/:bookId/shopping/:listId/items/:id', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    if (!await listInBook(req.params.listId, req.params.bookId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await db.query('DELETE FROM shopping_items WHERE id = $1 AND list_id = $2', [req.params.id, req.params.listId]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/**
 * 🔑 MARK AN ITEM DONE → it becomes a real expense, priced and price-book-updating.
 *
 * You give what you ACTUALLY paid (and, if it differed, the quantity). We create a
 * money-out entry through the SAME pricing path as the Record sheet — so the actual
 * price flows into the price book, and the expense is linked back to the item.
 */
router.post('/:bookId/shopping/:listId/items/:id/done', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    if (!await listInBook(req.params.listId, req.params.bookId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const { rows: it } = await db.query('SELECT * FROM shopping_items WHERE id = $1 AND list_id = $2', [req.params.id, req.params.listId]);
    if (!it.length) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const item = it[0];

    const { accountId, actualAmount, quantity, category } = req.body || {};
    if (!accountId) {
      return res.status(400).json({ ok: false, error: 'ACCOUNT_REQUIRED',
        headline: 'Which account did you pay from?',
        why: ['Marking this done records a real expense, and an expense must say where the money came from.'] });
    }

    // 🔑 the actual purchase → a money-out entry, through the shared pricing path.
    const created = await createEntryFrom(req.params.bookId, req.taxpayerId, {
      direction: 'out',
      label: str(item.label_enc),
      quantity: quantity != null ? quantity : (item.quantity != null ? Number(item.quantity) : undefined),
      unit: item.unit || undefined,
      amount: actualAmount,                      // 🔑 what you actually paid — this is what the price book learns
      category: category || undefined,           // the category chosen when checking it off the list
      accountId,
      occurredOn: today(),
    });
    if (created.refused) return res.status(400).json(created.refused);

    await db.query(
      "UPDATE shopping_items SET status = 'done', actual_enc = $1, done_at = now(), entry_id = $2, quantity = COALESCE($3, quantity) WHERE id = $4",
      [encrypt(Number(created.total || actualAmount || 0)), created.id, quantity != null ? Number(quantity) : null, req.params.id]);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'shopping_items', entityId: req.params.id, req });

    res.json({ ok: true, entryId: created.id, total: created.total,
      note: 'Bought, and recorded as an expense. If the price moved, your default is updated.' });
  } catch (e) { next(e); }
});

/** Change a still-PENDING item — its label, how many, or the unit. A bought item is
 *  a settled fact and is not edited here; undo it first if it was a mistake. */
router.patch('/:bookId/shopping/:listId/items/:id', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    if (!await listInBook(req.params.listId, req.params.bookId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const { rows: it } = await db.query('SELECT * FROM shopping_items WHERE id = $1 AND list_id = $2', [req.params.id, req.params.listId]);
    if (!it.length) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (it[0].status === 'done') return res.status(400).json({ ok: false, error: 'ALREADY_BOUGHT',
      headline: 'This item is already bought.', why: ['A purchase is a settled fact. If it was a mistake, undo it first, then change it.'] });

    const sets = [], vals = []; let n = 1;
    if (req.body?.label != null) { const l = String(req.body.label).trim(); if (l) { sets.push('label_enc = $' + n++); vals.push(encrypt(l)); } }
    if ('quantity' in (req.body || {})) { sets.push('quantity = $' + n++); vals.push(req.body.quantity == null || req.body.quantity === '' ? null : Number(req.body.quantity)); }
    if ('unit' in (req.body || {})) { sets.push('unit = $' + n++); vals.push(req.body.unit || null); }
    if (!sets.length) return res.json({ ok: true });   // nothing to change is not an error
    vals.push(req.params.id);
    await db.query('UPDATE shopping_items SET ' + sets.join(', ') + ' WHERE id = $' + n, vals);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'shopping_items', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/**
 * 🔑 UNDO A PURCHASE — because a mis-tap must not leave phantom money on the books.
 *
 * The item goes back to PENDING and the expense it created is DELETED. A purchase
 * that did not happen is not money, and Selah will not leave it counted. (The price
 * we learned from it stays: you did observe that price. Re-buy to record a new one.)
 */
router.post('/:bookId/shopping/:listId/items/:id/undo', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    if (!await listInBook(req.params.listId, req.params.bookId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const { rows: it } = await db.query('SELECT * FROM shopping_items WHERE id = $1 AND list_id = $2', [req.params.id, req.params.listId]);
    if (!it.length) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (it[0].status !== 'done') return res.json({ ok: true });   // already pending

    if (it[0].entry_id) {
      await db.query('DELETE FROM entries WHERE id = $1 AND book_id = $2', [it[0].entry_id, req.params.bookId]);
      await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'entries', entityId: it[0].entry_id, req });
    }
    await db.query("UPDATE shopping_items SET status = 'pending', actual_enc = NULL, done_at = NULL, entry_id = NULL WHERE id = $1", [req.params.id]);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'shopping_items', entityId: req.params.id, req });
    res.json({ ok: true, note: 'Back on the list. The expense it created has been removed.' });
  } catch (e) { next(e); }
});

/** Rename a list. */
router.patch('/:bookId/shopping/:listId', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    if (!await listInBook(req.params.listId, req.params.bookId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ ok: false, error: 'NAME_REQUIRED', headline: 'A list needs a name.' });
    await db.query('UPDATE shopping_lists SET name_enc = $1 WHERE id = $2 AND book_id = $3', [encrypt(name), req.params.listId, req.params.bookId]);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'shopping_lists', entityId: req.params.listId, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/** Delete a whole list. Its items go with it — but any REAL expenses they created
 *  stay on the books (they are money that moved). The plan is gone; the record is not. */
router.delete('/:bookId/shopping/:listId', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    if (!await listInBook(req.params.listId, req.params.bookId)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await db.query('DELETE FROM shopping_lists WHERE id = $1 AND book_id = $2', [req.params.listId, req.params.bookId]);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'shopping_lists', entityId: req.params.listId, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
