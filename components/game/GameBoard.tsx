"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useGame, type CardInfo, type RoundResult } from "@/hooks/useGame";
import { GameHUD } from "./GameHUD";
import { OpponentTile } from "./OpponentTile";
import { ComparisonOverlay } from "./ComparisonOverlay";
import { ChatPanel } from "./ChatPanel";
import { ChatNotification } from "./ChatNotification";
import { TableCard } from "./TableCard";
import { DeckPile } from "./DeckPile";
import { WinLoseModal } from "./WinLoseModal";
import { DeckBrowserModal } from "./DeckBrowserModal";
import { useChat } from "@/hooks/useChat";

// ── Constants ──────────────────────────────────────────────────────────────
const AI_THINK_MS        = 1800;
const COMPARISON_SHOW_MS = 6500;
const TURN_ANNOUNCE_MS   = 1600;
const TIMER_DURATION     = 15;

// ── Props ──────────────────────────────────────────────────────────────────
export function GameBoard({
  roomCode,
  deckName,
  deckSlug,
  deckCoverImageUrl,
}: {
  roomCode: string;
  deckName: string;
  deckSlug: string;
  deckCoverImageUrl: string | null;
}) {
  const router   = useRouter();
  const session  = useSession();
  const {
    loading, gameState, myHand, opponents, statDefs, allCards,
    isMyTurn, isEliminated, gameOver, gameWinnerId, pickStat,
  } = useGame(roomCode, session?.playerId ?? null);

  // ── UI state ───────────────────────────────────────────────────────────
  const [showResult, setShowResult]           = useState(false);
  const [displayedResult, setDisplayedResult] = useState<RoundResult | null>(null);
  const [myPlayedCard, setMyPlayedCard]       = useState<CardInfo | null>(null);
  const [isPicking, setIsPicking]             = useState(false);
  const [myPickedStatId, setMyPickedStatId]   = useState<string | null>(null);
  const [revealedOppCards, setRevealedOppCards] = useState<Record<string, CardInfo | null>>({});
  const [calledStatId, setCalledStatId]       = useState<string | null>(null);
  const [celebWinnerId, setCelebWinnerId]     = useState<string | null>(null);
  const [turnBanner, setTurnBanner]           = useState<string | null>(null);
  const [timerTurnKey, setTimerTurnKey]       = useState(0);
  const [deckBrowserOpen, setDeckBrowserOpen] = useState(false);
  const [browserTimerStart, setBrowserTimerStart] = useState(TIMER_DURATION);
  const [leaveOpen, setLeaveOpen]             = useState(false);
  const [leavePending, setLeavePending]       = useState(false);
  const [chatOpen, setChatOpen]               = useState(false);
  const [unreadCount, setUnreadCount]         = useState(0);
  const [notification, setNotification]       = useState<import("@/hooks/useChat").ChatMessage | null>(null);

  // ── Chat ────────────────────────────────────────────────────────────────
  const myUsername = myHand?.room_username ?? session?.playerId?.slice(0, 6) ?? "Guest";
  const { messages: chatMessages, sendMessage: sendChatMessage } = useChat(
    roomCode, session?.playerId ?? null, myUsername
  );

  // ── Refs ───────────────────────────────────────────────────────────────
  const comparingRef     = useRef(false);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTurnRef      = useRef(-1);
  const turnStartedAtRef = useRef<number>(Date.now());
  const countHistoryRef  = useRef<Record<number, Record<string, { main: number; side: number }>>>({});

  // ── Derived ────────────────────────────────────────────────────────────
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
  const isAnyoneTurn     = gameState?.phase === "stat_selection" && !showResult;
  const currentTurnName  = playerNameMap[gameState?.current_turn_player_id ?? ""] ?? "?";
  const winnerName       = allPlayers.find(p => p.player_id === gameWinnerId)?.room_username ?? "Player";

  // ── Unread counter + toast notification when chat is closed ──────────
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    const total = chatMessages.length;
    if (total > prevMsgCountRef.current) {
      if (!chatOpen) {
        const newMsgs = chatMessages.slice(prevMsgCountRef.current);
        setUnreadCount(c => c + newMsgs.length);
        // Toast: last non-system message from someone else
        const fromOther = newMsgs.filter(
          m => m.player_id !== session?.playerId && !m.isSystem
        );
        if (fromOther.length > 0) {
          setNotification(fromOther[fromOther.length - 1]);
        }
      }
    }
    prevMsgCountRef.current = total;
  }, [chatMessages, chatOpen, session?.playerId]);

  // ── Snapshot deck counts before each round resolves ───────────────────
  useEffect(() => {
    if (showResult || !gameState) return;
    const snap: Record<string, { main: number; side: number }> = {};
    for (const p of allPlayers) snap[p.player_id] = { main: p.main_count, side: p.side_count };
    countHistoryRef.current[gameState.turn_number] = snap;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult, gameState?.turn_number, opponents, myHand]);

  function displayCount(playerId: string, type: "main" | "side", actual: number): number {
    const snap = showResult
      ? (countHistoryRef.current[(gameState?.turn_number ?? 0) - 1] ?? null)
      : null;
    return snap ? (snap[playerId]?.[type] ?? actual) : actual;
  }

  // ── Turn changes ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameState || showResult || gameState.phase !== "stat_selection") return;
    setTimerTurnKey(k => k + 1);
    turnStartedAtRef.current = Date.now();
    setDeckBrowserOpen(false);
    const activeName = playerNameMap[gameState.current_turn_player_id] ?? "?";
    const text = isMyTurn ? "YOUR TURN" : `${activeName}'S TURN`;
    setTurnBanner(text);
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    bannerTimeoutRef.current = setTimeout(() => setTurnBanner(null), TURN_ANNOUNCE_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.current_turn_player_id, gameState?.turn_number]);

  // ── New round result ───────────────────────────────────────────────────
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
    resultTimeoutRef.current = setTimeout(() => dismissComparison(), COMPARISON_SHOW_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.turn_number, lastResult]);

  function dismissComparison() {
    if (resultTimeoutRef.current) { clearTimeout(resultTimeoutRef.current); resultTimeoutRef.current = null; }
    setShowResult(false);
    setIsPicking(false);
    setMyPlayedCard(null);
    setMyPickedStatId(null);
    setRevealedOppCards({});
    setCalledStatId(null);
    setDisplayedResult(null);
    setCelebWinnerId(null);
    comparingRef.current = false;
  }

  // ── AI auto-pick ───────────────────────────────────────────────────────
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

  // ── Timer expiry ───────────────────────────────────────────────────────
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

  function handlePickStat(statId: string) {
    setMyPlayedCard(myCurrentTopCard);
    setMyPickedStatId(statId);
    setIsPicking(true);
    comparingRef.current = true;
    setTurnBanner(null);
    pickStat(statId);
  }

  function openDeckBrowser() {
    const elapsed = Math.floor((Date.now() - turnStartedAtRef.current) / 1000);
    setBrowserTimerStart(Math.max(1, TIMER_DURATION - elapsed));
    setDeckBrowserOpen(true);
  }

  // ── Chat toggle ────────────────────────────────────────────────────────
  function toggleChat() {
    setChatOpen(o => {
      if (!o) {
        setUnreadCount(0);     // reset badge when opening
        setNotification(null); // clear toast when opening
      }
      return !o;
    });
  }

  // ── Forfeit / leave ────────────────────────────────────────────────────
  async function handleForfeit() {
    setLeavePending(true);
    await fetch(`/api/game/${roomCode}/forfeit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: session?.playerId }),
      keepalive: true,
    });
    router.push("/");
  }

  // ── Center band state class ────────────────────────────────────────────
  const centerClass = [
    "gboard-center-band",
    isMyTurn && !showResult ? "gboard-center-band--myturn" : "",
    isTieActive && !showResult && !isMyTurn ? "gboard-center-band--tie" : "",
  ].filter(Boolean).join(" ");

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading || !session) {
    return (
      <div className="gboard-layout" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="gboard-layout">

      {/* ── Game over modal ─────────────────────────────────────────────── */}
      {gameOver && gameWinnerId && (
        <WinLoseModal
          won={gameWinnerId === session.playerId}
          winnerName={winnerName}
          isSpectating={isEliminated}
          roomCode={roomCode}
        />
      )}

      {/* ── Forfeit confirmation modal ──────────────────────────────────── */}
      <AnimatePresence>
        {leaveOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(10,10,10,0.7)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="panel-brutal w-full max-w-sm mx-4"
            >
              <div className="bg-black px-5 py-3 border-b-2 border-black">
                <p className="font-display text-white text-xl tracking-widest">LEAVE GAME?</p>
              </div>
              <div className="p-5">
                <p className="text-sm mb-5 leading-relaxed text-grey-dark">
                  You&apos;ll be eliminated and your cards removed. The game continues for other players.
                </p>
                <div className="flex gap-3">
                  <button
                    className="btn-brutal btn-primary flex-1"
                    onClick={handleForfeit}
                    disabled={leavePending}
                  >
                    {leavePending ? "Leaving..." : "Forfeit & Leave"}
                  </button>
                  <button
                    className="btn-brutal btn-secondary flex-1"
                    onClick={() => setLeaveOpen(false)}
                    disabled={leavePending}
                  >
                    Stay
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <GameHUD
        deckName={deckName}
        roundNumber={gameState?.turn_number ?? 1}
        isTieActive={isTieActive}
        potCount={potCount}
        isMyTurn={isMyTurn}
        isAnyoneTurn={isAnyoneTurn}
        showResult={showResult}
        deckBrowserOpen={deckBrowserOpen}
        timerTurnKey={timerTurnKey}
        timerDuration={TIMER_DURATION}
        onTimerExpire={handleTimerExpire}
        currentTurnName={currentTurnName}
        isEliminated={isEliminated}
        chatOpen={chatOpen}
        unreadCount={unreadCount}
        onChatToggle={toggleChat}
        onLeaveRequest={() => setLeaveOpen(true)}
      />

      {/* ── Game body ────────────────────────────────────────────────────── */}
      <div className="gboard-body">

        {/* ══ OPPONENT ZONE ════════════════════════════════════════════════ */}
        <div className="gboard-opp-zone" data-count={String(opponents.length || 1)}>
          {opponents.map(opp => (
            <OpponentTile
              key={opp.player_id}
              player={opp}
              isActive={isAnyoneTurn && gameState?.current_turn_player_id === opp.player_id}
              isRevealed={showResult && revealedOppCards[opp.player_id] !== undefined}
              revealedCard={revealedOppCards[opp.player_id] ?? null}
              celebWin={celebWinnerId === opp.player_id}
              showResult={showResult}
              statDefs={statDefs}
              deckSlug={deckSlug}
              deckCoverImageUrl={deckCoverImageUrl}
              calledStatId={calledStatId}
              displayMainCount={displayCount(opp.player_id, "main", opp.main_count)}
              displaySideCount={displayCount(opp.player_id, "side", opp.side_count)}
            />
          ))}
        </div>

        {/* ══ CENTER BAND ══════════════════════════════════════════════════ */}
        <div className={centerClass}>
          <div className="gboard-center-text flex flex-col items-center gap-0.5">
            {!gameState || gameState.phase === "finished" ? (
              <span className="gboard-center-label">GAME OVER</span>
            ) : isMyTurn && !showResult ? (
              <>
                <span className="gboard-center-label">
                  {isPicking && myPickedStatId
                    ? `${statDefs.find(s => s.id === myPickedStatId)?.display_name?.toUpperCase() ?? "STAT"} LOCKED IN`
                    : isTieActive && tiedStatId
                    ? "TAP THE HIGHLIGHTED STAT"
                    : "YOUR TURN — PICK A STAT"}
                </span>
                {!isPicking && (
                  <button
                    onClick={openDeckBrowser}
                    className="text-[8px] font-bold uppercase tracking-wider border border-white px-2 py-0.5 text-white mt-0.5"
                    style={{ opacity: 0.6, transition: "opacity 80ms" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.6"; }}
                  >
                    View Cards
                  </button>
                )}
              </>
            ) : (
              <span className="gboard-center-label">
                {isTieActive
                  ? `TIE · ${potCount} IN POT · ${currentTurnName}'S PICK`
                  : `${currentTurnName}'S TURN`}
              </span>
            )}
          </div>

          {/* Spectating badge */}
          {isEliminated && (
            <span className="text-[8px] font-bold uppercase tracking-wider bg-grey-light border border-black px-2 py-0.5">
              SPECTATING
            </span>
          )}
        </div>

        {/* ══ MY ZONE ══════════════════════════════════════════════════════ */}
        <div className="gboard-my-zone">

          {/* Pile displays */}
          <div className="gboard-my-piles">
            <DeckPile
              count={myHand ? displayCount(myHand.player_id, "main", myHand.main_count) : 0}
              label="Main"
              width={40}
              height={56}
              deckSlug={deckSlug}
              deckCoverImageUrl={deckCoverImageUrl}
            />
            <DeckPile
              count={myHand ? displayCount(myHand.player_id, "side", myHand.side_count) : 0}
              label="Side"
              width={40}
              height={56}
              deckSlug={deckSlug}
              deckCoverImageUrl={deckCoverImageUrl}
            />
          </div>

          {/* My card */}
          <div className="gboard-my-card-wrap">
            <motion.div
              className="w-full h-full"
              animate={celebWinnerId === session.playerId && showResult
                ? { scale: [1, 1.05, 1.01, 1] }
                : { scale: 1 }}
              transition={{ delay: 0.55, duration: 0.45 }}
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
                  enterFrom="none"
                />
              ) : (
                myHand && !myHand.is_eliminated
                  ? <GhostCard />
                  : null
              )}
            </motion.div>
          </div>

          {/* My labels */}
          <div className="gboard-my-labels">
            {isMyTurn && !showResult && (
              <motion.svg
                width={14} height={14} viewBox="0 0 20 20" fill="none"
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
              >
                <path d="M10 17 L2 7 L7 7 L7 3 L13 3 L13 7 L18 7 Z" fill="#0a0a0a" />
              </motion.svg>
            )}
            <span className="text-[9px] font-bold uppercase tracking-wider">You</span>
            {isEliminated && (
              <span className="text-[8px] text-grey-mid font-bold uppercase">OUT</span>
            )}
          </div>
        </div>

      </div>{/* /gboard-body */}

      {/* ── Comparison overlay (slides up on round result) ──────────────── */}
      <AnimatePresence>
        {showResult && displayedResult && (
          <ComparisonOverlay
            result={displayedResult}
            allCards={allCards}
            statDefs={statDefs}
            playerNames={playerNameMap}
            potCount={potCount}
            myPlayerId={session.playerId}
            autoCloseSecs={COMPARISON_SHOW_MS / 1000}
            onDismiss={dismissComparison}
          />
        )}
      </AnimatePresence>

      {/* ── Deck browser modal ───────────────────────────────────────────── */}
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

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && (
          <ChatPanel
            messages={chatMessages}
            myPlayerId={session.playerId}
            onSend={sendChatMessage}
            onClose={toggleChat}
          />
        )}
      </AnimatePresence>

      {/* ── Chat notification toast ─────────────────────────────────────── */}
      <AnimatePresence>
        {notification && !chatOpen && (
          <ChatNotification
            message={notification}
            onDismiss={() => setNotification(null)}
            onOpen={toggleChat}
          />
        )}
      </AnimatePresence>

      {/* ── Turn banner flash (appears at top of board on each new turn) ── */}
      <AnimatePresence>
        {turnBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.76, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: "38%", zIndex: 20 }}
          >
            <div
              className={`font-display tracking-widest px-8 py-4 border-3 border-black ${isMyTurn ? "bg-black text-white" : "bg-white text-black"}`}
              style={{ fontSize: "clamp(1.3rem, 4vw, 2.2rem)", boxShadow: "6px 6px 0 rgba(10,10,10,0.28)" }}
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

function GhostCard() {
  return (
    <div className="w-full h-full border-2 border-dashed border-grey-mid bg-grey-light opacity-30" />
  );
}
