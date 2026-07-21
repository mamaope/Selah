/**
 * SELAH — THE ORGANISATION FRONT DOOR, IN A DOM
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE TEST THAT MATTERS: A VALID SESSION IS NOT THE SAME AS THE RIGHT SESSION.
 *
 * A person and a company are separate accounts. The session cookie does not say
 * which. So a director could sign in with their PERSONAL account, land on the
 * company page, and be shown "your company" screens wired to THEIR OWN tax data.
 * Every figure real. Every figure the wrong taxpayer's. Nothing looking broken.
 *
 * That is the failure this file exists to make impossible.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WEB = __dirname;
const cssText = ['tokens.css', 'home.css', 'visuals.css']
  .map((f) => { try { return fs.readFileSync(path.join(WEB, 'assets', f), 'utf8'); } catch { return ''; } })
  .join('\n');
const html = fs.readFileSync(path.join(WEB, 'organisation.html'), 'utf8')
  .replace('</head>', `<style>${cssText}</style></head>`);

let pass = 0, fail = 0;
const failures = [];
const ok = (n, c) => c ? (pass++, console.log(`  ✓ ${n}`)) : (fail++, failures.push(n), console.log(`  ✗ ${n}`));
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

function boot(fakeFetch) {
  const dom = new JSDOM(html, {
    runScripts: 'outside-only', pretendToBeVisual: true,
    url: 'http://localhost:8080/organisation.html',
  });
  const w = dom.window;
  w.scrollTo = () => {}; w.confirm = () => true; w.alert = () => {};
  w.fetch = fakeFetch;
  w.eval(fs.readFileSync(path.join(WEB, 'assets/theme.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(WEB, 'assets/api.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(WEB, 'assets/organisation.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(WEB, 'assets/auth.js'), 'utf8'));
  return { w, dom, D: w.document };
}
const json = (status, body) => Promise.resolve({
  status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body),
});
const settle = () => new Promise((r) => setTimeout(r, 30));
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const disp = (w, el) => w.getComputedStyle(el).display;

/** A server that is registered, and answers /me however the test says. */
function server(me, opts) {
  // `me` is reassigned by /auth/login — signing in must actually sign you in.
  const o = opts || {};
  return (url, init) => {
    const m = String((init && init.method) || 'GET');
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: true });
    if (url === '/api/me' && m === 'GET') {
      if (o.meStatus) return json(o.meStatus, o.meBody || {});
      if (!me) return json(401, { ok: false });
      return json(200, { ok: true, me });
    }
    if (url === '/api/auth/login') {
      o.sent = JSON.parse(init.body);
      if (o.loginResponse) return json(o.loginStatus || 200, o.loginResponse);
      me = { id: 'c1', kind: 'entity' };            // now signed in
      return json(200, { ok: true, kind: 'entity' });
    }
    if (url === '/api/auth/register') { o.sent = JSON.parse(init.body); return json(200, o.registerResponse || { ok: true, created: true, checkYourEmail: true }); }
    if (url === '/api/auth/forgot')   { o.sent = JSON.parse(init.body); return json(o.forgotStatus || 200, o.forgotResponse || { ok: true, sent: true, message: 'If that address has a Selah account, we have emailed a link.' }); }
    return json(200, { ok: true });
  };
}

