# Selah — two apps, one engine

```
Selah Solutions/
├── engine  … authored inside webapp/engine (the single source of truth)
├── webapp/     the WEB platform   (was: platform/)
│                 nginx + Node/Express + Postgres, behind the PDPO gate.
│                 Online. Personal + cross-household aggregate analytics.
└── desktop/    the DESKTOP app    (Electron)
                  Offline. Data in an on-device encrypted vault.
                  Individual + Organisation suites, their calculators, personal analytics.
                  The engine and calculators are SYNCED from webapp/ (sync.js) — never forked.
```

**The rule that ties them together:** the tax engine is written and tested once, in
`webapp/engine`. The desktop app copies it verbatim and re-runs its tests against the
copy. Neither app may hold a Ugandan tax figure the other disagrees with.

**Why desktop is offline-first:** a server holding financial data is a DPPA data
controller. A vault on the user's own machine is not. Same tools, the privacy
problem designed out.
