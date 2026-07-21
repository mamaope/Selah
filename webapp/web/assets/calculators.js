/**
 * SELAH — the renderer.
 *
 * 🔴 THIS FILE RENDERS TRACES. IT DOES NOT PRODUCE THEM.
 * Delete it and the reasoning is still correct — just unstyled.
 *
 * ── THE SHAPE OF THE PRODUCT ─────────────────────────────────────────────────
 *
 *   1. THE GUIDE      → plain questions. No tax words.
 *   2. YOUR TAXES     → what applies to you, WHY, WHEN, and what if you don't.
 *   3. THE WORKING    → the calculator, behind the answer. Not in front of it.
 *
 * A tab bar reading "PAYE · Presumptive · WHT · VAT" is useless to someone who
 * doesn't know whether they're a presumptive taxpayer. That is the ignorance
 * this company exists to fix — an interface must not assume it away.
 */

const S = window.Selah;
const $ = (id) => document.getElementById(id);
const n = (id) => Number($(id).value) || 0;
const b = (id) => $(id).checked;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ═════════════════════════════════════════════════════════════════════════════
// 1 · THE GUIDE
// ═════════════════════════════════════════════════════════════════════════════

let answers = {};
let profile = null;

function visibleQuestions() {
  return S.QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

// 🔴 NO INLINE HANDLERS. Not here either.
//
// The quiz is the FRONT DOOR — it is the first thing a Ugandan taxpayer touches.
// It was building its buttons the same way the calculator directory did:
//
//     onclick="setA('${q.key}','${o.v}')"
//
// A single apostrophe or double quote in a question's option value shatters that
// attribute and silently kills the button. It has not happened yet only because
// no option value has contained one YET. That is luck, not design — and the
// calculator centre already proved how that ends.
//
// Data attributes. Delegated listeners. Nothing is asked to be HTML and
// JavaScript at the same time.
function renderQuiz() {
  const qs = visibleQuestions();
  $('quiz').innerHTML = qs.map((q) => {
    const v = answers[q.key];
    if (q.type === 'choice') {
      return `<div class="q">
        <p class="qt">${esc(q.q)}</p>
        <div class="qopts">${q.options.map((o) =>
          `<button class="qbtn ${v === o.v ? 'on' : ''}" data-q="${esc(q.key)}" data-v="${esc(o.v)}">${esc(o.label)}</button>`).join('')}</div>
      </div>`;
    }
    if (q.type === 'bool') {
      return `<div class="q">
        <p class="qt">${esc(q.q)}</p>
        ${q.hint ? `<p class="qh">${esc(q.hint)}</p>` : ''}
        <div class="qopts">
          <button class="qbtn ${v === true ? 'on' : ''}"  data-q="${esc(q.key)}" data-v="true"  data-bool>Yes</button>
          <button class="qbtn ${v === false ? 'on' : ''}" data-q="${esc(q.key)}" data-v="false" data-bool>No</button>
        </div>
      </div>`;
    }
    return `<div class="q">
      <p class="qt">${esc(q.q)}</p>
      ${q.hint ? `<p class="qh">${esc(q.hint)}</p>` : ''}
      <input type="number" step="1000000" value="${v || ''}" placeholder="0" data-qnum="${esc(q.key)}">
    </div>`;
  }).join('')
  + `<button class="cta" id="quiz-go" ${answers.who ? '' : 'disabled'}>Show me my taxes</button>`;
}

// The quiz's own listeners. Delegated, so they survive every re-render.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#quiz .qbtn');
  if (btn) { setA(btn.dataset.q, btn.hasAttribute('data-bool') ? btn.dataset.v === 'true' : btn.dataset.v); return; }
  if (e.target.closest('#quiz-go')) showResult();
});
document.addEventListener('input', (e) => {
  const num = e.target.closest('[data-qnum]');
  if (num) setA(num.dataset.qnum, Number(num.value) || 0, true);  // keepFocus — don't re-render mid-type
});

function setA(k, v, keepFocus) {
  answers[k] = v;
  if (!keepFocus) renderQuiz();
  else { // don't re-render while typing a number
    const btn = document.querySelector('#quiz .cta');
    if (btn) btn.disabled = !answers.who;
  }
}

function restart() {
  // Clearing the hash must never be able to break the page. In some contexts
  // (and in jsdom) replaceState throws; the URL is cosmetic, the app is not.
  setHash('');
  answers = {}; profile = null;
  $('view-guide').hidden = false;
  $('view-result').hidden = true;
  $('view-calc').hidden = true;
  renderQuiz();
  window.scrollTo(0, 0);
}

// ═════════════════════════════════════════════════════════════════════════════
// 2 · YOUR TAXES — what applies, why, when, and what if you don't
// ═════════════════════════════════════════════════════════════════════════════

const SEV = {
  critical:            ['sev-red',   'You are personally on the hook'],
  money_owed_to_you:   ['sev-green', 'This may mean money BACK'],
  must_file:           ['sev-amber', 'You must file this'],
  often_missed:        ['sev-amber', 'Almost everyone misses this'],
  check:               ['sev-gray',  'Check it — someone else does it for you'],
  watch:               ['sev-gray',  'Not yet — but watch it'],
  nil:                 ['sev-green', 'You pay nothing — but still file'],
  foundation:          ['sev-gray',  'Do this first'],
};

function showResult() {
  profile = S.taxProfile(answers, new Date());
  $('view-guide').hidden = true;
  $('view-result').hidden = false;
  $('view-calc').hidden = true;

  $('result-title').textContent = `${profile.obligations.length} things apply to you`;
  $('result-sub').textContent = profile.summary;

  const soon = profile.obligations.filter((o) => o.daysUntil !== null && o.daysUntil <= 45);

  $('obligations').innerHTML =
    (soon.length ? `<div class="alert alert-warn" style="margin-bottom:14px">
      <strong>${soon.length} deadline${soon.length > 1 ? 's' : ''} within 45 days.</strong>
      The nearest is <strong>${esc(soon[0].name)}</strong>, due ${esc(soon[0].nextDueLabel)} — that is ${soon[0].daysUntil} days away.
    </div>` : '')
    + profile.obligations.map(obligationCard).join('');

  window.scrollTo(0, 0);
}

