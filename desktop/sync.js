/**
 * SELAH DESKTOP — SYNC THE SHARED PARTS FROM THE WEBAPP.
 *
 * 🔴 THE ENGINE IS AUTHORED ONCE, IN webapp/engine, WHERE 561 TESTS RUN AGAINST IT.
 *    The desktop app does not fork it — it copies it, verbatim, so a Ugandan tax
 *    rule can never be right in one app and wrong in the other. Same for the
 *    calculator UI: the desktop calculators ARE the web calculators, offline.
 *
 * Run before every start/build (npm start does this automatically).
 */
const fs = require('fs');
const path = require('path');

const WEBAPP = path.join(__dirname, '..', 'webapp');
const HERE = __dirname;

function copyDir(src, dst, filter) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (filter && !filter(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d, filter);
    else fs.copyFileSync(s, d);
  }
}

// 1. the engine — pure JS, the moat. Skip the test files; they run in the webapp.
// engine WITH its tests — so `npm test` here re-verifies the copy is correct (a bad
// sync must not silently ship a stale engine). electron-builder omits *.test.js.
copyDir(path.join(WEBAPP, 'engine'), path.join(HERE, 'engine'));

// 2. the web front-end — the calculators work offline as-is (no API), and the
//    suites will talk to the local vault instead of the server via preload.
copyDir(path.join(WEBAPP, 'web'), path.join(HERE, 'renderer', 'web'), (n) => !n.endsWith('.test.js'));

console.log('  ✓ synced engine + web assets from webapp/ into desktop/');
