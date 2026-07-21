# Running Selah

**One compose file, at the repository root. There is no other one.**

---

## First time

```bash
cp .env.example .env
```

**Then, before Docker:**

```bash
node platform/preflight.js
```

🔑 **Run this first, every time.** Docker's error for a bad `.env` names a *variable*:

```
error while interpolating services.api.environment.SELAH_INDEX_KEY:
required variable SELAH_INDEX_KEY is missing a value
```

...even when you have definitely set it. **The variable is fine. The FILE is not being read**, and Docker points you at the wrong thing.

On Windows it is almost always one of two invisible problems:

| | |
|---|---|
| **`.env.txt`** | Explorer **hides known extensions**, so Notepad's "save as .env" quietly produced `.env.txt` — and it looks correct in the folder. |
| **A UTF-8 BOM** | PowerShell's `>` and `Set-Content` add one by default. Docker then reads your first key as `﻿POSTGRES_PASSWORD`, which is not `POSTGRES_PASSWORD`. |

`preflight.js` finds both, and tells you the exact command to fix them.

Then generate the two keys. **They are not in the repository and they never will be.**

```bash
openssl rand -hex 32     # → SELAH_ENCRYPTION_KEY
openssl rand -hex 32     # → SELAH_INDEX_KEY   (a DIFFERENT one)
```

Put both in `.env`, along with a `POSTGRES_PASSWORD`.

## Then

```bash
docker compose up --build
```

| | |
|---|---|
| **http://localhost:8080** | The calculators. No account. **Stores nothing.** |
| **http://localhost:3000/api/compliance** | Whether we are legally allowed to hold your data. It will say **no**. |
| the database | **Not exposed.** The API is the only thing that talks to it. |

---

## 🔴 What will happen, and it is correct

Every endpoint that would store a payslip, a TIN, a phone number or an invoice will return:

```
HTTP 451 — Unavailable For Legal Reasons
```

**This is not a bug. Do not route around it.**

Uganda's Data Protection and Privacy Act, s.9(1), makes financial data **special personal data** — processing is **prohibited by default.** Selah is not yet registered with the Personal Data Protection Office.

> **On 10 July 2025 a digital lender's DIRECTOR was PERSONALLY CONVICTED for failing to register.**
> **Not the company. The director.**

So the software will not let you. That gate is there to protect a person, not a company.

**The day the certificate is in your hand**, set these four in `.env` — **and not one hour before:**

```
PDPO_REGISTRATION_NUMBER=
PDPO_REGISTERED_ON=
DPO_NAME=
DPO_EMAIL=
```

**All four.** A registration number with no reachable Data Protection Officer is not a registration, and the code knows that.

> **Setting these falsely does not make you compliant. It makes you compliant-*looking*, which is worse — it removes the one thing standing between you and a conviction: the fact that the software would not let you.**

---

## The tests

```bash
cd platform
npm test          # 408 engine · 176 UI · 39 server
npm run e2e       # 22 real-browser tests, against the running container
```

The build runs them itself. **A failing test cannot ship.**

The first server test is the one that matters: it asserts that this server **refuses** to store a Ugandan's payslip while we are unregistered.
