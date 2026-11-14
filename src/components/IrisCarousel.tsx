"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { members } from "@/data/members";
import MemberCard from "./MemberCard";

interface IrisCarouselProps {
  showSingleCard?: boolean;
  isBursting?: boolean;
}

const IrisCarousel = memo(function IrisCarousel({
  showSingleCard = false,
  isBursting = false,
}: IrisCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);

  const stateRef = useRef({
    currentRot: 0,
    targetRot: 0,
    mouseTarget: 0,
    isHovered: false,
    rx: 580,
    ry: 185,
    rz: 230,
    burstProgress: 0,
    singleCardScale: 0,
    featuredIndex: 0,
  });

  // Pick random member photo for the initial preloader card on every refresh
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * members.length);
    setFeaturedIndex(randomIndex);
    stateRef.current.featuredIndex = randomIndex;
  }, []);

  const handleHover = useCallback((id: number | null) => {
    setHoveredId(id);
    stateRef.current.isHovered = id !== null;
  }, []);

  // Compute responsive ellipse radii so cards frame the text and NEVER clip top/bottom
  useEffect(() => {
    function updateDimensions() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Card height: ~170px desktop, ~150px mobile
      const cardHeight = w < 768 ? 150 : 170;
      const verticalClearance = 40;
      const maxAvailableRy = (h - 52 - 50 - cardHeight - verticalClearance) / 2;

      if (w >= 1200) {
        stateRef.current.rx = Math.min(600, w * 0.41);
        stateRef.current.ry = Math.max(145, Math.min(195, maxAvailableRy));
        stateRef.current.rz = 230;
      } else if (w >= 768) {
        stateRef.current.rx = Math.min(430, w * 0.42);
        stateRef.current.ry = Math.max(125, Math.min(175, maxAvailableRy));
        stateRef.current.rz = 190;
      } else {
        stateRef.current.rx = Math.min(195, w * 0.44);
        stateRef.current.ry = Math.max(110, Math.min(150, maxAvailableRy));
        stateRef.current.rz = 135;
      }
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Animate featured card scale when single card phase begins
  useEffect(() => {
    if (!showSingleCard) {
      stateRef.current.singleCardScale = 0;
      return;
    }

    const tween = gsap.to(stateRef.current, {
      singleCardScale: 1,
      duration: 0.65,
      ease: "expo.out",
    });

    return () => {
      tween.kill();
    };
  }, [showSingleCard]);

  // Animate the fan-out / burst expansion from the featured card to the full 3D ring!
  useEffect(() => {
    if (!isBursting) {
      stateRef.current.burstProgress = 0;
      return;
    }

    const tween = gsap.to(stateRef.current, {
      burstProgress: 1,
      duration: 1.6,
      ease: "expo.out",
    });

    return () => {
      tween.kill();
    };
  }, [isBursting]);

  // Subtle mouse parallax tracking with soft damping
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const norm = (e.clientX - cx) / cx;
      stateRef.current.mouseTarget = norm * 0.28;
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Continuous RAF render loop - matches Elliot's exact ~90s smooth speed
  useEffect(() => {
    let animId: number;
    const numCards = members.length;
    const step = (Math.PI * 2) / numCards;

    function renderLoop() {
      const s = stateRef.current;
      const burst = s.burstProgress;
      const singleScale = s.singleCardScale;
      const featIdx = s.featuredIndex;

      if (burst > 0) {
        // Soft, luxurious rotation speed
        const baseSpeed = s.isHovered ? 0.00012 : 0.00065;
        s.targetRot += baseSpeed;
        s.currentRot += (s.targetRot + s.mouseTarget - s.currentRot) * 0.035;
      }

      const rot = s.currentRot;
      const rx = s.rx * burst;
      const ry = s.ry * burst;
      const rz = s.rz * burst;

      for (let i = 0; i < numCards; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        if (burst === 0) {
          // Preloader state: only the randomly chosen featured card scales up in center
          if (i === featIdx) {
            el.style.transform = `translate3d(-50%, -50%, 0) scale(${singleScale.toFixed(3)})`;
            el.style.opacity = singleScale > 0.01 ? "1" : "0";
            el.style.zIndex = "55"; // Visible on top of preloader black veil (z-40)
          } else {
            el.style.transform = `translate3d(-50%, -50%, 0) scale(0)`;
            el.style.opacity = "0";
            el.style.zIndex = "1";
          }
          continue;
        }

        // Active Burst / Carousel state:
        const phi = i * step + rot;
        const targetX = rx * Math.sin(phi);
        const targetY = ry * Math.cos(phi);
        const targetZ = rz * Math.cos(phi);

        // Depth calculation
        const norm = (targetZ + rz) / (2 * (rz || 1));
        const depthScale = 0.74 + 0.26 * norm;
        const depthOpacity = 0.45 + 0.55 * norm;
        const zIndex = Math.round(norm * 100);

        if (i === featIdx) {
          // Featured card smoothly interpolates from center (0, 0) into its orbit position
          const curX = targetX;
          const curY = targetY;
          const curZ = targetZ;
          const scale = depthScale;
          const rotY = -(curX / (s.rx || 1)) * 12;

          el.style.transform = `translate3d(calc(-50% + ${curX.toFixed(2)}px), calc(-50% + ${curY.toFixed(2)}px), ${curZ.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
          el.style.opacity = depthOpacity.toFixed(3);
          el.style.zIndex = zIndex.toString();
        } else {
          // The other 7 cards stagger outward from behind the featured card
          const diff = (i - featIdx + numCards) % numCards;
          const cardBurst = Math.min(1, Math.max(0, burst * 1.35 - diff * 0.04));
          const curX = targetX;
          const curY = targetY;
          const curZ = targetZ;
          const scale = depthScale * cardBurst;
          const opacity = depthOpacity * cardBurst;
          const rotY = -(curX / (s.rx || 1)) * 12;

          el.style.transform = `translate3d(calc(-50% + ${curX.toFixed(2)}px), calc(-50% + ${curY.toFixed(2)}px), ${curZ.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
          el.style.opacity = opacity.toFixed(3);
          el.style.zIndex = zIndex.toString();
        }
      }

      animId = requestAnimationFrame(renderLoop);
    }

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none perspective-1200 overflow-visible -translate-y-5 md:-translate-y-7"
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
            data-cursor="VIEW PROFILE"
            className="absolute left-1/2 top-1/2 w-[120px] h-[160px] md:w-[130px] md:h-[172px] pointer-events-auto will-change-transform select-none cursor-pointer"
            style={{
              transform: "translate3d(-50%, -50%, 0) scale(0)",
              opacity: 0,
              zIndex: i === featuredIndex ? 55 : 1,
            }}
          >
            <MemberCard
              member={member}
              isHovered={hoveredId === member.id}
              onHover={handleHover}
              priority={i === featuredIndex}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default IrisCarousel;
