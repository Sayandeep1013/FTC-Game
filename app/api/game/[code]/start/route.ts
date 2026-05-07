import { createAdminClient } from "@/lib/supabase/server";
import { shuffle } from "@/lib/game/engine";
import { broadcast, lobbyCh } from "@/lib/utils/broadcast";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { player_id } = await req.json();
  const db = createAdminClient();
  const roomCode = code.toUpperCase();

  // ── 1. Validate room ──────────────────────────────────────────────────────
  const { data: room } = await db
    .from("rooms")
    .select("*, room_players(*)")
    .eq("room_code", roomCode)
    .single();

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "waiting") return NextResponse.json({ error: "Game already started" }, { status: 400 });
  if (room.host_player_id !== player_id) return NextResponse.json({ error: "Only host can start" }, { status: 403 });

  const allPlayers = room.room_players as { player_id: string; is_ai: boolean; is_eliminated: boolean }[];
  const activePlayers = allPlayers.filter(p => !p.is_eliminated);
  if (activePlayers.length < 2) return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 });
  if (activePlayers.length !== room.max_players) return NextResponse.json({ error: "Room not full yet" }, { status: 400 });

  // ── 2. Fetch all card IDs for the deck ────────────────────────────────────
  const { data: cards } = await db
    .from("cards")
    .select("id")
    .eq("deck_id", room.deck_id);

  if (!cards || cards.length < 2) return NextResponse.json({ error: "Deck has no cards" }, { status: 500 });

  // ── 3. Shuffle and deal ────────────────────────────────────────────────────
  const shuffled = shuffle(cards.map(c => c.id));
  const n = activePlayers.length;
  const perPlayer = Math.floor(shuffled.length / n);

  // Build hand rows for all players
  const handRows: {
    game_state_id: string; player_id: string;
    card_id: string; stack_type: string; position: number;
  }[] = [];

  // ── 4. Create game_state ──────────────────────────────────────────────────
  // Pick first player randomly (can be AI — AI will auto-pick immediately)
  const firstPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];

  const { data: gameState, error: gsErr } = await db
    .from("game_states")
    .insert({
      room_id: room.id,
      current_turn_player_id: firstPlayer.player_id,
      turn_number: 1,
      phase: "dealing",
      round_data: {},
    })
    .select("id")
    .single();

  if (gsErr || !gameState) {
    if (gsErr?.code === "23505") {
      return NextResponse.json({ error: "Game already initialised" }, { status: 409 });
    }
    return NextResponse.json({ error: gsErr?.message ?? "Failed to create game state" }, { status: 500 });
  }

  // Build hand rows now that we have gameState.id
  activePlayers.forEach((player, playerIndex) => {
    const start = playerIndex * perPlayer;
    const slice = shuffled.slice(start, start + perPlayer);
    slice.forEach((cardId, position) => {
      handRows.push({
        game_state_id: gameState.id,
        player_id: player.player_id,
        card_id: cardId,
        stack_type: "main",
        position,
      });
    });
  });

  // ── 5. Insert player hands ────────────────────────────────────────────────
  const { error: handsErr } = await db.from("player_hands").insert(handRows);
  if (handsErr) return NextResponse.json({ error: handsErr.message }, { status: 500 });

  // ── 6. Mark room as playing + set phase to stat_selection ─────────────────
  await Promise.all([
    db.from("rooms").update({ status: "playing" }).eq("id", room.id),
    db.from("game_states")
      .update({ phase: "stat_selection" })
      .eq("id", gameState.id),
  ]);

  // Broadcast to lobby so all non-host players redirect immediately
  broadcast(lobbyCh(roomCode), "game_started");

  return NextResponse.json({ game_state_id: gameState.id, first_player_id: firstPlayer.player_id });
}
