# FTC Game — Deferred Features & Future TODO

This document tracks features intentionally deferred from the initial build.
Each item includes context so future devs (or AI) understand the reasoning.

---

## Authentication & Profiles

### [ ] Benefits for Logged-In Users (beyond custom avatar)
Brainstorm ideas discussed:
- Persistent win/loss/games stats on a profile page
- Custom profile page with game history
- Ability to add friends
- Exclusive profile themes or card back cosmetics
- Priority in matchmaking (future)
- Achievement badges (e.g., "Won 100 rounds")
**Priority:** Low — decide after core game is stable

---

## Room & Matchmaking

### [ ] Spectate Mode
**Concept:** Logged-in users can watch a game their friend is in.
**Trigger:** Friend is in an active game → spectate button appears on friend's profile or friend list.
**Details:**
- Spectators see the full board but cannot interact
- Spectators do NOT appear in `room_players` as active players
- Need a separate `spectators` table or a `role` column on `room_players`
- Real-time channel subscription still applies (read-only)
- Spectators should see a "spectating" overlay UI
- Max spectators per room: TBD (probably 10 for now)
**Dependency:** Friends feature must exist first

### [ ] Friends System
**Concept:** Logged-in users can add other logged-in users as friends.
**Tables needed:** `friendships (user_id, friend_id, status: pending/accepted)`
**Features:**
- Send friend request → accept/reject
- See which friends are online / in a game
- Click a friend in a game → Spectate option
- Invite a friend directly to your room (bypasses needing to share code manually)
**Priority:** Medium — implement after core game is polished

---

## AI Opponents

### [ ] Multi-AI Room Configurations
Current: 1 human vs 1 AI only
Future configurations:
- 2 humans + 2 AIs
- 1 human + 3 AIs
- 3 humans + 1 AI
- Any valid combination up to 4 total
**Note:** AI players need distinct `player_id`s and should participate in the Realtime channel as synthetic events.

### [ ] AI Difficulty Levels
- **Easy:** Picks a random stat (current implementation)
- **Medium:** Picks the stat where its card value is above the deck average
- **Hard:** Picks the stat where it has the statistical best chance of winning against known played cards
- **Strategic:** Tracks all previously seen cards, calculates probability of winning per stat
**Priority:** After all human multiplayer is working perfectly

---

## Decks & Cards

### [ ] Admin Panel for Deck/Card Management
**Concept:** A password-protected `/admin` route to manage decks without touching the database directly.
**Features needed:**
- Add a new deck (name, cover image, stat definitions)
- Add cards to a deck (name, image URL or file upload, stat values)
- Edit existing card stats or names
- Toggle deck active/inactive (hide from players without deleting)
- Preview how a deck looks in the carousel
**Tables involved:** `decks`, `stat_definitions`, `cards`, `card_stats`
**Auth:** Only accessible to users with `role: admin` in their profile
**Priority:** Medium — after launch with hardcoded seed data

### [ ] Per-Deck Custom Stats
Current: All decks share the same 8 stats (Rank, Strength, Stamina, Height, Weight, Psychic, IQ, Speed)
Future: Each deck can define its own stat names, count, and inversion rules.
**Already architected for this** via `stat_definitions` table — no schema change needed, just UI to expose it.
Example: A "Cars" deck might have: Speed, Horsepower, Torque, 0-60mph, Top Speed, Weight, Year, Price

---

## Payment & Donations

### [ ] Payment Gateway Integration
Current: "Buy Me a Coffee" button with UPI QR code
Future: Razorpay or Stripe integration for:
- One-time donations with custom amount
- Potential: premium cosmetics (card backs, board themes)
**Note:** Keep payment handling server-side only, never expose keys to client

---

## Game Features

### [ ] Animated Card Reveal Improvements
- Holographic/foil effect on rare cards (CSS gradient mask animation)
- Card back designs unique per deck
- Special win animation when a player gets their last card

### [ ] Game Replay / History
- Record each round's outcome to DB
- Allow players to review the game after it ends
- Dependency: game logging infrastructure

### [ ] Tournament Mode
- Bracket-style tournament across multiple games
- Leaderboard within a tournament session

---

## Technical Debt & Improvements

### [ ] Server-Side Game Logic Validation
Current: Client sends actions, server trusts them, broadcasts result.
Future: Server independently validates every action (prevent cheating).
**How:** Move `engine.ts` logic into API routes; client sends intent, server computes outcome.

### [ ] Rate Limiting on API Routes
- Prevent spam room creation, join attempts
- Use Vercel's built-in rate limiting or `upstash/ratelimit`

### [ ] End-to-End Testing
- Playwright tests for full game flow
- Test tie resolution, elimination, reconnection

---

*Last updated: 2026-05-07*