(async () => {

// ═══════════════════════════════════════════════════════════════════════════
section('🔒 YOU MUST SIGN IN FIRST — nothing renders before you do');
{
  const { w, D } = boot(server(null));            // no session
  await settle();
  ok('a signed-out visitor lands on the SIGN-IN screen',
     disp(w, D.getElementById('view-signin')) !== 'none');
  ok('...and the company screens are NOT rendered behind it',
     disp(w, D.getElementById('view-home')) === 'none');
  ok('...and the page asks for an email and a password',
     !!D.getElementById('email') && D.getElementById('password').type === 'password');
  ok('...and offers a way to create an account and to recover one',
     !!D.querySelector('[data-action="showRegister"]') && !!D.querySelector('[data-action="showForgot"]'));
}

// ═══════════════════════════════════════════════════════════════════════════
section('🔴 A VALID SESSION IS NOT THE RIGHT SESSION');
{
  // A DIRECTOR'S PERSONAL ACCOUNT, on the company page. This is the one.
  const { w, D } = boot(server({ id: 'u1', kind: 'individual', phone: '+256700000001' }));
  await settle();

  ok('🔴 a PERSONAL account is NOT shown the company screens',
     disp(w, D.getElementById('view-home')) === 'none');
  ok('...and it is told plainly that this is a personal account',
     /This is a personal account/.test(D.getElementById('signin-msg').textContent));
  ok('...and it is pointed at the page it actually belongs on',
     !!D.querySelector('#signin-msg a[href="individual.html"]'));
  ok('...and it is NOT invited to just log in again on this door',
     D.getElementById('step-login').hidden === true);
}
{
  const { w, D } = boot(server({ id: 'c1', kind: 'entity', phone: '+256700000002' }));
  await settle();
  ok('a COMPANY account IS shown the company screens',
     disp(w, D.getElementById('view-home')) !== 'none' &&
     disp(w, D.getElementById('view-signin')) === 'none');
}

// ═══════════════════════════════════════════════════════════════════════════
section('SIGNING IN AS A COMPANY — email and password');
{
  const o = {};
  const { w, D } = boot(server(null, o));
  await settle();

  ok('the sign-in form asks for an email and a password',
     !!D.getElementById('email') && D.getElementById('password').type === 'password');

  D.getElementById('email').value = 'co@example.com';
  D.getElementById('password').value = 'a decent long password';
  await w.SelahActions.login(); await settle();

  ok('🔑 the organisation door signs in as kind = "entity", not "individual"',
     o.sent && o.sent.kind === 'entity');
  ok('...and the company lands on the signed-in screen',
     disp(w, D.getElementById('view-home')) !== 'none');
  ok('🔴 the password is cleared out of the DOM the moment it is used',
     D.getElementById('password').value === '');
}

section('CREATING AN ACCOUNT, AND THE HONEST EMAIL FAILURE');
{
  const o = { registerResponse: { ok: true, created: true, checkYourEmail: false,
    warning: 'Your account exists and you can sign in. We could NOT send you a confirmation email, because no mail provider is configured on this server.' } };
  const { w, D } = boot(server(null, o));
  await settle();

  w.SelahActions.showRegister();
  ok('there is a "create an account" form', D.getElementById('step-register').hidden === false);

  D.getElementById('r-email').value = 'new@example.com';
  D.getElementById('r-password').value = 'a decent long password';
  await w.SelahActions.register(); await settle();

  ok('the new account is created as an ENTITY from this door', o.sent.kind === 'entity');

  // 🔴 The user is now signed in and on the home screen. The disclosure must have
  // FOLLOWED THEM — auto sign-in must not quietly swallow the one honest sentence.
  const note = D.getElementById('signup-note');
  ok('🔴 the "we could not email you" disclosure survives the auto sign-in',
     note.hidden === false);
  ok('...we say plainly that no confirmation email could be sent',
     /could NOT send you a confirmation email/i.test(note.textContent));
  ok('🔴 ...and we never tell them to check an inbox',
     !/check your (email|inbox)/i.test(note.textContent));
}

section('🔴 FORGOT PASSWORD WITH NO MAIL PROVIDER — an honest 503, not a soothing lie');
{
  const o = { forgotStatus: 503, forgotResponse: { ok: false, error: 'MAIL_NOT_CONFIGURED',
    headline: 'We cannot reset your password, because we cannot send you an email.',
    why: ['We will not tell you to "check your inbox" for a message that nothing in this system ever tried to send.'] } };
  const { w, D } = boot(server(null, o));
  await settle();

  w.SelahActions.showForgot();
  D.getElementById('f-email').value = 'co@example.com';
  await w.SelahActions.forgot(); await settle();

  const msg = D.getElementById('signin-msg').textContent;
  ok('the refusal is shown in words', /cannot send you an email/i.test(msg));
  // Careful: the honest copy QUOTES the phrase "check your inbox" in order to
  // refuse to say it. So the test cannot just grep for the phrase — it must check
  // that the sentence is a REFUSAL to say it, not a claim.
  ok('🔴 ...and it does not CLAIM a link is on its way — it refuses to',
     /will not tell you/i.test(msg) && !/we have emailed a link/i.test(msg));
}

// ═══════════════════════════════════════════════════════════════════════════
section('🔴 THE SAME PHONE, THE OTHER KIND OF ACCOUNT — the server refuses, and we say so');
{
  const o = { loginStatus: 409, loginResponse: {
    ok: false, error: 'WRONG_ACCOUNT_KIND', registeredAs: 'individual', youAskedFor: 'entity',
    headline: 'This number is already your personal account.',
    why: ['On Selah, a person and a company are separate accounts. Your password is correct — but this is the wrong door.'],
    whatYouCanDoNow: ['Sign in on the individuals page.'],
  } };
  const { w, D } = boot(server(null, o));
  await settle();
  D.getElementById('email').value = 'me@example.com';
  D.getElementById('password').value = 'a decent long password';
  await w.SelahActions.login(); await settle();

  const msg = D.getElementById('signin-msg').textContent;
  ok('the refusal is shown in words, not as a generic "something went wrong"',
     /already your personal account/.test(msg));
  ok('...and it explains WHY: your password is right, but this is the wrong door',
     /separate accounts/.test(msg));
  ok('🔴 ...and we are NOT signed into the wrong taxpayer',
     disp(w, D.getElementById('view-home')) === 'none');
}

// ═══════════════════════════════════════════════════════════════════════════
section('THE PDPO GATE HOLDS ON THIS DOOR TOO');
{
  const gate = (url) => {
    if (url === '/api/compliance') return json(200, { ok: true, canStoreYourData: false });
    return json(451, {
      ok: false, refused: true,
      headline: 'We will not store your data, because we are not yet allowed to.',
      why: ['Uganda\'s Data Protection and Privacy Act makes financial data special personal data.'],
      whatYouCanDoNow: ['Every calculator on this site still works, and stores nothing.'],
    });
  };
  const { w, D } = boot(gate);
  await settle();
  ok('🔴 a 451 shows the REFUSAL screen, not a red error toast',
     disp(w, D.getElementById('view-refused')) !== 'none');
  ok('...and no sign-in form is offered for data we may not lawfully hold',
     disp(w, D.getElementById('view-signin')) === 'none');
  ok('...and the refusal explains the law rather than blaming the user',
     /not yet allowed to/.test(D.getElementById('refused-body').textContent));
}

// ═══════════════════════════════════════════════════════════════════════════
section('HONESTLY EMPTY — we do not invent a company dashboard');
{
  const { w, D } = boot(server({ id: 'c1', kind: 'entity' }));
  await settle();
  const home = D.getElementById('view-home').textContent;
  ok('the signed-in screen admits there is nothing on it yet',
     /nothing on this screen yet/i.test(home));
  ok('...and says why an invented number would be worse than an empty page',
     /invented number/i.test(home));
  ok('...and there is no fake "compliant" badge or made-up figure',
     !/UGX\s?[\d,]{4,}/.test(home));
  ok('...and it points at the calculators, which are real and store nothing',
     !!D.querySelector('a[href="calculators.html#all"]'));
}

// ═══════════════════════════════════════════════════════════════════════════
section('NO INLINE SCRIPT ANYWHERE — the CSP would kill it');
{
  const raw = fs.readFileSync(path.join(WEB, 'organisation.html'), 'utf8');
  ok('organisation.html has no on*= handlers', !/\son[a-z]+\s*=/i.test(raw));
  ok('organisation.html has no inline <script> block', !/<script(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>/i.test(raw));
}


// ═══════════════════════════════════════════════════════════════════════════
section('🔴 FAIL CLOSED — no unexpected response may open the company screens');
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
      ? json(200, { ok: true, me: { id: 'u1', kind: 'entity' } })
      : json(401, { ok: false });
    if (url === '/api/auth/register') { calls.push(['register', JSON.parse(init.body)]); return json(200, { ok: true, created: true, checkYourEmail: true }); }
    if (url === '/api/auth/login')    { calls.push(['login',    JSON.parse(init.body)]); signedIn = true; return json(200, { ok: true, kind: 'entity' }); }
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
  ok('...as the SAME kind of account the door registered', calls[1][1].kind === 'entity');
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


console.log(fail
  ? `\n\x1b[31m✗ ${fail} ORGANISATION TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n${failures.map((f) => '   ✗ ' + f).join('\n')}\n`
  : `\n\x1b[32m✓ ALL ${pass} ORGANISATION TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
})();
