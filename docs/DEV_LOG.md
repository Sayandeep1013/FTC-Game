# FTC Game — Development Log

**Project:** Fantasy Trump Cards (real-time multiplayer top-trumps card game)
**Stack:** Next.js 15 App Router + TypeScript + Supabase (DB + Auth + Realtime) + Vercel
**Style:** Neo-Brutalism (black/white/grey)
**Started:** 2026-05-07
**Developer:** Solo project (Sayandeep1013)
**Repo:** https://github.com/Sayandeep1013/FTC-Game
**Live:** https://ftc-game.vercel.app

---

## How to use this log

Read this before starting any new session. It is the source of truth for what has been done,
what decisions were made and why, and what is next. Update it at the end of every work session.
Format: date → what was done → decisions made → files changed → what's next.

---

## Architecture Summary (for new AI sessions)

**Tech stack:**
- Frontend + backend: Next.js 15 App Router on Vercel (free)
- Database: Supabase PostgreSQL (free, 500MB)
- Auth: Supabase Auth with Google OAuth provider
- Realtime: Supabase Realtime — Postgres Changes for lobby, same for game state
- File storage: Supabase Storage (card images, deck covers)
- Deployment: Vercel connected to GitHub main branch (auto-deploy on push)

**Key architectural decisions:**
- No separate backend server — Next.js API routes = backend (deployed as Vercel serverless functions)
- Supabase admin client (service role) used in all API routes — bypasses RLS
- Guest players: UUID stored in sessionStorage (`ftc_pid`), avatar from `/avatars/guest-N.svg`
- Logged-in users: Google OAuth, Supabase auth user ID, Google profile photo
- Room username (`room_username`) is session-only, not unique — different from account username
- `NEXT_PUBLIC_APP_URL` env var controls OAuth redirect — must be set in Vercel dashboard
- Vercel: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Local only (never push to Vercel): `SUPABASE_DB_*` vars (for migration scripts)

**Database tables:**
- `profiles` — extends auth.users, created via trigger on Google sign-in
- `decks` — 9 decks (Ben 10, Power Rangers, Superheroes, Dragon Ball, DC Comics, MCU, Naruto, Supercars, Harry Potter)
- `stat_definitions` — 8 stats per deck (rank/strength/stamina/height/weight/psychic/iq/speed), dynamic
- `cards` — 52 per deck, image_url (external) OR image_storage_path (Supabase Storage)
- `card_stats` — one row per card per stat (416 per deck)
- `rooms` — room_code (6-char), deck_id, host_player_id, max_players, status
- `room_players` — player_id (guest UUID or auth user_id), player_type, room_username, avatar_url, is_host, is_ai, is_eliminated
- `game_states` — room_id (unique), current_turn_player_id, turn_number, phase, called_stat_id, round_data (JSONB)
- `player_hands` — game_state_id, player_id, card_id, stack_type (main/side/pot), position

**round_data JSONB structure:**
```json
{
  "is_tie": false,
  "pot_card_ids": [],
  "tied_player_ids": [],
  "tie_stat_id": null,
  "tie_type": null,
  "last_result": {
    "stat_id": "...",
    "stat_name": "...",
    "cards": [{ "player_id": "...", "card_id": "...", "value": 42, "is_winner": true }],
    "winner_id": "...",
    "was_tie": false,
    "game_winner_id": null
  }
}
```

**Game state machine:**
```
LOBBY (rooms.status = "waiting")
  → host clicks Start Game
  → API: shuffle 52 cards, deal (26/17/13 per player), create game_state, set phase = "stat_selection"
  → rooms.status = "playing" → clients redirect to /room/[code]/game

IN GAME (phase = "stat_selection")
  → active player sees their card face-up on the table
  → 15s timer; on expiry: auto-pick random stat
  → AI players: auto-pick after 1.8s delay
  → player picks stat → POST /api/game/[code]/action

ACTION API processes:
  → validates phase, player_id, idempotency (called_stat_id)
  → gets top card of each active player
  → compares stat values
  → if winner: move all cards to winner's side deck → reshuffle empty mains → check eliminations → game over check
  → if tie: accumulate pot, set new active player per tie rules
  → sets called_stat_id = NULL (CRITICAL: must be null for next round to work)
  → stores last_result in round_data for client display

CLIENT receives update (Realtime Postgres Changes or immediate fetch)
  → detects turn_number change → shows comparison on table for 4.2s
  → after 4.2s → table clears → next card drawn
```

