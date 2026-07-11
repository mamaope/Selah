# The Selah Calculator Centre

**Every financial calculation a Ugandan needs. In one place. Free. And right.**

*Version 1 — 11 July 2026 · FY2026/27*

---

## Why this is not "just marketing" — I was wrong about that

Earlier in this project I called the calculators "the marketing budget." That undersold them. Here is the corrected argument, in four parts.

**1. The calculators ARE the engine, made visible.** Every calculator is a rendering of a rule in `SELAH-RULES-ENGINE-SPEC`. There is no separate "calculator codebase." **If the calculator is right, the engine is right — and the public can check.**

**2. In Uganda, being *complete and correct* is itself the differentiator.** The existing calculators (Aren, Sente, and a long tail of blog widgets) do **PAYE, and maybe WHT.** That's it. Nobody does presumptive tax. Nobody does the VAT quarterly trigger. Nobody does taxable benefit valuation. Nobody does penalty-and-interest projection. And several of the ones that exist **are currently wrong** — because the bands changed on 1 July 2026 and URA's own website hasn't caught up.

**3. This is a trust machine.** A Ugandan business owner will not hand over their URA credentials to a company they've never heard of. **But they will use a free calculator.** And when Selah's PAYE calculator gives a different answer from URA's own website — and Selah shows the gazetted Act to prove it — that is the most powerful marketing event available to us. *We are not asking for trust. We are demonstrating competence on a page that costs us nothing.*

**4. Each one is a door.** Every calculator ends with a question only Selah can answer:

> *PAYE calculator →* **"Your employer may still be using the old bands. Want us to check your last 6 months?"**
> *WHT calculator →* **"URA may be holding money that's yours. Want us to find out how much?"**
> *Presumptive calculator →* **"You may be in the wrong regime. We can model both."**
> *Startup exemption checker →* **"You may owe no income tax at all, for three years."**

> **The calculators are free, complete, correct, and they cost us almost nothing once the engine exists. That is not a marketing budget. That is a moat with a public API.**

---

## The rule that governs every calculator

**Every calculator must show its working.** Not just the answer — the *reasoning*, on the user's own numbers, with the rule and the source.

This is the financial-literacy strategy, executed. Not an articles section. Not an AI tutor. **The explanation, attached to the number, at the moment it's worth money.**

```
Your PAYE this month: UGX 188,250

  Gross                                    1,000,000
  First 335,000                    @  0%           0   ← tax-free threshold
  Next   75,000  (335,001–410,000)  @ 20%      15,000
  Next   75,000  (410,001–485,000)  @ 25%      18,750   ← new band, 1 July 2026
  Remaining 515,000                 @ 30%     154,500
                                             --------
                                              188,250

  ⚠️ Under the OLD bands you would have paid 202,000.
     If your employer is still using the old table, you are being over-deducted
     by UGX 13,750 a month.

  Source: Income Tax (Amendment) Act 2026, Schedule 4 Part I. In force 1 July 2026.
  Note: URA's own rate page still displays the superseded bands. [why?]
```

**And every calculator carries a confidence badge.** Where a rule is Confidence C — like the non-resident PAYE bands, which may have been repealed — **the calculator refuses to compute and says why.** That refusal is a feature. It is the loudest possible signal that we are the ones who actually checked.

---

## The full inventory

**Tier 1 = build with the engine. Tier 2 = fast follow. Tier 3 = the personal-finance layer.**
**"Exists in Uganda?" = does any correct, public, free calculator already do this?**

### A. Employment & payroll

