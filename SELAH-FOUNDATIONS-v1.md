# The Foundations

**What every Selah module actually stands on — and why the rules engine alone is not enough.**

*Version 1 — 11 July 2026*

---

## 0. The honest answer to "does the engine have enough?"

**No.**

`SELAH-RULES-ENGINE-SPEC` is a **tax rules engine**. It is excellent at what it does, and what it does is: *given these facts, what does Ugandan law say the number is?*

It powers:
- ✅ ~35 of the 53 calculators
- ✅ Radar (arrears, WHT credits, TCC readiness)
- ✅ Optimise (structuring, entity choice, extraction, classification)
- ✅ Payroll's tax logic
- ✅ Every filing deadline

**It powers none of this:**
- ❌ **Invoicing** — the engine knows the VAT rate; it does not know who you invoiced or for how much
- ❌ **Bookkeeping** — the engine knows what's deductible; it has no ledger to deduct it from
- ❌ **Budgeting** — the engine has no idea what you spent last month
- ❌ **Forecasting** — the engine has no history to project from
- ❌ **Investment** — the engine knows how returns are *taxed*; it doesn't know what the returns *are*
- ❌ **Cash flow** — the engine cannot see your bank account

> **The rules engine answers "what does the law say?"**
> **It cannot answer "what happened?", "what do I have?", or "what will happen?"**
>
> **Those are three different foundations, and Selah needs all of them.**

---

## 1. The five foundations

| | Foundation | Answers | Status |
|---|---|---|---|
| **1** | 🟢 **THE ENGINE** — Uganda's rules, encoded | *"What does the law say?"* | ✅ **Specced** (`SELAH-RULES-ENGINE-SPEC`) |
| **2** | 🔴 **THE REGISTRY** — entities, people, relationships | *"Who is involved?"* | ❌ Not specced |
| **3** | 🔴 **THE LEDGER** — every shilling in and out | *"What happened?"* | ❌ Not specced |
| **4** | 🔴 **THE RECORDS** — the evidence behind every entry | *"Can you prove it?"* | ❌ Not specced |
| **5** | 🔴 **THE MARKET** — rates, yields, prices | *"What is money worth right now?"* | ❌ Not specced |

**Every module in the north star is a query against one or more of these five. There is nothing else.**

---

## 2. 🔑 The one everybody forgets: THE REGISTRY

**Before Selah can compute anything, it must know *who* it is computing for — and who they are connected to.**

This sounds trivial. It is not. **Three of our hardest findings are registry problems:**

| Finding | Why it's a registry problem |
|---|---|
| **A director's unfiled personal return blocks the company's TCC** | Selah must hold **the company's TIN AND every director's TIN**, and know the relationship between them |
| **Expenditure over UGX 5m from a supplier with no TIN is DISALLOWED** (s.22(3)(l)) | Selah must hold **every supplier's TIN** and validate it **before payment** |
| **The startup exemption is lost if an "associate" already claimed it — and "associate" includes RELATIVES** (s.3) | Selah must model **family relationships** |

**The registry holds:**

```
ENTITY      company / sole proprietorship / partnership / NGO
            → TIN, URSB number, incorporation date, registered capital,
              accounting year-end, registered tax types, VAT status,
              presumptive status, exemption claims

PERSON      director / shareholder / employee / consultant / supplier
            → TIN (or NIN), residency status, relationship to entity,
              shareholding %, employment vs contract status

RELATIONSHIP  director-of, shareholder-of, employs, contracts-with,
              supplies-to, associate-of (⚠️ INCLUDES RELATIVES — s.3),
              related-party (⚠️ triggers s.115A arm's length, NO threshold)
```

> 🔴 **Note the last two lines.** Uganda's anti-avoidance rules turn on **associate** and **related party** relationships — and from 1 July 2026, **s.115A imposes an arm's-length obligation on every controlled transaction with NO de minimis.**
>
> **Selah cannot warn you about a rule it cannot see the trigger for.** The registry is not admin. **It is the anti-avoidance early warning system.**

---

## 3. 🔑 THE LEDGER — and why invoicing is not a "module"

### Invoicing is where tax is BORN.

Look at what originates at an invoice:

