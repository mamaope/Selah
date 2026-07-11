# Selah — Brand Guidelines

**v2 · 11 July 2026 · Direction B, "Verified"**
*Supersedes v1, which was too traditional. See §10.*

**Assets:** `selah-logo-primary.svg` · `selah-logo-mark.svg` · `selah-logo-reversed.svg` · `selah-tokens.css`

---

## 1. What we are selling

**Trustworthiness.** Not tax software.

We ask a Ugandan business to believe our number over URA's own website, over PwC's published guidance, and over their accountant of fifteen years. **We will be right — but being right is not enough. We must look like the kind of organisation that would be right.**

**And it must look like it was built this year.** An out-of-date brand quietly says *our information might be out of date too* — which is the one thing Selah can never say.

---

## 2. The logo

### The mark: ‖

**A caesura.** In music and in verse, the double bar means *stop here.*

The name, rendered. The product, rendered. **Two bars, emerald, 2px radius** — square-cut reads engraved; a hair of softness reads *drawn today*.

### The lockup

```
‖  Selah
```

| | |
|---|---|
| **Wordmark** | **Space Grotesk, weight 500.** Sentence case. Tracking **−0.015em**. |
| **Never** | All-caps. Letterspaced. Serif. Heavier than 500. |
| **Mark** | Emerald `#00A37A` |
| **Wordmark** | Ink `#0A0F0D` |
| **Reversed** | Mark `#16BE90` · wordmark `#FFFFFF` |
| **Clear space** | The mark's height, all four sides |
| **Minimum** | Lockup 100px wide · mark alone 16px |

> ⚠️ **The SVGs use live text.** Before production, **outline the wordmark to paths** so it renders identically everywhere.

### Never

❌ Bold or all-caps the wordmark · ❌ gradients, shadows, glows, outlines · ❌ rotate, skew, stretch · ❌ place on photography · ❌ tagline inside the lockup · ❌ recolour outside emerald/white/ink

---

## 3. Colour

**Emerald on white. One accent, two signals. That is the whole palette, and the restraint is the point.**

### Ink — text
| Token | Hex | |
|---|---|---|
| `--ink-900` | `#0A0F0D` | Primary text, wordmark. **Near-black with a whisper of green — never `#000000`.** |
| `--ink-700` | `#3D4642` | Secondary |
| `--ink-500` | `#6B7570` | Muted, captions |
| `--ink-400` | `#9AA39E` | Hints, placeholders |
| `--ink-300` | `#C4CBC7` | Disabled |

### Surface — crisp, not cream
| Token | Hex | |
|---|---|---|
| `--surface-2` | `#FFFFFF` | Cards |
| `--surface-0` | `#F7F9F8` | Page background |
| `--surface-1` | `#EFF2F1` | Subtle fill |
| `--border` | `#E2E7E5` | Hairline, 1px |

### 🔑 Emerald — the one accent
| Token | Hex | |
|---|---|---|
| `--emerald-900` | `#00543F` | Text on emerald fills |
| `--emerald-700` | `#007A5C` | Pressed |
| **`--emerald-600`** | **`#00A37A`** | **★ Primary. The mark. Key actions.** |
| `--emerald-500` | `#16BE90` | Hover · reversed mark |
| `--emerald-100` | `#D2F2E8` | Fills |
| `--emerald-50` | `#ECFAF5` | Subtlest fill |

> **Emerald does three jobs: the brand, "verified" (Confidence A), and money owed *to* you.**
>
> **One accent doing three jobs is discipline, not poverty.** When a user sees emerald, they know: *Selah checked this, and it's good news.*

### The two signals — held back, so they mean something
| | Hex | Means |
|---|---|---|
| **Amber** | `#D97706` · fill `#FDEBCF` | Confidence B/C · **a conflict with an official source** · an approaching deadline |
| **Red** | `#DC2626` · fill `#FBD9D9` | **Confidence F — a refusal** · arrears · money you owe |

### Forbidden
❌ **No gradients** · ❌ **no drop shadows** beyond the two card tokens · ❌ **no fifth hue** — if you're reaching for one, the design is wrong · ❌ **no decorative colour.** In Selah, colour is *semantic*. If it isn't carrying meaning, it is ink or surface.

