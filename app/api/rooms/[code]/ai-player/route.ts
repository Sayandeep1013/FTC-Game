import { createAdminClient } from "@/lib/supabase/server";
import { broadcast, lobbyCh } from "@/lib/utils/broadcast";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = createAdminClient();

  const { data: room } = await db
    .from("rooms")
    .select("id, max_players, room_players(id, player_id, is_ai)")
    .eq("room_code", code.toUpperCase())
    .single();

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const players = room.room_players as { id: string; player_id: string; is_ai: boolean }[];
  if (players.length >= room.max_players) return NextResponse.json({ error: "Room full" }, { status: 400 });

  const aiPlayers = players.filter(p => p.is_ai);

  // Find the highest existing AI index to avoid conflicts when AIs have been kicked
  const maxExistingIndex = aiPlayers.reduce((max, p) => {
    const parts = p.player_id.split("-");
    const n = parseInt(parts[parts.length - 1], 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);

  const newIndex = maxExistingIndex + 1;
  const newLabel = aiPlayers.length === 0 ? "CPU" : `CPU ${newIndex}`;

  const { error } = await db.from("room_players").insert({
    room_id: room.id,
    player_id: `ai-${room.id}-${newIndex}`,
    player_type: "ai",
    room_username: newLabel,
    avatar_url: "/avatars/avatar-01.png",
    is_host: false,
    is_ai: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  broadcast(lobbyCh(code.toUpperCase()), "players_changed");
  return NextResponse.json({ ok: true });
}
