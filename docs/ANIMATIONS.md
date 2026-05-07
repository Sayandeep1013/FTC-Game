# FTC Game — Animation Reference Document

All animations in the project documented in one place.
Before implementing any animation, check here first.
After implementing, mark status and add implementation notes.

---

## Design Principles

- **Animations must serve the game, not distract from it.** Every animation communicates game state.
- **Consistent spring physics** — use `stiffness: 340, damping: 28` for snappy card movements.
- **Hard stops** on arrival — cards "stamp" into place, no lingering ease-out that looks soft.
- **Duration guide**: micro (80ms) → UI feedback | short (200-400ms) → card movements | medium (500-800ms) → dramatic reveals | long (1-2s) → deal/shuffle sequences.
- **Never block input** — player can always see what's happening. Animations inform, never gate.
- Colors stay black/white/grey — no colored particle effects.

---

## 1. Loading Screen

**Status:** ✅ Implemented

| Element | Animation | Timing |
|---|---|---|
| Logo (FTC) | Scale 0.82→1 + opacity 0→1, spring overshoot | 350ms |
| Subtitle | Opacity 0→1, delayed | delay 300ms |
| Progress bar | Width 0→100%, ease | fills over asset load time |
| Exit | Opacity 1→0 | 400ms |

---

## 2. Deck Carousel (Homepage)

**Status:** ✅ Implemented (partial — missing scroll indicator)

| Element | Animation | Timing |
|---|---|---|
| Each deck card appear | Y 28→0 + opacity, staggered | delay: i × 90ms |
| Deck card hover | Y -8 + shadow grow | 150ms ease-out |
| Deck card hover exit | Y 0 + shadow shrink | 150ms ease-out |
| Action buttons reveal | Opacity 0→1 + Y 14→0 | 150ms |
| Details modal open | Scale 0.96→1 + Y 20→0 | 200ms ease-out |
| Details modal close | Scale 0.96 + opacity 0 | 200ms |
| **TODO** — Scroll arrows | Pulse opacity 0.5↔1 when content overflows | 1.5s infinite |

---

## 3. Room Modal

**Status:** ✅ Implemented

| Element | Animation | Timing |
|---|---|---|
| Modal open | Scale 0.95→1 + Y 16→0 | 180ms |
| Step transition | X 10→0, exit X→-10 | 140ms |
| Player count buttons | Scale + shadow on select | 100ms |

---

## 4. Lobby

**Status:** ✅ Implemented (partial — missing player slot count animation)

| Element | Animation | Timing |
|---|---|---|
| Player joins | X -10→0 + opacity, staggered | 40ms per player |
| Player leaves | X 0→10 + opacity 0, AnimatePresence | 150ms |
| Host badge | None (instant) | — |
| Kick confirm modal | Scale 0.95→1 | 150ms |
| Leave confirm modal | Scale 0.95→1 | 150ms |
| **TODO** — Empty slot fill | Slot background pulses when someone joins | 300ms pulse |
| **TODO** — Room full | Brief flash + "FULL" badge stamps in | 200ms |

---

## 5. Game Start — Dealing Sequence

**Status:** ❌ NOT implemented (currently instant)

This is the most important missing animation. Should feel like a real card game.

### Sequence

```
1. [500ms] Deck of all 52 cards stacks at center of table (card backs)
2. [800ms] Deck fans open slightly to show "shuffling"
3. Cards fly one by one to each player's main deck pile:
   - 2 players: alternate cards → bottom pile, top pile
   - 3 players: cycle cards → bottom, top-left, top-right
   - 4 players: cycle all four corners
4. Each card that arrives adds to the pile (pile height grows visually)
5. [400ms] All piles settled → first player's top card slides to table
```

### Implementation Plan

```tsx
// GameBoard: detect "just started" = turn_number === 1 AND a new game_state was just created
// Show a DealingOverlay component that plays the sequence
// After sequence: set isDealingComplete = true, hide overlay, show normal game

// DealingOverlay:
// - Center: shows a stacked deck (card-back-pattern div, absolute positioned)
// - Uses Framer Motion stagger to fly cards off to corner positions
// - cornerPositions calculated with ref + getBoundingClientRect

// Rough timing:
const DEAL_DELAY_PER_CARD = 40;  // ms between each card being dealt
const TOTAL_DEAL_TIME = 52 * DEAL_DELAY_PER_CARD + 800; // ~2.9s
```

