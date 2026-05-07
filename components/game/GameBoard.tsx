"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useGame, type RoundResult } from "@/hooks/useGame";
import { CardDisplay, CardBack } from "./CardDisplay";
import { TimerBar } from "./TimerBar";
import { ComparisonArea } from "./ComparisonArea";
import { WinLoseModal } from "./WinLoseModal";
import type { StatDefinition } from "@/types";

interface GameBoardProps {
  roomCode: string;
  deckName: string;
}

const AI_THINK_MS = 1800; // AI "thinking" delay before picking

export function GameBoard({ roomCode, deckName }: GameBoardProps) {
  const session = useSession();
  const {
    loading, gameState, myHand, opponents, statDefs,
    isMyTurn, isEliminated, gameOver, gameWinnerId, pickStat,
  } = useGame(roomCode, session?.playerId ?? null);

  // Track the last result for animated comparison display
  const [displayedResult, setDisplayedResult] = useState<RoundResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // reset timer between turns
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roundData = gameState?.round_data ?? {};
  const isTieActive = !!(roundData.is_tie);
  const tiedStatId = roundData.tie_stat_id as string | null | undefined;
  const potCount = (roundData.pot_card_ids as string[] | undefined)?.length ?? 0;
  const lastResult = roundData.last_result as RoundResult | undefined;

  // Show comparison when a new round result arrives
  useEffect(() => {
    if (!lastResult) return;
    const key = lastResult.stat_id + (lastResult.winner_id ?? "tie") + (gameState?.turn_number ?? 0);
    setDisplayedResult(lastResult);
    setShowComparison(true);

    // Hide comparison after 3.5s and reset timer for next player
    const t = setTimeout(() => {
      setShowComparison(false);
      setTimerKey(k => k + 1);
    }, 3500);

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.turn_number]);

  // AI auto-pick
  useEffect(() => {
    if (!gameState || gameState.phase !== "stat_selection") return;
    const currentPlayer = [...(myHand ? [myHand] : []), ...opponents]
      .find(p => p.player_id === gameState.current_turn_player_id);
    if (!currentPlayer?.is_ai) return;
    if (!currentPlayer.top_card) return;

    // Only the host triggers AI (avoids double-picks from multiple clients)
    // We check this by seeing if we're the "first" human in the room — approximate: just let all clients try, server idempotency handles it
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    aiTimeoutRef.current = setTimeout(() => {
      // Pick a random stat
      const availableStats = statDefs.filter(s =>
        !isTieActive || !tiedStatId || s.id === tiedStatId
      );
      if (availableStats.length === 0) return;
      const stat = availableStats[Math.floor(Math.random() * availableStats.length)];
      fetch(`/api/game/${roomCode}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pick_stat",
          player_id: currentPlayer.player_id,
          stat_id: stat.id,
        }),
      });
    }, AI_THINK_MS);

    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.current_turn_player_id, gameState?.phase, gameState?.turn_number]);

  // Auto-pick on timer expiry for human player
  function handleTimerExpire() {
    if (!isMyTurn || !myHand?.top_card) return;
    const available = statDefs.filter(s =>
      !isTieActive || !tiedStatId || s.id === tiedStatId
    );
    if (available.length === 0) return;
    const stat = available[Math.floor(Math.random() * available.length)];
    pickStat(stat.id);
  }

  // Build card data lookup for ComparisonArea
  const allPlayers = [...(myHand ? [myHand] : []), ...opponents];
  const cardDataMap: Record<string, { name: string; image_url: string | null; image_storage_path: string | null }> = {};
  for (const p of allPlayers) {
    if (p.top_card) cardDataMap[p.top_card.id] = p.top_card;
  }
  const playerNameMap: Record<string, string> = {};
  for (const p of allPlayers) playerNameMap[p.player_id] = p.room_username;

  // Determine winner name
  const winnerPlayer = allPlayers.find(p => p.player_id === gameWinnerId);
  const winnerName = winnerPlayer?.room_username ?? "Unknown";

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlayerName = allPlayers.find(p => p.player_id === gameState?.current_turn_player_id)?.room_username ?? "?";

  return (
    <>
      {/* Game over modal */}
      {gameOver && gameWinnerId && (
        <WinLoseModal
          won={gameWinnerId === session.playerId}
          winnerName={winnerName}
          isSpectating={isEliminated}
          roomCode={roomCode}
        />
      )}

      <div className={`min-h-screen bg-white flex flex-col ${isEliminated ? "pointer-events-none opacity-80" : ""}`}>
        {/* ── Top bar ────────────────────────────────────────────────────────── */}
        <div className="border-b-2 border-black bg-white px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg tracking-widest">{deckName.toUpperCase()}</span>
            {isEliminated && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-grey-light border border-black px-2 py-0.5">SPECTATING</span>
            )}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-grey-dark">
              Round {gameState?.turn_number ?? 1}
            </span>
            {isTieActive && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">
                TIE — {potCount} in pot
              </span>
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              {isMyTurn ? "YOUR TURN" : `${currentPlayerName}'s turn`}
            </span>
          </div>
        </div>

        {/* ── Main game area ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-between px-4 py-6 gap-4 max-w-4xl mx-auto w-full">

          {/* Opponents row */}
          <div className="flex gap-6 flex-wrap justify-center">
            {opponents.map(opp => (
              <div key={opp.player_id} className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[100px]">{opp.room_username}</span>
                  {opp.is_ai && <span className="text-[9px] bg-grey-light border border-black px-1">CPU</span>}
                  {opp.is_eliminated && <span className="text-[9px] text-grey-mid">OUT</span>}
                </div>
                {opp.is_eliminated ? (
                  <div className="w-24 h-34 border-2 border-dashed border-grey-mid bg-grey-light flex items-center justify-center" style={{ height: 100 }}>
                    <span className="text-[9px] text-grey-mid uppercase">No cards</span>
                  </div>
                ) : (
                  <CardBack count={opp.main_count + opp.side_count} label={opp.room_username} />
                )}
              </div>
            ))}
          </div>

          {/* Comparison zone */}
          {showComparison && displayedResult && (
            <div className="w-full max-w-lg">
              <ComparisonArea
                result={displayedResult}
                statDefs={statDefs}
                playerNames={playerNameMap}
                cardData={cardDataMap}
                potCount={potCount}
                myPlayerId={session.playerId}
              />
            </div>
          )}

          {/* Player's own card */}
          <div className="flex flex-col items-center gap-2">
            {isMyTurn && !showComparison && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-1">
                {isTieActive
                  ? tiedStatId ? "Must use the locked stat ↓" : "Pick a stat for the tie ↓"
                  : "Pick a stat to call ↓"}
              </p>
            )}

            {myHand && (
              <CardDisplay
                hand={myHand}
                statDefs={statDefs}
                isActive={isMyTurn && !showComparison}
                onPickStat={isMyTurn && !showComparison ? pickStat : undefined}
                tiedStatId={isTieActive ? tiedStatId : null}
              />
            )}

            {!myHand && !isEliminated && (
              <p className="text-sm text-grey-dark">Loading your cards...</p>
            )}

            {/* Timer bar — only show when it's my turn and comparison isn't showing */}
            {isMyTurn && !showComparison && !isEliminated && (
              <div className="w-full" style={{ width: 220 }}>
                <TimerBar
                  key={timerKey}
                  active={isMyTurn && !showComparison}
                  onExpire={handleTimerExpire}
                />
              </div>
            )}

            {/* Player card counts */}
            {myHand && (
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] uppercase tracking-wider text-grey-dark font-bold">
                  Main: <span className="text-black">{myHand.main_count}</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-grey-dark font-bold">
                  Side: <span className="text-black">{myHand.side_count}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile rotate prompt */}
      <div className="rotate-prompt">
        <p className="font-display text-white text-2xl tracking-widest">ROTATE SCREEN</p>
        <p className="text-grey-mid text-sm">The game requires landscape mode</p>
      </div>
    </>
  );
}
