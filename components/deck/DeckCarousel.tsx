"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { Deck } from "@/types";
import { DeckDetailsModal } from "./DeckDetailsModal";
import { DeckCoverArt } from "./DeckCoverArt";
import { RoomModal } from "@/components/room/RoomModal";

interface DeckCarouselProps {
  decks: Deck[];
}

// Smaller card size — fits inside the bordered panel alongside WHY FTC / HOW TO PLAY
const CARD_W = 210;
const CARD_H = 300;

export function DeckCarousel({ decks }: DeckCarouselProps) {
  const [detailDeck, setDetailDeck] = useState<Deck | null>(null);
  const [playDeck, setPlayDeck] = useState<Deck | null>(null);

  return (
    <>
      <div className="w-full overflow-x-auto pb-4 pt-2">
        <div
          className="flex gap-3 px-4 sm:px-6"
          style={{ width: "max-content", minWidth: "100%" }}
        >
          {decks.map((deck, i) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              index={i}
              onShowDetails={() => setDetailDeck(deck)}
              onPlay={() => setPlayDeck(deck)}
            />
          ))}
        </div>
      </div>

      {detailDeck && (
        <DeckDetailsModal deck={detailDeck} onClose={() => setDetailDeck(null)} />
      )}
      {playDeck && (
        <RoomModal deck={playDeck} onClose={() => setPlayDeck(null)} />
      )}
    </>
  );
}

function DeckCard({
  deck,
  index,
  onShowDetails,
  onPlay,
}: {
  deck: Deck;
  index: number;
  onShowDetails: () => void;
  onPlay: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ width: CARD_W, minWidth: CARD_W, flexShrink: 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, duration: 0.3, ease: "easeOut" }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        style={{ width: "100%" }}
      >
        <motion.div
          animate={
            hovered
              ? { y: -6, boxShadow: "6px 6px 0px #0a0a0a" }
              : { y: 0,  boxShadow: "3px 3px 0px #0a0a0a" }
          }
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="border-2 border-black bg-white overflow-hidden cursor-pointer select-none flex flex-col"
          style={{ width: "100%", height: CARD_H }}
        >
          {/* Cover — fills remaining space */}
          <div className="border-b-2 border-black flex-1 min-h-0">
            <DeckCoverArt
              slug={deck.slug}
              name={deck.name}
              coverImageUrl={deck.cover_image_url}
              className="w-full h-full"
            />
          </div>

          {/* Name strip */}
          <div className="bg-black px-3 py-1.5 border-b-2 border-black flex-shrink-0">
            <h3
              className="font-display text-white tracking-wider leading-tight truncate"
              style={{ fontSize: "1rem" }}
            >
              {deck.name.toUpperCase()}
            </h3>
          </div>

          {/* Meta */}
          <div className="px-3 py-1.5 flex items-center justify-between flex-shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-grey-dark">
              52 Cards · 8 Stats
            </span>
            <span className="text-[8px] font-mono text-grey-mid font-bold">
              #{String(index + 1).padStart(2, "0")}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-shrink-0" style={{ borderTop: "2px solid #0a0a0a" }}>
            <button
              onClick={(e) => { e.stopPropagation(); onShowDetails(); }}
              className="deck-btn-light flex-1 py-2 text-[9px] font-bold uppercase tracking-wider"
              style={{ borderRight: "1px solid #0a0a0a" }}
            >
              Details
            </button>
            <button
              className="deck-btn-dark flex-1 py-2 text-[9px] font-bold uppercase tracking-wider"
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
            >
              Play →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
