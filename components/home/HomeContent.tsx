"use client";

import { useEffect, useRef } from "react";
import { DeckCarousel } from "@/components/deck/DeckCarousel";
import { Ticker } from "./Ticker";
import type { Deck } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL SPEED CONTROL
//
// These two values control when the snake line starts and finishes drawing
// relative to the snake-container and the viewport.
//
//   Format:  "<element-edge> <viewport-%>"
//   "top top"       = element's top edge hits the viewport's top edge
//   "top center"    = element's top edge hits the viewport's centre
//   "bottom bottom" = element's bottom edge hits the viewport's bottom
//   "bottom 80%"    = element's bottom edge hits 80% from the top of viewport
//
// To draw FASTER  → bring start/end closer together, e.g. "top 20%" / "bottom 80%"
// To draw SLOWER  → spread them out, e.g. "top top" / "bottom bottom"  (current)
// To start LATER  → change SNAKE_START to "top 30%" or "top center"
//
const SNAKE_START = "top top";      // ← adjust here
const SNAKE_END   = "bottom bottom"; // ← adjust here
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: "01", title: "PICK A DECK", body: "Choose a universe — superheroes, cars, wrestlers, anime. Every deck has 52 cards and 8 battle stats." },
  { n: "02", title: "BUILD YOUR ROOM", body: "Create a private room and invite friends, or drop in CPU opponents to fill the seats. 2–4 players." },
  { n: "03", title: "CALL YOUR STAT", body: "On your turn, pick the stat you think beats everyone else's top card. Highest value wins the pile." },
  { n: "04", title: "WIN THE PILE", body: "Collect cards from every round you win. Last player standing takes it all." },
];

const FEATURES = [
  { tag: "GAMEPLAY", title: "STRATEGY OVER LUCK", body: "No dice. No random draws. You pick the stat every round — reading your opponents is everything." },
  { tag: "MULTIPLAYER", title: "REAL-TIME BATTLES", body: "2–4 players in a live room. Moves sync instantly. CPU opponents fill any empty seat." },
  { tag: "DECKS", title: "MULTIPLE UNIVERSES", body: "Ben 10, Marvel, WWE, Dragon Ball, Harry Potter and more. Each deck is a different battle arena." },
];

interface HomeContentProps {
  decks: Deck[];
  deckCount: number;
  cardCount: number;
}

