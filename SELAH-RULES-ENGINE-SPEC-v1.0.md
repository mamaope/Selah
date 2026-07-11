# Selah Rules Engine — Specification

**Version:** 1.1
**Jurisdiction:** Uganda
**Tax year covered:** FY 2026/27 (1 July 2026 – 30 June 2027)
**Compiled:** 11 July 2026
**Status:** 5 of 7 open items closed. **2 remain, 1 of them blocking** (see §13)

### Changelog — v1.0 → v1.1

| Item | Outcome |
|---|---|
| **VAT quarterly trigger** (§8) | **CLOSED.** Auto-scales to **UGX 75,000,000**. The 37.5m figure was never statutory. Also found: **PwC is publicly wrong on the VAT threshold (says 250m; it is 300m) and wrong on deregistration.** |
| **150m presumptive edge case** (§5) | **CLOSED.** Resolved cleanly. s.4(5) governs eligibility; Schedule 3 is computational only. At exactly 150m → **ordinary regime**. |
| **TCC rules** (§11) | **CLOSED — and it answers the founder's question directly.** A **director's unfiled personal returns DO block the company's TCC.** A payment plan (MOU) **does** satisfy the compliance test. |
| **Tax agent registration** (§12) | **CLOSED — and it changes the shape of the company.** **A company can hold the licence.** There is a formal portal appointment mechanism. **But there is no URA API for ledgers, arrears, or filing.** |
| **Presidential assent date** (§13.2) | Partially closed. Sources conflict; EY's own alert contradicts itself. Not material — the amendments are in force. |
| **Non-resident PAYE bands** (§1) | **STILL OPEN — and worse than we thought.** The Act may have *repealed* the non-resident table entirely. **BLOCKING.** |
| **Enacted Act text** (§13.1) | **STILL OPEN.** Traced to a URA download that machine fetchers cannot retrieve. **Needs a human with a browser.** |

---

## 0. What this document is

This is the spine of Selah. Every calculator, every dashboard, every "you owe / you're owed" card, and every explanation Selah ever shows a user resolves back to a rule in this file.

It exists because of a single hard constraint:

> **If Selah's promise is "we tell you the number," then the number being right *is* the product.** One wrong band and Selah is not an app with a bug — it is the company that gave people wrong tax advice.

This spec is therefore **versioned, sourced, and dated**. Every rule carries a legal source, an effective date, and a confidence rating. Rules are never edited in place; they are superseded, and the old version is retained so that a return filed for FY2025/26 still computes under FY2025/26 law.

### Why this matters more than it sounds

While compiling this document we found that, as of today:

- **URA's own website still publishes the OLD PAYE bands** — superseded ten days ago.
- **Grant Thornton Uganda's published tax PDF** still carries the *pre-2020* presumptive table and a VAT threshold that is three reforms stale.
- **Global Law Experts, Lawyard, and The Independent** published a PAYE table that is flatly wrong — and *The Independent*'s table contradicts the body text of its own article.
- **PwC Uganda's April note is correct but incomplete** — it omits that the old 10% band was abolished entirely, which changes the answer for every single PAYE payer in the country.

Four professional sources, four different answers, in the same week. **This is the moat.** Nobody in Uganda is maintaining a correct, versioned, machine-readable set of these rules. That is the asset Selah is actually building; the calculators and dashboards are just its face.

### Confidence ratings used below

| Rating | Meaning |
|---|---|
| **A** | Confirmed against primary law (gazetted Act / statute) **and** at least one Big Four brief. Safe to compute and display. |
| **B** | Confirmed against multiple independent professional sources, but primary law not directly read. Safe to compute; display with a "verified [date]" stamp. |
| **C** | Single source, or sources conflict. **Do not display a number. Route to a human.** |

### Source hierarchy (in order of authority)

1. Gazetted Act / Acts Supplement to the Uganda Gazette
2. Income Tax Act **Cap. 338** (2023 revision) via ULII
3. URA official guidance — *authoritative when current, but frequently stale. Never trust without a date check.*
4. Big Four Uganda budget briefs (PwC, KPMG, Deloitte, EY)
5. Band 1 Kampala law firms (MMAKS, ENSafrica, Bowmans, etc.)

**Blacklisted sources** — do not ingest, do not cite: `globallawexperts.com`, `lawyard.org`, Tally Solutions Uganda guides, Grant Thornton Uganda's `doing_business_in_uganda_taxation.pdf`. All are stale or demonstrably wrong. Several appear to be AI-generated copies of one another's errors.

### ⚠️ Citation warning — the 2023 renumbering

The 2023 law revision renumbered the Income Tax Act. Most material online (and most accountants) still use the old citations.

| Old (pre-2023) | Current |
|---|---|
| Income Tax Act **Cap. 340** | Income Tax Act **Cap. 338** |
| **Second** Schedule (presumptive) | **Schedule 3** |
| **Third** Schedule (rates) | **Schedule 4** |

Selah must cite the current form. Using "Cap 340, Second Schedule" is a tell that a source has not been updated since 2023.

---

## 1. PAYE — employment income

**Rule ID:** `UG.PAYE.RESIDENT.2026`
**Effective:** 1 July 2026
**Supersedes:** `UG.PAYE.RESIDENT.2012` (in force 2012 → 30 June 2026)
**Source:** Income Tax (Amendment) Act 2026, cl. 20(a), substituting Part I of Schedule 4 — Bill No. 6 of 2026, Bills Supplement No. 2, Uganda Gazette No. 33 Vol. CXIX, 27 March 2026. Corroborated by KPMG Uganda Budget Brief 2026 (post-passage), MMAKS Advocates (13 Apr 2026), PwC Uganda (21 Apr 2026).
**Confidence:** **A** (see open item §13.1 — final Acts Supplement not yet retrieved)

### The statutory schedule is ANNUAL. Payroll uses the monthly derivation.

**Annual — resident individual**

| Chargeable income p.a. (UGX) | Tax |
|---|---|
| 0 – 4,020,000 | Nil |
| 4,020,001 – 4,920,000 | 20% of excess over 4,020,000 |
| 4,920,001 – 5,820,000 | 180,000 + 25% of excess over 4,920,000 |
| 5,820,001 – 120,000,000 | 405,000 + 30% of excess over 5,820,000 |
| Above 120,000,000 | 405,000 + 30% of excess over 5,820,000, **plus an additional 10%** of excess over 120,000,000 |

**Monthly — resident individual (what payroll actually runs)**

| Monthly chargeable income (UGX) | Tax |
|---|---|
| 0 – 335,000 | Nil |
| 335,001 – 410,000 | 20% of excess over 335,000 |
| 410,001 – 485,000 | 15,000 + 25% of excess over 410,000 |
| 485,001 – 10,000,000 | 33,750 + 30% of excess over 485,000 |
| Above 10,000,000 | 33,750 + 30% of excess over 485,000, **plus 10%** of excess over 10,000,000 |

**Top effective marginal rate: 40%.** The additional 10% charge above UGX 10m/month was retained — ICPAU and the Uganda Manufacturers Association both lobbied against it and lost.

### What changed on 1 July 2026 — and the trap

| | Old (to 30 Jun 2026) | New (from 1 Jul 2026) |
|---|---|---|
| Tax-free threshold | 235,000/mo | **335,000/mo** |
| First taxable band | 235k–335k **@ 10%** | **band abolished** |
| Next | 335k–410k @ 20% | 335k–410k @ 20% |
| Next | — | **410k–485k @ 25% (new)** |
| Next | 410k–10m @ 30% | 485k–10m @ 30% |
| Top | +10% above 10m (=40%) | +10% above 10m (=40%) |

> **⚠️ The trap.** PwC's public note says "the threshold rises to 335,000 and a new 25% band is introduced." True — but it does not say that **the 10% band is abolished outright**. Several Ugandan outlets read PwC and inferred the 10% band survived, and published tables showing 10% on 335k–410k. It does not survive. **The first taxable shilling above 335,000 is now taxed at 20%.** Selah must get this right; roughly half the published Ugandan tables currently do not.

**Sanity check (must pass in tests):** no resident taxpayer is worse off. At exactly 410,000/month: old = 25,000, new = 15,000. Every PAYE payer gains ≥ UGX 10,000/month.

### Worked example — UGX 1,000,000/month, resident

```
Gross monthly                        1,000,000
  0 – 335,000        @  0%         =         0
  335,001 – 410,000  @ 20% × 75,000 =    15,000
  410,001 – 485,000  @ 25% × 75,000 =    18,750
  485,001 – 1,000,000 @ 30% × 515,000 = 154,500
                                     ----------
PAYE                                    188,250
```
*Under the old bands this employee paid UGX 202,000. Saving: UGX 13,750/month.*

### Other PAYE rules

