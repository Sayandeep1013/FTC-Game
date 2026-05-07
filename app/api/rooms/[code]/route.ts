import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/rooms/[code] — fetch room + players
export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = createAdminClient();

  const { data: room, error } = await supabase
    .from("rooms")
    .select("*, room_players(*)")
    .eq("room_code", code.toUpperCase())
    .single();

  if (error || !room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}

// POST /api/rooms/[code] — join a room
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { player_id, player_type, room_username, avatar_url } = await req.json();

  const supabase = createAdminClient();

  // Fetch room
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("id, max_players, status, room_players(id)")
    .eq("room_code", code.toUpperCase())
    .single();

  if (roomErr || !room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "waiting") return NextResponse.json({ error: "Game already started" }, { status: 400 });

  const currentCount = (room.room_players as { id: string }[]).length;
  if (currentCount >= room.max_players) return NextResponse.json({ error: "Room is full" }, { status: 400 });

  // Check if already in room
  const { data: existing } = await supabase
    .from("room_players")
    .select("id")
    .eq("room_id", room.id)
    .eq("player_id", player_id)
    .maybeSingle();

  if (!existing) {
    const { error: joinErr } = await supabase.from("room_players").insert({
      room_id: room.id,
      player_id,
      player_type: player_type ?? "guest",
      room_username,
      avatar_url,
      is_host: false,
      is_ai: false,
    });
    if (joinErr) return NextResponse.json({ error: joinErr.message }, { status: 500 });
  }

  return NextResponse.json({ room_id: room.id, room_code: code.toUpperCase() });
}

// DELETE /api/rooms/[code] — leave a room
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { player_id } = await req.json();
  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, host_player_id, room_players(id, player_id, is_ai)")
    .eq("room_code", code.toUpperCase())
    .single();

  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Remove the player
  await supabase.from("room_players").delete().eq("room_id", room.id).eq("player_id", player_id);

  const humanPlayers = (room.room_players as { player_id: string; is_ai: boolean }[])
    .filter(p => !p.is_ai && p.player_id !== player_id);

  if (humanPlayers.length === 0) {
    // No humans left — close the room
    await supabase.from("rooms").update({ status: "finished" }).eq("id", room.id);
  } else if (room.host_player_id === player_id) {
    // Transfer host randomly
    const newHost = humanPlayers[Math.floor(Math.random() * humanPlayers.length)];
    await supabase.from("rooms").update({ host_player_id: newHost.player_id }).eq("id", room.id);
    await supabase.from("room_players").update({ is_host: true }).eq("room_id", room.id).eq("player_id", newHost.player_id);
  }

  return NextResponse.json({ ok: true });
}
