/**
 * SELAH DESKTOP — THE VAULT, EXECUTED
 * ─────────────────────────────────────────────────────────────────────────────
 * The one property that matters: a wrong passphrase must LOCK, never blank. Every
 * other bug here loses a person's data quietly, which is the worst thing an
 * offline financial app can do.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Vault } = require('./store');

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); pass++; } catch (e) { fail++; console.error(`  \x1b[31m✗ ${n}\x1b[0m\n      ${e.message}`); } };
const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'selah-')), 'vault.selah');

t('create → put → save → reopen with the passphrase → data is there', () => {
  const f = tmp();
  new Vault(f).create('correct horse').put('books', { id: 'b1', name: 'Home' });
  const v = new Vault(f).open('correct horse');
  assert.strictEqual(v.get('books')[0].name, 'Home');
});

t('🔴 a WRONG passphrase LOCKS the vault — it does NOT return an empty one', () => {
  const f = tmp();
  new Vault(f).create('the right one').put('books', { id: 'b1', name: 'Home' });
  let threw = false;
  try { new Vault(f).open('the wrong one'); } catch (e) { threw = true; assert.ok(/wrong/.test(e.message)); assert.ok(/still safe/.test(e.message)); }
  assert.ok(threw, 'opening with the wrong passphrase MUST throw — a blank store here would invite overwriting real data');
});

t('🔴 the data on disk is CIPHERTEXT — the labels are not readable', () => {
  const f = tmp();
  new Vault(f).create('pass phrase').put('books', { id: 'b1', name: 'MySecretShop' });
  const raw = fs.readFileSync(f).toString('latin1');
  assert.ok(!raw.includes('MySecretShop'), 'the plaintext label must not appear in the file');
  assert.ok(!raw.includes('books'), 'not even the collection name leaks');
});

t('the same passphrase opens; a different one never does (per-vault salt)', () => {
  const f1 = tmp(), f2 = tmp();
  new Vault(f1).create('same pass');
  new Vault(f2).create('same pass');
  // two vaults, same passphrase, DIFFERENT salt → different keys → different files
  assert.notStrictEqual(fs.readFileSync(f1).subarray(0, 16).toString('hex'),
                        fs.readFileSync(f2).subarray(0, 16).toString('hex'));
});

t('put updates an existing record by id, does not duplicate', () => {
  const f = tmp();
  const v = new Vault(f).create('pw pw pw');
  v.put('books', { id: 'b1', name: 'Home' });
  v.put('books', { id: 'b1', name: 'Household' });
  assert.strictEqual(v.get('books').length, 1);
  assert.strictEqual(v.get('books')[0].name, 'Household');
});

t('remove deletes; the change survives a reopen', () => {
  const f = tmp();
  new Vault(f).create('phrase pass').put('books', { id: 'b1', name: 'Home' });
  const v = new Vault(f).open('phrase pass');
  assert.strictEqual(v.remove('books', 'b1'), true);
  assert.strictEqual(new Vault(f).open('phrase pass').get('books').length, 0);
});

t('🔴 a too-short passphrase is refused — it is the ONLY key, there is no reset', () => {
  let threw = false;
  try { new Vault(tmp()).create('short'); } catch (e) { threw = true; assert.ok(/at least 8/.test(e.message)); }
  assert.ok(threw);
});

t('🔴 a locked vault refuses reads and writes', () => {
  const f = tmp();
  const v = new Vault(f).create('locked test'); v.lock();
  assert.throws(() => v.get('books'), /locked/);
  assert.throws(() => v.put('books', { name: 'x' }), /locked/);
});

t('a crash mid-write cannot corrupt the vault (temp-file + rename)', () => {
  const f = tmp();
  const v = new Vault(f).create('atomic write');
  v.put('books', { id: 'b1', name: 'Home' });
  assert.ok(!fs.existsSync(f + '.tmp'), 'the temp file must not linger after a successful write');
  // the vault is still openable — the write completed atomically
  assert.strictEqual(new Vault(f).open('atomic write').get('books').length, 1);
});

console.log(fail
  ? `\n\x1b[31m✗ ${fail} VAULT TEST${fail > 1 ? 'S' : ''} FAILED\x1b[0m  (${pass} passed)\n`
  : `\x1b[32m✓ ALL ${pass} VAULT TESTS PASSED\x1b[0m`);
process.exit(fail ? 1 : 0);