| At the moment an invoice is raised or received | The tax consequence |
|---|---|
| You invoice a client | **VAT output** (if registered) · counts toward the **300m / 75m** registration thresholds · becomes **turnover** for presumptive tax |
| A client pays you less 6% | **WHT deducted.** A **credit** — but only if you get the certificate. **This is the Isaac event.** |
| You receive a supplier invoice | A **deduction** — but only if the supplier has a TIN (>5m) and gives an e-invoice (EFRIS) |
| You pay a consultant | **You** must withhold 6%, remit it by the 15th, **and issue the certificate.** **This is the Harriet event.** |
| You pay an employee | **PAYE, NSSF, LST** |

> **Every single failure in this company's founding stories happened at an invoice.**
>
> **Isaac's 70m** — WHT deducted at the invoice, certificate never collected.
> **Harriet's audit** — consultants paid on invoices, WHT never withheld.
> **The disallowed expense** — supplier invoice with no TIN.
>
> **Invoicing is not a feature Selah adds later. Invoicing is the mouth of the river.** Own it and every downstream module gets clean data for free. Don't own it, and Selah is forever reconciling someone else's mess.

### And this is exactly what EFRIS gives us

**EFRIS is URA's e-invoicing system. It has a real production API, an official accreditation programme, and a published UAT checklist.** It is **the only automatable pipe URA offers.**

We previously filed EFRIS under "compliance." **That was a mistake. EFRIS is the ledger's front door.**

### The ledger holds

```
TRANSACTION   date, amount, currency, direction (in/out)
              counterparty → REGISTRY
              category (chart of accounts)
              tax treatment → ENGINE (VAT code, WHT applicable, deductible?)
              evidence → RECORDS (invoice, receipt, e-invoice, certificate)
              status (invoiced / paid / overdue / disputed)

ACCOUNT       bank, mobile money, cash, petty cash
BALANCE       point-in-time, per account
```

**Double-entry from day one.** Not because accountants like it, but because **a trial balance that doesn't balance is how you find out something is missing** — and "something is missing" is this entire company's problem statement.

---

## 4. THE RECORDS — the evidence vault

**The engine computes. The ledger records. The records *prove*.**

**Every founding story was an evidence failure, not a calculation failure.** Isaac knew the WHT was deducted. He couldn't *prove* it. The paper wasn't there.

```
DOCUMENT    WHT certificate ⚠️ (the highest-value document a Ugandan business owns)
            invoice / e-invoice (EFRIS) / receipt
            payslip · filing acknowledgement · payment receipt (PRN)
            contract · TCC · TIN certificate · URSB certificate
            bank statement · asset register · petty cash log

            → linked to: TRANSACTION, ENTITY, PERSON
            → retention: 5 YEARS (statutory)
            → status: expected / received / MISSING / expired
```

> 🔑 **The single most important field in the whole system is `status: MISSING`.**
>
> An engine that knows a WHT certificate **should exist** and does not — **that is Radar.** That is the entire product, in one nullable field.

---

## 5. THE MARKET — and one number the tax engine needs

**Budgeting, forecasting and investment all need to know what money is worth.**

```
BoU discount rate    ⚠️ REQUIRED BY THE TAX ENGINE — the employee loan benefit
                        is valued against "the BoU discount rate at the
                        commencement of the year of income" (Schedule 6)
BoU CBR · inflation · FX rates
Treasury bill & bond yields (91/182/364-day; 2/3/5/10/15-year)
Commercial lending rates · unit trust performance · USE equity prices
```

> **Note the first line.** A *tax* calculation depends on a *market* rate. **The foundations are not cleanly separable — and any architecture that assumes they are will break on the employee loan benefit.**

---

## 6. The dependency matrix

**Which foundations does each module actually need?**

| Module | Engine | Registry | Ledger | Records | Market |
|---|:---:|:---:|:---:|:---:|:---:|
| **Tax calculators** | ✅ | — | — | — | 🟡¹ |
| **Radar** — arrears, WHT credits | ✅ | ✅ | ✅ | ✅ | — |
| **TCC readiness** | ✅ | ✅ | ✅ | ✅ | — |
| **Optimise** — structuring | ✅ | ✅ | ✅ | — | — |
| **Payroll** | ✅ | ✅ | ✅ | ✅ | 🟡¹ |
| 🔑 **Invoicing** | ✅ | ✅ | ✅ | ✅ | — |
| **Bookkeeping** | ✅ | ✅ | ✅ | ✅ | — |
| **Budgeting** | — | — | ✅ | — | 🟡 |
| **Forecasting** | ✅² | — | ✅ | — | ✅ |
| **Cash flow** | ✅² | — | ✅ | — | — |
| **Audit-ready** | ✅ | ✅ | ✅ | ✅ | — |
| **Investment** | ✅³ | ✅ | ✅ | — | ✅ |
| **Credit / lending** | ✅ | ✅ | ✅ | ✅ | ✅ |

