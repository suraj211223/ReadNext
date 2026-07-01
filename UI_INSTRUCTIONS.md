# UI Instructions — Contextual Research Recommender (Neubrutalism)

> **For: Claude Code (frontend / Svelte + Vite)**
> This file defines the *look, feel, and motion* of the app. Pair it with `instructions.md` (which defines architecture & data flow). Build the visual system first (§2–§4), then the page sections (§5–§9), then wire up motion (§10).

---

## 1. Design Direction

**Theme:** Neubrutalism — thick borders, hard offset shadows (zero blur), flat fills, no gradients, confident type. Polished, not chaotic: think "editorial brutalism," not a meme.

**Dual-tone palette:** Off-white + dark grey. One is the surface, the other is ink — and they **swap** between light and dark mode. The single accent is used sparingly for primary actions and highlights.

**Personality:** Bold, fast, a little playful. Big headings, generous whitespace, chunky interactive elements that feel physical (they "press down" when clicked).

**Hard rules:**
- Shadows are **solid, no blur**: `box-shadow: 6px 6px 0 0 var(--ink)`.
- Borders are **thick and visible**: `2px`–`3px solid var(--ink)`.
- **No gradients, no soft drop shadows, no glassmorphism.**
- Corners: choose ONE radius and commit. Recommended `12px` for cards/buttons, `0` only for full-bleed bands. Don't mix.
- Every interactive element shifts on hover/active to expose or collapse its shadow (the "press" effect).

---

## 2. Design Tokens (CSS custom properties)

Define everything as CSS variables on `:root` and override under `[data-theme="dark"]`. Never hardcode a hex outside this block.

```css
:root {
  /* DUAL-TONE CORE — light mode (off-white surface, dark-grey ink) */
  --surface:        #F4F1EA;   /* off-white background */
  --surface-2:      #EAE6DC;   /* slightly deeper off-white for cards/bands */
  --ink:            #2B2B2B;   /* dark grey — text, borders, shadows */
  --ink-soft:       #4A4A4A;   /* secondary text */

  /* ACCENT — single accent, used sparingly */
  --accent:         #C6F24E;   /* acid lime; swap if brand differs */
  --accent-ink:     #1E1E1E;   /* text that sits on the accent */

  /* SEMANTIC */
  --card:           var(--surface);
  --card-2:         var(--surface-2);
  --text:           var(--ink);
  --text-muted:     var(--ink-soft);
  --border:         var(--ink);

  /* NEUBRUTALIST PRIMITIVES */
  --bw:             3px;                         /* border width */
  --radius:         12px;
  --shadow:         6px 6px 0 0 var(--ink);      /* resting hard shadow */
  --shadow-sm:      3px 3px 0 0 var(--ink);
  --shadow-lg:      10px 10px 0 0 var(--ink);
  --press:          translate(3px, 3px);         /* shift on active */

  /* MOTION */
  --ease-snap:      cubic-bezier(.2, .9, .2, 1);
  --dur-fast:       120ms;
  --dur:            260ms;
  --dur-slow:       520ms;
}

[data-theme="dark"] {
  /* DUAL-TONE SWAP — dark grey surface, off-white ink */
  --surface:        #1F1E1C;
  --surface-2:      #292723;
  --ink:            #F4F1EA;
  --ink-soft:       #C9C5BA;

  --accent:         #C6F24E;   /* accent stays constant for brand recall */
  --accent-ink:     #1E1E1E;

  /* shadows in dark mode use ink (off-white) so they read against dark surface */
  --shadow:         6px 6px 0 0 var(--ink);
  --shadow-sm:      3px 3px 0 0 var(--ink);
  --shadow-lg:      10px 10px 0 0 var(--ink);
}
```

> **Dual-tone discipline:** the page is only ever two tones + the accent. In light mode ink is dark grey on off-white; in dark mode it flips to off-white on dark grey. Shadows always use `--ink`, so they invert automatically and stay visible in both modes.

---

## 3. Typography

- **Display / headings:** a heavy grotesque or condensed sans — e.g. **Archivo**, **Space Grotesk**, or **Anton** for hero. Weights 700–900.
- **Body:** a clean neutral sans — **Inter** or **IBM Plex Sans**, 400–500.
- **Mono accents** (keyphrases, code, "method" tags): **IBM Plex Mono** or **JetBrains Mono**.

