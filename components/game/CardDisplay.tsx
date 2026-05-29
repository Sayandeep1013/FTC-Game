"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { PlayerHandInfo } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { formatStatValue } from "@/lib/utils/statFormat";
import { useRef } from "react";

interface CardDisplayProps {
  hand: PlayerHandInfo;
  statDefs: StatDefinition[];
  isActive: boolean;         // it's this player's turn
  selectedStatId?: string;   // stat already chosen (during comparing phase)
  onPickStat?: (statId: string) => void;
  tiedStatId?: string | null; // locked stat for non-caller tie
  compact?: boolean;
}

export function CardDisplay({ hand, statDefs, isActive, selectedStatId, onPickStat, tiedStatId, compact = false }: CardDisplayProps) {
  const card = hand.top_card;

  // Balatro-style 3D tilt on mouse move (active card only)
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-10, 10]), { stiffness: 300, damping: 30 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isActive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 2 - 1;
    const y = (e.clientY - rect.top) / rect.height * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  if (!card) {
    return (
      <div
        className="border-2 border-dashed border-grey-mid bg-grey-light flex items-center justify-center"
        style={{ width: compact ? 160 : 220, height: compact ? 240 : 320 }}
      >
        <p className="text-xs text-grey-mid uppercase tracking-wider font-bold">No cards</p>
      </div>
    );
  }

  const imageUrl = getCardImageUrl(card.image_url, card.image_storage_path);
  const cardW = compact ? 160 : 220;
  const cardH = compact ? 240 : 320;
  const imgH = Math.round(cardH * 0.38);

  const sortedStats = [...statDefs].sort((a, b) => a.display_order - b.display_order);
  const leftStats = sortedStats.filter((_, i) => i % 2 === 0);
  const rightStats = sortedStats.filter((_, i) => i % 2 === 1);

  function renderStatPair(defs: StatDefinition[]) {
    return defs.map(stat => {
      const val = card!.stats[stat.name];
      const isSelected = selectedStatId === stat.id;
      const isLocked = !!(tiedStatId && tiedStatId !== stat.id);
      const canSelect = isActive && onPickStat && !selectedStatId && !isLocked;

      return (
        <div
          key={stat.id}
          className={`stat-row ${isSelected ? "selected" : ""} ${canSelect ? "cursor-pointer" : "cursor-default"} ${isLocked ? "opacity-30" : ""}`}
          onClick={() => canSelect && onPickStat(stat.id)}
          style={{ opacity: isLocked ? 0.3 : 1 }}
        >
          <span className="stat-label">{stat.display_name}</span>
          <span className="stat-value font-mono">{formatStatValue(val, stat)}</span>
        </div>
      );
    });
  }

  return (
    <motion.div
      ref={cardRef}
      className={`border-2 border-black bg-white overflow-hidden select-none ${isActive ? "card-active" : ""}`}
      style={{
        width: cardW, height: cardH,
        boxShadow: isActive ? "6px 6px 0px #0a0a0a" : "4px 4px 0px #0a0a0a",
        perspective: 800,
        rotateX: isActive ? rotateX : 0,
        rotateY: isActive ? rotateY : 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={isActive ? { scale: [1, 1.015, 1] } : { scale: 1 }}
      transition={{ repeat: isActive ? Infinity : 0, duration: 2.5, ease: "easeInOut" }}
    >
      {/* Image */}
      <div className="border-b-2 border-black bg-grey-light flex items-center justify-center overflow-hidden" style={{ height: imgH }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={card.name} className="w-full h-full object-contain p-1" />
        ) : (
          <span className="font-display text-grey-dark" style={{ fontSize: compact ? "2rem" : "3rem" }}>
            {card.name[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="bg-black px-2 py-1 border-b-2 border-black">
        <p className="font-display text-white tracking-wide leading-tight truncate" style={{ fontSize: compact ? "0.8rem" : "1rem" }}>
          {card.name.toUpperCase()}
        </p>
      </div>

      {/* Stats — 2 columns */}
      <div className="flex flex-1" style={{ height: cardH - imgH - (compact ? 28 : 36) }}>
        <div className="flex-1 border-r border-black overflow-hidden">{renderStatPair(leftStats)}</div>
        <div className="flex-1 overflow-hidden">{renderStatPair(rightStats)}</div>
      </div>
    </motion.div>
  );
}

// Face-down card back
export function CardBack({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="card-back-pattern border-2 border-black"
        style={{ width: 120, height: 168, boxShadow: "3px 3px 0px #0a0a0a" }}
      />
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[120px]">{label}</p>
        <p className="font-mono text-xs text-grey-dark">{count} cards</p>
      </div>
    </div>
  );
}
