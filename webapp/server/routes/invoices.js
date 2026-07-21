/**
 * SELAH — THE WHT REGISTER. THIS IS THE ISAAC PRODUCT.
 * ─────────────────────────────────────────────────────────────────────────────
 * Withholding tax deducted from you is NOT a cost. It is PREPAID TAX — a credit
 * against your income tax.
 *
 * But it is only claimable IF YOU HOLD THE CERTIFICATE.
 *
 *     A credit you cannot evidence is a credit you do not have.
 *
 * Isaac invoiced UGX 60,000,000 over five years. 6% was withheld: 3,600,000.
 * He held 4 certificates out of 11. He paid tax twice on the rest.
 *
 * The whole product is one boolean column.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const db = require('../lib/db');
const { encrypt, decrypt } = require('../lib/crypto');
const session = require('../lib/session');

const E = require('../../engine/engine');
const { RULES } = require('../../engine/rules');

const router = express.Router();
router.use(session.require);
const d = (v) => (v ? Number(decrypt(v)) : null);

router.post('/', async (req, res, next) => {
  try {
    const { invoiceNo, invoiceDate, client, amount, paymentType = 'professional_fees', certificateHeld = false, certificateNo } = req.body || {};
    if (!invoiceDate || !amount) return res.status(400).json({ ok: false, error: 'BAD_INPUT' });

    const spec = RULES.WHT_2026.rates.find((r) => r.key === paymentType);
    if (!spec) return res.status(400).json({ ok: false, error: 'UNKNOWN_PAYMENT_TYPE',
      message: 'We do not recognise that payment type, and we will not guess at the rate.' });

    const withheld = Number(amount) * (spec.resident ?? 0);

    const { rows } = await db.query(
      `INSERT INTO invoices (taxpayer_id, invoice_no_enc, invoice_date, client_name_enc, amount_enc,
                             payment_type, wht_withheld_enc, certificate_held, certificate_no_enc)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [req.taxpayerId, encrypt(invoiceNo), invoiceDate, encrypt(client), encrypt(amount),
       paymentType, encrypt(withheld), !!certificateHeld, encrypt(certificateNo)]
    );

    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'CREATE', entity: 'invoices', entityId: rows[0].id, req });
    res.json({ ok: true, id: rows[0].id, whtWithheld: withheld, isFinalTax: !!spec.final });
  } catch (e) { next(e); }
});

/** 🔑 GET /api/invoices/credits — what URA is holding that belongs to you. */
router.get('/credits', async (req, res, next) => {
  try {
    const { rows } = await db.audited(
      { actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'READ', entity: 'invoices', req },
      () => db.query('SELECT * FROM invoices WHERE taxpayer_id = $1 ORDER BY invoice_date', [req.taxpayerId])
    );

    const lines = rows.map((i) => {
      const spec = RULES.WHT_2026.rates.find((r) => r.key === i.payment_type);
      return {
        id: i.id,
        date: i.invoice_date,
        client: i.client_name_enc ? decrypt(i.client_name_enc) : null,
        amount: d(i.amount_enc),
        withheld: d(i.wht_withheld_enc),
        certificateHeld: i.certificate_held,
        // A FINAL tax is not a credit. Do not chase a certificate for it.
        isFinalTax: !!spec?.final,
        chasedOn: i.chased_on,
      };
    });

    const creditable = lines.filter((l) => !l.isFinalTax);
    const withheld   = creditable.reduce((a, l) => a + (l.withheld || 0), 0);
    const claimable  = creditable.filter((l) => l.certificateHeld).reduce((a, l) => a + (l.withheld || 0), 0);
    const atRisk     = withheld - claimable;
    const missing    = creditable.filter((l) => !l.certificateHeld);

    res.json({
      ok: true,
      lines,
      credits: {
        withheld, claimable, atRisk,
        certificatesHeld: creditable.length - missing.length,
        certificatesExpected: creditable.length,
        certificatesMissing: missing.length,
      },
      finding: atRisk > 0 ? {
        headline: `URA is holding ${E.fmt(withheld)} that belongs to you. You hold ${creditable.length - missing.length} of ${creditable.length} certificates.`,
        atRisk,
        detail: `Without the other ${missing.length}, ${E.fmt(atRisk)} of that is UNCLAIMABLE — and you will pay tax twice on the same income.`,
        whatYouDo: 'Send the certificate request to every client in the list below. We have drafted it.',
        chase: missing.map((m) => ({ id: m.id, client: m.client, date: m.date, amount: m.amount, withheld: m.withheld })),
      } : creditable.length ? {
        headline: 'You hold every certificate. The full credit is claimable.',
        detail: 'This is rarer than it should be.',
      } : null,
      notes: [
        'This is NOT a cost. It is PREPAID TAX — a credit against your income tax.',
        'It survives the presumptive regime (Schedule 3, Part II). The certificate keeps its value in every regime.',
        'It reduces your PROVISIONAL tax too. Businesses routinely pay provisional tax in full AND suffer WHT — paying the same tax twice.',
      ],
    });
  } catch (e) { next(e); }
});

/** Mark a certificate as received. The moment the money becomes real. */
router.patch('/:id/certificate', async (req, res, next) => {
  try {
    const { held, certificateNo } = req.body || {};
    await db.query(
      `UPDATE invoices SET certificate_held = $1, certificate_no_enc = $2
        WHERE id = $3 AND taxpayer_id = $4`,
      [!!held, encrypt(certificateNo), req.params.id, req.taxpayerId]
    );
    await db.audit({ actorId: req.taxpayerId, subjectId: req.taxpayerId, action: 'UPDATE', entity: 'invoices', entityId: req.params.id, req });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