function obligationCard(o) {
  const [cls, sevLabel] = SEV[o.severity] || ['sev-gray', ''];
  return `<div class="ob ${cls}">
    <div class="ob-head">
      <div>
        <h3>${esc(o.name)}</h3>
        <span class="ob-sev">${esc(sevLabel)}</span>
      </div>
      ${o.nextDueLabel ? `<div class="ob-due">
        <div class="ob-date">${esc(o.nextDueLabel)}</div>
        <div class="ob-days">${o.daysUntil < 0 ? 'OVERDUE' : o.daysUntil + ' days'}</div>
      </div>` : ''}
    </div>

    <p class="ob-lab">What it is</p>
    <p class="ob-p">${esc(o.what)}</p>

    <p class="ob-lab">Why it applies to <em>you</em></p>
    <p class="ob-p ob-why">${esc(o.why)}</p>

    <p class="ob-lab">When</p>
    <p class="ob-p">${esc(o.when)}</p>

    <p class="ob-lab">What you have to do</p>
    <p class="ob-p">${esc(o.yourJob)}</p>

    <p class="ob-lab">If you don't</p>
    <p class="ob-p ob-miss">${esc(o.miss)}</p>

    ${o.alert ? `<div class="alert alert-warn" style="margin-top:12px">${esc(o.alert)}</div>` : ''}

    <div class="ob-foot">
      ${o.rule ? `<span class="badge badge-n">${esc(o.rule.source.instrument)}, ${esc(o.rule.source.provision)}</span>
                  <span class="badge badge-${o.rule.confidence.toLowerCase()}">${esc(o.rule.confidence)}</span>
                  <span class="badge badge-n">verified ${esc(o.rule.verifiedOn)}</span>` : ''}
      ${o.calc ? `<button class="link" data-calc="${esc(o.calc)}" data-title="${esc(o.name)}">Show me the working →</button>` : ''}
    </div>
  </div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3 · THE WORKING — the calculator, behind the answer
// ═════════════════════════════════════════════════════════════════════════════

function showCalc(which, title) {
  cameFrom = $('view-index').hidden ? 'result' : 'index';
  $('view-result').hidden = true;
  $('view-index').hidden = true;
  $('view-guide').hidden = true;
  $('view-calc').hidden = false;
  document.querySelectorAll('#view-calc .panel').forEach((p) => (p.hidden = true));

  const panel = $(`panel-${which}`);
  const render = renderers[which];

  // 🔴 A BLANK PAGE IS THE WORST POSSIBLE FAILURE, because it tells the user
  // nothing and it tells us nothing. If a calculator is listed in the directory
  // but its panel or its renderer is missing, SAY SO — do not sit there empty.
  //
  // (This exists because a user reported "no calculators on the page" and I could
  // not reproduce it. I still could not. But a product whose entire claim is that
  // it refuses to fail silently must not fail silently.)
  if (!panel || typeof render !== 'function') {
    $('calc-title').textContent = 'This calculator did not load';
    $('calc-sub').textContent = '';
    const box = $('view-calc');
    let err = document.getElementById('calc-error');
    if (!err) {
      err = document.createElement('div');
      err.id = 'calc-error';
      err.className = 'panel';
      box.appendChild(err);
    }
    err.hidden = false;
    err.innerHTML = `<div class="refusal">
      <h3>Something is broken, and it is ours, not yours.</h3>
      <p>The calculator <strong>${esc(which)}</strong> is listed but did not load
         (${panel ? 'its code is missing' : 'its inputs are missing'}).</p>
      <p class="lab">What you should do</p>
      <p>Reload the page once. If it is still blank, your browser may be holding an
         old copy of our code — a hard refresh (Ctrl+Shift+R) will clear it.</p>
      <p class="lab">What we are doing</p>
      <p>This message exists so that a blank screen can never happen silently again.</p>
      <button class="cta" data-action="showIndex">Back to the calculators</button>
    </div>`;
    window.scrollTo(0, 0);
    return;
  }

  const errBox = document.getElementById('calc-error');
  if (errBox) errBox.hidden = true;

  panel.hidden = false;
  $('calc-title').textContent = title || 'The working';
  $('calc-sub').textContent = 'Every number below shows how it was reached, and cites the law it came from.';
  render();
  setHash(`calc=${which}`);   // deep link — bookmarkable, shareable
  window.scrollTo(0, 0);
}

// Where you came from. A back button that lies about it is worse than none.
let cameFrom = 'result';

function backToResult() {
  $('view-calc').hidden = true;
  if (cameFrom === 'index') { $('view-index').hidden = false; }
  else { $('view-result').hidden = false; }
  window.scrollTo(0, 0);
}

// ─── shared trace renderers ──────────────────────────────────────────────────

const badge = (c) => {
  const map = { A: ['badge-a', 'A · primary law'], B: ['badge-b', 'B · corroborated'],
                C: ['badge-c', 'C · uncertain'],   F: ['badge-f', 'F · unknown'] };
  const [cls, txt] = map[c] || ['badge-n', c];
  return `<span class="badge ${cls}">${txt}</span>`;
};

/** The citation block. Primary law. Act, section, gazette. Never a blog. */
const cite = (rule) => `
  <div class="cite">
    ${esc(rule.source.instrument)}, ${esc(rule.source.provision)}.
    ${rule.source.gazette ? esc(rule.source.gazette) + '.' : ''}
    <div class="badges">
      ${badge(rule.confidence)}
      <span class="badge badge-n">${esc(rule.id)}</span>
      <span class="badge badge-n">verified ${esc(rule.verifiedOn)}</span>
    </div>
  </div>`;

const alerts = (ws = []) => ws.map((w) => {
  const cls = w.severity === 'high' ? 'alert-danger' : w.severity === 'medium' ? 'alert-warn' : 'alert-info';
  const link = w.evidenceUrl ? ` <a href="${w.evidenceUrl}" target="_blank" rel="noopener">See for yourself</a>` : '';
  return `<div class="alert ${cls}">${esc(w.text)}${link}</div>`;
}).join('');

const steps = (ss = []) => `<div class="steps">${ss.map((s, i) => {
  const isTotal = i === ss.length - 1 && ss.length > 1 && s.tax !== null;
  const val = s.tax !== null && s.tax !== undefined ? S.fmt(s.tax) : (s.amount !== null ? S.fmt(s.amount) : '');
  return `<div class="step ${isTotal ? '' : ''}"><span>${esc(s.band)}</span><span class="t">${val}</span></div>`
       + (s.note ? `<p class="step-note">${esc(s.note)}</p>` : '');
}).join('')}</div>`;

/** 🔑 THE REFUSAL CARD. Every competitor returns a number here. We return the truth. */
const refusalCard = (t) => `
  <div class="refusal">
    ${badge(t.rule.confidence)}
    <h3>${esc(t.refusal.headline)}</h3>
    ${t.refusal.why.map((w) => `<p>${esc(w)}</p>`).join('')}
    <p class="lab">What we're doing about it</p>
    <p>${esc(t.refusal.whatWeAreDoing)}</p>
    <p class="lab">What you should do</p>
    <p>${esc(t.refusal.whatYouShouldDo)}</p>
    ${cite(t.rule)}
  </div>`;

const cta = (t) => t.nextAction ? `<button class="cta">${esc(t.nextAction.text)}</button>` : '';

// ─── PAYE ────────────────────────────────────────────────────────────────────

function renderPaye() {
  const gross = n('paye-gross');
  const res = $('paye-res').value;
  const full = b('paye-nssf');

  const t = full ? S.netPay(gross, { residence: res }) : S.paye(gross, res);
  const out = $('out-paye');

  if (t.refused) { out.innerHTML = refusalCard(t); return; }

  const p = full ? t.detail.paye : t;

  out.innerHTML = `<div class="out">
    <div class="result">
      <p class="cap">${full ? 'Net pay, this month' : 'PAYE, this month'}</p>
      <div class="big"><span class="v">${S.fmt(t.result)}</span><span class="u">UGX</span></div>
      <p class="because">Your first UGX 335,000 is tax-free. The rest is taxed in three steps — 20%, then 25%, then 30%.</p>
    </div>

    <div class="result">
      <p class="cap">The working</p>
      <div class="step"><span>Gross</span><span class="t">${S.fmt(gross)}</span></div>
      ${steps(p.steps)}
      <div class="step total"><span>PAYE</span><span class="t">${S.fmt(p.result)}</span></div>
      ${full ? `
        <div class="step"><span>NSSF — employee (5%)</span><span class="t">−${S.fmt(t.detail.employeeNssf)}</span></div>
        <div class="step"><span>Local Service Tax (annual ÷ 12)</span><span class="t">−${S.fmt(t.detail.lstAnnual / 12)}</span></div>
        <div class="step total"><span>Net pay</span><span class="t">${S.fmt(t.result)}</span></div>` : ''}
      ${p.comparison ? `<div class="alert alert-good" style="margin-top:14px">
        Under the old bands you would have paid ${S.fmt(p.comparison.result)}. ${esc(p.comparison.meaning)}
      </div>` : ''}
      ${cite(full ? t.rule : p.rule)}
    </div>

    ${full && t.rule.limitedBy ? `<div class="result cannot">
      <p class="cap">Why this is not rated A</p>
      <p class="ob-p">
        Your <strong>PAYE and NSSF are certain</strong> — verified against primary law.
        We have <em>not</em> verified the ${esc(t.rule.limitedBy.label)} against a primary source,
        so we will not claim we have. Without Local Service Tax, your net pay is
        <strong>${S.fmt(t.certain.netExcludingLst)}</strong>. LST can move that by at most
        ${S.fmt(100000 / 12)} a month.
      </p>
      <p class="ob-p">The obligation itself, and the 31 October deadline, are certain. It is the band <em>amounts</em> we are unsure of.</p>
    </div>` : ''}

    ${full ? `<div class="result">
      <p class="cap">What you actually cost your employer</p>
      <div class="step"><span>Your gross</span><span class="t">${S.fmt(gross)}</span></div>
      <div class="step"><span>NSSF — employer (10%)</span><span class="t">${S.fmt(t.detail.employerNssf)}</span></div>
      <div class="step total"><span>True employer cost</span><span class="t">${S.fmt(t.detail.trueEmployerCost)}</span></div>
      <p class="step-note">Before leave, sick pay, notice and severance. <strong>Severance is NOT yet standardised.</strong> The Employment (Amendment) Act 2025 fixes it at one month per year worked, but it was only assented on 29 April 2026 and <strong>its commencement date has not been gazetted</strong> — so it is not in force. Today it is still negotiated (Employment Act s.89). We price both.</p>
    </div>` : ''}

    ${alerts(full ? t.warnings : p.warnings)}
    ${cta(p)}
  </div>`;
}

// ─── PRESUMPTIVE ─────────────────────────────────────────────────────────────

function renderPresump() {
  const t = S.presumptive(n('pre-turnover'), b('pre-records'), b('pre-prof'));
  const out = $('out-presump');

  if (t.excluded || t.outOfRegime) {
    out.innerHTML = `<div class="out">
      <div class="result">
        <p class="cap">${t.excluded ? 'You are excluded' : 'Presumptive tax does not apply'}</p>
        <div class="big"><span class="v">—</span></div>
        <p class="because">${esc(t.warnings[0].text)}</p>
        ${cite(t.rule)}
      </div>
      ${alerts(t.warnings.slice(1))}
      ${cta(t)}
    </div>`;
    return;
  }

  out.innerHTML = `<div class="out">
    <div class="result">
      <p class="cap">Presumptive tax (final)</p>
      <div class="big"><span class="v">${S.fmt(t.result)}</span><span class="u">UGX / year</span></div>
      <p class="because">Presumptive tax is charged on your <em>turnover</em>, not your profit. It is a final tax — no deductions.</p>
    </div>
    <div class="result">
      <p class="cap">The working</p>
      ${steps(t.steps)}
      <div class="step total"><span>Tax</span><span class="t">${S.fmt(t.result)}</span></div>
      ${t.comparison ? `<div class="alert alert-good" style="margin-top:14px">${esc(t.comparison.meaning)}</div>` : ''}
      ${cite(t.rule)}
    </div>
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

// ─── WHT — the Isaac engine ──────────────────────────────────────────────────

function renderWht() {
  const t = S.whtCredits({
    invoiced: n('wht-inv'), rateKey: 'professional_fees', residence: 'resident',
    certificatesExpected: n('wht-exp'), certificatesHeld: n('wht-held'),
  });
  const c = t.credits;

  $('out-wht').innerHTML = `<div class="out">
    <div class="result">
      <p class="cap">URA is holding this much of your money</p>
      <div class="big"><span class="v">${S.fmt(c.withheld)}</span><span class="u">UGX</span></div>
      <p class="because">6% was withheld at source. <strong>This is not a cost — it is prepaid tax</strong>, creditable against your income tax liability. But only against certificates you hold.</p>
    </div>
    <div class="result">
      <p class="cap">What you can actually claim</p>
      <div class="step"><span>Withheld</span><span class="t">${S.fmt(c.withheld)}</span></div>
      <div class="step"><span>Certificates held</span><span class="t">${c.certificatesHeld} of ${c.certificatesExpected}</span></div>
      <div class="step"><span>Certificates MISSING</span><span class="t">${c.certificatesMissing}</span></div>
      <div class="step total"><span>Claimable</span><span class="t">${S.fmt(c.claimable)}</span></div>
      ${c.atRisk > 0 ? `<div class="step total" style="color:var(--red-700)"><span>At risk — you'll pay tax twice on this</span><span class="t">${S.fmt(c.atRisk)}</span></div>` : ''}
      ${cite(t.rule)}
    </div>
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

// ─── VAT ─────────────────────────────────────────────────────────────────────

function renderVat() {
  const t = S.vatRegistration({
    annualTurnover: n('vat-annual'),
    bestQuarterTurnover: n('vat-quarter'),
    expectedNextQuarter: n('vat-forecast'),
  });

  $('out-vat').innerHTML = `<div class="out">
    <div class="result">
      <p class="cap">Must you register?</p>
      <div class="big"><span class="v">${t.mustRegister ? 'Yes' : 'No'}</span></div>
      ${t.reasons.length ? t.reasons.map((r) => `<p class="because">${esc(r)}</p>`).join('') : '<p class="because">You are below both the annual threshold and the quarterly trigger.</p>'}
    </div>
    <div class="result">
      <p class="cap">The two limbs</p>
      <div class="step"><span>Annual threshold</span><span class="t">300,000,000</span></div>
      <p class="step-note">Raised from 150,000,000 on 1 July 2026. PwC's published guidance still says 250,000,000. Parliament passed 300,000,000.</p>
      <div class="step"><span>Quarterly trigger</span><span class="t">75,000,000</span></div>
      <p class="step-note">One-quarter of the annual threshold. The 37,500,000 everyone still quotes was never a statutory number — it was simply 150m ÷ 4. The statute says "one-quarter of the annual registration threshold". It auto-scales.</p>
      <div class="step total"><span>Can you deregister?</span><span class="t">${t.deregistration.canDeregister ? 'Yes' : 'No'}</span></div>
      <p class="step-note">Deregistration is cumulative: last 3 months ≤ 75,000,000 AND last 12 months ≤ 225,000,000 — that is 75% of the threshold, not the threshold itself.</p>
      ${cite(t.rule)}
    </div>
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

// ─── ARREARS — the mathematics of silence ────────────────────────────────────

function renderArrears() {
  const t = S.arrearsProjection({
    principal: n('arr-principal'), monthsOverdue: n('arr-months'),
    projectMonths: 12, compounds: b('arr-compound'),
  });
  const p = t.projection;

  $('out-arrears').innerHTML = `<div class="out">
    <div class="result">
      <p class="cap">What you actually owe today</p>
      <div class="big"><span class="v">${S.fmt(t.result)}</span><span class="u">UGX</span></div>
      <p class="because">Interest runs at 2% a month${b('arr-compound') ? ', compounding' : ''} — roughly ${(p.annualisedRate * 100).toFixed(1)}% a year. It has been accruing silently, with no notification event.</p>
    </div>
    <div class="result">
      <p class="cap">The working</p>
      ${steps(t.steps)}
      <div class="step total"><span>In 12 more months, if you do nothing</span><span class="t">${S.fmt(p.then)}</span></div>
      <div class="step"><span>Five years from the due date</span><span class="t">${S.fmt(p.inFiveYears)}</span></div>
      ${cite(t.rule)}
    </div>
    <div class="result" style="border-color:var(--emerald-600)">
      <p class="cap" style="color:var(--emerald-900)">${esc(t.theCure.headline)}</p>
      <p class="because">${esc(t.theCure.text)}</p>
      <div class="big" style="margin-top:10px"><span class="v" style="color:var(--emerald-700)">${S.fmt(t.theCure.worth)}</span><span class="u">UGX — what the waiver could be worth to you</span></div>
      <div class="steps" style="margin-top:12px">
        ${t.theCure.steps.map((s, i) => `<div class="step"><span>${i + 1}. ${esc(s)}</span><span></span></div>`).join('')}
      </div>
      <p class="step-note">${esc(t.theCure.note)}</p>
    </div>
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

// ─── OPTIONS — we never say "do this" ────────────────────────────────────────

function optionCard(o, keyName = 'youKeep') {
  const amt = o[keyName] !== undefined ? o[keyName] : o.tax;
  return `<div class="opt ${o.flag ? 'flag' : ''}">
    <div class="opt-head">
      <div>
        <h3>${esc(o.label)}</h3>
        ${o.flag ? `<span class="pill">${esc(o.flag)}</span>` : ''}
        ${o.note ? `<p class="hint" style="margin-top:4px">${esc(o.note)}</p>` : ''}
      </div>
      <div style="text-align:right">
        <div class="amt">${S.fmt(amt)}</div>
        ${o.effectiveRate !== undefined ? `<div class="rate">${(o.effectiveRate * 100).toFixed(1)}% tax</div>` : ''}
      </div>
    </div>
    ${o.howItWorks ? `<p class="lab">How it works</p><ul>${o.howItWorks.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
    ${o.benefits ? `<p class="lab">What it gives you</p><ul>${o.benefits.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
    <p class="lab">What it requires of you</p><p>${esc(o.requiresOfYou)}</p>
    ${o.costs && o.costs.length ? `<p class="lab">What it costs</p><ul>${o.costs.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
    ${o.stopsWorkingWhen ? `<p class="lab">Stops working when</p><p>${esc(o.stopsWorkingWhen)}</p>` : ''}
  </div>`;
}

function optionsFooter(t) {
  return `<div class="result">
    <p class="because"><strong>On tax alone, the numbers favour ${esc(t.whatTheNumbersFavour.option.replace('_', ' '))} by ${S.fmt(t.whatTheNumbersFavour.by)}.</strong></p>
    <p class="because">${esc(t.whatTheNumbersFavour.caveat)}</p>
    <p class="lab" style="font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-500);margin:14px 0 5px">What we cannot tell you</p>
    <ul style="font-size:13px;color:var(--ink-700);line-height:1.7;padding-left:17px">
      ${t.whatWeCannotTellYou.map((w) => `<li>${esc(w)}</li>`).join('')}
    </ul>
    ${t.theTest ? `<div class="alert alert-warn" style="margin-top:14px"><strong>${esc(t.theTest)}</strong> If there is no answer, the option is not available to you — however good the arithmetic looks.</div>` : ''}
    <p class="cite">General information, not tax advice. We have not seen your contracts. Confirm with a licensed Ugandan tax adviser before acting. Uganda's tax law changes every 1 July.</p>
  </div>`;
}

function renderEntity() {
  const t = S.soleTraderVsCompany(n('ent-profit'));
  $('out-entity').innerHTML = `<div class="out">
    ${t.options.map((o) => optionCard(o, 'tax')).join('')}
    <div class="alert alert-info">The crossover is exactly <strong class="num">UGX 133,410,000</strong> of annual profit. Below it the sole trader pays less tax — by at most UGX 1,341,000 a year, and he pays for that with his house.</div>
    ${optionsFooter(t)}
  </div>`;
}

function renderExtract() {
  const t = S.extraction(n('ext-profit'));
  $('out-extract').innerHTML = `<div class="out">
    ${t.options.map((o) => optionCard(o, 'youKeep')).join('')}
    ${optionsFooter(t)}
  </div>`;
}

// ─── EXEMPTION ───────────────────────────────────────────────────────────────

function renderExempt() {
  const t = S.startupExemption({
    establishedAfter1Jul2025: b('ex-after'),
    eacCitizenOwnedAtLeast51pct: b('ex-citizen'),
    registeredCapital: n('ex-capital'),
    priorBenefitBySelfOrRelative: b('ex-prior'),
    willFileReturns: b('ex-file'),
  });

  $('out-exempt').innerHTML = `<div class="out">
    <div class="result" style="${t.qualifies ? 'border-color:var(--emerald-600)' : ''}">
      <p class="cap">${t.qualifies ? 'You may qualify' : 'You do not appear to qualify'}</p>
      <div class="big"><span class="v" style="${t.qualifies ? 'color:var(--emerald-700)' : ''}">${t.qualifies ? '0' : '—'}</span>
        <span class="u">${t.qualifies ? 'UGX income tax, for three years' : ''}</span></div>
      <p class="because">${esc(t.headline)}</p>
    </div>
    <div class="result">
      <p class="cap">All four conditions are cumulative — the gazetted Act says "and"</p>
      ${t.checks.map((c) => `<div class="check-row ${c.pass ? 'pass' : 'fail'}">
        <span class="mk">${c.pass ? '✓' : '✗'}</span><span>${esc(c.label)}</span></div>`).join('')}
      ${cite(t.rule)}
    </div>
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

// ─── TCC — the director trap ─────────────────────────────────────────────────

function renderTcc() {
  const t = S.tccReadiness({
    profileCurrent: b('tcc-profile'),
    companyReturnsFiled: b('tcc-returns'),
    companyArrears: n('tcc-arrears'),
    hasPaymentPlan: b('tcc-mou'),
    nssfArrears: n('tcc-nssf'),
    directors: [
      { name: '1', personalReturnsFiled: b('tcc-d1'), personalArrears: 0 },
      { name: '2', personalReturnsFiled: b('tcc-d2'), personalArrears: 0 },
    ],
  });

  $('out-tcc').innerHTML = `<div class="out">
    <div class="result" style="border-color:${t.ready ? 'var(--emerald-600)' : 'var(--red-600)'}">
      <p class="cap">${t.ready ? 'You appear ready' : 'Your certificate will be refused'}</p>
      <div class="big"><span class="v" style="color:${t.ready ? 'var(--emerald-700)' : 'var(--red-700)'}">${t.ready ? 'Ready' : 'Blocked'}</span></div>
      ${!t.ready ? `<p class="because">You will find this out when you lose the tender — unless you fix it first.</p>` : ''}
    </div>

    ${t.blockers.length ? `<div class="result" style="border-color:var(--red-600)">
      <p class="cap" style="color:var(--red-700)">What is blocking you</p>
      ${t.blockers.map((bl) => `
        <p class="because"><strong>${esc(bl.text)}</strong></p>
        ${bl.why ? `<p class="step-note">${esc(bl.why)}</p>` : ''}
        ${bl.insight ? `<div class="alert alert-danger" style="margin:8px 0">${esc(bl.insight)}</div>` : ''}
        ${bl.cure ? `<div class="alert alert-good" style="margin:8px 0">${esc(bl.cure)}</div>` : ''}
      `).join('')}
    </div>` : ''}

    <div class="result">
      <p class="cap">URA's five criteria — verbatim</p>
      ${t.criteria.map((c) => `<div class="check-row"><span class="mk">·</span><span>${esc(c.text)}</span></div>`).join('')}
      <p class="step-note" style="margin-top:12px">The Tax Procedures Code Act is <em>completely silent</em> on issuance criteria. All five are administrative, not statutory — which means a refusal is a "tax decision", objectionable under TPCA s.24 and appealable to the Tax Appeals Tribunal. Most Ugandan business owners do not know that remedy exists.</p>
      ${cite(t.rule)}
    </div>

    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}


// ═════════════════════════════════════════════════════════════════════════════
// wiring
// ═════════════════════════════════════════════════════════════════════════════


// ═════════════════════════════════════════════════════════════════════════════
// TIER 1 — the nine added on 11 July 2026
//
// These RENDER traces. They never produce one. Delete every function below and
// the arithmetic is still correct — it is just no longer visible. That is the
// test, and it is the whole architecture.
// ═════════════════════════════════════════════════════════════════════════════

/** The headline block every calculator shares. */
const bigResult = (cap, value, because) => `
  <div class="result">
    <p class="cap">${esc(cap)}</p>
    <div class="big"><span class="v">${S.fmt(value)}</span><span class="u">UGX</span></div>
    ${because ? `<p class="because">${because}</p>` : ''}
  </div>`;

const working = (t, cap = 'The working') => `
  <div class="result">
    <p class="cap">${esc(cap)}</p>
    ${steps(t.steps)}
    ${cite(t.rule)}
  </div>`;

// ─── net to gross ────────────────────────────────────────────────────────────
function renderNetGross() {
  const t = S.netToGross(n('ng-target'), { residence: $('ng-res').value });
  const out = $('out-netgross');
  if (t.refused) { out.innerHTML = refusalCard(t); return; }
  const e = t.employerView;

  out.innerHTML = `<div class="out">
    ${bigResult('Put this in the contract', t.result,
      `They take home ${S.fmt(n('ng-target'))}. You pay ${S.fmt(t.result)}. The difference is not a margin — it is tax and NSSF.`)}
    ${working(t)}
    <div class="result">
      <p class="cap">And what it costs YOU</p>
      <div class="step"><span>Gross salary</span><span class="t">${S.fmt(e.gross)}</span></div>
      <div class="step"><span>NSSF — employer (10%)</span><span class="t">${S.fmt(e.employerNssf)}</span></div>
      <div class="step total"><span>Your true monthly cost</span><span class="t">${S.fmt(e.totalMonthlyCost)}</span></div>
      <p class="step-note">${esc(e.meaning)}</p>
    </div>
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

// ─── true cost of an employee ────────────────────────────────────────────────
function renderCost() {
  const sev = n('tc-sev');
  const t = S.trueCostOfEmployee({
    grossMonthly: n('tc-gross'),
    yearsOfService: n('tc-years'),
    severanceMonthsPerYear: sev > 0 ? sev : null,
  });
  const out = $('out-cost');
  const p = t.pending;

  out.innerHTML = `<div class="out">
    ${bigResult('Cost per year, on the law as it stands today', t.result,
      'The law in force, plus whatever your own contract adds. Nothing invented.')}

    <div class="result">
      <p class="cap">What the LAW compels</p>
      ${steps(t.statutory.items)}
      <div class="step total"><span>${esc(t.statutory.label)}</span><span class="t">${S.fmt(t.statutory.total)}</span></div>
      ${cite(t.rule)}
    </div>

    <div class="result">
      <p class="cap">What YOUR CONTRACT compels</p>
      ${t.contractual.items.length ? steps(t.contractual.items)
        : '<p class="step-note">Nothing — you have told us of no contractual severance or gratuity. We have not invented one.</p>'}
      <div class="step total"><span>Contractual</span><span class="t">${S.fmt(t.contractual.total)}</span></div>
    </div>

    <!-- 🔴 THE THIRD COLUMN. A law that is signed and not in force.
         Nothing else in Uganda models this state. -->
    <div class="result pending">
      <p class="cap">What is COMING — and is <em>not law yet</em></p>
      <div class="badges" style="margin-bottom:12px">
        <span class="badge badge-c">assented · NOT commenced</span>
        <span class="badge badge-n">${esc(p.rule.id)}</span>
        <span class="badge badge-n">assented ${esc(p.rule.assentedOn)}</span>
      </div>
      <p class="because">
        The <strong>Employment (Amendment) Act 2025</strong> fixes severance at one month's salary
        per year worked. The President signed it on 29 April 2026.
        <strong>Its commencement date has not been gazetted, so it is not in force.</strong>
        Every HR guide in Uganda is already reporting it as the law. It is not. But it will be.
      </p>
      <div class="step"><span>It would accrue, per year of service</span><span class="t">${S.fmt(p.severancePerYear)}</span></div>
      <div class="step"><span>Your contract currently accrues</span><span class="t">${p.yourCurrentAccrual === null ? 'nothing' : S.fmt(p.yourCurrentAccrual)}</span></div>
      <div class="step total"><span>Unprovided exposure, per year</span><span class="t">${S.fmt(p.annualExposureGap)}</span></div>
      <p class="step-note">If it applies to service already worked, this one employee carries
        <strong>${S.fmt(p.ifItBitesRetrospectively)}</strong> of back-book exposure.</p>
      <p class="ob-lab" style="margin-top:14px">And these land on the same day</p>
      ${p.alsoChanges.map((c) => `<p class="step-note">· ${esc(c)}</p>`).join('')}
    </div>

    ${alerts(t.warnings)}
    ${cannotTell(t)}
  </div>`;
}

/** 🔑 The honesty block. It is not a disclaimer. It is a list of open questions. */
const cannotTell = (t) => !t.whatWeCannotTellYou ? '' : `
  <div class="result cannot">
    <p class="cap">What we <em>cannot</em> tell you</p>
    ${t.whatWeCannotTellYou.map((c) => `<p class="ob-p">${esc(c)}</p>`).join('')}
  </div>`;

// ─── corporate income tax ────────────────────────────────────────────────────
function renderCit() {
  const t = S.corporateIncomeTax({
    chargeableIncome: n('cit-chargeable'),
    lossBroughtForward: n('cit-lossbf'),
    yearsCarryingLosses: n('cit-losses'),
  });
  $('out-cit').innerHTML = `<div class="out">
    ${bigResult('Corporation tax', t.result,
      t.losses.throttled
        ? `Only <strong>half</strong> your brought-forward loss is deductible after seven years (s.36(6)).
           ${S.fmt(t.losses.deferredToNextYear)} of relief is deferred — <strong>not lost</strong>.`
        : '30% of chargeable income. Not of turnover, and not of accounting profit.')}
    ${working(t)}
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

// ─── the presumptive election ────────────────────────────────────────────────
function renderElection() {
  const t = S.presumptiveElection({
    turnover: n('el-turnover'), expenses: n('el-expenses'),
    hasRecords: b('el-records'), isCompany: b('el-company'),
  });
  const out = $('out-election');
  if (t.excluded || t.outOfRegime) {
    out.innerHTML = `<div class="out"><div class="result">
      <p class="cap">No election to make</p>
      <div class="big"><span class="v">—</span></div>
      ${alerts(t.warnings)}${cite(t.rule)}</div></div>`;
    return;
  }
  const be = t.breakEven;
  out.innerHTML = `<div class="out">
    <div class="result">
      <p class="cap">🔑 Your break-even margin</p>
      <div class="big"><span class="v">${(be.margin * 100).toFixed(1)}</span><span class="u">%</span></div>
      <p class="because">${esc(be.meaning)}</p>
    </div>
    ${working(t, 'The two regimes, side by side')}
    <div class="options">${t.options.map((o) => optionCard(o, 'tax')).join('')}</div>
    ${optionsFooter(t)}
    ${alerts(t.warnings)}
  </div>`;
}

// ─── rental ──────────────────────────────────────────────────────────────────
function renderRental() {
  const t = S.rentalIncome({ grossRent: n('rn-rent'), expenses: n('rn-exp'), isIndividual: b('rn-ind') });
  $('out-rental').innerHTML = `<div class="out">
    ${bigResult(esc(t.label), t.result,
      b('rn-ind')
        ? 'Twelve percent of your rent above 2,820,000. <strong>Your expenses are irrelevant — the law ignores them.</strong>'
        : 'Thirty percent — but you may deduct expenses, capped at half your rent.')}
    ${working(t)}
    ${t.comparison ? `<div class="alert alert-info">${esc(t.comparison.meaning)}</div>` : ''}
    ${alerts(t.warnings)}
    ${cannotTell(t)}
  </div>`;
}

// ─── the WHT rate card ───────────────────────────────────────────────────────
function fillWhtTypes() {
  const sel = $('wr-type');
  if (sel.options.length) return;
  sel.innerHTML = S.RULES.WHT_2026.rates
    .map((r) => `<option value="${r.key}">${esc(r.label)}</option>`).join('');
}

function renderWhtRate() {
  fillWhtTypes();
  const t = S.whtRate({
    paymentType: $('wr-type').value,
    residence: $('wr-res').value,
    amount: n('wr-amt'),
    amountIsNet: b('wr-net'),
  });
  const out = $('out-whtrate');
  if (t.refused) { out.innerHTML = refusalCard(t); return; }

  out.innerHTML = `<div class="out">
    ${bigResult('Withhold this, and pay it to URA by the 15th', t.result,
      t.isFinalTax
        ? '<strong>This is a FINAL tax.</strong> Your supplier cannot reclaim it. It is simply gone.'
        : '<strong>This is not a cost to your supplier.</strong> It is prepaid tax — but only if you give them the certificate.')}
    ${working(t)}
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

// ─── VAT inclusive / exclusive ───────────────────────────────────────────────
function renderVatAmt() {
  const t = S.vatAmount({ amount: n('va-amt'), isInclusive: b('va-inc') });
  $('out-vatamt').innerHTML = `<div class="out">
    ${bigResult(esc(t.label), t.result)}
    ${working(t)}
    <div class="result">
      <div class="step"><span>Excluding VAT</span><span class="t">${S.fmt(t.exclusive)}</span></div>
      <div class="step"><span>VAT at 18%</span><span class="t">${S.fmt(t.vat)}</span></div>
      <div class="step total"><span>Including VAT</span><span class="t">${S.fmt(t.inclusive)}</span></div>
    </div>
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

// ─── VAT deregistration ──────────────────────────────────────────────────────
function renderVatDereg() {
  const t = S.vatDeregistration({
    last3MonthsTurnover: n('vd-q'), last12MonthsTurnover: n('vd-a'),
  });
  $('out-vatdereg').innerHTML = `<div class="out">
    <div class="result">
      <p class="cap">Can you come off VAT?</p>
      <div class="big"><span class="v">${t.canDeregister ? 'Yes' : 'No'}</span></div>
      <p class="because">${t.stuck
        ? '<strong>You are stuck.</strong> Below the threshold that would force you to register — above the limb that would let you leave.'
        : t.canDeregister
          ? 'Both limbs of s.9(2) are satisfied. But read the warning before you apply.'
          : 'You do not satisfy both limbs of s.9(2). Both are required.'}</p>
    </div>
    ${working(t, 'The two limbs — and they are cumulative')}
    ${t.stuck ? `<div class="result cannot">
      <p class="cap">The gap you are in</p>
      <p class="ob-p">${esc(t.theGap.explanation)}</p>
    </div>` : ''}
    ${alerts(t.warnings)}
    ${cannotTell(t)}
  </div>`;
}

// ─── voluntary disclosure ────────────────────────────────────────────────────
function renderVd() {
  const t = S.voluntaryDisclosure({
    principal: n('vdi-principal'), monthsOverdue: n('vdi-months'), compounds: b('vdi-compound'),
  });
  $('out-vd').innerHTML = `<div class="out">
    ${bigResult('What disclosing could be worth to you', t.result,
      `Your ${S.fmt(n('vdi-principal'))} arrear has grown to <strong>${S.fmt(t.projection.today)}</strong>.
       Disclose it and the Commissioner <em>may</em> waive everything above the tax itself.`)}
    ${working(t)}
    <div class="result">
      <p class="cap">${esc(t.theRoute.headline)}</p>
      ${t.theRoute.steps.map((x, i) => `<div class="step"><span>${i + 1}. ${esc(x)}</span></div>`).join('')}
      <p class="step-note">${esc(t.theRoute.note)}</p>
    </div>
    ${alerts(t.warnings)}
    ${cannotTell(t)}
    ${cta(t)}
  </div>`;
}


// ═════════════════════════════════════════════════════════════════════════════
// TIER 2 + PERSONAL FINANCE — renderers. They RENDER traces. They never make one.
// ═════════════════════════════════════════════════════════════════════════════

const pct = (r) => (r * 100).toFixed(r < 0.01 ? 2 : 1) + '%';

function renderMvBenefit() {
  const t = S.motorVehicleBenefit({
    marketValue: n('mv-value'), yearsSinceFirstProvided: n('mv-years'),
    daysAvailable: n('mv-days') || 365, employeeContribution: n('mv-pays'),
  });
  $('out-mvbenefit').innerHTML = `<div class="out">
    ${bigResult('Added to their employment income, this year', t.result,
      `That is <strong>${S.fmt(t.monthly)}</strong> a month on the payslip, taxed at their normal rate.`)}
    ${working(t)}
    ${t.comparison ? `<div class="result cannot">
      <p class="cap">What URA's own page would tell you</p>
      <div class="step"><span>URA's stale (pre-2017) formula</span><span class="t">${S.fmt(t.comparison.result)}</span></div>
      <div class="step total"><span>The correct figure</span><span class="t">${S.fmt(t.result)}</span></div>
      <p class="step-note">${esc(t.comparison.meaning)}</p>
    </div>` : ''}
    ${alerts(t.warnings)}
  </div>`;
}

function renderHousing() {
  const t = S.housingBenefit({ marketRent: n('hb-rent'), cashEmploymentIncome: n('hb-cash'), employeePays: n('hb-pays') });
  $('out-housing').innerHTML = `<div class="out">
    ${bigResult('Housing benefit added to their income', t.result,
      `The <strong>lesser</strong> of the two limbs. Limb (${t.limbs.binding}) binds.`)}
    ${working(t)}
    ${alerts(t.warnings)}
  </div>`;
}

function renderLoanBenefit() {
  const t = S.employeeLoanBenefit({
    loanAmount: n('lb-amount'), employerRate: n('lb-rate') / 100, monthsInYear: n('lb-months') || 12,
  });
  const alt = t.alternativeReading;
  $('out-loanbenefit').innerHTML = `<div class="out">
    ${bigResult('Taxable benefit, this year', t.result,
      t.belowThreshold ? 'Loans totalling 1,000,000 or less create no benefit.' : 'The gap between the statutory rate and what you charge.')}
    ${working(t)}
    ${alt ? `<div class="result pending">
      <p class="cap">The reading nobody has settled</p>
      <p class="because">${esc(alt.meaning)}</p>
      <div class="step"><span>If "discount rate" = CBR (9.75%)</span><span class="t">${S.fmt(t.result)}</span></div>
      <div class="step"><span>If it means the BANK RATE (13.75%)</span><span class="t">${S.fmt(alt.result)}</span></div>
      <div class="step total"><span>The difference</span><span class="t">${S.fmt(alt.difference)}</span></div>
    </div>` : ''}
    ${alerts(t.warnings)}
    ${cannotTell(t)}
  </div>`;
}

function renderTerminal() {
  const t = S.terminalBenefits({
    amount: n('tb-amount'), kind: $('tb-kind').value, yearsWithEmployer: n('tb-years'),
  });
  $('out-terminal').innerHTML = `<div class="out">
    ${bigResult('Taxable', t.result,
      t.exemptAmount > 0
        ? `<strong>${S.fmt(t.exemptAmount)}</strong> is exempt — 25%, because they served ten years or more.`
        : '<strong>No relief.</strong> The whole payment is taxable.')}
    ${working(t)}
    ${alerts(t.warnings)}
  </div>`;
}

function renderSecondJob() {
  const t = S.multipleEmployers({ mainMonthly: n('mj-main'), secondMonthly: n('mj-second') });
  $('out-secondjob').innerHTML = `<div class="out">
    ${bigResult('Deducted from your second job', t.result,
      'A flat 30% — <strong>no tax-free band, no lower steps</strong>. The first shilling is taxed at 30%.')}
    ${working(t)}
    ${t.reclaim.monthly > 0 ? `<div class="result">
      <p class="cap">🔑 What you can claim back</p>
      <div class="big"><span class="v">${S.fmt(t.reclaim.annual)}</span><span class="u">UGX / year</span></div>
      <p class="because">${esc(t.reclaim.how)}</p>
    </div>` : `<div class="result">
      <p class="cap">Nothing to reclaim — and that is the honest answer</p>
      <p class="because">At your salary the flat 30% happens to be exactly right, because your main job has already used up the lower bands. <strong>The trap bites people who earn less than you.</strong></p>
    </div>`}
    ${alerts(t.warnings)}
    ${cannotTell(t)}
  </div>`;
}

function renderCapAllow() {
  const t = S.capitalAllowances({
    cost: n('ca-cost'), assetClass: Number($('ca-class').value),
    isRoadVehicle: b('ca-vehicle'), isCommercialVehicle: b('ca-commercial'), years: 5,
  });
  $('out-capallow').innerHTML = `<div class="out">
    ${bigResult('Deductible this year', t.result,
      t.vehicleCapApplied
        ? 'The <strong>vehicle cap</strong> applies — the cost base is limited to 60,000,000.'
        : 'Reducing balance, so it never fully runs out. It just gets smaller.')}
    ${working(t)}
    <div class="result">
      <p class="cap">The next five years</p>
      ${t.schedule.map((y) => `<div class="step"><span>Year ${y.year} — opening ${S.fmt(y.opening)}</span><span class="t">${S.fmt(y.allowance)}</span></div>`).join('')}
      <div class="step total"><span>Total relieved over 5 years</span><span class="t">${S.fmt(t.totalOverPeriod)}</span></div>
      <p class="step-note">Still unrelieved after five years: <strong>${S.fmt(t.unrelievedAfterPeriod)}</strong>. Reducing balance never reaches zero.</p>
    </div>
    ${alerts(t.warnings)}
  </div>`;
}

function renderStartupCost() {
  const t = S.startupCosts({ amount: n('sc-amount'), yearsSinceIncurred: n('sc-years') });
  $('out-startupcost').innerHTML = `<div class="out">
    ${bigResult('Deductible this year', t.result,
      `25% a year for four years. <strong>${t.yearsRemaining}</strong> year(s) of relief remaining.`)}
    ${working(t)}
    ${alerts(t.warnings)}
  </div>`;
}

function renderProvisional() {
  const t = S.provisionalTax({
    estimatedAnnualTax: n('pt-est'), whtAlreadyWithheld: n('pt-wht'), isCompany: b('pt-company'),
  });
  $('out-provisional').innerHTML = `<div class="out">
    ${bigResult('Each instalment', t.result,
      `${t.schedule.instalments} instalments a year — due at the end of month ${t.schedule.dueEndOfMonths.join(', month ')}.`)}
    ${working(t)}
    ${alerts(t.warnings)}
  </div>`;
}

function renderInputVat() {
  const t = S.inputVatRecoverable({ items: [
    { key: 'telephone',      amount: n('iv-phone') },
    { key: 'passenger_auto', amount: n('iv-car') },
    { key: 'entertainment',  amount: n('iv-ent') },
    { key: 'stock',          amount: n('iv-other'), label: 'Ordinary business purchases' },
  ] });
  $('out-inputvat').innerHTML = `<div class="out">
    ${bigResult('Input VAT you may actually reclaim', t.result,
      'Blocked items removed. <strong>But 90% of your telephone VAT is still recoverable.</strong>')}
    ${working(t)}
    ${alerts(t.warnings)}
  </div>`;
}

function renderAdvanceTax() {
  const t = S.advanceTaxTransport({
    kind: $('at-kind').value, loadingCapacityTonnes: n('at-tonnes'),
    seats: n('at-seats'), vehicles: n('at-count') || 1,
  });
  $('out-advancetax').innerHTML = `<div class="out">
    ${bigResult('Advance tax, per year', t.result,
      'This is <strong>creditable</strong> against your income tax. Pay it and forget to claim it, and you have simply given URA money.')}
    ${working(t)}
    ${alerts(t.warnings)}
    ${cta(t)}
  </div>`;
}

function fillStampInstruments() {
  const sel = $('sd-instrument');
  if (sel.options.length) return;
  sel.innerHTML = S.RULES.STAMP_DUTY_2026.items
    .map((i) => `<option value="${esc(i.key)}">${esc(i.label)}</option>`).join('');
}

function renderStampDuty() {
  fillStampInstruments();
  const t = S.stampDuty({ instrument: $('sd-instrument').value, value: n('sd-value') });
  const out = $('out-stampduty');
  if (t.refused) { out.innerHTML = refusalCard(t); return; }
  out.innerHTML = `<div class="out">
    ${bigResult('Stamp duty', t.result, `Stamp it within <strong>45 days</strong> of signing.`)}
    ${working(t)}
    ${t.rejectedIncrease ? `<div class="result pending">
      <p class="cap">✅ The tax you were nearly charged</p>
      <div class="badges" style="margin-bottom:12px">
        <span class="badge badge-a">REJECTED on 21 April 2026</span>
      </div>
      <div class="step"><span>What the 2026 Bill proposed (3%)</span><span class="t">${S.fmt(t.rejectedIncrease.wouldHaveBeen)}</span></div>
      <div class="step"><span>What you actually pay (1.5%)</span><span class="t">${S.fmt(t.result)}</span></div>
      <div class="step total"><span>What Parliament saved you</span><span class="t">${S.fmt(t.rejectedIncrease.youAreSaving)}</span></div>
      <p class="step-note">${esc(t.rejectedIncrease.meaning)}</p>
      <p class="step-note"><em>${esc(t.rejectedIncrease.evidence)}</em></p>
    </div>` : ''}
    ${alerts(t.warnings)}
  </div>`;
}

// ─── personal finance ────────────────────────────────────────────────────────

function renderLoan() {
  const t = S.loanSchedule({
    principal: n('ln-principal'), annualRate: n('ln-rate') / 100,
    months: n('ln-months') || 12, quotedAsFlat: b('ln-flat'),
  });
  const tr = t.trueRate;
  $('out-loan').innerHTML = `<div class="out">
    ${bigResult('Your monthly repayment', t.result,
      `You repay <strong>${S.fmt(t.totalRepaid)}</strong> in total — <strong>${S.fmt(t.totalInterest)}</strong> of it interest.`)}
    ${b('ln-flat') ? `<div class="result pending">
      <p class="cap">🔴 The rate you were quoted is not the rate you pay</p>
      <div class="step"><span>They said</span><span class="t">${pct(tr.quoted)}</span></div>
      <div class="step total"><span>You are actually paying</span><span class="t">${pct(tr.effective)}</span></div>
      <p class="step-note">${esc(tr.meaning)}</p>
    </div>` : ''}
    ${working(t, 'The loan')}
    <div class="result">
      <p class="cap">Where your money goes</p>
      ${t.schedule.map((r) => `<div class="step"><span>Month ${r.month}</span><span class="t">interest ${S.fmt(r.interest)} · capital ${S.fmt(r.capital)}</span></div>`).join('')}
    </div>
    ${alerts(t.warnings)}
    ${cannotTell(t)}
  </div>`;
}

function renderSavings() {
  const t = S.savings({
    initial: n('sv-initial'), monthlyDeposit: n('sv-monthly'),
    annualRate: n('sv-rate') / 100, years: n('sv-years') || 1,
    annualInflation: n('sv-infl') / 100,
  });
  $('out-savings').innerHTML = `<div class="out">
    ${bigResult('What you will have', t.result,
      t.realValue != null
        ? `But in <strong>today's money</strong> — what it will actually buy — that is <strong>${S.fmt(t.realValue)}</strong>.`
        : null)}
    ${working(t)}
    ${alerts(t.warnings)}
  </div>`;
}

function renderRetirement() {
  const t = S.retirement({
    currentAge: n('rt-age'), retireAge: n('rt-retire'), currentPot: n('rt-pot'),
    monthlyGross: n('rt-gross'), annualReturn: n('rt-return') / 100,
  });
  $('out-retirement').innerHTML = `<div class="out">
    ${bigResult('Your pot at retirement', t.result,
      `In <strong>today's money</strong>: ${S.fmt(t.realValue)}. Always look at that number.`)}
    ${working(t)}
    ${alerts(t.warnings)}
    ${cannotTell(t)}
  </div>`;
}

function renderEmergency() {
  const t = S.emergencyFund({
    monthlyEssentials: n('ef-essentials'), currentSavings: n('ef-saved'),
    monthsOfCover: n('ef-months') || 6, monthlySaving: n('ef-saving'),
  });
  $('out-emergency').innerHTML = `<div class="out">
    ${bigResult('Your target', t.result,
      `You have <strong>${t.monthsOfCoverNow.toFixed(1)} months</strong> of cover today.
       ${t.monthsToTarget ? `At your current rate you reach the target in <strong>${t.monthsToTarget} months</strong>.` : ''}`)}
    ${working(t)}
    ${alerts(t.warnings)}
  </div>`;
}

function renderTbill() {
  const t = S.treasuryYield({ faceValue: n('tby-face'), purchasePrice: n('tby-price'), days: n('tby-days') || 364 });
  $('out-tbill').innerHTML = `<div class="out">
    <div class="result">
      <p class="cap">Your ACTUAL return, after tax</p>
      <div class="big"><span class="v">${pct(t.netYield)}</span></div>
      <p class="because">They will advertise <strong>${pct(t.grossYield)}</strong>. You receive <strong>${pct(t.netYield)}</strong>. The 20% withholding tax is the difference.</p>
    </div>
    ${working(t)}
    ${alerts(t.warnings)}
  </div>`;
}

function renderMortgage() {
  const t = S.mortgageAffordability({
    monthlyNetIncome: n('mg-income'), existingDebtPayments: n('mg-debt'),
    annualRate: n('mg-rate') / 100, years: n('mg-years') || 15, deposit: n('mg-deposit'),
  });
  $('out-mortgage').innerHTML = `<div class="out">
    ${bigResult('The most you can afford', t.result,
      `Borrowing <strong>${S.fmt(t.maxLoan)}</strong>, repaying <strong>${S.fmt(t.monthlyPayment)}</strong> a month.`)}
    ${working(t)}
    ${alerts(t.warnings)}
    ${cannotTell(t)}
  </div>`;
}

function renderValuation() {
  const t = S.businessValuation({
    annualProfit: n('bv-profit'), annualRevenue: n('bv-revenue'),
    netAssets: n('bv-assets'), multiple: n('bv-multiple') || 3,
  });
  $('out-valuation').innerHTML = `<div class="out">
    <div class="result">
      <p class="cap">What your business might be worth</p>
      <div class="big"><span class="v">—</span></div>
      <p class="because"><strong>We will not give you a single number.</strong> A business is worth what someone will pay for it. Here are the ways of starting that conversation.</p>
    </div>
    ${working(t, 'Three ways of looking at it')}
    <div class="options">${t.options.map((o) => optionCard(o, 'value')).join('')}</div>
    ${cannotTell(t)}
  </div>`;
}


// ═════════════════════════════════════════════════════════════════════════════
// F4 — THE COMMENCEMENT CLOCK. The only page in Uganda that keeps a Bill, a
// passed Bill, an assented Act and a commenced Act apart from one another.
// ═════════════════════════════════════════════════════════════════════════════
function renderClock() {
  const n_ = n('ck-count');
  const employees = Array.from({ length: Math.min(n_, 500) }, (_, i) => ({
    name: `Employee ${i + 1}`,
    monthlyGross: n('ck-salary'),
    yearsOfService: n('ck-years'),
    contractSeveranceMonthsPerYear: n('ck-accrual'),
  }));
  const t = S.exposure({ employees });
  const w = S.watchlist();

  $('out-clock').innerHTML = `<div class="out">
    ${bigResult('Unprovided exposure, per year', t.result,
      `And if it applies to service <strong>already worked</strong>:
       <strong>${S.fmt(t.totals.retrospectiveBackBook)}</strong> lands at once.`)}

    <div class="result pending">
      <p class="cap">Signed. Not in force. Nobody will tell you when it lands.</p>
      ${w.coming.map((c) => `
        <p class="because"><strong>${esc(c.title)}</strong><br>${esc(c.status)}</p>
        <p class="step-note">${esc(c.theGap)}</p>
        <p class="ob-lab" style="margin-top:12px">And these land on the same day</p>
        ${c.alsoLands.map((x) => `<p class="step-note">· ${esc(x)}</p>`).join('')}
        <p class="ob-lab" style="margin-top:12px">Watch for</p>
        <p class="step-note">${esc(c.watchFor)}</p>
      `).join('')}
    </div>

    ${working(t, 'The arithmetic')}

    <!-- 🔴 The list that exists nowhere else in Uganda. -->
    <div class="result cannot">
      <p class="cap">🔴 Taxes that DIED on the floor of Parliament — and are still being published as law</p>
      ${w.killedOnTheFloor.map((k) => `
        <p class="ob-p">
          <strong>${esc(k.title)}</strong> — killed ${esc(k.killedOn)}.<br>
          <em>${esc(k.evidence)}</em><br>
          Still published as law by: <strong>${k.stillPublishedAsLawBy.map(esc).join(', ')}</strong>.<br>
          <span style="color:${k.weShippedIt ? 'var(--red-700)' : 'var(--emerald-700)'}">${esc(k.lesson)}</span>
        </p>`).join('')}
    </div>

    ${alerts(w.warnings)}
    ${cannotTell(t)}
  </div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// THE CENTRE — a directory of everything. The guide stays the front door;
// this is for the person who already knows what they need.
// ═════════════════════════════════════════════════════════════════════════════

// 🔑 EVERY CALCULATOR CARRIES PLAIN-WORD KEYWORDS.
//
// A search box that only matches "PAYE" is useless to the person this company
// exists for. Somebody who already knows the word "presumptive" does not need us.
// The whole founding failure was people not knowing the tax EXISTED — so they
// cannot search for its name.
//
// So we index what they WOULD type: "salary", "take home", "my staff", "rent",
// "I owe URA money", "tender", "penalty". Tax jargon is a synonym here, not the
// primary key.
const CALCS = [
  { k: 'clock',     kw: 'law change new tax coming commencement severance employment act not in force bill parliament', t: '🔴 What is coming — and what died', d: 'One law is signed but NOT in force. Two taxes died on the floor of Parliament and are still being published as law.', tag: 'The clock', hot: 'Exists nowhere else in Uganda' },
  { k: 'paye', kw: 'salary payslip wages employee deduction take home net pay income tax employment monthly staff',      t: 'PAYE and net pay',            d: 'What is deducted from your salary — and what it truly costs your employer.', tag: 'Employment', hot: 'URA’s own site is wrong' },
  { k: 'netgross', kw: 'salary gross net take home reverse contract offer hire package how much should i pay',  t: 'Net to gross',                d: '“I want them to take home 1,000,000.” What goes in the contract?', tag: 'Employment', hot: 'Exists nowhere else' },
  { k: 'cost', kw: 'employee staff hire cost employer nssf severance redundancy leave payroll budget headcount',      t: 'True cost of an employee',    d: 'Salary, NSSF, and the severance law that is signed but not in force.', tag: 'Employment', hot: 'The law changes without notice' },
  { k: 'presump', kw: 'small business shop trader turnover sales market kiosk duka simple tax turnover tax',   t: 'Presumptive tax',             d: 'All five bands. Most published tables are missing one of them.', tag: 'Small business' },
  { k: 'election', kw: 'small business elect out margin profit turnover which is cheaper records books',  t: 'Presumptive, or elect out?',  d: 'Presumptive taxes turnover. Ordinary tax taxes profit. Find your break-even margin.', tag: 'Small business', hot: 'Nobody computes this' },
  { k: 'cit', kw: 'company corporation tax profit 30% limited business loss carried forward throttle',       t: 'Corporation tax',             d: '30% — and the 50% throttle on losses carried beyond seven years.', tag: 'Company' },
  { k: 'entity', kw: 'sole trader company limited register incorporate which is better structure entity',    t: 'Sole trader or company?',     d: 'The crossover is exactly 133,410,000. Below it, the company pays more.', tag: 'Company' },
  { k: 'extract', kw: 'dividend salary drawings take money out of my company shareholder director pay myself',   t: 'Taking money out',            d: 'Salary, dividend or retain. A dividend costs 40.5% — the worst route.', tag: 'Company' },
  { k: 'rental', kw: 'rent landlord property tenant house building rental income let letting',    t: 'Rental income',               d: 'As an individual you may deduct nothing at all. And the threshold did not move.', tag: 'Property' },
  { k: 'wht', kw: 'withholding certificate 6 percent deducted government contract money back refund credit claim',       t: 'WHT credits',                 d: 'URA is holding money that belongs to you. Do you hold the certificates?', tag: 'Withholding', hot: 'This is the Isaac product' },
  { k: 'whtrate', kw: 'withholding rate deduct supplier consultant contractor pay someone invoice 6% gross up',   t: 'WHT rate card',               d: 'Every rate, resident and non-resident — with the gross-up nobody computes.', tag: 'Withholding' },
  { k: 'vatamt', kw: 'vat 18 percent add remove inclusive exclusive invoice price quote',    t: 'VAT in or out',               d: '18 ÷ 118, not 18%. The difference is 2.7% of every invoice you ever issue.', tag: 'VAT' },
  { k: 'vat', kw: 'vat register threshold 300 million turnover must i charge vat',       t: 'Must I register for VAT?',    d: 'The threshold is 300,000,000 now — and the quarterly limb bites first.', tag: 'VAT', hot: 'PwC publishes the wrong figure' },
  { k: 'vatdereg', kw: 'vat deregister cancel come off stop charging vat leave',  t: 'Can I come off VAT?',         d: 'A 75,000,000-wide trap where you can neither register nor leave.', tag: 'VAT', hot: 'PwC gets this wrong too' },
  { k: 'arrears', kw: 'penalty interest owe ura debt late arrears fine unpaid overdue money owed compounding',   t: 'What an arrear really costs', d: '2% a month, compounding. Four million becomes thirteen in five years.', tag: 'Arrears' },
  { k: 'vd', kw: 'voluntary disclosure waiver forgive penalty amnesty come clean settle owe ura',        t: 'Voluntary disclosure',        d: 'Disclose first and the interest and the fine may be waived entirely. May.', tag: 'Arrears', hot: 'The cure, not the diagnosis' },
  { k: 'tcc', kw: 'tax clearance certificate tender bid contract ppda government director blocked',       t: 'Tax clearance certificate',   d: 'One director’s unfiled personal return blocks a spotless company.', tag: 'Compliance', hot: 'The director trap' },
  { k: 'exempt', kw: 'exemption holiday new business startup no tax three years free citizen',    t: 'The 3-year exemption',        d: 'A total income tax holiday that is not on URA’s own exemptions page.', tag: 'Compliance', hot: 'Almost nobody knows' },

  // ── Tier 2 · employment benefits — verified against primary law, 11 July 2026 ──
  { k: 'mvbenefit',   kw: 'company car vehicle benefit employee motor private use fringe', t: 'Company car benefit',        d: 'The taxable benefit of a company car — with the 35% depreciation URA still omits.', tag: 'Employment', hot: 'URA is 9 years stale' },
  { k: 'housing',     kw: 'house accommodation rent employee staff quarters housing benefit', t: 'Housing benefit',          d: 'The lesser of market rent and 15%. And there is NO gross-up, whatever you have been told.', tag: 'Employment', hot: 'The gross-up is a myth' },
  { k: 'loanbenefit', kw: 'staff loan employee advance salary loan cheap interest benefit',    t: 'Employee loan benefit',    d: 'The benefit of a cheap staff loan — and a rate the Act never actually defines.', tag: 'Employment' },
  { k: 'terminal',    kw: 'gratuity terminal benefits redundancy severance final payment leaving quit', t: 'Gratuity and terminal benefits', d: 'The 25% relief — and why gratuity does not get it.', tag: 'Employment', hot: 'RSM publishes this wrong' },
  { k: 'secondjob',   kw: 'second job two jobs part time moonlight extra income side hustle',  t: 'Two jobs',                 d: 'A second job is taxed at a flat 30%. And you can claim the overpayment back.', tag: 'Employment', hot: 'A second Isaac' },
  // ── Tier 2 · business ──────────────────────────────────────────────────────
  { k: 'capallow',    kw: 'depreciation capital allowance asset machine computer car write off wear tear', t: 'Capital allowances', d: '40 / 30 / 20 reducing balance — and the 50% first-year write-off that no longer exists.', tag: 'Company', hot: 'The initial allowance is gone' },
  { k: 'startupcost', kw: 'startup costs setting up incorporation licence legal fees new business', t: 'Start-up costs',       d: '25% a year for four years. Most accountants expense it once and lose three quarters of it.', tag: 'Company' },
  { k: 'provisional', kw: 'provisional tax instalment advance estimate quarterly payment',    t: 'Provisional tax',          d: 'Two instalments, or four — less the WHT already taken from you.', tag: 'Company' },
  { k: 'inputvat',    kw: 'input vat reclaim recover blocked car entertainment telephone airtime claim back', t: 'Input VAT you can reclaim', d: 'Cars and entertainment are blocked. But 90% of your phone VAT is recoverable.', tag: 'VAT', hot: 'Most businesses claim nothing' },
  { k: 'advancetax',  kw: 'lorry truck taxi bus boda transport advance tax tonne seat vehicle', t: 'Advance tax — transport', d: '50,000 a tonne, 20,000 a seat — and the tonnage nearly every guide gets wrong.', tag: 'Transport' },
  { k: 'stampduty',   kw: 'stamp duty land transfer lease shares property buy sell title deed', t: 'Stamp duty',              d: 'Transfer, lease, share capital — and a rate that may have doubled without anyone confirming it.', tag: 'Property', hot: 'We refuse to guess' },
  // ── Personal finance — no tax law, and therefore no excuse ─────────────────
  { k: 'loan',        kw: 'loan borrow repayment interest flat rate reducing balance bank sacco', t: 'The loan you were offered', d: 'A flat 18% is really about 31%. Almost no Ugandan borrower converts it.', tag: 'Money', hot: 'The flat rate is not the rate' },
  { k: 'savings',     kw: 'save saving compound interest deposit grow money future',           t: 'Saving up',                d: 'What it grows to — and what it will actually BUY after inflation.', tag: 'Money' },
  { k: 'retirement',  kw: 'retire retirement pension nssf old age fund pot',                    t: 'Retiring',                 d: 'Your employer’s 10% is exempt going in AND coming out. Nothing else in the code is.', tag: 'Money', hot: 'The double exemption' },
  { k: 'emergency',   kw: 'emergency fund rainy day savings buffer job loss safety',            t: 'If the income stopped',    d: 'What an emergency fund buys is the ability to say no to bad credit.', tag: 'Money' },
  { k: 'tbill',       kw: 'treasury bill bond government securities invest yield return',       t: 'Treasury bills',           d: 'The advertised yield is before tax. Government securities carry 20%, not 15%.', tag: 'Investing' },
  { k: 'mortgage',    kw: 'mortgage house home buy property afford deposit',                    t: 'Buying a home',            d: 'The most you can borrow — and why you should borrow less.', tag: 'Investing' },
  { k: 'valuation',   kw: 'valuation sell my business worth price exit buyer',                  t: 'What is my business worth?', d: 'Three ways of starting the conversation. None of them is a price.', tag: 'Investing', hot: 'We refuse to give a number' },
];

// ═════════════════════════════════════════════════════════════════════════════
// SEARCH — in the words a person would actually use
// ═════════════════════════════════════════════════════════════════════════════

// People do not type keywords. They type sentences:
//   "i owe ura money"      "how much do i pay my staff"     "what is my take home"
//
// Requiring EVERY word to match means the word "i" sinks the search — and no
// keyword list on earth will ever contain "i". So we drop the words that carry no
// meaning, and require the rest. If a query is nothing BUT stopwords, we show
// everything rather than nothing.
const STOPWORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'a', 'an', 'the', 'is', 'are', 'am',
  'do', 'does', 'did', 'to', 'of', 'for', 'on', 'in', 'at', 'and', 'or', 'if',
  'what', 'how', 'much', 'many', 'should', 'can', 'will', 'be', 'it', 'that', 'this',
]);

/** Every MEANINGFUL word the user typed must appear somewhere. Order is irrelevant. */
function matchCalcs(q) {
  const all = q.toLowerCase().split(/[^a-z0-9%]+/).filter(Boolean);
  const terms = all.filter((t) => !STOPWORDS.has(t));
  // "how much do i..." — all stopwords. Show everything; do not punish them for asking.
  if (!terms.length) return CALCS;
  return CALCS.filter((c) => {
    const hay = `${c.t} ${c.d} ${c.tag} ${c.hot || ''} ${c.kw}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

function renderIndex(q = '') {
  const hits = matchCalcs(q);
  const grid = $('calc-index');

  // 🔴 A ZERO-RESULT SEARCH IS NOT A DEAD END. It is a question we failed to
  // understand — and the guide exists precisely for the person who cannot name
  // what they need. Send them there, do not shrug at them.
  if (!hits.length) {
    grid.innerHTML = `<div class="card" style="grid-column:1/-1">
      <h2 style="font-size:17px;font-weight:500;margin-bottom:8px">Nothing matches “${esc(q)}”</h2>
      <p style="font-size:14px;color:var(--ink-700);line-height:1.6;margin-bottom:14px">
        That may be our fault, not yours. If you are not sure what you are looking for,
        do not guess at a tax word — <strong>let the guide ask you a few plain questions instead.</strong>
      </p>
      <button class="cta" data-action="restart">Ask me what applies to me →</button>
    </div>`;
    $('calc-count').textContent = 'no matches';
    return;
  }

  $('calc-count').textContent = q
    ? `${hits.length} of ${CALCS.length}`
    : `${CALCS.length} calculators`;

  grid.innerHTML = hits.map((c) => `
    <button class="door live" style="text-align:left" data-calc="${esc(c.k)}" data-title="${esc(c.t)}">
      <div class="door-top">
        <span class="door-badge live">${esc(c.tag)}</span>
        <h3>${esc(c.t)}</h3>
      </div>
      <p class="door-p">${esc(c.d)}</p>
      ${c.hot ? `<p class="door-sub" style="color:var(--amber-700)">${esc(c.hot)}</p>` : ''}
      <span class="door-go">Open →</span>
    </button>`).join('');
}

function showIndex() {
  setHash('all');
  showIndexView();
}

/** The VIEW. Touches no URL. This separation is the whole fix. */
function showIndexView() {
  $('view-guide').hidden = true;
  $('view-result').hidden = true;
  $('view-calc').hidden = true;
  $('view-index').hidden = false;
  const box = $('calc-search');
  renderIndex(box ? box.value : '');
  if (box) box.focus();
  window.scrollTo(0, 0);
}


const renderers = {
  paye: renderPaye, presump: renderPresump, wht: renderWht, vat: renderVat,
  arrears: renderArrears, entity: renderEntity, extract: renderExtract,
  exempt: renderExempt, tcc: renderTcc,
  // Tier 1, completed 11 July 2026
  netgross: renderNetGross, cost: renderCost, cit: renderCit,
  election: renderElection, rental: renderRental, whtrate: renderWhtRate,
  vatamt: renderVatAmt, vatdereg: renderVatDereg, vd: renderVd,
  // Tier 2 — verified against primary law, 11 July 2026
  mvbenefit: renderMvBenefit, housing: renderHousing, loanbenefit: renderLoanBenefit,
  terminal: renderTerminal, secondjob: renderSecondJob, capallow: renderCapAllow,
  startupcost: renderStartupCost, provisional: renderProvisional,
  inputvat: renderInputVat, advancetax: renderAdvanceTax, stampduty: renderStampDuty,
  // Personal finance — no tax law, and therefore no excuse
  loan: renderLoan, savings: renderSavings, retirement: renderRetirement,
  emergency: renderEmergency, tbill: renderTbill, mortgage: renderMortgage,
  valuation: renderValuation,
  // F4 — the commencement clock
  clock: renderClock,
};

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 EVENT WIRING — and the bug that made every calculator dead on click.
//
// The directory used to build its buttons like this:
//
//     onclick="showCalc('${c.k}', ${JSON.stringify(c.t)})"
//
// JSON.stringify emits DOUBLE QUOTES. The attribute is delimited by DOUBLE
// QUOTES. So the browser received:
//
//     onclick="showCalc('paye', "  paye=""  and=""  net=""  pay")"=""
//
// The handler was severed mid-argument and every card in the calculator centre
// did nothing when clicked.
//
// And the UI test did not catch it — because the test called showCalc() DIRECTLY
// instead of clicking the button. A test that bypasses the control cannot see a
// broken control. It was testing the renderer and calling it a page.
//
// So: NO INLINE HANDLERS. Data attributes and delegated listeners. There is now
// no string in this codebase that has to survive being both HTML and JavaScript
// at the same time — which is the only real fix, because escaping is something
// you can forget and structure is not.
// ═════════════════════════════════════════════════════════════════════════════

// The page's own actions, registered with the dispatcher in theme.js.
// `data-action="showIndex"` in the HTML → this function. No inline handler, no
// string that has to survive being parsed as both HTML and JavaScript.
window.SelahActions = window.SelahActions || {};
window.SelahActions.restart      = restart;
window.SelahActions.showIndex    = showIndex;
window.SelahActions.backToResult = backToResult;

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-calc]');
  if (btn) showCalc(btn.dataset.calc, btn.dataset.title);
});

// `input` covers typing and checkboxes. `change` is what a <select> reliably
// fires. Listening for only one of them leaves a control silently dead.
const rerender = (e) => {
  if (!e.target.closest('#view-calc')) return;
  const open = document.querySelector('#view-calc .panel:not([hidden])');
  if (open) renderers[open.id.replace('panel-', '')]();
};
document.addEventListener('input', rerender);

// The search box. Filters as you type — no button to press, no page to reload.
document.addEventListener('input', (e) => {
  if (e.target.id === 'calc-search') renderIndex(e.target.value);
});
document.addEventListener('change', rerender);

$('theme').addEventListener('click', () => {
  const r = document.documentElement;
  const next = r.dataset.theme === 'dark' ? 'light' : 'dark';
  r.dataset.theme = next;
  try { localStorage.setItem('selah-theme', next); } catch (e) {}
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = next === 'dark' ? '#0A0F0D' : '#F7F9F8';
});

window.setA = setA;
window.restart = restart;
window.showResult = showResult;
window.showCalc = showCalc;
window.backToResult = backToResult;

renderQuiz();

// ═════════════════════════════════════════════════════════════════════════════
// ROUTING — and the infinite loop that made every calculator a blank page.
//
// 🔴 WHAT WENT WRONG, because it is worth understanding rather than patching.
//
// The first version of this router had showIndex() write `#all` into the URL, and
// showCalc() write `#calc=<key>`. Both are reasonable on their own. Together they
// were a trap:
//
//     #calc=whtrate  →  bootFromHash()
//                    →  showIndex()   ... which REWROTE the hash to #all
//                    →  hashchange fires
//                    →  bootFromHash() again
//                    →  showCalc()    ... which rewrote the hash BACK
//                    →  hashchange fires
//                    →  forever.
//
// The browser spent its entire life re-routing and never painted. Every
// calculator was a blank page — including the deep link I had just added to help
// diagnose blank pages.
//
// AND MY TESTS COULD NOT SEE IT, because jsdom was running on `about:blank`,
// where there is no real URL and `hashchange` never fires. A router tested
// without a URL is not tested. The test now runs against a real
// http://localhost:8080/... URL, with a real hash, and counts the events.
//
// THE FIX IS STRUCTURAL, NOT A GUARD:
//
//   1. The VIEW functions (showIndexView) never touch the URL.
//   2. Only setHash() writes the URL, and it SKIPS the write if the hash is
//      already what it wants — so a route that arrives from the URL never
//      rewrites the URL that summoned it.
//   3. A hashchange WE caused is ignored. Only a real one (back button, pasted
//      link) re-routes.
//
// A URL is a description of the state. It must never be allowed to become a
// cause of it.
// ═════════════════════════════════════════════════════════════════════════════

let selfInflicted = false;

/** Write the URL — but only if it actually needs writing. */
function setHash(h) {
  const current = (location.hash || '').replace(/^#/, '');
  if (current === h) return;              // ← the line that breaks the loop
  selfInflicted = true;
  try {
    if (h) location.hash = h;
    else history.replaceState(null, '', location.pathname);
  } catch (e) {
    selfInflicted = false;                // the URL is cosmetic; the app is not
  }
}

/**
 *   #all        → the calculator centre
 *   #calc=paye  → straight into that calculator (bookmarkable, shareable)
 *   (nothing)   → the guide, which is still the front door
 */
function bootFromHash() {
  const h = (location.hash || '').replace(/^#/, '');

  if (h === 'all') { showIndexView(); return true; }

  const m = /^calc=([a-z0-9]+)$/i.exec(h);
  if (m) {
    const c = CALCS.find((x) => x.k === m[1]);
    if (c) {
      showIndexView();          // ← the VIEW. It does not touch the URL.
      showCalc(c.k, c.t);       // ← setHash() sees the hash is already right, and does nothing.
      return true;
    }
  }
  return false;
}

window.addEventListener('hashchange', () => {
  // A hashchange we caused ourselves is not a navigation. Ignoring it is what
  // stops the router from re-entering itself forever.
  if (selfInflicted) { selfInflicted = false; return; }
  bootFromHash();
});

bootFromHash();
