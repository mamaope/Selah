/**
 * SELAH — THE REAL BROWSER TEST
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THIS FILE EXISTS BECAUSE I TOLD THE FOUNDER SOMETHING WORKED, FIVE NIGHTS
 *    RUNNING, AND IT DID NOT.
 *
 * Every one of these bugs passed a green test suite and died in his browser:
 *
 *   1. A sandbox path baked into a test        → killed the Docker build
 *   2. A hand-fed file in my build simulation  → hid an ENOENT from myself
 *   3. Content-Security-Policy                 → killed EVERY button. jsdom does
 *                                                 not enforce CSP.
 *   4. jsdom on `about:blank`                  → hid an INFINITE hashchange loop.
 *                                                 Every calculator was blank.
 *   5. `.panel { display: none }` in the CSS   → hid EVERY calculator. jsdom does
 *                                                 not load stylesheets at all.
 *
 * FIVE FAILURES, ONE CAUSE: THE ENVIRONMENT I VERIFIED IN WAS NOT THE ENVIRONMENT
 * HE RAN IN. A test that runs somewhere the bug cannot exist is not a test. It is
 * a reassurance.
 *
 * So this suite drives a REAL CHROMIUM against the REAL CONTAINER:
 *
 *     real Content-Security-Policy   (served by nginx, not simulated)
 *     real stylesheets               (fetched, parsed, applied)
 *     real URLs and real hashes      (not about:blank)
 *     real clicks, real typing       (not function calls)
 *     and it FAILS ON A CONSOLE ERROR
 *
 * That last one is the whole point. The CSP bug logged a violation to the console
 * and nothing else. A test that ignores the console would have missed it again.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RUN IT:
 *
 *     docker compose up -d --build
 *     npm run e2e
 *
 * The engine tests prove the tax is right. THIS proves the user can see it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { test, expect } = require('@playwright/test');

const BASE = process.env.SELAH_URL || 'http://localhost:8080';

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 THE CONSOLE IS A TEST SUBJECT, NOT NOISE.
//
// A CSP violation is a console message and NOTHING ELSE. The page renders, the
// buttons sit there, and nothing tells you why. If this harness tolerates a
// console error, it will miss that bug a second time.
// ═════════════════════════════════════════════════════════════════════════════
function watchConsole(page) {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`failed to load: ${r.url()} — ${r.failure()?.errorText}`));
  return problems;
}

test.describe('Selah, in a real browser, behind the real nginx', () => {

  test('the CSP is actually being served — and nothing violates it', async ({ page }) => {
    const problems = watchConsole(page);

    const res = await page.goto(`${BASE}/calculators.html`);
    const csp = res.headers()['content-security-policy'];

    // The header must be there, and it must still forbid inline script.
    expect(csp, 'nginx must send a Content-Security-Policy').toBeTruthy();
    expect(csp).toContain("script-src 'self'");
    expect(csp, "nobody weakened the CSP to make a button work").not.toContain("'unsafe-inline'");

    await page.waitForLoadState('networkidle');

    // 🔴 A CSP violation is a console error. This is the assertion that would have
    // caught the bug that killed every button on the site.
    const csp_violations = problems.filter((p) => /Content Security Policy|Refused to execute|Refused to apply/i.test(p));
    expect(csp_violations, 'the page must not violate its own security policy').toEqual([]);
    expect(problems, 'the console must be clean').toEqual([]);
  });

  test('the stylesheets actually load and apply', async ({ page }) => {
    await page.goto(`${BASE}/calculators.html#calc=paye`);
    await page.waitForLoadState('networkidle');

    // jsdom never fetched these. The whole `.panel { display:none }` disaster
    // lived in the gap between "the JS thinks it is shown" and "the CSS shows it".
    const panelDisplay = await page.locator('#panel-paye').evaluate((el) => getComputedStyle(el).display);
    expect(panelDisplay, 'the PAYE panel must actually be visible').not.toBe('none');

    // And it must LOOK like Selah, not like unstyled HTML.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg, 'the brand tokens must have applied').not.toBe('rgba(0, 0, 0, 0)');
  });

  test('every calculator opens from the directory, and shows a number', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto(`${BASE}/calculators.html#all`);
    await page.waitForLoadState('networkidle');

    const cards = page.locator('#calc-index .door');
    const count = await cards.count();
    expect(count, 'the directory must list every calculator').toBeGreaterThanOrEqual(37);

    const keys = await cards.evaluateAll((els) => els.map((e) => e.dataset.calc));

    for (const key of keys) {
      await page.goto(`${BASE}/calculators.html#all`);
      await page.locator(`#calc-index .door[data-calc="${key}"]`).click();

      const panel = page.locator(`#panel-${key}`);
      await expect(panel, `clicking "${key}" must open its panel`).toBeVisible();

      const out = page.locator(`#out-${key}`);
      await expect(out, `"${key}" must render an answer`).not.toBeEmpty();

      // Every trace must cite the law, or refuse. Nothing in between.
      const cited = await out.locator('.cite, .refusal').count();
      expect(cited, `"${key}" must cite its source or refuse`).toBeGreaterThan(0);
    }

    expect(problems, 'no console errors while opening 37 calculators').toEqual([]);
  });

  test('a deep link opens a calculator — and does not loop', async ({ page }) => {
    const problems = watchConsole(page);

    for (const key of ['paye', 'whtrate', 'stampduty', 'loan', 'clock']) {
      await page.goto(`${BASE}/calculators.html#calc=${key}`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator(`#panel-${key}`), `#calc=${key} must open`).toBeVisible();
      await expect(page.locator(`#out-${key}`)).not.toBeEmpty();

      // 🔴 THE INFINITE HASHCHANGE LOOP. The router used to rewrite the URL that
      // summoned it, forever, and the browser never painted. If the hash has moved
      // on its own, the loop is back.
      expect(page.url(), 'the router must not rewrite the URL that summoned it')
        .toBe(`${BASE}/calculators.html#calc=${key}`);
    }
    expect(problems).toEqual([]);
  });

  test('typing a number recomputes the answer — live', async ({ page }) => {
    await page.goto(`${BASE}/calculators.html#calc=paye`);
    await page.waitForLoadState('networkidle');

    const out = page.locator('#out-paye');
    const before = await out.textContent();

    await page.locator('#paye-gross').fill('5000000');
    await expect(out).not.toHaveText(before);

    // The engine's own figure, rendered in a real browser. If this is wrong,
    // the bundle has drifted from the engine the 408 tests ran against.
    await page.locator('#paye-gross').fill('1000000');
    await page.locator('#paye-nssf').uncheck();
    await expect(out).toContainText('188,250');
  });

  test('a <select> fires change — and the page refuses, live', async ({ page }) => {
    await page.goto(`${BASE}/calculators.html#calc=paye`);
    await page.waitForLoadState('networkidle');

    await page.locator('#paye-res').selectOption('non-resident');

    // 🔑 THE REFUSAL. Every competitor's calculator returns a number here.
    await expect(page.locator('#out-paye .refusal')).toBeVisible();
    await expect(page.locator('#out-paye')).toContainText('we will not guess');
  });

  test('search works in plain words', async ({ page }) => {
    await page.goto(`${BASE}/calculators.html#all`);
    await page.waitForLoadState('networkidle');

    for (const [query, expected] of [
      ['i owe ura money', 'arrears'],
      ['take home',       'netgross'],
      ['company car',     'mvbenefit'],
      ['tender',          'tcc'],
    ]) {
      await page.locator('#calc-search').fill(query);
      await expect(page.locator(`#calc-index .door[data-calc="${expected}"]`),
        `"${query}" must find ${expected}`).toBeVisible();
    }

    // A zero-result search is a question we failed to understand, not a dead end.
    await page.locator('#calc-search').fill('qqqqq');
    await expect(page.locator('#calc-index')).toContainText('let the guide ask you');
  });

  test('the guide can be walked, by clicking, all the way to an answer', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto(`${BASE}/calculators.html`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#quiz-go')).toBeDisabled();

    // Answer whatever appears, first option, until nothing is unanswered.
    for (let i = 0; i < 30; i++) {
      const unanswered = page.locator('#quiz .q').filter({ has: page.locator('.qbtn:not(.on)') })
        .filter({ hasNot: page.locator('.qbtn.on') }).first();
      if (!(await unanswered.count())) break;
      await unanswered.locator('.qbtn').first().click();
    }

    await expect(page.locator('#quiz-go')).toBeEnabled();
    await page.locator('#quiz-go').click();

    await expect(page.locator('#obligations .ob').first()).toBeVisible();
    await expect(page.locator('#obligations')).toContainText('Why it applies');

    expect(problems).toEqual([]);
  });

  test('the theme toggle works and persists', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    // Dark is the default, set before first paint.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.locator('#theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await expect(page.locator('html'), 'the choice must survive a reload')
      .toHaveAttribute('data-theme', 'light');
  });

  test('the container is healthy, and it knows what PAYE is', async ({ request }) => {
    const health = await request.get(`${BASE}/healthz`);
    expect(health.ok()).toBeTruthy();

    // The bundle the browser is actually served must compute the right tax.
    // If this fails, what shipped is not what we tested.
    const js = await (await request.get(`${BASE}/assets/engine.bundle.js`)).text();
    expect(js.length).toBeGreaterThan(100_000);
    expect(js, 'the shipped bundle must carry the corrected 2026 threshold').toContain('335_000');
  });

  test('no page 404s, and nothing private is served', async ({ request }) => {
    for (const p of ['/', '/index.html', '/calculators.html', '/individual.html', '/organisation.html']) {
      expect((await request.get(BASE + p)).status(), `${p} must serve`).toBe(200);
    }
    // The build prunes these. If they are reachable, the prune did not run.
    for (const p of ['/ui.test.js', '/assets/images/prepare.py', '/build.js', '/engine/rules.js']) {
      expect((await request.get(BASE + p)).status(), `${p} must NOT be served`).toBe(404);
    }
  });
});
