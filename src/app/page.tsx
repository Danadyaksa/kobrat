"use client";

import { useEffect, useState } from "react";
import TransitionLink from "@/components/TransitionLink";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CollectiveGallery from "@/components/CollectiveGallery";
import { usePageTransition } from "@/components/PageTransition";

export default function Home() {
  const { introSeen } = usePageTransition();
  const [showSingleCard, setShowSingleCard] = useState<boolean>(introSeen);
  const [isBursting, setIsBursting] = useState<boolean>(introSeen);
  const [introComplete, setIntroComplete] = useState<boolean>(introSeen);

  useEffect(() => {
    if (introSeen) {
      setShowSingleCard(true);
      setIsBursting(true);
      setIntroComplete(true);
    }
  }, [introSeen]);

  // Safety fallback for first visit
  useEffect(() => {
    if (introSeen) return;

    const fallbackTimer = setTimeout(() => {
      setShowSingleCard(true);
      setIsBursting(true);
      setIntroComplete(true);
    }, 6000);

    return () => clearTimeout(fallbackTimer);
  }, [introSeen]);

  return (
    <div className="relative min-h-screen bg-white text-[#0c0c0c] flex flex-col selection:bg-[#0c0c0c] selection:text-white cursor-default">
      {/* Preloader Curtain Overlay (Only runs on initial refresh / first visit) */}
      <Preloader
        onShowSingleCard={() => setShowSingleCard(true)}
        onBurst={() => setIsBursting(true)}
        onComplete={() => setIntroComplete(true)}
      />

      {/* Navigation Header */}
      <Header introComplete={introComplete} />

      {/* Main Content Sections at z-[50] */}
      <main className="flex-1 flex flex-col relative w-full z-[50]">
        <Hero
          introComplete={introComplete}
          showSingleCard={showSingleCard}
          isBursting={isBursting}
        />

        {/* Interactive Collective 8-Friend Gallery */}
        <CollectiveGallery />
      </main>

      {/* ─── Designed Footer Close (Full-width Wordmark Return) ─── */}
      <footer className="w-full bg-[#f4f5f7] px-4 sm:px-[3vw] py-10 sm:py-16">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6 sm:gap-8">
          <div>
            <TransitionLink
              href="/"
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[clamp(42px,9vw,112px)] lowercase text-[#0c0c0c] leading-[1.12] inline-block hover:opacity-70 transition-opacity"
            >
              kobrat
            </TransitionLink>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[13px] sm:text-[14px] text-[#0c0c0c]">
            <a href="#home" className="underline hover:opacity-65 cursor-pointer">
              Back to top
            </a>
            <TransitionLink
              href="/members"
              className="underline hover:opacity-65"
            >
              Collective members
            </TransitionLink>
            <TransitionLink
              href="/gallery"
              className="underline hover:opacity-65"
            >
              Collective gallery
            </TransitionLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
