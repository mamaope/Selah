/**
 * SELAH DESKTOP — MAIN PROCESS
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 OFFLINE, AND MEANT TO STAY THAT WAY.
 *
 * There is no server, no fetch, no telemetry. The window loads local files only.
 * The vault lives in the OS user-data directory and is opened with the user's
 * passphrase. The renderer never touches the filesystem or the key directly — it
 * asks the main process over a NARROW, audited IPC surface (see preload.js).
 * ─────────────────────────────────────────────────────────────────────────────
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Vault } = require('./lib/store');

let vault = null;
const vaultFile = () => path.join(app.getPath('userData'), 'selah.vault');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 780, minWidth: 720,
    title: 'Selah',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,      // 🔴 the renderer cannot reach Node directly
      nodeIntegration: false,      // 🔴 no require() in the page
      sandbox: true,
    },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'renderer', 'home.html'));
}

// ── the vault IPC surface — the ONLY way the UI reaches the data ─────────────
ipcMain.handle('vault:status', () => ({ exists: new Vault(vaultFile()).exists(), open: Boolean(vault && vault.key) }));

ipcMain.handle('vault:create', (_e, passphrase) => {
  vault = new Vault(vaultFile()).create(passphrase);
  return { ok: true };
});

ipcMain.handle('vault:open', (_e, passphrase) => {
  try { vault = new Vault(vaultFile()).open(passphrase); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }   // wrong passphrase → locked, said in words
});

ipcMain.handle('vault:lock', () => { if (vault) vault.lock(); vault = null; return { ok: true }; });

const need = () => { if (!vault || !vault.key) throw new Error('The vault is locked.'); };
ipcMain.handle('store:get',    (_e, c)     => { need(); return vault.get(c); });
ipcMain.handle('store:put',    (_e, c, it) => { need(); return vault.put(c, it); });
ipcMain.handle('store:remove', (_e, c, id) => { need(); return vault.remove(c, id); });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (vault) vault.lock(); app.quit(); });
