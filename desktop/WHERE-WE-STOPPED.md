# Selah Desktop — where we stopped (paused to finish the webapp)

## Done and verified
- `platform/` renamed to `webapp/`. All 1,225 webapp tests still green.
  (An empty `platform/` folder lingers — the mount wouldn't let me delete it. Remove manually.)
- Monorepo: `webapp/` (web) + `desktop/` (Electron), one shared engine.
- `desktop/sync.js` copies `webapp/engine` (verbatim, with tests) and `webapp/web`
  (the calculators) into `desktop/`. Engine authored ONCE in webapp; never forked.
- THE VAULT — `desktop/lib/store.js`: on-device AES-256-GCM store, scrypt key from a
  passphrase (never stored), atomic writes, wrong passphrase LOCKS (never blanks).
  9 tests passing (`lib/store.test.js`).
- Electron shell: `main.js` (IPC to vault), `preload.js` (narrow bridge,
  contextIsolation on / nodeIntegration off), `renderer/home.html` (passphrase gate →
  3 doors: Calculators, Individual, Organisation). Calculators work offline (proven).
- Executables configured (electron-builder): win nsis+portable, mac dmg,
  linux AppImage+deb. Scripts `npm run dist:win|mac|linux`. Icon at build/icon.png
  (placeholder; user will supply a real one).
- `.github/workflows/desktop.yml` builds all 3 OSes on a `v*` tag.

## NOT done — the next desktop step when we return
- Port the FULL individual suite (Books, accounts, budget, calendar, forecast) from the
  web front-end onto `window.selah.store` (the vault) instead of HTTP `/api`.
  `renderer/suite-individual.html` is only a minimal offline Books demo right now.
- Same for the organisation suite (`suite-organisation.html` is a copy of individual).
- Wire offline personal analytics (engine has forecast.js).
- User will supply a real app icon to replace build/icon.png.

## Constraint
- The binary CANNOT be built in the sandbox — run `npm run dist` on a real OS, or the CI.
