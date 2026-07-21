/**
 * SELAH — THE SIGN-IN FORM, FOR BOTH DOORS
 * ─────────────────────────────────────────────────────────────────────────────
 * individual.html and organisation.html have identical sign-in behaviour and
 * differ in exactly one thing: the `kind` they claim to be. So it is written once.
 * Two copies of an auth form is two places for a security fix to be forgotten.
 *
 * The page sets `window.SELAH_KIND` before loading this file.
 *
 * 🔴 THE PASSWORD NEVER LEAVES THIS FUNCTION.
 * It is not put in a variable that outlives the call, not stored, not logged, not
 * written to localStorage, and not left in the DOM after a successful sign-in.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  const API = window.SelahAPI;
  const A = (window.SelahActions = window.SelahActions || {});
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const KIND = () => window.SELAH_KIND || 'individual';
  const STEPS = ['step-login', 'step-register', 'step-forgot'];

  function step(which) {
    STEPS.forEach((s) => { const el = $(s); if (el) el.hidden = s !== which; });
    const m = $('signin-msg'); if (m) m.textContent = '';
  }
  A.showLogin    = () => step('step-login');
  A.showRegister = () => step('step-register');
  A.showForgot   = () => step('step-forgot');

  const say = (html) => { const m = $('signin-msg'); if (m) m.innerHTML = html; };
  const plain = (t) => { const m = $('signin-msg'); if (m) m.textContent = t; };

  /**
   * Render a refusal from the server, in its own words.
   *
   * ═══════════════════════════════════════════════════════════════════════════
   * 🔴 THIS FUNCTION ONCE RENDERED NOTHING AT ALL, AND THAT IS THE WORST THING A
   *    FUNCTION LIKE THIS CAN DO.
   *
   * It built the message out of `headline`, `why` and `whatYouCanDoNow`. Every
   * refusal WE write has those. But a 500 from an unhandled exception does not. A
   * database error does not. A missing migration does not. A proxy timeout does
   * not. In every one of those cases this produced an EMPTY STRING — so the
   * "Creating your account…" text was replaced by nothing, and the page just sat
   * there, looking exactly like a hang.
   *
   * The user clicked a button and the software said nothing. Not an error — a
   * SILENCE. And silence is the one response that gives a person no way to tell
   * the difference between "it is still working", "it is broken" and "I did
   * something wrong".
   *
   * So: this function is now INCAPABLE of saying nothing. If the server sends no
   * words, we say so, and we print the status code — because a person reporting
   * "it says 500" can be helped, and a person reporting "nothing happens" cannot.
   * ═══════════════════════════════════════════════════════════════════════════
   */
  function speak(r) {
    const parts = [];
    if (r.headline) parts.push('<strong>' + esc(r.headline) + '</strong>');
    else if (r.message) parts.push('<strong>' + esc(r.message) + '</strong>');
    (r.why || []).forEach((w) => parts.push('<p>' + esc(w) + '</p>'));
    (r.whatYouCanDoNow || []).forEach((w) => parts.push('<p class="muted">' + esc(w) + '</p>'));
    if (r.warning) parts.push('<p class="warn">' + esc(r.warning) + '</p>');

    // 🔴 THE FLOOR. Nothing gets past here silently.
    if (!parts.length) {
      parts.push('<strong>That did not work, and the server did not say why.</strong>');
      parts.push('<p class="muted">' +
        (r.status ? 'It answered with a ' + esc(r.status) + '.' : 'It gave no answer we could read.') +
        (r.error ? ' (' + esc(r.error) + ')' : '') +
        ' This is our fault, not yours. Please try again — and if it keeps happening, tell us the number above.</p>');
    }
    say(parts.join(''));
  }

  // 🔑 `onSignedIn` is provided by the page (individual.js / organisation.js).
  const done = () => {
    // Clear the password out of the DOM the moment it is no longer needed.
    ['password', 'r-password'].forEach((id) => { const el = $(id); if (el) el.value = ''; });
    if (typeof window.SelahOnSignedIn === 'function') window.SelahOnSignedIn();
  };

  const handle = (r) => {
    if (!r) {                       // should be impossible. Say something anyway.
      say('<strong>That did not work, and we do not know why.</strong>');
      return false;
    }
    if (r.refused)  { if (window.SelahRenderRefused) window.SelahRenderRefused(r); return false; }
    if (r.offline)  { if (window.SelahRenderOffline) window.SelahRenderOffline(r); return false; }
    return true;
  };

  A.login = async () => {
    plain('Signing in…');
    const r = await API.login($('email').value.trim(), $('password').value, KIND());
    if (!handle(r)) return;

    // 🔴 The right password for the WRONG KIND of account. The server refused. Say
    // so — do not "helpfully" sign them in anyway.
    if (r.error === 'WRONG_ACCOUNT_KIND') {
      speak(r);
      const other = r.registeredAs === 'individual' ? 'individual.html' : 'organisation.html';
      const el = $('signin-msg');
      if (el) el.innerHTML += '<p class="muted"><a href="' + other + '">Go to the right page →</a></p>';
      return;
    }
    if (!r.ok) { speak(r); return; }
    done();
  };

  A.register = async () => {
    const email = $('r-email').value.trim();
    const password = $('r-password').value;

    plain('Creating your account…');
    const r = await API.register(email, password, KIND());
    if (!handle(r)) return;
    if (!r.ok) { speak(r); return; }

    // 🔑 SIGN THEM IN. They typed the password four seconds ago and it is still in
    // their hand — making them type it again to reach the very next screen is
    // friction with nothing on the other side of it.
    //
    // Note we sign in with the SAME `kind` this door registered under, so a company
    // account created here can never land on the personal screens.
    plain('Signing you in…');
    const s2 = await API.login(email, password, KIND());
    ['r-password', 'password'].forEach((id) => { const el = $(id); if (el) el.value = ''; });

    if (s2.ok) {
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 THE WARNING MUST SURVIVE THE REDIRECT.
      //
      // Signing them in automatically is better UX — and it very nearly THREW AWAY
      // the most honest sentence on the page. When no mail provider is configured,
      // the server says so in `warning`, and that used to be shown on the sign-in
      // screen. Auto sign-in carries the user straight past that screen.
      //
      // So a convenience improvement silently deleted the disclosure. It would
      // have shipped, and the user would have believed a confirmation email was on
      // its way to them. Nobody would ever have known.
      //
      // The note follows them onto the home screen instead.
      // ═══════════════════════════════════════════════════════════════════════
      const note = $('signup-note');
      if (note && (r.warning || r.checkYourEmail)) {
        note.hidden = false;
        note.innerHTML = r.checkYourEmail
          ? '<h3>Confirm your email</h3><p>We have sent a link to that address. You can use Selah in the meantime.</p>'
          : '<h3>We could not send you a confirmation email.</h3>' +
            '<p>' + esc(r.warning) + '</p>' +
            '<p class="muted">Your account is real and your data is safe. We are telling you this ' +
            'because we would rather admit it than let you wait for an email that nothing sent.</p>';
      }
      done();
      return;
    }

    // Created, but the sign-in did not take. Say so — do not leave them staring at
    // a form wondering whether the account exists.
    step('step-login');
    say('<strong>Your account was created, but we could not sign you in automatically.</strong>' +
        '<p class="muted">Please sign in below.</p>' +
        (r.warning ? '<p class="warn">' + esc(r.warning) + '</p>' : ''));
  };

  A.forgot = async () => {
    plain('Sending…');
    const r = await API.forgot($('f-email').value.trim());
    if (!handle(r)) return;
    // A 503 here is the honest one: no mail provider, so no link, and we say it.
    if (!r.ok) { speak(r); return; }
    say('<p>' + esc(r.message) + '</p>');
  };

  A.signOut = async () => {
    await API.signout();
    if (typeof window.SelahOnSignedOut === 'function') window.SelahOnSignedOut();
  };
})();
