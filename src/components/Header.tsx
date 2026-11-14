"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [time, setTime] = useState<string>("--:--");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);
      setTime(formatted);
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-40 transition-colors duration-400">
      <div className="h-[52px] px-[3vw] grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        {/* Left: Location & Local Time */}
        <div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#767676] flex items-center gap-2 select-none">
          <span>Currently in</span>
          <span className="text-[#0c0c0c] underline decoration-dotted underline-offset-4">
            Jakarta
          </span>
          <time className="text-[#767676] ml-1">{time}</time>
        </div>

        {/* Center: Wordmark in exact Gossip font */}
        <Link
          href="/"
          style={{ fontFamily: "var(--font-wordmark)" }}
          className="text-[24px] text-[#0c0c0c] lowercase leading-none select-none hover:opacity-80 transition-opacity"
        >
          kobrat
        </Link>

        {/* Right: Nav items */}
        <nav className="justify-self-end flex items-center gap-5 text-[12px] text-[#0c0c0c] select-none uppercase tracking-wider font-mono">
          <Link href="/" className="hover:opacity-60 transition-opacity">
            Home
          </Link>
          <a href="#members" className="hover:opacity-60 transition-opacity">
            Members
          </a>
          <a href="#contact" className="hover:opacity-60 transition-opacity">
            Contact
          </a>
          <div className="flex items-center gap-1 text-[#767676] text-[11px] ml-2">
            <span className="text-[#0c0c0c]">ID</span>
            <span>/</span>
            <span className="hover:text-[#0c0c0c] cursor-pointer">EN</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
