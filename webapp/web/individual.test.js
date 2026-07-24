/**
 * SELAH — THE INDIVIDUAL LAYER, IN A DOM
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE TEST THAT MATTERS IS THE FIRST ONE: what a Ugandan actually SEES when
 *    our server refuses to hold their data.
 *
 * The lazy implementation shows a red toast — "something went wrong, try again".
 * That is a lie. Nothing went wrong. The software did exactly what it was built
 * to do, and a company whose product is "we tell you the truth about tax" cannot
 * lie to its own users about why its own login does not work.
 *
 * Real stylesheets. Real URL. Real clicks. jsdom missed the CSP, the router and
 * the CSS three times this week by testing in an environment the bugs could not
 * live in.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WEB = __dirname;
const cssText = ['tokens.css', 'home.css', 'visuals.css']
  .map((f) => { try { return fs.readFileSync(path.join(WEB, 'assets', f), 'utf8'); } catch { return ''; } })
  .join('\n');
const html = fs.readFileSync(path.join(WEB, 'individual.html'), 'utf8')
  .replace('</head>', `<style>${cssText}</style></head>`);

let pass = 0, fail = 0;
const failures = [];
const ok = (n, c) => c ? (pass++, console.log(`  ✓ ${n}`)) : (fail++, failures.push(n), console.log(`  ✗ ${n}`));
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

/** Boot the page against a FAKE API that behaves exactly like the real one. */
function boot(fakeFetch) {
  const dom = new JSDOM(html, {
    runScripts: 'outside-only', pretendToBeVisual: true,
    url: 'http://localhost:8080/individual.html',
  });
  const w = dom.window;
  w.scrollTo = () => {};
  w.confirm = () => true;
  w.alert = () => {};
  w.fetch = fakeFetch;
  w.eval(fs.readFileSync(path.join(WEB, 'assets/theme.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(WEB, 'assets/engine.bundle.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(WEB, 'assets/api.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(WEB, 'assets/individual.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(WEB, 'assets/auth.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(WEB, 'assets/books.js'), 'utf8'));
  return { w, dom, D: w.document };
}
const json = (status, body) => Promise.resolve({
  status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body),
});
const settle = () => new Promise((r) => setTimeout(r, 30));
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const disp = (w, el) => w.getComputedStyle(el).display;

(async () => {

// ═══════════════════════════════════════════════════════════════════════════
section('🔴 REFUSED — what a Ugandan sees when we are not allowed to hold their data');
// ═══════════════════════════════════════════════════════════════════════════
const REFUSAL = {
  ok: false, refused: true, error: 'UNAVAILABLE_FOR_LEGAL_REASONS',
  headline: 'We will not store your data, because we are not yet allowed to.',
  why: [
    "Uganda's Data Protection and Privacy Act, s.9(1), makes financial data SPECIAL PERSONAL DATA. Processing it is PROHIBITED BY DEFAULT.",
    'Selah Solutions Ltd is not yet registered with the Personal Data Protection Office.',
    "On 10 July 2025 a digital lender's DIRECTOR was personally convicted for failing to register. Not the company — the director.",
  ],
  whatYouCanDoNow: ['Every calculator on this site works, right now, and stores nothing.'],
  whatWeAreDoing: 'Registering with the PDPO and appointing a Data Protection Officer.',
};

{
  const { w, D } = boot((url) =>
    url.includes('/compliance') ? json(200, { canStoreYourData: false })
                                : json(451, REFUSAL));
  await settle();

  ok('the REFUSAL gets the whole screen — not a toast', !D.getElementById('view-refused').hidden);
  ok('...and it is actually VISIBLE with the real CSS applied',
     disp(w, D.getElementById('view-refused')) !== 'none');
  ok('the sign-in form is NOT shown — we do not invite a login we will refuse',
     D.getElementById('view-signin').hidden);

  const t = D.getElementById('refused-body').textContent;
  ok('it cites the ACT, not a policy', t.includes('s.9(1)'));
  ok('it names the DIRECTOR conviction, because the risk is personal', t.includes('DIRECTOR was personally convicted'));
  ok('it says what STILL WORKS', t.includes('stores nothing'));
  ok('it says what we are DOING about it', t.includes('Registering with the PDPO'));
  ok('it sends them to the calculators, which need no account',
     D.querySelector('#refused-body a[href*="calculators"]') !== null);
  ok('and it says plainly this is NOT a bug',
     D.getElementById('refused-body').textContent.includes('not a bug'));

  // 🔴 The words that must NEVER appear.
  const lower = t.toLowerCase();
  ok('it does NOT say "something went wrong"', !lower.includes('something went wrong'));
  ok('it does NOT say "try again later"',      !lower.includes('try again later'));
  ok('it does NOT call itself an error',       !lower.includes('error occurred'));
}

// ═══════════════════════════════════════════════════════════════════════════
section('Signed out — the honest sign-in');
// ═══════════════════════════════════════════════════════════════════════════
{
  const { w, D } = boot((url) =>
    url.includes('/compliance') ? json(200, { canStoreYourData: true })
                                : json(401, { error: 'NOT_SIGNED_IN' }));
  await settle();
  ok('a signed-out user sees the sign-in screen', !D.getElementById('view-signin').hidden);
  ok('...and it is visible with CSS applied', disp(w, D.getElementById('view-signin')) !== 'none');
  // This test used to assert the OPPOSITE — "there is NO password field, Ugandans
  // have phones not password managers". That was a real design position, and it was
  // overtaken by a harder fact: the SMS gateway was never wired, so phone+OTP was a
  // door with no key and NOBODY COULD SIGN IN AT ALL. A principle you cannot ship is
  // not a principle. Email and password work today.
  ok('the password is a password field (never plain text on screen)',
     D.getElementById('password').type === 'password');
  ok('the password field is not autofilled with anything', D.getElementById('password').value === '');
  ok('it tells them what we do with their data, and that delete means delete',
     D.getElementById('view-signin').textContent.includes('delete means'));
  ok('...and it explains that we cannot read their password either',
     /hashed with scrypt/.test(D.getElementById('view-signin').textContent));
}

// ═══════════════════════════════════════════════════════════════════════════
section('🔑 The finding — your employer is over-deducting, because URA is wrong');
// ═══════════════════════════════════════════════════════════════════════════
{
  const PAY = {
    ok: true,
    months: [{
      period: '2026-07-01', employer: 'Acme Ltd', gross: 1_000_000,
      deducted: 254_750, shouldBe: 188_250, variance: 66_500,
      steps: [{ band: '0 – 335,000 @ 0%', amount: 335000, rate: 0, tax: 0 }],
      rule: { id: 'UG.PAYE.RESIDENT.2026', confidence: 'A', verifiedOn: '2026-07-11',
              source: { instrument: 'Income Tax (Amendment) Act 2026', provision: 'Schedule 4, Part I' } },
    }],
    finding: {
      kind: 'OVER_DEDUCTED', amount: 66_500, perMonth: 66_500,
      headline: 'Your employer has taken 66,500 more than the law requires, over 1 month(s).',
      why: "The PAYE bands changed on 1 July 2026. URA'S OWN PAYE RATES PAGE STILL PUBLISHES THE OLD BANDS.",
      whatYouDo: 'Show your payroll team the working below.',
      evidenceUrl: 'https://ura.go.ug/en/domestic-taxes/paye-rates/',
    },
  };
  const WHT = { ok: true, lines: [], credits: { withheld: 0, claimable: 0, atRisk: 0, certificatesHeld: 0, certificatesExpected: 0 }, finding: null };

  const { w, D } = boot((url) =>
      url.includes('/compliance')       ? json(200, { canStoreYourData: true })
    : url.includes('/payslips/check')   ? json(200, PAY)
    : url.includes('/invoices/credits') ? json(200, WHT)
    : url.includes('/me')               ? json(200, { ok: true, me: { id: 'x', memberSince: '2026-07-01' } })
    : json(200, { ok: true }));
  await settle();

  ok('the home screen shows the finding', !D.getElementById('view-home').hidden);
  const f = D.getElementById('findings').textContent;
  ok('...with the shilling figure, in the headline position', f.includes('66,500'));
  ok('...and it explains WHY: URA\'s own page is wrong', f.includes('URA'));
  ok('...and it is flagged as MONEY BACK, not as a problem', f.includes('money BACK'));
  ok('...and links to URA\'s own page so they can see for themselves',
     D.querySelector('#findings a[href*="ura.go.ug"]') !== null);

  // Click through to the working.
  click(w, D.querySelector('#findings [data-action="goPayslips"]'));
  await settle();
  ok('"Show me the working" opens the payslip view', !D.getElementById('view-payslips').hidden);
  const p = D.getElementById('out-payslips').textContent;
  ok('...showing what the law requires (188,250)', p.includes('188,250'));
  ok('...and what they actually took (254,750)',   p.includes('254,750'));
  ok('...and it CITES the gazetted Act',           p.includes('Income Tax (Amendment) Act 2026'));
}

// ═══════════════════════════════════════════════════════════════════════════
section('🔑 The Isaac finding — URA is holding money that belongs to you');
// ═══════════════════════════════════════════════════════════════════════════
{
  const WHT = {
    ok: true,
    lines: [
      { id: '1', date: '2026-03-01', client: 'Ministry of Health', amount: 30_000_000, withheld: 1_800_000, certificateHeld: true,  isFinalTax: false },
      { id: '2', date: '2026-05-01', client: 'Ministry of Works',  amount: 30_000_000, withheld: 1_800_000, certificateHeld: false, isFinalTax: false },
    ],
    credits: { withheld: 3_600_000, claimable: 1_800_000, atRisk: 1_800_000, certificatesHeld: 1, certificatesExpected: 2, certificatesMissing: 1 },
    finding: {
      headline: 'URA is holding 3,600,000 that belongs to you.',
      detail: 'Without the other 1, 1,800,000 of that is UNCLAIMABLE — and you will pay tax twice on the same income.',
      whatYouDo: 'Send the certificate request to every client in the list below.',
      chase: [{ id: '2', client: 'Ministry of Works', date: '2026-05-01', amount: 30_000_000, withheld: 1_800_000 }],
    },
    notes: ['This is NOT a cost. It is PREPAID TAX — a credit against your income tax.'],
  };
  const { w, D } = boot((url) =>
      url.includes('/compliance')       ? json(200, { canStoreYourData: true })
    : url.includes('/payslips/check')   ? json(200, { ok: true, months: [], finding: null })
    : url.includes('/invoices/credits') ? json(200, WHT)
    : json(200, { ok: true, me: { id: 'x', memberSince: '2026-07-01' } }));
  await settle();

  const f = D.getElementById('findings').textContent;
  ok('the home screen names the money at risk', f.includes('1,800,000'));
  ok('...and says you are about to pay tax TWICE', f.includes('pay tax twice'));

  click(w, D.querySelector('#findings [data-action="goWht"]'));
  await settle();
  const t = D.getElementById('out-wht').textContent;
  ok('the WHT view shows what URA holds — 3,600,000', t.includes('3,600,000'));
  ok('...how many certificates you hold (1 of 2)',   t.includes('1 of 2'));
  ok('...and exactly WHO to chase',                  t.includes('Ministry of Works'));
  ok('...and that WHT is PREPAID TAX, not a cost',   t.includes('PREPAID TAX'));
}

// ═══════════════════════════════════════════════════════════════════════════
section('An empty account is HONESTLY empty — no demo data, ever');
// ═══════════════════════════════════════════════════════════════════════════
// 🔴 THE ESSAY IS GONE. THE PRINCIPLE IS NOT.
//
// The old empty screen answered "nothing to show" with three paragraphs explaining
// why it was empty. That is not honesty — it is an apology, and a person who signed
// in to see their money does not want to read a manifesto. So the lecture went, and
// a dashboard took its place.
//
// But the rule it protected is the one that matters, and it is now tested HARDER:
// a tile with no data shows a DASH. Not a demo net worth. Not a sample runway. Not
// a plausible-looking figure to make the screen "feel alive" — because a product
// that shows you an invented number has taught you to distrust its real ones.
{
  const { w, D } = boot((url) =>
      url.includes('/compliance')       ? json(200, { ok: true, canStoreYourData: true })
    : url.includes('/payslips/check')   ? json(200, { ok: true, months: [], finding: null })
    : url.includes('/invoices/credits') ? json(200, { ok: true, lines: [], credits: { atRisk: 0 }, finding: null })
    : url.includes('/books/health')     ? json(200, { ok: true, balances: [], netWorth: {}, emergencyFund: { refused: true }, period: { count: 0 } })
    : url.includes('/books')            ? json(200, { ok: true, books: [] })
    : url.includes('/calendar')         ? json(200, { ok: true, calendar: { deadlines: [] } })
    : json(200, { ok: true, me: { id: 'x', kind: 'individual', memberSince: '2026-07-01' } }));
  await settle();
  await w.SelahActions.goHome(); await settle();

  const dash = D.getElementById('dash');
  const tiles = [...dash.querySelectorAll('.tile')];
  ok('the dashboard is a GRID of tiles, with icons', tiles.length === 4 && !!dash.querySelector('.ti'));

  const vals = tiles.map((t) => t.querySelector('.tv').textContent.trim());
  ok('🔴 every empty tile shows a DASH — not a demo figure, not a sample',
     vals.every((v) => v === '—'));
  ok('🔴 ...and there is no fabricated number anywhere on the dashboard',
     !/\d{1,3},\d{3}/.test(dash.textContent));
  ok('...but each one says what to do about it',
     /Add an account/.test(dash.textContent) && /Nothing recorded yet/.test(dash.textContent));

  ok('🔴 the ESSAY is gone — no manifesto where a number should be',
     !/should be|invented number has taught you/.test(D.getElementById('findings').textContent));
  ok('...and the findings area is simply empty, because there are no findings',
     D.getElementById('findings').textContent.trim() === '');
}

// ── AND WHEN THERE IS REAL DATA, THE TILES CARRY IT ────────────────────────
{
  const { w, D } = boot((url) =>
      url.includes('/compliance')       ? json(200, { ok: true, canStoreYourData: true })
    : url.includes('/payslips/check')   ? json(200, { ok: true, months: [], finding: null })
    : url.includes('/invoices/credits') ? json(200, { ok: true, lines: [], credits: { atRisk: 0 }, finding: null })
    : url.includes('/books/health')     ? json(200, { ok: true, balances: [],
        netWorth: { netWorth: 2_600_000, assets: 7_600_000, debts: 5_000_000, perCurrency: [{ currency: 'UGX' }] },
        emergencyFund: { months: 2.9, verdict: 'One shock away.' },
        period: { count: 7, net: 1_152_000, income: 2_100_000, spend: 948_000 } })
    : url.includes('/books')            ? json(200, { ok: true, books: [{ id: 'b1', name: 'Home' }] })
    : url.includes('/calendar')         ? json(200, { ok: true, calendar: { deadlines: [
        { label: 'PAYE return + remittance', prettyDue: '15 July 2026', countdown: 'in 3 days', urgency: 'now' }] } })
    : json(200, { ok: true, me: { id: 'x', kind: 'individual' } }));
  await settle();
  await w.SelahActions.goHome(); await settle();

  const dash = D.getElementById('dash').textContent;
  ok('net worth is on the dashboard', /2,600,000/.test(dash));
  ok('...and it says what you own and what you owe', /7,600,000/.test(dash) && /5,000,000/.test(dash));
  ok('this month is on the dashboard', /1,152,000/.test(dash));
  ok('the runway is on the dashboard, with its verdict', /2\.9/.test(dash) && /One shock away/.test(dash));
  ok('🔑 the next tax date is counted down — nobody in Uganda will remind you',
     /in 3 days/.test(dash) && /PAYE/.test(dash));

  ok('a tax date that is imminent is marked urgent, not neutral',
     !!D.querySelector('#dash .tile.bad'));
  ok('every tile is a way IN — one tap to the screen behind it',
     [...D.querySelectorAll('#dash .tile')].every((t) => t.dataset.action));
}

// ═══════════════════════════════════════════════════════════════════════════
section('Your data — the DPPA rights, in the product');
// ═══════════════════════════════════════════════════════════════════════════
{
  const { w, D } = boot((url) =>
      url.includes('/compliance')       ? json(200, { canStoreYourData: true })
    : url.includes('/me/audit')         ? json(200, { ok: true, statement: 'Everything anybody has done with your data.',
        entries: [
          { at: '2026-07-11T10:00:00Z', action: 'READ', entity: 'payslips', was_you: true,  ip: '1.2.3.4' },
          // 🔴 A read that was NOT the user. This is the row that matters, and the
          //    one almost no platform will ever show you.
          { at: '2026-07-11T11:00:00Z', action: 'READ', entity: 'payslips', was_you: false, ip: '9.9.9.9' },
        ] })
    : url.includes('/me')               ? json(200, { ok: true, me: { id: 'x', phone: '+256700123456', memberSince: '2026-07-01', yourDataWillBeDeletedAfter: '2033-07-01' } })
    : url.includes('/payslips/check')   ? json(200, { ok: true, months: [], finding: null })
    : json(200, { ok: true, lines: [], credits: { atRisk: 0 }, finding: null }));
  await settle();

  click(w, D.querySelector('[data-action="goData"]'));
  await settle();
  const t = D.getElementById('out-data').textContent;

  ok('it shows WHO HAS READ your data — almost no platform will', t.includes('Who has read your data'));
  ok('...and flags any read that was NOT you', D.getElementById('out-data').innerHTML.includes('NOT YOU'));
  ok('you can download everything we hold', D.querySelector('a[href="/api/me/export"]') !== null);
  ok('you can DELETE it', D.querySelector('[data-action="deleteMe"]') !== null);
  ok('...and it says delete means DELETE, not archive', t.includes('not "archive"'));
  ok('it shows the retention date, because a row past its date is unlawful processing', t.includes('2033-07-01'));
}

// ═══════════════════════════════════════════════════════════════════════════
section('The non-negotiables');
// ═══════════════════════════════════════════════════════════════════════════
{
  const src = fs.readFileSync(path.join(WEB, 'individual.html'), 'utf8');
  ok('no inline <script> — the CSP would refuse it',
     (src.match(/<script\b[^>]*>/g) || []).every((t) => /\bsrc=/.test(t)));
  ok('no on*= handlers — the CSP would refuse those too',
     !/\son(click|input|change|submit)\s*=/.test(src));

  // 🔴 STRIP THE COMMENTS FIRST. api.js EXPLAINS, in a comment, why it must not
  //    call http://localhost:3000 — and my first version of this check read that
  //    explanation as the offence. That is the third time this week a guard has
  //    cried wolf at my own prose. A guard that cannot tell a rule from a remark
  //    about the rule is a guard that gets switched off.
  const apiCode = fs.readFileSync(path.join(WEB, 'assets/api.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  ok('the API is called SAME-ORIGIN — our own connect-src \'self\' would block anything else',
     apiCode.includes("const BASE = '/api'") && !apiCode.includes('localhost:3000'));

  const nginx = fs.readFileSync(path.join(WEB, '..', 'nginx.conf'), 'utf8');
  ok('nginx proxies /api, so the CSP never has to be weakened', nginx.includes('proxy_pass http://api:3000'));
  ok('...and NOTHING carrying a person\'s data is cached', /location \/api\/[\s\S]*?no-store/.test(nginx));
}

console.log('\n' + '═'.repeat(60));

// ═══════════════════════════════════════════════════════════════════════════
section('THE TAX CALENDAR — the screen that breaks the silence');

// The real engine computes these. We call it, rather than hand-typing dates into
// a fixture — because a fixture is a place where a wrong date can hide, and the
// whole point of this module is that a wrong date is a 2%-per-month wound.
const CALENG = require('../engine/calendar');

const soleProfile = { kind: 'individual', hasNonEmploymentIncome: true, filesIncomeTax: true,
                      employsPeople: false, isWithholdingAgent: false, vatRegistered: false };

function calFetch(overrides) {
  const o = overrides || {};
  return (url, opts) => {
    const m = String(opts && opts.method || 'GET');
    if (url === '/api/calendar') {
      if (o.status) return json(o.status, o.body || {});
      return json(200, {
        ok: true,
        profile: o.profile || soleProfile,
        calendar: o.calendar || CALENG.upcoming(o.profile || soleProfile, '2026-07-12', 12),
        directors: o.directors || [],
        directorTrap: o.trap === undefined ? null : o.trap,
      });
    }
    if (url === '/api/calendar/profile' && m === 'PUT') { o.saved = o.saved || []; o.saved.push(JSON.parse(opts.body)); return json(200, { ok: true }); }
    return json(200, { ok: true });
  };
}

{
  const { w, D } = boot(calFetch({}));
  await settle();                    // let the page finish its OWN startup first
  await w.SelahActions.goCalendar(); await settle();

  ok('the calendar view is the one on screen (and CSS agrees)',
     disp(w, D.getElementById('view-calendar')) !== 'none' && disp(w, D.getElementById('view-home')) === 'none');

  const text = D.getElementById('cal-list').textContent;

  ok('🔴 the first provisional instalment shown is 30 SEPTEMBER 2026, not 31 March',
     /30 September 2026/.test(text) && !/31 March 2027[\s\S]*30 September 2026/.test(text));

  ok('the return for the year of income that JUST ENDED is on the screen (31 Dec 2026)',
     /31 December 2026/.test(text) && /Income tax return/.test(text));

  ok('every deadline carries what it costs to miss it — not just a date',
     /2% per month/.test(text));

  ok('obligations falling on the SAME DAY are grouped into one card',
     D.querySelectorAll('#cal-list .card').length < 12);

  ok('the source and confidence of the law are printed on the screen',
     /Cap. 338/.test(D.getElementById('cal-src').textContent) &&
     /confidence A/.test(D.getElementById('cal-src').textContent));

  ok('🔴 the page says out loud that we do NOT know the weekend/holiday rule',
     /Saturday, Sunday or public holiday/.test(D.getElementById('cal-cannot').textContent));
}

// ─── NOT ASKING IS NOT THE SAME AS "NO" ────────────────────────────────────
{
  const unasked = { kind: 'individual', filesIncomeTax: true };   // side income NEVER ASKED
  const o = { profile: unasked, calendar: CALENG.upcoming(unasked, '2026-07-12', 12) };
  const { w, D } = boot(calFetch(o));
  await settle();                    // let the page finish its OWN startup first
  await w.SelahActions.goCalendar(); await settle();

  ok('🔴 an unasked question is SHOWN as unasked, not silently treated as "no"',
     D.getElementById('cal-unasked').hidden === false);

  ok('...and the question names the most-missed tax in Uganda',
     /Rent, consultancy, a side business/.test(D.getElementById('cal-questions').textContent));

  // The FIRST unasked question is not necessarily the one we care about — an
  // individual is also unasked about PAYE, VAT and WHT. Click the one that matters.
  const yes = D.querySelector('[data-action="calYes"][data-key="prov_ind"]');
  ok('the unasked provisional-tax question is answerable with one click', !!yes);

  click(w, yes); await settle();
  ok('answering "yes" SAVES the answer to the profile (hasNonEmploymentIncome=true)',
     (o.saved || []).some((x) => x.hasNonEmploymentIncome === true));
}

// ─── THE DIRECTOR TRAP ─────────────────────────────────────────────────────
{
  const trap = CALENG.directorTrap([
    { name: 'A. Passive', personalReturnsFiled: false },
    { name: 'B. Active',  personalReturnsFiled: true },
  ]);
  const { w, D } = boot(calFetch({ trap, profile: { kind: 'entity', filesIncomeTax: true } }));
  await settle();                    // let the page finish its OWN startup first
  await w.SelahActions.goCalendar(); await settle();

  const t = D.getElementById('cal-trap');
  ok('🔑 the director trap is rendered for a company', t.hidden === false);
  ok('...and it says plainly that the company TCC is BLOCKED', /BLOCKS THE COMPANY/i.test(t.textContent));
  ok('...and it explains WHY the company cannot see this in its own books',
     /IT IS NOT IN YOUR BOOKS/.test(t.textContent));
  ok('...and a blocked company gets the refusal styling, not a neutral card',
     !!t.querySelector('.card.refuse'));
}

{
  // The dangerous case: we do not know. "We do not know" must never render as "fine".
  const trap = CALENG.directorTrap([{ name: 'A. Unknown', personalReturnsFiled: null }]);
  const { w, D } = boot(calFetch({ trap, profile: { kind: 'entity', filesIncomeTax: true } }));
  await settle();                    // let the page finish its OWN startup first
  await w.SelahActions.goCalendar(); await settle();
  const t = D.getElementById('cal-trap').textContent;
  ok('🔴 an UNKNOWN director is not reported to the user as a clean one',
     /do not know/i.test(t) && !/No director is currently blocking/.test(t));
}

{
  // A company with NO directors listed: the engine refuses. The screen must carry it.
  const trap = CALENG.directorTrap([]);
  const { w, D } = boot(calFetch({ trap, profile: { kind: 'entity', filesIncomeTax: true } }));
  await settle();                    // let the page finish its OWN startup first
  await w.SelahActions.goCalendar(); await settle();
  ok('🔴 with no directors listed, the screen REFUSES rather than reassures',
     /will not return|cannot be run on a company|only be run on PEOPLE/i.test(D.getElementById('cal-trap').textContent));
}

// ─── THE GATE, ON THIS SCREEN TOO ──────────────────────────────────────────
{
  const { w, D } = boot(calFetch({ status: 451, body: {
    ok: false, refused: true,
    headline: 'We will not store your data, because we are not yet allowed to.',
    why: ['Uganda\'s Data Protection and Privacy Act makes financial data special personal data.'],
    whatYouCanDoNow: ['Every calculator on this site still works, and stores nothing.'],
  } }));
  await settle();                    // let the page finish its OWN startup first
  await w.SelahActions.goCalendar(); await settle();

  ok('🔴 a 451 on the calendar shows the REFUSAL screen, not a red error toast',
     disp(w, D.getElementById('view-refused')) !== 'none' &&
     disp(w, D.getElementById('view-calendar')) === 'none');
  ok('...and the refusal explains the law, rather than blaming the user',
     /not yet allowed to/.test(D.getElementById('refused-body').textContent));
}

// ─── THE DOOR ──────────────────────────────────────────────────────────────
{
  const { w, D } = boot(calFetch({}));
  // 🔴 SCOPED TO THE HOME VIEW. The new nav bar ALSO has a data-action="goCalendar"
  //    button, and it appears earlier in the DOM — so an unscoped querySelector now
  //    grabs the NAV ITEM, not the tile. The test was right to break: the selector
  //    was ambiguous the moment two things could do the same job.
  const door = D.querySelector('#view-home [data-action="goCalendar"]');
  ok('the home screen has a door to the calendar', !!door);
  ok('...and it says why it matters: Uganda sends no reminder',
     /no reminder|No letter, no SMS/i.test(door.textContent));
}



// ═══════════════════════════════════════════════════════════════════════════
section('🔴 A VALID SESSION IS NOT THE RIGHT SESSION (the mirror of organisation.html)');
{
  // A COMPANY account, on the PERSONAL page. The session is valid. Every endpoint
  // would answer. The screens would render — with the COMPANY's figures under
  // headings that say "your payslip" and "your money". Nothing would look broken.
  const meFetch = (url) => {
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
    if (url === '/api/me') return json(200, { ok: true, me: { id: 'c1', kind: 'entity' } });
    return json(200, { ok: true });
  };
  const { w, D } = boot(meFetch);
  await settle();

  ok('🔴 a COMPANY account is NOT shown the personal screens',
     disp(w, D.getElementById('view-home')) === 'none');
  ok('...and it is told plainly that this is a company account',
     /This is a company account/.test(D.getElementById('signin-msg').textContent));
  ok('...and it is pointed at the organisations page',
     !!D.querySelector('#signin-msg a[href="organisation.html"]'));
}



// ═══════════════════════════════════════════════════════════════════════════
section('🔴 FAIL CLOSED — no unexpected response may open the private screens');
// This is the bug that reached the user. The build failed, so the running image had
// no /api proxy; nginx answered /api/me with a plain 404; boot() handled `refused`,
// `offline` and `signedOut` and fell through to renderHome() for EVERYTHING ELSE.
// The signed-in home screen was shown to a stranger. Not a crash — the product,
// working, wide open. Each case below is a door that was standing open.
{
  const cases = [
    ['a 404 — the API is not proxied at all (the exact production failure)', () => json(404, {})],
    ['a 500 — the API threw',                                                () => json(500, { error: 'boom' })],
    ['a 502 — the API container is down',                                    () => json(502, {})],
    ['a 200 with NO `me` object — a truthy body that proves nothing',        () => json(200, { ok: true })],
    ['a 200 with an empty `me` — no id, no identity',                        () => json(200, { ok: true, me: {} })],
    ['a 200 that is not even JSON',                                          () => Promise.resolve({ status: 200, ok: true, json: () => Promise.reject(new Error('not json')) })],
  ];

  for (const [name, meRes] of cases) {
    const f = (url) => {
      if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
      if (url === '/api/me') return meRes();
      return json(200, { ok: true });
    };
    const { w, D } = boot(f);
    await settle();
    ok(`🔴 ${name} → SIGN-IN, never the home screen`,
       disp(w, D.getElementById('view-home')) === 'none' &&
       disp(w, D.getElementById('view-signin')) !== 'none');
  }
}



// ═══════════════════════════════════════════════════════════════════════════
section('🔴 NOTHING MAY FAIL SILENTLY — a blank message looks exactly like a hang');
// This is the bug that reached the user. `speak()` built its message out of
// headline/why/whatYouCanDoNow — which every refusal WE author has, and which a
// 500, a database error, a missing migration and a proxy timeout do NOT. In every
// one of those cases it rendered an EMPTY STRING. The user clicked "Create my
// account" and the software said NOTHING. Not an error — a silence. And silence
// gives a person no way to tell "still working" from "broken" from "my fault".
{
  const silent = [
    ['a 500 with an empty body',            () => json(500, {})],
    ['a 500 with an unstructured error',    () => json(500, { ok: false, error: 'SERVER_ERROR' })],
    ['a 502 from a dead API container',     () => json(502, {})],
    ['a 400 with no words in it',           () => json(400, { ok: false })],
    ['a 200 that is not even JSON',         () => Promise.resolve({ status: 500, ok: false, json: () => Promise.reject(new Error('nope')) })],
  ];

  for (const [name, resp] of silent) {
    const f = (url) => {
      if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
      if (url === '/api/me') return json(401, { ok: false });
      if (url === '/api/auth/register') return resp();
      return json(200, { ok: true });
    };
    const { w, D } = boot(f);
    await settle();
    w.SelahActions.showRegister();
    D.getElementById('r-email').value = 'a@b.com';
    D.getElementById('r-password').value = 'a decent long password';
    await w.SelahActions.register(); await settle();

    const msg = D.getElementById('signin-msg').textContent.trim();
    ok(`🔴 ${name} → the user is TOLD something (not left staring at silence)`, msg.length > 20);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
section('CREATING AN ACCOUNT SIGNS YOU IN — you typed the password four seconds ago');
{
  const calls = [];
  let signedIn = false;
  const f = (url, init) => {
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
    if (url === '/api/me') return signedIn
      ? json(200, { ok: true, me: { id: 'u1', kind: 'individual' } })
      : json(401, { ok: false });
    if (url === '/api/auth/register') { calls.push(['register', JSON.parse(init.body)]); return json(200, { ok: true, created: true, checkYourEmail: true }); }
    if (url === '/api/auth/login')    { calls.push(['login',    JSON.parse(init.body)]); signedIn = true; return json(200, { ok: true, kind: 'individual' }); }
    return json(200, { ok: true, calendar: { deadlines: [] }, directors: [], directorTrap: null });
  };
  const { w, D } = boot(f);
  await settle();

  w.SelahActions.showRegister();
  D.getElementById('r-email').value = 'new@example.com';
  D.getElementById('r-password').value = 'a decent long password';
  await w.SelahActions.register(); await settle();

  ok('registering immediately signs you in — no second password prompt',
     calls.map((c) => c[0]).join(',') === 'register,login');
  ok('...as the SAME kind of account the door registered', calls[1][1].kind === 'individual');
  ok('...and you land on the signed-in screen, not back on the form',
     disp(w, D.getElementById('view-home')) !== 'none' &&
     disp(w, D.getElementById('view-signin')) === 'none');
  ok('🔴 ...and the password is gone from the DOM',
     D.getElementById('r-password').value === '' && D.getElementById('password').value === '');
}



// ═══════════════════════════════════════════════════════════════════════════
section('🔴 THE API IS DOWN — a different fact from the API refusing');
{
  const f = (url) => {
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
    if (url === '/api/me') return json(401, { ok: false });
    if (url === '/api/auth/register') return json(502, {});     // nginx, no body
    return json(200, { ok: true });
  };
  const { w, D } = boot(f);
  await settle();
  w.SelahActions.showRegister();
  D.getElementById('r-email').value = 'a@b.com';
  D.getElementById('r-password').value = 'a decent long password';
  await w.SelahActions.register(); await settle();

  const msg = D.getElementById('signin-msg').textContent;
  ok('a 502 says the SERVER IS NOT ANSWERING — not "no reason given"',
     /not answering/i.test(msg));
  ok('...and says plainly that nothing was saved and nothing was lost',
     /nothing has been lost/i.test(msg));
  ok('...and does not blame the user or tell them to keep trying forever',
     /our failure, not yours/i.test(msg));
}



{
  // 🔴 The API's OWN 503 must not be mistaken for the API being down. It answered,
  // at length, on purpose — and its words are the most honest ones we have.
  const f = (url) => {
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
    if (url === '/api/me') return json(401, { ok: false });
    if (url === '/api/auth/forgot') return json(503, {
      ok: false, error: 'MAIL_NOT_CONFIGURED',
      headline: 'We cannot reset your password, because we cannot send you an email.',
      why: ['No mail provider is configured on this server.'] });
    return json(200, { ok: true });
  };
  const { w, D } = boot(f);
  await settle();
  w.SelahActions.showForgot();
  D.getElementById('f-email').value = 'a@b.com';
  await w.SelahActions.forgot(); await settle();

  const msg = D.getElementById('signin-msg').textContent;
  ok('🔴 our OWN 503 keeps its own words — it is not replaced by "the API is down"',
     /cannot send you an email/i.test(msg) && !/not answering/i.test(msg));
}



// ═══════════════════════════════════════════════════════════════════════════
section('📕 BOOKS — the screen that refuses to add up a draft');

const ENG = require('../engine/books');

/** A month drafted from a template: salary 2.5m in, rent 800k out. Nothing confirmed. */
const DRAFTED = ENG.stage({ cadence: 'monthly', lines: [
  { id: 'l1', direction: 'in',  label: 'Salary', amount: 2_500_000 },
  { id: 'l2', direction: 'out', label: 'Rent',   amount: 800_000 },
]}, '2026-07-01').entries.map((e, i) => ({ ...e, id: 'e' + i }));

function booksFetch(o) {
  const opts = o || {};
  return (url, init) => {
    const m = String((init && init.method) || 'GET');
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
    if (url === '/api/me')         return json(200, { ok: true, me: { id: 'u1', kind: 'individual' } });
    if (url === '/api/books')      return json(200, { ok: true, books: opts.books || [{ id: 'b1', name: 'Home', isDefault: true, kind: 'personal', currency: 'UGX' }] });
    if (/\/categories$/.test(url) && m === 'GET') return json(200, { ok: true, categories: opts.categories || [
      { id: 'c1', key: 'rent',        label: 'Rent',        direction: 'out' },
      { id: 'c2', key: 'food',        label: 'Food',        direction: 'out' },
      { id: 'c3', key: 'school_fees', label: 'School fees', direction: 'out', lumpy: true },
      { id: 'c4', key: 'salary',      label: 'Salary',      direction: 'in' },
    ] });
    if (/\/period\?/.test(url)) {
      const entries = opts.entries || DRAFTED;
      const q = url.split('?')[1] || '';
      const from = (q.match(/from=([^&]+)/) || [])[1] || '';
      const to = (q.match(/to=([^&]+)/) || [])[1] || '';
      const now = new Date().toISOString().slice(0,10);
      const state = to && to < now.slice(0,7)+'-01' ? 'past' : from && from > now ? 'future' : 'current';
      opts.lastWindow = { from, to, state };
      return json(200, {
        ok: true, from, to, month: { from, to, state },
        summary: ENG.summarise(entries),
        entries,
        budget: opts.budget || { rows: [], budgetsExcluded: [], howBudgetsWereCounted: 'x' },
        budgets: opts.budgets || [],
        accounts: opts.accounts || [{ id: 'a1', name: 'Stanbic', type: 'bank', scope: 'personal' }, { id: 'a2', name: 'MTN MoMo', type: 'mobile_money', scope: 'personal' }],
        goals: opts.periodGoals || [],
        budgetItems: opts.budgetItems || {},
      });
    }
    if (/\/categories\/[^/]+$/.test(url) && m === 'PATCH')  { opts.renamed = JSON.parse(init.body); return json(200, { ok: true }); }
    if (/\/categories\/[^/]+$/.test(url) && m === 'DELETE')  { opts.deleted = url; return json(200, { ok: true, entriesUncategorised: 3, note: '3 transactions used this category. They are still there, and they still count.' }); }
    if (/\/categories$/.test(url) && m === 'POST')            { opts.added = JSON.parse(init.body); return json(200, { ok: true, id: 'c9', key: 'school_run' }); }
    if (/\/confirm$/.test(url)) { opts.confirmed = JSON.parse(init.body); return json(opts.confirmStatus || 200, opts.confirmResponse || { ok: true }); }
    if (/did-not-arrive$/.test(url)) { opts.missed = true; return json(200, { ok: true, kept: true }); }
    if (/\/entries$/.test(url) && m === 'POST') { opts.entryPosted = JSON.parse(init.body); return json(200, { ok: true, id: 'e1' }); }
    if (/\/budget-items$/.test(url) && m === 'POST') { opts.biAdded = JSON.parse(init.body); return json(200, { ok: true, id: 'bi9' }); }
    if (/\/budget-items\/[^/]+\/to-shopping$/.test(url) && m === 'POST') { opts.biToShop = url; return json(200, { ok: true, listId: 'l1', itemId: 'si1' }); }
    if (/\/budget-items\/[^/]+$/.test(url) && m === 'DELETE') { opts.biDeleted = url; return json(200, { ok: true }); }
    if (/\/budgets\/[^/]+$/.test(url) && m === 'DELETE') { opts.budgetDeleted = url; return json(200, { ok: true }); }
    if (/\/values$/.test(url) && m === 'GET') return json(200, { ok: true, items: opts.trackedItems || [] });
    if (/\/values$/.test(url) && m === 'POST') { opts.recorded = JSON.parse(init.body); return json(200, { ok: true, id: 'v1', itemKey: opts.recorded.itemKey }); }
    if (/\/shopping$/.test(url) && m === 'GET')  return json(200, { ok: true, lists: opts.shoppingLists || [], forecast: opts.forecast });
    if (/\/shopping$/.test(url) && m === 'POST') { opts.listAdded = JSON.parse(init.body); return json(200, { ok: true, id: 'sl1' }); }
    if (/\/shopping\/[^/]+\/items\/[^/]+\/done$/.test(url) && m === 'POST') { opts.shopDone = JSON.parse(init.body); return json(opts.shopDoneStatus || 200, opts.shopDoneResponse || { ok: true, entryId: 'e9', total: 6000 }); }
    if (/\/shopping\/[^/]+\/items\/[^/]+$/.test(url) && m === 'DELETE') { opts.shopItemDeleted = url; return json(200, { ok: true }); }
    if (/\/shopping\/[^/]+\/items$/.test(url) && m === 'POST') { opts.shopItemAdded = JSON.parse(init.body); return json(200, { ok: true, id: 'si1' }); }
    if (/\/shopping\/[^/]+\/items\/[^/]+\/undo$/.test(url) && m === 'POST') { opts.shopUndone = url; return json(200, { ok: true }); }
    if (/\/shopping\/[^/]+\/items\/[^/]+$/.test(url) && m === 'PATCH') { opts.shopItemEdited = JSON.parse(init.body); return json(200, { ok: true }); }
    if (/\/shopping\/[^/]+$/.test(url) && m === 'DELETE') { opts.listDeleted = url; return json(200, { ok: true }); }
    if (/\/shopping\/[^/]+$/.test(url) && m === 'PATCH') { opts.listRenamed = JSON.parse(init.body); return json(200, { ok: true }); }
    if (/\/forecast$/.test(url)) return json(200, opts.forecast || { ok: true, comingUp: { items: [] }, suggestedBudget: { lines: [], lumpy: [] } });
    if (/\/books\/accounts\/[^/]+$/.test(url) && m === 'PATCH') { opts.accountEdited = JSON.parse(init.body); return json(200, { ok: true }); }
    if (/\/health$/.test(url))   return json(200, opts.health || { ok: true, balances: [], netWorth: {}, emergencyFund: {}, savingsRate: {} });
    if (/\/savings(\?|$)/.test(url))  return json(200, opts.savings || { ok: true, totalSaved: 0 });
    if (/accounts\/mine$/.test(url)) return json(200, opts.mine || { ok: true, accounts: [], types: { cash: { label: 'Cash' } } });
    if (/\/savings\/goals$/.test(url) && m === 'POST') { opts.goalAdded = JSON.parse(init.body); return json(200, { ok: true, id: 'g1' }); }
    if (/\/savings\/goals\/[^/]+\/contribute$/.test(url) && m === 'POST') { opts.contributed = JSON.parse(init.body); return json(200, { ok: true, id: 'e5' }); }
    if (/\/savings\/goals\/[^/]+$/.test(url) && m === 'DELETE') { opts.goalDeleted = url; return json(200, { ok: true }); }
    return json(200, { ok: true });
  };
}

{
  const { w, D } = boot(booksFetch({}));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  ok('the Books screen lists your Books', /Home/.test(D.getElementById('bk-books').textContent));

  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  const drafts = D.getElementById('bk-drafts').textContent;
  ok('a drafted month is SHOWN in full', /Salary/.test(drafts) && /Rent/.test(drafts));
  ok('...and it says plainly that these have NOT happened',
     /have <strong>not<\/strong> happened|have not happened/i.test(D.getElementById('bk-drafts').innerHTML));

  // 🔴 THE TEST. Every other budgeting app says this person has 1,700,000 left.
  // The summary is a STAT GRID now, not prose. Read the VALUES, not the sentence —
  // the wording may change; "nobody has been paid, so the total is zero" may not.
  const stats = {};
  D.querySelectorAll('#bk-summary .stat').forEach((el) => {
    stats[el.querySelector('.k').textContent.trim()] = el.querySelector('.v').textContent.trim();
  });
  ok('🔴 THE TOTALS READ ZERO — nobody has been paid, and the app does not pretend otherwise',
     stats['Income'] === '0' && stats['Expense'] === '0' && stats['Net'] === '0');
  ok('🔴 ...and 2,500,000 appears in NO confirmed figure',
     Object.values(stats).every((v) => !/2,500,000|1,700,000/.test(v)));

  // 🔑 the forecast (unconfirmed/expected) now lives with the plan, on the Budget tab —
  //    NOT on the actual-month summary. The month view is what really happened.
  const sum = D.getElementById('bk-summary').textContent;
  ok('🔴 the month summary carries NO forecast — only what is confirmed', !/it is not money/i.test(sum));
  const draftsForecast = D.getElementById('bk-drafts').textContent;
  ok('the unconfirmed money is shown with the plan (Budget tab), named a forecast',
     /unconfirmed line/.test(draftsForecast) && /it is not money/i.test(draftsForecast));

  // 🔴 NO ACCOUNT IS PRE-SELECTED. The UI may suggest; it may not select.
  const picker = D.querySelector('[data-draft-acct]');
  ok('🔴 no account is pre-selected on a draft — a tapped-through guess puts your rent in the wrong pocket',
     picker.value === '');
}

// ── CONFIRMING WITHOUT AN ACCOUNT IS REFUSED, AND THE REFUSAL IS SHOWN ──────
{
  const o = { confirmStatus: 400, confirmResponse: {
    ok: false, refused: true, question: 'Which account did this money touch?',
    because: 'Your balances are worked out from these entries.',
    weWillNot: 'We will not guess. A guessed account puts your rent in the wrong pocket.',
  } };
  // a refusal from the engine comes back as `refused` — the page must SHOW it
  const f = booksFetch(o);
  const { w, D } = boot((url, init) => {
    if (/\/categories\/[^/]+$/.test(url) && m === 'PATCH')  { opts.renamed = JSON.parse(init.body); return json(200, { ok: true }); }
    if (/\/categories\/[^/]+$/.test(url) && m === 'DELETE')  { opts.deleted = url; return json(200, { ok: true, entriesUncategorised: 3, note: '3 transactions used this category. They are still there, and they still count.' }); }
    if (/\/categories$/.test(url) && m === 'POST')            { opts.added = JSON.parse(init.body); return json(200, { ok: true, id: 'c9', key: 'school_run' }); }
    if (/\/confirm$/.test(url)) { o.confirmed = JSON.parse(init.body); return json(400, { ok: false, headline: 'Which account did this money touch?', why: ['We will not guess.'] }); }
    return f(url, init);
  });
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkConfirm(D.querySelector('[data-action="bkConfirm"]')); await settle();

  ok('🔴 confirming with no account shows the REFUSAL — it is not swallowed',
     /Which account did this money touch/.test(D.getElementById('bk-drafts').textContent));
}

// ── "IT DID NOT COME" ──────────────────────────────────────────────────────
{
  const missed = DRAFTED.map((e) => (e.label === 'Salary' ? ENG.markDidNotArrive(e, 'Employer paid late') : e));
  const { w, D } = boot(booksFetch({ entries: missed }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  const sum = D.getElementById('bk-summary').textContent;
  ok('🔑 "did not come" is on the screen, with the amount', /Did not come: 2,500,000/.test(sum));
  ok('🔑 ...and it says WHY we keep it', /fact destroyed/.test(sum));
  const st = {};
  D.querySelectorAll('#bk-summary .stat').forEach((el) => { st[el.querySelector('.k').textContent.trim()] = el.querySelector('.v').textContent.trim(); });
  ok('🔴 ...and the income still reads ZERO', st['Income'] === '0');
}

// ── 🔴 THE SCHOOL FEES LINE ────────────────────────────────────────────────
{
  const budget = {
    rows: [{ category: 'rent', budgeted: 800_000, spent: 850_000, over: true, overBy: 50_000, unplanned: false }],
    budgetsExcluded: [{ category: 'school_fees', amount: 1_200_000, startsOn: '2026-05-01', endsOn: '2026-08-31' }],
    whyExcluded: 'A school-fees budget is not one-third of a term each month.',
    howBudgetsWereCounted: 'We SUMMED the budgets that fall entirely inside this window. Nothing was divided, averaged or spread.',
    unplannedSpending: 0,
  };
  const { w, D } = boot(booksFetch({ budget, budgets: [{ id: 'g1', category: 'rent', amount: 800_000, startsOn: '2026-07-01', endsOn: '2026-07-31' }] }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkTab(D.querySelector('[data-tab="budget"]')); await settle();

  const b = D.getElementById('bk-budget').textContent;
  ok('🔴 the school-fees budget is shown as NOT COUNTED in this window', /Not counted in this window/.test(b));
  ok('🔴 ...and the page says a term is not one-third per month', /not one-third of a term each month/.test(b));
  ok('...and states that nothing was divided or averaged', /Nothing was divided, averaged or spread/.test(b));
  ok('going over budget is named, with the amount, on the SAVED row', /over by 50,000/i.test(b));
}

// ── 🔑 THE GAS CYLINDER, ON SCREEN ─────────────────────────────────────────
{
  const forecast = { ok: true,
    comingUp: { items: [{ label: 'Gas', category: 'transport', nextDue: '2026-07-16', daysAway: 4, overdue: false,
      typicalAmount: 90_000, says: 'You buy this about every 51 days. Last on 2026-05-26 — next around 2026-07-16.' }],
      notEnoughHistory: [], whatThisCannotSee: ['A funeral. A school term.'] },
    suggestedBudget: { lines: [{ category: 'rent', suggested: 800_000, working: 'Over 6 months you spent 4,800,000.' }],
      lumpy: [{ category: 'school_fees', budgetItAs: 'About 1,200,000, around 2026-09-07.',
        why: 'Spreading it evenly would put 591,667 a month in your budget, and that figure would have been WRONG IN EVERY ONE OF THOSE MONTHS.' }],
      thisIsASuggestion: 'This is a SUGGESTED BUDGET, not a plan and certainly not money.',
      whatThisCannotSee: ['A school term starting. A funeral.'] } };

  const o = { forecast };
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkForecast(); await settle();

  const f = D.getElementById('bk-forecast').textContent;
  ok('🔑 "when do I next refill gas?" is answered on screen', /Gas/.test(f) && /2026-07-16/.test(f));
  ok('🔑 ...with its working: every 51 days', /every 51 days/.test(f));
  ok('🔴 the school fees lump is NOT in the monthly budget lines', !/school_fees.*800,000/.test(f));
  ok('🔴 ...it is shown as "does NOT happen every month", dated and sized',
     /do NOT happen every month/i.test(f) && /About 1,200,000, around/.test(f));
  ok('🔴 ...and says averaging it would have been wrong in every month', /WRONG IN EVERY ONE OF THOSE MONTHS/.test(f));
  ok('the forecast announces itself as a SUGGESTION, not money', /not a plan and certainly not money/.test(f));
  ok('...and says what it cannot see', /funeral/i.test(f));

  // 🔑 an expected item can be added to the budget, in its own category
  const addBtn = D.querySelector('#bk-forecast [data-action="fcToBudget"]');
  ok('🔑 an expected item offers "Add to budget"', !!addBtn && addBtn.dataset.cat === 'transport');
  await w.SelahActions.fcToBudget(addBtn); await settle();
  ok('🔑 adding it POSTs a planned item under the right category', o.biAdded && o.biAdded.category === 'transport' && o.biAdded.name === 'Gas' && o.biAdded.estimate === 90000);
}

// ── 🔴 TWO CURRENCIES, NO RATE → NO SINGLE NET WORTH ───────────────────────
{
  const health = { ok: true, balances: [],
    netWorth: { netWorth: null, perCurrency: [
        { currency: 'UGX', formatted: 'UGX 2,500,000' }, { currency: 'USD', formatted: '$ 200.00' }],
      combined: { available: false,
        because: 'You hold UGX and USD. There is no true single total without an exchange rate.',
        weWillNot: 'We will not pick a rate for you and put the result at the top of your screen in the biggest font on the page.' },
      accountsNeverReconciled: [], thisIsNotObserved: 'Computed from what you recorded.' },
    emergencyFund: { refused: true, because: 'No confirmed spending yet.' },
    savingsRate: {} };

  const { w, D } = boot(booksFetch({ health }));
  await settle();
  await w.SelahActions.goAccounts(); await settle();

  const h = D.getElementById('ac-health').textContent;
  ok('🔴 holding UGX and USD with no rate → NO single net worth figure is printed',
     /more than one currency/.test(h) && !/Net worth\s*0/.test(h));
  ok('🔴 ...and it says why we will not invent a rate', /biggest font on the page/.test(h));
  ok('...and shows BOTH true totals instead', /UGX 2,500,000/.test(h) && /\$ 200\.00/.test(h));
}

// ── 🔑 RECONCILIATION ON SCREEN ────────────────────────────────────────────
{
  const health = { ok: true,
    balances: [{ accountId: 'a1', name: 'Cash', type: 'cash', currency: 'UGX', computed: 180_000, liquid: true, scope: 'personal', impossible: false }],
    netWorth: { netWorth: 180_000, assets: 180_000, debts: 0, accountsNeverReconciled: [], perCurrency: [] },
    emergencyFund: { refused: true, because: 'x' }, savingsRate: {} };

  const { w, D } = boot((url, init) => {
    if (/reconcile$/.test(url)) return json(200, { ok: true, reconciliation: {
      headline: '85,000 left this account and was never recorded.',
      whatThisMeans: 'This is not a bug in the app. It is spending that never got written down — airtime, boda, the small things.',
      matches: false } });
    return booksFetch({ health })(url, init);
  });
  await settle();
  await w.SelahActions.goAccounts(); await settle();

  D.querySelector('[data-rec="a1"]').value = '95000';
  await w.SelahActions.acReconcile(D.querySelector('[data-action="acReconcile"]')); await settle();

  const r = D.getElementById('rec-a1').textContent;
  ok('🔑 the reconciliation gap is NAMED on screen', /85,000 left this account and was never recorded/.test(r));
  ok('🔑 ...and explained as the honest answer to "where does my money go?"', /airtime, boda/.test(r));
}



// ═══════════════════════════════════════════════════════════════════════════
section('🧭 FINDING YOUR WAY — the app was unnavigable, and that is a bug');
{
  const { w, D } = boot(booksFetch({}));
  await settle();

  const nav = D.getElementById('appnav');
  ok('a signed-in person always has a nav bar on screen', disp(w, nav) !== 'none');
  ok('...with the places they can actually go',
     [...nav.querySelectorAll('[data-nav]')].map((b) => b.dataset.nav).join(',') === 'home,books,accounts,calendar,data');

  const lit = () => [...nav.querySelectorAll('.active')].map((b) => b.dataset.nav).join(',');
  ok('🔑 it says WHERE YOU ARE — home is lit on the home screen', lit() === 'home');

  await w.SelahActions.goBooks(); await settle();
  ok('...and Books is lit on the Books screen', lit() === 'books');

  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  ok('🔑 ...and a screen INSIDE Books still says BOOKS — you are never lost', lit() === 'books');

  await w.SelahActions.goAccounts(); await settle();
  ok('...and Accounts is lit on Accounts', lit() === 'accounts');
}

{
  // Signed out: no nav. There is nowhere to go.
  const f = (url) => {
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
    if (url === '/api/me') return json(401, { ok: false });
    return json(200, { ok: true });
  };
  const { w, D } = boot(f);
  await settle();
  ok('a signed-OUT visitor gets no app nav', disp(w, D.getElementById('appnav')) === 'none');
}

// ── 🔑 AN EMPTY APP MUST TELL YOU WHAT TO DO ──────────────────────────────
{
  const empty = (url) => {
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
    if (url === '/api/me') return json(200, { ok: true, me: { id: 'u1', kind: 'individual' } });
    if (/accounts\/mine$/.test(url)) return json(200, { ok: true, accounts: [], types: {} });
    if (url === '/api/books') return json(200, { ok: true, books: [] });
    return json(200, { ok: true, payslips: [], invoices: [] });
  };
  const { w, D } = boot(empty);
  await settle();
  await w.SelahActions.goHome(); await settle();

  const step = D.getElementById('next-step').textContent;
  ok('🔑 a brand-new person is told what to do FIRST, not shown seven empty doors',
     /Start here/.test(step));
  ok('...step one is an account — where the money actually sits', /Add an account/.test(step));
  ok('...step two is a Book', /Create a Book/.test(step));
  ok('...and each step is one click away',
     !!D.querySelector('#next-step [data-action="goAccounts"]'));
}

{
  // Set up already? The scaffolding gets out of the way.
  const { w, D } = boot((url) => {
    if (/accounts\/mine$/.test(url)) return json(200, { ok: true, accounts: [{ id: 'a1', name: 'Cash' }], types: {} });
    return booksFetch({})(url);
  });
  await settle();
  await w.SelahActions.goHome(); await settle();
  ok('🔑 once you are set up, "Start here" disappears — it does not nag',
     D.getElementById('next-step').textContent.trim() === '');
}

// ── 🔴 "DRAFT THIS MONTH" WAS A BUTTON THAT DID NOTHING ───────────────────
{
  const o = {};
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  const tabs = [...D.querySelectorAll('.tabs .tab')];
  ok('a Book has seven tabs', tabs.length === 7);
  // 🔑 THE ORDER IS THE STORY: what happened, then what judges it, then what I
  //    expect every month, then what is coming, then what I mean to buy.
  ok('...in the order: This month · Budget · My defaults · What\'s coming · Shopping · Savings · Invest',
     tabs.map((t) => t.dataset.tab).join(',') === 'month,budget,plan,ahead,shopping,savings,invest');
  ok('...and "This month" is the one you land on', tabs[0].classList.contains('active'));

  // 🔑 THE DEFAULTS ARE ONE TABLE — the plan and the price book unified.
  w.SelahActions.bkTab(D.querySelector('[data-tab="plan"]')); await settle();
  ok('the defaults tab is open', D.getElementById('bk-pane-plan').hidden === false);

  ok('the Default values table has the right columns',
     [...D.querySelectorAll('#defaults-table thead th')].map((h) => h.textContent).join(',')
       === 'Item,In / out,Unit,Price,Updated,');

  // add a default with a unit and a price
  D.getElementById('df-item').value = 'Sugar';
  D.getElementById('df-dir').value = 'out';
  D.getElementById('df-unit').value = 'Kg';
  D.getElementById('df-price').value = '1000';
  await w.SelahActions.dfAdd(); await settle();
  ok('🔑 adding a default records it with its unit, price and direction',
     o.recorded && o.recorded.itemKey === 'Sugar' && o.recorded.amount === 1000 && o.recorded.unit === 'Kg' && o.recorded.direction === 'out');

  // 🔑 a price may be BLANK — the default exists, waiting for an entry to fill it
  D.getElementById('df-item').value = 'Rent';
  D.getElementById('df-price').value = '';
  D.getElementById('df-unit').value = '';
  await w.SelahActions.dfAdd(); await settle();
  ok('🔑 a default can be added with NO price yet (amount 0, unit blank)',
     o.recorded.itemKey === 'Rent' && o.recorded.amount === 0);
}

{
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 THE BUDGET IS ONE EDITABLE TABLE — AND A SUGGESTION IS NOT A BUDGET.
  // ═══════════════════════════════════════════════════════════════════════════
  const o = { budgets: [], budget: { rows: [], budgetsExcluded: [], howBudgetsWereCounted: 'x' },
    forecast: { ok: true, comingUp: { items: [] }, suggestedBudget: {
      lines: [{ category: 'rent', suggested: 800_000, working: 'Over 6 months you spent 4,800,000 on this.' }],
      lumpy: [{ category: 'school_fees', budgetItAs: 'About 1,200,000, around 2026-09-07.' }],
      whatThisCannotSee: ['A funeral. A school term.'] } } };

  const saved = [];
  const { w, D } = boot((url, init) => {
    if (/\/budgets$/.test(url) && init && init.method === 'POST') { saved.push(JSON.parse(init.body)); return json(200, { ok: true, id: 'g1' }); }
    return booksFetch(o)(url, init);
  });
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkTab(D.querySelector('[data-tab="budget"]')); await settle();

  // 🔑 TWO TABLES: money in, money out. They are two different questions, and they
  //    fail in OPPOSITE directions — spending 850k against 800k is BAD; earning 850k
  //    against 800k is GOOD. One table cannot colour both correctly, and a table that
  //    paints a good month red is worse than no colour at all.
  const heads = [...D.querySelectorAll('#bk-pane-budget .cardhead h3')].map((h) => h.textContent);
  ok('🔑 the Budget tab has TWO tables — money in, and money out',
     D.querySelectorAll('#bk-pane-budget table.t').length === 2);
  ok('...and each says which question it answers',
     heads.some((h) => /Income — what you expect/.test(h)) &&
     heads.some((h) => /Expense — your budget/.test(h)));

  const [tin, tout] = [...D.querySelectorAll('#bk-pane-budget table.t')];
  ok('the income table asks for what you EXPECT and shows what was RECEIVED',
     /Expected/.test(tin.textContent) && /Received/.test(tin.textContent));
  ok('the spending table asks for a BUDGET and shows what was SPENT',
     /Budget/.test(tout.textContent) && /Spent/.test(tout.textContent));
  ok('🔑 income categories are budgetable at all now — they were not before',
     !!tin.querySelector('[data-bg="salary"]'));
  ok('...with an editable figure per category',
     D.querySelectorAll('#bk-budget input[data-bg]').length >= 3);
  ok('...and EVERY category has a row, so none can be forgotten',
     !!D.querySelector('[data-bg="rent"]') && !!D.querySelector('[data-bg="food"]') && !!D.querySelector('[data-bg="school_fees"]'));

  // 🔑 PRE-FILLED FROM THE PERSON'S OWN HISTORY.
  ok('🔑 an empty budget is pre-filled from your own spending',
     D.querySelector('[data-bg="rent"]').value === '800000');
  ok('...and it SHOWS ITS WORKING', /you spent 4,800,000 on this/.test(D.getElementById('bk-budget').textContent));
  // 🔑 THE NOTE IS CONTEXT, NOT CONTENT. It must never push the FIGURES off screen —
  //    the numbers are what the person came to this table to read.
  const note = D.querySelector('#bk-budget td.note[title*="4,800,000"]');
  ok('🔑 the source note is a narrow, truncated column — not a wide one',
     !!note && !note.classList.contains('wide'));
  ok('...and the whole sentence is still there, on hover',
     /you spent 4,800,000 on this/.test(note.getAttribute('title')));

  // 🔴 BUT IT IS A SUGGESTION, AND IT COUNTS FOR NOTHING.
  ok('🔴 a pre-filled row is marked SUGGESTED, not saved',
     /suggested/i.test(D.getElementById('bk-budget').textContent));
  ok('🔴 ...and the screen says plainly it is counted in NOTHING until you save',
     /counted in nothing[\s\S]*until you press Save/i.test(D.getElementById('bk-budget').textContent));
  ok('...and it admits what a suggestion cannot see', /funeral/i.test(D.getElementById('bk-budget').textContent));

  // 🔴 A category with NO history sits at ZERO. Visible. Editable. Not forgotten.
  ok('🔴 a category with no history is ZERO, not hidden',
     D.querySelector('[data-bg="food"]').value === '0');
  ok('...and says so', /No history yet/.test(D.getElementById('bk-budget').textContent));

  // 🔑 A LUMP GETS A ROW, AND THE WHOLE AMOUNT IN THE MONTH IT IS DUE.
  //
  // This test used to assert the row was BLANK and told you to "set it for the term".
  // That was needlessly awkward, and the founder was right: school fees is 1,200,000
  // in September and ZERO in October. That is not averaging — it is the opposite of
  // it, and it is what actually happens. The full behaviour is proved further down.
  // 🔑 EVERY ROW IS THE SAME ROW. A lump is not a special KIND of budget line — it
  //    is a budget line with a number in one month and a zero in the next, which is
  //    what a lump IS. The behaviour is unchanged; it is simply no longer announced.
  const shapes = [...D.querySelectorAll('#bk-budget tbody tr:not(.bi-row)')].map((r) => r.children.length);
  ok('🔑 every row has the SAME shape — no special case on the screen',
     shapes.length > 1 && shapes.every((n) => n === shapes[0]));
  ok('🔴 ...and NO monthly slice is ever pre-filled — a twelfth of a term is a lie in every month',
     D.querySelector('[data-bg="school_fees"]').value !== '400000');

  // ── SAVING makes it yours ─────────────────────────────────────────────────
  D.querySelector('[data-bg="food"]').value = '400000';
  await w.SelahActions.bgSaveAll(); await settle();

  ok('saving posts every budgeted category', saved.length === 2);
  ok('...each as an INSTANCE with a start and an end',
     saved.every((g) => g.startsOn && g.endsOn));
  ok('...including the one you typed yourself',
     saved.some((g) => g.category === 'food' && g.amount === 400000));
  ok('🔑 ...and the screen confirms they are now YOURS, and they count',
     /now yours, and they count/.test(D.getElementById('bg-msg').textContent));
}



// ═══════════════════════════════════════════════════════════════════════════
section('📊 TABLES — money is tabular, and the entries must be VISIBLE');
{
  // 🔴 THE LEDGER DID NOT EXIST. The app showed drafts and a summary, and never
  //    once showed the transactions. You could record a boda ride and then have no
  //    way to see it, check it, or correct it.
  const recorded = [
    { id: 'x1', occurredOn: '2026-07-08', direction: 'out', label: 'Boda to town', category: 'transport',
      expected: 5000, actual: 5000, status: 'unplanned', accountId: 'a2' },
    { id: 'x2', occurredOn: '2026-07-05', direction: 'in', label: 'Salary', category: 'salary',
      expected: 2500000, actual: 2100000, status: 'confirmed', accountId: 'a1' },
    { id: 'x3', occurredOn: '2026-07-01', direction: 'in', label: 'Consultancy', category: 'consultancy',
      expected: 1000000, actual: 0, status: 'did_not_arrive', accountId: 'a1' },
  ];
  const { w, D } = boot(booksFetch({ entries: recorded }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  const led = D.getElementById('bk-summary');
  ok('🔴 there is now a LEDGER — every entry, on screen', /Entries — /.test(led.textContent));
  ok('...as a TABLE with real columns',
     [...led.querySelectorAll('table.t thead th')].map((h) => h.textContent).join(',').includes('Category'));

  // 🔴 SCOPED TO THE LEDGER. #bk-summary now holds TWO tables — the "did not come"
  //    table and the ledger — and an unscoped selector was silently reading the
  //    wrong one. Two tables in one container is how a selector starts lying.
  const rows = [...D.querySelectorAll('#bk-ledger table.t tbody tr')];
  ok('...one row per entry', rows.length >= 3);
  ok('🔑 the boda ride you recorded is VISIBLE', /Boda to town/.test(led.textContent));
  ok('...with its date, its category and its account', /2026-07-08/.test(led.textContent) && /transport/.test(led.textContent) && /MTN MoMo/.test(led.textContent));

  ok('🔑 the salary shows what ACTUALLY came (2,100,000), not what was expected',
     /2,100,000/.test(led.textContent));
  ok('🔑 "did not come" is a row, in red, kept — not deleted',
     !!led.querySelector('tr.is-missed') && /did not come/i.test(led.textContent));
  ok('...and the newest entry is at the top', rows[0].textContent.includes('2026-07-08'));

  ok('the summary is a STAT GRID, not a paragraph', D.querySelectorAll('#bk-summary .stat').length >= 3);   // Income, Expense, Net (forecast moved to Budget)
}

// ── 🧾 PLANNED ITEMS IN A BUDGET CATEGORY (bottom-up budget) ────────────────
section('🧾 BUDGET — planned items build a category, and the budget cannot go below their sum');
{
  const budgetItems = { food: [
    { id: 'bi1', name: 'Sugar', estimate: 6_000, onList: false },
    { id: 'bi2', name: 'Rice',  estimate: 4_000, onList: true },
  ] };
  const o = { budgetItems };
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkTab(D.querySelector('[data-tab="budget"]')); await settle();

  const bud = D.getElementById('bk-budget');
  const v = bud.textContent;
  ok('🧾 a category lists the things you plan to buy', /Sugar/.test(v) && /Rice/.test(v));
  ok('🔑 the food budget is floored at the sum of its items (10,000)',
     D.querySelector('[data-bg="food"]').value === '10000' && D.querySelector('[data-bg="food"]').min === '10000');
  ok('🔑 an item already on a shopping list is marked', /on a list/.test(v));
  ok('...an item NOT on a list offers to add it to shopping', !!bud.querySelector('[data-action="biToShop"]'));

  // add a planned item
  D.getElementById('bi-name-food').value = 'Soap';
  D.getElementById('bi-amt-food').value = '3000';
  await w.SelahActions.biAdd({ dataset: { cat: 'food' } }); await settle();
  ok('🧾 adding a planned item POSTs its category, name and estimate',
     o.biAdded && o.biAdded.category === 'food' && o.biAdded.name === 'Soap' && o.biAdded.estimate === 3000);

  // 🛒 push a planned item onto a shopping list
  await w.SelahActions.biToShop({ dataset: { id: 'bi1' } }); await settle();
  ok('🛒 add-to-shopping POSTs to the item\'s to-shopping endpoint', /\/budget-items\/bi1\/to-shopping$/.test(o.biToShop || ''));

  // remove one
  await w.SelahActions.biDel({ dataset: { id: 'bi1' } }); await settle();
  ok('🧾 removing a planned item DELETEs it', /\/budget-items\/bi1$/.test(o.biDeleted || ''));
}

// ── 🔴 A SAVED BUDGET LOOKS DIFFERENT FROM A SUGGESTED ONE ────────────────
{
  const budgets = [
    { id: 'g1', category: 'rent', amount: 800_000, startsOn: '2026-07-01', endsOn: '2026-07-31' },
  ];
  const budget = {
    rows: [{ category: 'rent', budgeted: 800_000, spent: 850_000, variance: -50_000, over: true, overBy: 50_000, percentUsed: 106 }],
    budgetsExcluded: [], howBudgetsWereCounted: 'Nothing was divided, averaged or spread.', unplannedSpending: 0,
  };
  const o = { budgets, budget };
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkTab(D.querySelector('[data-tab="budget"]')); await settle();

  const b = D.getElementById('bk-budget').textContent;
  ok('a SAVED row carries its figure', D.querySelector('[data-bg="rent"]').value === '800000');
  ok('...and says it is yours', /Yours\. Saved\./.test(b));
  ok('...and shows what is LEFT and a progress bar — which a suggestion does NOT',
     !!D.querySelector('#bk-budget .bar') && /over by 50,000/i.test(b));

  // 🔴 We do NOT overwrite a budget a human already chose with a suggestion.
  ok('🔴 with a budget already saved, no row is marked "suggested"',
     !/suggested/i.test(b));

  // 🔑 a saved row can be REMOVED outright, not only edited
  const rm = D.querySelector('[data-action="bgDel"]');
  ok('a saved budget row offers Remove', !!rm);
  await w.SelahActions.bgDel(rm); await settle();
  ok('🔑 Remove DELETEs that budget line', /\/budgets\/g1$/.test(o.budgetDeleted || ''));
}

// ── ACCOUNTS AS A TABLE ──────────────────────────────────────────────────
{
  const health = { ok: true,
    balances: [
      { accountId: 'a1', name: 'Stanbic', type: 'bank', currency: 'UGX', computed: 2_600_000, liquid: true, side: 'asset', scope: 'personal', impossible: false },
      { accountId: 'a2', name: 'MTN MoMo', type: 'mobile_money', currency: 'UGX', computed: -250_000, liquid: true, side: 'asset', scope: 'personal',
        impossible: true, impossibleBecause: 'You cannot hold -250,000 in MTN MoMo.' },
      { accountId: 'a4', name: 'DFCU loan', type: 'loan', currency: 'UGX', computed: 5_000_000, liquid: false, side: 'debt', scope: 'personal', impossible: false },
    ],
    netWorth: { netWorth: -2_650_000, assets: 2_350_000, debts: 5_000_000, accountsNeverReconciled: [], perCurrency: [] },
    emergencyFund: { refused: true, because: 'x' }, savingsRate: {} };

  const o = { health, mine: { ok: true, accounts: [], types: {
    bank: { label: 'Bank account (current)' }, savings: { label: 'Savings account' }, sacco: { label: 'SACCO savings' } } } };
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goAccounts(); await settle();

  const t = D.getElementById('ac-list');
  ok('accounts are a TABLE, with a balance column',
     [...t.querySelectorAll('table.t thead th')].map((h) => h.textContent).join(',').includes('Balance'));
  ok('a debt is marked "you owe", not shown as an asset', /you owe/.test(t.textContent));
  ok('a liquid account says so — because land is not lunch', /liquid/.test(t.textContent));
  ok('🔴 an IMPOSSIBLE balance is flagged in the row itself',
     !!t.querySelector('tr.is-missed') && /cannot hold -250,000/.test(t.textContent));
  ok('...and every row can be checked against reality', !!t.querySelector('[data-rec="a1"]'));

  // ✏️ EDIT an account's name and type
  ok('✏️ each account offers Edit', !!t.querySelector('[data-action="acEditToggle"][data-id="a1"]'));
  w.SelahActions.acEditToggle({ dataset: { id: 'a1' } }); await settle();
  ok('...toggling reveals the editor with the current name and a type picker',
     D.getElementById('edit-a1').hidden === false && D.getElementById('edit-name-a1').value === 'Stanbic' && !!D.querySelector('#edit-type-a1 option[value="savings"]'));
  D.getElementById('edit-name-a1').value = 'Stanbic Savings';
  D.getElementById('edit-type-a1').value = 'savings';
  await w.SelahActions.acSaveEdit({ dataset: { id: 'a1' } }); await settle();
  ok('✏️ saving PATCHes the new name and type', o.accountEdited && o.accountEdited.name === 'Stanbic Savings' && o.accountEdited.type === 'savings');
}



// ═══════════════════════════════════════════════════════════════════════════
section('⚡ RECORDING AN ENTRY — the thing people do most must be the easiest');
// 🔴 The primary action used to sit at the BOTTOM of the longest list on the page.
//    To record a boda ride you scrolled past every transaction you had ever made.
//    To record a day of spending you did it five times.
{
  const saved = [];
  const { w, D } = boot((url, init) => {
    if (/\/entries$/.test(url) && init && init.method === 'POST') {
      saved.push(JSON.parse(init.body));
      return json(200, { ok: true, id: 'n' + saved.length });
    }
    return booksFetch({})(url, init);
  });
  await settle();
  await w.SelahActions.goBooks(); await settle();

  // The Record action belongs to the LEDGER, on its header — not floating over the
  // page. So on the Books LIST there is no Record button at all: an action with no
  // object.
  ok('the Record button is NOT on the Books list — an action with no object',
     !D.querySelector('#view-books [data-action="bkOpenSheet"]'));

  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  // 🔑 IT SITS ON THE LEDGER'S HEADER — same line as the title, to the right. The
  //    action lives WITH the thing it acts on, rather than floating over your data
  //    and covering the last row, which is the one you just added.
  const head = D.querySelector('#bk-ledger .cardhead');
  ok('🔑 the ledger has a header: the title on the left, the action on the right',
     !!head && /Entries — |Nothing recorded/.test(head.textContent));
  ok('🔑 ...and Record is that action, on the same line as the title',
     !!head.querySelector('[data-action="bkOpenSheet"]'));
  ok('...and it is the primary action — one filled button, and it is this one',
     head.querySelector('[data-action="bkOpenSheet"]').classList.contains('primary'));
  ok('🔴 the sheet is CLOSED — actually closed, in pixels, not just in the DOM',
     disp(w, D.getElementById('sheet')) === 'none');

  w.SelahActions.bkOpenSheet(); await settle();
  ok('tapping Record opens the sheet', disp(w, D.getElementById('sheet')) !== 'none');
  ok('🔑 ...and the cursor lands on the AMOUNT — the field you came here to fill',
     D.activeElement === D.getElementById('bk-amount'));
  ok('...with the date already set to today, because it almost always is',
     D.getElementById('bk-date').value === new Date().toISOString().slice(0, 10));

  // 🔴 NO ACCOUNT IS PRE-SELECTED. Still true, even now it is one tap away.
  ok('🔴 no account is pre-selected', D.getElementById('bk-acct').value === '');

  // ── a run of entries: a day's spending, without leaving the sheet ──────────
  D.getElementById('bk-amount').value = '5000';
  D.getElementById('bk-label').value = 'Boda to town';
  D.getElementById('bk-acct').value = 'a2';
  await w.SelahActions.bkAddEntry(); await settle();

  ok('the entry reaches the server', saved.length === 1 && saved[0].amount === 5000);
  ok('🔑 THE SHEET STAYS OPEN — a day of spending is four or five things, not one',
     disp(w, D.getElementById('sheet')) !== 'none');
  ok('...it confirms what was saved', /Saved:/.test(D.getElementById('bk-sheet-msg').textContent));
  ok('...the amount and label are cleared, ready for the next one',
     D.getElementById('bk-amount').value === '' && D.getElementById('bk-label').value === '');
  ok('🔑 ...but the ACCOUNT and DATE are KEPT — they rarely change between entries',
     D.getElementById('bk-acct').value === 'a2' && D.getElementById('bk-date').value !== '');
  ok('...and the cursor is back on the amount', D.activeElement === D.getElementById('bk-amount'));

  // second entry, no scrolling, no re-picking
  D.getElementById('bk-amount').value = '3000';
  D.getElementById('bk-label').value = 'Boda home';
  await w.SelahActions.bkAddEntry(); await settle();
  ok('a second entry takes two fields and one tap', saved.length === 2 && saved[1].amount === 3000);
  ok('...and it kept the account without being asked again', saved[1].accountId === 'a2');
}

// ── THE KEYBOARD ──────────────────────────────────────────────────────────
{
  const saved = [];
  const { w, D } = boot((url, init) => {
    if (/\/entries$/.test(url) && init && init.method === 'POST') { saved.push(JSON.parse(init.body)); return json(200, { ok: true }); }
    return booksFetch({})(url, init);
  });
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkOpenSheet(); await settle();

  D.getElementById('bk-amount').value = '20000';
  D.getElementById('bk-label').value = 'Shopping';
  D.getElementById('bk-acct').value = 'a1';

  D.getElementById('bk-label').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await settle();
  ok('🔑 ENTER submits — a form you cannot drive from the keyboard punishes anybody entering more than one thing',
     saved.length === 1 && saved[0].amount === 20000);

  D.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await settle();
  ok('ESCAPE closes the sheet — and it is GONE from the screen, not merely flagged',
     disp(w, D.getElementById('sheet')) === 'none');
}

// ── MONEY IN / OUT / TRANSFER — one tap, not a dropdown ──────────────────
{
  const { w, D } = boot(booksFetch({}));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkOpenSheet();

  ok('in / out / transfer is a one-tap choice, not a dropdown', D.querySelectorAll('.seg-b').length === 3);
  ok('...and "money out" is the default, because it is what people record all day',
     D.querySelector('.seg-b.active').dataset.dir === 'out');

  w.SelahActions.bkDir(D.querySelector('[data-dir="transfer"]'));
  ok('🔴 a TRANSFER asks for TWO accounts — it touches two accounts and zero totals',
     D.getElementById('bk-acct-two').hidden === false && D.getElementById('bk-acct-one').hidden === true);

  w.SelahActions.bkDir(D.querySelector('[data-dir="in"]'));
  ok('...and money in goes back to one account', D.getElementById('bk-acct-one').hidden === false);
}



// ═══════════════════════════════════════════════════════════════════════════
section('🎨 THE DESIGN CONTRACT — hierarchy, one primary action, no blank screens');
{
  const { w, D } = boot(booksFetch({}));
  await settle();

  // 1. HIERARCHY IS SIZE AND SPACE, NOT COLOUR. If everything is bold, nothing is.
  const cs = (el) => w.getComputedStyle(el);
  await w.SelahActions.goBooks(); await settle();

  const h2 = D.querySelector('#view-books .viewhead h2');
  ok('every screen has ONE headline that says what it is', !!h2 && h2.textContent.trim() === 'My Books');
  ok('...and a lede that says what it is FOR',
     /A Book is where your income and expenses live/.test(D.querySelector('#view-books .lede').textContent));

  // 2. ONE PRIMARY ACTION PER SCREEN. Two primaries is a question, not an interface.
  const primaries = [...D.querySelectorAll('#view-books button.primary')].filter((b) => !b.closest('[hidden]'));
  ok('🔑 exactly ONE filled button on the screen — everything else recedes', primaries.length === 1);

  // 3. NUMBERS ARE TABULAR. Money in a proportional font reads like prose.
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  const v = D.querySelector('#bk-summary .stat .v');
  ok('every money figure is tabular-numeric — 1,200,000 must LOOK bigger than 120,000',
     /tabular-nums/.test(cs(v).fontVariantNumeric || '') || /mono/i.test(cs(v).fontFamily));
}

// ── 🔴 NEVER A BLANK SCREEN ───────────────────────────────────────────────
{
  const bare = (url) => {
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
    if (url === '/api/me') return json(200, { ok: true, me: { id: 'u1', kind: 'individual' } });
    if (url === '/api/books') return json(200, { ok: true, books: [] });
    if (/accounts\/mine$/.test(url)) return json(200, { ok: true, accounts: [], types: {} });
    if (/\/health$/.test(url)) return json(200, { ok: true, balances: [], netWorth: {}, emergencyFund: { refused: true, because: 'x' }, savingsRate: {} });
    return json(200, { ok: true, payslips: [], invoices: [] });
  };
  const { w, D } = boot(bare);
  await settle();

  await w.SelahActions.goBooks(); await settle();
  const e = D.querySelector('#view-books .empty');
  ok('🔴 an empty Books screen is not blank — it explains itself', !!e);
  ok('...it says WHAT a Book is', /A Book holds your income and expenses/.test(e.textContent));
  ok('🔑 ...and gives ONE tap to get started — no name to invent',
     !!e.querySelector('[data-action="bkQuickHome"]'));

  await w.SelahActions.goAccounts(); await settle();
  const ea = D.querySelector('#view-accounts .empty');
  ok('an empty Accounts screen explains what an account is for', !!ea &&
     /net worth and your runway are all built from these/.test(ea.textContent));
}

{
  // An empty Book: the ledger must invite you in, not sit there blank.
  const { w, D } = boot(booksFetch({ entries: [] }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  const led = D.querySelector('#bk-summary .empty');
  ok('an empty ledger says what to do, and offers to do it', !!led &&
     !!led.querySelector('[data-action="bkOpenSheet"]'));
}

// ── ORIENTATION: you always know where you are ───────────────────────────
{
  const { w, D } = boot(booksFetch({}));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  ok('a screen inside a Book still says BOOKS in the nav',
     D.querySelector('#appnav .active').dataset.nav === 'books');
  ok('...and offers a way back UP, named — not just "← Back"',
     /← Books/.test(D.querySelector('#view-book .back').textContent));
}



// ═══════════════════════════════════════════════════════════════════════════
section('🔴 `hidden` MUST ACTUALLY HIDE — and jsdom CANNOT tell us whether it does');
// ═══════════════════════════════════════════════════════════════════════════
// THE BUG: `.sheet { display: grid }` is an AUTHOR rule. `[hidden] { display: none }`
// is a BROWSER rule, and a browser rule has the LOWEST priority there is. The author
// wins, silently. So the Record dialog had `hidden` set, the JS was right,
// `el.hidden === true` — and it sat on top of the screen and COULD NOT BE CLOSED.
// The user was trapped in it. `.fab` and `.appnav` were broken the same way.
//
// 🔴 AND HERE IS THE PART THAT MATTERS MORE THAN THE BUG:
//
// I "fixed" the tests by asserting getComputedStyle().display instead of el.hidden,
// and declared that they now check what the user sees. THEN I PUT THE BUG BACK, AND
// ALL 207 TESTS STILL PASSED.
//
// jsdom returns `display: none` for `[hidden]` NO MATTER WHAT the author CSS says.
// It does not model this cascade. So NO JSDOM TEST CAN EVER SEE THIS BUG — and the
// ones I wrote to catch it were theatre.
//
// What actually protects the user:
//   1. build.js GUARD — the `[hidden] { display: none !important }` rule must exist,
//      or the build FAILS. Verified below by reading the stylesheet itself.
//   2. A REAL BROWSER (playwright). Which has never been run. That is the real gap,
//      and pretending otherwise is how this reached the user three times.
{
  const css = fs.readFileSync(path.join(WEB, 'assets/tokens.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  ok('🔴 the stylesheet contains `[hidden] { display: none !important }` — the ONE line that fixes this',
     /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(css));

  // Anything that sets `display` in a class AND is used with `hidden` in the HTML is
  // a trap. Enumerate them, so the next person can see the blast radius.
  const html = fs.readFileSync(path.join(WEB, 'individual.html'), 'utf8');
  const risky = ['sheet', 'appnav', 'door-grid', 'tabs', 'stats', 'seg']
    .filter((c) => new RegExp('\\.' + c + '\\s*\\{[^}]*display:', 'm').test(css))
    .filter((c) => new RegExp('class="[^"]*\\b' + c + '\\b[^"]*"[^>]*\\shidden', 'm').test(html));

  ok(`the classes that set display AND get hidden (${risky.join(', ') || 'none'}) are covered by that one rule`,
     risky.every(() => /\[hidden\]\s*\{[^}]*!important/.test(css)));

  ok('🔴 jsdom CANNOT verify this — it reports display:none for [hidden] whatever the CSS says. ' +
     'The build guard and a real browser are the only things that can.',
     true);
}


{
  // The whole point, end to end: open the dialog, close it, and it is GONE.
  const { w, D } = boot(booksFetch({}));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  w.SelahActions.bkOpenSheet();
  ok('the sheet opens', disp(w, D.getElementById('sheet')) !== 'none');

  click(w, D.querySelector('[data-action="bkCloseSheet"]'));
  ok('🔑 the ✕ closes it — and the user can navigate again',
     disp(w, D.getElementById('sheet')) === 'none');

  w.SelahActions.bkOpenSheet();
  click(w, D.getElementById('sheet'));            // the backdrop
  ok('tapping the backdrop closes it', disp(w, D.getElementById('sheet')) === 'none');

  w.SelahActions.bkOpenSheet();
  await w.SelahActions.goHome(); await settle();
  ok('🔑 navigating away closes it — a dialog must never survive the screen it belongs to',
     disp(w, D.getElementById('sheet')) === 'none');
}



// ═══════════════════════════════════════════════════════════════════════════
section('🔒 THE DIALOG CLOSES — three ways, one of which no stale CSS can defeat');
{
  const { w, D } = boot(booksFetch({}));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  const sheet = D.getElementById('sheet');

  w.SelahActions.bkOpenSheet();
  ok('the sheet opens', sheet.hidden === false && sheet.style.display !== 'none');

  click(w, D.querySelector('[data-action="bkCloseSheet"]'));
  ok('🔑 the ✕ closes it — the attribute says so', sheet.hidden === true);
  ok('🔴 ...AND an inline display:none, which beats every stylesheet — including a ' +
     'STALE ONE cached in the user\'s browser, who is a person no CSS fix can reach today',
     sheet.style.display === 'none');

  w.SelahActions.bkOpenSheet();
  click(w, sheet);                                   // the backdrop
  ok('the backdrop closes it, hard', sheet.hidden === true && sheet.style.display === 'none');

  w.SelahActions.bkOpenSheet();
  D.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('Escape closes it, hard', sheet.hidden === true && sheet.style.display === 'none');

  w.SelahActions.bkOpenSheet();
  await w.SelahActions.goHome(); await settle();
  ok('🔑 navigating away closes it, hard — a dialog must never outlive its screen',
     sheet.hidden === true && sheet.style.display === 'none');
}

{
  // 🔴 AND THE STYLESHEET NO LONGER FIGHTS THE CASCADE AT ALL.
  //    `display: none` is the BASE for .sheet/.fab/.appnav, and they are only shown
  //    when NOT hidden. There is nothing left to override, so nothing left to lose.
  const css = fs.readFileSync(path.join(WEB, 'assets/tokens.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  for (const cls of ['sheet', 'appnav']) {
    const base = new RegExp('\\.' + cls + '\\s*\\{[^}]*display:\\s*none', 'm').test(css);
    const shown = new RegExp('\\.' + cls + ':not\\(\\[hidden\\]\\)', 'm').test(css);
    ok(`🔴 .${cls} defaults to display:none and is only shown when NOT hidden — no cascade fight`,
       base && shown);
  }
}



// ═══════════════════════════════════════════════════════════════════════════
section('📆 THE MONTH TAB — what moved, and one line telling you if you are on track');
{
  const budgets = [{ id: 'g1', category: 'rent', amount: 800_000, startsOn: '2026-07-01', endsOn: '2026-07-31' }];
  const budget = {
    rows: [{ category: 'rent', budgeted: 800_000, spent: 850_000, variance: -50_000, over: true, overBy: 50_000, percentUsed: 106 }],
    totalBudgeted: 800_000, totalExpenseBudgeted: 800_000, totalIncomeBudgeted: 800_000, totalSpent: 850_000, over: true,
    budgetsExcluded: [], howBudgetsWereCounted: 'Nothing was divided.', unplannedSpending: 0,
  };
  const { w, D } = boot(booksFetch({ budgets, budget }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  const month = D.getElementById('bk-pane-month');
  ok('the month tab holds the summary', !!month.querySelector('#bk-summary'));
  ok('...and the entries', !!D.getElementById('bk-ledger'));
  ok('🔑 ...and NOT the budget vs actual table — that has its own tab',
     !month.querySelector('#bk-budget'));
  ok('the budget table lives on the Budget tab', !!D.querySelector('#bk-pane-budget #bk-budget'));

  // 🔑 THE ONE LINE THAT COMES BACK.
  const ot = D.querySelector('#bk-summary .ontrack');
  ok('🔑 the month summary carries ONE on-track line', !!ot);
  ok('...it says spending is over the expected income, and by how much',
     /Over budget/.test(ot.textContent) && /850,000/.test(ot.textContent) && /800,000/.test(ot.textContent) && /expected income/.test(ot.textContent));
  ok('...it is styled as bad, not neutral', ot.classList.contains('bad'));
  ok('...and one tap gets you the detail', !!ot.querySelector('[data-action="bkGoBudget"]'));

  w.SelahActions.bkGoBudget();
  ok('🔑 ...which actually opens the Budget tab', D.getElementById('bk-pane-budget').hidden === false);
}

{
  // On track, and under.
  const budget = { rows: [{ category: 'food', budgeted: 400_000, spent: 120_000, variance: 280_000, over: false, percentUsed: 30 }],
    totalBudgeted: 400_000, totalExpenseBudgeted: 400_000, totalIncomeBudgeted: 500_000, totalSpent: 120_000, over: false, budgetsExcluded: [], howBudgetsWereCounted: 'x' };
  const { w, D } = boot(booksFetch({ budgets: [{ id: 'g1', category: 'food', amount: 400_000, startsOn: '2026-07-01', endsOn: '2026-07-31' }], budget }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  const ot = D.querySelector('#bk-summary .ontrack');
  ok('under budget reads "On track"', /On track/.test(ot.textContent) && ot.classList.contains('ok'));
}

{
  // No budget at all: say so, and offer to fix it. Never a silent blank.
  const { w, D } = boot(booksFetch({ budgets: [], budget: { rows: [], totalBudgeted: 0, totalSpent: 0, budgetsExcluded: [], howBudgetsWereCounted: 'x' } }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  const sum = D.getElementById('bk-summary').textContent;
  ok('🔑 with no expected income, the summary asks for it rather than a meaningless bar',
     /expected income/.test(sum) && !D.querySelector('#bk-summary .ontrack'));
  ok('...and offers one tap to set the budget', !!D.querySelector('#bk-summary [data-action="bkGoBudget"]'));
}

{
  // 🔴 The excluded lump is flagged on the MONTH screen too — because that is where
  //    a person decides they are fine, and school fees is why they are not.
  const budget = { rows: [{ category: 'rent', budgeted: 800_000, spent: 700_000, variance: 100_000, over: false, percentUsed: 88 }],
    totalBudgeted: 800_000, totalExpenseBudgeted: 800_000, totalIncomeBudgeted: 800_000, totalSpent: 700_000, over: false,
    budgetsExcluded: [{ category: 'school_fees', amount: 1_200_000, startsOn: '2026-05-01', endsOn: '2026-08-31' }],
    whyExcluded: 'x', howBudgetsWereCounted: 'x' };
  const { w, D } = boot(booksFetch({ budgets: [], budget }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  ok('🔴 "on track" does NOT hide the lump that is not counted in it',
     /not counted here/.test(D.getElementById('bk-summary').textContent));
  ok('...and says why: a term is not one-third of a term each month',
     /one-third of a term/.test(D.getElementById('bk-summary').textContent));
}



// ═══════════════════════════════════════════════════════════════════════════
section('📕 MY BOOKS — a grid you choose from, not a stack you scroll');
{
  const many = (url) => {
    if (url === '/api/books') return json(200, { ok: true, books: [
      { id: 'b1', name: 'Home',    isDefault: true,  kind: 'personal', currency: 'UGX' },
      { id: 'b2', name: 'Shop',    isDefault: false, kind: 'personal', currency: 'UGX' },
      { id: 'b3', name: "Child's", isDefault: false, kind: 'shared',   currency: 'UGX' },
    ] });
    return booksFetch({})(url);
  };
  const { w, D } = boot(many);
  await settle();
  await w.SelahActions.goBooks(); await settle();

  const grid = D.querySelector('#bk-books .tiles');
  ok('Books are laid out as a GRID', !!grid);

  const tiles = [...grid.querySelectorAll('.tile')];
  ok('...one tile per Book, plus one to add another', tiles.length === 4);
  ok('...each with an icon', tiles.every((t) => !!t.querySelector('.ti')));
  ok('...and each is a way in', tiles[0].dataset.action === 'bkOpen' && tiles[0].dataset.id === 'b1');

  ok('the default Book says so', /default/.test(tiles[0].textContent));
  ok('🔑 a SHARED Book is visibly different from a personal one',
     /shared/.test(tiles[2].textContent) && tiles[2].querySelector('.ti').textContent === '👥');

  const add = grid.querySelector('.tile-add');
  ok('🔑 "New Book" is the LAST TILE — create lives with the things it creates', !!add);
  ok('...and it is visibly not one of your Books', add.classList.contains('tile-add'));
  ok('...and tapping it puts the cursor where the name goes',
     typeof w.SelahActions.bkFocusNew === 'function');
}



// ═══════════════════════════════════════════════════════════════════════════
section('🏷️  CATEGORIES — editable, where they are used');
{
  const o = {};
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkTab(D.querySelector('[data-tab="budget"]')); await settle();

  ok('every category row can be renamed, in the cell', !!D.querySelector('#bk-budget [data-action="catEdit"]'));

  // rename
  w.prompt = () => 'Boda & taxi';
  await w.SelahActions.catEdit(D.querySelector('[data-action="catEdit"]')); await settle();
  ok('🔑 renaming a category reaches the server', o.renamed && o.renamed.label === 'Boda & taxi');

  // 🔴 DELETING A CATEGORY MUST NOT DELETE THE MONEY.
  w.prompt = () => '';
  w.confirm = () => true;
  await w.SelahActions.catEdit(D.querySelector('[data-action="catEdit"]')); await settle();
  ok('an empty name deletes the category', !!o.deleted);
  ok('🔴 ...and the screen says the TRANSACTIONS SURVIVED — no money was deleted',
     /still there, and they still count/.test(D.getElementById('bg-msg').textContent));

  // add
  D.getElementById('cat-new').value = 'School run';
  D.getElementById('cat-dir').value = 'out';
  await w.SelahActions.catAdd(); await settle();
  ok('a new category can be added, right where categories are used',
     o.added && o.added.label === 'School run' && o.added.direction === 'out');

  ok('...and it can be marked "not every month" — a lump, never spread',
     !!D.getElementById('cat-lumpy'));
  ok('...and the screen explains what that means',
     /whole amount goes in the period it is actually paid/i.test(D.getElementById('bk-budget').textContent));
}

// ═══════════════════════════════════════════════════════════════════════════
section('🔑 A LUMP LANDS IN FULL, IN THE MONTH IT IS DUE — AND ZERO IN THE OTHERS');
{
  // The forecast says school fees is due 12 September, about 1,200,000.
  const forecast = { ok: true, comingUp: { items: [] }, suggestedBudget: {
    lines: [], lumpy: [{ category: 'school_fees', typicalAmount: 1_200_000, nextDue: '2026-09-12' }],
    whatThisCannotSee: [] } };

  // ── budgeting SEPTEMBER: the whole fee, not a slice ──────────────────────
  {
    const { w, D } = boot(booksFetch({ forecast, budgets: [], budget: { rows: [], budgetsExcluded: [], howBudgetsWereCounted: 'x' } }));
    await settle();
    await w.SelahActions.goBooks(); await settle();
    await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

    // 🔑 Navigate to September — the budget window follows the month, and the lump
    //    lands in it. (Setting bg-from/bg-to by hand no longer works: fillBudgetForm
    //    now OWNS the window, deriving it from the month you are viewing.)
    while (D.getElementById('bk-month-label').textContent.indexOf('September') === -1 &&
           D.getElementById('bk-month-label').textContent.indexOf('2027') === -1) {
      await w.SelahActions.bkNextMonth(); await settle();
    }
    w.SelahActions.bkTab(D.querySelector('[data-tab="budget"]')); await settle();

    ok('🔑 in the month it is DUE, school fees is the WHOLE 1,200,000',
       D.querySelector('[data-bg="school_fees"]').value === '1200000');
    ok('...and the source note says it is due in this period, in full',
       /Due in this period/i.test(D.getElementById('bk-budget').textContent));
    // Scope to the TABLE BODY. The add-category helper below it legitimately uses
    // the words "not every month" — it is a setting, not a badge on a row.
    const body = D.querySelector('#bk-budget tbody').textContent;
    ok('🔑 ...and the row looks exactly like every other row — no badge, no grey',
       !/not every month|due this window/i.test(body) &&
       !D.querySelector('#bk-budget tbody tr.is-draft .pill:not(.draft)'));
  }

  // ── budgeting OCTOBER: zero. It is not due. ───────────────────────────────
  {
    const { w, D } = boot(booksFetch({ forecast, budgets: [], budget: { rows: [], budgetsExcluded: [], howBudgetsWereCounted: 'x' } }));
    await settle();
    await w.SelahActions.goBooks(); await settle();
    await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

    while (D.getElementById('bk-month-label').textContent.indexOf('October') === -1 &&
           D.getElementById('bk-month-label').textContent.indexOf('2027') === -1) {
      await w.SelahActions.bkNextMonth(); await settle();
    }
    w.SelahActions.bkTab(D.querySelector('[data-tab="budget"]')); await settle();

    ok('🔑 in the month it is NOT due, school fees is ZERO',
       D.querySelector('[data-bg="school_fees"]').value === '0');
    ok('...and it tells you when it IS coming, and how much',
       /Next around 2026-09-12/.test(D.getElementById('bk-budget').textContent) &&
       /1,200,000/.test(D.getElementById('bk-budget').textContent));
    ok('...and it is still just a row, like every other row',
       [...D.querySelectorAll('#bk-budget tbody tr:not(.bi-row)')].every((r) => r.children.length === 6));
    ok('🔴 ...and NOWHERE does a 400,000 monthly slice appear — that figure is wrong in every month',
       !/400,000/.test(D.getElementById('bk-budget').textContent));
  }
}



// ═══════════════════════════════════════════════════════════════════════════
section('🏷️  A CATEGORY BELONGS TO A DIRECTION — the dropdown must respect it');
// Salary is money in; rent is money out. Offering "Rent" as a place your salary
// came from is nonsense, and it is exactly the nonsense a tired thumb taps through.
{
  const cats = [
    { id: 'c1', key: 'salary', label: 'Salary',   direction: 'in' },
    { id: 'c2', key: 'rent',   label: 'Rent',     direction: 'out' },
    { id: 'c3', key: 'food',   label: 'Food',     direction: 'out' },
  ];
  const { w, D } = boot(booksFetch({ categories: cats }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  // ── THE RECORD SHEET ──────────────────────────────────────────────────────
  w.SelahActions.bkOpenSheet(); await settle();
  const opts = () => [...D.getElementById('bk-cat').options].map((o) => o.value).filter(Boolean);

  // default direction is "out"
  ok('🔴 money OUT shows only out categories', opts().join(',') === 'rent,food');
  ok('...and NOT the income ones', !opts().includes('salary'));

  w.SelahActions.bkDir(D.querySelector('[data-dir="in"]'));
  ok('🔴 switching to money IN shows only income categories', opts().join(',') === 'salary');
  ok('...and the out categories are gone', !opts().includes('rent'));

  // a category chosen under one direction must not survive a switch to the other
  D.getElementById('bk-cat').value = 'salary';
  w.SelahActions.bkDir(D.querySelector('[data-dir="out"]'));
  ok('🔑 a category that belonged to the OLD direction is dropped, not left dangling',
     D.getElementById('bk-cat').value === '');

  w.SelahActions.bkDir(D.querySelector('[data-dir="transfer"]'));
  ok('a transfer has NO category — it moves money, it does not spend or earn it',
     D.getElementById('bk-cat').disabled === true);

}



// ═══════════════════════════════════════════════════════════════════════════
section('📆 PAST AND FUTURE MONTHS — walk backward to look, forward to plan');
{
  const o = {};
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  const label = () => D.getElementById('bk-month-label').textContent;
  const tag = () => D.getElementById('bk-month-tag').textContent;
  const nowLabel = new Date().toLocaleString('en', { month: 'long', year: 'numeric' });

  ok('a Book opens on the CURRENT month', label() === nowLabel && tag() === 'this month');
  ok('...and there is no "Today" jump when you are already here', D.getElementById('bk-today').hidden === true);

  // ── walk BACK ──────────────────────────────────────────────────────────
  await w.SelahActions.bkPrevMonth(); await settle();
  ok('‹ goes to the PREVIOUS month', label() !== nowLabel);
  ok('...and it is marked CLOSED', tag() === 'closed');
  ok('🔑 ...and the server was asked for THAT month, not this one',
     o.lastWindow && o.lastWindow.state === 'past');
  ok('...and a "Today" jump appears', D.getElementById('bk-today').hidden === false);

  await w.SelahActions.bkThisMonth(); await settle();
  ok('"Today" returns to the current month', label() === nowLabel);

  // ── walk FORWARD ─────────────────────────────────────────────────────────
  await w.SelahActions.bkNextMonth(); await settle();
  ok('› goes to a FUTURE month', label() !== nowLabel);
  ok('...and it is marked NOT STARTED', tag() === 'not started');
  ok('🔴 ...and the server knows it is the future', o.lastWindow.state === 'future');

  // 🔴 YOU CANNOT RECORD WHAT HAS NOT HAPPENED.
  ok('🔴 a future month shows NO Record button', !D.querySelector('#bk-ledger [data-action="bkOpenSheet"]'));
  ok('🔴 ...and opening the sheet is refused', (() => { w.SelahActions.bkOpenSheet(); return disp(w, D.getElementById('sheet')) === 'none'; })());
  ok('🔑 ...and the summary says the month has not started, and points at the budget',
     /has not started/.test(D.getElementById('bk-summary').textContent));
  ok('🔑 ...and a future month lands you on the BUDGET tab automatically',
     D.getElementById('bk-pane-budget').hidden === false);
}

// ── the WINDOW travels into the budget: this is how you budget the future ──
{
  const saved = [];
  const { w, D } = boot((url, init) => {
    if (/\/budgets$/.test(url) && init && init.method === 'POST') { saved.push(JSON.parse(init.body)); return json(200, { ok: true, id: 'g1' }); }
    return booksFetch({ budgets: [], budget: { rows: [], budgetsExcluded: [], howBudgetsWereCounted: 'x' } })(url, init);
  });
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  await w.SelahActions.bkNextMonth(); await settle();          // a future month
  w.SelahActions.bkTab(D.querySelector('[data-tab="budget"]')); await settle();

  const from = D.getElementById('bg-from').value;
  ok('🔑 the budget window IS the future month you navigated to',
     from > new Date().toISOString().slice(0, 10));

  D.querySelector('[data-bg="rent"]').value = '800000';
  await w.SelahActions.bgSaveAll(); await settle();
  ok('🔑 ...so saving a figure budgets THAT future month',
     saved.length === 1 && saved[0].startsOn === from);
}



// ═══════════════════════════════════════════════════════════════════════════
section('📈 DEFAULT VALUES — history + adjust the price in place');
{
  const V = require('../engine/values');
  const gas = V.track([
    { amount: 100000, asOf: '2026-05-15' },
    { amount: 105000, asOf: '2026-06-15' },
    { amount: 108000, asOf: '2026-07-15' },
  ], { label: 'Gas', unit: 'litre' });
  const o = { trackedItems: [ { key: 'gas', direction: 'out', lastUpdated: '2026-07-15',
    ...gas, pointIds: [
      { id: 'p1', amount: 100000, asOf: '2026-05-15' },
      { id: 'p2', amount: 105000, asOf: '2026-06-15' },
      { id: 'p3', amount: 108000, asOf: '2026-07-15' } ] } ] };

  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkTab(D.querySelector('[data-tab="plan"]')); await settle();

  const table = D.getElementById('defaults-table').textContent;
  ok('the item shows in the defaults table with its current price', /Gas/.test(table) && /108,000/.test(table));
  ok('...its unit', /litre/.test(table));
  ok('...and when it was last updated', /2026-07-15/.test(table));

  // 🔑 the history expands, with the trend and every point
  w.SelahActions.dfHistory(D.querySelector('[data-action="dfHistory"]'));
  const hist = D.getElementById('dfh-gas').textContent;
  ok('🔑 the history shows the trend and past points', /2026-05-15/.test(hist));

  // 🔑 adjust the price IN PLACE → records a new dated point (today)
  const cell = D.querySelector('.df-edit');
  cell.value = '110000';
  cell.dispatchEvent(new w.Event('change', { bubbles: true }));
  await settle();
  ok('🔑 editing the price in the table records a new value point',
     o.recorded && o.recorded.itemKey === 'gas' && o.recorded.amount === 110000);
  ok('...as of today, so the change is tracked', o.recorded.asOf === new Date().toISOString().slice(0,10));
}

// ═══════════════════════════════════════════════════════════════════════════
section('🔁 TRANSFER — two accounts, no units, and a goal when it lands in savings');
{
  const o = {
    accounts: [
      { id: 'a1', name: 'MTN MoMo',   type: 'mobile_money', scope: 'book' },
      { id: 'a3', name: 'Unity SACCO', type: 'sacco',        scope: 'book' },
      { id: 'a4', name: 'Absa Savings', type: 'savings',     scope: 'book' },
    ],
    periodGoals: [{ id: 'g1', name: 'Laptop', accountId: 'a3' }],
  };
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkOpenSheet(); await settle();

  // switch to transfer
  w.SelahActions.bkDir({ dataset: { dir: 'transfer' } }); await settle();
  ok('🔴 a transfer hides the unit/quantity fields — moving money buys no thing', D.getElementById('bk-units-row').hidden === true);
  w.SelahActions.bkDir({ dataset: { dir: 'in' } }); await settle();
  ok('🔴 income needs no units either — you do not earn salary by the kilo', D.getElementById('bk-units-row').hidden === true);
  w.SelahActions.bkDir({ dataset: { dir: 'out' } }); await settle();
  ok('🔑 money-out still shows units (2 Kg of sugar)', D.getElementById('bk-units-row').hidden === false);
  w.SelahActions.bkDir({ dataset: { dir: 'transfer' } }); await settle();
  ok('🔑 a transfer shows two accounts (from / to)', D.getElementById('bk-acct-two').hidden === false);
  ok('🔴 a transfer hides the Category field — it is neither income nor spending', D.getElementById('bk-cat-field').hidden === true);
  ok('🔑 the question is reworded for a transfer', D.querySelector('label[for="bk-label"]').textContent === 'Reason for transfer');

  // choose a SACCO (savings) as the destination → the goal picker appears
  D.getElementById('bk-to').value = 'a3';
  D.getElementById('bk-to').dispatchEvent(new w.Event('change', { bubbles: true })); await settle();
  ok('🔑 a transfer INTO a savings account offers a goal to earmark', D.getElementById('bk-goal-row').hidden === false);
  ok('...populated with the goals backed by that account', !!D.querySelector('#bk-goal option[value="g1"]'));

  // record the transfer toward the goal
  D.getElementById('bk-from').value = 'a1';
  D.getElementById('bk-amount').value = '500000';
  D.getElementById('bk-goal').value = 'g1';
  await w.SelahActions.bkAddEntry(); await settle();
  const e = o.entryPosted;
  ok('🔑 the transfer POSTs from + to accounts and the goal', e && e.direction === 'transfer' && e.fromAccountId === 'a1' && e.toAccountId === 'a3' && e.goalId === 'g1');
  ok('🔴 ...and carries no unit', !e.unit);

  // a transfer to a NON-savings account shows no goal picker
  D.getElementById('bk-to').value = 'a1';
  D.getElementById('bk-to').dispatchEvent(new w.Event('change', { bubbles: true })); await settle();
  ok('🔴 a transfer to a non-savings account has no goal picker', D.getElementById('bk-goal-row').hidden === true);

  // a savings account with NO linked goals still shows the picker (so you know you could earmark)
  D.getElementById('bk-to').value = 'a4';
  D.getElementById('bk-to').dispatchEvent(new w.Event('change', { bubbles: true })); await settle();
  ok('🔑 a savings account with no goals still shows the picker, with an honest empty state',
     D.getElementById('bk-goal-row').hidden === false && /no goal linked to this account/.test(D.getElementById('bk-goal').textContent));
}

section('🧮 UNIT PRICING — quantity in, total out; and the price book updates');
{
  const P = require('../engine/pricing');
  // pure-engine sanity, alongside the UI wiring
  ok('engine: 2 Kg of sugar @1000 → 2000 total', P.resolveLine({ quantity: 2 }, { unitPrice: 1000, unit: 'Kg' }).total === 2000);
  ok('engine: 1200 for 1 Kg → price moved, recordPrice=1200', (() => { const r = P.resolveLine({ quantity: 1, total: 1200 }, { unitPrice: 1000, unit: 'Kg' }); return r.priceChanged && r.recordPrice === 1200; })());

  const saved = [];
  const gasItem = require('../engine/values').track([{ amount: 1000, asOf: '2026-07-01' }], { label: 'Sugar', unit: 'Kg' });
  const o = { trackedItems: [{ key: 'sugar', ...gasItem, unit: 'Kg', pointIds: [{ id: 'p1', amount: 1000, asOf: '2026-07-01' }] }] };
  const { w, D } = boot((url, init) => {
    if (/\/entries$/.test(url) && init && init.method === 'POST') { saved.push(JSON.parse(init.body)); return json(200, { ok: true, id: 'e1' }); }
    return booksFetch(o)(url, init);
  });
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();

  w.SelahActions.bkOpenSheet(); await settle();
  ok('the Record sheet has quantity + unit fields', !!D.getElementById('bk-qty') && !!D.getElementById('bk-unit'));

  // 🔑 type a known item + a quantity, no total → the total auto-fills
  D.getElementById('bk-label').value = 'Sugar';
  D.getElementById('bk-label').dispatchEvent(new w.Event('input', { bubbles: true }));
  D.getElementById('bk-qty').value = '2';
  D.getElementById('bk-qty').dispatchEvent(new w.Event('input', { bubbles: true }));
  await settle();
  ok('🔑 2 Kg of Sugar auto-fills the total to 2,000', D.getElementById('bk-amount').value === '2000');
  ok('...and the unit is picked up from the price book', D.getElementById('bk-unit').value === 'Kg');
  ok('...with a shown working: 2 × 1,000 = 2,000', /2 × 1,000.*2,000/.test(D.getElementById('bk-price-hint').textContent));

  // save → quantity + unit go to the server (which resolves + maintains the book)
  D.getElementById('bk-acct').value = 'a1';
  await w.SelahActions.bkAddEntry(); await settle();
  ok('🔑 the entry POSTs the quantity and unit', saved[0].quantity === 2 && saved[0].unit === 'Kg');
}

{
  // quantity-only with NO amount typed is allowed (server fills it); a bare nothing is not
  const { w, D } = boot(booksFetch({ trackedItems: [] }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  w.SelahActions.bkOpenSheet();
  D.getElementById('bk-label').value = 'Mystery';
  await w.SelahActions.bkAddEntry(); await settle();
  ok('🔴 neither a total nor a quantity → asks "how much, or how many?"',
     /How much, or how many/.test(D.getElementById('bk-sheet-msg').textContent));
}

// ═══════════════════════════════════════════════════════════════════════════
section('🛒 SHOPPING — a plan that estimates, and a purchase that becomes an expense');
{
  // a list with one priced item (sugar, 2 Kg, known 1000) and one un-priced (soap)
  const S = require('../engine/shopping');
  const mkPlan = () => S.planList(
    [{ id: 'i1', label: 'Sugar', quantity: 2, unit: 'Kg', status: 'pending' },
     { id: 'i2', label: 'Soap',  quantity: 1, status: 'pending' }],
    { sugar: { unitPrice: 1000, unit: 'Kg' } });
  const o = { shoppingLists: [{ id: 'sl1', name: 'Grocery', ...mkPlan() }] };
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkTab({ dataset: { tab: 'shopping' } }); await settle();

  // 🔑 MASTER: the tab shows the list of lists, not the items
  const index = D.getElementById('shopping-lists').textContent;
  ok('the tab shows the list of lists', /Grocery/.test(index));
  ok('🔑 the index does NOT spill every item onto the page', !/Sugar/.test(index) && !/Soap/.test(index));
  ok('...it summarises progress instead', /0 of 2 bought/.test(index));

  // 🔑 DETAIL: open the list → now we see its items
  await w.SelahActions.bkOpenList({ dataset: { id: 'sl1' } }); await settle();
  const detail = D.getElementById('shopping-lists').textContent;
  ok('opening a list shows its items', /Sugar/.test(detail) && /Soap/.test(detail));
  ok('🔑 the priced item shows an estimate (2 × 1,000 = 2,000)', /2,000/.test(detail));
  ok('🔴 the un-priced item shows no invented number', /no known price/.test(detail));
  ok('there is a way back to all lists', !!D.querySelector('[data-action="bkCloseList"]'));

  // ✏️ rename the list in place
  const title = D.querySelector('.sl-title-edit');
  ok('the list title is editable in place', !!title);
  title.value = 'Weekly grocery';
  title.dispatchEvent(new w.Event('change', { bubbles: true })); await settle();
  ok('✏️ renaming the list PATCHes the new name', o.listRenamed && o.listRenamed.name === 'Weekly grocery');

  // add an item
  D.getElementById('si-label-sl1').value = 'Milk';
  await w.SelahActions.bkAddShopItem(D.querySelector('[data-action="bkAddShopItem"]')); await settle();
  ok('adding an item POSTs its label', o.shopItemAdded && o.shopItemAdded.label === 'Milk');

  // ✏️ edit a pending item's quantity in place
  const qtyEdit = D.querySelector('.si-qty-edit');
  ok('a pending item exposes an editable quantity', !!qtyEdit);
  qtyEdit.value = '3';
  qtyEdit.dispatchEvent(new w.Event('change', { bubbles: true })); await settle();
  ok('✏️ editing the quantity PATCHes it', o.shopItemEdited && o.shopItemEdited.quantity === 3);

  // mark bought → reveals the "what did you pay" form
  w.SelahActions.bkShopMark({ dataset: { list: 'sl1', id: 'i1' } }); await settle();
  ok('marking bought reveals the paid form', !D.getElementById('done-i1').hidden);

  // 🔴 no account chosen → refuses to record
  await w.SelahActions.bkShopDone({ dataset: { list: 'sl1', id: 'i1' } }); await settle();
  ok('🔴 done with no account is refused in the UI', /which account/i.test(D.getElementById('done-msg-i1').textContent));

  // choose account + category + pay → records the purchase
  ok('the paid form offers a category picker', !!D.getElementById('cat-i1'));
  D.getElementById('paid-i1').value = '2100';
  D.getElementById('acct-i1').value = 'a1';
  D.getElementById('cat-i1').value = 'food';
  await w.SelahActions.bkShopDone({ dataset: { list: 'sl1', id: 'i1' } }); await settle();
  ok('🔑 buying POSTs the account and the actual amount', o.shopDone && o.shopDone.accountId === 'a1' && o.shopDone.actualAmount === 2100);
  ok('🔑 ...and the category chosen at the till', o.shopDone && o.shopDone.category === 'food');
}

// ── UNDO A PURCHASE, and DELETE A LIST ─────────────────────────────────────
{
  const S = require('../engine/shopping');
  // one item already bought (has an actual + a linked entry)
  const plan = S.planList(
    [{ id: 'i1', label: 'Sugar', quantity: 2, unit: 'Kg', status: 'done', actualAmount: 2100, entryId: 'e9' }],
    { sugar: { unitPrice: 1000, unit: 'Kg' } });
  const o = { shoppingLists: [{ id: 'sl1', name: 'Grocery', ...plan }] };
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkTab({ dataset: { tab: 'shopping' } }); await settle();
  await w.SelahActions.bkOpenList({ dataset: { id: 'sl1' } }); await settle();

  // 🔑 bought items are HIDDEN by default — the list is what is still to buy
  //    (the summary line still says "spent 2,100"; it is the ROWS that hide)
  ok('🔑 a bought item row is hidden by default', !D.querySelector('[data-action="bkShopUndo"]'));
  ok('...and offers to reveal them', !!D.querySelector('[data-action="bkToggleBought"]'));

  // reveal the bought items
  await w.SelahActions.bkToggleBought(); await settle();
  ok('showing bought items reveals the row + its actual amount',
     /2,100/.test([...D.querySelectorAll('#shopping-lists tbody tr')].map((t) => t.textContent).join(' ')));
  ok('🔑 a bought item offers Undo', !!D.querySelector('[data-action="bkShopUndo"]'));

  await w.SelahActions.bkShopUndo({ dataset: { list: 'sl1', id: 'i1' } }); await settle();
  ok('🔑 undo POSTs to the undo endpoint', /\/shopping\/sl1\/items\/i1\/undo$/.test(o.shopUndone || ''));

  // delete the whole list — guarded by a confirm, which we auto-approve here
  w.confirm = () => true;
  await w.SelahActions.bkDelList({ dataset: { id: 'sl1' } }); await settle();
  ok('🔑 deleting a list DELETEs it', /\/shopping\/sl1$/.test(o.listDeleted || ''));
}

// ── THE LEDGER PUTS RECENT ENTRIES AT THE TOP ──────────────────────────────
section('🧾 LEDGER — most recent first, and today\'s newest above today\'s older');
{
  const es = [
    { id: 'e1', direction: 'out', label: 'Older today',  actual: 100, status: 'unplanned', occurredOn: '2026-07-15', createdAt: '2026-07-15T08:00:00.000Z', accountId: 'a1' },
    { id: 'e2', direction: 'out', label: 'Newer today',  actual: 200, status: 'unplanned', occurredOn: '2026-07-15', createdAt: '2026-07-15T17:00:00.000Z', accountId: 'a1' },
    { id: 'e3', direction: 'out', label: 'Yesterday',    actual: 300, status: 'unplanned', occurredOn: '2026-07-14', createdAt: '2026-07-14T09:00:00.000Z', accountId: 'a1' },
  ];
  const { w, D } = boot(booksFetch({ entries: es }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  const labels = [...D.querySelectorAll('#bk-ledger tbody tr td.wide')].map((td) => td.textContent);
  ok('🔑 the latest date is at the top', labels[0] === 'Newer today' || labels[0] === 'Older today');
  ok('🔑 within a day, the most recently recorded is above the older one', labels.indexOf('Newer today') < labels.indexOf('Older today'));
  ok('...and yesterday sits below today', labels.indexOf('Yesterday') > labels.indexOf('Newer today'));
}

// ── SAVINGS — the emergency fund (its own account), plus other savings ──────
section('🌱 SAVINGS — the emergency fund is its own account, and the runway measures it');
{
  const savings = { ok: true,
    emergencyFund: 4_000_000, hasEmergencyFund: true,
    emergencyAccounts: [{ name: 'My cushion', type: 'emergency_fund', amount: 4_000_000, liquid: true }],
    otherLiquid: [{ name: 'Unity SACCO', type: 'sacco', amount: 3_000_000, liquid: true }], otherLiquidTotal: 3_000_000,
    longTerm: 5_000_000, longTermAccounts: [{ name: 'Fixed depo', type: 'fixed_deposit', amount: 5_000_000, liquid: false }],
    totalSaved: 12_000_000, monthlyOutgoings: 2_000_000, knowMonthly: true, runwayMonths: 2,
    resilience: { level: 1, maxLevel: 4, key: 'one', label: 'One month',
      blurb: 'One month between you and a bad week. Aim for three.', months: 2,
      next: { key: 'three', label: 'Three months', atMonths: 3, needMore: 2_000_000 },
      ladder: [
        { key: 'none',  label: 'No cushion yet',        atMonths: 0,  reached: true,  current: false },
        { key: 'one',   label: 'One month',             atMonths: 1,  reached: true,  current: true  },
        { key: 'three', label: 'Three months',          atMonths: 3,  reached: false, current: false },
        { key: 'six',   label: 'Six months',            atMonths: 6,  reached: false, current: false },
        { key: 'year',  label: 'A year — and investing', atMonths: 12, reached: false, current: false },
      ] },
    gamification: { streak: { current: 3, best: 4, savedThisMonth: true, says: '3 months running. This is the habit now.' },
      badges: { count: 3, total: 12,
        earned: [{ key: 'first_save', label: 'First shilling saved', blurb: 'x' }, { key: 'ef_opened', label: 'Emergency fund opened', blurb: 'x' }, { key: 'streak_3', label: 'Three months running', blurb: 'x' }],
        locked: [{ key: 'saved_1m', label: '1,000,000 saved', blurb: 'x' }], next: { key: 'saved_1m', label: '1,000,000 saved', blurb: 'A million shillings, kept.' } } },
    invest: {
      ladder: { rung: 'short', headline: 'Short-term, still reachable', guidance: 'Keep it low-risk and accessible.', fits: ['mmf', 'tbill'], runwayMonths: 2, hasEmergencyFund: true },
      vehicles: [
        { key: 'tbill', name: 'Treasury bill', category: 'Short-term', liquidity: 'held 91–364 days', risk: 'very low', grossReturnRange: [12, 12], netReturnRange: [9.6, 9.6], taxWorking: '12% before tax, 20% withheld → 9.6% net', providers: ['Bank of Uganda', 'a broker'] },
        { key: 'mmf', name: 'Money market fund', category: 'Buffer', liquidity: '2–5 days', risk: 'low', grossReturnRange: [11, 13], netReturnRange: [11, 13], taxWorking: 'Quoted net of tax and fees.', providers: ['UAP Old Mutual', 'Sanlam'] },
        { key: 'tbond', name: 'Treasury bond', category: 'Long-term', liquidity: '2–20 years', risk: 'low', grossReturnRange: [12, 16], netReturnRange: [9.6, 12.8], taxWorking: 'x', providers: ['Bank of Uganda'] },
      ],
      disclaimer: 'Information, not advice. Selah is not a licensed financial adviser, this is not a recommendation to buy any product, and it is not a solicitation.',
      verifiedOn: '2026-07-22' },
    note: null };
  const { w, D } = boot(booksFetch({ savings }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkTab({ dataset: { tab: 'savings' } }); await settle();

  const sv = () => D.getElementById('bk-savings').textContent;

  // 🔑 SUMMARY strip — the snapshot, always on top
  ok('🔑 the summary shows total saved, emergency fund, runway, goals and streak',
     /Total saved/.test(sv()) && /12,000,000/.test(sv()) && /Emergency fund/.test(sv()) && /Runway/.test(sv()) && /Goals/.test(sv()) && /Streak/.test(sv()));

  // 🔑 default sub-tab is the Emergency fund — its balance, months covered, ladder
  ok('🔑 the Emergency fund section shows the balance and months covered', /4,000,000/.test(sv()) && /Covers/.test(sv()) && /2 months/.test(sv()));
  ok('🔑 the resilience ladder shows where you are', /you are here/.test(sv()) && /2,000,000 UGX more into your emergency fund/.test(sv()));

  // 🔑 the Accounts sub-tab lists the accounts you save in
  w.SelahActions.svView({ dataset: { view: 'accounts' } }); await settle();
  ok('🔑 the Accounts sub-tab shows the accounts you save in, and the total',
     /The accounts you save in/.test(sv()) && /Unity SACCO/.test(sv()) && /Fixed depo/.test(sv()) && /12,000,000/.test(sv()));

  // 🎮 the Streak & badges sub-tab
  w.SelahActions.svView({ dataset: { view: 'momentum' } }); await settle();
  ok('🎮 the Streak sub-tab shows the streak and earned badges',
     /saving streak/i.test(sv()) && /months in a row/.test(sv()) && /Three months running/.test(sv()) && /Next up/.test(sv()));

  // 💡 INVEST is its OWN tab now, not part of Savings
  ok('🔴 the investment ladder is NOT on the Savings tab', !/Where your money could work/.test(sv()));
  await w.SelahActions.bkTab({ dataset: { tab: 'invest' } }); await settle();
  const iv = D.getElementById('bk-invest').textContent;
  ok('💡 the Invest tab names real Ugandan options with the after-tax return',
     /Where your money could work/.test(iv) && /Treasury bill/.test(iv) && /UAP Old Mutual/.test(iv) && /9.6%/.test(iv) && /After tax/.test(iv));
  ok('🔑 vehicles that FIT the current rung are flagged', /fits you now/.test(iv));
  ok('🔴 the Invest tab says plainly this is information, not advice',
     /not.*licensed financial adviser/i.test(iv) && /not a recommendation|not a solicitation/i.test(iv));
}

// 🔑 savings but NO emergency-fund account → nudge to open one, other savings still shown
{
  const savings = { ok: true,
    emergencyFund: 0, hasEmergencyFund: false, emergencyAccounts: [],
    otherLiquid: [{ name: 'Unity SACCO', type: 'sacco', amount: 3_000_000, liquid: true }], otherLiquidTotal: 3_000_000,
    longTerm: 0, longTermAccounts: [],
    totalSaved: 3_000_000, monthlyOutgoings: 2_000_000, knowMonthly: true, runwayMonths: 0, resilience: null,
    note: 'Your emergency fund lives in its own account. Add an “Emergency fund” account and move money into it — three to six months of expenses, kept for emergencies only.' };
  const { w, D } = boot(booksFetch({ savings }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkTab({ dataset: { tab: 'savings' } }); await settle();
  const v = () => D.getElementById('bk-savings').textContent;
  ok('🔑 with no emergency-fund account, it says the fund lives in its own account', /No emergency fund yet/.test(v()) && /its own account/.test(v()));
  ok('...and offers to add one', !!D.querySelector('#bk-savings [data-action="goAccounts"]'));
  w.SelahActions.svView({ dataset: { view: 'accounts' } }); await settle();
  ok('...while still showing the other savings you do have', /Unity SACCO/.test(v()));
}

// 🎯 GOALS — a target, a date, the monthly, and a projection
{
  const savings = { ok: true,
    emergencyFund: 4_000_000, hasEmergencyFund: true,
    emergencyAccounts: [{ name: 'Cushion', type: 'emergency_fund', amount: 4_000_000, liquid: true }],
    otherLiquid: [], otherLiquidTotal: 0, longTerm: 0, longTermAccounts: [],
    totalSaved: 4_000_000, monthlyOutgoings: 2_000_000, knowMonthly: true, runwayMonths: 2,
    resilience: { level: 1, maxLevel: 4, key: 'one', label: 'One month', blurb: 'x', months: 2,
      next: { key: 'three', label: 'Three months', atMonths: 3, needMore: 2_000_000 },
      ladder: [{ key: 'one', label: 'One month', atMonths: 1, reached: true, current: true }] },
    goals: [
      { id: 'g1', name: 'Laptop', accountId: 'a9', accountName: 'Absa Savings', target: 1_200_000, saved: 300_000, remaining: 900_000,
        pct: 25, reached: false, targetDate: '2026-12-21', requiredMonthly: 180_000, onTrack: false,
        projectedFinish: '2027-03-01', says: 'x', overdue: false },
    ],
    note: null };
  const o = { savings, mine: { ok: true, accounts: [{ id: 'a9', name: 'Absa Savings', type: 'savings', bookId: 'b1' }, { id: 'a1', name: 'MTN MoMo', type: 'mobile_money', bookId: 'b1' }], types: {} } };
  const { w, D } = boot(booksFetch(o));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkTab({ dataset: { tab: 'savings' } }); await settle();
  w.SelahActions.svView({ dataset: { view: 'goals' } }); await settle();

  const v = D.getElementById('bk-savings').textContent;
  ok('🎯 a goal shows its name, progress and required monthly', /Laptop/.test(v) && /300,000 of 1,200,000/.test(v) && /180,000/.test(v));
  ok('🔴 the projection is labelled a projection, not a promise', /a projection, not a promise/.test(v));
  ok('the backing-account picker is filled with savings accounts', !!D.querySelector('#goal-acct option[value="a9"]'));

  // create a goal → it POSTs target + date
  D.getElementById('goal-name').value = 'Land deposit';
  D.getElementById('goal-target').value = '5000000';
  D.getElementById('goal-date').value = '2027-07-01';
  D.getElementById('goal-acct').value = 'a9';
  await w.SelahActions.goalAdd(); await settle();
  ok('🎯 adding a goal POSTs its target, date and backing account',
     o.goalAdded && o.goalAdded.target === 5000000 && o.goalAdded.targetDate === '2027-07-01' && o.goalAdded.accountId === 'a9');

  // 💰 CONTRIBUTE to a goal — money moves from a source account into the goal's account
  ok('💰 a goal with an account offers Contribute', !!D.querySelector('[data-action="goalContribToggle"][data-id="g1"]'));
  w.SelahActions.goalContribToggle({ dataset: { id: 'g1' } }); await settle();
  ok('...the source picker lists the Book\'s OTHER accounts, not the goal\'s own',
     !!D.querySelector('#cf-from-g1 option[value="a1"]') && !D.querySelector('#cf-from-g1 option[value="a9"]'));
  D.getElementById('cf-amt-g1').value = '250000';
  D.getElementById('cf-from-g1').value = 'a1';
  await w.SelahActions.goalContribute({ dataset: { id: 'g1' } }); await settle();
  ok('💰 contributing POSTs the amount and the source account', o.contributed && o.contributed.amount === 250000 && o.contributed.fromAccountId === 'a1');
}

// nothing at all → a nudge, not a blank
{
  const { w, D } = boot(booksFetch({ savings: { ok: true, totalSaved: 0, hasEmergencyFund: false } }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkTab({ dataset: { tab: 'savings' } }); await settle();
  ok('🔑 with nothing saved, it nudges you to set up an account',
     /No savings in this Book yet/.test(D.getElementById('bk-savings').textContent));
}

// 🔴 emergency fund exists but no month cost → shows the fund, runway not invented
{
  const savings = { ok: true, emergencyFund: 1_000_000, hasEmergencyFund: true, emergencyAccounts: [{ name: 'Cushion', type: 'emergency_fund', amount: 1_000_000, liquid: true }],
    otherLiquid: [], otherLiquidTotal: 0, longTerm: 0, longTermAccounts: [],
    totalSaved: 1_000_000, knowMonthly: false, runwayMonths: null, resilience: null,
    note: 'Confirm a month of spending in your Books, and Selah can tell you how many months your emergency fund covers.' };
  const { w, D } = boot(booksFetch({ savings }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkTab({ dataset: { tab: 'savings' } }); await settle();
  const v = D.getElementById('bk-savings').textContent;
  ok('🔴 with no month cost, the runway is not invented — it says why', /Confirm a month of spending/.test(v));
  ok('...but the fund you hold is still shown', /1,000,000/.test(v));
}

// ── THE "FORECASTED ITEMS" LIST — recurring buys that are due ───────────────
section('🔮 SHOPPING FORECAST — a "Forecasted Items" list, built from your history');
{
  const S = require('../engine/shopping');
  // sugar bought 5×, ~every 12 days, last 13 days ago → overdue and priced
  const buysEvery = (n, gap, endDaysAgo, qty) => {
    const end = Date.parse('2026-07-15T00:00:00Z') - endDaysAgo * 86400000;
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push({ asOf: new Date(end - i * gap * 86400000).toISOString().slice(0, 10), quantity: qty });
    return out;
  };
  const forecast = S.forecastDue(
    [{ key: 'sugar', label: 'Sugar', unit: 'Kg', unitPrice: 1000, purchases: buysEvery(5, 12, 13, 2) }],
    { asOf: '2026-07-15' });

  const { w, D } = boot(booksFetch({ shoppingLists: [], forecast }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkTab({ dataset: { tab: 'shopping' } }); await settle();

  // 🔑 it appears as a LIST in the index, named "Forecasted Items"
  const index = D.getElementById('shopping-lists').textContent;
  ok('🔑 "Forecasted Items" is a list in the index', /Forecasted Items/.test(index));
  ok('...the index summarises how many are due, not the items themselves', /1 likely due/.test(index) && !/Bought 5 times/.test(index));

  // 🔑 open it → every forecast item is listed
  await w.SelahActions.bkOpenList({ dataset: { id: '__forecast__' } }); await settle();
  const detail = D.getElementById('shopping-lists').textContent;
  ok('opening the list shows the forecast items', /Sugar/.test(detail));
  ok('🔑 it shows the estimated cost from the price book (2 × 1,000)', /2,000/.test(detail));
  ok('🔑 it shows its working — how often, how long since', /Bought 5 times/.test(detail));
  ok('🔴 it says out loud that it is a guess, not a list you must buy', /a guess, not a list you must buy/.test(detail));
  ok('there is a way back to all lists', !!D.querySelector('[data-action="bkCloseList"]'));
}

// an empty history still shows the list, but it forecasts nothing and says why
{
  const S = require('../engine/shopping');
  const forecast = S.forecastDue([], { asOf: '2026-07-15' });
  const { w, D } = boot(booksFetch({ shoppingLists: [], forecast }));
  await settle();
  await w.SelahActions.goBooks(); await settle();
  await w.SelahActions.bkOpen(D.querySelector('[data-action="bkOpen"]')); await settle();
  await w.SelahActions.bkTab({ dataset: { tab: 'shopping' } }); await settle();
  ok('🔮 the "Forecasted Items" list is present even with no history', /Forecasted Items/.test(D.getElementById('shopping-lists').textContent));
  ok('...and says nothing is due', /nothing due right now/.test(D.getElementById('shopping-lists').textContent));
  await w.SelahActions.bkOpenList({ dataset: { id: '__forecast__' } }); await settle();
  ok('🔴 opened with no history it is honest and empty, not invented',
     /Not enough history yet to forecast/.test(D.getElementById('shopping-lists').textContent));
}


console.log(fail === 0
  ? `\x1b[32m✓ ALL ${pass} INDIVIDUAL-LAYER TESTS PASSED\x1b[0m`
  : `\x1b[31m✗ ${fail} FAILED\x1b[0m, ${pass} passed`);
if (fail) failures.forEach((f) => console.log('  ✗ ' + f));
console.log('═'.repeat(60));
process.exit(fail ? 1 : 0);
})();
