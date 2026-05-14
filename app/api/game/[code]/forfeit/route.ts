import { createAdminClient } from "@/lib/supabase/server";
import { broadcast, gameCh } from "@/lib/utils/broadcast";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { player_id } = await req.json();
  const db = createAdminClient();
  const roomCode = code.toUpperCase();

  const { data: room } = await db
    .from("rooms")
    .select("id, status")
    .eq("room_code", roomCode)
    .single();

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "playing") return NextResponse.json({ error: "No active game" }, { status: 400 });

  const { data: gs } = await db
    .from("game_states")
    .select("id, phase, round_data")
    .eq("room_id", room.id)
    .single();

  if (!gs || gs.phase === "finished") {
    return NextResponse.json({ error: "Game already finished" }, { status: 400 });
  }

  // Mark eliminated + remove their cards in parallel
  await Promise.all([
    db.from("room_players")
      .update({ is_eliminated: true })
      .eq("room_id", room.id)
      .eq("player_id", player_id),
    db.from("player_hands")
      .delete()
      .eq("game_state_id", gs.id)
      .eq("player_id", player_id),
  ]);

  // Count remaining active (non-eliminated) players
  const { data: activePlayers } = await db
    .from("room_players")
    .select("player_id")
    .eq("room_id", room.id)
    .eq("is_eliminated", false);

  const remaining = activePlayers ?? [];

  if (remaining.length <= 1) {
    // Game over — last one standing wins
    const winnerId = remaining[0]?.player_id ?? null;
    await Promise.all([
      db.from("rooms").update({ status: "finished" }).eq("id", room.id),
      db.from("game_states").update({
        phase: "finished",
        called_stat_id: null,
        current_turn_player_id: winnerId ?? player_id,
        round_data: {
          is_tie: false,
          pot_card_ids: [],
          tied_player_ids: [],
          tie_stat_id: null,
          tie_type: null,
          last_result: {
            stat_id: null,
            stat_name: "Forfeit",
            cards: [],
            winner_id: winnerId,
            was_tie: false,
            game_winner_id: winnerId,
          },
        },
      }).eq("id", gs.id),
    ]);
  } else {
    // Game continues — clear any tie state, give turn to first remaining player
    const nextPlayerId = remaining[0].player_id;
    await db.from("game_states").update({
      phase: "stat_selection",
      called_stat_id: null,
      current_turn_player_id: nextPlayerId,
      round_data: {
        is_tie: false,
        pot_card_ids: [],
        tied_player_ids: [],
        tie_stat_id: null,
        tie_type: null,
        last_result: (gs.round_data as Record<string, unknown>)?.last_result ?? null,
      },
    }).eq("id", gs.id);
  }

  broadcast(gameCh(roomCode), "round_result", { forfeit: player_id });
  return NextResponse.json({ ok: true });
}
