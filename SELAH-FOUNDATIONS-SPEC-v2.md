# Selah — The Four Unbuilt Foundations

**v2 · 11 July 2026 · A build spec, not a vision document**
*Supersedes the "five foundations" section of `SELAH-FOUNDATIONS-v1.md`. One of the five — the engine — is now built and passing 228 tests. These are the other four.*

---

## 0. Why this document exists

**The engine is finished and it is useless on its own.**

It computes correct Ugandan tax from numbers you hand it. But nobody has the numbers. Isaac did not know what had been withheld from him. MamaOpe did not know NSSF was still accruing. The company that lost the tender did not know a director had never filed.

> **The engine answers "what is the tax?" The foundations answer "what is your situation?" — and that is the question every one of our founding failures actually was.**

Every module above Phase 1 — budgeting, forecasting, invoicing, Radar, the health check, the whole of Phase 2 and 3 — is a *view* over these four. Build a module before its foundation and you will build it twice.

---

## 1. The four, named

| | Foundation | The one-line test of whether it works | Status |
|---|---|---|---|
| **F1** | **THE REGISTRY** | *Given a company, can we name every person whose personal tax failure would block its certificate?* | 🔴 Not built |
| **F2** | **THE LEDGER** | *Can we tell a taxpayer what they owe **today**, including what is accruing while they read the screen?* | 🔴 Not built |
| **F3** | **THE RECORDS** | *Can we prove a deduction, or a credit, to a URA auditor — without asking the client to go and look?* | 🔴 Not built |
| **F4** | **THE CLOCK** | *When the law changes — or a signed Act finally commences — do we know **which clients** are affected, and can we move them in one commit?* | 🔴 Not built |

**F4 replaces "market data" from v1, and the change is deliberate.** Market data (BoU rates, T-bill yields, FX) is a *dependency of certain calculators*, not a foundation of the platform. **The clock is a foundation, and today proved it.**

---

## 2. 🔴 What today taught us — and why F4 is now a foundation

While finishing the calculators we found this, and it is the shape of the whole company:

> **The Employment (Amendment) Act 2025 was assented by the President on 29 April 2026.**
> It standardises severance at one month's salary per year worked.
> **Its commencement date has not been gazetted. It is not in force.**

Our own UI was already telling users it *was* the law. An earlier draft of the calculator insisted it was a myth. **Both were confidently wrong, in opposite directions.** The truth is a third state we had no way to represent:

```
in_force                  →  compute with it
superseded                →  compute with it for prior years
assented_not_commenced    →  🔴 DO NOT COMPUTE WITH IT. But DO warn.
```

**A law that is signed, published, discussed by every firm in Kampala, and not yet in force is not an edge case in Uganda. It is a season.** The Income Tax Act changes every 1 July. Commencement notices land whenever a Minister signs one. And nobody writes to tell you.

**F4 is the machinery that watches for that notice — and knows, on the day it lands, exactly whose numbers just changed.** That is not a feature. It is the difference between a rules engine and a subscription.

---

## 3. F1 — THE REGISTRY

### The insight that determines the schema

**TAXPAYER is the root object. Anything with a TIN is a taxpayer.** An individual is a taxpayer. A company is a taxpayer. They are *subtypes*, not separate systems — and the moment you build them as separate systems you cannot answer the question that matters.

**And the registry is a GRAPH, not a table.** Here is why, in one sentence from URA's own TCC criteria:

> *"For Non-Individuals, the associated persons (directors or partners) **must have submitted all their returns**."*

A spotless company is refused its certificate because of a director's *personal* return. **That fact does not live in either the company's row or the director's row. It lives in the edge between them.** A relational schema with a `companies` table and a `people` table will model this badly and answer the question slowly.

### The edges are the product

| Edge | Why it exists | What breaks without it |
|---|---|---|
| `DIRECTOR_OF` | URA TCC criterion 3 | **The director trap.** The company loses the tender and never learns why. |
| `SHAREHOLDER_OF` (with %) | The 3-year exemption needs ≥51% EAC-citizen ownership | We cannot tell a founder whether they qualify for a total tax holiday |
| `ASSOCIATE_OF` | ITA s.3 — **"associate" INCLUDES RELATIVES** | The exemption is lost because a *sibling* claimed it. We would never see it coming. |
| `EMPLOYS` | PAYE, NSSF, LST — and the employee/consultant line | Recharacterisation exposure across **three** regulators |
| `WITHHELD_FROM` | The WHT credit chain | **This is Isaac.** No edge, no certificate, no credit. |
| `SUPPLIES` (with TIN + EFRIS status) | The deduction blockers | A perfectly real expense becomes non-deductible at audit |

