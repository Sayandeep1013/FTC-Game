"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { UniverseCarousel } from "@/components/deck/UniverseCarousel";
import { Ticker } from "./Ticker";
import type { Universe } from "@/types";

const STEPS = [
  { n: "01", title: "PICK A UNIVERSE", body: "Choose the world first, then pick the exact deck inside it. Every playable deck has 52 cards and 8 battle stats." },
  { n: "02", title: "BUILD YOUR ROOM", body: "Create a private room and invite friends, or drop in CPU opponents to fill the seats. 2-4 players." },
  { n: "03", title: "CALL YOUR STAT", body: "On your turn, pick the stat you think beats everyone else's top card. Highest value wins the pile." },
  { n: "04", title: "WIN THE PILE", body: "Collect cards from every round you win. Last player standing takes it all." },
];

const FEATURES = [
  { tag: "GAMEPLAY", title: "STRATEGY OVER LUCK", body: "No dice. No random draws. You pick the stat every round, so reading your opponents matters." },
  { tag: "MULTIPLAYER", title: "REAL-TIME BATTLES", body: "2-4 players in a live room. Moves sync instantly. CPU opponents fill any empty seat." },
  { tag: "UNIVERSES", title: "ERAS WITHOUT CLUTTER", body: "Ben 10 can have Classic, Alien Force, Ultimate Alien and more without mixing every card into one deck." },
];

interface HomeContentProps {
  universes: Universe[];
  deckCount: number;
  cardCount: number;
}

export function HomeContent({ universes, deckCount, cardCount }: HomeContentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const decks = universes.flatMap((u) => u.decks ?? []);
  const tickerItems = decks.map((d) => ({
    deckName: d.name,
    cards: (d.cards ?? []).slice(0, 8).map((c) => c.name),
  }));

  useEffect(() => {
    const root = rootRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!root || reduceMotion) return;
    const scope: HTMLDivElement = root;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    async function animateHome() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled || !rootRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        const counters = gsap.utils.toArray<HTMLElement>("[data-home-stat]");
        gsap.from(counters, {
          y: -10,
          autoAlpha: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: "power2.out",
          clearProps: "transform,opacity,visibility",
        });

        gsap.from("[data-home-line]", {
          scaleY: 0,
          transformOrigin: "top",
          duration: 1.1,
          ease: "power3.out",
          clearProps: "transform",
        });

        gsap.utils.toArray<HTMLElement>("[data-home-section]").forEach((section) => {
          const revealItems = section.querySelectorAll<HTMLElement>("[data-home-reveal]");
          gsap.from(section, {
            y: 34,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 86%",
              once: true,
            },
            clearProps: "transform,opacity,visibility",
          });
          gsap.from(revealItems, {
            y: 18,
            autoAlpha: 0,
            duration: 0.55,
            stagger: 0.06,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 86%",
              once: true,
            },
            clearProps: "transform,opacity,visibility",
          });
        });
      }, scope);

      cleanup = () => ctx.revert();
    }

    animateHome();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [universes.length]);

  return (
    <div ref={rootRef}>
      <section className="bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 flex flex-wrap items-center justify-center sm:justify-start gap-x-10 gap-y-2">
          {[
            { n: String(universes.length), label: "Universes" },
            { n: String(deckCount), label: "Playable Decks" },
            { n: String(cardCount), label: "Cards Total" },
            { n: "2-4", label: "Players" },
          ].map(({ n, label }) => (
            <div key={label} className="flex items-baseline gap-2" data-home-stat>
              <span className="font-display text-white tracking-widest" style={{ fontSize: "clamp(1.2rem, 3vw, 1.9rem)" }}>{n}</span>
              <span className="text-grey-mid text-[9px] uppercase tracking-widest font-bold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="relative">
        <div className="hidden xl:block absolute top-0 bottom-0 pointer-events-none" style={{ left: "3rem", width: 2, background: "#e0e0da", zIndex: 1 }}>
          <div className="absolute top-0 left-0 w-full bg-black home-line-fill" data-home-line />
        </div>

        <div style={{ height: 60 }} />
        <section className="px-4 sm:px-8 py-1" style={{ position: "relative", zIndex: 1 }} data-home-section>
          <div className="max-w-6xl mx-auto border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
            <div className="px-6 sm:px-8 py-4 border-b-2 border-black">
              <h2 className="font-display tracking-widest" style={{ fontSize: "clamp(1.1rem, 3vw, 1.8rem)" }}>WHY FTC</h2>
            </div>
            <div className="features-grid grid sm:grid-cols-3">
              {FEATURES.map((f, i) => (
                <div key={f.tag} className="p-6 sm:p-9 flex flex-col gap-3" style={{ borderRight: i < 2 ? "2px solid #0a0a0a" : undefined }} data-home-reveal>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-grey-mid">{f.tag}</span>
                  <p className="font-display tracking-wider leading-tight" style={{ fontSize: "clamp(1rem, 2.5vw, 1.35rem)" }}>{f.title}</p>
                  <p className="text-xs text-grey-dark leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ height: 60 }} />
        <section className="px-4 sm:px-8 py-1" style={{ position: "relative", zIndex: 1 }} data-home-section>
          <div className="max-w-6xl mx-auto border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
            <div className="px-6 sm:px-8 py-4 border-b-2 border-black flex items-center justify-between">
              <h2 className="font-display tracking-widest" style={{ fontSize: "clamp(1.1rem, 3vw, 1.8rem)" }}>HOW TO PLAY</h2>
              <Link href="/how-to-play" className="text-[9px] font-bold uppercase tracking-wider text-grey-mid hover:text-black transition-colors hidden sm:block">Full Rules</Link>
            </div>
            <div className="p-5 sm:p-7">
              <div className="steps-grid grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STEPS.map((step) => (
                  <div key={step.n} className="border-2 border-black bg-white p-6 flex flex-col gap-3" style={{ boxShadow: "4px 4px 0 #0a0a0a" }} data-home-reveal>
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

        <div style={{ height: 60 }} />
        <section className="px-4 sm:px-8 py-1" style={{ position: "relative", zIndex: 1 }} data-home-section>
          <div className="max-w-6xl mx-auto border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
            <div className="px-6 sm:px-8 py-4 border-b-2 border-black flex items-center justify-between">
              <h2 className="font-display tracking-widest" style={{ fontSize: "clamp(1.1rem, 3vw, 1.8rem)" }}>CHOOSE YOUR UNIVERSE</h2>
              <Link href="/decks" className="text-[9px] font-bold uppercase tracking-wider text-grey-mid hover:text-black transition-colors hidden sm:block">View All</Link>
            </div>
            {universes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-bold text-grey-dark text-sm">No universes available yet.</p>
              </div>
            ) : (
              <UniverseCarousel universes={universes} />
            )}
          </div>
        </section>

        <div style={{ height: 60 }} />
      </div>

      <Ticker items={tickerItems} />
    </div>
  );
}
