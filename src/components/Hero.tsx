"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import IrisCarousel from "./IrisCarousel";

interface HeroProps {
  introComplete: boolean;
  showSingleCard?: boolean;
  isBursting?: boolean;
}

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";

export default function Hero({
  introComplete,
  showSingleCard = false,
  isBursting = false,
}: HeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [displayText, setDisplayText] = useState(
    "8 minds on one wavelength creating intuitive digital experiences."
  );

  useEffect(() => {
    if (!introComplete) return;

    const targetText =
      "8 minds on one wavelength creating intuitive digital experiences.";
    const duration = 1.2;
    const progressObj = { progress: 0 };

    const tween = gsap.to(progressObj, {
      progress: 1,
      duration: duration,
      ease: "power2.out",
      onUpdate: () => {
        const p = progressObj.progress;
        const totalLen = targetText.length;
        const resolvedLen = Math.floor(p * totalLen);

        let result = "";
        for (let i = 0; i < totalLen; i++) {
          if (i < resolvedLen) {
            result += targetText[i];
          } else if (targetText[i] === " " || targetText[i] === ".") {
            result += targetText[i];
          } else {
            result += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        setDisplayText(result);
      },
      onComplete: () => {
        setDisplayText(targetText);
      },
    });

    return () => {
      tween.kill();
    };
  }, [introComplete]);

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative w-full min-h-screen flex items-center justify-center px-[3vw] pt-[52px] pb-[60px] overflow-hidden select-none bg-transparent"
    >
      {/* 3D Rotating Iris Carousel with Burst Expansion */}
      <IrisCarousel showSingleCard={showSingleCard} isBursting={isBursting} />

      {/* Center Copy Block - hidden during preloader, smoothly fades in once burst/intro completes */}
      <div
        className={`relative z-40 max-w-[620px] pointer-events-none flex flex-col items-center text-center gap-4 px-4 transition-opacity duration-600 ${
          introComplete ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Display Title with We're and exact Gossip HighPixel name mark */}
        <h1 className="text-[clamp(24px,2.5vw,42px)] leading-[1.22] tracking-[-0.035em] text-[#0c0c0c] font-normal select-none">
          We’re{" "}
          <span
            style={{ fontFamily: "var(--font-wordmark)" }}
            className="text-[1.35em] lowercase leading-none inline-block text-[#0c0c0c]"
          >
            kobrat
          </span>
          , {displayText}
        </h1>

        {/* Scroll indicator pixel arrow */}
        <div className="mt-2 pointer-events-auto">
          <a
            href="#members"
            aria-label="Scroll down"
            className="w-8 h-8 flex items-center justify-center text-[#0c0c0c] hover:opacity-60 transition-opacity animate-bounce"
          >
            <svg
              viewBox="0 0 9 9"
              fill="currentColor"
              shapeRendering="crispEdges"
              className="w-[18px] h-[18px]"
            >
              <path d="M4 0h1v1h-1zM4 1h1v1h-1zM4 2h1v1h-1zM0 3h1v1h-1zM4 3h1v1h-1zM8 3h1v1h-1zM0 4h2v1h-2zM4 4h1v1h-1zM7 4h2v1h-2zM1 5h2v1h-2zM4 5h1v1h-1zM6 5h2v1h-2zM2 6h5v1h-5zM3 7h3v1h-3zM4 8h1v1h-1z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
