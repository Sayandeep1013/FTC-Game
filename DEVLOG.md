# FTC — Fantasy Trump Cards · Dev Log

Real-time multiplayer top-trumps card game. Built solo on Next.js 15 + Supabase.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router (TypeScript) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth — Google OAuth only |
| Realtime | Supabase Realtime Broadcast (REST, ~50ms) + Postgres Changes fallback (~400ms) |
| Storage | Supabase Storage (`game-assets` bucket) |
| Styling | Tailwind CSS + custom neo-brutalism design tokens |
| Animations | Framer Motion |
| Deployment | Vercel (free tier) |

---

## Session 1 — Scaffold & Homepage

**Built:** Next.js project, Supabase schema, Google OAuth, homepage with deck carousel.

**Design system established:**
- Colour tokens: `--black #0a0a0a`, `--white #f5f5f0`, greys
- Neo-brutalism: thick borders, hard box-shadows, no border-radius
- Fonts: Bebas Neue (display), Space Grotesk (sans), JetBrains Mono (mono)
- Utility classes: `.btn-brutal`, `.panel-brutal`, `.input-brutal`, `.stat-row`, etc.

**Bug — `#` in DB password broke seed script:**
Node `--env-file` treats `#` as a comment delimiter. Password `#SAIYAAN.1013x` was silently truncated.
Fix: quote the value in `.env.local` → `SUPABASE_DB_PASSWORD="#SAIYAAN.1013x"`.

**Bug — Ben 10 seed CTE failed:**
Used `EXTRACT(EPOCH FROM NOW()) * random() % 80` — PostgreSQL rejects `double precision % integer`.
Fix: `FLOOR(20 + random() * 80)::numeric`.

**Bug — Deck cover images flashed broken icon:**
`getDeckCoverUrl` returned a Storage URL for `cover_image_url = "pending"`, which 404'd.
Fix: return `null` for null or `"pending"` values so the CSS stripe pattern renders immediately.

---

## Session 2 — Room & Lobby System

**Built:** Create/join room, room code display, player list, AI player slot management, host controls, kick player, leave room, quick-join modal.

**Bug — Lobby not updating when player joins late:**
`useRoom` subscription depended on `myPlayerId` being set. If the session loaded after mount, no subscription was created.
Fix: subscribe on `roomCode` alone (no `myPlayerId` dep). Fetch immediately and on any broadcast.

**Bug — Host didn't enter the game after starting:**
`startGame()` waited for Realtime to detect the `room.status` change before redirecting. Realtime could take 400ms+.
Fix: redirect the host immediately after the API returns 200. Broadcast `game_started` for all other players.

**Feature — Broadcast fast path:**
Created `lib/utils/broadcast.ts` — calls Supabase Realtime REST API directly (~50ms) as the fast path. Postgres Changes (~400ms) is kept as a reliable fallback. A 200ms debounce on `fetchAndSet` prevents double-fetches when both fire for the same event.

---

## Session 3 — Full Game Engine

**Built:** Game start API, deal cards, `action` API (stat pick, tie handling, elimination, win), game state machine, Realtime subscriptions on the game board.

**Game state machine (in `game_states` table):**
- `phase: "stat_selection"` → active player picks a stat
- `called_stat_id` set → server compares, determines winner
- Cards move: played cards **deleted** from `player_hands`, pot tracked in `round_data.pot_card_ids`
- On win: pot cards inserted into winner's `side` stack; `called_stat_id` reset to `null`
- `turn_number` increments each round; `called_stat_id: null` is the idempotency gate

**Bug — Game froze after round 1 (CRITICAL):**
`called_stat_id` was set to `stat_id` after resolving a win (instead of `null`).
Every subsequent round's first pick was rejected by the idempotency check `if (gs.called_stat_id) return early`.
Fix: `called_stat_id: null` in the DB update after winner determination.

**Tie rules implemented:**
- 2-player OR caller-in-tie: caller picks again (any stat), cards stay in pot
- 3+ player, caller NOT in tie: tied players continue with the SAME stat (`tieStatId` locked)

**Bug — AI ID invalid after kick:**
AI player IDs (`ai-{uuid}`) were regenerated on each render. Storing them in component state (not a ref) caused ID mismatch after a human player was kicked and the list re-rendered.
Fix: stable `aiIdRef` using `useRef`.

---

## Session 4 — Game Board UI

**Built:** Full game board layout (`game-body-v2`): opponent half / center strip / my half. TableCard component with 2-column stat layout, flip animation, tilt animation. DeckPile display. TimerCircle. WinLoseModal.

**Card tilt (Balatro-style):**
Mouse position → `mx/my` MotionValues → spring-interpolated `rotateX/Y` on the card face. Only active when `isActive=true` (your turn). Stats area has `stopPropagation` on `onMouseMove` so hovering stats pauses the tilt.

**Card flip:**
CSS 3D `rotateY: 180deg` for face-down, `0` for face-up. Both faces use `backface-visibility: hidden`. Opponent cards flip from back to front when result is revealed.

**Bug — Stat hover and tilt conflicted:**
`StatRow` was a `motion.div` with `whileHover`. Framer Motion intercepted pointer events simultaneously with the card's `onMouseMove`, causing tilt glitches and missed clicks.
Fix: convert `StatRow` to a plain `<div>` (pure CSS hover via `.stat-row:hover`). Add `stopPropagation` on the stats wrapper. Add `pointerEvents: none` on locked stats.

