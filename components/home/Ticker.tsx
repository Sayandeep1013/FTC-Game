"use client";

interface TickerItem {
  deckName: string;
  cards: string[];
}

export function Ticker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;

  // Build the ticker string as React elements for styling
  // Pattern: ◆ DECK NAME ◆  card · card · card · card  (repeat)
  const segments = items.flatMap((item, di) => [
    <span key={`deck-${di}`} className="inline-flex items-center gap-3 mx-2">
      <span className="font-display tracking-[0.2em] text-white" style={{ fontSize: "0.75rem" }}>
        {item.deckName.toUpperCase()}
      </span>
    </span>,
    <span key={`sep-${di}`} className="text-grey-dark mx-1 select-none">◆</span>,
    ...item.cards.map((card, ci) => (
      <span key={`card-${di}-${ci}`} className="inline-flex items-center gap-2 mx-0.5">
        <span className="font-mono text-grey-mid" style={{ fontSize: "0.68rem" }}>{card}</span>
        {ci < item.cards.length - 1 && (
          <span className="text-grey-dark select-none" style={{ fontSize: "0.55rem" }}>·</span>
        )}
      </span>
    )),
    <span key={`gap-${di}`} className="mx-5 text-grey-dark select-none">—</span>,
  ]);

  return (
    <div
      className="overflow-hidden bg-black border-b-2 border-black"
      style={{ height: 34 }}
      aria-hidden="true"
    >
      {/* Two identical copies side by side — when first scrolls off, second seamlessly takes over */}
      <div
        className="flex items-center whitespace-nowrap w-max"
        style={{ animation: "ticker-scroll 40s linear infinite" }}
      >
        <span className="flex items-center">{segments}</span>
        <span className="flex items-center">{segments}</span>
      </div>
    </div>
  );
}
