"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import { useGame, type CardInfo, type RoundResult } from "@/hooks/useGame";
import { TableCard } from "./TableCard";
import { DeckPile } from "./DeckPile";
import { TimerCircle } from "./TimerCircle";
import { WinLoseModal } from "./WinLoseModal";

const AI_THINK_MS = 1800;
// Comparison shows for 5 seconds — enough to read the result clearly
const COMPARISON_SHOW_MS = 5000;

export function GameBoard({ roomCode, deckName }: { roomCode: string; deckName: string }) {
  const session = useSession();
  const {
    loading, gameState, myHand, opponents, statDefs, allCards,
    isMyTurn, isEliminated, gameOver, gameWinnerId, pickStat,
  } = useGame(roomCode, session?.playerId ?? null);

  // Cards currently rendered on the table (persisted through comparison phase)
  const [tableMyCard, setTableMyCard] = useState<CardInfo | null>(null);
  // All opponents' cards on table: player_id → CardInfo
  const [tableOppCards, setTableOppCards] = useState<Record<string, CardInfo | null>>({});
  const [tableCalledStatId, setTableCalledStatId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [displayedResult, setDisplayedResult] = useState<RoundResult | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Guard: prevents drawing next card while a comparison is in progress or just picked
  const comparingRef = useRef(false);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTurnRef = useRef(-1);

  const roundData = gameState?.round_data ?? {};
  const isTieActive = !!(roundData.is_tie);
  const tiedStatId = roundData.tie_stat_id as string | null | undefined;
  const potCount = (roundData.pot_card_ids as string[] | undefined)?.length ?? 0;
  const lastResult = roundData.last_result as RoundResult | undefined;

  const allPlayers = [...(myHand ? [myHand] : []), ...opponents];
  const playerNameMap: Record<string, string> = {};
  for (const p of allPlayers) playerNameMap[p.player_id] = p.room_username;

  // ── When it's my turn: draw my card to the table ─────────────────────────
  useEffect(() => {
    if (isMyTurn && !showResult && !comparingRef.current && myHand?.top_card && gameState?.phase === "stat_selection") {
      const t = setTimeout(() => {
        setTableMyCard(myHand.top_card);
        setTimerKey(k => k + 1);
        setTimerActive(true);
      }, 300); // brief delay so table clears visually before new card arrives
      return () => clearTimeout(t);
    }
    if (!isMyTurn) {
      setTimerActive(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, myHand?.top_card?.id, gameState?.phase, showResult]);

  // ── Detect new round result ───────────────────────────────────────────────
  useEffect(() => {
    const turn = gameState?.turn_number ?? 0;
    if (!lastResult || turn === lastTurnRef.current) return;
    lastTurnRef.current = turn;

    setTimerActive(false);
    comparingRef.current = true; // Block new card draws until comparison ends

    // Build opp card map from result (safe: allCards always has every card)
    const newOppCards: Record<string, CardInfo | null> = {};
    for (const c of lastResult.cards) {
      if (c.player_id !== session?.playerId) {
        newOppCards[c.player_id] = allCards[c.card_id] ?? null;
      }
    }
    setTableOppCards(newOppCards);
    setTableCalledStatId(lastResult.stat_id);
    setDisplayedResult(lastResult);
    setShowResult(true);

    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = setTimeout(() => {
      setShowResult(false);
      setTableMyCard(null);
      setTableOppCards({});
      setTableCalledStatId(null);
      setDisplayedResult(null);
      comparingRef.current = false; // allow next card draw
    }, COMPARISON_SHOW_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.turn_number, lastResult]);

  // ── AI auto-pick ─────────────────────────────────────────────────────────
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

  // ── Timer expiry (auto-pick) ──────────────────────────────────────────────
  const handleTimerExpire = useCallback(() => {
    if (!isMyTurn || showResult || comparingRef.current || gameState?.phase !== "stat_selection") return;
    const available = statDefs.filter(s => !isTieActive || !tiedStatId || s.id === tiedStatId);
    if (!available.length) return;
    const stat = available[Math.floor(Math.random() * available.length)];
    comparingRef.current = true; // prevent duplicate fires
    pickStat(stat.id);
  }, [isMyTurn, showResult, gameState?.phase, statDefs, isTieActive, tiedStatId, pickStat]);

  const winnerName = allPlayers.find(p => p.player_id === gameWinnerId)?.room_username ?? "CPU";
  const currentTurnName = allPlayers.find(p => p.player_id === gameState?.current_turn_player_id)?.room_username ?? "?";
  const calledStatDef = statDefs.find(s => s.id === tableCalledStatId);
  const oppCards = Object.entries(tableOppCards); // [player_id, CardInfo|null][]

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
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
          {/* Deck piles for first opponent (top-left) */}
          <div className="game-corner-decks">
            {opponents[0] && (
              <>
                <DeckPile count={opponents[0].main_count} label="Main" width={44} height={60} />
                <DeckPile count={opponents[0].side_count} label="Side" width={44} height={60} />
              </>
            )}
          </div>

          {/* Opponent names row */}
          <div className="game-player-info">
            <div className="flex items-center gap-3 flex-wrap">
              {!isMyTurn && !showResult && <BouncingArrow direction="down" />}
              {opponents.map(opp => (
                <div key={opp.player_id} className="flex items-center gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider">{opp.room_username}</span>
                  {opp.is_ai && <span className="text-[8px] bg-grey-light border border-black px-1">CPU</span>}
                  {opp.is_eliminated && <span className="text-[8px] text-grey-mid">OUT</span>}
                </div>
              ))}
              {!isMyTurn && !showResult && opponents.some(o => o.is_ai) && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span className="text-[8px] text-grey-mid uppercase tracking-wider">thinking</span>
                </div>
              )}
            </div>
          </div>

          {/* Extra deck piles for 3-4 players — top-right */}
          <div className="game-corner-decks" style={{ alignItems: "flex-end" }}>
            {opponents.length > 1 && opponents[1] && (
              <>
                <DeckPile count={opponents[1].main_count} label="Main" width={44} height={60} />
                <DeckPile count={opponents[1].side_count} label="Side" width={44} height={60} />
              </>
            )}
          </div>
        </div>

        {/* ═══ CARD TABLE ═══ */}
        <div className="game-table-wrapper">
          <div className="game-table" style={{ gridTemplateColumns: opponents.length > 1 ? `repeat(${opponents.length}, 1fr) 140px 1fr` : "1fr 140px 1fr" }}>

            {/* Opponent card slots — one per opponent */}
            {opponents.map((opp, i) => {
              const oppCardData = showResult ? tableOppCards[opp.player_id] : null;
              const isOppTurn = gameState?.current_turn_player_id === opp.player_id;

              return (
                <div key={opp.player_id} className="game-table-slot" style={{ borderRight: i < opponents.length - 1 ? "1px solid #e0e0da" : undefined }}>
                  <AnimatePresence>
                    {showResult && oppCardData ? (
                      <TableCard
                        key={`opp-${opp.player_id}-${gameState?.turn_number}`}
                        card={oppCardData}
                        statDefs={statDefs}
                        highlightStatId={tableCalledStatId}
                        enterFrom="top"
                        label={opp.room_username}
                      />
                    ) : !showResult && isOppTurn && opp.top_card && !opp.is_eliminated ? (
                      /* Face-down while opponent picks */
                      <motion.div
                        key={`opp-facedown-${opp.player_id}`}
                        initial={{ y: -28, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark">{opp.room_username}</p>
                        <div className="card-back-pattern border-2 border-black" style={{ width: 170, height: 250, boxShadow: "4px 4px 0 #0a0a0a" }} />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Center panel: stat info + comparison scores */}
            <div className="game-table-center-panel" style={{ borderLeft: "2px solid #0a0a0a", borderRight: "2px solid #0a0a0a" }}>
              {showResult && calledStatDef ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="w-full text-center border-2 border-black bg-black py-2 px-2">
                    <p className="text-[8px] text-grey-mid uppercase tracking-widest">Stat Called</p>
                    <p className="font-display text-white text-base tracking-wider">{calledStatDef.display_name}</p>
                  </div>
                  <div className="w-full flex flex-col gap-1">
                    {displayedResult?.cards.map(c => {
                      const isMe = c.player_id === session.playerId;
                      const name = isMe ? "You" : (playerNameMap[c.player_id] ?? "?");
                      return (
                        <div key={c.player_id} className={`flex items-center justify-between px-2 py-1.5 border-2 ${c.is_winner ? "border-black bg-black" : "border-grey-light"}`}>
                          <span className={`text-[8px] font-bold uppercase tracking-wider truncate ${c.is_winner ? "text-white" : "text-grey-dark"}`}>
                            {name}{c.is_winner ? " ✓" : ""}
                          </span>
                          <span className={`font-mono font-bold text-sm ml-1 ${c.is_winner ? "text-white" : "text-black"}`}>{c.value}</span>
                        </div>
                      );
                    })}
                  </div>
                  {displayedResult && (
                    <p className="text-[8px] font-bold uppercase tracking-wider text-grey-dark text-center leading-tight">
                      {displayedResult.was_tie
                        ? `Tie — pot ${potCount + displayedResult.cards.length}`
                        : displayedResult.winner_id === session.playerId ? "You win!" : `${playerNameMap[displayedResult.winner_id ?? ""] ?? "?"} wins`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center opacity-20 select-none">
                  <p className="font-display text-3xl">vs</p>
                </div>
              )}
            </div>

            {/* My card slot */}
            <div className="game-table-slot">
              <AnimatePresence>
                {tableMyCard && (
                  <TableCard
                    key={`my-${tableMyCard.id}`}
                    card={tableMyCard}
                    statDefs={statDefs}
                    isActive={isMyTurn && !showResult}
                    onPickStat={isMyTurn && !showResult ? (statId) => {
                      comparingRef.current = true; // guard immediately
                      setTimerActive(false);
                      pickStat(statId);
                    } : undefined}
                    highlightStatId={showResult ? tableCalledStatId : undefined}
                    lockedStatId={isTieActive ? tiedStatId : null}
                    enterFrom="bottom"
                    label="You"
                  />
                )}
              </AnimatePresence>
            </div>

          </div>

          {isMyTurn && !showResult && tableMyCard && !isEliminated && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[9px] font-bold uppercase tracking-widest text-grey-dark mt-2"
            >
              {isTieActive && tiedStatId ? "Locked — tap the highlighted stat" : "Tap a stat on your card to call it"}
            </motion.p>
          )}
        </div>

        {/* ═══ MY ROW ═══ */}
        <div className="game-player-row game-player-row-bottom">
          <div className="game-corner-decks">
            {myHand && (
              <>
                <DeckPile count={myHand.main_count} label="Main" width={44} height={60} />
                <DeckPile count={myHand.side_count} label="Side" width={44} height={60} />
              </>
            )}
          </div>

          <div className="game-player-info">
            <div className="flex items-center gap-2">
              {isMyTurn && !showResult && <BouncingArrow direction="up" />}
              <span className="text-xs font-bold uppercase tracking-wider">You</span>
              {isEliminated && <span className="text-[8px] text-grey-mid">OUT</span>}
            </div>
          </div>

          <div className="game-corner-timer">
            <AnimatePresence>
              {isMyTurn && !showResult && !isEliminated && (
                <motion.div key={timerKey} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <TimerCircle
                    active={timerActive}
                    onExpire={handleTimerExpire}
                    size={48}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}

function BouncingArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <motion.svg
      width={20} height={20} viewBox="0 0 20 20" fill="none"
      animate={{ y: direction === "up" ? [0, -4, 0] : [0, 4, 0] }}
      transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
      style={{ transform: direction === "down" ? "rotate(180deg)" : undefined, flexShrink: 0 }}
    >
      <path d="M10 17 L2 7 L7 7 L7 3 L13 3 L13 7 L18 7 Z" fill="#0a0a0a" />
    </motion.svg>
  );
}
