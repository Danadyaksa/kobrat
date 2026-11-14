"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor({ isDark = false }: { isDark?: boolean }) {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let animId: number;
    let isVisible = false;

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        currentX = mouseX;
        currentY = mouseY;
        if (cursorRef.current) {
          cursorRef.current.style.opacity = "1";
        }
      }
    }

    function handleMouseLeave() {
      isVisible = false;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
      }
    }

    function render() {
      if (isVisible && cursorRef.current) {
        currentX += (mouseX - currentX) * 0.18;
        currentY += (mouseY - currentY) * 0.18;
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      animId = requestAnimationFrame(render);
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 w-3.5 h-3.5 rounded-full border pointer-events-none z-[9999] opacity-0 transition-opacity duration-300 will-change-transform ${
        isDark ? "border-white/80" : "border-[#0c0c0c]/80"
      }`}
      style={{
        boxShadow: isDark
          ? "0 0 8px rgba(255, 255, 255, 0.2)"
          : "0 0 8px rgba(0, 0, 0, 0.15)",
      }}
    />
  );
}
