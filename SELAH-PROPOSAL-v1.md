# Selah

**A compliance engine for Uganda.**

*Proposal v2 — 11 July 2026*
*Working draft for discussion. Every factual claim is sourced; every unknown is flagged.*

**What changed in v2:** the structuring research is folded in. Selah now has **two products on one engine, not one** — Radar (*what you owe*) and **Optimise** (*what you can keep*). The second may be the better wedge, and §10 puts that question to you rather than deciding it. Also added: the three-year tax exemption almost nobody in Uganda knows exists, and which **Selah itself may qualify for**.

---

## 1. Executive summary

**Selah tells Ugandan businesses and individuals what they owe, what they're owed, what they can legally keep — and what to do about all three, before URA tells them.**

Uganda's tax rules are public, but they are not *knowable*. They change every July. The Uganda Revenue Authority's own website currently publishes the wrong PAYE bands. PwC's public commentary currently states the wrong VAT threshold. Grant Thornton Uganda's tax guide has been carrying a table that expired in 2020. In this environment, a business does not fail to comply because it is dishonest. **It fails because nobody — not its accountant, not its auditor, not the tax authority's own website — can reliably tell it what the number is.**

The cost of that is not theoretical. It is a consultant who discovers after five years that URA has been holding UGX 70 million of his money. It is a startup that accrues NSSF arrears when a grant ends. It is a company that loses a tender because a director it barely remembers never filed a personal return.

Selah is built on a single asset: **Uganda's tax and compliance rules, encoded correctly, versioned, tested, and kept current.** Everything the user sees — a free calculator, a personal budget, a company's compliance dashboard — is a face on that one engine.

**That one engine powers two products:**

| | | |
|---|---|---|
| **RADAR** | *"Here is what you owe, and what you're owed."* | Arrears you can't see. WHT credits you never claimed. A TCC that's about to be refused. |
| **OPTIMISE** | *"Here is what you can legally keep."* | Entity structure. How you pay yourself. How you contract. **Exemptions nobody told you about.** |

**Radar sells on fear. Optimise sells on gain. They cost the same to build, because they are the same engine.**

To see why Optimise matters: Uganda enacted a law in July 2025 giving **any new business started by a citizen a total exemption from income tax for three years.** No sector restriction. No approval needed. It is **not on URA's exemptions page**, and it is **not in PwC's tax summary.** We found it in the gazette. *(Selah itself may qualify.)*

We enter through a licensed-tax-agent service, expand up the stack — bookkeeping, payroll, audit-readiness, a pooled bench of accountants — and eventually into capital, where verified books and tax history let us underwrite businesses nobody else can price.

**We are not building accounting software. Uganda has accounting software.** We are building the thing that does not exist: a correct, continuously-maintained, machine-readable model of Ugandan tax law, wrapped in a licence that lets us act on it.

---

## 2. The problem

### 2.1 The rules are unknowable

We spent this week compiling a verified rules specification for Ugandan tax. What we found is the business case.

| What we found | Status as at 11 July 2026 |
|---|---|
| **URA's own PAYE rate page** | Still publishes the **pre-July-2026 bands**. Eleven days into the new tax year, the tax authority's website is telling every employer in Uganda to use the wrong numbers. |
| **PwC Uganda's public commentary** | States the new VAT registration threshold is **UGX 250 million**. Parliament passed **300 million**. |
| **PwC on VAT deregistration** | Says businesses under 300m can deregister. The statute's 12-month limb is **75% of the threshold — 225m.** There is a live population of businesses being told they can come off VAT when they legally cannot. |
| **Grant Thornton Uganda's tax PDF** | Still carries the **pre-2020** presumptive tax table. |
| **Global Law Experts / Lawyard / The Independent** | Published a PAYE table that is flatly wrong — and *The Independent*'s table contradicts the body text of its own article. |
| **The non-resident PAYE bands** | **Nobody in Uganda has published them.** The 2026 Act appears to have substituted the whole schedule with a resident-only table. It may be a legislative gap. We cannot find a single source that knows. |

Four professional firms. Four different answers. In the same week. **This is not a gap in the market. This is the market.**

### 2.1a The rules don't just cost you money when they're wrong. They cost you money when they're *hidden*.

**In July 2025 Uganda enacted a total three-year income tax exemption for any new business started by a citizen.**

**ITA s.21(1)(za).** Confirmed against the gazetted Act (Act 13 of 2025). Capital under UGX 500m. **No sector restriction** — ICPAU formally proposed limiting it to a sector list and **Parliament rejected that.** A company qualifies, not just an individual. **Self-assessed** — no application, no certificate, no approval.

