# Selah — the whole thing

**Designed without regard to regulation. Everything a company or a person needs to run their money.**

*Version 1 · 11 July 2026*

---

## 0. The rules of this document

**Regulation is not in this document.** It is deliberately excluded, so that the design is not pre-shrunk by it. Every constraint is parked in **§9 — the regulatory ledger** at the end, where each item gets a *route*, not a *veto*.

**Two honest notes before we start:**

**1. "Internal tool" is not a legal category.** Uganda's regulators look at substance, not labels. Relabelling doesn't move a perimeter. But —

**2. There is a version of it that is entirely real, and it is the best build strategy available:**

> ### 🔑 Selah is customer zero.
>
> Selah Solutions Ltd has a TIN. It will have payroll, invoices, suppliers, WHT certificates deducted from its own consulting fees, a TCC it needs to win work, an audit it will face, and a **three-year tax exemption it may qualify for.**
>
> **Doing your own books and advising yourself is not a regulated activity.**
>
> **Build the tool Selah needs. Run the company on it. Everything that survives contact with our own money is a product. Everything that doesn't, wasn't.**

---

## 1. What "doing financing" actually means

Strip away the jargon and every financial job — for a person or a company — is one of **five questions.**

| | The question | The system that answers it |
|---|---|---|
| **1** | **What came in?** | The ledger |
| **2** | **What went out?** | The ledger |
| **3** | **What do I owe — and to whom, and when?** | The engine + the calendar |
| **4** | **What do I own — and what am I owed?** | The ledger + the records |
| **5** | **What happens next — and what should I do about it?** | The forecast + the options |

**Everything else is a rendering of those five.** A payslip is question 2. A TCC is question 3. A WHT certificate is question 4. A cash-flow forecast is question 5.

> **This is why the foundations are the foundations.** Not because architecture is elegant — because there are only five questions, and they all resolve to the same three places: **the engine, the ledger, the records.**

---

## 2. The company — the full money lifecycle

**Ten stages. Every Ugandan business goes through all ten. Most have no system for any of them.**

### Stage 1 · Start
| | |
|---|---|
| Register with **URSB** → get a company number | 🔴 **Hard ordering constraint** |
| Register **directors' TINs** → then the **company TIN** | URA requires directors' TINs to issue a company TIN |
| Register **tax types** — income tax, PAYE, VAT, WHT | Wrong registration = wrong obligations forever |
| Register with **NSSF** — *every employer, even with one employee* | The 5-employee threshold is gone (2021) |
| Open a **bank account** — separate from personal | |
| 🔑 **Check the 3-year startup exemption** | **Three questions. Potentially three years of zero income tax.** |
| Set your **accounting year-end** | You can amend it against your TIN. It's a real timing lever. |

### Stage 2 · Earn
```
Quote → Contract → Deliver → INVOICE → EFRIS e-invoice → Collect → Reconcile → CHASE THE WHT CERTIFICATE
```
**Every tax event in the company is born here.** VAT output. Presumptive turnover. The VAT registration threshold. And **the 6% WHT that Isaac never got the certificates for.**

**What Selah does:** raises the invoice, files the EFRIS e-invoice, tracks the payment, **detects the WHT deduction from the shortfall**, opens a certificate obligation, and **chases it.**

### Stage 3 · Spend
```
Request → Approve → 🔴 CHECK THE SUPPLIER'S TIN → 🔴 DEMAND THE E-INVOICE → Pay → Receipt → Categorise
```
> 🔴 **The two checks are not admin. They are the deduction.**
> - **>UGX 5m from a supplier with no TIN → the deduction is DISALLOWED** (s.22(3)(l))
> - **No e-invoice from an EFRIS-designated supplier → DISALLOWED, at any amount** (s.22(3)(m))
>
> **Selah blocks this at the point of payment — not at audit, eight months later.**

### Stage 4 · Employ
```
Hire → 🔑 EMPLOYEE OR CONSULTANT? → Contract → Payroll → PAYE + NSSF + LST → Payslip → Leave → Exit
```
- **The classification decision is the single most expensive one a Ugandan employer makes.** Three regulators, three different tests, three separate clocks. *(IDI v URA.)*
- **Payroll runs both ways:** for an employer, *"am I deducting correctly?"* For an employee, *"is my employer deducting correctly?"* **Same engine, pointed in opposite directions.**
- **Benefits design:** medical insurance is **uncapped and exempt**. Employer retirement contributions are **exempt in and exempt out**. Most Ugandan employers use neither.

