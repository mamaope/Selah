# Selah — Architecture & Tech Stack

**The decisions, the reasons, and the ones I'd argue about.**

*Version 1 · 11 July 2026*

---

## 0. The one principle everything else follows from

> ### The engine is a package. Everything else is a consumer.

`rules.js` + `engine.js` have **zero dependencies**. They run in Node, in a browser, in a test, in a Lambda, in a future mobile app, in a spreadsheet macro if it comes to that.

**Nothing may ever import a framework into the engine.** Not React, not Next, not an ORM, not a date library. The moment the engine depends on a framework, it stops being an asset and becomes part of an app — and apps get rewritten.

**The engine will outlive three rewrites of the UI. Build it so it can.**

```
                    ┌──────────────────────────────┐
                    │   @selah/engine              │
                    │   rules · traces · zero deps │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────┬───────────┴──────┬──────────────┐
        ▼              ▼                  ▼              ▼
   calculators     individual        organisation      tests
   (public)        (login)           (login)           (CI)
```

---

## 1. The phases — and what each one is allowed to add

**One rule: a phase may not ship until the phase before it is boring.**

| | Phase | What it needs that the last one didn't | Gate to start |
|---|---|---|---|
| **1** | 🟢 **The Calculators** *(built)* | Nothing. Static files. | — |
| **2** | 🔴 **For individuals** | **Auth. A database. Personal data.** | 🔴 **PDPO registration + a DPO.** Not negotiable. |
| **3** | 🔴 **For organisations** | **Multi-tenancy. The registry. The ledger. Documents.** | 🔴 **The Accountants Act opinion.** If bookkeeping by a limited company is unlawful, Phase 3 has a different shape. |

> 🔴 **Both gates are legal, not technical.** No amount of good engineering gets past them, and building ahead of them is building something we may not be allowed to run.

---

## 2. Phase 1 — what's built, and why it stays as it is

**Vanilla HTML/CSS/JS. nginx. No framework. No build step beyond one 30-line script.**

**This is not laziness. It is the right answer for this phase:**

- **Uganda.** A cheap Android phone on 3G in Kampala. **100KB total.** A React+Next bundle is 5–10× that before a single line of our code.
- **SEO is the funnel.** These pages must be crawlable, instantly, with no JS execution. Static HTML is the best possible answer to that, not a compromise.
- **Zero dependencies = zero supply-chain surface** for a product that will hold tax data.
- **It works.** 101 engine tests, 24 UI tests, green.

**Do not rewrite working code for aesthetics.**

```
platform/
├── engine/                 ← THE ASSET. Zero deps. Never touches a framework.
│   ├── rules.js            ← Uganda's tax law. Versioned, sourced, dated.
│   ├── engine.js           ← Computes. Returns a TRACE, never a bare number.
│   ├── applicability.js    ← "Which taxes apply to ME?" — the front door.
│   └── engine.test.js      ← 101 assertions. Runs INSIDE the Docker build.
├── web/
│   ├── index.html          ← Home
│   ├── calculators.html    ← The guide + the working
│   ├── individual.html     ← Phase 2 — waiting list
│   ├── organisation.html   ← Phase 3 — waiting list
│   └── assets/
│       ├── tokens.css      ← Brand v2. Single source of truth.
│       ├── home.css
│       ├── calculators.js  ← RENDERS traces. Never produces them.
│       └── engine.bundle.js ← GENERATED from engine/. Same code the tests ran.
├── build.js                ← engine/ → web/assets/engine.bundle.js
├── Dockerfile              ← verify → build → serve. Tests run IN the build.
├── docker-compose.yml
└── nginx.conf
```

---

## 3. 🔴 The trigger — when Phase 1's stack breaks

**Vanilla is right *now*. It will be wrong the moment any of these happen:**

| Trigger | Why it breaks |
|---|---|
| **We ship the 53 calculators as separate SEO pages** | 53 hand-written HTML files is not maintainable. We need a generator. |
| **We add authentication** | Sessions, tokens, protected routes. Hand-rolling auth is how you get breached. |
| **We add a database** | Server-side rendering, data fetching, migrations. |
| **A second engineer joins** | Vanilla with no types is fine for one person who wrote it. It is hostile to the second. |

> **When ANY of those lands, we move. Not before.** Rewriting ahead of a trigger is the most expensive form of procrastination.

---

## 4. The stack we move TO — decided now, adopted later

### The recommendation

