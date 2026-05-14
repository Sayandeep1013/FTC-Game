"use client";

import { createClient } from "@/lib/supabase/client";
import type { StatDefinition } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CardInfo {
  id: string;
  name: string;
  image_url: string | null;
  image_storage_path: string | null;
  stats: Record<string, number>; // stat_name → value
}

export interface PlayerHandInfo {
  player_id: string;
  room_username: string;
  avatar_url: string;
  is_ai: boolean;
  is_eliminated: boolean;
  main_count: number;
  side_count: number;
  top_card: CardInfo | null; // null = no card left
}

export interface RoundResult {
  stat_id: string;
  stat_name: string;
  cards: { player_id: string; card_id: string; value: number; is_winner: boolean }[];
  winner_id: string | null;
  was_tie: boolean;
  game_winner_id?: string | null;
}

export interface GameState {
  phase: string;
  current_turn_player_id: string;
  turn_number: number;
  called_stat_id: string | null;
  round_data: {
    is_tie?: boolean;
    pot_card_ids?: string[];
    tied_player_ids?: string[];
    tie_stat_id?: string | null;
    tie_type?: string | null;
    last_result?: RoundResult;
  };
}

export interface UseGameReturn {
  loading: boolean;
  gameState: GameState | null;
  myHand: PlayerHandInfo | null;
  opponents: PlayerHandInfo[];
  statDefs: StatDefinition[];
  allCards: Record<string, CardInfo>; // ALL cards in the deck (for comparison display)
  isMyTurn: boolean;
  isEliminated: boolean;
  gameOver: boolean;
  gameWinnerId: string | null;
  pickStat: (statId: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────

export function useGame(roomCode: string, myPlayerId: string | null): UseGameReturn {
  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState<FetchedState | null>(null);
  const lastFetchRef = useRef(-10000); // tracks when we last fetched, to debounce duplicates
  const pickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // force=true bypasses debounce (used for explicit user actions like pickStat)
  const fetchAndSet = useCallback(async (force = false) => {
    const now = Date.now();
    // Debounce: skip if we fetched in the last 500ms (broadcast + Postgres Changes both fire)
    if (!force && now - lastFetchRef.current < 200) return;
    lastFetchRef.current = now;
    const data = await fetchState(roomCode);
    if (data) { setRaw(data); setLoading(false); }
  }, [roomCode]);

  useEffect(() => {
    fetchAndSet(true); // force on mount

    const supabase = createClient();
    const channel = supabase
      .channel(`game:${roomCode}`)
      // Fast path: broadcast from action API arrives in ~50ms
      .on("broadcast", { event: "round_result" }, () => fetchAndSet())
      // Reliable fallback: Postgres Changes arrives in ~400ms
      // (debounce prevents double-fetch when both fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_states" }, () => fetchAndSet())
      .on("postgres_changes", { event: "*", schema: "public", table: "player_hands" }, () => fetchAndSet())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, () => fetchAndSet())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, fetchAndSet]);

  // Cancel any pending fallback fetch on unmount to avoid state updates on unmounted component
  useEffect(() => {
    return () => { if (pickTimeoutRef.current) clearTimeout(pickTimeoutRef.current); };
  }, []);

  const pickStat = useCallback(async (statId: string) => {
    if (!myPlayerId) return;
    await fetch(`/api/game/${roomCode}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pick_stat", player_id: myPlayerId, stat_id: statId }),
    });
    // Do NOT fetchAndSet(true) here — that would load next-turn state before showResult fires,
    // causing the next card to appear while comparison is still supposed to be showing.
    // Instead: broadcast arrives in ~50ms + server time;
    // fallback fetch 1.2s later in case broadcast missed.
    if (pickTimeoutRef.current) clearTimeout(pickTimeoutRef.current);
    pickTimeoutRef.current = setTimeout(() => fetchAndSet(true), 1200);
  }, [roomCode, myPlayerId, fetchAndSet]);

  // ── Memoized derived state — O(n) instead of O(n²) per render ────────────
  // Rebuilds only when raw data changes, not on every GameBoard state update.
  const derived = useMemo(() => {
    if (!raw || !raw.game_state) return null;

    // Pre-build stat def lookup so inner loop is O(1) instead of O(n) find()
    const statDefById: Record<string, StatDefinition> = {};
    for (const s of raw.stat_defs) statDefById[s.id] = s;

    // Pre-build card-stats index keyed by card_id
    const cardStatsByCard: Record<string, RawCardStat[]> = {};
    for (const cs of raw.card_stats) {
      (cardStatsByCard[cs.card_id] ??= []).push(cs);
    }

    // Build card lookup — now O(cards × stats_per_card) instead of O(cards × total_stats)
    const cardMap: Record<string, CardInfo> = {};
    for (const card of raw.cards) {
      const stats: Record<string, number> = {};
      for (const cs of (cardStatsByCard[card.id] ?? [])) {
        const def = statDefById[cs.stat_definition_id];
        if (def) stats[def.name] = Number(cs.value);
      }
      cardMap[card.id] = { ...card, stats };
    }

    // Build per-player hand info
    const playerInfoMap: Record<string, PlayerHandInfo> = {};
    for (const player of raw.players) {
      const myCards = raw.hands.filter(h => h.player_id === player.player_id);
      const mainCards = myCards.filter(h => h.stack_type === "main").sort((a, b) => a.position - b.position);
      const sideCards = myCards.filter(h => h.stack_type === "side");
      const topCardId = mainCards[0]?.card_id ?? null;
      playerInfoMap[player.player_id] = {
        player_id: player.player_id,
        room_username: player.room_username,
        avatar_url: player.avatar_url,
        is_ai: player.is_ai,
        is_eliminated: player.is_eliminated,
        main_count: mainCards.length,
        side_count: sideCards.length,
        top_card: topCardId ? (cardMap[topCardId] ?? null) : null,
      };
    }

    return { cardMap, playerInfoMap };
  }, [raw]);

  // ── Derive computed state ─────────────────────────────────────────────────
  if (!raw || !raw.game_state || !derived) {
    return { loading, gameState: null, myHand: null, opponents: [], statDefs: [], allCards: {}, isMyTurn: false, isEliminated: false, gameOver: false, gameWinnerId: null, pickStat };
  }

  const { cardMap, playerInfoMap } = derived;
  const gs = raw.game_state as unknown as GameState;
  const roundData = gs.round_data ?? {};
  const lastResult = roundData.last_result as RoundResult | undefined;

  const allPlayers = Object.values(playerInfoMap);
  const myHand = myPlayerId ? (playerInfoMap[myPlayerId] ?? null) : null;
  // Sort by player_id for a stable, unchanging order as players are eliminated
  const opponents = allPlayers
    .filter(p => p.player_id !== myPlayerId)
    .sort((a, b) => a.player_id.localeCompare(b.player_id));

  const isMyTurn = !!myPlayerId && gs.current_turn_player_id === myPlayerId;
  const isEliminated = myHand?.is_eliminated ?? false;
  const gameOver = gs.phase === "finished";
  const gameWinnerId = gameOver ? (lastResult?.game_winner_id ?? null) : null;

  return {
    loading,
    gameState: gs,
    myHand,
    opponents,
    statDefs: raw.stat_defs as StatDefinition[],
    allCards: cardMap,
    isMyTurn,
    isEliminated,
    gameOver,
    gameWinnerId,
    pickStat,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

interface RawHand { player_id: string; card_id: string; stack_type: string; position: number; }
interface RawPlayer { player_id: string; room_username: string; avatar_url: string; is_ai: boolean; is_eliminated: boolean; }
interface RawCard { id: string; name: string; image_url: string | null; image_storage_path: string | null; }
interface RawCardStat { card_id: string; stat_definition_id: string; value: number; }

interface FetchedState {
  room: { id: string; deck_id: string };
  game_state: GameState;
  players: RawPlayer[];
  hands: RawHand[];
  stat_defs: StatDefinition[];
  cards: RawCard[];
  card_stats: RawCardStat[];
}

async function fetchState(roomCode: string): Promise<FetchedState | null> {
  const res = await fetch(`/api/game/${roomCode}/state`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
