/** SELAH — the page the confirmation email links to. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const token = new URLSearchParams(window.location.search).get('token');

  (async () => {
    if (!token) {
      $('v-head').textContent = 'That link is incomplete.';
      $('v-body').textContent = 'It has no confirmation token in it. Ask us to send you a fresh one.';
      return;
    }
    const r = await window.SelahAPI.verifyEmail(token);
    if (r.ok) {
      $('v-head').textContent = 'Your email is confirmed.';
      $('v-body').textContent = 'That is all — you can sign in.';
      return;
    }
    // 🔴 A dead link is a dead link. We do not "helpfully" confirm anyway.
    $('v-head').textContent = r.headline || 'That link did not work.';
    $('v-body').textContent = (r.why || ['It may have expired, or already been used.']).join(' ');
  })();
})();
