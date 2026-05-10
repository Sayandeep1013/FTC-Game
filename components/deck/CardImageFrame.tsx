"use client";

import { useState } from "react";

interface CardImageFrameProps {
  imageUrl: string | null;
  alt: string;
  fallbackText: string;
  className?: string;
}

export function CardImageFrame({ imageUrl, alt, fallbackText, className = "" }: CardImageFrameProps) {
  const [failed, setFailed] = useState(false);
  const showImage = imageUrl && !failed;

  if (!showImage) {
    return (
      <div className={`bg-grey-light flex items-center justify-center overflow-hidden ${className}`}>
        <span className="font-display text-grey-dark text-3xl select-none">{fallbackText[0]?.toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className={`relative bg-grey-light overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-35"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-white/35" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        className="relative z-10 w-full h-full object-contain p-2"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
