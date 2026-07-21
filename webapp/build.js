// Selah — build the browser bundle from the Node engine.
// One engine. One source of truth. The browser gets exactly what the tests ran.
const fs = require('fs');
const path = require('path');

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 WHERE AM I RUNNING?
//
// build.js runs in TWO places, and they are not the same place:
//
//   1. ON A DEVELOPER'S MACHINE, in the repository. Everything is here:
//      docker-compose.yml, .dockerignore, the Dockerfiles, package.json.
//
//   2. INSIDE THE DOCKER BUILD, where the context contains ONLY what the
//      Dockerfile COPYs — engine/, web/, build.js, nginx.conf — because
//      .dockerignore (correctly) keeps the orchestration files out of the image.
//
// I wrote guards that check docker-compose.yml for truncation and cross-check
// .dockerignore against the Dockerfiles. Excellent guards. And they ran INSIDE
// the container, found no docker-compose.yml, concluded it had been truncated to
// nothing, and KILLED THE BUILD.
//
// A guard that fires where it cannot possibly be right is not a guard. It is a
// second bug wearing the costume of the first.
//
// So: the orchestration checks run only where the orchestration files live. They
// are not "skipped" in the container — they are NOT APPLICABLE there, and that
// is a different thing. They still run on every `npm run build` and every
// `npm test`, which is where a developer would actually break them.
// ═════════════════════════════════════════════════════════════════════════════
const IN_REPO = fs.existsSync(path.join(__dirname, 'docker-compose.yml'))
             && fs.existsSync(path.join(__dirname, '.dockerignore'));

if (!IN_REPO) {
  console.log('  (in-container build — orchestration checks not applicable here)');
}

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 NO MACHINE-SPECIFIC PATHS. EVER.
//
// The UI smoke test was written in a sandbox and carried that sandbox's absolute
// path into the repo:
//
//     const WEB = path.join('/sessions/nifty-gifted-dirac/mnt/.../platform', 'web');
//
// It passed on the machine that wrote it and KILLED THE DOCKER BUILD on the first
// real run — because that directory does not exist inside a container, and never
// could. "Works on my machine" is not a property of the code; it is a property of
// the machine.
//
// The build was right to fail. This makes it fail EARLIER, and say why.
// ═════════════════════════════════════════════════════════════════════════════
const FORBIDDEN = [
  [/\/sessions\//,            'a sandbox path'],
  [/[A-Z]:\\\\/,              'a Windows drive letter'],
  [/\/home\/[a-z]+\//,        'a developer home directory'],
  [/\/Users\/[A-Za-z]+\//,    'a developer home directory'],
];
(function noMachinePaths() {
  const bad = [];
  const scan = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.name === 'node_modules' || f.name.startsWith('.')) continue;
      const full = path.join(dir, f.name);
      if (f.isDirectory()) { scan(full); continue; }
      if (!/\.(js|html|css|json)$/.test(f.name)) continue;
      const src = fs.readFileSync(full, 'utf8');
      for (const [re, what] of FORBIDDEN) {
        // The regexes above appear in THIS file as literals. Don't flag ourselves.
        if (full.endsWith('build.js')) continue;
        if (re.test(src)) bad.push(`  • ${path.relative(__dirname, full)} contains ${what}`);
      }
    }
  };
  scan(path.join(__dirname, 'engine'));
  scan(path.join(__dirname, 'web'));
  if (bad.length) {
    console.error('\n🔴 SELAH WILL NOT BUILD. A machine-specific path is in the source.\n');
    console.error(bad.join('\n'));
    console.error('\nUse __dirname. A path that only exists on one computer is not code.\n');
    process.exit(1);
  }
})();

