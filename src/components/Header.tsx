"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
          className="wordmark-col"
          style={{ "--i": index } as React.CSSProperties}
        >
          <span className="wordmark-cell">{char}</span>
          <span className="wordmark-cell">{char}</span>
        </span>
      ))}
    </span>
  );
}

export default function Header({ introComplete = true }: HeaderProps) {
  const [time, setTime] = useState<string>("--:--");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-[70] transition-[opacity,background-color] duration-300 pointer-events-none ${
        introComplete ? "opacity-100 pointer-events-auto" : "opacity-0"
      } ${isScrolled || mobileMenuOpen ? "bg-white/95 backdrop-blur-md border-b border-black/5" : "bg-transparent"}`}
    >
      <div className="h-[52px] px-4 sm:px-[3vw] grid grid-cols-3 items-center pointer-events-auto">
        {/* Left: Local Time */}
        <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.04em] text-[#767676] flex items-center gap-2 select-none">
          <time className="text-[#767676]">{time}</time>
        </div>

        {/* Center: Wordmark in exact Gossip font with rolling scroll animation */}
        <div className="flex justify-center items-center">
          <TransitionLink
            href="/"
            style={{ fontFamily: "var(--font-wordmark)" }}
            className="wordmark-link text-[24px] sm:text-[26px] text-[#0c0c0c] lowercase select-none inline-flex items-center cursor-pointer"
          >
            <span className="sr-only">kobrat</span>
            <RollingWordmark text="kobrat" />
          </TransitionLink>
        </div>

        {/* Right: Desktop Nav items / Mobile Hamburger Toggle */}
        <div className="flex justify-end items-center select-none">
          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-2">
            <TransitionLink
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className="nav-item"
            >
              <span className="sr-only">Home</span>
              <RollingText text="HOME" />
            </TransitionLink>
            <TransitionLink
              href="/members"
              aria-current={pathname === "/members" ? "page" : undefined}
              className="nav-item"
            >
              <span className="sr-only">Members</span>
              <RollingText text="MEMBERS" />
            </TransitionLink>
            <TransitionLink
              href="/gallery"
              aria-current={pathname === "/gallery" ? "page" : undefined}
              className="nav-item"
            >
              <span className="sr-only">Gallery</span>
              <RollingText text="GALLERY" />
            </TransitionLink>
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-[6px] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer text-[#0c0c0c]"
          >
            <span
              className={`w-5 h-[1.5px] bg-[#0c0c0c] transition-all duration-200 ${
                mobileMenuOpen ? "rotate-45 translate-y-[3.75px]" : ""
              }`}
            />
            <span
              className={`w-5 h-[1.5px] bg-[#0c0c0c] transition-all duration-200 ${
                mobileMenuOpen ? "-rotate-45 -translate-y-[3.75px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full bg-white/98 backdrop-blur-xl border-b border-black/10 px-6 py-6 flex flex-col gap-4 pointer-events-auto shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <TransitionLink
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`font-mono text-[14px] uppercase tracking-[0.06em] py-2 border-b border-black/5 flex items-center justify-between ${
              pathname === "/" ? "text-[#0c0c0c] font-bold" : "text-[#71717a]"
            }`}
          >
            <span>HOME</span>
            <span className="text-[11px] text-[#a1a1aa]">01</span>
          </TransitionLink>

          <TransitionLink
            href="/members"
            onClick={() => setMobileMenuOpen(false)}
            className={`font-mono text-[14px] uppercase tracking-[0.06em] py-2 border-b border-black/5 flex items-center justify-between ${
              pathname === "/members" ? "text-[#0c0c0c] font-bold" : "text-[#71717a]"
            }`}
          >
            <span>MEMBERS</span>
            <span className="text-[11px] text-[#a1a1aa]">02</span>
          </TransitionLink>

          <TransitionLink
            href="/gallery"
            onClick={() => setMobileMenuOpen(false)}
            className={`font-mono text-[14px] uppercase tracking-[0.06em] py-2 flex items-center justify-between ${
              pathname === "/gallery" ? "text-[#0c0c0c] font-bold" : "text-[#71717a]"
            }`}
          >
            <span>GALLERY</span>
            <span className="text-[11px] text-[#a1a1aa]">03</span>
          </TransitionLink>
        </div>
      )}
    </header>
  );
}
