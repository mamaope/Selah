# SELAH — BOOKS
### Default income and expenditure, templates, and money that never lies about itself
**v1 · 12 July 2026**

---

## The problem, in the user's words

> *"Let the individual set defaults of monthly and annual income and expenditure so they don't
> have to enter it month to month, then they can add the rest every month."*

And then, immediately, the question that kills every naive version of this:

> *"What happens if the salary does not come that month?"*

That question is the whole design.

---

## 1. THE LAW OF THIS MODULE

> ### A DRAFT IS NOT MONEY.

A template says what you **expect**. Expectation is not receipt. Every ordinary budgeting
app collapses these two, and the moment it does, it starts lying to you:

- Your salary shows in your total **because a rule said it would**, not because it came.
- Your "money left this month" is computed from income you have not been paid.
- The app is most confidently wrong exactly when you are most broke — the month the
  money did **not** arrive is the month you most need the truth.

So, in Selah:

| Rule | |
|---|---|
| **1** | A staged line is a **DRAFT**. It is counted in **NO** total, ever. |
| **2** | Only a **CONFIRMED** line is money. |
| **3** | A confirmed line carries the **ACTUAL** amount, which may differ from the expected one. |
| **4** | Nothing is **EVER** auto-confirmed. Not after 30 days. Not "probably". Never. |
| **5** | **"It did not come"** is a first-class outcome, recorded and kept. |
| **6** | A target's progress counts **CONFIRMED ONLY**. A goal that counts your hopes is a lie. |

Rule 5 is the one nobody else has. Salary paid late. Salary paid short. Tenant didn't pay.
Today that fact is destroyed — you either pretend you were paid, or you delete the line and
lose the evidence. Selah records **expected 2,500,000 → received 0**, and keeps it.

That record is the thing that later proves your employer was short-paying you.

---

## 2. THE OBJECTS

### Book
A container for money in and money out. One is the **default** (`Home`). Others are whatever
the person actually runs: `Shop`, `Rentals`, `The build in Mukono`, `School fees`.

- Books do **not** carry a running balance in v1. That needs opening balances and transfers,
  and **a transfer between Books is not income** — getting that wrong double-counts a
  person's money. Net worth stays where it already lives, in *My money*.

### Template
A reusable definition of what a period normally looks like, belonging to one Book.

- Cadences: **weekly · monthly · quarterly · annual**
- Each line: direction (**in** / **out**), label, expected amount, optional category.
- A template is **never** applied silently to the past.

### Period
A dated window on a Book: `July 2026`, `Q3 2026`, `week of 6 July`. Its cadence comes from
the template that staged it — not from an assumption.

### Entry
One line of money in one period. Its **status** is the whole point:

| status | meaning | counts? |
|---|---|---|
| `expected` | staged from a template. Nobody has confirmed it. | **NO** |
| `confirmed` | it happened. `actual` holds what really moved. | **YES** |
| `did_not_arrive` | it was expected and it did **not** happen. | **NO** — and we keep it |
| `unplanned` | it happened and no template predicted it. Confirmed by definition. | **YES** |

### Target
A goal on a Book: *save 12,000,000 for the plot*, *keep food under 400,000 a month*.
Progress is measured on **confirmed entries only**.

---

## 3. THE MONTH, IN PRACTICE

**1 July, 00:01** — Selah stages July in the `Home` Book from the monthly template. Six lines
appear. Every one is marked **unconfirmed**, in grey, and every total on the screen reads as if
they do not exist. Because they do not.

**5 July** — Salary lands. One tap: **confirmed**. Totals move for the first time.

**7 July** — Rent went up. Confirm the line, change 800,000 → 850,000. The template is
untouched; Selah asks, once, whether to update it for next month.

**28 July** — The consultancy fee never came. Mark it **did not arrive**. It leaves your
income, stays in your history, and next month the question "has this client ever actually paid
on time?" has an answer.

**Anything else** — added as `unplanned`. Which is the honest name for most of a real month.

---

## 4. WHAT THIS MODULE MUST REFUSE

- To **auto-confirm** anything, for any reason.
- To put an expected line into any total, on any screen.
- To stage a period **before it has started**. July is not staged in June.
- To stage the **same period twice** into the same Book.
- To measure a target against money that has not arrived.
- To guess a **quarterly or annual anchor**. If you have not told us when your year or quarter
  starts, we ask. We do not assume January, and we do not assume July.

