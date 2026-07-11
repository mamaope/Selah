# Selah — Brand Guidelines

*Version 1 · 11 July 2026*

**Assets in this folder:**
`selah-logo-primary.svg` · `selah-logo-mark.svg` · `selah-logo-reversed.svg` · `selah-tokens.css`

---

## 1. What we are selling

**Trustworthiness.** Not tax software.

We ask a Ugandan business to believe our number over URA's own website, over PwC's published guidance, and over their accountant of fifteen years. **We will be right — but being right is not enough. We must look like the kind of organisation that would be right.**

**Every rule below exists to protect that. Nothing is decoration.**

---

## 2. The logo

### The mark: ‖

**A caesura.** In music and in verse, the double bar means: *stop here.*

It is the name, rendered. It is the product, rendered. **It is a mark you can stamp on a letter to URA without embarrassment** — and it deliberately does not look like an app icon.

### The lockup

```
‖  SELAH
```

Mark · a gap equal to the mark's own width · the wordmark.

| | |
|---|---|
| **Wordmark type** | Spectral (or Source Serif 4 / Georgia). Regular weight. **Never bold.** |
| **Letter-spacing** | Generous — roughly 0.16em. The name should breathe. |
| **Mark colour** | Teal `#0F6E56` |
| **Wordmark colour** | Ink `#14130F` |
| **Reversed** | Mark `#5DCAA5` · wordmark `#FAF8F3` |
| **Clear space** | The height of the mark, on all four sides. Nothing enters it. |
| **Minimum size** | Lockup: 120px wide. Mark alone: 16px. |

### Which asset, when

| Use | File |
|---|---|
| Default — web header, documents, letterhead | `selah-logo-primary.svg` |
| Favicon, app icon, small spaces, watermark on templates | `selah-logo-mark.svg` |
| Dark backgrounds, printed inverse | `selah-logo-reversed.svg` |

### 🔴 Never

- ❌ Never bold the wordmark
- ❌ Never a gradient, shadow, glow, or outline
- ❌ Never rotate, skew, stretch, or arch
- ❌ Never place on a busy background or photograph
- ❌ Never add a tagline *inside* the lockup
- ❌ Never round the bars — **they are square-cut, like printed rules**
- ❌ Never recolour the mark outside teal / paper

---

## 3. Colour

**Ink on paper, one accent, two signals. That is the entire palette, and the restraint is the point.**

### Ink — text

| Token | Hex | Use |
|---|---|---|
| `--ink-900` | `#14130F` | Primary text, the wordmark. **Warm near-black — never `#000000`.** |
| `--ink-700` | `#3A3833` | Secondary text |
| `--ink-500` | `#6B675E` | Muted, captions |
| `--ink-300` | `#A8A399` | Hints, placeholders, disabled |

### Paper — surfaces

| Token | Hex | Use |
|---|---|---|
| `--paper-000` | `#FFFFFF` | Cards |
| `--paper-050` | `#FAF8F3` | Page background. **Warm. Never clinical white.** |
| `--paper-100` | `#F1EEE6` | Subtle fills, metric cards |
| `--paper-200` | `#E2DED3` | Borders — **always 0.5px** |

### Teal — the one accent

| Token | Hex | |
|---|---|---|
| `--teal-800` | `#08503F` | Text on teal fills |
| **`--teal-600`** | **`#0F6E56`** | **Primary accent. The mark. Key actions.** |
| `--teal-400` | `#1D9E75` | Hover |
| `--teal-100` | `#D7EFE7` | Fills |
| `--teal-050` | `#EAF6F2` | Subtlest fill |

> 🔑 **Teal does three jobs: the brand, "verified" (Confidence A), and money owed *to* you.**
> **One accent doing three jobs is discipline, not poverty.** It means that when the user sees teal, they know: *Selah checked this, and it's good news.*

### The two signals — held back, so they mean something

| | Hex | Means |
|---|---|---|
| **Amber** | `#854F0B` / fill `#F8E7C9` | Confidence B or C. **A conflict with an official source.** An approaching deadline. |
| **Red** | `#A32D2D` / fill `#F5D5D5` | **Confidence F — a refusal.** Arrears. Money you owe. |

### 🔴 Forbidden

- ❌ **No gradients.** Anywhere. Ever.
- ❌ **No drop shadows.** Hairline borders do that job.
- ❌ **No additional colours.** If you are reaching for a fifth hue, the design is wrong.
- ❌ **No bright fintech palette.** No coral, no purple, no electric blue, no lime.
- ❌ **No colour used decoratively.** In Selah, colour is *semantic*. If it isn't carrying meaning, it's ink or paper.

---

## 4. Typography

| | Font | Use |
|---|---|---|
| **Voice** | **Spectral** *(fallback: Source Serif 4, Georgia)* | Headlines, the wordmark, pull quotes. **Authority. This is a document, not a dashboard.** |
| **UI** | **Inter** *(fallback: system sans)* | Interface, labels, body copy. Gets out of the way. |
| 🔑 **Numbers** | **IBM Plex Mono** *(fallback: any tabular mono)* | **Every number. Without exception.** |

### 🔑 The single most important typographic rule

> **Every number is monospaced, tabular, and right-aligned. Decimals stack.**

**Set a tax computation in a proportional font and it reads like a blog post. Set it in mono and it reads like a fact.**

