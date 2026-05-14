// ─── Auth & Players ───────────────────────────────────────────────────────────

export type PlayerType = "guest" | "user";

export interface Profile {
  id: string; // matches auth.users.id
  username: string;
  avatar_url: string | null;
  total_wins: number;
  total_games: number;
  created_at: string;
}

export interface GuestSession {
  session_id: string; // randomly generated, stored in sessionStorage
  avatar_preset: string; // e.g. "avatar-03.png"
}

// ─── Decks & Cards ────────────────────────────────────────────────────────────

export interface Universe {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  decks?: Deck[];
}

export interface Deck {
  id: string;
  universe_id?: string | null;
  name: string;
  slug: string;
  cover_image_url: string;
  is_active: boolean;
  display_order?: number;
  card_count?: number;
  stat_count?: number;
  created_at: string;
  universe?: Universe | null;
  stat_definitions?: StatDefinition[];
  cards?: Card[];
}

export interface StatDefinition {
  id: string;
  deck_id: string;
  name: string; // internal key, e.g. "strength"
  display_name: string; // shown in UI, e.g. "Strength"
  is_inverse: boolean; // true = lower value wins (like Rank)
  display_order: number;
}

export interface Card {
  id: string;
  deck_id: string;
  name: string;
  image_url: string | null; // external URL
  image_storage_path: string | null; // Supabase Storage path
  card_stats?: CardStat[];
}

export interface CardStat {
  id: string;
  card_id: string;
  stat_definition_id: string;
  value: number;
  // joined fields
  stat_definition?: StatDefinition;
}

// Resolved card with stats as a flat map for quick lookup
export interface ResolvedCard extends Card {
  stats: Record<string, number>; // key = stat_definition.name, value = numeric value
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export type RoomStatus = "waiting" | "playing" | "finished";

export interface Room {
  id: string;
  room_code: string;
  deck_id: string;
  host_player_id: string;
  max_players: number;
  status: RoomStatus;
  created_at: string;
  deck?: Deck;
  room_players?: RoomPlayer[];
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  player_id: string; // guest session_id OR supabase auth user_id
  player_type: PlayerType;
  room_username: string;
  avatar_url: string; // preset avatar or Google profile pic
  is_host: boolean;
  is_ai: boolean;
  is_eliminated: boolean;
  joined_at: string;
}

// ─── Game State ───────────────────────────────────────────────────────────────

export type GamePhase =
  | "dealing"        // cards being distributed (animation phase)
  | "stat_selection" // active player choosing a stat
  | "comparing"      // all cards revealed, winner being determined
  | "round_end"      // brief pause before next round
  | "finished";      // game over

export interface GameState {
  id: string;
  room_id: string;
  current_turn_player_id: string;
  turn_number: number;
  phase: GamePhase;
  called_stat_id: string | null; // which stat was called this round
  winner_player_id: string | null; // winner of current round (set after comparison)
  created_at: string;
  updated_at: string;
}

export type StackType = "main" | "side";

export interface PlayerHand {
  id: string;
  game_state_id: string;
  player_id: string;
  card_id: string;
  stack_type: StackType;
  position: number; // 0 = top of stack
  card?: Card;
}

// ─── Realtime Payloads ────────────────────────────────────────────────────────

export type RealtimeEvent =
  | { type: "PLAYER_JOINED"; player: RoomPlayer }
  | { type: "PLAYER_LEFT"; player_id: string }
  | { type: "HOST_TRANSFERRED"; new_host_id: string }
  | { type: "GAME_STARTED"; game_state_id: string }
  | { type: "STAT_CALLED"; stat_id: string; caller_id: string }
  | { type: "ROUND_RESULT"; winner_id: string | null; card_ids: string[] }
  | { type: "PLAYER_ELIMINATED"; player_id: string }
  | { type: "GAME_OVER"; winner_id: string }
  | { type: "TURN_TIMEOUT"; player_id: string; auto_stat_id: string };

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface ComparisonCard {
  player_id: string;
  room_username: string;
  avatar_url: string;
  card: ResolvedCard;
  called_value: number;
  is_winner: boolean;
}
