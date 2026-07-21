/**
 * SELAH — THEME + THE THINGS THAT USED TO BE INLINE
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THIS FILE EXISTS BECAUSE OUR OWN SECURITY POLICY WAS KILLING THE PRODUCT.
 *
 * nginx.conf sets:
 *
 *     Content-Security-Policy: ... script-src 'self' ...
 *
 * With no 'unsafe-inline', a browser REFUSES TO RUN:
 *
 *     — every  <script> ... </script>  block with no src
 *     — every  onclick="..."  oninput="..."  onerror="..."  attribute
 *
 * All of it. Silently. The console logs a CSP violation and the page just sits
 * there.
 *
 * So the theme bootstrap never ran, the theme toggle never bound, "Browse all 18
 * calculators" did nothing, and "Start again" did nothing — BUT ONLY WHEN SERVED
 * FROM THE CONTAINER. Open the file directly from disk and everything works,
 * because there is no CSP header on a file:// URL.
 *
 * "Works on my machine" again, wearing a different hat.
 *
 * AND NO TEST COULD SEE IT. jsdom does not enforce Content-Security-Policy. Our
 * 68 UI assertions clicked every button and every one of them fired — in an
 * environment that does not have the security header that breaks them.
 *
 * THE LESSON, AND IT IS NOT "ADD 'unsafe-inline'":
 *
 *   The CSP is right. Inline handlers are exactly what it exists to stop, and
 *   weakening it to make our buttons work would be trading a real security
 *   control for a convenience we do not need.
 *
 *   The code was wrong. So: NOTHING IS INLINE, ANYWHERE. Ever. And build.js now
 *   REFUSES TO BUILD a page that contains an inline script or an on* attribute —
 *   because a policy you cannot enforce is a policy you do not have.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── 1. THE BOOTSTRAP. Must run before first paint, or the page flashes white.
//       This file is loaded from <head>, render-blocking, with no defer. That is
//       deliberate: it is two lines, and a flash of white on a slow Ugandan
//       connection looks like a broken site.
(function () {
  var saved = null;
  try { saved = localStorage.getItem('selah-theme'); } catch (e) { /* private mode */ }
  document.documentElement.dataset.theme =
    (saved === 'light' || saved === 'dark') ? saved : 'dark';   // dark is the default
})();

// ── 2. THE TOGGLE. Delegated, so it works on every page without knowing which
//       page it is on — and survives any re-render.
document.addEventListener('click', function (e) {
  if (!e.target.closest('#theme')) return;

  var root = document.documentElement;
  var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;

  try { localStorage.setItem('selah-theme', next); } catch (e) { /* private mode */ }

  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = next === 'dark' ? '#0A0F0D' : '#F7F9F8';
});

// ── 3. THE IMAGE FALLBACK, which used to be an onerror="" attribute — and was
//       therefore also refused by the CSP.
//
//       The home page ships graceful placeholders behind every photograph. If a
//       photo is missing, the <picture> removes itself and the placeholder shows
//       through. With onerror blocked, a missing photo left a BROKEN IMAGE ICON
//       sitting on top of the placeholder that was designed to replace it.
document.addEventListener('DOMContentLoaded', function () {
  var imgs = document.querySelectorAll('.ph img');
  for (var i = 0; i < imgs.length; i++) {
    (function (img) {
      var drop = function () {
        var pic = img.closest('picture');
        if (pic) pic.remove(); else img.remove();
      };
      img.addEventListener('error', drop);
      // An image that already failed before this script ran fires no event.
      if (img.complete && img.naturalWidth === 0) drop();
    })(imgs[i]);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. THE ACTION DISPATCHER — what `onclick="doThing()"` used to be.
//
// A page declares data-action="doThing". A script registers SelahActions.doThing.
// The two never meet inside a string, so nothing has to be valid HTML and valid
// JavaScript at the same time — which is the only real fix, because escaping is
// something you can forget and structure is not.
// ─────────────────────────────────────────────────────────────────────────────
window.SelahActions = window.SelahActions || {};

document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-action]');
  if (!el) return;
  var fn = window.SelahActions[el.dataset.action];
  if (typeof fn === 'function') { e.preventDefault(); fn(el); }
});

/**
 * The waiting list, on the Phase 2 and Phase 3 pages.
 *
 * 🔴 IT STORES NOTHING, AND THAT IS NOT A STUB — IT IS THE LAW.
 *
 * Uganda's Data Protection and Privacy Act s.9(1) makes financial data SPECIAL
 * PERSONAL DATA: processing is PROHIBITED BY DEFAULT. A digital lender's director
 * was personally convicted on 10 July 2025 for failing to register with the PDPO.
 *
 * We are not registered yet. So this form collects a phone number, thanks the
 * person, and DOES NOT TRANSMIT OR PERSIST IT ANYWHERE. The page says so, out
 * loud, in the hint text underneath.
 *
 * When someone wires this up to a backend, they must first read
 * SELAH-FOUNDATIONS-SPEC-v2.md §3 and confirm the PDPO registration is done.
 */
window.SelahActions.joined = function () {
  var ok = document.getElementById('ok');
  if (ok) ok.hidden = false;
  var phone = document.getElementById('phone');
  if (phone) phone.value = '';   // nothing is kept. Not in memory, not anywhere.
};
