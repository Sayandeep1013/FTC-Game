"use client";

import { createClient } from "@/lib/supabase/client";
import type { StatDefinition } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const fetchAndSet = useCallback(async () => {
    const data = await fetchState(roomCode);
    setRaw(data);
    setLoading(false);
  }, [roomCode]);

  useEffect(() => {
    fetchAndSet();

    const supabase = createClient();
    const channel = supabase
      .channel(`game:${roomCode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_states" }, fetchAndSet)
      .on("postgres_changes", { event: "*", schema: "public", table: "player_hands" }, fetchAndSet)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, fetchAndSet)
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [roomCode, fetchAndSet]);

  const pickStat = useCallback(async (statId: string) => {
    if (!myPlayerId) return;
    await fetch(`/api/game/${roomCode}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pick_stat", player_id: myPlayerId, stat_id: statId }),
    });
  }, [roomCode, myPlayerId]);

  // ── Derive computed state ─────────────────────────────────────────────────
  if (!raw || !raw.game_state) {
    return { loading, gameState: null, myHand: null, opponents: [], statDefs: [], allCards: {}, isMyTurn: false, isEliminated: false, gameOver: false, gameWinnerId: null, pickStat };
  }

  const gs = raw.game_state as unknown as GameState;
  const roundData = gs.round_data ?? {};
  const lastResult = roundData.last_result as RoundResult | undefined;

  // Build card lookup
  const cardMap: Record<string, CardInfo> = {};
  for (const card of raw.cards) {
    const stats: Record<string, number> = {};
    for (const cs of raw.card_stats) {
      if (cs.card_id === card.id) {
        const def = raw.stat_defs.find(s => s.id === cs.stat_definition_id);
        if (def) stats[def.name] = Number(cs.value);
      }
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

  const allPlayers = Object.values(playerInfoMap);
  const myHand = myPlayerId ? (playerInfoMap[myPlayerId] ?? null) : null;
  const opponents = allPlayers.filter(p => p.player_id !== myPlayerId);

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
