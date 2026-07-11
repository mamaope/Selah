# Selah Explainability Specification

**Every number shows its working. Every suggestion shows its reasoning. Every claim cites its source.**

*Version 1 — 11 July 2026*

---

## 0. The rule

> **Selah never returns a number. Selah returns a proof.**

Every calculation, every recommendation, every warning, and every refusal emits a **trace**: the inputs, the steps, the rule applied, the legal source, the effective date, and the confidence. The user interface *renders* that trace. It does not *invent* it.

**This is not a UI preference. It is the architecture.**

---

## 1. Why: the anti-pattern this exists to prevent

**The obvious way to build "explain the calculation" is to compute a number, hand it to an LLM, and ask it to write an explanation.**

**Never do this.**

An LLM handed `188,250` and asked *"explain this PAYE calculation"* will produce a fluent, confident, plausible explanation — and it will sometimes use the **old bands**, because the old bands are what it learned. It will be wrong in exactly the way that is hardest to catch: **articulate, well-formatted, and internally consistent.**

> **Uganda already has a surplus of confident, well-formatted, wrong tax explanations.** URA's website has one. PwC published one. *The Independent* published a table that contradicted its own article. **The last thing this market needs is a machine that generates more of them, faster.**

### The correct architecture

```
        ┌─────────────────────────────────────────┐
        │  THE ENGINE                             │
        │  Rules → applies them → emits a TRACE   │
        │  (inputs, steps, rule, source, date)    │
        └──────────────────┬──────────────────────┘
                           │  the trace IS the reasoning
                           ▼
        ┌─────────────────────────────────────────┐
        │  THE RENDERER                           │
        │  Turns the trace into prose/UI.         │
        │  May use an LLM — but ONLY to PHRASE    │
        │  the trace. Never to PRODUCE it.        │
        └─────────────────────────────────────────┘
```

**The LLM's job is grammar, not arithmetic. It may re-word a step. It may never invent one.**

**The test:** if you deleted the LLM entirely, the explanation should still be *correct* — just less pleasantly phrased. **If deleting the LLM breaks the reasoning, the architecture is wrong.**

### And the trace is also our legal defence

Once Selah holds a tax agent licence, **TPCA s.69(2)** makes a wrong position cost **double the tax evaded and up to 5 years.**

A trace is a permanent, timestamped record of: *what we told this client, on what date, on what legal authority, with what confidence, and under which version of the rules.* **When a rule changes on 1 July, we can identify every client we advised under the old one.**

> **Explainability is not a pedagogy feature that happens to help with liability. It is a liability feature that happens to teach.**

---

## 2. The trace object

Every computation returns this shape.

```json
{
  "result": 188250,
  "currency": "UGX",
  "label": "PAYE due this month",

  "rule": {
    "id": "UG.PAYE.RESIDENT.2026",
    "confidence": "A",
    "effective_from": "2026-07-01",
    "supersedes": "UG.PAYE.RESIDENT.2012",
    "verified_on": "2026-07-11",
    "source": {
      "instrument": "Income Tax (Amendment) Act 2026",
      "provision": "Schedule 4, Part I",
      "gazette": "Bills Supplement No. 2, Uganda Gazette No. 33, Vol. CXIX, 27 March 2026",
      "url": "https://..."
    }
  },

  "inputs": { "gross_monthly": 1000000, "residence": "resident" },

  "steps": [
    { "band": "0 – 335,000",         "amount": 335000, "rate": 0.00, "tax": 0,
      "note": "Tax-free threshold. Raised from 235,000 on 1 July 2026." },
    { "band": "335,001 – 410,000",   "amount": 75000,  "rate": 0.20, "tax": 15000,
      "note": "The old 10% band was ABOLISHED. The first taxable shilling is now taxed at 20%." },
    { "band": "410,001 – 485,000",   "amount": 75000,  "rate": 0.25, "tax": 18750,
      "note": "New band, introduced 1 July 2026." },
    { "band": "485,001 – 1,000,000", "amount": 515000, "rate": 0.30, "tax": 154500 }
  ],

  "comparison": {
    "under": "UG.PAYE.RESIDENT.2012",
    "result": 202000,
    "delta": -13750,
    "meaning": "You pay UGX 13,750 LESS per month under the new rules."
  },

  "warnings": [
    { "severity": "high",
      "text": "URA's own PAYE rate page still displays the superseded bands. If your employer is using URA's website, you are being over-deducted.",
      "evidence_url": "https://ura.go.ug/en/domestic-taxes/paye-rates/" }
  ],

  "next_action": {
    "text": "Want us to check your last 6 payslips against the correct bands?",
    "product": "health_check"
  }
}
```

