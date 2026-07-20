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
const booksRoute = require('./books');

const router = express.Router();
router.use(session.require);

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(decrypt(v)));
const str = (v) => (v ? decrypt(v) : null);
const today = () => new Date().toISOString().slice(0, 10);
const iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);

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

// ═══════════════════════════════════════════════════════════════════════════
// ENTRIES
// ═══════════════════════════════════════════════════════════════════════════

/** Record something that happened. The daily flow: amount, category, account, done. */
router.post('/:bookId/entries', async (req, res, next) => {
  try {
    if (!await guard(req, res)) return;
    const { direction, label, amount, category, accountId, fromAccountId, toAccountId, occurredOn, note, currency } = req.body || {};

    if (!['in', 'out', 'transfer'].includes(direction)) return res.status(400).json({ ok: false, error: 'BAD_DIRECTION' });

    // 🔴 A TRANSFER TOUCHES TWO ACCOUNTS AND ZERO TOTALS.
    if (direction === 'transfer') {
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
        return res.status(400).json({ ok: false, error: 'BAD_TRANSFER',
          headline: 'A transfer needs two different accounts.',
          why: ['Moving money from an account to itself is not a transfer, and moving it out of nowhere is not either.'] });
      }
    } else if (!accountId) {
      // 🔴 REQUIRED. NO DEFAULTS. A pre-filled account is a guess that gets tapped
      //    through without being read, and it puts a month's rent in the wrong pocket.
      return res.status(400).json({ ok: false, error: 'ACCOUNT_REQUIRED',
        headline: 'Which account did this money touch?',
        why: ['Your balances are worked out from these entries. An entry with no account changes no balance — and the account it really moved through would be quietly wrong from now on.'],
        whatYouCanDoNow: ['Say where the money came from, or went to: cash, MoMo, the bank, the SACCO.'] });
    }

    let categoryId = null;
    if (category) {
      const { rows } = await db.query('SELECT id FROM categories WHERE book_id = $1 AND key = $2', [req.params.bookId, category]);
      categoryId = rows[0] ? rows[0].id : null;
    }

    const { rows } = await db.query(
      `INSERT INTO entries (book_id, author_id, occurred_on, direction, label_enc, category_id, currency,
                            expected_enc, actual_enc, status, note_enc, account_id, from_account_id, to_account_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,'unplanned',$9,$10,$11,$12) RETURNING id`,
      [req.params.bookId, req.taxpayerId, occurredOn || today(), direction,
       encrypt(String(label || '')), categoryId, currency === 'USD' ? 'USD' : 'UGX',
       encrypt(Number(amount || 0)), note ? encrypt(note) : null,
       direction === 'transfer' ? null : accountId,
       direction === 'transfer' ? fromAccountId : null,
       direction === 'transfer' ? toAccountId : null]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'entries', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id });
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
      `SELECT b.*, c.key AS category_key FROM budgets b JOIN categories c ON c.id = b.category_id
        WHERE b.book_id = $1`, [req.params.bookId]);
    const budgets = bud.map((b) => ({
      id: b.id,
      category: b.category_key, label: str(b.label_enc), amount: num(b.amount_enc),
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

module.exports = router;
