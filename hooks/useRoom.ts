"use client";

import { createClient } from "@/lib/supabase/client";
import type { Room, RoomPlayer } from "@/types";
import { useEffect, useRef, useState } from "react";

export function useRoom(roomCode: string, myPlayerId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!myPlayerId) return;
    const supabase = createClient();

    async function fetchRoom() {
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
    }

    fetchRoom();

    // Subscribe to room_players changes
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "room_players",
      }, () => fetchRoom())
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `room_code=eq.${roomCode}`,
      }, () => fetchRoom())
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, myPlayerId]);

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

  const amHost = room?.host_player_id === myPlayerId;
  const myPlayer = players.find(p => p.player_id === myPlayerId) ?? null;

  return { room, players, loading, amHost, myPlayer, transferHost, leaveRoom };
}