**And:**

- **URA's own "Income Tax Exemption" page does not mention it.** It still lists only the old exporter holiday.
- **PwC's Worldwide Tax Summaries does not list it.** Their incentives page, reviewed January 2026, stops at the 2024 amendments.
- **RSM lists it — and misprints the conditions**, using "or" where the Act says "and".
- **The form required to claim it may never have been prescribed.** PwC noted in April 2025 that URA had not issued it. We can find no evidence it has since.

> **A three-year total tax holiday, available to almost every new Ugandan business, is absent from the tax authority's own exemptions page and from the Big Four's reference summary.**
>
> **How many Ugandan businesses have paid income tax in the last twelve months that they did not owe?**
>
> **Nobody knows. That is the point. And that is the company.**

### 2.2 The failures are evidence failures, not knowledge failures

Every story that started this company has the same shape.

**Isaac — UGX 70 million.** A consultant, five years of work. Government and corporate clients deducted 6% withholding tax at source on every invoice. That 6% is **not a cost — it is prepaid tax**, creditable against his income tax liability. But the credit is only claimable if he holds the **withholding tax certificate**. He didn't collect them. So he paid tax on the same income twice, for five years, entirely by accident.

*He did not lack information. WHT rules are public. He lacked awareness that they applied to him — and he lacked the paper.*

**MamaOpe — NSSF arrears.** A grant ended, payroll restructured, and the employer obligation did not stop — it accrued, silently, with no notification event, at 2% per month. Still unresolved.

**Harriet — the audit that wouldn't reconcile.** Consultants paid in full through the year, WHT never deducted. Discovered at audit. The money had been spent correctly; the *paperwork* made it wrong.

**The TCC that never came.** We now know why this happens, and it is worse than anyone assumed. URA's own criteria, verbatim:

> *"For Non-Individuals, the associated persons (**directors** or partners) **MUST have submitted all their returns**."*

**A company can be spotless — every return filed, every shilling paid — and still be refused a Tax Clearance Certificate because a passive, absentee, or long-forgotten director has never filed a personal income tax return.** It is invisible from inside the company's own ledger. There is no warning. You find out when you lose the tender.

### 2.3 The arithmetic of silence

Interest on unpaid tax runs at **2% per month** — compounding, for VAT. That is roughly **27% a year**, on a liability nobody has told you about.

This is how a forgotten UGX 4 million becomes an UGX 11 million problem in five years while you do nothing wrong.

**And URA knows.** It operates dedicated **Ledger Reconciliation Sections** at its service centres and at URA Tower. PwC lists "taxpayer ledger reconciliations" as a standing URA focus area. **The existence of that department is an admission that the ledgers are wrong often enough to need one — and that the taxpayer bears the burden of proving it.**

---

## 3. Why now

1. **The rules just changed, and nobody has caught up.** 1 July 2026 moved the PAYE threshold, abolished a band, added a band, doubled the VAT registration threshold, raised software royalty WHT from 5% to 15%, and introduced new withholding categories. The confusion is at a local maximum *right now*.

2. **The tax agent population is tiny.** The only figure we could find is **402 licensed domestic tax agents** (URA, 2019) against ~1.4 million registered businesses. Even if stale, the ratio is extraordinary — and it means the "good accountant" bottleneck the founder identified is structural, not anecdotal.

3. **URA is digitising, and it has opened exactly one door.** EFRIS — the e-invoicing system — has a real, production, system-to-system API, a published UAT checklist, and a public register of accredited software integrators. **That door is open and almost nobody is walking through it.**

4. **We have the design partners already.** Isaac, MamaOpe, Harriet. Not hypothetical users — people who have already paid the price.

---

## 4. Vision — the north star

**Selah handles everything financial, for every Ugandan business and every Ugandan person.**

Tax. Payroll. Bookkeeping. Compliance. Governance. Audit. Budgeting. Forecasting. Investment. Credit. **The single place a business or a person goes for anything to do with money.**

**That is the destination. It is not the starting point, and this proposal is careful about the difference — but it is not a smaller ambition than it sounds, and it should not be read as one.**

### How the destination is actually reachable

The reason "everything financial" is a coherent goal rather than a fantasy is that **almost all of it resolves to three things**, and Selah builds them in order:

| | | Serves |
|---|---|---|
| **The engine** — Uganda's rules, encoded correctly | Tax, payroll, compliance, structuring, calculators, deadlines, penalties | **Everything** |
| **The records** — the evidence vault | Bookkeeping, audit, VAT, deductions, WHT certificates | **Everything** |
| **The ledger** — a true picture of money in and out | Budgeting, forecasting, cash flow, credit, investment | **Everything** |

