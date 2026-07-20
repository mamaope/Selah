/**
 * SELAH — THE PDPO GATE
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THIS FILE IS A LOCK ON THE FRONT DOOR OF THE COMPANY.
 *
 * Uganda's Data Protection and Privacy Act, s.9(1): financial data is SPECIAL
 * PERSONAL DATA. Processing it is PROHIBITED BY DEFAULT.
 *
 * Not "regulated". PROHIBITED — unless a lawful basis applies and you are
 * registered with the Personal Data Protection Office.
 *
 * AND THE PENALTY IS PERSONAL.
 *
 *     On 10 July 2025, a digital lender's DIRECTOR was PERSONALLY CONVICTED
 *     for failing to register with the PDPO. Not the company. The director.
 *
 * Xero, QuickBooks and Sage all hold this data on a server. They can, because
 * every one of them is a registered data controller. REGISTRATION IS THE LICENCE
 * TO HOLD IT. Copying their architecture without their registration is exactly
 * how that director ended up in court.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SO THE LEGAL GATE IS A TECHNICAL GATE.
 *
 * Without a PDPO registration number in the environment, EVERY endpoint that
 * would persist personal data returns:
 *
 *     HTTP 451 — Unavailable For Legal Reasons
 *
 * It is not a warning. It is not a TODO. It is not a flag someone can flip at
 * 2am because a demo is going badly. The server will not store a payslip, a TIN,
 * a phone number or an invoice until this is set.
 *
 * We built an engine that REFUSES TO LOAD on a malformed rule, because a wrong
 * number must not be servable. This is the same principle, pointed at the thing
 * that can put a founder in a courtroom.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TO TURN IT ON — and only when it is TRUE:
 *
 *     PDPO_REGISTRATION_NUMBER=...    the number the PDPO issued you
 *     PDPO_REGISTERED_ON=2026-09-01   the date on the certificate
 *     DPO_NAME=...                    the human being who is accountable
 *     DPO_EMAIL=...                   how a data subject reaches them
 *
 * 🔴 DO NOT SET THESE UNTIL THEY ARE TRUE. Setting them falsely does not make you
 * compliant. It makes you compliant-looking, which is worse, because it removes
 * the one thing standing between you and a conviction: the fact that the software
 * would not let you.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const REGISTRATION = {
  number: process.env.PDPO_REGISTRATION_NUMBER || null,
  registeredOn: process.env.PDPO_REGISTERED_ON || null,
  dpoName: process.env.DPO_NAME || null,
  dpoEmail: process.env.DPO_EMAIL || null,
};

/**
 * 🔴 ARE WE LAWFULLY PERMITTED TO PROCESS SPECIAL PERSONAL DATA?
 *
 * THIS USED TO CHECK ONLY THAT THE FOUR VARIABLES WERE NON-EMPTY. That was a
 * real hole, and it opened.
 *
 * The founder's .env came back with:
 *
 *     PDPO_REGISTRATION_NUMBER = "1234"      (four characters)
 *     PDPO_REGISTERED_ON       = "true"
 *     DPO_NAME                 = "vvvvv"
 *
 * He had not lied. Docker was refusing to start over unset variables, so he
 * filled in the blanks — which is what ANY reasonable person does with a config
 * file that has holes in it. And the gate opened. This server would have begun
 * storing Ugandans' payslips, TINs and phone numbers, believing itself a
 * registered data controller.
 *
 * THE LESSON IS NOT "READ THE COMMENTS". The comments were there, in capitals.
 *
 * The lesson is that a safety gate whose only test is "did somebody type
 * something?" is not a safety gate. It is a formality, and formalities are what
 * people fill in at 1am to make an error message go away.
 *
 * So now the values must be PLAUSIBLE. A registration number that is four
 * characters long is not a registration number. "true" is not a date. "vvvvv" is
 * not a human being a data subject can write to.
 *
 * This will not stop a determined person from lying — nothing can. It stops a
 * tired one from disarming his own protection by accident, and that is the case
 * that actually happens.
 */