### 🔄 Dark mode — REVERSED, 11 July 2026

**Dark is now the DEFAULT.** Light remains available, and the user's choice persists.

*(The earlier decision was light-first. That was overruled. Recording the reversal rather than quietly editing it, because a brand document that hides its own changes is worthless.)*

| | |
|---|---|
| **Default** | `data-theme="dark"` on `<html>`, set before first paint. **No white flash.** |
| **Persistence** | The user's toggle is saved to `localStorage`. Their choice always wins over the default. |
| **Meta** | `<meta name="theme-color" content="#0A0F0D">` — the browser chrome matches. |

### 🔴 The bug dark mode exposed — and the rule that came out of it

**`--emerald-600` is `#00A37A` in light. White text on it is 4.6:1. Fine.**
**In dark it becomes `#16BE90` — a bright mint. White text on THAT is 1.90:1. Unreadable.**

Every button on the site was about to ship illegible.

**The rule:** *what goes ON the accent is a TOKEN, never a hardcode.*

```css
--on-emerald: #FFFFFF;   /* light — on #00A37A */
--on-emerald: #0A0F0D;   /* dark  — on #16BE90. 8.10:1 */
```

**Anywhere you are tempted to write `color: #fff` on a coloured background, you are writing a bug that only appears in the other theme.**

### The one honest cost of dark-first

**Dark reads beautifully indoors and worse in direct sunlight.** A market trader checking her tax on a cheap phone in the Kampala sun is a real user, and light mode serves her better. That is why the toggle exists, why it persists, and why light mode must stay as good as dark — not an afterthought.

**Every contrast pair in both themes is checked and passes WCAG AA.**

---

## 4. Typography

**Sans and mono only. No serif anywhere.**

| | Font | Use |
|---|---|---|
| **Everything** | **Space Grotesk** *(fallback: Inter, system sans)* | Wordmark, headlines, body, labels, UI. |
| 🔑 **Numbers** | **JetBrains Mono** *(fallback: IBM Plex Mono, any tabular mono)* | **Every number. Without exception.** |

### Why Space Grotesk, and not Inter

**Inter is the safe default — which is exactly its problem.** It is on half the internet, and a wordmark set in it says nothing. Space Grotesk is a grotesque with a flicker of engineered character: it reads *made*, *precise*, *deliberate*. **It looks like an instrument, which is what Selah is.**

**We use it throughout — wordmark, headings, and interface.** One voice, not two.

### 🔴 The safety valve — read this before shipping

**Space Grotesk has personality, and personality is a liability at 11–13px in a dense tax table.**

**Before launch, test it in the hardest place it will ever appear:** a full trial balance, a payroll register, and a filing calendar — at `--size-small` (13px) and `--size-caption` (11px), on a cheap Android screen, in daylight.

> **If legibility suffers, the fallback is narrow and pre-agreed: keep Space Grotesk for the wordmark, headings and UI chrome — and drop to Inter for dense body text only.**
>
> **Do not discover this after launch. Test it deliberately, and write down the answer.**

*(The numbers are unaffected either way — they are always JetBrains Mono. See below.)*

### 🔑 The single most important typographic rule

> **Every number is monospaced, tabular, and right-aligned. Decimals stack.**

**Set a tax computation in a proportional font and it reads like a blog post. Set it in mono and it reads like a fact.**

It costs one CSS rule and it is the cheapest credibility in the entire brand.

```css
.num { font-family: var(--font-num);
       font-variant-numeric: tabular-nums;
       text-align: right; }
```

### Scale & weight

Display 40 · Title 24 · Heading 18 · Body 15 · Small 13 · Caption 11. **Nothing below 11px.**

**Two weights: 400 and 500. Never 600. Never 700.** Bold shouts, and we do not shout. Emphasis comes from **colour, space, and scale** — not weight.

**Sentence case, always.** Headlines take tight tracking (−0.02em); everything else is neutral.

---

## 5. Layout

