"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CardInfo, RoundResult } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";

interface ComparisonAreaProps {
  result: RoundResult;
  statDefs: StatDefinition[];
  playerNames: Record<string, string>;
  allCards: Record<string, CardInfo>;
  potCount: number;
  myPlayerId: string | null;
  cardsWonCount?: number;
}

export function ComparisonArea({ result, statDefs, playerNames, allCards, potCount, myPlayerId, cardsWonCount }: ComparisonAreaProps) {
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
            const card = allCards[c.card_id];
            const imageUrl = card ? getCardImageUrl(card.image_url, card.image_storage_path) : null;
            const isWinner = c.is_winner;
            const isMe = c.player_id === myPlayerId;

            return (
              <motion.div
                key={c.player_id}
                initial={{ rotateY: -90, opacity: 0, scale: 0.85 }}
                animate={{ rotateY: 0, opacity: 1, scale: isWinner ? 1.05 : 1 }}
                transition={{ duration: 0.45, delay: result.cards.indexOf(c) * 0.12, ease: [0.34, 1.56, 0.64, 1] }}
                className={`border-2 border-black bg-white overflow-hidden flex-shrink-0`}
                style={{
                  width: 130,
                  boxShadow: isWinner ? "8px 8px 0 #0a0a0a" : "3px 3px 0 #0a0a0a",
                  perspective: 600,
                }}
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

        {/* Result banner */}
        <div className="mt-3 text-center">
          {result.was_tie ? (
            <p className="text-sm font-bold uppercase tracking-wider text-grey-dark">
              TIE — {potCount + result.cards.length} card{potCount + result.cards.length !== 1 ? "s" : ""} in pot
            </p>
          ) : result.winner_id ? (
            <div>
              <p className="text-sm font-bold uppercase tracking-wider">
                {result.winner_id === myPlayerId ? "YOU WIN THIS ROUND!" : `${playerNames[result.winner_id] ?? "?"} wins`}
              </p>
              {cardsWonCount != null && cardsWonCount > 0 && (
                <p className="text-[10px] text-grey-dark uppercase tracking-wider mt-0.5">
                  +{cardsWonCount} card{cardsWonCount !== 1 ? "s" : ""} collected
                  {potCount > 0 ? ` (incl. ${potCount} from pot)` : ""}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
