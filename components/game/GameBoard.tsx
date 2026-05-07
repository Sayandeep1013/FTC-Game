"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import { useGame, type CardInfo, type RoundResult } from "@/hooks/useGame";
import { TableCard } from "./TableCard";
import { DeckPile } from "./DeckPile";
import { TimerCircle } from "./TimerCircle";
import { WinLoseModal } from "./WinLoseModal";
import type { StatDefinition } from "@/types";

const AI_THINK_MS = 1800;
const COMPARISON_SHOW_MS = 4200;

export function GameBoard({ roomCode, deckName }: { roomCode: string; deckName: string }) {
  const session = useSession();
  const {
    loading, gameState, myHand, opponents, statDefs, allCards,
    isMyTurn, isEliminated, gameOver, gameWinnerId, pickStat,
  } = useGame(roomCode, session?.playerId ?? null);

  // Cards currently on the table (separate from DB state — kept during animation)
  const [tableMyCard, setTableMyCard] = useState<CardInfo | null>(null);
  const [tableOppCard, setTableOppCard] = useState<CardInfo | null>(null);
  const [tableCalledStatId, setTableCalledStatId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [displayedResult, setDisplayedResult] = useState<RoundResult | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTurnRef = useRef(-1);

  const roundData = gameState?.round_data ?? {};
  const isTieActive = !!(roundData.is_tie);
  const tiedStatId = roundData.tie_stat_id as string | null | undefined;
  const potCount = (roundData.pot_card_ids as string[] | undefined)?.length ?? 0;
  const lastResult = roundData.last_result as RoundResult | undefined;

  // ── Draw my card onto table when it's my turn ─────────────────────────────
  useEffect(() => {
    if (isMyTurn && !showResult && myHand?.top_card && gameState?.phase === "stat_selection") {
      // Brief delay so "table clears" before new card slides in
      const t = setTimeout(() => {
        setTableMyCard(myHand.top_card);
        setTimerKey(k => k + 1);
        setTimerActive(true);
      }, 200);
      return () => clearTimeout(t);
    }
    if (!isMyTurn) {
      setTimerActive(false);
    }
  }, [isMyTurn, myHand?.top_card?.id, gameState?.phase, showResult]);

  // ── When opponent's turn — show their card face-down on table ─────────────
  useEffect(() => {
    if (!isMyTurn && !showResult && gameState?.phase === "stat_selection") {
      const opp = opponents[0];
      if (opp?.top_card) {
        const t = setTimeout(() => setTableMyCard(null), 100); // clear my card
        // Opp card shows face-down (no need to set tableOppCard yet — shown during comparison)
        return () => clearTimeout(t);
      }
    }
  }, [isMyTurn, opponents, gameState?.phase, showResult]);

  // ── Detect new round result ───────────────────────────────────────────────
  useEffect(() => {
    const turn = gameState?.turn_number ?? 0;
    if (!lastResult || turn === lastTurnRef.current) return;
    lastTurnRef.current = turn;

    setTimerActive(false);

    // Find opponent's card from the result
    const myId = session?.playerId;
    const oppCardEntry = lastResult.cards.find(c => c.player_id !== myId);
    const oppCard = oppCardEntry ? allCards[oppCardEntry.card_id] : null;

    setTableOppCard(oppCard ?? null);
    setTableCalledStatId(lastResult.stat_id);
    setDisplayedResult(lastResult);
    setShowResult(true);

    // Clear table after comparison
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = setTimeout(() => {
      setShowResult(false);
      setTableMyCard(null);
      setTableOppCard(null);
      setTableCalledStatId(null);
      setDisplayedResult(null);
    }, COMPARISON_SHOW_MS);
  }, [gameState?.turn_number, lastResult, session?.playerId, allCards]);

  // ── AI auto-pick ──────────────────────────────────────────────────────────
  const allPlayers = [...(myHand ? [myHand] : []), ...opponents];
  const currentAiPlayer = (gameState?.phase === "stat_selection" && !showResult)
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

  // ── Timer expiry ──────────────────────────────────────────────────────────
  const handleTimerExpire = useCallback(() => {
    if (!isMyTurn || showResult || gameState?.phase !== "stat_selection") return;
    const available = statDefs.filter(s => !isTieActive || !tiedStatId || s.id === tiedStatId);
    if (!available.length) return;
    const stat = available[Math.floor(Math.random() * available.length)];
    pickStat(stat.id);
  }, [isMyTurn, showResult, gameState?.phase, statDefs, isTieActive, tiedStatId, pickStat]);

  // ── Derived values ────────────────────────────────────────────────────────
  const opponent = opponents[0] ?? null;
  const playerNameMap: Record<string, string> = {};
  for (const p of allPlayers) playerNameMap[p.player_id] = p.room_username;
  const winnerName = allPlayers.find(p => p.player_id === gameWinnerId)?.room_username ?? "CPU";
  const currentTurnName = allPlayers.find(p => p.player_id === gameState?.current_turn_player_id)?.room_username ?? "?";

  const calledStatDef = statDefs.find(s => s.id === tableCalledStatId);

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="game-layout">
      {gameOver && gameWinnerId && (
        <WinLoseModal won={gameWinnerId === session.playerId} winnerName={winnerName} isSpectating={isEliminated} roomCode={roomCode} />
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="game-topbar">
        <span className="font-display tracking-widest text-sm">{deckName.toUpperCase()}</span>
        <div className="flex items-center gap-3 flex-wrap">
          {isTieActive && <span className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">TIE · {potCount} in pot</span>}
          {isEliminated && <span className="text-[9px] font-bold uppercase tracking-wider bg-grey-light border border-black px-2 py-0.5">SPECTATING</span>}
          <span className="text-[10px] font-bold uppercase tracking-wider">Round {gameState?.turn_number ?? 1}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-grey-dark">
            {showResult ? "Comparing..." : isMyTurn ? "Your turn" : `${currentTurnName}'s turn`}
          </span>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="game-main-grid">

        {/* ═══ OPPONENT ROW ═══ */}
        <div className="game-player-row game-player-row-top">
          {/* Decks top-left */}
          <div className="game-corner-decks">
            {opponent && (
              <>
                <DeckPile count={opponent.main_count} label="Main" width={44} height={60} />
                <DeckPile count={opponent.side_count} label="Side" width={44} height={60} />
              </>
            )}
          </div>

          {/* Opponent info + turn indicator */}
          <div className="game-player-info">
            <div className="flex items-center gap-2">
              {!isMyTurn && !showResult && (
                <BouncingArrow direction="down" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider">
                {opponent?.room_username ?? "Opponent"}
              </span>
              {opponent?.is_ai && <span className="text-[8px] bg-grey-light border border-black px-1">CPU</span>}
              {opponent?.is_eliminated && <span className="text-[8px] text-grey-mid">OUT</span>}
            </div>
            {/* Opponent thinking indicator */}
            {!isMyTurn && !showResult && opponent?.is_ai && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-[8px] text-grey-mid uppercase tracking-wider">thinking</span>
              </div>
            )}
          </div>

          {/* Opp timer placeholder (right side) */}
          <div className="game-corner-timer" />
        </div>

        {/* ═══ CARD TABLE ═══ */}
        <div className="game-table-wrapper">
          <div className="game-table">

            {/* Left slot: opponent's card */}
            <div className="game-table-slot">
              <AnimatePresence>
                {showResult && tableOppCard ? (
                  <TableCard
                    key="opp-card"
                    card={tableOppCard}
                    statDefs={statDefs}
                    highlightStatId={tableCalledStatId}
                    enterFrom="top"
                    label={opponent?.room_username}
                  />
                ) : !isMyTurn && !showResult && opponent && !opponent.is_eliminated && opponent.top_card ? (
                  // Face-down while opponent is picking
                  <motion.div
                    key="opp-facedown"
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark">{opponent.room_username}</p>
                    <div
                      className="card-back-pattern border-2 border-black"
                      style={{ width: 170, height: 250, boxShadow: "4px 4px 0 #0a0a0a" }}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Center: stat call + comparison info */}
            <div className="game-table-center-panel">
              {showResult && calledStatDef ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  {/* Called stat */}
                  <div className="w-full text-center border-2 border-black bg-black py-2 px-3">
                    <p className="text-[9px] text-grey-mid uppercase tracking-widest">Stat Called</p>
                    <p className="font-display text-white text-lg tracking-wider">{calledStatDef.display_name}</p>
                  </div>

                  {/* Score rows */}
                  <div className="w-full flex flex-col gap-1">
                    {displayedResult?.cards.map(c => {
                      const name = playerNameMap[c.player_id] ?? "?";
                      const isMe = c.player_id === session.playerId;
                      return (
                        <div key={c.player_id} className={`flex items-center justify-between px-2 py-1.5 border-2 ${c.is_winner ? "border-black bg-black" : "border-grey-light bg-white"}`}>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${c.is_winner ? "text-white" : "text-grey-dark"}`}>
                            {isMe ? "You" : name}{c.is_winner ? " ✓" : ""}
                          </span>
                          <span className={`font-mono font-bold text-sm ${c.is_winner ? "text-white" : "text-black"}`}>{c.value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Result summary */}
                  {displayedResult && (
                    <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark text-center">
                      {displayedResult.was_tie
                        ? `Tie — pot grows to ${potCount + (displayedResult.cards.length)} cards`
                        : displayedResult.winner_id === session.playerId
                        ? "You win this round!"
                        : `${playerNameMap[displayedResult.winner_id ?? ""] ?? "?"} wins`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center opacity-30">
                  <p className="font-display text-3xl">vs</p>
                </div>
              )}
            </div>

            {/* Right slot: my card */}
            <div className="game-table-slot">
              <AnimatePresence>
                {tableMyCard && (
                  <TableCard
                    key={`my-${tableMyCard.id}`}
                    card={tableMyCard}
                    statDefs={statDefs}
                    isActive={isMyTurn && !showResult}
                    onPickStat={isMyTurn && !showResult ? pickStat : undefined}
                    highlightStatId={showResult ? tableCalledStatId : undefined}
                    lockedStatId={isTieActive ? tiedStatId : null}
                    enterFrom="bottom"
                    label="You"
                  />
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Prompt below table */}
          {isMyTurn && !showResult && tableMyCard && !isEliminated && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-[9px] font-bold uppercase tracking-widest text-grey-dark mt-2"
            >
              {isTieActive && tiedStatId ? "Locked stat — must use highlighted" : "Tap a stat to call it →"}
            </motion.p>
          )}
        </div>

        {/* ═══ MY ROW ═══ */}
        <div className="game-player-row game-player-row-bottom">
          {/* Decks bottom-left */}
          <div className="game-corner-decks">
            {myHand && (
              <>
                <DeckPile count={myHand.main_count} label="Main" width={44} height={60} />
                <DeckPile count={myHand.side_count} label="Side" width={44} height={60} />
              </>
            )}
          </div>

          {/* My info + turn indicator */}
          <div className="game-player-info">
            <div className="flex items-center gap-2">
              {isMyTurn && !showResult && (
                <BouncingArrow direction="up" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider">You</span>
              {isEliminated && <span className="text-[8px] text-grey-mid">OUT</span>}
            </div>
          </div>

          {/* Timer bottom-right */}
          <div className="game-corner-timer">
            {isMyTurn && !showResult && !isEliminated && (
              <TimerCircle
                key={timerKey}
                active={timerActive}
                onExpire={handleTimerExpire}
                size={48}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function BouncingArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <motion.svg
      width={20} height={20} viewBox="0 0 20 20" fill="none"
      animate={{ y: direction === "up" ? [0, -4, 0] : [0, 4, 0] }}
      transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
      style={{ transform: direction === "down" ? "rotate(180deg)" : undefined }}
    >
      <path d="M10 17 L2 7 L7 7 L7 3 L13 3 L13 7 L18 7 Z" fill="#0a0a0a" />
    </motion.svg>
  );
}
