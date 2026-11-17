"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import TransitionLink from "./TransitionLink";
import { useExperience } from "./ExperienceProvider";

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
  const { soundEnabled, toggleSound, darkroomMode, toggleDarkroom, openRoulette } =
    useExperience();

  // Hold-to-develop Easter Egg on the center `kobrat` wordmark
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextClickRef = useRef<boolean>(false);

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

  const handleWordmarkDown = () => {
    suppressNextClickRef.current = false;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      suppressNextClickRef.current = true;
      toggleDarkroom();
    }, 380);
  };

  const clearWordmarkHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  return (
    <header
      className={`kobrat-header fixed top-0 inset-x-0 z-[70] transition-[opacity,background-color] duration-300 pointer-events-none ${
        introComplete ? "opacity-100 pointer-events-auto" : "opacity-0"
      } ${isScrolled ? "kobrat-header-scrolled bg-white/95" : "bg-transparent"}`}
    >
      <div className="h-[52px] px-[3vw] grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6 pointer-events-auto">
        {/* Left: Local Time + Tactile Sound Equalizer + Darkroom / Roulette Controls */}
        <div className="text-[11px] uppercase tracking-[0.04em] text-[#767676] flex items-center gap-2.5 sm:gap-3.5 select-none">
          <time className="text-[#767676] tabular-nums">{time}</time>

          <span className="text-[#d4d4d8] hidden sm:inline">·</span>

          {/* Tactile Sound Toggle with Animated Equalizer Bars */}
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? "Mute tactile sound" : "Enable tactile sound"}
            title={soundEnabled ? "Sound on (click to mute)" : "Enable tactile analog sound"}
            className="inline-flex items-center gap-1.5 py-1 px-1.5 rounded-[4px] hover:text-[#0c0c0c] transition-colors cursor-pointer"
          >
            <span className="inline-flex items-end gap-[2px] h-[10px]" aria-hidden="true">
              <span
                className={`w-[2px] bg-current transition-[height] duration-200 ${
                  soundEnabled ? "eq-bar-1 h-[9px] text-[#0c0c0c]" : "h-[3px]"
                }`}
              />
              <span
                className={`w-[2px] bg-current transition-[height] duration-200 ${
                  soundEnabled ? "eq-bar-2 h-[6px] text-[#0c0c0c]" : "h-[3px]"
                }`}
              />
              <span
                className={`w-[2px] bg-current transition-[height] duration-200 ${
                  soundEnabled ? "eq-bar-3 h-[10px] text-[#0c0c0c]" : "h-[3px]"
                }`}
              />
              <span
                className={`w-[2px] bg-current transition-[height] duration-200 ${
                  soundEnabled ? "eq-bar-4 h-[5px] text-[#0c0c0c]" : "h-[3px]"
                }`}
              />
            </span>
            <span className={`hidden md:inline ${soundEnabled ? "text-[#0c0c0c] font-medium" : ""}`}>
              {soundEnabled ? "SFX ON" : "SFX"}
            </span>
          </button>

          {/* Darkroom 35mm Mode Quick Toggle */}
          <button
            type="button"
            onClick={toggleDarkroom}
            aria-pressed={darkroomMode}
            aria-label="Toggle 35mm darkroom mode"
            title="Toggle 35mm darkroom mode (or press D / hold kobrat logo)"
            className={`hidden sm:inline-flex items-center gap-1 py-1 px-1.5 rounded-[4px] hover:text-[#0c0c0c] transition-colors cursor-pointer ${
              darkroomMode ? "text-[#0c0c0c] font-medium" : ""
            }`}
          >
            <span aria-hidden="true" className="text-[11px] leading-none">
              ◐
            </span>
            <span className="hidden lg:inline">
              {darkroomMode ? "DARKROOM" : "FILM"}
            </span>
          </button>

          {/* Random Memory Roulette Trigger */}
          <button
            type="button"
            onClick={openRoulette}
            aria-label="Spin random collective memory"
            title="Spin random memory roulette (R)"
            className="hidden md:inline-flex items-center gap-1 py-1 px-1.5 rounded-[4px] hover:text-[#0c0c0c] transition-colors cursor-pointer"
          >
            <span>ROLL</span>
          </button>
        </div>

        {/* Center: Wordmark in exact Gossip font (Hold 0.38s or Double-Click on '/' for Darkroom Easter Egg) */}
        <div
          onPointerDown={handleWordmarkDown}
          onPointerUp={clearWordmarkHold}
          onPointerLeave={clearWordmarkHold}
          onPointerCancel={clearWordmarkHold}
          onDoubleClick={(e) => {
            e.preventDefault();
            toggleDarkroom();
          }}
          onClickCapture={(e) => {
            if (suppressNextClickRef.current) {
              e.preventDefault();
              e.stopPropagation();
              suppressNextClickRef.current = false;
            }
          }}
          title="Hold or double-click for Darkroom mode"
        >
          <TransitionLink
            href="/"
            style={{ fontFamily: "var(--font-wordmark)" }}
            className="header-wordmark text-[24px] text-[#0c0c0c] lowercase leading-none select-none inline-flex items-center cursor-pointer"
          >
            <span className="sr-only">kobrat</span>
            <RollingWordmark text="kobrat" />
          </TransitionLink>
        </div>

        {/* Right: Nav items with vertical rolling chars on hover */}
        <nav className="justify-self-end flex items-center gap-1.5 sm:gap-2 select-none">
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
          <div className="hidden sm:flex items-center text-[#767676] text-[12px] uppercase ml-1">
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
