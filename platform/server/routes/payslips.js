/**
 * SELAH — THE PAYSLIP CHECKER
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 THE HIGHEST-VOLUME FINDING IN UGANDA, AND IT IS SITTING ON EVERY PAYSLIP.
 *
 * On 1 July 2026 the PAYE bands changed. The tax-free threshold rose from
 * 235,000 to 335,000. The 10% band was ABOLISHED. A new 25% band appeared.
 *
 * URA'S OWN PAYE RATES PAGE STILL PUBLISHES THE OLD BANDS.
 *
 * So every payroll clerk in Uganda who does the responsible thing — who goes to
 * the tax authority's own website to check the rates — is over-deducting from
 * their staff. Not through greed. Through diligence.
 *
 * This endpoint takes what your employer ACTUALLY deducted, recomputes it from
 * the gazetted Act, and shows you the gap.
 *
 * AND IT STORES THE RULE VERSION IT USED. That is not bureaucracy: when Parliament
 * moves a band, we can find every person advised under the old rule and tell them.
 * No Ugandan tax practice can do that.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const db = require('../lib/db');
const { encrypt, decrypt } = require('../lib/crypto');
const session = require('../lib/session');

// 🔑 THE SAME ENGINE THE 408 TESTS RUN AGAINST. Not a copy. Not a reimplementation.
// If the server and the browser could compute different tax, one of them is wrong
// and neither of us would know which.
const E = require('../../engine/engine');
const { RULES } = require('../../engine/rules');

const router = express.Router();
router.use(session.require);

const d = (v) => (v ? Number(decrypt(v)) : null);

// ── POST /api/payslips — add a payslip, and check it ─────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { period, employer, gross, payeDeducted, nssfDeducted, lstDeducted, net } = req.body || {};

    if (!period || !gross) {
      return res.status(400).json({ ok: false, error: 'BAD_INPUT',
        message: 'We need at least the month and the gross pay.' });
    }

    // 🔑 RECOMPUTE FROM THE GAZETTED ACT.
    const truth = E.paye(Number(gross), 'resident');

    if (truth.refused) {
      // Non-resident. The engine refuses, and so do we — we do not guess.
      return res.status(422).json({ ok: false, refused: true, refusal: truth.refusal });
    }

    const shouldBe = truth.result;
    const actually = payeDeducted != null ? Number(payeDeducted) : null;
    const variance = actually != null ? actually - shouldBe : null;

    const { rows } = await db.query(
      `INSERT INTO payslips
        (taxpayer_id, period, employer_enc, gross_enc, paye_enc, nssf_enc, lst_enc, net_enc,
         computed_paye_enc, variance_enc, rule_id, rule_verified_on)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (taxpayer_id, period) DO UPDATE SET
         gross_enc = EXCLUDED.gross_enc, paye_enc = EXCLUDED.paye_enc,
         computed_paye_enc = EXCLUDED.computed_paye_enc, variance_enc = EXCLUDED.variance_enc,
         rule_id = EXCLUDED.rule_id, rule_verified_on = EXCLUDED.rule_verified_on
       RETURNING id`,
      [req.taxpayerId, period, encrypt(employer), encrypt(gross), encrypt(payeDeducted),
       encrypt(nssfDeducted), encrypt(lstDeducted), encrypt(net),
       encrypt(shouldBe), encrypt(variance),
       truth.rule.id, truth.rule.verifiedOn]
    );

    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId,
      action: 'CREATE', entity: 'payslips', entityId: rows[0].id, req });

    res.json({ ok: true, id: rows[0].id, check: { shouldBe, actually, variance }, trace: truth });
  } catch (e) { next(e); }
});

/**
 * 🔑 GET /api/payslips/check — the finding.
 *
 * "Your employer deducted 254,750. The correct figure is 188,250. You have been
 *  over-deducted 66,500 a month — 399,000 over six months."
 */
router.get('/check', async (req, res, next) => {
  try {
    const { rows } = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'payslips', req },
      () => db.query('SELECT * FROM payslips WHERE taxpayer_id = $1 ORDER BY period', [req.taxpayerId])
    );

    const months = rows.map((p) => {
      const gross = d(p.gross_enc);
      const truth = E.paye(gross, 'resident');
      return {
        period: p.period,
        employer: p.employer_enc ? decrypt(p.employer_enc) : null,
        gross,
        deducted: d(p.paye_enc),
        shouldBe: truth.result,
        variance: d(p.paye_enc) != null ? d(p.paye_enc) - truth.result : null,
        steps: truth.steps,
        rule: truth.rule,
      };
    });

    const checked = months.filter((m) => m.variance != null);
    const overDeducted  = checked.filter((m) => m.variance > 0);
    const underDeducted = checked.filter((m) => m.variance < 0);
    const totalOver  = overDeducted.reduce((a, m) => a + m.variance, 0);
    const totalUnder = underDeducted.reduce((a, m) => a + Math.abs(m.variance), 0);

    res.json({
      ok: true,
      months,
      finding: !checked.length ? null
        : totalOver > 0 ? {
            kind: 'OVER_DEDUCTED',
            headline: `Your employer has taken ${E.fmt(totalOver)} more than the law requires, over ${overDeducted.length} month(s).`,
            amount: totalOver,
            perMonth: Math.round(totalOver / overDeducted.length),
            why: "The PAYE bands changed on 1 July 2026 — the tax-free threshold rose from 235,000 to 335,000 and the 10% band was abolished. URA's OWN PAYE RATES PAGE STILL PUBLISHES THE OLD BANDS. Your payroll team may be doing the responsible thing and following the tax authority's own website. That is why this happens.",
            whatYouDo: 'Show your payroll team the working below. It cites the gazetted Act, section and date. Ask them which bands they are using.',
            evidenceUrl: 'https://ura.go.ug/en/domestic-taxes/paye-rates/',
          }
        : totalUnder > 0 ? {
            kind: 'UNDER_DEDUCTED',
            headline: `Your employer has taken ${E.fmt(totalUnder)} LESS than the law requires.`,
            amount: totalUnder,
            why: 'This is not a windfall. Under-deducted PAYE is still owed, and interest runs at 2% a month. It is better to find it now than at an audit.',
            whatYouDo: 'Tell your employer. The liability is theirs to remit, but the tax is yours.',
          }
        : { kind: 'CORRECT', headline: 'Your PAYE is being computed correctly. That is rarer than it should be.' },
      // 🔑 The rule version every figure was produced under.
      rule: RULES.PAYE_RESIDENT_2026.id,
      verifiedOn: RULES.PAYE_RESIDENT_2026.verifiedOn,
    });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM payslips WHERE id = $1 AND taxpayer_id = $2', [req.params.id, req.taxpayerId]);
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'DELETE', entity: 'payslips', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
