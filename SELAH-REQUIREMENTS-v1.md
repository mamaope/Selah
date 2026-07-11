# Selah — Requirements

*Version 1 — 11 July 2026*
**Status: for sign-off before any build begins.**

---

## 0. How to read this

This document consolidates seven prior artefacts into one buildable specification.

| Source | Contributes |
|---|---|
| `SELAH-PROPOSAL-v1.md` | Scope, wedge, roadmap, revenue |
| `SELAH-RULES-ENGINE-SPEC-v1.1.md` | The rules — verified, versioned, tested |
| `SELAH-STRUCTURING-GUIDE-v1.md` | Optimise's content |
| `SELAH-CALCULATOR-CENTRE-v1.md` | The 53 calculators |
| `SELAH-EXPLAINABILITY-SPEC-v1.md` | Traces, options, disclaimers |
| `SELAH-FOUNDATIONS-v1.md` | The five foundations, three surfaces |
| `SELAH-TEMPLATES-v1.md` | The 44 templates |

**Nothing gets built until this is signed off.**

---

# PART 1 — BRAND IDENTITY

## 1.1 Why brand comes before build — and it is not the usual reason

Normally "brand first" is vanity. **Here it is a functional requirement, and the argument is specific to this company:**

> **Selah's product is trustworthiness. Not tax software — trustworthiness.**
>
> We are asking a Ugandan business to believe our number over **URA's own website**. Over **PwC's published guidance**. Over **their accountant of fifteen years.**
>
> **We will be right. But being right is not enough — we have to LOOK like the kind of organisation that would be right.**

Everything in the product depends on this: the confidence badges, the "verified 11 July 2026" stamps, the citations, the refusals, the options-not-recommendations. **These are brand expressions before they are UI components.** Design the brand after the product and they become decoration bolted onto screens. Design the brand first and they become **the reason anyone believes us at all.**

**So: brand first. Not for the logo. For the posture.**

## 1.2 🔑 The name

**"Selah" appears 71 times in the Psalms and three times in Habakkuk. Its meaning is genuinely uncertain among scholars — but the most common reading is a musical or liturgical instruction: *pause. Stop here. Consider what has just been said.***

*(This should be verified with a proper source before it goes into any public-facing copy — but if it holds, it is the best possible name for this company, and it was chosen before anyone knew why.)*

**Because that is precisely the product.**

Every failure in this company's founding stories was a failure to pause: five years of invoices with nobody checking the certificates; a grant that ended with nobody checking the payroll; an audit that arrived with nobody having looked.

> ### **Selah. Pause — and know where you stand.**

## 1.3 The brand posture — and what to reject

**Reject the default.** The instinctive aesthetic for an African fintech is bright, warm, optimistic, friendly — gradients, illustrated people, rounded everything, an exclamation mark.

**That aesthetic is wrong for Selah, and actively harmful.** It signals *app*. We need to signal **authority**.

**The reference points are not fintech.** They are: **a law report. A gazette. A well-set reference book. A Bloomberg terminal. An audit opinion.** Sober, precise, dense with citation, quietly certain. **Something you would be comfortable printing and handing to URA.**

| Selah IS | Selah is NOT |
|---|---|
| Precise | Playful |
| Sourced | Salesy |
| Sober | Cold |
| Certain where it can be, **honest where it can't** | Confident about everything |
| Plain | Simplistic |
| **The one who checked** | The one who guessed prettily |

## 1.4 Brand principles — these are testable

| # | Principle | How it shows up in the product |
|---|---|---|
| **1** | **We show our working.** | Every number is three levels deep: the answer, the working, the law |
| **2** | **We date everything.** | *"Verified 11 July 2026. Uganda's tax law changes every 1 July."* On every claim. |
| **3** | **We say what we don't know.** | Confidence C → **the calculator refuses, and explains why.** *"Nobody in Uganda knows this. Here is what we're doing about it."* |
| **4** | **We never say "do this."** | Options, priced, with trade-offs. **The decision is the user's.** |
| **5** | **We cite.** | Primary law. Act, section, gazette. **Never a blog.** |
| **6** | **We flag when we disagree with an official source.** | *"URA's page says X. The gazetted Act says Y. Here is both."* **We never quietly override — we show the conflict.** |

