"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface CustomCursorProps {
  isDark?: boolean;
}

export default function CustomCursor({ isDark = false }: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [pillText, setPillText] = useState<string>("");
  const [isHoveringCard, setIsHoveringCard] = useState<boolean>(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      autoAlpha: 0,
    });

    // Exact Elliot Eriksson easing curve and duration: power3 with 0.38s smooth follow
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.38, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.38, ease: "power3" });

    let hasPositioned = false;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;

      if (!hasPositioned) {
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        gsap.to(cursor, { autoAlpha: 1, duration: 0.25 });
        hasPositioned = true;
      }

      xTo(e.clientX);
      yTo(e.clientY);

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const card = target?.closest("[data-cursor]");
      const interactive = target?.closest('a, button, [role="button"], input, label');

      if (card) {
        const text = card.getAttribute("data-cursor") || "MEMBER";
        setPillText(text);
        setIsHoveringCard(true);
        setIsHoveringInteractive(false);
      } else if (interactive) {
        setIsHoveringCard(false);
        setIsHoveringInteractive(true);
      } else {
        setIsHoveringCard(false);
        setIsHoveringInteractive(false);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (dotRef.current) {
        gsap.to(dotRef.current, { scale: 0.75, duration: 0.15 });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (dotRef.current) {
        gsap.to(dotRef.current, { scale: 1, duration: 0.2, ease: "back.out(2)" });
      }
    };

    const handlePointerLeave = () => {
      gsap.to(cursor, { autoAlpha: 0, duration: 0.2 });
      hasPositioned = false;
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
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform"
    >
      {/* Default Soft Dot / Glass Expansion */}
      {!isHoveringCard && (
        <div
          ref={dotRef}
          className={`rounded-full transition-all duration-300 ease-out will-change-transform ${
            isHoveringInteractive
              ? isDark
                ? "w-8 h-8 border border-white/80 bg-white/10 backdrop-blur-[2px]"
                : "w-8 h-8 border border-[#0c0c0c]/80 bg-[#0c0c0c]/5 backdrop-blur-[2px]"
              : isDark
              ? "w-2.5 h-2.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
              : "w-2.5 h-2.5 bg-[#0c0c0c] shadow-[0_0_0_1px_rgba(255,255,255,0.7)]"
          }`}
        />
      )}

      {/* Floating Pill Badge when hovering cards */}
      {isHoveringCard && (
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c0c0c] text-white font-mono text-[10px] uppercase tracking-[0.06em] shadow-[0_8px_24px_rgba(0,0,0,0.22)] border border-white/10 select-none animate-in fade-in zoom-in-95 duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="whitespace-nowrap font-medium">{pillText}</span>
        </div>
      )}
    </div>
  );
}