**Key files to create:** `components/game/DealingOverlay.tsx`
**Where to trigger:** `GameBoard.tsx` — detect first load of a new game

---

## 6. Card Draw — Your Card Coming to Table

**Status:** ⚠️ Partially implemented (basic scale+fade — needs positional animation)

### Current behavior
Card fades in from slightly below.

### Target behavior
Card appears to "lift" from the main deck pile at bottom-left and slide to the table slot.

### Implementation Plan

```tsx
// 1. Get position of main deck pile using a ref
// 2. Get position of table slot using a ref
// 3. Animate card from deckPos → tablePos using absolute positioning
// 4. After arrival: switch to normal static positioning

// Approximate animation:
initial={{ x: deckX - tableX, y: deckY - tableY, scale: 0.7 }}
animate={{ x: 0, y: 0, scale: 1 }}
transition={{ type: "spring", stiffness: 300, damping: 26 }}
```

**Timing:** 400ms spring
**Where to add:** `TableCard.tsx` — when `enterFrom` prop is passed, start from deck position

---

## 7. Opponent Card Reveal — Flip from Back to Front

**Status:** ⚠️ Partially implemented (slide from top — needs actual card flip)

### Target behavior
1. Opponent's card appears face-down on their table slot (card back)
2. When comparison fires: card flips face-up with a rotateY animation
3. Called stat row highlights with a brief flash

### Implementation Plan

```tsx
// FlippableCard wrapper component:
<motion.div
  style={{ perspective: 800, transformStyle: "preserve-3d" }}
  animate={{ rotateY: showFront ? 0 : 180 }}
  initial={{ rotateY: 180 }}
  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
>
  <div style={{ backfaceVisibility: "hidden" }}>
    {/* Front: card face */}
  </div>
  <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
    {/* Back: card-back-pattern */}
  </div>
</motion.div>

// Timing:
// - Face-down when opponent's turn starts
// - flip to face-up when showResult = true
// - Stagger each player's flip by 150ms for drama
```

**Timing:** 500ms flip
**Files:** `components/game/TableCard.tsx` — add `flipped` prop

---

## 8. Stat Selection Feedback

**Status:** ✅ Implemented (color change on hover + click)

| Element | Animation | Timing |
|---|---|---|
| Stat row hover | BG black, text white | 80ms |
| Stat row click | Brief scale 0.97 → 1 | 100ms |
| **TODO** — Called stat highlight | Flash white→black 3 times after selection | 150ms × 3 |
| **TODO** — Locked stat (tie) | Opacity 0.3 + faint crosshatch overlay | instant |

---

## 9. Comparison Reveal

**Status:** ⚠️ Partially implemented (cards animate in, values appear)

### Current behavior
Opponent card slides in from top. Values appear immediately.