> 🔑 **`ASSOCIATE_OF` is the most dangerous edge in the system, and it is the one every competitor will omit.** ITA s.3 defines "associate" to include relatives. The 3-year exemption is lost if *an associate* has previously benefited. **A user cannot answer that question about themselves.** We must ask it, store it, and be honest that we cannot verify it.

### Non-negotiables

1. **Every node carries provenance.** *Who told us this, when, and did they prove it?* A directorship the client typed is not a directorship URSB confirmed, and the two must not look the same on screen.
2. **A taxpayer may be incomplete, and must say so.** *"We know of 2 directors. Are there others?"* — an unasked question is a silent blocker. **The registry's most valuable output is a list of what it does not know.**
3. **🔴 This is special personal data.** DPPA s.9(1): financial data — **processing is PROHIBITED BY DEFAULT.** F1 stores relationship graphs of Ugandan citizens and their tax positions. **PDPO registration and a DPO are a hard gate on F1 shipping.** A digital lender's director was *personally convicted* on 10 July 2025 for failing to register. That is eleven months ago and the ink is not dry.

---

## 4. F2 — THE LEDGER

### The rule that shapes everything

> ### **SELAH NEVER HOLDS CLIENT TAX MONEY. THE LEDGER MIRRORS; IT DOES NOT MOVE.**

URA is explicit that agents must not receive client tax funds. It also keeps us entirely outside the payment-services perimeter, which is a licence we do not want and do not need. **Every account in this ledger is a mirror of a position held elsewhere.** We record; we never receive.

### It is a double-entry ledger, and it must be

The temptation is a `balances` table. Resist it. **A single mutable balance cannot answer "how did it get to this?" — and that question is the product.**

```
OBLIGATION     a tax that has fallen due          (credit URA, debit expense)
PAYMENT        money the taxpayer actually sent   (debit URA, credit bank)
CREDIT         WHT withheld from them             (debit URA, credit income)  ← an ASSET
INTEREST       what silence costs, 2%/month       (credit URA, debit expense) ← ACCRUES
PENALTY        the fine                            (credit URA, debit expense)
WAIVER         voluntary disclosure, if granted   (debit URA, credit expense) ← the CURE
```

### 🔑 The three things that make this ledger different from every accounting package in Uganda

**a) A WHT CREDIT IS AN ASSET WITH AN EVIDENCE FLAG.**

```
credit.amount            3,600,000
credit.certificate_held  false        ← 🔴 THE ENTIRE ISAAC PRODUCT IS THIS BOOLEAN
```

**A credit you cannot evidence is a credit you do not have.** The ledger must therefore carry *two* balances — what you are owed, and what you can **prove** you are owed — and show them side by side, permanently, until the gap is closed. **No accounting system in Uganda does this, because no accounting system in Uganda thinks a missing certificate is an accounting event. It is the most expensive one there is.**

**b) INTEREST ACCRUES WHILE YOU READ THE SCREEN.**

The balance is a function of time, not a stored number:

```
balance(t) = principal × (1 + 0.02)^months_overdue(t)
```

A forgotten UGX 4,000,000 is **13,124,123** after five years. Waiting one more year to decide costs another **3,520,438**. *(I first typed 3,143,674 into a test. The suite caught it. Interest compounds on the **balance**, not the principal — which is exactly the error a taxpayer makes when he reassures himself the arrear is "only growing at 2%".)*

**Radar's core question is not "what do you owe". It is "what is this becoming, and what will it be in twelve months if you do nothing".** A ledger that stores a balance cannot answer that. One that stores an accrual can.

**c) IT IS MULTI-AUTHORITY, OR IT IS USELESS.**

**NSSF arrears do not block a URA Tax Clearance Certificate.** They will still sink the bid, because PPDA lists the social security certificate as a *separate* document. **This is MamaOpe, precisely: a company with a valid TCC that loses the tender anyway.**

