"use client";

import { useEffect, useState } from "react";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import Hero from "@/components/Hero";

export default function Home() {
  const [introComplete, setIntroComplete] = useState<boolean>(false);

  // Safety fallback: Ensure intro transitions even if tab is unfocused during load
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIntroComplete(true);
    }, 4500);

    return () => clearTimeout(fallbackTimer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col selection:bg-white selection:text-black">
      {/* Preloader Curtain Overlay */}
      <Preloader onComplete={() => setIntroComplete(true)} />

      {/* Sticky / Fixed Navigation Header */}
      <Header />

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        <Hero introComplete={introComplete} />
      </main>

      {/* Footer / Secondary Strip */}
      <footer className="fixed bottom-0 inset-x-0 z-30 px-6 md:px-12 py-3.5 flex items-center justify-between text-[10px] md:text-xs tracking-widest text-[#71717a] uppercase font-mono pointer-events-none border-t border-white/[0.03] bg-[#09090b]/30 backdrop-blur-[2px]">
        <div>
          <span>© 2024 KOBRAT ARCHIVE — ALL RIGHTS RESERVED</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-zinc-600">
          <span>JAKARTA, INDONESIA</span>
          <span className="text-zinc-700">{"//"}</span>
          <span className="text-zinc-500">EST. 2024</span>
        </div>
      </footer>
    </div>
  );
}
