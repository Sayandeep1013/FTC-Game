interface DeckPileProps {
  count: number;
  label: string;
  width?: number;
  height?: number;
}

export function DeckPile({ count, label, width = 52, height = 72 }: DeckPileProps) {
  const layers = Math.min(count, 3);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width, height }}>
        {/* Stacked shadows for depth */}
        {layers >= 3 && (
          <div
            className="card-back-pattern border-2 border-black absolute"
            style={{ width, height, bottom: 6, left: 4, opacity: 0.4 }}
          />
        )}
        {layers >= 2 && (
          <div
            className="card-back-pattern border-2 border-black absolute"
            style={{ width, height, bottom: 3, left: 2, opacity: 0.65 }}
          />
        )}
        {/* Top card */}
        {count > 0 ? (
          <div
            className="card-back-pattern border-2 border-black absolute"
            style={{ width, height, bottom: 0, left: 0 }}
          />
        ) : (
          <div
            className="border-2 border-dashed border-grey-mid bg-grey-light absolute flex items-center justify-center"
            style={{ width, height, bottom: 0, left: 0 }}
          >
            <span className="text-[9px] text-grey-mid">0</span>
          </div>
        )}
      </div>
      <div className="text-center" style={{ width: width + 8 }}>
        <p className="text-[8px] font-bold uppercase tracking-wider text-grey-dark leading-tight">{label}</p>
        <p className="font-mono text-[11px] font-bold">{count}</p>
      </div>
    </div>
  );
}