*¹ The BoU discount rate, for the employee loan benefit.*
*² Forecasts and cash flow must project **tax liabilities**, not just revenue — a forecast that ignores the 15th of the month is a fantasy.*
*³ **Every investment return is taxed**: T-bill interest 20% WHT; rental 12%/30%; dividends 15% (10% if USE-listed); secondary-market government securities **exempt**. **An investment tool that ignores tax treatment is giving wrong answers.***

### 🔑 What the matrix tells us

1. **The LEDGER appears in 11 of 13 modules.** It is the most load-bearing foundation, and it is entirely unspecced.
2. **Budgeting needs NO tax engine at all.** It is pure ledger. **Which means it is also the least defensible thing we could build — anyone can build a budgeting app.**
3. **Invoicing touches all four core foundations.** It is the natural centre of gravity of the whole system.
4. **Forecasting and investment need the engine anyway** — because in Uganda, **the tax is the cash flow.**

---

## 7. 🔴 The investment module is REGULATED — and we haven't checked

**Everything above is an architecture problem. This one is a licensing problem, and it is the same shape as the tax agent licence.**

The founder's notes ask for: *"Investment advice. UAP/bonds/mortgages/business. How do I grow financially?"*

In Uganda, **giving investment advice is a licensed activity.** The **Capital Markets Authority Act** regulates investment advisers and fund managers. Insurance products (UAP) fall under the **Insurance Regulatory Authority**. Deposit-taking and lending fall under the **Bank of Uganda** / Tier 4 Microfinance regime.

> 🔴 **We do not yet know what Selah may legally say about investments.**
>
> There is a real and unmapped line between:
> - ✅ **"Here is how a 364-day Treasury bill works, and here is how its interest is taxed."** *(Education. Almost certainly fine.)*
> - 🔴 **"You should buy a 364-day Treasury bill."** *(Investment advice. Almost certainly licensed.)*
>
> **This is exactly the mistake we would have made with the tax agent licence if we hadn't checked.** We are not making it twice.

**Action: research the CMA licensing regime before ANY investment feature is designed.** Treat it exactly as we treated the tax agent question.

> 🔑 **And note how well the "options, not recommendations" principle ages here.** A product that says *"here are your options, here is what each costs, you decide"* is a **very** different regulatory animal from one that says *"buy this."* **The design decision you made two messages ago may turn out to be the thing that keeps the investment module legal.**

---

## 7a. The three platforms — three doors, one house

**Selah presents as three surfaces. That is what the user sees, and it is correct.**

| Surface | Access | What it is |
|---|---|---|
| **The Calculators** | **Public. Free. No login.** | All 53. The front door to everything. Every result ends with a question only the logged-in product can answer. |
| **For Individuals** | Login · one TIN | *My tax. My compliance. My money. My plan. My documents.* |
| **For Companies** | Login · entity TIN | *Compliance. Tax. Payroll. Money. People. Audit. Governance. Optimise.* |

**Three doors. One house.**

The three surfaces are **product**, not architecture. Behind all three sits **one engine, one registry, one ledger, one records vault, one explainability layer** — which is what lets Selah do the thing nobody else can:

> **Tell a director that his *personal* unfiled tax return is what is blocking his *company's* Tax Clearance Certificate.**

**A product built as three separate systems physically cannot say that sentence.** Section 7b is the argument for why.

**And note who moves between the doors.** Isaac is *one person* who is *also* a consultancy. He does not want two logins and two bills. **He wants to see both, together, with the connections drawn.** So do you.

---

## 7b. 🔑 Individual AND company — one system, not two

**The obvious architecture is two products: "Selah Personal" and "Selah Business."**

**It is wrong, and it fails at precisely the five points where Selah is most valuable.**

### The unit is not "person" or "company." The unit is the TAXPAYER.

> **A taxpayer is anything with a TIN.**
>
> An individual has a TIN. A company has a TIN. **Both file returns. Both have a ledger at URA. Both accrue arrears. Both need a TCC. Both can be audited. Both get penalised at 2% a month.**