/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 🔴 I CHECKED A FORMAT I HAD NEVER SEEN, AND REFUSED A REAL CERTIFICATE.
 *
 * This object used to contain two rules I INVENTED:
 *
 *     number:  at least 8 characters
 *     dpoName: at least two words
 *
 * Neither came from a source. The PDPO does not publish its certificate number
 * format anywhere — registration happens on their portal and the certificate is
 * downloaded from it. I had never seen one.
 *
 * So when Selah's REAL registration number turned out to be 7 digits, the gate
 * refused it, and told the operator their own certificate "is not credible".
 *
 * That is precisely the failure this company exists to attack. We built a product
 * because URA, PwC and Grant Thornton publish unverified rules as if they were
 * law — and here I was, doing exactly that, inside the safety gate itself. An
 * invented rule that REFUSES a true fact is not "being careful". It is being
 * wrong, with a stern voice.
 *
 * So the checks below now test ONLY what can actually be tested:
 *
 *     — is it there at all?
 *     — is the date a real date, in ISO form, and NOT IN THE FUTURE?
 *       (a certificate cannot be issued tomorrow — that one is a fact, not a guess)
 *     — is the email an email?
 *
 * What we CANNOT check, we do not pretend to. We WARN, loudly, where something
 * looks off — and a warning does not slam a door on a true statement.
 *
 * The gate's real job was never format validation. It was to stop a tired person
 * disarming their own protection by typing "true" into a date field to make an
 * error go away. `false` values still fail. A real certificate no longer does.
 * ═════════════════════════════════════════════════════════════════════════════
 */
/**
 * 🔑 THE ONE HEURISTIC THAT REFUSES NO REAL PERSON.
 *
 * Removing the invented rules let "vvvvv" back through — which was the ORIGINAL
 * incident: a DPO_NAME of "vvvvv" had disarmed this gate.
 *
 * There is no format test that separates "Sammy" from "vvvvv". But a value that is
 * a SINGLE CHARACTER REPEATED is not a name, not a number, and not anything else.
 * "vvvvv", "xxxxx", "aaaa", "11111" — a keyboard held down. No Ugandan is called
 * "vvvvv" and no certificate is numbered "11111".
 *
 * That is the whole of it. It catches the tired hand on the keyboard, which is the
 * case that actually happens, and it refuses nobody real. Every other judgement
 * about "credibility" is a WARNING — see concerns() — because I have already
 * refused one true fact on a hunch, and once is enough.
 */
const MASHED = (v) => /^(.)\1+$/.test(String(v || '').trim());

const PLAUSIBLE = {
  number: (v) => typeof v === 'string' && v.trim().length > 0 && !MASHED(v) &&
                 !/^(true|false|yes|no|n\/a|todo|tbd)$/i.test(v.trim()),

  registeredOn: (v) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return false;
    const d = Date.parse(v);
    if (isNaN(d)) return false;
    // 🔑 NOT A GUESS: a certificate cannot have been issued in the future.
    return d <= Date.now();
  },

  dpoName: (v) => typeof v === 'string' && v.trim().length > 0 && !MASHED(v) &&
                  !/^(true|false|n\/a|tbd|todo|the team|nobody)$/i.test(v.trim()),

  dpoEmail: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v || '')),
};

/**
 * Things that are ODD but not DISQUALIFYING. These are printed for the operator
 * and NEVER used to close the gate — because I have already refused one true fact
 * on the strength of a hunch, and once is enough.
 */
const FREE_ADVICE = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
function concerns() {
  const out = [];
  const e = String(REGISTRATION.dpoEmail || '').toLowerCase();
  if (FREE_ADVICE.some((d) => e.endsWith('@' + d))) {
    out.push(`⚠ DPO_EMAIL (${REGISTRATION.dpoEmail}) is a personal mailbox on a free provider. It is on your PDPO filing as the official contact for data subjects and for the regulator — and it will outlive whoever currently reads it. A company address (dpo@yourdomain) is not a formality; it is what stops a data subject's complaint dying with an employee.`);
  }
  if (REGISTRATION.dpoName && REGISTRATION.dpoName.trim().split(/\s+/).length < 2) {
    out.push(`⚠ DPO_NAME (${REGISTRATION.dpoName}) is a single word. The PDPO filing and your privacy notice should name a whole human being a regulator can ask for. Not a blocker — just check it matches the certificate.`);
  }
  return out;
}

function isRegistered() {
  return Boolean(
    REGISTRATION.number       && PLAUSIBLE.number(REGISTRATION.number) &&
    REGISTRATION.registeredOn && PLAUSIBLE.registeredOn(REGISTRATION.registeredOn) &&
    REGISTRATION.dpoName      && PLAUSIBLE.dpoName(REGISTRATION.dpoName) &&
    REGISTRATION.dpoEmail     && PLAUSIBLE.dpoEmail(REGISTRATION.dpoEmail)
  );
}

