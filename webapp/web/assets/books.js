/**
 * SELAH — THE BOOKS SCREENS
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE HARD PART OF THIS SCREEN IS WHAT IT REFUSES TO ADD UP.
 *
 * A drafted month is on the page, in full: salary 2,500,000, rent 800,000. And
 * every total reads ZERO — because nobody has been paid yet. Every other budgeting
 * app on earth would tell this person they have 1,300,000 left.
 *
 * The drafts are grey, they say "not yet confirmed", and they are counted in
 * nothing. That is not a UI detail. It is the product.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  const API = window.SelahAPI;
  const A = (window.SelahActions = window.SelahActions || {});
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());

  let current = null;          // the Book we are looking at
  let cats = [];
  let accts = [];

  const today = () => new Date().toISOString().slice(0, 10);

  // ═══════════════════════════════════════════════════════════════════════════
  // THE MONTH BEING VIEWED. A Book shows one month at a time; this is which one.
  // ═══════════════════════════════════════════════════════════════════════════
  let viewYM = null;                         // { y, m }  (m is 0-based)
  const nowYM = () => { const d = new Date(); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; };
  const pad = (n) => String(n).padStart(2, '0');

  const monthWindow = () => {
    const { y, m } = viewYM || nowYM();
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return { from: `${y}-${pad(m + 1)}-01`, to: `${y}-${pad(m + 1)}-${pad(last)}` };
  };
  const monthStart = () => monthWindow().from;   // kept: other code calls it

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthLabel = () => { const { y, m } = viewYM || nowYM(); return `${MONTHS[m]} ${y}`; };

  /** 🔑 past / current / future — the whole reason this feature is more than a date picker. */
  const monthState = () => {
    const a = viewYM || nowYM(); const b = nowYM();
    const av = a.y * 12 + a.m, bv = b.y * 12 + b.m;
    return av < bv ? 'past' : av > bv ? 'future' : 'current';
  };

  const shiftMonth = (n) => {
    const { y, m } = viewYM || nowYM();
    const d = new Date(Date.UTC(y, m + n, 1));
    viewYM = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  };

  const handle = (r) => {
    if (r.refused)   { if (window.SelahRenderRefused) window.SelahRenderRefused(r); return false; }
    if (r.offline)   { if (window.SelahRenderOffline) window.SelahRenderOffline(r); return false; }
    if (r.signedOut) { window.location.reload(); return false; }
    return true;
  };

  /** Any failure says SOMETHING. A blank screen looks exactly like a hang. */
  const problem = (el, r) =>
    ($(el).innerHTML =
      '<div class="card refuse"><h3>' + esc(r.headline || 'That did not work.') + '</h3>' +
      (r.why || []).map((w) => '<p>' + esc(w) + '</p>').join('') +
      (r.whatYouCanDoNow || []).map((w) => '<p class="muted">' + esc(w) + '</p>').join('') +
      (!r.headline && !r.why ? '<p class="muted">The server answered ' + esc(r.status || '?') + ' and said no more. This is our fault, not yours.</p>' : '') +
      '</div>');

  // ═══════════════════════════════════════════════════════════════════════════
  A.goBooks = async () => {
    window.SelahShow('books');
    $('bk-books').innerHTML = '<p class="muted">Loading…</p>';
    const r = await API.books();
    if (!handle(r)) return;
    if (!r.ok) return problem('bk-books', r);

    if (!r.books.length) {
      // 🔴 A BLANK SCREEN IS THE WORST THING A NEW USER CAN MEET. Every empty state
      //    must say WHAT this is, WHY it is empty, and give ONE obvious next step.
      $('bk-books').innerHTML =
        '<div class="card empty">' +
          '<div class="ico">📕</div>' +
          '<h3>No Books yet</h3>' +
          '<p>A Book holds your money in and money out. Start with one called <strong>Home</strong> — ' +
          'you can add a shop, rentals or a build later.</p>' +
          '<button class="primary" data-action="bkQuickHome">Create my Home Book</button>' +
        '</div>';
      return;
    }
    // 🔑 A GRID, NOT A STACK. Books are things you CHOOSE BETWEEN, and a choice is
    //    easier to make when the options are side by side than when you scroll past
    //    them one at a time. The last tile is the way to add another — so "create"
    //    lives with the things it creates, rather than in a form somewhere below.
    const ICON = { shared: '👥', personal: '📕' };

    $('bk-books').innerHTML =
      '<div class="tiles">' +
        r.books.map((b) => (
          '<button class="tile" data-action="bkOpen" data-id="' + esc(b.id) + '" data-name="' + esc(b.name) + '">' +
            '<div class="ti">' + (ICON[b.kind] || ICON.personal) + '</div>' +
            '<div class="tv" style="font-size:1.05rem;font-family:var(--font-ui);font-weight:600">' + esc(b.name) + '</div>' +
            '<div class="ts">' +
              (b.isDefault ? '<span class="pill ok">default</span> ' : '') +
              (b.kind === 'shared' ? '<span class="pill">shared</span> ' : '') +
              esc(b.currency) +
            '</div>' +
          '</button>'
        )).join('') +
        '<button class="tile tile-add" data-action="bkFocusNew">' +
          '<div class="ti">＋</div>' +
          '<div class="tv" style="font-size:1.05rem;font-family:var(--font-ui);font-weight:600">New Book</div>' +
          '<div class="ts">A shop, rentals, a build</div>' +
        '</button>' +
      '</div>';
  };

  /** The add-tile puts the cursor where the name goes. It does not make you hunt. */
  A.bkFocusNew = () => {
    const el = $('bk-newname');
    el.scrollIntoView({ block: 'center' });
    el.focus();
  };

  /** One tap. A new person should not have to think of a name to get started. */
  A.bkQuickHome = async () => {
    const r = await API.addBook('Home', 'personal');
    if (!handle(r)) return;
    if (!r.ok) return problem('bk-books', r);
    A.goBooks();
  };

  A.bkAddBook = async () => {
    const name = $('bk-newname').value.trim();
    if (!name) return;
    const r = await API.addBook(name, 'personal');
    if (!handle(r)) return;
    if (!r.ok) return problem('bk-books', r);
    $('bk-newname').value = '';
    A.goBooks();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  function renderMonthNav() {
    const st = monthState();
    $('bk-month-label').textContent = monthLabel();
    const tag = $('bk-month-tag');
    tag.textContent = st === 'past' ? 'closed' : st === 'future' ? 'not started' : 'this month';
    tag.className = st;
    // "Today" only appears when you have wandered off the current month.
    $('bk-today').hidden = st === 'current';
  }

  A.bkPrevMonth = async () => { shiftMonth(-1); await onMonthChange(); };
  A.bkNextMonth = async () => { shiftMonth(1);  await onMonthChange(); };
  A.bkThisMonth = async () => { viewYM = nowYM(); await onMonthChange(); };

  async function onMonthChange() {
    renderMonthNav();
    // 🔑 A FUTURE MONTH HAS NO ACTUALS. Land on the Budget tab — that is the only
    //    thing you can honestly do to a month that has not happened.
    if (monthState() === 'future') A.bkTab({ dataset: { tab: 'budget' } });
    await refresh();
  }

  A.bkOpen = async (el) => {
    current = { id: el.dataset.id, name: el.dataset.name };
    window.SelahShow('book');
    $('bk-title').textContent = current.name;
    viewYM = nowYM();                          // always open on the current month
    renderMonthNav();
    PANES.forEach((t) => { const p = $('bk-pane-' + t); if (p) p.hidden = t !== 'month'; });
    document.querySelectorAll('.tabs .tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'month'));
    await refresh();
  };

  async function refresh() {
    $('bk-summary').innerHTML = '<p class="muted">Loading…</p>';

    const [p, c] = await Promise.all([
      API.period(current.id, monthWindow().from, monthWindow().to),
      API.categories(current.id),
    ]);
    if (!handle(p)) return;
    if (!p.ok) return problem('bk-summary', p);

    cats = c.ok ? c.categories : [];
    accts = p.accounts || [];
    allEntries = p.entries || [];
    allBudgets = p.budgets || [];
    await loadPriceBook();

    // 🔑 CATEGORIES BELONG TO A DIRECTION. Salary is money in; rent is money out.
    //    Offering "Rent" as a place your salary came from is nonsense, and it is the
    //    kind of nonsense a tired thumb taps straight through. The dropdown shows
    //    only the categories that match the direction you have chosen.
    fillSheetCats();

    // 🔴 NO ACCOUNT IS PRE-SELECTED. The founder's rule: required every time, no
    //    defaults. The UI may SUGGEST. It may not SELECT. A pre-filled account is a
    //    guess that gets tapped through without being read.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 REBUILDING A <select> WIPES WHAT THE USER CHOSE.
    //
    // refresh() runs after every save — so the account the person picked for their
    // first boda ride was silently cleared before the second one. They would pick
    // it again. And again. Which is precisely the friction the sheet exists to
    // remove, reintroduced by a DOM rebuild nobody was watching.
    //
    // So: remember the choice, rebuild, put it back. And note what is NOT being
    // done here — nothing is pre-selected on a FIRST visit. The UI may remember
    // what a human chose. It may not choose for them.
    // ═══════════════════════════════════════════════════════════════════════
    const keep = { acct: $('bk-acct').value, from: $('bk-from').value, to: $('bk-to').value };

    const opts = accts.map((a) => '<option value="' + esc(a.id) + '">' + esc(a.name) + (a.scope === 'book' ? ' (shared)' : '') + '</option>').join('');
    $('bk-acct').innerHTML = '<option value="">— choose —</option>' + opts;
    $('bk-from').innerHTML = '<option value="">— from —</option>' + opts;
    $('bk-to').innerHTML = '<option value="">— to —</option>' + opts;

    if (keep.acct) $('bk-acct').value = keep.acct;
    if (keep.from) $('bk-from').value = keep.from;
    if (keep.to)   $('bk-to').value = keep.to;

    if (!$('bk-date').value) $('bk-date').value = today();

    renderDrafts(p);
    renderBudget(p.budget);      // 🔴 first: the summary's on-track line reads its result
    renderSummary(p.summary);
  }

  /** 🔴 THE DRAFTS. Grey. In no total. */
  function renderDrafts(p) {
    const drafts = (p.entries || []).filter((e) => e.status === 'expected');
    if (!drafts.length) { $('bk-drafts').innerHTML = ''; return; }

    $('bk-drafts').innerHTML =
      '<div class="card ask">' +
        '<h3>' + drafts.length + ' thing' + (drafts.length === 1 ? '' : 's') + ' we are expecting this month</h3>' +
        '<p class="muted">These have <strong>not</strong> happened. They are counted in no total below — ' +
        'not your income, not your spending, not your balances. Confirm each one when it actually does.</p>' +
        '<ul class="cal-items">' + drafts.map((d) => (
          '<li>' +
            '<span class="cal-label">' + esc(d.label) + '</span> ' +
            '<span class="muted">' + (d.direction === 'in' ? '+' : '−') + fmt(d.expected) + '</span>' +
            '<div class="row" style="margin-top:.4rem;gap:.4rem;flex-wrap:wrap">' +
              '<select data-draft-acct="' + esc(d.id) + '">' +
                '<option value="">— which account? —</option>' +
                accts.map((a) => '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>').join('') +
              '</select>' +
              '<input type="number" placeholder="' + fmt(d.expected) + '" data-draft-amt="' + esc(d.id) + '" style="max-width:9rem">' +
              '<button class="primary" data-action="bkConfirm" data-id="' + esc(d.id) + '">It arrived</button>' +
              '<button class="ghost" data-action="bkMissed" data-id="' + esc(d.id) + '">It did not come</button>' +
            '</div>' +
          '</li>'
        )).join('') + '</ul>' +
      '</div>';
  }

  /** The four numbers that matter, side by side. Not a paragraph. */
  function renderSummary(s) {
    if (!s) { $('bk-summary').innerHTML = ''; return; }
    const stat = (k, v, cls) => '<div class="stat ' + (cls || '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>';

    if (monthState() === 'future') {
      $('bk-summary').innerHTML =
        '<div class="card ask">' +
          '<h3>' + esc(monthLabel()) + ' has not started</h3>' +
          '<p>Nothing has moved yet, so there is nothing to record here. This is where you ' +
          '<strong>plan ahead</strong> — set what you expect to earn and spend.</p>' +
          '<button class="primary" data-action="bkGoBudget">Set ' + esc(monthLabel()) + ' budget →</button>' +
        '</div>';
      return;
    }

    $('bk-summary').innerHTML =
      '<div class="card">' +
        '<h3>' + esc(monthLabel()) + (monthState() === 'past' ? '' : ' so far') + '</h3>' +
        '<div class="stats">' +
          stat('Money in', fmt(s.confirmedIn)) +
          stat('Money out', fmt(s.confirmedOut)) +
          stat('Net', fmt(s.net), s.net < 0 ? 'bad' : '') +
          stat('Not yet confirmed', s.unconfirmedCount + ' line' + (s.unconfirmedCount === 1 ? '' : 's'), 'muted') +
        '</div>' +

        (s.unconfirmedCount
          ? '<p class="hint">The ' + s.unconfirmedCount + ' unconfirmed line' + (s.unconfirmedCount === 1 ? '' : 's') +
            ' (' + fmt(s.stillExpectedIn) + ' in, ' + fmt(s.stillExpectedOut) + ' out) are in <strong>none</strong> of the figures above. ' +
            'If every one arrived exactly as expected, the net would be ' + fmt(s.ifEverythingArrives.net) +
            ' — but that is a forecast, and it is not money.</p>'
          : '') +

        // 🔑 THE NUMBER NOBODY ELSE KEEPS.
        (s.didNotArrive && s.didNotArrive.length
          ? '<div class="card refuse" style="margin-top:.8rem">' +
              '<h3>Did not come: ' + fmt(s.incomeThatDidNotArrive) + '</h3>' +
              '<div class="tablewrap"><table class="t"><thead><tr>' +
                '<th>What</th><th class="num">Was expected</th>' +
              '</tr></thead><tbody>' +
              s.didNotArrive.map((d) => '<tr class="is-missed"><td class="wide">' + esc(d.label) + '</td>' +
                '<td class="num">' + fmt(d.expected) + '</td></tr>').join('') +
              '</tbody></table></div>' +
              '<p class="muted">We keep this. A deleted line is a fact destroyed — and a record of income that was promised and never paid is exactly the evidence you will want later.</p>' +
            '</div>'
          : '') +

        (s.transfers && s.transfers.count
          ? '<p class="src">' + s.transfers.count + ' transfer' + (s.transfers.count === 1 ? '' : 's') + ' (' + fmt(s.transfers.moved) +
            ') — counted in nothing. Moving money between your own pockets makes you no richer.</p>'
          : '') +
        onTrack() +
      '</div>' +
      renderLedger();
  }

  /**
   * 🔑 THE ONE THING YOU WANT TO KNOW WITHOUT LEAVING THIS SCREEN.
   *
   * The full budget-vs-actual table belongs on the Budget tab — it is a table, it
   * is detailed, and it is not what you came to the month for. But "am I on track?"
   * is. So it comes back here as a single line, and one tap gets you the detail.
   *
   * 🔴 IT IS COMPUTED FROM CONFIRMED MONEY ONLY, like everything else. A budget you
   *    are "on track" for because your salary has not arrived yet is not a comfort.
   */
  function onTrack() {
    const b = lastBudget;
    if (!b || !b.totalBudgeted) {
      return '<p class="hint">No budget set for this period. ' +
             '<button class="link" data-action="bkGoBudget">Set one →</button></p>';
    }
    const pct = Math.round((b.totalSpent / b.totalBudgeted) * 100);
    const over = b.totalSpent > b.totalBudgeted;
    const overCats = (b.rows || []).filter((r) => r.over).length;

    return '<div class="ontrack ' + (over ? 'bad' : 'ok') + '">' +
      '<div class="ontrack-l">' +
        '<span class="pill ' + (over ? 'over' : 'ok') + '">' + (over ? 'Over budget' : 'On track') + '</span> ' +
        '<strong>' + fmt(b.totalSpent) + '</strong> of ' + fmt(b.totalBudgeted) + ' budgeted' +
        (overCats ? ' <span class="src">· ' + overCats + ' categor' + (overCats === 1 ? 'y' : 'ies') + ' over</span>' : '') +
      '</div>' +
      '<span class="bar' + (over ? ' over' : '') + '"><i style="width:' + Math.min(100, pct) + '%"></i></span>' +
      '<button class="link" data-action="bkGoBudget">See the detail →</button>' +
    '</div>' +
    ((b.budgetsExcluded || []).length
      ? '<p class="src">' + b.budgetsExcluded.length + ' budget' + (b.budgetsExcluded.length === 1 ? ' is' : 's are') +
        ' not counted here — they only partly overlap this period, and a term is not one-third of a term each month.</p>'
      : '');
  }

  A.bkGoBudget = () => A.bkTab({ dataset: { tab: 'budget' } });

  /**
   * 🔴 THE LEDGER — WHICH DID NOT EXIST.
   *
   * The app showed you DRAFTS and a SUMMARY, and never once showed you the
   * transactions themselves. You could record a boda ride and then have no way to
   * see it, check it, or correct it. A ledger you cannot read is a ledger you
   * cannot trust, and a budget app whose entries are invisible is a black box with
   * opinions.
   *
   * Every entry, dated, with what it is and where the money went — and each row
   * SAYS which of the four states it is in, because that is the whole product.
   */
  let allEntries = [];
  function renderLedger() {
    const es = [...allEntries].sort((a, b) => String(b.occurredOn || '').localeCompare(String(a.occurredOn || '')));
    if (!es.length) {
      if (monthState() === 'future') {
        return '<div class="card empty" id="bk-ledger">' +
                 '<div class="ico">📅</div>' +
                 '<h3>' + esc(monthLabel()) + ' is in the future</h3>' +
                 '<p>You cannot record what has not happened yet. Plan it instead — set the budget for this month.</p>' +
                 '<button class="primary" data-action="bkGoBudget">Set the budget →</button>' +
               '</div>';
      }
      return '<div class="card empty" id="bk-ledger">' +
               '<div class="ico">🧾</div>' +
               '<h3>Nothing recorded in ' + esc(monthLabel()) + '</h3>' +
               '<p>Tap <strong>Record</strong> and put in the last thing you spent money on — a boda, the shopping, airtime. ' +
               'Everything else in this screen is built from these.</p>' +
               '<button class="primary" data-action="bkOpenSheet">Record something</button>' +
             '</div>';
    }

    const acctName = (id) => { const a = accts.find((x) => x.id === id); return a ? a.name : '—'; };
    const STATE = {
      confirmed:      ['ok', 'confirmed'],
      unplanned:      ['ok', 'recorded'],
      expected:       ['draft', 'not yet'],
      did_not_arrive: ['missed', 'did not come'],
    };

    // 🔑 THE ACTION BELONGS TO THE TABLE, SO IT SITS ON THE TABLE'S HEADER.
    //    A floating button hovering over your data is a button with no owner — and
    //    it covers the last row, which is the one you just added.
    return '<div class="card" id="bk-ledger">' +
      '<div class="cardhead">' +
        '<h3>Entries — ' + esc(monthLabel()) + '</h3>' +
        (monthState() === 'future' ? '' : '<button class="primary" data-action="bkOpenSheet">+ Record</button>') +
      '</div>' +
      '<div class="tablewrap"><table class="t">' +
        '<thead><tr>' +
          '<th>Date</th><th>What</th><th>Category</th><th>Account</th>' +
          '<th class="num">Amount</th><th>State</th><th></th>' +
        '</tr></thead><tbody>' +
        es.map((e) => {
          const st = STATE[e.status] || ['', e.status];
          const amt = e.actual != null ? e.actual : e.expected;
          const cls = e.direction === 'transfer' ? 'is-transfer'
                    : e.status === 'expected' ? 'is-draft'
                    : e.status === 'did_not_arrive' ? 'is-missed'
                    : e.direction === 'in' ? 'is-in' : 'is-out';
          const sign = e.direction === 'transfer' ? '' : e.direction === 'in' ? '+' : '−';
          return '<tr class="' + cls + '">' +
            '<td>' + esc(e.occurredOn || '—') + '</td>' +
            '<td class="wide">' + esc(e.label || '—') + '</td>' +
            '<td>' + esc(e.category || '—') + '</td>' +
            '<td>' + esc(e.direction === 'transfer' ? acctName(e.fromAccountId) + ' → ' + acctName(e.toAccountId) : acctName(e.accountId)) + '</td>' +
            '<td class="num amt">' + sign + fmt(amt) + '</td>' +
            '<td><span class="pill ' + st[0] + '">' + st[1] + '</span></td>' +
            '<td><button class="link" data-action="bkDelEntry" data-id="' + esc(e.id) + '">delete</button></td>' +
          '</tr>';
        }).join('') +
      '</tbody></table></div>' +
      '<p class="src">A draft is counted in no total. "Did not come" is kept, never deleted — delete is for a MISTAKE, not for money that failed to arrive.</p>' +
    '</div>';
  }

  /**
   * 🔴 THIS SCREEN SHOWED A FORM TO CREATE A BUDGET AND NO WAY TO SEE THE ONES YOU
   *    HAD ALREADY SET. You could not check them, edit them, or delete them. You
   *    could not even tell whether the last one saved.
   */
  let allBudgets = [];
  let lastBudget = null;
  let suggestions = null;        // from the forecast. A SUGGESTION. Not a budget.

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * THE BUDGET TABLE — one table, editable, and honest about every row.
   *
   * 🔴 A SUGGESTION MAY FILL THE FORM. IT MAY NOT BE THE BUDGET.
   *
   * An empty budget is pre-filled from the person's OWN HISTORY — but every one of
   * those rows is marked `suggested`, and it counts for NOTHING. Not the on-track
   * line, not budget vs actual, not the totals. Only what the server has SAVED is a
   * budget, because a number nobody chose must never quietly become the thing you
   * measure yourself against. Press Save and it becomes yours. Until then it is
   * ours, and we say so.
   *
   * 🔴 AND A LUMPY CATEGORY GETS NO MONTHLY FIGURE.
   *
   * School fees appears as a row — and it says "termly, set it for the term", not
   * one-third of a term. The row is there so it cannot be forgotten. The number is
   * not, because the number would be a lie in every month of the year.
   * ═══════════════════════════════════════════════════════════════════════════
   */
  function renderBudget(b) {
    lastBudget = b;

    const box = $('bk-budget');
    if (!box) return;

    const saved = {};
    for (const g of allBudgets) saved[g.category] = g;

    const actual = {};
    for (const r of ((b && b.rows) || [])) actual[r.category] = r;

    const sug = {};
    const lumpy = {};
    if (suggestions) {
      for (const l of (suggestions.lines || [])) sug[l.category] = l;
      for (const l of (suggestions.lumpy || [])) lumpy[l.category] = l;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * 🔑 MONEY IN AND MONEY OUT ARE TWO DIFFERENT QUESTIONS.
     *
     * They were in ONE table, and that was wrong. "Am I spending too much?" and
     * "is the money I expected actually arriving?" are not the same question, and
     * a person reading one column of figures cannot answer either of them well.
     *
     * They also fail in OPPOSITE DIRECTIONS. Spending 850,000 against a budget of
     * 800,000 is BAD. Earning 850,000 against an expectation of 800,000 is GOOD.
     * One table cannot colour both correctly, and a table that colours a good month
     * red is worse than no colour at all.
     *
     * So: two tables. Same shape, same behaviour, opposite meaning.
     * ═══════════════════════════════════════════════════════════════════════
     */
    const money = (dir) => {
      const list = cats.filter((c) => c.direction === dir);
      if (!list.length) return '';

      const IN = dir === 'in';

      return '<div class="cardhead" style="margin-top:1rem">' +
          '<h3>' + (IN ? 'Money in — what you expect' : 'Money out — your budget') + '</h3>' +
        '</div>' +
        '<div class="tablewrap"><table class="t"><thead><tr>' +
          '<th>Category</th>' +
          '<th class="num">' + (IN ? 'Expected' : 'Budget') + '</th>' +
          '<th class="num">' + (IN ? 'Received' : 'Spent') + '</th>' +
          '<th class="num">' + (IN ? 'Still to come' : 'Left') + '</th>' +
          '<th>Progress</th>' +
          '<th class="note">Source</th>' +
        '</tr></thead><tbody>' +
        list.map((c) => {
          const g = saved[c.key];
          const a = actual[c.key] || { spent: 0, earned: 0 };
          const got = IN ? UGXn(a.earned) : UGXn(a.spent);
          const sg = sug[c.key];
          const lump = lumpy[c.key] || (c.lumpy ? {} : null);

          // 🔑 EVERY ROW IS THE SAME ROW. A lump is not a special KIND of budget
          //    line — it is a line with a number in one period and a zero in the
          //    next, which is what a lump IS. School fees is 1,200,000 in September
          //    and 0 in October. Never 400,000 a month — a figure wrong in every
          //    month of the year.
          let value = 0;
          let note;

          if (g) {
            value = g.amount;
            note = 'Yours. Saved.';
          } else if (lump) {
            const from = $('bg-from').value, to = $('bg-to').value;
            const due = lump.nextDue || null;
            const dueHere = due && from && to && due >= from && due <= to;
            const amt = lump.typicalAmount || 0;
            value = dueHere ? amt : 0;
            note = dueHere
              ? 'Due in this period (~' + due + '). The whole amount.'
              : due
                ? 'Not due in this period. Next around ' + due + ', about ' + fmt(amt) + '.'
                : 'Put the full amount in the period it is actually paid.';
          } else if (sg) {
            value = sg.suggested;
            note = sg.working;
          } else {
            note = IN ? 'Type what you expect to come in.' : 'No history yet. Type a figure, or leave it at zero.';
          }

          const isSaved = Boolean(g);
          const isSuggested = !g && value > 0;
          const pct = isSaved && value ? Math.min(100, Math.round((got / value) * 100)) : null;

          // 🔴 THE OPPOSITE DIRECTIONS. Over-spending is bad. Over-earning is good.
          const bad = isSaved && value > 0 && (IN ? got < value : got > value);
          const good = isSaved && value > 0 && IN && got >= value;

          const gap = value - got;                       // out: left. in: still to come.

          return '<tr' + (isSuggested ? ' class="is-draft"' : '') + '>' +
            '<td class="wide">' + catCell(c) +
              (isSuggested ? ' <span class="pill draft">suggested</span>' : '') + '</td>' +
            '<td class="num"><input type="number" data-bg="' + esc(c.key) + '" value="' + (value || 0) + '" style="max-width:8rem"></td>' +
            '<td class="num">' + fmt(got) + '</td>' +
            '<td class="num">' + (isSaved ? fmt(gap) : '—') +
              (isSaved && !IN && got > value ? ' <span class="pill over">over by ' + fmt(got - value) + '</span>' : '') +
              (good ? ' <span class="pill ok">arrived</span>' : '') + '</td>' +
            '<td>' + (pct != null
              ? '<span class="bar' + (bad ? ' over' : '') + '"><i style="width:' + pct + '%"></i></span> <span class="src">' + pct + '%</span>'
              : '—') + '</td>' +
            '<td class="note" title="' + esc(note) + '">' + esc(note) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    };

    box.innerHTML =
      money('in') +
      money('out') +

      // 🔴 A SUGGESTION IS NOT A BUDGET. Say it, on the screen.
      (Object.keys(sug).length && allBudgets.length === 0
        ? '<p class="hint"><strong>The greyed figures are suggestions from your own spending, not a budget.</strong> ' +
          'They are counted in nothing — not your on-track line, not budget vs actual — until you press Save. ' +
          'Change anything you disagree with first.</p>'
        : '') +

      (suggestions && (suggestions.whatThisCannotSee || []).length && allBudgets.length === 0
        ? '<p class="src">A suggestion cannot see: ' + esc(suggestions.whatThisCannotSee.join(' ')) + '</p>'
        : '') +

      ((b && b.budgetsExcluded && b.budgetsExcluded.length)
        ? '<p class="hint">Not counted in this window: ' +
          b.budgetsExcluded.map((g) => esc(g.category) + ' (' + fmt(g.amount) + ', ' + esc(g.startsOn) + ' → ' + esc(g.endsOn) + ')').join(', ') +
          '. ' + esc(b.whyExcluded || '') + '</p>'
        : '') +

      ((b && b.howBudgetsWereCounted) ? '<p class="src">' + esc(b.howBudgetsWereCounted) + '</p>' : '') +

      '<div class="row" style="margin-top:.8rem">' +
        '<input type="text" id="cat-new" placeholder="A new category — school run, rent for the shop…" style="flex:1;min-width:10rem">' +
        '<select id="cat-dir"><option value="out">Money out</option><option value="in">Money in</option></select>' +
        '<label class="chk"><input type="checkbox" id="cat-lumpy"> not every month</label>' +
        '<button class="ghost" data-action="catAdd">Add category</button>' +
      '</div>' +
      '<p class="src">Tick “not every month” for things that arrive in a lump — school fees, insurance, six months\' rent. ' +
      'The whole amount goes in the period it is actually paid, and zero in the others. It is never spread across the year.</p>';
  }

  const UGXn = (n) => Math.round(Number(n || 0));

  /**
   * 🔑 A CATEGORY IS EDITED WHERE IT IS USED.
   *
   * Not on a settings page three taps away. You are looking at "Transport" in your
   * budget and you want it called "Boda & taxi" — so you rename it here, in the
   * cell, and get on with your life.
   */
  const catCell = (c) =>
    '<span class="cat" data-cat="' + esc(c.id) + '">' +
      '<span class="cat-l">' + esc(c.label) + '</span>' +
      '<button class="link cat-e" data-action="catEdit" data-id="' + esc(c.id) + '" data-label="' + esc(c.label) + '" title="Rename">✎</button>' +
    '</span>';

  A.catEdit = async (el) => {
    const name = window.prompt('Rename this category', el.dataset.label);
    if (name === null) return;                                  // cancelled
    const clean = String(name).trim();

    if (!clean) {
      // 🔴 DELETING A CATEGORY MUST NOT DELETE THE MONEY. The server keeps every
      //    transaction and simply uncategorises it — and it tells us how many, so we
      //    can say so before the person panics.
      if (!window.confirm('Delete this category?\n\nYour transactions are NOT deleted — they stay, they still count, and they simply become uncategorised.')) return;
      const r = await API.delCategory(current.id, el.dataset.id);
      if (!handle(r)) return;
      if (r.note) $('bg-msg').textContent = r.note;
      await refresh();
      renderBudget(lastBudget);
      return;
    }

    const r = await API.editCategory(current.id, el.dataset.id, { label: clean });
    if (!handle(r)) return;
    if (!r.ok) { $('bg-msg').textContent = r.headline || 'That did not work.'; return; }
    await refresh();
    renderBudget(lastBudget);
  };

  A.catAdd = async () => {
    const label = $('cat-new').value.trim();
    if (!label) return;
    const r = await API.addCategory(current.id, { label, direction: $('cat-dir').value, lumpy: $('cat-lumpy').checked });
    if (!handle(r)) return;
    if (!r.ok) { $('bg-msg').textContent = r.headline || 'That did not work.'; return; }
    $('cat-new').value = ''; $('cat-lumpy').checked = false;
    await refresh();
    renderBudget(lastBudget);
  };

  /** Save the whole table. Zero means "no budget", and deletes any that was there. */
  A.bgSaveAll = async () => {
    const from = $('bg-from').value, to = $('bg-to').value;
    if (!from || !to) { $('bg-msg').textContent = 'A budget needs a start and an end.'; return; }

    const saved = {};
    for (const g of allBudgets) saved[g.category] = g;

    let n = 0, removed = 0;
    for (const input of document.querySelectorAll('[data-bg]')) {
      const key = input.dataset.bg;
      const val = Number(input.value || 0);
      const g = saved[key];

      if (val > 0) {
        const r = await API.addBudget(current.id, { category: key, amount: val, startsOn: from, endsOn: to });
        if (!handle(r)) return;
        if (r.ok) n++;
      } else if (g) {
        const r = await API.delBudget(current.id, g.id);
        if (!handle(r)) return;
        if (r.ok) removed++;
      }
    }
    $('bg-msg').innerHTML = '<span class="saved">✓ Saved.</span> ' + n + ' categor' + (n === 1 ? 'y' : 'ies') +
      ' budgeted' + (removed ? ', ' + removed + ' cleared' : '') + '. These are now yours, and they count.';
    await refresh();
  };

  /** The Budget tab lazily pulls the forecast, so it can fill an empty table. */
  async function fillBudgetForm() {
    // 🔑 The budget window IS the month you are looking at. Navigate to
    //    September, open Budget, and you are budgeting September — which is
    //    exactly how you add things to the future budget.
    $('bg-from').value = monthWindow().from;
    $('bg-to').value = monthWindow().to;
    // 🔴 Only ask for suggestions when there is NOTHING saved. We do not "helpfully"
    //    overwrite a budget a human already chose.
    if (!allBudgets.length && !suggestions) {
      const f = await API.forecast(current.id);
      if (f.ok && f.suggestedBudget && !f.suggestedBudget.refused) suggestions = f.suggestedBudget;
      else suggestions = { lines: [], lumpy: [] };
      renderBudget(lastBudget);
    }
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // PRICES & VALUES OVER TIME
  //
  // 🔑 Recording a value ADDS a dated point. The engine (server-side) turns the
  //    history into: current value, change since last, growth per month, and — with
  //    enough points — a projection that SAYS it is a guess. We just display it.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // THE DEFAULT VALUES TABLE — the plan and the price book, unified.
  //
  // Every regular item, income or expense, with its unit, its current price, and
  // when that price last changed. Editing a price records a new point (the change is
  // tracked). Adding one creates the default. A unit can be blank; an entry fills it.
  // ═══════════════════════════════════════════════════════════════════════════
  let defaults = [];
  async function renderDefaults() {
    const body = $('defaults-body');
    if (!body) return;
    const r = await API.trackedValues(current.id);
    if (!handle(r)) return;
    defaults = (r.ok && r.items) || [];

    if (!defaults.length) {
      body.innerHTML = '<tr><td colspan="6" class="muted">No defaults yet. Add your salary, rent, and the things you buy often — below.</td></tr>';
      return;
    }

    const dirPill = (d) => d === 'in'
      ? '<span class="pill ok">in</span>' : '<span class="pill">out</span>';

    body.innerHTML = defaults.map((it) => {
      const cur = it.current ? it.current.amount : 0;
      const moved = it.sinceLast ? (it.direction === 'in'
        ? (it.sinceLast.abs >= 0 ? ' ▲' : ' ▼')
        : (it.sinceLast.abs > 0 ? ' <span style="color:var(--red-600)">▲</span>' : it.sinceLast.abs < 0 ? ' <span style="color:var(--emerald-700)">▼</span>' : '')) : '';
      return '<tr>' +
        '<td class="wide">' + esc(it.label || it.key) + '</td>' +
        '<td>' + dirPill(it.direction) + '</td>' +
        '<td>' + esc(it.unit || '—') + '</td>' +
        '<td class="num"><input type="number" class="df-edit" data-key="' + esc(it.key) + '" data-dir="' + esc(it.direction) + '" data-unit="' + esc(it.unit || '') + '" value="' + cur + '" style="max-width:8rem">' + moved + '</td>' +
        '<td>' + esc(it.lastUpdated || '—') + '</td>' +
        '<td><button class="link" data-action="dfHistory" data-key="' + esc(it.key) + '">history</button></td>' +
      '</tr>' +
      // an expandable history row, hidden until asked
      '<tr id="dfh-' + esc(it.key) + '" hidden><td colspan="6">' + historyOf(it) + '</td></tr>';
    }).join('');
    await loadPriceBook();   // keep the Record-sheet auto-fill in sync
  }

  function historyOf(it) {
    if (!it.pointIds || it.pointIds.length < 2) return '<span class="src">One value so far — record it again when it changes to see the trend.</span>';
    let h = '<div class="src">' + esc(it.says) + '</div>';
    if (it.projection && it.projection.nextMonth) {
      h += '<div class="src">If the trend holds: ' + fmt(it.projection.nextMonth) + ' next month. ' + esc(it.projection.thisIsAGuess) + '</div>';
    }
    h += '<div class="tablewrap"><table class="t"><thead><tr><th>As of</th><th class="num">Value</th><th></th></tr></thead><tbody>' +
      [...it.pointIds].reverse().map((pt) => '<tr><td>' + esc(pt.asOf) + '</td><td class="num">' + fmt(pt.amount) +
        '</td><td><button class="link" data-action="dfDelPoint" data-id="' + esc(pt.id) + '">remove</button></td></tr>').join('') +
      '</tbody></table></div>';
    return h;
  }

  A.dfHistory = (el) => { const row = $('dfh-' + el.dataset.key); if (row) row.hidden = !row.hidden; };

  // 🔑 EDIT A PRICE IN PLACE → records a new dated point (today). The change is tracked.
  document.addEventListener('change', async (e) => {
    if (!e.target || !e.target.classList.contains('df-edit')) return;
    const el = e.target;
    const amount = Number(el.value || 0);
    if (!(amount >= 0)) return;
    const r = await API.recordValue(current.id, {
      itemKey: el.dataset.key, label: el.dataset.key, amount, asOf: today(),
      unit: el.dataset.unit || undefined, direction: el.dataset.dir,
    });
    if (!handle(r)) return;
    await renderDefaults();
  });

  A.dfAdd = async () => {
    const item = $('df-item').value.trim();
    if (!item) { $('df-msg').textContent = 'Give the item a name.'; return; }
    const priceRaw = $('df-price').value;
    // 🔑 a price may be BLANK — the default exists, waiting for the first entry to set it.
    const body = {
      itemKey: item, label: item, direction: $('df-dir').value,
      unit: $('df-unit').value.trim() || undefined, asOf: today(),
      amount: priceRaw === '' ? 0 : Number(priceRaw),
    };
    const r = await API.recordValue(current.id, body);
    if (!handle(r)) return;
    if (!r.ok) { $('df-msg').textContent = r.headline || 'That did not work.'; return; }
    $('df-msg').innerHTML = '<span class="saved">✓ Added.</span>';
    $('df-item').value = ''; $('df-price').value = ''; $('df-unit').value = '';
    await renderDefaults();
  };

  A.dfDelPoint = async (el) => {
    const r = await API.delValuePoint(current.id, el.dataset.id);
    if (!handle(r)) return;
    await renderDefaults();
  };

  A.bkDelEntry = async (el) => {
    const r = await API.delEntry(current.id, el.dataset.id);
    if (!handle(r)) return;
    await refresh();
  };

  A.bkDelEntry = async (el) => {
    const r = await API.delEntry(current.id, el.dataset.id);
    if (!handle(r)) return;
    await refresh();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  A.bkStage = async () => {
    const r = await API.stageDefaults(current.id);
    if (!handle(r)) return;
    if (!r.ok) { $('df-msg').textContent = r.headline || 'That did not work.'; return; }
    $('df-msg').innerHTML = '<span class="saved">✓</span> ' + esc(r.note || 'Drafted.');
    await refresh();
  };

  A.bkConfirm = async (el) => {
    const id = el.dataset.id;
    const acct = document.querySelector('[data-draft-acct="' + id + '"]').value;
    const amt = document.querySelector('[data-draft-amt="' + id + '"]').value;
    const r = await API.confirm(current.id, id, {
      accountId: acct || null,
      actual: amt === '' ? null : Number(amt),
      occurredOn: today(),
    });
    if (!handle(r)) return;
    // 🔴 Confirming with no account is REFUSED by the engine, and the refusal is
    //    shown — not swallowed.
    if (!r.ok) return problem('bk-drafts', r);
    await refresh();
  };

  A.bkMissed = async (el) => {
    const r = await API.didNotArrive(current.id, el.dataset.id, null);
    if (!handle(r)) return;
    if (!r.ok) return problem('bk-drafts', r);
    await refresh();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // THE RECORD SHEET
  //
  // 🔴 Every principle below exists because the old form broke it:
  //
  //   • The primary action was at the BOTTOM of the longest list on the page.
  //   • It closed and re-rendered on every save, so entering a day of spending
  //     meant scrolling back down five times.
  //   • Focus went nowhere, so every entry began with a hunt for the first field.
  //   • There was no keyboard path at all. Enter did nothing.
  // ═══════════════════════════════════════════════════════════════════════════
  let dir = 'out';

  /**
   * 🔴 THREE INDEPENDENT WAYS TO CLOSE. BECAUSE THIS TRAPPED A USER TWICE.
   *
   *   1. the `hidden` attribute        — the semantic truth
   *   2. `.sheet { display: none }`    — the base rule, with nothing to override
   *   3. an INLINE style               — which beats every stylesheet, including a
   *                                      STALE ONE CACHED IN THE BROWSER
   *
   * (3) is the one that matters. A user with an old tokens.css in their cache is a
   * user for whom no CSS fix I ship exists yet. An inline style is the only thing
   * that reaches them today. A modal that cannot be dismissed is not a bug you get
   * to fix with a cache-busting strategy — it is a person locked out of your
   * product, and belt-and-braces is the correct engineering response.
   */
  const openSheet = () => {
    const el = $('sheet');
    el.hidden = false;
    el.style.display = '';        // let the stylesheet decide how to lay it out
  };
  const closeSheet = () => {
    const el = $('sheet');
    el.hidden = true;
    el.style.display = 'none';    // ...but never how to HIDE it. That is not negotiable.
  };

  A.bkOpenSheet = () => {
    // 🔴 NO RECORDING IN THE FUTURE. Nothing has happened; there is nothing to log.
    if (monthState() === 'future') return;
    openSheet();
    $('bk-sheet-msg').textContent = '';
    // 🔑 Default the date INTO the month you are looking at. Recording while
    //    viewing June should log a June date, not today — else the entry lands
    //    in the wrong month and the total you were just reading is quietly wrong.
    { const w = monthWindow(); $('bk-date').value = (today() >= w.from && today() <= w.to) ? today() : w.from; }
    // 🔑 Focus the field they came here to fill. Not the first one in the DOM —
    //    the one they are actually about to type into.
    setTimeout(() => $('bk-amount').focus(), 0);
  };

  A.bkCloseSheet = () => { closeSheet(); };

  A.bkDir = (el) => {
    dir = el.dataset.dir;
    document.querySelectorAll('.seg-b').forEach((b) => b.classList.toggle('active', b.dataset.dir === dir));
    // A transfer needs TWO accounts and touches ZERO totals.
    $('bk-acct-one').hidden = dir === 'transfer';
    $('bk-acct-two').hidden = dir !== 'transfer';
    // 🔑 ...and its categories change with it. Money-out categories vanish the
    //    moment you switch to money in.
    fillSheetCats();
  };

  // Escape closes. Enter submits. A form you cannot drive from the keyboard is a
  // form that punishes anybody entering more than one thing.
  document.addEventListener('keydown', (e) => {
    const sheet = $('sheet');
    if (!sheet || sheet.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); A.bkCloseSheet(); }
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'BUTTON') { e.preventDefault(); A.bkAddEntry(); }
  });

  // Click the backdrop to close — but not a click INSIDE the panel.
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'sheet') A.bkCloseSheet();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // THE PRICE BOOK — the known unit price for each item, so the sheet can auto-fill.
  // ═══════════════════════════════════════════════════════════════════════════
  let priceBook = {};
  const keyOf = (label) => String(label || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

  async function loadPriceBook() {
    priceBook = {};
    const r = await API.trackedValues(current.id);
    if (r && r.ok) for (const it of r.items) if (it.current) priceBook[it.key] = { unitPrice: it.current.amount, unit: it.unit || null };
  }

  // 🔑 Type an item Selah knows the price of, plus a quantity, and the total fills in
  //    (with its unit). Your own typed total always wins — it is what you paid, and on
  //    save it updates the price book.
  function priceAssist() {
    const hint = $('bk-price-hint');
    const known = priceBook[keyOf($('bk-label').value)];
    if (!known) { if (hint) hint.textContent = ''; return; }
    if (!$('bk-unit').value && known.unit) $('bk-unit').value = known.unit;
    const qty = Number($('bk-qty').value || 0);
    if (qty > 0 && $('bk-amount').value === '') {
      const total = Math.round(qty * known.unitPrice);
      $('bk-amount').value = total;
      if (hint) hint.innerHTML = qty + ' × ' + fmt(known.unitPrice) + (known.unit ? '/' + esc(known.unit) : '') + ' = <strong>' + fmt(total) + '</strong>';
    } else if (hint) {
      hint.innerHTML = 'Known price: ' + fmt(known.unitPrice) + (known.unit ? ' per ' + esc(known.unit) : '') +
        '. <span class="src">Type a different total and it updates the default.</span>';
    }
  }

  document.addEventListener('input', function (e) {
    if (e.target && (e.target.id === 'bk-label' || e.target.id === 'bk-qty')) priceAssist();
  });

  A.bkAddEntry = async () => {
    const rawAmount = $('bk-amount').value;
    const qty = $('bk-qty').value;
    const unit = $('bk-unit').value.trim();
    // 🔑 give a TOTAL, or a QUANTITY of a known item — not neither.
    if ((rawAmount === '' || !(Number(rawAmount) > 0)) && !(Number(qty) > 0)) {
      $('bk-sheet-msg').textContent = 'How much, or how many?'; $('bk-amount').focus(); return;
    }

    const body = {
      direction: dir,
      label: $('bk-label').value.trim(),
      amount: rawAmount === '' ? undefined : Number(rawAmount),
      quantity: qty === '' ? undefined : Number(qty),
      unit: unit || undefined,
      category: $('bk-cat').value || null,
      occurredOn: $('bk-date').value || today(),
    };
    if (dir === 'transfer') {
      body.fromAccountId = $('bk-from').value || null;
      body.toAccountId = $('bk-to').value || null;
    } else {
      body.accountId = $('bk-acct').value || null;
    }

    const r = await API.addEntry(current.id, body);
    if (!handle(r)) return;
    if (!r.ok) {
      $('bk-sheet-msg').innerHTML = '<strong>' + esc(r.headline || 'That did not work.') + '</strong> ' +
        (r.why || []).map(esc).join(' ');
      return;
    }

    // 🔑 THE SHEET STAYS OPEN.
    //
    // A person entering a day's spending has four or five things to record. Closing
    // the sheet after each one, and dropping them back at the bottom of a long
    // ledger, turns a 30-second job into a 3-minute one. So: confirm what was saved,
    // clear the fields that change, KEEP the ones that do not (the account, the
    // date, the direction), and put the cursor back on the amount.
    const saved = ($('bk-label').value.trim() || 'Entry') + ' — ' + fmt(Number(rawAmount) || 0);
    $('bk-sheet-msg').innerHTML = '<span class="saved">✓ Saved:</span> ' + esc(saved) + ' <span class="src">Add another, or press Done.</span>';
    $('bk-amount').value = '';
    $('bk-label').value = '';
    $('bk-qty').value = '';
    $('bk-unit').value = '';
    $('bk-price-hint').textContent = '';
    $('bk-amount').focus();

    await refresh();      // the ledger behind the sheet updates as you go
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // TABS INSIDE A BOOK
  //
  // 🔴 "Draft this month from my template" WAS A BUTTON THAT DID NOTHING, because
  // there was no way to MAKE a template. A button that silently does nothing is
  // worse than no button: the person concludes the app is broken, and they are
  // not wrong.
  // ═══════════════════════════════════════════════════════════════════════════
  const PANES = ['month', 'budget', 'plan', 'ahead', 'shopping'];

  A.bkTab = (el) => {
    const want = el.dataset.tab;
    PANES.forEach((t) => { const p = $('bk-pane-' + t); if (p) p.hidden = t !== want; });
    document.querySelectorAll('.tabs .tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === want));
    if (want === 'ahead') A.bkForecast();
    if (want === 'budget') fillBudgetForm();
    if (want === 'plan') renderDefaults();
    if (want === 'shopping') renderShopping();
  };

  // ── MY DEFAULTS — the template. "Set it once." ─────────────────────────────

  /** Categories for one direction only. `in` money never lists `out` categories. */
  const catsFor = (direction, byKey) =>
    '<option value="">— category —</option>' +
    cats.filter((c) => c.direction === direction)
        .map((c) => '<option value="' + esc(byKey ? c.key : c.id) + '">' + esc(c.label) + '</option>').join('');

  /** Refill the Record sheet's category dropdown for the current direction, keeping
   *  the selection only if it still belongs. */
  function fillSheetCats() {
    const el = $('bk-cat');
    if (!el) return;
    const was = el.value;
    el.innerHTML = catsFor(dir, true);
    // A transfer has no category at all.
    el.disabled = dir === 'transfer';
    if (dir === 'transfer') { el.value = ''; return; }
    if (was && [...el.options].some((o) => o.value === was)) el.value = was;
    else el.value = '';                                      // it belonged to the OTHER direction — drop it
  }



  // ═══════════════════════════════════════════════════════════════════════════
  // 🔑 "WHEN DO I NEXT REFILL GAS?"
  // ═══════════════════════════════════════════════════════════════════════════
  A.bkForecast = async () => {
    const box = $('bk-forecast');
    box.hidden = false;
    box.innerHTML = '<p class="muted">Reading your history…</p>';

    const r = await API.forecast(current.id);
    if (!handle(r)) return;
    if (!r.ok) return problem('bk-forecast', r);

    const up = r.comingUp || {};
    const sb = r.suggestedBudget || {};

    box.innerHTML =
      '<div class="card">' +
        '<h3>What is coming up</h3>' +
        (up.items && up.items.length
          ? '<ul class="cal-items">' + up.items.map((i) => (
              '<li><span class="cal-label">' + esc(i.label) + '</span> ' +
              '<span class="' + (i.overdue ? 'warn' : 'muted') + '">' +
                esc(i.nextDue) + (i.overdue ? ' — overdue by ' + i.overdueByDays + ' days' : ' — in ' + i.daysAway + ' days') +
              '</span> <span class="muted">~' + fmt(i.typicalAmount) + '</span>' +
              '<div class="src">' + esc(i.says) + '</div></li>'
            )).join('') + '</ul>'
          : '<p class="muted">Nothing repeats often enough yet for us to see a pattern.</p>') +

        (up.notEnoughHistory && up.notEnoughHistory.length
          ? '<p class="src">Not enough history yet: ' +
            up.notEnoughHistory.map((x) => esc(x.label)).join(', ') +
            '. We will not predict a pattern from one or two purchases.</p>'
          : '') +
      '</div>' +

      (sb.refused
        ? '<div class="card refuse"><h3>' + esc(sb.question) + '</h3><p>' + esc(sb.because) + '</p>' +
          '<p class="warn">' + esc(sb.weWillNot) + '</p></div>'
        : '<div class="card">' +
            '<h3>A suggested budget</h3>' +
            '<ul class="cal-items">' + (sb.lines || []).map((l) => (
              '<li><span class="cal-label">' + esc(l.category) + '</span> <strong>' + fmt(l.suggested) + '</strong>' +
              '<div class="src">' + esc(l.working) + '</div></li>'
            )).join('') + '</ul>' +

            // 🔴 THE LUMPS. Never averaged. Dated and sized instead.
            ((sb.lumpy || []).length
              ? '<div class="card ask" style="margin-top:.8rem"><h3>These do NOT happen every month</h3>' +
                (sb.lumpy || []).map((l) => (
                  '<p><strong>' + esc(l.category) + '</strong> — ' + esc(l.budgetItAs) +
                  '<br><span class="src">' + esc(l.why) + '</span></p>'
                )).join('') + '</div>'
              : '') +

            '<p class="hint">' + esc(sb.thisIsASuggestion || '') + '</p>' +
            '<p class="src">' + (sb.whatThisCannotSee || []).map(esc).join(' ') + '</p>' +
          '</div>');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCOUNTS + HEALTH
  // ═══════════════════════════════════════════════════════════════════════════
  A.goAccounts = async () => {
    window.SelahShow('accounts');
    $('ac-health').innerHTML = '<p class="muted">Loading…</p>';

    const [h, mine] = await Promise.all([API.health(), API.myAccounts()]);
    if (!handle(h)) return;
    if (!h.ok) return problem('ac-health', h);

    const types = (mine.ok && mine.types) || {};
    $('ac-type').innerHTML = Object.keys(types).map((k) =>
      '<option value="' + esc(k) + '">' + esc(types[k].label) + '</option>').join('');

    const nw = h.netWorth || {};
    const ef = h.emergencyFund || {};
    const sr = h.savingsRate || {};

    $('ac-health').innerHTML =
      '<div class="card">' +
        '<h3>How you are doing</h3>' +

        // 🔴 TWO CURRENCIES AND NO RATE → NO SINGLE FIGURE. We show both.
        (nw.netWorth === null && nw.combined && !nw.combined.available
          ? '<div class="card ask"><h3>You hold more than one currency</h3>' +
              '<p>' + esc(nw.combined.because) + '</p>' +
              '<p class="warn">' + esc(nw.combined.weWillNot) + '</p>' +
              '<ul>' + (nw.perCurrency || []).map((c) => '<li>' + esc(c.currency) + ': <strong>' + esc(c.formatted) + '</strong></li>').join('') + '</ul>' +
            '</div>'
          : '<ul class="cal-items">' +
              '<li><span class="cal-label">Net worth</span> <strong>' + fmt(nw.netWorth) + '</strong></li>' +
              '<li><span class="cal-label">You own</span> ' + fmt(nw.assets) + '</li>' +
              '<li><span class="cal-label">You owe</span> ' + fmt(nw.debts) + '</li>' +
            '</ul>') +

        (nw.accountsNeverReconciled && nw.accountsNeverReconciled.length
          ? '<p class="hint">Never checked against reality: <strong>' + nw.accountsNeverReconciled.map(esc).join(', ') +
            '</strong>. Those figures are what we computed, not what your bank says.</p>' : '') +

        (ef.refused
          ? '<p class="hint">' + esc(ef.because) + '</p>'
          : '<p class="hint"><strong>' + esc(ef.months) + ' months</strong> of runway — ' + esc(ef.verdict) +
            '<br><span class="src">' + esc(ef.whatWeExcludedAndWhy || '') + '</span></p>') +

        (sr && !sr.refused && sr.percent != null
          ? '<p class="hint">You kept <strong>' + esc(sr.percent) + '%</strong> of what actually came in.' +
            (sr.negative ? ' <span class="warn">' + esc(sr.negative) + '</span>' : '') + '</p>'
          : '') +

        '<p class="src">' + esc(nw.thisIsNotObserved || '') + '</p>' +
      '</div>';

    const bs = h.balances || [];
    $('ac-list').innerHTML = bs.length
      ? '<div class="card">' +
          '<h3>Every account</h3>' +
          '<div class="tablewrap"><table class="t">' +
            '<thead><tr>' +
              '<th>Account</th><th>Type</th><th></th><th class="num">Balance</th>' +
              '<th class="num">Check it</th><th></th>' +
            '</tr></thead><tbody>' +
            bs.map((b) => (
              '<tr class="' + (b.impossible ? 'is-missed' : '') + '">' +
                '<td class="wide"><strong>' + esc(b.name) + '</strong>' +
                  (b.scope === 'book' ? ' <span class="pill">shared</span>' : '') + '</td>' +
                '<td>' + esc(b.type) + '</td>' +
                '<td>' + (b.side === 'debt' ? '<span class="pill missed">you owe</span>'
                        : b.liquid ? '<span class="pill ok">liquid</span>'
                        : '<span class="pill">not liquid</span>') + '</td>' +
                '<td class="num amt">' + esc(b.currency) + ' ' + fmt(b.computed) + '</td>' +
                '<td class="num"><input type="number" placeholder="what it says" data-rec="' + esc(b.accountId) + '" style="max-width:9rem"></td>' +
                '<td><button class="ghost" data-action="acReconcile" data-id="' + esc(b.accountId) + '">Check</button></td>' +
              '</tr>' +
              (b.impossible
                ? '<tr class="is-missed"><td colspan="6" class="wide"><span class="warn">' + esc(b.impossibleBecause) + '</span></td></tr>'
                : '') +
              '<tr><td colspan="6" style="padding:0"><div id="rec-' + esc(b.accountId) + '"></div></td></tr>'
            )).join('') +
          '</tbody></table></div>' +
          '<p class="src">These are COMPUTED from what you recorded. We cannot see your accounts. Type what each one actually says and press Check — the difference is money that moved without being written down.</p>' +
        '</div>'
      : '<div class="card empty">' +
          '<div class="ico">💰</div>' +
          '<h3>No accounts yet</h3>' +
          '<p>Add where your money actually sits — cash, MTN MoMo, the bank, a SACCO. ' +
          'Your balances, your net worth and your runway are all built from these.</p>' +
        '</div>';
  };

  A.acAdd = async () => {
    const r = await API.addAccount({
      name: $('ac-name').value.trim(),
      type: $('ac-type').value,
      currency: $('ac-cur').value,
    });
    if (!handle(r)) return;
    if (!r.ok) return problem('ac-health', r);
    $('ac-name').value = '';
    A.goAccounts();
  };

  /** 🔑 "WHERE DID MY MONEY ACTUALLY GO?" */
  A.acReconcile = async (el) => {
    const id = el.dataset.id;
    const actual = document.querySelector('[data-rec="' + id + '"]').value;
    if (actual === '') return;

    const r = await API.reconcile(id, Number(actual), today());
    if (!handle(r)) return;
    const box = $('rec-' + id);
    if (!r.ok) { box.innerHTML = '<p class="warn">' + esc(r.because || 'That did not work.') + '</p>'; return; }

    const rec = r.reconciliation;
    box.innerHTML =
      '<div class="card ' + (rec.matches ? '' : 'ask') + '" style="margin-top:.6rem">' +
        '<h3>' + esc(rec.headline) + '</h3>' +
        (rec.whatThisMeans ? '<p class="muted">' + esc(rec.whatThisMeans) + '</p>' : '') +
      '</div>';
  };
  // ── SHOPPING — a plan that becomes spending ────────────────────────────────
  //
  // 🔑 The estimate is only ever the sum of prices Selah ALREADY KNOWS. An item
  //    it has never priced shows "—", not a guess. Marking done routes through the
  //    same expense path as the Record sheet, so the real price is what sticks.

  const acctOpts = () =>
    '<option value="">— which account? —</option>' +
    accts.map((a) => '<option value="' + esc(a.id) + '">' + esc(a.name) + (a.scope === 'book' ? ' (shared)' : '') + '</option>').join('');

  async function renderShopping() {
    const box = $('shopping-lists'); if (!box) return;
    const r = await API.shopping(current.id);
    if (!handle(r)) return;
    const lists = (r.ok && r.lists) || [];
    if (!lists.length) {
      box.innerHTML = '<p class="muted">No lists yet. Add one above — say, “Grocery”.</p>';
      return;
    }
    box.innerHTML = lists.map(renderList).join('');
  }

  function renderList(l) {
    const rows = (l.rows || []).map((it) => {
      const done = it.status === 'done';
      const est = done
        ? '<span class="saved">✓ ' + fmt(it.actualAmount) + '</span>'
        : (it.estimate == null ? '<span class="muted">—</span>' : '~' + fmt(it.estimate));
      const action = done
        ? '<span class="muted">bought</span>'
        : '<button class="ghost" data-action="bkShopMark" data-list="' + esc(l.id) + '" data-id="' + esc(it.id) + '">Mark bought</button>' +
          ' <button class="ghost" data-action="bkDelShopItem" data-list="' + esc(l.id) + '" data-id="' + esc(it.id) + '" aria-label="Remove">✕</button>';
      const doneForm =
        '<tr id="done-' + esc(it.id) + '" hidden><td colspan="5">' +
          '<div class="card ask" style="margin:.3rem 0">' +
            '<p class="muted">What did you actually pay for <strong>' + esc(it.label) + '</strong>? This records a real expense.</p>' +
            '<div class="row" style="gap:.5rem;align-items:flex-end;flex-wrap:wrap">' +
              '<div><label>Paid (total)</label><input type="number" id="paid-' + esc(it.id) + '" placeholder="' + (it.estimate != null ? fmt(it.estimate) : 'amount') + '"></div>' +
              '<div><label>How many' + (it.unit ? ' (' + esc(it.unit) + ')' : '') + '</label><input type="number" id="qty-' + esc(it.id) + '" value="' + esc(it.quantity) + '"></div>' +
              '<div><label>From account</label><select id="acct-' + esc(it.id) + '">' + acctOpts() + '</select></div>' +
              '<button class="primary" data-action="bkShopDone" data-list="' + esc(l.id) + '" data-id="' + esc(it.id) + '">Bought</button>' +
            '</div>' +
            '<p id="done-msg-' + esc(it.id) + '" class="hint"></p>' +
          '</div>' +
        '</td></tr>';
      return '<tr' + (done ? ' class="muted"' : '') + '>' +
        '<td>' + esc(it.label) + '</td>' +
        '<td class="num">' + esc(it.quantity) + '</td>' +
        '<td>' + esc(it.unit || '') + '</td>' +
        '<td class="num">' + est + '</td>' +
        '<td>' + action + '</td>' +
      '</tr>' + doneForm;
    }).join('');

    const c = l.counts || {};
    const summary =
      '<p class="muted">' + esc(c.done || 0) + ' of ' + esc(c.total || 0) + ' bought · ' +
      'spent ' + fmt(l.spentSoFar) + ' · still to buy ~' + fmt(l.remainingEstimate) +
      (l.unpricedCount ? ' · ' + esc(l.unpricedCount) + ' with no known price' : '') + '</p>';

    return '<div class="card">' +
      '<div class="cardhead"><h3>' + esc(l.name) + '</h3></div>' +
      summary +
      '<div class="tablewrap"><table class="t">' +
        '<thead><tr><th>Item</th><th class="num">Qty</th><th>Unit</th><th class="num">Estimate</th><th></th></tr></thead>' +
        '<tbody>' + (rows || '<tr><td colspan="5" class="muted">Nothing on this list yet.</td></tr>') + '</tbody>' +
      '</table></div>' +
      '<div class="row" style="gap:.5rem;align-items:flex-end;flex-wrap:wrap;margin-top:.6rem">' +
        '<div><label>Item</label><input type="text" id="si-label-' + esc(l.id) + '" placeholder="Sugar, milk, soap"></div>' +
        '<div><label>How many</label><input type="number" id="si-qty-' + esc(l.id) + '" value="1"></div>' +
        '<div><label>Unit</label><input type="text" id="si-unit-' + esc(l.id) + '" list="unit-list" placeholder="(optional)"></div>' +
        '<button class="primary" data-action="bkAddShopItem" data-list="' + esc(l.id) + '">Add item</button>' +
      '</div>' +
    '</div>';
  }

  A.bkAddList = async () => {
    const name = $('sl-name').value.trim();
    if (!name) { $('sl-msg').textContent = 'Give the list a name.'; return; }
    const r = await API.addList(current.id, name);
    if (!handle(r)) return;
    if (!r.ok) { $('sl-msg').textContent = r.headline || 'That did not work.'; return; }
    $('sl-name').value = ''; $('sl-msg').innerHTML = '<span class="saved">✓ Added.</span>';
    await renderShopping();
  };

  A.bkAddShopItem = async (el) => {
    const lid = el.dataset.list;
    const label = $('si-label-' + lid).value.trim();
    if (!label) return;
    const qtyRaw = $('si-qty-' + lid).value;
    const r = await API.addShopItem(current.id, lid, {
      label,
      quantity: qtyRaw === '' ? undefined : Number(qtyRaw),
      unit: $('si-unit-' + lid).value.trim() || undefined,
    });
    if (!handle(r)) return;
    await renderShopping();
  };

  A.bkDelShopItem = async (el) => {
    const r = await API.delShopItem(current.id, el.dataset.list, el.dataset.id);
    if (!handle(r)) return;
    await renderShopping();
  };

  // Reveal the "what did you pay" form for one item.
  A.bkShopMark = (el) => {
    const row = $('done-' + el.dataset.id);
    if (row) { row.hidden = !row.hidden; if (!row.hidden) setTimeout(() => { const f = $('paid-' + el.dataset.id); if (f) f.focus(); }, 0); }
  };

  A.bkShopDone = async (el) => {
    const id = el.dataset.id, lid = el.dataset.list;
    const msg = $('done-msg-' + id);
    const paidRaw = $('paid-' + id).value;
    const qtyRaw = $('qty-' + id).value;
    const accountId = $('acct-' + id).value;
    if (!accountId) { if (msg) msg.textContent = 'Say which account you paid from.'; return; }
    const r = await API.shopDone(current.id, lid, id, {
      accountId,
      actualAmount: paidRaw === '' ? undefined : Number(paidRaw),
      quantity: qtyRaw === '' ? undefined : Number(qtyRaw),
    });
    if (!handle(r)) return;
    if (!r.ok) { if (msg) msg.textContent = r.headline || 'That did not work.'; return; }
    await renderShopping();
    await refresh();   // the new expense belongs in the month total too
  };

})();
