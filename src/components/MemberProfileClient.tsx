"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Header from "@/components/Header";
import TransitionLink from "@/components/TransitionLink";
import { getLenis } from "@/components/SmoothScroll";
import {
  Member,
  getMemberSlug,
  findMemberBySlug,
  formatInstagramLink,
  formatGithubLink,
  formatWebsiteLink,
} from "@/data/members";
import { Moment } from "@/data/moments";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SCRAMBLE_POOL = "abcdefghijklmnopqrstuvwxyz0123456789";

// Deterministic crisp SVG barcode unique to each member
function ProfileBarcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    const list: { w: number; gap: number }[] = [];
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    for (let i = 0; i < 26; i++) {
      hash ^= hash << 13;
      hash ^= hash >>> 17;
      hash ^= hash << 5;
      const v = Math.abs(hash);
      list.push({
        w: (v % 3) + 1,
        gap: ((v >> 3) % 2) + 1,
      });
    }
    return list;
  }, [seed]);

  let x = 0;
  return (
    <svg
      width="104"
      height="16"
      viewBox="0 0 104 16"
      fill="currentColor"
      aria-hidden="true"
      className="text-[#0c0c0c]/75 shrink-0"
    >
      {bars.map((b, idx) => {
        const curX = x;
        x += b.w + b.gap;
        if (curX + b.w > 104) return null;
        return <rect key={idx} x={curX} y={0} width={b.w} height={16} />;
      })}
    </svg>
  );
}

// Magnetic interactive external channel card (pulls subtly toward cursor with spring physics)
function MagneticChannelCard({
  href,
  label,
  value,
  icon,
}: {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 260, damping: 18, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 260, damping: 18, mass: 0.4 });

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    rawX.set(dx * 0.16);
    rawY.set(dy * 0.22);
  };

  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className="group p-4 rounded-[10px] bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white transition-[background-color,color] duration-150 ease-out active:scale-[0.97] flex flex-col justify-between gap-3 will-change-transform"
    >
      <div className="flex items-center justify-between text-[#52525b] group-hover:text-white/70">
        <span className="inline-flex items-center gap-1.5 text-[12px]">
          {icon}
          <span>{label}</span>
        </span>
        <span className="text-[13px] transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          ↗
        </span>
      </div>
      <span className="text-[15px] font-medium truncate">{value}</span>
    </motion.a>
  );
}

interface MemberProfileClientProps {
  slug: string;
  initialMember: Member;
  initialMembers: Member[];
  initialMoments: Moment[];
}

