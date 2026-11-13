"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { members } from "@/data/members";
import MemberCard from "./MemberCard";

interface Radii {
  rx: number;
  rz: number;
  ry: number;
}

interface IrisCarouselProps {
  className?: string;
}

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

const IrisCarousel = memo(function IrisCarousel({ className = "" }: IrisCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const hoveredIdRef = useRef<number | null>(null);

  // Radii ref for responsive orbital ellipse
  const radiiRef = useRef<Radii>({ rx: 480, rz: 300, ry: 40 });

  // Mouse tracking targets and lerped values
  const targetMouseXRef = useRef<number>(0);
  const targetMouseYRef = useRef<number>(0);
  const currentMouseXRef = useRef<number>(0);
  const currentMouseYRef = useRef<number>(0);

  // Rotation and speed tracking
  const baseRotationRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(0.002);

  const handleHover = useCallback((id: number | null) => {
    setHoveredId(id);
    hoveredIdRef.current = id;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      currentSpeedRef.current = 0;
    }

    // Responsive radii calculation
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        radiiRef.current = { rx: 480, rz: 300, ry: 40 };
      } else if (width >= 768) {
        radiiRef.current = { rx: 360, rz: 220, ry: 30 };
      } else {
        radiiRef.current = { rx: 200, rz: 130, ry: 20 };
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Mouse tracking on container
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2)));
      targetMouseXRef.current = nx;
      targetMouseYRef.current = ny;
    };

    const handleMouseLeave = () => {
      targetMouseXRef.current = 0;
      targetMouseYRef.current = 0;
    };

    // Touch tracking for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const touch = e.touches[0];
      const nx = Math.max(-1, Math.min(1, (touch.clientX - centerX) / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, (touch.clientY - centerY) / (rect.height / 2)));
      targetMouseXRef.current = nx;
      targetMouseYRef.current = ny;
    };

    const handleTouchEnd = () => {
      targetMouseXRef.current = 0;
      targetMouseYRef.current = 0;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    let animationFrameId: number;

    const animate = () => {
      // Lerp mouse coordinates with factor 0.05
      currentMouseXRef.current = lerp(currentMouseXRef.current, targetMouseXRef.current, 0.05);
      currentMouseYRef.current = lerp(currentMouseYRef.current, targetMouseYRef.current, 0.05);

      // Lerp rotation speed (damped to 0 on hover or reduced motion)
      const targetSpeed =
        hoveredIdRef.current !== null || prefersReducedMotion ? 0 : 0.002;
      currentSpeedRef.current = lerp(currentSpeedRef.current, targetSpeed, 0.05);
      baseRotationRef.current += currentSpeedRef.current;

      // Mouse parallax shift
      const mouseParallaxOffset = currentMouseXRef.current * 0.4;
      const currentRotation = baseRotationRef.current + mouseParallaxOffset;

      // Subtle track 3D tilt
      if (trackRef.current) {
        const tiltX = -currentMouseYRef.current * 5;
        const tiltY = currentMouseXRef.current * 5;
        trackRef.current.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
      }

      const { rx, rz, ry } = radiiRef.current;
      const total = members.length;

      for (let i = 0; i < total; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        // Angle in orbit for card i
        const theta = (i * 2 * Math.PI) / total;
        const phi = theta + currentRotation;

        // 3D Elliptical coordinates
        const x = rx * Math.sin(phi);
        const z = rz * Math.cos(phi);
        const y = ry * Math.sin(phi) * 0.3;

        // Subtle billboarding facing toward viewer
        const rotY = -(x / rx) * 30;

        // Depth mapping: d ranges from 0 (back) to 1 (front)
        const d = (z + rz) / (2 * rz);
        const scale = 0.72 + 0.28 * d;
        const opacity = 0.45 + 0.55 * d;
        const zIndex = Math.round(d * 100);

        const isHovered = hoveredIdRef.current === members[i].id;

        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = isHovered ? "1" : `${opacity.toFixed(3)}`;
        el.style.zIndex = isHovered ? "200" : `${zIndex}`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Run first frame immediately to position cards synchronously on mount
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[520px] md:h-[620px] lg:h-[700px] flex items-center justify-center perspective-1200 overflow-visible select-none ${className}`}
    >
      {/* Center atmospheric glow backdrop */}
      <div
        className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full bg-white/[0.02] blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* 3D Track Container */}
      <div
        ref={trackRef}
        className="relative w-0 h-0 flex items-center justify-center transform-style-3d will-change-transform"
      >
        {members.map((member, index) => (
          <div
            key={member.id}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className="absolute top-1/2 left-1/2 transform-style-3d will-change-transform"
          >
            <div className="-translate-x-1/2 -translate-y-1/2">
              <MemberCard
                member={member}
                isHovered={hoveredId === member.id}
                onHover={handleHover}
                priority={index < 4}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default IrisCarousel;