| Element | Size (desktop) | Weight | Notes |
|---------|----------------|--------|-------|
| Hero H1 | `clamp(3rem, 8vw, 7rem)` | 900 | Tight line-height (0.95), can wrap to 2–3 lines |
| Section H2 | `clamp(2rem, 4vw, 3.25rem)` | 800 | |
| Card title | 1.25rem | 700 | |
| Body | 1rem–1.125rem | 400 | line-height 1.6 |
| Mono tag | 0.8rem | 500 | uppercase, letter-spacing 0.04em |

Use **uppercase + letter-spacing** for small labels and tags; keep large headings sentence/mixed case for readability.

---

## 4. Core Components (build these primitives first)

### `Button.svelte`
```css
.btn {
  border: var(--bw) solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--text);
  box-shadow: var(--shadow);
  font-weight: 700;
  padding: 0.85rem 1.5rem;
  transition: transform var(--dur-fast) var(--ease-snap),
              box-shadow var(--dur-fast) var(--ease-snap);
}
.btn:hover  { transform: translate(-1px, -1px); box-shadow: var(--shadow-lg); }
.btn:active { transform: var(--press);          box-shadow: var(--shadow-sm); } /* "press down" */
.btn--primary { background: var(--accent); color: var(--accent-ink); }
```
This press behavior (hover lifts, active sinks into its shadow) is the signature interaction — apply it to **every** clickable surface.

### `Card.svelte`
Thick border + hard shadow, flat fill `var(--card)`. On hover: lift `translate(-2px,-2px)` and grow shadow to `--shadow-lg`. Used for paper cards and feature blocks.

### `Tag.svelte`
Mono, uppercase, small. Filled `var(--accent)` for keyphrases, or outlined for metadata (year, venue, citation count).

### `ThemeToggle.svelte`
A chunky bordered pill with a sliding knob (hard shadow on the knob). Toggles `data-theme` on `<html>`, persists to **in-memory state only** (no localStorage in artifacts; in the real app you may use `localStorage`, but keep a `prefers-color-scheme` default). Sun/moon icon swaps with a quick rotate.

---

## 5. Page Structure (landing page, top → bottom)

1. **Morphing Nav Bar** (§6)
2. **Hero** — impactful, animated (§7)
3. **Scrolling Research Papers** band — papers animate in on scroll (§8)
4. **How It Works** — the 5-stage pipeline as bordered step cards
5. **Sources Carousel** — showcases data sources (§9)
6. **Live Demo / Upload** CTA — the actual uploader, styled neubrutalist
7. **Footer** (§9.2)

Layout: max content width ~1200px, generous gutters, full-bleed colored bands between sections for rhythm (alternate `--surface` and `--surface-2`).

---

## 6. The Morphing Navigation Bar ⭐ (key interaction)

Three states driven by scroll position and pointer proximity:

**State A — TOP (page at scrollY ≈ 0):**
Full nav bar visible: logo left, links center (`Community · How it works · Sources · Demo`), ThemeToggle + "Sign in" button right. Full-width, bordered bottom edge, hard shadow under the bar.

**State B — SCROLLED (user scrolls down):**
The bar **shrinks and collapses to a single centered dot/pill** floating at the top-center of the viewport. It's a small bordered circle (`56px`) with a hard shadow — like a brutalist "pill." It can show just the logo glyph or a menu icon.

**State C — HOVER REVEAL (pointer enters the top ~80px of the viewport while scrolled):**
The collapsed dot **flexes/expands back** into the full bar with a snappy spring, so the user can navigate, then collapses again when the pointer leaves the top zone or they scroll.

### Behavior spec
- Detect scroll with a throttled listener; `scrolled = scrollY > 24`.
- Detect a top hover zone: an invisible full-width strip `height: 80px` fixed at top; `onmouseenter → revealed = true`, leaving the expanded nav `onmouseleave → revealed = false`.
- The nav shows expanded when **`!scrolled || revealed`**, collapsed (dot) otherwise.
- Animate `width`, `padding`, `border-radius`, and `opacity` of inner content with `--ease-snap`. The container morphs from full-width bar → 56px circle.
- Use a single element that animates between shapes (avoid mounting/unmounting for smoothness). Fade inner links/logo text out as it collapses; fade the dot glyph in.