export default function MemberProfileClient({
  slug,
  initialMember,
  initialMembers,
  initialMoments,
}: MemberProfileClientProps) {
  const [membersList, setMembersList] = useState<Member[]>(initialMembers);
  const [momentsList, setMomentsList] = useState<Moment[]>(initialMoments);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [hoveredDockId, setHoveredDockId] = useState<number | null>(null);
  const [activeReelIdx, setActiveReelIdx] = useState<number>(1);

  const heroSectionRef = useRef<HTMLElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const portraitScrollWrapRef = useRef<HTMLDivElement>(null);
  const portraitInnerImgRef = useRef<HTMLDivElement>(null);

  const reelSectionRef = useRef<HTMLElement>(null);
  const reelTrackRef = useRef<HTMLDivElement>(null);
  const reelSkewWrapRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  // Sync fresh data from /api/members and /api/moments
  useEffect(() => {
    let isMounted = true;
    async function syncFresh() {
      try {
        const [memRes, momRes] = await Promise.all([
          fetch("/api/members", { cache: "no-store" }),
          fetch("/api/moments", { cache: "no-store" }),
        ]);
        if (memRes.ok) {
          const memData = await memRes.json();
          if (isMounted && Array.isArray(memData) && memData.length > 0) {
            setMembersList(memData);
          }
        }
        if (momRes.ok) {
          const momData = await momRes.json();
          if (isMounted && Array.isArray(momData) && momData.length > 0) {
            setMomentsList(momData);
          }
        }
      } catch {
        // Keep server-provided initial data
      }
    }
    syncFresh();
    return () => {
      isMounted = false;
    };
  }, []);

  const member = useMemo(() => {
    return findMemberBySlug(membersList, slug) || initialMember;
  }, [membersList, slug, initialMember]);

  const nicknameDisplay = member.nickname?.trim() || member.name.trim();
  const fullNameDisplay = member.name.trim();

  // Subtle character scramble on Full Name when arriving on profile
  const [scrambledFullName, setScrambledFullName] =
    useState<string>(fullNameDisplay);

  useEffect(() => {
    setScrambledFullName(fullNameDisplay);
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const progressObj = { p: 0 };
    const tween = gsap.to(progressObj, {
      p: 1,
      duration: 0.65,
      delay: 0.12,
      ease: "power2.out",
      onUpdate: () => {
        const resolved = Math.floor(progressObj.p * fullNameDisplay.length);
        let out = "";
        for (let i = 0; i < fullNameDisplay.length; i++) {
          const ch = fullNameDisplay[i];
          if (i < resolved || ch === " ") {
            out += ch;
          } else {
            out +=
              SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
          }
        }
        setScrambledFullName(out);
      },
      onComplete: () => setScrambledFullName(fullNameDisplay),
    });

    return () => {
      tween.kill();
    };
  }, [fullNameDisplay]);

  const memberIndex = useMemo(() => {
    const idx = membersList.findIndex((m) => m.id === member.id);
    return idx >= 0 ? idx : 0;
  }, [membersList, member.id]);

  const prevMember =
    membersList[(memberIndex - 1 + membersList.length) % membersList.length];
  const nextMember = membersList[(memberIndex + 1) % membersList.length];

  // Moments where this member appears
  const featuredMoments = useMemo(() => {
    const mSlug = getMemberSlug(member).toLowerCase();
    const mNick = (member.nickname || "").toLowerCase().trim();
    const mName = member.name.toLowerCase().trim();
    return momentsList.filter((mom) =>
      mom.members.some((tag) => {
        const t = tag.toLowerCase().trim();
        return t === mSlug || t === mNick || t === mName;
      })
    );
  }, [momentsList, member]);

  // ─── Interactive Draggable + 3D Gyro Tilt Studio Portrait Physics ───
  const dragState = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
  });

  const rawDragX = useMotionValue(0);
  const rawDragY = useMotionValue(0);
  const dragX = useSpring(rawDragX, { stiffness: 250, damping: 16, mass: 0.75 });
  const dragY = useSpring(rawDragY, { stiffness: 250, damping: 16, mass: 0.75 });

  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);
  const rawSwingZ = useMotionValue(0);
  const tiltX = useSpring(rawTiltX, { stiffness: 210, damping: 20, mass: 0.55 });
  const tiltY = useSpring(rawTiltY, { stiffness: 210, damping: 20, mass: 0.55 });
  const swingZ = useSpring(rawSwingZ, { stiffness: 190, damping: 14, mass: 0.8 });

  const sheenPos = useSpring(50, { stiffness: 190, damping: 24 });
  const sheenAlpha = useSpring(0, { stiffness: 190, damping: 24 });
  const sheenTransform = useTransform(
    sheenPos,
    (v) => `translate3d(${(v - 50) * 2.5}%, 0, 0) skewX(-20deg)`
  );

  const handlePortraitDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
    };
    sheenAlpha.set(0.6);
  };

  const handlePortraitPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragState.current;
    if (ds.active) {
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      const stepX = e.clientX - ds.lastX;
      ds.lastX = e.clientX;

      const dampedX =
        Math.sign(dx) * Math.min(120, Math.pow(Math.abs(dx), 0.84) * 1.5);
      const dampedY =
        Math.sign(dy) * Math.min(100, Math.pow(Math.abs(dy), 0.84) * 1.4);

      rawDragX.set(dampedX);
      rawDragY.set(dampedY);
      rawSwingZ.set(Math.max(-14, Math.min(14, dampedX * 0.08 + stepX * 0.28)));
      rawTiltY.set(Math.max(-20, Math.min(20, dampedX * 0.15)));
      rawTiltX.set(Math.max(-18, Math.min(18, -dampedY * 0.14)));
      sheenPos.set(50 + dampedX * 0.35);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawTiltX.set(-ny * 16);
    rawTiltY.set(nx * 20);
    rawSwingZ.set(nx * 2.2);
    sheenPos.set((nx + 0.5) * 100);
    sheenAlpha.set(0.48);
  };

  const handlePortraitUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragState.current;
    if (!ds.active) return;
    if (e.currentTarget.hasPointerCapture(ds.pointerId)) {
      e.currentTarget.releasePointerCapture(ds.pointerId);
    }
    ds.active = false;
    rawDragX.set(0);
    rawDragY.set(0);
    rawSwingZ.set(0);
    rawTiltX.set(0);
    rawTiltY.set(0);
    sheenAlpha.set(0);
  };

  const handlePortraitLeave = () => {
    if (dragState.current.active) return;
    rawTiltX.set(0);
    rawTiltY.set(0);
    rawSwingZ.set(0);
    sheenAlpha.set(0);
  };

  // ─── GSAP ScrollTrigger: Hero Watermark & Portrait Parallax + Horizontal 35mm Reel ───
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // 1. Hero scroll-linked kinetic watermark drift & portrait counter-parallax
      if (
        heroSectionRef.current &&
        watermarkRef.current &&
        portraitScrollWrapRef.current
      ) {
        gsap.fromTo(
          watermarkRef.current,
          { xPercent: 4 },
          {
            xPercent: -24,
            ease: "none",
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.4,
            },
          }
        );

        gsap.fromTo(
          portraitScrollWrapRef.current,
          { yPercent: 0, rotation: 0 },
          {
            yPercent: -12,
            rotation: 2.2,
            ease: "none",
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.5,
            },
          }
        );

        if (portraitInnerImgRef.current) {
          gsap.fromTo(
            portraitInnerImgRef.current,
            { scale: 1.09 },
            {
              scale: 1.0,
              ease: "none",
              scrollTrigger: {
                trigger: heroSectionRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 0.5,
              },
            }
          );
        }
      }

      // 2. Pinned Horizontal 35mm Filmstrip Reel (on desktop when >= 3 moments)
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const reelSection = reelSectionRef.current;
        const reelTrack = reelTrackRef.current;
        if (!reelSection || !reelTrack || featuredMoments.length < 3) return;

        const getScrollDistance = () =>
          Math.max(0, reelTrack.scrollWidth - window.innerWidth + 96);

        const scrollTween = gsap.to(reelTrack, {
          x: () => -getScrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: reelSection,
            pin: true,
            start: "top top",
            end: () => `+=${Math.max(600, getScrollDistance() * 1.15)}`,
            scrub: 0.55,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const idx = Math.min(
                featuredMoments.length,
                Math.max(
                  1,
                  Math.round(self.progress * (featuredMoments.length - 1)) + 1
                )
              );
              setActiveReelIdx(idx);

              if (progressFillRef.current) {
                progressFillRef.current.style.transform = `scaleX(${Math.max(
                  0.08,
                  self.progress
                )})`;
              }
            },
          },
        });

        // Subtle internal horizontal counter-parallax on each frame image
        const innerImgs = reelTrack.querySelectorAll(".reel-photo-inner");
        innerImgs.forEach((imgEl) => {
          gsap.fromTo(
            imgEl,
            { xPercent: -7, scale: 1.12 },
            {
              xPercent: 7,
              scale: 1.12,
              ease: "none",
              scrollTrigger: {
                trigger: imgEl,
                containerAnimation: scrollTween,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            }
          );
        });
      });
    });

    // Velocity-reactive skew on the filmstrip track as user scrolls
    let rafId: number;
    let currentSkew = 0;
    const updateVelocitySkew = () => {
      const skewWrap = reelSkewWrapRef.current;
      if (skewWrap) {
        const lenis = getLenis();
        const vel = lenis ? lenis.velocity : 0;
        const targetSkew = Math.max(-3.2, Math.min(3.2, -vel * 0.055));
        currentSkew += (targetSkew - currentSkew) * 0.14;
        if (Math.abs(currentSkew) > 0.01) {
          skewWrap.style.transform = `skewX(${currentSkew.toFixed(2)}deg)`;
        } else {
          skewWrap.style.transform = "skewX(0deg)";
        }
      }
      rafId = requestAnimationFrame(updateVelocitySkew);
    };
    rafId = requestAnimationFrame(updateVelocitySkew);

    return () => {
      cancelAnimationFrame(rafId);
      ctx.revert();
    };
  }, [featuredMoments]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % featuredMoments.length : null
        );
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null
            ? (prev - 1 + featuredMoments.length) % featuredMoments.length
            : null
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, featuredMoments.length]);

  const igInfo = formatInstagramLink(member.instagram);
  const ghInfo = formatGithubLink(member.github);
  const webInfo = formatWebsiteLink(member.website);
  const credentialCode = `KBRT · ${nicknameDisplay.toUpperCase()}`;

  const formatLocation = (loc: string, year: string) => {
    const cleanLoc = loc.split("//")[0].trim();
    return `${cleanLoc}, ${year}`;
  };

  const activeLightboxMoment =
    lightboxIndex !== null ? featuredMoments[lightboxIndex] : null;

  return (
    <div className="relative min-h-dvh bg-white text-[#0c0c0c] flex flex-col selection:bg-[#0c0c0c] selection:text-white cursor-default">
      {/* Unified Kobrat Top Header */}
      <Header introComplete={true} />

      <main className="relative flex-1 w-full">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: KINETIC HERO + DRAGGABLE 3D PORTRAIT MONOLITH            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section
          ref={heroSectionRef}
          className="relative w-full pt-[96px] sm:pt-[118px] md:pt-[128px] pb-14 sm:pb-20 px-4 sm:px-[3vw] overflow-x-clip"
        >
          {/* Scroll-Scrubbed Giant Gothic Watermark */}
          <div
            ref={watermarkRef}
            aria-hidden="true"
            style={{ fontFamily: "var(--font-wordmark)" }}
            className="pointer-events-none absolute top-[104px] right-[-4vw] whitespace-nowrap text-[clamp(160px,26vw,380px)] lowercase text-[#f4f5f8] leading-none select-none z-0 will-change-transform"
          >
            {nicknameDisplay} · kobrat
          </div>

          <div className="relative z-10 max-w-[1340px] mx-auto">
            {/* Top Breadcrumb Back to Members */}
            <div className="mb-6 sm:mb-8">
              <TransitionLink
                href="/members"
                className="inline-flex items-center gap-2 text-[13px] sm:text-[14px] text-[#52525b] hover:text-[#0c0c0c] transition-colors"
              >
                <span>←</span>
                <span className="underline underline-offset-4">All members</span>
              </TransitionLink>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Left Column: Interactive Split-Letter Gothic Nickname, Scramble Name & Magnetic Links */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  {/* 1. Split-Character Interactive Gothic Nickname */}
                  <h1
                    aria-label={nicknameDisplay}
                    style={{ fontFamily: "var(--font-wordmark)" }}
                    className="text-[clamp(44px,9.2vw,136px)] lowercase text-[#0c0c0c] leading-[1.14] tracking-[-0.02em] flex flex-wrap"
                  >
                    {nicknameDisplay.split("").map((char, idx) => (
                      <motion.span
                        key={`${slug}-ch-${idx}`}
                        initial={{ y: "85%", opacity: 0 }}
                        animate={{ y: "0%", opacity: 1 }}
                        transition={{
                          duration: 0.55,
                          delay: idx * 0.045,
                          ease: [0.23, 1, 0.32, 1],
                        }}
                        whileHover={{
                          y: -8,
                          rotate: idx % 2 === 0 ? -3 : 3,
                          transition: {
                            type: "spring",
                            stiffness: 380,
                            damping: 15,
                          },
                        }}
                        className="inline-block will-change-transform select-none"
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </h1>

                  {/* 2. Full Name with Subtle Character Scramble Reveal */}
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.14,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    className="mt-4 sm:mt-7 text-[18px] sm:text-[21px] md:text-[25px] font-medium text-[#0c0c0c] leading-[1.3]"
                  >
                    {scrambledFullName}
                  </motion.p>

                  {/* 3. Personal Bio / Statement */}
                  {member.bio && (
                    <motion.blockquote
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.48,
                        delay: 0.22,
                        ease: [0.23, 1, 0.32, 1],
                      }}
                      className="mt-4 sm:mt-6 text-[15px] sm:text-[18px] md:text-[21px] text-[#3f3f46] leading-[1.55] max-w-[46ch]"
                    >
                      “{member.bio}”
                    </motion.blockquote>
                  )}
                </div>

                {/* 4. Magnetic External Channels (Portfolio · GitHub · Instagram) */}
                {(webInfo || ghInfo || igInfo) && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.28,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    className="mt-10 pt-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 max-w-[680px]">
                      {webInfo && (
                        <MagneticChannelCard
                          href={webInfo.href}
                          label="Portfolio"
                          value={webInfo.label}
                          icon={
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              aria-hidden="true"
                              className="w-3.5 h-3.5 shrink-0"
                            >
                              <circle cx="8" cy="8" r="6" />
                              <path d="M2.2 8h11.6M8 2a9.8 9.8 0 0 1 2.4 6A9.8 9.8 0 0 1 8 14a9.8 9.8 0 0 1-2.4-6A9.8 9.8 0 0 1 8 2Z" />
                            </svg>
                          }
                        />
                      )}

                      {ghInfo && (
                        <MagneticChannelCard
                          href={ghInfo.href}
                          label="GitHub"
                          value={`@${ghInfo.username}`}
                          icon={
                            <svg
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              aria-hidden="true"
                              className="w-3.5 h-3.5 shrink-0"
                            >
                              <path d="M8 1.2a6.8 6.8 0 0 0-2.15 13.25c.34.06.46-.15.46-.33v-1.15c-1.89.41-2.29-.91-2.29-.91-.31-.78-.75-.99-.75-.99-.62-.42.05-.41.05-.41.68.05 1.04.7 1.04.7.61 1.04 1.59.74 1.98.57.06-.44.24-.74.43-.91-1.51-.17-3.1-.76-3.1-3.37 0-.74.27-1.35.7-1.83-.07-.17-.3-.86.07-1.8 0 0 .57-.18 1.87.7a6.5 6.5 0 0 1 3.4 0c1.3-.88 1.87-.7 1.87-.7.37.94.14 1.63.07 1.8.44.48.7 1.09.7 1.83 0 2.62-1.59 3.2-3.11 3.37.24.21.46.62.46 1.26v1.87c0 .18.12.39.47.33A6.8 6.8 0 0 0 8 1.2Z" />
                            </svg>
                          }
                        />
                      )}

                      {igInfo && (
                        <MagneticChannelCard
                          href={igInfo.href}
                          label="Instagram"
                          value={igInfo.label}
                          icon={
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              aria-hidden="true"
                              className="w-3.5 h-3.5 shrink-0"
                            >
                              <rect x="2" y="2" width="12" height="12" rx="3.5" />
                              <circle cx="8" cy="8" r="2.75" />
                              <circle
                                cx="11.6"
                                cy="4.4"
                                r="0.7"
                                fill="currentColor"
                                stroke="none"
                              />
                            </svg>
                          }
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Column: Grab-and-Pull + Scroll-Parallax 3D Studio Portrait Plate */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 26 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.62,
                  delay: 0.08,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="lg:col-span-5 flex justify-center lg:justify-end perspective-1200"
              >
                <div
                  ref={portraitScrollWrapRef}
                  className="w-full max-w-[430px] will-change-transform"
                >
                  <motion.div
                    onPointerDown={handlePortraitDown}
                    onPointerMove={handlePortraitPointerMove}
                    onPointerUp={handlePortraitUp}
                    onPointerCancel={handlePortraitUp}
                    onPointerLeave={handlePortraitLeave}
                    style={{
                      x: dragX,
                      y: dragY,
                      rotateX: tiltX,
                      rotateY: tiltY,
                      rotateZ: swingZ,
                    }}
                    data-cursor="DRAG"
                    className="relative w-full transform-style-3d will-change-transform select-none touch-pan-y cursor-grab active:cursor-grabbing"
                  >
                    {/* 3D Card Stock Core Backing */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-[18px] bg-[#d4d6dc]"
                    />

                    {/* Framed Studio Portrait Print */}
                    <div
                      style={{ transform: "translateZ(4px)" }}
                      className="relative rounded-[18px] bg-[#eff0f4] p-4 sm:p-5 flex flex-col gap-4 overflow-hidden"
                    >
                      {/* Dynamic Acrylic Light Sheen */}
                      <motion.div
                        aria-hidden="true"
                        style={{
                          opacity: sheenAlpha,
                          transform: sheenTransform,
                        }}
                        className="pointer-events-none absolute -inset-y-16 left-1/3 w-32 bg-white/55 z-[25] will-change-transform"
                      />

                      {/* Top Credential Stamp */}
                      <div
                        style={{ transform: "translateZ(16px)" }}
                        className="flex items-center justify-between text-[12px] text-[#52525b] px-1"
                      >
                        <span
                          style={{ fontFamily: "var(--font-wordmark)" }}
                          className="text-[20px] lowercase text-[#0c0c0c] leading-none"
                        >
                          kobrat
                        </span>
                        <span className="tabular-nums font-medium">
                          {credentialCode}
                        </span>
                      </div>

                      {/* 3:4 High-Res Studio Portrait with Scroll Zoom-Out */}
                      <div
                        style={{ transform: "translateZ(24px)" }}
                        className="relative w-full aspect-[3/4] rounded-[12px] bg-[#111] overflow-hidden"
                      >
                        <div
                          ref={portraitInnerImgRef}
                          className="relative w-full h-full will-change-transform"
                        >
                          <Image
                            src={member.image}
                            alt={fullNameDisplay}
                            fill
                            priority
                            sizes="(max-width: 1024px) 90vw, 420px"
                            draggable={false}
                            className="object-cover object-center select-none pointer-events-none"
                          />
                        </div>
                      </div>

                      {/* Bottom Barcode & Identity Footnote */}
                      <div
                        style={{ transform: "translateZ(16px)" }}
                        className="flex items-center justify-between gap-3 px-1 pt-0.5"
                      >
                        <ProfileBarcode
                          seed={`${member.id}-${fullNameDisplay}-${slug}`}
                        />
                        <span className="text-[12px] text-[#52525b] truncate">
                          {fullNameDisplay}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: PINNED HORIZONTAL 35MM CINEMA REEL (ON SCROLL)          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {featuredMoments.length >= 3 ? (
          <section
            ref={reelSectionRef}
            aria-label={`Collective frames with ${nicknameDisplay}`}
            className="relative w-full bg-[#0c0c0c] text-white py-16 lg:py-0 lg:h-dvh flex flex-col justify-center overflow-hidden select-none"
          >
            {/* Reel Top HUD Bar */}
            <div className="w-full max-w-[1380px] mx-auto px-[3vw] mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[clamp(36px,4.8vw,64px)] lowercase text-white leading-[1.12]"
                >
                  frames with {nicknameDisplay}
                </h2>
              </div>

              <div className="flex items-center gap-6">
                {/* Live Scroll Progress Track (Desktop) */}
                <div className="hidden lg:flex items-center gap-3 text-[13px] text-white/70 tabular-nums">
                  <span>
                    {activeReelIdx} of {featuredMoments.length}
                  </span>
                  <div className="w-28 h-[3px] bg-white/15 overflow-hidden">
                    <div
                      ref={progressFillRef}
                      style={{ transform: "scaleX(0.15)" }}
                      className="w-full h-full bg-white origin-left will-change-transform"
                    />
                  </div>
                </div>

                <TransitionLink
                  href="/gallery"
                  className="text-[14px] text-white underline underline-offset-4 hover:opacity-70 transition-opacity"
                >
                  Full gallery ({momentsList.length})
                </TransitionLink>
              </div>
            </div>

            {/* Horizontal Scrubbing Track on Desktop / Responsive Grid on Mobile */}
            <div
              ref={reelSkewWrapRef}
              className="w-full will-change-transform"
            >
              <div
                ref={reelTrackRef}
                className="px-[3vw] lg:pl-[max(3vw,calc((100vw-1340px)/2+3vw))] flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row gap-8 lg:gap-10 lg:w-max will-change-transform"
              >
                {featuredMoments.map((moment, idx) => (
                  <article
                    key={moment.id}
                    onClick={() => setLightboxIndex(idx)}
                    data-cursor="VIEW"
                    className="group lg:w-[540px] xl:w-[600px] shrink-0 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[12px] text-white/55 mb-2.5">
                      {moment.category ? (
                        <span className="capitalize text-white font-medium">
                          {moment.category.toLowerCase()}
                        </span>
                      ) : (
                        <span className="text-white font-medium">
                          {moment.year}
                        </span>
                      )}
                      <span>{formatLocation(moment.location, moment.year)}</span>
                    </div>

                    <div className="relative w-full aspect-[16/10] bg-[#18181b] overflow-hidden mb-3.5">
                      <div className="reel-photo-inner relative w-full h-full will-change-transform">
                        <Image
                          src={moment.image}
                          alt={moment.title}
                          fill
                          sizes="(max-width: 1024px) 90vw, 600px"
                          draggable={false}
                          className="object-cover object-[center_58%] transition-transform duration-700 ease-out group-hover:scale-[1.04] select-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-4">
                      <h3
                        style={{ fontFamily: "var(--font-wordmark)" }}
                        className="text-[clamp(24px,2.5vw,36px)] lowercase text-white leading-[1.2]"
                      >
                        {moment.title}
                      </h3>
                      <span className="text-[12px] text-white/60 group-hover:text-white underline underline-offset-4 shrink-0">
                        Inspect
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : featuredMoments.length > 0 ? (
          /* Fallback Diptych if Member Only Appears in 1-2 Frames */
          <section className="w-full bg-[#0c0c0c] text-white py-20 px-[3vw]">
            <div className="max-w-[1340px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <h2
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[clamp(36px,4.8vw,64px)] lowercase text-white leading-[1.12]"
                >
                  frames with {nicknameDisplay}
                </h2>
                <TransitionLink
                  href="/gallery"
                  className="text-[14px] text-white underline underline-offset-4 hover:opacity-70 transition-opacity"
                >
                  Full gallery ({momentsList.length})
                </TransitionLink>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredMoments.map((moment, idx) => (
                  <article
                    key={moment.id}
                    onClick={() => setLightboxIndex(idx)}
                    data-cursor="VIEW"
                    className="group cursor-pointer"
                  >
                    <div className="relative w-full aspect-[16/10] bg-[#18181b] overflow-hidden mb-3.5">
                      <Image
                        src={moment.image}
                        alt={moment.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-[center_58%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <h3
                      style={{ fontFamily: "var(--font-wordmark)" }}
                      className="text-[clamp(24px,2.5vw,36px)] lowercase text-white leading-[1.2]"
                    >
                      {moment.title}
                    </h3>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: INTERACTIVE 8-MEMBER DOCK + PREV / NEXT ROSTER PORTAL    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-14 sm:py-24 px-4 sm:px-[3vw] bg-white">
          <div className="max-w-[1340px] mx-auto space-y-10 sm:space-y-12">
            {/* Interactive 8-Mind Magnification Dock */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 p-4 sm:p-6 rounded-[14px] sm:rounded-[16px] bg-[#f4f5f7]">
              <div>
                <h2
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[clamp(24px,3vw,38px)] lowercase text-[#0c0c0c] leading-[1.12]"
                >
                  the circle
                </h2>
                <p className="text-[12px] sm:text-[13px] text-[#52525b] mt-0.5">
                  Jump directly to any member of Kobrat
                </p>
              </div>

              <div
                onMouseLeave={() => setHoveredDockId(null)}
                className="flex flex-wrap items-center gap-2 sm:gap-2.5"
              >
                {membersList.map((m) => {
                  const mSlug = getMemberSlug(m);
                  const isCurrent = m.id === member.id;
                  const isHovered = hoveredDockId === m.id;
                  const mNick = m.nickname?.trim() || m.name.trim();

                  return (
                    <TransitionLink
                      key={m.id}
                      href={`/${mSlug}`}
                      onMouseEnter={() => setHoveredDockId(m.id)}
                      aria-current={isCurrent ? "page" : undefined}
                      title={m.name}
                      className="relative flex flex-col items-center group"
                    >
                      <motion.div
                        animate={{
                          scale: isHovered ? 1.18 : isCurrent ? 1.06 : 1,
                          y: isHovered ? -5 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 360,
                          damping: 20,
                        }}
                        className={`relative w-[40px] sm:w-[48px] h-[52px] sm:h-[62px] rounded-[6px] sm:rounded-[8px] overflow-hidden bg-[#111] will-change-transform ${
                          isCurrent
                            ? "ring-2 ring-[#0c0c0c] ring-offset-2 ring-offset-[#f4f5f7]"
                            : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={m.image}
                          alt={m.name}
                          fill
                          sizes="60px"
                          className="object-cover"
                        />
                      </motion.div>
                      <span
                        className={`mt-1 text-[10px] sm:text-[11px] lowercase transition-colors ${
                          isCurrent || isHovered
                            ? "text-[#0c0c0c] font-semibold"
                            : "text-[#71717a]"
                        }`}
                      >
                        {mNick}
                      </span>
                    </TransitionLink>
                  );
                })}
              </div>
            </div>

            {/* Previous / Next Member Cards */}
            {membersList.length > 1 && prevMember && nextMember && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <TransitionLink
                  href={`/${getMemberSlug(prevMember)}`}
                  data-cursor="PREV MEMBER"
                  className="group p-4 sm:p-6 rounded-[12px] sm:rounded-[14px] bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white transition-[background-color,color] duration-200 flex items-center gap-4 sm:gap-5"
                >
                  <div className="relative w-[52px] sm:w-[64px] aspect-[3/4] rounded-[8px] bg-[#111] overflow-hidden shrink-0">
                    <Image
                      src={prevMember.image}
                      alt={prevMember.name}
                      fill
                      sizes="72px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] sm:text-[12px] text-[#767676] group-hover:text-white/60 mb-0.5 sm:mb-1">
                      ← Previous member
                    </span>
                    <span
                      style={{ fontFamily: "var(--font-wordmark)" }}
                      className="block text-[clamp(22px,3vw,38px)] lowercase leading-[1.24] py-0.5 sm:py-1"
                    >
                      {prevMember.nickname || prevMember.name}
                    </span>
                    <span className="block text-[12px] sm:text-[13px] text-[#52525b] group-hover:text-white/75 truncate mt-0.5 sm:mt-1">
                      {prevMember.name}
                    </span>
                  </div>
                </TransitionLink>

                <TransitionLink
                  href={`/${getMemberSlug(nextMember)}`}
                  data-cursor="NEXT MEMBER"
                  className="group p-4 sm:p-6 rounded-[12px] sm:rounded-[14px] bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white transition-[background-color,color] duration-200 flex items-center justify-between gap-4 sm:gap-5 text-right"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] sm:text-[12px] text-[#767676] group-hover:text-white/60 mb-0.5 sm:mb-1">
                      Next member →
                    </span>
                    <span
                      style={{ fontFamily: "var(--font-wordmark)" }}
                      className="block text-[clamp(22px,3vw,38px)] lowercase leading-[1.24] py-0.5 sm:py-1"
                    >
                      {nextMember.nickname || nextMember.name}
                    </span>
                    <span className="block text-[12px] sm:text-[13px] text-[#52525b] group-hover:text-white/75 truncate mt-0.5 sm:mt-1">
                      {nextMember.name}
                    </span>
                  </div>
                  <div className="relative w-[52px] sm:w-[64px] aspect-[3/4] rounded-[8px] bg-[#111] overflow-hidden shrink-0">
                    <Image
                      src={nextMember.image}
                      alt={nextMember.name}
                      fill
                      sizes="72px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                </TransitionLink>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ─── Designed Footer Close ─── */}
      <footer className="w-full bg-[#f4f5f7] px-4 sm:px-[3vw] py-10 sm:py-16">
        <div className="max-w-[1340px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6 sm:gap-8">
          <div>
            <TransitionLink
              href="/"
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[clamp(42px,9vw,112px)] lowercase text-[#0c0c0c] leading-[1.12] inline-block hover:opacity-70 transition-opacity"
            >
              kobrat
            </TransitionLink>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[13px] sm:text-[14px] text-[#0c0c0c]">
            <TransitionLink href="/" className="underline hover:opacity-65">
              Back to home
            </TransitionLink>
            <TransitionLink
              href="/members"
              className="underline hover:opacity-65"
            >
              All members
            </TransitionLink>
            <TransitionLink
              href="/gallery"
              className="underline hover:opacity-65"
            >
              Collective gallery
            </TransitionLink>
          </div>
        </div>
      </footer>

      {/* ─── Fullscreen Lightbox for Member's Collective Frames ─── */}
      <AnimatePresence>
        {activeLightboxMoment && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[999] bg-[#0c0c0c]/95 flex flex-col justify-between p-4 md:p-8 select-none text-white"
          >
            <div className="flex items-center justify-between w-full z-10 text-[13px]">
              <div className="flex items-baseline gap-4">
                <span
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[26px] lowercase text-white leading-none"
                >
                  {activeLightboxMoment.title}
                </span>
                <span className="text-white/50">
                  {lightboxIndex + 1} of {featuredMoments.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {featuredMoments.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex(
                          (lightboxIndex - 1 + featuredMoments.length) %
                            featuredMoments.length
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
                          (lightboxIndex + 1) % featuredMoments.length
                        )
                      }
                      className="px-3.5 py-2 bg-white/10 hover:bg-white hover:text-[#0c0c0c] transition-colors text-[12px] cursor-pointer active:scale-[0.97]"
                    >
                      Next
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="ml-2 px-4 py-2 bg-white text-[#0c0c0c] hover:bg-white/85 transition-colors text-[12px] font-medium cursor-pointer active:scale-[0.97]"
                >
                  Close (Esc)
                </button>
              </div>
            </div>

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
                {activeLightboxMoment.members.map((mSlug) => (
                  <TransitionLink
                    key={mSlug}
                    href={`/${mSlug}`}
                    className="px-3 py-1 bg-white/10 hover:bg-white hover:text-[#0c0c0c] transition-colors text-white text-[12px] capitalize"
                  >
                    {mSlug}
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
