"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Moment, moments as staticMoments } from "@/data/moments";
import TransitionLink from "./TransitionLink";
import { getLenis } from "./SmoothScroll";

export default function CollectiveGallery() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredMomentId, setHoveredMomentId] = useState<number | null>(null);
  const [lightboxMoment, setLightboxMoment] = useState<Moment | null>(null);

  // Divide moments into two staggered continuous tracks
  const row1Moments = useMemo(() => staticMoments.slice(0, 4), []);
  const row2Moments = useMemo(() => staticMoments.slice(4, 8), []);

  // Duplicate for seamless infinite wrapping
  const row1Items = useMemo(
    () => [...row1Moments, ...row1Moments, ...row1Moments],
    [row1Moments]
  );
  const row2Items = useMemo(
    () => [...row2Moments, ...row2Moments, ...row2Moments],
    [row2Moments]
  );

  // Track DOM and state references
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    pos1: 0,
    pos2: -1200,
    halfWidth1: 2400,
    halfWidth2: 2400,
    isHovered1: false,
    isHovered2: false,
    isDragging1: false,
    isDragging2: false,
    dragLastX1: 0,
    dragLastX2: 0,
    dragVel1: 0,
    dragVel2: 0,
    dragDist1: 0,
    dragDist2: 0,
  });

  // Calculate widths on mount and resize
  useEffect(() => {
    function measureWidths() {
      if (track1Ref.current) {
        stateRef.current.halfWidth1 = track1Ref.current.scrollWidth / 3;
      }
      if (track2Ref.current) {
        stateRef.current.halfWidth2 = track2Ref.current.scrollWidth / 3;
      }
    }

    measureWidths();
    window.addEventListener("resize", measureWidths);
    const timer = setTimeout(measureWidths, 400);

    return () => {
      window.removeEventListener("resize", measureWidths);
      clearTimeout(timer);
    };
  }, []);

  // Continuous RAF loop with smooth autoscroll + scroll velocity coupling
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;

    function renderLoop(now: number) {
      const dtMs = Math.min(50, Math.max(1, now - lastTime));
      const dtSec = dtMs / 1000;
      lastTime = now;
      const frameDelta = dtSec * 60;

      const s = stateRef.current;

      // Query scroll velocity from Lenis or calculate fallback from window.scrollY
      const lenis = getLenis();
      const lenisVel = lenis?.velocity ?? 0;
      const curScrollY = window.scrollY;
      const nativeVel = ((curScrollY - lastScrollY) / dtMs) * 16.67;
      lastScrollY = curScrollY;

      const scrollVel = Math.abs(lenisVel) > 0.05 ? lenisVel : nativeVel;
      const scrollBoost = Math.max(-15, Math.min(15, scrollVel * 0.35));

      // ─── Row 1: Moves Left ───
      if (!s.isDragging1) {
        // Decay flick momentum
        s.dragVel1 *= Math.pow(0.08, dtSec);
        if (Math.abs(s.dragVel1) < 1e-4) s.dragVel1 = 0;

        if (isPlaying) {
          const baseSpeed1 = s.isHovered1 ? 0.15 : 0.85;
          const delta1 = (baseSpeed1 + scrollBoost + s.dragVel1) * frameDelta;
          s.pos1 -= delta1;
        } else {
          s.pos1 -= (scrollBoost + s.dragVel1) * frameDelta;
        }

        // Infinite wrap
        const limit1 = s.halfWidth1 || 2400;
        if (s.pos1 <= -limit1) {
          s.pos1 += limit1;
        } else if (s.pos1 >= 0) {
          s.pos1 -= limit1;
        }
      }

      // ─── Row 2: Moves Right ───
      if (!s.isDragging2) {
        // Decay flick momentum
        s.dragVel2 *= Math.pow(0.08, dtSec);
        if (Math.abs(s.dragVel2) < 1e-4) s.dragVel2 = 0;

        if (isPlaying) {
          const baseSpeed2 = s.isHovered2 ? 0.15 : 0.72;
          const delta2 = (baseSpeed2 + scrollBoost * 0.85 - s.dragVel2) * frameDelta;
          s.pos2 += delta2;
        } else {
          s.pos2 += (scrollBoost * 0.85 - s.dragVel2) * frameDelta;
        }

        // Infinite wrap
        const limit2 = s.halfWidth2 || 2400;
        if (s.pos2 >= 0) {
          s.pos2 -= limit2;
        } else if (s.pos2 <= -limit2) {
          s.pos2 += limit2;
        }
      }

      // Apply transforms
      if (track1Ref.current) {
        track1Ref.current.style.transform = `translate3d(${s.pos1.toFixed(2)}px, 0, 0)`;
      }
      if (track2Ref.current) {
        track2Ref.current.style.transform = `translate3d(${s.pos2.toFixed(2)}px, 0, 0)`;
      }

      animId = requestAnimationFrame(renderLoop);
    }

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Pointer Drag Handlers for Track 1
  const handlePointerDown1 = (e: React.PointerEvent) => {
    const s = stateRef.current;
    s.isDragging1 = true;
    s.dragLastX1 = e.clientX;
    s.dragVel1 = 0;
    s.dragDist1 = 0;
  };

  // Pointer Drag Handlers for Track 2
  const handlePointerDown2 = (e: React.PointerEvent) => {
    const s = stateRef.current;
    s.isDragging2 = true;
    s.dragLastX2 = e.clientX;
    s.dragVel2 = 0;
    s.dragDist2 = 0;
  };

  // Global Pointer Listeners for seamless dragging
  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const s = stateRef.current;
      if (s.isDragging1) {
        const dx = e.clientX - s.dragLastX1;
        s.pos1 += dx;
        s.dragVel1 = dx * -0.5;
        s.dragDist1 += Math.abs(dx);
        s.dragLastX1 = e.clientX;
        if (track1Ref.current) {
          track1Ref.current.style.transform = `translate3d(${s.pos1.toFixed(2)}px, 0, 0)`;
        }
      }
      if (s.isDragging2) {
        const dx = e.clientX - s.dragLastX2;
        s.pos2 += dx;
        s.dragVel2 = dx * 0.5;
        s.dragDist2 += Math.abs(dx);
        s.dragLastX2 = e.clientX;
        if (track2Ref.current) {
          track2Ref.current.style.transform = `translate3d(${s.pos2.toFixed(2)}px, 0, 0)`;
        }
      }
    }

    function handlePointerUp() {
      stateRef.current.isDragging1 = false;
      stateRef.current.isDragging2 = false;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  // Keyboard navigation for Lightbox
  const handleNext = useCallback(() => {
    if (!lightboxMoment) return;
    const currentIndex = staticMoments.findIndex((m) => m.id === lightboxMoment.id);
    const nextIndex = (currentIndex + 1) % staticMoments.length;
    setLightboxMoment(staticMoments[nextIndex]);
  }, [lightboxMoment]);

  const handlePrev = useCallback(() => {
    if (!lightboxMoment) return;
    const currentIndex = staticMoments.findIndex((m) => m.id === lightboxMoment.id);
    const prevIndex = (currentIndex - 1 + staticMoments.length) % staticMoments.length;
    setLightboxMoment(staticMoments[prevIndex]);
  }, [lightboxMoment]);

  useEffect(() => {
    if (!lightboxMoment) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxMoment(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxMoment, handleNext, handlePrev]);

  return (
    <section
      id="gallery"
      className="relative w-full bg-[#0a0a0a] text-white py-20 md:py-28 overflow-hidden select-none"
    >
      {/* Editorial Section Header */}
      <div className="w-full px-[3vw] mb-10 md:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-[0.2em] text-white/50 uppercase">
            <span>ARCHIVE 08</span>
            <span>//</span>
            <span>35MM DOCUMENTARY ROLL</span>
            <span>//</span>
            <span>JAKARTA</span>
          </div>

          <h2 className="text-[clamp(28px,4.5vw,56px)] font-normal tracking-[-0.03em] text-white leading-none">
            Moments with{" "}
            <span
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[1.18em] lowercase text-white"
            >
              kobrat
            </span>
          </h2>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-4 text-[11px] font-mono tracking-[0.1em] uppercase">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            data-cursor={isPlaying ? "PAUSE" : "PLAY"}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 transition-all duration-200 flex items-center gap-2 cursor-pointer text-white"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying ? "bg-[#c6f432] animate-pulse" : "bg-white/40"
              }`}
            />
            <span>{isPlaying ? "AUTO-ROLL: ON" : "PAUSED"}</span>
          </button>

          <span className="text-white/40 hidden sm:inline-block">
            DRAG TO SCRUB • CLICK TO EXPAND
          </span>
        </div>
      </div>

      {/* Ribbon Tracks Container */}
      <div className="w-full flex flex-col gap-6 md:gap-8 overflow-hidden">
        {/* Track 1: Moving Left */}
        <div
          className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseEnter={() => {
            stateRef.current.isHovered1 = true;
          }}
          onMouseLeave={() => {
            stateRef.current.isHovered1 = false;
          }}
          onPointerDown={handlePointerDown1}
        >
          <div
            ref={track1Ref}
            className="flex items-center gap-5 md:gap-7 will-change-transform transform-style-3d select-none"
          >
            {row1Items.map((m, idx) => (
              <div
                key={`row1-${m.id}-${idx}`}
                onMouseEnter={() => setHoveredMomentId(m.id)}
                onMouseLeave={() => setHoveredMomentId(null)}
                onClick={() => {
                  if (stateRef.current.dragDist1 < 6) {
                    setLightboxMoment(m);
                  }
                }}
                data-cursor="INSPECT"
                className={`group relative flex-shrink-0 h-[280px] sm:h-[340px] md:h-[400px] w-auto aspect-[16/10] rounded-xl md:rounded-2xl overflow-hidden bg-[#161616] border border-white/10 transition-all duration-300 ${
                  hoveredMomentId === m.id
                    ? "scale-[1.03] border-white shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-20"
                    : "hover:border-white/40"
                }`}
              >
                <Image
                  src={m.image}
                  alt={m.title}
                  fill
                  sizes="(max-width: 768px) 380px, 600px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority={idx < 4}
                />

                {/* Subtle Analog Shadow Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

                {/* Frame Badge Top Left */}
                <div className="absolute top-3 left-3 text-[10px] font-mono tracking-[0.14em] text-white/70 uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10">
                  {`ROLL 01 // 0${(idx % 4) + 1}`}
                </div>

                {/* Bottom Metadata & Member Tags */}
                <div className="absolute bottom-0 inset-x-0 p-4 md:p-5 flex flex-col gap-1.5 z-10">
                  <span className="text-[10px] font-mono tracking-[0.12em] text-[#c6f432] uppercase">
                    {m.category} • {m.camera}
                  </span>

                  <h3 className="text-[17px] md:text-[20px] font-bold text-white tracking-tight uppercase leading-snug drop-shadow-md">
                    {m.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-white/15">
                    {m.members.map((slug) => (
                      <TransitionLink
                        key={slug}
                        href={`/${slug}`}
                        data-cursor="VIEW PROFILE"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 text-[9px] font-mono tracking-[0.06em] text-white/90 uppercase transition-colors"
                      >
                        @{slug}
                      </TransitionLink>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Track 2: Moving Right */}
        <div
          className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseEnter={() => {
            stateRef.current.isHovered2 = true;
          }}
          onMouseLeave={() => {
            stateRef.current.isHovered2 = false;
          }}
          onPointerDown={handlePointerDown2}
        >
          <div
            ref={track2Ref}
            className="flex items-center gap-5 md:gap-7 will-change-transform transform-style-3d select-none"
          >
            {row2Items.map((m, idx) => (
              <div
                key={`row2-${m.id}-${idx}`}
                onMouseEnter={() => setHoveredMomentId(m.id)}
                onMouseLeave={() => setHoveredMomentId(null)}
                onClick={() => {
                  if (stateRef.current.dragDist2 < 6) {
                    setLightboxMoment(m);
                  }
                }}
                data-cursor="INSPECT"
                className={`group relative flex-shrink-0 h-[280px] sm:h-[340px] md:h-[400px] w-auto aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden bg-[#161616] border border-white/10 transition-all duration-300 ${
                  hoveredMomentId === m.id
                    ? "scale-[1.03] border-white shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-20"
                    : "hover:border-white/40"
                }`}
              >
                <Image
                  src={m.image}
                  alt={m.title}
                  fill
                  sizes="(max-width: 768px) 380px, 600px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Subtle Analog Shadow Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

                {/* Frame Badge Top Left */}
                <div className="absolute top-3 left-3 text-[10px] font-mono tracking-[0.14em] text-white/70 uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10">
                  {`ROLL 02 // 0${(idx % 4) + 1}`}
                </div>

                {/* Bottom Metadata & Member Tags */}
                <div className="absolute bottom-0 inset-x-0 p-4 md:p-5 flex flex-col gap-1.5 z-10">
                  <span className="text-[10px] font-mono tracking-[0.12em] text-[#c6f432] uppercase">
                    {m.category} • {m.camera}
                  </span>

                  <h3 className="text-[17px] md:text-[20px] font-bold text-white tracking-tight uppercase leading-snug drop-shadow-md">
                    {m.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-white/15">
                    {m.members.map((slug) => (
                      <TransitionLink
                        key={slug}
                        href={`/${slug}`}
                        data-cursor="VIEW PROFILE"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 text-[9px] font-mono tracking-[0.06em] text-white/90 uppercase transition-colors"
                      >
                        @{slug}
                      </TransitionLink>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen High-Resolution Lightbox Modal */}
      <AnimatePresence>
        {lightboxMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 md:p-8 select-none"
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between w-full z-10 text-[11px] font-mono tracking-[0.14em] uppercase text-white/70">
              <div className="flex items-center gap-3">
                <span className="text-[#c6f432] font-semibold">● FULLSCREEN CINEMA</span>
                <span>//</span>
                <span>{lightboxMoment.title}</span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxMoment(null)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 transition-colors text-white font-mono text-[11px] cursor-pointer"
              >
                CLOSE [ ESC ] ✕
              </button>
            </div>

            {/* Modal Center Image Frame */}
            <div className="relative flex-1 w-full max-h-[76vh] flex items-center justify-center my-4">
              <div className="relative w-full h-full max-w-6xl rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
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

            {/* Modal Bottom Metadata & Members */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full z-10 text-[11px] font-mono tracking-[0.08em] text-white/60 uppercase">
              <div className="flex items-center gap-3">
                <span>{lightboxMoment.camera}</span>
                <span>•</span>
                <span>{lightboxMoment.location}</span>
                <span>•</span>
                <span>{lightboxMoment.date}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/40 mr-1">PEOPLE:</span>
                  {lightboxMoment.members.map((slug) => (
                    <TransitionLink
                      key={slug}
                      href={`/${slug}`}
                      className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white hover:text-black transition-colors text-white text-[10px]"
                    >
                      @{slug}
                    </TransitionLink>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 ml-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                    aria-label="Previous"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                    aria-label="Next"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}