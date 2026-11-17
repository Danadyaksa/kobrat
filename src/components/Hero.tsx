"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import IrisCarousel from "./IrisCarousel";
import { getLenis } from "./SmoothScroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface HeroProps {
  introComplete: boolean;
  showSingleCard?: boolean;
  isBursting?: boolean;
}

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";
const TARGET_TEXT =
  "8 minds on one wavelength creating intuitive digital experiences.";

export default function Hero({
  introComplete,
  showSingleCard = false,
  isBursting = false,
}: HeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const copyScrollRef = useRef<HTMLDivElement>(null);
  const arrowLinkRef = useRef<HTMLAnchorElement>(null);
  const [displayText, setDisplayText] = useState(TARGET_TEXT);

  useEffect(() => {
    if (!introComplete) return;

    const targetText = TARGET_TEXT;
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

  // Scroll-scrubbed center copy recession as the 3D Iris ring tilts flat & opens outward
  useEffect(() => {
    const section = containerRef.current;
    const copyEl = copyScrollRef.current;
    const arrowEl = arrowLinkRef.current;
    if (!section || !copyEl) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        copyEl,
        { scale: 1, y: 0, opacity: 1 },
        {
          scale: 0.86,
          y: -38,
          opacity: 0,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 0.42)}`,
            scrub: 0.25,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (arrowEl) {
                arrowEl.style.pointerEvents =
                  self.progress > 0.25 ? "none" : "auto";
              }
            },
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleScrollToGallery = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const lenis = getLenis();
    if (lenis) {
      e.preventDefault();
      lenis.scrollTo("#gallery", { duration: 1.4 });
    }
  };

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative w-full h-[146dvh] select-none bg-transparent z-[30] pointer-events-none"
    >
      <div className="sticky top-0 w-full h-dvh flex items-center justify-center px-[3vw] pt-[52px] pb-[60px] overflow-x-clip">
        {/* 3D Rotating Iris Carousel with Burst Expansion & Scroll-Scrubbed Orbital Halo */}
        <IrisCarousel showSingleCard={showSingleCard} isBursting={isBursting} />

        {/* Center Copy Block */}
        <div
          className={`relative z-40 max-w-[560px] pointer-events-none flex flex-col items-center text-center px-4 transition-opacity duration-600 ${
            introComplete ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            ref={copyScrollRef}
            className="flex flex-col items-center text-center gap-3 will-change-transform"
          >
            {/* Display Title */}
            <h1 className="text-[clamp(21px,min(2.4vw,3.2svh),31px)] leading-[1.32] tracking-[-0.03em] text-[#0c0c0c] font-normal select-none">
              We’re{" "}
              <span
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[1.24em] lowercase leading-none inline-block text-[#0c0c0c]"
              >
                kobrat
              </span>
              , {displayText}
            </h1>

            {/* Scroll indicator pixel arrow */}
            <div className="mt-2 z-50">
              <a
                ref={arrowLinkRef}
                href="#gallery"
                onClick={handleScrollToGallery}
                aria-label="Scroll down to gallery"
                className="pointer-events-auto w-8 h-8 flex items-center justify-center text-[#0c0c0c] hover:opacity-60 hover:translate-y-1 transition-[transform,opacity] duration-200 cursor-pointer"
              >
                <svg
                  viewBox="0 0 9 9"
                  fill="currentColor"
                  shapeRendering="crispEdges"
                  className="w-[16px] h-[16px]"
                >
                  <path d="M4 0h1v1h-1zM4 1h1v1h-1zM4 2h1v1h-1zM0 3h1v1h-1zM4 3h1v1h-1zM8 3h1v1h-1zM0 4h2v1h-2zM4 4h1v1h-1zM7 4h2v1h-2zM1 5h2v1h-2zM4 5h1v1h-1zM6 5h2v1h-2zM2 6h5v1h-5zM3 7h3v1h-3zM4 8h1v1h-1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