> **These six lines are the brand.** The logo is downstream of them.

## 1.5 Voice

**Plain, precise, and unhurried. Never breathless. Never salesy. Never patronising.**

| Don't | Do |
|---|---|
| *"Unlock massive tax savings! 🚀"* | *"You may not have owed the tax you paid. Here's how to check."* |
| *"Easily manage your compliance."* | *"URA is holding UGX 3,600,000 that belongs to you. You hold 4 of 11 certificates."* |
| *"Our AI-powered engine..."* | *"We read the gazetted Act. URA's website hasn't been updated yet."* |
| *"Consult a professional."* | *"We haven't seen your contracts. Ask your adviser whether X applies to you."* |

**Numbers do the persuading. We just have to be accurate and get out of the way.**

## 1.6 Brand deliverables (Task 1)

- Name story & meaning — **verified**
- Positioning line + one-paragraph story
- Brand principles (1.4) as public commitments
- Tone-of-voice guide with real examples
- Logo, wordmark, colour, typography
- 🔑 **The trust system:** confidence badges (A/B/C/F), the "verified [date]" stamp, the citation block, the refusal card, the options table. **These are the brand's load-bearing components — not afterthoughts.**
- Product naming: is it *Radar* and *Optimise*, or something a Ugandan business owner would actually say?
- Applications: web, documents, templates, letters to URA

---

# PART 2 — FUNCTIONAL REQUIREMENTS

## 2.1 The three surfaces

| | Access | Contains |
|---|---|---|
| **Calculators** | Public, free, no login | All 53. Every result ends with a door. |
| **Individuals** | Login · personal TIN | My tax · my compliance · my money · my plan · my documents |
| **Companies** | Login · entity TIN | Compliance · tax · payroll · money · people · audit · governance · Optimise |

**Three doors. One house.** *(Architecture: `SELAH-FOUNDATIONS-v1.md` §7a–7b.)*

## 2.2 The five foundations

| # | Foundation | Requirement | Status |
|---|---|---|---|
| **F1** | **Engine** | Every rule: formula · legal source · effective date · confidence · worked example · **executable test**. Rules are **immutable and superseded**, never edited. | ✅ Specced |
| **F2** | **Registry** | `TAXPAYER` is the root object. `RELATIONSHIP` is first-class: `director-of`, `employs`, `supplies-to`, **`associate-of` (incl. relatives)**, **`related-party`**. | 🔴 To spec |
| **F3** | **Ledger** | Double-entry. Every transaction: counterparty → Registry, tax treatment → Engine, evidence → Records. | 🔴 To spec |
| **F4** | **Records** | Documents with a **`MISSING`** state. 5-year retention. Chase workflows. | 🔴 To spec |
| **F5** | **Market** | BoU discount rate *(required by the engine — employee loan benefit)*, CBR, inflation, FX, T-bill/bond yields. | 🔴 To spec |

## 2.3 Cross-cutting — non-negotiable

