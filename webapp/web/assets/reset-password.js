/** SELAH — the page the reset email links to. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const A = (window.SelahActions = window.SelahActions || {});
  const token = new URLSearchParams(window.location.search).get('token');

  if (!token) {
    $('r-form').hidden = true;
    $('r-msg').textContent = 'That link is incomplete — it has no reset token in it. Ask for a new one.';
  }

  A.doReset = async () => {
    $('r-msg').textContent = 'Changing your password…';
    const r = await window.SelahAPI.resetPass(token, $('np').value);
    $('np').value = '';                       // out of the DOM immediately
    if (r.ok) {
      $('r-form').hidden = true;
      $('r-msg').textContent = r.message;     // "...and every device has been signed out."
      return;
    }
    $('r-msg').textContent = (r.headline || r.message || 'That did not work.') +
      ((r.why || []).length ? ' ' + r.why.join(' ') : '');
  };
})();
