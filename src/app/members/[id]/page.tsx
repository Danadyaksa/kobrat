import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getMembers, Member } from "@/data/members";
import CustomCursor from "@/components/CustomCursor";
import ThreePixelEye from "@/components/ThreePixelEye";

interface PageProps {
  params: Promise<{ id: string }>;
}

function RollingText({ text }: { text: string }) {
  return (
    <span className="chars-inner" aria-hidden="true">
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{ "--i": index } as React.CSSProperties}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

async function MemberContent({ params }: PageProps) {
  const { id } = await params;
  const members = await getMembers();
  const memberIndex = members.findIndex((m) => m.id === Number(id));

  if (memberIndex === -1) {
    notFound();
  }

  const member: Member = members[memberIndex];
  const prevMember = members[(memberIndex - 1 + members.length) % members.length];
  const nextMember = members[(memberIndex + 1) % members.length];

  const formattedIndex = String(member.id).padStart(2, "0");
  const totalCount = String(members.length).padStart(2, "0");

  const igHandle = member.instagram?.replace(/^@/, "");

  return (
    <div className="relative min-h-screen bg-white text-[#0c0c0c] flex flex-col selection:bg-[#0c0c0c] selection:text-white cursor-default">
      {/* Sleek Custom Cursor */}
      <CustomCursor />

      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-[70] bg-white/85 backdrop-blur-md border-b border-[#f0f0f0]">
        <div className="h-[52px] px-[3vw] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Back to Home */}
          <Link
            href="/"
            className="nav-item justify-self-start !px-0 text-[#0c0c0c] hover:opacity-70 transition-opacity"
          >
            <span className="font-mono text-[11px] tracking-[0.04em]">←</span>
            <span
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[19px] lowercase leading-none inline-block ml-1"
            >
              kobrat
            </span>
          </Link>

          {/* Member Counter */}
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#767676] select-none flex items-center gap-2">
            <span>[ {formattedIndex} / {totalCount} ]</span>
          </div>

          {/* Admin & Index Links */}
          <nav className="justify-self-end flex items-center gap-3">
            <Link href="/admin" className="nav-item">
              <span className="sr-only">Admin</span>
              <RollingText text="ADMIN" />
            </Link>
            <Link href="/" className="nav-item">
              <span className="sr-only">Home</span>
              <RollingText text="INDEX" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Profile Layout */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 md:px-12 pt-[90px] pb-[100px] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Left Column: Member Narrative & Metadata */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full pt-2">
            <div>
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-full bg-[#f4f4f5] text-[#0c0c0c] text-[10px] font-mono uppercase tracking-[0.06em] mb-6">
                <ThreePixelEye size={14} />
                <span>MEMBER // {formattedIndex}</span>
              </div>

              {/* Gossip Wordmark Name */}
              <h1
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[clamp(44px,7vw,84px)] leading-[0.95] tracking-tight text-[#0c0c0c] lowercase mb-4"
              >
                {member.name}
              </h1>

              {/* Nickname & Sub-role */}
              <div className="flex items-center gap-3 mb-8">
                <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-[#0c0c0c] font-medium bg-[#0c0c0c] text-white px-2 py-0.5 rounded-[4px]">
                  {member.nickname}
                </span>
                <span className="text-[#a1a1aa] font-mono text-[12px]">/</span>
                <span className="font-mono text-[12px] uppercase tracking-[0.04em] text-[#767676]">
                  {member.role}
                </span>
              </div>

              {/* Bio / Persona Quote */}
              <p className="text-[17px] md:text-[20px] leading-[1.45] text-[#333333] font-light max-w-[560px] mb-12">
                {member.bio || `Creative mind shaping digital presence and high-fidelity interaction design within the Kobrat collective.`}
              </p>
            </div>

            {/* Spec Sheet / Metadata Table */}
            <div className="border-t border-[#e5e7eb] pt-6 flex flex-col divide-y divide-[#f4f4f5] font-mono text-[11px] tracking-[0.04em]">
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#767676] uppercase">ROLE</span>
                <span className="text-[#0c0c0c] uppercase font-medium">{member.role}</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#767676] uppercase">IDENTITY</span>
                <span className="text-[#0c0c0c] uppercase font-medium">{member.nickname}</span>
              </div>
              {member.instagram && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-[#767676] uppercase">INSTAGRAM</span>
                  <a
                    href={`https://instagram.com/${igHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0c0c0c] hover:underline underline-offset-4 font-medium flex items-center gap-1 group"
                  >
                    <span>{member.instagram}</span>
                    <span className="text-[10px] text-[#767676] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
                  </a>
                </div>
              )}
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#767676] uppercase">STATUS</span>
                <span className="inline-flex items-center gap-1.5 text-[#0c0c0c] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Admin Quick Edit Button */}
            <div className="mt-8 pt-4">
              <Link
                href={`/admin?edit=${member.id}`}
                className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.06em] text-[#767676] hover:text-[#0c0c0c] transition-colors group"
              >
                <span>EDIT THIS PROFILE IN ADMIN</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Hero High-Res Portrait Card */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-[8px] overflow-hidden bg-[#f4f4f5] shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#ececed] transition-transform duration-500 hover:scale-[1.01]">
              <Image
                src={member.image}
                alt={member.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white font-mono text-[10px] tracking-[0.06em] uppercase">
                <span>0{member.id} // {member.name}</span>
                <span className="opacity-75">KOBRAT ARCHIVE</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Pinned Pagination Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-[60] bg-white/90 backdrop-blur-md border-t border-[#f0f0f0] px-[3vw] h-[52px] flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.04em]">
        {/* Prev Member */}
        <Link
          href={`/members/${prevMember.id}`}
          className="nav-item !px-0 text-[#767676] hover:text-[#0c0c0c] flex items-center gap-2"
        >
          <span>←</span>
          <RollingText text={`PREV : ${prevMember.name}`} />
        </Link>

        {/* Center Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#a1a1aa]">
          <span>MEMBER PROFILE</span>
        </div>

        {/* Next Member */}
        <Link
          href={`/members/${nextMember.id}`}
          className="nav-item !px-0 text-[#767676] hover:text-[#0c0c0c] flex items-center gap-2"
        >
          <RollingText text={`NEXT : ${nextMember.name}`} />
          <span>→</span>
        </Link>
      </footer>
    </div>
  );
}

export default function MemberDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center font-mono text-[11px] text-[#767676] uppercase">
          LOADING PROFILE...
        </div>
      }
    >
      <MemberContent params={params} />
    </Suspense>
  );
}
