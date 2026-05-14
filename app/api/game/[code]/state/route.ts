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

  // Fetch game state first so we have its id for the player_hands query
  const { data: gs } = await db.from("game_states").select("*").eq("room_id", room.id).single();

  // Then fetch room_players and player_hands in parallel (player_hands needs gs.id)
  const [{ data: players }, { data: hands }] = await Promise.all([
    db.from("room_players").select("*").eq("room_id", room.id),
    gs
      ? db.from("player_hands").select("*").eq("game_state_id", gs.id)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
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

  // Pot cards are deleted from player_hands during a tie (tracked only in round_data.pot_card_ids).
  // Include them so comparison cards still show their stat values during result display.
  const potCardIds = ((gs?.round_data as Record<string, unknown> | null)?.pot_card_ids as string[] | undefined) ?? [];
  const allCardIds = [...new Set([...cardIds, ...potCardIds])];

  const { data: cardStats } = await db
    .from("card_stats")
    .select("card_id, stat_definition_id, value")
    .in("card_id", allCardIds.length > 0 ? allCardIds : ["none"]);

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
