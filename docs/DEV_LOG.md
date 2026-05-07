# FTC Game — Development Log

**Project:** Fantasy Trump Card Game  
**Stack:** Next.js 14 (App Router) + TypeScript + Supabase + Vercel  
**Style:** Neo-Brutalism (black/white/grey)  
**Started:** 2026-05-07  
**Developer:** Solo project  

---

## How to use this document

This is a running diary. Every session of work gets a dated entry.
If you're an AI reading this in a new chat: read the full log to understand what has been built,
what decisions were made and why, and what is next. Do NOT assume anything is done unless it's
listed here as completed. Cross-reference with TODO.md for deferred features.

---

## Project Overview (for new AI sessions)

A real-time multiplayer Top Trumps-style card game. Players pick a themed deck
(Ben 10, Power Rangers, Superheroes, Dragon Ball), enter a room, and compete by
calling stats on their top card. Highest stat wins the round and collects all played
cards. Last player with cards wins.

**Key decisions made before development started:**
- Next.js App Router (not Pages Router)
- TypeScript throughout (.tsx files)
- Supabase for DB + Auth (Google OAuth) + Realtime (replaces Socket.io) + Storage
- Vercel for deployment (free, perfect for Next.js)
- No separate backend server — API routes in Next.js handle all business logic
- Supabase Realtime Channels used for real-time sync (not Socket.io)
- Supabase Presence used for player disconnect detection (no manual heartbeat needed)
- Guest players: random username, one of 20 preset avatars (randomly assigned)
- Logged-in users: Google OAuth, custom avatar, persistent stats, unique username
- Room username (room_username): any player can set a display name for the session, not unique
- All 4 launch decks: Ben 10, Power Rangers, Superheroes, Dragon Ball
- Same 8 stats for all decks for now (Rank, Strength, Stamina, Height, Weight, Psychic, IQ, Speed)
  but DB is dynamic (stat_definitions table) for future per-deck customization