| # | Requirement |
|---|---|
| **X1** | **The engine returns a TRACE, not a number.** Inputs, steps, rule, source, date, confidence. |
| **X2** | 🔴 **An LLM may PHRASE a trace. It may never PRODUCE one.** Delete the LLM and the explanation must still be *correct* — just less pleasantly worded. |
| **X3** | **Confidence C or F → REFUSE to compute.** Explain why. Route to a human. **Never compute-and-disclaim.** |
| **X4** | **Suggestions are OPTIONS.** Mandatory fields: `legal_basis`, `requires_of_you` *(the substance requirement)*, `costs`, `stops_working_when`, `what_we_cannot_tell_you`. |
| **X5** | **Disclaimers are tiered** (1–4), never blanket. **One line is never omitted:** *"Verified [date]. Uganda's tax law changes every 1 July."* |
| **X6** | **Every displayed number carries its rule ID, source and verified date.** |
| **X7** | 🔴 **GAAR guardrail on every structuring option.** *"If URA asked you why you did this — and 'to save tax' were not an allowed answer — could you answer?"* |
| **X8** | **Consent is per-taxpayer.** A company's appointment does **NOT** grant access to its directors' personal ledgers. Separate, explicit, revocable. |

## 2.4 Templates

44 templates, 7 groups. *(`SELAH-TEMPLATES-v1.md`)* **Versioned, sourced, dated, confidence-rated — and Selah tells clients when theirs goes stale.**

---

# PART 3 — LEGAL & COMPLIANCE REQUIREMENTS

**These are gates, not features. Several block the build entirely.**

| # | Requirement | Consequence if ignored |
|---|---|---|
| **L1** | 🔴 **URA tax agent registration.** Company may hold it (TPCA s.7(1)). Needs a qualified employee-nominee + a clean director + **Selah's own valid TCC.** | **Radar is illegal without it.** TPCA s.72. |
| **L2** | 🔴 **Licence expires every 31 December**, regardless of issue date. Renew ≥21 days before. | **1 January lapse = every client action becomes an offence.** |
| **L3** | 🔴 **TPCA s.17 certificate** — issued for **every** return we touch. Retained 5 years. | Statutory obligation. **Auto-generate.** |
| **L4** | 🔴 **TPCA s.4(6) written permission** per client, before using their TIN. | Statutory. |
| **L5** | 🔴 **Never hold client tax money.** URA is explicit. | Hard product rule. |
| **L6** | 🔴 **TPCA s.69(2)** — a tax agent aiding a tax offence: **double the tax evaded** or UGX 5m, whichever is higher, **plus 5 years.** | **This is why X1–X7 exist.** |
| **L7** | ✅ **CMA — RESEARCHED.** *(`SELAH-REGULATORY-v1.md`)* **"Options, not recommendations" is NOT a securities shield** — Cap 84 s.6(nn)(ii) catches impersonal, unpaid, generic *"analyses or reports on securities."* **The line is the word SECURITIES:** bank deposits are expressly excluded; **T-bills, bonds, shares and unit trusts are inside.** | **Ship savings-account content. HOLD BACK all modelling of security returns.** 300 CP + **3 years**. Route through: the **CMA Regulatory Sandbox** (launched Oct 2025, ~4 applicants). |
| **L8** | 🔴 **DATA PROTECTION — worse than expected.** **DPPA s.9(1): financial data is SPECIAL personal data and its processing is PROHIBITED BY DEFAULT.** The s.7(2) exceptions do not carry across. Gateway is **explicit, granular, unbundled, opt-in consent (s.9(3)(b))**. | 🔴 **PDPO registration is MANDATORY (UGX 100,000/yr). A DPO is MANDATORY.** **A digital lender's director was personally CONVICTED on 10 July 2025 for failure to register.** Corporate fine up to **2% of gross turnover**. |
| **L9** | **EFRIS accreditation** — the only automatable pipe into URA. | Required for the ledger's front door. |
| **L10** | 🔴🔴 **THE ACCOUNTANTS ACT — POTENTIALLY COMPANY-BREAKING.** An **ICPAU "accounting firm" must be a sole proprietorship or partnership (s.1, s.31(1)). A LIMITED COMPANY CANNOT HOLD THE LICENCE AT ALL.** Practising without one: **UGX 10m and/or 2 years 10 months.** Whether *bookkeeping* is a reserved activity is **UNCONFIRMED**. | 🔴 **BLOCKING for bookkeeping, the pooled accountant bench, and audit-ready.** **NOT blocking for tax agency, Radar, Optimise or the calculators — a company CAN be a tax agent.** **GET COUNSEL BEFORE ANYTHING ELSE.** |
| **L11** | 🚩 **BoU / payment initiation.** *"Providing the enabling technology to support funds transfers"* is a **PSO-licensable activity** even with no consumer-facing service. **"We never touch the money" is not a defence — it is the definition of the bucket.** UGX 140m + permanent disqualification. | Reinforces existing hard rule **L5**. Any payment flow must be structured as a contracted vendor to a licensee. |
| **L12** | ❓ **Professional marketplace referral commissions — UNRESEARCHED.** The **Advocates Act / Law Council** rules on fee-sharing and touting, and **ICPAU** rules on referral commissions, commonly prohibit paying non-professionals for referrals. | **Phase 7 (the marketplace) may be unlawful and we do not know.** Research before designing. |