**Every field is mandatory.** A trace without a `source` does not render. A trace without a `confidence` does not render.

---

## 3. Progressive disclosure — three levels

**Nobody wants a statute when they want a number. Everybody wants a statute when they doubt the number.**

| Level | What it shows | Who it's for |
|---|---|---|
| **1 — The answer** | The number, plus **one sentence of "because"** | Everyone. Default view. |
| **2 — The working** | Band by band. The arithmetic, laid out. What changed, and what it means for *you*. | The user who wants to understand |
| **3 — The law** | The **actual statutory text**, the gazette citation, the effective date, the confidence rating, and a link to the primary source | The accountant, the auditor, the sceptic — **and the user in a dispute with URA** |

**Level 3 is the one that wins the market.** In a country where the tax authority's own website is currently wrong, **the ability to say "here is the gazetted Act, dated, and here is why URA's page disagrees"** is not a feature. It is the entire value proposition, made visible.

---

## 4. 🔑 Selah does not recommend. Selah presents OPTIONS.

> **Selah never says "do this."**
> **Selah says: "here are your options, here is what each one costs, here is what each one requires of you — and here is what we cannot tell you."**
>
> **The decision belongs to the user. Always.**

**This is not timidity. It is three things at once:**

| | |
|---|---|
| **Legally safer** | A recommendation directs. Options inform. Under **TPCA s.69(2)** we would be liable for *aiding* a tax offence — and the surest way to aid one is to tell someone to do it. |
| **Better teaching** | A recommendation hides the trade-off space. **Options are the trade-off space.** The user who sees all four routes and picks one has *learned something*. The user handed an answer has not. |
| **Honest** | We do not know their full facts. We have not seen their contracts. **We are not their adviser.** Presenting options is the truthful shape of what we actually know. |

### The options trace

```json
{
  "question": "How should I take UGX 10,000,000 of company profit?",
  "your_situation": { "profit": 10000000, "current_route": "dividend" },

  "options": [
    {
      "id": "salary",
      "label": "Pay it as salary",
      "you_keep": 8341000,
      "total_tax": 1659000,
      "effective_rate": 0.166,
      "how_it_works": [
        "Salary is DEDUCTIBLE to the company — so no 30% corporation tax on it.",
        "The first UGX 4,020,000/year is taxed at 0% in your hands.",
        "The rest is taxed progressively — 20%, 25%, then 30%."
      ],
      "requires_of_you": "It must be a GENUINE salary, for GENUINE work you actually do. A salary paid to someone who does no work is not a salary — it is a distribution wearing a costume, and s.117 lets URA say so.",
      "costs": [
        "NSSF at 15% (5% you + 10% the company). A real cash cost — but it is YOUR money, it is deductible to the company, and it comes back out of a retirement fund tax-free (s.21(1)(n)).",
        "PAYE is due monthly, by the 15th. This is an administrative burden a dividend does not carry."
      ],
      "stops_working_when": "Your personal income passes UGX 120,000,000/year. Above that your marginal PAYE rate is 40% — worse than the company's 30%.",
      "legal_basis": [
        { "point": "Salary is deductible", "provision": "ITA Cap 338 s.22(1)(a)", "confidence": "A" },
        { "point": "PAYE bands", "provision": "Income Tax (Amendment) Act 2026, Sch. 4 Pt I", "confidence": "A" }
      ]
    },
    {
      "id": "retain",
      "label": "Leave it in the company",
      "you_keep": 7000000,
      "note": "in the company, not in your pocket",
      "total_tax": 3000000,
      "effective_rate": 0.30,
      "how_it_works": ["Corporation tax at 30%. The money stays in the business to fund growth."],
      "requires_of_you": "Nothing. This is the default.",
      "costs": ["You cannot spend it personally without triggering one of the other options later."],
      "legal_basis": [{ "point": "CIT 30%", "provision": "ITA Cap 338 s.4", "confidence": "A" }]
    },
    {
      "id": "dividend",
      "label": "Take it as a dividend",
      "you_keep": 5950000,
      "total_tax": 4050000,
      "effective_rate": 0.405,
      "flag": "This is what you are currently doing.",
      "how_it_works": [
        "The company pays 30% corporation tax on the profit.",
        "Then 15% withholding tax is deducted from the distribution.",
        "Two taxes on the same money: 40.5% effective."
      ],
      "requires_of_you": "Nothing — it is entirely legitimate. It is simply the most expensive route.",
      "costs": ["UGX 2,391,000 more tax than the salary route, on this profit."],
      "legal_basis": [{ "point": "Dividend WHT 15%", "provision": "ITA Cap 338 s.118", "confidence": "A" }]
    }
  ],

  "what_the_numbers_favour": {
    "option": "salary",
    "by": 2391000,
    "caveat": "On tax alone. Tax is not the only thing that matters — see 'requires_of_you' and 'costs' on each option. Your cash-flow needs, your growth plans, and whether you actually work in the business may all point elsewhere."
  },

  "what_we_cannot_tell_you": [
    "Whether you actually perform work that justifies a salary — only you know that.",
    "Whether you need the cash personally or can leave it in the business.",
    "Whether your shareholders' agreement or loan covenants restrict any of these."
  ],

  "disclaimer_tier": 3,
  "confidence": "A",
  "verified_on": "2026-07-11"
}
```