**Every product in the north star is a query against one of those three.** A PAYE calculator is the engine. An audit pack is the records. A loan decision is the ledger. **Build those three well and the "one-stop shop" is not a feature list — it is a consequence.**

**Build them badly, or build the feature list first, and you get a broad, shallow product that is wrong about tax — which in this market is worse than useless.**

### 🔑 The one-stop calculator centre — reachable NOW

**53 calculators. Around 40 of which do not exist anywhere in Uganda today.**

*(Full inventory: `SELAH-CALCULATOR-CENTRE-v1.md`)*

Everything from PAYE and net-to-gross, through presumptive tax and the VAT registration trigger, to taxable benefit valuation, penalty-and-interest projection, TCC readiness, the employee-vs-consultant classifier, and the three-year exemption checker.

> **This is the part of the north star that is achievable immediately, because once the engine exists, each calculator is a form and a function call.**
>
> Existing Ugandan calculators do PAYE, and maybe WHT. **Several of them are wrong right now**, because the bands changed on 1 July 2026 and URA's own website hasn't caught up.
>
> **A complete, correct, free, sourced calculator centre — in a country where the tax authority's own site is currently wrong — is the cheapest trust-building machine available to us, and it is a genuine one-stop shop on day one.**

## 5. Mission

To encode Uganda's tax and compliance rules correctly, keep them correct, and put them to work for the people the system currently fails.

## 6. Objectives

1. **Be right.** Build and maintain the only versioned, tested, machine-readable model of Ugandan tax law.
2. **Recover money people are already owed.** Unclaimed WHT credits, first.
3. **Prevent arrears** rather than discovering them at audit.
4. **Make audit season survivable.**
5. **Pool scarce expertise** — good accountants are rare; share them.
6. **Make businesses investable** — clean books are the precondition for credit.

---

## 7. Who we build for

We will eventually serve individuals, SMEs, NGOs and professionals. **We will not serve them all at once.**

| | Who | Why them, why now |
|---|---|---|
| **First** | **Solo consultants and sole proprietors** | Highest pain, zero existing support, and — crucially — **they are owed money.** For a sole proprietor, personal and business tax are the *same thing* (business profit is personal income), so one product serves both Layer 2 and Layer 3. Isaac is customer zero. |
| **Second** | **SMEs, 5–50 staff** | Have payroll, have real arrears exposure, need TCCs to win contracts. Recurring revenue. Better economics. |
| **Third** | **Grant-funded orgs / NGOs** | Donor-audited, terrified of non-compliance, have budget lines for it. MamaOpe. |
| **Fourth** | **Accountants themselves** | Arm the bench rather than replace it. Distribution. |

> ⚠️ **One correction from the research:** a solo consultant is **statutorily excluded** from presumptive tax (ITA s.4(8) — *"medical, dental, architectural, engineering, accounting, legal or other professional services"*). The presumptive regime is for the *trader*, not the *consultant*. Isaac was never in it. Any product that routes a consultant into presumptive tax is wrong — and half of Uganda's published tax guidance would do exactly that.

---

## 8. The insight

Selah's three layers are not a ladder users climb. **They are three faces on one engine.**

| Layer | What the user sees |
|---|---|
| **Layer 1 — Calculators** | PAYE, WHT, VAT, NSSF, presumptive. Free. Public. This is not a product; **it is the marketing budget.** |
| **Layer 2 — Individual finance** | Budgeting, expenses, personal tax, WHT credit recovery. |
| **Layer 3 — Company** | Compliance, payroll, bookkeeping, audit-readiness, governance, TCC. |

Beneath all three sits **the engine**: Uganda's tax rules, encoded, versioned, sourced, tested. That is the asset. Everything above it is a rendering.

And beneath *that* sit the three layers that were missing from the original architecture — **the ones that aren't surfaces at all:**

| | | Status |
|---|---|---|
| **The pipe** | URA, NSSF, URSB access — the tax agent licence and the portal appointment mechanism | ✅ **Legally solved.** See §9. |
| **The paper** | The records vault: WHT certificates, receipts, payslips, filing acknowledgements | The substrate. Every founding story was an evidence failure, not a calculation failure. |
| **The people** | A pooled bench of accountants who sign off | Because software cannot sign. |

> **The gray boxes — calculators, dashboards, budgets — are the ones anyone can build. The pipe, the paper and the people are the ones that are hard. That is not a coincidence. That is where the company is.**

### Financial literacy is not a layer — it is the engine, out loud

