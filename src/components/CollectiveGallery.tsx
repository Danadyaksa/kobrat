"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  AnimatePresence,
} from "motion/react";
import { Moment, moments as staticMoments } from "@/data/moments";
import TransitionLink from "./TransitionLink";

export default function CollectiveGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);

  // 3 Flagship featured moments for the main scroll journey
  const featuredMoments = useMemo(
    () => [
      staticMoments[0], // The Midnight Brainstorm
      staticMoments[1], // Golden Hour Rooftop
      staticMoments[5], // Kota Tua 35mm Roll
    ],
    []
  );

  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [lightboxMoment, setLightboxMoment] = useState<Moment | null>(null);

  // Scroll Progress Tracking across the multi-screen pinned section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Smooth framerate-independent spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 24,
    stiffness: 140,
    mass: 0.18,
  });

  // 1. Initial Expansion: Framed card (scale: 0.65, rounded) -> Fullscreen background (scale: 1.0, rounded: 0)
  const portalScale = useTransform(smoothProgress, [0, 0.22], [0.65, 1.0]);
  const portalRadius = useTransform(smoothProgress, [0, 0.22], [24, 0]);
  const scrollPromptOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);

  // 2. HUD Opacity: Fades in as photo expands
  const hudOpacity = useTransform(smoothProgress, [0.14, 0.24], [0, 1]);
  const hudY = useTransform(smoothProgress, [0.14, 0.24], [-20, 0]);

  // 3. Switch between the 3 flagship moments as user scrolls through the section
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (latest < 0.36) {
      setActiveIdx(0);
    } else if (latest < 0.70) {
      setActiveIdx(1);
    } else {
      setActiveIdx(2);
    }
  });

  const currentMoment = featuredMoments[activeIdx] || featuredMoments[0];

  // Manual step handlers
  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : featuredMoments.length - 1));
  }, [featuredMoments.length]);

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev < featuredMoments.length - 1 ? prev + 1 : 0));
  }, [featuredMoments.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxMoment) {
        if (e.key === "Escape") setLightboxMoment(null);
        return;
      }
      if (isArchiveOpen) {
        if (e.key === "Escape") setIsArchiveOpen(false);
        return;
      }
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxMoment, isArchiveOpen, handleNext, handlePrev]);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative w-full h-[280vh] bg-[#0c0c0c] text-white select-none"
    >
      {/* Sticky Fullscreen Stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* Expanding & Crossfading Main Image Portal */}
        <motion.div
          style={{
            scale: portalScale,
            borderRadius: portalRadius,
          }}
          className="absolute inset-0 w-full h-full overflow-hidden will-change-transform shadow-2xl origin-center"
        >
          {/* Active Photograph with Smooth Cinematic Morph */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentMoment.id}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1.0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full cursor-pointer"
              onClick={() => setLightboxMoment(currentMoment)}
            >
              <Image
                src={currentMoment.image}
                alt={currentMoment.title}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>

          {/* Deep Editorial Cinematic Vignettes */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/75 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none" />

          {/* Initial Scroll Prompt (Fades away once scroll begins) */}
          <motion.div
            style={{ opacity: scrollPromptOpacity }}
            className="absolute inset-0 flex flex-col items-center justify-between p-6 md:p-10 pointer-events-none border border-white/20 rounded-2xl md:rounded-3xl"
          >
            <div className="w-full flex items-center justify-between text-[11px] font-mono tracking-[0.2em] text-white/60 uppercase">
              <span>ARCHIVE 08</span>
              <span>// 35MM DOCUMENTARY</span>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-[11px] font-mono tracking-[0.25em] text-[#c6f432] uppercase font-semibold">
                SCROLL TO EXPAND
              </span>
              <span className="text-white/70 text-sm animate-bounce">↓</span>
            </div>

            <div className="w-full flex items-center justify-between text-[10px] font-mono tracking-[0.14em] text-white/40 uppercase">
              <span>{currentMoment.camera}</span>
              <span>{currentMoment.location}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Top HUD Header */}
        <motion.header
          style={{ opacity: hudOpacity, y: hudY }}
          className="relative z-40 w-full px-[3vw] pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pointer-events-auto"
        >
          {/* Left Kicker & Progress Dots */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.18em] text-white/60 uppercase">
              <span className="text-[#c6f432] font-semibold">
                {`0${activeIdx + 1} / 0${featuredMoments.length}`}
              </span>
              <span>//</span>
              <span>FEATURED MOMENTS</span>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1.5">
              {featuredMoments.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeIdx
                      ? "w-6 bg-[#c6f432]"
                      : "w-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Jump to moment ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Action: Button to Explore All 8 Archive Moments */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsArchiveOpen(true)}
              data-cursor="ARCHIVE"
              className="px-4 py-2 rounded-full bg-white text-black hover:bg-[#c6f432] transition-colors text-[11px] font-mono font-semibold tracking-[0.08em] uppercase flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <span>EXPLORE ALL 8 MOMENTS</span>
              <span className="text-xs">↗</span>
            </button>
          </div>
        </motion.header>

        {/* Bottom Hero HUD: Title & Member Tags */}
        <motion.div
          style={{ opacity: hudOpacity }}
          className="relative z-40 w-full px-[3vw] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-auto"
        >
          {/* Active Moment Headline & Metadata */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMoment.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col gap-2 max-w-2xl"
            >
              <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-[0.14em] text-white/60 uppercase">
                <span className="text-[#c6f432]">{currentMoment.category}</span>
                <span>•</span>
                <span>{currentMoment.camera}</span>
                <span>•</span>
                <span>{currentMoment.location}</span>
              </div>

              <h2 className="text-[clamp(28px,4.5vw,56px)] font-bold text-white tracking-tight uppercase leading-none drop-shadow-md">
                {currentMoment.title}
              </h2>

              {/* Clickable Participant Member Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-mono tracking-wider text-white/40 uppercase mr-1">
                  WITH:
                </span>
                {currentMoment.members.map((slug) => (
                  <TransitionLink
                    key={slug}
                    href={`/${slug}`}
                    data-cursor="VIEW PROFILE"
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 text-[10px] font-mono tracking-wider text-white uppercase transition-all backdrop-blur-md"
                  >
                    @{slug}
                  </TransitionLink>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Stepper Navigation Arrows & Fullscreen Lightbox Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              data-cursor="PREV"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              aria-label="Previous moment"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              data-cursor="NEXT"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              aria-label="Next moment"
            >
              →
            </button>
            <button
              type="button"
              onClick={() => setLightboxMoment(currentMoment)}
              data-cursor="INSPECT"
              className="ml-2 px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 text-[10px] font-mono tracking-[0.08em] uppercase transition-all cursor-pointer text-white flex items-center gap-1.5"
            >
              <span>INSPECT</span>
              <span className="text-xs">⤢</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Complete 8-Moment Archive Sheet Modal */}
      <AnimatePresence>
        {isArchiveOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[990] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 md:p-8 overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-6 border-b border-white/15 text-[11px] font-mono tracking-[0.16em] uppercase text-white/70">
              <div className="flex items-center gap-3">
                <span className="text-[#c6f432] font-semibold">● FULL ARCHIVE</span>
                <span>//</span>
                <span>8 DOCUMENTARY 35MM FRAMES</span>
              </div>

              <button
                type="button"
                onClick={() => setIsArchiveOpen(false)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 transition-colors text-white font-mono text-[11px] cursor-pointer"
              >
                CLOSE [ ESC ] ✕
              </button>
            </div>

            {/* Grid of All 8 Moments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-8 max-w-7xl mx-auto w-full">
              {staticMoments.map((moment, idx) => (
                <div
                  key={moment.id}
                  onClick={() => {
                    setIsArchiveOpen(false);
                    setLightboxMoment(moment);
                  }}
                  data-cursor="INSPECT"
                  className="group relative flex flex-col gap-2 rounded-xl overflow-hidden bg-[#161616] border border-white/15 hover:border-white transition-all cursor-pointer p-2.5"
                >
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-black/40">
                    <Image
                      src={moment.image}
                      alt={moment.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-mono text-white/80 uppercase">
                      {`FRAME 0${idx + 1}`}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 px-1 pt-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-white/50 uppercase">
                      <span className="text-[#c6f432]">{moment.category}</span>
                      <span>{moment.camera.split("//")[0]}</span>
                    </div>

                    <h4 className="text-[14px] font-bold text-white tracking-tight uppercase leading-snug">
                      {moment.title}
                    </h4>

                    {/* Member Pills */}
                    <div className="flex flex-wrap items-center gap-1 mt-1 pt-1 border-t border-white/10">
                      {moment.members.map((slug) => (
                        <TransitionLink
                          key={slug}
                          href={`/${slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white hover:text-black text-[9px] font-mono text-white/80 uppercase transition-colors"
                        >
                          @{slug}
                        </TransitionLink>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Bottom Status */}
            <div className="w-full flex items-center justify-between pt-4 border-t border-white/10 text-[10px] font-mono tracking-wider text-white/40 uppercase">
              <span>KOBRAT COLLECTIVE // 2024—2025</span>
              <span>CLICK ANY FRAME TO INSPECT FULL RESOLUTION</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen High-Resolution Lightbox Modal */}
      <AnimatePresence>
        {lightboxMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 md:p-8 select-none"
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between w-full z-10 text-[11px] font-mono tracking-[0.14em] uppercase text-white/70">
              <div className="flex items-center gap-3">
                <span className="text-[#c6f432] font-semibold">● FULL RESOLUTION</span>
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

            {/* Modal Center Image */}
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

              <div className="flex items-center gap-2">
                <span className="text-white/40">WITH:</span>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}