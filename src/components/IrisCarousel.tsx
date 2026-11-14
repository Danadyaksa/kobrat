"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { members } from "@/data/members";
import MemberCard from "./MemberCard";

const IrisCarousel = memo(function IrisCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const stateRef = useRef({
    currentRot: 0,
    targetRot: 0,
    mouseTarget: 0,
    mouseX: 0,
    isHovered: false,
    rx: 480,
    rz: 280,
    ry: 32,
  });

  const handleHover = useCallback((id: number | null) => {
    setHoveredId(id);
    stateRef.current.isHovered = id !== null;
  }, []);

  useEffect(() => {
    function updateDimensions() {
      const w = window.innerWidth;
      if (w >= 1200) {
        stateRef.current.rx = 520;
        stateRef.current.rz = 290;
        stateRef.current.ry = 32;
      } else if (w >= 768) {
        stateRef.current.rx = 380;
        stateRef.current.rz = 220;
        stateRef.current.ry = 24;
      } else {
        stateRef.current.rx = 200;
        stateRef.current.rz = 130;
        stateRef.current.ry = 16;
      }
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const norm = (e.clientX - cx) / cx; // -1 to 1
      stateRef.current.mouseTarget = norm * 0.45;
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let animId: number;
    const numCards = members.length;
    const step = (Math.PI * 2) / numCards;

    function renderLoop() {
      const s = stateRef.current;

      // When hovering, pause/slow rotation; otherwise ambient spin + mouse parallax
      const baseSpeed = s.isHovered ? 0.0003 : 0.0022;
      s.targetRot += baseSpeed;
      s.currentRot += (s.targetRot + s.mouseTarget - s.currentRot) * 0.06;

      const rot = s.currentRot;
      const rx = s.rx;
      const rz = s.rz;
      const ry = s.ry;

      for (let i = 0; i < numCards; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        const phi = i * step + rot;
        const x = rx * Math.sin(phi);
        const z = rz * Math.cos(phi);
        const y = ry * Math.sin(phi) * 0.3;

        // Depth calculation
        const norm = (z + rz) / (2 * rz); // 0 (back) to 1 (front)
        const scale = 0.72 + 0.28 * norm;
        const opacity = 0.4 + 0.6 * norm;
        const zIndex = Math.round(norm * 100);

        // Subtle billboarding angle
        const rotY = -(x / rx) * 22;

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
            className="absolute left-1/2 top-1/2 w-[160px] h-[205px] pointer-events-auto will-change-transform select-none"
            style={{
              transform: "translate3d(-50%, -50%, 0) scale(0.72)",
              opacity: 0.5,
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