---

## 5. THE TAX BOUNDARY — DELIBERATE

**Books do not talk to the tax engine. This is a decision, not an omission.**

A Book earning money *looks* like it should flow into provisional tax — a shop, a rented room,
consultancy. It is tempting, and it is the single most dangerous thing we could build here.

It would mean **making a tax characterisation from a budget label.** A person types "Shop" and
we conclude they carry a business, owe provisional tax four times a year, and start counting
2% a month against them. If we are wrong, we have invented a tax. We have watched Uganda's
entire tax profession do exactly this, and we built a company to say so.

The tax calendar already **asks** the taxpayer, in words, whether they have non-employment
income. That question is the correct interface between these two worlds, and it stays a
question.

> A budget label is not a tax fact.

---

## 6. WHAT WE STILL DO NOT KNOW

- Whether a **weekly** template should start Monday or Sunday. Ugandan payroll is monthly;
  weekly is for traders. We will ask the first person who makes one, rather than guess.
- Whether "did not arrive" should be **chaseable** (remind me, tell me who owes me). It
  probably should. Not in v1.
- Whether Books should be **shareable** (a household budget with a spouse). Real need,
  real data-protection consequences. Not in v1, and not without thinking.

---

# PART TWO — ACCOUNTS
### *"...so they know how they are doing financially"*

A Book tracks money **moving**. An account tracks money **sitting**. Flow and stock.
They are joined by exactly one rule, and it is arithmetic, not opinion:

```
closing = opening + confirmed IN − confirmed OUT ± transfers
```

## The four ways this lies to you, and what stops each

### 1. A transfer is not income
Moving 500,000 from the bank to MoMo makes you no richer and no poorer. Count it as income
and your savings rate is a fantasy — *"you saved 40% this month!"* while your net worth stands
perfectly still. Count it as spending and a person who is fine looks broke.
**It touches two accounts and zero totals.**

### 2. A debt runs the other way
Money **in** to a loan account is a **repayment** — it makes the debt smaller. Treat a loan like
a bank account and every repayment *grows* what you owe, and **the arithmetic never once
complains**.

### 3. Land is not lunch
The emergency fund — *how many months could I survive?* — counts **liquid** money only. A plot
in Gayaza, a VSLA mid-cycle, a fixed deposit, and money a cousin owes you are all real, and
**none of them can be eaten next month**. Counting the plot turns "two weeks of runway" into
"forty months". This is the number people bet on.

### 4. The reconciliation gap is the answer, not the error
We are not a bank. There is no Open Banking in Uganda. **We cannot see your balances.** So a
computed balance is only as good as what was written down — and Ugandan life is full of cash
that never gets written down.

So the month is **re-grounded in reality**. On the 1st you record what the account *actually*
says. We compute what it *should* have said.

> Selah says 180,000. You say 95,000.
> **85,000 left this account and was never recorded.**

That gap is not a bug. It is the airtime, the boda, the soda, the cousin. It is the honest
answer to *"where does my money actually go?"* — and every app that silently resets the balance
to match the bank **destroys the most useful number it had**.

Because every month starts from reality, **the error can never compound.**

## What an entry must now say

Balances are **derived**, so a confirmed entry must name the account the money touched.
Founder's ruling: **required every time, no defaults.** A pre-filled account is a guess that
gets tapped through without being read, and it puts a month's rent in the wrong pocket.
**The UI may suggest. It may not select.**

## Debt interest

Default rate is **0**. If you set a rate, the month's interest is **staged as a draft** and you
confirm it against your statement. Nothing invented, nothing auto-confirmed — consistent with
the law of Books.

## Health

| | built from |
|---|---|
| **Net worth** | assets − debts, and it **names** any account never grounded in a real balance |
| **Emergency fund** | liquid ÷ confirmed monthly outgoings. Refuses to divide by zero rather than report "infinite months" |
| **Savings rate** | confirmed in − confirmed out. Transfers excluded |
| **Debt** | what is owed, what it costs, when it ends |

---

# PART THREE — SHARED BOOKS
### *Dad and Mum both run the child's expenses; neither sees the other's wallet.*

## 1. This is not a feature. It is a disclosure.