---

# PART 4 — NON-FUNCTIONAL

| | |
|---|---|
| **Correctness** | **The highest-priority NFR, above performance, above uptime, above everything.** A wrong number is existential. |
| **Auditability** | Every trace stored, timestamped, versioned. **When a rule changes on 1 July, we must identify every client advised under the old one.** |
| **Security** | We hold TINs, ledgers, contracts, personal tax positions. **We never hold URA passwords** — the portal agent-appointment mechanism means we don't have to. |
| **Retention** | 5 years, statutory. |
| **Rule currency** | 🔴 **Mandatory spec review every March–June.** Amendments land 1 July. **Ship before, not after.** |
| **Offline / low bandwidth** | Uganda. Assume it. |
| **Mobile-first** | Uganda. Assume it. |

---

# PART 5 — OUT OF SCOPE FOR v1

Stated so it isn't quietly built.

- 🔴 **Any modelling of returns on T-bills, bonds, shares or unit trusts** *(CMA perimeter — L7. Bank deposits are fine.)*
- 🔴 **Any comparison of a security against anything** — however carefully phrased
- 🔴 **Any insurance comparison, recommendation, or "risk assessment"** *(IRA — and "risk advisor" has no remuneration element)*
- 🔴 **Any commission-based financial-product marketplace** *(needs a broker licence — UGX 75m+)*
- ❌ Lending / credit *(needs all five foundations)*
- ❌ Kenya / Tanzania *(later — same URA-shaped hole)*
- ❌ Marketplace *(needs demand first)*
- ❌ Bank integrations
- ❌ A mobile app *(mobile web first)*
- ❌ **Non-resident payroll** — 🔴 **the engine REFUSES.** The bands may have been repealed. *(Rules spec §13.3)*

---

# PART 6 — THE BUILD SEQUENCE

**Brand first. Then licence. Then revenue. Then software.**

| Phase | What | Gate to exit |
|---|---|---|
| **1. Brand** | Identity, voice, the trust system | Signed off |
| **2. Foundations spec** | Registry · Ledger · Records · EFRIS | Signed off |
| **3. Legal gates** | Tax agent registration begins · **CMA research** · Selah's own exemption check | Application filed |
| **4. Templates** | The Phase-1 four: WHT register, WHT request, voluntary disclosure, instalment MOU | Usable |
| **5. Concierge revenue** | 20 paid Health Checks. **No software.** | **20 people paid** |
| **6. The engine** | Build it. Test it. **Execute every rule.** | Test suite green |
| **7. Calculators** | All 53, public, free, sourced | Live |
| **8. Registry + Radar** | | |
| **9. Ledger + Records via Invoicing + EFRIS** | | |
| **10. Books · payroll · budget · forecast · audit** | | |

> 🔴 **The exit gate on Phase 5 is the only one that matters.**
>
> **If twenty people will not pay for a manual Health Check, we do not build the software.** Everything after Phase 5 is contingent on Phase 5.
