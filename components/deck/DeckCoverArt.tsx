"use client";

import { useState } from "react";
import { getDeckCoverUrl } from "@/lib/utils/imageUrl";

interface DeckCoverArtProps {
  slug: string;
  name: string;
  coverImageUrl?: string | null;
  className?: string;
}

// CSS pattern fallbacks — shown when no image is uploaded yet
const COVERS: Record<string, { bg: string; pattern: string; textColor: string; tag: string }> = {
  "ben-10": {
    bg: "#0a0a0a",
    pattern: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(245,245,240,0.07) 8px, rgba(245,245,240,0.07) 9px)`,
    textColor: "#f5f5f0",
    tag: "52 ALIENS",
  },
  "dragon-ball": {
    bg: "#e0e0da",
    pattern: `radial-gradient(circle at 50% 50%, #b0b0a8 1px, transparent 1px)`,
    textColor: "#0a0a0a",
    tag: "52 WARRIORS",
  },
  "power-rangers": {
    bg: "#f5f5f0",
    pattern: `repeating-linear-gradient(90deg, #0a0a0a 0, #0a0a0a 3px, transparent 3px, transparent 22px)`,
    textColor: "#0a0a0a",
    tag: "52 RANGERS",
  },
  "superheroes": {
    bg: "#4a4a44",
    pattern: `repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(245,245,240,0.1) 18px, rgba(245,245,240,0.1) 20px),
              repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(245,245,240,0.1) 18px, rgba(245,245,240,0.1) 20px)`,
    textColor: "#f5f5f0",
    tag: "52 HEROES",
  },
};

const DEFAULT_COVER = COVERS["superheroes"];

export function DeckCoverArt({ slug, name, coverImageUrl, className = "" }: DeckCoverArtProps) {
  const resolvedUrl = getDeckCoverUrl(coverImageUrl, slug);
  const [imgFailed, setImgFailed] = useState(false);

  const showImage = resolvedUrl && !imgFailed;
  const cover = COVERS[slug] ?? DEFAULT_COVER;

  if (showImage) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  // CSS pattern fallback
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden ${className}`}
      style={{
        backgroundColor: cover.bg,
        backgroundImage: cover.pattern,
        backgroundSize: slug === "dragon-ball" ? "16px 16px" : undefined,
      }}
    >
      <span
        style={{ color: cover.textColor, opacity: 0.25 }}
        className="absolute top-3 left-3 text-[10px] font-mono"
      >■</span>
      <span
        style={{ color: cover.textColor, opacity: 0.25 }}
        className="absolute top-3 right-3 text-[10px] font-mono"
      >■</span>

      <p
        className="font-display text-center leading-none px-4 select-none"
        style={{ color: cover.textColor, fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "0.06em", opacity: 0.9 }}
      >
        {name.toUpperCase()}
      </p>
      <p
        className="text-[10px] uppercase tracking-[0.3em] mt-3 font-bold select-none font-sans"
        style={{ color: cover.textColor, opacity: 0.45 }}
      >
        {cover.tag}
      </p>

      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: cover.textColor, opacity: 0.15 }} />
    </div>
  );
}
