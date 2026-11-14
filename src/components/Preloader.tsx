"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Preloader({ onComplete }: { onComplete?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const [isDone, setIsDone] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const counterObj = { value: 0 };
      const duration = prefersReducedMotion ? 0.3 : 1.8;

      const tl = gsap.timeline();

      // Fade in wordmark
      tl.to(nameRef.current, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
      });

      // Count up from 0 to 100
      tl.to(
        counterObj,
        {
          value: 100,
          duration: duration,
          ease: "power2.inOut",
          onUpdate: () => {
            const val = Math.round(counterObj.value);
            if (counterRef.current) {
              counterRef.current.textContent = `${val}%`;
            }
          },
        },
        "-=0.2"
      );

      // Brief hold, then curtain reveal (slide up)
      tl.to(containerRef.current, {
        yPercent: -100,
        duration: prefersReducedMotion ? 0.4 : 1.1,
        ease: "power4.inOut",
        delay: 0.15,
        onComplete: () => {
          setIsDone(true);
          onCompleteRef.current?.();
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#0c0c0c] text-white flex items-center justify-between px-[3vw] pointer-events-none select-none will-change-transform"
    >
      {/* Left role / category */}
      <span className="font-mono text-[12px] uppercase tracking-[0.02em] text-[#ffffff8c] leading-none">
        Friendship circle
      </span>

      {/* Center name */}
      <div
        ref={nameRef}
        className="absolute inset-0 m-auto flex items-center justify-center opacity-0 pointer-events-none"
      >
        <span
          style={{ fontFamily: "var(--font-wordmark)" }}
          className="text-white text-[clamp(64px,10vw,140px)] tracking-normal lowercase leading-none select-none"
        >
          kobrat
        </span>
      </div>

      {/* Right counter */}
      <div className="ml-auto flex items-center gap-2">
        <span
          ref={counterRef}
          className="font-mono text-[12px] tracking-[0.02em] font-normal tabular-nums text-white leading-none"
        >
          0%
        </span>
      </div>
    </div>
  );
}