### 🔴 The mandatory fields on every option

| Field | Why it cannot be optional |
|---|---|
| **`legal_basis`** | An option with no cited authority is an opinion. **We do not sell opinions.** |
| **`requires_of_you`** | The **substance requirement.** Uganda's GAAR (**ITA s.117**) lets the Commissioner re-characterise any transaction **whose form does not reflect its substance — with NO mental element and NO motive test.** A structure without substance is not clever. It is void. |
| **`costs`** | Every route has one. Salary has NSSF. Presumptive is final. The consultant route strips the worker of protections. **An option that hides its downside is a sales pitch.** |
| **`stops_working_when`** | Every lever has a limit. Say where it is, *before* they hit it. |
| **`what_we_cannot_tell_you`** | 🔑 **The most honest field in the schema.** We do not have their facts. Saying so is not weakness — it is the only accurate thing we can say. |

### The one line that governs every option

> **"If URA asked you why you did this — and 'to save tax' were not an allowed answer — could you answer?"**
>
> If there is no answer, **the option is not available to you**, however good the arithmetic looks.

**This line appears on every structuring option Selah ever shows. It is not fine print. It is the product.**

---

## 4b. Disclaimers — tiered, not blanket

**A blanket disclaimer on everything is the same as a disclaimer on nothing.** People stop reading it by the third screen. So Selah's disclaimers **scale with the risk of the thing being said.**

| Tier | Applies to | What the user sees |
|---|---|---|
| **1 — Sourced fact** | *"Your PAYE is UGX 188,250."* A pure computation from Confidence-A law. | **No disclaimer.** Just the source, the rule ID, and the verification date. **A disclaimer here would be noise, and worse — it would devalue the tiers that matter.** |
| **2 — Informational** | *"You may qualify for the 3-year startup exemption."* Factual, but depends on facts we haven't verified. | *"Based on what you've told us. We haven't seen your incorporation documents — confirm the details before relying on this."* |
| **3 — Structuring** | *"Here are three ways to take money out of your company."* Options with real substance requirements. | **Full frame:** the options table, the `requires_of_you` on each, `what_we_cannot_tell_you`, and: *"This is general information, not tax advice. Before acting, confirm with a licensed Ugandan tax adviser who has seen your actual contracts."* |
| **4 — We won't help** | Income splitting to a spouse. Disguising employment as consultancy. | **A refusal, with reasons.** See §5b. |

**And one disclaimer that is never omitted, at any tier:**

> **Verified [date]. Uganda's tax law changes every 1 July.**

**An undated tax claim is a liability.** URA's own website is proof.

### 🔴 What a disclaimer is NOT

- ❌ **Not a substitute for being right.** *"Consult a professional"* does not make a wrong number acceptable. **We are the professionals.** The disclaimer manages the gap between our knowledge and their facts — **not the gap between right and wrong.**
- ❌ **Not a place to hide uncertainty.** If a rule is Confidence C, **the calculator refuses.** It does not compute-and-disclaim. *(§5a.)*
- ❌ **Not boilerplate.** Each disclaimer names **the specific thing we don't know** about **this user**. *"We haven't seen your contracts"* beats *"seek professional advice"* every time — because it tells them what to actually go and ask.

---

## 5. 🔑 The refusals — explaining why we WON'T

**This is the part everyone forgets, and it is the part that builds the most trust.**

### 5a. When we cannot compute

Where a rule is **Confidence C or F**, the engine **refuses** — and the refusal is itself a full explanation.

