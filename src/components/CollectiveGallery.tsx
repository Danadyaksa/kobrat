"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { Moment, moments as staticMoments } from "@/data/moments";
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
  const introSheetRef = useRef<HTMLDivElement>(null);
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

  // 3 Flagship Moments for the Landing Page Scroll Stack
  const featuredMoments = useMemo(() => {
    const slot1 = momentsList.find((m) => m.highlightSlot === 1);
    const slot2 = momentsList.find((m) => m.highlightSlot === 2);
    const slot3 = momentsList.find((m) => m.highlightSlot === 3);

    const card1 = slot1 || momentsList[0] || staticMoments[0];
    const card2 = slot2 || momentsList[1] || staticMoments[1];
    const card3 = slot3 || momentsList[5] || momentsList[2] || staticMoments[5];

    return [card1, card2, card3];
  }, [momentsList]);

  // GSAP ScrollTrigger Multi-Phase Choreography (inspired by The Line Studio)
  useEffect(() => {
    const section = sectionRef.current;
    const intro = introSheetRef.current;
    const c1 = card1Ref.current;
    const c1Img = card1ImgRef.current;
    const c2 = card2Ref.current;
    const c2Img = card2ImgRef.current;
    const c3 = card3Ref.current;
    const c3Img = card3ImgRef.current;

    if (!section || !intro || !c1 || !c2 || !c3 || !c1Img || !c2Img || !c3Img) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      // Initial states:
      // Card 1 starts peeking at the bottom edge with a slight tilt
      gsap.set(c1, {
        yPercent: 42,
        rotation: 2.2,
        scale: 0.98,
        transformOrigin: "50% 50%",
      });
      gsap.set(c1Img, { scale: 1.12 });

      // Card 2 waits below viewport at a counter-tilt
      gsap.set(c2, {
        yPercent: 110,
        rotation: -4.2,
        scale: 1,
        transformOrigin: "50% 50%",
      });
      gsap.set(c2Img, { scale: 1.14 });

      // Card 3 waits below viewport at a positive tilt
      gsap.set(c3, {
        yPercent: 110,
        rotation: 4.0,
        scale: 1,
        transformOrigin: "50% 50%",
      });
      gsap.set(c3Img, { scale: 1.14 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.55,
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.36) {
              setActiveCardIndex(0);
            } else if (p < 0.68) {
              setActiveCardIndex(1);
            } else {
              setActiveCardIndex(2);
            }
          },
        },
      });

      // ── ACT 1 (0.00 -> 0.28): Intro tilts back, Card 1 rises to stage ──
      tl.to(
        intro,
        {
          yPercent: -14,
          rotation: -1.5,
          scale: 0.95,
          opacity: 0.35,
          ease: "power2.inOut",
          duration: 0.28,
        },
        0
      )
        .to(
          c1,
          {
            yPercent: 0,
            rotation: -0.6,
            scale: 1,
            ease: "power2.out",
            duration: 0.28,
          },
          0
        )
        .to(
          c1Img,
          {
            scale: 1.0,
            ease: "power2.out",
            duration: 0.32,
          },
          0
        );

      // ── ACT 2 (0.28 -> 0.62): Card 1 glides up so its landscape photo peeks at top; Card 2 slices in ──
      tl.to(
        c1,
        {
          yPercent: -13,
          rotation: -1.6,
          scale: 0.96,
          ease: "power2.inOut",
          duration: 0.32,
        },
        0.28
      )
        .to(
          c2,
          {
            yPercent: 3,
            rotation: 1.1,
            scale: 1,
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

      // ── ACT 3 (0.62 -> 0.94): Card 2 glides up; Card 3 slices in ──
      tl.to(
        c1,
        {
          yPercent: -18,
          rotation: -2.2,
          scale: 0.93,
          ease: "power2.inOut",
          duration: 0.3,
        },
        0.62
      )
        .to(
          c2,
          {
            yPercent: -11,
            rotation: 1.8,
            scale: 0.97,
            ease: "power2.inOut",
            duration: 0.3,
          },
          0.62
        )
        .to(
          c3,
          {
            yPercent: 4,
            rotation: -0.9,
            scale: 1,
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

      // Final subtle hold (0.94 -> 1.00)
      tl.to(c3, { yPercent: 2, rotation: -0.4, duration: 0.06 }, 0.94);
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

  const formatLocation = (loc: string, year: string) => {
    const cleanLoc = loc.split("//")[0].trim();
    return `${cleanLoc}, ${year}`;
  };

  return (
    <>
      <section
        ref={sectionRef}
        id="gallery"
        aria-label="Selected collective highlights"
        className="relative w-full h-[420vh] bg-white text-[#0c0c0c] select-none"
      >
        {/* Sticky Full-Viewport Choreographed Stage */}
        <div className="sticky top-0 h-dvh w-full overflow-hidden bg-white">
          {/* ─── LAYER 0: Editorial Masthead Sheet (Tilts & recedes on scroll) ─── */}
          <div
            ref={introSheetRef}
            className="absolute inset-x-0 top-0 h-[56vh] bg-white px-[4vw] pt-[96px] pb-8 flex flex-col justify-between z-[5] origin-top"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[clamp(52px,8vw,116px)] lowercase text-[#0c0c0c] leading-[1.12] tracking-[-0.02em]"
                >
                  highlights
                </h2>
                <p className="mt-6 max-w-[46ch] text-[16px] md:text-[18px] text-[#0c0c0c] leading-[1.5]">
                  Three selected frames from our collective archive. Scroll to
                  step through the reels, or enter the dedicated gallery.
                </p>
              </div>

              {/* Direct Navigation Links (Matching The Line Studio's underlined dual links) */}
              <div className="flex flex-wrap items-center gap-8 pb-2">
                <TransitionLink
                  href="/gallery"
                  data-cursor="GALLERY"
                  className="group inline-flex items-baseline gap-2 text-[18px] md:text-[21px] font-normal tracking-[-0.02em] text-[#0c0c0c] underline underline-offset-8 decoration-[1.5px] hover:opacity-65 transition-opacity"
                >
                  <span>The Gallery</span>
                  <span className="text-[12px] text-[#767676] font-normal">
                    ({momentsList.length})
                  </span>
                </TransitionLink>

                <a
                  href="#home"
                  className="group inline-flex items-baseline gap-2 text-[18px] md:text-[21px] font-normal tracking-[-0.02em] text-[#0c0c0c] underline underline-offset-8 decoration-[1.5px] hover:opacity-65 transition-opacity"
                >
                  <span>The Collective</span>
                </a>
              </div>
            </div>
          </div>

          {/* ─── LAYER 1: Flagship Card 1 ─── */}
          <div
            ref={card1Ref}
            className="absolute inset-x-0 top-[10vh] w-[104vw] -left-[2vw] h-[86vh] bg-[#e6e8ee] flex flex-col justify-between pb-[4vh] z-[10] will-change-transform"
          >
            {/* Card Sheet Top Header */}
            <div className="h-[11vh] min-h-[72px] px-[5vw] pt-[2vh] pb-[1.5vh] flex items-end justify-between gap-4 shrink-0">
              <div className="flex items-baseline gap-4 min-w-0">
                <h3
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[clamp(26px,4vw,56px)] lowercase text-[#0c0c0c] leading-[1.08]"
                >
                  {featuredMoments[0].title}
                </h3>
                <span className="hidden lg:inline-block text-[14px] text-[#52525b] shrink-0">
                  {formatLocation(
                    featuredMoments[0].location,
                    featuredMoments[0].year
                  )}
                </span>
              </div>

              <div className="flex items-center gap-6 shrink-0 pb-1">
                <button
                  type="button"
                  onClick={() => setLightboxMoment(featuredMoments[0])}
                  data-cursor="INSPECT"
                  className="text-[15px] md:text-[17px] text-[#0c0c0c] underline underline-offset-4 decoration-[1.5px] hover:opacity-60 transition-opacity cursor-pointer"
                >
                  View moment
                </button>
              </div>
            </div>

            {/* Sleek Widescreen Landscape Artwork Frame (2.1:1 / 16:9 Cinema Proportions) */}
            <div
              onClick={() => setLightboxMoment(featuredMoments[0])}
              data-cursor="VIEW"
              className="relative w-[92vw] max-w-[1440px] h-[54vh] md:h-[62vh] max-h-[560px] mx-auto overflow-hidden bg-[#0c0c0c] cursor-pointer group"
            >
              <div ref={card1ImgRef} className="relative w-full h-full will-change-transform">
                <Image
                  src={featuredMoments[0].image}
                  alt={featuredMoments[0].title}
                  fill
                  priority
                  sizes="92vw"
                  className="object-cover object-[center_62%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>

          {/* ─── LAYER 2: Flagship Card 2 (Slices diagonally across Card 1's photo) ─── */}
          <div
            ref={card2Ref}
            className="absolute inset-x-0 top-[10vh] w-[104vw] -left-[2vw] h-[86vh] bg-[#eceae4] flex flex-col justify-between pb-[4vh] z-[20] will-change-transform"
          >
            {/* Card Sheet Top Header */}
            <div className="h-[11vh] min-h-[72px] px-[5vw] pt-[2vh] pb-[1.5vh] flex items-end justify-between gap-4 shrink-0">
              <div className="flex items-baseline gap-4 min-w-0">
                <h3
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[clamp(26px,4vw,56px)] lowercase text-[#0c0c0c] leading-[1.08]"
                >
                  {featuredMoments[1].title}
                </h3>
                <span className="hidden lg:inline-block text-[14px] text-[#52525b] shrink-0">
                  {formatLocation(
                    featuredMoments[1].location,
                    featuredMoments[1].year
                  )}
                </span>
              </div>

              <div className="flex items-center gap-6 shrink-0 pb-1">
                <button
                  type="button"
                  onClick={() => setLightboxMoment(featuredMoments[1])}
                  data-cursor="INSPECT"
                  className="text-[15px] md:text-[17px] text-[#0c0c0c] underline underline-offset-4 decoration-[1.5px] hover:opacity-60 transition-opacity cursor-pointer"
                >
                  View moment
                </button>
              </div>
            </div>

            {/* Sleek Widescreen Landscape Artwork Frame */}
            <div
              onClick={() => setLightboxMoment(featuredMoments[1])}
              data-cursor="VIEW"
              className="relative w-[92vw] max-w-[1440px] h-[54vh] md:h-[62vh] max-h-[560px] mx-auto overflow-hidden bg-[#0c0c0c] cursor-pointer group"
            >
              <div ref={card2ImgRef} className="relative w-full h-full will-change-transform">
                <Image
                  src={featuredMoments[1].image}
                  alt={featuredMoments[1].title}
                  fill
                  sizes="92vw"
                  className="object-cover object-[center_55%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>

          {/* ─── LAYER 3: Flagship Card 3 (Slices across Card 2's photo) ─── */}
          <div
            ref={card3Ref}
            className="absolute inset-x-0 top-[10vh] w-[104vw] -left-[2vw] h-[86vh] bg-[#dfe3ec] flex flex-col justify-between pb-[4vh] z-[30] will-change-transform"
          >
            {/* Card Sheet Top Header */}
            <div className="h-[11vh] min-h-[72px] px-[5vw] pt-[2vh] pb-[1.5vh] flex items-end justify-between gap-4 shrink-0">
              <div className="flex items-baseline gap-4 min-w-0">
                <h3
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[clamp(26px,4vw,56px)] lowercase text-[#0c0c0c] leading-[1.08]"
                >
                  {featuredMoments[2].title}
                </h3>
                <span className="hidden lg:inline-block text-[14px] text-[#52525b] shrink-0">
                  {formatLocation(
                    featuredMoments[2].location,
                    featuredMoments[2].year
                  )}
                </span>
              </div>

              <div className="flex items-center gap-6 shrink-0 pb-1">
                <button
                  type="button"
                  onClick={() => setLightboxMoment(featuredMoments[2])}
                  data-cursor="INSPECT"
                  className="text-[15px] md:text-[17px] text-[#0c0c0c] underline underline-offset-4 decoration-[1.5px] hover:opacity-60 transition-opacity cursor-pointer"
                >
                  View moment
                </button>
              </div>
            </div>

            {/* Sleek Widescreen Landscape Artwork Frame */}
            <div
              onClick={() => setLightboxMoment(featuredMoments[2])}
              data-cursor="VIEW"
              className="relative w-[92vw] max-w-[1440px] h-[54vh] md:h-[62vh] max-h-[560px] mx-auto overflow-hidden bg-[#0c0c0c] cursor-pointer group"
            >
              <div ref={card3ImgRef} className="relative w-full h-full will-change-transform">
                <Image
                  src={featuredMoments[2].image}
                  alt={featuredMoments[2].title}
                  fill
                  sizes="92vw"
                  className="object-cover object-[center_55%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>

          {/* Floating Bottom-Left Progress Pill (Minimal tactile indicator) */}
          <div className="pointer-events-none absolute bottom-5 left-[3vw] z-[40] hidden sm:flex items-center gap-3 bg-[#0c0c0c] text-white px-3.5 py-1.5 text-[12px]">
            <span>
              {activeCardIndex + 1} of 3
            </span>
            <span className="text-white/40">/</span>
            <span className="lowercase" style={{ fontFamily: "var(--font-wordmark)" }}>
              {featuredMoments[activeCardIndex]?.title}
            </span>
          </div>
        </div>
      </section>

      {/* ─── Editorial Bridge to the Dedicated /gallery Page ─── */}
      <section
        aria-label="Explore full gallery archive"
        className="relative w-full bg-[#0c0c0c] text-white px-[3vw] py-24 md:py-32 z-[50]"
      >
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-4 max-w-2xl">
            <h2
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[clamp(44px,7vw,96px)] lowercase leading-[0.92] text-white"
            >
              the full archive
            </h2>
            <p className="text-[16px] md:text-[18px] text-white/75 leading-[1.55] max-w-[52ch]">
              Every frame from our studio sessions, Jakarta rooftops, and late
              night road trips lives in the dedicated gallery. Browse by
              editorial spread or interactive index.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <TransitionLink
              href="/gallery"
              data-cursor="OPEN GALLERY"
              className="inline-flex items-center justify-center h-[52px] px-8 bg-white text-[#0c0c0c] text-[14px] font-medium tracking-[-0.01em] hover:bg-[#e4e6eb] active:scale-[0.97] transition-[background-color,transform] duration-150 ease-out cursor-pointer"
            >
              <RollingText text={`ENTER GALLERY (${momentsList.length} FRAMES)`} />
            </TransitionLink>
          </div>
        </div>
      </section>

      {/* ─── Fullscreen High-Resolution Lightbox Modal ─── */}
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
                  {formatLocation(lightboxMoment.location, lightboxMoment.year)}
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
                {lightboxMoment.members.map((slug) => (
                  <TransitionLink
                    key={slug}
                    href={`/${slug}`}
                    className="px-3 py-1 bg-white/10 hover:bg-white hover:text-[#0c0c0c] transition-colors text-white text-[12px] capitalize"
                  >
                    {slug}
                  </TransitionLink>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
