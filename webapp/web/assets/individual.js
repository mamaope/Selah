/**
 * SELAH — THE INDIVIDUAL LAYER
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 NO INLINE HANDLERS. The CSP forbids them, and it is right to. Everything
 *    here is data-action + a delegated listener, registered with the dispatcher
 *    in theme.js.
 *
 * 🔑 AND THE ENGINE IS THE SAME ENGINE. The trace that renders on this page is
 *    the trace the server produced, from the same rules the 408 tests run against.
 *    If the server and the browser could disagree about a Ugandan's tax, one of
 *    them is wrong and neither of us would know which.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  const S = window.Selah;
  const API = window.SelahAPI;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const VIEWS = ['refused', 'signin', 'home', 'payslips', 'wht', 'money', 'data', 'calendar', 'books', 'book', 'accounts', 'savings'];
  const SIGNED_IN = ['home', 'payslips', 'wht', 'money', 'data', 'calendar', 'books', 'book', 'accounts', 'savings'];

  // Which nav item lights up for which view. A sub-screen keeps its parent lit —
  // being three levels deep inside Books should still say BOOKS.
  const NAV_OF = { home: 'home', books: 'books', book: 'books', accounts: 'accounts', savings: 'savings',
                   calendar: 'calendar', data: 'data', payslips: 'home', wht: 'home', money: 'home' };

  function show(name) {
    VIEWS.forEach((v) => { $(`view-${v}`).hidden = v !== name; });
    const inApp = SIGNED_IN.includes(name);
    $('signout').hidden = !inApp;

    // 🔑 THE WHOLE COMPLAINT WAS "it is hard to know where what is."
    const nav = $('appnav');
    if (nav) {
      nav.hidden = !inApp;
      nav.querySelectorAll('[data-nav]').forEach((b) => {
        b.classList.toggle('active', b.dataset.nav === NAV_OF[name]);
      });
    }
    // 🔑 The Record button belongs to ONE screen — the inside of a Book. Showing it
    //    everywhere would be an action with no object.
    // 🔴 A dialog must NEVER survive the screen it belongs to. Hidden three ways,
    //    including an inline style, because a stale cached stylesheet is a user we
    //    cannot reach with a CSS fix.
    const sheet = $('sheet');
    if (sheet && name !== 'book') { sheet.hidden = true; sheet.style.display = 'none'; }

    window.scrollTo(0, 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 THE REFUSAL. It gets the whole screen, and it tells the truth.
  //
  // The lazy move is a red toast: "Something went wrong. Try again." That would
  // be a lie — nothing went wrong. The software did exactly what it was built to
  // do. A company whose product is "we tell you the truth about tax" cannot lie
  // to its own users about why its own login does not work.
  // ═══════════════════════════════════════════════════════════════════════════
  function renderRefused(r) {
    $('refused-lede').textContent = 'Not yet. And we would rather refuse you than break the law with your data.';
    $('refused-body').innerHTML = `
      <div class="refusal" style="max-width:760px">
        <span class="badge badge-f">451 · Unavailable For Legal Reasons</span>
        <h3>${esc(r.headline || 'We cannot store your data yet.')}</h3>
        ${(r.why || []).map((w) => `<p>${esc(w)}</p>`).join('')}

        <p class="lab">What still works, right now</p>
        ${(r.whatYouCanDoNow || []).map((w) => `<p>${esc(w)}</p>`).join('')}

        <p class="lab">What we are doing about it</p>
        <p>${esc(r.whatWeAreDoing || '')}</p>
      </div>

      <div class="hero-cta" style="margin-top:24px">
        <a class="btn-primary" href="calculators.html#all">Use the 37 calculators — they store nothing →</a>
        <span class="btn-note">Free. No account. No data.</span>
      </div>

      <p class="lede" style="margin-top:28px;font-size:15px;max-width:700px">
        <strong>This is not a bug, and it is not a placeholder.</strong> It is a gate we built
        into our own software, and it is the reason you can believe the rest of it.
      </p>`;
    show('refused');
  }

  function renderOffline(r) {
    $('refused-lede').textContent = '';
    $('refused-body').innerHTML = `
      <div class="refusal" style="max-width:640px">
        <h3>${esc(r.headline)}</h3>
        <p>${esc(r.detail)}</p>
        <button class="cta" data-action="boot">Try again</button>
      </div>`;
    show('refused');
  }

  /** Every API result funnels through here. A refusal is a state, not an error. */
  function handle(r) {
    if (r.refused)   { renderRefused(r); return false; }
    if (r.offline)   { renderOffline(r); return false; }
    if (r.signedOut) { show('signin'); return false; }
    return true;
  }

  // ── shared renderers ───────────────────────────────────────────────────────
  const money = (n) => S.fmt(n);
  const badge = (c) => {
    const m = { A: ['badge-a', 'A · primary law'], B: ['badge-b', 'B · corroborated'],
                C: ['badge-c', 'C · uncertain'],   F: ['badge-f', 'F · unknown'] };
    const [cls, txt] = m[c] || ['badge-n', c];
    return `<span class="badge ${cls}">${txt}</span>`;
  };
  const cite = (rule) => !rule ? '' : `
    <div class="cite">
      ${esc(rule.source.instrument)}, ${esc(rule.source.provision)}.
      <div class="badges">
        ${badge(rule.confidence)}
        <span class="badge badge-n">${esc(rule.id)}</span>
        <span class="badge badge-n">verified ${esc(rule.verifiedOn)}</span>
      </div>
    </div>`;
  const steps = (ss = []) => `<div class="steps">${ss.map((s) => {
    const v = s.tax != null ? money(s.tax) : (s.amount != null ? money(s.amount) : '');
    return `<div class="step"><span>${esc(s.band)}</span><span class="t">${v}</span></div>`
         + (s.note ? `<p class="step-note">${esc(s.note)}</p>` : '');
  }).join('')}</div>`;

  // ═══════════════════════════════════════════════════════════════════════════
  // THE HOME — one screen that says what to do next.
  //
  // 🔑 IT IS HONESTLY EMPTY ON THE FIRST VISIT. No demo data, no fake numbers,
  //    no "here's what it could look like". A product that shows you an invented
  //    finding has taught you to distrust its real ones.
  // ═══════════════════════════════════════════════════════════════════════════
  /**
   * 🔑 THE FIRST SCREEN OF AN EMPTY APP.
   *
   * A new person signs in and sees... doors. To what? They have no accounts, no
   * Books, nothing recorded. Every tile leads to an empty screen, and an empty
   * screen with no instruction is how a product gets abandoned in the first
   * ninety seconds.
   *
   * So the home screen ASKS THE APP what is actually missing, and says what to do
   * next — in order, with the done ones struck through. It disappears the moment
   * there is nothing left to set up.
   */
  async function renderNextStep() {
    const box = $('next-step');
    if (!box) return;

    const [accts, books] = await Promise.all([API.myAccounts(), API.books()]);
    if (accts.refused || books.refused) return;

    const hasAccounts = accts.ok && accts.accounts && accts.accounts.length > 0;
    const hasBooks = books.ok && books.books && books.books.length > 0;

    if (hasAccounts && hasBooks) { box.innerHTML = ''; return; }

    const step = (done, n, text, action) =>
      '<div class="step' + (done ? ' done' : '') + '">' +
        '<div class="n">' + (done ? '✓' : n) + '</div>' +
        '<div class="t">' + text +
          (!done && action ? ' <button class="link" data-action="' + action + '">Do it now →</button>' : '') +
        '</div>' +
      '</div>';

    box.innerHTML =
      '<div class="card ask">' +
        '<h3>Start here</h3>' +
        '<p class="muted">Two things, and then Selah can actually tell you something.</p>' +
        step(hasAccounts, 1, '<strong>Add an account</strong> — where your money actually sits. Cash, MTN MoMo, the bank.', 'goAccounts') +
        step(hasBooks, 2, '<strong>Create a Book</strong> — most people start with one called Home.', 'goBooks') +
      '</div>';
  }

  async function renderHome() {
    renderNextStep();
    renderDash();
    show('home');
    $('home-sub').textContent = 'Loading…';
    $('findings').innerHTML = '';

    const [pay, wht] = await Promise.all([API.checkPayslips(), API.credits()]);
    if (!handle(pay) || !handle(wht)) return;

    const cards = [];

    if (pay.finding && pay.finding.kind === 'OVER_DEDUCTED') {
      cards.push(`<div class="ob sev-green">
        <div class="ob-head"><div>
          <h3>Your employer has over-deducted your PAYE</h3>
          <span class="ob-sev">This may mean money BACK</span>
        </div></div>
        <div class="big" style="margin:10px 0"><span class="v">${money(pay.finding.amount)}</span><span class="u">UGX</span></div>
        <p class="ob-lab">Why this happens</p>
        <p class="ob-p">${esc(pay.finding.why)}</p>
        <p class="ob-lab">What you do</p>
        <p class="ob-p">${esc(pay.finding.whatYouDo)}</p>
        <div class="ob-foot">
          <a class="pc-link" href="${esc(pay.finding.evidenceUrl)}" target="_blank" rel="noopener">See URA's own page ↗</a>
          <button class="link" data-action="goPayslips">Show me the working →</button>
        </div>
      </div>`);
    } else if (pay.finding && pay.finding.kind === 'UNDER_DEDUCTED') {
      cards.push(`<div class="ob sev-amber">
        <div class="ob-head"><div>
          <h3>Your employer has UNDER-deducted your PAYE</h3>
          <span class="ob-sev">Not a windfall</span>
        </div></div>
        <div class="big" style="margin:10px 0"><span class="v">${money(pay.finding.amount)}</span><span class="u">UGX</span></div>
        <p class="ob-p">${esc(pay.finding.why)}</p>
        <div class="ob-foot"><button class="link" data-action="goPayslips">Show me the working →</button></div>
      </div>`);
    }

    if (wht.finding && wht.credits.atRisk > 0) {
      cards.push(`<div class="ob sev-red">
        <div class="ob-head"><div>
          <h3>URA is holding money that belongs to you</h3>
          <span class="ob-sev">You are about to pay tax twice</span>
        </div></div>
        <div class="big" style="margin:10px 0"><span class="v">${money(wht.credits.atRisk)}</span><span class="u">UGX at risk</span></div>
        <p class="ob-p">${esc(wht.finding.detail)}</p>
        <p class="ob-lab">What you do</p>
        <p class="ob-p">${esc(wht.finding.whatYouDo)}</p>
        <div class="ob-foot"><button class="link" data-action="goWht">Chase the certificates →</button></div>
      </div>`);
    }

    // 🔴 NO ESSAY. The old screen answered "nothing to show" with three paragraphs
    //    explaining why it was empty. That is not honesty, it is an apology — and a
    //    person who signed in to see their money does not want to read a manifesto.
    //    The principle survives; the lecture does not. An empty tile shows a DASH.
    $('home-sub').textContent = cards.length
      ? `${cards.length} thing${cards.length > 1 ? 's' : ''} you should know.`
      : 'Your money, your tax, and what needs doing.';
    $('findings').innerHTML = cards.join('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE DASHBOARD
  //
  // 🔴 A REAL FIGURE, OR A DASH. NEVER A PLACEHOLDER, NEVER A SAMPLE.
  //
  // The temptation on an empty dashboard is a plausible-looking number — a demo
  // net worth, a sample runway — so the screen "looks alive". Do that once and
  // every real figure you ever show is suspect. So: an empty tile reads "—", says
  // what to do, and stays quiet.
  // ═══════════════════════════════════════════════════════════════════════════
  const tile = (icon, key, value, sub, action, cls) =>
    '<button class="tile ' + (cls || '') + '" data-action="' + action + '">' +
      '<div class="ti">' + icon + '</div>' +
      '<div class="tk">' + esc(key) + '</div>' +
      '<div class="tv">' + value + '</div>' +
      '<div class="ts">' + esc(sub) + '</div>' +
    '</button>';

  const ugx = (n) => (n == null ? '—' : Number(n).toLocaleString());

  async function renderDash() {
    const box = $('dash');
    if (!box) return;

    const [h, cal] = await Promise.all([
      API.health(),
      API.calendar().catch(() => ({ ok: false })),
    ]);
    if (h.refused) return;              // the PDPO screen has already taken over

    const t = [];

    // ── NET WORTH ─────────────────────────────────────────────────────────
    const nw = (h.ok && h.netWorth) || {};
    if (!h.ok || !nw.perCurrency || !nw.perCurrency.length) {
      t.push(tile('💰', 'Net worth', '—', 'Add an account to begin', 'goAccounts', 'empty-t'));
    } else if (nw.netWorth === null) {
      // 🔴 Two currencies, no rate. There IS no single figure, and we do not invent one.
      t.push(tile('💰', 'Net worth', nw.perCurrency.map((c) => esc(c.formatted)).join('<br>'),
        'Two currencies — no rate, no single total', 'goAccounts'));
    } else {
      t.push(tile('💰', 'Net worth', ugx(nw.netWorth),
        'You own ' + ugx(nw.assets) + ' · you owe ' + ugx(nw.debts),
        'goAccounts', nw.netWorth < 0 ? 'bad' : ''));
    }

    // ── THIS MONTH ────────────────────────────────────────────────────────
    const per = (h.ok && h.period) || null;
    if (!per || !per.count) {
      t.push(tile('📕', 'This month', '—', 'Nothing recorded yet', 'goBooks', 'empty-t'));
    } else {
      t.push(tile('📕', 'This month', ugx(per.net),
        ugx(per.income) + ' in · ' + ugx(per.spend) + ' out',
        'goBooks', per.net < 0 ? 'bad' : 'good'));
    }

    // ── RUNWAY ────────────────────────────────────────────────────────────
    const ef = (h.ok && h.emergencyFund) || {};
    if (ef.refused || ef.months == null) {
      t.push(tile('🛟', 'Runway', '—', 'Confirm a month of spending first', 'goBooks', 'empty-t'));
    } else {
      t.push(tile('🛟', 'Runway', ef.months + '<span class="ts" style="display:inline"> months</span>',
        ef.verdict, 'goAccounts', ef.months < 3 ? 'bad' : ef.months >= 6 ? 'good' : ''));
    }

    // ── THE NEXT TAX DATE. Nobody in Uganda will remind you. ───────────────
    const d = cal.ok && cal.calendar && !cal.calendar.refused && (cal.calendar.deadlines || [])[0];
    if (!d) {
      t.push(tile('📅', 'Next tax date', '—', 'Tell us what you owe and we will count it down', 'goCalendar', 'empty-t'));
    } else {
      t.push(tile('📅', 'Next tax date', esc(d.countdown),
        d.label + ' · ' + d.prettyDue, 'goCalendar', d.urgency === 'now' ? 'bad' : ''));
    }

    box.innerHTML = t.join('');
  }

  // ── PAYSLIPS ───────────────────────────────────────────────────────────────
  async function renderPayslips() {
    show('payslips');
    const r = await API.checkPayslips();
    if (!handle(r)) return;
    const out = $('out-payslips');

    if (!r.months.length) {
      out.innerHTML = `<div class="result"><p class="cap">Nothing yet</p>
        <p class="because">Add a payslip. We will recompute the PAYE from the gazetted Act and show you the difference — line by line.</p></div>`;
      return;
    }

    out.innerHTML = `<div class="out">
      ${r.finding ? `<div class="result">
        <p class="cap">${r.finding.kind === 'CORRECT' ? 'Your PAYE is correct' : 'The finding'}</p>
        ${r.finding.amount ? `<div class="big"><span class="v">${money(r.finding.amount)}</span><span class="u">UGX</span></div>` : ''}
        <p class="because">${esc(r.finding.headline)}</p>
        ${r.finding.why ? `<p class="step-note" style="margin-top:10px">${esc(r.finding.why)}</p>` : ''}
      </div>` : ''}

      ${r.months.map((m) => `
        <div class="result">
          <p class="cap">${esc(String(m.period).slice(0, 7))}${m.employer ? ' · ' + esc(m.employer) : ''}</p>
          <div class="step"><span>Gross</span><span class="t">${money(m.gross)}</span></div>
          ${steps(m.steps)}
          <div class="step total"><span>PAYE the law requires</span><span class="t">${money(m.shouldBe)}</span></div>
          ${m.deducted != null ? `
            <div class="step"><span>PAYE they actually deducted</span><span class="t">${money(m.deducted)}</span></div>
            <div class="step total"><span>${m.variance > 0 ? 'OVER-deducted' : m.variance < 0 ? 'UNDER-deducted' : 'Correct'}</span>
              <span class="t">${money(Math.abs(m.variance))}</span></div>` : ''}
          ${cite(m.rule)}
        </div>`).join('')}
    </div>`;
  }

  // ── WHT ────────────────────────────────────────────────────────────────────
  function fillWhtTypes() {
    const sel = $('wi-type');
    if (sel.options.length) return;
    sel.innerHTML = S.RULES.WHT_2026.rates
      .filter((r) => r.resident != null)
      .map((r) => `<option value="${esc(r.key)}">${esc(r.label)}</option>`).join('');
  }

  async function renderWht() {
    show('wht');
    fillWhtTypes();
    const r = await API.credits();
    if (!handle(r)) return;
    const out = $('out-wht');
    const c = r.credits;

    if (!r.lines.length) {
      out.innerHTML = `<div class="result"><p class="cap">Nothing yet</p>
        <p class="because">Add the invoices you raised to Government or to large companies. They withheld 6% — and that is <strong>your money</strong>, sitting with URA.</p></div>`;
      return;
    }

    out.innerHTML = `<div class="out">
      <div class="result">
        <p class="cap">URA is holding, on your behalf</p>
        <div class="big"><span class="v">${money(c.withheld)}</span><span class="u">UGX</span></div>
        <p class="because">You hold <strong>${c.certificatesHeld} of ${c.certificatesExpected}</strong> certificates.</p>
        <div class="step"><span>Claimable — you have the certificate</span><span class="t">${money(c.claimable)}</span></div>
        <div class="step total"><span>🔴 AT RISK — no certificate</span><span class="t">${money(c.atRisk)}</span></div>
      </div>

      ${c.atRisk > 0 ? `<div class="result cannot">
        <p class="cap">Chase these, today</p>
        ${r.finding.chase.map((x) => `
          <div class="step"><span>${esc(x.client || 'client')} · ${esc(String(x.date).slice(0,10))}</span>
            <span class="t">${money(x.withheld)}</span></div>`).join('')}
        <p class="step-note" style="margin-top:12px">
          We have drafted the letter. It is in <strong>health-check/02-WHT-CERTIFICATE-REQUEST.md</strong>.
          It works because <em>they</em> are the ones exposed if they withheld and did not remit.
        </p>
      </div>` : ''}

      <div class="result">
        <p class="cap">Your invoices</p>
        ${r.lines.map((l) => `
          <div class="step">
            <span>${esc(l.client || '—')} · ${money(l.amount)}${l.isFinalTax ? ' · FINAL tax' : ''}</span>
            <span class="t">${money(l.withheld)} ${l.certificateHeld ? '✓' : '🔴'}</span>
          </div>`).join('')}
        <p class="step-note">✓ = certificate held. 🔴 = you cannot claim it.</p>
      </div>

      ${(r.notes || []).map((n) => `<div class="alert alert-info">${esc(n)}</div>`).join('')}
    </div>`;
  }

  // ── MONEY ──────────────────────────────────────────────────────────────────
  async function renderMoney() {
    show('money');
    const r = await API.money();
    if (!handle(r)) return;
    const out = $('out-money');

    if (!r.items.length) {
      out.innerHTML = `<div class="result"><p class="cap">Nothing yet</p>
        <p class="because">Add your take-home pay and what you spend. We will compute the rest — and the debt plan uses the same engine that tells you a flat 18% loan is really 31%.</p></div>`;
      return;
    }

    out.innerHTML = `<div class="out">
      ${r.budget ? `<div class="result">
        <p class="cap">${r.budget.result >= 0 ? 'Left over each month' : 'SHORT each month'}</p>
        <div class="big"><span class="v">${money(r.budget.result)}</span><span class="u">UGX</span></div>
        ${steps(r.budget.steps)}
        ${(r.budget.warnings || []).map((w) => `<div class="alert ${w.severity === 'high' ? 'alert-danger' : 'alert-info'}">${esc(w.text)}</div>`).join('')}
      </div>` : ''}

      ${r.netWorth ? `<div class="result">
        <p class="cap">Net worth</p>
        <div class="big"><span class="v">${money(r.netWorth.result)}</span><span class="u">UGX</span></div>
        ${steps(r.netWorth.steps)}
      </div>` : ''}

      ${r.debtPlan ? `<div class="result">
        <p class="cap">Debt-free in</p>
        <div class="big"><span class="v">${r.debtPlan.result}</span><span class="u">months</span></div>
        <p class="because">${esc(r.debtPlan.whatTheNumbersFavour.caveat)}</p>
      </div>` : ''}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MY DATA — the DPPA rights, in the product, not in a support ticket.
  // ═══════════════════════════════════════════════════════════════════════════
  async function renderData() {
    show('data');
    const [me, audit] = await Promise.all([API.me(), API.myAudit()]);
    if (!handle(me) || !handle(audit)) return;

    $('out-data').innerHTML = `<div class="out">
      <div class="result">
        <p class="cap">What we hold about you</p>
        <div class="step"><span>Phone</span><span class="t">${esc(me.me.phone || '—')}</span></div>
        <div class="step"><span>Name</span><span class="t">${esc(me.me.name || '—')}</span></div>
        <div class="step"><span>TIN</span><span class="t">${esc(me.me.tin || '—')}</span></div>
        <div class="step"><span>With us since</span><span class="t">${esc(String(me.me.memberSince).slice(0, 10))}</span></div>
        <div class="step total"><span>Deleted automatically after</span><span class="t">${esc(me.me.yourDataWillBeDeletedAfter)}</span></div>
        <p class="step-note">Every one of those fields is encrypted before it touches our database.</p>
      </div>

      <div class="result">
        <p class="cap">🔑 Who has read your data</p>
        <p class="because">${esc(audit.statement)}</p>
        ${audit.entries.slice(0, 25).map((e) => `
          <div class="step">
            <span>${esc(String(e.at).slice(0, 19).replace('T', ' '))} · ${esc(e.action)} · ${esc(e.entity)}</span>
            <span class="t">${e.was_you ? 'you' : '🔴 NOT YOU'}</span>
          </div>`).join('')}
        <p class="step-note">If a row says it was not you, tell us immediately.</p>
      </div>

      <div class="result">
        <p class="cap">Take it, or destroy it</p>
        <p class="because">Both of these are your right, and neither needs our permission.</p>
        <div class="hero-cta" style="margin-top:14px">
          <a class="btn-primary" href="/api/me/export">Download everything we hold →</a>
        </div>
        <button class="cta" style="margin-top:14px;background:var(--red-600)" data-action="deleteMe">
          Delete my account and everything in it
        </button>
        <p class="step-note" style="margin-top:10px">
          <strong>Delete means delete.</strong> Not "deactivate", not "archive", not "retained for analytics".
          The rows go. One line survives in our audit log saying an erasure happened — it holds no personal
          data, and we need it to prove we did it.
        </p>
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const A = (window.SelahActions = window.SelahActions || {});

  A.boot = boot;
  // ═══════════════════════════════════════════════════════════════════════════
  // THE TAX CALENDAR
  //
  // 🔴 THE HARD PART OF THIS SCREEN IS NOT THE DATES. IT IS THE SILENCE.
  //
  // Uganda's tax system produces no notification event. Nothing arrives on the day
  // you fall out of compliance. The debt simply begins, at 2% a month, compounding,
  // and it keeps its own counsel for years — until the morning you need a tax
  // clearance certificate for a tender, and cannot have one.
  //
  // So this screen refuses to be a wall of dates. It shows, for each obligation:
  // WHEN, WHAT IT COSTS TO MISS, and — where the person has a live arrear — THE WAY
  // OUT, which is voluntary disclosure, and which is in URA's own published rules
  // and sold by nobody.
  // ═══════════════════════════════════════════════════════════════════════════
  async function renderCalendar() {
    show('calendar');
    $('cal-list').innerHTML = '<p class="muted">Reading the Act…</p>';

    const r = await API.calendar();
    if (r.refused)   return renderRefused(r);
    if (r.signedOut) return show('signin');
    if (r.offline)   return renderOffline(r);
    if (!r.ok)       { $('cal-list').innerHTML = '<p class="muted">We could not load your calendar.</p>'; return; }

    const cal = r.calendar || {};

    // The engine may REFUSE — e.g. a company claiming a substituted year of income
    // without saying which month it ends. A refusal is a first-class answer.
    if (cal.refused) {
      $('cal-list').innerHTML =
        '<div class="card refuse"><h3>' + esc(cal.question || 'We will not guess.') + '</h3>' +
        '<p>' + esc(cal.because || '') + '</p>' +
        (cal.weWillNot ? '<p class="warn">' + esc(cal.weWillNot) + '</p>' : '') +
        (cal.whatWouldUnblockThis ? '<p class="muted">What would unblock this: ' + esc(cal.whatWouldUnblockThis) + '</p>' : '') +
        '</div>';
    } else {
      const ds = cal.deadlines || [];

      if (!ds.length) {
        // 🔴 HONESTLY EMPTY. We do not invent a deadline to fill a screen.
        $('cal-list').innerHTML =
          '<div class="card"><h3>We have not placed a single date on this screen.</h3>' +
          '<p>That is not because you have no obligations. It is because you have not told us ' +
          'enough for us to know which ones are yours — and we will not guess at a tax deadline.</p></div>';
      } else {
        // GROUP BY DATE. Four monthly obligations land on the same 15th, and an
        // ungrouped list buries the annual ones behind them — which is how people
        // miss them in life, too. The screen must not repeat the failure.
        const byDate = [];
        for (const d of ds) {
          const g = byDate.find((x) => x.dueOn === d.dueOn);
          if (g) g.items.push(d); else byDate.push({ dueOn: d.dueOn, pretty: d.prettyDue, countdown: d.countdown, urgency: d.urgency, items: [d] });
        }

        $('cal-list').innerHTML = byDate.map((g) => (
          '<div class="card cal-' + esc(g.urgency) + '">' +
            '<div class="cal-when">' +
              '<strong>' + esc(g.pretty) + '</strong>' +
              '<span class="cal-count' + (g.urgency === 'now' ? ' urgent' : '') + '">' + esc(g.countdown) + '</span>' +
            '</div>' +
            '<ul class="cal-items">' + g.items.map((d) => (
              '<li><span class="cal-label">' + esc(d.label) + '</span>' +
              (d.covers ? '<span class="muted"> — ' + esc(d.covers) + '</span>' : '') +
              (d.basis ? '<div class="src">' + esc(d.basis) + '</div>' : '') +
              '</li>'
            )).join('') + '</ul>' +
            '<p class="warn cal-cost">Miss it: ' + esc(g.items[0].penaltyIfMissed) + '</p>' +
          '</div>'
        )).join('');
      }

      // THE UNASKED QUESTIONS
      const un = cal.weDidNotAsk || [];
      $('cal-unasked').hidden = un.length === 0;
      $('cal-questions').innerHTML = un.map((q) => (
        '<div class="card ask">' +
          '<p>' + esc(q.why) + '</p>' +
          '<div class="row">' +
            '<button class="primary" data-action="calYes" data-key="' + esc(q.key) + '">Yes, that\'s me</button>' +
            '<button class="ghost"   data-action="calNo"  data-key="' + esc(q.key) + '">No</button>' +
          '</div>' +
        '</div>'
      )).join('');

      const cannot = cal.whatWeCannotTellYou || [];
      $('cal-cannot').innerHTML = cannot.map((c) => '<li>' + esc(c) + '</li>').join('');
      $('cal-src').textContent = cal.source
        ? cal.source.instrument + ' · confidence ' + cal.confidence + ' · verified ' + cal.verifiedOn
        : '';
    }

    // ── THE DIRECTOR TRAP ────────────────────────────────────────────────────
    const trap = r.directorTrap;
    const box = $('cal-trap');
    if (!trap) { box.hidden = true; return; }
    box.hidden = false;

    if (trap.refused) {
      box.innerHTML =
        '<div class="card refuse"><h3>' + esc(trap.question) + '</h3>' +
        '<p>' + esc(trap.because) + '</p>' +
        '<p class="warn">' + esc(trap.weWillNot) + '</p>' +
        '<p class="muted">' + esc(trap.whatWouldUnblockThis) + '</p></div>';
      return;
    }

    box.innerHTML =
      '<div class="card ' + (trap.blocksTCC ? 'refuse' : '') + '">' +
        '<h3>' + esc(trap.headline) + '</h3>' +
        '<p>' + esc(trap.whyThisIsInvisible) + '</p>' +
        (trap.arrearsWarning
          ? '<p class="warn">' + esc(trap.arrearsWarning.text) +
            ' <span class="src">(confidence ' + esc(trap.arrearsWarning.confidence) + ' — we do not know, and neither does anybody who says they do)</span></p>'
          : '') +
        '<ul>' + (trap.whatToDoNow || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '</div>';
  }

  // Answering an unasked question. `null` was never "no" — now it is an answer.
  const FLAG = { prov_ind: 'hasNonEmploymentIncome', paye: 'employsPeople', nssf: 'employsPeople',
                 wht: 'isWithholdingAgent', vat: 'vatRegistered', final: 'filesIncomeTax', lst: 'employsPeople' };
  async function answer(el, value) {
    const field = FLAG[el.dataset.key];
    if (!field) return;
    const r = await API.saveProfile({ [field]: value });
    if (r.refused) return renderRefused(r);
    await renderCalendar();
  }
  A.calYes = (el) => answer(el, true);
  A.calNo  = (el) => answer(el, false);
  A.goCalendar = renderCalendar;

  A.goHome = renderHome;
  A.goPayslips = renderPayslips;
  A.goWht = renderWht;
  A.goMoney = renderMoney;
  A.goSavings = renderSavings;

  // 🌱 SAVINGS — runway, the resilience ladder, and what you actually hold.
  async function renderSavings() {
    show('savings');
    const r = await API.savings();
    if (!handle(r)) return;
    const out = $('out-savings');

    if (!r.totalSaved) {
      out.innerHTML = `<div class="result"><p class="cap">No savings yet</p>
        <p class="because">Saving is money you move into an account and do not spend. Add a savings account — a SACCO, a fixed deposit, a separate MoMo — and record a transfer into it. Your runway and your resilience will build from there.</p>
        <button class="cta" data-action="goAccounts">Set up an account →</button></div>`;
      return;
    }

    const res = r.resilience;

    const runway = r.knowMonthly
      ? `<div class="result">
           <p class="cap">Runway — how long your liquid savings would last</p>
           <div class="big"><span class="v">${r.runwayMonths}</span><span class="u">months</span></div>
           ${res ? `<p class="because">${esc(res.blurb)}</p>` : ''}
         </div>`
      : `<div class="result"><p class="cap">Runway</p><p class="because">${esc(r.note || '')}</p></div>`;

    const ladder = res ? `<div class="result">
        <p class="cap">Your resilience — <strong>${esc(res.label)}</strong> (level ${res.level} of ${res.maxLevel})</p>
        <div style="display:flex;flex-direction:column;gap:.35rem;margin:.6rem 0">
          ${res.ladder.slice().reverse().map((rung) => `
            <div style="display:flex;align-items:center;gap:.6rem;opacity:${rung.reached ? '1' : '.45'}">
              <span style="width:1.1rem;height:1.1rem;border-radius:50%;flex:0 0 auto;background:${rung.reached ? 'var(--emerald-600)' : 'var(--border-str)'};box-shadow:${rung.current ? '0 0 0 3px var(--emerald-100, rgba(16,185,129,.25))' : 'none'}"></span>
              <span style="font-weight:${rung.current ? '700' : '400'}">${esc(rung.label)}</span>
              ${rung.current ? '<span class="pill ok">you are here</span>' : ''}
            </div>`).join('')}
        </div>
        ${res.next
          ? `<p class="because">Next rung: <strong>${esc(res.next.label)}</strong> — ${res.next.needMore != null ? ugx(res.next.needMore) + ' UGX more in liquid savings.' : 'keep adding to your buffer.'}</p>`
          : `<p class="because">Top of the ladder. Money past this point is money that can be put to work.</p>`}
      </div>` : '';

    const rows = (list) => list.map((a) =>
      `<tr><td style="padding-left:1.2rem" class="src">${esc(a.name)}</td><td class="num">${ugx(a.amount)}</td></tr>`).join('');

    const holdings = `<div class="result">
        <p class="cap">What you hold</p>
        <div class="tablewrap"><table class="t"><tbody>
          <tr><td><strong>Buffer</strong> — reachable next month</td><td class="num"><strong>${ugx(r.liquid)}</strong></td></tr>
          ${rows(r.liquidAccounts)}
          <tr><td><strong>Longer-term</strong> — locked or working</td><td class="num"><strong>${ugx(r.longTerm)}</strong></td></tr>
          ${rows(r.longTermAccounts)}
          <tr class="tot"><td><strong>Total saved</strong></td><td class="num"><strong>${ugx(r.totalSaved)}</strong></td></tr>
        </tbody></table></div>
        <p class="src">Runway counts only the buffer — the money you could actually reach next month. Land, fixed deposits and shares are real savings, but you cannot spend them tomorrow, so they never inflate your runway.</p>
      </div>`;

    out.innerHTML = `<div class="out">${runway}${ladder}${holdings}</div>`;
  }

  A.goData = renderData;


  A.addPayslip = async () => {
    const r = await API.addPayslip({
      period: $('ps-period').value + '-01',
      employer: $('ps-employer').value,
      gross: Number($('ps-gross').value),
      payeDeducted: $('ps-paye').value ? Number($('ps-paye').value) : null,
    });
    if (!handle(r)) return;
    renderPayslips();
  };

  A.addInvoice = async () => {
    const r = await API.addInvoice({
      invoiceDate: $('wi-date').value,
      client: $('wi-client').value,
      amount: Number($('wi-amount').value),
      paymentType: $('wi-type').value,
      certificateHeld: $('wi-cert').checked,
    });
    if (!handle(r)) return;
    renderWht();
  };

  A.addMoney = async () => {
    const rate = Number($('mn-rate').value);
    const r = await API.addMoney({
      kind: $('mn-kind').value,
      label: $('mn-label').value,
      amount: Number($('mn-amount').value),
      meta: rate ? { annualRate: rate / 100 } : null,
    });
    if (!handle(r)) return;
    renderMoney();
  };

  A.deleteMe = async () => {
    if (!confirm('This deletes your account and everything in it. It cannot be undone. Continue?')) return;
    const r = await API.deleteMe();
    if (!handle(r)) return;
    alert(r.statement + '\n\n' + r.whatRemains);
    show('signin');
  };

  // ── auth.js drives the sign-in form for BOTH doors. These are the hooks it calls.
  window.SELAH_KIND = 'individual';
  window.SelahShow = show;          // books.js drives its own views through this
  window.SelahRenderRefused = renderRefused;
  window.SelahRenderOffline = renderOffline;
  window.SelahOnSignedIn = () => renderHome();
  window.SelahOnSignedOut = () => { show('signin'); if (window.SelahActions.showLogin) window.SelahActions.showLogin(); };

  // ═══════════════════════════════════════════════════════════════════════════
  async function boot() {
    // 🔑 Ask the server, honestly, whether it is even allowed to hold your data.
    const c = await API.compliance();
    if (c.offline) { renderOffline(c); return; }

    if (!c.canStoreYourData) {
      // Force the refusal screen from the real endpoint, so the wording is the
      // server's, not a copy we might let drift.
      const r = await API.me();
      if (r.refused) { renderRefused(r); return; }
    }

    const me = await API.me();
    if (me.refused)  { renderRefused(me); return; }
    if (me.offline)  { renderOffline(me); return; }
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


    // 🔴 THIS IS A COMPANY ACCOUNT, ON THE PERSONAL PAGE.
    //
    // The session is valid. Every endpoint would answer. The screens would render
    // — with the COMPANY's figures under headings that say "your payslip" and
    // "your money". Nothing would look broken. That is precisely what makes it
    // dangerous, and why a valid session is not the same as the RIGHT session.
    if (me.me && me.me.kind === 'entity') {
      $('signin-msg').innerHTML =
        '<strong>This is a company account.</strong>' +
        '<p>You are signed in, but these are the personal screens. A company\'s ' +
        'obligations are not a person\'s, and we will not show you one wearing the ' +
        'label of the other.</p>' +
        '<p class="muted"><a href="organisation.html">Go to the organisations page →</a></p>';
      show('signin');
      ['step-login', 'step-register', 'step-forgot'].forEach((x) => { $(x).hidden = true; });
      return;
    }

    renderHome();
  }

  boot();
})();