- Card images: stored as URL (external) OR Supabase Storage path — both supported
- Sounds: in /public/sounds/ (not DB)
- AI opponent: 1v1 only for now, random stat selection
- Turn timer: 15-20 seconds, auto-picks random stat on expiry
- Disconnected player mid-game: game waits for timer, auto-picks, player can rejoin
- Eliminated player: stays in room as spectator (reads Realtime channel but can't act)
- Mobile: portrait for pre-game flow, force landscape for game itself
- Design: Neo-brutalism, black/white/grey, hard borders, offset shadows (see DESIGN.md)
- No monetization — "Buy Me a Coffee" UPI QR button only

**Deferred features** (see TODO.md for full details):
- Spectate mode (for friends)
- Friends system
- Multi-AI configurations (2v2, etc.)
- AI difficulty levels
- Admin panel for deck management
- Per-deck custom stat definitions (UI)
- Payment gateway
- Server-side game logic validation
- Tournament mode

---

## Session Log

### 2026-05-07 — Project Planning & Architecture

**What was done:**
- Analyzed requirements document (FANTASY TRUMP CARD PROJECT --Requir.txt)
- Had detailed requirements clarification session with developer
- Decided on full tech stack (see Project Overview above)
- Created project folder structure plan
- Designed DB schema
- Created this DEV_LOG.md
- Created TODO.md with all deferred features
- Created DESIGN.md with full neo-brutalism design reference

**Decisions made this session:**
- Supabase Realtime chosen over Socket.io — no separate server, free, Presence feature handles disconnects
- Vercel chosen for deployment — no Render needed, Next.js API routes are the backend
- `stat_definitions` table makes stats dynamic per deck without core code changes
- Cards support both `image_url` (external) and `image_storage_path` (Supabase Storage)
- `room_players` table uses `player_id` which is either a generated session ID (guest) or Supabase auth user ID
- Room code: 6 uppercase alphanumeric characters, generated server-side, must be unique in `rooms` table
- Shareable room link: `/room/[code]` — visiting the link auto-opens the join flow

**Files created:**
- `docs/TODO.md`
- `docs/DESIGN.md`
- `docs/DEV_LOG.md`

---

### 2026-05-07 — Project Scaffolding & Database Setup

**What was done:**
- Scaffolded the entire Next.js 15 project manually (create-next-app rejected due to folder name with spaces/caps)
- Installed all dependencies: next, react, @supabase/supabase-js, @supabase/ssr, framer-motion, clsx, tailwind-merge, pg
- Created full folder structure (app/, components/, hooks/, lib/, types/, public/, supabase/, docs/)
- Created all configuration files: tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.mjs, eslint.config.mjs
- Wrote comprehensive Tailwind config with neo-brutalism design tokens (shadow-brutal, border-thick, etc.)
- Wrote globals.css with full neo-brutalism design system (custom properties, utility classes, animations)
- Created TypeScript types (types/index.ts) — all game types: Deck, Card, StatDefinition, CardStat, Room, RoomPlayer, GameState, PlayerHand, RealtimeEvent
- Set up Supabase browser client (lib/supabase/client.ts) and server client + admin client (lib/supabase/server.ts)
- Created Next.js middleware (middleware.ts) for session refresh
- Written core game engine (lib/game/engine.ts): compareCards, shuffle, dealCards, pickRandomStat
- Written AI placeholder (lib/game/ai.ts): random stat selection
- Written utility files: cn.ts (className merging), roomCode.ts (6-char generator), avatar.ts (preset avatar assignment)
- Created full DB schema SQL (supabase/migrations/001_initial_schema.sql): all tables, RLS policies, Realtime publication, trigger functions
- Wrote JavaScript seeder (supabase/seed/seed.mjs): all 4 decks, 52 cards each, 8 stats each (placeholder values)
- Ran migrations against Supabase (session pooler, port 5432)
- Verified DB: 4 decks, 8 stat defs each, 52 cards each, 416 stats each — all confirmed
- Fixed Next.js 15 async params issue in room/[code]/page.tsx
- Fixed ESLint no-require-imports error in lib/supabase/server.ts
- Build passes cleanly (npm run build)
- Added npm scripts: db:seed, db:check

**Files created/modified:**
- package.json, tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.mjs, eslint.config.mjs, .gitignore
- .env.example, .env.local (Supabase URL + keys filled in)
- app/layout.tsx, app/page.tsx (placeholder), app/globals.css
- app/(auth)/auth/callback/route.ts, app/room/[code]/page.tsx
- lib/supabase/client.ts, lib/supabase/server.ts
- lib/game/engine.ts, lib/game/ai.ts
- lib/utils/cn.ts, lib/utils/roomCode.ts, lib/utils/avatar.ts
- middleware.ts
- types/index.ts
- supabase/migrations/001_initial_schema.sql
- supabase/seed/seed.mjs (JavaScript seeder — idempotent)
- supabase/run-migrations.mjs, supabase/check-db.mjs (tooling scripts)
- docs/TODO.md, docs/DESIGN.md (created previous session)

**What is NOT done yet:**
- Google OAuth not set up in Supabase dashboard (requires user action — see instructions below)
- No actual UI built yet (homepage, carousel, modals, game board all placeholder)
- No Supabase Realtime hooks written yet
- No API routes written yet
- Not deployed to Vercel yet

**Next steps (in order):**
1. User sets up Google OAuth (see instructions in main chat)
2. Build loading screen component
3. Build homepage with deck carousel (wire to Supabase)
4. Build deck details modal
5. Build room creation/join modal
6. Build lobby page
7. Write Realtime hooks (useRealtime, usePresence)
8. Write API routes (rooms, game actions)
9. Build game board
10. Implement turn timer
11. Implement AI player
12. Polish animations (Framer Motion)
13. Deploy to Vercel

---

*Update this log at the end of every development session.*
*Format: date, what was done, decisions made, files created/modified, what's next.*
