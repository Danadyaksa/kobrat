"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import TransitionLink from "./TransitionLink";
import gsap from "gsap";
import { Member, members, getMemberSlug } from "@/data/members";
import MemberCard from "./MemberCard";
import { getLenis } from "./SmoothScroll";

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
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [memberList, setMemberList] = useState<Member[]>(members);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);

  // Sync with live database from /api/members
  useEffect(() => {
    fetch("/api/members")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed");
      })
      .then((data: Member[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setMemberList(data);
        }
      })
      .catch(() => {});
  }, []);

  const stateRef = useRef({
    currentRot: 0,
    targetRot: 0,
    mouseTarget: 0,
    isHovered: false,
    rx: 580,
    ry: 185,
    rz: 230,
    burstProgress: isBursting ? 1 : 0,
    singleCardScale: showSingleCard ? 1 : 0,
    featuredIndex: 0,
    // Reactive Scroll & Dynamic Physics (matches ellioteriksson.com)
    scrollBoost: 0,
    wheelVelocity: 0,
    isDragging: false,
    dragStartX: 0,
    lastDragX: 0,
    lastDragTime: 0,
    dragVelocity: 0,
    dragDistance: 0,
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

    if (stateRef.current.singleCardScale >= 1) return;

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

    if (stateRef.current.burstProgress >= 1) return;

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

  // Wheel impulse listener (immediate reactive kick on mouse wheel or trackpad flick)
  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      // Normalize delta across browsers
      const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120);
      stateRef.current.wheelVelocity += delta * 0.00015;
    }

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Interactive Drag & Momentum Handling
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    s.isDragging = true;
    s.dragStartX = e.clientX;
    s.lastDragX = e.clientX;
    s.lastDragTime = performance.now();
    s.dragVelocity = 0;
    s.dragDistance = 0;
  }, []);

  useEffect(() => {
    function handleGlobalPointerMove(e: PointerEvent) {
      const s = stateRef.current;
      if (!s.isDragging) return;

      const now = performance.now();
      const dt = Math.max(1, now - s.lastDragTime);
      const deltaX = e.clientX - s.lastDragX;
      s.dragDistance += Math.abs(deltaX);

      // Map horizontal pixel drag to angular rotation in radians
      const radDelta = deltaX / (s.rx * 1.8);
      s.currentRot += radDelta;
      s.targetRot += radDelta;

      // Capture instantaneous flick velocity
      s.dragVelocity = (radDelta / dt) * 16.67;

      s.lastDragX = e.clientX;
      s.lastDragTime = now;
    }

    function handleGlobalPointerUp() {
      stateRef.current.isDragging = false;
    }

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, []);

  // Continuous RAF render loop with scroll reactivity & physics (matches ellioteriksson.com)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const numCards = memberList.length || members.length;
    const step = (Math.PI * 2) / numCards;

    function renderLoop(now: number) {
      const dtMs = Math.min(50, Math.max(1, now - lastTime));
      const dtSec = dtMs / 1000;
      lastTime = now;
      const frameDelta = dtSec * 60; // normalized to 60fps

      const s = stateRef.current;
      const burst = s.burstProgress;
      const singleScale = s.singleCardScale;
      const featIdx = s.featuredIndex;

      if (burst > 0) {
        // Query Lenis scroll velocity or calculate fallback from window.scrollY
        const lenis = getLenis();
        const lenisVel = lenis?.velocity ?? 0;

        const curScrollY = window.scrollY;
        const nativeVel = ((curScrollY - lastScrollY) / dtMs) * 16.67;
        lastScrollY = curScrollY;

        // Use whichever velocity source has active motion
        const effectiveVel = Math.abs(lenisVel) > 0.05 ? lenisVel : nativeVel;

        // Calculate dynamic reactive boost from page scrolling
        // Normal scroll (vel ~ 25px): ~0.0042 boost (~7x faster)
        // Fast scroll (vel ~ 60px): ~0.010 boost (~16x faster)
        // Hard flick / heavy scroll: capped at 0.025 (~38x faster)
        const targetBoost = Math.max(
          -0.025,
          Math.min(0.025, (effectiveVel / 30) * 0.0045)
        );

        // Framerate-independent exponential smoothing
        const smoothFactor = 1 - Math.pow(0.02, dtSec);
        s.scrollBoost += (targetBoost - s.scrollBoost) * smoothFactor;
        if (Math.abs(s.scrollBoost) < 1e-6) s.scrollBoost = 0;

        // Decay wheel velocity impulse smoothly
        s.wheelVelocity *= Math.pow(0.06, dtSec);
        if (Math.abs(s.wheelVelocity) < 1e-6) s.wheelVelocity = 0;

        // Decay drag velocity flick momentum
        if (!s.isDragging) {
          s.dragVelocity *= Math.pow(0.08, dtSec);
          if (Math.abs(s.dragVelocity) < 1e-6) s.dragVelocity = 0;
        }

        // Base idle speed (gently slows when hovered to allow easy reading / clicking)
        const targetBaseSpeed = s.isHovered ? 0.0001 : 0.00065;

        // Combined dynamic angular velocity
        const dynamicSpeed = s.isDragging
          ? 0
          : (targetBaseSpeed + s.scrollBoost + s.wheelVelocity + s.dragVelocity) *
            frameDelta;

        s.targetRot += dynamicSpeed;
        s.currentRot +=
          (s.targetRot + s.mouseTarget - s.currentRot) * (0.08 * frameDelta);
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
  }, [memberList.length]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none perspective-1200 overflow-visible -translate-y-5 md:-translate-y-7 select-none touch-pan-y"
    >
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative w-full h-full flex items-center justify-center transform-style-3d will-change-transform pointer-events-none"
      >
        {memberList.map((member, i) => (
          <TransitionLink
            key={member.id}
            href={`/${getMemberSlug(member)}`}
            aria-label={member.name}
            ref={(node) => {
              cardRefs.current[i] = node as unknown as HTMLAnchorElement;
            }}
            data-cursor="VIEW PROFILE"
            onPointerDown={handlePointerDown}
            onClick={(e) => {
              // If user was dragging horizontally (> 6px), cancel link navigation
              if (stateRef.current.dragDistance > 6) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="absolute left-1/2 top-1/2 w-[120px] h-[160px] md:w-[130px] md:h-[172px] pointer-events-auto will-change-transform select-none cursor-pointer block focus:outline-none"
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
          </TransitionLink>
        ))}
      </div>
    </div>
  );
});

export default IrisCarousel;