**Tie rules:**
- 2-player OR caller in tied group → caller picks any stat from next card (type: "caller")
- 3+ player, caller not in tied group → tied players continue with SAME stat (type: "non_caller")
- Pot accumulates until resolved; all pot cards go to winner

---

## Session Log

### 2026-05-07 — Planning & Architecture

**Done:** Requirements doc analysis, full architecture design, tech stack decisions, DB schema design, deployment plan, three docs created (TODO.md, DESIGN.md, DEV_LOG.md).

**Decisions:** Supabase Realtime over Socket.io (free, no separate server), Vercel for Next.js (free), Google OAuth only (no email), 4 launch decks (expanded to 9 later), same 8 stats for all decks but dynamic via `stat_definitions` table.

**Files created:** `docs/TODO.md`, `docs/DESIGN.md`, `docs/DEV_LOG.md`

---

### 2026-05-07 — Project Scaffolding & DB Setup

**Done:**
- Scaffolded Next.js 15 manually (create-next-app rejected folder name with spaces/caps)
- Installed: next, react, @supabase/supabase-js, @supabase/ssr, framer-motion, clsx, tailwind-merge, pg
- Created full folder structure (app/, components/, hooks/, lib/, types/, public/, supabase/, docs/)
- All config files: tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.mjs, eslint.config.mjs
- Tailwind config with neo-brutalism design tokens (shadow-brutal, border-thick, font-display, etc.)
- globals.css: full design system (custom properties, btn-brutal, panel-brutal, stat-row, room-code, etc.)
- TypeScript types: all game types (Deck, Card, StatDefinition, Room, RoomPlayer, GameState, PlayerHand, RealtimeEvent)
- Supabase browser client, server client, admin client
- Next.js middleware for session refresh
- Core game engine: compareCards, shuffle, dealCards, pickRandomStat
- AI placeholder: random stat selection
- Utilities: cn.ts, roomCode.ts (6-char alphanumeric), avatar.ts
- DB schema SQL (001_initial_schema.sql): all 9 tables, RLS policies, Realtime publication, trigger functions
- JavaScript seeder (seed.mjs): all 4 original decks, 52 cards each, 8 stats (placeholder values)
- Ran migrations against Supabase (session pooler port 5432) — needed because direct connection blocked
- ENOENT Windows dev server issue: fixed by clearing .next folder
- Added .env.local, .env.example, .gitignore

**Bug encountered:** seed.mjs failed initially because `#SAIYAAN.1013x` password was read as comment — fixed by quoting the value in .env.local.

**Files created:** Everything listed above. Package.json, all config, lib/, types/, supabase/, docs/.

---

### 2026-05-07 — Homepage & Auth

**Done:**
- Google OAuth via Supabase (callback route, signInWithGoogle server action)
- Loading screen (preloads deck cover images, progress bar, neo-brutalism style, stamps in with spring animation)
- Header component (FTC logo left, profile button + Join Room button right)
- ProfileButton: avatar dropdown with My Profile + Sign Out
- BuyMeCoffee button (bottom-right fixed, line-art cup SVG, QR modal placeholder)
- BackButton client component (uses router.back() with fallback)
- Homepage: hero section, deck carousel with hover-reveal Details/Play buttons
- DeckCarousel: fixed 310×430px deck cards, CSS geometric cover art per deck
- DeckDetailsModal: 52-card grid, 200px min columns, 2-column stat layout, 140px image height
- DeckCoverArt: CSS pattern per deck (hatching, dots, stripes, crosshatch)
- Fixed Next.js 15 async params for page components

**Bugs fixed:**
- create-next-app rejected folder name → manual scaffold
- Wikipedia image URLs hotlink blocked → replaced with CSS cover art
- `border-3` Tailwind class → added to config
- Google Font @import → switched to next/font/google (server-side, no FOUT)
- Framer Motion interfering with flex width on deck cards → wrapped in plain div

