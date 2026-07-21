/**
 * SELAH DESKTOP — PRELOAD (the bridge)
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE ONLY DOOR BETWEEN THE PAGE AND THE MACHINE.
 *
 * contextIsolation is on and nodeIntegration is off, so the renderer has no Node.
 * This exposes a SMALL, FIXED surface — open the vault, read/write collections —
 * and nothing else. The page cannot read the filesystem, cannot see the key, and
 * cannot reach the network (there is none). A financial app that gives its own web
 * page raw filesystem access is one XSS away from handing over the vault.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('selah', {
  offline: true,
  vault: {
    status:  ()   => ipcRenderer.invoke('vault:status'),
    create:  (p)  => ipcRenderer.invoke('vault:create', p),
    open:    (p)  => ipcRenderer.invoke('vault:open', p),
    lock:    ()   => ipcRenderer.invoke('vault:lock'),
  },
  store: {
    get:    (c)      => ipcRenderer.invoke('store:get', c),
    put:    (c, it)  => ipcRenderer.invoke('store:put', c, it),
    remove: (c, id)  => ipcRenderer.invoke('store:remove', c, id),
  },
});
