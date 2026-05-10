"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DeckCoverArt } from "./DeckCoverArt";
import type { Universe } from "@/types";

interface UniverseCarouselProps {
  universes: Universe[];
}

const CARD_W = 260;
const CARD_H = 340;

export function UniverseCarousel({ universes }: UniverseCarouselProps) {
  return (
    <div className="w-full overflow-x-auto pb-4 pt-2">
      <div className="flex gap-3 px-4 sm:px-6" style={{ width: "max-content", minWidth: "100%" }}>
        {universes.map((universe, index) => (
          <UniverseCard key={universe.id} universe={universe} index={index} />
        ))}
      </div>
    </div>
  );
}

function UniverseCard({ universe, index }: { universe: Universe; index: number }) {
  const decks = universe.decks ?? [];

  return (
    <div style={{ width: CARD_W, minWidth: CARD_W, flexShrink: 0 }}>
      <motion.div
        className="universe-card border-2 border-black bg-white overflow-hidden select-none flex flex-col"
        style={{ width: "100%", height: CARD_H, boxShadow: "3px 3px 0px #0a0a0a" }}
        initial={{ y: 18, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.42, delay: Math.min(index * 0.05, 0.2), ease: [0.22, 1, 0.36, 1] }}
        whileHover={{
          y: -8,
          boxShadow: "7px 7px 0px #0a0a0a",
        }}
      >
        <div className="border-b-2 border-black flex-1 min-h-0">
          <DeckCoverArt slug={universe.slug} name={universe.name} coverImageUrl={universe.cover_image_url} className="w-full h-full" />
        </div>

        <div className="bg-black px-3 py-2 border-b-2 border-black flex-shrink-0">
          <h3 className="font-display text-white tracking-wider leading-tight truncate" style={{ fontSize: "1.15rem" }}>
            {universe.name.toUpperCase()}
          </h3>
        </div>

        <div className="px-3 py-2 flex-shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark">
            {decks.length} deck{decks.length === 1 ? "" : "s"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {decks.slice(0, 3).map((deck) => (
              <span key={deck.id} className="border border-black px-1.5 py-0.5 text-[8px] uppercase tracking-wider">
                {deck.name}
              </span>
            ))}
            {decks.length > 3 && (
              <span className="border border-grey-mid px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-grey-dark">
                +{decks.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0" style={{ borderTop: "2px solid #0a0a0a" }}>
          <Link
            href={`/decks?universe=${universe.slug}`}
            className="deck-btn-light flex-1 py-2 text-center text-[9px] font-bold uppercase tracking-wider"
            style={{ borderRight: "1px solid #0a0a0a" }}
          >
            Browse
          </Link>
          <Link
            href={`/universes/${universe.slug}`}
            className="deck-btn-dark flex-1 py-2 text-center text-[9px] font-bold uppercase tracking-wider"
          >
            Open
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