// ═════════════════════════════════════════════════════════════════════════════
// GUARD 0 — DOES EVERY JAVASCRIPT FILE ACTUALLY PARSE?
//
// 🔴 ON 12 JULY 2026 THE FILE THAT IS THIS COMPANY WAS TRUNCATED ON DISK.
//
// engine/rules.js — 29 Ugandan tax rules, every band, every source, every
// confidence grade — was cut off MID-STRING at byte 72,693:
//
//     text: 'YOUR ADVISER MAY TELL YOU THIS IS 3%. IT IS NOT. The Stamp Duty
//                                                        <-- end of file
//
// A write had been silently capped. The file did not parse. `git status` said
// the working tree was CLEAN, because git trusted a stat cache that was lying to
// it. Nothing anywhere noticed. Minutes earlier, 408 tests had passed — against
// the file as it was BEFORE the write.
//
// The same thing then happened to engine/calendar.js, in the same session.
//
// This is the nginx.conf truncation all over again, and that is the point: THE
// SAME FAILURE HAS NOW HAPPENED THREE TIMES. Every artefact must be validated by
// the thing that will consume it. Node consumes the JavaScript. So NODE — not a
// regex, not a byte count, not a hopeful glance — must be the one to say whether
// a JavaScript file is whole.
//
// `new vm.Script(src)` is exactly what `node --check` does. It costs milliseconds
// and it makes a half-written engine UNBUILDABLE.
// ═════════════════════════════════════════════════════════════════════════════
{
  const vm = require('vm');
  const roots = ['engine', 'web/assets', 'server', 'server/lib', 'server/routes'];
  const bad = [];
  let checked = 0;

  for (const r of roots) {
    const dir = path.join(__dirname, r);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.js')) continue;
      // engine.bundle.js is GENERATED further down this very file. Checking it
      // here would only ever tell us about the LAST build, not this one.
      if (f === 'engine.bundle.js') continue;
      const full = path.join(dir, f);
      if (!fs.statSync(full).isFile()) continue;
      const src = fs.readFileSync(full, 'utf8');
      checked++;
      try {
        new vm.Script(src, { filename: full });
      } catch (e) {
        bad.push({ file: path.join(r, f), err: e.message, bytes: src.length });
      }
    }
  }

  if (bad.length) {
    console.error('\n🔴 A JAVASCRIPT FILE DOES NOT PARSE. THE BUILD STOPS HERE.\n');
    for (const b of bad) {
      console.error(`   ${b.file}  (${b.bytes.toLocaleString()} bytes)`);
      console.error(`      ${b.err}\n`);
    }
    console.error('   A truncated file has reached disk before. If the error is at the very');
    console.error('   end of the file, SUSPECT A CAPPED WRITE, not a typo. Check the byte');
    console.error('   count against git: `git show HEAD:<file> | wc -c`.\n');
    process.exit(1);
  }
  console.log(`  ✓ ${checked} JavaScript files parse.`);
}

