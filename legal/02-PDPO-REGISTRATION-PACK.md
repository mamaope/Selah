# PDPO Registration — the pack

**Personal Data Protection Office, Uganda · 11 July 2026**

---

## 🔴 Why this is urgent, and not administrative

**Data Protection and Privacy Act, s.9(1): financial data is SPECIAL PERSONAL DATA. Processing it is PROHIBITED BY DEFAULT.**

Not "regulated". **Prohibited**, unless a lawful basis applies.

And this is not theoretical:

> **On 10 July 2025 — one year and one day ago — a digital lender's DIRECTOR was PERSONALLY CONVICTED for failing to register with the PDPO.**

Not the company. **The director.**

**Everything in Phase 2 and Phase 3 of Selah — the registry, the ledger, the records — is special personal data about identifiable Ugandans. None of it may be built, let alone launched, until this is done.**

**It is the single cheapest thing standing between us and the rest of the product.**

---

## What we must do, in order

### 1. Appoint a Data Protection Officer

**Who.** A named individual, contactable, who can be reached by a data subject and by the PDPO. In a company our size this is the founder, and that is fine — but it must be *named*, not implied.

**Their job.** Not a title. They are the person who:
- signs off on every new thing we do with personal data, **before** we do it
- receives and answers data-subject requests within the statutory window
- keeps the record of processing activities
- is the person the PDPO calls

🔴 **Do not appoint someone who does not know they have been appointed.**

### 2. Register with the PDPO

Registration is with the **Personal Data Protection Office**, under the National Information Technology Authority – Uganda (NITA-U).

**You will need to declare, at minimum:**

| | Our answer |
|---|---|
| **Who we are** | Selah Solutions Ltd, [TIN], [address] |
| **The DPO** | [Name], [email], [phone] |
| **What data we process** | Names, TINs, phone numbers, employment income, tax positions, arrears, WHT certificates, payroll data, directors' personal tax status |
| 🔴 **Special categories** | **YES — financial data (s.9(1))** |
| **Why (lawful basis)** | Performance of a contract with the data subject; and consent, freely given and separately recorded |
| **Who we share it with** | 🔴 **NOBODY, except URA — and only on the client's instruction, as their appointed tax agent.** We do not sell, share, or enrich. |
| **Where it lives** | [Hosting location — answer this honestly. If it is outside Uganda, cross-border transfer rules engage.] |
| **How long we keep it** | 7 years (TPCA requires 5; we design for 7) |
| **How we protect it** | Encryption at rest and in transit; access logging; least privilege; no production data in test |

### 3. 🔴 Answer the cross-border question honestly

**If the data leaves Uganda, that is a separate obligation, and it is the one most likely to be got wrong.**

Decide **now**, before you pick a host, whether Selah's client data will sit in Uganda. It is far cheaper to choose a Ugandan or compliant host today than to migrate later under a PDPO enquiry.

---

## The three documents to write

### 1. The Record of Processing Activities

One table. Every category of personal data, why we hold it, the lawful basis, who sees it, how long we keep it, and how it is destroyed. **This is the document the PDPO will ask for first, and it is the one that shows whether you have actually thought about it.**

### 2. The Privacy Notice

**In plain English, and it must be true.**

The best model we have already written is on the platform: the waiting-list page currently says, out loud, that **it stores nothing**, and *why* — because we are not registered yet. That honesty should survive registration, not be replaced by boilerplate.

> **If the privacy notice needs a lawyer to read it, it is not a notice. It is a disclaimer.**

### 3. The Consent Architecture

**Consent must be freely given, specific, informed, and separately recorded.** A tick-box buried in terms of service is not consent to process special personal data.

For a Health Check, we need the client's **explicit, written, separate** consent to:
- receive and review their records
- **look up their directors' personal tax status** 🔴 *(this is a third party's data — the director is a data subject too, and they have not signed anything)*
- correspond with URA on their behalf

---

## 🔴 The one that will catch us

**The director trap is also a DATA PROTECTION trap.**

Our best finding — that a director's unfiled *personal* return blocks the company's TCC — requires us to process **personal data about a natural person who is not our client.**

The company can consent to us processing *the company's* data. **The company cannot consent on behalf of its directors.**

**Get the director's own written consent, on their own signature, or do not look.**

We will not build a product whose best feature is a privacy breach.

---

## Sequence

```
1. Appoint the DPO                       ← today. It is a decision, not a project.
2. Write the record of processing        ← one table. Half a day.
3. Register with the PDPO                ← the gate.
4. Write the privacy notice + consents   ← before the FIRST Health Check touches
                                            a real person's records.
5. THEN build the registry, the ledger,
   the records.
```

**Steps 1–4 are days, not months. They are the cheapest thing standing between us and Phase 2.**

---

## What to check before filing

- [ ] Confirm the **current PDPO registration process and fee** — it is administered by NITA-U and the process has changed before. **Do not rely on this document for the mechanics; verify them.**
- [ ] Confirm whether **annual renewal** is required.
- [ ] Confirm the **cross-border transfer** requirements for our chosen host.
- [ ] Have counsel review the **consent wording**, particularly for directors' data.

🔴 **This document is a plan, not legal advice. The obligation is personal to the director, and the conviction on 10 July 2025 proves the PDPO means it.**