**So the core object is `TAXPAYER`, and `INDIVIDUAL` and `ENTITY` are subtypes of it** — different rule sets, **same engine, same registry, same ledger, same records, same explainability.**

```
TAXPAYER  ─── has TIN, URA ledger, filing obligations, arrears, TCC status
    │
    ├── INDIVIDUAL   employment income · business income · rental income
    │                personal budget · savings · retirement · investments
    │                → PAYE, personal income tax, rental 12%, presumptive*
    │
    └── ENTITY       company · sole proprietorship · partnership · NGO
                     → CIT 30%, VAT, employer PAYE/NSSF/WHT, audit, governance

         *unless a professional — s.4(8) excludes them
```

### 🔴 The seam is a MEMBRANE, not a wall — and money and liability flow across it constantly

**Here are the five places a two-system architecture shatters. Every one of them is something we already found.**

| # | The crossing | What breaks if individual and company are separate systems |
|---|---|---|
| **1** | 🔑 **The sole proprietor** | ITA: *"the business profit is treated as your personal income."* **A sole proprietor is ONE taxpayer wearing two hats.** There is no seam to build a wall on. **Isaac is customer zero, and he breaks the two-system model on day one.** |
| **2** | 🔑 **The TCC director trap** | URA: *"For Non-Individuals, the associated persons (**directors**) MUST have submitted all their returns."* **A COMPANY's certificate is blocked by an INDIVIDUAL's unfiled personal return.** A company-only system **cannot see the thing that is blocking it.** |
| **3** | 🔑 **Extraction optimisation** | Salary vs dividend vs retain is *literally* a computation across the boundary: **corporation tax on one side, PAYE on the other.** Optimise is meaningless without both. |
| **4** | 🔑 **The entity crossover** | *"Should I be a sole trader or a company?"* — **the whole question IS the boundary.** The answer (UGX 133,410,000) is a comparison between the two subtypes. |
| **5** | 🔑 **The startup exemption** | Lost if an **"associate"** already claimed it — and **s.3 defines "associate" to include RELATIVES.** You cannot evaluate a *company's* exemption without the *founder's family graph*. |

> **Every one of those is a *relationship* between an individual and an entity.**
>
> **A two-system architecture doesn't just make these harder. It makes them invisible.**

### 🔑 And this is exactly the founder's own complaint

> *"We always have arrears with URA that are unknown to us, **either by company or directors**."*

**Read that again. He is describing the failure of the two-system model — in the real world, before we wrote a line of code.**

His accountant does the company. Someone else (nobody) does the directors. **Nobody looks at both.** And so the arrears live in the gap between them.

> **The consolidated view — a person and all their entities, seen together — is not a nice-to-have feature. It is THE feature.** It is the thing no Ugandan accountant currently does, and it is the direct answer to the sentence that started this company.

---

### What each subject actually needs

| Module | Individual | Entity | Notes |
|---|:---:|:---:|---|
| **Tax calculators** | ✅ PAYE, personal income tax, rental, WHT | ✅ CIT, VAT, presumptive, payroll | **One engine. Different rules.** |
| **Radar** — arrears | ✅ personal ledger | ✅ company ledger | 🔑 **Must run on BOTH and show them together** |
| **WHT credit recovery** | ✅ **Isaac** | ✅ company invoices | Same records vault |
| **TCC readiness** | ✅ personal | ✅ company | 🔑 **Cannot compute the company's without the individuals'** |
| **Optimise — structuring** | ✅ | ✅ | 🔑 **Requires BOTH simultaneously** |
| **Invoicing** | ✅ freelancers | ✅ | Same ledger |
| **Bookkeeping** | 🟡 sole traders | ✅ | Same ledger |
| **Payroll** | ✅ *as an employee* — check my payslip | ✅ *as an employer* — run payroll | **Two sides of the same rule** |
| **Budgeting** | ✅ household | ✅ departmental | Pure ledger. **Same engine, different categories.** |
| **Forecasting** | ✅ personal cash flow | ✅ business cash flow | Both must project **tax**, not just income |
| **Audit-ready** | 🟡 rarely | ✅ | Entity-dominant |
| **Governance / policies** | ❌ | ✅ | Entity only |
| **Investment** | ✅ | ✅ treasury | 🔴 **CMA licensing — see §7** |
| **Credit / lending** | ✅ | ✅ | Needs both sides anyway |

