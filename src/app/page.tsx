"use client";

import { useEffect, useState } from "react";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import Hero from "@/components/Hero";

export default function Home() {
  const [introComplete, setIntroComplete] = useState<boolean>(false);

  // Safety fallback
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIntroComplete(true);
    }, 4500);

    return () => clearTimeout(fallbackTimer);
  }, []);

  return (
    <div className="relative min-h-screen bg-white text-[#0c0c0c] flex flex-col selection:bg-[#0c0c0c] selection:text-white">
      {/* Preloader Curtain Overlay - Black Intro */}
      <Preloader onComplete={() => setIntroComplete(true)} />

      {/* Navigation Header */}
      <Header />

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        <Hero introComplete={introComplete} />
      </main>

      {/* Clean Bottom Meta */}
      <footer className="fixed bottom-0 inset-x-0 z-30 px-[3vw] py-4 flex items-center justify-between text-[10px] font-mono tracking-[0.04em] text-[#767676] uppercase pointer-events-none">
        <span>© 2024 KOBRAT</span>
        <div className="hidden sm:flex items-center gap-3">
          <span>JAKARTA</span>
          <span>{"//"}</span>
          <span>EST. 2024</span>
        </div>
      </footer>
    </div>
  );
}