### Stage 5 · Record
**Double-entry, from day one.** Petty cash · asset register · trial balance · P&L · balance sheet · cash flow · bank rec.

> **Not because accountants like double-entry — because a trial balance that doesn't balance is how you find out something is missing.**
> **"Something is missing" is this company's entire problem statement.**

### Stage 6 · Comply
| Monthly, by the 15th | PAYE · WHT · NSSF · VAT · excise |
|---|---|
| **Provisional** | 2 instalments (companies) · 4 (individuals) |
| **Annually** | Final return, 6 months after year end |
| **31 October** | **Local Service Tax** — the most-missed obligation, because it's the only one that isn't paid to URA |
| **Continuously** | Arrears at **2%/month, compounding.** TCC readiness — **including the director trap.** |

> **The belief that tax is an annual event is precisely the belief that produces arrears.**

### Stage 7 · Plan
Budget → forecast → **cash runway** → scenario.

> 🔴 **A forecast that ignores the 15th of the month is a fantasy.** In Uganda, **the tax IS the cash flow.** Selah's forecast projects PAYE, VAT, NSSF and provisional tax as first-class line items — because they are the largest predictable outflows most SMEs have, and nobody models them.

### Stage 8 · Decide
| The question | What Selah shows |
|---|---|
| Sole trader or company? | The **UGX 133,410,000** crossover |
| How do I pay myself? | Salary (as low as 0%) · retain (30%) · **dividend (40.5%)** |
| Employee or consultant? | The *IDI* three-limb test, scored, across all three regulators |
| Presumptive or ordinary? | Both modelled, side by side |
| Register for VAT voluntarily? | Input recovery vs. B2C price impact |
| Buy, lease, or hire? | Capital allowances (40/30/20) vs. deductible rent |
| What do I charge? | Cost + margin + **the tax you'll owe on it** |
| Can I afford this hire? | **True employer cost** — gross + 10% NSSF + LST + leave + severance accrual |

### Stage 9 · Prove
**The audit pack.** Trial balance (validated) · P&L · balance sheet · cash flow · payroll reconciliation · asset register · petty cash · VAT reconciliation · **supplier TIN validation** · **WHT certificate register (held vs MISSING)** · related-party transactions · **and the Exceptions Report.**

> 🔑 **The Exceptions Report is the most valuable page.** Everything the engine could not reconcile. **The audit finding, found by us in March — not by the auditor in October.**
>
> **That is what "make audit season better" actually means.** Not a nicer spreadsheet. **The surprises removed, eight months early.**

**Same pack, four audiences:** the auditor · the board · an investor · **a lender.**

### Stage 10 · Grow — *this is "financing"*
**The stage everyone wants and nobody in Uganda can reach, because they cannot prove anything.**

| Route | What it needs | What Selah gives it |
|---|---|---|
| **Retain** | Profit, and the discipline to leave it | The extraction model |
| **Trade credit** | A supplier who trusts you | Clean payment history |
| **Working capital / overdraft** | **Books a bank believes** | The pack |
| **Invoice financing** | **Verified, EFRIS-stamped receivables** | 🔑 **We raised the invoice. We know it's real.** |
| **Asset finance** | An asset register, and cash flow to service it | Both |
| **Term loan** | Books + tax compliance + **a TCC** | All three |
| **Equity** | Books, governance, cap table, clean tax history | The investor pack |
| **Grants / donor** | Audited accounts, policies, procurement trail | The audit pack + governance |

> ### 🔑 The real financing insight
>
> **A Ugandan SME cannot get capital not because it lacks capacity — but because it cannot PROVE it.** No books. No verified receivables. No tax compliance. No TCC. **The information does not exist, so the credit does not exist.**
>
> **Selah is the thing that makes a small Ugandan business legible to capital — for the first time.**
>
> **That is the endgame, and it is worth more than every subscription fee in the plan combined.**

---

## 3. The individual — the same five questions, one person