The founder asked for financial education. **A content library would not have saved a single one of our four cases** — Isaac didn't lack articles, he lacked awareness that a public rule applied to *him*.

So literacy is not a section of the app. It is a property of every number Selah ever shows:

> **You owe UGX 188,250 in PAYE this month.**
> *Because: your gross is 1,000,000. The first 335,000 is untaxed. The next 75,000 is taxed at 20%, the next 75,000 at 25%, and the remaining 515,000 at 30%.* → see the bands
>
> **URA is holding UGX 3,600,000 that is yours.**
> *Because: 6% WHT was deducted on 60,000,000 of invoices. That's a credit against your income tax — but only against certificates you hold.* **You hold 4 of 11.**
> → *Chase the 7 missing certificates. We've drafted the requests.*

The first card is education. **The second card is a refund.** That is the only kind of financial education that has ever changed anyone's behaviour: a discovery about your own money, delivered at the moment it's worth something.

Once the engine exists, this costs almost nothing to produce — the engine already knows the reasoning. It just has to say it out loud.

---

## 9. The pipe — how Selah legally sees your URA position

This was the existential question. **It now has an answer.**

**✅ A company can hold the tax agent licence.** Tax Procedures Code Act **s.7(1)**: *"An individual, partnership, **or company** may apply to the Committee for registration as a tax agent."* Selah Solutions Ltd holds the licence directly. We need one qualified employee-nominee (degree + recognised tax course + professional certificate) and a director of good character. **That is a hiring problem, not a structural blocker.**

**✅ URA already built the consent mechanism.** The **client** logs into their own URA account → *e-Services → DT Agent Appointment* → enters Selah's agent TIN, the appointment dates, and **selects which tax types we may act on.** Scoped, bounded, revocable. Plus written permission under s.4(6).

> **We never hold a client's password. URA built the right door — we just have to be licensed to walk through it.**

**🔴 But there is no URA API for the data Radar needs.** No ledger API. No arrears API. No filing history. No WHT certificate retrieval. No system-to-system return submission. We searched exhaustively.

**✅ Except one: EFRIS.** URA's e-invoicing system has a genuine production API, an official **UAT readiness checklist**, and a **public register of accredited software integrators**. It won't show us a ledger — but it sits on **invoices**, which is where WHT is deducted, where VAT is collected, and where the records layer begins.

### What this means, honestly

**Selah is a licensed-agent service with software leverage — not pure SaaS.**

That is not a defeat. **It is the moat.** A foreign SaaS competitor cannot replicate a URA tax agent licence, a pooled bench of Ugandan accountants, and an accredited EFRIS integration. **The absence of an API is precisely what keeps QuickBooks and Xero out of this market.**

> **Open question we can settle for free:** can an appointed agent actually *see* the client's ledger and arrears in the URA portal? No amount of research answers this. **Get one licence, appoint one client, look.** Ten minutes decides whether Radar is a product or a service — and we should do it before we write a line of code.

---

## 10. The wedge — and a question for you

**Two products. One engine. And an honest question about which goes first.**

---

### 10A. RADAR — *what you owe, and what you're owed*

> **Here is what you owe. Here is what you're owed. Here is the net — and here is how to fix it.**

The first number gets attention. **The second number gets the credit card.** We are not selling anxiety; we are selling a reconciliation with a refund at the end of it.

### What Radar surfaces

| | |
|---|---|
| **Unclaimed WHT credits** | The Isaac case. Money URA is already holding that is yours. |
| **Silent arrears** | URA, NSSF — accruing at 2%/month with no notification event. |
| **TCC-readiness** | Including **the director trap**: we hold your TIN *and* your directors' TINs (URA requires both at registration anyway), so we can tell you your TCC will be refused **before the tender deadline**, not after. |
| **Filing calendar** | PAYE, WHT, NSSF, VAT — all monthly, by the 15th. Provisional tax. LST by 31 October. **The belief that tax is an annual event is precisely the belief that produces arrears.** |
| **Ledger deltas** | Continuously reconcile the client's books against their URA ledger. **URA has staffed an entire department to do this manually.** |

### And then — the cure

Radar is worthless as a diagnosis. Here is what makes it a business:

| Step | Legal basis |
|---|---|
| **1. Find the arrear** | Radar |
| **2. Disclose it voluntarily** | Where a taxpayer voluntarily discloses **before court proceedings commence**, the Commissioner may compound the offence — **interest and penalties may be waived entirely.** |
| **3. Agree an instalment plan** | URA's TCC criterion 5 expressly accepts *"a Memorandum of Understanding to pay in instalments"* as an alternative to full payment. The CG has publicly confirmed distressed businesses are **"not automatically disqualified."** |
| **4. Get the TCC** | |
| **5. Win the tender** | |

