"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { members } from "@/data/members";
import MemberCard from "./MemberCard";

interface IrisCarouselProps {
  isBursting?: boolean;
}

const IrisCarousel = memo(function IrisCarousel({ isBursting = true }: IrisCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const stateRef = useRef({
    currentRot: 0,
    targetRot: 0,
    mouseTarget: 0,
    isHovered: false,
    rx: 520,
    ry: 155,
    rz: 260,
    burstProgress: 0,
  });

  const handleHover = useCallback((id: number | null) => {
    setHoveredId(id);
    stateRef.current.isHovered = id !== null;
  }, []);

  // Update responsive radii so cards NEVER clip top or bottom
  useEffect(() => {
    function updateDimensions() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (w >= 1200) {
        stateRef.current.rx = Math.min(540, w * 0.42);
        stateRef.current.ry = Math.min(160, (h - 260) * 0.45);
        stateRef.current.rz = 280;
      } else if (w >= 768) {
        stateRef.current.rx = Math.min(380, w * 0.44);
        stateRef.current.ry = Math.min(140, (h - 260) * 0.42);
        stateRef.current.rz = 220;
      } else {
        stateRef.current.rx = Math.min(190, w * 0.46);
        stateRef.current.ry = Math.min(130, (h - 240) * 0.4);
        stateRef.current.rz = 150;
      }
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Animate the fan-out / burst expansion from 1 card to the 3D ring!
  useEffect(() => {
    if (!isBursting) {
      stateRef.current.burstProgress = 0;
      return;
    }

    const tween = gsap.to(stateRef.current, {
      burstProgress: 1,
      duration: 1.4,
      ease: "expo.out",
    });

    return () => {
      tween.kill();
    };
  }, [isBursting]);

  // Mouse parallax tracking
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const norm = (e.clientX - cx) / cx;
      stateRef.current.mouseTarget = norm * 0.4;
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Continuous RAF render loop
  useEffect(() => {
    let animId: number;
    const numCards = members.length;
    const step = (Math.PI * 2) / numCards;

    function renderLoop() {
      const s = stateRef.current;
      const burst = s.burstProgress;

      const baseSpeed = s.isHovered ? 0.0002 : 0.0018;
      s.targetRot += baseSpeed;
      s.currentRot += (s.targetRot + s.mouseTarget - s.currentRot) * 0.06;

      const rot = s.currentRot;
      const rx = s.rx * burst;
      const ry = s.ry * burst;
      const rz = s.rz * burst;

      for (let i = 0; i < numCards; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        // Individual card stagger during burst
        const cardBurst = Math.min(1, Math.max(0, burst * 1.3 - i * 0.035));

        const phi = i * step + rot;
        const x = rx * Math.sin(phi);
        const y = ry * Math.cos(phi);
        const z = rz * Math.cos(phi);

        // Depth calculation
        const norm = (z + rz) / (2 * (rz || 1));
        const targetScale = 0.72 + 0.28 * norm;
        const scale = i === 0 ? targetScale : targetScale * cardBurst;
        const opacity = (0.42 + 0.58 * norm) * (i === 0 ? 1 : cardBurst);
        const zIndex = Math.round(norm * 100);

        // Subtle concave curve
        const rotY = -(x / (rx || 1)) * 14;

        el.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = zIndex.toString();
      }

      animId = requestAnimationFrame(renderLoop);
    }

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none perspective-1200 overflow-visible"
    >
      <div
        ref={trackRef}
        className="relative w-full h-full flex items-center justify-center transform-style-3d will-change-transform"
      >
        {members.map((member, i) => (
          <div
            key={member.id}
            ref={(node) => {
              cardRefs.current[i] = node;
            }}
            className="absolute left-1/2 top-1/2 w-[135px] h-[175px] md:w-[145px] md:h-[190px] pointer-events-auto will-change-transform select-none"
            style={{
              transform: "translate3d(-50%, -50%, 0) scale(0)",
              opacity: 0,
              zIndex: 1,
            }}
          >
            <MemberCard
              member={member}
              isHovered={hoveredId === member.id}
              onHover={handleHover}
              priority={i < 3}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default IrisCarousel;
