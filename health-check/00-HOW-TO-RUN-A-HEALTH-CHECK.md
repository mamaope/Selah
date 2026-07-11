# The Selah Health Check

**v1 · 11 July 2026 · The go/no-go gate**

---

## What this is

**Twenty paid Health Checks, done by hand, before another line of code is written.**

Not a pilot. Not a free trial. **Twenty Ugandan businesses paying real money for a real answer.** If twenty of them will not pay for this, the platform is a very elaborate way of being wrong about the market — and it is far cheaper to find that out now.

## Why by hand

Because **the engine is not the product yet. The FINDING is.**

You do not need a ledger, a registry or a login to walk into a consultant's office and say: *"URA is holding UGX 3,600,000 that belongs to you, you hold 4 of 11 certificates, and here is the letter that gets the rest."* You need a spreadsheet, four templates, and two hours.

Do that twenty times and you will know three things the code cannot tell you:

1. **Will they pay?** (And how much, and how fast, and who signs.)
2. **What is actually in the shoebox?** Every assumption in `SELAH-FOUNDATIONS-SPEC-v2.md` about what a Ugandan business can produce on request is an assumption. Twenty shoeboxes will correct it.
3. **Which finding lands?** WHT credits, the second-job overpayment, the director trap, the 3-year exemption, the missing capital allowances — one of these will make people reach for their phone. Build that one first.

---

## The offer

> **UGX 500,000. Two hours of your records. We tell you what you are owed, what you owe, and what is about to change.**
>
> **If we find you nothing, you pay nothing.**

That last line is not generosity — it is the cheapest possible way to buy the first twenty conversations, and it is honest, because **we already know the findings are there.**

## What you need from them

| | Why |
|---|---|
| **Last 12 months of invoices** to Government or large companies | WHT withheld from them |
| **Every WHT certificate they hold** | The credit is only claimable with the certificate |
| **Payroll for 3 months** | PAYE bands, LST, NSSF, second jobs |
| **A list of directors, with TINs** | 🔑 **The director trap.** One unfiled personal return blocks the company's TCC. |
| **Fixed asset register (or a list)** | Capital allowances almost nobody claims |
| **Date of incorporation + shareholding** | The 3-year exemption |
| **Any URA correspondence** they have ignored | Arrears, compounding at 2% a month |

---

## The seven findings, in the order they pay

Run every one. **They are ranked by how often they land and how much they are worth.**

### 1. 🔑 THE WHT CREDIT GAP — *the Isaac finding*
Withholding tax deducted from them is **PREPAID TAX**, not a cost. But **only if they hold the certificate.** Most Ugandan consultants hold a fraction of theirs and have been paying tax twice on the rest for years.
→ **`01-WHT-REGISTER.md`** to find it. **`02-WHT-CERTIFICATE-REQUEST.md`** to fix it.
*Isaac: UGX 70,000,000 over five years.*

### 2. 🔑 THE DIRECTOR TRAP
URA criterion 3, verbatim: *"For Non-Individuals, the associated persons (directors or partners) **MUST** have submitted all their returns."*
A spotless company is refused its TCC because one absentee director never filed a **personal** return. **It is invisible from inside the company's own ledger.** They find out when they lose the tender.
→ Ask for every director's TIN. Check every one.

### 3. THE SECOND-JOB OVERPAYMENT
A second employment is taxed at a **flat 30%** — no free band, no lower steps. On a modest second income that is brutal. **And URA's own page says the employee may claim it back.** Almost nobody does.
→ Ask whether anyone on the payroll has a second job. Then ask the *directors*.

### 4. THE 3-YEAR EXEMPTION — *s.21(1)(za)*
A **total income tax holiday** for a citizen's new business, capital under 500,000,000. It is **not on URA's own exemptions page** and **not in PwC's tax summary.**
→ Incorporated after 1 July 2025? Ask.

### 5. CAPITAL ALLOWANCES NOT CLAIMED
40% / 30% / 20% reducing balance. And **start-up costs at 25% a year for four years (s.29)** — which most accountants expense once and lose three quarters of.

### 6. THE ARREAR THAT IS COMPOUNDING
2% a month. **UGX 4,000,000 becomes 13,124,123 in five years.** And the cure: **voluntary disclosure before proceedings start**, and the Commissioner *may* waive all of it.
→ **`03-VOLUNTARY-DISCLOSURE.md`** · **`04-INSTALMENT-MOU.md`**

### 7. WHAT IS ABOUT TO CHANGE
**Severance is about to be standardised at one month per year worked** — the Act is signed and **not yet in force**. Their exposure is real and unprovided.
And **two taxes their adviser may still be quoting them are dead**: the 0.5% minimum tax and the 3% stamp duty. **Parliament killed both on the floor.**

---

## 🔴 The rules of a Health Check

1. **NEVER take custody of their money.** Not a shilling of tax, ever. This is URA's rule and it is also the boundary that keeps Selah out of the payment-services perimeter. We find; we draft; **they pay URA directly.**
2. **Every number cites the law.** If you cannot cite it, do not say it.
3. **If you are not sure, refuse.** The refusal is the product. *"We do not know, and here is why, and here is who does"* is worth more than a confident wrong number — and it is the only thing a competitor cannot copy in a weekend.
4. **Write down what surprised you.** Every one of these will change the spec.

---

## What to record, every time

Keep one row per Health Check. This spreadsheet is the most valuable asset the company will own for the next three months.

| Field | |
|---|---|
| Business, sector, turnover band | |
| **Did they pay? How much? How long from first call?** | ← the go/no-go |
| Findings, and the shilling value of each | |
| **Which finding made them reach for the phone** | ← build that first |
| What they could NOT produce | ← corrects the foundations spec |
| What surprised you | |

---

## The gate

> **20 Health Checks. If fewer than 12 convert to paid, stop and rethink the offer — not the code.**
>
> **The code is not the risk. The market is.**
