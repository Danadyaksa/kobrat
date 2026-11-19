"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { Moment, moments as staticMoments } from "@/data/moments";
import {
  members as staticMembers,
  findMemberBySlug,
  getMemberSlug,
} from "@/data/members";
import TransitionLink from "./TransitionLink";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function RollingText({ text }: { text: string }) {
  return (
    <span className="chars-inner" aria-hidden="true">
      {text.split("").map((char, index) => (
        <span key={index} style={{ "--i": index } as React.CSSProperties}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export default function CollectiveGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const entryStageRef = useRef<HTMLDivElement>(null);
  const stageTiltRef = useRef<HTMLDivElement>(null);
  const bgWordRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card1ImgRef = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card2ImgRef = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const card3ImgRef = useRef<HTMLDivElement>(null);

  const [momentsList, setMomentsList] = useState<Moment[]>(staticMoments);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [lightboxMoment, setLightboxMoment] = useState<Moment | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchMoments() {
      try {
        const res = await fetch("/api/moments", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setMomentsList(data);
          }
        }
      } catch (err) {
        console.error("Error fetching moments:", err);
      }
    }
    fetchMoments();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3 Flagship Moments for the Landing Page 3D Scroll Stack
  const featuredMoments = useMemo(() => {
    const slot1 = momentsList.find((m) => m.highlightSlot === 1);
    const slot2 = momentsList.find((m) => m.highlightSlot === 2);
    const slot3 = momentsList.find((m) => m.highlightSlot === 3);

    const card1 = slot1 || momentsList[0] || staticMoments[0];
    const card2 = slot2 || momentsList[1] || staticMoments[1];
    const card3 = slot3 || momentsList[5] || momentsList[2] || staticMoments[5];

    return [card1, card2, card3];
  }, [momentsList]);

  // Subtle 3D Mouse Tilt on the Stack (Matches the tactile feel of the top 3D Hero ring)
  useEffect(() => {
    const stageTilt = stageTiltRef.current;
    if (!stageTilt) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const xTo = gsap.quickTo(stageTilt, "rotationY", {
      duration: 0.7,
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(stageTilt, "rotationX", {
      duration: 0.7,
      ease: "power3.out",
    });

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      xTo(nx * 3.2);
      yTo(-ny * 2.4);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // GSAP ScrollTrigger 3-Act Spatial Deck Choreography
  useEffect(() => {
    const section = sectionRef.current;
    const bgWord = bgWordRef.current;
    const c1 = card1Ref.current;
    const c1Img = card1ImgRef.current;
    const c2 = card2Ref.current;
    const c2Img = card2ImgRef.current;
    const c3 = card3Ref.current;
    const c3Img = card3ImgRef.current;

    if (!section || !c1 || !c2 || !c3 || !c1Img || !c2Img || !c3Img) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      // Smooth spatial entry bloom as #gallery rises through the opening 3D Hero orbital halo
      if (entryStageRef.current) {
        gsap.fromTo(
          entryStageRef.current,
          { opacity: 0, scale: 0.88, y: 40 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 90%",
              end: "top 16%",
              scrub: 0.35,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      // Card 1 starts as a compact tilted aperture ready to bloom as user scrolls down from Hero
      gsap.set(c1, {
        yPercent: 22,
        rotation: 1.8,
        scale: 0.8,
        filter: "blur(0px)",
        opacity: 1,
        transformOrigin: "50% 50%",
      });
      gsap.set(c1Img, { scale: 1.0 });

      // Card 2 waits below the stage at a counter-angle
      gsap.set(c2, {
        yPercent: 115,
        rotation: -3.8,
        scale: 0.94,
        filter: "blur(10px)",
        opacity: 0.3,
        transformOrigin: "50% 50%",
      });
      gsap.set(c2Img, { scale: 1.0 });

      // Card 3 waits below the stage at a positive angle
      gsap.set(c3, {
        yPercent: 115,
        rotation: 3.4,
        scale: 0.94,
        filter: "blur(14px)",
        opacity: 0.2,
        transformOrigin: "50% 50%",
      });
      gsap.set(c3Img, { scale: 1.0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.35) {
              setActiveCardIndex(0);
            } else if (p < 0.68) {
              setActiveCardIndex(1);
            } else {
              setActiveCardIndex(2);
            }
          },
        },
      });

      // Background kinetic wordmark drift
      if (bgWord) {
        tl.fromTo(
          bgWord,
          { xPercent: 8 },
          { xPercent: -12, ease: "none", duration: 1 },
          0
        );
      }

      // ── ACT 1 (0.00 -> 0.28): Card 1 blooms open to full widescreen stage ──
      tl.to(
        c1,
        {
          yPercent: 3,
          rotation: -0.5,
          scale: 1,
          filter: "blur(0px)",
          opacity: 1,
          ease: "power2.out",
          duration: 0.28,
        },
        0
      ).to(
        c1Img,
        {
          scale: 1.0,
          ease: "power2.out",
          duration: 0.3,
        },
        0
      );

      // ── ACT 2 (0.28 -> 0.62): Card 1 recedes upward into 3D stack & blurs; Card 2 slices in and sharpens ──
      tl.to(
        c1,
        {
          yPercent: -4,
          rotation: -1.8,
          scale: 0.92,
          filter: "blur(8px)",
          opacity: 0.45,
          ease: "power2.inOut",
          duration: 0.32,
        },
        0.28
      )
        .to(
          c2,
          {
            yPercent: 3,
            rotation: 0.8,
            scale: 1,
            filter: "blur(0px)",
            opacity: 1,
            ease: "power2.out",
            duration: 0.32,
          },
          0.3
        )
        .to(
          c2Img,
          {
            scale: 1.0,
            ease: "power2.out",
            duration: 0.34,
          },
          0.3
        );

      // ── ACT 3 (0.62 -> 0.94): Card 1 & Card 2 form blurred stack behind; Card 3 takes foreground & sharpens ──
      tl.to(
        c1,
        {
          yPercent: -7,
          rotation: -2.4,
          scale: 0.86,
          filter: "blur(12px)",
          opacity: 0.25,
          ease: "power2.inOut",
          duration: 0.3,
        },
        0.62
      )
        .to(
          c2,
          {
            yPercent: -3,
            rotation: 1.6,
            scale: 0.93,
            filter: "blur(8px)",
            opacity: 0.45,
            ease: "power2.inOut",
            duration: 0.3,
          },
          0.62
        )
        .to(
          c3,
          {
            yPercent: 4,
            rotation: -0.6,
            scale: 1,
            filter: "blur(0px)",
            opacity: 1,
            ease: "power2.out",
            duration: 0.32,
          },
          0.64
        )
        .to(
          c3Img,
          {
            scale: 1.0,
            ease: "power2.out",
            duration: 0.34,
          },
          0.64
        );

      // Final settle (0.94 -> 1.00)
      tl.to(c3, { yPercent: 3, rotation: -0.2, filter: "blur(0px)", opacity: 1, duration: 0.06 }, 0.94);
    }, section);

    return () => ctx.revert();
  }, [featuredMoments]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxMoment(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const formatLocation = (loc: string, dateOrYear?: string) => {
    const cleanLoc = (loc || "").split("//")[0].trim();
    if (dateOrYear && dateOrYear.trim()) {
      return `${cleanLoc}${cleanLoc ? ", " : ""}${dateOrYear.trim()}`;
    }
    return cleanLoc;
  };

  return (
    <>
      <section
        ref={sectionRef}
        id="gallery"
        aria-label="Selected collective highlights"
        className="relative w-full h-[360vh] -mt-[46dvh] bg-transparent text-[#0c0c0c] select-none z-[20]"
      >
        {/* Sticky Full-Viewport Spatial Stage */}
        <div className="sticky top-0 h-dvh w-full overflow-hidden bg-transparent">
          <div
            ref={entryStageRef}
            className="relative w-full h-full flex flex-col justify-between will-change-transform"
          >
          {/* Giant Subtle Kinetic Background Wordmark (drifts with scroll) */}
          <div
            ref={bgWordRef}
            aria-hidden="true"
            style={{ fontFamily: "var(--font-wordmark)" }}
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-0 whitespace-nowrap text-[clamp(140px,24vw,340px)] lowercase text-[#f4f5f7] leading-none select-none z-[1] will-change-transform"
          >
            highlights · kobrat
          </div>

          {/* ─── Top Persistent Editorial HUD Bar ─── */}
          <div className="relative z-[45] w-full px-3 sm:px-[3vw] pt-[76px] sm:pt-[70px] md:pt-[64px] pb-2 flex items-end justify-between gap-3 sm:gap-4">
            <div className="flex items-baseline gap-2.5 sm:gap-4 shrink-0">
              <h2
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[clamp(26px,4.5vw,58px)] lowercase text-[#0c0c0c] leading-[1.18] pb-0.5 sm:pb-1"
              >
                highlights
              </h2>
              <span className="text-[11px] sm:text-[13px] text-[#767676] font-mono tracking-tight whitespace-nowrap">
                {activeCardIndex + 1} of 3
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 pb-1 shrink-0">
              <TransitionLink
                href="/gallery"
                data-cursor="OPEN GALLERY"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0c0c0c] text-white text-[11px] sm:text-[12px] whitespace-nowrap hover:bg-[#27272a] active:scale-[0.97] transition-[background-color,transform] duration-150 ease-out"
              >
                <RollingText text={`FULL GALLERY (${momentsList.length})`} />
              </TransitionLink>
            </div>
          </div>

          {/* ─── Center 3D Perspective Stack Stage ─── */}
          <div className="relative flex-1 w-full flex items-center justify-center perspective-1200 z-[20] pt-3 sm:pt-5 md:pt-7">
            <div
              ref={stageTiltRef}
              className="relative w-full h-full flex items-center justify-center transform-style-3d will-change-transform"
            >
              {/* ── CARD 1: First Flagship Widescreen Print ── */}
              <div
                ref={card1Ref}
                style={{ willChange: "transform, filter" }}
                className={`absolute w-[96vw] sm:w-[93vw] md:w-[90vw] max-w-[min(1100px,calc((100dvh-270px)*16/9))] bg-[#eceef2] p-2.5 sm:p-4 md:p-5 flex flex-col gap-2 sm:gap-3 z-[10] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#d8dce6] rounded-[4px] ${
                  activeCardIndex === 0
                    ? "pointer-events-auto"
                    : "pointer-events-none"
                }`}
              >
                <div className="flex items-center justify-between gap-2 sm:gap-4 px-1 py-0.5">
                  <div className="min-w-0">
                    <h3
                      style={{ fontFamily: "var(--font-wordmark)" }}
                      className="text-[clamp(18px,3.8vw,38px)] lowercase text-[#0c0c0c] leading-[1.28] pt-0.5 pb-1.5 overflow-visible tracking-normal whitespace-nowrap"
                    >
                      {featuredMoments[0].title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                    {featuredMoments[0].location && (
                      <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-[0.05em] text-[#767676]">
                        {formatLocation(
                          featuredMoments[0].location,
                          featuredMoments[0].year
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setLightboxMoment(featuredMoments[0])}
                      data-cursor="INSPECT"
                      className="text-[11px] sm:text-[13px] font-mono uppercase tracking-[0.04em] text-[#0c0c0c] underline underline-offset-4 cursor-pointer hover:opacity-60 transition-opacity whitespace-nowrap"
                    >
                      Inspect frame
                    </button>
                  </div>
                </div>

                {/* Exact 16:9 Landscape Frame (Zero Crop) */}
                <div
                  onClick={() => setLightboxMoment(featuredMoments[0])}
                  data-cursor="VIEW"
                  className="relative w-full aspect-[16/9] overflow-hidden bg-[#0c0c0c] cursor-pointer group rounded-[2px]"
                >
                  <div
                    ref={card1ImgRef}
                    className="relative w-full h-full will-change-transform"
                  >
                    <Image
                      src={featuredMoments[0].image}
                      alt={featuredMoments[0].title}
                      fill
                      priority
                      sizes="(max-width: 1280px) 92vw, 1120px"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
              </div>

              {/* ── CARD 2: Second Flagship Widescreen Print ── */}
              <div
                ref={card2Ref}
                style={{ willChange: "transform, filter" }}
                className={`absolute w-[96vw] sm:w-[93vw] md:w-[90vw] max-w-[min(1100px,calc((100dvh-270px)*16/9))] bg-[#ebe9e2] p-2.5 sm:p-4 md:p-5 flex flex-col gap-2 sm:gap-3 z-[20] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#dedcd4] rounded-[4px] ${
                  activeCardIndex === 1
                    ? "pointer-events-auto"
                    : "pointer-events-none"
                }`}
              >
                <div className="flex items-center justify-between gap-2 sm:gap-4 px-1 py-0.5">
                  <div className="min-w-0">
                    <h3
                      style={{ fontFamily: "var(--font-wordmark)" }}
                      className="text-[clamp(18px,3.8vw,38px)] lowercase text-[#0c0c0c] leading-[1.28] pt-0.5 pb-1.5 overflow-visible tracking-normal whitespace-nowrap"
                    >
                      {featuredMoments[1].title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                    {featuredMoments[1].location && (
                      <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-[0.05em] text-[#767676]">
                        {formatLocation(
                          featuredMoments[1].location,
                          featuredMoments[1].year
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setLightboxMoment(featuredMoments[1])}
                      data-cursor="INSPECT"
                      className="text-[11px] sm:text-[13px] font-mono uppercase tracking-[0.04em] text-[#0c0c0c] underline underline-offset-4 cursor-pointer hover:opacity-60 transition-opacity whitespace-nowrap"
                    >
                      Inspect frame
                    </button>
                  </div>
                </div>

                {/* Exact 16:9 Landscape Frame (Zero Crop) */}
                <div
                  onClick={() => setLightboxMoment(featuredMoments[1])}
                  data-cursor="VIEW"
                  className="relative w-full aspect-[16/9] overflow-hidden bg-[#0c0c0c] cursor-pointer group rounded-[2px]"
                >
                  <div
                    ref={card2ImgRef}
                    className="relative w-full h-full will-change-transform"
                  >
                    <Image
                      src={featuredMoments[1].image}
                      alt={featuredMoments[1].title}
                      fill
                      sizes="(max-width: 1280px) 96vw, 1120px"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
              </div>

              {/* ── CARD 3: Third Flagship Widescreen Print ── */}
              <div
                ref={card3Ref}
                style={{ willChange: "transform, filter" }}
                className={`absolute w-[96vw] sm:w-[93vw] md:w-[90vw] max-w-[min(1100px,calc((100dvh-270px)*16/9))] bg-[#dfe3ec] p-2.5 sm:p-4 md:p-5 flex flex-col gap-2 sm:gap-3 z-[30] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#d2d6e2] rounded-[4px] ${
                  activeCardIndex === 2
                    ? "pointer-events-auto"
                    : "pointer-events-none"
                }`}
              >
                <div className="flex items-center justify-between gap-2 sm:gap-4 px-1 py-0.5">
                  <div className="min-w-0">
                    <h3
                      style={{ fontFamily: "var(--font-wordmark)" }}
                      className="text-[clamp(18px,3.8vw,38px)] lowercase text-[#0c0c0c] leading-[1.28] pt-0.5 pb-1.5 overflow-visible tracking-normal whitespace-nowrap"
                    >
                      {featuredMoments[2].title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                    {featuredMoments[2].location && (
                      <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-[0.05em] text-[#767676]">
                        {formatLocation(
                          featuredMoments[2].location,
                          featuredMoments[2].year
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setLightboxMoment(featuredMoments[2])}
                      data-cursor="INSPECT"
                      className="text-[11px] sm:text-[13px] font-mono uppercase tracking-[0.04em] text-[#0c0c0c] underline underline-offset-4 cursor-pointer hover:opacity-60 transition-opacity whitespace-nowrap"
                    >
                      Inspect frame
                    </button>
                  </div>
                </div>

                {/* Exact 16:9 Landscape Frame (Zero Crop) */}
                <div
                  onClick={() => setLightboxMoment(featuredMoments[2])}
                  data-cursor="VIEW"
                  className="relative w-full aspect-[16/9] overflow-hidden bg-[#0c0c0c] cursor-pointer group rounded-[2px]"
                >
                  <div
                    ref={card3ImgRef}
                    className="relative w-full h-full will-change-transform"
                  >
                    <Image
                      src={featuredMoments[2].image}
                      alt={featuredMoments[2].title}
                      fill
                      sizes="(max-width: 1280px) 96vw, 1120px"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Bottom Stage Status Bar ─── */}
          <div className="relative z-[45] w-full px-3 sm:px-[3vw] pb-3 sm:pb-5 flex items-center justify-between text-[11px] sm:text-[13px] text-[#52525b] gap-2">
            <div className="flex items-center gap-2 sm:gap-3 truncate">
              <span className="truncate">
                {featuredMoments[activeCardIndex] &&
                  formatLocation(
                    featuredMoments[activeCardIndex].location,
                    featuredMoments[activeCardIndex].year
                  )}
              </span>
            </div>

            <TransitionLink
              href="/gallery"
              data-cursor="ALL FRAMES"
              className="text-[#0c0c0c] underline underline-offset-4 hover:opacity-65 transition-opacity whitespace-nowrap shrink-0"
            >
              Explore all {momentsList.length} frames in gallery
            </TransitionLink>
          </div>
          </div>
        </div>
      </section>

      {/* ─── Fullscreen High-Resolution Lightbox Modal (Portaled above Header) ─── */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {lightboxMoment && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-[999] bg-[#0c0c0c]/95 flex flex-col justify-between p-4 md:p-8 select-none text-white"
              >
                {/* Modal Top Bar */}
                <div className="flex items-center justify-between w-full z-10 text-[13px] text-white/80">
                  <div className="flex items-baseline gap-4">
                    <span
                      style={{ fontFamily: "var(--font-wordmark)" }}
                      className="text-[24px] lowercase text-white leading-none"
                    >
                      {lightboxMoment.title}
                    </span>
                    <span className="hidden sm:inline text-white/50">
                      {formatLocation(
                        lightboxMoment.location,
                        lightboxMoment.year
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <TransitionLink
                      href="/gallery"
                      onClick={() => setLightboxMoment(null)}
                      className="px-4 py-2 bg-white/10 hover:bg-white hover:text-[#0c0c0c] transition-colors text-white text-[12px]"
                    >
                      Open full gallery
                    </TransitionLink>
                    <button
                      type="button"
                      onClick={() => setLightboxMoment(null)}
                      className="px-4 py-2 bg-white text-[#0c0c0c] hover:bg-white/85 transition-colors text-[12px] font-medium cursor-pointer active:scale-[0.97]"
                    >
                      Close (Esc)
                    </button>
                  </div>
                </div>

                {/* Modal Center Image */}
                <div
                  onClick={() => setLightboxMoment(null)}
                  className="relative flex-1 w-full max-h-[78vh] flex items-center justify-center my-4 cursor-pointer"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full h-full max-w-6xl overflow-hidden"
                  >
                    <Image
                      src={lightboxMoment.image}
                      alt={lightboxMoment.title}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                {/* Modal Bottom Description & Members */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full z-10 text-[13px] text-white/70">
                  <p className="max-w-xl text-white/80 leading-relaxed">
                    {lightboxMoment.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {lightboxMoment.members
                      .filter((slug) => Boolean(findMemberBySlug(staticMembers, slug)))
                      .map((slug) => {
                        const member = findMemberBySlug(staticMembers, slug);
                        const targetSlug = member ? getMemberSlug(member) : slug.toLowerCase();
                        const label = member ? (member.nickname || member.name) : slug;

                        return (
                          <TransitionLink
                            key={slug}
                            href={`/${targetSlug}`}
                            className="px-3 py-1 bg-white/10 hover:bg-white hover:text-[#0c0c0c] transition-colors text-white text-[12px] capitalize"
                          >
                            {label}
                          </TransitionLink>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
