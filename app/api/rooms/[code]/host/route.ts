import { createAdminClient } from "@/lib/supabase/server";
import { broadcast, lobbyCh } from "@/lib/utils/broadcast";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { current_host_id, new_host_id } = await req.json();
  if (!new_host_id) return NextResponse.json({ error: "new_host_id required" }, { status: 400 });

  const roomCode = code.toUpperCase();
  const db = createAdminClient();
  const { data: room } = await db
    .from("rooms")
    .select("id, host_player_id, room_players(player_id, is_ai)")
    .eq("room_code", roomCode)
    .single();

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (current_host_id && room.host_player_id !== current_host_id) {
    return NextResponse.json({ error: "Only the host can transfer host" }, { status: 403 });
  }

  const target = (room.room_players as { player_id: string; is_ai: boolean }[])
    .find((p) => p.player_id === new_host_id);
  if (!target || target.is_ai) return NextResponse.json({ error: "Host must be a human player in this room" }, { status: 400 });

  await db.from("room_players").update({ is_host: false }).eq("room_id", room.id);
  const [{ error: roomErr }, { error: playerErr }] = await Promise.all([
    db.from("rooms").update({ host_player_id: new_host_id }).eq("id", room.id),
    db.from("room_players").update({ is_host: true }).eq("room_id", room.id).eq("player_id", new_host_id),
  ]);

  if (roomErr || playerErr) return NextResponse.json({ error: roomErr?.message ?? playerErr?.message }, { status: 500 });
  broadcast(lobbyCh(roomCode), "players_changed");
  return NextResponse.json({ ok: true });
}
