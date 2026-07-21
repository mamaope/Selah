/**
 * SELAH — THE TAX CALENDAR, PERSISTED.
 *
 * The dates are computed by engine/calendar.js — THE SAME MODULE the browser runs
 * and the same one 36 tests execute. The server does not own a second copy of the
 * law. There is one engine. There has only ever been one engine.
 *
 * What the server adds is MEMORY: the profile we asked for, and the directors
 * nobody else is watching.
 */
const express = require('express');
const db = require('../lib/db');
const { encrypt, decrypt } = require('../lib/crypto');
const session = require('../lib/session');
const CAL = require('../../engine/calendar');

const router = express.Router();
router.use(session.require);

/** Postgres gives us true/false/null. The engine reads exactly that. Do not coerce. */
const tri = (v) => (v === true || v === false ? v : null);

async function loadProfile(taxpayerId) {
  const { rows } = await db.query('SELECT * FROM tax_profile WHERE taxpayer_id = $1', [taxpayerId]);
  const t = await db.query('SELECT kind FROM taxpayers WHERE id = $1', [taxpayerId]);
  const kind = t.rows[0] ? t.rows[0].kind : 'individual';
  if (!rows[0]) return { kind };            // 🔴 nothing asked yet. NOT "everything is false".
  const p = rows[0];
  return {
    kind,
    employsPeople:           tri(p.employs_people),
    isWithholdingAgent:      tri(p.is_withholding_agent),
    vatRegistered:           tri(p.vat_registered),
    filesIncomeTax:          tri(p.files_income_tax),
    hasNonEmploymentIncome:  tri(p.has_non_employment_income),
    yearEndMonth:            p.year_end_month || undefined,
  };
}

/** What we know about you, and — just as loudly — what we never asked. */
router.get('/', async (req, res, next) => {
  try {
    const profile = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'tax_profile', req },
      () => loadProfile(req.taxpayerId)
    );

    const asOf = new Date().toISOString().slice(0, 10);
    const cal = CAL.upcoming(profile, asOf, Number(req.query.count) || 12);

    const { rows } = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'directors', req },
      () => db.query('SELECT * FROM directors WHERE taxpayer_id = $1 ORDER BY created_at', [req.taxpayerId])
    );
    const directors = rows.map((r) => ({
      id: r.id,
      name: decrypt(r.name_enc),
      tin: r.tin_enc ? decrypt(r.tin_enc) : null,
      personalReturnsFiled: tri(r.personal_returns_filed),
      hasArrears: tri(r.has_arrears),
    }));

    // 🔴 Only an ENTITY has a TCC to lose. We do not run the check on a person and
    // we do not pretend the result is meaningful when there are no directors to
    // check — the engine REFUSES, and we pass that refusal straight through.
    const trap = profile.kind === 'entity' ? CAL.directorTrap(directors) : null;

    res.json({ ok: true, profile, calendar: cal, directors, directorTrap: trap });
  } catch (e) { next(e); }
});

/**
 * Answer the questions. Every field is optional; anything you do not send stays
 * UNASKED — it does not become `false`. Sending `null` un-answers a question,
 * which is a thing a person is allowed to do.
 */
router.put('/profile', async (req, res, next) => {
  try {
    const b = req.body || {};
    const yem = b.yearEndMonth === null || b.yearEndMonth === undefined ? null : Number(b.yearEndMonth);
    if (yem !== null && !(yem >= 1 && yem <= 12)) {
      return res.status(400).json({ ok: false, error: 'BAD_YEAR_END_MONTH' });
    }
    await db.query(
      `INSERT INTO tax_profile (taxpayer_id, employs_people, is_withholding_agent, vat_registered,
                                files_income_tax, has_non_employment_income, year_end_month)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (taxpayer_id) DO UPDATE SET
         employs_people            = COALESCE(EXCLUDED.employs_people,            tax_profile.employs_people),
         is_withholding_agent      = COALESCE(EXCLUDED.is_withholding_agent,      tax_profile.is_withholding_agent),
         vat_registered            = COALESCE(EXCLUDED.vat_registered,            tax_profile.vat_registered),
         files_income_tax          = COALESCE(EXCLUDED.files_income_tax,          tax_profile.files_income_tax),
         has_non_employment_income = COALESCE(EXCLUDED.has_non_employment_income, tax_profile.has_non_employment_income),
         year_end_month            = COALESCE(EXCLUDED.year_end_month,            tax_profile.year_end_month),
         updated_at = now()`,
      [req.taxpayerId, tri(b.employsPeople), tri(b.isWithholdingAgent), tri(b.vatRegistered),
       tri(b.filesIncomeTax), tri(b.hasNonEmploymentIncome), yem]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'tax_profile', entityId: req.taxpayerId, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/** Add a director. Including — especially — the dormant one nobody has spoken to since 2019. */
router.post('/directors', async (req, res, next) => {
  try {
    const { name, tin, personalReturnsFiled, hasArrears } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ ok: false, error: 'NAME_REQUIRED' });
    }
    const { rows } = await db.query(
      `INSERT INTO directors (taxpayer_id, name_enc, tin_enc, personal_returns_filed, has_arrears)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [req.taxpayerId, encrypt(String(name).trim()), tin ? encrypt(String(tin).trim()) : null,
       tri(personalReturnsFiled), tri(hasArrears)]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'directors', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

router.delete('/directors/:id', async (req, res, next) => {
  try {
    const { rowCount } = await db.query('DELETE FROM directors WHERE id = $1 AND taxpayer_id = $2', [req.params.id, req.taxpayerId]);
    if (!rowCount) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'directors', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/** What is this arrear actually costing, and what does voluntary disclosure save? */
router.post('/cost', async (req, res, next) => {
  try {
    const { amount, dueOn } = req.body || {};
    if (!(Number(amount) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(String(dueOn || ''))) {
      return res.status(400).json({ ok: false, error: 'BAD_INPUT' });
    }
    // Not persisted. A "what if" is not a record, and we store nothing we do not need.
    res.json({ ok: true, cost: CAL.costOfMissing(Number(amount), dueOn, new Date().toISOString().slice(0, 10)) });
  } catch (e) { next(e); }
});

module.exports = router;
