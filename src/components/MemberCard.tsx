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
      className="relative w-full h-full cursor-pointer focus:outline-none"
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(member.id)}
      onBlur={() => onHover(null)}
    >
      {/* Inner card with exact Elliot scale & elevation */}
      <div
        className={`relative w-full h-full rounded-[6px] overflow-hidden bg-[#e8e8e8] shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isHovered ? "-translate-y-[8%] scale-[1.06] shadow-[0_12px_32px_rgba(0,0,0,0.12)]" : ""
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
      </div>
    </div>
  );
});

export default MemberCard;
