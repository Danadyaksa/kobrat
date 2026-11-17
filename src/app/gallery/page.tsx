"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useSpring } from "motion/react";
import Header from "@/components/Header";
import TransitionLink from "@/components/TransitionLink";
import { Moment, moments as staticMoments } from "@/data/moments";

const CATEGORIES = [
  "ALL",
  "STUDIO",
  "ROOFTOP",
  "ON THE ROAD",
  "AFTER HOURS",
  "ANALOG",
] as const;

export default function GalleryPage() {
  const [momentsList, setMomentsList] = useState<Moment[]>(staticMoments);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"3col" | "2col" | "index">("3col");
  const [hoveredMoment, setHoveredMoment] = useState<Moment | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Smooth spring coordinates for the floating preview in Index mode
  const springX = useSpring(0, { stiffness: 180, damping: 22, mass: 0.4 });
  const springY = useSpring(0, { stiffness: 180, damping: 22, mass: 0.4 });

  useEffect(() => {
    let isMounted = true;
    async function fetchMoments() {
      try {
        setLoadError(null);
        const res = await fetch("/api/moments", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Could not load latest gallery moments.");
        }
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setMomentsList(data);
        }
      } catch (err) {
        console.error("Error fetching moments:", err);
        if (isMounted && momentsList.length === 0) {
          setLoadError(
            "Could not load archive from server. Showing local rolls."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchMoments();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMoments = useMemo(() => {
    if (selectedCategory === "ALL") return momentsList;
    return momentsList.filter(
      (m) => m.category.toUpperCase() === selectedCategory
    );
  }, [momentsList, selectedCategory]);

  // Keyboard navigation for Lightbox (Escape, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % filteredMoments.length : null
        );
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null
            ? (prev - 1 + filteredMoments.length) % filteredMoments.length
            : null
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredMoments.length]);

  const handleMouseMove = (e: React.MouseEvent) => {
    springX.set(e.clientX + 28);
    springY.set(e.clientY - 130);
  };

  const formatLocation = (loc: string, year: string) => {
    const cleanLoc = loc.split("//")[0].trim();
    return `${cleanLoc}, ${year}`;
  };

  const activeLightboxMoment =
    lightboxIndex !== null ? filteredMoments[lightboxIndex] : null;

  return (
    <div
      onMouseMove={viewMode === "index" ? handleMouseMove : undefined}
      className="relative min-h-dvh bg-white text-[#0c0c0c] flex flex-col selection:bg-[#0c0c0c] selection:text-white cursor-default"
    >
      {/* Top Navigation */}
      <Header introComplete={true} />

      <main className="flex-1 w-full pt-[148px] pb-24 px-[3vw]">
        <div className="max-w-[1440px] mx-auto">
          {/* ─── Editorial Masthead ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-12">
            <div className="lg:col-span-7 pt-4">
              <h1
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[clamp(42px,5.4vw,80px)] lowercase text-[#0c0c0c] leading-[1.15] tracking-[-0.02em]"
              >
                collective archive
              </h1>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <p className="text-[16px] md:text-[17px] text-[#0c0c0c] leading-[1.55] max-w-[46ch]">
                Eight friends documented across late-night studio sessions,
                Jakarta rooftops, and 35mm road rolls. Click any frame to
                inspect in full resolution.
              </p>
            </div>
          </div>

          {/* ─── Filter & Column Switcher Bar ─── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 mb-10 bg-[#f4f5f7] px-5">
            {/* Category Filter Buttons */}
            <div
              role="tablist"
              aria-label="Filter gallery by category"
              className="flex flex-wrap items-center gap-2"
            >
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                const count =
                  category === "ALL"
                    ? momentsList.length
                    : momentsList.filter(
                        (m) => m.category.toUpperCase() === category
                      ).length;

                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3.5 py-2 text-[13px] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                      isActive
                        ? "bg-[#0c0c0c] text-white font-medium"
                        : "bg-white text-[#0c0c0c] hover:bg-[#e4e6eb]"
                    }`}
                  >
                    <span className="capitalize">
                      {category.toLowerCase()}
                    </span>{" "}
                    <span
                      className={
                        isActive
                          ? "text-white/60 text-[11px]"
                          : "text-[#767676] text-[11px]"
                      }
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Grid Column & Index Switcher */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("3col")}
                className={`px-3.5 py-2 text-[13px] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                  viewMode === "3col"
                    ? "bg-[#0c0c0c] text-white font-medium"
                    : "bg-white text-[#0c0c0c] hover:bg-[#e4e6eb]"
                }`}
              >
                3 Columns
              </button>
              <button
                type="button"
                onClick={() => setViewMode("2col")}
                className={`px-3.5 py-2 text-[13px] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                  viewMode === "2col"
                    ? "bg-[#0c0c0c] text-white font-medium"
                    : "bg-white text-[#0c0c0c] hover:bg-[#e4e6eb]"
                }`}
              >
                2 Columns
              </button>
              <button
                type="button"
                onClick={() => setViewMode("index")}
                className={`px-3.5 py-2 text-[13px] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                  viewMode === "index"
                    ? "bg-[#0c0c0c] text-white font-medium"
                    : "bg-white text-[#0c0c0c] hover:bg-[#e4e6eb]"
                }`}
              >
                Archive index
              </button>
            </div>
          </div>

          {/* ─── State Handling: Error / Loading / Empty ─── */}
          {loadError && (
            <div className="mb-10 p-5 bg-[#fef2f2] text-[#991b1b] flex items-center justify-between gap-4">
              <p className="text-[14px]">{loadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#991b1b] text-white text-[12px] cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading && momentsList.length === 0 ? (
            <div className="py-32 text-center">
              <p className="text-[16px] text-[#767676]">
                Loading documentary frames from archive...
              </p>
            </div>
          ) : filteredMoments.length === 0 ? (
            <div className="py-28 px-6 bg-[#f4f5f7] text-center space-y-4">
              <h2
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[36px] lowercase text-[#0c0c0c]"
              >
                no frames in this category
              </h2>
              <p className="text-[15px] text-[#52525b] max-w-md mx-auto">
                There are no photographs tagged under{" "}
                <span className="lowercase">{selectedCategory}</span> yet. Reset
                the filter to view all rolls or upload one in the admin page.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className="px-6 py-2.5 bg-[#0c0c0c] text-white text-[13px] cursor-pointer active:scale-[0.97]"
              >
                Show all frames
              </button>
            </div>
          ) : viewMode !== "index" ? (
            /* ═══════════════════════════════════════════════════════════════════ */
            /* MODE 1: FRAMELESS AWWWARDS CONTACT SHEET (3 / 2 COLUMNS + FOCUS)   */
            /* ═══════════════════════════════════════════════════════════════════ */
            <div
              className={`group/grid grid gap-x-8 gap-y-14 ${
                viewMode === "3col"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {filteredMoments.map((moment, idx) => (
                <motion.article
                  key={moment.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.45,
                    delay: (idx % 3) * 0.06,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className="group flex flex-col justify-between transition-opacity duration-300 group-hover/grid:opacity-45 hover:!opacity-100"
                >
                  <div>
                    {/* Top Frame Caption */}
                    <div className="flex items-center justify-between gap-2 text-[12px] text-[#767676] mb-2">
                      <span className="capitalize text-[#0c0c0c] font-medium">
                        {moment.category.toLowerCase()}
                      </span>
                      <span>{formatLocation(moment.location, moment.year)}</span>
                    </div>

                    {/* Landscape 16:10 Contact Frame */}
                    <div
                      onClick={() => setLightboxIndex(idx)}
                      data-cursor="VIEW"
                      className="relative w-full aspect-[16/10] bg-[#111] overflow-hidden cursor-pointer mb-3.5"
                    >
                      <Image
                        src={moment.image}
                        alt={moment.title}
                        fill
                        priority={idx < 3}
                        sizes={
                          viewMode === "3col"
                            ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            : "(max-width: 768px) 100vw, 50vw"
                        }
                        className="object-cover object-[center_58%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>

                    <div className="flex items-baseline justify-between gap-3">
                      <h2
                        onClick={() => setLightboxIndex(idx)}
                        style={{ fontFamily: "var(--font-wordmark)" }}
                        className="text-[clamp(24px,2.4vw,34px)] lowercase text-[#0c0c0c] leading-[1.08] cursor-pointer"
                      >
                        {moment.title}
                      </h2>

                      <button
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="text-[12px] text-[#767676] group-hover:text-[#0c0c0c] underline underline-offset-4 cursor-pointer shrink-0"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>

                  {/* Subtle Member Links */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {moment.members.map((slug) => (
                      <TransitionLink
                        key={slug}
                        href={`/${slug}`}
                        className="px-2 py-0.5 bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white text-[11px] text-[#52525b] capitalize transition-colors"
                      >
                        {slug}
                      </TransitionLink>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════════ */
            /* MODE 2: INTERACTIVE TYPOGRAPHIC ARCHIVE INDEX                       */
            /* ═══════════════════════════════════════════════════════════════════ */
            <div
              onMouseLeave={() => setHoveredMoment(null)}
              className="relative"
            >
              <div className="flex flex-col">
                {filteredMoments.map((moment, idx) => (
                  <div
                    key={moment.id}
                    onMouseEnter={() => setHoveredMoment(moment)}
                    onClick={() => setLightboxIndex(idx)}
                    data-cursor="INSPECT"
                    className="group py-6 px-5 even:bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white transition-colors duration-200 flex flex-col md:flex-row md:items-baseline justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-baseline gap-6">
                      <h2
                        style={{ fontFamily: "var(--font-wordmark)" }}
                        className="text-[clamp(28px,4vw,52px)] lowercase leading-[1.08]"
                      >
                        {moment.title}
                      </h2>
                      <span className="text-[14px] text-[#767676] group-hover:text-white/70 capitalize">
                        {moment.category.toLowerCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-8 text-[14px] text-[#52525b] group-hover:text-white/80">
                      <span>{formatLocation(moment.location, moment.year)}</span>
                      <span className="underline">Inspect</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating Spring-Driven Image Preview on Desktop Hover */}
              <AnimatePresence>
                {hoveredMoment && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      x: springX,
                      y: springY,
                    }}
                    className="pointer-events-none fixed top-0 left-0 z-[80] hidden lg:block w-[420px] aspect-[16/10] bg-[#111] p-1.5 overflow-hidden"
                  >
                    <Image
                      src={hoveredMoment.image}
                      alt={hoveredMoment.title}
                      fill
                      sizes="420px"
                      className="object-cover object-[center_58%]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* ─── Designed Footer Close (Full-width Wordmark Return) ─── */}
      <footer className="w-full bg-[#f4f5f7] px-[3vw] py-16">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div>
            <TransitionLink
              href="/"
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[clamp(48px,8vw,112px)] lowercase text-[#0c0c0c] leading-[1.04] inline-block hover:opacity-70 transition-opacity"
            >
              kobrat
            </TransitionLink>
            <p className="mt-2 text-[14px] text-[#52525b]">
              Eight minds on one wavelength. Jakarta & Remote.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[14px] text-[#0c0c0c]">
            <TransitionLink href="/" className="underline hover:opacity-65">
              Back to home
            </TransitionLink>
            <TransitionLink
              href="/admin?tab=moments"
              className="underline hover:opacity-65"
            >
              Manage gallery in admin
            </TransitionLink>
          </div>
        </div>
      </footer>

      {/* ─── Fullscreen Lightbox with Prev / Next Stepping ─── */}
      <AnimatePresence>
        {activeLightboxMoment && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[999] bg-[#0c0c0c]/95 flex flex-col justify-between p-4 md:p-8 select-none text-white"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between w-full z-10 text-[13px]">
              <div className="flex items-baseline gap-4">
                <span
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[26px] lowercase text-white leading-none"
                >
                  {activeLightboxMoment.title}
                </span>
                <span className="text-white/50">
                  {lightboxIndex + 1} of {filteredMoments.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      (lightboxIndex - 1 + filteredMoments.length) %
                        filteredMoments.length
                    )
                  }
                  className="px-3.5 py-2 bg-white/10 hover:bg-white hover:text-[#0c0c0c] transition-colors text-[12px] cursor-pointer active:scale-[0.97]"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      (lightboxIndex + 1) % filteredMoments.length
                    )
                  }
                  className="px-3.5 py-2 bg-white/10 hover:bg-white hover:text-[#0c0c0c] transition-colors text-[12px] cursor-pointer active:scale-[0.97]"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="ml-2 px-4 py-2 bg-white text-[#0c0c0c] hover:bg-white/85 transition-colors text-[12px] font-medium cursor-pointer active:scale-[0.97]"
                >
                  Close (Esc)
                </button>
              </div>
            </div>

            {/* Center High-Res Frame */}
            <div
              onClick={() => setLightboxIndex(null)}
              className="relative flex-1 w-full max-h-[76vh] flex items-center justify-center my-4 cursor-pointer"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full h-full max-w-6xl overflow-hidden"
              >
                <Image
                  src={activeLightboxMoment.image}
                  alt={activeLightboxMoment.title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Bottom Story & Members */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full z-10 text-[13px] text-white/75">
              <div className="space-y-1 max-w-2xl">
                <p className="text-white/90">
                  {activeLightboxMoment.description}
                </p>
                <p className="text-white/50 text-[12px]">
                  {formatLocation(
                    activeLightboxMoment.location,
                    activeLightboxMoment.year
                  )}{" "}
                  · {activeLightboxMoment.date}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeLightboxMoment.members.map((slug) => (
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
    </div>
  );
}
