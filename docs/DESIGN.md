# FTC Game — Design Reference Document

**Style:** Neo-Brutalism  
**Palette:** Black, White, Grey only  
**This document is the source of truth for all visual decisions.**  
Before making any UI change, read this document first.

---

## Core Design Philosophy

Neo-brutalism for this game means:
- **Raw and graphic** — no gradients, no blur, no soft shadows
- **High contrast** — black on white, white on black. Always readable.
- **Structural honesty** — elements look like elements. Buttons look pressable. Cards look like cards.
- **Tactile feel** — offset hard shadows create depth without breaking flatness
- **Editorial** — think magazine layout, not app UI

This style must feel intentional, not unfinished. Every border, every shadow, every gap is a choice.

---

## Color System

```
--black:        #0a0a0a      /* Near-black, used for borders, text, shadows */
--white:        #f5f5f0      /* Off-white, main background */
--grey-light:   #e0e0da      /* Card backgrounds, secondary surfaces */
--grey-mid:     #b0b0a8      /* Disabled states, placeholder text */
--grey-dark:    #4a4a44      /* Secondary text, muted labels */
--accent-line:  #0a0a0a      /* Same as black — all decorative lines are black */
```

No color used for functional meaning (no red for error, no green for success in the traditional sense).
Use **bold text weight**, **outline/border treatment**, or **position** to communicate state instead.

Exception: A very subtle off-black (`#1a1a1a`) for hover states on dark backgrounds.

---

## Typography

**Primary Font:** `Space Grotesk` — used for all UI text, labels, buttons, stats  
**Display Font:** `Bebas Neue` or `Anton` — used for large headings, card names, game title  
**Mono Font:** `JetBrains Mono` or `Space Mono` — used for room codes, stat values, numbers

```css
/* Font scale */
--text-xs:    0.75rem    /* 12px — tiny labels */
--text-sm:    0.875rem   /* 14px — secondary text */
--text-base:  1rem       /* 16px — body */
--text-lg:    1.125rem   /* 18px — slightly emphasized */
--text-xl:    1.25rem    /* 20px — section headers */
--text-2xl:   1.5rem     /* 24px — modal titles */
--text-3xl:   1.875rem   /* 30px — card names */
--text-4xl:   2.25rem    /* 36px — game title, big numbers */
--text-6xl:   3.75rem    /* 60px — hero/splash text */
```

All text is either **black on white** or **white on black**. No grey text except for disabled/muted states.

---

## Borders & Shadows — The Core of the Style

### Borders
```css
--border-thin:    1.5px solid #0a0a0a
--border-base:    2px solid #0a0a0a
--border-thick:   3px solid #0a0a0a
--border-heavy:   4px solid #0a0a0a
```

Everything interactive has a border. Background cards/panels have a border.
Border-radius: **0px everywhere** unless explicitly noted. Hard corners only.

### Offset Hard Shadows
The signature neo-brutalism effect. Shadows are solid black, offset to bottom-right.

```css
--shadow-sm:    3px 3px 0px #0a0a0a
--shadow-base:  4px 4px 0px #0a0a0a
--shadow-lg:    6px 6px 0px #0a0a0a
--shadow-xl:    8px 8px 0px #0a0a0a
--shadow-card:  5px 5px 0px #0a0a0a
```

On hover, shadows reduce (button "presses in"):
```css
/* Hover state for interactive elements */
transform: translate(2px, 2px);
box-shadow: 2px 2px 0px #0a0a0a;
/* Or on click: translate(4px, 4px); box-shadow: none; */
```

---

## Component Specifications

### Buttons

**Primary Button** (main actions: Play, Create Room, Start Game)
```
Background: #0a0a0a (black)
Text: #f5f5f0 (white), font: Space Grotesk, weight: 700, uppercase
Border: 2px solid #0a0a0a
Shadow: 4px 4px 0px #4a4a44
Padding: 12px 24px
Hover: translate(2px, 2px), shadow shrinks to 2px 2px
Active: translate(4px, 4px), shadow none
```

**Secondary Button** (less important: Cancel, Back, Show Details)
```
Background: #f5f5f0 (white)
Text: #0a0a0a (black), font: Space Grotesk, weight: 700, uppercase
Border: 2px solid #0a0a0a
Shadow: 4px 4px 0px #0a0a0a
Padding: 12px 24px
Same hover/active behavior
```

