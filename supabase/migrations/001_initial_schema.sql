-- ============================================================
-- FTC Game — Initial Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ── Profiles ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users. Only created for Google-logged-in users.

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  total_wins    INTEGER NOT NULL DEFAULT 0,
  total_games   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile row when a user signs up via Google OAuth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    -- Use Google display name, fallback to email prefix
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── Decks ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS decks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,        -- e.g. "ben-10"
  cover_image_url TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── Stat Definitions ─────────────────────────────────────────────────────────
-- Dynamic per-deck stat configuration. is_inverse = TRUE means lower value wins.

CREATE TABLE IF NOT EXISTS stat_definitions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id        UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,               -- internal key, e.g. "strength"
  display_name   TEXT NOT NULL,               -- shown in UI, e.g. "Strength"
  is_inverse     BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE for Rank (lower = better)
  display_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(deck_id, name)
);


-- ── Cards ────────────────────────────────────────────────────────────────────
-- image_url: external link (Wikipedia, Fandom, etc.)
-- image_storage_path: Supabase Storage path (for uploaded images)
-- At least one must be non-null. The app prefers image_storage_path if both exist.

CREATE TABLE IF NOT EXISTS cards (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id              UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  image_url            TEXT,                  -- external image URL (nullable — add real URL later)
  image_storage_path   TEXT,                  -- Supabase Storage path (nullable — upload later)
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NOTE: both image fields are intentionally nullable during development.
  -- Add a CHECK constraint once all cards have real images.
);


-- ── Card Stats ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS card_stats (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id              UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  stat_definition_id   UUID NOT NULL REFERENCES stat_definitions(id) ON DELETE CASCADE,
  value                NUMERIC NOT NULL,
  UNIQUE(card_id, stat_definition_id)
);


-- ── Rooms ────────────────────────────────────────────────────────────────────

CREATE TYPE room_status AS ENUM ('waiting', 'playing', 'finished');

CREATE TABLE IF NOT EXISTS rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code       TEXT UNIQUE NOT NULL,        -- 6-char alphanumeric, shown to players
  deck_id         UUID NOT NULL REFERENCES decks(id),
  host_player_id  TEXT NOT NULL,               -- session_id (guest) or user_id (auth)
  max_players     INTEGER NOT NULL CHECK (max_players BETWEEN 2 AND 4),
  status          room_status NOT NULL DEFAULT 'waiting',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast room code lookups (most common query)
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_rooms_status ON rooms(status);


-- ── Room Players ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS room_players (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id      TEXT NOT NULL,               -- session_id or supabase user_id
  player_type    TEXT NOT NULL DEFAULT 'guest' CHECK (player_type IN ('guest', 'user', 'ai')),
  room_username  TEXT NOT NULL,
  avatar_url     TEXT NOT NULL,
  is_host        BOOLEAN NOT NULL DEFAULT FALSE,
  is_ai          BOOLEAN NOT NULL DEFAULT FALSE,
  is_eliminated  BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, player_id)
);

CREATE INDEX idx_room_players_room ON room_players(room_id);


-- ── Game States ──────────────────────────────────────────────────────────────

CREATE TYPE game_phase AS ENUM (
  'dealing',
  'stat_selection',
  'comparing',
  'round_end',
  'finished'
);

CREATE TABLE IF NOT EXISTS game_states (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id               UUID UNIQUE NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  current_turn_player_id TEXT NOT NULL,
  turn_number           INTEGER NOT NULL DEFAULT 1,
  phase                 game_phase NOT NULL DEFAULT 'dealing',
  called_stat_id        UUID REFERENCES stat_definitions(id),
  winner_player_id      TEXT,                 -- winner of the current round
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every change
CREATE OR REPLACE FUNCTION update_game_state_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER game_state_updated
  BEFORE UPDATE ON game_states
  FOR EACH ROW EXECUTE FUNCTION update_game_state_timestamp();


-- ── Player Hands ─────────────────────────────────────────────────────────────
-- Tracks each card's current owner and stack (main deck vs side/won deck).
-- position 0 = top of stack (next card to be played).

CREATE TABLE IF NOT EXISTS player_hands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id   UUID NOT NULL REFERENCES game_states(id) ON DELETE CASCADE,
  player_id       TEXT NOT NULL,
  card_id         UUID NOT NULL REFERENCES cards(id),
  stack_type      TEXT NOT NULL DEFAULT 'main' CHECK (stack_type IN ('main', 'side')),
  position        INTEGER NOT NULL,            -- 0 = top of stack
  UNIQUE(game_state_id, card_id)               -- card can only be in one place at a time
);

CREATE INDEX idx_player_hands_game ON player_hands(game_state_id);
CREATE INDEX idx_player_hands_player ON player_hands(game_state_id, player_id, stack_type);


-- ── Row Level Security ───────────────────────────────────────────────────────
-- Basic RLS: players can read room/game data, but only the server (service role)
-- can write to sensitive tables.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_hands ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, only update their own
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Decks & Cards: fully public read
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decks_read" ON decks FOR SELECT USING (is_active = true);
CREATE POLICY "stat_defs_read" ON stat_definitions FOR SELECT USING (true);
CREATE POLICY "cards_read" ON cards FOR SELECT USING (true);
CREATE POLICY "card_stats_read" ON card_stats FOR SELECT USING (true);

-- Rooms: anyone can read active rooms, only service role writes
CREATE POLICY "rooms_read" ON rooms FOR SELECT USING (true);
CREATE POLICY "room_players_read" ON room_players FOR SELECT USING (true);
CREATE POLICY "game_states_read" ON game_states FOR SELECT USING (true);
CREATE POLICY "player_hands_read" ON player_hands FOR SELECT USING (true);

-- Realtime: enable for game tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;
ALTER PUBLICATION supabase_realtime ADD TABLE player_hands;
