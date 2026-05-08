const STEPS = [
  {
    n: "01",
    title: "PICK A DECK",
    detail: [
      "Browse the available decks from the home page or the Decks tab.",
      "Each deck has a theme — superheroes, cars, wrestlers, anime — and 52 unique cards.",
      "Every card has 8 stats. Higher (or lower, for inverse stats like Rank) wins the round.",
    ],
  },
  {
    n: "02",
    title: "BUILD YOUR ROOM",
    detail: [
      "Create a private room — you get a shareable room code.",
      "Invite friends to join using the code, or hit 'Add CPU' to fill empty seats with AI opponents.",
      "Rooms support 2 to 4 players. The host starts the game when everyone is ready.",
    ],
  },
  {
    n: "03",
    title: "CALL YOUR STAT",
    detail: [
      "Each turn, the active player's top card is revealed face-up. All other cards stay face-down.",
      "You have 15 seconds to pick a stat you think will beat everyone else's hidden card.",
      "All cards flip — highest value on that stat wins the round and claims the pot.",
    ],
  },
  {
    n: "04",
    title: "WIN THE PILE",
    detail: [
      "Won cards go to your side deck. Ties send all cards to a growing pot — next winner takes all.",
      "If your main deck runs out, your side deck reshuffles and becomes your new main deck.",
      "A player is eliminated when they run out of cards completely. Last one standing wins.",
    ],
  },
];

export default function HowToPlayPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {/* Header */}
        <div className="border-b-2 border-black pb-6 mb-12">
          <p className="text-[9px] uppercase tracking-[0.3em] text-grey-dark font-bold mb-1">The rules</p>
          <h1
            className="font-display text-black leading-none"
            style={{ fontSize: "clamp(2rem, 7vw, 4rem)", letterSpacing: "0.04em" }}
          >
            HOW TO PLAY
          </h1>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="hidden md:block absolute top-3 bottom-3 bg-black"
            style={{ left: "1.75rem", width: 2 }}
          />

          <div className="flex flex-col gap-12">
            {STEPS.map((step) => (
              <div key={step.n} className="md:pl-16 relative">
                {/* Dot */}
                <div
                  className="hidden md:block absolute bg-black border-2 border-black rounded-full"
                  style={{ width: 14, height: 14, left: "1.1875rem", top: "0.85rem" }}
                />

                <div className="flex items-start gap-6">
                  <span
                    className="font-display text-grey-light leading-none flex-shrink-0 select-none"
                    style={{ fontSize: "clamp(3rem, 8vw, 5rem)", letterSpacing: "0.04em" }}
                  >
                    {step.n}
                  </span>
                  <div className="pt-1 flex-1">
                    <h2 className="font-display tracking-widest mb-4" style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)" }}>
                      {step.title}
                    </h2>
                    <ul className="space-y-2">
                      {step.detail.map((line, i) => (
                        <li key={i} className="flex gap-3 text-sm text-grey-dark leading-relaxed">
                          <span className="font-mono font-bold text-black flex-shrink-0 mt-0.5">—</span>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Divider (not on last) */}
                {step.n !== "04" && <div className="mt-10 border-b border-grey-light md:ml-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 border-2 border-black p-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
          <p className="font-display tracking-widest text-xl">READY TO PLAY?</p>
          <a href="/play" className="btn-brutal btn-primary px-6 py-3">
            Start a Game →
          </a>
        </div>
      </div>
    </main>
  );
}