> **We cannot calculate PAYE for a non-resident employee, and we will not guess.**
>
> **Why:** the Income Tax (Amendment) Act 2026 replaced the whole of Part I of Schedule 4 with a table headed *"applicable to **resident** individuals"*. **No non-resident table follows it.** We read the gazetted Bill in full, from two independent copies. EY and MMAKS reproduce the same resident-only table. **No source in Uganda publishes non-resident bands for this year.**
>
> Either the schedule was repealed by accident, or the text is hiding somewhere we cannot reach. **We don't know — and neither does anyone else.**
>
> **What we're doing:** we have requested the enacted Act from URA and are preparing a private ruling request.
> **What you should do:** speak to a licensed tax adviser. Do not use a calculator that gives you a confident answer here — *it does not know either.*
>
> *Rule `UG.PAYE.NONRESIDENT.2026` · Confidence F · Checked 11 July 2026*

> **Every competitor's calculator will return a number for this. Ours returns the truth.** That refusal is the single most persuasive screen in the product.

### 5b. When we won't suggest something

Where a structure is legal-looking but **caught by anti-avoidance**, Selah names it and explains why it's declining:

> **We are not going to suggest putting the business in your spouse's name.**
>
> It would use their tax-free band and lower rates, and people do it. **But ITA s.63 (income splitting) lets the Commissioner adjust the chargeable income of *both of you* where property or income is transferred to an associate and *"the reason **OR ONE OF THE REASONS** for the transfer is to lower the total tax payable."***
>
> **"One of the reasons" is an extraordinarily low bar.** There is no main-purpose filter and no commercial-purpose safe harbour. And **"associate" (s.3) expressly includes relatives.**
>
> **If your spouse genuinely runs the business, put it in their name — that's not a scheme, that's a fact.** If they don't, this is caught, and we won't help you do it.
>
> *ITA Cap 338, s.63 · Confidence A*

---

## 6. Citation standard

| Rule | |
|---|---|
| **Primary law first.** | Cite the **Act, section, and gazette reference**. Never cite a blog. |
| **Date every claim.** | *"Verified 11 July 2026."* Ugandan tax changes every 1 July. **An undated tax claim is a liability.** |
| **Name the confidence.** | A / B / C / F, visible to the user. Do not hide uncertainty behind fluent prose. |
| **Show the version.** | *"Computed under `UG.PAYE.RESIDENT.2026`, in force from 1 July 2026."* A return for FY2025/26 must still compute under FY2025/26 law. |
| **Flag when we disagree with an official source.** | 🔑 *"URA's own page says X. The gazetted Act says Y. Here is both — you decide."* **Never quietly override an official source. Show the conflict.** |
| **Blacklist enforcement.** | Sources that have published wrong or stale tables — Global Law Experts, Lawyard, Tally, Grant Thornton Uganda's PDF, vuplon — **may never appear as a citation.** |

---

## 7. Every explanation ends with a door

The explanation is not the end of the interaction. It is the beginning of one.

| Calculator | The door |
|---|---|
| PAYE | *"Your employer may still be using the old bands. Shall we check your last 6 payslips?"* |
| WHT | *"URA may be holding money that's yours. Shall we find out how much?"* |
| Presumptive | *"You may be in the wrong regime entirely. We can model both."* |
| Penalty & interest | *"Disclose this voluntarily and the interest and penalties may be waived. That's worth UGX X."* |
| TCC readiness | *"Your directors' personal returns can block your company's certificate. Shall we check them?"* |
| Startup exemption | *"You may owe no income tax at all — for three years."* |

> **This is the financial-literacy strategy, delivered.** Not an articles section. Not an AI tutor. Not a video library.
>
> **The reasoning, attached to the number, on the user's own money, at the exact moment it is worth something.**
>
> That is the only kind of financial education that has ever changed anybody's behaviour.

---

## 8. What this costs us

**Almost nothing — if we build it first.**

Every rule in `SELAH-RULES-ENGINE-SPEC` **already carries** its formula, source, effective date, confidence and worked example. **The trace is not extra work. The trace is what the spec already is, emitted at runtime instead of read by a human.**

**But it is nearly impossible to retrofit.** An engine that returns bare numbers cannot be made explainable later without being rebuilt — because the reasoning was never captured; it was executed and thrown away.

> **Decide this now, or don't get to decide it.**

---

**Companions:** `SELAH-RULES-ENGINE-SPEC-v1.1.md` · `SELAH-STRUCTURING-GUIDE-v1.md` · `SELAH-CALCULATOR-CENTRE-v1.md` · `SELAH-PROPOSAL-v1.md`