**Every step of that is in URA's own published rules. Nobody in Uganda is selling it as a product.**

---

### 10B. OPTIMISE — *what you can legally keep*

**Same engine. Opposite emotion.** Radar tells you what you owe. Optimise tells you what you never had to pay.

*(Full detail: `SELAH-STRUCTURING-GUIDE-v1.md`. Every figure below is computed from the FY2026/27 rules, not asserted.)*

| Lever | The finding | Who knows this? |
|---|---|---|
| 🔑 **The 3-year startup exemption** | **s.21(1)(za).** A citizen's new business pays **no income tax for three years.** No sector limit. Self-assessed. | **Not URA's website. Not PwC's tax summary.** |
| 🔑 **Dividends cost 40.5%** | 30% CIT, then 15% WHT on the distribution. **Salary can cost as little as 0%** — and is deductible at 30%. | Owners default to dividends *because that's what shareholders get.* They're volunteering 10.5 points. |
| 🔑 **The salary arbitrage band** | Every shilling up to **UGX 485,000/month** is taxed **below 30%** while **deducting at 30%.** Pure, legal arbitrage. | Almost nobody structures for it. |
| 🔑 **The retirement double exemption** | **Exempt going in** (s.19(2)(g)) and **exempt coming out** (s.21(1)(n)). | **RSM's guide wrongly limits it to NSSF — and in doing so, hides it.** |
| 🔑 **Medical insurance is uncapped** | s.19(2)(b) + s.19(8). Fully exempt to the employee, fully deductible to the employer. **No cap.** | The best benefit in the Act. |
| **The entity crossover** | Sole trader beats a company on tax **up to UGX 133,410,000 of profit** — exactly. Everyone assumes the reverse. | Computed, not guessed. |
| **Deductions are apportionable** | **There is no "wholly and exclusively" test in Uganda.** s.22(1)(a) says *"to the extent to which."* **Mixed-use expenditure is apportionable, not disallowed.** | Materially more generous than the market believes. |
| **The presumptive election** | A 40%-margin trader on 100m turnover pays **UGX 500,000** instead of **UGX 10,659,000** — *if* they're in the right regime. **Professionals are excluded.** | Half of Uganda's published guidance would route a consultant into the wrong regime. |
| **Employee or consultant?** | ***IDI v URA* [2024] UGCommC 319.** URA assessed UGX 1.9bn; TAT upheld it; **the High Court set it all aside.** URA's "fixed fee over two months = employee" rule is now expressly wrong in law. | A landmark, twenty months old, and not in any tax guide we found. |

> **This is the founder's own question — *"how do we avoid taxes, not evade?"* — answered, sourced, and computed.**
>
> **And it is a better sales conversation than Radar.** *"You may owe money"* is a threat. *"You may not have owed the tax you paid"* is a gift.

---

### 🔴 10C. The question I cannot answer for you

**Which product leads?**

| | **RADAR first** | **OPTIMISE first** |
|---|---|---|
| **Sells on** | Fear | Gain |
| **Proof** | *"URA is holding 3.6m of yours"* — verifiable, immediate | *"You may owe zero tax for three years"* — larger, but prospective |
| **Needs the licence?** | **Yes — blocking.** Cannot read a URA position without it. | **No.** Structuring advice needs no tax agent licence. **We could start Monday.** |
| **Needs portal access?** | **Yes** — and we still don't know if agents can see client ledgers | **No** |
| **Liability** | Moderate — we report what's there | 🔴 **HIGH.** Under **TPCA s.69(2)**, a licensed agent who aids a tax offence pays **double the tax evaded** and faces **5 years.** |
| **Time to first revenue** | Months (licence-gated) | **Weeks** |

> **The uncomfortable truth: Optimise is faster to market, sells better, and needs no licence — and it is the one that could put someone in prison.**
>
> **Radar is slower, harder, and safer.**
>
> **My instinct is to lead with Optimise's *findings* and Radar's *rigour*** — sell the Health Check as *"we'll tell you what you overpaid and what you owe,"* deliver both, and let the exemption check be the hook that gets the meeting. **But this is a real fork, and it is yours.** See the open questions at the end.

---

## 11. Roadmap

**We do not build Layer 1 first.** Calculators have no moat, no revenue and no retention — and once the engine exists, they're a weekend's work. They are the top of the funnel, not a phase.