| Rule | Value | Confidence |
|---|---|---|
| Employee with **more than one employer** | Flat **30%** of total employment income. Employee may file a return of emoluments from all sources and claim any overpayment. | A |
| Residence test | Permanent home in Uganda; **or** present ≥183 days in any 12-month period; **or** present >122 days/yr averaged over the year and the two preceding years; **or** GoU employee posted abroad. | A |
| Remittance deadline | **15th of the following month** | A |

### 🔴 Non-resident individual bands — STILL OPEN, AND IT IS WORSE THAN A GAP IN OUR RESEARCH

**Confidence: F — cannot confirm. Engine must REFUSE to compute.**

Clause 20(a) of the gazetted Bill was read **in full, from two independent copies** (Parliament Watch and parliament.go.ug). Both extract identically. The clause substitutes **the whole of Part I** of Schedule 4 — which in the existing Act contains **both** the resident and non-resident tables — with a table headed:

> *"The income tax rates applicable to **resident** individuals are—"*

…and then goes straight to clause 20(b). **There is no non-resident table anywhere in the substituted Part I.**

This is independently corroborated: **EY's post-assent alert reproduces the same single resident table and no non-resident table.** So does MMAKS. **No source anywhere — Big Four, Band 1 firm, URA, or press — publishes a non-resident table for FY2026/27.**

Two readings, and we cannot distinguish them without the enacted text:

| Reading | Consequence |
|---|---|
| **(a)** The substitution genuinely omits non-resident rates | **A legislative gap from 1 July 2026.** A drafting error in the Act. |
| **(b)** The enacted Part I retains a non-resident paragraph that neither the Bill's PDF text layer nor EY's summary reproduced | The old table (or a new one) survives, and we simply cannot see it |

> 🔴 **Do NOT assume the old non-resident table carries forward.** A wholesale substitution of Part I would repeal it. Equally, do not code the gap as fact.
>
> **Engine behaviour: any non-resident individual → REFUSE. Return "we cannot compute this and here is why," and route to a human.** This is exactly the situation the confidence system exists for. Guessing here would be indistinguishable from the failure Selah exists to prevent.

