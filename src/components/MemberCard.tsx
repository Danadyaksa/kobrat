"use client";

import { memo } from "react";
import Image from "next/image";
import { Member } from "@/data/members";

export interface MemberCardProps {
  member: Member;
  isHovered: boolean;
  onHover: (id: number | null) => void;
  priority?: boolean;
}

const MemberCard = memo(function MemberCard({
  member,
  isHovered,
  onHover,
  priority = false,
}: MemberCardProps) {
  return (
    <div
      className="relative w-[150px] h-[200px] md:w-[170px] md:h-[230px] lg:w-[190px] lg:h-[255px] cursor-pointer pointer-events-auto select-none group"
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(member.id)}
      onBlur={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onHover(isHovered ? null : member.id);
        }
      }}
      onClick={(e) => {
        e.preventDefault();
        console.log(`[KOBRAT] Selected member #${member.id}: ${member.name} (${member.nickname})`);
      }}
      role="button"
      tabIndex={0}
      aria-label={`${member.nickname}: ${member.name}, ${member.role}`}
    >
      {/* Smoothly scaling inner container */}
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden border bg-zinc-950 transition-all duration-500 ease-out"
        style={{
          transform: isHovered ? "scale(1.08) translateY(-10px)" : "scale(1) translateY(0px)",
          borderColor: isHovered ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)",
          boxShadow: isHovered
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255, 255, 255, 0.08)"
            : "0 10px 25px -10px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Next Image with fill and sizes */}
        <Image
          src={member.image}
          alt={`${member.name} (${member.nickname})`}
          fill
          sizes="(max-width: 768px) 160px, 200px"
          className="object-cover pointer-events-none select-none transition-transform duration-700 ease-out group-hover:scale-105"
          priority={priority}
          draggable={false}
        />

        {/* Subtle Dark Gradient Overlay at Bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Subtle Member Number Badge at Top Right */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 font-mono text-[9px] text-zinc-400 tracking-wider pointer-events-none">
          {String(member.id).padStart(2, "0")}
        </div>

        {/* Badge Tooltip with Member Information */}
        <div
          className={`absolute inset-x-2.5 bottom-2.5 p-2.5 md:p-3 rounded-xl bg-black/75 backdrop-blur-md border flex flex-col transition-all duration-300 ease-out ${
            isHovered
              ? "border-white/30 bg-black/90 shadow-lg translate-y-0"
              : "border-white/10 translate-y-0"
          }`}
        >
          {/* Member nickname in uppercase bold tracking-wider */}
          <span className="font-mono text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-white">
            {member.nickname}
          </span>

          {/* Real name & role in subtle gray text */}
          <span className="text-[10px] md:text-[11px] text-zinc-400 leading-tight mt-0.5 line-clamp-1">
            {member.name} • {member.role}
          </span>

          {/* Instagram tag if present */}
          {member.instagram && (
            <div
              className={`font-mono text-[9px] md:text-[10px] text-zinc-400 flex items-center gap-1 transition-all duration-300 overflow-hidden ${
                isHovered ? "max-h-5 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"
              }`}
            >
              <span className="text-zinc-500 font-mono">IG:</span>
              <span className="text-zinc-300">{member.instagram}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default MemberCard;
