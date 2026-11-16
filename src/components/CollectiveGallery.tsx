"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
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
import ThreePixelEye from "./ThreePixelEye";

export default function CollectiveGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const deckScrollRef = useRef<HTMLDivElement>(null);

  // Active slide index (0 to 7)
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [lightboxMoment, setLightboxMoment] = useState<Moment | null>(null);

  // Scroll Progress Tracking across the multi-screen pinned section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Silky smooth spring interpolation for framerate-independent responsive motion
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 24,
    stiffness: 140,
    mass: 0.18,
  });

  // Track scroll state
  const [progressVal, setProgressVal] = useState(0);

  // 1. Reactive Scale: Small framed card (0.42) -> Fullscreen background (1.0)
  const portalScale = useTransform(smoothProgress, [0, 0.26], [0.42, 1.0]);
  const portalRadius = useTransform(smoothProgress, [0, 0.26], [28, 0]);
  const initialOverlayOpacity = useTransform(smoothProgress, [0, 0.16], [1, 0]);

  // 2. HUD & Slide Deck entry once expanded
  const hudOpacity = useTransform(smoothProgress, [0.18, 0.28], [0, 1]);
  const hudY = useTransform(smoothProgress, [0.18, 0.28], [-30, 0]);

  const deckOpacity = useTransform(smoothProgress, [0.20, 0.30], [0, 1]);
  const deckY = useTransform(smoothProgress, [0.20, 0.30], [60, 0]);

  // 3. Reactive Slide Switching driven by scroll progress between [0.28, 0.98]
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    setProgressVal(latest);

    if (latest >= 0.26) {
      // Map range [0.26, 0.96] to 8 moment indices
      const norm = Math.min(1, Math.max(0, (latest - 0.26) / 0.70));
      const idx = Math.min(
        staticMoments.length - 1,
        Math.floor(norm * staticMoments.length)
      );
      setActiveIndex(idx);
    }
  });

  // Keep active slide card centered in the bottom horizontal drawer
  useEffect(() => {
    const container = deckScrollRef.current;
    if (!container) return;
    const activeChild = container.children[activeIndex] as HTMLElement | undefined;
    if (activeChild) {
      const containerWidth = container.clientWidth;
      const childLeft = activeChild.offsetLeft;
      const childWidth = activeChild.clientWidth;
      container.scrollTo({
        left: childLeft - containerWidth / 2 + childWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  const currentMoment = staticMoments[activeIndex] || staticMoments[0];

  // Navigation callbacks
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : staticMoments.length - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < staticMoments.length - 1 ? prev + 1 : 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxMoment) {
        if (e.key === "Escape") setLightboxMoment(null);
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "ArrowLeft") handlePrev();
        return;
      }

      // If gallery section is in view
      if (progressVal > 0.15 && progressVal < 0.98) {
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "ArrowLeft") handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxMoment, handleNext, handlePrev, progressVal]);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative w-full h-[360vh] bg-[#0c0c0c] text-white selection:bg-white selection:text-black select-none"
    >
      {/* Sticky Fullscreen Cinema Stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* Full-bleed Scaling & Morphing Background Canvas */}
        <motion.div
          style={{
            scale: portalScale,
            borderRadius: portalRadius,
          }}
          className="absolute inset-0 w-full h-full overflow-hidden will-change-transform shadow-2xl origin-center"
        >
          {/* Animated Crossfading Active Photograph */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentMoment.id}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
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

          {/* Analog Vignette & Technical Cinema Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/80 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />

          {/* Micro Analog Film Grain Overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Initial State Helper Overlay (fades out as it expands) */}
          <motion.div
            style={{ opacity: initialOverlayOpacity }}
            className="absolute inset-0 flex flex-col items-center justify-between p-6 md:p-8 pointer-events-none border border-white/20 rounded-2xl md:rounded-3xl"
          >
            <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-[0.2em] text-white/70 uppercase">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c6f432] animate-pulse" />
                REC ● 35MM
              </span>
              <span>KOBRAT ARCHIVE // 08</span>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <span className="text-[11px] font-mono tracking-[0.25em] text-[#c6f432] uppercase">
                SCROLL TO EXPAND ARCHIVE
              </span>
              <div className="w-5 h-5 flex items-center justify-center text-white/80 animate-bounce">
                ↓
              </div>
            </div>

            <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-[0.15em] text-white/50 uppercase">
              <span>01 / 08</span>
              <span>JAKARTA</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Top HUD Header (Fades in once expanded) */}
        <motion.header
          style={{ opacity: hudOpacity, y: hudY }}
          className="relative z-40 w-full px-[3vw] pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pointer-events-auto"
        >
          {/* Left Title & Live Frame Indicator */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 text-[11px] font-mono tracking-[0.18em] text-white/60 uppercase">
              <span className="text-[#c6f432] flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c6f432] animate-ping" />
                LIVE FRAME
              </span>
              <span>//</span>
              <span>{`[ 0${activeIndex + 1} / 0${staticMoments.length} ]`}</span>
              <span>//</span>
              <span>{currentMoment.category}</span>
            </div>

            <h2 className="text-[clamp(22px,3.2vw,44px)] font-bold tracking-tight text-white leading-none uppercase drop-shadow-md">
              {currentMoment.title}
            </h2>
          </div>

          {/* Right Meta Badges & Participant Tags */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Camera Gear & Location Pills */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[10px] font-mono tracking-[0.08em] text-white/80 uppercase">
              <span>{currentMoment.camera}</span>
              <span className="text-white/30">•</span>
              <span>{currentMoment.location}</span>
            </div>

            {/* Clickable Participant Pills */}
            <div className="flex items-center gap-1.5">
              {currentMoment.members.map((slug) => (
                <TransitionLink
                  key={slug}
                  href={`/${slug}`}
                  data-cursor="VIEW PROFILE"
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white hover:text-black backdrop-blur-md border border-white/20 transition-all duration-200 text-[10px] font-mono tracking-[0.06em] uppercase text-white/90"
                >
                  @{slug}
                </TransitionLink>
              ))}
            </div>

            {/* Fullscreen Cinema Inspect Button */}
            <button
              type="button"
              onClick={() => setLightboxMoment(currentMoment)}
              data-cursor="INSPECT"
              className="px-3 py-1.5 rounded-full bg-white text-black hover:bg-[#c6f432] transition-colors text-[10px] font-mono tracking-[0.1em] font-semibold uppercase flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <span>INSPECT</span>
              <span className="text-[12px] leading-none">↗</span>
            </button>
          </div>
        </motion.header>

        {/* Center Technical Grid Coordinates */}
        <div className="relative z-30 pointer-events-none px-[3vw] flex items-center justify-between text-[10px] font-mono text-white/30 tracking-[0.2em] uppercase">
          <span>{`LAT: -6.2088 // LON: 106.8456`}</span>
          <span className="hidden sm:inline-block">ISO 400 • 35MM EXP</span>
        </div>

        {/* Bottom Drawer: Interactive Slide Files Deck */}
        <motion.div
          style={{ opacity: deckOpacity, y: deckY }}
          className="relative z-40 w-full px-[3vw] pb-6 pt-3 flex flex-col gap-3 pointer-events-auto"
        >
          {/* Deck Header & Navigation Arrows */}
          <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.12em] text-white/60 uppercase">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">SLIDE ARCHIVE</span>
              <span>//</span>
              <span className="text-white/40">DRAG OR CLICK TO SWITCH FILE</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                data-cursor="PREV"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer text-white"
                aria-label="Previous slide"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNext}
                data-cursor="NEXT"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer text-white"
                aria-label="Next slide"
              >
                →
              </button>
            </div>
          </div>

          {/* Horizontal Tactile Slide Files Strip */}
          <div
            ref={deckScrollRef}
            className="w-full flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 select-none scroll-smooth touch-pan-x"
          >
            {staticMoments.map((m, i) => {
              const isActive = i === activeIndex;
              return (
                <div
                  key={m.id}
                  onClick={() => setActiveIndex(i)}
                  onMouseEnter={() => setActiveIndex(i)}
                  data-cursor="SELECT"
                  className={`relative flex-shrink-0 flex items-center gap-3 p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "w-[260px] md:w-[290px] bg-black/90 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] -translate-y-1.5"
                      : "w-[190px] md:w-[220px] bg-black/60 hover:bg-black/80 border-white/15 hover:border-white/40 opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Micro Photo Thumbnail with Analog Sprocket Styling */}
                  <div className="relative w-[56px] h-[56px] md:w-[64px] md:h-[64px] rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/20">
                    <Image
                      src={m.image}
                      alt={m.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    {isActive && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#c6f432]" />
                    )}
                  </div>

                  {/* File Metadata Text */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center justify-between text-[9px] font-mono text-white/50 tracking-[0.1em] uppercase">
                      <span className={isActive ? "text-[#c6f432] font-semibold" : ""}>
                        {`FILE_0${i + 1}`}
                      </span>
                      <span>{m.category}</span>
                    </div>

                    <h4 className="text-[12px] md:text-[13px] font-semibold text-white tracking-tight truncate leading-tight uppercase">
                      {m.title}
                    </h4>

                    <span className="text-[9px] font-mono text-white/40 tracking-[0.06em] truncate uppercase">
                      {m.location}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Progress Scrubber Line */}
          <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full bg-white origin-left"
              style={{
                width: `${((activeIndex + 1) / staticMoments.length) * 100}%`,
              }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Fullscreen High-Resolution Lightbox Modal */}
      <AnimatePresence>
        {lightboxMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 md:p-8"
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between w-full z-10 text-[11px] font-mono tracking-[0.14em] uppercase text-white/70">
              <div className="flex items-center gap-3">
                <span className="text-[#c6f432] font-semibold">● FULLSCREEN INSPECT</span>
                <span>//</span>
                <span>{lightboxMoment.title}</span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxMoment(null)}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-black border border-white/20 transition-colors text-white font-mono text-[11px] cursor-pointer"
              >
                CLOSE [ ESC ] ✕
              </button>
            </div>

            {/* Modal Center Image */}
            <div className="relative flex-1 w-full max-h-[78vh] flex items-center justify-center my-4">
              <div className="relative w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
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
                <span className="text-white/40">TAGS:</span>
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