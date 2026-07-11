// Selah — build the browser bundle from the Node engine.
// One engine. One source of truth. The browser gets exactly what the tests ran.
const fs = require('fs');
const path = require('path');

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
  fmt, RULES, CONFIDENCE, BLACKLIST
};
})(window);
`;
fs.writeFileSync(path.join(__dirname, 'web/assets/engine.bundle.js'), bundle);
console.log('built web/assets/engine.bundle.js —', (bundle.length / 1024).toFixed(1), 'KB');
