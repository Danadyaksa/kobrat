"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ThreePixelEye from "./ThreePixelEye";
import { usePageTransition } from "./PageTransition";

interface CustomCursorProps {
  isDark?: boolean;
}

export default function CustomCursor({ isDark = false }: CustomCursorProps) {
  const { isTransitioning, introSeen } = usePageTransition();
  const [isHomePreloader, setIsHomePreloader] = useState(false);
  const dotWrapRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const currentCardRef = useRef<Element | null>(null);
  const [pillText, setPillText] = useState<string>("VIEW PROFILE");
  const [cursorKind, setCursorKind] = useState<"default" | "link" | "pill">("default");
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [isFinePointer, setIsFinePointer] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsFinePointer(media.matches);
    const handler = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
    media.addEventListener?.("change", handler);
    return () => media.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHomePreloader(window.location.pathname === "/" && !introSeen);
    }
  }, [introSeen]);

  // During transition or home preloader, screen is dark: force white dot
  const effectiveDark = isDark || isTransitioning || isHomePreloader;

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
      const isInput = target?.closest('input, textarea, select, [contenteditable="true"]');
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

      const card = target?.closest("[data-cursor]");
      const interactive = target?.closest('a, button, [role="button"], label, .nav-item');

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
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  if (!isFinePointer) return null;

  return (
    <>
      {/* Default Soft Dot / Circular Translucent Lens on Link Hover */}
      <div
        ref={dotWrapRef}
        style={{ visibility: "hidden" }}
        className="fixed top-0 left-0 pointer-events-none z-[99998] will-change-transform hidden md:flex items-center justify-center opacity-0"
      >
        <div
          className={`rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
            cursorKind === "pill"
              ? "scale-0 opacity-0"
              : cursorKind === "link"
              ? effectiveDark
                ? "w-10 h-10 bg-white/60 shadow-[0_0_0_1px_rgba(0,0,0,0.3)] backdrop-blur-[1px]"
                : "w-10 h-10 bg-[#0c0c0c]/60 shadow-[0_0_0_1px_rgba(255,255,255,0.7)] backdrop-blur-[1px]"
              : effectiveDark
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
        style={{ visibility: "hidden" }}
        className="fixed top-0 left-0 pointer-events-none z-[99999] will-change-transform hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0c0c0c] text-white font-mono text-[11px] uppercase tracking-[0.02em] shadow-[0_8px_24px_rgba(0,0,0,0.25)] border border-white/10 select-none opacity-0"
      >
        <ThreePixelEye />
        <span className="whitespace-nowrap font-medium leading-none">
          {pillText}
        </span>
      </div>
    </>
  );
}