### Sketch (Svelte-ish)
```svelte
<script>
  let scrolled = false, revealed = false;
  const onScroll = () => { scrolled = window.scrollY > 24; };
  $: expanded = !scrolled || revealed;
</script>

<!-- top hover sensor -->
<div class="nav-sensor"
     on:mouseenter={() => revealed = true}
     on:mouseleave={() => revealed = false}></div>

<nav class="nav" class:expanded class:collapsed={!expanded}>
  {#if expanded}
    <div class="nav-inner"> <Logo/> <Links/> <ThemeToggle/> <Button>Sign in</Button> </div>
  {:else}
    <button class="nav-dot" aria-label="Open menu"><LogoGlyph/></button>
  {/if}
</nav>

<svelte:window on:scroll={onScroll} />
```
```css
.nav-sensor { position: fixed; top: 0; left: 0; right: 0; height: 80px; z-index: 90; }
.nav {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 100; border: var(--bw) solid var(--border); background: var(--card);
  box-shadow: var(--shadow);
  transition: width var(--dur) var(--ease-snap),
              border-radius var(--dur) var(--ease-snap),
              padding var(--dur) var(--ease-snap);
}
.nav.expanded  { width: min(1160px, 92vw); border-radius: var(--radius); padding: 0.6rem 1rem; }
.nav.collapsed { width: 56px; height: 56px; border-radius: 999px; padding: 0; }
```
Add `prefers-reduced-motion`: when set, skip the morph and just toggle visibility instantly.

---

## 7. Hero (impactful + animated)

**Content:** giant H1 — *"From the paragraph in front of you to the five papers you should read next."* Subhead one line. Two buttons: primary **"Try it now"** (accent), secondary **"See how it works"** (outline). A mono tag line above the H1: `NLP · S2AG · REAL-TIME`.

**Animations (on mount):**
- H1 words **stagger up** into place (`translateY(110%) → 0`, masked by `overflow:hidden` line wrappers), 60ms stagger, `--ease-snap`.
- Buttons pop in with the hard shadow "snapping" from `0,0` to `6px,6px`.
- A few **decorative neubrutalist shapes** (bordered circles/squares with hard shadows, in the accent) drift slowly / parallax on mouse move. Optional floating "paper" cards (small bordered rectangles) tilt slightly and bob.
- Keep it tasteful — motion supports the headline, doesn't bury it.

**Layout:** asymmetric. Text left-weighted, a cluster of tilted paper-cards or shapes on the right (echoing the Glassdoor-style hand-drawn energy but in brutalist form).

---

## 8. Scrolling Research-Papers Band (scroll animation)

A section where **paper cards animate in as the user scrolls down**, illustrating "papers surface as you read."

**Two complementary effects (pick or combine):**
1. **Scroll-reveal stagger:** cards start `opacity:0; translateY(40px); rotate(-2deg)` and snap to rest when they enter the viewport (IntersectionObserver, once). Stagger by column.
2. **Marquee / auto-scroll rows:** 2–3 horizontal rows of paper cards that auto-scroll in *opposite directions* (a "ticker" of papers). Pause on hover. Each card is a mini paper preview: title, authors, year tag, citation count, mono `paperId`.

**Card design:** bordered, hard shadow, flat fill; title (700), author line (muted), a row of mono tags (`2017 · NeurIPS · 100k cites`). On hover: lift + shadow grows.

**Scroll-linked extra:** as the section scrolls, drive a subtle parallax — back row moves slower than front row — using `scroll` progress mapped to `translateX`. Throttle and respect reduced-motion.

Implementation note: prefer **IntersectionObserver** for reveals and **CSS keyframe marquees** (`@keyframes scroll-x`) over JS rAF loops where possible, for performance.

---

## 9. Sources Carousel + Footer

### 9.1 Sources Carousel
A horizontally swipeable / auto-advancing carousel showcasing the data sources & tech behind the app: **Semantic Scholar (S2AG)**, **KeyBERT**, **PyMuPDF**, **EasyOCR**, **sentence-transformers**, **spaCy**.

