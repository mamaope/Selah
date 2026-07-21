# Selah Desktop

Uganda's tax and money tools, **offline**. No account, no server, no internet —
and the data never leaves the machine.

## Why a desktop app at all

The web platform (`../webapp`) holds data on a server, behind the PDPO gate,
because a server that holds special personal data is a **data controller** under
Uganda's DPPA. The desktop app takes the other road: everything lives in a single
**encrypted vault** on the user's own computer. There is no server to breach and
nothing held on anyone's behalf — the privacy problem is designed out, not managed.

## What it shares with the web app

- **The engine** — the exact same zero-dependency tax engine, copied verbatim from
  `webapp/engine` by `sync.js`. A Ugandan tax rule can never be right in one app and
  wrong in the other. `npm test` re-runs the engine's own suite against the copy.
- **The calculators** — the web calculator centre runs offline as-is; it never
  needed a server.

## What is different

| | Web (`webapp/`) | Desktop (`desktop/`) |
|---|---|---|
| Data | Postgres, on a server | Encrypted vault, on the machine |
| Auth | email + password + PDPO gate | one passphrase, on the device |
| Key | env-provided, server-side | derived from the passphrase, never stored |
| Analytics | personal **+** cross-household aggregate | personal only (your own patterns) |
| Network | required | **none** |

## Run it (on a machine with a display)

```
cd desktop
npm install          # pulls electron
npm start            # syncs the engine, then launches
```

First launch asks you to **set a passphrase**. That passphrase is the only key to
your data — there is no reset. Lose it and the vault cannot be opened, which is the
price of nobody but you ever reading it.

## Test it (no display needed)

```
npm test             # the vault, plus the engine suite re-run against the synced copy
```

## Package the executables

You get an **installer** and a **portable** build. macOS can only be built on a Mac,
Windows on Windows, Linux on Linux — so pick the path that fits what you have.

### On your own machine (builds for THAT OS)
```
npm install
npm run dist            # builds for whatever OS you are on → desktop/dist/
# or force a target:
npm run dist:win        # Windows: Selah-Setup-1.0.0.exe  +  Selah-1.0.0-portable.exe
npm run dist:mac        # macOS:   Selah-1.0.0.dmg          (must run on a Mac)
npm run dist:linux      # Linux:   Selah-1.0.0.AppImage + .deb
```
The finished executables land in **`desktop/dist/`**.

### All three at once (no Mac required) — GitHub Actions
`.github/workflows/desktop.yml` builds Windows, macOS **and** Linux on a tag:
```
git tag v1.0.0
git push origin v1.0.0
```
The three OSes build in parallel and the executables attach to a GitHub Release.
This is the only way to get the `.dmg` if you do not own a Mac.

### The icon
Replace `build/icon.png` with your logo (≥512×512 PNG). See `build/README.md`.

> Note: this environment cannot produce the binary — a desktop executable must be
> built on a real OS. The configuration above makes `npm run dist` do it in one step.

## The vault

`selah.vault` lives in the OS user-data directory. It is AES-256-GCM, keyed by
scrypt from your passphrase, written atomically (temp-file + rename, so a crash
never corrupts it). A wrong passphrase **locks** — it never returns a blank store,
because a blank store would invite you to overwrite data that is still there.
Copy the file and your whole financial life moves with it; delete it and it is gone.
