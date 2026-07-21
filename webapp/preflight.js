#!/usr/bin/env node
/**
 * SELAH — PREFLIGHT
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this before `docker compose up`. It reads your .env the way Docker will,
 * and tells you what is wrong with it in plain words.
 *
 * 🔴 IT EXISTS BECAUSE OF A REAL FAILURE, AND THE ERROR MESSAGE WAS USELESS.
 *
 *     error while interpolating services.api.environment.SELAH_INDEX_KEY:
 *     required variable SELAH_INDEX_KEY is missing a value
 *
 * ...on a machine where the founder HAD set it. The variable was fine. The FILE
 * was not being read at all — and Docker's message pointed at the variable, so
 * that is where he looked.
 *
 * On Windows this is almost always one of two things, and neither is visible:
 *
 *     1. The file is called `.env.txt`. Explorer hides known extensions, so
 *        Notepad's "Save as .env" quietly produced `.env.txt`, and it LOOKS
 *        right in the folder.
 *
 *     2. The file has a UTF-8 BOM. PowerShell's `>` and `Set-Content` add one by
 *        default. Docker reads the first key as `﻿POSTGRES_PASSWORD`, which
 *        is not `POSTGRES_PASSWORD`, and reports it missing.
 *
 * An error that points at the wrong thing costs an hour. This points at the
 * right thing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const fs = require('fs');
const path = require('path');

// 🔴 The .env lives HERE, in platform/, beside the compose file that reads it.
// It briefly lived at the repository root and the paths disagreed with the
// directory you were standing in. A path that depends on where you are
// standing is a bug waiting for a Tuesday.
const ROOT = __dirname;
const ENV = path.join(ROOT, '.env');

const RED = '\x1b[31m', GREEN = '\x1b[32m', YEL = '\x1b[33m', OFF = '\x1b[0m', BOLD = '\x1b[1m';
const problems = [];
const notes = [];

console.log(`\n${BOLD}Selah — preflight${OFF}\n`);

// ── 1. Does the file exist AT ALL, and is it called the right thing? ─────────
if (!fs.existsSync(ENV)) {
  problems.push('There is no `.env` file in platform/.');

  // 🔑 The Windows trap. Look for what they PROBABLY made.
  const lookalikes = fs.readdirSync(ROOT).filter((f) =>
    /^\.?env(\.txt|\.example|\.local|\.env)?$/i.test(f) && f !== '.env');
  if (lookalikes.length) {
    problems.push(`But these ARE here: ${lookalikes.map((f) => `\`${f}\``).join(', ')}`);
    if (lookalikes.some((f) => /\.txt$/i.test(f))) {
      problems.push('🔴 `.env.txt` is the Windows trap. Explorer HIDES known extensions, so Notepad saved ".env" as ".env.txt" and it looks correct in the folder. Rename it to exactly `.env`, with no extension.');
      problems.push('   In PowerShell:   Rename-Item .env.txt .env');
    }
  }
  report();
}

// ── 2. A BOM? Docker will read the first key name with an invisible character. ──
const raw = fs.readFileSync(ENV);
if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) {
  problems.push('🔴 Your `.env` starts with a UTF-8 BOM — an invisible marker that PowerShell adds by default.');
  problems.push('   Docker reads your first key as "\\uFEFFPOSTGRES_PASSWORD", which is NOT "POSTGRES_PASSWORD", and reports it missing.');
  problems.push('   This is why the error named a variable you had definitely set.');
  problems.push('   Fix, in PowerShell:');
  problems.push('     $c = Get-Content .env -Raw');
  problems.push('     [IO.File]::WriteAllText("$PWD\\.env", $c, (New-Object Text.UTF8Encoding $false))');
}

// ── 3. Parse it the way Docker does. ─────────────────────────────────────────
const text = raw.toString('utf8').replace(/^﻿/, '');
const env = {};
text.split(/\r?\n/).forEach((line, i) => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('=');
  if (eq < 0) { notes.push(`line ${i + 1}: no "=" — ignored: ${JSON.stringify(t.slice(0, 40))}`); return; }
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 DO NOT GUESS WHAT DOCKER DOES WITH AN INLINE COMMENT. FORBID IT.
  //
  // This line used to read:
  //
  //     // Docker strips a trailing inline comment only when preceded by whitespace.
  //     const c = v.search(/\s#/);
  //     if (c >= 0) v = v.slice(0, c).trim();
  //
  // That is an ASSUMPTION about another program's parser, and it was WRONG.
  //
  // A .env with:
  //
  //     SELAH_INDEX_KEY=b71c...   # 64 hex characters (a DIFFERENT one)
  //
  // was read by THIS script as a clean 64-hex key — ✓, green, ready — and by
  // DOCKER COMPOSE as a 107-character string containing '#', '(' and a tab. The
  // API then crash-looped on boot, nginx returned 504 GATEWAY TIMEOUT, and the
  // user spent the afternoon looking at the network.
  //
  // Preflight said READY. The container said dead. A guard that parses a file
  // differently from the thing that consumes it is not a guard — it is a second
  // opinion, and it is the wrong one.
  //
  // We cannot make Docker's parser match ours. So we REFUSE THE AMBIGUITY: if a
  // value contains a '#' at all, we stop and say so. There is no case where a
  // comment on a secret line is worth this.
  // ═══════════════════════════════════════════════════════════════════════════
  if (v.includes('#')) {
    problems.push(
      `🔴 line ${i + 1}: ${k} has a '#' in its value — probably a trailing comment.\n` +
      `     THIS SCRIPT would strip it. DOCKER COMPOSE DID NOT, and the container died on boot\n` +
      `     with a 107-character "key". Put the comment on its OWN LINE above, or delete it.\n` +
      `     Write:   ${k}=<value>          NOT:   ${k}=<value>   # a note`
    );
  }
  if (/^(SELAH_|POSTGRES_)/.test(k) && /\s/.test(v)) {
    problems.push(`🔴 line ${i + 1}: ${k} contains whitespace. A key or password with a space in it is almost always a paste accident.`);
  }
  if (/^["']|["']$/.test(v)) {
    problems.push(`🔴 line ${i + 1}: ${k} is wrapped in quotes. Docker Compose keeps them as part of the value. Remove them.`);
  }

  v = v.replace(/^["']|["']$/g, '');
  env[k] = v;
});

// ── 4. The things that must be true. ─────────────────────────────────────────
const need = {
  POSTGRES_PASSWORD:    (v) => v && v !== 'change-me' || 'missing, or still the placeholder "change-me"',
  SELAH_ENCRYPTION_KEY: (v) => /^[0-9a-f]{64}$/i.test(v) || 'must be 64 hex characters — run: openssl rand -hex 32',
  SELAH_INDEX_KEY:      (v) => /^[0-9a-f]{64}$/i.test(v) || 'must be 64 hex characters — run: openssl rand -hex 32 (a DIFFERENT one)',
};

for (const [k, check] of Object.entries(need)) {
  const r = check(env[k] || '');
  if (r === true) console.log(`  ${GREEN}✓${OFF} ${k}`);
  else problems.push(`${k}: ${r}`);
}

if (env.SELAH_ENCRYPTION_KEY && env.SELAH_ENCRYPTION_KEY === env.SELAH_INDEX_KEY) {
  problems.push('🔴 SELAH_ENCRYPTION_KEY and SELAH_INDEX_KEY are THE SAME. They must be different keys — the whole point of the blind index is that compromising one does not compromise the other.');
}

// ═════════════════════════════════════════════════════════════════════════════
// 🔴🔴 THE PDPO CHECK. THIS IS THE MOST IMPORTANT THING THIS SCRIPT DOES.
//
// A founder, at 1am, with Docker refusing to start, will fill in every empty
// variable in the .env to make the error go away. That is not carelessness — it
// is what any reasonable person does when a config file has blanks in it.
//
// AND IT DISARMS THE ONE GATE PROTECTING HIM PERSONALLY.
//
// It happened. The .env came back with a 4-character "registration number" and a
// 5-character "DPO name", and the server would have started storing Ugandans'
// payslips believing it was a registered data controller.
//
// So: we do not just check that these are SET. We check whether they are
// PLAUSIBLE, and we shout if they are not.
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// SEED_ADMIN — catch a login you will never be able to use, BEFORE docker starts.
//
// 🔴 A SEED_ADMIN_PASSWORD under 10 characters is SILENTLY REFUSED by the seed at
//    boot — the account is never created, and the only symptom, hours later, is
//    "that email and password do not match an account". The error was in the boot
//    log all along, buried. So we catch it HERE, where you will actually see it.
//
//    10 is the same minimum every real user's password must clear. A seeded login
//    is permanent; it deserves at least that.
// ═════════════════════════════════════════════════════════════════════════════
const SEED_PW_MIN = 10;
if (env.SEED_ADMIN_EMAIL || env.SEED_ADMIN_PASSWORD) {
  if (!env.SEED_ADMIN_EMAIL) {
    problems.push('🔴 SEED_ADMIN_PASSWORD is set but SEED_ADMIN_EMAIL is missing. No admin would be created.');
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(env.SEED_ADMIN_EMAIL)) {
    problems.push(`🔴 SEED_ADMIN_EMAIL is "${env.SEED_ADMIN_EMAIL}" — that is not an email address. No admin would be created.`);
  }
  if (!env.SEED_ADMIN_PASSWORD) {
    // email set, no password → the seed generates a random one and prints it. Fine, but say so.
    problems.push('ℹ️  SEED_ADMIN_PASSWORD is empty. The seed will GENERATE a strong password and print it ONCE in `docker compose logs api`. Set a password if you want to choose your own.');
  } else if (env.SEED_ADMIN_PASSWORD.length < SEED_PW_MIN) {
    problems.push(`🔴 SEED_ADMIN_PASSWORD is ${env.SEED_ADMIN_PASSWORD.length} characters. It MUST be at least ${SEED_PW_MIN}.`);
    problems.push(`   A shorter password is SILENTLY REFUSED at boot: the admin is never created, and login later says "email and password do not match". This is the single most common reason a seeded admin does not work.`);
  }
}

const pdpo = ['PDPO_REGISTRATION_NUMBER', 'PDPO_REGISTERED_ON', 'DPO_NAME', 'DPO_EMAIL'];
const setCount = pdpo.filter((k) => env[k]).length;

console.log('');

// Does it LOOK like someone typed junk to silence an error?
const looksFake = [];
if (env.PDPO_REGISTRATION_NUMBER && env.PDPO_REGISTRATION_NUMBER.length < 8) {
  looksFake.push(`PDPO_REGISTRATION_NUMBER is ${env.PDPO_REGISTRATION_NUMBER.length} characters. A real PDPO registration number is not that short.`);
}
if (env.PDPO_REGISTERED_ON && !/^\d{4}-\d{2}-\d{2}$/.test(env.PDPO_REGISTERED_ON)) {
  looksFake.push(`PDPO_REGISTERED_ON is "${env.PDPO_REGISTERED_ON}" — it must be the date on the certificate, as YYYY-MM-DD.`);
}
if (env.DPO_EMAIL && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(env.DPO_EMAIL)) {
  looksFake.push(`DPO_EMAIL is "${env.DPO_EMAIL}" — that is not an email address a data subject could reach anyone at.`);
}
if (env.DPO_NAME && /^(.)\1+$/.test(env.DPO_NAME.trim())) {
  looksFake.push(`DPO_NAME is "${env.DPO_NAME}" — it must be a real, whole human name. Not a title. Not "the team".`);
}

if (looksFake.length) {
  problems.push('');
  problems.push(`${RED}${BOLD}🔴🔴 STOP. YOUR .env CLAIMS YOU ARE REGISTERED WITH THE PDPO, AND IT DOES NOT LOOK TRUE.${OFF}`);
  looksFake.forEach((f) => problems.push(`     · ${f}`));
  problems.push('');
  problems.push('   If these were filled in to make an error go away — DELETE THEM. Leave all four EMPTY.');
  problems.push('');
  problems.push(`   ${BOLD}These four variables are not configuration. They are a legal declaration.${OFF}`);
  problems.push('   With them set, this server will store Ugandans\' payslips, TINs and phone');
  problems.push('   numbers, believing it is lawfully allowed to.');
  problems.push('');
  problems.push('   Uganda\'s DPPA s.9(1): financial data is SPECIAL PERSONAL DATA — processing is');
  problems.push('   PROHIBITED BY DEFAULT. On 10 July 2025 a digital lender\'s DIRECTOR was');
  problems.push('   PERSONALLY CONVICTED for failing to register. Not the company. The director.');
  problems.push('');
  problems.push(`   ${BOLD}Filling these in does not make you compliant. It removes the one thing${OFF}`);
  problems.push(`   ${BOLD}standing between you and that outcome: the fact that the software would not let you.${OFF}`);
  problems.push('');
} else if (setCount === 0) {
  console.log(`  ${YEL}○${OFF} PDPO: not registered — ${BOLD}and that is correct if you are not.${OFF}`);
  console.log(`      Every endpoint that would store a payslip, a TIN, a phone number or an`);
  console.log(`      invoice returns HTTP 451. ${BOLD}That is not an error to make go away.${OFF}`);
  console.log(`      The calculators work and store nothing. They never did.`);
} else if (setCount === 4) {
  console.log(`  ${GREEN}✓${OFF} PDPO: registered — ${BOLD}personal data endpoints will be LIVE.${OFF}`);
  console.log(`      registration : ${env.PDPO_REGISTRATION_NUMBER}`);
  console.log(`      DPO          : ${env.DPO_NAME} <${env.DPO_EMAIL}>`);
  console.log('');
  console.log(`      ${BOLD}Only leave these set if the certificate is genuinely in your hand.${OFF}`);
} else {
  problems.push(`🔴 PDPO: ${setCount} of 4 variables set. That is not registration — it is half a registration, and the server will (correctly) still refuse.`);
  problems.push(`   Missing: ${pdpo.filter((k) => !env[k]).join(', ')}`);
  problems.push('   A registration number with no reachable Data Protection Officer is not a registration.');
  problems.push('   If you set these to silence an error: DELETE ALL FOUR.');
}

report();

function report() {
  console.log('');
  if (notes.length) { notes.forEach((n) => console.log(`  ${YEL}·${OFF} ${n}`)); console.log(''); }

  if (!problems.length) {
    console.log(`${GREEN}${BOLD}  ✓ Ready. Run:  docker compose up --build   (from platform/)${OFF}\n`);
    process.exit(0);
  }

  console.log(`${RED}${BOLD}  ✗ Not ready.${OFF}\n`);
  problems.forEach((p) => console.log(`    ${p}`));
  console.log('');
  console.log(`  Docker's own error for this points at a VARIABLE. The problem is usually the FILE.`);
  console.log('');
  process.exit(1);
}