Sharing a Book means **disclosing special personal data to a third party**. Under the DPPA that
needs its own lawful basis and its own **recorded consent** — the consent someone gave to let
*Selah* hold their data does not cover letting *another person* see it. Every join is written to
the `consents` table with what exactly was consented to, and it is revocable.

## 2. 🔴 THE HARM WE ARE DESIGNING AGAINST

A shared household Book that leaks a spouse's **personal** spending is a financial-coercion tool.
If Mum's balances, her other Books, or her net worth become visible because she joined *"Child's
expenses"*, we have built something that **will** be used against somebody.

So the boundary is absolute, and it is enforced in the query, not in the UI:

> **A co-member sees the shared Book and nothing else.**
> Not your accounts. Not your balances. Not your other Books. Not your salary. Not your net worth.

## 3. A Book owns its accounts

| | belongs to | who sees it |
|---|---|---|
| **Personal account** (your MoMo, your bank) | **you** | **only you** — in every Book you own |
| **Book account** (the child's savings, the child's unit trust) | **the Book** | every member of that Book |

An entry in a shared Book names **either**:

- a **Book account** → both parents see the balance move; or
- the author's **personal account** → the Book shows *"paid by Dad, from a personal account"*.
  **The money is shared. The source is not.**

A **contribution** (Dad's MoMo → the child's savings account) is a transfer **across the
boundary**. The Book sees *who put in how much* — which is exactly the number two co-parents
need — and never *from where*.

## 4. Leaving

The transactions **stay**. They are the Book's financial record, and deleting them would blow a
hole in the other person's history of money that genuinely moved — 4,000,000 of school fees
vanishing from a Book that really did pay it.

The leaver becomes **"a former member"**.

> 🔴 **This must be said BEFORE they join, not after.** A consent that did not disclose this was
> not informed, and an uninformed consent is not a consent.

## 5. What is still unresolved

- **Who may delete the Book itself?** Only the owner. But the other member's records die with it.
- **Roles.** Can a member only *add*, or also *edit and delete* what the other recorded? A shared
  Book where either party can quietly delete the other's entries is a Book neither can trust.
- **The audit trail becomes load-bearing.** "Who read your data" already exists. In a shared Book
  it must also answer *who changed what, and when*.

---

# PART FOUR — FORECASTING
### *"What is next month likely to look like?"*

## 1. 🔴 THE LAW: A FORECAST IS NOT A BUDGET, AND A BUDGET IS NOT MONEY

We built this module on **"a draft is not money."** A forecast is weaker still — it is a *guess
from history*. It must therefore be the **weakest** object in the system, not the strongest:

- A forecast produces a **SUGGESTED BUDGET**, with its working shown.
- A human accepts, edits, or rejects **every line**.
- It **never** produces a transaction. It never touches a balance. It cannot be confirmed.

> *"Transport: the last 5 months ran 180,000–260,000, median 210,000. Budget 210,000?"*

That is the entire interaction. It shows its working, and a person decides. Exactly like every
other number in Selah.

## 2. 🔴 YOU CANNOT FORECAST A LUMP BY AVERAGING IT

Average six months of school fees and you get **200,000 a month** — a figure that is wrong in
**every single month**. It is wrong at 0 in the months with no bill, and wrong at 200,000 in the
month with a 1,200,000 one.

So a lumpy category is forecast as **WHEN and HOW MUCH**, never as a monthly slice:

> *"School fees: ~1,200,000, due around 1 September. Not 200,000 a month."*

Same law as the budget rollup. **Averaging a lump does not smooth the cost — it smooths the
warning.**

## 3. What the forecast must admit

| | |
|---|---|
| **Thin history** | Under ~3 observations of a category: forecast **nothing**, and say why. A forecast from two data points is a guess wearing a suit. |
| **Erratic spending** | Give a **range**, not a false precise figure. A single number implies a confidence we do not have. |
| **What it cannot see** | It assumes **no school term, no funeral, no medical emergency, no price rise**. The things that actually wreck a Ugandan budget are exactly the things history cannot predict — and it must say so, every time. |

## 4. What it needs from the schema

**Nothing.** Forecasting is derived entirely from dated transactions we already store. It can be
built any time, at zero cost to the data model.

Sharing is the opposite: **ownership and membership are agony to retrofit onto every row.** So
the schema carries them from day one, even though the feature ships later.
