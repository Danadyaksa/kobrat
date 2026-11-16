"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "motion/react";
import { Moment, moments as staticMoments } from "@/data/moments";
import TransitionLink from "./TransitionLink";

export default function CollectiveGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);

  // 3 Flagship Moments matching the 3 cards in thelinestudio.com
  const featuredMoments = useMemo(
    () => [
      staticMoments[0], // The Midnight Brainstorm
      staticMoments[1], // Golden Hour Rooftop
      staticMoments[5], // Kota Tua 35mm Roll
    ],
    []
  );

  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [lightboxMoment, setLightboxMoment] = useState<Moment | null>(null);

  // Scroll Progress across the 3-card stacking track
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    damping: 24,
    stiffness: 140,
    mass: 0.18,
  });

  // Card 1 transforms: stays in place, slightly scales down as Card 2 slides over
  const card1Scale = useTransform(smoothProgress, [0.22, 0.52], [1.0, 0.95]);
  const card1Opacity = useTransform(smoothProgress, [0.22, 0.52], [1.0, 0.85]);

  // Card 2 transforms: slides up from 100vh to 0vh, then scales down as Card 3 slides over
  const card2Y = useTransform(smoothProgress, [0.18, 0.50], ["100vh", "0vh"]);
  const card2Scale = useTransform(smoothProgress, [0.55, 0.85], [1.0, 0.95]);
  const card2Opacity = useTransform(smoothProgress, [0.55, 0.85], [1.0, 0.85]);

  // Card 3 transforms: slides up from 100vh to 0vh
  const card3Y = useTransform(smoothProgress, [0.50, 0.84], ["100vh", "0vh"]);

  // Keyboard navigation for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxMoment(null);
        setIsArchiveOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative w-full h-[360vh] bg-white text-[#0c0c0c] select-none"
    >
      {/* Editorial Section Introduction */}
      <div className="w-full px-[3vw] pt-24 pb-8 md:pb-12 border-b border-[#0c0c0c]/10 bg-white flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#767676]">
            / ABOUT KOBRAT
          </span>
          <h2
            style={{ fontFamily: "var(--font-wordmark)" }}
            className="text-[clamp(54px,8.5vw,112px)] lowercase text-[#0c0c0c] leading-[0.95]"
          >
            highlights
          </h2>
        </div>

        {/* Action Links */}
        <div className="flex items-center gap-6 font-sans text-[14px] font-normal tracking-[-0.01em] pb-1">
          <button
            type="button"
            onClick={() => setIsArchiveOpen(true)}
            data-cursor="ARCHIVE"
            className="group flex items-center gap-1.5 hover:opacity-60 transition-opacity cursor-pointer border-b border-[#0c0c0c] pb-0.5"
          >
            <span>The Archive</span>
            <span className="font-mono text-[11px] text-[#767676] group-hover:text-[#0c0c0c]">
              [08]
            </span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </button>

          <a
            href="#home"
            className="group flex items-center gap-1.5 hover:opacity-60 transition-opacity cursor-pointer border-b border-[#0c0c0c] pb-0.5"
          >
            <span>The Collective</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>
      </div>

      {/* Sticky Fullscreen Stage (Edge-to-Edge full width, matching thelinestudio.com) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        {/* ─── Card 1: The Midnight Brainstorm (rotate: -1.8deg) ─── */}
        <motion.div
          style={{
            scale: card1Scale,
            opacity: card1Opacity,
            rotate: -1.8,
          }}
          className="absolute inset-0 w-[102vw] -left-[1vw] h-screen bg-[#e4e6eb] border-y border-[#0c0c0c]/10 shadow-2xl flex flex-col justify-between overflow-hidden z-10 origin-bottom"
        >
          {/* Card Top Title Row */}
          <div className="h-[18vh] min-h-[100px] px-[4vw] pt-[5vh] pb-[2vh] flex items-end justify-between w-full">
            <h3
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[clamp(32px,5vw,64px)] lowercase text-[#0c0c0c] leading-[0.95]"
            >
              {featuredMoments[0].title}
            </h3>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1.5">
                {featuredMoments[0].members.map((slug) => (
                  <TransitionLink
                    key={slug}
                    href={`/${slug}`}
                    data-cursor="VIEW PROFILE"
                    className="font-mono text-[10px] uppercase tracking-[0.04em] px-2.5 py-1 rounded-full bg-black/5 hover:bg-[#0c0c0c] hover:text-white transition-colors text-[#0c0c0c]"
                  >
                    @{slug}
                  </TransitionLink>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setLightboxMoment(featuredMoments[0])}
                data-cursor="VIEW"
                className="group flex items-center gap-1 font-sans text-[14px] font-normal tracking-[-0.01em] text-[#0c0c0c] hover:opacity-60 transition-opacity cursor-pointer border-b border-[#0c0c0c] pb-0.5"
              >
                <span>View moment</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* Massive Technical Crop Frame + Artwork */}
          <div className="h-[76vh] mx-[3vw] mb-[4vh] border border-dashed border-[#0c0c0c]/30 rounded-lg p-3 md:p-5 flex flex-col justify-between bg-white/10 overflow-hidden">
            {/* Technical Crop Meta Header */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-[#0c0c0c]/60 pb-2 border-b border-[#0c0c0c]/15">
              <div className="flex items-center gap-5">
                <span>OVERSCAN</span>
                <span>[ 16:9 ]</span>
                <span className="hidden sm:inline">CROP</span>
              </div>
              <div className="flex items-center gap-5">
                <span className="hidden md:inline">ACTION SAFE</span>
                <span>1632 × 918</span>
                <span className="hidden sm:inline">1499 × 864</span>
              </div>
            </div>

            {/* Giant Artwork Container */}
            <div
              onClick={() => setLightboxMoment(featuredMoments[0])}
              className="relative flex-1 w-full my-2.5 rounded overflow-hidden cursor-pointer group"
            >
              <Image
                src={featuredMoments[0].image}
                alt={featuredMoments[0].title}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Technical Bottom Markers */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-[#0c0c0c]/50 pt-2 border-t border-[#0c0c0c]/15">
              <span>{featuredMoments[0].camera}</span>
              <span>{featuredMoments[0].location}</span>
              <span>{featuredMoments[0].date}</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Card 2: Golden Hour Rooftop (rotate: 1.5deg, slides up) ─── */}
        <motion.div
          style={{
            y: card2Y,
            scale: card2Scale,
            opacity: card2Opacity,
            rotate: 1.5,
          }}
          className="absolute inset-0 w-[102vw] -left-[1vw] h-screen bg-[#e6e8ed] border-y border-[#0c0c0c]/10 shadow-[0_-30px_70px_rgba(0,0,0,0.2)] flex flex-col justify-between overflow-hidden z-20 origin-bottom"
        >
          {/* Card Top Title Row */}
          <div className="h-[18vh] min-h-[100px] px-[4vw] pt-[5vh] pb-[2vh] flex items-end justify-between w-full">
            <h3
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[clamp(32px,5vw,64px)] lowercase text-[#0c0c0c] leading-[0.95]"
            >
              {featuredMoments[1].title}
            </h3>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1.5">
                {featuredMoments[1].members.slice(0, 4).map((slug) => (
                  <TransitionLink
                    key={slug}
                    href={`/${slug}`}
                    data-cursor="VIEW PROFILE"
                    className="font-mono text-[10px] uppercase tracking-[0.04em] px-2.5 py-1 rounded-full bg-black/5 hover:bg-[#0c0c0c] hover:text-white transition-colors text-[#0c0c0c]"
                  >
                    @{slug}
                  </TransitionLink>
                ))}
                <span className="font-mono text-[10px] text-[#767676]">+4</span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxMoment(featuredMoments[1])}
                data-cursor="VIEW"
                className="group flex items-center gap-1 font-sans text-[14px] font-normal tracking-[-0.01em] text-[#0c0c0c] hover:opacity-60 transition-opacity cursor-pointer border-b border-[#0c0c0c] pb-0.5"
              >
                <span>View moment</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* Massive Technical Crop Frame + Artwork */}
          <div className="h-[76vh] mx-[3vw] mb-[4vh] border border-dashed border-[#0c0c0c]/30 rounded-lg p-3 md:p-5 flex flex-col justify-between bg-white/10 overflow-hidden">
            {/* Technical Crop Meta Header */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-[#0c0c0c]/60 pb-2 border-b border-[#0c0c0c]/15">
              <div className="flex items-center gap-5">
                <span>OVERSCAN</span>
                <span>[ 16:9 ]</span>
                <span className="hidden sm:inline">CROP</span>
              </div>
              <div className="flex items-center gap-5">
                <span className="hidden md:inline">ACTION SAFE</span>
                <span>1632 × 918</span>
                <span className="hidden sm:inline">1499 × 864</span>
              </div>
            </div>

            {/* Giant Artwork Container */}
            <div
              onClick={() => setLightboxMoment(featuredMoments[1])}
              className="relative flex-1 w-full my-2.5 rounded overflow-hidden cursor-pointer group"
            >
              <Image
                src={featuredMoments[1].image}
                alt={featuredMoments[1].title}
                fill
                sizes="100vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Technical Bottom Markers */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-[#0c0c0c]/50 pt-2 border-t border-[#0c0c0c]/15">
              <span>{featuredMoments[1].camera}</span>
              <span>{featuredMoments[1].location}</span>
              <span>{featuredMoments[1].date}</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Card 3: Kota Tua 35mm Roll (rotate: -1.2deg, slides up) ─── */}
        <motion.div
          style={{
            y: card3Y,
            rotate: -1.2,
          }}
          className="absolute inset-0 w-[102vw] -left-[1vw] h-screen bg-[#e2e4ea] border-y border-[#0c0c0c]/10 shadow-[0_-35px_80px_rgba(0,0,0,0.25)] flex flex-col justify-between overflow-hidden z-30 origin-bottom"
        >
          {/* Card Top Title Row */}
          <div className="h-[18vh] min-h-[100px] px-[4vw] pt-[5vh] pb-[2vh] flex items-end justify-between w-full">
            <h3
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[clamp(32px,5vw,64px)] lowercase text-[#0c0c0c] leading-[0.95]"
            >
              {featuredMoments[2].title}
            </h3>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1.5">
                {featuredMoments[2].members.slice(0, 4).map((slug) => (
                  <TransitionLink
                    key={slug}
                    href={`/${slug}`}
                    data-cursor="VIEW PROFILE"
                    className="font-mono text-[10px] uppercase tracking-[0.04em] px-2.5 py-1 rounded-full bg-black/5 hover:bg-[#0c0c0c] hover:text-white transition-colors text-[#0c0c0c]"
                  >
                    @{slug}
                  </TransitionLink>
                ))}
                <span className="font-mono text-[10px] text-[#767676]">+4</span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxMoment(featuredMoments[2])}
                data-cursor="VIEW"
                className="group flex items-center gap-1 font-sans text-[14px] font-normal tracking-[-0.01em] text-[#0c0c0c] hover:opacity-60 transition-opacity cursor-pointer border-b border-[#0c0c0c] pb-0.5"
              >
                <span>View moment</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* Massive Technical Crop Frame + Artwork */}
          <div className="h-[76vh] mx-[3vw] mb-[4vh] border border-dashed border-[#0c0c0c]/30 rounded-lg p-3 md:p-5 flex flex-col justify-between bg-white/10 overflow-hidden">
            {/* Technical Crop Meta Header */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-[#0c0c0c]/60 pb-2 border-b border-[#0c0c0c]/15">
              <div className="flex items-center gap-5">
                <span>OVERSCAN</span>
                <span>[ 16:9 ]</span>
                <span className="hidden sm:inline">CROP</span>
              </div>
              <div className="flex items-center gap-5">
                <span className="hidden md:inline">ACTION SAFE</span>
                <span>1632 × 918</span>
                <span className="hidden sm:inline">1499 × 864</span>
              </div>
            </div>

            {/* Giant Artwork Container */}
            <div
              onClick={() => setLightboxMoment(featuredMoments[2])}
              className="relative flex-1 w-full my-2.5 rounded overflow-hidden cursor-pointer group"
            >
              <Image
                src={featuredMoments[2].image}
                alt={featuredMoments[2].title}
                fill
                sizes="100vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Technical Bottom Markers */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-[#0c0c0c]/50 pt-2 border-t border-[#0c0c0c]/15">
              <span>{featuredMoments[2].camera}</span>
              <span>{featuredMoments[2].location}</span>
              <span>{featuredMoments[2].date}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Complete 8-Moment Archive Modal */}
      <AnimatePresence>
        {isArchiveOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[990] bg-[#0c0c0c]/95 backdrop-blur-2xl flex flex-col justify-between p-4 md:p-8 overflow-y-auto text-white select-none"
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-6 border-b border-white/15 font-mono text-[11px] tracking-[0.08em] uppercase text-white/70">
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
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md font-mono text-[9px] text-white/80 uppercase">
                      {`FRAME 0${idx + 1}`}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 px-1 pt-1">
                    <div className="flex items-center justify-between font-mono text-[9px] text-white/50 uppercase">
                      <span className="text-[#c6f432]">{moment.category}</span>
                      <span>{moment.camera.split("//")[0]}</span>
                    </div>

                    <h4
                      style={{ fontFamily: "var(--font-wordmark)" }}
                      className="text-[18px] lowercase text-white leading-tight"
                    >
                      {moment.title}
                    </h4>

                    {/* Member Pills */}
                    <div className="flex flex-wrap items-center gap-1 mt-1 pt-1 border-t border-white/10">
                      {moment.members.map((slug) => (
                        <TransitionLink
                          key={slug}
                          href={`/${slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white hover:text-black font-mono text-[9px] text-white/80 uppercase transition-colors"
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
            <div className="w-full flex items-center justify-between pt-4 border-t border-white/10 font-mono text-[10px] tracking-wider text-white/40 uppercase">
              <span>KOBRAT ARCHIVE // 2024—2025</span>
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
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 md:p-8 select-none text-white"
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between w-full z-10 font-mono text-[11px] tracking-[0.08em] uppercase text-white/70">
              <div className="flex items-center gap-3">
                <span className="text-[#c6f432] font-semibold">● FULL RESOLUTION</span>
                <span>//</span>
                <span
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[17px] lowercase text-white"
                >
                  {lightboxMoment.title}
                </span>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full z-10 font-mono text-[11px] tracking-[0.06em] text-white/60 uppercase">
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