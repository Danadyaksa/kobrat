"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { members } from "@/data/members";

interface PreloaderProps {
  onBurst?: () => void;
  onComplete?: () => void;
}

export default function Preloader({ onBurst, onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const textClipRef = useRef<SVGRectElement>(null);
  const wordmarkBoxRef = useRef<HTMLDivElement>(null);
  const singleCardRef = useRef<HTMLDivElement>(null);
  const sideTextsRef = useRef<HTMLDivElement>(null);

  const [isDone, setIsDone] = useState(false);
  const onBurstRef = useRef(onBurst);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onBurstRef.current = onBurst;
    onCompleteRef.current = onComplete;
  }, [onBurst, onComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const counterObj = { value: 0 };
      const duration = prefersReducedMotion ? 0.3 : 1.8;

      const tl = gsap.timeline();

      // Phase 1: Progressive text fill (0% -> 100%)
      tl.to(counterObj, {
        value: 100,
        duration: duration,
        ease: "power2.inOut",
        onUpdate: () => {
          const val = Math.round(counterObj.value);
          if (counterRef.current) {
            counterRef.current.textContent = `${val}%`;
          }
          if (textClipRef.current) {
            textClipRef.current.setAttribute("width", `${val}%`);
          }
        },
      });

      // Phase 2: Fade side texts and move wordmark up to header position
      tl.to(
        sideTextsRef.current,
        {
          opacity: 0,
          duration: 0.4,
          ease: "power1.out",
        },
        "+=0.1"
      );

      tl.to(
        wordmarkBoxRef.current,
        {
          y: -window.innerHeight * 0.42,
          scale: 0.32,
          duration: 0.9,
          ease: "expo.inOut",
        },
        "<"
      );

      // Phase 3: Single card appears in the center of the black screen (matches Image 2!)
      tl.fromTo(
        singleCardRef.current,
        {
          opacity: 0,
          scale: 0.8,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: "expo.out",
        },
        "-=0.5"
      );

      // Hold single card for a brief moment so user sees it clearly
      tl.to({}, { duration: 0.45 });

      // Phase 4: Trigger the Burst into the 3D ring!
      tl.call(() => {
        onBurstRef.current?.();
      });

      // Veil fades out to reveal the white hero underneath with the cards fanning out
      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.65,
          ease: "sine.inOut",
          onComplete: () => {
            setIsDone(true);
            onCompleteRef.current?.();
          },
        },
        "+=0.1"
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#0c0c0c] text-white flex flex-col items-center justify-center pointer-events-none select-none will-change-transform"
    >
      {/* Top / Side texts */}
      <div
        ref={sideTextsRef}
        className="absolute inset-x-0 top-0 h-[52px] px-[3vw] flex items-center justify-between pointer-events-none"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[#ffffff8c]">
          Friendship circle
        </span>
        <span
          ref={counterRef}
          className="font-mono text-[11px] tracking-[0.04em] tabular-nums text-white"
        >
          0%
        </span>
      </div>

      {/* Center Wordmark with exact SVG progressive wipe mask (Image 3 & 4) */}
      <div
        ref={wordmarkBoxRef}
        className="relative z-10 w-[min(84vw,620px)] flex items-center justify-center will-change-transform"
      >
        <svg
          viewBox="0 0 500 120"
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <clipPath id="intro-name-wipe">
              <rect ref={textClipRef} x="0" y="0" width="0%" height="100%" />
            </clipPath>
          </defs>

          {/* Dim base text (35% opacity) */}
          <text
            x="50%"
            y="70%"
            textAnchor="middle"
            fill="#ffffff35"
            style={{
              fontFamily: "var(--font-wordmark)",
              fontSize: "92px",
              letterSpacing: "0px",
            }}
          >
            kobrat
          </text>

          {/* Bright white fill progressively revealed by clipPath */}
          <text
            x="50%"
            y="70%"
            textAnchor="middle"
            fill="#ffffff"
            clipPath="url(#intro-name-wipe)"
            style={{
              fontFamily: "var(--font-wordmark)",
              fontSize: "92px",
              letterSpacing: "0px",
            }}
          >
            kobrat
          </text>
        </svg>
      </div>

      {/* Single Center Card (appears right before the burst, Image 2!) */}
      <div
        ref={singleCardRef}
        className="absolute w-[145px] h-[190px] rounded-[6px] overflow-hidden bg-[#1e1e1e] shadow-2xl opacity-0 will-change-transform z-20 pointer-events-none"
      >
        <Image
          src={members[0].image}
          alt={members[0].name}
          fill
          sizes="145px"
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}
