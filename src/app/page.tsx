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

      {/* Clean Bottom Meta */}
      <footer className="w-full bg-[#fcfcfc] border-t border-[#f0f0f0] px-[3vw] py-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono tracking-[0.04em] text-[#767676] uppercase gap-4 z-[50]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#0c0c0c]">© 2025 KOBRAT</span>
          <span>//</span>
          <span>JAKARTA & REMOTE</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#home" className="hover:text-[#0c0c0c] transition-colors cursor-pointer">
            ↑ BACK TO TOP
          </a>
          <span>{"//"}</span>
          <TransitionLink
            href="/admin"
            className="hover:text-[#0c0c0c] transition-colors"
          >
            ADMIN DASHBOARD
          </TransitionLink>
        </div>
      </footer>
    </div>
  );
}