```
URA   ·  income tax, VAT, PAYE, WHT, provisional
NSSF  ·  5% + 10%, 10%/month penalty, compounding, NO NOTIFICATION EVENT
LOCAL ·  Local Service Tax — remitted to the DISTRICT, not to URA
URSB  ·  annual returns
```

**A single-authority ledger tells a company it is compliant on the day it loses the tender.**

### The one that will bite us

**URA's ledgers are wrong often enough that URA runs a department to fix them.** The Ledger Reconciliation Sections exist. Their existence is an admission — and **the burden of proving the ledger wrong falls on the taxpayer.**

So F2 has a fourth balance nobody wants to build: **what URA thinks you owe, versus what you actually owe, versus the difference we cannot yet explain.** That gap is a product. It is also, eventually, a Tax Appeals Tribunal filing.

---

## 5. F3 — THE RECORDS

**The certificate is the asset. The invoice is just paper about it.**

### The two blockers that must fire AT THE POINT OF PAYMENT

These are the Harriet-class failures: **you spend the money correctly, and the paperwork makes it non-deductible.** Discovering it at audit, eight months later, is not a feature — it is a post-mortem.

| Blocker | Threshold | Source |
|---|---|---|
| **No supplier TIN** | Expenditure **above UGX 5,000,000** in one transaction is **DISALLOWED** | ITA s.22(3)(l) |
| **No EFRIS e-invoice** from a designated supplier | **DISALLOWED. NO THRESHOLD. Any amount.** | ITA s.22(3)(m) |

> **F3's job is to stop the payment, not to explain the loss.** A record system that files documents is a filing cabinet. A record system that refuses to let you pay a designated supplier without an e-invoice is a **control**. Only the second one is worth money.

### And the good news nobody in Uganda believes

**Uganda has NO "wholly and exclusively" test.** ITA s.22(1)(a) says *"to the extent to which"* the expenditure was incurred in producing income. **That is an APPORTIONMENT test.** Mixed-purpose expenditure is *apportionable*, not wholly disallowed.

**This is significantly more generous than almost every Ugandan business owner believes**, and F3 is where we prove it: apportionment needs evidence, and evidence needs records. **The records foundation is not a compliance chore. It is how you claim the deductions you have been throwing away.**

### Non-negotiables

- **Immutable, hashed, timestamped.** A record that can be edited after the fact is not evidence.
- **A document is bound to a ledger entry, or it is lost.** A folder of PDFs is not a record system.
- **Retention: 5 years minimum** (TPCA). Design for 7.
- 🔴 **Special personal data again.** Payslips, bank statements, medical receipts. **F3 cannot ship before the PDPO registration either.**

---

## 6. F4 — THE CLOCK

**The foundation today created.**

### Three kinds of time, and they are all different

```
1. THE TAX YEAR         1 July → 30 June. Everything changes on the 1st.
2. THE FILING CALENDAR  the 15th, monthly. Provisional. 31 Oct. Month 6.
3. 🔴 THE COMMENCEMENT CLOCK   an Act is signed... and waits.
```

**The third is the one nobody builds.**

### What F4 must hold

```js
{
  id:      'UG.SEVERANCE.2025',
  status:  'assented_not_commenced',   // ← not "effective". not "superseded".
  assentedOn: '2026-04-29',
  effectiveFrom: null,                  // ← the null IS the fact
  commencementGazettedOn: null,         // ← the missing piece of paper
  affects: ['trueCostOfEmployee', 'severanceAccrual', 'sickLeaveCost', ...],
  openQuestions: [
    'WHEN does it commence? Nobody knows.',
    'Is the base SALARY or GROSS SALARY? The Bill said gross. The firms say salary.',
    'Does it bite RETROSPECTIVELY on service already worked? UNANSWERED.',
  ],
}
```

### The three jobs

1. **WARN.** Every affected client is told, today, that a law is coming that will change their numbers — *and that it is not law yet.* We are the only ones who will draw that distinction. Every HR guide in Uganda is already reporting the new severance rule as fact.
2. **QUANTIFY THE GAP.** *"Your contract accrues nothing. The assented Act would require 1,000,000 a year for this employee — and if it bites retrospectively, 10,000,000 for the ten years already worked."* **That is a number no one else in Uganda can produce, and it is on someone's balance sheet whether they compute it or not.**
3. **SWITCH.** The day the notice is gazetted, one rule flips, and every affected client's figures move with it. **This is what versioned, immutable rules were always for.** We built the versioning before we had a use for it. Now we have one.

