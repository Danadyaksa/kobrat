"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ThreePixelEye from "./ThreePixelEye";
import { usePageTransition } from "./PageTransition";
import { useExperience } from "./ExperienceProvider";

interface CustomCursorProps {
  isDark?: boolean;
}

interface VoxelParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  light: boolean;
}

export default function CustomCursor({ isDark = false }: CustomCursorProps) {
  const { isTransitioning, introSeen } = usePageTransition();
  const { darkroomMode } = useExperience();
  const [isHomePreloader, setIsHomePreloader] = useState(false);
  const dotWrapRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentCardRef = useRef<Element | null>(null);
  const darkroomRef = useRef<boolean>(darkroomMode);

  const [pillText, setPillText] = useState<string>("VIEW PROFILE");
  const [cursorKind, setCursorKind] = useState<"default" | "link" | "pill">("default");
  const [isPressed, setIsPressed] = useState<boolean>(false);

  useEffect(() => {
    darkroomRef.current = darkroomMode;
  }, [darkroomMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHomePreloader(window.location.pathname === "/" && !introSeen);
    }
  }, [introSeen]);

  // During transition, darkroom mode, or home preloader, screen is dark: use crisp light dot
  const effectiveDark = isDark || darkroomMode || isTransitioning || isHomePreloader;

  useEffect(() => {
    if (isTransitioning) {
      currentCardRef.current = null;
      setCursorKind("default");
      if (pillRef.current) {
        gsap.to(pillRef.current, { scale: 0.4, autoAlpha: 0, duration: 0.15 });
      }
    }
  }, [isTransitioning]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dotWrap = dotWrapRef.current;
    const pill = pillRef.current;
    const canvas = trailCanvasRef.current;
    if (!dotWrap || !pill) return;

    const ctx = canvas ? canvas.getContext("2d") : null;
    const particles: VoxelParticle[] = [];
    let rafId = 0;

    const syncCanvasSize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    syncCanvasSize();
    window.addEventListener("resize", syncCanvasSize);

    // Render loop for the subtle snapped Voxel / Pixel Ghost Trail
    const renderTrail = () => {
      if (ctx && canvas) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= 1;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.92;
          p.vy *= 0.92;

          const ratio = p.life / p.maxLife;
          // Snap coordinates & stepped size to 4px pixel grid to echo Gossip_HighPixel
          const snappedX = Math.round(p.x / 4) * 4;
          const snappedY = Math.round(p.y / 4) * 4;
          const stepSize = ratio > 0.6 ? p.size : ratio > 0.3 ? 4 : 2;
          const alpha = (ratio * 0.24).toFixed(3);

          ctx.fillStyle = p.light
            ? `rgba(255, 255, 255, ${alpha})`
            : `rgba(12, 12, 12, ${alpha})`;
          ctx.fillRect(snappedX, snappedY, stepSize, stepSize);
        }
      }
      rafId = requestAnimationFrame(renderTrail);
    };
    if (!prefersReduced && canvas) {
      rafId = requestAnimationFrame(renderTrail);
    }

    gsap.set(dotWrap, {
      xPercent: -50,
      yPercent: -50,
      autoAlpha: 0,
    });

    gsap.set(pill, {
      xPercent: -50,
      yPercent: -50,
      scale: 0.4,
      autoAlpha: 0,
    });

    const dotXTo = gsap.quickTo(dotWrap, "x", { duration: 0.42, ease: "power3" });
    const dotYTo = gsap.quickTo(dotWrap, "y", { duration: 0.42, ease: "power3" });
    const pillXTo = gsap.quickTo(pill, "x", { duration: 0.42, ease: "power3" });
    const pillYTo = gsap.quickTo(pill, "y", { duration: 0.42, ease: "power3" });

    let hasPositioned = false;
    let prevX = 0;
    let prevY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;

      if (!hasPositioned) {
        gsap.set([dotWrap, pill], { x: e.clientX, y: e.clientY });
        gsap.to(dotWrap, { autoAlpha: 1, duration: 0.25 });
        hasPositioned = true;
        prevX = e.clientX;
        prevY = e.clientY;
      }

      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      const speed = Math.hypot(dx, dy);
      prevX = e.clientX;
      prevY = e.clientY;

      dotXTo(e.clientX);
      dotYTo(e.clientY);
      pillXTo(e.clientX);
      pillYTo(e.clientY);

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const isInput = target?.closest(
        'input, textarea, select, [contenteditable="true"]'
      );
      if (isInput) {
        if (currentCardRef.current) {
          currentCardRef.current = null;
          gsap.to(pill, { scale: 0.4, autoAlpha: 0, duration: 0.15 });
        }
        gsap.to(dotWrap, { autoAlpha: 0, duration: 0.15 });
        return;
      } else {
        gsap.to(dotWrap, { autoAlpha: 1, duration: 0.15 });
      }

      // Emit subtle pixel ghost echo on brisk cursor movement (outside /admin)
      if (
        !prefersReduced &&
        speed > 5.5 &&
        particles.length < 44 &&
        !window.location.pathname.startsWith("/admin")
      ) {
        const overDarkSection = Boolean(
          target?.closest(".bg-\\[\\#0c0c0c\\], .bg-\\[\\#09090b\\]")
        );
        const useLightPixels = darkroomRef.current
          ? !overDarkSection
          : overDarkSection;
        const jitterX = (Math.random() - 0.5) * 10;
        const jitterY = (Math.random() - 0.5) * 10;

        particles.push({
          x: e.clientX + jitterX,
          y: e.clientY + jitterY,
          vx: -dx * 0.06 + (Math.random() - 0.5) * 0.6,
          vy: -dy * 0.06 + (Math.random() - 0.5) * 0.6,
          life: 22,
          maxLife: 22,
          size: speed > 22 ? 6 : 4,
          light: useLightPixels,
        });
      }

      const card = target?.closest("[data-cursor]");
      const interactive = target?.closest(
        'a, button, [role="button"], label, .nav-item'
      );

      if (card) {
        const text = card.getAttribute("data-cursor") || "VIEW PROFILE";
        if (card !== currentCardRef.current) {
          currentCardRef.current = card;
          setPillText(text);
          setCursorKind("pill");
          gsap.to(pill, {
            scale: 1,
            autoAlpha: 1,
            duration: 0.4,
            ease: "back.out(2)",
            overwrite: "auto",
          });
        }
      } else {
        if (currentCardRef.current) {
          currentCardRef.current = null;
          gsap.to(pill, {
            scale: 0.4,
            autoAlpha: 0,
            duration: 0.25,
            ease: "power2.in",
            overwrite: "auto",
          });
        }

        if (interactive) {
          setCursorKind("link");
        } else {
          setCursorKind("default");
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setIsPressed(true);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setIsPressed(false);
    };

    const handlePointerLeave = () => {
      gsap.to([dotWrap, pill], { autoAlpha: 0, duration: 0.2 });
      hasPositioned = false;
      currentCardRef.current = null;
      setCursorKind("default");
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", syncCanvasSize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );
    };
  }, []);

  return (
    <>
      {/* Subtle 60fps Snapped Pixel Ghost Trail Canvas */}
      <canvas
        ref={trailCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[99997]"
      />

      {/* Default Soft Dot / Circular Translucent Lens on Link Hover */}
      <div
        ref={dotWrapRef}
        className="fixed top-0 left-0 pointer-events-none z-[99998] will-change-transform flex items-center justify-center"
      >
        <div
          className={`rounded-full transition-[width,height,transform,opacity,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
            cursorKind === "pill"
              ? "scale-75 opacity-0"
              : cursorKind === "link"
              ? effectiveDark
                ? "w-10 h-10 bg-white/50"
                : "w-10 h-10 bg-[#0c0c0c]/55"
              : effectiveDark
              ? `w-2.5 h-2.5 bg-white ${isPressed ? "scale-75" : "scale-100"}`
              : `w-2.5 h-2.5 bg-[#0c0c0c] ${isPressed ? "scale-75" : "scale-100"}`
          }`}
        />
      </div>

      {/* Floating Pill Badge when hovering cards */}
      <div
        ref={pillRef}
        data-ui="cursor-pill"
        className="fixed top-0 left-0 pointer-events-none z-[99999] will-change-transform flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0c0c0c] text-white text-[11px] uppercase tracking-[0.03em] border border-white/15 select-none"
      >
        <ThreePixelEye />
        <span className="whitespace-nowrap font-medium leading-none">
          {pillText}
        </span>
      </div>
    </>
  );
}