| Phase | What | Why it comes here |
|---|---|---|
| **0. The licence** | Register Selah as a URA tax agent. **Start immediately — it gates everything.** | Nothing else is legal without it |
| **1. The Health Check** | Concierge. Manual. **Paid.** Run it on 20 consultants, by hand. **Both halves: what you owe (Radar) AND what you overpaid (Optimise).** | **Proves people pay before we build anything.** If 20 people pay, the engine is worth building. If they don't, we've saved a year. |
| **1b. The exemption check** | 🔑 **Three questions. Potentially three years of zero income tax.** Run it on every prospect — including ourselves. | **Needs no licence, no portal, no software. It is the cheapest possible hook, and it opens with a gift rather than a threat.** |
| **2. The engine** | Encode the rules. Versioned, tested, sourced. *(v1.1 of the spec already exists.)* | The asset |
| **3. Radar + Optimise** | Automate the Health Check. **Both products. One engine.** Arrears, WHT credits, TCC-readiness — *and* entity structure, extraction, benefits, classification. | The wedge |
| **4. The Calculator Centre** | 🔑 **All 53. Free, public, sourced, dated.** ~40 of them exist nowhere in Uganda today. Every one ends with a door: *"Want us to check whether URA is holding money that's yours?"* | **Falls out of the engine nearly free.** The SEO funnel, the trust machine, **the engine's public test suite** — and the first visible piece of the north star. |
| **5. Records + EFRIS** | The evidence vault. Pursue **accredited EFRIS integrator** status. | The one automatable pipe URA offers — and it sits exactly under the records layer |
| **6. Books + payroll** | Now we have a reason to touch monthly data. **Payroll is where Optimise lives permanently** — benefits, salary bands, classification. | Recurring revenue |
| **7. The bench** | Pooled accountants. Audit-readiness. Sign-off. | We now have demand, so accountants come to *us* |
| **8. Capital** | Verified books + tax history = underwriting data nobody else has | **On the map. Off the roadmap until 1–7 are real.** |
| **9. Kenya / Tanzania** | Same URA-shaped hole | Later |

> 🔑 **Note what phase 0 and phase 1b have in common: neither needs the licence, the portal, the engine, or a single line of code.** The tax agent registration takes months. **The exemption check takes an afternoon.** Start both on Monday.

> **AI is not a phase.** It is how every phase above is delivered — explanation, classification, document extraction, drafting the certificate-chase letters. Building "an AI Accountant" as a product is a category error. **The AI is only as good as the engine underneath it, and the engine is the hard part.**

---

## 12. Revenue model

*Structure is high-confidence. **Prices are hypotheses and must be validated in Phase 1.***

| Line | Model | When |
|---|---|---|
| **Tax Health Check** | One-off fee, or **contingency on money found** — recovered WHT credits *and* overpaid tax. **We only get paid if we find money.** | Phase 1 |
| 🔑 **Exemption check** | **Contingency on tax saved.** If we establish that a client qualifies under s.21(1)(za), we take a share of a **three-year tax holiday.** | **Phase 1b — needs no licence and no software** |
| **Optimise — structuring review** | One-off, per entity: structure, extraction, benefits, contracts. Then an annual re-review, because the law changes every July. | Phase 1 / 3 |
| **Radar subscription** | Monthly, per entity. Tiered by complexity. | Phase 3 |
| **Filing & agent services** | Per return / retainer. **We are the licensed agent — this is a service we can legally sell.** | Phase 3+ |
| **Payroll** | Per employee per month. **Optimise lives here permanently** — benefits, salary bands, classification. | Phase 6 |
| **Audit-readiness** | Seasonal package + pooled accountant time | Phase 7 |
| **Marketplace commission** | Accountants, auditors, lawyers | Phase 7 |
| **EFRIS integration** | Accredited integrator; per-client integration + support | Phase 5 |
| **Capital** | Interest / origination on the lending book, underwritten with Selah data | Phase 8 |

**The contingency lines are the most important rows in this table.** They remove all purchase risk for the customer, they are honest, and they prove the engine's value in the only way that matters: *we found you money, here is our cut.*

> 🔑 **And note what the exemption check does to the sales conversation.** Radar opens with *"you may owe money."* The exemption check opens with **"you may owe nothing, for three years."** Same engine, same meeting, opposite emotion — and no licence required to have it.

> ⚠️ **What we must not do:** URA explicitly warns that *"Taxpayers MUST never hand over the payment obligations for taxes exclusively to the tax agents."* **Selah will never hold client tax money.** We compute it, we file it, we remind them — the client pays URA directly. This is a hard product rule.

---

## 13. Why Selah wins

