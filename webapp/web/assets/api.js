/**
 * SELAH — THE API CLIENT
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE MOST IMPORTANT THING IN THIS FILE IS HOW IT HANDLES BEING REFUSED.
 *
 * The server returns HTTP 451 — Unavailable For Legal Reasons — on every endpoint
 * that would store a person's data, until Selah is registered with Uganda's
 * Personal Data Protection Office.
 *
 * The lazy thing is to treat that as an error: a red toast, "something went
 * wrong", a retry button. That would be a lie. NOTHING went wrong. The software
 * did exactly what it was built to do, and the honest thing is to say so.
 *
 * So a 451 is not an error path here. It is a FIRST-CLASS STATE, and it gets the
 * whole screen: what the law says, why we will not store your data, what still
 * works, and what we are doing about it.
 *
 * A company whose entire product is "we tell you the truth about tax" cannot
 * lie to its own users about why its own login does not work.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function (global) {
  'use strict';

  // Same origin. nginx proxies /api → the API container.
  // If this were `http://localhost:3000` our own CSP (`connect-src 'self'`)
  // would block every request, silently. See nginx.conf.
  const BASE = '/api';

  async function call(method, path, body) {
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'same-origin',   // the session cookie is httpOnly + first-party
      });
    } catch (e) {
      // 🔴 The network failed. Do not pretend it was the user's fault.
      return {
        ok: false,
        offline: true,
        headline: 'We cannot reach Selah.',
        detail: 'Your connection dropped, or our server is down. Nothing you typed has been lost, and nothing has been sent.',
      };
    }

    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }

    // 🔑 THE REFUSAL. Not an error. A state.
    if (res.status === 451) {
      return { ok: false, refused: true, status: 451, ...data };
    }
    if (res.status === 401) {
      return { ok: false, signedOut: true, status: 401, ...data };
    }
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 A 502/503/504 IS NOT AN APPLICATION ERROR. THE API IS NOT THERE.
    //
    // These come from nginx, not from us — nginx accepted the request, tried to
    // reach the API container, and could not. So there is no JSON body, no
    // `headline`, no `why`, and the generic handler could only say "the server did
    // not say why". Which is true, and useless.
    //
    // The API being DOWN is a completely different fact from the API REFUSING, and
    // the person deserves to be told which one it is — not least because one of
    // them they can do nothing about, and the other might be their fault.
    // ═══════════════════════════════════════════════════════════════════════
    //
    // 🔴 BUT: OUR OWN SERVER ALSO SPEAKS 503.
    //
    // `MAIL_NOT_CONFIGURED` and `SMS_NOT_CONFIGURED` are deliberate, well-worded
    // 503s from Selah itself. The first version of this block swallowed them and
    // replaced our careful "we cannot email you, and we will not pretend we did"
    // with a generic "the server is not answering" — which is a LIE, because the
    // server answered, at length, on purpose.
    //
    // The difference is not the status code. It is whether anybody said anything:
    // nginx's 502/504 carry NO BODY. Ours always carry words.
    const gatewayFailure = (res.status === 502 || res.status === 504 ||
                            (res.status === 503 && !data.headline && !data.error));
    if (gatewayFailure) {
      return {
        ok: false, status: res.status, apiDown: true,
        headline: 'Selah\'s server is not answering.',
        why: [
          'The website is up, but the part of Selah that holds your data did not respond. ' +
          'Nothing you typed has been saved, and nothing has been lost.',
          'This is our failure, not yours, and no amount of retrying on your side will fix it.',
        ],
        whatYouCanDoNow: ['Try again in a minute. If it persists, the server needs attention.'],
        _forOperators: 'nginx could not reach the api container. Check: docker compose ps, then docker compose logs api',
      };
    }

    if (!res.ok) {
      return { ok: false, status: res.status, ...data };
    }
    return { ok: true, status: res.status, ...data };
  }

  global.SelahAPI = {
    compliance: ()               => call('GET',    '/compliance'),

    // ── AUTH — email and password. `kind` says WHICH FRONT DOOR you came through.
    //    A person and a company are separate accounts; the server refuses to sign
    //    you into the wrong one even when your password is correct.
    register:    (email, password, kind) => call('POST', '/auth/register', { email, password, kind: kind || 'individual' }),
    login:       (email, password, kind) => call('POST', '/auth/login',    { email, password, kind: kind || 'individual' }),
    forgot:      (email)                 => call('POST', '/auth/forgot',   { email }),
    resetPass:   (token, password)       => call('POST', '/auth/reset',    { token, password }),
    verifyEmail: (token)                 => call('POST', '/auth/verify-email', { token }),
    signout:    ()               => call('POST',   '/auth/signout'),

    me:         ()               => call('GET',    '/me'),
    myAudit:    ()               => call('GET',    '/me/audit'),
    deleteMe:   ()               => call('DELETE', '/me'),

    addPayslip: (p)              => call('POST',   '/payslips', p),
    checkPayslips: ()            => call('GET',    '/payslips/check'),

    addInvoice: (i)              => call('POST',   '/invoices', i),
    credits:    ()               => call('GET',    '/invoices/credits'),
    markCertificate: (id, held)  => call('PATCH',  `/invoices/${id}/certificate`, { held }),

    addMoney:   (m)              => call('POST',   '/money', m),
    money:      ()               => call('GET',    '/money'),

    calendar:    ()              => call('GET',    '/calendar'),

    // ── BOOKS ─────────────────────────────────────────────────────────────
    books:       ()                     => call('GET',  '/books'),
    addBook:     (name, kind)           => call('POST', '/books', { name, kind }),
    categories:  (id)                   => call('GET',  '/books/' + id + '/categories'),
    addCategory: (id, c)                => call('POST',   '/books/' + id + '/categories', c),
    editCategory:(id, cid, c)           => call('PATCH',  '/books/' + id + '/categories/' + cid, c),
    delCategory: (id, cid)              => call('DELETE', '/books/' + id + '/categories/' + cid),

    myAccounts:  ()                     => call('GET',  '/books/accounts/mine'),
    addAccount:  (a)                    => call('POST', '/books/accounts', a),
    setOpening:  (id, amount, asOf)     => call('POST', '/books/accounts/' + id + '/opening', { amount, asOf }),
    reconcile:   (id, actual, asOf)     => call('POST', '/books/accounts/' + id + '/reconcile', { actual, asOf }),
    health:      ()                     => call('GET',  '/books/health'),

    period:      (b, from, to)          => call('GET',  '/entries/' + b + '/period?from=' + from + '&to=' + to),
    addTemplate: (b, t)                 => call('POST', '/entries/' + b + '/templates', t),
    stage:       (b)                    => call('POST', '/entries/' + b + '/stage'),
    stageDefaults: (b)                  => call('POST', '/entries/' + b + '/stage-defaults'),
    shopping:     (b)                   => call('GET',  '/entries/' + b + '/shopping'),
    addList:      (b, name)             => call('POST', '/entries/' + b + '/shopping', { name }),
    addShopItem:  (b, lid, it)          => call('POST', '/entries/' + b + '/shopping/' + lid + '/items', it),
    delShopItem:  (b, lid, id)          => call('DELETE','/entries/' + b + '/shopping/' + lid + '/items/' + id),
    shopDone:     (b, lid, id, body)    => call('POST', '/entries/' + b + '/shopping/' + lid + '/items/' + id + '/done', body),
    addEntry:    (b, e)                 => call('POST', '/entries/' + b + '/entries', e),
    confirm:     (b, id, body)          => call('POST', '/entries/' + b + '/entries/' + id + '/confirm', body || {}),
    didNotArrive:(b, id, note)          => call('POST', '/entries/' + b + '/entries/' + id + '/did-not-arrive', { note }),
    addBudget:   (b, g)                 => call('POST', '/entries/' + b + '/budgets', g),
    delBudget:   (b, id)                => call('DELETE', '/entries/' + b + '/budgets/' + id),
    delEntry:    (b, id)                => call('DELETE', '/entries/' + b + '/entries/' + id),
    forecast:    (b)                    => call('GET',  '/entries/' + b + '/forecast'),
    trackedValues: (b)                  => call('GET',  '/entries/' + b + '/values'),
    recordValue:   (b, v)               => call('POST', '/entries/' + b + '/values', v),
    delValuePoint: (b, id)              => call('DELETE','/entries/' + b + '/values/' + id),
    saveProfile: (p)             => call('PUT',    '/calendar/profile', p),
    addDirector: (d)             => call('POST',   '/calendar/directors', d),
    delDirector: (id)            => call('DELETE', '/calendar/directors/' + encodeURIComponent(id)),
    costOf:      (amount, dueOn) => call('POST',   '/calendar/cost', { amount, dueOn }),
  };
})(window);
