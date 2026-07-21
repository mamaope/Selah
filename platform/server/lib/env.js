/**
 * SELAH — LOAD .env, ZERO DEPENDENCIES
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 NODE DOES NOT READ .env FILES. `process.env.X` is the process environment,
 *    and something has to PUT the values there.
 *
 * Under docker-compose that "something" is the `environment:` block, which pulls
 * from .env via ${...} substitution. But that means the API ONLY works under
 * compose — run `node server/index.js` on a host and every key is undefined, and
 * the server crashes on its own encryption-key check before it ever listens.
 *
 * This file removes that trap. It reads a .env file directly, so the API boots the
 * same way whether it is launched by compose, by a bare `node`, or by a process
 * manager. .env becomes the single source of truth.
 *
 * TWO RULES, AND THEY MATTER:
 *
 *   1. IT NEVER OVERRIDES AN ALREADY-SET VARIABLE. A value that is already in
 *      process.env — because compose injected it, or the operator exported it —
 *      WINS. The file is a fallback, never an override. Otherwise a stale .env
 *      could silently undo a value the deployment set on purpose.
 *
 *   2. IT DOES NOT STRIP INLINE COMMENTS FROM VALUES. `KEY=abc # note` is read as
 *      the literal `abc # note`, exactly as docker-compose reads it — which is why
 *      preflight.js FORBIDS a '#' in a value. One rule, honoured everywhere: a
 *      comment goes on its own line, never after a value. (See the SELAH_INDEX_KEY
 *      incident: a trailing comment became part of a 64-char key and crash-looped
 *      the whole server.)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const fs = require('fs');
const path = require('path');

function loadEnv() {
  // 🔴 A TEST THAT CONTROLS THE ENVIRONMENT MUST NOT BE UNDERMINED BY A .env ON DISK.
  //    server.test.js deletes the PDPO vars to prove the gate is SHUT — and without
  //    this, loadEnv would refill them from the developer's real .env and reopen it.
  if (process.env.SELAH_NO_ENV_FILE === '1') return { loaded: false, from: null, set: [], skipped: true };

  // Look where a .env would plausibly live: beside the server, beside the compose
  // file, or wherever the process was started. First one found wins; we do not
  // merge several, because two .env files is two sources of truth.
  const candidates = [
    process.env.SELAH_ENV_FILE,                          // an explicit override
    path.join(__dirname, '..', '..', '.env'),            // platform/.env
    path.join(process.cwd(), '.env'),
  ].filter(Boolean);

  const file = candidates.find((f) => { try { return fs.statSync(f).isFile(); } catch { return false; } });
  if (!file) return { loaded: false, from: null, set: [] };

  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const set = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;

    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    // 🔴 RULE 1: never override. Compose-injected / exported values win.
    if (process.env[key] !== undefined && process.env[key] !== '') continue;

    // 🔴 RULE 2: no inline-comment stripping. Strip surrounding quotes only.
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
    set.push(key);
  }

  return { loaded: true, from: file, set };
}

module.exports = { loadEnv };