**Not because we are broader.** "Competitors focus on one area; we're integrated" is the most common losing sentence in startup proposals. QuickBooks didn't win by being broader — it won by being narrow and earning the right to expand.

We win because of four things a competitor cannot copy:

| | |
|---|---|
| **1. The engine** | Correct, versioned, tested Ugandan tax rules. **We have already found errors in URA's own website, PwC's published commentary, and Grant Thornton's tax guide.** Nobody is maintaining this. It compounds. |
| **2. The licence** | A URA tax agent registration held by the company. Renewable annually. **A foreign SaaS vendor cannot get one.** |
| **3. The bench** | Pooled Ugandan accountants who can sign off. Software cannot sign. |
| **4. EFRIS accreditation** | The one official pipe into URA's systems, with a formal certification programme almost nobody has completed. |

**Against QuickBooks / Xero / Sage / Zoho:** they are ledgers. They do not know Ugandan tax law, they cannot file a Ugandan return, they cannot hold a Ugandan tax agent licence, and they will never build EFRIS integration for a market this size. **They are not the competition. They are a component we can sit beside.**

**Against local accounting firms:** they *are* the incumbent, and they are also the bottleneck — 402 licensed agents against 1.4m businesses. **We should arm them, not fight them.** Phase 7 turns them from competitor into channel.

**Against spreadsheets:** this is the real competitor, and it wins on price. We beat it the only way anyone ever has: **by finding money the spreadsheet couldn't.**

---

## 14. What could kill this

*Stated plainly, because a proposal that doesn't say this is a wish.*

| Risk | Severity | Mitigation |
|---|---|---|
| **We get a number wrong.** | 🔴 **Existential.** Under TPCA s.69(2), a tax agent who aids a tax offence faces **double the tax evaded or UGX 5m, whichever is higher, and up to 5 years.** The risk is not operating without a licence — **it is operating with one and getting a client's return wrong.** | The engine. Versioned rules, executed test suites, confidence ratings, and a hard rule: **Confidence C → do not display a number. Route to a human.** |
| 🔴 **Optimise crosses the avoidance/evasion line.** | 🔴 **Existential — and higher than Radar's.** Uganda's GAAR (**ITA s.117**) lets the Commissioner **re-characterise any transaction whose form does not reflect its substance** — **with no mental element and no motive test.** Income splitting (s.63) is caught if tax is merely *"one of the reasons."* We would be suggesting structures **while holding a tax agent licence.** | **The guardrail is the product.** Every Optimise recommendation must state its substance requirement: *"This works only if [the commercial reality is genuinely present]. If URA asked why you did this — and 'tax' were not an allowed answer — could you answer?"* **A tax-optimisation tool without a hard-coded anti-avoidance guardrail is not a product. It is a liability with a user interface.** |
| **We rely on a case that gets overturned.** | 🟡 Medium | Optimise's employee/consultant module leans on ***IDI v URA*** (2024). **We could not confirm whether URA has appealed to the Court of Appeal.** Check with Ugandan counsel **before** shipping the classifier. |
| **Nobody pays.** | 🔴 High | **Phase 1 is designed to find this out for the price of 20 conversations.** Contingency pricing removes the customer's risk entirely. If they still won't pay, we stop. |
| **URA opens a public API** and commoditises the pipe | 🟡 Medium | The engine and the bench remain. And an API would *accelerate* us more than any competitor, because we'd be the only ones with correct rules to point at it. |
| **The tax agent licence is refused or delayed** | 🟡 Medium | Requirements are known and satisfiable. **Start now.** Note the licence **expires every 31 December** regardless of issue date — a P0 recurring task, forever. |
| **The concierge doesn't scale** | 🟢 Low, by design | It isn't supposed to. It's a validation instrument. |
| **We are wrong that agents can see client ledgers** | 🟡 Medium | **Test it in week one.** One licence, one client, ten minutes. If they can't, Radar becomes a records-and-reconciliation product rather than a URA-mirror product — still valuable, but a different build. |

---

## 15. The next 90 days

