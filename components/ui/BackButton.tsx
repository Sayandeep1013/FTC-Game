"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        // If there's history, go back; otherwise go to fallback
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className="text-xs uppercase tracking-wider text-grey-dark hover:text-black transition-colors font-bold"
    >
      ← Back to game
    </button>
  );
}
