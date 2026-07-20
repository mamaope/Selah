/**
 * SELAH — /api/me
 *
 * 🔴 THIS IS WHERE A DATA SUBJECT'S RIGHTS ACTUALLY LIVE, and most platforms
 *    bury them in a support ticket.
 *
 * Under DPPA a person may ask what we hold, who has read it, ask us to correct
 * it, and ask us to DELETE it. Those are not features. They are obligations, and
 * a company that cannot honour them in code cannot honour them at all.
 */
const express = require('express');
const db = require('../lib/db');
const { decrypt } = require('../lib/crypto');
const session = require('../lib/session');

const router = express.Router();
router.use(session.require);

const d = (v) => { try { return v ? decrypt(v) : null; } catch { return null; } };

// ── GET /api/me — everything we hold about you ───────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'taxpayers', entityId: req.taxpayerId, req },
      () => db.query('SELECT * FROM taxpayers WHERE id = $1', [req.taxpayerId])
    );
    const t = rows[0];
    res.json({
      ok: true,
      me: {
        id: t.id,
        // 🔑 WHICH KIND OF TAXPAYER IS THIS? Without it, individual.html cannot
        // tell that it is showing a COMPANY account the personal screens — and it
        // would render them, happily, wired to the wrong taxpayer's data.
        kind: t.kind,
        phone: d(t.phone_enc),
        name: d(t.name_enc),
        tin: d(t.tin_enc),
        residence: t.residence,
        memberSince: t.created_at,
        yourDataWillBeDeletedAfter: t.delete_after,
      },
    });
  } catch (e) { next(e); }
});

/**
 * 🔑 GET /api/me/audit — WHO HAS READ YOUR DATA.
 *
 * We hold Ugandans' payslips and tax positions. They are entitled to know who
 * looked. Almost no platform will show you this. We will, because if we are not
 * prepared to be watched holding it, we should not be holding it.
 */
router.get('/audit', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT at, action, entity, actor_id = $1 AS was_you, ip
         FROM audit_log WHERE subject_id = $1 ORDER BY at DESC LIMIT 500`,
      [req.taxpayerId]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ_AUDIT', entity: 'audit_log', req });
    res.json({
      ok: true,
      statement: 'Everything anybody has done with your data. If a row here says it was not you, tell us immediately.',
      entries: rows,
    });
  } catch (e) { next(e); }
});

/**
 * 🔑 GET /api/me/export — take your data and go.
 *
 * Data portability. And it is also the thing that makes leaving us cheap, which
 * is exactly the discipline a company holding this data should be under.
 */
router.get('/export', async (req, res, next) => {
  try {
    const id = req.taxpayerId;
    const [me, payslips, invoices, money, consents] = await Promise.all([
      db.query('SELECT * FROM taxpayers WHERE id = $1', [id]),
      db.query('SELECT * FROM payslips WHERE taxpayer_id = $1 ORDER BY period', [id]),
      db.query('SELECT * FROM invoices WHERE taxpayer_id = $1 ORDER BY invoice_date', [id]),
      db.query('SELECT * FROM money_items WHERE taxpayer_id = $1', [id]),
      db.query('SELECT * FROM consents WHERE taxpayer_id = $1', [id]),
    ]);

    await db.audit({ actorId: id, subjectId: id, action: 'EXPORT', entity: 'taxpayers', entityId: id, req });

    res.setHeader('Content-Disposition', 'attachment; filename="selah-my-data.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      statement: 'This is everything Selah holds about you. It is yours.',
      me: { phone: d(me.rows[0].phone_enc), name: d(me.rows[0].name_enc), tin: d(me.rows[0].tin_enc) },
      payslips: payslips.rows.map((p) => ({
        period: p.period, employer: d(p.employer_enc), gross: d(p.gross_enc),
        payeDeducted: d(p.paye_enc), payeCorrect: d(p.computed_paye_enc), variance: d(p.variance_enc),
        ruleId: p.rule_id, ruleVerifiedOn: p.rule_verified_on,
      })),
      invoices: invoices.rows.map((i) => ({
        date: i.invoice_date, client: d(i.client_name_enc), amount: d(i.amount_enc),
        whtWithheld: d(i.wht_withheld_enc), certificateHeld: i.certificate_held,
      })),
      money: money.rows.map((m) => ({ kind: m.kind, label: d(m.label_enc), amount: d(m.amount_enc), asOf: m.as_of })),
      consents: consents.rows,
    });
  } catch (e) { next(e); }
});

/**
 * 🔴 DELETE /api/me — and it DELETES. It does not "deactivate".
 *
 * A right to erasure that archives your data is not a right to erasure. The rows
 * go. ON DELETE CASCADE takes the payslips, the invoices, the money, the sessions.
 *
 * The AUDIT LOG survives, and it must: we are required to be able to show that
 * the deletion happened, and the log holds no personal data — only that an event
 * occurred. That is the correct trade and we state it out loud.
 */
router.delete('/', async (req, res, next) => {
  try {
    const id = req.taxpayerId;
    await db.audit({ actorId: id, subjectId: id, action: 'DELETE_ACCOUNT', entity: 'taxpayers', entityId: id, req,
      detail: { note: 'Erasure requested by the data subject. Rows deleted, not archived.' } });

    await db.query('DELETE FROM taxpayers WHERE id = $1', [id]);   // cascades
    res.clearCookie('selah_session', { path: '/' });

    res.json({
      ok: true,
      deleted: true,
      statement: 'Gone. Your payslips, invoices, money and sessions are deleted — not archived, not soft-deleted, not "retained for analytics".',
      whatRemains: 'One line in our append-only audit log saying that a deletion happened, at this time. It contains no personal data. We are required to be able to prove the erasure occurred, and that line is how.',
    });
  } catch (e) { next(e); }
});

module.exports = router;