| Layer | Choice | Why this and not the obvious alternative |
|---|---|---|
| **Monorepo** | **pnpm workspaces** | Turborepo adds caching we don't need yet. pnpm is enough, and it's one file. |
| **The engine** | **TypeScript, zero runtime deps**, published as `@selah/engine` | 🔑 **Type the TRACE.** The trace shape is the contract between the engine, the UI, the API, the audit log and the PDF renderer. Get it wrong and everything downstream drifts. This is the single highest-value migration in the list. |
| **Web** | **Next.js (App Router)** | **SSG for the calculators** — they're the SEO funnel and must be static HTML. **RSC for the logged-in product** — less JS shipped to a cheap phone. One framework covering both is genuinely rare, and it's the reason to pick it. |
| **Database** | **PostgreSQL** | 🔑 The core object is a **graph**: taxpayer → director-of → entity → employs → person → associate-of → relative. That is *inherently relational*. A document store would model it badly. Postgres also gives us **row-level security** (per-taxpayer isolation) and **append-only audit tables** — both of which we need for TPCA s.17. |
| **ORM** | **Drizzle** | Prisma's engine is a separate binary and its migrations fight you at scale. Drizzle is typed SQL — you can read the query it will run, which matters when the query is about someone's tax. |
| **Auth** | **Phone-first OTP** | 🔴 **Uganda. Email is not the primary identity — a phone number is.** Any stack that assumes email-first is designed for somewhere else. |
| **Hosting** | **Containers, region-flexible** | We already have a Dockerfile. **Do not lock into a serverless platform.** Latency to Kampala matters, and so does the freedom to move if a regulator asks where the data lives. |
| **Background jobs** | **Postgres-backed queue** (pg-boss or similar) | Deadline reminders, certificate chasing, ledger reconciliation. **Do not add Redis for a job queue you can run in the database you already have.** |

### 🔴 What we deliberately do NOT use

| | Why not |
|---|---|
| **A NoSQL primary store** | The registry is a graph of relationships and the ledger is double-entry. Both are relational. Choosing Mongo here is choosing to write joins by hand, forever. |
| **A serverless-only platform** | Cold starts on a 3G connection are a bad experience, and vendor lock-in is a bad answer to "where is Ugandan tax data stored?" |
| **An AI/LLM in the computation path** | 🔴 **Hard architectural rule.** An LLM may *phrase* a trace. It may **never produce one.** *(See `SELAH-EXPLAINABILITY-SPEC`.)* Delete the LLM and the reasoning must still be correct. |
| **A component library with a design system of its own** | We have a brand. Bringing in MUI or Chakra means fighting their tokens with ours. Tailwind + our own tokens, or plain CSS. |
| **Microservices** | We are one team building one product. A modular monolith with clean package boundaries gives us every benefit and none of the distributed-systems tax. |

---

## 5. Phase 2 — for individuals

**New capability: the product knows who you are, and remembers.**

### What gets built

| | |
|---|---|
| **The registry** *(minimum)* | `TAXPAYER` as root. An individual has a TIN, a residency status, an employer, and — crucially — **relationships**. |
| **Auth** | Phone OTP. |
| **The records vault** | 🔑 Documents with a **`MISSING`** state. **That one nullable field IS the product.** An engine that knows a WHT certificate *should exist* and does not — that is the whole of Radar, in one column. |
| **The obligations engine** | `applicability.js`, but running on real data and real dates, generating real reminders. |

### 🔴 The gate: data protection

**Uganda's DPPA s.9(1): financial data is SPECIAL personal data. Processing it is PROHIBITED BY DEFAULT.**

The gateway is **explicit, granular, unbundled, opt-in consent (s.9(3)(b))** — and the ordinary "legitimate interest" exceptions **do not carry across.**