### And it works backwards, too

**The trace is our legal defence.** Under TPCA s.69(2) a registered tax agent who aids a tax offence faces double the tax evaded and up to five years. Every trace records *what we told this client, on what date, under which rule version, at what confidence.*

**So when a rule changes, we can identify every client advised under the old one — and tell them.** No Ugandan tax practice can do that. It is not a technical achievement; it is just what happens when the rules are data instead of a memo.

---

## 7. 🔴 The pipe — and the honest limit

**Selah cannot automate what URA does not expose.**

| | Available? | Reality |
|---|---|---|
| **EFRIS** | ✅ **YES** | Invoices and receipts. **The only automatable pipe URA offers, and the whole integration story rests on it.** |
| **Ledger / arrears** | 🔴 **NO API** | The balance that matters most cannot be fetched. |
| **Filing** | 🔴 **NO API** | Returns are filed by a human, in the portal. |
| **TCC status** | 🔴 **NO API** | You find out when you lose the tender. |
| **DT Agent Appointment** | ✅ Portal mechanism | Scoped by tax type and date. Requires the client's act, not ours. |

> **Say this plainly, internally and to clients: the arrears figure is entered or uploaded, not fetched.** Any pitch deck that implies a live URA ledger feed is lying, and the lie will be discovered in the first demo.
>
> **The absence of the API is not a gap in our product. It is the reason our product exists.** If URA exposed a clean ledger, Radar would be a weekend project and somebody would already have built it.

---

## 8. Build order — and why it is not the obvious one

```
NOW ───────────────────────────────────────────────────────────────
  ✅ THE ENGINE            built · 228 tests · runs inside the build
  ✅ THE CALCULATORS       18 shipped · Tier 1 complete

GATED — and NOT by engineering ────────────────────────────────────
  🔴 PDPO registration + a DPO      ← F1, F2, F3 CANNOT SHIP WITHOUT IT
  🔴 Counsel: the Accountants Act   ← decides whether Phase 3 is even legal
                                       for a limited company to perform

THEN, IN THIS ORDER ───────────────────────────────────────────────
  1. F4 · THE CLOCK        ← cheapest, ships alone, needs NO personal data
  2. F1 · THE REGISTRY     ← everything else hangs off the taxpayer graph
  3. F3 · THE RECORDS      ← the certificate is the asset; get it before the ledger
  4. F2 · THE LEDGER       ← the hardest, and worthless without F1 and F3
```

### Why F4 first, when it looks like the least important

**Because it is the only foundation that needs no personal data at all.** It holds *rules*, not people. **It can ship while the PDPO registration is still in the post** — and it immediately makes the calculators smarter, which is the funnel for everything else.

It is also, right now, **the only thing we have that a Ugandan business cannot get anywhere else at any price**: a machine that knows the difference between a law that is passed and a law that is in force.

### Why F3 before F2

Because **the certificate is the asset.** A ledger that records a WHT credit it cannot evidence is recording a fiction. Build the evidence store first and the ledger has something true to point at.

---

## 9. What we will NOT build

- ❌ **A payments rail.** Selah never holds client tax money. This is not a phase-2 maybe; it is a permanent boundary, and it is what keeps us out of the payment-services perimeter.
- ❌ **A general accounting package.** QuickBooks exists. We are the layer that knows Ugandan tax law is *wrong on URA's own website*.
- ❌ **An LLM that produces traces.** It may *phrase* one. It may never *produce* one. **Delete the model and the reasoning must still be correct — just less pleasantly worded.**
- ❌ **A live URA ledger feed.** It does not exist. Do not draw it on a slide.

---

## 10. The four questions this document must be able to answer in twelve months

1. *Who are the people whose personal failures block this company?* — **F1**
2. *What does this taxpayer owe today, and what is it becoming?* — **F2**
3. *Can we prove it to an auditor without phoning the client?* — **F3**
4. *The law just changed. Who do we call?* — **F4**

**If the platform cannot answer these four, it is a calculator with a login screen.**

---

*Verified 11 July 2026. Uganda's tax law changes every 1 July — and its commencement notices change on no schedule at all.*
