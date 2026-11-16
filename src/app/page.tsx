"use client";

import { useEffect, useState } from "react";
import TransitionLink from "@/components/TransitionLink";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
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

      {/* Main Hero Section at z-[50] */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden z-[50]">
        <Hero
          introComplete={introComplete}
          showSingleCard={showSingleCard}
          isBursting={isBursting}
        />
      </main>

      {/* Clean Bottom Meta */}
      <footer className="fixed bottom-0 inset-x-0 z-30 px-[3vw] py-4 flex items-center justify-between text-[10px] font-mono tracking-[0.04em] text-[#767676] uppercase pointer-events-none">
        <span>© 2024 KOBRAT</span>
        <div className="hidden sm:flex items-center gap-3 pointer-events-auto">
          <TransitionLink href="/admin" className="hover:text-[#0c0c0c] transition-colors">
            ADMIN
          </TransitionLink>
          <span>{"//"}</span>
          <span>EST. 2024</span>
        </div>
      </footer>
    </div>
  );
}
