"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Header from "@/components/Header";
import TransitionLink from "@/components/TransitionLink";
import { getLenis } from "@/components/SmoothScroll";
import {
  Member,
  members as staticMembers,
  getMemberSlug,
  formatInstagramLink,
  formatGithubLink,
  formatWebsiteLink,
} from "@/data/members";

// Deterministic crisp SVG barcode unique to each member's name & ID
function MemberBarcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    const list: { w: number; gap: number }[] = [];
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    for (let i = 0; i < 22; i++) {
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
      width="88"
      height="18"
      viewBox="0 0 88 18"
      fill="currentColor"
      aria-hidden="true"
      className="text-[#0c0c0c]/80 shrink-0"
    >
      {bars.map((b, idx) => {
        const curX = x;
        x += b.w + b.gap;
        if (curX + b.w > 88) return null;
        return <rect key={idx} x={curX} y={0} width={b.w} height={18} />;
      })}
    </svg>
  );
}

// Crisp pixel seal matching Kobrat's voxel identity
function PixelSeal({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 7 7"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 0h3v3H2zM1 4h5v1H1zM0 5h7v2H0z" />
    </svg>
  );
}

interface InteractiveIdCardProps {
  member: Member;
  index: number;
}

function InteractiveIdCard({ member, index }: InteractiveIdCardProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const pointerState = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });

  // Physical elastic lanyard displacement (underdamped spring so releasing bounces like a real lanyard)
  const rawDragX = useMotionValue(0);
  const rawDragY = useMotionValue(0);
  const dragX = useSpring(rawDragX, { stiffness: 270, damping: 15, mass: 0.78 });
  const dragY = useSpring(rawDragY, { stiffness: 270, damping: 15, mass: 0.78 });

  // 3D Gyro Pitch (X), Yaw (Y), and Pendulum Swing (Z)
  const targetTiltX = useMotionValue(0);
  const targetTiltY = useMotionValue(0);
  const targetSwingZ = useMotionValue(0);

  const tiltX = useSpring(targetTiltX, { stiffness: 230, damping: 19, mass: 0.55 });
  const tiltY = useSpring(targetTiltY, { stiffness: 230, damping: 19, mass: 0.55 });
  const swingZ = useSpring(targetSwingZ, { stiffness: 190, damping: 13, mass: 0.85 });

  // Dynamic acrylic studio light sheen position
  const sheenX = useSpring(50, { stiffness: 200, damping: 24 });
  const sheenOpacity = useSpring(0, { stiffness: 200, damping: 24 });
  const sheenTransform = useTransform(
    sheenX,
    (val) => `translate3d(${(val - 50) * 2.4}%, 0, 0) skewX(-22deg)`
  );

  // Scroll-velocity reactive 3D sway
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    let rafId: number;
    let lastScrollY = window.scrollY;
    const colDirection = index % 2 === 0 ? 1 : -1;

    const tick = () => {
      if (!pointerState.current.active) {
        const lenis = getLenis();
        const dy = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
        const vel = lenis ? lenis.velocity : dy * 0.8;

        if (Math.abs(vel) > 0.15) {
          const clampedPitch = Math.max(-11, Math.min(11, vel * 0.22));
          const clampedSway = Math.max(
            -4.5,
            Math.min(4.5, vel * 0.07 * colDirection)
          );
          targetTiltX.set(clampedPitch);
          targetSwingZ.set(clampedSway);
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [index, targetSwingZ, targetTiltX]);

  // Dynamic SVG path for the elastic woven lanyard strap from ceiling rail (140, 4) to card clip (140 + dx, 68 + dy)
  const lanyardPath = useTransform([dragX, dragY], ([x, y]) => {
    const dx = Number(x) || 0;
    const dy = Number(y) || 0;
    const startX = 140;
    const startY = 4;
    const endX = 140 + dx;
    const endY = Math.max(20, 68 + dy);
    const ctrlX = startX + dx * 0.32;
    const ctrlY = startY + (endY - startY) * 0.58 + Math.abs(dx) * 0.08;
    return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
  });

  const claspTransform = useTransform(
    [dragX, dragY, swingZ],
    ([x, y, r]) =>
      `translate3d(${Number(x) || 0}px, ${Number(y) || 0}px, 0) rotate(${
        (Number(r) || 0) * 0.45
      }deg)`
  );

  // Pointer Down: initiate elastic lanyard drag (unless clicking an interactive link)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    pointerState.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
    };
    setIsDragging(true);
    sheenOpacity.set(0.55);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ps = pointerState.current;

    if (ps.active) {
      const rawDx = e.clientX - ps.startX;
      const rawDy = e.clientY - ps.startY;
      const stepDx = e.clientX - ps.lastX;
      ps.lastX = e.clientX;
      ps.lastY = e.clientY;

      // Rubber-band boundary damping so pulling further feels taut like a real strap
      const dampedX =
        Math.sign(rawDx) *
        Math.min(135, Math.pow(Math.abs(rawDx), 0.84) * 1.55);
      const dampedY =
        rawDy >= 0
          ? Math.min(125, Math.pow(rawDy, 0.84) * 1.5)
          : -Math.min(42, Math.pow(Math.abs(rawDy), 0.78) * 1.1);

      rawDragX.set(dampedX);
      rawDragY.set(dampedY);

      // Pendulum swing torque + 3D perspective pitch/yaw while pulling
      const swing = Math.max(
        -18,
        Math.min(18, -dampedX * 0.09 + stepDx * 0.32)
      );
      targetSwingZ.set(swing);
      targetTiltY.set(Math.max(-22, Math.min(22, dampedX * 0.16)));
      targetTiltX.set(Math.max(-18, Math.min(18, -dampedY * 0.14)));
      sheenX.set(50 + dampedX * 0.35);
      return;
    }

    // Hover 3D gyroscopic tilt when not dragging
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    targetTiltX.set(-ny * 16);
    targetTiltY.set(nx * 20);
    targetSwingZ.set(nx * 2.6);
    sheenX.set((nx + 0.5) * 100);
    sheenOpacity.set(0.45);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ps = pointerState.current;
    if (!ps.active) return;

    if (e.currentTarget.hasPointerCapture(ps.pointerId)) {
      e.currentTarget.releasePointerCapture(ps.pointerId);
    }

    ps.active = false;
    setIsDragging(false);

    // Snap back on the elastic lanyard spring
    rawDragX.set(0);
    rawDragY.set(0);
    targetSwingZ.set(0);
    targetTiltX.set(0);
    targetTiltY.set(0);
    sheenOpacity.set(0);
  };

  const handlePointerLeave = () => {
    if (pointerState.current.active) return;
    targetTiltX.set(0);
    targetTiltY.set(0);
    targetSwingZ.set(0);
    sheenOpacity.set(0);
  };

  const slug = getMemberSlug(member);
  const nicknameDisplay = member.nickname?.trim() || member.name.trim();
  const fullNameDisplay = member.name.trim();
  const igInfo = formatInstagramLink(member.instagram);
  const ghInfo = formatGithubLink(member.github);
  const webInfo = formatWebsiteLink(member.website);
  const credentialCode = `KBRT · ${nicknameDisplay.toUpperCase()}`;

  // Subtle alternating archival PVC / cotton stock tones
  const cardStocks = ["bg-[#eff0f4]", "bg-[#eeece6]", "bg-[#e7ebf2]"];
  const stockBg = cardStocks[index % cardStocks.length];

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.55,
        delay: (index % 2) * 0.08,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="relative flex flex-col items-center w-full select-none"
    >
      {/* ─── Elastic Woven Lanyard Strap & Studio Rail Anchor ─── */}
      <div
        aria-hidden="true"
        className="relative w-[140px] sm:w-[220px] md:w-[280px] h-[46px] sm:h-[58px] md:h-[68px] pointer-events-none z-[30] overflow-visible"
      >
        {/* Top Architectural Ceiling Bracket */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 sm:w-11 h-1.5 sm:h-2 bg-[#0c0c0c] rounded-full" />

        {/* Dynamic Elastic SVG Lanyard Ribbon */}
        <svg
          width="280"
          height="68"
          viewBox="0 0 280 68"
          className="overflow-visible w-full h-full"
        >
          {/* Outer Matte Black Woven Strap */}
          <motion.path
            d={lanyardPath}
            fill="none"
            stroke="#141416"
            strokeWidth="15"
            strokeLinecap="round"
          />
          {/* Inner Center Stitch Detail */}
          <motion.path
            d={lanyardPath}
            fill="none"
            stroke="#3f3f46"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Metal Badge Clip Locked Into the Card's Die-Cut Slot */}
        <motion.div
          style={{ transform: claspTransform }}
          className="absolute bottom-[-6px] sm:bottom-[-8px] left-1/2 -ml-[12px] sm:-ml-[15px] w-[24px] sm:w-[30px] h-[16px] sm:h-[20px] bg-[#18181b] rounded-[4px] flex flex-col items-center justify-between py-0.5 sm:py-1 z-[35]"
        >
          <span className="w-2.5 sm:w-3.5 h-0.5 sm:h-1 bg-[#71717a] rounded-full" />
          <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#a1a1aa]" />
        </motion.div>
      </div>

      {/* ─── 3D Draggable & Gyro-Tilting Physical ID Card ─── */}
      <div className="w-full max-w-[560px] perspective-1200">
        <motion.div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          style={{
            x: dragX,
            y: dragY,
            rotateX: tiltX,
            rotateY: tiltY,
            rotateZ: swingZ,
            transformOrigin: "50% 0%",
          }}
          className={`relative w-full min-h-[260px] sm:min-h-[300px] md:min-h-[324px] transform-style-3d will-change-transform touch-pan-y cursor-grab active:cursor-grabbing ${
            isDragging ? "z-[60]" : "z-[20]"
          }`}
        >
          {/* Physical PVC Card Core Thickness Edge Layer */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[14px] sm:rounded-[16px] bg-[#d4d6dc] pointer-events-none"
          />

          {/* ─── Studio ID Card Surface ─── */}
          <div
            style={{ transform: "translateZ(3px)" }}
            className={`relative w-full min-h-[260px] sm:min-h-[300px] md:min-h-[324px] rounded-[14px] sm:rounded-[16px] ${stockBg} pt-4 sm:pt-6 flex flex-col justify-between overflow-hidden`}
          >
            {/* Die-Cut Lanyard Punch Hole at Top Center */}
            <div
              aria-hidden="true"
              className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 w-10 sm:w-14 h-2 sm:h-3 rounded-full bg-white"
            />

            {/* Dynamic Studio Acrylic Light Sheen Overlay */}
            <motion.div
              aria-hidden="true"
              style={{
                opacity: sheenOpacity,
                transform: sheenTransform,
              }}
              className="pointer-events-none absolute -inset-y-12 left-1/3 w-28 bg-white/55 z-[25] will-change-transform"
            />

            {/* Card Top Header Row */}
            <div
              style={{ transform: "translateZ(16px)" }}
              className="px-3 sm:px-5 md:px-7 flex items-center justify-between gap-1 sm:gap-3 pt-1 sm:pt-2"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-[#0c0c0c]">
                <Image
                  src="/logo.png"
                  alt="kobrat"
                  width={28}
                  height={28}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0"
                />
                <span
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[17px] sm:text-[20px] md:text-[22px] lowercase leading-[1.25] pt-0.5 inline-block"
                >
                  kobrat
                </span>
              </div>

              <span className="text-[9.5px] sm:text-[11px] md:text-[12px] text-[#52525b] tabular-nums font-medium truncate">
                {credentialCode}
              </span>
            </div>

            {/* Card Center Body: Reflows Vertically on Mobile 2-Col, Horizontally on Desktop */}
            <div
              style={{ transform: "translateZ(24px)" }}
              className="px-3 sm:px-5 md:px-7 my-auto py-2 sm:py-3.5 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-5 md:gap-6 text-center sm:text-left"
            >
              {/* Authentic 3:4 ID Portrait Window */}
              <div className="relative w-[76px] sm:w-[112px] md:w-[138px] aspect-[3/4] shrink-0 rounded-[8px] sm:rounded-[10px] bg-[#111] p-1 overflow-hidden mx-auto sm:mx-0">
                <div className="relative w-full h-full rounded-[6px] sm:rounded-[7px] overflow-hidden">
                  <Image
                    src={member.image}
                    alt={fullNameDisplay}
                    fill
                    sizes="150px"
                    draggable={false}
                    className="object-cover object-center pointer-events-none select-none"
                  />
                </div>
              </div>

              {/* Identity Details */}
              <div className="flex-1 min-w-0 w-full flex flex-col justify-center">
                {/* 1. Nama Panggilan (Big Gothic) */}
                <h2
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[clamp(20px,3.8vw,52px)] lowercase text-[#0c0c0c] leading-[1.2] pt-0.5 sm:pt-1.5 pb-0.5 overflow-visible truncate max-w-full"
                >
                  {nicknameDisplay}
                </h2>

                {/* 2. Nama Panjang (Small Crisp Text Underneath) */}
                <p className="mt-0.5 sm:mt-1.5 text-[11px] sm:text-[14px] md:text-[15px] font-medium text-[#18181b] leading-[1.3] truncate max-w-full">
                  {fullNameDisplay}
                </p>

                {/* 3. Social & Portfolio Links */}
                {(igInfo || ghInfo || webInfo) && (
                  <div className="mt-1 sm:mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-2 sm:gap-x-3.5 gap-y-1">
                    {igInfo && (
                      <a
                        href={igInfo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10.5px] sm:text-[12.5px] text-[#3f3f46] hover:text-[#0c0c0c] underline underline-offset-4 truncate max-w-[140px]"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          aria-hidden="true"
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0"
                        >
                          <rect x="2" y="2" width="12" height="12" rx="3.5" />
                          <circle cx="8" cy="8" r="2.75" />
                          <circle cx="11.6" cy="4.4" r="0.7" fill="currentColor" stroke="none" />
                        </svg>
                        <span className="truncate">{igInfo.label}</span>
                      </a>
                    )}

                    {ghInfo && (
                      <a
                        href={ghInfo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10.5px] sm:text-[12.5px] text-[#3f3f46] hover:text-[#0c0c0c] underline underline-offset-4 truncate max-w-[140px]"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          aria-hidden="true"
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0"
                        >
                          <path d="M8 1.2a6.8 6.8 0 0 0-2.15 13.25c.34.06.46-.15.46-.33v-1.15c-1.89.41-2.29-.91-2.29-.91-.31-.78-.75-.99-.75-.99-.62-.42.05-.41.05-.41.68.05 1.04.7 1.04.7.61 1.04 1.59.74 1.98.57.06-.44.24-.74.43-.91-1.51-.17-3.1-.76-3.1-3.37 0-.74.27-1.35.7-1.83-.07-.17-.3-.86.07-1.8 0 0 .57-.18 1.87.7a6.5 6.5 0 0 1 3.4 0c1.3-.88 1.87-.7 1.87-.7.37.94.14 1.63.07 1.8.44.48.7 1.09.7 1.83 0 2.62-1.59 3.2-3.11 3.37.24.21.46.62.46 1.26v1.87c0 .18.12.39.47.33A6.8 6.8 0 0 0 8 1.2Z" />
                        </svg>
                        <span className="truncate">{ghInfo.username}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Optional Bio Quote (shown on tablet/desktop) */}
                {member.bio && (
                  <p className="hidden sm:block mt-2.5 text-[13px] text-[#52525b] line-clamp-2 leading-[1.45]">
                    “{member.bio}”
                  </p>
                )}
              </div>
            </div>

            {/* Card Bottom Barcode & Profile Button */}
            <div
              style={{ transform: "translateZ(18px)" }}
              className="w-full bg-black/[0.045] px-2.5 sm:px-5 md:px-7 py-2 sm:py-3.5 flex items-center justify-between gap-2"
            >
              <div className="hidden sm:block">
                <MemberBarcode seed={`${member.id}-${fullNameDisplay}-${slug}`} />
              </div>

              <TransitionLink
                href={`/${slug}`}
                data-cursor="VIEW PROFILE"
                className="w-full sm:w-auto text-center px-3 py-1 sm:px-4 sm:py-1.5 rounded-[5px] sm:rounded-[6px] bg-[#0c0c0c] text-white text-[11px] sm:text-[12px] font-medium hover:bg-[#27272a] active:scale-[0.97] transition-[background-color,transform] duration-150"
              >
                Profile
              </TransitionLink>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.article>
  );
}

export default function MembersPage() {
  const [membersList, setMembersList] = useState<Member[]>(staticMembers);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchMembers() {
      try {
        setLoadError(null);
        const memRes = await fetch("/api/members", { cache: "no-store" });
        if (memRes.ok) {
          const memData = await memRes.json();
          if (isMounted && Array.isArray(memData) && memData.length > 0) {
            setMembersList(memData);
          }
        }
      } catch (err) {
        console.error("Error loading members:", err);
        if (isMounted && membersList.length === 0) {
          setLoadError("Could not reach server. Showing cached member cards.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative min-h-dvh bg-white text-[#0c0c0c] flex flex-col selection:bg-[#0c0c0c] selection:text-white cursor-default">
      {/* Top Navigation */}
      <Header introComplete={true} />

      <main className="flex-1 w-full pt-[116px] sm:pt-[148px] pb-20 sm:pb-28 px-3 sm:px-[3vw]">
        <div className="max-w-[1320px] mx-auto">
          {/* ─── Clean Editorial Masthead ─── */}
          <div className="pb-8 sm:pb-12 pt-2 sm:pt-4">
            <h1
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[clamp(38px,5.8vw,86px)] lowercase text-[#0c0c0c] leading-[1.14] tracking-[-0.02em]"
            >
              members
            </h1>
          </div>

          {/* ─── Error / Loading / Empty States ─── */}
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

          {isLoading && membersList.length === 0 ? (
            <div className="py-32 text-center">
              <p className="text-[16px] text-[#767676]">Loading members...</p>
            </div>
          ) : membersList.length === 0 ? (
            <div className="py-28 px-6 bg-[#f4f5f7] text-center space-y-4">
              <h2
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[36px] lowercase text-[#0c0c0c]"
              >
                no members yet
              </h2>
            </div>
          ) : (
            /* ─── 2-Column Hanging 3D ID Cards Studio Rack (2 Cols on All Screen Sizes) ─── */
            <div className="grid grid-cols-2 gap-x-2.5 sm:gap-x-6 md:gap-x-10 lg:gap-x-16 gap-y-6 sm:gap-y-10 md:gap-y-12">
              {membersList.map((member, idx) => (
                <InteractiveIdCard
                  key={member.id}
                  member={member}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ─── Designed Footer Close ─── */}
      <footer className="w-full bg-[#f4f5f7] px-4 sm:px-[3vw] py-10 sm:py-16">
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6 sm:gap-8">
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
              href="/gallery"
              className="underline hover:opacity-65"
            >
              Collective gallery
            </TransitionLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