- Each slide is a bordered **brutalist card**: source name (display weight), one-line role ("200M+ indexed papers", "OCR for screenshots", "keyphrase distillation"), and a mono tag.
- **Controls:** chunky bordered prev/next buttons with the press effect; a row of **square** dot indicators (filled accent = active).
- **Behavior:** auto-advance every ~4s, pause on hover/focus; loop infinitely; drag/swipe on touch. Snap transitions (`--ease-snap`), no fade-blur.
- Show 1 card on mobile, 2–3 peeking on desktop (partial next card visible at the edge to signal more).
- Include the disclaimer in small mono near it: *"Not affiliated with or endorsed by the Allen Institute for AI."*

### 9.2 Footer
Full-bleed band in the **opposite tone** to the section above it (high contrast — e.g. dark-grey band with off-white ink even in light mode, for a strong brutalist close).

- Big wordmark / logo, oversized.
- Columns: **Product** (How it works, Demo, Sources), **Project** (About, Tech stack, Roadmap), **Links** (GitHub, Semantic Scholar API).
- A bordered **email capture** row (input + chunky primary button, both with hard shadows).
- Bottom strip: dept credit — *"Dept. of Computer Science · CHRIST (Deemed to be University)"* — plus the S2AG disclaimer, in small mono.
- Thick top border separating it from the page.

---

## 10. Motion System (global rules)

- **Easing:** `--ease-snap` for almost everything — brutalism wants *snap*, not slow fades.
- **Durations:** fast `120ms` (presses), default `260ms` (hovers, nav morph), slow `520ms` (scroll reveals, hero).
- **Signature press:** hover lifts (`-1px,-1px`, shadow grows); active sinks (`+3px,+3px`, shadow shrinks). Universal across buttons, cards, toggle, nav dot.
- **Scroll reveals:** IntersectionObserver, `threshold: 0.15`, fire **once**, stagger siblings 60–80ms.
- **Reduced motion:** wrap all non-essential motion in `@media (prefers-reduced-motion: no-preference)`. When reduced, content appears in final state instantly; carousel still advances but without slide animation; nav toggles without morph.
- **Performance:** animate only `transform`, `opacity`, `box-shadow`. Throttle scroll handlers (rAF or ~16ms). Avoid layout-thrashing properties (`width`/`top`) in per-frame loops — the nav morph runs on discrete state changes, so its `width` transition is fine.

---

## 11. Dark / Light Mode

- Default to `prefers-color-scheme`; let the ThemeToggle override.
- Toggle sets `data-theme="dark"|"light"` on `<html>`; all tokens cascade from §2.
- Because it's a true **dual-tone swap**, verify in *both* modes: shadows stay visible, accent contrast passes on its `--accent-ink`, and no element relies on a hardcoded color.
- Transition `background-color` and `color` on `body` with `--dur` so the swap feels smooth (but don't transition `box-shadow` globally — it can look mushy; let shadows snap).

---

## 12. Accessibility & Responsiveness

- Contrast: dark-grey ink on off-white and the inverse both exceed WCAG AA. Check accent buttons (`--accent-ink` on `--accent`).
- All interactive elements: visible **focus ring** — a brutalist `outline: 3px solid var(--accent); outline-offset: 3px`.
- Nav dot and carousel controls need `aria-label`s; carousel is keyboard-navigable (arrow keys), auto-advance pauses on focus.
- Breakpoints: mobile `<640`, tablet `640–1024`, desktop `>1024`. Hero H1 scales via `clamp`. Nav: on mobile the expanded state is a full-screen bordered menu sheet rather than an inline bar; collapsed state stays a dot.
- Respect `prefers-reduced-motion` everywhere (§10).

---

## 13. Build Order (frontend)

1. Tokens + global styles (§2–§3) and `ThemeToggle` with working dark/light swap.
2. Primitives: `Button`, `Card`, `Tag` with the press interaction (§4).
3. Morphing nav bar with all three states (§6).
4. Hero with mount animations (§7).
5. Scrolling papers band (§8).
6. How-It-Works step cards.
7. Sources carousel (§9.1).
8. Upload CTA (wire to `/api/process` per `instructions.md`).
9. Footer (§9.2).
10. Reduced-motion + responsive pass + a11y audit (§12).

**Definition of done (UI):** dual-tone holds in both modes with no hardcoded colors; every interactive surface has the press effect; nav morphs top-bar → centered dot → reveal-on-top-hover smoothly; papers animate on scroll; sources carousel auto-advances and is swipeable; footer is high-contrast and complete; everything degrades gracefully under reduced motion and down to mobile.
