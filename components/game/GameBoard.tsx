"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import { useGame, type RoundResult, type PlayerHandInfo } from "@/hooks/useGame";
import { CardDisplay, CardBack } from "./CardDisplay";
import { TimerCircle } from "./TimerCircle";
import { DeckPile } from "./DeckPile";
import { ComparisonArea } from "./ComparisonArea";
import { WinLoseModal } from "./WinLoseModal";
import type { StatDefinition } from "@/types";

const AI_THINK_MS = 1600;
const COMPARISON_SHOW_MS = 4000;

export function GameBoard({ roomCode, deckName }: { roomCode: string; deckName: string }) {
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
  const lastTurnRef = useRef(-1);

  const roundData = gameState?.round_data ?? {};
  const isTieActive = !!(roundData.is_tie);
  const tiedStatId = roundData.tie_stat_id as string | null | undefined;
  const potCount = (roundData.pot_card_ids as string[] | undefined)?.length ?? 0;
  const lastResult = roundData.last_result as RoundResult | undefined;

  // Show comparison when turn advances
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

  // AI auto-pick
  const allPlayers = [...(myHand ? [myHand] : []), ...opponents];
  const currentAiPlayer = (gameState?.phase === "stat_selection" && !showComparison)
    ? allPlayers.find(p => p.player_id === gameState.current_turn_player_id && p.is_ai && p.top_card)
    : null;
  const aiPlayerId = currentAiPlayer?.player_id ?? null;
  const aiHasCard = !!(currentAiPlayer?.top_card);
  const currentTurn = gameState?.turn_number ?? 0;

  useEffect(() => {
    if (!aiPlayerId || !aiHasCard) return;
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    aiTimeoutRef.current = setTimeout(() => {
      const available = statDefs.filter(s => !isTieActive || !tiedStatId || s.id === tiedStatId);
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

  const handleTimerExpire = useCallback(() => {
    if (!isMyTurn || !myHand?.top_card || showComparison) return;
    const available = statDefs.filter(s => !isTieActive || !tiedStatId || s.id === tiedStatId);
    if (!available.length) return;
    const stat = available[Math.floor(Math.random() * available.length)];
    pickStat(stat.id);
  }, [isMyTurn, myHand?.top_card, showComparison, statDefs, isTieActive, tiedStatId, pickStat]);

  const playerNameMap: Record<string, string> = {};
  for (const p of allPlayers) playerNameMap[p.player_id] = p.room_username;
  const winnerName = allPlayers.find(p => p.player_id === gameWinnerId)?.room_username ?? "CPU";
  const opponent = opponents[0] ?? null; // 2-player focus

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const oponentIsActive = !isMyTurn && !showComparison;
  const totalCardsWon = displayedResult && !displayedResult.was_tie
    ? (displayedResult.cards.length + potCount)
    : 0;

  return (
    <div className="game-layout">
      {gameOver && gameWinnerId && (
        <WinLoseModal won={gameWinnerId === session.playerId} winnerName={winnerName} isSpectating={isEliminated} roomCode={roomCode} />
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="game-topbar">
        <span className="font-display tracking-widest text-sm">{deckName.toUpperCase()}</span>
        <div className="flex items-center gap-3 flex-wrap">
          {isTieActive && (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">
              TIE · {potCount} in pot
            </span>
          )}
          {isEliminated && <span className="text-[9px] font-bold uppercase tracking-wider bg-grey-light border border-black px-2 py-0.5">SPECTATING</span>}
          <span className="text-[10px] font-bold uppercase tracking-wider">Round {gameState?.turn_number ?? 1}</span>
        </div>
      </div>

      {/* ── Board ───────────────────────────────────────────────────────── */}
      <div className="game-board-grid">

        {/* ═══ OPPONENT SECTION (top) ═══ */}
        <div className="game-opp-section">
          {/* Opponent deck piles — top left */}
          <div className="game-opp-decks">
            {opponent && (
              <>
                <DeckPile count={opponent.main_count} label="Main" width={44} height={62} />
                <DeckPile count={opponent.side_count} label="Side" width={44} height={62} />
              </>
            )}
          </div>

          {/* Opponent card + name — top center */}
          <div className="game-opp-card-area">
            {/* Turn arrow */}
            {oponentIsActive && (
              <motion.div
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex justify-center mb-1"
              >
                <TurnArrow pointing="down" />
              </motion.div>
            )}
            {opponent && (
              <>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{opponent.room_username}</span>
                  {opponent.is_ai && <span className="text-[8px] bg-grey-light border border-black px-1">CPU</span>}
                  {oponentIsActive && (
                    <TimerCircle key={`opp-${timerKey}`} active={false} onExpire={() => {}} size={28} />
                  )}
                </div>
                {opponent.is_eliminated ? (
                  <div className="border-2 border-dashed border-grey-mid bg-grey-light w-24 h-34 flex items-center justify-center" style={{ height: 100 }}>
                    <span className="text-[9px] text-grey-mid">Out</span>
                  </div>
                ) : showComparison ? (
                  // During comparison, opponent card is revealed in the comparison area
                  <CardBack count={opponent.main_count + opponent.side_count} label="" />
                ) : (
                  <CardBack count={opponent.main_count + opponent.side_count} label="" />
                )}
              </>
            )}
          </div>

          {/* Opponent AI timer (right side) */}
          <div className="game-opp-timer">
            {oponentIsActive && opponent?.is_ai && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] text-grey-mid uppercase tracking-wider">thinking</span>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* ═══ CENTER: Comparison Table ═══ */}
        <div className="game-center">
          <AnimatePresence mode="wait">
            {showComparison && displayedResult ? (
              <motion.div
                key={`result-${gameState?.turn_number}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22 }}
                className="w-full max-w-xl"
              >
                <ComparisonArea
                  result={displayedResult}
                  statDefs={statDefs}
                  playerNames={playerNameMap}
                  allCards={allCards}
                  potCount={potCount}
                  myPlayerId={session.playerId}
                  cardsWonCount={totalCardsWon}
                />
              </motion.div>
            ) : (
              <motion.div
                key="table-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="comparison-table-empty"
              >
                <div className="comparison-placeholder-left">
                  <span className="text-[9px] uppercase tracking-wider text-grey-mid font-bold">
                    {opponent?.room_username ?? "Opponent"}
                  </span>
                </div>
                <div className="comparison-placeholder-divider" />
                <div className="comparison-placeholder-right">
                  <span className="text-[9px] uppercase tracking-wider text-grey-mid font-bold">You</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ MY SECTION (bottom) ═══ */}
        <div className="game-my-section">
          {/* My deck piles — bottom left */}
          <div className="game-my-decks">
            {myHand && (
              <>
                <DeckPile count={myHand.main_count} label="Main" width={44} height={62} />
                <DeckPile count={myHand.side_count} label="Side" width={44} height={62} />
              </>
            )}
          </div>

          {/* My card + timer — bottom center */}
          <div className="game-my-card-area">
            {myHand && !myHand.is_eliminated ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider">You</span>
                  {isMyTurn && !showComparison && (
                    <TimerCircle
                      key={`my-${timerKey}`}
                      active={isMyTurn && !showComparison}
                      onExpire={handleTimerExpire}
                      size={36}
                    />
                  )}
                </div>
                {isMyTurn && !showComparison && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[9px] font-bold uppercase tracking-widest text-grey-dark mb-1 text-center"
                  >
                    {isTieActive && tiedStatId ? "Locked stat ↓" : "Pick a stat ↓"}
                  </motion.p>
                )}
                <CardDisplay
                  hand={myHand}
                  statDefs={statDefs}
                  isActive={isMyTurn && !showComparison}
                  onPickStat={isMyTurn && !showComparison ? pickStat : undefined}
                  tiedStatId={isTieActive ? tiedStatId : null}
                />
              </>
            ) : (
              <p className="text-xs text-grey-mid uppercase tracking-wider">Spectating</p>
            )}
          </div>

          {/* Turn arrow (my side, bottom right area) */}
          <div className="game-my-timer-area">
            {isMyTurn && !showComparison && !isEliminated && (
              <motion.div
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <TurnArrow pointing="up" />
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Turn arrow ────────────────────────────────────────────────────────────────

function TurnArrow({ pointing }: { pointing: "up" | "down" }) {
  return (
    <motion.div
      animate={{ y: pointing === "up" ? [0, -5, 0] : [0, 5, 0] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
    >
      <svg
        width={32} height={32}
        viewBox="0 0 32 32"
        fill="none"
        style={{ transform: pointing === "down" ? "rotate(180deg)" : undefined }}
      >
        <path d="M16 28 L4 12 L12 12 L12 4 L20 4 L20 12 L28 12 Z" fill="#0a0a0a" />
      </svg>
    </motion.div>
  );
}
