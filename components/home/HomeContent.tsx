"use client";

import { useEffect, useRef } from "react";
import { DeckCarousel } from "@/components/deck/DeckCarousel";
import { Ticker } from "./Ticker";
import type { Deck } from "@/types";

// ── Scroll speed control ──────────────────────────────────────────────────────
// These control when the side line starts and finishes drawing.
// Format: "<element-edge> <viewport-position>"
//   "top top"       → line starts when section top hits viewport top
//   "top center"    → starts when section top hits the middle of the viewport
//   "bottom bottom" → line finishes when section bottom hits viewport bottom
//
// Draw FASTER  → e.g. SCROLL_START="top 20%"  SCROLL_END="bottom 80%"
// Draw SLOWER  → keep defaults (spans the entire scroll range)
// Start LATER  → change SCROLL_START to "top center"
const SCROLL_START = "top top";
const SCROLL_END   = "bottom bottom";
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: "01", title: "PICK A DECK",    body: "Choose a universe — superheroes, cars, wrestlers, anime. Every deck has 52 cards and 8 battle stats." },
  { n: "02", title: "BUILD YOUR ROOM", body: "Create a private room and invite friends, or drop in CPU opponents to fill the seats. 2–4 players." },
  { n: "03", title: "CALL YOUR STAT", body: "On your turn, pick the stat you think beats everyone else's top card. Highest value wins the pile." },
  { n: "04", title: "WIN THE PILE",   body: "Collect cards from every round you win. Last player standing takes it all." },
];

const FEATURES = [
  { tag: "GAMEPLAY",    title: "STRATEGY OVER LUCK",  body: "No dice. No random draws. You pick the stat every round — reading your opponents is everything." },
  { tag: "MULTIPLAYER", title: "REAL-TIME BATTLES",   body: "2–4 players in a live room. Moves sync instantly. CPU opponents fill any empty seat." },
  { tag: "DECKS",       title: "MULTIPLE UNIVERSES",  body: "Ben 10, Marvel, WWE, Dragon Ball, Harry Potter and more. Each deck is a different battle arena." },
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
        const container = wrapRef.current?.querySelector<HTMLElement>(".side-line-container");
        const fillEl    = wrapRef.current?.querySelector<HTMLElement>(".side-line-fill");

        if (container && fillEl) {
          ScrollTrigger.create({
            trigger: container,
            start: SCROLL_START,
            end: SCROLL_END,
            onUpdate(self) {
              fillEl.style.transform = `scaleY(${self.progress})`;
            },
          });
        }

        // Section reveals
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
      <section className="bg-black">
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

      {/* ── Side-line container ───────────────────────────────────────────────
           The line sits in the left margin (left: 1.75rem) outside the max-w-6xl
           content area, so sections keep their full width.                    */}
      <div className="side-line-container relative">

        {/* Track + fill (xl+ only — needs enough left margin) */}
        <div
          className="hidden xl:block absolute top-0 bottom-0 pointer-events-none"
          style={{ left: "3rem", width: 2, background: "#e0e0da", zIndex: 1 }}
        >
          <div
            className="side-line-fill absolute top-0 left-0 w-full bg-black"
            style={{ height: "100%", transform: "scaleY(0)", transformOrigin: "top" }}
          />
        </div>


        {/* ── WHY FTC — bordered panel ─────────────────────────────────────── */}
        <div style={{ height: 60 }} />
        <section className="px-4 sm:px-8 py-1" style={{ position: "relative", zIndex: 1 }}>
          <div className="reveal max-w-6xl mx-auto border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
            <div className="px-6 sm:px-8 py-4 border-b-2 border-black">
              <h2 className="font-display tracking-widest" style={{ fontSize: "clamp(1.1rem, 3vw, 1.8rem)" }}>WHY FTC</h2>
            </div>
            <div className="features-grid grid sm:grid-cols-3">
              {FEATURES.map((f, i) => (
                <div key={f.tag} className="feature-card p-6 sm:p-9 flex flex-col gap-3" style={{ borderRight: i < 2 ? "2px solid #0a0a0a" : undefined }}>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-grey-mid">{f.tag}</span>
                  <p className="font-display tracking-wider leading-tight" style={{ fontSize: "clamp(1rem, 2.5vw, 1.35rem)" }}>{f.title}</p>
                  <p className="text-xs text-grey-dark leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW TO PLAY — bordered panel ─────────────────────────────────── */}
        <div style={{ height: 60 }} />
        <section className="px-4 sm:px-8 py-1" style={{ position: "relative", zIndex: 1 }}>
          <div className="reveal max-w-6xl mx-auto border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
            <div className="px-6 sm:px-8 py-4 border-b-2 border-black flex items-center justify-between">
              <h2 className="font-display tracking-widest" style={{ fontSize: "clamp(1.1rem, 3vw, 1.8rem)" }}>HOW TO PLAY</h2>
              <a href="/how-to-play" className="text-[9px] font-bold uppercase tracking-wider text-grey-mid hover:text-black transition-colors hidden sm:block">Full Rules →</a>
            </div>
            <div className="p-5 sm:p-7">
              <div className="steps-grid grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STEPS.map((step) => (
                  <div key={step.n} className="step-card border-2 border-black bg-white p-6 flex flex-col gap-3" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
                    <span className="font-display text-grey-light leading-none select-none" style={{ fontSize: "3.5rem" }}>{step.n}</span>
                    <div className="w-8 border-t-2 border-black" />
                    <p className="font-display tracking-widest text-sm leading-tight">{step.title}</p>
                    <p className="text-xs text-grey-dark leading-relaxed">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CHOOSE YOUR DECK — bordered panel (same style as others) ────────── */}
        <div style={{ height: 60 }} />
        <section className="px-4 sm:px-8 py-1" style={{ position: "relative", zIndex: 1 }}>
          <div className="reveal max-w-6xl mx-auto border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
            <div className="px-6 sm:px-8 py-4 border-b-2 border-black flex items-center justify-between">
              <h2 className="font-display tracking-widest" style={{ fontSize: "clamp(1.1rem, 3vw, 1.8rem)" }}>CHOOSE YOUR DECK</h2>
              <a href="/decks" className="text-[9px] font-bold uppercase tracking-wider text-grey-mid hover:text-black transition-colors hidden sm:block">View All →</a>
            </div>
            {decks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-bold text-grey-dark text-sm">No decks available yet.</p>
              </div>
            ) : (
              <DeckCarousel decks={decks} />
            )}
          </div>
        </section>

        <div style={{ height: 60 }} />
      </div>

      {/* ── Ticker — just above footer ───────────────────────────────────── */}
      <Ticker items={tickerItems} />
    </div>
  );
}
