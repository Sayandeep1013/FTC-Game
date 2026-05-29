"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Card, Deck, StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { formatStatValue } from "@/lib/utils/statFormat";

interface DeckDetailsModalProps {
  deck: Deck;
  onClose: () => void;
}

export function DeckDetailsModal({ deck, onClose }: DeckDetailsModalProps) {
  const stats = deck.stat_definitions?.sort((a, b) => a.display_order - b.display_order) ?? [];
  const rankStat = stats.find((s) => s.name.toLowerCase() === "rank") ?? stats[0];
  const cards = [...(deck.cards ?? [])].sort((a, b) => {
    const av = a.card_stats?.find((cs) => cs.stat_definition_id === rankStat?.id)?.value ?? Number.POSITIVE_INFINITY;
    const bv = b.card_stats?.find((cs) => cs.stat_definition_id === rankStat?.id)?.value ?? Number.POSITIVE_INFINITY;
    return Number(av) - Number(bv) || a.name.localeCompare(b.name);
  });

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="panel-brutal w-full max-w-5xl flex flex-col"
          style={{ maxHeight: "90vh", width: "min(95vw, 1100px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-black border-b-2 border-black flex-shrink-0">
            <div>
              <h2 className="font-display text-white tracking-wider" style={{ fontSize: "1.8rem" }}>
                {deck.name.toUpperCase()}
              </h2>
              <p className="text-grey-mid text-xs uppercase tracking-wider">
                {cards.length} Cards · {stats.length} Stats each
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 border-2 border-white text-white flex items-center justify-center font-bold text-base hover:bg-white hover:text-black transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Scrollable card grid */}
          <div className="overflow-y-auto scrollbar-brutal p-5 flex-1">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
            >
              {cards.map((card) => (
                <MiniCard key={card.id} card={card} stats={stats} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function MiniCard({ card, stats }: { card: Card; stats: StatDefinition[] }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = getCardImageUrl(card.image_url, card.image_storage_path);
  const showImage = imageUrl && !imgFailed;

  // Build stat values map: stat name → value
  const statValues: Record<string, number> = {};
  card.card_stats?.forEach((cs) => {
    const def = stats.find((s) => s.id === cs.stat_definition_id);
    if (def) statValues[def.name] = cs.value;
  });

  return (
    <div
      className="border-2 border-black bg-white overflow-hidden"
      style={{ boxShadow: "3px 3px 0px #0a0a0a" }}
    >
      {/* Image area */}
      <div
        className="w-full border-b-2 border-black bg-grey-light flex items-center justify-center overflow-hidden"
        style={{ height: 140 }}
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
            {card.name[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Card name */}
      <div className="bg-black px-3 py-1.5 border-b border-black">
        <p className="font-display text-white leading-tight" style={{ fontSize: "0.95rem" }}>
          {card.name}
        </p>
      </div>

      {/* Stats — two columns */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {stats.map((stat, i) => (
          <div
            key={stat.id}
            className="flex flex-col px-2.5 py-1.5"
            style={{
              borderRight: i % 2 === 0 ? "1px solid #e0e0da" : undefined,
              borderBottom: i < stats.length - 2 ? "1px solid #e0e0da" : undefined,
            }}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-grey-dark">
              {stat.display_name}
            </span>
            <span className="font-mono text-sm font-bold text-black leading-tight mt-0.5">
              {formatStatValue(statValues[stat.name], stat)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
