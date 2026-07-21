/**
 * SELAH — THE UI SMOKE TEST
 *
 * The engine can be perfect and the page still blank. This loads the REAL html,
 * the REAL bundle and the REAL renderers in a DOM, and opens every calculator.
 *
 * It asserts the thing that actually matters: THE UI RENDERS THE TRACE AND NEVER
 * PRODUCES ONE. If a renderer computes a number itself, the trace and the screen
 * can disagree — and the screen is what the user believes.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// 🔴 __dirname, NEVER an absolute path. This test was written in a sandbox and
// carried that sandbox's path into the repo — so it passed on my machine and
// killed the Docker build on the first run. The build was right to fail.
const WEB = __dirname;
const html = fs.readFileSync(path.join(WEB, 'calculators.html'), 'utf8');

// 🔴 A REAL URL. NOT about:blank.
//
// This suite used to construct jsdom with no `url`, which defaults to
// about:blank. On about:blank there is no real location and jsdom fires NO
// hashchange events — so an INFINITE HASHCHANGE LOOP in the router was
// completely invisible to 158 passing tests, while every calculator in the real
// browser was a blank page.
//
// A router tested without a URL is not tested. Give it the URL the user has.
// 🔴 AND THE REAL STYLESHEETS.
//
// jsdom does not fetch <link rel=stylesheet>. So every assertion of the form
// "the panel is visible" was checking `panel.hidden === false` — a JavaScript
// property — while the actual CSS said `.panel { display: none }` unless a class
// the code never set was present.
//
// 167 tests passed. Every calculator was invisible in every real browser.
//
// We now INLINE the real CSS into the document, so getComputedStyle() tells the
// truth and "visible" means visible.
const cssText = ['tokens.css', 'home.css', 'visuals.css']
  .map((f) => { try { return fs.readFileSync(path.join(WEB, 'assets', f), 'utf8'); } catch (e) { return ''; } })
  .join('\n');
const htmlWithCss = html.replace('</head>', `<style>${cssText}</style></head>`);

const dom = new JSDOM(htmlWithCss, {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  url: 'http://localhost:8080/calculators.html',
});
const { window } = dom;
window.localStorage = { getItem: () => null, setItem: () => {} };
window.scrollTo = () => {};

window.eval(fs.readFileSync(path.join(WEB, 'assets/theme.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(WEB, 'assets/engine.bundle.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(WEB, 'assets/calculators.js'), 'utf8'));

let pass = 0, fail = 0;
const ok = (n, c) => c ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n));

console.log('\nThe calculator centre');
window.showIndex();
const cards = window.document.querySelectorAll('#calc-index .door');
ok(`the directory lists every calculator (found ${cards.length})`, cards.length === 37);
ok('the guide is still the front door — the index is hidden until asked for',
   html.includes('id="view-index" hidden'));

console.log('\nEvery calculator opens, renders, and shows a citation');
// Derive the list from the RENDERED DIRECTORY, not from a constant we import.
// If a calculator is in the code but not on the page, this test must not see it —
// because neither will the user.
const CALCS = [...cards].map((el) => ({
  k: el.dataset.calc,
  t: el.querySelector('h3').textContent,
}));
for (const c of CALCS) {
  let err = null;
  try { window.showCalc(c.k, c.t); } catch (e) { err = e; }
  if (err) { ok(`${c.k} — renders`, false); console.log('      ' + err.message); continue; }
  const out = window.document.getElementById('out-' + c.k);
  const txt = out ? out.textContent : '';
  ok(`${c.k.padEnd(9)} renders, cites its source, and shows a number or a refusal`,
     !!out && txt.length > 80 &&
     (out.querySelector('.cite') !== null || out.querySelector('.refusal') !== null));
}

console.log('\nThe non-negotiables');
window.showCalc('paye', 'PAYE');
window.document.getElementById('paye-res').value = 'non-resident';
window.renderPaye();
const payeOut = window.document.getElementById('out-paye');
ok('a non-resident gets a REFUSAL CARD, not a number',
   payeOut.querySelector('.refusal') !== null && !/UGX/.test(payeOut.querySelector('.big') ? '' : 'x'));

window.showCalc('cost', 'True cost');
const costOut = window.document.getElementById('out-cost').textContent;
ok('the true-cost page says the new severance law is NOT in force',
   costOut.includes('not in force') || costOut.includes('NOT commenced'));
ok('...and does not silently bake it into the total',
   costOut.includes('13,200,000'));

window.showCalc('vatdereg', 'VAT dereg');
ok('the VAT deregistration page names the trap by name',
   window.document.getElementById('out-vatdereg').textContent.includes('stuck'));

window.showCalc('vd', 'Voluntary disclosure');
ok('voluntary disclosure refuses to promise the outcome',
   window.document.getElementById('out-vd').textContent.includes('discretion, not a right'));

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 CLICK THE BUTTONS. TYPE IN THE FIELDS.
//
// The first version of this file called showCalc() and renderPaye() directly.
// Everything passed — and every card in the calculator centre was DEAD ON CLICK,
// because the onclick attribute had been shattered by an unescaped double quote.
//
// A test that calls the function behind the button cannot see a broken button.
// It is testing the renderer and calling it a page.
//
// So from here on: we CLICK, and we TYPE, and we let the real listeners run.
// ═════════════════════════════════════════════════════════════════════════════
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

console.log('\nEvery card in the directory actually OPENS when clicked');
window.showIndex();
const keys = [...window.document.querySelectorAll('#calc-index .door')].map((d) => d.dataset.calc);
for (const key of keys) {
  window.showIndex();
  // Re-query. showIndex() rebuilds the directory, so any element captured before
  // it ran is DETACHED — and a click on a detached node bubbles to nothing.
  const door = window.document.querySelector(`#calc-index .door[data-calc="${key}"]`);
  click(door);
  const panel = window.document.getElementById('panel-' + key);
  const opened = panel && !panel.hidden && !window.document.getElementById('view-calc').hidden;
  ok(`clicking "${door.querySelector('h3').textContent}" opens it`, opened);
}

// The narrow rule that actually matters: nothing we GENERATE may carry an inline
// handler, because generated strings interpolate user-facing text into an
// attribute — and that is precisely where the double quote broke us. The static
// handlers written by hand in the HTML take no arguments and cannot shatter.
window.showIndex();
ok('nothing we GENERATE carries an inline onclick — no string must be HTML and JS at once',
   !window.document.getElementById('calc-index').innerHTML.includes('onclick='));

console.log('\nThe answers RECOMPUTE when the inputs change');
// 🔴 An earlier assertion above flipped paye-res to 'non-resident' and never put
// it back. The PAYE panel then showed a REFUSAL before and after — identical text,
// so "did the answer change?" was false, and the test blamed the page.
// Shared mutable DOM is shared mutable state. Reset what you touch.
window.document.getElementById('paye-res').value = 'resident';
const reacts = [
  ['paye',     'paye-gross',     '2000000',  'input'],
  ['netgross', 'ng-target',      '2000000',  'input'],
  ['cost',     'tc-gross',       '3000000',  'input'],
  ['cit',      'cit-chargeable', '50000000', 'input'],
  ['election', 'el-expenses',    '98000000', 'input'],
  ['rental',   'rn-rent',        '30000000', 'input'],
  ['vatamt',   'va-amt',         '236000',   'input'],
  ['vatdereg', 'vd-a',           '400000000','input'],
  ['vd',       'vdi-principal',  '9000000',  'input'],
  ['arrears',  'arr-principal',  '8000000',  'input'],
];
for (const [panel, field, val, kind] of reacts) {
  window.showCalc(panel, panel);
  const out = window.document.getElementById('out-' + panel);
  const before = out.textContent;
  const input = window.document.getElementById(field);
  input.value = val;
  fire(input, kind);
  ok(`${panel.padEnd(9)} recomputes when ${field} changes`, out.textContent !== before);
}

// A <select> is the control most likely to be silently dead: it fires `change`,
// and a page listening only for `input` will never hear it.
window.showCalc('paye', 'PAYE');
const sel = window.document.getElementById('paye-res');
sel.value = 'resident';
fire(sel, 'change');
const before = window.document.getElementById('out-paye').textContent;
sel.value = 'non-resident';
fire(sel, 'change');
ok('a <select> fires `change` — and the page LISTENS for it',
   window.document.getElementById('out-paye').textContent !== before);
ok('...and switching to non-resident produces the REFUSAL, live',
   window.document.querySelector('#out-paye .refusal') !== null);

// A checkbox, likewise.
window.showCalc('rental', 'Rental');
const rBefore = window.document.getElementById('out-rental').textContent;
const cb = window.document.getElementById('rn-ind');
cb.checked = false;
fire(cb, 'change');
ok('a checkbox flips the answer — individual becomes company, live',
   window.document.getElementById('out-rental').textContent !== rBefore);

// ═════════════════════════════════════════════════════════════════════════════
// THE GUIDE — walked the way a real person walks it. By clicking.
//
// This is the front door: the screen that answers "which taxes apply to me?" for
// someone who does not know a single tax word. No test had ever touched it.
// ═════════════════════════════════════════════════════════════════════════════
console.log('\nThe guide — answered by clicking, like a person would');

window.restart();
const D = window.document;

ok('the guide opens with a question and no jargon', D.querySelectorAll('#quiz .q').length >= 1);
ok('"Show me my taxes" starts DISABLED — you cannot skip the questions',
   D.getElementById('quiz-go').disabled === true);
ok('the quiz builds NO inline handlers', !D.getElementById('quiz').innerHTML.includes('onclick='));

// Answer every question that appears, by clicking, until none are left.
//
// NOTE: renderQuiz() rebuilds #quiz on every answer, so you cannot mark a question
// as "done" with an attribute — the re-render wipes it. Answer whichever question
// is still UNANSWERED (has no selected button), re-query, repeat. The question set
// GROWS as you answer, because later questions depend on earlier ones. That is the
// point of the guide, and a test that does not re-query cannot walk it.
let clicks = 0;
for (let guard = 0; guard < 30; guard++) {
  // fill any number question first — it has no buttons to click
  const num = [...D.querySelectorAll('#quiz [data-qnum]')].find((i) => !i.value);
  if (num) { num.value = '50000000'; fire(num, 'input'); clicks++; continue; }

  const unanswered = [...D.querySelectorAll('#quiz .q')]
    .find((q) => q.querySelector('.qbtn') && !q.querySelector('.qbtn.on'));
  if (!unanswered) break;
  click(unanswered.querySelector('.qbtn'));   // take the first option
  clicks++;
}
ok(`answered ${clicks} questions by clicking — every button responded`, clicks >= 3);
ok('every question that appeared is now answered',
   [...D.querySelectorAll('#quiz .q')].every((q) => !q.querySelector('.qbtn') || q.querySelector('.qbtn.on')));
ok('and "Show me my taxes" is now ENABLED', D.getElementById('quiz-go').disabled === false);

click(D.getElementById('quiz-go'));
ok('clicking it shows the result', !D.getElementById('view-result').hidden);
const obs = D.querySelectorAll('#obligations .ob');
ok(`it names the taxes that apply (${obs.length} found)`, obs.length >= 1);
ok('each one says WHY it applies to YOU, specifically',
   [...obs].every((o) => o.textContent.includes('Why it applies')));
ok('and none of the result cards carries an inline handler',
   !D.getElementById('obligations').innerHTML.includes('onclick='));

// The "show me the working" button on an obligation card — the bridge from the
// guide into the calculator. Same delegated listener, same bug class.
const workBtn = D.querySelector('#obligations [data-calc]');
if (workBtn) {
  const key = workBtn.dataset.calc;
  click(workBtn);
  ok(`"Show me the working" opens the ${key} calculator`,
     !D.getElementById('panel-' + key).hidden && !D.getElementById('view-calc').hidden);
} else {
  ok('an obligation offers to show its working', false);
}

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 THE CSP. The bug that broke every button — and that no test could see.
//
// nginx sends `script-src 'self'`. The browser then refuses to run any inline
// <script> or any on*= attribute. jsdom does NOT enforce this, so every test in
// this file passed while the live site sat there doing nothing.
//
// We cannot make jsdom enforce CSP. So we assert the INVARIANT instead: there is
// no inline JavaScript in the shipped pages, and the policy that forbids it has
// not been quietly weakened. build.js enforces the same thing and halts on it.
// ═════════════════════════════════════════════════════════════════════════════
console.log('\nNothing inline — the pages must survive their own CSP');

for (const page of ['index.html', 'individual.html', 'organisation.html', 'calculators.html']) {
  const src = fs.readFileSync(path.join(WEB, page), 'utf8');
  const inlineScripts = (src.match(/<script\b[^>]*>/g) || []).filter((t) => !/\bsrc=/.test(t));
  const handlers = src.match(/\son(click|input|change|error|submit)\s*=/g) || [];
  ok(`${page.padEnd(19)} no inline <script>, no on*= handler`,
     inlineScripts.length === 0 && handlers.length === 0);
}
// Read the DIRECTIVE, not the prose. The file's own comments talk ABOUT
// 'unsafe-inline' at length, and a naive regex over the whole file matches the
// comment and fails. A test that cannot tell a rule from a remark about the rule
// is a test that will be switched off.
const nginx = fs.readFileSync(path.join(WEB, '..', 'nginx.conf'), 'utf8')
  .split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
const cspLine = (/Content-Security-Policy\s+"([^"]+)"/.exec(nginx) || [])[1] || '';
const scriptSrc = (/script-src ([^;]+)/.exec(cspLine) || [])[1] || '';
ok('the CSP has a script-src directive at all', scriptSrc.includes("'self'"));
ok("and it still forbids inline script — nobody weakened it to make a button work",
   !scriptSrc.includes("'unsafe-inline'"));

console.log('\n"Browse all calculators" — the button that did nothing');

window.restart();
const browse = [...window.document.querySelectorAll('[data-action="showIndex"]')]
  .find((b) => /Browse all/i.test(b.textContent));
ok('the button exists and declares an ACTION, not a handler', !!browse);
click(browse);   // ← through the real delegated dispatcher in theme.js
ok('clicking it OPENS the calculator centre', !window.document.getElementById('view-index').hidden);
ok('...and the directory is populated', window.document.querySelectorAll('#calc-index .door').length === 37);

// Every card must have a panel, and every panel a card. A calculator you cannot
// reach is a calculator that does not exist — and a panel with no card is dead code.
const cardKeys  = [...window.document.querySelectorAll('#calc-index .door')].map((d) => d.dataset.calc);
const panelKeys = [...window.document.querySelectorAll('#view-calc .panel')].map((p) => p.id.replace('panel-', ''));
ok('every card in the directory has a panel behind it',
   cardKeys.filter((k) => !panelKeys.includes(k)).length === 0);
ok('and every panel is reachable from the directory — no orphans',
   panelKeys.filter((k) => !cardKeys.includes(k)).length === 0);

console.log('\nSearch — in the words a person would actually use');

const search = window.document.getElementById('calc-search');
const found = () => [...window.document.querySelectorAll('#calc-index .door')].map((d) => d.dataset.calc);
const typeSearch = (q) => { search.value = q; fire(search, 'input'); return found(); };

// 🔑 The whole point: NOT a single one of these is the name of a tax. A person who
// already knows the word "presumptive" does not need this company.
const plain = [
  ['salary',            'paye'],
  ['take home',         'netgross'],
  ['rent',              'rental'],
  ['tender',            'tcc'],
  ['i owe ura money',   'arrears'],
  ['pay myself',        'extract'],
  ['my staff',          'cost'],
  ['small business',    'presump'],
  ['supplier',          'whtrate'],
  ['come off vat',      'vatdereg'],
];
for (const [q, expected] of plain) {
  ok(`"${q}"`.padEnd(22) + ` finds ${expected}`, typeSearch(q).includes(expected));
}

// The new tiers, searched the way a person would ask for them.
for (const [q, expected] of [
  ['company car',      'mvbenefit'],
  ['gratuity',         'terminal'],
  ['staff loan',       'loanbenefit'],
  ['depreciation',     'capallow'],
  ['lorry',            'advancetax'],
  ['stamp duty',       'stampduty'],
  ['borrow',           'loan'],
  ['retire',           'retirement'],
  ['treasury bill',    'tbill'],
  ['sell my business', 'valuation'],
  ['airtime',          'inputvat'],
]) {
  ok(`"${q}"`.padEnd(22) + ` finds ${expected}`, typeSearch(q).includes(expected));
}

ok('the tax word still works, for those who know it', typeSearch('paye').includes('paye'));
ok('search narrows — two words are an AND, not an OR', typeSearch('vat register').length < typeSearch('vat').length);
ok('clearing the box brings all 36 back', typeSearch('').length === 37);
ok('the count is shown, honestly', window.document.getElementById('calc-count').textContent.includes('37'));

// A zero-result search is a question we failed to understand — not a dead end.
typeSearch('qqqq');
ok('a search with no matches does NOT just shrug',
   window.document.getElementById('calc-index').textContent.includes('let the guide ask you'));
const rescue = window.document.querySelector('#calc-index [data-action="restart"]');
ok('...it offers to ASK you what applies to you instead', !!rescue);
click(rescue);
ok('...and that button works', !window.document.getElementById('view-guide').hidden);

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 "THE PAGE HAS NO CALCULATORS ON IT"
//
// A user clicked the nav link labelled CALCULATORS and landed on a questionnaire.
// They concluded, entirely reasonably, that the page had no calculators. It had
// thirty-six — three clicks away, behind a button.
//
// The guide is still the front door and should be. But a link called
// "Calculators" must land on calculators.
// ═════════════════════════════════════════════════════════════════════════════
console.log('\nA link called "Calculators" must land on calculators');

for (const page of ['index.html', 'individual.html', 'organisation.html', 'calculators.html']) {
  const src = fs.readFileSync(path.join(WEB, page), 'utf8');
  // Only the NAV link, labelled "Calculators", must land on calculators.
  // The hero button ("Find out what applies to me") SHOULD still open the guide —
  // that is the whole product. The bug was a link whose LABEL promised one thing
  // and whose DESTINATION delivered another.
  ok(`${page.padEnd(19)} the nav link labelled "Calculators" opens the CENTRE`,
     /<a href="calculators\.html#all">Calculators<\/a>/.test(src));
}

console.log('\nDeep links — a calculator can be bookmarked and shared');

// #all → the centre
window.location.hash = 'all';
window.restart();
window.bootFromHash();
ok('#all opens the calculator centre', !window.document.getElementById('view-index').hidden);

// #calc=<key> → straight into it
for (const key of ['paye', 'stampduty', 'loan', 'mvbenefit']) {
  window.location.hash = `calc=${key}`;
  window.bootFromHash();
  const panel = window.document.getElementById('panel-' + key);
  ok(`#calc=${key.padEnd(10)} opens it directly`, panel && !panel.hidden);
}

// An unknown deep link must not blank the page.
window.location.hash = 'calc=nonsense';
ok('a nonsense deep link does NOT blank the page', window.bootFromHash() === false);

console.log('\n🔴 A blank screen must be impossible');

// If a calculator is listed but its renderer or panel is missing, the page must
// SAY SO. A blank screen tells the user nothing and tells us nothing — and a
// product whose entire claim is that it refuses to fail silently must not fail
// silently.
window.showCalc('a_calculator_that_does_not_exist', 'Ghost');
const errBox = window.document.getElementById('calc-error');
ok('a missing calculator shows an ERROR, not an empty page', errBox && !errBox.hidden);
ok('...and it says the fault is OURS, not the user\'s',
   errBox.textContent.includes('it is ours, not yours'));
ok('...and it tells them to hard-refresh, which is the likeliest real cause',
   errBox.textContent.includes('Ctrl+Shift+R'));
ok('...and it gives them a way back', errBox.querySelector('[data-action="showIndex"]') !== null);

// And the guard must not have broken the normal path.
window.showCalc('paye', 'PAYE');
ok('a real calculator still opens, and the error box is hidden',
   !window.document.getElementById('panel-paye').hidden &&
   window.document.getElementById('calc-error').hidden);

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 THE ROUTER MUST NOT EAT ITSELF
//
// Every calculator rendered as a BLANK PAGE in the browser, because the deep-link
// router I added to help diagnose blank pages was in an infinite hashchange loop:
//
//     #calc=whtrate → showIndex() rewrote the hash to #all → hashchange →
//     showCalc() rewrote it back → hashchange → forever.
//
// The browser spent its whole life re-routing and never painted.
//
// These tests boot a FRESH page at a REAL URL, with a REAL hash, and COUNT the
// hashchange events. On the old code the count runs away. On the new code it is
// zero, because a route arriving FROM the URL never rewrites the URL.
// ═════════════════════════════════════════════════════════════════════════════
console.log('\nThe router must not eat itself');

function bootAt(hash) {
  const d = new JSDOM(htmlWithCss, {
    runScripts: 'outside-only', pretendToBeVisual: true,
    url: 'http://localhost:8080/calculators.html' + hash,
  });
  const win = d.window;
  win.scrollTo = () => {};
  let events = 0;
  win.addEventListener('hashchange', () => { events++; });
  win.eval(fs.readFileSync(path.join(WEB, 'assets/theme.js'), 'utf8'));
  win.eval(fs.readFileSync(path.join(WEB, 'assets/engine.bundle.js'), 'utf8'));
  win.eval(fs.readFileSync(path.join(WEB, 'assets/calculators.js'), 'utf8'));
  return { win, dom: d, events: () => events };
}

for (const key of ['whtrate', 'paye', 'stampduty', 'loan', 'mvbenefit', 'valuation']) {
  const b = bootAt(`#calc=${key}`);
  const panel = b.win.document.getElementById('panel-' + key);
  const out = b.win.document.getElementById('out-' + key);
  ok(`#calc=${key.padEnd(10)} renders — and does NOT loop`,
     panel && !panel.hidden && out.textContent.trim().length > 100 && b.events() < 5);
  b.dom.window.close();
}

const bAll = bootAt('#all');
ok('#all opens the centre, with no runaway routing',
   !bAll.win.document.getElementById('view-index').hidden && bAll.events() < 5);
bAll.dom.window.close();

const bNone = bootAt('');
ok('no hash → the guide, as before', !bNone.win.document.getElementById('view-guide').hidden);
bNone.dom.window.close();

const bBad = bootAt('#calc=nonsense');
ok('a nonsense deep link falls back to the guide — it does not blank',
   !bBad.win.document.getElementById('view-guide').hidden);
bBad.dom.window.close();

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 THE CSS MUST AGREE WITH THE JAVASCRIPT
//
// tokens.css said:
//
//     .panel        { display: none; }
//     .panel.active { display: block; }
//
// and the JavaScript toggled the `hidden` ATTRIBUTE. It never added `.active`.
// So every calculator panel was display:none, permanently, in every browser —
// while 167 tests happily confirmed that `panel.hidden === false`.
//
// Two mechanisms for one piece of state is not redundancy. It is a bug with a
// grace period.
//
// These tests read the COMPUTED STYLE, with the real stylesheets loaded. They
// check what the user can SEE, not what the code believes.
// ═════════════════════════════════════════════════════════════════════════════
console.log('\nThe CSS must agree with the JavaScript — computed, not believed');

const displayOf = (el) => window.getComputedStyle(el).display;

ok('the stylesheets actually loaded into the test DOM', cssText.length > 1000);

// The open panel must be VISIBLE — computed, with CSS applied.
window.showCalc('paye', 'PAYE');
const openPanel = window.document.getElementById('panel-paye');
ok('an OPEN panel computes to a visible display', displayOf(openPanel) !== 'none');
ok('...and the JS agrees it is not hidden', openPanel.hidden === false);

// Every other panel must be INVISIBLE.
const others = [...window.document.querySelectorAll('#view-calc .panel')].filter((p) => p.id !== 'panel-paye');
ok('every OTHER panel computes to display:none', others.every((p) => displayOf(p) === 'none'));

// And the inputs inside the open panel must actually be on screen — a panel that
// is visible but whose contents are not is the same blank page to the user.
const inputs = [...openPanel.querySelectorAll('input, select')];
ok(`the open panel's ${inputs.length} inputs are visible`,
   inputs.length > 0 && inputs.every((i) => displayOf(i) !== 'none'));

// Sweep every calculator. This is the assertion that would have caught it.
let invisible = 0;
for (const c of CALCS) {
  window.showCalc(c.k, c.t);
  const p = window.document.getElementById('panel-' + c.k);
  const o = window.document.getElementById('out-' + c.k);
  if (displayOf(p) === 'none' || !o || o.textContent.trim().length < 50) invisible++;
}
ok('ALL 37 calculators are actually VISIBLE on screen, with CSS applied', invisible === 0);

// 🔒 And the rule that stops it coming back: nothing may be hidden by a class
// that the JavaScript does not set.
const js = fs.readFileSync(path.join(WEB, 'assets/calculators.js'), 'utf8');
const classesToggledByJs = new Set([...js.matchAll(/classList\.(?:add|remove|toggle)\('([\w-]+)'\)/g)].map((m) => m[1]));

// Strip CSS comments FIRST. The fix for this very bug is documented in tokens.css
// by QUOTING the broken rule — and a scanner that cannot tell a rule from a remark
// about a rule will flag the tombstone and miss the corpse.
const cssRules = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
const panelHidingClasses = [...cssRules.matchAll(/\.panel\.([\w-]+)\s*\{[^}]*display\s*:\s*(?!none)/g)].map((m) => m[1]);
ok('no panel is shown by a CSS class the JavaScript never adds',
   panelHidingClasses.filter((c) => !classesToggledByJs.has(c)).length === 0);

console.log('\n' + '═'.repeat(56));
console.log(fail === 0 ? `\x1b[32m✓ ALL ${pass} UI TESTS PASSED\x1b[0m` : `\x1b[31m✗ ${fail} FAILED\x1b[0m, ${pass} passed`);
console.log('═'.repeat(56));

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 EXIT. EXPLICITLY. THIS IS NOT DEFENSIVE PROGRAMMING — IT IS THE FIX FOR A
//    BUG THAT HUNG THE DOCKER BUILD FOREVER.
//
// JSDOM is created with `pretendToBeVisual: true`, which starts a
// requestAnimationFrame loop. That loop is a live timer. It never stops.
//
// So the tests ran, printed, and PASSED — and then Node sat there with a
// non-empty event loop and REFUSED TO EXIT. The build printed
//
//     ✓ ALL 158 UI TESTS PASSED
//
// and then hung. Forever. On a green test run.
//
// I hit this locally too and papered over it by prefixing `timeout 35` to the
// command instead of asking WHY a finished test would not finish. A workaround
// that hides a hang is a workaround that ships the hang.
//
// window.close() stops the rAF loop. process.exit() guarantees it, because a
// test harness that cannot terminate is not a test harness — it is a deadlock
// with good news in it.
// ═════════════════════════════════════════════════════════════════════════════
dom.window.close();
process.exit(fail ? 1 : 0);
