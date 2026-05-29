"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { CardInfo } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { formatStatValue } from "@/lib/utils/statFormat";
import { TimerCircle } from "./TimerCircle";

interface DeckBrowserModalProps {
  allCards: Record<string, CardInfo>;
  statDefs: StatDefinition[];
  onClose: () => void;
  /** Timer props — timer lives here when modal is open */
  isMyTurn: boolean;
  countDown: boolean;
  timerInitialRemaining: number;
  timerDuration: number;
  timerTurnKey: number;
  onTimerExpire: () => void;
}

export function DeckBrowserModal({
  allCards, statDefs, onClose,
  isMyTurn, countDown, timerInitialRemaining, timerDuration, timerTurnKey, onTimerExpire,
}: DeckBrowserModalProps) {
  const cards = Object.values(allCards).sort((a, b) => a.name.localeCompare(b.name));
  const sortedStats = [...statDefs].sort((a, b) => a.display_order - b.display_order);

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ alignItems: "flex-start", paddingTop: "5vh" }} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="panel-brutal w-full flex flex-col"
          style={{ maxHeight: "90vh", width: "min(96vw, 1100px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-black border-b-2 border-black flex-shrink-0 gap-4">
            <div>
              <h2 className="font-display text-white tracking-wider" style={{ fontSize: "1.4rem" }}>
                ALL CARDS
              </h2>
              <p className="text-grey-mid text-[9px] uppercase tracking-wider">
                {cards.length} cards in deck
              </p>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Timer badge — only shown when it's the player's turn */}
              {isMyTurn && countDown && (
                <div
                  className="flex items-center gap-2.5 border-2 border-white px-3 py-1.5"
                  style={{ animation: "pulse-border 1s ease-in-out infinite" }}
                >
                  <TimerCircle
                    durationSeconds={timerDuration}
                    initialRemaining={timerInitialRemaining}
                    countDown={countDown}
                    isActiveTurn={isMyTurn}
                    onExpire={onTimerExpire}
                    turnKey={timerTurnKey}
                    size={34}
                  />
                  <div className="flex flex-col">
                    <p className="font-display text-white tracking-widest leading-tight" style={{ fontSize: "0.85rem" }}>
                      YOUR TURN
                    </p>
                    <p className="text-grey-mid text-[7px] uppercase tracking-wider">Pick a stat ↓</p>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-9 h-9 border-2 border-white text-white flex items-center justify-center font-bold text-base flex-shrink-0"
                style={{ transition: "background 80ms, color 80ms" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.color = "black"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable card grid */}
          <div className="overflow-y-auto scrollbar-brutal p-4 flex-1">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))" }}
            >
              {cards.map(card => (
                <BrowserMiniCard key={card.id} card={card} stats={sortedStats} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function BrowserMiniCard({ card, stats }: { card: CardInfo; stats: StatDefinition[] }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = getCardImageUrl(card.image_url, card.image_storage_path);
  const showImage = imageUrl && !imgFailed;

  return (
    <div className="border-2 border-black bg-white overflow-hidden" style={{ boxShadow: "3px 3px 0 #0a0a0a" }}>
      {/* Image */}
      <div
        className="w-full border-b-2 border-black bg-grey-light flex items-center justify-center overflow-hidden"
        style={{ height: 100 }}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={card.name}
            className="w-full h-full object-contain p-1"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="font-display text-grey-dark text-3xl select-none">
            {card.name[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="bg-black px-3 py-1 border-b border-black">
        <p className="font-display text-white leading-tight truncate" style={{ fontSize: "0.8rem" }}>
          {card.name.toUpperCase()}
        </p>
      </div>

      {/* Stats — 2 columns */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {stats.map((stat, i) => (
          <div
            key={stat.id}
            className="flex flex-col px-2 py-1"
            style={{
              borderRight: i % 2 === 0 ? "1px solid #e0e0da" : undefined,
              borderBottom: i < stats.length - 2 ? "1px solid #e0e0da" : undefined,
            }}
          >
            <span className="text-[7px] font-bold uppercase tracking-wider text-grey-dark">
              {stat.display_name}
            </span>
            <span className="font-mono text-xs font-bold text-black leading-tight mt-0.5">
              {formatStatValue(card.stats[stat.name], stat)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
