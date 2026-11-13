"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";
import IrisCarousel from "./IrisCarousel";

interface HeroProps {
  introComplete?: boolean;
}

const SCRAMBLE_CHARS = "01!<>-_/[]{}—=+*^?#abcdef0123456789";

function scrambleText(
  targetText: string,
  onUpdate: (val: string) => void,
  duration = 1200
): () => void {
  const chars = SCRAMBLE_CHARS;
  const len = targetText.length;
  const start = performance.now();
  let rafId: number;

  const frame = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / duration);
    const easedProgress = Math.pow(progress, 1.4);
    const resolvedIndex = Math.floor(easedProgress * len);

    let result = "";
    for (let i = 0; i < len; i++) {
      const targetChar = targetText[i];
      if (
        targetChar === " " ||
        targetChar === "\n" ||
        targetChar === "." ||
        targetChar === ","
      ) {
        result += targetChar;
      } else if (i < resolvedIndex) {
        result += targetChar;
      } else {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    onUpdate(result);

    if (progress < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      onUpdate(targetText);
    }
  };

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

export default function Hero({ introComplete = false }: HeroProps) {
  const [line1, setLine1] = useState("8 Kepala, 1 Frekuensi.");
  const [line2, setLine2] = useState("Circle pertemanan KOBRAT.");

  const carouselWrapRef = useRef<HTMLDivElement>(null);
  const pretitleRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!introComplete || hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      if (pretitleRef.current) gsap.set(pretitleRef.current, { opacity: 1, y: 0 });
      if (titleRef.current) gsap.set(titleRef.current, { opacity: 1, y: 0 });
      if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 1, y: 0 });
      if (scrollIndicatorRef.current) gsap.set(scrollIndicatorRef.current, { opacity: 1, y: 0 });
      if (carouselWrapRef.current) gsap.set(carouselWrapRef.current, { opacity: 1, scale: 1 });
      return;
    }

    // Run text scramble decryption
    const cancelLine1 = scrambleText("8 Kepala, 1 Frekuensi.", setLine1, 1100);
    const cancelLine2 = scrambleText("Circle pertemanan KOBRAT.", setLine2, 1400);

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Smooth reveal of 3D Iris Carousel orbit ring
    if (carouselWrapRef.current) {
      tl.fromTo(
        carouselWrapRef.current,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 1.4 },
        0
      );
    }

    // Reveal pretitle badge
    if (pretitleRef.current) {
      tl.fromTo(
        pretitleRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.1
      );
    }

    // Reveal main title statement
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.0 },
        0.2
      );
    }

    // Reveal subtitle
    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.9 },
        0.45
      );
    }

    // Reveal scroll indicator
    if (scrollIndicatorRef.current) {
      tl.fromTo(
        scrollIndicatorRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.65
      );
    }

    return () => {
      cancelLine1();
      cancelLine2();
      tl.kill();
    };
  }, [introComplete]);

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden px-4 select-none">
      {/* Center atmospheric glow backdrop */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] md:w-[48rem] md:h-[48rem] rounded-full bg-white/[0.018] blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* 3D Iris Carousel Stage positioned at focal center */}
      <div
        ref={carouselWrapRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: introComplete ? 1 : 0 }}
      >
        <IrisCarousel className="!h-full pointer-events-auto" />
      </div>

      {/* Centered copy block positioned at the focal center of the 3D orbit */}
      <div className="relative z-10 max-w-2xl text-center pointer-events-none px-4 flex flex-col items-center">
        {/* Pretitle label */}
        <div
          ref={pretitleRef}
          className="inline-flex items-center gap-2 px-3 py-1 mb-5 md:mb-6 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm font-mono text-[10px] md:text-xs text-[#a1a1aa] tracking-[0.25em] uppercase select-none"
          style={{ opacity: introComplete ? 1 : 0 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>BASED IN JAKARTA // 2024 COLLECTIVE</span>
        </div>

        {/* Main title statement */}
        <h1
          ref={titleRef}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6 leading-[1.18] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] max-w-xl mx-auto"
          style={{ opacity: introComplete ? 1 : 0 }}
        >
          <span className="block">{line1}</span>
          <span className="block text-zinc-300 font-light mt-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
            {line2}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-sm md:text-base text-[#a1a1aa] max-w-lg leading-relaxed font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
          style={{ opacity: introComplete ? 1 : 0 }}
        >
          A brotherhood of eight souls navigating city lights, untold stories, and spontaneous midnight escapes.
        </p>
      </div>

      {/* Downward scroll indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-14 md:bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20 text-[#a1a1aa] font-mono text-[10px] md:text-xs tracking-widest uppercase"
        style={{ opacity: introComplete ? 1 : 0 }}
      >
        <span className="tracking-[0.25em] text-zinc-400">SCROLL OR DRAG TO EXPLORE</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-zinc-500" />
      </div>
    </section>
  );
}
