"use client";

import { memo } from "react";
import Image from "next/image";
import { Member } from "@/data/members";

interface MemberCardProps {
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
      role="button"
      tabIndex={0}
      aria-label={`${member.name} - ${member.role}`}
      className="relative w-full h-full cursor-pointer focus:outline-none"
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
    >
      {/* Inner card with exact Elliot scale & elevation */}
      <div
        className={`relative w-full h-full rounded-[6px] overflow-hidden bg-[#e8e8e8] shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isHovered ? "-translate-y-[8%] scale-[1.06]" : ""
        }`}
      >
        <Image
          src={member.image}
          alt={member.name}
          fill
          sizes="160px"
          priority={priority}
          draggable={false}
          className="object-cover select-none pointer-events-none"
        />

        {/* Hover Pill Badge: exact Elliot Eriksson style */}
        <div
          className={`absolute inset-0 flex items-center justify-center p-2 transition-opacity duration-300 pointer-events-none ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-[#0c0c0c]/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-full flex flex-col items-center shadow-xl">
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] font-medium leading-tight">
              {member.name}
            </span>
            <span className="text-[8px] text-[#ffffffa6] uppercase tracking-wider font-mono leading-tight">
              {member.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default MemberCard;
