/** SELAH — budget, debts, assets. Persistent, and computed by the same engine. */
const express = require('express');
const db = require('../lib/db');
const { encrypt, decrypt } = require('../lib/crypto');
const session = require('../lib/session');
const P = require('../../engine/personal');

const router = express.Router();
router.use(session.require);
const d = (v) => (v ? Number(decrypt(v)) : null);

router.post('/', async (req, res, next) => {
  try {
    const { kind, label, amount, meta } = req.body || {};
    const allowed = ['income', 'expense', 'debt', 'asset', 'liability', 'saving'];
    if (!allowed.includes(kind) || amount == null) {
      return res.status(400).json({ ok: false, error: 'BAD_INPUT' });
    }
    const { rows } = await db.query(
      `INSERT INTO money_items (taxpayer_id, kind, label_enc, amount_enc, meta)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [req.taxpayerId, kind, encrypt(label), encrypt(amount), meta || null]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'money_items', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

/** The picture — budget, net worth, and the debt plan. All from the same engine. */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'money_items', req },
      () => db.query('SELECT * FROM money_items WHERE taxpayer_id = $1', [req.taxpayerId])
    );
    const items = rows.map((m) => ({ id: m.id, kind: m.kind, label: m.label_enc ? decrypt(m.label_enc) : null, amount: d(m.amount_enc), meta: m.meta }));

    const income   = items.filter((i) => i.kind === 'income').reduce((a, i) => a + i.amount, 0);
    const expenses = items.filter((i) => i.kind === 'expense');
    const debts    = items.filter((i) => i.kind === 'debt');
    const assets   = items.filter((i) => i.kind === 'asset');
    const liabs    = items.filter((i) => i.kind === 'liability');

    const budget = income ? P.budget({
      monthlyIncome: income,
      expenses: expenses.map((e) => ({ category: e.label || 'other', amount: e.amount })),
    }) : null;

    const netWorth = (assets.length || liabs.length) ? P.netWorth({
      assets: assets.map((a) => ({ label: a.label, value: a.amount })),
      liabilities: liabs.map((l) => ({ label: l.label, value: l.amount })),
    }) : null;

    const debtPlan = (debts.length && budget && budget.result > 0) ? P.debtPayoff({
      monthlyBudget: budget.result,
      debts: debts.map((x) => ({
        label: x.label || 'debt',
        balance: x.amount,
        annualRate: (x.meta?.annualRate ?? 0.2),
        minimum: (x.meta?.minimum ?? Math.round(x.amount * 0.02)),
      })),
    }) : null;

    res.json({ ok: true, items, budget, netWorth, debtPlan });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM money_items WHERE id = $1 AND taxpayer_id = $2', [req.params.id, req.taxpayerId]);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'money_items', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
