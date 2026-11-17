"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useSpring } from "motion/react";
import Header from "@/components/Header";
import TransitionLink from "@/components/TransitionLink";
import {
  Member,
  members as staticMembers,
  getMemberSlug,
} from "@/data/members";
import { Moment, moments as staticMoments } from "@/data/moments";

interface BusinessCardProps {
  member: Member;
  memberMoments: Moment[];
  index: number;
  isLarge?: boolean;
}

function TactileBusinessCard({
  member,
  memberMoments,
  index,
  isLarge = false,
}: BusinessCardProps) {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Smooth spring-driven 3D mouse tilt
  const tiltX = useSpring(0, { stiffness: 220, damping: 22, mass: 0.4 });
  const tiltY = useSpring(0, { stiffness: 220, damping: 22, mass: 0.4 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    tiltX.set(-ny * 9);
    tiltY.set(nx * 11);
  };

  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const slug = getMemberSlug(member);
  const igHandle = member.instagram?.replace(/^@/, "");

  // Alternate subtle tactile paper stocks across cards
  const paperStocks = ["bg-[#eceef2]", "bg-[#ebe9e2]", "bg-[#e3e6ed]"];
  const stockClass = paperStocks[index % paperStocks.length];

  return (
    <motion.div
      initial={isLarge ? false : { opacity: 0, y: 22 }}
      whileInView={isLarge ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: isLarge ? 0 : (index % 2) * 0.06,
        ease: [0.23, 1, 0.32, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group perspective-1200 w-full select-none transition-opacity duration-300 group-hover/cards:opacity-50 hover:!opacity-100"
    >
      <motion.div
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
        }}
        className="w-full transform-style-3d will-change-transform"
      >
        <div
          onClick={() => setIsFlipped((prev) => !prev)}
          data-cursor={isFlipped ? "FLIP BACK" : "FLIP CARD"}
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
          className={`relative w-full ${
            isLarge
              ? "min-h-[340px] sm:min-h-[380px]"
              : "min-h-[290px] sm:min-h-[320px]"
          } transform-style-3d cursor-pointer`}
        >
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FRONT OF BUSINESS CARD                                          */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div
            className={`absolute inset-0 w-full h-full ${stockClass} p-5 sm:p-7 flex flex-row items-stretch justify-between gap-5 backface-hidden`}
          >
            {/* Left Column: Typography, Identity & Actions */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              {/* Card Top Stamp */}
              <div className="flex items-baseline justify-between gap-2">
                <span
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[20px] lowercase text-[#0c0c0c] leading-none"
                >
                  kobrat
                </span>
                <span className="text-[12px] text-[#767676]">
                  collective card
                </span>
              </div>

              {/* Center Member Name & Persona */}
              <div className="my-auto py-3">
                <h2
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className={`${
                    isLarge
                      ? "text-[clamp(40px,4.8vw,64px)]"
                      : "text-[clamp(34px,3.8vw,52px)]"
                  } lowercase text-[#0c0c0c] leading-[1.06] truncate`}
                >
                  {member.name}
                </h2>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#0c0c0c] text-white text-[11px] uppercase">
                    {member.nickname}
                  </span>
                  {member.instagram && (
                    <a
                      href={`https://instagram.com/${igHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[13px] text-[#52525b] hover:text-[#0c0c0c] underline underline-offset-4"
                    >
                      {member.instagram}
                    </a>
                  )}
                </div>

                {member.bio && (
                  <p className="mt-3 text-[14px] text-[#3f3f46] line-clamp-2 leading-[1.45]">
                    “{member.bio}”
                  </p>
                )}
              </div>

              {/* Card Bottom Bar */}
              <div className="flex items-center justify-between gap-4 pt-2 text-[13px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(true);
                  }}
                  className="text-[#52525b] hover:text-[#0c0c0c] underline underline-offset-4 cursor-pointer"
                >
                  Flip card
                </button>

                <TransitionLink
                  href={`/${slug}`}
                  onClick={(e) => e.stopPropagation()}
                  data-cursor="OPEN PROFILE"
                  className="px-3.5 py-1.5 bg-[#0c0c0c] text-white text-[12px] hover:bg-[#27272a] transition-colors"
                >
                  Open profile
                </TransitionLink>
              </div>
            </div>

            {/* Right Column: Exact 3:4 Studio Portrait Cutout */}
            <div className="relative w-[135px] sm:w-[185px] aspect-[3/4] self-center shrink-0 bg-[#111] overflow-hidden">
              <Image
                src={member.image}
                alt={member.name}
                fill
                sizes="190px"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* BACK OF BUSINESS CARD (180° 3D FLIP)                            */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div
            style={{ transform: "rotateY(180deg)" }}
            className="absolute inset-0 w-full h-full bg-[#0c0c0c] text-white p-5 sm:p-7 flex flex-col justify-between backface-hidden"
          >
            {/* Top Bar */}
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span
                  style={{ fontFamily: "var(--font-wordmark)" }}
                  className="text-[28px] lowercase text-white leading-[1.06]"
                >
                  {member.name}
                </span>
                <span className="text-[12px] text-white/50 uppercase">
                  {member.nickname}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="text-[12px] text-white/70 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                Flip to front
              </button>
            </div>

            {/* Middle: Bio & Archive Moments Appeared In */}
            <div className="my-auto py-3 space-y-4">
              <p className="text-[14px] sm:text-[15px] text-white/85 leading-[1.5] max-w-[46ch]">
                {member.bio ||
                  "Creative mind shaping digital presence and interactive experiences within the Kobrat collective."}
              </p>

              {memberMoments.length > 0 && (
                <div>
                  <p className="text-[11px] text-white/50 mb-2">
                    Featured in {memberMoments.length} archive frames:
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {memberMoments.slice(0, 4).map((m) => (
                      <TransitionLink
                        key={m.id}
                        href="/gallery"
                        onClick={(e) => e.stopPropagation()}
                        title={m.title}
                        className="relative w-[68px] aspect-[16/10] bg-white/10 shrink-0 overflow-hidden group/thumb"
                      >
                        <Image
                          src={m.image}
                          alt={m.title}
                          fill
                          sizes="72px"
                          className="object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                        />
                      </TransitionLink>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Links */}
            <div className="flex items-center justify-between gap-4 pt-2 text-[12px]">
              <TransitionLink
                href={`/admin?edit=${member.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-white/60 hover:text-white underline underline-offset-4"
              >
                Edit card in admin
              </TransitionLink>

              <TransitionLink
                href={`/${slug}`}
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-1.5 bg-white text-[#0c0c0c] font-medium hover:bg-[#e4e6eb] transition-colors"
              >
                Full dossier
              </TransitionLink>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MembersPage() {
  const [membersList, setMembersList] = useState<Member[]>(staticMembers);
  const [momentsList, setMomentsList] = useState<Moment[]>(staticMoments);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "rolodex">("cards");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoadError(null);
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
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Map each member to the archive moments they appear in
  const momentsByMemberId = useMemo(() => {
    const map: Record<number, Moment[]> = {};
    for (const member of membersList) {
      const slug = getMemberSlug(member).toLowerCase();
      const nameLower = member.name.toLowerCase();
      map[member.id] = momentsList.filter((m) =>
        m.members.some(
          (tag) =>
            tag.toLowerCase() === slug || tag.toLowerCase() === nameLower
        )
      );
    }
    return map;
  }, [membersList, momentsList]);

  const activeRolodexMember = membersList[selectedIndex] || membersList[0];

  return (
    <div className="relative min-h-dvh bg-white text-[#0c0c0c] flex flex-col selection:bg-[#0c0c0c] selection:text-white cursor-default">
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
                collective roster
              </h1>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <p className="text-[16px] md:text-[17px] text-[#0c0c0c] leading-[1.55] max-w-[46ch]">
                Eight minds on one wavelength. Move your cursor across any card
                to tilt it in 3D space, click to flip the card over, or open
                their full dossier.
              </p>
            </div>
          </div>

          {/* ─── View Mode Toolbar ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 mb-12 bg-[#f4f5f7] px-5">
            <div className="text-[13px] text-[#52525b]">
              Showing <span className="text-[#0c0c0c] font-medium">{membersList.length}</span> active collective cards · Click any card to flip 180°
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-4 py-2 text-[13px] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                  viewMode === "cards"
                    ? "bg-[#0c0c0c] text-white font-medium"
                    : "bg-white text-[#0c0c0c] hover:bg-[#e4e6eb]"
                }`}
              >
                Business cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("rolodex")}
                className={`px-4 py-2 text-[13px] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer active:scale-[0.97] ${
                  viewMode === "rolodex"
                    ? "bg-[#0c0c0c] text-white font-medium"
                    : "bg-white text-[#0c0c0c] hover:bg-[#e4e6eb]"
                }`}
              >
                Spotlight deck
              </button>
            </div>
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
              <p className="text-[16px] text-[#767676]">
                Loading collective member cards...
              </p>
            </div>
          ) : membersList.length === 0 ? (
            <div className="py-28 px-6 bg-[#f4f5f7] text-center space-y-4">
              <h2
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[36px] lowercase text-[#0c0c0c]"
              >
                no members found
              </h2>
              <p className="text-[15px] text-[#52525b]">
                Add or update collective members from the admin dashboard.
              </p>
            </div>
          ) : viewMode === "cards" ? (
            /* ═══════════════════════════════════════════════════════════════════ */
            /* MODE 1: 3D FLIPPABLE BUSINESS CARDS GRID (2 COLUMNS)                */
            /* ═══════════════════════════════════════════════════════════════════ */
            <div className="group/cards grid grid-cols-1 lg:grid-cols-2 gap-8">
              {membersList.map((member, idx) => (
                <TactileBusinessCard
                  key={member.id}
                  member={member}
                  memberMoments={momentsByMemberId[member.id] || []}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════════ */
            /* MODE 2: INTERACTIVE SPOTLIGHT ROLODEX DECK                          */
            /* ═══════════════════════════════════════════════════════════════════ */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Kinetic Selector List */}
              <div className="lg:col-span-5 flex flex-col">
                {membersList.map((member, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-full text-left py-4 px-5 flex items-baseline justify-between gap-4 transition-[background-color,color] duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-[#0c0c0c] text-white"
                          : "even:bg-[#f4f5f7] text-[#0c0c0c] hover:bg-[#e4e6eb]"
                      }`}
                    >
                      <span
                        style={{ fontFamily: "var(--font-wordmark)" }}
                        className="text-[clamp(28px,3.5vw,44px)] lowercase leading-[1.06]"
                      >
                        {member.name}
                      </span>
                      <span
                        className={`text-[12px] uppercase ${
                          isSelected ? "text-white/70" : "text-[#767676]"
                        }`}
                      >
                        {member.nickname}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Oversized 3D Interactive Card Stage */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  {activeRolodexMember && (
                    <motion.div
                      key={activeRolodexMember.id}
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <TactileBusinessCard
                        member={activeRolodexMember}
                        memberMoments={
                          momentsByMemberId[activeRolodexMember.id] || []
                        }
                        index={selectedIndex}
                        isLarge={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Designed Footer Close ─── */}
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
              href="/gallery"
              className="underline hover:opacity-65"
            >
              Collective gallery
            </TransitionLink>
            <TransitionLink
              href="/admin"
              className="underline hover:opacity-65"
            >
              Manage roster in admin
            </TransitionLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