/** What is missing, precisely. Vague compliance errors are how people ignore them. */
function whatIsMissing() {
  const missing = [];
  const bad = (k, v, ok, what, why) => {
    if (!v) missing.push(`${k} — ${what}`);
    else if (!ok(v)) missing.push(`🔴 ${k} is set to ${JSON.stringify(v)}, and that is not credible. ${why}`);
  };
  bad('PDPO_REGISTRATION_NUMBER', REGISTRATION.number, PLAUSIBLE.number,
      'the number the Personal Data Protection Office issued to Selah Solutions Ltd',
      'It must be the number ON THE CERTIFICATE. "true", "yes" and "TBD" are not registration numbers.');
  bad('PDPO_REGISTERED_ON', REGISTRATION.registeredOn, PLAUSIBLE.registeredOn,
      'the date on the registration certificate',
      'It must be the date on the certificate, as YYYY-MM-DD, and it cannot be in the future.');
  bad('DPO_NAME', REGISTRATION.dpoName, PLAUSIBLE.dpoName,
      'a named human being who is accountable. Not a title. Not "the team".',
      'It must be the person named on the filing — not a placeholder.');
  bad('DPO_EMAIL', REGISTRATION.dpoEmail, PLAUSIBLE.dpoEmail,
      'how a data subject actually reaches that person',
      'That is not an address anybody could write to.');

  if (missing.some((m) => m.startsWith('🔴'))) {
    missing.push('');
    missing.push('If these were filled in to make an error go away, EMPTY ALL FOUR. The 451 is not a bug.');
    missing.push('These four variables are a LEGAL DECLARATION, not configuration.');
  }
  return missing;
}

/**
 * 🔴 THE MIDDLEWARE. Put it in front of anything that touches a person.
 *
 * 451 is the correct status and it is not a joke: "Unavailable For Legal Reasons".
 * It exists precisely for this — a resource we are legally forbidden to serve.
 */
function requireRegistration(req, res, next) {
  if (isRegistered()) return next();

  return res.status(451).json({
    ok: false,
    refused: true,
    error: 'UNAVAILABLE_FOR_LEGAL_REASONS',

    headline: 'We will not store your data, because we are not yet allowed to.',

    why: [
      "Uganda's Data Protection and Privacy Act, s.9(1), makes financial data SPECIAL PERSONAL DATA. Processing it is PROHIBITED BY DEFAULT.",
      'Selah Solutions Ltd is not yet registered with the Personal Data Protection Office.',
      'On 10 July 2025 a digital lender\'s DIRECTOR was personally convicted for failing to register. Not the company — the director.',
      'So this server will not accept a payslip, a TIN, a phone number or an invoice until that registration exists. This is not a bug. It is the only honest thing to do.',
    ],

    whatYouCanDoNow: [
      'Every calculator on this site works, right now, and stores nothing. Nothing you type is transmitted or kept.',
      'Nothing on the calculator pages requires an account, and nothing ever will.',
    ],

    whatWeAreDoing: 'Registering with the PDPO and appointing a Data Protection Officer. Until then, we would rather refuse you than break the law with your data.',

    // For us, not the user. Named precisely, because a vague compliance error is
    // an error that gets ignored.
    _forOperators: { missing: whatIsMissing() },
  });
}

/** Shout at boot. A silent gate is a gate someone forgets exists. */
function announce(log = console.log) {
  if (isRegistered()) {
    log('');
    log('  ✅ PDPO REGISTERED — personal data endpoints are LIVE');
    log(`     registration : ${REGISTRATION.number}`);
    log(`     registered   : ${REGISTRATION.registeredOn}`);
    log(`     DPO          : ${REGISTRATION.dpoName} <${REGISTRATION.dpoEmail}>`);
    log('');
    log('     Every read of personal data is audited. Every field is encrypted.');
    log('');
    return;
  }

  log('');
  log('  ══════════════════════════════════════════════════════════════════');
  log('  🔴 NOT REGISTERED WITH THE PDPO.');
  log('');
  log('     Every endpoint that would store personal data will return');
  log('     HTTP 451 — Unavailable For Legal Reasons.');
  log('');
  log('     Missing:');
  whatIsMissing().forEach((m) => log(`       · ${m}`));
  log('');
  log('     The calculators still work. They store nothing and never did.');
  log('');
  log('     🔴 DO NOT SET THESE VARIABLES UNTIL THEY ARE TRUE. Setting them');
  log('        falsely does not make you compliant. It removes the one thing');
  log('        standing between you and a conviction: the fact that the');
  log('        software would not let you.');
  log('  ══════════════════════════════════════════════════════════════════');
  log('');
}

module.exports = {
  concerns, isRegistered, whatIsMissing, requireRegistration, announce, REGISTRATION };
