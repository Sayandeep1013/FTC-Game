"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import { useGame, type RoundResult, type PlayerHandInfo } from "@/hooks/useGame";
import { CardDisplay, CardBack } from "./CardDisplay";
import { TimerBar } from "./TimerBar";
import { ComparisonArea } from "./ComparisonArea";
import { WinLoseModal } from "./WinLoseModal";
import type { StatDefinition } from "@/types";

const AI_THINK_MS = 1600;
const COMPARISON_SHOW_MS = 3800;

interface GameBoardProps {
  roomCode: string;
  deckName: string;
}

export function GameBoard({ roomCode, deckName }: GameBoardProps) {
  const session = useSession();
  const {
    loading, gameState, myHand, opponents, statDefs, allCards,
    isMyTurn, isEliminated, gameOver, gameWinnerId, pickStat,
  } = useGame(roomCode, session?.playerId ?? null);

  const [displayedResult, setDisplayedResult] = useState<RoundResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTurnRef = useRef<number>(-1);

  const roundData = gameState?.round_data ?? {};
  const isTieActive = !!(roundData.is_tie);
  const tiedStatId = roundData.tie_stat_id as string | null | undefined;
  const potCount = (roundData.pot_card_ids as string[] | undefined)?.length ?? 0;
  const lastResult = roundData.last_result as RoundResult | undefined;

  // Show comparison result when turn advances
  useEffect(() => {
    const turn = gameState?.turn_number ?? 0;
    if (!lastResult || turn === lastTurnRef.current) return;
    lastTurnRef.current = turn;

    setDisplayedResult(lastResult);
    setShowComparison(true);
    if (compTimeoutRef.current) clearTimeout(compTimeoutRef.current);
    compTimeoutRef.current = setTimeout(() => {
      setShowComparison(false);
      setTimerKey(k => k + 1);
    }, COMPARISON_SHOW_MS);
  }, [gameState?.turn_number, lastResult]);

  // AI auto-pick — fires when it's an AI's turn and they have a card
  const allPlayers = [...(myHand ? [myHand] : []), ...opponents];
  const currentAiPlayer = (
    gameState?.phase === "stat_selection" &&
    !showComparison
  ) ? allPlayers.find(
      p => p.player_id === gameState.current_turn_player_id && p.is_ai && p.top_card
    ) : null;

  const aiPlayerId = currentAiPlayer?.player_id ?? null;
  const aiHasCard = !!(currentAiPlayer?.top_card);
  const currentTurn = gameState?.turn_number ?? 0;

  useEffect(() => {
    if (!aiPlayerId || !aiHasCard) return;

    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    aiTimeoutRef.current = setTimeout(() => {
      const available = statDefs.filter(s =>
        !isTieActive || !tiedStatId || s.id === tiedStatId
      );
      if (!available.length) return;
      const stat = available[Math.floor(Math.random() * available.length)];
      fetch(`/api/game/${roomCode}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pick_stat", player_id: aiPlayerId, stat_id: stat.id }),
      });
    }, AI_THINK_MS);

    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); };
  }, [aiPlayerId, aiHasCard, currentTurn, isTieActive, tiedStatId, statDefs, roomCode]);

  // Timer auto-pick for human player
  const handleTimerExpire = useCallback(() => {
    if (!isMyTurn || !myHand?.top_card || showComparison) return;
    const available = statDefs.filter(s =>
      !isTieActive || !tiedStatId || s.id === tiedStatId
    );
    if (!available.length) return;
    const stat = available[Math.floor(Math.random() * available.length)];
    pickStat(stat.id);
  }, [isMyTurn, myHand?.top_card, showComparison, statDefs, isTieActive, tiedStatId, pickStat]);

  // Player name map
  const playerNameMap: Record<string, string> = {};
  for (const p of allPlayers) playerNameMap[p.player_id] = p.room_username;

  // Winner name
  const winnerName = allPlayers.find(p => p.player_id === gameWinnerId)?.room_username ?? "CPU";

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlayerName = allPlayers.find(p => p.player_id === gameState?.current_turn_player_id)?.room_username ?? "?";

  return (
    <div className="game-layout">
      {gameOver && gameWinnerId && (
        <WinLoseModal
          won={gameWinnerId === session.playerId}
          winnerName={winnerName}
          isSpectating={isEliminated}
          roomCode={roomCode}
        />
      )}

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="game-topbar">
        <span className="font-display tracking-widest text-sm sm:text-base">{deckName.toUpperCase()}</span>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          {isEliminated && (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-grey-light border border-black px-2 py-0.5">SPECTATING</span>
          )}
          {isTieActive && (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">
              TIE — {potCount} in pot
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider">Round {gameState?.turn_number ?? 1}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-grey-dark">
            {isMyTurn && !showComparison ? "YOUR TURN ▼" : `${currentPlayerName}'s turn`}
          </span>
        </div>
      </div>

      {/* ── Main board ────────────────────────────────────────────────────── */}
      <div className="game-board-main">
        {/* Opponents — positioned based on count */}
        <div className={`game-opponents game-opponents-${opponents.length}`}>
          {opponents.map((opp, i) => (
            <OpponentZone key={opp.player_id} opp={opp} index={i} />
          ))}
        </div>

        {/* Comparison zone */}
        <div className="game-comparison-zone">
          <AnimatePresence>
            {showComparison && displayedResult && (
              <motion.div
                key={`result-${gameState?.turn_number}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <ComparisonArea
                  result={displayedResult}
                  statDefs={statDefs}
                  playerNames={playerNameMap}
                  allCards={allCards}
                  potCount={potCount}
                  myPlayerId={session.playerId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* My area — always at bottom */}
        <div className="game-my-zone">
          {isMyTurn && !showComparison && !isEliminated && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold uppercase tracking-widest text-grey-dark mb-1 text-center"
            >
              {isTieActive && tiedStatId ? "Locked stat — same category ↑" :
               isTieActive ? "Tie continues — pick a stat ↑" :
               "Pick a stat to call ↑"}
            </motion.p>
          )}

          {myHand && !myHand.is_eliminated && (
            <div className="flex flex-col items-center gap-1.5">
              <CardDisplay
                hand={myHand}
                statDefs={statDefs}
                isActive={isMyTurn && !showComparison}
                onPickStat={isMyTurn && !showComparison ? pickStat : undefined}
                tiedStatId={isTieActive ? tiedStatId : null}
                compact={opponents.length >= 3}
              />
              {isMyTurn && !showComparison && (
                <div style={{ width: "100%", maxWidth: opponents.length >= 3 ? 160 : 220 }}>
                  <TimerBar key={timerKey} active={isMyTurn && !showComparison} onExpire={handleTimerExpire} />
                </div>
              )}
              <DeckCounts mainCount={myHand.main_count} sideCount={myHand.side_count} label="You" />
            </div>
          )}

          {myHand?.is_eliminated && (
            <div className="text-center p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-grey-mid">You&apos;re out — spectating</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function OpponentZone({ opp, index }: { opp: PlayerHandInfo; index: number }) {
  return (
    <motion.div
      key={opp.player_id}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px] font-bold uppercase tracking-wider truncate max-w-[80px] sm:max-w-[110px]">{opp.room_username}</span>
        {opp.is_ai && <span className="text-[8px] bg-grey-light border border-black px-1">CPU</span>}
        {opp.is_eliminated && <span className="text-[8px] text-grey-mid">OUT</span>}
      </div>
      {opp.is_eliminated ? (
        <div className="border-2 border-dashed border-grey-mid bg-grey-light flex items-center justify-center" style={{ width: 80, height: 112 }}>
          <span className="text-[9px] text-grey-mid uppercase">Out</span>
        </div>
      ) : (
        <>
          <CardBack count={opp.main_count + opp.side_count} label="" />
          <DeckCounts mainCount={opp.main_count} sideCount={opp.side_count} label="" compact />
        </>
      )}
    </motion.div>
  );
}

function DeckCounts({ mainCount, sideCount, label, compact }: { mainCount: number; sideCount: number; label: string; compact?: boolean }) {
  return (
    <div className={`flex gap-3 ${compact ? "text-[8px]" : "text-[9px]"} font-bold uppercase tracking-wider text-grey-dark`}>
      {label && <span className="text-black">{label}</span>}
      <span>Main: <span className="text-black">{mainCount}</span></span>
      <span>Side: <span className="text-black">{sideCount}</span></span>
    </div>
  );
}