// ═════════════════════════════════════════════════════════════════════════════
// GUARD — NGINX MUST NOT RESOLVE AN UPSTREAM AT CONFIG-PARSE TIME.
//
// 🔴 `proxy_pass http://api:3000;` MADE THE WEB IMAGE UNBUILDABLE.
//
// A LITERAL hostname in proxy_pass is resolved by nginx when it PARSES the
// config. `nginx -t` runs inside the image build, where no `api` container
// exists, so it died:
//
//     [emerg] host not found in upstream "api"
//
// The config was right for runtime and impossible at build time. The fix is a
// VARIABLE in proxy_pass (which defers the lookup to request time) plus a
// `resolver`. That is also strictly better at runtime: a config-time lookup pins
// the API's IP forever, so a redeployed container would leave nginx proxying into
// a black hole behind a perfectly valid config.
//
// This guard exists because the fix is easy to undo. Somebody debugging a proxy
// will "simplify" it back to a literal, the image will stop building, and they
// will blame nginx.
// ═════════════════════════════════════════════════════════════════════════════
{
  const confPath = path.join(__dirname, 'nginx.conf');
  if (fs.existsSync(confPath)) {
    // Strip comments FIRST. This guard has cried wolf at its own prose before.
    const conf = fs.readFileSync(confPath, 'utf8')
      .split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');

    const passes = [...conf.matchAll(/proxy_pass\s+([^;]+);/g)].map((m) => m[1].trim());
    const literal = passes.filter((u) => !u.includes('$'));

    if (literal.length) {
      console.error('\n🔴 nginx.conf has a LITERAL upstream in proxy_pass. THE IMAGE WILL NOT BUILD.\n');
      literal.forEach((u) => console.error(`   proxy_pass ${u};`));
      console.error('\n   nginx resolves a literal hostname when it PARSES the config, and `nginx -t`');
      console.error('   runs at BUILD time, when no such container exists:');
      console.error('       [emerg] host not found in upstream "api"\n');
      console.error('   Use a variable so the lookup happens at REQUEST time:');
      console.error('       resolver 127.0.0.11 valid=10s ipv6=off;');
      console.error('       set $selah_api api;');
      console.error('       proxy_pass http://$selah_api:3000$request_uri;\n');
      process.exit(1);
    }

    if (passes.length && !/^\s*resolver\s+/m.test(conf)) {
      console.error('\n🔴 nginx.conf uses a VARIABLE upstream but declares no `resolver`.');
      console.error('   nginx will fail every proxied request at runtime. The config still parses,');
      console.error('   so nothing else in this pipeline would ever tell you.\n');
      process.exit(1);
    }

    if (passes.length) {
      // A variable proxy_pass does NO automatic URI rewriting. Forgetting
      // $request_uri silently strips the path — every /api/* request arrives at
      // the API as "/", and every route 404s with a valid config and a green build.
      const missing = passes.filter((u) => !/\$request_uri/.test(u));
      if (missing.length) {
        console.error('\n🔴 nginx.conf: a variable proxy_pass without $request_uri.');
        missing.forEach((u) => console.error(`   proxy_pass ${u};`));
        console.error('\n   With a variable, nginx does NOT pass the URI on for you. Every request');
        console.error('   would reach the API as "/" and 404 — with a valid config and a green build.\n');
        process.exit(1);
      }
      console.log(`  ✓ nginx upstream is resolved at request time (${passes.length} proxy_pass, resolver present).`);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GUARD — `[hidden]` MUST ACTUALLY HIDE.
//
// 🔴 THIS HAS NOW HAPPENED THREE TIMES IN THIS PROJECT.
//
//   1. `.panel { display: block }`  → every calculator invisible.
//   2. `.panel[hidden]` fixed it... and then:
//   3. `.sheet { display: grid }`   → the Record dialog COULD NOT BE CLOSED. The
//      user was trapped in it and could not navigate. `.fab` and `.appnav` too.
//
// The cause is always the same, and it is a rule of CSS, not a typo: `[hidden]`
// is styled by the BROWSER's stylesheet, which has the LOWEST priority there is.
// ANY author rule that sets `display` on the same element beats it, silently.
//
// One line prevents all of it: `[hidden] { display: none !important; }`
//
// If it is ever deleted, every hidden thing in this app becomes visible, no test
// that checks `el.hidden` will notice, and the first symptom will be a user who
// cannot dismiss a dialog. So the BUILD checks for it.
// ═════════════════════════════════════════════════════════════════════════════
{
  const cssPath = path.join(__dirname, 'web/assets/tokens.css');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');            // strip comments — this guard has cried wolf before
    if (!/\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(css)) {
      console.error('\n🔴 tokens.css has no `[hidden] { display: none !important; }` rule.\n');
      console.error('   Without it, ANY class that sets `display` defeats the `hidden` attribute —');
      console.error('   silently. The Record dialog becomes impossible to close, and the user is');
      console.error('   trapped in it. This has happened three times. THE BUILD STOPS HERE.\n');
      process.exit(1);
    }
    console.log('  ✓ [hidden] actually hides.');
  }
}

const strip = (src) => src
  .replace(/^const \{[^}]*\} = require\([^)]*\);\s*$/gm, '')
  .replace(/^module\.exports\s*=\s*\{[\s\S]*?\};\s*$/gm, '');

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 THE TRUNCATION GUARD.
//
// Four files in this repo have now shipped TRUNCATED — cut off mid-token by a
// tool that wrote them: engine.js, engine.test.js, build.js, and nginx.conf.
//
// The last one crash-looped the container. It was cut at `location ~* \.(` and
// nothing in the pipeline noticed, because nothing in the pipeline PARSED it.
//
// Node parses the JavaScript, so a truncated .js dies loudly and immediately.
// Nobody parsed the nginx config, so a truncated .conf died in production.
//
// THE RULE: EVERY ARTEFACT MUST BE VALIDATED BY THE THING THAT WILL CONSUME IT.
// `nginx -t` now runs in the image build. This is the cheap early warning.
// ═════════════════════════════════════════════════════════════════════════════
(function truncationGuard() {
  const bad = [];

  // Strip LINE BY LINE. A regex like /"[^"]*"/ run over a whole file will happily
  // match across newlines, swallow half the config, and report a brace imbalance
  // that does not exist. My first version of this guard did exactly that and
  // accused a perfectly valid nginx.conf of being truncated — a false alarm is
  // how a guard gets switched off, so it has to be right.
  const strip = (text) => text.split('\n').map((line) => {
    const noComment = line.replace(/#.*$/, '');
    return noComment.replace(/"[^"\n]*"/g, '""').replace(/'[^'\n]*'/g, "''");
  }).join('\n');

  const conf = fs.readFileSync(path.join(__dirname, 'nginx.conf'), 'utf8');
  const code = strip(conf);
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  const lastLine = conf.trim().split('\n').pop().trim();

  if (opens !== closes) bad.push(`  • nginx.conf has ${opens} '{' and ${closes} '}'. It is TRUNCATED or malformed — nginx will refuse to start and the container will crash-loop.`);
  if (lastLine !== '}')  bad.push(`  • nginx.conf does not end with '}'. It ends with: ${JSON.stringify(lastLine.slice(0, 60))}`);

  // 🔴 THE COMPOSE FILE AND THE DOCKERFILES. Five files have now shipped
  // truncated: engine.js, engine.test.js, build.js, nginx.conf — and
  // docker-compose.yml, which was cut off mid-healthcheck at `require('/opt/s`.
  //
  // nginx validates its own config now. Node validates the JavaScript. NOTHING
  // was validating the YAML, so a truncated compose file reached the founder and
  // failed with a message that told him nothing about why.
  //
  // EVERY ARTEFACT MUST BE VALIDATED BY THE THING THAT WILL CONSUME IT — and
  // where we cannot run that thing here, we check the shape.
  // The compose file is HERE, in platform/, beside the Dockerfiles it builds.
  // 🔴 But it is NOT in the Docker build context, because .dockerignore keeps it
  //    out of the image — correctly. So this check belongs to the repo, not the
  //    container. See the IN_REPO note at the top of this file.
  for (const f of (IN_REPO ? ['docker-compose.yml'] : [])) {
    const full = path.join(__dirname, f);
    if (!fs.existsSync(full)) { bad.push(`  • ${f} is MISSING. It should be here, beside the Dockerfiles.`); continue; }
    const y = fs.readFileSync(full, 'utf8');
    if (y.includes('\u0000')) bad.push(`  • ${f} contains NUL bytes. It is corrupt.`);

    // 🔴 MY FIRST VERSION OF THIS CHECK FLAGGED `selah-db:` — a perfectly valid
    // last line — as "truncated mid-token". A guard that cries wolf is a guard
    // that gets switched off, and then it is worse than no guard at all.
    //
    // So: check the things that are ACTUALLY true of a working compose file, and
    // nothing clever.
    if (!/^services:/m.test(y)) bad.push(`  • ${f} has no top-level services: block. It is truncated or it is not a compose file.`);
    for (const svc of ['  web:', '  api:', '  db:']) {
      if (!y.includes(svc)) bad.push(`  • ${f} is missing the "${svc.trim().replace(':','')}" service — the file is truncated, or someone removed it.`);
    }
    // The healthcheck is where it was cut last time: `require('/opt/s`. An odd
    // number of quotes means something is severed mid-string.
    //
    // 🔴 STRIP THE COMMENTS FIRST. My first attempt counted the apostrophes in my
    // own prose — "Ugandans' payslips", "the director's conviction" — and cried
    // wolf on a perfectly good file. That is the SECOND false alarm this guard has
    // produced in ten minutes, and a guard that cries wolf gets switched off.
    //
    // The rule for a guard is the same as the rule for a tax rule: if it is not
    // right, it is worse than absent.
    const code = y.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
    const quotes = (code.match(/'/g) || []).length;
    if (quotes % 2 !== 0) bad.push(`  • ${f} has an ODD number of single quotes outside its comments (${quotes}). Something is cut off mid-string.`);
    if (!/^\s*$/.test(y.split('\n').pop() || '') && !y.endsWith('\n')) {
      bad.push(`  • ${f} does not end with a newline. It may be truncated.`);
    }
  }

  for (const f of fs.readdirSync(path.join(__dirname, 'web'))) {
    if (!f.endsWith('.html')) continue;
    const full = path.join(__dirname, 'web', f);
    const raw = fs.readFileSync(full);

    // 🔴 NUL BYTES. calculators.html once carried ~120 of them appended after
    // </html> — silent file corruption from a truncated write. Browsers tolerate
    // it, grep calls the file "binary", and every text tool you reach for
    // afterwards quietly stops working on it. Catch it here.
    const nuls = raw.filter((b) => b === 0).length;
    if (nuls) bad.push(`  • web/${f} contains ${nuls} NUL bytes. The file is CORRUPT — a truncated write padded it.`);

    const html = raw.toString('utf8').replace(/\0/g, '').trim();
    if (!/<\/html>$/i.test(html)) bad.push(`  • web/${f} does not end with </html>. It is TRUNCATED.`);
  }

  if (bad.length) {
    console.error('\n🔴 SELAH WILL NOT BUILD. A file is truncated.\n');
    console.error(bad.join('\n'));
    console.error('\nA file nobody parses is a file nobody checked. Rewrite it in full.\n');
    process.exit(1);
  }
})();

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 THE .dockerignore GUARD — a file that exists, that Docker cannot see.
//
// .dockerignore excluded package.json and package-lock.json. It had been written
// for a static web image, which does not need them. Then the API arrived, and its
// Dockerfile starts:
//
//     COPY package.json package-lock.json ./
//     RUN npm ci
//
// The build died with:
//
//     failed to compute cache key: "/package-lock.json": not found
//
// The file was right there, on disk, beside the Dockerfile. Docker simply could
// not see it — and the error message says "not found", which sends you looking
// for a missing file instead of a hidden one.
//
// So: every COPY source in every Dockerfile is cross-checked against
// .dockerignore. An ignore rule that hides a file the build needs will not build.
//
// This is the same rule as everywhere else in this repo: EVERY ARTEFACT MUST BE
// VALIDATED BY THE THING THAT WILL CONSUME IT. Docker consumes .dockerignore. We
// cannot run Docker here — so we check the one thing that actually goes wrong.
// ═════════════════════════════════════════════════════════════════════════════
(function dockerignoreGuard() {
  if (!IN_REPO) return;   // no .dockerignore inside the image, and none is needed
  const bad = [];
  const ignoreFile = path.join(__dirname, '.dockerignore');

  const patterns = fs.readFileSync(ignoreFile, 'utf8')
    .split('\n').map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const hidden = (src) => patterns.some((pat) => {
    if (pat === src) return true;                                  // exact
    if (pat.endsWith('/') && src.startsWith(pat)) return true;     // directory
    if (pat.startsWith('*.') && src.endsWith(pat.slice(1))) return true;  // *.md
    return false;
  });

  for (const df of ['Dockerfile', 'Dockerfile.api']) {
    const full = path.join(__dirname, df);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');

    for (const line of text.split('\n')) {
      const m = /^\s*COPY\s+(?!--from)(.+)$/.exec(line);
      if (!m) continue;
      // everything but the final destination
      const parts = m[1].trim().split(/\s+/);
      const sources = parts.slice(0, -1).filter((x) => !x.startsWith('--'));
      for (const src of sources) {
        if (hidden(src)) {
          bad.push(`  • ${df} does "COPY ${src}" — but .dockerignore HIDES it. Docker will report "${src}: not found" even though the file is right there.`);
        }
      }
    }
  }

  // And while we are here: `npm ci` REFUSES to run if package.json and the
  // lockfile disagree. Inside a Docker build that failure is another message that
  // points at the wrong thing. Catch it on this side.
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const lock = JSON.parse(fs.readFileSync(path.join(__dirname, 'package-lock.json'), 'utf8'));
    const want = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const have = { ...(lock.packages[''].dependencies || {}), ...(lock.packages[''].devDependencies || {}) };
    for (const d of Object.keys(want)) {
      if (!(d in have)) bad.push(`  • package.json needs "${d}" but package-lock.json does not have it. \`npm ci\` will REFUSE. Run: npm install`);
    }
  } catch (e) {
    bad.push(`  • Could not read package.json / package-lock.json: ${e.message}`);
  }

  if (bad.length) {
    console.error('\n🔴 SELAH WILL NOT BUILD. .dockerignore hides a file the build needs.\n');
    console.error(bad.join('\n'));
    console.error('\nDocker will say "not found". The file exists. .dockerignore is why.\n');
    process.exit(1);
  }
})();

// ═════════════════════════════════════════════════════════════════════════════
// 🔴 THE CSP GUARD — our own security header was killing our own product.
//
// nginx.conf sends:   Content-Security-Policy: ... script-src 'self' ...
//
// With no 'unsafe-inline' a browser REFUSES to run every <script> block with no
// src, and every onclick=/oninput=/onerror= attribute. Silently.
//
// So the theme never loaded, "Browse all 18 calculators" did nothing, and "Start
// again" did nothing — BUT ONLY WHEN SERVED FROM THE CONTAINER. Open the file
// from disk and it all works, because a file:// URL carries no CSP header.
//
// And 68 UI tests passed throughout, because jsdom does not enforce CSP. We were
// testing the page in an environment that lacked the very thing that broke it.
//
// THE FIX WAS NOT TO WEAKEN THE CSP. The CSP is right — inline handlers are
// exactly what it exists to stop. The code was wrong.
//
// A policy you cannot enforce is a policy you do not have. So the build enforces
// it: an inline script, or an on* attribute, HALTS THE BUILD.
// ═════════════════════════════════════════════════════════════════════════════
(function cspGuard() {
  const bad = [];
  const webDir = path.join(__dirname, 'web');

  const conf = fs.readFileSync(path.join(__dirname, 'nginx.conf'), 'utf8');
  const policy = (/Content-Security-Policy\s+"([^"]+)"/.exec(conf) || [])[1] || '';
  const scriptSrc = (/script-src ([^;]+)/.exec(policy) || [])[1] || '';
  if (scriptSrc.includes("'unsafe-inline'")) {
    bad.push("  • nginx.conf allows 'unsafe-inline' in script-src. Someone weakened the CSP to make a button work. Fix the button, not the policy.");
  }

  for (const f of fs.readdirSync(webDir)) {
    if (!f.endsWith('.html')) continue;
    const src = fs.readFileSync(path.join(webDir, f), 'utf8');
    for (const tag of src.match(/<script\b[^>]*>/g) || []) {
      if (!/\bsrc=/.test(tag)) bad.push(`  • ${f} has an INLINE <script> block. The CSP will refuse to run it.`);
    }
    for (const h of src.match(/\son(click|input|change|error|submit|load)\s*=/g) || []) {
      bad.push(`  • ${f} has an inline ${h.trim().replace(/\s*=$/, '')} handler. The CSP will refuse to run it.`);
    }
  }

  // Nothing we GENERATE may emit one either.
  const gen = fs.readFileSync(path.join(webDir, 'assets/calculators.js'), 'utf8')
    .split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  if (/\son(click|input|change)="/.test(gen)) {
    bad.push('  • calculators.js GENERATES markup carrying an inline handler. It will be dead behind the CSP.');
  }

  if (bad.length) {
    console.error('\n🔴 SELAH WILL NOT BUILD. This page would be DEAD when served.\n');
    console.error(bad.join('\n'));
    console.error('\nThe Content-Security-Policy forbids inline JavaScript, and it is RIGHT to.');
    console.error('Use data-action + a delegated listener. See web/assets/theme.js.\n');
    process.exit(1);
  }
})();

const rules  = strip(fs.readFileSync(path.join(__dirname, 'engine/rules.js'), 'utf8'));
const engine = strip(fs.readFileSync(path.join(__dirname, 'engine/engine.js'), 'utf8'));
const tier1  = strip(fs.readFileSync(path.join(__dirname, 'engine/tier1.js'), 'utf8'));
const tier2  = strip(fs.readFileSync(path.join(__dirname, 'engine/tier2.js'), 'utf8'));
const person = strip(fs.readFileSync(path.join(__dirname, 'engine/personal.js'), 'utf8'));
const clock  = strip(fs.readFileSync(path.join(__dirname, 'engine/clock.js'), 'utf8'));
const cal    = strip(fs.readFileSync(path.join(__dirname, 'engine/calendar.js'), 'utf8'));
const apply  = strip(fs.readFileSync(path.join(__dirname, 'engine/applicability.js'), 'utf8'))
                 .replace(/^function fmt\(n\) \{[\s\S]*?^\}$/m, ''); // fmt already defined in engine.js

const bundle = `/* SELAH — browser bundle. GENERATED. Do not edit.
   Built from engine/rules.js + engine/engine.js + engine/tier1.js + engine/applicability.js
   — byte for byte the same code the test suite runs against. If the browser and
   the tests can disagree, the tests are decorative. */
(function (global) {
'use strict';
${rules}
${engine}
${tier1}
${tier2}
${person}
${clock}
${cal}
${apply}
global.Selah = {
  taxProfile, QUESTIONS, taxYear, fmtDate, daysUntil,
  paye, netPay, lstFor, presumptive, individualIncomeTaxAnnual,
  soleTraderVsCompany, ENTITY_CROSSOVER, extraction, whtCredits,
  vatRegistration, arrearsProjection, startupExemption, tccReadiness,
  netToGross, trueCostOfEmployee, corporateIncomeTax, presumptiveElection,
  rentalIncome, whtRate, vatAmount, vatDeregistration, voluntaryDisclosure,
  motorVehicleBenefit, housingBenefit, employeeLoanBenefit, terminalBenefits,
  multipleEmployers, capitalAllowances, startupCosts, provisionalTax,
  inputVatRecoverable, advanceTaxTransport, stampDuty,
  loanSchedule, savings, retirement, debtPayoff, emergencyFund, netWorth,
  budget, treasuryYield, mortgageAffordability, businessValuation,
  watchlist, exposure, commence, WATCHLIST,
  upcoming, obligationsFor, costOfMissing, directorTrap,
  fmt, RULES, CONFIDENCE, BLACKLIST
};
})(window);
`;
fs.writeFileSync(path.join(__dirname, 'web/assets/engine.bundle.js'), bundle);
console.log('built web/assets/engine.bundle.js —', (bundle.length / 1024).toFixed(1), 'KB');