**To close this:** download `https://ura.go.ug/en/download/tax-amendments-fy-2026-2027/` **in a browser** (URA's file server blocks automated fetchers; a human will get it) and read the reproduced Part I of Schedule 4. If it confirms a resident-only Part I, **escalate to URA in writing before shipping any non-resident payroll logic** — ideally as a private ruling request under TPCA s.53, which would produce a citable answer.

*For reference, the OLD (FY2025/26) non-resident monthly table — confirmed correct for periods up to 30 June 2026, and retained for historic computations: 0–335,000 @ 10% of the whole amount; 335,001–410,000 = 33,500 + 20% of excess; above 410,000 = 48,500 + 30% of excess; plus additional 10% above 10,000,000.*

---

## 2. NSSF

**Rule ID:** `UG.NSSF.2026`
**Source:** NSSF Act; RSM Uganda Tax Guide 2025/26
**Confidence:** B

| Component | Rate |
|---|---|
| Employee contribution | **5%** of gross monthly income |
| Employer contribution | **10%** of gross monthly income |
| **Total** | **15%** |
| Deadline | **15th of the following month** |

**This is the MamaOpe rule.** NSSF is charged on *gross*, not on chargeable income after PAYE. When a grant ends and payroll is restructured — staff moved to consultancy, hours cut, salaries deferred — the employer obligation does **not** simply stop. It accrues silently. Selah must model NSSF as an *accruing liability with no notification event*, which is exactly why nobody notices it until the arrears letter arrives.

**Net pay formula:**
```
Net = Gross − PAYE − NSSF employee (5%) − LST (where applicable) − other deductions
```
(Employer's 10% is a cost to the employer, not a deduction from the employee.)

---

## 3. Local Service Tax (LST)

**Confidence:** B

- Withheld by employer, remitted to the **local authority of the employee's residence** (not URA).
- Due within the first four months of the financial year — **by 31 October**.
- Penalty for late/non-remittance: **50% of the LST payable**.

> Note: LST is the most commonly missed employer obligation in Uganda, because it is the only one that isn't paid to URA. It should be a first-class citizen in Selah's compliance calendar, not a footnote.

---

## 4. Withholding tax — **the Isaac engine**

**Rule ID:** `UG.WHT.2026`
**Source:** ITA Cap. 338 s.118 et seq.; RSM Uganda Tax Guide 2025/26; Income Tax (Amendment) Act 2026
**Confidence:** A/B (2026 additions marked)

This is the single most commercially important section of the spec. **It is the section that finds Isaac's UGX 70 million.**

### Rates

| Payment type | Resident | Non-resident |
|---|---|---|
| **Professional / management / technical fees** | **6%** | 15% |
| Goods, materials or services > UGX 1,000,000 (designated agents & Govt) | **6%** | 6% or 15% |
| Dividends | 15% (**10%** if listed on USE, to resident individuals) | 15% |
| Interest | 15% | 15% |
| Interest on government securities | 20% | 20% |
| Royalties | property income | **15%** (raised from 5%, and **now includes software** — new 1 Jul 2026) |
| Rent | rental income | 15% (final) |
| Purchase of a business / business asset | 6% | 10% |
| Purchase of land (not a business asset), resident→resident | **0.5%** | — |
| Commission — insurance & advertising agents; payment service providers | 10% | 15% |
| Imports (goods) | 6% | 6% |
| Ship / air transport operators & charterers | — | 2% |
| Non-resident entertainer / sportsperson | — | 15% |
| **Public entertainers (resident)** | **6%** | — | *(new 1 Jul 2026, confidence B)* |
| **Interest on foreign debt to non-resident lenders** | — | **5%** | *(new 1 Jul 2026, confidence B)* |
| **Betting/sports winnings** | 15% | 15% | *(reintroduced 1 Jul 2026, confidence B)* |

**Remittance deadline: 15th of the month following payment.**
**DTA override:** Uganda has treaties with Denmark, India, Norway, Mauritius, Netherlands, South Africa, UK, Italy, Zambia. Treaty rates may be lower. EAC and Egypt treaties awaiting ratification.

### The credit mechanism — this is the product

> **WHT deducted from a resident consultant is a CREDIT against that consultant's income tax liability. It is not a cost. It is prepaid tax.**
>
> But the credit is only claimable **if the consultant holds the withholding tax certificate.** No certificate → no credit → the consultant pays tax on the same income twice.

**Most Ugandan consultants do not collect their certificates.** This is not a marginal problem. It is a systematic, silent, five-figure-USD transfer from small consultants to the state, every year, entirely by accident.

### Worked example — Isaac

```
Annual invoices to Govt / designated WHT agents   60,000,000
WHT deducted at 6%                                 3,600,000   ← prepaid tax
Certificates on file                                  4 of 11
Value of certificates HELD                         1,310,000   ← claimable
Value of certificates MISSING                      2,290,000   ← lost unless chased
```

**Selah Radar output:**
> **URA is holding UGX 3,600,000 that belongs to you.**
> 6% WHT was deducted on UGX 60,000,000 of invoices. That is a credit against your income tax — but only against certificates you hold. **You hold 4 of 11.**
> → *Chase the 7 missing certificates. We've drafted the requests.*

**Engine requirements this implies:**
1. Every invoice must be modelled with an *expected* WHT deduction.
2. Every payment received must be reconciled against the invoice to *detect* WHT deducted at source.
3. Every detected deduction must open a **certificate obligation** with a chase workflow.
4. The certificate itself must be captured and stored — **this is the records layer, and it is not optional.** Without it, the engine computes a credit the taxpayer cannot claim.

Isaac's 70m did not accumulate because the law was unclear. It accumulated because **nobody was keeping the paper.**

### Set-off

Presumptive tax is reduced by WHT credit and provisional tax credit on amounts included in gross turnover (Schedule 3, Part II). Foreign tax credit is available, capped at the Ugandan tax payable on the foreign-source income.

---

## 5. Presumptive tax — small business

**Rule ID:** `UG.PRESUMPTIVE.2020`
**Effective:** 1 July 2020 — **unchanged for FY2026/27**
**Source:** Income Tax (Amendment) Act 2020, s.9, substituting Parts I & II of the Second Schedule → now **Schedule 3, ITA Cap. 338**.
**Primary confirmation:** URA, *Taxation of Small Businesses*, Vol 1 Issue 4, FY 2024/25 (official URA taxpayer leaflet — held on file). Table reproduced **identically**, band for band, base for base. Also matches URA *Small Business Taxpayer* web page and URA *The Taxman*.
**Confidence:** **A — highest in this document.** This is the only section confirmed against a primary URA publication *and* the amending Act *and* independent professional sources, with all three in exact agreement.

### The table — ALL FIVE BANDS

| Gross turnover p.a. (UGX) | **Without records** | **With records** |
|---|---|---|
| Not exceeding 10,000,000 | **Nil** | **Nil** |
| 10,000,001 – 30,000,000 | **80,000** | **0.4%** of turnover in excess of 10,000,000 |
| 30,000,001 – 50,000,000 | **200,000** | **80,000** + **0.5%** of turnover in excess of 30,000,000 |
| **50,000,001 – 80,000,000** | **400,000** | **180,000** + **0.6%** of turnover in excess of 50,000,000 |
| 80,000,001 – 150,000,000 | **900,000** | **360,000** + **0.7%** of turnover in excess of 80,000,000 |

*The with-records bases are arithmetically forced and must reconcile: 0.4% × 20m = 80,000; 80,000 + 0.5% × 20m = 180,000; 180,000 + 0.6% × 30m = 360,000. Any source quoting 100,000 / 250,000 / 450,000 is using the **pre-2020** table and must be discarded.*

### 🔴 Corrections to the founder's working notes

1. **The 50m–80m band was missing entirely.** A business turning over UGX 65m would have been computed with no applicable rule. This is the exact class of silent error that destroys trust in a tax product.
2. **The 80m–150m "with records" figure was given as a flat 0.7%.** It is **360,000 + 0.7% of the excess over 80m**. On UGX 120m turnover: correct answer is 360,000 + 280,000 = **640,000**, not 840,000. A 200,000 error — in the taxpayer's disfavour.
3. **Correction to my own earlier criticism:** I said the "0.4% of the amount above the threshold" formula was wrong. **It was not — it was right.** The Schedule genuinely computes on the excess over the band floor. I was wrong to flag it, and the notes were correct on that point.

### The rules around the table

| Rule | Detail |
|---|---|
| **Tax is FINAL** | s.4(5). Final tax on business income. **No deductions** allowed for expenditure or losses incurred in producing business income. |
| **Credits — the one exception** | No tax credits are allowed **except withholding tax credit and provisional tax paid** on amounts included in gross annual turnover. *(URA leaflet, note (c); Schedule 3 Part II.)* |
| **Election out** | A resident taxpayer under 150m may elect **by notice in writing to the Commissioner** to be taxed normally instead (30% CIT, or individual rates, on ascertained chargeable income). A real planning lever — Selah should surface it, and should model both outcomes side by side. |
| **Exclusions (statutory wording)** | Does **not** apply to: *"medical, dental, architectural, engineering, **accounting**, **legal** or other professional services, public entertainment services, public utility services or construction services."* (s.4(8)) |

> 🔑 **The WHT credit survives even under presumptive tax.** This is easy to miss and it matters: a small trader whose customers withheld 6% at source can still set that against their presumptive liability — but *only* against certificates they hold. Presumptive tax kills every other deduction and credit, and keeps this one. **The certificate is therefore the single most valuable piece of paper a small Ugandan business owns, in every regime.** That is not a coincidence; it is the product.

> **⚠️ The exclusion list — and a warning about URA's own guidance.** URA's leaflet says only: *"professionals for example persons in dental, medical and architectural practice **among others**."* That vagueness is a trap. The **statute** is specific and much broader — it explicitly names **accounting, legal, engineering, construction, public entertainment and public utility** services too. Use the statutory wording; URA's taxpayer-facing summary is not sufficient to decide a case.
>
> **What this means for Selah's first customer: a solo consultant is EXCLUDED from presumptive tax** and taxed at full individual rates. The presumptive regime is for the *trader*, not the *consultant*. Isaac was never in it. Do not let a calculator quietly route a consultant into the wrong regime — that is a wrong-number failure of the exact kind this spec exists to prevent.

### Registration & filing — what you actually need

*Source: URA, Taxation of Small Businesses, FY 2024/25. This answers the founder's question: "what do you need to file tax returns for an individual and/or a business?"*

**A TIN must be registered before anything else. Requirements differ by how you registered:**

| You are a… | You need |
|---|---|
| **Individual** | National ID, **or** two other identifications (passport, village ID, employment ID, driver's permit, bank statement) |
| **Sole proprietor** | Certificate of registration + Statement of particulars |
| **Company** | TINs of **all directors** + Certificate of Registration/Incorporation + **Company Form 7** |

> ⚠️ **The company must already be registered with URSB before a TIN can be issued.** This is the legal-layer dependency in the founder's notes ("connect into legal with URSB/company registration") — and it's a hard ordering constraint, not a nice-to-have. URSB → TIN → tax account → filing. A startup that skips a step is stuck.
>
> 🔑 Note that a **company TIN requires the TINs of its directors.** This is the first hard evidence that URA links director identity to company identity at registration — which bears directly on the founder's question *"we always have arrears with URA that are unknown to us, either by company or directors?"* and on whether director arrears can block a company TCC. **See §13.5 — this raises the priority of that open item.**

**How presumptive tax is actually paid (the real flow, not the theory):**

```
ura.go.ug → e-Services → Payment Registration
  → Tax type: "Income Tax – Small Businesses"
  → Enter TIN, email, phone
  → INPUT THE AMOUNT YOURSELF, based on the brackets above
  → Choose mode (bank / mobile money / EFT) → register payment → pay
```

> 🔴 **Read that fourth line again. URA does not compute the tax. The taxpayer types in the amount.**
>
> There is no calculator, no validation, no band lookup. A trader turning over UGX 65m — the band that was missing from the founder's notes, and is missing from half the tax tables published in Uganda — is expected to find the right row and type the right number, unassisted. If they type too little, they attract an assessment. If they type too much, nobody tells them.
>
> **This is the product, stated by URA in its own leaflet.** Selah's small-business calculator isn't a convenience feature. It is the missing step in a government payment flow that currently relies on the taxpayer being their own tax engine.

### 🔴 The thresholds have DIVERGED

The presumptive ceiling (150m) and the VAT registration threshold (150m) used to be the same number. **From 1 July 2026 the VAT threshold is 300m.** They are no longer the same. Any rule, calculator, or mental model in Selah that assumes "150m is the small-business line" is now wrong in one direction or the other.

### ✅ CLOSED — the taxpayer at exactly UGX 150,000,000

**Resolved. Confidence B (statutory analysis; no URA position exists).**

The conflict is real and it is in the primary law, not in a paraphrase:

- **s.4(5)** — *"where the gross turnover … **is less than** one hundred fifty million shillings"* → **excludes** exactly 150,000,000
- **Schedule 3, top band** — *"exceeds Eighty million shillings but **does not exceed** one hundred and fifty million shillings"* → **includes** exactly 150,000,000

**It resolves cleanly, because Schedule 3 has no independent charging force.** Its own opening words are:

> *"**The amount of tax payable for purposes of section 4(5) is—**"*

Schedule 3 is a **rate card, not a gateway.** It computes; it does not qualify. It cannot bootstrap itself into application. Section 4(5) is the operative provision that diverts a taxpayer *into* the presumptive regime, and at exactly 150,000,000 it does not engage.

**Engine rule:**
```
turnover  <  150,000,000  → presumptive regime (Schedule 3), unless excluded (s.4(8)) or elected out
turnover ==  150,000,000  → ORDINARY regime (s.4(2)). Presumptive never engages.
turnover  >  150,000,000  → ordinary regime
```

**And note the practical grace in this:** because s.4(5) already lets *any* eligible taxpayer **elect out** into the ordinary regime, the taxpayer at exactly 150,000,000 lands by operation of law in precisely the position a taxpayer at 149,999,999 could freely choose. Presumptive tax is *final*, with **no deductions** — so at that turnover the ordinary regime is very likely the better outcome anyway. **No adverse consequence, no arbitrage.** Which is almost certainly why nobody has ever litigated it.

*Caveat, stated honestly: this is our legal analysis from the statutory text and ordinary canons of construction. **URA has published no position, and there is no case law.** If a real client sits exactly on the line, request a private ruling (TPCA s.53). The stakes are near-zero, but Selah should never present an unsourced analysis as a sourced rule.*

---

## 6. Corporate income tax

**Confidence:** A

| Rule | Value |
|---|---|
| Standard CIT rate | **30% of chargeable income** |
| Chargeable income | Gross income **less** allowable deductions under the ITA. *(Not "30% of gross profit" — the founder's notes phrase it this way; it is imprecise and will mislead.)* |
| Companies with turnover < 150m | Presumptive applies (§5) unless excluded or elected out |
| Non-resident branch | Additional **15%** on repatriated branch profits |
| Interest deduction cap (groups) | 30% of tax EBITDA; excess carried forward max 3 years. **Carried-forward losses now excluded from tax EBITDA** (new 1 Jul 2026) |
| Loss carry-forward | After 7 consecutive loss years, only **50%** of losses may be carried forward |
| **TIN rule** | Expenditure > **UGX 5,000,000** in one transaction from a supplier **without a TIN is DISALLOWED**. |

> The TIN rule is a quiet killer for startups. Pay a supplier UGX 6m in cash, no TIN, and the deduction vanishes at audit. Selah should block or flag this at the point of payment — not discover it eight months later. **This is a Harriet-class failure: the money was spent correctly, but the paperwork made it non-deductible.**

### Capital allowances (wear & tear, reducing balance)

| Class | Rate |
|---|---|
| Computers & data-handling equipment | **40%** |
| Plant & machinery — farming, manufacturing, mining | **30%** |
| Automobiles, buses, trucks, furniture, fixtures, and any asset not in another class | **20%** |
| Industrial buildings | **5%** straight-line, time-apportioned |
| Vehicle depreciation ceiling | UGX 60,000,000 (non-commercial vehicles) |
| Start-up costs | 25% deduction in year incurred + each of following 3 years |
| Initial allowance | **Abolished** from 1 July 2023 |

---

## 7. Rental income tax

**Confidence:** A

| Person | Tax |
|---|---|
| **Individual (resident)** | **12%** of chargeable income exceeding **UGX 2,820,000 p.a.** Nil below that. |
| **Company** | **30%** of chargeable income |
| Trustee | 30% of chargeable income |
| Partnership | Individual rates, on total rental + other income summed |

**Expense cap:** for a person **other than an individual or partnership**, deductible expenditure in producing rent is capped at **50% of rental income**.

⚠️ **Note the 2,820,000 threshold has NOT moved**, even though the PAYE annual threshold moved from 2,820,000 → 4,020,000 on 1 July 2026. They used to be the same number. **They are no longer.** Any Selah rule that reuses "2,820,000" as a generic personal allowance is now wrong for PAYE and right for rent. Keep them as separate constants.

**New 1 Jul 2026 (confidence B):** individuals may now elect **monthly provisional rental income tax returns**.

### Worked examples

*Individual, UGX 6,000,000 rental income p.a.*
```
(6,000,000 − 2,820,000) × 12% = 381,600
```
*(The founder's notes give 318,000 here — a transposition. The correct figure is 381,600.)*

*Company, UGX 24,000,000 rental income p.a., expenses 12,000,000*
```
Expenses allowed: lower of actual (12,000,000) and 50% cap (12,000,000) = 12,000,000
Chargeable: 24,000,000 − 12,000,000 = 12,000,000
Tax: 12,000,000 × 30% = 3,600,000
```

---

## 8. VAT

**Confidence:** A (rate), B (new threshold)

| Rule | Value |
|---|---|
| Standard rate | **18%** |
| **Registration threshold (annual)** | **UGX 300,000,000 p.a.** — raised from 150,000,000 on 1 July 2026 |
| **Registration trigger (quarterly)** | **UGX 75,000,000** in any 3 consecutive calendar months — **✅ CLOSED, see below** |
| **Deregistration test** | 3 months ≤ **75,000,000** **AND** 12 months ≤ **225,000,000** — **cumulative. See the trap below.** |
| Filing & payment | **15th of the following month** |
| Input VAT claim window | Within **6 months** of the invoice date |
| Refund trigger | Input exceeds output by > UGX 5,000,000; claim within 3 years |
| Cash-basis accounting | Permitted if taxable supplies ≤ UGX 500m p.a., or supplier to Government. Commissioner's approval required. |
| **VAT withholding** | **Disapplied where an EFRIS e-invoice/e-receipt is issued** (new 1 Jul 2026) |
| Blocked input VAT | Passenger automobiles & their repair; entertainment; electronic services |
| Time of supply — Government | **Cash basis** — VAT falls due when Government *pays*, not when invoiced |

> **VAT is collected by the business, not paid by it.** The founder's note that VAT is *"just collected by the company but not paid by it"* is conceptually correct — but a business that spends collected VAT as if it were revenue creates a liability it cannot see. **This is a Radar case: VAT held on behalf of URA is not your money, and Selah should ring-fence it visually.**

### ✅ CLOSED — the quarterly trigger. It auto-scales, and the reason is elegant.

**Confidence: B (high). The 37.5m figure was NEVER a statutory number.**

VAT Act Cap 349, **s.7(1)** does not hard-code an amount. It says a person must register within 20 days of the end of any 3 calendar months in which taxable supplies exceeded:

> *"**one-quarter of the annual registration threshold set out in subsection (2)**"*

And s.7(2) is the *only* place a number lives. So **37,500,000 was simply 150,000,000 ÷ 4** — a derived figure, never legislated.

**The 2015 precedent proves the mechanism is live:** when s.7(2) went 50m → 150m, the quarterly trigger moved 12.5m → 37.5m automatically. Nobody amended a "12.5m", because there was no such figure to amend.

**Therefore, from 1 July 2026: s.7(2) = 300,000,000 ⇒ quarterly trigger = UGX 75,000,000.**

> **The feared scenario does not arise.** A business on 160m/year with seasonal spikes is *not* dragged into VAT at 37.5m.
>
> **But the limb is still real, still binding, and still the FASTER test.** That same business **must** register if it exceeds **75m in any three consecutive calendar months** — even though its annual turnover is far below 300m. And **s.7(1)(b) is forward-looking**: registration is triggered at the *beginning* of a quarter where there are "reasonable grounds to expect" supplies will exceed 75m. **A seasonal business must self-assess prospectively, not just retrospectively.** Selah's VAT module must model both limbs, and must project forward — not just look back.

### 🔴 The deregistration trap — and PwC is wrong about it in public

VAT Act **s.9(2)**, verbatim: a taxable person may apply to cancel registration only if, for the most recent 3 calendar months, taxable supplies do **not exceed one-quarter of the annual threshold**, **AND** for the previous 12 calendar months do **not exceed 75 percent of the annual threshold**.

From 1 July 2026 that is **cumulative**:

```
last 3 months  ≤  75,000,000          AND
last 12 months ≤ 225,000,000   ← 75% of 300m, NOT 300m
```

> **PwC's public commentary says businesses "with annual turnover below UGX 300 million" can now deregister. That is wrong on the statute.** The 12-month limb is **75% of the threshold = 225m**.
>
> **A business turning over 260m/year is below the registration threshold but CANNOT meet the deregistration test.** It is stuck: not required to register, not entitled to deregister. (The only route out is the Commissioner General acting under s.9(4)(b).) This is a genuine gap between the registration and deregistration tests that the 2026 amendment did not address — **and there is a real population of Ugandan businesses sitting in it right now, being advised by their accountants that they can come off VAT.**
>
> **This is a Selah product, fully formed, sitting in a two-word discrepancy that a Big Four firm got wrong in print.**

### 🔴 The 250m vs 300m error — and how to read professional sources

The Bill as tabled proposed **250m**. **Parliament amended it to 300m on passage** ([Parliament of Uganda, 21 April 2026](https://www.parliament.go.ug/news/4409/mivumba-hit-30-tax-parliament-raises-vat-threshold-shs300m)).

- **Sources written off the Bill say 250m** — MMAKS (13 April, and correct *at the time*, explicitly analysing Bills).
- **PwC Uganda's blog (4 June) and a Daily Monitor op-ed (2 June) both say 250m and both describe it as what "Parliament approved."** Both are by the **same author**. That is **one wrong source, not two** — and it is a PwC source, published after passage, still wrong today.

> **The lesson for the engine's source pipeline:** *stale draft* and *independent corroboration* are different failure modes and both are lethal. Two articles agreeing means nothing if they share an author. **The rule: corroboration must be independent at the level of the human being who wrote it.**

---

## 9. Filing calendar

**Confidence:** A

| Obligation | Who | Deadline |
|---|---|---|
| **PAYE return + remittance** | Employers | 15th of following month |
| **WHT return + remittance** | Withholding agents | 15th of following month |
| **NSSF remittance** | Employers | 15th of following month |
| **VAT return + payment** | VAT-registered | 15th of following month |
| **Excise duty return** | Excisable suppliers | 15th of following month |
| **Provisional tax — companies** | Non-individuals | **2 instalments**: by end of month 6 and month 12 of the tax year. Each = (50% × estimated annual tax) − WHT already withheld |
| **Provisional tax — individuals** | Individuals | **4 instalments**: by last day of months 3, 6, 9, 12. Each = (25% × estimated annual tax) − WHT already withheld |
| **Provisional return — companies** | Companies | Within 6 months of accounting year start |
| **Provisional return — individuals** | Individuals | Within 3 months of accounting year start |
| **Self-assessment return (final)** | All | **Last day of the 6th month after the tax year end** |
| **Local Service Tax** | Employers → local authority | **31 October** |

**Answering the founder's question — "are we expected to file once or twice a year?"**

Neither. It is a **continuous obligation**, not an annual event:

- **Monthly:** PAYE, WHT, NSSF, VAT (all by the 15th)
- **Provisional:** twice a year (companies) or four times (individuals)
- **Annually:** one final self-assessment return, 6 months after year end
- **Annually:** LST by 31 October

**The belief that tax is an annual event is precisely the belief that produces arrears.** This should be a founding message of the product.

**Tax period:** you may apply to amend your accounting year-end (e.g. Jan–Dec instead of Jul–Jun) against your TIN.

---

## 10. Penalties & interest — how arrears actually grow

**Confidence:** A

| Offence | Penalty |
|---|---|
| **Interest on unpaid tax** | **2% per month** *(VAT: 2% per month **compounded**)* |
| Understating provisional tax estimate | 20% × (tax on 90% of final chargeable income − tax on estimated chargeable income) |
| Failure to maintain proper records | **Double the tax payable for the period** |
| Failure to apply for registration | Double the tax payable from the last day of the application period |
| Failure to provide information | UGX 20,000,000 |
| Default in furnishing a return | Fine ≤ UGX 2,000,000 and/or ≤ 6 years imprisonment |
| VAT — default in furnishing return | UGX 200,000 |
| False or misleading statements | Fine ≤ UGX 50,000,000 and/or ≤ 10 years imprisonment |
| No e-invoice / EFRIS | **Double the tax due** |
| Late/non-remittance of LST | 50% of LST payable |
| Transfer pricing policy not produced in 30 days | UGX 50,000,000 |

> **2% per month, compounding on VAT, is ~27% a year.** This is the mathematics of how a forgotten UGX 4m NSSF or VAT liability becomes an UGX 11m problem in five years without anyone doing anything wrong. **Selah Radar's core computation is not "what do you owe" — it is "what is the accruing balance, and what will it be in 12 months if you do nothing."**

**Voluntary disclosure:** where a taxpayer voluntarily discloses an offence to the Commissioner **before court proceedings commence**, the Commissioner may compound the offence — the taxpayer pays the outstanding tax and **no interest or fine**.

> 🔑 **This is Selah's single most valuable legal fact.** It converts Radar from a diagnosis into a *cure*. Find the arrear, disclose it voluntarily, and the penalty and interest can be waived. Isaac's, MamaOpe's and Harriet's cases are all candidates. **This should be the headline of the commercial pitch.**

---

## 11. Tax Clearance Certificate (TCC) — ✅ CLOSED

**Legal basis:** Tax Procedures Code Act **Cap 343, s.50** (Part XII). *Note the renumbering: formerly s.43 of Act 14 of 2014.* URA's TCC form is additionally headed *"Issued under Sec. 134 Income Tax Act"* — **both are cited in practice.**

### 🔑 The five criteria — URA's official definition of "tax compliant"

**Confidence: A.** Verbatim from [URA's TCC page](https://ura.go.ug/en/tax-clearance/):

1. The registration profile of the taxpayer should be **up to date**
2. The taxpayer should have **submitted all the returns** for the registered tax types
3. **For Non-Individuals, the associated persons (directors or partners) MUST have submitted all their returns**
4. The submitted returns **MUST be satisfactory**
5. **All taxes due must have been paid** by the taxpayer **or there is a Memorandum of Understanding to pay in instalments**

> 🔴 **CRITICAL — the TPCA is COMPLETELY SILENT on issuance criteria.** s.50 says only who must obtain a TCC. It contains **no definition of "tax compliant," no criteria, no validity period, no SLA.** All five criteria above are **administrative, not statutory.** A TCC decision is therefore a discretionary "tax decision" — which means it is **objectionable under TPCA s.24 and appealable to the Tax Appeals Tribunal.** That is the taxpayer's remedy against an arbitrary refusal, and most Ugandan business owners do not know it exists.

### 🔑 ANSWERING THE FOUNDER'S QUESTION

> *"For some reason we always have arrears with URA that are unknown to us, either by company or directors?"*

**The answer splits, and the split is the whole insight:**

| | Blocks the company's TCC? | Confidence |
|---|---|---|
| Director's **unfiled personal returns** | **YES — categorically.** Criterion 3, URA's own words. | **A** |
| Director's **unpaid personal arrears** | **NOT STATED BY URA.** | **C** |

**Read criterion 5 again carefully.** The payment test is *"all taxes due must have been paid by **the taxpayer**"* — i.e. the applicant entity. The "associated persons" test in criterion 3 is limited to **submission of returns**. **URA nowhere states that a director's personal debit balance blocks the company.**

> **So: a company can be perfectly clean — every return filed, every shilling paid — and still be refused a TCC because a passive, absentee, or long-forgotten director has never filed a personal income tax return.**
>
> **That is the mechanism. That is what happened.** It is the single biggest structural trap for Ugandan companies, it is invisible from inside the company's own ledger, and **it is a Radar feature that writes itself:** the moment Selah holds a company's TIN and its directors' TINs (which URA requires at registration anyway — see §5), it can compute TCC-readiness *before* the tender deadline, not after the refusal.

**Do NOT code director *arrears* as a hard block.** One low-grade consultancy blog asserts it; URA does not, no Big Four firm does, no Band 1 firm does. **Treat it as a soft warning flag pending a written URA confirmation.** The clean way to settle it is a **private ruling request under TPCA s.53**, which would give Selah an A-grade, citable answer — and, incidentally, a piece of proprietary knowledge no competitor has.

**Reverse direction — can a company's arrears block a *director's personal* TCC?** **Confidence F — nothing found in either direction.** The "associated persons" test appears only under the Non-Individual limb. Open question.

### Payment plans — ✅ arrears do NOT have to be cleared in full

**Confidence: A.** Two independent URA sources. Criterion 5 expressly offers the MOU alternative, and URA's Commissioner General has stated that financially distressed businesses with outstanding obligations are **"not automatically disqualified"** — they may apply for an instalment plan and then a TCC, *"which may be issued subject to the terms of the agreed arrangement."*

**Statutory hook:** TPCA **s.45** (deferment of payment of tax).

> 🔑 **Combine this with the voluntary-disclosure waiver in §10 and you have the entire Selah commercial proposition in one sentence:**
>
> **Find the arrear → disclose it voluntarily (penalties and interest may be waived) → agree an instalment plan → get the TCC → win the tender.**
>
> Every step of that is in URA's own published rules. Nobody is selling it as a product.

**Caveats:** it is *"may* be issued," not *"shall"* — discretion is retained. The MOU must be **adhered to**; default re-opens the block, and URA can **cancel** a TCC.

### The two types of TCC — and the 12-month myth

**Confidence: A.**

| | **Annual TCC** | **Transactional TCC** |
|---|---|---|
| Scope | Tied to a stated **year of income** | **Addressee-specific, purpose-specific, period-specific** |
| Eligibility | Only for taxpayers whose **compliance has been monitored ≥ 3 years** | Available to anyone |
| Expiry | Tied to the year of income stated | **Consumed on delivery.** "Once submitted by the client to the third party, the transactional tax clearance **expires**." |

> 🔴 **There is NO statutory validity period, and NO 12-month expiry.** Several secondary sources claim "a TCC is valid for one year." **That is not supported by any URA source** and looks like contamination from the Kenyan (KRA) regime. **Do not build a 12-month expiry rule.**
>
> **Note the eligibility gate on the Annual TCC: three years of monitored compliance.** A startup cannot get one. It is on transactional TCCs — one per tender, one per counterparty — for its first three years. **That is a recurring, per-deal pain point, which is to say: a recurring, per-deal product.**

### Application route

URA portal → log in (TIN + password) → **e-Services → Tax Clearance Certificate** → select **Annual** or **Transactional**. For transactional: supply the **addressee's TIN**, the **purpose** (dropdown + free text), and the **tax period**.

**Documents to upload: effectively none.** URA checks its own systems — your registration profile, filing history and ledger. **It is a systems check, not a document exercise.** Which is precisely why it fails for reasons the taxpayer cannot see.

**Routing:** application → **verification officer** → **approving officer**, who approves or rejects *"after considering your profile."* **Two discretionary human hand-offs** — the real source of variance against the published SLA.

**SLA — sources conflict (Confidence C):** 2 working days (URA SOP language) / ~4 days (DIT Advocates) / 5 days (URA's own TCC guide). **Safe statement: URA targets 2–5 working days; assume up to 5 — and budget ledger-reconciliation time separately, which is where the real delay lives.**

**Verification tool:** URA runs [Document Authentication](https://ura.go.ug/en/document-authentication/) (Tax Tools → Document Authentication → "Tax clearance" → certificate reference number). **Useful if Selah ever needs to validate a TCC a counterparty presents** — e.g. for the lending arm.

### When a TCC is legally REQUIRED

**Confidence: A** (statutory), from TPCA s.50:

| Trigger | Basis |
|---|---|
| **Supplying goods or services to Government** | **s.50(3)** — this, *not* the PPDA Act, is the cleanest statutory basis |
| Passenger transport, or freight with a goods vehicle ≥ 2 tonnes | s.50(1) |
| Warehousing, or clearing and forwarding services | s.50(2) |
| Transferring funds abroad > 2,500 currency points (**UGX 50,000,000**) | ITA s.134 |
| Government tenders (mechanism) | PPDA **Standard Bidding Documents** list "Tax Clearance certificate or its equivalent" as an administrative-eligibility document |
| Work permits | DCIC requires the **sponsoring organisation's** TCC (Confidence B) |
| Mining / mineral rights | Ministry of Energy (Confidence B) |

**Sanction:** TPCA **s.64(1)(e)** — failing to obtain a TCC before performing an act specified in s.50 is an **offence**, fine up to **100 currency points**. At UGX 20,000/currency point → **max UGX 2,000,000**.

> ⚠️ **Two claims to STRIKE from the founder's notes and from any Selah marketing:**
> - **Land transfers do NOT require a TCC.** What's required is a **TIN** for land transactions above UGX 10m, plus stamp duty (1%) and any CGT. The "TCC for land" claim traces back to blacklisted sources.
> - **Bank loans do NOT legally require a TCC.** Banks may demand one as a commercial credit condition. That is private contract, not law. *(Relevant to the lending arm: Selah could require one — and verify it via URA's Document Authentication tool.)*

### 🔑 NSSF is a SEPARATE document — and this is a trap

**PPDA's bidding documents list the Tax Clearance certificate (item b) and the Social security contribution certificate (item c) as TWO SEPARATE requirements.**

> **Unremitted NSSF does not, of itself, block a URA TCC — but it will still sink the bid.**
>
> **This is MamaOpe's case, precisely.** A company can hold a valid TCC, believe itself compliant, and still lose the tender on an NSSF certificate it did not know it needed. **Selah's compliance model must therefore be MULTI-AUTHORITY from day one — URA and NSSF are different regulators, different ledgers, different certificates, and being clean with one tells you nothing about the other.** Any product that models "compliance" as a single URA number is modelling the wrong thing.

### What causes TCC refusals in practice

1. **Registration profile not up to date** — stale directors, addresses, tax types. Criterion 1. A very common *silent* blocker.
2. **Any unfiled return on ANY registered tax head** — not just income tax. VAT, PAYE, WHT, provisional, rental.
3. **Directors' unfiled personal returns** — criterion 3. *The structural trap.*
4. **Returns judged "unsatisfactory"** — nil returns, EFRIS/VAT mismatches.
5. **Any outstanding ledger balance** absent an MOU — **including penal tax and interest, not just principal**, and including **unremitted PAYE and WHT**, which sit on the ledger as arrears.
6. **URA-side ledger errors.** URA operates **dedicated Ledger Reconciliation Sections** at its Service Centres and at URA Tower, Nakawa. **PwC lists "taxpayer ledger reconciliations" as a standing URA focus area.** An unreconciled balance is treated as an arrear by the approving officer, **and the taxpayer bears the burden of getting it corrected.**

> 🔑 **Point 6 is the founder's exact complaint — *"arrears with URA that are unknown to us"* — and URA has an entire department for it.** The existence of a Ledger Reconciliation Section is an admission that the ledgers are wrong often enough to need one. **A product that continuously reconciles a client's own books against their URA ledger, and surfaces the delta, is not a nice-to-have. It is the thing URA itself has staffed a department to handle manually.**

---

## 12. THE PIPE — ✅ CLOSED, and the answer changes the shape of the company

**Legal basis:** Tax Procedures Code Act **Cap 343, Part III** (ss.4, 6–12, 17). Read verbatim from ULII.

This section was the existential question: *can Selah legally see a client's URA position, and can any of it be automated?* Both halves now have answers, and **they point in opposite directions.**

### ✅ THE GOOD NEWS: a COMPANY can hold the licence

**TPCA s.7(1), verbatim — Confidence A:**

> **"An individual, partnership, or company may apply to the Committee for registration as a tax agent."**

**Unambiguous. Selah Solutions Ltd can hold the tax agent licence itself.** No founder has to hold it personally. This was the single biggest structural risk to the company and **it is not a risk.**

**How a company registers (s.8(2)):** the entity holds the licence; a named **employee-nominee** carries the qualification. The Committee must be satisfied that:
- the **nominee** is "a fit and proper person to prepare tax returns and transact business with the Commissioner General … on behalf of a taxpayer"; **and**
- a **director, manager or other executive officer** of the company "is of high integrity and good character."

**Nominee qualifications (s.8(3)):** a **degree or post-graduate award** in a relevant discipline; **and/or** a **course in taxation recognised by the Committee**; *(a third limb — 24 months' practice before 1 July 2016 — is a grandfathering clause and is time-locked; a 2026 entrant cannot use it).*

> ⚠️ **The statute says "or". URA describes it as "and".** Plan for **cumulative**: degree + recognised tax course + professional certificate. ICPAU's **Certified Tax Advisor (CTA)** is the obvious route to the "recognised course" limb.

**Also required: Selah must itself hold a valid TCC.** The application form has a mandatory *"Enter Valid TCC number"* field. **Selah must be compliant before it can sell compliance.** (Read §11 again, in the mirror.)

**The Committee (TARC), s.6(2):** Commissioner General (chair), one **ICPAU** nominee, one **Uganda Law Society** nominee, two private-sector experts. **s.6(3): the Commissioner General maintains the register.**

**Registration = a hiring problem, not a structural blocker.** One qualified employee-nominee and a clean director. That is solvable.

### 🔴 THE LICENCE DIES EVERY 31 DECEMBER

**s.8(4), verbatim:** *"The registration of a tax agent shall remain in force from the date of issue of the certificate of registration to the 31st day of December of the year of issue."*

**Regardless of when in the year it was granted.** A licence issued in November lasts about six weeks.

**s.9 — renewal:** apply **within 21 days before expiry**, prescribed form, prescribed fee.

> 🔴 **A lapse on 1 January turns every subsequent client action into a s.72 offence.** This goes in Selah's own compliance calendar as a P0 recurring task, forever. **The company that sells deadline-tracking cannot miss its own deadline.**

### ✅ CLIENT AUTHORISATION IS A SOLVED PROBLEM — two layers, both real

**1. Statutory (s.4(6)) — Confidence A.** A registered tax agent may use a taxpayer's TIN if:
- (a) the taxpayer has given **written permission**, and
- (b) the agent uses it **only** for that taxpayer's tax affairs.

→ This is Selah's engagement-letter / power-of-attorney clause. **One per client.**

**2. System — the URA portal has a formal agent-linking function. Confidence A.**

**The TAXPAYER (not the agent) logs into their own TIN account** → **e-Services → DT Agent Appointment** → selects "Tax Agent" → enters the **agent's TIN**, the licence period, **appointment start and end dates**, and **selects the specific tax types** the agent may act on → validates → adds.

> 🔑 **This is the pipe, and it exists.** It is **scoped by tax type and bounded by date** — which is exactly the consent architecture a serious product would want, and it means **Selah never needs to hold a client's password.** The credential-sharing path (which was legally grey and security-hostile) is not merely unwise — **it is unnecessary.** URA built the right door. Use it.

**Statutory scope of what an agent may do (s.7(3)):**
- (a) **preparation, certification and filing** of tax returns, information returns, statements and reports;
- (b) preparation of **rulings, objections, protests, refund claims, tax certificate requests, compromise settlements, abatements** and correspondence with URA;
- (c) **meetings and hearings** on the taxpayer's behalf.

*(Note: advocates are carved out of registration for limbs (b) and (c) — but **NOT** for (a). **An advocate still needs to be a registered tax agent to file a return.**)*

### 🔴 THE COMPLIANCE BURDEN SELAH INHERITS (s.17)

For **every** return Selah prepares or assists with, it must:
- issue the client a **signed certificate** stating its sources and certifying that it examined their documents — **or** a written statement of why it will not;
- **declare on the return** which of the two it did;
- produce it to the Commissioner General on demand;
- **retain copies for 5 years.**

**This is a product requirement, not a footnote.** It should be generated automatically, per return, from day one.

**And the criminal exposure is not the one we thought:**

| Offence | Penalty |
|---|---|
| **s.72** — acting as a tax agent **unregistered** | ≤ 24 currency points (**UGX 480,000**) and/or 1 year |
| **s.69(2)** — aiding/abetting a tax offence **as a tax agent** | **double the tax evaded, or ≤ 250 currency points (UGX 5,000,000), whichever is HIGHER** — and/or **5 years** |

> 🔴 **s.69(2) is the real exposure, and it is an order of magnitude worse than s.72.** The risk isn't operating without a licence. **The risk is operating WITH one and getting a client's return wrong.** Which is, once again, the argument for this entire document.

**URA's own warning, and a hard product rule:** *"Taxpayers MUST never hand over the payment obligations for taxes exclusively to the tax agents."* → **Selah must never hold client tax money.** Compute it, file it, remind them — but the client pays URA directly.

### 🔴 THE BAD NEWS: THERE IS NO URA API FOR ANY OF IT

**This is the finding that constrains the roadmap. Confidence B- (absence of evidence, exhaustively searched).**

| What Radar needs | Does an API exist? |
|---|---|
| Read a client's **tax ledger** | **NO** |
| Read **arrears / outstanding balances** | **NO** |
| Read **filing history** | **NO** |
| Retrieve **WHT certificates** | **NO** |
| **File returns** system-to-system | **NO** |
| A URA **developer portal** / OpenAPI spec | **NO** |
| A **tax-agent-facing** integration programme | **NO** |

**There is no public URA developer portal. There is no tax-account API. Radar cannot be fully automated today.**

### ✅ BUT — EFRIS IS A REAL API, WITH A REAL CERTIFICATION PROGRAMME

**Confidence A. This is the most commercially important finding in the entire document.**

URA's e-invoicing system (**EFRIS**, TPCA ss.73A–73B) has a genuine, official, production **system-to-system API**, and URA runs a formal **accreditation programme for third-party software integrators**:

- URA publishes a **list of accredited EFRIS software integrators** *"who have fulfilled all URA's integration requirements."* Successive official editions: Aug 2022, Jan 2024, Apr 2024, Jun 2024, **Feb 2025**.
- URA publishes an **"EFRIS System-to-System Integration UAT Readiness Checklist"**, built against the **EFRIS Interface User Requirements Specifications v1.5**, to guide developers into URA's **User Acceptance Test** process.
- URA's EFRIS Handbook: *"the URA IT team **shall provide support** to the taxpayers' IT team during the integration process."*

**The pathway is real and named:** build → complete the UAT readiness checklist → pass URA UAT → **get listed as an accredited EFRIS integrator.**

**And here is the seam:** **EFRIS produces pre-filled VAT returns.** So an accredited integrator **controls the data that pre-fills its clients' VAT returns.**

> 🔑 **EFRIS is scoped to sales, purchases, e-invoices, e-receipts, credit/debit notes and stock. It is an e-invoicing API, NOT a tax-account API — it will never show you a ledger.**
>
> **But it is the one door URA has actually opened, it has a certification programme with a published checklist, and it sits on the transaction data that everything else in Selah is downstream of.** Invoices are where WHT is deducted. Invoices are where VAT is collected. Invoices are where the records layer begins.
>
> **EFRIS accreditation is not a side quest. It is the only automatable pipe URA offers, and it happens to sit exactly under the records layer.**

### 🎯 WHAT THIS MEANS FOR THE BUILD — the honest architecture

| Layer | Automatable today? |
|---|---|
| **The engine** (§1–§10) | **YES** — it's just correctly encoded law. Build it. |
| **Records / evidence vault** | **YES** — and EFRIS accreditation feeds it directly |
| **e-invoicing, VAT data, transaction capture** | **YES — via the EFRIS API. This is the automatable pipe.** |
| **Reading ledgers, arrears, filing history, WHT certificates** | **NO API.** Registered agent + portal appointment + **human (or browser automation) in the loop.** |
| **Filing returns** | **NO API.** But returns are filed by **uploading a macro-enabled Excel template** — so there *is* a machine-readable artefact at the boundary. **Selah can generate the upload file programmatically; a human clicks submit.** |

> **The strategy this implies, plainly:**
>
> **Radar is a licensed-agent service with software leverage — not a pure SaaS product.** That is not a defeat. It is the moat. A foreign SaaS competitor cannot replicate a URA tax agent licence, a pooled bench of accountants, and an accredited EFRIS integration. **The absence of an API is precisely what keeps QuickBooks and Xero out.**
>
> **Sequence:** register as a tax agent → run the concierge Tax Health Check on 20 consultants (human-in-the-loop, using the portal appointment mechanism, entirely legally) → build the engine underneath → pursue EFRIS accreditation to automate the records layer → automate the rest as and when URA opens doors.
>
> **Nothing about the plan requires an API that doesn't exist. Everything about the plan is blocked without the licence. Start the licence.**

### Open sub-items on the pipe

| Item | Status |
|---|---|
| **Can an appointed agent actually SEE the client's ledger and arrears in the portal?** | **NOT CONFIRMED (C).** No URA page states it. Circumstantial support is strong (URA ran a ledger-reconciliation session *for tax agents*; the appointment is tax-type-scoped). **This is the single most important unknown left. Test it empirically: get one licence, appoint one client, look.** |
| Can an agent retrieve **WHT certificates**? | **NOT CONFIRMED (F).** |
| Application & renewal **fee** | UGX 200,000 quoted, but from a **2021** source. Verify with URA. |
| TARC **decision turnaround** | **Not published anywhere.** |
| **Current number of licensed agents** | Only figure found is **402 — from 2019.** Now ~7 years stale. **But note the context: 402 agents against 1.4m registered businesses. If even roughly true, the agent population is minuscule relative to the base — which is strategically excellent for Selah.** |
| **Public register of licensed agents** | **Exists and is public**, at ura.go.ug → "Choose a Licensed DT Agent". Columns include **Licence Expiry Date**. → *This is a public dataset exposing every competitor's licence status. Worth scraping.* |

---

## 13. Open items

### ✅ CLOSED in v1.1

| # | Item | Outcome |
|---|---|---|
| **13.4** | VAT quarterly trigger | **CLOSED.** Auto-scales to **75,000,000**. 37.5m was never statutory — s.7(1) says *"one-quarter of the annual registration threshold."* See §8. |
| **13.5** | TCC rules & director arrears | **CLOSED.** Director's **unfiled returns** block the company TCC (A). Director's **unpaid arrears** — not stated by URA (C), treat as soft flag. Payment plan **does** satisfy the test (A). See §11. |
| **13.6** | The exactly-150m edge case | **CLOSED.** s.4(5) governs eligibility ("less than"); Schedule 3 is computational only ("*for purposes of section 4(5)*"). At exactly 150m → **ordinary regime**. See §5. |
| **13.8** | Tax agent registration *(added in v1.1 — it should have been on the v1.0 list and wasn't)* | **CLOSED.** **A company can hold the licence (s.7(1)).** Portal appointment mechanism exists, scoped by tax type and date. **But no URA API for ledgers, arrears or filing.** See §12. |
| **13.2** | Presidential assent date | **Partially closed.** Sources conflict — **EY's own alert contradicts itself** (says 18 May in the summary; says "not yet assented" in an editorial note). KPMG implies late June. **Not material:** every source agrees the amendments are in force from 1 July 2026. |

### 🔴 STILL OPEN

| # | Item | Risk | Next action |
|---|---|---|---|
| **13.3** | **Non-resident individual PAYE bands — UNKNOWN, and possibly REPEALED.** Clause 20(a) substitutes the whole of Part I of Schedule 4 with a **resident-only** table. Read in full from two independent copies of the gazetted Bill; EY and MMAKS reproduce the same resident-only table. **No source anywhere publishes a non-resident table for FY2026/27.** | 🔴 **BLOCKING** for any non-resident payroll. Engine must **REFUSE to compute.** | Download the URA FY2026/27 amendments PDF **in a browser**, read Part I of Schedule 4. If resident-only is confirmed → **private ruling request (TPCA s.53)** before shipping anything. |
| **13.1** | **Enacted Act text (Acts Supplement) not retrieved.** ULII is CAPTCHA-gated; parliament.go.ug's Acts repository stops at 2024; URA's file server returns empty bodies to automated fetchers. | Low-medium. Parliament *did* amend this Bill during passage (rejected the remittance tax, the non-business-asset CGT, and the 0.5% minimum tax on loss-makers; changed the VAT threshold 250m → 300m). **The resident PAYE table survived unchanged (Confidence B — EY's post-assent alert reproduces it identically).** | **A human with a browser can close this in five minutes:** `https://ura.go.ug/en/download/tax-amendments-fy-2026-2027/` — a 4 MB PDF, created 17 June 2026, described by URA as the amendments *"as passed by parliament and assented to."* |

### 🟡 Verify empirically (cheap, high-value)

| Item | How |
|---|---|
| **Can an appointed tax agent actually see a client's ledger, arrears and WHT certificates in the URA portal?** *(The single most important unknown remaining. It determines whether Radar is a product or a manual service.)* | **Get one licence. Appoint one client. Look.** No amount of desk research settles this; ten minutes in the portal does. |
| Tax agent application & renewal **fee** (UGX 200,000 is a 2021 figure) | Ask URA |
| TARC decision **turnaround time** (not published anywhere) | Ask URA |
| **Current count of licensed tax agents** (402 is a **2019** figure) | Scrape URA's public "Licensed DT Agents" register |
| URA's **Client Service Charter** (would settle the 2 vs 4 vs 5-day TCC SLA) | Download in a browser |

### 🔵 Monitor

**URA has published NO updated PAYE rate table or calculator** as at 11 July 2026 — `ura.go.ug/en/domestic-taxes/paye-rates/` still shows the 235,000 threshold, eleven days after it was superseded. There is currently **zero URA confirmation** of the new bands in official rate guidance — only the legislature and the advisory firms.

URA *has* launched **nationwide taxpayer dialogues** (from 7 July 2026 — Kampala, Jinja, Mbale, Lira, Gulu, Arua, Hoima, Mbarara, Masaka, Fort Portal), broadcast on UBC/Bukedde/BBS. **Re-check URA's rate pages weekly.**

> 🔑 **Sit with this for a second.** Eleven days into the new tax year, **the Uganda Revenue Authority's own website is telling every employer in the country to use the wrong PAYE bands.** Not a competitor. Not a blog. The tax authority. **If you ever doubted whether the engine is the product, that is your answer.**

---

## 14. Governance — how this file stays true

The spec is worthless if it rots. Grant Thornton's PDF proves that a respected firm can publish a stale table for years without noticing.

1. **Rules are immutable.** Never edit a rule in place. Supersede it, with an effective date, and keep the old version — a FY2025/26 return must still compute under FY2025/26 law.
2. **Every rule carries:** rate/formula, legal source, effective date, confidence, worked example, and a test case.
3. **Every displayed number carries a "verified [date]" stamp** and links to its rule.
4. **Confidence C = do not display.** Route to a human. This is a hard product rule, not a guideline. The cost of a wrong number is the company.
5. **Budget cycle watch.** Uganda's tax amendments land with the budget: bills tabled ~April, passed ~June, effective **1 July**. Selah must run a mandatory spec review every **March–June**, and ship updated rules **before 1 July**, not after. Every year, without exception.
6. **Sources are versioned too.** Maintain the blacklist. Re-check URA's own pages for staleness rather than trusting them.

---

## 15. Test suite — non-negotiable before launch

These must pass, and must be run against every rule change:

```
PAYE_2026_01   335,000/mo resident            → 0
PAYE_2026_02   410,000/mo resident            → 15,000
PAYE_2026_03   485,000/mo resident            → 33,750
PAYE_2026_04   1,000,000/mo resident          → 188,250
PAYE_2026_05   5,000,000/mo resident          → 1,388,250
PAYE_2026_06   15,000,000/mo resident         → 4,888,250
PAYE_REGRESS   no resident pays MORE under 2026 rules than 2025 rules, at any salary
PAYE_NONRES    any non-resident               → REFUSE (confidence C)

PRESUMP_01     turnover  9,000,000            → 0
PRESUMP_02     turnover 20,000,000, records   → 40,000
PRESUMP_03     turnover 20,000,000, no records→ 80,000
PRESUMP_04     turnover 40,000,000, records   → 130,000
PRESUMP_05     turnover 65,000,000, records   → 270,000     ← the band that was MISSING
PRESUMP_06     turnover 65,000,000, no records→ 400,000
PRESUMP_07     turnover 120,000,000, records  → 640,000
PRESUMP_08     consultant, any turnover       → EXCLUDED, route to individual rates
PRESUMP_09     turnover exactly 150,000,000   → deterministic (see 13.6)

RENT_01        individual, 6,000,000 p.a.     → 381,600
RENT_02        company, 24,000,000, exp 12m   → 3,600,000

WHT_01         60,000,000 invoiced to Govt    → 3,600,000 credit, 11 certificates expected
WHT_02         certificate missing            → credit UNCLAIMABLE, open chase workflow

THRESH_01      VAT threshold ≠ presumptive ceiling   (300m vs 150m)
THRESH_02      PAYE annual threshold ≠ rental threshold (4,020,000 vs 2,820,000)

VAT_01         quarterly trigger        → 75,000,000  (one-quarter of 300m, NOT 37.5m)
VAT_02         160m/yr, 80m in one qtr  → MUST REGISTER (quarterly limb bites first)
VAT_03         forward-looking test     → expected >75m in coming qtr → register at qtr START
VAT_04         dereg: 3mo ≤75m AND 12mo ≤225m   (NOT 300m — the 75% limb)
VAT_05         260m/yr turnover         → below reg threshold, but FAILS dereg test → STUCK

TCC_01         director has unfiled personal return → company TCC BLOCKED (hard)
TCC_02         director has unpaid personal arrears → WARN only (not a hard block)
TCC_03         company arrears + agreed MOU         → TCC may still issue
TCC_04         company < 3 years old                → Annual TCC unavailable; transactional only
TCC_05         NSSF unremitted                      → TCC unaffected, but PPDA bid FAILS
```

The last two tests exist because those pairs of numbers **used to be equal and no longer are.** They are the errors Selah is most likely to make, because every accountant in Uganda still has the old pairing in their head.

### Verification status — every figure above was executed, not asserted

All PAYE, presumptive and rental cases in this suite were computed programmatically on 11 July 2026 and reconciled against the rules in §1, §5 and §7. Three independent checks passed:

- **Annual ↔ monthly consistency:** the statutory annual schedule, divided by 12, reproduces the monthly table at every tested salary. (If it didn't, one of the two tables would be wrong.)
- **Regression:** swept every salary from 0 to 20,000,000 in 1,000-shilling steps. **Zero taxpayers pay more under the 2026 rules than the 2025 rules.** This matches KPMG's stated intent and is a strong signal the reconstructed bands are correct.
- **Presumptive band continuity:** the with-records formula is continuous across all four band boundaries (30m, 50m, 80m) — no cliff, no gap.

> **This process found a real error.** The first draft of this suite asserted PAYE on UGX 15,000,000/month as 5,388,750. Executing the rule returns **4,888,250** — a 500,000 shilling error, made by hand, in a document whose entire purpose is not making that error.
>
> **That is the lesson, and it is the reason this section exists.** Tax rules cannot be hand-checked. They must be *executed*. Any Selah figure that has not been produced by running the rule and reconciling it against an independent path is not verified — it is just a number someone typed.

---

## Sources

- [Income Tax (Amendment) Bill 2026 — gazetted, Bills Supplement No. 2, Uganda Gazette No. 33 Vol. CXIX, 27 Mar 2026](https://pwatch-backend-production.up.railway.app/media/bill_documents/Income_Tax_Amendment_Bill_2026_1.pdf)
- [Income Tax (Amendment) Act 2020 — Parliament of Uganda (presumptive schedule)](https://bills.parliament.ug/attachments/Income%20Tax%20(Amendment)%20Act%202020.pdf)
- [KPMG — Uganda: Tax amendments based on 2026/2027 budget passed by Parliament (26 Jun 2026)](https://kpmg.com/us/en/taxnewsflash/news/2026/06/uganda-tax-amendments-2026-2027-budget.html)
- [KPMG — Uganda Budget Brief 2026](https://assets.kpmg.com/content/dam/kpmgsites/ke/pdf/thought_leaderships/tax/2026/Uganda-Budget-Brief-2026.pdf)
- [MMAKS Advocates — Tax proposals FY 2026/2027 (13 Apr 2026)](https://www.mmaks.co.ug/articles/2026/04/13/tax-proposals-financial-year-20262027)
- [PwC Uganda — Proposed PAYE changes and how they will impact you (21 Apr 2026)](https://www.pwc.com/ug/en/press-room/proposed-PAYE-changes-and-how-they-will-impact-you.html)
- [PwC Worldwide Tax Summaries — Uganda, Corporate: Taxes on corporate income](https://taxsummaries.pwc.com/uganda/corporate/taxes-on-corporate-income)
- [RSM Eastern Africa — Uganda Tax Guide 2025/26](https://www.rsm.global/uganda/sites/default/files/media/Uganda%20Resources%20Page/RSMEA_Uganda%20Tax%20Guide%202025-26%20-%202026.pdf)
- **URA — *Taxation of Small Businesses*, Vol 1 Issue 4, FY 2024/25** (official URA leaflet, held on file) — primary confirmation of the presumptive schedule, registration requirements and payment flow
- [URA — Small Business Taxpayer (presumptive)](https://ura.go.ug/en/taxes-on-small-businesses/)
- [URA — PAYE rates](https://ura.go.ug/en/domestic-taxes/paye-rates/) *(⚠️ stale as at 11 July 2026 — still shows pre-July-2026 bands)*
