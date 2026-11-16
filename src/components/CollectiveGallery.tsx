"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { Moment, moments as staticMoments } from "@/data/moments";
import TransitionLink from "./TransitionLink";
import ThreePixelEye from "./ThreePixelEye";

const CATEGORIES = [
  "ALL",
  "STUDIO",
  "ROOFTOP",
  "ON THE ROAD",
  "AFTER HOURS",
  "ANALOG",
] as const;

type Category = (typeof CATEGORIES)[number];

export default function CollectiveGallery() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("ALL");
  const [activeMoment, setActiveMoment] = useState<Moment | null>(null);
  const [viewMode, setViewMode] = useState<"reel" | "grid">("reel");

  // Track and reel references for kinetic drag & scroll
  const reelRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Filter moments
  const filteredMoments = useMemo(() => {
    if (selectedCategory === "ALL") return staticMoments;
    return staticMoments.filter((m) => m.category === selectedCategory);
  }, [selectedCategory]);

  // Update progress on horizontal scroll
  const handleScroll = useCallback(() => {
    const el = reelRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) {
      setScrollProgress(0);
      return;
    }
    const current = el.scrollLeft;
    setScrollProgress(Math.min(1, Math.max(0, current / max)));
  }, []);

  // Kinetic Mouse Drag on Reel
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = reelRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = reelRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.6;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!activeMoment) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMoment(null);
        return;
      }

      const currentIndex = filteredMoments.findIndex((m) => m.id === activeMoment.id);
      if (currentIndex === -1) return;

      if (e.key === "ArrowRight") {
        const nextIndex = (currentIndex + 1) % filteredMoments.length;
        setActiveMoment(filteredMoments[nextIndex]);
      } else if (e.key === "ArrowLeft") {
        const prevIndex =
          (currentIndex - 1 + filteredMoments.length) % filteredMoments.length;
        setActiveMoment(filteredMoments[prevIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMoment, filteredMoments]);

  // Reel button controls
  const scrollReel = (direction: "left" | "right") => {
    const el = reelRef.current;
    if (!el) return;
    const shift = el.clientWidth * 0.65;
    el.scrollBy({
      left: direction === "left" ? -shift : shift,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="gallery"
      className="relative w-full bg-[#fcfcfc] text-[#0c0c0c] border-t border-[#f0f0f0] pt-24 pb-28 px-[3vw] overflow-hidden select-none"
    >
      {/* Editorial Header */}
      <div className="max-w-[1300px] mx-auto mb-14">
        {/* Monospace Eyebrow Badge */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#f4f4f5] border border-[#e5e7eb] text-[#0c0c0c] text-[10px] font-mono uppercase tracking-[0.08em] mb-6">
          <ThreePixelEye size={13} />
          <span>[ 02 // COLLECTIVE ARCHIVE ]</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Big Editorial Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <h2 className="text-[clamp(34px,5.8vw,72px)] leading-[1.04] tracking-[-0.035em] font-normal text-[#0c0c0c]">
              Stories between the{" "}
              <span
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="lowercase text-[1.22em] inline-block leading-none"
              >
                frames
              </span>
              , eight friends on one wavelength.
            </h2>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end">
            <p className="text-[14px] md:text-[15px] font-mono leading-relaxed text-[#767676] max-w-[380px]">
              An unposed film log of late-night sprints, spontaneous road trips, and the raw creative camaraderie that built this collective.
            </p>
          </div>
        </div>

        {/* Interactive Filter Toolbar & View Mode Switch */}
        <div className="mt-12 pt-6 border-t border-[#e5e7eb] flex flex-wrap items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-[0.06em] transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#0c0c0c] text-white shadow-sm"
                    : "bg-white text-[#767676] hover:text-[#0c0c0c] border border-[#e5e7eb] hover:border-[#d4d4d8]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Mode & Reel Arrows */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-full bg-[#f4f4f5] p-1 border border-[#e5e7eb]">
              <button
                type="button"
                onClick={() => setViewMode("reel")}
                className={`px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-[0.06em] transition-all cursor-pointer ${
                  viewMode === "reel"
                    ? "bg-white text-[#0c0c0c] shadow-xs font-semibold"
                    : "text-[#767676] hover:text-[#0c0c0c]"
                }`}
              >
                FILM REEL
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-[0.06em] transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-[#0c0c0c] shadow-xs font-semibold"
                    : "text-[#767676] hover:text-[#0c0c0c]"
                }`}
              >
                CONTACT SHEET
              </button>
            </div>

            {/* Reel Nav Buttons (only in reel mode) */}
            {viewMode === "reel" && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollReel("left")}
                  className="w-8 h-8 rounded-full border border-[#e5e7eb] hover:border-[#0c0c0c] bg-white flex items-center justify-center font-mono text-[11px] text-[#0c0c0c] transition-colors cursor-pointer"
                  aria-label="Previous frames"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => scrollReel("right")}
                  className="w-8 h-8 rounded-full border border-[#e5e7eb] hover:border-[#0c0c0c] bg-white flex items-center justify-center font-mono text-[11px] text-[#0c0c0c] transition-colors cursor-pointer"
                  aria-label="Next frames"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Mode 1: Kinetic Horizontal Film Reel */}
      {viewMode === "reel" ? (
        <div className="relative w-full">
          {/* Scrollable Container with Drag & Momentum */}
          <div
            ref={reelRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex items-center gap-6 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing pb-8 pt-2 pl-[3vw] pr-[6vw]"
          >
            {filteredMoments.map((moment, idx) => (
              <motion.article
                key={moment.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                onClick={() => setActiveMoment(moment)}
                data-cursor="INSPECT"
                className="group relative shrink-0 w-[290px] sm:w-[360px] md:w-[420px] bg-white rounded-[8px] p-3 border border-[#e5e7eb] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:border-[#0c0c0c] transition-all duration-300"
              >
                {/* Photo Frame Container */}
                <div className="relative w-full aspect-[4/3] rounded-[5px] overflow-hidden bg-[#e8e8e8] mb-3">
                  <Image
                    src={moment.image}
                    alt={moment.title}
                    fill
                    sizes="(max-width: 640px) 300px, 420px"
                    className="object-cover group-hover:scale-105 transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                  />

                  {/* Top Film Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[3px] bg-black/65 backdrop-blur-xs text-white font-mono text-[9px] uppercase tracking-[0.06em]">
                      FRAME 0{moment.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-[3px] bg-white/85 backdrop-blur-xs text-[#0c0c0c] font-mono text-[9px] uppercase tracking-[0.06em]">
                      {moment.category}
                    </span>
                  </div>

                  {/* Hover Inspect Icon */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="px-3.5 py-1.5 rounded-full bg-white text-[#0c0c0c] font-mono text-[10px] uppercase tracking-[0.08em] shadow-lg flex items-center gap-2">
                      <ThreePixelEye size={12} />
                      <span>INSPECT MOMENT</span>
                    </div>
                  </div>
                </div>

                {/* Card Editorial Meta */}
                <div className="px-1 py-1">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="text-[17px] font-medium tracking-tight text-[#0c0c0c] group-hover:text-black transition-colors line-clamp-1">
                      {moment.title}
                    </h3>
                    <span className="font-mono text-[10px] text-[#767676] shrink-0">
                      {moment.year}
                    </span>
                  </div>

                  <p className="text-[12px] font-mono text-[#767676] line-clamp-2 leading-relaxed mb-3">
                    {moment.description}
                  </p>

                  <div className="pt-2.5 border-t border-[#f4f4f5] flex items-center justify-between text-[10px] font-mono text-[#a1a1aa] uppercase tracking-[0.04em]">
                    <span>{moment.location.split("//")[0]}</span>
                    <span>{moment.camera.split("//")[0]}</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Scrubber Progress Bar */}
          <div className="max-w-[1300px] mx-auto mt-6 flex items-center justify-between gap-6 font-mono text-[10px] text-[#767676] uppercase">
            <span>[ 01 // ARCHIVE ]</span>
            <div className="flex-1 h-[2px] bg-[#e5e7eb] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-[#0c0c0c] transition-all duration-150 ease-out"
                style={{ width: `${Math.max(8, scrollProgress * 100)}%` }}
              />
            </div>
            <span>[ 0{filteredMoments.length} // TOTAL ]</span>
          </div>
        </div>
      ) : (
        /* View Mode 2: Editorial Contact Sheet Grid */
        <div className="max-w-[1300px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredMoments.map((moment, idx) => (
              <motion.article
                key={moment.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => setActiveMoment(moment)}
                data-cursor="INSPECT"
                className="group bg-white rounded-[8px] p-3 border border-[#e5e7eb] hover:border-[#0c0c0c] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full aspect-[4/3] rounded-[5px] overflow-hidden bg-[#e8e8e8] mb-3">
                    <Image
                      src={moment.image}
                      alt={moment.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[3px] bg-black/65 backdrop-blur-xs text-white font-mono text-[9px] uppercase tracking-[0.06em]">
                      FRAME 0{moment.id}
                    </div>
                  </div>

                  <h3 className="text-[18px] font-medium tracking-tight text-[#0c0c0c] mb-1">
                    {moment.title}
                  </h3>
                  <p className="text-[12px] font-mono text-[#767676] leading-relaxed line-clamp-2 mb-3">
                    {moment.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f4f4f5] flex items-center justify-between text-[10px] font-mono text-[#a1a1aa] uppercase">
                  <span>{moment.location.split("//")[0]}</span>
                  <span>{moment.date.split(",")[0]}</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      )}

      {/* Cinema Lightbox Modal */}
      <AnimatePresence>
        {activeMoment && (
          <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4 sm:p-6 md:p-10 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setActiveMoment(null)}
              className="absolute inset-0 bg-[#0c0c0c]/85 backdrop-blur-md"
            />

            {/* Modal Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[1040px] max-h-[92vh] bg-white rounded-[10px] shadow-[0_30px_70px_rgba(0,0,0,0.35)] border border-[#e5e7eb] overflow-hidden flex flex-col md:grid md:grid-cols-12 z-10"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveMoment(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#0c0c0c] border border-[#e5e7eb] flex items-center justify-center font-mono text-[12px] transition-colors cursor-pointer shadow-sm"
                aria-label="Close modal"
              >
                ✕
              </button>

              {/* Left Column: Photo Stage */}
              <div className="md:col-span-7 bg-[#0c0c0c] relative flex items-center justify-center min-h-[280px] sm:min-h-[360px] md:min-h-[520px] p-4 sm:p-6 overflow-hidden">
                <div className="relative w-full h-full max-h-[480px] aspect-[4/3] rounded-[6px] overflow-hidden shadow-2xl">
                  <Image
                    src={activeMoment.image}
                    alt={activeMoment.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                  />
                </div>

                {/* Film Overlay Stamp */}
                <div className="absolute bottom-3 left-4 text-white/50 font-mono text-[9px] uppercase tracking-[0.1em]">
                  {activeMoment.camera} // KOBRAT ARCHIVE
                </div>
              </div>

              {/* Right Column: Moment Narrative & Participant Links */}
              <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[460px] md:max-h-[520px]">
                <div>
                  {/* Category & Date Badge */}
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-[#767676] mb-3">
                    <span className="px-2 py-0.5 rounded-[3px] bg-[#f4f4f5] text-[#0c0c0c] font-semibold">
                      {activeMoment.category}
                    </span>
                    <span>//</span>
                    <span>{activeMoment.date}</span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{ fontFamily: "var(--font-wordmark)" }}
                    className="text-[32px] sm:text-[38px] leading-[1.05] text-[#0c0c0c] lowercase mb-4"
                  >
                    {activeMoment.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[13px] md:text-[14px] leading-relaxed text-[#555] font-light mb-6">
                    {activeMoment.description}
                  </p>

                  {/* Metadata Specs */}
                  <div className="border-t border-[#e5e7eb] pt-4 space-y-2.5 font-mono text-[11px] text-[#767676]">
                    <div className="flex items-center justify-between">
                      <span className="uppercase text-[#a1a1aa]">LOCATION</span>
                      <span className="text-[#0c0c0c] font-medium uppercase">
                        {activeMoment.location}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="uppercase text-[#a1a1aa]">EQUIPMENT</span>
                      <span className="text-[#0c0c0c] font-medium uppercase">
                        {activeMoment.camera}
                      </span>
                    </div>
                  </div>

                  {/* Friends in Frame (Interactive Profile Links!) */}
                  <div className="mt-6 pt-5 border-t border-[#e5e7eb]">
                    <span className="block text-[10px] font-mono uppercase tracking-[0.08em] text-[#a1a1aa] mb-2.5">
                      IN THIS FRAME ({activeMoment.members.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeMoment.members.map((memberSlug) => (
                        <TransitionLink
                          key={memberSlug}
                          href={`/${memberSlug}`}
                          onClick={() => setActiveMoment(null)}
                          className="px-2.5 py-1 rounded-[4px] bg-[#f4f4f5] hover:bg-[#0c0c0c] hover:text-white text-[#0c0c0c] font-mono text-[11px] uppercase tracking-[0.04em] transition-all flex items-center gap-1.5 group"
                        >
                          <span>@{memberSlug}</span>
                          <span className="text-[9px] text-[#767676] group-hover:text-white transition-colors">
                            ↗
                          </span>
                        </TransitionLink>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Navigation Footer */}
                <div className="mt-8 pt-4 border-t border-[#f4f4f5] flex items-center justify-between font-mono text-[10px] uppercase text-[#767676]">
                  <span className="hidden sm:inline">USE ← → KEYS TO NAVIGATE</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const idx = filteredMoments.findIndex(
                          (m) => m.id === activeMoment.id
                        );
                        const prev =
                          (idx - 1 + filteredMoments.length) %
                          filteredMoments.length;
                        setActiveMoment(filteredMoments[prev]);
                      }}
                      className="px-3 py-1 rounded-[4px] border border-[#e5e7eb] hover:border-[#0c0c0c] text-[#0c0c0c] transition-colors cursor-pointer"
                    >
                      PREV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const idx = filteredMoments.findIndex(
                          (m) => m.id === activeMoment.id
                        );
                        const next = (idx + 1) % filteredMoments.length;
                        setActiveMoment(filteredMoments[next]);
                      }}
                      className="px-3 py-1 rounded-[4px] border border-[#e5e7eb] hover:border-[#0c0c0c] text-[#0c0c0c] transition-colors cursor-pointer"
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
