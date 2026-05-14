"use client";

import { motion } from "framer-motion";
import type { CardInfo, PlayerHandInfo } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { TableCard } from "./TableCard";

interface OpponentTileProps {
  player: PlayerHandInfo;
  isActive: boolean;          // their turn right now
  isRevealed: boolean;        // comparison phase — card is face-up
  revealedCard: CardInfo | null;
  celebWin: boolean;
  showResult: boolean;
  statDefs: StatDefinition[];
  deckSlug: string;
  deckCoverImageUrl: string | null;
  calledStatId: string | null;
  // Snapshot counts to display during comparison (pre-round values)
  displayMainCount: number;
  displaySideCount: number;
}

export function OpponentTile({
  player, isActive, isRevealed, revealedCard, celebWin, showResult,
  statDefs, deckSlug, deckCoverImageUrl, calledStatId,
  displayMainCount, displaySideCount,
}: OpponentTileProps) {
  const { is_eliminated } = player;
  const cardToShow = isRevealed ? revealedCard : (player.top_card ?? null);

  return (
    <motion.div
      className={[
        "gboard-opp-tile",
        isActive ? "gboard-opp-tile--active" : "",
        is_eliminated ? "gboard-opp-tile--out" : "",
      ].join(" ")}
      animate={celebWin && showResult ? { scale: [1, 1.06, 1.01, 1] } : { scale: 1 }}
      transition={{ delay: 0.55, duration: 0.45 }}
    >
      {/* ── Card face area ─────────────────────────────────────────────── */}
      <div className="gboard-opp-card">
        {is_eliminated ? (
          <div className="gboard-opp-eliminated">
            <span className="font-display text-grey-mid" style={{ fontSize: "clamp(0.75rem, 2vw, 1.1rem)" }}>
              OUT
            </span>
          </div>
        ) : cardToShow ? (
          <TableCard
            card={cardToShow}
            statDefs={statDefs}
            faceDown={!isRevealed}
            deckSlug={deckSlug}
            deckCoverImageUrl={deckCoverImageUrl}
            highlightStatId={isRevealed ? calledStatId : undefined}
            enterFrom="none"
          />
        ) : (
          <div className="gboard-opp-nocard">
            <span className="text-[8px] text-grey-mid uppercase tracking-wider font-bold">—</span>
          </div>
        )}
      </div>

      {/* ── Info strip ─────────────────────────────────────────────────── */}
      <div className="gboard-opp-info">
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          {/* Active pulse dot */}
          {isActive && !is_eliminated && (
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.85 }}
              className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0"
            />
          )}
          <span className="text-[8px] font-bold uppercase tracking-wider truncate">
            {player.room_username}
          </span>
          {player.is_ai && (
            <span className="text-[6px] border border-black px-0.5 font-bold uppercase flex-shrink-0 leading-tight">
              CPU
            </span>
          )}
        </div>

        {/* Pile counts */}
        {!is_eliminated ? (
          <div className="flex items-center gap-2">
            <span className="gboard-pile-badge">M:{displayMainCount}</span>
            <span className="gboard-pile-badge">S:{displaySideCount}</span>
          </div>
        ) : (
          <span className="text-[7px] text-grey-mid uppercase tracking-wider">OUT</span>
        )}
      </div>

      {/* AI thinking indicator — shown below info strip */}
      {isActive && player.is_ai && !is_eliminated && (
        <div
          className="absolute bottom-8 right-2 flex items-center gap-1 bg-white border border-black px-1.5 py-0.5"
          style={{ zIndex: 2 }}
        >
          <div className="w-2 h-2 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span className="text-[6px] text-grey-dark uppercase font-bold">thinking</span>
        </div>
      )}
    </motion.div>
  );
}
