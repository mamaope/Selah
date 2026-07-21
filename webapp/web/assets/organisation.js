/**
 * SELAH — THE ORGANISATION FRONT DOOR
 * ─────────────────────────────────────────────────────────────────────────────
 * A login wall, and nothing behind it yet — deliberately.
 *
 * The company screens (the calendar, the director trap, TCC readiness, the WHT
 * credit tracker) are all COMPUTED already; the engine does not care whether the
 * taxpayer is a person or a company. What is missing is the UI, and the honest
 * thing to do in the meantime is to say so on the screen rather than ship a
 * dashboard full of numbers we invented.
 *
 * 🔴 THE ONE THING THIS FILE MUST GET RIGHT
 *
 * A person and a company are SEPARATE ACCOUNTS. The session cookie does not say
 * which. So a director could sign in with their personal account, land here, and
 * be shown "your company" screens wired to THEIR OWN tax data — every figure real,
 * every figure the wrong taxpayer's. Nothing would look broken.
 *
 * So we ask the server what kind of account this is, and if it is a person we
 * REFUSE to render the company view. A valid session is not the same thing as the
 * RIGHT session.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  const API = window.SelahAPI;
  const A = (window.SelahActions = window.SelahActions || {});
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const VIEWS = ['refused', 'signin', 'home'];
  function show(name) {
    VIEWS.forEach((v) => { const el = $(`view-${v}`); if (el) el.hidden = v !== name; });
    window.scrollTo(0, 0);
  }

  // 🔑 The refusal gets the whole screen. Nothing went wrong — the law said no.
  function renderRefused(r) {
    show('refused');
    const lede = $('refused-lede');
    if (lede) lede.textContent = 'Not yet. And we would rather refuse you than break the law with your data.';
    const body = $('refused-body');
    if (body) body.innerHTML =
      '<div class="card refuse">' +
        '<h3>' + esc(r.headline || 'We cannot store your data yet.') + '</h3>' +
        (r.why || []).map((w) => '<p>' + esc(w) + '</p>').join('') +
        (r.whatYouCanDoNow || []).map((w) => '<p class="muted">' + esc(w) + '</p>').join('') +
        (r.whatWeAreDoing ? '<p>' + esc(r.whatWeAreDoing) + '</p>' : '') +
      '</div>';
  }

  function renderOffline(r) {
    show('refused');
    const lede = $('refused-lede');
    if (lede) lede.textContent = '';
    const body = $('refused-body');
    if (body) body.innerHTML =
      '<div class="card"><h3>' + esc(r.headline || 'We cannot reach Selah.') + '</h3>' +
      '<p>' + esc(r.detail || '') + '</p></div>';
  }

  const handle = (r) => {
    if (r.refused)   { renderRefused(r); return false; }
    if (r.offline)   { renderOffline(r); return false; }
    if (r.signedOut) { show('signin');   return false; }
    return true;
  };

  function renderHome(me) {
    show('home');
    const h = $('org-hello');
    if (h) h.textContent = 'You are signed in.';
  }


  // ── auth.js drives the sign-in form for BOTH doors. These are the hooks it calls.
  window.SELAH_KIND = 'entity';
  window.SelahRenderRefused = renderRefused;
  window.SelahRenderOffline = renderOffline;
  window.SelahOnSignedIn = () => renderHome();
  window.SelahOnSignedOut = () => { show('signin'); if (window.SelahActions.showLogin) window.SelahActions.showLogin(); };

  // ═══════════════════════════════════════════════════════════════════════════
  async function boot() {
    const c = await API.compliance();
    if (c.offline) { renderOffline(c); return; }

    if (!c.canStoreYourData) {
      const r = await API.me();
      if (r.refused) { renderRefused(r); return; }
    }

    const me = await API.me();
    if (me.refused)   { renderRefused(me); return; }
    if (me.offline)   { renderOffline(me); return; }
    if (me.signedOut) { show('signin'); return; }

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 FAIL CLOSED. THIS BLOCK IS AN AUTHENTICATION CONTROL.
    //
    // This code once said, in effect:
    //
    //     if (refused) stop; if (offline) stop; if (signedOut) stop;
    //     renderHome();                      // <-- everything else
    //
    // Three named failures were handled, and EVERY OTHER OUTCOME fell through to
    // "show them the private screens".
    //
    // It shipped, and it was found the only way things like this ever are: a
    // build failed, the running image had no /api proxy, so nginx answered
    // /api/me with a plain 404 — and the app showed the SIGNED-IN HOME SCREEN TO
    // A STRANGER. Not a crash. Not a blank page. The product, working, wide open.
    //
    // A 404 is not "signed out". Nor is a 500, a 502 from a dead API, a truncated
    // body, or a JSON payload that parsed but has no `me` in it. NONE of them are
    // proof of identity, and the ONLY thing that may open this door is proof of
    // identity.
    //
    // So: the door opens on ONE condition — `ok === true` AND a real `me` object.
    // Anything else, including things nobody has thought of yet, lands on the
    // sign-in screen. An auth check whose default branch is "let them in" is not
    // an auth check.
    // ═══════════════════════════════════════════════════════════════════════
    if (!me.ok || !me.me || !me.me.id) {
      show('signin');
      $('signin-msg').textContent = me.status
        ? `We could not confirm who you are (the server answered ${me.status}). Please sign in.`
        : 'We could not confirm who you are. Please sign in.';
      return;
    }


    // 🔴 A PERSONAL ACCOUNT, ON THE COMPANY PAGE. Valid session, wrong taxpayer.
    if (me.me && me.me.kind === 'individual') {
      show('signin');
      ['step-login', 'step-register', 'step-forgot'].forEach((x) => { $(x).hidden = true; });
      $('signin-msg').innerHTML =
        '<strong>This is a personal account.</strong>' +
        '<p>You are signed in, but these are the company screens. A company\'s ' +
        'obligations are not a person\'s, and we will not show you one wearing the ' +
        'label of the other.</p>' +
        '<p class="muted"><a href="individual.html">Go to the individuals page →</a></p>';
      return;
    }

    renderHome(me.me);
  }

  boot();
})();
