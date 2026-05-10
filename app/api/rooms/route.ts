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
  const effectiveMaxPlayers = vs_ai ? ai_count + 1 : max_players;
  let room: { id: string; room_code: string } | null = null;
  let lastErr: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const room_code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ room_code, deck_id, host_player_id: player_id, max_players: effectiveMaxPlayers })
      .select("id, room_code")
      .single();

    if (data) {
      room = data;
      break;
    }
    lastErr = error;
    if (error?.code !== "23505") break;
  }

  if (!room) return NextResponse.json({ error: lastErr?.message ?? "Could not create room" }, { status: 500 });

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