| Stage | | The Selah job |
|---|---|---|
| **Earn** | Salary · consulting · rent · side income | **Is my PAYE right?** *(Your employer may still be using the old bands.)* |
| **Verify** | | 🔑 **Are my WHT certificates collected?** *(This is Isaac — UGX 70,000,000.)* **Is my NSSF actually being paid in?** |
| **Spend** | Budget · track · categorise | Household, not individual — money is a household system |
| **Owe** | Loans · debts · arrears · **tax I don't know about** | Personal Radar |
| **Own** | Assets · net worth · **money URA is holding for me** | The records vault |
| **Comply** | TIN · file my return · my personal TCC | 🔑 **And: my unfiled return may be blocking my company's certificate** |
| **Plan** | Emergency fund · retirement · goals · school fees | Retirement is the **double exemption** — exempt in, exempt out |
| **Decide** | Sole trader or company? Salary or dividend? Rent or buy? | The same engine, one person |
| **Grow** | Savings · deposits · *(securities — see §9)* | |

### 🔑 The individual is the on-ramp; the entity is the revenue

**Everyone has personal finances. Not everyone has a company — but every company has a person.**

**And the seam between them is where Selah is unique:** a director's unfiled *personal* return blocking his *company's* certificate. A founder's *personal* liability for the company's unwithheld PAYE. The *family* relationship that voids the *company's* startup exemption.

**Nobody else in Uganda looks at both. That gap is where the arrears live — and it is the founder's own complaint, verbatim.**

---

## 4. The layer everyone forgets — the money actually moving

**Every stage above ends in a payment. And that's where Ugandan businesses actually lose control.**

| | |
|---|---|
| **Bank** · **mobile money** · **cash** · **petty cash** | Most SMEs run all four, reconciled by nobody |
| **The URA PRN** | Every tax payment needs a Payment Registration Number |
| **Approval** | Who may authorise what, above what limit |
| **The trail** | Every shilling out must tie to a receipt, an invoice, and a TIN |

> 🔴 **HARD RULE, and it survives everything: Selah NEVER holds client tax money.**
>
> We compute it, we schedule it, we remind them, we generate the PRN. **They pay URA directly.**
>
> *(URA is explicit about this — and it happens to also keep us out of the payment-services perimeter. The right answer twice.)*

---

## 5. The three doors, and one house

| Surface | Access |
|---|---|
| **The calculators** — all 53 | Public. Free. No login. |
| **For individuals** | Personal TIN |
| **For companies** | Entity TIN |

**Behind all three: the engine, the registry, the ledger, the records, the market.**

**Which is why Selah can say the sentence no competitor can:** *"Your personal unfiled tax return is what's blocking your company's Tax Clearance Certificate."*

---

## 6. What makes it Selah and not a spreadsheet

**Four rules, and they survive every version of this document.**

| | |
|---|---|
| **1. The engine is right.** | Versioned, sourced, dated, executed. **URA's own website is currently wrong. PwC is currently wrong.** |
| **2. Every number shows its working.** | The answer · the working · **the law**. Three levels deep. |
| **3. We refuse when we don't know.** | **Confidence C → the calculator refuses and explains why.** Every competitor returns a number. We return the truth. |
| **4. We never say "do this."** | Options, priced, with what each **requires of you** and where each **stops working**. |

---

## 7. Selah runs on Selah — the build order that falls out of it

**Not a roadmap. A dogfooding sequence. Each step is something Selah genuinely needs for itself.**

| # | Build it because Selah needs it | And it happens to be |
|---|---|---|
| **1** | **Check our own 3-year exemption.** Four questions. | 🔑 The cheapest possible product, and our first case study |
| **2** | **Our own TIN, tax types, NSSF, TCC readiness.** | The registry |
| **3** | **Invoice our own clients. Chase our own WHT certificates.** | 🔑 **Invoicing + records. We are Isaac.** |
| **4** | **Run our own payroll — PAYE, NSSF, LST.** | The engine, pointed at ourselves |
| **5** | **Keep our own books. Reconcile our own ledger.** | Double-entry + the trial balance |
| **6** | **Our own compliance calendar and arrears radar.** | Radar |
| **7** | **Model our own structure — salary vs dividend.** | Optimise |
| **8** | **Survive our own first audit.** | The audit pack, and the Exceptions Report |
| **9** | **Forecast our own cash — including the 15th of every month.** | Forecasting |
| **10** | **Try to borrow against our own book.** | 🔑 **Financing — and the moment we find out whether any of it was real** |

> **Every one of those is a thing we must do anyway to exist as a company.**
> **Doing them by hand is a cost. Doing them in Selah is R&D.**
>
> **And at the end of it we have a working product, a real case study, and the only honest sales pitch there is: *"we built this because we needed it, and here is what it found in our own books."***

