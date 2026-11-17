"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TransitionLink from "./TransitionLink";

interface HeaderProps {
  introComplete?: boolean;
}

function RollingText({ text }: { text: string }) {
  return (
    <span className="chars-inner" aria-hidden="true">
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{ "--i": index } as React.CSSProperties}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

function RollingWordmark({ text }: { text: string }) {
  return (
    <span className="wordmark-chars" aria-hidden="true">
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{ "--i": index } as React.CSSProperties}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export default function Header({ introComplete = true }: HeaderProps) {
  const [time, setTime] = useState<string>("--:--");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const pathname = usePathname();

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("en-GB", {
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

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-[70] transition-[opacity,background-color] duration-300 pointer-events-none ${
        introComplete ? "opacity-100 pointer-events-auto" : "opacity-0"
      } ${isScrolled || pathname === "/gallery" ? "bg-white/95" : "bg-transparent"}`}
    >
      <div className="h-[52px] px-[3vw] grid grid-cols-[1fr_auto_1fr] items-center gap-6 pointer-events-auto">
        {/* Left: Local Time */}
        <div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#767676] flex items-center gap-2 select-none">
          <time className="text-[#767676]">{time}</time>
        </div>

        {/* Center: Wordmark in exact Gossip font with rolling scroll animation */}
        <TransitionLink
          href="/"
          style={{ fontFamily: "var(--font-wordmark)" }}
          className="header-wordmark text-[24px] text-[#0c0c0c] lowercase leading-none select-none inline-flex items-center cursor-pointer"
        >
          <span className="sr-only">kobrat</span>
          <RollingWordmark text="kobrat" />
        </TransitionLink>

        {/* Right: Nav items with vertical rolling chars on hover */}
        <nav className="justify-self-end flex items-center gap-2 select-none">
          <TransitionLink
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className="nav-item"
          >
            <span className="sr-only">Home</span>
            <RollingText text="HOME" />
          </TransitionLink>
          <TransitionLink
            href="/gallery"
            aria-current={pathname === "/gallery" ? "page" : undefined}
            className="nav-item"
          >
            <span className="sr-only">Gallery</span>
            <RollingText text="GALLERY" />
          </TransitionLink>
          <TransitionLink
            href="/admin"
            aria-current={pathname === "/admin" ? "page" : undefined}
            className="nav-item"
          >
            <span className="sr-only">Admin</span>
            <RollingText text="ADMIN" />
          </TransitionLink>
          <div className="flex items-center text-[#767676] font-mono text-[12px] uppercase ml-1">
            <button
              type="button"
              className="nav-item !px-1.5 text-[#0c0c0c]"
              aria-label="Bahasa Indonesia"
            >
              <RollingText text="ID" />
            </button>
            <span className="text-[#a1a1aa] mx-0.5">/</span>
            <button
              type="button"
              className="nav-item !px-1.5"
              aria-label="English"
            >
              <RollingText text="EN" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
