# Selah — the platform

**Working code. Nine calculators, running on a versioned rules engine. 242 tests passing.**

*11 July 2026*

---

## Run it

**With Docker:**
```bash
docker compose up --build          # → http://localhost:8080
docker compose run --rm test       # the 242 tests, on their own
```

> **If the container dies on boot with `mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)`** — you have an old build cached. `docker compose build --no-cache`. See [Running as nobody](#running-as-nobody) below for why.

**Without:**
```bash
node engine/engine.test.js         # 242 tests
node build.js                      # rebuild the browser bundle
open web/index.html                # the calculator centre
```

No build tools. No framework. No runtime dependencies. **Open the HTML file.**

---

## 🔑 The tests run *inside* the Docker build

**If a single Ugandan tax rule is wrong, the image does not build.**

That is not CI theatre. It is the thesis, enforced by the compiler: **you cannot ship a wrong number, because a wrong number will not build.**

| Stage | What it does |
|---|---|
| **1 · verify** | Executes all 101 assertions. **Non-zero exit kills the build.** |
| **2 · build** | Generates the browser bundle **from the same source the tests just ran against**, then re-checks four figures and the refusal. **No drift between what we test and what we ship.** |
| **3 · serve** | nginx, unprivileged, read-only, 128MB, on port 8080. |

**And the healthcheck asks a tax question.** *"Is the port open"* is a useless healthcheck for this product — a container can serve a page beautifully while computing PAYE wrong. So it asks something only a working engine can answer:

```js
if (S.paye(1_000_000).result !== 188_250)        throw new Error('PAYE is wrong');
if (S.presumptive(65_000_000, true) !== 270_000) throw new Error('presumptive is wrong');
if (!S.paye(1_000_000, 'non-resident').refused)  throw new Error('we have started guessing');
```

**A container that starts guessing is not healthy. It is dangerous.**

---

## Running as nobody

The container is **read-only**, runs as **uid 101**, and drops **every** Linux capability. It holds tax data one day; it starts as it means to go on.

**That combination has a trap, and the first build fell straight into it:**

```
nginx: [emerg] mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)
```

Two causes, and you have to fix both:

1. **The stock `nginx:alpine` image expects a root master process.** Its own `nginx.conf` carries a `user nginx;` directive that only works as root. → Use **`nginxinc/nginx-unprivileged`**, which is built for uid 101, listens on 8080, and puts its pid in `/tmp`.

2. **A `tmpfs` mount arrives root-owned.** So even with the right image, nginx (101) cannot create its cache directories inside one. → Every tmpfs must say **`uid=101,gid=101`**.

> **"Read-only" and "unprivileged" are not one switch. They are two, and they have to agree with each other.**

Once nothing runs as root, `cap_add: [CHOWN, SETGID, SETUID]` is dead weight — those exist only so a root process can *drop* to a user. **Drop everything instead.**

**Verify the nginx config before you ship it:**
```bash
docker compose run --rm --entrypoint "nginx -t" selah
```

---

## What's here

```
platform/
├── engine/
│   ├── rules.js         ← THE COMPANY. Uganda's tax law, encoded, versioned, sourced.
│   ├── engine.js        ← Computes. Returns a TRACE, never a bare number.
│   └── engine.test.js   ← 242 tests. Every figure EXECUTED, not asserted.
├── web/
│   ├── index.html       ← The calculator centre
│   ├── app.js           ← RENDERS traces. Never produces them.
│   ├── tokens.css       ← Brand v2 "Verified" — emerald on white
│   └── engine.bundle.js ← GENERATED. The same code the tests run against.
└── build.js
```

---

## The four laws

**1 · Rules are immutable.**
Never edit a rule in place. Supersede it, with an effective date, and keep the old one.
*A return filed for FY2025/26 must still compute under FY2025/26 law. Forever.*

**2 · Every rule carries its source.**
Act, section, gazette. Never a blog.

**3 · Every rule carries a confidence — A, B, C, F.**
**C or F → the engine REFUSES.** It does not guess and disclaim.

**4 · Every rule carries a verified date.**
Uganda's tax law changes every 1 July. **An undated tax claim is a liability.**

---

## The architecture

> ### The engine never returns a number. It returns a proof.

Every computation emits a **trace**: the inputs, the steps, the rule, the legal source, the effective date, the confidence. `app.js` *renders* the trace. It does not *invent* it.

**The obvious way to build "explain the calculation" is to compute a number, hand it to an LLM, and ask it to write an explanation. Never do this.**

An LLM handed `188,250` and told to explain it will produce something fluent, confident, plausible — and it will sometimes use the **old bands**, because the old bands are what it learned. Wrong in the hardest way to catch: articulate, well-formatted, internally consistent.

**Uganda already has a surplus of confident, well-formatted, wrong tax explanations. URA's website has one.**

So: the LLM's job is grammar, not arithmetic. It may re-word a step. It may never invent one.

**The test:** delete `app.js` entirely, and the reasoning must still be **correct** — just unstyled. If deleting it breaks the reasoning, the architecture is wrong.

---

## What it computes

| | |
|---|---|
| **PAYE** | Resident, FY2026/27 bands. Net pay, NSSF, LST, **true employer cost.** |
| **PAYE — non-resident** | 🔴 **REFUSES.** The 2026 Act may have repealed the schedule. Nobody in Uganda knows. |
| **Presumptive tax** | All five bands — **including the 50–80m band that's missing from most published Ugandan tables.** Professional exclusion. The exactly-150m edge case. |
| **WHT credits** | *"URA is holding UGX 3,600,000 that belongs to you. You hold 4 of 11 certificates."* **This is Isaac.** |
| **VAT** | Annual **300m** + quarterly **75m** (it auto-scales) + the forward-looking limb. **And the deregistration trap PwC got wrong in print.** |
| **Arrears** | 2%/month, compounding. **And the cure: voluntary disclosure can waive it entirely.** |
| **Entity choice** | The **UGX 133,410,000** crossover, exactly. |
| **Extraction** | Salary / retain / **dividend at 40.5%.** Options, never a recommendation. |
| **Startup exemption** | Four questions. **Three years of zero income tax.** Not on URA's own exemptions page. |
| **TCC readiness** | **Including the director trap** — a spotless company, blocked by one director's personal return. |

---

## Three screens that no competitor has

**1 · The refusal.**
Set PAYE to *non-resident*. Every other calculator in Uganda returns a number. **Ours returns the truth** — and explains, in full, why nobody knows.

> *A competitor can copy our calculators in a weekend. They cannot copy a refusal card — because to publish one, you must have actually checked, and then been willing to say you don't know.*

**2 · The conflict.**
The PAYE panel tells you **URA's own website is currently wrong**, and links to it so you can see for yourself. We never quietly override an official source. **We show the conflict.**

**3 · The options table.**
Extraction and entity choice give you **rou