**Danger Button** (Leave Room, Forfeit)
```
Same as Secondary but with dashed border: 2px dashed #0a0a0a
Text includes a warning symbol prefix
```

### Cards

Card dimensions (desktop): `200px × 280px` — classic playing card ratio (~1:1.4)
Card dimensions (mobile landscape): `140px × 196px`

```
Card Container:
  background: #f5f5f0
  border: 3px solid #0a0a0a
  box-shadow: 5px 5px 0px #0a0a0a
  border-radius: 0px

Card Image Section (top 40% of card):
  border-bottom: 2px solid #0a0a0a
  image: object-fit: contain, background: #e0e0da

Card Name Section (middle ~12%):
  background: #0a0a0a
  text: white, font: Bebas Neue or Anton, text-align: center
  padding: 4px 8px

Card Stats Section (bottom 48%):
  background: #f5f5f0
  display: grid, 2 columns
  each stat row: label (grey-dark, text-xs, uppercase) + value (black, text-base, font-weight: 700, mono font)
  dividers between stats: 1px solid #e0e0da
  border between columns: 1px solid #0a0a0a
```

**Card States:**
- Normal (in hand): base shadow
- Active / It's-your-turn: shadow becomes `6px 6px 0px #0a0a0a`, slight scale(1.02), animated pulse border
- Selectable stat: stat row highlights — background `#0a0a0a`, text flips to white on hover
- In comparison area: no shadow, border becomes dashed
- Winner card: border flashes, shadow animates out

**Card Back:**
```
background: repeating-linear-gradient(
  45deg,
  #0a0a0a,
  #0a0a0a 2px,
  #f5f5f0 2px,
  #f5f5f0 12px
)
border: 3px solid #0a0a0a
```
Diagonal stripe pattern — classic, fits the style.

### Modals

```
Overlay: rgba(10, 10, 10, 0.6) — no blur
Modal Container:
  background: #f5f5f0
  border: 3px solid #0a0a0a
  box-shadow: 8px 8px 0px #0a0a0a
  max-width: varies by content
  no border-radius
Header: background #0a0a0a, text white, font: Bebas Neue, padding 12px 20px
Close (X) button: top-right, secondary button style, 32x32, bold X
```

### Input Fields

```
background: white (#ffffff)
border: 2px solid #0a0a0a
box-shadow: 3px 3px 0px #0a0a0a
padding: 10px 14px
font: Space Grotesk
border-radius: 0px
focus: box-shadow shifts to 4px 4px, no outline ring
placeholder: color grey-mid
```

### Room Code Display

```
font: JetBrains Mono, text-4xl, font-weight: 700, letter-spacing: 0.2em
background: #0a0a0a
color: #f5f5f0
padding: 12px 24px
border: 3px solid #0a0a0a
display: inline-block
```

Copy button sits directly adjacent, same height, secondary style.

---

## Layout & Spacing

**Base unit:** 4px
**Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

**Grid:** Mostly flexbox. Game board uses CSS Grid.
**Max content width:** 1200px, centered.

Generous whitespace — neo-brutalism breathes. Don't cram elements.
Use visible grid lines (borders) to separate sections rather than padding alone.

---

## Deck Carousel (Homepage)

```
Layout: Horizontal scroll snap carousel
Deck cards: ~280px × 380px each, visible 3 at a time on desktop
Each deck card:
  - Full bleed image (top 70%)
  - Deck name (Bebas Neue, large, black strip)
  - border: 3px solid #0a0a0a
  - shadow: 6px 6px 0px #0a0a0a
  - On hover: translate(-2px, -2px), shadow grows to 8px 8px
  - "Play" + "Show Details" buttons slide up from bottom on hover
Navigation arrows: large, square (48×48), primary button style
```

---

## Game Board Layout (Desktop)

```
┌─────────────────────────────────────────────┐
│  OPPONENT AREA (top)                        │
│  [card back][card back]... deck count shown │
├─────────────────────────────────────────────┤
│  COMPARISON ZONE (center, full width)       │
│  [card][stat highlight][card]               │
├─────────────────────────────────────────────┤
│  PLAYER AREA (bottom)                       │
│  [active card with stats] [deck count]      │
│  Timer bar beneath active card              │
└─────────────────────────────────────────────┘
Sidebar (right): Player list, scores, round number
```

**Mobile (landscape):**
```
Compressed vertically. Cards scale down (~70%).
Sidebar collapses to top bar.
Stats list becomes scrollable within card.
```

---

## Loading Screen

