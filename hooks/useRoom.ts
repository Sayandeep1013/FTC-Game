"use client";

import { createClient } from "@/lib/supabase/client";
import type { Room, RoomPlayer } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export function useRoom(roomCode: string, myPlayerId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const lastFetchRef = useRef(-10000);

  const fetchRoom = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 500) return;
    lastFetchRef.current = now;

    const supabase = createClient();
    const { data } = await supabase
      .from("rooms")
      .select("*, room_players(*)")
      .eq("room_code", roomCode)
      .single();

    if (data) {
      setRoom(data as Room);
      setPlayers((data.room_players ?? []) as RoomPlayer[]);
    }
    setLoading(false);
  }, [roomCode]);

  useEffect(() => {
    fetchRoom(true); // force on mount

    const supabase = createClient();

    const channel = supabase
      .channel(`room-lobby-${roomCode}`)
      // Fast path: broadcast from join/leave/add-AI APIs (~50ms)
      .on("broadcast", { event: "players_changed" }, () => fetchRoom())
      // Reliable fallback: Postgres Changes (~400ms, debounced)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, () => fetchRoom())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms" }, () => fetchRoom())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, fetchRoom]);

  async function transferHost(toPlayerId: string) {
    await fetch(`/api/rooms/${roomCode}/host`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_host_id: toPlayerId }),
    });
  }

  async function leaveRoom(playerId: string) {
    await fetch(`/api/rooms/${roomCode}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId }),
    });
  }

  const amHost = !!myPlayerId && room?.host_player_id === myPlayerId;
  const myPlayer = myPlayerId
    ? players.find(p => p.player_id === myPlayerId) ?? null
    : null;

  return { room, players, loading, amHost, myPlayer, transferHost, leaveRoom };
}
