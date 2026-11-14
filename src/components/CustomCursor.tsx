"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface CustomCursorProps {
  isDark?: boolean;
}

function PixelEye({ className = "w-[14px] h-[7px] shrink-0" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 4"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <path d="M1 0h6v1h-6zM0 1h1v1h-1zM3 1h2v1h-2zM7 1h1v1h-1zM1 2h1v1h-1zM3 2h2v1h-2zM6 2h1v1h-1zM2 3h4v1h-4z" />
    </svg>
  );
}

export default function CustomCursor({ isDark = false }: CustomCursorProps) {
  const dotWrapRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [pillText, setPillText] = useState<string>("VIEW CASE");
  const [cursorKind, setCursorKind] = useState<"default" | "link" | "pill">("default");
  const [isPressed, setIsPressed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const dotWrap = dotWrapRef.current;
    const pill = pillRef.current;
    if (!dotWrap || !pill) return;

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

    // Exact Elliot Eriksson easing curve & duration
    const dotXTo = gsap.quickTo(dotWrap, "x", { duration: 0.42, ease: "power3" });
    const dotYTo = gsap.quickTo(dotWrap, "y", { duration: 0.42, ease: "power3" });
    const pillXTo = gsap.quickTo(pill, "x", { duration: 0.42, ease: "power3" });
    const pillYTo = gsap.quickTo(pill, "y", { duration: 0.42, ease: "power3" });

    let hasPositioned = false;
    let currentCard: Element | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;

      if (!hasPositioned) {
        gsap.set([dotWrap, pill], { x: e.clientX, y: e.clientY });
        gsap.to(dotWrap, { autoAlpha: 1, duration: 0.25 });
        hasPositioned = true;
      }

      dotXTo(e.clientX);
      dotYTo(e.clientY);
      pillXTo(e.clientX);
      pillYTo(e.clientY);

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const card = target?.closest("[data-cursor]");
      const interactive = target?.closest('a, button, [role="button"], input, label, .nav-item');

      if (card) {
        const text = card.getAttribute("data-cursor") || "VIEW CASE";
        if (card !== currentCard) {
          currentCard = card;
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
        if (currentCard) {
          currentCard = null;
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
      currentCard = null;
      setCursorKind("default");
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <>
      {/* Default Soft Dot / Circular Translucent Lens on Link Hover */}
      <div
        ref={dotWrapRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] will-change-transform flex items-center justify-center"
      >
        <div
          className={`rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
            cursorKind === "pill"
              ? "scale-0 opacity-0"
              : cursorKind === "link"
              ? isDark
                ? "w-10 h-10 bg-white/60 shadow-[0_0_0_1px_rgba(0,0,0,0.3)] backdrop-blur-[1px]"
                : "w-10 h-10 bg-[#0c0c0c]/60 shadow-[0_0_0_1px_rgba(255,255,255,0.7)] backdrop-blur-[1px]"
              : isDark
              ? `w-2.5 h-2.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)] ${
                  isPressed ? "scale-75" : "scale-100"
                }`
              : `w-2.5 h-2.5 bg-[#0c0c0c] shadow-[0_0_0_1px_rgba(255,255,255,0.7)] ${
                  isPressed ? "scale-75" : "scale-100"
                }`
          }`}
        />
      </div>

      {/* Floating Pill Badge when hovering cards (Exact match to Elliot Eriksson) */}
      <div
        ref={pillRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#0c0c0c] text-white font-mono text-[11px] uppercase tracking-[0.02em] shadow-[0_8px_24px_rgba(0,0,0,0.25)] border border-white/10 select-none"
      >
        <PixelEye className="w-[14px] h-[7px] text-white shrink-0" />
        <span className="whitespace-nowrap font-medium leading-none">
          {pillText}
        </span>
      </div>
    </>
  );
}