| # | Action | Why |
|---|---|---|
| **0** | 🔑 **Check whether SELAH ITSELF qualifies for the 3-year exemption.** Incorporated after 1 July 2025? ≥51% EAC-citizen owned? Registered capital under 500m? No founder **or relative** has claimed it before? | **This is a one-afternoon task that may be worth three years of zero income tax.** It also makes us our own first case study. **Do this first.** |
| **1** | **Begin URA tax agent registration.** Identify the employee-nominee (degree + recognised tax course + professional certificate). Confirm the fee and timeline with URA directly. | Gates Radar entirely. Longest lead time. **Note: the licence expires every 31 December regardless of issue date.** |
| **2** | **Get one licence, appoint one client, and look at the portal.** | Settles the single biggest unknown in the company for free. **Can an appointed agent actually see a client's ledger?** Ten minutes answers it. |
| **3** | **Run the paid Health Check on 20 consultants.** Isaac first. Contingency pricing. **Lead with the exemption check — it needs no licence and opens with a gift.** | Proves demand before we build. Generates the first revenue. |
| **4** | **Close the open items in both documents.** Download URA's FY2026/27 amendments PDF *in a browser* (their server blocks bots). Resolve the non-resident PAYE bands. **File a private ruling request (TPCA s.53)** on the s.21(1)(za) exemption — specifically the presumptive interaction and the meaning of "investment capital". | We cannot ship a number we can't source. **And a private ruling on (za) would be proprietary knowledge no competitor in Uganda has.** |
| **5** | **Check with Ugandan counsel whether URA appealed *IDI v URA*.** | The employee/consultant classifier rests on it. If it's on appeal, the module softens. |
| **6** | **Contact URA's EFRIS integration team.** Get the API specification and the UAT checklist. | The only automatable pipe. Start the relationship early. |
| **7** | **Do not build the app.** | Phases 0–2 require a spreadsheet, a licence, and twenty conversations. Nothing more. |

---

## 16. Impact

**For individuals** — money recovered that was always theirs. Awareness delivered at the moment it pays.

**For businesses** — arrears prevented rather than discovered. Audits that reconcile. TCCs that arrive before the deadline. Credit, eventually, priced on real books.

**For URA** — more taxpayers filing, filing correctly, and filing on time. **Selah is not a tax-avoidance product. It is a compliance product, and its interests are aligned with the revenue authority's.** Voluntary disclosure brings arrears *into* the system that would otherwise sit uncollected.

**For the economy** — formalisation. 1.4 million registered businesses against 12.9 million potential taxpayers is not a compliance problem. It is an infrastructure problem.

---

## Appendix — the evidence

**Two companion documents. Both are sourced to primary law, confidence-rated, and — where they contain numbers — executed rather than asserted.**

**`SELAH-RULES-ENGINE-SPEC-v1.1.md`** — the engine.
The corrected FY2026/27 PAYE bands; the complete five-band presumptive schedule (including the band missing from most published Ugandan tax tables); the full WHT rate card and credit mechanism; VAT registration and deregistration tests; the filing calendar; the penalty and voluntary-disclosure regime; the TCC criteria; the tax agent registration requirements; and an executable test suite.

**`SELAH-STRUCTURING-GUIDE-v1.md`** — Optimise.
The s.21(1)(za) three-year exemption; the UGX 133,410,000 entity crossover; salary vs dividend vs retention; the exempt-benefit list and the errors in RSM's version of it; the retirement double exemption; *IDI v URA* and the employee/consultant checklist; the apportionment test that everyone mistakes for "wholly and exclusively"; the presumptive election; and — running through all of it — **the GAAR guardrail.**

**It also contains its own errors, corrected.** The first draft of its test suite miscalculated PAYE on a UGX 15m salary by 500,000 shillings — in a document whose entire purpose is not making that mistake. Executing the rule caught it.

> **That is the thesis in miniature: tax rules cannot be hand-checked. They must be executed. Any number that has not been produced by running the rule and reconciling it against an independent path is not verified — it is just a number someone typed.**
>
> **Selah is the company that runs the rule.**

---

## Open questions for discussion

1. 🔴 **Radar or Optimise first?** See §10C. Optimise is faster to market, sells better, and **needs no licence** — and it is the one that carries criminal exposure. Radar is slower, harder, and safer. **This is the biggest decision in the document.**
2. **Does Selah qualify for the 3-year exemption?** I can't answer this without the incorporation date, the shareholding, and the registered capital. **If yes, it changes the funding conversation entirely.**
3. **Pricing.** Contingency on money found — for both overpaid tax *and* recovered credits? Or a flat fee? Contingency on a *three-year exemption* is a large number; how do we price it without being greedy?
4. **The bench.** Do we *employ* accountants, or contract them? The moat argues for employing; the economics argue for contracting. **And note the irony: we must apply our own IDI checklist to ourselves.**
5. **The lending arm.** Does it stay separate until Phase 8, or do existing borrowers become the Phase 1 cohort?
6. **Naming.** "Radar" and "Optimise" are working titles. What does the customer actually call these?
7. **Who is the nominee?** The tax agent licence needs a qualified person — degree, recognised tax course, professional certificate. **That hire is the critical path for Radar, and Radar is blocked without it.**
