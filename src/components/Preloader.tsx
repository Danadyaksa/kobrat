"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Loader2 } from "lucide-react";

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isDone, setIsDone] = useState<boolean>(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const counterObj = { value: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          setProgress(100);
          setIsDone(true);
          onCompleteRef.current?.();
        },
      });

      const counterDuration = prefersReducedMotion ? 0.05 : 1.8;
      const pauseDuration = prefersReducedMotion ? 0.05 : 0.2;
      const curtainDuration = prefersReducedMotion ? 0.1 : 1.1;

      // 1. Smoothly increment counter from 0 to 100
      tl.to(counterObj, {
        value: 100,
        duration: counterDuration,
        ease: prefersReducedMotion ? "none" : "power2.inOut",
        onUpdate: () => {
          const rounded = Math.round(counterObj.value);
          if (counterRef.current) {
            counterRef.current.textContent = `${rounded}%`;
          }
        },
      });

      // 2. Pause at 100%
      tl.to({}, { duration: pauseDuration });

      // 3. Slide the curtain upwards with high-impact power4 easing
      tl.to(containerRef.current, {
        yPercent: -100,
        duration: curtainDuration,
        ease: prefersReducedMotion ? "none" : "power4.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (isDone) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#09090b] text-[#f4f4f5] flex flex-col justify-between p-6 md:p-12 pointer-events-auto select-none overflow-hidden"
      style={{ willChange: "transform" }}
    >
      {/* Top Bar */}
      <header className="flex justify-between items-center w-full font-mono text-xs md:text-sm text-zinc-400 tracking-wider">
        <span className="flex items-center gap-2">
          [ KOBRAT // EST. 2024 ]
        </span>
        <span className="flex items-center gap-2 text-zinc-300">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          [ 08 MEMBERS ACTIVE ]
        </span>
      </header>

      {/* Center Stage */}
      <main className="relative flex flex-col items-center justify-center my-auto">
        {/* Subtle glow backdrop mimicking gothic pixel logo aura */}
        <div
          className="absolute w-72 h-72 md:w-[32rem] md:h-[32rem] rounded-full bg-white/[0.035] blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <h1 className="font-gothic text-7xl md:text-9xl lg:text-[11rem] text-white tracking-normal font-normal lowercase select-none relative drop-shadow-[0_0_35px_rgba(255,255,255,0.2)]">
          kobrat
        </h1>

        <p className="mt-3 md:mt-5 text-[11px] md:text-xs font-mono uppercase tracking-[0.35em] text-zinc-400 text-center">
          eight minds, single wavelength
        </p>
      </main>

      {/* Bottom Bar */}
      <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 w-full font-mono text-xs md:text-sm text-zinc-400">
        <span className="tracking-widest uppercase">
          DIGITAL ARCHIVE // MEMORIES &amp; ESCAPADES
        </span>

        <div className="flex items-center gap-3 self-end sm:self-auto text-zinc-200">
          <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-zinc-400" />
          <span
            ref={counterRef}
            className="tabular-nums font-mono text-sm md:text-base font-medium min-w-[3.5ch] text-right text-white"
          >
            {progress}%
          </span>
        </div>
      </footer>
    </div>
  );
}