- **1px hairline borders**, `--border`. Never heavy.
- **Radius:** 6px small, 8px controls, 12px cards, 2px the logo bars.
- **Shadows:** the two card tokens only, and sparingly. **Never for decoration.**
- **Generous white space.** Density comes from *information*, not from cramming.
- **No cards inside cards.** One level of containment.
- **Tables over charts** when the number *is* the point. Selah is an instrument, not a data-viz startup.

---

## 6. The trust components

**These are the brand. Everything above is preparation for them.**

### Confidence badges
```
A · primary law    emerald   Safe to display.
B · corroborated   neutral   Safe to display, with the verified date.
C · uncertain      amber     DO NOT DISPLAY A NUMBER. Route to a human.
F · unknown        red       REFUSE. Show the refusal card.
```

### The verified stamp
`verified 11 jul 2026` — mono, lowercase, quiet. **On every claim, without exception.**
**An undated tax claim is a liability. This stamp is our signature.**

### The citation block
*Income Tax (Amendment) Act 2026, Schedule 4 Part I. Uganda Gazette No. 33, Vol. CXIX, 27 March 2026.*
**Primary law. Act, section, gazette, link. Never a blog.**

### The refusal card
**Red border. Four parts, always in this order:**
1. **What we cannot do** — *"We cannot calculate this, and we will not guess."*
2. **Why** — the real reason, in full, with evidence
3. **What we're doing about it**
4. **What you should do**

> **Every competitor's calculator returns a number here. Ours returns the truth.**
> **They can copy our calculators in a weekend. They cannot copy a refusal card — because to publish one you must have actually checked, and then been willing to say you don't know.**

### The conflict notice
**Amber. When we disagree with an official source.**
> *"URA's own rate page says 235,000. The gazetted Act says 335,000, in force since 1 July 2026. We think URA's page is stale — but here is both. You decide."*

**We never quietly override. We show the conflict.**

### The options table
**Never a recommendation.** Routes, priced, with what each *requires of you*, what it *costs*, and where it *stops working*. Closing every structuring option:

> *"If URA asked you why you did this — and 'to save tax' were not an allowed answer — could you answer?"*

---

## 7. Voice

**Plain. Precise. Unhurried. The numbers persuade; we get out of the way.**

| ❌ | ✅ |
|---|---|
| *"Unlock massive tax savings!"* | *"You may not have owed the tax you paid. Here's how to check."* |
| *"Easily manage your compliance."* | *"URA is holding UGX 3,600,000 that belongs to you. You hold 4 of 11 certificates."* |
| *"Our AI-powered engine…"* | *"We read the gazetted Act. URA's website hasn't been updated yet."* |
| *"Consult a professional."* | *"We haven't seen your contracts. Ask your adviser whether this applies to you."* |
| *"Get started today!"* | *"Shall we check your last six payslips?"* |

Sentence case. **No exclamation marks, ever.** No emoji. Contractions are fine — plain, not stiff. **Never "simply," "just," or "easy"** — they condescend, and tax is not easy. Numbers always specific: *"UGX 3,600,000"*, never *"thousands."* **Every claim carries a date.**

---

## 8. The name

**"Selah" appears 71 times in the Psalms and 3 times in Habakkuk. Its meaning is genuinely disputed.** The common reading is a musical or literary instruction: *pause — stop here and weigh what has just been said.* Another, from the probable root *salah*, is *"to lift up."*

**Both are the company.** Every founding story here is a failure to pause. What follows the pause is the lifting up.

> ### **Selah. Pause — and know where you stand.**

### And we never overclaim it

**The scholars disagree, and we say so.** A company whose promise is *"we tell you what we don't know"* cannot pretend to certainty about its own name.

> **If we will be honest about our own name, a Ugandan business owner might believe us about their tax.**

---

## 9. What this brand forbids

❌ A number without a source · ❌ a claim without a date · ❌ *"do this"* · ❌ quietly overriding an official source · ❌ compute-and-disclaim — **if we don't know, we refuse** · ❌ an exclamation mark · ❌ a testimonial where a citation belongs · ❌ any growth tactic that costs a shred of the thing we are actually selling