"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setTimeString(`${formatter.format(now)} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-6 md:px-12 py-5 flex items-center justify-between text-xs tracking-widest text-[#a1a1aa] uppercase font-mono pointer-events-auto backdrop-blur-sm bg-[#09090b]/40 border-b border-white/[0.04] select-none">
      {/* Left Section: Location Tag & Real-time Live Jakarta Clock */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <span className="hidden sm:inline">CURRENTLY IN </span>
        <span>JAKARTA</span>
        <span className="text-zinc-600">/</span>
        <span
          className="text-white tabular-nums tracking-normal font-mono min-w-[8ch]"
          suppressHydrationWarning
        >
          {timeString || "--:--:-- WIB"}
        </span>
      </div>

      {/* Center Section: Gothic Brandmark */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <button
          onClick={scrollToTop}
          className="font-gothic text-2xl md:text-3xl text-white tracking-normal font-normal lowercase hover:opacity-80 transition-opacity cursor-pointer"
          aria-label="KOBRAT Brand Home"
        >
          kobrat
        </button>
      </div>

      {/* Right Section: Status pulse & Members badge */}
      <div className="flex items-center gap-2 md:gap-2.5">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
          aria-hidden="true"
        />
        <span className="text-zinc-300 font-mono">[ 08 MEMBERS ]</span>
      </div>
    </header>
  );
}
