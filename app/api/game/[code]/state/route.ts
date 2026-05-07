import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = createAdminClient();

  const { data: room } = await db
    .from("rooms")
    .select("id, deck_id, max_players, status")
    .eq("room_code", code.toUpperCase())
    .single();
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const [{ data: gs }, { data: players }, { data: hands }] = await Promise.all([
    db.from("game_states").select("*").eq("room_id", room.id).single(),
    db.from("room_players").select("*").eq("room_id", room.id),
    db.from("game_states")
      .select("id")
      .eq("room_id", room.id)
      .single()
      .then(async ({ data: g }) => {
        if (!g) return { data: [] };
        return db.from("player_hands").select("*").eq("game_state_id", g.id);
      }),
  ]);

  // Fetch deck + cards + stats for the game
  const { data: statDefs } = await db
    .from("stat_definitions")
    .select("*")
    .eq("deck_id", room.deck_id)
    .order("display_order");

  const { data: cards } = await db
    .from("cards")
    .select("id, name, image_url, image_storage_path")
    .eq("deck_id", room.deck_id);

  const cardIds = (hands ?? []).map((h: { card_id: string }) => h.card_id);
  const { data: cardStats } = await db
    .from("card_stats")
    .select("card_id, stat_definition_id, value")
    .in("card_id", cardIds.length > 0 ? cardIds : ["none"]);

  return NextResponse.json({
    room,
    game_state: gs,
    players: players ?? [],
    hands: hands ?? [],
    stat_defs: statDefs ?? [],
    cards: cards ?? [],
    card_stats: cardStats ?? [],
  });
}