It is what a ledger looks like. What an audit schedule looks like. What a gazette looks like. **It is the cheapest credibility in the entire brand, and it costs one CSS rule.**

```css
.num { font-family: var(--font-num);
       font-variant-numeric: tabular-nums;
       text-align: right; }
```

### Scale & weight

| | |
|---|---|
| Display 40 · Title 22 · Heading 18 · Body 16 · Small 13 · Caption 11 | Nothing below 11px |
| **Two weights only: 400 and 500.** | **Never 600. Never 700.** Bold shouts, and we do not shout. |
| **Sentence case, always.** | Never Title Case. Never ALL CAPS *(except the wordmark).* |

---

## 5. Layout

- **Hairline borders — 0.5px, `--paper-200`.** Never 1px, never heavy.
- **Radius: 8px** for controls, **12px** for cards.
- **Generous white space.** Density comes from *information*, not from cramming.
- **No cards inside cards.** One level of containment.
- **Tables over charts** when the number *is* the point. **Selah is a reference work, not a data-viz startup.**

---

## 6. The trust components

**These are the brand. Everything else is preparation for them.**

### The confidence badge
```
[ A · primary law ]     teal        Safe to display.
[ B · corroborated ]    ink/paper   Safe to display, with the verified date.
[ C · uncertain ]       amber       DO NOT DISPLAY A NUMBER. Route to a human.
[ F · unknown ]         red         REFUSE. Show the refusal card.
```

### The verified stamp
> `verified 11 jul 2026`

**On every claim, without exception. Mono. Lowercase. Quiet.**
**An undated tax claim is a liability — this stamp is our signature.**

### The citation block
> *Income Tax (Amendment) Act 2026, Schedule 4 Part I. Uganda Gazette No. 33, Vol. CXIX, 27 March 2026.*

**Primary law. Act, section, gazette, link. Never a blog.**

### The refusal card
**Red border. Plain language. Four parts, always in this order:**
1. **What we cannot do** — *"We cannot calculate this, and we will not guess."*
2. **Why** — the actual reason, in full, with evidence
3. **What we're doing about it**
4. **What you should do**

> **Every competitor's calculator returns a number here. Ours returns the truth.**
> **A competitor can copy our calculators in a weekend. They cannot copy a refusal card — because to publish one, you must have actually checked, and then been willing to say you don't know.**

### The conflict notice
**Amber. Used when we disagree with an official source.**
> *"URA's own rate page says UGX 235,000. The gazetted Act says UGX 335,000, in force since 1 July 2026. We think URA's page is stale — but here is both, and here are the links."*

**We never quietly override. We show the conflict and let the user decide.**

### The options table
**Never a recommendation. Routes, priced, with what each *requires of you*, what it *costs*, and where it *stops working*.**
**Closing every structuring option, in the user's own words:**

> *"If URA asked you why you did this — and 'to save tax' were not an allowed answer — could you answer?"*

---

## 7. Voice

**Plain. Precise. Unhurried. The numbers do the persuading — we get out of the way.**

| ❌ | ✅ |
|---|---|
| *"Unlock massive tax savings!"* | *"You may not have owed the tax you paid. Here's how to check."* |
| *"Easily manage your compliance."* | *"URA is holding UGX 3,600,000 that belongs to you. You hold 4 of 11 certificates."* |
| *"Our AI-powered engine…"* | *"We read the gazetted Act. URA's website hasn't been updated yet."* |
| *"Consult a professional."* | *"We haven't seen your contracts. Ask your adviser whether this applies to you."* |
| *"Get started today!"* | *"Shall we check your last six payslips?"* |

**Rules:** Sentence case. **No exclamation marks, ever.** No emoji. Contractions are fine — plain, not stiff. **Never "simply," "just," or "easy"** — they condescend, and tax is not easy. Numbers are always specific: *"UGX 3,600,000"*, never *"thousands."* **Every claim carries a date.**

---

## 8. The name — how we tell it

**"Selah" appears 71 times in the Psalms and 3 times in Habakkuk. Its meaning is genuinely disputed.** The most common reading is a musical or literary instruction: *pause — stop here and weigh what has just been said.* Another reading, from the probable root *salah*, is *"to lift up."*

**Both are the company.** Every founding story here is a failure to pause. And what follows the pause is the lifting up.

> ### **Selah. Pause — and know where you stand.**

### 🔑 And we never overclaim it

**The scholars disagree, and we say so.**

**A company whose entire promise is *"we tell you what we don't know"* cannot pretend to certainty about the etymology of its own name.**

> **If we will be honest about our own name, a Ugandan business owner might believe us about their tax.**
>
> **That is not a clever line. It is the strategy.**

---

## 9. What this brand forbids

*Written down so it cannot be quietly abandoned when someone wants a growth spurt.*

- ❌ Never a number without a source
- ❌ Never a claim without a date
- ❌ Never *"do this"*
- ❌ Never quietly override an official source — **show the conflict**
- ❌ Never compute-and-disclaim — **if we don't know, we refuse**
- ❌ Never an exclamation mark
- ❌ Never a testimonial where a citation belongs
- ❌ Never a growth tactic that costs a shred of the thing we are actually selling

> **We are selling the belief that we checked.**
> **Everything else is downstream of that, and nothing is worth spending it on.**