**Required before a single phone number is stored:**
- 🔴 **PDPO registration.** *(A digital lender's director was personally CONVICTED on 10 July 2025 for failing to do this.)*
- 🔴 **A Data Protection Officer.** Mandatory — our core activity *is* processing special personal data.
- 🔴 **The consent architecture, built properly.** Per-taxpayer. Granular. Revocable.
- 🔴 **An append-only audit log** — every trace we ever showed a user, with the rule version it was computed under.

> **The waiting-list forms on `individual.html` and `organisation.html` deliberately store NOTHING and say so on the page.** That is not a placeholder we forgot to wire up. It is the correct behaviour until the gate is passed, and being honest about it is the brand.

---

## 6. Phase 3 — for organisations

**New capability: the entity, its people, its money, and the edges between them.**

| | |
|---|---|
| **The registry, fully** | `ENTITY` · `PERSON` · `RELATIONSHIP` — including **`associate-of` (which includes RELATIVES)** and **`related-party`** (s.115A: arm's-length obligation, **no de minimis**). |
| **The ledger** | Double-entry. **Needed by 11 of 13 modules.** The load-bearing foundation. |
| **Invoicing + EFRIS** | 🔑 **Every tax event in a business is born at an invoice.** EFRIS is the only automatable pipe URA offers, and it is the ledger's front door. |
| **Multi-tenancy** | **Postgres row-level security.** Not application-level filtering — one forgotten `WHERE` clause and you've leaked a competitor's payroll. |
| **The consolidated view** | 🔑 **The thing no accountant in Uganda does:** a person and all their entities, seen together. *"Your personal unfiled return is blocking your company's certificate."* |

### 🔴 The gate: the Accountants Act

**An ICPAU accounting firm must be a sole proprietorship or a partnership. A LIMITED COMPANY CANNOT HOLD THE LICENCE.**

If **bookkeeping** is a reserved activity, **Selah Solutions Ltd cannot cure it by getting licensed.** There is no licence available to us.

**That is a structural question, not a compliance checkbox, and it changes the shape of Phase 3.** Get the opinion before the schema.

*(Tax agency is unaffected — a company **can** be a registered tax agent. Radar, Optimise and the calculators are all safe.)*

---

## 7. Modularity — the boundaries that must not blur

**Four rules. Each exists because of a specific failure we already hit.**

| # | Rule | The failure it prevents |
|---|---|---|
| **1** | **The engine has zero dependencies, forever.** | It must run in a browser, a test, a server and a container. The moment it needs a framework, it stops being portable — and portability is why it's an asset. |
| **2** | **Renderers render. They never compute.** | Delete `calculators.js` and the reasoning must still be correct. **If an LLM ever produces a number instead of phrasing one, it will fluently use the old PAYE bands** — and be wrong in the way that's hardest to catch. |
| **3** | **Rules are immutable and superseded, never edited.** | A return filed for FY2025/26 must still compute under FY2025/26 law. Forever. |
| **4** | 🔴 **A malformed rule must not LOAD.** | We proved this the hard way. Reverting one threshold left a **silent gap** in the band table — the engine computed **zero tax** for everyone inside it, **and all 93 tests passed**, because they tested *points*, not the *table*. **Now the engine refuses to start.** You cannot ship a wrong number if the wrong number will not boot. |

---

## 8. What I'd argue about

**Stated honestly, so you can push back:**

1. **Next.js is a real bet.** It's the right one for SSG-plus-auth in one framework, but it is heavy, it churns, and it drags React into the stack. **The alternative** — Astro for the static calculators + a small Fastify API for the logged-in product — is leaner, faster on a cheap phone, and less fashionable. **If the team is small and unfamiliar with React, Astro is genuinely the better call.**

2. **TypeScript on the engine costs a migration.** It is worth it *only* because the **trace shape is the contract**. If you disagree that types are worth the friction, say so now — it's much cheaper to argue about this before the migration than after.

3. **I have not proposed a caching layer, a CDN, or a queue beyond Postgres.** That is deliberate. **Uganda's whole formal-sector taxpayer base is around 1.4 million.** We do not have a scale problem. **We have a correctness problem.** Every hour spent on scale is an hour not spent on being right — and being right is the entire product.

---

## 9. Right now

```bash
cd platform
node engine/engine.test.js     # 101 assertions
docker compose up --build      # → http://localhost:8080
```

| Page | Status |
|---|---|
| `index.html` | 🟢 **Home.** The argument, the four promises, the three doors. |
| `calculators.html` | 🟢 **Live.** The guide → your taxes → the working. |
| `individual.html` | 🔴 Phase 2. Waiting list. **Stores nothing, and says so.** |
| `organisation.html` | 🔴 Phase 3. Waiting list. **Stores nothing, and says so.** |

**The next thing to build is not code.** It is:

1. 🔴 **The Accountants Act opinion** — it decides the shape of Phase 3.
2. 🔴 **PDPO registration + a DPO** — it decides whether Phase 2 may start at all.
3. **The other 44 calculators** — Phase 1 is not finished, and it's the funnel for everything else.

> **Finish the calculators. Pass the gates. Then build the login.**
