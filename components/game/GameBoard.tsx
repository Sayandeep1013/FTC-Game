"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import { useGame, type CardInfo, type PlayerHandInfo, type RoundResult } from "@/hooks/useGame";
import { TableCard } from "./TableCard";
import { DeckPile } from "./DeckPile";
import { TimerCircle } from "./TimerCircle";
import { WinLoseModal } from "./WinLoseModal";
import { DeckBrowserModal } from "./DeckBrowserModal";

const AI_THINK_MS        = 1800;
const COMPARISON_SHOW_MS = 7000;
const TURN_ANNOUNCE_MS   = 1800;
const TIMER_DURATION     = 15;

export function GameBoard({ roomCode, deckName }: { roomCode: string; deckName: string }) {
  const session = useSession();
  const {
    loading, gameState, myHand, opponents, statDefs, allCards,
    isMyTurn, isEliminated, gameOver, gameWinnerId, pickStat,
  } = useGame(roomCode, session?.playerId ?? null);

  const [showResult, setShowResult]             = useState(false);
  const [displayedResult, setDisplayedResult]   = useState<RoundResult | null>(null);
  const [myPlayedCard, setMyPlayedCard]         = useState<CardInfo | null>(null);
  const [isPicking, setIsPicking]               = useState(false);
  const [myPickedStatId, setMyPickedStatId]     = useState<string | null>(null);
  const [revealedOppCards, setRevealedOppCards] = useState<Record<string, CardInfo | null>>({});
  const [calledStatId, setCalledStatId]         = useState<string | null>(null);
  const [celebWinnerId, setCelebWinnerId]       = useState<string | null>(null);
  const [turnBanner, setTurnBanner]             = useState<string | null>(null);
  const [timerTurnKey, setTimerTurnKey]         = useState(0);

  const [deckBrowserOpen, setDeckBrowserOpen]   = useState(false);
  const [browserTimerStart, setBrowserTimerStart] = useState(TIMER_DURATION);

  const comparingRef      = useRef(false);
  const resultTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimeoutRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTurnRef       = useRef(-1);
  const turnStartedAtRef  = useRef<number>(Date.now());

  const roundData   = gameState?.round_data ?? {};
  const isTieActive = !!(roundData.is_tie);
  const tiedStatId  = roundData.tie_stat_id as string | null | undefined;
  const potCount    = (roundData.pot_card_ids as string[] | undefined)?.length ?? 0;
  const lastResult  = roundData.last_result as RoundResult | undefined;

  const allPlayers    = [...(myHand ? [myHand] : []), ...opponents];
  const playerNameMap: Record<string, string> = {};
  for (const p of allPlayers) playerNameMap[p.player_id] = p.room_username;

  const myCurrentTopCard = myHand?.top_card ?? null;
  const myCardToShow     = (isPicking || showResult) ? myPlayedCard : myCurrentTopCard;

  // ── Turn changes ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameState || showResult || gameState.phase !== "stat_selection") return;
    setTimerTurnKey(k => k + 1);
    turnStartedAtRef.current = Date.now();
    setDeckBrowserOpen(false); // close browser on new turn so timer resets cleanly
    const activeName = playerNameMap[gameState.current_turn_player_id] ?? "?";
    const text = isMyTurn ? "YOUR TURN" : `${activeName}'S TURN`;
    setTurnBanner(text);
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    bannerTimeoutRef.current = setTimeout(() => setTurnBanner(null), TURN_ANNOUNCE_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.current_turn_player_id, gameState?.turn_number]);

  // ── New round result ────────────────────────────────────────────────────────
  useEffect(() => {
    const turn = gameState?.turn_number ?? 0;
    if (!lastResult || turn === lastTurnRef.current) return;
    lastTurnRef.current = turn;
    setTurnBanner(null);

    const revealed: Record<string, CardInfo | null> = {};
    for (const c of lastResult.cards) {
      if (c.player_id !== session?.playerId)
        revealed[c.player_id] = allCards[c.card_id] ?? null;
    }
    const myEntry = lastResult.cards.find(c => c.player_id === session?.playerId);
    if (myEntry) setMyPlayedCard(prev => prev ?? allCards[myEntry.card_id] ?? null);

    setRevealedOppCards(revealed);
    setCalledStatId(lastResult.stat_id);
    setDisplayedResult(lastResult);
    setCelebWinnerId(lastResult.winner_id ?? null);
    setShowResult(true);

    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = setTimeout(() => {
      setShowResult(false);
      setIsPicking(false);
      setMyPlayedCard(null);
      setMyPickedStatId(null);
      setRevealedOppCards({});
      setCalledStatId(null);
      setDisplayedResult(null);
      setCelebWinnerId(null);
      comparingRef.current = false;
    }, COMPARISON_SHOW_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.turn_number, lastResult]);

  // ── AI auto-pick ────────────────────────────────────────────────────────────
  const currentAiPlayer = (gameState?.phase === "stat_selection" && !showResult)
    ? allPlayers.find(p => p.player_id === gameState.current_turn_player_id && p.is_ai && p.top_card)
    : null;
  const aiPlayerId  = currentAiPlayer?.player_id ?? null;
  const aiHasCard   = !!(currentAiPlayer?.top_card);
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

  // ── Timer expiry ────────────────────────────────────────────────────────────
  const handleTimerExpire = useCallback(() => {
    if (!isMyTurn || showResult || comparingRef.current || gameState?.phase !== "stat_selection") return;
    setDeckBrowserOpen(false);
    const available = statDefs.filter(s => !isTieActive || !tiedStatId || s.id === tiedStatId);
    if (!available.length) return;
    const stat = available[Math.floor(Math.random() * available.length)];
    setMyPlayedCard(myCurrentTopCard);
    setMyPickedStatId(stat.id);
    setIsPicking(true);
    comparingRef.current = true;
    pickStat(stat.id);
  }, [isMyTurn, showResult, gameState?.phase, statDefs, isTieActive, tiedStatId, myCurrentTopCard, pickStat]);

  function openDeckBrowser() {
    const elapsed = Math.floor((Date.now() - turnStartedAtRef.current) / 1000);
    setBrowserTimerStart(Math.max(1, TIMER_DURATION - elapsed));
    setDeckBrowserOpen(true);
  }

  function handlePickStat(statId: string) {
    setMyPlayedCard(myCurrentTopCard);
    setMyPickedStatId(statId);
    setIsPicking(true);
    comparingRef.current = true;
    setTurnBanner(null);
    pickStat(statId);
  }

  const winnerName      = allPlayers.find(p => p.player_id === gameWinnerId)?.room_username ?? "CPU";
  const calledStatDef   = statDefs.find(s => s.id === calledStatId);
  const currentTurnName = allPlayers.find(p => p.player_id === gameState?.current_turn_player_id)?.room_username ?? "?";
  const isAnyoneTurn    = gameState?.phase === "stat_selection" && !showResult;

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

      {/* ── TOPBAR ──────────────────────────────────────────────────────── */}
      <div className="game-topbar">
        <div className="flex items-center gap-3">
          <span className="font-display tracking-widest text-sm">{deckName.toUpperCase()}</span>
          <button
            onClick={openDeckBrowser}
            className="text-[8px] font-bold uppercase tracking-wider border border-black px-2 py-0.5 flex-shrink-0"
            style={{ transition: "background 80ms, color 80ms" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0a0a0a"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = ""; }}
          >
            View Cards
          </button>
        </div>
        <div className="flex items-center gap-3">
          {isTieActive && <span className="text-[8px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">TIE · {potCount} in pot</span>}
          {isEliminated && <span className="text-[8px] font-bold uppercase tracking-wider bg-grey-light border border-black px-1.5 py-0.5">SPECTATING</span>}
          <span className="text-[9px] font-bold uppercase tracking-wider">Round {gameState?.turn_number ?? 1}</span>
        </div>
      </div>

      {/* ── BODY: 3 vertical rows ───────────────────────────────────────── */}
      <div className="game-body-v2">

        {/* ══ OPPONENT HALF (top) ════════════════════════════════════════ */}
        <div className="game-opp-half">
          {opponents.map(opp => {
            const isOppActive = isAnyoneTurn && gameState?.current_turn_player_id === opp.player_id;
            const isRevealed  = showResult && revealedOppCards[opp.player_id] !== undefined;
            const cardToShow  = isRevealed ? revealedOppCards[opp.player_id] : (opp.top_card ?? null);
            const isWinner    = celebWinnerId === opp.player_id;

            return (
              <div key={opp.player_id} className="game-player-cluster">
                {/* Left: deck piles */}
                <div className="game-stack-piles">
                  <DeckPile count={opp.main_count} label="Main" width={48} height={66} />
                  <DeckPile count={opp.side_count} label="Side" width={48} height={66} />
                </div>

                {/* Center: card */}
                <div className="game-card-wrap">
                  <motion.div
                    className="w-full h-full"
                    animate={isWinner && showResult
                      ? { scale: [1, 1.04, 1.01, 1], transition: { delay: 0.7, duration: 0.5 } }
                      : { scale: 1 }}
                  >
                    {cardToShow ? (
                      <TableCard
                        card={cardToShow}
                        statDefs={statDefs}
                        faceDown={!isRevealed}
                        highlightStatId={isRevealed ? calledStatId : undefined}
                        enterFrom="top"
                        label={opp.room_username + (opp.is_ai ? " [CPU]" : "")}
                      />
                    ) : <GhostCard label={opp.room_username} />}
                  </motion.div>
                </div>

                {/* Right: player info */}
                <div className="game-player-labels">
                  {isOppActive && (
                    <motion.svg width={14} height={14} viewBox="0 0 20 20" fill="none"
                      style={{ transform: "rotate(180deg)" }}
                      animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                      <path d="M10 17 L2 7 L7 7 L7 3 L13 3 L13 7 L18 7 Z" fill="#0a0a0a" />
                    </motion.svg>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{opp.room_username}</span>
                  <div className="flex gap-1 flex-wrap">
                    {opp.is_ai && <span className="text-[7px] border border-black px-1 font-bold uppercase">CPU</span>}
                    {opp.is_eliminated && <span className="text-[8px] text-grey-mid">OUT</span>}
                  </div>
                  {isOppActive && opp.is_ai && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span className="text-[7px] text-grey-mid uppercase">thinking</span>
                    </div>
                  )}
                  {isOppActive && !opp.is_ai && (
                    <span className="text-[7px] text-grey-dark uppercase tracking-wider font-bold mt-1">Selecting...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ══ CENTER STRIP ════════════════════════════════════════════════ */}
        <div className="game-center-strip">
          {showResult && calledStatDef ? (
            /* Comparison results */
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 w-full justify-center"
            >
              <div className="text-center bg-black border-2 border-black px-4 py-2" style={{ minWidth: 120 }}>
                <p className="text-[7px] text-grey-mid uppercase tracking-widest">Stat Called</p>
                <p className="font-display text-white tracking-wider text-lg">{calledStatDef.display_name}</p>
              </div>

              <div className="flex flex-col gap-1" style={{ minWidth: 140 }}>
                {displayedResult?.cards
                  .slice().sort((a, b) => (b.is_winner ? 1 : 0) - (a.is_winner ? 1 : 0))
                  .map((c, i) => {
                    const isMe = c.player_id === session.playerId;
                    return (
                      <motion.div
                        key={c.player_id}
                        initial={{ x: -8, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center justify-between px-2 py-1 border-2 ${c.is_winner ? "border-black bg-black" : "border-grey-light bg-white"}`}
                      >
                        <span className={`text-[8px] font-bold uppercase tracking-wide ${c.is_winner ? "text-white" : "text-grey-dark"}`}>
                          {isMe ? "You" : playerNameMap[c.player_id]}{c.is_winner ? " ✓" : ""}
                        </span>
                        <span className={`font-mono font-bold text-sm ml-2 ${c.is_winner ? "text-white" : "text-black"}`}>
                          {c.value}
                        </span>
                      </motion.div>
                    );
                  })}
                <p className="text-[7px] font-bold uppercase tracking-wider text-grey-dark text-center mt-0.5">
                  {displayedResult?.was_tie
                    ? `Tie — ${potCount + (displayedResult.cards.length)} in pot`
                    : celebWinnerId === session.playerId ? "You win this round!" : `${playerNameMap[celebWinnerId ?? ""] ?? "?"} wins`}
                </p>
              </div>
            </motion.div>
          ) : (
            /* Persistent turn indicator + shared timer — everyone sees this */
            <div className="flex items-center gap-5">
              {/* Timer hides from center strip when deck browser is open (lives in modal header instead) */}
              {!deckBrowserOpen && (
                <TimerCircle
                  durationSeconds={TIMER_DURATION}
                  countDown={isAnyoneTurn}
                  isActiveTurn={isMyTurn}
                  onExpire={handleTimerExpire}
                  turnKey={timerTurnKey}
                  size={48}
                />
              )}
              {/* Persistent turn label — visible to ALL players at all times during a turn */}
              <div
                className={`border-2 border-black px-5 py-2 text-center ${isMyTurn && !showResult ? "bg-black" : "bg-white"}`}
                style={{ boxShadow: "3px 3px 0 #0a0a0a", minWidth: 180 }}
              >
                <p className={`font-display tracking-widest text-base ${isMyTurn && !showResult ? "text-white" : "text-black"}`}>
                  {!gameState || gameState.phase === "finished"
                    ? "GAME OVER"
                    : isMyTurn
                    ? "YOUR TURN"
                    : `${currentTurnName}'S TURN`}
                </p>
                {isMyTurn && !showResult && !isEliminated && (
                  <p className="text-[7px] text-grey-mid uppercase tracking-widest mt-0.5">
                    {isPicking && myPickedStatId
                      ? `${statDefs.find(s => s.id === myPickedStatId)?.display_name?.toUpperCase() ?? "STAT"} LOCKED IN`
                      : isTieActive && tiedStatId
                      ? "Tap the highlighted stat"
                      : "Tap a stat on your card ↓"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ MY HALF (bottom) ════════════════════════════════════════════ */}
        <div className="game-my-half">
          {/* Left: deck piles */}
          <div className="game-stack-piles">
            <DeckPile count={myHand?.main_count ?? 0} label="Main" width={48} height={66} />
            <DeckPile count={myHand?.side_count ?? 0} label="Side" width={48} height={66} />
          </div>

          {/* Center: my card */}
          <div className="game-card-wrap">
            <motion.div
              className="w-full h-full"
              animate={celebWinnerId === session.playerId && showResult
                ? { scale: [1, 1.04, 1.01, 1], transition: { delay: 0.7, duration: 0.5 } }
                : { scale: 1 }}
            >
              {myCardToShow ? (
                <TableCard
                  card={myCardToShow}
                  statDefs={statDefs}
                  isActive={isMyTurn && !showResult && !isEliminated && !isPicking}
                  onPickStat={isMyTurn && !showResult && !isEliminated && !isPicking ? handlePickStat : undefined}
                  highlightStatId={showResult ? calledStatId : (myPickedStatId ?? undefined)}
                  lockedStatId={isTieActive && !showResult ? tiedStatId : null}
                  showCheckmark={isPicking && !showResult}
                  faceDown={false}
                  label="You"
                  enterFrom="none"
                />
              ) : (
                myHand && !myHand.is_eliminated ? <GhostCard label="You" /> : null
              )}
            </motion.div>
          </div>

          {/* Right: my info */}
          <div className="game-player-labels">
            {isMyTurn && !showResult && (
              <motion.svg width={14} height={14} viewBox="0 0 20 20" fill="none"
                animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                <path d="M10 17 L2 7 L7 7 L7 3 L13 3 L13 7 L18 7 Z" fill="#0a0a0a" />
              </motion.svg>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider">You</span>
            {isEliminated && <span className="text-[8px] text-grey-mid">OUT</span>}
          </div>
        </div>

      </div>

      {/* ── DECK BROWSER MODAL ──────────────────────────────────────────── */}
      {deckBrowserOpen && (
        <DeckBrowserModal
          allCards={allCards}
          statDefs={statDefs}
          onClose={() => setDeckBrowserOpen(false)}
          isMyTurn={isMyTurn && !showResult && !isEliminated}
          countDown={isAnyoneTurn}
          timerInitialRemaining={browserTimerStart}
          timerDuration={TIMER_DURATION}
          timerTurnKey={timerTurnKey}
          onTimerExpire={() => { handleTimerExpire(); setDeckBrowserOpen(false); }}
        />
      )}

      {/* ── TURN BANNER (flash on turn start) ───────────────────────────── */}
      <AnimatePresence>
        {turnBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.72, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -14 }}
            transition={{ type: "spring", stiffness: 460, damping: 28 }}
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: "40%", zIndex: 20 }}
          >
            <div
              className={`font-display tracking-widest px-8 py-4 border-3 border-black ${isMyTurn ? "bg-black text-white" : "bg-white text-black"}`}
              style={{ fontSize: "clamp(1.4rem, 4vw, 2.4rem)", boxShadow: "6px 6px 0 rgba(10,10,10,0.3)" }}
            >
              {turnBanner}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function GhostCard({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center w-full h-full">
      {label && <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark mb-1 flex-shrink-0">{label}</p>}
      <div className="flex-1 w-full border-2 border-dashed border-grey-mid bg-grey-light opacity-25" />
    </div>
  );
}
