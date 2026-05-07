"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { RoundResult } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";

interface ComparisonAreaProps {
  result: RoundResult;
  statDefs: StatDefinition[];
  playerNames: Record<string, string>;  // player_id → room_username
  cardData: Record<string, { name: string; image_url: string | null; image_storage_path: string | null }>; // card_id → card
  potCount: number;
  myPlayerId: string | null;
}

export function ComparisonArea({ result, statDefs, playerNames, cardData, potCount, myPlayerId }: ComparisonAreaProps) {
  const calledStat = statDefs.find(s => s.id === result.stat_id);

  return (
    <AnimatePresence>
      <motion.div
        key={result.stat_id + (result.winner_id ?? "tie")}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {/* Stat called banner */}
        <div className="bg-black text-white text-center py-2 border-2 border-black mb-3" style={{ boxShadow: "3px 3px 0 #4a4a44" }}>
          <p className="text-[10px] uppercase tracking-[0.3em] text-grey-mid">Stat Called</p>
          <p className="font-display text-2xl tracking-wider">{calledStat?.display_name ?? "—"}</p>
        </div>

        {/* Cards row */}
        <div className="flex gap-3 flex-wrap justify-center">
          {result.cards.map(c => {
            const card = cardData[c.card_id];
            const imageUrl = card ? getCardImageUrl(card.image_url, card.image_storage_path) : null;
            const isWinner = c.is_winner;
            const isMe = c.player_id === myPlayerId;

            return (
              <motion.div
                key={c.player_id}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={`border-2 border-black bg-white overflow-hidden flex-shrink-0 ${isWinner ? "ring-4 ring-black" : ""}`}
                style={{ width: 130, boxShadow: isWinner ? "6px 6px 0 #0a0a0a" : "3px 3px 0 #0a0a0a" }}
              >
                {/* Mini image */}
                <div className="bg-grey-light border-b-2 border-black flex items-center justify-center overflow-hidden" style={{ height: 70 }}>
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={card?.name ?? ""} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="font-display text-2xl text-grey-dark">{card?.name?.[0] ?? "?"}</span>
                  )}
                </div>
                <div className="bg-black px-2 py-1 border-b border-black">
                  <p className="font-display text-white text-xs truncate">{card?.name ?? "?"}</p>
                </div>
                <div className="px-2 py-2 text-center">
                  <p className="text-[9px] text-grey-dark uppercase tracking-wider">{playerNames[c.player_id] ?? "?"}{isMe ? " (you)" : ""}</p>
                  {/* The called stat value — big */}
                  <p className={`font-mono font-bold mt-1 ${isWinner ? "text-xl" : "text-base"}`}>{c.value}</p>
                  {isWinner && (
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-1">WIN ✓</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tie / winner banner */}
        <div className="mt-3 text-center">
          {result.was_tie ? (
            <p className="text-sm font-bold uppercase tracking-wider text-grey-dark">
              TIE — {potCount} card{potCount !== 1 ? "s" : ""} in pot
            </p>
          ) : result.winner_id ? (
            <p className="text-sm font-bold uppercase tracking-wider">
              {result.winner_id === myPlayerId
                ? "YOU WIN THIS ROUND!"
                : `${playerNames[result.winner_id] ?? "?"} wins the round`}
            </p>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
