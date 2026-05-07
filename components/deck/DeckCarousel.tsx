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

const CARD_W = 310;
const CARD_H = 430;

export function DeckCarousel({ decks }: DeckCarouselProps) {
  const [detailDeck, setDetailDeck] = useState<Deck | null>(null);
  const [playDeck, setPlayDeck] = useState<Deck | null>(null);

  return (
    <>
      {/*
        pt-3 gives breathing room for the 8px hover-lift so the top border
        doesn't get clipped. overflow-x auto implicitly sets overflow-y auto,
        so we need that padding instead of overflow-y: visible.
      */}
      <div className="w-full overflow-x-auto pb-6 pt-3">
        <div
          className="flex gap-4 sm:gap-5 px-4 sm:px-8"
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
    // Plain div owns all layout — Framer Motion never touches width
    <div style={{ width: CARD_W, minWidth: CARD_W, flexShrink: 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.09, duration: 0.35, ease: "easeOut" }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        style={{ position: "relative", width: "100%" }}
      >
        {/* Card shell — lift + shadow on hover */}
        <motion.div
          animate={
            hovered
              ? { y: -8, boxShadow: "8px 8px 0px #0a0a0a" }
              : { y: 0,  boxShadow: "4px 4px 0px #0a0a0a" }
          }
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="border-2 border-black bg-white overflow-hidden cursor-pointer select-none"
          style={{ width: "100%", height: CARD_H }}
        >
          {/* Cover art — top 60% */}
          <div className="border-b-2 border-black" style={{ height: Math.round(CARD_H * 0.60) }}>
            <DeckCoverArt
              slug={deck.slug}
              name={deck.name}
              coverImageUrl={deck.cover_image_url}
              className="w-full h-full"
            />
          </div>

          {/* Deck name strip */}
          <div className="bg-black px-4 py-2 border-b-2 border-black">
            <h3
              className="font-display text-white tracking-wider leading-tight"
              style={{ fontSize: "1.4rem" }}
            >
              {deck.name.toUpperCase()}
            </h3>
          </div>

          {/* Meta row */}
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-grey-dark">
              52 Cards · 8 Stats
            </span>
            <span className="text-[10px] font-mono text-grey-mid font-bold">
              #{String(index + 1).padStart(2, "0")}
            </span>
          </div>

          {/* Hover action buttons */}
          <motion.div
            animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-0 left-0 right-0 flex"
            style={{ borderTop: "2px solid #0a0a0a" }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onShowDetails(); }}
              className="deck-btn-light flex-1 py-3 text-[11px] font-bold uppercase tracking-wider"
              style={{ borderRight: "1px solid #0a0a0a" }}
            >
              Details
            </button>
            <button
              className="deck-btn-dark flex-1 py-3 text-[11px] font-bold uppercase tracking-wider"
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
            >
              Play →
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