---

## 8. What we still don't have

*(Design gaps, not legal ones. Those are §9.)*

| | |
|---|---|
| 🔴 **The registry** | Not specced. `TAXPAYER` as root, `RELATIONSHIP` as first-class. |
| 🔴 **The ledger** | Not specced. **Needed by 11 of 13 modules — the load-bearing one.** |
| 🔴 **The records** | Not specced. **The `MISSING` state is Radar, in one nullable field.** |
| 🔴 **EFRIS** | Not specced. **The ledger's front door, and the only automatable pipe URA offers.** |
| **Market data** | BoU discount rate *(the tax engine needs it)*, CBR, inflation, FX. |

---

## 9. 🔴 The regulatory ledger

**Nothing above is deleted. Each item gets a ROUTE, not a veto.**

| What we designed | Status | The route |
|---|---|---|
| **All tax, payroll, compliance, calculators, Radar, Optimise** | ✅ **Clear** | Registered tax agent. A company **can** hold that licence. |
| **Bookkeeping, the accountant bench, audit-ready** | 🔴 **BLOCKED PENDING COUNSEL** | **Accountants Act — an ICPAU firm must be a sole trader or partnership; a LIMITED COMPANY CANNOT HOLD THE LICENCE.** Routes: a partnership affiliate; or **arm the licensed firms instead of replacing them**. **Get the opinion first.** |
| **Budgeting, forecasting, cash flow, invoicing, EFRIS** | ✅ **Clear** | Not a regulated activity. |
| **Savings-account content and comparisons** | ✅ **Clear** | Bank deposits are **expressly excluded** from "securities." |
| **Retirement projections + employer contribution structuring** | ✅ **Clear** | **URBRA licenses NO advisers.** Guardrail: never perform administrator functions; never model *named funds'* returns. |
| **Modelling T-bill / bond / share / unit-trust returns** | 🔴 **HOLD** | CMA perimeter. **"Options, not recommendations" is NOT a shield here.** Route: the **CMA Regulatory Sandbox** (opened Oct 2025, ~4 applicants), and/or the **investment adviser licence — UGX 250,000, no capital requirement.** *Cheaper than avoiding it.* |
| **Insurance comparison or "risk assessment"** | 🔴 **HOLD** | IRA. Even unpaid: **"risk advisor" has no remuneration element**, and **holding out alone is an offence.** Broker licence = UGX 75m+. |
| **Financing — invoice finance, lending, underwriting** | ⚠️ **REDESIGN** | ✅ **No loan-introducer licence exists in Uganda.** But the related-party flow (our data → our score → the founder's lender → our fee) **collapses corporate separation.** Mitigations: independent credit decision at the lender; **non-exclusive** referrals; no common directors on credit; **the borrower pays us nothing (s.96).** |
| **Professional marketplace (accountants, lawyers)** | ❓ **UNKNOWN** | **Advocates Act / Law Council and ICPAU referral-commission rules NOT researched.** Both commonly ban paying non-professionals for referrals. |
| **Holding any of this data at all** | 🔴 **ACT NOW** | **DPPA s.9: financial data is SPECIAL — processing is PROHIBITED BY DEFAULT.** Gateway: explicit, granular, unbundled consent. **PDPO registration mandatory. A DPO mandatory. A director was personally CONVICTED on 10 July 2025 for failing to register.** |

### The three things to do this week

1. 🔴 **Counsel opinion on the Accountants Act.** *If bookkeeping by a limited company is uncurable, Stage 5 and Stage 9 need a different shape — and we need to know now.*
2. 🔴 **Register with the PDPO. Appoint a DPO.** *UGX 100,000. There is no excuse.*
3. 🔑 **Check Selah's own 3-year exemption.* Four questions. Potentially three years of zero income tax — and the first thing the product ever does.

---

**Companions:** `SELAH-REGULATORY-v1.md` · `SELAH-FOUNDATIONS-v1.md` · `SELAH-REQUIREMENTS-v1.md` · `SELAH-RULES-ENGINE-SPEC-v1.1.md` · `SELAH-STRUCTURING-GUIDE-v1.md` · `SELAH-CALCULATOR-CENTRE-v1.md` · `SELAH-TEMPLATES-v1.md` · `SELAH-PROPOSAL-v1.md`
