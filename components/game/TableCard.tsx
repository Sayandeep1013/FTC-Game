"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { CardInfo } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { useEffect, useRef, useState } from "react";

// Fixed card dimensions — never stretched
export const CARD_W = 190;
export const CARD_H = 280;

interface TableCardProps {
  card: CardInfo;
  statDefs: StatDefinition[];
  isActive?: boolean;
  onPickStat?: (statId: string) => void;
  highlightStatId?: string | null;
  lockedStatId?: string | null;
  faceDown?: boolean;
  label?: string;
  enterFrom?: "top" | "bottom" | "none";
}

export function TableCard({
  card, statDefs, isActive, onPickStat,
  highlightStatId, lockedStatId,
  faceDown = false, label, enterFrom = "none",
}: TableCardProps) {
  const [flipped, setFlipped] = useState(faceDown);
  useEffect(() => { setFlipped(faceDown); }, [faceDown]);

  const imageUrl = getCardImageUrl(card.image_url, card.image_storage_path);

  // Sort and split stats into 2 columns (4 left + 4 right)
  const sorted = [...statDefs].sort((a, b) => a.display_order - b.display_order);
  const leftStats  = sorted.filter((_, i) => i % 2 === 0); // rank, stamina, weight, iq
  const rightStats = sorted.filter((_, i) => i % 2 === 1); // strength, height, psychic, speed

  // Balatro-style tilt on active card
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

  const enterY = enterFrom === "top" ? -32 : enterFrom === "bottom" ? 32 : 0;

  return (
    <div className="flex flex-col items-center gap-1" style={{ flexShrink: 0 }}>
      {label && (
        <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark">{label}</p>
      )}

      <motion.div
        initial={{ y: enterFrom !== "none" ? enterY : 0, opacity: enterFrom !== "none" ? 0 : 1 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ scale: 0.75, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        style={{ width: CARD_W, height: CARD_H, perspective: 900, flexShrink: 0 }}
      >
        {/* 3D flip container */}
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          initial={{ rotateY: faceDown ? 180 : 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d", width: "100%", height: "100%", position: "relative" }}
        >
          {/* ── FRONT — card face ── */}
          <motion.div
            ref={cardRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
              backfaceVisibility: "hidden",
              width: "100%", height: "100%",
              rotateX: isActive ? rx : 0,
              rotateY: isActive ? ry : 0,
              boxShadow: isActive ? "6px 6px 0px #0a0a0a" : "4px 4px 0px #0a0a0a",
            }}
            className={`border-2 border-black bg-white flex flex-col overflow-hidden ${isActive ? "card-active" : ""}`}
          >
            {/* Image */}
            <div
              className="border-b-2 border-black bg-grey-light flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ height: Math.round(CARD_H * 0.27) }}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={card.name} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="font-display text-grey-dark text-3xl select-none">
                  {card.name[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Name strip */}
            <div className="bg-black px-2 py-1 border-b-2 border-black flex-shrink-0">
              <p className="font-display text-white leading-tight truncate text-xs">
                {card.name.toUpperCase()}
              </p>
            </div>

            {/* Stats — 4 left + 4 right, same layout as details modal */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 border-r border-black flex flex-col min-h-0 overflow-hidden">
                {leftStats.map(stat => (
                  <StatRow
                    key={stat.id}
                    stat={stat}
                    value={card.stats[stat.name]}
                    isHighlighted={highlightStatId === stat.id}
                    isLocked={!!(lockedStatId && lockedStatId !== stat.id)}
                    isActive={!!isActive}
                    onPick={onPickStat}
                  />
                ))}
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {rightStats.map(stat => (
                  <StatRow
                    key={stat.id}
                    stat={stat}
                    value={card.stats[stat.name]}
                    isHighlighted={highlightStatId === stat.id}
                    isLocked={!!(lockedStatId && lockedStatId !== stat.id)}
                    isActive={!!isActive}
                    onPick={onPickStat}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── BACK — diagonal stripe pattern ── */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              position: "absolute", inset: 0,
              boxShadow: "4px 4px 0px #0a0a0a",
            }}
            className="card-back-pattern border-2 border-black"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function StatRow({ stat, value, isHighlighted, isLocked, isActive, onPick }: {
  stat: StatDefinition; value: number | undefined;
  isHighlighted: boolean; isLocked: boolean; isActive: boolean;
  onPick?: (id: string) => void;
}) {
  const [clicked, setClicked] = useState(false);
  const canClick = isActive && !!onPick && !isHighlighted && !isLocked;

  return (
    <motion.div
      className={`stat-row flex-1 min-h-0 ${isHighlighted ? "selected" : ""} ${isLocked ? "opacity-25" : ""}`}
      style={{ cursor: canClick ? "pointer" : "default", padding: "0 6px" }}
      onClick={() => {
        if (!canClick) return;
        setClicked(true);
        setTimeout(() => setClicked(false), 220);
        onPick!(stat.id);
      }}
      animate={clicked ? { scale: [1, 0.93, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.22 }}
      whileHover={canClick ? { backgroundColor: "#0a0a0a", color: "#f5f5f0" } : {}}
    >
      <span
        className="stat-label truncate"
        style={{ fontSize: "0.55rem", letterSpacing: "0.05em" }}
      >
        {stat.display_name}
      </span>
      <span
        className="font-mono font-bold flex-shrink-0"
        style={{ fontSize: "0.7rem" }}
      >
        {value ?? "—"}
      </span>
    </motion.div>
  );
}
