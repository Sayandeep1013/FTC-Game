import { createAdminClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/utils/roomCode";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { deck_id, max_players, player_id, player_type, room_username, avatar_url, vs_ai } =
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

  // Create room
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({ room_code, deck_id, host_player_id: player_id, max_players: vs_ai ? 2 : max_players })
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

  // Add AI player if vs AI
  if (vs_ai) {
    await supabase.from("room_players").insert({
      room_id: room.id,
      player_id: `ai-${room.id}`,
      player_type: "ai",
      room_username: "CPU",
      avatar_url: "/avatars/avatar-01.png",
      is_host: false,
      is_ai: true,
    });
  }

  return NextResponse.json({ room_code: room.room_code, room_id: room.id });
}