**Files:** app/page.tsx, app/login/page.tsx, app/layout.tsx, components/ui/* (Header, LoadingScreen, ProfileButton, BuyMeCoffee, BackButton, Button), components/deck/* (DeckCarousel, DeckDetailsModal, DeckCoverArt), hooks/useAuth.ts, lib/auth/actions.ts, lib/supabase/client.ts, lib/supabase/server.ts, middleware.ts

---

### 2026-05-07 — Room Flow & Lobby

**Done:**
- useSession hook: detects guest (sessionStorage UUID) vs logged-in (Google ID)
- Guest avatars: 5 SVG line-art user silhouettes (guest-1 through guest-5.svg) in public/avatars/
- Avatar assignment: deterministic from session ID hash (same browser always gets same avatar)
- RoomModal: 5-step flow — username → choose mode → create (pick count) OR join (enter code) OR AI count
- AI game: up to 1 human vs 3 AIs (2/3/4 total player count picker)
- Room API (POST /api/rooms): create room, add host, add N AI players
- Join API (POST /api/rooms/[code]): join room with validation (room full, already started)
- Leave API (DELETE /api/rooms/[code]): leave room, auto-transfer host, close if last human leaves
- Add AI API (POST /api/rooms/[code]/ai-player): host adds AI mid-lobby
- Host transfer API (PATCH)
- Lobby component: player list, host badge, CPU badge, YOU badge, empty slots, Leave button
- Room code display with formatted "ABC-123" + Copy Link button
- Start Game button (host only, enabled only when room full)
- Join-via-link flow: /room/[code] detects if visitor is in room; if not → shows name input + Join prompt
- Realtime subscription in useRoom: fires on room_players and rooms changes
- Leave room: fire-and-forget with keepalive: true (instant UI navigation)
- Quick Join Modal: accessible from header globally, just needs code + name
- Host can kick players (X button per player row); kick calls DELETE with initiator_id validation
- Confirmation modal for Leave (both from Leave button and FTC logo click in lobby)
- Profile icon shows warning modal when in lobby: "Leave lobby?" before navigating
- Profile page (/profile): shows email, username, total_games, total_wins; edit username form
- 5 more decks added: DC Comics, MCU, Naruto, Supercars, Harry Potter (52 cards each)
- DeckCoverArt updated with patterns for all 9 decks

**Bugs fixed:**
- AI player ID conflict after kick: used count-based index → changed to max-existing + 1
- Leave room very slow → fire-and-forget with keepalive:true
- Join modal staying "joining": Header persists across navigations → call onClose() before router.push()
- Ghost player after login: detect old ftc_pid in room_players, DELETE it when user logs in
- FTC logo navigates without warning → intercept in Header, show confirm modal
- Mobile deck buttons invisible (hover-only) → added Framer Motion onTap to toggle

**Files:** hooks/useSession.ts, hooks/useRoom.ts, components/room/* (RoomModal, Lobby, QuickJoinModal), components/ui/* (Header updated, ProfileButton updated, BackButton, BuyMeCoffee), components/profile/ProfileForm.tsx, app/profile/page.tsx, app/api/rooms/* (route.ts, [code]/route.ts, [code]/ai-player/route.ts), lib/auth/profile-actions.ts, public/avatars/guest-1..5.svg, supabase/seed/seed_more_decks.mjs

---

### 2026-05-07 — Game Engine

**Done:**
- DB migration 003: added `round_data JSONB` to game_states, allowed "pot" as stack_type, added index on player_hands for top-card queries
- Start Game API (POST /api/game/[code]/start): validates room/host/player count, shuffles 52 cards, deals (floor(52/n) each), creates game_state, inserts all player_hands rows, sets phase = "stat_selection"
- Action API (POST /api/game/[code]/action, type "pick_stat"):
  - Validates phase, current player, idempotency (called_stat_id null check)
  - Gets top card for each comparing player (position 0 of main stack)
  - Gets stat values for each top card
  - Determines winner (max/min based on is_inverse)
  - Winner branch: moves all pot cards to winner's side deck, reshuffles empty main decks, checks eliminations, checks game over, updates profiles stats, sets called_stat_id = NULL (critical — non-null blocks next round)
  - Tie branch: accumulates pot, determines tie type (caller vs non_caller), sets tied_player_ids and tie_stat_id
  - Stores last_result in round_data for clients to display
- State API (GET /api/game/[code]/state): returns full game state including all hands, cards, stats for reconnection
- useGame hook: fetches state, subscribes to Realtime (game_states + player_hands), exposes myHand/opponents/statDefs/allCards/gameState/pickStat/isMyTurn etc.
- pickStat() in useGame: immediately re-fetches after API call (removes Realtime latency for active player)
- GameBoard component: full table-based game layout
- TableCard component: card displayed on the center table with Balatro-style 3D tilt, stats clickable, highlight on comparison
- DeckPile component: visual stacked card backs with count (shown at player corners)
- TimerCircle component: SVG ring countdown with number, replaces bar
- ComparisonArea: card flip stagger animation, score display, pot count, cards-won count
- WinLoseModal: victory/defeat/spectating modals with Play Again / Back to Home

**Critical bugs found and fixed:**
- called_stat_id not reset after round → game froze after round 1 (fixed: set to null after winner determined)
- useRoom subscription required myPlayerId → lobby didn't update when players joined (fixed: subscribe regardless of myPlayerId)
- AI auto-pick didn't work after reshuffle → effect deps missing aiHasCard (fixed)
- Wrong cards shown in comparison → cardDataMap only had current top cards, played cards already moved → fixed by passing allCards (all deck cards) to ComparisonArea
- 4 cards in side after "1 round" → actually correct behavior (tie in round 1 = 2 pot + 2 played = 4); added "+X cards collected (incl. Y from pot)" message to clarify

**Layout evolution:**
- v1: opponents top, my card bottom center → didn't fit well
- v2: CSS grid with topbar/opponents/table/me → improved
- v3 (current): table is the main stage; deck piles at corners; cards animate onto table from deck position; comparison happens on table; timer circle bottom-right; bouncing arrows indicate active player

**Files:** supabase/migrations/003_game_columns.sql, app/api/game/* (start/route.ts, action/route.ts, state/route.ts), app/room/[code]/game/page.tsx, hooks/useGame.ts, components/game/* (GameBoard, TableCard, DeckPile, TimerCircle, ComparisonArea, WinLoseModal, CardDisplay, CardBack)

---

### What is NOT done yet (as of 2026-05-07)

**Lobby/Room:**
- [ ] Host right-click to transfer host (right-click menu not implemented, only through kick)
- [ ] Spectate mode for friends
- [ ] Friends system

**Game:**
- [ ] Card dealing animation (cards fly from center to player positions at game start)
- [ ] Card collection animation (won cards fly from table to side deck)
- [ ] Shuffle animation (visual for side → main reshuffle)
- [ ] Server-side 20s auto-pick fallback (for fully disconnected players)
- [ ] Reconnection handling (page refresh mid-game restores state — partially works via state API)
- [ ] Multi-opponent layouts (3-player, 4-player table positioning)
- [ ] Sound effects (no sounds yet — files not sourced)

**Infrastructure:**
- [ ] Supabase Realtime Broadcast for instant game updates (currently using Postgres Changes ~400ms)
- [ ] Admin panel for deck/card management
- [ ] Payment gateway (currently just UPI QR placeholder)
- [ ] Image management: how to upload card images (see IMAGE_UPLOAD below)

**Deferred features:** See docs/TODO.md

---

## Image Upload Process

To add real images to cards or decks (currently all placeholder/CSS):

1. Go to Supabase Dashboard → Storage → create bucket "game-assets" (make it public)
2. For deck covers: upload to `game-assets/deck-covers/ben-10.jpg` (name must match deck slug)
3. For card images: upload to `game-assets/cards/ben-10/alien-x.jpg` (any name)
4. Update the card row in Supabase Table Editor:
   - `image_storage_path` = `cards/ben-10/alien-x.jpg` (relative to bucket root)
   - Leave `image_url` as null if using Storage, or vice versa
5. The app auto-resolves: `getCardImageUrl(image_url, image_storage_path)` in lib/utils/imageUrl.ts

No rename required. The storage path in the DB is the only link.

---

## Known Issues (as of last session)

- Game Realtime latency: Postgres Changes is ~300-500ms per event. For a turn-based game this is acceptable but feels slightly sluggish. Supabase Realtime Broadcast would be ~50ms and doesn't require a separate server — implement next.
- Action API runs 10+ sequential DB queries per round (slow). Should be refactored into a PostgreSQL RPC function for atomic execution.
- 3/4-player game board layout not implemented — only 2-player table layout is finalized.
- Sound effects not yet added (no sound files sourced).

---

*Last updated: 2026-05-07 — Session ending after game engine implementation*