```
Full black background (#0a0a0a)
Center: Game logo in white (Bebas Neue, very large)
Below: Progress bar — white outline rectangle, black fill animating left to right
       border: 2px solid #f5f5f0, inner fill: #f5f5f0
Text below bar: "Loading assets..." — Space Grotesk, white, small, uppercase
Corner decorations: simple line-art geometric shapes (squares, crosses) — thin white lines

Animation: Logo "stamps" into view (scale from 0.8 to 1.0 with a hard stop, no ease-out)
           Progress bar fills as images + sounds finish loading
```

---

## Turn Timer Bar

```
Position: Bottom of active card, full card width
Height: 6px
Background: #e0e0da (light grey track)
Fill: #0a0a0a (black, shrinking left to right)
Border: 1px solid #0a0a0a

When < 5 seconds remaining:
  fill animates with a fast pulse (opacity 1 → 0.6 → 1, 0.5s cycle)
  a soft tick sound plays each second
```

---

## Animations Reference

### Card Flip (comparison reveal)
```
Duration: 400ms
Keyframes:
  0%:   rotateY(0deg)
  50%:  rotateY(90deg)   ← card face invisible at this point (back shows)
  100%: rotateY(0deg)    ← but now front face visible
Implementation: CSS perspective + rotateY, swap face content at 50%
```

### Card Deal (game start)
```
All 52 cards stack at center.
Then fan out and fly to player positions.
Framer Motion staggered animations — each card delays 30ms from previous.
Duration per card: 300ms, ease-out
```

### Shuffle Animation
```
Cards in a stack visually spring up and fall — cascading spread + re-stack.
Use Framer Motion spring with stiffness: 300, damping: 20.
Show 5-6 cards at a time spreading out then collapsing.
Duration: ~1.5 seconds total.
```

### Win Round
```
Winner's side deck briefly scales up (1.0 → 1.08 → 1.0).
Won cards "fly" from comparison zone to winner's side.
Framer Motion layout animation handles the flight.
Optional: small particle burst (10-15 small squares, CSS animation, black on white).
```

### Card Tilt (hover effect, active card only)
```
Track mouse position relative to card bounds.
Apply: transform: perspective(800px) rotateX(Ydeg) rotateY(Xdeg)
Max tilt: ±12 degrees
Smooth: transition on mouse leave, spring on mouse move
This only applies to the player's own active card (not opponents').
```

### Stat Selection Highlight
```
When hovering a stat row: background transitions to #0a0a0a, text to #f5f5f0
Duration: 80ms (very fast — feels snappy)
Selected stat: stays highlighted + a thin animated underline
```

---

## Buy Me a Coffee Button

```
Position: Bottom-right corner of homepage (fixed position)
Style: Small primary button, black, white text
Text: "☕ Support" (coffee emoji allowed here)
On click: Modal opens with UPI QR code
QR modal: Same modal style as all others
Future: replace QR with payment gateway inline form
```

---

## Iconography

No icon libraries. All icons are either:
1. **Unicode/emoji** (used sparingly — only ☕ for coffee button)
2. **Simple SVG line drawings** — custom, 2px stroke, no fills, black

Icons needed:
- Crown (host badge)
- Copy (room code)
- Share (link)
- Leave (door/arrow)
- Settings/gear (future)
- Timer/clock (turn timer display)

All SVG icons: `currentColor` for stroke, so they inherit text color.

---

## Sound Design Notes

Sound files live in `/public/sounds/`.
Sounds must be loaded during the loading screen — preloaded via `new Audio(src).load()`.

| File | Trigger | Notes |
|---|---|---|
| `card-flip.mp3` | Card revealed in comparison | Short, crisp ~0.3s |
| `card-shuffle.mp3` | Shuffle animation | Paper-shuffle sound ~1.5s |
| `card-deal.mp3` | Cards being dealt | Rapid dealing sound |
| `win-round.mp3` | Player wins a round | Satisfying but not loud |
| `lose-round.mp3` | Player loses a round | Brief subtle sound |
| `game-win.mp3` | Final victory | Celebratory, ~2s |
| `timer-tick.mp3` | Last 5 seconds of timer | Subtle tick |
| `ui-click.mp3` | Any button press | Very subtle click |

Volume: All sounds default to 60% volume. Add a mute toggle (persistent via localStorage).

Free sources: freesound.org, mixkit.co, zapsplat.com

---

*This document should be updated whenever a design decision is made or changed.*  
*Last updated: 2026-05-07*
