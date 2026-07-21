/**
 * SELAH DESKTOP — THE ON-DEVICE ENCRYPTED VAULT
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔑 THE WHOLE POINT: THE DATA NEVER LEAVES THE MACHINE.
 *
 * The web platform holds a Ugandan's financial data on a server, behind the PDPO
 * gate — because a server that holds special personal data is a data controller,
 * and Uganda's DPPA regulates that heavily (a director was personally CONVICTED on
 * 10 July 2025 for failing to register). This desktop app takes the other road:
 * the data lives in a single ENCRYPTED FILE on the user's own computer, and no
 * byte of it is ever transmitted anywhere. There is no server to breach, no gate
 * to register — because there is nothing held on anyone's behalf.
 *
 * 🔴 THE KEY IS NEVER STORED. It is derived, every time the app opens, from a
 *    passphrase only the user knows (scrypt → AES-256-GCM). Lose the passphrase and
 *    the data is unrecoverable — which is the correct trade for "nobody but you can
 *    ever read it", and it is stated plainly to the user on setup.
 *
 * 🔴 A WRONG PASSPHRASE DOES NOT "return empty". GCM authentication FAILS, and we
 *    surface that as a locked vault — never as a fresh, blank one, which would
 *    invite a user to overwrite their real, still-encrypted data.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MAGIC = 'SELAH-VAULT-1';
const N = 32768, R = 8, P = 1, KEYLEN = 32;     // scrypt: ~32MB, deliberate

function deriveKey(passphrase, salt) {
  return crypto.scryptSync(String(passphrase), salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
}

class Vault {
  constructor(file) { this.file = file; this.key = null; this.data = null; }

  exists() { try { return fs.statSync(this.file).isFile(); } catch { return false; } }

  /** First run: choose a passphrase, create an empty encrypted vault. */
  create(passphrase) {
    if (this.exists()) throw new Error('A vault already exists here.');
    if (String(passphrase || '').length < 8) throw new Error('Choose a passphrase of at least 8 characters. It is the ONLY key to your data — there is no reset.');
    const salt = crypto.randomBytes(16);
    this.key = deriveKey(passphrase, salt);
    this.salt = salt;
    this.data = { magic: MAGIC, collections: {}, createdAt: new Date().toISOString() };
    this._write();
    return this;
  }

  /** Later runs: open with the passphrase. Wrong passphrase → throws, never blank. */
  open(passphrase) {
    if (!this.exists()) throw new Error('No vault here yet.');
    const raw = fs.readFileSync(this.file);
    // layout: salt(16) | iv(12) | tag(16) | ciphertext
    const salt = raw.subarray(0, 16), iv = raw.subarray(16, 28), tag = raw.subarray(28, 44), ct = raw.subarray(44);
    this.salt = salt;
    this.key = deriveKey(passphrase, salt);
    let plain;
    try {
      const d = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      d.setAuthTag(tag);
      plain = Buffer.concat([d.update(ct), d.final()]);
    } catch (e) {
      // 🔴 GCM said the key/data do not authenticate. That is a LOCKED vault, not an
      //    empty one. Do NOT hand back a blank store — the real data is still here.
      this.key = null;
      throw new Error('That passphrase is wrong. Your data is still safe and still encrypted — try again.');
    }
    const obj = JSON.parse(plain.toString('utf8'));
    if (obj.magic !== MAGIC) throw new Error('This file is not a Selah vault.');
    this.data = obj;
    return this;
  }

  _requireOpen() { if (!this.key || !this.data) throw new Error('The vault is locked. Open it first.'); }

  _write() {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const ct = Buffer.concat([c.update(Buffer.from(JSON.stringify(this.data), 'utf8')), c.final()]);
    const out = Buffer.concat([this.salt, iv, c.getAuthTag(), ct]);
    // write to a temp file then rename — a crash mid-write must never corrupt the vault
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, out);
    fs.renameSync(tmp, this.file);
  }

  // ── a tiny document API the suites talk to, instead of the server's SQL ──────
  get(collection) { this._requireOpen(); return (this.data.collections[collection] || []).slice(); }

  put(collection, item) {
    this._requireOpen();
    const list = this.data.collections[collection] || (this.data.collections[collection] = []);
    const rec = { id: item.id || crypto.randomUUID(), ...item };
    const i = list.findIndex((x) => x.id === rec.id);
    if (i >= 0) list[i] = rec; else list.push(rec);
    this._write();
    return rec;
  }

  remove(collection, id) {
    this._requireOpen();
    const list = this.data.collections[collection] || [];
    const before = list.length;
    this.data.collections[collection] = list.filter((x) => x.id !== id);
    this._write();
    return before !== this.data.collections[collection].length;
  }

  lock() { this.key = null; this.data = null; }
}

module.exports = { Vault, deriveKey };