**Bug — Cards overlapping at 100% zoom:**
Fixed `CARD_W=190, CARD_H=280` constants didn't respect viewport height.
Fix: CSS `clamp()` on `.game-card-wrap`:
```css
height: clamp(170px, calc((100dvh - 218px) * 0.5 * 0.85), 260px);
width:  clamp(130px, calc((100dvh - 218px) * 0.5 * 0.85 * 0.70), 182px);
```

---

## Session 5 — Realtime & Timing Fixes

**Bug — 13-second delay between rounds:**
`pickStat()` called `fetchAndSet(true)` immediately after the API call. This loaded next-turn state before `showResult` could fire, causing the wrong card to appear during comparison.
Fix: remove the immediate `fetchAndSet(true)`. Add a 1.2s fallback fetch instead. Broadcast arrives in ~50ms and handles the fast path.

**Card freeze on pick:**
After the player taps a stat, `myHand.top_card` updates from the DB almost immediately (before comparison is shown). The old card would disappear.
Fix: capture `myPlayedCard = myCurrentTopCard` the instant the stat is tapped (`setMyPlayedCard` before the API call). Freeze the display with `isPicking=true`.

**Turn banner:**
Flash overlay ("YOUR TURN" / "[NAME]'S TURN") fires at turn start, auto-fades after 1.8s.

**Timer:**
`TimerCircle` counts down on ALL clients simultaneously (`countDown=true` for everyone). `onExpire` fires only on the active player's client (`isActiveTurn`). `turnKey` prop change resets the interval.

---

## Session 6 — UX Polish

**Stat lock on pick:**
After tapping a stat, it immediately inverts to black (selected state). All other stats become non-interactive.
- `myPickedStatId` state set the instant you tap — no waiting for server confirmation
- `isActive` gains `&& !isPicking` — card becomes fully non-interactive
- CSS hover guard: `.stats-interactive .stat-row:hover` — hover effect ONLY fires when the wrapper has `.stats-interactive`, which is only added on your active turn. Removes the possibility of misleading hover feedback at any other time.

**Opponent position stability:**
Opponents were jumping left↔right when a player was eliminated (array rebuild order changed).
Fix: `opponents` sorted by `player_id` (UUID, stable lexicographic order) — positions never change.

**✓ checkmark scoped correctly:**
The `✓` next to a picked stat was showing on opponent cards during result display too.
Fix: `showCheckmark` prop on `TableCard`, only passed as `true` to the local player's card during `isPicking && !showResult`.

---

## Session 7 — Deck Browser & Admin

**Deck browser modal:**
"View Cards" button in the topbar opens a scrollable grid of all deck cards with stats.
When the modal is open during your turn, the timer migrates from the center strip into the modal header (`TimerCircle` with `initialRemaining` computed from `turnStartedAtRef`). Center strip timer is hidden (`{!deckBrowserOpen && <TimerCircle .../>}`). Modal auto-closes on new turn or timer expiry.

**Bug — Stat values showed as "—" on TIE results:**
During a tie, played cards are **deleted** from `player_hands` and tracked only in `round_data.pot_card_ids`. The state API fetched `card_stats` only for cards still in `player_hands` rows — so tie comparison cards had no stats → all "—".
For wins this didn't happen because played cards are immediately re-inserted as `stack_type: "side"`.
Fix: `state/route.ts` now unions `pot_card_ids` into the `card_stats` query.

**Admin panel** (`/admin`):
- Protected by middleware: must be logged in + email in `ADMIN_EMAILS` env var
- Deck list: cover image upload per deck (Supabase Storage), active/inactive toggle
- Deck editor: stat definitions table (add/edit/delete/reorder), cards grid
- Card editor: name, all stat values, image upload
- CSV bulk import: first row = headers (`name`, then stat internal names), one card per row
- Download CSV template pre-filled with the deck's stat columns

---

## Where to Watch Live Traffic in Supabase

| What you want to see | Where to find it |
|---|---|
| All REST API calls (state/action fetches) | Dashboard → **Logs** → **API** |
| Realtime channel subscriptions | Dashboard → **Database** → **Replication** (shows active channels) |
| Realtime broadcast/message logs | Dashboard → **Logs** → filter by `realtime` |
| Live table changes | Dashboard → **Table Editor** → open any table → watch rows update |
| Postgres Changes events | Dashboard → **Database** → **Replication** → Supabase Realtime section |
| Auth events (login/logout) | Dashboard → **Logs** → **Auth** |
| Storage uploads | Dashboard → **Storage** → `game-assets` bucket |
| Database query performance | Dashboard → **Database** → **Query Performance** |

For deep inspection during a live game: open **Logs → API** and filter by your room code. You'll see every `/api/game/[code]/state` poll and `/api/game/[code]/action` post in real time, with response times and status codes.

---

## Pending / TODO

- Card dealing animation (cards fly from center to player positions at game start)
- Card collection animation (won cards fly to side deck)
- Sound effects (on stat pick, on win, on tie)
- Play Again — host starts new game in same room after game ends
- Server-side 20s auto-pick fallback for fully disconnected players
- Admin: delete deck (cascade)
- Admin: reorder stat definitions via drag-and-drop
- Spectate mode for eliminated players / friends
- AI difficulty levels
- Friends / profile system
