"use client";

import { useEffect, useRef } from "react";
import { DeckCarousel } from "@/components/deck/DeckCarousel";
import { Ticker } from "./Ticker";
import type { Deck } from "@/types";

const STEPS = [
  {
    n: "01",
    title: "PICK A DECK",
    body: "Choose a universe — superheroes, cars, wrestlers, anime. Every deck has 52 cards and 8 battle stats.",
  },
  {
    n: "02",
    title: "BUILD YOUR ROOM",
    body: "Create a private room and invite friends, or drop in CPU opponents to fill the seats. 2–4 players.",
  },
  {
    n: "03",
    title: "CALL YOUR STAT",
    body: "On your turn, pick the stat you think beats everyone else's top card. Highest value wins the pile.",
  },
  {
    n: "04",
    title: "WIN THE PILE",
    body: "Collect cards from every round you win. Last player standing takes it all.",
  },
];

interface HomeContentProps {
  decks: Deck[];
  deckCount: number;
  cardCount: number;
}

export function HomeContent({ decks, deckCount, cardCount }: HomeContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // Vertical line fill — tracks total scroll progress through the content area
        gsap.to(".scroll-line-fill", {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".scroll-container",
            start: "top 15%",
            end: "bottom 85%",
            scrub: 0.4,
          },
        });

        // Dot activation — each dot fills as the line reaches it
        gsap.utils.toArray<Element>(".scroll-dot").forEach((dot, i) => {
          gsap.fromTo(
            dot,
            { scale: 0.4, backgroundColor: "#e0e0da" },
            {
              scale: 1,
              backgroundColor: "#0a0a0a",
              duration: 0.3,
              ease: "back.out(2)",
              scrollTrigger: {
                trigger: dot,
                start: "top 60%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });

        // Section reveal — staggered fade + slide up
        gsap.utils.toArray<Element>(".scroll-reveal").forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 32,
            duration: 0.65,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 84%",
              toggleActions: "play none none none",
            },
          });
        });

        // How-to steps — stagger children
        gsap.utils.toArray<Element>(".step-card").forEach((el, i) => {
          gsap.from(el, {
            opacity: 0,
            y: 28,
            duration: 0.5,
            delay: i * 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".steps-grid",
              start: "top 80%",
              toggleActions: "play none none none",
            },
          });
        });
      }, containerRef);
    }

    init();
    return () => ctx?.revert();
  }, []);

  // Build ticker items: each deck with up to 8 card names
  const tickerItems = decks.map(deck => ({
    deckName: deck.name,
    cards: (deck.cards ?? []).slice(0, 8).map(c => c.name),
  }));

  return (
    <div ref={containerRef}>
      {/* ── Ticker — deck names + cards, infinite horizontal scroll ──── */}
      <Ticker items={tickerItems} />

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <section className="border-b-2 border-black bg-black scroll-reveal">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-center sm:justify-start gap-x-8 gap-y-2">
          {[
            { n: deckCount.toString(), label: "Decks" },
            { n: (cardCount).toString(), label: "Cards Total" },
            { n: "2–4", label: "Players" },
            { n: "Real-Time", label: "Multiplayer" },
          ].map(({ n, label }) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="font-display text-white tracking-widest" style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)" }}>{n}</span>
              <span className="text-grey-mid text-[9px] uppercase tracking-widest font-bold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scroll-tracked content ─────────────────────────────────────── */}
      <div className="scroll-container relative max-w-6xl mx-auto px-4 sm:px-8">
        {/* Vertical line track (desktop only) */}
        <div
          className="hidden lg:block absolute top-0 bottom-0 pointer-events-none"
          style={{ left: "1.75rem", width: 2, background: "#e0e0da" }}
        >
          {/* Fill line — GSAP drives scaleY 0→1 */}
          <div
            className="scroll-line-fill absolute inset-0 bg-black"
            style={{ transformOrigin: "top", transform: "scaleY(0)" }}
          />
        </div>

        {/* ── How to play ─────────────────────────────────────────────── */}
        <section className="py-14 sm:py-20 lg:pl-14">
          {/* Section label */}
          <div className="scroll-reveal flex items-center gap-3 mb-10">
            {/* Dot on the line */}
            <div
              className="scroll-dot hidden lg:block flex-shrink-0 rounded-full border-2 border-black bg-grey-light"
              style={{ width: 12, height: 12, marginLeft: "-6.125rem", marginRight: "1.5rem" }}
            />
            <h2 className="font-display tracking-widest" style={{ fontSize: "clamp(1.4rem, 4vw, 2.2rem)" }}>
              HOW TO PLAY
            </h2>
            <div className="flex-1 border-t-2 border-black hidden sm:block" />
          </div>

          <div className="steps-grid grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="step-card border-2 border-black bg-white p-5 flex flex-col gap-3"
                style={{ boxShadow: "4px 4px 0 #0a0a0a" }}
              >
                <span
                  className="font-display text-grey-light leading-none select-none"
                  style={{ fontSize: "3.5rem", letterSpacing: "0.04em" }}
                >
                  {step.n}
                </span>
                <div className="w-8 border-t-2 border-black" />
                <p className="font-display tracking-widest text-lg leading-tight">{step.title}</p>
                <p className="text-xs text-grey-dark leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Deck carousel ───────────────────────────────────────────── */}
        <section className="pb-14 sm:pb-20 lg:pl-14">
          <div className="scroll-reveal flex items-center gap-3 mb-6">
            <div
              className="scroll-dot hidden lg:block flex-shrink-0 rounded-full border-2 border-black bg-grey-light"
              style={{ width: 12, height: 12, marginLeft: "-6.125rem", marginRight: "1.5rem" }}
            />
            <h2 className="font-display tracking-widest" style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)" }}>
              CHOOSE YOUR DECK
            </h2>
            <div className="flex-1 border-t-2 border-black hidden sm:block" />
            <span className="text-[9px] uppercase tracking-wider text-grey-mid font-bold whitespace-nowrap hidden sm:block">
              Tap to play
            </span>
          </div>

          <div className="scroll-reveal -mx-4 sm:-mx-8">
            {decks.length === 0 ? (
              <div className="px-8">
                <div className="panel-brutal p-8 text-center max-w-sm mx-auto">
                  <p className="font-bold text-grey-dark text-sm">No decks available yet.</p>
                </div>
              </div>
            ) : (
              <DeckCarousel decks={decks} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
