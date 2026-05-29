"use client";

import { motion } from "framer-motion";
import type { RoundResult, CardInfo } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { formatStatValue } from "@/lib/utils/statFormat";

interface ComparisonOverlayProps {
  result: RoundResult;
  allCards: Record<string, CardInfo>;
  statDefs: StatDefinition[];
  playerNames: Record<string, string>;
  potCount: number;
  myPlayerId: string | null;
  autoCloseSecs: number;
  onDismiss: () => void;
}

export function ComparisonOverlay({
  result, allCards, statDefs, playerNames, potCount, myPlayerId, autoCloseSecs, onDismiss,
}: ComparisonOverlayProps) {
  const calledStat = statDefs.find(s => s.id === result.stat_id);

  // Winner first, then descending by value
  const sorted = [...result.cards].sort((a, b) => {
    if (a.is_winner && !b.is_winner) return -1;
    if (!a.is_winner && b.is_winner) return 1;
    return b.value - a.value;
  });

  const totalPotAfter = potCount + result.cards.length;

  return (
    <motion.div
      className="gboard-comparison-overlay"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "110%" }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      onClick={onDismiss}
      title="Tap to dismiss"
    >
      {/* Drag hint */}
      <div className="gboard-comparison-drag" />

      {/* Stat called */}
      <div className="gboard-comparison-stat">
        <p className="text-[8px] text-grey-mid uppercase tracking-[0.28em]">Stat Called</p>
        <motion.p
          className="font-display text-white tracking-wider leading-none"
          style={{ fontSize: "clamp(1.5rem, 4.5vw, 2.6rem)" }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 420, damping: 28 }}
        >
          {calledStat?.display_name ?? "—"}
        </motion.p>
      </div>

      {/* Cards row */}
      <div className="gboard-comparison-cards" onClick={e => e.stopPropagation()}>
        {sorted.map((c, i) => {
          const card = allCards[c.card_id];
          const imageUrl = card ? getCardImageUrl(card.image_url, card.image_storage_path) : null;
          const isMe = c.player_id === myPlayerId;
          const name = isMe ? "You" : (playerNames[c.player_id] ?? "?");

          return (
            <motion.div
              key={c.player_id}
              className={`gboard-cmp-card ${c.is_winner ? "gboard-cmp-card--winner" : ""}`}
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.18, type: "spring", stiffness: 380, damping: 32 }}
            >
              {/* Card image */}
              <div className="gboard-cmp-img">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={card?.name ?? ""} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="font-display text-grey-mid text-2xl">
                    {card?.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>

              {/* Card name strip */}
              <div className={`px-2 py-0.5 border-b ${c.is_winner ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5"}`}>
                <p className="font-display text-[0.65rem] truncate text-grey-light leading-tight">
                  {card?.name?.toUpperCase() ?? "?"}
                </p>
              </div>

              {/* Player + value */}
              <div className="px-2 py-2 text-center">
                <p className="text-[7px] uppercase tracking-wider text-grey-mid truncate">{name}</p>
                <p
                  className={`font-mono font-bold leading-none mt-1 ${c.is_winner ? "text-white" : "text-grey-mid"}`}
                  style={{ fontSize: c.is_winner ? "clamp(1.2rem, 3vw, 1.8rem)" : "clamp(0.9rem, 2.2vw, 1.2rem)" }}
                >
                  {formatStatValue(c.value, calledStat ?? { unit_label: "", value_format: "number" })}
                </p>
                {c.is_winner && (
                  <p className="text-[6px] font-bold uppercase tracking-wider text-white mt-1">WIN ✓</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Result text */}
      <motion.div
        className="gboard-comparison-result"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: sorted.length * 0.1 + 0.35 }}
      >
        {result.was_tie ? (
          <p className="font-display text-grey-light tracking-wider" style={{ fontSize: "clamp(1rem, 3vw, 1.5rem)" }}>
            TIE — {totalPotAfter} IN POT
          </p>
        ) : result.winner_id ? (
          <p className="font-display text-white tracking-wider" style={{ fontSize: "clamp(1rem, 3vw, 1.5rem)" }}>
            {result.winner_id === myPlayerId ? "YOU WIN THIS ROUND!" : `${playerNames[result.winner_id] ?? "?"} WINS`}
          </p>
        ) : null}
        <p className="text-[8px] text-grey-dark uppercase tracking-wider mt-1">Tap anywhere to continue</p>
      </motion.div>

      {/* Auto-close progress bar */}
      <div className="gboard-comparison-progress">
        <motion.div
          className="gboard-comparison-progress-fill"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: autoCloseSecs, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
