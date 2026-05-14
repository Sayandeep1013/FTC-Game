import { createAdminClient } from "@/lib/supabase/server";
import { shuffle } from "@/lib/game/engine";
import { broadcast, gameCh } from "@/lib/utils/broadcast";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json();
  const roomCode = code.toUpperCase();

  if (body.type === "pick_stat") return handlePickStat(roomCode, body);
  return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
}

// ─────────────────────────────────────────────────────────────────────────────

async function handlePickStat(roomCode: string, body: {
  player_id: string; stat_id: string;
}) {
  const db = createAdminClient();
  const { player_id, stat_id } = body;

  // ── Fetch room + game state ─────────────────────────────────────────────
  const { data: room } = await db
    .from("rooms")
    .select("id, deck_id")
    .eq("room_code", roomCode)
    .single();
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const { data: gs } = await db
    .from("game_states")
    .select("*")
    .eq("room_id", room.id)
    .single();
  if (!gs) return NextResponse.json({ error: "No active game" }, { status: 404 });

  // ── Validate ────────────────────────────────────────────────────────────
  if (gs.phase !== "stat_selection") return NextResponse.json({ error: "Not stat selection phase" }, { status: 400 });
  if (gs.current_turn_player_id !== player_id) return NextResponse.json({ error: "Not your turn" }, { status: 403 });
  if (gs.called_stat_id) return NextResponse.json({ ok: true, idempotent: true }); // already processed

  const roundData = (gs.round_data ?? {}) as Record<string, unknown>;
  const isTieActive = !!(roundData.is_tie);
  const tieType = roundData.tie_type as string | undefined;
  const potCardIds = (roundData.pot_card_ids as string[] | undefined) ?? [];
  const tiedPlayerIds = (roundData.tied_player_ids as string[] | undefined) ?? [];
  const tieStatId = roundData.tie_stat_id as string | undefined;

  // If non-caller tie is active, the stat_id must match the tie stat
  if (isTieActive && tieType === "non_caller" && tieStatId && stat_id !== tieStatId) {
    return NextResponse.json({ error: "Must use the same stat for tie continuation" }, { status: 400 });
  }

  // ── Fetch stat definition + active players in parallel ──────────────────
  const [{ data: statDef }, { data: roomPlayers }] = await Promise.all([
    db.from("stat_definitions").select("id, name, is_inverse").eq("id", stat_id).single(),
    db.from("room_players").select("player_id, is_ai, is_eliminated").eq("room_id", room.id),
  ]);
  if (!statDef) return NextResponse.json({ error: "Invalid stat" }, { status: 400 });

  const activePlayers = (roomPlayers ?? []).filter(p => !p.is_eliminated);
  // In a tie, only the tied players participate
  const comparingPlayerIds = isTieActive && tiedPlayerIds.length > 0
    ? activePlayers.filter(p => tiedPlayerIds.includes(p.player_id)).map(p => p.player_id)
    : activePlayers.map(p => p.player_id);

  // ── Get top cards for each comparing player ──────────────────────────────
  const { data: topCardRows } = await db
    .from("player_hands")
    .select("player_id, card_id, position")
    .eq("game_state_id", gs.id)
    .eq("stack_type", "main")
    .in("player_id", comparingPlayerIds)
    .order("position", { ascending: true });

  // One top card per player (lowest position)
  const topCards: Record<string, string> = {}; // player_id → card_id
  for (const row of topCardRows ?? []) {
    if (!topCards[row.player_id]) topCards[row.player_id] = row.card_id;
  }

  const playingIds = Object.keys(topCards);
  if (playingIds.length < 2) {
    return NextResponse.json({ error: "Not enough players with cards" }, { status: 400 });
  }

  // ── Get stat values for each top card ───────────────────────────────────
  const { data: statValues } = await db
    .from("card_stats")
    .select("card_id, value")
    .eq("stat_definition_id", stat_id)
    .in("card_id", Object.values(topCards));

  const valueMap: Record<string, number> = {};
  for (const sv of statValues ?? []) valueMap[sv.card_id] = Number(sv.value);

  // ── Determine winner ─────────────────────────────────────────────────────
  const scores = playingIds.map(pid => ({ pid, value: valueMap[topCards[pid]] ?? 0 }));
  const best = statDef.is_inverse
    ? Math.min(...scores.map(s => s.value))
    : Math.max(...scores.map(s => s.value));
  const winners = scores.filter(s => s.value === best).map(s => s.pid);

  const playedCardIds = playingIds.map(pid => topCards[pid]);
  const newPot = [...potCardIds, ...playedCardIds];

  // ── Build comparison result for clients ─────────────────────────────────
  const comparisonCards = scores.map(s => ({
    player_id: s.pid,
    card_id: topCards[s.pid],
    value: s.value,
    is_winner: winners.includes(s.pid) && winners.length === 1,
  }));

  // ── Remove top cards from players' main decks ────────────────────────────
  for (const pid of playingIds) {
    await db
      .from("player_hands")
      .delete()
      .eq("game_state_id", gs.id)
      .eq("player_id", pid)
      .eq("card_id", topCards[pid]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (winners.length === 1) {
    // ── Clear winner — move all pot cards to winner's side deck ─────────────
    const winnerId = winners[0];
    const { count: sideCount } = await db
      .from("player_hands")
      .select("id", { count: "exact", head: true })
      .eq("game_state_id", gs.id)
      .eq("player_id", winnerId)
      .eq("stack_type", "side");

    const sideBase = sideCount ?? 0;
    if (newPot.length > 0) {
      await db.from("player_hands").insert(
        newPot.map((cardId, i) => ({
          game_state_id: gs.id,
          player_id: winnerId,
          card_id: cardId,
          stack_type: "side",
          position: sideBase + i,
        }))
      );
    }

    // Reshuffle empty main decks
    await reshuffleIfNeeded(db, gs.id, activePlayers.map(p => p.player_id));

    // Check eliminations
    const eliminated = await checkEliminations(db, gs.id, room.id, activePlayers);

    // Check remaining active players
    const remainingPlayerIds = activePlayers
      .filter(p => !eliminated.includes(p.player_id))
      .map(p => p.player_id);

    let nextPhase: string;
    let gameWinnerId: string | null = null;

    if (remainingPlayerIds.length <= 1) {
      // Game over
      nextPhase = "finished";
      gameWinnerId = remainingPlayerIds[0] ?? winnerId;
      await db.from("rooms").update({ status: "finished" }).eq("id", room.id);
      if (gameWinnerId) await updatePlayerStats(db, activePlayers.map(p => p.player_id), gameWinnerId);
    } else {
      nextPhase = "stat_selection";
    }

    await db.from("game_states").update({
      phase: nextPhase,
      called_stat_id: null,   // MUST reset — non-null blocks next round's idempotency check
      winner_player_id: winnerId,
      current_turn_player_id: gameWinnerId ?? winnerId,
      turn_number: gs.turn_number + 1,
      round_data: {
        is_tie: false,
        pot_card_ids: [],
        tied_player_ids: [],
        tie_stat_id: null,
        tie_type: null,
        last_result: {
          stat_id, stat_name: statDef.name,
          cards: comparisonCards,
          winner_id: winnerId,
          was_tie: false,
          game_winner_id: gameWinnerId,
        },
      },
    }).eq("id", gs.id);

    // Broadcast fast result — clients receive in ~50ms instead of waiting ~400ms for Postgres Changes
    broadcast(gameCh(roomCode), "round_result", { turn: gs.turn_number + 1 });

    return NextResponse.json({ ok: true, winner_id: winnerId, next_phase: nextPhase });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TIE
  const callerInTie = winners.includes(player_id);

  let newTiedPlayerIds: string[];
  let newTieType: string;
  let newTurnPlayerId: string;
  let newTieStatId: string | null;

  if (activePlayers.length === 2 || callerInTie) {
    // Rule 7.1 / 7.2 — caller picks again from next card (any stat)
    newTiedPlayerIds = winners;
    newTieType = "caller";
    newTurnPlayerId = player_id; // same caller
    newTieStatId = null;         // caller can pick any stat
  } else {
    // Rule 7.3 — tied (non-caller) players continue with SAME stat
    newTiedPlayerIds = winners;
    newTieType = "non_caller";
    newTurnPlayerId = winners[0]; // first tied player calls
    newTieStatId = stat_id;
  }

  await db.from("game_states").update({
    phase: "stat_selection",
    called_stat_id: null,        // reset so next pick is accepted
    winner_player_id: null,
    current_turn_player_id: newTurnPlayerId,
    turn_number: gs.turn_number + 1,
    round_data: {
      is_tie: true,
      pot_card_ids: newPot,
      tied_player_ids: newTiedPlayerIds,
      tie_stat_id: newTieStatId,
      tie_type: newTieType,
      last_result: {
        stat_id, stat_name: statDef.name,
        cards: comparisonCards,
        winner_id: null,
        was_tie: true,
      },
    },
  }).eq("id", gs.id);

  broadcast(gameCh(roomCode), "round_result", { turn: gs.turn_number + 1 });

  return NextResponse.json({ ok: true, winner_id: null, tie: true, tied_player_ids: newTiedPlayerIds });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function reshuffleIfNeeded(db: ReturnType<typeof createAdminClient>, gameStateId: string, playerIds: string[]) {
  for (const pid of playerIds) {
    const { count: mainCount } = await db
      .from("player_hands")
      .select("id", { count: "exact", head: true })
      .eq("game_state_id", gameStateId)
      .eq("player_id", pid)
      .eq("stack_type", "main");

    if ((mainCount ?? 0) > 0) continue;

    const { data: sideCards } = await db
      .from("player_hands")
      .select("card_id")
      .eq("game_state_id", gameStateId)
      .eq("player_id", pid)
      .eq("stack_type", "side");

    if (!sideCards || sideCards.length === 0) continue;

    const shuffledCardIds = shuffle(sideCards.map(c => c.card_id));

    // Batch: delete all side cards, re-insert as shuffled main deck (2 calls instead of N)
    await db.from("player_hands")
      .delete()
      .eq("game_state_id", gameStateId)
      .eq("player_id", pid)
      .eq("stack_type", "side");

    await db.from("player_hands").insert(
      shuffledCardIds.map((cardId, i) => ({
        game_state_id: gameStateId,
        player_id: pid,
        card_id: cardId,
        stack_type: "main",
        position: i,
      }))
    );
  }
}

async function checkEliminations(db: ReturnType<typeof createAdminClient>, gameStateId: string, roomId: string, activePlayers: { player_id: string }[]): Promise<string[]> {
  const eliminated: string[] = [];
  for (const p of activePlayers) {
    const { count } = await db
      .from("player_hands")
      .select("id", { count: "exact", head: true })
      .eq("game_state_id", gameStateId)
      .eq("player_id", p.player_id)
      .in("stack_type", ["main", "side"]);

    if ((count ?? 0) === 0) {
      eliminated.push(p.player_id);
      await db
        .from("room_players")
        .update({ is_eliminated: true })
        .eq("room_id", roomId)
        .eq("player_id", p.player_id);
    }
  }
  return eliminated;
}

async function updatePlayerStats(db: ReturnType<typeof createAdminClient>, allPlayerIds: string[], winnerId: string) {
  // Only update logged-in users (UUIDs from Supabase auth)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const authPlayerIds = allPlayerIds.filter(id => uuidRegex.test(id) && !id.startsWith("ai-"));
  if (authPlayerIds.length === 0) return;

  // Fetch all profiles in one query, then update in parallel
  const { data: profiles } = await db
    .from("profiles")
    .select("id, total_games, total_wins")
    .in("id", authPlayerIds);

  if (!profiles || profiles.length === 0) return;

  await Promise.all(
    profiles.map(profile => {
      const updates: Record<string, number> = {
        total_games: (profile.total_games ?? 0) + 1,
      };
      if (profile.id === winnerId) {
        updates.total_wins = (profile.total_wins ?? 0) + 1;
      }
      return db.from("profiles").update(updates).eq("id", profile.id);
    })
  );
}
