"use client";

import { motion } from "framer-motion";
import type { CardInfo } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { useRef } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";

const CARD_W = 170;
const CARD_H = 250;

interface TableCardProps {
  card: CardInfo;
  statDefs: StatDefinition[];
  /** Player is active — stats are clickable */
  isActive?: boolean;
  onPickStat?: (statId: string) => void;
  /** Stat to highlight (comparison phase) */
  highlightStatId?: string | null;
  /** If locked (non-caller tie), only this stat can be picked */
  lockedStatId?: string | null;
  /** Show card back (opponent's card before reveal) */
  faceDown?: boolean;
  /** Initial animation — card slides in from direction */
  enterFrom?: "top" | "bottom";
  label?: string;
}

export function TableCard({
  card, statDefs, isActive, onPickStat,
  highlightStatId, lockedStatId, faceDown = false,
  enterFrom = "bottom", label,
}: TableCardProps) {
  const imageUrl = getCardImageUrl(card.image_url, card.image_storage_path);
  const sorted = [...statDefs].sort((a, b) => a.display_order - b.display_order);
  const left = sorted.filter((_, i) => i % 2 === 0);
  const right = sorted.filter((_, i) => i % 2 === 1);

  // Tilt effect on active card
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 400, damping: 30 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-8, 8]), { stiffness: 400, damping: 30 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isActive || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width * 2 - 1);
    my.set((e.clientY - r.top) / r.height * 2 - 1);
  }
  function onMouseLeave() { mx.set(0); my.set(0); }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {label && (
        <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark">{label}</p>
      )}

      {/* Wrapper handles enter animation */}
      <motion.div
        initial={{ y: enterFrom === "bottom" ? 40 : -40, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ scale: 0.7, opacity: 0, transition: { duration: 0.25 } }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        style={{ width: CARD_W, height: CARD_H, perspective: 800 }}
      >
        {faceDown ? (
          // Face-down: card back only
          <div
            className="card-back-pattern border-2 border-black w-full h-full"
            style={{ boxShadow: "4px 4px 0 #0a0a0a" }}
          />
        ) : (
          // Face-up: full card
          <motion.div
            ref={cardRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className={`border-2 border-black bg-white overflow-hidden w-full h-full flex flex-col ${isActive ? "card-active" : ""}`}
            style={{
              boxShadow: isActive ? "6px 6px 0 #0a0a0a" : "4px 4px 0 #0a0a0a",
              rotateX: isActive ? rx : 0,
              rotateY: isActive ? ry : 0,
            }}
          >
            {/* Image */}
            <div className="border-b-2 border-black bg-grey-light flex items-center justify-center overflow-hidden flex-shrink-0" style={{ height: 80 }}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={card.name} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="font-display text-3xl text-grey-dark">{card.name[0]?.toUpperCase()}</span>
              )}
            </div>

            {/* Name */}
            <div className="bg-black px-2 py-1 border-b-2 border-black flex-shrink-0">
              <p className="font-display text-white leading-tight text-xs truncate">{card.name.toUpperCase()}</p>
            </div>

            {/* Stats — 2 columns, fills remaining space */}
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 border-r border-black flex flex-col">
                {left.map(stat => <StatRow key={stat.id} stat={stat} value={card.stats[stat.name]} isHighlighted={highlightStatId === stat.id} isLocked={!!(lockedStatId && lockedStatId !== stat.id)} isActive={!!isActive} onPick={onPickStat} />)}
              </div>
              <div className="flex-1 flex flex-col">
                {right.map(stat => <StatRow key={stat.id} stat={stat} value={card.stats[stat.name]} isHighlighted={highlightStatId === stat.id} isLocked={!!(lockedStatId && lockedStatId !== stat.id)} isActive={!!isActive} onPick={onPickStat} />)}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function StatRow({ stat, value, isHighlighted, isLocked, isActive, onPick }: {
  stat: StatDefinition; value: number | undefined;
  isHighlighted: boolean; isLocked: boolean; isActive: boolean;
  onPick?: (id: string) => void;
}) {
  const canClick = isActive && !!onPick && !isHighlighted && !isLocked;

  return (
    <div
      className={`stat-row flex-1 ${isHighlighted ? "selected" : ""} ${isLocked ? "opacity-30 cursor-not-allowed" : ""}`}
      style={{ cursor: canClick ? "pointer" : "default" }}
      onClick={() => canClick && onPick!(stat.id)}
    >
      <span className="stat-label">{stat.display_name}</span>
      <span className="stat-value font-mono">{value ?? "—"}</span>
    </div>
  );
}

export { CARD_W as TABLE_CARD_W, CARD_H as TABLE_CARD_H };
