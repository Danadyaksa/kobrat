"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Header from "@/components/Header";
import TransitionLink from "@/components/TransitionLink";
import {
  Member,
  getMemberSlug,
  findMemberBySlug,
  formatInstagramLink,
  formatGithubLink,
  formatWebsiteLink,
} from "@/data/members";
import { Moment } from "@/data/moments";

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

  // Sync fresh data from /api/members and /api/moments so admin edits appear immediately
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
        // Keep server-provided initial data on network error
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

  // 3D Gyro Tilt for the Hero Portrait Plate
  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);
  const tiltX = useSpring(rawTiltX, { stiffness: 210, damping: 20, mass: 0.55 });
  const tiltY = useSpring(rawTiltY, { stiffness: 210, damping: 20, mass: 0.55 });

  const sheenPos = useSpring(50, { stiffness: 190, damping: 24 });
  const sheenAlpha = useSpring(0, { stiffness: 190, damping: 24 });
  const sheenTransform = useTransform(
    sheenPos,
    (v) => `translate3d(${(v - 50) * 2.5}%, 0, 0) skewX(-20deg)`
  );

  const handlePortraitMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawTiltX.set(-ny * 15);
    rawTiltY.set(nx * 18);
    sheenPos.set((nx + 0.5) * 100);
    sheenAlpha.set(0.5);
  };

  const handlePortraitLeave = () => {
    rawTiltX.set(0);
    rawTiltY.set(0);
    sheenAlpha.set(0);
  };

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

  const nicknameDisplay = member.nickname?.trim() || member.name.trim();
  const fullNameDisplay = member.name.trim();
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

      <main className="relative flex-1 w-full pt-[132px] pb-24 px-[3vw] overflow-x-clip">
        {/* Subtle Architectural Background Watermark */}
        <div
          aria-hidden="true"
          style={{ fontFamily: "var(--font-wordmark)" }}
          className="pointer-events-none absolute top-[110px] right-[-2vw] text-[clamp(160px,26vw,380px)] lowercase text-[#f5f6f8] leading-none select-none z-0"
        >
          {nicknameDisplay}
        </div>

        <div className="relative z-10 max-w-[1340px] mx-auto">
          {/* ─── Top Breadcrumb Back to Members ─── */}
          <div className="mb-8">
            <TransitionLink
              href="/members"
              className="inline-flex items-center gap-2 text-[14px] text-[#52525b] hover:text-[#0c0c0c] transition-colors"
            >
              <span>←</span>
              <span className="underline underline-offset-4">All members</span>
            </TransitionLink>
          </div>

          {/* ─── HERO STAGE: 12-Column Editorial Split + 3D Portrait Monolith ─── */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center pb-24">
            {/* Left Column: Monumental Typography, Bio & External Channels */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
              className="lg:col-span-7 flex flex-col justify-between"
            >
              <div>
                {/* 1. Monumental Gothic Nickname (Nama Panggilan) */}
                <h1
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[clamp(60px,9.2vw,132px)] lowercase text-[#0c0c0c] leading-[1.12] tracking-[-0.02em]"
                >
                  {nicknameDisplay}
                </h1>

                {/* 2. Full Name (Nama Panjang) */}
                <p className="mt-7 text-[21px] md:text-[25px] font-medium text-[#0c0c0c] leading-[1.3]">
                  {fullNameDisplay}
                </p>

                {/* 3. Personal Bio / Statement */}
                {member.bio && (
                  <blockquote className="mt-7 text-[18px] md:text-[21px] text-[#3f3f46] leading-[1.55] max-w-[46ch]">
                    “{member.bio}”
                  </blockquote>
                )}
              </div>

              {/* 4. External Channels (Portfolio Website · GitHub · Instagram) */}
              {(webInfo || ghInfo || igInfo) && (
                <div className="mt-10 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 max-w-[680px]">
                    {webInfo && (
                      <a
                        href={webInfo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 rounded-[10px] bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between text-[#52525b] group-hover:text-white/70">
                          <span className="inline-flex items-center gap-1.5 text-[12px]">
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
                            <span>Portfolio</span>
                          </span>
                          <span className="text-[13px] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            ↗
                          </span>
                        </div>
                        <span className="text-[15px] font-medium truncate">
                          {webInfo.label}
                        </span>
                      </a>
                    )}

                    {ghInfo && (
                      <a
                        href={ghInfo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 rounded-[10px] bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between text-[#52525b] group-hover:text-white/70">
                          <span className="inline-flex items-center gap-1.5 text-[12px]">
                            <svg
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              aria-hidden="true"
                              className="w-3.5 h-3.5 shrink-0"
                            >
                              <path d="M8 1.2a6.8 6.8 0 0 0-2.15 13.25c.34.06.46-.15.46-.33v-1.15c-1.89.41-2.29-.91-2.29-.91-.31-.78-.75-.99-.75-.99-.62-.42.05-.41.05-.41.68.05 1.04.7 1.04.7.61 1.04 1.59.74 1.98.57.06-.44.24-.74.43-.91-1.51-.17-3.1-.76-3.1-3.37 0-.74.27-1.35.7-1.83-.07-.17-.3-.86.07-1.8 0 0 .57-.18 1.87.7a6.5 6.5 0 0 1 3.4 0c1.3-.88 1.87-.7 1.87-.7.37.94.14 1.63.07 1.8.44.48.7 1.09.7 1.83 0 2.62-1.59 3.2-3.11 3.37.24.21.46.62.46 1.26v1.87c0 .18.12.39.47.33A6.8 6.8 0 0 0 8 1.2Z" />
                            </svg>
                            <span>GitHub</span>
                          </span>
                          <span className="text-[13px] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            ↗
                          </span>
                        </div>
                        <span className="text-[15px] font-medium truncate">
                          @{ghInfo.username}
                        </span>
                      </a>
                    )}

                    {igInfo && (
                      <a
                        href={igInfo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 rounded-[10px] bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between text-[#52525b] group-hover:text-white/70">
                          <span className="inline-flex items-center gap-1.5 text-[12px]">
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
                            <span>Instagram</span>
                          </span>
                          <span className="text-[13px] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            ↗
                          </span>
                        </div>
                        <span className="text-[15px] font-medium truncate">
                          {igInfo.label}
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right Column: Interactive 3D Tactile Studio Portrait Plate */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.08,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="lg:col-span-5 flex justify-center lg:justify-end perspective-1200"
            >
              <motion.div
                onMouseMove={handlePortraitMove}
                onMouseLeave={handlePortraitLeave}
                style={{
                  rotateX: tiltX,
                  rotateY: tiltY,
                }}
                className="relative w-full max-w-[430px] transform-style-3d will-change-transform select-none"
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

                  {/* 3:4 High-Res Studio Portrait */}
                  <div
                    style={{ transform: "translateZ(24px)" }}
                    className="relative w-full aspect-[3/4] rounded-[12px] bg-[#111] overflow-hidden"
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
            </motion.div>
          </section>

          {/* ─── SECTION 2: Featured Collective Moments with This Member ─── */}
          {featuredMoments.length > 0 && (
            <section className="pt-8 pb-24">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                  <h2
                    style={{ fontFamily: "var(--font-wordmark)" }}
                    className="text-[clamp(36px,5vw,64px)] lowercase text-[#0c0c0c] leading-[1.08]"
                  >
                    frames with {nicknameDisplay}
                  </h2>
                </div>

                <TransitionLink
                  href="/gallery"
                  className="text-[14px] text-[#0c0c0c] underline underline-offset-4 hover:opacity-65 transition-opacity"
                >
                  Open full gallery ({momentsList.length})
                </TransitionLink>
              </div>

              <div className="group/rolls grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {featuredMoments.map((moment, idx) => (
                  <motion.article
                    key={moment.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.45,
                      delay: (idx % 3) * 0.06,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    onClick={() => setLightboxIndex(idx)}
                    data-cursor="VIEW"
                    className="group cursor-pointer transition-opacity duration-300 group-hover/rolls:opacity-45 hover:!opacity-100"
                  >
                    <div className="flex items-center justify-between text-[12px] text-[#767676] mb-2">
                      <span className="capitalize text-[#0c0c0c] font-medium">
                        {moment.category.toLowerCase()}
                      </span>
                      <span>{formatLocation(moment.location, moment.year)}</span>
                    </div>

                    <div className="relative w-full aspect-[16/10] bg-[#111] overflow-hidden mb-3">
                      <Image
                        src={moment.image}
                        alt={moment.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-[center_58%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>

                    <h3
                      style={{ fontFamily: "var(--font-wordmark)" }}
                      className="text-[clamp(22px,2.2vw,32px)] lowercase text-[#0c0c0c] leading-[1.24]"
                    >
                      {moment.title}
                    </h3>
                  </motion.article>
                ))}
              </div>
            </section>
          )}

          {/* ─── SECTION 3: Tactile Previous / Next Member Portal ─── */}
          {membersList.length > 1 && prevMember && nextMember && (
            <section
              aria-label="Browse other collective members"
              className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {/* Previous Member Card */}
              <TransitionLink
                href={`/${getMemberSlug(prevMember)}`}
                data-cursor="PREV MEMBER"
                className="group p-5 sm:p-6 rounded-[14px] bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white transition-[background-color,color] duration-200 flex items-center gap-5"
              >
                <div className="relative w-[64px] aspect-[3/4] rounded-[8px] bg-[#111] overflow-hidden shrink-0">
                  <Image
                    src={prevMember.image}
                    alt={prevMember.name}
                    fill
                    sizes="72px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0">
                  <span className="block text-[12px] text-[#767676] group-hover:text-white/60 mb-1">
                    ← Previous member
                  </span>
                  <span
                    style={{ fontFamily: "var(--font-wordmark)" }}
                    className="block text-[clamp(26px,3vw,38px)] lowercase leading-[1.06] truncate"
                  >
                    {prevMember.nickname || prevMember.name}
                  </span>
                  <span className="block text-[13px] text-[#52525b] group-hover:text-white/75 truncate mt-0.5">
                    {prevMember.name}
                  </span>
                </div>
              </TransitionLink>

              {/* Next Member Card */}
              <TransitionLink
                href={`/${getMemberSlug(nextMember)}`}
                data-cursor="NEXT MEMBER"
                className="group p-5 sm:p-6 rounded-[14px] bg-[#f4f5f7] hover:bg-[#0c0c0c] hover:text-white transition-[background-color,color] duration-200 flex items-center justify-between gap-5 text-right"
              >
                <div className="min-w-0 flex-1">
                  <span className="block text-[12px] text-[#767676] group-hover:text-white/60 mb-1">
                    Next member →
                  </span>
                  <span
                    style={{ fontFamily: "var(--font-wordmark)" }}
                    className="block text-[clamp(26px,3vw,38px)] lowercase leading-[1.06] truncate"
                  >
                    {nextMember.nickname || nextMember.name}
                  </span>
                  <span className="block text-[13px] text-[#52525b] group-hover:text-white/75 truncate mt-0.5">
                    {nextMember.name}
                  </span>
                </div>
                <div className="relative w-[64px] aspect-[3/4] rounded-[8px] bg-[#111] overflow-hidden shrink-0">
                  <Image
                    src={nextMember.image}
                    alt={nextMember.name}
                    fill
                    sizes="72px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
              </TransitionLink>
            </section>
          )}
        </div>
      </main>

      {/* ─── Designed Footer Close ─── */}
      <footer className="w-full bg-[#f4f5f7] px-[3vw] py-16">
        <div className="max-w-[1340px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
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