**Almost nothing is exclusive to one subject.** Governance is entity-only. Everything else is either shared, or the *same rule seen from two sides*.

> **Payroll is the clearest case.** To an **employee** it answers *"is my employer deducting the right PAYE?"* To an **employer** it answers *"am I deducting the right PAYE?"* **It is the same rule, the same engine, the same computation — pointed in opposite directions.**
>
> **Build it once. Point it both ways.**

### The design rules that follow

1. **`TAXPAYER` is the root object.** Never build a `Person` table and a `Company` table that don't know about each other.
2. **`RELATIONSHIP` is a first-class entity**, not a foreign key. `director-of`, `employs`, `associate-of`, `related-party`. **The value is in the edges, not the nodes.**
3. **One ledger, one records vault, one engine, one explainability layer.** Individual and company are **lenses**, not databases.
4. **The consolidated view is the default, not a report.** *"Here is you, and everything you're a director of, and where the two collide."*
5. **The individual product is the on-ramp; the entity product is the revenue.** Everyone has personal finances. **Not everyone has a company — but every company has a person.** Enter through the person.
6. 🔴 **Consent is per-taxpayer, and so is the URA agent appointment.** Selah must be appointed separately on the individual's TIN and on the company's TIN. **Design the consent model for this from day one** — a company's director must actively authorise us to look at his *personal* position, and that is a different conversation and a different permission.

> **Privacy note, and it is not a small one.** A consolidated view means Selah can see a director's *personal* tax affairs while working for his *company*. **That is exactly what makes the TCC feature possible — and exactly what makes it sensitive.** The director consents personally, separately, revocably. **Never infer that a company's appointment gives us access to its directors' personal ledgers. It does not, legally or ethically.**

---

## 8. What this changes about the build order

**Nothing about the wedge. Everything about what comes after it.**

| Phase | Foundation being built | Note |
|---|---|---|
| **0–1** | Licence + concierge | No foundations needed. A spreadsheet and twenty conversations. |
| **2** | 🟢 **THE ENGINE** | Already specced. Build it. |
| **3** | 🔴 **THE REGISTRY** | **Comes with Radar, whether we plan it or not** — Radar needs director TINs. **Plan it.** |
| **4** | Calculator centre | Engine only. Nearly free. |
| **5** | 🔴 **RECORDS + LEDGER, via INVOICING + EFRIS** | 🔑 **This is the big one.** Invoicing is the mouth of the river. EFRIS accreditation is its front door. **Everything downstream depends on this and nothing downstream works without it.** |
| **6** | Bookkeeping, payroll, audit-ready | All fall out of Ledger + Records + Engine |
| **7** | Budgeting, forecasting, cash flow | Fall out of the Ledger. **Cheap — once the ledger is real.** |
| **8** | 🔴 **THE MARKET** + investment | **Blocked on CMA licensing research.** Do the research now; build later. |
| **9** | Credit / lending | Needs all five. **This is why it's last.** |

> ### The single most important line in this document
>
> **Budgeting and forecasting are not hard. They are just *downstream*.**
>
> A budgeting app you type numbers into is a spreadsheet — and Uganda has spreadsheets. **A budgeting app fed by your actual invoices, your actual payments, and your actual tax liabilities is a business.**
>
> **The difference between those two products is the ledger. Build the ledger.**

---

## 9. What I still need to spec

| # | Document | Why |
|---|---|---|
| 1 | **Registry spec** — entity/person/relationship model, incl. `associate` and `related-party` | Anti-avoidance early warning. Blocks Radar. |
| 2 | **Ledger spec** — double-entry, chart of accounts for Uganda, tax coding | 11 of 13 modules |
| 3 | **Records spec** — document types, the `MISSING` state, 5-year retention, chase workflows | Radar's core loop |
| 4 | **EFRIS integration spec** — the accreditation path, the API, the UAT checklist | The ledger's front door |
| 5 | 🔴 **CMA licensing research** | **Before any investment feature is designed** |

---

**Companions:** `SELAH-RULES-ENGINE-SPEC-v1.1.md` · `SELAH-EXPLAINABILITY-SPEC-v1.md` · `SELAH-CALCULATOR-CENTRE-v1.md` · `SELAH-STRUCTURING-GUIDE-v1.md` · `SELAH-PROPOSAL-v1.md`
