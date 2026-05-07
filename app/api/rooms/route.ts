import { createAdminClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/utils/roomCode";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { deck_id, max_players, player_id, player_type, room_username, avatar_url, vs_ai, ai_count = 1 } =
    await req.json();

  if (!deck_id || !player_id || !room_username) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Generate unique room code
  let room_code = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateRoomCode();
    const { data } = await supabase.from("rooms").select("id").eq("room_code", candidate).maybeSingle();
    if (!data) { room_code = candidate; break; }
  }
  if (!room_code) return NextResponse.json({ error: "Could not generate room code" }, { status: 500 });

  // max_players: for AI games use ai_count+1 (human + AIs), else use the provided value
  const effectiveMaxPlayers = vs_ai ? ai_count + 1 : max_players;

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({ room_code, deck_id, host_player_id: player_id, max_players: effectiveMaxPlayers })
    .select("id, room_code")
    .single();

  if (roomErr || !room) return NextResponse.json({ error: roomErr?.message }, { status: 500 });

  // Add host player
  const { error: hostErr } = await supabase.from("room_players").insert({
    room_id: room.id,
    player_id,
    player_type: player_type ?? "guest",
    room_username,
    avatar_url,
    is_host: true,
    is_ai: false,
  });
  if (hostErr) return NextResponse.json({ error: hostErr.message }, { status: 500 });

  // Add AI players (supports 1-3 AIs)
  if (vs_ai && ai_count > 0) {
    const aiRows = Array.from({ length: ai_count }, (_, i) => ({
      room_id: room.id,
      player_id: `ai-${room.id}-${i + 1}`,
      player_type: "ai",
      room_username: ai_count === 1 ? "CPU" : `CPU ${i + 1}`,
      avatar_url: "/avatars/avatar-01.png",
      is_host: false,
      is_ai: true,
    }));
    await supabase.from("room_players").insert(aiRows);
  }

  return NextResponse.json({ room_code: room.room_code, room_id: room.id });
}
