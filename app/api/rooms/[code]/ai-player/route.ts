import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, max_players, room_players(id, is_ai)")
    .eq("room_code", code.toUpperCase())
    .single();

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const currentCount = (room.room_players as { id: string; is_ai: boolean }[]).length;
  if (currentCount >= room.max_players) return NextResponse.json({ error: "Room full" }, { status: 400 });

  const aiIndex = (room.room_players as { is_ai: boolean }[]).filter(p => p.is_ai).length + 1;

  const { error } = await supabase.from("room_players").insert({
    room_id: room.id,
    player_id: `ai-${room.id}-${aiIndex}`,
    player_type: "ai",
    room_username: `CPU ${aiIndex}`,
    avatar_url: "/avatars/avatar-01.png",
    is_host: false,
    is_ai: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