export function HomeContent({ decks, deckCount, cardCount }: HomeContentProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const path = document.querySelector<SVGPathElement>(".snake-path");
        const container = document.querySelector<HTMLElement>(".snake-container");
        const ballEl = document.querySelector<HTMLElement>(".snake-ball");

        if (path && container) {
          const len = path.getTotalLength();
          path.style.strokeDasharray = String(len);
          path.style.strokeDashoffset = String(len);

          // The SVG viewBox is "0 0 100 100" with preserveAspectRatio="none".
          // getPointAtLength() returns coords in viewBox space (0–100).
          // Converting to percentage positions maps perfectly to the container
          // because the SVG stretches linearly to fill it.
          function moveBall(drawnLen: number) {
            if (!ballEl) return;
            const clamped = Math.max(0, Math.min(drawnLen, len));
            const pt = path!.getPointAtLength(clamped);
            // pt.x and pt.y are 0–100 in the viewBox → use directly as CSS %
            ballEl.style.left = `${pt.x}%`;
            ballEl.style.top  = `${pt.y}%`;
          }

          // Initialise ball at path start
          moveBall(0);

          // onUpdate fires on every scroll tick with zero lag —
          // both the line draw and ball move from the same `drawn` value,
          // so they are always in perfect lockstep.
          ScrollTrigger.create({
            trigger: container,
            start: SNAKE_START,
            end: SNAKE_END,
            onUpdate(self) {
              const drawn = self.progress * len;
              path!.style.strokeDashoffset = String(Math.max(0, len - drawn));
              moveBall(drawn);
            },
          });
        }

        // Section fade + slide reveals
        gsap.utils.toArray<Element>(".reveal").forEach((el) => {
          gsap.from(el, {
            opacity: 0, y: 28, duration: 0.65, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 84%", toggleActions: "play none none none" },
          });
        });

        // Step cards stagger
        gsap.utils.toArray<Element>(".step-card").forEach((el, i) => {
          gsap.from(el, {
            opacity: 0, y: 24, duration: 0.5, delay: i * 0.08, ease: "power2.out",
            scrollTrigger: { trigger: ".steps-grid", start: "top 80%", toggleActions: "play none none none" },
          });
        });

        // Feature cards stagger
        gsap.utils.toArray<Element>(".feature-card").forEach((el, i) => {
          gsap.from(el, {
            opacity: 0, y: 24, duration: 0.5, delay: i * 0.1, ease: "power2.out",
            scrollTrigger: { trigger: ".features-grid", start: "top 80%", toggleActions: "play none none none" },
          });
        });
      }, wrapRef);
    }

    init();
    return () => ctx?.revert();
  }, []);

  const tickerItems = decks.map((d) => ({
    deckName: d.name,
    cards: (d.cards ?? []).slice(0, 8).map((c) => c.name),
  }));

  return (
    <div ref={wrapRef}>
      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <section className="bg-black" style={{ position: "relative", zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 flex flex-wrap items-center justify-center sm:justify-start gap-x-10 gap-y-2">
          {[
            { n: String(deckCount), label: "Decks" },
            { n: String(cardCount), label: "Cards Total" },
            { n: "2–4", label: "Players" },
            { n: "Real-Time", label: "Multiplayer" },
          ].map(({ n, label }) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="font-display text-white tracking-widest" style={{ fontSize: "clamp(1.2rem, 3vw, 1.9rem)" }}>{n}</span>
              <span className="text-grey-mid text-[9px] uppercase tracking-widest font-bold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Snake container — SVG path behind all sections ───────────────────── */}
      <div className="snake-container relative" style={{ background: "white" }}>

        {/* SVG snake — z-index 0, behind sections */}
        <svg
          className="snake-svg absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="snake-path"
            d="M 50 0 C 2 8, 98 22, 50 33 C 2 44, 98 57, 50 67 C 2 77, 98 90, 50 100"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ vectorEffect: "non-scaling-stroke" } as React.CSSProperties}
          />
        </svg>

        {/* Ball marker — travels along the drawn path tip */}
        <div
          className="snake-ball"
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#0a0a0a",
            zIndex: 10,
            pointerEvents: "none",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 0 2px white, 0 0 0 3.5px #0a0a0a",
            left: "50%",
            top: 0,
          }}
        />

        {/* Gap 1 — line + ball visible here */}
        <div style={{ height: 80 }} />

        {/* ── Features ─────────────────────────────────────────────────────────
             bg-white + z-index 1 hides the snake inside this section          */}
        <section className="bg-white px-4 sm:px-8 py-16 sm:py-24" style={{ position: "relative", zIndex: 1 }}>
          <div className="max-w-6xl mx-auto">
            <div className="reveal flex items-center gap-3 mb-10">
              <h2 className="font-display tracking-widest whitespace-nowrap" style={{ fontSize: "clamp(1.2rem, 3.5vw, 2rem)" }}>WHY FTC</h2>
              <div className="flex-1 border-t-2 border-black" />
            </div>
            <div className="features-grid grid sm:grid-cols-3 gap-0 border-2 border-black" style={{ boxShadow: "6px 6px 0 #0a0a0a" }}>
              {FEATURES.map((f, i) => (
                <div key={f.tag} className="feature-card p-7 sm:p-10 flex flex-col gap-3"
                  style={{ borderRight: i < 2 ? "2px solid #0a0a0a" : undefined }}>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-grey-mid">{f.tag}</span>
                  <p className="font-display tracking-wider leading-tight" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)" }}>{f.title}</p>
                  <p className="text-xs text-grey-dark leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gap 2 — line + ball visible */}
        <div style={{ height: 80 }} />

        {/* ── How to Play ──────────────────────────────────────────────────────── */}
        <section className="bg-white px-4 sm:px-8 py-16 sm:py-24" style={{ position: "relative", zIndex: 1 }}>
          <div className="max-w-6xl mx-auto">
            <div className="reveal flex items-center gap-3 mb-10">
              <h2 className="font-display tracking-widest whitespace-nowrap" style={{ fontSize: "clamp(1.2rem, 3.5vw, 2rem)" }}>HOW TO PLAY</h2>
              <div className="flex-1 border-t-2 border-black" />
              <a href="/how-to-play" className="text-[9px] font-bold uppercase tracking-wider text-grey-mid hover:text-black transition-colors whitespace-nowrap hidden sm:block">Full Rules →</a>
            </div>
            <div className="steps-grid grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STEPS.map((step) => (
                <div key={step.n} className="step-card border-2 border-black bg-white p-7 flex flex-col gap-3" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
                  <span className="font-display text-grey-light leading-none select-none" style={{ fontSize: "3.8rem" }}>{step.n}</span>
                  <div className="w-8 border-t-2 border-black" />
                  <p className="font-display tracking-widest text-base leading-tight">{step.title}</p>
                  <p className="text-xs text-grey-dark leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gap 3 — line + ball visible */}
        <div style={{ height: 80 }} />

        {/* ── Choose Your Deck ─────────────────────────────────────────────────── */}
        <section className="bg-white" style={{ position: "relative", zIndex: 1, paddingBottom: "6rem" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <div className="reveal flex items-center gap-3 mb-6 pt-0">
              <h2 className="font-display tracking-widest whitespace-nowrap" style={{ fontSize: "clamp(1.2rem, 3.5vw, 2rem)" }}>CHOOSE YOUR DECK</h2>
              <div className="flex-1 border-t-2 border-black" />
              <a href="/decks" className="text-[9px] font-bold uppercase tracking-wider text-grey-mid hover:text-black transition-colors whitespace-nowrap hidden sm:block">View All →</a>
            </div>
          </div>
          <div className="reveal">
            {decks.length === 0 ? (
              <div className="px-8 max-w-6xl mx-auto">
                <div className="panel-brutal p-8 text-center max-w-sm mx-auto">
                  <p className="font-bold text-grey-dark text-sm">No decks available yet.</p>
                </div>
              </div>
            ) : (
              <DeckCarousel decks={decks} />
            )}
          </div>
        </section>

        {/* Bottom gap */}
        <div style={{ height: 60 }} />
      </div>

      {/* ── Ticker — just above footer ────────────────────────────────────────── */}
      <Ticker items={tickerItems} />
    </div>
  );
}
