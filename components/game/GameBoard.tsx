"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import { useGame, type CardInfo, type PlayerHandInfo, type RoundResult } from "@/hooks/useGame";
import { TableCard } from "./TableCard";
import { DeckPile } from "./DeckPile";
import { TimerCircle } from "./TimerCircle";
import { WinLoseModal } from "./WinLoseModal";

const AI_THINK_MS = 1800;
const COMPARISON_SHOW_MS = 5000;

export function GameBoard({ roomCode, deckName }: { roomCode: string; deckName: string }) {
  const session = useSession();
  const {
    loading, gameState, myHand, opponents, statDefs, allCards,
    isMyTurn, isEliminated, gameOver, gameWinnerId, pickStat,
  } = useGame(roomCode, session?.playerId ?? null);

  // Comparison state — persists for COMPARISON_SHOW_MS after a round resolves
  const [showResult, setShowResult] = useState(false);
  const [displayedResult, setDisplayedResult] = useState<RoundResult | null>(null);
  // Revealed card data for each opponent (by player_id) during comparison
  const [revealedOppCards, setRevealedOppCards] = useState<Record<string, CardInfo | null>>({});
  const [calledStatId, setCalledStatId] = useState<string | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  // Winning player in the current comparison (for celebration animation)
  const [celebratingPlayerId, setCelebratingPlayerId] = useState<string | null>(null);

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

  // ── Detect my turn → start timer ──────────────────────────────────────────
  useEffect(() => {
    if (isMyTurn && !showResult && !comparingRef.current) {
      setTimerKey(k => k + 1);
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  }, [isMyTurn, showResult]);

  // ── Detect new round result ───────────────────────────────────────────────
  useEffect(() => {
    const turn = gameState?.turn_number ?? 0;
    if (!lastResult || turn === lastTurnRef.current) return;
    lastTurnRef.current = turn;

    setTimerActive(false);
    comparingRef.current = true;

    // Build revealed opponent cards from the result
    const revealed: Record<string, CardInfo | null> = {};
    for (const c of lastResult.cards) {
      if (c.player_id !== session?.playerId) {
        revealed[c.player_id] = allCards[c.card_id] ?? null;
      }
    }
    setRevealedOppCards(revealed);
    setCalledStatId(lastResult.stat_id);
    setDisplayedResult(lastResult);
    setShowResult(true);
    setCelebratingPlayerId(lastResult.winner_id ?? null);

    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = setTimeout(() => {
      setShowResult(false);
      setRevealedOppCards({});
      setCalledStatId(null);
      setDisplayedResult(null);
      setCelebratingPlayerId(null);
      comparingRef.current = false;
    }, COMPARISON_SHOW_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.turn_number, lastResult]);

  // ── AI auto-pick ──────────────────────────────────────────────────────────
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
    if (!isMyTurn || showResult || comparingRef.current || gameState?.phase !== "stat_selection") return;
    const available = statDefs.filter(s => !isTieActive || !tiedStatId || s.id === tiedStatId);
    if (!available.length) return;
    const stat = available[Math.floor(Math.random() * available.length)];
    comparingRef.current = true;
    setTimerActive(false);
    pickStat(stat.id);
  }, [isMyTurn, showResult, gameState?.phase, statDefs, isTieActive, tiedStatId, pickStat]);

  const winnerName = allPlayers.find(p => p.player_id === gameWinnerId)?.room_username ?? "CPU";
  const calledStatDef = statDefs.find(s => s.id === calledStatId);
  const currentTurnName = allPlayers.find(p => p.player_id === gameState?.current_turn_player_id)?.room_username ?? "?";

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const oppCount = opponents.length;

  return (
    <div className="game-layout">
      {gameOver && gameWinnerId && (
        <WinLoseModal won={gameWinnerId === session.playerId} winnerName={winnerName} isSpectating={isEliminated} roomCode={roomCode} />
      )}

      {/* ── TOPBAR ──────────────────────────────────────────────────────── */}
      <div className="game-topbar">
        <span className="font-display tracking-widest" style={{ fontSize: "clamp(0.75rem, 2vw, 1rem)" }}>
          {deckName.toUpperCase()}
        </span>
        <div className="flex items-center gap-2 sm:gap-4">
          {isTieActive && (
            <span className="text-[8px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">
              TIE · {potCount} in pot
            </span>
          )}
          {isEliminated && (
            <span className="text-[8px] font-bold uppercase tracking-wider bg-grey-light border border-black px-1.5 py-0.5">
              SPECTATING
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider">Round {gameState?.turn_number ?? 1}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-grey-dark">
            {showResult ? "Comparing..." : isMyTurn ? "Your turn" : `${currentTurnName}'s turn`}
          </span>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="game-body">

        {/* ══ OPPONENT SECTIONS (top) ════════════════════════════════════ */}
        <div className="game-opp-bar">
          {opponents.map((opp, i) => (
            <OppSection
              key={opp.player_id}
              opp={opp}
              isActive={gameState?.current_turn_player_id === opp.player_id && !showResult}
              showThinking={!isMyTurn && !showResult && gameState?.current_turn_player_id === opp.player_id && opp.is_ai}
              align={oppCount === 1 ? "center" : i === 0 ? "left" : "right"}
            />
          ))}
        </div>

        {/* ══ TABLE ═════════════════════════════════════════════════════ */}
        <div className="game-table-outer">
          <div className="game-table" style={{
            gridTemplateColumns: `repeat(${oppCount}, 1fr) clamp(100px, 14vw, 150px) 1fr`
          }}>

            {/* One slot per opponent — card always face-down, flips to face-up during comparison */}
            {opponents.map(opp => {
              const isRevealed = showResult && !!revealedOppCards[opp.player_id];
              const isWinner = celebratingPlayerId === opp.player_id;
              const cardToShow = isRevealed
                ? revealedOppCards[opp.player_id]
                : (opp.top_card ?? null);

              return (
                <div key={opp.player_id} className="game-table-slot">
                  {cardToShow ? (
                    <motion.div
                      className="w-full h-full"
                      animate={isWinner && showResult
                        ? { scale: [1, 1.06, 1.02, 1], transition: { delay: 0.6, duration: 0.5 } }
                        : { scale: 1 }}
                    >
                      <TableCard
                        card={cardToShow}
                        statDefs={statDefs}
                        faceDown={!isRevealed}
                        highlightStatId={isRevealed ? calledStatId : undefined}
                        enterFrom="top"
                        label={opp.room_username + (opp.is_ai ? " [CPU]" : "")}
                      />
                    </motion.div>
                  ) : (
                    <EmptySlot label={opp.room_username} />
                  )}
                </div>
              );
            })}

            {/* CENTER panel */}
            <div className="game-table-center">
              {showResult && calledStatDef ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <div className="w-full text-center bg-black border-2 border-black py-1.5 px-1">
                    <p className="text-[7px] text-grey-mid uppercase tracking-widest">Called</p>
                    <p className="font-display text-white tracking-wider" style={{ fontSize: "clamp(0.75rem, 2vw, 1.1rem)" }}>
                      {calledStatDef.display_name}
                    </p>
                  </div>
                  <div className="w-full flex flex-col gap-1">
                    {displayedResult?.cards
                      .slice()
                      .sort((a, b) => (b.is_winner ? 1 : 0) - (a.is_winner ? 1 : 0))
                      .map(c => {
                        const isMe = c.player_id === session.playerId;
                        const name = isMe ? "You" : (playerNameMap[c.player_id] ?? "?");
                        return (
                          <motion.div
                            key={c.player_id}
                            initial={{ x: -8, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: displayedResult.cards.indexOf(c) * 0.1 }}
                            className={`flex items-center justify-between px-1.5 py-1 border-2 ${c.is_winner ? "border-black bg-black" : "border-grey-light bg-white"}`}
                          >
                            <span className={`font-bold truncate text-[8px] uppercase tracking-wide ${c.is_winner ? "text-white" : "text-grey-dark"}`}>
                              {name}{c.is_winner ? " ✓" : ""}
                            </span>
                            <span className={`font-mono font-bold text-sm ml-1 flex-shrink-0 ${c.is_winner ? "text-white" : "text-black"}`}>
                              {c.value}
                            </span>
                          </motion.div>
                        );
                      })}
                  </div>
                  {displayedResult && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-[8px] font-bold uppercase tracking-wider text-grey-dark text-center"
                    >
                      {displayedResult.was_tie
                        ? `Tie — ${potCount + displayedResult.cards.length} in pot`
                        : celebratingPlayerId === session.playerId ? "You win!" : `${playerNameMap[celebratingPlayerId ?? ""] ?? "?"} wins`}
                    </motion.p>
                  )}
                </motion.div>
              ) : (
                <span className="font-display text-grey-mid select-none" style={{ fontSize: "clamp(1.2rem, 3vw, 2rem)" }}>vs</span>
              )}
            </div>

            {/* MY slot — always visible, interactive when it's my turn */}
            <div className="game-table-slot">
              {myHand?.top_card ? (
                <motion.div
                  className="w-full h-full"
                  animate={celebratingPlayerId === session.playerId && showResult
                    ? { scale: [1, 1.06, 1.02, 1], transition: { delay: 0.6, duration: 0.5 } }
                    : { scale: 1 }}
                >
                  <TableCard
                    card={myHand.top_card}
                    statDefs={statDefs}
                    isActive={isMyTurn && !showResult && !isEliminated}
                    onPickStat={isMyTurn && !showResult && !isEliminated ? (statId) => {
                      comparingRef.current = true;
                      setTimerActive(false);
                      pickStat(statId);
                    } : undefined}
                    highlightStatId={showResult ? calledStatId : undefined}
                    lockedStatId={isTieActive && !showResult ? tiedStatId : null}
                    faceDown={false}
                    label="You"
                    enterFrom="none"
                  />
                </motion.div>
              ) : myHand && !myHand.is_eliminated ? (
                <EmptySlot label="You" />
              ) : null}
            </div>

          </div>

          {/* Prompt below table */}
          <AnimatePresence>
            {isMyTurn && !showResult && myHand?.top_card && !isEliminated && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-[8px] font-bold uppercase tracking-widest text-grey-dark mt-1"
              >
                {isTieActive && tiedStatId ? "Tap the highlighted stat" : "Tap a stat on your card to call it →"}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ══ MY SECTION (bottom) ═══════════════════════════════════════ */}
        <div className="game-my-bar">
          <div className="game-my-decks">
            <DeckPile count={myHand?.main_count ?? 0} label="Main" width={40} height={56} />
            <DeckPile count={myHand?.side_count ?? 0} label="Side" width={40} height={56} />
          </div>

          <div className="game-my-info">
            <div className="flex items-center gap-2">
              {isMyTurn && !showResult && <BouncingArrow />}
              <span className="text-xs font-bold uppercase tracking-wider">You</span>
              {isEliminated && <span className="text-[8px] text-grey-mid">OUT</span>}
            </div>
          </div>

          <div className="game-my-timer">
            <AnimatePresence>
              {isMyTurn && !showResult && !isEliminated && (
                <motion.div
                  key={timerKey}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <TimerCircle active={timerActive} onExpire={handleTimerExpire} size={44} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function OppSection({ opp, isActive, showThinking, align }: {
  opp: PlayerHandInfo;
  isActive: boolean;
  showThinking: boolean;
  align: "left" | "center" | "right";
}) {
  return (
    <div className={`game-opp-section ${align === "right" ? "game-opp-section-right" : ""}`}>
      {/* Deck piles */}
      <div className="game-opp-decks">
        <DeckPile count={opp.main_count} label="Main" width={40} height={56} />
        <DeckPile count={opp.side_count} label="Side" width={40} height={56} />
      </div>

      {/* Info */}
      <div className="game-opp-info">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isActive && <BouncingArrow down />}
          <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[120px]">{opp.room_username}</span>
          {opp.is_ai && <span className="text-[7px] font-bold border border-black px-1 uppercase">CPU</span>}
          {opp.is_eliminated && <span className="text-[8px] text-grey-mid">OUT</span>}
        </div>
        {showThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 mt-0.5"
          >
            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-[7px] text-grey-mid uppercase tracking-wider">thinking</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-25">
      <div className="border-2 border-dashed border-grey-mid" style={{ width: "60%", aspectRatio: "170/250" }} />
      <span className="text-[8px] font-bold uppercase tracking-wider text-grey-mid">{label}</span>
    </div>
  );
}

function BouncingArrow({ down }: { down?: boolean }) {
  return (
    <motion.svg
      width={16} height={16} viewBox="0 0 20 20" fill="none"
      animate={{ y: down ? [0, 4, 0] : [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
      style={{ transform: down ? "rotate(180deg)" : undefined, flexShrink: 0 }}
    >
      <path d="M10 17 L2 7 L7 7 L7 3 L13 3 L13 7 L18 7 Z" fill="#0a0a0a" />
    </motion.svg>
  );
}