| # | Calculator | Rule source | Exists in Uganda? | Tier |
|---|---|---|---|---|
| 1 | **PAYE — resident** (gross → net) | Sch. 4 Pt I | ✅ Yes — **but several are now WRONG** | **1** |
| 2 | **PAYE — non-resident** | Sch. 4 Pt I | 🔴 **We refuse to compute.** May be repealed. | **1** |
| 3 | **Net-to-gross (reverse PAYE)** — *"I want them to take home X"* | Sch. 4 Pt I | ❌ **No** | **1** |
| 4 | **NSSF** (5% / 10% / 15%) | NSSF Act | 🟡 Rare | **1** |
| 5 | **Local Service Tax** | LST rules | ❌ **No** — and it's the most-missed obligation | **1** |
| 6 | **True cost of an employee** (gross + 10% NSSF + LST + leave + severance accrual) | Multiple | ❌ **No** | **1** |
| 7 | **Multiple-employer checker** — flat 30% trap, and how to reclaim | s.19 | ❌ **No** | **2** |
| 8 | **Motor vehicle benefit** — `(20% × A × B/C) − D`, with 35% RB depreciation | Sch. 6 | ❌ **No** *(and URA's own page omits the 35%)* | **2** |
| 9 | **Housing benefit** — lower of market rent or 15%, **grossed up** | Sch. 6 | ❌ **No** | **2** |
| 10 | **Employee loan benefit** — vs BoU discount rate | Sch. 6 | ❌ **No** | **2** |
| 11 | **Terminal benefits** — the 75% formula, **correctly applied** | s.19(4) | 🔴 **No — and the internet is full of the WRONG version** *(it is not gratuity)* | **2** |
| 12 | **Exempt benefit optimiser** — medical, retirement, ESAS | s.19(2) | ❌ **No** | **2** |

### B. Business income tax

| # | Calculator | Rule source | Exists? | Tier |
|---|---|---|---|---|
| 13 | **Corporate income tax** (30% of chargeable income) | s.4 | 🟡 Trivially | **1** |
| 14 | **Presumptive tax** — all 5 bands, with/without records | Sch. 3 | 🔴 **NO. And most published tables are missing the 50–80m band.** | **1** |
| 15 | **Presumptive election modeller** — presumptive vs ordinary, side by side | s.4(5) | ❌ **No** | **1** |
| 16 | **Sole trader vs company** — the **UGX 133,410,000** crossover | s.4 + Sch. 4 | ❌ **No** | **1** |
| 17 | **Extraction optimiser** — salary vs dividend (**40.5%!**) vs retain | Multiple | ❌ **No** | **1** |
| 18 | **Provisional tax instalments** — 2 for companies, 4 for individuals | s.112 | ❌ **No** | **2** |
| 19 | **Capital allowances schedule** — 40/30/20 reducing balance, 60m vehicle cap | Sch. 7 | ❌ **No** | **2** |
| 20 | **Start-up cost deduction** — 25% × 4 years | s.29 | ❌ **No** — almost nobody claims it | **2** |
| 21 | **Loss carry-forward + 0.5% minimum tax alarm** | s.36(6a) *(new 1 Jul 2026)* | ❌ **No** | **2** |
| 22 | **Rental income** — individual (12%) vs company (30%, 50% expense cap) | s.5 | 🟡 Rare | **1** |
| 23 | 🔑 **3-year startup exemption eligibility checker** | **s.21(1)(za)** | 🔴 **NO — it isn't even on URA's exemptions page** | **1** |

### C. Withholding tax

| # | Calculator | Rule source | Exists? | Tier |
|---|---|---|---|---|
| 24 | **WHT by payment type** — the full rate card, resident & non-resident | s.118 et seq. | 🟡 Partial (Sente) | **1** |
| 25 | 🔑 **WHT credit reconciler** — *"how much was withheld from me, and do I hold the certificates?"* | s.128 | 🔴 **NO. This is the Isaac product.** | **1** |
| 26 | **Am I a designated withholding agent?** | s.119 | ❌ **No** | **2** |

### D. VAT

| # | Calculator | Rule source | Exists? | Tier |
|---|---|---|---|---|
| 27 | **VAT inclusive / exclusive** (18%) | VAT Act s.24 | ✅ Yes | **1** |
| 28 | **Registration threshold checker** — annual **300m** AND quarterly **75m**, **forward-looking** | VAT Act s.7 | 🔴 **NO — and everyone still thinks it's 150m / 37.5m** | **1** |
| 29 | **Deregistration eligibility** — 3mo ≤75m **AND** 12mo ≤**225m** | VAT Act s.9(2) | 🔴 **NO — and PwC's public guidance on this is WRONG** | **1** |
| 30 | **Input VAT recoverability** — blocked items (passenger cars, entertainment, e-services) | VAT Act | ❌ **No** | **2** |
| 31 | **EFRIS deduction blocker** — *"this supplier is EFRIS-designated; without an e-invoice this expense is not deductible"* | s.22(3)(m) | ❌ **No** | **2** |

### E. Customs, excise & other taxes

| # | Calculator | Rule source | Exists? | Tier |
|---|---|---|---|---|
| 32 | **Landed cost** — import duty + VAT + WHT 6% + infrastructure levy 1.5% + IDF 1% | EACCMA | 🟡 Rare, and usually incomplete | **2** |
| 33 | **Excise duty** | Excise Tariff Act | ❌ **No** | **3** |
| 34 | **Stamp duty** — transfer 1.5%, lease 1%, share capital 0.5% | Stamps Act | ❌ **No** | **2** |
| 35 | **Capital gains** — with **indexation** (not available if sold within 12 months) | s.50 | ❌ **No** | **2** |
| 36 | **Motor vehicle advance tax** — 50k/tonne, 20k/seat | s.123A | ❌ **No** | **3** |

### F. Compliance — 🔑 the ones nobody has even attempted

| # | Calculator | Rule source | Exists? | Tier |
|---|---|---|---|---|
| 37 | 🔑 **Penalty & interest projector** — **2%/month, compounding on VAT.** *"Your UGX 4m arrear becomes UGX 11m in five years if you do nothing."* | s.148, TPCA | 🔴 **NO. This is Radar's beating heart.** | **1** |
| 38 | 🔑 **Voluntary disclosure calculator** — *"disclose now and the interest and penalties may be waived. Here is what that is worth: UGX X."* | TPCA | 🔴 **NO** | **1** |
| 39 | 🔑 **TCC readiness checker** — including **the director trap** (a director's unfiled personal return blocks the company's TCC) | URA criteria | 🔴 **NO** | **1** |
| 40 | **Filing calendar generator** — PAYE/WHT/NSSF/VAT by the 15th; provisional; LST by 31 Oct; return at month 6 | Multiple | ❌ **No** | **1** |
| 41 | **Employee-or-consultant classifier** — the ***IDI v URA*** three-limb test, scored, with exposure across **all three regulators** | ITA s.2, NSSF Act, Employment Act | 🔴 **NO** | **2** |
| 42 | **Penalty exposure calculator** — what an audit finding actually costs | TPCA | ❌ **No** | **2** |

### G. Personal finance *(Layer 2 — generic, not Uganda-specific, cheap)*

| # | Calculator | Tier |
|---|---|---|
| 43 | Budget planner | **3** |
| 44 | Loan / amortisation schedule | **3** |
| 45 | Savings & compound interest | **3** |
| 46 | 🔑 **Retirement projector — with the double exemption** *(exempt in, exempt out)* | **2** |
| 47 | Net worth tracker | **3** |
| 48 | Emergency fund | **3** |
| 49 | Debt payoff (snowball / avalanche) | **3** |

### H. Investment *(Layer 2 → the "grow financially" question)*

| # | Calculator | Tier |
|---|---|---|
| 50 | **Treasury bill / government bond yield** *(note: interest on govt securities = 20% WHT; secondary-market disposal is exempt)* | **2** |
| 51 | **Unit trust / UAP-style return projector** | **3** |
| 52 | **Mortgage affordability** | **3** |
| 53 | **Business valuation** (for the lending arm) | **3** |

---

## The count

| | |
|---|---|
| **Total calculators** | **53** |
| **Tier 1 — ship with the engine** | **21** |
| **That already exist, correctly, free, in Uganda** | **~4** |
| **That exist but are CURRENTLY WRONG** (post-1 July 2026) | **several** |
| 🔴 **That do not exist anywhere** | **~40** |

> **Forty calculators that no Ugandan can currently access — and once the engine exists, each one is a form and a function call.**
>
> **This is what "one-stop centre" actually means, and it is achievable in a way that "one-stop financial platform" is not.** The platform takes years. **The calculator centre takes the engine plus a front end.**

---

## Where this fits — and the one thing I still won't move on

**The calculator centre is the fastest, cheapest, most defensible thing Selah can put in public.** It is:
- the SEO funnel,
- the trust demonstration,
- the public test suite for the engine,
- the top of every sales conversation,
- and the visible proof of the north star.

**And it is genuinely the "one-stop centre."**

**The one thing I still hold:** the calculators come **after** the engine, not instead of it — because a calculator without a correct, versioned rules engine underneath is exactly what Aren, Sente and URA's own website already are: **a number, typed by someone, that used to be right.**

Build the engine. Then the calculators fall out of it, all 53 of them, nearly free — and every one of them is right, sourced, and dated.

**That is the difference between the fifth PAYE calculator in Uganda and the only one anybody trusts.**

---

**Companions:** `SELAH-RULES-ENGINE-SPEC-v1.1.md` (the rules) · `SELAH-STRUCTURING-GUIDE-v1.md` (Optimise) · `SELAH-PROPOSAL-v1.md` (the plan)