### Target behavior
1. [0ms] Both cards on table (mine face-up, opponent's face-down)
2. [200ms] Opponent card flips face-up (rotateY 180→0)
3. [400ms] Called stat row on BOTH cards highlights simultaneously
4. [700ms] Score comparison panel fades in with stagger per player
5. [1000ms] Winner card gets a border pulse / glow
6. [Winner's card] Subtle scale 1→1.05→1 bounce

### Implementation Plan

```tsx
// In ComparisonArea or GameBoard:
// Use AnimatePresence + stagger children

const REVEAL_STAGES = {
  cardFlip: 200,        // ms after showResult = true
  statHighlight: 400,   // ms after showResult
  scorePanel: 700,      // ms after showResult
  winnerPulse: 1000,    // ms after showResult
};
```

---

## 10. Card Collection — Won Cards Going to Side Deck

**Status:** ❌ NOT implemented (cards just disappear)

This is the second most important missing animation.

### Target behavior
1. After comparison timer: winner card gets a brief "accepted" pulse
2. All table cards animate to the winner's side deck corner
3. Side deck pile shows a brief "bounce" (scale 1.1→1) as cards arrive
4. Table clears, next card draws

### Implementation Plan

```tsx
// 1. Get position of winner's side deck pile (using a ref passed down)
// 2. Animate table cards to that position: scale down + fly to corner
// 3. Trigger pile bounce animation via a state flag

// Framer Motion:
exit={{
  x: winnerSideDeckX - tableX,
  y: winnerSideDeckY - tableY,
  scale: 0,
  opacity: 0,
  transition: { duration: 0.5, ease: "easeIn" }
}}

// Side deck pile bounce:
animate={{ scale: [1, 1.15, 1] }}
transition={{ duration: 300ms }}
```

**Timing:** 500ms fly + 300ms pile bounce
**Files:** `GameBoard.tsx`, `DeckPile.tsx` — add bounce trigger

---

## 11. Side Deck Reshuffle

**Status:** ❌ NOT implemented

### Target behavior
When a player's main deck runs out and side deck reshuffles:
1. Side deck pile "fans" briefly (cards spread + close)
2. Cards animate from side pile to main pile
3. "RESHUFFLE" brief text appears + fades

### Implementation Plan

```tsx
// Detect reshuffle: prev mainCount was 0, now > 0 AND prev sideCount > 0, now 0
// Show ReshuffleFlash component for 1.5s at that player's position

// ReshuffleFlash:
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0 }}
  className="absolute text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-1"
>
  RESHUFFLE
</motion.div>
```

**Files:** `GameBoard.tsx`, `DeckPile.tsx`

---

## 12. Player Elimination

**Status:** ❌ NOT implemented

### Target behavior
1. Player's deck piles scale down to zero
2. Player card slot shows "ELIMINATED" stamp briefly
3. If it's you: full-screen overlay "YOU'RE OUT — SPECTATING" for 2s before game continues

### Implementation Plan

```tsx
// Detect: is_eliminated changed from false to true for this player_id
// Trigger elimination animation via local state

// Eliminated player's section:
animate={{ opacity: 0.3, scale: 0.9 }}
transition={{ duration: 600ms }}
```

---

## 13. Turn Indicator Arrow

**Status:** ✅ Implemented (bouncing SVG arrow)

| Element | Animation | Timing |
|---|---|---|
| Arrow bounce | Y oscillates ±5px | 1.2s infinite ease-in-out |
| Arrow appear | Opacity 0→1 + Y ±6→0 | 200ms |
| Arrow disappear | AnimatePresence exit | 150ms |

---

## 14. Timer Circle

**Status:** ✅ Implemented (SVG ring with countdown)

| Element | Animation | Timing |
|---|---|---|
| Ring drains | stroke-dashoffset increases, 1s linear steps | per second |
| Urgent flash (≤5s) | Opacity 1↔0.5, alternates each second | 1s per cycle |
| Timer reset | Instant (no transition) when new round starts | — |

---

## 15. Win / Lose Modal

**Status:** ✅ Implemented (scale spring in)

| Element | Animation | Timing |
|---|---|---|
| Modal appear | Scale 0.85→1 + Y 30→0, spring overshoot | 400ms |
| **TODO** — Winner confetti | 20-30 small black squares burst from center | 1s |
| **TODO** — Loser modal | Brief screen flash before modal | 200ms |

---

## Implementation Priority Queue

Rank by visual impact / feasibility:

```
1. [HIGH IMPACT] Opponent card flip (back→front)      — 2-3 hours  ← DO THIS FIRST
2. [HIGH IMPACT] Card collection animation              — 3-4 hours
3. [HIGH IMPACT] Dealing sequence                       — 4-5 hours
4. [MEDIUM]      Stat selection feedback (flash)        — 1 hour
5. [MEDIUM]      Reshuffle flash indicator              — 1 hour
6. [MEDIUM]      Elimination animation                  — 2 hours
7. [LOW]         Win confetti                           — 1 hour
8. [LOW]         Card draw positional animation         — 3 hours (needs ref math)
```

---

## Animation Variables (copy into code as needed)

```typescript
// Springs
export const SPRING_SNAPPY   = { type: "spring", stiffness: 340, damping: 28 };
export const SPRING_BOUNCY   = { type: "spring", stiffness: 300, damping: 18 };
export const SPRING_SMOOTH   = { type: "spring", stiffness: 200, damping: 30 };

// Card flip ease
export const EASE_FLIP = [0.22, 1, 0.36, 1]; // fast-in, slow-out

// Stagger delays
export const STAGGER_CARDS   = 0.12;  // s between each card in a sequence
export const STAGGER_PLAYERS = 0.08;  // s between player entries in lobby

// Durations
export const DUR_MICRO   = 0.08;
export const DUR_SHORT   = 0.25;
export const DUR_MEDIUM  = 0.45;
export const DUR_LONG    = 0.70;
```

---

*Last updated: 2026-05-08*
*Update this doc when animations are implemented or decisions change.*
